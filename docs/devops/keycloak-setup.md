# Keycloak Setup Guide - LMS Integration

## Overview

This LMS application uses **Keycloak** as the sole source of truth for:
- User authentication
- User management (creation, deletion, enable/disable)
- Role assignment
- Password management

**No Firestore, no allowlist, no email invitations** - everything is Keycloak-based.

## Canonical Roles

The LMS defines exactly **5 roles** that must exist in Keycloak:

| Role | Code | Description |
|------|------|-------------|
| Super Admin | `super_admin` | Full system access, can manage all users and settings |
| Admin | `admin` | Manage academic content, users (limited), and reports |
| HR | `hr` | Manage attendance, penalties, and HR-related functions |
| Instructor | `instructor` | Manage classes, quizzes, grades, and student participation |
| Student | `student` | Access learning materials, quizzes, and personal progress |

**Important:** Role names must use **underscores** (e.g., `super_admin`, not `super-admin` or `superadmin`).

## Role Storage in Keycloak

The application supports roles from **both** sources and merges them:

1. **Realm Roles**: `tokenParsed.realm_access.roles`
2. **Client Roles**: `tokenParsed.resource_access[clientId].roles`

The frontend `AuthContext` automatically:
- Extracts roles from both locations
- Deduplicates them
- Normalizes naming (converts `super-admin` → `super_admin`)

### Recommended Approach

For simplicity, use **Realm Roles**:
1. Create the 5 roles at the realm level
2. Assign them to users directly
3. Roles will appear in `realm_access.roles` in the token

## Setting Up Keycloak

### 1. Create Realm

```bash
# Create a new realm called "lms"
Realm Name: lms
Display Name: Learning Management System
Enabled: Yes
```

### 2. Create Realm Roles

Navigate to **Realm Settings → Roles → Create Role**

Create these 5 roles:

```
super_admin
admin
hr
instructor
student
```

### 3. Create Admin Client for Backend

The backend needs a service account to call Keycloak Admin API.

**Client Settings:**
```
Client ID: admin-cli
Client Protocol: openid-connect
Access Type: confidential
Service Accounts Enabled: Yes
Authorization Enabled: No
```

**Service Account Roles:**
- Go to **Service Account Roles** tab
- Assign **realm-admin** role from `realm-management` client

**Get Client Secret:**
- Go to **Credentials** tab
- Copy the **Secret** value
- Add to backend `.env`:
  ```
  KEYCLOAK_ADMIN_CLIENT_ID=admin-cli
  KEYCLOAK_ADMIN_CLIENT_SECRET=<your-secret-here>
  ```

### 4. Create Frontend Client

**Client Settings:**
```
Client ID: lms-client
Client Protocol: openid-connect
Access Type: public
Standard Flow Enabled: Yes
Direct Access Grants Enabled: Yes
Valid Redirect URIs: http://localhost:5173/*
Web Origins: http://localhost:5173
```

**Add to frontend `.env`:**
```
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=lms
VITE_KEYCLOAK_CLIENT_ID=lms-client
```

### 5. Create Initial Super Admin User

1. Navigate to **Users → Add User**
2. Fill in:
   ```
   Username: admin@example.com
   Email: admin@example.com
   First Name: Super
   Last Name: Admin
   Email Verified: Yes
   Enabled: Yes
   ```
3. Click **Save**
4. Go to **Credentials** tab → Set Password
5. Go to **Role Mappings** tab → Assign `super_admin` role

## User Management Workflow

### Creating Users (Super Admin)

Super admins create users via the LMS **Users Page**:

1. Click **Add User**
2. Enter:
   - Email
   - First Name
   - Last Name
   - Role (one of the 5)
3. System generates temporary password
4. Temporary password is shown **once** to admin
5. User created in Keycloak with:
   - Account enabled
   - Email as username
   - Temporary password (must change on first login)
   - Assigned role

### Setting Passwords (Super Admin)

Super admins can directly set user passwords:

1. Select user → **Set Password**
2. Enter new password
3. Choose if temporary (user must change on next login)
4. Password updated in Keycloak immediately

**No email is sent** - admin must communicate password to user.

### Enable/Disable Users

- **Disable**: User cannot log in, token refresh fails
- **Enable**: User can log in again

### Deleting Users

Deletes user from:
1. Keycloak (authentication)
2. Local PostgreSQL database (application data)

## Role-Based Access Control (RBAC)

### How It Works

