# Production Deployment Guide

> **Production deployment for Military LMS on offline servers with F5 wildcard SSL**

---

## 🎯 **Architecture Overview**

### **Production Architecture**

```
Internet → F5 Load Balancer (Wildcard SSL) → Nginx (Docker) → Services
                                                   ├─ Backend (Docker)
                                                   ├─ Frontend (Docker)
                                                   ├─ Keycloak (Docker)
                                                   ├─ Nextcloud (Docker)
                                                   └─ PostgreSQL (Docker)
```

### **Key Differences from Development**

| Aspect | Development | Production |
|--------|-------------|------------|
| SSL | Self-signed certs | F5 wildcard certificates |
| Backend/Frontend | Run on host | Run in Docker |
| Nginx | HTTPS termination | HTTP only (F5 handles SSL) |
| Network | lms-network (172.28.0.0/16) | lms-network (172.28.0.0/16) |
| Access | localhost | Production domain |

---

## 📦 **Pre-Deployment Checklist**

- [ ] F5 wildcard SSL certificates installed by cyber team
- [ ] Production domain configured in DNS
- [ ] Offline server prepared with Docker installed
- [ ] Database backups created
- [ ] Environment variables documented
- [ ] Monitoring dashboards configured
- [ ] Backup procedures in place

---

## 🚀 **Deployment Steps**

### **1. Build Docker Images**

On the development machine (Windows):

```powershell
# Build backend image
cd backend
docker build -t lms-backend:prod -f Dockerfile.prod .

# Build frontend image
cd client
docker build -t lms-frontend:prod -f Dockerfile.prod .
```

### **2. Export Docker Images**

```powershell
# Export images to tar files
docker save lms-backend:prod -o lms-backend-prod.tar
docker save lms-frontend:prod -o lms-frontend-prod.tar
docker save postgres:15-alpine -o postgres-prod.tar
docker save postgres:16-alpine -o postgres-16-prod.tar
docker save nginx:alpine -o nginx-prod.tar
docker save redis:7-alpine -o redis-prod.tar
docker save nextcloud:29-apache -o nextcloud-prod.tar
docker save quay.io/keycloak/keycloak:26.0 -o keycloak-prod.tar
docker save collabora/code:24.04.12.3.1 -o collabora-prod.tar
```

### **3. Transfer to Offline Server**

```powershell
# Transfer tar files to offline server
# (Use USB drive, secure file transfer, etc.)
```

### **4. Load Images on Offline Server**

```bash
# Load images from tar files
docker load -i lms-backend-prod.tar
docker load -i lms-frontend-prod.tar
docker load -i postgres-prod.tar
docker load -i postgres-16-prod.tar
docker load -i nginx-prod.tar
docker load -i redis-prod.tar
docker load -i nextcloud-prod.tar
docker load -i keycloak-prod.tar
docker load -i collabora-prod.tar
```

### **5. Configure Environment Variables**

Create `.env.production`:

```env
# Database
POSTGRES_USER=military_lms
POSTGRES_PASSWORD=<secure_password>
POSTGRES_DB=military_lms

# Keycloak
KEYCLOAK_URL=https://keycloak.your-domain.com
KEYCLOAK_REALM=military-lms
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=<secure_password>

# Nextcloud
NEXTCLOUD_BASE_URL=https://nextcloud.your-domain.com
NEXTCLOUD_USERNAME=admin
NEXTCLOAK_APP_PASSWORD=<secure_password>

# Frontend
FRONTEND_URL=https://lms.your-domain.com
CORS_ORIGIN=https://lms.your-domain.com

# MinIO
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=<secure_password>
```

### **6. Deploy Services**

