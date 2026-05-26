import React from 'react';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon, getColoredIcon, getUserRoleIcon } from '@constants/iconTypes';

import { info, error, warn, debug } from '@services/utils/logger.js';import {
  FileText, Link, Video, Globe, Edit, Trash, 
  RefreshCw, UserCheck, UserX, Lock, User, UserMinus, AlertTriangle, Info, 
  LogIn, LogOut, UserPlus, Settings, Key, 
  Eye, EyeOff, CheckCircle, 
  XCircle, Users, Shield, Activity, 
  Home, Search, Filter, ChevronDown, Crown, KeyRound
} from 'lucide-react';

// Resource Types with Icons and Colors
export const RESOURCE_TYPES = {
  DOCUMENT: 'document',
  LINK: 'link', 
  VIDEO: 'video'
};

export const getResourceTypeConfig = (type, theme = 'light') => {
  // Common Icon Sets with theme awareness
  const COMMON_ICONS = {
    actions: {
      edit: <Edit size={16} />,
      delete: <Trash size={16} />,
      refresh: <RefreshCw size={16} />,
      view: <Eye size={16} />,
      hide: <EyeOff size={16} />,
      lock: <Lock size={16} />,
      unlock: <KeyRound size={16} />
    },
    status: {
      success: <CheckCircle size={16} />,
      error: <XCircle size={16} />,
      warning: <AlertTriangle size={16} />,
      info: getThemedIcon('ui', 'info', 16, theme)
    },
    navigation: {
      home: <Home size={16} />,
      settings: <Settings size={16} />,
      search: <Search size={16} />,
      filter: <Filter size={16} />,
      back: <ChevronDown size={16} />
    },
    users: {
      user: <User size={16} />,
      users: <Users size={16} />,
      userPlus: <UserPlus size={16} />,
      userCheck: <UserCheck size={16} />,
      userX: <UserX size={16} />,
      userMinus: <UserMinus size={16} />
    }
  };

  const configs = {
    [RESOURCE_TYPES.DOCUMENT]: {
      icon: <FileText size={16} color={theme === 'dark' ? '#9ca3af' : '#374151'} />,
      color: theme === 'dark' ? '#9ca3af' : '#374151',
      activeColor: '#4f46e5',
      label: 'Document'
    },
    [RESOURCE_TYPES.LINK]: {
      icon: <Link size={16} color={theme === 'dark' ? '#9ca3af' : '#374151'} />,
      color: theme === 'dark' ? '#9ca3af' : '#374151', 
      activeColor: '#0ea5e9',
      label: 'Link'
    },
    [RESOURCE_TYPES.VIDEO]: {
      icon: <Video size={16} color={theme === 'dark' ? '#9ca3af' : '#374151'} />,
      color: theme === 'dark' ? '#9ca3af' : '#374151',
      activeColor: '#dc2626', 
      label: 'Video'
    }
  };
  
  return configs[type] || configs[RESOURCE_TYPES.DOCUMENT];
};

export const getResourceTypeOptions = (theme = 'light') => [
  { 
    value: RESOURCE_TYPES.DOCUMENT, 
    label: 'Document', 
    icon: getResourceTypeConfig(RESOURCE_TYPES.DOCUMENT, theme).icon 
  },
  { 
    value: RESOURCE_TYPES.LINK, 
    label: 'Link', 
    icon: getResourceTypeConfig(RESOURCE_TYPES.LINK, theme).icon 
  },
  { 
    value: RESOURCE_TYPES.VIDEO, 
    label: 'Video', 
    icon: getResourceTypeConfig(RESOURCE_TYPES.VIDEO, theme).icon 
  }
];

// Activity Log Types with Icons and Colors
export const getActivityLogTypeConfig = (type, theme = 'light') => {
  const configs = {
    login: {
      icon: getColoredIcon('activity_type', 'login', 16, '#16a34a', theme),
      color: '#16a34a',
      label: 'Login'
    },
    logout: {
      icon: getColoredIcon('activity_type', 'logout', 16, '#f59e0b', theme),
      color: '#f59e0b', 
      label: 'Logout'
    },
    failed_login: {
      icon: getColoredIcon('activity_type', 'failed_login', 16, '#dc2626', theme),
      color: '#dc2626',
      label: 'Failed Login'
    },
    password_reset: {
      icon: getColoredIcon('activity_type', 'password_reset', 16, '#0ea5e9', theme),
      color: '#0ea5e9',
      label: 'Password Reset'
    },
    penalty_viewed: {
      icon: getColoredIcon('activity_type', 'penalty_viewed', 16, '#8b5cf6', theme),
      color: '#8b5cf6',
      label: 'Penalty Viewed'
    },
    penalty_created: {
      icon: getColoredIcon('activity_type', 'penalty_created', 16, '#dc2626', theme),
      color: '#dc2626',
      label: 'Penalty Created'
    },
    penalty_updated: {
      icon: getColoredIcon('activity_type', 'penalty_updated', 16, '#f59e0b', theme),
      color: '#f59e0b',
      label: 'Penalty Updated'
    },
    penalty_deleted: {
      icon: getColoredIcon('activity_type', 'penalty_deleted', 16, '#ef4444', theme),
      color: '#ef4444',
      label: 'Penalty Deleted'
    }
  };
  
  return configs[type.toLowerCase()] || {
    icon: getColoredIcon('activity_type', 'activity', 16, '#374151', theme),
    color: '#374151',
    label: type
  };
};

// Program Scope Types
export const PROGRAM_SCOPE_TYPES = {
  GLOBAL: 'global',
  PUBLIC: 'public',
  PROGRAM_SPECIFIC: 'program'
};

