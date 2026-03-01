# QAF Courses - Learning Management System

## Overview
QAF Courses is a comprehensive Learning Management System (LMS) built with React and Firebase, featuring activity logging, notifications, user management, and academic tools.

## Architecture

### Frontend (React)
- **Location**: `client/` directory
- **Tech Stack**: React, Firebase, Tailwind CSS, Material-UI components
- **Key Features**: Real-time updates, responsive design, bilingual support (English/Arabic)

### Backend (Firebase Functions)
- **Location**: `functions/` directory
- **Tech Stack**: Node.js, Firebase Cloud Functions
- **Services**: Email notifications, user management, data processing

### Database (Firestore)
- **Collections**: `users`, `activityLogs`, `enrollments`, `classes`, `activities`, etc.
- **Real-time**: Live data synchronization across clients

---

## Activity Logging System

### Overview
Comprehensive tracking of all user actions and system events within the LMS for security, analytics, and audit purposes.

### Storage & Files
- **Collection**: `activityLogs` in Firestore
- **Core Files**:
  - `client/src/services/other/activityLogger.jsx` - Main logging engine
  - `client/src/services/db/activityLogDbService.js` - Database operations
  - `client/src/services/business/activityService.js` - Business logic layer
  - `client/src/pages/system/LogsActivityPage.jsx` - Admin dashboard for viewing logs

### Activity Types (Constants)
All activity types are defined in `ACTIVITY_LOG_TYPES`:

#### Authentication & Security
- `login` - User login events
- `logout` - User logout events  
- `session_timeout` - Automatic session expiration
- `profile_update` - Profile changes
- `password_change` - Password updates
- `email_change` - Email address changes

#### User Management
- `user_created` - New user registration
- `user_updated` - Profile changes, role updates, account status changes
- `user_deleted` - User account deletion

#### Academic Activities
- `quiz_started`, `quiz_submitted`, `quiz_viewed` - Quiz interactions
- `assignment_started`, `assignment_submitted` - Assignment work
- `submission_graded`, `feedback_given` - Grading activities

#### Content Management
- `activity_created`, `activity_updated`, `activity_deleted` - CRUD operations
- `resource_viewed`, `resource_completed`, `resource_bookmarked` - Resource interactions
- `announcement_created`, `announcement_updated`, `announcement_deleted` - Announcements

#### System Events
- `dashboard_viewed`, `analytics_viewed` - Navigation tracking
- `message_sent`, `message_received` - Communication
- `attendance_marked` - Attendance tracking

### Log Structure
Each log entry contains:
```javascript
{
  timestamp: Firestore timestamp,
  type: "activity_type_string",
  userId: "user_document_id",
  userName: "Display Name",
  userEmail: "user@example.com",
  userAgent: "Browser/device info",
  url: "/current-page-path",
  details: { /* Action-specific metadata */ }
}
```

### Where Logging Happens
Logging occurs in the **Service Layer** (`/services/business/`):

#### Services with Activity Logging:
- **`userService.js`** - User CRUD operations, role changes
- **`activityService.js`** - Activity/quiz/assignment management
- **`enrollmentService.js`** - Class enrollment changes
- **`announcementService.js`** - Announcement creation/updates
- **`resourceService.js`** - Resource uploads and modifications

#### Usage Pattern:
```javascript
import { logActivity, ACTIVITY_LOG_TYPES } from '@services/other/activityLogger';

// In service functions
await logActivity(ACTIVITY_LOG_TYPES.USER_UPDATED, {
  updateFields: ['email', 'displayName'],
  userId: targetUserId
});
```

### Where Logging Does NOT Happen
- **UI Components** - No direct logging from React components
- **Utility Functions** - Pure functions without side effects
- **Database Layer** - `/services/db/` files handle data operations only
- **Constants/Types** - Configuration files don't perform actions

