// Centralized Icon Management System
// Single source of truth for all icons used across the application

import React from 'react';
import {
  // User & Role Icons
  User, UserCheck, UserX, UserMinus, Users, Shield, Crown, UserPlus,
  // Status Icons
  CheckCircle, XCircle, AlertTriangle, AlertCircle, Info,
  // Activity Icons
  TrendingUp, TrendingDown, Target, Activity, Zap,
  // Academic Icons
  BookOpen, GraduationCap, Award, FileText, Database, Trophy,
  // Communication Icons
  MessageSquare, Bell, BellOff, Send, Phone,
  // Navigation Icons
  Home, Search, Filter, ChevronDown, Link, Video, List,
  // Time Icons
  Clock, Calendar,
  // UI Icons
  Settings, Key, Eye, EyeOff, Lock, LogIn, LogOut,
  // Action Icons
  Edit, Trash, Trash2, RefreshCw, Plus, Minus, X, Copy,
  // File Icons
  FileSignature, Archive, Globe, Tag, QrCode, KeyRound,
  // Behavior/Sleep Icons
  Bed,
  // Other Icons
  HelpCircle, Star, StarOff, ThumbsUp, Moon, LayoutGrid, ZoomIn, Menu, Sun, Ruler, Pin, ClipboardList, Check, Play, Download, BarChart3, LineChart, PieChart, Save, GripVertical,
  // Additional icons from dashboard and chat pages
  Upload, RotateCw, SkipForward, Shuffle, ChevronLeft, ChevronRight, RotateCcw, Bot, Heart,
  // Missing icons from HomePage
  Monitor, Code, Folder, Hourglass, Repeat
} from 'lucide-react';

