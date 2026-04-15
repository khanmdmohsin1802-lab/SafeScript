# 🎨 Design Guidelines — SafeScript (Dark Mode SaaS)

## 1. 🎯 Design Philosophy

SafeScript UI should feel:
- Clean and corporate
- Secure and trustworthy
- Minimal yet powerful
- Data-driven without clutter

Inspired by:
- Enterprise dashboards
- Security & compliance platforms

---

## 2. 🌑 Theme: DARK MODE (PRIMARY)

### Background Layers:

- Main Background: #0B0F14
- Card Background: #111827
- Secondary Surface: #1F2937

---

## 3. 🎨 Color Palette

### Primary (Brand)
- Indigo: #6366F1

### Success / Safe
- Green: #22C55E

### Warning / Medium Risk
- Amber: #F59E0B

### Danger / High Risk
- Red: #EF4444

### Neutral Text
- Primary: #E5E7EB
- Secondary: #9CA3AF

---

## 4. ✍️ Typography

- Font: Inter
- Headings: Semi-bold / Bold
- Body: Regular
- Metrics (numbers): Large, bold emphasis

---

## 5. 🧩 Layout Structure

## 🔲 A. Top Navigation Bar

### Left:
- Logo: **SafeScript**
- Navigation:
  - Dashboard
  - Monitoring
  - Policies
  - Support

### Right:
- Search icon
- Filters:
  - Date
  - Model
  - User
- Profile avatar

---

## 🔲 B. Left Sidebar (Icon-Based)

Minimal circular icon sidebar:

- 🏠 Dashboard  
- 📊 Monitoring  
- 🔐 Policies  
- 📜 Logs  
- ⚙️ Settings  

---

## 🔲 C. Main Dashboard Grid

- 2-column responsive layout
- Card-based UI
- Rounded corners (16px–20px)
- Soft shadows

---

## 6. 📊 Dashboard Components

---

## 🔹 1. Security Overview Card

Displays:
- % Safe Prompts
- % Risky Prompts
- Mini line chart (Recharts)

---

## 🔹 2. Threat Detection Card

Displays:
- API Keys detected
- PII masked
- Financial data flagged

---

## 🔹 3. Threat Activity Timeline

Replaces project timeline.

Shows:
- Prompt events over time

Color mapping:
- 🟢 Safe
- 🟡 Medium Risk
- 🔴 High Risk

---

## 🔹 4. Sensitive Data Breakdown

Bar chart using **Recharts**

Categories:
- API Keys
- Emails
- Financial Data
- Internal Codes

Color:
- Green → Safe
- Orange → Masked
- Red → Risk

---

## 🔹 5. Activity Logs Panel

Scrollable card:

Example:
[12:01] API Key Masked  
[12:03] High Risk Prompt Sent  
[12:05] Override by dev@company.com  

---

## 7. 🧪 Prompt Interface UI

### ✏️ Input Section

- Large text input
- Button: "Analyze Prompt"

---

### 🔍 Preview Modal (Core Feature)

#### Layout:

LEFT:
- Original Prompt (read-only)

RIGHT:
- Sanitized Prompt (editable)

---

### Highlighting:

- Sensitive data → Red highlight
- Tokens → Neutral gray/blue

---

### Actions:

- [Edit Prompt]
- [Reveal Selected Fields]
- [Send Anyway ⚠️]
- [Cancel]

---

## 8. 🧑‍💼 Admin Dashboard UI

### Sidebar Sections:

- Users  
- Roles  
- Policies  
- Logs  
- Alerts  

---

### Tables:

#### Users Table:
- Email
- Role
- Permissions

#### Logs Table:
- Action
- User
- Risk Level
- Timestamp

---

## 9. 🎨 UI Elements

### Cards:
- Rounded: 18px
- Padding: 16–24px

---

### Buttons:

- Primary: Indigo (#6366F1)
- Danger: Red (#EF4444)
- Secondary: Dark gray

---

### Icons:
- Use **lucide-react**
- Clean, minimal line icons

---

## 10. ✨ Micro Interactions (Subtle)

- Hover elevation on cards
- Smooth transitions (150–200ms)
- Button press feedback
- Chart animations (Recharts default)

---

## 11. 📊 Charts

Library: **Recharts**

Use for:
- Line charts (metrics)
- Bar charts (data breakdown)
- Timeline visualization

---

## 12. 📱 Responsiveness

- Desktop-first (priority)
- Tablet: optional
- Mobile: not required (MVP)

---

## 13. 🔐 Visual Identity Notes

SafeScript should feel like:
- A **corporate security tool**
- Clean, reliable, not flashy

Avoid:
- Neon/glow effects
- Over-animations

---

## 14. 🧨 Final Design Direction

> “A clean, enterprise-grade dark dashboard focused on security, clarity, and control.”
