# 🚀 Scripts & Operations

> **System scripts and operational procedures**

---

## 🚀 **Quick Start**

```bash
# Start all services
.\dev-start.ps1

# Access application
http://localhost:5173

# Login credentials
Email: shareef.hiasat@gmail.com
Password: Jordan123$
```

---

## 📁 **Available Scripts**

### **🗄️ Database Scripts**
Located in `database/` folder
- PostgreSQL management
- Prisma schema operations
- Data backup and restore

### **🐳 Docker Scripts**
Located in `docker/` folder
- Service management
- Configuration files
- Development environment

### **💻 Client Scripts**
- Development server startup
- Build and test scripts
- Deployment procedures

---

## 🛠️ **Common Operations**

### **Start Services**
```bash
# Start all services
.\dev-start.ps1

# Start specific services
docker-compose -f docker/docker-compose.dev.yml up -d keycloak-db keycloak
```

### **Database Operations**
```bash
cd ../client
npx prisma db push --schema prisma/schema.postgres.prisma
npx prisma generate
```

### **Application Operations**
```bash
cd ../client
npm start          # Development server
npm run build      # Production build
npm test           # Run tests
```

---

## 📊 **Service Status**

| Service | Port | Purpose |
|---------|------|---------|
| Frontend | 5173 | React application |
| PostgreSQL | 5432 | Main database |
| Keycloak | 8080 | Authentication |

---

## 🔧 **Configuration**

### **Environment Variables**
```env
# Database (../client/.env)
DATABASE_URL="postgresql://military_lms:military_lms123@localhost:5432/military_lms"
```

### **Docker Configuration**
- **Main Config**: `docker/docker-compose.dev.yml`
- **Environment**: Development optimized
- **Network**: Service communication

---

## 📋 **Maintenance**

### **Daily Checks**
- [ ] Service health status
- [ ] Database connection
- [ ] Application accessibility

### **Troubleshooting**
```bash
# Check services
docker-compose -f docker/docker-compose.dev.yml ps

# Restart services
docker-compose -f docker/docker-compose.dev.yml restart

# View logs
docker-compose -f docker/docker-compose.dev.yml logs
```

---

## 📞 **Support**

### **Documentation**
- **Complete Guide**: `../docs/operations/README.md`
- **Main Documentation**: `../docs/README.md`

### **Emergency Contact**
- **System Admin**: shareef.hiasat@gmail.com

---

*For detailed operations guide, see [docs/operations/README.md](../docs/operations/README.md)*

*Last Updated: 2026-03-22*
