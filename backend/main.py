from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime, timedelta
from collections import defaultdict
import re
import os

import google.generativeai as genai
from dotenv import load_dotenv

import models
from database import engine, get_db
import schemas
from auth import (
    hash_password, verify_password,
    create_access_token,
    get_current_user, require_admin,
)

# ── Bootstrap ──────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

GEMINI_API_KEY   = os.getenv("GEMINI_API_KEY")
ADMIN_SECRET_KEY = os.getenv("ADMIN_SECRET_KEY", "SAFESCRIPT-ADMIN-2026")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="SafeScript API", version="3.0.0")

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", "http://localhost:3001",
        "http://localhost:3002", "http://localhost:3003",
        "http://127.0.0.1:3000", "http://127.0.0.1:3001",
        "http://127.0.0.1:3002", "http://127.0.0.1:3003",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory audit log (survives the process, cleared on restart)
IN_MEMORY_LOGS: list = []


# ══════════════════════════════════════════════════════════════════════
# AUTH
# ══════════════════════════════════════════════════════════════════════

@app.get("/")
def health_check():
    return {"status": "ok", "message": "SafeScript API v3 is running."}


@app.post("/auth/signup", response_model=schemas.TokenResponse)
def signup(request: schemas.SignupRequest, db: Session = Depends(get_db)):
    """Admin self-registration. Requires ADMIN_SECRET_KEY."""
    # Only admin accounts can be self-created (regular users are created by admins)
    if request.role != "admin":
        raise HTTPException(status_code=400, detail="Self-registration is only available for admin accounts.")
    if request.admin_secret != ADMIN_SECRET_KEY:
        raise HTTPException(status_code=403, detail="Invalid admin authorization key.")
    if db.query(models.User).filter(models.User.email == request.email).first():
        raise HTTPException(status_code=409, detail="Email already registered.")

    user = models.User(
        name=request.name,
        email=request.email,
        password_hash=hash_password(request.password),
        role="admin",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.id, "role": user.role, "name": user.name})
    return schemas.TokenResponse(
        access_token=token, role=user.role, name=user.name, user_id=user.id
    )


