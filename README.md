# Military LMS - Offline Learning Management System

## 🎯 Migration Overview

Transform the Firebase-based LMS QAF system into a **100% air-gapped Windows environment** for military students. This monolithic application will run on Windows Server/Windows 10, using PostgreSQL for data storage, Keycloak for authentication, and maintaining all existing functionality including the unique **"Officer Stamp" approval system**.

### Architecture Overview
```
┌─────────────────────────────────────────────────────────────┐
│                    AIR-GAPPED WINDOWS SERVER                  │
├─────────────────────────────────────────────────────────────┤
│  Monolithic Application (Node.js + React)                   │
│  ├── Frontend: React SPA (Port 3000)                        │
│  ├── Backend: Express API (Port 5000)                       │
│  ├── Auth: Keycloak Integration (Port 8080)                 │
│  ├── Database: PostgreSQL (Port 5432)                      │
│  ├── Storage: MinIO (Port 9000/9001)                        │
│  ├── Reports: Jasper Server (Port 8081)                     │
│  ├── Logging: ELK Stack (Ports 9200/5601)                  │
│  └── Email: MailDev (Port 1080/1025)                       │
└─────────────────────────────────────────────────────────────┘
```

### Existing System Analysis
Based on current codebase analysis, the system uses **67 collections** organized into:

#### Core Collections
- **Users**: `users`, `userAuth`
- **Academic**: `programs`, `courses`, `subjects`, `classes`, `categories`
- **Enrollment**: `enrollments`, `subjectEnrollments`, `studentProgress`
- **Quizzes**: `quizzes`, `quizSubmissions`, `quizResults`, `questionBank`, `submissions`
- **Attendance**: `attendance`, `attendanceSessions`
- **Communication**: `chatRooms`, `chatMessages`, `directRooms`
- **Activities**: `activities`, `activityLog`
- **Resources**: `resources`, `emailTemplates`
- **Behavior**: `behaviors`, `penalties`, `gamification`, `participations`
- **Misc**: `bookmarks`, `announcements`, `schedule`, `notifications`

#### Extensive Enum Usage
The system heavily uses enums for type safety:
- **Attendance Types**: 6 regular + 4 standup types
- **Behavior Types**: Multiple behavior categories
- **Participation Types**: Various participation modes
- **Penalty Types**: Different penalty classifications
- **Status Enums**: Comprehensive status management
- **Record Types**: Unified record type system

### Migration Strategy
- **Enum-heavy approach**: Maintain existing enum patterns in PostgreSQL
- **No lookup tables**: Use PostgreSQL native enums for performance
- **Direct mapping**: 1:1 collection to table mapping where possible
- **Type safety**: Preserve existing type system with Prisma enums

---

## 🚀 Quick Start (Development)

### Prerequisites
- Docker Desktop
- Node.js 18+
- Git

### Setup Development Environment
```bash
# Clone repository
git clone <repository-url>
cd courses

# Start all services
./scripts/dev-start.sh  # Linux/Mac
# or
./scripts/dev-start.ps1  # Windows PowerShell

# Access services
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# Keycloak Admin: http://localhost:8080/admin
# MinIO Console: http://localhost:9001
# Kibana: http://localhost:5601
# MailDev: http://localhost:1080
```

### Default Credentials

#### Development Services
- **Keycloak Admin**: admin / admin123
- **MinIO**: minioadmin / minioadmin
- **MongoDB**: admin / admin123
- **Redis**: (no auth - uses password `redis123` for connections)

#### Application Users (Seeded)
- **System Admin**: admin@military.lms / admin123
- **Instructor**: instructor@military.lms / instructor123
- **HR**: hr@military.lms / hr123
- **Students**: student1@military.lms / student123, student2@military.lms / student123, etc. (student1-10)

#### Service URLs
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Keycloak Admin**: http://localhost:8080/admin
- **MinIO Console**: http://localhost:9001
- **Kibana**: http://localhost:5601
- **MailDev**: http://localhost:1080

---

## 📊 Database Schema

### MongoDB Collections (Exact Firebase Structure)

The MongoDB database uses the exact same structure as your Firebase collections, making migration seamless:

#### Core Collections
- **users** - User profiles with Firebase fields (displayName, realName, role, status, isAdmin, isHR, isInstructor, isStudent, isSuperAdmin, isDisabled, order, enrolledClasses, etc.)
- **programs** - Training programs
- **courses** - Course catalog with bilingual fields (name/nameAr, description/descriptionAr)
- **subjects** - Subject management with bilingual support
- **classes** - Class sessions with JSON schedule object
- **enrollments** - Student enrollment tracking
- **attendance** - Attendance records with all Firebase fields (date, time, status, method, notes, markedBy, performedBy, studentInfo, etc.)
- **quizzes** - Quiz management with bilingual titles
- **questions** - Quiz questions with bilingual content
- **quizSubmissions** - Student quiz submissions
- **resources** - File/resource management
- **notifications** - User notifications with bilingual titles/messages

