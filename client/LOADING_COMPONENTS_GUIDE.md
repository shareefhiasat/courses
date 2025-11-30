# Loading Components Guide

## Overview
This guide covers all loading and permission-aware components in the application, designed with best UX practices, dark mode support, and accessibility in mind.

---

## 1. FancyLoading Component

### Description
A beautiful, animated loading component with multiple variants for different use cases.

### Features
- 🎨 **4 Variants**: default, minimal, pulse, dots
- 🌓 **Dark Mode**: Automatic theme detection + explicit `data-theme` support
- 📱 **Responsive**: Mobile-optimized animations
- ♿ **Accessible**: Proper ARIA labels and semantic HTML
- ⚡ **Performance**: CSS-only animations (no JS)

### Usage

```jsx
import { FancyLoading } from '@/components/ui';

// Default variant - Full featured with logo and progress bar
<FancyLoading 
  message="Loading dashboard..." 
  fullscreen 
  variant="default"
/>

// Minimal variant - Simple spinner
<FancyLoading 
  message="Loading..." 
  variant="minimal"
/>

// Pulse variant - Pulsing rings
<FancyLoading 
  message="Syncing data..." 
  variant="pulse"
  fullscreen
/>

// Dots variant - Bouncing dots
<FancyLoading 
  message="Please wait..." 
  variant="dots"
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `message` | string | `'Loading...'` | Loading message to display |
| `fullscreen` | boolean | `false` | Cover entire screen with backdrop |
| `variant` | string | `'default'` | Animation style: 'default', 'minimal', 'pulse', 'dots' |

### When to Use Each Variant

- **default**: Initial page loads, major data fetching (dashboard, reports)
- **minimal**: Small sections, inline loading states
- **pulse**: Real-time sync operations, background tasks
- **dots**: Form submissions, quick operations

---

## 2. PermissionAwareLoading Component

### Description
Combines loading states with permission checks in a single component. Shows loading spinner while checking permissions, then either renders content or shows access denied message.

### Features
- 🔐 **Permission Checks**: Role-based access control
- 🎨 **Polished UI**: Beautiful access denied screen
- 🌓 **Dark Mode**: Full theme support
- 🔄 **Loading Integration**: Uses FancyLoading internally
- 👥 **Multi-Role**: Supports single role or array of roles

### Usage

```jsx
import { PermissionAwareLoading } from '@/components/ui';

// Basic usage with loading state only
<PermissionAwareLoading isLoading={isLoading}>
  <YourComponent />
</PermissionAwareLoading>

// With permission check (single role)
<PermissionAwareLoading 
  isLoading={isLoading}
  requiredRole="admin"
  loadingMessage="Loading admin dashboard..."
  variant="pulse"
  fullscreen
>
  <AdminDashboard />
</PermissionAwareLoading>

// With permission check (multiple roles)
<PermissionAwareLoading 
  isLoading={isLoading}
  requiredRole={['admin', 'instructor']}
  loadingMessage="Loading content..."
>
  <RestrictedContent />
</PermissionAwareLoading>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isLoading` | boolean | `false` | Whether component is loading |
| `requiredRole` | string \| string[] | `null` | Required role(s) to view content |
| `loadingMessage` | string | `'Loading...'` | Custom loading message |
| `fullscreen` | boolean | `true` | Fullscreen loading overlay |
| `variant` | string | `'default'` | FancyLoading variant to use |
| `children` | ReactNode | - | Content to render when loaded and authorized |

### Complete Example

```jsx
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionAwareLoading } from '@/components/ui';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/admin/data');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <PermissionAwareLoading
      isLoading={isLoading}
      requiredRole="admin"
      loadingMessage="Loading admin dashboard..."
      variant="pulse"
      fullscreen
    >
      <div className="admin-dashboard">
        <h1>Welcome, {currentUser?.displayName}</h1>
        {/* Your dashboard content */}
      </div>
    </PermissionAwareLoading>
  );
};

export default AdminDashboard;
```

---

## 3. Loading Component (Legacy)

### Description
Simple loading spinner component. Use `FancyLoading` for new implementations.

### Usage

```jsx
import { Loading } from '@/components/ui';

<Loading variant="spinner" size="md" />
```

---

## Best Practices

### 1. Choose the Right Variant
- Use **fullscreen** for page-level loading
- Use **inline** for component-level loading
- Use **minimal** for small UI elements

### 2. Provide Meaningful Messages
```jsx
// ❌ Bad
<FancyLoading message="Loading..." />

// ✅ Good
<FancyLoading message="Loading your dashboard..." />
<FancyLoading message="Syncing attendance records..." />
<FancyLoading message="Generating report..." />
```

### 3. Handle Errors Gracefully
```jsx
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  fetchData()
    .then(setData)
    .catch(setError)
    .finally(() => setIsLoading(false));
}, []);

if (error) return <ErrorMessage error={error} />;

