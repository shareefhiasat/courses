# 🔔 Unified Notification Architecture

## Overview

This document describes the production-ready notification system for the QAF Learning Hub. The system follows a clean architecture with:

- **Backend Gateway**: Centralized notification dispatching with adapter pattern
- **Database**: Prisma models for notifications and user preferences
- **REST API**: Full CRUD operations for notifications and preferences
- **WebSocket**: Real-time notification delivery to clients
- **Client Hook**: React hook for consuming notifications
- **Multi-channel**: In-app, email, with extensible SMS/push

---

## 📐 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Client Layer                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ useNotificationsFeed Hook                                │  │
│  │ - Fetches notifications via API                          │  │
│  │ - WebSocket real-time updates                            │  │
│  │ - Mark as read, archive, delete                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Layer                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ REST Endpoints (/api/v1/notifications)                   │  │
│  │ - GET /notifications - List notifications                 │  │
│  │ - PATCH /notifications/:id/mark-read                     │  │
│  │ - PATCH /notifications/:id/archive                       │  │
│  │ - DELETE /notifications/:id                               │  │
│  │ - GET /preferences - User notification preferences        │  │
│  │ - PATCH /preferences - Update preferences                │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ WebSocket Server (/ws/notifications)                      │  │
│  │ - Real-time notification delivery                        │  │
│  │ - JWT authentication                                      │  │
│  │ - Room-based broadcasting                                │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Service Layer                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Notification Gateway (index.js)                           │  │
│  │ - emit(event, payload, recipient, actor)                 │  │
│  │ - Routes to appropriate adapters                         │  │
│  │ - Manages delivery tracking                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Adapters                                                 │  │
│  │ - in-app: Stores in database, returns notificationId     │  │
│  │ - email: Sends via nodemailer, tracks delivery           │  │
│  │ - sms: (future) Twilio integration                       │  │
│  │ - push: (future) Firebase Cloud Messaging                │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Data Layer                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Prisma Models                                             │  │
│  │ - Notification: id, userId, event, category, priority...  │  │
│  │ - NotificationPreference: userId, channel, category...    │  │
│  │ - NotificationDelivery: notificationId, channel, status... │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Configuration

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/qaf_courses

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=shareef.hiasat@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_SENDER_NAME=QAF Learning Hub
SMTP_SENDER_EMAIL=shareef.hiasat@gmail.com

# WebSocket
WS_PORT=3001
WS_PATH=/ws/notifications

# JWT Secret (for WebSocket authentication)
JWT_SECRET=your_jwt_secret_here

# Frontend
VITE_API_BASE_URL=http://localhost:3000
VITE_WS_BASE_URL=ws://localhost:3001
```

---

## 📂 File Structure

### Backend

```
backend/
├── services/
│   └── notifications/
│       ├── index.js              # Main gateway (emit function)
│       ├── constants.js          # EVENTS, CATEGORIES, PRIORITIES
│       ├── adapters/
│       │   ├── index.js          # Adapter registry
│       │   ├── in-app.js         # Database adapter
│       │   └── email.js          # Email adapter with nodemailer
│       └── templates/
│           ├── index.js          # Template registry
│           ├── workflow.html     # Workflow email templates
│           ├── announcement.html # Announcement email templates
│           └── shared.html       # Shared email layout
├── controllers/
│   └── notifications.js          # REST controller
├── routes/
│   └── notifications.js          # Route definitions
├── services/
│   └── websocketServer.js        # WebSocket server
└── prisma/
    └── schema.prisma            # Notification models
```

### Client

```
client/
├── src/
│   ├── services/
│   │   └── business/
│   │       └── notificationService.js    # API wrapper
│   ├── hooks/
│   │   └── useNotificationsFeed.js       # React hook
│   ├── services/
│   │   └── realtime/
│   │       └── notificationSocket.js     # WebSocket client
│   └── components/
│       └── ui/
│           ├── NotificationBell/         # Bell icon with badge
│           ├── NotificationDrawer.jsx    # Drawer component
│           └── NotificationPreferencesSection/ # Settings UI
```

---

## 🎯 Usage Examples

### Backend: Sending Notifications

```javascript
import notificationGateway from './services/notifications/index.js';
import { EVENTS } from './services/notifications/constants.js';

// Simple workflow notification
await notificationGateway.emit(EVENTS.WORKFLOW_ASSIGNED, {
  instanceId: workflow.id,
  workflowName: definition.name,
  stageName: firstStage.name,
  userName: user.name,
}, { userId: user.id, email: user.email, name: user.name }, actor);

