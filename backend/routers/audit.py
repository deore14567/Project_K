"""Audit log routes — admin sees all, operator sees only their own."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_

from ..database import get_db
from .. import models, auth
from ..utils.helpers import paginate

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("")
def list_audit_logs(page: int = 1, per_page: int = 30, q: str = "",
                    action: str = "",
                    db: Session = Depends(get_db),
                    user: models.User = Depends(auth.get_current_user)):
    query = db.query(models.AuditLog)
    is_admin = bool(user.role and user.role.name == "admin")
    if not is_admin:
        query = query.filter(models.AuditLog.user_id == user.id)
    if q:
        like = f"%{q}%"
        query = query.filter(or_(
            models.AuditLog.action.ilike(like),
            models.AuditLog.description.ilike(like),
            models.AuditLog.user_email.ilike(like),
            models.AuditLog.entity_type.ilike(like),
        ))
    if action:
        query = query.filter(models.AuditLog.action == action)
    query = query.order_by(models.AuditLog.created_at.desc())
    items, total, pages = paginate(query, page, per_page)
    return {"items": [{
        "id": a.id,
        "user_email": a.user_email,
        "action": a.action,
        "entity_type": a.entity_type,
        "entity_id": a.entity_id,
        "description": a.description,
        "ip_address": a.ip_address,
        "user_agent": a.user_agent,
        "created_at": a.created_at.isoformat() if a.created_at else None,
    } for a in items],
        "total": total, "page": page, "per_page": per_page, "pages": pages}
