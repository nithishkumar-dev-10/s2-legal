from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from models.database import get_db, CaseDB
from models.schemas import CaseCreate, CaseOut

router = APIRouter(prefix="/api/cases", tags=["cases"])


@router.get("", response_model=List[CaseOut])
def get_cases(db: Session = Depends(get_db)):
    return db.query(CaseDB).order_by(CaseDB.created_at.desc()).all()


@router.post("", response_model=CaseOut)
def create_case(payload: CaseCreate, db: Session = Depends(get_db)):
    payload = payload.normalized()
    entry = CaseDB(
        case_number=payload.case_number,
        petitioner=payload.petitioner,
        respondent=payload.respondent,
        court_name=payload.court_name or "N/A",
        status=payload.status or "active",
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{case_id}")
def delete_case(case_id: int, db: Session = Depends(get_db)):
    entry = db.query(CaseDB).filter(CaseDB.id == case_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Case not found")
    db.delete(entry)
    db.commit()
    return {"deleted": case_id}
