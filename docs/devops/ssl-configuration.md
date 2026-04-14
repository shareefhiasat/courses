# SSL Configuration for Production

## Overview

This document explains how to configure SSL/HTTPS for the Military LMS in production using Nginx as a reverse proxy. **Do NOT use self-signed certificates in production** - they cause security warnings and are not trusted by browsers.

## Architecture

```
Internet → F5 Load Balancer (Wildcard SSL) → Nginx (Docker) → Backend/Frontend
```

- **F5**: Terminates SSL using wildcard certificates provided by cyber team
- **Nginx**: Acts as reverse proxy, handles routing to backend/frontend
- **Backend/Frontend**: Run internally on HTTP (no SSL needed)

## Development vs Production

### Development (Current - Windows)
- **Protocol**: HTTP (direct access)
- **No SSL certificates needed**
- Backend runs on `http://localhost:8001`
- Frontend runs on `http://localhost:5174`

### Development with Nginx (Optional)
- **Protocol**: HTTPS via Nginx reverse proxy
- **Self-signed certificates** (generated locally)
- Access via `https://localhost`
- Nginx proxies to backend/frontend on HTTP

### Production (Offline Server)
- **Protocol**: HTTPS via F5 + Nginx
- **Wildcard SSL certificates** from cyber team (installed on F5)
- F5 handles SSL termination
- Nginx runs on HTTP internally, proxies to backend/frontend

## Production SSL Setup (F5 Wildcard Certificates)

### Overview

The cyber team provides wildcard SSL certificates installed on the F5 load balancer. This is the recommended approach for the Military LMS production deployment.

### Architecture

```
Internet → F5 Load Balancer (Wildcard SSL) → Nginx (Docker) → Backend/Frontend
```

- **F5**: Terminates SSL using wildcard certificates
- **Nginx**: Runs on HTTP internally, handles routing
- **Backend/Frontend**: No SSL configuration needed

### F5 Configuration

1. **Wildcard Certificate**: Provided by cyber team (e.g., `*.yourcompany.com`)
2. **SSL Offload**: F5 handles SSL termination
3. **Backend Pool**: Points to Nginx container (HTTP)
4. **Health Checks**: F5 monitors Nginx health endpoint

### Nginx Configuration (Production)

For production, Nginx runs on HTTP internally since F5 handles SSL termination.

```nginx
# docker/nginx/nginx.conf.production
server {
    listen 80;
    server_name lms.yourcompany.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=31536000" always;

    # Frontend
    location / {
        proxy_pass http://frontend:5174;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend:8001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 50M;
    }

    # Health check
    location /health {
        proxy_pass http://backend:8001/api/health;
        access_log off;
    }
}
```

### Docker Deployment

1. **Export Docker Containers** (from Windows development):
```powershell
# Save images
docker save lms-backend:dev -o backend-image.tar
docker save lms-frontend:dev -o frontend-image.tar
docker save postgres:16-alpine -o postgres-image.tar
docker save nginx:alpine -o nginx-image.tar

# Transfer to offline server
```

2. **Load Images on Offline Server**:
```bash
docker load -i backend-image.tar
docker load -i frontend-image.tar
docker load -i postgres-image.tar
docker load -i nginx-image.tar
```

3. **Run Production Docker Compose**:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Local Development with Nginx (Optional)

### Generate Self-Signed Certificates

Run the PowerShell script to generate self-signed certificates for local development:

```powershell
.\scripts\docker\generate-ssl-certs.ps1
```

This will create:
- `docker/nginx/ssl/cert.pem` - SSL certificate
- `docker/nginx/ssl/key.pem` - Private key

### Start Development Environment with Nginx

```powershell
docker-compose -f docker-compose.dev.yml up -d
```

Access the application at:
- Frontend: `https://localhost`
- Backend API: `https://localhost/api/v1`

**Note**: Your browser will show a security warning for self-signed certificates. This is expected for local development.

### Direct Development (Without Nginx)

For simpler local development, you can run services directly:

```powershell
# Backend
cd backend
npm run dev

# Frontend (in another terminal)
cd client
pnpm dev
```

Access at:
- Frontend: `http://localhost:5174`
- Backend: `http://localhost:8001`

**Note**: This may cause mixed content warnings if frontend is HTTPS and backend is HTTP.

## Production Docker Compose

Create `docker-compose.prod.yml` for production deployment:

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    container_name: lms-nginx
    ports:
      - "80:80"
    volumes:
      - ./docker/nginx/nginx.conf.production:/etc/nginx/nginx.conf:ro
    depends_on:
      - backend
      - frontend
    networks:
      - lms-network
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    container_name: lms-postgres
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - lms-network
    restart: unless-stopped

  backend:
    image: lms-backend:dev
    container_name: lms-backend
    environment:
      NODE_ENV: production
      PORT: 8001
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      NEXTCLOUD_BASE_URL: ${NEXTCLOUD_BASE_URL}
      NEXTCLOUD_USERNAME: ${NEXTCLOUD_USERNAME}
      NEXTCLOUD_APP_PASSWORD: ${NEXTCLOUD_APP_PASSWORD}
      KEYCLOAK_URL: ${KEYCLOAK_URL}
      KEYCLOAK_REALM: ${KEYCLOAK_REALM}
      CORS_ORIGIN: ${CORS_ORIGIN}
      FRONTEND_URL: ${FRONTEND_URL}
    depends_on:
      - postgres
    networks:
      - lms-network
    restart: unless-stopped

  frontend:
    image: lms-frontend:dev
    container_name: lms-frontend
    environment:
      VITE_API_URL: /api/v1
      VITE_API_BASE_URL: /
      VITE_WS_URL: wss://your-domain.com
      VITE_KEYCLOAK_URL: ${KEYCLOAK_URL}
      VITE_KEYCLOAK_REALM: ${KEYCLOAK_REALM}
    depends_on:
      - backend
    networks:
      - lms-network
    restart: unless-stopped

volumes:
  postgres-data:

networks:
  lms-network:
    driver: bridge
```

## Security Checklist for Production

- [ ] F5 wildcard SSL certificates installed by cyber team
- [ ] Nginx configured with security headers
- [ ] CORS origins restricted to production domain
- [ ] Environment variables for sensitive data
- [ ] Rate limiting configured in Nginx
- [ ] Health check endpoints configured
- [ ] Docker images scanned for vulnerabilities
- [ ] Database credentials secured
- [ ] API authentication (Keycloak) properly configured
- [ ] File upload size limits configured

## Summary

- **Development (Direct)**: HTTP, no SSL, direct access to ports 8001/5174
- **Development (Nginx)**: HTTPS with self-signed certs, access via https://localhost
- **Production**: HTTPS via F5 wildcard SSL, Nginx runs on HTTP internally
- **Deployment**: Export Docker images from Windows, load on offline server

## File Structure

```
courses/
├── docker/
│   └── nginx/
│       ├── nginx.conf              # Development config with SSL
│       ├── nginx.conf.production   # Production config (HTTP only)
│       └── ssl/
│           ├── cert.pem            # Self-signed cert (dev only)
│           └── key.pem             # Private key (dev only)
├── scripts/
│   └── docker/
│       └── generate-ssl-certs.ps1  # Generate self-signed certs
├── docker-compose.dev.yml          # Development with Nginx
├── docker-compose.prod.yml         # Production deployment
└── docs/
    └── SSL_CONFIGURATION.md        # This document
```
