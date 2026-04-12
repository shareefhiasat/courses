# 📊 Monitoring & Database Setup Guide

## 🎯 **Overview**

Complete offline solution for Military LMS with:
- **MongoDB Replica Set** - Production-ready database with transactions
- **ELK Stack** - Elasticsearch, Logstash, Kibana for logging
- **Grafana + Prometheus** - Metrics visualization and collection
- **100% Offline** - No internet required, all Docker-based

---

## 🗄️ **MongoDB Replica Set Setup**

### **Quick Setup (5 Minutes)**

#### **Step 1: Stop Current MongoDB**
```powershell
# If you have MongoDB running locally, stop it
net stop MongoDB
```

#### **Step 2: Start MongoDB Replica Set with Docker**
```powershell
cd E:\QAF\Github\courses
docker-compose -f scripts/docker/docker-compose.dev.yml up -d mongodb
```

#### **Step 3: Wait for Replica Set Initialization**
```powershell
# Check logs to see when replica set is ready
docker logs lms-mongodb -f
```

You should see:
```
✅ MongoDB initialized successfully
Database: lms_dev
```

#### **Step 4: Update Connection String**
```env
# .env or .env.local
DATABASE_URL="mongodb://admin:admin123@localhost:27017/lms_dev?authSource=admin&replicaSet=rs0"
```

**Key part:** `replicaSet=rs0` enables Prisma transactions

#### **Step 5: Verify Replica Set**
```powershell
docker exec lms-mongodb mongosh --eval "rs.status()"
```

Expected output:
```json
{
  "set": "rs0",
  "myState": 1,
  "stateStr": "PRIMARY",
  "members": [
    {
      "name": "localhost:27017",
      "health": 1,
      "stateStr": "PRIMARY"
    }
  ]
}
```

---

## 🏗️ **Monitoring Architecture**

```
Winston Logger (API Server)
    ↓ TCP:5000
Logstash (Log Processing)
    ↓
Elasticsearch (Storage)
    ↓
Kibana (Visualization)

Prometheus (Metrics Collection)
    ↓
Grafana (Visualization)
```

---

## 📦 **Services Included**

### **1. ELK Stack (Logging)**

#### **Elasticsearch**
- **Purpose:** Search and analytics engine for logs
- **Port:** `9200` (API), `9300` (Node communication)
- **URL:** http://localhost:9200
- **Memory:** 512MB heap
- **Index Pattern:** `lms-logs-YYYY.MM.dd`

#### **Logstash**
- **Purpose:** Log processing pipeline
- **Port:** `5000` (TCP/UDP for Winston), `9600` (API)
- **Input:** Winston logger via TCP
- **Output:** Elasticsearch
- **Features:**
  - JSON parsing
  - Log level normalization
  - Error tagging
  - API request tracking
  - Database operation tracking

#### **Kibana**
- **Purpose:** Log visualization and search
- **Port:** `5601`
- **URL:** http://localhost:5601
- **Features:**
  - Real-time log streaming
  - Advanced search and filtering
  - Dashboard creation
  - Log pattern analysis

---

### **2. Grafana + Prometheus (Metrics)**

#### **Prometheus**
- **Purpose:** Metrics collection and storage
- **Port:** `9090`
- **URL:** http://localhost:9090
- **Scrape Interval:** 15s
- **Targets:**
  - API Server metrics (port 3000)
  - MongoDB metrics (via exporter)
  - Redis metrics (via exporter)
  - Docker container metrics

#### **Grafana**
- **Purpose:** Metrics visualization
- **Port:** `3001`
- **URL:** http://localhost:3001
- **Credentials:** admin / admin123
- **Datasources:**
  - Prometheus (metrics)
  - Elasticsearch (logs)
- **Features:**
  - Pre-configured dashboards
  - Real-time metrics
  - Alerting
  - Multi-datasource support

---

## 🚀 **Quick Start**

### **Start All Services:**
```powershell
cd E:\QAF\Github\courses
.\scripts\dev-start.ps1
```

### **Access Dashboards:**
```
Kibana:     http://localhost:5601
Grafana:    http://localhost:3001
Prometheus: http://localhost:9090
```

---

## 🔧 **Winston Logger Configuration**

### **Install Dependencies:**
```bash
cd client
pnpm add winston winston-logstash
```

### **Logger Setup:**
```javascript
// client/src/utils/logger.js
const winston = require('winston');
const LogstashTransport = require('winston-logstash/lib/winston-logstash-latest');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'military-lms',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Console output
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // Logstash TCP transport
    new LogstashTransport({
      port: 5000,
      host: 'localhost',
      node_name: 'api-server',
      max_connect_retries: -1
    }),
    
    // File transport (backup)
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
});

module.exports = logger;
```

### **Usage in API:**
```javascript
// In your API routes
const logger = require('../utils/logger');

// Log API requests
logger.info('API Request', {
  method: req.method,
  url: req.url,
  ip: req.ip,
  userId: req.user?.id
});

// Log errors
logger.error('Database Error', {
  error: error.message,
  stack: error.stack,
  operation: 'getCategories',
  collection: 'categories'
});

// Log database operations
logger.debug('Database Operation', {
  operation: 'findMany',
  collection: 'categories',
  duration: 45
});
```

---

## 📊 **Kibana Setup**

### **1. Create Index Pattern:**
1. Open Kibana: http://localhost:5601
2. Go to **Management** → **Stack Management** → **Index Patterns**
3. Click **Create index pattern**
4. Enter: `lms-logs-*`
5. Select time field: `@timestamp`
6. Click **Create**

