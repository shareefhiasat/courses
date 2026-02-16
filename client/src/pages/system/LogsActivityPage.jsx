import React, { useState, useEffect } from 'react';
import { useTheme } from '@contexts/ThemeContext';
import { useLang } from '@contexts/LangContext';
import { useToast } from '@ui';
import { getQatarTimeAgo, formatQatarDate } from '@utils/timezone';
import { getThemedIcon } from '@constants/iconTypes';
import { Button, Input, Select, UserSelect, DateRangeSlider, AdvancedDataGrid, Modal } from '@ui';
import { getLoginLogs, deleteAllLoginLogs, deleteLoginLogsByType } from '@services/business/activityService';
import { getUsers } from '@services/business/userService';
import { getEnrollments } from '@services/business/enrollmentService';
import { 
  LogIn, 
  LogOut, 
  Clock, 
  User, 
  KeyRound, 
  Mail, 
  Shield, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  Play, 
  CheckCircle, 
  RotateCw, 
  Save, 
  Upload, 
  Star, 
  MessageSquare, 
  Bookmark, 
  Download, 
  Send, 
  Inbox, 
  PlusCircle, 
  Edit, 
  Trash, 
  LayoutDashboard, 
  BarChart, 
  Activity, 
  Calculator, 
  FileText, 
  BookOpen, 
  Pointer, 
  X, 
  UserPlus, 
  UserMinus, 
  UserCheck, 
  UserX, 
  Search,
  Monitor,
  Globe,
  Zap
} from 'lucide-react';

