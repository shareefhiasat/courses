# Firebase Services

This directory contains all Firebase service files and utilities that are commonly imported throughout the application using the `@firebaseServices/` alias.

## 📁 Structure

### 🔧 Core Services
- `config.js` - Firebase configuration and initialization
- `firestore.js` - Core Firestore utilities and helpers
- `activityLogger.jsx` - Activity logging service

### 📊 Service Modules (Service.js naming convention)
- `authService.js` - Authentication operations
- `userService.js` - User management operations
- `attendanceService.js` - Attendance tracking operations
- `notificationService.js` - Notification management
- `penaltyService.js` - Penalty tracking
- `participationService.js` - Participation tracking
- `behaviorService.js` - Behavior tracking
- `programService.js` - Program management
- `quizService.js` - Quiz operations
- `submissionService.js` - Assignment submissions
- `enrollmentMarksService.js` - Enrollment and marks management
- `badgeService.js` - Badge system
- `studentProgressService.js` - Student progress tracking
- `userPreferenceService.js` - User preferences
- `quizNotifications.js` - Quiz-specific notifications

## 🎯 Usage

All files in this directory can be imported using the `@firebaseServices/` alias:

```javascript
// Import services
import { getUserById } from '@firebaseServices/userService';
import { markAttendance } from '@firebaseServices/attendanceService';
import { createQuiz } from '@firebaseServices/quizService';

// Import utilities
import { db } from '@firebaseServices/config';
import { logActivity } from '@firebaseServices/activityLogger.jsx';
```

## 📋 Naming Convention

- **Service files**: Use `Service.js` suffix (e.g., `userService.js`, `attendanceService.js`)
- **Utility files**: Use descriptive names (e.g., `config.js`, `activityLogger.jsx`)
- **Consistent imports**: All use the `@firebaseServices/` prefix

## 🔗 Related Directories

- `../firebase/` - Legacy Firebase files (attendance.js, dashboard.js, etc.)
- `../constants/` - Application constants and enums
- `../utils/` - General utility functions

## 🚀 Benefits

- **Clear organization**: All Firebase services in one dedicated folder
- **Consistent aliasing**: `@firebaseServices/` matches folder name exactly
- **Easy discovery**: Developers know where to find Firebase-related code
- **Maintainable structure**: Logical grouping of related functionality
- **Proper separation of concerns**: Business services use DB services, never direct Firebase
- **Type safety**: All services use shared types from `@types/index`
- **Consolidated architecture**: Enrollment and marks operations unified
- **Clean naming**: Service names clearly indicate their purpose and scope

## 🏗️ Recent Architecture Improvements

### Service Layer Refactoring
- **Merged services**: `marksDbService.js` + `marksDistributionDbService.js` → `enrollmentsDbService.js`
- **Renamed services**: `gradingService.js` → `enrollmentMarksService.js`
- **Business logic separation**: All database operations go through DB services layer

### Data Flow Pattern
```
UI Components → Business Services → DB Services → Firestore
```

### Key Principles
- **No direct Firebase calls** in business services
- **Shared types** for all role definitions and data structures
- **Composite key structure** for marks lookup: `${studentId}_${classId}_${subjectId}`
- **Error handling** with consistent ServiceResponse pattern

### File Structure
```
📁 services/
├── 📁 business/           # Business logic and validation
│   ├── enrollmentMarksService.js  # Enrollment & marks management
│   ├── attendanceService.js       # Attendance operations
│   └── ...
├── 📁 db/                # Direct Firestore operations only
│   ├── enrollmentsDbService.js    # All enrollment/marks DB ops
│   ├── userDbService.js           # User DB operations
│   └── ...
└── 📁 other/             # Utilities and configurations
```
