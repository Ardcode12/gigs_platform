"""Society authority portal API."""
from datetime import datetime, timezone, timedelta
import secrets
from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import func, select
from app.core.deps import CurrentAuthority, CurrentFederation, DbSession
from app.core.security import hash_password
from app.models import (AuthorityAuditLog, AuthorityDocument, AuthorityInspection, GpsRequest, Job, JobStatus, JobStatusEvent, NotificationType, Payment, PaymentMethod,
    PaymentStatus, Rating, Society, SocietyComplaint, SocietyRate, WelfareEnrollment, Worker, WorkerAdvance)
from app.schemas.authority import AuthorityPayload, BulkAssignment, ComplaintPayload, IdPayload, RatePayload, StatusPayload, TextPayload, SocietyCreatePayload
from app.services.notify import notify, notify_customer

router = APIRouter(prefix="/api", tags=["authority"])


@router.post("/federation/societies", status_code=201)
def create_society(payload: SocietyCreatePayload, federation: CurrentFederation, db: DbSession):
    exists = db.scalar(select(Society).where(func.lower(Society.society_code) == payload.societyCode.lower()))
    if exists:
        raise HTTPException(409, "Society code already exists")
    status = payload.status or "active"
    is_active = payload.isActive if payload.isActive is not None else (status in {"active", "approved"})
    society = Society(
        name=payload.name,
        city=payload.city,
        society_code=payload.societyCode,
        password_hash=hash_password(payload.password),
        is_active=is_active,
        status=status,
        registration_number=payload.registrationNumber,
        registration_expiry=datetime.fromisoformat(payload.registrationExpiry) if payload.registrationExpiry else None,
        settings={key: value for key, value in payload.model_dump().items() if key not in {"name", "city", "societyCode", "password", "registrationNumber", "registrationExpiry", "status", "isActive"} and value is not None},
    )
    db.add(society)
    db.commit()
    db.refresh(society)
    _audit(db, federation, "society_created", "societies", "society", society.id)
    db.commit()
    return {"society": {"id": society.id, "societyCode": society.society_code, "name": society.name, "city": society.city, "status": society.status, "isActive": society.is_active}}


@router.get("/federation/societies")
def list_societies(federation: CurrentFederation, db: DbSession):
    rows = db.scalars(select(Society).order_by(Society.name)).all()
    return {"societies": [{"id": s.id, "societyCode": s.society_code, "name": s.name, "city": s.city, "isActive": s.is_active, "status": s.status, "registrationNumber": s.registration_number, "registrationExpiry": s.registration_expiry, **(s.settings or {})} for s in rows]}


@router.get("/federation/me")
def federation_me(federation: CurrentFederation):
    """Who the federation token belongs to.

    The portal calls this on a page refresh to restore the session -- without it
    a reload would drop the officer back to the login screen. /authority/me is
    the society equivalent and rejects federation tokens, so the two are separate.
    """
    return {
        "federation": {
            "id": federation.id,
            "email": federation.email,
            "name": federation.name,
            "role": "federation",
        }
    }

@router.get("/federation/dashboard")
def federation_dashboard(federation: CurrentFederation, db: DbSession):
    total_societies = db.scalar(select(func.count()).select_from(Society)) or 0
    active_societies = db.scalar(select(func.count()).select_from(Society).where(Society.is_active.is_(True))) or 0
    pending_societies = db.scalar(select(func.count()).select_from(Society).where(Society.status.in_(["submitted", "under_review"]))) or 0

    total_workers = db.scalar(select(func.count()).select_from(Worker)) or 0
    verified_workers = db.scalar(select(func.count()).select_from(Worker).where(Worker.kyc_status == "active")) or 0
    pending_workers = db.scalar(select(func.count()).select_from(Worker).where(Worker.kyc_status.in_(["pending", "verifying"]))) or 0

    total_bookings = db.scalar(select(func.count()).select_from(Job)) or 0
    transaction_value = db.scalar(select(func.sum(Job.base_amount))) or 0

    open_complaints = db.scalar(select(func.count()).select_from(SocietyComplaint).where(SocietyComplaint.status.not_in(["resolved", "closed"]))) or 0
    
    pending_welfare = db.scalar(select(func.count()).select_from(WelfareEnrollment).where(WelfareEnrollment.status.in_(["submitted", "under_review"]))) or 0
    pending_documents = db.scalar(select(func.count()).select_from(AuthorityDocument).where(AuthorityDocument.status.in_(["pending", "correction_required"]))) or 0

    return {"dashboard": {
        "totalSocieties": total_societies,
        "activeSocieties": active_societies,
        "pendingApprovals": pending_societies,
        "totalWorkers": total_workers,
        "verifiedWorkers": verified_workers,
        "pendingWorkers": pending_workers,
        "totalBookings": total_bookings,
        "transactionValue": float(transaction_value),
        "openComplaints": open_complaints,
        "pendingWelfare": pending_welfare,
        "pendingDocuments": pending_documents,
    }}

@router.get("/federation/workers")
def federation_workers(federation: CurrentFederation, db: DbSession, search: str | None = None, status: str | None = None):
    stmt = select(Worker, Society.name.label("society_name"), Society.society_code.label("society_code")).outerjoin(Society, Worker.society_id == Society.id).order_by(Worker.name)
    if search:
        needle = f"%{search.lower()}%"
        stmt = stmt.where(func.lower(Worker.name).like(needle) | func.lower(Worker.worker_code).like(needle))
    if status:
        stmt = stmt.where(Worker.kyc_status == status)
    
    rows = db.execute(stmt).all()
    
    return {"workers": [{"id": worker.id, "uniqueId": worker.worker_code, "name": worker.name, "city": worker.city, "skills": worker.skills or [], "category": _worker_json(worker).get("category"), "rating": float(worker.rating_avg or 0), "completedJobs": worker.completed_jobs, "kycStatus": worker.kyc_status, "authorityStatus": worker.authority_status, "authorityReason": worker.authority_reason, "authorityVerifiedAt": worker.authority_verified_at, "certificateId": (worker.authority_data or {}).get("certId") or (worker.authority_data or {}).get("certificateId"), "certificateAuthority": (worker.authority_data or {}).get("certAuthority") or (worker.authority_data or {}).get("certificateAuthority"), "certificateExpiry": (worker.authority_data or {}).get("certificateExpiry"), "societyName": s_name, "societyCode": s_code} for worker, s_name, s_code in rows]}

