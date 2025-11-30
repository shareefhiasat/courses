# 🚀 V2 Quick Start Guide

## Step 1: Setup (15 minutes)

### 1.1 Create V2 Directory Structure
```bash
# Frontend
mkdir client/src/pages-v2

# Backend
mkdir functions/v2
mkdir functions/v2/routes
mkdir functions/v2/controllers
mkdir functions/v2/services
mkdir functions/v2/middleware
```

### 1.2 Create First V2 Page (HomePage)

**File:** `client/src/pages-v2/HomePage.jsx`
```javascript
import React from 'react';
import { Container, Grid, Card, CardHeader, CardBody, Badge, Button } from '@/components/ui';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="xl">
      <div style={{ padding: '2rem 0' }}>
        <h1>Welcome to Learning Hub V2 🎉</h1>
        <Badge color="success">New UI</Badge>
        
        <Grid cols={3} gap="lg" style={{ marginTop: '2rem' }}>
          <Card hoverable onClick={() => navigate('/v2/dashboard')}>
            <CardHeader title="Dashboard" />
            <CardBody>
              <p>View your analytics and metrics</p>
            </CardBody>
          </Card>

          <Card hoverable onClick={() => navigate('/v2/classes')}>
            <CardHeader title="Classes" />
            <CardBody>
              <p>Manage your classes and students</p>
            </CardBody>
          </Card>

          <Card hoverable onClick={() => navigate('/v2/chat')}>
            <CardHeader title="Chat" />
            <CardBody>
              <p>Message students and instructors</p>
            </CardBody>
          </Card>
        </Grid>

        <div style={{ marginTop: '2rem' }}>
          <Button variant="outline" onClick={() => navigate('/')}>
            Back to Legacy Version
          </Button>
        </div>
      </div>
    </Container>
  );
}
```

### 1.3 Update App.jsx Routes

**File:** `client/src/App.jsx`
```javascript
// Add this import at the top
import HomePageV2 from './pages-v2/HomePage';

// Add this route inside <Routes>
<Route path="/v2" element={<HomePageV2 />} />
```

### 1.4 Test It!
```bash
npm run dev
```

Visit: `http://localhost:5173/v2`

---

## Step 2: Migrate Your First Real Page (30 minutes)

### Example: Dashboard Page

**File:** `client/src/pages-v2/DashboardPage.jsx`
```javascript
import React, { useState, useEffect } from 'react';
import {
  Container, Grid, Card, CardHeader, CardBody,
  Chart, Badge, ProgressBar, DataGrid, Skeleton
} from '@/components/ui';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // Fetch data from API
    fetch('/api/v2/dashboard/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Skeleton count={5} />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <h1>Dashboard</h1>
      
      {/* KPI Cards */}
      <Grid cols={4} gap="lg">
        <Card>
          <CardBody>
            <h3>Total Students</h3>
            <h2>{stats.totalStudents}</h2>
            <Badge color="success">+12% this month</Badge>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h3>Active Classes</h3>
            <h2>{stats.activeClasses}</h2>
            <Badge color="info">5 new</Badge>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h3>Attendance Rate</h3>
            <h2>{stats.attendanceRate}%</h2>
            <ProgressBar value={stats.attendanceRate} color="success" />
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h3>Pending Submissions</h3>
            <h2>{stats.pendingSubmissions}</h2>
            <Badge color="warning">Review needed</Badge>
          </CardBody>
        </Card>
      </Grid>

      {/* Charts */}
      <Grid cols={2} gap="lg" style={{ marginTop: '2rem' }}>
        <Card>
          <CardHeader title="Student Enrollment Trend" />
          <CardBody>
            <Chart
              type="line"
              data={stats.enrollmentData}
              xKey="month"
              yKeys={['students']}
              height={300}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Attendance by Class" />
          <CardBody>
            <Chart
              type="bar"
              data={stats.attendanceByClass}
              xKey="className"
              yKeys={['attendance']}
              height={300}
            />
          </CardBody>
        </Card>
      </Grid>

      {/* Recent Activity Table */}
      <Card style={{ marginTop: '2rem' }}>
        <CardHeader title="Recent Activity" />
        <CardBody>
          <DataGrid
            columns={[
              { key: 'student', label: 'Student', sortable: true },
              { key: 'action', label: 'Action', sortable: true },
              { key: 'timestamp', label: 'Time', sortable: true },
            ]}
            data={stats.recentActivity}
            pageSize={10}
          />
        </CardBody>
      </Card>
    </Container>
  );
}
```

**Add route to App.jsx:**
```javascript
import DashboardPageV2 from './pages-v2/DashboardPage';

<Route path="/v2/dashboard" element={<DashboardPageV2 />} />
```

---

## Step 3: Create V2 Backend API (30 minutes)

### 3.1 Create Route File

**File:** `functions/v2/routes/dashboard.js`
```javascript
const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

// GET /api/v2/dashboard/stats
router.get('/stats', authenticate, getDashboardStats);

module.exports = router;
```

### 3.2 Create Controller

