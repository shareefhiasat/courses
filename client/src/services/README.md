# 🏗️ Service Layer Architecture

> **PostgreSQL + Prisma + Service Layer Pattern**

---

## 📊 **Architecture Overview**

```
React Components
    ↓
Business Services (Logic Layer)
    ↓
Database Services (Data Layer)
    ↓
PostgreSQL Database
```

---

## 🗂️ **Service Structure**

### **📁 Business Services** (`src/services/business/`)
Handle business logic and validation

#### **Program Business Service**
- **File**: `programBusinessService.js`
- **Purpose**: Program CRUD operations with business rules
- **Functions**: `getAllPrograms`, `getProgramById`, `createProgram`, `updateProgram`, `deleteProgram`

### **📁 Database Services** (`src/services/db/`)
Handle direct database operations

#### **Program Database Service**
- **File**: `programDbService-postgres.cjs`
- **Purpose**: Direct PostgreSQL operations via Prisma
- **Features**: 
  - Pagination and filtering
  - Soft delete support
  - User tracking with Keycloak sync
  - Performance monitoring

### **📁 Utility Services** (`src/services/other/`)
Shared utilities and configurations

#### **Database Service**
- **File**: `dbService.js`
- **Purpose**: Generic database operations
- **Features**: 
  - CRUD operations for any model
  - Transaction support
  - Connection management
  - Error handling

#### **Configuration**
- **File**: `config.js`
- **Purpose**: Application configuration
- **Contains**: Database, API, Keycloak, and feature flags

#### **Cascade Delete Service**
- **File**: `cascadeDeleteService.cjs`
- **Purpose**: Safe deletion with dependency checking
- **Features**: 
  - Cascade rules for each entity
  - Soft delete support
  - Confirmation warnings

---

## 🔄 **Data Flow**

### **1. Read Operations**
```
Component → Business Service → Database Service → PostgreSQL
```

### **2. Write Operations**
```
Component → Business Service → Database Service → PostgreSQL
```

### **3. Delete Operations**
```
Component → Business Service → Cascade Delete Service → Database Service → PostgreSQL
```

---

## 📋 **Service Layer Benefits**

### **✅ Separation of Concerns**
- **Business Logic**: Isolated in business services
- **Data Access**: Centralized in database services
- **Validation**: Consistent across all operations

### **✅ Reusability**
- **Generic Operations**: `dbService.js` works with any model
- **Common Patterns**: Pagination, filtering, soft delete
- **Error Handling**: Standardized across all services

### **✅ Maintainability**
- **Single Responsibility**: Each service has one purpose
- **Easy Testing**: Services can be tested independently
- **Clear Interfaces**: Well-defined input/output contracts

### **✅ Performance**
- **Prisma Optimizer**: Query optimization and caching
- **Connection Pooling**: Efficient database connections
- **Pagination**: Prevents large dataset loading

---

## 🎯 **Usage Examples**

### **Program CRUD**
```javascript
// Business Service Usage
import { getAllPrograms, createProgram } from '../services/business/programBusinessService.js';

// Get all programs with pagination
const programs = await getAllPrograms({ 
  page: 1, 
  limit: 10, 
  search: 'computer',
  includeSubjects: true 
});

// Create new program
const newProgram = await createProgram({
  code: 'CS101',
  nameEn: 'Computer Science 101',
  description: 'Intro to CS'
}, user);
```

### **Generic Database Operations**
```javascript
// Database Service Usage
import { findMany, create, update } from '../services/other/dbService.js';

// Generic find with pagination
const users = await findMany('user', {
  where: { isActive: true },
  include: { role: true },
  page: 1,
  limit: 20
});

// Generic create
const newUser = await create('user', userData, currentUser);
```

### **Cascade Delete**
```javascript
// Cascade Delete Usage
import { cascadeDeleteService } from '../services/cascadeDeleteService.cjs';

// Check implications before deletion
const implications = await cascadeDeleteService.checkCascadeImplications('program', 1);

// Execute deletion with confirmation
const result = await cascadeDeleteService.executeCascadeDelete('program', 1, user, true);
```

---

## 🔧 **Configuration**

### **Database Connection**
```javascript
// Automatic connection via Prisma
const DATABASE_URL = "postgresql://military_lms:military_lms123@localhost:5432/military_lms"
```

### **Service Features**
- **Pagination**: Built-in to all list operations
- **Soft Delete**: Default for most entities
- **Audit Trails**: Automatic user tracking
- **Error Handling**: Consistent error responses
- **Performance**: Query optimization and caching

---

## 🚀 **Next Steps**

### **Add New Services**
1. **Business Service**: Create in `src/services/business/`
2. **Database Service**: Create in `src/services/db/`
3. **Follow Patterns**: Use existing services as templates

### **Extend Existing Services**
1. **Add Methods**: Follow naming conventions
2. **Add Validation**: Include business rules
3. **Add Tests**: Unit tests for all methods

### **Configuration**
1. **Environment Variables**: Update `config.js`
2. **Feature Flags**: Enable/disable features
3. **Database Settings**: Adjust connection parameters

---

*Last Updated: 2026-03-22*
*Architecture: PostgreSQL + Prisma + Service Layer*