def _audit(db, federation, action, module, entity_type, entity_id=None, reason=None, data=None):
    db.add(AuthorityAuditLog(actor_id=federation.id, action=action, module=module, entity_type=entity_type, entity_id=entity_id, reason=reason, data=data or {}))

@router.get("/federation/overview")
def federation_overview(federation: CurrentFederation, db: DbSession):
    return federation_dashboard(federation, db)

@router.patch("/federation/societies/{society_id}/status")
def update_society_status(society_id: int, payload: StatusPayload, federation: CurrentFederation, db: DbSession):
    society = db.get(Society, society_id)
    if society is None: raise HTTPException(404, "Society not found")
    allowed = {"submitted", "under_review", "correction_required", "documents_verified", "approved", "active", "suspended", "rejected", "expired"}
    if payload.status not in allowed: raise HTTPException(422, "Unsupported society status")
    society.status = payload.status
    society.is_active = payload.status in {"approved", "active"}
    society.status_reason = payload.get("reason")
    _audit(db, federation, f"society_{payload.status}", "societies", "society", society.id, payload.get("reason"))
    db.commit()
    return {"society": {"id": society.id, "name": society.name, "status": society.status, "isActive": society.is_active}}

@router.get("/federation/documents")
def federation_documents(federation: CurrentFederation, db: DbSession, status: str | None = None):
    stmt = select(AuthorityDocument).order_by(AuthorityDocument.created_at.desc())
    rows = db.scalars(stmt).all()
    if status: rows = [row for row in rows if row.status == status]
    return {"documents": [{"id": row.id, "societyId": row.society_id, "workerId": row.worker_id, "name": row.name, "category": row.category, "status": row.status, "expiresAt": row.expires_at, "reason": row.reason} for row in rows]}

@router.patch("/federation/documents/{document_id}/status")
def update_document_status(document_id: int, payload: StatusPayload, federation: CurrentFederation, db: DbSession):
    document = db.get(AuthorityDocument, document_id)
    if document is None: raise HTTPException(404, "Document not found")
    if payload.status not in {"pending", "verified", "rejected", "expired", "correction_required"}: raise HTTPException(422, "Unsupported document status")
    document.status = payload.status; document.reason = payload.get("reason")
    _audit(db, federation, f"document_{payload.status}", "compliance", "document", document.id, document.reason)
    db.commit(); return {"document": {"id": document.id, "status": document.status, "reason": document.reason}}

@router.post("/federation/workers/{worker_id}/verify")
def verify_federation_worker(worker_id: int, federation: CurrentFederation, db: DbSession):
    worker = db.get(Worker, worker_id)
    if worker is None: raise HTTPException(404, "Worker not found")
    worker.authority_status = "verified"; worker.authority_reason = None; worker.authority_verified_at = datetime.now(timezone.utc)
    _audit(db, federation, "worker_verified", "workforce", "worker", worker.id)
    db.commit(); return {"worker": _worker_json(worker)}

@router.post("/federation/workers/{worker_id}/reject")
def reject_federation_worker(worker_id: int, payload: TextPayload, federation: CurrentFederation, db: DbSession):
    worker = db.get(Worker, worker_id)
    if worker is None: raise HTTPException(404, "Worker not found")
    worker.authority_status = "rejected"; worker.authority_reason = payload.reason
    _audit(db, federation, "worker_rejected", "workforce", "worker", worker.id, payload.reason)
    db.commit(); return {"worker": _worker_json(worker)}

@router.get("/federation/complaints")
def federation_complaints(federation: CurrentFederation, db: DbSession, status: str | None = None):
    rows = db.scalars(select(SocietyComplaint).order_by(SocietyComplaint.created_at.desc())).all()
    if status: rows = [row for row in rows if row.status == status]
    return {"complaints": [{**_complaint_json(row, db), "societyId": row.society_id} for row in rows]}

@router.get("/federation/societies/{society_id}")
def federation_society_detail(society_id: int, federation: CurrentFederation, db: DbSession):
    society = db.get(Society, society_id)
    if society is None: raise HTTPException(404, "Society not found")
    workers = db.scalars(select(Worker).where(Worker.society_id == society.id)).all()
    jobs = db.scalars(select(Job).where(Job.society_id == society.id)).all()
    return {"society": {"id": society.id, "name": society.name, "city": society.city, "societyCode": society.society_code, "status": society.status, "isActive": society.is_active, "registrationNumber": society.registration_number, "registrationExpiry": society.registration_expiry, "details": society.settings or {}, "workerCount": len(workers), "bookingCount": len(jobs)}}

@router.get("/federation/notifications")
def federation_notifications(federation: CurrentFederation, db: DbSession):
    logs = db.scalars(select(AuthorityAuditLog).order_by(AuthorityAuditLog.created_at.desc()).limit(20)).all()
    return {"notifications": [{"id": row.id, "title": row.action.replace("_", " ").title(), "body": row.reason or f"{row.entity_type} #{row.entity_id}", "createdAt": row.created_at, "read": False} for row in logs]}

