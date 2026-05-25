# Military LMS - Architecture Guide

## 🏗️ Overview

Military LMS uses **Node.js/Express Backend** with **PostgreSQL**, **Prisma ORM**, **Keycloak Authentication**, and **MinIO Object Storage**. The architecture follows a clean layered separation:

```
Frontend (Vite :5174 HTTPS)
    ↓ fetch
Backend API (Express :8001)
    ↓ Controllers
    ↓ Services (Business Logic)
    ↓ DB Services (Prisma)
    ↓
PostgreSQL Database (:5432)

Infrastructure:
- Keycloak (Authentication) :8080
- MinIO (Object Storage) :9000
- Redis (Caching) :6379
- Nginx (TLS Termination) :443
```

---

## 🚀 Quick Start

### 1. Start Docker Infrastructure
```bash
# Start all services (PostgreSQL, Keycloak, MinIO, Redis, Nginx)
docker compose -p qaf-lms -f scripts/docker/docker-compose.yml up -d

# Check status
docker ps
```

---

## 📁 Project Structure

```
courses/
├── backend/                         # 🚀 Backend Application
│   ├── server.js                    # Express server entry point
│   ├── routes/                      # API route definitions
│   │   ├── workflows.js
│   │   ├── activities.js
│   │   └── ...
│   ├── controllers/                 # Request handlers
│   │   ├── activities.js
│   │   ├── admin-scopes.js
│   │   └── ...
│   ├── services/                    # Business logic layer
│   │   ├── minioService.js          # MinIO object storage
│   │   ├── notifications/           # Notification gateway
│   │   └── ...
│   ├── db/                          # Database operations
│   │   ├── activities-postgres.js
│   │   ├── admin-scopes-postgres.js
│   │   └── ...
│   ├── middleware/                  # Express middleware
│   │   ├── keycloakAuth.js          # Keycloak JWT validation
│   │   └── adminScopeMiddleware.js
│   └── constants/                   # Shared constants
│       ├── driveConstants.js        # MinIO bucket names
│       └── fileConstants.js
├── client/                          # � Frontend Application
│   ├── src/
│   │   ├── pages/                   # 📄 UI Pages
│   │   │   ├── workflow/            # Workflow UI
│   │   │   │   ├── WorkflowInboxPage.jsx
│   │   │   │   └── WorkflowWorkspacePage.jsx
│   │   │   ├── academic/            # 📚 Academic UI
│   │   │   ├── dashboard/           # � Dashboard
│   │   │   └── ...
│   │   ├── services/
│   │   │   ├── business/            # 🧠 Business Logic
│   │   │   │   └── workflowService.js
│   │   │   └── db/                  # 🗄️ Database Layer
│   │   ├── components/             # 🎨 React Components
│   │   ├── hooks/                   # Custom React hooks
│   │   └── contexts/                # 📦 React Contexts
│   ├── prisma/
│   │   └── schema.prisma            # 🗄️ Database Schema
│   └── package.json
├── scripts/docker/                  # 🐳 Docker configurations
│   └── docker-compose.yml           # Infrastructure services
└── package.json                     # 📋 Root workspace
```

---

## 🔧 Environment Variables

### Backend (.env)
```env
DATABASE_URL="postgresql://military_lms:military_lms123@localhost:5432/military_lms"
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=military-lms
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
REDIS_URL=redis://localhost:6379
```

### Client (.env)
```env
VITE_API_BASE_URL=http://localhost:8001
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=military-lms
VITE_KEYCLOAK_CLIENT_ID=military-lms-app
```

---

## 🌐 API Architecture

### Backend API Server
- **Location**: `backend/server.js`
- **Port**: 8001
- **Database**: Prisma ORM with PostgreSQL
- **Authentication**: Keycloak JWT middleware
- **Service Layer**: Routes → Controllers → Services → DB Services → Prisma

**Example - Workflow API:**
```javascript
// backend/routes/workflows.js
import workflowController from '../controllers/workflows.js';

router.get('/api/v1/workflows', keycloakAuth, workflowController.list);
router.post('/api/v1/workflows', keycloakAuth, workflowController.create);
```

