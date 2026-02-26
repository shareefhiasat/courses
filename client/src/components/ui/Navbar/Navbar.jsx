import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { signOutUser } from '@services/business/authService';
import { NotificationBell } from '@ui';
import { useLang } from '@contexts/LangContext';
import { getUsers, updateUser, getUserDisplayName, getUserById } from '@services/business/userService';
import { db } from '@services/other/config';
import { doc, setDoc } from 'firebase/firestore';
import { getAuth, updateProfile } from 'firebase/auth';
import './Navbar.css';
import { getThemedIcon, getWhiteIcon, getIconWithColor } from '@constants/iconTypes';
import { LanguageSwitcher } from '../index';
import { useTheme } from '@contexts/ThemeContext';
import { useColorTheme } from '@contexts/ColorThemeContext';
import { getTimeFormatPreference, setTimeFormatPreference } from '@utils/date';
import { adjustColor, hexToRgbString, normalizeHexColor, DEFAULT_ACCENT } from '@utils/color';
import { Select } from '@ui';
import DraggableClock from '../DraggableClock/DraggableClock';

const ACCENT_FALLBACK = DEFAULT_ACCENT;

const Navbar = ({ onToggleSidebar, hideHamburger = false }) => {
  const authContext = useAuth();
  const { user, isAdmin, isSuperAdmin, isInstructor, isHR, impersonating, stopImpersonation } = authContext || {};
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [realName, setRealName] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [timeFormat, setTimeFormat] = useState(() => getTimeFormatPreference());
  const { lang, toggleLang, t } = useLang();
  const { theme, toggleTheme } = useTheme();
  const { primaryColor, setPrimaryColor } = useColorTheme();
  const [notifLang, setNotifLang] = useState('auto');
  const [density, setDensity] = useState(() => {
    try { return localStorage.getItem('density') || 'compact'; } catch { return 'compact'; }
  });
  const [isNavbarCollapsed, setIsNavbarCollapsed] = useState(() => {
    try { return localStorage.getItem('navbarCollapsed') === 'true'; } catch { return false; }
  });
  const menuRef = useRef(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // theme is managed by ThemeProvider

  // Allow other components (e.g., SideDrawer) to open the profile modal
  useEffect(() => {
    const openProfileHandler = () => setShowProfile(true);
    window.addEventListener('openProfile', openProfileHandler);
    return () => window.removeEventListener('openProfile', openProfileHandler);
  }, []);


  useEffect(() => {
    try { localStorage.setItem('density', density); } catch {}
    try { document.documentElement.setAttribute('data-density', density); } catch {}
    try { window.dispatchEvent(new CustomEvent('density-change', { detail: { density } })); } catch {}
  }, [density]);

  // no slider value needed

  // Close dropdown on outside click / Escape
  useEffect(() => {
    if (!showDropdown) return;
    const onDocClick = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowDropdown(false); };
    const onKey = (e) => { if (e.key === 'Escape') setShowDropdown(false); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDocClick); document.removeEventListener('keydown', onKey); };
  }, [showDropdown]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOutUser(user);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [user, navigate]);

  const toggleNavbar = useCallback(() => {
    setIsNavbarCollapsed((prev) => {
      const newCollapsed = !prev;
      localStorage.setItem('navbarCollapsed', newCollapsed.toString());
      window.dispatchEvent(new CustomEvent('navbar:toggle', {
        detail: { collapsed: newCollapsed }
      }));
      return newCollapsed;
    });
  }, []);

  const getUserProfile = useCallback(async (u) => {
    if (!u) return null;
    try {
      const result = await getUserById(u.uid);
      if (result.success) return result.data;
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }, []);

  const openProfile = useCallback(async () => {
    try {
      const me = await getUserProfile(user);
      setDisplayName(user?.displayName || me?.displayName || '');
      setPhoneNumber(me?.phoneNumber || '');
      setPrimaryColor(normalizeHexColor(me?.messageColor, ACCENT_FALLBACK));
      setRealName(me?.realName || '');
      setStudentNumber(me?.studentNumber || '');
      setNotifLang(me?.notifLang || 'auto');
      setTimeFormat(getTimeFormatPreference());
      setShowProfile(true);
    } catch (e) { /* noop */ }
  }, [user, getUserProfile, setPrimaryColor]);

  const saveProfile = useCallback(async () => {
    try {
      if (!user) return;
      const dataToSave = {
        displayName: displayName || null,
        phoneNumber: phoneNumber || null,
        messageColor: normalizeHexColor(primaryColor, ACCENT_FALLBACK),
        realName: realName || null,
        studentNumber: studentNumber || null,
        email: user.email,
        notifLang: notifLang || 'auto',
      };
      await setDoc(doc(db, 'users', user.uid), dataToSave, { merge: true });
      try {
        const auth = getAuth();
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, { displayName });
        }
      } catch {}
      setTimeFormatPreference(timeFormat);
      setShowProfile(false);
    } catch (err) {
      console.error('Failed to save profile:', err);
      alert(t('failed_to_save_profile') || 'Failed to save profile');
    }
  }, [user, displayName, phoneNumber, primaryColor, realName, studentNumber, notifLang, timeFormat]);

  return (
    <>
      <nav className="navbar" style={{ 
        padding: '0.35rem 0',
        display: isNavbarCollapsed ? 'none' : 'block'
      }}>
        <div className="navbar-container">
          {/* Hamburger Menu */}
          {!hideHamburger && (
            <button
              onClick={onToggleSidebar}
              className="navbar-hamburger"
              aria-label={t('menu') || 'Menu'}
            >
              {getThemedIcon('ui', 'menu', 18, '#D4AF37')}
            </button>
            )}

          {/* Collapse/Expand Navbar Button */}
          <button
            onClick={toggleNavbar}
            className="navbar-collapse-btn"
            title={isNavbarCollapsed ? (t('expand_navbar') || 'Expand navbar') : (t('collapse_navbar') || 'Collapse navbar')}
            aria-label={isNavbarCollapsed ? (t('expand_navbar') || 'Expand navbar') : (t('collapse_navbar') || 'Collapse navbar')}
          >
            {getThemedIcon('ui', isNavbarCollapsed ? 'chevron_down' : 'chevron_up', 18, '#D4AF37')}
          </button>

          {/* Brand */}
          <div className="navbar-brand" style={{ 
            fontWeight: 700, 
            fontSize: '1.1rem', 
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginLeft: '0.5rem'
          }}>
            <img src="https://upload.wikimedia.org/wikipedia/en/thumb/2/21/Seal_of_the_Qatar_Armed_Forces_General_Command.png/255px-Seal_of_the_Qatar_Armed_Forces_General_Command.png" alt="QAF" style={{ width: 18, height: 18, objectFit: 'cover', borderRadius: '50%' }} />
          </div>

          {/* DraggableClock - Always visible, positioned at top center by default */}
          <DraggableClock 
            initialPosition={{ 
              x: typeof window !== 'undefined' ? (window.innerWidth / 2) - 75 : 400, // Center horizontally (75px is half of min-width)
              y: 80 // Top position, below navbar
            }} 
            showSeconds={true}
            className="navbar-clock"
          />

          {/* Impersonation Banner */}
          {impersonating && (
            <button
              onClick={() => {
                stopImpersonation();
                navigate('/dashboard');
              }}
              style={{
                padding: '0.5rem 1rem',
                background: '#ff9800',
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                fontSize: '0.875rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#f57c00'}
              onMouseLeave={(e) => e.target.style.background = '#ff9800'}
              title={t('exit_impersonation') || 'Exit Impersonation'}
            >
              {getThemedIcon('ui', 'user', 16, theme === 'light' ? 'white' : theme)} {t('viewing_as_student') || 'Viewing as Student'} <span style={{ marginLeft: '0.5rem' }}>✕</span>
            </button>
          )}
          
          <div style={{ flex: 1 }} />

          {/* Right side: Notifications + Profile */}
          {user && (
            <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              {/* Icon cluster: bell, help, language, theme - gold squares */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                <NotificationBell />

                <button
                  className="nav-icon-btn nav-help"
                  onClick={toggleLang}
                  title={lang === 'en' ? 'العربية' : 'English'}
                  aria-label={lang === 'en' ? (t('switch_to_arabic') || 'Switch to Arabic') : (t('switch_to_english') || 'Switch to English')}
                  style={{
                    border: theme === 'light' ? '1px solid var(--border)' : '1px solid rgba(255,255,255,0.2)',
                    background: theme === 'light' ? 'var(--panel)' : 'rgba(0,0,0,0.3)',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: theme === 'light' ? 'var(--text-primary)' : '#fff'
                  }}
                >
                  {lang === 'en' ? getThemedIcon('ui', 'globe', 16, theme === 'light' ? 'var(--text-primary)' : '#fff') : getThemedIcon('ui', 'globe2', 16, theme === 'light' ? 'var(--text-primary)' : '#fff')}
                </button>

                <button
                  className="nav-icon-btn nav-help"
                  onClick={() => {
                    try {
                      const fullPath = location?.pathname || '/';
                      const search = location?.search || '';
                      const hash = location?.hash || '';
                      window.dispatchEvent(new CustomEvent('app:joyride', { detail: { route: fullPath, search, hash } }));
                    } catch {}
                  }}
                  title={t('help') || 'Help'}
                  aria-label={t('help') || 'Help'}
                  style={{
                    border: theme === 'light' ? '1px solid var(--border)' : '1px solid rgba(255,255,255,0.2)',
                    background: theme === 'light' ? 'var(--panel)' : 'rgba(0,0,0,0.3)',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: theme === 'light' ? 'var(--text-primary)' : '#fff'
                  }}
                >
                  {getThemedIcon('ui', 'help_circle', 16, theme === 'light' ? 'var(--text-primary)' : '#fff')}
                </button>

                <button
                  className="nav-icon-btn"
                  onClick={() => {
                    try {
                      // Toggle help drawer with full path including search params and hash
                      const fullPath = location?.pathname || '/';
                      const search = location?.search || '';
                      const hash = location?.hash || '';
                      window.dispatchEvent(new CustomEvent('app:help:toggle', { 
                        detail: { 
                          route: fullPath,
                          search: search,
                          hash: hash
                        } 
                      }));
                    } catch {}
                  }}
                  title={t('information') || 'Information'}
                  aria-label={t('information') || 'Information'}
                  style={{
                    border: theme === 'light' ? '1px solid var(--border)' : '1px solid rgba(255,255,255,0.2)',
                    background: theme === 'light' ? 'var(--panel)' : 'rgba(0,0,0,0.3)',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: theme === 'light' ? 'var(--text-primary)' : '#fff'
                  }}
                >
                  {getThemedIcon('ui', 'info', 18, theme === 'light' ? 'var(--text-primary)' : '#fff')}
                </button>

                <button
                  className="nav-icon-btn"
                  title={theme==='light'?(t('dark_mode')||'Dark'):(t('light_mode')||'Light')}
                  onClick={toggleTheme}
                  style={{
                    border: theme === 'light' ? '1px solid var(--border)' : '1px solid rgba(255,255,255,0.2)',
                    background: theme === 'light' ? 'var(--panel)' : 'rgba(0,0,0,0.3)',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: theme === 'light' ? 'var(--text-primary)' : '#fff'
                  }}
                >
                  {theme==='light'?getThemedIcon('ui', 'moon', 16, 'var(--text-primary)'):getThemedIcon('ui', 'sun', 16, theme)}
                </button>
                {/* Temporarily hidden - Minified filter toggle button
                <button
                  className="nav-icon-btn"
                  onClick={() => {
                    try {
                      const current = localStorage.getItem('filterViewMode') || 'full';
                      const next = current === 'full' ? 'minified' : 'full';
                      localStorage.setItem('filterViewMode', next);
                      window.dispatchEvent(new CustomEvent('filter-view-mode-changed', { detail: { filterViewMode: next } }));
                    } catch {}
                  }}
                  title={(() => {
                    try {
                      const current = localStorage.getItem('filterViewMode') || 'full';
                      return current === 'full' ? (t('minified_filters') || 'Minified Filters') : (t('full_filters') || 'Full Filters');
                    } catch {
                      return (t('toggle_filter_view') || 'Toggle Filter View');
                    }
                  })()}
                >
                  {(() => {
                    try {
                      const current = localStorage.getItem('filterViewMode') || 'full';
                      return current === 'full' ? getThemedIcon('ui', 'layout_grid', 16, theme === 'light' ? 'var(--text-primary)' : theme) : getThemedIcon('ui', 'list', 16, theme === 'light' ? 'var(--text-primary)' : theme);
                    } catch {
                      return getThemedIcon('ui', 'layout_grid', 16, theme);
                    }
                  })()}
                </button>
                */}
              </div>

              {/* Profile Avatar with Super Admin badge and dropdown */}
              <div ref={menuRef} style={{ position: 'relative' }}>
                <div
                  onClick={() => setShowDropdown(v=>!v)}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: primaryColor && primaryColor !== ACCENT_FALLBACK
                      ? `linear-gradient(135deg, ${primaryColor}, ${adjustColor(primaryColor, 10)})`
                      : 'rgba(255,255,255,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: primaryColor && primaryColor !== ACCENT_FALLBACK ? '#fff' : '#2E3B4E',
                    cursor: 'pointer',
                    border: '2px solid rgba(255,255,255,0.6)',
                    transition: 'transform 0.2s, background 0.3s',
                    overflow: 'hidden',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  aria-haspopup="menu"
                  aria-expanded={showDropdown}
                >
                  {(!primaryColor || primaryColor === ACCENT_FALLBACK) && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(255,255,255,0.5)',
                      backdropFilter: 'blur(4px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }} />
                  )}
                  <span style={{ position: 'relative', zIndex: 1 }}>
                    {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
                {/* Multiple role badges stacked on the right side */}
                <div style={{ position:'absolute', right:-8, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {isSuperAdmin && (
                    <div title={t('super_admin') || 'Super Admin'} style={{ background:'#f59e0b', color:'#fff', borderRadius:'50%', width:18, height:18, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 0 2px rgba(255,255,255,0.8)' }}>
                      {getThemedIcon('ui', 'crown', 10, theme === 'light' ? 'white' : theme)}
                    </div>
                  )}
                  {isAdmin && !isSuperAdmin && (
                    <div title={t('admin') || 'Admin'} style={{ background:'#4f46e5', color:'#fff', borderRadius:'50%', width:18, height:18, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 0 2px rgba(255,255,255,0.8)' }}>
                      {getThemedIcon('ui', 'shield', 10, theme === 'light' ? 'white' : theme)}
                    </div>
                  )}
                  {isInstructor && (
                    <div title={t('instructor') || 'Instructor'} style={{ background:'#0ea5e9', color:'#fff', borderRadius:'50%', width:18, height:18, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 0 2px rgba(255,255,255,0.8)' }}>
                      {getThemedIcon('ui', 'book_open', 10, theme === 'light' ? 'white' : theme)}
                    </div>
                  )}
                  {isHR && (
                    <div title={t('hr') || 'HR'} style={{ background:'#8b5cf6', color:'#fff', borderRadius:'50%', width:18, height:18, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 0 2px rgba(255,255,255,0.8)' }}>
                      {getThemedIcon('ui', 'users', 10, theme === 'light' ? 'white' : theme)}
                    </div>
                  )}
                </div>
                {showDropdown && (
                  <div className="dropdown-menu" style={{ right: 0, top: 48, zIndex: 9999 }}>
                    <div className="dropdown-item user-info" style={{ padding: '10px 12px' }}>
                      <div className="user-email" style={{ fontWeight: 600, marginBottom: 4 }}>{user.email}</div>
                      {displayName && displayName !== user.email && (
                        <div className="display-name" style={{ fontSize: '0.9rem', color: '#333', marginBottom: 4 }}>
                          {t('display_name') || 'Display Name'}: {displayName}
                        </div>
                      )}
                      {studentNumber && (
                        <div className="student-number" style={{ fontSize: '0.8rem', color: '#666', marginBottom: 8 }}>
                          {t('student_number') || 'Student Number'}: {studentNumber}
                        </div>
                      )}
                      <div className="role-badge" style={{ display:'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems:'center' }}>
                        {isSuperAdmin && (
                          <span style={{ color: '#f59e0b', border: '1.5px solid #f59e0b', background: 'rgba(245, 158, 11, 0.1)', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, padding: '4px 8px', borderRadius: 999 }}>
                            {getIconWithColor('ui', 'crown', 14, '#f59e0b')} {t('super_admin') || 'Super Admin'}
                          </span>
                        )}
                        {isAdmin && !isSuperAdmin && (
                          <span style={{ color: '#4f46e5', border: '1.5px solid #4f46e5', background: 'rgba(79, 70, 229, 0.1)', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, padding: '4px 8px', borderRadius: 999 }}>
                            {getIconWithColor('ui', 'shield', 14, '#4f46e5')} {t('admin') || 'Admin'}
                          </span>
                        )}
                        {isInstructor && (
                          <span style={{ color: '#0ea5e9', border: '1.5px solid #0ea5e9', background: 'rgba(14, 165, 233, 0.1)', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, padding: '4px 8px', borderRadius: 999 }}>
                            {getIconWithColor('ui', 'book_open', 14, '#0ea5e9')} {t('instructor') || 'Instructor'}
                          </span>
                        )}
                        {isHR && (
                          <span style={{ color: '#8b5cf6', border: '1.5px solid #8b5cf6', background: 'rgba(139, 92, 246, 0.1)', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, padding: '4px 8px', borderRadius: 999 }}>
                            {getIconWithColor('ui', 'users', 14, '#8b5cf6')} {t('hr') || 'HR'}
                          </span>
                        )}
                        {!isSuperAdmin && !isAdmin && !isInstructor && !isHR && (
                          <span style={{ color: '#16a34a', border: '1.5px solid #16a34a', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, padding: '4px 8px', borderRadius: 999 }}>{t('student') || 'Student'}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="navbar-menu" style={{ display: 'none' }}>
            {user ? (
              <>
                <NavLink to="/" className={({isActive})=>`navbar-item${isActive?' active':''}`}>
                  <span style={{ display: 'inline-flex', alignItems:'center' }}>{getThemedIcon('ui', 'home', 18, theme === 'light' ? 'white' : theme)}</span>
                </NavLink>
              {!isAdmin && (
                <>
                  <NavLink to="/enrollments" className={({isActive})=>`navbar-item${isActive?' active':''}`}>
                    {t('my_classes') || 'Classes'}
                  </NavLink>
                  <NavLink to="/progress" className={({isActive})=>`navbar-item${isActive?' active':''}`}>{t('my_progress')}</NavLink>
                </>
              )}
              <NavLink to="/activities" className={({isActive})=>`navbar-item${isActive?' active':''}`}>
                {t('view_activities') || 'Activities'}
              </NavLink>
              <NavLink to="/student-dashboard" className={({isActive})=>`navbar-item${isActive?' active':''}`}>
                {t('student_dashboard') || 'Student Dashboard'}
              </NavLink>
              <NavLink to="/course-progress/sample-course" className={({isActive})=>`navbar-item${isActive?' active':''}`}>
                {t('course_progress') || 'Course Progress'}
              </NavLink>
              <NavLink to="/chat" className={({isActive})=>`navbar-item${isActive?' active':''}`}>{t('chat')}</NavLink>
              <NavLink to="/resources" className={({isActive})=>`navbar-item${isActive?' active':''}`}>{t('resources')}</NavLink>

              {isAdmin && (
                <>
                  <NavLink to="/dashboard" className={({isActive})=>`navbar-item${isActive?' active':''}`}>
                    {t('dashboard')}
                  </NavLink>
                  <NavLink to="/student-progress" className={({isActive})=>`navbar-item${isActive?' active':''}`}>
                    {t('progress')}
                  </NavLink>
                  <NavLink to="/quiz-management" className={({isActive})=>`navbar-item${isActive?' active':''}`}>
                    {t('quiz_management') || 'Quiz Management'}
                  </NavLink>
                </>
              )}

              <NotificationBell />
              
              <button onClick={toggleLang} className="icon-btn" title={lang==='en'?'العربية':'English'}>
                {lang==='en'?'EN':'AR'}
              </button>
              <button onClick={()=>setDensity(d=>d==='compact'?'normal':'compact')} className="icon-btn" title={density==='compact'?(t('normal_view')||'Normal View'):(t('compact_view')||'Compact View')}>
                {density==='compact'?getThemedIcon('ui', 'zoom_in', 16, theme === 'light' ? 'var(--text-primary)' : theme):getThemedIcon('ui', 'ruler', 16, theme === 'light' ? 'var(--text-primary)' : theme)}
              </button>
              <button onClick={toggleTheme} className="icon-btn" title={theme==='light'?(t('dark_mode')||'Dark'):(t('light_mode')||'Light')}>
                {theme==='light'?getThemedIcon('ui', 'moon', 16, 'var(--text-primary)'):getThemedIcon('ui', 'sun', 16, theme)}
              </button>
              
              <div className="navbar-user" onClick={() => setShowDropdown(!showDropdown)} ref={menuRef}>
                <div className="user-avatar">
                  {(displayName || user.email)?.charAt(0).toUpperCase()}
                </div>
                {showDropdown && (
                  <div className="dropdown-menu">
                    <div className="dropdown-item user-info" style={{ padding: '10px 12px' }}>
                      <div className="user-email" style={{ fontWeight: 600, marginBottom: 4 }}>{user.email}</div>
                      {displayName && displayName !== user.email && (
                        <div className="display-name" style={{ fontSize: '0.9rem', color: '#333', marginBottom: 4 }}>
                          {t('display_name') || 'Display Name'}: {displayName}
                        </div>
                      )}
                      {studentNumber && (
                        <div className="student-number" style={{ fontSize: '0.8rem', color: '#666', marginBottom: 8 }}>
                          {t('student_number') || 'Student Number'}: {studentNumber}
                        </div>
                      )}
                      <div className="role-badge" style={{ display:'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems:'center' }}>
                        {isSuperAdmin && (
                          <span style={{ color: '#f59e0b', border: '1.5px solid #f59e0b', background: 'rgba(245, 158, 11, 0.1)', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, padding: '4px 8px', borderRadius: 999 }}>
                            {getIconWithColor('ui', 'crown', 14, '#f59e0b')} {t('super_admin') || 'Super Admin'}
                          </span>
                        )}
                        {isAdmin && !isSuperAdmin && (
                          <span style={{ color: '#4f46e5', border: '1.5px solid #4f46e5', background: 'rgba(79, 70, 229, 0.1)', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, padding: '4px 8px', borderRadius: 999 }}>
                            {getIconWithColor('ui', 'shield', 14, '#4f46e5')} {t('admin') || 'Admin'}
                          </span>
                        )}
                        {isInstructor && (
                          <span style={{ color: '#0ea5e9', border: '1.5px solid #0ea5e9', background: 'rgba(14, 165, 233, 0.1)', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, padding: '4px 8px', borderRadius: 999 }}>
                            {getIconWithColor('ui', 'book_open', 14, '#0ea5e9')} {t('instructor') || 'Instructor'}
                          </span>
                        )}
                        {isHR && (
                          <span style={{ color: '#8b5cf6', border: '1.5px solid #8b5cf6', background: 'rgba(139, 92, 246, 0.1)', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, padding: '4px 8px', borderRadius: 999 }}>
                            {getIconWithColor('ui', 'users', 14, '#8b5cf6')} {t('hr') || 'HR'}
                          </span>
                        )}
                        {!isSuperAdmin && !isAdmin && !isInstructor && !isHR && (
                          <span style={{ color: '#16a34a', border: '1.5px solid #16a34a', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, padding: '4px 8px', borderRadius: 999 }}>{t('student') || 'Student'}</span>
                        )}
                      </div>
                    </div>
                    <button className="dropdown-item" onClick={openProfile}>
                      {t('edit_profile')}
                    </button>
                    <button className="dropdown-item sign-out-btn" onClick={handleSignOut}>
                      {t('sign_out') || 'Sign Out'}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
      {showProfile && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
        }} onClick={()=>setShowProfile(false)}>
          <div style={{
            background: theme==='light' ? '#ffffff' : '#0f172a',
            color: theme==='light' ? '#111827' : '#e5e7eb',
            padding: '1.5rem', borderRadius: 12, minWidth: 320, maxWidth: 720, width: '90vw',
            boxShadow: theme==='light' ? '0 10px 30px rgba(0,0,0,0.1)' : '0 10px 30px rgba(0,0,0,0.4)'
          }} onClick={(e)=>e.stopPropagation()}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>{t('edit_profile')}</h3>
            <div style={{ display:'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>{t('email')}</label>
                <input type="email" value={user?.email || ''} readOnly style={{ width: '100%', padding: '0.75rem', border: theme==='light'?'1px solid #e5e7eb':'1px solid rgba(255,255,255,0.15)', borderRadius: 8, background: theme==='light'?'#f3f4f6':'#111827', color: theme==='light'?'#6b7280':'#e5e7eb' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>{t('display_name')}</label>
                <input type="text" value={displayName} onChange={(e)=>setDisplayName(e.target.value)} placeholder={t('display_name')} style={{ width: '100%', padding: '0.75rem', border: theme==='light'?'1px solid #e5e7eb':'1px solid rgba(255,255,255,0.15)', borderRadius: 8, background: theme==='light'?'#ffffff':'#0b1220', color: theme==='light'?'#111827':'#e5e7eb' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>{t('real_name')}</label>
                <input type="text" value={realName} onChange={(e)=>setRealName(e.target.value)} placeholder="First Last" style={{ width: '100%', padding: '0.75rem', border: theme==='light'?'1px solid #e5e7eb':'1px solid rgba(255,255,255,0.15)', borderRadius: 8, background: theme==='light'?'#ffffff':'#0b1220', color: theme==='light'?'#111827':'#e5e7eb' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>{t('student_number')} ({t('optional')})</label>
                <input type="text" value={studentNumber} onChange={(e)=>setStudentNumber(e.target.value)} placeholder="e.g., 202400123" style={{ width: '100%', padding: '0.75rem', border: theme==='light'?'1px solid #e5e7eb':'1px solid rgba(255,255,255,0.15)', borderRadius: 8, background: theme==='light'?'#ffffff':'#0b1220', color: theme==='light'?'#111827':'#e5e7eb' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>{t('phone_number') || 'Phone Number'}</label>
                <input type="tel" value={phoneNumber} onChange={(e)=>setPhoneNumber(e.target.value)} placeholder="+1 234 567 8900" style={{ width: '100%', padding: '0.75rem', border: theme==='light'?'1px solid #e5e7eb':'1px solid rgba(255,255,255,0.15)', borderRadius: 8, background: theme==='light'?'#ffffff':'#0b1220', color: theme==='light'?'#111827':'#e5e7eb' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>{t('message_color') || 'Message Bubble Color'}</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="color" value={primaryColor} onChange={(e)=>setPrimaryColor(e.target.value)} style={{ width: 60, height: 40, border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer' }} />
                  <div style={{ flex: 1, padding: '0.75rem', background: primaryColor, color: 'white', borderRadius: 8, textAlign: 'center', fontWeight: 600 }}>{t('preview')}</div>
                </div>
              </div>
              <div>
                <Select
                  label={t('notifications_language') || 'Notifications Language'}
                  value={notifLang}
                  onChange={(e)=>setNotifLang(e.target.value)}
                  options={[
                    { value: 'auto', label: t('auto_follow_ui') || 'Auto (Follow UI Language)' },
                    { value: 'en', label: 'English' },
                    { value: 'ar', label: 'العربية' }
                  ]}
                  fullWidth
                />
              </div>
            </div>
            {/* Density control (4 levels) */}
            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>{t('density') || 'Density'}</label>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4, minmax(0,1fr))', gap: 8 }}>
                {[
                  { id:'compact', label: t('compact') || 'Compact' },
                  { id:'cozy', label: t('cozy') || 'Cozy' },
                  { id:'comfortable', label: t('comfortable') || 'Comfortable' },
                  { id:'roomy', label: t('roomy') || 'Roomy' },
                ].map(opt => (
                  <label key={opt.id} style={{
                    border:'1px solid '+(density===opt.id? '#4f46e5':'var(--border)'),
                    borderRadius:8, padding:'0.5rem 0.75rem', cursor:'pointer', textAlign:'center',
                    background: density===opt.id ? 'rgba(79,70,229,0.1)' : 'transparent'
                  }}>
                    <input
                      type="radio"
                      name="density"
                      value={opt.id}
                      checked={density===opt.id}
                      onChange={()=>setDensity(opt.id)}
                      style={{ marginRight: 6 }}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={()=>setShowProfile(false)} style={{ padding: '0.5rem 1rem', background: theme==='light' ? '#6b7280' : '#374151', color: 'white', border: 'none', borderRadius: 6 }}>{t('cancel')}</button>
              <button onClick={saveProfile} style={{ padding: '0.5rem 1rem', background: theme==='light' ? 'linear-gradient(135deg, #800020, #600018)' : '#4f46e5', color: 'white', border: 'none', borderRadius: 6 }}>{t('save')}</button>
            </div>
          </div>
        </div>
      )}
      </nav>

      {/* Floating restore button when navbar is collapsed */}
      {isNavbarCollapsed && (
        <button
          onClick={toggleNavbar}
          title={t('expand_navbar') || 'Expand navbar'}
          aria-label={t('expand_navbar') || 'Expand navbar'}
          style={{
            position: 'fixed',
            top: isMobile ? '15px' : '20px',
            right: isMobile ? '15px' : '20px',
            zIndex: 1000,
            background: theme === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0,0,0,0.8)',
            backdropFilter: 'saturate(150%) blur(8px)',
            border: theme === 'light' ? '1px solid var(--border)' : '1px solid rgba(255,255,255,0.2)',
            borderRadius: '50%',
            width: isMobile ? '32px' : '36px',
            height: isMobile ? '32px' : '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: theme === 'light' ? 'var(--text-primary)' : '#fff',
            boxShadow: theme === 'light' 
              ? '0 4px 6px rgba(0, 0, 0, 0.1)' 
              : '0 4px 6px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = theme === 'light' 
              ? '0 6px 12px rgba(0, 0, 0, 0.15)' 
              : '0 6px 12px rgba(0, 0, 0, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = theme === 'light' 
              ? '0 4px 6px rgba(0, 0, 0, 0.1)' 
              : '0 4px 6px rgba(0, 0, 0, 0.3)';
          }}
        >
          {getThemedIcon('ui', 'chevron_down', isMobile ? 14 : 16, theme)}
        </button>
      )}
    </>
  );
};

export default Navbar;