@router.post("/federation/welfare/{enrollment_id}/review")
def review_welfare(enrollment_id: int, payload: StatusPayload, federation: CurrentFederation, db: DbSession):
    enrollment = db.get(WelfareEnrollment, enrollment_id)
    if enrollment is None: raise HTTPException(404, "Welfare application not found")
    if payload.status not in {"under_review", "approved", "rejected", "correction_required"}: raise HTTPException(422, "Unsupported welfare status")
    enrollment.status = payload.status; enrollment.federation_reason = payload.get("reason"); enrollment.reviewed_by = federation.id; enrollment.reviewed_at = datetime.now(timezone.utc)
    _audit(db, federation, f"welfare_{payload.status}", "welfare", "enrollment", enrollment.id, enrollment.federation_reason)
    db.commit(); return {"enrollment": {"id": enrollment.id, "status": enrollment.status, "reason": enrollment.federation_reason}}

@router.patch("/federation/complaints/{complaint_id}/status")
def federation_complaint_status(complaint_id: int, payload: StatusPayload, federation: CurrentFederation, db: DbSession):
    complaint = db.get(SocietyComplaint, complaint_id)
    if complaint is None: raise HTTPException(404, "Complaint not found")
    if payload.status not in {"open", "assigned", "under_investigation", "resolved", "escalated", "closed", "rejected"}: raise HTTPException(422, "Unsupported complaint status")
    complaint.status = payload.status
    complaint.data = {**(complaint.data or {}), "authorityReason": payload.get("reason")}
    _audit(db, federation, f"complaint_{payload.status}", "complaints", "complaint", complaint.id, payload.get("reason"))
    db.commit(); return {"complaint": _complaint_json(complaint, db)}

@router.get("/federation/inspections")
def federation_inspections(federation: CurrentFederation, db: DbSession):
    rows = db.scalars(select(AuthorityInspection).order_by(AuthorityInspection.created_at.desc())).all()
    return {"inspections": [{"id": row.id, "societyId": row.society_id, "type": row.inspection_type, "purpose": row.purpose, "scheduledAt": row.scheduled_at, "result": row.result, "notes": row.notes} for row in rows]}

@router.post("/federation/inspections", status_code=201)
def create_inspection(payload: AuthorityPayload, federation: CurrentFederation, db: DbSession):
    society = db.get(Society, int(payload.get("societyId") or 0))
    if society is None: raise HTTPException(404, "Society not found")
    inspection = AuthorityInspection(society_id=society.id, officer_id=federation.id, inspection_type=str(payload.get("type") or "routine"), purpose=str(payload.get("purpose") or "Review"), notes=payload.get("notes"), data=dict(payload))
    db.add(inspection); db.flush(); _audit(db, federation, "inspection_created", "inspections", "inspection", inspection.id); db.commit(); db.refresh(inspection)
    return {"inspection": {"id": inspection.id, "societyId": inspection.society_id, "result": inspection.result}}

@router.get("/federation/audit-logs")
def federation_audit_logs(federation: CurrentFederation, db: DbSession):
    rows = db.scalars(select(AuthorityAuditLog).order_by(AuthorityAuditLog.created_at.desc()).limit(200)).all()
    return {"logs": [{"id": row.id, "action": row.action, "module": row.module, "entityType": row.entity_type, "entityId": row.entity_id, "reason": row.reason, "createdAt": row.created_at} for row in rows]}

@router.get("/federation/bookings")
def federation_bookings(federation: CurrentFederation, db: DbSession, status: str | None = None):
    stmt = select(Job, Society.name.label("society_name")).outerjoin(Society, Job.society_id == Society.id).order_by(Job.requested_at.desc())
    rows = db.execute(stmt).all()
    
    result = []
    for job, s_name in rows:
        if status and not (job.status.value == status or (status == "pending" and job.status == JobStatus.REQUESTED)):
            continue
        # Enforce Privacy: Do not return customer personal info, worker name, or exact amount
        result.append({
            "id": job.id, 
            "society": s_name, 
            "service": job.service_type, 
            "status": job.status.value, 
            "requestedAt": job.requested_at
        })
    return {"bookings": result}

@router.get("/federation/financials")
def federation_financials(federation: CurrentFederation, db: DbSession):
    payments = db.scalars(select(Payment)).all()
    return {"financials": {"transactionValue": sum(float(row.total_amount) for row in payments), "completedTransactions": sum(row.status == PaymentStatus.PAID for row in payments), "pendingPayments": sum(row.status == PaymentStatus.PENDING for row in payments), "paymentCount": len(payments)}}

@router.get("/federation/welfare")
def federation_welfare(federation: CurrentFederation, db: DbSession):
    total_workers = db.scalar(select(func.count()).select_from(Worker)) or 0
    enrollments = db.scalars(select(WelfareEnrollment)).all()
    
    worker_rows = db.execute(select(Worker.id, Worker.name, Worker.worker_code, Worker.society_id)).all()
    workers = {w.id: w for w in worker_rows}
    
    society_rows = db.execute(select(Society.id, Society.name)).all()
    societies = {s.id: s for s in society_rows}
    
    covered = len({row.worker_id for row in enrollments})
    not_covered = total_workers - covered
    
    enrollment_list = [{
        "id": row.id, 
        "workerId": row.worker_id, 
        "workerName": getattr(workers.get(row.worker_id), 'name', 'Unknown'), 
        "societyName": getattr(societies.get(row.society_id), 'name', 'Unknown'), 
        "schemeId": row.scheme_id, 
        "status": row.status, 
        "reason": row.federation_reason, 
        "data": row.data, 
        "createdAt": row.created_at
    } for row in enrollments]
    
    return {"welfare": {"totalWorkers": total_workers, "covered": covered, "notCovered": not_covered, "enrollments": enrollment_list}}