**File:** `functions/v2/controllers/dashboardController.js`
```javascript
const { getStudentCount, getClassCount } = require('../services/firestoreService');

exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.uid;
    const userRole = req.user.role;

    // Fetch stats based on role
    const stats = {
      totalStudents: await getStudentCount(userId, userRole),
      activeClasses: await getClassCount(userId, userRole),
      attendanceRate: 87.5, // Calculate from attendance records
      pendingSubmissions: 12, // Calculate from submissions
      enrollmentData: [
        { month: 'Jan', students: 120 },
        { month: 'Feb', students: 145 },
        { month: 'Mar', students: 167 },
      ],
      attendanceByClass: [
        { className: 'Math 101', attendance: 92 },
        { className: 'Physics 201', attendance: 85 },
        { className: 'Chemistry 101', attendance: 88 },
      ],
      recentActivity: [
        { student: 'John Doe', action: 'Submitted Assignment', timestamp: '2 hours ago' },
        { student: 'Jane Smith', action: 'Marked Present', timestamp: '3 hours ago' },
      ],
    };

    res.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};
```

### 3.3 Create Service

**File:** `functions/v2/services/firestoreService.js`
```javascript
const admin = require('firebase-admin');
const db = admin.firestore();

exports.getStudentCount = async (userId, userRole) => {
  if (userRole === 'admin') {
    const snapshot = await db.collection('users').where('role', '==', 'student').get();
    return snapshot.size;
  } else if (userRole === 'instructor') {
    // Get classes taught by this instructor
    const classesSnapshot = await db.collection('classes')
      .where('instructorId', '==', userId)
      .get();
    
    const classIds = classesSnapshot.docs.map(doc => doc.id);
    
    // Get enrolled students
    const enrollmentsSnapshot = await db.collection('enrollments')
      .where('classId', 'in', classIds)
      .get();
    
    return new Set(enrollmentsSnapshot.docs.map(doc => doc.data().studentId)).size;
  }
  
  return 0;
};

exports.getClassCount = async (userId, userRole) => {
  if (userRole === 'admin') {
    const snapshot = await db.collection('classes').get();
    return snapshot.size;
  } else if (userRole === 'instructor') {
    const snapshot = await db.collection('classes')
      .where('instructorId', '==', userId)
      .get();
    return snapshot.size;
  }
  
  return 0;
};
```

### 3.4 Create Middleware

**File:** `functions/v2/middleware/auth.js`
```javascript
const admin = require('firebase-admin');

exports.authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Get user role from Firestore
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(decodedToken.uid)
      .get();
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: userDoc.data()?.role || 'student',
    };
    
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

### 3.5 Wire It All Together

**File:** `functions/v2/routes/index.js`
```javascript
const express = require('express');
const router = express.Router();

const dashboardRoutes = require('./dashboard');

router.use('/dashboard', dashboardRoutes);

module.exports = router;
```

**File:** `functions/index.js` (add this)
```javascript
const v2Routes = require('./v2/routes');
app.use('/api/v2', v2Routes);
```

---

## Step 4: Test End-to-End (10 minutes)

### 4.1 Deploy Backend
```bash
firebase deploy --only functions
```

### 4.2 Test Frontend
```bash
npm run dev
```

### 4.3 Visit Pages
- `http://localhost:5173/v2` - Homepage
- `http://localhost:5173/v2/dashboard` - Dashboard

### 4.4 Check Console
- No errors
- Data loads correctly
- Charts render
- Components look good

---

## Step 5: Repeat for Each Page! 🔄

### Migration Checklist Template

For each page:
- [ ] Create `pages-v2/[PageName].jsx`
- [ ] Replace inline styles with components
- [ ] Add route to `App.jsx`
- [ ] Create backend route if needed
- [ ] Create controller if needed
- [ ] Test thoroughly
- [ ] Check RTL (Arabic)
- [ ] Check dark mode
- [ ] Check mobile
- [ ] Mark milestone complete

---

## 🎯 Priority Order

1. **HomePage** ✅ (Done in Step 1)
2. **DashboardPage** ✅ (Done in Step 2)
3. **ChatPage** (High traffic)
4. **AttendancePage** (Critical feature)
5. **StudentsPage** (Core functionality)
6. **ClassesPage** (Core functionality)
7. **AnalyticsPage** (Charts showcase)
8. ... (remaining 30 pages)

---

## 📊 Track Your Progress

Create a simple tracker:

**File:** `V2_PROGRESS.md`
```markdown
# V2 Migration Progress

## Completed (2/37)
- [x] HomePage
- [x] DashboardPage

## In Progress (0/37)

## Pending (35/37)
- [ ] ChatPage
- [ ] AttendancePage
- [ ] StudentsPage
- ... (list all)
```

---

## 🚀 You're Ready!

**Next Steps:**
1. Run through Steps 1-4 above
2. Pick next page from priority list
3. Migrate using same pattern
4. Test thoroughly
5. Repeat!

**Estimated Time per Page:**
- Simple page: 30 minutes
- Medium page: 1 hour
- Complex page: 2 hours

**Total Time:** 3-5 days for all 37 pages

**Let's go!** 🎉
