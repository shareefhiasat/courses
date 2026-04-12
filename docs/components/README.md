# 🧩 Components & Utilities Documentation

> **UI components, feature flags, and utilities for Military LMS**
>
> **Docusaurus Source of Truth for Components**

---

## 📁 **Components Resources**

### **🎨 UI Components**
- **[components-filters.md](./components-filters.md)** - Filter components documentation

### **🚩 Feature Management**
- **[feature-flags.md](./feature-flags.md)** - Feature flag system

### **🛠️ Utilities**
- **[utils.md](./utils.md)** - Utility functions

---

## 🎯 **Components Overview**

### **UI Components**
- **Filter Components**: Reusable filtering components for data tables
- **Form Components**: Input validation and form handling
- **Layout Components**: Page layouts and responsive design
- **Navigation Components**: Menu and navigation elements

### **Feature Flags**
- **Environment-based**: Development vs production features
- **User-based**: Role-based feature access
- **Dynamic**: Runtime feature toggling

### **Utilities**
- **Data Processing**: Helper functions for data manipulation
- **Validation**: Form and input validation utilities
- **Formatting**: Date, number, and text formatting
- **API Helpers**: GraphQL and API request utilities

---

## 🔧 **Component Development**

### **Component Structure**
```
src/components/
├── ui/                          # Basic UI components
│   ├── Button/
│   ├── Input/
│   └── Modal/
├── common/                      # Shared components
│   ├── Layout/
│   ├── Navigation/
│   └── Sidebar/
├── filters/                     # Filter components
│   ├── ProgramFilter/
│   ├── SubjectFilter/
│   └── ClassFilter/
└── business/                    # Business logic components
    ├── Dashboard/
    ├── Reports/
    └── Analytics/
```

### **Component Guidelines**
- **TypeScript**: All components must have TypeScript interfaces
- **Responsive**: Mobile-first design with breakpoints
- **Accessibility**: WCAG 2.1 AA compliance
- **Testing**: Unit tests for all components
- **Documentation**: README for complex components

---

## 🚩 **Feature Flags**

### **Flag Types**
```typescript
// Environment flags
const FEATURE_FLAGS = {
  DEVELOPMENT_MODE: process.env.NODE_ENV === 'development',
  ENABLE_ANALYTICS: process.env.VITE_ENABLE_ANALYTICS === 'true',
  ENABLE_DEBUG: process.env.VITE_ENABLE_DEBUG === 'true'
};

// User-based flags
const USER_FEATURES = {
  ADMIN_DASHBOARD: user.roles.includes('admin'),
  HR_FEATURES: user.roles.includes('hr'),
  INSTRUCTOR_TOOLS: user.roles.includes('instructor')
};
```

### **Usage Examples**
```typescript
// In components
{FEATURE_FLAGS.DEVELOPMENT_MODE && <DebugPanel />}
{USER_FEATURES.ADMIN_DASHBOARD && <AdminDashboard />}

// In routes
{FEATURE_FLAGS.ENABLE_ANALYTICS && <AnalyticsRoute />}
```

---

## 🛠️ **Utilities**

### **Data Processing**
```typescript
// Date utilities
formatDate(date: Date): string
isDateValid(date: Date): boolean
getRelativeTime(date: Date): string

// String utilities
truncateText(text: string, length: number): string
capitalizeFirst(text: string): string
slugify(text: string): string
```

### **Validation**
```typescript
// Form validation
validateEmail(email: string): boolean
validatePassword(password: string): ValidationResult
validateRequired(value: any): boolean
```

### **API Helpers**
```typescript
// GraphQL utilities
executeQuery(query: string, variables: any): Promise<any>
handleGraphQLError(error: any): void
cacheResponse(key: string, data: any): void
```

---

## 📋 **Component Checklist**

### **New Components**
- [ ] TypeScript interface defined
- [ ] Responsive design implemented
- [ ] Accessibility features added
- [ ] Unit tests written
- [ ] Documentation created
- [ ] Storybook story added

### **Feature Flags**
- [ ] Flag defined in constants
- [ ] Environment variable configured
- [ ] Usage documented
- [ ] Test coverage added

### **Utilities**
- [ ] Function documented with JSDoc
- [ ] Unit tests written
- [ ] Error handling implemented
- [ ] TypeScript types defined

---

## 🚨 **Troubleshooting**

### **Component Issues**
```bash
# Check component props
console.log(componentProps);

# Check component state
console.log(componentState);

# Debug rendering
React DevTools
```

### **Feature Flag Issues**
```bash
# Check environment variables
console.log(process.env.VITE_ENABLE_ANALYTICS);

# Check user roles
console.log(user.roles);
```

### **Utility Issues**
```bash
# Test utility functions
node -e "console.log(require('./utils').formatDate(new Date()))"
```

---

## 📞 **Support**

### **Getting Help**
1. Check component documentation
2. Review utility function JSDoc
3. Check feature flag configuration
4. Test with different user roles
5. Verify environment variables

---

*Last Updated: 2026-03-21*
*Docusaurus Source of Truth for Components*
