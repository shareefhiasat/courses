import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { signOutUser } from '../firebase/auth';
import NotificationBell from './NotificationBell';
import SideDrawer from './SideDrawer';
import { useLang } from '../contexts/LangContext';
import { getUsers, updateUser } from '../firebase/firestore';
import './Navbar.css';
import { Menu, Medal, Home as HomeIcon, User, Sun, Moon, ZoomIn, Ruler, Crown, HelpCircle, LayoutGrid, List, Info } from 'lucide-react';
import { LanguageSwitcher } from './ui';
import { useTheme } from '../contexts/ThemeContext';
import { getTimeFormatPreference, setTimeFormatPreference } from '../utils/date';
import { adjustColor, hexToRgbString, normalizeHexColor, DEFAULT_ACCENT } from '../utils/color';

const ACCENT_FALLBACK = DEFAULT_ACCENT;

const Navbar = () => {
  let authContext;
  try {
    authContext = useAuth();
  } catch (error) {
    // AuthProvider not available yet, return null
    return null;
  }
  const { user, isAdmin, isSuperAdmin, isInstructor, isHR, impersonating, stopImpersonation } = authContext;
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [realName, setRealName] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [messageColor, setMessageColor] = useState(ACCENT_FALLBACK);
  const [timeFormat, setTimeFormat] = useState(() => getTimeFormatPreference());
  const { lang, toggleLang, t } = useLang();
  const { theme, toggleTheme } = useTheme();
  const [notifLang, setNotifLang] = useState('auto');
  const [density, setDensity] = useState(() => {
    try { return localStorage.getItem('density') || 'compact'; } catch { return 'compact'; }
  });
  const menuRef = useRef(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // theme is managed by ThemeProvider

  // Allow other components (e.g., SideDrawer) to open the profile modal
  useEffect(() => {
    const openProfileHandler = () => setShowProfile(true);
    window.addEventListener('openProfile', openProfileHandler);
    return () => window.removeEventListener('openProfile', openProfileHandler);
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      setMessageColor(ACCENT_FALLBACK);
      return;
    }
    
    // Try to load from localStorage cache first (quick fix to prevent flash)
    try {
      const cachedColor = localStorage.getItem(`accent_color_${user.uid}`);
      if (cachedColor) {
        const cached = normalizeHexColor(cachedColor, ACCENT_FALLBACK);
        setMessageColor(cached);
        applyAccentColor(cached);
      }
    } catch {}
    
    let cancelled = false;
    (async () => {
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../firebase/config');
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (!cancelled) {
          const storedColor = snap.exists() ? snap.data().messageColor : null;
          const normalized = normalizeHexColor(storedColor, ACCENT_FALLBACK);
          setMessageColor(normalized);
          // Cache in localStorage
          try {
            localStorage.setItem(`accent_color_${user.uid}`, normalized);
          } catch {}
        }
      } catch {
        if (!cancelled) {
          setMessageColor(ACCENT_FALLBACK);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  useEffect(() => {
    applyAccentColor(messageColor);
  }, [messageColor]);

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

  const handleSignOut = async () => {
    try {
      await signOutUser();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const openProfile = async () => {
    try {
      // Prefer deterministic users/{uid} document for reliability with rules
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');
      let me = null;
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        me = snap.exists() ? { docId: user.uid, ...snap.data() } : null;
      } catch {}
      // Fallback: list query (in case read rules block direct doc)
      if (!me) {
        try {
          const { getUsers } = await import('../firebase/firestore');
          const res = await getUsers();
          me = (res.data || []).find(u => u.docId === user.uid || u.email === user.email) || null;
        } catch {}
      }
      setDisplayName(user?.displayName || me?.displayName || '');
      setPhoneNumber(me?.phoneNumber || '');
      const color = normalizeHexColor(me?.messageColor, ACCENT_FALLBACK);
      setMessageColor(color);
      // Cache in localStorage
      try {
        if (user?.uid) localStorage.setItem(`accent_color_${user.uid}`, color);
      } catch {}
      setRealName(me?.realName || '');
      setStudentNumber(me?.studentNumber || '');
      setNotifLang(me?.notifLang || 'auto');
      // No avatar support; we always use initials avatar
      setTimeFormat(getTimeFormatPreference());
      setShowProfile(true);
    } catch (e) { /* noop */ }
  };

  const saveProfile = async () => {
    try {
      if (!user) return;
      // Write directly to users/{uid}
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');
      const dataToSave = {
        displayName: displayName || null,
        phoneNumber: phoneNumber || null,
        messageColor: (() => {
          const color = normalizeHexColor(messageColor, ACCENT_FALLBACK);
          // Cache in localStorage
          try {
            if (user?.uid) localStorage.setItem(`accent_color_${user.uid}`, color);
          } catch {}
          return color;
        })(),
        realName: realName || null,
        studentNumber: studentNumber || null,
        email: user.email,
        notifLang: notifLang || 'auto',
      };
      await setDoc(doc(db, 'users', user.uid), dataToSave, { merge: true });
      // Update Firebase Auth profile
      try {
        const { getAuth, updateProfile } = await import('firebase/auth');
        const auth = getAuth();
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, { displayName });
        }
      } catch {}
      // Save UI-only preferences
      setTimeFormatPreference(timeFormat);
      // Close dialog on successful save
      setShowProfile(false);
    } catch (err) {
      console.error('Failed to save profile:', err);
      alert('Failed to save profile');
    }
  };

  return (
    <>
      <SideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
      
      <nav className="navbar" style={{ padding: '0.35rem 0' }}>
        <div className="navbar-container">
          {/* Hamburger Menu */}
          {user && (
            <button
              onClick={() => setDrawerOpen(true)}
              className="navbar-hamburger"
              style={{
                background: 'transparent',
                border: '2px solid #D4AF37',
                color: '#D4AF37',
                fontSize: '1.1rem',
                cursor: 'pointer',
                padding: '0.35rem 0.6rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 10,
                marginRight: lang === 'ar' ? 0 : '0.75rem',
                marginLeft: lang === 'ar' ? '0.75rem' : 0
              }}
              aria-label="Menu"
            >
              <Menu size={18} />
            </button>
          )}

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
            <img src="https://upload.wikimedia.org/wikipedia/en/thumb/2/21/Seal_of_the_Qatar_Armed_Forces_General_Command.png/255px-Seal_of_the_Qatar_Armed_Forces_General_Command.png" alt="QAF" style={{ width: 18, height: 18, objectFit: 'cover', borderRadius: '50%' }} /> QAF
          </div>

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
              <User size={16} /> {t('viewing_as_student') || 'Viewing as Student'} <span style={{ marginLeft: '0.5rem' }}>✕</span>
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
                  onClick={() => {
                    try {
                      window.dispatchEvent(new CustomEvent('app:joyride', { detail: { route: location?.pathname || '/' } }));
                    } catch {}
                  }}
                  title={t('help') || 'Help'}
                  aria-label={t('help') || 'Help'}
                >
                  <HelpCircle size={16} />
                </button>

                <button
                  className="nav-icon-btn"
                  onClick={() => {
                    try {
                      // Toggle help drawer
                      window.dispatchEvent(new CustomEvent('app:help:toggle', { detail: { route: location?.pathname || '/' } }));
                    } catch {}
                  }}
                  title={t('information') || 'Information'}
                  aria-label={t('information') || 'Information'}
                  style={{
                    border: '1px solid var(--border)',
                    background: 'var(--panel)',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--text-primary)'
                  }}
                >
                  <Info size={18} />
                </button>

                <button
                  className="nav-icon-btn"
                  title={theme==='light'?'Dark':'Light'}
                  onClick={toggleTheme}
                  style={{
                    border: '1px solid var(--border)',
                    background: 'var(--panel)',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--text-primary)'
                  }}
                >
                  {theme==='light'?<Moon size={16} />:<Sun size={16} />}
                </button>
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
                      return current === 'full' ? 'Minified Filters' : 'Full Filters';
                    } catch {
                      return 'Toggle Filter View';
                    }
                  })()}
                >
                  {(() => {
                    try {
                      const current = localStorage.getItem('filterViewMode') || 'full';
                      return current === 'full' ? <LayoutGrid size={16} /> : <List size={16} />;
                    } catch {
                      return <LayoutGrid size={16} />;
                    }
                  })()}
                </button>
              </div>

              {/* Profile Avatar with Super Admin badge and dropdown */}
              <div ref={menuRef} style={{ position: 'relative' }}>
                <div 
                  onClick={() => setShowDropdown(v=>!v)}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: messageColor && messageColor !== ACCENT_FALLBACK 
                      ? `linear-gradient(135deg, ${messageColor}, ${adjustColor(messageColor, 10)})`
                      : 'rgba(255,255,255,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: messageColor && messageColor !== ACCENT_FALLBACK ? '#fff' : '#2E3B4E',
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
                  {(!messageColor || messageColor === ACCENT_FALLBACK) && (
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
                {isSuperAdmin && (
                  <div title="Super Admin" style={{ position:'absolute', right:-6, top:-6, background:'#4f46e5', color:'#fff', borderRadius:'50%', width:20, height:20, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 0 2px rgba(255,255,255,0.8)' }}>
                    <Crown size={12} />
                  </div>
                )}
                {showDropdown && (
                  <div className="dropdown-menu" style={{ right: 0, top: 48, zIndex: 9999 }}>
                    <div className="dropdown-item user-info" style={{ padding: '10px 12px' }}>
                      <div className="user-email" style={{ fontWeight: 600, marginBottom: 8 }}>{user.displayName || user.email}</div>
                      <div className="role-badge" style={{ display:'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems:'center' }}>
                        {isSuperAdmin && (
                          <span style={{ color: '#f59e0b', border: '1.5px solid #f59e0b', background: 'rgba(245, 158, 11, 0.1)', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, padding: '4px 8px', borderRadius: 999 }}>
                            <Crown size={14} /> Super Admin
                          </span>
                        )}
                        {isAdmin && !isSuperAdmin && (
                          <span style={{ color: '#4f46e5', border: '1.5px solid #4f46e5', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, padding: '4px 8px', borderRadius: 999 }}>Admin</span>
                        )}
                        {isInstructor && (
                          <span style={{ color: '#0ea5e9', border: '1.5px solid #0ea5e9', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, padding: '4px 8px', borderRadius: 999 }}>Instructor</span>
                        )}
                        {isHR && (
                          <span style={{ color: '#8b5cf6', border: '1.5px solid #8b5cf6', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, padding: '4px 8px', borderRadius: 999 }}>HR</span>
                        )}
                        {!isSuperAdmin && !isAdmin && !isInstructor && !isHR && (
                          <span style={{ color: '#16a34a', border: '1.5px solid #16a34a', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, padding: '4px 8px', borderRadius: 999 }}>Student</span>
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
                  <span style={{ display: 'inline-flex', alignItems:'center' }}><HomeIcon size={18} /></span>
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
                {lang==='en'?'AR':'EN'}
              </button>
              <button onClick={()=>setDensity(d=>d==='compact'?'normal':'compact')} className="icon-btn" title={density==='compact'?'Normal View':'Compact View'}>
                {density==='compact'?<ZoomIn size={16} />:<Ruler size={16} />}
              </button>
              <button onClick={()=>setTheme(t=>t==='light'?'dark':'light')} className="icon-btn" title={theme==='light'?'Dark':'Light'}>
                {theme==='light'?<Moon size={16} />:<Sun size={16} />}
              </button>
              
              <div className="navbar-user" onClick={() => setShowDropdown(!showDropdown)} ref={menuRef}>
                <div className="user-avatar">
                  {(user.displayName || user.email)?.charAt(0).toUpperCase()}
                </div>
                {showDropdown && (
                  <div className="dropdown-menu">
                    <div className="dropdown-item user-info">
                      <div className="user-email">{user.displayName || user.email}</div>
                      {isAdmin && <div className="admin-badge">{t('admin') || 'Admin'}</div>}
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
                  <input type="color" value={messageColor} onChange={(e)=>setMessageColor(e.target.value)} style={{ width: 60, height: 40, border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer' }} />
                  <div style={{ flex: 1, padding: '0.75rem', background: messageColor, color: 'white', borderRadius: 8, textAlign: 'center', fontWeight: 600 }}>{t('preview')}</div>
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
    </>
  );
};

export default Navbar;

const applyAccentColor = (color) => {
  if (typeof document === 'undefined') return;
  const accent = normalizeHexColor(color, ACCENT_FALLBACK);
  const root = document.documentElement;
  root.style.setProperty('--color-primary', accent);
  root.style.setProperty('--color-primary-light', adjustColor(accent, 15));
  root.style.setProperty('--color-primary-dark', adjustColor(accent, -15));
  root.style.setProperty('--color-primary-rgb', hexToRgbString(accent));
  root.style.setProperty('--input-focus', accent);
};
