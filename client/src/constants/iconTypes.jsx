// Centralized Icon Management System
// Single source of truth for all icons used across the application

import React from 'react';
import PortalTooltip from '@ui/PortalTooltip';
import { resolveIconSize } from '@utils/iconSize';
import {
  // User & Role Icons
  User, UserCheck, UserX, UserMinus, Users, Shield, Crown, UserPlus,
  // Workflow Icons
  Workflow, GitBranch,
  // Status Icons
  CheckCircle, XCircle, AlertTriangle, AlertCircle, Info,
  // Activity Icons
  TrendingUp, TrendingDown, Target, Activity, Zap,
  // Academic Icons
  BookOpen, GraduationCap, Award, FileText, Database, Trophy, Gamepad2, Calculator,
  // Communication Icons
  MessageSquare, Bell, BellOff, Send, Phone, Mailbox, Megaphone, MailOpen, MousePointerClick, CornerDownLeft, Flag, ListFilter, Share,
  // Navigation Icons
  Home, Search, Filter, ChevronDown, ChevronUp, ChevronsUp, ChevronsUpDown, Link, Video, List, ExternalLink, Maximize, Square,
  // Time Icons
  Clock, Calendar, Coffee, Umbrella,
  // UI Icons
  Settings, Key, Eye, EyeOff, Lock, LogIn, LogOut, MoreVertical,
  // Action Icons
  Edit, Trash, Trash2, RefreshCw, Plus, Minus, X, Copy, Wrench, Clipboard, PlusCircle, FileCheck,
  // File Icons
  FileSignature, Archive, Globe, Tag, QrCode, KeyRound, Paperclip, Image, Presentation, Table,
  // Behavior/Sleep Icons
  Bed,
  // Other Icons
  HelpCircle, Star, StarOff, ThumbsUp, Moon, LayoutGrid, LayoutDashboard, ZoomIn, Menu, Sun, Ruler, Pin, ClipboardList, Check, Play, PlayCircle, Download, BarChart3, LineChart, PieChart, Save, GripVertical, Hash,
  // Reaction Icons
  Smile, Frown, Mic,
  // Additional icons from dashboard and chat pages
  Upload, RotateCw, SkipForward, Shuffle, ChevronLeft, ChevronRight, RotateCcw, Bot, Heart,
  // Missing icons from HomePage
  Monitor, Code, Folder, Hourglass, Repeat, Droplet,
  // Notification settings icons
  Volume2, Vibrate, SlidersHorizontal, FlaskConical,
  // Additional icons for CategoriesPage
  Cloud, Layers, Package, Bookmark,
} from 'lucide-react';

// Additional imports for UI badge functions
import { ATTENDANCE_STATUS_LABELS, getAttendanceColor, getLocalizedAttendanceLabel } from '@constants/attendanceTypes';
import { Tooltip } from '@ui';


