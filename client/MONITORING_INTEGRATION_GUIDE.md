# Monitoring & Analytics Integration Guide

## Overview
This application uses **Sentry** for error tracking and **PostHog** for product analytics. Both are configured to work seamlessly with React and provide valuable insights into application health and user behavior.

---

## 🔴 Sentry - Error Tracking

### What is Sentry?
Sentry captures errors, exceptions, and performance issues in real-time, helping you identify and fix bugs quickly.

### Configuration

**DSN**: `https://226bc4d018e5d5b73f2dfd03014bb4c9@o570111.ingest.us.sentry.io/4510386883067904`

### Features Enabled
- ✅ Error tracking
- ✅ Performance monitoring
- ✅ Session replay
- ✅ React component profiling
- ✅ Breadcrumbs for debugging
- ✅ User context tracking

### Usage

#### 1. Automatic Error Capture
Sentry automatically captures:
- Unhandled exceptions
- Promise rejections
- React component errors
- Network errors (configurable)

```jsx
// Errors are automatically captured
throw new Error('This will be sent to Sentry');

// Async errors too
async function fetchData() {
  throw new Error('API error'); // Captured automatically
}
```

#### 2. Manual Error Capture
```jsx
import * as Sentry from '@sentry/react';

try {
  riskyOperation();
} catch (error) {
  Sentry.captureException(error, {
    contexts: {
      operation: {
        name: 'riskyOperation',
        params: { userId: 123 }
      }
    }
  });
}
```

#### 3. Capture Messages
```jsx
import * as Sentry from '@sentry/react';

// Info level
Sentry.captureMessage('User completed onboarding', 'info');

// Warning level
Sentry.captureMessage('API rate limit approaching', 'warning');

// Error level
Sentry.captureMessage('Critical system failure', 'error');
```

#### 4. Set User Context
```jsx
import { setUser } from '@/config/sentry';

// On login
setUser({
  uid: user.uid,
  email: user.email,
  displayName: user.displayName
});

// On logout
setUser(null);
```

#### 5. Add Breadcrumbs
```jsx
import { addBreadcrumb } from '@/config/sentry';

addBreadcrumb('User clicked submit button', {
  category: 'ui',
  formId: 'registration-form'
});

addBreadcrumb('API request started', {
  category: 'http',
  url: '/api/users',
  method: 'POST'
});
```

#### 6. Error Boundary
```jsx
import * as Sentry from '@sentry/react';

const App = () => (
  <Sentry.ErrorBoundary 
    fallback={<ErrorFallback />}
    showDialog
  >
    <YourApp />
  </Sentry.ErrorBoundary>
);
```

### Testing Sentry

Add this button to test error tracking:

```jsx
import * as Sentry from '@sentry/react';

function ErrorButton() {
  return (
    <button
      onClick={() => {
        throw new Error('This is your first error!');
      }}
    >
      Break the world
    </button>
  );
}
```

### Environment Variables

```env
# Required
VITE_SENTRY_DSN=https://226bc4d018e5d5b73f2dfd03014bb4c9@o570111.ingest.us.sentry.io/4510386883067904

# Optional
VITE_SENTRY_ENVIRONMENT=production  # or development
VITE_SENTRY_DEBUG=true              # Enable in development
```

### Best Practices

1. **Filter Sensitive Data**
```jsx
Sentry.init({
  beforeSend(event) {
    // Remove sensitive data
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers?.Authorization;
    }
    return event;
  }
});
```

2. **Add Context to Errors**
```jsx
try {
  await saveUser(userData);
} catch (error) {
  Sentry.captureException(error, {
    contexts: {
      userData: {
        userId: userData.id,
        action: 'save'
      }
    },
    tags: {
      section: 'user-management'
    }
  });
}
```

3. **Use Tags for Filtering**
```jsx
Sentry.setTag('page', 'dashboard');
Sentry.setTag('feature', 'analytics');
```

---

## 📊 PostHog - Product Analytics

### What is PostHog?
PostHog tracks user behavior, feature usage, and provides insights into how users interact with your application.

### Configuration

**API Key**: `phc_mpxjjYTNPiUTxE12MYkOsbH1DLTsjuOz4EEUOWEkUuc`  
**Host**: `https://eu.i.posthog.com` (EU region)

### Features Enabled
- ✅ Event tracking
- ✅ Page view tracking
- ✅ Session recording
- ✅ Feature flags
- ✅ User identification
- ✅ Performance metrics

### Usage

