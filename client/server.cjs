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
const { swaggerSpec, swaggerUi, swaggerUiOptions } = require('./src/utils/swagger');

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(cors({
    origin: ['https://localhost:5174', 'http://localhost:5174'],
    credentials: true
  }));
  app.use(express.json());

  // Logging middleware
  app.use((req, res, next) => {
    console.log(`[API Server v1] ${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // Import API routes - CommonJS require
  let categoriesHandler;
  try {
    categoriesHandler = require('./pages/api/categories.cjs');
    console.log('[API Server v1] ✅ Categories handler imported successfully');
  } catch (error) {
    console.error('[API Server v1] ❌ Failed to import categories handler:', error);
    process.exit(1);
  }

  // Mount API routes with versioning
  app.all('/api/v1/categories', (req, res) => {
    console.log('[API Server v1] Handling categories request:', req.method);
    categoriesHandler.handler(req, res);
  });

  // Legacy routes for backward compatibility (optional)
  app.all('/api/categories', (req, res) => {
    console.log('[API Server v1] Handling legacy categories request:', req.method);
    categoriesHandler.handler(req, res);
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
  app.get('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Error handling
  app.use((err, req, res, next) => {
    console.error('[API Server v1] Error:', err);
    res.status(500).json({ success: false, error: err.message });
  });

  // 404 handler
  app.use((req, res) => {
    console.log('[API Server v1] 404 Not Found:', req.url);
    res.status(404).json({ success: false, error: 'Not Found' });
  });

  // Start server with HTTPS
  const httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, 'localhost+2-key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'localhost+2.pem'))
  };

  https.createServer(httpsOptions, app).listen(PORT, () => {
    console.log(`[API Server v1] Running on https://localhost:${PORT}`);
    console.log('[API Server v1] Available routes:');
    console.log('  - GET/POST/PUT/DELETE https://localhost:3000/api/v1/categories');
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