@router.get("/federation/quality")
def federation_quality(federation: CurrentFederation, db: DbSession):
    ratings = db.scalars(select(Rating)).all()
    jobs = db.execute(select(Job.id, Job.status, Job.society_id)).all()
    complaints = db.execute(select(SocietyComplaint.id, SocietyComplaint.status, SocietyComplaint.society_id)).all()
    
    society_rows = db.execute(select(Society.id, Society.name)).all()
    
    by_society = {}
    for s_id, s_name in society_rows:
        by_society[s_id] = {"societyId": s_id, "societyName": s_name, "averageRating": 0, "ratingCount": 0, "completed": 0, "cancelled": 0, "complaints": 0}
        
    job_society_map = {j.id: j.society_id for j in jobs}
    for r in ratings:
        soc_id = job_society_map.get(r.job_id)
        if soc_id in by_society:
            by_society[soc_id]["ratingCount"] += 1
            by_society[soc_id]["averageRating"] += r.stars
            
    for j in jobs:
        if j.society_id in by_society:
            if j.status == JobStatus.COMPLETED: by_society[j.society_id]["completed"] += 1
            elif j.status == JobStatus.CANCELLED: by_society[j.society_id]["cancelled"] += 1
            
    for c in complaints:
        if c.society_id in by_society:
            by_society[c.society_id]["complaints"] += 1
            
    society_list = []
    for s_id, data in by_society.items():
        if data["ratingCount"] > 0:
            data["averageRating"] = round(data["averageRating"] / data["ratingCount"], 2)
        society_list.append(data)
        
    return {"quality": {
        "averageRating": round(sum(r.stars for r in ratings) / len(ratings), 2) if ratings else 0,
        "ratingCount": len(ratings),
        "completedBookings": sum(j.status == JobStatus.COMPLETED for j in jobs),
        "cancelledBookings": sum(j.status == JobStatus.CANCELLED for j in jobs),
        "complaintCount": len(complaints),
        "openComplaints": sum(c.status not in {"resolved", "closed"} for c in complaints),
        "bySociety": society_list
    }}

@router.get("/federation/analytics")
def federation_analytics(federation: CurrentFederation, db: DbSession):
    workers = db.scalars(select(Worker)).all(); jobs = db.scalars(select(Job)).all()
    by_skill = {}
    for worker in workers:
        for skill in worker.skills or []: by_skill[skill] = by_skill.get(skill, 0) + 1
    by_service = {}
    for job in jobs: by_service[job.service_type] = by_service.get(job.service_type, 0) + 1
    return {"analytics": {"skills": [{"name": key, "workers": value} for key, value in sorted(by_skill.items())], "services": [{"name": key, "bookings": value} for key, value in sorted(by_service.items())], "locations": [{"city": worker.city, "workers": 1} for worker in workers if worker.city]}}

@router.get("/federation/search")
def federation_search(q: str, federation: CurrentFederation, db: DbSession):
    needle = q.strip().lower()
    societies = db.scalars(select(Society)).all(); workers = db.scalars(select(Worker)).all(); jobs = db.scalars(select(Job)).all(); complaints = db.scalars(select(SocietyComplaint)).all()
    return {"results": [{"type": "society", "id": row.id, "label": row.name, "meta": row.society_code} for row in societies if needle in row.name.lower() or needle in (row.society_code or "").lower()] + [{"type": "worker", "id": row.id, "label": row.name, "meta": row.worker_code} for row in workers if needle in row.name.lower() or needle in row.worker_code.lower()] + [{"type": "booking", "id": row.id, "label": f"Booking #{row.id}", "meta": row.service_type} for row in jobs if needle in str(row.id) or needle in row.service_type.lower()] + [{"type": "complaint", "id": row.id, "label": row.title, "meta": row.status} for row in complaints if needle in row.title.lower()]}

@router.get("/federation/reports/{report_type}")
def federation_report(report_type: str, federation: CurrentFederation, db: DbSession):
    allowed = {"societies", "workers", "bookings", "financials", "welfare", "complaints", "quality"}
    if report_type not in allowed: raise HTTPException(404, "Report not found")
    if report_type == "financials": return federation_financials(federation, db)
    if report_type == "welfare": return federation_welfare(federation, db)
    if report_type == "quality": return federation_quality(federation, db)
    if report_type == "bookings": return federation_bookings(federation, db)
    if report_type == "complaints": return federation_complaints(federation, db)
    if report_type == "workers": return federation_workers(federation, db)
    return {"societies": federation_dashboard(federation, db)}


@router.get("/authority/me")
def authority_me(society: CurrentAuthority):
    return {
        "authority": {
            "id": society.id,
            "societyCode": society.society_code,
            "name": society.name,
            "city": society.city,
            "role": "society",
        }
    }

def _worker(db, society, worker_id):
    w = db.get(Worker, worker_id)
    if w is None or w.society_id != society.id:
        raise HTTPException(404, "Worker not found")
    return w

def _job(db, society, job_id):
    job = db.get(Job, job_id)
    if job is None or job.society_id != society.id:
        raise HTTPException(404, "Booking not found")
    return job

