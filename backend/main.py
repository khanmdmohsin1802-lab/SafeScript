from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
import re

import models
from database import engine, get_db
import schemas

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="InsightShield API", version="1.0.0")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Next.js frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze", response_model=schemas.AnalyzeResponse)
def analyze_prompt(request: schemas.AnalyzeRequest, db: Session = Depends(get_db)):
    # Mocking Presidio/regex masking for MVP
    original = request.prompt
    sanitized = original
    detected = []
    score = 0
    
    # Simple regex mock for API keys / Credit cards / Emails
    if "sk-" in sanitized:
        sanitized = re.sub(r'sk-[a-zA-Z0-9]+', '[API_KEY_MASKED]', sanitized)
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

    # Log to DB (simplified)
    # new_prompt = models.Prompt(original_prompt=original, sanitized_prompt=sanitized, risk_score=score)
    # db.add(new_prompt)
    # db.commit()

    return schemas.AnalyzeResponse(
        sanitized_prompt=sanitized,
        entities_detected=detected,
        risk_score=min(score, 100)
    )

@app.post("/send", response_model=schemas.SendResponse)
def send_prompt(request: schemas.SendRequest):
    # Mock sending to external LLM (e.g. Gemini/OpenAI)
    # In reality, this would make an API call to the LLM with the sanitized prompt
    print(f"Sending prompt to LLM: {request.final_prompt} (Override: {request.override})")
    return schemas.SendResponse(status="success", message="Prompt sent safely.")

@app.get("/logs", response_model=schemas.LogsResponse)
def get_logs(db: Session = Depends(get_db)):
    # Mock logs for the dashboard
    return schemas.LogsResponse(logs=[
        {"action": "API Key Masked", "user": "dev@company.com", "risk_level": "High", "timestamp": "12:01"},
        {"action": "Email Masked", "user": "intern@company.com", "risk_level": "Medium", "timestamp": "12:03"},
        {"action": "Override Sent", "user": "manager@company.com", "risk_level": "High", "timestamp": "12:05"},
    ])

@app.get("/")
def health_check():
    return {"status": "ok", "message": "InsightShield API is running."}
