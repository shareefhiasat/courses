# 🚀 Setup Documentation

> **Complete setup guides and scripts for Military LMS**
>
> **Docusaurus Source of Truth for Setup**

---

## 📁 **Setup Resources**

### **📖 Setup Guides**
- Setup process documentation and guides

### **🔗 Related Documentation**
- **[devops/](../devops/)** - DevOps setup and monitoring
- **[database/](../database/)** - Database configuration and scripts
- **[authentication/](../authentication/)** - Authentication configuration

---

## 🎯 **Quick Setup**

### **1. Infrastructure Setup**
```powershell
# Start all services (MongoDB, Keycloak, ELK, Grafana)
cd E:\QAF\Github\courses
.\scripts\dev-start.ps1
```

### **2. Database Setup**
```powershell
# Clean database (from docs/database)
cd docs/database
node clean-database.cjs

# Setup with Prisma
cd ../../client
npx prisma db push
npx prisma generate

# Create super admin (from docs/database)
cd ../docs/database
node verify-super-admin.cjs
```

### **3. Access Services**
| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | https://localhost:5174 | Keycloak login |
| **GraphQL** | http://localhost:4001/graphql | - |
| **MongoDB** | localhost:27017 | admin/admin123 |
| **Keycloak** | http://localhost:8080 | admin/admin123 |
| **Kibana** | http://localhost:5601 | - |
| **Grafana** | http://localhost:3002 | admin/admin123 |

---

## 🗄️ **Database Setup**

### **MongoDB Replica Set**
```env
DATABASE_URL="mongodb://admin:admin123@localhost:27017/lms_dev?authSource=admin&replicaSet=rs0"
```

### **Key Collections**
- `users` - User management
- `programs` - Academic programs
- `subjects` - Course subjects
- `classes` - Individual classes
- `activities` - Learning activities
- `quizzes` - Assessments
- `attendance` - Attendance tracking
- `announcements` - Course announcements

### **Database Scripts**
| Script | Purpose | Command |
|--------|---------|---------|
| `clean-database.cjs` | Clean database while preserving users | `node clean-database.cjs` |
| `verify-super-admin.cjs` | Verify/create super admin user | `node verify-super-admin.cjs` |

---

## 📊 **Monitoring Stack**

### **ELK Stack**
- **Elasticsearch**: Log storage and search
- **Logstash**: Log processing pipeline
- **Kibana**: Log visualization
- **Access**: http://localhost:5601
- **Index Pattern**: `lms-logs-*`

### **Grafana**
- **Metrics**: System and application metrics
- **Access**: http://localhost:3002
- **Credentials**: admin/admin123
- **Datasources**: Prometheus, Elasticsearch

---

## 🔐 **Authentication Setup**

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

## 🚨 **Troubleshooting**

### **MongoDB Issues**
```bash
# Check replica set status
docker exec lms-mongodb mongosh --eval "rs.status()"

# Restart MongoDB
docker-compose restart mongodb
```

### **Keycloak Issues**
```bash
# Check Keycloak logs
docker logs lms-keycloak

# Restart Keycloak
docker-compose restart keycloak
```

### **Database Connection Issues**
```bash
# Test connection
node clean-database.cjs

# Verify super admin
node verify-super-admin.cjs
```

---

## 📋 **Setup Checklist**

- [ ] All Docker services running
- [ ] MongoDB replica set initialized
- [ ] Prisma schema synced with database
- [ ] Super admin user created
- [ ] Keycloak authentication working
- [ ] Monitoring stack accessible
- [ ] Frontend loads without errors

---

## 🔄 **Migration Process**

### **From Firebase to MongoDB**
1. **Backup existing data** from Firebase
2. **Setup MongoDB replica set** using monitoring-stack guide
3. **Run migration scripts** from migration-plan
4. **Verify data integrity** with test scripts
5. **Update application configuration**

### **Environment Variables**
```env
# Database
DATABASE_URL="mongodb://admin:admin123@localhost:27017/lms_dev?authSource=admin&replicaSet=rs0"

# Keycloak
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=military-lms
VITE_KEYCLOAK_CLIENT_ID=military-lms-app

# GraphQL
VITE_GRAPHQL_URL=http://localhost:4001/graphql
```

---

## 📞 **Support**

### **Getting Help**
1. Check relevant setup guide in this folder
2. Review troubleshooting section
3. Check service logs: `docker-compose logs -f [service]`
4. Verify environment configuration
5. Test with setup scripts

### **Documentation Structure**
- **Setup Guides**: Step-by-step setup instructions
- **Setup Scripts**: Automated setup and verification
- **Migration**: System migration documentation
- **Monitoring**: Infrastructure monitoring setup

---

*Last Updated: 2026-03-21*
*Docusaurus Source of Truth for Setup*