def _worker_json(w):
    authority_data = w.authority_data or {}
    category = authority_data.get("category") or ((w.skills or [None])[0])
    category = str(category).strip().lower().replace(" ", "_") if category else None
    category = {"electrical": "electrician", "plumbing": "plumber", "carpentry": "carpenter"}.get(category, category)
    data = {"id": w.id, "uniqueId": w.worker_code, "worker_code": w.worker_code, "name": w.name,
            "phone": w.phone, "city": w.city, "skills": w.skills or [], "photoUrl": w.photo_url,
            "is_available": w.is_available, "availability": "available" if w.is_available else "offline",
            "rating": float(w.rating_avg or 0), "rating_avg": float(w.rating_avg or 0), "completedJobs": w.completed_jobs,
            "lastLat": w.last_lat, "lastLng": w.last_lng,
            "age": authority_data.get("age"), "address": authority_data.get("address") or w.city,
            "category": category,
            "bankAccountNo": authority_data.get("bankAccountNo"), "bankIfsc": authority_data.get("bankIfsc"),
            "bankName": authority_data.get("bankName"),
            "kycStatus": w.kyc_status, "kyc_status": w.kyc_status, "kycMethod": w.kyc_method,
            "kycRefs": w.kyc_refs or [], "kyc_reason": w.kyc_reason,
            "authorityStatus": w.authority_status, "authorityReason": w.authority_reason,
            "authorityVerifiedAt": w.authority_verified_at,
            "certificateId": authority_data.get("certId") or authority_data.get("certificateId"),
            "certificateAuthority": authority_data.get("certAuthority") or authority_data.get("certificateAuthority"),
            "certificateEvidence": authority_data.get("certificateEvidence"),
            "certificateExpiry": authority_data.get("certificateExpiry")}
    data.update(w.authority_data or {})
    return data

def _booking_json(j):
    status = {JobStatus.REQUESTED: "pending", JobStatus.ACCEPTED: "dispatched", JobStatus.WORK_STARTED: "in_progress"}.get(j.status, j.status.value)
    team_ids = j.team_worker_ids or ([j.worker_id] if j.worker_id else [])
    payment = getattr(j, "payment", None)
    service_category = j.service_type.strip().lower().replace(" ", "_") if j.service_type else "other"
    return {"id": j.id, "serviceCategory": service_category, "service_type": j.service_type, "status": status,
            "customerName": j.customer.name if j.customer else None, "customerPhone": j.customer.phone if j.customer else None,
            "customerAddress": j.address, "address": j.address, "description": j.work_details,
            "lat": j.lat, "lng": j.lng,
            "estimatedAmount": float(j.base_amount), "assignedWorker": j.worker_id,
            "assignedWorkers": team_ids, "teamLead": j.team_lead_id or j.worker_id,
            "type": "bulk" if len(team_ids) > 1 else "single", "teamSize": len(team_ids),
            "paymentStatus": payment.status.value if payment else "pending",
            "requestedAt": j.requested_at, "acceptedAt": j.accepted_at}

@router.get("/society/dashboard")
def dashboard(society: CurrentAuthority, db: DbSession):
    workers = db.scalar(select(func.count()).select_from(Worker).where(Worker.society_id == society.id)) or 0
    jobs = db.scalars(select(Job).where(Job.society_id == society.id)).all()
    now = datetime.now(timezone.utc)
    today = now.date()
    week_start = today - timedelta(days=6)
    today_jobs = [j for j in jobs if j.requested_at and j.requested_at.date() == today]
    weekly = []
    for offset in range(7):
        day = week_start + timedelta(days=offset)
        weekly.append({"date": day.isoformat(), "amount": sum(float(j.base_amount) for j in jobs if j.status == JobStatus.COMPLETED and j.completed_at and j.completed_at.date() == day)})
    return {"dashboard": {"totalWorkers": workers, "totalBookings": len(jobs), "todayBookings": len(today_jobs),
        "todayEarnings": sum(float(j.base_amount) for j in today_jobs if j.status == JobStatus.COMPLETED),
        "pendingBookings": sum(j.status == JobStatus.REQUESTED for j in jobs), "weeklyEarnings": weekly}}

@router.get("/society/settings")
def get_settings(society: CurrentAuthority):
    settings = society.settings or {}
    return {"settings": {"emergencySurcharge": settings.get("emergencySurcharge", True), "nightSurcharge": settings.get("nightSurcharge", True)}}

@router.put("/society/settings")
def update_settings(payload: AuthorityPayload, society: CurrentAuthority, db: DbSession):
    current = dict(society.settings or {})
    for key in ("emergencySurcharge", "nightSurcharge"):
        if key in payload.model_extra:
            current[key] = bool(payload.model_extra[key])
    society.settings = current
    db.commit()
    return {"settings": {"emergencySurcharge": current.get("emergencySurcharge", True), "nightSurcharge": current.get("nightSurcharge", True)}}

@router.get("/society/workers")
def list_workers(society: CurrentAuthority, db: DbSession, search: str | None = None):
    rows = db.scalars(select(Worker).where(Worker.society_id == society.id).order_by(Worker.worker_code)).all()
    if search:
        needle = search.lower(); rows = [w for w in rows if needle in w.name.lower() or needle in w.worker_code.lower() or needle in w.phone]
    return {"workers": [_worker_json(w) for w in rows]}

@router.get("/society/workers/{worker_id}")
def get_worker(worker_id: int, society: CurrentAuthority, db: DbSession): return {"worker": _worker_json(_worker(db, society, worker_id))}

@router.post("/society/workers/register", status_code=201)
def register_worker(payload: AuthorityPayload, society: CurrentAuthority, db: DbSession):
    code = str(payload.get("workerCode") or payload.get("uniqueId") or f"W{secrets.randbelow(900000) + 100000}")
    # Always use the standard default password so every worker knows how to first log in.
    DEFAULT_WORKER_PASSWORD = "worker123"
    w = Worker(society_id=society.id, worker_code=code, name=str(payload.get("name", "Worker")),
        phone=str(payload.get("phone", "0000000000")), password_hash=hash_password(DEFAULT_WORKER_PASSWORD),
        city=payload.get("city") or payload.get("address"),
        skills=payload.get("skills") or ([payload.get("category")] if payload.get("category") else []),
        photo_url=payload.get("photoUrl"), kyc_method=payload.get("kycMethod"),
        kyc_status="active" if payload.get("kycMethod") == "certificate" else "verifying",
        kyc_refs=payload.get("clientRefs") or [], authority_data=dict(payload),
        must_change_password=True)
    db.add(w); db.commit(); db.refresh(w)
    result = _worker_json(w)
    result["defaultPassword"] = DEFAULT_WORKER_PASSWORD
    return {"worker": result}

