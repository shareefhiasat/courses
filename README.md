# 🎯 Military LMS

> **PostgreSQL + Prisma Optimizer + React + Keycloak**
> 
> **Production-Ready Learning Management System**

---

## 🚀 **Quick Start**

```powershell
# Navigate to client directory
cd E:\QAF\Github\courses\client

# Start the application
pnpm start

# Access the application
http://localhost:5174

# Login credentials
Email: shareef.hiasat@gmail.com
Password: Jordan123
Role: Super Admin
Realm: master

# Keycloak Configuration
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=master
VITE_KEYCLOAK_CLIENT_ID=military-lms-app
```

---

## � **Troubleshooting**

### Nextcloud API Timeout Issues

If Nextcloud API calls (OCS/WebDAV) hang for ~25-30 seconds, this is likely due to Nextcloud's built-in Brute Force Protection or Compromised Password Check throttling the Docker gateway IP.

**Solution - Disable throttling:**

```powershell
# Disable password_policy app (does external lookups that timeout)
docker exec --user www-data lms-nextcloud php occ app:disable password_policy

# Disable brute force protection completely
docker exec --user www-data lms-nextcloud php occ config:system:set auth.bruteforce.protection.enabled --value=false --type=boolean
```

**Expected Results:**
- OCS API calls: ~871ms (was 26,000ms)
- WebDAV calls: ~719ms (was 25,000ms)

**Note:** These settings disable security features. For production, configure proper IP whitelisting or adjust the threshold values instead of disabling entirely.

---

## �📚 **Documentation**

📖 **Complete documentation is available in the [docs/](./docs/) folder**

### **Key Documentation**
- **[Main Documentation](./docs/README.md)** - Complete system overview
- **[Operations Guide](./docs/operations/README.md)** - Scripts and procedures
- **[Database Setup](./docs/database/README.md)** - PostgreSQL configuration
- **[Fresh Database Setup](./scripts/database/FRESH_DATABASE.md)** - Complete database restoration guide
- **[API Reference](./docs/api/README.md)** - REST API documentation

---

## 🗄️ **Database Setup**

### **Complete Database Reset & Seeding**

For a fresh database with all test data:

```powershell
# Navigate to project root
cd E:\QAF\Github\courses

# Complete reset and setup (cleans everything and starts fresh)
powershell "Remove-Item -Recurse -Force prisma/migrations/*"  # Clean migration folder
npx prisma migrate reset --force                              # Reset database
npx prisma migrate dev --name "init"                         # Create initial migration
node prisma/seed-all.ts                                      # Seed lookup tables (25+ types)
node comprehensive-seed-v2.js                                 # Seed programs, users, classes, etc.
```

### **Quick Setup (if database already exists)**

```powershell
# Just seed data without reset
node prisma/seed-all.ts           # Seed lookup tables
node comprehensive-seed-v2.js     # Seed programs, users, classes, etc.
```

### **Database Workflow: Migration vs Seeding**

**🔄 Migrations** - Schema Changes Only:
```bash
# Create new migration (when schema changes)
npx prisma migrate dev --name "add_new_field"

# Apply pending migrations
npx prisma migrate deploy

# Reset database (destructive - removes all data)
npx prisma migrate reset --force
```

**🌱 Seeding** - Data Population Only:
```bash
# Run lookup tables seeding (types, categories, etc.)
node prisma/seed-all.ts

# Run comprehensive data seeding (programs, classes, users, etc.)
node comprehensive-seed-v2.js
```

### **What's Created**

**📊 Lookup Tables (25+ types)**:
- ✅ User Roles, Status Types, Enrollment Status Types
- ✅ Subject Types, Requirement Types, Activity Types
- ✅ Resource Types, Category Types, Question Types
- ✅ Penalty Types, Behavior Types, Participation Types
- ✅ Attendance Status Types, Submission Status Types
- ✅ Academic Terms, and 15+ other lookup tables

**🎓 Academic Data**:
- ✅ **Programs**: 4 (Computer Science, Mechanical, Electrical, Civil Engineering)
- ✅ **Subjects**: 8 (Programming, Data Structures, Database, Software Engineering, Math, Thermodynamics, Circuits, Digital Logic)
- ✅ **Classes**: 8 (Multiple sections across programs)
- ✅ **Users**: 26 (1 Super Admin + 5 HR + 5 Admin + 5 Instructors + 10 Students)
- ✅ **Enrollments**: 16 (students enrolled in various classes)

