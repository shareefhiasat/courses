---
project_name: 'courses'
user_name: 'Shareef'
date: '2026-05-26'
sections_completed:
  - technology_stack
  - language_rules
  - framework_rules
  - testing_rules
  - code_quality
  - workflow_rules
  - dont_miss_rules
  - recent_work
status: 'complete'
rule_count: 45
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

### Core
- React 19 / React DOM 19.2, TypeScript strict mode
- Vite 6.4 with `@vitejs/plugin-react`, path aliases (`@` → `src/`, `@ui`, `@common`, `@pages`, etc.)
- MUI 7.3 + `@mui/x-data-grid` 8.25, TailwindCSS 4.1, Framer Motion 12.23
- Node.js/Express 4.22 backend at `backend/server.js`
- Prisma 5.22 + PostgreSQL — use `generate` then `db push` (NO migrations, no `prisma migrate`)
- Keycloak 26 OIDC auth, realm `military-lms` — breaking changes from v22 (Admin CLI v1 removed, theme engine changed)
- Nginx as TLS termination + reverse proxy — check config before adding routes/CORS
- Node 22 + pnpm workspace (`client/` + `backend/`) — never use `npm install`

### Infrastructure
- Fully offline on army red network — NO external dependencies, CDNs, or internet
- Docker Compose: PostgreSQL, Keycloak, MinIO, Redis, Nginx (all `lms-qaf-*` containers)
- Vite 6 dev server on HTTPS with self-signed cert (Keycloak redirects will fail without it)
- Security penetration testing pending from ministry cyber team

### Testing — NONE
- No test framework configured, no test cases, no safety nets
- All new code must be written testable by design
- Playwright 1.58 + Jest 30 available but not set up
- Keycloak auth in tests should use WireMock/Pact stubbing, not live IDP
- Prefer `data-testid` selectors over fragile CSS class selectors in component tests

## Critical Implementation Rules

### Language-Specific Rules

- ES modules only (`"type": "module"`) — NO `require()`, use `import`/`export`
- For `__dirname` in backend, use `fileURLToPath(import.meta.url)` + `dirname()`
- TypeScript strict mode enabled — respect strict typing, avoid `any`
- Frontend uses TypeScript (`.ts`/`.tsx`), JSX (`.jsx`) for components
- Error handling: try-catch with descriptive messages, structured error responses from services

#### React
- Use MUI 7 components for UI primitives, TailwindCSS 4 for custom styling
- Use Emotion for component-level CSS-in-JS where Tailwind is insufficient
- Import via `@` path aliases: `@components`, `@pages`, `@services`, `@ui`, `@hooks`
- Auth via `keycloak-js`: use `ProtectedRoute` and `RoleGuard` components
- React Router 7 for routing, keep routes organized under `@pages`
- Prefer `@mui/x-data-grid` for tables/data grids
- **Dark mode**: all components must respect MUI theme (light/dark) — use `useTheme()` from MUI, no hardcoded colors, check existing theme provider for dark mode tokens
- **Localization**: all user-facing strings go through a localization mechanism — no hardcoded Arabic or English text in components, check existing i18n setup in `@contexts` or `@utils`
- **Responsiveness**: all pages must work on mobile (320px), tablet (768px), and desktop (1280px+) — use MUI `Grid`, `Container`, and Tailwind responsive utilities, no horizontal overflow

#### Express Backend
- Layered: routes → controllers → services (business logic) → Prisma/DB services
- All API routes under `/api/v1/` prefix
- Swagger docs via `swagger-jsdoc` + `swagger-ui-express`
- Middleware for auth (Keycloak token validation), logging, CORS

### Testing Rules
- No test infrastructure is configured. All new code must be written testable by design.
- Playwright 1.58 (E2E) + Jest 30 (unit/integration) + Storybook 8.6 (visual) available but not set up
- Before adding tests, scaffold the test framework first
- Prefer `data-testid` attributes over fragile CSS class selectors for component tests
- Keycloak auth in tests: use WireMock/Pact stubbing (never hit live IDP)
- Prisma `db push` (no migrations) means tests must use transaction-per-test rollback or explicit cleanup

### Code Quality & Style Rules
- ESLint 10 with `typescript-eslint` — run `npx eslint client/src/` before committing
- React hooks rules enforced: `rules-of-hooks` (error), `exhaustive-deps` (warn)
- `react-refresh/only-export-components` — components must be exportable for HMR
- Path aliases mandatory: use `@ui/`, `@common/`, `@pages/` instead of relative imports
- Backend: follow existing route/controller/service pattern — no inline logic in route handlers
- Use environment variables from `.env` for all configurable values
- No hardcoded secrets, tokens, or credentials anywhere

### Development Workflow Rules

