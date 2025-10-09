import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { signOutUser } from '../firebase/auth';
import NotificationBell from './NotificationBell';
import { useLang } from '../contexts/LangContext';
import { getUsers, updateUser } from '../firebase/firestore';
import './Navbar.css';

const Navbar = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [realName, setRealName] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [messageColor, setMessageColor] = useState('#667eea');
  const { lang, toggleLang, t } = useLang();
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('theme') || 'light'; } catch { return 'light'; }
  });
  const [density, setDensity] = useState(() => {
    try { return localStorage.getItem('density') || 'compact'; } catch { return 'compact'; }
  });
  const menuRef = useRef(null);

  useEffect(() => {
    try { localStorage.setItem('theme', theme); } catch {}
    try { document.documentElement.setAttribute('data-theme', theme); } catch {}
  }, [theme]);

  useEffect(() => {
    try { localStorage.setItem('density', density); } catch {}
    try { document.documentElement.setAttribute('data-density', density); } catch {}
  }, [density]);

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
      // Pre-fill with existing data
      const result = await getUsers();
      const me = (result.data || []).find(u => u.email === user.email) || (result.data || []).find(u => u.docId === user.uid);
      setDisplayName(user?.displayName || me?.displayName || '');
      setPhoneNumber(me?.phoneNumber || '');
      setMessageColor(me?.messageColor || '#667eea');
      setRealName(me?.realName || '');
      setStudentNumber(me?.studentNumber || '');
      setShowProfile(true);
    } catch (e) { /* noop */ }
  };

  const saveProfile = async () => {
    try {
      if (!user) return;
      // Find user doc by email (more reliable than uid for this app schema)
      const result = await getUsers();
      const me = (result.data || []).find(u => u.email === user.email) || (result.data || []).find(u => u.docId === user.uid);
      if (me?.docId) {
        await updateUser(me.docId, { displayName, phoneNumber, messageColor, realName, studentNumber });
      }
      // Update Firebase Auth profile
      try {
        const { getAuth, updateProfile } = await import('firebase/auth');
        const auth = getAuth();
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, { displayName });
        }
      } catch {}
      setShowProfile(false);
      // Refresh page to reflect color changes
      window.location.reload();
    } catch (err) {
      console.error('Failed to save profile:', err);
      alert('Failed to save profile');
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Hide brand to save space */}
        <div className="navbar-brand" style={{ display: 'none' }} />
        
        <div className="navbar-menu">
          {user ? (
            <>
              <NavLink to="/" className={({isActive})=>`navbar-item${isActive?' active':''}`}>
                <span style={{ fontSize: '1.8rem', lineHeight: 1, display: 'inline-block' }}>🏠</span>
              </NavLink>
              {!isAdmin && (
                <>
                  <NavLink to="/enrollments" className={({isActive})=>`navbar-item${isActive?' active':''}`} aria-label={t('my_classes') || 'My Classes'}>
                    <span style={{ fontSize: '1.8rem', display: 'inline-block' }}>🎓</span>
                  </NavLink>
                  <NavLink to="/progress" className={({isActive})=>`navbar-item${isActive?' active':''}`}>{t('my_progress')}</NavLink>
                </>
              )}
              <NavLink to="/activities?tab=bookmarks" className={({isActive})=>`navbar-item${isActive?' active':''}`} title={t('bookmarked') || 'Bookmarked'}>
                ⭐
              </NavLink>
              <NavLink to="/chat" className={({isActive})=>`navbar-item${isActive?' active':''}`}>{t('chat')}</NavLink>
              <NavLink to="/leaderboard" className={({isActive})=>`navbar-item${isActive?' active':''}`}>{t('leaderboard')}</NavLink>
              <NavLink to="/resources" className={({isActive})=>`navbar-item${isActive?' active':''}`}>{t('resources')}</NavLink>

              {isAdmin && (
                <>
                  <NavLink to="/dashboard" className={({isActive})=>`navbar-item${isActive?' active':''}`}>
                    {t('dashboard')}
                  </NavLink>
                  <NavLink to="/student-progress" className={({isActive})=>`navbar-item${isActive?' active':''}`}>
                    {t('progress')}
                  </NavLink>
                </>
              )}

              <NotificationBell />
              
              <button onClick={toggleLang} className="icon-btn" title={lang==='en'?'العربية':'English'}>
                {lang==='en'?'AR':'EN'}
              </button>
              <button onClick={()=>setDensity(d=>d==='compact'?'normal':'compact')} className="icon-btn" title={density==='compact'?'Normal View':'Compact View'}>
                {density==='compact'?'🔍':'📐'}
              </button>
              <button onClick={()=>setTheme(t=>t==='light'?'dark':'light')} className="icon-btn" title={theme==='light'?'Dark':'Light'}>
                {theme==='light'?'🌙':'☀️'}
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
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
        }} onClick={()=>setShowProfile(false)}>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: 12, minWidth: 320, maxWidth: 720, width: '90vw' }} onClick={(e)=>e.stopPropagation()}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>{t('edit_profile')}</h3>
            <div style={{ display:'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>{t('email')}</label>
                <input type="email" value={user?.email || ''} readOnly style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: 8, background: '#f5f5f5', color: '#666' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>{t('display_name')}</label>
                <input type="text" value={displayName} onChange={(e)=>setDisplayName(e.target.value)} placeholder={t('display_name')} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: 8 }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>{t('real_name')}</label>
                <input type="text" value={realName} onChange={(e)=>setRealName(e.target.value)} placeholder="First Last" style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: 8 }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>{t('student_number')} ({t('optional')})</label>
                <input type="text" value={studentNumber} onChange={(e)=>setStudentNumber(e.target.value)} placeholder="e.g., 202400123" style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: 8 }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>{t('phone_number') || 'Phone Number'}</label>
                <input type="tel" value={phoneNumber} onChange={(e)=>setPhoneNumber(e.target.value)} placeholder="+1 234 567 8900" style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: 8 }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>{t('message_color') || 'Message Bubble Color'}</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="color" value={messageColor} onChange={(e)=>setMessageColor(e.target.value)} style={{ width: 60, height: 40, border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer' }} />
                  <div style={{ flex: 1, padding: '0.75rem', background: messageColor, color: 'white', borderRadius: 8, textAlign: 'center', fontWeight: 600 }}>{t('preview')}</div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={()=>setShowProfile(false)} style={{ padding: '0.5rem 1rem', background: '#6c757d', color: 'white', border: 'none', borderRadius: 6 }}>{t('cancel')}</button>
              <button onClick={saveProfile} style={{ padding: '0.5rem 1rem', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: 6 }}>{t('save')}</button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
