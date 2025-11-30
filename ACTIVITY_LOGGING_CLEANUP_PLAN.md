# 🔍 Activity Logging & Badge Removal - Comprehensive Plan

**Priority:** HIGH  
**Estimated Time:** 2 hours  
**Status:** Ready to implement

---

## 📋 **Current Issues (From Screenshots)**

### **❌ Problems Identified:**

1. **User column shows "–" instead of display name**
   - Login events don't show user
   - All entries show email in "Email" column
   - Should show "Shareef Hiasat" not "shareefhiasat@gmail.com"

2. **Badge Earned in activity types**
   - User wants to remove badge/medal/award concept
   - Focus on learning activities instead

3. **Activity types not properly tracked**
   - Some activities show, some don't
   - Need comprehensive logging for all user actions

4. **Inconsistent activity types**
   - Some activities duplicated
   - Some activities don't make sense
   - Need to clean up and standardize

---

## 🎯 **Action Plan**

### **Phase 1: Remove Badge/Award/Medal System** (30 min)

#### **Files to Modify:**
1. `client/src/pages/DashboardPage.jsx` - Remove achievements section
2. `client/src/pages/StudentDashboardPage.jsx` - Remove achievements card (already done in new version)
3. `client/src/firebase/badges.js` - Deprecate (keep for backward compatibility)
4. `client/src/firebase/firestore.js` - Remove badge-related functions
5. Activity log filters - Remove "Badge Earned" type

#### **Steps:**
```javascript
// 1. Remove from activity types enum
const ACTIVITY_TYPES = {
  // Remove these:
  // BADGE_EARNED: 'badge_earned',
  // ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
  
  // Keep these:
  LOGIN: 'login',
  LOGOUT: 'logout',
  QUIZ_STARTED: 'quiz_started',
  QUIZ_SUBMITTED: 'quiz_submitted',
  // ... etc
};

// 2. Update activity filters
const activityFilters = [
  'Login',
  'Logout',
  'Quiz Started',
  'Quiz Submitted',
  'Assignment Submitted',
  'Submission Graded',
  'Resource Viewed',
  'Resource Completed',
  'Attendance Marked',
  'Message Sent',
  'Message Received',
  'Announcement Read',
  'Announcement Created',
  'Profile Update',
  'Password Change',
  'Email Change'
  // Removed: 'Badge Earned'
];
```

---

### **Phase 2: Fix User Display Names** (30 min)

#### **Problem:**
```
Current: User column shows "–"
Current: Email column shows "shareef.hiasat@gmail.com"
```

#### **Solution:**
```
Desired: User column shows "Shareef Hiasat"
Desired: Email column shows "shareef.hiasat@gmail.com"
```

#### **Implementation:**

##### **Step 2.1: Update Activity Log Schema**
```javascript
// When logging activity, include user display name
const logActivity = async (activityData) => {
  const userProfile = JSON.parse(sessionStorage.getItem('userProfile'));
  
  await addDoc(collection(db, 'activityLogs'), {
    type: activityData.type,
    userId: user.uid,
    userName: userProfile?.displayName || userProfile?.name || user.displayName,
    userEmail: user.email,
    timestamp: serverTimestamp(),
    details: activityData.details || {},
    userAgent: navigator.userAgent
  });
};
```

##### **Step 2.2: Update Activity Log Display**
```javascript
// In DashboardPage.jsx - Activity Log tab
<DataGrid
  columns={[
    { field: 'type', header: 'Type' },
    { field: 'when', header: 'When' },
    { 
      field: 'userName', 
      header: 'User',
      render: (row) => row.userName || row.userEmail?.split('@')[0] || '–'
    },
    { field: 'userEmail', header: 'Email' },
    { field: 'userAgent', header: 'User Agent' }
  ]}
  data={activityLogs}
/>
```

---

### **Phase 3: Comprehensive Activity Types** (30 min)

#### **Current Activity Types (From Screenshots):**
```
✅ Keep & Track:
- Login
- Logout
- Session Timeout
- Profile Update
- Password Change
- Email Change
- Quiz Started
- Quiz Submitted
- Assignment Submitted
- Submission Graded
- Resource Completed
- Resource Viewed
- Resource Bookmarked
- Attendance Marked
- Message Sent
- Message Received
- Announcement Read
- Announcement Created
- Activity Viewed

❌ Remove (Not Supported):
- Badge Earned
- Signup (only for new registrations, rare)
```

