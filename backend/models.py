import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from database import Base


# Helper: store UUIDs as plain strings (works on both SQLite & PostgreSQL)
def new_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id         = Column(String(36), primary_key=True, default=new_uuid)
    email      = Column(String, unique=True, index=True, nullable=False)
    role       = Column(String, default="dev")
    created_at = Column(DateTime, default=datetime.utcnow)

    prompts   = relationship("Prompt",      back_populates="user")
    overrides = relationship("Override",    back_populates="user")
    logs      = relationship("AuditLog",    back_populates="user")
    sessions  = relationship("ChatSession", back_populates="user")


class Organization(Base):
    __tablename__ = "organizations"

    id         = Column(String(36), primary_key=True, default=new_uuid)
    name       = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    policies = relationship("Policy", back_populates="organization")


class Prompt(Base):
    __tablename__ = "prompts"

    id               = Column(String(36), primary_key=True, default=new_uuid)
    user_id          = Column(String(36), ForeignKey("users.id"), nullable=True)
    original_prompt  = Column(Text, nullable=True)
    sanitized_prompt = Column(Text, nullable=False)
    risk_score       = Column(Integer, default=0)
    created_at       = Column(DateTime, default=datetime.utcnow)

    user      = relationship("User",     back_populates="prompts")
    overrides = relationship("Override", back_populates="prompt")


class Override(Base):
    __tablename__ = "overrides"

    id            = Column(String(36), primary_key=True, default=new_uuid)
    user_id       = Column(String(36), ForeignKey("users.id"), nullable=True)
    prompt_id     = Column(String(36), ForeignKey("prompts.id"), nullable=False)
    override_type = Column(String, nullable=False)
    risk_level    = Column(String, nullable=False)
    justification = Column(Text, nullable=True)
    created_at    = Column(DateTime, default=datetime.utcnow)

    user   = relationship("User",   back_populates="overrides")
    prompt = relationship("Prompt", back_populates="overrides")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id         = Column(String(36), primary_key=True, default=new_uuid)
    user_id    = Column(String(36), ForeignKey("users.id"), nullable=True)
    action     = Column(String, nullable=False)
    meta_data  = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="logs")


class Policy(Base):
    __tablename__ = "policies"

    id              = Column(String(36), primary_key=True, default=new_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=True)
    rule_type       = Column(String, nullable=False)
    config          = Column(JSON, nullable=False)
    created_at      = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="policies")


# ── Chat persistence ───────────────────────────────────────────────────────────

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id         = Column(String(36), primary_key=True, default=new_uuid)
    user_id    = Column(String(36), ForeignKey("users.id"), nullable=True)
    title      = Column(String, nullable=False, default="New Chat")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user     = relationship("User",        back_populates="sessions")
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
