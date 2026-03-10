# 🎯 Military LMS - Complete Setup & Operations Guide

## 📋 Table of Contents

1. [🏗️ Architecture Overview](#-architecture-overview)
2. [🚀 Quick Start](#-quick-start)
3. [📦 Offline Server Setup](#-offline-server-setup)
4. [🐳 Docker Services Management](#-docker-services-management)
5. [📊 Monitoring & Logging Stack](#-monitoring--logging-stack)
6. [🔧 Development Workflow](#-development-workflow)
7. [📡 API Documentation & Swagger](#-api-documentation--swagger)
8. [🗄️ Database Setup](#-database-setup)
9. [📧 Email Development](#-email-development)
10. [🛠️ Troubleshooting](#️-troubleshooting)

---

## 🏗️ Architecture Overview

### Modern Full-Stack LMS Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    SINGLE VITE BUILD                         │
├─────────────────────────────────────────────────────────────┤
│  React Frontend + Database Services (Prisma + MongoDB)      │
│  ├── Components: React UI Components                        │
│  ├── Business Logic: Service Layer                          │
│  ├── Database Layer: Prisma ORM                             │
│  ├── API Routes: Next.js API Routes                          │
│  └── Build Output: Static Files + Bundle                    │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   Infrastructure  │
                    │  (Docker Only)    │
                    │ ├── MongoDB       │
                    │ ├── Redis         │
                    │ ├── MinIO         │
                    │ ├── Keycloak      │
                    │ ├── ELK Stack     │
                    │ ├── Grafana       │
                    │ ├── Prometheus    │
                    │ └── MailDev       │
                    └───────────────────┘
```

### 🎯 Key Features
- ✅ **Single Build**: Frontend + backend in one package
- ✅ **100% Offline**: No internet required for operations
- ✅ **Complete Monitoring**: ELK + Grafana + Prometheus
- ✅ **MongoDB Replica Set**: Production-ready with transactions
- ✅ **Winston Logging**: Structured logging with ELK integration
- ✅ **Swagger API**: Auto-generated API documentation
- ✅ **Email Development**: MailDev for offline email testing
- ✅ **Enterprise Security**: Rate limiting, sanitization, JWT auth
- ✅ **Centralized Middleware**: Security, logging, error handling
- ✅ **Debug Levels**: ERROR, WARN, INFO, DEBUG, TRACE
- ✅ **Service Templates**: Quick scaffolding for new APIs
- ✅ **Documentation Site**: Docusaurus with Swagger integration

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Git
- PowerShell (Windows) or Bash (Linux/Mac)

### 1. Start Everything (Recommended)
```powershell
# Windows
cd E:\QAF\Github\courses
.\scripts\dev-start.ps1

# Linux/Mac
cd /path/to/courses
./scripts/dev-start.sh
```

**This starts:**
- Infrastructure: MongoDB, Redis, MinIO, Keycloak, PostgreSQL
- Monitoring: Elasticsearch, Logstash, Kibana, Grafana, Prometheus
- Development: API Server, Frontend
- Email: MailDev

### 2. Access Services
| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | https://localhost:5174 | - |
| **API Server** | https://localhost:3000 | - |
| **Swagger Docs** | https://localhost:3000/api-docs | - |
| **Documentation** | http://localhost:3001 | - |
| **Kibana (Logs)** | http://localhost:5601 | - |
| **Grafana (Metrics)** | http://localhost:3002 | admin/admin123 |
| **Prometheus** | http://localhost:9091 | - |
| **MailDev** | http://localhost:1080 | - |
| **MinIO** | http://localhost:9000 | minioadmin/minioadmin |
| **Keycloak** | http://localhost:8080 | admin/admin123 |

---

## 📦 Offline Server Setup

### Export Docker Images for Offline Deployment

#### 1. Export All Images
```powershell
# Create export directory
mkdir E:\QAF\Github\courses\offline-images

# Export all required images
docker save -o offline-images/mongodb.tar mongo:7.0
docker save -o offline-images/redis.tar redis:7-alpine
docker save -o offline-images/minio.tar minio/minio:latest
docker save -o offline-images/keycloak.tar quay.io/keycloak/keycloak:26.0
docker save -o offline-images/postgres.tar postgres:15-alpine
docker save -o offline-images/elasticsearch.tar docker.elastic.co/elasticsearch/elasticsearch:8.11.0
docker save -o offline-images/logstash.tar docker.elastic.co/logstash/logstash:8.11.0
docker save -o offline-images/kibana.tar docker.elastic.co/kibana/kibana:8.11.0
docker save -o offline-images/grafana.tar grafana/grafana:10.2.0
docker save -o offline-images/prometheus.tar prom/prometheus:v2.48.0
docker save -o offline-images/maildev.tar maildev/maildev:latest
```

#### 2. Compress for Transfer
```powershell
# Create compressed archive
cd offline-images
tar -czf ../military-lms-offline-images.tar.gz *.tar
```

#### 3. Transfer to Offline Server
```bash
# Copy to offline server (via USB, network, etc.)
scp military-lms-offline-images.tar.gz user@offline-server:/tmp/
```

#### 4. Load Images on Offline Server
```bash
# Extract and load images
cd /tmp
tar -xzf military-lms-offline-images.tar.gz
docker load -i mongodb.tar
docker load -i redis.tar
docker load -i minio.tar
docker load -i keycloak.tar
docker load -i postgres.tar
docker load -i elasticsearch.tar
docker load -i logstash.tar
docker load -i kibana.tar
docker load -i grafana.tar
docker load -i prometheus.tar
docker load -i maildev.tar

# Verify images
docker images
```

#### 5. Deploy on Offline Server
```bash
# Copy project files
scp -r /path/to/courses user@offline-server:/opt/

# Start services
cd /opt/courses
./scripts/dev-start.sh
```

### ❌ No Harbor Registry Needed!
**You don't need Harbor or any image registry for offline deployment.** The Docker image save/load method above works perfectly for single-server deployments.

---

## 🐳 Docker Services Management

### Start Services
```powershell
# Start all services
.\scripts\dev-start.ps1

# Start only infrastructure
docker-compose -f scripts/docker/docker-compose.dev.yml up -d

# Start specific services
docker-compose -f scripts/docker/docker-compose.dev.yml up -d mongodb redis
```

### Stop Services
```powershell
# Stop all services
docker-compose -f scripts/docker/docker-compose.dev.yml down

# Stop with volume cleanup
docker-compose -f scripts/docker/docker-compose.dev.yml down -v

# Stop and remove everything
docker-compose -f scripts/docker/docker-compose.dev.yml down -v --rmi all
```

### Restart Services
```powershell
# Restart all services
docker-compose -f scripts/docker/docker-compose.dev.yml restart

# Restart specific service
docker-compose -f scripts/docker/docker-compose.dev.yml restart mongodb
```

### View Logs
```powershell
# View all logs
docker-compose -f scripts/docker/docker-compose.dev.yml logs -f

# View specific service logs
docker-compose -f scripts/docker/docker-compose.dev.yml logs -f mongodb
docker-compose -f scripts/docker/docker-compose.dev.yml logs -f elasticsearch
docker-compose -f scripts/docker/docker-compose.dev.yml logs -f logstash
```

### Access Containers
```bash
# MongoDB
docker exec -it courses-mongodb mongosh

# Redis
docker exec -it courses-redis redis-cli -a redis123

# Elasticsearch
docker exec -it courses-elasticsearch curl -X GET "http://localhost:9200/_cluster/health"

# Logstash
docker exec -it courses-logstash curl -X GET "http://localhost:9600"
```

### Health Checks
```bash
# Check all services
docker-compose -f scripts/docker/docker-compose.dev.yml ps

# Check specific service health
docker-compose -f scripts/docker/docker-compose.dev.yml exec mongodb mongosh --eval "db.adminCommand('ping')"

# Elasticsearch health
curl http://localhost:9200/_cluster/health

# Grafana health
curl http://localhost:3001/api/health
```

---

## 📊 Monitoring & Logging Stack

### ELK Stack Configuration

#### 1. Winston Logger Setup
```bash
cd client
pnpm add winston winston-logstash
```

#### 2. Logger Configuration
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

#### 3. Usage in API Routes
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

### Kibana Setup

#### 1. Create Index Pattern
1. Open http://localhost:5601
2. Go to **Management** → **Stack Management** → **Index Patterns**
3. Click **Create index pattern**
4. Enter: `lms-logs-*`
5. Select time field: `@timestamp`
6. Click **Create**

#### 2. Discover Logs
1. Go to **Discover**
2. Select `lms-logs-*` index
3. Use filters:
   - `level: ERROR` - Show only errors
   - `tags: api-request` - Show API requests
   - `tags: database-operation` - Show DB operations

#### 3. Kibana Query Examples
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

### Grafana Setup

#### 1. Login
- URL: http://localhost:3001
- Username: `admin`
- Password: `admin123`

#### 2. Datasources (Auto-configured)
- **Prometheus** - Metrics (default)
- **Elasticsearch** - Logs

#### 3. Prometheus Query Examples
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

### Monitoring Stack Features

| Feature | Tool | Purpose |
|---------|------|---------|
| **Log Aggregation** | Elasticsearch | Centralized log storage |
| **Log Processing** | Logstash | Parse and enrich logs |
| **Log Visualization** | Kibana | Search and visualize logs |
| **Metrics Collection** | Prometheus | Collect application metrics |
| **Metrics Visualization** | Grafana | Dashboards and alerts |
| **Error Tracking** | Kibana | Replace Sentry |
| **Product Analytics** | Grafana | Replace PostHog |
| **Log Search** | Kibana | Replace Loggly |

---

## 🔧 PowerShell Commands & Operations

### 🚀 **Quick Start Commands**

#### **Start Everything (Fresh)**
```powershell
# From project root
cd E:\QAF\Github\courses

# Clean start (recommended)
docker-compose -f scripts/docker/docker-compose.dev.yml down -v
docker system prune -f
.\scripts\dev-start.ps1
```

#### **Stop Everything**
```powershell
# Stop all services gracefully
docker-compose -f scripts/docker/docker-compose.dev.yml down

# Stop with volume cleanup (removes data)
docker-compose -f scripts/docker/docker-compose.dev.yml down -v

# Force stop and remove everything
docker-compose -f scripts/docker/docker-compose.dev.yml down -v --rmi all
docker system prune -f
```

#### **Restart Services**
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
docker exec -it lms-mongodb mongosh

# Access Redis CLI
docker exec -it lms-redis redis-cli -a redis123

# Access container bash
docker exec -it lms-mongodb bash
docker exec -it lms-elasticsearch bash
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
docker rm -f lms-mongodb lms-redis lms-minio lms-keycloak

# Remove specific networks
docker network rm lms
```

### 🏥 **Health Checks**

```powershell
# Check MongoDB
docker exec lms-mongodb mongosh --eval "db.adminCommand('ping')"

# Check MongoDB replica set
docker exec lms-mongodb mongosh --eval "rs.status()"

# Check Redis
docker exec lms-redis redis-cli ping

# Check Elasticsearch
curl http://localhost:9200/_cluster/health

# Check Kibana
curl http://localhost:5601/api/status

# Check Grafana
curl http://localhost:3001/api/health
```

### 🌐 **Service URLs & Quick Access**

```powershell
# Open all services in browser
Start-Process "http://localhost:5174"          # Frontend
Start-Process "https://localhost:3000"        # API Server
Start-Process "https://localhost:3000/api-docs" # Swagger
Start-Process "http://localhost:5601"          # Kibana
Start-Process "http://localhost:3001"          # Grafana
Start-Process "http://localhost:9090"          # Prometheus
Start-Process "http://localhost:1080"          # MailDev
Start-Process "http://localhost:9000"          # MinIO
Start-Process "http://localhost:9001"          # MinIO Console
Start-Process "http://localhost:8080"          # Keycloak
Start-Process "http://localhost:8080/admin"    # Keycloak Admin
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
docker network inspect lms

# Check volume issues
docker volume ls
docker volume inspect mongodb_dev_data

# Check container resources
docker stats

# Check container details
docker inspect lms-mongodb
```

### 🧪 **Testing Commands**

```powershell
# Test API health
curl https://localhost:3000/api/v1/health

# Test categories API
curl https://localhost:3000/api/v1/categories

# Test with API key
curl -H "x-api-key: dev-api-key-123" https://localhost:3000/api/v1/categories

# Test MongoDB connection
docker exec lms-mongodb mongosh --eval "db.getMongo()"

# Test Redis connection
docker exec lms-redis redis-cli -a redis123 ping
```

### 🚨 **Common Issues & Solutions**

#### **Network Overlap Error**
```powershell
# Solution: Clean up networks and containers
docker-compose -f scripts/docker/docker-compose.dev.yml down -v
docker network rm lms
docker system prune -f
.\scripts\dev-start.ps1
```

#### **Port Already in Use**
```powershell
# Find what's using the port
netstat -ano | findstr :3000
netstat -ano | findstr :5174
netstat -ano | findstr :27017

# Kill the process
taskkill /PID <PID> /F
```

#### **Container Won't Start**
```powershell
# Check container logs
docker logs lms-mongodb
docker logs lms-elasticsearch

# Remove and recreate
docker rm lms-mongodb
docker-compose -f scripts/docker/docker-compose.dev.yml up -d mongodb
```

### 📋 **Complete Workflow**

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

# 4. View logs if issues
docker-compose -f scripts/docker/docker-compose.dev.yml logs -f lms-mongodb

# 5. Stop when done
docker-compose -f scripts/docker/docker-compose.dev.yml down
```

### 📚 **Service Port Summary**

| Service | Port(s) | URL | Credentials |
|---------|---------|-----|-------------|
| **Frontend** | 5174 | http://localhost:5174 | - |
| **API Server** | 3000 | https://localhost:3000 | - |
| **Swagger Docs** | 3000 | https://localhost:3000/api-docs | - |
| **MongoDB** | 27017 | localhost:27017 | - (no auth) |
| **Redis** | 6379 | localhost:6379 | Password: redis123 |
| **MinIO** | 9000, 9001 | http://localhost:9000 | minioadmin/minioadmin |
| **Keycloak** | 8080 | http://localhost:8080 | admin/admin123 |
| **PostgreSQL** | 5432 | localhost:5432 | keycloak/keycloak123 |
| **Elasticsearch** | 9200, 9300 | http://localhost:9200 | - |
| **Logstash** | 5000, 9600 | TCP:5000 | - |
| **Kibana** | 5601 | http://localhost:5601 | - |
| **Grafana** | 3001 | http://localhost:3001 | admin/admin123 |
| **Prometheus** | 9090 | http://localhost:9090 | - |
| **MailDev** | 1080, 1025 | http://localhost:1080 | - |

### 🎯 **Quick Reference**

| Command | Purpose |
|---------|---------|
| `.\scripts\dev-start.ps1` | Start everything |
| `docker-compose down` | Stop everything |
| `docker-compose restart` | Restart services |
| `docker-compose logs -f` | View logs |
| `docker ps` | Show containers |
| `docker system prune -f` | Clean up |

> **💡 Tip:** For complete PowerShell command reference, see `POWERSHELL-COMMANDS.md` in the project root.

---

## 🔧 Development Workflow

### Project Structure
```
courses/
├── scripts/
│   ├── docker/
│   │   ├── docker-compose.dev.yml      # Main compose file
│   │   ├── docker-compose.mongodb.yml  # MongoDB reference
│   │   ├── elk-stack.yml               # ELK reference
│   │   ├── mongo-init.js               # MongoDB init
│   │   ├── setup-replica-set.js        # Replica set init
│   │   ├── logstash/
│   │   │   ├── logstash.conf           # Logstash pipeline
│   │   │   └── logstash.yml            # Logstash config
│   │   ├── prometheus/
│   │   │   └── prometheus.yml          # Prometheus config
│   │   └── grafana/
│   │       └── provisioning/
│   │           ├── datasources/
│   │           │   └── datasource.yml  # Grafana datasources
│   │           └── dashboards/
│   │               └── dashboard.yml   # Grafana dashboards
│   ├── dev-start.ps1                   # Main startup (Windows)
│   └── dev-start.sh                    # Main startup (Linux/Mac)
├── client/
│   ├── src/
│   │   ├── components/                  # React components
│   │   ├── services/
│   │   │   ├── business/               # Business logic layer
│   │   │   ├── db/                     # Database layer (Prisma)
│   │   │   ├── api/                    # API configuration
│   │   │   └── utils/                  # Utilities (logger)
│   │   ├── pages/                      # Next.js API routes
│   │   └── App.jsx
│   ├── prisma/                         # Database schema
│   ├── logs/                           # Log files
│   └── package.json
├── offline-images/                     # Exported Docker images
└── README.md                           # This file
```

### Development Commands
```bash
# Start everything
.\scripts\dev-start.ps1

# Start development server only
cd client
pnpm run dev

# Database operations
pnpm run db:generate
pnpm run db:studio
pnpm run db:push

# Build for production
pnpm run build

# API server only
pnpm run api

# Test API endpoints
curl https://localhost:3000/api/v1/health
curl https://localhost:3000/api/v1/categories
```

### Service Layer Architecture
```
React Components ←→ Business Services ←→ Database Services ←→ MongoDB
     (UI)              (Logic)             (Prisma ORM)        (Database)
```

---

## 📡 API Documentation & Swagger

### Swagger Setup
The API includes automatic Swagger documentation powered by Swagger UI.

#### 1. Access Swagger UI
- URL: https://localhost:3000/api-docs
- Interactive API documentation
- Test endpoints directly in browser

#### 2. API Endpoints
```
# Health Check
GET /api/v1/health

# Categories
GET    /api/v1/categories
POST   /api/v1/categories
GET    /api/v1/categories/:id
PUT    /api/v1/categories/:id
DELETE /api/v1/categories/:id

# Legacy endpoints (deprecated)
GET/POST/PUT/DELETE /api/categories
```

#### 3. Example API Call
```bash
# Get all categories
curl -X GET https://localhost:3000/api/v1/categories \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev-api-key-123"

# Create category
curl -X POST https://localhost:3000/api/v1/categories \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev-api-key-123" \
  -d '{
    "nameEn": "Mathematics",
    "nameAr": "الرياضيات",
    "icon": "calculator",
    "descriptionEn": "Mathematics courses",
    "descriptionAr": "دورات الرياضيات",
    "color": "#3B82F6",
    "order": 1,
    "isActive": true
  }'
```

#### 4. API Response Format
```json
{
  "success": true,
  "data": [
    {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "nameEn": "Mathematics",
      "nameAr": "الرياضيات",
      "icon": "calculator",
      "descriptionEn": "Mathematics courses",
      "descriptionAr": "دورات الرياضيات",
      "color": "#3B82F6",
      "order": 1,
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

---

## 🗄️ Database Setup

### MongoDB Configuration

#### 1. Replica Set Setup
MongoDB is configured with a replica set (`rs0`) for production-ready transactions.

#### 2. Connection String
```env
DATABASE_URL="mongodb://localhost:27017/lms_dev?replicaSet=rs0"
```

#### 3. Verify Replica Set
```bash
docker exec courses-mongodb mongosh --eval "rs.status()"

# Expected output:
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

#### 4. MongoDB Files Structure
```
scripts/docker/
├── docker-compose.mongodb.yml  # MongoDB standalone compose
├── mongo-init.js               # Database initialization
└── setup-replica-set.js        # Replica set initialization
```

#### 5. Database Operations
```bash
# Access MongoDB
docker exec -it courses-mongodb mongosh

# Switch to application database
use lms_dev

# Show collections
show collections

# Query categories
db.categories.find().pretty()

# Create test category
db.categories.insertOne({
  nameEn: "Test Category",
  nameAr: "فئة اختبار",
  icon: "test",
  descriptionEn: "Test description",
  descriptionAr: "وصف الاختبار",
  color: "#FF0000",
  order: 1,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### Prisma Operations
```bash
# Generate Prisma client
pnpm run db:generate

# Open Prisma Studio
pnpm run db:studio

# Push schema changes
pnpm run db:push

# Reset database
pnpm run db:reset
```

---

## 📧 Email Development

### MailDev Setup
MailDev is included for offline email development and testing.

#### 1. Access MailDev
- URL: http://localhost:1080
- Web interface to view emails
- SMTP server: localhost:1025

#### 2. Email Configuration
```javascript
// client/src/services/email/emailService.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
  host: 'localhost',
  port: 1025,
  secure: false,
  auth: {
    user: 'user',
    pass: 'password'
  }
});

// Send email
const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: 'noreply@milmanylms.com',
      to,
      subject,
      html
    });
    
    logger.info('Email sent', { to, subject });
  } catch (error) {
    logger.error('Email send failed', { error: error.message, to, subject });
  }
};
```

#### 3. Test Email
```javascript
// Test email sending
sendEmail('test@example.com', 'Test Email', '<h1>Hello World</h1>');
```

#### 4. View Emails
1. Open http://localhost:1080
2. See all sent emails
3. View email content, headers, and raw source
4. Download email as .eml file

---

## 🛠️ Troubleshooting

### Common Issues

#### 1. MongoDB Replica Set Issues
```bash
# Check replica set status
docker exec courses-mongodb mongosh --eval "rs.status()"

# Reconfigure replica set if needed
docker exec courses-mongodb mongosh --eval "rs.reconfig({_id: 'rs0', version: 2, members: [{_id: 0, host: 'localhost:27017'}]})"

# Initialize replica set
docker exec courses-mongodb mongosh --eval "rs.initiate()"
```

#### 2. Elasticsearch Memory Issues
```bash
# Check Elasticsearch logs
docker logs courses-elasticsearch

# Increase memory in docker-compose.dev.yml
environment:
  - "ES_JAVA_OPTS=-Xms1g -Xmx1g"
```

#### 3. Logstash Connection Issues
```bash
# Check Logstash logs
docker logs courses-logstash

# Test Logstash health
curl http://localhost:9600

# Check Logstash pipeline
curl http://localhost:9600/_node/stats/pipelines
```

#### 4. Grafana Datasource Issues
```bash
# Check Grafana logs
docker logs courses-grafana

# Test Elasticsearch connection
curl http://localhost:9200/_cluster/health

# Test Prometheus connection
curl http://localhost:9090/api/v1/targets
```

#### 5. Port Conflicts
```bash
# Check what's using ports
netstat -ano | findstr :5174
netstat -ano | findstr :3000
netstat -ano | findstr :27017

# Kill processes if needed
taskkill /PID <PID> /F
```

#### 6. Docker Issues
```bash
# Clean up Docker
docker system prune -f
docker volume prune -f
docker network prune -f

# Reset everything
docker-compose -f scripts/docker/docker-compose.dev.yml down -v --rmi all
docker system prune -f
```

### Performance Issues

#### 1. Slow API Response
```bash
# Check API server logs
docker logs courses-api-server

# Check MongoDB performance
docker exec courses-mongodb mongosh --eval "db.currentOp()"

# Check system resources
docker stats
```

#### 2. Memory Issues
```bash
# Check container memory usage
docker stats --no-stream

# Increase memory limits in docker-compose.dev.yml
deploy:
  resources:
    limits:
      memory: 2G
```

### Log Analysis

#### 1. Search for Errors in Kibana
```
# All errors
level: ERROR

# Database errors
level: ERROR AND tags: database-operation

# API errors
level: ERROR AND tags: api-request

# Authentication errors
message: "authentication failed" OR message: "unauthorized"
```

#### 2. Monitor Performance
```
# Slow database queries
tags: database-operation AND duration > 1000

# Slow API requests
tags: api-request AND duration > 5000

# High memory usage
message: "out of memory" OR message: "memory limit"
```

---

## 📚 Service Port Summary

| Service | Port(s) | URL | Purpose |
|---------|---------|-----|---------|
| **Frontend** | 5174 | http://localhost:5174 | React application |
| **API Server** | 3000 | https://localhost:3000 | Next.js API |
| **Swagger Docs** | 3000 | https://localhost:3000/api-docs | API documentation |
| **MongoDB** | 27017 | localhost:27017 | Primary database |
| **Redis** | 6379 | localhost:6379 | Cache & sessions |
| **MinIO** | 9000, 9001 | http://localhost:9000 | File storage |
| **Keycloak** | 8080 | http://localhost:8080 | Authentication |
| **PostgreSQL** | 5432 | localhost:5432 | Keycloak DB |
| **Elasticsearch** | 9200, 9300 | http://localhost:9200 | Log storage |
| **Logstash** | 5000, 9600 | TCP:5000 | Log processing |
| **Kibana** | 5601 | http://localhost:5601 | Log visualization |
| **Grafana** | 3001 | http://localhost:3001 | Metrics visualization |
| **Prometheus** | 9090 | http://localhost:9090 | Metrics collection |
| **MailDev** | 1080, 1025 | http://localhost:1080 | Email testing |

---

## 🎯 Production Deployment

### 1. Build Application
```bash
cd client
pnpm run build
```

### 2. Deploy to Production Server
```bash
# Copy files
scp -r client/dist user@server:/var/www/html/
scp -r scripts/docker user@server:/opt/

# Start infrastructure
cd /opt/docker
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Configure Reverse Proxy (NGINX)
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass https://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

---

## 🏗️ API Development Guide

### Creating New Services

Follow our standardized pattern to create new API services:

#### 1. Create Database Service
```bash
cp client/src/services/db/baseDbService-mongodb.cjs client/src/services/db/yourServiceDbService.cjs
```

#### 2. Create API Route
```bash
cp client/src/services/utils/serviceTemplate.cjs client/pages/api/yourService.cjs
```

#### 3. Add to Server
Edit `client/server.cjs`:
```javascript
const yourServiceHandler = require('./pages/api/yourService.cjs');
app.all('/api/v1/your-service', (req, res) => {
  yourServiceHandler(req, res);
});
```

#### 4. Add Swagger Schemas
Edit `client/src/utils/swagger.cjs` to add your service schemas and tags.

### Service Architecture

```
┌─────────────────────────────────────────┐
│         Client Request                   │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│    Security Middleware                   │
│  - Rate Limiting (100 req/15min)         │
│  - Request Sanitization (XSS)            │
│  - Security Headers (Helmet)             │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│    Logging Middleware                    │
│  - Request/Response Logging              │
│  - Performance Monitoring                │
│  - Debug Levels (ERROR→TRACE)            │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│    API Routes                            │
│  - /api/v1/categories                    │
│  - /api/v1/programs                      │
│  - /api/v1/subjects (next)               │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│    Database Services                     │
│  - MongoDB/Prisma Operations             │
│  - ELK Logging Integration               │
│  - Performance Timing                    │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│    Error Handling                        │
│  - Centralized Error Handler             │
│  - Custom Error Classes                  │
│  - Security Event Logging                │
└─────────────────────────────────────────┘
```

### Environment Configuration

Create `client/.env` from `client/.env.example`:

```env
# API Server
NODE_ENV=development
LOG_LEVEL=debug
API_KEY=your_api_key_here
JWT_SECRET=your_jwt_secret_here

# MongoDB
DATABASE_URL=mongodb://localhost:27017/lms_dev?replicaSet=rs0

# ELK Stack
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_INDEX=military-lms-logs

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ALLOWED_ORIGINS=https://localhost:5174,http://localhost:5174
```

### Logging Levels

Set `LOG_LEVEL` in `.env`:
- **ERROR** - Only errors
- **WARN** - Warnings and errors
- **INFO** - General information (default)
- **DEBUG** - Detailed debugging information
- **TRACE** - Very detailed trace information

### Available API Endpoints

#### Categories API
```
GET    /api/v1/categories      - Get all categories
GET    /api/v1/categories?id=  - Get category by ID
POST   /api/v1/categories      - Create new category
PUT    /api/v1/categories?id=  - Update category
DELETE /api/v1/categories?id=  - Delete category
```

#### Programs API
```
GET    /api/v1/programs        - Get all programs
GET    /api/v1/programs?id=    - Get program by ID
POST   /api/v1/programs        - Create new program
PUT    /api/v1/programs?id=    - Update program
DELETE /api/v1/programs?id=    - Delete program
```

### Migration Status

| Service | Status | Files |
|---------|--------|-------|
| Categories | ✅ Complete | `categoryDbService.cjs`, `categories.cjs` |
| Programs | ✅ Complete | `programDbService.cjs`, `programs.cjs` |
| Subjects | ✅ Complete | `subjectDbService.cjs`, `subjects.cjs` |
| Classes | ✅ Complete | `classDbService.cjs`, `classes.cjs` |
| Activities | ✅ Complete | `activityDbService.cjs`, `activities.cjs` |
| Announcements | ✅ Complete | `announcementDbService.cjs`, `announcements.cjs` |
| Resources | ✅ Complete | `resourceDbService.cjs`, `resources.cjs` |
| Users | ✅ Complete | `userDbService.cjs`, `users.cjs` |
| Penalties | ✅ Complete | `penaltyDbService.cjs`, `penalties.cjs` |
| Participations | ✅ Complete | `participationDbService.cjs`, `participations.cjs` |
| Behaviors | ✅ Complete | `behaviorDbService.cjs`, `behaviors.cjs` |
| Quiz Results | ✅ Complete | `quizResultsDbService.cjs`, `quiz-results.cjs` |
| Quiz Submissions | ✅ Complete | `quizSubmissionsDbService.cjs`, `quiz-submissions.cjs` |
| Notifications | ✅ Complete | `notificationDbService.cjs`, `notifications.cjs` |
| Schedules | ✅ Complete | `scheduleDbService.cjs`, `schedules.cjs` |
| Templates | ✅ Complete | `templatesDbService.cjs`, `templates.cjs` |
| Gamifications | ✅ Complete | `gamificationDbService.cjs`, `gamifications.cjs` |
| Bookmarks | ✅ Complete | `bookmarkDbService.cjs`, `bookmarks.cjs` |
| Attendance | ✅ Complete | `attendanceDbService.cjs`, `attendance.cjs` |
| Attendance Sessions | ✅ Complete | `attendanceSessionsDbService.cjs`, `attendance-sessions.cjs` |
| Activity Logs | ✅ Complete | `activityLogDbService.cjs`, `activity-logs.cjs` |
| Dashboards | ✅ Complete | `dashboardDbService.cjs`, `dashboards.cjs` |
| Enrollments | ✅ Complete | `enrollmentDbService.cjs`, `enrollments.cjs` |
| Question Bank | ✅ Complete | `questionBankDbService.cjs`, `question-bank.cjs` |
| Chat | ✅ Complete | `chatDbService.cjs`, `chat.cjs` |
| Quizzes | ✅ Complete | `quizzesDbService.cjs`, `quizzes.cjs` |
| Subject Enrollments | ✅ Complete | `subjectEnrollmentsDbService.cjs`, `subject-enrollments.cjs` |

**Total Migrated Services: 26/26 Complete**

### Documentation

- **API Reference**: https://localhost:3000/api-docs (Swagger UI)
- **Full Documentation**: http://localhost:3001 (Docusaurus)
- **Migration Plan**: See `MIGRATION-PLAN.md`
- **Service Guide**: See `client/README-SERVICES.md`

---

## 📄 License

Military LMS - Proprietary

---

## 🤝 Contributing

1. Follow the existing service layer architecture
2. Keep database operations in `services/db/`
3. Keep business logic in `services/business/`
4. Use TypeScript for new components
5. Test with local development before deployment
6. Update documentation for new features
7. Use Winston for all logging
8. Follow API versioning patterns

---

## 📞 Support

For issues and questions:
1. Check troubleshooting section
2. Review logs in Kibana
3. Check service health in Grafana
4. Consult API documentation at `/api-docs`

---

**🎉 Your complete Military LMS with offline monitoring is ready!**
