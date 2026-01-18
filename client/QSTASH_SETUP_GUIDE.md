# QStash Email Service Setup Guide

## Overview

QStash is a message queue service that can handle bulk email sending efficiently. This guide shows how to configure QStash for the QAF Courses application.

## Benefits of QStash

- **Bulk Processing**: Handle thousands of emails efficiently
- **Retry Logic**: Automatic retry on failures
- **Scheduled Delivery**: Send emails at specific times
- **Rate Limiting**: Built-in protection against overwhelming email services
- **Reliability**: Queue-based processing ensures delivery

## Setup Steps

### 1. Create QStash Account

1. Go to [QStash Console](https://console.upstash.com/)
2. Sign up or log in
3. Create a new project
4. Navigate to QStash section

### 2. Get QStash Credentials

1. In your QStash project, go to **QStash > Details**
2. Copy the **QSTASH_URL** and **QSTASH_TOKEN**
3. These will be used in your environment variables

### 3. Configure Environment Variables

Create a `.env` file in your client root:

```env
# Enable QStash
VITE_QSTASH_ENABLED=true

# QStash Configuration
VITE_QSTASH_URL=https://qstash.upstash.io/v1/publishes
VITE_QSTASH_TOKEN=your_actual_qstash_token_here

# Email Settings
VITE_DEFAULT_FROM_EMAIL=noreply@qaf.edu.qa
VITE_DEFAULT_REPLY_TO=support@qaf.edu.qa
VITE_TEST_EMAIL=test@example.com

# Performance Settings
VITE_QSTASH_MAX_BATCH_SIZE=100
VITE_QSTASH_RETRY_ATTEMPTS=3
VITE_QSTASH_BATCH_DELAY=1000
```

### 4. Backend API Integration

QStash requires a backend endpoint to actually send emails. Here's a sample implementation:

#### Backend API Endpoint (Node.js)

```javascript
// api/send-email.js
export default async function handler(req, res) {
  const { to, subject, html, text, from, replyTo } = req.body;
  
  try {
    // Use your email service (SendGrid, AWS SES, etc.)
    const result = await emailService.send({
      to,
      subject,
      html,
      text,
      from: from || process.env.DEFAULT_FROM_EMAIL,
      replyTo: replyTo || process.env.DEFAULT_REPLY_TO,
    });
    
    res.status(200).json({ success: true, messageId: result.messageId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
```

#### Configure QStash to Call Your API

Update your QStash URL to point to your backend:

```env
VITE_QSTASH_URL=https://your-backend.com/api/send-email
```

### 5. Email Service Provider Setup

Choose an email service provider:

#### Option A: SendGrid (Recommended)
```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const emailService = {
  send: async ({ to, subject, html, text }) => {
    const msg = {
      to,
      from: process.env.DEFAULT_FROM_EMAIL,
      subject,
      html,
      text,
    };
    return await sgMail.send(msg);
  }
};
```

#### Option B: AWS SES
```javascript
const AWS = require('aws-sdk');
const ses = new AWS.SES({ region: 'us-east-1' });

const emailService = {
  send: async ({ to, subject, html, text }) => {
    const params = {
      Destination: { ToAddresses: [to] },
      Message: {
        Body: { Html: { Data: html }, Text: { Data: text } },
        Subject: { Data: subject },
      },
      Source: process.env.DEFAULT_FROM_EMAIL,
    };
    return await ses.sendEmail(params).promise();
  }
};
```

#### Option C: Resend
```javascript
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

const emailService = {
  send: async ({ to, subject, html, text }) => {
    return await resend.emails.send({
      from: process.env.DEFAULT_FROM_EMAIL,
      to,
      subject,
      html,
      text,
    });
  }
};
```

## Configuration Options

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|----------|----------|
| `VITE_QSTASH_ENABLED` | Enable/disable QStash | `false` | No |
| `VITE_QSTASH_URL` | QStash API URL | - | Yes (if enabled) |
| `VITE_QSTASH_TOKEN` | QStash authentication token | - | Yes (if enabled) |
| `VITE_QSTASH_MAX_BATCH_SIZE` | Max emails per batch | `100` | No |
| `VITE_QSTASH_RETRY_ATTEMPTS` | Retry attempts on failure | `3` | No |
| `VITE_QSTASH_BATCH_DELAY` | Delay between batches (ms) | `1000` | No |

### Performance Tuning

#### For High Volume (1000+ emails/day)
```env
VITE_QSTASH_MAX_BATCH_SIZE=200
VITE_QSTASH_BATCH_DELAY=500
VITE_QSTASH_RETRY_ATTEMPTS=5
```

#### For Low Volume (<100 emails/day)
```env
VITE_QSTASH_MAX_BATCH_SIZE=50
VITE_QSTASH_BATCH_DELAY=2000
VITE_QSTASH_RETRY_ATTEMPTS=3
```

## Usage Examples

### Send Single Email
```javascript
import emailService from '../services/emailService';

const result = await emailService.sendSingleEmail({
  to: 'user@example.com',
  subject: 'Welcome to QAF Courses',
  html: '<h1>Welcome!</h1><p>Thanks for joining.</p>',
  text: 'Welcome! Thanks for joining.',
});
```

### Send Bulk Emails
```javascript
const emails = [
  { to: 'user1@example.com', subject: 'Subject 1', html: '<p>Body 1</p>' },
  { to: 'user2@example.com', subject: 'Subject 2', html: '<p>Body 2</p>' },
  // ... more emails
];

const result = await emailService.sendBulkEmails(emails);
console.log(`Sent: ${result.totalSent}, Failed: ${result.totalFailed}`);
```

### Schedule Email
```javascript
// Send in 1 hour
const deliveryTime = new Date(Date.now() + 60 * 60 * 1000);
await emailService.scheduleEmail({
  to: 'user@example.com',
  subject: 'Scheduled Email',
  html: '<p>This email was scheduled.</p>',
}, deliveryTime);
```

### Schedule Recurring Email
```javascript
// Send every Monday at 9 AM
await emailService.scheduleRecurringEmail({
  to: 'user@example.com',
  subject: 'Weekly Update',
  html: '<p>Your weekly update.</p>',
}, '0 9 * * 1'); // Cron expression
```

## Monitoring and Testing

### Test Configuration
```javascript
import emailService from '../services/emailService';

const testResult = await emailService.testConfiguration();
if (testResult.success) {
  console.log('Email service is working!');
} else {
  console.error('Email service test failed:', testResult.error);
}
```

### Check Service Status
```javascript
const status = emailService.getStatus();
console.log('Email Service Status:', status);
```

## Security Considerations

1. **Environment Variables**: Never commit `.env` files to version control
2. **API Keys**: Use restricted API keys with minimal permissions
3. **Rate Limiting**: Configure appropriate batch sizes and delays
4. **Error Handling**: Always handle email failures gracefully
5. **Logging**: Monitor email delivery status and failures

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Check QStash token is correct
   - Verify token has required permissions

2. **Rate Limiting**
   - Reduce batch size
   - Increase batch delay
   - Check provider rate limits

3. **Delivery Failures**
   - Verify email service provider configuration
   - Check sender email is verified
   - Review spam filter settings

4. **Backend Integration**
   - Ensure API endpoint is accessible
   - Check CORS configuration
   - Verify request/response format

### Debug Mode

Enable debug logging:
```env
VITE_LOG_LEVEL=debug
```

Check browser console for detailed email service logs.

## Migration from Current System

### Step 1: Backup Current Configuration
```bash
# Save current email configuration
cp src/firebase/firestore.js src/firebase/firestore.js.backup
```

### Step 2: Update Email Calls
Replace existing `sendEmail` calls with the new service:

```javascript
// Before
import { sendEmail } from '../firebase/firestore';
await sendEmail(emailData);

// After
import emailService from '../services/emailService';
await emailService.sendSingleEmail(emailData);
```

### Step 3: Test in Development
1. Enable QStash in development
2. Send test emails
3. Verify delivery and logging

### Step 4: Production Deployment
1. Set production environment variables
2. Deploy backend API endpoint
3. Test with real email addresses

## Support

- **QStash Documentation**: https://upstash.com/docs/qstash/overview
- **Email Provider Docs**: SendGrid/AWS SES/Resend documentation
- **Troubleshooting**: Check browser console and server logs

---

**Ready to set up QStash for efficient email delivery!** 🚀
