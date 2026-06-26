# Chat Module

## Business Context
Chat enables real-time communication between staff and students. Supports class chat rooms, direct messages, and a global staff room. Features include text messages, file attachments (25MB limit), polls, reactions, and message editing/deletion.

## API Routes
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/api/v1/chat/rooms` | Get user's chat rooms | all authenticated |
| GET | `/api/v1/chat/rooms/:roomId/messages` | Get messages | all authenticated (room member) |
| POST | `/api/v1/chat/rooms/:roomId/messages` | Send message | all authenticated (room member) |
| PUT | `/api/v1/chat/messages/:messageId` | Edit message | message owner |
| DELETE | `/api/v1/chat/messages/:messageId` | Delete message | message owner |
| POST | `/api/v1/chat/dm` | Create/get DM room | all authenticated |
| POST | `/api/v1/chat/messages/:messageId/reactions` | Toggle reaction | all authenticated |
| POST | `/api/v1/chat/messages/:messageId/vote` | Vote on poll | all authenticated |
| GET | `/api/v1/chat/users` | Available chat users | all authenticated |

## UI Pages
- `/chat` — ChatPage with room sidebar and message area

## Business Rules
- **Global room**: All staff + students (students read-only)
- **Class rooms**: Staff see all; students see only enrolled classes
- **DM rooms**: Private between two users
- **File limit**: 25MB per attachment
- **Real-time**: WebSocket updates for new/deleted/edited messages
- **Admin scope**: Should filter class rooms by program scope (BUG: SHA-17)

## Test Coverage
- **API tests**: `specs/chat-api.spec.js` — 15 tests
- **Test IDs**: TC-CHAT-001 through TC-CHAT-030
- **RBAC tests**: Student sees only enrolled class rooms, staff sees all

## Known Issues
| ID | Issue | Priority |
|----|-------|----------|
| SHA-17 | Admin scope not applied to chat rooms | Medium |
| SHA-10 | Missing Arabic translations | Medium |
| SHA-11 | Notification bell only for super_admin | Medium |
| SHA-13 | Favorite/star feature is a stub | Low |

## Related Modules
- `module:notifications` — Chat triggers notifications
- `module:drive` — File attachments stored in Smart Drive
- `module:i18n` — Arabic localization
- `module:rbac` — Role-based room access
