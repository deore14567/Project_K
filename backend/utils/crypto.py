"""
Sensitive-data encryption helper.
Uses Fernet symmetric encryption (AES-128-CBC + HMAC-SHA256) to encrypt
Aadhaar numbers at rest. Only admins can decrypt/reveal the full value.
"""
import base64
import hashlib
from typing import Optional

from cryptography.fernet import Fernet, InvalidToken

from ..config import settings


def _get_key() -> bytes:
    """Derive a stable Fernet key from the configured ENCRYPTION_KEY.

    The configured value may be a real Fernet key (44-char base64) or an
    arbitrary passphrase. We normalize both to a valid 32-byte key.
    """
    raw = settings.ENCRYPTION_KEY or "village-setu-default-key"
    if len(raw) == 44 and raw.endswith("="):
        try:
            return raw.encode("utf-8")
        except Exception:
            pass
    digest = hashlib.sha256(raw.encode("utf-8")).digest()
    return base64.urlsafe_b64encode(digest)


_fernet = Fernet(_get_key())


def encrypt(value: Optional[str]) -> Optional[str]:
    if value is None or value == "":
        return None
    return _fernet.encrypt(value.encode("utf-8")).decode("utf-8")


def decrypt(value: Optional[str]) -> Optional[str]:
    if value is None or value == "":
        return None
    try:
        return _fernet.decrypt(value.encode("utf-8")).decode("utf-8")
    except (InvalidToken, Exception):
        return None