import { info, error, warn, debug } from '@services/utils/logger.js';// Centralized Icon Configuration
// This is the single source of truth for all icon mappings
export const ICON_TYPES = {
  // User Status Icons
  user_status: {
    active: <UserCheck size={16} />,
    inactive: <UserX size={16} />,
    suspended: <UserMinus size={16} />,
    pending: <Clock size={16} />,
    deleted: <Trash size={16} />,
    user_check: <UserCheck size={16} />
  },
  
  // User Role Icons
  user_role: {
    super_admin: <Crown size={16} />,
    superadmin: <Crown size={16} />,
    admin: <Shield size={16} />,
    instructor: <GraduationCap size={16} />,
    hr: <Users size={16} />,
    owner: <Star size={16} />,
    student: <User size={16} />
  },
  
  // Attendance Status Icons
  attendance_status: {
    present: <CheckCircle size={16} />,
    late: <Clock size={16} />,
    absent_no_excuse: <XCircle size={16} />,
    absent_with_excuse: <AlertCircle size={16} />,
    excused_leave: <Info size={16} />,
    human_case: <HelpCircle size={16} />,
    none: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
      </svg>
    )
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
    eye: <Eye size={16} />,
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
    class_delete: <Trash size={16} />,
    penalty_viewed: <Eye size={16} />,
    penalty_created: <AlertTriangle size={16} />,
    penalty_updated: <Edit size={16} />,
    penalty_deleted: <Trash2 size={16} />,
    activity: <Activity size={16} />,
    // Activity type icons
    quiz: <FileText size={16} />,
    homework: <FileText size={16} />,
    training: <Award size={16} />,
    project: <Folder size={16} />,
    exam: <FileText size={16} />,
    assignment: <FileText size={16} />,
    participation: <Users size={16} />,
    presentation: <Video size={16} />,
    lab: <Monitor size={16} />,
    trip: <Globe size={16} />,
    case: <Folder size={16} />,
    research: <Search size={16} />,
    debate: <MessageSquare size={16} />,
    workshop: <Settings size={16} />,
    seminar: <Users size={16} />,
    star: <Star size={16} />,
    zap: <Zap size={16} />,
    trophy: <Trophy size={16} />
  },
  
  // Difficulty Type Icons
  difficulty: {
    beginner: <Star size={16} />,
    intermediate: <Star size={16} />,
    advanced: <Star size={16} />
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
    refresh_cw: <RefreshCw size={16} />,
    edit: <Edit size={16} />,
    delete: <Trash size={16} />,
    delete2: <Trash2 size={16} />,
    add: <Plus size={16} />,
    plus: <Plus size={16} />,
    remove: <Minus size={16} />,
    close: <X size={16} />,
    expand: <ChevronDown size={16} />,
    collapse: <ChevronDown size={16} />,
    chevron_up: <ChevronUp size={16} />,
    image: <Image size={16} />,
    presentation: <Presentation size={16} />,
    link: <Link size={16} />,
    external_link: <ExternalLink size={16} />,
    maximize: <Maximize size={16} />,
    minimize: <Minus size={16} />,
    square: <Square size={16} />,
    video: <Video size={16} />,
    qr_code: <QrCode size={16} />,
    code: <Code size={16} />,
    droplet: <Droplet size={16} />,
    key: <KeyRound size={16} />,
    lock: <Lock size={16} />,
    unlock: <Key size={16} />,
    eye: <Eye size={16} />,
    eye_off: <EyeOff size={16} />,
    home: <Home size={16} />,
    calendar: <Calendar size={16} />,
    clock: <Clock size={16} />,
    coffee: <Coffee size={16} />,
    umbrella: <Umbrella size={16} />,
    bell: <Bell size={16} />,
    bell_off: <BellOff size={16} />,
    message: <MessageSquare size={16} />,
    send: <Send size={16} />,
    phone: <Phone size={16} />,
    globe: <Globe size={16} />,
    tag: <Tag size={16} />,
    share: <Share size={16} />,
    archive: <Archive size={16} />,
    database: <Database size={16} />,
    file: <FileText size={16} />,
    check_circle: <CheckCircle size={16} />,
    x_circle: <XCircle size={16} />,
    file_signature: <FileSignature size={16} />,
    help: <HelpCircle size={16} />,
    info: <Info size={16} />,
    warning: <AlertTriangle size={16} />,
    package: <Package size={16} />,
    terminal: <Monitor size={16} />,
    bookmark: <Bookmark size={16} />,
    error: <XCircle size={16} />,
    success: <CheckCircle size={16} />,
    moon: <Moon size={16} />,
    layout_grid: <LayoutGrid size={16} />,
    layout_dashboard: <LayoutDashboard size={16} />,
    grid: <LayoutGrid size={16} />,
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
    play_circle: <PlayCircle size={16} />,
    download: <Download size={16} />,
    workflow: <Workflow size={16} />,
    academic: <GraduationCap size={16} />,
    attendance: <CheckCircle size={16} />,
    assessment: <FileText size={16} />,
    announcement: <Megaphone size={16} />,
    behavior: <TrendingUp size={16} />,
    qr: <QrCode size={16} />,
    bar_chart3: <BarChart3 size={16} />,
    line_chart: <LineChart size={16} />,
    pie_chart: <PieChart size={16} />,
    trending_up: <TrendingUp size={16} />,
    save: <Save size={16} />,
    sidebar_open: <Menu size={16} />,
    trash2: <Trash2 size={16} />,
    grip_vertical: <GripVertical size={16} />,
    zap: <Zap size={16} />,
    list: <List size={16} />,
    hash: <Hash size={16} />,
    document: <FileText size={16} />,
    bed: <Home size={16} />,
    hourglass: <Hourglass size={16} />,
    repeat: <Repeat size={16} />,
    'file-check': <FileCheck size={16} />,
    'plus-circle': <PlusCircle size={16} />,
    // Additional UI icons needed by the application
    award: <Award size={16} />,
    trophy: <Trophy size={16} />,
    activity: <Activity size={16} />,
    file_text: <FileText size={16} />,
    'file-text': <FileText size={16} />,
    table: <Table size={16} />,
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
    smile: <Smile size={16} />,
    frown: <Frown size={16} />,
    thumbs_up: <ThumbsUp size={16} />,
    mic: <Mic size={16} />,
    audio: <Mic size={16} />,
    music: <Mic size={16} />,
    paperclip: <Paperclip size={16} />,
    attachment: <Paperclip size={16} />,
    // Missing icons from LoginActivityPage
    log_in: <LogIn size={16} />,
    log_out: <LogOut size={16} />,
    stop: <X size={16} />,
    key_round: <KeyRound size={16} />,
    user: <User size={16} />,
    api: <Globe size={16} />,
    mail: <MessageSquare size={16} />,
    // Notification settings icons
    volume: <Volume2 size={16} />,
    vibrate: <Vibrate size={16} />,
    test: <Monitor size={16} />,
    mailbox: <Mailbox size={16} />,
    megaphone: <Megaphone size={16} />,
    mail_open: <MailOpen size={16} />,
    mouse_pointer_click: <MousePointerClick size={16} />,
    corner_down_left: <CornerDownLeft size={16} />,
    flag: <Flag size={16} />,
    list_filter: <ListFilter size={16} />,
    chevron_left: <ChevronLeft size={16} />,
    chevron_right: <ChevronRight size={16} />,
    rotate_cw: <RotateCw size={16} />,
    skip_forward: <SkipForward size={16} />,
    shuffle: <Shuffle size={16} />,
    bot: <Bot size={16} />,
    heart: <Heart size={16} />,
    trash: <Trash size={16} />,
    copy: <Copy size={16} />,
    more_vertical: <MoreVertical size={16} />,
    wrench: <Wrench size={16} />,
    git_branch: <GitBranch size={16} />,
    // Missing icons causing warnings
    volume2: <Volume2 size={16} />,
    test_tube: <FlaskConical size={16} />,
    palette: <Sun size={16} />,
    smartphone: <Phone size={16} />,
    clipboard: <Clipboard size={16} />,
    // Additional icons from dashboard and chat pages
    upload: <Upload size={16} />,
    rotate_ccw: <RotateCcw size={16} />,
    // Missing icons from HomePage
    monitor: <Monitor size={16} />,
    code2: <Code size={16} />,
    sliders_horizontal: <SlidersHorizontal size={16} />,
    // Missing icons for loading states
    loader: <RefreshCw size={16} />,
    // Additional icons for various components
    calculator: <Calculator size={16} />,
    formula_sheet: <BookOpen size={16} />,
    user_plus: <UserPlus size={16} />,
    user_minus: <UserMinus size={16} />,
    user_x: <UserX size={16} />,
    // UI-specific icons
    'ui.workflow': <Workflow size={16} />,
    'ui.academic': <GraduationCap size={16} />,
    'ui.attendance': <CheckCircle size={16} />,
    'ui.assessment': <Award size={16} />,
    'ui.announcement': <Megaphone size={16} />,
    'ui.behavior': <Activity size={16} />,
    'ui.qr': <QrCode size={16} />,
    'ui.more_vertical': <MoreVertical size={16} />,
    
    // Aliases for hyphenated names to prevent warnings
    'help-circle': <HelpCircle size={16} />,
    'book-open': <BookOpen size={16} />,
    folder: <Folder size={16} />,
    globe2: <Globe size={16} />,
    // Missing icons that were causing errors
    gamepad2: <Gamepad2 size={16} />,
    timer: <Clock size={16} />,
    // Additional missing icons
    alert_circle: <AlertCircle size={16} />,
    chevron_down: <ChevronDown size={16} />,
    chevrons_up: <ChevronsUp size={16} />,
    chevrons_up_down: <ChevronsUpDown size={16} />,
    x: <X size={16} />,
    // Open tab icon for sticky mode
    open_tab: <LayoutGrid size={16} />,
    // Open new tab icon
    open_new_tab: <ExternalLink size={16} />,
    // Category icons from CategoriesPage
    server: <Monitor size={16} />,
    cloud: <Cloud size={16} />,
    cpu: <Monitor size={16} />,
    hard_drive: <Monitor size={16} />,
    wifi: <Globe size={16} />,
    bug: <AlertTriangle size={16} />,
    puzzle: <Package size={16} />,
    layers: <Layers size={16} />,
    brain: <Monitor size={16} />,
    // Missing icons causing console errors
    minus: <Minus size={16} />,
    pin_off: <Pin size={16} />,
    // Aliases without underscores for compatibility
    checkcircle: <CheckCircle size={16} />,
    xcircle: <XCircle size={16} />,
    alertcircle: <AlertCircle size={16} />,
    helpcircle: <HelpCircle size={16} />,
    // Arrow icon aliases
    arrow_left: <ChevronLeft size={16} />,
    arrow_right: <ChevronRight size={16} />,
    // Additional missing icons
    bookmark_check: <Bookmark size={16} />,
    edit2: <Edit size={16} />,
    edit3: <Edit size={16} />,
    check_square: <Check size={16} />
  }
};

