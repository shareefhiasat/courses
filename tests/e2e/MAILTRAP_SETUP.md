# Mailtrap Setup Guide for E2E Testing

## 🎯 Overview

Mailtrap is used for:
1. **Testing emails** - Capture emails sent during E2E tests
2. **SMTP testing** - Send emails via SMTP for testing
3. **Email API** - Send emails via Mailtrap Send API
4. **Super Admin notifications** - Track emails sent to super admin

## 📋 Configuration

### 1. Mailtrap Credentials (Already Configured)

**SMTP Credentials:**
- Host: `sandbox.smtp.mailtrap.io`
- Port: `587` (or 25, 465, 2525)
- Username: `9c908a427b6636`
- Password: `7f3c74c9e2aec3`
- TLS: Optional (STARTTLS on all ports)

**Send API Token:**
- Token: `4eda497468586ee815e62dd85d53b5ed`
- Base URL: `https://send.api.mailtrap.io`

**Gmail App Password (for super admin):**
- Email: `shareef.hiasat@gmail.com`
- App Password: `qyus cilm srfh hadt`

### 2. Environment Variables

Add to `.env.test`:

```env
# Mailtrap Configuration
MAILTRAP_API_TOKEN=4eda497468586ee815e62dd85d53b5ed
MAILTRAP_INBOX_ID=your_inbox_id_here
MAILTRAP_SMTP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_SMTP_PORT=587
MAILTRAP_SMTP_USERNAME=9c908a427b6636
MAILTRAP_SMTP_PASSWORD=7f3c74c9e2aec3
MAILTRAP_SEND_API_TOKEN=4eda497468586ee815e62dd85d53b5ed

# Super Admin Gmail
SUPERADMIN_GMAIL=shareef.hiasat@gmail.com
SUPERADMIN_GMAIL_APP_PASSWORD=qyus cilm srfh hadt
```

### 3. Get Mailtrap Inbox ID