@router.post("/society/workers/{worker_id}/kyc/refs")
def kyc_refs(worker_id: int, payload: AuthorityPayload, society: CurrentAuthority, db: DbSession):
    w = _worker(db, society, worker_id); w.kyc_refs = payload.get("refs") or payload.get("clientRefs") or []
    w.kyc_status = "verifying"; db.commit(); return {"worker": _worker_json(w)}

@router.patch("/society/workers/{worker_id}/kyc/approve")
def approve_kyc(worker_id: int, society: CurrentAuthority, db: DbSession):
    w = _worker(db, society, worker_id); w.kyc_status = "active"; w.kyc_reason = None; db.commit(); return {"worker": _worker_json(w)}

@router.patch("/society/workers/{worker_id}/kyc/reject")
def reject_kyc(worker_id: int, payload: TextPayload, society: CurrentAuthority, db: DbSession):
    w = _worker(db, society, worker_id); w.kyc_status = "rejected"; w.kyc_reason = payload.reason; db.commit(); return {"worker": _worker_json(w)}

@router.get("/society/bookings")
def list_bookings(society: CurrentAuthority, db: DbSession, status: str | None = None):
    rows = db.scalars(select(Job).where(Job.society_id == society.id).order_by(Job.requested_at.desc())).all()
    if status: rows = [j for j in rows if j.status.value == status or (status == "pending" and j.status == JobStatus.REQUESTED)]
    return {"bookings": [_booking_json(j) for j in rows]}

@router.get("/society/bookings/incoming")
def incoming(society: CurrentAuthority, db: DbSession): return list_bookings(society, db, "pending")

@router.get("/society/bookings/{job_id}")
def get_booking(job_id: int, society: CurrentAuthority, db: DbSession): return {"booking": _booking_json(_job(db, society, job_id))}

@router.post("/society/bookings/{job_id}/assign")
def assign(job_id: int, payload: IdPayload, society: CurrentAuthority, db: DbSession):
    j = _job(db, society, job_id)
    if j.status != JobStatus.REQUESTED:
        raise HTTPException(409, "Only pending bookings can be assigned")
    w = _worker(db, society, payload.workerId or 0)
    j.worker_id = w.id
    j.team_worker_ids = [w.id]
    j.team_lead_id = w.id
    j.status = JobStatus.ACCEPTED
    j.accepted_at = datetime.now(timezone.utc)
    db.add(JobStatusEvent(job_id=j.id, status=j.status, note="Assigned by society"))
    notify(
        db,
        w.id,
        NotificationType.JOB_UPDATE,
        title=f"{j.service_type} request assigned to you",
        body=f"{j.customer.name} · {j.address}",
        data={"job_id": j.id, "status": j.status.value},
    )
    notify_customer(
        db,
        j.customer_id,
        NotificationType.JOB_UPDATE,
        title=f"{w.name} was assigned to your request",
        body=f"Your {j.service_type} booking is now assigned.",
        data={"job_id": j.id, "status": j.status.value, "worker_id": w.id},
    )
    db.commit()
    return {"booking": _booking_json(j)}

@router.post("/society/bookings/{job_id}/assign-bulk")
def assign_bulk(job_id: int, payload: BulkAssignment, society: CurrentAuthority, db: DbSession):
    if not payload.workerIds: raise HTTPException(422, "workerIds is required")
    j = _job(db, society, job_id)
    if j.status != JobStatus.REQUESTED:
        raise HTTPException(409, "Only pending bookings can be assigned")
    workers = [_worker(db, society, wid) for wid in payload.workerIds]
    lead = _worker(db, society, payload.leadId or payload.workerIds[0])
    j.worker_id = lead.id
    j.team_worker_ids = payload.workerIds
    j.team_lead_id = lead.id
    j.status = JobStatus.ACCEPTED
    j.accepted_at = datetime.now(timezone.utc)
    db.add(JobStatusEvent(job_id=j.id, status=j.status, note="Assigned by society"))
    for worker in workers:
        notify(
            db,
            worker.id,
            NotificationType.JOB_UPDATE,
            title=f"{j.service_type} request assigned to your team",
            body=f"{j.customer.name} · {j.address}",
            data={"job_id": j.id, "status": j.status.value, "lead_worker_id": lead.id},
        )
    notify_customer(
        db,
        j.customer_id,
        NotificationType.JOB_UPDATE,
        title=f"{lead.name} was assigned to your request",
        body=f"Your {j.service_type} booking is now assigned.",
        data={"job_id": j.id, "status": j.status.value, "worker_id": lead.id},
    )
    db.commit()
    return {"booking": _booking_json(j), "workerIds": payload.workerIds, "leadId": j.worker_id}

@router.patch("/society/bookings/{job_id}/status")
def booking_status(job_id: int, payload: StatusPayload, society: CurrentAuthority, db: DbSession):
    j = _job(db, society, job_id); raw = {"pending": JobStatus.REQUESTED, "dispatched": JobStatus.ACCEPTED, "in_progress": JobStatus.WORK_STARTED}.get(payload.status, payload.status)
    try: j.status = JobStatus(raw)
    except ValueError: raise HTTPException(422, "Unsupported booking status")
    if j.status == JobStatus.COMPLETED:
        j.completed_at = datetime.now(timezone.utc)
    db.add(JobStatusEvent(job_id=j.id, status=j.status, note="Updated by society"))
    notify_customer(
        db,
        j.customer_id,
        NotificationType.JOB_UPDATE,
        title=f"Your {j.service_type} booking status changed",
        body=f"Status: {j.status.value}",
        data={"job_id": j.id, "status": j.status.value},
    )
    if j.worker_id is not None:
        notify(
            db,
            j.worker_id,
            NotificationType.JOB_UPDATE,
            title=f"Booking #{j.id} status updated",
            body=f"Status: {j.status.value}",
            data={"job_id": j.id, "status": j.status.value},
        )
    db.commit(); return {"booking": _booking_json(j)}

