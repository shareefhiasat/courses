# API Service Layer

## Overview

The API Service layer provides a centralized interface for frontend components to communicate with the LMS backend APIs. This layer abstracts away the complexity of HTTP requests and provides a clean, type-safe interface for all API operations.

## Architecture

```
Frontend Components
       ↓
Business Services
       ↓
API Service Layer ← You are here
       ↓
Backend API Routes
       ↓
Database Services
       ↓
MongoDB/Prisma
```

## Files Structure

### 📁 `/src/services/api/`
- **`apiConfig.cjs`** - Centralized API configuration (CommonJS)
- **`apiService.cjs`** - Main API client with all service methods
- **`README.md`** - This documentation file

## Configuration

### `apiConfig.cjs`
- **Purpose**: Centralized API configuration for server-side use
- **Format**: CommonJS (.cjs) for Node.js compatibility
- **Features**:
  - Environment-based configuration
  - Version management
  - Endpoint URL generation
  - Header management

### Environment Variables
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_API_VERSION=v1

# Optional: API Key for authentication
NEXT_PUBLIC_API_KEY=your-api-key-here
```

## Usage Pattern

**❌ WRONG: Direct DB calls from frontend**
```javascript
// Don't do this in frontend components
import userDbService from '@services/db/userDbService.cjs';
const users = await userDbService.getUsers();
```

**✅ CORRECT: Use API Service**
```javascript
// Business services should use API service
import { users } from '@services/api/apiService.cjs';
const result = await users.getAll();
```

## Available Services

### Core Services (8)
- **categories** - Category management
- **programs** - Program management  
- **subjects** - Subject management
- **classes** - Class management
- **activities** - Activity management
- **announcements** - Announcement management
- **resources** - Resource management
- **users** - User management

### Assessment Services (4)
- **quizResults** - Quiz result management
- **quizSubmissions** - Quiz submission management
- **quizzes** - Quiz management
- **questionBank** - Question bank management

### Student Services (7)
- **penalties** - Penalty management
- **participations** - Participation tracking
- **behaviors** - Behavior tracking
- **attendance** - Attendance management
- **attendanceSessions** - Attendance session management
- **enrollments** - Enrollment management
- **subjectEnrollments** - Subject enrollment management

### Communication Services (2)
- **notifications** - Notification management
- **chat** - Chat/messaging system

### System Services (5)
- **schedules** - Schedule management
- **templates** - Template management
- **gamifications** - Gamification features
- **bookmarks** - Bookmark management
- **activityLogs** - Activity logging
- **dashboards** - Dashboard management

### Utility Services (1)
- **health** - Health check endpoint

## API Methods

Each service provides standard CRUD operations:

```javascript
// Get all items
const result = await users.getAll({ limit: 10, offset: 0 });

// Get single item by ID
const result = await users.getById('user-id');

// Create new item
const result = await users.create({ name: 'John', email: 'john@example.com' });

// Update existing item
const result = await users.update('user-id', { name: 'John Updated' });

// Delete item
const result = await users.delete('user-id');
```

## Special Methods

Some services provide additional methods:

```javascript
// User profile management
const profile = await users.getProfile();
const updated = await users.updateProfile({ name: 'New Name' });

// Notification actions
await notifications.markAsRead('notification-id');

// Attendance statistics
const stats = await attendance.getClassStats('class-id');

// Chat conversations
const conversation = await chat.getConversation('user1', 'user2');

// Quiz publishing
await quizzes.publish('quiz-id');

// Dashboard defaults
const defaultDashboard = await dashboards.getUserDefault('user-id');
await dashboards.setAsDefault('dashboard-id', 'user-id');
```

## Authentication

The API service automatically handles authentication:

- **API Key**: Added to all requests via `x-api-key` header
- **JWT Token**: Added to client-side requests via `Authorization` header
- **Auto-redirect**: 401 responses automatically redirect to login

## Error Handling

All API calls return a standardized response:

```javascript
const result = await users.getAll();

if (result.success) {
  console.log('Data:', result.data);
  console.log('Status:', result.status);
} else {
  console.error('Error:', result.error);
  console.error('Status:', result.status);
}
```

## Request/Response Interceptors

The API service includes interceptors for:

- **Request logging**: Logs all outgoing requests
- **Response logging**: Logs all responses
- **Error handling**: Centralized error processing
- **Authentication**: Auto-adds auth headers
- **Token refresh**: Handles 401 responses

## Example Usage in Business Service

```javascript
// src/services/business/userBusinessService.cjs
const { users } = require('@services/api/apiService.cjs');
const { logger } = require('@services/utils/logger');

const getUserProfile = async (userId) => {
  try {
    const result = await users.getById(userId);
    
    if (result.success) {
      logger.info('User profile retrieved', { userId });
      return result.data;
    } else {
      logger.error('Failed to get user profile', { userId, error: result.error });
      throw new Error(result.error);
    }
  } catch (error) {
    logger.error('User business service error', { userId, error: error.message });
    throw error;
  }
};

module.exports = {
  getUserProfile,
};
```

## Swagger Documentation

All API endpoints are documented with Swagger:

- **Interactive API Docs**: `http://localhost:3000/api-docs`
- **JSON Spec**: `http://localhost:3000/api-docs.json`

## Migration Notes

This API service replaces direct database calls from the frontend. Business services should be updated to use this API service instead of calling DB services directly.

### Before Migration
```javascript
// Old way - direct DB access
import userDbService from '@services/db/userDbService.cjs';
const users = await userDbService.getUsers();
```

### After Migration
```javascript
// New way - API service
import { users } from '@services/api/apiService.cjs';
const result = await users.getAll();
```

## Benefits

1. **Separation of Concerns**: Frontend doesn't directly access database
2. **Security**: All requests go through API routes with authentication
3. **Consistency**: Standardized error handling and response format
4. **Maintainability**: Centralized API client configuration
5. **Testability**: Easy to mock API calls in tests
6. **Performance**: Request/response interceptors for optimization
7. **Logging**: Comprehensive request/response logging

## Configuration Management

### Why Only One Config File?
- **Consistency**: Single source of truth for API configuration
- **Maintainability**: Easier to update settings in one place
- **CommonJS Format**: Works with both Node.js and browser environments
- **Environment Support**: Handles different environments (dev, staging, prod)

### Removed Duplicate
- **Deleted**: `apiConfig.js` (ES Module duplicate)
- **Kept**: `apiConfig.cjs` (CommonJS version)
- **Reason**: CommonJS works everywhere in our Node.js/Next.js setup

## Next Steps

1. Update all business services to use API service instead of DB services
2. Remove direct DB imports from frontend components
3. Add proper TypeScript types for better type safety
4. Implement request caching where appropriate
5. Add retry logic for failed requests
6. Set up API monitoring and analytics
