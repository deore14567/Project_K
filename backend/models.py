"""
SQLAlchemy ORM models.
Tables: roles, users, sessions, families, residents, documents, schemes,
applications, application_timeline, audit_logs.
"""
import datetime as dt
from typing import Optional

from sqlalchemy import (
    Column, Integer, BigInteger, String, Text, Boolean, DateTime, Date,
    Float, ForeignKey, Index, LargeBinary, JSON,
)
from sqlalchemy.orm import relationship

from .database import Base


# ---------------------------------------------------------------------------
# Roles & Users
# ---------------------------------------------------------------------------
class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(String(255))

    users = relationship("User", back_populates="role")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=dt.datetime.utcnow, nullable=False)

    role = relationship("Role", back_populates="users")
    audit_logs = relationship("AuditLog", back_populates="user")


class Session(Base):
    """Tracks issued JWT tokens (for revocation / logout)."""
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    token_jti = Column(String(64), unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    issued_at = Column(DateTime, default=dt.datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    revoked = Column(Boolean, default=False, nullable=False)
    ip_address = Column(String(64))
    user_agent = Column(String(255))


# ---------------------------------------------------------------------------
# Family & Residents
# ---------------------------------------------------------------------------
class Family(Base):
    __tablename__ = "families"

    id = Column(Integer, primary_key=True, autoincrement=True)
    family_id = Column(String(32), unique=True, nullable=False, index=True)  # human-readable
    head_name = Column(String(255))
    village = Column(String(255), index=True)
    ward_number = Column(String(32), index=True)
    address = Column(Text)
    created_at = Column(DateTime, default=dt.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=dt.datetime.utcnow, onupdate=dt.datetime.utcnow)

    members = relationship("Resident", back_populates="family", foreign_keys="Resident.family_db_id")


class Resident(Base):
    __tablename__ = "residents"

    id = Column(Integer, primary_key=True, autoincrement=True)
    resident_id = Column(String(32), unique=True, nullable=False, index=True)

    # Name parts
    first_name = Column(String(100), nullable=False, index=True)
    middle_name = Column(String(100))
    last_name = Column(String(100), index=True)

    gender = Column(String(16))  # Male / Female / Other
    dob = Column(Date, index=True)
    age = Column(Integer)

    # Contact
    mobile_number = Column(String(20), index=True)
    alternate_number = Column(String(20))
    email = Column(String(255), index=True)

    # Address
    address = Column(Text)
    village = Column(String(255), index=True)
    taluka = Column(String(255), index=True)
    district = Column(String(255), index=True)
    state = Column(String(255))
    pin_code = Column(String(10), index=True)
    ward_number = Column(String(32), index=True)

    # Identity (sensitive — Aadhaar is encrypted)
    aadhaar_encrypted = Column(Text)        # Fernet-encrypted ciphertext
    pan_number = Column(String(20), index=True)
    voter_id = Column(String(32), index=True)
    ration_card_number = Column(String(32), index=True)
    farmer_id = Column(String(64), index=True)
    gat_number = Column(String(32), index=True)

    # Socio-economic
    occupation = Column(String(255))
    annual_income = Column(Float)
    religion = Column(String(64))
    category = Column(String(64), index=True)   # General / OBC / SC / ST
    caste = Column(String(128))

    # Family linkage
    family_db_id = Column(Integer, ForeignKey("families.id"), nullable=True, index=True)
    family_id = Column(String(32), index=True)  # denormalized for fast search
    is_head_of_family = Column(Boolean, default=False)

    remarks = Column(Text)

    created_at = Column(DateTime, default=dt.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=dt.datetime.utcnow, onupdate=dt.datetime.utcnow)

    family = relationship("Family", back_populates="members", foreign_keys=[family_db_id])
    documents = relationship("Document", back_populates="resident", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="resident", cascade="all, delete-orphan")


# ---------------------------------------------------------------------------
# Document Vault
# ---------------------------------------------------------------------------
class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, autoincrement=True)
    resident_id = Column(Integer, ForeignKey("residents.id"), nullable=False, index=True)

    doc_type = Column(String(64), nullable=False, index=True)  # Aadhaar / PAN / ...
    title = Column(String(255))
    file_name = Column(String(255))
    mime_type = Column(String(64))
    file_size = Column(Integer)
    file_data = Column(LargeBinary(length=(16 * 1024 * 1024)))  # up to 16 MB BLOB
    file_hash = Column(String(64), index=True)  # sha256 for dedup/versioning

    version = Column(Integer, default=1, nullable=False)
    is_latest = Column(Boolean, default=True, nullable=False, index=True)
    previous_version_id = Column(Integer, ForeignKey("documents.id"), nullable=True)

    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=dt.datetime.utcnow, nullable=False)

    resident = relationship("Resident", back_populates="documents")
    uploader = relationship("User")
    previous_version = relationship("Document", remote_side="Document.id", foreign_keys=[previous_version_id])