// Centralized Icon Configuration
// This is the single source of truth for all icon mappings
export const ICON_TYPES = {
  // User Status Icons
  user_status: {
    active: <UserCheck size={16} />,
    inactive: <UserX size={16} />,
    suspended: <UserMinus size={16} />,
    pending: <Clock size={16} />,
    deleted: <Trash size={16} />
  },
  
  // User Role Icons
  user_role: {
    superadmin: <Crown size={16} />,
    admin: <Shield size={16} />,
    instructor: <GraduationCap size={16} />,
    hr: <Users size={16} />,
    student: <User size={16} />
  },
  
  // Attendance Status Icons
  attendance_status: {
    present: <CheckCircle size={16} />,
    late: <Clock size={16} />,
    absent_no_excuse: <XCircle size={16} />,
    absent_with_excuse: <AlertCircle size={16} />,
    excused_leave: <Info size={16} />,
    human_case: <HelpCircle size={16} />
  },
  
  // Behavior Type Icons
  behavior_type: {
    positive: <ThumbsUp size={16} />,
    negative: <TrendingDown size={16} />,
    disruptive: <AlertTriangle size={16} />,
    absent: <UserMinus size={16} />,
    late: <Clock size={16} />,
    sleeping: <Bed size={16} />,
    phone_use: <Phone size={16} />,
    not_participating: <XCircle size={16} />
  },
  
  // Penalty Type Icons
  penalty_type: {
    cheating: <AlertTriangle size={16} />,
    attempted_cheating: <XCircle size={16} />,
    impersonation: <Shield size={16} />,
    exam_disruption: <Zap size={16} />,
    forgery: <AlertTriangle size={16} />,
    repetitive_absence_with_excuse: <Clock size={16} />,
    repetitive_absence_without_excuse: <XCircle size={16} />,
    phone_use_during_exam: <Phone size={16} />,
    plagiarism: <AlertTriangle size={16} />,
    disruptive_behavior: <AlertTriangle size={16} />,
    late_submission: <Clock size={16} />,
    missing_deadline: <Target size={16} />
  },
  
  // Participation Type Icons
  participation_type: {
    excellent: <Star size={16} />,
    good: <ThumbsUp size={16} />,
    average: <User size={16} />,
    poor: <TrendingDown size={16} />,
    question_answer: <MessageSquare size={16} />,
    project_work: <FileText size={16} />,
    team_work: <Users size={16} />
  },
  
  // Activity Type Icons
  activity_type: {
    login: <LogIn size={16} />,
    logout: <LogOut size={16} />,
    failed_login: <XCircle size={16} />,
    password_reset: <Key size={16} />,
    quiz_start: <FileText size={16} />,
    quiz_submit: <Send size={16} />,
    assignment_submit: <FileText size={16} />,
    attendance_mark: <CheckCircle size={16} />,
    user_create: <UserPlus size={16} />,
    user_update: <Edit size={16} />,
    user_delete: <Trash size={16} />,
    delete2: <Trash2 size={16} />,
    class_create: <BookOpen size={16} />,
    class_update: <Edit size={16} />,
    class_delete: <Trash size={16} />
  },
  
  // Notification Type Icons
  notification_type: {
    success: <CheckCircle size={16} />,
    warning: <AlertTriangle size={16} />,
    error: <XCircle size={16} />,
    announcement: <Bell size={16} />,
    grade: <Award size={16} />,
    activity: <Activity size={16} />,
    message: <MessageSquare size={16} />,
    chat: <MessageSquare size={16} />,
    newsletter: <FileText size={16} />,
    attendance: <CheckCircle size={16} />,
    absence: <XCircle size={16} />,
    penalty: <AlertTriangle size={16} />,
    // Additional notification types
    activity_complete: <CheckCircle size={16} />,
    activity_graded: <Award size={16} />,
    enrollment: <Users size={16} />,
    resource: <FileText size={16} />,
    chat_digest: <MessageSquare size={16} />,
    password_reset: <Key size={16} />,
    welcome_signup: <UserPlus size={16} />,
    qr_code: <QrCode size={16} />,
    student_summary: <Users size={16} />,
    custom: <Settings size={16} />
  },
  
  // General UI Icons
  ui: {
    trend_up: <TrendingUp size={16} />,
    trend_down: <TrendingDown size={16} />,
    target: <Target size={16} />,
    search: <Search size={16} />,
    filter: <Filter size={16} />,
    settings: <Settings size={16} />,
    refresh: <RefreshCw size={16} />,
    edit: <Edit size={16} />,
    delete: <Trash size={16} />,
    delete2: <Trash2 size={16} />,
    add: <Plus size={16} />,
    remove: <Minus size={16} />,
    close: <X size={16} />,
    expand: <ChevronDown size={16} />,
    collapse: <ChevronDown size={16} />,
    link: <Link size={16} />,
    video: <Video size={16} />,
    qr_code: <QrCode size={16} />,
    key: <KeyRound size={16} />,
    lock: <Lock size={16} />,
    unlock: <Key size={16} />,
    eye: <Eye size={16} />,
    eye_off: <EyeOff size={16} />,
    home: <Home size={16} />,
    calendar: <Calendar size={16} />,
    clock: <Clock size={16} />,
    bell: <Bell size={16} />,
    bell_off: <BellOff size={16} />,
    message: <MessageSquare size={16} />,
    send: <Send size={16} />,
    phone: <Phone size={16} />,
    globe: <Globe size={16} />,
    tag: <Tag size={16} />,
    archive: <Archive size={16} />,
    database: <Database size={16} />,
    file: <FileText size={16} />,
    check_circle: <CheckCircle size={16} />,
    x_circle: <XCircle size={16} />,
    file_signature: <FileSignature size={16} />,
    help: <HelpCircle size={16} />,
    info: <Info size={16} />,
    warning: <AlertTriangle size={16} />,
    error: <XCircle size={16} />,
    success: <CheckCircle size={16} />,
    moon: <Moon size={16} />,
    layout_grid: <LayoutGrid size={16} />,
    zoom_in: <ZoomIn size={16} />,
    star_off: <StarOff size={16} />,
    menu: <Menu size={16} />,
    sun: <Sun size={16} />,
    crown: <Crown size={16} />,
    shield: <Shield size={16} />,
    book_open: <BookOpen size={16} />,
    users: <Users size={16} />,
    ruler: <Ruler size={16} />,
    star: <Star size={16} />,
    pin: <Pin size={16} />,
    clipboard_list: <ClipboardList size={16} />,
    check: <Check size={16} />,
    play: <Play size={16} />,
    download: <Download size={16} />,
    bar_chart3: <BarChart3 size={16} />,
    line_chart: <LineChart size={16} />,
    pie_chart: <PieChart size={16} />,
    trending_up: <TrendingUp size={16} />,
    save: <Save size={16} />,
    trash2: <Trash2 size={16} />,
    grip_vertical: <GripVertical size={16} />,
    zap: <Zap size={16} />,
    list: <List size={16} />,
    // Additional UI icons needed by the application
    award: <Award size={16} />,
    trophy: <Trophy size={16} />,
    activity: <Activity size={16} />,
    file_text: <FileText size={16} />,
    calendar_check: <Calendar size={16} />,
    message_square: <MessageSquare size={16} />,
    user_check: <UserCheck size={16} />,
    alert_triangle: <AlertTriangle size={16} />,
    trending_down: <TrendingDown size={16} />,
    bar_chart_3: <BarChart3 size={16} />,
    graduation_cap: <GraduationCap size={16} />,
    book: <BookOpen size={16} />,
    school: <Home size={16} />,
    file_check: <FileText size={16} />,
    list_checks: <List size={16} />,
    file_bar_chart_2: <BarChart3 size={16} />,
    // Additional missing icons
    help_circle: <HelpCircle size={16} />,
    bar_chart: <BarChart3 size={16} />,
    mic: <Phone size={16} />,
    smile: <ThumbsUp size={16} />,
    mail: <MessageSquare size={16} />,
    trash: <Trash size={16} />,
    user: <User size={16} />,
    key_round: <KeyRound size={16} />,
    copy: <Copy size={16} />,
    // Additional icons from dashboard and chat pages
    upload: <Upload size={16} />,
    rotate_cw: <RotateCw size={16} />,
    skip_forward: <SkipForward size={16} />,
    shuffle: <Shuffle size={16} />,
    chevron_left: <ChevronLeft size={16} />,
    chevron_right: <ChevronRight size={16} />,
    rotate_ccw: <RotateCcw size={16} />,
    bot: <Bot size={16} />,
    heart: <Heart size={16} />,
    // Missing icons from HomePage
    monitor: <Monitor size={16} />,
    code2: <Code size={16} />,
    folder: <Folder size={16} />,
    hourglass: <Hourglass size={16} />,
    repeat: <Repeat size={16} />,
    // Additional globe variant
    globe2: <Globe size={16} />
  }
};

