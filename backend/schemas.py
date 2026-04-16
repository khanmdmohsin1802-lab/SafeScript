from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


# ── Existing schemas (unchanged) ───────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    prompt: str

class AnalyzeResponse(BaseModel):
    sanitized_prompt: str
    entities_detected: List[str]
    risk_score: int

class SendRequest(BaseModel):
    final_prompt: str
    original_prompt: Optional[str] = None
    override: bool = False
    sensitive_items: List[str] = []
    has_sensitive_data: bool = False
    session_id: Optional[str] = None   # NEW: attach message to a session

class SendResponse(BaseModel):
    status: str
    message: str
    ai_response: Optional[str] = None

class LogEntry(BaseModel):
    action: str
    user: str
    risk_level: str
    timestamp: str
    exact_prompt: Optional[str] = None
    sensitive_items: List[str] = []

class LogsResponse(BaseModel):
    logs: List[LogEntry]


# ── Chat persistence schemas ───────────────────────────────────────────────────

class MessageOut(BaseModel):
    id: str
    role: str
    content: str
    is_flagged: bool
    created_at: datetime

    class Config:
        from_attributes = True

class SessionOut(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageOut] = []

    class Config:
        from_attributes = True

class CreateSessionRequest(BaseModel):
    title: Optional[str] = "New Chat"

class RenameSessionRequest(BaseModel):
    title: str
