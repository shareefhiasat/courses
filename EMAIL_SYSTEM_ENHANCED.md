# Email System - Enhanced Plan with Your Requirements

## ✅ Your Requirements Addressed

### 1. ✅ Bilingual Support (EN + AR)
- **All variables have `_ar` versions:** `{{title}}` and `{{title_ar}}`
- **Templates show both languages** in single email
- **Automatic language detection** for greetings
- **RTL support** for Arabic content blocks

### 2. ✅ Qatar Timezone (UTC+3)
- **All dates formatted:** DD/MM/YYYY
- **All date/times formatted:** DD/MM/YYYY HH:MM
- **Automatic timezone conversion** to Qatar time
- **Variables:**
  - `{{currentDate}}` - DD/MM/YYYY
  - `{{currentDateTime}}` - DD/MM/YYYY HH:MM
  - `{{dateTime}}` - For specific events

### 3. ✅ Personalized Greetings
- **Variable:** `{{greeting}}` - Auto-generates "Dear {{recipientName}}"
- **Bilingual:** Switches between "Dear" and "عزيزي" based on content
- **All templates start with:** "Dear {{recipientName}},"

### 4. ✅ Complete Email Audit Logs
**Every email logged with:**
- ✅ Full HTML body
- ✅ All variables and their values
- ✅ Recipient list
- ✅ Timestamp (Qatar time)
- ✅ Email type (announcement, grading, etc.)
- ✅ Who sent it (admin UID)
- ✅ Status (sent/failed)
- ✅ Error details if failed
- ✅ Related IDs (activity, user, class)

**Searchable by:**
- Date range
- Recipient email
- Email type
- Status
- Sender

**Admin can:**
- View exact email sent to any user
- Re-send failed emails
- Export logs to CSV
- Filter and search all emails

### 5. ✅ Smart HTML Editor (GrapesJS)
**Features:**
- ✅ Drag-and-drop visual editor
- ✅ Paste HTML from Unlayer/Stripo
- ✅ Variable insertion helper
- ✅ Click to insert `{{variableName}}`
- ✅ Preview with sample data
- ✅ Responsive preview (desktop/mobile)
- ✅ Test send functionality
- ✅ Template library
- ✅ Version history
- ✅ Error prevention (validates variables)

**Variable Helper Sidebar:**
```
┌─────────────────────────────────┐
│ Available Variables             │
├─────────────────────────────────┤
│ 📝 Common                       │
│  {{recipientName}} - Click to   │
│    copy                         │
│  {{currentDateTime}} - Qatar    │
│    time                         │
│                                 │
│ 🎓 Student Info                 │
│  {{studentName}}                │
│  {{studentEmail}}               │
│  {{militaryNumber}}             │
│                                 │
│ 📚 Activity                     │
│  {{activityTitle}} (EN)         │
│  {{activityTitle_ar}} (AR)      │
│  {{dueDateTime}}                │
│                                 │
│ [Copy All Variables]            │
└─────────────────────────────────┘
```

---

## Email Triggers Summary

| Trigger | When | To | Confirmation | Status |
|---------|------|-----|--------------|--------|
| **Announcement** | Created | All/Class | No | ✅ Exists |
| **New Activity** | Published | All/Class | No | 🔄 To add |
| **Activity Complete** | Student marks done | Admin | No | 🔄 To add |
| **Activity Graded** | Admin assigns grade | Student | **Yes** | 🔄 To add |
| **Enrollment** | Student enrolled | Student | No | 🔄 To add |
| **Resource Added** | Resource created | All/Class | No | 🔄 To add |
| **Chat Digest** | Every 3 hours | Users with unread | No | 🔄 To add |

---

## Grading Email Confirmation Modal

When admin assigns a grade, show modal:

```
┌──────────────────────────────────────────────┐
│ Confirm Grade & Send Email                   │
├──────────────────────────────────────────────┤
│                                              │
│ Student: Ahmed Mohammed                      │
│ Activity: Python Quiz 1                      │
│ Score: 85/100                                │
│                                              │
│ Email will be sent to:                       │
│ ahmed.mohammed@example.com                   │
│                                              │
│ Preview:                                     │
│ ┌──────────────────────────────────────────┐ │
│ │ Dear Ahmed,                              │ │
│ │                                          │ │
│ │ Your submission for Python Quiz 1        │ │
│ │ has been graded.                         │ │
│ │                                          │ │
│ │ Score: 85/100                            │ │
│ │ ...                                      │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ [Cancel]  [Save Grade Only]  [Save & Send]  │
└──────────────────────────────────────────────┘
```

---

## Email Logs Dashboard Tab

```
┌─────────────────────────────────────────────────────────────┐
│ Email Logs                                                   │
├─────────────────────────────────────────────────────────────┤
│ Filters:                                                     │
│ Type: [All ▼]  Status: [All ▼]  Date: [Last 7 days ▼]      │
│ Search: [_______________] 🔍                                 │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Date/Time        │ Type        │ To           │ Status  │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ 06/10/2025 19:30│ Grading     │ ahmed@...    │ ✅ Sent │ │
│ │ 06/10/2025 18:15│ Announcement│ 25 users     │ ✅ Sent │ │
│ │ 06/10/2025 17:00│ Chat Digest │ 12 users     │ ✅ Sent │ │
│ │ 06/10/2025 16:45│ Activity    │ 30 users     │ ❌ Failed│ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ [Export CSV] [View Details] [Resend Failed]                 │
└─────────────────────────────────────────────────────────────┘
```

