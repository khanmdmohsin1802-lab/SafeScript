# 🔌 API Specifications

## 1. POST /analyze

### Request:
{
  "prompt": "string"
}

### Response:
{
  "sanitized_prompt": "string",
  "entities_detected": [],
  "risk_score": 85
}

---

## 2. POST /send

### Request:
{
  "final_prompt": "string",
  "override": true
}

---

## 3. GET /logs

### Response:
{
  "logs": []
}

---

## External APIs:
- OpenAI API (for LLM responses)