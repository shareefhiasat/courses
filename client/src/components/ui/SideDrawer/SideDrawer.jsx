import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useIsMobile } from '@hooks/useIsMobile';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { normalizeHexColor, DEFAULT_ACCENT, hexToRgbString } from '@utils/color';
import { ROLE_STRINGS } from '@utils/userUtils';
import { getThemedIcon, getUserRoleIcon, getUserRoleColor } from '@constants/iconTypes';
import { resolveIconSize, ICON_SIZE_VARS } from '@utils/iconSize';
import { resolveUserRole } from '@utils/userUtils';
import { TimerStopwatch } from '@ui';
import VersionDisplay from '@ui/VersionDisplay/VersionDisplay';
import { resolveScreenIdFromNavItem } from '@config/navigationRegistry.js';
import { info, error, warn, debug } from '@services/utils/logger.js';
import { drawerTlog, drawerTlogSnapshot } from '@utils/drawerTlog';
import { usePermissions } from '@hooks/usePermissions';
import { useTypography } from '@contexts/TypographyContext';

const DASHBOARD_HASH_TABS = {
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

const CALENDAR_CLASSES_PATH = '/scheduling-calendar?tab=classes';
const CALENDAR_INSTRUCTOR_AVAIL_PATH = '/scheduling-calendar?tab=availability&scope=instructor';
const CALENDAR_ROOM_AVAIL_PATH = '/scheduling-calendar?tab=availability&scope=room';
/** Slower expand/collapse when auto-hide is on (overlay slide + sticky width/margin) */
const AUTO_HIDE_TRANSITION_S = 0.75;
const AUTO_HIDE_STRIP_PX = 8;
const AUTO_HIDE_LEAVE_DELAY_MS = 250;

const SideDrawer = ({ isOpen, onClose, onOpen }) => {
  const { user, isAdmin, isSuperAdmin, isHR, isInstructor, role, impersonating, stopImpersonation, logout } = useAuth();
  const { t, lang, toggleLang } = useLang();
  const toInitCap = (text) => {
    if (!text || lang === 'ar') return text;
    const normalized = text === text.toUpperCase() && /[A-Z]/.test(text)
      ? text.charAt(0) + text.slice(1).toLowerCase()
      : text;
    return normalized.replace(/\b[a-z]/g, (c) => c.toUpperCase());
  };
  const nl = (key, fallback) => {
    const raw = t(key);
    const resolved = raw !== key ? raw : (fallback || String(key || '').replaceAll('_', ' '));
    return toInitCap(resolved);
  };
  const syncDashboardTabFromHash = (path, hash) => {
    if (path !== '/dashboard' || !hash) return;
    const tab = DASHBOARD_HASH_TABS[hash.replace('#', '')];
    if (!tab) return;
    localStorage.setItem('dashboardActiveTab', tab);
    window.dispatchEvent(new CustomEvent('dashboard-tab-change', { detail: { tab } }));
  };
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { canAccessScreen: checkScreenAccess, roleCode, loading: permissionsLoading } = usePermissions();
  const { textSize } = useTypography();
  const navIconSize = resolveIconSize(18);
  const [drawerWidth, setDrawerWidth] = useState(() => {
    try {
      const parsed = parseInt(localStorage.getItem('drawer_width'), 10);
      return Math.min(600, Math.max(280, Number.isFinite(parsed) ? parsed : 342));
    } catch {
      return 342;
    }
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
  const hideTimerRef = useRef(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  /** Single derived layout — avoids conflicting isOpen / sticky / autoHide branches */
  const drawerLayout = useMemo(() => {
    const autoHideActive = autoHide && !collapsed && !isMobile;
    // Keep edge strip mounted when auto-hide is on (even if hamburger "closed")
    const shouldMount = stickyMode || isOpen || autoHideActive;
    const isExpanded = collapsed
      ? true
      : autoHideActive
        ? isHovering
        : (stickyMode || isOpen);
    const pushLayout = stickyMode && !isMobile;
    const showHotspot = autoHideActive && !isHovering;
    const showOverlay = !stickyMode && isOpen && isExpanded && !collapsed;
    const layoutWidth = pushLayout
      ? (collapsed ? 80 : (autoHideActive && !isHovering ? AUTO_HIDE_STRIP_PX : drawerWidth))
      : null;
    const panelWidth = collapsed
      ? 80
      : (pushLayout && autoHideActive && !isHovering ? AUTO_HIDE_STRIP_PX : drawerWidth);
    const slideOff = !pushLayout && autoHideActive && !isHovering;
    const motionX = slideOff
      ? (lang === 'ar' ? drawerWidth - AUTO_HIDE_STRIP_PX : -(drawerWidth - AUTO_HIDE_STRIP_PX))
      : 0;

    return {
      autoHideActive,
      shouldMount,
      isExpanded,
      pushLayout,
      showHotspot,
      showOverlay,
      layoutWidth,
      panelWidth,
      slideOff,
      motionX,
    };
  }, [stickyMode, isOpen, autoHide, collapsed, isHovering, isMobile, drawerWidth, lang]);

  const expandDrawer = useCallback((source) => {
    clearHideTimer();
    drawerTlog('expand', { source, stickyMode, isOpen, autoHide });
    setIsHovering(true);
    if (!stickyMode && !isOpen && onOpen) {
      onOpen();
    }
  }, [clearHideTimer, stickyMode, isOpen, onOpen, autoHide]);

  const scheduleCollapse = useCallback((source) => {
    if (!autoHide || collapsed) return;
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      hideTimerRef.current = null;
      drawerTlog('collapse', { source, stickyMode, isOpen });
      setIsHovering(false);
      if (!stickyMode && isOpen) {
        onClose();
      }
    }, AUTO_HIDE_LEAVE_DELAY_MS);
  }, [autoHide, collapsed, clearHideTimer, stickyMode, isOpen, onClose]);

  useEffect(() => () => clearHideTimer(), [clearHideTimer]);

  // Resolve impossible combo from older localStorage
  useEffect(() => {
    if (stickyMode && autoHide) {
      drawerTlog('sync:mount-resolve-conflict', { resolution: 'autoHide-on→sticky-off' });
      setStickyMode(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // TEMP: log mount + restored prefs
  useEffect(() => {
    drawerTlogSnapshot('mount', {
      isOpen,
      stickyMode,
      autoHide,
      collapsed,
      isHovering,
      drawerWidth,
      isMobile,
      drawerLayout,
      localStorage: {
        drawer_sticky_mode: localStorage.getItem('drawer_sticky_mode'),
        drawer_auto_hide: localStorage.getItem('drawer_auto_hide'),
        drawer_collapsed: localStorage.getItem('drawer_collapsed'),
        drawer_width: localStorage.getItem('drawer_width'),
      },
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Hamburger / parent isOpen ↔ expanded state
  useEffect(() => {
    if (collapsed) return;
    drawerTlog('isOpen-prop-change', { isOpen, stickyMode, autoHide, collapsed });
    if (isOpen) {
      clearHideTimer();
      setIsHovering(true);
    } else if (autoHide) {
      setIsHovering(false);
    }
  }, [isOpen, stickyMode, autoHide, collapsed, clearHideTimer]);
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

    drawerTlogSnapshot('layout-effect', {
      ...drawerLayout,
      isOpen,
      isHovering,
      stickyMode,
      autoHide,
      collapsed,
      isMobile,
      htmlClasses: {
        drawerStickyOpen: document.documentElement.classList.contains('drawer-sticky-open'),
        drawerAutoHide: document.documentElement.classList.contains('drawer-auto-hide'),
      },
    });

    if (drawerLayout.pushLayout && drawerLayout.layoutWidth != null) {
      document.documentElement.style.setProperty('--drawer-width', `${drawerLayout.layoutWidth}px`);
      document.documentElement.classList.add('drawer-sticky-open');
      if (drawerLayout.autoHideActive) {
        document.documentElement.classList.add('drawer-auto-hide');
      } else {
        document.documentElement.classList.remove('drawer-auto-hide');
      }
    } else {
      document.documentElement.style.removeProperty('--drawer-width');
      document.documentElement.classList.remove('drawer-sticky-open');
      document.documentElement.classList.remove('drawer-auto-hide');
    }
    return () => {
      document.documentElement.style.removeProperty('--drawer-width');
      document.documentElement.classList.remove('drawer-sticky-open');
      document.documentElement.classList.remove('drawer-auto-hide');
    };
  }, [stickyMode, drawerLayout, autoHide, collapsed]);
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
        drawerTlog('keyboard:dispatch-toggle-drawer', { source: 'SideDrawer keydown' });
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
        if (path === '/dashboard') {
          syncDashboardTabFromHash(path, hash);
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
    fontSize: collapsed ? 'var(--font-size-xs)' : 'var(--font-size-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease',
    boxShadow: footerShadowBase,
  }), [collapsed, footerShadowBase, textSize]);

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

  // Scheduling + availability navigation sections (shared across roles)
  const buildSchedulingSections = (idSuffix = '', { includeSummary = false, includeSetup = false, schedulingPrepend = [] } = {}) => {
    const sfx = idSuffix;
    const sections = [
      {
        id: `scheduling${sfx}`,
        label: nl('scheduling_and_availabilities', 'Scheduling and Availabilities'),
        icon: getThemedIcon('ui', 'calendar', 18, theme),
        children: [
          ...schedulingPrepend,
          ...(includeSummary ? [
            { id: `summary-dashboard${sfx}`, path: '/summary-dashboard', screenId: 'summary-dashboard', icon: getThemedIcon('ui', 'layout_dashboard', 18, theme), label: nl('summary_dashboard', 'Summary Dashboard') },
          ] : []),
          { id: `calendar-sessions${sfx}`, path: '/scheduling-calendar', screenId: 'scheduling-calendar', icon: getThemedIcon('ui', 'calendar', 18, theme), label: nl('main_tab_sessions', 'Sessions') },
        ],
      },
      {
        id: `availability${sfx}`,
        label: nl('nav_availability', 'Availability'),
        icon: getThemedIcon('ui', 'bar_chart3', 18, theme),
        children: [
          { id: `calendar-classes${sfx}`, path: CALENDAR_CLASSES_PATH, screenId: 'classes-availability', icon: getThemedIcon('ui', 'graduation_cap', 18, theme), label: nl('classes_availability', 'Classes Availability') },
          { id: `calendar-instructor-avail${sfx}`, path: CALENDAR_INSTRUCTOR_AVAIL_PATH, screenId: 'instructor-availability-view', icon: getThemedIcon('ui', 'users', 18, theme), label: nl('instructor_availability', 'Instructor Availability') },
          { id: `calendar-room-avail${sfx}`, path: CALENDAR_ROOM_AVAIL_PATH, screenId: 'room-availability-view', icon: getThemedIcon('ui', 'list', 18, theme), label: nl('room_availability', 'Room Availability') },
        ],
      },
    ];

    if (includeSetup) {
      sections.push({
        id: `availability-setup${sfx}`,
        label: nl('availability_setup', 'Availability Setup'),
        icon: getThemedIcon('ui', 'settings', 18, theme),
        children: [
          { id: `instructor-availability${sfx}`, path: '/dashboard', hash: '#instructor-availability', screenId: 'instructor-availability-setup', icon: getThemedIcon('ui', 'users', 18, theme), label: nl('instructor_availability_setup', 'Instructor Availability Setup') },
          { id: `classroom-availability${sfx}`, path: '/dashboard', hash: '#classroom-availability', screenId: 'room-availability-setup', icon: getThemedIcon('ui', 'list', 18, theme), label: nl('room_availability_setup', 'Room Availability Setup') },
        ],
      });
    }

    return sections;
  };

  const adminSchedulingSections = buildSchedulingSections('', {
    includeSummary: true,
    includeSetup: isSuperAdmin || isAdmin || isHR,
  });
  const studentSchedulingSections = buildSchedulingSections('-student', {
    includeSummary: false,
    includeSetup: false,
    schedulingPrepend: [
      { id: 'my-enrollments-student', path: '/my-enrollments', screenId: 'enrollments', icon: getThemedIcon('ui', 'book_open', 18, theme), label: nl('my_enrollments', 'My Enrollments') },
    ],
  });
  const instructorSchedulingSections = buildSchedulingSections('-instructor', {
    includeSummary: false,
    includeSetup: false,
  });
  const programAdminSchedulingSections = buildSchedulingSections('-progadmin', {
    includeSummary: true,
    includeSetup: false,
  });

  // Tree-structured navigation data
  const studentLinks = [
    {
      id: 'main',
      label: nl('main', 'Main'),
      icon: getThemedIcon('ui', 'home', 18, theme),
      children: [
        { id: 'home', path: '/', screenId: 'home', icon: getThemedIcon('ui', 'home', 18, theme), label: nl('home', 'Home') },
        { id: 'student-dashboard', path: '/student-dashboard', screenId: 'student-dashboard', icon: getThemedIcon('ui', 'layout_dashboard', 18, theme), label: nl('student_dashboard', 'Student Dashboard') },
        { id: 'progress', path: '/student-dashboard', screenId: 'student-dashboard', icon: getThemedIcon('ui', 'bar_chart3', 18, theme), label: nl('progress', 'Progress') },
      ]
    },
    {
      id: 'activity',
      label: nl('activity', 'Activity'),
      icon: getThemedIcon('ui', 'activity', 18, theme),
      children: [
        { id: 'activities', path: '/?mode=activities', screenId: 'activities', icon: getThemedIcon('ui', 'activity', 18, theme), label: nl('activities', 'Activities') },
        { id: 'quiz-activity', path: '/?mode=activities&activityType=quiz', screenId: 'activities', icon: getThemedIcon('ui', 'gamepad2', 18, theme), label: nl('quiz', 'Quiz') },
        { id: 'homework-activity', path: '/?mode=activities&activityType=homework', screenId: 'activities', icon: getThemedIcon('ui', 'file_text', 18, theme), label: nl('homework', 'Homework') },
        { id: 'training-activity', path: '/?mode=activities&activityType=training', screenId: 'activities', icon: getThemedIcon('activity_type', 'training', 18, theme), label: nl('training', 'Training') },
        { id: 'lab-activity', path: '/?mode=activities&activityType=lab_work', screenId: 'activities', icon: getThemedIcon('activity_type', 'lab', 18, theme), label: nl('lab_and_project', 'Lab & Project') },
      ]
    },
    {
      id: 'quiz',
      label: nl('quiz', 'Quiz'),
      icon: getThemedIcon('ui', 'list_checks', 18, theme),
      children: [
        { id: 'quiz-results', path: '/review-results?activityType=quiz', screenId: 'quiz-results', icon: getThemedIcon('ui', 'list_checks', 18, theme), label: nl('quiz_results', 'Quiz Results') },
        { id: 'homework-results', path: '/review-results?activityType=homework', screenId: 'homework-results', icon: getThemedIcon('ui', 'file_text', 18, theme), label: nl('homework_results', 'Homework Results') },
        { id: 'training-results', path: '/review-results?activityType=training', screenId: 'training-results', icon: getThemedIcon('activity_type', 'training', 18, theme), label: nl('training_results', 'Training Results') },
        { id: 'lab-results', path: '/review-results?activityType=lab_work', screenId: 'lab-results', icon: getThemedIcon('activity_type', 'lab', 18, theme), label: nl('lab_results', 'Lab Results') },
      ]
    },
    ...studentSchedulingSections,
    {
      id: 'attendance',
      label: nl('attendance', 'Attendance'),
      icon: getThemedIcon('ui', 'qr_code', 18, theme),
      children: [
        { id: 'my-attendance', path: '/my-attendance', screenId: 'my-attendance', icon: getThemedIcon('ui', 'qr_code', 18, theme), label: nl('my_attendance', 'My Attendance') },
      ]
    },
    {
      id: 'community',
      label: nl('community', 'Community'),
      icon: getThemedIcon('ui', 'message_square', 18, theme),
      children: [
        { id: 'chat', path: '/chat', screenId: 'chat', icon: getThemedIcon('ui', 'message_square', 18, theme), label: nl('chat', 'Chat') },
        { id: 'resources', path: '/?mode=resources', screenId: 'resources', icon: getThemedIcon('ui', 'book_open', 18, theme), label: nl('resources', 'Resources') },
      ]
    },
    {
      id: 'tools',
      label: nl('tools', 'Tools'),
      icon: getThemedIcon('ui', 'timer', 18, theme),
      children: [
        { id: 'timerControl', key: 'timerControl', icon: getThemedIcon('ui', 'timer', 18, theme), label: nl('timer', 'Timer') }
      ]
    },
    {
      id: 'settings',
      label: nl('settings', 'Settings'),
      icon: getThemedIcon('ui', 'settings', 18, theme),
      children: [
        { id: 'notifications', path: '/notifications', screenId: 'notifications', icon: getThemedIcon('ui', 'bell', 18, theme), label: nl('notifications', 'Notifications') },
        { id: 'profile', path: '/profile', screenId: 'profile', icon: getThemedIcon('ui', 'settings', 18, theme), label: nl('settings', 'Settings') },
        { id: 'help', path: '/help', screenId: 'home', icon: getThemedIcon('ui', 'help_circle', 18, theme), label: nl('help_center', 'Help Center') },
      ]
    }
  ];

  const adminLinks = [
    {
      id: 'main',
      label: nl('main', 'Main'),
      icon: getThemedIcon('ui', 'home', 18, theme),
      children: [
        { id: 'home', path: '/', screenId: 'home', icon: getThemedIcon('ui', 'home', 18, theme), label: nl('home', 'Home') },
        { id: 'dashboard', path: '/dashboard', screenId: 'dashboard', icon: getThemedIcon('ui', 'layout_dashboard', 18, theme), label: nl('dashboard', 'Dashboard') },
        { id: 'student-dashboard', path: '/student-dashboard', screenId: 'student-dashboard', icon: getThemedIcon('ui', 'layout_dashboard', 18, theme), label: nl('student_dashboard', 'Student Dashboard') },
      ]
    },
    {
      id: 'activity',
      label: nl('activity', 'Activity'),
      icon: getThemedIcon('ui', 'activity', 18, theme),
      children: [
        { id: 'activities', path: '/?mode=activities', screenId: 'activities', icon: getThemedIcon('ui', 'activity', 18, theme), label: nl('activities', 'Activities') },
        { id: 'quiz-activity', path: '/?mode=activities&activityType=quiz', screenId: 'activities', icon: getThemedIcon('ui', 'gamepad2', 18, theme), label: nl('quiz', 'Quiz') },
        { id: 'homework-activity', path: '/?mode=activities&activityType=homework', screenId: 'activities', icon: getThemedIcon('ui', 'file_text', 18, theme), label: nl('homework', 'Homework') },
        { id: 'training-activity', path: '/?mode=activities&activityType=training', screenId: 'activities', icon: getThemedIcon('activity_type', 'training', 18, theme), label: nl('training', 'Training') },
        { id: 'lab-activity', path: '/?mode=activities&activityType=lab_work', screenId: 'activities', icon: getThemedIcon('activity_type', 'lab', 18, theme), label: nl('lab_and_project', 'Lab & Project') },
      ]
    },
    {
      id: 'quiz',
      label: nl('quiz', 'Quiz'),
      icon: getThemedIcon('ui', 'list_checks', 18, theme),
      children: [
        { id: 'quizzes', path: '/quizzes', screenId: 'quizzes', icon: getThemedIcon('ui', 'gamepad2', 18, theme), label: nl('quizzes', 'Quizzes') },
        { id: 'quiz-results', path: '/review-results?activityType=quiz', screenId: 'quiz-results', icon: getThemedIcon('ui', 'list_checks', 18, theme), label: nl('quiz_results', 'Quiz Results') },
      ]
    },
    ...(isSuperAdmin || isInstructor || isAdmin ? [{
      id: 'academic',
      label: nl('academic', 'Academic'),
      icon: getThemedIcon('ui', 'book_open', 18, theme),
      children: [
        { id: 'programs', path: '/dashboard', hash: '#programs', screenId: 'programs', icon: getThemedIcon('ui', 'book_open', 18, theme), label: nl('programs', 'Programs') },
        { id: 'subjects', path: '/dashboard', hash: '#subjects', screenId: 'subjects', icon: getThemedIcon('ui', 'book_open', 18, theme), label: nl('subjects', 'Subjects') },
        { id: 'classes-academic', path: '/dashboard', hash: '#classes', screenId: 'classes', icon: getThemedIcon('ui', 'calendar', 18, theme), label: nl('classes', 'Classes') },
      ]
    }] : []),
    ...(isSuperAdmin || isInstructor || isAdmin ? [{
      id: 'enrollments',
      label: nl('enrollments', 'Enrollments'),
      icon: getThemedIcon('ui', 'users', 18, theme),
      children: [
        { id: 'enrollments', path: '/dashboard', hash: '#enrollments', screenId: 'enrollments', icon: getThemedIcon('ui', 'users', 18, theme), label: nl('enrollments', 'Enrollments') },
        { id: 'manage-enrollments', path: '/manage-enrollments', screenId: 'manage-enrollments', icon: getThemedIcon('ui', 'users', 18, theme), label: nl('manage_enrollments', 'Manage Enrollments') },
        { id: 'marks', path: '/dashboard', hash: '#marks', screenId: 'marks-entry', icon: getThemedIcon('ui', 'award', 18, theme), label: nl('marks_entry', 'Marks Entry') },
      ]
    }] : []),
    ...(isSuperAdmin || isInstructor || isAdmin ? [{
      id: 'records',
      label: nl('academic_records', 'Academic Records'),
      icon: getThemedIcon('ui', 'award', 18, theme),
      children: [
        { id: 'penalty', path: '/dashboard', hash: '#penalty', screenId: 'penalty', icon: getThemedIcon('ui', 'alert_triangle', 18, theme), label: nl('penalty', 'Penalty') },
        { id: 'behavior', path: '/dashboard', hash: '#behavior', screenId: 'behavior', icon: getThemedIcon('ui', 'activity', 18, theme), label: nl('behavior', 'Behavior') },
        { id: 'participation', path: '/dashboard', hash: '#participation', screenId: 'participation', icon: getThemedIcon('ui', 'users', 18, theme), label: nl('participation', 'Participation') },
      ]
    }] : []),
    ...adminSchedulingSections,
    ...(isSuperAdmin ? [{
      id: 'users',
      label: nl('users', 'Users'),
      icon: getThemedIcon('ui', 'users', 18, theme),
      children: [
        { id: 'users', path: '/dashboard', hash: '#users', screenId: 'users', icon: getThemedIcon('ui', 'users', 18, theme), label: nl('users', 'Users') },
        { id: 'user-category-access', path: '/dashboard', hash: '#user-category-access', screenId: 'user-category-access', icon: getThemedIcon('ui', 'shield', 18, theme), label: nl('user_access', 'User Access') }
      ]
    }] : []),
    ...(isSuperAdmin || isInstructor || isAdmin ? [{
      id: 'review',
      label: nl('review_results', 'Review Results'),
      icon: getThemedIcon('ui', 'list_checks', 18, theme),
      children: [
        { id: 'review-quiz', path: '/review-results?activityType=quiz', screenId: 'quiz-results', icon: getThemedIcon('ui', 'list_checks', 18, theme), label: nl('quiz_results', 'Quiz Results') },
        { id: 'review-homework', path: '/review-results?activityType=homework', screenId: 'homework-results', icon: getThemedIcon('ui', 'file_text', 18, theme), label: nl('homework_results', 'Homework Results') },
        { id: 'review-training', path: '/review-results?activityType=training', screenId: 'training-results', icon: getThemedIcon('activity_type', 'training', 18, theme), label: nl('training_results', 'Training Results') },
        { id: 'review-lab', path: '/review-results?activityType=lab_work', screenId: 'lab-results', icon: getThemedIcon('activity_type', 'lab', 18, theme), label: nl('lab_results', 'Lab Results') },
      ]
    }] : []),
    {
      id: 'attendance',
      label: nl('attendance', 'Attendance'),
      icon: getThemedIcon('ui', 'qr_code', 18, theme),
      children: [
        { id: 'attendance-admin', path: '/attendance', screenId: 'attendance', icon: getThemedIcon('ui', 'qr_code', 18, theme), label: nl('attendance', 'Attendance') },
        { id: 'qr-scanner', path: '/qr-scanner', screenId: 'qr-scanner', icon: getThemedIcon('ui', 'qr_code', 18, theme), label: nl('daily_scan', 'Daily Scan') },
        { id: 'hr-attendance', path: '/hr-attendance', screenId: 'hr-attendance', icon: getThemedIcon('ui', 'qr_code', 18, theme), label: nl('hr_attendance', 'HR Attendance') },
        { id: 'operations-board-admin', path: '/operations/board', screenId: 'operations', icon: getThemedIcon('ui', 'layout_grid', 18, theme), label: nl('operations_board_title', 'Operations Board') },
        { id: 'operations-board-admin', path: '/operations/board', screenId: 'operations', icon: getThemedIcon('ui', 'layout_grid', 18, theme), label: nl('operations_board_title', 'Operations Board') },
      ]
    },
    {
      id: 'drive',
      label: nl('drive', 'Drive'),
      icon: getThemedIcon('ui', 'hard_drive', 18, theme),
      children: [
        { id: 'smart-drive', path: '/smart-drive', screenId: 'drive', icon: getThemedIcon('ui', 'hard_drive', 18, theme), label: nl('smart_drive', 'Smart Drive') },
        { id: 'workflow-inbox', path: '/workflow/inbox', screenId: 'workflow', icon: getThemedIcon('ui', 'list', 18, theme), label: nl('workflow_inbox', 'Workflow Inbox') },
      ]
    },
    {
      id: 'analytics',
      label: nl('analytics', 'Analytics'),
      icon: getThemedIcon('ui', 'bar_chart3', 18, theme),
      children: [
        { id: 'advanced-analytics', path: '/advanced-analytics', screenId: 'advanced-analytics', icon: getThemedIcon('ui', 'bar_chart3', 18, theme), label: nl('advanced', 'Advanced') },
        { id: 'breaks-analytics', path: '/summary-dashboard', screenId: 'summary-dashboard', icon: getThemedIcon('ui', 'coffee', 18, theme), label: nl('breaks_analytics', 'Breaks Analytics') },
        { id: 'holidays-analytics', path: '/summary-dashboard', screenId: 'summary-dashboard', icon: getThemedIcon('ui', 'umbrella', 18, theme), label: nl('holidays_analytics', 'Holidays Analytics') },
      ]
    },
    ...(isSuperAdmin ? [{
      id: 'communication',
      label: nl('communication', 'Communication'),
      icon: getThemedIcon('ui', 'calendar', 18, theme),
      children: [
        { id: 'scheduled-reports', path: '/scheduled-reports', screenId: 'scheduled-reports', icon: getThemedIcon('ui', 'calendar', 18, theme), label: nl('schedule_updates', 'Schedule Updates') },
      ]
    }] : []),
    {
      id: 'community',
      label: nl('community', 'Community'),
      icon: getThemedIcon('ui', 'message_square', 18, theme),
      children: [
        { id: 'chat-admin', path: '/chat', screenId: 'chat', icon: getThemedIcon('ui', 'message_square', 18, theme), label: nl('chat', 'Chat') },
        { id: 'resources-admin', path: '/?mode=resources', screenId: 'resources', icon: getThemedIcon('ui', 'book_open', 18, theme), label: nl('resources', 'Resources') },
      ]
    },
    {
      id: 'tools',
      label: nl('tools', 'Tools'),
      icon: getThemedIcon('ui', 'timer', 18, theme),
      children: [
        { id: 'timerControl-admin', key: 'timerControl', icon: getThemedIcon('ui', 'timer', 18, theme), label: nl('timer', 'Timer') }
      ]
    },
    {
      id: 'settings',
      label: nl('workspace_settings', 'Workspace Settings'),
      icon: getThemedIcon('ui', 'settings', 18, theme),
      children: [
        { id: 'notifications-admin', path: '/notifications', screenId: 'notifications', icon: getThemedIcon('ui', 'bell', 18, theme), label: nl('notifications', 'Notifications') },
        { id: 'profile-admin', path: '/profile', screenId: 'profile', icon: getThemedIcon('ui', 'settings', 18, theme), label: nl('settings', 'Settings') },
        { id: 'help-admin', path: '/help', screenId: 'home', icon: getThemedIcon('ui', 'help_circle', 18, theme), label: nl('help_center', 'Help Center') }
      ]
    }
  ];

  const hrSchedulingSections = buildSchedulingSections('-hr', { includeSummary: true, includeSetup: true });

  const hrLinks = [
    {
      id: 'drive',
      label: nl('drive', 'Drive'),
      icon: getThemedIcon('ui', 'hard_drive', 18, theme),
      children: [
        { id: 'smart-drive', path: '/smart-drive', screenId: 'drive', icon: getThemedIcon('ui', 'hard_drive', 18, theme), label: nl('smart_drive', 'Smart Drive') },
      ],
    },
    {
      id: 'attendance',
      label: nl('attendance', 'Attendance'),
      icon: getThemedIcon('ui', 'qr_code', 18, theme),
      children: [
        { id: 'manual-input-hr', path: '/qr-scanner', screenId: 'qr-scanner', icon: getThemedIcon('ui', 'edit', 18, theme), label: nl('manual_input', 'Manual Input') },
        { id: 'operations-board-hr', path: '/operations/board', screenId: 'operations', icon: getThemedIcon('ui', 'layout_grid', 18, theme), label: nl('operations_board_title', 'Operations Board') },
      ],
    },
    {
      id: 'operations',
      label: nl('operations_board_title', 'Operations Board'),
      icon: getThemedIcon('ui', 'layout_grid', 18, theme),
      children: [
        { id: 'operations-board', path: '/operations/board', screenId: 'operations', icon: getThemedIcon('ui', 'layout_grid', 18, theme), label: nl('operations_board_title', 'Operations Board') },
      ],
    },
    {
      id: 'settings',
      label: nl('settings', 'Settings'),
      icon: getThemedIcon('ui', 'settings', 18, theme),
      children: [
        { id: 'profile', path: '/profile', screenId: 'profile', icon: getThemedIcon('ui', 'settings', 18, theme), label: nl('settings', 'Settings') },
        { id: 'notifications', path: '/notifications', screenId: 'notifications', icon: getThemedIcon('ui', 'bell', 18, theme), label: nl('notifications', 'Notifications') },
      ],
    },
  ];

  // Minimal instructor menu (scoped teaching workflow)
  const instructorLinks = [
    {
      id: 'drive-instructor',
      label: nl('drive', 'Drive'),
      icon: getThemedIcon('ui', 'hard_drive', 18, theme),
      children: [
        { id: 'smart-drive-instructor', path: '/smart-drive', screenId: 'drive', icon: getThemedIcon('ui', 'hard_drive', 18, theme), label: nl('smart_drive', 'Smart Drive') },
      ],
    },
    {
      id: 'attendance-instructor',
      label: nl('attendance', 'Attendance'),
      icon: getThemedIcon('ui', 'qr_code', 18, theme),
      children: [
        { id: 'qr-scanner-instructor', path: '/qr-scanner', screenId: 'qr-scanner', icon: getThemedIcon('ui', 'qr_code', 18, theme), label: nl('daily_scan', 'Daily Scan') },
      ],
    },
    {
      id: 'operations-instructor',
      label: nl('operations_board_title', 'Operations Board'),
      icon: getThemedIcon('ui', 'layout_grid', 18, theme),
      children: [
        { id: 'operations-board-instructor', path: '/operations/board', screenId: 'operations', icon: getThemedIcon('ui', 'layout_grid', 18, theme), label: nl('operations_board_title', 'Operations Board') },
      ],
    },
    {
      id: 'settings-instructor',
      label: nl('settings', 'Settings'),
      icon: getThemedIcon('ui', 'settings', 18, theme),
      children: [
        { id: 'profile-instructor', path: '/profile', screenId: 'profile', icon: getThemedIcon('ui', 'settings', 18, theme), label: nl('settings', 'Settings') },
        { id: 'notifications-instructor', path: '/notifications', screenId: 'notifications', icon: getThemedIcon('ui', 'bell', 18, theme), label: nl('notifications', 'Notifications') },
      ],
    },
  ];

  // Program supervisor admin menu (scoped admin, no system tools)
  const programAdminLinks = [
    {
      id: 'drive-progadmin',
      label: nl('drive', 'Drive'),
      icon: getThemedIcon('ui', 'hard_drive', 18, theme),
      children: [
        { id: 'smart-drive-progadmin', path: '/smart-drive', screenId: 'drive', icon: getThemedIcon('ui', 'hard_drive', 18, theme), label: nl('smart_drive', 'Smart Drive') },
      ],
    },
    {
      id: 'attendance-progadmin',
      label: nl('attendance', 'Attendance'),
      icon: getThemedIcon('ui', 'qr_code', 18, theme),
      children: [
        { id: 'qr-scanner-progadmin', path: '/qr-scanner', screenId: 'qr-scanner', icon: getThemedIcon('ui', 'qr_code', 18, theme), label: nl('daily_scan', 'Daily Scan') },
      ],
    },
    {
      id: 'operations-progadmin',
      label: nl('operations_board_title', 'Operations Board'),
      icon: getThemedIcon('ui', 'layout_grid', 18, theme),
      children: [
        { id: 'operations-board-progadmin', path: '/operations/board', screenId: 'operations', icon: getThemedIcon('ui', 'layout_grid', 18, theme), label: nl('operations_board_title', 'Operations Board') },
      ],
    },
    {
      id: 'settings-progadmin',
      label: nl('settings', 'Settings'),
      icon: getThemedIcon('ui', 'settings', 18, theme),
      children: [
        { id: 'profile-progadmin', path: '/profile', screenId: 'profile', icon: getThemedIcon('ui', 'settings', 18, theme), label: nl('settings', 'Settings') },
        { id: 'notifications-progadmin', path: '/notifications', screenId: 'notifications', icon: getThemedIcon('ui', 'bell', 18, theme), label: nl('notifications', 'Notifications') },
      ],
    },
  ];

  let links = studentLinks;
  if (!impersonating) {
    if (isSuperAdmin) {
      links = [...adminLinks];
      const toolsSection = links.find(section => section.id === 'tools');
      if (toolsSection) {
        toolsSection.children.push({
          id: 'permission-matrix',
          path: '/permission-matrix',
          screenId: 'permission-matrix',
          icon: getThemedIcon('ui', 'shield', 18, theme),
          label: nl('permission_matrix', 'Permission Matrix'),
        });
      }
    } else if (isAdmin) {
      links = [...programAdminLinks];
    } else if (isInstructor) {
      links = [...instructorLinks];
    } else if (isHR) {
      links = [...hrLinks];
    }
  }

  // Hide Help Center from the drawer for non-super-admins
  if (!isSuperAdmin) {
    links = links
      .map((section) => ({
        ...section,
        children: section.children?.filter((item) =>
          !(item.id?.startsWith('help') || item.path === '/help')
        ),
      }))
      .filter((section) => section.children?.length > 0);
  }

  // Filter menu items based on screen access permissions
  const filterMenuItems = (items) => {
    return items.filter(item => {
      // Super admin sees all items
      if (roleCode === ROLE_STRINGS.SUPER_ADMIN) return true;
      
      // Items with 'key' instead of 'path' are not checked against permissions
      if (item.key && !item.path) return true;
      
      // Check if user can access this screen (path, hash, or explicit screenId)
      const screenKey = item.screenId || resolveScreenIdFromNavItem({
        path: item.path,
        hash: item.hash,
        search: item.search,
      });
      return checkScreenAccess(screenKey);
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
      {drawerLayout.shouldMount && (
        <>
          {drawerLayout.showOverlay ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              drawerTlog('overlay:click-close', { isOpen, stickyMode, autoHide });
              if (autoHide && !collapsed) setIsHovering(false);
              onClose();
            }}
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
          {drawerLayout.showHotspot && (
            <div
              onMouseEnter={() => expandDrawer('hotspot-hover')}
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
                onClick={() => expandDrawer('hotspot-click')}
                title={t('expand')}
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
            animate={{ x: drawerLayout.motionX }}
            exit={{ x: drawerLayout.pushLayout ? 0 : (lang==='ar' ? drawerWidth : -drawerWidth) }}
            transition={{
              type: 'tween',
              duration: drawerLayout.autoHideActive ? AUTO_HIDE_TRANSITION_S : 0.3,
              ease: [0.4, 0, 0.2, 1]
            }}
            style={{
              position: 'fixed',
              top: 0,
              left: lang==='ar' ? 'auto' : (drawerLayout.pushLayout ? 0 : (drawerLayout.slideOff ? -(drawerWidth - AUTO_HIDE_STRIP_PX) : 0)),
              right: lang==='ar' ? (drawerLayout.pushLayout ? 0 : (drawerLayout.slideOff ? -(drawerWidth - AUTO_HIDE_STRIP_PX) : 0)) : 'auto',
              bottom: 0,
              height: '100vh',
              width: drawerLayout.panelWidth,
              background: theme === 'light' ? '#ffffff' : 'linear-gradient(180deg, #0f172a, #111827)',
              borderRight: lang==='ar' ? 'none' : (theme === 'light' ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.1)'),
              borderLeft: lang==='ar' ? (theme === 'light' ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.1)') : 'none',
              color: theme === 'light' ? '#0f172a' : 'white',
              fontSize: 'var(--font-size-sm)',
              zIndex: drawerLayout.pushLayout ? 1000 : 9999,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: drawerLayout.pushLayout ? 'none' : '2px 0 10px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden',
              transition: drawerLayout.pushLayout
                ? (drawerLayout.autoHideActive ? `width ${AUTO_HIDE_TRANSITION_S}s ease` : 'width 0.3s ease')
                : 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              flexShrink: 0,
              pointerEvents: drawerLayout.isExpanded || collapsed ? 'auto' : 'none',
            }}
            onMouseEnter={() => {
              if (autoHide && !collapsed) expandDrawer('panel-hover');
            }}
            onMouseLeave={() => scheduleCollapse('panel-leave')}
          >
            {/* Magic arrow for collapsed (icons-only) restore */}
            {collapsed && (
              <button
                onClick={() => setCollapsed(false)}
                title={t('expand')}
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
                let newW = startW;
                const onMove = (ev) => {
                  const delta = lang==='ar' ? (startX - ev.clientX) : (ev.clientX - startX);
                  newW = Math.min(600, Math.max(280, startW + delta));
                  setDrawerWidth(newW);
                };
                const onUp = () => {
                  try { localStorage.setItem('drawer_width', String(newW)); } catch {}
                  window.removeEventListener('mousemove', onMove);
                  window.removeEventListener('mouseup', onUp);
                };
                window.addEventListener('mousemove', onMove);
                window.addEventListener('mouseup', onUp);
              }}
              title={t('resize')}
              style={{ position:'absolute', top:0, [lang==='ar' ? 'left' : 'right']: -5, width:10, height:'100%', cursor:'ew-resize',
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
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #D4AF37, #FFD700)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 'var(--font-size-lg)',
                      fontWeight: 700,
                      color: '#2E3B4E',
                      overflow: 'hidden'
                    }}>
                      {user?.profileImageUrl ? (
                        <img src={user.profileImageUrl} alt={user?.displayName || user?.email || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        (user?.displayName || user?.email || 'U').charAt(0).toUpperCase()
                      )}
                    </div>
                    {/* Role badge overlay */}
                    {(() => {
                      const role = resolveUserRole(user);
                      if (!role) return null;
                      const roleIcon = getUserRoleIcon(role);
                      const roleColor = getUserRoleColor(role);
                      if (!roleIcon) return null;
                      return (
                        <div style={{ position: 'absolute', bottom: '-2px', insetInlineEnd: '-2px', width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', color: '#ffffff', boxShadow: 'none' }}
                          title={t(`roles.${role}`, role)}
                        >
                          {React.cloneElement(roleIcon, { fill: roleColor })}
                        </div>
                      );
                    })()}
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
                        title={theme==='light' ? (t('switch_to_dark')) : (t('switch_to_light'))}
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
                          setCollapsed((v) => {
                            const next = !v;
                            drawerTlog('btn:collapse', { from: v, to: next, stickyMode, autoHide });
                            if (v) setAutoHide(false);
                            return next;
                          });
                        }}
                        title={collapsed ? (t('expand')) : (t('collapse'))}
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
                        onClick={() => {
                          setAutoHide((v) => {
                            const next = !v;
                            drawerTlog('btn:autoHide', { from: v, to: next, stickyMode, collapsed });
                            if (next) {
                              if (stickyMode) {
                                drawerTlog('sync:mutual-exclusion', { action: 'autoHide-on→sticky-off' });
                                setStickyMode(false);
                              }
                              expandDrawer('autoHide-enabled');
                            }
                            return next;
                          });
                        }}
                        title={autoHide ? (t('disable_auto_hide')) : (t('enable_auto_hide'))}
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
                        onClick={() => {
                          setStickyMode((v) => {
                            const next = !v;
                            drawerTlog('btn:sticky', { from: v, to: next, autoHide, isOpen, collapsed });
                            if (next && autoHide) {
                              drawerTlog('sync:mutual-exclusion', { action: 'sticky-on→autoHide-off' });
                              setAutoHide(false);
                            }
                            if (!next) {
                              drawerTlog('sync:sticky-off', { isOpen, note: 'overlay mode; visibility = isOpen' });
                            }
                            return next;
                          });
                        }}
                        title={stickyMode ? (t('disable_sticky')) : (t('enable_sticky'))}
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
                        onClick={() => {
                          drawerTlog('btn:close', { isOpen, stickyMode, autoHide, collapsed, isHovering });
                          if (autoHide && !collapsed) setIsHovering(false);
                          onClose();
                        }}
                        data-base-bg={neutralBg}
                        data-hover-bg={neutralHover}
                        style={{
                          background: neutralBg,
                          border: 'none',
                          color: theme==='light' ? '#111' : 'white',
                          fontSize: 'var(--font-size-xl)',
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
                      title={t('timer')}
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
                  fontSize: 'var(--font-size-sm)',
                  color: 'white'
                }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.5rem', display:'flex', alignItems:'center', gap:6 }}>
                    {getThemedIcon('ui', 'help_circle', 16, theme)} {t('impersonating')}
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
                      fontSize: 'var(--font-size-sm)'
                    }}
                  >
                    {t('stop_impersonation')}
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
                        color: theme==='light' ? '#111827' : 'rgba(255,255,255,0.85)',
                        fontSize: 'var(--font-size-sm)',
                        textTransform: 'none',
                        letterSpacing: lang === 'ar' ? '0.5px' : '0.3px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'background 0.2s, color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = theme==='light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
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
                            fontSize: 'var(--font-size-sm)',
                            boxSizing: 'border-box',
                            minHeight: 'calc(2.35 * var(--type-base))'
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
                            width: ICON_SIZE_VARS.lg, 
                            minWidth: ICON_SIZE_VARS.lg,
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            color: isActive(link.path, link.hash)
                              ? userAccentColor
                              : (theme==='light' ? '#6b7280' : '#9ca3af')
                          }}>
                            {React.cloneElement(link.icon, { 
                              size: navIconSize, 
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
                          onClick={() => {
                            syncDashboardTabFromHash(link.path, link.hash);
                            onClose();
                          }}
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
                          fontSize: 'var(--font-size-sm)',
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
                            width: ICON_SIZE_VARS.lg, 
                            minWidth: ICON_SIZE_VARS.lg,
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            color: isActive(link.path, link.hash)
                              ? userAccentColor
                              : (theme==='light' ? '#6b7280' : '#9ca3af')
                          }}>
                            {React.cloneElement(link.icon, { 
                              size: navIconSize, 
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
                        title={t('open_in_new_tab')}
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
                        {getThemedIcon('ui', 'external_link', 12, theme==='light' ? '#111827' : '#e5e7eb')}
                      </button>)}
                      {!collapsed && density === 'compact' && (() => {
                        const pinned = link.key==='timerControl' ? pinTimer : isPinned(link.path);
                        return (
                          <button
                            title={pinned ? (t('unpin')) : (t('pin'))}
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
                            {pinned ? getThemedIcon('ui', 'pin_off', 12, pinned ? userAccentColor : (theme==='light' ? '#111827' : '#e5e7eb')) : getThemedIcon('ui', 'pin', 12, pinned ? userAccentColor : (theme==='light' ? '#111827' : '#e5e7eb'))}
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
                      fontSize: 'var(--font-size-xs)',
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
                title={collapsed ? (t('switch_language')) : ''}
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
                {collapsed ? getThemedIcon('ui', 'globe', 16, theme) : <span>{t(lang === 'en' ? 'arabic' : 'english')}</span>}
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                title={collapsed ? (t('logout')) : ''}
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
                {collapsed ? getThemedIcon('ui', 'log_out', 16, theme) : <span>{t('logout')}</span>}
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

