# Quick Start Script for Infrastructure Only
# Simple version that just starts services

echo "🚀 Starting Military LMS Infrastructure..."

# Stop and remove existing containers
docker-compose -f docker-compose.dev.yml down -v 2>/dev/null

# Start fresh containers
docker-compose -f docker-compose.dev.yml up -d

echo "✅ Infrastructure starting..."
echo "📋 Next: cd client && pnpm run dev"