```bash
# Copy production docker-compose to server
scp docker-compose.prod.yml user@server:/path/to/lms/scripts/docker/

# Start services
cd /path/to/lms/scripts/docker
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🔧 **Production Docker Compose**

### **docker-compose.prod.yml**

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    container_name: lms-nginx
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf.production:/etc/nginx/nginx.conf:ro
    depends_on:
      - backend
      - frontend
    networks:
      - lms-network
    restart: unless-stopped

  app-db:
    image: postgres:15-alpine
    container_name: lms-app-db
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - app_db_data:/var/lib/postgresql/data
    networks:
      - lms-network
    restart: unless-stopped

  keycloak-db:
    image: postgres:15-alpine
    container_name: lms-keycloak-db
    environment:
      POSTGRES_DB: keycloak
      POSTGRES_USER: keycloak
      POSTGRES_PASSWORD: ${KEYCLOAK_DB_PASSWORD}
    volumes:
      - keycloak_db_data:/var/lib/postgresql/data
    networks:
      - lms-network
    restart: unless-stopped

  nextcloud-db:
    image: postgres:16-alpine
    container_name: lms-nextcloud-db
    environment:
      POSTGRES_DB: nextcloud
      POSTGRES_USER: nextcloud
      POSTGRES_PASSWORD: ${NEXTCLOUD_DB_PASSWORD}
    volumes:
      - nextcloud_db_data:/var/lib/postgresql/data
    networks:
      - lms-network
    restart: unless-stopped

  backend:
    image: lms-backend:prod
    container_name: lms-backend
    environment:
      NODE_ENV: production
      PORT: 8001
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@app-db:5432/${POSTGRES_DB}
      NEXTCLOUD_BASE_URL: ${NEXTCLOAK_BASE_URL}
      NEXTCLOUD_USERNAME: ${NEXTCLOAK_USERNAME}
      NEXTCLOAK_APP_PASSWORD: ${NEXTCLOAK_APP_PASSWORD}
      KEYCLOAK_URL: ${KEYCLOAK_URL}
      KEYCLOAK_REALM: ${KEYCLOAK_REALM}
      CORS_ORIGIN: ${CORS_ORIGIN}
      FRONTEND_URL: ${FRONTEND_URL}
    depends_on:
      - app-db
    networks:
      - lms-network
    restart: unless-stopped

  frontend:
    image: lms-frontend:prod
    container_name: lms-frontend
    environment:
      VITE_API_URL: /api/v1
      VITE_API_BASE_URL: /
      VITE_WS_URL: wss://${FRONTEND_URL}
      VITE_KEYCLOAK_URL: ${KEYCLOAK_URL}
      VITE_KEYCLOAK_REALM: ${KEYCLOAK_REALM}
    depends_on:
      - backend
    networks:
      - lms-network
    restart: unless-stopped

  # Add other services as needed (Keycloak, Nextcloud, etc.)

volumes:
  app_db_data:
  keycloak_db_data:
  nextcloud_db_data:

networks:
  lms-network:
    driver: bridge
```

---

## 🔐 **F5 Configuration**

### **SSL Offload**

F5 handles SSL termination with wildcard certificates:

1. **Create SSL Profile**
   - Use wildcard certificate provided by cyber team
   - Enable TLS 1.2 and 1.3
   - Configure cipher suites

2. **Create Pool**
   - Add Nginx container IP address
   - Port 80 (HTTP)
   - Health check: `/health`

3. **Create Virtual Server**
   - IP: Production IP
   - Port: 443 (HTTPS)
   - SSL Profile: Created above
   - Pool: Nginx pool
   - Default pool: Nginx pool

4. **Configure iRules** (if needed)
   - Redirect HTTP to HTTPS
   - Add security headers

---

## 🔄 **Database Migrations**

### **Run Migrations on Production**

```bash
# Access backend container
docker exec -it lms-backend bash

# Run Prisma migrations
npx prisma migrate deploy

# Seed database (if needed)
npx prisma db seed
```

### **Backup Database**

```bash
# Backup app database
docker exec lms-app-db pg_dump -U military_lms military_lms > backup.sql

# Backup keycloak database
docker exec lms-keycloak-db pg_dump -U keycloak keycloak > keycloak-backup.sql
```

---

## 📊 **Monitoring Setup**

### **Configure Grafana Dashboards**

1. Access Grafana: `http://your-server:3002`
2. Add Prometheus datasource
3. Import pre-configured dashboards
4. Set up alerts

### **Configure Kibana**

1. Access Kibana: `http://your-server:5601`
2. Create index pattern: `lms-logs-*`
3. Configure log parsing
4. Set up alerts

---

## 🚨 **Troubleshooting**

### **Service Won't Start**

```bash
# Check logs
docker logs lms-backend
docker logs lms-frontend
docker logs lms-nginx

# Check container status
docker-compose ps

# Restart service
docker-compose restart backend
```

### **Database Connection Issues**

```bash
# Check database is running
docker exec lms-app-db pg_isready -U military_lms

# Test connection from backend
docker exec lms-backend ping app-db
```

### **SSL Certificate Issues**

- Verify F5 SSL profile is configured
- Check certificate validity
- Verify F5 health checks are passing

---

## 📋 **Post-Deployment Checklist**

- [ ] All services running
- [ ] Database migrations applied
- [ ] Keycloak accessible via F5
- [ ] Frontend accessible via F5
- [ ] Backend API accessible via F5
- [ ] Nextcloud accessible via F5
- [ ] Monitoring dashboards operational
- [ ] Health checks passing
- [ ] Backup procedures tested
- [ ] Log aggregation working
- [ ] SSL certificate valid

---

## 🔗 **Related Documentation**

- [SSL Configuration](./ssl-configuration.md) - F5 wildcard SSL setup
- [Docker Setup](./docker-setup.md) - Docker service management
- [Keycloak Setup](./keycloak-setup.md) - Keycloak configuration
- [Monitoring Stack](./monitoring-stack.md) - Monitoring configuration

---

*Last Updated: 2026-04-14*