const LogsActivityPage = () => {
  const { t } = useLang();
  const toast = useToast();
  const theme = useTheme();

  // Component state - no longer received as props
  const [loginLogs, setLoginLogs] = useState([]);
  const [activityTypeFilter, setActivityTypeFilter] = useState('all');
  const [loginSearch, setLoginSearch] = useState('');
  const [loginUserFilter, setLoginUserFilter] = useState('all');
  const [loginFrom, setLoginFrom] = useState('');
  const [loginTo, setLoginTo] = useState('');
  const [activityAutoRefreshMs, setActivityAutoRefreshMs] = useState(0);
  const [activityNowTick, setActivityNowTick] = useState(Date.now());
  const [activityLastUpdatedAt, setActivityLastUpdatedAt] = useState(Date.now());
  const [users, setUsers] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ open: false });
  const [loading, setLoading] = useState(false);

  // Load data function
  const loadData = async () => {
    setLoading(true);
    try {
      const [loginLogsRes, usersRes, enrollmentsRes] = await Promise.all([
        getLoginLogs(),
        getUsers(),
        getEnrollments()
      ]);

      if (loginLogsRes?.success) {
        setLoginLogs(loginLogsRes.data);
      }
      if (usersRes?.success) {
        setUsers(usersRes.data);
      }
      if (enrollmentsRes?.success) {
        setEnrollments(enrollmentsRes.data);
      }
    } catch (error) {
      logger.error('Error loading logs data:', error);
      toast?.showError('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Auto-refresh for Activity tab
  useEffect(() => {
    if (!activityAutoRefreshMs) return;
    const id = setInterval(() => {
      loadData();
      setActivityLastUpdatedAt(Date.now());
    }, activityAutoRefreshMs);
    return () => clearInterval(id);
  }, [activityAutoRefreshMs]);

  // Update activity tick for progress bar
  useEffect(() => {
    if (!activityAutoRefreshMs) return;
    const id = setInterval(() => setActivityNowTick(Date.now()), 250);
    return () => clearInterval(id);
  }, [activityAutoRefreshMs]);

  const filteredLoginLogs = () => {
    let filtered = loginLogs;
    
    // Filter by activity type
    if (activityTypeFilter && activityTypeFilter !== 'all') {
      filtered = filtered.filter(log => log.type === activityTypeFilter);
    }
    
    // Filter by search (email, name, user agent)
    if (loginSearch) {
      const searchLower = loginSearch.toLowerCase();
      filtered = filtered.filter(log => 
        (log.userEmail && log.userEmail.toLowerCase().includes(searchLower)) ||
        (log.userName && log.userName.toLowerCase().includes(searchLower)) ||
        (log.userAgent && log.userAgent.toLowerCase().includes(searchLower))
      );
    }
    
    // Filter by user
    if (loginUserFilter && loginUserFilter !== 'all') {
      filtered = filtered.filter(log => log.userEmail === loginUserFilter);
    }
    
    // Filter by date range
    if (loginFrom) {
      const fromDate = new Date(loginFrom.split('/').reverse().join('-'));
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(log => {
        const logDate = log.timestamp?.seconds ? 
          new Date(log.timestamp.seconds * 1000) : 
          new Date(log.timestamp);
        return logDate >= fromDate;
      });
    }
    
    if (loginTo) {
      const toDate = new Date(loginTo.split('/').reverse().join('-'));
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(log => {
        const logDate = log.timestamp?.seconds ? 
          new Date(log.timestamp.seconds * 1000) : 
          new Date(log.timestamp);
        return logDate <= toDate;
      });
    }
    
    // Sort by timestamp (newest first)
    filtered.sort((a, b) => {
      const aTime = a.timestamp?.seconds ? a.timestamp.seconds * 1000 : new Date(a.timestamp).getTime();
      const bTime = b.timestamp?.seconds ? b.timestamp.seconds * 1000 : new Date(b.timestamp).getTime();
      return bTime - aTime;
    });
    
    return filtered;
  };

  const getActivityLogOptions = (t) => [
    // All Activities
    { value: 'all', label: t('all_activities') || 'All Activities' },

    // Authentication & Security
    { value: 'login', label: t('login') || 'Login' },
    { value: 'logout', label: t('logout') || 'Logout' },
    { value: 'session_timeout', label: t('session_timeout') || 'Session Timeout' },
    { value: 'profile_update', label: t('profile_update') || 'Profile Update' },
    { value: 'password_change', label: t('password_change') || 'Password Change' },
    { value: 'email_change', label: t('email_change') || 'Email Change' },
    { value: 'role_change', label: t('role_change') || 'Role Change' },
    { value: 'impersonation_start', label: t('impersonation_start') || 'Impersonation Start' },
    { value: 'impersonation_end', label: t('impersonation_end') || 'Impersonation End' },
    { value: 'security_alert', label: t('security_alert') || 'Security Alert' },
    { value: 'api_access', label: t('api_access') || 'API Access' },

    // Quiz & Assessment Activities
    { value: 'quiz_started', label: t('quiz_started') || 'Quiz Started' },
    { value: 'quiz_submitted', label: t('quiz_submitted') || 'Quiz Submitted' },
    { value: 'quiz_retake', label: t('quiz_retake') || 'Quiz Retake' },
    { value: 'quiz_saved', label: t('quiz_saved') || 'Quiz Saved' },
    { value: 'quiz_viewed', label: t('quiz_viewed') || 'Quiz Viewed' },

    // Assignment Activities
    { value: 'assignment_started', label: t('assignment_started') || 'Assignment Started' },
    { value: 'assignment_submitted', label: t('assignment_submitted') || 'Assignment Submitted' },
    { value: 'assignment_viewed', label: t('assignment_viewed') || 'Assignment Viewed' },

    // Grading & Feedback
    { value: 'submission_graded', label: t('submission_graded') || 'Submission Graded' },
    { value: 'feedback_given', label: t('feedback_given') || 'Feedback Given' },

    // Resource Activities
    { value: 'resource_viewed', label: t('resource_viewed') || 'Resource Viewed' },
    { value: 'resource_completed', label: t('resource_completed') || 'Resource Completed' },
    { value: 'resource_bookmarked', label: t('resource_bookmarked') || 'Resource Bookmarked' },
    { value: 'resource_downloaded', label: t('resource_downloaded') || 'Resource Downloaded' },

    // Attendance
    { value: 'attendance_marked', label: t('attendance_marked') || 'Attendance Marked' },

    // Communication & Announcements
    { value: 'message_sent', label: t('message_sent') || 'Message Sent' },
    { value: 'message_received', label: t('message_received') || 'Message Received' },
    { value: 'announcement_read', label: t('announcement_read') || 'Announcement Read' },
    { value: 'announcement_created', label: t('announcement_created') || 'Announcement Created' },
    { value: 'announcement_updated', label: t('announcement_updated') || 'Announcement Updated' },
    { value: 'announcement_deleted', label: t('announcement_deleted') || 'Announcement Deleted' },

    // Navigation & Views
    { value: 'dashboard_viewed', label: t('dashboard_viewed') || 'Dashboard Viewed' },
    { value: 'analytics_viewed', label: t('analytics_viewed') || 'Analytics Viewed' },
    { value: 'activity_viewed', label: t('activity_viewed') || 'Activity Viewed' },

    // Tools & Utilities
    { value: 'calculator_opened', label: t('calculator_opened') || 'Calculator Opened' },
    { value: 'scratch_pad_opened', label: t('scratch_pad_opened') || 'Scratch Pad Opened' },
    { value: 'formula_sheet_opened', label: t('formula_sheet_opened') || 'Formula Sheet Opened' },

    // Notifications
    { value: 'notification_clicked', label: t('notification_clicked') || 'Notification Clicked' },
    { value: 'notification_dismissed', label: t('notification_dismissed') || 'Notification Dismissed' },

    // Class Activities
    { value: 'class_joined', label: t('class_joined') || 'Class Joined' },
    { value: 'class_left', label: t('class_left') || 'Class Left' },

    // Admin & Management Activities
    { value: 'user_created', label: t('user_created') || 'User Created' },
    { value: 'user_updated', label: t('user_updated') || 'User Updated' },
    { value: 'user_deleted', label: t('user_deleted') || 'User Deleted' },
    { value: 'quiz_created', label: t('quiz_created') || 'Quiz Created' },
    { value: 'quiz_deleted', label: t('quiz_deleted') || 'Quiz Deleted' },
    { value: 'quiz_published', label: t('quiz_published') || 'Quiz Published' },

    // Activity CRUD
    { value: 'activity_created', label: t('activity_created') || 'Activity Created' },
    { value: 'activity_updated', label: t('activity_updated') || 'Activity Updated' },
    { value: 'activity_deleted', label: t('activity_deleted') || 'Activity Deleted' },

    // Penalties CRUD
    { value: 'penalty_created', label: t('penalty_created') || 'Penalty Created' },
    { value: 'penalty_updated', label: t('penalty_updated') || 'Penalty Updated' },
    { value: 'penalty_deleted', label: t('penalty_deleted') || 'Penalty Deleted' },
    { value: 'penalty_viewed', label: t('penalty_viewed') || 'Penalty Viewed' },
    { value: 'penalty_searched', label: t('penalty_searched') || 'Penalty Searched' },

    // Participation CRUD
    { value: 'participation_created', label: t('participation_created') || 'Participation Created' },
    { value: 'participation_updated', label: t('participation_updated') || 'Participation Updated' },
    { value: 'participation_deleted', label: t('participation_deleted') || 'Participation Deleted' },
    { value: 'participation_viewed', label: t('participation_viewed') || 'Participation Viewed' },
    { value: 'participation_searched', label: t('participation_searched') || 'Participation Searched' },

    // Behavior CRUD
    { value: 'behavior_created', label: t('behavior_created') || 'Behavior Created' },
    { value: 'behavior_updated', label: t('behavior_updated') || 'Behavior Updated' },
    { value: 'behavior_deleted', label: t('behavior_deleted') || 'Behavior Deleted' },
    { value: 'behavior_viewed', label: t('behavior_viewed') || 'Behavior Viewed' },
    { value: 'behavior_searched', label: t('behavior_searched') || 'Behavior Searched' },

    // Class CRUD
    { value: 'class_created', label: t('class_created') || 'Class Created' },
    { value: 'class_updated', label: t('class_updated') || 'Class Updated' },
    { value: 'class_deleted', label: t('class_deleted') || 'Class Deleted' },
    { value: 'class_viewed', label: t('class_viewed') || 'Class Viewed' },
    { value: 'class_searched', label: t('class_searched') || 'Class Searched' },

    // Subject CRUD
    { value: 'subject_created', label: t('subject_created') || 'Subject Created' },
    { value: 'subject_updated', label: t('subject_updated') || 'Subject Updated' },
    { value: 'subject_deleted', label: t('subject_deleted') || 'Subject Deleted' },
    { value: 'subject_viewed', label: t('subject_viewed') || 'Subject Viewed' },
    { value: 'subject_searched', label: t('subject_searched') || 'Subject Searched' },

    // Program CRUD
    { value: 'program_created', label: t('program_created') || 'Program Created' },
    { value: 'program_updated', label: t('program_updated') || 'Program Updated' },
    { value: 'program_deleted', label: t('program_deleted') || 'Program Deleted' },
    { value: 'program_viewed', label: t('program_viewed') || 'Program Viewed' },
    { value: 'program_searched', label: t('program_searched') || 'Program Searched' },

    // Enrollment CRUD
    { value: 'enrollment_created', label: t('enrollment_created') || 'Enrollment Created' },
    { value: 'enrollment_updated', label: t('enrollment_updated') || 'Enrollment Updated' },
    { value: 'enrollment_deleted', label: t('enrollment_deleted') || 'Enrollment Deleted' },
    { value: 'enrollment_viewed', label: t('enrollment_viewed') || 'Enrollment Viewed' },
    { value: 'enrollment_searched', label: t('enrollment_searched') || 'Enrollment Searched' },

    // Mark Entry CRUD
    { value: 'mark_entry_created', label: t('mark_entry_created') || 'Mark Entry Created' },
    { value: 'mark_entry_updated', label: t('mark_entry_updated') || 'Mark Entry Updated' },
    { value: 'mark_entry_deleted', label: t('mark_entry_deleted') || 'Mark Entry Deleted' },
    { value: 'mark_entry_viewed', label: t('mark_entry_viewed') || 'Mark Entry Viewed' },
    { value: 'mark_entry_searched', label: t('mark_entry_searched') || 'Mark Entry Searched' },

    // Generic Actions
    { value: 'search_performed', label: t('search_performed') || 'Search Performed' },
    { value: 'save_action', label: t('save_action') || 'Save Action' },
    { value: 'export_action', label: t('export_action') || 'Export Action' }
  ];

  const getActivityLogTypeConfig = (type, theme) => {
    const configs = {
      // Authentication & Security
      login: { icon: <LogIn size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Login' },
      logout: { icon: <LogOut size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Logout' },
      session_timeout: { icon: <Clock size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Session Timeout' },
      profile_update: { icon: <User size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Profile Update' },
      password_change: { icon: <KeyRound size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Password Change' },
      email_change: { icon: <Mail size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Email Change' },
      role_change: { icon: <Shield size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Role Change' },
      impersonation_start: { icon: <Eye size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Impersonation Start' },
      impersonation_end: { icon: <EyeOff size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Impersonation End' },
      security_alert: { icon: <AlertTriangle size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Security Alert' },
      api_access: { icon: <Activity size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'API Access' },

      // Quiz & Assessment Activities
      quiz_started: { icon: <Play size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Quiz Started' },
      quiz_submitted: { icon: <CheckCircle size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Quiz Submitted' },
      quiz_retake: { icon: <RotateCw size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Quiz Retake' },
      quiz_saved: { icon: <Save size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Quiz Saved' },
      quiz_viewed: { icon: <Eye size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Quiz Viewed' },

      // Assignment Activities
      assignment_started: { icon: <Play size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Assignment Started' },
      assignment_submitted: { icon: <Upload size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Assignment Submitted' },
      assignment_viewed: { icon: <Eye size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Assignment Viewed' },

      // Grading & Feedback
      submission_graded: { icon: <Star size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Submission Graded' },
      feedback_given: { icon: <MessageSquare size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Feedback Given' },

      // Resource Activities
      resource_viewed: { icon: <Eye size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Resource Viewed' },
      resource_completed: { icon: <CheckCircle size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Resource Completed' },
      resource_bookmarked: { icon: <Bookmark size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Resource Bookmarked' },
      resource_downloaded: { icon: <Download size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Resource Downloaded' },

      // Attendance
      attendance_marked: { icon: <CheckCircle size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Attendance Marked' },

      // Communication & Announcements
      message_sent: { icon: <Send size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Message Sent' },
      message_received: { icon: <Inbox size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Message Received' },
      announcement_read: { icon: <Eye size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Announcement Read' },
      announcement_created: { icon: <PlusCircle size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Announcement Created' },
      announcement_updated: { icon: <Edit size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Announcement Updated' },
      announcement_deleted: { icon: <Trash size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Announcement Deleted' },

      // Navigation & Views
      dashboard_viewed: { icon: <LayoutDashboard size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Dashboard Viewed' },
      analytics_viewed: { icon: <BarChart size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Analytics Viewed' },
      activity_viewed: { icon: <Activity size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Activity Viewed' },

      // Tools & Utilities
      calculator_opened: { icon: <Calculator size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Calculator Opened' },
      scratch_pad_opened: { icon: <FileText size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Scratch Pad Opened' },
      formula_sheet_opened: { icon: <BookOpen size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Formula Sheet Opened' },

      // Notifications
      notification_clicked: { icon: <Pointer size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Notification Clicked' },
      notification_dismissed: { icon: <X size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Notification Dismissed' },

      // Class Activities
      class_joined: { icon: <UserPlus size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Class Joined' },
      class_left: { icon: <UserMinus size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Class Left' },

      // Admin & Management Activities
      user_created: { icon: <UserPlus size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'User Created' },
      user_updated: { icon: <UserCheck size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'User Updated' },
      user_deleted: { icon: <UserX size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'User Deleted' },
      quiz_created: { icon: <PlusCircle size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Quiz Created' },
      quiz_deleted: { icon: <Trash size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Quiz Deleted' },
      quiz_published: { icon: <Send size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Quiz Published' },

      // Activity CRUD
      activity_created: { icon: <PlusCircle size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Activity Created' },
      activity_updated: { icon: <Edit size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Activity Updated' },
      activity_deleted: { icon: <Trash size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Activity Deleted' },

      // Penalties CRUD
      penalty_created: { icon: <PlusCircle size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Penalty Created' },
      penalty_updated: { icon: <Edit size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Penalty Updated' },
      penalty_deleted: { icon: <Trash size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Penalty Deleted' },
      penalty_viewed: { icon: <Eye size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Penalty Viewed' },
      penalty_searched: { icon: <Search size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Penalty Searched' },

      // Participation CRUD
      participation_created: { icon: <PlusCircle size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Participation Created' },
      participation_updated: { icon: <Edit size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Participation Updated' },
      participation_deleted: { icon: <Trash size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Participation Deleted' },
      participation_viewed: { icon: <Eye size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Participation Viewed' },
      participation_searched: { icon: <Search size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Participation Searched' },

      // Behavior CRUD
      behavior_created: { icon: <PlusCircle size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Behavior Created' },
      behavior_updated: { icon: <Edit size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Behavior Updated' },
      behavior_deleted: { icon: <Trash size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Behavior Deleted' },
      behavior_viewed: { icon: <Eye size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Behavior Viewed' },
      behavior_searched: { icon: <Search size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Behavior Searched' },

      // Class CRUD
      class_created: { icon: <PlusCircle size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Class Created' },
      class_updated: { icon: <Edit size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Class Updated' },
      class_deleted: { icon: <Trash size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Class Deleted' },
      class_viewed: { icon: <Eye size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Class Viewed' },
      class_searched: { icon: <Search size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Class Searched' },

      // Subject CRUD
      subject_created: { icon: <PlusCircle size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Subject Created' },
      subject_updated: { icon: <Edit size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Subject Updated' },
      subject_deleted: { icon: <Trash size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Subject Deleted' },
      subject_viewed: { icon: <Eye size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Subject Viewed' },
      subject_searched: { icon: <Search size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Subject Searched' },

      // Program CRUD
      program_created: { icon: <PlusCircle size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Program Created' },
      program_updated: { icon: <Edit size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Program Updated' },
      program_deleted: { icon: <Trash size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Program Deleted' },
      program_viewed: { icon: <Eye size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Program Viewed' },
      program_searched: { icon: <Search size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Program Searched' },

      // Enrollment CRUD
      enrollment_created: { icon: <PlusCircle size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Enrollment Created' },
      enrollment_updated: { icon: <Edit size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Enrollment Updated' },
      enrollment_deleted: { icon: <Trash size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Enrollment Deleted' },
      enrollment_viewed: { icon: <Eye size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Enrollment Viewed' },
      enrollment_searched: { icon: <Search size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Enrollment Searched' },

      // Mark Entry CRUD
      mark_entry_created: { icon: <PlusCircle size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Mark Entry Created' },
      mark_entry_updated: { icon: <Edit size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Mark Entry Updated' },
      mark_entry_deleted: { icon: <Trash size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Mark Entry Deleted' },
      mark_entry_viewed: { icon: <Eye size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Mark Entry Viewed' },
      mark_entry_searched: { icon: <Search size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Mark Entry Searched' },

      // Generic Actions
      search_performed: { icon: <Search size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Search Performed' },
      save_action: { icon: <Save size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Save Action' },
      export_action: { icon: <Download size={16} color={theme === 'dark' ? '#fff' : '#374151'} />, label: 'Export Action' }
    };
    return configs[type] || configs.login;
  };

  return (
    <div className="login-activity-tab">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '0.5rem 0 1rem', flexWrap: 'wrap', padding: '1rem', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <Select value={activityTypeFilter} onChange={(e) => setActivityTypeFilter(e.target.value)} options={getActivityLogOptions(t)} style={{ minWidth: '200px', flex: '1' }} />
        <Input
          type="text"
          placeholder={t('search_by_email_name_ua')}
          value={loginSearch}
          onChange={(e) => setLoginSearch(e.target.value)}
          style={{ minWidth: '200px', flex: '1' }}
        />
        <UserSelect
          users={users}
          enrollments={enrollments}
          value={loginUserFilter}
          onChange={(e) => setLoginUserFilter(e.target.value)}
          placeholder={t('all_users') || 'All Users'}
          includeAll={true}
          showEnrollments={true}
          showStatus={true}
          searchable={true}
          size="small"
          style={{ minWidth: '200px', flex: '1' }}
        />
        <DateRangeSlider
          fromDate={loginFrom ? (() => {
            try {
              if (loginFrom.includes('/')) {
                const [dd, mm, yyyy] = loginFrom.split('/');
                return `${yyyy}-${mm}-${dd}`;
              }
              return loginFrom;
            } catch {
              return '';
            }
          })() : ''}
          toDate={loginTo ? (() => {
            try {
              if (loginTo.includes('/')) {
                const [dd, mm, yyyy] = loginTo.split('/');
                return `${yyyy}-${mm}-${dd}`;
              }
              return loginTo;
            } catch {
              return '';
            }
          })() : ''}
          onChange={({ fromDate, toDate }) => {
            if (fromDate) {
              const date = new Date(fromDate);
              setLoginFrom(`${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`);
            } else {
              setLoginFrom('');
            }
            if (toDate) {
              const date = new Date(toDate);
              setLoginTo(`${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`);
            } else {
              setLoginTo('');
            }
          }}
          placeholderFrom={t('from') || 'From'}
          placeholderTo={t('to') || 'To'}
          style={{ minWidth: '250px', flex: '1' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <Select
            value={activityAutoRefreshMs}
            onChange={(e) => setActivityAutoRefreshMs(Number(e.target.value))}
            options={[
              { value: 0, label: 'Off' },
              { value: 10000, label: '10 sec' },
              { value: 30000, label: '30 sec' },
              { value: 60000, label: '1 min' },
              { value: 300000, label: '5 min' }
            ]}
            size="small"
            style={{ minWidth: '150px' }}
          />
          {activityAutoRefreshMs > 0 && (
            <div style={{ width: 120, height: 6, background: '#e5e7eb', borderRadius: 999, overflow: 'hidden' }} title="Next auto refresh">
              <div style={{ height: '100%', width: `${Math.min(100, ((activityNowTick - activityLastUpdatedAt) % activityAutoRefreshMs) / activityAutoRefreshMs * 100)}%`, background: '#10b981', transition: 'width 0.25s linear' }} />
            </div>
          )}
          <Button 
            onClick={() => {
              loadData();
              setActivityLastUpdatedAt(Date.now());
            }} 
            variant="outline" 
            size="small" 
            title={t('refresh') || 'Refresh'}
            icon={getThemedIcon('ui', 'refresh', 16)}
          >
            Refresh
          </Button>
          <Button 
            onClick={() => {
              const isAllTypes = activityTypeFilter === 'all';
              const filterOption = getActivityLogOptions(t).find(opt => opt.value === activityTypeFilter);
              const description = isAllTypes ? 'all login logs' : `${filterOption?.label || activityTypeFilter} logs`;
              setDeleteModal({
                open: true,
                type: 'login_logs',
                item: { description, filterType: activityTypeFilter },
                onConfirm: async () => {
                  setLoading(true);
                  try {
                    // Import dynamically to avoid circular dependencies
                    const { deleteAllLoginLogs, deleteLoginLogsByType, getLoginLogs } = await import('@services/business/activityService');
                    
                    // Add progress tracking
                    const onProgress = (processed, total, percentage) => {
                      toast?.showInfo(`Deleting logs: ${processed}/${total} (${percentage}%)`);
                    };
                    let result;
                    if (activityTypeFilter === 'all') {
                      result = await deleteAllLoginLogs(onProgress);
                    } else {
                      result = await deleteLoginLogsByType(activityTypeFilter, onProgress);
                    }
                    if (result.success) {
                      toast?.showSuccess(`Successfully deleted ${result.deletedCount} ${description}`);
                      // Refresh the login logs data
                      const loginLogsRes = await getLoginLogs();
                      if (loginLogsRes.success) {
                        setLoginLogs(loginLogsRes.data);
                      }
                    } else {
                      toast?.showError('Failed to delete login logs: ' + result.error);
                    }
                  } catch (error) {
                    logger.error('Error deleting login logs:', error);
                    toast?.showError('An error occurred while deleting login logs');
                  } finally {
                    setLoading(false);
                    setDeleteModal({ open: false });
                  }
                }
              });
            }} 
            variant="danger" 
            size="small" 
            title="Delete All Logs"
            icon={<Trash size={16} color="#dc2626" />}
          >
            Delete All
          </Button>
        </div>
      </div>
      <AdvancedDataGrid
        rows={filteredLoginLogs().slice(0, 500)}
        getRowId={(row) => row.docId || row.id}
        columns={[
          {
            field: 'type', 
            headerName: (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={16} color={theme === 'dark' ? '#fff' : '#374151'} />
                {t('type_col') || 'Type'}
              </span>
            ), 
            width: 200,
            renderCell: (params) => {
              const type = params.value || 'login';
              const config = getActivityLogTypeConfig(type, theme);
              return (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                  {config.icon} {t(type) || config.label}
                </span>
              );
            }
          },
          {
            field: 'timestamp', 
            headerName: (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={16} color={theme === 'dark' ? '#fff' : '#374151'} />
                {t('when') || 'When'}
              </span>
            ), 
            width: 180,
            valueGetter: (params) => params.value,
            renderCell: (params) => {
              const timestamp = params.value;
              const activityType = params.row?.type;
              if (!timestamp) return '—';
              // Handle both Firestore Timestamp and regular Date
              const date = timestamp?.seconds ? 
                new Date(timestamp.seconds * 1000) : 
                new Date(timestamp);
              // For penalty viewing activities, use Qatar timezone and log details
              if (activityType === 'penalty_viewed') {
                const qatarTimeAgo = getQatarTimeAgo(date);
                logger.debug('🔍 PENALTY VIEWING DISPLAY - Rendering timestamp:', {
                  rawTimestamp: timestamp,
                  convertedDate: date,
                  convertedDateUTC: date.toISOString(),
                  qatarTimeAgo,
                  activityType,
                  clientTime: new Date().toISOString(),
                  clientTimeQatar: new Date().toLocaleString('en-US', { timeZone: 'Asia/Qatar' })
                });
                return qatarTimeAgo || formatQatarDate(date);
              }
              // Use Qatar timezone for other activities too
              return getQatarTimeAgo(date) || formatQatarDate(date);
            }
          },
          {
            field: 'userName', 
            headerName: (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <User size={16} color={theme === 'dark' ? '#fff' : '#374151'} />
                {t('user_col') || 'User'}
              </span>
            ), 
            flex: 1, 
            minWidth: 150,
            renderCell: (params) => (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <User size={14} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                {params.value || '—'}
              </span>
            )
          },
          {
            field: 'userEmail', 
            headerName: (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={16} color={theme === 'dark' ? '#fff' : '#374151'} />
                {t('email_col') || 'Email'}
              </span>
            ), 
            flex: 1, 
            minWidth: 200,
            renderCell: (params) => (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Mail size={14} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                {params.value || '—'}
              </span>
            )
          },
          {
            field: 'userAgent', 
            headerName: (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Monitor size={16} color={theme === 'dark' ? '#fff' : '#374151'} />
                {t('user_agent_col') || 'User Agent'}
              </span>
            ), 
            flex: 2, 
            minWidth: 300,
            renderCell: (params) => (
              <div style={{ maxWidth: 520, overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Monitor size={14} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                {params.value || '—'}
              </div>
            )
          },
          {
            field: 'details',
            headerName: (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={16} color={theme === 'dark' ? '#fff' : '#374151'} />
                {t('description_col') || 'Description'}
              </span>
            ),
            flex: 1,
            minWidth: 200,
            renderCell: (params) => {
              const details = params.value || {};
              if (Object.keys(details).length === 0) return '—';
              // Show relevant details based on activity type
              const type = params.row.type;
              let detailText = '';
              let detailIcon = null;
              
              if (type === 'login' && details.ip) {
                detailText = `IP: ${details.ip}`;
                detailIcon = <Globe size={14} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />;
              } else if (type === 'logout' && details.sessionDuration) {
                detailText = `Session: ${details.sessionDuration}`;
                detailIcon = <Clock size={14} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />;
              } else if (details.action) {
                detailText = details.action;
                detailIcon = <Zap size={14} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />;
              } else if (details.message) {
                detailText = details.message;
                detailIcon = <MessageSquare size={14} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />;
              }
              
              return (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  {detailIcon}
                  {detailText || JSON.stringify(details)}
                </span>
              );
            }
          }
        ]}
        pageSize={20}
        pageSizeOptions={[10, 20, 50, 100]}
        checkboxSelection
        exportFileName="login-activity"
        showExportButton
        exportLabel={t('export') || 'Export'}
        loadingOverlayMessage={loading ? "Loading login activity..." : undefined}
      />
      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <Modal
          isOpen={deleteModal.open}
          onClose={() => setDeleteModal({ open: false })}
          title={deleteModal.type === 'login_logs' ? 'Delete Activity Logs' : 'Confirm Deletion'}
          size="small"
        >
          <div style={{ padding: '1rem' }}>
            <p style={{ marginBottom: '1rem', color: '#666' }}>
              {deleteModal.type === 'login_logs' ?
                `Are you sure you want to delete ${deleteModal.item?.description}? This action cannot be undone.` :
                'Are you sure you want to delete this item?'
              }
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <Button
                variant="outline"
                onClick={() => setDeleteModal({ open: false })}
              >
                {t('cancel') || 'Cancel'}
              </Button>
              <Button
                variant="danger"
                loading={loading}
                onClick={deleteModal.onConfirm}
              >
                {t('delete') || 'Delete'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default LogsActivityPage;
