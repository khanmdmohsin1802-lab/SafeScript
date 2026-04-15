# 🗄️ Database Schema

## 1. Users Table
- id (uuid)
- email (string)
- role (string) → dev / manager / intern
- created_at (timestamp)

---

## 2. Organizations Table
- id (uuid)
- name (string)
- created_at (timestamp)

---

## 3. Prompts Table
- id (uuid)
- user_id (uuid)
- original_prompt (text) [OPTIONAL: masked or omitted for security]
- sanitized_prompt (text)
- risk_score (int)
- created_at (timestamp)

---

## 4. Overrides Table
- id (uuid)
- user_id (uuid)
- prompt_id (uuid)
- override_type (string)
- risk_level (string)
- created_at (timestamp)

---

## 5. Audit Logs Table
- id (uuid)
- user_id (uuid)
- action (string)
- metadata (json)
- created_at (timestamp)

---

## 6. Policies Table
- id (uuid)
- organization_id (uuid)
- rule_type (string)
- config (json)
- created_at (timestamp)