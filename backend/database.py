"""
Database engine and session management.
Uses SQLAlchemy ORM with a MySQL-compatible cloud database.
"""
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session

from .config import settings

# `pool_pre_ping` enables connection health checks before use — important
# for serverless / cloud MySQL where idle connections may be dropped.
# `pool_recycle` keeps connections fresh (TiDB/PlanetScale often drop at 1h).
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=280,
    pool_size=10,
    max_overflow=20,
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a scoped DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all tables (idempotent). Called on application startup."""
    # Import models so SQLAlchemy registers them on Base.metadata.
    from . import models  # noqa: F401
    Base.metadata.create_all(bind=engine)


def seed_admin_if_missing() -> None:
    """Create the bootstrap admin user if no admin exists."""
    from . import models, auth
    from .config import settings

    db = SessionLocal()
    try:
        existing = db.query(models.User).filter(models.User.email == settings.ADMIN_EMAIL).first()
        if existing:
            return
        admin_role = db.query(models.Role).filter(models.Role.name == "admin").first()
        if not admin_role:
            admin_role = models.Role(name="admin", description="Full access")
            db.add(admin_role)
            db.commit()
            db.refresh(admin_role)
        operator_role = db.query(models.Role).filter(models.Role.name == "operator").first()
        if not operator_role:
            operator_role = models.Role(name="operator", description="Limited access")
            db.add(operator_role)
            db.commit()
            db.refresh(operator_role)

        user = models.User(
            email=settings.ADMIN_EMAIL,
            full_name="System Administrator",
            password_hash=auth.hash_password(settings.ADMIN_PASSWORD),
            role_id=admin_role.id,
            is_active=True,
        )
        db.add(user)
        db.commit()
    finally:
        db.close()
