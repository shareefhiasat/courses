# 🧪 Notification Test Scenarios

## 🎯 How to Test Each Notification Type

### **Setup Required:**
1. Go to **Dashboard → Notification Logs** to see results
2. Ensure you have test users with both English and Arabic preferences
3. Check email templates have bilingual variables
4. Verify SMTP configuration is working

---

## 📋 Test Scenarios by Type

### **1. Announcement (announcement_new)**

#### **Test Method A: Dashboard → Announcements Tab**
1. Go to Dashboard → Announcements
2. Click "Add Announcement"
3. Fill in:
   - Title: "Test Announcement"
   - Message: "This is a test announcement"
   - Priority: "High"
   - Target: "All Users" or specific class
4. Click "Save"
5. Check **Notification Logs** for email entries
6. Verify both `title_en` and `title_ar` variables

#### **Test Method B: Direct API Call**
```javascript
// In browser console (as admin)
await notificationGateway.send('announcement_new', {
  userId: 'testUserId',
  role: 'student',
  email: 'test@example.com',
  lang: 'ar',
  variables: {
    announcementTitle: 'Test Announcement',
    announcementContent: 'This is a test',
    courseName: 'Test Course',
    priority: 'high'
  }
});
```

#### **Expected Variables in Template:**
```javascript
{
  titleEn: "New Announcement",
  titleAr: "إعلان جديد",
  messageEn: "A new announcement has been posted",
  messageAr: "تم نشر إعلان جديد",
  announcementTitle: "Test Announcement",
  announcementContent: "This is a test",
  programName: "Test Program",
  subjectName: "Test Subject",
  className: "Test Class",
  classDescription: "Test class description",
  priority: "high",
  userLang: "ar",
  createdAt: "2025-02-08T10:30:00Z",
  updatedAt: "2025-02-08T10:30:00Z"
}
```

---

### **2. Activity (activity_new)**

#### **Test Method: Dashboard → Activities Tab**
1. Go to Dashboard → Activities
2. Click "Add Activity"
3. Fill in:
   - Activity Name: "Test Assignment"
   - Type: "Assignment"
   - Description: "Test assignment description"
   - Due Date: Tomorrow
   - Points: 100
   - Target Class: Select a class
4. Click "Save"
5. Check **Notification Logs**

#### **Expected Variables:**
```javascript
{
  titleEn: "New Activity",
  titleAr: "نشاط جديد",
  messageEn: "A new activity has been assigned",
  messageAr: "تم تعيين نشاط جديد",
  activityName: "Test Assignment",
  activityType: "Assignment",
  activityDescription: "Test assignment description",
  dueDate: "2025-02-09T10:30:00Z",
  startDate: "2025-02-08T10:30:00Z",
  endDate: "2025-02-15T23:59:59Z",
  programName: "Test Program",
  subjectName: "Test Subject",
  className: "Test Class",
  classDescription: "Test class description",
  instructorName: "Instructor Name",
  points: "100",
  estimatedTime: "2 hours",
  userLang: "en",
  createdAt: "2025-02-08T10:30:00Z",
  updatedAt: "2025-02-08T10:30:00Z"
}
```

---

### **3. Activity Graded (activity_graded)**

#### **Test Method: Dashboard → Activities → Grade**
1. Go to Dashboard → Activities
2. Find an existing activity with submissions
3. Click "Grade" or "View Submissions"
4. Enter grade and feedback:
   - Score: 85
   - Feedback: "Good work!"
5. Click "Save Grade"
6. Check **Notification Logs**

#### **Expected Variables:**
```javascript
{
  title_en: "Activity Graded",
  title_ar: "تم تقييم النشاط",
  message_en: "Your activity has been graded",
  message_ar: "تم تقييم نشاطك",
  activityName: "Activity Name",
  grade: "85",
  score: "85",
  maxScore: "100",
  percentage: "85%",
  feedback: "Good work!",
  gradedBy: "Instructor Name",
  gradedDate: "2025-02-08",
  passingStatus: "Pass",
  userLang: "en"
}
```

---

### **4. Resource (resource_new)**

#### **Test Method: Dashboard → Resources Tab**
1. Go to Dashboard → Resources
2. Click "Add Resource"
3. Fill in:
   - Resource Name: "Test PDF"
   - Type: "Document"
   - Description: "Test resource description"
   - Upload a file or add URL
   - Category: "Study Materials"
4. Click "Save"
5. Check **Notification Logs**

#### **Expected Variables:**
```javascript
{
  title_en: "New Resource",
  title_ar: "مورد جديد",
  message_en: "A new resource is available",
  message_ar: "مورد جديد متاح",
  resourceName: "Test PDF",
  resourceType: "Document",
  resourceDescription: "Test resource description",
  resourceUrl: "https://example.com/file.pdf",
  category: "Study Materials",
  uploadedBy: "Instructor Name",
  userLang: "en"
}
```

---

### **5. Quiz Available (quiz_available)**

