# Group Chat Frontend UI - Implementation Guide

**Date:** January 2025  
**Status:** Components Created - Integration Pending

---

## Components Created

### 1. GroupChatModal ✅

**File:** `client/src/pages/communications/chat/components/GroupChatModal.jsx`

**Purpose:** Create new group chats (staff only)

**Features:**
- Group name input (required, max 100 chars)
- User search and selection
- Multi-select with chips
- Real-time search filtering
- Staff-only validation
- Loading states
- Error handling

**Props:**
```javascript
{
  isOpen: boolean,           // Modal visibility
  onClose: () => void,       // Close handler
  onGroupCreated: (room) => void  // Success callback with created room
}
```

**Usage:**
```jsx
<GroupChatModal
  isOpen={showGroupModal}
  onClose={() => setShowGroupModal(false)}
  onGroupCreated={(room) => {
    // Handle new group created
    console.log('Group created:', room);
  }}
/>
```

---

### 2. ParticipantManagementModal ✅

**File:** `client/src/pages/communications/chat/components/ParticipantManagementModal.jsx`

**Purpose:** Manage group chat participants (creator only)

**Features:**
- View current participants with creator badge
- Add new participants (creator only)
- Remove participants (creator only, cannot remove creator)
- User search
- Real-time updates
- Loading states per action
- Permission checks

**Props:**
```javascript
{
  isOpen: boolean,                    // Modal visibility
  onClose: () => void,                // Close handler
  room: object,                       // Current room object
  currentUserId: number,              // Current user's ID
  onParticipantsChanged: () => void   // Callback when participants change
}
```

**Usage:**
```jsx
<ParticipantManagementModal
  isOpen={showParticipantModal}
  onClose={() => setShowParticipantModal(false)}
  room={selectedRoom}
  currentUserId={user.id}
  onParticipantsChanged={() => {
    // Refresh room data
    loadRooms();
  }}
/>
```

---

## Integration Steps

### Step 1: Update ChatPage.jsx

Add state and handlers for group chat modals:

```jsx
import GroupChatModal from './components/GroupChatModal';
import ParticipantManagementModal from './components/ParticipantManagementModal';

// Inside ChatPage component:
const [showGroupModal, setShowGroupModal] = useState(false);
const [showParticipantModal, setShowParticipantModal] = useState(false);

// Check if user is staff
const isStaff = user?.roles?.some(role => 
  ['instructor', 'hr', 'admin', 'super_admin'].includes(role.code)
);

// Handler for group created
const handleGroupCreated = (newRoom) => {
  // Add to rooms list
  setRooms(prev => [newRoom, ...prev]);
  // Select the new room
  setSelectedRoom(newRoom);
};

// Handler for participants changed
const handleParticipantsChanged = () => {
  // Refresh rooms to get updated participant count
  loadRooms();
  // Refresh selected room if it's the group being edited
  if (selectedRoom?.type === 'group') {
    loadRoomDetails(selectedRoom.id);
  }
};
```

### Step 2: Add "Create Group" Button

In the chat sidebar (ChatSidebar.jsx or ChatPage.jsx):

```jsx
{isStaff && (
  <button
    className={styles.createGroupButton}
    onClick={() => setShowGroupModal(true)}
  >
    <UsersIcon size={18} />
    {t('chat_create_group')}
  </button>
)}
```

### Step 3: Add "Manage Participants" Button

In the chat header when a group is selected:

```jsx
{selectedRoom?.type === 'group' && selectedRoom.createdBy === user.id && (
  <button
    className={styles.manageButton}
    onClick={() => setShowParticipantModal(true)}
    title={t('chat_manage_participants')}
  >
    <SettingsIcon size={20} />
  </button>
)}
```

### Step 4: Display Group Info

Update the chat header to show group information:

```jsx
{selectedRoom?.type === 'group' && (
  <div className={styles.groupInfo}>
    <div className={styles.groupName}>{selectedRoom.name}</div>
    <div className={styles.groupMeta}>
      {selectedRoom.participants?.length || 0} {t('chat_participants')}
    </div>
  </div>
)}
```

