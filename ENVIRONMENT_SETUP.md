# Environment Variables Setup Guide

## 🔐 Secure Environment Variable Management

This project uses Vite's built-in environment variable system for the client and Firebase Functions environment variables for the server.

## 📁 File Structure

```
# Client-side environment variables (Vite)
.env.example          # Template with placeholder values (committed to git)
.env.local           # Your actual secrets (NOT committed to git)
.env                 # Public defaults only (committed to git)

# Functions environment variables (Firebase Functions)
functions/.env.example   # Functions template (committed to git)
functions/.env.local     # Functions secrets (NOT committed to git)
functions/.env           # Functions defaults (committed to git)
```

## 🎯 How Environment Variables Work

### **Client-Side (Vite)**
- **`import.meta.env.VITE_*`** - Access variables in JavaScript/TypeScript
- **Only `VITE_` prefixed variables** are exposed to the client
- **Automatically loaded** from `.env.local` → `.env` (priority order)
- **Works out of the box** - no configuration needed

### **Server-Side (Firebase Functions)**
- **`process.env.VARIABLE_NAME`** - Access variables in functions
- **All variables available** (no prefix requirement)
- **Loaded from functions/.env.local** → **functions/.env**
- **Requires redeployment** to change

### **Example Usage**
```javascript
// Client-side (React/Vite)
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const qstashEnabled = import.meta.env.VITE_QSTASH_ENABLED === 'true';

// Server-side (Firebase Functions)
const smtpPassword = process.env.TEST_SMTP_PASSWORD;
const projectId = process.env.FIREBASE_PROJECT_ID;
```

## 🚀 Quick Setup

### 1. Copy the Templates
```bash
# Client-side environment variables
cp .env.example .env.local

# Functions environment variables
cp functions/.env.example functions/.env.local
```

### 2. Fill in Your Secrets

#### Client-side (.env.local) - **ONLY VITE_ prefixed variables**
```bash
# Required for Firebase Client SDK
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Required for Email Configuration
VITE_DEFAULT_FROM_EMAIL=your-email@gmail.com
VITE_DEFAULT_REPLY_TO=your-email@gmail.com
VITE_TEST_EMAIL=your-test-email@gmail.com

# Optional: QStash (if using client-side email)
VITE_QSTASH_ENABLED=false
VITE_QSTASH_URL=https://qstash.upstash.io
VITE_QSTASH_TOKEN=your-qstash-token
VITE_QSTASH_CURRENT_SIGNING_KEY=your-current-signing-key
VITE_QSTASH_NEXT_SIGNING_KEY=your-next-signing-key

# Optional: Analytics
VITE_PUBLIC_POSTHOG_KEY=your-posthog-key
VITE_SENTRY_DSN=your-sentry-dsn
```

#### Functions (functions/.env.local) - **Server-side only variables**
```bash
# Required for SMTP Email (NEVER expose these to client)
TEST_SMTP_USER=your-email@gmail.com
TEST_SMTP_PASSWORD=your-app-password
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Required for Firebase Functions
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com

# Email Service Configuration
EMAIL_SERVICE_ENABLED=true
EMAIL_FALLBACK_ENABLED=true
EMAIL_BATCH_SIZE=100
EMAIL_RETRY_ATTEMPTS=3

# Optional: QStash Server Configuration
QSTASH_ENABLED=false
QSTASH_TOKEN=your-qstash-token
```

## 🧹 **Variable Classification & Cleanup**

### **❌ REMOVE these duplicates:**
- `QSTASH_*` variables should be **ONLY in functions** (server-side)
- `FIREBASE_PROJECT_ID` should be **ONLY in functions** (server-side)
- Email SMTP credentials should be **ONLY in functions** (server-side)

### **✅ KEEP these in Client (.env.local):**
- All `VITE_*` variables (needed by React/Vite)
- Firebase client configuration
- Public API keys and URLs

### **✅ KEEP these in Functions (functions/.env.local):**
- SMTP passwords and credentials
- Server-side configuration
- Internal service tokens

### 3. Optional Services Configuration

