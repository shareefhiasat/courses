/**
 * Comprehensive Prisma Seed Script
 * 
 * This script seeds all lookup tables and initial data:
 * - User Roles
 * - User Status Types  
 * - Enrollment Status Types
 * - Activity Types
 * - Activity Log Action Types
 * - Assessment Types
 * - Quiz Status Types
 * - Question Difficulty Types
 * - Schedule Types
 * - Template Types
 * - Config Types
 * - Attendance Status Types
 * - Submission Status Types
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// User Roles
const USER_ROLES = [
  { code: 'SUPER_ADMIN', nameEn: 'Super Administrator', nameAr: 'مدير النظام الأعلى', description: 'Super Administrator with full system access' },
  { code: 'ADMIN', nameEn: 'Administrator', nameAr: 'مدير النظام', description: 'System Administrator' },
  { code: 'HR', nameEn: 'HR Manager', nameAr: 'مدير الموارد البشرية', description: 'Human Resources Manager' },
  { code: 'INSTRUCTOR', nameEn: 'Instructor', nameAr: 'مدرب', description: 'Course Instructor' },
  { code: 'STUDENT', nameEn: 'Student', nameAr: 'طالب', description: 'Student User' }
] as const;

// User Status Types
const USER_STATUS_TYPES = [
  { code: 'ACTIVE', nameEn: 'Active', nameAr: 'نشط', description: 'User is active and can access the system' },
  { code: 'INACTIVE', nameEn: 'Inactive', nameAr: 'غير نشط', description: 'User is inactive and cannot access the system' },
  { code: 'SUSPENDED', nameEn: 'Suspended', nameAr: 'موقوف', description: 'User is temporarily suspended' },
  { code: 'PENDING', nameEn: 'Pending', nameAr: 'في الانتظار', description: 'User account is pending approval' }
] as const;

// Enrollment Status Types
const ENROLLMENT_STATUS_TYPES = [
  { code: 'ENROLLED', nameEn: 'Enrolled', nameAr: 'مسجل', description: 'Student is enrolled in the program' },
  { code: 'PENDING', nameEn: 'Pending', nameAr: 'في الانتظار', description: 'Enrollment is pending approval' },
  { code: 'APPROVED', nameEn: 'Approved', nameAr: 'موافق عليه', description: 'Enrollment has been approved' },
  { code: 'REJECTED', nameEn: 'Rejected', nameAr: 'مرفوض', description: 'Enrollment has been rejected' },
  { code: 'COMPLETED', nameEn: 'Completed', nameAr: 'مكتمل', description: 'Student has completed the program' },
  { code: 'DROPPED', nameEn: 'Dropped', nameAr: 'منسحب', description: 'Student has dropped from the program' },
  { code: 'SUSPENDED', nameEn: 'Suspended', nameAr: 'موقوف', description: 'Student enrollment is suspended' }
] as const;

// Subject Types
const SUBJECT_TYPES = [
  { code: 'CORE', nameEn: 'Core Subject', nameAr: 'موضوع أساسي', description: 'Fundamental subject for the program' },
  { code: 'ELECTIVE', nameEn: 'Elective Subject', nameAr: 'موضوع اختياري', description: 'Optional subject students can choose' },
  { code: 'SPECIALIZATION', nameEn: 'Specialization Subject', nameAr: 'موضوع تخصص', description: 'Subject for specific specialization track' }
] as const;

// Requirement Types
const REQUIREMENT_TYPES = [
  { code: 'MANDATORY', nameEn: 'Mandatory', nameAr: 'إلزامي', description: 'Required subject for graduation' },
  { code: 'OPTIONAL', nameEn: 'Optional', nameAr: 'اختياري', description: 'Not required but recommended' },
  { code: 'PREREQUISITE', nameEn: 'Prerequisite', nameAr: 'مطلب سابق', description: 'Required before taking other subjects' }
] as const;

// Activity Types
const ACTIVITY_TYPES = [
  { code: 'LECTURE', nameEn: 'Lecture', nameAr: 'محاضرة', description: 'Classroom lecture session' },
  { code: 'LAB', nameEn: 'Lab Session', nameAr: 'جلسة معمل', description: 'Laboratory practical session' },
  { code: 'SEMINAR', nameEn: 'Seminar', nameAr: 'ندوة', description: 'Interactive seminar session' },
  { code: 'WORKSHOP', nameEn: 'Workshop', nameAr: 'ورشة عمل', description: 'Hands-on workshop session' },
  { code: 'EXAM', nameEn: 'Exam', nameAr: 'امتحان', description: 'Formal examination' },
  { code: 'ASSIGNMENT', nameEn: 'Assignment', nameAr: 'واجب', description: 'Course assignment' },
  { code: 'PROJECT', nameEn: 'Project', nameAr: 'مشروع', description: 'Course project' },
  { code: 'PRESENTATION', nameEn: 'Presentation', nameAr: 'عرض تقديمي', description: 'Student presentation' }
] as const;

// Activity Log Action Types
const ACTIVITY_LOG_ACTION_TYPES = [
  { code: 'CREATE', nameEn: 'Create', nameAr: 'إنشاء', description: 'Record created' },
  { code: 'UPDATE', nameEn: 'Update', nameAr: 'تحديث', description: 'Record updated' },
  { code: 'DELETE', nameEn: 'Delete', nameAr: 'حذف', description: 'Record deleted' },
  { code: 'LOGIN', nameEn: 'Login', nameAr: 'تسجيل الدخول', description: 'User logged in' },
  { code: 'LOGOUT', nameEn: 'Logout', nameAr: 'تسجيل الخروج', description: 'User logged out' },
  { code: 'ENROLL', nameEn: 'Enroll', nameAr: 'تسجيل', description: 'User enrolled in program' },
  { code: 'WITHDRAW', nameEn: 'Withdraw', nameAr: 'انسحاب', description: 'User withdrew from program' },
  { code: 'SUBMIT', nameEn: 'Submit', nameAr: 'تقديم', description: 'Assignment submitted' },
  { code: 'GRADE', nameEn: 'Grade', nameAr: 'تقدير', description: 'Grade assigned' }
] as const;

// Assessment Types
const ASSESSMENT_TYPES = [
  { code: 'QUIZ', nameEn: 'Quiz', nameAr: 'اختبار قصير', description: 'Short knowledge assessment' },
  { code: 'MIDTERM', nameEn: 'Midterm Exam', nameAr: 'امتحان منتصف الفصل', description: 'Mid-term examination' },
  { code: 'FINAL', nameEn: 'Final Exam', nameAr: 'امتحان نهائي', description: 'Final examination' },
  { code: 'ASSIGNMENT', nameEn: 'Assignment', nameAr: 'واجب', description: 'Course assignment' },
  { code: 'PROJECT', nameEn: 'Project', nameAr: 'مشروع', description: 'Course project' },
  { code: 'PARTICIPATION', nameEn: 'Participation', nameAr: 'مشاركة', description: 'Class participation' },
  { code: 'PRESENTATION', nameEn: 'Presentation', nameAr: 'عرض تقديمي', description: 'Oral presentation' },
  { code: 'LAB_WORK', nameEn: 'Lab Work', nameAr: 'عمل معمل', description: 'Laboratory work' }
] as const;

// Quiz Status Types
const QUIZ_STATUS_TYPES = [
  { code: 'DRAFT', nameEn: 'Draft', nameAr: 'مسودة', description: 'Quiz is being created' },
  { code: 'PUBLISHED', nameEn: 'Published', nameAr: 'منشور', description: 'Quiz is published and available' },
  { code: 'ACTIVE', nameEn: 'Active', nameAr: 'نشط', description: 'Quiz is currently active' },
  { code: 'CLOSED', nameEn: 'Closed', nameAr: 'مغلق', description: 'Quiz is closed for submissions' },
  { code: 'GRADED', nameEn: 'Graded', nameAr: 'مصحح', description: 'Quiz has been graded' },
  { code: 'ARCHIVED', nameEn: 'Archived', nameAr: 'مؤرشف', description: 'Quiz is archived' }
] as const;

// Question Difficulty Types
const QUESTION_DIFFICULTY_TYPES = [
  { code: 'EASY', nameEn: 'Easy', nameAr: 'سهل', description: 'Basic difficulty level' },
  { code: 'MEDIUM', nameEn: 'Medium', nameAr: 'متوسط', description: 'Intermediate difficulty level' },
  { code: 'HARD', nameEn: 'Hard', nameAr: 'صعب', description: 'Advanced difficulty level' },
  { code: 'EXPERT', nameEn: 'Expert', nameAr: 'خبير', description: 'Expert difficulty level' }
] as const;

// Schedule Types
const SCHEDULE_TYPES = [
  { code: 'REGULAR', nameEn: 'Regular Class', nameAr: 'فصل عادي', description: 'Regular scheduled class' },
  { code: 'MAKEUP', nameEn: 'Makeup Class', nameAr: 'فصل تعويضي', description: 'Makeup class session' },
  { code: 'EXTRA', nameEn: 'Extra Class', nameAr: 'فصل إضافي', description: 'Extra help session' },
  { code: 'REVIEW', nameEn: 'Review Session', nameAr: 'جلسة مراجعة', description: 'Exam review session' },
  { code: 'LAB', nameEn: 'Lab Session', nameAr: 'جلسة معمل', description: 'Laboratory session' },
  { code: 'TUTORIAL', nameEn: 'Tutorial', nameAr: 'درس تعليمي', description: 'Tutorial session' }
] as const;

// Template Types
const TEMPLATE_TYPES = [
  { code: 'EMAIL', nameEn: 'Email Template', nameAr: 'قالب بريد إلكتروني', description: 'Email notification template' },
  { code: 'SMS', nameEn: 'SMS Template', nameAr: 'قالب رسالة نصية', description: 'SMS notification template' },
  { code: 'CERTIFICATE', nameEn: 'Certificate Template', nameAr: 'قالب شهادة', description: 'Certificate template' },
  { code: 'REPORT', nameEn: 'Report Template', nameAr: 'قالب تقرير', description: 'Report generation template' },
  { code: 'FORM', nameEn: 'Form Template', nameAr: 'قالب نموذج', description: 'Form template' }
] as const;

// Config Types
const CONFIG_TYPES = [
  { code: 'SYSTEM', nameEn: 'System Config', nameAr: 'إعدادات النظام', description: 'System-wide configuration' },
  { code: 'ACADEMIC', nameEn: 'Academic Config', nameAr: 'إعدادات أكاديمية', description: 'Academic settings' },
  { code: 'NOTIFICATION', nameEn: 'Notification Config', nameAr: 'إعدادات الإشعارات', description: 'Notification settings' },
  { code: 'SECURITY', nameEn: 'Security Config', nameAr: 'إعدادات الأمان', description: 'Security settings' },
  { code: 'INTEGRATION', nameEn: 'Integration Config', nameAr: 'إعدادات التكامل', description: 'Third-party integrations' }
] as const;

// Attendance Status Types
const ATTENDANCE_STATUS_TYPES = [
  { code: 'PRESENT', nameEn: 'Present', nameAr: 'حاضر', description: 'Student is present' },
  { code: 'ABSENT', nameEn: 'Absent', nameAr: 'غائب', description: 'Student is absent' },
  { code: 'LATE', nameEn: 'Late', nameAr: 'متأخر', description: 'Student arrived late' },
  { code: 'EXCUSED', nameEn: 'Excused', nameAr: 'معذور', description: 'Student has excused absence' },
  { code: 'SICK_LEAVE', nameEn: 'Sick Leave', nameAr: 'إجازة مرضية', description: 'Student on sick leave' },
  { code: 'EARLY_DEPARTURE', nameEn: 'Early Departure', nameAr: 'مغادرة مبكرة', description: 'Student left early' }
] as const;

// Submission Status Types
const SUBMISSION_STATUS_TYPES = [
  { code: 'DRAFT', nameEn: 'Draft', nameAr: 'مسودة', description: 'Submission is in draft' },
  { code: 'SUBMITTED', nameEn: 'Submitted', nameAr: 'مقدم', description: 'Assignment has been submitted' },
  { code: 'UNDER_REVIEW', nameEn: 'Under Review', nameAr: 'قيد المراجعة', description: 'Submission is being reviewed' },
  { code: 'GRADED', nameEn: 'Graded', nameAr: 'مصحح', description: 'Submission has been graded' },
  { code: 'RETURNED', nameEn: 'Returned', nameAr: 'معاد', description: 'Submission returned for revision' },
  { code: 'APPROVED', nameEn: 'Approved', nameAr: 'موافق عليه', description: 'Submission is approved' },
  { code: 'LATE', nameEn: 'Late', nameAr: 'متأخر', description: 'Submission was late' }
] as const;

// Penalty Types
const PENALTY_TYPES = [
  { code: 'LATE_SUBMISSION', nameEn: 'Late Submission', nameAr: 'تقديم متأخر', description: 'Assignment submitted after deadline', severity: 'low', color: '#FFA500' },
  { code: 'ABSENCE', nameEn: 'Unexcused Absence', nameAr: 'غياب بدون عذر', description: 'Absent without valid excuse', severity: 'medium', color: '#FF6347' },
  { code: 'MISCONDUCT', nameEn: 'Misconduct', nameAr: 'سوء سلوك', description: 'Behavioral misconduct', severity: 'high', color: '#DC143C' },
  { code: 'CHEATING', nameEn: 'Cheating', nameAr: 'غش', description: 'Academic dishonesty', severity: 'high', color: '#8B0000' },
  { code: 'PLAGIARISM', nameEn: 'Plagiarism', nameAr: 'انتحال', description: 'Plagiarized work', severity: 'high', color: '#8B0000' },
  { code: 'DISRUPTION', nameEn: 'Class Disruption', nameAr: 'تعطيل الفصل', description: 'Disrupting class activities', severity: 'medium', color: '#FF4500' },
  { code: 'DRESS_CODE', nameEn: 'Dress Code Violation', nameAr: 'مخالفة قواعد اللباس', description: 'Violation of dress code', severity: 'low', color: '#FFD700' }
] as const;

// Behavior Types
const BEHAVIOR_TYPES = [
  { code: 'EXCELLENT_PARTICIPATION', nameEn: 'Excellent Participation', nameAr: 'مشاركة ممتازة', description: 'Outstanding class participation', category: 'positive', points: 5, color: '#28A745' },
  { code: 'HELPING_PEERS', nameEn: 'Helping Peers', nameAr: 'مساعدة الزملاء', description: 'Helping other students', category: 'positive', points: 3, color: '#20C997' },
  { code: 'LEADERSHIP', nameEn: 'Leadership', nameAr: 'قيادة', description: 'Demonstrating leadership skills', category: 'positive', points: 5, color: '#17A2B8' },
  { code: 'CREATIVITY', nameEn: 'Creativity', nameAr: 'إبداع', description: 'Creative problem solving', category: 'positive', points: 4, color: '#6F42C1' },
  { code: 'IMPROVEMENT', nameEn: 'Significant Improvement', nameAr: 'تحسن ملحوظ', description: 'Notable academic improvement', category: 'positive', points: 4, color: '#007BFF' },
  { code: 'DISRUPTIVE', nameEn: 'Disruptive Behavior', nameAr: 'سلوك مزعج', description: 'Disrupting class', category: 'negative', points: -3, color: '#FFC107' },
  { code: 'DISRESPECTFUL', nameEn: 'Disrespectful', nameAr: 'عدم احترام', description: 'Disrespectful to instructor or peers', category: 'negative', points: -5, color: '#DC3545' },
  { code: 'UNPREPARED', nameEn: 'Unprepared', nameAr: 'غير مستعد', description: 'Consistently unprepared for class', category: 'negative', points: -2, color: '#FD7E14' }
] as const;

// Priority Types
const PRIORITY_TYPES = [
  { code: 'LOW', nameEn: 'Low Priority', nameAr: 'أولوية منخفضة', description: 'Low priority announcement', level: 1, color: '#6C757D' },
  { code: 'NORMAL', nameEn: 'Normal Priority', nameAr: 'أولوية عادية', description: 'Normal priority announcement', level: 2, color: '#007BFF' },
  { code: 'HIGH', nameEn: 'High Priority', nameAr: 'أولوية عالية', description: 'High priority announcement', level: 3, color: '#FFC107' },
  { code: 'URGENT', nameEn: 'Urgent', nameAr: 'عاجل', description: 'Urgent announcement', level: 4, color: '#DC3545' },
  { code: 'CRITICAL', nameEn: 'Critical', nameAr: 'حرج', description: 'Critical announcement', level: 5, color: '#8B0000' }
] as const;

// Resource Types
const RESOURCE_TYPES = [
  { code: 'DOCUMENT', nameEn: 'Document', nameAr: 'مستند', description: 'Document file', icon: 'file-text' },
  { code: 'VIDEO', nameEn: 'Video', nameAr: 'فيديو', description: 'Video file', icon: 'video' },
  { code: 'AUDIO', nameEn: 'Audio', nameAr: 'صوت', description: 'Audio file', icon: 'music' },
  { code: 'IMAGE', nameEn: 'Image', nameAr: 'صورة', description: 'Image file', icon: 'image' },
  { code: 'PRESENTATION', nameEn: 'Presentation', nameAr: 'عرض تقديمي', description: 'Presentation file', icon: 'presentation' },
  { code: 'SPREADSHEET', nameEn: 'Spreadsheet', nameAr: 'جدول بيانات', description: 'Spreadsheet file', icon: 'table' },
  { code: 'LINK', nameEn: 'External Link', nameAr: 'رابط خارجي', description: 'External URL', icon: 'link' },
  { code: 'ARCHIVE', nameEn: 'Archive', nameAr: 'أرشيف', description: 'Compressed archive', icon: 'archive' }
] as const;

// Category Types
const CATEGORY_TYPES = [
  { code: 'LECTURE_NOTES', nameEn: 'Lecture Notes', nameAr: 'ملاحظات المحاضرة', descriptionEn: 'Lecture notes and slides', descriptionAr: 'ملاحظات المحاضرة والشرائح', icon: 'book-open' },
  { code: 'ASSIGNMENT', nameEn: 'Assignment', nameAr: 'واجب', descriptionEn: 'Assignment materials', descriptionAr: 'مواد الواجب', icon: 'clipboard' },
  { code: 'READING', nameEn: 'Reading Material', nameAr: 'مواد القراءة', descriptionEn: 'Required reading materials', descriptionAr: 'مواد القراءة المطلوبة', icon: 'book' },
  { code: 'REFERENCE', nameEn: 'Reference', nameAr: 'مرجع', descriptionEn: 'Reference materials', descriptionAr: 'مواد مرجعية', icon: 'bookmark' },
  { code: 'TUTORIAL', nameEn: 'Tutorial', nameAr: 'درس تعليمي', descriptionEn: 'Tutorial materials', descriptionAr: 'مواد تعليمية', icon: 'help-circle' },
  { code: 'EXAM_PREP', nameEn: 'Exam Preparation', nameAr: 'تحضير الامتحان', descriptionEn: 'Exam preparation materials', descriptionAr: 'مواد تحضير الامتحان', icon: 'file-check' },
  { code: 'SUPPLEMENTARY', nameEn: 'Supplementary', nameAr: 'تكميلي', descriptionEn: 'Supplementary materials', descriptionAr: 'مواد تكميلية', icon: 'plus-circle' }
] as const;

// Question Types
const QUESTION_TYPES = [
  { code: 'MULTIPLE_CHOICE', nameEn: 'Multiple Choice', nameAr: 'اختيار من متعدد', description: 'Multiple choice question' },
  { code: 'TRUE_FALSE', nameEn: 'True/False', nameAr: 'صح/خطأ', description: 'True or false question' },
  { code: 'SHORT_ANSWER', nameEn: 'Short Answer', nameAr: 'إجابة قصيرة', description: 'Short answer question' },
  { code: 'ESSAY', nameEn: 'Essay', nameAr: 'مقال', description: 'Essay question' },
  { code: 'FILL_BLANK', nameEn: 'Fill in the Blank', nameAr: 'املأ الفراغ', description: 'Fill in the blank question' }
] as const;

// Target Audience Types
const TARGET_AUDIENCE_TYPES = [
  { code: 'ALL', nameEn: 'All Users', nameAr: 'جميع المستخدمين', description: 'All system users' },
  { code: 'STUDENTS', nameEn: 'Students', nameAr: 'الطلاب', description: 'Students only' },
  { code: 'INSTRUCTORS', nameEn: 'Instructors', nameAr: 'المدربون', description: 'Instructors only' },
  { code: 'ADMIN', nameEn: 'Administrators', nameAr: 'المسؤولون', description: 'Administrators only' },
  { code: 'PROGRAM', nameEn: 'Program Specific', nameAr: 'برنامج محدد', description: 'Specific program users' },
  { code: 'CLASS', nameEn: 'Class Specific', nameAr: 'فصل محدد', description: 'Specific class users' }
] as const;

// Participation Types
const PARTICIPATION_TYPES = [
  { code: 'POSITIVE', nameEn: 'Positive Participation', nameAr: 'مشاركة إيجابية', description: 'Positive classroom participation', isPositive: true },
  { code: 'LATE', nameEn: 'Late Arrival', nameAr: 'تأخر عن الحضور', description: 'Student arrived late to class', isPositive: false },
  { code: 'HELPFUL', nameEn: 'Helpful Behavior', nameAr: 'سلوك مساعد', description: 'Student helped others', isPositive: true },
  { code: 'DISRUPTIVE', nameEn: 'Disruptive Behavior', nameAr: 'سلوك مزعج', description: 'Student caused disruption in class', isPositive: false },
  { code: 'EXCELLENT', nameEn: 'Excellent Work', nameAr: 'عمل ممتاز', description: 'Student demonstrated excellent understanding', isPositive: true }
] as const;

// Academic Terms
const ACADEMIC_TERMS = [
  { code: '2024-FALL', nameEn: 'Fall 2024', nameAr: 'خريف 2024', description: 'Fall semester 2024', isActive: true },
  { code: '2025-SPRING', nameEn: 'Spring 2025', nameAr: 'ربيع 2025', description: 'Spring semester 2025', isActive: false },
  { code: '2025-SUMMER', nameEn: 'Summer 2025', nameAr: 'صيف 2025', description: 'Summer semester 2025', isActive: false },
  { code: '2025-FALL', nameEn: 'Fall 2025', nameAr: 'خريف 2025', description: 'Fall semester 2025', isActive: false },
  { code: '2026-SPRING', nameEn: 'Spring 2026', nameAr: 'ربيع 2026', description: 'Spring semester 2026', isActive: false },
  { code: '2026-SUMMER', nameEn: 'Summer 2026', nameAr: 'صيف 2026', description: 'Summer semester 2026', isActive: false },
  { code: '2026-FALL', nameEn: 'Fall 2026', nameAr: 'خريف 2026', description: 'Fall semester 2026', isActive: false }
] as const;

// Generic seeding function
async function seedTable(modelName: string, data: any[], uniqueField: string = 'code') {
  try {
    console.log(`🌱 Seeding ${modelName}...`);
    
    for (const item of data) {
      const existing = await (prisma as any)[modelName].findFirst({
        where: { [uniqueField]: item[uniqueField] }
      });
      
      if (!existing) {
        await (prisma as any)[modelName].create({ data: item });
        console.log(`  ✅ Created ${modelName}: ${item[uniqueField]}`);
      } else {
        console.log(`  ℹ️  ${modelName} already exists: ${item[uniqueField]}`);
      }
    }
    
    const count = await (prisma as any)[modelName].count();
    console.log(`✅ ${modelName} complete. Total: ${count}\n`);
  } catch (error) {
    console.error(`❌ Error seeding ${modelName}:`, error);
    throw error;
  }
}

async function seedAll() {
  try {
    console.log('🚀 Starting comprehensive database seeding...\n');
    
    // Seed all lookup tables in dependency order
    await seedTable('userRoles', USER_ROLES);
    await seedTable('userStatusTypes', USER_STATUS_TYPES);
    await seedTable('enrollmentStatusTypes', ENROLLMENT_STATUS_TYPES);
    await seedTable('subjectTypes', SUBJECT_TYPES);
    await seedTable('requirementTypes', REQUIREMENT_TYPES);
    await seedTable('penaltyTypes', PENALTY_TYPES);
    await seedTable('behaviorTypes', BEHAVIOR_TYPES);
    await seedTable('priorityTypes', PRIORITY_TYPES);
    await seedTable('resourceTypes', RESOURCE_TYPES);
    await seedTable('categoryTypes', CATEGORY_TYPES);
    await seedTable('questionTypes', QUESTION_TYPES);
    await seedTable('targetAudienceTypes', TARGET_AUDIENCE_TYPES);
    await seedTable('participationTypes', PARTICIPATION_TYPES);
    await seedTable('activityTypes', ACTIVITY_TYPES);
    await seedTable('activityLogActionTypes', ACTIVITY_LOG_ACTION_TYPES);
    await seedTable('assessmentTypes', ASSESSMENT_TYPES);
    await seedTable('quizStatusTypes', QUIZ_STATUS_TYPES);
    await seedTable('questionDifficultyTypes', QUESTION_DIFFICULTY_TYPES);
    await seedTable('scheduleTypes', SCHEDULE_TYPES);
    await seedTable('templateTypes', TEMPLATE_TYPES);
    await seedTable('configTypes', CONFIG_TYPES);
    await seedTable('attendanceStatusTypes', ATTENDANCE_STATUS_TYPES);
    await seedTable('submissionStatusTypes', SUBMISSION_STATUS_TYPES);
    await seedTable('academicTerms', ACADEMIC_TERMS);
    
    console.log('🎉 Comprehensive seeding completed successfully!');
    console.log('\n📋 Summary of seeded tables:');
    console.log('  - User Roles (5 types)');
    console.log('  - User Status Types (4 types)');
    console.log('  - Enrollment Status Types (7 types)');
    console.log('  - Subject Types (3 types)');
    console.log('  - Requirement Types (3 types)');
    console.log('  - Penalty Types (7 types)');
    console.log('  - Behavior Types (8 types)');
    console.log('  - Priority Types (5 types)');
    console.log('  - Resource Types (8 types)');
    console.log('  - Category Types (7 types)');
    console.log('  - Question Types (5 types)');
    console.log('  - Target Audience Types (6 types)');
    console.log('  - Participation Types (5 types)');
    console.log('  - Activity Types (8 types)');
    console.log('  - Activity Log Action Types (9 types)');
    console.log('  - Assessment Types (8 types)');
    console.log('  - Quiz Status Types (6 types)');
    console.log('  - Question Difficulty Types (4 types)');
    console.log('  - Schedule Types (6 types)');
    console.log('  - Template Types (5 types)');
    console.log('  - Config Types (5 types)');
    console.log('  - Attendance Status Types (6 types)');
    console.log('  - Submission Status Types (7 types)');
    console.log('  - Academic Terms (7 terms)');
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed
seedAll()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