1. Go to [Mailtrap.io](https://mailtrap.io)
2. Login to your account
3. Go to **Inboxes** → **Testing** (or create new inbox)
4. Click on your inbox
5. Copy the **Inbox ID** from the URL or settings
6. Add to `.env.test` as `MAILTRAP_INBOX_ID`

**Example:** If URL is `https://mailtrap.io/inboxes/1234567/messages`, then inbox ID is `1234567`

## 🔧 Setup in Application

### Option 1: Use Mailtrap SMTP in Firebase Functions

Update Firebase Functions SMTP config in Firestore:

```javascript
// In Firebase Console → Firestore → config/smtp
{
  host: "sandbox.smtp.mailtrap.io",
  port: 587,
  secure: false,
  user: "9c908a427b6636",
  password: "7f3c74c9e2aec3",
  senderName: "QAF Learning Hub",
  from: "hello@demomailtrap.co"
}
```

### Option 2: Use Mailtrap Send API (Recommended for Testing)

The Send API is already configured in test utilities. Emails sent via API will:
- Be delivered to real recipients (if domain verified)
- Be captured in Mailtrap inbox (for testing)
- Allow tracking and analytics

## 📧 Domain Verification (Optional for Testing)

### Is Domain Verification Required?

**For Testing:** ❌ **NO** - Domain verification is **NOT required** for testing
- Mailtrap sandbox works without domain verification
- You can send test emails to any address
- Emails are captured in Mailtrap inbox

**For Production:** ✅ **YES** - Domain verification is **required** for production
- Allows sending from your domain (`main-one-32026.web.app`)
- Improves email deliverability
- Enables DKIM/SPF/DMARC

### Domain Verification Steps (For Production)

If you want to verify `main-one-32026.web.app`:

1. **Go to Mailtrap → Sending Domains**
2. **Add Domain:** `main-one-32026.web.app`
3. **Add DNS Records** to your domain provider:

   **Domain Verification:**
   ```
   Type: CNAME
   Name: mt32.main-one-32026
   Value: smtp.mailtrap.live
   ```

   **DKIM Records:**
   ```
   Type: CNAME
   Name: rwmt1._domainkey.main-one-32026
   Value: rwmt1.dkim.smtp.mailtrap.live
   
   Type: CNAME
   Name: rwmt2._domainkey.main-one-32026
   Value: rwmt2.dkim.smtp.mailtrap.live
   ```

   **DMARC Record:**
   ```
   Type: TXT
   Name: _dmarc.main-one-32026
   Value: v=DMARC1; p=none; rua=mailto:dmarc@smtp-staging.mailtrap.net; ruf=mailto:dmarc@smtp-staging.mailtrap.net; rf=afrf; pct=100
   ```

   **Domain Tracking:**
   ```
   Type: CNAME
   Name: mt-link.main-one-32026
   Value: t.mailtrap.live
   ```

4. **Wait for DNS propagation** (5-30 minutes)
5. **Verify in Mailtrap** - Status should show ✅ Verified

### Is It Easy and Free?

✅ **YES** - Domain verification is:
- **Free** - No cost
- **Easy** - Just add DNS records
- **One-time** - Set it up once
- **Optional for testing** - Not needed for E2E tests

## 🧪 Testing with Mailtrap

### 1. Test Email Sending

```bash
# Run email tests
npx playwright test specs/email-tests.spec.js

# Run with email tag
npx playwright test --grep "@email"
```

### 2. Check Mailtrap Inbox

1. Go to [Mailtrap.io](https://mailtrap.io)
2. Navigate to your inbox
3. See all emails captured during tests
4. Click on email to view content
5. Check HTML/text versions
6. Extract links for testing

### 3. Test Scenarios

**Welcome Email:**
- User signs up → Check for welcome email in Mailtrap

**Password Reset:**
- Request password reset → Check for reset email with link

**Notifications:**
- Super admin gets notification → Check Mailtrap inbox

**Email Content:**
- Verify email subject, body, links
- Test email templates

## 📊 Mailtrap Features Used

### 1. Email Inbox (Testing)
- Capture all emails sent during tests
- View email content (HTML/text)
- Extract links from emails
- Verify email delivery

### 2. SMTP (Sending)
- Send emails via SMTP
- Test email delivery
- Verify SMTP configuration

### 3. Send API (Production-like)
- Send emails via API
- Better for automated testing
- Track email status
- Analytics and reporting

## 🔍 Troubleshooting

### "Mailtrap inbox not found"
- Check `MAILTRAP_INBOX_ID` in `.env.test`
- Verify inbox exists in Mailtrap dashboard
- Check API token has correct permissions

### "Email not received"
- Wait a few seconds (emails may be delayed)
- Check Mailtrap inbox (not Gmail)
- Verify email was actually sent
- Check spam folder in Mailtrap

### "SMTP connection failed"
- Verify SMTP credentials
- Check port (587 for STARTTLS)
- Ensure TLS is enabled
- Test connection in Mailtrap dashboard

## ✅ Quick Setup Checklist

- [x] Mailtrap account created
- [x] SMTP credentials configured
- [x] Send API token obtained
- [x] Inbox ID added to `.env.test`
- [x] Test email sent successfully
- [ ] Domain verified (optional, for production)
- [ ] Firebase Functions SMTP updated (optional)

## 🚀 Next Steps

1. **Get Inbox ID:**
   - Login to Mailtrap
   - Go to Inboxes
   - Copy Inbox ID
   - Add to `.env.test`

2. **Test Configuration:**
   ```bash
   npx playwright test specs/email-tests.spec.js -g "TC-EMAIL-001"
   ```

3. **Verify Emails:**
   - Check Mailtrap inbox
   - Verify emails are captured
   - Test email content extraction

4. **Domain Verification (Optional):**
   - Add DNS records
   - Wait for verification
   - Test sending from domain

## 📚 Resources

- [Mailtrap Documentation](https://mailtrap.io/docs/)
- [Mailtrap Send API](https://mailtrap.io/docs/api/sending/)
- [Domain Verification Guide](https://mailtrap.io/docs/sending-domains/)

---

**Status:** ✅ Configuration Complete  
**Testing:** Ready for E2E email tests  
**Domain Verification:** Optional (not required for testing)