#### **New Activity Types to Add:**
```javascript
const NEW_ACTIVITY_TYPES = {
  // Quiz Activities
  QUIZ_RETAKE: 'quiz_retake',
  QUIZ_ABANDONED: 'quiz_abandoned',
  QUIZ_SAVED: 'quiz_saved', // Save progress
  
  // Assignment Activities
  ASSIGNMENT_STARTED: 'assignment_started',
  ASSIGNMENT_VIEWED: 'assignment_viewed',
  
  // Class Activities
  CLASS_JOINED: 'class_joined',
  CLASS_LEFT: 'class_left',
  
  // Dashboard Activities
  DASHBOARD_VIEWED: 'dashboard_viewed',
  ANALYTICS_VIEWED: 'analytics_viewed',
  
  // Tool Usage
  CALCULATOR_OPENED: 'calculator_opened',
  SCRATCH_PAD_OPENED: 'scratch_pad_opened',
  FORMULA_SHEET_OPENED: 'formula_sheet_opened',
  
  // Notifications
  NOTIFICATION_CLICKED: 'notification_clicked',
  NOTIFICATION_DISMISSED: 'notification_dismissed',
  
  // Admin Activities
  USER_CREATED: 'user_created',
  USER_DELETED: 'user_deleted',
  USER_UPDATED: 'user_updated',
  QUIZ_CREATED: 'quiz_created',
  QUIZ_DELETED: 'quiz_deleted',
  QUIZ_PUBLISHED: 'quiz_published'
};
```

---

### **Phase 4: Implement Activity Logging Functions** (30 min)

#### **Create Centralized Activity Logger**

**File:** `client/src/firebase/activityLogger.js`

```javascript
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';

/**
 * Log user activity
 * @param {string} type - Activity type
 * @param {object} details - Additional details
 * @param {string} userId - User ID (optional, defaults to current user)
 */
export async function logActivity(type, details = {}, userId = null) {
  try {
    // Get user profile from session storage
    const userProfile = JSON.parse(sessionStorage.getItem('userProfile') || '{}');
    const currentUser = userId || userProfile.uid;
    
    if (!currentUser) {
      console.warn('[Activity Logger] No user ID available');
      return { success: false, error: 'No user ID' };
    }
    
    const activityData = {
      type,
      userId: currentUser,
      userName: userProfile.displayName || userProfile.name || userProfile.email?.split('@')[0],
      userEmail: userProfile.email,
      timestamp: serverTimestamp(),
      details,
      userAgent: navigator.userAgent,
      url: window.location.pathname
    };
    
    await addDoc(collection(db, 'activityLogs'), activityData);
    return { success: true };
  } catch (error) {
    console.error('[Activity Logger] Error logging activity:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Activity type constants
 */
export const ACTIVITY_TYPES = {
  // Authentication
  LOGIN: 'login',
  LOGOUT: 'logout',
  SESSION_TIMEOUT: 'session_timeout',
  PROFILE_UPDATE: 'profile_update',
  PASSWORD_CHANGE: 'password_change',
  EMAIL_CHANGE: 'email_change',
  
  // Quiz Activities
  QUIZ_STARTED: 'quiz_started',
  QUIZ_SUBMITTED: 'quiz_submitted',
  QUIZ_RETAKE: 'quiz_retake',
  QUIZ_ABANDONED: 'quiz_abandoned',
  QUIZ_SAVED: 'quiz_saved',
  QUIZ_VIEWED: 'quiz_viewed',
  
  // Assignment Activities
  ASSIGNMENT_STARTED: 'assignment_started',
  ASSIGNMENT_SUBMITTED: 'assignment_submitted',
  ASSIGNMENT_VIEWED: 'assignment_viewed',
  
  // Grading
  SUBMISSION_GRADED: 'submission_graded',
  FEEDBACK_GIVEN: 'feedback_given',
  
  // Resources
  RESOURCE_VIEWED: 'resource_viewed',
  RESOURCE_COMPLETED: 'resource_completed',
  RESOURCE_BOOKMARKED: 'resource_bookmarked',
  RESOURCE_DOWNLOADED: 'resource_downloaded',
  
  // Attendance
  ATTENDANCE_MARKED: 'attendance_marked',
  
  // Communication
  MESSAGE_SENT: 'message_sent',
  MESSAGE_RECEIVED: 'message_received',
  ANNOUNCEMENT_READ: 'announcement_read',
  ANNOUNCEMENT_CREATED: 'announcement_created',
  
  // Navigation
  DASHBOARD_VIEWED: 'dashboard_viewed',
  ANALYTICS_VIEWED: 'analytics_viewed',
  ACTIVITY_VIEWED: 'activity_viewed',
  
  // Tools
  CALCULATOR_OPENED: 'calculator_opened',
  SCRATCH_PAD_OPENED: 'scratch_pad_opened',
  FORMULA_SHEET_OPENED: 'formula_sheet_opened',
  
  // Notifications
  NOTIFICATION_CLICKED: 'notification_clicked',
  NOTIFICATION_DISMISSED: 'notification_dismissed',
  
  // Class Activities
  CLASS_JOINED: 'class_joined',
  CLASS_LEFT: 'class_left',
  
  // Admin Activities
  USER_CREATED: 'user_created',
  USER_DELETED: 'user_deleted',
  USER_UPDATED: 'user_updated',
  QUIZ_CREATED: 'quiz_created',
  QUIZ_DELETED: 'quiz_deleted',
  QUIZ_PUBLISHED: 'quiz_published'
};

/**
 * Convenience functions for common activities
 */
export const ActivityLogger = {
  login: () => logActivity(ACTIVITY_TYPES.LOGIN),
  logout: () => logActivity(ACTIVITY_TYPES.LOGOUT),
  
  quizStarted: (quizId, quizTitle) => logActivity(ACTIVITY_TYPES.QUIZ_STARTED, { quizId, quizTitle }),
  quizSubmitted: (quizId, quizTitle, score) => logActivity(ACTIVITY_TYPES.QUIZ_SUBMITTED, { quizId, quizTitle, score }),
  quizSaved: (quizId, quizTitle) => logActivity(ACTIVITY_TYPES.QUIZ_SAVED, { quizId, quizTitle }),
  
  resourceViewed: (resourceId, resourceTitle) => logActivity(ACTIVITY_TYPES.RESOURCE_VIEWED, { resourceId, resourceTitle }),
  resourceCompleted: (resourceId, resourceTitle) => logActivity(ACTIVITY_TYPES.RESOURCE_COMPLETED, { resourceId, resourceTitle }),
  
  dashboardViewed: () => logActivity(ACTIVITY_TYPES.DASHBOARD_VIEWED),
  
  calculatorOpened: () => logActivity(ACTIVITY_TYPES.CALCULATOR_OPENED),
  scratchPadOpened: () => logActivity(ACTIVITY_TYPES.SCRATCH_PAD_OPENED),
  formulaSheetOpened: () => logActivity(ACTIVITY_TYPES.FORMULA_SHEET_OPENED),
  
  notificationClicked: (notificationId, type) => logActivity(ACTIVITY_TYPES.NOTIFICATION_CLICKED, { notificationId, type })
};
```

