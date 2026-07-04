import React, { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense, useLayoutEffect } from 'react';
import { info, error, warn, debug } from '@services/utils/logger.js';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { MODE_TYPES } from '@utils/sharedTypes';
import { DASHBOARD_TAB_SCREEN_IDS } from '@config/navigationRegistry.js';
import { usePermissions } from '@hooks/usePermissions';
import { dispatchPageTourIfRegistered, registerTourAvailability, requestTourStart, releaseTour } from '@utils/tourScheduler';
import { getJoyrideBaseProps, getTourStyles, ribbonTabStep } from '@utils/tourConfig';
import Joyride from 'react-joyride';
import TourTooltip from '@ui/TourTooltip/TourTooltip';
import { Modal, Button, SimpleLoading } from '@ui';
import { GlobalLoadingFallback, useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { InfoTooltip } from '@ui';
import { RibbonTabs } from '@ui';
import { LOOKUPS, LOOKUP_TYPES } from '@constants/lookupTypes';
import './DashboardPage.css';

// ===== PHASE 1: Core Entities =====
const AnnouncementsPage = lazy(() => import('../academic/announcements/AnnouncementsPage.jsx'));
const ResourcesPage = lazy(() => import('../academic/resources/ResourcesPage.jsx'));
const ClassesPage = lazy(() => import('../academic/classes/ClassesPage.jsx'));
const ActivitiesPage = lazy(() => import('../academic/activities/ActivitiesPage.jsx'));
const ProgramsManagementPage = lazy(() => import('../academic/programs/ProgramsPage.jsx'));
const SubjectsManagementPage = lazy(() => import('../academic/subjects/SubjectsPage.jsx'));

// ===== LOOKUP MANAGEMENT =====
const LookupManagementPage = lazy(() => import('../LookupManagementPage.jsx'));

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
      releaseTour('dashboard-shell');
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
    const tabLabel = tabItem?.label || t('loading');
    
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
    const queryParamTabs = [MODE_TYPES.ACTIVITIES, MODE_TYPES.ANNOUNCEMENTS, MODE_TYPES.RESOURCES, 'users', /* 'allowlist' - removed, now using Keycloak */ 'programs', 'subjects', 'classes', 'enrollments', 'manage-enrollments', 'marks', 'penalty', 'participation', 'behavior', /* 'smtp' - DEPRECATED */ 'emailTemplates', 'notificationLogs', 'scheduled-reports', 'categories', 'logging', ...Object.values(LOOKUPS)];
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
      alert((t('error_uploading_templates')) + error.message);
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
      label: t('content'),
      items: [
        { key: MODE_TYPES.ACTIVITIES, label: t('activities') },
        { key: MODE_TYPES.ANNOUNCEMENTS, label: t('announcements') },
        { key: MODE_TYPES.RESOURCES, label: t('resources') }
      ]
    },
    {
      id: 'academic',
      label: t('academic'),
      items: [
        { key: 'programs', label: t('programs') },
        { key: 'subjects', label: t('subjects') },
        { key: 'classes', label: t('classes') }
      ]
    },
    {
      id: 'enrollments',
      label: t('enrollments'),
      items: [
        { key: 'enrollments', label: t('enrollments') },
        { key: 'manage-enrollments', label: t('manage_enrollments') },
        { key: 'marks', label: t('mark_entry') }
      ]
    },
    {
      id: 'operations',
      label: t('operations'),
      items: [
        { key: 'penalty', label: t('penalty') },
        { key: 'participation', label: t('participation') },
        { key: 'behavior', label: t('behavior') }
      ]
    },
    {
      id: 'users',
      label: t('users'),
      items: [
        { key: 'users', label: t('users') },
        ...(isSuperAdmin ? [
          { key: 'user-category-access', label: t('user_access') }
        ] : [])
      ]
    },
    {
      id: 'communication',
      label: t('communication'),
      items: [
        { key: 'emailTemplates', label: t('templates') },
        { key: 'notificationLogs', label: t('notification_logs') },
        { key: 'scheduled-reports', label: t('scheduled_reports') }
      ]
    },
    {
      id: 'settings',
      label: t('settings'),
      items: [
        { key: 'categories', label: t('categories') },
        { key: LOOKUPS.ACTIVITY_TYPES, label: t('activity_types') },
        { key: LOOKUPS.BEHAVIOR_TYPES, label: t('behavior_types') },
        { key: LOOKUPS.PARTICIPATION_TYPES, label: t('participation_types') },
        { key: LOOKUPS.PENALTY_TYPES, label: t('penalty_types') }
      ]
    },
    {
      id: 'flexible-scheduling',
      label: t('scheduling_and_availabilities'),
      items: [
        { key: 'summary-dashboard', label: t('summary_dashboard') },
        { key: 'scheduling-calendar', label: t('scheduling_calendar') },
      ]
    },
    {
      id: 'availability-setup',
      label: t('availability_setup'),
      items: [
        { key: 'instructor-availability', label: t('instructor_availability_setup') },
        { key: 'classroom-availability', label: t('room_availability_setup') },
      ]
    },
    {
      id: 'rooms',
      label: t('rooms'),
      items: [
        { key: 'classrooms-management', label: t('rooms_management') },
      ]
    },
    {
      id: 'system-lookups',
      label: t('system_lookups'),
      items: [
        { key: LOOKUPS.RESOURCE_TYPES, label: t('resource_types') },
        { key: LOOKUPS.PRIORITY_TYPES, label: t('priority_types') },
        { key: LOOKUPS.USER_ROLES, label: t('user_roles') },
        { key: LOOKUPS.SUBJECT_TYPES, label: t('subject_types') },
        { key: LOOKUPS.ASSESSMENT_TYPES, label: t('assessment_types') },
        { key: LOOKUPS.QUESTION_TYPES, label: t('question_types') },
        { key: LOOKUPS.ATTENDANCE_STATUS_TYPES, label: t('attendance_status') },
        { key: LOOKUPS.ENROLLMENT_STATUS_TYPES, label: t('enrollment_status') }
      ]
    }
    ];

    return categories
      .map((cat) => ({ ...cat, items: filterRibbonItems(cat.items) }))
      .filter((cat) => cat.items.length > 0);
  }, [t, isSuperAdmin, isAdmin, isHR, canAccessScreen]);
  // Build tour steps at start time — only include elements present in the DOM
  const buildTourSteps = useCallback(() => {
    const tabContent = (key, label) => {
      const dictKey = `tour.tab_${key}`;
      const translated = t(dictKey);
      if (translated === dictKey.replaceAll('_', ' ')) {
        return t('tour.tab_default', { label });
      }
      return translated;
    };

    const allSteps = [
      ribbonTabStep('[data-tour="mode-switcher"]', t('tour.mode_switcher_content')),
    ];

    ribbonCategories.forEach((cat) => {
      cat.items.forEach((item) => {
        const selector = `[data-tour="tab-${item.key}"]`;
        if (document.querySelector(selector)) {
          allSteps.push(ribbonTabStep(selector, tabContent(item.key, item.label)));
        }
      });
    });

    allSteps.push(
      ribbonTabStep('[data-tour="stats"]', t('tour.stats_content')),
      ribbonTabStep('[data-tour="filters"]', t('tour.filters_content')),
      { target: '[data-tour="cards-grid"]', content: t('tour.cards_grid_content'), disableBeacon: true, placement: 'top', spotlightPadding: 8 },
    );
    return allSteps.filter((s) => !!document.querySelector(s.target));
  }, [t, ribbonCategories]);

  useEffect(() => {
    return registerTourAvailability('dashboard-shell', {
      tourSeenKey: (l) => `dashboardHelpSeen_${l}`,
      getStepCount: () => buildTourSteps().length,
    });
  }, [buildTourSteps]);

  const startTour = useCallback(() => {
    const steps = buildTourSteps();
    if (steps.length === 0) return;
    requestTourStart('dashboard-shell', () => {
      setTourSteps(steps);
      setRunTour(true);
    });
  }, [buildTourSteps]);

  useEffect(() => {
    const tourSeenKey = `dashboardHelpSeen_${lang}`;
    try {
      if (localStorage.getItem(tourSeenKey)) return;
      startTour();
    } catch { /* ignore */ }
  }, [lang, startTour]);

  // Auto-start on demand via app event in HomePage (optional)
  useEffect(() => {
    const onHelp = () => {
      if (dispatchPageTourIfRegistered()) return;
      startTour();
    };
    window.addEventListener('app:joyride', onHelp);
    window.addEventListener('app:help', onHelp);
    return () => {
      window.removeEventListener('app:joyride', onHelp);
      window.removeEventListener('app:help', onHelp);
    };
  }, [startTour]);

  // After a nested page tour finishes, offer the dashboard shell tour if still unseen
  useEffect(() => {
    const onPageTourFinished = () => {
      try {
        const key = `dashboardHelpSeen_${lang}`;
        if (!localStorage.getItem(key)) {
          setTimeout(() => startTour(), 700);
        }
      } catch { /* ignore */ }
    };
    window.addEventListener('page-tour-finished', onPageTourFinished);
    return () => window.removeEventListener('page-tour-finished', onPageTourFinished);
  }, [lang, startTour]);

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
          <h2>{t('access_denied')}</h2>
          <p>{t('insufficient_privileges')}</p>
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
          {...getJoyrideBaseProps({ theme, t })}
          run={runTour}
          steps={tourSteps}
          tooltipComponent={TourTooltipComponent}
          callback={handleJoyrideCallback}
          styles={getTourStyles(theme)}
        />
        <div data-tour="mode-switcher" style={{ scrollMarginTop: 88 }}>
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
        return currentTabItem ? currentTabItem.label : (t('activity'));
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
          {LOOKUP_TYPES.has(activeTab) && <LookupManagementPage lookupType={activeTab} />}
          
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
        title={t(`delete_${deleteModal.type}`)}
        size="small"
      >
        <div style={{ padding: '1rem' }}>
          <p>{t(`delete_${deleteModal.type}_confirm`)}</p>
          {deleteModal.warningMessage && (
            <p style={{ color: '#dc2626', fontSize: 'var(--font-size-sm)' }}>{deleteModal.warningMessage}</p>
          )}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <Button variant="outline" onClick={() => setDeleteModal({ open: false, item: null, type: null, onConfirm: null, relatedData: null, warningMessage: null })}>
              {t('cancel')}
            </Button>
            <Button variant="primary" onClick={deleteModal.onConfirm || (() => {})} style={{ backgroundColor: '#dc2626' }}>
              {t('delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </div >
  );
};
export default DashboardPage;
