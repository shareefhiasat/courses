import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Navigate, useLocation } from 'react-router-dom';
import {
  getActivities, addActivity, updateActivity, deleteActivity,
  getAnnouncements, addAnnouncement, updateAnnouncement, deleteAnnouncement,
  getUsers, addUser, updateUser, deleteUser,
  getClasses, addClass, updateClass, deleteClass,
  getEnrollments, addEnrollment, deleteEnrollment,
  getSubmissions, gradeSubmission, deleteSubmission,
  getResources, addResource, updateResource, deleteResource,
  addEmailLog, getEmailLogs, addActivityLog,
  sendEmail,
  getSMTPConfig,
  updateSMTPConfig,
  deleteEmailLog
} from '../firebase/firestore';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getLoginLogs, getCourses, setCourse, deleteCourse, getAllowlist, updateAllowlist } from '../firebase/firestore';
import { notifyAllUsers, notifyUsersByClass } from '../firebase/notifications';
import { Loading, Modal, Select, Input, Button, DatePicker, DateRangeSlider, UrlInput, Checkbox, Textarea, NumberInput, useToast, DataGrid, Tabs, AdvancedDataGrid, YearSelect, Card, CardBody } from '../components/ui';
import InfoTooltip from '../components/ui/InfoTooltip/InfoTooltip';
import { getCardConfig, getShapeRadius } from '../utils/cardColors';
import RibbonTabs from '../components/RibbonTabs';
import DragGrid from '../components/DragGrid';
import EmailManager from '../components/EmailManager';
import EmailComposer from '../components/EmailComposer';
import SmartEmailComposer from '../components/SmartEmailComposer';
import UserDeletionModal from '../components/UserDeletionModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import EmailSettings from '../components/EmailSettings';
import EmailTemplates from '../components/EmailTemplates';
import EmailLogs from '../components/EmailLogs';
import ProgramsManagementPage from './ProgramsManagementPage';
import SubjectsManagementPage from './SubjectsManagementPage';
import MarksEntryPage from './MarksEntryPage';
import ClassSchedulePage from './ClassSchedulePage';
import ManageEnrollmentsPage from './ManageEnrollmentsPage';
import HRPenaltiesPage from './HRPenaltiesPage';
import InstructorParticipationPage from './InstructorParticipationPage';
import InstructorBehaviorPage from './InstructorBehaviorPage';
import ScheduledReportsPage from './ScheduledReportsPage';
import { getSubjects, getPrograms } from '../firebase/programs';
import { logActivity, ACTIVITY_TYPES } from '../firebase/activityLogger';
import './DashboardPage.css';
import { FileSignature, Mail, BarChart3, Edit, Trash, RefreshCw, UserCheck, UserX, Lock } from 'lucide-react';
import { formatDateTime } from '../utils/date';
import { formatQatarDate, formatQatarDateOnly } from '../utils/timezone';
import { useLang } from '../contexts/LangContext';
// DateTimePicker and ToggleSwitch replaced with UI library DatePicker and checkbox
// import DateTimePicker from '../components/DateTimePicker';
// import ToggleSwitch from '../components/ToggleSwitch';
import ToggleSwitch from '../components/ToggleSwitch';

