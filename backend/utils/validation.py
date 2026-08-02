"""
Input validation helpers.
Provides format validators for Indian identifiers and contact info.
"""
import re
import datetime as dt
from typing import Optional


# Aadhaar: 12 digits, first digit cannot be 0 or 1
_AADHAAR_RE = re.compile(r"^[2-9]\d{11}$")

# PAN: 5 letters, 4 digits, 1 letter  (e.g. ABCDE1234F)
_PAN_RE = re.compile(r"^[A-Z]{5}[0-9]{4}[A-Z]$")

# Indian mobile: optional +91, then 10 digits starting 6-9
_MOBILE_RE = re.compile(r"^(\+91[\-\s]?)?[6-9]\d{9}$")

# PIN code: 6 digits
_PIN_RE = re.compile(r"^[1-9]\d{5}$")

# Email (RFC-5322 simplified)
_EMAIL_RE = re.compile(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$")

# Voter ID: 3 letters + 7 digits (e.g. ABC1234567)
_VOTER_RE = re.compile(r"^[A-Z]{3}[0-9]{7}$")

# Ration card: alphanumeric, 8-12 chars
_RATION_RE = re.compile(r"^[A-Z0-9]{8,12}$")


def normalize_aadhaar(value: Optional[str]) -> Optional[str]:
    """Strip spaces/dashes from an Aadhaar number."""
    if not value:
        return None
    return re.sub(r"[\s\-]", "", value)


def validate_aadhaar(value: Optional[str]) -> bool:
    """Return True if `value` is a syntactically valid 12-digit Aadhaar."""
    if not value:
        return False
    v = normalize_aadhaar(value)
    return bool(_AADHAAR_RE.match(v or ""))


def validate_pan(value: Optional[str]) -> bool:
    if not value:
        return False
    return bool(_PAN_RE.match(value.upper().strip()))


def validate_mobile(value: Optional[str]) -> bool:
    if not value:
        return False
    return bool(_MOBILE_RE.match(value.strip()))


def validate_email(value: Optional[str]) -> bool:
    if not value:
        return False
    return bool(_EMAIL_RE.match(value.strip().lower()))


def validate_pin(value: Optional[str]) -> bool:
    if not value:
        return False
    return bool(_PIN_RE.match(value.strip()))


def validate_voter_id(value: Optional[str]) -> bool:
    if not value:
        return False
    return bool(_VOTER_RE.match(value.upper().strip()))


def validate_ration_card(value: Optional[str]) -> bool:
    if not value:
        return False
    return bool(_RATION_RE.match(value.upper().strip()))


def validate_dob(value: Optional[str]) -> bool:
    """DOB must be a past date and the person must be <= 130 years old."""
    if not value:
        return False
    try:
        d = dt.date.fromisoformat(value)
    except (ValueError, TypeError):
        return False
    if d > dt.date.today():
        return False
    if (dt.date.today() - d).days > 130 * 365:
        return False
    return True


def calculate_age(dob_str: str) -> Optional[int]:
    """Calculate age in years from a YYYY-MM-DD string."""
    try:
        d = dt.date.fromisoformat(dob_str)
    except (ValueError, TypeError):
        return None
    today = dt.date.today()
    age = today.year - d.year - ((today.month, today.day) < (d.month, d.day))
    return age if age >= 0 else 0


def mask_aadhaar(aadhaar: Optional[str]) -> str:
    """Mask an Aadhaar number as `XXXX XXXX 1234`."""
    if not aadhaar:
        return ""
    v = normalize_aadhaar(aadhaar) or ""
    if len(v) != 12:
        return "XXXX XXXX XXXX"
    return f"XXXX XXXX {v[-4:]}"


def mask_email(email: Optional[str]) -> str:
    if not email or "@" not in email:
        return email or ""
    name, domain = email.split("@", 1)
    if len(name) <= 2:
        return f"**@{domain}"
    return f"{name[0]}{'*' * (len(name) - 2)}{name[-1]}@{domain}"


def mask_mobile(mobile: Optional[str]) -> str:
    if not mobile:
        return ""
    digits = re.sub(r"\D", "", mobile)
    if len(digits) < 10:
        return mobile
    last4 = digits[-4:]
    return f"XXXXXX{last4}"