### Service Layer Pattern
- **Controllers**: `backend/controllers/` - Request validation and response formatting
- **Services**: `backend/services/` - Business logic
- **DB Services**: `backend/db/` - Prisma database operations

**Example - Workflow Controller:**
```javascript
// backend/controllers/workflows.js
import workflowDbService from '../db/workflows-postgres.js';

const create = async (req, res) => {
  const result = await workflowDbService.create(req.body);
  res.json(result);
};
```

**Example - Workflow DB Service:**
```javascript
// backend/db/workflows-postgres.js
import { prisma } from '../services/prismaService.js';

const create = async (data) => {
  const workflow = await prisma.workflow.create({ data });
  return { success: true, data: workflow };
};
```

### Frontend API Client
- **Location**: `client/src/services/business/`
- **Purpose**: HTTP client for API communication
- **Authentication**: Includes Keycloak token in headers

**Example - Workflow Service:**
```javascript
// client/src/services/business/workflowService.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const createWorkflow = async (data) => {
  const token = await getToken();
  const response = await fetch(`${API_BASE_URL}/api/v1/workflows`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  return response.json();
};
```

---

## 🔄 Data Flow Example

### Create Workflow
```
1. WorkflowPage.jsx
   ↓ calls
2. workflowService.createWorkflow() (Frontend)
   ↓ fetches with Keycloak token
3. POST http://localhost:8001/api/v1/workflows
   ↓ validates token
4. keycloakAuth middleware
   ↓ calls
5. workflowController.create() (Backend)
   ↓ calls
6. workflowDbService.create() (Backend)
   ↓ queries
7. Prisma → PostgreSQL
   ↓ returns
8. WorkflowPage displays success
```

---

## 📋 Available Scripts

### Backend
```bash
node backend/server.js              # Start backend server (port 8001)
npx prisma generate --schema=client/prisma/schema.prisma  # Generate Prisma client
npx prisma studio --schema=client/prisma/schema.prisma        # Open Prisma Studio
```

### Frontend
```bash
cd client
node node_modules/vite/bin/vite.js --host  # Start Vite dev server (port 5174)
npm build                              # Build for production
```

---

## 🎯 Entity Implementation Pattern

To add a new entity (e.g., Workflow Documents):

### 1. Prisma Schema
```prisma
// client/prisma/schema.prisma
model WorkflowDocument {
  id String @id @default(cuid())
  workflowType WorkflowType
  title String
  status WorkflowStatus
  // ...
}

enum WorkflowType {
  ATTENDANCE_DAILY
  ATTENDANCE_WEEKLY
  GENERAL
}
```

---

### 2. DB Service
```javascript
// backend/db/workflowDocuments-postgres.js
import { prisma } from '../services/prismaService.js';

const create = async (data) => {
  const document = await prisma.workflowDocument.create({ data });
  return { success: true, data: document };
};
```

### 3. Controller
```javascript
// backend/controllers/workflowDocuments.js
import workflowDocumentDbService from '../db/workflowDocuments-postgres.js';

const create = async (req, res) => {
  const result = await workflowDocumentDbService.create(req.body);
  res.json(result);
};
```

### 4. Route
```javascript
// backend/routes/workflowDocuments.js
import express from 'express';
import workflowDocumentController from '../controllers/workflowDocuments.js';
import keycloakAuth from '../middleware/keycloakAuth.js';

const router = express.Router();
router.post('/', keycloakAuth, workflowDocumentController.create);

export default router;
```

### 5. Frontend Service
```javascript
// client/src/services/business/workflowDocumentService.js
const createWorkflowDocument = async (data) => {
  const token = await getToken();
  const response = await fetch(`${API_BASE_URL}/api/v1/workflow-documents`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  return response.json();
};
```

## 🔐 Security Notes

### Authentication
- Keycloak JWT validation on all protected routes
- Token stored in browser, sent in Authorization header
- Role-based access control (RBAC) via Keycloak realms

