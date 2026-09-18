import { formatDateTime, getQatarDateParts } from '@utils/date';
import { NOTIFICATION_TYPES, NOTIFICATION_STATUS } from '@constants/notificationTypes.jsx';
import { RECORD_TYPES } from '@utils/sharedTypes';
import { WORKFLOW_STATUS_COLORS } from '@constants/workspaceStatusColors.js';
import { formatTermDisplay } from '@constants/gradingStandards';
import apiService from '@/services/api/apiService.js';

/**
 * Format a notification timestamp as a relative time string.
 * Used by both NotificationDrawer and NotificationsPage.
 */
export const formatNotificationTime = (timestamp, t, lang = 'en') => {
  if (!timestamp) return '';
  const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return t('notifications.just_now');
  if (diff < 3600000) return `${Math.floor(diff / 60000)}${t('notifications.minutes_ago')}`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}${t('notifications.hours_ago')}`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}${t('notifications.days_ago')}`;
  return formatDateTime(date, lang);
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
 * Map known English workflow title prefixes to locale keys for localization.
 */
const WORKFLOW_TITLE_PREFIX_KEYS = {
  'daily attendance': 'daily_attendance',
};

/**
 * Localize a workflow title (e.g. 'Daily Attendance — CY104 — 2026-07-13')
 * by translating the prefix and preserving class/date segments.
 */
