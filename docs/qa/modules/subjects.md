# Subjects Module

## Business Context
Subjects are academic units within programs. Each subject has a code, name (EN/AR), credits, and type. Subjects are assigned to classes and instructors. Subject types and requirement types are managed via lookup tables.

## API Routes
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/api/v1/subjects` | List (paginated, filterable) | all authenticated |
| GET | `/api/v1/subjects/:id` | Get by ID | all authenticated |
| GET | `/api/v1/subjects/program/:programId` | By program | all authenticated |
| GET | `/api/v1/subjects/subject-types` | Subject types | all authenticated |
| GET | `/api/v1/subjects/requirement-types` | Requirement types | all authenticated |
| POST | `/api/v1/subjects` | Create | super_admin, admin |
| PUT | `/api/v1/subjects/:id` | Update | super_admin, admin |
| DELETE | `/api/v1/subjects/:id` | Delete | super_admin |

## UI Pages
- `/subjects` — SubjectsManagementPage

## Business Rules
- Subject code must be unique within a program
- Supports Arabic and English names
- Subject types: core, elective, lab, practical
- Requirement types: mandatory, optional, prerequisite
- Cannot delete subject with active classes (FK constraint)

## Test Coverage
- **API tests**: `specs/subjects-api.spec.js` — 13 tests
- **Test IDs**: TC-SUBJ-001 through TC-SUBJ-012

## Known Issues
None discovered yet.

## Related Modules
- `module:programs` — Subjects belong to programs
- `module:classes` — Classes reference subjects
- `module:marks` — Marks are per subject
- `module:lookup` — Subject/requirement types
