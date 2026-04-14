# Keycloak Scripts

This directory contains scripts for managing Keycloak users and synchronization with the database.

## Available Scripts

### sync-users-to-keycloak.js
Syncs existing database users to Keycloak. This script:
- Finds users in the database without `keycloakId`
- Checks if they exist in Keycloak by email
- If they exist, updates the database with their Keycloak UUID
- If they don't exist, creates them in Keycloak
- Assigns the correct roles in both systems

**Usage:**
```bash
node scripts/keycloak/sync-users-to-keycloak.js
```

### create-user-in-keycloak.js
Creates a new user in both Keycloak and the database. This script:
- Creates a user in Keycloak with a temporary password
- Assigns the specified role in Keycloak
- Creates the user in the database with the Keycloak UUID
- Assigns the role in the database

**Usage:**
```bash
node scripts/keycloak/create-user-in-keycloak.js <email> <firstName> <lastName> [role]
```

**Roles:** `super_admin`, `admin`, `instructor`, `hr`, `student` (default: `student`)

**Example:**
```bash
node scripts/keycloak/create-user-in-keycloak.js john@example.com John Doe instructor
```

## Environment Variables

These scripts require the following environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `KEYCLOAK_URL` - Keycloak server URL (default: `http://localhost:8080`)
- `KEYCLOAK_REALM` - Keycloak realm name (default: `military-lms`)
- `KEYCLOAK_CLIENT_ID` - Keycloak backend client ID
- `KEYCLOAK_CLIENT_SECRET` - Keycloak backend client secret

## Official User Creation Flow

**For creating new users, always use:**
1. **UI** → Admin navigates to Users page → Click "Create User"
2. The UI calls `POST /api/v1/users` (createUserController)
3. Backend automatically:
   - Creates user in Keycloak first
   - Gets Keycloak UUID back
   - Creates user in database WITH `keycloakId`
   - Assigns roles in both systems

**Use these scripts only for:**
- Bulk syncing existing users from database to Keycloak
- Manual user creation when the UI is unavailable
- Troubleshooting and testing

## Important Notes

- **Never create users directly in Keycloak admin console** - this breaks the sync
- **Never create users directly in database** - they won't have `keycloakId`
- The `keycloakId` field in the database is critical for the system to work
- All user operations should go through the backend API or these scripts
