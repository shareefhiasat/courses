/**
 * Notification Templates - Localized message templates
 * 
 * Provides English and Arabic templates for each notification event type.
 * Templates support variable substitution using {{variable}} syntax.
 */

import { EVENTS, CATEGORIES, PRIORITIES, getCategoryFromEvent, getPriorityFromEvent } from './constants.js';

// Raw template strings for each event
const RAW_TEMPLATES = {
  // Workflow events
  [EVENTS.WORKFLOW_SUBMITTED]: {
    en: '{{workflowName}}',
    ar: '{{workflowName}}'
  },
  [EVENTS.WORKFLOW_ASSIGNED]: {
    en: '{{workflowName}}',
    ar: '{{workflowName}}'
  },
  [EVENTS.WORKFLOW_APPROVED]: {
    en: '{{workflowName}}',
    ar: '{{workflowName}}'
  },
  [EVENTS.WORKFLOW_REJECTED]: {
    en: '{{workflowName}}',
    ar: '{{workflowName}}'
  },
  [EVENTS.WORKFLOW_RETURNED]: {
    en: '{{workflowName}}',
    ar: '{{workflowName}}'
  },
  [EVENTS.WORKFLOW_SENT_FOR_REVIEW]: {
    en: '{{workflowName}}',
    ar: '{{workflowName}}'
  },
  [EVENTS.WORKFLOW_RESUBMITTED]: {
    en: '{{workflowName}}',
    ar: '{{workflowName}}'
  },
  [EVENTS.WORKFLOW_COMPLETED]: {
    en: '{{workflowName}}',
    ar: '{{workflowName}}'
  },
  [EVENTS.WORKFLOW_SLA_WARNING]: {
    en: '{{workflowName}} — approaching deadline',
    ar: '{{workflowName}} — يقترب من الموعد النهائي'
  },
  [EVENTS.WORKFLOW_SLA_OVERDUE]: {
    en: '{{workflowName}} — deadline exceeded',
    ar: '{{workflowName}} — تجاوز الموعد النهائي'
  },
  [EVENTS.WORKFLOW_WITHDRAWN]: {
    en: '{{workflowName}} — by {{actorName}}',
    ar: '{{workflowName}} — بواسطة {{actorName}}'
  },
  [EVENTS.WORKFLOW_COMMENT_ADDED]: {
    en: '{{authorName}}: {{commentPreview}}',
    ar: '{{authorName}}: {{commentPreview}}'
  },
  [EVENTS.WORKFLOW_AMENDED]: {
    en: '{{workflowName}}',
    ar: '{{workflowName}}'
  },
  
  // Announcement events
  [EVENTS.ANNOUNCEMENT_POSTED]: {
    en: 'New announcement: {{title}}',
    ar: 'إعلان جديد: {{title}}'
  },
  [EVENTS.ANNOUNCEMENT_UPDATED]: {
    en: 'Announcement updated: {{title}}',
    ar: 'تم تحديث الإعلان: {{title}}'
  },
  [EVENTS.ANNOUNCEMENT_DELETED]: {
    en: 'Announcement "{{title}}" has been deleted',
    ar: 'تم حذف الإعلان "{{title}}"'
  },
  
  // QR events
  [EVENTS.QR_CODE_SENT]: {
    en: 'QR code has been sent to {{recipient}}',
    ar: 'تم إرسال رمز QR إلى {{recipient}}'
  },
  [EVENTS.QR_CODE_GENERATED]: {
    en: 'QR code has been generated for {{purpose}}',
    ar: 'تم إنشاء رمز QR لـ {{purpose}}'
  },
  
  // Standup Attendance events
  [EVENTS.STANDUP_ATTENDANCE_MARKED]: {
    en: 'Standup attendance marked for {{studentName}} on {{date}} — Status: {{statusName}}',
    ar: 'تم تسجيل الحضور اليومي لـ {{studentNameAr}} في {{date}} — الحالة: {{statusNameAr}}'
  },
  [EVENTS.STANDUP_ATTENDANCE_UPDATED]: {
    en: 'Standup attendance updated for {{studentName}} on {{date}} — Status: {{statusName}}',
    ar: 'تم تحديث الحضور اليومي لـ {{studentNameAr}} في {{date}} — الحالة: {{statusNameAr}}'
  },

  // Attendance events
  [EVENTS.ATTENDANCE_MARKED]: {
    en: 'Attendance has been marked for {{studentName}} on {{date}}',
    ar: 'تم تسجيل الحضور لـ {{studentName}} في {{date}}'
  },
  [EVENTS.ATTENDANCE_MARKED_PRESENT]: {
    en: '{{studentName}} was marked present on {{date}}',
    ar: 'تم تسجيل {{studentName}} حاضرًا في {{date}}'
  },
  [EVENTS.ATTENDANCE_MARKED_ABSENT]: {
    en: '{{studentName}} was marked absent on {{date}}',
    ar: 'تم تسجيل {{studentName}} غائبًا في {{date}}'
  },
  [EVENTS.ATTENDANCE_MARKED_LATE]: {
    en: '{{studentName}} was marked late on {{date}}',
    ar: 'تم تسجيل {{studentName}} متأخرًا في {{date}}'
  },
  [EVENTS.ATTENDANCE_MARKED_EXCUSED]: {
    en: '{{studentName}} was marked excused on {{date}}',
    ar: 'تم تسجيل {{studentName}} معذورًا في {{date}}'
  },
  [EVENTS.ATTENDANCE_THRESHOLD_WARNING]: {
    en: 'Attendance warning: {{studentName}} has {{absenceCount}} unexcused absences in {{className}}',
    ar: 'تحذير الحضور: {{studentName}} لديه {{absenceCount}} غياب غير مبرر في {{className}}'
  },
  [EVENTS.ATTENDANCE_PATTERN_DETECTED]: {
    en: 'Attendance pattern detected for {{studentName}}',
    ar: 'تم اكتشاف نمط الحضور لـ {{studentName}}'
  },
  
  // Behavior events
  [EVENTS.BEHAVIOR_RECORDED]: {
    en: 'Behavior record added for {{studentName}}: {{behaviorType}}',
    ar: 'تمت إضافة سجل سلوك لـ {{studentName}}: {{behaviorType}}'
  },
  [EVENTS.BEHAVIOR_POSITIVE_RECORDED]: {
    en: 'Positive behavior recorded for {{studentName}}: {{behaviorType}}',
    ar: 'تم تسجيل سلوك إيجابي لـ {{studentName}}: {{behaviorType}}'
  },
  [EVENTS.BEHAVIOR_NEGATIVE_RECORDED]: {
    en: 'Negative behavior recorded for {{studentName}}: {{behaviorType}}',
    ar: 'تم تسجيل سلوك سلبي لـ {{studentName}}: {{behaviorType}}'
  },
  [EVENTS.BEHAVIOR_UPDATED]: {
    en: 'Behavior record updated for {{studentName}}',
    ar: 'تم تحديث سجل السلوك لـ {{studentName}}'
  },
  [EVENTS.BEHAVIOR_DELETED]: {
    en: 'Behavior record deleted for {{studentName}}',
    ar: 'تم حذف سجل السلوك لـ {{studentName}}'
  },
  
  // Participation events
  [EVENTS.PARTICIPATION_RECORDED]: {
    en: 'Participation recorded for {{studentName}}: {{participationType}}',
    ar: 'تم تسجيل المشاركة لـ {{studentName}}: {{participationType}}'
  },
  [EVENTS.PARTICIPATION_EXPLAINED_LESSON]: {
    en: '{{studentName}} explained the lesson',
    ar: 'شرح {{studentName}} الدرس'
  },
  [EVENTS.PARTICIPATION_GAVE_PROJECT]: {
    en: '{{studentName}} presented a project',
    ar: 'قدم {{studentName}} مشروعًا'
  },
  [EVENTS.PARTICIPATION_GAVE_PAPER]: {
    en: '{{studentName}} presented a paper',
    ar: 'قدم {{studentName}} ورقة'
  },
  [EVENTS.PARTICIPATION_GAVE_RESEARCH]: {
    en: '{{studentName}} presented research',
    ar: 'قدم {{studentName}} بحثًا'
  },
  [EVENTS.PARTICIPATION_ACTIVE_DISCUSSION]: {
    en: '{{studentName}} participated in active discussion',
    ar: 'شارك {{studentName}} في نقاش نشط'
  },
  [EVENTS.PARTICIPATION_ANSWERED_QUESTION]: {
    en: '{{studentName}} answered a question',
    ar: 'أجاب {{studentName}} على سؤال'
  },
  [EVENTS.PARTICIPATION_HELPED_CLASSMATE]: {
    en: '{{studentName}} helped a classmate',
    ar: 'ساعد {{studentName}} زميلًا'
  },
  [EVENTS.PARTICIPATION_EXCELLENT]: {
    en: '{{studentName}} showed excellent participation',
    ar: 'أظهر {{studentName}} مشاركة ممتازة'
  },
  [EVENTS.PARTICIPATION_UPDATED]: {
    en: 'Participation record updated for {{studentName}}',
    ar: 'تم تحديث سجل المشاركة لـ {{studentName}}'
  },
  [EVENTS.PARTICIPATION_DELETED]: {
    en: 'Participation record deleted for {{studentName}}',
    ar: 'تم حذف سجل المشاركة لـ {{studentName}}'
  },
  
  // Penalty events
  [EVENTS.PENALTY_ASSIGNED]: {
    en: 'Penalty assigned to {{studentName}}: {{penaltyType}}',
    ar: 'تم توقيع عقوبة على {{studentName}}: {{penaltyType}}'
  },
  [EVENTS.PENALTY_ASSIGNED_LATE]: {
    en: 'Late penalty assigned to {{studentName}}',
    ar: 'تم توقيع عقوبة التأخير على {{studentName}}'
  },
  [EVENTS.PENALTY_ASSIGNED_ABSENT]: {
    en: 'Absence penalty assigned to {{studentName}}',
    ar: 'تم توقيع عقوبة الغياب على {{studentName}}'
  },
  [EVENTS.PENALTY_ASSIGNED_MISCONDUCT]: {
    en: 'Misconduct penalty assigned to {{studentName}}',
    ar: 'تم توقيع عقوبة سوء السلوك على {{studentName}}'
  },
  [EVENTS.PENALTY_UPDATED]: {
    en: 'Penalty updated for {{studentName}}',
    ar: 'تم تحديث العقوبة لـ {{studentName}}'
  },
  [EVENTS.PENALTY_DELETED]: {
    en: 'Penalty deleted for {{studentName}}',
    ar: 'تم حذف العقوبة لـ {{studentName}}'
  },
  [EVENTS.PENALTY_WAIVED]: {
    en: 'Penalty waived for {{studentName}}',
    ar: 'تم إعفاء {{studentName}} من العقوبة'
  },
  
  // File events
  [EVENTS.FILE_SHARED]: {
    en: 'File shared with you: {{fileName}}',
    ar: 'تمت مشاركة ملف معك: {{fileName}}'
  },
  [EVENTS.FILE_UPLOADED]: {
    en: 'File uploaded: {{fileName}}',
    ar: 'تم رفع ملف: {{fileName}}'
  },
  [EVENTS.FILE_DOWNLOADED]: {
    en: 'File downloaded: {{fileName}}',
    ar: 'تم تنزيل ملف: {{fileName}}'
  },
  [EVENTS.FILE_DELETED]: {
    en: 'File deleted: {{fileName}}',
    ar: 'تم حذف ملف: {{fileName}}'
  },
  
  // Resource events
  [EVENTS.RESOURCE_ADDED]: {
    en: 'New resource added: {{resourceName}}',
    ar: 'تمت إضافة مورد جديد: {{resourceName}}'
  },
  [EVENTS.RESOURCE_UPDATED]: {
    en: 'Resource updated: {{resourceName}}',
    ar: 'تم تحديث المورد: {{resourceName}}'
  },
  [EVENTS.RESOURCE_DELETED]: {
    en: 'Resource deleted: {{resourceName}}',
    ar: 'تم حذف المورد: {{resourceName}}'
  },
  [EVENTS.RESOURCE_SHARED]: {
    en: 'Resource shared with you: {{resourceName}}',
    ar: 'تمت مشاركة مورد معك: {{resourceName}}'
  },
  
  // Drive/Storage events
  [EVENTS.DRIVE_FILE_SHARED]: {
    en: '{{fileName}} has been shared with you by {{sharedBy}}',
    ar: 'قام {{sharedBy}} بمشاركة {{fileName}} معك'
  },
  [EVENTS.DRIVE_FOLDER_SHARED]: {
    en: '{{folderName}} folder has been shared with you by {{sharedBy}}',
    ar: 'قام {{sharedBy}} بمشاركة مجلد {{folderName}} معك'
  },
  [EVENTS.DRIVE_PERMISSION_REVOKED]: {
    en: 'Your access to {{itemName}} has been revoked by {{revokedBy}}',
    ar: 'تم إلغاء وصولك إلى {{itemName}} بواسطة {{revokedBy}}'
  },
  [EVENTS.DRIVE_FILE_UPLOADED]: {
    en: '{{fileName}} was uploaded to {{folderName}} by {{uploadedBy}}',
    ar: 'قام {{uploadedBy}} برفع {{fileName}} إلى {{folderName}}'
  },
  [EVENTS.DRIVE_FOLDER_CREATED]: {
    en: '{{folderName}} folder was created by {{createdBy}}',
    ar: 'قام {{createdBy}} بإنشاء مجلد {{folderName}}'
  },
  [EVENTS.DRIVE_FILE_DELETED]: {
    en: '{{fileName}} was deleted by {{deletedBy}}',
    ar: 'قام {{deletedBy}} بحذف {{fileName}}'
  },
  [EVENTS.DRIVE_FOLDER_DELETED]: {
    en: '{{folderName}} folder was deleted by {{deletedBy}}',
    ar: 'قام {{deletedBy}} بحذف مجلد {{folderName}}'
  },
  [EVENTS.DRIVE_FOLDER_RESTORED]: {
    en: '{{folderName}} folder was restored by {{restoredBy}}',
    ar: 'قام {{restoredBy}} باستعادة مجلد {{folderName}}'
  },
  [EVENTS.DRIVE_COMMENT_ADDED]: {
    en: '{{commenter}} added a comment on {{fileName}}: {{commentText}}',
    ar: 'أضاف {{commenter}} تعليقاً على {{fileName}}: {{commentText}}'
  },
  [EVENTS.DRIVE_COMMENT_UPDATED]: {
    en: '{{commenter}} updated a comment on {{fileName}}: {{commentText}}',
    ar: 'قام {{commenter}} بتحديث تعليق على {{fileName}}: {{commentText}}'
  },
  [EVENTS.DRIVE_COMMENT_DELETED]: {
    en: '{{commenter}} deleted a comment on {{fileName}}',
    ar: 'قام {{commenter}} بحذف تعليق على {{fileName}}'
  },
  [EVENTS.DRIVE_PUBLIC_LINK_CREATED]: {
    en: 'A public link was created for {{itemName}} by {{createdBy}}',
    ar: 'تم إنشاء رابط عام لـ {{itemName}} بواسطة {{createdBy}}'
  },
  [EVENTS.DRIVE_PUBLIC_LINK_REVOKED]: {
    en: 'The public link for {{itemName}} has been revoked by {{revokedBy}}',
    ar: 'تم إلغاء الرابط العام لـ {{itemName}} بواسطة {{revokedBy}}'
  },
  
  // Enrollment events
  [EVENTS.ENROLLMENT_CONFIRMED]: {
    en: 'Enrollment confirmed for {{studentName}} in {{courseName}}',
    ar: 'تم تأكيد تسجيل {{studentName}} في {{courseName}}'
  },
  [EVENTS.ENROLLMENT_PENDING]: {
    en: 'Enrollment pending for {{studentName}} in {{courseName}}',
    ar: 'التسجيل معلق لـ {{studentName}} في {{courseName}}'
  },
  [EVENTS.ENROLLMENT_APPROVED]: {
    en: 'Enrollment approved for {{studentName}} in {{courseName}}',
    ar: 'تمت الموافقة على تسجيل {{studentName}} في {{courseName}}'
  },
  [EVENTS.ENROLLMENT_REJECTED]: {
    en: 'Enrollment rejected for {{studentName}} in {{courseName}}',
    ar: 'تم رفض تسجيل {{studentName}} في {{courseName}}'
  },
  [EVENTS.ENROLLMENT_DROPPED]: {
    en: '{{studentName}} has dropped {{courseName}}',
    ar: 'انسحب {{studentName}} من {{courseName}}'
  },
  [EVENTS.ENROLLMENT_COMPLETED]: {
    en: '{{studentName}} has completed {{courseName}}',
    ar: 'أكمل {{studentName}} {{courseName}}'
  },
  
  // Grade events
  [EVENTS.GRADE_POSTED]: {
    en: 'Grade posted for {{studentName}} in {{subjectName}}: {{grade}}',
    ar: 'تم نشر درجة {{studentName}} في {{subjectName}}: {{grade}}'
  },
  [EVENTS.GRADE_UPDATED]: {
    en: 'Grade updated for {{studentName}} in {{subjectName}}',
    ar: 'تم تحديث درجة {{studentName}} في {{subjectName}}'
  },
  [EVENTS.GRADE_CALCULATED]: {
    en: 'Grade calculated for {{studentName}} in {{subjectName}}',
    ar: 'تم حساب درجة {{studentName}} في {{subjectName}}'
  },
  [EVENTS.GRADE_FINAL]: {
    en: 'Final grade posted for {{studentName}} in {{subjectName}}: {{grade}}',
    ar: 'تم نشر الدرجة النهائية لـ {{studentName}} في {{subjectName}}: {{grade}}'
  },
  [EVENTS.MARKS_UPDATED]: {
    en: 'Marks updated for {{studentName}} in {{subjectName}}',
    ar: 'تم تحديث الدرجات لـ {{studentName}} في {{subjectName}}'
  },
  [EVENTS.REPEATED_ATTEMPT_GRADED]: {
    en: 'Repeated attempt graded for {{studentName}} in {{subjectName}}',
    ar: 'تم تقييم المحاولة المتكررة لـ {{studentName}} في {{subjectName}}'
  },
  
  // Quiz events
  [EVENTS.QUIZ_AVAILABLE]: {
    en: 'Quiz "{{quizName}}" is now available',
    ar: 'الاختبار "{{quizName}}" متاح الآن'
  },
  [EVENTS.QUIZ_STARTED]: {
    en: '{{studentName}} started quiz "{{quizName}}"',
    ar: 'بدأ {{studentName}} الاختبار "{{quizName}}"'
  },
  [EVENTS.QUIZ_SUBMITTED]: {
    en: '{{studentName}} submitted quiz "{{quizName}}"',
    ar: 'قدم {{studentName}} الاختبار "{{quizName}}"'
  },
  [EVENTS.QUIZ_GRADED]: {
    en: 'Quiz "{{quizName}}" graded for {{studentName}}: {{score}}',
    ar: 'تم تقييم الاختبار "{{quizName}}" لـ {{studentName}}: {{score}}'
  },
  [EVENTS.QUIZ_TIME_WARNING]: {
    en: 'Quiz "{{quizName}}" time warning: {{minutes}} minutes remaining',
    ar: 'تحذير وقت الاختبار "{{quizName}}": {{minutes}} دقيقة متبقية'
  },
  
  // Assignment events
  [EVENTS.ASSIGNMENT_CREATED]: {
    en: 'New assignment created: {{assignmentName}}',
    ar: 'تم إنشاء مهمة جديدة: {{assignmentName}}'
  },
  [EVENTS.ASSIGNMENT_DUE]: {
    en: 'Assignment "{{assignmentName}}" is due on {{dueDate}}',
    ar: 'المهمة "{{assignmentName}}" مستحقة في {{dueDate}}'
  },
  [EVENTS.ASSIGNMENT_DUE_SOON]: {
    en: 'Assignment "{{assignmentName}}" is due soon: {{dueDate}}',
    ar: 'المهمة "{{assignmentName}}" مستحقة قريبًا: {{dueDate}}'
  },
  [EVENTS.ASSIGNMENT_SUBMITTED]: {
    en: '{{studentName}} submitted assignment "{{assignmentName}}"',
    ar: 'قدم {{studentName}} المهمة "{{assignmentName}}"'
  },
  [EVENTS.ASSIGNMENT_GRADED]: {
    en: 'Assignment "{{assignmentName}}" graded for {{studentName}}: {{grade}}',
    ar: 'تم تقييم المهمة "{{assignmentName}}" لـ {{studentName}}: {{grade}}'
  },
  [EVENTS.ASSIGNMENT_OVERDUE]: {
    en: 'Assignment "{{assignmentName}}" is overdue',
    ar: 'المهمة "{{assignmentName}}" متأخرة'
  },
  
  // Activity events
  [EVENTS.ACTIVITY_ASSIGNED]: {
    en: 'Activity assigned: {{activityName}}',
    ar: 'تم تعيين نشاط: {{activityName}}'
  },
  [EVENTS.ACTIVITY_COMPLETED]: {
    en: '{{studentName}} completed activity "{{activityName}}"',
    ar: 'أكمل {{studentName}} النشاط "{{activityName}}"'
  },
  [EVENTS.ACTIVITY_GRADED]: {
    en: 'Activity "{{activityName}}" graded for {{studentName}}',
    ar: 'تم تقييم النشاط "{{activityName}}" لـ {{studentName}}'
  },
  [EVENTS.ACTIVITY_FEEDBACK]: {
    en: 'Feedback provided for activity "{{activityName}}"',
    ar: 'تم تقديم ملاحظات للنشاط "{{activityName}}"'
  },
  
  // System events
  [EVENTS.SYSTEM_ALERT]: {
    en: 'System alert: {{message}}',
    ar: 'تنبيه النظام: {{message}}'
  },
  [EVENTS.SYSTEM_MAINTENANCE]: {
    en: 'System maintenance scheduled: {{datetime}}',
    ar: 'صيانة النظام مجدولة: {{datetime}}'
  },
  [EVENTS.SYSTEM_UPDATE]: {
    en: 'System updated to version {{version}}',
    ar: 'تم تحديث النظام إلى الإصدار {{version}}'
  },
  [EVENTS.USER_ACCOUNT_CREATED]: {
    en: 'Account created for {{userName}}',
    ar: 'تم إنشاء حساب لـ {{userName}}'
  },
  [EVENTS.USER_PASSWORD_RESET]: {
    en: 'Password reset requested for {{email}}',
    ar: 'تم طلب إعادة تعيين كلمة المرور لـ {{email}}'
  },
  [EVENTS.USER_LOGIN]: {
    en: '{{userName}} logged in from {{location}}',
    ar: 'سجل {{userName}} الدخول من {{location}}'
  },

  // Chat events
  [EVENTS.CHAT_MESSAGE_RECEIVED]: {
    en: 'New message in {{roomName}} from {{senderName}}',
    ar: 'رسالة جديدة في {{roomName}} من {{senderName}}'
  },
  [EVENTS.CHAT_DM_RECEIVED]: {
    en: 'Direct message from {{senderName}}: {{messagePreview}}',
    ar: 'رسالة مباشرة من {{senderName}}: {{messagePreview}}'
  },
  [EVENTS.CHAT_MENTION]: {
    en: '{{senderName}} mentioned you in {{roomName}}',
    ar: 'ذكرك {{senderName}} في {{roomName}}'
  },
  [EVENTS.CHAT_ROOM_CREATED]: {
    en: 'New chat room created: {{roomName}}',
    ar: 'تم إنشاء غرفة محادثة جديدة: {{roomName}}'
  }
};

