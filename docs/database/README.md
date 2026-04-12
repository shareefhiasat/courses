# 🗄️ Database Documentation

> **Database setup and management for Military LMS**
>
> **Docusaurus Source of Truth for Database**

---

## 📁 **Database Resources**

### **📖 Database Guides**
- **[DATABASE_SETUP.md](./DATABASE_SETUP.md)** - Complete database configuration and setup

### **🔧 Database Scripts**
- **[clean-database.cjs](./clean-database.cjs)** - Database cleanup script
- **[verify-super-admin.cjs](./verify-super-admin.cjs)** - Super admin verification script

---

## 🎯 **Database Architecture**

### **Prisma Schema (Source of Truth)**
```
client/prisma/schema.postgres.prisma → Service Layer API → Frontend
```

### **PostgreSQL Baseline**
- **Connection**: `postgresql://keycloak:keycloak123@localhost:5432/keycloak`
- **Purpose**: Simplified SQL foundation for login and programs
- **Setup**: Docker-based PostgreSQL service

### **Core Tables**
- `users` - User management
- `programs` - Academic programs
- `subjects` - Course subjects
- `classes` - Individual classes
- `notifications` - In-app notifications
- `system_logs` - Audit logs

---

## 🚀 **Database Setup**

### **Quick Setup**
```powershell
# Generate Prisma client and create the initial migration
cd ../../client
npm run db:generate
npm run db:migrate
```

### **Database Operations**
```bash
# Generate Prisma client
npx prisma generate --schema prisma/schema.postgres.prisma

# Push schema changes
npx prisma db push --schema prisma/schema.postgres.prisma

# Open Prisma Studio
npx prisma studio --schema prisma/schema.postgres.prisma

# Reset database
npx prisma migrate reset --schema prisma/schema.postgres.prisma
```

---

## 🔧 **Database Scripts**

### **Clean Database**
```bash
node clean-database.cjs
```
- Legacy cleanup helper retained for archival use
- Prefer Prisma migrations for the PostgreSQL baseline

### **Verify Super Admin**
```bash
node verify-super-admin.cjs
```
- Legacy helper retained for archival use
- Keycloak now owns the authoritative login flow

---

## 🚨 **Troubleshooting**

### **Connection Issues**
```bash
# Check PostgreSQL connection
docker exec lms-qaf-keycloak-db pg_isready -U keycloak -d keycloak

# Test Prisma connection
npx prisma db pull --schema prisma/schema.postgres.prisma
```

### **Schema Issues**
```bash
# Reset database
npx prisma migrate reset --schema prisma/schema.postgres.prisma

# Push fresh schema
npx prisma db push --schema prisma/schema.postgres.prisma

# Generate client
npx prisma generate --schema prisma/schema.postgres.prisma
```

---

## 📋 **Database Checklist**

- [ ] PostgreSQL service running
- [ ] Prisma schema synced
- [ ] Super admin user created
- [ ] Core tables created
- [ ] Database accessible from application

---

## 🔐 **Database Security**

### **Access Control**
- **Username**: keycloak
- **Password**: keycloak123
- **Host**: localhost:5432

### **Connection String**
```env
DATABASE_URL="postgresql://keycloak:keycloak123@localhost:5432/keycloak"
```

---

*Last Updated: 2026-03-21*
*Docusaurus Source of Truth for Database*
