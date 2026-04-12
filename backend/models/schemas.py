from pydantic import BaseModel
from typing import Optional, List, Literal
from datetime import datetime


# ── Chat ──────────────────────────────────────────────────────────────────────

class MessageSchema(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class FileAttachment(BaseModel):
    name: str
    type: str    # MIME e.g. "application/pdf", "image/jpeg"
    data: str    # base64 string, may include "data:mime;base64," prefix


class ChatRequest(BaseModel):
    query:       str
    history:     List[MessageSchema] = []
    role:        Literal["advocate", "client"]
    attachments: List[FileAttachment] = []


# ── Cases ─────────────────────────────────────────────────────────────────────

class CaseCreate(BaseModel):
    case_number:   str
    petitioner:    str
    respondent:    str
    court_name:    Optional[str] = "N/A"
    status:        Optional[str] = "active"

    # Also accept camelCase keys AI might extract
    caseNumber:    Optional[str] = None
    courtName:     Optional[str] = None

    def normalized(self) -> "CaseCreate":
        """Merge camelCase aliases into snake_case fields."""
        if self.caseNumber and not self.case_number:
            self.case_number = self.caseNumber
        if self.courtName and self.court_name == "N/A":
            self.court_name = self.courtName
        return self


class CaseOut(BaseModel):
    id:          int
    case_number: str
    petitioner:  str
    respondent:  str
    court_name:  str
    status:      str
    created_at:  datetime

    class Config:
        from_attributes = True


# ── Hearings ──────────────────────────────────────────────────────────────────

class HearingCreate(BaseModel):
    case_id: Optional[int] = None
    title:   str
    date:    str    # YYYY-MM-DD
    time:    str    # HH:MM
    court:   str
    details: Optional[str] = ""


class HearingOut(BaseModel):
    id:      int
    case_id: Optional[int]
    title:   str
    date:    str
    time:    str
    court:   str
    details: str

    class Config:
        from_attributes = True
