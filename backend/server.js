/**
 * Military LMS - Backend API Server with Swagger
 *
 * PURPOSE: Standalone backend API with Swagger documentation
 * ARCHITECTURE: Frontend → Backend API → Business Services → DB Services → PostgreSQL
 * RUN: node backend/server.js
 */

import express from "express";
import cors from "cors";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";
import https from "https";
import fs from "fs";

// Load environment variables
config({ path: join(dirname(fileURLToPath(import.meta.url)), "../.env") });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8001;
const API_VERSION = process.env.API_VERSION || "v1";
const NODE_ENV = process.env.NODE_ENV || "development";

// Public routes (no middleware) - mount first
app.use(express.static(join(__dirname, "public")));

// Middleware
app.use(
  cors({
    origin: [
      process.env.CORS_ORIGIN || "http://localhost:3000",
      "http://localhost:5174",
      "http://localhost:8001",
      "https://localhost",
      "https://localhost:5174",
      "https://localhost:8001",
    ],
    credentials: true,
  }),
);

// Request logging middleware
app.use((req, res, next) => {
  console.log(
    `📥 [${new Date().toISOString()}] ${req.method} ${req.originalUrl}`,
  );
  console.log("📋 Headers:", req.headers);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import Keycloak authentication middleware
import { keycloakAuth } from "./middleware/keycloakAuth.js";

// MinIO initialization
import { ensureBuckets } from './services/minioService.js';

// Initialize MinIO buckets on startup
(async () => {
  try {
    await ensureBuckets();
    console.log('[minio] Buckets initialized successfully');
  } catch (error) {
    console.error('[minio] Failed to initialize buckets:', error);
  }
})();

// Apply Keycloak authentication to all API routes
// This will verify JWT tokens and extract user information
app.use("/api", keycloakAuth([])); // No specific roles required for basic access

// ==================== SWAGGER SETUP ====================

// Swagger definition inline to avoid import issues
const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Military LMS API",
    version: "1.0.0",
    description:
      "Complete API documentation for Military Learning Management System",
    contact: {
      name: "Military LMS Support",
      email: "support@milmanylms.com",
    },
    license: {
      name: "Proprietary",
    },
  },
  servers: [
    {
      url: `${process.env.API_BASE_URL || "http://localhost:8080"}/api/${API_VERSION}`,
      description: "Development server",
    },
    {
      url: "https://api.milmanylms.com",
      description: "Production server",
    },
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "x-api-key",
        description: "API key for authentication",
      },
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT token for authentication",
      },
    },
    schemas: {
      Program: {
        type: "object",
        required: ["nameEn", "code"],
        properties: {
          id: {
            type: "string",
            description: "Unique identifier",
            example: "64f8a1b2c3d4e5f6a7b8c9d0",
          },
          nameEn: {
            type: "string",
            description: "Program name in English",
            example: "Computer Science",
          },
          nameAr: {
            type: "string",
            description: "Program name in Arabic",
            example: "علوم الحاسوب",
          },
          code: {
            type: "string",
            description: "Program code",
            example: "CS101",
          },
          descriptionEn: {
            type: "string",
            description: "Program description in English",
            example: "Computer Science program",
          },
          descriptionAr: {
            type: "string",
            description: "Program description in Arabic",
            example: "برنامج علوم الحاسوب",
          },
          isActive: {
            type: "boolean",
            description: "Whether program is active",
            example: true,
          },
          createdAt: {
            type: "string",
            format: "date-time",
            description: "Creation timestamp",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            description: "Last update timestamp",
          },
        },
      },
      ProgramInput: {
        type: "object",
        required: ["nameEn", "code"],
        properties: {
          nameEn: {
            type: "string",
            description: "Program name in English",
            example: "Computer Science",
          },
          nameAr: {
            type: "string",
            description: "Program name in Arabic",
            example: "علوم الحاسوب",
          },
          code: {
            type: "string",
            description: "Program code",
            example: "CS101",
          },
          descriptionEn: {
            type: "string",
            description: "Program description in English",
          },
          descriptionAr: {
            type: "string",
            description: "Program description in Arabic",
          },
          isActive: {
            type: "boolean",
            description: "Whether program is active",
            default: true,
          },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: false,
          },
          error: {
            type: "string",
            example: "Error message",
          },
          message: {
            type: "string",
            example: "User-friendly error message",
          },
        },
      },
    },
  },
};

