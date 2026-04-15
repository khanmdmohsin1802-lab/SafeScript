from pydantic import BaseModel
from typing import List, Optional

class AnalyzeRequest(BaseModel):
    prompt: str

class AnalyzeResponse(BaseModel):
    sanitized_prompt: str
    entities_detected: List[str]
    risk_score: int

class SendRequest(BaseModel):
    final_prompt: str
    override: bool = False

class SendResponse(BaseModel):
    status: str
    message: str

class LogEntry(BaseModel):
    action: str
    user: str
    risk_level: str
    timestamp: str

class LogsResponse(BaseModel):
    logs: List[LogEntry]
