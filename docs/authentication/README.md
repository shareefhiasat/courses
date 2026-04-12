# 🔐 Authentication Documentation

> **Authentication setup and configuration for Military LMS**
>
> **Docusaurus Source of Truth for Authentication**

---

## 📁 **Authentication Resources**

### **🔑 Keycloak Setup**
- **[keycloak-setup.md](./keycloak-setup.md)** - Complete Keycloak configuration
- **[keycloak-nextcloud-acl.md](./keycloak-nextcloud-acl.md)** - Role-to-group ACL sync between Keycloak and Nextcloud

---

## 🎯 **Authentication Overview**

### **Keycloak Configuration**
- **URL**: http://localhost:8080
- **Realm**: military-lms
- **Admin Console**: http://localhost:8080/admin
- **Admin Credentials**: admin/admin123

### **Super Admin Access**
- **Email**: shareef.hiasat@gmail.com
- **Password**: Jordan123$
- **Roles**: super-admin, admin, instructor

---

## 🚀 **Authentication Setup**

### **Keycloak Admin Console**
```bash
# Access Keycloak admin
http://localhost:8080/admin

# Login with admin credentials
Username: admin
Password: admin123
```

### **Realm Configuration**
- **Realm Name**: military-lms
- **Enabled**: true
- **SSL Required**: none (development)

### **Client Configuration**
- **Client ID**: military-lms-app
- **Client Protocol**: openid-connect
- **Access Type**: confidential
- **Standard Flow Enabled**: true
- **Direct Access Grants Enabled**: true

---

## 🔧 **Environment Variables**

### **Client Configuration**
```env
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=military-lms
VITE_KEYCLOAK_CLIENT_ID=military-lms-app
```

### **Server Configuration**
```env
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=military-lms
KEYCLOAK_CLIENT_ID=military-lms-app
KEYCLOAK_CLIENT_SECRET=your-client-secret
```

---

## 🚨 **Troubleshooting**

### **Keycloak Issues**
```bash
# Check Keycloak logs
docker logs lms-keycloak

# Restart Keycloak
docker-compose restart keycloak

# Check health
curl http://localhost:8080/health
```

### **Authentication Issues**
```bash
# Test Keycloak endpoint
curl http://localhost:8080/realms/military-lms/.well-known/openid_configuration

# Check token endpoint
curl -X POST http://localhost:8080/realms/military-lms/protocol/openid-connect/token \
  -d "grant_type=password&client_id=military-lms-app&username=admin&password=admin123"
```

---

## 📋 **Authentication Checklist**

- [ ] Keycloak server running
- [ ] Realm configured
- [ ] Clients created
- [ ] Users created
- [ ] Roles assigned
- [ ] Frontend authentication working
- [ ] Service-layer authentication working

---

## 🔐 **Security Best Practices**

### **Development Environment**
- Use self-signed certificates only for development
- Keep admin credentials secure
- Use strong passwords for production

### **Production Environment**
- Enable SSL/TLS
- Use secure client secrets
- Implement proper token management
- Enable rate limiting

---

## 📞 **Support**

### **Getting Help**
1. Check Keycloak admin console
2. Review keycloak-setup.md
3. Check service logs
4. Verify environment configuration

---

*Last Updated: 2026-03-21*
*Docusaurus Source of Truth for Authentication*
