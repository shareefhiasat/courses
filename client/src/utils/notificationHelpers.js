import { formatDateTime, getQatarDateParts } from '@utils/date';
import { NOTIFICATION_TYPES, NOTIFICATION_STATUS } from '@constants/notificationTypes.jsx';
import { RECORD_TYPES } from '@utils/sharedTypes';
import { WORKFLOW_STATUS_COLORS } from '@constants/workspaceStatusColors.js';

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

const WORKFLOW_EVENT_STATUS = {
  'workflow.approved': 'APPROVED',
  'workflow.completed': 'APPROVED',
  'workflow.rejected': 'REJECTED',
  'workflow.withdrawn': 'REJECTED',
  'workflow.assigned': 'SUBMITTED',
  'workflow.submitted': 'SUBMITTED',
  'workflow.resubmitted': 'SUBMITTED',
  'workflow.revised': 'SUBMITTED',
  'workflow.returned': 'RETURNED',
  'workflow.sent_for_review': 'UNDER_REVIEW',
  'workflow.sent_for_approval': 'UNDER_ADMIN_REVIEW',
  'workflow.amended': 'AMENDED',
};

const WORKFLOW_STATUS_ORDER = ['DRAFT', 'SUBMITTED', 'UNDER_ADMIN_REVIEW', 'UNDER_HR_REVIEW', 'UNDER_REVIEW', 'AMENDED', 'APPROVED', 'RETURNED', 'REJECTED', 'OTHER'];

export const getWorkflowStatusKey = (n) => {
  const event = n.event || n.data?.event;
  const isWorkflowEvent = (event || '').startsWith('workflow.');
  const isWorkflowType = (n.type || '').startsWith('WORKFLOW');
  if (!isWorkflowType && !isWorkflowEvent) return null;
  const explicit = n.data?.newStatus || n.metadata?.newStatus || n.data?.workflowStatus || n.metadata?.status;
  if (explicit) {
    if (explicit === 'UNDER_REVIEW') return 'UNDER_HR_REVIEW';
    return explicit;
  }
  return WORKFLOW_EVENT_STATUS[event] || 'OTHER';
};

/** Board-legend workflow status chips for notification filtering */
export const WORKFLOW_NOTIFICATION_STATUS_FILTERS = [
  { id: 'DRAFT', color: WORKFLOW_STATUS_COLORS.DRAFT, labelKey: 'operations_board_lane_draft' },
  { id: 'SUBMITTED', color: WORKFLOW_STATUS_COLORS.SUBMITTED, labelKey: 'operations_board_lane_confirmed' },
  { id: 'UNDER_ADMIN_REVIEW', color: WORKFLOW_STATUS_COLORS.UNDER_ADMIN_REVIEW, labelKey: 'operations_board_lane_admin_review' },
  { id: 'UNDER_HR_REVIEW', color: WORKFLOW_STATUS_COLORS.UNDER_HR_REVIEW, labelKey: 'operations_board_lane_hr_review', matchKeys: ['UNDER_HR_REVIEW', 'UNDER_REVIEW'] },
  { id: 'APPROVED', color: WORKFLOW_STATUS_COLORS.APPROVED, labelKey: 'operations_board_lane_approved' },
  { id: 'REJECTED', color: WORKFLOW_STATUS_COLORS.REJECTED, labelKey: 'operations_board_lane_rejected', hideForHR: true },
];

export function getWorkflowSubgroupColor(status) {
  if (!status) return WORKFLOW_STATUS_COLORS.DRAFT;
  if (status === 'UNDER_REVIEW') return WORKFLOW_STATUS_COLORS.UNDER_HR_REVIEW;
  if (status === 'RETURNED') return '#f59e0b';
  return WORKFLOW_STATUS_COLORS[status] || '#6b7280';
}

export function matchesWorkflowStatusFilter(notification, filterId) {
  if (!filterId || filterId === 'all') return true;
  const key = getWorkflowStatusKey(notification);
  const filter = WORKFLOW_NOTIFICATION_STATUS_FILTERS.find((f) => f.id === filterId);
  if (filter?.matchKeys) return filter.matchKeys.includes(key);
  return key === filterId;
}

export const getWorkflowStatusLabel = (status, t) => {
  const keyMap = {
    DRAFT: 'workflow.inbox.statusDraft',
    SUBMITTED: 'workflow.inbox.statusSubmitted',
    UNDER_REVIEW: 'workflow.inbox.statusUnderHrReview',
    UNDER_HR_REVIEW: 'workflow.inbox.statusUnderHrReview',
    UNDER_ADMIN_REVIEW: 'workflow.inbox.statusUnderAdminReview',
    APPROVED: 'workflow.inbox.approved',
    REJECTED: 'workflow.inbox.statusRejected',
    AMENDED: 'workflow.inbox.statusAmended',
    RETURNED: 'workflow.inbox.statusReturned',
  };
  return t(keyMap[status]) || status;
};

