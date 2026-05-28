import React, { useEffect, useMemo, useState } from 'react';
import { useIsMobile } from '@hooks/useIsMobile';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { normalizeHexColor, DEFAULT_ACCENT, hexToRgbString } from '@utils/color';
import { ROLE_STRINGS } from '@utils/userUtils';
import { getThemedIcon } from '@constants/iconTypes';
import { TimerStopwatch } from '@ui';
import VersionDisplay from '@ui/VersionDisplay/VersionDisplay';
import { info, error, warn, debug } from '@services/utils/logger.js';
import { usePermissions } from '@hooks/usePermissions';

const SideDrawer = ({ isOpen, onClose }) => {
  const { user, isAdmin, isSuperAdmin, isHR, isInstructor, role, impersonating, stopImpersonation, logout } = useAuth();
  const { t, lang, toggleLang } = useLang();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { canAccessScreen: checkScreenAccess, roleCode, loading: permissionsLoading } = usePermissions();
  const [drawerWidth, setDrawerWidth] = useState(() => {
    try { return Math.min(600, Math.max(320, parseInt(localStorage.getItem('drawer_width') || '380', 10))); } catch { return 380; }
  });
  const [density, setDensity] = useState(() => {
    try { return document.documentElement.getAttribute('data-density') || 'compact'; } catch { return 'compact'; }
  });
  const [autoHide, setAutoHide] = useState(() => {
    try { return localStorage.getItem('drawer_auto_hide') === 'true'; } catch { return false; }
  });
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('drawer_collapsed') === 'true'; } catch { return false; }
  });
  const [isHovering, setIsHovering] = useState(false);
  const [pinTimer, setPinTimer] = useState(() => {
    try { return localStorage.getItem('pin_timer_widget') === 'true'; } catch { return false; }
  });
  const [stickyMode, setStickyMode] = useState(() => {
    try {
      const saved = localStorage.getItem('drawer_sticky_mode');
      const value = saved === null ? true : saved === 'true';
      return value;
    } catch {
      return true;
    }
  });
  const isMobile = useIsMobile();
  const [userAccentColor, setUserAccentColor] = useState(DEFAULT_ACCENT);
  const [navigationConfirmation, setNavigationConfirmation] = useState(null);
  
  // Load user's accent color
  useEffect(() => {
    if (!user?.id) return;
    const loadAccentColor = async () => {
      try {
        // Mock implementation - replace with GraphQL query
        info('🎨 Load accent color (mock) for user:', user.id);
        const color = DEFAULT_ACCENT; // Use default for now
        setUserAccentColor(color);
      } catch (e) {
        warn('[SideDrawer] Error loading accent color:', e);
      }
    };
    loadAccentColor();
    
    // Listen for accent color changes
    const handler = (e) => {
      if (e?.detail?.color) {
        setUserAccentColor(normalizeHexColor(e.detail.color, DEFAULT_ACCENT));
      }
    };
    window.addEventListener('accent-color-changed', handler);
    return () => window.removeEventListener('accent-color-changed', handler);
  }, [user]);
  
  useEffect(() => {
    try { localStorage.setItem('pin_timer_widget', String(pinTimer)); } catch {}
  }, [pinTimer]);
  useEffect(() => {
    try { localStorage.setItem('drawer_auto_hide', String(autoHide)); } catch {}
  }, [autoHide]);
  useEffect(() => {
    try { localStorage.setItem('drawer_collapsed', String(collapsed)); } catch {}
  }, [collapsed]);
  useEffect(() => {
    try { localStorage.setItem('drawer_sticky_mode', String(stickyMode)); } catch {}
    if (stickyMode && !collapsed && !isMobile) {
      const width = collapsed ? 80 : drawerWidth;
      document.documentElement.style.setProperty('--drawer-width', `${width}px`);
      document.documentElement.classList.add('drawer-sticky-open');
    } else {
      document.documentElement.style.removeProperty('--drawer-width');
      document.documentElement.classList.remove('drawer-sticky-open');
    }
    return () => {
      document.documentElement.style.removeProperty('--drawer-width');
      document.documentElement.classList.remove('drawer-sticky-open');
    };
  }, [stickyMode, collapsed, drawerWidth, isMobile]);
  useEffect(() => {
    const handler = (e) => setDensity((e && e.detail && e.detail.density) ? e.detail.density : (document.documentElement.getAttribute('data-density') || 'compact'));
    window.addEventListener('density-change', handler);
    return () => window.removeEventListener('density-change', handler);
  }, []);

  // Keyboard shortcut to toggle drawer (Cmd+M / Ctrl+M)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'm') {
        e.preventDefault();
        // Dispatch custom event for parent to handle toggle
        window.dispatchEvent(new CustomEvent('toggle-drawer'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  // removed per unified menu UX

  // Generic pinned links (paths)
  const [pinnedLinks, setPinnedLinks] = useState(() => {
    try {
      const raw = localStorage.getItem('pinned_links');
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    try { localStorage.setItem('pinned_links', JSON.stringify(pinnedLinks)); } catch {}
  }, [pinnedLinks]);
  const isPinned = (path) => pinnedLinks.includes(path);
  const togglePinLink = (path) => {
    setPinnedLinks(prev => prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      error('[SideDrawer] Logout failed:', error);
      // Even if logout fails, try to navigate to login
      navigate('/login');
    }
  };

  const confirmNavigation = (path, hash = null, label) => {
    // Check if there are any unsaved changes or incomplete tasks
    // For now, we'll add a simple confirmation for navigation
    // In a real app, you would check for actual unsaved changes
    setNavigationConfirmation({ path, hash, label });
  };

  const proceedNavigation = () => {
    if (navigationConfirmation) {
      const { path, hash } = navigationConfirmation;
      if (hash) {
        navigate(`${path}${hash}`);
        // Map hash to tab for dashboard
        const hashToTabMap = {
          '#programs': 'programs',
          '#subjects': 'subjects',
          '#classes': 'classes',
          '#enrollments': 'manage-enrollments',
          '#marks': 'marks',
          '#class-schedule': 'class-schedule'
        };
        if (path === '/dashboard' && hashToTabMap[hash]) {
          localStorage.setItem('dashboardActiveTab', hashToTabMap[hash]);
          window.dispatchEvent(new CustomEvent('dashboard-tab-change', { detail: { tab: hashToTabMap[hash] } }));
        }
      } else {
        navigate(path);
      }
      setNavigationConfirmation(null);
      if (!collapsed && !autoHide && !stickyMode) onClose();
    }
  };

  const cancelNavigation = () => {
    setNavigationConfirmation(null);
  };

  const handleStopImpersonation = () => {
    stopImpersonation();
    onClose();
  };

  const isActive = (path, hash = null) => {
    if (!path) return false;
    if (hash) {
      return location.pathname === path && location.hash === hash;
    }
    // For query parameter URLs, check if pathname matches and query params match
    if (path.includes('?')) {
      const [pathname, queryString] = path.split('?');
      const urlParams = new URLSearchParams(queryString);
      const currentParams = new URLSearchParams(location.search);
      
      if (location.pathname !== pathname) return false;
      
      // Check if all params in the link match current URL params
      for (const [key, value] of urlParams.entries()) {
        if (currentParams.get(key) !== value) return false;
      }
      // Also ensure current URL doesn't have extra params that make it more specific
      // For example, if link is "?mode=activities" and current is "?mode=activities&activityType=quiz",
      // the link should NOT be active
      for (const [key] of currentParams.entries()) {
        if (!urlParams.has(key)) return false;
      }
      return true;
    }
    return location.pathname === path;
  };
  const [showTimerPanel, setShowTimerPanel] = useState(false);

  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    main: true,
    quiz: false,
    classes: false,
    attendance: false,
    drive: false,
    analytics: false,
    community: false,
    tools: false,
    settings: false,
    review: false,
    records: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const footerShadowBase = useMemo(() => (
    theme === 'light'
      ? '0 6px 14px rgba(15,23,42,0.08)'
      : '0 6px 16px rgba(0,0,0,0.45)'
  ), [theme]);

  const footerShadowHover = useMemo(() => (
    theme === 'light'
      ? '0 12px 24px rgba(15,23,42,0.16)'
      : '0 12px 28px rgba(0,0,0,0.65)'
  ), [theme]);

  const headerHoverShadow = useMemo(() => (
    theme === 'light'
      ? '0 8px 18px rgba(15,23,42,0.18)'
      : '0 8px 22px rgba(0,0,0,0.65)'
  ), [theme]);

  const quickHoverShadow = useMemo(() => (
    theme === 'light'
      ? '0 6px 14px rgba(15,23,42,0.12)'
      : '0 6px 16px rgba(0,0,0,0.55)'
  ), [theme]);

  const footerButtonBase = useMemo(() => ({
    width: collapsed ? '56px' : '100%',
    padding: collapsed ? '0.55rem' : '0.85rem',
    borderRadius: 12,
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: collapsed ? '0.75rem' : '0.85rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease',
    boxShadow: footerShadowBase,
  }), [collapsed, footerShadowBase]);

  const langButtonStyle = useMemo(() => ({
    ...footerButtonBase,
    background: theme === 'light'
      ? 'linear-gradient(135deg, #f8fafc, #e2e8f0)'
      : 'linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.2))',
    color: theme === 'light' ? '#0f172a' : '#f8fafc',
    border: theme === 'light'
      ? '1px solid rgba(15,23,42,0.08)'
      : '1px solid rgba(255,255,255,0.18)'
  }), [footerButtonBase, theme]);

  const logoutButtonStyle = useMemo(() => ({
    ...footerButtonBase,
    background: 'linear-gradient(135deg, #f87171, #dc2626)',
    color: '#ffffff',
    border: '1px solid rgba(220,38,38,0.45)'
  }), [footerButtonBase]);

  const onFooterHover = (e) => {
    e.currentTarget.style.transform = 'translateY(-2px)';
    e.currentTarget.style.boxShadow = footerShadowHover;
  };

  const onFooterLeave = (e) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = footerShadowBase;
  };

  const onHeaderButtonEnter = (e) => {
    if (e.currentTarget.dataset.hoverBg) {
      e.currentTarget.style.background = e.currentTarget.dataset.hoverBg;
    }
    e.currentTarget.style.boxShadow = headerHoverShadow;
    e.currentTarget.style.transform = 'translateY(-1px)';
  };

  const onHeaderButtonLeave = (e) => {
    if (e.currentTarget.dataset.baseBg) {
      e.currentTarget.style.background = e.currentTarget.dataset.baseBg;
    }
    e.currentTarget.style.boxShadow = 'none';
    e.currentTarget.style.transform = 'translateY(0)';
  };

  const onQuickActionEnter = (e) => {
    if (e.currentTarget.dataset.hoverBg) {
      e.currentTarget.style.background = e.currentTarget.dataset.hoverBg;
    }
    e.currentTarget.style.boxShadow = quickHoverShadow;
    e.currentTarget.style.transform = 'translateY(-1px)';
  };

  const onQuickActionLeave = (e) => {
    if (e.currentTarget.dataset.baseBg) {
      e.currentTarget.style.background = e.currentTarget.dataset.baseBg;
    }
    e.currentTarget.style.boxShadow = 'none';
    e.currentTarget.style.transform = 'translateY(0)';
  };

  // Tree-structured navigation data
  const studentLinks = [
    {
      id: 'main',
      label: t('main') || 'MAIN',
      icon: getThemedIcon('ui', 'home', 18, theme),
      children: [
        { id: 'home', path: '/', icon: getThemedIcon('ui', 'home', 18, theme), label: (t('home') || 'Home').toUpperCase() },
        { id: 'student-dashboard', path: '/student-dashboard', icon: getThemedIcon('ui', 'layout_dashboard', 18, theme), label: (t('student_dashboard') || 'Student Dashboard').toUpperCase() },
        { id: 'progress', path: '/student-dashboard', icon: getThemedIcon('ui', 'bar_chart3', 18, theme), label: (t('progress') || 'Progress').toUpperCase() },
      ]
    },
    {
      id: 'activity',
      label: t('activity') || 'ACTIVITY',
      icon: getThemedIcon('ui', 'activity', 18, theme),
      children: [
        { id: 'activities', path: '/?mode=activities', icon: getThemedIcon('ui', 'activity', 18, theme), label: (t('activities') || 'Activities').toUpperCase() },
        { id: 'quiz-activity', path: '/?mode=activities&activityType=quiz', icon: getThemedIcon('ui', 'gamepad2', 18, theme), label: (t('quiz') || 'Quiz').toUpperCase() },
        { id: 'homework-activity', path: '/?mode=activities&activityType=homework', icon: getThemedIcon('ui', 'file_text', 18, theme), label: (t('homework') || 'Homework').toUpperCase() },
        { id: 'training-activity', path: '/?mode=activities&activityType=training', icon: getThemedIcon('activity_type', 'training', 18, theme), label: (t('training') || 'Training').toUpperCase() },
        { id: 'lab-activity', path: '/?mode=activities&activityType=lab_work', icon: getThemedIcon('activity_type', 'lab', 18, theme), label: 'LAB & PROJECT' },
      ]
    },
    {
      id: 'quiz',
      label: t('quiz') || 'QUIZ',
      icon: getThemedIcon('ui', 'list_checks', 18, theme),
      children: [
        { id: 'quiz-results', path: '/review-results?activityType=quiz', icon: getThemedIcon('ui', 'list_checks', 18, theme), label: (t('quizzes') || 'Quizzes').toUpperCase() },
        { id: 'homework-results', path: '/review-results?activityType=homework', icon: getThemedIcon('ui', 'file_text', 18, theme), label: (t('homework') || 'Homework').toUpperCase() },
        { id: 'training-results', path: '/review-results?activityType=training', icon: getThemedIcon('activity_type', 'training', 18, theme), label: (t('training') || 'Training').toUpperCase() },
        { id: 'lab-results', path: '/review-results?activityType=lab_work', icon: getThemedIcon('activity_type', 'lab', 18, theme), label: 'LAB & PROJECT' },
      ]
    },
    {
      id: 'classes',
      label: t('classes') || 'CLASSES',
      icon: getThemedIcon('ui', 'book_open', 18, theme),
      children: [
        { id: 'my-enrollments', path: '/my-enrollments', icon: getThemedIcon('ui', 'book_open', 18, theme), label: (t('my_enrollments') || 'My Enrollments').toUpperCase() },
        { id: 'class-schedules', path: '/class-schedules', icon: getThemedIcon('ui', 'calendar', 18, theme), label: (t('schedules') || 'Schedules').toUpperCase() },
      ]
    },
    {
      id: 'attendance',
      label: t('attendance') || 'ATTENDANCE',
      icon: getThemedIcon('ui', 'qr_code', 18, theme),
      children: [
        { id: 'my-attendance', path: '/my-attendance', icon: getThemedIcon('ui', 'qr_code', 18, theme), label: (t('my_attendance') || 'My Attendance').toUpperCase() },
      ]
    },
    {
      id: 'community',
      label: t('community') || 'COMMUNITY',
      icon: getThemedIcon('ui', 'message_square', 18, theme),
      children: [
        { id: 'chat', path: '/chat', icon: getThemedIcon('ui', 'message_square', 18, theme), label: (t('chat') || 'Chat').toUpperCase() },
        { id: 'resources', path: '/?mode=resources', icon: getThemedIcon('ui', 'book_open', 18, theme), label: (t('resources') || 'Resources').toUpperCase() },
      ]
    },
    {
      id: 'tools',
      label: t('tools') || 'TOOLS',
      icon: getThemedIcon('ui', 'timer', 18, theme),
      children: [
        { id: 'timerControl', key: 'timerControl', icon: getThemedIcon('ui', 'timer', 18, theme), label: (t('timer') || 'Timer').toUpperCase() }
      ]
    },
    {
      id: 'settings',
      label: t('settings') || 'SETTINGS',
      icon: getThemedIcon('ui', 'settings', 18, theme),
      children: [
        { id: 'notifications', path: '/notifications', icon: getThemedIcon('ui', 'bell', 18, theme), label: (t('notifications') || 'Notifications').toUpperCase() },
        { id: 'profile', path: '/profile', icon: getThemedIcon('ui', 'settings', 18, theme), label: (t('settings') || 'Settings').toUpperCase() },
      ]
    }
  ];

  // Admin & SuperAdmin: Full management view
  const adminLinks = [
    {
      id: 'main',
      label: t('main') || 'MAIN',
      icon: getThemedIcon('ui', 'home', 18, theme),
      children: [
        { id: 'home', path: '/', icon: getThemedIcon('ui', 'home', 18, theme), label: (t('home') || 'Home').toUpperCase() },
        { id: 'dashboard', path: '/dashboard', icon: getThemedIcon('ui', 'layout_dashboard', 18, theme), label: (t('dashboard') || 'Dashboard').toUpperCase() },
        { id: 'student-dashboard', path: '/student-dashboard', icon: getThemedIcon('ui', 'layout_dashboard', 18, theme), label: (t('student_dashboard') || 'Student Dashboard').toUpperCase() },
      ]
    },
    {
      id: 'activity',
      label: t('activity') || 'ACTIVITY',
      icon: getThemedIcon('ui', 'activity', 18, theme),
      children: [
        { id: 'activities', path: '/?mode=activities', icon: getThemedIcon('ui', 'activity', 18, theme), label: (t('activities') || 'Activities').toUpperCase() },
        { id: 'quiz-activity', path: '/?mode=activities&activityType=quiz', icon: getThemedIcon('ui', 'gamepad2', 18, theme), label: (t('quiz') || 'Quiz').toUpperCase() },
        { id: 'homework-activity', path: '/?mode=activities&activityType=homework', icon: getThemedIcon('ui', 'file_text', 18, theme), label: (t('homework') || 'Homework').toUpperCase() },
        { id: 'training-activity', path: '/?mode=activities&activityType=training', icon: getThemedIcon('activity_type', 'training', 18, theme), label: (t('training') || 'Training').toUpperCase() },
        { id: 'lab-activity', path: '/?mode=activities&activityType=lab_work', icon: getThemedIcon('activity_type', 'lab', 18, theme), label: 'LAB & PROJECT' },
      ]
    },
    {
      id: 'quiz',
      label: t('quiz') || 'QUIZ',
      icon: getThemedIcon('ui', 'list_checks', 18, theme),
      children: [
        { id: 'quizzes', path: '/quizzes', icon: getThemedIcon('ui', 'gamepad2', 18, theme), label: (t('quizzes') || 'Quizzes').toUpperCase() },
        { id: 'quiz-results', path: '/review-results?activityType=quiz', icon: getThemedIcon('ui', 'list_checks', 18, theme), label: (t('quiz_results') || 'Quiz Results').toUpperCase() },
      ]
    },
    ...(isSuperAdmin || isInstructor || isAdmin ? [{
      id: 'academic',
      label: t('academic') || 'ACADEMIC',
      icon: getThemedIcon('ui', 'book_open', 18, theme),
      children: [
        { id: 'programs', path: '/dashboard', hash: '#programs', icon: getThemedIcon('ui', 'book_open', 18, theme), label: (t('programs') || 'Programs').toUpperCase() },
        { id: 'subjects', path: '/dashboard', hash: '#subjects', icon: getThemedIcon('ui', 'book_open', 18, theme), label: (t('subjects') || 'Subjects').toUpperCase() },
        { id: 'classes-academic', path: '/dashboard', hash: '#classes', icon: getThemedIcon('ui', 'calendar', 18, theme), label: (t('classes') || 'Classes').toUpperCase() },
        { id: 'enrollments', path: '/dashboard', hash: '#enrollments', icon: getThemedIcon('ui', 'users', 18, theme), label: (t('enrollments') || 'Enrollments').toUpperCase() },
        { id: 'class-schedule', path: '/dashboard', hash: '#class-schedule', icon: getThemedIcon('ui', 'calendar', 18, theme), label: (t('class_schedules') || 'Class Schedule').toUpperCase() },
      ]
    }] : []),
    ...(isSuperAdmin || isInstructor || isAdmin ? [{
      id: 'records',
      label: t('academic_records') || 'ACADEMIC RECORDS',
      icon: getThemedIcon('ui', 'award', 18, theme),
      children: [
        { id: 'marks', path: '/dashboard', hash: '#marks', icon: getThemedIcon('ui', 'award', 18, theme), label: (t('marks_entry') || 'Marks Entry').toUpperCase() },
        { id: 'penalty', path: '/penalty', icon: getThemedIcon('ui', 'alert_triangle', 18, theme), label: (t('penalty') || 'Penalty').toUpperCase() },
        { id: 'participation', path: '/participation', icon: getThemedIcon('ui', 'award', 18, theme), label: (t('participation') || 'Participation').toUpperCase() },
        { id: 'behavior', path: '/behavior', icon: getThemedIcon('ui', 'alert_circle', 18, theme), label: (t('behavior') || 'Behavior').toUpperCase() },
      ]
    }] : []),
    ...(isSuperAdmin || isInstructor || isAdmin ? [{
      id: 'review',
      label: t('review_results') || 'REVIEW RESULTS',
      icon: getThemedIcon('ui', 'list_checks', 18, theme),
      children: [
        { id: 'review-quiz', path: '/review-results?activityType=quiz', icon: getThemedIcon('ui', 'list_checks', 18, theme), label: (t('quiz_results') || 'Quiz Results').toUpperCase() },
        { id: 'review-homework', path: '/review-results?activityType=homework', icon: getThemedIcon('ui', 'file_text', 18, theme), label: (t('homework_results') || 'Homework Results').toUpperCase() },
        { id: 'review-training', path: '/review-results?activityType=training', icon: getThemedIcon('activity_type', 'training', 18, theme), label: (t('training_results') || 'Training Results').toUpperCase() },
        { id: 'review-lab', path: '/review-results?activityType=lab_work', icon: getThemedIcon('activity_type', 'lab', 18, theme), label: (t('lab_results') || 'Lab Results').toUpperCase() },
      ]
    }] : []),
    {
      id: 'classes',
      label: t('classes') || 'CLASSES',
      icon: getThemedIcon('ui', 'calendar', 18, theme),
      children: [
        { id: 'class-schedules-admin', path: '/class-schedules', icon: getThemedIcon('ui', 'calendar', 18, theme), label: (t('schedules') || 'Schedules').toUpperCase() },
        { id: 'manage-enrollments', path: '/manage-enrollments', icon: getThemedIcon('ui', 'users', 18, theme), label: (t('manage_enrollments') || 'Manage Enrollments').toUpperCase() },
      ]
    },
    {
      id: 'scheduling',
      label: t('scheduling') || 'SCHEDULING',
      icon: getThemedIcon('ui', 'calendar', 18, theme),
      children: [
        { id: 'schedule-overview', path: '/schedule-overview', icon: getThemedIcon('ui', 'calendar', 18, theme), label: (t('schedule_overview') || 'Schedule Overview').toUpperCase() },
        { id: 'scheduling-masters', path: '/scheduling-masters', icon: getThemedIcon('ui', 'layout_dashboard', 18, theme), label: (t('scheduling_masters') || 'Scheduling Masters').toUpperCase() },
        { id: 'schedule-session-editor', path: '/schedule-session-editor', icon: getThemedIcon('ui', 'edit', 18, theme), label: (t('schedule_session_editor') || 'Schedule Session Editor').toUpperCase() },
        { id: 'bulk-scheduling', path: '/bulk-scheduling', icon: getThemedIcon('ui', 'layers', 18, theme), label: (t('bulk_scheduling') || 'Bulk Scheduling').toUpperCase() },
        { id: 'admin-scope-assignment', path: '/admin-scope-assignment', icon: getThemedIcon('ui', 'shield', 18, theme), label: (t('admin_scope_assignment') || 'Admin Scope Assignment').toUpperCase() },
      ]
    },
    {
      id: 'attendance',
      label: t('attendance') || 'ATTENDANCE',
      icon: getThemedIcon('ui', 'qr_code', 18, theme),
      children: [
        { id: 'attendance-admin', path: '/attendance', icon: getThemedIcon('ui', 'qr_code', 18, theme), label: (t('attendance') || 'Attendance').toUpperCase() },
        { id: 'qr-scanner', path: '/qr-scanner', icon: getThemedIcon('ui', 'qr_code', 18, theme), label: (t('qr_class') || 'QR Class').toUpperCase() },
        { id: 'hr-attendance', path: '/hr-attendance', icon: getThemedIcon('ui', 'qr_code', 18, theme), label: (t('hr_attendance') || 'HR Attendance').toUpperCase() },
      ]
    },
    {
      id: 'drive',
      label: t('drive') || 'DRIVE',
      icon: getThemedIcon('ui', 'hard_drive', 18, theme),
      children: [
        { id: 'smart-drive', path: '/smart-drive', icon: getThemedIcon('ui', 'hard_drive', 18, theme), label: (t('smart_drive') || 'Smart Drive').toUpperCase() },
        { id: 'workflow-inbox', path: '/workflow/inbox', icon: getThemedIcon('ui', 'list', 18, theme), label: (t('workflow_inbox') || 'Workflow Inbox').toUpperCase() },
      ]
    },
    {
      id: 'analytics',
      label: t('analytics') || 'ANALYTICS',
      icon: getThemedIcon('ui', 'bar_chart3', 18, theme),
      children: [
        { id: 'analytics-dashboards', path: '/analytics', icon: getThemedIcon('ui', 'bar_chart3', 18, theme), label: (t('dashboards') || 'Dashboards').toUpperCase() },
        { id: 'advanced-analytics', path: '/advanced-analytics', icon: getThemedIcon('ui', 'bar_chart3', 18, theme), label: (t('advanced') || 'Advanced').toUpperCase() },
      ]
    },
    ...(isSuperAdmin ? [{
      id: 'communication',
      label: t('communication') || 'COMMUNICATION',
      icon: getThemedIcon('ui', 'calendar', 18, theme),
      children: [
        { id: 'scheduled-reports', path: '/scheduled-reports', icon: getThemedIcon('ui', 'calendar', 18, theme), label: (t('scheduling') || 'Scheduling').toUpperCase() },
      ]
    }] : []),
    {
      id: 'community',
      label: t('community') || 'COMMUNITY',
      icon: getThemedIcon('ui', 'message_square', 18, theme),
      children: [
        { id: 'chat-admin', path: '/chat', icon: getThemedIcon('ui', 'message_square', 18, theme), label: (t('chat') || 'Chat').toUpperCase() },
        { id: 'resources-admin', path: '/?mode=resources', icon: getThemedIcon('ui', 'book_open', 18, theme), label: (t('resources') || 'Resources').toUpperCase() },
      ]
    },
    {
      id: 'tools',
      label: t('tools') || 'TOOLS',
      icon: getThemedIcon('ui', 'timer', 18, theme),
      children: [
        { id: 'timerControl-admin', key: 'timerControl', icon: getThemedIcon('ui', 'timer', 18, theme), label: (t('timer') || 'Timer').toUpperCase() }
      ]
    },
    {
      id: 'settings',
      label: t('workspace_settings') || 'WORKSPACE SETTINGS',
      icon: getThemedIcon('ui', 'settings', 18, theme),
      children: [
        { id: 'notifications-admin', path: '/notifications', icon: getThemedIcon('ui', 'bell', 18, theme), label: (t('notifications') || 'Notifications').toUpperCase() },
        { id: 'student-profile', path: '/student-profile', icon: getThemedIcon('ui', 'user', 18, theme), label: (t('student_profile') || 'Student Profile').toUpperCase() },
        { id: 'profile-admin', path: '/profile', icon: getThemedIcon('ui', 'settings', 18, theme), label: (t('settings') || 'Settings').toUpperCase() }
      ]
    }
  ];

  const hrLinks = [
    {
      id: 'main',
      label: t('main') || 'MAIN',
      icon: getThemedIcon('ui', 'home', 18, theme),
      children: [
        { id: 'home-hr', path: '/', icon: getThemedIcon('ui', 'home', 18, theme), label: (t('home') || 'Home').toUpperCase() },
        { id: 'daily-scan', path: '/qr-scanner', icon: getThemedIcon('ui', 'qr_code', 18, theme), label: (t('daily_scan') || 'Daily Scan').toUpperCase() },
      ]
    },
    {
      id: 'scheduling',
      label: t('scheduling') || 'SCHEDULING',
      icon: getThemedIcon('ui', 'calendar', 18, theme),
      children: [
        { id: 'schedule-overview-hr', path: '/schedule-overview', icon: getThemedIcon('ui', 'calendar', 18, theme), label: (t('schedule_overview') || 'Schedule Overview').toUpperCase() },
        { id: 'scheduling-masters-hr', path: '/scheduling-masters', icon: getThemedIcon('ui', 'layout_dashboard', 18, theme), label: (t('scheduling_masters') || 'Scheduling Masters').toUpperCase() },
        { id: 'schedule-session-editor-hr', path: '/schedule-session-editor', icon: getThemedIcon('ui', 'edit', 18, theme), label: (t('schedule_session_editor') || 'Schedule Session Editor').toUpperCase() },
        { id: 'bulk-scheduling-hr', path: '/bulk-scheduling', icon: getThemedIcon('ui', 'layers', 18, theme), label: (t('bulk_scheduling') || 'Bulk Scheduling').toUpperCase() },
        { id: 'admin-scope-assignment-hr', path: '/admin-scope-assignment', icon: getThemedIcon('ui', 'shield', 18, theme), label: (t('admin_scope_assignment') || 'Admin Scope Assignment').toUpperCase() },
      ]
    },
    {
      id: 'drive',
      label: t('drive') || 'DRIVE',
      icon: getThemedIcon('ui', 'hard_drive', 18, theme),
      children: [
        { id: 'smart-drive-hr', path: '/smart-drive', icon: getThemedIcon('ui', 'hard_drive', 18, theme), label: (t('smart_drive') || 'Smart Drive').toUpperCase() },
        { id: 'workflow-inbox-hr', path: '/workflow/inbox', icon: getThemedIcon('ui', 'list', 18, theme), label: (t('workflow_inbox') || 'Workflow Inbox').toUpperCase() },
      ]
    },
    {
      id: 'community',
      label: t('community') || 'COMMUNITY',
      icon: getThemedIcon('ui', 'message_square', 18, theme),
      children: [
        { id: 'chat-hr', path: '/chat', icon: getThemedIcon('ui', 'message_square', 18, theme), label: (t('chat') || 'Chat').toUpperCase() },
      ]
    },
    {
      id: 'settings',
      label: t('settings') || 'SETTINGS',
      icon: getThemedIcon('ui', 'settings', 18, theme),
      children: [
        { id: 'notifications-hr', path: '/notifications', icon: getThemedIcon('ui', 'bell', 18, theme), label: (t('notifications') || 'Notifications').toUpperCase() },
        { id: 'student-profile-hr', path: '/student-profile', icon: getThemedIcon('ui', 'user', 18, theme), label: (t('student_profile') || 'Student Profile').toUpperCase() },
        { id: 'profile-hr', path: '/profile', icon: getThemedIcon('ui', 'settings', 18, theme), label: (t('settings') || 'Settings').toUpperCase() },
        { id: 'timerControl-hr', key: 'timerControl', icon: getThemedIcon('ui', 'timer', 18, theme), label: (t('timer') || 'Timer').toUpperCase() }
      ]
    }
  ];

  // Instructor: Same as Admin (everything except Role Access)
  const instructorLinks = adminLinks;

  let links = studentLinks;
  if (!impersonating) {
    // Super admins and admins get admin links, instructors get same as admin
    if (isAdmin || isSuperAdmin || isInstructor) {
      links = [...adminLinks];
      // Add Permission Matrix only for SuperAdmin
      if (isSuperAdmin) {
        const toolsSection = links.find(section => section.id === 'tools');
        if (toolsSection) {
          toolsSection.children.push({
            id: 'permission-matrix',
            path: '/permission-matrix',
            icon: getThemedIcon('ui', 'shield', 18, theme),
            label: (t('permission_matrix') || 'Permission Matrix').toUpperCase()
          });
        }
      }
    } else if (isHR) {
      links = [...hrLinks];
    }
  }

  // Filter menu items based on screen access permissions
  const filterMenuItems = (items) => {
    return items.filter(item => {
      // Super admin sees all items
      if (roleCode === ROLE_STRINGS.SUPER_ADMIN) return true;
      
      // Items with 'key' instead of 'path' are not checked against permissions
      if (item.key && !item.path) return true;
      
      // Check if user can access this screen
      return checkScreenAccess(item.path);
    });
  };

  // Filter menu sections based on permissions (2-level tree structure)
  const filterMenuSections = (sections) => {
    return sections.filter(section => {
      // Filter children items
      const filteredChildren = filterMenuItems(section.children || []);
      
      // Only include section if it has visible children
      if (filteredChildren.length > 0) {
        section.children = filteredChildren;
        return true;
      }
      return false;
    });
  };

  // Apply filtering to links (unless super admin who sees all)
  if (roleCode !== ROLE_STRINGS.SUPER_ADMIN) {
    links = filterMenuSections(links);
  }
  useEffect(() => {
    if (!user || !roleCode || roleCode === ROLE_STRINGS.SUPER_ADMIN) return;

    // Count total menu items across all sections
    let totalItems = 0;
    let singleItemPath = null;

    links.forEach(section => {
      if (section.children && section.children.length > 0) {
        totalItems += section.children.length;
        if (totalItems === 1) {
          singleItemPath = section.children[0].path;
        }
      }
    });

    // If only one menu item exists and current path is not already that item, navigate to it
    if (totalItems === 1 && singleItemPath && location.pathname !== singleItemPath) {
      navigate(singleItemPath);
    }
  }, [links, user, roleCode, location.pathname, navigate]);
  
  return (
    <AnimatePresence>
      {(isOpen || stickyMode) && (
        <>
          {isOpen && !stickyMode && !collapsed && !(autoHide && !isHovering) ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1000,
              cursor: 'pointer',
            }}
          />) : null}

          {/* Auto-hide hover hotspot + restore tab */}
          {(autoHide && !isHovering) && (
            <div
              onMouseEnter={() => setIsHovering(true)}
              style={{
                position: 'fixed',
                top: 0,
                bottom: 0,
                [lang==='ar' ? 'right' : 'left']: 0,
                width: 8,
                boxShadow: lang==='ar' ? '-2px 0 8px rgba(0,0,0,0.15)' : '2px 0 8px rgba(0,0,0,0.15)',
                background: 'transparent',
                zIndex: 1002,
                cursor: 'ew-resize'
              }}
            >
              <button
                onClick={() => setIsHovering(true)}
                title={t('expand') || 'Expand'}
                style={{
                  position: 'absolute',
                  top: 12,
                  [lang==='ar' ? 'left' : 'right']: -2,
                  width: 20,
                  height: 40,
                  borderRadius: 6,
                  border: 'none',
                  background: 'rgba(0,0,0,0.1)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                {lang==='ar' ? getThemedIcon('ui', 'chevron_right', 14, theme) : getThemedIcon('ui', 'chevron_down', 0, theme)}
                {lang==='ar' ? null : getThemedIcon('ui', 'chevron_right', 14, theme)}
              </button>
            </div>
          )}

          {/* Drawer */}
          <motion.div
            initial={{ x: 0 }}
            animate={{
              x: (stickyMode ? 0 : (autoHide && !isHovering && !collapsed))
                ? (lang==='ar' ? (drawerWidth - 8) : -(drawerWidth - 8))
                : 0
            }}
            exit={{ x: stickyMode ? 0 : (lang==='ar' ? drawerWidth : -drawerWidth) }}
            transition={{
              type: 'tween',
              duration: (autoHide && !isHovering && !collapsed && !stickyMode) ? 0.5 : 0.3,
              ease: [0.4, 0, 0.2, 1]
            }}
            style={{
              position: stickyMode ? 'fixed' : 'fixed',
              top: 0,
              left: lang==='ar' ? 'auto' : (stickyMode && isOpen ? 0 : (autoHide && !isHovering && !collapsed ? -(drawerWidth - 8) : 0)),
              right: lang==='ar' ? (stickyMode && isOpen ? 0 : (autoHide && !isHovering && !collapsed ? -(drawerWidth - 8) : 0)) : 'auto',
              bottom: 0,
              height: '100vh',
              // Width rules:
              // - Collapsed: fixed 64px (icons only)
              // - Auto-hide (not hovering): keep full width so hover area expands smoothly; we shift with x
              // - Normal: drawerWidth
              width: collapsed ? 80 : drawerWidth,
              background: theme === 'light' ? '#ffffff' : 'linear-gradient(180deg, #0f172a, #111827)',
              borderRight: lang==='ar' ? 'none' : (theme === 'light' ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.1)'),
              borderLeft: lang==='ar' ? (theme === 'light' ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.1)') : 'none',
              color: theme === 'light' ? '#0f172a' : 'white',
              zIndex: stickyMode ? 1000 : 9999,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: stickyMode ? 'none' : '2px 0 10px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden',
              transition: stickyMode ? 'none' : 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              flexShrink: 0
            }}
            onMouseEnter={() => {
              if (autoHide && !collapsed && !stickyMode) {
                setIsHovering(true);
              }
            }}
            onMouseLeave={() => {
              if (autoHide && !collapsed && !stickyMode) {
                setIsHovering(false);
              }
            }}
          >
            {/* Magic arrow for collapsed (icons-only) restore */}
            {collapsed && (
              <button
                onClick={() => setCollapsed(false)}
                title={t('expand') || 'Expand'}
                style={{
                  position: 'absolute',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  [lang==='ar' ? 'left' : 'right']: -12,
                  width: 28,
                  height: 40,
                  borderRadius: 8,
                  background: 'rgba(0,0,0,0.12)',
                  color: '#fff',
                  border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', zIndex: 1003
                }}
              >
                {lang==='ar' ? getThemedIcon('ui', 'chevron_left', 16, theme) : getThemedIcon('ui', 'chevron_right', 16, theme)}
              </button>
            )}
            {/* Resizer */}
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                const startX = e.clientX; const startW = drawerWidth;
                const onMove = (ev) => {
                  const w = Math.min(480, Math.max(280, startW + (ev.clientX - startX)));
                  setDrawerWidth(w);
                };
                const onUp = () => {
                  try { localStorage.setItem('drawer_width', String(drawerWidth)); } catch {}
                  window.removeEventListener('mousemove', onMove);
                  window.removeEventListener('mouseup', onUp);
                };
                window.addEventListener('mousemove', onMove);
                window.addEventListener('mouseup', onUp);
              }}
              title={t('resize') || 'Resize'}
              style={{ position:'absolute', top:0, right:-5, width:10, height:'100%', cursor:'ew-resize',
                background: 'linear-gradient(to right, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)' }}
            />

            {/* Header */}
            <div style={{
              padding: '0.75rem',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(0,0,0,0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.1rem', flexDirection: collapsed ? 'column' : 'row', gap: collapsed ? '0.5rem' : '0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: collapsed ? '0' : '1' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #D4AF37, #FFD700)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: '#2E3B4E'
                  }}>
                    {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                </div>
                
                {(() => {
                  const neutralBg = theme==='light' ? 'rgba(15,23,42,0.06)' : 'rgba(255,255,255,0.1)';
                  const neutralHover = theme==='light' ? 'rgba(15,23,42,0.12)' : 'rgba(255,255,255,0.2)';
                  // Use user's accent color instead of hardcoded gold
                  const rgb = hexToRgbString(userAccentColor);
                  const accentBg = theme==='light' ? `rgba(${rgb}, 0.25)` : `rgba(${rgb}, 0.2)`;
                  const accentHover = theme==='light' ? `rgba(${rgb}, 0.4)` : `rgba(${rgb}, 0.3)`;
                  return (
                    <div style={{ display: 'flex', flexDirection: collapsed ? 'column' : 'row', gap: collapsed ? '0.5rem' : '0' }}>
                      <button
                        onClick={toggleTheme}
                        title={theme==='light' ? (t('switch_to_dark')||'Dark') : (t('switch_to_light')||'Light')}
                        data-base-bg={neutralBg}
                        data-hover-bg={neutralHover}
                        style={{
                          background: neutralBg,
                          border: 'none',
                          color: theme==='light' ? '#111' : 'white',
                          cursor: 'pointer',
                          padding: '0.3rem',
                          borderRadius: '8px',
                          width: '28px',
                          height: '28px',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          marginRight: collapsed ? '0' : 4,
                          transition: 'background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease'
                        }}
                        onMouseEnter={onHeaderButtonEnter}
                        onMouseLeave={onHeaderButtonLeave}
                      >
                        {theme==='light' ? getThemedIcon('ui', 'moon', 14, theme) : getThemedIcon('ui', 'sun', 14, theme)}
                      </button>
                      <button
                        onClick={() => {
                          setCollapsed(v=>!v);
                          if (collapsed) {
                            setAutoHide(false);
                          }
                        }}
                        title={collapsed ? (t('expand')||'Expand Drawer') : (t('collapse')||'Collapse Drawer')}
                        data-base-bg={collapsed ? accentBg : neutralBg}
                        data-hover-bg={collapsed ? accentHover : neutralHover}
                        style={{
                          background: collapsed ? accentBg : neutralBg,
                          border: 'none', color: theme==='light' ? '#111' : 'white', cursor: 'pointer',
                          padding: '0.3rem', borderRadius: '8px', width: '28px', height: '28px',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          marginRight: collapsed ? '0' : 4,
                          transition: 'background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease'
                        }}
                        onMouseEnter={onHeaderButtonEnter}
                        onMouseLeave={onHeaderButtonLeave}
                      >
                        {collapsed ? getThemedIcon('ui', 'chevron_right', 14, theme) : getThemedIcon('ui', 'chevron_left', 14, theme)}
                      </button>
                      <button
                        onClick={() => setAutoHide(v=>!v)}
                        title={autoHide ? (t('disable_auto_hide')||'Disable auto-hide') : (t('enable_auto_hide')||'Enable auto-hide')}
                        data-base-bg={autoHide ? accentBg : neutralBg}
                        data-hover-bg={autoHide ? accentHover : neutralHover}
                        style={{
                          background: autoHide ? accentBg : neutralBg,
                          border: 'none', color: theme==='light' ? '#111' : 'white', cursor: 'pointer',
                          padding: '0.3rem', borderRadius: '8px', width: '28px', height: '28px',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          marginRight: collapsed ? '0' : 4,
                          transition: 'background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease'
                        }}
                        onMouseEnter={onHeaderButtonEnter}
                        onMouseLeave={onHeaderButtonLeave}
                      >
                        {getThemedIcon('ui', 'eye', 14, theme)}
                      </button>
                      <button
                        onClick={() => setStickyMode(v => !v)}
                        title={stickyMode ? (t('disable_sticky') || 'Disable Sticky Mode') : (t('enable_sticky') || 'Enable Sticky Mode')}
                        data-base-bg={stickyMode ? accentBg : neutralBg}
                        data-hover-bg={stickyMode ? accentHover : neutralHover}
                        style={{
                          background: stickyMode ? accentBg : neutralBg,
                          border: 'none', color: theme==='light' ? '#111' : 'white', cursor: 'pointer',
                          padding: '0.3rem', borderRadius: '8px', width: '28px', height: '28px',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          marginRight: collapsed ? '0' : 4,
                          transition: 'background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease'
                        }}
                        onMouseEnter={onHeaderButtonEnter}
                        onMouseLeave={onHeaderButtonLeave}
                      >
                        {getThemedIcon('ui', 'pin', 12, theme)}
                      </button>
                      <button
                        onClick={onClose}
                        data-base-bg={neutralBg}
                        data-hover-bg={neutralHover}
                        style={{
                          background: neutralBg,
                          border: 'none',
                          color: theme==='light' ? '#111' : 'white',
                          fontSize: '1.2rem',
                          cursor: 'pointer',
                          padding: '0.3rem',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '28px',
                          height: '28px',
                          flexShrink: 0,
                          transition: 'background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease'
                        }}
                        onMouseEnter={onHeaderButtonEnter}
                        onMouseLeave={onHeaderButtonLeave}
                      >
                        {getThemedIcon('ui', 'x', 14, theme)}
                      </button>
                    </div>
                  );
                })()}
              </div>

              {/* Top pinned compact strip (icons only) - Always show when collapsed or has pins */}
              {(collapsed || pinTimer || pinnedLinks.length > 0) && (
                <div style={{ padding: '0.25rem 0 0 0', display:'flex', gap:8, flexWrap:'wrap', justifyContent: collapsed ? 'center' : 'flex-start' }}>
                  {pinTimer && (
                    <button
                      onClick={() => setShowTimerPanel(v=>!v)}
                      title={t('timer') || 'Timer'}
                      data-base-bg={theme==='light' ? '#e2e8f0' : 'rgba(255,255,255,0.12)'}
                      data-hover-bg={theme==='light' ? '#cbd5f5' : 'rgba(255,255,255,0.22)'}
                      style={{ padding:'0.5rem', borderRadius:8, background: theme==='light' ? '#e2e8f0' : 'rgba(255,255,255,0.12)', border:'1px solid rgba(0,0,0,0.15)', color:'#111827',
                        cursor:'pointer', transition: 'background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease' }}
                      onMouseEnter={onQuickActionEnter}
                      onMouseLeave={onQuickActionLeave}
                    >
                      {getThemedIcon('ui', 'timer', 18, theme)}
                    </button>
                  )}
                  {pinnedLinks.map((p) => {
                    const allItems = Object.values(links).flatMap(g => g.items);
                    const found = allItems.find(l => l.path === p);
                    if (!found) return null;
                    return (
                      <Link key={p} to={p} onClick={onClose} title={found.label}
                        data-base-bg={theme==='light' ? '#e5e7eb' : 'rgba(212,175,55,0.2)'}
                        data-hover-bg={theme==='light' ? '#d1d5db' : 'rgba(212,175,55,0.35)'}
                        style={{ padding:'0.5rem', borderRadius:8, background: theme==='light' ? '#e5e7eb' : 'rgba(212,175,55,0.2)', border: theme==='light' ? '1px solid rgba(0,0,0,0.15)' : '1px solid rgba(212,175,55,0.6)', color: theme==='light' ? '#111827' : '#FFD700', display:'inline-flex', transition: 'background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease' }}
                        onMouseEnter={onQuickActionEnter}
                        onMouseLeave={onQuickActionLeave}
                      >
                        <span style={{ display:'inline-flex', alignItems:'center' }}>{found.icon}</span>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Timer Panel (only when toggled or pinned) */}
              {(pinTimer || showTimerPanel) && (
                <div style={{ padding: '0.75rem 1.25rem' }}>
                  <TimerStopwatch compact showTest={false} />
                </div>
              )}

              {/* Impersonation Banner */}
              {impersonating && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  background: '#ff9800',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  color: 'white'
                }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.5rem', display:'flex', alignItems:'center', gap:6 }}>
                    {getThemedIcon('ui', 'help_circle', 16, theme)} {t('impersonating') || 'Impersonating'}
                  </div>
                  <button
                    onClick={handleStopImpersonation}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: 'white',
                      color: '#ff9800',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    {t('stop_impersonation') || 'Stop Impersonation'}
                  </button>
                </div>
              )}

              {/* Quick actions removed; notifications/settings moved to menu */}
            </div>

            {/* Navigation Links (2-level Tree Structure) */}
            <nav style={{ flex: 1, padding: '0.5rem 0 1rem 0', overflowY: 'auto' }}>
              {links.map((section) => (
                <div key={section.id} style={{ marginTop: '0.1rem' }}>
                  {/* Section Header - Collapsible */}
                  {!collapsed && (
                    <button
                      onClick={() => toggleSection(section.id)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.15rem 0.6rem',
                        background: 'transparent',
                        border: 'none',
                        color: theme==='light' ? 'rgba(17,24,39,0.6)' : 'rgba(255,255,255,0.5)',
                        fontSize: lang === 'ar' ? '0.75rem' : '0.65rem',
                        textTransform: lang === 'ar' ? 'none' : 'uppercase',
                        letterSpacing: lang === 'ar' ? '0.5px' : '1.2px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = theme==='light' ? 'rgba(17,24,39,0.9)' : 'rgba(255,255,255,0.8)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = theme==='light' ? 'rgba(17,24,39,0.6)' : 'rgba(255,255,255,0.5)';
                      }}
                    >
                      <span>{section.label}</span>
                      {expandedSections[section.id] ? getThemedIcon('ui', 'chevron_down', 14, theme) : getThemedIcon('ui', 'chevron_right', 14, theme)}
                    </button>
                  )}
                  
                  {/* Section Items - Collapsible */}
                  <AnimatePresence initial={false}>
                  {expandedSections[section.id] && (
                    <motion.div
                      key={`${section.id}-items`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                    {section.children.map((link, idx) => (
                    <div key={link.key || `${section.id}-${link.path}${link.hash || ''}-${idx}`} style={{ display:'flex', alignItems:'center', gap:8, margin:'0 0.5rem' }}>
                      {link.key === 'timerControl' ? (
                        <button
                          onClick={() => setShowTimerPanel(v=>!v)}
                          title={link.label}
                          style={{
                            display:'flex', alignItems:'center', justifyContent: collapsed ? 'center' : 'flex-start', gap:'0.85rem', padding: collapsed ? '0.7rem' : '0.7rem 1rem', borderRadius:'8px',
                            color: isActive(link.path, link.hash)
                              ? userAccentColor
                              : (theme==='light' ? '#111827' : 'rgba(255,255,255,0.85)'),
                            background: isActive(link.path, link.hash)
                              ? (theme==='light' ? `rgba(${hexToRgbString(userAccentColor)}, 0.15)` : `rgba(${hexToRgbString(userAccentColor)}, 0.15)`)
                              : 'transparent',
                            cursor:'pointer', flex:1,
                            transition: 'all 0.2s',
                            fontWeight: isActive(link.path, link.hash) ? 600 : 400,
                            fontSize: lang === 'ar' ? '0.9rem' : '0.85rem',
                            boxSizing: 'border-box',
                            height: '37.5px'
                          }}
                          onMouseEnter={(e) => {
                          if (!isActive(link.path, link.hash)) {
                            e.currentTarget.style.background = theme==='light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)';
                          }
                          }}
                          onMouseLeave={(e) => {
                          if (!isActive(link.path, link.hash)) {
                            e.currentTarget.style.background = 'transparent';
                          }
                          }}
                        >
                          <span style={{ 
                            width: '20px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            color: isActive(link.path, link.hash)
                              ? userAccentColor
                              : (theme==='light' ? '#6b7280' : '#9ca3af')
                          }}>
                            {React.cloneElement(link.icon, { 
                              size: 18, 
                              color: isActive(link.path, link.hash)
                                ? userAccentColor
                                : (theme==='light' ? '#6b7280' : '#9ca3af')
                            })}
                          </span>
                          {!collapsed && <span style={{ display:'inline-flex', alignItems:'center', gap:6, whiteSpace: 'nowrap' }}>{link.label}</span>}
                        </button>
                      ) : (
                        <Link
                          to={link.hash ? `${link.path}${link.hash}` : link.path}
                          onClick={onClose}
                          title={link.label}
                          style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: collapsed ? 'center' : 'flex-start',
                          gap: '0.85rem',
                          padding: collapsed ? '0.7rem' : '0.7rem 1rem',
                          borderRadius: '8px',
                          color: isActive(link.path, link.hash)
                            ? userAccentColor
                            : (theme==='light' ? '#111827' : 'rgba(255,255,255,0.85)'),
                          textDecoration: 'none',
                          background: isActive(link.path, link.hash)
                            ? (theme==='light' ? `rgba(${hexToRgbString(userAccentColor)}, 0.15)` : `rgba(${hexToRgbString(userAccentColor)}, 0.15)`)
                            : 'transparent',
                          transition: 'all 0.2s',
                          fontWeight: isActive(link.path, link.hash) ? 600 : 400,
                          fontSize: lang === 'ar' ? '0.9rem' : '0.85rem',
                          flex: 1
                          }}
                          onMouseEnter={(e) => {
                          if (!isActive(link.path, link.hash)) {
                            e.currentTarget.style.background = theme==='light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)';
                          }
                          }}
                          onMouseLeave={(e) => {
                          if (!isActive(link.path, link.hash)) {
                            e.currentTarget.style.background = 'transparent';
                          }
                          }}
                        >
                          <span style={{ 
                            width: '20px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            color: isActive(link.path, link.hash)
                              ? userAccentColor
                              : (theme==='light' ? '#6b7280' : '#9ca3af')
                          }}>
                            {React.cloneElement(link.icon, { 
                              size: 18, 
                              color: isActive(link.path, link.hash)
                                ? userAccentColor
                                : (theme==='light' ? '#6b7280' : '#9ca3af')
                            })}
                          </span>
                          {!collapsed && <span style={{ display:'inline-flex', alignItems:'center', gap:6, whiteSpace: 'nowrap' }}>{link.label}</span>}
                        </Link>
                      )}
                      {!collapsed && density === 'compact' && (
                      <button
                        title={t('open_in_new_tab') || 'Open in new tab'}
                        onClick={() => link.key==='timerControl' ? setShowTimerPanel(v=>!v) : window.open(`${window.location.origin}${link.path}`, '_blank', 'noopener,noreferrer')}
                        style={{
                          background: theme==='light' ? '#ffffff' : 'rgba(255,255,255,0.06)',
                          border: `1px solid ${theme==='light' ? 'rgba(17,24,39,0.15)' : 'rgba(255,255,255,0.2)'}`,
                          color: theme==='light' ? '#111827' : '#e5e7eb',
                          borderRadius: 6,
                          width: 28,
                          height: 28,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          lineHeight: 0,
                          cursor: 'pointer'
                        }}
                      >
                        {getThemedIcon('ui', 'external_link', 12, theme)}
                      </button>)}
                      {!collapsed && density === 'compact' && (() => {
                        const pinned = link.key==='timerControl' ? pinTimer : isPinned(link.path);
                        return (
                          <button
                            title={pinned ? (t('unpin') || 'Unpin') : (t('pin') || 'Pin')}
                            onClick={() => link.key==='timerControl' ? setPinTimer(v=>!v) : togglePinLink(link.path)}
                            style={{
                              background: pinned
                                ? (theme==='light' ? `rgba(${hexToRgbString(userAccentColor)}, 0.25)` : `rgba(${hexToRgbString(userAccentColor)}, 0.2)`)
                                : (theme==='light' ? '#ffffff' : 'rgba(255,255,255,0.06)'),
                              border: pinned
                                ? (theme==='light' ? `1px solid rgba(${hexToRgbString(userAccentColor)}, 0.6)` : `1px solid rgba(${hexToRgbString(userAccentColor)}, 0.6)`)
                                : (theme==='light' ? '1px solid rgba(17,24,39,0.15)' : '1px solid rgba(255,255,255,0.2)'),
                              color: pinned
                                ? userAccentColor
                                : (theme==='light' ? '#111827' : '#e5e7eb'),
                              borderRadius: 6,
                              width: 28,
                              height: 28,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              lineHeight: 0,
                              cursor: 'pointer'
                            }}
                          >
                            {pinned ? getThemedIcon('ui', 'pin_off', 12, theme) : getThemedIcon('ui', 'pin', 12, theme)}
                          </button>
                        );
                      })()}
                      {density !== 'compact' && (
                        <div style={{ width: 64 }} />
                      )}
                    </div>
                    ))}
                    </motion.div>
                  )}
                  </AnimatePresence>
                </div>
              ))}
            </nav>

            {/* Footer Actions */}
            <div style={{
              padding: '0.85rem',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(0,0,0,0.15)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: collapsed ? 'center' : 'space-between',
              alignItems: collapsed ? 'center' : 'stretch',
              gap: collapsed ? '0.75rem' : '0.5rem'
            }}>
              {/* Version Display */}
              {!collapsed && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: '0.5rem'
                }}>
                  <VersionDisplay 
                    style={{
                      position: 'static',
                      fontSize: '9px',
                      padding: '3px 8px',
                      background: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)',
                      borderRadius: '6px'
                    }}
                  />
                </div>
              )}
              
              {/* Button Row */}
              <div style={{
                display: 'flex',
                flexDirection: collapsed ? 'column' : 'row',
                justifyContent: collapsed ? 'center' : 'space-between',
                alignItems: 'center',
                gap: collapsed ? '0.5rem' : '0.5rem'
              }}>
              {/* Language Toggle */}
              <button
                onClick={() => {
                  toggleLang();
                  if (!collapsed) onClose();
                }}
                title={collapsed ? (t('switch_language') || (lang === 'en' ? 'العربية' : 'English')) : ''}
                style={{
                  ...langButtonStyle,
                  margin: '0',
                  flex: collapsed ? '1' : 'auto',
                  padding: collapsed ? '0.5rem' : '0.5rem 1rem',
                  minWidth: collapsed ? 'auto' : 'auto'
                }}
                onMouseEnter={onFooterHover}
                onMouseLeave={onFooterLeave}
              >
                {collapsed ? getThemedIcon('ui', 'globe', 16, theme) : <span>{t(lang === 'en' ? 'arabic' : 'english') || (lang === 'en' ? 'العربية' : 'English')}</span>}
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                title={collapsed ? (t('logout') || 'Logout') : ''}
                style={{
                  ...logoutButtonStyle,
                  margin: '0',
                  flex: collapsed ? '1' : 'auto',
                  padding: collapsed ? '0.5rem' : '0.5rem 1rem',
                  minWidth: collapsed ? 'auto' : 'auto'
                }}
                onMouseEnter={onFooterHover}
                onMouseLeave={onFooterLeave}
              >
                {collapsed ? getThemedIcon('ui', 'log_out', 16, theme) : <span>{t('logout') || 'Logout'}</span>}
              </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SideDrawer;