#### 1. Track Custom Events
```jsx
import { usePostHog } from 'posthog-js/react';

const MyComponent = () => {
  const posthog = usePostHog();

  const handleSubmit = () => {
    posthog?.capture('form_submitted', {
      form_name: 'registration',
      user_type: 'student',
      timestamp: new Date().toISOString()
    });
  };

  return <button onClick={handleSubmit}>Submit</button>;
};
```

#### 2. Identify Users
```jsx
import { usePostHog } from 'posthog-js/react';

const LoginPage = () => {
  const posthog = usePostHog();

  const handleLogin = async (user) => {
    // Identify user in PostHog
    posthog?.identify(user.uid, {
      email: user.email,
      name: user.displayName,
      role: user.role,
      created_at: user.createdAt
    });
  };
};
```

#### 3. Track Page Views
```jsx
import { usePostHog } from 'posthog-js/react';
import { useEffect } from 'react';

const DashboardPage = () => {
  const posthog = usePostHog();

  useEffect(() => {
    posthog?.capture('$pageview', {
      page_name: 'Dashboard',
      section: 'admin'
    });
  }, [posthog]);

  return <div>Dashboard Content</div>;
};
```

#### 4. Feature Flags
```jsx
import { usePostHog } from 'posthog-js/react';

const MyComponent = () => {
  const posthog = usePostHog();
  const isNewFeatureEnabled = posthog?.isFeatureEnabled('new-analytics');

  return (
    <div>
      {isNewFeatureEnabled ? (
        <NewAnalyticsDashboard />
      ) : (
        <OldAnalyticsDashboard />
      )}
    </div>
  );
};
```

#### 5. Track Performance
```jsx
import { usePostHog } from 'posthog-js/react';

const DataLoader = () => {
  const posthog = usePostHog();

  useEffect(() => {
    const startTime = performance.now();

    fetchData().then(() => {
      const loadTime = performance.now() - startTime;
      
      posthog?.capture('data_load_time', {
        duration_ms: loadTime,
        data_type: 'dashboard',
        success: true
      });
    });
  }, []);
};
```

#### 6. Reset on Logout
```jsx
import { usePostHog } from 'posthog-js/react';

const LogoutButton = () => {
  const posthog = usePostHog();

  const handleLogout = () => {
    posthog?.reset(); // Clear user identity
    // ... logout logic
  };

  return <button onClick={handleLogout}>Logout</button>;
};
```

### Environment Variables

```env
# Required
VITE_PUBLIC_POSTHOG_KEY=phc_mpxjjYTNPiUTxE12MYkOsbH1DLTsjuOz4EEUOWEkUuc
VITE_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com

# Optional
VITE_POSTHOG_DEBUG=true  # Enable in development
```

### Common Events to Track

```jsx
// User Actions
posthog.capture('button_clicked', { button_name: 'submit' });
posthog.capture('form_submitted', { form_type: 'registration' });
posthog.capture('search_performed', { query: 'react hooks' });

// Feature Usage
posthog.capture('feature_used', { feature_name: 'analytics' });
posthog.capture('export_data', { format: 'csv', rows: 100 });

// Errors (non-critical)
posthog.capture('validation_error', { field: 'email' });
posthog.capture('api_timeout', { endpoint: '/api/users' });

// Business Events
posthog.capture('enrollment_created', { course_id: 123 });
posthog.capture('assignment_submitted', { assignment_id: 456 });
```

### Best Practices

1. **Use Descriptive Event Names**
```jsx
// ❌ Bad
posthog.capture('click');

// ✅ Good
posthog.capture('submit_button_clicked', {
  form_name: 'user_registration',
  section: 'onboarding'
});
```

2. **Add Relevant Properties**
```jsx
posthog.capture('course_enrolled', {
  course_id: course.id,
  course_name: course.name,
  user_role: user.role,
  enrollment_type: 'self',
  timestamp: new Date().toISOString()
});
```

3. **Don't Track Sensitive Data**
```jsx
// ❌ Bad - Don't track passwords, tokens, etc.
posthog.capture('login', { password: '...' });

// ✅ Good
posthog.capture('login_success', { 
  method: 'email',
  user_type: 'student'
});
```

---

## 🔗 Integration Examples

### Complete Page Example

