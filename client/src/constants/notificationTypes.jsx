import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Megaphone,
  Mail,
  BarChart3,
  FileText,
  MessageCircle,
  UserCheck,
  Info
} from 'lucide-react';

// Notification Types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  ANNOUNCEMENT: 'announcement',
  NEWSLETTER: 'newsletter',
  GRADE: 'grade',
  ACTIVITY: 'activity',
  MESSAGE: 'message',
  CHAT: 'chat',
  ATTENDANCE: 'attendance',
  PENALTY: 'penalty',
  ABSENCE: 'absence'
};

// Notification Status
export const NOTIFICATION_STATUS = {
  UNREAD: 'unread',
  READ: 'read',
  ARCHIVED: 'archived'
};

// Notification Type Labels
export const NOTIFICATION_TYPE_LABELS = {
  [NOTIFICATION_TYPES.SUCCESS]: {
    en: 'Success',
    ar: 'نجاح'
  },
  [NOTIFICATION_TYPES.WARNING]: {
    en: 'Warning',
    ar: 'تحذير'
  },
  [NOTIFICATION_TYPES.ERROR]: {
    en: 'Error',
    ar: 'خطأ'
  },
  [NOTIFICATION_TYPES.ANNOUNCEMENT]: {
    en: 'Announcement',
    ar: 'إعلان'
  },
  [NOTIFICATION_TYPES.NEWSLETTER]: {
    en: 'Newsletter',
    ar: 'نشرة بريدية'
  },
  [NOTIFICATION_TYPES.GRADE]: {
    en: 'Grades',
    ar: 'الدرجات'
  },
  [NOTIFICATION_TYPES.ACTIVITY]: {
    en: 'Activities',
    ar: 'الأنشطة'
  },
  [NOTIFICATION_TYPES.MESSAGE]: {
    en: 'Messages',
    ar: 'الرسائل'
  },
  [NOTIFICATION_TYPES.CHAT]: {
    en: 'Chats',
    ar: 'الدردشات'
  },
  [NOTIFICATION_TYPES.ATTENDANCE]: {
    en: 'Attendance',
    ar: 'الحضور'
  },
  [NOTIFICATION_TYPES.PENALTY]: {
    en: 'Penalties',
    ar: 'المخالفات'
  },
  [NOTIFICATION_TYPES.ABSENCE]: {
    en: 'Absences',
    ar: 'الغياب'
  }
};

// Notification Channels
export const NOTIFICATION_CHANNELS = {
  WEB: 'web',
  EMAIL: 'email',
  SMS: 'sms',
  WHATSAPP: 'whatsapp'
};

// Notification Action Triggers
export const NOTIFICATION_TRIGGERS = {
  // Academic / Course
  ACTIVITY_NEW: 'activity_new',
  ACTIVITY_COMPLETE: 'activity_complete',
  ACTIVITY_GRADED: 'activity_graded',
  RESOURCE_NEW: 'resource_new',
  ANNOUNCEMENT_NEW: 'announcement_new',
  
  // Attendance & Behavior
  ATTENDANCE_RECORDED: 'attendance_recorded',
  ATTENDANCE_ABSENT: 'attendance_absent',
  BEHAVIOR_RECORDED: 'behavior_recorded',
  PENALTY_ISSUED: 'penalty_issued',
  PARTICIPATION_RECORDED: 'participation_recorded',
  
  // Quiz
  QUIZ_AVAILABLE: 'quiz_available',
  QUIZ_DEADLINE_REMINDER: 'quiz_deadline_reminder',
  QUIZ_RESULTS_RELEASED: 'quiz_results_released',
  
  // System / Account
  ENROLLMENT_CONFIRMED: 'enrollment_confirmed',
  ENROLLMENT_CANCELLED: 'enrollment_cancelled',
  WELCOME_SIGNUP: 'welcome_signup',
  PASSWORD_RESET: 'password_reset',
  
  // Communication
  CHAT_MESSAGE: 'chat_message',
  CHAT_DIGEST: 'chat_digest'
};

/**
 * Mapping triggers to screens/pages for RoleAccessPro integration
 */
