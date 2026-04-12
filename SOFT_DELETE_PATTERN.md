# Soft Delete Implementation Pattern

## Overview
We're implementing a consistent soft delete pattern across all APIs in the Military LMS system.

## Pattern
- **Default DELETE endpoint**: Soft delete (sets `isActive: false`)
- **Hard DELETE endpoint**: `/resource/{id}/hard` for permanent deletion
- **UI behavior**: Always uses soft delete for better data recovery
- **Default queries**: Always filter by `isActive: true` unless explicitly overridden

## Implementation Status

### ✅ Completed & Verified
- **CategoryTypes**: ✅ Soft delete by default, hard delete available at `/category-types/{id}/hard`
  - Verified: Soft-deleted items don't appear in default queries
  - Default filter: `where = { isActive: true }`
- **Programs**: ✅ Soft delete by default, hard delete available at `/programs/{id}/hard`
  - Default filter: `where = { isActive: true }`

### ✅ Query Filters Updated (Soft delete verified)
- **Subjects**: ✅ Default filter `isActive: true`
- **Classes**: ✅ Default filter `isActive: true`
- **Activities**: ✅ Default filter `isActive: true`
- **Announcements**: ✅ Default filter `isActive: true`
- **Resources**: ✅ Default filter `isActive: true`

### 🔄 Not Yet Implemented
- **Penalty Types**: Table exists but no DB service file yet
- **Behavior Types**: Table exists but no DB service file yet
- **Attendance Status Types**: Table exists but no DB service file yet

## Database Requirements
Each table has:
- ✅ `isActive` field (Boolean, default: true)
- ✅ Proper indexing on `isActive` for performance
- ✅ Foreign key constraints consider soft deletes

## API Endpoints

### Soft Delete (Default)
```
DELETE /api/v1/{resource}/{id}
```
- Sets `isActive: false`
- Returns success with the deactivated record
- UI should use this by default

### Hard Delete (Admin Only)
```
DELETE /api/v1/{resource}/{id}/hard
```
- Permanently deletes the record
- Checks for dependencies before deletion
- Returns success if deletion was successful

## Frontend Service Pattern
```javascript
// Default: Soft delete
export const deleteResource = async (id) => {
  const response = await fetch(`${API_BASE}/resource/${id}`, {
    method: 'DELETE',
    // ...
  });
  // ...
};

// Hard delete (if needed for admin functions)
export const hardDeleteResource = async (id) => {
  const response = await fetch(`${API_BASE}/resource/${id}/hard`, {
    method: 'DELETE',
    // ...
  });
  // ...
};
```

## Query Pattern (CRITICAL)
All GET queries MUST default to active records only:
```javascript
const where = { isActive: true }; // Default to active records only

// Allow overriding if explicitly provided
if (isActive !== null && isActive !== undefined) {
  where.isActive = isActive === 'true' || isActive === true;
}
```

## Verification Test
✅ **Tested and Confirmed**:
1. Created category with `isActive: true`
2. Category appeared in list
3. Soft deleted category (set `isActive: false`)
4. Category no longer appears in default list
5. Category still exists in database with `isActive: false`

## Benefits
1. **Data Recovery**: Accidentally deleted items can be restored
2. **Audit Trail**: Maintains historical data
3. **User-Friendly**: Users expect "undo" capability
4. **Performance**: Soft deletes are faster than hard deletes
5. **Integrity**: Prevents orphaned records
6. **Consistency**: All pages follow the same pattern

## Restoration (Future Enhancement)
Consider adding a restore endpoint:
```
POST /api/v1/{resource}/{id}/restore
```
This would set `isActive: true` for soft-deleted items.