#### Client-side (.env.local)
```bash
# Optional: QStash Email Service
VITE_QSTASH_ENABLED=true
VITE_QSTASH_TOKEN=your-qstash-token
VITE_QSTASH_CURRENT_SIGNING_KEY=your-current-signing-key
VITE_QSTASH_NEXT_SIGNING_KEY=your-next-signing-key

# Optional: Analytics
VITE_PUBLIC_POSTHOG_KEY=your-posthog-key
VITE_SENTRY_DSN=your-sentry-dsn

# Note: OpenRouter API should be server-side only (functions/.env.local)
# See functions section below for AI services configuration
```

#### Functions (functions/.env.local)
```bash
# Optional: QStash Configuration
QSTASH_ENABLED=false
QSTASH_TOKEN=your-qstash-token
QSTASH_CURRENT_SIGNING_KEY=your-current-signing-key
QSTASH_NEXT_SIGNING_KEY=your-next-signing-key

# Optional: AI Services (Server-side only)
OPENROUTER_API_KEY=your-openrouter-api-key
```

## 🔑 Where to Get Credentials

### Firebase
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings → General → Your apps
4. Copy the Firebase config object

### Gmail SMTP (for Email Service)
1. Enable 2-Factor Authentication on your Gmail account
2. Go to [Google Account Settings](https://myaccount.google.com/)
3. Go to Security → App passwords
4. Generate a new app password for "Mail"
5. Use the app password as your SMTP password

**Important**: Never use your regular Gmail password. Always use app passwords.

### QStash (Email Service)
1. Go to [Upstash Console](https://console.upstash.com/)
2. Create a new QStash project
3. Get your tokens from the QStash dashboard

### PostHog Analytics
1. Go to [PostHog](https://app.posthog.com/)
2. Go to Project Settings → Installation
3. Copy your Web API key

### Sentry (Error Tracking)
1. Go to [Sentry](https://sentry.io/)
2. Create a new project
3. Copy your DSN from the setup instructions

## 🏗️ Environment Priority

Vite loads environment variables in this order:
1. `.env.local` (highest priority - your secrets)
2. `.env` (public defaults)
3. `.env.production` / `.env.development` (if they exist)

## 🚨 Security Rules

- ✅ **Safe to commit**: `.env.example`, `.env` (public defaults only)
- ❌ **Never commit**: `.env.local`, any file with real API keys
- ✅ **Git ignore**: All `.env.*` files are properly ignored except `.env.example`

## 🔄 Production Deployment

### Vercel
1. Go to your Vercel project settings
2. Add environment variables in "Environment Variables" section
3. Redeploy your application

### Firebase Hosting
1. Use Firebase Functions config for server-side secrets
2. Use Vercel/Netlify environment variables for client-side secrets
3. Never expose server-side secrets to the client

### Docker/Other
```bash
# Set environment variables when running
docker run -e VITE_FIREBASE_API_KEY=your-key your-app
```

## 🧪 Testing

Test your setup:
```bash
# Check if variables are loaded
npm run dev

# Check console for:
# "Environment Variables Loaded:"
# "VITE_FIREBASE_PROJECT_ID: your-project-id"
```

## 📝 Common Issues

### Variables not loading?
- Make sure they start with `VITE_` for client-side access
- Restart your dev server after changing .env files
- Check that `.env.local` is in your project root

### Build errors?
- Ensure all required variables have values (even placeholder ones)
- Check for missing quotes around values with special characters

### Production issues?
- Verify production environment variables are set in your hosting platform
- Check that you're not committing `.env.local` to git

## 🔍 Environment Variable Reference

| Variable | Required | Description | Source |
|----------|----------|-------------|--------|
| `VITE_FIREBASE_*` | Yes | Firebase configuration | Firebase Console |
| `VITE_DEFAULT_FROM_EMAIL` | Yes | Default from email | Your email |
| `BASE_URL` | No | Application base URL | Your domain |
| `VITE_QSTASH_*` | No | Email service tokens | Upstash QStash |
| `VITE_PUBLIC_POSTHOG_KEY` | No | Analytics key | PostHog |
| `VITE_SENTRY_DSN` | No | Error tracking | Sentry |
| `OPENROUTER_API_KEY` | No | AI service | OpenRouter |

---

**🎯 Remember**: Never commit real API keys or secrets to version control!