export const SCREEN_NOTIFICATION_MAPPING = {
  activities: [NOTIFICATION_TRIGGERS.ACTIVITY_NEW, NOTIFICATION_TRIGGERS.ACTIVITY_COMPLETE, NOTIFICATION_TRIGGERS.ACTIVITY_GRADED],
  resources: [NOTIFICATION_TRIGGERS.RESOURCE_NEW],
  quizzes: [NOTIFICATION_TRIGGERS.QUIZ_AVAILABLE, NOTIFICATION_TRIGGERS.QUIZ_DEADLINE_REMINDER, NOTIFICATION_TRIGGERS.QUIZ_RESULTS_RELEASED],
  attendance: [NOTIFICATION_TRIGGERS.ATTENDANCE_RECORDED, NOTIFICATION_TRIGGERS.ATTENDANCE_ABSENT],
  hrPenalties: [NOTIFICATION_TRIGGERS.PENALTY_ISSUED],
  instructorParticipation: [NOTIFICATION_TRIGGERS.PARTICIPATION_RECORDED],
  instructorBehavior: [NOTIFICATION_TRIGGERS.BEHAVIOR_RECORDED],
  chat: [NOTIFICATION_TRIGGERS.CHAT_MESSAGE, NOTIFICATION_TRIGGERS.CHAT_DIGEST]
};

// Notification Status Labels
export const NOTIFICATION_STATUS_LABELS = {
  [NOTIFICATION_STATUS.UNREAD]: {
    en: 'Unread',
    ar: 'غير مقروء'
  },
  [NOTIFICATION_STATUS.READ]: {
    en: 'Read',
    ar: 'مقروء'
  },
  [NOTIFICATION_STATUS.ARCHIVED]: {
    en: 'Archived',
    ar: 'مؤرشف'
  }
};

// Get notification icon based on type
export const getNotificationIcon = (type) => {
  const iconProps = { size: 18 };
  
  switch (type) {
    case NOTIFICATION_TYPES.SUCCESS:
      return <CheckCircle2 {...iconProps} className="text-green-600" />;
    case NOTIFICATION_TYPES.WARNING:
      return <AlertTriangle {...iconProps} className="text-yellow-600" />;
    case NOTIFICATION_TYPES.ERROR:
      return <XCircle {...iconProps} className="text-red-600" />;
    case NOTIFICATION_TYPES.ANNOUNCEMENT:
      return <Megaphone {...iconProps} className="text-purple-600" />;
    case NOTIFICATION_TYPES.NEWSLETTER:
      return <Mail {...iconProps} className="text-purple-600" />;
    case NOTIFICATION_TYPES.GRADE:
      return <BarChart3 {...iconProps} className="text-blue-600" />;
    case NOTIFICATION_TYPES.ACTIVITY:
      return <FileText {...iconProps} className="text-indigo-600" />;
    case NOTIFICATION_TYPES.MESSAGE:
    case NOTIFICATION_TYPES.CHAT:
      return <MessageCircle {...iconProps} className="text-pink-600" />;
    case NOTIFICATION_TYPES.ATTENDANCE:
      return <UserCheck {...iconProps} className="text-blue-600" />;
    case NOTIFICATION_TYPES.PENALTY:
      return <AlertTriangle {...iconProps} className="text-orange-600" />;
    case NOTIFICATION_TYPES.ABSENCE:
      return <XCircle {...iconProps} className="text-red-600" />;
    default:
      return <Info {...iconProps} className="text-gray-600" />;
  }
};

// Get notification type label
export const getNotificationTypeLabel = (type, lang = 'en') => {
  const label = NOTIFICATION_TYPE_LABELS[type];
  return label ? (lang === 'ar' ? label.ar : label.en) : type;
};

// Get notification status label
export const getNotificationStatusLabel = (status, lang = 'en') => {
  const label = NOTIFICATION_STATUS_LABELS[status];
  return label ? (lang === 'ar' ? label.ar : label.en) : status;
};

