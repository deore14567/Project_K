"""Resident management routes — full CRUD with search, pagination, masking."""
import datetime as dt
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, auth
from ..schemas.schemas import ResidentCreate, ResidentUpdate, ResidentOut, MessageResponse
from ..utils.audit import record_audit
from ..utils.crypto import encrypt, decrypt
from ..utils.validation import mask_aadhaar, calculate_age
from ..utils.helpers import generate_resident_id, paginate


def _parse_dob(value):
    """Convert a YYYY-MM-DD string to a date object (or None)."""
    if not value:
        return None
    if isinstance(value, dt.date):
        return value
    try:
        return dt.date.fromisoformat(str(value))
    except (ValueError, TypeError):
        return None

router = APIRouter(prefix="/residents", tags=["residents"])


def _to_out(r: models.Resident, reveal_aadhaar: bool = False) -> dict:
    plain_aadhaar = decrypt(r.aadhaar_encrypted) if r.aadhaar_encrypted else None
    return {
        "id": r.id,
        "resident_id": r.resident_id,
        "first_name": r.first_name,
        "middle_name": r.middle_name,
        "last_name": r.last_name,
        "gender": r.gender,
        "dob": r.dob.isoformat() if r.dob else None,
        "age": r.age,
        "mobile_number": r.mobile_number,
        "alternate_number": r.alternate_number,
        "email": r.email,
        "address": r.address,
        "village": r.village,
        "taluka": r.taluka,
        "district": r.district,
        "state": r.state,
        "pin_code": r.pin_code,
        "ward_number": r.ward_number,
        "aadhaar_masked": mask_aadhaar(plain_aadhaar),
        "aadhaar": plain_aadhaar if reveal_aadhaar else None,
        "pan_number": r.pan_number,
        "voter_id": r.voter_id,
        "ration_card_number": r.ration_card_number,
        "occupation": r.occupation,
        "annual_income": r.annual_income,
        "religion": r.religion,
        "category": r.category,
        "caste": r.caste,
        "family_id": r.family_id,
        "is_head_of_family": r.is_head_of_family,
        "remarks": r.remarks,
        "created_at": r.created_at.isoformat() if r.created_at else None,
        "updated_at": r.updated_at.isoformat() if r.updated_at else None,
    }


@router.get("")
def list_residents(
    page: int = 1,
    per_page: int = 20,
    q: str = "",
    village: Optional[str] = None,
    ward: Optional[str] = None,
    category: Optional[str] = None,
    gender: Optional[str] = None,
    family_id: Optional[str] = None,
    sort: str = "created_at:desc",
    db: Session = Depends(get_db),
    user: models.User = Depends(auth.require_admin_or_operator),
):
    query = db.query(models.Resident)
    if q:
        like = f"%{q}%"
        query = query.filter(or_(
            models.Resident.first_name.ilike(like),
            models.Resident.last_name.ilike(like),
            models.Resident.mobile_number.ilike(like),
            models.Resident.email.ilike(like),
            models.Resident.resident_id.ilike(like),
            models.Resident.pan_number.ilike(like),
            models.Resident.voter_id.ilike(like),
            models.Resident.ration_card_number.ilike(like),
        ))
    if village:
        query = query.filter(models.Resident.village.ilike(f"%{village}%"))
    if ward:
        query = query.filter(models.Resident.ward_number == ward)
    if category:
        query = query.filter(models.Resident.category == category)
    if gender:
        query = query.filter(models.Resident.gender == gender)
    if family_id:
        query = query.filter(models.Resident.family_id == family_id)

    # Sorting
    sort_map = {
        "created_at": models.Resident.created_at,
        "first_name": models.Resident.first_name,
        "last_name": models.Resident.last_name,
        "age": models.Resident.age,
        "village": models.Resident.village,
    }
    sort_field, _, sort_dir = sort.partition(":")
    sort_col = sort_map.get(sort_field, models.Resident.created_at)
    query = query.order_by(sort_col.desc() if sort_dir == "desc" else sort_col.asc())

    items, total, pages = paginate(query, page, per_page)
    reveal = bool(user.role and user.role.name == "admin")
    return {
        "items": [_to_out(r, reveal_aadhaar=reveal) for r in items],
        "total": total, "page": page, "per_page": per_page, "pages": pages,
    }


@router.get("/suggest")
def suggest(q: str = "", limit: int = 10,
            db: Session = Depends(get_db),
            user: models.User = Depends(auth.require_admin_or_operator)):
    """Quick type-ahead suggestions for the global search bar."""
    if not q or len(q) < 2:
        return {"items": []}
    like = f"%{q}%"
    rows = db.query(models.Resident.id, models.Resident.resident_id,
                    models.Resident.first_name, models.Resident.last_name,
                    models.Resident.mobile_number, models.Resident.village)\
        .filter(or_(
            models.Resident.first_name.ilike(like),
            models.Resident.last_name.ilike(like),
            models.Resident.mobile_number.ilike(like),
            models.Resident.resident_id.ilike(like),
        )).limit(min(max(limit, 1), 30)).all()
    return {"items": [{
        "id": r.id, "resident_id": r.resident_id,
        "name": f"{r.first_name} {r.last_name or ''}".strip(),
        "mobile": r.mobile_number, "village": r.village,
    } for r in rows]}