### **2. Discover Logs:**
1. Go to **Discover**
2. Select `lms-logs-*` index
3. Use filters:
   - `level: ERROR` - Show only errors
   - `tags: api-request` - Show API requests
   - `tags: database-operation` - Show DB operations

### **3. Create Dashboards:**
1. Go to **Dashboard** → **Create dashboard**
2. Add visualizations:
   - **Error Rate** - Count of ERROR level logs
   - **API Response Times** - Average response time
   - **Top Errors** - Most common error messages
   - **Request Volume** - Requests per minute

---

## 📈 **Grafana Setup**

### **1. Login:**
- URL: http://localhost:3001
- Username: `admin`
- Password: `admin123`

### **2. Datasources (Auto-configured):**
- **Prometheus** - Metrics (default)
- **Elasticsearch** - Logs

### **3. Create Dashboards:**

#### **API Performance Dashboard:**
- Request rate
- Response time (p50, p95, p99)
- Error rate
- Active connections

#### **Database Dashboard:**
- Query duration
- Connection pool usage
- Operations per second
- Slow queries

#### **System Dashboard:**
- CPU usage
- Memory usage
- Disk I/O
- Network traffic

---

## 🎯 **Offline Alternatives to SaaS Tools**

### **✅ Included (100% Offline):**

| SaaS Tool | Offline Alternative | Purpose |
|-----------|-------------------|---------|
| **Loggly** | **Kibana + Elasticsearch** | Log aggregation and search |
| **Sentry** | **Kibana + Custom Error Tracking** | Error tracking and monitoring |
| **PostHog** | **Grafana + Prometheus** | Product analytics and metrics |
| **Datadog** | **Grafana + Prometheus + Kibana** | Full-stack monitoring |
| **New Relic** | **Grafana + Prometheus** | Application performance monitoring |

### **📦 Additional Tools (Optional):**

#### **1. Jaeger (Distributed Tracing):**
```yaml
jaeger:
  image: jaegertracing/all-in-one:1.51
  ports:
    - "16686:16686"  # UI
    - "14268:14268"  # Collector
```

#### **2. Portainer (Docker Management):**
```yaml
portainer:
  image: portainer/portainer-ce:latest
  ports:
    - "9443:9443"
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock
```

#### **3. cAdvisor (Container Metrics):**
```yaml
cadvisor:
  image: gcr.io/cadvisor/cadvisor:latest
  ports:
    - "8080:8080"
  volumes:
    - /:/rootfs:ro
    - /var/run:/var/run:ro
    - /sys:/sys:ro
    - /var/lib/docker/:/var/lib/docker:ro
```

---

## 🔍 **Log Queries Examples**

### **Kibana Query Language (KQL):**

```
# All errors in last hour
level: ERROR AND @timestamp >= now-1h

# API errors
level: ERROR AND tags: api-request

# Slow database queries
tags: database-operation AND duration > 1000

# Specific user activity
userId: "12345" AND @timestamp >= now-24h

# Failed authentication
message: "authentication failed"
```

---

## 📊 **Prometheus Queries (PromQL):**

```
# Request rate
rate(http_requests_total[5m])

# Error rate
rate(http_requests_total{status=~"5.."}[5m])

# Average response time
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Memory usage
process_resident_memory_bytes / 1024 / 1024

# Active connections
mongodb_connections{state="current"}
```

---

## 🛠️ **Useful Commands**

### **View Logs:**
```bash
# Elasticsearch logs
docker logs courses-elasticsearch

# Logstash logs
docker logs courses-logstash

# Kibana logs
docker logs courses-kibana
```

### **Check Health:**
```bash
# Elasticsearch cluster health
curl http://localhost:9200/_cluster/health

# Logstash health
curl http://localhost:9600

# Prometheus targets
curl http://localhost:9090/api/v1/targets
```

### **Query Elasticsearch:**
```bash
# Get all indices
curl http://localhost:9200/_cat/indices

# Search logs
curl -X GET "http://localhost:9200/lms-logs-*/_search?pretty" -H 'Content-Type: application/json' -d'
{
  "query": {
    "match": {
      "level": "ERROR"
    }
  }
}'
```

---

## 🎯 **Benefits**

### **✅ 100% Offline:**
- No internet required
- All data stays on your server
- Full control over data

### **✅ Cost-Free:**
- No SaaS subscriptions
- No per-user fees
- No data volume limits

### **✅ Production-Ready:**
- Battle-tested tools
- Scalable architecture
- Enterprise-grade features

### **✅ Complete Observability:**
- Logs (Kibana)
- Metrics (Grafana)
- Traces (Jaeger - optional)
- Errors (Kibana)
- Performance (Grafana)

---

## 📋 **Port Summary**

```
MongoDB:        27017
Redis:          6379
MinIO:          9000, 9001
Keycloak:       8080
PostgreSQL:     5432
Elasticsearch:  9200, 9300
Logstash:       5000, 9600
Kibana:         5601
Grafana:        3001
Prometheus:     9090
API Server:     3000
Frontend:       5174
```

---

## 🚀 **Next Steps**

1. **Start services:** `.\scripts\dev-start.ps1`
2. **Configure Winston logger** in API server
3. **Create Kibana index pattern:** `lms-logs-*`
4. **Build Grafana dashboards** for metrics
5. **Set up alerts** for critical errors
6. **Test logging** with sample API requests

**Your complete offline monitoring stack is ready!** 🎉