// Get notification type options for dropdowns
export const getNotificationTypeOptions = (t, lang = 'en') => {
  return [
    { value: 'all', label: t('all_types') || 'All Types' },
    { value: NOTIFICATION_TYPES.ACTIVITY, label: getNotificationTypeLabel(NOTIFICATION_TYPES.ACTIVITY, lang) },
    { value: NOTIFICATION_TYPES.MESSAGE, label: getNotificationTypeLabel(NOTIFICATION_TYPES.MESSAGE, lang) },
    { value: NOTIFICATION_TYPES.CHAT, label: getNotificationTypeLabel(NOTIFICATION_TYPES.CHAT, lang) },
    { value: NOTIFICATION_TYPES.ANNOUNCEMENT, label: getNotificationTypeLabel(NOTIFICATION_TYPES.ANNOUNCEMENT, lang) },
    { value: NOTIFICATION_TYPES.NEWSLETTER, label: getNotificationTypeLabel(NOTIFICATION_TYPES.NEWSLETTER, lang) },
    { value: NOTIFICATION_TYPES.GRADE, label: getNotificationTypeLabel(NOTIFICATION_TYPES.GRADE, lang) },
    { value: NOTIFICATION_TYPES.ATTENDANCE, label: getNotificationTypeLabel(NOTIFICATION_TYPES.ATTENDANCE, lang) },
    { value: NOTIFICATION_TYPES.ABSENCE, label: getNotificationTypeLabel(NOTIFICATION_TYPES.ABSENCE, lang) },
    { value: NOTIFICATION_TYPES.PENALTY, label: getNotificationTypeLabel(NOTIFICATION_TYPES.PENALTY, lang) },
    { value: NOTIFICATION_TYPES.SUCCESS, label: getNotificationTypeLabel(NOTIFICATION_TYPES.SUCCESS, lang) },
    { value: NOTIFICATION_TYPES.WARNING, label: getNotificationTypeLabel(NOTIFICATION_TYPES.WARNING, lang) },
    { value: NOTIFICATION_TYPES.ERROR, label: getNotificationTypeLabel(NOTIFICATION_TYPES.ERROR, lang) }
  ];
};

// Get notification status options for dropdowns
export const getNotificationStatusOptions = (t, lang = 'en') => {
  return [
    { value: 'all', label: t('all') || 'All' },
    { value: NOTIFICATION_STATUS.UNREAD, label: getNotificationStatusLabel(NOTIFICATION_STATUS.UNREAD, lang) },
    { value: NOTIFICATION_STATUS.READ, label: getNotificationStatusLabel(NOTIFICATION_STATUS.READ, lang) },
    { value: NOTIFICATION_STATUS.ARCHIVED, label: getNotificationStatusLabel(NOTIFICATION_STATUS.ARCHIVED, lang) }
  ];
};

// Get notification trigger options for dropdowns
export const getNotificationTriggerOptions = (t, theme, getColoredIcon) => {
  return [
    { value: '', label: t('all_triggers') || 'All Triggers', icon: getColoredIcon('ui', 'filter', 16, null, theme) },
    { value: NOTIFICATION_TRIGGERS.ACTIVITY_NEW, label: t('activity_new') || 'Activity New' },
    { value: NOTIFICATION_TRIGGERS.ACTIVITY_GRADED, label: t('activity_graded') || 'Activity Graded' },
    { value: NOTIFICATION_TRIGGERS.ANNOUNCEMENT_NEW, label: t('announcement_new') || 'Announcement New' },
    { value: NOTIFICATION_TRIGGERS.QUIZ_AVAILABLE, label: t('quiz_available') || 'Quiz Available' },
    { value: NOTIFICATION_TRIGGERS.ATTENDANCE_RECORDED, label: t('attendance_recorded') || 'Attendance Recorded' },
    { value: NOTIFICATION_TRIGGERS.ATTENDANCE_ABSENT, label: t('attendance_absent') || 'Attendance Absent' },
    { value: NOTIFICATION_TRIGGERS.PENALTY_ISSUED, label: t('penalty_issued') || 'Penalty Issued' },
    { value: NOTIFICATION_TRIGGERS.BEHAVIOR_RECORDED, label: t('behavior_awarded') || 'Behavior Awarded' },
    { value: NOTIFICATION_TRIGGERS.PARTICIPATION_RECORDED, label: t('participation_recorded') || 'Participation Recorded' }
  ];
};

// Get notification channel options for dropdowns
export const getNotificationChannelOptions = (t, theme, getColoredIcon) => {
  return [
    { value: '', label: t('all_channels') || 'All Channels', icon: getColoredIcon('ui', 'filter', 16, null, theme) },
    { value: NOTIFICATION_CHANNELS.WEB, label: t('web') || 'Web' },
    { value: NOTIFICATION_CHANNELS.EMAIL, label: t('email') || 'Email' },
    { value: NOTIFICATION_CHANNELS.SMS, label: t('sms') || 'SMS' },
    { value: NOTIFICATION_CHANNELS.WHATSAPP, label: t('whatsapp') || 'WhatsApp' }
  ];
};