@router.get("/{resident_id}")
def get_resident(resident_id: int,
                 db: Session = Depends(get_db),
                 user: models.User = Depends(auth.require_admin_or_operator)):
    r = db.query(models.Resident).filter(models.Resident.id == resident_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Resident not found.")
    reveal = bool(user.role and user.role.name == "admin")
    return _to_out(r, reveal_aadhaar=reveal)


@router.post("", status_code=status.HTTP_201_CREATED)
def create_resident(payload: ResidentCreate, request: Request,
                    db: Session = Depends(get_db),
                    user: models.User = Depends(auth.require_admin_or_operator)):
    data = payload.model_dump(exclude_unset=True)

    # Aadhaar encryption
    aadhaar_plain = data.pop("aadhaar", None)
    aadhaar_encrypted = encrypt(aadhaar_plain) if aadhaar_plain else None

    # Compute age from DOB
    dob_date = _parse_dob(data.get("dob"))
    age = calculate_age(data["dob"]) if data.get("dob") else None

    # Family linkage
    family_db_id = None
    if data.get("family_id"):
        fam = db.query(models.Family).filter(models.Family.family_id == data["family_id"]).first()
        if fam:
            family_db_id = fam.id
            if data.get("is_head_of_family"):
                fam.head_name = f"{data['first_name']} {data.get('last_name') or ''}".strip()
                db.add(fam)

    resident = models.Resident(
        resident_id=generate_resident_id(),
        first_name=data["first_name"],
        middle_name=data.get("middle_name"),
        last_name=data.get("last_name"),
        gender=data.get("gender"),
        dob=dob_date,
        age=age,
        mobile_number=data.get("mobile_number"),
        alternate_number=data.get("alternate_number"),
        email=data.get("email"),
        address=data.get("address"),
        village=data.get("village"),
        taluka=data.get("taluka"),
        district=data.get("district"),
        state=data.get("state"),
        pin_code=data.get("pin_code"),
        ward_number=data.get("ward_number"),
        aadhaar_encrypted=aadhaar_encrypted,
        pan_number=data.get("pan_number"),
        voter_id=data.get("voter_id"),
        ration_card_number=data.get("ration_card_number"),
        occupation=data.get("occupation"),
        annual_income=data.get("annual_income"),
        religion=data.get("religion"),
        category=data.get("category"),
        caste=data.get("caste"),
        family_id=data.get("family_id"),
        family_db_id=family_db_id,
        is_head_of_family=data.get("is_head_of_family", False),
        remarks=data.get("remarks"),
    )
    db.add(resident)
    db.commit()
    db.refresh(resident)
    record_audit(db, user, "create_resident", "resident", resident.id,
                 f"Created resident {resident.first_name} {resident.last_name or ''}", request)
    reveal = bool(user.role and user.role.name == "admin")
    return _to_out(resident, reveal_aadhaar=reveal)


@router.put("/{resident_id}")
def update_resident(resident_id: int, payload: ResidentUpdate, request: Request,
                    db: Session = Depends(get_db),
                    user: models.User = Depends(auth.require_admin_or_operator)):
    r = db.query(models.Resident).filter(models.Resident.id == resident_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Resident not found.")
    data = payload.model_dump(exclude_unset=True)

    aadhaar_plain = data.pop("aadhaar", None)
    if aadhaar_plain is not None:
        r.aadhaar_encrypted = encrypt(aadhaar_plain)

    if "dob" in data and data["dob"]:
        r.dob = _parse_dob(data["dob"])
        r.age = calculate_age(data["dob"])

    # Family re-link
    if "family_id" in data:
        if data["family_id"]:
            fam = db.query(models.Family).filter(models.Family.family_id == data["family_id"]).first()
            r.family_db_id = fam.id if fam else None
        else:
            r.family_db_id = None
    if "is_head_of_family" in data and data["is_head_of_family"]:
        if r.family_db_id:
            fam = db.query(models.Family).filter(models.Family.id == r.family_db_id).first()
            if fam:
                fam.head_name = f"{r.first_name} {r.last_name or ''}".strip()
                db.add(fam)

    # Apply remaining scalar fields
    skip = {"dob", "family_id", "is_head_of_family"}
    for k, v in data.items():
        if k in skip:
            continue
        if hasattr(r, k):
            setattr(r, k, v)
    if "is_head_of_family" in data:
        r.is_head_of_family = data["is_head_of_family"]
    if "family_id" in data:
        r.family_id = data["family_id"]

    db.commit()
    db.refresh(r)
    record_audit(db, user, "update_resident", "resident", r.id,
                 f"Updated resident {r.first_name} {r.last_name or ''}", request)
    reveal = bool(user.role and user.role.name == "admin")
    return _to_out(r, reveal_aadhaar=reveal)


@router.delete("/{resident_id}", response_model=MessageResponse)
def delete_resident(resident_id: int, request: Request,
                    db: Session = Depends(get_db),
                    user: models.User = Depends(auth.require_admin_or_operator)):
    r = db.query(models.Resident).filter(models.Resident.id == resident_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Resident not found.")
    name = f"{r.first_name} {r.last_name or ''}".strip()
    db.delete(r)
    db.commit()
    record_audit(db, user, "delete_resident", "resident", resident_id,
                 f"Deleted resident {name}", request)
    return {"message": f"Resident {name} deleted."}


@router.get("/{resident_id}/eligibility")
def resident_eligibility(resident_id: int,
                         db: Session = Depends(get_db),
                         user: models.User = Depends(auth.require_admin_or_operator)):
    """Run the smart eligibility engine for one resident."""
    from ..services.eligibility import evaluate_resident
    r = db.query(models.Resident).filter(models.Resident.id == resident_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Resident not found.")
    return {"items": [e.model_dump() for e in evaluate_resident(db, r)]}
