"""
Village Setu / Cybercafe Database Management System
====================================================

FastAPI entry point. Also serves the static frontend (HTML/CSS/JS).

Deployment:
  - Local dev:  uvicorn backend.main:app --reload --port 8000
  - Vercel:     configured via /vercel.json (each request becomes a serverless call)
"""
import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware

from .config import settings, ensure_upload_folder
from .database import init_db, seed_admin_if_missing
from .routers import (
    auth as auth_router,
    users as users_router,
    residents as residents_router,
    families as families_router,
    documents as documents_router,
    schemes as schemes_router,
    applications as applications_router,
    audit as audit_router,
    reports as reports_router,
    dashboard as dashboard_router,
)

# --- Resolve frontend folder ---------------------------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")


app = FastAPI(
    title=settings.APP_NAME,
    description="Online-only Village Setu / Cybercafe Database Management System",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)


# --- CORS ----------------------------------------------------------------
origins = ["*"] if settings.CORS_ORIGINS == "*" else [
    o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Security headers ----------------------------------------------------
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        return response


app.add_middleware(SecurityHeadersMiddleware)


# --- Routers -------------------------------------------------------------
api_prefix = "/api"
app.include_router(auth_router.router, prefix=api_prefix)
app.include_router(users_router.router, prefix=api_prefix)
app.include_router(residents_router.router, prefix=api_prefix)
app.include_router(families_router.router, prefix=api_prefix)
app.include_router(documents_router.router, prefix=api_prefix)
app.include_router(schemes_router.router, prefix=api_prefix)
app.include_router(applications_router.router, prefix=api_prefix)
app.include_router(audit_router.router, prefix=api_prefix)
app.include_router(reports_router.router, prefix=api_prefix)
app.include_router(dashboard_router.router, prefix=api_prefix)


# --- Static frontend -----------------------------------------------------
# Mount CSS/JS/assets for direct access
for sub in ("css", "js", "assets"):
    p = os.path.join(FRONTEND_DIR, sub)
    if os.path.isdir(p):
        app.mount(f"/{sub}", StaticFiles(directory=p), name=sub)


@app.get("/")
def root():
    """Serve the landing page (redirects to dashboard or login)."""
    index_path = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.isfile(index_path):
        return FileResponse(index_path)
    return {"message": "Village Setu API is running. Visit /api/docs for documentation."}


# Frontend HTML routes — explicit so they work without trailing slashes
@app.get("/{page}.html")
def serve_html(page: str):
    safe = "".join(c for c in page if c.isalnum() or c in ("-", "_"))
    path = os.path.join(FRONTEND_DIR, f"{safe}.html")
    if not os.path.isfile(path):
        return JSONResponse({"detail": "Page not found."}, status_code=404)
    return FileResponse(path)


@app.get("/health")
def health():
    return {"status": "ok", "app": settings.APP_NAME, "env": settings.APP_ENV}


# --- Startup -------------------------------------------------------------
@app.on_event("startup")
def _startup():
    ensure_upload_folder()
    try:
        init_db()
        seed_admin_if_missing()
    except Exception as e:
        # On Vercel cold-starts, if the DB is unreachable we still want the
        # process to come up so /api/docs is accessible for debugging.
        import logging
        logging.getLogger("village_setu").exception(f"DB init failed: {e}")