export const getProgramScopeConfig = (scope, theme = 'light') => {
  const configs = {
    [PROGRAM_SCOPE_TYPES.GLOBAL]: {
      icon: <Globe size={16} color="#16a34a" />,
      color: '#16a34a',
      label: 'Global'
    },
    [PROGRAM_SCOPE_TYPES.PUBLIC]: {
      icon: <Globe size={16} color="#16a34a" />,
      color: '#16a34a',
      label: 'Public'
    },
    [PROGRAM_SCOPE_TYPES.PROGRAM_SPECIFIC]: {
      icon: getThemedIcon('ui', 'book_open', 16, theme),
      color: '#4f46e5',
      label: 'Program Specific'
    }
  };
  
  return configs[scope] || configs[PROGRAM_SCOPE_TYPES.PUBLIC];
};

// Common Grid Column Definitions
export const COMMON_GRID_COLUMNS = {
  // Activity Log Columns
  ACTIVITY_LOG: [
    {
      field: 'type',
      headerName: 'Type',
      width: 200,
      renderCell: (params) => {
        const config = getActivityLogTypeConfig(params.value);
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
            {config.icon} {config.label}
          </span>
        );
      }
    },
    {
      field: 'timestamp',
      headerName: 'When',
      width: 180,
      renderCell: (params) => {
        const timestamp = params.value;
        if (!timestamp) return '—';
        const date = timestamp?.seconds ? 
          new Date(timestamp.seconds * 1000) : 
          new Date(timestamp);
        return date.toLocaleString();
      }
    }
  ],

  // Resource Columns  
  RESOURCES: [
    {
      field: 'type',
      headerName: 'Type',
      width: 120,
      renderCell: (params) => {
        const config = getResourceTypeConfig(params.value);
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            {config.icon} {config.label}
          </span>
        );
      }
    }
  ],

  // User Columns
  USER: [
    {
      field: 'role',
      headerName: 'Role',
      width: 120,
      renderCell: (params) => {
        const role = params.value;
        return (
          <span style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '4px',
            padding: '0.25rem 0.5rem',
            borderRadius: '0.25rem',
            fontSize: '0.75rem',
            backgroundColor: getRoleColor(role) + '20',
            color: getRoleColor(role)
          }}>
            {getRoleIcon(role)} {getRoleDisplayName(role)}
          </span>
        );
      }
    }
  ]
};

// Dark Mode Color Utilities
export const DARK_MODE_COLORS = {
  text: {
    primary: '#ffffff',
    secondary: '#9ca3af', 
    muted: '#6b7280'
  },
  background: {
    primary: '#111827',
    secondary: '#1f2937',
    tertiary: '#374151'
  },
  border: {
    primary: '#374151',
    secondary: '#4b5563'
  }
};

export const getThemeColor = (colorKey, theme = 'light') => {
  if (theme === 'dark') {
    return DARK_MODE_COLORS[colorKey] || colorKey;
  }
  return colorKey;
};

// Common Icon Sets (exported for backward compatibility)
export const COMMON_ICONS = {
  actions: {
    edit: <Edit size={16} />,
    delete: <Trash size={16} />,
    refresh: <RefreshCw size={16} />,
    view: <Eye size={16} />,
    hide: <EyeOff size={16} />,
    lock: <Lock size={16} />,
    unlock: <KeyRound size={16} />
  },
  status: {
    success: <CheckCircle size={16} />,
    error: <XCircle size={16} />,
    warning: <AlertTriangle size={16} />,
    info: <AlertTriangle size={16} />
  },
  navigation: {
    home: <Home size={16} />,
    settings: <Settings size={16} />,
    search: <Search size={16} />,
    filter: <Filter size={16} />,
    back: <ChevronDown size={16} />
  },
  users: {
    user: <User size={16} />,
    users: <Users size={16} />,
    userPlus: <UserPlus size={16} />,
    userCheck: <UserCheck size={16} />,
    userX: <UserX size={16} />,
    userMinus: <UserMinus size={16} />
  }
};

// Helper functions for role and status (will be imported from existing constants)
const getRoleColor = (role) => {
  // This will be imported from @constants/userRoles
  const roleColors = {
    superadmin: '#f59e0b',
    admin: '#4f46e5', 
    instructor: '#0ea5e9',
    hr: '#8b5cf6',
    student: '#16a34a'
  };
  return roleColors[role] || '#6b7280';
};

const getRoleIcon = (role) => {
  // This will be imported from @constants/userRoles
  const roleIcons = {
    superadmin: getUserRoleIcon('super_admin'),
    admin: getUserRoleIcon('admin'),
    instructor: getUserRoleIcon('instructor'),
    hr: getUserRoleIcon('hr'),
    student: getUserRoleIcon('student')
  };
  return roleIcons[role] || <User size={16} />;
};

const getRoleDisplayName = (role) => {
  // This will be imported from @constants/userRoles
  const roleNames = {
    superadmin: 'Super Admin',
    admin: 'Admin',
    instructor: 'Instructor', 
    hr: 'HR',
    student: 'Student'
  };
  return roleNames[role] || role;
};

export default {
  RESOURCE_TYPES,
  getResourceTypeConfig,
  getResourceTypeOptions,
  getActivityLogTypeConfig,
  getProgramScopeConfig,
  COMMON_GRID_COLUMNS,
  COMMON_ICONS,
  getThemeColor,
  getRoleColor,
  getRoleIcon,
  getRoleDisplayName
};
