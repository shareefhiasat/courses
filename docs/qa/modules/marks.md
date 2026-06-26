# Marks Module

## Business Context
Marks manage student grades per subject. Instructors define mark distribution (midterm, final, assignments, etc.) and enter marks per student. Marks support batch updates and history tracking for audit purposes.

## API Routes
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/api/v1/marks/distribution/:subjectId` | Get distribution | instructor, admin, super_admin |
| PUT | `/api/v1/marks/distribution/:subjectId` | Set distribution | instructor, admin, super_admin |
| GET | `/api/v1/marks/students/:subjectId` | Student marks | instructor, admin, super_admin |
| PUT | `/api/v1/marks/students/:userId/:subjectId/:classId` | Update one | instructor, admin, super_admin |
| PUT | `/api/v1/marks/students/batch/:subjectId/:classId` | Batch update | instructor, admin, super_admin |
| GET | `/api/v1/marks/report` | Full report | admin, hr, super_admin |
| GET | `/api/v1/marks/history/:userId/:subjectId/:classId` | History | admin, super_admin |

## UI Pages
- `/marks` — MarksPage (grade entry grid)

## Business Rules
- Mark distribution: components with weights (must total 100%)
- Instructors set distribution per subject
- Batch mark entry for efficiency
- Mark history tracks all changes (audit trail)
- Students cannot see other students' marks
- Marks report for admin/HR overview
- Marks contribute to final grades

## Test Coverage
- **API tests**: `specs/marks-api.spec.js` — 9 tests
- **Test IDs**: TC-MRK-001 through TC-MRK-007

## Known Issues
None discovered yet.

## Related Modules
- `module:subjects` — Marks per subject
- `module:classes` — Marks per class
- `module:quizzes` — Quiz results feed into marks
- `module:dashboard` — Marks analytics
