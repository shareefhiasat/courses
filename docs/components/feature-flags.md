# Feature Flagging System

A comprehensive feature flagging system that allows you to control UI element visibility based on user roles.

## 🚀 Quick Start

### 1. Basic Usage with Wrapper Component

```jsx
import { FeatureFlagWrapper } from '@ui/FeatureFlagWrapper';

function MyComponent() {
  return (
    <FeatureFlagWrapper 
      featureId="QR_SCANNER_ACCESS"
      fallback={<div>Not available for your role</div>}
    >
      <QRScannerComponent />
    </FeatureFlagWrapper>
  );
}
```

### 2. Usage with Hook

```jsx
import { useFeatureFlags } from '@hooks/useFeatureFlags';

function MyComponent() {
  const { isEnabled } = useFeatureFlags();
  
  if (isEnabled('QR_SCANNER_ACCESS')) {
    return <QRScannerComponent />;
  }
  
  return <div>Not available for your role</div>;
}
```

## 📁 File Structure

```
src/
├── constants/
│   ├── featureFlags.js          # Main feature flags configuration
│   └── README_FeatureFlags.md   # This documentation
├── hooks/
│   └── useFeatureFlags.js       # React hook for feature flags
├── components/ui/
│   └── FeatureFlagWrapper.jsx  # Wrapper component
├── utils/
│   └── featureFlagUtils.js     # Utility functions
└── constants/
    └── featureFlagExamples.js  # Examples and best practices
```

## 🔧 Configuration

### Adding a New Feature Flag

1. **Add to `featureFlags.js`:**

```javascript
export const FEATURE_FLAGS = {
  // ... existing flags
  
  MY_NEW_FEATURE: {
    id: 'MY_NEW_FEATURE',
    name: 'My New Feature',
    description: 'Description of what this feature does',
    category: 'category_name',
    enabledForRoles: [ROLE_STRINGS.ADMIN, ROLE_STRINGS.SUPER_ADMIN],
    defaultValue: false,
    version: '1.0.0'
  }
};
```

2. **Use in your component:**

```jsx
<FeatureFlagWrapper featureId="MY_NEW_FEATURE">
  <MyFeatureComponent />
</FeatureFlagWrapper>
```

### Role-Based Configuration

The system supports these roles:
- `ROLE_STRINGS.STUDENT`
- `ROLE_STRINGS.INSTRUCTOR`
- `ROLE_STRINGS.ADMIN`
- `ROLE_STRINGS.HR`
- `ROLE_STRINGS.SUPER_ADMIN`

## 🎯 Current Feature Flags

| Feature ID | Name | Category | Enabled For | Default |
|------------|------|----------|-------------|---------|
| `QR_SCANNER_ACCESS` | QR Scanner Access | qr_scanner | Instructor, Admin, HR, Super Admin | true |
| `BULK_SCAN_DIALOG` | Bulk Scan Dialog | qr_scanner | Instructor, Admin, HR, Super Admin | true |
| `ADVANCED_ANALYTICS` | Advanced Analytics | analytics | Admin, Super Admin | false |
| `STUDENT_ACTION_PANELS` | Student Action Panels | qr_scanner | Instructor, Admin, HR, Super Admin | true |

## 🛠️ Advanced Usage

### Multiple Feature Conditions

```jsx
import { MultiFeatureWrapper } from '@ui/FeatureFlagWrapper';

<MultiFeatureWrapper 
  featureIds={['FEATURE_A', 'FEATURE_B']} 
  requirement="all"  // or "any"
>
  <ComponentThatNeedsMultipleFeatures />
</MultiFeatureWrapper>
```

### Conditional Rendering

```jsx
import { FeatureFlagDisabled } from '@ui/FeatureFlagWrapper';

<FeatureFlagDisabled featureId="HIDDEN_FEATURE">
  <div>Show this when feature is disabled</div>
</FeatureFlagDisabled>
```

### Hook-Based Logic

