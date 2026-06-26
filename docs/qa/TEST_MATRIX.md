# Military LMS — Comprehensive Test Matrix

**Version:** 1.0  
**Date:** 2026-06-24  
**Author:** Shareef Hiasat  
**Purpose:** Baseline for Playwright E2E test coverage across the entire Military LMS

---

## How to Use This Document

1. Each module has its own section with **API routes**, **UI pages**, **business cases**, and **test case IDs**.
2. Test case IDs follow the pattern `TC-{MODULE}-{NNN}`.
3. Tags/labels for Linear: `module:{name}`, `type:{api|ui|integration}`, `priority:{critical|high|medium|low}`.
4. Bugs found during test design are marked with 🐛 and should be filed in Linear.

---

## Module Index

| # | Module | Tag | API Routes | UI Pages | Test Cases |
|---|--------|-----|-----------|----------|------------|
| 1 | Authentication & Authorization | `module:auth` | 6 | 3 | 18 |
| 2 | Programs | `module:programs` | 6 | 1 | 20 |
| 3 | Subjects | `module:subjects` | 8 | 1 | 22 |
| 4 | Classes | `module:classes` | 8 | 1 | 24 |
| 5 | Enrollments | `module:enrollments` | 8 | 2 | 22 |
| 6 | Activities | `module:activities` | 6 | 2 | 18 |
| 7 | Resources | `module:resources` | 6 | 1 | 18 |
| 8 | Announcements | `module:announcements` | 7 | 1 | 20 |
| 9 | Quizzes | `module:quizzes` | 7 | 5 | 28 |
| 10 | Attendance | `module:attendance` | 6 | 2 | 20 |
| 11 | Standup Attendance | `module:standup-attendance` | 7 | 1 | 18 |
| 12 | Penalties | `module:penalties` | 7 | 1 | 18 |
| 13 | Participations | `module:participations` | 10 | 1 | 24 |
| 14 | Behaviors | `module:behaviors` | 7 | 1 | 18 |
| 15 | Marks | `module:marks` | 7 | 1 | 20 |
| 16 | Chat | `module:chat` | 9 | 1 | 30 |
| 17 | Notifications | `module:notifications` | 10 | 2 | 22 |
| 18 | Smart Drive | `module:drive` | 40+ | 1 | 45 |
| 19 | Workflow Documents | `module:workflow` | 18 | 5 | 35 |
| 20 | Scheduling — Classrooms | `module:classrooms` | 7 | 1 | 18 |
| 21 | Scheduling — Time Slots | `module:time-slots` | 8 | 0 | 16 |
| 22 | Scheduling — Holidays | `module:holidays` | 7 | 0 | 14 |
| 23 | Scheduling — Teacher Availability | `module:teacher-availability` | 7 | 1 | 16 |
| 24 | Scheduling — Sessions | `module:schedule-sessions` | 9 | 1 | 20 |
| 25 | Scheduling — Summary Dashboard | `module:scheduling-summary` | 12 | 2 | 22 |
| 26 | Classroom Availability | `module:classroom-availability` | 5 | 1 | 12 |
| 27 | Admin Scopes | `module:admin-scopes` | 7 | 0 | 14 |
| 28 | Dashboard & Analytics | `module:dashboard` | 5 | 3 | 16 |
| 29 | Lookup Management | `module:lookup` | 12 | 1 | 20 |
| 30 | User Images | `module:user-images` | 5 | 0 | 10 |
| 31 | Permissions | `module:permissions` | 2 | 1 | 8 |
| 32 | Weekly Summary | `module:weekly-summary` | 2 | 1 | 6 |
| 33 | Audit Export | `module:audit-export` | 2 | 0 | 4 |
| 34 | Attendance Amendment | `module:attendance-amendment` | 3 | 0 | 6 |
| 35 | Instructor History | `module:instructor-history` | 4 | 0 | 8 |
| 36 | User Management | `module:users` | 10 | 2 | 22 |
| 37 | Profile & Settings | `module:profile` | 3 | 2 | 12 |
| 38 | Localization (i18n) | `module:i18n` | 0 | ALL | 14 |
| 39 | Role-Based Access Control | `module:rbac` | 0 | ALL | 20 |
| 40 | Help System | `module:help` | 6 | 0 | 10 |
| **Total** | | | **~300** | **~40** | **~640** |

---

## 1. Authentication & Authorization (`module:auth`)

### API Routes
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/users/me` | Get current user profile |
| GET | `/api/v1/me/data-scope` | Get effective data scope |
| GET | `/api/v1/permissions` | Get all permissions |
| PUT | `/api/v1/permissions` | Update permissions (super_admin) |
| POST | `/api/v1/notifications/admin/test` | Test notification (admin) |
| — | Keycloak login/logout | SSO flow |

### UI Pages
- `/login` — LoginPage
- `/unauthorized` — UnauthorizedPage
- `/silent-check-sso.html` — Silent SSO check

### Test Cases

| ID | Test | Priority | Type | Tags |
|----|------|----------|------|------|
| TC-AUTH-001 | Login with valid super_admin credentials | critical | ui | `module:auth`, `type:ui` |
| TC-AUTH-002 | Login with valid admin credentials | critical | ui | `module:auth`, `type:ui` |
| TC-AUTH-003 | Login with valid instructor credentials | critical | ui | `module:auth`, `type:ui` |
| TC-AUTH-004 | Login with valid student credentials | critical | ui | `module:auth`, `type:ui` |
| TC-AUTH-005 | Login with invalid credentials shows error | high | ui | `module:auth`, `type:ui` |
| TC-AUTH-006 | Login with empty fields shows validation | medium | ui | `module:auth`, `type:ui` |
| TC-AUTH-007 | Logout clears session and redirects | critical | ui | `module:auth`, `type:ui` |
| TC-AUTH-008 | Protected route redirects to login when unauthenticated | critical | ui | `module:auth`, `type:ui` |
| TC-AUTH-009 | Session persists on page refresh | high | ui | `module:auth`, `type:ui` |
| TC-AUTH-010 | Unauthorized page shows for insufficient role | high | ui | `module:auth`, `type:ui` |
| TC-AUTH-011 | GET /users/me returns correct profile | critical | api | `module:auth`, `type:api` |
| TC-AUTH-012 | GET /users/me without token returns 401 | critical | api | `module:auth`, `type:api` |
| TC-AUTH-013 | GET /me/data-scope returns scope for admin | high | api | `module:auth`, `type:api` |
| TC-AUTH-014 | GET /permissions returns list (authenticated) | medium | api | `module:auth`, `type:api` |
| TC-AUTH-015 | PUT /permissions as super_admin succeeds | high | api | `module:auth`, `type:api` |
| TC-AUTH-016 | PUT /permissions as non-super_admin returns 403 | high | api | `module:auth`, `type:api` |
| TC-AUTH-017 | Silent SSO check page loads | low | ui | `module:auth`, `type:ui` |
| TC-AUTH-018 | Role-based redirect after login | high | ui | `module:auth`, `type:ui` |

---

## 2. Programs (`module:programs`)

### API Routes
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/programs` | List all programs (paginated) |
| GET | `/api/v1/programs/:id` | Get program by ID |
| POST | `/api/v1/programs` | Create program |
| PUT | `/api/v1/programs/:id` | Update program |
| DELETE | `/api/v1/programs/:id` | Soft delete program |
| DELETE | `/api/v1/programs/:id/hard` | Hard delete program |

### UI Pages
- `/programs` — ProgramsManagementPage

### Test Cases

| ID | Test | Priority | Type | Tags |
|----|------|----------|------|------|
| TC-PROG-001 | GET /programs returns paginated list | critical | api | `module:programs`, `type:api` |
| TC-PROG-002 | GET /programs with search query filters results | high | api | `module:programs`, `type:api` |
| TC-PROG-003 | GET /programs with pagination params (page, limit) | high | api | `module:programs`, `type:api` |
| TC-PROG-004 | GET /programs/:id returns program details | critical | api | `module:programs`, `type:api` |
| TC-PROG-005 | GET /programs/:id with invalid ID returns 404 | medium | api | `module:programs`, `type:api` |
| TC-PROG-006 | POST /programs creates program with valid data | critical | api | `module:programs`, `type:api` |
| TC-PROG-007 | POST /programs with missing required fields returns 400 | high | api | `module:programs`, `type:api` |
| TC-PROG-008 | POST /programs with duplicate code returns error | high | api | `module:programs`, `type:api` |
| TC-PROG-009 | PUT /programs/:id updates program | critical | api | `module:programs`, `type:api` |
| TC-PROG-010 | PUT /programs/:id with invalid ID returns 404 | medium | api | `module:programs`, `type:api` |
| TC-PROG-011 | DELETE /programs/:id soft-deletes program | high | api | `module:programs`, `type:api` |
| TC-PROG-012 | DELETE /programs/:id/hard permanently deletes | high | api | `module:programs`, `type:api` |
| TC-PROG-013 | UI: Programs page loads and displays list | critical | ui | `module:programs`, `type:ui` |
| TC-PROG-014 | UI: Create new program via form | critical | ui | `module:programs`, `type:ui` |
| TC-PROG-015 | UI: Edit existing program | high | ui | `module:programs`, `type:ui` |
| TC-PROG-016 | UI: Delete program with confirmation | high | ui | `module:programs`, `type:ui` |
| TC-PROG-017 | UI: Search programs by name/code | medium | ui | `module:programs`, `type:ui` |
| TC-PROG-018 | UI: Pagination controls work | medium | ui | `module:programs`, `type:ui` |
| TC-PROG-019 | UI: Arabic name field accepts Arabic text | medium | ui | `module:programs`, `type:ui`, `i18n` |
| TC-PROG-020 | UI: Program code field enforces uniqueness | high | ui | `module:programs`, `type:ui` |

---

## 3. Subjects (`module:subjects`)