@app.post("/auth/login", response_model=schemas.TokenResponse)
def login(request: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account deactivated. Contact your admin.")

    token = create_access_token({"sub": user.id, "role": user.role, "name": user.name})
    return schemas.TokenResponse(
        access_token=token, role=user.role, name=user.name, user_id=user.id
    )


@app.get("/auth/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(get_current_user)):
    return schemas.UserOut(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        admin_id=current_user.admin_id,
    )


# ══════════════════════════════════════════════════════════════════════
# USER MANAGEMENT (admin only)
# ══════════════════════════════════════════════════════════════════════

@app.get("/users", response_model=list[schemas.UserOut])
def list_users(admin: models.User = Depends(require_admin), db: Session = Depends(get_db)):
    """List all users that were created by this admin."""
    users = (
        db.query(models.User)
        .filter(models.User.admin_id == admin.id)
        .order_by(desc(models.User.created_at))
        .all()
    )
    return [
        schemas.UserOut(
            id=u.id, name=u.name, email=u.email, role=u.role,
            is_active=u.is_active, created_at=u.created_at, admin_id=u.admin_id,
        )
        for u in users
    ]


@app.post("/users", response_model=schemas.UserOut)
def create_user(
    request: schemas.AdminCreateUserRequest,
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Admin creates a new user account."""
    if db.query(models.User).filter(models.User.email == request.email).first():
        raise HTTPException(status_code=409, detail="Email already registered.")

    user = models.User(
        name=request.name,
        email=request.email,
        password_hash=hash_password(request.password),
        role=request.role,
        admin_id=admin.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return schemas.UserOut(
        id=user.id, name=user.name, email=user.email, role=user.role,
        is_active=user.is_active, created_at=user.created_at, admin_id=user.admin_id,
    )


@app.patch("/users/{user_id}", response_model=schemas.UserOut)
def update_user(
    user_id: str,
    request: schemas.UpdateUserRequest,
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(
        models.User.id == user_id, models.User.admin_id == admin.id
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if request.role is not None:
        user.role = request.role
    if request.is_active is not None:
        user.is_active = request.is_active
    db.commit()
    db.refresh(user)
    return schemas.UserOut(
        id=user.id, name=user.name, email=user.email, role=user.role,
        is_active=user.is_active, created_at=user.created_at, admin_id=user.admin_id,
    )


@app.delete("/users/{user_id}")
def delete_user(
    user_id: str,
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(
        models.User.id == user_id, models.User.admin_id == admin.id
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    db.delete(user)
    db.commit()
    return {"status": "deleted"}


# ══════════════════════════════════════════════════════════════════════
# POLICY DOCUMENTS (admin only)
# ══════════════════════════════════════════════════════════════════════

@app.get("/policies", response_model=list[schemas.PolicyDocumentOut])
def list_policies(admin: models.User = Depends(require_admin), db: Session = Depends(get_db)):
    docs = (
        db.query(models.PolicyDocument)
        .filter(models.PolicyDocument.created_by == admin.id)
        .order_by(desc(models.PolicyDocument.created_at))
        .all()
    )
    return [
        schemas.PolicyDocumentOut(
            id=d.id, title=d.title, content=d.content,
            file_name=d.file_name, created_by=d.created_by, created_at=d.created_at,
        )
        for d in docs
    ]


@app.post("/policies", response_model=schemas.PolicyDocumentOut)
def create_policy(
    request: schemas.CreatePolicyRequest,
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    doc = models.PolicyDocument(
        title=request.title,
        content=request.content,
        file_name=request.file_name,
        created_by=admin.id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return schemas.PolicyDocumentOut(
        id=doc.id, title=doc.title, content=doc.content,
        file_name=doc.file_name, created_by=doc.created_by, created_at=doc.created_at,
    )


@app.delete("/policies/{policy_id}")
def delete_policy(
    policy_id: str,
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    doc = db.query(models.PolicyDocument).filter(
        models.PolicyDocument.id == policy_id,
        models.PolicyDocument.created_by == admin.id,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Policy not found.")
    db.delete(doc)
    db.commit()
    return {"status": "deleted"}


# ══════════════════════════════════════════════════════════════════════
# PROMPT / GATEWAY (all authenticated users)
# ══════════════════════════════════════════════════════════════════════

@app.post("/analyze", response_model=schemas.AnalyzeResponse)
def analyze_prompt(
    request: schemas.AnalyzeRequest,
    current_user: models.User = Depends(get_current_user),
):
    original  = request.prompt
    sanitized = original
    detected  = []
    score     = 0

    if "sk-" in sanitized:
        sanitized = re.sub(r'sk-[a-zA-Z0-9_]+', '[API_KEY_MASKED]', sanitized)
        detected.append("API Key")
        score += 85

    if "@" in sanitized and "." in sanitized:
        sanitized = re.sub(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', '[EMAIL_MASKED]', sanitized)
        detected.append("Email")
        score += 30

    if re.search(r'\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b', sanitized):
        sanitized = re.sub(r'\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b', '[CREDIT_CARD_MASKED]', sanitized)
        detected.append("Financial Data")
        score += 90

    return schemas.AnalyzeResponse(
        sanitized_prompt=sanitized,
        entities_detected=detected,
        risk_score=min(score, 100),
    )


@app.post("/send", response_model=schemas.SendResponse)
def send_prompt(
    request: schemas.SendRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    now = datetime.now()
    log_base = {
        "user": current_user.email,
        "user_name": current_user.name,
        "tag": current_user.role,
        "timestamp": now.strftime("%Y-%m-%d %H:%M:%S"),
    }

    if request.override:
        action     = "Sensitive Override Sent"
        risk_level = "High"
        si         = request.sensitive_items
    elif request.has_sensitive_data:
        action     = "Masked Prompt Sent"
        risk_level = "Low"
        si         = []
    else:
        action     = "Clean Prompt Sent"
        risk_level = "Low"
        si         = []

    IN_MEMORY_LOGS.insert(0, {
        **log_base,
        "action": action,
        "risk_level": risk_level,
        "exact_prompt": request.original_prompt if request.override else request.final_prompt,
        "sensitive_items": si,
    })

    # --- Persist to audit_logs table ---
    try:
        db.add(models.AuditLog(
            user_id=current_user.id,
            user_email=log_base["user"],
            user_name=log_base["user_name"],
            tag=log_base["tag"],
            action=action,
            risk_level=risk_level,
            exact_prompt=request.original_prompt if request.override else request.final_prompt,
            sensitive_items=si,
            created_at=now,
        ))
        db.commit()
    except Exception as e:
        print(f"AuditLog write error: {e}")
        db.rollback()

    # Gemini call
    ai_response = "Mock AI Response: Please set GEMINI_API_KEY in .env to connect to Gemini."
    if GEMINI_API_KEY:
        try:
            model = genai.GenerativeModel('gemini-3.1-flash-lite-preview')
            response = model.generate_content(request.final_prompt)
            ai_response = response.text
        except Exception as e:
            ai_response = f"Gemini Error: {str(e)}"

    # Persist to DB session if provided
    if request.session_id:
        try:
            session_row = db.query(models.ChatSession).filter(
                models.ChatSession.id == request.session_id
            ).first()
            if session_row:
                db.add(models.ChatMessage(session_id=request.session_id, role="user",
                                          content=request.final_prompt, is_flagged=request.override))
                db.add(models.ChatMessage(session_id=request.session_id, role="ai",
                                          content=ai_response, is_flagged=False))
                session_row.updated_at = now
                if session_row.title == "New Chat":
                    session_row.title = request.final_prompt.strip()[:40] or "New Chat"
                db.commit()
        except Exception as e:
            print(f"DB write error: {e}")
            db.rollback()

    return schemas.SendResponse(status="success", message="Prompt sent safely.", ai_response=ai_response)


# ══════════════════════════════════════════════════════════════════════
# AUDIT LOGS & STATS (admin only)
# ══════════════════════════════════════════════════════════════════════

@app.get("/logs", response_model=schemas.LogsResponse)
def get_logs(
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Returns all audit logs from the DB (persisted) merged with any in-memory entries."""
    db_logs = (
        db.query(models.AuditLog)
        .order_by(desc(models.AuditLog.created_at))
        .limit(500)
        .all()
    )
    # Build from DB first (persistent), then append any in-memory that are newer
    db_ids_ts = {l.created_at.strftime("%Y-%m-%d %H:%M:%S") for l in db_logs}
    entries = [
        schemas.LogEntry(
            action=l.action,
            user=l.user_email or "",
            user_name=l.user_name or "",
            tag=l.tag or "user",
            risk_level=l.risk_level,
            timestamp=l.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            exact_prompt=l.exact_prompt,
            sensitive_items=l.sensitive_items or [],
        )
        for l in db_logs
    ]
    # Prepend any in-memory entries not yet in DB (edge case)
    for l in IN_MEMORY_LOGS:
        if l.get("timestamp") not in db_ids_ts:
            entries.insert(0, schemas.LogEntry(
                action=l.get("action", ""),
                user=l.get("user", ""),
                user_name=l.get("user_name", ""),
                tag=l.get("tag", "user"),
                risk_level=l.get("risk_level", "Low"),
                timestamp=l.get("timestamp", ""),
                exact_prompt=l.get("exact_prompt"),
                sensitive_items=l.get("sensitive_items", []),
            ))
    return schemas.LogsResponse(logs=entries)


@app.get("/stats")
def get_stats(
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
    time_range: str = Query("week", pattern="^(day|week|month)$"),
):
    """Dynamic stats + timeline. time_range= day | week | month."""

    # Determine the window
    now_dt = datetime.utcnow()
    if time_range == "day":
        since = now_dt - timedelta(days=1)
        n_slots, slot_fmt, slot_label_fmt = 24, "%Y-%m-%d %H", "%H:00"
    elif time_range == "month":
        since = now_dt - timedelta(days=30)
        n_slots, slot_fmt, slot_label_fmt = 30, "%Y-%m-%d", "%b %d"
    else:  # week (default)
        since = now_dt - timedelta(days=7)
        n_slots, slot_fmt, slot_label_fmt = 7, "%Y-%m-%d", "%a"

    # Fetch all audit logs within window
    rows = (
        db.query(models.AuditLog)
        .filter(models.AuditLog.created_at >= since)
        .order_by(models.AuditLog.created_at)
        .all()
    )

    all_entries = list(rows)

    # Aggregate totals
    total       = len(all_entries)
    high_risk   = sum(1 for l in all_entries if l.risk_level == "High")
    api_key_cnt = sum((l.sensitive_items or []).count("API Key") for l in all_entries)
    email_cnt   = sum((l.sensitive_items or []).count("Email") for l in all_entries)

    avg_risk = 0
    if total:
        risk_pts = sum(85 if l.risk_level == "High" else 30 for l in all_entries)
        avg_risk = min(round(risk_pts / total), 100)

    # Build ordered slots for the timeline
    if time_range == "day":
        slots       = [(now_dt - timedelta(hours=i)).strftime(slot_fmt)       for i in range(n_slots - 1, -1, -1)]
        slot_labels = [(now_dt - timedelta(hours=i)).strftime(slot_label_fmt) for i in range(n_slots - 1, -1, -1)]
    elif time_range == "month":
        slots       = [(now_dt - timedelta(days=i)).strftime(slot_fmt)        for i in range(n_slots - 1, -1, -1)]
        slot_labels = [(now_dt - timedelta(days=i)).strftime(slot_label_fmt)  for i in range(n_slots - 1, -1, -1)]
    else:  # week
        slots       = [(now_dt - timedelta(days=i)).strftime(slot_fmt)        for i in range(6, -1, -1)]
        slot_labels = [(now_dt - timedelta(days=i)).strftime(slot_label_fmt)  for i in range(6, -1, -1)]

    # Bucket each entry into its slot
    high_by_slot: dict = defaultdict(int)
    low_by_slot:  dict = defaultdict(int)
    for l in all_entries:
        key = l.created_at.strftime(slot_fmt)
        if l.risk_level == "High":
            high_by_slot[key] += 1
        else:
            low_by_slot[key] += 1

    timeline = [
        {
            "slot":  slots[i],
            "label": slot_labels[i],
            "high":  high_by_slot[slots[i]],
            "low":   low_by_slot[slots[i]],
            "count": high_by_slot[slots[i]] + low_by_slot[slots[i]],
        }
        for i in range(len(slots))
    ]

    # Global totals (all-time) for the counter cards
    all_rows      = db.query(models.AuditLog).all()
    total_all     = len(all_rows)
    high_risk_all = sum(1 for l in all_rows if l.risk_level == "High")
    api_key_all   = sum((l.sensitive_items or []).count("API Key") for l in all_rows)
    email_all     = sum((l.sensitive_items or []).count("Email") for l in all_rows)
    avg_risk_all  = 0
    if total_all:
        risk_pts_all = sum(85 if l.risk_level == "High" else 30 for l in all_rows)
        avg_risk_all = min(round(risk_pts_all / total_all), 100)

    return {
        "total_prompts":  total_all,
        "high_risk":      high_risk_all,
        "low_risk":       total_all - high_risk_all,
        "total_masked":   api_key_all + email_all,
        "api_key_count":  api_key_all,
        "email_count":    email_all,
        "avg_risk_score": avg_risk_all,
        "timeline":       timeline,
        "range":          time_range,
    }



# ══════════════════════════════════════════════════════════════════════
# CHAT SESSIONS (authenticated users, scoped to their own sessions)
# ══════════════════════════════════════════════════════════════════════

@app.get("/sessions", response_model=list[schemas.SessionOut])
def list_sessions(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(models.ChatSession)
        .filter(models.ChatSession.user_id == current_user.id)
        .order_by(desc(models.ChatSession.updated_at))
        .all()
    )
    return [schemas.SessionOut(id=str(r.id), title=r.title, created_at=r.created_at,
                               updated_at=r.updated_at, messages=[]) for r in rows]


@app.post("/sessions", response_model=schemas.SessionOut)
def create_session(
    request: schemas.CreateSessionRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = models.ChatSession(title=request.title or "New Chat", user_id=current_user.id)
    db.add(row)
    db.commit()
    db.refresh(row)
    return schemas.SessionOut(id=str(row.id), title=row.title,
                              created_at=row.created_at, updated_at=row.updated_at, messages=[])


@app.get("/sessions/{session_id}", response_model=schemas.SessionOut)
def get_session(
    session_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = db.query(models.ChatSession).filter(
        models.ChatSession.id == session_id,
        models.ChatSession.user_id == current_user.id,
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")
    return schemas.SessionOut(
        id=str(row.id), title=row.title,
        created_at=row.created_at, updated_at=row.updated_at,
        messages=[
            schemas.MessageOut(id=str(m.id), role=m.role, content=m.content,
                               is_flagged=m.is_flagged, created_at=m.created_at)
            for m in row.messages
        ],
    )


@app.patch("/sessions/{session_id}/rename", response_model=schemas.SessionOut)
def rename_session(
    session_id: str,
    request: schemas.RenameSessionRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = db.query(models.ChatSession).filter(
        models.ChatSession.id == session_id,
        models.ChatSession.user_id == current_user.id,
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")
    row.title = request.title.strip() or "Untitled"
    db.commit()
    db.refresh(row)
    return schemas.SessionOut(id=str(row.id), title=row.title,
                              created_at=row.created_at, updated_at=row.updated_at, messages=[])


@app.delete("/sessions/{session_id}")
def delete_session(
    session_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = db.query(models.ChatSession).filter(
        models.ChatSession.id == session_id,
        models.ChatSession.user_id == current_user.id,
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(row)
    db.commit()
    return {"status": "deleted"}
