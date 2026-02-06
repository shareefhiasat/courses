# Global Role Configuration System

## Overview

The Global Role Configuration System provides a centralized way to manage all role-based limitations and permissions across the application. It replaces scattered configuration files with a single, comprehensive system.

## Structure

### Role Categories

Each user role has configurations for these categories:

- **chat** - Chat functionality limitations
- **quiz** - Quiz creation and participation limits
- **activity** - Activity submission and management
- **dashboard** - Dashboard access and permissions
- **files** - File upload and storage limitations

### Supported Roles

- `USER_ROLES.STUDENT` - Basic student permissions
- `USER_ROLES.INSTRUCTOR` - Teacher permissions
- `USER_ROLES.HR` - HR staff permissions
- `USER_ROLES.ADMIN` - System administrator
- `USER_ROLES.SUPER_ADMIN` - Super administrator

## Usage Examples

### Basic Usage

```javascript
import { getRoleConfig, hasPermission, getRoleLimit } from '@constants';

// Get chat configuration for a student
const chatConfig = getRoleConfig(USER_ROLES.STUDENT, 'chat');
console.log(chatConfig.maxFileSize); // 5MB

// Check if instructor can create quizzes
const canCreate = hasPermission(USER_ROLES.INSTRUCTOR, 'quiz', 'canCreateQuiz');
console.log(canCreate); // true

// Get max file size for admin
const maxSize = getRoleLimit(USER_ROLES.ADMIN, 'files', 'maxFileSize');
console.log(maxSize); // 50MB
```

### Advanced Usage

```javascript
import { 
  canUserUploadFile, 
  getAccessibleFeatures, 
  validateFileUploadForRole,
  canUserManageOtherUser 
} from '@constants';

// Check if user can upload a specific file
const canUpload = canUserUploadFile(USER_ROLES.STUDENT, 1024 * 1024, 'image/jpeg');

// Get all accessible features for a role
const features = getAccessibleFeatures(USER_ROLES.INSTRUCTOR);
console.log(features.dashboard.canManageClasses); // true

// Validate multiple files for upload
const validation = validateFileUploadForRole(USER_ROLES.ADMIN, files);
if (!validation.isValid) {
  console.error(validation.errors);
}

// Check role hierarchy
const canManage = canUserManageOtherUser(USER_ROLES.ADMIN, USER_ROLES.INSTRUCTOR);
```

## Configuration Examples

### Student Limitations
```javascript
{
  chat: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxVoiceRecordingTime: 5 * 60, // 5 minutes
    canCreateGlobalChat: false,
    canCreateClassChat: false
  },
  quiz: {
    maxAttemptsPerDay: 10,
    canRetakeQuiz: true,
    canSeeCorrectAnswers: false
  },
  files: {
    maxFileSize: 5 * 1024 * 1024,
    totalStorageLimit: 100 * 1024 * 1024 // 100MB
  }
}
```

### Super Admin Privileges
```javascript
{
  chat: {
    maxFileSize: 100 * 1024 * 1024, // 100MB
    maxVoiceRecordingTime: 60 * 60, // 60 minutes
    canCreateGlobalChat: true,
    canDeleteAnyMessage: true,
    canManageSystemSettings: true
  },
  dashboard: {
    canManageSystem: true,
    canModifySystemSettings: true,
    canAccessSystemLogs: true
  },
  files: {
    maxFileSize: 100 * 1024 * 1024, // 100MB
    totalStorageLimit: 50 * 1024 * 1024 * 1024 // 50GB
  }
}
```

## Migration from Old System

### Before (chatLimitations.js)
```javascript
import { CHAT_LIMITATIONS, getChatLimitations } from '@constants';

const chatLimits = getChatLimitations(USER_ROLES.STUDENT);
```

### After (roleConfigurations.js)
```javascript
import { getRoleConfig } from '@constants';

const chatLimits = getRoleConfig(USER_ROLES.STUDENT, 'chat');
```

## Adding New Limitations

To add a new limitation category:

1. Add the category to each role in `ROLE_CONFIGURATIONS`
2. Update utility functions as needed
3. Add examples in `roleConfigExamples.js`

Example:
```javascript
// In roleConfigurations.js
[USER_ROLES.STUDENT]: {
  // ... existing categories
  newCategory: {
    maxItems: 10,
    canEdit: false,
    allowedTypes: ['type1', 'type2']
  }
}
```

## Benefits

1. **Centralized Management** - All role configurations in one place
2. **Type Safety** - Consistent structure across all roles
3. **Easy Extension** - Simple to add new limitations
4. **Backward Compatibility** - Existing chat limitations still work
5. **Role Hierarchy** - Built-in role comparison functions
6. **Comprehensive Coverage** - Covers all application areas

## Available Functions

### Core Functions
- `getRoleConfig(role, category)` - Get configuration for role and category
- `hasPermission(role, category, permission)` - Check specific permission
- `getRoleLimit(role, category, limitType)` - Get numeric limits
- `isFileTypeAllowedForRole(role, category, fileType)` - Check file type permissions

### Utility Functions
- `getAllRolePermissions(role)` - Get all permissions for a role
- `getHigherPrivilegeRole(role1, role2)` - Compare role privileges
- `canManageRole(actorRole, targetRole)` - Check role management permissions

### Example Functions
- `canUserUploadFile(role, fileSize, fileType)` - File upload validation
- `getAccessibleFeatures(role)` - Get all features for a role
- `validateFileUploadForRole(role, files)` - Validate multiple files
- `getUserStorageInfo(role, currentUsage)` - Storage usage information

This system provides a solid foundation for role-based access control and can be easily extended as the application grows.
