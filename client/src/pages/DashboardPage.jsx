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
import { getThemedIcon } from '@constants/iconTypes';
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
import { getResources, addResource, updateResource, deleteResource } from '@firebaseServices/activityService';
import { addEmailLog, getEmailLogs } from '@firebaseServices/emailService';
import { addActivityLog } from '@firebaseServices/activityService';
import { getClasses, addClass, updateClass, deleteClass } from '@firebaseServices/classService';
import { sendEmail, getSMTPConfig, updateSMTPConfig } from '@firebaseServices/emailService';
import { getCourses, setCourse, deleteCourse } from '@firebaseServices/courseService';
import { getLoginLogs, deleteAllLoginLogs, deleteLoginLogsByType } from '@firebaseServices/activityService';
import { getAllowlist, updateAllowlist } from '@firebaseServices/configService';
import { notifyAllUsers, notifyUsersByClass } from '@firebaseServices/notificationService';
import { Loading, FancyLoading, Modal, Select, Input, Button, DatePicker, DateRangeSlider, UrlInput, Checkbox, Textarea, NumberInput, useToast, DataGrid, Tabs, AdvancedDataGrid, YearSelect, Card, CardBody, CollapsibleDashboardSection, Badge, UserSelect } from '@ui';
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
import ScheduledReportsPage from './ScheduledReportsPage';
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
      /* smtp: 'communication' - DEPRECATED */ emailTemplates: 'communication', emailLogs: 'communication',
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
    const queryParamTabs = ['activities', 'announcements', 'resources', 'users', 'allowlist', 'programs', 'subjects', 'classes', 'enrollments', 'manage-enrollments', 'marks', 'classschedule', 'hr-penalties', 'instructor-participation', 'instructor-behavior', /* 'smtp' - DEPRECATED */ 'emailTemplates', 'emailLogs', 'scheduled-reports', 'categories', 'login'];
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
        { key: 'emailLogs', label: t('notifications') },
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
        { key: 'login', label: t('logs') }
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
      const [activitiesRes, announcementsRes, usersRes, allowlistRes, classesRes, enrollmentsRes, submissionsRes, resourcesRes, loginLogsRes, coursesRes, quizzesRes, subjectsRes, programsRes] = await Promise.all([
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
        getPrograms()
      ]);
      if (activitiesRes.success) {
        logger.debug('Dashboard Debug - Raw activities data:', activitiesRes.data);
        logger.debug('Dashboard Debug - First activity sample:', activitiesRes.data[0]);
        logger.debug('Dashboard Debug - First activity createdAt:', activitiesRes.data[0]?.createdAt);
        setActivities(activitiesRes.data);
      }
      if (announcementsRes.success) setAnnouncements(announcementsRes.data);
      if (usersRes.success) setUsers(usersRes.data);
      if (allowlistRes.success) setAllowlist(allowlistRes.data);
      if (classesRes.success) {
        console.log('Dashboard Debug - Raw classes data:', classesRes.data);
        console.log('Dashboard Debug - Classes data length:', classesRes.data?.length || 0);
        console.log('Dashboard Debug - First class sample:', classesRes.data?.[0]);
        setClasses(classesRes.data || []);
      }
      if (subjectsRes.success) setSubjects(subjectsRes.data || []);
      if (programsRes.success) setPrograms(programsRes.data || []);
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
        <CollapsibleDashboardSection
          sectionId="summary-cards"
          title={t('dashboard_statistics') || 'Dashboard Statistics'}
          icon={getThemedIcon('ui', 'bar_chart', 20, theme)}
          color={theme === 'dark' ? '#818cf8' : '#6366f1'}
          defaultMode="full"
          data-tour="stats"
          compactContent={
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Select
                size="small"
                searchable
                value={enrollmentProgramFilter}
                onChange={(e) => {
                  setEnrollmentProgramFilter(e.target.value);
                  setEnrollmentSubjectFilter('all');
                  setEnrollmentClassFilter('all');
                }}
                options={[
                  { value: 'all', label: t('all_programs'), icon: getThemedIcon('ui', 'filter', 14, theme) },
                  ...programs.map(p => ({
                    value: p.docId || p.id,
                    label: p.name_en || p.name_ar || p.code || p.docId,
                    icon: getThemedIcon('ui', 'book_open', 14, theme)
                  }))
                ]}
                style={{ minWidth: 140 }}
                placeholder={t('all_programs')}
              />
            </div>
          }
        >
          <div style={{ marginBottom: '1rem' }}>
            {/* Filters */}
            <div data-tour="filters" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <Select
                size="small"
                searchable
                value={enrollmentProgramFilter}
                onChange={(e) => {
                  setEnrollmentProgramFilter(e.target.value);
                  setEnrollmentSubjectFilter('all');
                  setEnrollmentClassFilter('all');
                }}
                options={[
                  { value: 'all', label: t('all_programs'), icon: getThemedIcon('ui', 'filter', 16, theme) },
                  ...programs.map(p => ({
                    value: p.docId || p.id,
                    label: p.name_en || p.name_ar || p.code || p.docId,
                    icon: getThemedIcon('ui', 'book_open', 16, theme)
                  }))
                ]}
                style={{ minWidth: 180 }}
                placeholder={t('all_programs')}
              />
              <Select
                size="small"
                searchable
                value={enrollmentSubjectFilter}
                onChange={(e) => {
                  setEnrollmentSubjectFilter(e.target.value);
                  setEnrollmentClassFilter('all');
                }}
                options={[
                  { value: 'all', label: t('all_subjects'), icon: getThemedIcon('ui', 'filter', 16, theme) },
                  ...subjects
                    .filter(s => enrollmentProgramFilter === 'all' || s.programId === enrollmentProgramFilter)
                    .map(s => ({
                      value: s.docId || s.id,
                      label: `${s.code || ''} - ${s.name_en || s.name_ar || s.docId}`.trim(),
                      icon: getThemedIcon('ui', 'file_text', 16, theme)
                    }))
                ]}
                style={{ minWidth: 180 }}
                placeholder={t('all_subjects')}
              />
              <Select
                size="small"
                searchable
                value={enrollmentClassFilter}
                onChange={(e) => setEnrollmentClassFilter(e.target.value)}
                options={[
                  { value: 'all', label: t('all_classes'), icon: getThemedIcon('ui', 'filter', 16, theme) },
                  ...classes
                    .filter(c => {
                      if (enrollmentProgramFilter !== 'all') {
                        const subject = subjects.find(s => (s.docId || s.id) === c.subjectId);
                        return subject?.programId === enrollmentProgramFilter;
                      }
                      if (enrollmentSubjectFilter !== 'all') {
                        return c.subjectId === enrollmentSubjectFilter;
                      }
                      // Filter for instructors
                      if (isInstructor && !isAdmin && !isSuperAdmin) {
                        return c.instructorId === user.uid || c.ownerEmail === user.email || c.instructor === user.email;
                      }
                      return true;
                    })
                    .map(c => ({
                      value: c.id || c.docId,
                      label: `${c.name || c.code || c.id}${c.term ? ` (${c.term})` : ''}`,
                      icon: getThemedIcon('ui', 'users', 16, theme)
                    }))
                ]}
                style={{ minWidth: 180 }}
                placeholder={t('all_classes') || 'All Classes'}
              />
            </div>
            {/* Summary Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '0.75rem'
              }}
            >
              {[
                // Programs - Super Admin only
                ...(isSuperAdmin ? [{
                  type: 'programs',
                  value: programs.length,
                  tooltip: 'Total number of programs in the system'
                }] : []),
                // Subjects - Admin and Super Admin
                ...((isAdmin || isSuperAdmin) ? [{
                  type: 'subjects',
                  value: subjects.filter(s => {
                    if (enrollmentProgramFilter !== 'all') return s.programId === enrollmentProgramFilter;
                    return true;
                  }).length,
                  tooltip: isSuperAdmin ? 'Total number of subjects' : 'Subjects in your accessible programs'
                }] : []),
                // Classes - All roles with filtering
                {
                  type: 'classes',
                  value: classes.filter(c => {
                    if (enrollmentProgramFilter !== 'all') {
                      const subject = subjects.find(s => (s.docId || s.id) === c.subjectId);
                      return subject?.programId === enrollmentProgramFilter;
                    }
                    if (enrollmentSubjectFilter !== 'all') {
                      return c.subjectId === enrollmentSubjectFilter;
                    }
                    if (enrollmentClassFilter !== 'all') {
                      return (c.id || c.docId) === enrollmentClassFilter;
                    }
                    if (isInstructor && !isAdmin && !isSuperAdmin) {
                      return c.instructorId === user.uid || c.ownerEmail === user.email || c.instructor === user.email;
                    }
                    return true;
                  }).length,
                  tooltip: isSuperAdmin ? 'Total number of classes' : isAdmin ? 'Classes in your accessible programs' : 'Your classes'
                },
                // Enrollments
                {
                  type: 'enrollments',
                  value: enrollments.filter(e => {
                    if (enrollmentClassFilter !== 'all') {
                      return e.classId === enrollmentClassFilter;
                    }
                    if (enrollmentSubjectFilter !== 'all') {
                      const classItem = classes.find(c => (c.id || c.docId) === e.classId);
                      return classItem?.subjectId === enrollmentSubjectFilter;
                    }
                    if (enrollmentProgramFilter !== 'all') {
                      const classItem = classes.find(c => (c.id || c.docId) === e.classId);
                      const subject = subjects.find(s => (s.docId || s.id) === classItem?.subjectId);
                      return subject?.programId === enrollmentProgramFilter;
                    }
                    if (isInstructor && !isAdmin && !isSuperAdmin) {
                      const classItem = classes.find(c => (c.id || c.docId) === e.classId);
                      return classItem && (classItem.instructorId === user.uid || classItem.ownerEmail === user.email || classItem.instructor === user.email);
                    }
                    return true;
                  }).length,
                  tooltip: isSuperAdmin ? 'Total number of enrollments' : isAdmin ? 'Enrollments in your accessible programs' : 'Enrollments in your classes'
                },
                // Activities
                {
                  type: 'activities',
                  value: activities.filter(a => {
                    if (enrollmentClassFilter !== 'all') {
                      return a.classId === enrollmentClassFilter;
                    }
                    if (enrollmentSubjectFilter !== 'all') {
                      const classItem = classes.find(c => (c.id || c.docId) === a.classId);
                      return classItem?.subjectId === enrollmentSubjectFilter;
                    }
                    if (enrollmentProgramFilter !== 'all') {
                      const classItem = classes.find(c => (c.id || c.docId) === a.classId);
                      const subject = subjects.find(s => (s.docId || s.id) === classItem?.subjectId);
                      return subject?.programId === enrollmentProgramFilter;
                    }
                    if (isInstructor && !isAdmin && !isSuperAdmin) {
                      const classItem = classes.find(c => (c.id || c.docId) === a.classId);
                      return classItem && (classItem.instructorId === user.uid || classItem.ownerEmail === user.email || classItem.instructor === user.email);
                    }
                    return true;
                  }).length,
                  tooltip: isSuperAdmin ? 'Total number of activities' : isAdmin ? 'Activities in your accessible programs' : 'Activities in your classes'
                },
                // Users - Admin and Super Admin only
                ...((isAdmin || isSuperAdmin) ? [{
                  type: 'users',
                  value: users.length,
                  tooltip: 'Total number of users in the system'
                }] : []),
                // Submissions
                {
                  type: 'submissions',
                  value: submissions.filter(s => {
                    if (enrollmentClassFilter !== 'all') {
                      const activity = activities.find(a => a.id === s.activityId);
                      return activity?.classId === enrollmentClassFilter;
                    }
                    if (enrollmentSubjectFilter !== 'all') {
                      const activity = activities.find(a => a.id === s.activityId);
                      if (!activity) return false;
                      const classItem = classes.find(c => (c.id || c.docId) === activity.classId);
                      return classItem?.subjectId === enrollmentSubjectFilter;
                    }
                    if (enrollmentProgramFilter !== 'all') {
                      const activity = activities.find(a => a.id === s.activityId);
                      if (!activity) return false;
                      const classItem = classes.find(c => (c.id || c.docId) === activity.classId);
                      const subject = subjects.find(s => (s.docId || s.id) === classItem?.subjectId);
                      return subject?.programId === enrollmentProgramFilter;
                    }
                    if (isInstructor && !isAdmin && !isSuperAdmin) {
                      const activity = activities.find(a => a.id === s.activityId);
                      if (!activity) return false;
                      const classItem = classes.find(c => (c.id || c.docId) === activity.classId);
                      return classItem && (classItem.instructorId === user.uid || classItem.ownerEmail === user.email || classItem.instructor === user.email);
                    }
                    return true;
                  }).length,
                  tooltip: isSuperAdmin ? 'Total number of submissions' : isAdmin ? 'Submissions in your accessible programs' : 'Submissions from your students'
                },
                // Quizzes
                {
                  type: 'quizzes',
                  value: quizzes.length,
                  tooltip: 'Total number of quizzes. Click to view all quizzes.',
                  onClick: () => navigate('/quizzes'),
                  hoverable: true
                },
                // Announcements
                {
                  type: 'announcements',
                  value: announcements.filter(a => {
                    if (enrollmentClassFilter !== 'all') {
                      return a.classId === enrollmentClassFilter;
                    }
                    if (enrollmentSubjectFilter !== 'all') {
                      return a.subjectId === enrollmentSubjectFilter;
                    }
                    if (enrollmentProgramFilter !== 'all') {
                      return a.programId === enrollmentProgramFilter;
                    }
                    return true;
                  }).length,
                  tooltip: 'Total number of announcements'
                },
                // Resources
                {
                  type: 'resources',
                  value: resources.filter(r => {
                    // If resource has no program/subject/class, it's public and should be included
                    if (!r.programId && !r.subjectId && !r.classId) {
                      return true;
                    }
                    if (enrollmentClassFilter !== 'all') {
                      return r.classId === enrollmentClassFilter;
                    }
                    if (enrollmentSubjectFilter !== 'all') {
                      return r.subjectId === enrollmentSubjectFilter;
                    }
                    if (enrollmentProgramFilter !== 'all') {
                      return r.programId === enrollmentProgramFilter;
                    }
                    return true;
                  }).length,
                  tooltip: 'Total number of resources'
                }
              ].map((stat, idx) => {
                const config = getCardConfig(stat.type, t, theme);
                const IconComponent = config.icon;
                const borderRadius = getShapeRadius(config.shape);
                return (
                  <Card
                    key={idx}
                    padding="xs"
                    onClick={() => stat.onClick && stat.onClick()}
                    style={{ 
                      position: 'relative', 
                      overflow: 'visible',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: stat.onClick ? 'pointer' : 'default',
                      transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                      border: '2px solid transparent',
                      backgroundColor: theme === 'dark' ? 'var(--card-bg, #1f2937)' : 'var(--card-bg, #ffffff)',
                      ':hover': {
                        transform: stat.onClick ? 'translateY(-1px)' : 'none',
                        boxShadow: stat.onClick ? (theme === 'dark' ? '0 2px 6px rgba(0, 0, 0, 0.3)' : '0 2px 6px rgba(0, 0, 0, 0.08)') : 'none',
                        borderColor: config.iconColor
                      }
                    }}
                  >
                    <CardBody style={{ padding: '0.5rem', display: 'flex', flex: 1 }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        width: '100%',
                        height: '100%'
                      }}>
                        <div style={{ 
                          padding: '0.35rem', 
                          background: config.bg, 
                          borderRadius: borderRadius,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '0.1rem'
                        }}>
                          {React.cloneElement(IconComponent, { size: 16, style: { color: config.iconColor } })}
                        </div>
                        <div style={{ 
                          flex: 1, 
                          minWidth: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          height: '100%',
                          gap: '0.1rem'
                        }}>
                          <span style={{ 
                            fontSize: '0.7rem', 
                            color: theme === 'dark' ? 'var(--text-secondary, #9ca3af)' : 'var(--text-secondary, #6b7280)',
                            lineHeight: '1.1',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {config.label}
                          </span>
                          <div style={{ 
                            fontSize: '1rem', 
                            fontWeight: 700, 
                            color: config.iconColor,
                            lineHeight: '1.1'
                          }}>
                            {stat.value}
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </div>
        </CollapsibleDashboardSection>
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
            <div className="activities-tab">
              {editingActivity && (
                <div style={{ 
                  padding: '0.75rem 1rem', 
                  background: '#fef3c7', 
                  border: '1px solid #fbbf24', 
                  borderRadius: '8px', 
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  {getThemedIcon('ui', 'edit', 16, theme)} Editing Activity: {editingActivity.id} - {editingActivity.title_en}
                </div>
              )}
              {activeTab === 'analytics' && (
                <div className="analytics-tab" style={{ padding: '0.5rem' }}>
                  <DragGrid
                    storageKey="dashboard_analytics_layout"
                    widgets={[
                      { id: 'w_quizzes', title: 'Quizzes', render: () => (<div>{quizzes.length} total quizzes</div>) },
                      { id: 'w_students', title: 'Users', render: () => (<div>{users.length} users</div>) },
                      { id: 'w_classes', title: 'Classes', render: () => (<div>{classes.length} classes</div>) },
                      {
                        id: 'w_submissions', title: 'Submissions', render: () => {
                          const graded = submissions.filter(s => s.status === SUBMISSION_STATUS.GRADED).length;
                          const rate = submissions.length ? Math.round((graded / submissions.length) * 100) : 0;
                          return (
                            <div>
                              <div style={{ marginBottom: 8 }}>{submissions.length} submissions</div>
                              <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>Graded rate: {rate}%</div>
                              <div style={{ height: 8, background: '#eee', borderRadius: 6, overflow: 'hidden' }}>
                                <div style={{ width: `${rate}%`, height: '100%', background: '#10b981' }} />
                              </div>
                            </div>
                          );
                        }
                      },
                      {
                        id: 'w_ann', title: 'Announcements', render: () => {
                          const last7 = (() => { const now = Date.now(); const week = 7 * 24 * 60 * 60 * 1000; return announcements.filter(a => { const ts = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime(); return (now - ts) <= week; }).length; })();
                          return (<div>{announcements.length} total • {last7} last 7 days</div>);
                        }
                      },
                      {
                        id: 'w_activities', title: 'Activities by type', render: () => {
                          const byType = (types => types.map(t => ({ t, c: activities.filter(a => a.type === t).length })))(['training', 'homework', 'quiz']);
                          const max = Math.max(1, ...byType.map(x => x.c));
                          return (
                            <div style={{ display: 'grid', gap: 6 }}>
                              {byType.map(x => (
                                <div key={x.t} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <div style={{ width: 90, fontSize: 12, color: '#555', textTransform: 'capitalize' }}>{x.t}</div>
                                  <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 6, overflow: 'hidden' }}>
                                    <div style={{ width: `${Math.round((x.c / max) * 100)}%`, height: '100%', background: '#6366f1' }} />
                                  </div>
                                  <div style={{ width: 36, textAlign: 'right', fontSize: 12 }}>{x.c}</div>
                                </div>
                              ))}
                            </div>
                          );
                        }
                      },
                      {
                        id: 'w_classes_terms', title: 'Classes by term', render: () => {
                          const termMap = new Map();
                          classes.forEach(c => { const k = c.term || '—'; termMap.set(k, (termMap.get(k) || 0) + 1); });
                          const rows = Array.from(termMap.entries());
                          const max = Math.max(1, ...rows.map(r => r[1]));
                          return (
                            <div style={{ display: 'grid', gap: 6 }}>
                              {rows.map(([term, count]) => (
                                <div key={term} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <div style={{ width: 90, fontSize: 12, color: '#555' }}>{String(term)}</div>
                                  <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 6, overflow: 'hidden' }}>
                                    <div style={{ width: `${Math.round((count / max) * 100)}%`, height: '100%', background: '#f59e0b' }} />
                                  </div>
                                  <div style={{ width: 36, textAlign: 'right', fontSize: 12 }}>{count}</div>
                                </div>
                              ))}
                            </div>
                          );
                        }
                      },
                    ]}
                  />
                </div>
              )}
              <RibbonTabs
                categories={[
                  {
                    id: 'activity-fields',
                    items: [
                      { key: 'basic', label: t('basic_info') || 'Basic Info', icon: getThemedIcon('ui', 'file_text', 14, theme) },
                      { key: 'content', label: t('content') || 'Content', icon: getThemedIcon('ui', 'edit', 14, theme) },
                      { key: 'settings', label: t('settings') || 'Settings', icon: getThemedIcon('ui', 'settings', 14, theme) }
                    ]
                  }
                ]}
                activeCategory="activity-fields"
                activeItem={activeActivityFormTab}
                onChange={({ item }) => setActiveActivityFormTab(item)}
              />
              <form onSubmit={handleActivitySubmit} className="dashboard-form">
                {/* Basic Info Tab */}
                {activeActivityFormTab === 'basic' && (
                  <>
                    <div className="form-row">
                      <div style={{ border: '0px solid #ccc', padding: '0px', margin: '0px 0', borderRadius: '4px' }}>
                        <Select
                          searchable
                          placeholder={t('all_programs')}
                          value={activityForm.programId}
                          onChange={(value) => {
                            handleDropdownChange(
                              setActivityForm,
                              'programId',
                              ['subjectId', 'classId']
                            )(value);
                          }}
                          options={activityProgramOptions}
                          style={{ width: '100%' }}
                          icon={getThemedIcon('ui', 'filter', 16, theme)}
                        />
                      </div>
                      <Select
                        searchable
                        placeholder={t('all_subjects')}
                        value={activityForm.subjectId || null}
                        onChange={handleDropdownChange(
                          setActivityForm,
                          'subjectId',
                          ['classId']
                        )}
                        options={activitySubjectOptions}
                        style={{ width: '100%' }}
                        disabled={!activityForm.programId}
                        icon={getThemedIcon('ui', 'filter', 16, theme)}
                      />
                      <Select
                        searchable
                        placeholder={t('all_classes')}
                        value={activityForm.classId || null}
                        onChange={handleDropdownChange(
                          setActivityForm,
                          'classId'
                        )}
                        options={activityClassOptions.map(o => {
                        const classData = classes.find(c => c.docId === o.value);
                        if (!classData) return o;
                        return {
                          ...o,
                          label: `${classData.name || classData.code || 'Unnamed'}${classData.code ? ` (${classData.code})` : ''}${classData.term ? ` - ${classData.term}` : ''}${classData.year ? ` ${classData.year}` : ''}`
                        };
                      }).filter(o => !activityForm.subjectId || o.value === '' || classes.find(c => c.docId === o.value)?.subjectId === activityForm.subjectId)}
                        style={{ width: '100%' }}
                        disabled={!activityForm.subjectId}
                        icon={getThemedIcon('ui', 'filter', 16, theme)}
                      />
                    </div>
                    <div className="form-row">
                      <div>
                        <Input
                          type="text"
                          placeholder={t('activity_id') || 'Activity ID'}
                          value={activityForm.id}
                          onChange={(e) => setActivityForm({ ...activityForm, id: e.target.value })}
                          required
                          error={formErrors.id}
                        />
                      </div>
                      <Select
                        searchable
                        placeholder={t('course') || 'Course'}
                        value={activityForm.course}
                        onChange={(e) => setActivityForm({ ...activityForm, course: e.target.value })}
                        options={[
                          { value: '', label: lang === 'ar' ? 'لا يوجد فئة' : 'No Category' },
                          ...(courses && courses.length > 0 ? courses : [
                            { docId: 'programming', name_en: 'Programming', name_ar: 'البرمجة' },
                            { docId: 'computing', name_en: 'Computing', name_ar: 'الحوسبة' },
                            { docId: 'algorithm', name_en: 'Algorithm', name_ar: 'الخوارزميات' },
                            { docId: 'general', name_en: 'General', name_ar: 'عام' },
                          ]).map(c => ({
                            value: c.docId,
                            label: lang === 'ar' ? (c.name_ar || c.name_en || c.docId) : (c.name_en || c.docId)
                          }))
                        ]}
                        style={{ width: '100%' }}
                      />
                      <Select
                        searchable
                        placeholder={t('type') || 'Activity Type'}
                        value={activityForm.type}
                        onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value })}
                        options={[
                          { value: 'quiz', label: t('quiz') || 'Quiz', icon: getThemedIcon('ui', 'target', 16, theme) },
                          { value: 'homework', label: t('homework') || 'Homework', icon: getThemedIcon('ui', 'file_text', 16, theme) },
                          { value: 'training', label: t('training') || 'Training', icon: getThemedIcon('ui', 'award', 16, theme) },
                          { value: 'labandproject', label: 'Lab & Project', icon: getThemedIcon('ui', 'zap', 16, theme) }
                        ]}
                        style={{ width: '100%' }}
                      />
                      <div style={{ position: 'relative', width: '100%' }}>
                        <Select
                          searchable
                          placeholder={t('difficulty') || 'Difficulty'}
                          value={activityForm.difficulty || 'beginner'}
                          onChange={(e) => {
                            if (activityForm.quizId && !activityForm.overrideQuizSettings) {
                              toast?.showInfo?.('Difficulty is synced from quiz. Enable "Override quiz settings" to edit.');
                              return;
                            }
                            setActivityForm({ ...activityForm, difficulty: e.target.value });
                          }}
                          options={[
                            { value: 'beginner', label: t('beginner') || 'Beginner', icon: getThemedIcon('ui', 'book_open', 16, theme) },
                            { value: 'intermediate', label: t('intermediate') || 'Intermediate', icon: getThemedIcon('ui', 'target', 16, theme) },
                            { value: 'advanced', label: t('advanced') || 'Advanced', icon: getThemedIcon('ui', 'zap', 16, theme) }
                          ]}
                          style={{ width: '100%' }}
                          disabled={activityForm.quizId && !activityForm.overrideQuizSettings}
                        />
                        {activityForm.quizId && !activityForm.overrideQuizSettings && (
                          <div
                            style={{
                              position: 'absolute',
                              right: '32px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              color: '#ef4444',
                              pointerEvents: 'none',
                              zIndex: 10
                            }}
                            title="Locked - synced from quiz"
                          >
                            {getThemedIcon('ui', 'lock', 16, theme)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="form-row">
                      <div>
                        <Input
                          type="text"
                          placeholder={t('title_english') || t('title_en') || 'Title (English)'}
                          value={activityForm.title_en}
                          onChange={(e) => setActivityForm({ ...activityForm, title_en: e.target.value })}
                          required
                          error={formErrors.title_en}
                        />
                      </div>
                      <Input
                        type="text"
                        placeholder={t('title_arabic') || t('title_ar') || 'Title (Arabic)'}
                        value={activityForm.title_ar}
                        onChange={(e) => setActivityForm({ ...activityForm, title_ar: e.target.value })}
                      />
                    </div>
                  </>
                )}
                {/* Content Tab */}
                {activeActivityFormTab === 'content' && (
                  <>
                    <div className="form-row">
                      <Textarea
                        placeholder={t('description_english') || t('description_en') || 'Description (English)'}
                        value={activityForm.description_en}
                        onChange={(e) => setActivityForm({ ...activityForm, description_en: e.target.value })}
                        rows={3}
                        fullWidth
                      />
                      <Textarea
                        placeholder={t('description_arabic') || t('description_ar') || 'Description (Arabic)'}
                        value={activityForm.description_ar}
                        onChange={(e) => setActivityForm({ ...activityForm, description_ar: e.target.value })}
                        rows={3}
                        fullWidth
                      />
                    </div>
                    <div className="form-row">
                      <div>
                        <UrlInput
                          placeholder={t('activity_url_label') || 'Activity URL'}
                          value={activityForm.url}
                          onChange={(e) => setActivityForm({ ...activityForm, url: e.target.value })}
                          required={activityForm.type !== 'quiz'}
                          error={formErrors.url}
                          onOpen={(href) => window.open(href, '_blank')}
                          onCopy={() => toast?.showSuccess(t('copied') || 'Copied')}
                          onClear={() => setActivityForm({ ...activityForm, url: '' })}
                          fullWidth
                        />
                      </div>
                      <DatePicker
                        type="datetime"
                        value={activityForm.dueDate}
                        onChange={(iso) => setActivityForm({ ...activityForm, dueDate: iso })}
                        placeholder={t('pick_due_date') || 'Pick due date & time'}
                      />
                      <UrlInput
                        placeholder={t('image_url') || 'Image URL'}
                        value={activityForm.image}
                        onChange={(e) => setActivityForm({ ...activityForm, image: e.target.value })}
                        onOpen={(href) => window.open(href, '_blank')}
                        onCopy={() => toast?.showSuccess(t('copied') || 'Copied')}
                        onClear={() => setActivityForm({ ...activityForm, image: '' })}
                        fullWidth
                      />
                      <div style={{ position: 'relative', width: '100%' }}>
                        <NumberInput
                          placeholder={t('max_score') || 'Max Score'}
                          value={activityForm.maxScore || 100}
                          onChange={(e) => {
                            if (activityForm.quizId && !activityForm.overrideQuizSettings) {
                              toast?.showInfo?.('Max score is synced from quiz. Enable "Override quiz settings" to edit.');
                              return;
                            }
                            setActivityForm({ ...activityForm, maxScore: Math.max(1, Number.parseInt(e.target.value || '0', 10)) });
                          }}
                          min={1}
                          fullWidth
                          disabled={activityForm.quizId && !activityForm.overrideQuizSettings}
                        />
                        {activityForm.quizId && !activityForm.overrideQuizSettings && (
                          <span 
                            style={{ 
                              position: 'absolute',
                              right: '12px', 
                              top: '50%', 
                              transform: 'translateY(-50%)',
                              color: '#ef4444',
                              pointerEvents: 'none',
                              zIndex: 10
                            }} 
                            title="Locked - synced from quiz"
                          >
                            {getThemedIcon('ui', 'lock', 16, theme)}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Quiz Selector - Only show for quiz type */}
                    {activityForm.type === 'quiz' && (
                      <div className="form-row single-column">
                        <Select
                          searchable
                          placeholder={t('select_quiz') || 'Select Quiz (Optional)'}
                          value={activityForm.quizId || ''}
                          onChange={(e) => {
                            const selectedQuizId = e.target.value;
                            const selectedQuiz = quizzes.find(q => q.id === selectedQuizId);
                            if (selectedQuiz) {
                              const quizMaxScore = selectedQuiz.questions?.reduce((sum, q) => sum + (q.points || 1), 0) || 100;
                              const quizDifficulty = selectedQuiz.difficulty || 'beginner';
                              const quizAllowRetake = selectedQuiz.settings?.allowRetake !== undefined 
                                ? selectedQuiz.settings.allowRetake 
                                : (selectedQuiz.allowRetake !== undefined ? selectedQuiz.allowRetake : false);
                              setActivityForm(prev => ({
                                ...prev,
                                quizId: selectedQuizId,
                                ...(prev.overrideQuizSettings ? {} : {
                                  difficulty: quizDifficulty,
                                  allowRetake: quizAllowRetake,
                                  maxScore: quizMaxScore
                                })
                              }));
                            } else {
                              setActivityForm(prev => ({
                                ...prev,
                                quizId: ''
                              }));
                            }
                          }}
                          options={[
                            { value: '', label: t('select_quiz') || 'Select Quiz (Optional)' },
                            ...quizzes
                              .filter((quiz, index, self) => 
                                index === self.findIndex(q => q.id === quiz.id)
                              )
                              .filter(quiz => quiz.id)
                              .map((quiz) => ({
                                value: quiz.id,
                                label: `${quiz.title || 'Untitled Quiz'} (${quiz.questions?.length || quiz.questionCount || 0} questions)`
                              }))
                          ]}
                          style={{ width: '100%' }}
                        />
                        {activityForm.quizId && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: '#f0f8ff', borderRadius: '6px' }}>
                            <ToggleSwitch
                              label="Override quiz settings (retake, difficulty, total marks)"
                              checked={activityForm.overrideQuizSettings || false}
                              onChange={(checked) => {
                                setActivityForm(prev => {
                                  if (!checked && prev.quizId) {
                                    const selectedQuiz = quizzes.find(q => q.id === prev.quizId);
                                    if (selectedQuiz) {
                                      const quizMaxScore = selectedQuiz.questions?.reduce((sum, q) => sum + (q.points || 1), 0) || 100;
                                      const quizDifficulty = selectedQuiz.difficulty || 'beginner';
                                      const quizAllowRetake = selectedQuiz.settings?.allowRetake !== undefined 
                                        ? selectedQuiz.settings.allowRetake 
                                        : (selectedQuiz.allowRetake !== undefined ? selectedQuiz.allowRetake : false);
                                      return {
                                        ...prev,
                                        overrideQuizSettings: false,
                                        difficulty: quizDifficulty,
                                        allowRetake: quizAllowRetake,
                                        maxScore: quizMaxScore
                                      };
                                    }
                                  }
                                  return { ...prev, overrideQuizSettings: checked };
                                });
                              }}
                            />
                            {!activityForm.overrideQuizSettings && (
                              <span style={{ fontSize: '0.75rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                {getThemedIcon('ui', 'lock', 12, theme)} Synced from quiz
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
                {/* Settings Tab */}
                {activeActivityFormTab === 'settings' && (
                  <>
                    <div className="form-row compact-cols">
                      <ToggleSwitch
                        label={t('show_to_students') || 'Show to students'}
                        checked={activityForm.show}
                        onChange={(checked) => setActivityForm({ ...activityForm, show: checked })}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ToggleSwitch
                          label={t('allow_retakes') || 'Allow retakes'}
                          checked={activityForm.allowRetake || false}
                          onChange={(checked) => {
                            if (activityForm.quizId && !activityForm.overrideQuizSettings) {
                              toast?.showInfo?.('Allow retakes is synced from quiz. Enable "Override quiz settings" to edit.');
                              return;
                            }
                            setActivityForm({ ...activityForm, allowRetake: checked });
                          }}
                          disabled={activityForm.quizId && !activityForm.overrideQuizSettings}
                        />
                        {activityForm.quizId && !activityForm.overrideQuizSettings && (
                          <span 
                            style={{ color: '#ef4444', flexShrink: 0 }} 
                            title="Locked - synced from quiz"
                          >
                            {getThemedIcon('ui', 'lock', 14, theme)}
                          </span>
                        )}
                      </div>
                      <ToggleSwitch
                        label={t('featured') || 'Featured'}
                        checked={activityForm.featured}
                        onChange={(checked) => setActivityForm({ ...activityForm, featured: checked })}
                      />
                      <ToggleSwitch
                        label={t('optional') || 'Optional (if off: Required)'}
                        checked={activityForm.optional}
                        onChange={(checked) => setActivityForm({ ...activityForm, optional: checked })}
                      />
                      <ToggleSwitch
                        label={t('requires_submission') || 'Requires Submission'}
                        checked={activityForm.requiresSubmission}
                        onChange={(checked) => setActivityForm({ ...activityForm, requiresSubmission: checked })}
                      />
                    </div>
                    {/* Email Notification Options */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '0.75rem',
                      padding: '1rem',
                      background: '#f0f8ff',
                      borderRadius: '8px',
                      border: '2px solid var(--color-primary, #800020)'
                    }}>
                      <ToggleSwitch
                        label={t('send_email_to_students') || 'Send email to students'}
                        checked={emailOptions.sendEmail}
                        onChange={(checked) => setEmailOptions({ ...emailOptions, sendEmail: checked })}
                      />
                      <ToggleSwitch
                        label={t('create_announcement') || 'Create announcement'}
                        checked={emailOptions.createAnnouncement}
                        onChange={(checked) => setEmailOptions({ ...emailOptions, createAnnouncement: checked })}
                      />
                      {emailOptions.sendEmail && (
                    <div>
                      <small>{t('language') || 'Language'}</small>
                      <Select
                        searchable
                        placeholder={t('language') || 'Language'}
                        value={emailOptions.emailLang}
                        onChange={(e) => setEmailOptions({ ...emailOptions, emailLang: e.target.value })}
                        options={[
                          { value: 'en', label: lang === 'ar' ? 'الإنجليزية' : 'English' },
                          { value: 'ar', label: lang === 'ar' ? 'العربية' : 'Arabic' },
                          { value: 'both', label: lang === 'ar' ? 'ثنائي اللغة' : 'Bilingual' }
                        ]}
                      />
                    </div>
                  )}
                </div>
                {/* Form Actions - Show on all tabs */}
                <div className="form-actions">
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      {activeActivityFormTab !== 'basic' && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            if (activeActivityFormTab === 'settings') {
                              setActiveActivityFormTab('content');
                            } else if (activeActivityFormTab === 'content') {
                              setActiveActivityFormTab('basic');
                            }
                          }}
                        >
                          ← Previous
                        </Button>
                      )}
                      {activeActivityFormTab !== 'settings' && (
                        <Button 
                          type="button" 
                          variant="secondary"
                          onClick={() => {
                            if (activeActivityFormTab === 'basic') {
                              setActiveActivityFormTab('content');
                            } else if (activeActivityFormTab === 'content') {
                              setActiveActivityFormTab('settings');
                            }
                          }}
                        >
                          Next →
                        </Button>
                      )}
                      {activeActivityFormTab === 'settings' && (
                        <Button type="submit" variant="primary" loading={loading}>
                          {(editingActivity ? (t('update') || 'Update') : (t('save') || 'Save'))}
                        </Button>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setEditingActivity(null);
                          setActivityForm({
                            id: '', title_en: '', title_ar: '', description_en: '', description_ar: '',
                            type: 'homework', classId: '', difficulty: 'easy', maxScore: 100,
                            allowRetake: false, dueDate: null, show: true, quizId: '',
                            overrideQuizSettings: false
                          });
                          setActiveActivityFormTab('basic');
                        }}
                      >
                        {t('cancel') || 'Cancel'}
                      </Button>
                    </div>
                  </div>
                </div>
                  </>
                )}
              </form>
              <div style={{ marginTop: '1rem' }}>
                <AdvancedDataGrid
                  rows={activities.filter(a => {
                    if (enrollmentClassFilter !== 'all') {
                      return a.classId === enrollmentClassFilter;
                    }
                    if (enrollmentSubjectFilter !== 'all') {
                      const classItem = classes.find(c => (c.id || c.docId) === a.classId);
                      return classItem?.subjectId === enrollmentSubjectFilter;
                    }
                    if (enrollmentProgramFilter !== 'all') {
                      const classItem = classes.find(c => (c.id || c.docId) === a.classId);
                      const subject = subjects.find(s => (s.docId || s.id) === classItem?.subjectId);
                      return subject?.programId === enrollmentProgramFilter;
                    }
                    return true;
                  })}
                getRowId={(row) => row.docId || row.id}
                columns={[
                  { field: 'id', headerName: t('id_col'), width: 90 },
                  { field: 'title_en', headerName: t('title_en_col'), flex: 1, minWidth: 160 },
                  {
                    field: 'programId',
                    headerName: t('program') || 'Program',
                    width: 150,
                    valueGetter: (params) => {
                      const row = params?.row || {};
                      return row.programId || row.program || params?.value || null;
                    },
                    renderCell: (params) => {
                      const programId = params.value || params.row?.programId || params.row?.program;
                      if (!programId) return (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted, #6b7280)' }}>
                          {getThemedIcon('ui', 'archive', 16, theme)} General
                        </span>
                      );
                      const program = programs.find(p => (p.docId || p.id) === programId);
                      if (!program) return '—';
                      const programName = lang === 'ar' ? (program.name_ar || program.name_en) : (program.name_en || program.name_ar);
                      return (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {getThemedIcon('ui', 'target', 16, theme)} {programName}
                        </span>
                      );
                    }
                  },
                  {
                    field: 'subjectId',
                    headerName: t('subject') || 'Subject',
                    width: 150,
                    valueGetter: (params) => {
                      const row = params?.row || {};
                      return row.subjectId || row.subject || params?.value || null;
                    },
                    renderCell: (params) => {
                      const subjectId = params.value || params.row?.subjectId || params.row?.subject;
                      if (!subjectId) return (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted, #6b7280)' }}>
                          {getThemedIcon('ui', 'book_open', 16, theme)} General
                        </span>
                      );
                      const subject = subjects.find(s => (s.docId || s.id) === subjectId);
                      if (!subject) return '—';
                      const subjectName = lang === 'ar' ? (subject.name_ar || subject.name_en) : (subject.name_en || subject.name_ar);
                      return (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {getThemedIcon('ui', 'book_open', 16, theme)} {subjectName}
                        </span>
                      );
                    }
                  },
                  { 
                    field: 'classId', 
                    headerName: t('class_col') || 'Class', 
                    width: 180,
                    renderCell: (params) => {
                      if (!params.value) return (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted, #6b7280)' }}>
                          {getThemedIcon('ui', 'users', 16, theme)} General
                        </span>
                      );
                      const classItem = classes.find(c => (c.docId || c.id) === params.value);
                      if (!classItem) return params.value;
                      return (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {getThemedIcon('ui', 'users', 16, theme)} {classItem.name}{classItem.code ? ` (${classItem.code})` : ''}
                        </span>
                      );
                    }
                  },
                  { field: 'course', headerName: t('course_col') || 'Course', width: 140 },
                  { 
                    field: 'type', 
                    headerName: t('type_col') || 'Type', 
                    width: 140,
                    valueGetter: (params) => {
                      const row = params?.row || {};
                      return row.type || params?.value || null;
                    },
                    renderCell: (params) => {
                      const type = params.value || params.row?.type;
                      if (!type) return '—';
                      const typeMap = {
                        'quiz': { icon: getThemedIcon('ui', 'target', 16, theme), text: 'Quiz' },
                        'homework': { icon: getThemedIcon('ui', 'home', 16, theme), text: 'Homework' },
                        'training': { icon: getThemedIcon('ui', 'target', 16, theme), text: 'Training' }
                      };
                      const typeConfig = typeMap[type] || { icon: getThemedIcon('ui', 'file_text', 16, theme), text: type };
                      return (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {typeConfig.icon} {typeConfig.text}
                        </span>
                      );
                    }
                  },
                  { 
                    field: 'difficulty', 
                    headerName: t('difficulty_col'), 
                    width: 140,
                    renderCell: (params) => {
                      const difficulty = params.value;
                      if (!difficulty) return '—';
                      const difficultyMap = {
                        'easy': { icon: getThemedIcon('ui', 'check_circle', 16, theme), text: 'Easy' },
                        'medium': { icon: getThemedIcon('ui', 'alert_triangle', 16, theme), text: 'Medium' },
                        'hard': { icon: getThemedIcon('ui', 'x_circle', 16, theme), text: 'Hard' }
                      };
                      const difficultyConfig = difficultyMap[difficulty.toLowerCase()] || { icon: getThemedIcon('ui', 'info', 16, theme), text: difficulty };
                      return (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {difficultyConfig.icon} {difficultyConfig.text}
                        </span>
                      );
                    }
                  },
                  {
                    field: 'maxScore',
                    headerName: t('max_score') || 'Max Score',
                    width: 120,
                    renderCell: (params) => params.value || '—'
                  },
                  {
                    field: 'allowRetake',
                    headerName: t('allow_retakes') || 'Retake',
                    width: 100,
                    renderCell: (params) => (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                        {params.value ? 
                          <>{getThemedIcon('ui', 'check_circle', 16, theme)} Yes</> : 
                          <>{getThemedIcon('ui', 'x_circle', 16, theme)} No</>
                        }
                      </span>
                    )
                  },
                  {
                    field: 'quizId',
                    headerName: t('quiz') || 'Quiz',
                    width: 200,
                    valueGetter: (params) => {
                      const row = params?.row || {};
                      return row.quizId || row.quiz || params?.value || null;
                    },
                    renderCell: (params) => {
                      const quizId = params.value || params.row?.quizId || params.row?.quiz;
                      if (!quizId) return '—';
                      const quiz = quizzes.find(q => q.id === quizId);
                      return quiz ? (quiz.title || 'Untitled Quiz') : quizId;
                    }
                  },
                  {
                    field: 'dueDate', headerName: t('assignment_due_date_col'), flex: 1, minWidth: 200,
                    valueGetter: (params) => params.value,
                    renderCell: (params) => (params.value ? formatDateTime(params.value) : (t('no_deadline_set') || 'No deadline set'))
                  },
                  {
                    field: 'createdAt', headerName: 'Created Date', width: 180,
                    valueGetter: (params) => params.value,
                    renderCell: (params) => {
                      if (!params.value) return 'Unknown';
                      // Log the raw value for debugging
                      logger.debug('Activities Date Debug - Raw params.value:', params.value);
                      logger.debug('Activities Date Debug - Type:', typeof params.value);
                      logger.debug('Activities Date Debug - Has toDate:', typeof params.value?.toDate);
                      let date;
                      if (params.value?.toDate) {
                        date = params.value.toDate();
                        logger.debug('Activities Date Debug - Using toDate():', date);
                      } else if (params.value?.seconds) {
                        date = new Date(params.value.seconds * 1000);
                        logger.debug('Activities Date Debug - Using seconds:', params.value.seconds, '-> date:', date);
                      } else if (typeof params.value === 'string' || typeof params.value === 'number') {
                        date = new Date(params.value);
                        logger.debug('Activities Date Debug - Using new Date():', date);
                      } else {
                        date = new Date(params.value);
                        logger.debug('Activities Date Debug - Fallback new Date():', date);
                      }
                      logger.debug('Activities Date Debug - Final date:', date, 'isValid:', !isNaN(date.getTime()));
                      if (isNaN(date.getTime())) {
                        return 'Invalid Date';
                      }
                      return formatQatarDate(date);
                    }
                  },
                  {
                    field: 'show', headerName: t('visible') || 'Visible', width: 120,
                    renderCell: (params) => (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                        {params.value ? 
                          <>{getThemedIcon('ui', 'eye', 16, theme)} {t('yes') || 'Yes'}</> : 
                          <>{getThemedIcon('ui', 'eye_off', 16, theme)} {t('no') || 'No'}</>
                        }
                      </span>
                    )
                  },
                  {
                    field: 'actions', headerName: t('actions') || 'Actions', width: 200, sortable: false, filterable: false,
                    renderCell: (params) => (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button size="sm" variant="ghost" className="editHover" icon={getThemedIcon('ui', 'edit', 16, theme)} onClick={() => handleEditActivity(params.row)}>
                          {t('edit') || 'Edit'}
                        </Button>
                        <Button size="sm" variant="ghost" className="deleteHover" icon={getThemedIcon('ui', 'trash', 16, theme)} style={{ color: '#dc2626' }} onClick={() => {
                          setDeleteModal({
                            open: true,
                            item: params.row,
                            type: 'activity',
                            onConfirm: async () => {
                              const activity = params.row;
                              setActivities(prev => prev.filter(a => (a.docId || a.id) !== (activity.docId || activity.id)));
                              try {
                                const result = await deleteActivity(activity.docId);
                                if (result.success) {
                                  // Log activity
                                  try {
                                    await logActivity(ACTIVITY_TYPES.ACTIVITY_DELETED, {
                                      activityId: activity.docId,
                                      activityTitle: activity.title_en || activity.title,
                                      activityType: activity.type
                                    });
                                  } catch (e) { }
                                  toast?.showSuccess('Activity deleted successfully!');
                                  await loadData();
                                  setDeleteModal({ open: false, item: null, type: null, onConfirm: null });
                                } else {
                                  setActivities(prev => [...prev, activity].sort((a, b) => a.order - b.order));
                                  toast?.showError('Error deleting activity: ' + result.error);
                                  setDeleteModal({ open: false, item: null, type: null, onConfirm: null });
                                }
                              } catch (error) {
                                setActivities(prev => [...prev, activity].sort((a, b) => a.order - b.order));
                                toast?.showError('Error deleting activity: ' + error.message);
                                setDeleteModal({ open: false, item: null, type: null, onConfirm: null });
                              }
                            }
                          });
                        }}>
                          Delete
                        </Button>
                      </div>
                    )
                  }
                ]}
                pageSize={10}
                pageSizeOptions={[10, 20, 50, 100]}
                checkboxSelection
                exportFileName="activities"
                showExportButton
                exportLabel={t('export') || 'Export'}
                loadingOverlayMessage={loading ? "Loading..." : undefined} fancyVariant="dots"
              />
              </div>
            </div>
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
        {activeTab === 'emailTemplates' && (
          <div className="email-templates-tab">
            <FancyLoading />
            <EmailTemplates />
          </div>
        )}
        {activeTab === 'emailLogs' && <EmailLogsPage />}
        {activeTab === 'allowlist' && (
          <div className="allowlist-tab">
            <EmailManager
              emails={allowlist.allowedEmails || []}
              onEmailsChange={(emails) => setAllowlist({ ...allowlist, allowedEmails: emails })}
              title={t('student_emails')}
              placeholder="student@example.edu"
              description={t('students_can_register')}
              excludeEmails={allowlist.adminEmails || []}
              excludeMessage="This email is already in the admin list"
            />
            <EmailManager
              emails={allowlist.adminEmails || []}
              onEmailsChange={(emails) => setAllowlist({ ...allowlist, adminEmails: emails })}
              title={t('admin_emails')}
              placeholder="admin@example.edu"
              description={t('admins_get_privileges')}
              excludeEmails={allowlist.allowedEmails || []}
              excludeMessage="This email is already in the student list"
            />
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <button onClick={handleAllowlistSave} className="submit-btn" disabled={loading} style={{ position: 'relative', opacity: loading ? 0.7 : 1 }}>
                {loading && <span style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>⏳</span>}
                <span style={{ opacity: loading ? 0 : 1 }}>{t('save') + ' Allowlist Changes'}</span>
              </button>
            </div>
          </div>
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
