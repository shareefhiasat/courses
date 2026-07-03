# Phase 1 Implementation Plan - PostgreSQL Migration

## 🎯 Objective
Migrate core LMS entities to PostgreSQL backend with complete CRUD operations, unit tests, and E2E Playwright tests with Allure reporting.

## 📋 Phase 1 Entities (Priority Order)

### 1. **Programs** (Super Admin Only)
- CRUD: Create, Read, Update, Delete
- Business Service: `programService.js`
- DB Service: `programDbService-postgres.cjs`
- Page: `ProgramsPage.jsx`

### 2. **Subjects** (Admin/Instructor/Super Admin)
- CRUD: Create, Read, Update, Delete
- Business Service: `subjectService.js`
- DB Service: `subjectDbService-postgres.cjs`
- Page: `SubjectsPage.jsx`

### 3. **Classes** (Admin/Instructor/Super Admin)
- CRUD: Create, Read, Update, Delete
- Business Service: `classService.js`
- DB Service: `classDbService-postgres.cjs`
- Page: `ClassesPage.jsx`

### 4. **Activities** (All Users)
- CRUD: Create, Read, Update, Delete
- Business Service: `activitiesService.js`
- DB Service: `activityDbService-postgres.cjs`
- Page: `ActivitiesPage.jsx`

### 5. **Announcements** (Admin/Instructor)
- CRUD: Create, Read, Update, Delete
- Business Service: `announcementService.js`
- DB Service: `announcementDbService-postgres.cjs`
- Page: `AnnouncementsPage.jsx`

### 6. **Resources** (Admin/Instructor)
- CRUD: Create, Read, Update, Delete
- Business Service: `resourceService.js`
- DB Service: `resourceDbService-postgres.cjs`
- Page: `ResourcesPage.jsx`

---

## 🔧 Implementation Checklist Per Entity

### For Each Entity:

#### ✅ Business Service Layer
- [ ] Create/verify `{entity}Service.js` in `client/src/services/business/`
- [ ] Implement CRUD operations:
  - `get{Entity}s()` - List all
  - `get{Entity}ById(id)` - Get single
  - `create{Entity}(data)` - Create new
  - `update{Entity}(id, data)` - Update existing
  - `delete{Entity}(id)` - Delete
- [ ] Add proper error handling and logging
- [ ] Return standardized response format: `{ success, data, error }`

#### ✅ Database Service Integration
- [ ] Verify PostgreSQL DB service exists: `{entity}DbService-postgres.cjs`
- [ ] Ensure proper import/export from business service
- [ ] Handle CommonJS/ESM compatibility

#### ✅ Unit Tests
- [ ] Create test file: `client/src/services/business/__tests__/{entity}Service.test.js`
- [ ] Test all CRUD operations
- [ ] Test error handling
- [ ] Mock database calls
- [ ] Achieve >80% code coverage

#### ✅ E2E Playwright Tests
- [ ] Create test file: `tests/e2e/{entity}.spec.js`
- [ ] Test Create flow
- [ ] Test Read/List flow
- [ ] Test Update flow
- [ ] Test Delete flow
- [ ] Add Allure reporting annotations
- [ ] Test role-based access control

#### ✅ Page Component Verification
- [ ] Verify page exists and renders
- [ ] Ensure proper service integration
- [ ] Test loading states
- [ ] Test error states
- [ ] Verify CRUD UI works

---

## 🧪 Testing Strategy

### Unit Tests (Vitest)
```bash
cd client
pnpm test -- {entity}Service.test.js
```

### E2E Tests (Playwright + Allure)
```bash
cd tests
pnpm playwright test {entity}.spec.js
pnpm allure generate --clean
pnpm allure open
```

---

## 📦 Deferred to Phase 2

- Users Management
- Allowlist
- Email Templates
- Notification Logs
- Scheduled Reports
- Enrollments
- Marks Entry
- Class Schedules
- Penalties
- Participation
- Behavior
- Categories
- Activity Logs
- Analytics Dashboard

---

## 🎯 Success Criteria

1. ✅ All Phase 1 entities have working CRUD operations
2. ✅ All business services properly integrate with PostgreSQL
3. ✅ Unit test coverage >80% for all services
4. ✅ E2E tests pass for all CRUD flows
5. ✅ Allure reports generated successfully
6. ✅ No import errors or runtime errors
7. ✅ Role-based access control working
8. ✅ Dashboard loads without errors
9. ✅ All Phase 1 pages render correctly
10. ✅ Clean, optimized code with no duplicates

---

## 📝 Notes

- Follow LMS workspace constitution rules
- Use logical properties for RTL support
- Implement proper error handling
- Add loading states for all async operations
- Use memoization for performance
- Follow existing code patterns
- Clean up any duplicate or unnecessary files