---

### **Phase 5: Update Components to Use Activity Logger** (30 min)

#### **Example Integrations:**

##### **1. StudentQuizPage.jsx**
```javascript
import { ActivityLogger } from '../firebase/activityLogger';

// When quiz starts
const startQuiz = () => {
  setStarted(true);
  ActivityLogger.quizStarted(quizId, quiz.title);
};

// When quiz submitted
const handleSubmit = async () => {
  const score = calculateScore();
  await submitQuiz(quizId, answers);
  ActivityLogger.quizSubmitted(quizId, quiz.title, score);
};

// When progress saved
const saveProgress = () => {
  saveQuizProgress(quizId, answers);
  ActivityLogger.quizSaved(quizId, quiz.title);
};
```

##### **2. Calculator.jsx**
```javascript
import { ActivityLogger } from '../firebase/activityLogger';

const Calculator = ({ onClose }) => {
  useEffect(() => {
    ActivityLogger.calculatorOpened();
  }, []);
  
  // ... rest of component
};
```

##### **3. StudentDashboardPage.jsx**
```javascript
import { ActivityLogger } from '../firebase/activityLogger';

const StudentDashboardPage = () => {
  useEffect(() => {
    ActivityLogger.dashboardViewed();
  }, []);
  
  // ... rest of component
};
```

##### **4. AuthContext.jsx**
```javascript
import { ActivityLogger } from '../firebase/activityLogger';

// On login
const onLogin = async () => {
  // ... authentication logic
  await ActivityLogger.login();
};

// On logout
const onLogout = async () => {
  await ActivityLogger.logout();
  // ... logout logic
};
```

---

## 📊 **Updated Activity Types List**

### **✅ Supported & Tracked:**

