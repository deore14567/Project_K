"""User management routes (admin-only)."""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from ..database import get_db
from .. import models, auth
from ..schemas.schemas import UserCreate, UserUpdate, UserOut, MessageResponse
from ..utils.audit import record_audit
from ..utils.helpers import paginate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=dict)
def list_users(page: int = 1, per_page: int = 20, q: str = "",
               db: Session = Depends(get_db),
               user: models.User = Depends(auth.require_admin)):
    query = db.query(models.User).join(models.Role)
    # Hide super_admin users from the list — they are invisible to regular admins
    query = query.filter(models.Role.name != "super_admin")
    if q:
        like = f"%{q}%"
        query = query.filter(or_(models.User.email.ilike(like),
                                 models.User.full_name.ilike(like)))
    query = query.order_by(models.User.created_at.desc())
    items, total, pages = paginate(query, page, per_page)
    return {
        "items": [UserOut(
            id=u.id, email=u.email, full_name=u.full_name,
            role=u.role.name if u.role else "operator",
            is_active=u.is_active, last_login=u.last_login,
        ).model_dump() for u in items],
        "total": total, "page": page, "per_page": per_page, "pages": pages,
    }


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, request: Request,
                db: Session = Depends(get_db),
                user: models.User = Depends(auth.require_admin)):
    existing = db.query(models.User).filter(models.User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered.")
    role = db.query(models.Role).filter(models.Role.name == payload.role).first()
    if not role:
        raise HTTPException(status_code=400, detail=f"Unknown role '{payload.role}'.")
    new_user = models.User(
        email=payload.email.lower(),
        full_name=payload.full_name,
        password_hash=auth.hash_password(payload.password),
        role_id=role.id,
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    record_audit(db, user, "create_user", "user", new_user.id,
                 f"Created user {new_user.email} ({payload.role})", request)
    return UserOut(
        id=new_user.id, email=new_user.email, full_name=new_user.full_name,
        role=role.name, is_active=new_user.is_active, last_login=None,
    )


@router.put("/{user_id}", response_model=UserOut)
def update_user(user_id: int, payload: UserUpdate, request: Request,
                db: Session = Depends(get_db),
                user: models.User = Depends(auth.require_admin)):
    target = db.query(models.User).filter(models.User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")
    if payload.full_name:
        target.full_name = payload.full_name
    if payload.password:
        target.password_hash = auth.hash_password(payload.password)
    if payload.role:
        role = db.query(models.Role).filter(models.Role.name == payload.role).first()
        if not role:
            raise HTTPException(status_code=400, detail=f"Unknown role '{payload.role}'.")
        target.role_id = role.id
    if payload.is_active is not None:
        target.is_active = payload.is_active
    db.commit()
    db.refresh(target)
    record_audit(db, user, "update_user", "user", target.id,
                 f"Updated user {target.email}", request)
    return UserOut(
        id=target.id, email=target.email, full_name=target.full_name,
        role=target.role.name if target.role else "operator",
        is_active=target.is_active, last_login=target.last_login,
    )


@router.delete("/{user_id}", response_model=MessageResponse)
def delete_user(user_id: int, request: Request,
                db: Session = Depends(get_db),
                user: models.User = Depends(auth.require_admin)):
    if user_id == user.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account.")
    target = db.query(models.User).filter(models.User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")
    email = target.email
    db.delete(target)
    db.commit()
    record_audit(db, user, "delete_user", "user", user_id,
                 f"Deleted user {email}", request)
    return {"message": f"User {email} deleted."}