/**
 * Get localized notification title based on event type.
 * Falls back to the original title if no mapping exists.
 */
export const getLocalizedNotificationTitle = (notification, t) => {
  const event = notification.event || notification.data?.event;
  const titleMap = {
    'workflow.returned': 'notification_workflow_returned_title',
    'workflow.approved': 'notification_workflow_approved_title',
    'workflow.rejected': 'notification_workflow_rejected_title',
    'workflow.submitted': 'notification_workflow_submitted_title',
    'workflow.resubmitted': 'notification_workflow_resubmitted_title',
    'workflow.sent_for_review': 'notification_workflow_sent_for_review_title',
    'workflow.sent_for_approval': 'notification_workflow_sent_for_approval_title',
  };
  
  if (event && titleMap[event]) {
    const localized = t(titleMap[event]);
    if (localized && localized !== titleMap[event]) {
      return localized;
    }
  }
  
  return notification.title || '';
};

/**
 * Group notifications by date and return ordered array of { label, items, subGroups }.
 * Workflow notifications are further grouped by their status within each date bucket.
 */
export const groupNotificationsByDate = (notifications, t) => {
  const groups = {};
  notifications.forEach(n => {
    const group = getDateGroup(n.createdAt);
    if (!groups[group]) groups[group] = [];
    groups[group].push(n);
  });
  const order = ['Today', 'Yesterday', 'This Week', 'Earlier'];
  return order.filter(g => groups[g]).map(g => {
    const items = groups[g];
    const workflowItems = items.filter(n => (n.type || '').startsWith('WORKFLOW'));
    const otherItems = items.filter(n => !(n.type || '').startsWith('WORKFLOW'));

    const statusGroups = {};
    workflowItems.forEach(n => {
      const status = getWorkflowStatusKey(n);
      if (!statusGroups[status]) statusGroups[status] = [];
      statusGroups[status].push(n);
    });

    const subGroups = Object.entries(statusGroups)
      .map(([status, statusItems]) => ({
        label: getWorkflowStatusLabel(status, t),
        items: statusItems,
        isWorkflow: true,
        status,
      }))
      .sort((a, b) => WORKFLOW_STATUS_ORDER.indexOf(a.status) - WORKFLOW_STATUS_ORDER.indexOf(b.status));

    if (otherItems.length > 0) {
      subGroups.push({
        label: t('other'),
        items: otherItems,
        isWorkflow: false,
      });
    }

    return {
      label: getGroupLabel(g, t),
      items,
      subGroups: subGroups.length > 0 ? subGroups : null,
      workflowCount: workflowItems.length,
    };
  });
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
  filterWorkflowStatus = 'all',
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
      const data = n.data || n.metadata || {};
      if (data.programId != null) {
        return String(data.programId) === String(filterProgram);
      }

      const classId = data.classId || n.classId;
      const subjectId = data.subjectId || data.metadata?.subjectId;
      if (classId) {
        const classItem = classes.find(c => String(c.id || c.docId) === String(classId));
        if (classItem?.programId != null) {
          return String(classItem.programId) === String(filterProgram);
        }
        if (classItem?.subjectId) {
          const subject = subjects.find(s => String(s.docId || s.id) === String(classItem.subjectId));
          if (subject?.programId != null) {
            return String(subject.programId) === String(filterProgram);
          }
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

  // Filter by workflow board status (legend chips)
  if (filterWorkflowStatus !== 'all') {
    filtered = filtered.filter((n) => matchesWorkflowStatusFilter(n, filterWorkflowStatus));
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
    // Remove expanded=1 from the link to prevent unwanted expanded view
    const url = new URL(n.link, window.location.origin);
    url.searchParams.delete('expanded');
    url.searchParams.delete('scheduleExpanded');
    
    // If the link is to operations board or welcome page with operations tab, open in new tab to avoid navbar issues
    if (url.pathname.includes('/operations/board') || (url.pathname.includes('/welcome') && url.searchParams.get('tab') === 'operations')) {
      window.open(url.pathname + url.search, '_blank');
      return;
    }
    
    navigate(url.pathname + url.search);
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
        const url = wfId ? `/operations/board?workflowId=${wfId}` : '/operations/board';
        // Remove expanded=1 to prevent unwanted expanded view
        const urlObj = new URL(url, window.location.origin);
        urlObj.searchParams.delete('expanded');
        console.log('[gotoFromNotification] WORKFLOW notification - opening in new tab:', urlObj.pathname + urlObj.search);
        window.open(urlObj.pathname + urlObj.search, '_blank');
        return; }
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
