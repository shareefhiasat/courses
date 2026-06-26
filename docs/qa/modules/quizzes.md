# Quizzes Module

## Business Context
Quizzes are assessments created by instructors for their classes. Students take quizzes within time limits. Quiz results feed into marks and participation tracking. Supports multiple question types and automatic grading.

## API Routes
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/api/v1/quizzes` | List | all authenticated |
| GET | `/api/v1/quizzes/stats` | Statistics | instructor, admin, super_admin |
| GET | `/api/v1/quizzes/creator/:userId` | By creator | instructor (own), admin, super_admin |
| GET | `/api/v1/quizzes/:id` | Get by ID | all authenticated |
| POST | `/api/v1/quizzes` | Create | instructor, admin, super_admin |
| PUT | `/api/v1/quizzes/:id` | Update | instructor (own), admin, super_admin |
| DELETE | `/api/v1/quizzes/:id` | Delete | instructor (own), admin, super_admin |

## UI Pages
- `/quizzes` — QuizzesListPage
- `/quizzes/create` — QuizCreatePage
- `/quizzes/:id` — QuizDetailPage
- `/quizzes/:id/take` — QuizTakingPage (student)

## Business Rules
- Instructors create quizzes for their classes
- Students take quizzes within time limits
- Question types: multiple choice, true/false, short answer
- Automatic grading for objective questions
- Manual grading for subjective questions
- Quiz results contribute to marks
- Students see only their own results

## Test Coverage
- **API tests**: `specs/quizzes-api.spec.js` — 9 tests
- **Test IDs**: TC-QUIZ-001 through TC-QUIZ-007

## Known Issues
None discovered yet.

## Related Modules
- `module:classes` — Quizzes belong to classes
- `module:marks` — Quiz results feed into marks
- `module:participations` — Quiz participation tracking
