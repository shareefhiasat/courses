# Military LMS - Full-Stack Learning Management System

## 🎯 Architecture Overview

Modern full-stack LMS using **single Vite build** approach with React frontend and integrated database services. Infrastructure runs in Docker containers while the application code runs locally for optimal development experience.

### 🏗️ Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    SINGLE VITE BUILD                         │
├─────────────────────────────────────────────────────────────┤
│  React Frontend + Database Services (Prisma + MongoDB)      │
│  ├── Components: React UI Components                        │
│  ├── Business Logic: Service Layer                          │
│  ├── Database Layer: Prisma ORM                             │
│  └── Build Output: Static Files + Bundle                    │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   Infrastructure  │
                    │  (Docker Only)    │
                    │ ├── MongoDB      │
                    │ ├── Redis         │
                    │ ├── MinIO         │
                    │ └── Keycloak      │
                    └───────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Git

### 1. Start Infrastructure Services

#### Option A: Full Setup (Recommended)
```bash
# PowerShell (Windows)
.\scripts\dev-start.ps1

# or Linux/Mac
./scripts/dev-start.sh
```

#### Option B: Quick Start
```bash
# PowerShell (Windows)
.\scripts\quick-start.ps1

# or direct command
docker-compose -f docker-compose.dev.yml up -d
```

### 2. Install Application Dependencies
```bash
cd client
npm install
```

### 3. Start Development Server
```bash
pnpm run dev
```

Visit: http://localhost:5174

### 4. Build for Production
```bash
npm run build
```

## 🏛️ Infrastructure Services

| Service | Port | Purpose |
|---------|------|---------|
| MongoDB | 27017 | Primary Database |
| Redis | 6379 | Cache & Sessions |
| MinIO | 9000/9001 | File Storage |
| Keycloak | 8080 | Authentication |
| PostgreSQL | 5432 | Keycloak Database |

## 🎯 Architecture Benefits

- ✅ **Single Build**: Frontend + backend in one package
- ✅ **No Docker Complexity**: App runs locally, infrastructure only
- ✅ **Fast Development**: Hot reload, easy debugging
- ✅ **Simple Deployment**: One build artifact
- ✅ **Modern Stack**: React + Vite + Prisma + MongoDB

## 📦 Database Migration Status

### ✅ Completed
- **Activity Service** - Migrated from Firestore to MongoDB

### 🔄 In Progress
- **User Service** - User management and authentication

### 📋 Planned
- **Announcement Service**
- **Resource Service** 
- **Enrollment Service**
- **Academic Structure** (Programs, Classes, Subjects)
- **Authentication & Authorization**
- **File Storage & Management**

## 🔧 Development Workflow

### Project Structure
```
courses/
├── client/                    # React + Vite application
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── services/
│   │   │   ├── business/      # Business logic layer
│   │   │   ├── db/           # Database layer (Prisma)
│   │   │   └── other/        # Utilities
│   │   └── App.jsx
│   ├── prisma/               # Database schema
│   └── package.json
├── docker-compose.dev.yml     # Infrastructure only
└── README.md
```

### Service Layer Architecture
```
React Components ←→ Business Services ←→ Database Services ←→ MongoDB
     (UI)              (Logic)             (Prisma ORM)        (Database)
```

### Development Commands
```bash
# Start infrastructure (with cleanup and health checks)
.\scripts\dev-start.ps1

# Development server
cd client
pnpm run dev

# Database operations
pnpm run db:generate
pnpm run db:studio
pnpm run db:push

# Build for production
pnpm run build

# Quick infrastructure restart
docker-compose -f docker-compose.dev.yml restart

# Clean shutdown
docker-compose -f docker-compose.dev.yml down -v
```

## 🌐 Production Deployment

### Option 1: Static Web Server
```bash
# Build application
cd client
npm run build

# Deploy dist/ folder to any web server (NGINX, Apache, IIS)
```

### Option 2: Docker Deployment
```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY client/package*.json ./client/
RUN cd client && npm install
COPY client/ ./client/
RUN cd client && npm run build

FROM nginx:alpine
COPY --from=builder /app/client/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 📚 Documentation

- [Database Schema](./docs/database-schema.md)
- [API Documentation](./docs/api.md)
- [Migration Guide](./docs/migration.md)
- [Service Architecture](./docs/services.md)

## 🤝 Contributing

1. Follow the existing service layer architecture
2. Keep database operations in `services/db/`
3. Keep business logic in `services/business/`
4. Use TypeScript for new components
5. Test with local development before deployment

## 📄 License

Military LMS - Proprietary
