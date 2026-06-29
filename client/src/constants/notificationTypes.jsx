/**
 * Notification Types Constants
 * Centralized notification types aligned with backend CATEGORIES.
 * Values are uppercase to match Prisma NotificationCategory enum.
 */

import {
  Settings, BookOpen, Calendar, Clipboard, MessageSquare, Megaphone,
  Workflow, Activity, File, QrCode, Users, AlertTriangle, FolderOpen, Bell
} from 'lucide-react';

// Notification Types (aligned with backend CATEGORIES)
export const NOTIFICATION_TYPES = {
  SYSTEM: 'SYSTEM',
  ACADEMIC: 'ACADEMIC',
  ATTENDANCE: 'ATTENDANCE',
  ASSESSMENT: 'ASSESSMENT',
  COMMUNICATION: 'COMMUNICATION',
  ANNOUNCEMENT: 'ANNOUNCEMENT',
  WORKFLOW: 'WORKFLOW',
  BEHAVIOR: 'BEHAVIOR',
  FILE: 'FILE',
  QR: 'QR',
  PARTICIPATION: 'PARTICIPATION',
  PENALTY: 'PENALTY',
  RESOURCE: 'RESOURCE'
};

export const NOTIFICATION_CHANNELS = {
  IN_APP: 'in_app',
  EMAIL: 'email',
  SMS: 'sms',
  PUSH: 'push'
};

export const NOTIFICATION_PRIORITIES = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
};

export const NOTIFICATION_STATUSES = {
  PENDING: 'pending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed'
};

// Filter types for notification drawer/page (not delivery statuses)
export const NOTIFICATION_FILTERS = {
  ALL: 'all',
  UNREAD: 'unread',
  READ: 'read',
  ARCHIVED: 'archived'
};

// Backward-compatible alias used by drawer/page components
export const NOTIFICATION_STATUS = NOTIFICATION_FILTERS;

// Helper functions
export const getNotificationIcon = (type, size = 20) => {
  const iconMap = {
    [NOTIFICATION_TYPES.SYSTEM]: Settings,
    [NOTIFICATION_TYPES.ACADEMIC]: BookOpen,
    [NOTIFICATION_TYPES.ATTENDANCE]: Calendar,
    [NOTIFICATION_TYPES.ASSESSMENT]: Clipboard,
    [NOTIFICATION_TYPES.COMMUNICATION]: MessageSquare,
    [NOTIFICATION_TYPES.ANNOUNCEMENT]: Megaphone,
    [NOTIFICATION_TYPES.WORKFLOW]: Workflow,
    [NOTIFICATION_TYPES.BEHAVIOR]: Activity,
    [NOTIFICATION_TYPES.FILE]: File,
    [NOTIFICATION_TYPES.QR]: QrCode,
    [NOTIFICATION_TYPES.PARTICIPATION]: Users,
    [NOTIFICATION_TYPES.PENALTY]: AlertTriangle,
    [NOTIFICATION_TYPES.RESOURCE]: FolderOpen
  };

  const IconComponent = iconMap[type] || Bell;
  return <IconComponent size={size} />;
};

export const getNotificationStatusOptions = (t) => {
  return [
    { value: NOTIFICATION_FILTERS.ALL, label: (t && t('all')) || 'All' },
    { value: NOTIFICATION_FILTERS.UNREAD, label: (t && t('unread')) || 'Unread' },
    { value: NOTIFICATION_FILTERS.READ, label: (t && t('read')) || 'Read' },
    { value: NOTIFICATION_FILTERS.ARCHIVED, label: (t && t('archived')) || 'Archived' }
  ];
};

export const getNotificationPriorityOptions = () => {
  return Object.entries(NOTIFICATION_PRIORITIES).map(([key, value]) => ({
    value: value,
    label: key.charAt(0) + key.slice(1).toLowerCase()
  }));
};

export const getNotificationChannelOptions = () => {
  return Object.entries(NOTIFICATION_CHANNELS).map(([key, value]) => ({
    value: value,
    label: key.charAt(0) + key.slice(1).toLowerCase()
  }));
};

