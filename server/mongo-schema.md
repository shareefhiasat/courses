# MongoDB Schema - Exact Match for Firebase Collections

## Users Collection
```javascript
{
  _id: "fEMmKlf0nWhUXbRsvOb9sIBHSqD2",
  email: "hafole1668@hutudns.com",
  passwordHash: "$2b$10$...",
  displayName: "Hassan",
  realName: "Hassan Eid",
  studentNumber: "2",
  role: "student", // STUDENT, INSTRUCTOR, HR, ADMIN, SUPERADMIN
  status: "active", // active, inactive, pending, suspended, banned
  isAdmin: false,
  isHR: false,
  isInstructor: false,
  isStudent: true,
  isSuperAdmin: false,
  isDisabled: false,
  order: "2",
  phoneNumber: null,
  enrolledClasses: ["01qLKe51goWiYqQf6xYm"],
  createdAt: "2026-02-28T21:00:40.000Z",
  enabledAt: "2026-02-28T23:39:56.000Z",
  enabledBy: "zRG9uurz6YYUyBQU7QQfNZP0Agb2",
  disabledAt: null,
  disabledBy: null,
  
  // Officer stamp support
  officerStampBase64: null,
  officerStampFilename: null,
  officerStampMimeType: null,
  officerStampIssuedAt: null,
  officerStampIssuedBy: null,
  
  // Military specific
  rank: null,
  unit: null,
  clearanceLevel: null,
  
  // Preferences
  language: "en",
  timezone: "UTC",
  notificationsEnabled: true
}
```

## Programs Collection
```javascript
{
  _id: "S0SWOQDHlVCG1bJroUFE",
  name: "Military Training Program",
  code: "MTP-2025",
  description: "Basic military training program",
  durationMonths: 12,
  status: "active", // active, inactive, pending, completed, cancelled, approved, rejected, draft, submitted, graded, returned, overdue, not_started, in_progress, on_hold, review, loading, error, success, idle
  createdAt: "2026-02-28T15:28:36.000Z",
  updatedAt: "2026-02-28T16:44:15.000Z",
  createdBy: "zRG9uurz6YYUyBQU7QQfNZP0Agb2"
}
```

## Courses Collection
```javascript
{
  _id: "course123",
  programId: "S0SWOQDHlVCG1bJroUFE",
  name: "Military Tactics",
  nameAr: "التكتيكات العسكرية",
  code: "MT-101",
  description: "Basic military tactics",
  descriptionAr: "التكتيكات العسكرية الأساسية",
  credits: 3,
  status: "active",
  createdAt: "2026-02-28T15:28:36.000Z",
  updatedAt: "2026-02-28T16:44:15.000Z",
  createdBy: "zRG9uurz6YYUyBQU7QQfNZP0Agb2"
}
```

## Subjects Collection
```javascript
{
  _id: "zfsUHLiaphipsNHDetoq",
  courseId: "course123",
  name: "Field Operations",
  nameAr: "العمليات الميدانية",
  code: "FO-101",
  description: "Field operations training",
  descriptionAr: "تدريب العمليات الميدانية",
  status: "active",
  createdAt: "2026-02-28T15:28:36.000Z",
  updatedAt: "2026-02-28T16:44:15.000Z",
  createdBy: "zRG9uurz6YYUyBQU7QQfNZP0Agb2"
}
```

## Classes Collection
```javascript
{
  _id: "01qLKe51goWiYqQf6xYm",
  subjectId: "zfsUHLiaphipsNHDetoq",
  programId: "S0SWOQDHlVCG1bJroUFE",
  name: "Class One",
  nameAr: "الفصل الأول",
  code: "class one",
  locationEn: "location en",
  locationAr: "location arabic",
  instructorId: "zRG9uurz6YYUyBQU7QQfNZP0Agb2",
  ownerEmail: "shareef.hiasat@gmail.com",
  schedule: {
    days: ["SUN", "TUE", "THU"],
    duration: 60,
    frequency: "thrice",
    holidays: [],
    instructorAbsent: [],
    startTime: "09:00",
    term: "Fall",
    year: "2025"
  },
  status: "active",
  createdAt: "2026-02-28T15:28:44.000Z",
  updatedAt: "2026-03-01T04:30:38.000Z",
  createdBy: "zRG9uurz6YYUyBQU7QQfNZP0Agb2"
}
```

