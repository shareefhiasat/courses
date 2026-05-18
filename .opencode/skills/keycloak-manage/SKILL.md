# Keycloak Management Skill

## Description
Manages Keycloak identity provider for the Military LMS — users, realms, clients, auth flows.

## Keycloak Details
- **URL:** http://localhost:8080
- **Admin Console:** http://localhost:8080/admin
- **Admin Credentials:** `admin` / `admin123`
- **Realm:** `military-lms`
- **Client ID:** `military-lms-app`
- **Container:** `lms-qaf-keycloak`
- **Database:** PostgreSQL, container `lms-qaf-keycloak-db`

## Prerequisites
Before any Admin API calls, get a token:
```bash
TOKEN=$(curl -s -X POST http://localhost:8080/realms/master/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=admin-cli" \
  -d "username=admin" \
  -d "password=admin123" \
  -d "grant_type=password" | python3 -c "import json,sys; print(json.load(sys.stdin)['access_token'])")
```

## Operations

### Check Realm Health
```bash
curl -s http://localhost:8080/realms/military-lms | python3 -m json.tool
```

### List All Users
```bash
curl -s "http://localhost:8080/admin/realms/military-lms/users?max=100" \
  -H "Authorization: Bearer $TOKEN" | \
  python3 -c "import json,sys; users=json.load(sys.stdin); [print(f'{u[\"username\"]:30} {u.get(\"email\",\"\"):35} enabled={u.get(\"enabled\",True)}') for u in users]"
```

### Search User by Email or Username
```bash
curl -s "http://localhost:8080/admin/realms/military-lms/users?search=<search_term>" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

### Get User by ID
```bash
curl -s "http://localhost:8080/admin/realms/military-lms/users/<user_id>" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

### Create User
```bash
curl -s -X POST http://localhost:8080/admin/realms/military-lms/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "newuser@example.com",
    "firstName": "New",
    "lastName": "User",
    "enabled": true,
    "emailVerified": true,
    "credentials": [{"type":"password","value":"Password123","temporary":false}]
  }'
```

### Reset User Password
```bash
# Get user ID
UID=$(curl -s "http://localhost:8080/admin/realms/military-lms/users?search=<username>" \
  -H "Authorization: Bearer $TOKEN" | \
  python3 -c "import json,sys; users=json.load(sys.stdin); print(users[0]['id'] if users else '')")
# Reset password
curl -s -X PUT "http://localhost:8080/admin/realms/military-lms/users/$UID/reset-password" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"password","value":"<new_password>","temporary":false}'
```

### Delete User
```bash
UID=$(curl -s "http://localhost:8080/admin/realms/military-lms/users?search=<username>" \
  -H "Authorization: Bearer $TOKEN" | \
  python3 -c "import json,sys; users=json.load(sys.stdin); print(users[0]['id'] if users else '')")
curl -s -X DELETE "http://localhost:8080/admin/realms/military-lms/users/$UID" \
  -H "Authorization: Bearer $TOKEN"
```

### List Clients
```bash
curl -s "http://localhost:8080/admin/realms/military-lms/clients" \
  -H "Authorization: Bearer $TOKEN" | \
  python3 -c "import json,sys; clients=json.load(sys.stdin); [print(f'{c[\"clientId\"]:40} enabled={c.get(\"enabled\",True)}') for c in clients]"
```

### Export Realm Configuration
```bash
curl -s "http://localhost:8080/admin/realms/military-lms" \
  -H "Authorization: Bearer $TOKEN" > military-lms-realm.json
```

### List Realm Roles
```bash
curl -s "http://localhost:8080/admin/realms/military-lms/roles" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

### Assign Role to User
```bash
# Get user ID and role data, then:
curl -s -X POST "http://localhost:8080/admin/realms/military-lms/users/$UID/role-mappings/realm" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '[{"id":"<role_id>","name":"<role_name>"}]'
```

## Backup & Restore

### Full Keycloak Backup (via DB)
```bash
docker exec lms-qaf-keycloak-db pg_dump -U keycloak -d keycloak > keycloak-db-backup.sql
```

### Full Keycloak Restore (via DB)
```bash
docker exec -i lms-qaf-keycloak-db psql -U keycloak -d keycloak < keycloak-db-backup.sql
docker restart lms-qaf-keycloak
```

## Troubleshooting
- **Cannot login:** verify realm is active, user is enabled, password correct
- **Duplicate users:** search by exact email, delete duplicates via Admin API
- **Token expired:** re-run the token command
- **Container won't start:** `docker logs lms-qaf-keycloak` — check DB connection
- **Slow login:** check Keycloak cache (Redis) and DB performance
- **Import fails:** Keycloak partial-import API or manual setup via Admin Console
