# Home Page E2E Test Data Requirements

## Overview
Home page E2E tests require specific test data to run successfully. This document outlines the data requirements and setup instructions.

## Required Test Data

### Activities (PostgreSQL)
The home page tests need activities with different types to verify filtering functionality:

1. **Homework Activity** (mapped to ASSIGNMENT type)
   - Type: `ASSIGNMENT`
   - Title: "E2E Test Homework"
   - Due date: Future date
   - Status: Active (isActive: true)

2. **Training Activity** (mapped to WORKSHOP type)
   - Type: `WORKSHOP`
   - Title: "E2E Test Training"
   - Due date: Future date
   - Status: Active (isActive: true)

3. **Lab Activity** (mapped to LAB type)
   - Type: `LAB`
   - Title: "E2E Test Lab"
   - Due date: Future date
   - Status: Active (isActive: true)

4. **Quiz Activity** (mapped to EXAM type)
   - Type: `EXAM`
   - Title: "E2E Test Quiz"
   - Due date: Future date
   - Status: Active (isActive: true)
   - Allow retake: true

### Key Attributes
All test activities should have:
- `titleEn` and `titleAr` (bilingual titles)
- `descriptionEn` and `descriptionAr` (bilingual descriptions)
- `dueDate` in ISO format (for date format testing)
- `isActive: true` (visible on home page)
- Valid `classId` and `createdBy` (foreign keys)

## Current Test Behavior

### Tests That Skip Without Data
- **Filter tests**: Skip if no activities of specific type exist
- **Bookmark tests**: Skip if no bookmark buttons visible (no activities)
- **Complete tests**: Skip if no complete buttons visible (no activities)
- **Date tests**: Skip if no due dates on activities

### Tests That Pass Without Data
- Tab navigation (tests UI structure)
- Search functionality (tests search box existence)
- Role-based access (tests authentication)
- Resources mode (tests resource page load)

## Setup Options

### Option 1: Use Home Page Test Seeder
Run the dedicated seeder script:
```bash
node backend/scripts/seed-home-page-activities.js
```

This creates 4 test activities with the required types and due dates.

### Option 2: Manual Setup via UI
1. Login as admin/superAdmin
2. Navigate to Activities page
3. Create activities with the types listed above
4. Set due dates to future dates
5. Ensure all are set to "isActive: true"

### Option 3: Restore from Backup
If you have a database backup (e.g., public4.sql):
```bash
# Drop and recreate database
docker exec -i lms-qaf-app-db psql -U military_lms -d postgres -c "DROP DATABASE military_lms;"
docker exec -i lms-qaf-app-db psql -U military_lms -d postgres -c "CREATE DATABASE military_lms;"
docker exec -i lms-qaf-app-db psql -U military_lms -d military_lms < public4.sql
```

## Test Data Structure Example

```javascript
{
  titleEn: "E2E Test Homework",
  titleAr: "واجب منزلي للاختبار",
  descriptionEn: "Sample homework for E2E testing",
  descriptionAr: "واجب منزلي تجريبي للاختبار",
  typeId: 6,  // ASSIGNMENT type ID
  dueDate: "2026-07-02T14:22:21.000Z",
  maxScore: 100,
  isActive: true,
  allowRetake: false,
  classId: 1,
  createdBy: 1
}
```

## Test File Reference

### Modular Test Files
- `home-ui-tabs.spec.js` - Tab navigation (5 tests)
- `home-ui-filters.spec.js` - Activity type filters (14 tests)
- `home-ui-bookmarks.spec.js` - Bookmark functionality (4 tests)
- `home-ui-complete.spec.js` - Mark complete functionality (4 tests)
- `home-ui-dates.spec.js` - Date format verification (3 tests)
- `home-ui-search.spec.js` - Search functionality (4 tests)
- `home-ui-access.spec.js` - Role-based access (11 tests)

### Shared Helpers
- `tests/e2e/utils/home-helpers.js` - Reusable test functions
- `tests/e2e/utils/ui-helpers.js` - General UI helpers

## Running Tests

### Run All Home Page Tests
```bash
cd client
npx playwright test tests/e2e/specs/home-ui-*.spec.js --reporter=list
```

### Run Individual Test Files
```bash
npx playwright test tests/e2e/specs/home-ui-tabs.spec.js --reporter=list
npx playwright test tests/e2e/specs/home-ui-filters.spec.js --reporter=list
# etc.
```

## Notes

- Tests are designed to skip gracefully when data is missing
- No test failures should occur due to missing data
- The date format bug was fixed in `UnifiedCard.jsx` by adding `formatDate` import
- Bookmark and complete buttons may not render due to conditional logic in the UI component
