"""
Pydantic schemas for request/response validation.
Mirrors the SQLAlchemy models with sane defaults and validation rules.
"""
import datetime as dt
from typing import Optional, List, Any

from pydantic import BaseModel, Field, EmailStr, field_validator, ConfigDict

from ..utils.validation import (
    validate_aadhaar, validate_pan, validate_mobile, validate_email,
    validate_pin, validate_dob, calculate_age, normalize_aadhaar,
)


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    last_login: Optional[dt.datetime] = None
    model_config = ConfigDict(from_attributes=True)


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=6, max_length=128)
    role: str = Field("operator", pattern=r"^(admin|operator)$")


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    password: Optional[str] = Field(None, min_length=6, max_length=128)
    role: Optional[str] = Field(None, pattern=r"^(admin|operator)$")
    is_active: Optional[bool] = None


# ---------------------------------------------------------------------------
# Family
# ---------------------------------------------------------------------------
class FamilyCreate(BaseModel):
    head_name: Optional[str] = None
    village: Optional[str] = None
    ward_number: Optional[str] = None
    address: Optional[str] = None


class FamilyOut(BaseModel):
    id: int
    family_id: str
    head_name: Optional[str]
    village: Optional[str]
    ward_number: Optional[str]
    address: Optional[str]
    member_count: int = 0
    created_at: dt.datetime
    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Resident
# ---------------------------------------------------------------------------
class ResidentBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    middle_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    gender: Optional[str] = Field(None, pattern=r"^(Male|Female|Other)$")
    dob: Optional[str] = None
    mobile_number: Optional[str] = None
    alternate_number: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    village: Optional[str] = None
    taluka: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    pin_code: Optional[str] = None
    ward_number: Optional[str] = None
    aadhaar: Optional[str] = None
    pan_number: Optional[str] = None
    voter_id: Optional[str] = None
    ration_card_number: Optional[str] = None
    occupation: Optional[str] = None
    annual_income: Optional[float] = None
    religion: Optional[str] = None
    category: Optional[str] = None
    caste: Optional[str] = None
    family_id: Optional[str] = None
    is_head_of_family: bool = False
    remarks: Optional[str] = None

    @field_validator("dob")
    @classmethod
    def _check_dob(cls, v):
        if v and not validate_dob(v):
            raise ValueError("Invalid DOB — must be a valid past date (YYYY-MM-DD).")
        return v

    @field_validator("mobile_number", "alternate_number")
    @classmethod
    def _check_mobile(cls, v):
        if v and not validate_mobile(v):
            raise ValueError("Invalid mobile number — must be a 10-digit Indian mobile.")
        return v

    @field_validator("email")
    @classmethod
    def _check_email(cls, v):
        if v and not validate_email(v):
            raise ValueError("Invalid email address.")
        return v

    @field_validator("pin_code")
    @classmethod
    def _check_pin(cls, v):
        if v and not validate_pin(v):
            raise ValueError("Invalid PIN code — must be 6 digits.")
        return v

    @field_validator("aadhaar")
    @classmethod
    def _check_aadhaar(cls, v):
        if v and not validate_aadhaar(v):
            raise ValueError("Invalid Aadhaar number — must be 12 digits.")
        return normalize_aadhaar(v) if v else v

    @field_validator("pan_number")
    @classmethod
    def _check_pan(cls, v):
        if v and not validate_pan(v):
            raise ValueError("Invalid PAN number (format: ABCDE1234F).")
        return v.upper().strip() if v else v


class ResidentCreate(ResidentBase):
    pass


class ResidentUpdate(ResidentBase):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    # all fields optional for patch