@router.get("/society/payments")
def list_payments(society: CurrentAuthority, db: DbSession):
    rows = db.scalars(select(Payment).join(Worker).where(Worker.society_id == society.id).order_by(Payment.created_at.desc())).all()
    return {"payments": [{"id": p.id, "bookingId": p.job_id, "amount": float(p.total_amount), "status": p.society_status or ("cash_paid" if p.status == PaymentStatus.PAID and p.payment_method == PaymentMethod.CASH else p.status.value), "mode": p.payment_method.value, "customerName": p.job.customer.name if p.job and p.job.customer else None, "paidAt": p.paid_at or p.created_at} for p in rows]}

@router.get("/society/payments/{payment_id}")
def get_payment(payment_id: int, society: CurrentAuthority, db: DbSession):
    payment = db.get(Payment, payment_id)
    if payment is None or payment.job.worker is None or payment.job.worker.society_id != society.id:
        raise HTTPException(404, "Payment not found")
    return {"payment": {"id": payment.id, "bookingId": payment.job_id, "amount": float(payment.total_amount), "status": payment.society_status or payment.status.value, "mode": payment.payment_method.value}}

@router.post("/society/payments")
def record_payment(payload: AuthorityPayload, society: CurrentAuthority, db: DbSession):
    j = _job(db, society, int(payload.get("bookingId") or payload.get("job_id"))); w = _worker(db, society, int(payload.get("workerId") or j.worker_id or 0))
    p = db.scalar(select(Payment).where(Payment.job_id == j.id))
    if p is None: p = Payment(job_id=j.id, worker_id=w.id, base_amount=payload.get("amount", j.base_amount), total_amount=payload.get("amount", j.base_amount), payment_method=PaymentMethod.CASH); db.add(p)
    p.status = PaymentStatus.PAID; p.society_status = "cash_paid"; p.paid_at = datetime.now(timezone.utc); db.commit(); db.refresh(p); return {"payment": {"id": p.id, "bookingId": p.job_id, "amount": float(p.total_amount), "status": "cash_paid", "mode": "cash"}}

@router.patch("/society/payments/{payment_id}/status")
def payment_status(payment_id: int, payload: StatusPayload, society: CurrentAuthority, db: DbSession):
    p = db.get(Payment, payment_id)
    if p is None or p.job.worker.society_id != society.id: raise HTTPException(404, "Payment not found")
    p.status = PaymentStatus.PAID if payload.status != "pending" else PaymentStatus.PENDING
    p.society_status = payload.status if payload.status != "pending" else None
    p.paid_at = datetime.now(timezone.utc) if p.status == PaymentStatus.PAID else None
    db.commit(); return {"payment": {"id": p.id, "status": payload.status}}

@router.get("/society/rates")
def list_rates(society: CurrentAuthority, db: DbSession):
    rows = db.scalars(select(SocietyRate).where(SocietyRate.society_id == society.id).order_by(SocietyRate.category)).all()
    return {"rates": [{"id": r.id, "category": r.category, "baseRate": float(r.base_rate), "hourlyRate": float(r.hourly_rate), "dailyRate": float(r.daily_rate)} for r in rows]}

@router.put("/society/rates/{category}")
def update_rate(category: str, payload: RatePayload, society: CurrentAuthority, db: DbSession):
    r = db.scalar(select(SocietyRate).where(SocietyRate.society_id == society.id, SocietyRate.category == category))
    if r is None: r = SocietyRate(society_id=society.id, category=category); db.add(r)
    r.base_rate, r.hourly_rate, r.daily_rate = payload.baseRate, payload.hourlyRate, payload.dailyRate; db.commit(); return {"rate": {"category": category, "baseRate": payload.baseRate, "hourlyRate": payload.hourlyRate, "dailyRate": payload.dailyRate}}

@router.get("/society/welfare")
def welfare(society: CurrentAuthority, db: DbSession):
    rows = db.scalars(select(WelfareEnrollment).where(WelfareEnrollment.society_id == society.id)).all()
    return {"enrollments": [{"id": r.id, "workerId": r.worker_id, "workerName": db.get(Worker, r.worker_id).name, "schemeId": r.scheme_id, "enrolledAt": r.created_at} for r in rows], "advances": _advances(society, db)}

@router.post("/society/welfare/enroll", status_code=201)
def enroll_welfare(payload: AuthorityPayload, society: CurrentAuthority, db: DbSession):
    worker = _worker(db, society, int(payload.get("workerId") or 0))
    scheme_id = str(payload.get("schemeId") or "").strip()
    if not scheme_id:
        raise HTTPException(422, "schemeId is required")
    existing = db.scalar(select(WelfareEnrollment).where(WelfareEnrollment.society_id == society.id, WelfareEnrollment.worker_id == worker.id, WelfareEnrollment.scheme_id == scheme_id))
    if existing:
        raise HTTPException(409, "Worker is already enrolled in this scheme")
    enrollment = WelfareEnrollment(society_id=society.id, worker_id=worker.id, scheme_id=scheme_id, status="submitted", data={"documents": payload.get("documents") or [], "eligibility": payload.get("eligibility") or {}})
    db.add(enrollment); db.commit(); db.refresh(enrollment)
    return {"enrollment": {"id": enrollment.id, "workerId": worker.id, "workerName": worker.name, "schemeId": scheme_id, "enrolledAt": enrollment.created_at}}

