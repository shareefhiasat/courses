// MongoDB initialization script - Exact Firebase structure
db = db.getSiblingDB('lms_dev');

// Create all collections exactly like Firebase
db.createCollection('users');
db.createCollection('programs');
db.createCollection('courses');
db.createCollection('subjects');
db.createCollection('classes');
db.createCollection('enrollments');
db.createCollection('attendance');
db.createCollection('quizzes');
db.createCollection('questions');
db.createCollection('quizSubmissions');
db.createCollection('resources');
db.createCollection('notifications');
db.createCollection('activities');
db.createCollection('activityLogs');
db.createCollection('announcements');
db.createCollection('behaviors');
db.createCollection('categories');
db.createCollection('directRooms');
db.createCollection('emailTemplates');
db.createCollection('emails');
db.createCollection('files');
db.createCollection('notificationLogs');
db.createCollection('participations');
db.createCollection('penalties');

// Create indexes matching Firebase queries
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ studentNumber: 1 }, { unique: true, sparse: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ status: 1 });
db.users.createIndex({ enrolledClasses: 1 });

db.classes.createIndex({ code: 1 }, { unique: true });
db.classes.createIndex({ instructorId: 1 });
db.classes.createIndex({ subjectId: 1 });
db.classes.createIndex({ programId: 1 });

db.courses.createIndex({ code: 1 }, { unique: true });
db.courses.createIndex({ programId: 1 });

db.subjects.createIndex({ code: 1 }, { unique: true });
db.subjects.createIndex({ courseId: 1 });

db.enrollments.createIndex({ studentId: 1, classId: 1 }, { unique: true });
db.enrollments.createIndex({ studentId: 1 });
db.enrollments.createIndex({ classId: 1 });

db.attendance.createIndex({ studentId: 1, classId: 1, date: 1 }, { unique: true });
db.attendance.createIndex({ studentId: 1 });
db.attendance.createIndex({ classId: 1 });
db.attendance.createIndex({ date: 1 });

db.quizzes.createIndex({ classId: 1 });
db.quizzes.createIndex({ createdBy: 1 });

db.questions.createIndex({ quizId: 1 });

db.quizSubmissions.createIndex({ quizId: 1, studentId: 1 }, { unique: true });
db.quizSubmissions.createIndex({ studentId: 1 });

db.resources.createIndex({ classId: 1 });
db.resources.createIndex({ createdBy: 1 });
db.resources.createIndex({ tags: 1 });

db.notifications.createIndex({ userId: 1 });
db.notifications.createIndex({ isRead: 1 });
db.notifications.createIndex({ expiresAt: 1 });

db.activities.createIndex({ userId: 1 });
db.activities.createIndex({ timestamp: 1 });

db.activityLogs.createIndex({ userId: 1 });
db.activityLogs.createIndex({ timestamp: 1 });

db.announcements.createIndex({ classId: 1 });
db.announcements.createIndex({ programId: 1 });
db.announcements.createIndex({ createdBy: 1 });

// Insert sample data matching Firebase structure
db.users.insertOne({
  _id: "admin123",
  email: "admin@military.lms",
  passwordHash: "$2b$10$hashedpassword",
  displayName: "System Admin",
  realName: "System Administrator",
  role: "ADMIN",
  status: "active",
  isAdmin: true,
  isHR: false,
  isInstructor: false,
  isStudent: false,
  isSuperAdmin: false,
  isDisabled: false,
  order: "0",
  phoneNumber: null,
  enrolledClasses: [],
  createdAt: new Date(),
  enabledAt: new Date(),
  enabledBy: "system",
  disabledAt: null,
  disabledBy: null,
  language: "en",
  timezone: "UTC",
  notificationsEnabled: true
});

db.users.insertOne({
  _id: "student123",
  email: "student1@military.lms",
  passwordHash: "$2b$10$hashedpassword",
  displayName: "Student One",
  realName: "Student One",
  studentNumber: "1",
  role: "student",
  status: "active",
  isAdmin: false,
  isHR: false,
  isInstructor: false,
  isStudent: true,
  isSuperAdmin: false,
  isDisabled: false,
  order: "1",
  phoneNumber: null,
  enrolledClasses: [],
  createdAt: new Date(),
  enabledAt: new Date(),
  enabledBy: "admin123",
  disabledAt: null,
  disabledBy: null,
  language: "en",
  timezone: "UTC",
  notificationsEnabled: true
});

print("MongoDB initialized with exact Firebase structure");
