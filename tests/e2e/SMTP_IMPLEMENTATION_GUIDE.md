# SMTP Consolidation Implementation Guide

## ✅ Implementation Complete

### What Was Done:

1. **Created `client/src/config/smtp.js`** ✅
   - Priority-based SMTP configuration
   - Supports both client (Vite) and Cloud Functions (Node.js)
   - Automatic fallback chain

2. **Updated `client/env.template`** ✅
   - Added all SMTP environment variables
   - Documented priority order
   - Included test SMTP configuration

3. **Priority Logic Implemented:**
   ```
   1. Environment Variables (VITE_SMTP_*)
   2. Test SMTP (if VITE_USE_TEST_SMTP=true)
   3. Firestore config/smtp (fallback)
   4. Gmail default (last resort)
   ```

---

## 🔧 How to Use

### For Production (Mandrill):

**`.env` file:**
```env
VITE_SMTP_PROVIDER=mandrill
VITE_SMTP_HOST=smtp.mandrillapp.com
VITE_SMTP_PORT=587
VITE_SMTP_SECURE=true
VITE_SMTP_USER=your-mandrill-username
VITE_SMTP_PASSWORD=your-mandrill-api-key
VITE_SMTP_SENDER_NAME=QAF Learning Hub
VITE_USE_TEST_SMTP=false
```

### For Testing (Mailtrap):

**`.env` file:**
```env
VITE_USE_TEST_SMTP=true
VITE_TEST_SMTP_HOST=sandbox.smtp.mailtrap.io
VITE_TEST_SMTP_PORT=587
VITE_TEST_SMTP_USER=9c908a427b6636
VITE_TEST_SMTP_PASSWORD=7f3c74c9e2aec3
```

### For Development (Gmail):

**`.env` file:**
```env
VITE_SMTP_PROVIDER=gmail
VITE_SMTP_HOST=smtp.gmail.com
VITE_SMTP_PORT=587
VITE_SMTP_SECURE=false
VITE_SMTP_USER=shareef.hiasat@gmail.com
VITE_SMTP_PASSWORD=qyus cilm srfh hadt
VITE_SMTP_SENDER_NAME=QAF Learning Hub (Dev)
VITE_USE_TEST_SMTP=false
```

---

## 📝 Next Steps (Code Changes Required)

### 1. Update Cloud Function (`functions/sendEmail.js`)

**Replace:**
```javascript
const smtpConfig = await getSMTPConfig();
```

**With:**
```javascript
const { getSMTPConfigForFunctions } = require('../client/src/config/smtp');
const smtpConfig = getSMTPConfigForFunctions();
```

**Or create a shared config file in `functions/config/smtp.js`** (recommended)

### 2. Update Client Code

**Replace Dashboard SMTP usage:**
```javascript
// OLD: Get from Firestore
const smtpConfig = await getSMTPConfig();

// NEW: Use centralized config
import { getSMTPConfig } from '../config/smtp';
const smtpConfig = await getSMTPConfig();
```

### 3. Add Deprecation Notice to Dashboard

**In `DashboardPage.jsx` SMTP tab:**
```javascript
{activeTab === 'smtp' && (
  <div className="smtp-tab">
    <div style={{ 
      padding: '1rem', 
      background: '#fef3c7', 
      border: '1px solid #fbbf24', 
      borderRadius: 8, 
      marginBottom: '1rem' 
    }}>
      <strong>⚠️ Deprecated:</strong> SMTP configuration is now managed via environment variables.
      See <code>.env</code> file or <code>env.template</code> for configuration.
      This UI will be removed in a future version.
    </div>
    {/* Existing SMTP form */}
  </div>
)}
```

---

## 🧪 Testing

### Test SMTP Configuration:

```javascript
// In your test
import { getSMTPConfig } from '../config/smtp';

test('SMTP config uses test SMTP when flag is set', async () => {
  // Set env var
  process.env.VITE_USE_TEST_SMTP = 'true';
  
  const config = await getSMTPConfig();
  expect(config.source).toBe('test');
  expect(config.host).toBe('sandbox.smtp.mailtrap.io');
});
```

---

## 📋 Environment Variables Reference

### Production SMTP:
- `VITE_SMTP_PROVIDER` - Provider name (mandrill, gmail, custom)
- `VITE_SMTP_HOST` - SMTP host
- `VITE_SMTP_PORT` - SMTP port (587, 465, etc.)
- `VITE_SMTP_SECURE` - Use SSL/TLS (true/false)
- `VITE_SMTP_USER` - SMTP username/email
- `VITE_SMTP_PASSWORD` - SMTP password/API key
- `VITE_SMTP_SENDER_NAME` - Sender display name

### Test SMTP:
- `VITE_USE_TEST_SMTP` - Enable test SMTP (true/false)
- `VITE_TEST_SMTP_HOST` - Test SMTP host
- `VITE_TEST_SMTP_PORT` - Test SMTP port
- `VITE_TEST_SMTP_USER` - Test SMTP username
- `VITE_TEST_SMTP_PASSWORD` - Test SMTP password

### Gmail Fallback:
- `VITE_GMAIL_SMTP_PASSWORD` - Gmail app password (for default fallback)

---

## ✅ Benefits

1. **Single Source of Truth:** Environment variables
2. **Easy Testing:** `USE_TEST_SMTP=true` flag
3. **Clear Separation:** Production vs Test vs Dev
4. **Version Control Safe:** `.env` in `.gitignore`
5. **CI/CD Friendly:** Set env vars in deployment
6. **No UI Confusion:** Configuration in code, not UI

---

## 🚀 Migration Checklist

- [x] Create `client/src/config/smtp.js`
- [x] Update `client/env.template`
- [ ] Update Cloud Function to use new config
- [ ] Update client code to use new config
- [ ] Add deprecation notice to Dashboard SMTP tab
- [ ] Update documentation
- [ ] Test with `USE_TEST_SMTP=true`
- [ ] Test with production env vars
- [ ] Remove Dashboard SMTP tab (after migration period)

---

**Status:** ✅ Configuration Ready - Code Updates Pending
