"""Family management routes."""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, auth
from ..schemas.schemas import FamilyCreate, MessageResponse
from ..utils.audit import record_audit
from ..utils.helpers import generate_family_id, paginate

router = APIRouter(prefix="/families", tags=["families"])


def _to_out(fam: models.Family, db: Session) -> dict:
    count = db.query(models.Resident).filter(models.Resident.family_db_id == fam.id).count()
    return {
        "id": fam.id,
        "family_id": fam.family_id,
        "head_name": fam.head_name,
        "village": fam.village,
        "ward_number": fam.ward_number,
        "address": fam.address,
        "member_count": count,
        "created_at": fam.created_at.isoformat() if fam.created_at else None,
    }


@router.get("")
def list_families(page: int = 1, per_page: int = 20, q: str = "",
                  db: Session = Depends(get_db),
                  user: models.User = Depends(auth.require_admin_or_operator)):
    query = db.query(models.Family)
    if q:
        like = f"%{q}%"
        query = query.filter(models.Family.family_id.ilike(like) |
                             models.Family.head_name.ilike(like) |
                             models.Family.village.ilike(like))
    query = query.order_by(models.Family.created_at.desc())
    items, total, pages = paginate(query, page, per_page)
    return {"items": [_to_out(f, db) for f in items],
            "total": total, "page": page, "per_page": per_page, "pages": pages}


@router.get("/{family_id}")
def get_family(family_id: str, db: Session = Depends(get_db),
               user: models.User = Depends(auth.require_admin_or_operator)):
    fam = db.query(models.Family).filter(models.Family.family_id == family_id).first()
    if not fam:
        raise HTTPException(status_code=404, detail="Family not found.")
    out = _to_out(fam, db)
    members = db.query(models.Resident).filter(models.Resident.family_db_id == fam.id).all()
    out["members"] = [{
        "id": m.id, "resident_id": m.resident_id,
        "name": f"{m.first_name} {m.last_name or ''}".strip(),
        "gender": m.gender, "age": m.age, "relation": "Head" if m.is_head_of_family else "Member",
        "mobile": m.mobile_number,
    } for m in members]
    return out


@router.post("", status_code=status.HTTP_201_CREATED)
def create_family(payload: FamilyCreate, request: Request,
                  db: Session = Depends(get_db),
                  user: models.User = Depends(auth.require_admin_or_operator)):
    fam = models.Family(
        family_id=generate_family_id(),
        head_name=payload.head_name,
        village=payload.village,
        ward_number=payload.ward_number,
        address=payload.address,
    )
    db.add(fam)
    db.commit()
    db.refresh(fam)
    record_audit(db, user, "create_family", "family", fam.id,
                 f"Created family {fam.family_id}", request)
    return _to_out(fam, db)


@router.put("/{family_db_id}")
def update_family(family_db_id: int, payload: FamilyCreate, request: Request,
                  db: Session = Depends(get_db),
                  user: models.User = Depends(auth.require_admin_or_operator)):
    fam = db.query(models.Family).filter(models.Family.id == family_db_id).first()
    if not fam:
        raise HTTPException(status_code=404, detail="Family not found.")
    fam.head_name = payload.head_name
    fam.village = payload.village
    fam.ward_number = payload.ward_number
    fam.address = payload.address
    db.commit()
    db.refresh(fam)
    record_audit(db, user, "update_family", "family", fam.id,
                 f"Updated family {fam.family_id}", request)
    return _to_out(fam, db)


@router.delete("/{family_db_id}", response_model=MessageResponse)
def delete_family(family_db_id: int, request: Request,
                  db: Session = Depends(get_db),
                  user: models.User = Depends(auth.require_admin)):
    fam = db.query(models.Family).filter(models.Family.id == family_db_id).first()
    if not fam:
        raise HTTPException(status_code=404, detail="Family not found.")
    fid = fam.family_id
    # Detach members
    db.query(models.Resident).filter(models.Resident.family_db_id == fam.id).update(
        {"family_db_id": None, "family_id": None, "is_head_of_family": False}
    )
    db.delete(fam)
    db.commit()
    record_audit(db, user, "delete_family", "family", family_db_id,
                 f"Deleted family {fid}", request)
    return {"message": f"Family {fid} deleted."}
