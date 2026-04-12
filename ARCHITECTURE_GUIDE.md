# Military LMS - Architecture Guide

## 🏗️ Overview

Military LMS uses **Node.js API Server** with **PostgreSQL** and **Prisma** ORM. The architecture follows a clean 4-layer separation:

```
Frontend (Vite :5174)
    ↓ fetch
API Server (Express :3001)
    ↓ Business Services
DB Services (Prisma)
    ↓
PostgreSQL Database (:5432)
```

---

## 🚀 Quick Start

### 1. Database Setup
```bash
# PostgreSQL must be running on localhost:5432
# Database: military_lms
# User: military_lms
# Password: military_lms123

# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push
```

### 2. Start Development Servers
```bash
# Terminal 1: Start API Server
pnpm api

# Terminal 2: Start Frontend
pnpm dev
```

### 3. Access the Application
- **Frontend**: http://localhost:5174
- **API Server**: http://localhost:3001/api/*
- **Health Check**: http://localhost:3001/api/health
- **Prisma Studio**: `pnpm db:studio`

---

## 📁 Project Structure

```
courses/
├── server.js                        # 🚀 API Server (Express)
├── client/                          # 🎯 Frontend Application
│   ├── src/
│   │   ├── pages/                   # 📄 UI Pages
│   │   │   ├── academic/            # 📚 Academic UI Pages
│   │   │   │   ├── programs/        # Programs UI
│   │   │   │   │   └── ProgramsPage.jsx
│   │   │   │   ├── subjects/        # Subjects UI
│   │   │   │   └── classes/         # Classes UI
│   │   │   ├── dashboard/           # 📊 Dashboard UI
│   │   │   ├── users/               # 👥 User Management UI
│   │   │   └── HomePage.jsx         # 🏠 Main UI Page
│   │   ├── services/
│   │   │   ├── business/            # 🧠 Business Logic Layer
│   │   │   │   ├── programBusinessService.js
│   │   │   │   ├── programService.js
│   │   │   │   └── ...
│   │   │   └── db/                  # 🗄️ Database Layer
│   │   │       ├── databaseService.js    # Prisma Client Management
│   │   │       ├── programDbService.js   # Direct Prisma Operations
│   │   │       └── programDbService-postgres.cjs  # API Client (Frontend)
│   │   ├── components/              # 🎨 React Components
│   │   └── contexts/                # 📦 React Contexts
│   ├── prisma/
│   │   └── schema.postgres.prisma   # 🗄️ Database Schema
│   └── package.json
└── package.json                     # 📋 Root Scripts
```

---

## 🔧 Environment Variables

### Client (.env)
```env
# Database (for Prisma generation)
DATABASE_URL="postgresql://military_lms:military_lms123@localhost:5432/military_lms"
VITE_DATABASE_URL="postgresql://military_lms:military_lms123@localhost:5432/military_lms"

# API (Standalone Express Server)
VITE_API_BASE_URL=http://localhost:3001

# Authentication
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=military-lms
VITE_KEYCLOAK_CLIENT_ID=military-lms-app
```

---

## 🌐 API Architecture

### Standalone Express API Server
- **Location**: `server.js` (root level)
- **Port**: 3001
- **Database**: Direct Prisma queries with connection pooling
- **Service Layer**: Business Services → DB Services → Prisma

**Example - Programs API:**
```javascript
// server.js
import programBusinessService from './client/src/services/business/programBusinessService.js';

app.get('/api/programs', async (req, res) => {
  const result = await programBusinessService.getAllPrograms(req.query);
  res.json(result);
});
```

### Service Layer Pattern
- **Business Services**: `client/src/services/business/`
- **DB Services**: `client/src/services/db/`
- **Database Service**: `client/src/services/db/databaseService.js`

**Example - Program Business Service:**
```javascript
// client/src/services/business/programBusinessService.js
import programDbService from '../db/programDbService.js';

const getAllPrograms = async (params = {}) => {
  const result = await programDbService.getPrograms(params);
  return result;
};
```

**Example - Program DB Service:**
```javascript
// client/src/services/db/programDbService.js
import { getDatabaseClient } from './databaseService.js';

const prisma = getDatabaseClient();

const getPrograms = async (params = {}) => {
  const programs = await prisma.program.findMany({...});
  return { success: true, data: programs };
};
```

### Frontend API Client
- **Location**: `client/src/services/db/programDbService-postgres.cjs`
- **Purpose**: HTTP client for API communication
- **No Prisma**: Only fetch() calls to API server

**Example - Programs API Client:**
```javascript
// client/src/services/db/programDbService-postgres.cjs
const API_BASE_URL = 'http://localhost:3001';

const getPrograms = async (params = {}) => {
  const response = await fetch(`${API_BASE_URL}/api/programs`);
  return response.json();
};
```

