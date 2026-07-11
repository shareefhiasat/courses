import { formatDateTime, getQatarDateParts } from '@utils/date';
import { NOTIFICATION_TYPES, NOTIFICATION_STATUS } from '@constants/notificationTypes.jsx';
import { RECORD_TYPES } from '@utils/sharedTypes';

/**
 * Format a notification timestamp as a relative time string.
 * Used by both NotificationDrawer and NotificationsPage.
 */
export const formatNotificationTime = (timestamp, t) => {
  if (!timestamp) return '';
  const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return t('notifications.just_now');
  if (diff < 3600000) return `${Math.floor(diff / 60000)}${t('notifications.minutes_ago')}`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}${t('notifications.hours_ago')}`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}${t('notifications.days_ago')}`;
  return formatDateTime(date);
};

/**
 * Group notifications by date (Today, Yesterday, This Week, Earlier).
 * Uses Qatar timezone for date boundary comparison.
 */
export const getDateGroup = (timestamp) => {
  if (!timestamp) return 'Earlier';
  const date = timestamp?.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
  const nowParts = getQatarDateParts(new Date());
  const dateParts = getQatarDateParts(date);
  if (!nowParts || !dateParts) return 'Earlier';

  const isToday = nowParts.year === dateParts.year &&
    nowParts.month === dateParts.month &&
    nowParts.day === dateParts.day;

  if (isToday) return 'Today';

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yParts = getQatarDateParts(yesterday);
  const isYesterday = yParts && yParts.year === dateParts.year &&
    yParts.month === dateParts.month &&
    yParts.day === dateParts.day;

  if (isYesterday) return 'Yesterday';
  if (new Date() - date < 7 * 86400000) return 'This Week';
  return 'Earlier';
};

/**
 * Get localized label for a date group.
 */
export const getGroupLabel = (group, t) => {
  const labels = {
    Today: t('notifications.today'),
    Yesterday: t('notifications.yesterday'),
    'This Week': t('notifications.this_week'),
    Earlier: t('notifications.earlier')
  };
  return labels[group] || group;
};

/**
 * Group notifications by date and return ordered array of { label, items }.
 */
export const groupNotificationsByDate = (notifications, t) => {
  const groups = {};
  notifications.forEach(n => {
    const group = getDateGroup(n.createdAt);
    if (!groups[group]) groups[group] = [];
    groups[group].push(n);
  });
  const order = ['Today', 'Yesterday', 'This Week', 'Earlier'];
  return order.filter(g => groups[g]).map(g => ({ label: getGroupLabel(g, t), items: groups[g] }));
};

/**
 * Shared notification filtering logic used by NotificationDrawer and NotificationsPage.
 * @param {Object} params - Filter parameters
 * @param {Array} params.notifications - All notifications
 * @param {string} params.filterType - 'all' | 'unread' | 'read' | 'archived'
 * @param {string} params.filterCategory - 'all' or a NOTIFICATION_TYPES value
 * @param {string} params.filterPenaltyType
 * @param {string} params.filterAttendanceStatus
 * @param {string} params.filterAbsenceType
 * @param {string} params.searchTerm
 * @param {boolean} params.showArchived
 * @param {string} params.filterProgram
 * @param {string} params.filterSubject
 * @param {string} params.filterClass
 * @param {string} params.filterYear
 * @param {string} params.filterSemester
 * @param {Array} params.subjects
 * @param {Array} params.classes
 * @returns {Array} Filtered notifications
 */
