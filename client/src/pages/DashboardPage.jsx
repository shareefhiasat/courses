import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { formatQatarDateOnly } from '@utils/timezone';
import logger from '@utils/logger';
 // import Joyride from 'react-joyride';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useNavigate, Navigate, useLocation } from 'react-router-dom';
import Joyride from 'react-joyride';
import { USER_ROLES, getRoleColor, getRoleIcon, getRoleDisplayName } from '@constants/userRoles';
import { getThemedIcon, getColoredIcon } from '@constants/iconTypes';
import { formatDateTime } from '@utils/date';
import { getQatarTimeAgo, formatQatarDate } from '@utils/timezone';
import { SUBMISSION_STATUS, getStatusLabel } from '@utils/sharedTypes';
import {
  getActivities, addActivity, updateActivity, deleteActivity,
  getAnnouncements, addAnnouncement, updateAnnouncement, deleteAnnouncement
} from '@firebaseServices/activityService';
import { getUsers, addUser, updateUser, deleteUser } from '@firebaseServices/userService';
import { getEnrollments, addEnrollment, deleteEnrollment } from '@firebaseServices/enrollmentService';
import { getSubmissions, gradeSubmission, deleteSubmission } from '@firebaseServices/submissionService';
import { addEmailLog, getEmailLogs, sendEmail, getSMTPConfig, updateSMTPConfig } from '@firebaseServices/emailService';
import { addActivityLog, getLoginLogs, deleteAllLoginLogs, deleteLoginLogsByType } from '@firebaseServices/activityService';
import { getClasses, addClass, updateClass, deleteClass } from '@firebaseServices/classService';
import { getCourses, setCourse, deleteCourse } from '@firebaseServices/courseService';
import { getAllowlist, updateAllowlist } from '@firebaseServices/configService';
import { notifyAllUsers, notifyUsersByClass, getNotificationLogs } from '@firebaseServices/notificationService';
import { Loading, FancyLoading, Modal, Select, Input, Button, DatePicker, DateRangeSlider, UrlInput, Checkbox, Textarea, NumberInput, useToast, DataGrid, Tabs, AdvancedDataGrid, YearSelect, Card, CardBody, Badge, UserSelect } from '@ui';
import InfoTooltip from '@ui/InfoTooltip/InfoTooltip';
import { getCardConfig, getShapeRadius } from '@utils/cardColors';
import { RibbonTabs, DragGrid, EmailManager, SmartEmailComposer, UserDeletionModal, EmailTemplates, EmailLogs } from '@ui';
import CategoriesPage from './CategoriesPage';
import AnnouncementsPage from './AnnouncementsPage';
import ResourcesPage from './ResourcesPage';
import ClassesPage from './ClassesPage';
import UsersPage from './UsersPage';
import LoginActivityPage from './LoginActivityPage';
import SubmissionsPage from './SubmissionsPage';
import SMTPPage from './SMTPPage';
import EnrollmentManagementPage from './EnrollmentManagementPage';
import EmailLogsPage from './EmailLogsPage';
import ActivitiesPage from './ActivitiesPage';
import { 
  getResourceTypeConfig, 
  getResourceTypeOptions, 
  getActivityLogTypeConfig,
  getProgramScopeConfig,
  COMMON_GRID_COLUMNS,
  COMMON_ICONS,
  getThemeColor
} from '@constants/dashboardTypes.jsx';
import { generateStudentQRCode } from '@utils/qrCode';
import ProgramsManagementPage from './ProgramsManagementPage';
import SubjectsManagementPage from './SubjectsManagementPage';
import MarksEntryPage from './MarksEntryPage';
import ClassSchedulePage from './ClassSchedulePage';
import ManageEnrollmentsPage from './ManageEnrollmentsPage';
import HRPenaltiesPage from './HRPenaltiesPage';
import InstructorParticipationPage from './InstructorParticipationPage';
import InstructorBehaviorPage from './InstructorBehaviorPage';
import AnalyticsDashboardPage from './AnalyticsDashboardPage';
import AllowlistPage from './AllowlistPage';
import EmailTemplatesPage from './EmailTemplatesPage';
import { getSubjects, getPrograms } from '@firebaseServices/programService';
import { getAllQuizzes } from '@firebaseServices/quizService';
import { logActivity, ACTIVITY_TYPES, getActivityLogOptions } from '@firebaseServices/activityLogger.jsx';
import { getUserDisplayName } from '@firebaseServices/userService';
import { getUserStatus, getUserStatusSummary, getStatusIconProps, USER_STATUS } from '@utils/userStatus';
import './DashboardPage.css';
import { ToggleSwitch } from '@ui';
const DashboardPage = () => {
  const { user, isAdmin, isSuperAdmin, isInstructor, loading: authLoading, impersonateUser } = useAuth();
  const { lang, setLang, t } = useLang();
  const { theme } = useTheme();
  // Memoized helper function for theme-aware filter icon colors
  const getFilterIconColor = useCallback(() => {
    return getThemeColor('text.secondary', theme);
  }, [theme]);
  // Joyride tour state
  const [runTour, setRunTour] = useState(false);
  const [tourSteps, setTourSteps] = useState([]);
  // Memoized Joyride callback to persist tour completion
  const handleJoyrideCallback = useCallback((data) => {
    const { status } = data || {};
    if (status === 'finished' || status === 'skipped') {
      setRunTour(false);
      try {
        localStorage.setItem(`dashboardHelpSeen_${lang}`, 'true');
      } catch {
        // ignore
      }
    }
  }, [lang]);
  // Build localized tour steps when language changes
  useEffect(() => {
    const steps = [
      {
        target: '[data-tour="mode-switcher"]',
        content: t('tour.mode_switcher'),
        disableBeacon: true,
        placement: 'bottom'
      },
      {
        target: '[data-tour="stats"]',
        content: t('tour.stats'),
        disableBeacon: true,
        placement: 'bottom'
      },
      {
        target: '[data-tour="filters"]',
        content: t('tour.filters'),
        disableBeacon: true,
        placement: 'top'
      },
      {
        target: '[data-tour="cards-grid"]',
        content: t('tour.cards_grid'),
        disableBeacon: true,
        placement: 'top'
      }
    ];
    setTourSteps(steps);
  }, [lang]);
  const navigate = useNavigate();
  const location = useLocation();
  const uiToast = useToast();
  const toast = {
    showSuccess: uiToast.success,
    showError: uiToast.error,
    showInfo: uiToast.info,
  };
  // Joyride dashboard tour state
  const tourSeenKey = `dashboardHelpSeen_${lang}`;
  // Build tour steps localization (based on current language)
  useEffect(() => {
    const steps = [
      {
        target: '[data-tour="mode-switcher"]',
        content: t('tour.mode_switcher'),
        disableBeacon: true,
        placement: 'bottom'
      },
      {
        target: '[data-tour="stats"]',
        content: t('tour.stats'),
        disableBeacon: true,
        placement: 'bottom'
      },
      {
        target: '[data-tour="filters"]',
        content: t('tour.filters'),
        disableBeacon: true,
        placement: 'bottom'
      },
      {
        target: '[data-tour="cards-grid"]',
        content: t('tour.cards_grid'),
        disableBeacon: true,
        placement: 'top'
      }
    ];
    setTourSteps(steps);
  }, [lang]);
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('dashboardActiveTab') || 'activities';
    return saved === 'courses' ? 'categories' : saved;
  });
  const [activeCategory, setActiveCategory] = useState(() => {
    // derive category from saved tab
    const map = {
      activities: 'content', announcements: 'content', resources: 'content',
      users: 'users', allowlist: 'users',
      classes: 'academic', enrollments: 'academic', submissions: 'academic',
      /* smtp: 'communication' - DEPRECATED */ emailTemplates: 'communication', emailLogs: 'communication', notificationLogs: 'communication',
      categories: 'settings', login: 'settings'
    };
    return map[localStorage.getItem('dashboardActiveTab') || 'activities'] || 'content';
  });
  const [activeEnrollmentTab, setActiveEnrollmentTab] = useState('user');
  const [loading, setLoading] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [announcementFilter, setAnnouncementFilter] = useState('all');
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState('all');
  const [activityFilter, setActivityFilter] = useState('all');
  const [submissionStudentFilter, setSubmissionStudentFilter] = useState('all');
  const [submissionScoreFilter, setSubmissionScoreFilter] = useState('all');
  const [notificationLogs, setNotificationLogs] = useState([]);
  const [notificationLogFilters, setNotificationLogFilters] = useState({
    trigger: '',
    channel: '',
    startDate: null,
    endDate: null
  });
  const [selectedNotificationLog, setSelectedNotificationLog] = useState(null);
  const [notificationLogModalOpen, setNotificationLogModalOpen] = useState(false);
  // Activity and Announcement filters for summary cards
  const [activityProgramFilter, setActivityProgramFilter] = useState('all');
  const [activitySubjectFilter, setActivitySubjectFilter] = useState('all');
  const [activityClassFilter, setActivityClassFilter] = useState('all');
  const [announcementProgramFilter, setAnnouncementProgramFilter] = useState('all');
  const [announcementSubjectFilter, setAnnouncementSubjectFilter] = useState('all');
  const [announcementClassFilter, setAnnouncementClassFilter] = useState('all');
  const [resourceProgramFilter, setResourceProgramFilter] = useState('all');
  const [resourceSubjectFilter, setResourceSubjectFilter] = useState('all');
  const [resourceClassFilter, setResourceClassFilter] = useState('all');
  const [resourceCategoryFilter, setResourceCategoryFilter] = useState('all');
  const [classProgramFilter, setClassProgramFilter] = useState('all');
  const [classSubjectFilter, setClassSubjectFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [emailComposerOpen, setEmailComposerOpen] = useState(false);
  const [userQuickFilter, setUserQuickFilter] = useState('all');
  const [activityAutoRefreshMs, setActivityAutoRefreshMs] = useState(0);
  const [activityLastUpdatedAt, setActivityLastUpdatedAt] = useState(Date.now());
  const [activityNowTick, setActivityNowTick] = useState(Date.now());
  const handleTabChange = useCallback((tab, { source = 'user', shouldEmit = true } = {}) => {
    if (!tab) {
      return;
    }
    // Check if this tab has a path (external navigation)
    const tabItem = ribbonCategories
      .flatMap(cat => cat.items)
      .find(item => item.key === tab);
    if (tabItem?.path) {
      navigate(tabItem.path);
      return;
    }
    setActiveTab(tab);
    localStorage.setItem('dashboardActiveTab', tab);
    setHashProcessed(false); // Reset hash processed flag when tab changes manually
    // Tabs that should update the URL with query parameters
    const queryParamTabs = ['activities', 'announcements', 'resources', 'users', 'allowlist', 'programs', 'subjects', 'classes', 'enrollments', 'manage-enrollments', 'marks', 'classschedule', 'hr-penalties', 'instructor-participation', 'instructor-behavior', /* 'smtp' - DEPRECATED */ 'emailTemplates', 'emailLogs', 'notificationLogs', 'scheduled-reports', 'categories', 'login'];
    if (queryParamTabs.includes(tab)) {
      const searchParams = new URLSearchParams(location.search);
      searchParams.set('tab', tab);
      const newSearch = `?${searchParams.toString()}`;
      const nextUrl = `${location.pathname}${newSearch}`;
      const currentUrl = `${location.pathname}${location.search}`;
      if (currentUrl !== nextUrl) {
          logger.debug('URL changed', {
          nextUrl,
          previousUrl: currentUrl,
          source
        });
        navigate(nextUrl, { replace: true, state: { __source: 'dashboard-tab-update', __from: source } });
      } else {
        }
    } else {
      const tabToHashMap = {
        'programs': '#programs',
        'subjects': '#subjects',
        'classes': '#classes',
        'manage-enrollments': '#enrollments',
        'marks': '#marks',
        'classschedule': '#classschedule'
      };
      if (tabToHashMap[tab]) {
        const hashTarget = `${location.pathname}${tabToHashMap[tab]}`;
        navigate(hashTarget, { replace: true, state: { __source: 'dashboard-tab-hash', __from: source } });
      } else if (location.search || location.hash) {
        navigate(location.pathname, { replace: true, state: { __source: 'dashboard-tab-clear', __from: source } });
      }
    }
    if (shouldEmit) {
      window.dispatchEvent(new CustomEvent('dashboard-tab-change', { detail: { tab, source: 'dashboard-page' } }));
    } else {
          logger.debug('Tab changed', {
        tab,
        source
      });
    }
  }, [navigate, location, t]);
  const latestHandleTabChange = useRef(handleTabChange);
  useEffect(() => {
    latestHandleTabChange.current = handleTabChange;
  }, [handleTabChange]);
  // Listen for external tab change events (from sidebar/other modules)
  useEffect(() => {
    const handleTabChangeEvent = (e) => {
      const eventTab = e.detail?.tab;
      const eventSource = e.detail?.source || 'external';
      if (!eventTab) {
        return;
      }
      if (eventSource === 'dashboard-page') {
        return;
      }
      latestHandleTabChange.current?.(eventTab, { source: `event:${eventSource}`, shouldEmit: false });
    };
    window.addEventListener('dashboard-tab-change', handleTabChangeEvent);
    return () => window.removeEventListener('dashboard-tab-change', handleTabChangeEvent);
  }, [latestHandleTabChange]);
  const categories = [
    { id: 'content', label: t('content') },
    { id: 'users', label: t('users') },
    { id: 'academic', label: t('academic') },
    { id: 'communication', label: t('communication') },
    { id: 'settings', label: t('settings') },
  ];
  const ribbonCategories = [
    {
      id: 'content',
      label: t('content'),
      items: [
        { key: 'activities', label: t('activities') },
        { key: 'announcements', label: t('announcements') },
        { key: 'resources', label: t('resources') }
      ]
    },
    {
      id: 'users',
      label: t('users'),
      items: [
        { key: 'users', label: t('users') },
        { key: 'allowlist', label: t('allowlist') }
      ]
    },
    {
      id: 'communication',
      label: t('communication'),
      items: [
        // { key: 'smtp', label: t('smtp') }, // DEPRECATED - Use environment variables instead
        { key: 'emailTemplates', label: t('templates') },
        { key: 'notificationLogs', label: t('notification_logs') },
        { key: 'scheduled-reports', label: t('scheduled_reports') }
      ]
    },
    {
      id: 'academic',
      label: t('academic'),
      items: [
        { key: 'programs', label: t('programs') },
        { key: 'subjects', label: t('subjects') },
        { key: 'classes', label: t('classes') },
        { key: 'enrollments', label: t('enrollments') },
        { key: 'manage-enrollments', label: t('manage_enrollments') },
        { key: 'marks', label: t('mark_entry') },
        { key: 'classschedule', label: t('class_schedules') },
        // { key: 'submissions', label: t('submissions') },
        { key: 'hr-penalties', label: t('hr_penalties') },
        { key: 'instructor-participation', label: t('participation') },
        { key: 'instructor-behavior', label: t('behavior') }
      ]
    },
    {
      id: 'settings',
      label: t('settings'),
      items: [
        { key: 'categories', label: t('categories') },
        { key: 'login', label: t('logs') },
        { key: 'emailLogs', label: t('email_logs_deprecated') }
      ]
    }
  ];
  // Initialize tour steps (localization-aware)
  useEffect(() => {
    const steps = [
      {
        target: '[data-tour="mode-switcher"]',
        content: t('tour.mode_switcher_content'),
        disableBeacon: true,
        placement: 'bottom'
      },
      {
        target: '[data-tour="stats"]',
        content: t('tour.stats_content'),
        disableBeacon: true,
        placement: 'bottom'
      },
      {
        target: '[data-tour="filters"]',
        content: t('tour.filters_content'),
        disableBeacon: true,
        placement: 'bottom'
      },
      {
        target: '[data-tour="cards-grid"]',
        content: t('tour.cards_grid_content'),
        disableBeacon: true,
        placement: 'top'
      }
    ];
    setTourSteps(steps);
  }, [lang]);
  // Auto-start on demand via app event in HomePage (optional)
  useEffect(() => {
    const start = () => setRunTour(true);
    window.addEventListener('app:joyride', start);
    window.addEventListener('app:help', start);
    return () => {
      window.removeEventListener('app:joyride', start);
      window.removeEventListener('app:help', start);
    };
  }, []);
  // Progress ticker for Activity auto refresh bar
  useEffect(() => {
    if (!activityAutoRefreshMs || activeTab !== 'login') return;
    const id = setInterval(() => setActivityNowTick(Date.now()), 250);
    return () => clearInterval(id);
  }, [activityAutoRefreshMs, activeTab]);
  // Validation functions
  const validateActivityForm = () => {
    const errors = {};
    if (!activityForm.id || !activityForm.id.trim()) errors.id = 'Activity ID is required';
    if (!activityForm.title_en || !activityForm.title_en.trim()) errors.title_en = 'English title is required';
    // URL is only required if type is not 'quiz' (quiz uses quizId instead)
    if (activityForm.type !== 'quiz' && (!activityForm.url || !activityForm.url.trim())) {
      errors.url = 'URL is required';
    }
    // Check if ID already exists (for new activities)
    if (!editingActivity && activities.some(a => a.id === activityForm.id)) {
      errors.id = 'Activity ID already exists';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  // Edit handlers
  const handleEditActivity = useCallback((activity) => {
    setEditingActivity(activity);
    // Ensure all fields are properly initialized, especially for dropdowns
    const formData = {
      ...activity,
      overrideQuizSettings: activity.overrideQuizSettings || false,
      programId: activity.programId || activity.program || '',
      subjectId: activity.subjectId || activity.subject || '',
      classId: activity.classId || activity.class || '',
      quizId: activity.quizId || activity.quiz || '',
      maxScore: activity.maxScore || activity.max_score || 100,
      allowRetake: activity.allowRetake !== undefined ? activity.allowRetake : (activity.allow_retake || false),
      difficulty: activity.difficulty || 'beginner',
      type: activity.type || 'quiz',
      course: activity.course || 'python'
    };
    setActivityForm(formData);
  }, []);
  const handleCancelEdit = useCallback(() => {
    setEditingActivity(null);
    setActivityForm({
      id: '', title_en: '', title_ar: '', description_en: '', description_ar: '',
      course: 'python', type: 'quiz', difficulty: 'beginner', url: '', dueDate: '',
      image: '', order: 0, show: true, allowRetake: false, classId: '', programId: '', subjectId: '',
      featured: false, optional: false, quizId: '', requiresSubmission: false, maxScore: 10, overrideQuizSettings: false
    });
    setFormErrors({});
  }, []);
  // QR Code generation function for users
  const openQRCodeInNewTab = async (user) => {
    try {
      const studentNumber = user.studentNumber;
      if (!studentNumber) {
        toast?.showError(t('student_number_required_qr') || 'Student number is required to generate QR code');
        return;
      }
      const qrDataUrl = await generateStudentQRCode(studentNumber, { width: 512, margin: 4 });
      const newTab = window.open();
      newTab.document.write(`
        <html>
          <head>
            <title>QR Code - ${user.displayName || user.name}</title>
            <style>
              body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: sans-serif; background: #f3f4f6; }
              .card { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); text-align: center; }
              .ref { color: #6b7280; font-size: 0.875rem; margin-top: 0.5rem; }
            </style>
          </head>
          <body>
            <div class="card">
              <img src="${qrDataUrl}" alt="${t('qr_code') || 'QR Code'}" />
              <h1>${user.displayName || user.name}</h1>
              <p>${user.email || ''}</p>
              <div class="ref">${studentNumber}</div>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      logger.error('Failed to open QR code:', error);
      toast?.showError(t('failed_to_generate_qr') || 'Failed to generate QR code');
    }
  };
  // Helper function to create role badges with semantic colors
  const getRoleBadge = (role) => {
    return (
      <Badge color={getRoleColor(role)} size="sm">
        {getRoleDisplayName(role, lang)}
      </Badge>
    );
  };
  // Helper function to get actual color values for icons
  const getRoleIconColor = (role) => {
    const colorMap = {
      'success': '#16a34a',    // Green
      'info': '#0ea5e9',       // Blue  
      'primary': '#8b5cf6',    // Purple
      'danger': '#dc2626',     // Red
      'warning': '#f59e0b',    // Orange
      'default': '#6c757d'     // Gray
    };
    const semanticColor = getRoleColor(role);
    return colorMap[semanticColor] || colorMap.default;
  };
  // Helper function to get role icon using getThemedIcon
  const getRoleIconThemed = (role) => {
    const roleIconMap = {
      [USER_ROLES.STUDENT]: getThemedIcon('ui', 'user', 16, theme),
      [USER_ROLES.INSTRUCTOR]: getThemedIcon('ui', 'book_open', 16, theme),
      [USER_ROLES.HR]: getThemedIcon('ui', 'users', 16, theme),
      [USER_ROLES.ADMIN]: getThemedIcon('ui', 'shield', 16, theme),
      [USER_ROLES.SUPER_ADMIN]: getThemedIcon('ui', 'crown', 16, theme)
    };
    return roleIconMap[role] || getThemedIcon('ui', 'user', 16, theme);
  };
  // Data states
  const [activities, setActivities] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [users, setUsers] = useState([]);
  const [allowlist, setAllowlist] = useState({ allowedEmails: [], adminEmails: [] });
  const [classes, setClasses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [resources, setResources] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);
  const [loginLogs, setLoginLogs] = useState([]);
  const [loginSearch, setLoginSearch] = useState('');
  const [loginUserFilter, setLoginUserFilter] = useState('all');
  const [loginFrom, setLoginFrom] = useState('');
  const [activityTypeFilter, setActivityTypeFilter] = useState('all');
  const [loginTo, setLoginTo] = useState('');
  const [courses, setCourses] = useState([]);
  const [courseForm, setCourseForm] = useState({ id: '', name_en: '', name_ar: '', order: 0 });
  const [editingCourse, setEditingCourse] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordUser, setPasswordUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  // Add Category modal
  const [smtpConfig, setSmtpConfig] = useState({ host: '', port: 587, secure: false, user: '', password: '', senderName: 'CS Learning Hub', __loaded: false });
  const [smtpLoading, setSmtpLoading] = useState(false);
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [testEmailDialogOpen, setTestEmailDialogOpen] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  // Smart email composer
  const [smartComposerOpen, setSmartComposerOpen] = useState(false);
  // User deletion modal
  const [userToDelete, setUserToDelete] = useState(null);
  const [showUserDeletionModal, setShowUserDeletionModal] = useState(false);
  // Delete confirmation modal
  const [deleteModal, setDeleteModal] = useState({ open: false, item: null, type: null, onConfirm: null, relatedData: null, warningMessage: null });
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      if (activityFilter !== 'all' && s.activityId !== activityFilter) return false;
      if (submissionStudentFilter !== 'all' && s.userId !== submissionStudentFilter) return false;
      if (submissionStatusFilter !== 'all') {
        const status = s.status || SUBMISSION_STATUS.SUBMITTED;
        if (submissionStatusFilter === 'pending') {
          if (!(status === SUBMISSION_STATUS.PENDING || status === SUBMISSION_STATUS.SUBMITTED)) return false;
        } else if (submissionStatusFilter === 'graded') {
          if (status !== SUBMISSION_STATUS.GRADED) return false;
        } else if (submissionStatusFilter === 'late') {
          if (status !== 'late') return false;
        }
      }
      if (submissionScoreFilter === 'graded' && (s.score === null || s.score === undefined)) return false;
      if (submissionScoreFilter === 'not_graded' && (s.score !== null && s.score !== undefined)) return false;
      return true;
    });
  }, [submissions, activityFilter, submissionStudentFilter, submissionStatusFilter, submissionScoreFilter]);
  // Filter announcements by date
  const filteredAnnouncements = announcements.filter(announcement => {
    if (announcementFilter === 'all') return true;
    const createdAt = announcement.createdAt?.seconds ?
      new Date(announcement.createdAt.seconds * 1000) :
      new Date(announcement.createdAt);
    const now = new Date();
    switch (announcementFilter) {
      case 'today':
        const isToday = createdAt.toDateString() === now.toDateString();
        logger.debug('Date comparison', { createdAt: createdAt.toDateString(), now: now.toDateString(), isToday });
        return isToday;
      case '7days':
        const daysDiff = (now - createdAt) / (24 * 60 * 60 * 1000);
        const isWithin7Days = daysDiff <= 7;
        return isWithin7Days;
      case '30days':
        const daysDiff30 = (now - createdAt) / (24 * 60 * 60 * 1000);
        const isWithin30Days = daysDiff30 <= 30;
        return isWithin30Days;
      default:
        return true;
    }
  });
  // Form states
  const [activityForm, setActivityForm] = useState({
    id: '',
    title_en: '',
    title_ar: '',
    description_en: '',
    description_ar: '',
    course: 'python',
    type: 'quiz',
    difficulty: 'beginner',
    url: '',
    dueDate: '',
    image: '',
    maxScore: 100,
    show: true,
    allowRetake: false,
    classId: '',
    programId: '',
    subjectId: '',
    featured: false,
    optional: false,
    quizId: '',
    requiresSubmission: false,
    overrideQuizSettings: false
  });
  const [emailOptions, setEmailOptions] = useState({
    sendEmail: false,
    createAnnouncement: false,
    emailLang: 'both' // 'en' | 'ar' | 'both'
  });
  const [gradingModalOpen, setGradingModalOpen] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [gradingScore, setGradingScore] = useState('');
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    content_ar: '',
    target: 'global',
    programId: '',
    subjectId: '',
    classId: ''
  });
  const [announcementEmailOptions, setAnnouncementEmailOptions] = useState({ sendEmail: false, lang: 'both' });
  const [resourceEmailOptions, setResourceEmailOptions] = useState({ sendEmail: false, createAnnouncement: false });
  const [classForm, setClassForm] = useState({ id: '', name: '', nameAr: '', code: '', term: '', ownerEmail: '', subjectId: '' });
  const [subjects, setSubjects] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [enrollmentForm, setEnrollmentForm] = useState({ 
    userId: '', 
    classId: '', 
    role: USER_ROLES.STUDENT, 
    programId: '', 
    subjectId: '' 
  });
  // Enrollment form change handlers (normalize both raw values and events)
  const handleEnrollmentProgramChange = (eventOrValue) => {
    const value = eventOrValue && eventOrValue.target ? eventOrValue.target.value : eventOrValue;
    const newProgramId = value != null ? String(value) : '';
    setEnrollmentForm(prev => ({
      ...prev,
      programId: newProgramId,
      subjectId: '',
      classId: ''
    }));
  };
  const handleEnrollmentSubjectChange = (eventOrValue) => {
    const value = eventOrValue && eventOrValue.target ? eventOrValue.target.value : eventOrValue;
    const newSubjectId = value != null ? String(value) : '';
    setEnrollmentForm(prev => ({
      ...prev,
      subjectId: newSubjectId,
      classId: ''
    }));
  };
  const [enrollmentProgramFilter, setEnrollmentProgramFilter] = useState('all');
  const [enrollmentSubjectFilter, setEnrollmentSubjectFilter] = useState('all');
  const [enrollmentClassFilter, setEnrollmentClassFilter] = useState('all');
  const [userForm, setUserForm] = useState({ email: '', displayName: '', role: USER_ROLES.STUDENT, studentNumber: '', order: '' });
  const [activeUserFormTab, setActiveUserFormTab] = useState('basic');
  const [autoAddToAllowlist, setAutoAddToAllowlist] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [editingClass, setEditingClass] = useState(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [editingResource, setEditingResource] = useState(null);
  const [activeActivityFormTab, setActiveActivityFormTab] = useState('basic');
  const [activeAnnouncementFormTab, setActiveAnnouncementFormTab] = useState('basic');
  const [activeClassFormTab, setActiveClassFormTab] = useState('basic');
  const [activeResourceFormTab, setActiveResourceFormTab] = useState('basic');
  const [resourceForm, setResourceForm] = useState({
    title: '',
    description: '',
    url: '',
    type: 'link',
    dueDate: '',
    optional: false,
    featured: false,
    programId: '',
    subjectId: '',
    classId: '',
    courseId: ''
  });
  // ========== MEMOIZED DROPDOWN OPTIONS ==========
  // Helper function to ensure value is always a string
  const ensureString = (val) => {
    if (val === null || val === undefined) return '';
    return String(val);
  };
  // Helper function to handle dropdown changes
  const handleDropdownChange = (setter, field, resetFields = []) => (e) => {
    // Handle both event objects and direct values
    const value = e?.target?.value !== undefined ? e.target.value : e;
    setter(prev => {
      const update = { 
        ...prev, 
        [field]: value || ''
      };
      // Reset dependent fields if needed
      resetFields.forEach(f => { 
        update[f] = ''; 
      });
      return update;
    });
  };
  // Activity Form - Program Options
  const activityProgramOptions = useMemo(() => {
    const opts = [
      { value: '', label: t('all_programs'), icon: getThemedIcon('ui', 'filter', 16, theme) }
    ];
    const validPrograms = programs
      .filter(prog => prog.docId || prog.id)
      .map(prog => {
        const value = ensureString(prog.docId || prog.id);
        const label = lang === 'ar' 
          ? (prog.name_ar || prog.name_en || value) 
          : (prog.name_en || prog.name_ar || value);
        return { value, label, icon: getThemedIcon('ui', 'book_open', 16, theme) };
      });
    return [...opts, ...validPrograms];
  }, [programs, lang, t]);
  // Activity Form - Subject Options
  const activitySubjectOptions = useMemo(() => {
    const opts = [
      { value: '', label: t('all_subjects'), icon: getThemedIcon('ui', 'filter', 16, theme) }
    ];
    const validSubjects = subjects
      .filter(sub => {
        if (!activityForm.programId) return true;
        const subProgramId = ensureString(sub.programId || sub.program || '');
        const formProgramId = ensureString(activityForm.programId);
        return subProgramId === formProgramId;
      })
      .filter(sub => sub.docId || sub.id)
      .map(sub => {
        const value = ensureString(sub.docId || sub.id);
        const label = lang === 'ar' 
          ? (sub.name_ar || sub.name_en || value) 
          : (sub.name_en || sub.name_ar || value);
        return { value, label, icon: getThemedIcon('ui', 'file_text', 16, theme) };
      });
    return [...opts, ...validSubjects];
  }, [subjects, activityForm.programId, lang, t]);
  // Activity Form - Class Options
  const activityClassOptions = useMemo(() => {
    const opts = [
      { value: '', label: t('all_classes'), icon: getThemedIcon('ui', 'filter', 16, theme) }
    ];
    const validClasses = classes
      .filter(cls => {
        if (!activityForm.subjectId) return true;
        const clsSubjectId = ensureString(cls.subjectId || cls.subject || '');
        const formSubjectId = ensureString(activityForm.subjectId);
        return clsSubjectId === formSubjectId;
      })
      .filter(cls => cls.docId || cls.id)
      .map(cls => {
        const value = ensureString(cls.docId || cls.id);
        const name = lang === 'ar' ? (cls.name_ar || cls.name) : (cls.name || cls.name_ar);
        const label = `${name || 'Unnamed Class'}${cls.code ? ` (${cls.code})` : ''}`;
        return { value, label, icon: getThemedIcon('ui', 'users', 16, theme) };
      });
    return [...opts, ...validClasses];
  }, [classes, activityForm.subjectId, lang, t]);
  // Enrollment Form - Program Options
  const enrollmentProgramOptions = useMemo(() => {
    const opts = [
      { value: '', label: t('all_programs'), icon: getThemedIcon('ui', 'filter', 16, theme) }
    ];
    const validPrograms = programs.map(p => {
      const value = ensureString(p.docId || p.id);
      const label = lang === 'ar' 
        ? (p.name_ar || p.name_en || p.code || value)
        : (p.name_en || p.name_ar || p.code || value);
      return { value, label, icon: getThemedIcon('ui', 'book_open', 16, theme) };
    });
    return [...opts, ...validPrograms];
  }, [programs, lang, t]);
  // Enrollment Form - Subject Options
  const enrollmentSubjectOptions = useMemo(() => {
    const opts = [
      { value: '', label: t('all_subjects'), icon: getThemedIcon('ui', 'filter', 16, theme) }
    ];
    const validSubjects = subjects
      .filter(s => {
        if (!enrollmentForm.programId || enrollmentForm.programId === '') return true;
        const subProgramId = ensureString(s.programId || '');
        const formProgramId = ensureString(enrollmentForm.programId);
        return subProgramId === formProgramId;
      })
      .map(s => {
        const value = ensureString(s.docId || s.id);
        const label = lang === 'ar'
          ? (s.name_ar || s.name_en || s.code || value)
          : (s.name_en || s.name_ar || s.code || value);
        return { value, label, icon: getThemedIcon('ui', 'file_text', 16, theme) };
      });
    return [...opts, ...validSubjects];
  }, [subjects, enrollmentForm.programId, lang, t]);
  // Enrollment Form - Class Options
  const enrollmentClassOptions = useMemo(() => {
    const opts = [
      { value: '', label: t('all_classes'), icon: getThemedIcon('ui', 'filter', 16, theme) }
    ];
    const validClasses = classes
      .filter(c => {
        if (enrollmentForm.subjectId && c.subjectId !== enrollmentForm.subjectId) return false;
        if (enrollmentForm.programId) {
          const subject = subjects.find(s => {
            const sId = ensureString(s.docId || s.id);
            const cSubjectId = ensureString(c.subjectId);
            return sId === cSubjectId;
          });
          if (!subject || subject.programId !== enrollmentForm.programId) return false;
        }
        return true;
      })
      .map(c => {
        const codePart = c.code ? ` (${c.code})` : '';
        const termPart = c.term ? ` - ${c.term}` : '';
        const yearPart = c.year ? ` ${c.year}` : '';
        const semesterPart = c.semester ? ` ${c.semester}` : '';
        return {
          value: ensureString(c.docId || c.id),
          displayLabel: `${c.name}${codePart}${termPart}${yearPart}${semesterPart}`,
          label: `${c.name}${codePart}${termPart}${yearPart}${semesterPart}`,
          icon: getThemedIcon('ui', 'users', 16, theme)
        };
      });
    return [...opts, ...validClasses];
  }, [classes, enrollmentForm.subjectId, enrollmentForm.programId, subjects, t]);
  // Enrollment Filters - Program Options
  const enrollmentFilterProgramOptions = useMemo(() => {
    const opts = [
      { value: 'all', label: t('all_programs'), icon: getThemedIcon('ui', 'filter', 16, theme) }
    ];
    const validPrograms = programs.map(p => {
      const value = ensureString(p.docId || p.id);
      const label = lang === 'ar' 
        ? (p.name_ar || p.name_en || p.code || value)
        : (p.name_en || p.name_ar || p.code || value);
      return { value, label };
    });
    return [...opts, ...validPrograms];
  }, [programs, lang, t]);
  // Enrollment Filters - Subject Options
  const enrollmentFilterSubjectOptions = useMemo(() => {
    const opts = [
      { value: 'all', label: t('all_subjects'), icon: getThemedIcon('ui', 'filter', 16, theme) }
    ];
    const validSubjects = subjects
      .filter(s => {
        if (!enrollmentProgramFilter || enrollmentProgramFilter === 'all') return true;
        const subProgramId = ensureString(s.programId || '');
        const filterProgramId = ensureString(enrollmentProgramFilter);
        return subProgramId === filterProgramId;
      })
      .map(s => {
        const value = ensureString(s.docId || s.id);
        const label = lang === 'ar'
          ? (s.name_ar || s.name_en || s.code || value)
          : (s.name_en || s.name_ar || s.code || value);
        return { value, label };
      });
    return [...opts, ...validSubjects];
  }, [subjects, enrollmentProgramFilter, lang, t]);
  // Enrollment Filters - Class Options
  const enrollmentFilterClassOptions = useMemo(() => {
    const opts = [
      { value: 'all', label: t('all_classes'), icon: getThemedIcon('ui', 'filter', 16, theme) }
    ];
    const validClasses = classes
      .filter(c => {
        if (enrollmentSubjectFilter && enrollmentSubjectFilter !== 'all' && c.subjectId !== enrollmentSubjectFilter) return false;
        if (enrollmentProgramFilter && enrollmentProgramFilter !== 'all') {
          const subject = subjects.find(s => {
            const sId = ensureString(s.docId || s.id);
            const cSubjectId = ensureString(c.subjectId);
            return sId === cSubjectId;
          });
          if (!subject || subject.programId !== enrollmentProgramFilter) return false;
        }
        return true;
      })
      .map(c => {
        const codePart = c.code ? ` (${c.code})` : '';
        const termPart = c.term ? ` - ${c.term}` : '';
        const yearPart = c.year ? ` ${c.year}` : '';
        const semesterPart = c.semester ? ` ${c.semester}` : '';
        return {
          value: ensureString(c.docId || c.id),
          label: `${c.name}${codePart}${termPart}${yearPart}${semesterPart}`
        };
      });
    return [...opts, ...validClasses];
  }, [classes, enrollmentSubjectFilter, enrollmentProgramFilter, subjects, t]);
  // Class Form - Subject Options
  const classFormSubjectOptions = useMemo(() => {
    const opts = [
      { value: '', label: t('all_subjects'), icon: getThemedIcon('ui', 'filter', 16, theme) }
    ];
    const validSubjects = subjects.map(subject => {
      const value = ensureString(subject.docId || subject.id);
      const name = lang === 'ar' 
        ? (subject.name_ar || subject.name_en || '')
        : (subject.name_en || subject.name_ar || '');
      const label = `${name}${subject.code ? ` (${subject.code})` : ''}`;
      return { value, label, icon: getThemedIcon('ui', 'file_text', 16, theme) };
    });
    return [...opts, ...validSubjects];
  }, [subjects, lang, t]);
  // Debug logging for dropdown state changes
  useEffect(() => {
    }, [activityForm.programId, activityForm.subjectId, activityForm.classId, activityProgramOptions.length, activitySubjectOptions.length, activityClassOptions.length]);
  // Debug logging for enrollment form state
  useEffect(() => {
    }, [enrollmentForm.programId, enrollmentForm.subjectId, enrollmentForm.classId, 
      enrollmentProgramOptions.length, enrollmentSubjectOptions.length, enrollmentClassOptions.length]);
  // Listen for URL changes (hash or search params) from sidebar or direct navigation
  const [hashProcessed, setHashProcessed] = useState(false);
  useEffect(() => {
    // First check for tab in query parameters
    if (location.search) {
      const searchParams = new URLSearchParams(location.search);
      const tabFromUrl = searchParams.get('tab');
      if (tabFromUrl && tabFromUrl !== activeTab) {
        setActiveTab(tabFromUrl);
        localStorage.setItem('dashboardActiveTab', tabFromUrl);
        setHashProcessed(true);
        return;
      }
    }
    // Then check for hash navigation (legacy support)
    if (location.hash && !hashProcessed) {
      const hash = location.hash.substring(1); // Remove #
      const hashToTabMap = {
        'programs': 'programs',
        'subjects': 'subjects',
        'classes': 'classes',
        'enrollments': 'manage-enrollments',
        'marks': 'marks',
        'classschedule': 'classschedule'
      };
      const tab = hashToTabMap[hash];
      if (tab && tab !== activeTab) {
        setActiveTab(tab);
        localStorage.setItem('dashboardActiveTab', tab);
        setHashProcessed(true);
      }
    } else if (!location.hash && hashProcessed) {
      // Hash was cleared, reset flag
      setHashProcessed(false);
    }
  }, [location.hash]);
  useEffect(() => {
    if (!authLoading && (!user || !(isAdmin || isSuperAdmin || isInstructor))) {
      navigate('/');
      return;
    }
    if (user && (isAdmin || isSuperAdmin || isInstructor)) {
      loadData();
    }
  }, [user, isAdmin, isSuperAdmin, isInstructor, authLoading, navigate]);
  const loadData = async () => {
    setLoading(true);
    try {
      const [activitiesRes, announcementsRes, usersRes, allowlistRes, classesRes, enrollmentsRes, submissionsRes, resourcesRes, loginLogsRes, coursesRes, quizzesRes, subjectsRes, programsRes, notificationLogsRes] = await Promise.all([
        getActivities(),
        getAnnouncements(),
        getUsers(),
        getAllowlist(),
        getClasses(),
        getEnrollments(),
        getSubmissions(),
        getResources(),
        getLoginLogs(),
        getCourses(),
        (async () => {
          try {
            return await getAllQuizzes();
          } catch {
            return { success: false, data: [] };
          }
        })(),
        getSubjects(),
        getPrograms(),
        getNotificationLogs(notificationLogFilters)
      ]);
      if (activitiesRes.success) {
        setActivities(activitiesRes.data);
      }
      if (announcementsRes.success) setAnnouncements(announcementsRes.data);
      if (usersRes.success) setUsers(usersRes.data);
      if (allowlistRes.success) setAllowlist(allowlistRes.data);
      if (classesRes.success) {
        setClasses(classesRes.data || []);
      }
      if (subjectsRes.success) setSubjects(subjectsRes.data || []);
      if (programsRes.success) setPrograms(programsRes.data || []);
      if (notificationLogsRes.success) setNotificationLogs(notificationLogsRes.data);
      if (quizzesRes.success) setQuizzes(quizzesRes.data || []);
      // Enrich enrollments with program and subject names (like HR Penalties)
      if (enrollmentsRes.success) {
        const enrollmentsData = enrollmentsRes.data || [];
        const classesData = classesRes.data || [];
        const subjectsData = subjectsRes.data || [];
        const programsData = programsRes.data || [];
        const enrichedEnrollments = await Promise.all(enrollmentsData.map(async (enrollment) => {
          const enriched = {
            ...enrollment,
            id: enrollment.id || enrollment.docId,
            docId: enrollment.docId || enrollment.id,
            programName: 'N/A',
            subjectName: 'N/A'
          };
          // Get classId
          const classId = enrollment.classId || enrollment.classDocId;
          if (!classId) {
            return enriched;
          }
          // Find class
          const classItem = classesData.find(c => {
            const cId = c.docId || c.id;
            return String(cId) === String(classId);
          });
          if (!classItem) {
            return enriched;
          }
          // Get subjectId from class
          const subjectId = classItem.subjectId || enrollment.subjectId;
          if (!subjectId) {
            return enriched;
          }
          // Find subject
          const subject = subjectsData.find(s => {
            const sId = s.docId || s.id;
            return String(sId) === String(subjectId);
          });
          if (subject) {
            enriched.subjectName = subject.name_en || subject.name || subject.code || 'N/A';
            // Get programId from subject
            const programId = subject.programId;
            if (programId) {
              // Find program
              const program = programsData.find(p => {
                const pId = p.docId || p.id;
                return String(pId) === String(programId);
              });
              if (program) {
                enriched.programName = program.name_en || program.name || program.code || 'N/A';
              }
            }
          }
          return enriched;
        }));
        setEnrollments(enrichedEnrollments);
      }
      if (submissionsRes.success) setSubmissions(submissionsRes.data);
      if (resourcesRes.success) setResources(resourcesRes.data);
      if (loginLogsRes.success) setLoginLogs(loginLogsRes.data);
      if (coursesRes.success) setCourses(coursesRes.data || []);
      if (quizzesRes.success) setQuizzes(quizzesRes.data || []);
    } catch (error) {
      logger.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };
  // Auto-refresh for Activity tab
  useEffect(() => {
    if (!activityAutoRefreshMs || activeTab !== 'login') return;
    const id = setInterval(() => {
      loadData();
      setActivityLastUpdatedAt(Date.now());
    }, activityAutoRefreshMs);
    return () => clearInterval(id);
  }, [activityAutoRefreshMs, activeTab]);
  // Validation functions for deletion
  const validateUserDeletion = async (user) => {
    const userEnrollments = enrollments.filter(e => e.userId === user.docId);
    const userSubmissions = submissions.filter(s => s.userId === user.docId);
    if (userEnrollments.length > 0 || userSubmissions.length > 0) {
      return {
        canDelete: false,
        hasChildren: true,
        message: `Cannot delete user. This user has ${userEnrollments.length} enrollment(s) and ${userSubmissions.length} submission(s) that must be deleted first.`
      };
    }
    return { canDelete: true };
  };
  const validateClassDeletion = async (classItem) => {
    const effectiveId = classItem.docId || classItem.id;
    const classEnrollments = enrollments.filter(e => e.classId === effectiveId);
    const relatedActivities = activities.filter(a => (a.classId || '') === effectiveId);
    if (classEnrollments.length > 0 || relatedActivities.length > 0) {
      return {
        canDelete: false,
        hasChildren: true,
        message: `Cannot delete class. This class has ${classEnrollments.length} student(s) enrolled and ${relatedActivities.length} linked activity(ies) that must be removed first.`
      };
    }
    return { canDelete: true };
  };
  const validateActivityDeletion = async (activity) => {
    const activitySubmissions = submissions.filter(s => s.activityId === activity.id);
    if (activitySubmissions.length > 0) {
      return {
        canDelete: false,
        hasChildren: true,
        message: `Cannot delete activity. This activity has ${activitySubmissions.length} submission(s) that must be deleted first.`
      };
    }
    return { canDelete: true };
  };
  const handleActivitySubmit = async (e) => {
    e.preventDefault();
    if (!validateActivityForm()) {
      toast?.showError('Please fix the form errors before submitting.');
      return;
    }
    setLoading(true);
    try {
      // Localize fallbacks: if AR missing, default to EN; same for description
      const normalized = {
        ...activityForm,
        title_ar: activityForm.title_ar?.trim() || activityForm.title_en?.trim() || activityForm.id,
        description_ar: activityForm.description_ar?.trim() || activityForm.description_en?.trim() || ''
      };
      const result = editingActivity ?
        await updateActivity(editingActivity.docId, normalized) :
        await addActivity(normalized);
      if (result.success) {
        // Log activity
        try {
          await logActivity(editingActivity ? ACTIVITY_TYPES.ACTIVITY_UPDATED : ACTIVITY_TYPES.ACTIVITY_CREATED, {
            activityId: editingActivity?.docId || result.id,
            activityTitle: activityForm.title_en || activityForm.title_ar || activityForm.id,
            activityType: activityForm.type,
            classId: activityForm.classId
          });
        } catch (e) { }
        // Handle email notifications if checked
        if (!editingActivity && emailOptions.sendEmail) {
          await sendActivityEmail(activityForm);
        }
        // Handle announcement creation if checked
        if (!editingActivity && emailOptions.createAnnouncement) {
          await createActivityAnnouncement(activityForm);
        }
        // Send in-app notifications for new activities
        if (!editingActivity) {
          try {
            const previewTitle = activityForm.title_en || activityForm.title_ar || activityForm.id;
            if (activityForm.classId) {
              await notifyUsersByClass(
                activityForm.classId,
                `🎯 ${previewTitle}`,
                activityForm.description_en || activityForm.description_ar || 'New activity',
                'activity'
              );
            } else {
              await notifyAllUsers(
                `🎯 ${previewTitle}`,
                activityForm.description_en || activityForm.description_ar || 'New activity',
                'activity'
              );
            }
          } catch (e) {
            }
        }
        await loadData();
        handleCancelEdit();
        // Reset email options
        setEmailOptions({ sendEmail: false, createAnnouncement: false });
        toast?.showSuccess(editingActivity ? 'Activity updated successfully!' : 'Activity created successfully!');
      } else {
        toast?.showError('Error: ' + result.error);
      }
    } catch (error) {
      logger.error('Error saving activity:', error);
      toast?.showError('Error saving activity: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  // Send activity email notification
  const sendActivityEmail = async (activity) => {
    try {
      // Get class enrollments
      const enrollmentsResult = await getEnrollments();
      const classStudents = enrollmentsResult.data?.filter(e =>
        e.classId === activity.classId
      ) || [];
      if (classStudents.length === 0) {
        toast?.showInfo('No students found in this class');
        return;
      }
      // Get student emails
      const studentEmails = classStudents.map(enrollment => {
        const user = users.find(u => u.docId === enrollment.userId);
        return user?.email;
      }).filter(Boolean);
      if (studentEmails.length === 0) {
        toast?.showInfo('No student emails found');
        return;
      }
      // Format email
      const dueDate = activity.dueDate
        ? formatDateTime(activity.dueDate)
        : 'No deadline';
      const buildEn = () => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #800020;">📚 New Activity Assigned</h2>
          <div style="background: #f5f5f5a3; padding: 1.5rem; border-radius: 8px; margin: 1rem 0;">
            <h3 style="margin-top: 0;">${activity.title_en || ''}</h3>
            <p><strong>Type:</strong> ${activity.type}</p>
            <p><strong>Level:</strong> ${activity.difficulty}</p>
            <p><strong>Due Date:</strong> ${dueDate}</p>
            <p><strong>Retakes:</strong> ${activity.allowRetake ? 'Allowed ✅' : 'Not allowed ❌'}</p>
            ${activity.optional ? '<p><strong>Status:</strong> Optional 💡</p>' : '<p><strong>Status:</strong> Required 📌</p>'}
          </div>
          <p>${activity.description_en || ''}</p>
          <a href="${activity.url}" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#800020,#600018);color:#fff;text-decoration:none;border-radius:8px;margin-top:1rem;">${t('start_activity') || 'Start Activity'} 🎯</a>
        </div>`;
      const buildAr = () => `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; text-align:right">
          <h2 style="color: #800020;">📚 واجب/نشاط جديد</h2>
          <div style="background: #f5f5f5a3; padding: 1.5rem; border-radius: 8px; margin: 1rem 0;">
            <h3 style="margin-top: 0;">${activity.title_ar || activity.title_en || ''}</h3>
            <p><strong>النوع:</strong> ${activity.type}</p>
            <p><strong>المستوى:</strong> ${activity.difficulty}</p>
            <p><strong>تاريخ التسليم:</strong> ${dueDate}</p>
            <p><strong>إعادة المحاولة:</strong> ${activity.allowRetake ? 'مسموح ✅' : 'غير مسموح ❌'}</p>
            ${activity.optional ? '<p><strong>الحالة:</strong> اختياري 💡</p>' : '<p><strong>الحالة:</strong> إلزامي 📌</p>'}
          </div>
          <p>${activity.description_ar || ''}</p>
          <a href="${activity.url}" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#800020,#600018);color:#fff;text-decoration:none;border-radius:8px;margin-top:1rem;">ابدأ النشاط 🎯</a>
        </div>`;
      let emailBody = '';
      if (emailOptions.emailLang === 'en') emailBody = buildEn();
      else if (emailOptions.emailLang === 'ar') emailBody = buildAr();
      else emailBody = [buildEn(), '<hr/>', buildAr()].join('');
      // Send email via Firebase function
      const sendResult = await sendEmail({
        to: studentEmails,
        subject: `New Activity: ${activity.title_en || activity.title_ar || ''}`,
        html: emailBody
      });
      if (sendResult.success) {
        toast?.showSuccess(`Email sent to ${studentEmails.length} students`);
      } else {
        toast?.showError('Failed to send email: ' + sendResult.error);
      }
    } catch (error) {
      logger.error('Error sending email:', error);
      toast?.showError('Error sending email notification');
    }
  };
  // Create announcement from activity
  const createActivityAnnouncement = async (activity) => {
    try {
      const dueDate = activity.dueDate
        ? formatDateTime(activity.dueDate)
        : 'No deadline';
      const announcement = {
        title: `New ${activity.type}: ${activity.title_en}`,
        content: `
📚 ${activity.title_en}
${activity.description_en || 'No description'}
📅 Due Date: ${dueDate}
🎯 Level: ${activity.difficulty}
${activity.allowRetake ? '🔄 Retakes allowed' : '⚠️ No retakes'}
${activity.optional ? '💡 Optional activity' : '📌 Required activity'}
🔗 Link: ${activity.url}
        `.trim(),
        priority: activity.optional ? 'normal' : 'high',
        classId: activity.classId || null
      };
      const result = await addAnnouncement(announcement);
      if (result.success) {
        toast?.showSuccess(t('announcement_created_successfully') || 'Announcement created successfully');
      } else {
        toast?.showError(t('failed_to_create_announcement') || 'Failed to create announcement');
      }
    } catch (error) {
      logger.error('Error creating announcement:', error);
      toast?.showError('Error creating announcement');
    }
  };
  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = editingAnnouncement ?
        await updateAnnouncement(editingAnnouncement.docId, announcementForm) :
        await addAnnouncement(announcementForm);
      if (result.success) {
        // Log activity
        try {
          await logActivity(editingAnnouncement ? ACTIVITY_TYPES.ANNOUNCEMENT_UPDATED : ACTIVITY_TYPES.ANNOUNCEMENT_CREATED, {
            announcementId: editingAnnouncement?.docId || result.id,
            announcementTitle: announcementForm.title,
            target: announcementForm.target,
            programId: announcementForm.programId,
            subjectId: announcementForm.subjectId,
            classId: announcementForm.classId
          });
        } catch (e) { }
        // Legacy log (keep for backward compatibility)
        if (!editingAnnouncement) {
          try {
            await addActivityLog({
              type: 'announcement_created',
              userId: user.uid,
              email: user.email,
              displayName: await getUserDisplayName(user),
              userAgent: navigator.userAgent,
              metadata: {
                announcementId: result.id,
                title: announcementForm.title,
                target: announcementForm.target,
                programId: announcementForm.programId,
                subjectId: announcementForm.subjectId,
                classId: announcementForm.classId
              }
            });
          } catch (e) { }
        }
        // Send notifications only for new announcements
        if (!editingAnnouncement) {
          const { programId, subjectId, classId } = announcementForm;
          let notificationSent = false;
          if (classId) {
            await notifyUsersByClass(
              classId,
              `📢 ${announcementForm.title}`,
              announcementForm.content,
              'announcement'
            );
            notificationSent = true;
          }
          // TODO: Implement notifyUsersBySubject and notifyUsersByProgram if needed
          /*
          else if (subjectId) {
            // Placeholder for future implementation
            await notifyUsersBySubject(subjectId, `📢 ${announcementForm.title}`, announcementForm.content, 'announcement');
            notificationSent = true;
          } else if (programId) {
            // Placeholder for future implementation
            await notifyUsersByProgram(programId, `📢 ${announcementForm.title}`, announcementForm.content, 'announcement');
            notificationSent = true;
          }
          */
          if (!notificationSent) {
            await notifyAllUsers(
              `📢 ${announcementForm.title}`,
              announcementForm.content,
              'announcement'
            );
          }
          // Optional email blast
          if (announcementEmailOptions.sendEmail) {
            const buildBody = () => {
              const en = announcementForm.content?.trim();
              const ar = announcementForm.content_ar?.trim();
              // Always send bilingual when available: EN first, then AR if provided
              return [`<div>${en || ''}</div>`, ar ? `<hr/><div dir="rtl" style="text-align:right">${ar}</div>` : ''].join('');
            };
            // Determine recipients based on target
            let recipients = [];
            if (classId) {
               const enrollmentsResult = await getEnrollments({ classId });
               const userIds = (enrollmentsResult.data || []).map(e => e.userId);
               recipients = users.filter(u => userIds.includes(u.docId)).map(u => u.email).filter(Boolean);
             } else {
               // For now, non-class targets are global. This can be expanded.
               recipients = users.map(u => u.email).filter(Boolean);
             }
            if (recipients.length > 0) {
              const sendRes = await sendEmail({
                to: recipients,
                subject: `📢 ${announcementForm.title}`,
                html: buildBody(),
                type: 'announcement'
              });
              if (!sendRes.success) {
                toast?.showError('Announcement created, but email failed: ' + sendRes.error);
              } else {
                toast?.showSuccess(`Email sent to ${recipients.length} recipients.`);
              }
            } else {
               toast?.showInfo('No recipients found for this announcement.');
            }
          }
        }
        await loadData();
        setAnnouncementForm({ title: '', content: '', content_ar: '', target: 'global', programId: '', subjectId: '', classId: '' });
        setAnnouncementEmailOptions({ sendEmail: false, lang: 'both' });
        setEditingAnnouncement(null);
        toast?.showSuccess(editingAnnouncement ?
          'Announcement updated successfully!' :
          'Announcement created and notifications sent!'
        );
      } else {
        toast?.showError(`Error ${editingAnnouncement ? 'updating' : 'creating'} announcement: ` + result.error);
      }
    } catch (error) {
      logger.error('Error with announcement:', error);
      toast?.showError(`Error ${editingAnnouncement ? 'updating' : 'creating'} announcement: ` + error.message);
    } finally {
      setLoading(false);
    }
  };
  const handleAllowlistSave = async () => {
    setLoading(true);
    try {
      const result = await updateAllowlist(allowlist);
      if (result.success) {
        toast?.showSuccess('Allowlist updated successfully');
      } else {
        toast?.showError('Error updating allowlist: ' + result.error);
      }
    } catch (error) {
      logger.error('Error updating allowlist:', error);
    } finally {
      setLoading(false);
    }
  };
  if (authLoading) {
    return <Loading variant="overlay" fullscreen message={t('loading') || 'Loading...'} fancyVariant="dots" />;
  }
  if (!user || !isAdmin) {
    return (
      <div className="dashboard-page">
        <div className="access-denied">
          <h2>{t('access_denied') || 'Access Denied'}</h2>
          <p>{t('insufficient_privileges') || 'You need admin privileges to access this page.'}</p>
        </div>
      </div>
    );
  }
  // Show initial full-screen loading only on first load
  if (authLoading) {
    return <Loading variant="overlay" fullscreen message={t('loading') || 'Loading...'} fancyVariant="dots" />;
  }
  return (
    <div className="dashboard-page" data-theme={theme}>
      {/* Compact header removed to save vertical space */}
      <div className="dashboard-content">
        {/* Joyride dashboard tour component injected to guide through tabs */}
        <Joyride
          continuous
          run={runTour}
          steps={tourSteps}
          callback={handleJoyrideCallback}
          locale={{
            back: lang === 'ar' ? 'السابق' : 'Back',
            close: lang === 'ar' ? 'إغلاق' : 'Close',
            last: lang === 'ar' ? 'إنهاء' : 'Finish',
            next: lang === 'ar' ? 'التالي' : 'Next',
            skip: lang === 'ar' ? 'تخطي' : 'Skip'
          }}
          styles={{
            // Use the app's primary color so the Joyride buttons (Back/Next) match other UI buttons
            // Fallback to blue if the CSS var is not defined
            options: {
              primaryColor: 'var(--color-primary, #1e90ff)',
              textColor: '#000',
              backgroundColor: '#fff',
              overlayColor: 'rgba(0,0,0,0.5)'
            }
          }}
        />
        <div data-tour="mode-switcher">
    <RibbonTabs
      categories={ribbonCategories}
      activeCategory={activeCategory}
      activeItem={activeTab}
      onChange={({ category, item }) => { setActiveCategory(category); handleTabChange(item); }}
    />
  </div>
        {/* Summary Cards with Filters */}
        <AnalyticsDashboardPage
          programs={programs}
          subjects={subjects}
          classes={classes}
          enrollments={enrollments}
          activities={activities}
          users={users}
          submissions={submissions}
          quizzes={quizzes}
          announcements={announcements}
          resources={resources}
          enrollmentProgramFilter={enrollmentProgramFilter}
          enrollmentSubjectFilter={enrollmentSubjectFilter}
          enrollmentClassFilter={enrollmentClassFilter}
          setEnrollmentProgramFilter={setEnrollmentProgramFilter}
          setEnrollmentSubjectFilter={setEnrollmentSubjectFilter}
          setEnrollmentClassFilter={setEnrollmentClassFilter}
          user={user}
          isSuperAdmin={isSuperAdmin}
          isAdmin={isAdmin}
          isInstructor={isInstructor}
        />

        <div className="tab-content">
           {loading && <Loading variant="overlay" message={t('loading') || 'Loading...'} fancyVariant="dots" />}
    <div className="tab-header">
      <h2>{(() => {
        const currentTabItem = ribbonCategories.flatMap(cat => cat.items).find(item => item.key === activeTab);
        return currentTabItem ? currentTabItem.label : (t('activity') || 'Activity');
      })()}</h2>
             <div className="tooltip-wrapper">
               <InfoTooltip contentKey={`help.${activeTab}`} />
             </div>
           </div>
        {activeTab === 'activities' && (
            <ActivitiesPage
              activities={activities}
              programs={programs}
              subjects={subjects}
              classes={classes}
              quizzes={quizzes}
              courses={courses}
              users={users}
              activityForm={activityForm}
              setActivityForm={setActivityForm}
              editingActivity={editingActivity}
              setEditingActivity={setEditingActivity}
              activeActivityFormTab={activeActivityFormTab}
              setActiveActivityFormTab={setActiveActivityFormTab}
              formErrors={formErrors}
              loading={loading}
              setLoading={setLoading}
              emailOptions={emailOptions}
              setEmailOptions={setEmailOptions}
              deleteModal={deleteModal}
              setDeleteModal={setDeleteModal}
              loadData={loadData}
              enrollmentProgramFilter={enrollmentProgramFilter}
              enrollmentSubjectFilter={enrollmentSubjectFilter}
              enrollmentClassFilter={enrollmentClassFilter}
              activityProgramOptions={activityProgramOptions}
              activitySubjectOptions={activitySubjectOptions}
              activityClassOptions={activityClassOptions}
              handleDropdownChange={handleDropdownChange}
              handleActivitySubmit={handleActivitySubmit}
              handleEditActivity={handleEditActivity}
              user={user}
            />
          )}
          {activeTab === 'announcements' && (
          <AnnouncementsPage
            announcements={announcements}
            programs={programs}
            subjects={subjects}
            classes={classes}
            users={users}
            announcementForm={announcementForm}
            setAnnouncementForm={setAnnouncementForm}
            editingAnnouncement={editingAnnouncement}
            setEditingAnnouncement={setEditingAnnouncement}
            activeAnnouncementFormTab={activeAnnouncementFormTab}
            setActiveAnnouncementFormTab={setActiveAnnouncementFormTab}
            announcementEmailOptions={announcementEmailOptions}
            setAnnouncementEmailOptions={setAnnouncementEmailOptions}
            deleteModal={deleteModal}
            setDeleteModal={setDeleteModal}
            setAnnouncements={setAnnouncements}
            loadData={loadData}
            theme={theme}
            loading={loading}
            setLoading={setLoading}
            enrollmentProgramFilter={enrollmentProgramFilter}
            enrollmentSubjectFilter={enrollmentSubjectFilter}
            enrollmentClassFilter={enrollmentClassFilter}
            smartComposerOpen={smartComposerOpen}
            setSmartComposerOpen={setSmartComposerOpen}
            activityProgramOptions={activityProgramOptions}
            activitySubjectOptions={activitySubjectOptions}
            activityClassOptions={activityClassOptions}
            handleDropdownChange={handleDropdownChange}
            user={user}
          />
        )}
          {activeTab === 'programs' && isSuperAdmin && (
            <ProgramsManagementPage />
          )}
          {activeTab === 'subjects' && (isSuperAdmin || isAdmin || isInstructor) && (
            <SubjectsManagementPage />
          )}
          {activeTab === 'marks' && (isSuperAdmin || isAdmin || isInstructor) && (
            <MarksEntryPage />
          )}
          {activeTab === 'classschedule' && (isSuperAdmin || isAdmin || isInstructor) && (
            <ClassSchedulePage />
          )}
          {activeTab === 'manage-enrollments' && (isSuperAdmin || isAdmin || isInstructor) && (
            <ManageEnrollmentsPage />
          )}
          {activeTab === 'hr-penalties' && (isSuperAdmin || isAdmin || isInstructor) && (
            <HRPenaltiesPage />
          )}
          {activeTab === 'instructor-participation' && (isSuperAdmin || isAdmin || isInstructor) && (
            <InstructorParticipationPage />
          )}
          {activeTab === 'instructor-behavior' && (isSuperAdmin || isAdmin || isInstructor) && (
            <InstructorBehaviorPage />
          )}
          {activeTab === 'scheduled-reports' && (isSuperAdmin || isAdmin) && (
            <ScheduledReportsPage />
          )}
          {activeTab === 'login' && (
            <LoginActivityPage
              loginLogs={loginLogs}
              setLoginLogs={setLoginLogs}
              activityTypeFilter={activityTypeFilter}
              setActivityTypeFilter={setActivityTypeFilter}
              loginSearch={loginSearch}
              setLoginSearch={setLoginSearch}
              loginUserFilter={loginUserFilter}
              setLoginUserFilter={setLoginUserFilter}
              loginFrom={loginFrom}
              setLoginFrom={setLoginFrom}
              loginTo={loginTo}
              setLoginTo={setLoginTo}
              activityAutoRefreshMs={activityAutoRefreshMs}
              setActivityAutoRefreshMs={setActivityAutoRefreshMs}
              activityNowTick={activityNowTick}
              activityLastUpdatedAt={activityLastUpdatedAt}
              setActivityLastUpdatedAt={setActivityLastUpdatedAt}
              users={users}
              enrollments={enrollments}
              deleteModal={deleteModal}
              setDeleteModal={setDeleteModal}
              loading={loading}
              setLoading={setLoading}
              loadData={loadData}
              theme={theme}
            />
          )}
          {activeTab === 'classes' && (
            <ClassesPage
              classes={classes}
              programs={programs}
              subjects={subjects}
              users={users}
              enrollments={enrollments}
              activities={activities}
              classForm={classForm}
              setClassForm={setClassForm}
              editingClass={editingClass}
              setEditingClass={setEditingClass}
              activeClassFormTab={activeClassFormTab}
              setActiveClassFormTab={setActiveClassFormTab}
              deleteModal={deleteModal}
              setDeleteModal={setDeleteModal}
              setClasses={setClasses}
              loadData={loadData}
              theme={theme}
              loading={loading}
              setLoading={setLoading}
              classProgramFilter={classProgramFilter}
              classSubjectFilter={classSubjectFilter}
              classFilter={classFilter}
              setClassProgramFilter={setClassProgramFilter}
              setClassSubjectFilter={setClassSubjectFilter}
              setClassFilter={setClassFilter}
              classFormSubjectOptions={classFormSubjectOptions}
              handleDropdownChange={handleDropdownChange}
              user={user}
            />
          )}
          {/* Grade Submission Modal */}
        <Modal
          isOpen={gradingModalOpen && !!gradingSubmission}
          onClose={() => {
            if (!loading) {
              setGradingModalOpen(false);
              setGradingSubmission(null);
              setGradingScore('');
            }
          }}
          title={t('grade_submission') || 'Grade Submission'}
          size="small"
          closeOnOverlayClick={!loading}
          footer={(
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (!loading) {
                    setGradingModalOpen(false);
                    setGradingSubmission(null);
                    setGradingScore('');
                  }
                }}
                disabled={loading}
              >
                {t('cancel') || 'Cancel'}
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={async () => {
                  if (!gradingSubmission || !gradingScore) return;
                  setLoading(true);
                  try {
                    const result = await gradeSubmission(
                      gradingSubmission.docId,
                      parseFloat(gradingScore)
                    );
                    if (result.success) {
                      await loadData();
                      setGradingModalOpen(false);
                      setGradingSubmission(null);
                      setGradingScore('');
                      toast?.showSuccess('Submission graded successfully!');
                    } else {
                      toast?.showError('Error: ' + result.error);
                    }
                  } catch (error) {
                    toast?.showError('Error: ' + error.message);
                  } finally {
                    setLoading(false);
                  }
                }}
                loading={loading}
              >
                {t('submit') || 'Submit'}
              </Button>
            </div>
          )}
        >
          {gradingSubmission && (
            <div style={{ padding: '1rem' }}>
              <p style={{ marginBottom: '1rem', color: '#666' }}>
                Grading submission from <strong>{users.find(u => u.docId === gradingSubmission.userId)?.displayName || gradingSubmission.userId}</strong>
              </p>
              <Input
                type="number"
                placeholder="Score"
                value={gradingScore}
                onChange={(e) => setGradingScore(e.target.value)}
                min={0}
                max={gradingSubmission.maxScore || 100}
                step="0.1"
                fullWidth
              />
            </div>
          )}
        </Modal>
        {/* Enrollments Tab */}
        {activeTab === 'enrollments' && (
          <EnrollmentManagementPage
            enrollments={enrollments}
            users={users}
            classes={classes}
            programs={programs}
            subjects={subjects}
            activities={activities}
            submissions={submissions}
            enrollmentForm={enrollmentForm}
            setEnrollmentForm={setEnrollmentForm}
            activeEnrollmentTab={activeEnrollmentTab}
            setActiveEnrollmentTab={setActiveEnrollmentTab}
            enrollmentProgramOptions={enrollmentProgramOptions}
            enrollmentSubjectOptions={enrollmentSubjectOptions}
            enrollmentClassOptions={enrollmentClassOptions}
            enrollmentProgramFilter={enrollmentProgramFilter}
            enrollmentSubjectFilter={enrollmentSubjectFilter}
            enrollmentClassFilter={enrollmentClassFilter}
            enrollmentFilterProgramOptions={enrollmentFilterProgramOptions}
            enrollmentFilterSubjectOptions={enrollmentFilterSubjectOptions}
            enrollmentFilterClassOptions={enrollmentFilterClassOptions}
            deleteModal={deleteModal}
            setDeleteModal={setDeleteModal}
            loading={loading}
            setLoading={setLoading}
            loadData={loadData}
            theme={theme}
            formatQatarDateOnly={formatQatarDateOnly}
            handleEnrollmentProgramChange={handleEnrollmentProgramChange}
            handleEnrollmentSubjectChange={handleEnrollmentSubjectChange}
            ensureString={ensureString}
          />
        )}
          {/* Grade Submission Modal */}
        <Modal
          isOpen={gradingModalOpen && !!gradingSubmission}
          onClose={() => {
            if (!loading) {
              setGradingModalOpen(false);
              setGradingSubmission(null);
              setGradingScore('');
            }
          }}
          title={t('grade_submission') || 'Grade Submission'}
          size="small"
          closeOnOverlayClick={!loading}
          footer={(
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (!loading) {
                    setGradingModalOpen(false);
                    setGradingSubmission(null);
                    setGradingScore('');
                  }
                }}
                disabled={loading}
              >
                {t('cancel') || 'Cancel'}
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={async () => {
                  if (!gradingSubmission || !gradingScore) return;
                  setLoading(true);
                  try {
                    const result = await gradeSubmission(
                      gradingSubmission.docId,
                      parseFloat(gradingScore)
                    );
                    if (result.success) {
                      await loadData();
                      setGradingModalOpen(false);
                      setGradingSubmission(null);
                      setGradingScore('');
                      toast?.showSuccess('Submission graded successfully!');
                    } else {
                      toast?.showError('Error: ' + result.error);
                    }
                  } catch (error) {
                    toast?.showError('Error: ' + error.message);
                  } finally {
                    setLoading(false);
                  }
                }}
                loading={loading}
              >
                {t('submit') || 'Submit'}
              </Button>
            </div>
          )}
        >
          {gradingSubmission && (
            <div style={{ padding: '1rem' }}>
              <p style={{ marginBottom: '1rem', color: '#666' }}>
                Grading submission from <strong>{users.find(u => u.docId === gradingSubmission.userId)?.displayName || gradingSubmission.userId}</strong>
              </p>
              <Input
                type="number"
                placeholder="Score"
                value={gradingScore}
                onChange={(e) => setGradingScore(e.target.value)}
                min={0}
                max={gradingSubmission.maxScore || 100}
                step="0.1"
                fullWidth
              />
            </div>
          )}
        </Modal>
        {activeTab === 'submissions' && (
          <SubmissionsPage
            submissions={submissions}
            activities={activities}
            users={users}
            enrollments={enrollments}
            activityFilter={activityFilter}
            setActivityFilter={setActivityFilter}
            submissionStudentFilter={submissionStudentFilter}
            setSubmissionStudentFilter={setSubmissionStudentFilter}
            submissionStatusFilter={submissionStatusFilter}
            setSubmissionStatusFilter={setSubmissionStatusFilter}
            submissionScoreFilter={submissionScoreFilter}
            setSubmissionScoreFilter={setSubmissionScoreFilter}
            gradingSubmission={gradingSubmission}
            setGradingSubmission={setGradingSubmission}
            gradingScore={gradingScore}
            setGradingScore={setGradingScore}
            gradingModalOpen={gradingModalOpen}
            setGradingModalOpen={setGradingModalOpen}
            theme={theme}
            formatDateTime={formatDateTime}
          />
        )}
        {activeTab === 'users' && (
          <UsersPage
            users={users}
            enrollments={enrollments}
            allowlist={allowlist}
            autoAddToAllowlist={autoAddToAllowlist}
            setAutoAddToAllowlist={setAutoAddToAllowlist}
            userForm={userForm}
            setUserForm={setUserForm}
            editingUser={editingUser}
            setEditingUser={setEditingUser}
            activeUserFormTab={activeUserFormTab}
            setActiveUserFormTab={setActiveUserFormTab}
            loading={loading}
            setLoading={setLoading}
            loadData={loadData}
            userToDelete={userToDelete}
            setUserToDelete={setUserToDelete}
            setShowUserDeletionModal={setShowUserDeletionModal}
            theme={theme}
          />
        )}
        {activeTab === 'resources' && (
          <ResourcesPage
            resources={resources}
            programs={programs}
            subjects={subjects}
            classes={classes}
            courses={courses}
            users={users}
            resourceForm={resourceForm}
            setResourceForm={setResourceForm}
            editingResource={editingResource}
            setEditingResource={setEditingResource}
            activeResourceFormTab={activeResourceFormTab}
            setActiveResourceFormTab={setActiveResourceFormTab}
            resourceEmailOptions={resourceEmailOptions}
            setResourceEmailOptions={setResourceEmailOptions}
            deleteModal={deleteModal}
            setDeleteModal={setDeleteModal}
            setResources={setResources}
            loadData={loadData}
            theme={theme}
            loading={loading}
            setLoading={setLoading}
            resourceProgramFilter={resourceProgramFilter}
            resourceSubjectFilter={resourceSubjectFilter}
            resourceClassFilter={resourceClassFilter}
            resourceCategoryFilter={resourceCategoryFilter}
            setResourceProgramFilter={setResourceProgramFilter}
            setResourceSubjectFilter={setResourceSubjectFilter}
            setResourceClassFilter={setResourceClassFilter}
            setResourceCategoryFilter={setResourceCategoryFilter}
            activityProgramOptions={activityProgramOptions}
            activitySubjectOptions={activitySubjectOptions}
            activityClassOptions={activityClassOptions}
            handleDropdownChange={handleDropdownChange}
            user={user}
          />
        )}
        {activeTab === 'smtp' && (
          <SMTPPage
            user={user}
            theme={theme}
          />
        )}
        {activeTab === 'categories' && (
          <CategoriesPage
            courses={courses}
            courseForm={courseForm}
            setCourseForm={setCourseForm}
            editingCourse={editingCourse}
            setEditingCourse={setEditingCourse}
            deleteModal={deleteModal}
            setDeleteModal={setDeleteModal}
            loadData={loadData}
            theme={theme}
          />
        )}
        {activeTab === 'emailTemplates' && <EmailTemplatesPage />}
        {activeTab === 'emailLogs' && <EmailLogsPage />}
        {activeTab === 'notificationLogs' && (
          <div className="notification-logs-container">
            <div className="tab-header">
              <h2>{t('notification_logs') || 'Notification Logs'}</h2>
              <div className="tooltip-wrapper">
                <InfoTooltip contentKey={`help.notification_logs`} />
              </div>
            </div>
            
            {/* Filters */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <Select
                size="small"
                searchable
                value={notificationLogFilters.trigger}
                onChange={(e) => setNotificationLogFilters(prev => ({ ...prev, trigger: e.target.value }))}
                options={[
                  { value: '', label: t('all_triggers'), icon: getColoredIcon('ui', 'filter', 16, null, theme) },
                  { value: 'activity_new', label: 'Activity New' },
                  { value: 'activity_graded', label: 'Activity Graded' },
                  { value: 'announcement_new', label: 'Announcement New' },
                  { value: 'quiz_available', label: 'Quiz Available' },
                  { value: 'attendance_recorded', label: 'Attendance Recorded' },
                  { value: 'attendance_absent', label: 'Attendance Absent' },
                  { value: 'penalty_issued', label: 'Penalty Issued' },
                  { value: 'behavior_awarded', label: 'Behavior Awarded' },
                  { value: 'participation_recorded', label: 'Participation Recorded' }
                ]}
                placeholder={t('filter_by_trigger') || 'Filter by trigger'}
              />
              
              <Select
                size="small"
                value={notificationLogFilters.channel}
                onChange={(e) => setNotificationLogFilters(prev => ({ ...prev, channel: e.target.value }))}
                options={[
                  { value: '', label: t('all_channels'), icon: getColoredIcon('ui', 'filter', 16, null, theme) },
                  { value: 'web', label: t('web') },
                  { value: 'email', label: t('email') },
                  { value: 'sms', label: t('sms') },
                  { value: 'whatsapp', label: t('whatsapp') }
                ]}
                placeholder={t('filter_by_channel') || 'Filter by channel'}
              />
              
              <DatePicker
                size="small"
                value={notificationLogFilters.startDate}
                onChange={(date) => setNotificationLogFilters(prev => ({ ...prev, startDate: date }))}
                placeholder={t('from_date') || 'From date'}
              />
              
              <DatePicker
                size="small"
                value={notificationLogFilters.endDate}
                onChange={(date) => setNotificationLogFilters(prev => ({ ...prev, endDate: date }))}
                placeholder={t('to_date') || 'To date'}
              />

              <Select
                size="small"
                value={notificationLogFilters.success}
                onChange={(e) => setNotificationLogFilters(prev => ({ ...prev, success: e.target.value }))}
                options={[
                  { value: '', label: t('all_statuses'), icon: getColoredIcon('ui', 'filter', 16, null, theme) },
                  { value: 'true', label: t('success') || 'Success' },
                  { value: 'false', label: t('failed') || 'Failed' }
                ]}
                placeholder={t('filter_by_status') || 'Filter by status'}
              />
              
              <Button
                size="small"
                onClick={() => {
                  setNotificationLogFilters({
                    trigger: '',
                    channel: '',
                    success: '',
                    startDate: null,
                    endDate: null
                  });
                  loadData();
                }}
                icon={getColoredIcon('ui', 'refresh', 16, null, theme)}
              >
                {t('reset_filters') || 'Reset Filters'}
              </Button>
            </div>
            
            {/* Notification Logs Table */}
            <AdvancedDataGrid
              data={notificationLogs}
              columns={[
                {
                  key: 'timestamp',
                  label: t('timestamp') || 'Timestamp',
                  render: (row) => formatDateTime(row.timestamp)
                },
                {
                  key: 'trigger',
                  label: t('trigger') || 'Trigger',
                  render: (row) => (
                    <Badge 
                      text={row.trigger || 'N/A'} 
                      type="info" 
                      size="small" 
                    />
                  )
                },
                {
                  key: 'userId',
                  label: t('user_id') || 'User ID',
                  render: (row) => row.userId || 'N/A'
                },
                {
                  key: 'role',
                  label: t('role') || 'Role',
                  render: (row) => (
                    <Badge 
                      text={row.role || 'N/A'} 
                      type={row.role === 'admin' ? 'error' : 'success'} 
                      size="small" 
                    />
                  )
                },
                {
                  key: 'channel',
                  label: t('channel') || 'Channel',
                  render: (row) => (
                    <Badge 
                      text={row.channel || 'N/A'} 
                      type="info" 
                      size="small" 
                    />
                  )
                },
                {
                  key: 'success',
                  label: t('status') || 'Status',
                  render: (row) => (
                    <Badge 
                      text={row.success ? t('success') || 'Success' : t('failed') || 'Failed'} 
                      type={row.success ? 'success' : 'error'} 
                      size="small" 
                    />
                  )
                },
                {
                  key: 'details',
                  label: t('details') || 'Details',
                  render: (row) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ fontSize: '0.875rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {row.details?.message || row.details?.title || 'N/A'}
                      </div>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => {
                          setSelectedNotificationLog(row);
                          setNotificationLogModalOpen(true);
                        }}
                        icon={getColoredIcon('ui', 'eye', 14, null, theme)}
                      />
                    </div>
                  )
                }
              ]}
              pagination={{
                enabled: true,
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true
              }}
              loading={loading}
              emptyMessage={t('no_notification_logs_found') || 'No notification logs found'}
              theme={theme}
            />
          </div>
        )}
        {activeTab === 'allowlist' && (
          <AllowlistPage
            allowlist={allowlist}
            setAllowlist={setAllowlist}
            handleAllowlistSave={handleAllowlistSave}
            loading={loading}
            t={t}
          />
        )}
        </div>
      </div>
      {/* Smart Email Composer Modal */}
      <SmartEmailComposer
        open={smartComposerOpen}
        onClose={() => setSmartComposerOpen(false)}
        onSend={async ({ to, subject, htmlBody, type }) => {
          try {
            // Ensure to is an array
            const recipients = Array.isArray(to) ? to : [to];
            // Validate recipients
            if (recipients.length === 0) {
              throw new Error('No recipients specified');
            }
            const result = await sendEmail({
              to: recipients,
              subject: subject || 'Newsletter',
              html: htmlBody || '<p>No content</p>',
              type: type || 'newsletter'
            });
            // Log the email attempt
            await addEmailLog({
              to: recipients,
              subject,
              type: type || 'newsletter',
              status: result.success ? 'sent' : 'failed',
              error: result.success ? null : result.error,
              sentBy: user?.uid || 'unknown'
            });
            if (!result.success) {
              logger.error('❌ Error sending email:', result.error);
              throw new Error(result.error || 'Failed to send email');
            }
            // refresh logs list if we're on the tab
            loadData();
          } catch (error) {
            logger.error('❌ Exception in onSend:', error);
            throw error;
          }
        }}
      />
      {/* Notification Log Detail Modal */}
      {notificationLogModalOpen && selectedNotificationLog && (
        <Modal
          isOpen={notificationLogModalOpen}
          onClose={() => {
            setNotificationLogModalOpen(false);
            setSelectedNotificationLog(null);
          }}
          title={t('notification_log_details') || 'Notification Log Details'}
          size="medium"
        >
          <div style={{ padding: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <strong>{t('timestamp') || 'Timestamp'}:</strong>
              <div>{formatDateTime(selectedNotificationLog.timestamp)}</div>
              
              <strong>{t('trigger') || 'Trigger'}:</strong>
              <div><Badge text={selectedNotificationLog.trigger} type="info" size="small" /></div>
              
              <strong>{t('channel') || 'Channel'}:</strong>
              <div><Badge text={selectedNotificationLog.channel} type="info" size="small" /></div>
              
              <strong>{t('user_id') || 'User ID'}:</strong>
              <div>{selectedNotificationLog.userId || 'N/A'}</div>
              
              <strong>{t('role') || 'Role'}:</strong>
              <div><Badge text={selectedNotificationLog.role} type={selectedNotificationLog.role === 'admin' ? 'error' : 'success'} size="small" /></div>
              
              <strong>{t('status') || 'Status'}:</strong>
              <div>
                <Badge 
                  text={selectedNotificationLog.success ? t('success') || 'Success' : t('failed') || 'Failed'} 
                  type={selectedNotificationLog.success ? 'success' : 'error'} 
                  size="small" 
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ marginBottom: '0.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.25rem' }}>
                {t('content_details') || 'Content Details'}
              </h4>
              <div className="detail-item" style={{ marginBottom: '0.5rem' }}>
                <strong>{t('title') || 'Title'}:</strong>
                <div style={{ padding: '0.5rem', background: theme === 'dark' ? '#333' : '#f9f9f9', borderRadius: '4px', marginTop: '0.25rem' }}>
                  {selectedNotificationLog.details?.title || 'N/A'}
                </div>
              </div>
              <div className="detail-item">
                <strong>{t('message') || 'Message'}:</strong>
                <div style={{ padding: '0.5rem', background: theme === 'dark' ? '#333' : '#f9f9f9', borderRadius: '4px', marginTop: '0.25rem', whiteSpace: 'pre-wrap' }}>
                  {selectedNotificationLog.details?.message || 'N/A'}
                </div>
              </div>
            </div>

            {selectedNotificationLog.details?.variables && Object.keys(selectedNotificationLog.details.variables).length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '0.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.25rem' }}>
                  {t('variables') || 'Variables'}
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem 1rem', padding: '0.5rem', background: theme === 'dark' ? '#333' : '#f9f9f9', borderRadius: '4px' }}>
                  {Object.entries(selectedNotificationLog.details.variables).map(([key, value]) => (
                    <React.Fragment key={key}>
                      <span style={{ fontWeight: 600, color: '#888' }}>{key}:</span>
                      <span>{String(value)}</span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            {selectedNotificationLog.details?.error && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '0.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.25rem', color: '#ef4444' }}>
                  {t('error_details') || 'Error Details'}
                </h4>
                <div style={{ padding: '0.5rem', background: '#fef2f2', color: '#991b1b', borderRadius: '4px', border: '1px solid #fee2e2' }}>
                  {selectedNotificationLog.details.error}
                </div>
              </div>
            )}

            <div className="form-actions" style={{ marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <Button onClick={() => setNotificationLogModalOpen(false)}>
                {t('close') || 'Close'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
      {/* Set Password Modal */}
      {
        showPasswordModal && passwordUser && (
          <Modal
            isOpen={showPasswordModal}
            onClose={() => { setShowPasswordModal(false); setPasswordUser(null); setNewPassword(''); }}
            title="Set User Password"
          >
            <div style={{ padding: '1rem' }}>
              <p style={{ marginBottom: '1rem', color: '#666' }}>
                Set a new password for <strong>{passwordUser.displayName || passwordUser.email}</strong>
              </p>
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (newPassword.length < 6) {
                  toast?.showError('Password must be at least 6 characters');
                  return;
                }
                try {
                  const { updatePassword } = await import('firebase/auth');
                  const { auth } = await import('@firebaseServices/config');
                  if (auth.currentUser && auth.currentUser.uid === passwordUser.docId) {
                    await updatePassword(auth.currentUser, newPassword);
                    toast?.showSuccess('Password updated successfully!');
                    setShowPasswordModal(false);
                    setPasswordUser(null);
                    setNewPassword('');
                  } else {
                    toast?.showError('Can only update password for currently logged-in user');
                  }
                } catch (error) {
                  logger.error('Error updating password:', error);
                  toast?.showError('Failed to update password: ' + error.message);
                }
              }} className="dashboard-form">
                <div className="form-row single-column">
                  <Input
                    type="password"
                    placeholder="New password (min 6 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    fullWidth
                  />
                </div>
                <div className="form-actions">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordUser(null);
                      setNewPassword('');
                    }}
                  >
                    {t('cancel') || 'Cancel'}
                  </Button>
                  <Button type="submit" variant="primary">
                    Set Password
                  </Button>
                </div>
              </form>
            </div>
          </Modal>
        )
      }
      {/* User Deletion Modal */}
      <UserDeletionModal
        open={showUserDeletionModal}
        onClose={() => {
          setShowUserDeletionModal(false);
          setUserToDelete(null);
        }}
        user={userToDelete}
        enrollments={enrollments}
        submissions={submissions}
        activities={activities}
        classes={classes}
        onConfirmDelete={async (user, relatedData, archiveUser) => {
          try {
            const userId = user.docId || user.id || user.uid;
            if (archiveUser) {
              // Archive user instead of deleting
              const { updateUser } = await import('@firebaseServices/userService');
              const { Timestamp } = await import('firebase/firestore');
              const result = await updateUser(userId, {
                archived: true,
                disabled: true,
                archivedAt: Timestamp.now()
              });
              if (result.success) {
                // Log activity
                try {
                  await logActivity(ACTIVITY_TYPES.USER_DELETED, {
                    userId: userId,
                    userEmail: user.email,
                    userDisplayName: user.displayName,
                    archived: true
                  });
                } catch (e) { }
                toast?.showSuccess(`✅ User archived successfully!`);
                await loadData();
              } else {
                throw new Error(result.error || 'Failed to archive user');
              }
            } else {
              // Delete user permanently
              // Safely access relatedData properties with defaults
              const totalRecords = (relatedData?.enrollments?.length || 0) + 
                                   (relatedData?.submissions?.length || 0) + 
                                   (relatedData?.attendance?.length || 0) + 
                                   (relatedData?.quizSubmissions?.length || 0) + 
                                   (relatedData?.quizResults?.length || 0) + 
                                   (relatedData?.marks?.length || 0);
              toast?.showInfo(`Deleting user and ${totalRecords} related records...`);
              // Use cascade delete function which handles all related data
              const { deleteUserCascade } = await import('@firebaseServices/userService');
              const result = await deleteUserCascade(userId);
              if (result.success) {
                // Log activity
                try {
                  await logActivity(ACTIVITY_TYPES.USER_DELETED, {
                    userId: userId,
                    userEmail: user.email,
                    userDisplayName: user.displayName,
                    totalRecordsRemoved: totalRecords
                  });
                } catch (e) { }
                toast?.showSuccess(`✅ User deleted successfully! Removed ${totalRecords} related records.`);
                await loadData();
              } else {
                throw new Error(result.error || 'Failed to delete user');
              }
            }
          } catch (error) {
            logger.error('Error deleting/archiving user:', error);
            toast?.showError('Failed to ' + (archiveUser ? 'archive' : 'delete') + ' user: ' + error.message);
            throw error;
          }
        }}
      />
      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <Card style={{ maxWidth: '400px', margin: '1rem' }}>
            <CardBody>
              <h3>{deleteModal.type === 'activity' ? 'Delete Activity' :
                     deleteModal.type === 'announcement' ? 'Delete Announcement' :
                     deleteModal.type === 'class' ? 'Delete Class' :
                     deleteModal.type === 'resource' ? 'Delete Resource' :
                     deleteModal.type === 'enrollment' ? 'Delete Enrollment' :
                     deleteModal.type === 'category' ? 'Delete Category' :
                     deleteModal.type === 'login_logs' ? (deleteModal.item?.filterType === 'all' ? 'Delete All Logs' : `Delete ${deleteModal.item?.filterType} Logs`) : 'Confirm Deletion'}</h3>
              <p>{deleteModal.type === 'activity' ? 'Are you sure you want to delete this activity? This will also delete all related submissions.' :
                   deleteModal.type === 'announcement' ? 'Are you sure you want to delete this announcement?' :
                   deleteModal.type === 'class' ? 'Are you sure you want to delete this class? This will also delete all enrollments and related activities.' :
                   deleteModal.type === 'resource' ? 'Are you sure you want to delete this resource?' :
                   deleteModal.type === 'enrollment' ? 'Are you sure you want to delete this enrollment?' :
                   deleteModal.type === 'category' ? 'Are you sure you want to delete this category? Activities with this category will fallback to "General".' :
                   deleteModal.type === 'login_logs' ? (deleteModal.item?.filterType === 'all' ? 
                     'Are you sure you want to delete all login logs? This action cannot be undone and will permanently remove all login activity records.' :
                     `Are you sure you want to delete all ${deleteModal.item?.description}? This action cannot be undone and will permanently remove these activity records.`) :
                   'Are you sure you want to delete this item? This action cannot be undone.'}</p>
              {deleteModal.warningMessage && (
                <p style={{ color: '#dc2626', fontSize: '0.875rem' }}>{deleteModal.warningMessage}</p>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <Button variant="outline" onClick={() => setDeleteModal({ open: false, item: null, type: null, onConfirm: null, relatedData: null, warningMessage: null })}>
                  {t('cancel') || 'Cancel'}
                </Button>
                <Button variant="primary" onClick={deleteModal.onConfirm || (() => {})} loading={loading} style={{ backgroundColor: '#dc2626' }}>
                  Delete
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
      {/* Test Email Dialog */}
      <Modal
        isOpen={testEmailDialogOpen}
        onClose={() => setTestEmailDialogOpen(false)}
        title={t('test_email_configuration') || 'Test Email Configuration'}
      >
        <div style={{ padding: '1rem' }}>
          <p style={{ marginBottom: '1rem', color: 'var(--text-muted, #666)' }}>
            {t('send_test_email_description') || 'Send a test email to verify your SMTP configuration is working correctly.'}
          </p>
          <Input
            label={t('email_address') || 'Email Address'}
            type="email"
            value={testEmailAddress}
            onChange={(e) => setTestEmailAddress(e.target.value)}
            placeholder={t('enter_email_address_test') || 'Enter email address to send test to'}
            fullWidth
            style={{ marginBottom: '1rem' }}
          />
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <Button
              variant="outline"
              onClick={() => setTestEmailDialogOpen(false)}
            >
              {t('cancel') || 'Cancel'}
            </Button>
            <Button
              variant="success"
              onClick={async () => {
                try {
                  setSmtpTesting(true);
                  const { httpsCallable } = await import('firebase/functions');
                  const { functions } = await import('@firebaseServices/config');
                  const testSMTP = httpsCallable(functions, 'testSMTP');
                  const result = await testSMTP({ to: testEmailAddress });
                  if (result.data.success) {
                    toast?.showSuccess('Test email sent! Check your inbox.');
                    setTestEmailDialogOpen(false);
                  } else {
                    toast?.showError('Test failed: ' + result.data.error);
                  }
                } catch (error) {
                  toast?.showError('Test failed: ' + (error.message || 'Unknown error'));
                } finally {
                  setSmtpTesting(false);
                }
              }}
              disabled={smtpTesting || !testEmailAddress}
            >
              {smtpTesting ? 'Sending...' : 'Send Test Email'}
            </Button>
          </div>
        </div>
      </Modal>
    </div >
  );
};
export default DashboardPage;