const DashboardPage = () => {
  const { user, isAdmin, isSuperAdmin, isInstructor, loading: authLoading, impersonateUser } = useAuth();
  const { lang, setLang, t } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const uiToast = useToast();
  const toast = {
    showSuccess: uiToast.success,
    showError: uiToast.error,
    showInfo: uiToast.info,
  };
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
      smtp: 'communication', newsletter: 'communication', emailTemplates: 'communication', emailLogs: 'communication',
      categories: 'settings', login: 'settings'
    };
    return map[localStorage.getItem('dashboardActiveTab') || 'activities'] || 'content';
  });
  const [loading, setLoading] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [announcementFilter, setAnnouncementFilter] = useState('all');
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState('all');
  const [activityFilter, setActivityFilter] = useState('all');
  const [submissionStudentFilter, setSubmissionStudentFilter] = useState('all');
  const [submissionScoreFilter, setSubmissionScoreFilter] = useState('all');
  const [emailComposerOpen, setEmailComposerOpen] = useState(false);
  const [userQuickFilter, setUserQuickFilter] = useState('all');
  const [activityAutoRefreshMs, setActivityAutoRefreshMs] = useState(0);
  const [activityLastUpdatedAt, setActivityLastUpdatedAt] = useState(Date.now());
  const [activityNowTick, setActivityNowTick] = useState(Date.now());

  const handleTabChange = (tab) => {
    // Check if this tab has a path (external navigation)
    const tabItem = ribbonCategories
      .flatMap(cat => cat.items)
      .find(item => item.key === tab);
    
    if (tabItem?.path) {
      // Navigate to external page
      navigate(tabItem.path);
      return;
    }
    
    setActiveTab(tab);
    localStorage.setItem('dashboardActiveTab', tab);
    setHashProcessed(false); // Reset hash processed flag when tab changes manually
    // Update URL hash if it's a hash-navigable tab
    const tabToHashMap = {
      'programs': '#programs',
      'subjects': '#subjects',
      'classes': '#classes',
      'manage-enrollments': '#enrollments',
      'marks': '#marks',
      'class-schedule': '#class-schedule'
    };
    if (tabToHashMap[tab]) {
      window.history.replaceState(null, '', `${location.pathname}${tabToHashMap[tab]}`);
    } else {
      // Clear hash for tabs that don't use hash navigation
      if (location.hash) {
        window.history.replaceState(null, '', location.pathname);
      }
    }
  };

  // Listen for external tab change events (from sidebar)
  useEffect(() => {
    const handleTabChangeEvent = (e) => {
      if (e.detail?.tab) {
        setActiveTab(e.detail.tab);
        localStorage.setItem('dashboardActiveTab', e.detail.tab);
      }
    };
    window.addEventListener('dashboard-tab-change', handleTabChangeEvent);
    return () => window.removeEventListener('dashboard-tab-change', handleTabChangeEvent);
  }, []);

  const ribbonCategories = [
    {
      key: 'content', label: 'Content', items: [
        { key: 'activities', label: t('activities') },
        { key: 'announcements', label: t('announcements') },
        { key: 'resources', label: t('resources') },
      ]
    },
    {
      key: 'users', label: 'Users', items: [
        { key: 'users', label: t('users') },
        { key: 'allowlist', label: t('allowlist') },
      ]
    },
    {
      key: 'academic', label: 'Academic', items: [
        { key: 'programs', label: 'Programs' },
        { key: 'subjects', label: 'Subjects' },
        { key: 'classes', label: t('classes') },
        { key: 'enrollments', label: t('enrollments') },
        { key: 'manage-enrollments', label: 'Manage Enrollments' },
        { key: 'marks', label: 'Marks Entry' },
        { key: 'class-schedule', label: t('class_schedules') || 'Class Schedule' },
        { key: 'hr-penalties', label: 'HR Penalties' },
        { key: 'instructor-participation', label: 'Participation' },
        { key: 'instructor-behavior', label: 'Behavior' },
        // { key: 'submissions', label: t('submissions') }, // Disabled - not completed yet
      ]
    },
    {
      key: 'communication', label: 'Communication', items: [
        { key: 'smtp', label: t('smtp') },
        { key: 'newsletter', label: t('newsletter') },
        { key: 'emailTemplates', label: 'Templates' },
        { key: 'emailLogs', label: 'Logs' },
        { key: 'scheduled-reports', label: 'Scheduled Reports' },
      ]
    },
    {
      key: 'settings', label: 'Settings', items: [
        { key: 'categories', label: t('categories') },
        { key: 'login', label: 'Activity' },
      ]
    },
  ];

  // Load email logs when newsletter tab is opened
  useEffect(() => {
    const loadLogs = async () => {
      const res = await getEmailLogs();
      if (res.success) setEmailLogs(res.data || []);
    };
    if (activeTab === 'newsletter') loadLogs();
  }, [activeTab]);

  // Auto-refresh for Activity tab
  useEffect(() => {
    if (!activityAutoRefreshMs || activeTab !== 'login') return;
    const id = setInterval(() => {
      loadData();
      setActivityLastUpdatedAt(Date.now());
    }, activityAutoRefreshMs);
    return () => clearInterval(id);
  }, [activityAutoRefreshMs, activeTab]);

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
  const handleEditActivity = (activity) => {
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
    console.log('Editing activity:', activity);
    console.log('Form data:', formData);
    setActivityForm(formData);
  };

  const handleCancelEdit = () => {
    setEditingActivity(null);
    setActivityForm({
      id: '', title_en: '', title_ar: '', description_en: '', description_ar: '',
      course: 'python', type: 'quiz', difficulty: 'beginner', url: '', dueDate: '',
      image: '', order: 0, show: true, allowRetake: false, classId: '', programId: '', subjectId: '',
      featured: false, optional: false, quizId: '', requiresSubmission: false, maxScore: 10, overrideQuizSettings: false
    });
    setFormErrors({});
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
  // Smart email composer
  const [smartComposerOpen, setSmartComposerOpen] = useState(false);
  // User deletion modal
  const [userToDelete, setUserToDelete] = useState(null);
  const [showUserDeletionModal, setShowUserDeletionModal] = useState(false);
  // Delete confirmation modal
  const [deleteModal, setDeleteModal] = useState({ open: false, item: null, type: null, onConfirm: null, relatedData: null, warningMessage: null });

  // Derived: filtered activity logs
  const filteredLoginLogs = () => {
    const q = (loginSearch || '').trim().toLowerCase();
    let list = loginLogs.slice();

    // Filter by activity type
    if (activityTypeFilter !== 'all') {
      list = list.filter(l => l.type === activityTypeFilter);
    }

    if (q) {
      list = list.filter(l =>
        (l.email || '').toLowerCase().includes(q) ||
        (l.displayName || '').toLowerCase().includes(q) ||
        (l.userAgent || '').toLowerCase().includes(q) ||
        (l.type || '').toLowerCase().includes(q)
      );
    }
    if (loginUserFilter !== 'all') {
      list = list.filter(l => (l.email || l.userId) === loginUserFilter);
    }
    const parseDDMM = (s) => {
      try {
        const [dd, mm, yyyy] = (s || '').split('/');
        if (!dd || !mm || !yyyy) return NaN;
        return new Date(`${yyyy}-${mm}-${dd}T00:00:00`).getTime();
      } catch { return NaN; }
    };
    if (loginFrom) {
      const fromDate = parseDDMM(loginFrom);
      list = list.filter(l => {
        const logDate = l.when?.seconds ? l.when.seconds * 1000 : new Date(l.when).getTime();
        return logDate >= fromDate;
      });
    }
    if (loginTo) {
      const toDate = parseDDMM(loginTo);
      list = list.filter(l => {
        const logDate = l.when?.seconds ? l.when.seconds * 1000 : new Date(l.when).getTime();
        return logDate <= toDate;
      });
    }
    return list;
  };

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      if (activityFilter !== 'all' && s.activityId !== activityFilter) return false;
      if (submissionStudentFilter !== 'all' && s.userId !== submissionStudentFilter) return false;

      if (submissionStatusFilter !== 'all') {
        const status = s.status || 'submitted';
        if (submissionStatusFilter === 'pending') {
          if (!(status === 'pending' || status === 'submitted')) return false;
        } else if (submissionStatusFilter === 'graded') {
          if (status !== 'graded') return false;
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
        console.log('Today filter:', createdAt.toDateString(), 'vs', now.toDateString(), '=', isToday);
        return isToday;
      case '7days':
        const daysDiff = (now - createdAt) / (24 * 60 * 60 * 1000);
        const isWithin7Days = daysDiff <= 7;
        console.log('7 days filter:', daysDiff, 'days ago, within 7?', isWithin7Days);
        return isWithin7Days;
      case '30days':
        const daysDiff30 = (now - createdAt) / (24 * 60 * 60 * 1000);
        const isWithin30Days = daysDiff30 <= 30;
        console.log('30 days filter:', daysDiff30, 'days ago, within 30?', isWithin30Days);
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
    target: 'global'
  });
  const [announcementEmailOptions, setAnnouncementEmailOptions] = useState({ sendEmail: false, lang: 'both' });
  const [resourceEmailOptions, setResourceEmailOptions] = useState({ sendEmail: false, createAnnouncement: false });

  const [classForm, setClassForm] = useState({ id: '', name: '', nameAr: '', code: '', term: '', ownerEmail: '', subjectId: '' });
  const [subjects, setSubjects] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [enrollmentForm, setEnrollmentForm] = useState({ 
    userId: '', 
    classId: '', 
    role: 'student', 
    programId: '', 
    subjectId: '' 
  });
  
  // Enrollment form change handlers (normalize both raw values and events)
  const handleEnrollmentProgramChange = (eventOrValue) => {
    const value = eventOrValue && eventOrValue.target ? eventOrValue.target.value : eventOrValue;
    const newProgramId = value != null ? String(value) : '';
    console.log('🔄 [Enrollment Form] Program changed:', newProgramId);
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
    console.log('🔄 [Enrollment Form] Subject changed:', newSubjectId);
    setEnrollmentForm(prev => ({
      ...prev,
      subjectId: newSubjectId,
      classId: ''
    }));
  };
  const [enrollmentProgramFilter, setEnrollmentProgramFilter] = useState('all');
  const [enrollmentSubjectFilter, setEnrollmentSubjectFilter] = useState('all');
  const [enrollmentClassFilter, setEnrollmentClassFilter] = useState('all');
  const [userForm, setUserForm] = useState({ email: '', displayName: '', role: 'student' });
  const [autoAddToAllowlist, setAutoAddToAllowlist] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [editingClass, setEditingClass] = useState(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [editingResource, setEditingResource] = useState(null);

  const [resourceForm, setResourceForm] = useState({
    title: '',
    description: '',
    url: '',
    type: 'link',
    dueDate: '',
    optional: false,
    featured: false
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
    console.log(`🔄 [Dropdown] ${field} changed:`, value);
    
    setter(prev => {
      const update = { 
        ...prev, 
        [field]: value || ''
      };
      
      // Reset dependent fields if needed
      resetFields.forEach(f => { 
        console.log(`  ↳ Resetting dependent field: ${f}`);
        update[f] = ''; 
      });
      
      console.log(`  ↳ New state for ${field}:`, update[field]);
      return update;
    });
  };

  // Activity Form - Program Options
  const activityProgramOptions = useMemo(() => {
    const opts = [
      { value: '', label: t('select_program') || 'Select Program' }
    ];
    const validPrograms = programs
      .filter(prog => prog.docId || prog.id)
      .map(prog => {
        const value = ensureString(prog.docId || prog.id);
        const label = lang === 'ar' 
          ? (prog.name_ar || prog.name_en || value) 
          : (prog.name_en || prog.name_ar || value);
        return { value, label };
      });
    return [...opts, ...validPrograms];
  }, [programs, lang, t]);

  // Activity Form - Subject Options
  const activitySubjectOptions = useMemo(() => {
    const opts = [
      { value: '', label: t('select_subject') || 'Select Subject' }
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
        return { value, label };
      });
    return [...opts, ...validSubjects];
  }, [subjects, activityForm.programId, lang, t]);

  // Activity Form - Class Options
  const activityClassOptions = useMemo(() => {
    const opts = [
      { value: '', label: t('general_no_class') || 'General (No Class)' }
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
        return { value, label };
      });
    return [...opts, ...validClasses];
  }, [classes, activityForm.subjectId, lang, t]);

  // Enrollment Form - Program Options
  const enrollmentProgramOptions = useMemo(() => {
    const opts = [
      { value: '', label: t('all_programs') || 'All Programs' }
    ];
    const validPrograms = programs.map(p => ({
      value: ensureString(p.docId || p.id),
      label: p.name_en || p.name || p.code || p.docId
    }));
    return [...opts, ...validPrograms];
  }, [programs, t]);

  // Enrollment Form - Subject Options
  const enrollmentSubjectOptions = useMemo(() => {
    const opts = [
      { value: '', label: t('all_subjects') || 'All Subjects' }
    ];
    const validSubjects = subjects
      .filter(s => {
        if (!enrollmentForm.programId || enrollmentForm.programId === '') return true;
        const subProgramId = ensureString(s.programId || '');
        const formProgramId = ensureString(enrollmentForm.programId);
        return subProgramId === formProgramId;
      })
      .map(s => ({
        value: ensureString(s.docId || s.id),
        label: s.name_en || s.name || s.code || s.docId
      }));
    return [...opts, ...validSubjects];
  }, [subjects, enrollmentForm.programId, t]);

  // Enrollment Form - Class Options
  const enrollmentClassOptions = useMemo(() => {
    const opts = [
      { value: '', label: t('select_class') || 'Select Class' }
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
          label: `${c.name}${codePart}${termPart}${yearPart}${semesterPart}`
        };
      });
    return [...opts, ...validClasses];
  }, [classes, enrollmentForm.subjectId, enrollmentForm.programId, subjects, t]);

  // Enrollment Filters - Program Options
  const enrollmentFilterProgramOptions = useMemo(() => {
    const opts = [
      { value: 'all', label: t('all_programs') || 'All Programs' }
    ];
    const validPrograms = programs.map(p => ({
      value: ensureString(p.docId || p.id),
      label: p.name_en || p.name || p.code || p.docId
    }));
    return [...opts, ...validPrograms];
  }, [programs, t]);

  // Enrollment Filters - Subject Options
  const enrollmentFilterSubjectOptions = useMemo(() => {
    const opts = [
      { value: 'all', label: t('all_subjects') || 'All Subjects' }
    ];
    const validSubjects = subjects
      .filter(s => {
        if (!enrollmentProgramFilter || enrollmentProgramFilter === 'all') return true;
        const subProgramId = ensureString(s.programId || '');
        const filterProgramId = ensureString(enrollmentProgramFilter);
        return subProgramId === filterProgramId;
      })
      .map(s => ({
        value: ensureString(s.docId || s.id),
        label: s.name_en || s.name || s.code || s.docId
      }));
    return [...opts, ...validSubjects];
  }, [subjects, enrollmentProgramFilter, t]);

  // Enrollment Filters - Class Options
  const enrollmentFilterClassOptions = useMemo(() => {
    const opts = [
      { value: 'all', label: t('all_classes') || 'All Classes' }
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
      { value: '', label: t('select_subject') || 'Select Subject' }
    ];
    const validSubjects = subjects.map(subject => ({
      value: ensureString(subject.docId),
      label: `${lang === 'ar' ? (subject.name_ar || subject.name_en) : subject.name_en}${subject.code ? ` (${subject.code})` : ''}`
    }));
    return [...opts, ...validSubjects];
  }, [subjects, lang, t]);

  // Debug logging for dropdown state changes
  useEffect(() => {
    console.log('🔍 [Activity Form] State:', {
      programId: activityForm.programId,
      subjectId: activityForm.subjectId,
      classId: activityForm.classId,
      programOptionsCount: activityProgramOptions.length,
      subjectOptionsCount: activitySubjectOptions.length,
      classOptionsCount: activityClassOptions.length
    });
  }, [activityForm.programId, activityForm.subjectId, activityForm.classId, activityProgramOptions.length, activitySubjectOptions.length, activityClassOptions.length]);

  // Debug logging for enrollment form state
  useEffect(() => {
    console.log('🔍 [Enrollment Form] State:', {
      programId: enrollmentForm.programId,
      subjectId: enrollmentForm.subjectId,
      classId: enrollmentForm.classId,
      programOptionsCount: enrollmentProgramOptions.length,
      subjectOptionsCount: enrollmentSubjectOptions.length,
      classOptionsCount: enrollmentClassOptions.length
    });
  }, [enrollmentForm.programId, enrollmentForm.subjectId, enrollmentForm.classId, 
      enrollmentProgramOptions.length, enrollmentSubjectOptions.length, enrollmentClassOptions.length]);

  // Handle hash navigation from sidebar (only on initial load or hash change from external source)
  const [hashProcessed, setHashProcessed] = useState(false);
  useEffect(() => {
    if (location.hash && !hashProcessed) {
      const hash = location.hash.substring(1); // Remove #
      const hashToTabMap = {
        'programs': 'programs',
        'subjects': 'subjects',
        'classes': 'classes',
        'enrollments': 'manage-enrollments',
        'marks': 'marks',
        'class-schedule': 'class-schedule'
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
            const { getAllQuizzes } = await import('../firebase/quizzes');
            return await getAllQuizzes();
          } catch {
            return { success: false, data: [] };
          }
        })(),
        getSubjects(),
        getPrograms()
      ]);

      if (activitiesRes.success) setActivities(activitiesRes.data);
      if (announcementsRes.success) setAnnouncements(announcementsRes.data);
      if (usersRes.success) setUsers(usersRes.data);
      if (allowlistRes.success) setAllowlist(allowlistRes.data);
      if (classesRes.success) setClasses(classesRes.data || []);
      if (subjectsRes.success) setSubjects(subjectsRes.data || []);
      if (programsRes.success) setPrograms(programsRes.data || []);
      if (quizzesRes.success) setQuizzes(quizzesRes.data || []);
      
      // Enrich enrollments with program and subject names (like HR Penalties)
      if (enrollmentsRes.success) {
        const enrollmentsData = enrollmentsRes.data || [];
        const classesData = classesRes.data || [];
        const subjectsData = subjectsRes.data || [];
        const programsData = programsRes.data || [];
        
        console.log('🔍 [Enrollments] Starting enrichment for', enrollmentsData.length, 'enrollments');
        
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
            console.warn('⚠️ [Enrollments] No classId in enrollment:', enrollment.id || enrollment.docId);
            return enriched;
          }
          
          // Find class
          const classItem = classesData.find(c => {
            const cId = c.docId || c.id;
            return String(cId) === String(classId);
          });
          
          if (!classItem) {
            console.warn('⚠️ [Enrollments] Class not found:', classId);
            return enriched;
          }
          
          // Get subjectId from class
          const subjectId = classItem.subjectId || enrollment.subjectId;
          if (!subjectId) {
            console.warn('⚠️ [Enrollments] No subjectId in class:', classId);
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
        
        console.log('✅ [Enrollments] Enrichment complete. Sample:', enrichedEnrollments[0]);
        setEnrollments(enrichedEnrollments);
      }
      
      if (submissionsRes.success) setSubmissions(submissionsRes.data);
      if (resourcesRes.success) setResources(resourcesRes.data);
      if (loginLogsRes.success) setLoginLogs(loginLogsRes.data);
      if (coursesRes.success) setCourses(coursesRes.data || []);
      if (quizzesRes.success) setQuizzes(quizzesRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

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
        } catch (e) { console.warn('Failed to log activity:', e); }
        
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
            console.warn('Activity notification failed', e);
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
      console.error('Error saving activity:', error);
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
          <div style="background: #f5f5f5; padding: 1.5rem; border-radius: 8px; margin: 1rem 0;">
            <h3 style="margin-top: 0;">${activity.title_en || ''}</h3>
            <p><strong>Type:</strong> ${activity.type}</p>
            <p><strong>Level:</strong> ${activity.difficulty}</p>
            <p><strong>Due Date:</strong> ${dueDate}</p>
            <p><strong>Retakes:</strong> ${activity.allowRetake ? 'Allowed ✅' : 'Not allowed ❌'}</p>
            ${activity.optional ? '<p><strong>Status:</strong> Optional 💡</p>' : '<p><strong>Status:</strong> Required 📌</p>'}
          </div>
          <p>${activity.description_en || ''}</p>
          <a href="${activity.url}" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#800020,#600018);color:#fff;text-decoration:none;border-radius:8px;margin-top:1rem;">Start Activity 🎯</a>
        </div>`;
      const buildAr = () => `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; text-align:right">
          <h2 style="color: #800020;">📚 واجب/نشاط جديد</h2>
          <div style="background: #f5f5f5; padding: 1.5rem; border-radius: 8px; margin: 1rem 0;">
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
      console.error('Error sending email:', error);
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
        toast?.showSuccess('Announcement created successfully');
      } else {
        toast?.showError('Failed to create announcement');
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
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
            target: announcementForm.target
          });
        } catch (e) { console.warn('Failed to log activity:', e); }
        
        // Legacy log (keep for backward compatibility)
        if (!editingAnnouncement) {
          try {
            await addActivityLog({
              type: 'announcement_created',
              userId: user.uid,
              email: user.email,
              displayName: user.displayName || user.email,
              userAgent: navigator.userAgent,
              metadata: { announcementId: result.id, title: announcementForm.title, target: announcementForm.target }
            });
          } catch (e) { console.warn('Failed to log announcement:', e); }
        }
        // Send notifications only for new announcements
        if (!editingAnnouncement) {
          if (announcementForm.target === 'global') {
            await notifyAllUsers(
              `📢 ${announcementForm.title}`,
              announcementForm.content,
              'announcement'
            );
          } else if (announcementForm.target.startsWith('class:')) {
            const classId = announcementForm.target.replace('class:', '');
            await notifyUsersByClass(
              classId,
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
            const recipients = users.map(u => u.email).filter(Boolean);
            if (recipients.length > 0) {
              const sendRes = await sendEmail({
                to: recipients,
                subject: `📢 ${announcementForm.title}`,
                html: buildBody(),
                type: 'announcement'
              });
              if (!sendRes.success) {
                console.warn('Announcement email failed:', sendRes.error);
                toast?.showError('Announcement created, but email failed: ' + sendRes.error);
              }
            }
          }
        }

        await loadData();
        setAnnouncementForm({ title: '', content: '', content_ar: '', target: 'global' });
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
      console.error('Error with announcement:', error);
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
      console.error('Error updating allowlist:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <Loading variant="overlay" fullscreen message={t('loading') || 'Loading...'} />;
  }

  if (!user || !isAdmin) {
    return (
      <div className="dashboard-page">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  // Show initial full-screen loading only on first load
  if (authLoading) {
    return <Loading variant="overlay" fullscreen message={t('loading') || 'Loading...'} />;
  }

  return (
    <div className="dashboard-page">
      {/* Compact header removed to save vertical space */}

      <div className="dashboard-content">
        <RibbonTabs
          categories={ribbonCategories}
          activeCategory={activeCategory}
          activeItem={activeTab}
          onChange={({ category, item }) => { setActiveCategory(category); handleTabChange(item); }}
        />

        {/* Summary Cards with Filters */}
        <Card style={{ marginBottom: '1.5rem', marginTop: '1rem' }}>
          <CardBody>
            {/* Filters */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <Select
                searchable
                value={enrollmentProgramFilter}
                onChange={(e) => {
                  setEnrollmentProgramFilter(e.target.value);
                  setEnrollmentSubjectFilter('all');
                  setEnrollmentClassFilter('all');
                }}
                options={[
                  { value: 'all', label: t('all_programs') || 'All Programs' },
                  ...programs.map(p => ({
                    value: p.docId || p.id,
                    label: p.name_en || p.name_ar || p.code || p.docId
                  }))
                ]}
                style={{ minWidth: 180 }}
                placeholder="Program"
              />
              <Select
                searchable
                value={enrollmentSubjectFilter}
                onChange={(e) => {
                  setEnrollmentSubjectFilter(e.target.value);
                  setEnrollmentClassFilter('all');
                }}
                options={[
                  { value: 'all', label: t('all_subjects') || 'All Subjects' },
                  ...subjects
                    .filter(s => enrollmentProgramFilter === 'all' || s.programId === enrollmentProgramFilter)
                    .map(s => ({
                      value: s.docId || s.id,
                      label: `${s.code || ''} - ${s.name_en || s.name_ar || s.docId}`.trim()
                    }))
                ]}
                style={{ minWidth: 180 }}
                placeholder="Subject"
              />
              <Select
                searchable
                value={enrollmentClassFilter}
                onChange={(e) => setEnrollmentClassFilter(e.target.value)}
                options={[
                  { value: 'all', label: t('all_classes') || 'All Classes' },
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
                      label: `${c.name || c.code || c.id}${c.term ? ` (${c.term})` : ''}`
                    }))
                ]}
                style={{ minWidth: 180 }}
                placeholder="Class"
              />
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
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
                  tooltip: 'Total number of quizzes'
                },
                // Announcements
                {
                  type: 'announcements',
                  value: announcements.length,
                  tooltip: 'Total number of announcements'
                },
                // Resources
                {
                  type: 'resources',
                  value: resources.length,
                  tooltip: 'Total number of resources'
                }
              ].map((stat, idx) => {
                const config = getCardConfig(stat.type, t);
                const IconComponent = config.icon;
                const borderRadius = getShapeRadius(config.shape);
                
                return (
                  <Card key={idx} style={{ position: 'relative', overflow: 'visible' }}>
                    <CardBody>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ 
                          padding: '0.75rem', 
                          background: config.bg, 
                          borderRadius: borderRadius,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <IconComponent size={24} style={{ color: config.iconColor }} />
                        </div>
                        <div style={{ flex: 1, position: 'relative', overflow: 'visible' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                              {config.label}
                            </span>
                            <div style={{ position: 'relative', zIndex: 10000 }}>
                              <InfoTooltip>
                                <div style={{ padding: '0.5rem', fontSize: '0.875rem', lineHeight: '1.5', maxWidth: '250px', whiteSpace: 'normal' }}>
                                  {stat.tooltip}
                                </div>
                              </InfoTooltip>
                            </div>
                          </div>
                          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: config.iconColor }}>
                            {stat.value}
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </CardBody>
        </Card>

        <div className="tab-content">
          {loading && <Loading variant="overlay" message={t('loading') || 'Loading...'} />}
          
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
                  <Edit size={16} /> Editing Activity: {editingActivity.id} - {editingActivity.title_en}
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
                          const graded = submissions.filter(s => s.status === 'graded').length;
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

              <form onSubmit={handleActivitySubmit} className="activity-form">
                <div className="form-row">
                  <div>
                    <Input
                      type="text"
                      placeholder={t('activity_id') || 'Activity ID'}
                      value={activityForm.id}
                      onChange={(e) => setActivityForm({ ...activityForm, id: e.target.value })}
                      disabled={editingActivity} // Can't change ID when editing
                      required
                      error={formErrors.id}
                    />
                  </div>
                  <div style={{ border: '0px solid #ccc', padding: '0px', margin: '0px 0', borderRadius: '4px' }}>
                    {/* <div>Program Dropdown:</div> */}
                    {/* <div>Current Value: {activityForm.programId || 'null'}</div> */}
                    <Select
                      searchable
                      placeholder={t('program') || 'Program (Optional)'}
                      value={activityForm.programId}
                      onChange={(value) => {
                        console.log('Program Select onChange:', value);
                        handleDropdownChange(
                          setActivityForm,
                          'programId',
                          ['subjectId', 'classId']
                        )(value);
                      }}
                      options={activityProgramOptions}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <Select
                    searchable
                    placeholder={t('subject') || 'Subject (Optional)'}
                    value={activityForm.subjectId || null}
                    onChange={handleDropdownChange(
                      setActivityForm,
                      'subjectId',
                      ['classId'] // Reset class when subject changes
                    )}
                    options={activitySubjectOptions}
                    style={{ width: '100%' }}
                    disabled={!activityForm.programId}
                  />
                  <Select
                    searchable
                    placeholder={t('general_no_class') || 'Class (Optional)'}
                    value={activityForm.classId || null}
                    onChange={handleDropdownChange(
                      setActivityForm,
                      'classId'
                    )}
                    options={activityClassOptions}
                    style={{ width: '100%' }}
                    disabled={!activityForm.subjectId}
                  />
                  <Select
                    searchable
                    placeholder={t('course') || 'Course'}
                    value={activityForm.course}
                    onChange={(e) => setActivityForm({ ...activityForm, course: e.target.value })}
                    options={(courses && courses.length > 0 ? courses : [
                      { docId: 'programming', name_en: 'Programming', name_ar: 'البرمجة' },
                      { docId: 'computing', name_en: 'Computing', name_ar: 'الحوسبة' },
                      { docId: 'algorithm', name_en: 'Algorithm', name_ar: 'الخوارزميات' },
                      { docId: 'general', name_en: 'General', name_ar: 'عام' },
                    ]).map(c => ({
                      value: c.docId,
                      label: lang === 'ar' ? (c.name_ar || c.name_en || c.docId) : (c.name_en || c.docId)
                    }))}
                    style={{ width: '100%' }}
                  />
                  <Select
                    searchable
                    placeholder={t('type') || 'Activity Type'}
                    value={activityForm.type}
                    onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value })}
                    options={[
                      { value: 'quiz', label: t('quiz') || 'Quiz' },
                      { value: 'homework', label: t('homework') || 'Homework' },
                      { value: 'training', label: t('training') || 'Training' },
                      { value: 'labandproject', label: 'Lab & Project' }
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
                        { value: 'beginner', label: t('beginner') || 'Beginner' },
                        { value: 'intermediate', label: t('intermediate') || 'Intermediate' },
                        { value: 'advanced', label: t('advanced') || 'Advanced' }
                      ]}
                      style={{ width: '100%' }}
                      disabled={activityForm.quizId && !activityForm.overrideQuizSettings}
                    />
                    {activityForm.quizId && !activityForm.overrideQuizSettings && (
                      <Lock 
                        size={16} 
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
                      />
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
                      onOpen={(href) => console.debug('open activity url', href)}
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
                    onOpen={(href) => console.debug('open image url', href)}
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
                      <Lock 
                        size={16} 
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
                      />
                    )}
                  </div>
                </div>

                {/* Quiz Selector - Only show for quiz type */}
                {activityForm.type === 'quiz' && (
                  <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                    <Select
                      searchable
                      placeholder={t('select_quiz') || 'Select Quiz (Optional)'}
                      value={activityForm.quizId || ''}
                      onChange={(e) => {
                        const selectedQuizId = e.target.value;
                        const selectedQuiz = quizzes.find(q => q.id === selectedQuizId);
                        console.log('Quiz selected:', selectedQuizId, selectedQuiz);
                        
                        if (selectedQuiz) {
                          const quizMaxScore = selectedQuiz.questions?.reduce((sum, q) => sum + (q.points || 1), 0) || 100;
                          const quizDifficulty = selectedQuiz.difficulty || 'beginner';
                          const quizAllowRetake = selectedQuiz.settings?.allowRetake !== undefined 
                            ? selectedQuiz.settings.allowRetake 
                            : (selectedQuiz.allowRetake !== undefined ? selectedQuiz.allowRetake : false);
                          
                          setActivityForm(prev => ({
                            ...prev,
                            quizId: selectedQuizId,
                            // Auto-populate from quiz if override is not enabled
                            ...(prev.overrideQuizSettings ? {} : {
                              difficulty: quizDifficulty,
                              allowRetake: quizAllowRetake,
                              maxScore: quizMaxScore
                            })
                          }));
                        } else {
                          // Quiz deselected
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
                            // Remove duplicates by id
                            index === self.findIndex(q => q.id === quiz.id)
                          )
                          .filter(quiz => quiz.id) // Filter out quizzes without id
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
                                // Re-sync from quiz when override is turned off
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
                            <Lock size={12} /> Synced from quiz
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
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
                      <Lock 
                        size={14} 
                        style={{ color: '#ef4444', flexShrink: 0 }} 
                        title="Locked - synced from quiz"
                      />
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

                <div className="form-actions">
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <Button type="submit" variant="primary" loading={loading}>
                      {(editingActivity ? (t('update') || 'Update') : (t('save') || 'Save'))}
                    </Button>
                    {editingActivity && (
                      <Button type="button" variant="outline" onClick={handleCancelEdit}>
                        {t('cancel_edit') || 'Cancel Edit'}
                      </Button>
                    )}
                  </div>
                </div>
              </form>
              <div style={{ marginTop: '1rem' }}>
                <AdvancedDataGrid
                  rows={activities}
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
                      if (!programId) return '—';
                      const program = programs.find(p => (p.docId || p.id) === programId);
                      if (!program) return '—';
                      return lang === 'ar' ? (program.name_ar || program.name_en) : (program.name_en || program.name_ar);
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
                      if (!subjectId) return '—';
                      const subject = subjects.find(s => (s.docId || s.id) === subjectId);
                      if (!subject) return '—';
                      return lang === 'ar' ? (subject.name_ar || subject.name_en) : (subject.name_en || subject.name_ar);
                    }
                  },
                  { 
                    field: 'classId', 
                    headerName: t('class_col') || 'Class', 
                    width: 180,
                    renderCell: (params) => {
                      if (!params.value) return 'General';
                      const classItem = classes.find(c => (c.docId || c.id) === params.value);
                      if (!classItem) return params.value;
                      return `${classItem.name}${classItem.code ? ` (${classItem.code})` : ''}`;
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
                        'quiz': '📝 Quiz',
                        'homework': '📋 Homework',
                        'training': '📚 Training'
                      };
                      return typeMap[type] || type;
                    }
                  },
                  { field: 'difficulty', headerName: t('difficulty_col'), width: 140 },
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
                    renderCell: (params) => (params.value ? '✅ Yes' : '❌ No')
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
                    field: 'show', headerName: t('visible') || 'Visible', width: 120,
                    renderCell: (params) => (params.value ? `✅ ${t('yes') || 'Yes'}` : `❌ ${t('no') || 'No'}`)
                  },
                  {
                    field: 'actions', headerName: t('actions') || 'Actions', width: 200, sortable: false, filterable: false,
                    renderCell: (params) => (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button size="sm" variant="ghost" className="editHover" icon={<Edit size={16} />} onClick={() => handleEditActivity(params.row)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="ghost" className="deleteHover" icon={<Trash size={16} />} style={{ color: '#dc2626' }} onClick={() => {
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
                                  } catch (e) { console.warn('Failed to log activity:', e); }
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
                loadingOverlayMessage="Loading..."
              />
              </div>
            </div>
          )}

          {activeTab === 'newsletter' && (
            /* ... */
            <div className="newsletter-tab">
              <div style={{ marginBottom: '1rem' }}>
                <h2 style={{ margin: 0, display: 'none' }}>{t('newsletter')}</h2>
                <p style={{ color: '#666', marginTop: '0.5rem', marginBottom: 0 }}>{t('send_bulk_emails_view')}</p>
              </div>
              <EmailLogs
                defaultTypeFilter="newsletter"
                actionsSlot={(
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => setSmartComposerOpen(true)}
                  >
                    {t('compose_email') || 'Compose Email'}
                  </Button>
                )}
              />
            </div>
          )}

          {activeTab === 'announcements' && (
            <div className="announcements-tab">
              <h2 style={{ display: 'none' }}>{t('announcements_management')}</h2>

              {editingAnnouncement && (
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
                  <Edit size={16} /> Editing Announcement: {editingAnnouncement.title}
                </div>
              )}

              <form onSubmit={handleAnnouncementSubmit} className="announcement-form">
                <div className="form-row">
                  <Input
                    type="text"
                    placeholder={t('announcement_title')}
                    value={announcementForm.title}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                    required
                  />
                  <Select
                    searchable
                    placeholder={t('target') || 'Target Audience'}
                    value={announcementForm.target}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, target: e.target.value })}
                    options={[
                      { value: 'global', label: t('all_users') || 'All Users' }
                    ]}
                  />
                </div>
                <div className="form-row">
                  <Textarea
                    placeholder={t('announcement_content_english')}
                    value={announcementForm.content}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                    rows={4}
                    required
                    fullWidth
                  />
                  <Textarea
                    placeholder={t('announcement_content_arabic')}
                    value={announcementForm.content_ar}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, content_ar: e.target.value })}
                    rows={4}
                    fullWidth
                  />
                </div>
                {/* Email options for announcement */}
                <div className="form-row" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                  <ToggleSwitch
                    label={t('send_email_notification') || 'Send Email Notification'}
                    checked={announcementEmailOptions.sendEmail}
                    onChange={(checked) => setAnnouncementEmailOptions({ ...announcementEmailOptions, sendEmail: checked })}
                  />
                  <div style={{ marginLeft: 'auto' }}>
                    <Button type="submit" variant="primary" loading={loading}>
                      {(editingAnnouncement ? (t('update') || 'Update') : (t('save') || 'Save'))}
                    </Button>
                    {editingAnnouncement && (
                      <Button type="button" variant="outline" onClick={() => {
                        setEditingAnnouncement(null);
                        setAnnouncementForm({ title: '', content: '', content_ar: '', target: 'global' });
                      }} style={{ marginLeft: '0.5rem' }}>
                        {t('cancel_edit') || 'Cancel Edit'}
                      </Button>
                    )}
                  </div>
                </div>
              </form>

              <div style={{ marginTop: '1rem' }}>
                <AdvancedDataGrid
                  rows={announcements}
                getRowId={(row) => row.docId || row.id}
                columns={[
                  { field: 'title', headerName: 'Title', flex: 1, minWidth: 200 },
                  {
                    field: 'content', headerName: 'Content', flex: 2, minWidth: 250,
                    renderCell: (params) => params.value ? (params.value.length > 100 ? params.value.substring(0, 100) + '...' : params.value) : 'No content'
                  },
                  {
                    field: 'target', headerName: 'Target', width: 150,
                    renderCell: (params) => params.value === 'global' ? 'All Users' : params.value
                  },
                  {
                    field: 'createdAt', headerName: 'Created', width: 180,
                    valueGetter: (params) => params.value,
                    renderCell: (params) => {
                      if (!params.value) return 'Unknown';
                      const date = params.value?.toDate ? params.value.toDate() : (params.value?.seconds ? new Date(params.value.seconds * 1000) : new Date(params.value));
                      return formatQatarDate(date);
                    }
                  },
                  {
                    field: 'actions', headerName: t('actions') || 'Actions', width: 200, sortable: false, filterable: false,
                    renderCell: (params) => (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button size="sm" variant="ghost" className="editHover" icon={<Edit size={16} />} onClick={() => {
                          setEditingAnnouncement(params.row);
                          setAnnouncementForm({
                            title: params.row.title || '',
                            content: params.row.content || '',
                            content_ar: params.row.content_ar || '',
                            target: params.row.target || 'global'
                          });
                        }}>
                          Edit
                        </Button>
                        <Button size="sm" variant="ghost" className="deleteHover" icon={<Trash size={16} />} style={{ color: '#dc2626' }} onClick={() => {
                          setDeleteModal({
                            open: true,
                            item: params.row,
                            type: 'announcement',
                            onConfirm: async () => {
                              const announcement = params.row;
                              setAnnouncements(prev => prev.filter(a => a.docId !== announcement.docId));
                              try {
                                const result = await deleteAnnouncement(announcement.docId);
                                if (result.success) {
                                  // Log activity
                                  try {
                                    await logActivity(ACTIVITY_TYPES.ANNOUNCEMENT_DELETED, {
                                      announcementId: announcement.docId,
                                      announcementTitle: announcement.title
                                    });
                                  } catch (e) { console.warn('Failed to log activity:', e); }
                                  toast?.showSuccess('Announcement deleted successfully!');
                                  await loadData();
                                  setDeleteModal({ open: false, item: null, type: null, onConfirm: null });
                                } else {
                                  setAnnouncements(prev => [...prev, announcement].sort((a, b) =>
                                    new Date(b.createdAt?.seconds ? b.createdAt.seconds * 1000 : b.createdAt) -
                                    new Date(a.createdAt?.seconds ? a.createdAt.seconds * 1000 : a.createdAt)
                                  ));
                                  toast?.showError('Error deleting announcement: ' + result.error);
                                  setDeleteModal({ open: false, item: null, type: null, onConfirm: null });
                                }
                              } catch (error) {
                                setAnnouncements(prev => [...prev, announcement].sort((a, b) =>
                                  new Date(b.createdAt?.seconds ? b.createdAt.seconds * 1000 : b.createdAt) -
                                  new Date(a.createdAt?.seconds ? a.createdAt.seconds * 1000 : a.createdAt)
                                ));
                                toast?.showError('Error deleting announcement: ' + error.message);
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
                pageSizeOptions={[5, 10, 20, 50]}
                checkboxSelection
                showExportButton
                exportFileName="announcements"
                exportLabel={t('export') || 'Export'}
              />
              </div>
            </div>
          )}

          {activeTab === 'newsletter' && (
            /* ... */
            <div className="newsletter-tab">
              <div style={{ marginBottom: '1rem' }}>
                <h2 style={{ margin: 0, display: 'none' }}>{t('newsletter')}</h2>
                <p style={{ color: '#666', marginTop: '0.5rem', marginBottom: 0 }}>{t('send_bulk_emails_view')}</p>
              </div>
              <EmailLogs
                defaultTypeFilter="newsletter"
                actionsSlot={(
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => setSmartComposerOpen(true)}
                  >
                    {t('compose_email') || 'Compose Email'}
                  </Button>
                )}
              />
            </div>
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

          {activeTab === 'class-schedule' && (isSuperAdmin || isAdmin || isInstructor) && (
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
            <div className="login-activity-tab">
              <h2 style={{ display: 'none' }}>{t('activity_logs')}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, margin: '0.5rem 0 1rem' }}>
                <Select value={activityTypeFilter} onChange={(e) => setActivityTypeFilter(e.target.value)} options={[
                  { value: 'all', label: t('all_activity_types') || 'All Activity Types' },
                  // Authentication
                  { value: 'login', label: 'Login' },
                  { value: 'logout', label: 'Logout' },
                  { value: 'signup', label: 'Signup' },
                  { value: 'session_timeout', label: 'Session Timeout' },
                  { value: 'profile_update', label: 'Profile Update' },
                  { value: 'password_change', label: 'Password Change' },
                  { value: 'email_change', label: 'Email Change' },
                  // Quiz Activities
                  { value: 'quiz_started', label: 'Quiz Started' },
                  { value: 'quiz_submitted', label: 'Quiz Submitted' },
                  { value: 'quiz_created', label: 'Quiz Created' },
                  { value: 'quiz_deleted', label: 'Quiz Deleted' },
                  { value: 'quiz_published', label: 'Quiz Published' },
                  // Activity CRUD
                  { value: 'activity_created', label: 'Activity Created' },
                  { value: 'activity_updated', label: 'Activity Updated' },
                  { value: 'activity_deleted', label: 'Activity Deleted' },
                  { value: 'activity_viewed', label: 'Activity Viewed' },
                  // Assignment/Submission
                  { value: 'assignment_started', label: 'Assignment Started' },
                  { value: 'assignment_submitted', label: 'Assignment Submitted' },
                  { value: 'submission_graded', label: 'Submission Graded' },
                  // Resources CRUD
                  { value: 'resource_created', label: 'Resource Created' },
                  { value: 'resource_updated', label: 'Resource Updated' },
                  { value: 'resource_deleted', label: 'Resource Deleted' },
                  { value: 'resource_completed', label: 'Resource Completed' },
                  { value: 'resource_bookmarked', label: 'Resource Bookmarked' },
                  // Attendance
                  { value: 'attendance_marked', label: 'Attendance Marked' },
                  // Communication
                  { value: 'message_sent', label: 'Message Sent' },
                  { value: 'message_received', label: 'Message Received' },
                  { value: 'announcement_read', label: 'Announcement Read' },
                  { value: 'announcement_created', label: 'Announcement Created' },
                  { value: 'announcement_updated', label: 'Announcement Updated' },
                  { value: 'announcement_deleted', label: 'Announcement Deleted' },
                  // Penalties CRUD
                  { value: 'penalty_created', label: 'Penalty Created' },
                  { value: 'penalty_updated', label: 'Penalty Updated' },
                  { value: 'penalty_deleted', label: 'Penalty Deleted' },
                  { value: 'penalty_viewed', label: 'Penalty Viewed' },
                  // Participation CRUD
                  { value: 'participation_created', label: 'Participation Created' },
                  { value: 'participation_updated', label: 'Participation Updated' },
                  { value: 'participation_deleted', label: 'Participation Deleted' },
                  { value: 'participation_viewed', label: 'Participation Viewed' },
                  // Behavior CRUD
                  { value: 'behavior_created', label: 'Behavior Created' },
                  { value: 'behavior_updated', label: 'Behavior Updated' },
                  { value: 'behavior_deleted', label: 'Behavior Deleted' },
                  { value: 'behavior_viewed', label: 'Behavior Viewed' },
                  // Class CRUD
                  { value: 'class_created', label: 'Class Created' },
                  { value: 'class_updated', label: 'Class Updated' },
                  { value: 'class_deleted', label: 'Class Deleted' },
                  { value: 'class_viewed', label: 'Class Viewed' },
                  // Subject CRUD
                  { value: 'subject_created', label: 'Subject Created' },
                  { value: 'subject_updated', label: 'Subject Updated' },
                  { value: 'subject_deleted', label: 'Subject Deleted' },
                  { value: 'subject_viewed', label: 'Subject Viewed' },
                  // Program CRUD
                  { value: 'program_created', label: 'Program Created' },
                  { value: 'program_updated', label: 'Program Updated' },
                  { value: 'program_deleted', label: 'Program Deleted' },
                  { value: 'program_viewed', label: 'Program Viewed' },
                  // Enrollment CRUD
                  { value: 'enrollment_created', label: 'Enrollment Created' },
                  { value: 'enrollment_updated', label: 'Enrollment Updated' },
                  { value: 'enrollment_deleted', label: 'Enrollment Deleted' },
                  { value: 'enrollment_viewed', label: 'Enrollment Viewed' },
                  // Mark Entry CRUD
                  { value: 'mark_entry_created', label: 'Mark Entry Created' },
                  { value: 'mark_entry_updated', label: 'Mark Entry Updated' },
                  { value: 'mark_entry_deleted', label: 'Mark Entry Deleted' },
                  { value: 'mark_entry_viewed', label: 'Mark Entry Viewed' },
                  // User CRUD
                  { value: 'user_created', label: 'User Created' },
                  { value: 'user_updated', label: 'User Updated' },
                  { value: 'user_deleted', label: 'User Deleted' },
                  // Navigation
                  { value: 'dashboard_viewed', label: 'Dashboard Viewed' },
                  { value: 'analytics_viewed', label: 'Analytics Viewed' }
                ]} fullWidth />
                <Input
                  type="text"
                  placeholder={t('search_by_email_name_ua')}
                  value={loginSearch}
                  onChange={(e) => setLoginSearch(e.target.value)}
                  fullWidth
                />
                <Select value={loginUserFilter} onChange={(e) => setLoginUserFilter(e.target.value)} options={[
                  { value: 'all', label: t('all_users') },
                  ...users.map(u => ({
                    value: u.email || u.docId,
                    label: u.displayName ? `${u.displayName} (${u.email || u.docId})` : (u.email || u.docId)
                  }))
                ]} fullWidth />
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
                  fullWidth
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
                    icon={<RefreshCw size={16} />}
                  >
                    Refresh
                  </Button>
                </div>
              </div>
              <AdvancedDataGrid
                rows={filteredLoginLogs().slice(0, 500)}
                getRowId={(row) => row.docId || row.id}
                columns={[
                  {
                    field: 'type', headerName: t('type'), width: 200,
                    renderCell: (params) => {
                      const typeIcons = {
                        login: '🔐', signup: '✨', profile_update: '👤', password_change: '🔑',
                        email_change: '📧', session_timeout: '⏱️', message_sent: '📤', message_received: '📥',
                        submission: '📝', announcement_read: '📢', announcement_created: '📣',
                        quiz_start: '🎯', quiz_submit: '✅', submission_graded: '⭐',
                        resource_completed: '📚', attendance_marked: '✓', activity_viewed: '👁️',
                        resource_bookmarked: '🔖', badge_earned: '🏅'
                      };
                      return (
                        <span>
                          <span style={{ fontSize: '1.2rem', marginRight: '6px' }}>{typeIcons[params.value] || '📋'}</span>
                          <span style={{ fontSize: '0.85rem' }}>{params.value || 'login'}</span>
                        </span>
                      );
                    }
                  },
                  {
                    field: 'when', headerName: t('when'), width: 180,
                    valueGetter: (params) => params.value,
                    renderCell: (params) => formatDateTime(params.value)
                  },
                  {
                    field: 'displayName', headerName: t('user_col'), flex: 1, minWidth: 150,
                    renderCell: (params) => params.value || '—'
                  },
                  {
                    field: 'email', headerName: t('email_col'), flex: 1, minWidth: 200,
                    renderCell: (params) => params.value || '—'
                  },
                  {
                    field: 'userAgent', headerName: t('user_agent_col'), flex: 2, minWidth: 300,
                    renderCell: (params) => (
                      <div style={{ maxWidth: 520, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {params.value || '—'}
                      </div>
                    )
                  }
                ]}
                pageSize={20}
                pageSizeOptions={[10, 20, 50, 100]}
                checkboxSelection
                exportFileName="login-activity"
                showExportButton
                exportLabel={t('export') || 'Export'}
              />
            </div>
          )}

          {activeTab === 'classes' && (
            <div className="classes-tab">
              <h2 style={{ display: 'none' }}>{t('classes_management')}</h2>

              {editingClass && (
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
                  <Edit size={16} /> Editing Class: {editingClass.name} ({editingClass.code || 'No code'})
                </div>
              )}

              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!classForm.name.trim()) {
                  toast?.showError(t('class_name') + ' is required');
                  return;
                }

                setLoading(true);
                try {
                  const result = editingClass ?
                    await updateClass(editingClass.docId, classForm) :
                    await addClass(classForm);

                  if (result.success) {
                    // Log activity
                    try {
                      await logActivity(editingClass ? ACTIVITY_TYPES.CLASS_UPDATED : ACTIVITY_TYPES.CLASS_CREATED, {
                        classId: editingClass?.docId || result.id,
                        className: classForm.name,
                        classCode: classForm.code,
                        subjectId: classForm.subjectId
                      });
                    } catch (e) { console.warn('Failed to log activity:', e); }
                    await loadData();
                    setEditingClass(null);
                    setClassForm({ id: '', name: '', nameAr: '', code: '', term: '', ownerEmail: '', subjectId: '' });
                    toast?.showSuccess(editingClass ? 'Class updated successfully!' : 'Class created successfully!');
                  } else {
                    toast?.showError('Error: ' + result.error);
                  }
                } catch (error) {
                  toast?.showError('Error: ' + error.message);
                } finally {
                  setLoading(false);
                }
              }} className="activity-form">
                <div className="form-row">
                  <Input
                    placeholder={t('class_name')}
                    value={classForm.name}
                    onChange={e => setClassForm({ ...classForm, name: e.target.value })}
                    required
                  />
                  <Input
                    placeholder={t('class_name_arabic')}
                    value={classForm.nameAr || ''}
                    onChange={e => setClassForm({ ...classForm, nameAr: e.target.value })}
                    dir="rtl"
                  />
                  <Input
                    placeholder={t('class_code') + ' (' + t('optional') + ')'}
                    value={classForm.code}
                    onChange={e => setClassForm({ ...classForm, code: e.target.value })}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Select
                      searchable
                      placeholder={t('term')}
                      value={classForm.term?.split(' ')[0] || ''}
                      onChange={e => {
                        const year = classForm.term?.split(' ')[1] || new Date().getFullYear();
                        setClassForm({ ...classForm, term: e.target.value ? `${e.target.value} ${year}` : '' });
                      }}
                      options={[
                        { value: '', label: t('term') || 'Select Term' },
                        { value: 'Fall', label: t('fall') || 'Fall' },
                        { value: 'Spring', label: t('spring') || 'Spring' },
                        { value: 'Summer', label: t('summer') || 'Summer' }
                      ]}
                      required
                    />
                    <YearSelect
                      value={classForm.term?.split(' ')[1] || ''}
                      onChange={e => {
                        const semester = classForm.term?.split(' ')[0] || '';
                        setClassForm({
                          ...classForm,
                          term: semester ? `${semester} ${e.target.value}` : e.target.value
                        });
                      }}
                      startYear={2024}
                      yearsAhead={5}
                      label={null}
                      placeholder={t('year') || 'Year'}
                      searchable
                      required
                    />
                  </div>
                  <Select
                    searchable
                    placeholder={t('select_subject') || 'Select Subject'}
                    value={ensureString(classForm.subjectId || '')}
                    onChange={e => {
                      const newSubjectId = ensureString(e.target.value);
                      console.log('🔄 [Class Form] Subject changed:', newSubjectId);
                      setClassForm(prev => ({ ...prev, subjectId: newSubjectId }));
                    }}
                    options={classFormSubjectOptions}
                    required
                  />
                  <Select
                    searchable
                    placeholder={t('select_owner') || 'Select Instructor'}
                    value={classForm.ownerEmail}
                    onChange={e => setClassForm({ ...classForm, ownerEmail: e.target.value })}
                    options={[
                      { value: '', label: t('select_owner') || 'Select Instructor' },
                      ...users.filter(user => user.role === 'admin' || user.role === 'instructor').map(instructor => {
                        const displayName = instructor.displayName || instructor.name || instructor.realName || '';
                        return {
                          value: instructor.email,
                          label: displayName ? `${displayName} (${instructor.email})` : instructor.email
                        };
                      }),
                      ...(allowlist?.adminEmails?.filter(email =>
                        !users.some(u => u.email === email)
                      ).map(email => ({
                        value: email,
                        label: `${email} (from allowlist)`
                      })) || [])
                    ]}
                    required
                  />
                </div>

                <div className="form-actions">
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <Button type="submit" variant="primary" loading={loading}>
                      {(editingClass ? t('update') : t('save'))}
                    </Button>
                    {editingClass && (
                      <Button type="button" variant="outline" onClick={() => {
                        setEditingClass(null);
                        setClassForm({ id: '', name: '', nameAr: '', code: '', term: '', ownerEmail: '', subjectId: '' });
                      }}>
                        {t('cancel_edit') || 'Cancel Edit'}
                      </Button>
                    )}
                  </div>
                </div>
              </form>

              <div style={{ marginTop: '1rem' }}>
                <AdvancedDataGrid
                  rows={classes}
                getRowId={(row) => row.docId || row.id}
                columns={[
                  { field: 'name', headerName: t('name') || 'Name', flex: 1, minWidth: 180 },
                  { 
                    field: 'code', 
                    headerName: t('code') || 'Code', 
                    width: 120,
                    valueGetter: (params) => {
                      const row = params?.row || {};
                      const code = row.code || params?.value;
                      return code || '—';
                    }
                  },
                  {
                    field: 'subjectId', headerName: t('subject') || 'Subject', flex: 1, minWidth: 180,
                    valueGetter: (params) => {
                      const row = params?.row || {};
                      const subjectId = row.subjectId || params?.value;
                      if (!subjectId) return '—';
                      const subject = subjects.find(s => (s.docId === subjectId) || (s.id === subjectId));
                      if (!subject) return '—';
                      const subjectName = lang === 'ar' ? (subject.name_ar || subject.name_en) : subject.name_en;
                      return subjectName || '—';
                    }
                  },
                  { field: 'term', headerName: t('term') || 'Term', width: 140 },
                  {
                    field: 'ownerEmail', headerName: t('owner') || 'Owner', flex: 1, minWidth: 200,
                    valueGetter: (params) => {
                      const row = params?.row || {};
                      const email = row.ownerEmail || params?.value;
                      if (!email) return '—';
                      const owner = users.find(u => u.email === email);
                      if (owner) {
                        const displayName = owner.displayName || owner.name || owner.realName || '';
                        return displayName ? `${displayName} (${email})` : email;
                      }
                      return email;
                    }
                  },
                  {
                    field: 'actions', headerName: t('actions') || 'Actions', width: 200, sortable: false, filterable: false,
                    renderCell: (params) => (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button size="sm" variant="ghost" className="editHover" icon={<Edit size={16} />} onClick={() => {
                          setEditingClass(params.row);
                          setClassForm({
                            id: params.row.id,
                            name: params.row.name || '',
                            nameAr: params.row.nameAr || '',
                            code: params.row.code || '',
                            term: params.row.term || '',
                            ownerEmail: params.row.ownerEmail || '',
                            subjectId: params.row.subjectId || ''
                          });
                        }}>
                          Edit
                        </Button>
                        <Button size="sm" variant="ghost" className="deleteHover" icon={<Trash size={16} />} style={{ color: '#dc2626' }} onClick={() => {
                          const classItem = params.row;
                          const classEnrollments = enrollments.filter(e => e.classId === classItem.docId);
                          const relatedActivities = activities.filter(a => (a.classId || '') === classItem.docId);
                          
                          setDeleteModal({
                            open: true,
                            item: classItem,
                            type: 'class',
                            onConfirm: async () => {
                              setClasses(prev => prev.filter(c => c.docId !== classItem.docId));
                              try {
                                // deleteClass now handles cascade deletion of enrollments and attendance
                                const result = await deleteClass(classItem.docId);
                                if (result.success) {
                                  // Log activity
                                  try {
                                    await logActivity(ACTIVITY_TYPES.CLASS_DELETED, {
                                      classId: classItem.docId,
                                      className: classItem.name
                                    });
                                  } catch (e) { console.warn('Failed to log activity:', e); }
                                  await loadData();
                                  toast?.showSuccess(`Class deleted successfully! Removed ${classEnrollments.length} enrollment(s) and related attendance records.`);
                                  setDeleteModal({ open: false, item: null, type: null, onConfirm: null });
                                } else {
                                  setClasses(prev => [...prev, classItem].sort((a, b) => a.name.localeCompare(b.name)));
                                  toast?.showError('Error deleting class: ' + result.error);
                                  setDeleteModal({ open: false, item: null, type: null, onConfirm: null });
                                }
                              } catch (error) {
                                setClasses(prev => [...prev, classItem].sort((a, b) => a.name.localeCompare(b.name)));
                                toast?.showError('Error deleting class: ' + error.message);
                                setDeleteModal({ open: false, item: null, type: null, onConfirm: null });
                              }
                            },
                            relatedData: {
                              enrollments: classEnrollments,
                              activities: relatedActivities
                            },
                            warningMessage: classEnrollments.length > 0 || relatedActivities.length > 0
                              ? `This class has ${classEnrollments.length} enrollment(s) and ${relatedActivities.length} activity(ies) that will be deleted.`
                              : null
                          });
                        }}>
                          {t('delete') || 'Delete'}
                        </Button>
                      </div>
                    )
                  }
                ]}
                pageSize={10}
                pageSizeOptions={[5, 10, 20, 50]}
                checkboxSelection
                exportFileName="classes"
                showExportButton
                exportLabel={t('export') || 'Export'}
              />
              </div>
            </div>
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
          <div className="enrollments-section" style={{ marginTop: '2rem' }}>
            <form onSubmit={async (e) => {
              e.preventDefault();
              // Check if enrollment already exists
              const existingEnrollment = enrollments.find(e =>
                e.userId === enrollmentForm.userId && e.classId === enrollmentForm.classId
              );

              if (existingEnrollment) {
                toast?.showError('This user is already enrolled in this class');
                return;
              }

              setLoading(true);
              try {
                const result = await addEnrollment(enrollmentForm);
                if (result.success) {
                  // Log activity
                  try {
                    await logActivity(ACTIVITY_TYPES.ENROLLMENT_CREATED, {
                      enrollmentId: result.id,
                      userId: enrollmentForm.userId,
                      classId: enrollmentForm.classId,
                      role: enrollmentForm.role
                    });
                  } catch (e) { console.warn('Failed to log activity:', e); }
                  await loadData();
                  setEnrollmentForm({ userId: '', classId: '', role: 'student', programId: '', subjectId: '', year: '', term: '' });
                  toast?.showSuccess('Enrollment added successfully!');
                } else {
                  toast?.showError('Error: ' + result.error);
                }
              } catch (error) {
                toast?.showError('Error: ' + error.message);
              } finally {
                setLoading(false);
              }
            }} className="activity-form">
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                <Select
                  searchable
                  placeholder={t('select_user')}
                  value={enrollmentForm.userId}
                  onChange={e => setEnrollmentForm({ ...enrollmentForm, userId: e.target.value })}
                  options={[
                    { value: '', label: t('select_user') || 'Select User' },
                    ...users.map(u => ({
                      value: u.docId || u.id,
                      label: `${u.email}${u.displayName ? ` (${u.displayName})` : ''}`
                    }))
                  ]}
                  required
                />

                <Select
                  searchable
                  placeholder={t('select_program') || 'Select Program'}
                  value={enrollmentForm.programId}
                  onChange={handleEnrollmentProgramChange}
                  options={enrollmentProgramOptions}
                  required
                />
                
                <Select
                  searchable
                  placeholder={t('select_subject') || 'Select Subject'}
                  value={ensureString(enrollmentForm.subjectId || '')}
                  onChange={handleEnrollmentSubjectChange}
                  options={enrollmentSubjectOptions}
                  required
                />

                <Select
                  searchable
                  placeholder={t('select_class')}
                  value={enrollmentForm.classId}
                  onChange={(value) => setEnrollmentForm(prev => ({ ...prev, classId: value }))}
                  disabled={!enrollmentForm.subjectId}
                  options={enrollmentClassOptions}
                  required
                />

                <Select
                  searchable
                  placeholder={t('role') || 'Role'}
                  value={enrollmentForm.role}
                  onChange={e => setEnrollmentForm({ ...enrollmentForm, role: e.target.value })}
                  options={[
                    { value: 'student', label: t('student') || 'Student' }
                  ]}
                  disabled
                />
              </div>

              <div className="form-actions" style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-start' }}>
                <Button type="submit" variant="primary" disabled={loading} size="medium">
                  {t('save') || 'Save'}
                </Button>
              </div>
            </form>

            {/* Filters - like HR Penalties */}
            <div style={{ marginTop: '1rem', marginBottom: '1rem', padding: '0.75rem', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
                <Select
                  searchable
                  placeholder={t('all_programs') || 'All Programs'}
                  value={ensureString(enrollmentProgramFilter || 'all')}
                  onChange={(e) => {
                    const newValue = ensureString(e.target.value);
                    console.log('🔄 [Enrollment Filter] Program changed:', newValue);
                    setEnrollmentProgramFilter(newValue);
                  }}
                  options={enrollmentFilterProgramOptions}
                  fullWidth
                />
                <Select
                  searchable
                  placeholder={t('all_subjects') || 'All Subjects'}
                  value={ensureString(enrollmentSubjectFilter || 'all')}
                  onChange={(e) => {
                    const newValue = ensureString(e.target.value);
                    console.log('🔄 [Enrollment Filter] Subject changed:', newValue);
                    setEnrollmentSubjectFilter(newValue);
                  }}
                  options={enrollmentFilterSubjectOptions}
                  fullWidth
                />
                <Select
                  searchable
                  placeholder={t('all_classes') || 'All Classes'}
                  value={ensureString(enrollmentClassFilter || 'all')}
                  onChange={(e) => {
                    const newValue = ensureString(e.target.value);
                    console.log('🔄 [Enrollment Filter] Class changed:', newValue);
                    setEnrollmentClassFilter(newValue);
                  }}
                  options={enrollmentFilterClassOptions}
                  fullWidth
                />
              </div>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <AdvancedDataGrid
                rows={enrollments.filter(e => {
                  // Filter by program
                  if (enrollmentProgramFilter && enrollmentProgramFilter !== 'all') {
                    const classItem = classes.find(c => (c.docId || c.id) === e.classId);
                    if (!classItem?.subjectId) return false;
                    const subject = subjects.find(s => (s.docId || s.id) === classItem.subjectId);
                    if (!subject || subject.programId !== enrollmentProgramFilter) return false;
                  }
                  // Filter by subject
                  if (enrollmentSubjectFilter && enrollmentSubjectFilter !== 'all') {
                    const classItem = classes.find(c => (c.docId || c.id) === e.classId);
                    if (!classItem || classItem.subjectId !== enrollmentSubjectFilter) return false;
                  }
                  // Filter by class
                  if (enrollmentClassFilter && enrollmentClassFilter !== 'all') {
                    if (e.classId !== enrollmentClassFilter) return false;
                  }
                  return true;
                })}
                getRowId={(row) => row.docId || row.id}
                columns={[
                {
                  field: 'userId', headerName: t('user_col'), flex: 1, minWidth: 250,
                  renderCell: (params) => {
                    const user = users.find(u => (u.docId || u.id) === params.value);
                    return user ? `${user.displayName || user.realName || '—'}${user.email ? ` (${user.email})` : ''}` : params.value;
                  }
                },
                {
                  field: 'programName',
                  headerName: t('program') || 'Program',
                  flex: 1,
                  minWidth: 180,
                  valueGetter: (params) => {
                    // Try to get the program name directly from the row
                    const row = params.row || {};
                    const programName = row.programName || 
                                     (row.program && (row.program.name_en || row.program.name)) ||
                                     (row.programId && programs.find(p => (p.docId || p.id) === row.programId)?.name_en);
                    
                    console.log('Program data:', {
                      paramsValue: params.value,  // This is the value from the field
                      row: row,
                      programName: row.programName,
                      program: row.program,
                      programId: row.programId,
                      foundProgram: row.programId && programs.find(p => (p.docId || p.id) === row.programId),
                      finalValue: programName || 'N/A'
                    });
                    
                    return programName || params.value || 'N/A';
                  }
                },
                {
                  field: 'subjectName',
                  headerName: t('subject_col') || 'Subject',
                  flex: 1,
                  minWidth: 180,
                  valueGetter: (params) => {
                    // Try to get the subject name directly from the row
                    const row = params.row || {};
                    const subjectName = row.subjectName || 
                                     (row.subject && (row.subject.name_en || row.subject.name)) ||
                                     (row.subjectId && subjects.find(s => (s.docId || s.id) === row.subjectId)?.name_en);
                    
                    console.log('Subject data:', {
                      paramsValue: params.value,  // This is the value from the field
                      row: row,
                      subjectName: row.subjectName,
                      subject: row.subject,
                      subjectId: row.subjectId,
                      foundSubject: row.subjectId && subjects.find(s => (s.docId || s.id) === row.subjectId),
                      finalValue: subjectName || 'N/A'
                    });
                    
                    return subjectName || params.value || 'N/A';
                  }
                },
                {
                  field: 'classId', headerName: t('class_col'), flex: 1, minWidth: 200,
                  renderCell: (params) => {
                    const classItem = classes.find(c => (c.docId || c.id) === params.value);
                    if (!classItem) return params.value;
                    const codePart = classItem.code ? ` (${classItem.code})` : '';
                    return `${classItem.name}${codePart}`;
                  }
                },
                {
                  field: 'role', headerName: t('role_col'), width: 150,
                  renderCell: (params) => {
                    const roleMap = {
                      'student': '👨‍🎓 Student',
                      'ta': '👨‍🏫 TA',
                      'instructor': '👩‍🏫 Instructor'
                    };
                    return roleMap[params.value] || params.value;
                  }
                },
                {
                  field: 'createdAt', headerName: t('enrolled_col'), width: 180,
                  valueGetter: (params) => params.value,
                  renderCell: (params) => params.value ? formatQatarDateOnly(params.value?.toDate ? params.value.toDate() : (params.value?.seconds ? new Date(params.value.seconds * 1000) : new Date(params.value))) : 'Unknown'
                },
                {
                  field: 'actions', headerName: t('actions') || 'Actions', width: 120, sortable: false, filterable: false,
                  renderCell: (params) => (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button size="sm" variant="ghost" className="deleteHover" icon={<Trash size={16} />} style={{ color: '#dc2626' }} onClick={() => {
                        const enrollment = params.row;
                        const user = users.find(u => (u.docId || u.id) === enrollment.userId);
                        const classItem = classes.find(c => (c.docId || c.id) === enrollment.classId);
                        // Submissions are quiz/activity submissions (student work)
                        const userSubmissions = submissions.filter(s => s.userId === enrollment.userId && s.activityId);
                        const relatedActivities = activities.filter(a => a.classId === enrollment.classId);
                        
                        // Create readable item name
                        const userName = user ? (user.displayName || user.realName || user.email || 'Unknown User') : 'Unknown User';
                        const className = classItem ? (classItem.name || classItem.code || 'Unknown Class') : 'Unknown Class';
                        const itemName = `${userName} → ${className}`;
                        
                        setDeleteModal({
                          open: true,
                          item: { ...enrollment, _displayName: itemName },
                          type: 'enrollment',
                          onConfirm: async () => {
                            try {
                              const result = await deleteEnrollment(enrollment.docId);
                              if (result.success) {
                                // Log activity
                                try {
                                  await logActivity(ACTIVITY_TYPES.ENROLLMENT_DELETED, {
                                    enrollmentId: enrollment.docId,
                                    userId: enrollment.userId,
                                    classId: enrollment.classId
                                  });
                                } catch (e) { console.warn('Failed to log activity:', e); }
                                await loadData();
                                toast?.showSuccess('Enrollment removed successfully!');
                                setDeleteModal({ open: false, item: null, type: null, onConfirm: null });
                              } else {
                                toast?.showError('Error: ' + result.error);
                                setDeleteModal({ open: false, item: null, type: null, onConfirm: null });
                              }
                            } catch (error) {
                              toast?.showError('Error: ' + error.message);
                              setDeleteModal({ open: false, item: null, type: null, onConfirm: null });
                            }
                          },
                          relatedData: {
                            'Activity/Quiz Submissions': userSubmissions.map(s => ({
                              ...s,
                              _label: `Activity/Quiz Submission`
                            })),
                            'Related Activities': relatedActivities
                          },
                          warningMessage: userSubmissions.length > 0 
                            ? `This enrollment has ${userSubmissions.length} activity/quiz submission(s) that should be deleted first.`
                            : null
                        });
                      }}>
                        {t('delete') || 'Delete'}
                      </Button>
                    </div>
                  )
                }
              ]}
              pageSize={10}
              pageSizeOptions={[5, 10, 20, 50]}
              checkboxSelection
              exportFileName="enrollments"
              showExportButton
              exportLabel={t('export') || 'Export'}
            />
            </div>
          </div>
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
          <div className="submissions-tab">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 12,
                marginBottom: '0.75rem',
                alignItems: 'center'
              }}
            >
              <Select
                value={activityFilter}
                onChange={(e) => setActivityFilter(e.target.value)}
                options={[
                  { value: 'all', label: t('all_activities') || 'All Activities' },
                  ...activities.map(a => ({ value: a.id || a.docId, label: a.title_en || a.title_ar || a.id }))
                ]}
                searchable
                fullWidth
              />
              <Select
                searchable
                value={submissionStudentFilter}
                onChange={(e) => setSubmissionStudentFilter(e.target.value)}
                options={[
                  { value: 'all', label: t('all_students') || 'All Students' },
                  ...users.map(u => ({
                    value: u.docId || u.id,
                    label: `${u.email}${u.displayName ? ` (${u.displayName})` : ''}`
                  }))
                ]}
                fullWidth
              />
              <Select
                value={submissionStatusFilter}
                onChange={(e) => setSubmissionStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: t('all_statuses') || 'All Status' },
                  { value: 'pending', label: t('pending') || 'Pending' },
                  { value: 'graded', label: t('graded') || 'Graded' },
                  { value: 'late', label: t('late') || 'Late' }
                ]}
                searchable
                fullWidth
              />
              <Select
                value={submissionScoreFilter}
                onChange={(e) => setSubmissionScoreFilter(e.target.value)}
                options={[
                  { value: 'all', label: t('all_scores') || 'All Scores' },
                  { value: 'graded', label: t('graded_only') || 'Graded only' },
                  { value: 'not_graded', label: t('not_graded_only') || 'Not graded yet' }
                ]}
                searchable
                fullWidth
              />
            </div>
            <AdvancedDataGrid
              rows={filteredSubmissions}
              getRowId={(row) => row.id || row.docId}
              columns={[
                {
                  field: 'activityId', headerName: t('activity_col'), flex: 1, minWidth: 200,
                  renderCell: (params) => {
                    const activity = activities.find(a => (a.id === params.value) || (a.docId === params.value));
                    return activity ? (activity.title_en || activity.title_ar || activity.id) : params.value;
                  }
                },
                {
                  field: 'userId', headerName: t('student_col'), flex: 1.5, minWidth: 260,
                  renderCell: (params) => {
                    const user = users.find(u => (u.docId || u.id) === params.value);
                    if (!user) return params.value;
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span>{user.displayName || user.realName || user.email || params.value}</span>
                        <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{user.email}</span>
                        {user.studentNumber && (
                          <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>#{user.studentNumber}</span>
                        )}
                      </div>
                    );
                  }
                },
                {
                  field: 'status', headerName: t('status_col'), width: 140,
                  renderCell: (params) => {
                    const statusMap = {
                      'submitted': '📝 Submitted',
                      'graded': '✅ Graded',
                      'late': '⏰ Late',
                      'pending': '⏳ Pending'
                    };
                    return statusMap[params.value] || params.value || '📝 Submitted';
                  }
                },
                {
                  field: 'score', headerName: t('score_col'), width: 140,
                  renderCell: (params) => {
                    const act = activities.find(a => a.id === params.row.activityId || a.docId === params.row.activityId);
                    const maxScore = act?.maxScore || 100;
                    return params.value !== null && params.value !== undefined ? `${params.value} / ${maxScore}` : 'Not graded yet';
                  }
                },
                {
                  field: 'submittedAt', headerName: t('submitted_at_col'), width: 180,
                  valueGetter: (params) => params.value,
                  renderCell: (params) => params.value ? formatDateTime(params.value) : (t('unknown') || 'Unknown')
                },
                {
                  field: 'files', headerName: t('files_col'), width: 150,
                  renderCell: (params) => {
                    if (!params.value || params.value.length === 0) return t('no_files') || 'No files';
                    return (
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {params.value.map((file, i) => (
                          <a
                            key={i}
                            href={file}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              background: '#e3f2fd',
                              color: '#1976d2',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              textDecoration: 'none',
                              fontSize: '0.8rem'
                            }}
                          >
                            File {i + 1}
                          </a>
                        ))}
                      </div>
                    );
                  }
                },
                {
                  field: 'actions', headerName: t('actions') || 'Actions', width: 120, sortable: false, filterable: false,
                  renderCell: (params) => (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        const submission = params.row;
                        const currentScore = (submission.score !== null && submission.score !== undefined)
                          ? String(submission.score)
                          : '';
                        setGradingSubmission(submission);
                        setGradingScore(currentScore);
                        setGradingModalOpen(true);
                      }}
                    >
                      {t('grade') || 'Grade'}
                    </Button>
                  )
                }
              ]}
              pageSize={15}
              pageSizeOptions={[5, 10, 15, 20, 50]}
              checkboxSelection
              exportFileName="submissions"
              showExportButton
              exportLabel={t('export') || 'Export'}
            />
          </div>
        )}
        {activeTab === 'users' && (
          <div className="users-tab">
            <p style={{ color: '#555', marginBottom: '1rem' }}>{t('invite_users_blurb')}</p>

            {editingUser && (
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
                <Edit size={16} /> Editing User: {editingUser.displayName || editingUser.email}
              </div>
            )}

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!userForm.email.trim()) {
                toast?.showError('Email is required');
                return;
              }

              setLoading(true);
              try {
                if (editingUser) {
                  const result = await updateUser(editingUser.docId, userForm);
                  if (!result.success) throw new Error(result.error || 'Failed to update user');
                  // Log activity
                  try {
                    await logActivity(ACTIVITY_TYPES.USER_UPDATED, {
                      userId: editingUser.docId,
                      userEmail: userForm.email,
                      userDisplayName: userForm.displayName,
                      userRole: userForm.role
                    });
                  } catch (e) { console.warn('Failed to log activity:', e); }
                  toast?.showSuccess('User updated successfully!');
                } else {
                  // Add to allowlist if checkbox is checked
                  if (autoAddToAllowlist && userForm.email) {
                    const targetList = userForm.role === 'admin' ? 'adminEmails' : 'allowedEmails';
                    const currentEmails = allowlist[targetList] || [];

                    if (!currentEmails.includes(userForm.email)) {
                      const updatedAllowlist = {
                        ...allowlist,
                        [targetList]: [...currentEmails, userForm.email]
                      };
                      setAllowlist(updatedAllowlist);

                      // Save to Firestore
                      try {
                        await updateAllowlist(updatedAllowlist);
                      } catch (allowlistError) {
                        toast?.showWarning('Failed to update allowlist: ' + allowlistError.message);
                      }
                    }
                    toast?.showSuccess(`Invite prepared. ${userForm.email} added to ${userForm.role} allowlist. Ask them to sign up.`);
                  } else {
                    toast?.showInfo('No changes saved. Provide an email or enable allowlist option.');
                  }
                }

                await loadData();
                setEditingUser(null);
                setUserForm({ email: '', displayName: '', realName: '', studentNumber: '', role: 'student' });
              } catch (error) {
                toast?.showError('Error: ' + error.message);
              } finally {
                setLoading(false);
              }
            }} className="activity-form">
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <Input
                  type="email"
                  placeholder={t('user_email_placeholder')}
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  required
                />
                <Input
                  type="text"
                  placeholder={t('user_display_name_placeholder')}
                  value={userForm.displayName}
                  onChange={(e) => setUserForm({ ...userForm, displayName: e.target.value })}
                />
                <Input
                  type="text"
                  placeholder={t('real_name_placeholder') || 'Real Name (First Last)'}
                  value={userForm.realName || ''}
                  onChange={(e) => setUserForm({ ...userForm, realName: e.target.value })}
                />
                <Input
                  type="text"
                  placeholder={t('student_number_placeholder') || 'Student Number (Optional)'}
                  value={userForm.studentNumber || ''}
                  onChange={(e) => setUserForm({ ...userForm, studentNumber: e.target.value })}
                />
                <Select
                  searchable
                  placeholder={t('role') || 'Role'}
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  options={[
                    { value: 'student', label: t('student') || 'Student' },
                    { value: 'instructor', label: t('instructor') || 'Instructor' },
                    { value: 'hr', label: t('hr') || 'HR' },
                    { value: 'admin', label: t('admin') || 'Admin' },
                    { value: 'superadmin', label: 'Super Admin' },
                  ]}
                  fullWidth
                />
              </div>

              {!editingUser && (
                <div className="form-row">
                  <ToggleSwitch
                    label="Auto-add email to student allowlist"
                    checked={autoAddToAllowlist}
                    onChange={(checked) => setAutoAddToAllowlist(checked)}
                  />
                </div>
              )}

              <div className="form-actions">
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <Button type="submit" variant="primary" loading={loading}>
                    {(editingUser ? t('update') : t('save'))}
                  </Button>
                  {editingUser && (
                    <Button type="button" variant="outline" onClick={() => {
                      setEditingUser(null);
                      setUserForm({ email: '', displayName: '', role: 'student' });
                    }}>
                      {t('cancel_edit') || 'Cancel Edit'}
                    </Button>
                  )}
                </div>
              </div>
            </form>

            <div style={{ marginTop: '1rem' }}>
              <AdvancedDataGrid
                rows={users}
              getRowId={(row) => row.docId || row.id}
              columns={[
                { field: 'email', headerName: t('email_col'), flex: 1, minWidth: 220 },
                { field: 'displayName', headerName: t('display_name_col'), flex: 1, minWidth: 180 },
                {
                  field: 'role', headerName: t('role_col'), width: 120,
                  renderCell: (params) => params.value || t('student')
                },
                {
                  field: 'status', 
                  headerName: t('status'), 
                  width: 120,
                  renderCell: (params) => {
                    const isDisabled = params.row.disabled || params.row.isDisabled;
                    const isArchived = params.row.archived || params.row.deleted;
                    
                    if (isArchived) {
                      return <span style={{ color: '#6b7280', fontWeight: 500 }}>{t('status_archived')}</span>;
                    } else if (isDisabled) {
                      return <span style={{ color: '#dc2626', fontWeight: 500 }}>{t('status_disabled')}</span>;
                    } else {
                      return <span style={{ color: '#28a745', fontWeight: 500 }}>{t('status_active')}</span>;
                    }
                  }
                },
                {
                  field: 'enrolledClasses', headerName: t('enrolled_classes_col'), width: 140,
                  valueGetter: (params) => {
                    const userId = params.row.docId || params.row.id;
                    const userEnrollments = enrollments.filter(e => {
                      const enrollmentUserId = e.userId || e.userDocId;
                      return enrollmentUserId === userId || (e.userEmail || e.email) === params.row.email;
                    });
                    return userEnrollments.length;
                  }
                },
                {
                  field: 'progress', headerName: t('progress'), width: 180,
                  renderCell: (params) => {
                    const userId = params.row.docId || params.row.id;
                    return (
                      <a
                        href={`/student-dashboard?userId=${userId}`}
                        style={{ color: 'var(--color-primary, #800020)', textDecoration: 'none', fontWeight: '600' }}
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`/student-dashboard?userId=${userId}`);
                        }}
                      >
                        View Dashboard →
                      </a>
                    );
                  }
                },
                {
                  field: 'createdAt', headerName: t('joined'), width: 180,
                  valueGetter: (params) => params.value,
                  renderCell: (params) => {
                    if (!params.value) return (t('unknown') || 'Unknown');
                    const date = params.value?.toDate ? params.value.toDate() : (params.value?.seconds ? new Date(params.value.seconds * 1000) : new Date(params.value));
                    if (isNaN(date.getTime())) return (t('unknown') || 'Unknown');
                    return formatQatarDate(date);
                  }
                },
                {
                  field: 'actions', headerName: t('actions_col'), width: 280, sortable: false, filterable: false,
                  renderCell: (params) => (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <Button size="sm" variant="ghost" icon={<Edit size={16} />} onClick={() => {
                        setEditingUser(params.row);
                        setUserForm({
                          email: params.row.email || '',
                          displayName: params.row.displayName || '',
                          realName: params.row.realName || '',
                          studentNumber: params.row.studentNumber || '',
                          role: params.row.role || 'student'
                        });
                      }}>
                        {t('edit') || 'Edit'}
                      </Button>
                      {(params.row.role || 'student') === 'student' && (
                        <Button 
                          size="sm" 
                          variant="primary" 
                          onClick={async () => {
                            const result = await impersonateUser(params.row.docId || params.row.id);
                            if (result.success) {
                              toast?.showSuccess(t('impersonation_started') || 'Now viewing as student');
                              navigate('/');
                            } else {
                              toast?.showError(result.error || 'Failed to impersonate');
                            }
                          }} 
                          title={t('impersonate_student') || 'View as Student'}
                        >
                          🎭
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={async () => {
                          try {
                            const { sendPasswordResetEmail } = await import('firebase/auth');
                            const { auth } = await import('../firebase/config');
                            await sendPasswordResetEmail(auth, params.row.email);
                            toast?.showSuccess(`Password reset email sent to ${params.row.email}`);
                          } catch (error) {
                            console.error('Error:', error);
                            toast?.showError('Failed: ' + error.message);
                          }
                        }}
                        title={t('reset_password') || 'Reset Password'}
                      >
                        🔑
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        icon={params.row.disabled || params.row.isDisabled ? <UserCheck size={16} /> : <UserX size={16} />}
                        style={{ color: params.row.disabled || params.row.isDisabled ? '#28a745' : '#dc2626' }}
                        onClick={async () => {
                          try {
                            const { updateUser } = await import('../firebase/firestore');
                            const userId = params.row.docId || params.row.id;
                            const isCurrentlyDisabled = params.row.disabled || params.row.isDisabled;
                            const result = await updateUser(userId, {
                              disabled: !isCurrentlyDisabled,
                              isDisabled: !isCurrentlyDisabled
                            });
                            if (result.success) {
                              // Log activity
                              try {
                                await logActivity(ACTIVITY_TYPES.USER_UPDATED, {
                                  userId: userId,
                                  userEmail: params.row.email,
                                  action: isCurrentlyDisabled ? 'enabled' : 'disabled'
                                });
                              } catch (e) { console.warn('Failed to log activity:', e); }
                              toast?.showSuccess(`User ${isCurrentlyDisabled ? 'enabled' : 'disabled'} successfully!`);
                              await loadData();
                            } else {
                              toast?.showError(result.error || 'Failed to update user');
                            }
                          } catch (error) {
                            console.error('Error:', error);
                            toast?.showError('Failed: ' + error.message);
                          }
                        }}
                        title={params.row.disabled || params.row.isDisabled ? 'Enable User' : 'Disable User'}
                      >
                        {params.row.disabled || params.row.isDisabled ? 'Enable' : 'Disable'}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        icon={<Trash size={16} />}
                        style={{ color: '#dc2626' }}
                        onClick={() => {
                          setUserToDelete(params.row);
                          setShowUserDeletionModal(true);
                        }}
                      >
                        {t('delete') || 'Delete'}
                      </Button>
                    </div>
                  )
                }
              ]}
              pageSize={10}
              pageSizeOptions={[5, 10, 20, 50]}
              checkboxSelection
              exportFileName="users"
              showExportButton
              exportLabel={t('export') || 'Export'}
            />
            </div>
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="resources-tab">
            <h2 style={{ display: 'none' }}>{t('resources_management')}</h2>

            {editingResource && (
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
                <Edit size={16} /> Editing Resource: {editingResource.title || editingResource.title_en}
              </div>
            )}

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!resourceForm.title.trim() || !resourceForm.url.trim()) {
                toast?.showError('Title and URL are required');
                return;
              }

              setLoading(true);
              try {
                const result = editingResource ?
                  await updateResource(editingResource.docId, resourceForm) :
                  await addResource(resourceForm);

                if (result.success) {
                  const resourceId = editingResource?.docId || result?.id;
                  
                  // Log activity
                  try {
                    await logActivity(editingResource ? ACTIVITY_TYPES.RESOURCE_UPDATED : ACTIVITY_TYPES.RESOURCE_CREATED, {
                      resourceId,
                      resourceTitle: resourceForm.title,
                      resourceType: resourceForm.type
                    });
                  } catch (e) { console.warn('Failed to log activity:', e); }

                  // Send email notification if requested (only for new resources)
                  if (!editingResource && resourceEmailOptions.sendEmail) {
                    try {
                      const emailResult = await sendEmail({
                        to: 'all_students',
                        subject: `New Resource: ${resourceForm.title}`,
                        message: `A new learning resource "${resourceForm.title}" has been added.\n\n${resourceForm.description}\n\nAccess it here: ${resourceForm.url}`,
                        type: 'resource'
                      });
                      if (emailResult.success) {
                        console.log('Resource notification email sent successfully');
                      }
                    } catch (emailError) {
                      console.warn('Failed to send resource email:', emailError);
                    }
                  }

                  // Create announcement if requested (only for new resources)
                  if (!editingResource && resourceEmailOptions.createAnnouncement) {
                    try {
                      const announcementData = {
                        title: `New Resource Available`,
                        content: `A new learning resource "${resourceForm.title}" has been added.\n\n${resourceForm.description}\n\nAccess it here: ${resourceForm.url}`,
                        target: 'global',
                        type: 'resource',
                        resourceId: resourceId
                      };

                      const addAnnouncement = (await import('../firebase/firestore')).addAnnouncement;
                      await addAnnouncement(announcementData);
                      console.log('Resource announcement created successfully');
                      try {
                        await notifyAllUsers(
                          `📚 New Resource: ${resourceForm.title}`,
                          resourceForm.description || 'New resource available',
                          'resource'
                        );
                      } catch (notifErr) {
                        console.warn('Failed to send bell notification for resource:', notifErr);
                      }
                    } catch (announcementError) {
                      console.warn('Failed to create resource announcement:', announcementError);
                    }
                  }

                  // If no announcement requested, still send bell notification for visibility
                  if (!editingResource && !resourceEmailOptions.createAnnouncement) {
                    try {
                      await notifyAllUsers(
                        `📚 New Resource: ${resourceForm.title}`,
                        resourceForm.description || 'New resource available',
                        'resource'
                      );
                    } catch (notifErr) {
                      console.warn('Failed to send bell notification for resource:', notifErr);
                    }
                  }

                  await loadData();
                  setResourceForm({ title: '', description: '', url: '', type: 'link', dueDate: '', optional: false, featured: false });
                  setResourceEmailOptions({ sendEmail: false, createAnnouncement: false });
                  setEditingResource(null);
                  toast?.showSuccess(editingResource ? 'Resource updated successfully!' : 'Resource created successfully!');
                } else {
                  toast?.showError(`Error ${editingResource ? 'updating' : 'creating'} resource: ` + result.error);
                }
              } catch (error) {
                toast?.showError(`Error ${editingResource ? 'updating' : 'creating'} resource: ` + error.message);
              } finally {
                setLoading(false);
              }
            }} className="activity-form">
              <div className="form-row">
                <Input
                  type="text"
                  placeholder={t('resource_title') + ' (EN)'}
                  value={resourceForm.title_en || resourceForm.title || ''}
                  onChange={(e) => setResourceForm({ ...resourceForm, title_en: e.target.value, title: e.target.value })}
                  required
                />
                <Input
                  type="text"
                  placeholder={t('resource_title') + ' (AR)'}
                  value={resourceForm.title_ar || ''}
                  onChange={(e) => setResourceForm({ ...resourceForm, title_ar: e.target.value })}
                />
                <Select
                  searchable
                  placeholder={t('type') || 'Resource Type'}
                  value={resourceForm.type}
                  onChange={(e) => setResourceForm({ ...resourceForm, type: e.target.value })}
                  options={[
                    { value: 'document', label: '📄 Document' },
                    { value: 'link', label: '🔗 Link' },
                    { value: 'video', label: '📺 Video' }
                  ]}
                />
              </div>

              <div className="form-row">
                <Textarea
                  placeholder={t('resource_description') + ' (EN)'}
                  value={resourceForm.description_en || resourceForm.description || ''}
                  onChange={(e) => setResourceForm({ ...resourceForm, description_en: e.target.value, description: e.target.value })}
                  rows={3}
                  fullWidth
                />
                <Textarea
                  placeholder={t('resource_description') + ' (AR)'}
                  value={resourceForm.description_ar || ''}
                  onChange={(e) => setResourceForm({ ...resourceForm, description_ar: e.target.value })}
                  rows={3}
                  fullWidth
                />
              </div>

              <div className="form-row">
                <UrlInput
                  placeholder={t('resource_url')}
                  value={resourceForm.url}
                  onChange={(e) => setResourceForm({ ...resourceForm, url: e.target.value })}
                  required
                  onOpen={(href) => console.debug('open resource url', href)}
                  onCopy={() => toast?.showSuccess(t('copied') || 'Copied')}
                  onClear={() => setResourceForm({ ...resourceForm, url: '' })}
                  fullWidth
                />
                <DatePicker
                  type="datetime"
                  value={resourceForm.dueDate}
                  onChange={(iso) => setResourceForm({ ...resourceForm, dueDate: iso })}
                  placeholder={t('due_date') + ' (' + t('optional') + ')'}
                />
              </div>

              <div className="form-row" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <ToggleSwitch
                  label={t('optional_resource')}
                  checked={resourceForm.optional}
                  onChange={(checked) => setResourceForm({ ...resourceForm, optional: checked })}
                />
                <ToggleSwitch
                  label="Featured Resource"
                  checked={resourceForm.featured}
                  onChange={(checked) => setResourceForm({ ...resourceForm, featured: checked })}
                />
                <ToggleSwitch
                  label="Send email notification"
                  checked={resourceEmailOptions.sendEmail}
                  onChange={(checked) => setResourceEmailOptions({ ...resourceEmailOptions, sendEmail: checked })}
                />
                <ToggleSwitch
                  label="Create announcement (bell notification)"
                  checked={resourceEmailOptions.createAnnouncement}
                  onChange={(checked) => setResourceEmailOptions({ ...resourceEmailOptions, createAnnouncement: checked })}
                />
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                  <Button type="submit" variant="primary" loading={loading}>
                    {(editingResource ? t('update') : t('save'))}
                  </Button>
                  {editingResource && (
                    <Button type="button" variant="outline" onClick={() => {
                      setEditingResource(null);
                      setResourceForm({ title: '', description: '', url: '', type: 'link', dueDate: '', optional: false, featured: false });
                      setResourceEmailOptions({ sendEmail: false, createAnnouncement: false });
                    }}>
                      {t('cancel_edit') || 'Cancel Edit'}
                    </Button>
                  )}
                </div>
              </div>
            </form>

            <div style={{ marginTop: '1rem' }}>
              <AdvancedDataGrid
                rows={resources}
              getRowId={(row) => row.docId || row.id}
              columns={[
                { field: 'title', headerName: t('title_col'), flex: 1, minWidth: 200 },
                {
                  field: 'type', headerName: t('type_col'), width: 140,
                  renderCell: (params) => {
                    const typeMap = {
                      'document': '📄 Document',
                      'link': '🔗 Link',
                      'video': '📺 Video'
                    };
                    return typeMap[params.value] || params.value;
                  }
                },
                {
                  field: 'description', headerName: t('description_col'), flex: 1, minWidth: 200,
                  renderCell: (params) => params.value ? (params.value.length > 50 ? params.value.substring(0, 50) + '...' : params.value) : (t('no_description') || 'No description')
                },
                {
                  field: 'dueDate', headerName: t('due_date_col'), width: 180,
                  valueGetter: (params) => params.value,
                  renderCell: (params) => {
                    if (!params.value) return (t('no_deadline') || 'No deadline');
                    const date = params.value?.toDate ? params.value.toDate() : (params.value?.seconds ? new Date(params.value.seconds * 1000) : new Date(params.value));
                    if (isNaN(date.getTime())) return (t('no_deadline') || 'No deadline');
                    return formatQatarDate(date);
                  }
                },
                {
                  field: 'optional', headerName: t('required_col'), width: 120,
                  renderCell: (params) => params.value ? (t('required_optional') || 'Optional') : (t('required_yes') || 'Required')
                },
                {
                  field: 'createdAt', headerName: 'Created', width: 180,
                  valueGetter: (params) => params.value,
                  renderCell: (params) => {
                    if (!params.value) return 'Unknown';
                    const date = params.value?.toDate ? params.value.toDate() : (params.value?.seconds ? new Date(params.value.seconds * 1000) : new Date(params.value));
                    if (isNaN(date.getTime())) return 'Unknown';
                    return formatQatarDate(date);
                  }
                },
                  {
                    field: 'actions', headerName: t('actions') || 'Actions', width: 200, sortable: false, filterable: false,
                    renderCell: (params) => (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button size="sm" variant="ghost" className="editHover" icon={<Edit size={16} />} onClick={() => {
                          setEditingResource(params.row);
                          setResourceForm({
                            title: params.row.title || '',
                            title_en: params.row.title_en || params.row.title || '',
                            title_ar: params.row.title_ar || '',
                            description: params.row.description || '',
                            description_en: params.row.description_en || params.row.description || '',
                            description_ar: params.row.description_ar || '',
                            url: params.row.url || '',
                            type: params.row.type || 'link',
                            dueDate: params.row.dueDate || '',
                            optional: params.row.optional || false,
                            featured: params.row.featured || false
                          });
                        }}>
                          Edit
                        </Button>
                        <Button size="sm" variant="ghost" className="deleteHover" icon={<Trash size={16} />} style={{ color: '#dc2626' }} onClick={() => {
                          setDeleteModal({
                            open: true,
                            item: params.row,
                            type: 'resource',
                            onConfirm: async () => {
                              const resource = params.row;
                              setResources(prev => prev.filter(r => r.docId !== resource.docId));
                              try {
                                const result = await deleteResource(resource.docId);
                                if (result.success) {
                                  // Log activity
                                  try {
                                    await logActivity(ACTIVITY_TYPES.RESOURCE_DELETED, {
                                      resourceId: resource.docId,
                                      resourceTitle: resource.title,
                                      resourceType: resource.type
                                    });
                                  } catch (e) { console.warn('Failed to log activity:', e); }
                                  toast?.showSuccess('Resource deleted successfully!');
                                  await loadData();
                                  setDeleteModal({ open: false, item: null, type: null, onConfirm: null });
                                } else {
                                  setResources(prev => [...prev, resource].sort((a, b) =>
                                    new Date(b.createdAt?.seconds ? b.createdAt.seconds * 1000 : b.createdAt) -
                                    new Date(a.createdAt?.seconds ? a.createdAt.seconds * 1000 : a.createdAt)
                                  ));
                                  toast?.showError('Error deleting resource: ' + result.error);
                                  setDeleteModal({ open: false, item: null, type: null, onConfirm: null });
                                }
                              } catch (error) {
                                setResources(prev => [...prev, resource].sort((a, b) =>
                                  new Date(b.createdAt?.seconds ? b.createdAt.seconds * 1000 : b.createdAt) -
                                  new Date(a.createdAt?.seconds ? a.createdAt.seconds * 1000 : a.createdAt)
                                ));
                                toast?.showError('Error deleting resource: ' + error.message);
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
              pageSizeOptions={[5, 10, 20, 50]}
              checkboxSelection
              exportFileName="resources"
              showExportButton
              exportLabel={t('export') || 'Export'}
            />
            </div>
          </div>
        )}

        {activeTab === 'smtp' && (
          <div className="smtp-tab">
            <div style={{ background: 'white', border: '1px solid #eee', borderRadius: 12, padding: '1.5rem', maxWidth: 760 }}>
              {(() => {
                if (!smtpLoading && !smtpConfig.__loaded) {
                  (async () => {
                    setSmtpLoading(true);
                    const r = await getSMTPConfig();
                    if (r.success && r.data) setSmtpConfig({ ...r.data, __loaded: true });
                    else setSmtpConfig(s => ({ ...s, __loaded: true }));
                    setSmtpLoading(false);
                  })();
                }
                return null;
              })()}
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Input
                    label="SMTP Host"
                    value={smtpConfig.host}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                    placeholder="smtp.gmail.com"
                    fullWidth
                  />
                  <NumberInput
                    label="SMTP Port"
                    value={smtpConfig.port}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, port: parseInt(e.target.value || '0') })}
                    placeholder="587"
                    fullWidth
                  />
                </div>
                <Input
                  label="Email Address"
                  type="email"
                  value={smtpConfig.user}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, user: e.target.value })}
                  placeholder="your-email@gmail.com"
                  fullWidth
                />
                <Input
                  label="App Password"
                  type="password"
                  value={smtpConfig.password}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, password: e.target.value })}
                  placeholder="16-character app password"
                  fullWidth
                />
                <Input
                  label="Sender Name"
                  value={smtpConfig.senderName}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, senderName: e.target.value })}
                  fullWidth
                />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                  <Button
                    variant="success"
                    onClick={async () => {
                      try {
                        setSmtpTesting(true);
                        const { httpsCallable } = await import('firebase/functions');
                        const { functions } = await import('../firebase/config');
                        const testSMTP = httpsCallable(functions, 'testSMTP');
                        const result = await testSMTP({ to: user?.email || smtpConfig.user });
                        if (result.data.success) {
                          toast?.showSuccess('Test email sent! Check your inbox.');
                        } else {
                          toast?.showError('Test failed: ' + result.data.error);
                        }
                      } catch (error) {
                        toast?.showError('Test failed: ' + (error.message || 'Unknown error'));
                      } finally {
                        setSmtpTesting(false);
                      }
                    }}
                    disabled={smtpTesting}
                  >
                    {smtpTesting ? 'Testing...' : '📧 Test SMTP'}
                  </Button>
                  <Button
                    variant="primary"
                    onClick={async () => {
                      try {
                        setSmtpSaving(true);
                        const payload = {
                          host: smtpConfig.host,
                          port: smtpConfig.port,
                          secure: smtpConfig.secure,
                          user: smtpConfig.user,
                          password: smtpConfig.password,
                          senderName: smtpConfig.senderName,
                        };
                        const r = await updateSMTPConfig(payload);
                        if (r.success) toast?.showSuccess('SMTP configuration saved!');
                        else toast?.showError('Failed: ' + r.error);
                      } finally {
                        setSmtpSaving(false);
                      }
                    }}
                  >
                    {smtpSaving ? 'Saving...' : 'Save Configuration'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="courses-tab">
            <p style={{ color: '#666', marginBottom: '1rem' }}>{t('manage_categories')}</p>

            {courses.length === 0 && (
              <div style={{ padding: '1.5rem', background: '#f8f9fa', borderRadius: 8, marginBottom: '1rem', textAlign: 'center' }}>
                <p style={{ marginBottom: '0.75rem', color: '#555' }}>{t('no_categories_yet')}</p>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await setCourse('programming', { name_en: 'Programming', name_ar: 'البرمجة', order: 1 });
                      await setCourse('computing', { name_en: 'Computing', name_ar: 'الحوسبة', order: 2 });
                      await setCourse('algorithm', { name_en: 'Algorithm', name_ar: 'الخوارزميات', order: 3 });
                      await setCourse('general', { name_en: 'General', name_ar: 'عام', order: 4 });
                      toast?.showSuccess('Default categories added!');
                      loadData();
                    } catch (err) {
                      toast?.showError('Failed to add defaults: ' + err.message);
                    }
                  }}
                  style={{ padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #800020, #600018)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' }}
                >
                  ➕ {t('add_default_categories')}
                </button>
              </div>
            )}

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!courseForm.id.trim()) { toast?.showError('Category ID required'); return; }
              try {
                await setCourse(courseForm.id, { name_en: courseForm.name_en, name_ar: courseForm.name_ar, order: Number(courseForm.order) || 0 });
                toast?.showSuccess(editingCourse ? 'Category updated!' : 'Category created!');
                setCourseForm({ id: '', name_en: '', name_ar: '', order: 0 });
                setEditingCourse(null);
                loadData();
              } catch (err) {
                toast?.showError('Failed to save category: ' + err.message);
              }
            }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: '1.5rem', padding: '1rem', background: '#f8f9fa', borderRadius: 8 }}>
              <Input
                placeholder="ID (e.g., python)"
                value={courseForm.id}
                onChange={(e) => setCourseForm({ ...courseForm, id: e.target.value.toLowerCase().trim() })}
                disabled={!!editingCourse}
                required
                fullWidth
              />
              <Input
                placeholder="Name (English)"
                value={courseForm.name_en}
                onChange={(e) => setCourseForm({ ...courseForm, name_en: e.target.value })}
                required
                fullWidth
              />
              <Input
                placeholder="Name (Arabic)"
                value={courseForm.name_ar}
                onChange={(e) => setCourseForm({ ...courseForm, name_ar: e.target.value })}
                fullWidth
              />
              <NumberInput
                placeholder="Order"
                value={courseForm.order}
                onChange={(e) => setCourseForm({ ...courseForm, order: e.target.value })}
                fullWidth
              />
              <Button type="submit" variant="primary">{editingCourse ? 'Update' : 'Add'}</Button>
              {editingCourse && <Button type="button" variant="outline" onClick={() => { setCourseForm({ id: '', name_en: '', name_ar: '', order: 0 }); setEditingCourse(null); }}>Cancel</Button>}
            </form>

            <AdvancedDataGrid
              rows={courses}
              getRowId={(row) => row.docId || row.id}
              columns={[
                {
                  field: 'docId', headerName: 'ID', width: 150,
                  renderCell: (params) => <code>{params.value}</code>
                },
                {
                  field: 'name_en', headerName: 'Name (EN)', flex: 1, minWidth: 200,
                  renderCell: (params) => params.value || '—'
                },
                {
                  field: 'name_ar', headerName: 'Name (AR)', flex: 1, minWidth: 200,
                  renderCell: (params) => params.value || '—'
                },
                {
                  field: 'order', headerName: 'Order', width: 100,
                  renderCell: (params) => params.value ?? 0
                },
                {
                  field: 'actions', headerName: 'Actions', width: 200, sortable: false, filterable: false,
                  renderCell: (params) => (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button size="sm" variant="ghost" className="editHover" icon={<Edit size={16} />} onClick={() => {
                        setCourseForm({
                          id: params.row.docId,
                          name_en: params.row.name_en || '',
                          name_ar: params.row.name_ar || '',
                          order: params.row.order || 0
                        });
                        setEditingCourse(params.row.docId);
                      }}>
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost" className="deleteHover" icon={<Trash size={16} />} style={{ color: '#dc2626' }} onClick={() => {
                        setDeleteModal({
                          open: true,
                          item: params.row,
                          type: 'category',
                          onConfirm: async () => {
                            await deleteCourse(params.row.docId);
                            toast?.showSuccess('Category deleted');
                            loadData();
                            setDeleteModal({ open: false, item: null, type: null, onConfirm: null });
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
              pageSizeOptions={[5, 10, 20, 50]}
              checkboxSelection
              exportFileName="categories"
              showExportButton
              exportLabel={t('export') || 'Export'}
            />
          </div>
        )}

        {activeTab === 'emailTemplates' && (
          <div className="email-templates-tab">
            <EmailTemplates />
          </div>
        )}

        {activeTab === 'emailLogs' && (
          <div className="email-logs-tab">
            <EmailLogs />
          </div>
        )}

        {activeTab === 'allowlist' && (
          <div className="allowlist-tab">
            <h2 style={{ display: 'none' }}>{t('allowlist_management')}</h2>

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
            console.log('📧 Newsletter Send - Starting...');
            console.log('Recipients:', to);
            console.log('Subject:', subject);
            console.log('Type:', type || 'newsletter');
            console.log('HTML Body length:', htmlBody?.length);

            // Ensure to is an array
            const recipients = Array.isArray(to) ? to : [to];

            // Validate recipients
            if (recipients.length === 0) {
              throw new Error('No recipients specified');
            }

            console.log('Calling sendEmail function...');
            const result = await sendEmail({
              to: recipients,
              subject: subject || 'Newsletter',
              html: htmlBody || '<p>No content</p>',
              type: type || 'newsletter'
            });

            console.log('📧 Send result:', result);

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
              console.error('❌ Error sending email:', result.error);
              throw new Error(result.error || 'Failed to send email');
            }

            console.log('✅ Email sent successfully!');
            // refresh logs list if we're on the tab
            loadData();
          } catch (error) {
            console.error('❌ Exception in onSend:', error);
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
                  const { auth } = await import('../firebase/config');
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
                  console.error('Error updating password:', error);
                  toast?.showError('Failed to update password: ' + error.message);
                }
              }}>
                <input
                  type="password"
                  placeholder="New password (min 6 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: 8, marginBottom: '1rem' }}
                />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => { setShowPasswordModal(false); setPasswordUser(null); setNewPassword(''); }} style={{ padding: '0.5rem 1rem', background: '#6c757d', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ padding: '0.5rem 1rem', background: 'linear-gradient(135deg, #800020, #600018)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Set Password</button>
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
              const { updateUser } = await import('../firebase/firestore');
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
                } catch (e) { console.warn('Failed to log activity:', e); }
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
              const { deleteUserCascade } = await import('../firebase/firestore');
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
                } catch (e) { console.warn('Failed to log activity:', e); }
                toast?.showSuccess(`✅ User deleted successfully! Removed ${totalRecords} related records.`);
                await loadData();
              } else {
                throw new Error(result.error || 'Failed to delete user');
              }
            }
          } catch (error) {
            console.error('Error deleting/archiving user:', error);
            toast?.showError('Failed to ' + (archiveUser ? 'archive' : 'delete') + ' user: ' + error.message);
            throw error;
          }
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, item: null, type: null, onConfirm: null, relatedData: null, warningMessage: null })}
        onConfirm={deleteModal.onConfirm || (() => {})}
        title={deleteModal.type === 'activity' ? 'Delete Activity' :
               deleteModal.type === 'announcement' ? 'Delete Announcement' :
               deleteModal.type === 'class' ? 'Delete Class' :
               deleteModal.type === 'resource' ? 'Delete Resource' :
               deleteModal.type === 'enrollment' ? 'Delete Enrollment' :
               deleteModal.type === 'category' ? 'Delete Category' : 'Confirm Deletion'}
        message={deleteModal.type === 'activity' ? 'Are you sure you want to delete this activity? This will also delete all related submissions.' :
                 deleteModal.type === 'announcement' ? 'Are you sure you want to delete this announcement?' :
                 deleteModal.type === 'class' ? 'Are you sure you want to delete this class? This will also delete all enrollments and related activities.' :
                 deleteModal.type === 'resource' ? 'Are you sure you want to delete this resource?' :
                 deleteModal.type === 'enrollment' ? 'Are you sure you want to delete this enrollment?' :
                 deleteModal.type === 'category' ? 'Are you sure you want to delete this category? Activities with this category will fallback to "General".' :
                 'Are you sure you want to delete this item? This action cannot be undone.'}
        itemName={deleteModal.item?._displayName || deleteModal.item?.title_en || deleteModal.item?.title || deleteModal.item?.name || deleteModal.item?.name_en || deleteModal.item?.code || deleteModal.item?.id}
        relatedData={deleteModal.relatedData}
        warningMessage={deleteModal.warningMessage}
        loading={loading}
      />

    </div >
  );
};

export default DashboardPage;