const RAW_TITLE_TEMPLATES = {
  [EVENTS.WORKFLOW_SUBMITTED]: { en: 'Workflow Confirmed', ar: 'تم تأكيد سير العمل' },
  [EVENTS.WORKFLOW_ASSIGNED]: { en: 'Workflow Assigned', ar: 'تم تعيين سير عمل' },
  [EVENTS.WORKFLOW_APPROVED]: { en: 'Workflow Approved', ar: 'تمت الموافقة على سير العمل' },
  [EVENTS.WORKFLOW_REJECTED]: { en: 'Workflow Rejected', ar: 'تم رفض سير العمل' },
  [EVENTS.WORKFLOW_RETURNED]: { en: 'Workflow Returned', ar: 'تم إرجاع سير العمل' },
  [EVENTS.WORKFLOW_SENT_FOR_REVIEW]: { en: 'Review Requested', ar: 'طلب مراجعة' },
  [EVENTS.WORKFLOW_RESUBMITTED]: { en: 'Workflow Resubmitted', ar: 'إعادة تقديم سير العمل' },
  [EVENTS.WORKFLOW_COMPLETED]: { en: 'Workflow Completed', ar: 'تم إكمال سير العمل' },
  [EVENTS.WORKFLOW_SLA_WARNING]: { en: 'SLA Warning', ar: 'تحذير SLA' },
  [EVENTS.WORKFLOW_SLA_OVERDUE]: { en: 'SLA Overdue', ar: 'تجاوز SLA' },
  [EVENTS.WORKFLOW_WITHDRAWN]: { en: 'Workflow Withdrawn', ar: 'تم سحب سير العمل' },
  [EVENTS.WORKFLOW_COMMENT_ADDED]: { en: 'New Comment', ar: 'تعليق جديد' },
  [EVENTS.WORKFLOW_AMENDED]: { en: 'Workflow Amended', ar: 'تم تعديل سير العمل' },
  [EVENTS.ANNOUNCEMENT_POSTED]: { en: 'New Announcement', ar: 'إعلان جديد' },
  [EVENTS.ANNOUNCEMENT_UPDATED]: { en: 'Announcement Updated', ar: 'تم تحديث الإعلان' },
  [EVENTS.ANNOUNCEMENT_DELETED]: { en: 'Announcement Deleted', ar: 'تم حذف الإعلان' },
  [EVENTS.QR_CODE_SENT]: { en: 'QR Code Sent', ar: 'تم إرسال رمز QR' },
  [EVENTS.QR_CODE_GENERATED]: { en: 'QR Code Generated', ar: 'تم إنشاء رمز QR' },
  [EVENTS.STANDUP_ATTENDANCE_MARKED]: { en: 'Standup Attendance Marked', ar: 'تم تسجيل الحضور اليومي' },
  [EVENTS.STANDUP_ATTENDANCE_UPDATED]: { en: 'Standup Attendance Updated', ar: 'تم تحديث الحضور اليومي' },
  [EVENTS.ATTENDANCE_MARKED]: { en: 'Attendance Marked', ar: 'تم تسجيل الحضور' },
  [EVENTS.ATTENDANCE_MARKED_PRESENT]: { en: 'Marked Present', ar: 'تم تسجيل الحاضر' },
  [EVENTS.ATTENDANCE_MARKED_ABSENT]: { en: 'Marked Absent', ar: 'تم تسجيل الغياب' },
  [EVENTS.ATTENDANCE_MARKED_LATE]: { en: 'Marked Late', ar: 'تم تسجيل التأخير' },
  [EVENTS.ATTENDANCE_MARKED_EXCUSED]: { en: 'Marked Excused', ar: 'تم تسجيل المعذور' },
  [EVENTS.ATTENDANCE_THRESHOLD_WARNING]: { en: 'Attendance Warning', ar: 'تحذير الحضور' },
  [EVENTS.ATTENDANCE_PATTERN_DETECTED]: { en: 'Attendance Pattern Detected', ar: 'تم اكتشاف نمط الحضور' },
  [EVENTS.BEHAVIOR_RECORDED]: { en: 'Behavior Recorded', ar: 'تم تسجيل السلوك' },
  [EVENTS.BEHAVIOR_POSITIVE_RECORDED]: { en: 'Positive Behavior', ar: 'سلوك إيجابي' },
  [EVENTS.BEHAVIOR_NEGATIVE_RECORDED]: { en: 'Negative Behavior', ar: 'سلوك سلبي' },
  [EVENTS.BEHAVIOR_UPDATED]: { en: 'Behavior Updated', ar: 'تم تحديث السلوك' },
  [EVENTS.BEHAVIOR_DELETED]: { en: 'Behavior Deleted', ar: 'تم حذف السلوك' },
  [EVENTS.PARTICIPATION_RECORDED]: { en: 'Participation Recorded', ar: 'تم تسجيل المشاركة' },
  [EVENTS.PARTICIPATION_UPDATED]: { en: 'Participation Updated', ar: 'تم تحديث المشاركة' },
  [EVENTS.PARTICIPATION_DELETED]: { en: 'Participation Deleted', ar: 'تم حذف المشاركة' },
  [EVENTS.PARTICIPATION_EXPLAINED_LESSON]: { en: 'Participation: Explained Lesson', ar: 'مشاركة: شرح الدرس' },
  [EVENTS.PARTICIPATION_GAVE_PROJECT]: { en: 'Participation: Gave Project', ar: 'مشاركة: قدم مشروع' },
  [EVENTS.PARTICIPATION_GAVE_PAPER]: { en: 'Participation: Gave Paper', ar: 'مشاركة: قدم ورقة' },
  [EVENTS.PARTICIPATION_GAVE_RESEARCH]: { en: 'Participation: Gave Research', ar: 'مشاركة: قدم بحث' },
  [EVENTS.PARTICIPATION_ACTIVE_DISCUSSION]: { en: 'Participation: Active Discussion', ar: 'مشاركة: نقاش نشط' },
  [EVENTS.PARTICIPATION_ANSWERED_QUESTION]: { en: 'Participation: Answered Question', ar: 'مشاركة: أجاب على سؤال' },
  [EVENTS.PARTICIPATION_HELPED_CLASSMATE]: { en: 'Participation: Helped Classmate', ar: 'مشاركة: ساعد زميل' },
  [EVENTS.PARTICIPATION_EXCELLENT]: { en: 'Participation: Excellent', ar: 'مشاركة: ممتاز' },
  [EVENTS.PENALTY_ASSIGNED]: { en: 'Penalty Assigned', ar: 'تم تخصيص عقوبة' },
  [EVENTS.PENALTY_ASSIGNED_LATE]: { en: 'Penalty: Late', ar: 'عقوبة: تأخير' },
  [EVENTS.PENALTY_ASSIGNED_ABSENT]: { en: 'Penalty: Absent', ar: 'عقوبة: غياب' },
  [EVENTS.PENALTY_ASSIGNED_MISCONDUCT]: { en: 'Penalty: Misconduct', ar: 'عقوبة: سوء سلوك' },
  [EVENTS.PENALTY_UPDATED]: { en: 'Penalty Updated', ar: 'تم تحديث العقوبة' },
  [EVENTS.PENALTY_DELETED]: { en: 'Penalty Deleted', ar: 'تم حذف العقوبة' },
  [EVENTS.PENALTY_WAIVED]: { en: 'Penalty Waived', ar: 'تم إسقاط العقوبة' },
  [EVENTS.GRADE_POSTED]: { en: 'Grade Posted', ar: 'تم نشر الدرجة' },
  [EVENTS.GRADE_UPDATED]: { en: 'Grade Updated', ar: 'تم تحديث الدرجة' },
  [EVENTS.GRADE_CALCULATED]: { en: 'Grade Calculated', ar: 'تم حساب الدرجة' },
  [EVENTS.GRADE_FINAL]: { en: 'Final Grade', ar: 'الدرجة النهائية' },
  [EVENTS.MARKS_UPDATED]: { en: 'Marks Updated', ar: 'تم تحديث الدرجات' },
  [EVENTS.REPEATED_ATTEMPT_GRADED]: { en: 'Repeated Attempt Graded', ar: 'تم تقييم المحاولة المعادة' },
  [EVENTS.QUIZ_AVAILABLE]: { en: 'Quiz Available', ar: 'اختبار متاح' },
  [EVENTS.QUIZ_STARTED]: { en: 'Quiz Started', ar: 'بدأ الاختبار' },
  [EVENTS.QUIZ_SUBMITTED]: { en: 'Quiz Submitted', ar: 'تم تقديم الاختبار' },
  [EVENTS.QUIZ_GRADED]: { en: 'Quiz Graded', ar: 'تم تقييم الاختبار' },
  [EVENTS.ASSIGNMENT_CREATED]: { en: 'New Assignment', ar: 'واجب جديد' },
  [EVENTS.ASSIGNMENT_DUE]: { en: 'Assignment Due', ar: 'موعد تسليم الواجب' },
  [EVENTS.ASSIGNMENT_DUE_SOON]: { en: 'Assignment Due Soon', ar: 'الواجب يستحق قريباً' },
  [EVENTS.ASSIGNMENT_SUBMITTED]: { en: 'Assignment Submitted', ar: 'تم تقديم الواجب' },
  [EVENTS.ASSIGNMENT_GRADED]: { en: 'Assignment Graded', ar: 'تم تقييم الواجب' },
  [EVENTS.ASSIGNMENT_OVERDUE]: { en: 'Assignment Overdue', ar: 'واجب متأخر' },
  [EVENTS.ACTIVITY_ASSIGNED]: { en: 'Activity Assigned', ar: 'تم تعيين نشاط' },
  [EVENTS.ACTIVITY_COMPLETED]: { en: 'Activity Completed', ar: 'تم إكمال النشاط' },
  [EVENTS.ACTIVITY_GRADED]: { en: 'Activity Graded', ar: 'تم تقييم النشاط' },
  [EVENTS.ACTIVITY_FEEDBACK]: { en: 'Activity Feedback', ar: 'ملاحظات على النشاط' },
  [EVENTS.ENROLLMENT_CONFIRMED]: { en: 'Enrollment Confirmed', ar: 'تم تأكيد التسجيل' },
  [EVENTS.ENROLLMENT_PENDING]: { en: 'Enrollment Pending', ar: 'التسجيل قيد الانتظار' },
  [EVENTS.ENROLLMENT_APPROVED]: { en: 'Enrollment Approved', ar: 'تمت الموافقة على التسجيل' },
  [EVENTS.ENROLLMENT_REJECTED]: { en: 'Enrollment Rejected', ar: 'تم رفض التسجيل' },
  [EVENTS.ENROLLMENT_DROPPED]: { en: 'Enrollment Dropped', ar: 'تم إسقاط التسجيل' },
  [EVENTS.ENROLLMENT_COMPLETED]: { en: 'Enrollment Completed', ar: 'تم إكمال التسجيل' },
  [EVENTS.RESOURCE_ADDED]: { en: 'New Resource', ar: 'مورد جديد' },
  [EVENTS.RESOURCE_UPDATED]: { en: 'Resource Updated', ar: 'تم تحديث المورد' },
  [EVENTS.RESOURCE_DELETED]: { en: 'Resource Deleted', ar: 'تم حذف المورد' },
  [EVENTS.RESOURCE_SHARED]: { en: 'Resource Shared', ar: 'تمت مشاركة المورد' },
  [EVENTS.FILE_SHARED]: { en: 'File Shared', ar: 'تمت مشاركة ملف' },
  [EVENTS.FILE_UPLOADED]: { en: 'File Uploaded', ar: 'تم رفع ملف' },
  [EVENTS.FILE_DOWNLOADED]: { en: 'File Downloaded', ar: 'تم تنزيل ملف' },
  [EVENTS.FILE_DELETED]: { en: 'File Deleted', ar: 'تم حذف ملف' },
  [EVENTS.DRIVE_FILE_SHARED]: { en: 'File Shared', ar: 'تمت مشاركة ملف' },
  [EVENTS.DRIVE_FOLDER_SHARED]: { en: 'Folder Shared', ar: 'تمت مشاركة مجلد' },
  [EVENTS.DRIVE_PERMISSION_REVOKED]: { en: 'Access Revoked', ar: 'تم إلغاء الوصول' },
  [EVENTS.DRIVE_FILE_UPLOADED]: { en: 'File Uploaded', ar: 'تم رفع ملف' },
  [EVENTS.DRIVE_FOLDER_CREATED]: { en: 'Folder Created', ar: 'تم إنشاء مجلد' },
  [EVENTS.DRIVE_FILE_DELETED]: { en: 'File Deleted', ar: 'تم حذف ملف' },
  [EVENTS.DRIVE_FOLDER_DELETED]: { en: 'Folder Deleted', ar: 'تم حذف مجلد' },
  [EVENTS.DRIVE_FOLDER_RESTORED]: { en: 'Folder Restored', ar: 'تم استعادة مجلد' },
  [EVENTS.DRIVE_COMMENT_ADDED]: { en: 'New Comment', ar: 'تعليق جديد' },
  [EVENTS.DRIVE_COMMENT_UPDATED]: { en: 'Comment Updated', ar: 'تم تحديث التعليق' },
  [EVENTS.DRIVE_COMMENT_DELETED]: { en: 'Comment Deleted', ar: 'تم حذف التعليق' },
  [EVENTS.DRIVE_PUBLIC_LINK_CREATED]: { en: 'Public Link Created', ar: 'تم إنشاء رابط عام' },
  [EVENTS.DRIVE_PUBLIC_LINK_REVOKED]: { en: 'Public Link Revoked', ar: 'تم إلغاء الرابط العام' },
  [EVENTS.SYSTEM_ALERT]: { en: 'System Alert', ar: 'تنبيه النظام' },
  [EVENTS.SYSTEM_MAINTENANCE]: { en: 'System Maintenance', ar: 'صيانة النظام' },
  [EVENTS.SYSTEM_UPDATE]: { en: 'System Update', ar: 'تحديث النظام' },
  [EVENTS.USER_ACCOUNT_CREATED]: { en: 'Account Created', ar: 'تم إنشاء حساب' },
  [EVENTS.USER_PASSWORD_RESET]: { en: 'Password Reset', ar: 'إعادة تعيين كلمة المرور' },
  [EVENTS.USER_LOGIN]: { en: 'Login Activity', ar: 'نشاط تسجيل الدخول' },
  [EVENTS.CHAT_MESSAGE_RECEIVED]: { en: 'New Message', ar: 'رسالة جديدة' },
  [EVENTS.CHAT_DM_RECEIVED]: { en: 'Direct Message', ar: 'رسالة مباشرة' },
  [EVENTS.CHAT_MENTION]: { en: 'You Were Mentioned', ar: 'تم ذكرك' },
  [EVENTS.CHAT_ROOM_CREATED]: { en: 'New Chat Room', ar: 'غرفة محادثة جديدة' },
};

