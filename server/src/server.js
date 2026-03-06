const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Prisma Client
const prisma = new PrismaClient();

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Keycloak middleware placeholder
const keycloakMiddleware = (req, res, next) => {
  // TODO: Implement Keycloak authentication
  // For now, just pass through
  next();
};

// Apply Keycloak middleware to protected routes
app.use('/api', keycloakMiddleware);

// Basic API routes
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Military LMS Backend is running!',
    timestamp: new Date().toISOString(),
    database: 'MongoDB with Prisma',
    auth: 'Keycloak (coming soon)'
  });
});

// User routes
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      take: 10, // Limit for testing
      select: {
        id: true,
        email: true,
        displayName: true,
        isAdmin: true,
        isSuperAdmin: true,
        isInstructor: true,
        isStudent: true,
        createdAt: true
      }
    });
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch users',
      message: error.message 
    });
  }
});

// Classes routes
app.get('/api/classes', async (req, res) => {
  try {
    const classes = await prisma.class.findMany({
      take: 10,
      include: {
        program: {
          select: { nameEn: true, nameAr: true }
        },
        subject: {
          select: { nameEn: true, nameAr: true }
        }
      }
    });
    res.json({ success: true, data: classes });
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch classes',
      message: error.message 
    });
  }
});

// Authentication placeholder
app.post('/api/auth/login', (req, res) => {
  res.json({ 
    success: false, 
    message: 'Keycloak authentication not implemented yet',
    redirect: 'http://localhost:8080/realms/master/protocol/openid-connect/auth'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Military LMS Backend Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api`);
  console.log(`🗄️  Database: MongoDB with Prisma`);
  console.log(`🔐 Authentication: Keycloak (coming soon)`);
});

module.exports = app;
