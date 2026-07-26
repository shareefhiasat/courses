# Chat Feature - Quick Start Guide

## ✅ What's Been Implemented

### Backend (100% Complete)
- ✅ PostgreSQL database tables (`chat_rooms`, `chat_messages`)
- ✅ REST API endpoints at `/api/v1/chat/*`
- ✅ WebSocket real-time messaging
- ✅ Role-based permissions (students can only DM instructors)
- ✅ Notification integration (drawer + browser push)
- ✅ Chat event templates (EN/AR)

### Frontend (90% Complete)
- ✅ WebSocket client (`chatSocket.js`)
- ✅ API service (`chatService.js`) - all stubs replaced
- ⏳ UI initialization needed
- ⏳ Staff DM section needs to be added

## 🚀 How to Start Using Chat

### 1. Kill Existing Backend (if running)
```bash
pkill -f "node backend/server.js"
```

### 2. Start Backend
```bash
node backend/server.js
```

You should see:
```
🚀 Military LMS Backend API running on http://localhost:8001
[WebSocket] Server initialized on path: /ws/notifications
```

### 3. Initialize Chat in Frontend

Add this to your app initialization (e.g., `App.jsx` or `main.jsx`):

```javascript
import { initializeChatService } from '@services/business/chatService.js';
import { useAuth } from '@hooks/useAuth';

// In your main app component
useEffect(() => {
  if (user?.token) {
    initializeChatService(user.token);
  }
}, [user?.token]);
```

### 4. Test Chat Functionality

#### As a Student:
1. Navigate to `/chat`
2. You should see:
   - Global chat (read-only)
   - Your enrolled class chats
   - Option to message your instructor

#### As an Instructor/HR/Admin:
1. Navigate to `/chat`
2. You should see:
   - Global chat (read/write)
   - All assigned class chats
   - DM with other staff members
   - DM with students

### 5. Test Real-Time Messaging

Open two browser windows:
1. **Window 1**: Login as student
2. **Window 2**: Login as instructor
3. Send message from instructor → student should see it instantly
4. Check notification drawer - notification should appear

## 📋 API Endpoints

### Get Rooms
```bash
GET /api/v1/chat/rooms
Authorization: Bearer <token>
```

### Get Messages
```bash
GET /api/v1/chat/rooms/:roomId/messages?limit=50
Authorization: Bearer <token>
```

### Send Message
```bash
POST /api/v1/chat/rooms/:roomId/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "text",
  "content": "Hello!"
}
```

### Create DM
```bash
POST /api/v1/chat/dm
Authorization: Bearer <token>
Content-Type: application/json

{
  "recipientId": 2
}
```

### Toggle Reaction
```bash
POST /api/v1/chat/messages/:messageId/reactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "reactionType": "ThumbsUp",
  "remove": false
}
```

### Vote on Poll
```bash
POST /api/v1/chat/messages/:messageId/vote
Authorization: Bearer <token>
Content-Type: application/json

{
  "optionIndex": 0
}
```

### Get Available DM Users
```bash
GET /api/v1/chat/users
Authorization: Bearer <token>
```

## 🔍 Debugging

### Check WebSocket Connection
Open browser console:
```javascript
// Should see:
[chatSocket] Connecting to: ws://localhost:8001/ws/notifications?token=***
[chatSocket] Connected
```

### Check Backend Logs
```bash
tail -f /tmp/backend.log
```

Look for:
```
[WebSocket] Client connected: userId=1, totalClients=1
[chatController] Message sent successfully
[WebSocket] Emitted to user 2: chat:message
```

### Check Database
```bash
docker exec -it lms-qaf-app-db psql -U military_lms -d military_lms

# Check rooms
SELECT * FROM chat_rooms;

# Check messages
SELECT * FROM chat_messages ORDER BY created_at DESC LIMIT 10;
```

## 🐛 Common Issues

### Port 8001 Already in Use
```bash
pkill -f "node backend/server.js"
# or
lsof -ti:8001 | xargs kill -9
```

### WebSocket Not Connecting
- Check if backend is running
- Verify token is valid
- Check browser console for errors
- Ensure CORS is configured correctly

### Messages Not Appearing
- Check WebSocket connection status
- Verify user has access to the room
- Check backend logs for errors
- Ensure `initializeChatService()` was called

### Notifications Not Showing
- Check notification preferences in user settings
- Verify browser notification permissions
- Check `NotificationDrawer` is mounted
- Look for errors in console

## 📝 Next Steps (Remaining Work)

### Phase 5: UI Polish
- [ ] Add chat initialization to app startup
- [ ] Add "Staff Messages" section in sidebar
- [ ] Show online status indicators
- [ ] Add role badges in DM user list
- [ ] Fix `logger` bug in ChatPage.jsx line 72
- [ ] Add typing indicators
- [ ] Add empty states

### Phase 6: Testing
- [ ] Write backend unit tests
- [ ] Write frontend unit tests
- [ ] Write E2E tests
- [ ] Test all permission scenarios
- [ ] Load testing for WebSocket

## 🎯 Success Criteria

- [x] Backend API responds to all endpoints
- [x] WebSocket connects and delivers messages
- [x] Notifications appear in drawer
- [x] Role-based permissions enforced
- [ ] UI shows staff DM section
- [ ] All tests passing
- [ ] No console errors

## 📚 Documentation

- **Implementation Status**: `CHAT_IMPLEMENTATION_STATUS.md`
- **Original Plan**: `.windsurf/plans/chat-fix-and-enhancement-1fbcc6.md`
- **Backend Code**: `backend/controllers/chatController.js`
- **Frontend Code**: `client/src/services/business/chatService.js`
- **WebSocket Client**: `client/src/services/realtime/chatSocket.js`
- **Database Schema**: `client/prisma/schema.prisma` (lines 1809-1865)

## 🆘 Need Help?

Check these files for reference:
1. `CHAT_IMPLEMENTATION_STATUS.md` - Detailed status
2. Backend logs - `/tmp/backend.log`
3. Browser console - WebSocket connection status
4. Database - `docker exec -it lms-qaf-app-db psql -U military_lms -d military_lms`

## ✨ Key Features

- **Real-Time**: Instant message delivery via WebSocket
- **Secure**: Role-based permissions, students can only DM instructors
- **Integrated**: Works with existing notification drawer
- **Scalable**: Paginated messages, indexed queries
- **Bilingual**: English and Arabic support
- **Rich**: Text, voice, files, polls, reactions
- **Reliable**: Auto-reconnect, soft deletes, edit tracking