### Step 5: Update Room List Display

In ChatSidebar.jsx, update room rendering to handle groups:

```jsx
const getRoomDisplay = (room) => {
  if (room.type === 'group') {
    return {
      name: room.name,
      subtitle: `${room.participants?.length || 0} ${t('chat_participants')}`,
      icon: <UsersIcon size={20} />
    };
  }
  // ... existing logic for class, dm, global
};
```

### Step 6: Add Modals to JSX

At the end of ChatPage.jsx return statement:

```jsx
return (
  <div className={styles.chatPage}>
    {/* Existing chat UI */}
    
    {/* Group Chat Modals */}
    <GroupChatModal
      isOpen={showGroupModal}
      onClose={() => setShowGroupModal(false)}
      onGroupCreated={handleGroupCreated}
    />
    
    <ParticipantManagementModal
      isOpen={showParticipantModal}
      onClose={() => setShowParticipantModal(false)}
      room={selectedRoom}
      currentUserId={user?.id}
      onParticipantsChanged={handleParticipantsChanged}
    />
  </div>
);
```

---

## Required Localization Keys

Add these keys to your localization files:

```javascript
// English
chat_create_group: "Create Group",
chat_create_group_button: "Create Group",
chat_group_name: "Group Name",
chat_group_name_required: "Group name is required",
chat_group_name_placeholder: "Enter group name...",
chat_group_participants_required: "At least one participant is required",
chat_selected_participants: "Selected Participants",
chat_add_participants: "Add Participants",
chat_search_users: "Search users...",
chat_no_users_found: "No users found",
chat_group_created: "Group created successfully",
chat_group_staff_only: "Only staff can create group chats",
chat_error_creating_group: "Failed to create group",
chat_error_loading_users: "Failed to load users",
chat_manage_participants: "Manage Participants",
chat_current_participants: "Current Participants",
chat_participant_added: "Participant added",
chat_participant_removed: "Participant removed",
chat_error_adding_participant: "Failed to add participant",
chat_error_removing_participant: "Failed to remove participant",
chat_cannot_remove_creator: "Cannot remove group creator",
chat_all_users_added: "All users have been added",
chat_creator: "Creator",
chat_participants: "participants",
creating: "Creating...",
adding: "Adding...",
removing: "Removing...",

// Arabic
chat_create_group: "إنشاء مجموعة",
chat_create_group_button: "إنشاء المجموعة",
chat_group_name: "اسم المجموعة",
chat_group_name_required: "اسم المجموعة مطلوب",
chat_group_name_placeholder: "أدخل اسم المجموعة...",
chat_group_participants_required: "مطلوب مشارك واحد على الأقل",
chat_selected_participants: "المشاركون المحددون",
chat_add_participants: "إضافة مشاركين",
chat_search_users: "البحث عن مستخدمين...",
chat_no_users_found: "لم يتم العثور على مستخدمين",
chat_group_created: "تم إنشاء المجموعة بنجاح",
chat_group_staff_only: "يمكن للموظفين فقط إنشاء مجموعات الدردشة",
chat_error_creating_group: "فشل إنشاء المجموعة",
chat_error_loading_users: "فشل تحميل المستخدمين",
chat_manage_participants: "إدارة المشاركين",
chat_current_participants: "المشاركون الحاليون",
chat_participant_added: "تمت إضافة المشارك",
chat_participant_removed: "تمت إزالة المشارك",
chat_error_adding_participant: "فشلت إضافة المشارك",
chat_error_removing_participant: "فشلت إزالة المشارك",
chat_cannot_remove_creator: "لا يمكن إزالة منشئ المجموعة",
chat_all_users_added: "تمت إضافة جميع المستخدمين",
chat_creator: "المنشئ",
chat_participants: "مشاركين",
creating: "جاري الإنشاء...",
adding: "جاري الإضافة...",
removing: "جاري الإزالة...",
```