return (
  <PermissionAwareLoading isLoading={isLoading}>
    <Content data={data} />
  </PermissionAwareLoading>
);
```

### 4. Optimize Loading States
```jsx
// ✅ Show loading immediately
const [isLoading, setIsLoading] = useState(true);

// ✅ Use skeleton screens for better UX
<Skeleton variant="text" count={3} />

// ✅ Implement optimistic UI updates
const handleSubmit = async (data) => {
  // Update UI immediately
  setData(data);
  
  // Then sync with server
  try {
    await api.save(data);
  } catch (error) {
    // Revert on error
    setData(previousData);
  }
};
```

### 5. Accessibility
All loading components include:
- Proper ARIA labels (`role="status"`, `aria-live="polite"`)
- Screen reader announcements
- Keyboard navigation support
- High contrast mode support

---

## Dark Mode Support

All loading components automatically support dark mode through:

1. **CSS Media Query**: `@media (prefers-color-scheme: dark)`
2. **Explicit Theme**: `[data-theme="dark"]` and `[data-theme="light"]`

### Example
```jsx
// Automatically adapts to system theme
<FancyLoading message="Loading..." />

// Works with your theme switcher
<html data-theme="dark">
  <FancyLoading message="Loading..." />
</html>
```

---

## Integration with Monitoring

### PostHog Analytics
```jsx
import { usePostHog } from 'posthog-js/react';

const MyComponent = () => {
  const posthog = usePostHog();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const startTime = Date.now();
    
    fetchData().finally(() => {
      const loadTime = Date.now() - startTime;
      posthog?.capture('page_load_time', { duration: loadTime });
      setIsLoading(false);
    });
  }, []);

  return (
    <PermissionAwareLoading isLoading={isLoading}>
      <Content />
    </PermissionAwareLoading>
  );
};
```

### Sentry Error Tracking
```jsx
import * as Sentry from '@sentry/react';

const MyComponent = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData()
      .catch((err) => {
        Sentry.captureException(err);
        setError(err);
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (error) return <ErrorBoundary error={error} />;

  return (
    <PermissionAwareLoading isLoading={isLoading}>
      <Content />
    </PermissionAwareLoading>
  );
};
```

---

## Migration Guide

### From Old Loading to FancyLoading

```jsx
// ❌ Old
<div className="loading-spinner">
  <span>Loading...</span>
</div>

// ✅ New
<FancyLoading message="Loading..." variant="minimal" />
```

### From Manual Permission Checks to PermissionAwareLoading

```jsx
// ❌ Old
const MyPage = () => {
  const { userRole } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  if (isLoading) return <div>Loading...</div>;
  if (userRole !== 'admin') return <div>Access Denied</div>;

  return <Content />;
};

// ✅ New
const MyPage = () => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <PermissionAwareLoading 
      isLoading={isLoading} 
      requiredRole="admin"
    >
      <Content />
    </PermissionAwareLoading>
  );
};
```

---

## Performance Tips

1. **Lazy Load Heavy Components**
```jsx
const HeavyComponent = lazy(() => import('./HeavyComponent'));

<Suspense fallback={<FancyLoading variant="pulse" />}>
  <HeavyComponent />
</Suspense>
```

2. **Debounce Loading States**
```jsx
const [isLoading, setIsLoading] = useState(false);
const [debouncedLoading, setDebouncedLoading] = useState(false);

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedLoading(isLoading);
  }, 300); // Only show loading after 300ms

  return () => clearTimeout(timer);
}, [isLoading]);
```

3. **Cache Data**
```jsx
import { useQuery } from '@tanstack/react-query';

const { data, isLoading } = useQuery({
  queryKey: ['dashboard'],
  queryFn: fetchDashboard,
  staleTime: 5 * 60 * 1000, // 5 minutes
});

return (
  <PermissionAwareLoading isLoading={isLoading}>
    <Dashboard data={data} />
  </PermissionAwareLoading>
);
```

---

## Troubleshooting

### Loading Never Completes
- Check if `setIsLoading(false)` is called in all code paths
- Use `.finally()` to ensure loading state is updated
- Check for unhandled promise rejections

### Permission Check Not Working
- Verify `AuthContext` is providing `userRole`
- Check role string matches exactly (case-sensitive)
- Ensure user is authenticated before checking permissions

### Dark Mode Not Working
- Verify `data-theme` attribute is set on `<html>` or `<body>`
- Check if CSS variables are defined in `tokens.css`
- Ensure theme switcher updates the attribute

---

## Summary

✅ **Use `FancyLoading`** for all new loading states
✅ **Use `PermissionAwareLoading`** for protected routes/components
✅ **Choose appropriate variants** based on context
✅ **Provide meaningful messages** for better UX
✅ **Handle errors gracefully** with proper error boundaries
✅ **Optimize performance** with lazy loading and caching
✅ **Test dark mode** in both system and explicit themes
✅ **Monitor performance** with PostHog and Sentry
