# 🔮 NEXT FEATURES IMPLEMENTATION GUIDE

## 1. 🗑️ USER DELETION FROM FIREBASE

### Current State
- Users can be removed from the `users` collection in Firestore
- However, Firebase Authentication accounts remain active
- This creates orphaned auth accounts

### Implementation Plan

#### Option A: Admin-Only Deletion (Recommended)
**Location:** `client/src/pages/DashboardPage.jsx` - Users tab

**Steps:**
1. Add "Delete from Firebase" button in user actions
2. Create Cloud Function `deleteUserAccount`:
```javascript
// functions/index.js
exports.deleteUserAccount = onCall(async (request) => {
  const { auth, data } = request;
  
  // Check admin
  if (!auth || !auth.token.admin) {
    throw new Error('Admin access required');
  }
  
  const { uid } = data;
  
  try {
    // Delete from Firebase Auth
    await getAuth().deleteUser(uid);
    
    // Delete from Firestore
    await db.collection('users').doc(uid).delete();
    
    // Clean up related data
    const enrollments = await db.collection('enrollments').where('userId', '==', uid).get();
    const batch = db.batch();
    enrollments.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    
    return { success: true };
  } catch (error) {
    throw new Error('Failed to delete user: ' + error.message);
  }
});
```

3. Add confirmation modal with warning about data deletion
4. Show list of related data that will be deleted (enrollments, submissions, etc.)

#### Option B: Self-Service Account Deletion
**Location:** Profile modal or Settings page

**Steps:**
1. Add "Delete My Account" button in profile
2. Require password re-authentication
3. Show warning about permanent deletion
4. Call Cloud Function to delete account

### Safety Considerations
⚠️ **Important:**
- Always show confirmation modal
- List all data that will be deleted
- Require admin authentication for admin-initiated deletions
- Log all deletion actions
- Consider "soft delete" (mark as deleted) instead of hard delete
- Backup user data before deletion

---

## 2. 💬 HELP & SUPPORT SYSTEM

### Option A: Sentry User Feedback (Recommended for MVP)

#### Why Sentry?
- ✅ Free tier available
- ✅ Integrates with error tracking
- ✅ Captures user context automatically
- ✅ Supports localization
- ✅ Simple widget integration

#### Implementation Steps

**1. Install Sentry:**
```bash
npm install @sentry/react
```

**2. Initialize in `client/src/main.jsx` or `App.jsx`:**
```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Feedback({
      // Automatically inject feedback button
      autoInject: true,
      
      // Customize button text
      buttonLabel: "Feedback",
      submitButtonLabel: "Send Feedback",
      cancelButtonLabel: "Cancel",
      
      // Localization
      formTitle: "Report an Issue",
      nameLabel: "Name",
      namePlaceholder: "Your Name",
      emailLabel: "Email",
      emailPlaceholder: "your.email@example.com",
      messageLabel: "Description",
      messagePlaceholder: "What's the issue?",
      
      // Styling
      themeLight: {
        submitBackground: "#800020",
        submitBackgroundHover: "#600018",
      },
      themeDark: {
        submitBackground: "#800020",
        submitBackgroundHover: "#600018",
      }
    })
  ],
  
  // Set user context
  beforeSend(event, hint) {
    // Add user info if logged in
    if (user) {
      event.user = {
        email: user.email,
        id: user.uid,
        username: user.displayName
      };
    }
    return event;
  }
});
```

**3. Add Help Button in Navbar:**
```jsx
<button 
  onClick={() => Sentry.showReportDialog()}
  style={{
    background: 'linear-gradient(135deg, #800020, #600018)',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer'
  }}
>
  {t('help_support')} 💬
</button>
```

**4. Add translations:**
```javascript
// LangContext.jsx
en: {
  help_support: 'Help & Support',
  report_issue: 'Report an Issue',
  feedback: 'Feedback',
}
ar: {
  help_support: 'المساعدة والدعم',
  report_issue: 'الإبلاغ عن مشكلة',
  feedback: 'ملاحظات',
}
```

**5. Localize Sentry Widget:**
```javascript
// Dynamically update Sentry language based on user's language
useEffect(() => {
  if (lang === 'ar') {
    Sentry.getFeedback()?.updateOptions({
      formTitle: "الإبلاغ عن مشكلة",
      nameLabel: "الاسم",
      namePlaceholder: "اسمك",
      emailLabel: "البريد الإلكتروني",
      emailPlaceholder: "your.email@example.com",
      messageLabel: "الوصف",
      messagePlaceholder: "ما هي المشكلة؟",
      submitButtonLabel: "إرسال",
      cancelButtonLabel: "إلغاء",
    });
  }
}, [lang]);
```

---

### Option B: Tawk.to Live Chat

#### Why Tawk.to?
- ✅ Completely free
- ✅ Live chat with agents
- ✅ Mobile apps for agents
- ✅ Visitor tracking
- ✅ Canned responses
- ⚠️ Requires manual agent availability

#### Implementation Steps

**1. Sign up at tawk.to and get widget code**