const swaggerOptions = {
  definition: swaggerDefinition,
  apis: [
    join(__dirname, "./routes/*.js"),
    join(__dirname, "./controllers/*.js"),
    join(__dirname, "./services/*.js"),
  ],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Enable Swagger if configured
if (process.env.ENABLE_SWAGGER !== "false") {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "Military LMS API Documentation",
    }),
  );

  // Swagger JSON endpoint
  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
}

// ==================== HEALTH CHECK ====================

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns API server status and timestamp
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 */
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || "1.0.0",
    server: process.env.APP_NAME || "Military LMS Backend API",
    environment: NODE_ENV,
    apiVersion: API_VERSION,
    port: PORT,
  });
});

// ==================== API ROUTES ====================

// Import route handlers
import programRoutes from "./routes/programs.js";
import subjectRoutes from "./routes/subjects.js";
import classRoutes from "./routes/classes.js";
import userRoutes from "./routes/users.js";
import activityRoutes from "./routes/activities.js";
import resourceRoutes from "./routes/resources.js";
import announcementRoutes from "./routes/announcements.js";
import subjectTypeRoutes from "./routes/subjectTypes.js";
import requirementTypeRoutes from "./routes/requirementTypes.js";
import categoryTypeRoutes from "./routes/categoryTypes.js";
import enrollmentRoutes from "./routes/enrollments.js";
import behaviorRoutes from "./routes/behaviors.js";
import penaltyRoutes from "./routes/penalties.js";
import participationRoutes from "./routes/participations.js";
import participationTypeRoutes from "./routes/participation-types.js";
import resourceTypeRoutes from "./routes/resourceTypes.js";
import priorityTypeRoutes from "./routes/priority-types.js";
import documentWorkflowRoutes from "./routes/document-workflows.js";
import marksRoutes from "./routes/marks.js";
import attendanceRoutes from "./routes/attendances.js";
import lookupRoutes from "./routes/lookup.js";
import standupAttendanceRoutes from "./routes/standupAttendances.js";
import permissionsRoutes from "./routes/permissions.js";
import userImagesRoutes from "./routes/user-images.js";
import driveRoutes from "./routes/driveNew.js";
import publicDriveRoutes from "./routes/publicDriveNew.js";

// Mount routes with versioning
app.use(`/api/${API_VERSION}/programs`, programRoutes);
app.use(`/api/${API_VERSION}/subjects`, subjectRoutes);
app.use(`/api/${API_VERSION}/classes`, classRoutes);
app.use(`/api/${API_VERSION}/users`, userRoutes);
app.use(`/api/${API_VERSION}/activities`, activityRoutes);
app.use(`/api/${API_VERSION}/resources`, resourceRoutes);
app.use(`/api/${API_VERSION}/announcements`, announcementRoutes);
// app.use(`/api/${API_VERSION}/subject-types`, subjectTypeRoutes); // Now handled by unified lookup: GET /api/v1/lookup/subject-types
// app.use(`/api/${API_VERSION}/requirement-types`, requirementTypeRoutes); // Now handled by unified lookup: GET /api/v1/lookup/requirement-types
// app.use(`/api/${API_VERSION}/category-types`, categoryTypeRoutes); // Now handled by unified lookup: GET /api/v1/lookup/category-types
// app.use(`/api/${API_VERSION}/resource-types`, resourceTypeRoutes); // Now handled by unified lookup: GET /api/v1/lookup/resource-types
// app.use(`/api/${API_VERSION}/priority-types`, priorityTypeRoutes); // Now handled by unified lookup: GET /api/v1/lookup/priority-types
app.use(`/api/${API_VERSION}/enrollments`, enrollmentRoutes);
app.use(`/api/${API_VERSION}/behaviors`, behaviorRoutes);
app.use(`/api/${API_VERSION}/penalties`, penaltyRoutes);
app.use(`/api/${API_VERSION}/participations`, participationRoutes);
// app.use(`/api/${API_VERSION}/participation-types`, participationTypeRoutes); // Now handled by unified lookup: GET /api/v1/lookup/participation-types
app.use(`/api/${API_VERSION}/document-workflows`, documentWorkflowRoutes);
app.use(`/api/${API_VERSION}/marks`, marksRoutes);
app.use(`/api/${API_VERSION}/attendance`, attendanceRoutes);
app.use(`/api/${API_VERSION}/standup-attendance`, standupAttendanceRoutes);
app.use(`/api/${API_VERSION}/lookup`, lookupRoutes);
app.use(`/api/${API_VERSION}/permissions`, permissionsRoutes);
app.use(`/api/${API_VERSION}/user-images`, userImagesRoutes);

