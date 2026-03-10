# Creating New Services

This guide shows you how to create new API services using our standardized templates and patterns.

## 🎯 Overview

Every service in Military LMS follows the same architecture:

1. **Database Service** (`src/services/db/`) - Handles database operations
2. **API Route** (`pages/api/`) - Handles HTTP requests/responses
3. **Swagger Documentation** - Auto-generated API docs
4. **Middleware Integration** - Security, logging, error handling

## 🚀 Quick Start: Create a New Service

Let's create a **Subjects** service as an example.

### Step 1: Create Database Service

Copy the template and customize:

```bash
cp src/services/db/baseDbService-mongodb.cjs src/services/db/subjectDbService.cjs
```

**Edit `subjectDbService.cjs`:**

```javascript
const { PrismaClient } = require('@prisma/client');
const { logger, logDbOperation } = require('@services/utils/logger');

console.log('[SubjectDbService] Initializing Prisma Client...');
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

prisma.$connect()
  .then(() => {
    console.log('[SubjectDbService] ✅ Prisma connected successfully');
    logger.info('Prisma connected successfully', { service: 'SubjectDbService' });
  })
  .catch((err) => {
    console.error('[SubjectDbService] ❌ Prisma connection failed:', err);
    logger.error('Prisma connection failed', { 
      service: 'SubjectDbService', 
      error: err.message,
      stack: err.stack 
    });
  });

/**
 * Get all subjects from MongoDB
 */
const getSubjects = async () => {
  const startTime = Date.now();
  try {
    logger.info('Getting all subjects', { 
      service: 'SubjectDbService', 
      operation: 'getSubjects' 
    });
    
    const subjects = await prisma.subject.findMany({
      orderBy: { nameEn: 'asc' },
      include: {
        program: true,
        classes: true
      }
    });
    
    const duration = Date.now() - startTime;
    logDbOperation('findMany', 'subject', {}, subjects, duration);
    
    logger.info('Subjects retrieved successfully', { 
      service: 'SubjectDbService', 
      operation: 'getSubjects',
      count: subjects.length,
      duration: `${duration}ms`
    });
    
    return { success: true, data: subjects };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting subjects', { 
      service: 'SubjectDbService', 
      operation: 'getSubjects',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

// ... implement other CRUD operations

module.exports = {
  getSubjects,
  getSubjectById,
  create,
  update,
  deleteSubject
};
```

### Step 2: Create API Route

Copy the template and customize:

```bash
cp src/services/utils/serviceTemplate.cjs pages/api/subjects.cjs
```

**Edit `subjects.cjs`:**

```javascript
/**
 * @swagger
 * /api/v1/subjects:
 *   get:
 *     summary: Get all subjects
 *     tags: [Subjects]
 *     responses:
 *       200:
 *         description: List of subjects
 */

const { getApiUrl, API_VERSION } = require('@services/api/apiConfig.cjs');
const { logger } = require('@services/utils/logger');
const subjectDbService = require('@services/db/subjectDbService.cjs');

const {
  getSubjects,
  getSubjectById,
  create: createSubject,
  update: updateSubject,
  deleteSubject
} = subjectDbService;

function handler(req, res) {
  const { method } = req;
  const startTime = Date.now();
  
  logger.info('API request received', {
    service: 'SubjectsAPI',
    method,
    url: `/api/${API_VERSION}/subjects`,
    query: req.query,
    body: req.body
  });

  switch (method) {
    case 'GET':
      return handleGet(req, res);
    case 'POST':
      return handlePost(req, res);
    case 'PUT':
      return handlePut(req, res);
    case 'DELETE':
      return handleDelete(req, res);
    default:
      return res.status(405).json({ 
        success: false, 
        error: `Method ${method} Not Allowed` 
      });
  }
}

async function handleGet(req, res) {
  const startTime = Date.now();
  try {
    const { id } = req.query;
    
    if (id) {
      const result = await getSubjectById(id);
      const duration = Date.now() - startTime;
      
      logger.info('Subject retrieved', {
        service: 'SubjectsAPI',
        subjectId: id,
        success: result.success,
        duration: `${duration}ms`
      });
      
      return res.status(200).json(result);
    } else {
      const result = await getSubjects();
      const duration = Date.now() - startTime;
      
      logger.info('Subjects retrieved', {
        service: 'SubjectsAPI',
        count: result.data?.length || 0,
        duration: `${duration}ms`
      });
      
      return res.status(200).json(result);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error in GET handler', {
      service: 'SubjectsAPI',
      error: error.message,
      duration: `${duration}ms`
    });
    return res.status(500).json({ success: false, error: error.message });
  }
}

// ... implement other handlers

module.exports = handler;
```

### Step 3: Add to Server

**Edit `server.cjs`:**

```javascript
// Import handler
const subjectsHandler = require('./pages/api/subjects.cjs');

// Mount route
app.all('/api/v1/subjects', (req, res) => {
  subjectsHandler(req, res);
});
```

### Step 4: Add Swagger Schemas

**Edit `src/utils/swagger.cjs`:**

