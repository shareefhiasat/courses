# 🏗️ Infrastructure Documentation

> **Infrastructure setup and monitoring for Military LMS**
>
> **Docusaurus Source of Truth for Infrastructure**

---

## 📁 **Infrastructure Resources**

### **📊 Monitoring Stack**
- **[monitoring-stack.md](./monitoring-stack.md)** - Complete ELK Stack, Grafana, MongoDB replica set setup

### **📂 Collaboration Stack**
- **[nextcloud-integration.md](./nextcloud-integration.md)** - Partial Nextcloud adoption runbook with Keycloak SSO and LMS workflow orchestration

---

## 🎯 **Infrastructure Overview**

### **Docker Services**
| Service | Port | Purpose | URL |
|---------|------|---------|-----|
| MongoDB | 27017 | Database | localhost:27017 |
| Redis | 6379 | Cache | localhost:6379 |
| Keycloak | 8080 | Authentication | http://localhost:8080 |
| Nextcloud | 8085 | Files/Calendar/Collaboration | http://localhost:8085 |
| Collabora | 9980 | Office editing backend | http://localhost:9980 |
| Elasticsearch | 9200 | Log storage | http://localhost:9200 |
| Kibana | 5601 | Log visualization | http://localhost:5601 |
| Grafana | 3002 | Metrics dashboard | http://localhost:3002 |

### **Service Management**
```powershell
# Start all services
.\scripts\dev-start.ps1

# Start all services + Nextcloud/Collabora
$env:START_NEXTCLOUD="true"
.\scripts\dev-start.ps1

# Stop all services
docker-compose -f scripts/docker/docker-compose.dev.yml down

# Stop Nextcloud stack
docker-compose -f scripts/docker/docker-compose.nextcloud.yml down

# View logs
docker-compose -f scripts/docker/docker-compose.dev.yml logs -f

# Health checks
docker exec lms-mongodb mongosh --eval "db.adminCommand('ping')"
curl http://localhost:8080/health
```

---

## 📊 **Monitoring Stack**

### **ELK Stack**
- **Elasticsearch**: Log storage and search
- **Logstash**: Log processing pipeline
- **Kibana**: Log visualization
- **Access**: http://localhost:5601
- **Index Pattern**: `lms-logs-*`

### **Grafana**
- **Metrics**: System and application metrics
- **Access**: http://localhost:3002
- **Credentials**: admin/admin123
- **Datasources**: Prometheus, Elasticsearch

---

## 🚨 **Troubleshooting**

### **MongoDB Issues**
```bash
# Check replica set status
docker exec lms-mongodb mongosh --eval "rs.status()"

# Restart MongoDB
docker-compose restart mongodb
```

### **Keycloak Issues**
```bash
# Check Keycloak logs
docker logs lms-keycloak

# Restart Keycloak
docker-compose restart keycloak
```

### **Monitoring Issues**
```bash
# Check Elasticsearch
curl http://localhost:9200/_cluster/health

# Check Kibana
curl http://localhost:5601/api/status

# Check Grafana
curl http://localhost:3002/api/health
```

---

## 📋 **Infrastructure Checklist**

- [ ] All Docker services running
- [ ] MongoDB replica set initialized
- [ ] Keycloak accessible
- [ ] ELK stack operational
- [ ] Grafana accessible
- [ ] Monitoring dashboards configured

---

*Last Updated: 2026-03-21*
*Docusaurus Source of Truth for Infrastructure*
