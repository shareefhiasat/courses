# Highlight Attention Feature — Demo Guide

## Overview

The **Highlight Attention** feature on the Daily Attendance QR Scanner page visually flags students based on their cumulative absence count in a specific class. This helps instructors quickly identify students who may be at risk of failing due to excessive absences.

## Highlight Thresholds

| Color   | Absence Count | Hex Code     |
|--------|---------------|-------------|
| Yellow | 4–5 absences  | `#fef08a`   |
| Orange | 6–7 absences  | `#fed7aa`   |
| Red    | 8+ absences   | `#fecaca`   |

> **Note:** Absences counted include `ATTENDANCE_ABSENT`, `ABSENT_WITH_EXCUSE`, and `ATTENDANCE_HUMAN_CASE` statuses. Late arrivals and excused leaves are **not** counted as absences.

## How to Demo

### Prerequisites
- The app running locally with the database seeded
- Login as an instructor or admin user

### Steps

1. Navigate to **Daily Attendance** → **QR Scanner** page
2. Select a **Program**, **Subject**, and **Class** from the dropdowns (see recommended classes below)
3. Pick any date on the calendar
4. Click the **Highlight Attention** button (alert icon) in the roster toolbar
5. Observe the student rows change color based on their absence counts
6. Click the button again to turn off highlighting

### Recommended Demo Classes

These classes have real students in all three highlight categories:

---

#### Class 1: Database Management — Spring 2024 (Best for clean demo)

- **Program:** Information Technology Diploma (`IT`)
- **Subject:** Database Management (`DB101`)
- **Class:** `DB101-2024-SPRING-A` (class ID: 20)

| Student | Student # | Absences | Highlight Color |
|---------|-----------|----------|-----------------|
| Noura Al-Fahad | STU010 | 4 | 🟡 Yellow |
| Mohammed Khalid | STU003 | 7 | 🟠 Orange |
| Aisha Hassan | STU004 | 18 | 🔴 Red |

---

#### Class 2: Network Fundamentals — Spring 2024

- **Program:** Information Technology Diploma (`IT`)
- **Subject:** Network Fundamentals (`NET101`)
- **Class:** `NET101-2024-SPRING-A` (class ID: 21)

| Student | Student # | Absences | Highlight Color |
|---------|-----------|----------|-----------------|
| Fatima Ali | STU002 | 5 | 🟡 Yellow |
| Mohammed Khalid | STU003 | 7 | 🟠 Orange |
| Abdullah Khalifa | STU009 | 8 | 🔴 Red |
| Noura Al-Fahad | STU010 | 9 | 🔴 Red |

---

#### Class 3: Computer Science Fundamentals — Spring 2024

- **Program:** Information Technology Diploma (`IT`)
- **Subject:** Computer Science Fundamentals (`CS101`)
- **Class:** `CS101-2024-SPRING-A` (class ID: 22)

| Student | Student # | Absences | Highlight Color |
|---------|-----------|----------|-----------------|
| Ahmed Mohammed | STU001 | 5 | 🟡 Yellow |
| Abdullah Khalifa | STU009 | 5 | 🟡 Yellow |
| Fatima Ali | STU002 | 6 | 🟠 Orange |
| Aisha Hassan | STU004 | 13 | 🔴 Red |

---

## Additional Features to Demo

### Expand/Collapse All Buttons
- Located in the roster toolbar (double-chevron icons)
- **Expand All** (↓↓): Expands all student rows to show history
- **Collapse All** (↑↑): Collapses all student rows
- Useful for quickly reviewing all students or getting a compact view

### Individual Row Expansion
- Click the expand button on any student row to see their attendance history
- History is filtered to show only records for the selected calendar day

### Highlight Toggle Does NOT Expand/Collapse
- Toggling the highlight button only changes row colors
- It does **not** expand or collapse student records (previous bug, now fixed)

## Technical Details

### Files Involved

| File | Purpose |
|------|---------|
| `src/constants/attendanceTypes.js` | Defines thresholds and colors |
| `src/utils/attendanceHighlight.js` | Calculates attention score and highlight style |
| `src/components/qr-scanner/StudentRoster.jsx` | Renders roster with highlight and expand/collapse |
| `src/components/ui/history/StudentTableRow.jsx` | Renders individual student rows with highlight style |
| `src/pages/operations/attendance/QRScannerPage.jsx` | Loads students and computes attendance stats |

### Key Logic

```
Attention Score = absent + absentWithExcuse + humanitarianCase

if score >= 8 → RED (#fecaca)
if score >= 6 && score <= 7 → ORANGE (#fed7aa)
if score >= 4 && score <= 5 → YELLOW (#fef08a)
otherwise → no highlight
```

### Stats Are Scoped
Attendance stats are filtered by the selected **class**, **program**, and **subject** — not across all classes a student is enrolled in. This ensures the highlight accurately reflects absences in the currently viewed class only.
