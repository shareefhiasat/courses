# Installation Guide

This guide will help you set up the Military LMS development environment on your local machine.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **pnpm** (v8 or higher)
- **Docker Desktop** (for MongoDB, ELK Stack, etc.)
- **Git**

## 🚀 Quick Installation

### 1. Clone the Repository

```bash
git clone https://github.com/military-lms/lms.git
cd lms
```

### 2. Install Dependencies

```bash
# Install root dependencies
pnpm install

# Install client dependencies
cd client
pnpm install
```

### 3. Environment Configuration

Copy the example environment file and configure it:

```bash
cd client
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# API Server Configuration
NODE_ENV=development
LOG_LEVEL=debug
API_KEY=your_api_key_here
JWT_SECRET=your_jwt_secret_here

# MongoDB Configuration
DATABASE_URL=mongodb://localhost:27017/lms_dev?replicaSet=rs0

# Elasticsearch Configuration (ELK Stack)
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_INDEX=military-lms-logs
```

### 4. Start Docker Services

```powershell
cd scripts
./dev-start.ps1
```

This will start:
- MongoDB (port 27017)
- Redis (port 6379)
- Elasticsearch (port 9200)
- Kibana (port 5601)
- Logstash (port 5044)
- Grafana (port 3002)
- Prometheus (port 9091)
- MinIO (port 9000)
- MailDev (port 1080)

### 5. Initialize Prisma

```bash
cd client
npx prisma generate
npx prisma db push
```

### 6. Start the Application

**Terminal 1 - API Server:**
```bash
cd client
pnpm run api
```

**Terminal 2 - Frontend:**
```bash
cd client
pnpm run dev
```

## 🔍 Verify Installation

### Check API Server

Visit: `https://localhost:3000/api/v1/health`

Expected response:
```json
{
  "success": true,
  "version": "v1",
  "timestamp": "2026-03-10T10:30:00.000Z",
  "services": {
    "database": "connected",
    "prisma": "active"
  }
}
```

### Check Swagger Documentation

Visit: `https://localhost:3000/api-docs`

You should see the interactive API documentation.

### Check Frontend

Visit: `https://localhost:5174`

You should see the LMS login page.

### Check Kibana (Logs)

Visit: `http://localhost:5601`

Configure index pattern: `military-lms-logs-*`

## 🐳 Docker Services

### MongoDB

```bash
# Connect to MongoDB
docker exec -it lms-qaf-mongodb mongosh

# Check replica set status
rs.status()
```

### Elasticsearch

```bash
# Check Elasticsearch health
curl http://localhost:9200/_cluster/health

# View indices
curl http://localhost:9200/_cat/indices
```

### Redis

```bash
# Connect to Redis
docker exec -it lms-qaf-redis redis-cli

# Test connection
PING
```

## 🛠️ Troubleshooting

### MongoDB Connection Issues

If you see `Server selection timeout` errors:

```bash
# Reconfigure replica set
docker exec lms-qaf-mongodb mongosh --eval "rs.reconfig({ _id: 'rs0', members: [{ _id: 0, host: 'localhost:27017' }] }, { force: true })"
```

### Port Conflicts

If ports are already in use, update `docker-compose.dev.yml`:

```yaml
services:
  mongodb:
    ports:
      - "27018:27017"  # Change external port
```

### Permission Issues

On Linux/Mac, you may need to adjust file permissions:

```bash
chmod +x scripts/dev-start.ps1
```

### Prisma Issues

If Prisma can't connect to MongoDB:

```bash
# Regenerate Prisma client
npx prisma generate

# Reset database (WARNING: deletes all data)
npx prisma db push --force-reset
```

## 📦 Optional: Install Documentation Site

```bash
cd docs
pnpm install
pnpm start
```

Visit: `http://localhost:3001`

## 🔧 Development Tools

### VS Code Extensions

Recommended extensions:

- **Prisma** - Prisma schema syntax highlighting
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Docker** - Docker management
- **MongoDB for VS Code** - MongoDB management

### Browser Extensions

- **React Developer Tools** - React debugging
- **Redux DevTools** - State management debugging

## 🎯 Next Steps

1. [Configuration Guide](./configuration) - Configure services
2. [Docker Setup](./docker-setup) - Understand Docker services
3. [Creating Services](../api/creating-services) - Build your first service

## 📚 Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)

---

**Installation complete!** 🎉 Ready to start developing? Check out the [Architecture Overview](../architecture/overview).
