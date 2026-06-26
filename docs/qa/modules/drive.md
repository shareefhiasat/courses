# Smart Drive Module

## Business Context
Smart Drive is the file management system for the Military LMS. It provides file storage, folder organization, sharing (user-to-user and public links), versioning, comments, and Collabora document editing integration. Files are stored in MinIO object storage.

## API Routes (40+)
### Files
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/drive/upload/initiate` | Initiate chunked upload |
| POST | `/api/v1/drive/upload/:fileId/complete` | Complete upload |
| GET | `/api/v1/drive/files` | List files |
| GET | `/api/v1/drive/files/search` | Search files |
| GET | `/api/v1/drive/files/:fileId` | Get file |
| PUT | `/api/v1/drive/files/:fileId` | Update metadata |
| DELETE | `/api/v1/drive/files/:fileId` | Delete (soft) |
| PATCH | `/api/v1/drive/files/:fileId/star` | Star/unstar |
| DELETE | `/api/v1/drive/files/:fileId/trash` | Move to trash |
| POST | `/api/v1/drive/files/:fileId/restore` | Restore from trash |
| DELETE | `/api/v1/drive/files/:fileId/permanent` | Permanent delete |
| GET | `/api/v1/drive/files/:fileId/preview` | Preview file |
| GET | `/api/v1/drive/files/:fileId/download` | Download file |
| POST | `/api/v1/drive/files/:fileId/versions` | Upload new version |
| GET | `/api/v1/drive/files/:fileId/versions` | Get versions |
| POST | `/api/v1/drive/versions/:versionId/restore` | Restore version |

### Folders
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/drive/folders` | List folder children |
| GET | `/api/v1/drive/folders/tree` | Folder tree |
| POST | `/api/v1/drive/folders` | Create folder |
| PATCH | `/api/v1/drive/folders/:folderId` | Update folder |
| DELETE | `/api/v1/drive/folders/:folderId/trash` | Delete folder |
| POST | `/api/v1/drive/folders/:folderId/restore` | Restore folder |
| GET | `/api/v1/drive/folders/:folderId/download` | Download folder (zip) |

### Sharing
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/drive/shares` | Create share |
| GET | `/api/v1/drive/files/:fileId/shares` | List shares |
| DELETE | `/api/v1/drive/shares/:shareId` | Revoke share |
| GET | `/api/v1/drive/shared-with-me` | Shared with me |
| GET | `/api/v1/drive/shared-by-me` | Shared by me |
| POST | `/api/v1/drive/public-links` | Create public link |
| GET | `/api/v1/drive/files/:fileId/public-links` | List public links |
| DELETE | `/api/v1/drive/public-links/:linkId` | Revoke public link |

### Comments & Activities
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/drive/files/:fileId/comments` | Add comment |
| GET | `/api/v1/drive/files/:fileId/comments` | Get comments |
| DELETE | `/api/v1/drive/files/:fileId/comments/:commentId` | Delete comment |
| GET | `/api/v1/drive/files/:fileId/activities` | File activities |

### Other
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/drive/storage` | Storage usage |
| POST | `/api/v1/drive/chat-upload` | Chat file upload (25MB limit) |

### WOPI (Collabora)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/wopi/hosting/discovery` | WOPI discovery |
| GET | `/api/v1/wopi/files/:fileId` | WOPI file info |
| GET | `/api/v1/wopi/files/:fileId/contents` | WOPI file contents |
| POST | `/api/v1/wopi/files/:fileId` | WOPI lock |
| POST | `/api/v1/wopi/files/:fileId/contents` | WOPI save |

## UI Pages
- `/smart-drive` — SmartDrivePage (file browser, folder navigation, sharing UI)

## Business Rules
- Chunked upload for large files (initiate → upload chunks → complete)
- Soft delete (trash) with restore capability
- Permanent delete removes from MinIO
- File versioning with restore
- User-to-user sharing with view/edit permissions
- Public links with optional password protection
- Collabora integration for document editing
- 25MB limit for chat-uploaded files
- Storage quota tracking

## Test Coverage
- **API tests**: `specs/drive-api.spec.js` — 18 tests across files, folders, sharing, comments
- **Test IDs**: TC-DRV-001 through TC-DRV-045

## Known Issues
| ID | Issue | Priority |
|----|-------|----------|
| SHA-18 | Stack trace exposed in error responses | Medium |

## Related Modules
- `module:chat` — Chat file attachments use drive
- `module:workflow` — Workflow documents stored in drive
- `module:dashboard` — Drive analytics on dashboard
