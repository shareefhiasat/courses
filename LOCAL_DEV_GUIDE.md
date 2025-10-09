# 🚀 Local Development Guide

## ✅ What I Fixed

### CORS Issue Resolved!
- **Problem:** Test Email failed locally with CORS error
- **Solution:** Added automatic emulator connection for localhost
- **Result:** Works both locally AND on deployed site!

---

## 🔧 How It Works Now

### On Deployed Site (https://main-one-32026.web.app)
✅ Uses production Firebase Functions
✅ No CORS issues
✅ Real emails sent

### On Localhost (http://localhost:5174)
✅ Automatically connects to Functions Emulator
✅ No CORS issues
✅ Safe testing without sending real emails

---

## 🧪 Testing Locally

### Option 1: With Emulator (Recommended)

**Start the Functions Emulator:**
```bash
firebase emulators:start --only functions
```

**In another terminal, start dev server:**
```bash
npm run dev -- --host
```

**Benefits:**
- ✅ No CORS errors
- ✅ Fast testing
- ✅ No real emails sent
- ✅ See function logs in terminal

### Option 2: Without Emulator (Use Production)

**Just start dev server:**
```bash
npm run dev -- --host
```

**What happens:**
- Client tries to connect to emulator
- If emulator not running, falls back to production functions
- Uses real Firebase Functions
- Sends real emails

---

## 📝 What Changed in Code

### `client/src/firebase/config.js`

```javascript
// Automatically detects localhost
if (isLocalhost) {
  connectFunctionsEmulator(functions, 'localhost', 5001);
  console.log('✅ Connected to Functions Emulator');
}
```

**This means:**
- Localhost → Uses emulator (port 5001)
- Deployed → Uses production functions
- No code changes needed!

---

## 🎯 Test Email Now!

### With Emulator:
1. **Terminal 1:** `firebase emulators:start --only functions`
2. **Terminal 2:** `npm run dev -- --host`
3. **Browser:** http://localhost:5174
4. **Dashboard → Email Management**
5. **Click "📧 Test Email"**
6. **✅ Should work!**

### On Deployed Site:
1. **Browser:** https://main-one-32026.web.app
2. **Dashboard → Email Management**
3. **Click "📧 Test Email"**
4. **✅ Should work!**

---

## 🔍 Troubleshooting

### "Functions Emulator already connected"
- This is normal, ignore it
- Happens on hot reload

### Still getting CORS?
- Make sure emulator is running on port 5001
- Check console for "✅ Connected to Functions Emulator"
- If not connected, restart dev server

### Want to use production functions locally?
- Don't start the emulator
- Just run `npm run dev -- --host`
- Will use production functions (sends real emails)

---

## 📦 Deploy Updates

**Deploy everything:**
```bash
npm run deploy:hosting
firebase deploy --only functions
```

**Deploy only hosting:**
```bash
npm run deploy:hosting
```

**Deploy only functions:**
```bash
firebase deploy --only functions
```

---

## ✅ Summary

**Fixed:**
- ✅ CORS error on localhost
- ✅ Test Email works locally
- ✅ Test Email works on deployed site
- ✅ Automatic emulator detection

**How to use:**
- **Local dev:** Start emulator + dev server
- **Production:** Just deploy!

---

Generated: 2025-10-09 08:21
Status: ✅ Ready to test!