@router.post("/society/welfare/advances", status_code=201)
def request_advance(payload: AuthorityPayload, society: CurrentAuthority, db: DbSession):
    worker = _worker(db, society, int(payload.get("workerId") or 0))
    amount = float(payload.get("amount") or 0)
    reason = str(payload.get("reason") or "").strip()
    if amount < 500 or amount > 10000 or not reason:
        raise HTTPException(422, "Advance amount must be between 500 and 10000 and reason is required")
    advance = WorkerAdvance(society_id=society.id, worker_id=worker.id, amount=amount, reason=reason)
    db.add(advance); db.commit(); db.refresh(advance)
    return {"advance": {"id": advance.id, "workerId": worker.id, "workerName": worker.name, "amount": amount, "reason": reason, "status": advance.status, "requestedAt": advance.created_at, "remaining": amount}}

def _advances(society, db):
    rows = db.scalars(select(WorkerAdvance).where(WorkerAdvance.society_id == society.id)).all()
    return [{"id": r.id, "workerId": r.worker_id, "workerName": db.get(Worker, r.worker_id).name, "amount": float(r.amount), "reason": r.reason, "status": r.status, "requestedAt": r.created_at, "remaining": float(r.amount)} for r in rows]

@router.get("/society/welfare/advances")
def advances(society: CurrentAuthority, db: DbSession): return {"advances": _advances(society, db)}

@router.patch("/society/welfare/advances/{advance_id}/approve")
def approve_advance(advance_id: int, society: CurrentAuthority, db: DbSession):
    a = db.get(WorkerAdvance, advance_id)
    if a is None or a.society_id != society.id: raise HTTPException(404, "Advance not found")
    a.status = "approved"; db.commit(); return {"advance": {"id": a.id, "status": a.status}}

@router.patch("/society/welfare/advances/{advance_id}/reject")
def reject_advance(advance_id: int, payload: TextPayload, society: CurrentAuthority, db: DbSession):
    a = db.get(WorkerAdvance, advance_id)
    if a is None or a.society_id != society.id: raise HTTPException(404, "Advance not found")
    a.status = "rejected"
    a.data = {**(a.data or {}), "rejectionReason": payload.reason}
    db.commit()
    return {"advance": {"id": a.id, "status": a.status}}

def _complaint_json(c, db):
    job = db.get(Job, c.job_id) if c.job_id else None
    return {"id": c.id, "title": c.title, "description": c.description, "status": c.status, "responses": c.responses or [], "category": c.data.get("category", "other"), "type": c.data.get("type", "quality"), "severity": c.data.get("severity", "medium"), "customerName": job.customer.name if job and job.customer else None, "workerName": job.worker.name if job and job.worker else None, "raisedAt": c.created_at}

@router.get("/society/complaints")
def list_complaints(society: CurrentAuthority, db: DbSession, status: str | None = None):
    rows = db.scalars(select(SocietyComplaint).where(SocietyComplaint.society_id == society.id).order_by(SocietyComplaint.created_at.desc())).all()
    if status: rows = [r for r in rows if r.status == status]
    return {"complaints": [_complaint_json(r, db) for r in rows]}

@router.get("/society/complaints/{complaint_id}")
def get_complaint(complaint_id: int, society: CurrentAuthority, db: DbSession):
    c = db.get(SocietyComplaint, complaint_id)
    if c is None or c.society_id != society.id: raise HTTPException(404, "Complaint not found")
    return {"complaint": _complaint_json(c, db)}

@router.post("/society/complaints")
def create_complaint(payload: ComplaintPayload, society: CurrentAuthority, db: DbSession):
    c = SocietyComplaint(society_id=society.id, job_id=payload.get("bookingId"), title=payload.title, description=payload.description, data=dict(payload))
    db.add(c); db.commit(); db.refresh(c); return {"complaint": _complaint_json(c, db)}

def _change_complaint(complaint_id, payload, society, db, new_status=None):
    c = db.get(SocietyComplaint, complaint_id)
    if c is None or c.society_id != society.id: raise HTTPException(404, "Complaint not found")
    if payload.response: c.responses = [*(c.responses or []), payload.response]; c.status = "under_review"
    if payload.resolution: c.data = {**(c.data or {}), "resolution": payload.resolution}
    if payload.reason: c.data = {**(c.data or {}), "escalationReason": payload.reason}
    if new_status: c.status = new_status
    db.commit(); return {"complaint": _complaint_json(c, db)}

@router.post("/society/complaints/{complaint_id}/respond")
def respond_complaint(complaint_id: int, payload: TextPayload, society: CurrentAuthority, db: DbSession): return _change_complaint(complaint_id, payload, society, db)

@router.patch("/society/complaints/{complaint_id}/resolve")
def resolve_complaint(complaint_id: int, payload: TextPayload, society: CurrentAuthority, db: DbSession): return _change_complaint(complaint_id, payload, society, db, "resolved")

@router.patch("/society/complaints/{complaint_id}/escalate")
def escalate_complaint(complaint_id: int, payload: TextPayload, society: CurrentAuthority, db: DbSession): return _change_complaint(complaint_id, payload, society, db, "escalated")

@router.post("/gps/nearest-society")
def nearest_society(payload: AuthorityPayload, db: DbSession):
    rows = db.scalars(select(Society).order_by(Society.name)).all()
    return {"societies": [{"id": s.id, "name": s.name, "city": s.city} for s in rows]}

@router.post("/gps/nearest-worker")
def nearest_worker(payload: AuthorityPayload, db: DbSession):
    rows = db.scalars(select(Worker).where(Worker.is_available.is_(True))).all()
    return {"workers": [_worker_json(w) for w in rows]}

@router.post("/gps/request")
def gps_request(payload: AuthorityPayload, db: DbSession):
    # GPS requests are customer-side and may not have a society selected yet.
    return {"request": {"status": "requested", "data": dict(payload)}}

@router.get("/gps/subcategories/{category}")
def subcategories(category: str): return {"category": category, "subcategories": []}
