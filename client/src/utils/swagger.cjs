/**
 * Swagger API Documentation Configuration
 * Auto-generates API documentation from JSDoc comments
 */

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Military LMS API',
    version: '1.0.0',
    description: 'Complete API documentation for Military Learning Management System',
    contact: {
      name: 'Military LMS Support',
      email: 'support@milmanylms.com',
    },
    license: {
      name: 'Proprietary',
    },
  },
  servers: [
    {
      url: 'https://localhost:3000',
      description: 'Development server',
    },
    {
      url: 'https://api.milmanylms.com',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
        description: 'API key for authentication',
      },
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token for authentication',
      },
    },
    schemas: {
      Category: {
        type: 'object',
        required: ['nameEn', 'nameAr', 'icon', 'color', 'order'],
        properties: {
          id: {
            type: 'string',
            description: 'Unique identifier',
            example: '64f8a1b2c3d4e5f6a7b8c9d0',
          },
          nameEn: {
            type: 'string',
            description: 'Category name in English',
            example: 'Mathematics',
          },
          nameAr: {
            type: 'string',
            description: 'Category name in Arabic',
            example: 'الرياضيات',
          },
          icon: {
            type: 'string',
            description: 'Icon name or emoji',
            example: 'calculator',
          },
          descriptionEn: {
            type: 'string',
            description: 'Category description in English',
            example: 'Mathematics courses and tutorials',
          },
          descriptionAr: {
            type: 'string',
            description: 'Category description in Arabic',
            example: 'دورات ودروس الرياضيات',
          },
          color: {
            type: 'string',
            description: 'Hex color code',
            example: '#3B82F6',
          },
          order: {
            type: 'integer',
            description: 'Display order',
            example: 1,
          },
          isActive: {
            type: 'boolean',
            description: 'Whether category is active',
            example: true,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
          },
        },
      },
      ApiResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Whether the operation was successful',
            example: true,
          },
          data: {
            type: 'array',
            description: 'Response data',
            items: {
              $ref: '#/components/schemas/Category',
            },
          },
          count: {
            type: 'integer',
            description: 'Number of items in data array',
            example: 5,
          },
          error: {
            type: 'string',
            description: 'Error message (if success is false)',
            example: 'Category not found',
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        required: ['success', 'error'],
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          error: {
            type: 'string',
            description: 'Error message',
            example: 'Validation failed',
          },
          details: {
            type: 'object',
            description: 'Additional error details',
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'Health',
      description: 'Health check and system status',
    },
    {
      name: 'Categories',
      description: 'Category management operations',
    },
    {
      name: 'Users',
      description: 'User management operations',
    },
    {
      name: 'Authentication',
      description: 'Authentication and authorization',
    },
  ],
};

// Options for swagger-jsdoc
const options = {
  definition: swaggerDefinition,
  apis: [
    './pages/api/**/*.cjs',          // API routes
    './src/services/**/*.js',        // Service files
    './src/utils/**/*.js',           // Utility files
  ],
};

// Generate swagger specification
const swaggerSpec = swaggerJsdoc(options);

// Swagger UI options
const swaggerUiOptions = {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Military LMS API Documentation',
  customfavIcon: '/favicon.ico',
};

module.exports = {
  swaggerSpec,
  swaggerUi,
  swaggerUiOptions,
};
