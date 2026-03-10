/**
 * Simple Express server to handle API routes
 * Runs alongside Vite dev server
 * API Version: v1
 * CommonJS version for Node.js compatibility
 */

const express = require('express');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { swaggerSpec, swaggerUi, swaggerUiOptions } = require('./src/utils/swagger.cjs');
const {
  securityHeaders,
  apiRateLimiter,
  sanitizeRequest,
  requestLogger,
  performanceMonitor,
  errorLogger,
  debugLogger,
  errorHandler,
  notFoundHandler,
  initializeErrorHandlers
} = require('./src/middleware/index.cjs');
const { logger } = require('./src/services/utils/logger');

async function startServer() {
  const app = express();
  const PORT = 3000;
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Initialize error handlers
  initializeErrorHandlers();

  logger.info('Starting API Server', {
    service: 'APIServer',
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    logLevel: process.env.LOG_LEVEL || 'info'
  });

  // Security middleware (first)
  app.use(securityHeaders);
  app.use(sanitizeRequest);

  // CORS middleware
  app.use(cors({
    origin: ['https://localhost:5174', 'http://localhost:5174'],
    credentials: true
  }));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Logging middleware
  app.use(requestLogger);
  app.use(performanceMonitor);
  
  // Debug logging (only in development)
  if (isDevelopment) {
    app.use(debugLogger);
  }

  // Rate limiting for API routes
  app.use('/api', apiRateLimiter);

  // Import API routes - CommonJS require
  let categoriesHandler, programsHandler, subjectsHandler, classesHandler, activitiesHandler, announcementsHandler, resourcesHandler, usersHandler, penaltiesHandler, participationsHandler, behaviorsHandler, quizResultsHandler, quizSubmissionsHandler, notificationsHandler, schedulesHandler, templatesHandler, gamificationsHandler;
  try {
    categoriesHandler = require('./pages/api/categories.cjs');
    console.log('[API Server v1] ✅ Categories handler imported successfully');
    
    programsHandler = require('./pages/api/programs.cjs');
    console.log('[API Server v1] ✅ Programs handler imported successfully');
    
    subjectsHandler = require('./pages/api/subjects.cjs');
    console.log('[API Server v1] ✅ Subjects handler imported successfully');
    
    classesHandler = require('./pages/api/classes.cjs');
    console.log('[API Server v1] ✅ Classes handler imported successfully');

    activitiesHandler = require('./pages/api/activities.cjs');
    console.log('[API Server v1] ✅ Activities handler imported successfully');

    announcementsHandler = require('./pages/api/announcements.cjs');
    console.log('[API Server v1] ✅ Announcements handler imported successfully');

    resourcesHandler = require('./pages/api/resources.cjs');
    console.log('[API Server v1] ✅ Resources handler imported successfully');

    usersHandler = require('./pages/api/users.cjs');
    console.log('[API Server v1] ✅ Users handler imported successfully');

    penaltiesHandler = require('./pages/api/penalties.cjs');
    console.log('[API Server v1] ✅ Penalties handler imported successfully');

    participationsHandler = require('./pages/api/participations.cjs');
    console.log('[API Server v1] ✅ Participations handler imported successfully');

    behaviorsHandler = require('./pages/api/behaviors.cjs');
    console.log('[API Server v1] ✅ Behaviors handler imported successfully');

    quizResultsHandler = require('./pages/api/quiz-results.cjs');
    console.log('[API Server v1] ✅ Quiz Results handler imported successfully');

    quizSubmissionsHandler = require('./pages/api/quiz-submissions.cjs');
    console.log('[API Server v1] ✅ Quiz Submissions handler imported successfully');

    notificationsHandler = require('./pages/api/notifications.cjs');
    console.log('[API Server v1] ✅ Notifications handler imported successfully');

    schedulesHandler = require('./pages/api/schedules.cjs');
    console.log('[API Server v1] ✅ Schedules handler imported successfully');

    templatesHandler = require('./pages/api/templates.cjs');
    console.log('[API Server v1] ✅ Templates handler imported successfully');

    gamificationsHandler = require('./pages/api/gamifications.cjs');
    console.log('[API Server v1] ✅ Gamifications handler imported successfully');
  } catch (error) {
    console.error('[API Server v1] ❌ Failed to import handlers:', error);
    process.exit(1);
  }

  // Mount API routes with versioning
  app.all('/api/v1/categories', (req, res) => {
    console.log('[API Server v1] Handling categories request:', req.method);
    categoriesHandler(req, res);
  });

  app.all('/api/v1/programs', (req, res) => {
    console.log('[API Server v1] Handling programs request:', req.method);
    programsHandler(req, res);
  });

  app.all('/api/v1/subjects', (req, res) => {
    console.log('[API Server v1] Handling subjects request:', req.method);
    subjectsHandler(req, res);
  });

  app.all('/api/v1/classes', (req, res) => {
    console.log('[API Server v1] Handling classes request:', req.method);
    classesHandler(req, res);
  });

  app.all('/api/v1/activities', (req, res) => {
    console.log('[API Server v1] Handling activities request:', req.method);
    activitiesHandler(req, res);
  });

  app.all('/api/v1/announcements', (req, res) => {
    console.log('[API Server v1] Handling announcements request:', req.method);
    announcementsHandler(req, res);
  });

  app.all('/api/v1/resources', (req, res) => {
    console.log('[API Server v1] Handling resources request:', req.method);
    resourcesHandler(req, res);
  });

  app.all('/api/v1/users', (req, res) => {
    console.log('[API Server v1] Handling users request:', req.method);
    usersHandler(req, res);
  });

  app.all('/api/v1/penalties', (req, res) => {
    console.log('[API Server v1] Handling penalties request:', req.method);
    penaltiesHandler(req, res);
  });

  app.all('/api/v1/participations', (req, res) => {
    console.log('[API Server v1] Handling participations request:', req.method);
    participationsHandler(req, res);
  });

  app.all('/api/v1/behaviors', (req, res) => {
    console.log('[API Server v1] Handling behaviors request:', req.method);
    behaviorsHandler(req, res);
  });

  app.all('/api/v1/quiz-results', (req, res) => {
    console.log('[API Server v1] Handling quiz results request:', req.method);
    quizResultsHandler(req, res);
  });

  app.all('/api/v1/quiz-submissions', (req, res) => {
    console.log('[API Server v1] Handling quiz submissions request:', req.method);
    quizSubmissionsHandler(req, res);
  });

  app.all('/api/v1/notifications', (req, res) => {
    console.log('[API Server v1] Handling notifications request:', req.method);
    notificationsHandler(req, res);
  });

  app.all('/api/v1/schedules', (req, res) => {
    console.log('[API Server v1] Handling schedules request:', req.method);
    schedulesHandler(req, res);
  });

  app.all('/api/v1/templates', (req, res) => {
    console.log('[API Server v1] Handling templates request:', req.method);
    templatesHandler(req, res);
  });

  app.all('/api/v1/gamifications', (req, res) => {
    console.log('[API Server v1] Handling gamifications request:', req.method);
    gamificationsHandler(req, res);
  });

  // Legacy routes for backward compatibility (optional)
  app.all('/api/categories', (req, res) => {
    console.log('[API Server v1] Handling legacy categories request:', req.method);
    categoriesHandler(req, res);
  });

  // Health check endpoint
  app.get('/api/v1/health', (req, res) => {
    console.log('[API Server v1] Health check requested');
    res.json({ 
      success: true, 
      version: 'v1',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        prisma: 'active'
      }
    });
  });

  // Swagger API documentation
  app.use('/api-docs', swaggerUi.serveFiles(swaggerSpec, swaggerUiOptions));
  app.get('/api-docs', swaggerUi.setup(swaggerSpec, swaggerUiOptions));
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Error handling middleware (must be last)
  app.use(errorLogger);
  app.use(notFoundHandler);
  app.use(errorHandler);

  // Start server with HTTPS
  const httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, 'localhost+2-key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'localhost+2.pem'))
  };

  https.createServer(httpsOptions, app).listen(PORT, () => {
    console.log(`[API Server v1] Running on https://localhost:${PORT}`);
    console.log('[API Server v1] Available routes:');
    console.log('  - GET/POST/PUT/DELETE https://localhost:3000/api/v1/categories');
    console.log('  - GET/POST/PUT/DELETE https://localhost:3000/api/v1/programs');
    console.log('  - GET/POST/PUT/DELETE https://localhost:3000/api/v1/subjects');
    console.log('  - GET/POST/PUT/DELETE https://localhost:3000/api/v1/classes');
    console.log('  - GET/POST/PUT/DELETE https://localhost:3000/api/v1/activities');
    console.log('  - GET/POST/PUT/DELETE https://localhost:3000/api/v1/announcements');
    console.log('  - GET/POST/PUT/DELETE https://localhost:3000/api/v1/resources');
    console.log('  - GET/POST/PUT/DELETE https://localhost:3000/api/v1/users');
    console.log('  - GET/POST/PUT/DELETE https://localhost:3000/api/v1/penalties');
    console.log('  - GET/POST/PUT/DELETE https://localhost:3000/api/v1/participations');
    console.log('  - GET/POST/PUT/DELETE https://localhost:3000/api/v1/behaviors');
    console.log('  - GET/POST/PUT/DELETE https://localhost:3000/api/v1/quiz-results');
    console.log('  - GET/POST/PUT/DELETE https://localhost:3000/api/v1/quiz-submissions');
    console.log('  - GET/POST/PUT/DELETE https://localhost:3000/api/v1/notifications');
    console.log('  - GET/POST/PUT/DELETE https://localhost:3000/api/v1/schedules');
    console.log('  - GET/POST/PUT/DELETE https://localhost:3000/api/v1/templates');
    console.log('  - GET/POST/PUT/DELETE https://localhost:3000/api/v1/gamifications');
    console.log('  - GET https://localhost:3000/api/v1/health');
    console.log('  - GET https://localhost:3000/api-docs (Swagger UI)');
    console.log('  - GET https://localhost:3000/api-docs.json (Swagger Spec)');
    console.log('  - Legacy: GET/POST/PUT/DELETE https://localhost:3000/api/categories');
  });
}

// Start the server
startServer().catch(error => {
  console.error('[API Server v1] Failed to start server:', error);
  process.exit(1);
});
