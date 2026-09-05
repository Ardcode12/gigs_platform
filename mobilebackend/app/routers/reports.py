"""Participant reports tied to a job."""

from fastapi import APIRouter, HTTPException, status as http_status

from app.core.deps import CurrentWorker, DbSession
from app.models import JobReport
from app.schemas.report import ReportCreate, ReportOut
from app.services.access import get_job_for_worker

router = APIRouter(prefix="/api/jobs", tags=["reports"])


@router.post("/{job_id}/reports", response_model=ReportOut, status_code=http_status.HTTP_201_CREATED)
def create_worker_report(
    job_id: int, payload: ReportCreate, worker: CurrentWorker, db: DbSession
) -> ReportOut:
    job = get_job_for_worker(db, worker, job_id)
    report = JobReport(
        job_id=job.id,
        reporter_type="worker",
        reporter_id=worker.id,
        category=payload.category,
        description=payload.description,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return ReportOut.model_validate(report, from_attributes=True)