class ResidentOut(BaseModel):
    id: int
    resident_id: str
    first_name: str
    middle_name: Optional[str]
    last_name: Optional[str]
    gender: Optional[str]
    dob: Optional[dt.date]
    age: Optional[int]
    mobile_number: Optional[str]
    alternate_number: Optional[str]
    email: Optional[str]
    address: Optional[str]
    village: Optional[str]
    taluka: Optional[str]
    district: Optional[str]
    state: Optional[str]
    pin_code: Optional[str]
    ward_number: Optional[str]
    # Masked by default — admin endpoints add `aadhaar` plaintext field
    aadhaar_masked: Optional[str] = None
    aadhaar: Optional[str] = None  # populated only for admins
    pan_number: Optional[str]
    voter_id: Optional[str]
    ration_card_number: Optional[str]
    occupation: Optional[str]
    annual_income: Optional[float]
    religion: Optional[str]
    category: Optional[str]
    caste: Optional[str]
    family_id: Optional[str]
    is_head_of_family: bool
    remarks: Optional[str]
    created_at: dt.datetime
    updated_at: Optional[dt.datetime]
    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Documents
# ---------------------------------------------------------------------------
class DocumentOut(BaseModel):
    id: int
    resident_id: int
    doc_type: str
    title: Optional[str]
    file_name: Optional[str]
    mime_type: Optional[str]
    file_size: Optional[int]
    version: int
    is_latest: bool
    created_at: dt.datetime
    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Schemes
# ---------------------------------------------------------------------------
class SchemeBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    benefits: Optional[str] = None
    eligibility: Optional[str] = None
    age_min: Optional[int] = Field(None, ge=0, le=130)
    age_max: Optional[int] = Field(None, ge=0, le=130)
    gender: Optional[str] = Field(None, pattern=r"^(Any|Male|Female)$")
    category: Optional[str] = Field(None, pattern=r"^(Any|General|OBC|SC|ST|EWS)$")
    income_limit: Optional[float] = Field(None, ge=0)
    required_documents: Optional[List[str]] = None
    application_deadline: Optional[dt.date] = None
    status: str = Field("active", pattern=r"^(active|closed|draft)$")


class SchemeCreate(SchemeBase):
    pass


class SchemeUpdate(SchemeBase):
    name: Optional[str] = Field(None, min_length=1, max_length=255)


class SchemeOut(SchemeBase):
    id: int
    created_at: dt.datetime
    updated_at: Optional[dt.datetime]
    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Applications
# ---------------------------------------------------------------------------
class ApplicationCreate(BaseModel):
    resident_id: int
    scheme_id: int
    remarks: Optional[str] = None


class ApplicationStatusUpdate(BaseModel):
    status: str = Field(..., pattern=r"^(applied|pending|processing|approved|rejected)$")
    remarks: Optional[str] = None


class TimelineOut(BaseModel):
    id: int
    status: str
    remarks: Optional[str]
    changed_by: Optional[int]
    actor_name: Optional[str] = None
    created_at: dt.datetime


class ApplicationOut(BaseModel):
    id: int
    application_number: str
    resident_id: int
    scheme_id: int
    resident_name: Optional[str] = None
    scheme_name: Optional[str] = None
    status: str
    remarks: Optional[str]
    applied_by: Optional[int]
    created_at: dt.datetime
    updated_at: Optional[dt.datetime]
    timeline: List[TimelineOut] = []
    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Eligibility
# ---------------------------------------------------------------------------
class EligibilityResult(BaseModel):
    scheme_id: int
    scheme_name: str
    status: str  # eligible / possibly_eligible / not_eligible
    reasons: List[str] = []


# ---------------------------------------------------------------------------
# Audit
# ---------------------------------------------------------------------------
class AuditLogOut(BaseModel):
    id: int
    user_email: Optional[str]
    action: str
    entity_type: Optional[str]
    entity_id: Optional[str]
    description: Optional[str]
    ip_address: Optional[str]
    user_agent: Optional[str]
    created_at: dt.datetime
    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Generic
# ---------------------------------------------------------------------------
class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    per_page: int
    pages: int


class MessageResponse(BaseModel):
    message: str
    detail: Optional[Any] = None


class DashboardStats(BaseModel):
    total_residents: int
    total_families: int
    total_documents: int
    total_schemes: int
    pending_applications: int
    approved_applications: int
    rejected_applications: int
    recent_activity: List[AuditLogOut] = []
    recent_residents: List[dict] = []
    latest_schemes: List[dict] = []


TokenResponse.model_rebuild()
