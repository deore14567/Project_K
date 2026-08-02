"""
Application configuration module.
Loads environment variables and exposes them as a Settings instance.
Never hardcode secrets — everything comes from the environment.
"""
import os
from typing import Optional

from dotenv import load_dotenv

# Load .env file when running locally / on a regular server.
# On Vercel, environment variables are injected by the platform.
load_dotenv()


class Settings:
    """Centralized application settings sourced from environment variables."""

    # --- Database -----------------------------------------------------------
    # Example: mysql+pymysql://user:pass@host:3306/dbname?ssl_ca=...
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "mysql+pymysql://root:root@localhost:3306/village_setu",
    )

    # --- Auth / JWT ---------------------------------------------------------
    JWT_SECRET: str = os.getenv("JWT_SECRET", "change-me-in-production-please")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", "480"))  # 8h

    # --- Bootstrap admin ----------------------------------------------------
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "admin@villagesetu.gov.in")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "Admin@12345")

    # --- File uploads -------------------------------------------------------
    # NOTE: On Vercel, the filesystem is read-only except for /tmp.
    # Files are stored as base64 inside the database so the system works
    # statelessly across Vercel instances. UPLOAD_FOLDER is used only
    # when running on a traditional server (local dev / Railway / VPS).
    UPLOAD_FOLDER: str = os.getenv("UPLOAD_FOLDER", "uploads")
    MAX_UPLOAD_MB: int = int(os.getenv("MAX_UPLOAD_MB", "5"))

    # --- Encryption (Aadhaar) ----------------------------------------------
    # Fernet key used for reversible encryption of sensitive fields.
    # Generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
    ENCRYPTION_KEY: str = os.getenv(
        "ENCRYPTION_KEY",
        "replace-this-with-a-real-fernet-key-in-production==",
    )

    # --- CORS ---------------------------------------------------------------
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "*")

    # --- App meta -----------------------------------------------------------
    APP_NAME: str = os.getenv("APP_NAME", "Village Setu")
    APP_ENV: str = os.getenv("APP_ENV", "production")


settings = Settings()


def ensure_upload_folder() -> None:
    """Create the upload folder if it does not exist (no-op on Vercel)."""
    try:
        os.makedirs(settings.UPLOAD_FOLDER, exist_ok=True)
    except OSError:
        # Likely read-only filesystem (Vercel). That's fine — we store
        # files as base64 in the database in that case.
        pass
