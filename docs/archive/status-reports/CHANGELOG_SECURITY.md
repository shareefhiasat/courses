# Security & Code Quality Changelog

**Date**: July 2026  
**Scope**: Pre-pentest security hardening + dead code cleanup  
**Stats**: 122 files changed, 463 insertions, 2,138 deletions

---

## 1. Dead Code Removal (92 files deleted)

### One-off debug/fix-summary scripts (60+ files in project root)
Throwaway `.cjs`/`.js` scripts accumulated during development — all deleted:
- `announcements-*-fix-complete.cjs`, `audit-field-fixes-summary.cjs`
- `backend-fk-fixes-summary.cjs`, `category-confusion-fix-summary.cjs`
- `class-create-fix-summary.cjs`, `class-service-fix-summary.cjs`
- `complete-database-summary.js`, `complete-fk-migration-summary.cjs`
- `complete-resource-fix-summary.cjs`, `complete-seed-all.js`, `complete-seed.js`
- `comprehensive-seed.js`, `constants-unification-complete.cjs`
- `critical-fix-summary.cjs`, `database-driven-help-system-complete.cjs`
- `database-migration-complete.cjs`, `debug-logout-400.cjs`, `debug-user-login.cjs`
- `deep-debug-data-flow.cjs`, `es6-module-fix-summary.cjs`
- `final-es6-import-fix.cjs`, `final-file-text-icon-fix.cjs`, `final-seed.js`
- `final-solution.cjs`, `final-verification.cjs`
- `grid-data-issue-debug.cjs`, `grid-debugging-added.cjs`, `grid-fixes-summary.cjs`
- `login-fix-summary.cjs`, `priority-implementation-complete.cjs`
- `prisma-import-fix-summary.cjs`, `program-subject-optional-summary.cjs`
- `resource-type-*.cjs` (6 files), `resources-fixes-summary.cjs`
- `seed-penalties-fixed.js`, `seed-penalties-only.js`, `seed-remaining-v2.js`, `seed-remaining.js`
- `simple-seed.js`, `ssl-setup-complete.cjs`
- `target-audience-implementation-complete.cjs`, `test-3p-cookies.cjs`
- `test-api*.cjs` (3 files), `test-audit-fields.cjs`, `test-collaboration.cjs`
- `test-direct-creation.cjs`, `test-drive-*.cjs` (5 files)
- `test-file-sharing.cjs`, `test-file-versions.cjs`, `test-keycloak-connection.cjs`
- `test-login-after-reset.cjs`, `test-logout-fix*.cjs` (2 files)
- `test-master-realm.cjs`, `test-military-lms.cjs`, `test-multi-role.cjs`
- `test-program-update-fix.cjs`, `test-resource-*.cjs` (2 files)
- `test-user-creation*.cjs` (2 files), `test-users-api.cjs`
- `update-vs-create-fix-summary.cjs`, `updatedBy-fix-summary.cjs`
- `updater-relation-fix-complete.cjs`

### Legacy duplicate backend routes & controllers (10 files)
Replaced by the unified `backend/routes/lookup.js`:
- `backend/controllers/participation-types.js`
- `backend/controllers/priority-types.js`
- `backend/controllers/requirementTypes.js`
- `backend/controllers/subjectTypes.js`
- `backend/routes/categoryTypes.js`
- `backend/routes/participation-types.js`
- `backend/routes/priority-types.js`
- `backend/routes/requirementTypes.js`
- `backend/routes/resourceTypes.js`
- `backend/routes/subjectTypes.js`

### Duplicate frontend entry points (2 files)
- `client/src/App.tsx` — app uses `App.jsx`, the `.tsx` copy was dead
- `client/src/main.tsx` — app uses `main.jsx`, the `.tsx` copy was dead

---

## 2. Security Fixes (OWASP Top 10)

See `SECURITY_REVIEW.md` for the detailed OWASP mapping.

