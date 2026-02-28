# Email & Notification System

## 📧 Email System

### Template-Only Approach
Our email system uses **only templates** from the `emailTemplates` collection in Firestore. No raw HTML, no fallbacks - templates are mandatory.

### Usage
```javascript
import { sendEmail } from '@services/business/emailService';

const result = await sendEmail({
  to: 'user@example.com',
  templateId: 'welcome_signup_default',
  variables: {
    recipientName: 'John Doe',
    siteName: 'QAF Learning Hub'
  }
});
```

### Available Templates
See your template management UI for the complete list. Common templates include:
- `welcome_signup_default` - New user welcome
- `password_default` - Password reset
- `qr_code_student` - Student QR codes
- `activity_default` - New activities
- `quiz_default` - Quiz notifications
- And more...

### Cloud Functions
- `sendEmailTemplate` - Main email function (template only)
- `testEmailTemplate` - Test email templates

## 🔔 Notification Gateway

### Centralized Notifications
All notifications flow through the `notificationGateway` for consistent behavior across web, email, and future channels.

### Usage
```javascript
import { notificationGateway } from '@services/business/notificationGateway';

await notificationGateway.send(NOTIFICATION_TRIGGERS.QUIZ_AVAILABLE, {
  userId: 'user123',
  role: 'student',
  variables: { quizTitle: 'Math Quiz' },
  templateId: 'quiz_default',
  email: 'student@example.com'
});
```

### Integration Points
The notification gateway integrates with:
- **User Management** - Welcome emails, password resets
- **Classes/Enrollment** - Enrollment confirmations
- **Activities** - New activities, grading notifications
- **Quizzes** - Quiz availability, deadlines
- **Attendance** - Attendance records
- **Behavior** - Behavior logging
- **Participation** - Participation tracking
- **Penalties** - Penalty notifications
- **Reports** - Report generation

## 🚀 Quick Start

1. **Create Templates** - Use the email template manager in your UI
2. **Use Notification Gateway** - All notifications should go through gateway
3. **Test Templates** - Use `testEmailTemplate` function
4. **Monitor Logs** - Check `emailLogs` collection for delivery status

## 📋 Template Variables

Templates use `{{variableName}}` syntax. Common variables:
- `{{recipientName}}` - User's display name
- `{{siteName}}` - Your site name
- `{{currentDate}}` - Current date
- `{{siteUrl}}` - Your site URL

## 🔧 Configuration

Email configuration is stored in Firestore at `config/smtp`:
- `host` - SMTP server
- `port` - SMTP port
- `user` - SMTP username
- `password` - SMTP password
- `senderName` - Display name for emails

## 📊 Monitoring

- **Email Logs** - `emailLogs` collection tracks all email attempts
- **Notification Logs** - `notificationLogs` collection tracks gateway activity
- **Analytics** - Built-in performance tracking

## 🛠 Development

### Adding New Templates
1. Create template in emailTemplates collection
2. Add template ID to `EMAIL_TEMPLATE_TYPES` constants
3. Update notification gateway mapping if needed
4. Test with `testEmailTemplate`

### Adding New Notification Types
1. Add trigger to `NOTIFICATION_TRIGGERS`
2. Update gateway mapping
3. Create notification function if needed
4. Test end-to-end flow

## 📝 Notes

- **No Raw HTML** - All emails must use templates
- **No Fallbacks** - Templates must exist
- **Centralized** - Use notification gateway for all notifications
- **Bilingual** - Templates support English/Arabic variables
