# Quick Reference - Loading & Monitoring

## 🚀 Quick Start

### 1. Environment Setup
Create `.env` file:
```env
VITE_PUBLIC_POSTHOG_KEY=phc_mpxjjYTNPiUTxE12MYkOsbH1DLTsjuOz4EEUOWEkUuc
VITE_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
VITE_SENTRY_DSN=https://226bc4d018e5d5b73f2dfd03014bb4c9@o570111.ingest.us.sentry.io/4510386883067904
VITE_SENTRY_ENVIRONMENT=development
```

### 2. Import Components
```jsx
import { 
  FancyLoading, 
  PermissionAwareLoading 
} from '@/components/ui';
```

### 3. Import Monitoring
```jsx
import { usePostHog } from 'posthog-js/react';
import * as Sentry from '@sentry/react';
```

---

## 📦 Loading Components

### FancyLoading
```jsx
// Fullscreen loading
<FancyLoading message="Loading..." fullscreen />

// Inline loading
<FancyLoading message="Loading..." variant="minimal" />

// Pulse animation
<FancyLoading message="Syncing..." variant="pulse" />

// Dots animation
<FancyLoading message="Please wait..." variant="dots" />
```

### PermissionAwareLoading
```jsx
// With permission check
<PermissionAwareLoading 
  isLoading={loading}
  requiredRole="admin"
  loadingMessage="Loading admin panel..."
>
  <AdminPanel />
</PermissionAwareLoading>

// Multiple roles
<PermissionAwareLoading 
  isLoading={loading}
  requiredRole={['admin', 'instructor']}
>
  <Content />
</PermissionAwareLoading>
```

---

## 📊 PostHog Analytics

### Track Events
```jsx
const posthog = usePostHog();

// Simple event
posthog?.capture('button_clicked');

// Event with properties
posthog?.capture('form_submitted', {
  form_name: 'registration',
  user_type: 'student'
});
```

### Identify Users
```jsx
posthog?.identify(user.uid, {
  email: user.email,
  name: user.displayName,
  role: user.role
});
```

### Feature Flags
```jsx
const isEnabled = posthog?.isFeatureEnabled('new-feature');

if (isEnabled) {
  // Show new feature
}
```

### Reset on Logout
```jsx
posthog?.reset();
```

---

## 🔴 Sentry Error Tracking

### Capture Errors
```jsx
try {
  riskyOperation();
} catch (error) {
  Sentry.captureException(error);
}
```

### Capture with Context
```jsx
Sentry.captureException(error, {
  contexts: {
    operation: { name: 'saveUser', userId: 123 }
  },
  tags: {
    section: 'user-management'
  }
});
```

### Capture Messages
```jsx
Sentry.captureMessage('Important event', 'info');
Sentry.captureMessage('Warning!', 'warning');
Sentry.captureMessage('Critical!', 'error');
```

### Set User Context
```jsx
Sentry.setUser({
  id: user.uid,
  email: user.email,
  username: user.displayName
});

// Clear on logout
Sentry.setUser(null);
```

### Add Breadcrumbs
```jsx
Sentry.addBreadcrumb({
  message: 'User clicked submit',
  category: 'ui',
  data: { formId: 'registration' }
});
```

---

## 🎯 Common Patterns

### Page with Loading & Monitoring
```jsx
import { useEffect, useState } from 'react';
import { usePostHog } from 'posthog-js/react';
import * as Sentry from '@sentry/react';
import { PermissionAwareLoading } from '@/components/ui';

const MyPage = () => {
  const posthog = usePostHog();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Track page view
    posthog?.capture('$pageview', { page: 'MyPage' });

    // Fetch data
    fetchData()
      .then(setData)
      .catch((error) => {
        Sentry.captureException(error);
        posthog?.capture('error', { page: 'MyPage' });
      })
      .finally(() => setLoading(false));
  }, [posthog]);

  return (
    <PermissionAwareLoading 
      isLoading={loading}
      requiredRole="admin"
    >
      <div>{/* Your content */}</div>
    </PermissionAwareLoading>
  );
};
```

### Button with Tracking
```jsx
const handleClick = () => {
  posthog?.capture('button_clicked', {
    button_name: 'submit',
    page: 'registration'
  });

  Sentry.addBreadcrumb({
    message: 'Submit button clicked',
    category: 'user-action'
  });

  // Your logic...
};

<button onClick={handleClick}>Submit</button>
```

### Form Submission
```jsx
const handleSubmit = async (formData) => {
  try {
    await saveData(formData);
    
    posthog?.capture('form_submitted', {
      form_type: 'registration',
      success: true
    });
  } catch (error) {
    Sentry.captureException(error, {
      contexts: { formData }
    });
    
    posthog?.capture('form_error', {
      form_type: 'registration',
      error: error.message
    });
  }
};
```

---

## 🧪 Testing

### Test Sentry
```jsx
<button onClick={() => {
  throw new Error('Test error!');
}}>
  Test Sentry
</button>
```

### Test PostHog
```jsx
<button onClick={() => {
  posthog?.capture('test_event', { test: true });
  console.log('Event sent!');
}}>
  Test PostHog
</button>
```

### Test Loading
```jsx
const [loading, setLoading] = useState(true);

useEffect(() => {
  setTimeout(() => setLoading(false), 3000);
}, []);

<PermissionAwareLoading isLoading={loading}>
  <div>Content loaded!</div>
</PermissionAwareLoading>
```

---

## 📱 Variants Guide

| Variant | Use Case | Example |
|---------|----------|---------|
| `default` | Page loads, major operations | Dashboard, Reports |
| `minimal` | Inline loading, small sections | List items, Cards |
| `pulse` | Real-time sync, background tasks | Data sync, Auto-save |
| `dots` | Form submissions, quick ops | Button loading, Saves |

---

## 🎨 Dark Mode

All components automatically support dark mode:
- System preference: `@media (prefers-color-scheme: dark)`
- Explicit theme: `[data-theme="dark"]` or `[data-theme="light"]`

No additional configuration needed!

---

## 📚 Full Documentation

- **LOADING_COMPONENTS_GUIDE.md** - Complete loading guide
- **MONITORING_INTEGRATION_GUIDE.md** - Full monitoring setup
- **IMPLEMENTATION_SUMMARY.md** - Implementation details
- **ENV_VARIABLES.md** - Environment variables

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| No data in dashboards | Check `.env` file |
| Loading not showing | Verify import path |
| Dark mode not working | Check `data-theme` attribute |
| Events not tracking | Check console for errors |
| Permissions not working | Verify AuthContext |

---

## ✅ Checklist

- [ ] Create `.env` file with credentials
- [ ] Restart dev server
- [ ] Test Sentry with error button
- [ ] Test PostHog with event button
- [ ] Check dashboards for data
- [ ] Replace old loading components
- [ ] Add tracking to key actions
- [ ] Set up error boundaries
- [ ] Configure alerts
- [ ] Review privacy settings

---

## 🔗 Quick Links

- **Sentry Dashboard**: https://sentry.io
- **PostHog Dashboard**: https://eu.posthog.com
- **Sentry Docs**: https://docs.sentry.io/platforms/javascript/guides/react/
- **PostHog Docs**: https://posthog.com/docs/libraries/react

---

## 💡 Pro Tips

1. Use meaningful event names
2. Add context to errors
3. Track performance metrics
4. Set up custom dashboards
5. Enable alerts for critical errors
6. Review data weekly
7. Respect user privacy
8. Test in production mode

---

**Need Help?** Check the full documentation guides or console logs for detailed error messages.