// Announcement notification
await notificationGateway.emit(EVENTS.ANNOUNCEMENT_POSTED, {
  announcementId: announcement.id,
  titleEn: announcement.titleEn,
  titleAr: announcement.titleAr,
  descriptionEn: announcement.descriptionEn,
  descriptionAr: announcement.descriptionAr,
  targetAudience: announcement.targetAudience,
}, { userId: recipient.id, email: recipient.email, name: recipient.name }, actor);
```

### Client: Consuming Notifications

```javascript
import useNotificationsFeed from '@hooks/useNotificationsFeed';

function MyComponent() {
  const {
    notifications,
    unreadCount,
    loading,
    refresh,
    markAsRead,
    markAllAsRead,
    archive,
    archiveAllRead,
    remove
  } = useNotificationsFeed({ limit: 100, archived: false });

  return (
    <div>
      <NotificationBell unreadCount={unreadCount} />
      <NotificationDrawer
        notifications={notifications}
        onMarkAsRead={markAsRead}
        onArchive={archive}
        onRemove={remove}
      />
    </div>
  );
}
```

---

## 📊 Notification Events

All events are defined in `backend/services/notifications/constants.js`:

### Workflow Events
- `WORKFLOW_ASSIGNED` - New workflow stage assigned to user
- `WORKFLOW_APPROVED` - Workflow stage approved
- `WORKFLOW_REJECTED` - Workflow stage rejected
- `WORKFLOW_COMPLETED` - Workflow fully completed
- `WORKFLOW_SLA_WARNING` - SLA deadline approaching
- `WORKFLOW_SLA_OVERDUE` - SLA deadline passed

### Announcement Events
- `ANNOUNCEMENT_POSTED` - New announcement created

### Behavior Events
- `BEHAVIOR_RECORDED` - Behavior record created
- `BEHAVIOR_UPDATED` - Behavior record updated
- `BEHAVIOR_DELETED` - Behavior record deleted

### QR Code Events
- `QR_CODE_SENT` - QR code sent to student

---

## 🔐 User Preferences

Users can control notification delivery per channel and category:

```javascript
// Get user preferences
GET /api/v1/notifications/preferences

// Update preferences
PATCH /api/v1/notifications/preferences
{
  "email": {
    "workflow": true,
    "announcement": true,
    "behavior": false
  },
  "in_app": {
    "workflow": true,
    "announcement": true,
    "behavior": true
  }
}
```

---

## 📧 Email Templates

Email templates are stored in `backend/services/notifications/templates/`:

- **shared.html**: Base layout with header/footer
- **workflow.html**: Workflow-specific templates
- **announcement.html**: Announcement templates

Templates use EJS-like syntax for variable substitution:

```html
<h2>{{title}}</h2>
<p>{{message}}</p>
<p>{{userName}}</p>
```

---

## 🚀 Integration Points

### Backend Services (Updated)

- ✅ `backend/services/workflowEngine.js` - Uses `notificationGateway.emit()`
- ✅ `backend/scripts/slaMonitor.js` - Uses `notificationGateway.emit()`
- ✅ `backend/services/announcements.js` - Uses `notificationGateway.emit()`
- ✅ `backend/services/behaviors.js` - Uses `notificationGateway.emit()`

### Client Components (Updated)

- ✅ `NotificationBell.jsx` - Uses `useNotificationsFeed`
- ✅ `NotificationDrawer.jsx` - Uses `useNotificationsFeed`
- ✅ `ProfileSettingsPage.jsx` - Has notification preferences section

---

## 🎨 Benefits

### Clean Architecture
- ✅ Separation of concerns (UI, Logic, Service, Data)
- ✅ Single source of truth for notification events
- ✅ Extensible adapter pattern for new channels
- ✅ Type-safe with TypeScript/JSDoc

### Performance
- ✅ WebSocket real-time updates
- ✅ Memoized React hooks
- ✅ Efficient database queries with Prisma
- ✅ Virtualization for large lists (when needed)

### User Experience
- ✅ User preferences per channel/category
- ✅ Real-time delivery
- ✅ Unread count tracking
- ✅ Archive and delete functionality
- ✅ Multilingual support

---

## 📝 Next Steps

1. **SMS Adapter**: Integrate Twilio for SMS notifications
2. **Push Adapter**: Integrate Firebase Cloud Messaging
3. **Template Editor**: Admin UI for editing email templates
4. **Analytics**: Track notification delivery rates and engagement
5. **Rate Limiting**: Implement per-user rate limits

---

## 🏆 Migration Summary

**Before**: 
- Duplicated notification logic in client and backend
- No centralized event system
- No user preferences
- No real-time updates

**After**:
- Unified gateway with adapter pattern
- Centralized event constants
- User preferences per channel/category
- WebSocket real-time delivery
- Clean separation of concerns
- Production-ready error handling and logging
