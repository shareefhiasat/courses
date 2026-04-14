# Docker Setup Guide

> **Docker Compose configuration and service management for Military LMS**

---

## 📁 **Docker Configuration Location**

All Docker configuration is centralized in `scripts/docker/`:
- `docker-compose.yml` - Unified Docker Compose with all services
- `nginx/nginx.conf` - Nginx reverse proxy configuration
- `nginx/ssl/` - SSL certificates (generated locally for dev)
- `keycloak-setup/` - Keycloak realm configuration

---

## 🎯 **Architecture**

### **Development Architecture**

```
Host Machine
├── Backend (npm run dev) - Port 8001
├── Frontend (pnpm dev) - Port 5174
└── Docker Services
    ├── Nginx (HTTPS proxy) - Ports 80, 443
    ├── PostgreSQL (App DB) - Port 5432
    ├── PostgreSQL (Keycloak DB) - Port 5433
    ├── PostgreSQL (Nextcloud DB) - Internal
    ├── Redis - Port 6379
    ├── Nextcloud Redis - Internal
    ├── MinIO - Ports 9000, 9001
    ├── Keycloak - Port 8080
    ├── Nextcloud - Port 8085
    ├── Collabora - Port 9980
    ├── Elasticsearch - Port 9200
    ├── Logstash - Ports 5000, 9600
    ├── Kibana - Port 5601
    ├── Grafana - Port 3002
    ├── Prometheus - Port 9091
    ├── MailDev - Ports 1080, 1025
    └── Allure - Ports 5050, 4040
```

### **Network Configuration**

All services are on a single Docker network `lms-network` (subnet: 172.28.0.0/16) for easy communication.

---

## 🚀 **Getting Started**

### **Prerequisites**

- Docker Desktop for Windows
- PowerShell 7+
- OpenSSL (for SSL certificate generation)

### **Initial Setup**

```powershell
# 1. Generate SSL certificates for local development
.\scripts\docker\generate-ssl-certs.ps1

# 2. Start infrastructure services
cd scripts\docker
docker-compose up -d nginx keycloak nextcloud app-db redis

# 3. Start backend (in separate terminal)
cd backend
npm run dev

# 4. Start frontend (in separate terminal)
cd client
pnpm dev
```

### **Access Points**

After starting services:

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | https://localhost | - |
| Backend API | https://localhost/api/v1 | - |
| Keycloak Admin | http://localhost:8080/admin | admin/admin123 |
| Keycloak Realm | http://localhost:8080/realms/military-lms | - |
| Nextcloud | http://localhost:8085 | admin/admin123 |
| MinIO Console | http://localhost:9001 | minioadmin/minioadmin |
| Grafana | http://localhost:3002 | admin/admin123 |
| Kibana | http://localhost:5601 | - |
| MailDev | http://localhost:1080 | - |
| Allure | http://localhost:5050 | - |

---

## 🔧 **Service Management**

### **Start Services**

```powershell
# Start all services
cd scripts\docker
docker-compose up -d

# Start specific services
docker-compose up -d nginx keycloak nextcloud app-db

# Start with detached mode (background)
docker-compose up -d
```

### **Stop Services**

```powershell
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Stop specific service
docker-compose stop nginx
```

### **View Logs**

```powershell
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f nginx
docker-compose logs -f keycloak

# View last 100 lines
docker-compose logs --tail=100 nginx
```

### **Restart Services**

```powershell
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart nginx
```

### **Service Status**

```powershell
# Check status of all services
docker-compose ps

# Check resource usage
docker stats
```

---

## 🐳 **Docker Compose Services**

### **Core Services**

| Service | Image | Purpose | Dependencies |
|---------|-------|---------|--------------|
| nginx | nginx:alpine | Reverse proxy with SSL | keycloak, nextcloud |
| app-db | postgres:15-alpine | Application database | - |
| keycloak-db | postgres:15-alpine | Keycloak database | - |
| nextcloud-db | postgres:16-alpine | Nextcloud database | - |

### **Cache & Storage**

