# SMTP Configuration - Quick Reference

## 🎯 Default Behavior

### **Production (Default):**
- No env vars → Uses **Firestore `config/smtp`** OR **Gmail default**
- Env vars set → Uses **env vars** (Mandrill/Gmail)

### **Testing:**
- `VITE_USE_TEST_SMTP=true` → Always uses **Mailtrap**

---

## 📋 Priority Order

```
1. Environment Variables (VITE_SMTP_*)
   ↓
2. Test SMTP (if VITE_USE_TEST_SMTP=true) → Mailtrap
   ↓
3. Firestore config/smtp
   ↓
4. Gmail default (shareef.hiasat@gmail.com)
```

---

## 🔧 Quick Setup

### For Testing:
```env
VITE_USE_TEST_SMTP=true
```

### For Production (Mandrill):
```env
VITE_SMTP_PROVIDER=mandrill
VITE_SMTP_HOST=smtp.mandrillapp.com
VITE_SMTP_PORT=587
VITE_SMTP_USER=your-username
VITE_SMTP_PASSWORD=your-api-key
VITE_USE_TEST_SMTP=false
```

### For Production (Gmail):
```env
VITE_SMTP_PROVIDER=gmail
VITE_SMTP_HOST=smtp.gmail.com
VITE_SMTP_PORT=587
VITE_SMTP_USER=shareef.hiasat@gmail.com
VITE_SMTP_PASSWORD=qyus cilm srfh hadt
VITE_USE_TEST_SMTP=false
```

---

## ✅ What Changed

- ✅ SMTP config moved to env variables
- ✅ Dashboard SMTP tab deprecated (hidden from menu)
- ✅ Cloud Function uses new config
- ✅ Client code uses new config
- ✅ Test flag (`USE_TEST_SMTP=true`) for Mailtrap

---

**See `SMTP_IMPLEMENTATION_GUIDE.md` for details.**
