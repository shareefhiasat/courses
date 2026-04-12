# Keycloak to Nextcloud ACL Mapping

This guide explains how to reuse your existing Keycloak realm and role model to control Nextcloud file ACLs via Nextcloud groups.

## Goal

Use Keycloak as the identity and role authority, then synchronize those roles into Nextcloud groups to enforce folder-level permissions in `Groupfolders`.

## Role Mapping

Default mapping implemented in backend:

- `super_admin` -> `nc_admins`
- `admin` -> `nc_admins`
- `hr` -> `nc_hr`
- `instructor` -> `nc_instructors`
- `student` -> `nc_students`

Override using environment variables:

```env
NEXTCLOUD_GROUP_SUPER_ADMIN=nc_admins
NEXTCLOUD_GROUP_ADMIN=nc_admins
NEXTCLOUD_GROUP_HR=nc_hr
NEXTCLOUD_GROUP_INSTRUCTOR=nc_instructors
NEXTCLOUD_GROUP_STUDENT=nc_students
```

## Implemented Sync Endpoints

- `GET /api/v1/nextcloud-acl/mapping`
- `POST /api/v1/nextcloud-acl/sync-user`
- `POST /api/v1/nextcloud-acl/sync-all`

### Sync one user

```http
POST /api/v1/nextcloud-acl/sync-user
Content-Type: application/json

{
  "keycloakUser": {
    "id": "keycloak-user-id",
    "username": "instructor.ahmad",
    "email": "instructor@example.local",
    "firstName": "Ahmad",
    "lastName": "Ali"
  }
}
```

### Sync all users

```http
POST /api/v1/nextcloud-acl/sync-all
Content-Type: application/json

{
  "search": "",
  "first": 0,
  "max": 100
}
```

## How It Works

1. LMS backend fetches users/roles from Keycloak Admin API.
2. LMS ensures corresponding Nextcloud user and group exist.
3. LMS assigns/removes group memberships to match Keycloak roles.
4. Nextcloud `Groupfolders` apply ACLs from those groups.

## Groupfolders Permission Example

- `GF_Instructor_Submissions`
  - `nc_instructors`: create/upload
  - `nc_admins`: read/write/review
- `GF_Admin_Review`
  - `nc_admins`: read/write
  - `nc_hr`: read
- `GF_HR_Archive`
  - `nc_hr`: read/write/archive
  - `nc_instructors`: no access

## Keycloak Notes

- Reusing your existing realm/client is valid and recommended.
- Ensure Nextcloud has its own OIDC client in the same realm.
- Add role/group claims in the token mapper so user identity remains consistent across LMS and Nextcloud.

## Operational Recommendations

- Run `sync-all` after role bulk updates or migration.
- Run `sync-user` immediately after user role changes.
- Keep LMS as source-of-truth for role policy and workflow state.
