"""
Smart Eligibility Engine.
Compares a resident's profile against every active scheme and returns
a list of (status, reasons) tuples.

Status values:
  - eligible           : resident satisfies every hard constraint
  - possibly_eligible  : resident satisfies most constraints but is missing
                          a required document, OR a soft constraint is unknown
  - not_eligible       : resident fails a hard constraint (age/gender/category/income)
"""
from typing import List, Tuple
from sqlalchemy.orm import Session

from .. import models
from ..schemas.schemas import EligibilityResult


def evaluate_resident(db: Session, resident: models.Resident) -> List[EligibilityResult]:
    """Return eligibility results for every active scheme for this resident."""
    schemes = db.query(models.Scheme).filter(models.Scheme.status == "active").all()
    out: List[EligibilityResult] = []

    # Pre-load the resident's documents (set of doc_type strings)
    have_docs = {d.doc_type for d in db.query(models.Document.doc_type)
                .filter(models.Document.resident_id == resident.id,
                        models.Document.is_latest.is_(True)).all()}

    for scheme in schemes:
        status, reasons = _evaluate_one(resident, scheme, have_docs)
        out.append(EligibilityResult(
            scheme_id=scheme.id,
            scheme_name=scheme.name,
            status=status,
            reasons=reasons,
        ))
    return out


def _evaluate_one(
    resident: models.Resident,
    scheme: models.Scheme,
    have_docs: set,
) -> Tuple[str, List[str]]:
    reasons: List[str] = []
    hard_fail = False
    soft_miss = False

    # Age
    if resident.age is not None:
        if scheme.age_min is not None and resident.age < scheme.age_min:
            reasons.append(f"Age {resident.age} is below the minimum required ({scheme.age_min}).")
            hard_fail = True
        elif scheme.age_max is not None and resident.age > scheme.age_max:
            reasons.append(f"Age {resident.age} is above the maximum allowed ({scheme.age_max}).")
            hard_fail = True
        else:
            reasons.append(f"Age {resident.age} is within the allowed range.")
    else:
        reasons.append("Age is not on file — cannot fully verify age criteria.")
        soft_miss = True

    # Gender
    if scheme.gender and scheme.gender != "Any":
        if not resident.gender:
            reasons.append("Gender is not on file — cannot verify gender criterion.")
            soft_miss = True
        elif resident.gender != scheme.gender:
            reasons.append(f"Scheme requires gender '{scheme.gender}' but resident is '{resident.gender}'.")
            hard_fail = True
        else:
            reasons.append(f"Gender matches scheme requirement ({scheme.gender}).")

    # Category
    if scheme.category and scheme.category != "Any":
        if not resident.category:
            reasons.append("Category is not on file — cannot verify category criterion.")
            soft_miss = True
        elif resident.category != scheme.category:
            reasons.append(f"Scheme targets category '{scheme.category}' but resident is '{resident.category}'.")
            hard_fail = True
        else:
            reasons.append(f"Category matches scheme requirement ({scheme.category}).")

    # Income
    if scheme.income_limit is not None:
        if resident.annual_income is None:
            reasons.append("Annual income is not on file — cannot verify income limit.")
            soft_miss = True
        elif resident.annual_income > scheme.income_limit:
            reasons.append(
                f"Annual income ₹{resident.annual_income:,.0f} exceeds "
                f"scheme limit of ₹{scheme.income_limit:,.0f}."
            )
            hard_fail = True
        else:
            reasons.append(
                f"Annual income ₹{resident.annual_income:,.0f} is within "
                f"the limit of ₹{scheme.income_limit:,.0f}."
            )

    # Required documents
    if scheme.required_documents:
        missing = [d for d in scheme.required_documents if d not in have_docs]
        if missing:
            reasons.append(f"Missing required documents: {', '.join(missing)}.")
            soft_miss = True
        else:
            reasons.append("All required documents are on file.")

    # Decide status
    if hard_fail:
        return "not_eligible", reasons
    if soft_miss:
        return "possibly_eligible", reasons
    return "eligible", reasons
