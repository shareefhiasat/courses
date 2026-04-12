# Lookup System Migration Guide

## Overview

This guide explains how to migrate from hardcoded lookup constants to the unified lookup system that serves as the **SINGLE SOURCE OF TRUTH** for all lookup data.

## Why Migrate?

### Before (Problems)
- ❌ Hardcoded constants in multiple files
- ❌ Inconsistent data across components
- ❌ Manual updates required in multiple places
- ❌ No centralized management
- ❌ Difficult to add new types

### After (Benefits)
- ✅ **Single source of truth** - Database is authoritative
- ✅ Consistent data across all components
- ✅ Easy to add new lookup types
- ✅ Centralized management
- ✅ Flexible querying with filters
- ✅ Performance optimized with caching

## New Lookup System Architecture

```
Components → useLookupTypes Hook → Lookup API → Database
                                    ↓
                          SINGLE SOURCE OF TRUTH
```

## API Endpoints

### Generic Endpoints (Recommended)

#### Get Single Lookup Type
```http
GET /api/v1/lookup/{type}
```

**Examples:**
```http
GET /api/v1/lookup/behavior-types
GET /api/v1/lookup/subject-types
GET /api/v1/lookup/user-roles
```

**Query Parameters:**
- `activeOnly`: boolean (default: true)
- `fields`: string (comma-separated field names)
- `orderBy`: string (field:direction)

#### Get Multiple Lookup Types
```http
GET /api/v1/lookup?types={type1,type2,type3}
```

**Examples:**
```http
GET /api/v1/lookup?types=behavior-types,participation-types,penalty-types
GET /api/v1/lookup?types=subject-types,category-types&fields=id,nameEn
```

#### Get Available Lookup Types (Metadata)
```http
GET /api/v1/lookup/types
```

### Legacy Endpoints (Deprecated)
```http
GET /api/v1/lookup/behavior-types      # Use GET /api/v1/lookup/behavior-types instead
GET /api/v1/lookup/participation-types # Use GET /api/v1/lookup/participation-types instead
GET /api/v1/lookup/penalty-types      # Use GET /api/v1/lookup/penalty-types instead
```

## Frontend Migration

### Step 1: Replace Import Statements

**Before:**
```javascript
import { BEHAVIOR_TYPES } from '@constants/behaviorTypes.jsx';
import { PARTICIPATION_TYPES } from '@constants/participationTypes.jsx';
import { PENALTY_TYPES } from '@constants/penaltyTypes.jsx';
```

**After:**
```javascript
import { useLookupTypes } from '@hooks/useLookupTypes.js';
```

### Step 2: Use the Hook

**Before:**
```javascript
const options = [
  ...BEHAVIOR_TYPES.map(type => ({ ...type, category: 'behavior' })),
  ...PARTICIPATION_TYPES.map(type => ({ ...type, category: 'participation' })),
  ...PENALTY_TYPES.map(type => ({ ...type, category: 'penalty' }))
];
```

**After:**
```javascript
const { activityTypeOptions, loading, error } = useLookupTypes();
```

### Step 3: Handle Loading States

**Before:**
```javascript
// No loading handling
```

**After:**
```javascript
if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
```

## Hook Usage Examples

### Basic Usage
```javascript
import { useLookupTypes } from '@hooks/useLookupTypes.js';

function MyComponent() {
  const { activityTypeOptions, loading, error } = useLookupTypes();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      {activityTypeOptions.map(option => (
        <Option key={option.id} option={option} />
      ))}
    </div>
  );
}
```

### Custom Lookup Types
```javascript
// Get specific lookup types
const { data, loading } = useLookupTypes({
  types: ['subject-types', 'category-types', 'resource-types']
});

// Get with custom options
const { data, loading } = useLookupTypes({
  types: ['user-roles'],
  activeOnly: false,
  fields: ['id', 'nameEn', 'level'],
  orderBy: { field: 'level', direction: 'desc' }
});
```

### Single Lookup Type
```javascript
import { useLookupType } from '@hooks/useLookupTypes.js';

function UserRolesDropdown() {
  const { data: userRoles, loading, error } = useLookupType('user-roles');
  
  if (loading) return <div>Loading roles...</div>;
  
  return (
    <select>
      {userRoles.map(role => (
        <option key={role.id} value={role.id}>
          {role.nameEn}
        </option>
      ))}
    </select>
  );
}
```

## Available Lookup Types

| Type Key | Description | Model |
|----------|-------------|-------|
| `behavior-types` | Behavior classifications | behaviorTypes |
| `participation-types` | Participation categories | participationTypes |
| `penalty-types` | Penalty classifications | penaltyTypes |
| `subject-types` | Subject categories | subjectTypes |
| `requirement-types` | Requirement categories | requirementTypes |
| `category-types` | Content categories | categoryTypes |
| `resource-types` | Resource classifications | resourceTypes |
| `priority-types` | Priority levels | priorityTypes |
| `user-status-types` | User status values | userStatusTypes |
| `enrollment-status-types` | Enrollment status values | enrollmentStatusTypes |
| `activity-types` | Activity classifications | activityTypes |
| `attendance-status-types` | Attendance status values | attendanceStatusTypes |
| `user-roles` | User role definitions | userRoles |

## Migration Checklist

### For Each Component
- [ ] Remove hardcoded constant imports
- [ ] Add useLookupTypes hook import
- [ ] Replace constant usage with hook data
- [ ] Add loading and error handling
- [ ] Test component functionality

### For New Development
- [ ] Always use lookup hooks instead of constants
- [ ] Use specific lookup types when possible
- [ ] Handle loading states appropriately
- [ ] Use the database as source of truth

## Performance Considerations

### Caching
- Lookup data is cached at the hook level
- Multiple components using the same lookup type share data
- Refetch capability for manual updates

### Optimization
- Use specific field selection when possible
- Use `activeOnly: false` only when needed
- Consider using single lookup type hook for specific needs

## Troubleshooting

### Common Issues

**Issue:** Component shows no data
**Solution:** Check if user is authenticated and lookup types exist in database

**Issue:** Loading state never resolves
**Solution:** Check network connectivity and API endpoint availability

**Issue:** Data format is different
**Solution:** Update component to use new data structure from lookup API

### Debug Tools

```javascript
// Enable debug logging
const { data, loading, error, lookupTypes } = useLookupTypes();
console.log('Lookup types:', lookupTypes);
console.log('Fetched data:', data);
```

## Future Enhancements

### Planned Features
- Real-time updates with WebSocket
- Advanced filtering and search
- Lookup data validation
- Bulk operations for lookup management

### Deprecation Timeline
- **Phase 1:** Legacy endpoints marked as deprecated (Current)
- **Phase 2:** Legacy endpoints removed (Next major version)
- **Phase 3:** Hardcoded constants removed (Future)

## Support

For questions or issues with the lookup system:
1. Check this guide first
2. Review the API documentation
3. Check component examples
4. Contact the development team

---

**Remember:** The database is now the **SINGLE SOURCE OF TRUTH** for all lookup data. Always use the lookup system instead of hardcoded constants.