### API Routes
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/subjects` | List subjects (paginated, filterable) |
| GET | `/api/v1/subjects/subject-types` | Get subject types |
| GET | `/api/v1/subjects/requirement-types` | Get requirement types |
| GET | `/api/v1/subjects/:id` | Get subject by ID |
| GET | `/api/v1/subjects/program/:programId` | Get subjects by program |
| POST | `/api/v1/subjects` | Create subject |
| PUT | `/api/v1/subjects/:id` | Update subject |
| DELETE | `/api/v1/subjects/:id` | Delete subject |

### UI Pages
- `/subjects` — SubjectsManagementPage

### Test Cases

| ID | Test | Priority | Type | Tags |
|----|------|----------|------|------|
| TC-SUBJ-001 | GET /subjects returns paginated list | critical | api | `module:subjects`, `type:api` |
| TC-SUBJ-002 | GET /subjects with programId filter | high | api | `module:subjects`, `type:api` |
| TC-SUBJ-003 | GET /subjects with search query | high | api | `module:subjects`, `type:api` |
| TC-SUBJ-004 | GET /subjects/:id returns details | critical | api | `module:subjects`, `type:api` |
| TC-SUBJ-005 | GET /subjects/program/:programId returns filtered list | high | api | `module:subjects`, `type:api` |
| TC-SUBJ-006 | GET /subjects/subject-types returns types | medium | api | `module:subjects`, `type:api` |
| TC-SUBJ-007 | GET /subjects/requirement-types returns types | medium | api | `module:subjects`, `type:api` |
| TC-SUBJ-008 | POST /subjects creates with valid data | critical | api | `module:subjects`, `type:api` |
| TC-SUBJ-009 | POST /subjects with missing required fields returns 400 | high | api | `module:subjects`, `type:api` |
| TC-SUBJ-010 | PUT /subjects/:id updates subject | critical | api | `module:subjects`, `type:api` |
| TC-SUBJ-011 | DELETE /subjects/:id removes subject | high | api | `module:subjects`, `type:api` |
| TC-SUBJ-012 | DELETE /subjects with dependencies returns 400 | high | api | `module:subjects`, `type:api` |
| TC-SUBJ-013 | UI: Subjects page loads | critical | ui | `module:subjects`, `type:ui` |
| TC-SUBJ-014 | UI: Create subject with program association | critical | ui | `module:subjects`, `type:ui` |
| TC-SUBJ-015 | UI: Edit subject | high | ui | `module:subjects`, `type:ui` |
| TC-SUBJ-016 | UI: Delete subject | high | ui | `module:subjects`, `type:ui` |
| TC-SUBJ-017 | UI: Filter subjects by program | high | ui | `module:subjects`, `type:ui` |
| TC-SUBJ-018 | UI: Search subjects | medium | ui | `module:subjects`, `type:ui` |
| TC-SUBJ-019 | UI: Arabic name field | medium | ui | `module:subjects`, `type:ui`, `i18n` |
| TC-SUBJ-020 | UI: Subject types dropdown populates | medium | ui | `module:subjects`, `type:ui` |
| TC-SUBJ-021 | UI: Requirement types dropdown populates | medium | ui | `module:subjects`, `type:ui` |
| TC-SUBJ-022 | UI: Credits field accepts only numbers | low | ui | `module:subjects`, `type:ui` |

---

## 4. Classes (`module:classes`)

### API Routes
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/classes` | List classes (paginated, filterable) |
| GET | `/api/v1/classes/:id` | Get class by ID |
| GET | `/api/v1/classes/program/:programId` | By program |
| GET | `/api/v1/classes/subject/:subjectId` | By subject |
| GET | `/api/v1/classes/instructor/:instructorId` | By instructor |
| POST | `/api/v1/classes` | Create class |
| PUT | `/api/v1/classes/:id` | Update class |
| DELETE | `/api/v1/classes/:id` | Delete class |

### UI Pages
- `/scheduling-calendar?tab=classes` — SchedulingCalendarPage (classes tab)

### Test Cases

| ID | Test | Priority | Type | Tags |
|----|------|----------|------|------|
| TC-CLS-001 | GET /classes returns paginated list | critical | api | `module:classes`, `type:api` |
| TC-CLS-002 | GET /classes with programId filter | high | api | `module:classes`, `type:api` |
| TC-CLS-003 | GET /classes with instructorId filter | high | api | `module:classes`, `type:api` |
| TC-CLS-004 | GET /classes/:id returns details | critical | api | `module:classes`, `type:api` |
| TC-CLS-005 | GET /classes/program/:programId | high | api | `module:classes`, `type:api` |
| TC-CLS-006 | GET /classes/subject/:subjectId | high | api | `module:classes`, `type:api` |
| TC-CLS-007 | GET /classes/instructor/:instructorId | high | api | `module:classes`, `type:api` |
| TC-CLS-008 | POST /classes creates with valid data | critical | api | `module:classes`, `type:api` |
| TC-CLS-009 | POST /classes with missing required fields returns 400 | high | api | `module:classes`, `type:api` |
| TC-CLS-010 | PUT /classes/:id updates class | critical | api | `module:classes`, `type:api` |
| TC-CLS-011 | DELETE /classes/:id removes class | high | api | `module:classes`, `type:api` |
| TC-CLS-012 | DELETE /classes with enrollments returns 400 | high | api | `module:classes`, `type:api` |
| TC-CLS-013 | UI: Classes tab in scheduling calendar loads | critical | ui | `module:classes`, `type:ui` |
| TC-CLS-014 | UI: Create new class | critical | ui | `module:classes`, `type:ui` |
| TC-CLS-015 | UI: Edit class (change instructor) | high | ui | `module:classes`, `type:ui` |
| TC-CLS-016 | UI: Delete class | high | ui | `module:classes`, `type:ui` |
| TC-CLS-017 | UI: Filter classes by program | high | ui | `module:classes`, `type:ui` |
| TC-CLS-018 | UI: Filter classes by subject | medium | ui | `module:classes`, `type:ui` |
| TC-CLS-019 | UI: Max capacity field validation | medium | ui | `module:classes`, `type:ui` |
| TC-CLS-020 | UI: Arabic name field | medium | ui | `module:classes`, `type:ui`, `i18n` |
| TC-CLS-021 | UI: Class code uniqueness | high | ui | `module:classes`, `type:ui` |
| TC-CLS-022 | UI: Instructor dropdown populates | medium | ui | `module:classes`, `type:ui` |
| TC-CLS-023 | UI: Subject dropdown filtered by program | high | ui | `module:classes`, `type:ui` |
| TC-CLS-024 | UI: Pagination works | medium | ui | `module:classes`, `type:ui` |

---

## 5. Enrollments (`module:enrollments`)

### API Routes
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/enrollments` | List enrollments |
| GET | `/api/v1/enrollments/students-by-class` | Students by class |
| GET | `/api/v1/enrollments/:id` | Get enrollment by ID |
| GET | `/api/v1/enrollments/student/:studentId` | By student |
| GET | `/api/v1/enrollments/class/:classId` | By class |
| GET | `/api/v1/enrollments/program/:programId` | By program |
| POST | `/api/v1/enrollments` | Create enrollment |
| PUT | `/api/v1/enrollments/:id` | Update enrollment |
| DELETE | `/api/v1/enrollments/:id` | Delete enrollment |

### UI Pages
- `/enrollments` — EnrollmentsPage
- `/manage-enrollments` — EnrollmentsPage (manage mode)

### Test Cases

| ID | Test | Priority | Type | Tags |
|----|------|----------|------|------|
| TC-ENR-001 | GET /enrollments returns list | critical | api | `module:enrollments`, `type:api` |
| TC-ENR-002 | GET /enrollments/students-by-class returns students | high | api | `module:enrollments`, `type:api` |
| TC-ENR-003 | GET /enrollments/:id returns details | critical | api | `module:enrollments`, `type:api` |
| TC-ENR-004 | GET /enrollments/student/:studentId | high | api | `module:enrollments`, `type:api` |
| TC-ENR-005 | GET /enrollments/class/:classId | high | api | `module:enrollments`, `type:api` |
| TC-ENR-006 | GET /enrollments/program/:programId | high | api | `module:enrollments`, `type:api` |
| TC-ENR-007 | POST /enrollments enrolls student in class | critical | api | `module:enrollments`, `type:api` |
| TC-ENR-008 | POST /enrollments with duplicate student+class returns error | high | api | `module:enrollments`, `type:api` |
| TC-ENR-009 | PUT /enrollments/:id updates status | high | api | `module:enrollments`, `type:api` |
| TC-ENR-010 | DELETE /enrollments/:id removes enrollment | high | api | `module:enrollments`, `type:api` |
| TC-ENR-011 | UI: Enrollments page loads | critical | ui | `module:enrollments`, `type:ui` |
| TC-ENR-012 | UI: Manage enrollments page loads | critical | ui | `module:enrollments`, `type:ui` |
| TC-ENR-013 | UI: Enroll student in class | critical | ui | `module:enrollments`, `type:ui` |
| TC-ENR-014 | UI: Unenroll student from class | high | ui | `module:enrollments`, `type:ui` |
| TC-ENR-015 | UI: Filter enrollments by class | high | ui | `module:enrollments`, `type:ui` |
| TC-ENR-016 | UI: Filter enrollments by student | medium | ui | `module:enrollments`, `type:ui` |
| TC-ENR-017 | UI: Bulk enroll students | high | ui | `module:enrollments`, `type:ui` |
| TC-ENR-018 | UI: Enrollment status change (active/withdrawn) | high | ui | `module:enrollments`, `type:ui` |
| TC-ENR-019 | UI: Max capacity enforcement | high | ui | `module:enrollments`, `type:ui` |
| TC-ENR-020 | UI: Student search in enrollment form | medium | ui | `module:enrollments`, `type:ui` |
| TC-ENR-021 | UI: Class dropdown filters by program | medium | ui | `module:enrollments`, `type:ui` |
| TC-ENR-022 | UI: Enrollment list pagination | low | ui | `module:enrollments`, `type:ui` |

---

## 6. Activities (`module:activities`)

### API Routes
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/activities` | List activities |
| GET | `/api/v1/activities/:id` | Get activity by ID |
| GET | `/api/v1/activities/class/:classId` | By class |
| POST | `/api/v1/activities` | Create activity |
| PUT | `/api/v1/activities/:id` | Update activity |
| DELETE | `/api/v1/activities/:id` | Delete activity |

### UI Pages
- `/` (home with mode=activities) — HomePage
- `/activity/:activityId` — ActivityDetailPage

### Test Cases

