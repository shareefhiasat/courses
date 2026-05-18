#!/bin/bash
set -euo pipefail

KC_URL="http://localhost:8080"
KC_REALM="military-lms"
KC_CLIENT="military-lms-app"
KC_ADMIN="admin"
KC_PASS="admin123"

cmd=${1:-status}

get_token() {
  curl -s -X POST "$KC_URL/realms/master/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "client_id=admin-cli" \
    -d "username=$KC_ADMIN" \
    -d "password=$KC_PASS" \
    -d "grant_type=password" | python3 -c "import json,sys; print(json.load(sys.stdin).get('access_token',''))"
}

case "$cmd" in
  status|health)
    echo "Checking Keycloak health..."
    curl -s "$KC_URL/realms/master" | python3 -c "import json,sys; d=json.load(sys.stdin); print(f\"Realm: {d.get('realm','unknown')}\"); print(f\"Enabled: {d.get('enabled',False)}\")"
    ;;
  users)
    token=$(get_token)
    curl -s "$KC_URL/admin/realms/$KC_REALM/users" \
      -H "Authorization: Bearer $token" |
      python3 -c "import json,sys; users=json.load(sys.stdin); [print(f'{u[\"username\"]:30} {u.get(\"email\",\"\"):35} {u.get(\"firstName\",\"\"):20} enabled={u.get(\"enabled\",True)}') for u in users]; print(f'Total: {len(users)} users')"
    ;;
  user-get)
    token=$(get_token)
    shift
    user="$1"
    curl -s "$KC_URL/admin/realms/$KC_REALM/users?search=$user" \
      -H "Authorization: Bearer $token" |
      python3 -c "import json,sys; users=json.load(sys.stdin); [print(json.dumps(u,indent=2)) for u in users]; print(f'Found: {len(users)} users')"
    ;;
  user-create)
    token=$(get_token)
    shift
    username="$1"; email="$2"; first="$3"; last="$4"; pass="${5:-Password123}"
    curl -s -X POST "$KC_URL/admin/realms/$KC_REALM/users" \
      -H "Authorization: Bearer $token" \
      -H "Content-Type: application/json" \
      -d "{\"username\":\"$username\",\"email\":\"$email\",\"firstName\":\"$first\",\"lastName\":\"$last\",\"enabled\":true,\"credentials\":[{\"type\":\"password\",\"value\":\"$pass\",\"temporary\":false}]}"
    echo "User created: $username"
    ;;
  user-reset-pw)
    token=$(get_token)
    shift
    user="$1"; pass="${2:-Password123}"
    uid=$(curl -s "$KC_URL/admin/realms/$KC_REALM/users?search=$user" \
      -H "Authorization: Bearer $token" |
      python3 -c "import json,sys; users=json.load(sys.stdin); print(users[0]['id'] if users else '')")
    if [ -z "$uid" ]; then echo "User not found"; exit 1; fi
    curl -s -X PUT "$KC_URL/admin/realms/$KC_REALM/users/$uid/reset-password" \
      -H "Authorization: Bearer $token" \
      -H "Content-Type: application/json" \
      -d "{\"type\":\"password\",\"value\":\"$pass\",\"temporary\":false}"
    echo "Password reset for $user"
    ;;
  clients)
    token=$(get_token)
    curl -s "$KC_URL/admin/realms/$KC_REALM/clients" \
      -H "Authorization: Bearer $token" |
      python3 -c "import json,sys; clients=json.load(sys.stdin); [print(f'{c[\"clientId\"]:40} enabled={c.get(\"enabled\",True)}') for c in clients]"
    ;;
  realm-export|backup)
    token=$(get_token)
    shift
    out="${1:-keycloak-realm-export.json}"
    curl -s "$KC_URL/admin/realms/$KC_REALM" \
      -H "Authorization: Bearer $token" > "$out"
    echo "Exported realm to: $out"
    ;;
  realm-import|restore)
    shift
    file="$1"
    if [ ! -f "$file" ]; then echo "Error: File not found: $file"; exit 1; fi
    echo "Keycloak import requires manual setup via Admin Console or partial-import API."
    echo "For full restore, re-import the realm via Keycloak Admin Console:"
    echo "  $KC_URL/admin/master/console/#/$KC_REALM/realm-settings"
    echo "Or use the Keycloak database backup/restore procedure."
    ;;
  *)
    echo "Usage: $0 {status|users|user-get|user-create|user-reset-pw|clients|realm-export|realm-import}"
    echo ""
    echo "  status        - Check if Keycloak is running"
    echo "  users         - List all users in $KC_REALM realm"
    echo "  user-get      - Search user: $0 user-get username"
    echo "  user-create   - Create user: $0 user-create username email first last [password]"
    echo "  user-reset-pw - Reset password: $0 user-reset-pw username [newpass]"
    echo "  clients       - List all clients in $KC_REALM realm"
    echo "  realm-export  - Export realm config to file"
    echo "  realm-import  - Instructions for importing realm"
    exit 1
    ;;
esac
