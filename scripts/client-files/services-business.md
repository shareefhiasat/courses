# Business Services Layer

## Overview

The Business Services layer contains the business logic for the LMS application. This layer orchestrates API calls, implements business rules, and provides a clean interface for frontend components.

## Architecture

```
Frontend Components
       ↓
Business Services ← You are here
       ↓
API Service Layer
       ↓
Backend API Routes
       ↓
Database Services
       ↓
MongoDB/Prisma
```

## Purpose

The Business Services layer is responsible for:

1. **Business Logic**: Implementing application-specific rules and workflows
2. **Data Validation**: Validating and sanitizing input data
3. **Error Handling**: Providing meaningful error messages to the frontend
4. **Data Transformation**: Converting data between different formats
5. **Security**: Implementing access control and permissions
6. **Integration**: Coordinating multiple API calls for complex operations

## Available Services

### Business Services Coverage

#### 1. Authentication Service (`authBusinessService.cjs`)
- **Purpose**: User authentication, authorization, and Keycloak integration
- **Features**:
  - User login/logout
  - Role-based access control (RBAC)
  - Permission checking
  - Token management
  - Keycloak integration (planned)
- **Roles Supported**: SUPER_ADMIN, ADMIN, INSTRUCTOR, HR, STUDENT
- **Role Hierarchy**: STUDENT → INSTRUCTOR → HR → ADMIN → SUPER_ADMIN

#### 2. User Service (`userBusinessService.cjs`)
- **Purpose**: User management and profile operations
- **Features**:
  - User profile management
  - User CRUD operations
  - Role-based user filtering
  - User deactivation
  - Data validation and sanitization

#### 3. Email Service (`emailBusinessService.cjs`)
- **Purpose**: Email sending and template management
- **Features**:
  - Template-based email sending (20 templates)
  - Bulk email operations
  - Multiple email providers support
  - Email delivery tracking
  - Fallback systems

#### 4. Activities Service (`activitiesBusinessService.cjs`)
- **Purpose**: Activity management and scheduling
- **Features**:
  - Activity CRUD operations
  - Class-specific activities
  - Instructor activity management
  - Activity type validation
  - Scheduling and status management

#### 5. Announcements Service (`announcementsBusinessService.cjs`)
- **Purpose**: Announcement creation and distribution
- **Features**:
  - Targeted announcements (by role, class, subject)
  - Priority-based announcements
  - Permission-based creation
  - Audience validation
  - Publishing controls

#### 6. Resources Service (`resourcesBusinessService.cjs`)
- **Purpose**: Resource management and file handling
- **Features**:
  - Resource CRUD operations
  - File URL validation
  - Class/subject resource organization
  - Resource type management
  - Access control

#### Additional Thin-Wrapper Services
- **Academic Structure**: `categoryBusinessService.cjs`, `programBusinessService.cjs`, `subjectBusinessService.cjs`, `classBusinessService.cjs`
- **Assessment**: `questionBankBusinessService.cjs`, `quizzesBusinessService.cjs`, `quizResultsBusinessService.cjs`, `quizSubmissionsBusinessService.cjs`
- **Student Operations**: `enrollmentBusinessService.cjs`, `subjectEnrollmentsBusinessService.cjs`, `attendanceBusinessService.cjs`, `attendanceSessionsBusinessService.cjs`, `participationBusinessService.cjs`, `behaviorBusinessService.cjs`, `penaltyBusinessService.cjs`
- **Communication and Productivity**: `notificationsBusinessService.cjs`, `chatBusinessService.cjs`, `bookmarkBusinessService.cjs`
- **Platform**: `scheduleBusinessService.cjs`, `templatesBusinessService.cjs`, `gamificationBusinessService.cjs`, `activityLogsBusinessService.cjs`, `dashboardBusinessService.cjs`, `healthBusinessService.cjs`
- **Pattern**: These services are intentionally thin wrappers over `apiService.cjs` so the business folder has full domain coverage now, and richer business rules can be added incrementally without changing imports.

## Usage Examples

### Authentication Service