| ID | Test | Priority | Type | Tags |
|----|------|----------|------|------|
| TC-ACT-001 | GET /activities returns list | critical | api | `module:activities`, `type:api` |
| TC-ACT-002 | GET /activities/:id returns details | critical | api | `module:activities`, `type:api` |
| TC-ACT-003 | GET /activities/class/:classId | high | api | `module:activities`, `type:api` |
| TC-ACT-004 | POST /activities creates activity | critical | api | `module:activities`, `type:api` |
| TC-ACT-005 | POST /activities with missing fields returns 400 | high | api | `module:activities`, `type:api` |
| TC-ACT-006 | PUT /activities/:id updates activity | high | api | `module:activities`, `type:api` |
| TC-ACT-007 | DELETE /activities/:id removes activity | high | api | `module:activities`, `type:api` |
| TC-ACT-008 | DELETE /activities with submissions returns 400 | high | api | `module:activities`, `type:api` |
| TC-ACT-009 | UI: Activities list on home page | critical | ui | `module:activities`, `type:ui` |
| TC-ACT-010 | UI: Activity detail page loads | critical | ui | `module:activities`, `type:ui` |
| TC-ACT-011 | UI: Create new activity | critical | ui | `module:activities`, `type:ui` |
| TC-ACT-012 | UI: Edit activity | high | ui | `module:activities`, `type:ui` |
| TC-ACT-013 | UI: Delete activity | high | ui | `module:activities`, `type:ui` |
| TC-ACT-014 | UI: Filter activities by class | high | ui | `module:activities`, `type:ui` |
| TC-ACT-015 | UI: Activity type selection | medium | ui | `module:activities`, `type:ui` |
| TC-ACT-016 | UI: Activity attachments upload | medium | ui | `module:activities`, `type:ui` |
| TC-ACT-017 | UI: Activity due date picker | medium | ui | `module:activities`, `type:ui` |
| TC-ACT-018 | UI: Activity submission for student | high | ui | `module:activities`, `type:ui` |

---

## 7. Resources (`module:resources`)

### API Routes
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/resources` | List resources |
| GET | `/api/v1/resources/:id` | Get resource by ID |
| GET | `/api/v1/resources/class/:classId` | By class |
| POST | `/api/v1/resources` | Create resource |
| PUT | `/api/v1/resources/:id` | Update resource |
| DELETE | `/api/v1/resources/:id` | Delete resource |

### UI Pages
- `/` (home with mode=resources) — HomePage

### Test Cases

| ID | Test | Priority | Type | Tags |
|----|------|----------|------|------|
| TC-RES-001 | GET /resources returns list | critical | api | `module:resources`, `type:api` |
| TC-RES-002 | GET /resources/:id returns details | critical | api | `module:resources`, `type:api` |
| TC-RES-003 | GET /resources/class/:classId | high | api | `module:resources`, `type:api` |
| TC-RES-004 | POST /resources creates resource | critical | api | `module:resources`, `type:api` |
| TC-RES-005 | POST /resources with missing fields returns 400 | high | api | `module:resources`, `type:api` |
| TC-RES-006 | PUT /resources/:id updates resource | high | api | `module:resources`, `type:api` |
| TC-RES-007 | DELETE /resources/:id removes resource | high | api | `module:resources`, `type:api` |
| TC-RES-008 | UI: Resources list on home page | critical | ui | `module:resources`, `type:ui` |
| TC-RES-009 | UI: Upload new resource | critical | ui | `module:resources`, `type:ui` |
| TC-RES-010 | UI: Edit resource | high | ui | `module:resources`, `type:ui` |
| TC-RES-011 | UI: Delete resource | high | ui | `module:resources`, `type:ui` |
| TC-RES-012 | UI: Filter resources by class | high | ui | `module:resources`, `type:ui` |
| TC-RES-013 | UI: Resource preview/download | high | ui | `module:resources`, `type:ui` |
| TC-RES-014 | UI: Required vs optional resource flag | medium | ui | `module:resources`, `type:ui` |
| TC-RES-015 | UI: File type icon display | low | ui | `module:resources`, `type:ui` |
| TC-RES-016 | UI: Arabic title/description fields | medium | ui | `module:resources`, `type:ui`, `i18n` |
| TC-RES-017 | UI: Resource file size display | low | ui | `module:resources`, `type:ui` |
| TC-RES-018 | UI: Search resources | medium | ui | `module:resources`, `type:ui` |

---

## 8. Announcements (`module:announcements`)

### API Routes
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/announcements` | List announcements |
| GET | `/api/v1/announcements/:id` | Get by ID |
| GET | `/api/v1/announcements/program/:programId` | By program |
| GET | `/api/v1/announcements/class/:classId` | By class |
| POST | `/api/v1/announcements` | Create |
| PUT | `/api/v1/announcements/:id` | Update |
| DELETE | `/api/v1/announcements/:id` | Delete |

### UI Pages
- Announcements section within academic pages

### Test Cases

| ID | Test | Priority | Type | Tags |
|----|------|----------|------|------|
| TC-ANN-001 | GET /announcements returns list | critical | api | `module:announcements`, `type:api` |
| TC-ANN-002 | GET /announcements/:id returns details | critical | api | `module:announcements`, `type:api` |
| TC-ANN-003 | GET /announcements/program/:programId | high | api | `module:announcements`, `type:api` |
| TC-ANN-004 | GET /announcements/class/:classId | high | api | `module:announcements`, `type:api` |
| TC-ANN-005 | POST /announcements creates with valid data | critical | api | `module:announcements`, `type:api` |
| TC-ANN-006 | POST /announcements with missing fields returns 400 | high | api | `module:announcements`, `type:api` |
| TC-ANN-007 | PUT /announcements/:id updates | high | api | `module:announcements`, `type:api` |
| TC-ANN-008 | DELETE /announcements/:id removes | high | api | `module:announcements`, `type:api` |
| TC-ANN-009 | UI: Announcements list displays | critical | ui | `module:announcements`, `type:ui` |
| TC-ANN-010 | UI: Create announcement | critical | ui | `module:announcements`, `type:ui` |
| TC-ANN-011 | UI: Edit announcement | high | ui | `module:announcements`, `type:ui` |
| TC-ANN-012 | UI: Delete announcement | high | ui | `module:announcements`, `type:ui` |
| TC-ANN-013 | UI: Target audience selection (program/class/all) | high | ui | `module:announcements`, `type:ui` |
| TC-ANN-014 | UI: Priority/type dropdown | medium | ui | `module:announcements`, `type:ui` |
| TC-ANN-015 | UI: Arabic title/body fields | medium | ui | `module:announcements`, `type:ui`, `i18n` |
| TC-ANN-016 | UI: Announcement shows target audience icon | low | ui | `module:announcements`, `type:ui` |
| TC-ANN-017 | UI: Filter announcements by program | medium | ui | `module:announcements`, `type:ui` |
| TC-ANN-018 | UI: Filter announcements by class | medium | ui | `module:announcements`, `type:ui` |
| TC-ANN-019 | UI: Announcement date display | low | ui | `module:announcements`, `type:ui` |
| TC-ANN-020 | UI: Active vs inactive announcement visibility | medium | ui | `module:announcements`, `type:ui` |

---

## 9. Quizzes (`module:quizzes`)

### API Routes
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/quizzes` | List quizzes |
| GET | `/api/v1/quizzes/stats` | Quiz statistics |
| GET | `/api/v1/quizzes/creator/:userId` | By creator |
| GET | `/api/v1/quizzes/:id` | Get by ID |
| POST | `/api/v1/quizzes` | Create quiz |
| PUT | `/api/v1/quizzes/:id` | Update quiz |
| DELETE | `/api/v1/quizzes/:id` | Delete quiz |

### UI Pages
- `/quizzes` — QuizzesPage (management)
- `/quiz-preview/:quizId` — QuizPreviewPage
- `/quiz/:quizId` — StudentQuizPage (take quiz)
- `/review-results` — ReviewResultsPage
- Question Bank, Quiz Builder (sub-pages)

### Test Cases

| ID | Test | Priority | Type | Tags |
|----|------|----------|------|------|
| TC-QUIZ-001 | GET /quizzes returns list | critical | api | `module:quizzes`, `type:api` |
| TC-QUIZ-002 | GET /quizzes/stats returns statistics | high | api | `module:quizzes`, `type:api` |
| TC-QUIZ-003 | GET /quizzes/creator/:userId | high | api | `module:quizzes`, `type:api` |
| TC-QUIZ-004 | GET /quizzes/:id returns details | critical | api | `module:quizzes`, `type:api` |
| TC-QUIZ-005 | POST /quizzes creates quiz | critical | api | `module:quizzes`, `type:api` |
| TC-QUIZ-006 | PUT /quizzes/:id updates quiz | high | api | `module:quizzes`, `type:api` |
| TC-QUIZ-007 | DELETE /quizzes/:id removes quiz | high | api | `module:quizzes`, `type:api` |
| TC-QUIZ-008 | UI: Quizzes page loads with list | critical | ui | `module:quizzes`, `type:ui` |
| TC-QUIZ-009 | UI: Create new quiz | critical | ui | `module:quizzes`, `type:ui` |
| TC-QUIZ-010 | UI: Quiz builder — add questions | critical | ui | `module:quizzes`, `type:ui` |
| TC-QUIZ-011 | UI: Quiz builder — add multiple choice options | high | ui | `module:quizzes`, `type:ui` |
| TC-QUIZ-012 | UI: Quiz builder — set correct answer | high | ui | `module:quizzes`, `type:ui` |
| TC-QUIZ-013 | UI: Quiz preview page | high | ui | `module:quizzes`, `type:ui` |
| TC-QUIZ-014 | UI: Student takes quiz | critical | ui | `module:quizzes`, `type:ui` |
| TC-QUIZ-015 | UI: Quiz timer countdown | high | ui | `module:quizzes`, `type:ui` |
| TC-QUIZ-016 | UI: Quiz auto-submit on timeout | high | ui | `module:quizzes`, `type:ui` |
| TC-QUIZ-017 | UI: Quiz results display | high | ui | `module:quizzes`, `type:ui` |
| TC-QUIZ-018 | UI: Review results page | high | ui | `module:quizzes`, `type:ui` |
| TC-QUIZ-019 | UI: Question bank page | medium | ui | `module:quizzes`, `type:ui` |
| TC-QUIZ-020 | UI: Import questions from bank | medium | ui | `module:quizzes`, `type:ui` |
| TC-QUIZ-021 | UI: Quiz publish/draft toggle | high | ui | `module:quizzes`, `type:ui` |
| TC-QUIZ-022 | UI: Quiz assigned to class | high | ui | `module:quizzes`, `type:ui` |
| TC-QUIZ-023 | UI: Delete quiz with confirmation | high | ui | `module:quizzes`, `type:ui` |
| TC-QUIZ-024 | UI: Quiz pass/fail threshold setting | medium | ui | `module:quizzes`, `type:ui` |
| TC-QUIZ-025 | UI: Quiz attempt limit | medium | ui | `module:quizzes`, `type:ui` |
| TC-QUIZ-026 | UI: Student sees available quizzes | high | ui | `module:quizzes`, `type:ui` |
| TC-QUIZ-027 | UI: Quiz score in student dashboard | medium | ui | `module:quizzes`, `type:ui` |
| TC-QUIZ-028 | UI: Arabic quiz title/description | medium | ui | `module:quizzes`, `type:ui`, `i18n` |

---

## 10. Attendance (`module:attendance`)

### API Routes
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/attendance` | List all attendance |
| GET | `/api/v1/attendance/stats` | Class attendance stats |
| GET | `/api/v1/attendance/:id` | Get by ID |
| POST | `/api/v1/attendance` | Create attendance |
| PUT | `/api/v1/attendance/:id` | Update attendance |
| DELETE | `/api/v1/attendance/:id` | Delete attendance |

