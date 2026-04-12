# Nextcloud Partial Integration Runbook

This runbook implements a partial Nextcloud adoption for the LMS by offloading files/calendar/office collaboration to Nextcloud while keeping approvals, attendance logic, and RBAC orchestration in the LMS backend.

## 1) Scope and Decision

- **Adoption model**: Partial (supplement, not full replacement)
- **Identity source**: Keycloak (single source of truth)
- **Signature mode**: Manual print-sign-scan + reupload
- **Office editing**: Enabled via Collabora
- **Traffic profile**: ~500 concurrent users, co-editing/video < 50, video non-priority

## 2) Architecture (Implemented Direction)

```text
React LMS UI
   |
   v
Node API (workflow authority + audit + RBAC)
   |            \
   |             \ Prisma
   v              v
Nextcloud APIs   PostgreSQL (LMS)
(WebDAV + OCS)      |
   |                |
   v                v
Nextcloud ---- Redis/Postgres (NC) ---- MinIO (later phase)
   ^
   |
Keycloak SSO (OIDC/SAML)
```

## 3) Added Project Artifacts

- Docker stack blueprint:
  - `scripts/docker/docker-compose.nextcloud.yml`
- Nextcloud integration adapter (backend):
  - `backend/services/nextcloudService.js`
- Workflow orchestrator scaffold (backend):
  - `backend/services/documentApprovalWorkflowService.js`
- Workflow HTTP endpoints:
  - `backend/routes/document-workflows.js`
  - `backend/controllers/documentWorkflows.js`
- Keycloak -> Nextcloud ACL sync:
  - `backend/services/nextcloudAclSyncService.js`
  - `backend/routes/nextcloud-acl-sync.js`
  - `backend/controllers/nextcloudAclSync.js`

## 4) Deployment Steps

### 4.1 Start Nextcloud Stack

From `scripts/docker` directory:

```powershell
docker compose -f docker-compose.nextcloud.yml up -d
```

Access:
- Nextcloud: `http://localhost:8085`
- Collabora: `http://localhost:9980`

### 4.2 Initial Nextcloud App Setup

Enable apps in Nextcloud admin UI:
- Files
- Group folders
- Calendar
- Talk (optional)
- Richdocuments (Collabora connector)

### 4.3 Keycloak SSO Integration

Configure Nextcloud app for `openidconnect` (or SAML if preferred):
- Issuer: your Keycloak realm URL
- Client ID/Secret: dedicated Nextcloud client
- Claim mapping:
  - subject -> user id
  - email -> email
  - preferred_username -> username
  - groups/roles -> Nextcloud groups

Recommended role group mapping:
- `ADMIN` -> `nc_admins`
- `HR` -> `nc_hr`
- `INSTRUCTOR` -> `nc_instructors`
- `STUDENT` -> `nc_students`

## 5) Shared Drive and Permission Model

Use Groupfolders as shared drives:
- `GF_Instructor_Submissions`
- `GF_Admin_Review`
- `GF_HR_Archive`

Minimum permission baseline:
- Instructors: create/upload in submission folder
- Admins: read/write in review folder
- HR: read/write in archive folder, read review folder
- Students: no direct access to HR archive

## 6) Workflow Mapping (LMS-authoritative)

### Workflow #1: Attendance Review

States in LMS:
- `draft`
- `admin_review`
- `rejected_by_admin`
- `approved_by_admin`
- `hr_filed`

State transition side-effects:
- Ensure destination folder exists in Nextcloud
- Move file path in Nextcloud
- Add comment trail
- Trigger LMS notifications

### Workflow #2: Manual Signature

States:
- `approved_by_admin`
- `awaiting_signature`
- `signed_uploaded`
- `hr_filed`

Manual process:
1. HR/Admin trigger print step
2. Student signs physically
3. Admin scans/uploads signed artifact
4. HR stamps/files and closes state

## 7) API Integration Notes

`backend/services/nextcloudService.js` currently provides:
- `ensureFolder(folderPath)`
- `moveNode(sourcePath, destinationPath)`
- `createShare(payload)`
- `addComment(payload)`
- `getCalendarCollections()`
- `ensureUser(payload)`
- `ensureGroup(groupId)`
- `addUserToGroup(payload)`
- `removeUserFromGroup(payload)`
- `listGroups()`

Workflow API endpoints:
- `POST /api/v1/document-workflows/attendance/submit`
- `POST /api/v1/document-workflows/attendance/reject`
- `POST /api/v1/document-workflows/attendance/approve`
- `POST /api/v1/document-workflows/signature/awaiting`
- `POST /api/v1/document-workflows/signature/uploaded`
- `POST /api/v1/document-workflows/hr/finalize`

ACL sync API endpoints:
- `GET /api/v1/nextcloud-acl/mapping`
- `POST /api/v1/nextcloud-acl/sync-user`
- `POST /api/v1/nextcloud-acl/sync-all`

ACL sync behavior:
- Reads Keycloak realm roles per user.
- Maps roles to Nextcloud groups (`nc_admins`, `nc_hr`, `nc_instructors`, `nc_students`).
- Creates Nextcloud users/groups on demand and enforces membership.

All methods return standardized shape:

```json
{
  "success": true,
  "payload": {},
  "timestamp": 1710000000000
}
```

or

```json
{
  "success": false,
  "error": { "code": "ERROR_CODE", "message": "Reason" },
  "timestamp": 1710000000000
}
```

## 8) Environment Variables (Backend)

Add to your backend `.env`:

```env
NEXTCLOUD_BASE_URL=http://localhost:8085
NEXTCLOUD_API_USER=admin
NEXTCLOUD_API_APP_PASSWORD=change_me
NEXTCLOUD_API_RETRIES=3
NEXTCLOUD_API_RETRY_BASE_MS=300
```

## 9) MinIO Strategy

Recommended rollout:
1. Run Nextcloud with local Docker volumes first.
2. Validate permissions, SSO, and workflow transitions.
3. Then migrate Nextcloud primary object storage to MinIO/S3 mode.

This lowers migration risk and keeps troubleshooting simple.

## 10) Risks and Mitigations

- **RBAC drift** (LMS vs Nextcloud ACL):
  - Mitigate with Keycloak group mapping policy and periodic ACL audit.
- **Upgrade drift** (Nextcloud core/apps/collabora):
  - Pin image versions and maintain upgrade staging.
- **Operational burden**:
  - Add backup/restore drills for Nextcloud DB + volumes.
- **Workflow ambiguity**:
  - Keep LMS state machine as the only source of workflow truth.

## 11) Go-Live Checklist

- [ ] Nextcloud stack healthy in Docker
- [ ] Keycloak SSO login works for all roles
- [ ] Groupfolders ACLs validated
- [ ] Workflow transitions verified for both scenarios
- [ ] Manual signature artifact chain validated
- [ ] Backup/restore test completed
- [ ] Pilot users trained before wider rollout

## 12) XState Recommendation

Use `XState` where workflow complexity is UI-facing and event-heavy, not as a replacement for backend authority.

Recommended split:
- Backend (`documentApprovalWorkflowService.js`) remains canonical workflow engine and audit authority.
- Frontend may use XState to model UI states like loading/reject-resubmit dialogs and transition guards.

Why this split:
- Prevents client state drift from persisted workflow truth.
- Preserves secure role checks in backend.
- Gives frontend clear deterministic UX flows without duplicating business authority.