**2. Add to `public/index.html`:**
```html
<!--Start of Tawk.to Script-->
<script type="text/javascript">
var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
(function(){
var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
s1.async=true;
s1.src='https://embed.tawk.to/YOUR_PROPERTY_ID/YOUR_WIDGET_ID';
s1.charset='UTF-8';
s1.setAttribute('crossorigin','*');
s0.parentNode.insertBefore(s1,s0);
})();
</script>
<!--End of Tawk.to Script-->
```

**3. Customize widget:**
```javascript
// Set user info when logged in
useEffect(() => {
  if (window.Tawk_API && user) {
    window.Tawk_API.setAttributes({
      'name': user.displayName || user.email,
      'email': user.email,
      'hash': user.uid
    });
  }
}, [user]);
```

**4. Localization:**
```javascript
// Change language based on user preference
useEffect(() => {
  if (window.Tawk_API) {
    window.Tawk_API.setLanguage(lang === 'ar' ? 'ar' : 'en');
  }
}, [lang]);
```

---

### Option C: Custom Support Ticket System

#### Implementation
**1. Create Firestore collection `supportTickets`:**
```javascript
{
  userId: string,
  userEmail: string,
  subject: string,
  message: string,
  status: 'open' | 'in_progress' | 'resolved' | 'closed',
  priority: 'low' | 'medium' | 'high',
  category: 'technical' | 'account' | 'content' | 'other',
  createdAt: Timestamp,
  updatedAt: Timestamp,
  responses: [{
    from: 'user' | 'admin',
    message: string,
    timestamp: Timestamp
  }]
}
```

**2. Create Support Modal Component:**
```jsx
// client/src/components/SupportModal.jsx
const SupportModal = ({ open, onClose }) => {
  const [ticket, setTicket] = useState({
    subject: '',
    message: '',
    category: 'technical',
    priority: 'medium'
  });
  
  const handleSubmit = async () => {
    await addDoc(collection(db, 'supportTickets'), {
      ...ticket,
      userId: user.uid,
      userEmail: user.email,
      status: 'open',
      createdAt: serverTimestamp(),
      responses: []
    });
    
    toast.showSuccess('Support ticket submitted!');
    onClose();
  };
  
  return (
    <Modal open={open} onClose={onClose} title="Submit Support Ticket">
      {/* Form fields */}
    </Modal>
  );
};
```

**3. Add Admin Support Dashboard:**
- View all tickets
- Filter by status/priority
- Respond to tickets
- Mark as resolved

---

## 📊 RECOMMENDATION

### For QAF Learning Hub:

**Phase 1 (Immediate):**
1. ✅ **Sentry User Feedback** - Quick to implement, captures errors + feedback
   - Cost: Free tier (5,000 events/month)
   - Setup time: 30 minutes
   - Maintenance: Low

**Phase 2 (After user feedback):**
2. **Tawk.to Live Chat** - If you need real-time support
   - Cost: Free
   - Setup time: 15 minutes
   - Maintenance: Requires agent availability

**Phase 3 (Future):**
3. **Custom Ticket System** - If you need full control and integration
   - Cost: Development time
   - Setup time: 4-6 hours
   - Maintenance: High

---

## 🎯 QUICK START: Sentry Implementation

**1. Get Sentry DSN:**
```bash
# Sign up at sentry.io
# Create new project → React
# Copy DSN
```

**2. Install:**
```bash
cd client
npm install @sentry/react
```

**3. Add to App.jsx:**
```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://YOUR_KEY@o YOUR_ORG.ingest.sentry.io/YOUR_PROJECT",
  integrations: [
    new Sentry.Feedback({
      autoInject: true,
      themeLight: { submitBackground: "#800020" }
    })
  ]
});
```

**4. Test:**
- Click feedback button (bottom-right corner)
- Submit test feedback
- Check Sentry dashboard

**Done! 🎉**

---

## 🔐 USER DELETION: Quick Implementation

**1. Add Cloud Function:**
```javascript
// functions/index.js
exports.deleteUserAccount = onCall(async (request) => {
  const { auth, data } = request;
  if (!auth?.token?.admin) throw new Error('Admin only');
  
  const { uid } = data;
  await getAuth().deleteUser(uid);
  await db.collection('users').doc(uid).delete();
  
  return { success: true };
});
```

**2. Add Button in Dashboard:**
```jsx
// DashboardPage.jsx - Users grid actions
<button
  onClick={async () => {
    if (confirm('Delete user and all related data?')) {
      const { httpsCallable } = await import('firebase/functions');
      const { functions } = await import('../firebase/config');
      const deleteUser = httpsCallable(functions, 'deleteUserAccount');
      await deleteUser({ uid: user.docId });
      toast.showSuccess('User deleted');
      loadData();
    }
  }}
  style={{ background: '#dc3545', color: 'white' }}
>
  🗑️ Delete
</button>
```

**3. Deploy:**
```bash
firebase deploy --only functions:deleteUserAccount
```

---

**Choose your path and implement! Both features are straightforward and can be done in under an hour each.** 🚀
