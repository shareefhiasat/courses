# Set Base URL in Firestore

## Option B: Firestore Config (Recommended)

To set the base URL for email links, create a document in Firestore:

**Collection:** `config`
**Document ID:** `site`
**Field:** `baseUrl` (string)

### For Production:
```
baseUrl: "https://main-one-32026.web.app"
```

### For Local Development:
```
baseUrl: "http://localhost:5174"
```

## How to Set It:

### Via Firebase Console:
1. Go to Firebase Console → Firestore Database
2. Navigate to `config` collection (create if doesn't exist)
3. Create/Edit document with ID: `site`
4. Add field: `baseUrl` = `"https://main-one-32026.web.app"`

### Via Code (Run Once):
```javascript
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase/config';

await setDoc(doc(db, 'config', 'site'), {
  baseUrl: 'https://main-one-32026.web.app'
}, { merge: true });
```

## After Setting:
1. Redeploy functions: `npm run deploy:functions`
2. Email links will use the correct URL!

---

Generated: 2025-10-09 14:11