#### **Test Method: Dashboard → Quizzes Tab**
1. Go to Dashboard → Quizzes
2. Click "Add Quiz"
3. Fill in:
   - Quiz Name: "Test Quiz"
   - Description: "Test quiz description"
   - Duration: "30 minutes"
   - Attempts: "3"
   - Questions: "10"
   - Passing Score: "70"
   - Start/End dates
4. Click "Save"
5. Check **Notification Logs**

#### **Expected Variables:**
```javascript
{
  title_en: "Quiz Available",
  title_ar: "اختبار متاح",
  message_en: "A new quiz is available",
  message_ar: "اختبار جديد متاح",
  quizName: "Test Quiz",
  quizDescription: "Test quiz description",
  duration: "30 minutes",
  attempts: "3",
  questionCount: "10",
  passingScore: "70",
  startDate: "2025-02-08",
  endDate: "2025-02-15",
  userLang: "en"
}
```

---

### **6. Attendance Recorded (attendance_recorded)**

#### **Test Method A: QR Scanner**
1. Go to QR Scanner page
2. Scan a student's QR code
3. Mark as "Present"
4. Check **Notification Logs**

#### **Test Method B: Dashboard → Student Roster**
1. Go to Dashboard → Classes → Select Class
2. Find a student in roster
3. Click "Mark Attendance"
4. Select status and save
5. Check **Notification Logs**

#### **Expected Variables:**
```javascript
{
  title_en: "Attendance Recorded",
  title_ar: "تم تسجيل الحضور",
  message_en: "Your attendance has been recorded",
  message_ar: "تم تسجيل حضورك",
  studentName: "Student Name",
  className: "Math 101",
  courseName: "Mathematics",
  attendanceDate: "2025-02-08",
  attendanceTime: "10:30 AM",
  attendanceStatus: "Present",
  markedBy: "Instructor Name",
  method: "QR Scanner",
  userLang: "en"
}
```

---

### **7. Attendance Absent (attendance_absent)**

#### **Test Method: Mark Absence**
1. Go to Dashboard → Classes → Select Class
2. Find a student
3. Mark as "Absent"
4. Add reason: "Sick leave"
5. Check **Notification Logs**

#### **Expected Variables:**
```javascript
{
  title_en: "Attendance Marked Absent",
  title_ar: "تم تسجيل الغياب",
  message_en: "You were marked absent",
  message_ar: "تم تسجيل غيابك",
  studentName: "Student Name",
  className: "Math 101",
  absenceDate: "2025-02-08",
  absenceReason: "Sick leave",
  markedBy: "Instructor Name",
  makeupAllowed: "true",
  makeupDeadline: "2025-02-10",
  userLang: "en"
}
```

---

### **8. Penalty Issued (penalty_issued)**

#### **Test Method: Dashboard → Penalties Tab**
1. Go to Dashboard → Penalties
2. Click "Add Penalty"
3. Fill in:
   - Student: Select student
   - Type: "Late Submission"
   - Reason: "Submitted 2 days late"
   - Points: "-5"
4. Click "Save"
5. Check **Notification Logs**

#### **Expected Variables:**
```javascript
{
  title_en: "Penalty Issued",
  title_ar: "تم إصدار عقوبة",
  message_en: "A penalty has been issued",
  message_ar: "تم إصدار عقوبة",
  studentName: "Student Name",
  penaltyType: "Late Submission",
  penaltyReason: "Submitted 2 days late",
  penaltyPoints: "5",
  currentPoints: "95",
  issuedBy: "Instructor Name",
  issueDate: "2025-02-08",
  appealAllowed: "true",
  appealDeadline: "2025-02-10",
  userLang: "en"
}
```

---

### **9. Behavior Awarded (behavior_awarded)**

#### **Test Method: Dashboard → Behaviors Tab**
1. Go to Dashboard → Behaviors
2. Click "Add Behavior"
3. Fill in:
   - Student: Select student
   - Type: "Helpful"
   - Description: "Helped classmates with assignment"
   - Points: "+3"
4. Click "Save"
5. Check **Notification Logs**

#### **Expected Variables:**
```javascript
{
  title_en: "Behavior Awarded",
  title_ar: "تم منح سلوك",
  message_en: "You have been awarded for good behavior",
  message_ar: "تم منحك لسلوك جيد",
  studentName: "Student Name",
  behaviorType: "Helpful",
  behaviorDescription: "Helped classmates with assignment",
  pointsAwarded: "3",
  currentPoints: "103",
  awardedBy: "Instructor Name",
  awardDate: "2025-02-08",
  category: "Positive",
  userLang: "en"
}
```

---

### **10. Participation Recorded (participation_recorded)**

#### **Test Method: Dashboard → Participation Tab**
1. Go to Dashboard → Participation
2. Click "Add Participation"
3. Fill in:
   - Student: Select student
   - Type: "Class Discussion"
   - Details: "Active participation in group discussion"
   - Points: "+2"
4. Click "Save"
5. Check **Notification Logs**

