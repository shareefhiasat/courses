---
title: User Access & Permissions
tags: [permissions, access, UCA, matrix, roles, super admin, HR, admin, instructor, data scope]
route: /user-category-access
order: 2
keywords: [user access, permission matrix, user category access, UCA, data scope, super admin, HR, admin, instructor, role, RBAC, charts, analytics scope, availability calendar]
---

# User Access & Permissions

The LMS uses **five layers** of access control. Super Admin configures what HR, Admin, and Instructors can do; data visibility is controlled separately from screen permissions.

## User Access Studio (Dashboard → User Access)

Super Admin only. Replaces the old grid with a split workspace:

| Area | Purpose |
| --- | --- |
| **User roster (left)** | Search users, filter by role chips (All / HR / Admin / Instructor), avatar + role badge — same UX as chat group/DM picker |
| **Academic Boundary tab** | Add UCA rows; program/subject/class dropdowns show **class and instructor counts** (QR Scanner style) |
| **Visibility Lens tab** | Per-dimension mode: **All** · **Within UCA** · **Pick Specific** |
| **Scope row activity chips** | Classes, Workflows, Attendance, Sessions counts for each UCA row |
| **Effective Preview (bottom)** | Live summary of selected user's configuration |

Press **Help** or the tour button for a guided Joyride in English or Arabic.

### Adding an academic boundary row

1. Select user in the roster.
2. Choose **Category** (required).
3. Optionally narrow with **Program**, **Subject**, **Class** — dropdown subtext shows counts.
4. Click **Add Scope Row**.
5. Review activity chips on each row to see how active that scope is.

### Visibility lens defaults

| Dimension | Default | Typical HR Use |
| --- | --- | --- |
| Programs | Within UCA | Keep operational data in assigned programs |
| Subjects | Within UCA | Same |
| Classes | Within UCA | Same |
| **Instructors** | **All** | Search/filter any instructor for scheduling — even unassigned |
| **Rooms** | **All** | Search/filter any room for availability analytics |

When **Instructors** or **Rooms** = **All**, pickers and analytics show the full catalog; **writes** still respect UCA.

When set to **Within UCA**, only resources linked to UCA rows appear.

When set to **Pick Specific**, use multi-select to hand-pick programs, subjects, classes, instructors, or rooms.

## Five layers

| Layer | What it controls | Configured by |
| --- | --- | --- |
| **1. Identity** | Keycloak role (super_admin, admin, hr, instructor, student) | Keycloak / Users |
| **2. Permission Matrix** | Which screens and actions each role can use | Super Admin only |
| **3. User Category Access (UCA)** | Academic boundary — programs, subjects, classes for operational data | Super Admin only |
| **4. Visibility lens** | How wide pickers, analytics & availability read (ALL / UCA / Pick specific) | Super Admin only — **User Access Studio** |
| **5. Resource ACL** | Smart Drive shares, workflow participants | Per file / workflow |

## Super Admin vs HR / Admin

| Capability | Super Admin | HR / Admin |
| --- | --- | --- |
| Data scope | Unrestricted — all programs and classes | **UCA rows only** — empty UCA = no academic data |
| Permission Matrix | Can edit | Cannot edit (hard gate) |
| User Category Access | Can manage | Cannot manage (hard gate) |
| Matrix screen permissions | Bypasses checks at runtime | Whatever Super Admin configured |

HR and Admin are **the same for data scope**. Differences between HR and Admin are **only** what Super Admin sets in the Permission Matrix (e.g. HR may get attendance ops Admin does not).

## User Category Access (UCA)

Assign access on **Dashboard → User Access** (Super Admin only):

1. Select user (Admin, HR, or Instructor).
2. Pick **category**, then optionally narrow to **program → subject → class**.
3. **canView** — read data in that scope.
4. **canManage** — read and write within that scope.

Multiple rows per user are allowed (e.g. Program A + Program B in the same category).

## Visibility lens (User Access Studio)

Per user, Super Admin sets how **wide** each dimension reads in pickers, analytics, and availability — separate from the academic boundary:

