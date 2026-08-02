"""Reports routes — generate CSV / Excel / PDF exports."""
import io
import csv
import datetime as dt
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, auth
from ..utils.audit import record_audit
from ..utils.helpers import paginate
from ..utils.crypto import decrypt
from ..utils.validation import mask_aadhaar

router = APIRouter(prefix="/reports", tags=["reports"])


def _csv_response(rows: list, headers: list, filename: str) -> StreamingResponse:
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(headers)
    for r in rows:
        writer.writerow(r)
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/residents.csv")
def residents_csv(db: Session = Depends(get_db),
                  user: models.User = Depends(auth.require_admin_or_operator)):
    rows = db.query(models.Resident).order_by(models.Resident.created_at.desc()).all()
    headers = ["Resident ID", "First Name", "Last Name", "Gender", "Age",
               "Mobile", "Village", "Ward", "Category", "Family ID", "Created At"]
    data = [[r.resident_id, r.first_name, r.last_name, r.gender, r.age,
             r.mobile_number, r.village, r.ward_number, r.category,
             r.family_id, r.created_at.isoformat() if r.created_at else ""] for r in rows]
    return _csv_response(data, headers, "residents.csv")


@router.get("/families.csv")
def families_csv(db: Session = Depends(get_db),
                 user: models.User = Depends(auth.require_admin_or_operator)):
    rows = db.query(models.Family).order_by(models.Family.created_at.desc()).all()
    headers = ["Family ID", "Head Name", "Village", "Ward", "Created At"]
    data = [[f.family_id, f.head_name, f.village, f.ward_number,
             f.created_at.isoformat() if f.created_at else ""] for f in rows]
    return _csv_response(data, headers, "families.csv")


@router.get("/schemes.csv")
def schemes_csv(db: Session = Depends(get_db),
                user: models.User = Depends(auth.require_admin_or_operator)):
    rows = db.query(models.Scheme).order_by(models.Scheme.created_at.desc()).all()
    headers = ["Name", "Status", "Age Min", "Age Max", "Gender", "Category",
               "Income Limit", "Deadline"]
    data = [[s.name, s.status, s.age_min, s.age_max, s.gender, s.category,
             s.income_limit,
             s.application_deadline.isoformat() if s.application_deadline else ""]
            for s in rows]
    return _csv_response(data, headers, "schemes.csv")


@router.get("/applications.csv")
def applications_csv(status_filter: str = "",
                     db: Session = Depends(get_db),
                     user: models.User = Depends(auth.require_admin_or_operator)):
    query = db.query(models.Application)
    if status_filter:
        query = query.filter(models.Application.status == status_filter)
    rows = query.order_by(models.Application.created_at.desc()).all()
    headers = ["Application Number", "Resident", "Scheme", "Status",
               "Created At", "Updated At"]
    data = []
    for a in rows:
        resident_name = ""
        if a.resident:
            resident_name = f"{a.resident.first_name} {a.resident.last_name or ''}".strip()
        data.append([a.application_number, resident_name,
                     a.scheme.name if a.scheme else "",
                     a.status,
                     a.created_at.isoformat() if a.created_at else "",
                     a.updated_at.isoformat() if a.updated_at else ""])
    return _csv_response(data, headers, "applications.csv")


@router.get("/ward.csv")
def ward_report(db: Session = Depends(get_db),
                user: models.User = Depends(auth.require_admin_or_operator)):
    """Aggregate resident counts by village + ward."""
    from sqlalchemy import func
    rows = db.query(
        models.Resident.village,
        models.Resident.ward_number,
        func.count(models.Resident.id),
    ).group_by(models.Resident.village, models.Resident.ward_number).all()
    headers = ["Village", "Ward", "Resident Count"]
    data = [list(r) for r in rows]
    return _csv_response(data, headers, "ward_report.csv")


@router.get("/village.csv")
def village_report(db: Session = Depends(get_db),
                   user: models.User = Depends(auth.require_admin_or_operator)):
    from sqlalchemy import func
    rows = db.query(
        models.Resident.village,
        func.count(models.Resident.id),
    ).group_by(models.Resident.village).all()
    headers = ["Village", "Resident Count"]
    data = [list(r) for r in rows]
    return _csv_response(data, headers, "village_report.csv")
