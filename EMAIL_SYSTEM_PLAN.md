# Email Notification System - Implementation Plan

## Overview
Comprehensive email notification system with admin-controlled triggers, templates, and digest emails.

## Email Triggers (Admin Toggle On/Off)

### 1. Announcements
- **Trigger:** When announcement created
- **Recipients:** All users or class-specific
- **Variables:** `{{title}}`, `{{content}}`, `{{date}}`, `{{link}}`
- **Status:** ✅ Already exists (needs toggle)

### 2. New Activity
- **Trigger:** When activity created/published
- **Recipients:** All students or class-specific
- **Variables:** `{{activityTitle}}`, `{{activityType}}`, `{{dueDate}}`, `{{link}}`, `{{course}}`
- **Status:** 🔄 To implement

### 3. Activity Marked Complete (Student)
- **Trigger:** Student marks activity as complete
- **Recipients:** Admin/Instructor
- **Variables:** `{{studentName}}`, `{{studentEmail}}`, `{{militaryNumber}}`, `{{activityTitle}}`, `{{link}}`
- **Status:** 🔄 To implement

### 4. Activity Graded (Admin)
- **Trigger:** Admin assigns grade to submission
- **Recipients:** Student
- **Variables:** `{{studentName}}`, `{{activityTitle}}`, `{{score}}`, `{{maxScore}}`, `{{feedback}}`, `{{link}}`
- **Confirmation:** Modal before sending
- **Status:** 🔄 To implement

### 5. Enrollment Welcome
- **Trigger:** Student enrolled in class
- **Recipients:** Student
- **Variables:** `{{studentName}}`, `{{className}}`, `{{classCode}}`, `{{term}}`, `{{instructorName}}`
- **Status:** 🔄 To implement

### 6. New Resource Added
- **Trigger:** Resource created
- **Recipients:** All students or class-specific
- **Variables:** `{{resourceTitle}}`, `{{resourceType}}`, `{{description}}`, `{{link}}`
- **Status:** 🔄 To implement

### 7. Chat Digest (Special)
- **Trigger:** Every 3 hours (scheduled)
- **Recipients:** Users with unread messages
- **Content:** Summary of unread messages with sender names, times, preview
- **Variables:** `{{unreadCount}}`, `{{messages}}` (array), `{{chatLink}}`
- **Status:** 🔄 To implement

## Email Audit Logs

### Collection: `emailLogs` (Enhanced)
```javascript
{
  id: 'auto-generated',
  timestamp: Timestamp,
  type: 'announcement' | 'activity' | 'grading' | 'enrollment' | 'resource' | 'chat_digest' | 'custom',
  subject: 'Email subject line',
  to: ['email1@example.com', 'email2@example.com'], // Array of recipients
  from: 'sender@example.com',
  senderName: 'CS Learning Hub',
  templateId: 'announcement_default',
  variables: {
    // All variables used in this email
    studentName: 'John Doe',
    activityTitle: 'Python Quiz 1',
    // ... etc
  },
  htmlBody: '<html>...</html>', // Full rendered HTML
  textBody: 'Plain text version', // Optional
  status: 'sent' | 'failed' | 'pending',
  error: null | 'Error message if failed',
  sentBy: 'admin-uid', // Who triggered the email
  metadata: {
    activityId: 'activity-123',
    userId: 'user-456',
    classId: 'class-789',
    // ... any relevant IDs for tracking
  }
}
```

**Features:**
- ✅ Complete audit trail of every email sent
- ✅ Full HTML body stored for reference
- ✅ All variables and their values logged
- ✅ Searchable by type, recipient, date, status
- ✅ Admin can view exact email sent to any user
- ✅ Failed emails logged with error details

## Firestore Structure

### Collection: `config/emailSettings`
```javascript
{
  announcements: { enabled: true, template: 'default' },
  activities: { enabled: true, template: 'default' },
  activityComplete: { enabled: true, template: 'default' },
  activityGraded: { enabled: true, requireConfirmation: true, template: 'default' },
  enrollments: { enabled: true, template: 'default' },
  resources: { enabled: true, template: 'default' },
  chatDigest: { enabled: true, intervalHours: 3, template: 'default' }
}
```

