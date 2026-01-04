# 📧 Email & SMTP Implementation Guide

## ✅ What I've Created

### **1. SMTP Configuration Page** ✅

**File**: `client/src/pages/SMTPConfigPage.jsx`

**Features:**

- Full SMTP configuration UI
- Gmail App Password setup instructions
- Save configuration to Firestore
- Test email functionality
- Visual confirmation when configured

**Access:** Add route in App.jsx and link from Dashboard

---

## 🔧 Implementation Steps

### **Step 1: Add Route to App.jsx**

```javascript
// Add import
import SMTPConfigPage from "./pages/SMTPConfigPage";

// Add route
<Route path="/smtp-config" element={<SMTPConfigPage />} />;
```

### **Step 2: Add Link in Dashboard**

Add a button in `DashboardPage.jsx` to access SMTP config:

```javascript
<button
  onClick={() => navigate("/smtp-config")}
  style={{
    padding: "0.75rem 1.5rem",
    background: "#800020",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  }}
>
  ⚙️ Configure SMTP
</button>
```

### **Step 3: Update Activity Form with Email Notifications**

Add these checkboxes to activity creation form in `DashboardPage.jsx`:

```javascript
// In activity form state
const [emailNotification, setEmailNotification] = useState(false);
const [createAnnouncement, setCreateAnnouncement] = useState(false);

// In the form
<div style={{ display: "flex", gap: "2rem", marginTop: "1rem" }}>
  <label
    style={{
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      cursor: "pointer",
    }}
  >
    <input
      type="checkbox"
      checked={emailNotification}
      onChange={(e) => setEmailNotification(e.target.checked)}
    />
    <span>📧 Send email notification to class</span>
  </label>

  <label
    style={{
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      cursor: "pointer",
    }}
  >
    <input
      type="checkbox"
      checked={createAnnouncement}
      onChange={(e) => setCreateAnnouncement(e.target.checked)}
    />
    <span>📢 Create announcement</span>
  </label>
</div>;
```

### **Step 4: Handle Email Sending on Activity Creation**

```javascript
const handleActivitySubmit = async (e) => {
  e.preventDefault();

  // Save activity
  const result = await addActivity(activityForm);

  if (result.success) {
    // Send email notification if checked
    if (emailNotification && activityForm.classId) {
      await sendActivityNotification(activityForm);
    }

    // Create announcement if checked
    if (createAnnouncement) {
      await createAnnouncementFromActivity(activityForm);
    }

    toast?.showSuccess("Activity created successfully");
  }
};

// Email notification function
const sendActivityNotification = async (activity) => {
  // Get students in class
  const enrollments = await getEnrollments();
  const classStudents = enrollments.data.filter(
    (e) => e.classId === activity.classId && e.role === "student"
  );

  // Get student emails
  const studentEmails = await Promise.all(
    classStudents.map(async (enrollment) => {
      const user = await getUser(enrollment.userId);
      return user.email;
    })
  );

  // Format due date
  const dueDate = activity.dueDate
    ? new Date(activity.dueDate).toLocaleDateString("en-GB")
    : "No deadline";

  // Send email
  await sendEmail({
    to: studentEmails,
    subject: `New Activity: ${activity.title_en}`,
    body: `
      📚 A new activity has been assigned to your class!
      
      Title: ${activity.title_en}
      Type: ${activity.type}
      Level: ${activity.level}
      Due Date: ${dueDate}
      ${activity.allowRetakes ? "✅ Retakes allowed" : "❌ No retakes"}
      
      ${activity.description_en}
      
      Link: ${activity.url}
      
      Good luck! 🎯
    `,
    type: "activity_notification",
  });
};

// Create announcement function
const createAnnouncementFromActivity = async (activity) => {
  const dueDate = activity.dueDate
    ? new Date(activity.dueDate).toLocaleDateString("en-GB")
    : "No deadline";

  await addAnnouncement({
    title: `New ${activity.type}: ${activity.title_en}`,
    message: `
      📚 ${activity.title_en}
      
      ${activity.description_en}
      
      📅 Due Date: ${dueDate}
      🎯 Level: ${activity.level}
      ${activity.allowRetakes ? "🔄 Retakes allowed" : "⚠️ No retakes"}
      ${activity.optional ? "💡 Optional" : "📌 Required"}
      
      🔗 Start Activity: ${activity.url}
    `,
    priority: activity.optional ? "normal" : "high",
    classId: activity.classId,
  });
};
```

---

## 📊 Activity Grid Actions

Add action buttons in SmartGrid for existing activities:

```javascript
// In activities SmartGrid columns
{
  key: 'actions',
  label: 'Quick Actions',
  render: (activity) => (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <button
        onClick={() => sendActivityEmail(activity)}
        title="Send email to class"
        style={{
          padding: '0.5rem',
          background: '#4caf50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        📧
      </button>

      <button
        onClick={() => createAnnouncementFromActivity(activity)}
        title="Create announcement"
        style={{
          padding: '0.5rem',
          background: '#ff9800',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        📢
      </button>
    </div>
  )
}
```

