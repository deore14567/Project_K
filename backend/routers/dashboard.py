"""Dashboard routes — aggregate stats for the landing page."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from .. import models, auth

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
def dashboard_stats(db: Session = Depends(get_db),
                    user: models.User = Depends(auth.require_admin_or_operator)):
    total_residents = db.query(func.count(models.Resident.id)).scalar() or 0
    total_families = db.query(func.count(models.Family.id)).scalar() or 0
    total_documents = db.query(func.count(models.Document.id)).filter(
        models.Document.is_latest.is_(True)
    ).scalar() or 0
    total_schemes = db.query(func.count(models.Scheme.id)).filter(
        models.Scheme.status == "active"
    ).scalar() or 0
    pending = db.query(func.count(models.Application.id)).filter(
        models.Application.status.in_(["applied", "pending", "processing"])
    ).scalar() or 0
    approved = db.query(func.count(models.Application.id)).filter(
        models.Application.status == "approved"
    ).scalar() or 0
    rejected = db.query(func.count(models.Application.id)).filter(
        models.Application.status == "rejected"
    ).scalar() or 0

    recent_activity = db.query(models.AuditLog).order_by(
        models.AuditLog.created_at.desc()
    ).limit(8).all()

    recent_residents = db.query(models.Resident).order_by(
        models.Resident.created_at.desc()
    ).limit(5).all()

    latest_schemes = db.query(models.Scheme).order_by(
        models.Scheme.created_at.desc()
    ).limit(5).all()

    return {
        "total_residents": total_residents,
        "total_families": total_families,
        "total_documents": total_documents,
        "total_schemes": total_schemes,
        "pending_applications": pending,
        "approved_applications": approved,
        "rejected_applications": rejected,
        "recent_activity": [{
            "action": a.action,
            "description": a.description,
            "user_email": a.user_email,
            "created_at": a.created_at.isoformat() if a.created_at else "",
        } for a in recent_activity],
        "recent_residents": [{
            "id": r.id, "resident_id": r.resident_id,
            "name": f"{r.first_name} {r.last_name or ''}".strip(),
            "village": r.village,
            "created_at": r.created_at.isoformat() if r.created_at else "",
        } for r in recent_residents],
        "latest_schemes": [{
            "id": s.id, "name": s.name, "status": s.status,
            "created_at": s.created_at.isoformat() if s.created_at else "",
        } for s in latest_schemes],
    }


@router.get("/search")
def global_search(q: str = "", limit: int = 20,
                  db: Session = Depends(get_db),
                  user: models.User = Depends(auth.require_admin_or_operator)):
    """Cross-entity search used by the global search bar."""
    if not q or len(q) < 2:
        return {"residents": [], "schemes": [], "applications": [], "families": []}
    like = f"%{q}%"

    residents = db.query(models.Resident).filter(
        models.Resident.first_name.ilike(like) |
        models.Resident.last_name.ilike(like) |
        models.Resident.mobile_number.ilike(like) |
        models.Resident.email.ilike(like) |
        models.Resident.resident_id.ilike(like) |
        models.Resident.pan_number.ilike(like) |
        models.Resident.voter_id.ilike(like)
    ).limit(limit).all()

    schemes = db.query(models.Scheme).filter(
        models.Scheme.name.ilike(like) | models.Scheme.description.ilike(like)
    ).limit(limit).all()

    applications = db.query(models.Application).filter(
        models.Application.application_number.ilike(like)
    ).limit(limit).all()

    families = db.query(models.Family).filter(
        models.Family.family_id.ilike(like) |
        models.Family.head_name.ilike(like) |
        models.Family.village.ilike(like)
    ).limit(limit).all()

    return {
        "residents": [{
            "id": r.id, "resident_id": r.resident_id,
            "name": f"{r.first_name} {r.last_name or ''}".strip(),
            "village": r.village, "mobile": r.mobile_number,
        } for r in residents],
        "schemes": [{"id": s.id, "name": s.name, "status": s.status} for s in schemes],
        "applications": [{
            "id": a.id, "application_number": a.application_number, "status": a.status,
        } for a in applications],
        "families": [{
            "id": f.id, "family_id": f.family_id, "head_name": f.head_name,
            "village": f.village,
        } for f in families],
    }
