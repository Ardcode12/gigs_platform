"""Who may see which job.

Every job-scoped route funnels through here so the rule lives in one place: a
worker sees their own jobs, plus requests that are still open to them. Anything
else answers 404 — not 403 — because a worker has no business learning that
another worker's job id exists.
"""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Job, JobStatus, Worker

_NOT_FOUND = HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")


def get_job_for_worker(db: Session, worker: Worker, job_id: int, *, must_own: bool = False) -> Job:
    """Resolve a job id for this worker.

    `must_own=False` also admits an open broadcast request, which is what lets the
    worker chat with the customer *before* accepting (spec #5). `must_own=True` is
    for anything that changes the job.
    """
    job = db.get(Job, job_id)
    if job is None:
        raise _NOT_FOUND

    if job.worker_id == worker.id:
        return job
    if not must_own and job.worker_id is None and job.status == JobStatus.REQUESTED:
        return job
    raise _NOT_FOUND
