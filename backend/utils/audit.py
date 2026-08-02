"""
Audit logging helper.
Centralizes creation of AuditLog rows so every router can record actions
with consistent metadata.
"""
from typing import Optional
from fastapi import Request
from sqlalchemy.orm import Session

from .. import models


def record_audit(
    db: Session,
    user: Optional[models.User],
    action: str,
    entity_type: str = "",
    entity_id: Optional[str] = None,
    description: str = "",
    request: Optional[Request] = None,
) -> None:
    """Insert a single AuditLog row. Best-effort — never raises."""
    try:
        ip = ""
        ua = ""
        if request is not None and request.client:
            ip = request.client.host or ""
            ua = request.headers.get("user-agent", "")[:255]
        log = models.AuditLog(
            user_id=user.id if user else None,
            user_email=user.email if user else "anonymous",
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id) if entity_id is not None else None,
            description=description,
            ip_address=ip,
            user_agent=ua,
        )
        db.add(log)
        db.commit()
    except Exception:
        # Never break the request flow because of an audit-log failure.
        try:
            db.rollback()
        except Exception:
            pass
