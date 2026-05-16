#!/bin/bash

# Wait for Keycloak to be ready
echo "Waiting for Keycloak to start..."
while ! curl -s http://localhost:8080/health > /dev/null; do
  sleep 2
done

echo "Keycloak is ready. Setting up realm..."

# Get admin token
ADMIN_TOKEN=$(curl -s -X POST "http://localhost:8080/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&username=admin&password=admin123&client_id=admin-cli" | \
  jq -r '.access_token')

if [ "$ADMIN_TOKEN" == "null" ]; then
  echo "Failed to get admin token"
  exit 1
fi

echo "Admin token obtained successfully"

# Delete existing realm if it exists
echo "Deleting existing military-lms realm..."
curl -s -X DELETE "http://localhost:8080/admin/realms/military-lms" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json"

# Wait a moment for deletion to complete
sleep 2

# Create minimal realm first (more reliable than full import)
echo "Creating minimal military-lms realm..."
MINIMAL_REALM='{
  "id": "military-lms",
  "realm": "military-lms",
  "displayName": "Military LMS",
  "enabled": true,
  "registrationAllowed": true,
  "resetPasswordAllowed": true,
  "rememberMe": true,
  "loginWithEmailAllowed": true,
  "sslRequired": "none",
  "accessTokenLifespan": 1800,
  "accessTokenLifespanForImplicitFlow": 1800,
  "ssoSessionIdleTimeout": 3600,
  "ssoSessionMaxLifespan": 28800,
  "clientSessionIdleTimeout": 3600,
  "clientSessionMaxLifespan": 28800,
  "offlineSessionIdleTimeout": 2592000,
  "offlineSessionMaxLifespan": 5184000,
  "refreshTokenMaxReuse": 0,
  "revokeRefreshToken": false
}'

curl -s -X POST "http://localhost:8080/admin/realms" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$MINIMAL_REALM"

echo "Minimal realm created"

# Wait for realm to be ready
sleep 3

# Create the client
echo "Creating military-lms-app client..."
CLIENT_CONFIG='{
  "clientId": "military-lms-app",
  "name": "Military LMS Application",
  "description": "Military LMS Frontend Application",
  "enabled": true,
  "clientAuthenticatorType": "client-secret",
  "redirectUris": [
    "https://localhost:5174/*",
    "https://localhost:5174/login*",
    "https://localhost:5174/silent-check-sso.html",
    "http://localhost:5174/*",
    "http://localhost:5174/login*",
    "http://localhost:5174/silent-check-sso.html"
  ],
  "webOrigins": [
    "https://localhost:5174",
    "http://localhost:5174"
  ],
  "adminUrl": "https://localhost:5174",
  "rootUrl": "https://localhost:5174",
  "baseUrl": "https://localhost:5174",
  "publicClient": true,
  "standardFlowEnabled": true,
  "implicitFlowEnabled": false,
  "directAccessGrantsEnabled": true,
  "serviceAccountsEnabled": false,
  "authorizationServicesEnabled": false,
  "attributes": {
    "access.token.lifespan": "1800"
  }
}'

curl -s -X POST "http://localhost:8080/admin/realms/military-lms/clients" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$CLIENT_CONFIG"

echo "Client created"

# Get client ID
echo "Getting client ID..."
CLIENT_ID=$(curl -s -X GET "http://localhost:8080/admin/realms/military-lms/clients?clientId=military-lms-app" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.[0].id')

echo "Adding offline_access to default client scopes..."
# Get the offline_access scope ID
OFFLINE_SCOPE_ID=$(curl -s -X GET "http://localhost:8080/admin/realms/military-lms/client-scopes?search=offline_access" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.[0].id')

if [ "$OFFLINE_SCOPE_ID" != "null" ] && [ -n "$OFFLINE_SCOPE_ID" ]; then
  # Add offline_access to default client scopes using the correct endpoint
  curl -s -X POST "http://localhost:8080/admin/realms/military-lms/clients/$CLIENT_ID/default-client-scopes/$OFFLINE_SCOPE_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json"
  echo "Offline access scope added to default client scopes"
else
  echo "Warning: offline_access scope not found, skipping..."
fi

# Create super admin user
echo "Creating super admin user..."
USER_CONFIG='{
  "username": "shareef.hiasat@gmail.com",
  "enabled": true,
  "email": "shareef.hiasat@gmail.com",
  "firstName": "Shareef",
  "lastName": "Hiasat",
  "emailVerified": true,
  "credentials": [
    {
      "type": "password",
      "value": "Test123@",
      "temporary": false
    }
  ]
}'

curl -s -X POST "http://localhost:8080/admin/realms/military-lms/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$USER_CONFIG"

echo "Super admin user created"

# Create roles
echo "Creating roles..."
ROLES=(
  '{"name":"super_admin","description":"Super Administrator with full system access","composite":false,"clientRole":false,"containerId":"military-lms"}'
  '{"name":"admin","description":"Administrator with limited access","composite":false,"clientRole":false,"containerId":"military-lms"}'
  '{"name":"hr","description":"HR Manager","composite":false,"clientRole":false,"containerId":"military-lms"}'
  '{"name":"instructor","description":"Instructor/Teacher","composite":false,"clientRole":false,"containerId":"military-lms"}'
  '{"name":"student","description":"Student","composite":false,"clientRole":false,"containerId":"military-lms"}'
)

for role in "${ROLES[@]}"; do
  curl -s -X POST "http://localhost:8080/admin/realms/military-lms/roles" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$role"
done

echo "Roles created"

# Wait for user and roles to be ready
sleep 2

# Get user ID and assign super_admin role
echo "Assigning super_admin role to user..."
USER_ID=$(curl -s -X GET "http://localhost:8080/admin/realms/military-lms/users?username=shareef.hiasat@gmail.com" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.[0].id')

ROLE_ID=$(curl -s -X GET "http://localhost:8080/admin/realms/military-lms/roles/super_admin" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.id')

# Assign role to user
curl -s -X POST "http://localhost:8080/admin/realms/military-lms/users/$USER_ID/role-mappings/realm" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "[{\"id\":\"$ROLE_ID\",\"name\":\"super_admin\"}]"

echo "Super admin role assigned to user"

# Also assign instructor role (required)
echo "Assigning instructor role to user..."
INSTRUCTOR_ROLE_ID=$(curl -s -X GET "http://localhost:8080/admin/realms/military-lms/roles/instructor" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.id')

curl -s -X POST "http://localhost:8080/admin/realms/military-lms/users/$USER_ID/role-mappings/realm" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "[{\"id\":\"$INSTRUCTOR_ROLE_ID\",\"name\":\"instructor\"}]"

echo "Instructor role assigned to user"

# Verify setup
echo "Verifying realm setup..."
curl -s "http://localhost:8080/realms/military-lms/.well-known/openid-configuration" > /dev/null
if [ $? -eq 0 ]; then
  echo "✅ Realm setup complete and verified!"
  echo "📋 Login credentials:"
  echo "   Email: shareef.hiasat@gmail.com"
  echo "   Password: Test123@"
  echo "   Client ID: military-lms-app"
else
  echo "❌ Realm setup failed"
  exit 1
fi
