# SMTP Configuration Consolidation Plan

## 🎯 Problem Statement

Currently, SMTP configuration is managed through a UI screen in `DashboardPage.jsx`. This creates issues:
- ❌ Multiple sources of truth (UI vs env variables)
- ❌ Hard to test and track
- ❌ Confusion between Gmail super admin vs Mandrill
- ❌ No clear fallback for testing vs production

## ✅ Solution: Centralized Configuration

### Approach: Environment Variables + Firestore Fallback

**Priority Order:**
1. **Environment Variables** (primary source)
2. **Firestore `config/smtp`** (fallback for production)
3. **Test flag** to differentiate testing vs production

---

## 📋 Implementation Plan

### 1. Environment Variables Structure

**File:** `.env` / `.env.production` / `.env.test`

```env
# SMTP Configuration
SMTP_PROVIDER=mandrill|gmail|mailtrap
SMTP_HOST=smtp.mandrillapp.com|smtp.gmail.com|sandbox.smtp.mailtrap.io
SMTP_PORT=587|465|2525
SMTP_SECURE=true|false
SMTP_USER=your-email@domain.com
SMTP_PASSWORD=your-app-password-or-api-key
SMTP_SENDER_NAME=QAF Learning Hub

# Testing Flag
USE_TEST_SMTP=true|false
TEST_SMTP_HOST=sandbox.smtp.mailtrap.io
TEST_SMTP_PORT=587
TEST_SMTP_USER=9c908a427b6636
TEST_SMTP_PASSWORD=7f3c74c9e2aec3

# Production (Mandrill)
MANDRILL_API_KEY=your-mandrill-api-key
MANDRILL_HOST=smtp.mandrillapp.com
MANDRILL_PORT=587

# Gmail (Super Admin - fallback)
GMAIL_SMTP_HOST=smtp.gmail.com
GMAIL_SMTP_PORT=587
GMAIL_SMTP_USER=shareef.hiasat@gmail.com
GMAIL_SMTP_PASSWORD=qyus cilm srfh hadt
```

### 2. Configuration Priority Logic

```javascript
// client/src/config/smtp.js
export const getSMTPConfig = async () => {
  // Priority 1: Environment variables
  if (process.env.REACT_APP_SMTP_HOST) {
    return {
      host: process.env.REACT_APP_SMTP_HOST,
      port: parseInt(process.env.REACT_APP_SMTP_PORT) || 587,
      secure: process.env.REACT_APP_SMTP_SECURE === 'true',
      user: process.env.REACT_APP_SMTP_USER,
      password: process.env.REACT_APP_SMTP_PASSWORD,
      senderName: process.env.REACT_APP_SMTP_SENDER_NAME || 'QAF Learning Hub',
      source: 'env'
    };
  }

  // Priority 2: Test SMTP (if USE_TEST_SMTP=true)
  if (process.env.REACT_APP_USE_TEST_SMTP === 'true') {
    return {
      host: process.env.REACT_APP_TEST_SMTP_HOST || 'sandbox.smtp.mailtrap.io',
      port: parseInt(process.env.REACT_APP_TEST_SMTP_PORT) || 587,
      secure: false,
      user: process.env.REACT_APP_TEST_SMTP_USER || '9c908a427b6636',
      password: process.env.REACT_APP_TEST_SMTP_PASSWORD || '7f3c74c9e2aec3',
      senderName: 'QAF Learning Hub (Test)',
      source: 'test'
    };
  }

  // Priority 3: Firestore config (fallback for production)
  const firestoreConfig = await getSMTPConfigFromFirestore();
  if (firestoreConfig) {
    return { ...firestoreConfig, source: 'firestore' };
  }

  // Priority 4: Default to Gmail super admin (last resort)
  return {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    user: 'shareef.hiasat@gmail.com',
    password: process.env.REACT_APP_GMAIL_SMTP_PASSWORD || '',
    senderName: 'QAF Learning Hub',
    source: 'default'
  };
};
```

### 3. Deprecate Dashboard SMTP UI

**Action:**
- Remove SMTP tab from Dashboard
- Add deprecation notice pointing to env variables
- Keep Firestore read for backward compatibility
- Remove `updateSMTPConfig` UI (keep function for migration)

**Migration Path:**
1. Read existing Firestore config
2. Export to `.env` file
3. Update documentation
4. Remove UI after migration period

---

## 🔧 Recommended Configuration

### For Production (Mandrill):
```env
SMTP_PROVIDER=mandrill
SMTP_HOST=smtp.mandrillapp.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=your-mandrill-username
SMTP_PASSWORD=your-mandrill-api-key
SMTP_SENDER_NAME=QAF Learning Hub
USE_TEST_SMTP=false
```

### For Testing (Mailtrap):
```env
USE_TEST_SMTP=true
TEST_SMTP_HOST=sandbox.smtp.mailtrap.io
TEST_SMTP_PORT=587
TEST_SMTP_USER=9c908a427b6636
TEST_SMTP_PASSWORD=7f3c74c9e2aec3
```

### For Development (Gmail Super Admin):
```env
SMTP_PROVIDER=gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=shareef.hiasat@gmail.com
SMTP_PASSWORD=qyus cilm srfh hadt
SMTP_SENDER_NAME=QAF Learning Hub (Dev)
USE_TEST_SMTP=false
```

---

## 📝 Benefits

1. ✅ **Single Source of Truth:** Environment variables
2. ✅ **Easy Testing:** `USE_TEST_SMTP` flag
3. ✅ **Clear Separation:** Production vs Test vs Dev
4. ✅ **Version Control Safe:** `.env` in `.gitignore`
5. ✅ **CI/CD Friendly:** Set env vars in deployment
6. ✅ **No UI Confusion:** Configuration in code, not UI

---

## 🚀 Migration Steps

1. **Create `client/src/config/smtp.js`** with priority logic
2. **Update `client/env.template`** with SMTP variables
3. **Update Cloud Function** to use env variables
4. **Add deprecation notice** to Dashboard SMTP tab
5. **Update documentation** with new configuration method
6. **Remove SMTP tab** after migration period (2-4 weeks)

---

## ✅ Testing Strategy

### E2E Tests:
- Test with `USE_TEST_SMTP=true` → Uses Mailtrap
- Test with production env → Uses Mandrill
- Test with no env → Falls back to Firestore
- Test with no Firestore → Falls back to Gmail default

### Test Cases:
- TC-SMTP-001: Environment variable config takes priority
- TC-SMTP-002: Test SMTP flag works correctly
- TC-SMTP-003: Firestore fallback works
- TC-SMTP-004: Default Gmail fallback works
- TC-SMTP-005: Email sending works with each config source

---

**Status:** 📋 Plan Ready for Implementation