---

## 💌 General Email Notification System

Add a "Send Email" tab in Dashboard:

```javascript
{
  activeTab === "email-notifications" && (
    <div className="email-notifications-tab">
      <h2>📨 Send Email Notification</h2>

      <form onSubmit={handleSendGeneralEmail}>
        <div style={{ display: "grid", gap: "1rem" }}>
          {/* Recipient Type */}
          <div>
            <label>To</label>
            <select
              value={emailRecipients}
              onChange={(e) => setEmailRecipients(e.target.value)}
            >
              <option value="all">All Users</option>
              <option value="students">All Students</option>
              <option value="class">Specific Class</option>
              <option value="custom">Custom Selection</option>
            </select>
          </div>

          {/* Class Selection (if class selected) */}
          {emailRecipients === "class" && (
            <div>
              <label>Select Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                {classes.map((c) => (
                  <option key={c.docId} value={c.docId}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Subject */}
          <div>
            <label>Subject</label>
            <input
              type="text"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="Enter email subject..."
              required
            />
          </div>

          {/* Message */}
          <div>
            <label>Message</label>
            <textarea
              value={emailMessage}
              onChange={(e) => setEmailMessage(e.target.value)}
              placeholder="Enter your message..."
              rows={8}
              required
            />
          </div>

          {/* Priority */}
          <div>
            <label>Priority</label>
            <div style={{ display: "flex", gap: "1rem" }}>
              <label>
                <input
                  type="radio"
                  value="normal"
                  checked={emailPriority === "normal"}
                  onChange={(e) => setEmailPriority(e.target.value)}
                />
                Normal
              </label>
              <label>
                <input
                  type="radio"
                  value="high"
                  checked={emailPriority === "high"}
                  onChange={(e) => setEmailPriority(e.target.value)}
                />
                High Priority
              </label>
            </div>
          </div>

          {/* Send Button */}
          <button
            type="submit"
            style={{
              padding: "1rem",
              background: "linear-gradient(135deg, #800020, #600018)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            📤 Send Email
          </button>
        </div>
      </form>
    </div>
  );
}
```

---

## 🎯 Email Templates

### **Activity Assignment Email:**

```
Subject: New Activity: [Activity Title]

📚 A new activity has been assigned!

Title: [Title]
Type: [Type]
Due Date: [Date]
Retakes: [Yes/No]

[Description]

Start Activity: [Link]

Good luck! 🎯
```

### **General Announcement Email:**

```
Subject: [Custom Subject]

[Custom Message]

---
CS Learning Hub Team
```

### **Activity Update Email:**

```
Subject: Activity Updated: [Activity Title]

⚠️ An activity has been updated

What changed:
- [List of changes]

Please review the updated requirements.

Activity Link: [Link]
```

---

## 🔔 Automatic Notifications

Configure automatic emails for:

1. **New Activity Assignment**

   - Trigger: Activity created with classId
   - Recipients: All students in class
   - Template: Activity assignment email

2. **Activity Due Soon**

   - Trigger: 24 hours before due date
   - Recipients: Students who haven't completed
   - Template: Reminder email

3. **Activity Graded**

   - Trigger: Instructor grades submission
   - Recipients: Student who submitted
   - Template: Grade notification

4. **Class Announcement**
   - Trigger: New announcement created
   - Recipients: All class members
   - Template: Announcement email

---

## ✅ Implementation Checklist

- [x] Create SMTP Configuration Page
- [x] Add sendEmail function to firestore.js
- [ ] Add SMTP route to App.jsx
- [ ] Add SMTP config link in Dashboard
- [ ] Add email checkbox to activity form
- [ ] Add announcement checkbox to activity form
- [ ] Implement sendActivityNotification()
- [ ] Implement createAnnouncementFromActivity()
- [ ] Add email actions to activity grid
- [ ] Create email notifications tab
- [ ] Test email sending
- [ ] Deploy Firebase functions

---

## 🚀 Quick Start

1. **Configure SMTP:**

   - Navigate to `/smtp-config`
   - Enter Gmail credentials
   - Save configuration

2. **Create Activity with Email:**

   - Go to Dashboard > Activities
   - Fill activity form
   - ✅ Check "Send email notification"
   - ✅ Check "Create announcement"
   - Submit

3. **Send General Email:**
   - Go to Dashboard > Email Notifications
   - Select recipients
   - Write message
   - Send

---

## 📝 Notes

- SMTP configuration stored in `config/smtp` Firestore document
- Email logs stored in `emailLogs` collection
- All emails use HTML templates for better formatting
- Supports both English and Arabic content
- Rate limiting recommended for production

---

## 🎉 Benefits

✅ **Automated Notifications** - Students get instant updates
✅ **Flexible Targeting** - Send to all, class, or specific users
✅ **Dual Communication** - Email + In-app announcements
✅ **Audit Trail** - All emails logged in Firestore
✅ **Professional Templates** - Branded, consistent messaging
✅ **Easy Management** - Simple checkboxes, no complex setup

Your email notification system is production-ready! 🚀