export const getLocalizedWorkflowName = (workflowName, t) => {
  if (!workflowName) return workflowName || '';
  const parts = workflowName.split(/\s+[—–-]\s+/).map((s) => s.trim()).filter(Boolean);
  if (parts.length < 2) return workflowName;

  const prefix = parts[0].toLowerCase();
  const localeKey = WORKFLOW_TITLE_PREFIX_KEYS[prefix];
  if (localeKey) {
    const localizedPrefix = t(localeKey);
    if (localizedPrefix && localizedPrefix !== localeKey) {
      parts[0] = localizedPrefix;
    }
  }
  return parts.join(' — ');
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

  // Debug: log notification data fields when academic filters are active
  if (filterProgram !== 'all' || filterSubject !== 'all' || filterClass !== 'all' || filterYear !== 'all' || filterSemester !== 'all') {
    console.log('[filterNotifications] Input:', {
      total: notifications.length,
      classesLoaded: classes.length,
      subjectsLoaded: subjects.length,
      filters: { filterProgram, filterSubject, filterClass, filterYear, filterSemester },
      sampleNotifs: notifications.slice(0, 3).map(n => ({
        id: n.id,
        type: n.type,
        classId: n.data?.classId || n.classId,
        subjectId: n.data?.subjectId || n.metadata?.subjectId,
        programId: n.data?.programId || n.metadata?.programId,
      })),
      sampleClasses: classes.slice(0, 3).map(c => ({
        id: c.id || c.docId,
        subjectId: c.subjectId,
        programId: c.programId,
        term: c.term,
        year: c.year,
      })),
    });
  }

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
    const before = filtered.length;
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
    console.log('[filterNotifications] program filter:', { filterProgram, before, after: filtered.length, classesLoaded: classes.length });
  }

  // Filter by subject
  if (filterSubject !== 'all') {
    const before = filtered.length;
    filtered = filtered.filter(n => {
      const data = n.data || n.metadata || {};
      const directSubjectId = data.subjectId;
      if (directSubjectId != null && String(directSubjectId) === String(filterSubject)) return true;

      const classId = data.classId || n.classId;
      if (classId) {
        const classItem = classes.find(c => String(c.id || c.docId) === String(classId));
        if (classItem?.subjectId && String(classItem.subjectId) === String(filterSubject)) return true;
      }
      return false;
    });
    console.log('[filterNotifications] subject filter:', { filterSubject, before, after: filtered.length, classesLoaded: classes.length });
  }

  // Filter by class
  if (filterClass !== 'all') {
    const before = filtered.length;
    filtered = filtered.filter(n => {
      const classId = n.data?.classId || n.classId;
      return String(classId) === String(filterClass);
    });
    console.log('[filterNotifications] class filter:', { filterClass, before, after: filtered.length });
  }

  // Filter by year
  if (filterYear !== 'all') {
    const before = filtered.length;
    filtered = filtered.filter(n => {
      const data = n.data || n.metadata || {};
      if (data.year != null && String(data.year) === String(filterYear)) return true;

      const classId = data.classId || n.classId;
      if (classId) {
        const classItem = classes.find(c => String(c.id || c.docId) === String(classId));
        if (classItem?.year && String(classItem.year) === filterYear) return true;
        if (classItem?.term) {
          // Handle "Fall 2027" format
          if (classItem.term.includes(' ')) {
            const parts = classItem.term.split(' ');
            if (parts.length > 1 && parts[parts.length - 1] === filterYear) return true;
          }
          // Handle "2027-FALL" format
          if (classItem.term.includes('-')) {
            const parts = classItem.term.split('-');
            const yearPart = parts.find(p => !Number.isNaN(Number(p)));
            if (yearPart && yearPart === filterYear) return true;
          }
        }
      }
      return false;
    });
    console.log('[filterNotifications] year filter:', { filterYear, before, after: filtered.length, classesLoaded: classes.length });
  }

  // Filter by semester
  if (filterSemester !== 'all') {
    const before = filtered.length;
    const filterSem = filterSemester.toLowerCase();
    filtered = filtered.filter(n => {
      const data = n.data || n.metadata || {};
      if (data.term != null && formatTermDisplay(String(data.term)).toLowerCase() === filterSem) return true;
      if (data.semester != null && formatTermDisplay(String(data.semester)).toLowerCase() === filterSem) return true;

      const classId = data.classId || n.classId;
      if (classId) {
        const classItem = classes.find(c => String(c.id || c.docId) === String(classId));
        if (classItem?.term) {
          return formatTermDisplay(classItem.term).toLowerCase() === filterSem;
        }
      }
      return false;
    });
    console.log('[filterNotifications] semester filter:', { filterSemester, before, after: filtered.length, classesLoaded: classes.length });
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

    // Backfill workflow context for old links that were saved without it
    const linkWorkflowId = url.searchParams.get('workflowId');
    if (linkWorkflowId && (!url.searchParams.get('date') || !url.searchParams.get('classId'))) {
      try {
        const res = await apiService.apiClient.get(`/workflow-documents/${linkWorkflowId}`);
        const doc = res.data?.data;
        if (doc?.date && !url.searchParams.get('date')) {
          const parsed = new Date(doc.date);
          if (!isNaN(parsed.getTime())) url.searchParams.set('date', parsed.toISOString().slice(0, 10));
        }
        if (doc?.classId && !url.searchParams.get('classId')) url.searchParams.set('classId', String(doc.classId));
        if (doc?.programId && !url.searchParams.get('programId')) url.searchParams.set('programId', String(doc.programId));
        if (doc?.termId && !url.searchParams.get('termId')) url.searchParams.set('termId', String(doc.termId));
        if (doc?.subjectId && !url.searchParams.get('subjectId')) url.searchParams.set('subjectId', String(doc.subjectId));
      } catch (err) {
        console.error('[gotoFromNotification] Failed to fetch workflow context for link', err);
      }
    }
    
    // If the link is to operations board or welcome page with operations tab, open in new tab to avoid navbar issues
    if (url.pathname.includes('/operations/board') || (url.pathname.includes('/welcome') && url.searchParams.get('tab') === 'operations')) {
      const newWindow = window.open(url.pathname + url.search, '_blank');
      if (newWindow) newWindow.opener = null;
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
        const url = new URL('/operations/board', window.location.origin);
        if (wfId) url.searchParams.set('workflowId', String(wfId));
        let rawDate = data.workflowDate || data.date;
        let wfClassId = data.classId;
        let wfProgramId = data.programId;
        let wfTermId = data.termId;
        let wfSubjectId = data.subjectId;
        if ((!rawDate || !wfClassId) && wfId) {
          try {
            const res = await apiService.apiClient.get(`/workflow-documents/${wfId}`);
            const doc = res.data?.data;
            if (!rawDate && doc?.date) rawDate = doc.date;
            if (!wfClassId && doc?.classId) wfClassId = doc.classId;
            if (!wfProgramId && doc?.programId) wfProgramId = doc.programId;
            if (!wfTermId && doc?.termId) wfTermId = doc.termId;
            if (!wfSubjectId && doc?.subjectId) wfSubjectId = doc.subjectId;
          } catch (err) {
            console.error('[gotoFromNotification] Failed to fetch workflow context', err);
          }
        }
        if (rawDate) {
          const parsed = new Date(rawDate);
          if (!isNaN(parsed.getTime())) url.searchParams.set('date', parsed.toISOString().slice(0, 10));
        }
        if (wfProgramId) url.searchParams.set('programId', String(wfProgramId));
        if (wfTermId) url.searchParams.set('termId', String(wfTermId));
        if (wfClassId) url.searchParams.set('classId', String(wfClassId));
        if (wfSubjectId) url.searchParams.set('subjectId', String(wfSubjectId));
        // Default operations board lane/view
        if (!url.searchParams.get('lane')) url.searchParams.set('lane', 'status');
        if (!url.searchParams.get('view')) url.searchParams.set('view', 'kanban');
        // Remove expanded=1 to prevent unwanted expanded view
        url.searchParams.delete('expanded');
        console.log('[gotoFromNotification] WORKFLOW notification - opening in new tab:', url.toString());
        const newWindow2 = window.open(url.toString(), '_blank');
        if (newWindow2) newWindow2.opener = null;
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