## Enrollments Collection
```javascript
{
  _id: "enrollment123",
  studentId: "fEMmKlf0nWhUXbRsvOb9sIBHSqD2",
  classId: "01qLKe51goWiYqQf6xYm",
  programId: "S0SWOQDHlVCG1bJroUFE",
  enrollmentStatus: "active", // active, pending, completed, cancelled, suspended, withdrawn
  enrolledAt: "2026-02-28T21:00:40.000Z",
  completedAt: null,
  finalGrade: null,
  createdBy: "zRG9uurz6YYUyBQU7QQfNZP0Agb2"
}
```

## Attendance Collection
```javascript
{
  _id: "attendance123",
  studentId: "fEMmKlf0nWhUXbRsvOb9sIBHSqD2",
  classId: "01qLKe51goWiYqQf6xYm",
  programId: "S0SWOQDHlVCG1bJroUFE",
  subjectId: "zfsUHLiaphipsNHDetoq",
  date: "2026-03-03",
  time: "22:21:55",
  status: "excused_leave", // present, absent_no_excuse, absent_with_excuse, late, excused_leave, human_case, standup_present, standup_absent, standup_clinic, standup_late
  method: "bulk", // qr, manual, biometric, face_recognition
  notes: "حضور جماعي - {1} طلاب",
  markedBy: "zRG9uurz6YYUyBQU7QQfNZP0Agb2",
  performedBy: "zRG9uurz6YYUyBQU7QQfNZP0Agb2",
  performedByEmail: "shareef.hiasat@gmail.com",
  performedByName: "shareef.hiasat@gmail.com",
  studentInfo: {
    displayName: "Hassan",
    docId: "fEMmKlf0nWhUXbRsvOb9sIBHSqD2",
    email: "hafole1668@hutudns.com",
    role: "student",
    status: "active",
    studentNumber: "2"
  },
  createdAt: "2026-03-04T01:21:55.000Z",
  updatedAt: "2026-03-04T01:21:55.000Z"
}
```

## Quizzes Collection
```javascript
{
  _id: "quiz123",
  classId: "01qLKe51goWiYqQf6xYm",
  title: "Tactics Quiz",
  titleAr: "اختبار التكتيكات",
  description: "Basic tactics assessment",
  descriptionAr: "تقييم التكتيكات الأساسية",
  quizStatus: "draft", // draft, published, active, completed, archived
  totalPoints: 100,
  durationMinutes: 60,
  attemptsAllowed: 1,
  startTime: null,
  endTime: null,
  shuffleQuestions: false,
  showResults: true,
  createdAt: "2026-02-28T15:28:44.000Z",
  updatedAt: "2026-02-28T16:44:15.000Z",
  createdBy: "zRG9uurz6YYUyBQU7QQfNZP0Agb2"
}
```

## Questions Collection
```javascript
{
  _id: "question123",
  quizId: "quiz123",
  questionText: "What is the primary tactic in field operations?",
  questionTextAr: "ما هي التكتيكية الأساسية في العمليات الميدانية؟",
  questionType: "multiple_choice", // multiple_choice, true_false, short_answer, essay
  options: [
    "Flanking maneuver",
    "Direct assault",
    "Defensive position",
    "Retreat strategy"
  ],
  correctAnswer: "Flanking maneuver",
  points: 10,
  explanation: "Flanking is the primary tactic...",
  explanationAr: "الالتفاف هو التكتيكية الأساسية...",
  createdAt: "2026-02-28T15:28:44.000Z",
  updatedAt: "2026-02-28T16:44:15.000Z",
  createdBy: "zRG9uurz6YYUyBQU7QQfNZP0Agb2"
}
```

## QuizSubmissions Collection
```javascript
{
  _id: "submission123",
  quizId: "quiz123",
  studentId: "fEMmKlf0nWhUXbRsvOb9sIBHSqD2",
  submissionStatus: "submitted", // draft, submitted, graded, returned, overdue, plagiarism_detected
  answers: {
    "question123": "Flanking maneuver",
    "question124": "Direct assault"
  },
  score: 85,
  maxScore: 100,
  startedAt: "2026-03-03T10:00:00.000Z",
  submittedAt: "2026-03-03T10:45:00.000Z",
  gradedAt: "2026-03-03T11:00:00.000Z",
  gradedBy: "zRG9uurz6YYUyBQU7QQfNZP0Agb2",
  createdAt: "2026-03-03T10:00:00.000Z"
}
```

