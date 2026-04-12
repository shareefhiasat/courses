# 🚀 Operations & Scripts

> **System Operations, Scripts, and Maintenance Procedures**

---

## 🚀 **Quick Start**

```bash
# Start all services
.\scripts\dev-start.ps1

# Access application
http://localhost:5173

# Login credentials
Email: shareef.hiasat@gmail.com
Password: Jordan123$
```

---

## 📁 **Scripts Organization**

### **🗄️ Database Scripts**
- **Database Migration**: Prisma-based schema management
- **User Management**: Super admin and user setup
- **Data Operations**: Backup, restore, cleanup

### **🐳 Docker Scripts**
- **Service Management**: Start/stop all services
- **Configuration**: Docker compose files
- **Monitoring**: Service health checks

### **💻 Client Scripts**
- **Development**: Build and development servers
- **Testing**: Unit and E2E test runners
- **Deployment**: Build and deployment scripts

---

## 🛠️ **Common Operations**

### **Database Operations**
```bash
# Push schema changes
cd client
npx prisma db push --schema prisma/schema.postgres.prisma

# Generate Prisma client
npx prisma generate

# Reset database (if needed)
npx prisma db push --force-reset
```

### **Service Management**
```bash
# Start all services
.\scripts\dev-start.ps1

# Start specific services
docker-compose -f scripts/docker/docker-compose.dev.yml up -d keycloak-db keycloak

# Stop all services
docker-compose -f scripts/docker/docker-compose.dev.yml down
```

### **Application Operations**
```bash
# Start development server
cd client
npm start

# Build for production
npm run build

# Run tests
npm test
npm run test:e2e
```

---

## 📊 **Service Status**

### **Core Services**
| Service | Port | Status | Purpose |
|---------|------|--------|---------|
| Frontend | 5173 | ✅ Running | React application |
| PostgreSQL | 5432 | ✅ Running | Main database |
| Keycloak | 8080 | ✅ Running | Authentication |

### **Optional Services**
| Service | Port | Status | Purpose |
|---------|------|--------|---------|
| Redis | 6379 | ⚪ Optional | Caching |
| MinIO | 9000 | ⚪ Optional | File storage |
| Grafana | 3002 | ⚪ Optional | Monitoring |

---

## 🔧 **Configuration**

### **Environment Variables**
```env
# Database (client/.env)
DATABASE_URL="postgresql://military_lms:military_lms123@localhost:5432/military_lms"

# Application
API_VERSION=v1
API_BASE_URL=http://localhost:3000
```

### **Docker Configuration**
- **Main Config**: `scripts/docker/docker-compose.dev.yml`
- **Environment**: Development optimized
- **Volumes**: Persistent data storage
- **Networks**: Service communication

---

## 📋 **Maintenance Procedures**

### **Daily Checks**
- [ ] Service health status
- [ ] Database connection
- [ ] Application accessibility
- [ ] Error logs review

### **Weekly Maintenance**
- [ ] Database backup
- [ ] Log rotation
- [ ] Performance monitoring
- [ ] Security updates

### **Monthly Tasks**
- [ ] Full system backup
- [ ] Dependency updates
- [ ] Security audit
- [ ] Performance optimization

---

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Database Connection Issues**
```bash
# Check PostgreSQL status
docker ps | grep postgres

# Restart database
docker restart lms-qaf-app-db

# Test connection
cd client && npx prisma db push
```

#### **Service Startup Issues**
```bash
# Check all services
docker-compose -f scripts/docker/docker-compose.dev.yml ps

# Restart specific service
docker-compose -f scripts/docker/docker-compose.dev.yml restart keycloak

# View logs
docker-compose -f scripts/docker/docker-compose.dev.yml logs keycloak
```

#### **Application Issues**
```bash
# Clear cache
cd client && rm -rf node_modules/.cache

# Reinstall dependencies
cd client && pnpm install

# Regenerate Prisma client
cd client && npx prisma generate
```

### **Emergency Procedures**

#### **Complete System Reset**
```bash
# Stop all services
docker-compose -f scripts/docker/docker-compose.dev.yml down

# Remove all containers and volumes
docker-compose -f scripts/docker/docker-compose.dev.yml down -v

# Restart system
.\scripts\dev-start.ps1
```

#### **Database Recovery**
```bash
# Reset database
cd client
npx prisma db push --force-reset

# Restore from backup (if available)
# TODO: Implement backup restoration script
```

---

## 📈 **Monitoring**

### **Health Checks**
```bash
# Application health
curl http://localhost:5173

# Database health
cd client && node -e "import { PrismaClient } from '@prisma/client'; new PrismaClient().$connect().then(() => console.log('✅ DB OK')).catch(e => console.error('❌ DB Error', e))"

# Service health
docker-compose -f scripts/docker/docker-compose.dev.yml ps
```

### **Performance Monitoring**
- **Query Performance**: 3-7ms average
- **Connection Pool**: 13 active connections
- **Memory Usage**: Monitor via Docker stats
- **CPU Usage**: Monitor via system tools

---

## 🔐 **Security**

### **Access Control**
- **Super Admin**: shareef.hiasat@gmail.com
- **Keycloak Realm**: military-lms
- **Database Access**: Restricted to application
- **Service Ports**: Local access only

### **Security Procedures**
- [ ] Regular password updates
- [ ] SSL certificate management
- [ ] Access log review
- [ ] Security patch updates

---

## 📞 **Support**

### **Documentation**
- **Main Documentation**: `/docs/README.md`
- **Database Documentation**: `/docs/database/README.md`
- **API Documentation**: `/docs/api/README.md`

### **Emergency Contact**
- **System Admin**: shareef.hiasat@gmail.com
- **Documentation**: `/docs/operations/`

---

*Last Updated: 2026-03-22*
*Version: 2.0 - PostgreSQL + Prisma Optimizer*
