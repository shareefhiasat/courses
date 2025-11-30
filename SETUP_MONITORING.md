# Monitoring & Analytics Setup Guide

This guide will help you configure Sentry (error tracking) and PostHog (analytics) for your application.

## 📊 What's Been Installed

### 1. **Sentry** - Error Tracking & Performance Monitoring
- Captures JavaScript errors and exceptions
- Tracks performance metrics
- Session replay for debugging
- User context tracking

### 2. **PostHog** - Product Analytics & Feature Flags
- User behavior tracking
- Event analytics
- Session recordings
- Feature flags for A/B testing
- Funnel analysis

### 3. **Storybook** - Component Documentation
- Visual component library
- Interactive component playground
- Automatic documentation generation

---

## 🚀 Quick Setup

### Step 1: Create Accounts

#### Sentry Setup:
1. Go to [https://sentry.io](https://sentry.io)
2. Sign up for a free account
3. Create a new project:
   - Platform: **React**
   - Project name: **courses-app** (or your choice)
4. Copy your **DSN** (looks like: `https://xxxxx@sentry.io/xxxxx`)

#### PostHog Setup:
1. Go to [https://posthog.com](https://posthog.com)
2. Sign up for a free account (or use self-hosted)
3. Create a new project
4. Copy your **Project API Key** (starts with `phc_`)
5. Note your **Host URL** (usually `https://app.posthog.com`)

### Step 2: Configure Environment Variables

1. Copy the template file:
   ```bash
   cd client
   copy env.template .env
   ```

2. Edit `.env` and add your credentials:
   ```env
   # Sentry Configuration
   VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
   VITE_SENTRY_ENVIRONMENT=production
   
   # PostHog Configuration
   VITE_POSTHOG_KEY=phc_your-posthog-key-here
   VITE_POSTHOG_HOST=https://app.posthog.com
   VITE_POSTHOG_ENVIRONMENT=production
   ```

3. **Important:** Never commit `.env` to git! It's already in `.gitignore`.

### Step 3: Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Check the browser console for initialization messages:
   ```
   ✅ Sentry initialized (development)
   ✅ PostHog initialized (development)
   ```

3. If you see warnings instead, that's normal - it means you haven't added the credentials yet.

---

## 🔧 Configuration Details

### Sentry Configuration

Located in: `client/src/config/sentry.js`

**Features Enabled:**
- ✅ Error tracking
- ✅ Performance monitoring (10% sample rate in production)
- ✅ Session replay (10% of sessions, 100% of error sessions)
- ✅ React component profiling
- ✅ Automatic breadcrumbs

**Filtered Errors:**
- Network errors (to reduce noise)
- Firebase permission-denied errors (expected behavior)

**Manual Error Tracking:**
```javascript
import { captureException, captureMessage, setUser } from '@/config/sentry';

// Capture an exception
try {
  // your code
} catch (error) {
  captureException(error, { context: 'additional info' });
}

// Capture a message
captureMessage('Something important happened', 'info');

// Set user context
setUser({ uid: user.uid, email: user.email });
```

### PostHog Configuration

Located in: `client/src/config/posthog.js`

**Features Enabled:**
- ✅ Automatic pageview tracking
- ✅ Performance metrics
- ✅ Session recording
- ✅ Feature flags

**Manual Event Tracking:**
```javascript
import { trackEvent, identifyUser, isFeatureEnabled } from '@/config/posthog';

// Track custom events
trackEvent('button_clicked', {
  button_name: 'submit_activity',
  page: 'activities'
});

// Identify users
identifyUser(user.uid, {
  email: user.email,
  role: user.role,
  plan: 'free'
});

// Check feature flags
if (isFeatureEnabled('new_dashboard')) {
  // Show new dashboard
}
```

---

## 📚 Storybook Setup

### Running Storybook

```bash
cd client
npm run storybook
```

This will open Storybook at `http://localhost:6006`

### What's Available

**Components with Stories:**
- ✅ Button (5 variants, 3 sizes, loading states)
- ✅ Card (with Header, Body, Footer)
- ✅ Badge (6 colors, 3 variants, dot indicators)

**Viewing Stories:**
1. Navigate to `UI/Button` in the sidebar
2. See all variants and states
3. Interact with controls in the bottom panel
4. Copy code examples from the Docs tab

### Creating New Stories

When you create a new component, add a `.stories.jsx` file:

```javascript
// MyComponent.stories.jsx
import MyComponent from './MyComponent';

export default {
  title: 'UI/MyComponent',
  component: MyComponent,
  tags: ['autodocs'],
};

export const Default = {
  args: {
    // default props
  },
};
```

---

## 🎯 Usage in Your App

### Tracking User Actions

```javascript
// In your components
import { trackEvent } from '@/config/posthog';

function ActivityCard({ activity }) {
  const handleStart = () => {
    trackEvent('activity_started', {
      activity_id: activity.id,
      activity_type: activity.type,
      difficulty: activity.difficulty
    });
    // ... rest of your code
  };
  
  return <button onClick={handleStart}>Start</button>;
}
```

### Error Boundaries with Sentry

```javascript
import * as Sentry from '@sentry/react';

// Wrap your app or specific routes
<Sentry.ErrorBoundary fallback={<ErrorFallback />}>
  <YourComponent />
</Sentry.ErrorBoundary>
```

### Feature Flags

```javascript
import { isFeatureEnabled } from '@/config/posthog';

function Dashboard() {
  const showNewUI = isFeatureEnabled('new_dashboard_ui');
  
  return showNewUI ? <NewDashboard /> : <OldDashboard />;
}
```

---

## 🔍 Monitoring Best Practices

### What to Track with PostHog:

1. **User Actions:**
   - Button clicks
   - Form submissions
   - Activity completions
   - Navigation events

2. **User Properties:**
   - Role (student, instructor, admin)
   - Enrollment count
   - Activity completion rate
   - Last login date

3. **Page Views:**
   - Automatically tracked
   - Add custom properties for context

### What to Send to Sentry:

1. **Errors:**
   - API failures
   - Form validation errors
   - Unexpected exceptions

2. **Performance:**
   - Slow API calls
   - Component render times
   - Route transitions

3. **User Context:**
   - User ID
   - Email
   - Role
   - Current page

---

## 🚨 Development vs Production

### Development Mode:
- Sentry: Disabled by default (add `VITE_SENTRY_DEBUG=true` to enable)
- PostHog: Disabled by default (add `VITE_POSTHOG_DEBUG=true` to enable)
- This prevents cluttering your dashboards with dev data

### Production Mode:
- Both services fully enabled
- Sample rates applied (10% for performance monitoring)
- Session replays enabled

---

## 📊 Dashboard Setup

### Sentry Dashboard:
1. **Issues** - View all errors
2. **Performance** - Track slow transactions
3. **Releases** - Track deployments
4. **Alerts** - Set up notifications

### PostHog Dashboard:
1. **Insights** - Create custom charts
2. **Recordings** - Watch user sessions
3. **Feature Flags** - Manage A/B tests
4. **Funnels** - Track conversion flows

---

## 🔐 Security Notes

1. **Never commit `.env` files** - They contain sensitive keys
2. **Use different projects** for dev/staging/production
3. **Rotate keys** if they're ever exposed
4. **Review session recordings** - Ensure no sensitive data is captured
5. **Configure data scrubbing** in Sentry to remove PII

---

## 📞 Support

- **Sentry Docs:** https://docs.sentry.io/platforms/javascript/guides/react/
- **PostHog Docs:** https://posthog.com/docs
- **Storybook Docs:** https://storybook.js.org/docs/react/get-started/introduction

---

## ✅ Checklist

- [ ] Created Sentry account and project
- [ ] Created PostHog account and project
- [ ] Copied `env.template` to `.env`
- [ ] Added Sentry DSN to `.env`
- [ ] Added PostHog key to `.env`
- [ ] Tested app startup (check console for initialization messages)
- [ ] Verified Sentry is receiving events
- [ ] Verified PostHog is tracking pageviews
- [ ] Explored Storybook component library
- [ ] Set up error alerts in Sentry
- [ ] Created first PostHog insight

---

## 🎉 You're All Set!

Your app now has:
- ✅ Professional error tracking
- ✅ User behavior analytics
- ✅ Feature flag capabilities
- ✅ Component documentation

Start tracking events and monitoring errors to improve your app!
