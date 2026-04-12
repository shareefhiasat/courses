# 🔐 Keycloak JWT Token Guide

> **How to get JWT tokens and use Keycloak REST API**
>
> **Based on working examples from `rest-api.http`**

---

## 🎯 **Quick Overview**

### **Two Types of Tokens:**
1. **Admin Token** - For Keycloak admin operations
2. **User Token** - For application authentication

### **Keycloak URLs:**
- **Admin Console**: http://localhost:8080/admin
- **Military LMS Realm**: http://localhost:8080/realms/military-lms
- **Token Endpoint**: http://localhost:8080/realms/{realm}/protocol/openid-connect/token

---

## 🔑 **Get Admin Token (For Admin Operations)**

### **Method 1: Using curl**
```bash
curl -X POST "http://localhost:8080/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&username=admin&password=admin123&client_id=admin-cli"
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600,
  "refresh_expires_in": 1800,
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "not-before-policy": 0,
  "session_state": "abc123",
  "scope": "email profile"
}
```

### **Method 2: Using IntelliJ HTTP Requests** (`rest-api.http`)
```http
### 📋 GET ADMIN TOKEN
POST http://localhost:8080/realms/master/protocol/openid-connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=password&username=admin&password=admin123&client_id=admin-cli

> {%
  client.global.set("admin_token", response.body.access_token);
  client.log("Admin token: " + response.body.access_token);
%}
```

---

## 👤 **Get User Token (For Application Authentication)**

### **Method 1: Using curl**
```bash
curl -X POST "http://localhost:8080/realms/military-lms/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&username=shareef.hiasat@gmail.com&password=Test123@&client_id=military-lms-app"
```

### **Method 2: Using HTTP Requests**
```http
### 🧪 TEST SUPER ADMIN LOGIN
POST http://localhost:8080/realms/military-lms/protocol/openid-connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=password&username=shareef.hiasat@gmail.com&password=Test123@&client_id=military-lms-app

> {%
  client.global.set("super_admin_token", response.body.access_token);
  client.log("Super admin token: " + response.body.access_token);
%}
```

**User Token Response:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600,
  "refresh_expires_in": 1800,
  "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "not-before-policy": 0,
  "session_state": "def456",
  "scope": "openid email profile roles",
  "resource_access": {
    "military-lms-app": {
      "roles": [
        "super-admin",
        "admin",
        "instructor"
      ]
    }
  }
}
```

---

## 🔧 **Using Tokens for API Calls**

### **Admin API Examples**

#### **List All Realms**
```bash
curl -X GET "http://localhost:8080/admin/realms" \
  -H "Authorization: Bearer {admin_token}"
```

#### **Delete Existing Realm**
```bash
curl -X DELETE "http://localhost:8080/admin/realms/military-lms" \
  -H "Authorization: Bearer {admin_token}"
```

#### **Import New Realm**
```bash
curl -X POST "http://localhost:8080/admin/realms" \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d @realm-military-lms.json
```

#### **List Users in Realm**
```bash
curl -X GET "http://localhost:8080/admin/realms/military-lms/users" \
  -H "Authorization: Bearer {admin_token}"
```

### **User API Examples**

#### **Get User Info**
```bash
curl -X GET "http://localhost:8080/realms/military-lms/protocol/openid-connect/userinfo" \
  -H "Authorization: Bearer {user_token}"
```

**User Info Response:**
```json
{
  "sub": "12345678-1234-1234-1234-123456789012",
  "email_verified": true,
  "roles": [
    "super-admin",
    "admin",
    "instructor"
  ],
  "preferred_username": "shareef.hiasat@gmail.com",
  "email": "shareef.hiasat@gmail.com",
  "given_name": "Shareef",
  "family_name": "Hiasat"
}
```

---

## 🛠️ **Complete Setup Script Example**

### **Shell Script** (`setup-realm.sh`)
```bash
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

# Delete existing realm
echo "Deleting existing military-lms realm..."
curl -s -X DELETE "http://localhost:8080/admin/realms/military-lms" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Import new realm
echo "Importing new realm configuration..."
curl -s -X POST "http://localhost:8080/admin/realms" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d @realm-military-lms.json

echo "Realm setup complete!"
```

### **PowerShell Script** (`import-realm.ps1`)
```powershell
# Wait for Keycloak
Write-Host "Waiting for Keycloak..."
do {
    Start-Sleep -Seconds 2
} until ((Invoke-WebRequest -Uri "http://localhost:8080/health" -UseBasicParsing).StatusCode -eq 200)