---

## 🔄 Data Flow Example

### Get All Programs
```
1. ProgramsPage.jsx
   ↓ calls
2. programService.getAllPrograms() (Frontend)
   ↓ calls  
3. programDbService-postgres.cjs.getPrograms() (Frontend)
   ↓ fetches
4. GET http://localhost:3001/api/programs
   ↓ calls
5. programBusinessService.getAllPrograms() (API Server)
   ↓ calls
6. programDbService.getPrograms() (API Server)
   ↓ queries
7. Prisma → PostgreSQL
   ↓ returns
8. ProgramsPage displays data
```

---

## 📋 Available Scripts

### Root Commands (Main)
```bash
pnpm api          # Start API server (port 3001)
pnpm dev          # Start frontend dev server (port 5174)
pnpm build        # Build for production
pnpm test         # Run E2E tests
pnpm db:generate  # Generate Prisma client
pnpm db:push      # Push schema to database
pnpm db:studio    # Open Prisma Studio
```

### Client Commands (from client/ directory)
```bash
pnpm dev          # Start Vite dev server
pnpm build        # Build application
pnpm test         # Run tests
pnpm db:generate  # Generate Prisma client
pnpm db:push      # Push schema changes
```

---

## 🎯 Entity Implementation Pattern

To add a new entity (e.g., Subjects):

### 1. API Server Route
```javascript
// server.js
import subjectBusinessService from './client/src/services/business/subjectBusinessService.js';

app.get('/api/subjects', async (req, res) => {
  const result = await subjectBusinessService.getAllSubjects(req.query);
  res.json(result);
});
```

### 2. Business Service
```javascript
// client/src/services/business/subjectBusinessService.js
import subjectDbService from '../db/subjectDbService.js';

const getAllSubjects = async (params = {}) => {
  const result = await subjectDbService.getSubjects(params);
  return result;
};
```

### 3. DB Service
```javascript
// client/src/services/db/subjectDbService.js
import { getDatabaseClient } from './databaseService.js';

const prisma = getDatabaseClient();

const getSubjects = async (params = {}) => {
  const subjects = await prisma.subject.findMany({...});
  return { success: true, data: subjects };
};
```

### 4. Frontend API Client
```javascript
// client/src/services/db/subjectDbService-postgres.cjs
const getSubjects = async (params = {}) => {
  const response = await fetch(`http://localhost:3001/api/subjects`);
  return response.json();
};
```

---

## 🔐 Security Notes

### Environment Variables
- **VITE_** prefix: Exposed to browser (safe for URLs)
- **No VITE_**: Server-side only (database credentials)

### Database Security
- Prisma handles SQL injection prevention
- API server validates inputs
- No direct database access from browser
- Service layer provides additional validation

---

## 🚀 Production Deployment

### Environment Setup
```env
NODE_ENV=production
DATABASE_URL="postgresql://..."
VITE_API_BASE_URL=http://api-server:3001
```

### Build Process
```bash
pnpm build          # Build optimized bundle
pnpm api            # Start API server
pnpm start          # Start frontend server
```

### Docker Deployment (Future)
```dockerfile
# API Server
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3001
CMD ["npm", "run", "api"]

# Frontend
FROM node:18-alpine as build
WORKDIR /app
COPY client/ .
RUN npm install && npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

---

## 🎯 Key Benefits

### ✅ Clean Architecture
- **Separation of Concerns**: UI, Business, Data layers clearly separated
- **Service Layer**: Reusable business logic
- **Connection Pooling**: Efficient database connections

### ✅ Scalability
- **Standalone API**: Can be scaled independently
- **Service Layer**: Easy to extend with new entities
- **TypeScript**: Full type safety across layers

### ✅ Development Experience
- **Hot Reload**: Both frontend and API server
- **Prisma Studio**: Visual database management
- **Clear Data Flow**: Easy to debug and maintain

---

## 📞 Support & Troubleshooting

### Common Issues
1. **Database Connection**: Ensure PostgreSQL is running
2. **Port Conflicts**: API server uses 3001, frontend uses 5174
3. **Process Errors**: Fixed with `typeof process !== 'undefined'` checks

### Debug Commands
```bash
# Check database connection
pnpm db:studio

# Test API server
curl http://localhost:3001/api/health

# Check logs
pnpm api --verbose
```

---

## 🏁 Summary

The Military LMS now features a **clean, scalable architecture** with:

- **🔄 Complete Service Layer**: Business logic separated from database operations
- **🚀 Standalone API Server**: Express server with Prisma connection pooling
- **🎯 Clean Data Flow**: Frontend → API → Business → DB → PostgreSQL
- **🔒 Browser-Safe**: No Prisma in browser, only HTTP API calls
- **📚 Complete Documentation**: Updated architecture guide

**Ready for production development!** 🎉
