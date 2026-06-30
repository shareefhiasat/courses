import React, { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense, useLayoutEffect } from 'react';
import { info, error, warn, debug } from '@services/utils/logger.js';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { MODE_TYPES } from '@utils/sharedTypes';
import { DASHBOARD_TAB_SCREEN_IDS } from '@config/navigationRegistry.js';
import { usePermissions } from '@hooks/usePermissions';
import Joyride from 'react-joyride';
import TourTooltip from '@ui/TourTooltip/TourTooltip';
import { Modal, Button, SimpleLoading } from '@ui';
import { GlobalLoadingFallback, useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { InfoTooltip } from '@ui';
import { RibbonTabs } from '@ui';
import './DashboardPage.css';

// ===== PHASE 1: Core Entities =====
const AnnouncementsPage = lazy(() => import('../academic/announcements/AnnouncementsPage.jsx'));
const ResourcesPage = lazy(() => import('../academic/resources/ResourcesPage.jsx'));
const ClassesPage = lazy(() => import('../academic/classes/ClassesPage.jsx'));
const ActivitiesPage = lazy(() => import('../academic/activities/ActivitiesPage.jsx'));
const ProgramsManagementPage = lazy(() => import('../academic/programs/ProgramsPage.jsx'));
const SubjectsManagementPage = lazy(() => import('../academic/subjects/SubjectsPage.jsx'));

// ===== LOOKUP MANAGEMENT PAGES =====
const ResourceTypesPage = lazy(() => import('../ResourceTypesPage.jsx'));
const PriorityTypesPage = lazy(() => import('../PriorityTypesPage.jsx'));
const UserRolesPage = lazy(() => import('../UserRolesPage.jsx'));
const SubjectTypesPage = lazy(() => import('../SubjectTypesPage.jsx'));
const AssessmentTypesPage = lazy(() => import('../AssessmentTypesPage.jsx'));
const QuestionTypesPage = lazy(() => import('../QuestionTypesPage.jsx'));
const AttendanceStatusTypesPage = lazy(() => import('../AttendanceStatusTypesPage.jsx'));
const EnrollmentStatusTypesPage = lazy(() => import('../EnrollmentStatusTypesPage.jsx'));
const ActivityTypesPage = lazy(() => import('../ActivityTypesPage.jsx'));
const BehaviorTypesPage = lazy(() => import('../BehaviorTypesPage.jsx'));
const ParticipationTypesPage = lazy(() => import('../ParticipationTypesPage.jsx'));
const PenaltyTypesPage = lazy(() => import('../PenaltyTypesPage.jsx'));

// ===== PHASE 2: Deferred Features =====
const CategoriesPage = lazy(() => import('../CategoriesPage.jsx'));
const UsersPage = lazy(() => import('../users/UsersPage.jsx'));
const LogsActivityPage = lazy(() => import('../system/LogsActivityPage.jsx'));
const EnrollmentsManagementPage = lazy(() => import('../academic/enrollments/EnrollmentsManagementPage.jsx'));
const EnrollmentsPage = lazy(() => import('../academic/enrollments/EnrollmentsPage.jsx'));
const ScheduledReportsPage = lazy(() => import('../feedback/reports/ScheduledReportsPage.jsx'));
const MarksPage = lazy(() => import('../academic/enrollments/grading/MarksPage.jsx'));
const PenaltiesPage = lazy(() => import('../operations/penalty/PenaltiesPage.jsx'));
const ParticipationPage = lazy(() => import('../operations/participation/ParticipationPage.jsx'));
const BehaviorPage = lazy(() => import('../operations/behavior/BehaviorPage.jsx'));
// const AnalyticsDashboardPage = lazy(() => import('../feedback/analytics/AnalyticsDashboardPage.jsx'));
// AllowlistPage removed - now using Keycloak for user management
const EmailTemplatesPage = lazy(() => import('../communications/email/EmailTemplatesPage.jsx'));
const NotificationLogsPage = lazy(() => import('../communications/notifications/NotificationLogsPage.jsx'));

// ===== FLEXIBLE SCHEDULING =====
const SummaryDashboardPage = lazy(() => import('../SummaryDashboardPage.jsx'));
const SchedulingCalendarPage = lazy(() => import('../SchedulingCalendarPage.jsx'));
const InstructorAvailabilityPage = lazy(() => import('../InstructorAvailabilityPage.jsx'));
const ClassroomAvailabilityPage = lazy(() => import('../ClassroomAvailabilityPage.jsx'));
const ClassroomsManagementPage = lazy(() => import('../ClassroomsManagementPage.jsx'));
const UserCategoryAccessPage = lazy(() => import('../UserCategoryAccessPage.jsx'));

const DashboardPage = () => {
  const { user, isAdmin, isSuperAdmin, isInstructor, isHR, loading: authLoading } = useAuth();
  const { canAccessScreen } = usePermissions();
  const { lang, t } = useLang();
  const { theme } = useTheme();
  const { startLoading } = useGlobalLoading();
  
  // Joyride tour state
  const [runTour, setRunTour] = useState(false);
  const [tourSteps, setTourSteps] = useState([]);

  // Memoized Joyride callback to persist tour completion
  const handleJoyrideCallback = useCallback((data) => {
    const { status, action } = data || {};
    if (status === 'finished' || status === 'skipped' || action === 'close') {
      setRunTour(false);
      try {
        localStorage.setItem(`dashboardHelpSeen_${lang}`, 'true');
      } catch {
        // ignore
      }
      // Notify child pages that the dashboard tour is done so they can start theirs
      window.dispatchEvent(new CustomEvent('dashboard-tour-finished'));
    }
  }, [lang]);
  const TourTooltipComponent = useMemo(() => TourTooltip({ tourSeenKey: `dashboardHelpSeen_${lang}` }), [lang]);
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('dashboardActiveTab') || MODE_TYPES.ACTIVITIES;
    return saved === 'courses' ? 'categories' : saved;
  });
  const [activeCategory, setActiveCategory] = useState(() => {
    // derive category from saved tab
    const map = {
      [MODE_TYPES.ACTIVITIES]: 'content', 
      [MODE_TYPES.ANNOUNCEMENTS]: 'content', 
      [MODE_TYPES.RESOURCES]: 'content',
      users: 'users', 
      // allowlist: 'users', - removed, now using Keycloak
      classes: 'academic', 
      enrollments: 'academic', 
      submissions: 'academic',
      /* smtp: 'communication' - DEPRECATED */ 
      emailTemplates: 'communication', 
      notificationLogs: 'communication',
      categories: 'settings', 
      logging: 'settings'
    };
    return map[localStorage.getItem('dashboardActiveTab') || MODE_TYPES.ACTIVITIES] || 'content';
  });

  const handleTabChange = useCallback((tab, { source = 'user', shouldEmit = true } = {}) => {
    if (!tab) {
      return;
    }
    
    // Start global loading for any tab change
    const tabItem = ribbonCategories
      .flatMap(cat => cat.items)
      .find(item => item.key === tab);
    const tabLabel = tabItem?.label || t('loading') || 'Loading';
    
    const stopLoading = startLoading({ 
      message: t('loading_tab') ? `${t('loading_tab')} ${tabLabel}` : `Loading ${tabLabel}...` 
    });
    
    // Check if this tab has a path (external navigation)
    if (tabItem?.path) {
      navigate(tabItem.path);
      stopLoading();
      return;
    }
    setActiveTab(tab);
    localStorage.setItem('dashboardActiveTab', tab);
    setHashProcessed(false); // Reset hash processed flag when tab changes manually
    
    // Stop loading after a short delay to allow lazy components to load
    setTimeout(() => stopLoading(), 500);
    // Tabs that should update the URL with query parameters
    const queryParamTabs = [MODE_TYPES.ACTIVITIES, MODE_TYPES.ANNOUNCEMENTS, MODE_TYPES.RESOURCES, 'users', /* 'allowlist' - removed, now using Keycloak */ 'programs', 'subjects', 'classes', 'enrollments', 'manage-enrollments', 'marks', 'penalty', 'participation', 'behavior', /* 'smtp' - DEPRECATED */ 'emailTemplates', 'notificationLogs', 'scheduled-reports', 'categories', 'logging', 'resource-types', 'priority-types', 'user-roles', 'subject-types', 'assessment-types', 'question-types', 'attendance-status-types', 'enrollment-status-types', 'activity-types', 'behavior-types', 'participation-types', 'penalty-types'];
    if (queryParamTabs.includes(tab)) {
      const searchParams = new URLSearchParams(location.search);
      searchParams.set('tab', tab);
      const newSearch = `?${searchParams.toString()}`;
      const nextUrl = `${location.pathname}${newSearch}`;
      const currentUrl = `${location.pathname}${location.search}`;
      if (currentUrl !== nextUrl) {
          debug('URL changed', {
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
        'enrollments': '#enrollments',
        'marks': '#marks',
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
          debug('Tab changed', {
        tab,
        source
      });
    }
  }, [navigate, location, t, startLoading]);

  // ===== PHASE 2: Email Templates Upload Feature =====
  const uploadDefaultEmailTemplates = useCallback(async () => {
    try {
      // Import the templates service
      const templatesServiceModule = await import('@services/business/templatesService');
      const { uploadDefaultTemplates: uploadTemplatesService } = templatesServiceModule;
      
      // Call the service method
      const result = await uploadTemplatesService();
      
      // Show user-friendly message
      if (result.message) {
        alert(result.message);
      }
      
      return result;
    } catch (error) {
      error('❌ Upload function error:', error);
      alert((t('error_uploading_templates') || 'Error uploading templates: ') + error.message);
      return { success: false, error: error.message };
    }
  }, [t]);

  // Make the function available globally for debugging (Phase 2 feature)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.uploadDefaultEmailTemplates = uploadDefaultEmailTemplates;
    }
  }, [uploadDefaultEmailTemplates, t]);

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

  // Show loading while auth is initializing to prevent useAuth errors
  // Note: Removed early return to avoid hooks order issues
  // ===== PHASE 1: Core Dashboard Tabs =====
  const ribbonCategories = useMemo(() => {
    const filterRibbonItems = (items) => {
      if (isSuperAdmin) return items;
      return items.filter((item) => {
        // Programs tab is super_admin only
        if (item.key === 'programs') return false;
        // Users tab is admin/HR only (not instructor/student)
        if (item.key === 'users' && !isAdmin && !isHR) return false;
        const screenId = DASHBOARD_TAB_SCREEN_IDS[item.key] || item.key;
        return canAccessScreen(screenId);
      });
    };

    const categories = [
    {
      id: 'content',
      label: t('content') || 'Content',
      items: [
        { key: MODE_TYPES.ACTIVITIES, label: t('activities') || 'Activities' },
        { key: MODE_TYPES.ANNOUNCEMENTS, label: t('announcements') || 'Announcements' },
        { key: MODE_TYPES.RESOURCES, label: t('resources') || 'Resources' }
      ]
    },
    {
      id: 'academic',
      label: t('academic') || 'Academic',
      items: [
        { key: 'programs', label: t('programs') || 'Programs' },
        { key: 'subjects', label: t('subjects') || 'Subjects' },
        { key: 'classes', label: t('classes') || 'Classes' }
      ]
    },
    {
      id: 'enrollments',
      label: t('enrollments') || 'Enrollments',
      items: [
        { key: 'enrollments', label: t('enrollments') || 'Enrollments' },
        { key: 'manage-enrollments', label: t('manage_enrollments') || 'Manage Enrollments' },
        { key: 'marks', label: t('mark_entry') || 'Marks Entry' }
      ]
    },
    {
      id: 'operations',
      label: t('operations') || 'Operations',
      items: [
        { key: 'penalty', label: t('penalty') || 'Penalty' },
        { key: 'participation', label: t('participation') || 'Participation' },
        { key: 'behavior', label: t('behavior') || 'Behavior' }
      ]
    },
    {
      id: 'users',
      label: t('users') || 'Users',
      items: [
        { key: 'users', label: t('users') || 'Users' },
        ...(isSuperAdmin ? [
          { key: 'user-category-access', label: t('user_access') || 'User Access' }
        ] : [])
      ]
    },
    {
      id: 'communication',
      label: t('communication') || 'Communication',
      items: [
        { key: 'emailTemplates', label: t('templates') || 'Templates' },
        { key: 'notificationLogs', label: t('notification_logs') || 'Notification Logs' },
        { key: 'scheduled-reports', label: t('scheduled_reports') || 'Scheduled Reports' }
      ]
    },
    {
      id: 'settings',
      label: t('settings') || 'Settings',
      items: [
        { key: 'categories', label: t('categories') || 'Categories' },
        { key: 'activity-types', label: t('activity_types') || 'Activity Types' },
        { key: 'behavior-types', label: t('behavior_types') || 'Behavior Types' },
        { key: 'participation-types', label: t('participation_types') || 'Participation Types' },
        { key: 'penalty-types', label: t('penalty_types') || 'Penalty Types' }
      ]
    },
    {
      id: 'flexible-scheduling',
      label: t('scheduling_and_availabilities') || t('scheduling') || 'Scheduling and Availabilities',
      items: [
        { key: 'summary-dashboard', label: t('summary_dashboard') || 'Summary Dashboard' },
        { key: 'scheduling-calendar', label: t('scheduling_calendar') || 'Scheduling Calendar' },
        ...(isSuperAdmin ? [
          { key: 'user-category-access', label: t('user_access') || 'User Access' }
        ] : []),
      ]
    },
    {
      id: 'availability-setup',
      label: t('availability_setup') || 'Availability Setup',
      items: [
        { key: 'instructor-availability', label: t('instructor_availability_setup') || t('instructor_availability') || 'Instructor Availability Setup' },
        { key: 'classroom-availability', label: t('room_availability_setup') || t('room_availability') || 'Room Availability Setup' },
      ]
    },
    {
      id: 'rooms',
      label: t('rooms') || 'Rooms',
      items: [
        { key: 'classrooms-management', label: t('rooms_management') || 'Rooms Management' },
      ]
    },
    {
      id: 'system-lookups',
      label: t('system_lookups') || 'System Lookups (Read-Only)',
      items: [
        { key: 'resource-types', label: t('resource_types') || 'Resource Types' },
        { key: 'priority-types', label: t('priority_types') || 'Priority Types' },
        { key: 'user-roles', label: t('user_roles') || 'User Roles' },
        { key: 'subject-types', label: t('subject_types') || 'Subject Types' },
        { key: 'assessment-types', label: t('assessment_types') || 'Assessment Types' },
        { key: 'question-types', label: t('question_types') || 'Question Types' },
        { key: 'attendance-status-types', label: t('attendance_status') || 'Attendance Status' },
        { key: 'enrollment-status-types', label: t('enrollment_status') || 'Enrollment Status' }
      ]
    }
    ];

    return categories
      .map((cat) => ({ ...cat, items: filterRibbonItems(cat.items) }))
      .filter((cat) => cat.items.length > 0);
  }, [t, isSuperAdmin, isAdmin, isHR, canAccessScreen]);
  // Build tour steps at start time — only include elements present in the DOM
  const buildTourSteps = useCallback(() => {
    const allSteps = [
      { target: '[data-tour="mode-switcher"]', content: t('tour.mode_switcher_content'), disableBeacon: true, placement: 'bottom' },
    ];

    // Add a step for each visible ribbon tab
    const tabDescriptions = {
      activities: t('tour.tab_activities') || 'Create and manage class activities, assignments, and quizzes.',
      announcements: t('tour.tab_announcements') || 'Post announcements visible to students in their classes.',
      resources: t('tour.tab_resources') || 'Upload and organize shared files and learning resources.',
      programs: t('tour.tab_programs') || 'Define academic programs (e.g., Diploma, Bachelor).',
      subjects: t('tour.tab_subjects') || 'Manage subjects offered under each program.',
      classes: t('tour.tab_classes') || 'Create and manage individual class sections.',
      enrollments: t('tour.tab_enrollments') || 'View and manage student enrollments across classes.',
      'manage-enrollments': t('tour.tab_manage_enrollments') || 'Enable/disable student access per class.',
      marks: t('tour.tab_marks') || 'Enter and manage student grades and marks.',
      penalty: t('tour.tab_penalty') || 'Record and track student penalties.',
      participation: t('tour.tab_participation') || 'Track student participation scores.',
      behavior: t('tour.tab_behavior') || 'Log and monitor student behavior incidents.',
      users: t('tour.tab_users') || 'Manage user accounts, roles, and permissions.',
      'user-category-access': t('tour.tab_user_access') || 'Configure category-level access per user role.',
      emailTemplates: t('tour.tab_email_templates') || 'Customize email notification templates.',
      notificationLogs: t('tour.tab_notification_logs') || 'View sent notification history and delivery status.',
      'scheduled-reports': t('tour.tab_scheduled_reports') || 'Configure automated report delivery schedules.',
      categories: t('tour.tab_categories') || 'Manage classification categories for activities and resources.',
      'activity-types': t('tour.tab_activity_types') || 'Configure activity type lookups (read-only).',
      'behavior-types': t('tour.tab_behavior_types') || 'Configure behavior type lookups.',
      'participation-types': t('tour.tab_participation_types') || 'Configure participation type lookups.',
      'penalty-types': t('tour.tab_penalty_types') || 'Configure penalty type lookups.',
      'summary-dashboard': t('tour.tab_summary_dashboard') || 'View scheduling overview and statistics.',
      'scheduling-calendar': t('tour.tab_scheduling_calendar') || 'Plan and manage class schedules on a calendar.',
      'instructor-availability': t('tour.tab_instructor_availability') || 'Set up instructor availability time slots.',
      'classroom-availability': t('tour.tab_classroom_availability') || 'Set up room availability for scheduling.',
      'classrooms-management': t('tour.tab_classrooms_management') || 'Manage classroom locations and capacities.',
      'resource-types': t('tour.tab_resource_types') || 'View resource type lookups (read-only).',
      'priority-types': t('tour.tab_priority_types') || 'View priority type lookups (read-only).',
      'user-roles': t('tour.tab_user_roles') || 'View user role definitions (read-only).',
      'subject-types': t('tour.tab_subject_types') || 'View subject type lookups (read-only).',
      'assessment-types': t('tour.tab_assessment_types') || 'View assessment type lookups (read-only).',
      'question-types': t('tour.tab_question_types') || 'View question type lookups (read-only).',
      'attendance-status-types': t('tour.tab_attendance_status_types') || 'View attendance status lookups (read-only).',
      'enrollment-status-types': t('tour.tab_enrollment_status_types') || 'View enrollment status lookups (read-only).',
    };
    ribbonCategories.forEach(cat => {
      cat.items.forEach(item => {
        const selector = `[data-tour="tab-${item.key}"]`;
        if (document.querySelector(selector)) {
          allSteps.push({
            target: selector,
            content: tabDescriptions[item.key] || item.label,
            disableBeacon: true,
            placement: 'bottom',
          });
        }
      });
    });

    allSteps.push(
      { target: '[data-tour="stats"]',         content: t('tour.stats_content'),         disableBeacon: true, placement: 'bottom' },
      { target: '[data-tour="filters"]',       content: t('tour.filters_content'),       disableBeacon: true, placement: 'bottom' },
      { target: '[data-tour="cards-grid"]',    content: t('tour.cards_grid_content'),    disableBeacon: true, placement: 'top' },
    );
    return allSteps.filter(s => !!document.querySelector(s.target));
  }, [t, ribbonCategories]);

  const startTour = useCallback(() => {
    const steps = buildTourSteps();
    if (steps.length === 0) return;
    setTourSteps(steps);
    setRunTour(true);
  }, [buildTourSteps]);

  useEffect(() => {
    const tourSeenKey = `dashboardHelpSeen_${lang}`;
    try { if (!localStorage.getItem(tourSeenKey)) startTour(); } catch {}
  }, [lang, startTour]);

  // Auto-start on demand via app event in HomePage (optional)
  useEffect(() => {
    window.addEventListener('app:joyride', startTour);
    window.addEventListener('app:help', startTour);
    return () => {
      window.removeEventListener('app:joyride', startTour);
      window.removeEventListener('app:help', startTour);
    };
  }, []);
  // Delete confirmation modal (shared across child pages via context if needed)
  const [deleteModal, setDeleteModal] = useState({ open: false, item: null, type: null, onConfirm: null, relatedData: null, warningMessage: null });
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
    if (location.hash) {
      const hash = location.hash.substring(1); // Remove #
      const hashToHashMap = {
        programs: 'programs',
        subjects: 'subjects',
        classes: 'classes',
        users: 'users',
        enrollments: 'manage-enrollments',
        marks: 'marks',
        penalty: 'penalty',
        participation: 'participation',
        behavior: 'behavior',
        'user-category-access': 'user-category-access',
        'instructor-availability': 'instructor-availability',
        'classroom-availability': 'classroom-availability',
      };
      const tab = hashToHashMap[hash];
      if (tab && tab !== activeTab) {
        setActiveTab(tab);
        localStorage.setItem('dashboardActiveTab', tab);
        setHashProcessed(true);
      }
    } else if (!location.hash && hashProcessed) {
      // Hash was cleared, reset flag
      setHashProcessed(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.hash, location.search]);
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);
  if (authLoading) {
    return <GlobalLoadingFallback />;
  }
  if (!user || !(isAdmin || isSuperAdmin || isInstructor || isHR)) {
    return (
      <div className="dashboard-page">
        <div className="access-denied">
          <h2>{t('access_denied') || 'Access Denied'}</h2>
          <p>{t('insufficient_privileges') || 'You need admin privileges to access this page.'}</p>
        </div>
    </div>
    );
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
          showSkipButton
          showProgress
          tooltipComponent={TourTooltipComponent}
          callback={handleJoyrideCallback}
          locale={{
            back: t('tour_back') || (lang === 'ar' ? 'السابق' : 'Back'),
            close: t('tour_close') || (lang === 'ar' ? 'إغلاق' : 'Close'),
            last: t('tour_finish') || (lang === 'ar' ? 'إنهاء' : 'Finish'),
            next: t('tour_next') || (lang === 'ar' ? 'التالي' : 'Next'),
            skip: t('tour_skip') || (lang === 'ar' ? 'تخطي' : 'Skip')
          }}
          styles={{
            // Use the app's primary color so the Joyride buttons (Back/Next) match other UI buttons
            // Fallback to blue if the CSS var is not defined
            options: {
              primaryColor: 'var(--color-primary, #1e90ff)',
              textColor: theme === 'dark' ? '#e5e7eb' : '#000',
              backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
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
        {/* ===== PHASE 2: Analytics Dashboard ===== */}
        {/* <Suspense fallback={null}>
           <AnalyticsDashboardPage />
         </Suspense> */}

         <div className="tab-content">
    <div className="tab-header">
      <h2>{(() => {
        const currentTabItem = ribbonCategories.flatMap(cat => cat.items).find(item => item.key === activeTab);
        return currentTabItem ? currentTabItem.label : (t('activity') || 'Activity');
      })()}</h2>
             <div className="tooltip-wrapper">
               <InfoTooltip contentKey={`help.${activeTab}`} />
             </div>
           </div>
        {/* ===== PHASE 1: Core Pages ===== */}
        <Suspense fallback={null}>
          {activeTab === MODE_TYPES.ACTIVITIES && (
            <ActivitiesPage />
          )}
          {activeTab === MODE_TYPES.ANNOUNCEMENTS && (
            <AnnouncementsPage />
          )}
          {activeTab === MODE_TYPES.RESOURCES && <ResourcesPage />}
          {activeTab === 'programs' && isSuperAdmin && (
            <ProgramsManagementPage />
          )}
          {activeTab === 'subjects' && (isSuperAdmin || isAdmin || isInstructor) && (
            <SubjectsManagementPage />
          )}
          {activeTab === 'classes' && (isSuperAdmin || isAdmin || isInstructor) && (
            <ClassesPage />
          )}
          {activeTab === 'marks' && (isSuperAdmin || isAdmin || isInstructor) && (
            <MarksPage />
          )}
          {activeTab === 'manage-enrollments' && (isSuperAdmin || isAdmin || isInstructor) && (
            <EnrollmentsManagementPage />
          )}
          {activeTab === 'penalty' && (isSuperAdmin || isAdmin || isInstructor) && (
            <PenaltiesPage />
          )}
          {activeTab === 'participation' && (isSuperAdmin || isAdmin || isInstructor) && (
            <ParticipationPage />
          )}
          {activeTab === 'behavior' && (isSuperAdmin || isAdmin || isInstructor) && (
            <BehaviorPage />
          )}
          {activeTab === 'scheduled-reports' && (isSuperAdmin || isAdmin) && (
            <ScheduledReportsPage />
          )}
          {activeTab === 'logging' && (
            <LogsActivityPage />
          )}
          {activeTab === 'enrollments' && <EnrollmentsPage />}
          {activeTab === 'users' && (isSuperAdmin || isAdmin || isHR) && <UsersPage />}
          {activeTab === 'categories' && <CategoriesPage isDashboardTab />}
          {activeTab === 'emailTemplates' && <EmailTemplatesPage />}
          {activeTab === 'notificationLogs' && <NotificationLogsPage />}
          
          {/* ===== LOOKUP MANAGEMENT PAGES ===== */}
          {activeTab === 'resource-types' && <ResourceTypesPage />}
          {activeTab === 'priority-types' && <PriorityTypesPage />}
          {activeTab === 'user-roles' && <UserRolesPage />}
          {activeTab === 'subject-types' && <SubjectTypesPage />}
          {activeTab === 'assessment-types' && <AssessmentTypesPage />}
          {activeTab === 'question-types' && <QuestionTypesPage />}
          {activeTab === 'attendance-status-types' && <AttendanceStatusTypesPage />}
          {activeTab === 'enrollment-status-types' && <EnrollmentStatusTypesPage />}
          {activeTab === 'activity-types' && <ActivityTypesPage />}
          {activeTab === 'behavior-types' && <BehaviorTypesPage />}
          {activeTab === 'participation-types' && <ParticipationTypesPage />}
          {activeTab === 'penalty-types' && <PenaltyTypesPage />}
          
          {/* AllowlistPage removed - now using Keycloak for user management */}
          
          {/* ===== FLEXIBLE SCHEDULING ===== */}
          {activeTab === 'summary-dashboard' && canAccessScreen('summary-dashboard') && <SummaryDashboardPage />}
          {activeTab === 'scheduling-calendar' && canAccessScreen('scheduling-calendar') && <SchedulingCalendarPage />}
          {activeTab === 'instructor-availability' && canAccessScreen('instructor-availability-setup') && <InstructorAvailabilityPage />}
          {activeTab === 'classroom-availability' && canAccessScreen('room-availability-setup') && <ClassroomAvailabilityPage />}
          {activeTab === 'classrooms-management' && canAccessScreen('rooms-management') && <ClassroomsManagementPage />}
          {activeTab === 'user-category-access' && canAccessScreen('user-category-access') && <UserCategoryAccessPage />}
        </Suspense>
        </div>
      </div>
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, item: null, type: null, onConfirm: null, relatedData: null, warningMessage: null })}
        title={t(`delete_${deleteModal.type}`) || t('confirm_deletion') || 'Confirm Deletion'}
        size="small"
      >
        <div style={{ padding: '1rem' }}>
          <p>{t(`delete_${deleteModal.type}_confirm`) || t('delete_confirm_generic') || 'Are you sure you want to delete this item? This action cannot be undone.'}</p>
          {deleteModal.warningMessage && (
            <p style={{ color: '#dc2626', fontSize: 'var(--font-size-sm)' }}>{deleteModal.warningMessage}</p>
          )}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <Button variant="outline" onClick={() => setDeleteModal({ open: false, item: null, type: null, onConfirm: null, relatedData: null, warningMessage: null })}>
              {t('cancel') || 'Cancel'}
            </Button>
            <Button variant="primary" onClick={deleteModal.onConfirm || (() => {})} style={{ backgroundColor: '#dc2626' }}>
              {t('delete') || 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div >
  );
};
export default DashboardPage;
