import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from database import Base


def new_uuid() -> str:
    return str(uuid.uuid4())


# ── Core user model ────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id            = Column(String(36), primary_key=True, default=new_uuid)
    name          = Column(String(120), nullable=False)
    email         = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role          = Column(String(20), default="user")   # "admin" | "user"
    is_active     = Column(Boolean, default=True)
    # admin_id links a regular user back to the admin who created them
    admin_id      = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_at    = Column(DateTime, default=datetime.utcnow)

    # We query managed_users by admin_id directly — no ORM relationship needed
    sessions    = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")
    policy_docs = relationship("PolicyDocument", back_populates="created_by_user")


# ── Chat persistence ───────────────────────────────────────────────────────────

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id         = Column(String(36), primary_key=True, default=new_uuid)
    user_id    = Column(String(36), ForeignKey("users.id"), nullable=True)
    title      = Column(String, nullable=False, default="New Chat")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user     = relationship("User", back_populates="sessions")
    messages = relationship(
        "ChatMessage",
        back_populates="session",
        order_by="ChatMessage.created_at",
        cascade="all, delete-orphan",
    )


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id         = Column(String(36), primary_key=True, default=new_uuid)
    session_id = Column(String(36), ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False)
    role       = Column(String, nullable=False)   # "user" | "ai"
    content    = Column(Text, nullable=False)
    is_flagged = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("ChatSession", back_populates="messages")


# ── Policy documents ───────────────────────────────────────────────────────────

class PolicyDocument(Base):
    """Admin-uploaded privacy / redaction policy documents."""
    __tablename__ = "policy_documents"

    id             = Column(String(36), primary_key=True, default=new_uuid)
    title          = Column(String(200), nullable=False)
    content        = Column(Text, nullable=False)        # full text of the policy
    file_name      = Column(String(200), nullable=True)  # original uploaded filename
    created_by     = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_at     = Column(DateTime, default=datetime.utcnow)

    created_by_user = relationship("User", back_populates="policy_docs")


# ── Audit Log (persisted, survives restarts) ───────────────────────────────────

class AuditLog(Base):
    """Every prompt sent through the gateway is recorded here permanently."""
    __tablename__ = "audit_logs"

    id              = Column(String(36), primary_key=True, default=new_uuid)
    user_id         = Column(String(36), ForeignKey("users.id"), nullable=True)
    user_email      = Column(String, nullable=True)
    user_name       = Column(String, nullable=True)
    tag             = Column(String(20), nullable=True)   # role: "admin" | "user"
    action          = Column(String(100), nullable=False)
    risk_level      = Column(String(20), nullable=False)  # "High" | "Low"
    exact_prompt    = Column(Text, nullable=True)
    sensitive_items = Column(JSON, default=list)          # list[str]
    created_at      = Column(DateTime, default=datetime.utcnow, index=True)