#### Activity & Logging Collections
- **activities** - User activity tracking (USER_ENABLED, etc.)
- **activityLogs** - Detailed activity logs with user agent, URLs, etc.
- **announcements** - System announcements with bilingual content
- **behaviors** - Behavior tracking system
- **categories** - Resource categories with bilingual names

#### Supporting Collections
- **directRooms** - Chat rooms
- **emailTemplates** - Email templates
- **emails** - Email logs
- **files** - File management
- **notificationLogs** - Notification delivery logs
- **participations** - Class participation tracking
- **penalties** - Penalty management

### Key Features
- **Exact Firebase field names** - No field mapping needed
- **Bilingual support** - name/nameAr, description/descriptionAr, title/titleAr, content/contentAr, message/messageAr
- **JSON schedules** - Flexible schedule objects stored as JSON
- **Firebase timestamps** - Using Date objects for createdAt, updatedAt, etc.
- **Boolean flags** - isAdmin, isHR, isInstructor, isStudent, isSuperAdmin, isDisabled
- **Array fields** - enrolledClasses, tags, holidays, etc.

### Migration Benefits
- **Zero field mapping** - Use existing Firebase export/import
- **Bilingual data preserved** - Arabic and English fields maintained
- **Flexible schemas** - No rigid table constraints
- **JSON compatibility** - Complex objects like schedules work naturally
- **Query compatibility** - Similar query patterns to Firebase

---

## 📚 Development Guidelines
- **Foreign Keys**: Proper referential integrity
- **Triggers**: Auto-updated timestamps
- **Indexes**: Performance optimization

---

## 🎯 Military-Specific Features

### Officer Stamp System
- **Digital Stamps**: Base64 encoded officer signatures
- **Approval Workflow**: Stamp-based report approval
- **Audit Trail**: Complete stamp usage logging
- **Security**: Stamp validation and authorization

### Role-Based Access Control
- **SUPERADMIN**: System administration
- **ADMIN**: User management, system configuration
- **HR**: Personnel management, reporting
- **INSTRUCTOR**: Class management, grading
- **STUDENT**: Learning activities, submissions

### Military Fields
- **Rank**: Military rank hierarchy
- **Unit**: Unit/department assignments
- **Clearance Level**: Security clearance tracking
- **Student Numbers**: Military-style identification

---

## 🐳 Docker Services

### Development Stack
```yaml
services:
  frontend:     # React SPA (Port 3000)
  backend:      # Node.js API (Port 5000)
  postgres:     # PostgreSQL (Port 5432)
  keycloak:     # Authentication (Port 8080)
  minio:        # File storage (Port 9000/9001)
  redis:        # Caching (Port 6379)
  elasticsearch: # Search & logging (Port 9200)
  logstash:     # Log processing (Port 5044)
  kibana:       # Log visualization (Port 5601)
  maildev:      # Email testing (Port 1080/1025)
  jasper:       # Report generation (Port 8081)
```

### Service Integration
- **Keycloak**: SSO authentication with military roles
- **MinIO**: Secure file storage with access controls
- **Redis**: Session management and caching
- **ELK Stack**: Centralized logging and monitoring
- **MailDev**: Development email testing
- **Jasper**: Advanced report generation

### Updated Docker Images (Stable Versions)
- **MongoDB**: `mongo:7.0` (Latest stable)
- **Keycloak**: `quay.io/keycloak/keycloak:26.0` (Compatible with Windows 26.0.0 binary)
- **Redis**: `redis:7-alpine` (Compatible with Windows 7.2.4)
- **Elasticsearch**: `docker.elastic.co/elasticsearch/elasticsearch:8.15.0` (Latest stable)
- **Logstash**: `docker.elastic.co/logstash/logstash:8.15.0` (Latest stable)
- **Kibana**: `docker.elastic.co/kibana/kibana:8.15.0` (Latest stable)

### Note on Database Choice
MongoDB with Prisma ORM was chosen because it provides the best of both worlds:
- **Firebase-like flexibility** - Document structure matches your Firebase collections exactly
- **Type safety** - Prisma generates TypeScript types for all collections
- **Migration support** - Prisma handles schema changes automatically
- **Zero field mapping** - Use existing Firebase export/import directly
- **Bilingual support** - name/nameAr, description/descriptionAr fields work naturally
- **JSON schedules** - Flexible objects stored as JSON (no relation mapping needed)