| Dimension | Default | Options |
| --- | --- | --- |
| Programs | Within UCA | **All** · Within UCA · Pick specific |
| Subjects | Within UCA | **All** · Within UCA · Pick specific |
| Classes | Within UCA | **All** · Within UCA · Pick specific |
| **Instructors** | **All** | **All** · Within UCA · Pick specific |
| **Rooms** | **All** | **All** · Within UCA · Pick specific |

**Example — HR on Program A (ideal case):**
- UCA: Program A (attendance, marks, workflows stay in Program A)
- Instructors/Rooms: **All** (search any instructor or room for scheduling/analytics)
- Admin on Program A: same pattern; matrix defines screen differences

**Writes** (marks, attendance submit, workflow actions) always respect UCA — visibility ALL does not widen write access.

**Instructors mode = Within UCA:** only instructors assigned to scoped classes or with sessions in scoped programs.

**Pick specific:** one-to-many grants (e.g. hand-pick instructors even if unassigned to a program).

## Permission dependencies

When Super Admin grants an action in the matrix, prerequisites are **auto-enabled**:

- Create / Update / Delete / Export requires **View** on the same screen.
- QR Edit / Bulk scan requires **Mark Attendance**.
- Workflow actions require **Workflow View**.
- Drive write ops require **Drive View**.
- Dashboard tab permissions require **Dashboard View**.

The matrix UI shows an amber notice listing implied grants.

## Charts and analytics scope

Charts use the shared widget engine (`BarChart`, `LineChart`, `PieChart`, `AreaChart`, `ListChart`) via **Dashboard Engine** and **Widget Wrapper**. They appear on:

- **Summary Dashboard** — scheduling metrics, effort reports, attendance charts
- **Advanced Analytics** — Drive, Workflow, Activity widgets
- **Student Dashboard** — performance and attendance tabs
- **Availability / scheduling views** — utilisation and session summaries where configured

**Data in charts follows the same scope rules as list APIs:**

| User | Chart data |
| --- | --- |
| Super Admin | All data |
| HR / Admin with UCA on Program A | Only Program A (and nested subjects/classes) |
| Instructor | Taught classes ∪ UCA |
| Student | Own enrollments / profile |

If a chart shows instructors, classes, or sessions, visibility follows **Visibility Lens** settings for that dimension. Operational aggregates (attendance, marks) always respect UCA.

## Availability & scheduling calendar (HR on Program A)

UCA rows define **how wide** the lens is. The Permission Matrix only grants **screen access** — it does not widen data.

| UCA row | What HR/Admin sees |
| --- | --- |
| **Program A** | All **classes** in Program A; **instructors** assigned to those classes or with flex sessions in Program A; **rooms** used by those classes/sessions; summary widgets (Instructors, Classes, Rooms, Attendance) scoped the same way |
| **Subject in Program A** | Classes in that subject only |
| **Single class** | That class only, its instructor(s), and its room(s) |

**Instructor availability (by instructor):** Depends on **Visibility Lens → Instructors**:
- **All** (default): every instructor appears in search/filters/analytics.
- **Within UCA**: only instructors linked to scoped classes or Program A sessions.
- **Pick Specific**: only hand-picked instructors.

**Class availability:** Only classes inside the UCA scope. Program row → all classes in program; class row → one class.

**Room availability:** Depends on **Visibility Lens → Rooms**:
- **All** (default): full room catalog for search and analytics.
- **Within UCA**: rooms used by scoped classes/sessions only.

**Summary dashboard charts** (Overview, Sessions, Instructors, Classes, Rooms, Attendance, etc.): All use the same scoped APIs. Filters (program, class, instructor) only narrow **within** your UCA — they cannot reveal out-of-scope data. Super Admin sees everything.

Admin behaves the same as HR for data scope. Super Admin sees everything.

## Smart Drive & workflow files

- Matrix `drive.*` gates API access.
- File-level sharing uses VIEW → DOWNLOAD → COMMENT → EDIT.
- Workflow auto-share sends files to **scoped users** (role + UCA on the workflow class), not the entire role globally.

## Related articles

- [Dashboard](/en/dashboard) — Admin hub and User Access tab
- [Analytics](/en/analytics) — Widget charts and summary cards
- [Scheduling](/en/scheduling) — Calendar and availability screens
- [Workflow](/en/workflow) — Approvals and file sharing
