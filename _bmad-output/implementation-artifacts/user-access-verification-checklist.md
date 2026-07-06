# User Access Verification Checklist

## Personas to test

- [ ] Super Admin — unrestricted data, matrix edit, UCA manage
- [ ] Scoped HR — UCA on Program A only; no Program B data on QR, summary, chat, workflow
- [ ] Scoped Admin — same UCA rules as HR; matrix may differ per Super Admin config
- [ ] Instructor — taught class ∪ UCA; no other classes
- [ ] Student — enrolled classes only

## IDOR checks

- [ ] GET attendance/:id outside scope → 403
- [ ] GET workflow-documents/:id outside scope → filtered or 403
- [ ] GET drive file outside share/scope → denied
- [ ] GET users list as student → 403 (matrix)
- [ ] PUT marks outside class scope → 403

## Permission chain checks

- [ ] Grant penalty.canDelete without penalty.canView → auto-grants view on save
- [ ] qr-scanner.canEditAttendance without canMarkAttendance → auto-grants mark on save
- [ ] API returns 403 with missingPrerequisite when matrix manually broken

## Integration checks

- [ ] Workflow submit auto-shares only to scoped HR/Admin on document class
- [ ] Chat room list excludes out-of-scope classes
- [ ] Notifications with classId metadata hidden when out of scope
- [ ] Summary dashboard filters match UCA

## Audit

- [ ] Review permission denial audit logs for false positives
- [ ] Confirm SHA-16 closed: GET /users requires users.canView