```javascript
import { authenticateUser, hasRole, hasPermission } from '@services/business';

// Login user
const authResult = await authenticateUser('user@example.com', 'password');

// Check user role
const canAccessAdmin = hasRole('ADMIN', 'ADMIN'); // true
const canAccessSuperAdmin = hasRole('ADMIN', 'SUPER_ADMIN'); // false

// Check permissions
const canCreateClass = hasPermission('INSTRUCTOR', 'create:class'); // true
const canDeleteUser = hasPermission('ADMIN', 'delete:user'); // true
```

### Activities Service

```javascript
import { createActivity, getClassActivities } from '@services/business';

// Create new activity
const activity = await createActivity({
  title: 'JavaScript Workshop',
  description: 'Learn advanced JavaScript concepts',
  activityType: 'WORKSHOP',
  classId: 'class-123',
  scheduledDate: '2024-01-15T10:00:00Z'
}, instructorId);

// Get class activities
const activities = await getClassActivities('class-123', userId);
```

### Announcements Service

```javascript
import { createAnnouncement, getUserAnnouncements } from '@services/business';

// Create announcement
const announcement = await createAnnouncement({
  title: 'System Maintenance',
  content: 'The system will be down for maintenance...',
  targetAudience: 'ALL_USERS',
  priority: 'HIGH'
}, adminId);

// Get user announcements
const userAnnouncements = await getUserAnnouncements('user-123');
```

### Resources Service

```javascript
import { createResource, searchResources } from '@services/business';

// Create resource
const resource = await createResource({
  title: 'JavaScript Guide',
  description: 'Comprehensive JavaScript learning guide',
  resourceType: 'DOCUMENT',
  fileUrl: 'https://example.com/js-guide.pdf',
  classId: 'class-123'
}, instructorId);

// Search resources
const results = await searchResources('JavaScript', { resourceType: 'DOCUMENT' });
```

## Keycloak Integration

### Current Status
- **Planned**: Full Keycloak integration for authentication
- **Current**: Mock authentication using API service

### Integration Plan

1. **Environment Setup**:
   ```bash
   NEXT_PUBLIC_KEYCLOAK_SERVER_URL=http://localhost:8080/auth
   NEXT_PUBLIC_KEYCLOAK_REALM=lms
   NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=lms-frontend
   ```

2. **Frontend Integration**:
   ```javascript
   import Keycloak from 'keycloak-js';
   
   const keycloak = new Keycloak({
     url: 'http://localhost:8080/auth',
     realm: 'lms',
     clientId: 'lms-frontend',
   });
   
   await keycloak.init({ onLoad: 'login-required' });
   ```

3. **Role Mapping**:
   - Keycloak roles → LMS roles
   - Multi-role support (e.g., SUPER_ADMIN can also be INSTRUCTOR)
   - Role hierarchy enforcement

## Role-Based Access Control (RBAC)

### Role Hierarchy
```
SUPER_ADMIN (Level 5) - Full access
├── ADMIN (Level 4) - System management
├── HR (Level 3) - User & enrollment management
├── INSTRUCTOR (Level 2) - Class & content management
└── STUDENT (Level 1) - Basic access
```

### Multi-Role Support
- **SUPER_ADMIN**: Can have all roles simultaneously
- **Others**: Single role assignment

### Permission System
- **Granular permissions**: `resource:action` (e.g., `create:class`)
- **Role-based permissions**: Each role has predefined permissions
- **Dynamic checking**: Runtime permission validation

### Examples

```javascript
// Check if user can access admin features
if (hasRole(user.role, 'ADMIN')) {
  // Show admin interface
}

// Check specific permission
if (hasPermission(user.role, 'delete:user')) {
  // Show delete button
}

// Check multiple roles
if (hasAnyRole(user.role, ['ADMIN', 'INSTRUCTOR'])) {
  // Show instructor features
}
```

## Business Logic Examples

### Activity Validation
```javascript
// Validate scheduled date
const scheduledDate = new Date(activityData.scheduledDate);
if (scheduledDate <= new Date()) {
  throw new Error('Scheduled date must be in the future');
}

// Check instructor permissions
const classResult = await classes.getById(activityData.classId);
if (classResult.data.instructorId !== instructorId) {
  throw new Error('Access denied: You are not the instructor for this class');
}
```