| Category | Activity Type | Description |
|----------|---------------|-------------|
| **Auth** | Login | User logged in |
| | Logout | User logged out |
| | Session Timeout | Session expired |
| | Profile Update | Updated profile info |
| | Password Change | Changed password |
| | Email Change | Changed email |
| **Quiz** | Quiz Started | Started taking quiz |
| | Quiz Submitted | Submitted quiz |
| | Quiz Retake | Retook quiz |
| | Quiz Saved | Saved quiz progress |
| | Quiz Viewed | Viewed quiz preview |
| **Assignment** | Assignment Started | Started assignment |
| | Assignment Submitted | Submitted assignment |
| | Assignment Viewed | Viewed assignment |
| **Grading** | Submission Graded | Instructor graded submission |
| | Feedback Given | Instructor gave feedback |
| **Resources** | Resource Viewed | Viewed resource |
| | Resource Completed | Completed resource |
| | Resource Bookmarked | Bookmarked resource |
| | Resource Downloaded | Downloaded resource |
| **Attendance** | Attendance Marked | Attendance recorded |
| **Messages** | Message Sent | Sent message in chat |
| | Message Received | Received message |
| **Announcements** | Announcement Read | Read announcement |
| | Announcement Created | Created announcement |
| **Navigation** | Dashboard Viewed | Viewed dashboard |
| | Analytics Viewed | Viewed analytics |
| | Activity Viewed | Viewed activity |
| **Tools** | Calculator Opened | Opened calculator |
| | Scratch Pad Opened | Opened scratch pad |
| | Formula Sheet Opened | Opened formula sheet |
| **Notifications** | Notification Clicked | Clicked notification |
| | Notification Dismissed | Dismissed notification |
| **Class** | Class Joined | Joined class |
| | Class Left | Left class |
| **Admin** | User Created | Admin created user |
| | User Deleted | Admin deleted user |
| | Quiz Created | Instructor created quiz |
| | Quiz Deleted | Instructor deleted quiz |
| | Quiz Published | Instructor published quiz |

### **❌ Removed (Not Supported):**
- Badge Earned
- Achievement Unlocked
- Medal Awarded
- Rank Up
- Signup (only used for initial registration)

---

## 🗂️ **Firestore Schema Update**

### **activityLogs Collection:**
```javascript
{
  type: 'quiz_started',
  userId: 'user123',
  userName: 'Shareef Hiasat',  // ← NEW: Display name
  userEmail: 'shareef.hiasat@gmail.com',
  timestamp: Timestamp,
  details: {
    quizId: 'quiz456',
    quizTitle: 'Advanced JavaScript',
    // ... activity-specific data
  },
  userAgent: 'Mozilla/5.0...',
  url: '/quiz/quiz456'  // ← NEW: Current page URL
}
```

---

## ✅ **Testing Checklist**

- [ ] User column shows display name (not email)
- [ ] Email column shows email
- [ ] Login activities tracked
- [ ] Quiz started/submitted tracked
- [ ] Resource viewed tracked
- [ ] Calculator usage tracked
- [ ] Scratch pad usage tracked
- [ ] Dashboard views tracked
- [ ] Badge Earned removed from filters
- [ ] Activity log filters updated
- [ ] All new activity types working
- [ ] sessionStorage userProfile available
- [ ] Backward compatibility (old logs still display)

---

## 📝 **Implementation Order**

### **Step 1: Remove Badges** (10 min)
1. Remove badge filters from activity log
2. Update activity type enums
3. Comment out badge-related code (don't delete for backward compat)

### **Step 2: Create Activity Logger** (15 min)
1. Create `client/src/firebase/activityLogger.js`
2. Add all activity type constants
3. Implement `logActivity()` function
4. Add convenience functions

### **Step 3: Fix User Display** (15 min)
1. Update activity log schema to include `userName`
2. Update DashboardPage activity log display
3. Use userProfile from sessionStorage

### **Step 4: Integrate Logger** (30 min)
1. Add to StudentQuizPage (quiz activities)
2. Add to Calculator, ScratchPad, FormulaSheet (tool usage)
3. Add to StudentDashboardPage (dashboard views)
4. Add to AuthContext (login/logout)
5. Add to ResourcesPage (resource activities)

### **Step 5: Test** (20 min)
1. Test each activity type
2. Verify display names show correctly
3. Check filters work
4. Verify backward compatibility

---

## 🚀 **Expected Results**

### **Before:**
```
Type: login
When: 29/11/2025, 16:56
User: –
Email: shareef.hiasat@gmail.com
```

### **After:**
```
Type: login
When: 29/11/2025, 16:56
User: Shareef Hiasat
Email: shareef.hiasat@gmail.com
```

### **New Activities Tracked:**
- Dashboard views
- Quiz progress saves
- Tool usage (calculator, scratch pad)
- Resource bookmarks
- Notification interactions
- Class joins/leaves

---

## 📊 **Analytics Benefits**

With comprehensive activity logging, you can:
1. **Track engagement** - See which students are active
2. **Identify struggling students** - No quiz submissions, no resource views
3. **Tool usage analytics** - How often calculator/scratch pad used
4. **Popular resources** - Most viewed/completed resources
5. **Quiz analytics** - Start vs. completion rates
6. **Session analytics** - Average session duration
7. **Feature usage** - Which features are most used

---

**Total Time:** 2 hours  
**Priority:** HIGH (After StudentQuizPage redesign)  
**Status:** Ready to implement

**Implementation Order:**
1. StudentQuizPage Redesign (3 hours) ← CURRENT
2. Activity Logging Cleanup (2 hours) ← NEXT
3. Notification System (9 hours) ← AFTER

**Total Remaining Work:** 14 hours
