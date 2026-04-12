# 🔧 Integrate with Existing Keycloak Setup

## 📋 **SITUATION**

You already have Keycloak running in your Docker stack at `E:/QAF/Github/courses/scripts/docker/docker-compose.dev.yml`. Let's integrate the Military LMS realm configuration with your existing setup.

---

## 🎯 **INTEGRATION STEPS**

### **Step 1: Update Your Existing Docker Compose**

Add the realm import to your existing Keycloak service:

```yaml
# In your docker-compose.dev.yml
keycloak:
  image: quay.io/keycloak/keycloak:26.0
  container_name: lms-qaf-keycloak
  restart: unless-stopped
  ports:
    - "8080:8080"
  environment:
    - KEYCLOAK_ADMIN=admin
    - KEYCLOAK_ADMIN_PASSWORD=admin
    # Add these lines for realm import
    - KC_FEATURES=preview
    - KC_HTTP_ENABLED=true
  volumes:
    # Add this volume for realm import
    - ./keycloak/realm-military-lms.json:/opt/keycloak/data/import/realm-military-lms.json
  command:
    - start-dev
    - --import-realm
```

### **Step 2: Copy Realm File to Your Docker Directory**

```bash
# Copy the realm file to your scripts/docker directory
cp client/keycloak/realm-military-lms.json scripts/docker/
```

### **Step 3: Restart Keycloak to Import Realm**

```bash
# Navigate to your docker directory
cd scripts/docker

# Stop and restart Keycloak with import
docker-compose stop keycloak
docker-compose up -d keycloak
```

---

## 🔄 **RESTART KEYCLOAK PROPERLY**

### **Option 1: Full Restart (Recommended)**
```bash
cd scripts/docker
docker-compose down keycloak
docker-compose up -d keycloak
```

### **Option 2: Force Reimport**
```bash
# Remove existing realm first (if it exists)
docker exec lms-qaf-keycloak kc.sh delete-realm military-lms

# Restart with import
docker-compose restart keycloak
```

### **Option 3: Manual Import (If Auto Import Fails)**
```bash
# Get admin token
TOKEN=$(curl -X POST http://localhost:8080/realms/master/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&username=admin&password=admin&client_id=admin-cli" | jq -r .access_token)

# Import realm manually
curl -X POST http://localhost:8080/admin/realms \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @realm-military-lms.json
```

---

## 🔍 **VERIFY IMPORT**

### **Check Realm Exists**
```bash
curl http://localhost:8080/realms/military-lms/.well-known/openid-configuration
```

### **Check Admin Console**
1. Go to: `http://localhost:8080/admin`
2. Login: `admin` / `admin`
3. Select realm: `military-lms`
4. Verify:
   - ✅ Realm exists
   - ✅ 5 roles created
   - ✅ `military-lms-app` client exists
   - ✅ Super admin user exists

### **Test Super Admin Login**
```bash
curl -X POST http://localhost:8080/realms/military-lms/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&username=shareef.hiasat@gmail.com&password=Test123@&client_id=military-lms-app&client_secret=military-lms-secret-change-me"
```

---

## 📁 **FILES TO COPY**

### **Copy These Files to Your Docker Directory**
```bash
# From: client/keycloak/
# To: scripts/docker/

cp client/keycloak/realm-military-lms.json scripts/docker/
```

### **Updated Environment Variables**
Create/update `.env` in your scripts/docker directory:
```env
# Keycloak Configuration
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=admin

# React App (for frontend)
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=military-lms
VITE_KEYCLOAK_CLIENT_ID=military-lms-app
```

---

## 🚨 **TROUBLESHOOTING**

### **Import Failed**
```bash
# Check Keycloak logs
docker logs lms-qaf-keycloak

# Check realm file syntax
cat scripts/docker/realm-military-lms.json | jq .

# Try manual import
curl -X POST http://localhost:8080/admin/realms \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @realm-military-lms.json
```

### **Port Conflicts**
```bash
# Check what's running on port 8080
netstat -ano | findstr 8080

# Kill conflicting processes if needed
taskkill /F /PID <PID>
```

### **Realm Already Exists**
```bash
# Delete existing realm
TOKEN=$(curl -s -X POST http://localhost:8080/realms/master/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&username=admin&password=admin&client_id=admin-cli" | jq -r .access_token)

curl -X DELETE http://localhost:8080/admin/realms/military-lms \
  -H "Authorization: Bearer $TOKEN"

# Restart Keycloak
docker-compose restart keycloak
```

---

## 🎯 **AFTER SUCCESSFUL IMPORT**

### **Update Your React App**
```env
# In your client/.env
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=military-lms
VITE_KEYCLOAK_CLIENT_ID=military-lms-app
```

### **Test Integration**
1. Start your React app: `npm run dev` (should be on port 5174)
2. Go to login page
3. Should redirect to Keycloak
4. Login with: `shareef.hiasat@gmail.com` / `Test123@`
5. Should redirect back to app with JWT token

---

## 📋 **FINAL CHECKLIST**

- [ ] Copied `realm-military-lms.json` to `scripts/docker/`
- [ ] Updated `docker-compose.dev.yml` with import configuration
- [ ] Restarted Keycloak with import
- [ ] Verified realm exists in admin console
- [ ] Tested super admin login
- [ ] Updated React app environment variables
- [ ] Tested full authentication flow

---

**🎉 Your existing Keycloak setup is now integrated with Military LMS!**
