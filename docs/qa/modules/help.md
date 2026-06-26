# Help System Module

## Business Context
The Help module provides in-app contextual help. Help items are organized by page and feature, allowing users to find guidance without leaving the application. Content is database-driven for easy updates.

## API Routes
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/api/v1/help-items` | List all | all authenticated |
| GET | `/api/v1/help-items/page/:page` | By page | all authenticated |
| GET | `/api/v1/help-items/organized` | Organized by section | all authenticated |

## UI Pages
- Help drawer/modal accessible from header

## Business Rules
- Help items organized by page/section
- Supports Arabic and English content
- All authenticated users can access help
- Admin can manage help items (via admin endpoints)
- Contextual: shows relevant help based on current page

## Test Coverage
- **API tests**: `specs/misc-api.spec.js` — 3 tests
- **Test IDs**: TC-HELP-001 through TC-HELP-003

## Known Issues
None discovered yet.

## Related Modules
- `module:lookup` — Help categories