---

## Styling Notes

Both components use CSS modules with these features:
- Dark/light theme support via CSS variables
- RTL support
- Smooth transitions and hover effects
- Responsive design
- Custom scrollbars
- Loading states
- Disabled states

**CSS Variables Used:**
- `--bg-primary` - Main background
- `--bg-secondary` - Secondary background
- `--bg-hover` - Hover background
- `--text-primary` - Primary text
- `--text-secondary` - Secondary text
- `--border-color` - Border color
- `--primary-color` - Primary brand color
- `--primary-color-alpha` - Primary with transparency
- `--primary-color-dark` - Darker primary
- `--error-color` - Error/danger color
- `--error-color-alpha` - Error with transparency
- `--success-color` - Success color
- `--success-color-alpha` - Success with transparency
- `--warning-color` - Warning color
- `--warning-color-alpha` - Warning with transparency

---

## User Flow

### Creating a Group:
1. Staff user clicks "Create Group" button
2. Modal opens with group name input and user list
3. User enters group name
4. User searches and selects participants
5. User clicks "Create Group"
6. API creates group with participants
7. New group appears in room list
8. Group is automatically selected

### Managing Participants:
1. Group creator clicks "Manage Participants" button
2. Modal opens showing current participants
3. Creator can:
   - View all participants with creator badge
   - Search and add new participants
   - Remove participants (except creator)
4. Changes reflect immediately in UI
5. Room list updates participant count

---

## API Endpoints Used

**GroupChatModal:**
- `GET /api/v1/chat/users` - Load available users
- `POST /api/v1/chat/rooms/group` - Create group

**ParticipantManagementModal:**
- `GET /api/v1/chat/users` - Load available users
- `POST /api/v1/chat/rooms/:roomId/participants` - Add participant
- `DELETE /api/v1/chat/rooms/:roomId/participants/:userId` - Remove participant

---

## Testing Checklist

### GroupChatModal:
- [ ] Modal opens/closes correctly
- [ ] Group name validation works
- [ ] Participant selection/deselection works
- [ ] Search filters users correctly
- [ ] Create button disabled when invalid
- [ ] Success toast shows on creation
- [ ] Error toast shows on failure (403 for non-staff)
- [ ] Modal resets on close
- [ ] Loading states display correctly
- [ ] RTL layout works

### ParticipantManagementModal:
- [ ] Modal opens/closes correctly
- [ ] Current participants display with creator badge
- [ ] Creator can add participants
- [ ] Creator can remove participants (except self)
- [ ] Non-creator sees read-only view
- [ ] Search filters available users
- [ ] Success/error toasts show
- [ ] Loading states per action
- [ ] Cannot remove creator (validation)
- [ ] RTL layout works

---

## Next Steps

1. **Integrate Components:**
   - Add to ChatPage.jsx
   - Wire up state and handlers
   - Add buttons to UI

2. **Add Localization:**
   - Add all required keys to EN/AR files
   - Test with both languages

3. **Test Thoroughly:**
   - Test as staff user (can create groups)
   - Test as student (cannot create groups)
   - Test as group creator (can manage)
   - Test as group participant (read-only)

4. **Optional Enhancements:**
   - Group avatar/image upload
   - Group description field
   - Leave group functionality
   - Transfer creator role
   - Group settings (mute, etc.)

---

## Files Created

1. `GroupChatModal.jsx` - Group creation modal component
2. `GroupChatModal.module.css` - Styles for group creation modal
3. `ParticipantManagementModal.jsx` - Participant management component
4. `ParticipantManagementModal.module.css` - Styles for participant modal
5. `GROUP_CHAT_FRONTEND_UI.md` - This documentation

---

## Summary

✅ **Components Ready:**
- GroupChatModal - Fully functional, ready to integrate
- ParticipantManagementModal - Fully functional, ready to integrate

**Remaining Work:**
- Integration into ChatPage.jsx
- Add localization keys
- Testing

**Estimated Integration Time:** 30-60 minutes
