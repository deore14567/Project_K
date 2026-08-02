"""Government schemes routes — CRUD."""
import datetime as dt
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, auth
from ..schemas.schemas import SchemeCreate, SchemeUpdate, MessageResponse
from ..utils.audit import record_audit
from ..utils.helpers import paginate


def _parse_date(value):
    if not value:
        return None
    if isinstance(value, dt.date):
        return value
    try:
        return dt.date.fromisoformat(str(value))
    except (ValueError, TypeError):
        return None

router = APIRouter(prefix="/schemes", tags=["schemes"])


def _to_out(s: models.Scheme) -> dict:
    return {
        "id": s.id,
        "name": s.name,
        "description": s.description,
        "benefits": s.benefits,
        "eligibility": s.eligibility,
        "age_min": s.age_min,
        "age_max": s.age_max,
        "gender": s.gender,
        "category": s.category,
        "income_limit": s.income_limit,
        "required_documents": s.required_documents or [],
        "application_deadline": s.application_deadline.isoformat() if s.application_deadline else None,
        "status": s.status,
        "created_at": s.created_at.isoformat() if s.created_at else None,
        "updated_at": s.updated_at.isoformat() if s.updated_at else None,
    }


@router.get("")
def list_schemes(page: int = 1, per_page: int = 20, q: str = "",
                 status_filter: str = "",
                 db: Session = Depends(get_db),
                 user: models.User = Depends(auth.require_admin_or_operator)):
    query = db.query(models.Scheme)
    if q:
        like = f"%{q}%"
        query = query.filter(models.Scheme.name.ilike(like) |
                             models.Scheme.description.ilike(like))
    if status_filter:
        query = query.filter(models.Scheme.status == status_filter)
    query = query.order_by(models.Scheme.created_at.desc())
    items, total, pages = paginate(query, page, per_page)
    return {"items": [_to_out(s) for s in items],
            "total": total, "page": page, "per_page": per_page, "pages": pages}


@router.get("/{scheme_id}")
def get_scheme(scheme_id: int,
               db: Session = Depends(get_db),
               user: models.User = Depends(auth.require_admin_or_operator)):
    s = db.query(models.Scheme).filter(models.Scheme.id == scheme_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Scheme not found.")
    return _to_out(s)


@router.post("", status_code=status.HTTP_201_CREATED)
def create_scheme(payload: SchemeCreate, request: Request,
                  db: Session = Depends(get_db),
                  user: models.User = Depends(auth.require_admin_or_operator)):
    data = payload.model_dump(exclude_unset=True)
    if "application_deadline" in data:
        data["application_deadline"] = _parse_date(data["application_deadline"])
    s = models.Scheme(**data)
    db.add(s)
    db.commit()
    db.refresh(s)
    record_audit(db, user, "create_scheme", "scheme", s.id,
                 f"Created scheme {s.name}", request)
    return _to_out(s)


@router.put("/{scheme_id}")
def update_scheme(scheme_id: int, payload: SchemeUpdate, request: Request,
                  db: Session = Depends(get_db),
                  user: models.User = Depends(auth.require_admin_or_operator)):
    s = db.query(models.Scheme).filter(models.Scheme.id == scheme_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Scheme not found.")
    data = payload.model_dump(exclude_unset=True)
    if "application_deadline" in data:
        data["application_deadline"] = _parse_date(data["application_deadline"])
    for k, v in data.items():
        setattr(s, k, v)
    db.commit()
    db.refresh(s)
    record_audit(db, user, "update_scheme", "scheme", s.id,
                 f"Updated scheme {s.name}", request)
    return _to_out(s)


@router.delete("/{scheme_id}", response_model=MessageResponse)
def delete_scheme(scheme_id: int, request: Request,
                  db: Session = Depends(get_db),
                  user: models.User = Depends(auth.require_admin)):
    s = db.query(models.Scheme).filter(models.Scheme.id == scheme_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Scheme not found.")
    name = s.name
    db.delete(s)
    db.commit()
    record_audit(db, user, "delete_scheme", "scheme", scheme_id,
                 f"Deleted scheme {name}", request)
    return {"message": f"Scheme {name} deleted."}