**📚 Content & Activities**:
- ✅ **Resources**: 15 (PDFs, videos, tutorials, lab guides)
- ✅ **Announcements**: 10 (semester updates, schedules, career fair, HR policies)
- ✅ **Participations**: 15 (class participation records with points)
- ✅ **Behaviors**: 10 (positive/negative behavior records)
- ✅ **Penalties**: 8 (late submissions, absences, misconduct, cheating, plagiarism, disruptions, dress code)
- ✅ **Activities**: 10 (lectures, labs, exams, workshops, seminars, projects)

### **Login Credentials**

```
👤 Super Admin:
   Email: shareef.hiasat@gmail.com
   Password: admin123
   Realm: military-lms

👥 HR Users (5):
   Email: hr1@example.com through hr5@example.com
   Password: Same as email (hr1@example.com, hr2@example.com, etc.)

👥 Admin Users (5):
   Email: admin1@example.com through admin5@example.com
   Password: Same as email (admin1@example.com, admin2@example.com, etc.)

👥 Instructors (5):
   Email: instructor1@example.com through instructor5@example.com
   Password: Same as email (instructor1@example.com, instructor2@example.com, etc.)

👥 Students (10):
   Email: student1@example.com through student10@example.com
   Password: Same as email (student1@example.com, student2@example.com, etc.)
```

---

## 🏗️ **Architecture**

- **Database**: PostgreSQL with 44 tables and Prisma Optimizer
- **Frontend**: React + Vite + TypeScript
- **Authentication**: Keycloak integration
- **API**: RESTful services with business logic layer

---

## 📊 **Current Status**

✅ **Completed**
- Database schema with unified INTEGER IDs
- Super admin user setup
- Prisma optimizer configuration
- Clean development environment

🔄 **In Progress**
- Programs CRUD API
- User management interface
- Class enrollment system

---

## 🛠️ **Development**

### **From Project Root (PowerShell):**
```powershell
# Navigate to client directory
cd E:\QAF\Github\courses\client

# Start app
pnpm start

# Build for production
pnpm run build

# Database operations (from client directory)
pnpm run db:push
pnpm run db:generate
```

### **From Client Directory (PowerShell):**
```powershell
# Start app
pnpm start

# Build for production
pnpm run build

# Database operations
pnpm run db:push
pnpm run db:generate
```

### **Alternative Commands (if pnpm scripts don't work):**
```powershell
# From client directory
npx prisma generate --schema prisma/schema.postgres.prisma
npx prisma db push --schema prisma/schema.postgres.prisma
```

---

## 📊 **What's Ready**

- ✅ **Database**: PostgreSQL with Prisma Optimizer
- ✅ **User**: Super admin account ready
- ✅ **Schema**: 44 tables with unified INTEGER IDs
- ✅ **Frontend**: Vite development server

---

## 🔧 **Configuration**

### **Environment Variables**
```env
# Database (client/.env)
DATABASE_URL="postgresql://military_lms:military_lms123@localhost:5432/military_lms"

# Application
API_VERSION=v1
API_BASE_URL=http://localhost:3000

# Keycloak Configuration
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=master
VITE_KEYCLOAK_CLIENT_ID=military-lms-app
VITE_KEYCLOAK_REDIRECT_URI=http://localhost:5174

# Session Timeout Configuration
VITE_KEYCLOAK_SESSION_HOURS=3              # Keycloak session duration in hours
VITE_SESSION_WARNING_MINUTES=5             # Minutes before expiry to show warning
VITE_SESSION_AUTO_LOGOUT_MINUTES=15         # Minutes of inactivity before auto-logout
VITE_SESSION_REFRESH_BUFFER_MINUTES=2       # Buffer time after refresh before showing warning again
VITE_SESSION_MINIMUM_BUFFER_SECONDS=30      # Minimum buffer for very short tokens
VITE_SESSION_EXPIRY_BUFFER_SECONDS=10       # Seconds before expiry to show final warning
```

### **Keycloak Session Configuration**

For optimal session management with the 3-hour session and 5-minute pre-expiry warning, configure the following Keycloak settings:

#### **Required Settings (Must Change):**
Navigate to **Keycloak Admin Console → Realm Settings → Sessions**:

1. **SSO Session Idle**: `3 Hours`
   - Controls how long a user can be inactive before session expires
   
2. **SSO Session Max**: `3 Hours`
   - Sets maximum session duration regardless of activity

#### **Recommended Settings (Optional):**
Navigate to **Realm Settings → Client/Offline Sessions**:

