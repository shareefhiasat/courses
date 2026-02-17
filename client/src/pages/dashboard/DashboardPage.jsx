import React, { useState, useEffect, useRef, useCallback, lazy, Suspense, useLayoutEffect } from 'react';
import logger from '@utils/logger';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { MODE_TYPES } from '@utils/sharedTypes';
import Joyride from 'react-joyride';
import { Modal, Button, SimpleLoading } from '@ui';
import { GlobalLoadingFallback, useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { InfoTooltip } from '@ui';
import { RibbonTabs } from '@ui';
import './DashboardPage.css';

const CategoriesPage = lazy(() => import('../CategoriesPage'));
const AnnouncementsPage = lazy(() => import('../academic/announcements/AnnouncementsPage'));
const ResourcesPage = lazy(() => import('../academic/resources/ResourcesPage'));
const ClassesPage = lazy(() => import('../academic/classes/ClassesPage'));
const UsersPage = lazy(() => import('../users/UsersPage'));
const LogsActivityPage = lazy(() => import('../system/LogsActivityPage'));
const EnrollmentsManagementPage = lazy(() => import('../academic/enrollments/EnrollmentsManagementPage'));
const EnrollmentsPage = lazy(() => import('../academic/enrollments/EnrollmentsPage'));
const ActivitiesPage = lazy(() => import('../academic/activities/ActivitiesPage'));
const ScheduledReportsPage = lazy(() => import('../feedback/reports/ScheduledReportsPage'));
const ProgramsManagementPage = lazy(() => import('../academic/programs/ProgramsManagementPage'));
const SubjectsManagementPage = lazy(() => import('../academic/subjects/SubjectsManagementPage'));
const MarksPage = lazy(() => import('../academic/enrollments/grading/MarksPage'));
const ClassSchedulePage = lazy(() => import('../academic/classes/ClassSchedulePage'));
const PenaltiesPage = lazy(() => import('../operations/penalty/PenaltiesPage'));
const ParticipationPage = lazy(() => import('../operations/participation/ParticipationPage'));
const BehaviorPage = lazy(() => import('../operations/behavior/BehaviorPage'));
const AnalyticsDashboardPage = lazy(() => import('../feedback/analytics/AnalyticsDashboardPage'));
const AllowlistPage = lazy(() => import('../system/AllowlistPage'));
const EmailTemplatesPage = lazy(() => import('../communications/email/EmailTemplatesPage'));
const NotificationLogsPage = lazy(() => import('../communications/notifications/NotificationLogsPage'));

const DashboardPage = () => {
  const { user, isAdmin, isSuperAdmin, isInstructor, loading: authLoading } = useAuth();
  const { lang, t } = useLang();
  const { theme } = useTheme();
  const { startLoading } = useGlobalLoading();
  
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
      allowlist: 'users',
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
    const queryParamTabs = [MODE_TYPES.ACTIVITIES, MODE_TYPES.ANNOUNCEMENTS, MODE_TYPES.RESOURCES, 'users', 'allowlist', 'programs', 'subjects', 'classes', 'enrollments', 'manage-enrollments', 'marks', 'classschedule', 'penalty', 'participation', 'behavior', /* 'smtp' - DEPRECATED */ 'emailTemplates', 'notificationLogs', 'scheduled-reports', 'categories', 'logging'];
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
        'enrollments': '#enrollments',
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
  }, [navigate, location, t, startLoading]);

  // Upload default email templates to Firestore (smart upload - only missing templates)
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
      console.error('❌ Upload function error:', error);
      alert((t('error_uploading_templates') || 'Error uploading templates: ') + error.message);
      return { success: false, error: error.message };
    }
  }, []);

  // Make the function available globally for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.uploadDefaultEmailTemplates = uploadDefaultEmailTemplates;
      console.log((t('upload_function_available') || '🔧 Upload function available: ') + 'window.uploadDefaultEmailTemplates()');
    }
  }, [uploadDefaultEmailTemplates]);

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
  const ribbonCategories = [
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
        { key: 'penalty', label: t('penalty') },
        { key: 'participation', label: t('participation') },
        { key: 'behavior', label: t('behavior') }
      ]
    },
    {
      id: 'settings',
      label: t('settings'),
      items: [
        { key: 'categories', label: t('categories') },
        { key: 'logging', label: t('logs') }
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
    if (location.hash && !hashProcessed) {
      const hash = location.hash.substring(1); // Remove #
      const hashToHashMap = {
        'programs': 'programs',
        'subjects': 'subjects',
        'classes': 'classes',
        'enrollments': 'manage-enrollments',
        'marks': 'marks',
        'classschedule': 'classschedule'
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
  }, [location.hash]);
  useEffect(() => {
    if (!authLoading && (!user || !(isAdmin || isSuperAdmin || isInstructor))) {
      navigate('/');
    }
  }, [user, isAdmin, isSuperAdmin, isInstructor, authLoading, navigate]);
  if (authLoading) {
    return <GlobalLoadingFallback />;
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
  // Auth loading check with GlobalLoading
  if (authLoading) {
    return <GlobalLoadingFallback />;
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
        {/* Summary Cards with Filters */}
        <Suspense fallback={null}>
           <AnalyticsDashboardPage />
         </Suspense>

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
        <Suspense fallback={null}>
          {activeTab === MODE_TYPES.ACTIVITIES && (
            <ActivitiesPage />
          )}
          {activeTab === MODE_TYPES.ANNOUNCEMENTS && (
            <AnnouncementsPage />
          )}
          {activeTab === 'programs' && isSuperAdmin && (
            <ProgramsManagementPage />
          )}
          {activeTab === 'subjects' && (isSuperAdmin || isAdmin || isInstructor) && (
            <SubjectsManagementPage />
          )}
          {activeTab === 'marks' && (isSuperAdmin || isAdmin || isInstructor) && (
            <MarksPage />
          )}
          {activeTab === 'classschedule' && (isSuperAdmin || isAdmin || isInstructor) && (
            <ClassSchedulePage />
          )}
          {activeTab === 'manage-enrollments' && (isSuperAdmin || isAdmin || isInstructor) && (
            <EnrollmentsPage />
          )}
        </Suspense>
        
        <Suspense fallback={null}>
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
          {activeTab === 'classes' && (
            <ClassesPage />
          )}
          {activeTab === 'enrollments' && <EnrollmentsManagementPage />}
          {activeTab === 'users' && <UsersPage />}
          {activeTab === MODE_TYPES.RESOURCES && <ResourcesPage />}
          {activeTab === 'categories' && <CategoriesPage isDashboardTab />}
          {activeTab === 'emailTemplates' && <EmailTemplatesPage />}
          {activeTab === 'notificationLogs' && <NotificationLogsPage />}
          {activeTab === 'allowlist' && <AllowlistPage />}
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
            <p style={{ color: '#dc2626', fontSize: '0.875rem' }}>{deleteModal.warningMessage}</p>
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
