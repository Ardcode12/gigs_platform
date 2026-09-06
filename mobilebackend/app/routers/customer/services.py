"""Customer service discovery — real categories + real worker counts from the database.

GET /api/customer/services
  Returns the list of service categories that exist in the database (inferred from
  worker skills) with the *actual* count of available workers for each category.
  The frontend must NEVER show a static number like "24 plumbers" again.

GET /api/customer/services/search?q=fan+repair&lat=...&lng=...
  Free-text search over worker skills + service types of past jobs.
  Returns matching service categories and individual workers.
"""

import logging
from typing import Optional

from fastapi import APIRouter, Query
from sqlalchemy import func, select

from app.core.deps import CurrentCustomer, DbSession
from app.models import Job, JobStatus, Worker
from app.schemas.customer import ServiceCategoryOut, ServiceSearchResult
from app.services.geo import distance_and_eta

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/customer/services", tags=["customer-services"])

# ---------------------------------------------------------------------------
# Canonical service categories used across the platform.
# icon names map to MaterialCommunityIcons glyphs the app already imports.
# ---------------------------------------------------------------------------
CANONICAL_CATEGORIES = [
    {"key": "Electrician",  "icon": "flash",        "color": "#F59E0B", "bg": "#FEF3C7",
     "desc": "Wiring, fans, lights, switchboards, inverters & more"},
    {"key": "Plumber",      "icon": "water",         "color": "#0284C7", "bg": "#E0F2FE",
     "desc": "Pipe leaks, taps, geysers, drainage & water lines"},
    {"key": "Carpenter",    "icon": "hammer",        "color": "#D97706", "bg": "#FEF3C7",
     "desc": "Furniture, doors, windows, wardrobes & repairs"},
    {"key": "Painter",      "icon": "format-paint",  "color": "#7C3AED", "bg": "#EDE9FE",
     "desc": "Interior, exterior, texture & waterproofing"},
    {"key": "Cleaner",      "icon": "broom",         "color": "#059669", "bg": "#D1FAE5",
     "desc": "Deep cleaning, sofa, carpet, bathroom & kitchen"},
    {"key": "Gardener",     "icon": "sprout",        "color": "#16A34A", "bg": "#DCFCE7",
     "desc": "Lawn care, pruning, planting & garden design"},
    {"key": "AC Technician","icon": "air-conditioner","color": "#0891B2","bg": "#CFFAFE",
     "desc": "AC servicing, gas refill, installation & repair"},
    {"key": "Mason",        "icon": "wall",          "color": "#92400E", "bg": "#FEF3C7",
     "desc": "Wall repair, tiles, waterproofing & construction"},
    {"key": "Bike Mechanic","icon": "motorbike",     "color": "#DC2626", "bg": "#FEE2E2",
     "desc": "Bike servicing, tyres, engine & electrical faults"},
    {"key": "Vehicle Service","icon":"car-wrench",   "color": "#1D4ED8", "bg": "#DBEAFE",
     "desc": "Car service, oil change, battery & general repairs"},
    {"key": "Security",     "icon": "shield-lock",   "color": "#4B5563", "bg": "#F3F4F6",
     "desc": "CCTV, locks, alarms & home security installation"},
    {"key": "Pest Control", "icon": "bug",           "color": "#7C3AED", "bg": "#EDE9FE",
     "desc": "Cockroach, termite, rats, mosquito & all pest treatment"},
]


from app.routers.jobs import _stem_trade


def _skill_matches(skill: str, category_key: str) -> bool:
    """Robust match between a worker skill and a category key using trade root stemming."""
    s = skill.lower().strip()
    k = category_key.lower().strip()
    if not s or not k:
        return False
    if k in s or s in k:
        return True

    s_words = [w for w in s.replace("-", " ").replace("_", " ").split() if len(w) >= 3]
    k_words = [w for w in k.replace("-", " ").replace("_", " ").split() if len(w) >= 3]

    s_stems = [_stem_trade(w) for w in s_words]
    k_stems = [_stem_trade(w) for w in k_words]

    s_full_stem = _stem_trade(s)
    k_full_stem = _stem_trade(k)

    if s_full_stem and k_full_stem and s_full_stem == k_full_stem:
        return True

    for ks in k_stems:
        if any(ks == ss or (len(ks) >= 4 and ks[:4] == ss[:4]) for ss in s_stems):
            return True

    return any(w in s for w in k_words if len(w) > 3)


