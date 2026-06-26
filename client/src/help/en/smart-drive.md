---
title: Smart Drive
tags: [drive, files, storage, upload, share]
route: /smart-drive
order: 40
keywords: [smart drive, files, upload, download, share, preview, MinIO, storage quota, trash, restore, version history, folder, ZIP, file attachment, my-drive, starred, shared, shared-by-me, recent, Collabora, edit, public link, file type, image, video, pdf, document, presentation, spreadsheet, rename, delete, permanent delete, folder tree, breadcrumbs, grid view, list view, guided tour]
---

# Smart Drive

Smart Drive is the file management system for storing, organising, and sharing learning materials. It is powered by MinIO object storage and integrates with Collabora Online for in-browser document editing. Files can be organised into folders, shared with users or via public links, versioned, and sent through workflow approvals.

## Who can access

| Role | Operations | What they can do |
| --- | --- | --- |
| Super Admin | view, create, update, delete | Full drive management |
| Admin | view, create, update, delete | Full drive management |
| HR | view, create, update, delete | Upload and manage files |
| Instructor | view, create, update, delete | Upload and share resources with students |
| Student | view, create | Upload files and view shared resources |

> **Screen ID:** `drive` — Requires `view` operation. Create/update/delete require corresponding permissions.

## Drive spaces

The left sidebar provides navigation between different drive spaces:

| Space | Description |
| --- | --- |
| **My Drive** | Your personal file space. All files you upload appear here by default. |
| **Starred** | Files and folders you have marked as starred for quick access. |
| **Shared** | Files and folders that other users have shared with you. |
| **Shared by me** | Files and folders you have shared with others. |
| **Recent** | Files sorted by last modified date, showing the most recent first. |
| **Trash** | Soft-deleted files and folders. Can be restored within 30 days. |

## Key actions

### Uploading files

- **Drag and drop** — Drag files from your desktop directly into the drive area.
- **Browse** — Click the upload button to open a file picker and select files.
- **Upload folders** — Upload entire folder structures preserving hierarchy.
- **Multi-step upload process** — The `useUpload` hook manages a three-step process: (1) initiate the upload with file metadata, (2) upload the file bytes to MinIO via a presigned URL, (3) complete the upload and register the file in the database.
- **Upload progress** — Each file shows a progress bar during upload. Multiple files can upload simultaneously.
- **Version creation** — If a file with the same name already exists in the same folder, the upload creates a new version instead of replacing the file.

### Previewing files

- **In-browser preview** — Click any file to open the File Details Modal with a preview. Supported formats: PDF, images (PNG, JPEG, GIF, WebP, SVG), text, and some video formats.
- **File type detection** — The system auto-detects file types (image, video, pdf, document, presentation, spreadsheet, unknown) and renders the appropriate preview.
- **Preview URL** — The system fetches a secure, time-limited preview URL from the backend.
- **Fullscreen** — Toggle fullscreen mode within the preview modal.
- **Collabora Online** — For document formats (DOCX, XLSX, PPTX), Collabora Online provides in-browser editing and viewing. An edit token is fetched from the backend.

### Downloading files

- **Individual download** — Click the download icon on any file to download it.
- **Bulk download (ZIP)** — Select multiple files and folders, then click the download button. The system packages them into a ZIP archive. Limited to 2 GB total.

### Organising files

- **Create folder** — Click the "New Folder" button to open the Create Folder Modal. Enter a name and confirm.
- **Folder tree** — The left panel shows a hierarchical tree of your folders for easy navigation.
- **Breadcrumbs** — Navigate up the folder hierarchy using breadcrumb links at the top.
- **Navigate folders** — Click any folder to enter it and view its contents.
- **Rename** — Right-click a file or folder and select rename. Enter the new name and confirm.
- **Move** — Drag files between folders or use the move action.
- **Grid/List view** — Toggle between grid view (thumbnails) and list view (detailed rows).

### Sharing files

- **Share with users** — Open the Share tab in File Details Modal. Select users, groups, or classes and assign permissions.
- **Share permissions** — Two permission levels: `VIEW` (view only) and `EDIT` (view and edit).
- **Public link** — Generate a public link that anyone can access without logging in. The link can be revoked at any time.
- **Shared by me** — View all files you have shared in the "Shared by me" space.
- **Shared with me** — View all files others have shared with you in the "Shared" space.

### Starring

- **Star** — Click the star icon on any file or folder to add it to your Starred space for quick access.
- **Unstar** — Click the star icon again to remove it from Starred.

### Trash and deletion

- **Soft delete (trash)** — Deleting a file or folder moves it to the Trash. It remains there for 30 days.
- **Restore** — Restore files or folders from the Trash back to their original location.
- **Permanent delete** — Permanently delete files from the Trash. This action cannot be undone.
- **Trash counts against quota** — Files in Trash still count against your storage quota until permanently deleted.

### File details modal