### Announcement Targeting
```javascript
// Validate target audience
const validAudiences = ['ALL_USERS', 'STUDENTS', 'INSTRUCTORS', 'ADMIN', 'HR'];
if (!validAudiences.includes(announcementData.targetAudience)) {
  throw new Error('Invalid target audience');
}

// Check creation permissions
if (!canCreateAnnouncement(user, announcementData.targetAudience)) {
  throw new Error('Access denied: Insufficient permissions');
}
```

### Resource Management
```javascript
// Validate file URL
if (!isValidUrl(resourceData.fileUrl)) {
  throw new Error('Invalid file URL format');
}

// Check instructor permissions
if (resourceData.classId) {
  const classResult = await classes.getById(resourceData.classId);
  if (classResult.data.instructorId !== instructorId) {
    throw new Error('Access denied: Not the instructor for this class');
  }
}
```

## Error Handling

All business services implement consistent error handling:

```javascript
try {
  const result = await someBusinessFunction(data);
  // Handle success
} catch (error) {
  // Error is already logged by the service
  // Display user-friendly message
  showNotification(error.message, 'error');
}
```

## Data Validation

Business services validate input data:

```javascript
// Required fields validation
const requiredFields = ['title', 'description', 'activityType'];
const missingFields = requiredFields.filter(field => !data[field]);
if (missingFields.length > 0) {
  throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
}

// Enum validation
const validTypes = ['LECTURE', 'ASSIGNMENT', 'QUIZ'];
if (!validTypes.includes(data.activityType)) {
  throw new Error(`Invalid activity type. Must be one of: ${validTypes.join(', ')}`);
}
```

## Logging

All business services use centralized logging:

```javascript
logger.info('Activity created successfully', { activityId, instructorId });
logger.error('Failed to create activity', { data, error: error.message });
```

## Database Migration Status

### ✅ Completed Migration
- **Firebase Services**: All `.js` files deleted from `/src/services/db/`
- **MongoDB Services**: All `.cjs` files remain in `/src/services/db/`
- **Business Layer**: New services created with proper API integration

### 📁 Current Structure
```
/src/services/
├── db/                    # MongoDB/Prisma services (.cjs)
│   ├── activityDbService.cjs
│   ├── userDbService.cjs
│   └── ... (26 total services)
├── business/              # Business logic layer
│   ├── authBusinessService.cjs
│   ├── userBusinessService.cjs
│   ├── emailBusinessService.cjs
│   ├── activitiesBusinessService.cjs
│   ├── announcementsBusinessService.cjs
│   ├── resourcesBusinessService.cjs
│   └── index.js
├── api/                   # API client layer
│   ├── apiService.cjs
│   ├── apiConfig.cjs
│   └── README.md
└── business-deprecated/   # Firebase services (backup)
    └── ... (old services)
```

## Next Steps

1. **Complete Business Services**:
   - Add remaining services (classes, subjects, programs, etc.)
   - Implement advanced business logic
   - Add comprehensive validation

2. **Complete Keycloak Integration**:
   - Install Keycloak server
   - Configure realm and clients
   - Implement SSO flow
   - Test role mapping

3. **Email Provider Integration**:
   - Configure email provider (Resend, SendGrid, etc.)
   - Implement email templates
   - Set up email tracking
   - Test bulk email functionality

4. **Additional Business Services**:
   - Class management
   - Subject management
   - Program management
   - Quiz management
   - Attendance tracking
   - Grade management

5. **Testing**:
   - Unit tests for business logic
   - Integration tests with API layer
   - End-to-end tests for user flows

6. **Documentation**:
   - API documentation for business services
   - User guides for role-based features
   - Deployment guides for Keycloak

## Migration Notes

This business layer replaces the deprecated Firebase services. The new architecture provides:

- Better separation of concerns
- Improved security
- Easier testing
- Better error handling
- Centralized business logic

The deprecated services are preserved in `business-deprecated/` for reference.