### UI Pages
- `/attendance` — AttendancePage
- `/hr-attendance` — HRAttendancePage

### Test Cases

| ID | Test | Priority | Type | Tags |
|----|------|----------|------|------|
| TC-ATT-001 | GET /attendance returns list | critical | api | `module:attendance`, `type:api` |
| TC-ATT-002 | GET /attendance/stats returns stats | high | api | `module:attendance`, `type:api` |
| TC-ATT-003 | GET /attendance/:id returns details | critical | api | `module:attendance`, `type:api` |
| TC-ATT-004 | POST /attendance creates record | critical | api | `module:attendance`, `type:api` |
| TC-ATT-005 | PUT /attendance/:id updates record | high | api | `module:attendance`, `type:api` |
| TC-ATT-006 | DELETE /attendance/:id removes record | high | api | `module:attendance`, `type:api` |
| TC-ATT-007 | UI: Attendance page loads | critical | ui | `module:attendance`, `type:ui` |
| TC-ATT-008 | UI: HR attendance page loads | critical | ui | `module:attendance`, `type:ui` |
| TC-ATT-009 | UI: Mark student present/absent/late | critical | ui | `module:attendance`, `type:ui` |
| TC-ATT-010 | UI: Bulk mark attendance for class | high | ui | `module:attendance`, `type:ui` |
| TC-ATT-011 | UI: Filter attendance by date | high | ui | `module:attendance`, `type:ui` |
| TC-ATT-012 | UI: Filter attendance by class | high | ui | `module:attendance`, `type:ui` |
| TC-ATT-013 | UI: Attendance stats chart | medium | ui | `module:attendance`, `type:ui` |
| TC-ATT-014 | UI: QR scanner marks attendance | high | ui | `module:attendance`, `type:ui` |
| TC-ATT-015 | UI: Attendance amendment submission | medium | ui | `module:attendance`, `type:ui` |
| TC-ATT-016 | UI: Export attendance report | medium | ui | `module:attendance`, `type:ui` |
| TC-ATT-017 | UI: HR attendance shows all programs | high | ui | `module:attendance`, `type:ui` |
| TC-ATT-018 | UI: Attendance status colors/indicators | low | ui | `module:attendance`, `type:ui` |
| TC-ATT-019 | UI: Attendance percentage calculation | medium | ui | `module:attendance`, `type:ui` |
| TC-ATT-020 | UI: Student sees own attendance | high | ui | `module:attendance`, `type:ui` |

---

## 11. Standup Attendance (`module:standup-attendance`)

### API Routes
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/standup-attendance` | Create |
| GET | `/api/v1/standup-attendance/user/:userId/date/:date` | By user and date |
| GET | `/api/v1/standup-attendance/user/:userId` | By user |
| GET | `/api/v1/standup-attendance/class` | By class and date |
| GET | `/api/v1/standup-attendance/date/:date` | By date |
| GET | `/api/v1/standup-attendance/program` | By program and date |
| GET | `/api/v1/standup-attendance/program/range` | By program date range |
| DELETE | `/api/v1/standup-attendance/:id` | Delete |

### Test Cases

| ID | Test | Priority | Type | Tags |
|----|------|----------|------|------|
| TC-STD-001 | POST creates standup attendance | critical | api | `module:standup-attendance`, `type:api` |
| TC-STD-002 | GET by user and date | high | api | `module:standup-attendance`, `type:api` |
| TC-STD-003 | GET by user (all dates) | high | api | `module:standup-attendance`, `type:api` |
| TC-STD-004 | GET by class and date | high | api | `module:standup-attendance`, `type:api` |
| TC-STD-005 | GET by date (all) | medium | api | `module:standup-attendance`, `type:api` |
| TC-STD-006 | GET by program and date | high | api | `module:standup-attendance`, `type:api` |
| TC-STD-007 | GET by program for date range | high | api | `module:standup-attendance`, `type:api` |
| TC-STD-008 | DELETE removes record | high | api | `module:standup-attendance`, `type:api` |
| TC-STD-009 | UI: QR scanner creates standup attendance | critical | ui | `module:standup-attendance`, `type:ui` |
| TC-STD-010 | UI: Standup attendance list by date | high | ui | `module:standup-attendance`, `type:ui` |
| TC-STD-011 | UI: Duplicate scan prevention | high | ui | `module:standup-attendance`, `type:ui` |
| TC-STD-012 | UI: Program-level standup view | medium | ui | `module:standup-attendance`, `type:ui` |
| TC-STD-013 | UI: Date range filter | medium | ui | `module:standup-attendance`, `type:ui` |
| TC-STD-014 | UI: Delete standup record | medium | ui | `module:standup-attendance`, `type:ui` |
| TC-STD-015 | UI: Standup count per student | medium | ui | `module:standup-attendance`, `type:ui` |
| TC-STD-016 | UI: Export standup report | low | ui | `module:standup-attendance`, `type:ui` |
| TC-STD-017 | API: Date range validation | medium | api | `module:standup-attendance`, `type:api` |
| TC-STD-018 | API: Invalid userId returns 404 | medium | api | `module:standup-attendance`, `type:api` |

---

## 12. Penalties (`module:penalties`)

### API Routes
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/penalties` | List |
| GET | `/api/v1/penalties/:id` | By ID |
| GET | `/api/v1/penalties/student/:studentId` | By student |
| GET | `/api/v1/penalties/class/:classId` | By class |
| POST | `/api/v1/penalties` | Create |
| PUT | `/api/v1/penalties/:id` | Update |
| DELETE | `/api/v1/penalties/:id` | Delete |

### UI Pages
- `/penalty` — PenaltiesPage

### Test Cases

| ID | Test | Priority | Type | Tags |
|----|------|----------|------|------|
| TC-PEN-001 | GET /penalties returns list | critical | api | `module:penalties`, `type:api` |
| TC-PEN-002 | GET /penalties/:id returns details | critical | api | `module:penalties`, `type:api` |
| TC-PEN-003 | GET /penalties/student/:studentId | high | api | `module:penalties`, `type:api` |
| TC-PEN-004 | GET /penalties/class/:classId | high | api | `module:penalties`, `type:api` |
| TC-PEN-005 | POST /penalties creates penalty | critical | api | `module:penalties`, `type:api` |
| TC-PEN-006 | PUT /penalties/:id updates | high | api | `module:penalties`, `type:api` |
| TC-PEN-007 | DELETE /penalties/:id removes | high | api | `module:penalties`, `type:api` |
| TC-PEN-008 | UI: Penalties page loads | critical | ui | `module:penalties`, `type:ui` |
| TC-PEN-009 | UI: Create penalty | critical | ui | `module:penalties`, `type:ui` |
| TC-PEN-010 | UI: Edit penalty | high | ui | `module:penalties`, `type:ui` |
| TC-PEN-011 | UI: Delete penalty | high | ui | `module:penalties`, `type:ui` |
| TC-PEN-012 | UI: Filter penalties by student | high | ui | `module:penalties`, `type:ui` |
| TC-PEN-013 | UI: Filter penalties by class | medium | ui | `module:penalties`, `type:ui` |
| TC-PEN-014 | UI: Penalty type selection | medium | ui | `module:penalties`, `type:ui` |
| TC-PEN-015 | UI: Penalty points display | medium | ui | `module:penalties`, `type:ui` |
| TC-PEN-016 | UI: Penalty reason text | low | ui | `module:penalties`, `type:ui` |
| TC-PEN-017 | UI: Student sees own penalties | high | ui | `module:penalties`, `type:ui` |
| TC-PEN-018 | UI: Arabic penalty type names | medium | ui | `module:penalties`, `type:ui`, `i18n` |

---

## 13. Participations (`module:participations`)

### API Routes
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/participations` | List |
| GET | `/api/v1/participations/stats` | Student stats |
| GET | `/api/v1/participations/class-stats` | Class stats |
| GET | `/api/v1/participations/:id` | By ID |
| GET | `/api/v1/participations/student/:studentId` | By student |
| GET | `/api/v1/participations/class/:classId` | By class |
| GET | `/api/v1/participations/activity/:activityId` | By activity |
| POST | `/api/v1/participations` | Create |
| PUT | `/api/v1/participations/:id` | Update |
| DELETE | `/api/v1/participations/:id` | Delete |

### UI Pages
- `/participation` — ParticipationPage

### Test Cases

| ID | Test | Priority | Type | Tags |
|----|------|----------|------|------|
| TC-PAR-001 | GET /participations returns list | critical | api | `module:participations`, `type:api` |
| TC-PAR-002 | GET /participations/stats returns student stats | high | api | `module:participations`, `type:api` |
| TC-PAR-003 | GET /participations/class-stats | high | api | `module:participations`, `type:api` |
| TC-PAR-004 | GET /participations/:id | critical | api | `module:participations`, `type:api` |
| TC-PAR-005 | GET /participations/student/:studentId | high | api | `module:participations`, `type:api` |
| TC-PAR-006 | GET /participations/class/:classId | high | api | `module:participations`, `type:api` |
| TC-PAR-007 | GET /participations/activity/:activityId | high | api | `module:participations`, `type:api` |
| TC-PAR-008 | POST /participations creates | critical | api | `module:participations`, `type:api` |
| TC-PAR-009 | PUT /participations/:id updates | high | api | `module:participations`, `type:api` |
| TC-PAR-010 | DELETE /participations/:id removes | high | api | `module:participations`, `type:api` |
| TC-PAR-011 | UI: Participation page loads | critical | ui | `module:participations`, `type:ui` |
| TC-PAR-012 | UI: Create participation entry | critical | ui | `module:participations`, `type:ui` |
| TC-PAR-013 | UI: Edit participation | high | ui | `module:participations`, `type:ui` |
| TC-PAR-014 | UI: Delete participation | high | ui | `module:participations`, `type:ui` |
| TC-PAR-015 | UI: Filter by student | high | ui | `module:participations`, `type:ui` |
| TC-PAR-016 | UI: Filter by class | medium | ui | `module:participations`, `type:ui` |
| TC-PAR-017 | UI: Participation type dropdown | medium | ui | `module:participations`, `type:ui` |
| TC-PAR-018 | UI: Points display | medium | ui | `module:participations`, `type:ui` |
| TC-PAR-019 | UI: Student stats summary | high | ui | `module:participations`, `type:ui` |
| TC-PAR-020 | UI: Class stats summary | high | ui | `module:participations`, `type:ui` |
| TC-PAR-021 | UI: Positive vs negative indicator | low | ui | `module:participations`, `type:ui` |
| TC-PAR-022 | UI: Arabic participation type | medium | ui | `module:participations`, `type:ui`, `i18n` |
| TC-PAR-023 | UI: Batch participation entry | medium | ui | `module:participations`, `type:ui` |
| TC-PAR-024 | UI: Activity-linked participation | medium | ui | `module:participations`, `type:ui` |

---

## 14. Behaviors (`module:behaviors`)

### API Routes
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/behaviors` | List |
| GET | `/api/v1/behaviors/:id` | By ID |
| GET | `/api/v1/behaviors/student/:studentId` | By student |
| GET | `/api/v1/behaviors/class/:classId` | By class |
| POST | `/api/v1/behaviors` | Create |
| PUT | `/api/v1/behaviors/:id` | Update |
| DELETE | `/api/v1/behaviors/:id` | Delete |