3. **Client Session Max**: `180` minutes
   - Controls client-side session timeout

#### **Keep Unchanged:**
These settings don't affect active session duration:
- ✅ **Login timeout**: `30 Minutes` (for login process only)
- ✅ **Login action timeout**: `5 Minutes` (for login flow actions)
- ✅ **Offline Session Idle**: `30 Days` (for offline tokens)
- ✅ **Offline Session Max**: `Disabled` (for offline tokens)

#### **Session Behavior:**
- **Session Duration**: 3 hours (180 minutes)
- **Warning Time**: 2 hours 55 minutes (5 minutes before expiry)
- **Extension Options**: User can extend session or logout
- **Auto-logout**: After 15 minutes of inactivity on warning dialog
- **Token Refresh**: Seamless background refresh when extending
- **Countdown Timer**: Shows real-time countdown to auto-logout in the modal

#### **User Experience Features:**

**⏰ Countdown Timer:**
- Shows remaining time before automatic logout
- Updates every second in MM:SS format
- Helps users understand urgency
- Stops when user takes action (extend/logout)

**🔄 Session Extension:**
- One-click token refresh
- No page reload required
- Maintains user session state
- Reschedules warning based on new token expiry

**🚫 Automatic Logout:**
- Triggers after configured inactivity period
- Graceful session termination
- Clears local storage and redirects
- Prevents abandoned sessions

### **Session Timeout Environment Variables**

Configure session timing behavior via environment variables in `.env`:

```env
# Session Timeout Configuration
VITE_KEYCLOAK_SESSION_HOURS=3              # Keycloak session duration in hours
VITE_SESSION_WARNING_MINUTES=5             # Minutes before expiry to show warning
VITE_SESSION_AUTO_LOGOUT_MINUTES=15         # Minutes of inactivity before auto-logout
VITE_SESSION_REFRESH_BUFFER_MINUTES=2       # Buffer time after refresh before showing warning again
VITE_SESSION_MINIMUM_BUFFER_SECONDS=30      # Minimum buffer for very short tokens
VITE_SESSION_EXPIRY_BUFFER_SECONDS=10       # Seconds before expiry to show final warning
```

#### **Detailed Variable Explanations:**

**🕐 Keycloak Session Duration:**
- **`VITE_KEYCLOAK_SESSION_HOURS=3`**
  - **Purpose**: Sets the total session duration in Keycloak
  - **Usage**: Reference value for Keycloak admin console configuration
  - **Effect**: Should match Keycloak's "SSO Session Idle" and "SSO Session Max" settings
  - **Example**: `3` = 3 hours, `8` = 8 hours, `0.5` = 30 minutes

**⚠️ Warning Timing:**
- **`VITE_SESSION_WARNING_MINUTES=5`**
  - **Purpose**: How many minutes before token expiry to show the session extension dialog
  - **Usage**: Controls when the modal appears
  - **Effect**: Lower values = earlier warning, higher values = later warning
  - **Example**: `5` = show dialog 5 minutes before expiry

**⏰ Auto-Logout Timer:**
- **`VITE_SESSION_AUTO_LOGOUT_MINUTES=15`**
  - **Purpose**: How long the user has to respond to the warning before automatic logout
  - **Usage**: Timer starts when the modal is shown
  - **Effect**: User gets this many minutes to click "Extend Session" or "Logout"
  - **Example**: `15` = user has 15 minutes to respond to the modal

**🔄 Refresh Buffer:**
- **`VITE_SESSION_REFRESH_BUFFER_MINUTES=2`**
  - **Purpose**: Buffer time after extending session before another warning can appear
  - **Usage**: Prevents immediate re-appearance of the modal after refresh
  - **Effect**: Ensures smooth user experience after extending session
  - **Example**: `2` = wait 2 minutes before showing another warning

**⚡ Short Token Handling:**
- **`VITE_SESSION_MINIMUM_BUFFER_SECONDS=30`**
  - **Purpose**: Minimum wait time for tokens with very short lifespans
  - **Usage**: When refreshed token still expires quickly
  - **Effect**: Prevents modal spam for tokens that expire very fast
  - **Example**: `30` = wait at least 30 seconds before showing warning

**🎯 Final Buffer:**
- **`VITE_SESSION_EXPIRY_BUFFER_SECONDS=10`**
  - **Purpose**: Final buffer before showing warning for imminent expiry
  - **Usage**: Last chance warning before token actually expires
  - **Effect**: Shows warning when token is about to expire
  - **Example**: `10` = show warning 10 seconds before expiry