### Viewing Logs
Access via: **System → Logs Activity Page** in admin dashboard
- **Filters**: By activity type, user, date range, search terms
- **Export**: Download logs as CSV
- **Management**: Bulk delete by type or all logs

---

## Notification System

### Features
- **Mobile-optimized**: Audio, vibration, and browser notifications
- **Background support**: Works when app is minimized or phone is asleep
- **Cross-platform**: Android and iOS compatibility
- **User control**: Granular permission and preference management

### Core Components
- **`utils/notifications.js`** - Main notification engine
- **`hooks/useNotifications.js`** - React integration
- **`public/sw.js`** - Service worker for background support
- **`utils/serviceWorker.js`** - Service worker management

### Notification Types
- **Sound**: Default, message, success, warning, error tones
- **Vibration**: Single, double, triple patterns
- **Browser**: System notifications with click handling

### Usage
```javascript
import useNotifications from '../hooks/useNotifications';

const { triggerNotification } = useNotifications();
await triggerNotification('message', 'New Message', 'You have a new message');
```

---

## Content Filtering

### Bad Word Filter
- **Location**: `utils/badWordFilter.js`
- **Languages**: English and Arabic support
- **Integration**: ChatPage message sending/editing
- **Approach**: Non-destructive filtering with asterisks

### Features
- **Real-time**: Filters messages as they're sent
- **Bilingual**: 27 English + 60+ Arabic bad words
- **Context-aware**: Word boundary matching
- **User feedback**: Warning when content is filtered

---

## Development Guidelines

### Service Layer Pattern
- **Logic Separation**: Business logic in `/services/business/`
- **Database Operations**: Data access in `/services/db/`
- **No UI Logic**: Components remain pure and testable
- **Activity Logging**: Log actions in service layer, not UI

### Constants Management
- **Centralized**: All constants in `/constants/` directory
- **Shared**: Frontend/backend constants in `functions/constants/`
- **Typed**: TypeScript interfaces for all data structures
- **Bilingual**: English/Arabic labels for UI components

### File Organization
```
client/src/
├── components/          # Reusable UI components
├── pages/              # Page-level components
├── services/
│   ├── business/       # Business logic + logging
│   ├── db/            # Database operations
│   └── other/         # Utilities (logging, notifications)
├── constants/          # Type definitions and constants
├── hooks/             # Custom React hooks
└── utils/             # Utility functions
```

---

## Security & Performance

### Security Features
- **Firebase Rules**: Comprehensive database security rules
- **Input Validation**: Client and server-side validation
- **Permission Checks**: Role-based access control
- **Audit Trail**: Complete activity logging

### Performance Optimizations
- **Memoization**: React.memo, useMemo, useCallback
- **Lazy Loading**: Code splitting by routes
- **Virtualization**: Large lists use react-window
- **Caching**: Service layer data caching

---

## Getting Started

### Prerequisites
- Node.js 16+
- Firebase account
- Google Chrome (for development)

### Setup
1. Clone repository
2. Install dependencies: `npm install`
3. Configure Firebase: `cp .env.example .env`
4. Start development: `npm run dev`

### Environment Variables
See `.env.example` for required Firebase configuration and service settings.

---

## Contributing

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Enforced code quality
- **Prettier**: Consistent formatting
- **Testing**: Jest for unit tests

### Activity Logging Guidelines
- **Log in Services**: Always log in business service layer
- **Use Constants**: Use `ACTIVITY_LOG_TYPES` for all log types
- **Include Context**: Add relevant metadata to `details` object
- **User Context**: Always include acting user information

### Pull Request Process
1. Feature branch from main
2. Include tests for new functionality
3. Update documentation
4. Ensure activity logging is implemented
5. Request code review

---

## License

This project is proprietary to QAF (Qatar Academy Foundation) and is not open source.

---

## Support

For technical support or questions:
- Internal documentation: `docs/` directory
- Issue tracking: GitHub Issues (internal)
- Development team: Contact via internal channels
