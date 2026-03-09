# Migration Plan: Services from Firestore to MongoDB/Prisma

## ✅ Completed

### Activity Service
- **Status**: ✅ Migrated
- **Files**: 
  - `client/src/services/db/activitiesDbService-mongodb.js` (New MongoDB version)
  - `client/src/services/db/activitiesDbService.js` (Original Firestore version)
- **Schema**: Activity model defined in Prisma schema
- **Next Step**: Replace imports in business layer

## 🔄 In Progress

### User Service
- **Status**: 🔄 Planning
- **Collections**: `users`, `userAuth`
- **Priority**: High (authentication depends on this)

## 📋 Planned Migration Order

### Phase 1: Core Services (High Priority)
1. **User Service** - User management, authentication
2. **Announcement Service** - Communication system
3. **Resource Service** - File management

### Phase 2: Academic Services (Medium Priority)
4. **Enrollment Service** - Student enrollments
5. **Academic Structure** - Programs, Classes, Subjects
6. **Attendance Service** - Attendance tracking

### Phase 3: Advanced Services (Low Priority)
7. **Quiz Service** - Quizzes and assessments
8. **Behavior Service** - Behavior tracking
9. **Chat Service** - Communication
10. **Notification Service** - Notification system

### Phase 4: Supporting Services
11. **Configuration Service** - System configuration
12. **Logging Service** - Activity logs
13. **Analytics Service** - Reports and analytics

## 🎯 Migration Strategy

### For Each Service:

#### Step 1: Schema Definition
```prisma
model ServiceName {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  // ... fields
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### Step 2: Database Service Migration
```javascript
// Before (Firestore)
import dbService from '@services/other/dbService';

// After (MongoDB/Prisma)
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
```

#### Step 3: Business Layer Update
```javascript
// Update imports in business service
import { getActivities } from '../db/activitiesDbService-mongodb';
```

#### Step 4: Testing
- Unit tests for database operations
- Integration tests with business layer
- E2E tests with UI components

#### Step 5: Cleanup
- Remove old Firestore service files
- Update imports throughout codebase
- Update documentation

## 📊 Service Complexity Analysis

### Simple Services (1-2 days each)
- Activity Service ✅
- Announcement Service
- Resource Service
- Configuration Service

### Medium Services (3-5 days each)
- User Service
- Enrollment Service
- Academic Structure
- Attendance Service

### Complex Services (1-2 weeks each)
- Quiz Service
- Behavior Service
- Chat Service
- Notification Service
- Analytics Service

## 🛠️ Tools and Scripts

### Migration Helper Script
```javascript
// scripts/migrate-service.js
const migrateService = (serviceName) => {
  // 1. Generate Prisma schema
  // 2. Create database service
  // 3. Update business layer imports
  // 4. Run tests
  // 5. Cleanup old files
};
```

### Data Migration Script
```javascript
// scripts/migrate-data.js
const migrateData = async (fromCollection, toModel) => {
  // 1. Export data from Firestore
  // 2. Transform data format
  // 3. Import to MongoDB
  // 4. Validate data integrity
};
```

## 📈 Timeline Estimate

- **Phase 1**: 2-3 weeks
- **Phase 2**: 3-4 weeks  
- **Phase 3**: 4-6 weeks
- **Phase 4**: 1-2 weeks

**Total Estimated Time**: 10-15 weeks

## 🎯 Success Criteria

### Technical Criteria
- ✅ All services migrated to MongoDB/Prisma
- ✅ No Firestore dependencies remaining
- ✅ All tests passing
- ✅ Performance maintained or improved

### Functional Criteria
- ✅ All existing features working
- ✅ No data loss during migration
- ✅ UI/UX unchanged
- ✅ Authentication and authorization working

### Operational Criteria
- ✅ Infrastructure simplified
- ✅ Development workflow improved
- ✅ Deployment process streamlined
- ✅ Monitoring and logging in place

## 🚀 Next Steps

1. **Complete Activity Service Migration**
   - Replace imports in activityService.js
   - Test thoroughly
   - Remove old files

2. **Start User Service Migration**
   - Define User schema
   - Create userDbService-mongodb.js
   - Migrate authentication logic

3. **Setup CI/CD for Migration**
   - Automated testing for each migrated service
   - Data validation checks
   - Rollback procedures

**This migration plan provides a clear path from Firestore to MongoDB while maintaining system stability and functionality.**