#### **Example Configurations:**

```env
# For Testing (1-minute tokens)
VITE_KEYCLOAK_SESSION_HOURS=0.02          # ~1 minute
VITE_SESSION_WARNING_MINUTES=0.5           # Show warning 30 seconds before expiry
VITE_SESSION_AUTO_LOGOUT_MINUTES=2         # User has 2 minutes to respond
VITE_SESSION_REFRESH_BUFFER_MINUTES=0.2    # 12-second buffer after refresh
VITE_SESSION_MINIMUM_BUFFER_SECONDS=10     # 10-second minimum buffer
VITE_SESSION_EXPIRY_BUFFER_SECONDS=5       # 5-second final buffer

# For Production (3-hour tokens)
VITE_KEYCLOAK_SESSION_HOURS=3              # 3 hours
VITE_SESSION_WARNING_MINUTES=5             # Show warning 5 minutes before expiry
VITE_SESSION_AUTO_LOGOUT_MINUTES=15         # User has 15 minutes to respond
VITE_SESSION_REFRESH_BUFFER_MINUTES=2       # 2-minute buffer after refresh
VITE_SESSION_MINIMUM_BUFFER_SECONDS=30      # 30-second minimum buffer
VITE_SESSION_EXPIRY_BUFFER_SECONDS=10       # 10-second final buffer

# For Extended Sessions (8-hour workday)
VITE_KEYCLOAK_SESSION_HOURS=8              # 8 hours
VITE_SESSION_WARNING_MINUTES=10            # Show warning 10 minutes before expiry
VITE_SESSION_AUTO_LOGOUT_MINUTES=30         # User has 30 minutes to respond
VITE_SESSION_REFRESH_BUFFER_MINUTES=5       # 5-minute buffer after refresh
VITE_SESSION_MINIMUM_BUFFER_SECONDS=60      # 1-minute minimum buffer
VITE_SESSION_EXPIRY_BUFFER_SECONDS=30       # 30-second final buffer
```

### **Database Connection**
- **Host**: localhost
- **Port**: 5432
- **Database**: military_lms
- **Username**: military_lms
- **Password**: military_lms123

---

## � **System Roles**

The LMS supports the following user roles with hierarchical permissions:

### **Role Hierarchy (Highest to Lowest):**

1. **👑 Super Admin** (`super_admin`)
   - Full system access
   - Can manage all users and settings
   - Can create/delete other admins
   - System configuration access

2. **🛡️ Admin** (`admin`)
   - Manage users, programs, classes
   - Can create instructors and HR staff
   - Cannot manage super admins
   - Full content management

3. **👨‍🏫 Instructor** (`instructor`)
   - Create and manage courses
   - Grade students and manage attendance
   - View assigned classes and students
   - Create quizzes and assignments

4. **👥 HR** (`hr`)
   - Manage employee records
   - View reports and analytics
   - Manage enrollments
   - Limited user management

5. **🎓 Student** (`student`)
   - Access assigned courses
   - Submit assignments and take quizzes
   - View grades and attendance
   - Basic profile management

### **Role Assignment:**
- Roles are assigned through Keycloak realm/client roles
- Users can have multiple roles simultaneously
- Role permissions are enforced at both frontend and backend levels
- Super Admin has override capabilities for all operations

---

## �� **Access**

- **Super Admin**: shareef.hiasat@gmail.com
- **Password**: Jordan123$
- **Role**: Super Admin
- **Application URL**: http://localhost:5174

---

## 🚨 **API Status**

**Currently: No API server is running**

The application is running as a **frontend-only React app** connected directly to the database via Prisma.

### **To Add API Server:**
1. Create Express.js server in `client/src/api/`
2. Add API endpoints for Programs CRUD
3. Add Swagger/OpenAPI documentation
4. Update package.json with API scripts

---

## 📞 **Support**

### **Documentation**
- **Complete Guide**: `docs/README.md`
- **Operations**: `docs/operations/README.md`
- **Database**: `docs/database/README.md`

### **Troubleshooting**
```powershell
# Check database connection
cd client && pnpm run db:push

# Restart application
pnpm start

# Clear cache
rm -rf node_modules/.cache
```

---

*For complete documentation, see the [docs/](./docs/) folder*

*Last Updated: 2026-03-22*
*Version: 2.0 - PostgreSQL + Prisma Optimizer*
