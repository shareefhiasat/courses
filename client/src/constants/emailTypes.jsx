import { 
  Mail, 
  Megaphone, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  GraduationCap, 
  BookOpen, 
  MessageSquareText, 
  Mailbox, 
  Send, 
  MailOpen, 
  MousePointerClick, 
  CornerDownLeft, 
  Flag, 
  ListFilter,
  Eye 
} from 'lucide-react';

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
export const getEmailTypeIcon = (type, size = 16) => {
  const iconMap = {
    [EMAIL_TYPES.NEWSLETTER]: <Mailbox size={size} title="Newsletter" />,
    [EMAIL_TYPES.ANNOUNCEMENT]: <Megaphone size={size} title="Announcement" />,
    [EMAIL_TYPES.ACTIVITY]: <FileText size={size} title="Activity" />,
    [EMAIL_TYPES.ACTIVITY_COMPLETE]: <CheckCircle2 size={size} title="Completion" />,
    [EMAIL_TYPES.ACTIVITY_GRADED]: <FileText size={size} title="Grading" />,
    [EMAIL_TYPES.ENROLLMENT]: <GraduationCap size={size} title="Enrollment" />,
    [EMAIL_TYPES.RESOURCE]: <BookOpen size={size} title="Resource" />,
    [EMAIL_TYPES.CHAT_DIGEST]: <MessageSquareText size={size} title="Chat Digest" />,
    [EMAIL_TYPES.CUSTOM]: <Mail size={size} title="Email" />
  };
  
  return iconMap[type] || <Mail size={size} title="Email" />;
};

// Email Status Configuration for Dropdowns
export const getEmailStatusOptions = () => [
  { value: 'all', label: 'All Status', icon: <ListFilter size={16} title="All Status" /> },
  { value: EMAIL_STATUS.SENT, label: 'Sent', icon: <Send size={16} title="Sent" /> },
  { value: EMAIL_STATUS.DELIVERED, label: 'Delivered', icon: <CheckCircle2 size={16} title="Delivered" /> },
  { value: EMAIL_STATUS.FAILED, label: 'Failed', icon: <XCircle size={16} title="Failed" /> },
  { value: EMAIL_STATUS.OPENED, label: 'Opened', icon: <MailOpen size={16} title="Opened" /> },
  { value: EMAIL_STATUS.CLICKED, label: 'Clicked', icon: <MousePointerClick size={16} title="Clicked" /> },
  { value: EMAIL_STATUS.BOUNCED, label: 'Bounced', icon: <CornerDownLeft size={16} title="Bounced" /> },
  { value: EMAIL_STATUS.COMPLAINED, label: 'Complained', icon: <Flag size={16} title="Complained" /> }
];

// Email Type Options for Dropdowns
export const getEmailTypeOptions = () => [
  { value: 'all', label: 'All Types' },
  { value: EMAIL_TYPES.NEWSLETTER, label: 'Newsletter', icon: <Mailbox size={16} title="Newsletter" /> },
  { value: EMAIL_TYPES.ANNOUNCEMENT, label: 'Announcements', icon: <Megaphone size={16} title="Announcement" /> },
  { value: EMAIL_TYPES.ACTIVITY, label: 'Activities', icon: <FileText size={16} title="Activity" /> },
  { value: EMAIL_TYPES.ACTIVITY_GRADED, label: 'Grading', icon: <FileText size={16} title="Grading" /> },
  { value: EMAIL_TYPES.ACTIVITY_COMPLETE, label: 'Completions', icon: <CheckCircle2 size={16} title="Completion" /> },
  { value: EMAIL_TYPES.ENROLLMENT, label: 'Enrollments', icon: <GraduationCap size={16} title="Enrollment" /> },
  { value: EMAIL_TYPES.RESOURCE, label: 'Resources', icon: <BookOpen size={16} title="Resource" /> },
  { value: EMAIL_TYPES.CHAT_DIGEST, label: 'Chat Digest', icon: <MessageSquareText size={16} title="Chat Digest" /> }
];

// Email Status Badge Configuration (without colors - user requested no colors)
export const getEmailStatusBadge = (status, t) => {
  const statusConfig = {
    [EMAIL_STATUS.SENT]: { 
      icon: <Send size={14} />, 
      label: t('sent_status') || 'Sent' 
    },
    [EMAIL_STATUS.DELIVERED]: { 
      icon: <CheckCircle2 size={14} />, 
      label: t('delivered_status') || 'Delivered' 
    },
    [EMAIL_STATUS.FAILED]: { 
      icon: <XCircle size={14} />, 
      label: t('failed_status') || 'Failed' 
    },
    [EMAIL_STATUS.OPENED]: { 
      icon: <MailOpen size={14} />, 
      label: t('opened_status') || 'Opened' 
    },
    [EMAIL_STATUS.CLICKED]: { 
      icon: <MousePointerClick size={14} />, 
      label: t('clicked_status') || 'Clicked' 
    },
    [EMAIL_STATUS.BOUNCED]: { 
      icon: <CornerDownLeft size={14} />, 
      label: t('bounced_status') || 'Bounced' 
    },
    [EMAIL_STATUS.COMPLAINED]: { 
      icon: <Flag size={14} />, 
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
export const getEmailStatusBadgeWithColors = (status, t) => {
  const statusConfig = {
    [EMAIL_STATUS.SENT]: { 
      icon: <Send size={14} />, 
      color: '#155724', 
      bg: '#d4edda', 
      label: t('sent_status') || 'Sent' 
    },
    [EMAIL_STATUS.DELIVERED]: { 
      icon: <CheckCircle2 size={14} />, 
      color: '#155724', 
      bg: '#d4edda', 
      label: t('delivered_status') || 'Delivered' 
    },
    [EMAIL_STATUS.FAILED]: { 
      icon: <XCircle size={14} />, 
      color: '#721c24', 
      bg: '#f8d7da', 
      label: t('failed_status') || 'Failed' 
    },
    [EMAIL_STATUS.OPENED]: { 
      icon: <MailOpen size={14} />, 
      color: '#0c5460', 
      bg: '#d1ecf1', 
      label: t('opened_status') || 'Opened' 
    },
    [EMAIL_STATUS.CLICKED]: { 
      icon: <MousePointerClick size={14} />, 
      color: '#004085', 
      bg: '#cce5ff', 
      label: t('clicked_status') || 'Clicked' 
    },
    [EMAIL_STATUS.BOUNCED]: { 
      icon: <CornerDownLeft size={14} />, 
      color: '#856404', 
      bg: '#fff3cd', 
      label: t('bounced_status') || 'Bounced' 
    },
    [EMAIL_STATUS.COMPLAINED]: { 
      icon: <Flag size={14} />, 
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

// Export Eye icon for use in other components
export { Eye };
