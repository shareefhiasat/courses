import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { useTheme } from '../contexts/ThemeContext';
import { signOutUser } from '../firebase/auth';
import {
  Home, ClipboardList, BarChart3, Trophy, MessageSquare,
  BookOpen, Users, Settings, LogOut, Languages, LayoutDashboard,
  X, QrCode, User as UserIcon, Theater, Bell, ExternalLink, Activity, Timer as TimerIcon, Pin, PinOff, Sun, Moon, Shield, UserX, Calendar, Gamepad2, ListChecks, ChevronDown, ChevronRight
} from 'lucide-react';
import TimerStopwatch from './TimerStopwatch';

const SideDrawer = ({ isOpen, onClose }) => {
  const { user, isAdmin, isHR, isInstructor, role, impersonating, stopImpersonation } = useAuth();
  const { t, lang, toggleLang } = useLang();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [drawerWidth, setDrawerWidth] = useState(() => {
    try { return Math.min(480, Math.max(280, parseInt(localStorage.getItem('drawer_width') || '320', 10))); } catch { return 320; }
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
    await signOutUser();
    navigate('/login');
  };

  const handleStopImpersonation = () => {
    stopImpersonation();
    onClose();
  };

  const isActive = (path) => location.pathname === path;
  const [showTimerPanel, setShowTimerPanel] = useState(false);

  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    main: true,
    analytics: false,
    community: false,
    settings: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Grouped navigation with tree structure
  const studentLinks = {
    main: {
      label: 'MAIN',
      items: [
        { path: '/', icon: <Home size={18} />, label: t('home') || 'Home' },
        { path: '/progress', icon: <Trophy size={18} />, label: t('my_badges') || 'My Badges' },
        { path: '/activities', icon: <ClipboardList size={18} />, label: t('activities') || 'Activities' },
        { path: '/leaderboard', icon: <Trophy size={18} />, label: t('leaderboard') || 'Leaderboard' },
        { path: '/resources', icon: <BookOpen size={18} />, label: t('resources') || 'Resources' },
        { path: '/enrollments', icon: <Users size={18} />, label: t('my_classes') || 'My Classes' },
      ]
    },
    community: {
      label: 'COMMUNITY',
      items: [
        { path: '/chat', icon: <MessageSquare size={18} />, label: t('chat') || 'Chat' },
      ]
    },
    tools: {
      label: 'TOOLS',
      items: [
        { key: 'timerControl', icon: <TimerIcon size={18} />, label: t('timer') || 'Timer' }
      ]
    },
    settings: {
      label: 'WORKSPACE SETTINGS',
      items: [
        { path: '/notifications', icon: <Bell size={18} />, label: t('notifications') || 'Notifications' },
        { path: '/student-profile', icon: <UserIcon size={18} />, label: t('student_profile') || 'Student Profile' },
        { path: '/my-attendance', icon: <QrCode size={18} />, label: t('my_attendance') || 'My Attendance' },
        { path: '/profile', icon: <Settings size={18} />, label: t('workspace_settings') || 'Workspace Settings' }
      ]
    }
  };

  const adminLinks = {
    main: {
      label: 'MAIN',
      items: [
        { path: '/', icon: <Home size={18} />, label: t('home') || 'Home' },
        { path: '/dashboard', icon: <LayoutDashboard size={18} />, label: t('dashboard') || 'Dashboard' },
        { path: '/student-progress', icon: <BarChart3 size={18} />, label: t('student_progress') || 'Student Progress' },
        { path: '/progress', icon: <Trophy size={18} />, label: t('my_badges') || 'My Badges' },
        { path: '/activities', icon: <Activity size={18} />, label: t('activities') || 'Activities' },
        { path: '/role-access', icon: <Shield size={18} />, label: t('role_access') || 'Role Access' },
      ]
    },
    quiz: {
      label: 'QUIZ',
      items: [
        { path: '/quiz-builder', icon: <Gamepad2 size={18} />, label: 'Quiz Builder' },
        { path: '/quiz-results', icon: <ListChecks size={18} />, label: 'Quiz Results' },
      ]
    },
    classes: {
      label: 'CLASSES',
      items: [
        { path: '/class-schedules', icon: <Calendar size={18} />, label: t('class_schedules') || 'Class Schedules' },
      ]
    },
    attendance: {
      label: 'ATTENDANCE',
      items: [
        { path: '/attendance', icon: <QrCode size={18} />, label: t('attendance') || 'QR Attendance' },
        { path: '/attendance-management', icon: <Calendar size={18} />, label: t('attendance_management') || 'Attendance Management' },
      ]
    },
    analytics: {
      label: 'ANALYTICS',
      items: [
        { path: '/analytics', icon: <BarChart3 size={18} />, label: t('analytics') || 'Analytics' },
        { path: '/advanced-analytics', icon: <BarChart3 size={18} />, label: '📊 Advanced Analytics' },
        { path: '/leaderboard', icon: <Trophy size={18} />, label: t('leaderboard') || 'Leaderboard' },
      ]
    },
    community: {
      label: 'COMMUNITY',
      items: [
        { path: '/chat', icon: <MessageSquare size={18} />, label: t('chat') || 'Chat' },
        { path: '/resources', icon: <BookOpen size={18} />, label: t('resources') || 'Resources' },
        { path: '/manage-enrollments', icon: <UserX size={18} />, label: t('manage_enrollments') || 'Manage Enrollments' },
      ]
    },
    tools: {
      label: 'TOOLS',
      items: [
        { key: 'timerControl', icon: <TimerIcon size={18} />, label: t('timer') || 'Timer' }
      ]
    },
    settings: {
      label: 'WORKSPACE SETTINGS',
      items: [
        { path: '/notifications', icon: <Bell size={18} />, label: t('notifications') || 'Notifications' },
        { path: '/student-profile', icon: <UserIcon size={18} />, label: t('student_profile') || 'Student Profile' },
        { path: '/profile', icon: <Settings size={18} />, label: t('workspace_settings') || 'Workspace Settings' }
      ]
    }
  };

  const hrLinks = {
    main: {
      label: 'MAIN',
      items: [
        { path: '/', icon: <Home size={18} />, label: t('home') || 'Home' },
        { path: '/progress', icon: <Trophy size={18} />, label: t('my_badges') || 'My Badges' },
        { path: '/hr-attendance', icon: <QrCode size={18} />, label: t('hr_attendance') || 'HR Attendance' },
        { path: '/analytics', icon: <BarChart3 size={18} />, label: t('analytics') || 'Analytics' },
      ]
    },
    community: {
      label: 'COMMUNITY',
      items: [
        { path: '/chat', icon: <MessageSquare size={18} />, label: t('chat') || 'Chat' },
      ]
    },
    settings: {
      label: 'SETTINGS',
      items: [
        { path: '/notifications', icon: <Bell size={18} />, label: t('notifications') || 'Notifications' },
        { path: '/student-profile', icon: <UserIcon size={18} />, label: t('student_profile') || 'Student Profile' },
        { path: '/profile', icon: <Settings size={18} />, label: t('settings') || 'Settings' },
        { key: 'timerControl', icon: <TimerIcon size={18} />, label: t('timer') || 'Timer' }
      ]
    }
  };

  const instructorLinks = {
    main: {
      label: 'MAIN',
      items: [
        { path: '/', icon: <Home size={18} />, label: t('home') || 'Home' },
        { path: '/activities', icon: <ClipboardList size={18} />, label: t('activities') || 'Activities' },
        { path: '/quiz-results', icon: <ListChecks size={18} />, label: 'Quiz Results' },
        { path: '/progress', icon: <Trophy size={18} />, label: t('my_badges') || 'My Badges' },
        { path: '/attendance', icon: <QrCode size={18} />, label: t('attendance') || 'QR Attendance' },
        { path: '/attendance-management', icon: <Calendar size={18} />, label: t('attendance_management') || 'Attendance Management' },
        { path: '/class-schedules', icon: <Calendar size={18} />, label: t('class_schedules') || 'Class Schedules' },
        { path: '/manage-enrollments', icon: <UserX size={18} />, label: t('manage_enrollments') || 'Manage Enrollments' },
        { path: '/student-progress', icon: <BarChart3 size={18} />, label: t('student_progress') || 'Student Progress' },
      ]
    },
    analytics: {
      label: 'ANALYTICS',
      items: [
        { path: '/analytics', icon: <BarChart3 size={18} />, label: t('analytics') || 'Analytics' },
        { path: '/advanced-analytics', icon: <BarChart3 size={18} />, label: '📊 Advanced Analytics' },
        { path: '/leaderboard', icon: <Trophy size={18} />, label: t('leaderboard') || 'Leaderboard' },
      ]
    },
    community: {
      label: 'COMMUNITY',
      items: [
        { path: '/chat', icon: <MessageSquare size={18} />, label: t('chat') || 'Chat' },
        { path: '/resources', icon: <BookOpen size={18} />, label: t('resources') || 'Resources' },
      ]
    },
    settings: {
      label: 'SETTINGS',
      items: [
        { path: '/notifications', icon: <Bell size={18} />, label: t('notifications') || 'Notifications' },
        { path: '/student-profile', icon: <UserIcon size={18} />, label: t('student_profile') || 'Student Profile' },
        { path: '/profile', icon: <Settings size={18} />, label: t('settings') || 'Settings' },
        { key: 'timerControl', icon: <TimerIcon size={18} />, label: t('timer') || 'Timer' }
      ]
    }
  };

  let links = studentLinks;
  if (!impersonating) {
    if (isAdmin) links = adminLinks;
    else if (isHR) links = hrLinks;
    else if (isInstructor) links = instructorLinks;
  }
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {(!collapsed && !(autoHide && !isHovering)) ? (
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

          {/* Drawer */}
          <motion.div
            initial={{ x: 0 }}
            animate={{
              x: collapsed ? 0 : ((autoHide && !isHovering) ? -(drawerWidth - 64) : 0)
            }}
            exit={{ x: -drawerWidth }}
            transition={{ type: 'tween', ease: 'easeInOut' }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              // Width rules:
              // - Collapsed: fixed 64px (icons only)
              // - Auto-hide (not hovering): keep full width so hover area expands smoothly; we shift with x
              // - Normal: drawerWidth
              width: collapsed ? 64 : drawerWidth,
              background: theme === 'light' ? '#ffffff' : 'linear-gradient(180deg, #0f172a, #111827)',
              borderRight: theme === 'light' ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.1)',
              color: theme === 'light' ? '#0f172a' : 'white',
              zIndex: 1001,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '2px 0 10px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden',
              transition: 'width 0.3s ease-in-out'
            }}
            onMouseEnter={() => (autoHide && !collapsed) ? setIsHovering(true) : null}
            onMouseLeave={() => (autoHide && !collapsed) ? setIsHovering(false) : null}
          >
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
              padding: '1.25rem',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(0,0,0,0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
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
                
                <button
                  onClick={toggleTheme}
                  title={theme==='light' ? (t('switch_to_dark')||'Dark') : (t('switch_to_light')||'Light')}
                  style={{
                    background: theme==='light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)',
                    border: 'none', color: theme==='light' ? '#111' : 'white', cursor: 'pointer',
                    padding: '0.4rem', borderRadius: '6px', width: '32px', height: '32px',
                    display:'flex', alignItems:'center', justifyContent:'center', marginRight: 6
                  }}
                >
                  {theme==='light' ? <Moon size={18} /> : <Sun size={18} />}
                </button>
                <button
                  onClick={() => {
                    setCollapsed(v=>!v);
                    if (collapsed) {
                      // When expanding from collapsed, also disable auto-hide
                      setAutoHide(false);
                    }
                  }}
                  title={collapsed ? (t('expand')||'Expand Drawer') : (t('collapse')||'Collapse Drawer')}
                  style={{
                    background: collapsed
                      ? (theme==='light' ? 'rgba(251, 191, 36, 0.25)' : 'rgba(212,175,55,0.2)')
                      : (theme==='light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)'),
                    border: 'none', color: theme==='light' ? '#111' : 'white', cursor: 'pointer',
                    padding: '0.4rem', borderRadius: '6px', width: '32px', height: '32px',
                    display:'flex', alignItems:'center', justifyContent:'center', marginRight: 6
                  }}
                >
                  {collapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                </button>
                <button
                  onClick={() => setAutoHide(v=>!v)}
                  title={autoHide ? (t('disable_auto_hide')||'Disable auto-hide') : (t('enable_auto_hide')||'Enable auto-hide')}
                  style={{
                    background: autoHide
                      ? (theme==='light' ? 'rgba(251, 191, 36, 0.25)' : 'rgba(212,175,55,0.2)')
                      : (theme==='light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)'),
                    border: 'none', color: theme==='light' ? '#111' : 'white', cursor: 'pointer',
                    padding: '0.4rem', borderRadius: '6px', width: '32px', height: '32px',
                    display:'flex', alignItems:'center', justifyContent:'center', marginRight: 6
                  }}
                >
                  <Theater size={18} />
                </button>
                <button
                  onClick={onClose}
                  style={{
                    background: theme==='light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)',
                    border: 'none',
                    color: theme==='light' ? '#111' : 'white',
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                    padding: '0.4rem',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    flexShrink: 0,
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = theme==='light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = theme==='light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)'}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Top pinned compact strip (icons only) - Always show when collapsed or has pins */}
              {(collapsed || pinTimer || pinnedLinks.length > 0) && (
                <div style={{ padding: '0.25rem 0 0 0', display:'flex', gap:8, flexWrap:'wrap', justifyContent: collapsed ? 'center' : 'flex-start' }}>
                  {pinTimer && (
                    <button
                      onClick={() => setShowTimerPanel(v=>!v)}
                      title={t('timer') || 'Timer'}
                      style={{ padding:'0.5rem', borderRadius:8, background: theme==='light' ? '#e5e7eb' : '#e5e7eb', border:'1px solid rgba(0,0,0,0.15)', color:'#111827' }}
                    >
                      <TimerIcon size={18} />
                    </button>
                  )}
                  {pinnedLinks.map((p) => {
                    const allItems = Object.values(links).flatMap(g => g.items);
                    const found = allItems.find(l => l.path === p);
                    if (!found) return null;
                    return (
                      <Link key={p} to={p} onClick={onClose} title={found.label}
                        style={{ padding:'0.5rem', borderRadius:8, background: theme==='light' ? '#e5e7eb' : 'rgba(212,175,55,0.2)', border: theme==='light' ? '1px solid rgba(0,0,0,0.15)' : '1px solid rgba(212,175,55,0.6)', color: theme==='light' ? '#111827' : '#FFD700', display:'inline-flex' }}>
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
                    <Theater size={16} /> {t('impersonating') || 'Impersonating'}
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
                <div key={groupKey} style={{ marginTop: '0.5rem' }}>
                  {/* Section Header - Collapsible */}
                  {(!collapsed && (!autoHide || isHovering)) && (
                    <button
                      onClick={() => toggleSection(groupKey)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.5rem 1rem',
                        background: 'transparent',
                        border: 'none',
                        color: theme==='light' ? 'rgba(17,24,39,0.6)' : 'rgba(255,255,255,0.5)',
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        letterSpacing: '1.2px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = theme==='light' ? 'rgba(17,24,39,0.9)' : 'rgba(255,255,255,0.8)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = theme==='light' ? 'rgba(17,24,39,0.6)' : 'rgba(255,255,255,0.5)';
                      }}
                    >
                      <span>{group.label}</span>
                      {expandedSections[groupKey] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                  )}
                  
                  {/* Section Items - Collapsible */}
                  {expandedSections[groupKey] && group.items.map((link) => (
                    <div key={link.key || link.path} style={{ display:'flex', alignItems:'center', gap:8, margin:'0 0.5rem' }}>
                      {link.key === 'timerControl' ? (
                        <button
                          onClick={() => setShowTimerPanel(v=>!v)}
                          title={link.label}
                          style={{
                            display:'flex', alignItems:'center', gap:'0.85rem', padding:'0.7rem 1rem', borderRadius:8,
                            color: theme==='light' ? '#111827' : 'rgba(255,255,255,0.85)', background:'transparent',
                            border: theme==='light' ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.08)', cursor:'pointer', flex:1
                          }}
                        >
                          <span style={{ width: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{link.icon}</span>
                          <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>{link.label}</span>
                        </button>
                      ) : (
                        <Link
                          to={link.path}
                          onClick={onClose}
                          title={link.label}
                          style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: ( (autoHide && !isHovering) || collapsed ) ? 'center' : 'flex-start',
                          gap: '0.85rem',
                          padding: ( (autoHide && !isHovering) || collapsed ) ? '0.7rem' : '0.7rem 1rem',
                          borderRadius: '8px',
                          color: isActive(link.path)
                            ? (theme==='light' ? '#92400e' : '#FFD700')
                            : (theme==='light' ? '#111827' : 'rgba(255,255,255,0.85)'),
                          textDecoration: 'none',
                          background: isActive(link.path)
                            ? (theme==='light' ? 'rgba(251, 191, 36, 0.15)' : 'rgba(212, 175, 55, 0.15)')
                            : 'transparent',
                          transition: 'all 0.2s',
                          fontWeight: isActive(link.path) ? 600 : 400,
                          fontSize: '0.95rem',
                          flex: 1
                          }}
                          onMouseEnter={(e) => {
                          if (!isActive(link.path)) {
                            e.currentTarget.style.background = theme==='light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)';
                          }
                          }}
                          onMouseLeave={(e) => {
                          if (!isActive(link.path)) {
                            e.currentTarget.style.background = 'transparent';
                          }
                          }}
                        >
                          <span style={{ width: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{link.icon}</span>
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
                        <ExternalLink size={14} />
                      </button>)}
                      {!collapsed && density === 'compact' && (() => {
                        const pinned = link.key==='timerControl' ? pinTimer : isPinned(link.path);
                        return (
                          <button
                            title={pinned ? (t('unpin') || 'Unpin') : (t('pin') || 'Pin')}
                            onClick={() => link.key==='timerControl' ? setPinTimer(v=>!v) : togglePinLink(link.path)}
                            style={{
                              background: pinned
                                ? (theme==='light' ? 'rgba(251, 191, 36, 0.25)' : 'rgba(212,175,55,0.2)')
                                : (theme==='light' ? '#ffffff' : 'rgba(255,255,255,0.06)'),
                              border: pinned
                                ? (theme==='light' ? '1px solid rgba(251, 191, 36, 0.6)' : '1px solid rgba(212,175,55,0.6)')
                                : (theme==='light' ? '1px solid rgba(17,24,39,0.15)' : '1px solid rgba(255,255,255,0.2)'),
                              color: pinned
                                ? (theme==='light' ? '#92400e' : '#FFD700')
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
                            {pinned ? <PinOff size={14} /> : <Pin size={14} />}
                          </button>
                        );
                      })()}
                      {density !== 'compact' && (
                        <div style={{ width: 64 }} />
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </nav>

            {/* Footer Actions */}
            <div style={{
              padding: '0.85rem',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(0,0,0,0.15)'
            }}>
              {/* Language Toggle */}
              <button
                onClick={() => {
                  toggleLang();
                  if (!collapsed) onClose();
                }}
                title={collapsed ? (lang === 'en' ? 'العربية' : 'English') : ''}
                style={{
                  width: collapsed ? '48px' : '100%',
                  padding: '0.65rem',
                  marginBottom: '0.5rem',
                  background: 'rgba(255,255,255,0.08)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s',
                  margin: collapsed ? '0 auto 0.5rem auto' : '0 0 0.5rem 0'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center' }}><Languages size={16} /></span>
                {!collapsed && <span>{lang === 'en' ? 'العربية' : 'English'}</span>}
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                title={collapsed ? (t('logout') || 'Logout') : ''}
                style={{
                  width: collapsed ? '48px' : '100%',
                  padding: '0.65rem',
                  background: 'rgba(244, 67, 54, 0.15)',
                  color: '#ff6b6b',
                  border: '1px solid rgba(244, 67, 54, 0.3)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s',
                  margin: collapsed ? '0 auto' : '0'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f44336';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(244, 67, 54, 0.15)';
                  e.currentTarget.style.color = '#ff6b6b';
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center' }}><LogOut size={16} /></span>
                {!collapsed && <span>{t('logout') || 'Logout'}</span>}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SideDrawer;
