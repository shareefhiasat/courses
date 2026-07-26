import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import NotificationBell from '../NotificationBell/NotificationBell';
import { useLang } from '@contexts/LangContext';
import { formatDate } from '@utils/date-formatter.js';
import { getUsers, updateUser, getUserProfile } from '@services/business/userService';
import { getLocalizedUserName } from '@utils/localizedUserName';
import { getAllUserImages } from '@services/business/userImageService';
import './Navbar.css';
import { getThemedIcon, getWhiteIcon, getIconWithColor, getUserRoleIcon, getUserRoleColor } from '@constants/iconTypes';
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher';
import { useTheme } from '@contexts/ThemeContext';
import useTourBadgeCount from '@hooks/useTourBadgeCount.js';
import { useColorTheme } from '@contexts/ColorThemeContext';
import { useGlobalLoading } from '@contexts/GlobalLoadingContext';
import { getTimeFormatPreference, setTimeFormatPreference } from '@utils/date';
import { hexToRgbString, normalizeHexColor, DEFAULT_ACCENT } from '@utils/color';
import Select from '../Select/Select';
import DraggableClock from '../DraggableClock/DraggableClock';
import ColoredTooltip from '../mui/ColoredTooltip';
import MyDataScopeDrawer from '../MyDataScopeDrawer/MyDataScopeDrawer';
import Slider from '@mui/material/Slider';
import Box from '@mui/material/Box';
import {
  SCHEDULE_FONT_SCALE_MIN,
  SCHEDULE_FONT_SCALE_MAX,
  SCHEDULE_FONT_SCALE_STEP,
} from '@constants/scheduleFontScale';

import { info, error, warn, debug } from '@services/utils/logger.js';
import { isOnboardingTourEnabled } from '@utils/tourConfig.js';

const ACCENT_FALLBACK = DEFAULT_ACCENT;