## Resources Collection
```javascript
{
  _id: "resource123",
  title: "Tactics Manual",
  titleAr: "دليل التكتيكات",
  description: "Complete tactics reference manual",
  descriptionAr: "دليل مرجعي شامل للتكتيكات",
  type: "document", // video, link, document, image, audio, presentation
  filePath: "/uploads/tactics-manual.pdf",
  fileSize: 5242880,
  mimeType: "application/pdf",
  classId: "01qLKe51goWiYqQf6xYm",
  tags: ["tactics", "manual", "reference"],
  downloadCount: 15,
  isPublic: true,
  status: "active",
  createdAt: "2026-02-28T15:28:44.000Z",
  updatedAt: "2026-02-28T16:44:15.000Z",
  createdBy: "zRG9uurz6YYUyBQU7QQfNZP0Agb2"
}
```

## Notifications Collection
```javascript
{
  _id: "notification123",
  userId: "fEMmKlf0nWhUXbRsvOb9sIBHSqD2",
  title: "New Quiz Available",
  titleAr: "اختبار جديد متاحر",
  message: "A new tactics quiz has been posted",
  messageAr: "تم نشر اختبار تكتيكات جديد",
  type: "quiz_assigned",
  data: {
    quizId: "quiz123",
    classId: "01qLKe51goWiYqQf6xYm"
  },
  isRead: false,
  readAt: null,
  expiresAt: "2026-03-10T23:59:59.000Z",
  createdAt: "2026-03-03T08:00:00.000Z",
  createdBy: "zRG9uurz6YYUyBQU7QQfNZP0Agb2"
}
```

## Activities Collection
```javascript
{
  _id: "activity123",
  type: "USER_ENABLED",
  role: "student",
  authEnabled: true,
  method: "full_enable",
  userEmail: "hafole1668@hutudns.com",
  userId: "fEMmKlf0nWhUXbRsvOb9sIBHSqD2",
  timestamp: "2026-02-28T21:52:38.000Z",
  enabledBy: "zRG9uurz6YYUyBQU7QQfNZP0Agb2",
  metadata: {}
}
```

## ActivityLogs Collection
```javascript
{
  _id: "log123",
  type: "user_updated",
  userId: "zRG9uurz6YYUyBQU7QQfNZP0Agb2",
  userEmail: null,
  userName: "Unknown",
  url: "/chat",
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  timestamp: "2026-03-03T15:23:23.000Z",
  details: {
    updateFields: ["chatReads"]
  }
}
```

## Announcements Collection
```javascript
{
  _id: "announcement123",
  title: "announcmetn",
  titleAr: "announcmetn",
  contentEn: "<p>announcmetn</p><p><br></p>",
  contentAr: "<p class=\"ql-align-right ql-direction-rtl\"><br></p><p>announcmetn</p>",
  classId: "01qLKe51goWiYqQf6xYm",
  programId: "S0SWOQDHlVCG1bJroUFE",
  subjectId: "zfsUHLiaphipsNHDetoq",
  target: "global",
  featured: false,
  createdAt: "2026-02-28T15:31:39.000Z",
  updatedAt: "2026-02-28T15:31:39.000Z",
  createdBy: "zRG9uurz6YYUyBQU7QQfNZP0Agb2",
  updatedBy: "zRG9uurz6YYUyBQU7QQfNZP0Agb2"
}
```

## Behaviors Collection
```javascript
{
  _id: "behavior123",
  studentId: "fEMmKlf0nWhUXbRsvOb9sIBHSqD2",
  classId: "01qLKe51goWiYqQf6xYm",
  subjectId: "zfsUHLiaphipsNHDetoq",
  programId: "S0SWOQDHlVCG1bJroUFE",
  type: "disruptive",
  description: "",
  points: -1,
  date: "2026-03-03",
  performedBy: "zRG9uurz6YYUyBQU7QQfNZP0Agb2",
  performedByEmail: "shareef.hiasat@gmail.com",
  performedByName: "Sharif Shaker",
  createdAt: "2026-03-03T10:57:51.000Z",
  updatedAt: "2026-03-03T10:57:51.000Z",
  createdBy: "system",
  updatedBy: "system"
}
```

## Categories Collection
```javascript
{
  _id: "category123",
  nameEn: "category book",
  nameAr: "category book",
  descriptionEn: "category book",
  descriptionAr: "category book",
  icon: "book",
  color: "#3ef73b",
  order: 1,
  createdAt: "2026-02-28T16:28:36.000Z",
  updatedAt: "2026-02-28T16:44:15.000Z",
  createdBy: "zRG9uurz6YYUyBQU7QQfNZP0Agb2",
  updatedBy: "zRG9uurz6YYUyBQU7QQfNZP0Agb2"
}
```

## Additional Collections (empty for now)
- directRooms
- emailTemplates
- emails
- files
- notificationLogs
- participations
- penalties
- resources
- config
