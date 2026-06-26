# Workflow Documents Module

## Business Context
The Workflow module manages document approval processes in the military training environment. Documents (leave requests, reports, memos) go through multi-stage approval workflows. Supports compliance tracking, analytics, and document versioning.

## API Routes

### Documents
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
| POST | `/api/v1/workflow-documents/:id/return` | Return for revision |
| POST | `/api/v1/workflow-documents/:id/resubmit` | Resubmit |
| POST | `/api/v1/workflow-documents/:id/upload-signed` | Upload signed version |
| POST | `/api/v1/workflow-documents/:id/withdraw` | Withdraw |
| GET | `/api/v1/workflow-documents/compliance` | Compliance data |
| GET | `/api/v1/workflow-documents/analytics` | Analytics |
| GET | `/api/v1/workflow-documents/:fileId/versions` | File versions |
| GET | `/api/v1/workflow-documents/:fileId/versions/:versionId/download` | Download version |
| POST | `/api/v1/workflow-documents/custom` | Custom workflow |

### Definitions & Instances
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/workflows/definitions` | Create definition |
| GET | `/api/v1/workflows/definitions` | List definitions |
| GET | `/api/v1/workflows/definitions/:definitionId` | Get definition |
| POST | `/api/v1/workflows/instances` | Start instance |
| GET | `/api/v1/workflows/instances` | List instances |
| GET | `/api/v1/workflows/instances/:instanceId` | Get instance |
| POST | `/api/v1/workflows/instances/:instanceId/approve` | Approve |
| POST | `/api/v1/workflows/instances/:instanceId/reject` | Reject |
| GET | `/api/v1/workflows/instances/:instanceId/history` | History |
| POST | `/api/v1/workflows/instances/:instanceId/submit` | Submit |
| POST | `/api/v1/workflows/instances/:instanceId/send-for-review` | Send for review |
| POST | `/api/v1/workflows/instances/:instanceId/send-for-approval` | Send for approval |
| POST | `/api/v1/workflows/instances/:instanceId/approve-simplified` | Approve simplified |
| POST | `/api/v1/workflows/instances/:instanceId/reject-simplified` | Reject simplified |
| POST | `/api/v1/workflows/instances/:instanceId/revise` | Revise |
| POST | `/api/v1/workflows/instances/:instanceId/cancel` | Cancel |
| GET | `/api/v1/workflows/my-tasks` | My pending tasks |

## UI Pages
- `/workflow/inbox` — WorkflowInboxPage (pending tasks)
- `/workflow-documents/:documentId` — Document detail
- `/workflow/:documentId` — Workflow detail (approval flow)
- `/workflow/compliance` — Compliance dashboard
- `/workflow/analytics` — Analytics dashboard

## Business Rules
- Multi-stage approval: submit → review → approve/reject → return/revise
- Documents can be withdrawn by creator
- Signed documents can be uploaded at final stage
- Compliance tracking for audit purposes
- Analytics include approval times, rejection rates
- File versioning for document changes
- Comments per document for collaboration

## Test Coverage
- **API tests**: `specs/workflow-api.spec.js` — 14 tests
- **Test IDs**: TC-WF-001 through TC-WF-035

## Known Issues
None discovered yet.

## Related Modules
- `module:drive` — Documents stored in Smart Drive
- `module:dashboard` — Workflow analytics on dashboard
- `module:notifications` — Approval notifications