### UI Pages
- `/behavior` — BehaviorPage

### Test Cases

| ID | Test | Priority | Type | Tags |
|----|------|----------|------|------|
| TC-BEH-001 | GET /behaviors returns list | critical | api | `module:behaviors`, `type:api` |
| TC-BEH-002 | GET /behaviors/:id returns details | critical | api | `module:behaviors`, `type:api` |
| TC-BEH-003 | GET /behaviors/student/:studentId | high | api | `module:behaviors`, `type:api` |
| TC-BEH-004 | GET /behaviors/class/:classId | high | api | `module:behaviors`, `type:api` |
| TC-BEH-005 | POST /behaviors creates | critical | api | `module:behaviors`, `type:api` |
| TC-BEH-006 | PUT /behaviors/:id updates | high | api | `module:behaviors`, `type:api` |
| TC-BEH-007 | DELETE /behaviors/:id removes | high | api | `module:behaviors`, `type:api` |
| TC-BEH-008 | UI: Behavior page loads | critical | ui | `module:behaviors`, `type:ui` |
| TC-BEH-009 | UI: Create behavior entry | critical | ui | `module:behaviors`, `type:ui` |
| TC-BEH-010 | UI: Edit behavior | high | ui | `module:behaviors`, `type:ui` |
| TC-BEH-011 | UI: Delete behavior | high | ui | `module:behaviors`, `type:ui` |
| TC-BEH-012 | UI: Filter by student | high | ui | `module:behaviors`, `type:ui` |
| TC-BEH-013 | UI: Filter by class | medium | ui | `module:behaviors`, `type:ui` |
| TC-BEH-014 | UI: Behavior type dropdown | medium | ui | `module:behaviors`, `type:ui` |
| TC-BEH-015 | UI: Behavior rating/score | medium | ui | `module:behaviors`, `type:ui` |
| TC-BEH-016 | UI: Student sees own behaviors | high | ui | `module:behaviors`, `type:ui` |
| TC-BEH-017 | UI: Arabic behavior type | medium | ui | `module:behaviors`, `type:ui`, `i18n` |
| TC-BEH-018 | UI: Behavior notes field | low | ui | `module:behaviors`, `type:ui` |

---

## 15. Marks (`module:marks`)

### API Routes
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/marks/distribution/:subjectId` | Get marks distribution |
| PUT | `/api/v1/marks/distribution/:subjectId` | Set marks distribution |
| GET | `/api/v1/marks/students/:subjectId` | Get student marks |
| PUT | `/api/v1/marks/students/:userId/:subjectId/:classId` | Update student marks |
| PUT | `/api/v1/marks/students/batch/:subjectId/:classId` | Batch update |
| GET | `/api/v1/marks/report` | All student marks report |
| GET | `/api/v1/marks/history/:userId/:subjectId/:classId` | Marks history |

### UI Pages
- `/marks-entry` — MarksPage

### Test Cases

| ID | Test | Priority | Type | Tags |
|----|------|----------|------|------|
| TC-MRK-001 | GET /marks/distribution/:subjectId | critical | api | `module:marks`, `type:api` |
| TC-MRK-002 | PUT /marks/distribution/:subjectId sets distribution | high | api | `module:marks`, `type:api` |
| TC-MRK-003 | GET /marks/students/:subjectId returns marks | critical | api | `module:marks`, `type:api` |
| TC-MRK-004 | PUT /marks/students/:userId/:subjectId/:classId updates | critical | api | `module:marks`, `type:api` |
| TC-MRK-005 | PUT /marks/students/batch batch updates | high | api | `module:marks`, `type:api` |
| TC-MRK-006 | GET /marks/report returns all marks | high | api | `module:marks`, `type:api` |
| TC-MRK-007 | GET /marks/history returns history | high | api | `module:marks`, `type:api` |
| TC-MRK-008 | UI: Marks entry page loads | critical | ui | `module:marks`, `type:ui` |
| TC-MRK-009 | UI: Set marks distribution | high | ui | `module:marks`, `type:ui` |
| TC-MRK-010 | UI: Enter marks for student | critical | ui | `module:marks`, `type:ui` |
| TC-MRK-011 | UI: Batch update marks | high | ui | `module:marks`, `type:ui` |
| TC-MRK-012 | UI: View marks report | high | ui | `module:marks`, `type:ui` |
| TC-MRK-013 | UI: View marks history | medium | ui | `module:marks`, `type:ui` |
| TC-MRK-014 | UI: Marks validation (0-100 range) | high | ui | `module:marks`, `type:ui` |
| TC-MRK-015 | UI: Subject selection dropdown | medium | ui | `module:marks`, `type:ui` |
| TC-MRK-016 | UI: Class selection dropdown | medium | ui | `module:marks`, `type:ui` |
| TC-MRK-017 | UI: Student list with marks | high | ui | `module:marks`, `type:ui` |
| TC-MRK-018 | UI: Marks distribution total = 100% | high | ui | `module:marks`, `type:ui` |
| TC-MRK-019 | UI: Export marks report | medium | ui | `module:marks`, `type:ui` |
| TC-MRK-020 | UI: Marks grade calculation | medium | ui | `module:marks`, `type:ui` |

---

## 16. Chat (`module:chat`)

### API Routes
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/chat/rooms` | Get user's chat rooms |
| GET | `/api/v1/chat/rooms/:roomId/messages` | Get messages in room |
| POST | `/api/v1/chat/rooms/:roomId/messages` | Send message |
| PUT | `/api/v1/chat/messages/:messageId` | Update message |
| DELETE | `/api/v1/chat/messages/:messageId` | Delete message |
| POST | `/api/v1/chat/dm` | Create/get DM room |
| POST | `/api/v1/chat/messages/:messageId/reactions` | Toggle reaction |
| POST | `/api/v1/chat/messages/:messageId/vote` | Vote on poll |
| GET | `/api/v1/chat/users` | Get available chat users |

### UI Pages
- `/chat` — ChatPage

### Test Cases

| ID | Test | Priority | Type | Tags |
|----|------|----------|------|------|
| TC-CHAT-001 | GET /chat/rooms returns rooms for user | critical | api | `module:chat`, `type:api` |
| TC-CHAT-002 | GET /chat/rooms returns global room | high | api | `module:chat`, `type:api` |
| TC-CHAT-003 | GET /chat/rooms returns class rooms for staff | high | api | `module:chat`, `type:api` |
| TC-CHAT-004 | GET /chat/rooms returns only enrolled class rooms for students | high | api | `module:chat`, `type:api` |
| TC-CHAT-005 | GET /chat/rooms/:roomId/messages returns messages | critical | api | `module:chat`, `type:api` |
| TC-CHAT-006 | GET /chat/rooms/:roomId/messages paginated | medium | api | `module:chat`, `type:api` |
| TC-CHAT-007 | POST /chat/rooms/:roomId/messages sends text | critical | api | `module:chat`, `type:api` |
| TC-CHAT-008 | POST message with attachment | high | api | `module:chat`, `type:api` |
| TC-CHAT-009 | POST message with poll | high | api | `module:chat`, `type:api` |
| TC-CHAT-010 | PUT /chat/messages/:messageId edits message | high | api | `module:chat`, `type:api` |
| TC-CHAT-011 | DELETE /chat/messages/:messageId soft-deletes | high | api | `module:chat`, `type:api` |
| TC-CHAT-012 | POST /chat/dm creates DM room | high | api | `module:chat`, `type:api` |
| TC-CHAT-013 | POST /chat/messages/:messageId/reactions toggles | high | api | `module:chat`, `type:api` |
| TC-CHAT-014 | POST /chat/messages/:messageId/vote records vote | high | api | `module:chat`, `type:api` |
| TC-CHAT-015 | GET /chat/users returns available users | high | api | `module:chat`, `type:api` |
| TC-CHAT-016 | UI: Chat page loads with room sidebar | critical | ui | `module:chat`, `type:ui` |
| TC-CHAT-017 | UI: Send text message | critical | ui | `module:chat`, `type:ui` |
| TC-CHAT-018 | UI: Receive real-time message via WebSocket | critical | ui | `module:chat`, `type:ui` |
| TC-CHAT-019 | UI: Delete message updates UI in real-time | critical | ui | `module:chat`, `type:ui` |
| TC-CHAT-020 | UI: Edit message | high | ui | `module:chat`, `type:ui` |
| TC-CHAT-021 | UI: Emoji picker | medium | ui | `module:chat`, `type:ui` |
| TC-CHAT-022 | UI: Message reactions | high | ui | `module:chat`, `type:ui` |
| TC-CHAT-023 | UI: Create and vote on poll | high | ui | `module:chat`, `type:ui` |
| TC-CHAT-024 | UI: File attachment upload | high | ui | `module:chat`, `type:ui` |
| TC-CHAT-025 | UI: 25MB file size limit enforced | high | ui | `module:chat`, `type:ui` |
| TC-CHAT-026 | UI: Archive/unarchive room | medium | ui | `module:chat`, `type:ui` |
| TC-CHAT-027 | UI: Role icons display for staff | medium | ui | `module:chat`, `type:ui` |
| TC-CHAT-028 | UI: DM creation with another user | high | ui | `module:chat`, `type:ui` |
| TC-CHAT-029 | UI: Arabic localization in chat | medium | ui | `module:chat`, `type:ui`, `i18n` |
| TC-CHAT-030 | UI: Sender name fallback when undefined | high | ui | `module:chat`, `type:ui` |

