"""Authentication routes: login, logout, current-user."""
import datetime as dt
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, auth
from ..schemas.schemas import LoginRequest, TokenResponse, UserOut
from ..utils.audit import record_audit

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email.lower()).first()
    if not user or not auth.verify_password(payload.password, user.password_hash):
        record_audit(db, None, "login_failed", "user", payload.email,
                     f"Failed login for {payload.email}", request)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid email or password.")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Account is disabled. Contact administrator.")

    token, jti = auth.create_access_token(user)
    session_row = models.Session(
        token_jti=jti,
        user_id=user.id,
        issued_at=dt.datetime.utcnow(),
        expires_at=dt.datetime.utcnow() + dt.timedelta(minutes=480),
        ip_address=request.client.host if request.client else "",
        user_agent=request.headers.get("user-agent", "")[:255],
    )
    db.add(session_row)
    user.last_login = dt.datetime.utcnow()
    db.commit()

    record_audit(db, user, "login", "user", user.id, f"User {user.email} logged in", request)

    role_name = user.role.name if user.role else "operator"
    return TokenResponse(
        access_token=token,
        user=UserOut(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=role_name,
            is_active=user.is_active,
            last_login=user.last_login,
        ),
    )


@router.post("/logout")
def logout(request: Request,
           user: models.User = Depends(auth.get_current_user),
           db: Session = Depends(get_db)):
    """Revoke the current session token."""
    # The dependency already validated the token; we need the jti to revoke.
    # We re-decode here because FastAPI's dependency chain does not surface it.
    from fastapi.security import HTTPAuthorizationCredentials
    # Pull the raw header manually because get_current_user consumed it.
    auth_header = request.headers.get("authorization", "")
    parts = auth_header.split()
    if len(parts) == 2:
        try:
            payload = auth.decode_token(parts[1])
            jti = payload.get("jti")
            if jti:
                session = db.query(models.Session).filter(models.Session.token_jti == jti).first()
                if session:
                    session.revoked = True
                    db.commit()
        except HTTPException:
            pass
    record_audit(db, user, "logout", "user", user.id, f"User {user.email} logged out", request)
    return {"message": "Logged out successfully."}


@router.get("/me", response_model=UserOut)
def me(user: models.User = Depends(auth.get_current_user)):
    return UserOut(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role.name if user.role else "operator",
        is_active=user.is_active,
        last_login=user.last_login,
    )