#### **Expected Variables:**
```javascript
{
  title_en: "Participation Recorded",
  title_ar: "تم تسجيل المشاركة",
  message_en: "Your participation has been recorded",
  message_ar: "تم تسجيل مشاركتك",
  studentName: "Student Name",
  participationType: "Class Discussion",
  participationDetails: "Active participation in group discussion",
  pointsAwarded: "2",
  currentPoints: "102",
  recordedBy: "Instructor Name",
  recordDate: "2025-02-08",
  activityName: "Group Discussion Activity",
  userLang: "en"
}
```

---

### **11. Password Reset (password_reset)**

#### **Test Method: Login Page**
1. Go to Login page
2. Click "Forgot Password"
3. Enter test email
4. Check email and **Notification Logs**

#### **Expected Variables:**
```javascript
{
  title_en: "Password Reset",
  title_ar: "إعادة تعيين كلمة المرور",
  message_en: "Password reset request received",
  message_ar: "تم استلام طلب إعادة تعيين كلمة المرور",
  userName: "Test User",
  resetToken: "abc123token",
  resetLink: "https://yoursite.com/reset?token=abc123token",
  expiryTime: "1 hour",
  requestDate: "2025-02-08 10:30 AM",
  requesterIP: "192.168.1.1",
  deviceInfo: "Chrome on Windows",
  securityNote: "If you didn't request this, please contact support",
  userLang: "en"
}
```

---

### **12. Chat Message (chat_message)**

#### **Test Method: Chat Feature**
1. Go to Chat page
2. Select a chat room
3. Send a message: "Hello everyone!"
4. Check **Notification Logs** for other users in room

#### **Expected Variables:**
```javascript
{
  title_en: "New Message",
  title_ar: "رسالة جديدة",
  message_en: "You have a new message",
  message_ar: "لديك رسالة جديدة",
  senderName: "Sender Name",
  senderRole: "student",
  chatRoomName: "General Discussion",
  messageContent: "Hello everyone!",
  messageTime: "2025-02-08 10:30 AM",
  courseName: "Course Name",
  className: "Class Name",
  messageType: "text",
  userLang: "en"
}
```

---

## 🔍 Debugging Steps

### **1. Check Notification Logs:**
1. Go to Dashboard → Notification Logs
2. Find the notification entry
3. Click "View" button
4. Check the `variables` section
5. Verify all expected variables are present

### **2. Test Bilingual Content:**
1. Test with English user (userLang: 'en')
2. Test with Arabic user (userLang: 'ar')
3. Compare `title_en` vs `title_ar`
4. Compare `message_en` vs `message_ar`

### **3. Verify Email Template:**
1. Check email template uses correct variable names
2. Test conditional logic: `{{#if (eq userLang 'ar')}}`
3. Verify RTL/LTR styling
4. Test fallback variables

### **4. Common Issues:**
- **Missing variables:** Check if trigger mapping is correct
- **Wrong variable names:** Verify exact spelling in template
- **Template syntax:** Check Handlebars syntax
- **Language detection:** Verify `userLang` is being passed correctly

---

## 📊 Test Results Template

### **Use this to track your testing:**

```markdown
## Test Results - [Date]

### 1. Announcement (announcement_new)
- [ ] English user tested
- [ ] Arabic user tested
- [ ] All variables present
- [ ] Email received correctly
- [ ] Notes: ___________

### 2. Activity (activity_new)
- [ ] English user tested
- [ ] Arabic user tested
- [ ] All variables present
- [ ] Email received correctly
- [ ] Notes: ___________

[Continue for all 12 types...]
```

---

## 🚀 Quick Test Script

### **Test All Notification Types:**
```javascript
// Run in browser console as admin
const testScenarios = [
  { trigger: 'announcement_new', variables: { announcementTitle: 'Test' } },
  { trigger: 'activity_new', variables: { activityName: 'Test Activity' } },
  { trigger: 'activity_graded', variables: { activityName: 'Test', score: '85' } },
  { trigger: 'resource_new', variables: { resourceName: 'Test Resource' } },
  { trigger: 'quiz_available', variables: { quizName: 'Test Quiz' } },
  { trigger: 'attendance_recorded', variables: { studentName: 'Test Student' } },
  { trigger: 'attendance_absent', variables: { studentName: 'Test Student' } },
  { trigger: 'penalty_issued', variables: { studentName: 'Test Student' } },
  { trigger: 'behavior_awarded', variables: { studentName: 'Test Student' } },
  { trigger: 'participation_recorded', variables: { studentName: 'Test Student' } },
  { trigger: 'password_reset', variables: { userName: 'Test User' } },
  { trigger: 'chat_message', variables: { senderName: 'Test Sender' } }
];

for (const scenario of testScenarios) {
  await notificationGateway.send(scenario.trigger, {
    userId: 'testUserId',
    role: 'student',
    email: 'test@example.com',
    lang: 'en',
    variables: scenario.variables
  });
}
```

**Happy Testing! 🧪**
