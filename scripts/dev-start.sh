#!/bin/bash

# Military LMS Development Environment Startup Script
# Updated for Infrastructure-Only Architecture

echo "🚀 Starting Military LMS Development Environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ ERROR: Docker is not running. Please start Docker first."
    exit 1
fi

# Clean up previous containers (optional clean start)
echo "🧹 Cleaning up previous containers..."
docker-compose -f scripts/docker/docker-compose.dev.yml down -v 2>/dev/null

# Prune Docker system (optional)
echo "🧹 Pruning Docker system..."
docker system prune -f 2>/dev/null

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs uploads backups

# Start infrastructure services only
echo "🐳 Starting Docker containers (Infrastructure Only)..."
docker-compose -f scripts/docker/docker-compose.dev.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check service health
echo "🏥 Checking service health..."

if docker-compose -f scripts/docker/docker-compose.dev.yml exec -T mongodb mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
    echo "   MongoDB: ✅ Ready"
else
    echo "   MongoDB: ❌ Not ready"
fi

if curl -s http://localhost:8080/realms/master >/dev/null 2>&1; then
    echo "   Keycloak: ✅ Ready"
else
    echo "   Keycloak: ⏳ Starting..."
fi

if curl -s http://localhost:9000/minio/health/live >/dev/null 2>&1; then
    echo "   MinIO: ✅ Ready"
else
    echo "   MinIO: ❌ Not ready"
fi

if docker-compose -f scripts/docker/docker-compose.dev.yml exec -T redis redis-cli ping 2>/dev/null | grep -q "PONG"; then
    echo "   Redis: ✅ Ready"
else
    echo "   Redis: ❌ Not ready"
fi

if docker-compose -f scripts/docker/docker-compose.dev.yml exec -T keycloak-db pg_isready -U keycloak -d keycloak >/dev/null 2>&1; then
    echo "   Keycloak DB: ✅ Ready"
else
    echo "   Keycloak DB: ❌ Not ready"
fi

echo ""
echo "🎉 Infrastructure is ready!"
echo ""
echo "📋 Next Steps:"
echo "   1. Open new terminal and run: cd client && pnpm run dev"
echo "   2. Visit: http://localhost:3000"
echo ""
echo "🌐 Available Infrastructure Services:"
echo "   MongoDB:     localhost:27017"
echo "   Redis:       localhost:6379"
echo "   MinIO:       http://localhost:9000 (API) / http://localhost:9001 (Console)"
echo "   Keycloak:    http://localhost:8080 (Auth) / http://localhost:8080/admin (Admin)"
echo "   PostgreSQL:  localhost:5432 (Keycloak DB)"
echo ""
echo "🔑 Default Credentials:"
echo "   MongoDB:     admin / admin123"
echo "   MinIO:       minioadmin / minioadmin"
echo "   Keycloak:    admin / admin123"
echo "   Redis:       Password: redis123"
echo ""
echo "🛠️ Useful Commands:"
echo "   View logs:           docker-compose -f scripts/docker/docker-compose.dev.yml logs -f [service]"
echo "   Stop services:       docker-compose -f scripts/docker/docker-compose.dev.yml down"
echo "   Reset everything:    docker-compose -f scripts/docker/docker-compose.dev.yml down -v; docker system prune -f"
echo "   Access MongoDB:      docker exec courses-mongodb mongosh"
echo "   Access Redis:        docker exec courses-redis redis-cli -a redis123"
echo "   Access MinIO:        docker exec courses-minio mc ls local"
echo ""
echo "💻 Application Commands:"
echo "   Start frontend:      cd client && pnpm run dev"
echo "   Generate Prisma:     cd client && pnpm run db:generate"
echo "   Prisma Studio:       cd client && pnpm run db:studio"
echo "   Build for prod:      cd client && pnpm run build"
echo ""
echo "🏗️ Architecture Info:"
echo "   - Single Vite build (Frontend + Database Services)"
echo "   - Infrastructure runs in Docker only"
echo "   - No backend container needed"
echo "   - Application connects to localhost services"
echo ""
echo "🎯 Development Tips:"
echo "   - Frontend hot-reload is enabled"
echo "   - Prisma auto-generates client on schema changes"
echo "   - Database operations use MongoDB via Prisma"
echo "   - All services accessible via localhost"