```jsx
function AdminPanel() {
  const { isEnabled, getEnabledFeatures, getCategoryFeatures } = useFeatureFlags();
  
  const canManageUsers = isEnabled('USER_MANAGEMENT');
  const analyticsFeatures = getCategoryFeatures('analytics');
  const userFeatures = getEnabledFeatures();
  
  return (
    <div>
      {canManageUsers && <UserManagement />}
      {analyticsFeatures.map(feature => (
        <AnalyticsFeature key={feature.id} feature={feature} />
      ))}
    </div>
  );
}
```

## 🔍 Debugging & Utilities

### Debug in Console

```javascript
// In browser console
window.featureFlagUtils.debug();     // Full debug info
window.featureFlagUtils.report();   // Role-based report
window.featureFlagUtils.stats();    // Statistics
```

### Programmatic Access

```javascript
import { 
  generateFeatureFlagReport, 
  validateFeatureFlags,
  getFeatureFlagStatistics 
} from '@utils/featureFlagUtils';

// Get report for all roles
const report = generateFeatureFlagReport();

// Validate configuration
const errors = validateFeatureFlags();

// Get statistics
const stats = getFeatureFlagStatistics();
```

## 📋 Best Practices

### 1. Naming Convention
- Use `UPPER_SNAKE_CASE` for feature IDs
- Be descriptive and specific
- Group related features with prefixes

```javascript
// Good
QR_SCANNER_ACCESS
STUDENT_DASHBOARD_VIEW
ADMIN_USER_MANAGEMENT

// Avoid
FEATURE1
TEMP
SCAN
```

### 2. Category Organization
- Group features by functional area
- Use consistent category names

```javascript
categories: ['qr_scanner', 'analytics', 'attendance', 'user_management']
```

### 3. Default Values
- Set sensible defaults
- Consider security implications
- Default to `false` for sensitive features

### 4. Role Assignment
- Follow principle of least privilege
- Start with minimal access, expand as needed
- Document role requirements

## 🔄 Dynamic Configuration

For production environments, you might want to load feature flags from a backend:

```javascript
// Example: Load from API
const loadFeatureFlagsFromAPI = async () => {
  try {
    const response = await fetch('/api/feature-flags');
    const flags = await response.json();
    
    // Merge with default flags
    Object.assign(FEATURE_FLAGS, flags);
  } catch (error) {
    console.error('Failed to load feature flags:', error);
  }
};
```

## 🧪 Testing

### Testing Feature Flags

```javascript
import { render, screen } from '@testing-library/react';
import { FeatureFlagWrapper } from '@ui/FeatureFlagWrapper';

// Mock the hook
jest.mock('@hooks/useFeatureFlags', () => ({
  useFeatureFlags: () => ({
    isEnabled: () => true, // or false for testing disabled state
    loading: false
  })
}));

test('shows component when feature is enabled', () => {
  render(
    <FeatureFlagWrapper featureId="TEST_FEATURE">
      <div>Test Content</div>
    </FeatureFlagWrapper>
  );
  
  expect(screen.getByText('Test Content')).toBeInTheDocument();
});
```

## 🚨 Troubleshooting

### Common Issues

1. **Feature not working:**
   - Check if feature ID matches exactly
   - Verify user role is correct
   - Check console for validation errors

2. **Component not showing:**
   - Ensure feature flag exists
   - Check if user role is in enabledForRoles
   - Verify hook is not in loading state

3. **Performance issues:**
   - Feature flags are memoized
   - Avoid complex logic in feature checks
   - Use wrapper components for clean separation

### Debug Commands

```javascript
// Check all feature flags
console.log('All flags:', window.featureFlagUtils.debug());

// Check specific role
console.log('Admin features:', window.featureFlagUtils.report().admin.enabled);

// Validate configuration
console.log('Errors:', window.featureFlagUtils.validate());
```

## 📚 Examples

See `featureFlagExamples.js` for complete examples and patterns.

## 🤝 Contributing

When adding new feature flags:
1. Update this README
2. Add examples to `featureFlagExamples.js`
3. Test with different user roles
4. Document the purpose and usage

---

**Remember:** Feature flags should be used for controlling access based on roles, not for A/B testing or feature toggles in production. For those use cases, consider a more sophisticated feature management system.