const Navbar = ({ onToggleSidebar, hideHamburger = false }) => {
  const authContext = useAuth();
  const { user, isAdmin, isSuperAdmin, isInstructor, isHR, isStudent, logout, impersonating, stopImpersonation } = authContext || {};
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAccessDrawer, setShowAccessDrawer] = useState(false);
  const [displayName, setDisplayName] = useState(() => user?.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [realName, setRealName] = useState('');
  const [displayNameAr, setDisplayNameAr] = useState('');
  const [firstNameAr, setFirstNameAr] = useState('');
  const [lastNameAr, setLastNameAr] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [userImages, setUserImages] = useState({
    profile: null,
    qid: null,
    military: null,
    additional: null
  });
  const [timeFormat, setTimeFormat] = useState(() => getTimeFormatPreference());
  const { lang, toggleLang, t } = useLang();
  const tourBadgeCount = useTourBadgeCount();
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

  const [wizardNav, setWizardNav] = useState(null);
  const [scheduleFontControl, setScheduleFontControl] = useState(null);

  useEffect(() => {
    const onWizardNav = (e) => setWizardNav(e.detail || null);
    window.addEventListener('welcome-wizard-nav', onWizardNav);
    return () => window.removeEventListener('welcome-wizard-nav', onWizardNav);
  }, []);

  useEffect(() => {
    const onScheduleFont = (e) => setScheduleFontControl(e.detail || null);
    window.addEventListener('welcome-schedule-font', onScheduleFont);
    return () => window.removeEventListener('welcome-schedule-font', onScheduleFont);
  }, []);

  useEffect(() => {
    if (location.pathname !== '/welcome') {
      setWizardNav(null);
      setScheduleFontControl(null);
    }
  }, [location.pathname]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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

  // Load user profile data on mount (for dropdown display)
  useEffect(() => {
    if (!user?.uid) return;
    const loadProfile = async () => {
      try {
        const me = await getUserProfile(user);
        if (me) {
          setDisplayName(me.displayName || user?.displayName || '');
          setRealName(me.realName || '');
          setDisplayNameAr(me.displayNameAr || '');
          setFirstNameAr(me.firstNameAr || '');
          setLastNameAr(me.lastNameAr || '');
          setStudentNumber(me.studentNumber || '');
          setPhoneNumber(me.phoneNumber || '');
        }
      } catch (e) { /* noop */ }
    };
    loadProfile();
  }, [user]);

  // Load user images
  useEffect(() => {
    if (!user?.uid) return;

    const loadUserImages = async () => {
      try {
        const result = await getAllUserImages(user.uid);
        if (result.success && result.data?.images) {
          setUserImages(result.data.images);
        }
      } catch (err) {
        error('Failed to load user images:', err);
      }
    };

    loadUserImages();
  }, [user]);

  const handleSignOut = useCallback(async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      error('Error signing out:', error);
    }
  }, [logout, navigate]);

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
      const result = await getUserProfile(u);
      if (result) return result;
      return null;
    } catch (error) {
      error('Error getting user profile:', error);
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
      setDisplayNameAr(me?.displayNameAr || '');
      setFirstNameAr(me?.firstNameAr || '');
      setLastNameAr(me?.lastNameAr || '');
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
        displayName: displayName || user?.displayName || null,
        phoneNumber: phoneNumber || null,
        messageColor: normalizeHexColor(primaryColor, ACCENT_FALLBACK),
        realName: realName || null,
        displayNameAr: displayNameAr || null,
        firstNameAr: firstNameAr || null,
        lastNameAr: lastNameAr || null,
        studentNumber: studentNumber || null,
        email: user.email,
        notifLang: notifLang || 'auto',
      };
      // Save via API - Firebase removed
      await updateUser(user.uid, dataToSave);
      setTimeFormatPreference(timeFormat);
      setShowProfile(false);
    } catch (err) {
      error('Failed to save profile:', err);
      alert(t('failed_to_save_profile'));
    }
  }, [user, displayName, phoneNumber, primaryColor, realName, displayNameAr, firstNameAr, lastNameAr, studentNumber, notifLang, timeFormat]);

  return (
    <>
      <nav className="navbar" style={{ 
        padding: '0.1rem 0',
        display: isNavbarCollapsed ? 'none' : 'block'
      }}>
        <div className="navbar-container">
          {/* Hamburger Menu */}
          {!hideHamburger && (
            <button
              onClick={onToggleSidebar}
              className="navbar-hamburger"
              aria-label={t('menu')}
            >
              {getThemedIcon('ui', 'menu', 18, '#D4AF37')}
            </button>
            )}

          {/* Collapse/Expand Navbar Button */}
          <ColoredTooltip title={isNavbarCollapsed ? t('expand_navbar') : t('collapse_navbar')} placement="bottom" color={DEFAULT_ACCENT}>
          <button
            onClick={toggleNavbar}
            className="navbar-collapse-btn"
            aria-label={isNavbarCollapsed ? (t('expand_navbar')) : (t('collapse_navbar'))}
          >
            {getThemedIcon('ui', isNavbarCollapsed ? 'chevron_down' : 'chevron_up', 18, '#D4AF37')}
          </button>
          </ColoredTooltip>

          {/* Brand */}
          <div className="navbar-brand" style={{
            fontWeight: 700,
            fontSize: '1rem',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            marginLeft: '0.35rem',
            minWidth: 0,
            flex: 1,
          }}>
            <div style={{ 
              width: 34, 
              height: 34, 
              borderRadius: '50%', 
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.3)',
              flexShrink: 0,
            }}>
              <img src="/qaf_logo_transparent.png" alt="QAF" style={{ width: 30, height: 30, objectFit: 'cover', borderRadius: '50%' }} />
            </div>
            {wizardNav?.programName && (
              <ColoredTooltip
                title={t('change_program_term') || 'Change program / term'}
                color="#D4AF37"
                placement="bottom"
              >
                <button
                  id="welcome-navbar-title"
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('welcome-open-context-switcher'));
                  }}
                  style={{
                    minWidth: 0,
                    lineHeight: 1.25,
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    margin: 0,
                    color: 'inherit',
                    textAlign: 'inherit',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                <span style={{ opacity: 0.85, flexShrink: 0, display: 'flex' }} aria-hidden>
                  {getThemedIcon('ui', 'chevron_down', 16, 'currentColor')}
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                  <div style={{
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    lineHeight: 1.2,
                    whiteSpace: 'nowrap',
                  }}>
                    {wizardNav.programName}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.68rem',
                    fontWeight: 500,
                    opacity: 0.9,
                    whiteSpace: 'nowrap',
                  }}>
                    {wizardNav.termLabel && <span>{wizardNav.termLabel}</span>}
                    {wizardNav.termLabel && (
                      <span style={{ opacity: 0.6 }}>·</span>
                    )}
                    <span style={wizardNav.tab !== 'schedule' ? {
                      padding: '1px 6px',
                      borderRadius: '6px',
                      background: 'rgba(59,130,246,0.1)',
                      boxShadow: '0 0 0 1px rgba(59,130,246,0.2)',
                    } : undefined}>
                      {(() => {
                        const d = wizardNav.workingDate ? new Date(wizardNav.workingDate) : new Date();
                        if (wizardNav.tab === 'schedule') {
                          const ws = new Date(d);
                          ws.setDate(ws.getDate() - ws.getDay());
                          const we = new Date(ws);
                          we.setDate(we.getDate() + 4);
                          const fmt = (x) => `${String(x.getDate()).padStart(2, '0')}/${String(x.getMonth() + 1).padStart(2, '0')}`;
                          const jan1 = new Date(ws.getFullYear(), 0, 1);
                          const dayOfYear = Math.floor((ws - jan1) / 86400000) + 1;
                          const weekNum = Math.ceil(dayOfYear / 7);
                          return `W${weekNum} ${fmt(ws)} - ${fmt(we)}`;
                        }
                        return formatDate(d, lang);
                      })()}
                    </span>
                    {wizardNav.className && (
                      <>
                        <span style={{ opacity: 0.6 }}>·</span>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          background: 'rgba(255, 255, 255, 0.15)',
                          border: '1px solid rgba(255, 255, 255, 0.25)',
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          color: '#fff',
                          whiteSpace: 'nowrap',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
                        }}>
                          <span>{wizardNav.className}</span>
                        </div>
                      </>
                    )}
                  </div>
                </span>
              </button>
              </ColoredTooltip>
            )}
          </div>

          {/* DraggableClock - Hidden from navbar */}
          {/* <DraggableClock 
            initialPosition={{ 
              x: typeof window !== 'undefined' ? (window.innerWidth / 2) - 75 : 400, // Center horizontally (75px is half of min-width)
              y: 80 // Top position, below navbar
            }} 
            showSeconds={true}
            className="navbar-clock"
          /> */}

          {/* Impersonation Banner */}
          {impersonating && (
            <ColoredTooltip title={t('exit_impersonation')} placement="bottom" color="#f59e0b">
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
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#f57c00'}
              onMouseLeave={(e) => e.target.style.background = '#ff9800'}
            >
              {getThemedIcon('ui', 'user', 16, theme === 'light' ? 'white' : theme)} {t('viewing_as_student')} <span style={{ marginLeft: '0.5rem' }}>✕</span>
            </button>
            </ColoredTooltip>
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
                {scheduleFontControl && (
                  <Box
                    data-testid="schedule-font-slider-wrap"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      ml: 0.25,
                      px: 0.75,
                      py: 0.25,
                      borderRadius: 2,
                      bgcolor: 'rgba(0,0,0,0.2)',
                      border: '1px solid rgba(212, 175, 55, 0.35)',
                      fontSize: '12px',
                      lineHeight: 1,
                    }}
                  >
                    <Slider
                      size="small"
                      value={scheduleFontControl.scale}
                      onChange={(_, value) => {
                        window.dispatchEvent(new CustomEvent('welcome-schedule-font-change', { detail: value }));
                      }}
                      min={scheduleFontControl.min ?? SCHEDULE_FONT_SCALE_MIN}
                      max={scheduleFontControl.max ?? SCHEDULE_FONT_SCALE_MAX}
                      step={scheduleFontControl.step ?? SCHEDULE_FONT_SCALE_STEP}
                      aria-label={t('schedule_font_size') || 'Schedule font size'}
                      data-testid="schedule-font-slider"
                      sx={{
                        width: 96,
                        color: '#D4AF37',
                        '& .MuiSlider-thumb': { width: 12, height: 12 },
                        '& .MuiSlider-rail': { opacity: 0.35 },
                      }}
                    />
                    <span
                      data-testid="schedule-font-size-label"
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#D4AF37',
                        minWidth: 34,
                        textAlign: 'center',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {scheduleFontControl.scale}%
                    </span>
                  </Box>
                )}

                {!isStudent && (
                  <ColoredTooltip title={t('welcome')} placement="bottom" color={DEFAULT_ACCENT}>
                    <button
                      type="button"
                      className="nav-icon-btn"
                      onClick={() => navigate('/welcome')}
                      aria-label={t('welcome')}
                      data-testid="navbar-welcome-btn"
                      style={{
                        border: theme === 'light' ? '1px solid var(--border)' : '1px solid rgba(255,255,255,0.2)',
                        background: location.pathname === '/welcome'
                          ? 'var(--color-primary, #3b82f6)'
                          : (theme === 'light' ? 'var(--panel)' : 'rgba(0,0,0,0.3)'),
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: location.pathname === '/welcome' ? '#fff' : (theme === 'light' ? 'var(--text-primary)' : '#fff'),
                      }}
                    >
                      {getThemedIcon('ui', 'home', 16, 'currentColor')}
                    </button>
                  </ColoredTooltip>
                )}

                {!isInstructor && <NotificationBell />}

                <ColoredTooltip title={lang === 'en' ? 'العربية' : 'English'} placement="bottom" color={DEFAULT_ACCENT}>
                <button
                  className="nav-icon-btn nav-help"
                  onClick={toggleLang}
                  aria-label={lang === 'en' ? t('switch_to_arabic') : t('switch_to_english')}
                  style={{
                    border: theme === 'light' ? '1px solid var(--border)' : '1px solid rgba(255,255,255,0.2)',
                    background: theme === 'light' ? 'var(--panel)' : 'rgba(0,0,0,0.3)',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: theme === 'light' ? 'var(--text-primary)' : '#fff'
                  }}
                >
                  {lang === 'en' ? getThemedIcon('ui', 'globe', 15, theme === 'light' ? 'var(--text-primary)' : '#fff') : getThemedIcon('ui', 'globe2', 15, theme === 'light' ? 'var(--text-primary)' : '#fff')}
                </button>
                </ColoredTooltip>

                {!isInstructor && (
                <ColoredTooltip title={t('my_data_access')} placement="bottom" color={DEFAULT_ACCENT}>
                <button
                  className="nav-icon-btn nav-help"
                  onClick={() => setShowAccessDrawer(true)}
                  aria-label={t('my_data_access')}
                  style={{
                    border: theme === 'light' ? '1px solid var(--border)' : '1px solid rgba(255,255,255,0.2)',
                    background: theme === 'light' ? 'var(--panel)' : 'rgba(0,0,0,0.3)',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: theme === 'light' ? 'var(--text-primary)' : '#fff'
                  }}
                >
                  {getThemedIcon('ui', 'shield', 15, theme === 'light' ? 'var(--text-primary)' : '#fff')}
                </button>
                </ColoredTooltip>
                )}

                {isOnboardingTourEnabled() && (
                <ColoredTooltip title={tourBadgeCount > 0 ? t('tour_help_count', { count: tourBadgeCount }) : t('tour_help')} placement="bottom" color={DEFAULT_ACCENT}>
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
                  aria-label={tourBadgeCount > 0 ? t('tour_help_count', { count: tourBadgeCount }) : t('tour_help')}
                  style={{
                    position: 'relative',
                    border: theme === 'light' ? '1px solid var(--border)' : '1px solid rgba(255,255,255,0.2)',
                    background: theme === 'light' ? 'var(--panel)' : 'rgba(0,0,0,0.3)',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: theme === 'light' ? 'var(--text-primary)' : '#fff'
                  }}
                >
                  {getThemedIcon('ui', 'help_circle', 15, theme === 'light' ? 'var(--text-primary)' : '#fff')}
                  {tourBadgeCount > 0 && (
                    <span style={{
                      position: 'absolute', top: -4, insetInlineEnd: -4,
                      minWidth: 16, height: 16, padding: '0 4px',
                      borderRadius: 999, background: 'var(--color-primary, #800020)', color: '#fff',
                      fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      lineHeight: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }}>
                      {tourBadgeCount}
                    </span>
                  )}
                </button>
                </ColoredTooltip>
                )}

                {isSuperAdmin && (
                  <ColoredTooltip title={t('help_center')} placement="bottom" color={DEFAULT_ACCENT}>
                  <button
                    className="nav-icon-btn"
                    onClick={() => window.open(`${import.meta.env.VITE_HELP_URL || 'http://localhost:3000'}/${lang}`, '_blank', 'noopener,noreferrer')}
                    aria-label={t('information')}
                    style={{
                      border: theme === 'light' ? '1px solid var(--border)' : '1px solid rgba(255,255,255,0.2)',
                      background: theme === 'light' ? 'var(--panel)' : 'rgba(0,0,0,0.3)',
                      borderRadius: '50%',
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: theme === 'light' ? 'var(--text-primary)' : '#fff'
                    }}
                  >
                    {getThemedIcon('ui', 'info', 16, theme === 'light' ? 'var(--text-primary)' : '#fff')}
                  </button>
                  </ColoredTooltip>
                )}

                <ColoredTooltip title={theme==='light'?t('dark_mode'):t('light_mode')} placement="bottom" color={DEFAULT_ACCENT}>
                <button
                  className="nav-icon-btn"
                  onClick={toggleTheme}
                  style={{
                    border: theme === 'light' ? '1px solid var(--border)' : '1px solid rgba(255,255,255,0.2)',
                    background: theme === 'light' ? 'var(--panel)' : 'rgba(0,0,0,0.3)',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: theme === 'light' ? 'var(--text-primary)' : '#fff'
                  }}
                >
                  {theme==='light'?getThemedIcon('ui', 'moon', 15, 'var(--text-primary)'):getThemedIcon('ui', 'sun', 15, '#fff')}
                </button>
                </ColoredTooltip>
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
                      return current === 'full' ? (t('minified_filters')) : (t('full_filters'));
                    } catch {
                      return (t('toggle_filter_view'));
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
              <div ref={menuRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <div
                  onClick={() => setShowDropdown(v=>!v)}
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #D4AF37, #FFD700)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: '#2E3B4E',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, background 0.3s',
                    overflow: 'hidden',
                    position: 'relative',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  aria-haspopup="menu"
                  aria-expanded={showDropdown}
                >
                  {userImages?.profile?.url ? (
                    <img
                      src={userImages.profile.url}
                      alt="Profile"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : user?.profileImageUrl ? (
                    <img
                      src={user.profileImageUrl}
                      alt="Profile"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <span style={{ position: 'relative', zIndex: 1 }}>
                      {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                {/* Multiple role badges stacked on the outer side */}
                <div style={{ position:'absolute', [lang === 'ar' ? 'left' : 'right']:-8, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {isSuperAdmin && (
                    <ColoredTooltip title={t('super_admin')} placement="left" color={getUserRoleColor('super_admin')}>
                    <div style={{ background: 'transparent', color: '#ffffff', borderRadius:'50%', width:18, height:18, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'none' }}>
                      {React.cloneElement(getUserRoleIcon('super_admin'), { fill: getUserRoleColor('super_admin') })}
                    </div>
                    </ColoredTooltip>
                  )}
                  {isAdmin && !isSuperAdmin && (
                    <ColoredTooltip title={t('admin')} placement="left" color={getUserRoleColor('admin')}>
                    <div style={{ background: 'transparent', color: '#ffffff', borderRadius:'50%', width:18, height:18, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'none' }}>
                      {React.cloneElement(getUserRoleIcon('admin'), { fill: getUserRoleColor('admin') })}
                    </div>
                    </ColoredTooltip>
                  )}
                  {isInstructor && (
                    <ColoredTooltip title={t('instructor')} placement="left" color={getUserRoleColor('instructor')}>
                    <div style={{ background: 'transparent', color: '#ffffff', borderRadius:'50%', width:18, height:18, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'none' }}>
                      {React.cloneElement(getUserRoleIcon('instructor'), { fill: getUserRoleColor('instructor') })}
                    </div>
                    </ColoredTooltip>
                  )}
                  {isHR && (
                    <ColoredTooltip title={t('hr')} placement="left" color={getUserRoleColor('hr')}>
                    <div style={{ background: 'transparent', color: '#ffffff', borderRadius:'50%', width:18, height:18, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'none' }}>
                      {React.cloneElement(getUserRoleIcon('hr'), { fill: getUserRoleColor('hr') })}
                    </div>
                    </ColoredTooltip>
                  )}
                </div>
                {showDropdown && (
                  <div className="dropdown-menu" style={{ [lang === 'ar' ? 'left' : 'right']: 0, top: 42, zIndex: 9999 }}>
                    <div className="dropdown-item user-info" style={{ padding: '10px 12px' }}>
                      <div className="user-name" style={{ fontWeight: 600, marginBottom: 4, fontSize: 'var(--font-size-md)' }}>
                        {getLocalizedUserName(
                          { displayName, displayNameAr, firstNameAr, lastNameAr, email: user?.email },
                          lang,
                          user?.email?.split('@')[0] || 'User'
                        )}
                      </div>
                      <div className="user-email" style={{ fontSize: '0.85rem', color: '#666', marginBottom: 4 }}>
                        {user?.email || ''}
                      </div>
                      {studentNumber && (
                        <div className="student-number" style={{ fontSize: '0.8rem', color: '#666', marginBottom: 8 }}>
                          {t('student_number')}: {studentNumber}
                        </div>
                      )}
                      <div className="role-badge" style={{ display:'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems:'center' }}>
                        {isSuperAdmin && (
                          <span style={{ color: getUserRoleColor('super_admin'), background: `${getUserRoleColor('super_admin')}20`, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 'var(--font-size-xs)', fontWeight: 700, padding: '4px 8px', borderRadius: 999 }}>
                            {getUserRoleIcon('super_admin')} {t('super_admin')}
                          </span>
                        )}
                        {isAdmin && !isSuperAdmin && (
                          <span style={{ color: getUserRoleColor('admin'), background: `${getUserRoleColor('admin')}20`, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 'var(--font-size-xs)', fontWeight: 700, padding: '4px 8px', borderRadius: 999 }}>
                            {getUserRoleIcon('admin')} {t('admin')}
                          </span>
                        )}
                        {isInstructor && (
                          <span style={{ color: getUserRoleColor('instructor'), background: `${getUserRoleColor('instructor')}20`, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 'var(--font-size-xs)', fontWeight: 700, padding: '4px 8px', borderRadius: 999 }}>
                            {getUserRoleIcon('instructor')} {t('instructor')}
                          </span>
                        )}
                        {isHR && (
                          <span style={{ color: getUserRoleColor('hr'), background: `${getUserRoleColor('hr')}20`, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 'var(--font-size-xs)', fontWeight: 700, padding: '4px 8px', borderRadius: 999 }}>
                            {getUserRoleIcon('hr')} {t('hr')}
                          </span>
                        )}
                        {!isSuperAdmin && !isAdmin && !isInstructor && !isHR && (
                          <span style={{ color: getUserRoleColor('student'), background: `${getUserRoleColor('student')}20`, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 'var(--font-size-xs)', fontWeight: 700, padding: '4px 8px', borderRadius: 999 }}>{t('student')}</span>
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
              {!isAdmin && !isSuperAdmin && (
                <>
                  <NavLink to="/enrollments" className={({isActive})=>`navbar-item${isActive?' active':''}`}>
                    {t('my_classes')}
                  </NavLink>
                  <NavLink to="/progress" className={({isActive})=>`navbar-item${isActive?' active':''}`}>{t('my_progress')}</NavLink>
                </>
              )}
              <NavLink to="/activities" className={({isActive})=>`navbar-item${isActive?' active':''}`}>
                {t('view_activities')}
              </NavLink>
              <NavLink to="/student-dashboard" className={({isActive})=>`navbar-item${isActive?' active':''}`}>
                {t('student_dashboard')}
              </NavLink>
              <NavLink to="/course-progress/sample-course" className={({isActive})=>`navbar-item${isActive?' active':''}`}>
                {t('course_progress')}
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
                    {t('quiz_management')}
                  </NavLink>
                </>
              )}

              {!isInstructor && <NotificationBell />}
              
              <ColoredTooltip title={lang==='en'?'العربية':'English'} placement="bottom" color={DEFAULT_ACCENT}>
              <button onClick={toggleLang} className="icon-btn">
                {lang==='en'?'EN':'AR'}
              </button>
              </ColoredTooltip>
              <ColoredTooltip title={density==='compact'?t('normal_view'):t('compact_view')} placement="bottom" color={DEFAULT_ACCENT}>
              <button onClick={()=>setDensity(d=>d==='compact'?'normal':'compact')} className="icon-btn">
                {density==='compact'?getThemedIcon('ui', 'zoom_in', 16, theme === 'light' ? 'var(--text-primary)' : theme):getThemedIcon('ui', 'ruler', 16, theme === 'light' ? 'var(--text-primary)' : theme)}
              </button>
              </ColoredTooltip>
              <ColoredTooltip title={theme==='light'?t('dark_mode'):t('light_mode')} placement="bottom" color={DEFAULT_ACCENT}>
              <button onClick={toggleTheme} className="icon-btn">
                {theme==='light'?getThemedIcon('ui', 'moon', 16, 'var(--text-primary)'):getThemedIcon('ui', 'sun', 16, theme)}
              </button>
              </ColoredTooltip>
              
              <div className="navbar-user" onClick={() => setShowDropdown(!showDropdown)} ref={menuRef}>
                <div className="user-avatar" style={{ overflow: 'hidden' }}>
                  {userImages?.profile?.url ? (
                    <img src={userImages.profile.url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : user?.profileImageUrl ? (
                    <img src={user.profileImageUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    (displayName || user.email)?.charAt(0).toUpperCase()
                  )}
                </div>
                {showDropdown && (
                  <div className="dropdown-menu">
                    <div className="dropdown-item user-info" style={{ padding: '10px 12px' }}>
                      <div className="user-email" style={{ fontWeight: 600, marginBottom: 4 }}>{user.email}</div>
                      {displayName && displayName !== user.email && (
                        <div className="display-name" style={{ fontSize: '0.9rem', color: '#333', marginBottom: 4 }}>
                          {t('display_name')}: {displayName}
                        </div>
                      )}
                      {studentNumber && (
                        <div className="student-number" style={{ fontSize: '0.8rem', color: '#666', marginBottom: 8 }}>
                          {t('student_number')}: {studentNumber}
                        </div>
                      )}
                      <div className="role-badge" style={{ display:'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems:'center' }}>
                        {isSuperAdmin && (
                          <span style={{ color: getUserRoleColor('super_admin'), background: `${getUserRoleColor('super_admin')}20`, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 'var(--font-size-xs)', fontWeight: 700, padding: '4px 8px', borderRadius: 999 }}>
                            {getUserRoleIcon('super_admin')} {t('super_admin')}
                          </span>
                        )}
                        {isAdmin && !isSuperAdmin && (
                          <span style={{ color: getUserRoleColor('admin'), background: `${getUserRoleColor('admin')}20`, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 'var(--font-size-xs)', fontWeight: 700, padding: '4px 8px', borderRadius: 999 }}>
                            {getUserRoleIcon('admin')} {t('admin')}
                          </span>
                        )}
                        {isInstructor && (
                          <span style={{ color: getUserRoleColor('instructor'), background: `${getUserRoleColor('instructor')}20`, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 'var(--font-size-xs)', fontWeight: 700, padding: '4px 8px', borderRadius: 999 }}>
                            {getUserRoleIcon('instructor')} {t('instructor')}
                          </span>
                        )}
                        {isHR && (
                          <span style={{ color: getUserRoleColor('hr'), background: `${getUserRoleColor('hr')}20`, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 'var(--font-size-xs)', fontWeight: 700, padding: '4px 8px', borderRadius: 999 }}>
                            {getUserRoleIcon('hr')} {t('hr')}
                          </span>
                        )}
                        {!isSuperAdmin && !isAdmin && !isInstructor && !isHR && (
                          <span style={{ color: getUserRoleColor('student'), background: `${getUserRoleColor('student')}20`, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 'var(--font-size-xs)', fontWeight: 700, padding: '4px 8px', borderRadius: 999 }}>{t('student')}</span>
                        )}
                      </div>
                    </div>
                    <button className="dropdown-item" onClick={openProfile}>
                      {t('edit_profile')}
                    </button>
                    <button className="dropdown-item sign-out-btn" onClick={handleSignOut}>
                      {t('sign_out')}
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
                <input type="text" value={realName} onChange={(e)=>setRealName(e.target.value)} placeholder={t('navbar.real_name_placeholder', 'First Last')} style={{ width: '100%', padding: '0.75rem', border: theme==='light'?'1px solid #e5e7eb':'1px solid rgba(255,255,255,0.15)', borderRadius: 8, background: theme==='light'?'#ffffff':'#0b1220', color: theme==='light'?'#111827':'#e5e7eb' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>{t('display_name_ar')}</label>
                <input type="text" dir="rtl" value={displayNameAr} onChange={(e)=>setDisplayNameAr(e.target.value)} placeholder={t('display_name_ar_placeholder')} style={{ width: '100%', padding: '0.75rem', border: theme==='light'?'1px solid #e5e7eb':'1px solid rgba(255,255,255,0.15)', borderRadius: 8, background: theme==='light'?'#ffffff':'#0b1220', color: theme==='light'?'#111827':'#e5e7eb' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>{t('first_name_ar')}</label>
                <input type="text" dir="rtl" value={firstNameAr} onChange={(e)=>setFirstNameAr(e.target.value)} placeholder={t('first_name_ar_placeholder')} style={{ width: '100%', padding: '0.75rem', border: theme==='light'?'1px solid #e5e7eb':'1px solid rgba(255,255,255,0.15)', borderRadius: 8, background: theme==='light'?'#ffffff':'#0b1220', color: theme==='light'?'#111827':'#e5e7eb' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>{t('last_name_ar')}</label>
                <input type="text" dir="rtl" value={lastNameAr} onChange={(e)=>setLastNameAr(e.target.value)} placeholder={t('last_name_ar_placeholder')} style={{ width: '100%', padding: '0.75rem', border: theme==='light'?'1px solid #e5e7eb':'1px solid rgba(255,255,255,0.15)', borderRadius: 8, background: theme==='light'?'#ffffff':'#0b1220', color: theme==='light'?'#111827':'#e5e7eb' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>{t('student_number')} ({t('optional')})</label>
                <input type="text" value={studentNumber} onChange={(e)=>setStudentNumber(e.target.value)} placeholder={t('navbar.student_number_placeholder', 'e.g., 202400123')} style={{ width: '100%', padding: '0.75rem', border: theme==='light'?'1px solid #e5e7eb':'1px solid rgba(255,255,255,0.15)', borderRadius: 8, background: theme==='light'?'#ffffff':'#0b1220', color: theme==='light'?'#111827':'#e5e7eb' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>{t('phone_number')}</label>
                <input type="tel" value={phoneNumber} onChange={(e)=>setPhoneNumber(e.target.value)} placeholder={t('navbar.phone_number_placeholder', '+1 234 567 8900')} style={{ width: '100%', padding: '0.75rem', border: theme==='light'?'1px solid #e5e7eb':'1px solid rgba(255,255,255,0.15)', borderRadius: 8, background: theme==='light'?'#ffffff':'#0b1220', color: theme==='light'?'#111827':'#e5e7eb' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>{t('message_color')}</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="color" value={primaryColor} onChange={(e)=>setPrimaryColor(e.target.value)} style={{ width: 60, height: 40, border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer' }} />
                  <div style={{ flex: 1, padding: '0.75rem', background: primaryColor, color: 'white', borderRadius: 8, textAlign: 'center', fontWeight: 600 }}>{t('preview')}</div>
                </div>
              </div>
              <div>
                <Select
                  label={t('notifications_language')}
                  value={notifLang}
                  onChange={(e)=>setNotifLang(e.target.value)}
                  options={[
                    { value: 'auto', label: t('auto_follow_ui') },
                    { value: 'en', label: 'English' },
                    { value: 'ar', label: 'العربية' }
                  ]}
                  fullWidth
                />
              </div>
            </div>
            {/* Density control (4 levels) */}
            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>{t('density_layout')}</label>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4, minmax(0,1fr))', gap: 8 }}>
                {[
                  { id:'compact', label: t('compact') },
                  { id:'cozy', label: t('cozy') },
                  { id:'comfortable', label: t('comfortable') },
                  { id:'roomy', label: t('roomy') },
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
        <ColoredTooltip title={t('expand_navbar')} placement="left" color={DEFAULT_ACCENT}>
        <button
          onClick={toggleNavbar}
          aria-label={t('expand_navbar')}
          style={{
            position: 'fixed',
            top: isMobile ? '6px' : '8px',
            right: isMobile ? '6px' : '8px',
            zIndex: 1000,
            background: theme === 'light' ? 'rgba(255, 255, 255, 0.45)' : 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'saturate(150%) blur(6px)',
            border: theme === 'light' ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.1)',
            borderRadius: '50%',
            width: isMobile ? '22px' : '26px',
            height: isMobile ? '22px' : '26px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: theme === 'light' ? 'var(--text-primary)' : '#fff',
            boxShadow: theme === 'light'
              ? '0 2px 4px rgba(0, 0, 0, 0.08)'
              : '0 2px 4px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.2s ease',
            opacity: 0.85,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.boxShadow = theme === 'light'
              ? '0 4px 8px rgba(0, 0, 0, 0.12)'
              : '0 4px 8px rgba(0, 0, 0, 0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.opacity = '0.85';
            e.currentTarget.style.boxShadow = theme === 'light'
              ? '0 2px 4px rgba(0, 0, 0, 0.08)'
              : '0 2px 4px rgba(0, 0, 0, 0.2)';
          }}
        >
          {getThemedIcon('ui', 'chevron_down', isMobile ? 12 : 14, theme)}
        </button>
        </ColoredTooltip>
      )}

      <MyDataScopeDrawer isOpen={showAccessDrawer} onClose={() => setShowAccessDrawer(false)} />
    </>
  );
};

export default Navbar;
