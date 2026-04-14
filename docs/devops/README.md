# 🏗️ DevOps Documentation

> **Infrastructure, deployment, and operations for Military LMS**
>
> **Source of truth for all DevOps-related documentation**

---

## 📁 **Documentation Structure**

### **🔧 Infrastructure & Deployment**
- **[docker-setup.md](./docker-setup.md)** - Docker Compose configuration and service management
- **[ssl-configuration.md](./ssl-configuration.md)** - SSL/TLS setup for development and production
- **[production-deployment.md](./production-deployment.md)** - Production deployment guide with F5 and offline servers

### **� Authentication & Security**
- **[keycloak-setup.md](./keycloak-setup.md)** - Keycloak authentication service configuration
- **[keycloak-nextcloud-acl.md](./authentication/keycloak-nextcloud-acl.md)** - Nextcloud ACL integration with Keycloak

### **📂 Services Integration**
- **[nextcloud-integration.md](./nextcloud-integration.md)** - Nextcloud file storage and collaboration setup
- **[monitoring-stack.md](./monitoring-stack.md)** - ELK Stack, Grafana, and monitoring configuration

### **📊 Monitoring & Observability**
- **[monitoring-stack.md](./monitoring-stack.md)** - Complete ELK Stack, Grafana, Prometheus setup
- **[logging.md](./logging.md)** - Application logging and log aggregation

---

## 🎯 **Quick Start**

### **Development Environment**

```powershell
# Generate SSL certificates for local development
.\scripts\docker\generate-ssl-certs.ps1

# Start all infrastructure services
cd scripts\docker
docker-compose up -d nginx keycloak nextcloud app-db redis

# Start backend (in separate terminal)
cd backend
npm run dev

# Start frontend (in separate terminal)
cd client
pnpm dev
```

Access the application at:
- Frontend: `https://localhost` (via nginx)
- Backend API: `https://localhost/api/v1`
- Keycloak: `http://localhost:8080`
- Nextcloud: `http://localhost:8085`

### **Production Deployment**

See [production-deployment.md](./production-deployment.md) for detailed production setup.

---

## 📊 **Infrastructure Overview**

### **Docker Services**

| Service | Port | Purpose | Status |
|---------|------|---------|--------|
| Nginx | 80, 443 | Reverse proxy with SSL | Running |
| PostgreSQL (App) | 5432 | Application database | Running |
| PostgreSQL (Keycloak) | 5433 | Keycloak database | Running |
| PostgreSQL (Nextcloud) | - | Nextcloud database | Running |
| Redis | 6379 | Cache and session storage | Running |
| Nextcloud Redis | - | Nextcloud cache | Running |
| MinIO | 9000, 9001 | Object storage | Running |
| Keycloak | 8080 | Authentication | Running |
| Nextcloud | 8085 | Files/Collaboration | Running |
| Collabora | 9980 | Office editing | Running |
| Elasticsearch | 9200 | Log storage | Running |
| Logstash | 5000, 9600 | Log processing | Running |
| Kibana | 5601 | Log visualization | Running |
| Grafana | 3002 | Metrics dashboard | Running |
| Prometheus | 9091 | Metrics collection | Running |
| MailDev | 1080, 1025 | Email testing | Running |
| Allure | 5050, 4040 | Test reporting | Running |

### **Network Architecture**

```
Internet → F5 Load Balancer (Wildcard SSL) → Nginx (Docker) → Services
                                                   ├─ Backend (host)
                                                   ├─ Frontend (host)
                                                   ├─ Keycloak (docker)
                                                   └─ Nextcloud (docker)
```

**Development:**
- Backend/Frontend run on host machine (via npm/pnpm)
- Nginx proxies HTTPS to host services via `host.docker.internal`
- Infrastructure services (Keycloak, Nextcloud, etc.) run in Docker

**Production:**
- All services run in Docker
- F5 handles SSL termination with wildcard certificates
- Nginx runs on HTTP internally

---

## 🔧 **Service Management**

### **Docker Compose Commands**

```powershell
# Start all services
cd scripts\docker
docker-compose up -d

# Start specific services
docker-compose up -d nginx keycloak nextcloud app-db

# Stop all services
docker-compose down

# View logs
docker-compose logs -f nginx

# Restart service
docker-compose restart nginx

# Check service status
docker-compose ps
```

### **Health Checks**

```powershell
# Check Nginx
curl https://localhost/health

# Check Keycloak
curl http://localhost:8080/health

# Check Nextcloud
curl http://localhost:8085/status.php

# Check Elasticsearch
curl http://localhost:9200/_cluster/health

# Check Grafana
curl http://localhost:3002/api/health
```

---

## 🚨 **Troubleshooting**

### **Nginx Issues**

```powershell
# Check nginx logs
docker logs lms-nginx

# Restart nginx
docker-compose restart nginx

# Test nginx configuration
docker exec lms-nginx nginx -t
```

### **Keycloak Issues**

```powershell
# Check Keycloak logs
docker logs lms-keycloak

# Restart Keycloak
docker-compose restart keycloak

# Check database connection
docker exec lms-keycloak-db pg_isready -U keycloak
```

### **Nextcloud Issues**

```powershell
# Check Nextcloud logs
docker logs lms-nextcloud

# Restart Nextcloud
docker-compose restart nextcloud

# Check database
docker exec lms-nextcloud-db pg_isready -U nextcloud
```

### **Database Issues**

```powershell
# Check app database
docker exec lms-app-db pg_isready -U military_lms

# Restart database
docker-compose restart app-db

# Access database
docker exec -it lms-app-db psql -U military_lms -d military_lms
```

---

## 📋 **Infrastructure Checklist**

### **Development**
- [ ] SSL certificates generated
- [ ] Docker services running
- [ ] Backend running on host (port 8001)
- [ ] Frontend running on host (port 5174)
- [ ] Nginx proxying HTTPS to host services
- [ ] Keycloak accessible
- [ ] Nextcloud accessible

### **Production**
- [ ] F5 wildcard SSL configured
- [ ] Docker images built and exported
- [ ] Services deployed to offline server
- [ ] Nginx configured for HTTP (F5 handles SSL)
- [ ] Database migrations applied
- [ ] Monitoring dashboards configured
- [ ] Backup procedures in place

---

## 🔗 **Related Documentation**

- [Authentication Setup](../authentication/README.md) - Keycloak and authentication details
- [Database Setup](../database/README.md) - PostgreSQL database configuration
- [Component Documentation](../components/README.md) - Component architecture
- [API Documentation](../docs/api/creating-services.md) - API service creation guide

---

*Last Updated: 2026-04-14*
*Source of truth for DevOps documentation*
