"""
Misc helpers: ID generation, file utilities, pagination.
"""
import datetime as dt
import hashlib
import secrets
from typing import Any, Optional


def generate_id(prefix: str = "VS") -> str:
    """Generate a human-readable unique ID like `VS-20260802-AB12CD34`."""
    today = dt.datetime.utcnow().strftime("%Y%m%d")
    rand = secrets.token_hex(4).upper()
    return f"{prefix}-{today}-{rand}"


def generate_application_number() -> str:
    return generate_id("APP")


def generate_resident_id() -> str:
    return generate_id("RES")


def generate_family_id() -> str:
    return generate_id("FAM")


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def human_size(num_bytes: int) -> str:
    """Return a human-readable file size."""
    if num_bytes < 1024:
        return f"{num_bytes} B"
    elif num_bytes < 1024 * 1024:
        return f"{num_bytes / 1024:.1f} KB"
    else:
        return f"{num_bytes / (1024 * 1024):.2f} MB"


def paginate(query, page: int = 1, per_page: int = 20):
    """Apply pagination to a SQLAlchemy query. Returns (items, total, pages)."""
    page = max(1, page)
    per_page = max(1, min(per_page, 200))
    total = query.count()
    pages = (total + per_page - 1) // per_page
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    return items, total, pages


def serialize_model(obj: Any) -> dict:
    """Best-effort serializer for SQLAlchemy model instances."""
    if obj is None:
        return {}
    out = {}
    for col in obj.__table__.columns:
        val = getattr(obj, col.name)
        if isinstance(val, dt.datetime):
            out[col.name] = val.isoformat()
        elif isinstance(val, dt.date):
            out[col.name] = val.isoformat()
        elif isinstance(val, bytes):
            out[col.name] = f"<binary {len(val)} bytes>"
        else:
            out[col.name] = val
    return out