@router.get("", response_model=list[ServiceCategoryOut])
def list_service_categories(
    customer: CurrentCustomer,
    db: DbSession,
) -> list[ServiceCategoryOut]:
    """Return all service categories with the real count of available workers for each."""
    all_workers = db.scalars(select(Worker)).all()

    results = []
    for cat in CANONICAL_CATEGORIES:
        total_count = sum(
            1 for w in all_workers
            if any(_skill_matches(s, cat["key"]) for s in (w.skills or []))
        )
        available_count = sum(
            1 for w in all_workers
            if w.is_available and any(_skill_matches(s, cat["key"]) for s in (w.skills or []))
        )
        results.append(
            ServiceCategoryOut(
                key=cat["key"],
                name=cat["key"],
                description=cat["desc"],
                icon=cat["icon"],
                color=cat["color"],
                bg=cat["bg"],
                total_workers=total_count,
                available_workers=available_count,
            )
        )
    return results


@router.get("/search", response_model=ServiceSearchResult)
def search_services(
    customer: CurrentCustomer,
    db: DbSession,
    q: str = Query(default="", min_length=0, description="Search keyword"),
    lat: Optional[float] = Query(default=None),
    lng: Optional[float] = Query(default=None),
) -> ServiceSearchResult:
    """Full-text search over service categories + matching workers.

    Returns:
      - categories: subset of CANONICAL_CATEGORIES that match the query
      - workers: actual workers whose skills match the query, with live distance
    """
    query_lower = q.strip().lower()

    # --- matching categories ---
    matching_cats = []
    for cat in CANONICAL_CATEGORIES:
        if (
            not query_lower
            or query_lower in cat["key"].lower()
            or query_lower in cat["desc"].lower()
        ):
            matching_cats.append(cat)

    # --- matching workers ---
    all_workers = db.scalars(select(Worker)).all()
    matched_workers = []
    for w in all_workers:
        skills = w.skills or []
        if not query_lower or any(query_lower in s.lower() for s in skills):
            dist, eta = distance_and_eta(w.last_lat, w.last_lng, lat, lng)
            matched_workers.append(
                {
                    "id": w.id,
                    "name": w.name,
                    "skills": skills,
                    "rating_avg": float(w.rating_avg or 0),
                    "rating_count": w.rating_count or 0,
                    "completed_jobs": w.completed_jobs or 0,
                    "is_available": w.is_available,
                    "photo_url": w.photo_url,
                    "distance_km": dist,
                    "eta_minutes": eta,
                }
            )

    # Sort workers: available first, then nearest, then highest rated
    matched_workers.sort(
        key=lambda w: (not w["is_available"], w["distance_km"] is None, w["distance_km"] or 9999, -w["rating_avg"])
    )

    # Count available workers per matching category
    cat_results = []
    for cat in matching_cats:
        total = sum(1 for w in all_workers if any(_skill_matches(s, cat["key"]) for s in (w.skills or [])))
        avail = sum(1 for w in all_workers if w.is_available and any(_skill_matches(s, cat["key"]) for s in (w.skills or [])))
        cat_results.append(
            ServiceCategoryOut(
                key=cat["key"],
                name=cat["key"],
                description=cat["desc"],
                icon=cat["icon"],
                color=cat["color"],
                bg=cat["bg"],
                total_workers=total,
                available_workers=avail,
            )
        )

    return ServiceSearchResult(
        query=q,
        categories=cat_results,
        workers=matched_workers[:20],  # cap at 20 for perf
    )