```jsx
import { useEffect, useState } from 'react';
import { usePostHog } from 'posthog-js/react';
import * as Sentry from '@sentry/react';
import { PermissionAwareLoading } from '@/components/ui';

const DashboardPage = () => {
  const posthog = usePostHog();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Track page view
    posthog?.capture('$pageview', { page_name: 'Dashboard' });

    // Add breadcrumb for debugging
    Sentry.addBreadcrumb({
      message: 'Dashboard page loaded',
      category: 'navigation'
    });

    // Fetch data
    const startTime = performance.now();
    
    fetchDashboardData()
      .then((result) => {
        setData(result);
        
        // Track successful load
        const loadTime = performance.now() - startTime;
        posthog?.capture('dashboard_loaded', {
          duration_ms: loadTime,
          data_count: result.length
        });
      })
      .catch((error) => {
        // Send to Sentry
        Sentry.captureException(error, {
          contexts: {
            page: { name: 'Dashboard' }
          }
        });

        // Track error in PostHog
        posthog?.capture('dashboard_load_error', {
          error_message: error.message
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [posthog]);

  const handleExport = () => {
    posthog?.capture('export_clicked', {
      page: 'dashboard',
      format: 'csv'
    });

    Sentry.addBreadcrumb({
      message: 'User exported dashboard data',
      category: 'user-action'
    });

    // Export logic...
  };

  return (
    <PermissionAwareLoading 
      isLoading={isLoading}
      requiredRole="admin"
      loadingMessage="Loading dashboard..."
    >
      <div>
        <h1>Dashboard</h1>
        <button onClick={handleExport}>Export</button>
        {/* Dashboard content */}
      </div>
    </PermissionAwareLoading>
  );
};

export default DashboardPage;
```

### Error Boundary with Monitoring

```jsx
import * as Sentry from '@sentry/react';
import { usePostHog } from 'posthog-js/react';

const ErrorFallback = ({ error, resetErrorBoundary }) => {
  const posthog = usePostHog();

  useEffect(() => {
    // Track error in PostHog
    posthog?.capture('error_boundary_triggered', {
      error_message: error.message,
      error_stack: error.stack
    });
  }, [error, posthog]);

  return (
    <div>
      <h1>Something went wrong</h1>
      <p>{error.message}</p>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
};

const App = () => (
  <Sentry.ErrorBoundary fallback={ErrorFallback}>
    <YourApp />
  </Sentry.ErrorBoundary>
);
```

---

## 🧪 Testing

### Test Sentry

```jsx
// Add this button anywhere in your app
<button onClick={() => {
  throw new Error('Test Sentry error!');
}}>
  Test Sentry
</button>
```

### Test PostHog

```jsx
// Add this button anywhere in your app
<button onClick={() => {
  posthog?.capture('test_event', {
    test: true,
    timestamp: new Date().toISOString()
  });
  console.log('Event sent to PostHog!');
}}>
  Test PostHog
</button>
```

---

## 📈 Monitoring Checklist

### On Every Page
- [ ] Track page views
- [ ] Add Sentry breadcrumbs for navigation
- [ ] Identify users on login
- [ ] Reset tracking on logout

### On User Actions
- [ ] Track important button clicks
- [ ] Track form submissions
- [ ] Track feature usage
- [ ] Add context to events

### On Errors
- [ ] Capture exceptions in Sentry
- [ ] Add relevant context
- [ ] Track error events in PostHog
- [ ] Show user-friendly error messages

### Performance
- [ ] Track load times
- [ ] Monitor API response times
- [ ] Track slow operations
- [ ] Set performance budgets

---

## 🔒 Privacy & Compliance

### Data Collection
- ✅ No passwords or tokens tracked
- ✅ PII (email, name) only for identified users
- ✅ Session recordings can be disabled
- ✅ Users can opt-out of tracking

### GDPR Compliance
```jsx
// Allow users to opt-out
posthog?.opt_out_capturing();

// Delete user data
posthog?.reset();
Sentry.setUser(null);
```

---

## 📚 Resources

### Sentry
- Dashboard: https://sentry.io
- Docs: https://docs.sentry.io/platforms/javascript/guides/react/
- React Guide: https://docs.sentry.io/platforms/javascript/guides/react/

### PostHog
- Dashboard: https://eu.posthog.com
- Docs: https://posthog.com/docs
- React Guide: https://posthog.com/docs/libraries/react

---

## 🎯 Summary

✅ **Sentry** captures errors automatically  
✅ **PostHog** tracks user behavior and features  
✅ Both work seamlessly with React  
✅ Configured for EU region (GDPR compliant)  
✅ Disabled in development by default  
✅ Easy to test with provided examples  
✅ Privacy-focused with opt-out options  

**Next Steps:**
1. Verify environment variables are set
2. Test both integrations with provided buttons
3. Check dashboards for incoming data
4. Set up alerts and notifications
5. Create custom dashboards for your metrics
