from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime


# ── Auth ───────────────────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "admin"          # only "admin" is allowed for self-signup
    admin_secret: str            # must match ADMIN_SECRET_KEY in .env

class AdminCreateUserRequest(BaseModel):
    """Admin creates a regular user account."""
    name: str
    email: str
    password: str
    role: str = "user"           # admin can set "user" or promote to "admin"

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    name: str
    user_id: str

class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    is_active: bool
    created_at: datetime
    admin_id: Optional[str] = None

    class Config:
        from_attributes = True

class UpdateUserRequest(BaseModel):
    role: Optional[str] = None
    is_active: Optional[bool] = None


# ── Policy Documents ───────────────────────────────────────────────────────────

class CreatePolicyRequest(BaseModel):
    title: str
    content: str
    file_name: Optional[str] = None

class PolicyDocumentOut(BaseModel):
    id: str
    title: str
    content: str
    file_name: Optional[str]
    created_by: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Prompt / Analysis (unchanged) ─────────────────────────────────────────────

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
    session_id: Optional[str] = None


class SendResponse(BaseModel):
    status: str
    message: str
    ai_response: Optional[str] = None


# ── Audit Logs ─────────────────────────────────────────────────────────────────

class LogEntry(BaseModel):
    action: str
    user: str           # email
    user_name: str
    tag: str            # role
    risk_level: str
    timestamp: str
    exact_prompt: Optional[str] = None
    sensitive_items: List[str] = []

class LogsResponse(BaseModel):
    logs: List[LogEntry]


# ── Chat Sessions ──────────────────────────────────────────────────────────────

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
