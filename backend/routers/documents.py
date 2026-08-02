"""Document vault routes — upload, preview, replace, delete, download."""
import base64
import datetime as dt
from typing import Optional, List

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, File as FAFile, Request, Response, status
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, auth
from ..schemas.schemas import MessageResponse
from ..utils.audit import record_audit
from ..utils.helpers import sha256_bytes, human_size
from ..config import settings

router = APIRouter(prefix="/documents", tags=["documents"])

ALLOWED_MIME = {
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
}

ALLOWED_DOC_TYPES = {
    "Aadhaar", "PAN", "Income Certificate", "Caste Certificate",
    "Birth Certificate", "Death Certificate", "Ration Card",
    "Election Card", "Passport", "Driving License",
    "Domicile Certificate", "Electricity Bill", "Water Bill", "Others",
}


def _to_out(d: models.Document) -> dict:
    return {
        "id": d.id,
        "resident_id": d.resident_id,
        "doc_type": d.doc_type,
        "title": d.title,
        "file_name": d.file_name,
        "mime_type": d.mime_type,
        "file_size": d.file_size,
        "file_size_human": human_size(d.file_size or 0),
        "version": d.version,
        "is_latest": d.is_latest,
        "uploaded_by": d.uploaded_by,
        "created_at": d.created_at.isoformat() if d.created_at else None,
    }


@router.get("")
def list_documents(resident_id: Optional[int] = None,
                   doc_type: Optional[str] = None,
                   page: int = 1, per_page: int = 20,
                   db: Session = Depends(get_db),
                   user: models.User = Depends(auth.require_admin_or_operator)):
    query = db.query(models.Document).filter(models.Document.is_latest.is_(True))
    if resident_id:
        query = query.filter(models.Document.resident_id == resident_id)
    if doc_type:
        query = query.filter(models.Document.doc_type == doc_type)
    query = query.order_by(models.Document.created_at.desc())
    total = query.count()
    pages = (total + per_page - 1) // per_page
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    return {"items": [_to_out(d) for d in items],
            "total": total, "page": page, "per_page": per_page, "pages": pages}


@router.get("/{doc_id}")
def get_document(doc_id: int,
                 db: Session = Depends(get_db),
                 user: models.User = Depends(auth.require_admin_or_operator)):
    d = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Document not found.")
    return _to_out(d)


@router.get("/{doc_id}/download")
def download_document(doc_id: int, request: Request,
                      db: Session = Depends(get_db),
                      user: models.User = Depends(auth.require_admin_or_operator)):
    d = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Document not found.")
    record_audit(db, user, "download_document", "document", d.id,
                 f"Downloaded {d.doc_type} ({d.file_name})", request)
    media = d.mime_type or "application/octet-stream"
    return Response(
        content=d.file_data,
        media_type=media,
        headers={"Content-Disposition": f'attachment; filename="{d.file_name}"'},
    )


@router.get("/{doc_id}/preview")
def preview_document(doc_id: int,
                     db: Session = Depends(get_db),
                     user: models.User = Depends(auth.require_admin_or_operator)):
    """Inline preview — returns the raw bytes with Content-Disposition: inline."""
    d = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Document not found.")
    media = d.mime_type or "application/octet-stream"
    return Response(
        content=d.file_data,
        media_type=media,
        headers={"Content-Disposition": f'inline; filename="{d.file_name}"'},
    )


@router.post("/upload", status_code=status.HTTP_201_CREATED)
def upload_document(
    resident_id: int = Form(...),
    doc_type: str = Form(...),
    title: Optional[str] = Form(None),
    file: UploadFile = File(...),
    request: Request = None,
    db: Session = Depends(get_db),
    user: models.User = Depends(auth.require_admin_or_operator),
):
    if doc_type not in ALLOWED_DOC_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported document type '{doc_type}'.")

    resident = db.query(models.Resident).filter(models.Resident.id == resident_id).first()
    if not resident:
        raise HTTPException(status_code=404, detail="Resident not found.")

    mime = file.content_type or ""
    if mime not in ALLOWED_MIME:
        raise HTTPException(status_code=400,
                            detail=f"Unsupported file type '{mime}'. Allowed: PDF, JPG, PNG.")

    raw = file.file.read()
    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    if len(raw) > max_bytes:
        raise HTTPException(status_code=413,
                            detail=f"File exceeds {settings.MAX_UPLOAD_MB} MB limit.")

    file_hash = sha256_bytes(raw)

    # Find any previous version of the same doc_type for this resident
    prev = db.query(models.Document).filter(
        models.Document.resident_id == resident_id,
        models.Document.doc_type == doc_type,
        models.Document.is_latest.is_(True),
    ).order_by(models.Document.version.desc()).first()

    new_version = (prev.version + 1) if prev else 1
    if prev:
        prev.is_latest = False
        db.add(prev)

    doc = models.Document(
        resident_id=resident_id,
        doc_type=doc_type,
        title=title or file.filename,
        file_name=file.filename,
        mime_type=mime,
        file_size=len(raw),
        file_data=raw,
        file_hash=file_hash,
        version=new_version,
        is_latest=True,
        previous_version_id=prev.id if prev else None,
        uploaded_by=user.id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    record_audit(db, user, "upload_document", "document", doc.id,
                 f"Uploaded {doc_type} v{new_version} for resident #{resident_id}", request)
    return _to_out(doc)


@router.get("/{doc_id}/versions")
def document_versions(doc_id: int,
                      db: Session = Depends(get_db),
                      user: models.User = Depends(auth.require_admin_or_operator)):
    d = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Document not found.")
    # Find the resident's docs of the same type
    rows = db.query(models.Document).filter(
        models.Document.resident_id == d.resident_id,
        models.Document.doc_type == d.doc_type,
    ).order_by(models.Document.version.desc()).all()
    return {"items": [_to_out(r) for r in rows]}


@router.delete("/{doc_id}", response_model=MessageResponse)
def delete_document(doc_id: int, request: Request,
                    db: Session = Depends(get_db),
                    user: models.User = Depends(auth.require_admin_or_operator)):
    d = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Document not found.")
    db.delete(d)
    db.commit()
    record_audit(db, user, "delete_document", "document", doc_id,
                 f"Deleted {d.doc_type} ({d.file_name})", request)
    return {"message": "Document deleted."}