### Environment Variables
- **VITE_** prefix: Exposed to browser (safe for URLs)
- **No VITE_**: Server-side only (database credentials, secrets)

### Database Security
- Prisma handles SQL injection prevention
- API server validates inputs via Zod schemas
- No direct database access from browser
- Service layer provides additional validation

### File Storage
- MinIO with presigned URLs for secure file access
- URL expiration (5 minutes)
- Bucket-level access control

---

## 🚀 Production Deployment

### Environment Setup
```env
NODE_ENV=production
DATABASE_URL="postgresql://..."
KEYCLOAK_URL=https://keycloak.example.com
MINIO_ENDPOINT=minio.example.com
```

### Build Process
```bash
# Frontend
cd client
npm run build

# Backend
# No build needed (ES modules)
node backend/server.js
```

### Docker Deployment
```yaml
# docker-compose.yml
services:
  app-db:
    image: postgres:15
  keycloak:
    image: quay.io/keycloak/keycloak:26
  minio:
    image: minio/minio
  redis:
    image: redis:7
  nginx:
    image: nginx:alpine
```

---

## 🎯 Key Benefits

### ✅ Clean Architecture
- **Separation of Concerns**: UI, Business, Data layers clearly separated
- **Service Layer**: Reusable business logic
- **Layered Backend**: Routes → Controllers → Services → DB Services → Prisma

### ✅ Scalability
- **Standalone Backend**: Can be scaled independently
- **Service Layer**: Easy to extend with new entities
- **Object Storage**: MinIO for scalable file storage
- **Caching**: Redis for performance optimization

### ✅ Development Experience
- **Hot Reload**: Both frontend and backend
- **Prisma Studio**: Visual database management
- **Clear Data Flow**: Easy to debug and maintain
- **Type Safety**: TypeScript strict mode

### ✅ Security
- **Keycloak Authentication**: Enterprise-grade identity management
- **Role-Based Access Control**: Fine-grained permissions
- **Secure File Storage**: MinIO with presigned URLs
- **Offline Deployment**: Air-gapped red network support

---

## 📞 Support & Troubleshooting

### Common Issues
1. **Database Connection**: Ensure PostgreSQL container is running
2. **Keycloak Startup**: Takes 20-30s after healthy to accept requests
3. **Port Conflicts**: Backend uses 8001, frontend uses 5174
4. **HTTPS Cert**: Vite uses self-signed cert - browser may warn

### Debug Commands
```bash
# Check database connection
docker exec -it lms-qaf-app-db psql -U military_lms -d military_lms

# Check Docker logs
docker logs lms-qaf-keycloak
docker logs lms-qaf-app-db

# Test API server
curl http://localhost:8001/api/health

# Check backend logs
tail -f /tmp/backend.log
```

---

## 🏁 Summary

The Military LMS features a **clean, scalable architecture** with:

- **🔄 Complete Service Layer**: Business logic separated from database operations
- **🚀 Backend API Server**: Express server on port 8001 with Prisma
- **🎯 Clean Data Flow**: Frontend → API → Controllers → Services → DB Services → Prisma → PostgreSQL
- **🔒 Keycloak Authentication**: Enterprise-grade identity management
- **📦 MinIO Object Storage**: Scalable file storage with versioning
- **🔄 Redis Caching**: Performance optimization
- **🌐 Nginx TLS Termination**: Secure HTTPS delivery
- **🔒 Browser-Safe**: No Prisma in browser, only HTTP API calls
- **📚 Complete Documentation**: Updated architecture guide

**Ready for production development!** 🎉

## 🆕 Recent Updates (2026-05)

- Migrated from standalone server.js to backend/ folder structure
- Added Keycloak 26 authentication
- Integrated MinIO object storage (lms-private, lms-shared, lms-workflow buckets)
- Added Redis caching layer
- Implemented unified notification system
- Docker Compose infrastructure for offline deployment
- Updated to Node.js 22, React 19, Vite 6, Prisma 5.22