### Migration Benefits
- **Zero field mapping** - Use existing Firebase export/import
- **Bilingual data preserved** - Arabic and English fields maintained
- **Flexible schemas** - No rigid table constraints
- **JSON compatibility** - Complex objects like schedules work naturally
- **Query compatibility** - Similar query patterns to Firebase
- **Type safety** - Full TypeScript support with Prisma
- **Migration support** - Automatic schema changes with Prisma

### Windows Binary Stack (Air-Gapped Deployment)
| Component | Version | Binary Type | Notes |
|-----------|---------|-------------|-------|
| **MongoDB** | 7.0 | Windows x64 | Community Edition |
| **Keycloak** | 26.0.0 | Zip/JVM | Quarkus distribution |
| **Java (JDK)** | Temurin 21 | .msi | LTS version for Keycloak & Jasper |
| **JasperReports** | 9.0.0 | Windows Installer | Community Edition with bundled Tomcat |
| **MinIO** | Latest | Single .exe | Perfect for air-gapped storage |
| **Redis** | 7.2.4 | Port/Community | tporadowski port or Memurai |
| **MailDev** | 2.x.x | Node-based | Install via npm, copy node_modules |

---

## 📚 Development Guidelines

### Architecture Principles
- **Service Layer**: Business logic in `/services/business/`
- **Database Layer**: Data access in `/services/db/`
- **UI Components**: Pure React components with hooks
- **Type Safety**: TypeScript throughout
- **Enum Usage**: Extensive enum-based type safety

### File Organization
```
server/
├── src/
│   ├── controllers/     # API controllers
│   ├── services/
│   │   ├── business/    # Business logic
│   │   ├── db/         # Database operations
│   │   └── auth/       # Authentication
│   ├── middleware/      # Express middleware
│   ├── utils/          # Utilities
│   └── types/          # TypeScript types
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.js         # Database seeding
└── Dockerfile.dev      # Development container

client/
├── src/
│   ├── components/     # Reusable UI
│   ├── pages/          # Page components
│   ├── hooks/          # Custom hooks
│   ├── services/       # API services
│   ├── utils/          # Utilities
│   └── types/          # TypeScript types
└── Dockerfile.dev      # Development container
```

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Enforced code quality
- **Prettier**: Consistent formatting
- **Prisma**: Type-safe database access
- **Testing**: Jest for unit tests

---

## 🔒 Security Features

### Authentication & Authorization
- **Keycloak Integration**: Enterprise SSO
- **JWT Tokens**: Secure session management
- **Role-Based Access**: Granular permissions
- **Password Security**: Bcrypt hashing
- **Session Management**: Redis-based sessions

### Data Protection
- **Input Validation**: Joi validation schemas
- **SQL Injection Prevention**: Prisma ORM
- **XSS Protection**: Helmet.js middleware
- **Rate Limiting**: Express rate limiting
- **Audit Logging**: Complete activity tracking

### File Security
- **Access Controls**: Role-based file access
- **File Validation**: Type and size restrictions
- **Secure Storage**: MinIO with encryption
- **Audit Trail**: File access logging

---

## 📈 Performance Optimization

### Database Optimization
- **Indexes**: Strategic indexing for performance
- **Connection Pooling**: Efficient database connections
- **Query Optimization**: Prisma query optimization
- **Caching**: Redis-based caching layer

### Frontend Performance
- **Code Splitting**: Route-based lazy loading
- **Memoization**: React performance patterns
- **Virtualization**: Large list optimization
- **Bundle Optimization**: Webpack optimization

### Infrastructure Performance
- **Container Optimization**: Efficient Docker images
- **Load Balancing**: Service distribution
- **Monitoring**: ELK stack monitoring
- **Health Checks**: Service health monitoring

---

## 🚀 Deployment

### Development Environment
```bash
# Start development
./scripts/dev-start.sh

# Stop services
docker-compose -f docker-compose.dev.yml down

# Reset database
docker-compose -f docker-compose.dev.yml down -v
./scripts/dev-start.sh
```

### Production Deployment
- **Windows Server**: Air-gapped deployment
- **Docker Compose**: Production configuration
- **Database Backup**: Automated PostgreSQL backups
- **Monitoring**: ELK stack monitoring
- **Security**: Windows security hardening

---

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Token refresh
- `GET /api/auth/profile` - User profile

### Core Endpoints
- `GET /api/users` - User management
- `GET /api/classes` - Class management
- `GET /api/attendance` - Attendance tracking
- `GET /api/reports` - Report generation
- `GET /api/notifications` - Notification system

### Documentation
- **Swagger**: API documentation available
- **Postman**: Collection for testing
- **Type Safety**: TypeScript interfaces

---

## 🧪 Testing

### Test Types
- **Unit Tests**: Jest for business logic
- **Integration Tests**: API endpoint testing
- **Database Tests**: Prisma testing
- **E2E Tests**: Playwright for UI testing

