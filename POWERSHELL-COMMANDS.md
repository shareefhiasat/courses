# 🔧 PowerShell Commands for Military LMS

## 📋 Complete Docker Lifecycle Commands

### 🚀 **Start Everything (Fresh)**
```powershell
# From project root
cd E:\QAF\Github\courses

# Stop everything first (clean start)
docker-compose -f scripts/docker/docker-compose.dev.yml down -v

# Clean up containers and networks
docker system prune -f

# Start everything
.\scripts\dev-start.ps1
```

### 🛑 **Stop Everything**
```powershell
# Stop all services gracefully
docker-compose -f scripts/docker/docker-compose.dev.yml down

# Stop with volume cleanup (removes data)
docker-compose -f scripts/docker/docker-compose.dev.yml down -v

# Force stop and remove everything
docker-compose -f scripts/docker/docker-compose.dev.yml down -v --rmi all
docker system prune -f
```

### 🔄 **Restart Services**
```powershell
# Restart all services
docker-compose -f scripts/docker/docker-compose.dev.yml restart

# Restart specific service
docker-compose -f scripts/docker/docker-compose.dev.yml restart mongodb
docker-compose -f scripts/docker/docker-compose.dev.yml restart elasticsearch
docker-compose -f scripts/docker/docker-compose.dev.yml restart kibana
```

### 📊 **View Services Status**
```powershell
# Show all containers
docker-compose -f scripts/docker/docker-compose.dev.yml ps

# Show running containers only
docker ps

# Show all containers (including stopped)
docker ps -a
```

### 📝 **View Logs**
```powershell
# View all logs (follow)
docker-compose -f scripts/docker/docker-compose.dev.yml logs -f

# View specific service logs
docker-compose -f scripts/docker/docker-compose.dev.yml logs -f mongodb
docker-compose -f scripts/docker/docker-compose.dev.yml logs -f elasticsearch
docker-compose -f scripts/docker/docker-compose.dev.yml logs -f kibana
docker-compose -f scripts/docker/docker-compose.dev.yml logs -f grafana
docker-compose -f scripts/docker/docker-compose.dev.yml logs -f logstash

# View last 100 lines of logs
docker-compose -f scripts/docker/docker-compose.dev.yml logs --tail=100 mongodb
```

### 🔧 **Access Containers**
```powershell
# Access MongoDB shell
docker exec -it courses-mongodb mongosh

# Access Redis CLI
docker exec -it courses-redis redis-cli -a redis123

# Access container bash
docker exec -it courses-mongodb bash
docker exec -it courses-elasticsearch bash
```

### 🧹 **Clean Up Commands**
```powershell
# Clean up unused containers, networks, images
docker system prune -f

# Clean up unused volumes
docker volume prune -f

# Clean up everything (including unused images)
docker system prune -a -f

# Remove specific containers by force
docker rm -f courses-mongodb courses-redis courses-minio courses-keycloak

# Remove specific networks
docker network rm courses_lms-network
```

### 🏥 **Health Checks**
```powershell
# Check MongoDB
docker exec courses-mongodb mongosh --eval "db.adminCommand('ping')"

# Check MongoDB replica set
docker exec courses-mongodb mongosh --eval "rs.status()"

# Check Redis
docker exec courses-redis redis-cli ping

# Check Elasticsearch
curl http://localhost:9200/_cluster/health

# Check Kibana
curl http://localhost:5601/api/status

# Check Grafana
curl http://localhost:3001/api/health
```

### 🌐 **Service URLs**
```powershell
# Open in browser
Start-Process "http://localhost:5174"          # Frontend
Start-Process "https://localhost:3000"        # API Server
Start-Process "https://localhost:3000/api-docs" # Swagger
Start-Process "http://localhost:5601"          # Kibana
Start-Process "http://localhost:3001"          # Grafana
Start-Process "http://localhost:9090"          # Prometheus
Start-Process "http://localhost:1080"          # MailDev
Start-Process "http://localhost:9000"          # MinIO
Start-Process "http://localhost:8080"          # Keycloak
```

### 📱 **Application Commands**
```powershell
# Start only API server
cd client
pnpm run api

# Start only frontend
cd client
pnpm run dev

# Database operations
pnpm run db:generate
pnpm run db:studio
pnpm run db:push
pnpm run db:reset

# Build for production
pnpm run build
```

### 🔍 **Troubleshooting Commands**
```powershell
# Check Docker daemon
docker info
docker version

# Check network issues
docker network ls
docker network inspect courses_lms-network

# Check volume issues
docker volume ls
docker volume inspect mongodb_dev_data

# Check container resources
docker stats

# Check container details
docker inspect courses-mongodb
```

### 🎯 **Testing Commands**
```powershell
# Test API health
curl https://localhost:3000/api/v1/health

# Test categories API
curl https://localhost:3000/api/v1/categories

# Test with API key
curl -H "x-api-key: dev-api-key-123" https://localhost:3000/api/v1/categories

# Test MongoDB connection
docker exec courses-mongodb mongosh --eval "db.getMongo()"

# Test Redis connection
docker exec courses-redis redis-cli -a redis123 ping
```

---

## 🚨 **Common Issues & Solutions**

### **Network Overlap Error**
```powershell
# Solution: Clean up networks and containers
docker-compose -f scripts/docker/docker-compose.dev.yml down -v
docker network rm courses_lms-network
docker system prune -f
.\scripts\dev-start.ps1
```

### **Port Already in Use**
```powershell
# Find what's using the port
netstat -ano | findstr :3000
netstat -ano | findstr :5174
netstat -ano | findstr :27017

# Kill the process
taskkill /PID <PID> /F
```

### **Container Won't Start**
```powershell
# Check container logs
docker logs courses-mongodb
docker logs courses-elasticsearch

# Remove and recreate
docker rm courses-mongodb
docker-compose -f scripts/docker/docker-compose.dev.yml up -d mongodb
```

### **Services Not Ready**
```powershell
# Wait and check again
Start-Sleep -Seconds 30
docker-compose -f scripts/docker/docker-compose.dev.yml ps

# Check individual service
docker-compose -f scripts/docker/docker-compose.dev.yml logs mongodb
```

---

## 📋 **Quick Reference**

| Command | Purpose |
|---------|---------|
| `.\scripts\dev-start.ps1` | Start everything |
| `docker-compose down` | Stop everything |
| `docker-compose restart` | Restart services |
| `docker-compose logs -f` | View logs |
| `docker ps` | Show containers |
| `docker system prune -f` | Clean up |

---

## 🎯 **Best Practices**

1. **Always stop before starting:** `docker-compose down` before `.\scripts\dev-start.ps1`
2. **Check logs if something fails:** `docker logs [service-name]`
3. **Use fresh start for issues:** `docker-compose down -v && docker system prune -f`
4. **Monitor resources:** `docker stats` for performance
5. **Access services via URLs:** Don't use localhost inside containers

---

## 🎉 **Complete Workflow**

```powershell
# 1. Clean start (recommended)
docker-compose -f scripts/docker/docker-compose.dev.yml down -v
docker system prune -f
.\scripts\dev-start.ps1

# 2. Test services
curl https://localhost:3000/api/v1/health
Start-Process "http://localhost:5174"
Start-Process "http://localhost:5601"

# 3. Work on your application...

# 4. Stop when done
docker-compose -f scripts/docker/docker-compose.dev.yml down
```

**This is your complete PowerShell command reference!** 🚀
