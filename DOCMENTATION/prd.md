# 🛡️ InsightShield — Product Requirements Document

## 1. App Objective & Summary
InsightShield is a privacy-first AI gateway that prevents sensitive data leakage when employees use external AI tools (like ChatGPT, Claude, etc.). It detects, masks, and controls sensitive information in prompts while allowing safe overrides and providing enterprise-level monitoring and governance.

---

## 2. Target Audience

### Primary Users:
- Developers
- Analysts
- Customer support agents

### Secondary Users:
- Security teams
- IT administrators
- Compliance officers

---

## 3. Core Features (MVP)

### 🔹 1. AI Gateway (Reverse Proxy)
- Intercept user prompts before reaching AI APIs

### 🔹 2. Sensitive Data Detection
- Detect:
  - PII (name, email)
  - API keys
  - financial data

### 🔹 3. Smart Masking
- Replace sensitive data with tokens

### 🔹 4. Response Rehydration
- Restore original values after AI response

### 🔹 5. Secure Prompt Preview & Override
- Show sanitized prompt
- Allow editing + controlled unmasking
- Risk warning before sending

### 🔹 6. Risk Scoring
- Assign risk level (Low/Medium/High)

### 🔹 7. Basic Admin Dashboard
- View logs
- Manage users
- Assign roles

---

## 4. User Journeys

### 🧑‍💻 User Flow (Employee)
1. User logs in via SSO
2. User submits prompt
3. InsightShield intercepts
4. System detects sensitive data
5. Prompt is masked
6. Preview screen appears
7. User:
   - edits OR
   - unmask specific fields OR
   - sends as-is
8. System re-validates
9. Prompt sent to AI
10. Response rehydrated
11. Final output shown

---

### 🧑‍💼 Admin Flow
1. Admin logs into dashboard
2. Views system activity
3. Adds users
4. Assigns roles (dev, intern, manager)
5. Defines policies
6. Monitors overrides and alerts

---

## 5. Out of Scope (MVP)

- Full browser extension
- Federated learning
- Advanced ML model training
- Multi-modal input (PDF/images)
- Full enterprise integrations (Slack, GitHub)

---

## 6. Success Metrics

- Detection accuracy ≥ 85%
- Latency < 300ms
- Successful masking + rehydration
- Admin dashboard usability