# ---------------------------------------------------------------------------
# Government Schemes & Applications
# ---------------------------------------------------------------------------
class Scheme(Base):
    __tablename__ = "schemes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text)
    benefits = Column(Text)
    eligibility = Column(Text)

    age_min = Column(Integer)
    age_max = Column(Integer)
    gender = Column(String(32))      # Any / Male / Female
    category = Column(String(64))    # Any / General / OBC / SC / ST
    income_limit = Column(Float)     # annual income cap in INR

    required_documents = Column(JSON)  # list of doc-type strings
    application_deadline = Column(Date, nullable=True)
    status = Column(String(32), default="active", index=True)  # active / closed / draft

    created_at = Column(DateTime, default=dt.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=dt.datetime.utcnow, onupdate=dt.datetime.utcnow)

    applications = relationship("Application", back_populates="scheme")


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    application_number = Column(String(32), unique=True, nullable=False, index=True)
    resident_id = Column(Integer, ForeignKey("residents.id"), nullable=False, index=True)
    scheme_id = Column(Integer, ForeignKey("schemes.id"), nullable=False, index=True)

    status = Column(String(32), default="applied", nullable=False, index=True)
    # applied / pending / processing / approved / rejected
    remarks = Column(Text)
    applied_by = Column(Integer, ForeignKey("users.id"), nullable=False)

    created_at = Column(DateTime, default=dt.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=dt.datetime.utcnow, onupdate=dt.datetime.utcnow)

    resident = relationship("Resident", back_populates="applications")
    scheme = relationship("Scheme", back_populates="applications")
    applicant = relationship("User")
    timeline = relationship("ApplicationTimeline", back_populates="application",
                            cascade="all, delete-orphan", order_by="ApplicationTimeline.created_at")


class ApplicationTimeline(Base):
    __tablename__ = "application_timeline"

    id = Column(Integer, primary_key=True, autoincrement=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False, index=True)
    status = Column(String(32), nullable=False)
    remarks = Column(Text)
    changed_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=dt.datetime.utcnow, nullable=False)

    application = relationship("Application", back_populates="timeline")
    actor = relationship("User")


# ---------------------------------------------------------------------------
# Audit Log
# ---------------------------------------------------------------------------
class AuditLog(Base):
    __tablename__ = "audit_logs"

    # Use Integer on SQLite (autoincrement works), BigInteger elsewhere.
    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    user_email = Column(String(255))  # denormalized for readability
    action = Column(String(64), nullable=False, index=True)
    entity_type = Column(String(64), index=True)
    entity_id = Column(String(64))
    description = Column(Text)
    ip_address = Column(String(64))
    user_agent = Column(String(255))
    created_at = Column(DateTime, default=dt.datetime.utcnow, nullable=False, index=True)

    user = relationship("User", back_populates="audit_logs")


# Helpful composite indexes for the global search
Index("idx_residents_name", Resident.first_name, Resident.last_name)
Index("idx_residents_loc", Resident.village, Resident.ward_number)
Index("idx_apps_status", Application.status, Application.created_at)