export const getNotificationTypeOptions = (t) => {
  const labels = {
    SYSTEM: (t && t('notif_type_system')) || 'System',
    ACADEMIC: (t && t('notif_type_academic')) || 'Academic',
    ATTENDANCE: (t && t('notif_type_attendance')) || 'Attendance',
    ASSESSMENT: (t && t('notif_type_assessment')) || 'Assessment',
    COMMUNICATION: (t && t('notif_type_communication')) || 'Communication',
    ANNOUNCEMENT: (t && t('notif_type_announcement')) || 'Announcement',
    WORKFLOW: (t && t('notif_type_workflow')) || 'Workflow',
    BEHAVIOR: (t && t('notif_type_behavior')) || 'Behavior',
    FILE: (t && t('notif_type_file')) || 'File',
    QR: (t && t('notif_type_qr')) || 'QR Code',
    PARTICIPATION: (t && t('notif_type_participation')) || 'Participation',
    PENALTY: (t && t('notif_type_penalty')) || 'Penalty',
    RESOURCE: (t && t('notif_type_resource')) || 'Resource'
  };
  return Object.entries(NOTIFICATION_TYPES).map(([key, value]) => ({
    value: value,
    label: labels[key] || key.charAt(0) + key.slice(1).toLowerCase()
  }));
};

export const getNotificationLabel = (type) => {
  const labels = {
    [NOTIFICATION_TYPES.SYSTEM]: 'System',
    [NOTIFICATION_TYPES.ACADEMIC]: 'Academic',
    [NOTIFICATION_TYPES.ATTENDANCE]: 'Attendance',
    [NOTIFICATION_TYPES.ASSESSMENT]: 'Assessment',
    [NOTIFICATION_TYPES.COMMUNICATION]: 'Communication',
    [NOTIFICATION_TYPES.ANNOUNCEMENT]: 'Announcement',
    [NOTIFICATION_TYPES.WORKFLOW]: 'Workflow',
    [NOTIFICATION_TYPES.BEHAVIOR]: 'Behavior',
    [NOTIFICATION_TYPES.FILE]: 'File',
    [NOTIFICATION_TYPES.QR]: 'QR Code',
    [NOTIFICATION_TYPES.PARTICIPATION]: 'Participation',
    [NOTIFICATION_TYPES.PENALTY]: 'Penalty',
    [NOTIFICATION_TYPES.RESOURCE]: 'Resource'
  };

  return labels[type] || type;
};

export const getNotificationPriorityLabel = (priority) => {
  const labels = {
    [NOTIFICATION_PRIORITIES.LOW]: 'Low',
    [NOTIFICATION_PRIORITIES.NORMAL]: 'Normal',
    [NOTIFICATION_PRIORITIES.HIGH]: 'High',
    [NOTIFICATION_PRIORITIES.URGENT]: 'Urgent'
  };

  return labels[priority] || priority;
};

export const getNotificationStatusLabel = (status) => {
  const labels = {
    [NOTIFICATION_STATUSES.PENDING]: 'Pending',
    [NOTIFICATION_STATUSES.SENT]: 'Sent',
    [NOTIFICATION_STATUSES.DELIVERED]: 'Delivered',
    [NOTIFICATION_STATUSES.READ]: 'Read',
    [NOTIFICATION_STATUSES.FAILED]: 'Failed'
  };
  
  return labels[status] || status;
};

// Shared category colors — used by NotificationDrawer and NotificationsPage
export const CATEGORY_COLORS = {
  ASSESSMENT: '#3b82f6',
  COMMUNICATION: '#f59e0b',
  ANNOUNCEMENT: '#06b6d4',
  ATTENDANCE: '#f97316',
  WORKFLOW: '#8b5cf6',
  BEHAVIOR: '#ec4899',
  FILE: '#6366f1',
  QR: '#14b8a6',
  PARTICIPATION: '#22c55e',
  PENALTY: '#ef4444',
  RESOURCE: '#6366f1',
  ACADEMIC: '#3b82f6',
  SYSTEM: '#6b7280'
};

export const getCategoryColor = (type) => CATEGORY_COLORS[type] || '#6b7280';

// Default export
export default {
  NOTIFICATION_TYPES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_STATUSES,
  NOTIFICATION_FILTERS,
  NOTIFICATION_STATUS,
  getNotificationIcon,
  getNotificationStatusOptions,
  getNotificationPriorityOptions,
  getNotificationChannelOptions,
  getNotificationTypeOptions,
  getNotificationLabel,
  getNotificationPriorityLabel,
  getNotificationStatusLabel
};
