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
  [EVENTS.WORKFLOW_ASSIGNED]: {
    en: 'You have been assigned to a workflow: {{workflowName}}',
    ar: 'تم تعيينك في سير عمل: {{workflowName}}'
  },
  [EVENTS.WORKFLOW_APPROVED]: {
    en: 'Workflow "{{workflowName}}" has been approved',
    ar: 'تمت الموافقة على سير العمل "{{workflowName}}"'
  },
  [EVENTS.WORKFLOW_REJECTED]: {
    en: 'Workflow "{{workflowName}}" has been rejected',
    ar: 'تم رفض سير العمل "{{workflowName}}"'
  },
  [EVENTS.WORKFLOW_COMPLETED]: {
    en: 'Workflow "{{workflowName}}" has been completed',
    ar: 'تم إكمال سير العمل "{{workflowName}}"'
  },
  [EVENTS.WORKFLOW_SLA_WARNING]: {
    en: 'Workflow "{{workflowName}}" is approaching SLA deadline',
    ar: 'سير العمل "{{workflowName}}" يقترب من موعد انتهاء SLA'
  },
  [EVENTS.WORKFLOW_SLA_OVERDUE]: {
    en: 'Workflow "{{workflowName}}" has exceeded SLA deadline',
    ar: 'تجاوز سير العمل "{{workflowName}}" موعد انتهاء SLA'
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
    en: 'Attendance warning: {{studentName}} has {{percentage}}% attendance',
    ar: 'تحذير الحضور: {{studentName}} لديه نسبة حضور {{percentage}}%'
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
  [EVENTS.DRIVE_COMMENT_ADDED]: {
    en: '{{commenter}} added a comment on {{fileName}}: {{commentText}}',
    ar: 'أضاف {{commenter}} تعليقاً على {{fileName}}: {{commentText}}'
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
  }
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
 * Create template object for registry registration
 * @param {string} event - Event key
 * @returns {object} Template object with render function
 */
export const createTemplate = (event) => {
  const raw = RAW_TEMPLATES[event];
  if (!raw) return null;
  
  return {
    event,
    category: getCategoryFromEvent(event),
    defaultPriority: getPriorityFromEvent(event),
    render: (payload, lang = 'en') => {
      const template = raw[lang] || raw.en || event;
      const rendered = renderTemplate(template, payload);
      return {
        titleEn: raw.en ? renderTemplate(raw.en, payload) : event,
        titleAr: raw.ar ? renderTemplate(raw.ar, payload) : event,
        bodyEn: rendered,
        bodyAr: rendered,
        link: null,
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
