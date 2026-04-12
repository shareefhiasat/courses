# 🔐 Keycloak Setup - Military LMS

## 📁 **FOLDER STRUCTURE**

```
E:\QAF\Github\courses\scripts\docker\keycloak\
├── realm-military-lms.json    # Complete realm configuration
├── rest-api.http              # IntelliJ HTTP requests for setup
├── import-realm.ps1           # PowerShell import script
└── README.md                  # This documentation
```

---

## 🚀 **QUICK START**

### **Option 1: IntelliJ HTTP Requests (Recommended)**
1. Open `rest-api.http` in IntelliJ
2. Run requests in order:
   - GET ADMIN TOKEN
   - DELETE EXISTING REALM
   - CREATE MINIMAL REALM
   - CREATE CLIENT (SPA / Public Client)
   - CREATE SUPER ADMIN USER
   - CREATE ROLES
   - ASSIGN ROLES (super_admin + instructor)
   - VERIFY REALM EXISTS
   - TEST SUPER ADMIN LOGIN

### **Option 2: PowerShell Script**
```powershell
cd E:\QAF\Github\courses\scripts\docker\keycloak
.\import-realm.ps1
```

---

## 📋 **CONFIGURATION DETAILS**

### **Realm: military-lms**
- Display name: "Military LMS"
- Registration enabled
- Password reset enabled
- Email verification enabled

### **Roles (5)**
- `super_admin` - Full system access
- `admin` - Administrative access
- `hr` - HR and reporting access
- `instructor` - Class management access
- `student` - Learning access

### **Client: military-lms-app**
- Client ID: `military-lms-app`
- Redirect URIs: `http://localhost:5174/*`, `http://localhost:4001/*`
- **Type**: SPA / Public Client (Authorization Code + PKCE)
- Standard flow enabled
- Direct access grants enabled (optional; used for password-grant testing)

### **Super Admin User**
- Email: `shareef.hiasat@gmail.com`
- Password: `Test123@`
- Roles: `super_admin`, `instructor`

---

## 🔧 **AFTER SETUP**

### **React App Environment**
```env
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=military-lms
VITE_KEYCLOAK_CLIENT_ID=military-lms-app
```

### **Test URLs**
- Admin Console: `http://localhost:8080/admin`
- Login URL: `http://localhost:8080/realms/military-lms/protocol/openid-connect/auth`
- OIDC Config: `http://localhost:8080/realms/military-lms/.well-known/openid-configuration`

---

## 🎯 **NEXT STEPS**

1. ✅ Run the setup (HTTP requests or PowerShell)
2. ✅ Verify realm exists in admin console
3. ✅ Test super admin login
4. 🔄 Update React app with Keycloak integration
5. 🔄 Secure GraphQL API with JWT verification

---

**🎉 All Keycloak files organized in one place!**
