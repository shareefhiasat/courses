import { getThemedIcon } from '@constants/iconTypes';

// Email Type Configuration
export const EMAIL_TYPES = {
  NEWSLETTER: 'newsletter',
  ANNOUNCEMENT: 'announcement',
  ACTIVITY: 'activity',
  ACTIVITY_COMPLETE: 'activity_complete',
  ACTIVITY_GRADED: 'activity_graded',
  ENROLLMENT: 'enrollment',
  RESOURCE: 'resource',
  CHAT_DIGEST: 'chat_digest',
  CUSTOM: 'custom'
};

// Email Status Configuration
export const EMAIL_STATUS = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  FAILED: 'failed',
  OPENED: 'opened',
  CLICKED: 'clicked',
  BOUNCED: 'bounced',
  COMPLAINED: 'complained'
};

// Email Type Icons Configuration
export const getEmailTypeIcon = (type, size = 16, theme = 'light') => {
  const iconMap = {
    [EMAIL_TYPES.NEWSLETTER]: getThemedIcon('ui', 'mailbox', size, theme),
    [EMAIL_TYPES.ANNOUNCEMENT]: getThemedIcon('ui', 'megaphone', size, theme),
    [EMAIL_TYPES.ACTIVITY]: getThemedIcon('ui', 'file_text', size, theme),
    [EMAIL_TYPES.ACTIVITY_COMPLETE]: getThemedIcon('ui', 'check_circle', size, theme),
    [EMAIL_TYPES.ACTIVITY_GRADED]: getThemedIcon('ui', 'file_text', size, theme),
    [EMAIL_TYPES.ENROLLMENT]: getThemedIcon('ui', 'graduation_cap', size, theme),
    [EMAIL_TYPES.RESOURCE]: getThemedIcon('ui', 'book_open', size, theme),
    [EMAIL_TYPES.CHAT_DIGEST]: getThemedIcon('ui', 'message_square', size, theme),
    [EMAIL_TYPES.CUSTOM]: getThemedIcon('ui', 'mail', size, theme)
  };
  
  return iconMap[type] || getThemedIcon('ui', 'mail', size, theme);
};

// Email Status Configuration for Dropdowns
export const getEmailStatusOptions = (theme = 'light') => [
  { value: 'all', label: 'All Status', icon: getThemedIcon('ui', 'filter', 16, theme) },
  { value: EMAIL_STATUS.SENT, label: 'Sent', icon: getThemedIcon('ui', 'send', 16, theme) },
  { value: EMAIL_STATUS.DELIVERED, label: 'Delivered', icon: getThemedIcon('ui', 'check_circle', 16, theme) },
  { value: EMAIL_STATUS.FAILED, label: 'Failed', icon: getThemedIcon('ui', 'x_circle', 16, theme) },
  { value: EMAIL_STATUS.OPENED, label: 'Opened', icon: getThemedIcon('ui', 'mail_open', 16, theme) },
  { value: EMAIL_STATUS.CLICKED, label: 'Clicked', icon: getThemedIcon('ui', 'mouse_pointer_click', 16, theme) },
  { value: EMAIL_STATUS.BOUNCED, label: 'Bounced', icon: getThemedIcon('ui', 'corner_down_left', 16, theme) },
  { value: EMAIL_STATUS.COMPLAINED, label: 'Complained', icon: getThemedIcon('ui', 'flag', 16, theme) }
];

// Email Type Options for Dropdowns
export const getEmailTypeOptions = (theme = 'light') => [
  { value: 'all', label: 'All Types' },
  { value: EMAIL_TYPES.NEWSLETTER, label: 'Newsletter', icon: getThemedIcon('ui', 'mailbox', 16, theme) },
  { value: EMAIL_TYPES.ANNOUNCEMENT, label: 'Announcements', icon: getThemedIcon('ui', 'megaphone', 16, theme) },
  { value: EMAIL_TYPES.ACTIVITY, label: 'Activities', icon: getThemedIcon('ui', 'file_text', 16, theme) },
  { value: EMAIL_TYPES.ACTIVITY_GRADED, label: 'Grading', icon: getThemedIcon('ui', 'file_text', 16, theme) },
  { value: EMAIL_TYPES.ACTIVITY_COMPLETE, label: 'Completions', icon: getThemedIcon('ui', 'check_circle', 16, theme) },
  { value: EMAIL_TYPES.ENROLLMENT, label: 'Enrollments', icon: getThemedIcon('ui', 'graduation_cap', 16, theme) },
  { value: EMAIL_TYPES.RESOURCE, label: 'Resources', icon: getThemedIcon('ui', 'book_open', 16, theme) },
  { value: EMAIL_TYPES.CHAT_DIGEST, label: 'Chat Digest', icon: getThemedIcon('ui', 'message_square', 16, theme) }
];

