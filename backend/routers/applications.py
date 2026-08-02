"""Application routes — create, list, status transitions, timeline."""
import datetime as dt
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, auth
from ..schemas.schemas import ApplicationCreate, ApplicationStatusUpdate, MessageResponse
from ..utils.audit import record_audit
from ..utils.helpers import generate_application_number, paginate

router = APIRouter(prefix="/applications", tags=["applications"])


def _to_out(a: models.Application, db: Session) -> dict:
    resident_name = ""
    if a.resident:
        resident_name = f"{a.resident.first_name} {a.resident.last_name or ''}".strip()
    scheme_name = a.scheme.name if a.scheme else ""
    actor_name = ""
    timeline = []
    for t in a.timeline:
        actor = db.query(models.User).filter(models.User.id == t.changed_by).first()
        actor_name = actor.full_name if actor else ""
        timeline.append({
            "id": t.id,
            "status": t.status,
            "remarks": t.remarks,
            "changed_by": t.changed_by,
            "actor_name": actor_name,
            "created_at": t.created_at.isoformat() if t.created_at else None,
        })
    return {
        "id": a.id,
        "application_number": a.application_number,
        "resident_id": a.resident_id,
        "scheme_id": a.scheme_id,
        "resident_name": resident_name,
        "scheme_name": scheme_name,
        "status": a.status,
        "remarks": a.remarks,
        "applied_by": a.applied_by,
        "created_at": a.created_at.isoformat() if a.created_at else None,
        "updated_at": a.updated_at.isoformat() if a.updated_at else None,
        "timeline": timeline,
    }


@router.get("")
def list_applications(page: int = 1, per_page: int = 20,
                      status_filter: Optional[str] = None,
                      resident_id: Optional[int] = None,
                      scheme_id: Optional[int] = None,
                      q: str = "",
                      db: Session = Depends(get_db),
                      user: models.User = Depends(auth.require_admin_or_operator)):
    query = db.query(models.Application)
    if status_filter:
        query = query.filter(models.Application.status == status_filter)
    if resident_id:
        query = query.filter(models.Application.resident_id == resident_id)
    if scheme_id:
        query = query.filter(models.Application.scheme_id == scheme_id)
    if q:
        query = query.filter(models.Application.application_number.ilike(f"%{q}%"))
    query = query.order_by(models.Application.created_at.desc())
    items, total, pages = paginate(query, page, per_page)
    return {"items": [_to_out(a, db) for a in items],
            "total": total, "page": page, "per_page": per_page, "pages": pages}


@router.get("/{app_id}")
def get_application(app_id: int,
                    db: Session = Depends(get_db),
                    user: models.User = Depends(auth.require_admin_or_operator)):
    a = db.query(models.Application).filter(models.Application.id == app_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Application not found.")
    return _to_out(a, db)


@router.post("", status_code=status.HTTP_201_CREATED)
def create_application(payload: ApplicationCreate, request: Request,
                       db: Session = Depends(get_db),
                       user: models.User = Depends(auth.require_admin_or_operator)):
    resident = db.query(models.Resident).filter(models.Resident.id == payload.resident_id).first()
    if not resident:
        raise HTTPException(status_code=404, detail="Resident not found.")
    scheme = db.query(models.Scheme).filter(models.Scheme.id == payload.scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found.")
    if scheme.status != "active":
        raise HTTPException(status_code=400, detail=f"Scheme is {scheme.status} — cannot apply.")

    app = models.Application(
        application_number=generate_application_number(),
        resident_id=payload.resident_id,
        scheme_id=payload.scheme_id,
        status="applied",
        remarks=payload.remarks,
        applied_by=user.id,
    )
    db.add(app)
    db.commit()
    db.refresh(app)

    # Initial timeline entry
    tl = models.ApplicationTimeline(
        application_id=app.id,
        status="applied",
        remarks=payload.remarks or "Application submitted.",
        changed_by=user.id,
    )
    db.add(tl)
    db.commit()

    record_audit(db, user, "create_application", "application", app.id,
                 f"Applied for scheme {scheme.name} on behalf of resident #{resident.id}", request)
    return _to_out(app, db)


@router.put("/{app_id}/status")
def update_application_status(app_id: int, payload: ApplicationStatusUpdate,
                              request: Request,
                              db: Session = Depends(get_db),
                              user: models.User = Depends(auth.require_admin_or_operator)):
    a = db.query(models.Application).filter(models.Application.id == app_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Application not found.")
    old_status = a.status
    a.status = payload.status
    if payload.remarks is not None:
        a.remarks = payload.remarks
    db.add(a)

    tl = models.ApplicationTimeline(
        application_id=a.id,
        status=payload.status,
        remarks=payload.remarks or f"Status changed from {old_status} to {payload.status}.",
        changed_by=user.id,
    )
    db.add(tl)
    db.commit()
    db.refresh(a)
    record_audit(db, user, "update_application", "application", a.id,
                 f"Application {a.application_number}: {old_status} -> {payload.status}", request)
    return _to_out(a, db)


@router.delete("/{app_id}", response_model=MessageResponse)
def delete_application(app_id: int, request: Request,
                       db: Session = Depends(get_db),
                       user: models.User = Depends(auth.require_admin)):
    a = db.query(models.Application).filter(models.Application.id == app_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Application not found.")
    num = a.application_number
    db.delete(a)
    db.commit()
    record_audit(db, user, "delete_application", "application", app_id,
                 f"Deleted application {num}", request)
    return {"message": f"Application {num} deleted."}
