from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
import re
import os
import google.generativeai as genai

import models
from database import engine, get_db
import schemas

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="InsightShield API", version="1.0.0")

# Setup Gemini
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002"
    ],
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

IN_MEMORY_LOGS = []

@app.post("/send", response_model=schemas.SendResponse)
def send_prompt(request: schemas.SendRequest):
    if request.override:
        print(f"🔥 OVERRIDE INITIATED: Sending Original Prompt to LLM: {request.original_prompt}")
        IN_MEMORY_LOGS.insert(0, {
            "action": "Sensitive Override Sent",
            "user": "admin@safescript.dev",
            "risk_level": "High",
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "exact_prompt": request.original_prompt,
            "sensitive_items": request.sensitive_items
        })
    else:
        print(f"Sending Sanitized Prompt to LLM: {request.final_prompt}")
        IN_MEMORY_LOGS.insert(0, {
            "action": "Masked Prompt Sent",
            "user": "admin@safescript.dev",
            "risk_level": "Low",
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "exact_prompt": request.final_prompt,
            "sensitive_items": []
        })
        
    ai_response = "Mock AI Response: Please set GEMINI_API_KEY in .env to connect to Gemini."
    if GEMINI_API_KEY:
        try:
            model = genai.GenerativeModel('gemini-3.1-flash-lite-preview')
            response = model.generate_content(request.final_prompt)
            ai_response = response.text
        except Exception as e:
            ai_response = f"Gemini Error: {str(e)}"
            
    return schemas.SendResponse(status="success", message="Prompt sent safely.", ai_response=ai_response)

@app.get("/logs", response_model=schemas.LogsResponse)
def get_logs(db: Session = Depends(get_db)):
    return schemas.LogsResponse(logs=IN_MEMORY_LOGS)

@app.get("/")
def health_check():
    return {"status": "ok", "message": "InsightShield API is running."}