// Email Status Badge Configuration (without colors - user requested no colors)
export const getEmailStatusBadge = (status, t, theme = 'light') => {
  const statusConfig = {
    [EMAIL_STATUS.SENT]: { 
      icon: getThemedIcon('ui', 'send', 14, theme), 
      label: t('sent_status') || 'Sent' 
    },
    [EMAIL_STATUS.DELIVERED]: { 
      icon: getThemedIcon('ui', 'check_circle', 14, theme), 
      label: t('delivered_status') || 'Delivered' 
    },
    [EMAIL_STATUS.FAILED]: { 
      icon: getThemedIcon('ui', 'x_circle', 14, theme), 
      label: t('failed_status') || 'Failed' 
    },
    [EMAIL_STATUS.OPENED]: { 
      icon: getThemedIcon('ui', 'mail_open', 14, theme), 
      label: t('opened_status') || 'Opened' 
    },
    [EMAIL_STATUS.CLICKED]: { 
      icon: getThemedIcon('ui', 'mouse_pointer_click', 14, theme), 
      label: t('clicked_status') || 'Clicked' 
    },
    [EMAIL_STATUS.BOUNCED]: { 
      icon: getThemedIcon('ui', 'corner_down_left', 14, theme), 
      label: t('bounced_status') || 'Bounced' 
    },
    [EMAIL_STATUS.COMPLAINED]: { 
      icon: getThemedIcon('ui', 'flag', 14, theme), 
      label: t('complained_status') || 'Complained' 
    }
  };

  const config = statusConfig[status] || statusConfig[EMAIL_STATUS.FAILED];

  return (
    <span style={{ 
      padding: '4px 8px', 
      background: 'transparent', 
      color: 'inherit', 
      borderRadius: 4, 
      fontSize: '0.8rem', 
      fontWeight: 600, 
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: '4px',
      border: '1px solid #e5e7eb'
    }}>
      {config.icon}
      {config.label}
    </span>
  );
};

// Email Status Badge Configuration (with colors - alternative version)
export const getEmailStatusBadgeWithColors = (status, t, theme = 'light') => {
  const statusConfig = {
    [EMAIL_STATUS.SENT]: { 
      icon: getThemedIcon('ui', 'send', 14, theme), 
      color: '#155724', 
      bg: '#d4edda', 
      label: t('sent_status') || 'Sent' 
    },
    [EMAIL_STATUS.DELIVERED]: { 
      icon: getThemedIcon('ui', 'check_circle', 14, theme), 
      color: '#155724', 
      bg: '#d4edda', 
      label: t('delivered_status') || 'Delivered' 
    },
    [EMAIL_STATUS.FAILED]: { 
      icon: getThemedIcon('ui', 'x_circle', 14, theme), 
      color: '#721c24', 
      bg: '#f8d7da', 
      label: t('failed_status') || 'Failed' 
    },
    [EMAIL_STATUS.OPENED]: { 
      icon: getThemedIcon('ui', 'mail_open', 14, theme), 
      color: '#0c5460', 
      bg: '#d1ecf1', 
      label: t('opened_status') || 'Opened' 
    },
    [EMAIL_STATUS.CLICKED]: { 
      icon: getThemedIcon('ui', 'mouse_pointer_click', 14, theme), 
      color: '#004085', 
      bg: '#cce5ff', 
      label: t('clicked_status') || 'Clicked' 
    },
    [EMAIL_STATUS.BOUNCED]: { 
      icon: getThemedIcon('ui', 'corner_down_left', 14, theme), 
      color: '#856404', 
      bg: '#fff3cd', 
      label: t('bounced_status') || 'Bounced' 
    },
    [EMAIL_STATUS.COMPLAINED]: { 
      icon: getThemedIcon('ui', 'flag', 14, theme), 
      color: '#721c24', 
      bg: '#f8d7da', 
      label: t('complained_status') || 'Complained' 
    }
  };

  const config = statusConfig[status] || statusConfig[EMAIL_STATUS.FAILED];

  return (
    <span style={{ 
      padding: '4px 8px', 
      background: config.bg, 
      color: config.color, 
      borderRadius: 4, 
      fontSize: '0.8rem', 
      fontWeight: 600, 
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: '4px' 
    }}>
      {config.icon}
      {config.label}
    </span>
  );
};