### JWT Signature Verification (Critical)
- **File**: `backend/middleware/keycloakAuth.js`
- **Before**: `jwt.decode()` — no signature check, anyone could forge tokens
- **After**: `jwks-rsa` fetches Keycloak's public keys, `jwt.verify()` validates RS256 signature + issuer + expiration
- **OWASP**: A01 Broken Access Control / A07 Identification & Auth Failures

### Removed Token Leakage Vectors
- **Removed `?token=` query-string fallback** on all `/api` routes (leaked bearer tokens into logs, browser history, Referer headers)
- **Removed `console.log("Headers:", req.headers)`** that dumped Authorization/Cookie on every request
- **Files**: `backend/middleware/keycloakAuth.js`, `backend/server.js`
- **OWASP**: A02 Cryptographic Failures / A09 Security Logging Failures

### Security Headers (helmet)
- **File**: `backend/server.js`
- Added `helmet()` middleware: HSTS, X-Content-Type-Options, X-Frame-Options, etc.
- CSP left off globally (swagger-ui-express needs inline scripts)
- **OWASP**: A05 Security Misconfiguration

### Rate Limiting
- **File**: `backend/server.js`
- Added `express-rate-limit`: 600 requests / 15 min / IP on all `/api/*` routes
- **OWASP**: A04 Insecure Design (DoS/brute-force protection)

### XSS Prevention (DOMPurify)
- **New file**: `client/src/utils/sanitizeHtml.js`
- Wrapped all `dangerouslySetInnerHTML` call sites with `DOMPurify.sanitize()`
- **10 files updated**: `DeleteModal.jsx`, `EmailLogs.jsx`, `DetailedResults.jsx`, `UnifiedCard.jsx`, `HomePage.jsx`, `QuizPreviewPage.jsx`, `QuizBuilderPage.jsx`, `StudentQuizPage.jsx`, `QuizzesPage.jsx`, `StudentAttendancePage.jsx`
- **OWASP**: A03 Injection (XSS)

---

## 3. New Files Created

| File | Purpose |
|------|---------|
| `client/src/utils/sanitizeHtml.js` | DOMPurify wrapper for safe HTML rendering |
| `client/src/utils/deviceHash.js` | Browser device fingerprint utility for attendance scanning |
| `SECURITY_REVIEW.md` | Detailed OWASP Top 10 mapping of all security fixes |
| `scripts/security/zap-baseline.sh` | OWASP ZAP baseline scan script (Docker-based) |
| `.github/workflows/zap-baseline.yml` | GitHub Actions workflow for on-demand ZAP scans |
| `.jscpd.json` | Copy-paste detection configuration |

---

## 4. Code Quality Tooling

- **jscpd**: Added as devDependency with `pnpm run dup` script for duplication detection
- **Semgrep MCP server**: Added to `.cursor/mcp.json` for IDE-integrated static analysis
- **OWASP ZAP**: Baseline scan via `pnpm security:scan` (local) or GitHub Actions (CI)
- **.gitignore**: Updated to exclude `reports/jscpd/` and `reports/zap/`

---

## 5. Documentation

- **`SECURITY_REVIEW.md`**: Full OWASP Top 10 mapping, CSRF/cookie analysis, known accepted gaps, automated scan instructions
- **`KEYCLOAK_SETUP.md`**: Added OTP/MFA section — confirmed realm uses standard RFC 6238 TOTP (compatible with Google Authenticator, Microsoft Authenticator, FreeOTP, Authy, and any generic TOTP app)

---

## 6. Pre-existing Bug Fixed

- **`StudentAttendancePage.jsx`**: Had broken imports — `scanAttendance` was imported from the wrong module (`attendanceService` instead of `attendanceBusinessService`), and `simpleDeviceHash` didn't exist anywhere in the codebase. Fixed the import path and created the missing `client/src/utils/deviceHash.js` utility.

---

## 7. Verification

- Backend and frontend stopped and restarted cleanly
- Security headers confirmed active via `curl` (HSTS, X-Frame-Options, X-Content-Type-Options, RateLimit-*)
- Forged JWT tokens correctly rejected with HTTP 401
- Keycloak login flow works end-to-end (redirect → login → callback → app loads)
- No JavaScript runtime errors from any of the changes