### Test Commands
```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

---

## 📞 Support

### Documentation
- **Internal**: `docs/` directory
- **API**: Swagger documentation
- **Database**: Schema documentation
- **Deployment**: Setup guides

### Contact
- **Development Team**: Internal channels
- **Technical Support**: Help desk system
- **Security Issues**: Security team

---

## 📄 License

This project is proprietary to the Military Training Division and is not open source.

---

## 🔧 Environment Configuration

### Required Environment Variables
See `server/.env.example` for complete configuration:
- Database connection strings
- Authentication settings
- File storage configuration
- Email service settings
- Security keys and secrets

### Docker Environment
All services configured in `docker-compose.dev.yml` with proper networking and volume management.

---

## 📋 Migration Checklist & TODO

### Phase 1: Binary Preparation (Sneakernet Checklist)

### Required Downloads (Internet-Enabled Machine)

| Component | Target File | Size | Purpose |
|-----------|-------------|------|---------|
| **PostgreSQL** | `postgresql-17.2-1-windows-x64.exe` | ~300MB | EDB installer for Windows Service |
| **Keycloak** | `keycloak-26.0.0.zip` | ~300MB | Quarkus distribution for authentication |
| **Java JDK** | `Temurin-21-jdk-x64_windows.msi` | ~200MB | LTS runtime for Keycloak & Jasper |
| **JasperReports** | `jasperreports-server-9.0.0-windows-x64.exe` | ~500MB | Community Edition reporting |
| **Jaspersoft Studio** | `jaspersoft-studio-9.0.0-windows-x64.exe` | ~400MB | Report template designer |
| **MinIO** | `minio.exe` | ~100MB | Object storage server |
| **Redis** | `Redis-x64-7.2.4.msi` or `memurai-4.0.1.msi` | ~50MB | Caching server |
| **MailDev** | `maildev` (npm package) | ~10MB | Email testing |

### Binary Compatibility Notes
- **PostgreSQL 17.2**: Full 1:1 parity with Docker version
- **Keycloak 26.0.0**: Identical Quarkus engine as Docker image
- **Java 21 LTS**: Required for both Keycloak and JasperReports
- **JasperReports 9.0.0**: Bundles Tomcat, point to manual JDK 21
- **Redis 7.2.4**: Community port (tporadowski) or Memurai for Windows
- **MinIO**: Single binary behaves identically to Docker version

### Phase 1: Development Environment ✅
- [x] Docker Compose development setup (with stable versions)
- [x] PostgreSQL schema with enums
- [x] Prisma ORM integration
- [x] Keycloak authentication
- [x] Basic API structure
- [x] Database seeding
- [x] Binary compatibility verification
### Phase 2: Core Features Development 🔄
- [ ] User authentication with Keycloak
- [ ] Officer stamp implementation
- [ ] Attendance system with QR codes
- [ ] Behavior and participation tracking
- [ ] Quiz system
- [ ] Chat and messaging
- [ ] File upload/management

### Phase 3: Advanced Features 📋
- [ ] Report generation with JasperReports 9.0.0 (Phase 3)
- [ ] Jaspersoft Studio template design
- [ ] Email notifications
- [ ] Advanced analytics
- [ ] Mobile responsiveness
- [ ] Offline capabilities
- [ ] Performance optimization

### Phase 4: Migration & Cleanup 📋
- [ ] Windows binary deployment (PostgreSQL 17.2, Keycloak 26.0.0, Java 21)
- [ ] JasperReports Server 9.0.0 installation
- [ ] Data migration from Firebase
- [ ] Firebase configuration deprecation
- [ ] Firestore rules cleanup
- [ ] Firebase functions migration
- [ ] Storage migration
- [ ] Testing and validation

### Questions for User 🤔
- **Binary Download**: Do you want me to create the download checklist for the Windows binaries?
- **Firebase Deprecation**: When should we deprecate Firebase configuration files (`firebase-config.js`, `firestore.rules`, `firestore.indexes.json`)?
- **Data Migration**: Do you want to migrate existing Firebase data or start fresh?
- **User Import**: Should we create a user import process for existing Firebase users?
- **File Migration**: How should we handle existing Firebase Storage files?
- **Reporting Requirements**: What specific reports need the officer stamp feature?
- **Deployment Environment**: Windows Server version and specifications?
- **Security Requirements**: Any additional security compliance requirements?

### Maintenance Tasks 📋
- [ ] Regular Docker image updates
- [ ] Security patch management
- [ ] Database backup procedures
- [ ] Performance monitoring setup
- [ ] User training documentation
- [ ] Disaster recovery planning

---

*This README is kept in sync with the Military LMS Migration Plan. All updates to the migration strategy should be reflected in both documents.*