---

## 17. Notifications (`module:notifications`)

### API Routes
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/notifications` | List notifications |
| PATCH | `/api/v1/notifications/:notificationId/read` | Mark read |
| PATCH | `/api/v1/notifications/:notificationId/unread` | Mark unread |
| POST | `/api/v1/notifications/mark-all-read` | Mark all read |
| PATCH | `/api/v1/notifications/:notificationId/archive` | Archive |
| POST | `/api/v1/notifications/archive-all-read` | Archive all read |
| DELETE | `/api/v1/notifications/:notificationId` | Delete |
| GET | `/api/v1/notifications/preferences` | Get preferences |
| PUT | `/api/v1/notifications/preferences` | Update preferences |
| POST | `/api/v1/notifications/admin/test` | Test notification (admin) |

### UI Pages
- `/notifications` — NotificationsPage
- Notification drawer/bell in navbar

### Test Cases

| ID | Test | Priority | Type | Tags |
|----|------|----------|------|------|
| TC-NOT-001 | GET /notifications returns list | critical | api | `module:notifications`, `type:api` |
| TC-NOT-002 | PATCH /:id/read marks as read | high | api | `module:notifications`, `type:api` |
| TC-NOT-003 | PATCH /:id/unread marks as unread | medium | api | `module:notifications`, `type:api` |
| TC-NOT-004 | POST /mark-all-read | high | api | `module:notifications`, `type:api` |
| TC-NOT-005 | PATCH /:id/archive | high | api | `module:notifications`, `type:api` |
| TC-NOT-006 | POST /archive-all-read | medium | api | `module:notifications`, `type:api` |
| TC-NOT-007 | DELETE /:id removes notification | high | api | `module:notifications`, `type:api` |
| TC-NOT-008 | GET /preferences returns preferences | high | api | `module:notifications`, `type:api` |
| TC-NOT-009 | PUT /preferences updates preferences | high | api | `module:notifications`, `type:api` |
| TC-NOT-010 | POST /admin/test sends test notification | medium | api | `module:notifications`, `type:api` |
| TC-NOT-011 | UI: Notifications page loads | critical | ui | `module:notifications`, `type:ui` |
| TC-NOT-012 | UI: Notification bell shows unread count | high | ui | `module:notifications`, `type:ui` |
| TC-NOT-013 | UI: Notification drawer opens | high | ui | `module:notifications`, `type:ui` |
| TC-NOT-014 | UI: Mark notification as read | high | ui | `module:notifications`, `type:ui` |
| TC-NOT-015 | UI: Mark all as read | high | ui | `module:notifications`, `type:ui` |
| TC-NOT-016 | UI: Archive notification | medium | ui | `module:notifications`, `type:ui` |
| TC-NOT-017 | UI: Delete notification | medium | ui | `module:notifications`, `type:ui` |
| TC-NOT-018 | UI: Notification preferences page | medium | ui | `module:notifications`, `type:ui` |
| TC-NOT-019 | UI: Notification bell visible for all staff roles | high | ui | `module:notifications`, `type:ui` |
| TC-NOT-020 | UI: Notification bell hidden for students | medium | ui | `module:notifications`, `type:ui` |
| TC-NOT-021 | UI: Real-time notification appears | high | ui | `module:notifications`, `type:ui` |
| TC-NOT-022 | UI: Notification type icons | low | ui | `module:notifications`, `type:ui` |

---

## 18. Smart Drive (`module:drive`)

### API Routes (40+)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/drive/upload/initiate` | Initiate upload |
| POST | `/api/v1/drive/upload/:fileId/complete` | Complete upload |
| GET | `/api/v1/drive/files` | List files |
| GET | `/api/v1/drive/files/search` | Search files |
| GET | `/api/v1/drive/files/:fileId` | Get file |
| PUT | `/api/v1/drive/files/:fileId` | Update file |
| DELETE | `/api/v1/drive/files/:fileId` | Delete file |
| PATCH | `/api/v1/drive/files/:fileId/star` | Star/unstar |
| DELETE | `/api/v1/drive/files/:fileId/trash` | Soft delete |
| POST | `/api/v1/drive/files/:fileId/restore` | Restore |
| DELETE | `/api/v1/drive/files/:fileId/permanent` | Permanent delete |
| GET | `/api/v1/drive/files/:fileId/preview` | Preview |
| GET | `/api/v1/drive/files/:fileId/collabora/edit` | Collabora edit |
| GET | `/api/v1/drive/files/:fileId/download` | Download |
| POST | `/api/v1/drive/files/:fileId/activity` | Log activity |
| GET | `/api/v1/drive/folders` | List folder children |
| GET | `/api/v1/drive/folders/tree` | Folder tree |
| GET | `/api/v1/drive/folders/:folderId` | Get folder |
| POST | `/api/v1/drive/folders` | Create folder |
| PATCH | `/api/v1/drive/folders/:folderId` | Update folder |
| DELETE | `/api/v1/drive/folders/:folderId/trash` | Delete folder |
| POST | `/api/v1/drive/folders/:folderId/restore` | Restore folder |
| PATCH | `/api/v1/drive/folders/:folderId/star` | Star folder |
| GET | `/api/v1/drive/folders/:folderId/download` | Download folder |
| POST | `/api/v1/drive/files/:fileId/versions` | Upload version |
| GET | `/api/v1/drive/files/:fileId/versions` | Get versions |
| POST | `/api/v1/drive/versions/:versionId/restore` | Restore version |
| POST | `/api/v1/drive/shares` | Create share |
| GET | `/api/v1/drive/files/:fileId/shares` | List shares |
| DELETE | `/api/v1/drive/shares/:shareId` | Revoke share |
| GET | `/api/v1/drive/shared-with-me` | Shared with me |
| GET | `/api/v1/drive/shared-by-me` | Shared by me |
| POST | `/api/v1/drive/public-links` | Create public link |
| GET | `/api/v1/drive/files/:fileId/public-links` | List public links |
| DELETE | `/api/v1/drive/public-links/:linkId` | Revoke public link |
| POST | `/api/v1/drive/files/:fileId/comments` | Add comment |
| GET | `/api/v1/drive/files/:fileId/comments` | Get comments |
| DELETE | `/api/v1/drive/files/:fileId/comments/:commentId` | Delete comment |
| GET | `/api/v1/drive/files/:fileId/activities` | File activities |
| GET | `/api/v1/drive/storage` | Storage usage |
| POST | `/api/v1/drive/chat-upload` | Chat file upload |
| GET | `/api/v1/wopi/hosting/discovery` | WOPI discovery |
| GET | `/api/v1/wopi/files/:fileId` | WOPI file info |
| GET | `/api/v1/wopi/files/:fileId/contents` | WOPI file contents |
| POST | `/api/v1/wopi/files/:fileId` | WOPI lock |
| POST | `/api/v1/wopi/files/:fileId/contents` | WOPI save |

### UI Pages
- `/smart-drive` — SmartDrivePage

### Test Cases (Selected — 45 of 60+)

| ID | Test | Priority | Type | Tags |
|----|------|----------|------|------|
| TC-DRV-001 | Upload file via initiate+complete | critical | api | `module:drive`, `type:api` |
| TC-DRV-002 | List files | critical | api | `module:drive`, `type:api` |
| TC-DRV-003 | Search files by name | high | api | `module:drive`, `type:api` |
| TC-DRV-004 | Get file by ID | critical | api | `module:drive`, `type:api` |
| TC-DRV-005 | Update file metadata | high | api | `module:drive`, `type:api` |
| TC-DRV-006 | Delete file (soft) | high | api | `module:drive`, `type:api` |
| TC-DRV-007 | Restore trashed file | high | api | `module:drive`, `type:api` |
| TC-DRV-008 | Permanent delete file | high | api | `module:drive`, `type:api` |
| TC-DRV-009 | Star/unstar file | medium | api | `module:drive`, `type:api` |
| TC-DRV-010 | Preview file | high | api | `module:drive`, `type:api` |
| TC-DRV-011 | Download file | high | api | `module:drive`, `type:api` |
| TC-DRV-012 | Create folder | critical | api | `module:drive`, `type:api` |
| TC-DRV-013 | List folder children | high | api | `module:drive`, `type:api` |
| TC-DRV-014 | Get folder tree | high | api | `module:drive`, `type:api` |
| TC-DRV-015 | Update folder | medium | api | `module:drive`, `type:api` |
| TC-DRV-016 | Delete folder (soft) | high | api | `module:drive`, `type:api` |
| TC-DRV-017 | Restore folder | medium | api | `module:drive`, `type:api` |
| TC-DRV-018 | Star folder | low | api | `module:drive`, `type:api` |
| TC-DRV-019 | Download folder (zip) | medium | api | `module:drive`, `type:api` |
| TC-DRV-020 | Upload new version | high | api | `module:drive`, `type:api` |
| TC-DRV-021 | Get file versions | high | api | `module:drive`, `type:api` |
| TC-DRV-022 | Restore file version | high | api | `module:drive`, `type:api` |
| TC-DRV-023 | Create file share | high | api | `module:drive`, `type:api` |
| TC-DRV-024 | List file shares | medium | api | `module:drive`, `type:api` |
| TC-DRV-025 | Revoke share | high | api | `module:drive`, `type:api` |
| TC-DRV-026 | List shared with me | high | api | `module:drive`, `type:api` |
| TC-DRV-027 | List shared by me | medium | api | `module:drive`, `type:api` |
| TC-DRV-028 | Create public link | high | api | `module:drive`, `type:api` |
| TC-DRV-029 | List public links | medium | api | `module:drive`, `type:api` |
| TC-DRV-030 | Revoke public link | high | api | `module:drive`, `type:api` |
| TC-DRV-031 | Add comment to file | medium | api | `module:drive`, `type:api` |
| TC-DRV-032 | Get file comments | medium | api | `module:drive`, `type:api` |
| TC-DRV-033 | Delete comment | medium | api | `module:drive`, `type:api` |
| TC-DRV-034 | Get file activities | low | api | `module:drive`, `type:api` |
| TC-DRV-035 | Get storage usage | medium | api | `module:drive`, `type:api` |
| TC-DRV-036 | Chat upload (25MB limit) | high | api | `module:drive`, `type:api` |
| TC-DRV-037 | UI: Smart Drive page loads | critical | ui | `module:drive`, `type:ui` |
| TC-DRV-038 | UI: Upload file via drag-drop | critical | ui | `module:drive`, `type:ui` |
| TC-DRV-039 | UI: Create folder | critical | ui | `module:drive`, `type:ui` |
| TC-DRV-040 | UI: Navigate folder tree | high | ui | `module:drive`, `type:ui` |
| TC-DRV-041 | UI: Star/unstar file | medium | ui | `module:drive`, `type:ui` |
| TC-DRV-042 | UI: Share file with user | high | ui | `module:drive`, `type:ui` |
| TC-DRV-043 | UI: Create public link | high | ui | `module:drive`, `type:ui` |
| TC-DRV-044 | UI: File preview (images/PDF) | high | ui | `module:drive`, `type:ui` |
| TC-DRV-045 | UI: Collabora edit integration | medium | ui | `module:drive`, `type:ui` |