**Click "View Details" shows:**
- Full HTML preview
- All variables used
- Recipient list
- Send timestamp
- Error details (if failed)
- Related activity/user/class IDs

---

## Implementation Packages

### Required NPM Packages
```json
{
  "dependencies": {
    "grapesjs": "^0.21.0",
    "grapesjs-preset-newsletter": "^1.0.3",
    "handlebars": "^4.7.8",
    "moment-timezone": "^0.5.43",
    "dompurify": "^3.0.6"
  }
}
```

### Why These Packages:
- **GrapesJS** - Visual email editor
- **grapesjs-preset-newsletter** - Email-specific components
- **Handlebars** - Template variable replacement
- **moment-timezone** - Qatar timezone conversion
- **DOMPurify** - Sanitize HTML (security)

---

## Variable Replacement System

### Backend Function (Node.js)
```javascript
const Handlebars = require('handlebars');
const moment = require('moment-timezone');

// Helper to format dates in Qatar timezone
Handlebars.registerHelper('qatarDateTime', (date) => {
  return moment(date).tz('Asia/Qatar').format('DD/MM/YYYY HH:mm');
});

Handlebars.registerHelper('qatarDate', (date) => {
  return moment(date).tz('Asia/Qatar').format('DD/MM/YYYY');
});

// Render email template
function renderEmailTemplate(templateHtml, variables) {
  // Add common variables
  const allVariables = {
    ...variables,
    siteName: 'CS Learning Hub',
    siteUrl: 'https://your-domain.com',
    currentDate: moment().tz('Asia/Qatar').format('DD/MM/YYYY'),
    currentDateTime: moment().tz('Asia/Qatar').format('DD/MM/YYYY HH:mm'),
    greeting: `Dear ${variables.recipientName || 'Student'}`,
  };
  
  // Compile and render
  const template = Handlebars.compile(templateHtml);
  return template(allVariables);
}

// Example usage
const html = renderEmailTemplate(templateHtml, {
  recipientName: 'Ahmed Mohammed',
  activityTitle: 'Python Quiz 1',
  activityTitle_ar: 'اختبار بايثون 1',
  score: 85,
  maxScore: 100,
  feedback: 'Great work!',
  feedback_ar: 'عمل رائع!',
  link: 'https://your-domain.com/activity/123'
});
```

---

## Security & Validation

### Template Validation
- ✅ Check all `{{variables}}` exist
- ✅ Warn about missing `_ar` versions
- ✅ Sanitize HTML (prevent XSS)
- ✅ Validate email addresses
- ✅ Check template size (< 100KB)

### Variable Validation
- ✅ Required variables must be present
- ✅ Type checking (string, number, date)
- ✅ URL validation for links
- ✅ Email format validation

### Error Handling
- ✅ Log all errors to Firestore
- ✅ Retry failed emails (3 attempts)
- ✅ Admin notification for failures
- ✅ Fallback to plain text if HTML fails

---

## Timeline & Effort

### Phase 1: Core Infrastructure (6-8 hours)
- Email settings UI with toggles
- Template management (CRUD)
- GrapesJS integration
- Variable helper component
- Audit log viewer

### Phase 2: Trigger Implementation (5-6 hours)
- Activity creation emails
- Grading confirmation modal
- Activity completion notification
- Enrollment welcome
- Resource notification

### Phase 3: Chat Digest (3-4 hours)
- Scheduled function (every 3 hours)
- Unread message aggregation
- Digest email generation
- Mark as digest_sent

### Phase 4: Testing & Polish (2-3 hours)
- Test all email types
- Verify bilingual content
- Check Qatar timezone
- Audit log testing
- Performance optimization

**Total: 16-21 hours**

---

## Next Steps

### Option 1: Start Now
Begin with Phase 1 (Email Settings UI + Template Management)
- Create email settings tab
- Integrate GrapesJS
- Build variable helper
- Create default templates

### Option 2: Prioritize
Implement most critical features first:
1. Grading email (with confirmation)
2. Activity completion notification
3. Enrollment welcome
4. Audit logs

### Option 3: Review & Approve
- Review this enhanced plan
- Confirm approach (GrapesJS vs alternatives)
- Approve bilingual template format
- Decide on timeline

---

## What's Already Done ✅

1. ✅ SMTP configuration working
2. ✅ Test email functionality
3. ✅ Announcement emails (needs toggle integration)
4. ✅ Basic email logging
5. ✅ `editingCourse` error fixed

---

## Your Decision

**I'm ready to start implementing whenever you are!**

Choose:
- **A:** Start Phase 1 now (6-8 hours)
- **B:** Implement priority features only (grading + completion + audit)
- **C:** Review plan and start next session

All your requirements are addressed:
✅ Bilingual (EN + AR)
✅ Qatar timezone (UTC+3)
✅ Personalized greetings
✅ Complete audit logs
✅ Smart editor (GrapesJS)
✅ Error prevention
✅ Confirmation modals

---

Generated: 2025-10-06 19:51
Status: 📋 Enhanced plan complete, ready to implement!