app.use(`/api/${API_VERSION}/drive`, driveRoutes);
app.use(`/api/${API_VERSION}/p`, publicDriveRoutes);

// ==================== ERROR HANDLING ====================

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableDocs: "/api-docs",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ==================== START SERVER ====================

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  if (err.code === "EADDRINUSE") {
    console.error(
      `❌ Port ${PORT} is already in use. Please kill the process using this port.`,
    );
    process.exit(1);
  }
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});

// SSL configuration for development
const SSL_KEY_PATH = process.env.SSL_KEY_PATH || join(__dirname, "../scripts/docker/nginx/ssl/key.pem");
const SSL_CERT_PATH = process.env.SSL_CERT_PATH || join(__dirname, "../scripts/docker/nginx/ssl/cert.pem");

let server;

try {
  // Try HTTPS first (for development with nginx)
  if (fs.existsSync(SSL_KEY_PATH) && fs.existsSync(SSL_CERT_PATH)) {
    const sslOptions = {
      key: fs.readFileSync(SSL_KEY_PATH),
      cert: fs.readFileSync(SSL_CERT_PATH),
    };

    server = https.createServer(sslOptions, app).listen(PORT, () => {
      console.log(`
🚀 ${process.env.APP_NAME || "Military LMS Backend API"} running on https://localhost:${PORT}
📡 API Base URL: https://localhost:${PORT}/api/${API_VERSION}
📊 Swagger Documentation: https://localhost:${PORT}/api-docs
🏥 Health Check: https://localhost:${PORT}/api/health
🏗️ Architecture: Frontend → Backend API → Business Services → DB Services → PostgreSQL
📝 Swagger JSON: https://localhost:${PORT}/api-docs.json
🔖 API Version: ${API_VERSION}
🌍 Environment: ${NODE_ENV}
📦 App Version: ${process.env.APP_VERSION || "1.0.0"}
🔗 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3000"}
🔒 HTTPS Enabled (Self-signed certificates)
      `);
    });
  } else {
    // Fall back to HTTP if SSL certs not found
    server = app.listen(PORT, () => {
      console.log(`
🚀 ${process.env.APP_NAME || "Military LMS Backend API"} running on http://localhost:${PORT}
📡 API Base URL: http://localhost:${PORT}/api/${API_VERSION}
📊 Swagger Documentation: http://localhost:${PORT}/api-docs
🏥 Health Check: http://localhost:${PORT}/api/health
🏗️ Architecture: Frontend → Backend API → Business Services → DB Services → PostgreSQL
📝 Swagger JSON: http://localhost:${PORT}/api-docs.json
🔖 API Version: ${API_VERSION}
🌍 Environment: ${NODE_ENV}
📦 App Version: ${process.env.APP_VERSION || "1.0.0"}
🔗 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3000"}
⚠️  HTTPS disabled - SSL certificates not found
      `);
    });
  }
} catch (error) {
  console.error("❌ Failed to start HTTPS server, falling back to HTTP:", error.message);
  server = app.listen(PORT, () => {
    console.log(`
🚀 ${process.env.APP_NAME || "Military LMS Backend API"} running on http://localhost:${PORT}
📡 API Base URL: http://localhost:${PORT}/api/${API_VERSION}
📊 Swagger Documentation: http://localhost:${PORT}/api-docs
🏥 Health Check: http://localhost:${PORT}/api/health
🏗️ Architecture: Frontend → Backend API → Business Services → DB Services → PostgreSQL
📝 Swagger JSON: http://localhost:${PORT}/api-docs.json
🔖 API Version: ${API_VERSION}
🌍 Environment: ${NODE_ENV}
📦 App Version: ${process.env.APP_VERSION || "1.0.0"}
🔗 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3000"}
⚠️  HTTPS disabled - SSL certificates not found
    `);
  });
}

export default app;
