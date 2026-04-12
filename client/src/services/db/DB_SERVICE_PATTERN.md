# Database Service Pattern - Production-Ready Architecture

## Overview
This document defines the **reusable pattern** for all database services in the LMS application. Follow this pattern for consistency, maintainability, and best practices.

---

## Architecture Layers

### 1. **Database Layer** (`/services/db/*DbService-postgres.cjs`)
- Direct Prisma client connection
- CRUD operations
- Query building
- Data transformation

### 2. **Business Layer** (`/services/business/*Service.js`)
- Business logic
- Validation
- Authorization
- Service orchestration

### 3. **UI Layer** (`/pages` and `/components`)
- React components
- State management
- User interaction
- Display logic

---

## Database Service Pattern

### File Structure
```
src/services/
├── db/
│   ├── programDbService-postgres.cjs    ✅ Reference implementation
│   ├── classDbService-postgres.cjs
│   ├── activityDbService-postgres.cjs
│   └── userDbService-postgres.cjs
└── business/
    ├── programService.js                ✅ Reference implementation
    ├── classService.js
    ├── activityService.js
    └── userService.js
```

---

## ✅ Reference Implementation: programDbService-postgres.cjs

```javascript
/**
 * Program Database Service - PostgreSQL/Prisma
 * 
 * PURPOSE: Handles all database operations for programs using Prisma with PostgreSQL
 * ARCHITECTURE: Direct Prisma client with proper browser-compatible configuration
 */

import { PrismaClient } from '@prisma/client';

// Singleton Prisma client instance
let prisma = null;

// Get Prisma client instance (singleton pattern)
const getPrismaClient = async () => {
  if (!prisma) {
    try {
      // ⚠️ IMPORTANT: Use import.meta.env (Vite) NOT process.env (Node.js)
      const databaseUrl = import.meta.env.VITE_DATABASE_URL || 'postgresql://military_lms:military_lms123@localhost:5432/military_lms';
      
      prisma = new PrismaClient({
        log: ['error', 'warn'], // Minimal logging for production
        datasources: {
          db: {
            url: databaseUrl
          }
        }
      });
      
      await prisma.$connect();
      console.log('[ProgramDbService] ✅ Connected to PostgreSQL');
    } catch (err) {
      console.error('[ProgramDbService] ❌ Failed to connect to PostgreSQL:', err);
      throw new Error('Database connection failed');
    }
  }
  return prisma;
};

/**
 * Get all programs from PostgreSQL with pagination and filtering
 */
const getPrograms = async (params = {}) => {
  const startTime = Date.now();
  try {
    console.log('[ProgramDbService] Getting programs with params:', params);
    
    // Get Prisma client with singleton pattern
    const prisma = await getPrismaClient();
    
    const {
      page = 1,
      limit = 10,
      search,
      status,
      includeSubjects = false,
      includeClasses = false,
      orderBy = 'nameEn',
      orderDirection = 'asc'
    } = params;

    // Build where clause
    const where = {};
    if (search) {
      where.OR = [
        { nameEn: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (status) {
      where.status = status;
    }

    // Build include clause
    const include = {};
    if (includeSubjects) include.subjects = true;
    if (includeClasses) include.classes = true;

    // Execute query with pagination
    const [programs, total] = await Promise.all([
      prisma.program.findMany({
        where,
        include: Object.keys(include).length > 0 ? include : undefined,
        orderBy: { [orderBy]: orderDirection },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.program.count({ where })
    ]);

    const duration = Date.now() - startTime;
    console.log(`[ProgramDbService] ✅ Retrieved ${programs.length} programs in ${duration}ms`);

    return {
      success: true,
      data: programs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[ProgramDbService] ❌ Error getting programs:', error);
    return { success: false, error: error.message };
  }
};

// Export all functions
export default {
  getPrograms,
  getProgramById,
  create,
  update,
  deleteProgram
};
```

---

