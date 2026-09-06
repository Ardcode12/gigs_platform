"""Society authority portal API."""
from datetime import datetime, timezone
import secrets
from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import func, select
from app.core.deps import CurrentAuthority, CurrentFederation, DbSession
from app.core.security import hash_password
from app.models import (GpsRequest, Job, JobStatus, JobStatusEvent, NotificationType, Payment, PaymentMethod,
    PaymentStatus, Society, SocietyComplaint, SocietyRate, WelfareEnrollment, Worker, WorkerAdvance)
from app.schemas.authority import AuthorityPayload, BulkAssignment, ComplaintPayload, IdPayload, RatePayload, StatusPayload, TextPayload, SocietyCreatePayload
from app.services.notify import notify, notify_customer

router = APIRouter(prefix="/api", tags=["authority"])


@router.post("/federation/societies", status_code=201)
def create_society(payload: SocietyCreatePayload, federation: CurrentFederation, db: DbSession):
    exists = db.scalar(select(Society).where(func.lower(Society.society_code) == payload.societyCode.lower()))
    if exists:
        raise HTTPException(409, "Society code already exists")
    society = Society(
        name=payload.name,
        city=payload.city,
        society_code=payload.societyCode,
        password_hash=hash_password(payload.password),
        is_active=True,
    )
    db.add(society)
    db.commit()
    db.refresh(society)
    return {"society": {"id": society.id, "societyCode": society.society_code, "name": society.name, "city": society.city}}


@router.get("/federation/societies")
def list_societies(federation: CurrentFederation, db: DbSession):
    rows = db.scalars(select(Society).order_by(Society.name)).all()
    return {"societies": [{"id": s.id, "societyCode": s.society_code, "name": s.name, "city": s.city, "isActive": s.is_active} for s in rows]}


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
    data = {"id": w.id, "uniqueId": w.worker_code, "worker_code": w.worker_code, "name": w.name,
            "phone": w.phone, "city": w.city, "skills": w.skills or [], "photoUrl": w.photo_url,
            "is_available": w.is_available, "availability": "available" if w.is_available else "offline",
            "rating": float(w.rating_avg or 0), "rating_avg": float(w.rating_avg or 0), "completedJobs": w.completed_jobs,
            "kycStatus": w.kyc_status, "kyc_status": w.kyc_status, "kycMethod": w.kyc_method,
            "kycRefs": w.kyc_refs or [], "kyc_reason": w.kyc_reason}
    data.update(w.authority_data or {})
    return data

def _booking_json(j):
    status = {JobStatus.REQUESTED: "pending", JobStatus.ACCEPTED: "dispatched", JobStatus.WORK_STARTED: "in_progress"}.get(j.status, j.status.value)
    return {"id": j.id, "serviceCategory": j.service_type, "service_type": j.service_type, "status": status,
            "customerName": j.customer.name if j.customer else None, "customerPhone": j.customer.phone if j.customer else None,
            "customerAddress": j.address, "address": j.address, "description": j.work_details,
            "estimatedAmount": float(j.base_amount), "assignedWorker": j.worker_id,
            "requestedAt": j.requested_at, "acceptedAt": j.accepted_at, "type": "single"}

@router.get("/society/dashboard")
def dashboard(society: CurrentAuthority, db: DbSession):
    workers = db.scalar(select(func.count()).select_from(Worker).where(Worker.society_id == society.id)) or 0
    jobs = db.scalars(select(Job).where(Job.society_id == society.id)).all()
    return {"dashboard": {"totalWorkers": workers, "totalBookings": len(jobs), "todayBookings": len(jobs),
        "todayEarnings": sum(float(j.base_amount) for j in jobs if j.status == JobStatus.COMPLETED),
        "pendingBookings": sum(j.status == JobStatus.REQUESTED for j in jobs), "weeklyEarnings": []}}

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
    password = str(payload.get("initialPassword") or secrets.token_urlsafe(8))
    w = Worker(society_id=society.id, worker_code=code, name=str(payload.get("name", "Worker")),
        phone=str(payload.get("phone", "0000000000")), password_hash=hash_password(password), city=payload.get("city") or payload.get("address"),
        skills=payload.get("skills") or ([payload.get("category")] if payload.get("category") else []), photo_url=payload.get("photoUrl"),
        kyc_method=payload.get("kycMethod"), kyc_status="active" if payload.get("kycMethod") == "certificate" else "verifying",
        kyc_refs=payload.get("clientRefs") or [], authority_data=dict(payload))
    db.add(w); db.commit(); db.refresh(w)
    result = _worker_json(w); result["defaultPassword"] = password
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
    return {"payments": [{"id": p.id, "bookingId": p.job_id, "amount": float(p.total_amount), "status": p.status.value, "mode": p.payment_method.value, "customerName": p.job.customer.name if p.job and p.job.customer else None, "paidAt": p.paid_at or p.created_at} for p in rows]}

@router.get("/society/payments/{payment_id}")
def get_payment(payment_id: int, society: CurrentAuthority, db: DbSession):
    payment = db.get(Payment, payment_id)
    if payment is None or payment.job.worker is None or payment.job.worker.society_id != society.id:
        raise HTTPException(404, "Payment not found")
    return {"payment": {"id": payment.id, "bookingId": payment.job_id, "amount": float(payment.total_amount), "status": payment.status.value, "mode": payment.payment_method.value}}

@router.post("/society/payments")
def record_payment(payload: AuthorityPayload, society: CurrentAuthority, db: DbSession):
    j = _job(db, society, int(payload.get("bookingId") or payload.get("job_id"))); w = _worker(db, society, int(payload.get("workerId") or j.worker_id or 0))
    p = db.scalar(select(Payment).where(Payment.job_id == j.id))
    if p is None: p = Payment(job_id=j.id, worker_id=w.id, base_amount=payload.get("amount", j.base_amount), total_amount=payload.get("amount", j.base_amount), payment_method=PaymentMethod.CASH); db.add(p)
    p.status = PaymentStatus.PAID; p.paid_at = datetime.now(timezone.utc); db.commit(); return {"payment": {"id": p.id, "bookingId": p.job_id, "amount": float(p.total_amount), "status": "cash_paid", "mode": "cash"}}

@router.patch("/society/payments/{payment_id}/status")
def payment_status(payment_id: int, payload: StatusPayload, society: CurrentAuthority, db: DbSession):
    p = db.get(Payment, payment_id)
    if p is None or p.job.worker.society_id != society.id: raise HTTPException(404, "Payment not found")
    p.status = PaymentStatus.PAID if payload.status != "pending" else PaymentStatus.PENDING; p.paid_at = datetime.now(timezone.utc) if p.status == PaymentStatus.PAID else None; db.commit(); return {"payment": {"id": p.id, "status": payload.status}}

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
