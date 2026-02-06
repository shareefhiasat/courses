import React from 'react';
import {
  Edit, Trash, MessageSquare, AlertTriangle, Clock, XCircle, Shield, Zap, 
  UserCheck, UserX, UserMinus, Info, TrendingUp, TrendingDown, Target, 
  Award, Star, ThumbsUp, Minus, Bed, Users, Smartphone, HelpCircle, 
  User, AlertCircle, Crown, GraduationCap, FileText, Phone, Coffee
} from 'lucide-react';
import { ICON_TYPES, getIcon, getThemedIcon } from './iconTypes.jsx';

// Common Page States
export const PAGE_STATES = {
  LOADING: 'loading',
  READY: 'ready',
  ERROR: 'error',
  SAVING: 'saving',
  DELETING: 'deleting'
};

// Common Form States
export const FORM_STATES = {
  IDLE: 'idle',
  EDITING: 'editing',
  CREATING: 'creating',
  DIRTY: 'dirty',
  VALIDATING: 'validating'
};

// Common Modal Types
export const MODAL_TYPES = {
  DELETE: 'delete',
  EDIT: 'edit',
  CREATE: 'create',
  CONFIRM: 'confirm',
  INFO: 'info'
};

// Icon Mappings for Different Types - Use centralized icon system
export const TYPE_ICONS = ICON_TYPES;

// Helper function to get themed icons
export const getThemedTypeIcon = (category, type, theme = 'light') => {
  return getThemedIcon(category, type, 16, theme);
};

// Legacy function for backward compatibility
export const getTypeIcon = (type, category = 'ui') => {
  return getIcon(category, type);
};

// Common Grid Column Definitions
export const COMMON_GRID_COLUMNS = {
  // User columns
  USER: [
    {
      field: 'displayName',
      headerName: 'Name',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => {
        const user = params.row;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {getTypeIcon('user', user.status?.toLowerCase())}
            <span>{params.value}</span>
          </div>
        );
      }
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1,
      minWidth: 200
    }
  ],
  
  // Date columns
  DATE: [
    {
      field: 'date',
      headerName: 'Date',
      width: 150,
      renderCell: (params) => {
        const date = params.value;
        if (!date) return '—';
        return new Date(date).toLocaleDateString();
      }
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 150,
      renderCell: (params) => {
        const date = params.value;
        if (!date) return '—';
        return new Date(date).toLocaleDateString();
      }
    }
  ],
  
  // Status columns
  STATUS: [
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => {
        const status = params.value;
        const statusConfig = {
          active: { color: '#16a34a', label: 'Active' },
          inactive: { color: '#dc2626', label: 'Inactive' },
          pending: { color: '#f59e0b', label: 'Pending' },
          completed: { color: '#22c55e', label: 'Completed' }
        };
        
        const config = statusConfig[status] || { color: '#6b7280', label: status };
        
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            backgroundColor: config.color + '20',
            color: config.color
          }}>
            {config.label}
          </span>
        );
      }
    }
  ],
  
  // Action columns
  ACTIONS: (onEdit, onDelete) => [
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      renderCell: (params) => (
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => onEdit(params.row)}
            style={{
              padding: '4px 8px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: '#3b82f6',
              color: 'white',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            <Edit size={12} />
          </button>
          <button
            onClick={() => onDelete(params.row)}
            style={{
              padding: '4px 8px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: '#dc2626',
              color: 'white',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            <Trash size={12} />
          </button>
        </div>
      )
    }
  ]
};

// Common Form Validation Rules
export const VALIDATION_RULES = {
  required: (value) => !!value || 'This field is required',
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 'Invalid email address',
  minLength: (min) => (value) => value.length >= min || `Minimum ${min} characters required`,
  maxLength: (max) => (value) => value.length <= max || `Maximum ${max} characters allowed`,
  number: (value) => !isNaN(value) || 'Must be a number',
  positive: (value) => Number(value) > 0 || 'Must be a positive number'
};

// Common Filter Options
export const COMMON_FILTERS = {
  status: [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'pending', label: 'Pending' }
  ],
  
  dateRange: [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' }
  ],
  
  sortBy: [
    { value: 'createdAt', label: 'Created Date' },
    { value: 'updatedAt', label: 'Updated Date' },
    { value: 'name', label: 'Name' },
    { value: 'status', label: 'Status' }
  ]
};

// Common Page Layout Configurations
export const PAGE_LAYOUTS = {
  // Standard management page layout
  MANAGEMENT: {
    header: {
      title: '',
      actions: ['create', 'refresh', 'export']
    },
    filters: ['search', 'status', 'dateRange'],
    table: {
      columns: ['user', 'date', 'status', 'actions'],
      pagination: true,
      selection: true
    },
    modals: ['create', 'edit', 'delete']
  },
  
  // Dashboard tab layout
  DASHBOARD_TAB: {
    header: {
      title: '',
      actions: ['refresh']
    },
    filters: ['search', 'status'],
    table: {
      columns: ['user', 'date', 'status'],
      pagination: false,
      selection: false
    },
    modals: ['edit', 'delete']
  }
};

// Theme-aware styling utilities
export const getThemeStyles = (theme = 'light') => {
  return {
    background: theme === 'dark' ? '#111827' : '#ffffff',
    surface: theme === 'dark' ? '#1f2937' : '#f8fafc',
    border: theme === 'dark' ? '#374151' : '#e2e8f0',
    text: {
      primary: theme === 'dark' ? '#f9fafb' : '#1f2937',
      secondary: theme === 'dark' ? '#d1d5db' : '#6b7280',
      muted: theme === 'dark' ? '#9ca3af' : '#9ca3af'
    }
  };
};

// Common error messages
export const ERROR_MESSAGES = {
  NETWORK: 'Network error. Please check your connection.',
  PERMISSION: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested item was not found.',
  VALIDATION: 'Please check your input and try again.',
  SERVER: 'Server error. Please try again later.',
  UNKNOWN: 'An unexpected error occurred.'
};

// Common success messages
export const SUCCESS_MESSAGES = {
  CREATED: 'Item created successfully.',
  UPDATED: 'Item updated successfully.',
  DELETED: 'Item deleted successfully.',
  SAVED: 'Changes saved successfully.',
  LOADED: 'Data loaded successfully.'
};
