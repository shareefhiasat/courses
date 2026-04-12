# Environment Configuration Guide

## Overview
Military LMS uses environment variables for configuration across backend and frontend services. This ensures flexibility across different deployment environments.

## Technology Stack
- **Database**: PostgreSQL (exclusively)
- **ORM**: Prisma
- **API**: REST endpoints with versioning
- **Authentication**: Keycloak
- **Backend**: Node.js/Express

## Environment Files

### Backend Environment (`.env`)
Located at project root: `E:\QAF\Github\courses\.env`

```env
# Server Configuration
PORT=8080
NODE_ENV=development

# API Configuration
API_VERSION=v1
API_BASE_URL=http://localhost:8080

# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/military_lms"
DB_HOST=localhost
DB_PORT=5432
DB_NAME=military_lms
DB_USERNAME=username
DB_PASSWORD=password

# Application Configuration
APP_NAME="Military LMS"
APP_VERSION=1.0.0
APP_URL=http://localhost:3000

# Frontend Configuration
FRONTEND_URL=http://localhost:3000
FRONTEND_PORT=3000

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Security
JWT_SECRET=your-super-secret-jwt-key-change-in-production
API_SECRET_KEY=your-api-secret-key-change-in-production

# Features
ENABLE_SWAGGER=true
ENABLE_CORS=true
ENABLE_RATE_LIMITING=false
```

### Frontend Environment (`.env`)
Located at: `E:\QAF\Github\courses\client\.env`

```env
# API Configuration - Standalone API Server
API_VERSION=v1
API_BASE_URL=http://localhost:8080
VITE_API_BASE_URL=http://localhost:8080
VITE_API_VERSION=v1

# Database Configuration
DATABASE_URL="postgresql://military_lms:military_lms123@localhost:5432/military_lms"
VITE_DATABASE_URL="postgresql://military_lms:military_lms123@localhost:5432/military_lms"

# Keycloak Configuration
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=military-lms
VITE_KEYCLOAK_CLIENT_ID=military-lms-app
```

## Port Configuration

### Default Ports
- **Backend API**: `8080` (configurable via `PORT`)
- **Frontend**: `3000` (configurable via `FRONTEND_PORT`)
- **Database**: `5432` (PostgreSQL default)
- **Keycloak**: `8080` (if using same server as backend)

### Port Conflicts
If you encounter port conflicts, update the `PORT` variable in the backend `.env` file:

```env
# Use port 8081 if 8080 is occupied
PORT=8081
```

Then update the frontend `.env` to match:

```env
VITE_API_BASE_URL=http://localhost:8081
```

## Database Configuration

### PostgreSQL Setup
1. Install PostgreSQL on your system
2. Create a database: `military_lms`
3. Update the `DATABASE_URL` in both `.env` files:

```env
# Backend .env
DATABASE_URL="postgresql://your_username:your_password@localhost:5432/military_lms"

# Frontend .env
DATABASE_URL="postgresql://your_username:your_password@localhost:5432/military_lms"
VITE_DATABASE_URL="postgresql://your_username:your_password@localhost:5432/military_lms"
```

### Environment-Specific Configurations

#### Development
```env
NODE_ENV=development
LOG_LEVEL=debug
ENABLE_SWAGGER=true
```

#### Production
```env
NODE_ENV=production
LOG_LEVEL=info
ENABLE_SWAGGER=false
JWT_SECRET=super-secure-production-secret
```

## API Versioning

### Current Version: `v1`
- Configured via `API_VERSION` environment variable
- All API endpoints use: `/api/v1/`
- Frontend automatically uses the configured version

### Version Updates
To update API version:

1. Update `API_VERSION=v2` in both `.env` files
2. Create new routes in `backend/routes/v2/`
3. Update frontend to use new endpoints
4. Maintain backward compatibility by keeping old routes

## Starting Services

### Backend Server
```bash
# Development with hot reload
pnpm api:dev

# Production
pnpm api
```

### Frontend Development
```bash
cd client
pnpm dev
```

## Environment Variables Reference

### Backend Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | Backend server port |
| `NODE_ENV` | `development` | Environment mode |
| `API_VERSION` | `v1` | API version |
| `API_BASE_URL` | `http://localhost:8080` | Base API URL |
| `DATABASE_URL` | - | PostgreSQL connection string |
| `APP_NAME` | `Military LMS` | Application name |
| `APP_VERSION` | `1.0.0` | Application version |
| `CORS_ORIGIN` | `http://localhost:3000` | CORS allowed origin |
| `ENABLE_SWAGGER` | `true` | Enable Swagger documentation |
| `JWT_SECRET` | - | JWT signing secret |

### Frontend Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:8080` | Backend API URL |
| `VITE_API_VERSION` | `v1` | API version |
| `VITE_DATABASE_URL` | - | Database connection string |
| `VITE_KEYCLOAK_URL` | `http://localhost:8080` | Keycloak server URL |
| `VITE_KEYCLOAK_REALM` | `military-lms` | Keycloak realm |
| `VITE_KEYCLOAK_CLIENT_ID` | `military-lms-app` | Keycloak client ID |

## Troubleshooting

### Port Already in Use
```bash
# Kill stuck Node processes
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force

# Or use different port
PORT=8081 pnpm api:dev
```

### Environment Variables Not Loading
1. Ensure `.env` files are in correct locations
2. Check file permissions
3. Restart services after changing `.env` files

### CORS Issues
Update `CORS_ORIGIN` in backend `.env`:
```env
CORS_ORIGIN=http://localhost:3000,http://your-frontend-domain.com
```

### Database Connection Issues
1. Verify PostgreSQL is running
2. Check database credentials in `DATABASE_URL`
3. Ensure database exists: `createdb military_lms`

## Security Notes

### Production Deployment
1. Change all default secrets and passwords
2. Use environment-specific `.env` files
3. Disable Swagger in production: `ENABLE_SWAGGER=false`
4. Use strong JWT secrets
5. Configure proper CORS origins

### Environment File Security
- Add `.env` files to `.gitignore`
- Never commit secrets to version control
- Use different credentials for each environment
- Rotate secrets regularly
