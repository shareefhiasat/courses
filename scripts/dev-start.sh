#!/bin/bash

# Military LMS Development Environment Startup Script
# This script starts all Docker services for development

echo "🚀 Starting Military LMS Development Environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs
mkdir -p uploads
mkdir -p backups
mkdir -p docker/logstash

# Create Logstash configuration if it doesn't exist
if [ ! -f "docker/logstash/logstash.conf" ]; then
    echo "📝 Creating Logstash configuration..."
    mkdir -p docker/logstash
    cat > docker/logstash/logstash.conf << 'EOF'
input {
  tcp {
    port => 5044
    codec => json
  }
}

filter {
  # Add any filters here if needed
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "lms-logs-%{+YYYY.MM.dd}"
  }
}
EOF
fi

# Create Logstash config if it doesn't exist
if [ ! -f "docker/logstash/logstash.yml" ]; then
    cat > docker/logstash/logstash.yml << 'EOF'
http.host: "0.0.0.0"
xpack.monitoring.elasticsearch.hosts: [ "http://elasticsearch:9200" ]
EOF
fi

# Start all services
echo "🐳 Starting Docker containers..."
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 45

# Check service health
echo "🔍 Checking service health..."
echo "PostgreSQL: $(docker-compose -f docker-compose.dev.yml exec -T postgres pg_isready -U postgres -d lms_dev && echo '✅ Ready' || echo '❌ Not ready')"
echo "Keycloak: $(curl -s http://localhost:8080/health/ready > /dev/null && echo '✅ Ready' || echo '❌ Not ready')"
echo "MinIO: $(curl -s http://localhost:9000/minio/health/live > /dev/null && echo '✅ Ready' || echo '❌ Not ready')"
echo "Redis: $(docker-compose -f docker-compose.dev.yml exec -T redis redis-cli ping > /dev/null 2>&1 && echo '✅ Ready' || echo '❌ Not ready')"
echo "Elasticsearch: $(curl -s http://localhost:9200/_cluster/health > /dev/null && echo '✅ Ready' || echo '❌ Not ready')"

# Run database migrations
echo "🗄️ Running database migrations..."
if docker-compose -f docker-compose.dev.yml exec -T backend npx prisma db push; then
    echo "✅ Database migrations completed"
else
    echo "❌ Database migrations failed"
fi

# Seed database
echo "🌱 Seeding database..."
if docker-compose -f docker-compose.dev.yml exec -T backend npm run db:seed; then
    echo "✅ Database seeded successfully"
else
    echo "❌ Database seeding failed (might already be seeded)"
fi

echo ""
echo "✅ Development environment is ready!"
echo ""
echo "🌐 Available services:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:5000"
echo "   Keycloak Admin: http://localhost:8080/admin"
echo "   MinIO Console: http://localhost:9001"
echo "   Kibana: http://localhost:5601"
echo "   MailDev: http://localhost:1080"
echo "   Jasper Reports: http://localhost:8081"
echo ""
echo "🔑 Default Credentials:"
echo "   Keycloak Admin: admin / admin123"
echo "   MinIO: minioadmin / minioadmin"
echo "   PostgreSQL: postgres / password"
echo "   Redis: (no auth)"
echo ""
echo "📝 Useful commands:"
echo "   View logs: docker-compose -f docker-compose.dev.yml logs -f [service]"
echo "   Stop services: docker-compose -f docker-compose.dev.yml down"
echo "   Reset database: docker-compose -f docker-compose.dev.yml down -v && ./scripts/dev-start.sh"
echo "   Access backend: docker-compose -f docker-compose.dev.yml exec backend bash"
echo "   Access database: docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d lms_dev"
echo "   Prisma Studio: docker-compose -f docker-compose.dev.yml exec backend npx prisma studio --hostname 0.0.0.0"
echo ""
echo "🎯 Quick Development Tips:"
echo "   - Frontend hot-reload is enabled"
echo "   - Backend auto-restarts on file changes"
echo "   - Database changes are auto-migrated with Prisma"
echo "   - All logs are sent to ELK stack"
echo "   - Email testing via MailDev at http://localhost:1080"