```javascript
schemas: {
  Subject: {
    type: 'object',
    required: ['nameEn', 'code', 'programId'],
    properties: {
      id: { type: 'string' },
      nameEn: { type: 'string', example: 'Mathematics' },
      nameAr: { type: 'string', example: 'الرياضيات' },
      code: { type: 'string', example: 'MATH101' },
      programId: { type: 'string' },
      credits: { type: 'integer', example: 3 },
      isActive: { type: 'boolean', example: true }
    }
  },
  SubjectInput: {
    type: 'object',
    required: ['nameEn', 'code', 'programId'],
    properties: {
      nameEn: { type: 'string' },
      nameAr: { type: 'string' },
      code: { type: 'string' },
      programId: { type: 'string' },
      credits: { type: 'integer' },
      isActive: { type: 'boolean', default: true }
    }
  }
},
tags: [
  { name: 'Subjects', description: 'Subject management operations' }
]
```

### Step 5: Test Your Service

```bash
# Start API server
pnpm run api

# Test GET all subjects
curl https://localhost:3000/api/v1/subjects

# Test GET subject by ID
curl https://localhost:3000/api/v1/subjects?id=123

# Test POST create subject
curl -X POST https://localhost:3000/api/v1/subjects \
  -H "Content-Type: application/json" \
  -d '{"nameEn":"Mathematics","code":"MATH101","programId":"abc123"}'
```

## 📋 Service Checklist

Use this checklist for every new service:

### Database Service
- [ ] Copy `baseDbService-mongodb.cjs` template
- [ ] Rename to `{service}DbService.cjs`
- [ ] Update service name throughout
- [ ] Update Prisma model calls
- [ ] Add ELK logging with service context
- [ ] Add performance timing
- [ ] Add error handling
- [ ] Implement all CRUD operations
- [ ] Add graceful shutdown handler

### API Route
- [ ] Copy `serviceTemplate.cjs`
- [ ] Rename to `{service}.cjs`
- [ ] Update service name throughout
- [ ] Add Swagger JSDoc annotations
- [ ] Implement all HTTP handlers (GET, POST, PUT, DELETE)
- [ ] Add input validation
- [ ] Add request logging
- [ ] Add error handling
- [ ] Export handler function

### Integration
- [ ] Add route to `server.cjs`
- [ ] Add Swagger schemas to `swagger.cjs`
- [ ] Add Swagger tag to `swagger.cjs`
- [ ] Update documentation
- [ ] Test all endpoints
- [ ] Verify ELK logs

### Testing
- [ ] Test GET all items
- [ ] Test GET item by ID
- [ ] Test POST create item
- [ ] Test PUT update item
- [ ] Test DELETE item
- [ ] Test error cases
- [ ] Test validation
- [ ] Verify logs in Kibana

## 🎨 Best Practices

### **Use Aliases**
```javascript
// ✅ Good
const { logger } = require('@services/utils/logger');
const dbService = require('@services/db/subjectDbService.cjs');

// ❌ Bad
const { logger } = require('../../src/services/utils/logger');
const dbService = require('../../src/services/db/subjectDbService.cjs');
```

### **Structured Logging**
```javascript
// ✅ Good
logger.info('Operation completed', {
  service: 'SubjectDbService',
  operation: 'getSubjects',
  count: subjects.length,
  duration: `${duration}ms`
});

// ❌ Bad
console.log('Got subjects:', subjects.length);
```

### **Error Handling**
```javascript
// ✅ Good
try {
  const result = await getSubjects();
  return res.status(200).json(result);
} catch (error) {
  logger.error('Error getting subjects', {
    service: 'SubjectsAPI',
    error: error.message,
    stack: error.stack
  });
  return res.status(500).json({ success: false, error: error.message });
}

// ❌ Bad
const result = await getSubjects();
res.json(result);
```

### **Performance Monitoring**
```javascript
// ✅ Good
const startTime = Date.now();
const result = await operation();
const duration = Date.now() - startTime;
logger.info('Operation completed', { duration: `${duration}ms` });

// ❌ Bad
const result = await operation();
```

## 🔧 Advanced Features

### **Custom Validation**
```javascript
async function handlePost(req, res) {
  const { nameEn, code, programId } = req.body;
  
  // Validate required fields
  if (!nameEn || !code || !programId) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields',
      details: {
        nameEn: !nameEn ? 'Required' : undefined,
        code: !code ? 'Required' : undefined,
        programId: !programId ? 'Required' : undefined
      }
    });
  }
  
  // Continue with creation...
}
```

### **Pagination**
```javascript
const getSubjects = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  
  const [subjects, total] = await Promise.all([
    prisma.subject.findMany({
      skip,
      take: limit,
      orderBy: { nameEn: 'asc' }
    }),
    prisma.subject.count()
  ]);
  
  return {
    success: true,
    data: subjects,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};
```

### **Search & Filtering**
```javascript
const searchSubjects = async (query) => {
  const subjects = await prisma.subject.findMany({
    where: {
      OR: [
        { nameEn: { contains: query, mode: 'insensitive' } },
        { nameAr: { contains: query, mode: 'insensitive' } },
        { code: { contains: query, mode: 'insensitive' } }
      ]
    }
  });
  
  return { success: true, data: subjects };
};
```

## 📚 Templates

All templates are located in:
- **Database Service**: `src/services/db/baseDbService-mongodb.cjs`
- **API Route**: `src/services/utils/serviceTemplate.cjs`

## 🎯 Next Steps

1. [Middleware Guide](./middleware) - Add security and logging
2. [Error Handling](./error-handling) - Handle errors properly
3. [Testing](./testing) - Write tests for your service

---

**Ready to create your first service?** Follow this guide step by step! 🚀