// Centralized Category Icons for reuse across application
export const CATEGORY_ICONS = [
  'folder', 'book', 'code', 'database', 'globe', 'monitor', 
  'server', 'cloud', 'cpu', 'hard_drive', 'wifi', 'shield', 
  'lock', 'key', 'bug', 'puzzle', 'layers', 'package', 
  'terminal', 'settings', 'brain', 'star', 'heart', 'zap',
  'target', 'award', 'trophy', 'flag', 'bookmark', 'tag'
];

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
  size = resolveIconSize(size);
  // Handle undefined/null type gracefully
  if (!type || typeof type !== 'string') {
    // Return a default icon based on category
    const defaultIcons = {
      ui: 'folder',
      activity_type: 'activity',
      difficulty: 'star',
      quiz: 'file',
      homework: 'file',
      training: 'graduation',
      project: 'folder',
      exam: 'file',
      assignment: 'file',
      participation: 'user',
      presentation: 'file',
      lab: 'flask',
      trip: 'map',
      case: 'folder',
      research: 'search',
      debate: 'users',
      workshop: 'users',
      seminar: 'users'
    };
    const defaultIcon = defaultIcons[category] || 'file';
    const iconConfig = ICON_TYPES[category]?.[defaultIcon];
    if (iconConfig) {
      const icon = typeof iconConfig === 'function' ? iconConfig(size) : iconConfig;
      return React.cloneElement(icon, { fill: 'none' });
    }
    return <FileText size={size} fill="none" />;
  }
  
  const iconConfig = ICON_TYPES[category]?.[type];
  if (!iconConfig) {
    // Try to find a similar icon or return default
    const defaultIcons = {
      ui: 'folder',
      activity_type: 'activity',
      difficulty: 'star',
      quiz: 'file',
      homework: 'file',
      training: 'graduation',
      project: 'folder',
      exam: 'file',
      assignment: 'file',
      participation: 'user',
      presentation: 'file',
      lab: 'flask',
      trip: 'map',
      case: 'folder',
      research: 'search',
      debate: 'users',
      workshop: 'users',
      seminar: 'users'
    };
    const defaultIcon = defaultIcons[category] || 'file';
    const fallbackConfig = ICON_TYPES[category]?.[defaultIcon];
    if (fallbackConfig) {
      const icon = typeof fallbackConfig === 'function' ? fallbackConfig(size) : fallbackConfig;
      return React.cloneElement(icon, { fill: 'none' });
    }
    return <FileText size={size} fill="none" />;
  }
  
  const icon = typeof iconConfig === 'function' ? iconConfig(size) : iconConfig;
  return React.cloneElement(icon, { fill: 'none' });
};

