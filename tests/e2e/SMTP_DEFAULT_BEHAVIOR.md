# SMTP Default Behavior - Production vs Testing

## 🎯 Default Behavior

### **Production (Default):**
When no environment variables are set, the system will:

1. **Check Environment Variables** → Not found
2. **Check Test SMTP Flag** → `USE_TEST_SMTP` not set (defaults to false)
3. **Check Firestore** → `config/smtp` (if exists)
4. **Fallback to Gmail** → Super admin Gmail (`shareef.hiasat@gmail.com`)

**Result:** Uses Firestore config if available, otherwise Gmail super admin.

---

### **Testing (When `USE_TEST_SMTP=true`):**
When `VITE_USE_TEST_SMTP=true` is set:

1. **Check Environment Variables** → Not found (or ignored)
2. **Check Test SMTP Flag** → ✅ `USE_TEST_SMTP=true` → **Uses Mailtrap**
3. **Result:** Uses Mailtrap SMTP (`sandbox.smtp.mailtrap.io`)

**Result:** Always uses Mailtrap for testing.

---

## 📋 Configuration Priority

### Priority Order:
```
1. Environment Variables (VITE_SMTP_*)
   ↓ (if not set)
2. Test SMTP (if VITE_USE_TEST_SMTP=true)
   ↓ (if not set or false)
3. Firestore config/smtp
   ↓ (if not exists)
4. Gmail default (shareef.hiasat@gmail.com)
```

---

## 🔧 Examples

### Example 1: Production (No Env Vars)
```env
# No SMTP env vars set
# USE_TEST_SMTP not set (defaults to false)
```

**Behavior:**
- Checks env vars → Not found
- Checks test flag → False
- Checks Firestore → Uses if exists
- Falls back to Gmail if Firestore empty

**Result:** Firestore config OR Gmail default

---

### Example 2: Testing (Test Flag Set)
```env
VITE_USE_TEST_SMTP=true
```

**Behavior:**
- Checks env vars → Not found (or ignored)
- Checks test flag → ✅ True → **Uses Mailtrap**
- Skips Firestore and Gmail

**Result:** Mailtrap SMTP (sandbox.smtp.mailtrap.io)

---

### Example 3: Production (Env Vars Set)
```env
VITE_SMTP_HOST=smtp.mandrillapp.com
VITE_SMTP_PORT=587
VITE_SMTP_USER=your-mandrill-username
VITE_SMTP_PASSWORD=your-mandrill-api-key
VITE_USE_TEST_SMTP=false
```

**Behavior:**
- Checks env vars → ✅ Found → **Uses Mandrill**
- Skips test flag, Firestore, and Gmail

**Result:** Mandrill SMTP

---

### Example 4: Testing (Env Vars + Test Flag)
```env
VITE_SMTP_HOST=smtp.mandrillapp.com
VITE_USE_TEST_SMTP=true
```

**Behavior:**
- Checks env vars → Found BUT...
- Checks test flag → ✅ True → **Uses Mailtrap** (test flag overrides)
- Skips env vars, Firestore, and Gmail

**Result:** Mailtrap SMTP (test flag takes priority)

---

## ✅ Summary

| Scenario | Env Vars | Test Flag | Firestore | Result |
|----------|----------|-----------|-----------|--------|
| **Production** | ❌ | ❌ | ✅ | Firestore config |
| **Production** | ❌ | ❌ | ❌ | Gmail default |
| **Production** | ✅ | ❌ | ✅ | **Env vars** (priority 1) |
| **Testing** | ❌ | ✅ | ✅ | **Mailtrap** (test flag) |
| **Testing** | ✅ | ✅ | ✅ | **Mailtrap** (test flag overrides) |

---

## 🎯 Key Points

1. **Test Flag Overrides Everything:**
   - If `USE_TEST_SMTP=true`, always uses Mailtrap
   - Even if production env vars are set

2. **Production Default:**
   - If no env vars and no test flag → Uses Firestore or Gmail
   - Firestore is preferred over Gmail

3. **Environment Variables:**
   - Highest priority (except when test flag is set)
   - Use for production Mandrill/Gmail config

---

## 📝 Recommended Setup

### For Production:
```env
VITE_SMTP_PROVIDER=mandrill
VITE_SMTP_HOST=smtp.mandrillapp.com
VITE_SMTP_PORT=587
VITE_SMTP_USER=your-mandrill-username
VITE_SMTP_PASSWORD=your-mandrill-api-key
VITE_USE_TEST_SMTP=false  # Explicitly set to false
```

### For Testing:
```env
VITE_USE_TEST_SMTP=true
# That's it! Mailtrap will be used automatically
```

### For Development:
```env
# No env vars = Uses Firestore or Gmail default
# Or set Gmail explicitly:
VITE_SMTP_PROVIDER=gmail
VITE_SMTP_HOST=smtp.gmail.com
VITE_SMTP_USER=shareef.hiasat@gmail.com
VITE_SMTP_PASSWORD=qyus cilm srfh hadt
VITE_USE_TEST_SMTP=false
```

---

**Key Takeaway:** 
- **Production:** Set env vars OR rely on Firestore/Gmail
- **Testing:** Set `USE_TEST_SMTP=true` → Always uses Mailtrap