1. User logs in via Keycloak
2. JWT token contains roles in `realm_access.roles` and/or `resource_access[clientId].roles`
3. Frontend `AuthContext` merges and normalizes roles
4. `RoleGuard` component checks screen access via `SCREEN_ROLE_ACCESS` mapping
5. Super admin bypasses all checks (full access)

### Screen Access Mapping

Defined in `client/src/constants/screenDefinitions.js`:

```javascript
export const SCREEN_ROLE_ACCESS = {
  dashboard: ['super_admin', 'admin', 'hr', 'instructor'],
  programs: ['super_admin', 'admin'],
  hrAttendance: ['super_admin', 'hr'],
  // ... etc
};
```

### Protecting Routes

```jsx
import RoleGuard from '@components/RoleGuard';

<RoleGuard screenId="dashboard">
  <DashboardPage />
</RoleGuard>
```

### Protecting Actions/Buttons

```jsx
import { useAuth } from '@contexts/AuthContext';

const { isSuperAdmin, isAdmin } = useAuth();

{(isSuperAdmin || isAdmin) && (
  <Button onClick={handleDelete}>Delete</Button>
)}
```

## Database Synchronization

### User Roles Table (PostgreSQL)

The local database has a `user_roles` table with the canonical 5 roles:

```sql
CREATE TABLE user_roles (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name_en VARCHAR(100),
  name_ar VARCHAR(100)
);

INSERT INTO user_roles (code, name_en, name_ar) VALUES
  ('super_admin', 'Super Admin', 'مدير النظام'),
  ('admin', 'Admin', 'مسؤول'),
  ('hr', 'HR', 'موارد بشرية'),
  ('instructor', 'Instructor', 'مدرس'),
  ('student', 'Student', 'طالب');
```

**Critical:** Role codes in PostgreSQL **must match** Keycloak role names exactly.

### User Sync on Login

When a user logs in:
1. `AuthContext` extracts user info from Keycloak token
2. `authBusinessService.syncUserFromKeycloak()` checks local database
3. If user doesn't exist locally, creates record
4. If user exists, updates profile if needed

## Environment Variables

### Backend (.env)
```bash
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=lms
KEYCLOAK_ADMIN_CLIENT_ID=admin-cli
KEYCLOAK_ADMIN_CLIENT_SECRET=<your-secret>
```

### Frontend (.env)
```bash
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=lms
VITE_KEYCLOAK_CLIENT_ID=lms-client
```

## API Endpoints

All user management endpoints require authentication with `super_admin` role:

```
GET    /api/users/admin/users          # List users
POST   /api/users/admin/users          # Create user
PUT    /api/users/admin/users/:id      # Update user
DELETE /api/users/admin/users/:id      # Delete user
PUT    /api/users/admin/users/:id/password   # Set password
PUT    /api/users/admin/users/:id/enabled    # Enable/disable
```

## Troubleshooting

### Token doesn't contain roles

**Check:**
1. Roles are assigned to user in Keycloak
2. Client has proper scope mappings
3. Token mapper is configured for roles

**Fix:**
- Go to **Client → Client Scopes → Evaluate**
- Enter username, check if roles appear in token

### Admin API calls fail with 403

**Check:**
1. Service account has `realm-admin` role
2. Client secret is correct in `.env`
3. Token is being obtained successfully

### User can't access screen despite having role

**Check:**
1. Role name matches exactly (underscores vs hyphens)
2. `SCREEN_ROLE_ACCESS` includes the role for that screen
3. Browser console for `AuthContext` logs showing merged roles

## Security Best Practices

1. **Never expose admin client secret** in frontend code
2. **Use HTTPS** in production for Keycloak
3. **Enable email verification** for production users
4. **Set password policies** in Keycloak realm settings
5. **Enable MFA** for super admin accounts
6. **Rotate client secrets** periodically
7. **Monitor failed login attempts** via Keycloak events

## Migration from Old System

If migrating from allowlist/Firestore:

1. Export existing user emails and roles
2. Create users in Keycloak via Admin API or UI
3. Assign appropriate roles
4. Send temporary passwords to users
5. Remove old allowlist data from database
6. Update frontend to remove allowlist references

## References

- [Keycloak Admin REST API](https://www.keycloak.org/docs-api/latest/rest-api/index.html)
- [Keycloak Authorization Services](https://www.keycloak.org/docs/latest/authorization_services/)
- [React Keycloak Integration](https://github.com/react-keycloak/react-keycloak)
