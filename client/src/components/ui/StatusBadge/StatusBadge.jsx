import React from 'react';


import { info, error, warn, debug } from '@services/utils/logger.js';const StatusBadge = ({
  status,
  variant = 'default', // 'default', 'outline', 'subtle'
  size = 'md', // 'sm', 'md', 'lg'
  icon = null,
  showIcon = true,
  customColor = null,
  customLabel = null,
  className = '',
  style = {}
}) => {
  // Default status configurations
  const statusConfig = {
    // Attendance statuses
    present: {
      label: 'Present',
      color: '#10b981',
      bgColor: '#10b98120',
      icon: '✓'
    },
    absent: {
      label: 'Absent',
      color: '#ef4444',
      bgColor: '#ef444420',
      icon: '✗'
    },
    'absent_no_excuse': {
      label: 'Absent (No Excuse)',
      color: '#ef4444',
      bgColor: '#ef444420',
      icon: '✗'
    },
    'absent_with_excuse': {
      label: 'Absent (With Excuse)',
      color: '#f59e0b',
      bgColor: '#f59e0b20',
      icon: '⚠'
    },
    'excused_leave': {
      label: 'Excused Leave',
      color: '#ec4899',
      bgColor: '#ec489920',
      icon: '❤️'
    },
    'human_case': {
      label: 'Human Case',
      color: '#8b5cf6',
      bgColor: '#8b5cf620',
      icon: '👤'
    },
    late: {
      label: 'Late',
      color: '#f59e0b',
      bgColor: '#f59e0b20',
      icon: '⏰'
    },

    // User statuses
    active: {
      label: 'Active',
      color: '#10b981',
      bgColor: '#10b98120',
      icon: '✓'
    },
    inactive: {
      label: 'Inactive',
      color: '#6b7280',
      bgColor: '#6b728020',
      icon: '○'
    },
    suspended: {
      label: 'Suspended',
      color: '#ef4444',
      bgColor: '#ef444420',
      icon: '⚠'
    },
    deleted: {
      label: 'Deleted',
      color: '#ef4444',
      bgColor: '#ef444420',
      icon: '✗'
    },

    // General statuses
    pending: {
      label: 'Pending',
      color: '#f59e0b',
      bgColor: '#f59e0b20',
      icon: '⏳'
    },
    completed: {
      label: 'Completed',
      color: '#10b981',
      bgColor: '#10b98120',
      icon: '✓'
    },
    failed: {
      label: 'Failed',
      color: '#ef4444',
      bgColor: '#ef444420',
      icon: '✗'
    },
    in_progress: {
      label: 'In Progress',
      color: '#3b82f6',
      bgColor: '#3b82f620',
      icon: '⟳'
    },
    draft: {
      label: 'Draft',
      color: '#6b7280',
      bgColor: '#6b728020',
      icon: '📝'
    },
    published: {
      label: 'Published',
      color: '#10b981',
      bgColor: '#10b98120',
      icon: '✓'
    },
    archived: {
      label: 'Archived',
      color: '#6b7280',
      bgColor: '#6b728020',
      icon: '📦'
    }
  };

  // Get configuration for the status
  const config = statusConfig[status] || {
    label: status || 'Unknown',
    color: customColor || '#6b7280',
    bgColor: customColor ? `${customColor}20` : '#6b728020',
    icon: '○'
  };

  // Override with custom values if provided
  const finalLabel = customLabel || config.label;
  const finalColor = customColor || config.color;
  const finalBgColor = customColor ? `${customColor}20` : config.bgColor;
  const finalIcon = icon || config.icon;

  // Size configurations
  const sizeConfig = {
    sm: {
      padding: '0.125rem 0.375rem',
      fontSize: '0.75rem',
      iconSize: '0.75rem'
    },
    md: {
      padding: '0.25rem 0.5rem',
      fontSize: '0.875rem',
      iconSize: '0.875rem'
    },
    lg: {
      padding: '0.375rem 0.75rem',
      fontSize: '1rem',
      iconSize: '1rem'
    }
  };

  const { padding, fontSize, iconSize } = sizeConfig[size] || sizeConfig.md;

  // Variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'outline':
        return {
          backgroundColor: 'transparent',
          border: `1px solid ${finalColor}`,
          color: finalColor
        };
      case 'subtle':
        return {
          backgroundColor: finalBgColor,
          border: 'none',
          color: finalColor
        };
      default:
        return {
          backgroundColor: finalBgColor,
          border: 'none',
          color: finalColor
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <span
      className={`status-badge ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding,
        fontSize,
        fontWeight: '500',
        borderRadius: '0.25rem',
        ...variantStyles,
        ...style
      }}
    >
      {showIcon && finalIcon && (
        <span style={{ fontSize: iconSize, lineHeight: 1 }}>
          {finalIcon}
        </span>
      )}
      <span>{finalLabel}</span>
    </span>
  );
};

// Predefined status presets
StatusBadge.presets = {
  // Attendance presets
  attendance: {
    present: { status: 'present', variant: 'subtle' },
    absent: { status: 'absent', variant: 'subtle' },
    late: { status: 'late', variant: 'subtle' },
    excused: { status: 'absent_with_excuse', variant: 'subtle' }
  },

  // User status presets
  user: {
    active: { status: 'active', variant: 'subtle' },
    inactive: { status: 'inactive', variant: 'subtle' },
    suspended: { status: 'suspended', variant: 'subtle' },
    deleted: { status: 'deleted', variant: 'subtle' }
  },

  // General status presets
  general: {
    success: { status: 'completed', variant: 'subtle' },
    error: { status: 'failed', variant: 'subtle' },
    warning: { status: 'pending', variant: 'subtle' },
    info: { status: 'in_progress', variant: 'subtle' }
  }
};

// Helper function to create status badge with preset
StatusBadge.create = (preset, statusKey, options = {}) => {
  const presetConfig = StatusBadge.presets[preset];
  if (!presetConfig || !presetConfig[statusKey]) {
    return <StatusBadge status={statusKey} {...options} />;
  }
  
  const config = presetConfig[statusKey];
  return <StatusBadge status={config.status} variant={config.variant} {...options} />;
};

export default StatusBadge;