export const filterNotifications = ({
  notifications,
  filterType = 'all',
  filterCategory = 'all',
  filterPenaltyType = 'all',
  filterAttendanceStatus = 'all',
  filterAbsenceType = 'all',
  searchTerm = '',
  showArchived = false,
  filterProgram = 'all',
  filterSubject = 'all',
  filterClass = 'all',
  filterYear = 'all',
  filterSemester = 'all',
  subjects = [],
  classes = []
}) => {
  let filtered = notifications;

  // Filter by read status
  if (filterType === NOTIFICATION_STATUS.UNREAD || filterType === 'unread') {
    filtered = filtered.filter(n => !n.isRead && !n.isArchived);
  } else if (filterType === NOTIFICATION_STATUS.READ || filterType === 'read') {
    filtered = filtered.filter(n => n.isRead && !n.isArchived);
  } else if (filterType === NOTIFICATION_STATUS.ARCHIVED || filterType === 'archived') {
    filtered = filtered.filter(n => n.isArchived);
  } else if (!showArchived) {
    filtered = filtered.filter(n => !n.isArchived);
  }

  // Filter by category
  if (filterCategory !== 'all') {
    filtered = filtered.filter(n => n.type === filterCategory);
  }

  // Filter by penalty type
  if (filterPenaltyType !== 'all' && filterCategory === RECORD_TYPES.PENALTY) {
    filtered = filtered.filter(n => n.metadata?.penaltyType === filterPenaltyType);
  }

  // Filter by attendance status
  if (filterAttendanceStatus !== 'all' && filterCategory === RECORD_TYPES.ATTENDANCE) {
    filtered = filtered.filter(n => n.metadata?.attendanceStatus === filterAttendanceStatus);
  }

  // Filter by absence type
  if (filterAbsenceType !== 'all' && filterCategory === NOTIFICATION_TYPES.ATTENDANCE) {
    filtered = filtered.filter(n => n.metadata?.absenceType === filterAbsenceType);
  }

  // Filter by search term
  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(n =>
      (n.title || '').toLowerCase().includes(term) ||
      (n.message || '').toLowerCase().includes(term)
    );
  }

  // Filter by program
  if (filterProgram !== 'all') {
    filtered = filtered.filter(n => {
      const classId = n.data?.classId || n.classId;
      const subjectId = n.data?.subjectId || n.metadata?.subjectId;
      if (classId) {
        const classItem = classes.find(c => String(c.id || c.docId) === String(classId));
        if (classItem?.subjectId) {
          const subject = subjects.find(s => String(s.docId || s.id) === String(classItem.subjectId));
          return String(subject?.programId) === String(filterProgram);
        }
      }
      if (subjectId) {
        const subject = subjects.find(s => String(s.docId || s.id) === String(subjectId));
        return String(subject?.programId) === String(filterProgram);
      }
      return false;
    });
  }

  // Filter by subject
  if (filterSubject !== 'all') {
    filtered = filtered.filter(n => {
      const classId = n.data?.classId || n.classId;
      const subjectId = n.data?.subjectId || n.metadata?.subjectId;
      if (classId) {
        const classItem = classes.find(c => String(c.id || c.docId) === String(classId));
        return String(classItem?.subjectId) === String(filterSubject);
      }
      return String(subjectId) === String(filterSubject);
    });
  }

  // Filter by class
  if (filterClass !== 'all') {
    filtered = filtered.filter(n => {
      const classId = n.data?.classId || n.classId;
      return String(classId) === String(filterClass);
    });
  }

  // Filter by year
  if (filterYear !== 'all') {
    filtered = filtered.filter(n => {
      const classId = n.data?.classId || n.classId;
      if (classId) {
        const classItem = classes.find(c => String(c.id || c.docId) === String(classId));
        if (classItem?.year && String(classItem.year) === filterYear) return true;
        if (classItem?.term && classItem.term.includes(' ')) {
          const parts = classItem.term.split(' ');
          if (parts.length > 1 && parts[parts.length - 1] === filterYear) return true;
        }
      }
      return false;
    });
  }

  // Filter by semester
  if (filterSemester !== 'all') {
    filtered = filtered.filter(n => {
      const subjectId = n.data?.subjectId || n.metadata?.subjectId;
      if (subjectId) {
        const subject = subjects.find(s => String(s.docId || s.id) === String(subjectId));
        return String(subject?.semester) === String(filterSemester);
      }
      return false;
    });
  }

  return filtered;
};

/**
 * Navigate to the appropriate page based on notification type.
 * Shared between NotificationDrawer and NotificationsPage.
 * @param {Object} n - Notification object
 * @param {Function} navigate - React Router navigate function
 * @param {Function} [onMarkAsRead] - Optional callback to mark notification as read
 */
export const gotoFromNotification = async (n, navigate, onMarkAsRead) => {
  if (!n.isRead && onMarkAsRead) await onMarkAsRead(n.id);

  if (n.link) {
    navigate(n.link);
    return;
  }

  const type = (n.type || n.category || '').toUpperCase();
  const data = n.data || n.metadata || {};

  switch (type) {
    case NOTIFICATION_TYPES.ASSESSMENT:
      if (data.activityId) navigate(`/activity/${data.activityId}`);
      else if (data.quizId) navigate(`/quiz/${data.quizId}`);
      else if (data.assignmentId) navigate(`/assignments/${data.assignmentId}`);
      else navigate('/?mode=quizzes');
      break;
    case NOTIFICATION_TYPES.COMMUNICATION:
      if (data.roomId || data.messageId) {
        let dest = data.classId || 'global';
        if (data.roomId) dest = `dm:${data.roomId}`;
        navigate(data.messageId ? `/chat?dest=${encodeURIComponent(dest)}&msgId=${data.messageId}` : `/chat?dest=${encodeURIComponent(dest)}`);
      } else {
        navigate('/chat');
      }
      break;
    case NOTIFICATION_TYPES.ANNOUNCEMENT:
      if (data.announcementId) navigate(`/announcements/${data.announcementId}`);
      else navigate('/announcements');
      break;
    case NOTIFICATION_TYPES.ATTENDANCE:
      navigate('/student-dashboard');
      break;
    case NOTIFICATION_TYPES.WORKFLOW:
      { const wfId = data.workflowId || data.documentId;
        if (wfId) navigate(`/operations/board?workflowId=${wfId}`);
        else navigate('/operations/board'); }
      break;
    case NOTIFICATION_TYPES.BEHAVIOR:
    case NOTIFICATION_TYPES.PARTICIPATION:
    case NOTIFICATION_TYPES.PENALTY:
      navigate('/student-dashboard');
      break;
    case NOTIFICATION_TYPES.FILE:
      if (data.fileId) navigate(`/drive?fileId=${data.fileId}`);
      else navigate('/drive');
      break;
    case NOTIFICATION_TYPES.RESOURCE:
      if (data.resourceId) navigate(`/resources/${data.resourceId}`);
      else navigate('/resources');
      break;
    case NOTIFICATION_TYPES.QR:
      navigate('/qr-scanner');
      break;
    case NOTIFICATION_TYPES.ACADEMIC:
      if (data.enrollmentId) navigate(`/enrollments/${data.enrollmentId}`);
      else navigate('/');
      break;
    case NOTIFICATION_TYPES.SYSTEM:
    default:
      navigate('/');
      break;
  }
};