#### Startup Sequence (strict order)
1. `docker compose -p qaf-lms -f scripts/docker/docker-compose.yml up -d` — infra first
2. `npx prisma generate --schema=client/prisma/schema.prisma` — after every schema change
3. `node backend/server.js` — backend on `:8001`
4. `cd client && node node_modules/vite/bin/vite.js --host` — frontend on `:5174` (HTTPS)
- Keycloak takes 20-30s after `healthy` to accept OIDC requests — backend must retry or wait

#### Prisma
- NEVER use `prisma migrate`. Only `generate` then `db push` — intentional for air-gapped deployment
- Column renames in Prisma = drop+add in DB. Rename field + update all references in the same PR
- After `db push`, restart backend
- No migration rollback path — destructive changes lose data

#### Git Workflow
- Branch from issue: `feature/ISSUE-XX-slug` or `fix/ISSUE-XX-slug`
- Commit messages: `type(scope): description` per Conventional Commits (e.g. `feat(auth): add token refresh`)
- No direct pushes to `main`. PRs require review
- Before PR: verify `prisma generate` + backend starts clean

#### Deployment (Offline Red Network)
- No registry pulls. Docker images pre-bundled via `docker save`/`load` or baked into VM image
- Frontend: build once (`vite build`), serve static files via Nginx — no Vite dev server in field
- Dependencies bundled + pre-built frontend = deployable artifact
- Artifacts synced via USB to red network — no npm install on target
- `.env` files NOT committed — template in `.env.example`
- Agent teams should also capture that MinIO bucket creation must happen before first file upload

### Critical Don't-Miss Rules

#### Security (pre-pen-test)
- NO file write, command exec, or raw SQL until pen testing clears
- All user-facing input must go through Zod/schema validation on backend — no exceptions
- Session tokens are Keycloak JWTs — NEVER roll custom auth
- No hardcoded credentials anywhere
- Auth checks on every protected route via Keycloak middleware

#### Anti-Patterns
- No external service dependencies (offline red network)
- No `npm install` — use `pnpm` only
- No `prisma migrate` — use `db push` only
- No custom auth — Keycloak is the identity boundary
- No CDN-loaded dependencies — everything must be vendored

#### Edge Cases
- Keycloak startup delay (20-30s after healthy) — backend must handle connection retry
- Prisma `db push` is destructive — no rollback path
- Vite 6 dev server uses self-signed certs — Keycloak redirects fail without proper HTTPS config
- Self-signed certs may cause browser warnings on red network — document accepted certs

---

## Recent Work (Last 10 Commits - May 2026)

### Major Feature: Quizzes System
- **Backend**: Complete quiz management system with `backend/controllers/quizzes.js`, `backend/db/quizzes-postgres.js`, and `backend/routes/quizzes.js`
- **Database**: Updated Prisma schema with quiz-related models, added 608 lines of quiz database operations
- **Frontend**: Enhanced quiz pages (`QuizzesPage.jsx`, `QuizPreviewPage.jsx`, `StudentQuizPage.jsx`) with improved UI and functionality
- **Services**: Added `quizService.js` and `studentProgressService.js` for business logic

### Backend Services Expansion
- **File Management**: Added `fileController.js`, `fileShareController.js`, `folderController.js` for file operations
- **Marks System**: New `marks.js` controller for grade management
- **Enrollments**: Enhanced enrollment service with 158 lines of new functionality
- **Activities**: Expanded activities service with 62 lines of new code
- **Notifications**: Complete notification system with SMS adapter, templates, and notification gateway (494 lines of templates)
- **Behaviors/Participations/Penalties**: Enhanced services with improved business logic

### UI/UX Improvements
- **SideDrawer**: Major refactoring of `SideDrawer.jsx` (442 lines) for better navigation
- **Quiz Pages**: Improved styling and functionality for quiz builder, management, and preview pages
- **Language Toggle**: Updated language toggle component
- **Icons**: Added 20 new icon types to `iconTypes.jsx`
- **Loading Components**: Enhanced loading progress and simple loading components

### Keycloak Configuration
- **Realm Setup**: Complete Keycloak realm configuration in `military-lms-realm.json` (2042 lines)
- **Authentication**: Updated authentication flow and user management

### Database Schema Updates
- **Prisma Schema**: Major updates to support quizzes, activities, and workflow features
- **PostgreSQL Operations**: Enhanced database operations for activities, dashboard, and quizzes

### Current Focus: Workflow System
- **Workflow Inbox**: Main development focus - `/workflow/inbox` page for document workflow management
- **Workflow Diagram**: Component for visualizing workflow processes
- **Workflow Document Detail**: Page for viewing and managing workflow documents
- **Smart Drive Integration**: Workflow tab integration with smart drive functionality

---



## Usage Guidelines

**For AI Agents:**
- Read this file before implementing any code
- Follow ALL rules exactly as documented
- When in doubt, prefer the more restrictive option
- Update this file if new patterns emerge

**For Humans:**
- Keep this file lean and focused on agent needs
- Update when technology stack changes
- Review quarterly for outdated rules
- Remove rules that become obvious over time

Last Updated: 2026-05-26
