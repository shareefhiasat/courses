# Environment Variables Setup

## 📋 Required Environment Variables

Create `.env.test` file in the **project root** (not in tests/e2e):

```env
# Base URL
BASE_URL=http://localhost:5174

# Super Admin Credentials
TEST_SUPERADMIN_EMAIL=shareef.hiasat@gmail.com
TEST_SUPERADMIN_PASSWORD=Jordan123$

# Admin Credentials (if different)
TEST_ADMIN_EMAIL=admin@test.com
TEST_ADMIN_PASSWORD=Test123!@#

# Mailtrap Configuration
# Get Inbox ID from: https://mailtrap.io → Inboxes → Your Inbox
MAILTRAP_INBOX_ID=your_inbox_id_here
MAILTRAP_API_TOKEN=4eda497468586ee815e62dd85d53b5ed
MAILTRAP_SEND_API_TOKEN=4eda497468586ee815e62dd85d53b5ed

# Mailtrap SMTP (already configured in code, but can override)
MAILTRAP_SMTP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_SMTP_PORT=587
MAILTRAP_SMTP_USERNAME=9c908a427b6636
MAILTRAP_SMTP_PASSWORD=7f3c74c9e2aec3

# Super Admin Gmail (for email checking)
SUPERADMIN_GMAIL=shareef.hiasat@gmail.com
SUPERADMIN_GMAIL_APP_PASSWORD=qyus cilm srfh hadt

# Default password for test users
TEST_DEFAULT_PASSWORD=Test123!@#
```

## 🔒 Security

- ✅ `.env.test` is already in `.gitignore`
- ✅ Never commit credentials to git
- ✅ Use environment variables for all sensitive data

## 📝 How to Get Mailtrap Inbox ID

1. Go to https://mailtrap.io
2. Login to your account
3. Navigate to **Inboxes** → **Testing**
4. Click on your inbox (or create new one)
5. Look at the URL: `https://mailtrap.io/inboxes/1234567/messages`
6. The number `1234567` is your Inbox ID
7. Copy it to `.env.test` as `MAILTRAP_INBOX_ID=1234567`

## ✅ Verification

After setting up `.env.test`, verify configuration:

```bash
# Test that config loads correctly
node -e "require('dotenv').config({ path: '.env.test' }); console.log(process.env.TEST_SUPERADMIN_EMAIL)"
```

Or run a test:
```bash
npm run test:e2e:ui
# Then run TC-EMAIL-001 to test Mailtrap configuration
```