# Get admin token
$tokenResponse = Invoke-RestMethod -Uri "http://localhost:8080/realms/master/protocol/openid-connect/token" `
    -Method POST `
    -ContentType "application/x-www-form-urlencoded" `
    -Body "grant_type=password&username=admin&password=admin123&client_id=admin-cli"

$adminToken = $tokenResponse.access_token

# Delete existing realm
try {
    Invoke-RestMethod -Uri "http://localhost:8080/admin/realms/military-lms" `
        -Method DELETE `
        -Headers @{Authorization = "Bearer $adminToken"}
} catch {
    Write-Host "Realm doesn't exist or already deleted"
}

# Import new realm
$realmJson = Get-Content -Path "realm-military-lms.json" -Raw
Invoke-RestMethod -Uri "http://localhost:8080/admin/realms" `
    -Method POST `
    -ContentType "application/json" `
    -Headers @{Authorization = "Bearer $adminToken"} `
    -Body $realmJson

Write-Host "Realm setup complete!"
```

---

## 🔍 **Decode JWT Tokens**

### **Online Tool**
1. Copy the `access_token` from any response
2. Go to: https://jwt.io
3. Paste the token
4. View decoded contents

### **What You'll See in User Token**
```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT",
    "kid": "key-id"
  },
  "payload": {
    "exp": 1640995200,
    "iat": 1640991600,
    "auth_time": 1640991600,
    "jti": "token-id",
    "iss": "http://localhost:8080/realms/military-lms",
    "aud": "military-lms-app",
    "sub": "user-id",
    "typ": "Bearer",
    "azp": "military-lms-app",
    "session_state": "session-id",
    "acr": "1",
    "allowed-origins": [
      "http://localhost:5174"
    ],
    "resource_access": {
      "military-lms-app": {
        "roles": [
          "super-admin",
          "admin",
          "instructor"
        ]
      }
    },
    "scope": "openid email profile roles",
    "email_verified": true,
    "preferred_username": "shareef.hiasat@gmail.com",
    "email": "shareef.hiasat@gmail.com",
    "given_name": "Shareef",
    "family_name": "Hiasat"
  }
}
```

---

## 🎯 **Common Use Cases**

### **1. Test Authentication in Application**
```javascript
// Get token for API testing
const response = await fetch('http://localhost:8080/realms/military-lms/protocol/openid-connect/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: 'grant_type=password&username=shareef.hiasat@gmail.com&password=Jordan123$&client_id=military-lms-app'
});

const { access_token } = await response.json();

// Use token for API calls
const userResponse = await fetch('http://localhost:5174/api/user', {
  headers: {
    'Authorization': `Bearer ${access_token}`
  }
});
```

### **2. Setup Realm for Testing**
```bash
# Run the setup script
cd E:\QAF\Github\courses\scripts\docker\keycloak
./setup-realm.sh

# Or use PowerShell
./import-realm.ps1
```

### **3. Verify Realm Configuration**
```bash
# Check realm exists
curl http://localhost:8080/realms/military-lms/.well-known/openid-configuration

# Check user can login
curl -X POST "http://localhost:8080/realms/military-lms/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&username=shareef.hiasat@gmail.com&password=Jordan123$&client_id=military-lms-app"
```

---

## 🚨 **Troubleshooting**

### **Token Not Working**
- **Check token expiration**: Tokens expire in 1 hour
- **Check realm name**: Ensure using correct realm (`military-lms`)
- **Check client ID**: Use correct client (`military-lms-app`)
- **Check credentials**: Verify username/password

### **Admin Operations Failing**
- **Check admin token**: Get fresh admin token
- **Check permissions**: Admin token has full permissions
- **Check realm exists**: Create realm if missing

### **User Login Failing**
- **Check user exists**: User must be in realm
- **Check password**: Use correct password
- **Check client**: Client must be configured correctly

---

## 📚 **File References**

### **Key Files**
- **`rest-api.http`** - All API examples (IntelliJ HTTP Client)
- **`setup-realm.sh`** - Shell script for realm setup
- **`import-realm.ps1`** - PowerShell script for realm setup
- **`realm-military-lms.json`** - Realm configuration
- **`KEYCLOAK_SETUP.md`** - Complete setup documentation

### **Quick Commands**
```bash
# Get admin token
curl -X POST "http://localhost:8080/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&username=admin&password=admin123&client_id=admin-cli"

# Get user token
curl -X POST "http://localhost:8080/realms/military-lms/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&username=shareef.hiasat@gmail.com&password=Jordan123$&client_id=military-lms-app"

# Setup realm
cd E:\QAF\Github\courses\scripts\docker\keycloak
./setup-realm.sh
```

---

**🎉 Ready to use Keycloak JWT tokens!**

*All examples are tested and working. Use `rest-api.http` in IntelliJ for easy testing!*
