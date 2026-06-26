# Lookup Module

## Business Context
The Lookup module centralizes all type/enum management. Instead of hardcoded values, types are stored in the database and served via API. This includes subject types, category types, behavior types, participation types, penalty types, and resource types.

## API Routes
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/api/v1/lookup` | Multiple types (batch) | all authenticated |
| GET | `/api/v1/lookup/types` | All available type names | all authenticated |
| GET | `/api/v1/lookup/:type` | Single type | all authenticated |
| GET | `/api/v1/lookup/behavior-types` | Legacy: behavior types | all authenticated |
| GET | `/api/v1/lookup/participation-types` | Legacy: participation types | all authenticated |
| GET | `/api/v1/lookup/penalty-types` | Legacy: penalty types | all authenticated |
| GET | `/api/v1/lookup/category-types` | Legacy: category types | all authenticated |
| GET | `/api/v1/lookup/resource-types` | Legacy: resource types | all authenticated |

## UI Pages
- `/settings/lookup` — LookupManagementPage

## Business Rules
- Types are stored in database, not hardcoded
- Batch endpoint accepts `?types=type1,type2` for efficiency
- Legacy endpoints maintained for backward compatibility
- All authenticated users can read lookup types
- Only super_admin can modify (via separate admin endpoints)
- Types support Arabic and English names

## Test Coverage
- **API tests**: `specs/users-admin-api.spec.js` — 9 tests (Lookup section)
- **Test IDs**: TC-LKP-001 through TC-LKP-008

## Known Issues
None discovered yet.

## Related Modules
- `module:subjects` — Subject types
- `module:behaviors` — Behavior types
- `module:participations` — Participation types
- `module:penalties` — Penalty types
- `module:resources` — Resource types
