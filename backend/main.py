from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime
from collections import defaultdict
import re
import os

import google.generativeai as genai
from dotenv import load_dotenv

import models
from database import engine, get_db
import schemas

# ── Bootstrap ──────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Create all tables (including new chat tables)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="SafeScript API", version="2.0.0")

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3003",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
        "http://127.0.0.1:3003",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── In-memory audit log (kept for /logs + /stats compatibility) ────────────────
IN_MEMORY_LOGS: list = []


# ══════════════════════════════════════════════════════════════════════
# EXISTING ENDPOINTS (logic unchanged)
# ══════════════════════════════════════════════════════════════════════

@app.get("/")
def health_check():
    return {"status": "ok", "message": "SafeScript API v2 is running."}


@app.post("/analyze", response_model=schemas.AnalyzeResponse)
def analyze_prompt(request: schemas.AnalyzeRequest, db: Session = Depends(get_db)):
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
def send_prompt(request: schemas.SendRequest, db: Session = Depends(get_db)):
    now = datetime.now()

    if request.override:
        print(f"🔥 OVERRIDE: {request.original_prompt}")
        IN_MEMORY_LOGS.insert(0, {
            "action": "Sensitive Override Sent",
            "user": "admin@safescript.dev",
            "risk_level": "High",
            "timestamp": now.strftime("%Y-%m-%d %H:%M:%S"),
            "exact_prompt": request.original_prompt,
            "sensitive_items": request.sensitive_items,
        })
    else:
        print(f"SEND (masked): {request.final_prompt}")
        if request.has_sensitive_data:
            IN_MEMORY_LOGS.insert(0, {
                "action": "Masked Prompt Sent",
                "user": "admin@safescript.dev",
                "risk_level": "Low",
                "timestamp": now.strftime("%Y-%m-%d %H:%M:%S"),
                "exact_prompt": request.final_prompt,
                "sensitive_items": [],
            })

    # ── Call Gemini ────────────────────────────────────────────────────
    ai_response = "Mock AI Response: Please set GEMINI_API_KEY in .env to connect to Gemini."
    if GEMINI_API_KEY:
        try:
            model = genai.GenerativeModel('gemini-3.1-flash-lite-preview')
            response = model.generate_content(request.final_prompt)
            ai_response = response.text
        except Exception as e:
            ai_response = f"Gemini Error: {str(e)}"

    # ── Persist both messages to the DB if a session_id was provided ───
    if request.session_id:
        try:
            session_row = db.query(models.ChatSession).filter(
                models.ChatSession.id == request.session_id
            ).first()
            if session_row:
                # user message
                db.add(models.ChatMessage(
                    session_id=request.session_id,
                    role="user",
                    content=request.final_prompt,
                    is_flagged=request.override,
                ))
                # ai message
                db.add(models.ChatMessage(
                    session_id=request.session_id,
                    role="ai",
                    content=ai_response,
                    is_flagged=False,
                ))
                # bump updated_at
                session_row.updated_at = now
                # auto-title from first user message (first 40 chars)
                if session_row.title == "New Chat":
                    auto_title = request.final_prompt.strip()[:40]
                    session_row.title = auto_title if auto_title else "New Chat"
                db.commit()
        except Exception as e:
            print(f"DB write error: {e}")
            db.rollback()

    return schemas.SendResponse(
        status="success",
        message="Prompt sent safely.",
        ai_response=ai_response,
    )


@app.get("/logs", response_model=schemas.LogsResponse)
def get_logs(db: Session = Depends(get_db)):
    return schemas.LogsResponse(logs=IN_MEMORY_LOGS)


@app.get("/stats")
def get_stats():
    total     = len(IN_MEMORY_LOGS)
    high_risk = sum(1 for log in IN_MEMORY_LOGS if log.get("risk_level") == "High")

    api_key_count = sum(
        log.get("sensitive_items", []).count("API Key") for log in IN_MEMORY_LOGS
    )
    email_count = sum(
        log.get("sensitive_items", []).count("Email") for log in IN_MEMORY_LOGS
    )
    total_masked = api_key_count + email_count

    avg_risk = 0
    if total > 0:
        risk_pts = sum(85 if log.get("risk_level") == "High" else 30 for log in IN_MEMORY_LOGS)
        avg_risk = min(round(risk_pts / total), 100)

    daily_buckets: dict = defaultdict(int)
    for log in IN_MEMORY_LOGS:
        ts  = log.get("timestamp", "")
        day = ts[:10] if len(ts) >= 10 else "unknown"
        daily_buckets[day] += 1
    sorted_days = sorted(daily_buckets.keys())[-7:]
    timeline = [{"day": d, "count": daily_buckets[d]} for d in sorted_days]

    return {
        "total_prompts":   total,
        "high_risk":       high_risk,
        "low_risk":        total - high_risk,
        "total_masked":    total_masked,
        "api_key_count":   api_key_count,
        "email_count":     email_count,
        "avg_risk_score":  avg_risk,
        "timeline":        timeline,
    }


# ══════════════════════════════════════════════════════════════════════
# NEW: Chat Session Endpoints
# ══════════════════════════════════════════════════════════════════════

@app.get("/sessions", response_model=list[schemas.SessionOut])
def list_sessions(db: Session = Depends(get_db)):
    """Return all chat sessions (newest first), without messages."""
    rows = (
        db.query(models.ChatSession)
        .order_by(desc(models.ChatSession.updated_at))
        .all()
    )
    return [
        schemas.SessionOut(
            id=str(r.id),
            title=r.title,
            created_at=r.created_at,
            updated_at=r.updated_at,
            messages=[],
        )
        for r in rows
    ]


@app.post("/sessions", response_model=schemas.SessionOut)
def create_session(request: schemas.CreateSessionRequest, db: Session = Depends(get_db)):
    """Create a new chat session and return it."""
    row = models.ChatSession(title=request.title or "New Chat")
    db.add(row)
    db.commit()
    db.refresh(row)
    return schemas.SessionOut(
        id=str(row.id),
        title=row.title,
        created_at=row.created_at,
        updated_at=row.updated_at,
        messages=[],
    )


@app.get("/sessions/{session_id}", response_model=schemas.SessionOut)
def get_session(session_id: str, db: Session = Depends(get_db)):
    """Return a single session with all its messages."""
    row = db.query(models.ChatSession).filter(models.ChatSession.id == session_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")

    return schemas.SessionOut(
        id=str(row.id),
        title=row.title,
        created_at=row.created_at,
        updated_at=row.updated_at,
        messages=[
            schemas.MessageOut(
                id=str(m.id),
                role=m.role,
                content=m.content,
                is_flagged=m.is_flagged,
                created_at=m.created_at,
            )
            for m in row.messages
        ],
    )


@app.patch("/sessions/{session_id}/rename", response_model=schemas.SessionOut)
def rename_session(session_id: str, request: schemas.RenameSessionRequest, db: Session = Depends(get_db)):
    """Rename a chat session."""
    row = db.query(models.ChatSession).filter(models.ChatSession.id == session_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")

    row.title = request.title.strip() or "Untitled"
    db.commit()
    db.refresh(row)
    return schemas.SessionOut(
        id=str(row.id),
        title=row.title,
        created_at=row.created_at,
        updated_at=row.updated_at,
        messages=[],
    )


@app.delete("/sessions/{session_id}")
def delete_session(session_id: str, db: Session = Depends(get_db)):
    """Delete a session and all its messages (cascade)."""
    row = db.query(models.ChatSession).filter(models.ChatSession.id == session_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")

    db.delete(row)
    db.commit()
    return {"status": "deleted"}
