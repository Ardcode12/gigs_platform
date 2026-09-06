from pydantic import BaseModel, Field


class ReportCreate(BaseModel):
    category: str = Field(min_length=2, max_length=100)
    description: str | None = Field(default=None, max_length=2000)


class ReportOut(BaseModel):
    id: int
    job_id: int
    reporter_type: str
    reporter_id: int
    category: str
    description: str | None
    status: str
