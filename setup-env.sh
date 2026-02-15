#!/bin/bash

# Environment Setup Script for QAF Courses
# This script helps you set up secure environment variables

echo "🔐 QAF Courses - Environment Setup Script"
echo "=========================================="

# Check if .env.local already exists
if [ -f ".env.local" ]; then
    echo "⚠️  .env.local already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled."
        exit 1
    fi
fi

# Copy template to .env.local
echo "📋 Creating .env.local from template..."
cp .env.example .env.local

echo ""
echo "🔑 Please edit .env.local with your actual credentials:"
echo ""
echo "   Required for basic functionality:"
echo "   • VITE_DEFAULT_FROM_EMAIL=your-email@gmail.com"
echo "   • VITE_DEFAULT_REPLY_TO=your-email@gmail.com"
echo "   • VITE_TEST_EMAIL=your-test-email@gmail.com"
echo ""
echo "   Required for Firebase:"
echo "   • VITE_FIREBASE_API_KEY=your-api-key"
echo "   • VITE_FIREBASE_PROJECT_ID=your-project-id"
echo "   • VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com"
echo "   • ... (other Firebase config)"
echo ""
echo "   Optional services:"
echo "   • VITE_QSTASH_TOKEN=your-qstash-token (email service)"
echo "   • VITE_PUBLIC_POSTHOG_KEY=your-posthog-key (analytics)"
echo "   • VITE_SENTRY_DSN=your-sentry-dsn (error tracking)"
echo ""
echo "📖 See ENVIRONMENT_SETUP.md for detailed instructions"
echo ""

# Open in default editor
if command -v code &> /dev/null; then
    echo "🚀 Opening .env.local in VS Code..."
    code .env.local
elif command -v nano &> /dev/null; then
    echo "🚀 Opening .env.local in nano..."
    nano .env.local
else
    echo "📝 Please manually edit .env.local with your credentials"
fi

echo ""
echo "✅ Setup complete! After editing .env.local:"
echo "   1. Run 'npm run dev' to test your setup"
echo "   2. Check the console for loaded environment variables"
echo "   3. Commit .env.example but NOT .env.local"
echo ""
echo "🔒 Security reminder: Never commit .env.local to version control!"