### Collection: `emailTemplates`
```javascript
{
  id: 'announcement_default',
  name: 'Announcement Email',
  subject: '📢 New Announcement: {{title}}',
  html: '<html>...</html>',
  variables: ['title', 'content', 'date', 'link'],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Template Variables Guide

### Common Variables (All Emails)
- `{{siteUrl}}` - Base URL of the site
- `{{siteName}}` - CS Learning Hub
- `{{currentDate}}` - Current date in DD/MM/YYYY format (Qatar timezone UTC+3)
- `{{currentDateTime}}` - Full date/time in DD/MM/YYYY HH:MM format (Qatar timezone UTC+3)
- `{{recipientName}}` - Recipient's display name
- `{{recipientEmail}}` - Recipient's email
- `{{greeting}}` - "Dear {{recipientName}}" or "عزيزي {{recipientName}}" based on language

### Bilingual Support
**All content variables have both English and Arabic versions:**
- `{{title}}` and `{{title_ar}}` - For announcements, activities, etc.
- `{{description}}` and `{{description_ar}}` - For descriptions
- `{{content}}` and `{{content_ar}}` - For content fields

**Special bilingual variable:**
- `{{bilingualContent}}` - Automatically includes both EN and AR in one block

### Announcement Variables
- `{{title}}` / `{{title_ar}}` - Announcement title (EN/AR)
- `{{content}}` / `{{content_ar}}` - Announcement content (EN/AR)
- `{{date}}` - Creation date (DD/MM/YYYY Qatar time)
- `{{dateTime}}` - Creation date/time (DD/MM/YYYY HH:MM Qatar time)
- `{{link}}` - Link to announcement

### Activity Variables
- `{{activityTitle}}` / `{{activityTitle_ar}}` - Activity title (EN/AR)
- `{{activityType}}` - quiz/homework/training
- `{{course}}` / `{{course_ar}}` - Programming/Computing/etc (EN/AR)
- `{{difficulty}}` - beginner/intermediate/advanced
- `{{dueDate}}` - Due date (DD/MM/YYYY Qatar time)
- `{{dueDateTime}}` - Due date/time (DD/MM/YYYY HH:MM Qatar time)
- `{{maxScore}}` - Maximum score
- `{{description}}` / `{{description_ar}}` - Activity description (EN/AR)
- `{{link}}` - Link to activity

### Submission Variables
- `{{studentName}}` - Student display name
- `{{studentEmail}}` - Student email
- `{{militaryNumber}}` - Student military number
- `{{activityTitle}}` - Activity name
- `{{score}}` - Assigned score
- `{{maxScore}}` - Maximum score
- `{{feedback}}` - Admin feedback
- `{{submissionDate}}` - When submitted
- `{{link}}` - Link to submission

### Enrollment Variables
- `{{studentName}}` - Student name
- `{{className}}` - Class name
- `{{classCode}}` - Class code
- `{{term}}` - Fall 2025, etc
- `{{instructorName}}` - Instructor name
- `{{instructorEmail}}` - Instructor email

### Resource Variables
- `{{resourceTitle}}` - Resource title
- `{{resourceType}}` - document/link/video
- `{{description}}` - Resource description
- `{{dueDate}}` - Due date (if any)
- `{{link}}` - Link to resource

### Chat Digest Variables
- `{{unreadCount}}` - Number of unread messages
- `{{messages}}` - Array of message objects
  - Each message: `{senderName, senderPhoto, text, time, chatLink}`
- `{{chatLink}}` - Link to chat page

## HTML Email Editor

### Recommended Approach: **GrapesJS** (Best for your use case)

**Why GrapesJS:**
- ✅ Free & open-source
- ✅ Drag-and-drop visual editor
- ✅ Can paste HTML from Unlayer/Stripo
- ✅ Built-in variable insertion
- ✅ Preview mode
- ✅ Export clean HTML
- ✅ Customizable toolbar
- ✅ Responsive email templates

**Alternative: React Email Editor**
- Unlayer's React component (free tier available)
- Professional email builder
- Pre-built templates
- Variable support

**Implementation:**
```jsx
import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';