## ✅ Reference Implementation: programService.js (Business Layer)

```javascript
import { info, error, warn, debug } from '../utils/logger.js';

const serviceName = 'programService';

// Lazy loading of database service
let dbService = null;
const getDbService = async () => {
  if (!dbService) {
    try {
      dbService = await import('../db/programDbService-postgres.cjs');
    } catch (err) {
      console.error('Failed to import database service:', err);
      throw new Error('Database service not available');
    }
  }
  return dbService.default || dbService;
};

// Core program operations
export const getAllPrograms = async (params = {}) => {
  try {
    info(`${serviceName}:getAllPrograms`, { params });
    
    // Use PostgreSQL database service
    const service = await getDbService();
    const result = await service.getPrograms(params);
    return result;
  } catch (err) {
    console.error(`${serviceName}:getAllPrograms:error`, { error: err.message, params });
    return {
      success: false,
      error: err.message || 'Failed to retrieve programs',
      data: []
    };
  }
};
```

---

## Key Principles

### ✅ DO's

1. **Use `import.meta.env` for environment variables** (NOT `process.env`)
2. **Singleton pattern** for Prisma client
3. **Async/await** for all database operations
4. **Try-catch** blocks with proper error handling
5. **Consistent return format**: `{ success, data, error, ... }`
6. **Performance logging** with timestamps
7. **Lazy loading** for database services
8. **ES modules** (import/export) NOT CommonJS (require)

### ❌ DON'Ts

1. **DON'T use `process.env`** - it's not available in browser
2. **DON'T use `require()`** - causes errors in ES modules
3. **DON'T create multiple Prisma instances** - use singleton
4. **DON'T mix CommonJS and ES modules**
5. **DON'T put business logic in database layer**
6. **DON'T put database queries in UI components**

---

## Environment Variables

### .env file
```bash
# PostgreSQL Database Configuration
DATABASE_URL="postgresql://military_lms:military_lms123@localhost:5432/military_lms"
VITE_DATABASE_URL="postgresql://military_lms:military_lms123@localhost:5432/military_lms"
```

### Usage in Code
```javascript
// ✅ CORRECT (Browser-compatible)
const databaseUrl = import.meta.env.VITE_DATABASE_URL;

// ❌ WRONG (Node.js only)
const databaseUrl = process.env.DATABASE_URL;
```

---

## Replication Steps

To create a new database service (e.g., `classDbService-postgres.cjs`):

1. **Copy** `programDbService-postgres.cjs`
2. **Rename** all references from "Program" to "Class"
3. **Update** Prisma model from `prisma.program` to `prisma.class`
4. **Adjust** query parameters and fields as needed
5. **Test** the service with the business layer
6. **Verify** no `require()` or `process.env` usage

---

## Error Handling Pattern

```javascript
try {
  const prisma = await getPrismaClient();
  const result = await prisma.model.operation();
  return { success: true, data: result };
} catch (error) {
  console.error('[ServiceName] ❌ Error:', error);
  return { success: false, error: error.message };
}
```

---

## Testing Checklist

- [ ] Service connects to PostgreSQL successfully
- [ ] CRUD operations work correctly
- [ ] Pagination works as expected
- [ ] Search/filtering works correctly
- [ ] Error handling returns proper format
- [ ] No `require()` errors in console
- [ ] No `process is not defined` errors
- [ ] Performance logging shows reasonable times
- [ ] Singleton pattern prevents multiple connections

---

## Summary

This pattern ensures:
- ✅ **Browser compatibility** (import.meta.env)
- ✅ **Connection pooling** (singleton pattern)
- ✅ **Clean architecture** (separation of concerns)
- ✅ **Error resilience** (proper error handling)
- ✅ **Performance** (minimal logging, efficient queries)
- ✅ **Maintainability** (consistent pattern across services)

**Follow this pattern for all database services to maintain consistency and avoid common pitfalls.**
