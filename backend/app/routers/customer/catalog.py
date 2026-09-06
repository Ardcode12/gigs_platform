"""Authenticated service discovery for the customer application."""

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select

from app.core.deps import CurrentCustomer, DbSession
from app.models import ServiceCategory, ServiceSubcategory, Society, Worker
from app.schemas.customer import AvailableWorkerOut, ServiceCategoryOut, ServiceSubcategoryOut

router = APIRouter(prefix="/api/customer", tags=["customer-catalog"])


@router.get("/categories", response_model=list[ServiceCategoryOut])
def list_categories(_: CurrentCustomer, db: DbSession) -> list[ServiceCategory]:
    return db.scalars(
        select(ServiceCategory).where(ServiceCategory.is_active.is_(True)).order_by(ServiceCategory.name)
    ).all()


@router.get("/subcategories", response_model=list[ServiceSubcategoryOut])
def list_subcategories(
    _: CurrentCustomer,
    db: DbSession,
    category_id: int | None = Query(default=None),
) -> list[ServiceSubcategory]:
    stmt = select(ServiceSubcategory).where(ServiceSubcategory.is_active.is_(True))
    if category_id is not None:
        stmt = stmt.where(ServiceSubcategory.category_id == category_id)
    return db.scalars(stmt.order_by(ServiceSubcategory.name)).all()


@router.get("/categories/{category_id}/subcategories", response_model=list[ServiceSubcategoryOut])
def list_category_subcategories(category_id: int, _: CurrentCustomer, db: DbSession) -> list[ServiceSubcategory]:
    if db.scalar(select(ServiceCategory.id).where(ServiceCategory.id == category_id, ServiceCategory.is_active.is_(True))) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service category not found")
    return db.scalars(
        select(ServiceSubcategory)
        .where(ServiceSubcategory.category_id == category_id, ServiceSubcategory.is_active.is_(True))
        .order_by(ServiceSubcategory.name)
    ).all()


@router.get("/workers", response_model=list[AvailableWorkerOut])
@router.get("/workers/available", response_model=list[AvailableWorkerOut])
def list_available_workers(
    _: CurrentCustomer,
    db: DbSession,
    category: str | None = Query(default=None, description="Category slug or name"),
    subcategory: str | None = Query(default=None, description="Subcategory slug or name"),
    category_id: int | None = Query(default=None),
    subcategory_id: int | None = Query(default=None),
    society_id: int | None = Query(default=None),
) -> list[AvailableWorkerOut]:
    category_names: set[str] = set()
    if category_id is not None:
        catalog_category = db.get(ServiceCategory, category_id)
        if catalog_category:
            category_names.add(catalog_category.name.lower())
    if category:
        catalog_category = db.scalar(select(ServiceCategory).where(ServiceCategory.slug == category))
        category_names.update(value.lower() for value in (category, catalog_category.name if catalog_category else ""))
    if subcategory:
        catalog_subcategory = db.scalar(select(ServiceSubcategory).where(ServiceSubcategory.slug == subcategory))
        category_names.update(value.lower() for value in (subcategory, catalog_subcategory.name if catalog_subcategory else ""))
    if subcategory_id is not None:
        catalog_subcategory = db.get(ServiceSubcategory, subcategory_id)
        if catalog_subcategory:
            category_names.add(catalog_subcategory.name.lower())

    stmt = select(Worker, Society.name).join(Society).where(Worker.is_available.is_(True), Society.is_active.is_(True))
    if society_id is not None:
        stmt = stmt.where(Worker.society_id == society_id)
    rows = db.execute(stmt.order_by(Worker.rating_avg.desc(), Worker.completed_jobs.desc(), Worker.name)).all()
    result = []
    for worker, society_name in rows:
        skills = worker.skills or []
        if category_names and not any(
            term in skill.lower() or skill.lower() in term for skill in skills for term in category_names if term
        ):
            continue
        result.append(AvailableWorkerOut.model_validate({
            "id": worker.id, "society_id": worker.society_id, "society_name": society_name,
            "name": worker.name, "city": worker.city, "skills": skills, "photo_url": worker.photo_url,
            "rating_avg": worker.rating_avg, "rating_count": worker.rating_count,
            "completed_jobs": worker.completed_jobs, "last_lat": worker.last_lat, "last_lng": worker.last_lng,
        }))
    return result