---

## 19. Workflow Documents (`module:workflow`)

### API Routes
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/workflow-documents` | Create document |
| GET | `/api/v1/workflow-documents` | List documents |
| GET | `/api/v1/workflow-documents/:id` | Get by ID |
| DELETE | `/api/v1/workflow-documents/:id` | Delete |
| PATCH | `/api/v1/workflow-documents/:id/status` | Update status |
| GET | `/api/v1/workflow-documents/:id/comments` | Get comments |
| POST | `/api/v1/workflow-documents/:id/comments` | Add comment |
| DELETE | `/api/v1/workflow-documents/:id/comments/:commentId` | Delete comment |
| POST | `/api/v1/workflow-documents/:id/approve` | Approve |
| POST | `/api/v1/workflow-documents/:id/reject` | Reject |
| POST | `/api/v1/workflow-documents/:id/return` | Return |
| POST | `/api/v1/workflow-documents/:id/resubmit` | Resubmit |
| POST | `/api/v1/workflow-documents/:id/upload-signed` | Upload signed |
| POST | `/api/v1/workflow-documents/:id/withdraw` | Withdraw |
| GET | `/api/v1/workflow-documents/compliance` | Compliance data |
| GET | `/api/v1/workflow-documents/analytics` | Analytics |
| GET | `/api/v1/workflow-documents/:fileId/versions` | File versions |
| GET | `/api/v1/workflow-documents/:fileId/versions/:versionId/download` | Download version |
| POST | `/api/v1/workflow-documents/custom` | Custom workflow |
| POST | `/api/v1/workflows/definitions` | Create definition |
| GET | `/api/v1/workflows/definitions` | List definitions |
| GET | `/api/v1/workflows/definitions/:definitionId` | Get definition |
| POST | `/api/v1/workflows/instances` | Start instance |
| GET | `/api/v1/workflows/instances` | List instances |
| GET | `/api/v1/workflows/instances/:instanceId` | Get instance |
| POST | `/api/v1/workflows/instances/:instanceId/approve` | Approve instance |
| POST | `/api/v1/workflows/instances/:instanceId/reject` | Reject instance |
| GET | `/api/v1/workflows/instances/:instanceId/history` | Instance history |
| POST | `/api/v1/workflows/instances/:instanceId/submit` | Submit |
| POST | `/api/v1/workflows/instances/:instanceId/send-for-review` | Send for review |
| POST | `/api/v1/workflows/instances/:instanceId/send-for-approval` | Send for approval |
| POST | `/api/v1/workflows/instances/:instanceId/approve-simplified` | Approve simplified |
| POST | `/api/v1/workflows/instances/:instanceId/reject-simplified` | Reject simplified |
| POST | `/api/v1/workflows/instances/:instanceId/revise` | Revise |
| POST | `/api/v1/workflows/instances/:instanceId/cancel` | Cancel |
| GET | `/api/v1/workflows/my-tasks` | My tasks |

### UI Pages
- `/workflow/inbox` — WorkflowInboxPage
- `/workflow-documents/:documentId` — WorkflowDocumentDetailPage
- `/workflow/:documentId` — WorkflowDetailPage
- `/workflow/compliance` — CalendarCompliancePage
- `/workflow/analytics` — WorkflowAnalyticsPage

### Test Cases (35 selected)

| ID | Test | Priority | Type | Tags |
|----|------|----------|------|------|
| TC-WF-001 | Create workflow document | critical | api | `module:workflow`, `type:api` |
| TC-WF-002 | List workflow documents | critical | api | `module:workflow`, `type:api` |
| TC-WF-003 | Get workflow document by ID | critical | api | `module:workflow`, `type:api` |
| TC-WF-004 | Delete workflow document | high | api | `module:workflow`, `type:api` |
| TC-WF-005 | Update document status | high | api | `module:workflow`, `type:api` |
| TC-WF-006 | Add comment to document | medium | api | `module:workflow`, `type:api` |
| TC-WF-007 | Get document comments | medium | api | `module:workflow`, `type:api` |
| TC-WF-008 | Delete comment | medium | api | `module:workflow`, `type:api` |
| TC-WF-009 | Approve document | critical | api | `module:workflow`, `type:api` |
| TC-WF-010 | Reject document | critical | api | `module:workflow`, `type:api` |
| TC-WF-011 | Return document | high | api | `module:workflow`, `type:api` |
| TC-WF-012 | Resubmit document | high | api | `module:workflow`, `type:api` |
| TC-WF-013 | Upload signed document | high | api | `module:workflow`, `type:api` |
| TC-WF-014 | Withdraw document | high | api | `module:workflow`, `type:api` |
| TC-WF-015 | Get compliance data | high | api | `module:workflow`, `type:api` |
| TC-WF-016 | Get analytics data | high | api | `module:workflow`, `type:api` |
| TC-WF-017 | Get file versions | medium | api | `module:workflow`, `type:api` |
| TC-WF-018 | Download file version | medium | api | `module:workflow`, `type:api` |
| TC-WF-019 | Create custom workflow | high | api | `module:workflow`, `type:api` |
| TC-WF-020 | Create workflow definition | high | api | `module:workflow`, `type:api` |
| TC-WF-021 | List workflow definitions | medium | api | `module:workflow`, `type:api` |
| TC-WF-022 | Start workflow instance | high | api | `module:workflow`, `type:api` |
| TC-WF-023 | Get my tasks | critical | api | `module:workflow`, `type:api` |
| TC-WF-024 | Approve instance | high | api | `module:workflow`, `type:api` |
| TC-WF-025 | Reject instance | high | api | `module:workflow`, `type:api` |
| TC-WF-026 | UI: Workflow inbox loads | critical | ui | `module:workflow`, `type:ui` |
| TC-WF-027 | UI: Document detail page | critical | ui | `module:workflow`, `type:ui` |
| TC-WF-028 | UI: Create new workflow document | critical | ui | `module:workflow`, `type:ui` |
| TC-WF-029 | UI: Approve document | critical | ui | `module:workflow`, `type:ui` |
| TC-WF-030 | UI: Reject document | critical | ui | `module:workflow`, `type:ui` |
| TC-WF-031 | UI: Compliance page | high | ui | `module:workflow`, `type:ui` |
| TC-WF-032 | UI: Analytics page | high | ui | `module:workflow`, `type:ui` |
| TC-WF-033 | UI: Add comment | medium | ui | `module:workflow`, `type:ui` |
| TC-WF-034 | UI: Upload signed document | high | ui | `module:workflow`, `type:ui` |
| TC-WF-035 | UI: Withdraw document | medium | ui | `module:workflow`, `type:ui` |

---

## 20. Scheduling — Classrooms (`module:classrooms`)

### API Routes
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/classrooms` | List (filter by programId) |
| GET | `/api/v1/classrooms/available` | Available for date/time |
| GET | `/api/v1/classrooms/program/:programId` | By program |
| GET | `/api/v1/classrooms/:id` | By ID |
| POST | `/api/v1/classrooms` | Create |
| PUT | `/api/v1/classrooms/:id` | Update |
| DELETE | `/api/v1/classrooms/:id` | Delete |

### Test Cases

| ID | Test | Priority | Type | Tags |
|----|------|----------|------|------|
| TC-CLRM-001 | GET /classrooms returns list | critical | api | `module:classrooms`, `type:api` |
| TC-CLRM-002 | GET /classrooms/available for date/time | high | api | `module:classrooms`, `type:api` |
| TC-CLRM-003 | GET /classrooms/program/:programId | high | api | `module:classrooms`, `type:api` |
| TC-CLRM-004 | GET /classrooms/:id | critical | api | `module:classrooms`, `type:api` |
| TC-CLRM-005 | POST /classrooms creates | critical | api | `module:classrooms`, `type:api` |
| TC-CLRM-006 | PUT /classrooms/:id updates | high | api | `module:classrooms`, `type:api` |
| TC-CLRM-007 | DELETE /classrooms/:id removes | high | api | `module:classrooms`, `type:api` |
| TC-CLRM-008 | UI: Classrooms management page | critical | ui | `module:classrooms`, `type:ui` |
| TC-CLRM-009 | UI: Create classroom | critical | ui | `module:classrooms`, `type:ui` |
| TC-CLRM-010 | UI: Edit classroom | high | ui | `module:classrooms`, `type:ui` |
| TC-CLRM-011 | UI: Delete classroom | high | ui | `module:classrooms`, `type:ui` |
| TC-CLRM-012 | UI: Filter by program | high | ui | `module:classrooms`, `type:ui` |
| TC-CLRM-013 | UI: Capacity field validation | medium | ui | `module:classrooms`, `type:ui` |
| TC-CLRM-014 | UI: Equipment selection | low | ui | `module:classrooms`, `type:ui` |
| TC-CLRM-015 | UI: Available days selection | medium | ui | `module:classrooms`, `type:ui` |
| TC-CLRM-016 | UI: Status dropdown (Available/Maintenance/Closed) | medium | ui | `module:classrooms`, `type:ui` |
| TC-CLRM-017 | UI: Arabic name/location fields | medium | ui | `module:classrooms`, `type:ui`, `i18n` |
| TC-CLRM-018 | UI: Available classrooms for scheduling | high | ui | `module:classrooms`, `type:ui` |

---

## 21–36. Remaining Modules (Summary)

### Scheduling — Time Slots (`module:time-slots`)
16 test cases covering: list, schedulable list, bulk-init, by program, CRUD, UI interactions.

### Scheduling — Holidays (`module:holidays`)
14 test cases covering: list, upcoming, by program, CRUD, UI.