export const getIconWithColor = (category, type, size = 16, color = 'currentColor') => {
  size = resolveIconSize(size);
  // Skip warning for undefined types - we handle this gracefully
  if (type === undefined || type === null) {
    return <Info size={size} color={color} fill="none" />;
  }
  
  const iconConfig = ICON_TYPES[category]?.[type];
  if (!iconConfig) {
    // Only warn for defined types that are missing
    warn(`Icon not found: ${category}.${type}`);
    return <Info size={size} color={color} fill="none" />;
  }
  
  // Clone the icon with custom size, color, and ensure no fill
  return React.cloneElement(iconConfig, { size, color, fill: 'none' });
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

// Role color configuration
export const ROLE_COLORS = {
  super_admin: '#f59e0b',
  superadmin: '#f59e0b',
  admin: '#4f46e5',
  instructor: '#0ea5e9',
  hr: '#8b5cf6',
  owner: '#f59e0b',
  student: '#16a34a'
};

export const getUserRoleColor = (role) => {
  return ROLE_COLORS[role] || '#6b7280';
};

// Color-aware icon functions
export const getThemedIcon = (category, type, size = 16, theme = 'light', props = {}) => {
  // Check if theme is an explicit color (like 'white') - if so, use it directly
  if (typeof theme === 'string' && (theme === 'white' || theme.startsWith('#') || theme === 'currentColor')) {
    const icon = getIconWithColor(category, type, size, theme);
    return React.cloneElement(icon, { fill: 'none', ...props });
  }
  
  // Use dynamic theme colors from CSS variables
  const getThemeBasedColor = () => {
    // Try to get the color from CSS variables (for dynamic theming)
    if (typeof window !== 'undefined') {
      const rootStyle = getComputedStyle(document.documentElement);
      const primaryColor = rootStyle.getPropertyValue('--color-primary')?.trim();
      if (primaryColor) {
        return primaryColor;
      }
    }
    
    // Fallback to hardcoded colors if CSS variables aren't available
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
    return colorMap[theme]?.[colorCategory] || 'currentColor';
  };
  
  const color = getThemeBasedColor();
  const icon = getIconWithColor(category, type, size, color);
  return React.cloneElement(icon, { fill: 'none', ...props });
};

// White icon utility for navbar
export const getWhiteIcon = (category, type, size = 16) => {
  return getIconWithColor(category, type, size, '#ffffff');
};

// Colored icon utility - derives color from chip color
export const getColoredIcon = (category, type, size = 16, chipColor = null, theme = 'light') => {
  if (!chipColor) {
    return getThemedIcon(category, type, size, theme);
  }
  
  // Derive icon color from chip color
  const derivedColor = deriveIconColor(chipColor);
  return getIconWithColor(category, type, size, derivedColor);
};

// Helper function to get icon color based on theme
export const getIconColor = (defaultColor, theme) => {
  return defaultColor;
};

// Derive icon color from chip color
export const deriveIconColor = (chipColor) => {
  // If chip is orange/green/red, derive a complementary color
  if (chipColor === '#f59e0b') return '#d97706'; // Orange chip -> darker orange icon
  if (chipColor === '#22c55e') return '#16a34a'; // Green chip -> darker green icon
  if (chipColor === '#16a34a') return '#16a34a'; // Dark green chip -> same dark green icon
  if (chipColor === '#ef4444') return '#dc2626'; // Red chip -> darker red icon
  if (chipColor === '#EF4444') return '#dc2626'; // Red chip (uppercase) -> darker red icon
  if (chipColor === '#b91c1c') return '#b91c1c'; // Dark red chip -> same dark red icon
  if (chipColor === '#dc2626') return '#dc2626'; // Darker red chip -> same darker red icon
  if (chipColor === '#f57c00') return '#f57c00'; // Orange chip -> same orange icon
  if (chipColor === '#3b82f6') return '#2563eb'; // Blue chip -> darker blue icon
  if (chipColor === '#1e40af') return '#1e40af'; // Dark blue chip -> same dark blue icon
  if (chipColor === '#8b5cf6') return '#7c3aed'; // Purple chip -> darker purple icon
  if (chipColor === '#f97316') return '#ea580c'; // Light red chip -> darker red icon
  if (chipColor === '#fbbf24') return '#f59e0b'; // Yellow chip -> darker yellow icon
  if (chipColor === '#f5c518') return '#f5c518'; // Gold chip -> same gold icon
  if (chipColor === '#0ea5e9') return '#0ea5e9'; // Sky blue chip -> same sky blue icon
  if (chipColor === '#166534') return '#166534'; // Dark green chip -> same dark green icon
  if (chipColor === '#c2410c') return '#c2410c'; // Dark orange chip -> same dark orange icon
  if (chipColor === '#4f46e5') return '#4f46e5'; // Indigo chip -> same indigo icon
  if (chipColor === '#4F46E5FF') return '#4f46e5'; // Indigo chip with alpha -> same indigo icon
  if (chipColor === '#d97706') return '#d97706'; // Orange chip -> same orange icon
  if (chipColor === '#b45309') return '#b45309'; // Amber chip -> same amber icon
  if (chipColor === '#2e7d32') return '#2e7d32'; // Green chip -> same green icon
  if (chipColor === '#1976d2') return '#1976d2'; // Blue chip -> same blue icon
  
  // Default to white for dark themes, dark for light themes
  return '#ffffff';
};

// UI Badge Functions

/**
 * Creates a standardized attendance badge with icon and count
 */
export const createAttendanceBadge = (count, iconType, color, tooltipText, theme) => {
  if (!count || count <= 0) return null;

  return (
    <PortalTooltip content={tooltipText} position="top">
      <span
        style={{
          background: `${color}15`,
          color: color,
          padding: '1px 4px',
          borderRadius: 3,
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '2px'
        }}
      >
        {getThemedIcon('ui', iconType, 10, getIconColor(color, theme))}
        {count}
      </span>
    </PortalTooltip>
  );
};

/**
 * Creates a standardized badge for class stats (penalties, behaviors, etc.)
 */
export const createClassStatBadge = (count, iconType, color, tooltipText, theme) => {
  if (!count || count <= 0) return null;

  return (
    <Tooltip content={tooltipText}>
      <span
        style={{
          background: `${color}15`,
          color: color,
          padding: '1px 4px',
          borderRadius: 3,
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '2px'
        }}
      >
        {getThemedIcon(iconType.type, iconType.name, 10, getIconColor(color, theme))}
        {count}
      </span>
    </Tooltip>
  );
};

/**
 * Gets attendance status color and label
 */
export const getAttendanceStatusInfo = (status, lang = 'en') => {
  return {
    color: getAttendanceColor(status) || '#6b7280',
    label: getLocalizedAttendanceLabel(status, lang) || status,
    icon: getAttendanceIcon(status)
  };
};

/**
 * Creates attendance summary stats with icons and colors
 */
export const createAttendanceSummaryStats = (marks, theme) => {
  const stats = [
    { key: 'present', statusKey: 'PRESENT' },
    { key: 'late', statusKey: 'LATE' },
    { key: 'absent_no_excuse', statusKey: 'ABSENT_NO_EXCUSE' },
    { key: 'absent_with_excuse', statusKey: 'ABSENT_WITH_EXCUSE' },
    { key: 'excused_leave', statusKey: 'EXCUSED_LEAVE' },
    { key: 'human_case', statusKey: 'HUMAN_CASE' }
  ];

  return stats.map(({ key, statusKey }) => {
    const count = marks.filter(m => {
      const status = (m.status || 'present').toLowerCase();
      // Handle legacy statuses
      if (key === 'absent_no_excuse' && (status === 'absent' || status === 'absent_no_excuse')) return true;
      if (key === 'absent_with_excuse' && status === 'absent_with_excuse') return true;
      if (key === 'excused_leave' && (status === 'leave' || status === 'excused_leave')) return true;
      return status === key;
    }).length;
    
    const color = getAttendanceColor(statusKey) || '#6b7280';
    const displayLabel = getLocalizedAttendanceLabel(statusKey, 'en') || key;
    const icon = getAttendanceIcon(key);
    
    return {
      key,
      count,
      color,
      label: displayLabel,
      icon
    };
  });
};

/**
 * Class stat configurations for badges
 */
export const CLASS_STAT_CONFIGS = {
  students: {
    color: '#22c55e', // This will be overridden with primaryColor
    icon: { type: 'ui', name: 'users' }
  },
  penalties: {
    color: '#ef4444',
    icon: { type: 'penalty_type', name: 'cheating' }
  },
  behaviors: {
    color: '#f59e0b',
    icon: { type: 'behavior_type', name: 'disruptive' }
  },
  quizzes: {
    color: '#8b5cf6',
    icon: { type: 'ui', name: 'file_text' }
  },
  activities: {
    color: '#10b981',
    icon: { type: 'participation_type', name: 'excellent' }
  },
  announcements: {
    color: '#3b82f6',
    icon: { type: 'ui', name: 'megaphone' }
  },
  resources: {
    color: '#06b6d4',
    icon: { type: 'ui', name: 'folder' }
  },
  sessions: {
    color: '#8b5cf6',
    icon: { type: 'ui', name: 'calendar' }
  }
};

export default {
  ICON_TYPES,
  getIcon,
  getIconWithColor,
  getThemedIcon,
  getWhiteIcon,
  getColoredIcon,
  getTypeIcon,
  getAttendanceIcon,
  getBehaviorIcon,
  getPenaltyIcon,
  getParticipationIcon,
  getNotificationIcon,
  getActivityIcon,
  getUserStatusIcon,
  getUserRoleIcon,
  deriveIconColor,
  getIconColor,
  createAttendanceBadge,
  createClassStatBadge,
  getAttendanceStatusInfo,
  createAttendanceSummaryStats,
  CLASS_STAT_CONFIGS
};