The File Details Modal provides comprehensive file information across multiple tabs:

| Tab | Description |
| --- | --- |
| **Preview** | In-browser preview of the file content (images, PDF, video, text). |
| **Edit** | Collabora Online editor for document formats (DOCX, XLSX, PPTX). Requires edit permission. |
| **Details** | File metadata — name, type, size, owner, created/modified dates, folder path. |
| **Versions** | Version history of the file. Download or restore previous versions. |
| **Comments** | Add, view, and delete comments on the file. |
| **Activity** | Chronological log of all actions on the file (upload, edit, share, rename, etc.). |
| **Workflow** | Create a workflow document from this file via `createCustomWorkflow`. Links the file to the [Workflow](/en/workflow) system. |
| **Share** | Manage sharing settings — add/remove users, change permissions, generate/revoke public links. |

### Workflow integration

- **Create workflow from file** — From the File Details Modal's Workflow tab, create a custom workflow document with the file attached. This submits the file for approval via the [Workflow](/en/workflow) system.

### Guided tour

- **First-time tour** — When a user first visits Smart Drive, a guided tour highlights key features: upload, folder creation, sharing, and search. The tour can be skipped and restarted later.

## File types

The system detects and categorises files into the following types:

| Type | Extensions | Preview support |
| --- | --- | --- |
| **Image** | PNG, JPEG, GIF, WebP, SVG, BMP, TIFF | Yes (in-browser) |
| **Video** | MP4, WebM, MOV | Yes (in-browser for MP4/WebM) |
| **PDF** | PDF | Yes (in-browser) |
| **Document** | DOCX, DOC, TXT, RTF | Yes (via Collabora) |
| **Presentation** | PPTX, PPT | Yes (via Collabora) |
| **Spreadsheet** | XLSX, XLS, CSV | Yes (via Collabora) |
| **Unknown** | Other | No (download only) |

## Validations & business rules

- **File size limit** — Individual files are limited to 500 MB. For larger files, contact your administrator.
- **Storage quota** — Each user has a storage quota. When you reach the limit, uploads are blocked until files are deleted.
- **Allowed file types** — Executable files (`.exe`, `.bat`, `.sh`) are blocked for security. Other file types are allowed.
- **Share permissions** — You can set `VIEW` (view only) or `EDIT` (view and edit) permissions when sharing files.
- **Soft delete** — All deletions are soft-deletes. Files remain in Trash for 30 days before permanent removal.
- **Version history** — Uploading a file with the same name as an existing file creates a new version. Previous versions are accessible via the Versions tab in File Details.
- **Folder depth** — Folder hierarchy is limited to 10 levels deep.
- **Presigned URLs** — File uploads and downloads use MinIO presigned URLs for secure, time-limited access.
- **Activity logging** — All file operations (upload, download, preview, edit, share, rename, delete, restore) are logged in the Activity tab.
- **Edit token** — Collabora Online editing requires a backend-issued edit token, ensuring only authorised users can edit.

## Limitations

- Folder depth is limited to 10 levels.
- Bulk download (ZIP) is limited to 2 GB total size.
- File previews are not available for all video formats — some may require downloading first.
- Shared files do not sync in real time — recipients need to refresh their drive view to see newly shared items.
- Collabora Online editing requires a stable network connection. Offline editing is not supported.
- Public links are accessible to anyone with the URL — no authentication required. Revoke links when no longer needed.

## Troubleshooting

| Problem | Solution |
| --- | --- |
| Upload fails with size error | File exceeds 500 MB limit. Compress the file or contact your administrator. |
| Cannot preview a file | The format may not support in-browser preview. Download the file and open it locally. |
| Storage quota exceeded | Delete files from Trash or remove unused files. Trash items still count against your quota. |
| Shared file not visible to recipient | Ask the recipient to refresh their Smart Drive page. Sharing does not push in real time. |
| ZIP download fails | Total size exceeds 2 GB limit. Download files individually or in smaller batches. |
| Collabora editor won't load | Check your network connection. Ensure the file format is supported (DOCX, XLSX, PPTX). Try refreshing the page. |
| Cannot create folder | Verify you have `create` permission on the `drive` screen. Check that the folder name is valid (no special characters). |
| Public link not working | The link may have been revoked. Ask the owner to generate a new link. |
| Version history is empty | Versions are only created when uploading a file with the same name. Ensure the file name matches exactly. |
| Cannot restore from Trash | The 30-day retention period may have expired. Permanently deleted files cannot be restored. |
| File stuck in upload progress | Check your network connection. If the presigned URL expired, cancel and retry the upload. |

## Related articles

- [Dashboard](/en/dashboard) — Resources tab links to Smart Drive files.
- [Chat](/en/chat) — Attach files from Smart Drive in chat messages.
- [Profile & Settings](/en/profile) — View your storage quota usage.
- [Workflow](/en/workflow) — Create custom workflow documents from Smart Drive files.
