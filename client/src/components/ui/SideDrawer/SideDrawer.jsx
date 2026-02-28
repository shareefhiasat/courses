import React, { useEffect, useMemo, useState } from 'react';
import { useIsMobile } from '@hooks/useIsMobile';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { signOutUser } from '@services/business/authService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@services/other/config';
import { normalizeHexColor, DEFAULT_ACCENT, hexToRgbString } from '@utils/color';
import { getThemedIcon } from '@constants/iconTypes';
import { TimerStopwatch } from '@ui';
import VersionDisplay from '@ui/VersionDisplay/VersionDisplay';

const SideDrawer = ({ isOpen, onClose }) => {
  const { user, isAdmin, isSuperAdmin, isHR, isInstructor, role, impersonating, stopImpersonation } = useAuth();
  const { t, lang, toggleLang } = useLang();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [drawerWidth, setDrawerWidth] = useState(() => {
    try { return Math.min(480, Math.max(260, parseInt(localStorage.getItem('drawer_width') || '280', 10))); } catch { return 280; }
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
      if (saved === null) return true; // Default to sticky
      return saved === 'true'; 
    } catch { return true; }
  });
  const isMobile = useIsMobile();
  const [userAccentColor, setUserAccentColor] = useState(DEFAULT_ACCENT);
  const [navigationConfirmation, setNavigationConfirmation] = useState(null);
  
  // Load user's accent color
  useEffect(() => {
    if (!user?.uid) return;
    const loadAccentColor = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const color = normalizeHexColor(data.messageColor, DEFAULT_ACCENT);
          setUserAccentColor(color);
        }
      } catch (e) {
        console.warn('[SideDrawer] Error loading accent color:', e);
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
    if (stickyMode && isOpen && !collapsed && !isMobile) {
      const width = collapsed ? 64 : drawerWidth;
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
  }, [stickyMode, isOpen, collapsed, drawerWidth, isMobile]);
  useEffect(() => {
    const handler = (e) => setDensity((e && e.detail && e.detail.density) ? e.detail.density : (document.documentElement.getAttribute('data-density') || 'compact'));
    window.addEventListener('density-change', handler);
    return () => window.removeEventListener('density-change', handler);
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
    await signOutUser(user);
    navigate('/login');
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
    if (hash) {
      return location.pathname === path && location.hash === hash;
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
    analytics: false,
    community: false,
    tools: false,
    settings: false
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

  // Grouped navigation with tree structure
  // Student: Class-centric view with enrollments and schedules
  const studentLinks = {
    main: {
      label: t('main') || 'MAIN',
      items: [
        { path: '/', icon: getThemedIcon('ui', 'home', 18, theme), label: t('home') || 'Home' },
        { path: '/student-dashboard', icon: getThemedIcon('ui', 'layout_dashboard', 18, theme), label: t('student_dashboard') || 'Student Dashboard' },
        { path: '/student-dashboard', icon: getThemedIcon('ui', 'bar_chart3', 18, theme), label: t('progress') || 'Progress' },
        { path: '/?mode=activities', icon: getThemedIcon('ui', 'activity', 18, theme), label: (t('activities') || 'Activities').charAt(0).toUpperCase() + (t('activities') || 'Activities').slice(1) },
        { path: '/?mode=quizzes', icon: getThemedIcon('ui', 'gamepad2', 18, theme), label: (t('quizzes') || 'Quizzes').charAt(0).toUpperCase() + (t('quizzes') || 'Quizzes').slice(1) },
      ]
    },
    quiz: {
      label: t('quiz') || 'QUIZ',
      items: [
        { path: '/review-results', icon: getThemedIcon('ui', 'list_checks', 18, theme), label: (t('quiz_results') || 'Quiz Results').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') },
        { path: '/?mode=quizzes', icon: getThemedIcon('ui', 'list_checks', 18, theme), label: (t('quizzes') || 'Quizzes').charAt(0).toUpperCase() + (t('quizzes') || 'Quizzes').slice(1) },
        { path: '/?mode=activities', icon: getThemedIcon('ui', 'activity', 18, theme), label: (t('activities') || 'Activities').charAt(0).toUpperCase() + (t('activities') || 'Activities').slice(1) },
        { path: '/?mode=homework', icon: getThemedIcon('ui', 'file_text', 18, theme), label: (t('homework') || 'Homework').charAt(0).toUpperCase() + (t('homework') || 'Homework').slice(1) },
      ]
    },
    classes: {
      label: t('classes') || 'CLASSES',
      items: [
        { path: '/my-enrollments', icon: getThemedIcon('ui', 'book_open', 18, theme), label: t('my_enrollments') || 'My Enrollments' },
        { path: '/class-schedules', icon: getThemedIcon('ui', 'calendar', 18, theme), label: t('schedules') || 'Schedules' },
      ]
    },
    attendance: {
      label: t('attendance') || 'ATTENDANCE',
      items: [
        { path: '/my-attendance', icon: getThemedIcon('ui', 'qr_code', 18, theme), label: (t('my_attendance') || 'My Attendance').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') },
      ]
    },
    community: {
      label: t('community') || 'COMMUNITY',
      items: [
        { path: '/chat', icon: getThemedIcon('ui', 'message_square', 18, theme), label: (t('chat') || 'Chat').charAt(0).toUpperCase() + (t('chat') || 'Chat').slice(1) },
        { path: '/?mode=resources', icon: getThemedIcon('ui', 'book_open', 18, theme), label: (t('resources') || 'Resources').charAt(0).toUpperCase() + (t('resources') || 'Resources').slice(1) },
      ]
    },
    tools: {
      label: t('tools') || 'TOOLS',
      items: [
        { key: 'timerControl', icon: getThemedIcon('ui', 'timer', 18, theme), label: t('timer') || 'Timer' }
      ]
    },
    settings: {
      label: t('settings') || 'SETTINGS',
      items: [
        { path: '/notifications', icon: getThemedIcon('ui', 'bell', 18, theme), label: (t('notifications') || 'Notifications').charAt(0).toUpperCase() + (t('notifications') || 'Notifications').slice(1) },
        { path: '/profile', icon: getThemedIcon('ui', 'settings', 18, theme), label: (t('settings') || 'Settings').charAt(0).toUpperCase() + (t('settings') || 'Settings').slice(1) },
      ]
    }
  };

  // Admin & SuperAdmin: Full management view
  const adminLinks = {
    main: {
      label: t('main') || 'MAIN',
      items: [
        { path: '/', icon: getThemedIcon('ui', 'home', 18, theme), label: t('home') || 'Home' },
        { path: '/dashboard', icon: getThemedIcon('ui', 'layout_dashboard', 18, theme), label: t('dashboard') || 'Dashboard' },
        { path: '/student-dashboard', icon: getThemedIcon('ui', 'layout_dashboard', 18, theme), label: t('student_dashboard') || 'Student Dashboard' },
        { path: '/?mode=activities', icon: getThemedIcon('ui', 'activity', 18, theme), label: t('activities') || 'Activities' },
        // Role Access only visible for SuperAdmin (conditionally added below)
      ]
    },
    quiz: {
      label: t('quiz') || 'QUIZ',
      items: [
        { path: '/quizzes', icon: getThemedIcon('ui', 'gamepad2', 18, theme), label: (t('quizzes') || 'Quizzes').charAt(0).toUpperCase() + (t('quizzes') || 'Quizzes').slice(1) },
        { path: '/review-results', icon: getThemedIcon('ui', 'list_checks', 18, theme), label: t('quiz_results') || 'Quiz Results' },
      ]
    },
    academic: isSuperAdmin || isInstructor || isAdmin ? {
      label: t('academic') || 'ACADEMIC',
      items: [
        { path: '/dashboard', hash: '#programs', icon: getThemedIcon('ui', 'book_open', 18, theme), label: t('programs') || 'Programs' },
        { path: '/dashboard', hash: '#subjects', icon: getThemedIcon('ui', 'book_open', 18, theme), label: t('subjects') || 'Subjects' },
        { path: '/dashboard', hash: '#classes', icon: getThemedIcon('ui', 'calendar', 18, theme), label: t('classes') || 'Classes' },
        { path: '/dashboard', hash: '#enrollments', icon: getThemedIcon('ui', 'users', 18, theme), label: t('enrollments') || 'Enrollments' },
        { path: '/dashboard', hash: '#marks', icon: getThemedIcon('ui', 'award', 18, theme), label: t('marks_entry') || 'Marks Entry' },
        { path: '/dashboard', hash: '#class-schedule', icon: getThemedIcon('ui', 'calendar', 18, theme), label: t('class_schedules') || 'Class Schedule' },
        { path: '/review-results?mode=quiz', icon: getThemedIcon('ui', 'list_checks', 18, theme), label: t('quiz_results') || 'Quiz Results' },
        { path: '/review-results?mode=homework', icon: getThemedIcon('ui', 'file_text', 18, theme), label: t('homework_results') || 'Homework Results' },
        { path: '/review-results?mode=training', icon: getThemedIcon('ui', 'activity', 18, theme), label: t('training_results') || 'Training Results' },
        { path: '/review-results?mode=labandproject', icon: getThemedIcon('ui', 'clipboard_list', 18, theme), label: t('lab_results') || 'Lab Results' },
        { path: '/penalty', icon: getThemedIcon('ui', 'alert_triangle', 18, theme), label: t('penalty') || 'Penalty' },
        { path: '/participation', icon: getThemedIcon('ui', 'award', 18, theme), label: t('participation') || 'Participation' },
        { path: '/behavior', icon: getThemedIcon('ui', 'alert_circle', 18, theme), label: t('behavior') || 'Behavior' },
      ]
    } : null,
    classes: {
      label: t('classes') || 'CLASSES',
      items: [
        { path: '/class-schedules', icon: getThemedIcon('ui', 'calendar', 18, theme), label: t('schedules') || 'Schedules' },
        { path: '/manage-enrollments', icon: getThemedIcon('ui', 'users', 18, theme), label: t('manage_enrollments') || 'Manage Enrollments' },
      ]
    },
    attendance: {
      label: t('attendance') || 'ATTENDANCE',
      items: [
        { path: '/attendance', icon: getThemedIcon('ui', 'qr_code', 18, theme), label: (t('attendance') || 'Attendance').charAt(0).toUpperCase() + (t('attendance') || 'Attendance').slice(1) },
        { path: '/qr-scanner', icon: getThemedIcon('ui', 'qr_code', 18, theme), label: t('qr_class') || 'QR Class' },
        { path: '/hr-attendance', icon: getThemedIcon('ui', 'qr_code', 18, theme), label: (t('hr_attendance') || 'HR Attendance').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') },
      ]
    },
    analytics: {
      label: t('analytics') || 'ANALYTICS',
      items: [
        { path: '/analytics', icon: getThemedIcon('ui', 'bar_chart3', 18, theme), label: t('dashboards') || 'Dashboards' },
        { path: '/advanced-analytics', icon: getThemedIcon('ui', 'bar_chart3', 18, theme), label: t('advanced') || 'Advanced' },
        { path: '/performance', icon: getThemedIcon('ui', 'activity', 18, theme), label: t('performance') || 'Performance' },
      ]
    },
    communication: {
      label: t('communication') || 'COMMUNICATION',
      items: [
        { path: '/scheduled-reports', icon: getThemedIcon('ui', 'calendar', 18, theme), label: t('scheduling') || 'Scheduling' },
      ]
    },
    community: {
      label: t('community') || 'COMMUNITY',
      items: [
        { path: '/chat', icon: getThemedIcon('ui', 'message_square', 18, theme), label: t('chat') || 'Chat' },
        { path: '/?mode=resources', icon: getThemedIcon('ui', 'book_open', 18, theme), label: t('resources') || 'Resources' },
      ]
    },
    tools: {
      label: t('tools') || 'TOOLS',
      items: [
        { key: 'timerControl', icon: getThemedIcon('ui', 'timer', 18, theme), label: t('timer') || 'Timer' }
      ]
    },
    settings: {
      label: t('workspace_settings') || 'WORKSPACE SETTINGS',
      items: [
        { path: '/notifications', icon: getThemedIcon('ui', 'bell', 18, theme), label: t('notifications') || 'Notifications' },
        { path: '/student-profile', icon: getThemedIcon('ui', 'user', 18, theme), label: t('student_profile') || 'Student Profile' },
        { path: '/profile', icon: getThemedIcon('ui', 'settings', 18, theme), label: t('settings') || 'Settings' }
      ]
    }
  };

  const hrLinks = {
    main: {
      label: t('main') || 'MAIN',
      items: [
        { path: '/', icon: getThemedIcon('ui', 'home', 18, theme), label: t('home') || 'Home' },
        { path: '/hr-attendance', icon: getThemedIcon('ui', 'qr_code', 18, theme), label: t('hr_attendance') || 'HR Attendance' },
        { path: '/analytics', icon: getThemedIcon('ui', 'bar_chart3', 18, theme), label: t('analytics') || 'Analytics' },
      ]
    },
    community: {
      label: t('community') || 'COMMUNITY',
      items: [
        { path: '/chat', icon: getThemedIcon('ui', 'message_square', 18, theme), label: t('chat') || 'Chat' },
      ]
    },
    settings: {
      label: t('settings') || 'SETTINGS',
      items: [
        { path: '/notifications', icon: getThemedIcon('ui', 'bell', 18, theme), label: t('notifications') || 'Notifications' },
        { path: '/student-profile', icon: getThemedIcon('ui', 'user', 18, theme), label: t('student_profile') || 'Student Profile' },
        { path: '/profile', icon: getThemedIcon('ui', 'settings', 18, theme), label: t('settings') || 'Settings' },
        { key: 'timerControl', icon: getThemedIcon('ui', 'timer', 18, theme), label: t('timer') || 'Timer' }
      ]
    }
  };

  // Instructor: Same as Admin (everything except Role Access)
  const instructorLinks = adminLinks;

  let links = studentLinks;
  if (!impersonating) {
    // Super admins and admins get admin links, instructors get same as admin
    if (isAdmin || isSuperAdmin || isInstructor) {
      // Create a proper deep clone without circular references
      links = {
        main: { ...adminLinks.main, items: [...adminLinks.main.items] },
        quiz: { ...adminLinks.quiz, items: [...adminLinks.quiz.items] },
        ...(adminLinks.academic ? { academic: adminLinks.academic } : {}),
        classes: { ...adminLinks.classes, items: [...adminLinks.classes.items] },
        attendance: { ...adminLinks.attendance, items: [...adminLinks.attendance.items] },
        analytics: { ...adminLinks.analytics, items: [...adminLinks.analytics.items] },
        ...(adminLinks.communication ? { communication: adminLinks.communication } : {}),
        community: { ...adminLinks.community, items: [...adminLinks.community.items] },
        tools: { ...adminLinks.tools, items: [...adminLinks.tools.items] },
        settings: { ...adminLinks.settings, items: [...adminLinks.settings.items] }
      };
      // Add Role Access only for SuperAdmin
      if (isSuperAdmin) {
        links.main.items.push({ path: '/role-access-pro', icon: getThemedIcon('ui', 'shield', 18, theme), label: t('role_access') || 'Role Access' });
      }
    } else if (isHR) {
      links = {
        main: { ...hrLinks.main, items: [...hrLinks.main.items] },
        community: { ...hrLinks.community, items: [...hrLinks.community.items] },
        settings: { ...hrLinks.settings, items: [...hrLinks.settings.items] }
      };
    }
  }
  
  return (
    <AnimatePresence>
      {isOpen && (
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
            transition={{ type: 'tween', ease: 'easeInOut' }}
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
              width: collapsed ? 64 : drawerWidth,
              background: theme === 'light' ? '#ffffff' : 'linear-gradient(180deg, #0f172a, #111827)',
              borderRight: lang==='ar' ? 'none' : (theme === 'light' ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.1)'),
              borderLeft: lang==='ar' ? (theme === 'light' ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.1)') : 'none',
              color: theme === 'light' ? '#0f172a' : 'white',
              zIndex: stickyMode ? 100 : 9999,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: stickyMode ? 'none' : '2px 0 10px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden',
              transition: stickyMode ? 'none' : 'width 0.3s ease-in-out',
              flexShrink: 0
            }}
            onMouseEnter={() => (autoHide && !collapsed && !stickyMode) ? setIsHovering(true) : null}
            onMouseLeave={() => (autoHide && !collapsed && !stickyMode) ? setIsHovering(false) : null}
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
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
                    <>
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
                          display:'flex', alignItems:'center', justifyContent:'center', marginRight: 4,
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
                          display:'flex', alignItems:'center', justifyContent:'center', marginRight: 4,
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
                          display:'flex', alignItems:'center', justifyContent:'center', marginRight: 4,
                          transition: 'background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease'
                        }}
                        onMouseEnter={onHeaderButtonEnter}
                        onMouseLeave={onHeaderButtonLeave}
                      >
                        {getThemedIcon('ui', 'help_circle', 14, theme)}
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
                          display:'flex', alignItems:'center', justifyContent:'center', marginRight: 4,
                          transition: 'background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease'
                        }}
                        onMouseEnter={onHeaderButtonEnter}
                        onMouseLeave={onHeaderButtonLeave}
                      >
                        {stickyMode ? getThemedIcon('ui', 'pin', 12, theme) : getThemedIcon('ui', 'open_tab', 12, theme)}
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
                    </>
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

            {/* Navigation Links (Tree Structure) */}
            <nav style={{ flex: 1, padding: '0.5rem 0 1rem 0', overflowY: 'auto' }}>
              {Object.entries(links).map(([groupKey, group]) => (
                <div key={groupKey} style={{ marginTop: '0.1rem' }}>
                  {/* Section Header - Collapsible */}
                  {(!collapsed && (!autoHide || isHovering)) && (
                    <button
                      onClick={() => toggleSection(groupKey)}
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
                      <span>{group.label}</span>
                      {expandedSections[groupKey] ? getThemedIcon('ui', 'chevron_down', 14, theme) : getThemedIcon('ui', 'chevron_right', 14, theme)}
                    </button>
                  )}
                  
                  {/* Section Items - Collapsible */}
                  <AnimatePresence initial={false}>
                  {expandedSections[groupKey] && (
                    <motion.div
                      key={`${groupKey}-items`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                    {group.items.map((link, idx) => (
                    <div key={link.key || `${groupKey}-${link.path}${link.hash || ''}-${idx}`} style={{ display:'flex', alignItems:'center', gap:8, margin:'0 0.5rem' }}>
                      {link.key === 'timerControl' ? (
                        <button
                          onClick={() => setShowTimerPanel(v=>!v)}
                          title={link.label}
                          style={{
                            display:'flex', alignItems:'center', gap:'0.85rem', padding:'0.7rem 1rem', borderRadius:8,
                            color: theme==='light' ? '#111827' : 'rgba(255,255,255,0.85)', background:'transparent',
                            border: 'none', cursor:'pointer', flex:1
                          }}
                        >
                          <span style={{ 
                            width: '20px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            color: theme==='light' ? '#6b7280' : '#9ca3af'
                          }}>
                            {React.cloneElement(link.icon, { 
                              size: 18, 
                              color: theme==='light' ? '#6b7280' : '#9ca3af'
                            })}
                          </span>
                          <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>{link.label}</span>
                        </button>
                      ) : (
                        <Link
                          to={link.hash ? `${link.path}${link.hash}` : link.path}
                          onClick={onClose}
                          title={link.label}
                          style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: ( (autoHide && !isHovering) || collapsed ) ? 'center' : 'flex-start',
                          gap: '0.85rem',
                          padding: ( (autoHide && !isHovering) || collapsed ) ? '0.7rem' : '0.7rem 1rem',
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
                          {(!collapsed && (!autoHide || isHovering)) && <span style={{ display:'inline-flex', alignItems:'center', gap:6, whiteSpace: 'nowrap' }}>{link.label}</span>}
                        </Link>
                      )}
                      {!collapsed && density === 'compact' && (
                      <button
                        title={t('open_in_new_tab') || 'Open in new tab'}
                        onClick={() => link.key==='timerControl' ? setShowTimerPanel(v=>!v) : window.open(link.path, '_blank', 'noopener,noreferrer')}
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
                justifyContent: collapsed ? 'center' : 'space-between',
                alignItems: 'center',
                gap: collapsed ? '0.75rem' : '0.5rem'
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
                  flex: collapsed ? '1' : 'auto'
                }}
                onMouseEnter={onFooterHover}
                onMouseLeave={onFooterLeave}
              >
                <span>{t(lang === 'en' ? 'arabic' : 'english') || (lang === 'en' ? 'العربية' : 'English')}</span>
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                title={collapsed ? (t('logout') || 'Logout') : ''}
                style={{
                  ...logoutButtonStyle,
                  margin: '0',
                  flex: collapsed ? '1' : 'auto'
                }}
                onMouseEnter={onFooterHover}
                onMouseLeave={onFooterLeave}
              >
                <span>{t('logout') || 'Logout'}</span>
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

