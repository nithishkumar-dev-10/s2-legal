from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from models.database import get_db, HearingDB
from models.schemas import HearingCreate, HearingOut

router = APIRouter(prefix="/api/hearings", tags=["hearings"])


@router.get("", response_model=List[HearingOut])
def get_hearings(db: Session = Depends(get_db)):
    return db.query(HearingDB).order_by(HearingDB.date.asc()).all()


@router.post("", response_model=HearingOut)
def create_hearing(payload: HearingCreate, db: Session = Depends(get_db)):
    entry = HearingDB(
        case_id=payload.case_id,
        title=payload.title,
        date=payload.date,
        time=payload.time,
        court=payload.court,
        details=payload.details or "",
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{hearing_id}")
def delete_hearing(hearing_id: int, db: Session = Depends(get_db)):
    entry = db.query(HearingDB).filter(HearingDB.id == hearing_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Hearing not found")
    db.delete(entry)
    db.commit()
    return {"deleted": hearing_id}