// Template Editor Component
const EmailTemplateEditor = ({ template, onSave }) => {
  const editorRef = useRef(null);
  
  useEffect(() => {
    const editor = grapesjs.init({
      container: editorRef.current,
      height: '600px',
      storageManager: false,
      plugins: ['gjs-preset-newsletter'],
      pluginsOpts: {
        'gjs-preset-newsletter': {}
      }
    });
    
    // Add variable insertion buttons
    editor.Panels.addButton('options', {
      id: 'insert-variable',
      className: 'fa fa-code',
      command: 'open-variables',
      attributes: { title: 'Insert Variable' }
    });
    
    // Load template
    if (template.html) {
      editor.setComponents(template.html);
    }
    
    return () => editor.destroy();
  }, []);
  
  return (
    <div>
      <div ref={editorRef} />
      <VariableHelper /> {/* Shows available variables */}
    </div>
  );
};
```

**Variable Helper Component:**
- Sidebar showing all available variables
- Click to copy `{{variableName}}`
- Organized by category (Common, Activity, Student, etc.)
- Shows example values
- Bilingual support (EN/AR variables)

**Features to Include:**
1. **Template Library** - Pre-built templates for each email type
2. **Variable Autocomplete** - Type `{{` to see suggestions
3. **Preview with Sample Data** - See how variables render
4. **Responsive Preview** - Desktop/Mobile views
5. **Test Send** - Send to your email with sample data
6. **Version History** - Track template changes
7. **Duplicate Template** - Copy and modify existing templates

## Implementation Steps

### Phase 1: Email Settings UI (Dashboard)
1. Create "Email Settings" tab in Dashboard
2. Toggle switches for each trigger type
3. Template selector dropdown
4. Test email button for each type

### Phase 2: Template Management
1. Create "Email Templates" tab
2. List of templates with edit/delete
3. Template editor with:
   - Subject line
   - HTML editor (paste from Unlayer/Stripo)
   - Variable guide/helper
   - Preview with sample data
   - Test send

### Phase 3: Trigger Implementation
1. Update announcement creation to check settings & send
2. Update activity creation to check settings & send
3. Add submission complete handler
4. Add grading handler with confirmation modal
5. Add enrollment handler
6. Add resource handler

### Phase 4: Chat Digest (Scheduled Function)
1. Create scheduled function (every 3 hours)
2. Query unread messages per user
3. Group by user
4. Send digest email
5. Mark messages as "digest_sent"

## Default Templates (Bilingual)

### 1. Announcement Template (EN + AR)
**Subject:** `📢 New Announcement | إعلان جديد: {{title}}`


```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0;">📢 New Announcement | إعلان جديد</h1>
  </div>
  <div style="padding: 30px; background: #f9f9f9;">
    <!-- Greeting -->
    <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Dear {{recipientName}},</p>
    
    <!-- English Content -->
    <div style="background: white; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
      <h2 style="color: #667eea; margin-top: 0;">{{title}}</h2>
      <p style="color: #555; line-height: 1.6;">{{content}}</p>
      <p style="color: #999; font-size: 12px; margin-top: 15px;">
        📅 {{dateTime}} (Qatar Time UTC+3)
      </p>
    </div>
    
    <!-- Arabic Content -->
    <div style="background: white; padding: 30px; border-radius: 8px; direction: rtl;">
      <h2 style="color: #667eea; margin-top: 0;">{{title_ar}}</h2>
      <p style="color: #555; line-height: 1.6;">{{content_ar}}</p>
      <p style="color: #999; font-size: 12px; margin-top: 15px;">
        📅 {{dateTime}} (توقيت قطر UTC+3)
      </p>
    </div>
    
    <!-- Call to Action -->
    <div style="text-align: center; margin-top: 30px;">
      <a href="{{link}}" style="display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
        View Announcement | عرض الإعلان
      </a>
    </div>
  </div>
  <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
    <p>{{siteName}} - {{currentDate}}</p>
  </div>
</div>
```

### 2. Activity Graded Template (EN + AR)
**Subject:** `✅ Activity Graded | تم تقييم النشاط: {{activityTitle}}`

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0;">✅ Activity Graded | تم التقييم</h1>
  </div>
  <div style="padding: 30px; background: #f9f9f9;">
    <!-- Greeting -->
    <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Dear {{studentName}},</p>
    
    <!-- English Content -->
    <div style="background: white; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
      <h2 style="color: #28a745;">Congratulations!</h2>
      <p style="color: #555;">Your submission for <strong>{{activityTitle}}</strong> has been graded.</p>
      <div style="background: #f0f8ff; padding: 20px; border-left: 4px solid #28a745; margin: 20px 0;">
        <p style="margin: 0; font-size: 24px; color: #28a745;"><strong>Score: {{score}}/{{maxScore}}</strong></p>
        <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Graded on {{dateTime}} (Qatar Time)</p>
      </div>
      <div style="margin-top: 20px;">
        <h3 style="color: #555;">Instructor Feedback:</h3>
        <p style="color: #666; font-style: italic; background: #f8f9fa; padding: 15px; border-radius: 6px;">{{feedback}}</p>
      </div>
    </div>
    
    <!-- Arabic Content -->
    <div style="background: white; padding: 30px; border-radius: 8px; direction: rtl;">
      <h2 style="color: #28a745;">تهانينا!</h2>
      <p style="color: #555;">تم تقييم تسليمك لنشاط <strong>{{activityTitle_ar}}</strong></p>
      <div style="background: #f0f8ff; padding: 20px; border-right: 4px solid #28a745; margin: 20px 0;">
        <p style="margin: 0; font-size: 24px; color: #28a745;"><strong>الدرجة: {{score}}/{{maxScore}}</strong></p>
        <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">تم التقييم في {{dateTime}} (توقيت قطر)</p>
      </div>
      <div style="margin-top: 20px;">
        <h3 style="color: #555;">ملاحظات المدرس:</h3>
        <p style="color: #666; font-style: italic; background: #f8f9fa; padding: 15px; border-radius: 6px;">{{feedback_ar}}</p>
      </div>
    </div>
    
    <!-- Call to Action -->
    <div style="text-align: center; margin-top: 30px;">
      <a href="{{link}}" style="display: inline-block; padding: 15px 30px; background: #28a745; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
        View Details | عرض التفاصيل
      </a>
    </div>
  </div>
  <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
    <p>{{siteName}} - {{currentDate}}</p>
  </div>
</div>
```

### 3. Chat Digest Template
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0;">💬 You have {{unreadCount}} unread messages</h1>
  </div>
  <div style="padding: 30px; background: #f9f9f9;">
    {{#each messages}}
    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #667eea;">
      <div style="display: flex; align-items: center; margin-bottom: 10px;">
        <img src="{{senderPhoto}}" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 10px;" />
        <div>
          <strong style="color: #333;">{{senderName}}</strong>
          <p style="margin: 0; color: #999; font-size: 12px;">{{time}}</p>
        </div>
      </div>
      <p style="color: #555; margin: 0;">{{text}}</p>
    </div>
    {{/each}}
    <div style="text-align: center; margin-top: 20px;">
      <a href="{{chatLink}}" style="display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px;">Go to Chat</a>
    </div>
  </div>
</div>
```

## Admin UI Mockup

### Email Settings Tab
```
┌─────────────────────────────────────────────┐
│ Email Notification Settings                 │
├─────────────────────────────────────────────┤
│                                             │
│ 📢 Announcements                            │
│ [✓] Send email when announcement created    │
│ Template: [Default ▼]  [Edit] [Test]       │
│                                             │
│ 📝 New Activities                           │
│ [✓] Send email when activity published      │
│ Template: [Default ▼]  [Edit] [Test]       │
│                                             │
│ ✅ Activity Completed (Student → Admin)     │
│ [✓] Notify admin when student completes     │
│ Template: [Default ▼]  [Edit] [Test]       │
│                                             │
│ 🎯 Activity Graded (Admin → Student)        │
│ [✓] Send email when admin grades            │
│ [✓] Require confirmation before sending     │
│ Template: [Default ▼]  [Edit] [Test]       │
│                                             │
│ 🎓 Enrollment Welcome                       │
│ [✓] Send welcome email on enrollment        │
│ Template: [Default ▼]  [Edit] [Test]       │
│                                             │
│ 📚 New Resources                            │
│ [✓] Send email when resource added          │
│ Template: [Default ▼]  [Edit] [Test]       │
│                                             │
│ 💬 Chat Digest                              │
│ [✓] Send unread message digest              │
│ Interval: [3] hours                         │
│ Template: [Default ▼]  [Edit] [Test]       │
│                                             │
│ [Save All Settings]                         │
└─────────────────────────────────────────────┘
```

## Next Steps
1. Create email settings UI in Dashboard
2. Implement template management
3. Add trigger handlers to existing functions
4. Create scheduled chat digest function
5. Test all email types
6. Document variable usage for admins

---

Generated: 2025-10-06 19:16
Status: 📋 Planning complete, ready to implement