/**
 * Render template with variables
 * @param {string} template - Template string with {{variable}} placeholders
 * @param {object} variables - Object with variable values
 * @returns {string} Rendered template
 */
export const renderTemplate = (template, variables = {}) => {
  let rendered = template;
  for (const [key, value] of Object.entries(variables)) {
    rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return rendered;
};

/**
 * Build a frontend navigation link from the event type and payload.
 * Returns a relative URL path that the frontend can navigate to.
 */
const WORKFLOW_EVENTS = new Set([
  EVENTS.WORKFLOW_SUBMITTED, EVENTS.WORKFLOW_ASSIGNED, EVENTS.WORKFLOW_APPROVED,
  EVENTS.WORKFLOW_REJECTED, EVENTS.WORKFLOW_RETURNED, EVENTS.WORKFLOW_SENT_FOR_REVIEW,
  EVENTS.WORKFLOW_RESUBMITTED, EVENTS.WORKFLOW_COMPLETED, EVENTS.WORKFLOW_SLA_WARNING,
  EVENTS.WORKFLOW_SLA_OVERDUE, EVENTS.WORKFLOW_WITHDRAWN, EVENTS.WORKFLOW_COMMENT_ADDED,
  EVENTS.WORKFLOW_AMENDED,
]);

const DRIVE_EVENTS = new Set([
  EVENTS.DRIVE_FILE_SHARED, EVENTS.DRIVE_FOLDER_SHARED, EVENTS.DRIVE_PERMISSION_REVOKED,
  EVENTS.DRIVE_FILE_UPLOADED, EVENTS.DRIVE_FOLDER_CREATED, EVENTS.DRIVE_FILE_DELETED,
  EVENTS.DRIVE_FOLDER_DELETED, EVENTS.DRIVE_FOLDER_RESTORED, EVENTS.DRIVE_COMMENT_ADDED,
  EVENTS.DRIVE_COMMENT_UPDATED, EVENTS.DRIVE_COMMENT_DELETED, EVENTS.DRIVE_PUBLIC_LINK_CREATED,
  EVENTS.DRIVE_PUBLIC_LINK_REVOKED,
]);

const ANNOUNCEMENT_EVENTS = new Set([
  EVENTS.ANNOUNCEMENT_POSTED, EVENTS.ANNOUNCEMENT_UPDATED, EVENTS.ANNOUNCEMENT_DELETED,
]);

const CHAT_EVENTS = new Set([
  EVENTS.CHAT_MESSAGE_RECEIVED, EVENTS.CHAT_DM_RECEIVED, EVENTS.CHAT_MENTION, EVENTS.CHAT_ROOM_CREATED,
]);

export const buildNotificationLink = (event, payload = {}) => {
  if (WORKFLOW_EVENTS.has(event)) {
    const docId = payload.documentId || payload.workflowId || payload.id;
    if (docId) return `/operations/board?workflowId=${docId}`;
    return '/operations/board';
  }
  if (DRIVE_EVENTS.has(event)) {
    const fileId = payload.fileId || payload.id;
    const folderId = payload.folderId;
    if (fileId) return `/smart-drive?fileId=${fileId}`;
    if (folderId) return `/smart-drive?folderId=${folderId}`;
    return '/smart-drive';
  }
  if (ANNOUNCEMENT_EVENTS.has(event)) {
    const id = payload.announcementId || payload.id;
    if (id) return `/announcements/${id}`;
    return '/announcements';
  }
  if (CHAT_EVENTS.has(event)) {
    const roomId = payload.roomId;
    if (roomId) return `/chat?dest=${encodeURIComponent('dm:' + roomId)}`;
    return '/chat';
  }
  if (event === EVENTS.QR_CODE_SENT || event === EVENTS.QR_CODE_GENERATED) {
    return '/qr-scanner';
  }
  if (event === EVENTS.ATTENDANCE_MARKED || event === EVENTS.ATTENDANCE_MARKED_PRESENT ||
      event === EVENTS.ATTENDANCE_MARKED_ABSENT || event === EVENTS.ATTENDANCE_MARKED_LATE ||
      event === EVENTS.ATTENDANCE_MARKED_EXCUSED || event === EVENTS.ATTENDANCE_THRESHOLD_WARNING ||
      event === EVENTS.ATTENDANCE_PATTERN_DETECTED) {
    return '/operations/board';
  }
  if (event === EVENTS.STANDUP_ATTENDANCE_MARKED || event === EVENTS.STANDUP_ATTENDANCE_UPDATED) {
    return '/qr-scanner';
  }
  if (event === EVENTS.FILE_SHARED || event === EVENTS.FILE_UPLOADED) {
    const fileId = payload.fileId || payload.id;
    if (fileId) return `/smart-drive?fileId=${fileId}`;
    return '/smart-drive';
  }
  if (event === EVENTS.RESOURCE_ADDED || event === EVENTS.RESOURCE_UPDATED || event === EVENTS.RESOURCE_SHARED) {
    return '/?mode=resources';
  }
  if (event === EVENTS.RESOURCE_DELETED) {
    return '/?mode=resources';
  }
  if (event === EVENTS.ENROLLMENT_CONFIRMED || event === EVENTS.ENROLLMENT_PENDING ||
      event === EVENTS.ENROLLMENT_APPROVED || event === EVENTS.ENROLLMENT_REJECTED ||
      event === EVENTS.ENROLLMENT_DROPPED || event === EVENTS.ENROLLMENT_COMPLETED) {
    return '/dashboard#enrollments';
  }
  if (event === EVENTS.GRADE_POSTED || event === EVENTS.GRADE_UPDATED || event === EVENTS.GRADE_CALCULATED ||
      event === EVENTS.GRADE_FINAL || event === EVENTS.MARKS_UPDATED || event === EVENTS.REPEATED_ATTEMPT_GRADED) {
    return '/dashboard#marks';
  }
  if (event === EVENTS.QUIZ_AVAILABLE || event === EVENTS.QUIZ_STARTED || event === EVENTS.QUIZ_SUBMITTED || event === EVENTS.QUIZ_GRADED) {
    return '/quizzes';
  }
  if (event === EVENTS.ASSIGNMENT_CREATED || event === EVENTS.ASSIGNMENT_DUE || event === EVENTS.ASSIGNMENT_DUE_SOON ||
      event === EVENTS.ASSIGNMENT_SUBMITTED || event === EVENTS.ASSIGNMENT_GRADED || event === EVENTS.ASSIGNMENT_OVERDUE) {
    return '/?mode=activities&activityType=homework';
  }
  if (event === EVENTS.ACTIVITY_ASSIGNED || event === EVENTS.ACTIVITY_COMPLETED || event === EVENTS.ACTIVITY_GRADED || event === EVENTS.ACTIVITY_FEEDBACK) {
    return '/?mode=activities';
  }
  if (event === EVENTS.BEHAVIOR_RECORDED || event === EVENTS.BEHAVIOR_POSITIVE_RECORDED ||
      event === EVENTS.BEHAVIOR_NEGATIVE_RECORDED || event === EVENTS.BEHAVIOR_UPDATED || event === EVENTS.BEHAVIOR_DELETED) {
    return '/dashboard#behavior';
  }
  if (event === EVENTS.PARTICIPATION_RECORDED || event === EVENTS.PARTICIPATION_UPDATED || event === EVENTS.PARTICIPATION_DELETED ||
      event === EVENTS.PARTICIPATION_EXPLAINED_LESSON || event === EVENTS.PARTICIPATION_GAVE_PROJECT ||
      event === EVENTS.PARTICIPATION_GAVE_PAPER || event === EVENTS.PARTICIPATION_GAVE_RESEARCH ||
      event === EVENTS.PARTICIPATION_ACTIVE_DISCUSSION || event === EVENTS.PARTICIPATION_ANSWERED_QUESTION ||
      event === EVENTS.PARTICIPATION_HELPED_CLASSMATE || event === EVENTS.PARTICIPATION_EXCELLENT) {
    return '/dashboard#participation';
  }
  if (event === EVENTS.PENALTY_ASSIGNED || event === EVENTS.PENALTY_ASSIGNED_LATE || event === EVENTS.PENALTY_ASSIGNED_ABSENT ||
      event === EVENTS.PENALTY_ASSIGNED_MISCONDUCT || event === EVENTS.PENALTY_UPDATED || event === EVENTS.PENALTY_DELETED || event === EVENTS.PENALTY_WAIVED) {
    return '/dashboard#penalty';
  }
  return null;
};

/**
 * Create template object for registry registration
 * @param {string} event - Event key
 * @returns {object} Template object with render function
 */
export const createTemplate = (event) => {
  const raw = RAW_TEMPLATES[event];
  if (!raw) return null;
  const rawTitle = RAW_TITLE_TEMPLATES[event];

  return {
    event,
    category: getCategoryFromEvent(event),
    defaultPriority: getPriorityFromEvent(event),
    render: (payload, lang = 'en') => {
      const enVars = { ...payload, studentName: payload.studentName || payload.studentNameAr };
      const arVars = {
        ...payload,
        studentName: payload.studentNameAr || payload.studentName,
        instructorName: payload.instructorNameAr || payload.instructorName,
        userName: payload.userNameAr || payload.userName,
        folderName: payload.folderNameAr || payload.folderName,
        fileName: payload.fileNameAr || payload.fileName,
      };
      const bodyEn = raw.en ? renderTemplate(raw.en, enVars) : event;
      const bodyAr = raw.ar ? renderTemplate(raw.ar, arVars) : bodyEn;
      const titleEn = rawTitle?.en || event;
      const titleAr = rawTitle?.ar || titleEn;
      return {
        titleEn,
        titleAr,
        bodyEn,
        bodyAr,
        link: buildNotificationLink(event, payload),
        groupKey: event
      };
    },
    renderEmail: (payload, lang = 'en') => {
      const template = raw[lang] || raw.en || event;
      const body = renderTemplate(template, payload);
      const subject = raw[lang] ? renderTemplate(raw[lang], payload) : event;
      
      return {
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">${subject}</h2>
            <p style="color: #666; line-height: 1.6;">${body}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">Military LMS Notification</p>
          </div>
        `,
        text: `${subject}\n\n${body}\n\nMilitary LMS Notification`
      };
    },
    renderSMS: (payload, lang = 'en') => {
      const template = raw[lang] || raw.en || event;
      const body = renderTemplate(template, payload);
      return {
        body: body.substring(0, 160) // SMS character limit
      };
    }
  };
};

/**
 * Register all templates with the registry
 * @param {Function} registerTemplate - Registry's registerTemplate function
 */
export const registerAllTemplates = (registerTemplate) => {
  Object.values(EVENTS).forEach(event => {
    const template = createTemplate(event);
    if (template) {
      try {
        registerTemplate(template);
      } catch (error) {
        console.error(`Failed to register template for event ${event}:`, error.message);
      }
    }
  });
};

export default {
  RAW_TEMPLATES,
  renderTemplate,
  createTemplate,
  registerAllTemplates
};
