"""
Authentication module.
Handles password hashing (bcrypt), JWT issuance/validation, and the
FastAPI dependencies used to protect endpoints.
"""
import datetime as dt
import uuid
from typing import Optional

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from .config import settings
from .database import get_db
from . import models

bearer_scheme = HTTPBearer(auto_error=False)


# ---------------------------------------------------------------------------
# Password hashing
# ---------------------------------------------------------------------------
def hash_password(password: str) -> str:
    """Return a bcrypt hash of the password."""
    if not password:
        raise ValueError("Password cannot be empty")
    pwd_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a plaintext password against a stored bcrypt hash."""
    if not password or not password_hash:
        return False
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except (ValueError, TypeError):
        return False


# ---------------------------------------------------------------------------
# JWT
# ---------------------------------------------------------------------------
def create_access_token(user: models.User) -> tuple[str, str]:
    """Return (jwt_token, jti). The jti is stored in `sessions` for revocation."""
    now = dt.datetime.utcnow()
    jti = uuid.uuid4().hex
    expires_at = now + dt.timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role.name if user.role else "operator",
        "name": user.full_name,
        "jti": jti,
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
    }
    token = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return token, jti


def decode_token(token: str) -> dict:
    """Decode and verify a JWT. Raises HTTPException on failure."""
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Token expired. Please log in again.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid authentication token.")


# ---------------------------------------------------------------------------
# FastAPI dependencies
# ---------------------------------------------------------------------------
def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    """Resolve the current user from the Bearer token."""
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Authentication required.")
    payload = decode_token(credentials.credentials)
    user_id = int(payload.get("sub", 0))
    jti = payload.get("jti")

    # Check session revocation
    session = db.query(models.Session).filter(models.Session.token_jti == jti).first()
    if not session or session.revoked:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Session has been revoked. Please log in again.")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="User not found or inactive.")
    return user


def require_admin(user: models.User = Depends(get_current_user)) -> models.User:
    """Require the current user to have admin or super_admin role."""
    if not user.role or user.role.name not in ("admin", "super_admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Administrator privileges required.")
    return user


def is_super_admin(user: models.User) -> bool:
    """Check if the user is a super admin (hidden, no audit logs)."""
    return bool(user.role and user.role.name == "super_admin")


def require_admin_or_operator(user: models.User = Depends(get_current_user)) -> models.User:
    """Require an authenticated user (admin or operator)."""
    if not user.role or user.role.name not in ("admin", "operator"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Insufficient privileges.")
    return user
