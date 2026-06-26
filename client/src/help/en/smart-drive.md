---
title: Smart Drive
tags: [drive, files, storage, upload, share]
route: /smart-drive
order: 40
---

# Smart Drive

Smart Drive is the file management system for storing, organising, and sharing learning materials. It is powered by MinIO object storage.

## Who can access

| Role | Operations | What they can do |
| --- | --- | --- |
| Super Admin | view, create, update, delete | Full drive management |
| Admin | view, create, update, delete | Full drive management |
| HR | view, create, update, delete | Upload and manage files |
| Instructor | view, create, update, delete | Upload and share resources with students |
| Student | view, create | Upload files and view shared resources |

> **Screen ID:** `drive` — Requires `view` operation. Create/update/delete require corresponding permissions.

## Key actions

- **Upload files** — Drag and drop or browse to upload files and folders. Supported formats include documents, images, videos, and PDFs.
- **Preview** — Click a file to preview it in the browser. Supported formats: PDF, images, text, and some video formats.
- **Download** — Download files individually or select multiple files to download as a ZIP archive.
- **Share** — Set permissions to share files with specific users, groups, or entire classes.
- **Organise** — Create folders and subfolders to organise your files hierarchically.
- **Trash** — Deleted files go to the Trash folder and can be restored within 30 days. After 30 days, files are permanently deleted.
- **Search** — Use the search bar to find files by name or metadata.

## Validations & business rules

- **File size limit** — Individual files are limited to 500 MB. For larger files, contact your administrator.
- **Storage quota** — Each user has a storage quota. When you reach the limit, uploads are blocked until files are deleted.
- **Allowed file types** — Executable files (`.exe`, `.bat`, `.sh`) are blocked for security. Other file types are allowed.
- **Share permissions** — You can set view-only or view-and-download permissions when sharing files.
- **Soft delete** — All deletions are soft-deletes. Files remain in Trash for 30 days before permanent removal.
- **Version history** — Uploading a file with the same name as an existing file creates a new version. Previous versions are accessible via the file details panel.

## Limitations

- Folder depth is limited to 10 levels.
- Bulk download (ZIP) is limited to 2 GB total size.
- File previews are not available for all video formats — some may require downloading first.
- Shared files do not sync in real time — recipients need to refresh their drive view to see newly shared items.

## Related articles

- [Dashboard](/en/dashboard) — Resources tab links to Smart Drive files.
- [Chat](/en/chat) — Attach files from Smart Drive in chat messages.
- [Profile & Settings](/en/profile) — View your storage quota usage.