// Color Constants for Dashboard and Chat
export const DASHBOARD_COLORS = {
  // Status colors
  success: '#16a34a',
  info: '#0ea5e9', 
  primary: '#8b5cf6',
  danger: '#dc2626',
  warning: '#f59e0b',
  default: '#6c757d',
  
  // Role colors
  superadmin: '#f59e0b',
  admin: '#4f46e5', 
  instructor: '#0ea5e9',
  hr: '#8b5cf6',
  student: '#16a34a',
  
  // UI colors
  brand: '#800020',
  text: {
    primary: '#111827',
    secondary: '#374151',
    muted: '#6b7280'
  },
  background: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9'
  },
  border: {
    primary: '#e5e7eb',
    secondary: '#d1d5db'
  }
};

// Dark mode colors
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

// Theme color utility function
export const getThemeColor = (colorKey, theme = 'light') => {
  if (theme === 'dark') {
    return DARK_MODE_COLORS[colorKey] || colorKey;
  }
  return DASHBOARD_COLORS[colorKey] || colorKey;
};

// Icon Utility Functions
export const getIcon = (category, type, size = 16) => {
  const iconConfig = ICON_TYPES[category]?.[type];
  if (!iconConfig) {
    console.warn(`Icon not found: ${category}.${type}`);
    return <Info size={size} />;
  }
  
  // Clone the icon with custom size if needed
  return React.cloneElement(iconConfig, { size });
};

export const getIconWithColor = (category, type, size = 16, color = 'currentColor') => {
  const iconConfig = ICON_TYPES[category]?.[type];
  if (!iconConfig) {
    console.warn(`Icon not found: ${category}.${type}`);
    return <Info size={size} color={color} />;
  }
  
  // Clone the icon with custom size and color
  return React.cloneElement(iconConfig, { size, color });
};

// Legacy compatibility functions for existing code
export const getTypeIcon = (type, category = 'ui') => {
  return getIcon(category, type);
};

export const getAttendanceIcon = (status) => {
  return getIcon('attendance_status', status);
};

export const getBehaviorIcon = (type) => {
  return getIcon('behavior_type', type);
};

export const getPenaltyIcon = (type) => {
  return getIcon('penalty_type', type);
};

export const getParticipationIcon = (type) => {
  return getIcon('participation_type', type);
};

export const getNotificationIcon = (type) => {
  return getIcon('notification_type', type);
};

export const getActivityIcon = (type) => {
  return getIcon('activity_type', type);
};

export const getUserStatusIcon = (status) => {
  return getIcon('user_status', status);
};

export const getUserRoleIcon = (role) => {
  return getIcon('user_role', role);
};

// Color-aware icon functions
export const getThemedIcon = (category, type, size = 16, theme = 'light') => {
  const colorMap = {
    light: {
      primary: '#3b82f6',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      neutral: '#6b7280'
    },
    dark: {
      primary: '#60a5fa',
      success: '#4ade80',
      warning: '#fbbf24',
      error: '#f87171',
      neutral: '#9ca3af'
    }
  };
  
  // Default color based on category
  const defaultColors = {
    user_status: 'neutral',
    user_role: 'primary',
    attendance_status: 'success',
    behavior_type: 'warning',
    penalty_type: 'error',
    participation_type: 'primary',
    activity_type: 'neutral',
    notification_type: 'primary',
    ui: 'neutral'
  };
  
  const colorCategory = defaultColors[category] || 'neutral';
  const color = colorMap[theme]?.[colorCategory] || 'currentColor';
  
  return getIconWithColor(category, type, size, color);
};

// White icon utility for navbar
export const getWhiteIcon = (category, type, size = 16) => {
  return getIconWithColor(category, type, size, '#ffffff');
};

export default {
  ICON_TYPES,
  getIcon,
  getIconWithColor,
  getThemedIcon,
  getWhiteIcon,
  getTypeIcon,
  getAttendanceIcon,
  getBehaviorIcon,
  getPenaltyIcon,
  getParticipationIcon,
  getNotificationIcon,
  getActivityIcon,
  getUserStatusIcon,
  getUserRoleIcon
};
