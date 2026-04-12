# UsersPage Migration to Keycloak - Implementation Guide

## Summary of Changes

The UsersPage is being migrated from a Firestore/allowlist-based system to pure Keycloak user management.

## Key Changes

### 1. Remove Allowlist Integration
- **Remove:** `getAllowlist()` calls
- **Remove:** Allowlist state (`allowlist`, `setAllowlist`)
- **Remove:** Merging invited users with actual users
- **Remove:** "Remove from allowlist" action
- **Remove:** `isInvited` flag and related UI

### 2. Update User Data Source
- **Before:** `getUsers()` + allowlist merge
- **After:** `getUsers()` from Keycloak API only
- Users come directly from Keycloak with:
  - `id` (Keycloak user ID)
  - `email`
  - `firstName`, `lastName`
  - `username`
  - `enabled` (boolean)
  - `createdTimestamp`

### 3. Add User Form Changes
- **Add fields:**
  - `email` (required)
  - `firstName` (required)
  - `lastName` (required)
  - `role` (dropdown: super_admin, admin, hr, instructor, student)
  - `temporaryPassword` (optional - auto-generated if empty)
- **Remove fields:**
  - `displayName` (derived from firstName + lastName)
  - `realName` (not needed)
  - `studentNumber` (handled separately for students)
  - `order` (not needed)

### 4. Create User Flow
1. Super admin fills form
2. System calls `createUser()` API
3. Backend creates user in Keycloak
4. Backend assigns role
5. Temporary password shown **once** to admin
6. Admin must communicate password to user

### 5. Set Password Feature (NEW)
- **Replace:** "Reset Password" (email-based)
- **With:** "Set Password" (direct)
- Super admin enters new password
- Option to make it temporary
- No email sent

### 6. Remove Email Features
- **Remove:** "Send Welcome Email" button
- **Remove:** All email invitation logic
- **Remove:** Email notification references

### 7. Enable/Disable Users
- **Keep:** Toggle user enabled/disabled status
- **Update:** Call Keycloak API to update `enabled` field
- Disabled users cannot log in

### 8. Delete Users
- **Keep:** Delete functionality
- **Update:** Delete from both Keycloak and local DB
- Soft delete for non-students (disable instead)
- Hard delete for students

## Implementation Steps

### Step 1: Update State Variables
```javascript
// REMOVE
const [allowlist, setAllowlist] = useState({});

// KEEP (but data source changes)
const [users, setUsers] = useState([]);
```

### Step 2: Update loadData Function
```javascript
// BEFORE
const [usersResult, allowlistResult] = await Promise.all([
  getUsers(),
  getAllowlist()
]);
// Merge logic...

// AFTER
const usersResult = await getUsers();
if (usersResult.success) {
  setUsers(usersResult.data || []);
}
```

### Step 3: Update Form State
```javascript
// BEFORE
const [formData, setFormData] = useState({
  email: '',
  displayName: '',
  realName: '',
  studentNumber: '',
  order: '',
  role: ROLE_STRINGS.STUDENT
});

// AFTER
const [formData, setFormData] = useState({
  email: '',
  firstName: '',
  lastName: '',
  role: ROLE_STRINGS.STUDENT,
  temporaryPassword: '' // Optional
});
```

### Step 4: Update handleSaveUser
```javascript
// AFTER
const handleSaveUser = async () => {
  try {
    const userData = {
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      role: formData.role,
      temporaryPassword: formData.temporaryPassword || undefined
    };
    
    const result = await createUser(userData);
    
    if (result.success) {
      // Show temporary password to admin
      setTempPasswordModal({
        isOpen: true,
        email: result.data.email,
        password: result.data.temporaryPassword
      });
      
      toast.showSuccess('User created successfully');
      loadData();
      closeModal();
    }
  } catch (error) {
    toast.showError(error.message);
  }
};
```

### Step 5: Add Set Password Modal
```javascript
const [setPasswordModal, setSetPasswordModal] = useState({
  isOpen: false,
  userId: null,
  email: ''
});

const handleSetPassword = async (userId, email) => {
  setSetPasswordModal({
    isOpen: true,
    userId,
    email
  });
};

const handleConfirmSetPassword = async (newPassword, temporary) => {
  const result = await setUserPassword(
    setPasswordModal.userId,
    newPassword,
    temporary
  );
  
  if (result.success) {
    toast.showSuccess('Password updated successfully');
    setSetPasswordModal({ isOpen: false, userId: null, email: '' });
  }
};
```

### Step 6: Update Grid Columns
```javascript
// REMOVE columns
{ field: 'isInvited', headerName: 'Status' }
{ field: 'studentNumber', headerName: 'Student Number' }
{ field: 'order', headerName: 'Order' }

// ADD/UPDATE columns
{
  field: 'firstName',
  headerName: 'First Name',
  flex: 1
},
{
  field: 'lastName',
  headerName: 'Last Name',
  flex: 1
},
{
  field: 'enabled',
  headerName: 'Status',
  renderCell: (params) => (
    <Badge color={params.value ? 'success' : 'danger'}>
      {params.value ? 'Enabled' : 'Disabled'}
    </Badge>
  )
}
```

### Step 7: Update Action Buttons
```javascript
// REMOVE
<Button onClick={() => handleSendWelcomeEmail(user)}>
  Send Welcome Email
</Button>

// REPLACE
<Button onClick={() => handleResetPassword(user.email)}>
  Reset Password
</Button>

// WITH
<Button onClick={() => handleSetPassword(user.id, user.email)}>
  Set Password
</Button>
```

### Step 8: Remove Invited User Logic
```javascript
// REMOVE all references to:
- user.isInvited
- handleRemoveFromAllowlist
- Invited user filtering
- Allowlist merge logic
```

## Testing Checklist

- [ ] Create user with all 5 roles
- [ ] Temporary password displayed once
- [ ] Set password works for existing users
- [ ] Enable/disable toggles user status
- [ ] Delete removes user from Keycloak
- [ ] Grid displays Keycloak user data correctly
- [ ] No allowlist references remain
- [ ] No email sending functionality remains
- [ ] Super admin can access all features
- [ ] Non-super-admin users have appropriate restrictions

## Translation Keys to Add

```javascript
users_create_user: 'Create User'
users_first_name: 'First Name'
users_last_name: 'Last Name'
users_temporary_password: 'Temporary Password'
users_auto_generate: 'Auto-generate'
users_set_password: 'Set Password'
users_new_password: 'New Password'
users_temporary_password_notice: 'User must change password on first login'
users_password_shown_once: 'This password will only be shown once. Please save it.'
users_keycloak_managed: 'Managed by Keycloak'
```

## Files Modified

1. `client/src/pages/users/UsersPage.jsx` - Major revision
2. `client/src/services/business/userService.js` - Already updated
3. `client/src/services/business/authService.js` - Remove resetPassword email logic
4. Translation files - Add new keys
