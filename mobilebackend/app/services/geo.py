"""Distance and ETA between a worker and a job (spec #4)."""

from math import asin, cos, radians, sin, sqrt

from app.core.config import settings

EARTH_RADIUS_KM = 6371.0


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance in kilometres."""
    d_lat = radians(lat2 - lat1)
    d_lng = radians(lng2 - lng1)
    a = (
        sin(d_lat / 2) ** 2
        + cos(radians(lat1)) * cos(radians(lat2)) * sin(d_lng / 2) ** 2
    )
    return 2 * EARTH_RADIUS_KM * asin(sqrt(a))


def eta_minutes(distance_km: float) -> int:
    """Rough travel time at the configured average city speed, minimum 1 minute."""
    if settings.AVG_SPEED_KMPH <= 0:
        return 0
    return max(1, round((distance_km / settings.AVG_SPEED_KMPH) * 60))


def distance_and_eta(
    from_lat: float | None,
    from_lng: float | None,
    to_lat: float,
    to_lng: float,
) -> tuple[float | None, int | None]:
    """Both figures, or (None, None) when the worker's position isn't known yet.

    A worker who has never granted location permission still needs to see the job,
    so this degrades rather than failing.
    """
    if from_lat is None or from_lng is None:
        return None, None
    distance = round(haversine_km(from_lat, from_lng, to_lat, to_lng), 2)
    return distance, eta_minutes(distance)