| Service | Image | Purpose |
|---------|-------|---------|
| redis | redis:7-alpine | Cache and session storage |
| nextcloud-redis | redis:7-alpine | Nextcloud cache |
| minio | minio/minio:latest | Object storage |

### **Authentication & Collaboration**

| Service | Image | Purpose |
|---------|-------|---------|
| keycloak | quay.io/keycloak/keycloak:26.0 | Authentication |
| nextcloud | nextcloud:29-apache | File storage & collaboration |
| collabora | collabora/code:24.04.12.3.1 | Office editing |

### **Monitoring & Logging**

| Service | Image | Purpose |
|---------|-------|---------|
| elasticsearch | docker.elastic.co/elasticsearch:8.11.0 | Log storage |
| logstash | docker.elastic.co/logstash/logstash:8.11.0 | Log processing |
| kibana | docker.elastic.co/kibana/kibana:8.11.0 | Log visualization |
| grafana | grafana/grafana:10.2.0 | Metrics dashboard |
| prometheus | prom/prometheus:v2.48.0 | Metrics collection |

### **Development Tools**

| Service | Image | Purpose |
|---------|-------|---------|
| maildev | maildev/maildev:latest | Email testing |
| allure | frankescobar/allure-docker-service:latest | Test reporting |

---

## 🔐 **SSL Certificates**

### **Local Development**

Self-signed certificates are generated automatically:

```powershell
.\scripts\docker\generate-ssl-certs.ps1
```

This creates:
- `scripts/docker/nginx/ssl/cert.pem` - SSL certificate
- `scripts/docker/nginx/ssl/key.pem` - Private key

**Note**: Your browser will show a security warning. This is expected for self-signed certificates.

### **Production**

Production uses F5 wildcard SSL certificates. See [ssl-configuration.md](./ssl-configuration.md) for details.

---

## 🚨 **Troubleshooting**

### **Port Conflicts**

If you see "port is already allocated" errors:

```powershell
# Check what's using the port
netstat -ano | findstr :8080

# Stop conflicting service
docker stop <container-name>

# Or change port in docker-compose.yml
```

### **Network Conflicts**

If you see "pool overlaps with other one on this address space":

```powershell
# Remove old networks
docker network prune

# Or change subnet in docker-compose.yml
```

### **Container Won't Start**

```powershell
# Check logs
docker logs <container-name>

# Check container status
docker ps -a

# Restart container
docker restart <container-name>
```

### **Volume Issues**

```powershell
# Remove volumes (WARNING: This deletes data)
docker-compose down -v

# Rebuild from scratch
docker-compose down -v
docker-compose up -d
```

---

## 📋 **Health Checks**

### **Manual Health Checks**

```powershell
# Nginx
curl https://localhost/health

# Keycloak
curl http://localhost:8080/health

# Nextcloud
curl http://localhost:8085/status.php

# Elasticsearch
curl http://localhost:9200/_cluster/health

# Grafana
curl http://localhost:3002/api/health
```

### **Docker Health Checks**

All services have built-in health checks. View status:

```powershell
docker-compose ps
```

---

## 🔄 **Updating Services**

### **Pull Latest Images**

```powershell
cd scripts\docker
docker-compose pull
docker-compose up -d
```

### **Rebuild Services**

```powershell
# Rebuild specific service
docker-compose build nginx
docker-compose up -d nginx

# Rebuild all
docker-compose build
docker-compose up -d
```

---

## 📊 **Resource Management**

### **View Resource Usage**

```powershell
# View all containers
docker stats

# View specific container
docker stats lms-nginx
```

### **Clean Up**

```powershell
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Remove everything not in use
docker system prune -a
```

---

## 🔗 **Related Documentation**

- [SSL Configuration](./ssl-configuration.md) - SSL/TLS setup
- [Production Deployment](./production-deployment.md) - Production deployment guide
- [Keycloak Setup](./keycloak-setup.md) - Keycloak configuration
- [Nextcloud Integration](./nextcloud-integration.md) - Nextcloud setup

---

*Last Updated: 2026-04-14*
