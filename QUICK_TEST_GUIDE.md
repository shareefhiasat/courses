# Quick Test Guide - Dashboard Fixes

## 🚀 Immediate Actions

### 1. Refresh Your Browser
Press **Ctrl + Shift + R** (Windows) or **Cmd + Shift + R** (Mac) to hard refresh and clear cache.

### 2. Test Categories Tab (Most Important!)
```
Dashboard → Categories Tab
```

**What you should see:**
- If empty: Big button "➕ Add Default Categories"
- Click it → 4 categories appear instantly
- Table shows: python, computing, algorithm, general

**If you see nothing:**
- Check browser console (F12) for errors
- Verify `courses` collection exists in Firestore
- Try clicking "Add Default Categories" again

### 3. Test SMTP Tab
```
Dashboard → SMTP Tab
```

**What you should see:**
- Form with 5 fields (Host, Port, Email, Password, Sender Name)
- "Save Configuration" button at bottom

**If you see blank:**
- Switch to another tab and back
- Config lazy-loads on first open

### 4. Test Activities Form
```
Dashboard → Activities Tab
```

**Look for the Category dropdown:**
- Should be between "Class" and "Type" dropdowns
- Should show categories you created in step 2

**If dropdown is empty:**
- Go back to Categories tab
- Verify categories exist in table
- Refresh page

### 5. Test Newsletter Tab
```
Dashboard → Newsletter Tab
```

**Expected:**
- "No email logs yet..." message (if no emails sent)
- OR table with email history

### 6. Test Login Activity Tab
```
Dashboard → Login Activity Tab
```

**Expected:**
- Search box, filters, table with your login history

---

## 🐛 If You Still See White Screen

### Check 1: Browser Console
1. Press **F12**
2. Go to **Console** tab
3. Look for red errors
4. Share the error message

### Check 2: Network Tab
1. Press **F12**
2. Go to **Network** tab
3. Refresh page
4. Look for failed requests (red)
5. Check if Firestore requests succeed

### Check 3: Firestore Rules
Verify your Firestore rules allow:
```javascript
// Read courses collection
match /courses/{courseId} {
  allow read: if true;
  allow write: if request.auth != null;
}

// Read/write config
match /config/{doc} {
  allow read, write: if request.auth != null;
}
```

---

## 📊 Expected Behavior Summary

| Tab | Empty State | With Data |
|-----|-------------|-----------|
| **Categories** | "Add Default Categories" button | Table with categories + form |
| **SMTP** | Empty form fields | Filled form with saved config |
| **Newsletter** | "No email logs yet..." | Table with email history |
| **Login Activity** | "No login logs yet." | Table with login history |
| **Activities** | Form visible | Form + grid of activities |

---

## 🔍 Debugging Commands

### Check if dev server is running:
```bash
# Should show "VITE" and local/network URLs
# If not, run: npm run dev -- --host
```

### Check Firestore data:
```javascript
// In browser console (F12)
import { db } from './src/firebase/config';
import { collection, getDocs } from 'firebase/firestore';

// Check courses
const coursesSnap = await getDocs(collection(db, 'courses'));
console.log('Courses:', coursesSnap.docs.map(d => ({id: d.id, ...d.data()})));
```

---

## ✅ Success Indicators

You'll know everything is working when:

1. ✅ Dashboard loads without white screen
2. ✅ Categories tab shows button or table
3. ✅ SMTP tab shows configuration form
4. ✅ Activities dropdown shows categories
5. ✅ No console errors (F12)
6. ✅ No Vite duplicate key warnings

---

## 🆘 Still Having Issues?

### Share These Details:

1. **Browser console errors** (F12 → Console tab)
2. **Screenshot of the blank tab**
3. **Which specific tab is blank**
4. **Firestore collections you have** (check Firebase Console)

### Common Fixes:

**Problem:** Categories tab is blank
**Fix:** Click "Add Default Categories" button (might be hidden if styling broke)

**Problem:** SMTP tab is blank  
**Fix:** Switch tabs and come back (lazy loading)

**Problem:** Activities dropdown empty
**Fix:** Add categories first in Categories tab

**Problem:** Set Password gives 400 error
**Fix:** 
1. Add your email to Dashboard → Allowlist → Admin Emails
2. Sign out and sign back in
3. Try Set Password again

---

Generated: 2025-10-06 18:46