### Scheduling — Teacher Availability (`module:teacher-availability`)
16 test cases covering: list, available teachers, by user, CRUD, UI.

### Scheduling — Sessions (`module:schedule-sessions`)
20 test cases covering: list, range, check-conflicts, bulk create, CRUD, cancel, UI.

### Scheduling — Summary Dashboard (`module:scheduling-summary`)
22 test cases covering: break-sessions CRUD, summary, break-session summary, holidays summary, teacher workload, classroom utilization, effort report, teacher effort, PDF/Excel exports, UI.

### Classroom Availability (`module:classroom-availability`)
12 test cases covering: list, validate-change, CRUD, UI.

### Admin Scopes (`module:admin-scopes`)
14 test cases covering: list, by user, effective scope, by ID, CRUD.

### Dashboard & Analytics (`module:dashboard`)
16 test cases covering: summary, teacher dashboard, analytics (drive/workflow/activity), UI pages.

### Lookup Management (`module:lookup`)
20 test cases covering: get by type, get multiple, get types, deprecated legacy routes, CRUD, UI.

### User Images (`module:user-images`)
10 test cases covering: proxy, upload, get by type, get all, delete.

### Permissions (`module:permissions`)
8 test cases covering: get, update, UI permission matrix.

### Weekly Summary (`module:weekly-summary`)
6 test cases covering: generate, daily documents, UI.

### Audit Export (`module:audit-export`)
4 test cases covering: workflow status history, permission denials.

### Attendance Amendment (`module:attendance-amendment`)
6 test cases covering: create, get by attendance ID, get all.

### Instructor History (`module:instructor-history`)
8 test cases covering: by class, by instructor, by session, workload.

### User Management (`module:users`)
22 test cases covering: list, get by ID, create, update, password set, enable/disable, delete, get instructors, get programs, get subjects, get me, UI users page.

### Profile & Settings (`module:profile`)
12 test cases covering: profile settings, student profile, dashboard save/reset, UI.

---

## 38. Localization / i18n (`module:i18n`)

### Test Cases (Cross-cutting)

| ID | Test | Priority | Type | Tags |
|----|------|----------|------|------|
| TC-I18N-001 | Switch to Arabic language | critical | ui | `module:i18n`, `type:ui` |
| TC-I18N-002 | Switch to English language | critical | ui | `module:i18n`, `type:ui` |
| TC-I18N-003 | Arabic navigation labels render | high | ui | `module:i18n`, `type:ui` |
| TC-I18N-004 | Arabic chat UI labels render | high | ui | `module:i18n`, `type:ui`, `module:chat` |
| TC-I18N-005 | Arabic date/time format | medium | ui | `module:i18n`, `type:ui` |
| TC-I18N-006 | RTL layout direction in Arabic | high | ui | `module:i18n`, `type:ui` |
| TC-I18N-007 | Arabic form labels | high | ui | `module:i18n`, `type:ui` |
| TC-I18N-008 | Arabic error messages | medium | ui | `module:i18n`, `type:ui` |
| TC-I18N-009 | Arabic button text | high | ui | `module:i18n`, `type:ui` |
| TC-I18N-010 | Language switch persists on refresh | high | ui | `module:i18n`, `type:ui` |
| TC-I18N-011 | Missing translation keys show English fallback | medium | ui | `module:i18n`, `type:ui` |
| TC-I18N-012 | Arabic numbers display correctly | low | ui | `module:i18n`, `type:ui` |
| TC-I18N-013 | Mixed Arabic/English content renders | medium | ui | `module:i18n`, `type:ui` |
| TC-I18N-014 | Arabic announcements display | medium | ui | `module:i18n`, `type:ui`, `module:announcements` |

---

## 39. Role-Based Access Control (`module:rbac`)

### Test Cases (Cross-cutting)

| ID | Test | Priority | Type | Tags |
|----|------|----------|------|------|
| TC-RBAC-001 | Student cannot access admin pages | critical | ui | `module:rbac`, `type:ui` |
| TC-RBAC-002 | Student cannot access instructor pages | critical | ui | `module:rbac`, `type:ui` |
| TC-RBAC-003 | Instructor can access class management | high | ui | `module:rbac`, `type:ui` |
| TC-RBAC-004 | Instructor cannot access user management | high | ui | `module:rbac`, `type:ui` |
| TC-RBAC-005 | Admin can access most modules | high | ui | `module:rbac`, `type:ui` |
| TC-RBAC-006 | Admin cannot access permission matrix | high | ui | `module:rbac`, `type:ui` |
| TC-RBAC-007 | Super admin can access all modules | critical | ui | `module:rbac`, `type:ui` |
| TC-RBAC-008 | Super admin can access permission matrix | critical | ui | `module:rbac`, `type:ui` |
| TC-RBAC-009 | HR can access attendance/penalty | high | ui | `module:rbac`, `type:ui` |
| TC-RBAC-010 | HR cannot access academic management | medium | ui | `module:rbac`, `type:ui` |
| TC-RBAC-011 | API: Student GET /users returns 403 | high | api | `module:rbac`, `type:api` |
| TC-RBAC-012 | API: Student POST /programs returns 403 | high | api | `module:rbac`, `type:api` |
| TC-RBAC-013 | API: Instructor DELETE /users returns 403 | high | api | `module:rbac`, `type:api` |
| TC-RBAC-014 | API: Admin PUT /permissions returns 403 | critical | api | `module:rbac`, `type:api` |
| TC-RBAC-015 | API: Super admin PUT /permissions succeeds | critical | api | `module:rbac`, `type:api` |
| TC-RBAC-016 | Program-level admin sees only scoped classes | high | ui | `module:rbac`, `type:ui` |
| TC-RBAC-017 | Classroom-level admin sees only scoped classes | high | ui | `module:rbac`, `type:ui` |
| TC-RBAC-018 | Instructor-level admin sees only scoped instructors | medium | ui | `module:rbac`, `type:ui` |
| TC-RBAC-019 | Unauthenticated API call returns 401 | critical | api | `module:rbac`, `type:api` |
| TC-RBAC-020 | ProtectedRoute redirects unauthorized to /unauthorized | high | ui | `module:rbac`, `type:ui` |

---

## Bugs Identified During Test Matrix Creation

| # | Bug | Module | Severity | Linear? |
|---|-----|--------|----------|---------|
| 1 | `requireSuperAdmin` commented out on GET /users route — any authenticated user can list all users | `module:users`, `module:rbac` | Critical | Yes |
| 2 | Chat: Program-level admin scope not applied to chat rooms — all staff see all class rooms | `module:chat`, `module:rbac` | Medium | Yes (SHA-15) |
| 3 | Chat: Favorite/star feature is a stub — no backend implementation | `module:chat` | Low | Yes (SHA-13) |
| 4 | Chat: Notification bell only shows for super_admin, not all staff | `module:notifications` | Medium | Yes (SHA-11) |
| 5 | Chat: ~8 missing Arabic translations | `module:i18n`, `module:chat` | Medium | Yes (SHA-10) |
| 6 | Drive: Stack trace exposed in error responses | `module:drive` | Medium | Yes |
| 7 | Participations: Duplicate `router.get('/class-stats')` route definition | `module:participations` | Low | Yes |
| 8 | Users: Duplicate `router.get('/me')` route definition (lines 184 and 234) | `module:users` | Low | Yes |

---

## Linear Label Scheme

### Module Labels (to create)
| Label | Color | Description |
|-------|-------|-------------|
| `module:auth` | #4EA7FC | Authentication & authorization |
| `module:programs` | #00C292 | Programs management |
| `module:subjects` | #00C292 | Subjects management |
| `module:classes` | #00C292 | Classes management |
| `module:enrollments` | #00C292 | Enrollments |
| `module:activities` | #F59E0B | Activities |
| `module:resources` | #F59E0B | Resources |
| `module:announcements` | #F59E0B | Announcements |
| `module:quizzes` | #8B5CF6 | Quizzes & assessments |
| `module:attendance` | #EF4444 | Attendance |
| `module:standup-attendance` | #EF4444 | Standup attendance |
| `module:penalties` | #EF4444 | Penalties |
| `module:participations` | #EF4444 | Participations |
| `module:behaviors` | #EF4444 | Behaviors |
| `module:marks` | #F59E0B | Marks & grading |
| `module:chat` | #06B6D4 | Chat |
| `module:notifications` | #06B6D4 | Notifications |
| `module:drive` | #3B82F6 | Smart Drive |
| `module:workflow` | #A855F7 | Workflow documents |
| `module:classrooms` | #10B981 | Classrooms |
| `module:time-slots` | #10B981 | Time slots |
| `module:holidays` | #10B981 | Holidays |
| `module:teacher-availability` | #10B981 | Teacher availability |
| `module:schedule-sessions` | #10B981 | Schedule sessions |
| `module:scheduling-summary` | #10B981 | Scheduling summary |
| `module:classroom-availability` | #10B981 | Classroom availability |
| `module:admin-scopes` | #6366F1 | Admin scopes |
| `module:dashboard` | #6366F1 | Dashboard & analytics |
| `module:lookup` | #6B7280 | Lookup management |
| `module:user-images` | #6B7280 | User images |
| `module:permissions` | #6366F1 | Permissions |
| `module:weekly-summary` | #6366F1 | Weekly summary |
| `module:audit-export` | #6B7280 | Audit export |
| `module:attendance-amendment` | #EF4444 | Attendance amendment |
| `module:instructor-history` | #10B981 | Instructor history |
| `module:users` | #6366F1 | User management |
| `module:profile` | #6B7280 | Profile & settings |
| `module:i18n` | #F97316 | Localization |
| `module:rbac` | #DC2626 | Role-based access control |
| `module:help` | #6B7280 | Help system |

### Type Labels (to create)
| Label | Color | Description |
|-------|-------|-------------|
| `type:api` | #94A3B8 | API test |
| `type:ui` | #94A3B8 | UI test |
| `type:integration` | #94A3B8 | Integration test |

### Priority Labels (to create)
| Label | Color | Description |
|-------|-------|-------------|
| `priority:critical` | #DC2626 | Critical priority |
| `priority:high` | #F59E0B | High priority |
| `priority:medium` | #3B82F6 | Medium priority |
| `priority:low` | #94A3B8 | Low priority |

### Existing Labels
| Label | Color | Description |
|-------|-------|-------------|
| Bug | #EB5757 | Bug report |
| Feature | #BB87FC | Feature request |
| Improvement | #4EA7FC | Improvement |
