import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Shield, Settings2, Check, X, Save, Search, ToggleLeft, ToggleRight } from 'lucide-react';
import Loading from '../components/Loading';
import './RoleAccessPro.css';

export default function RoleAccessPro() {
  const { user, isAdmin, isSuperAdmin, loading: authLoading } = useAuth();
  const { t } = useLang();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roleScreens, setRoleScreens] = useState({});
  const [message, setMessage] = useState('');
  const [activeRole, setActiveRole] = useState('admin');
  const [q, setQ] = useState('');

  const roles = ['admin', 'instructor', 'hr', 'student'];

  const screens = [
    { id: 'dashboard', name: 'Dashboard', group: 'General' },
    { id: 'activities', name: 'Activities', group: 'Learning' },
    { id: 'resources', name: 'Resources', group: 'Learning' },
    { id: 'classes', name: 'Classes', group: 'Learning' },
    { id: 'attendance', name: 'Attendance (Instructor)', group: 'Attendance' },
    { id: 'myAttendance', name: 'My Attendance (Student)', group: 'Attendance' },
    { id: 'hrAttendance', name: 'HR Attendance', group: 'Attendance' },
    { id: 'analytics', name: 'Analytics', group: 'Insights' },
    { id: 'studentProfile', name: 'Student Profile', group: 'Students' },
    { id: 'classSchedule', name: 'Class Schedule', group: 'Learning' },
    { id: 'manageEnrollments', name: 'Manage Enrollments', group: 'Admin' },
    { id: 'enrollments', name: 'Enrollments', group: 'Admin' },
    { id: 'chat', name: 'Chat', group: 'Engagement' },
    { id: 'leaderboard', name: 'Leaderboard', group: 'Engagement' },
    { id: 'progress', name: 'Progress', group: 'Insights' },
    { id: 'notifications', name: 'Notifications', group: 'General' },
    { id: 'profile', name: 'Profile Settings', group: 'General' },
  ];

  const defaultRoleScreens = {
    admin: { dashboard: true, activities: true, resources: true, classes: true, attendance: true, analytics: true, studentProfile: true, classSchedule: true, manageEnrollments: true, enrollments: true, chat: true, leaderboard: true, progress: true, notifications: true, profile: true, hrAttendance: true, myAttendance: false },
    instructor: { dashboard: false, activities: true, resources: true, classes: true, attendance: true, analytics: true, studentProfile: true, classSchedule: true, manageEnrollments: true, enrollments: true, chat: true, leaderboard: true, progress: true, notifications: true, profile: true, hrAttendance: false, myAttendance: false },
    hr: { dashboard: false, activities: false, resources: false, classes: true, attendance: false, analytics: true, studentProfile: true, classSchedule: false, manageEnrollments: false, enrollments: true, chat: false, leaderboard: false, progress: false, notifications: true, profile: true, hrAttendance: true, myAttendance: false },
    student: { dashboard: false, activities: true, resources: true, classes: true, attendance: false, analytics: false, studentProfile: true, classSchedule: false, manageEnrollments: false, enrollments: true, chat: true, leaderboard: true, progress: true, notifications: true, profile: true, hrAttendance: false, myAttendance: true },
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    loadRoleScreens();
  }, [authLoading, user]);

  const loadRoleScreens = async () => {
    try {
      const docRef = doc(db, 'config', 'roleScreens');
      const snap = await getDoc(docRef);
      if (snap.exists()) setRoleScreens(snap.data());
      else setRoleScreens(defaultRoleScreens);
    } catch (e) {
      console.error(e);
      setRoleScreens(defaultRoleScreens);
    } finally {
      setLoading(false);
    }
  };

  const saveRoleScreens = async () => {
    setSaving(true);
    setMessage('');
    try {
      const docRef = doc(db, 'config', 'roleScreens');
      await setDoc(docRef, roleScreens);
      setMessage(t('role_access_updated') || 'Role access saved');
      setTimeout(()=>setMessage(''), 2500);
    } catch (e) {
      console.error(e);
      setMessage('Error saving role access');
    } finally {
      setSaving(false);
    }
  };

  const toggleScreen = (role, id) => {
    setRoleScreens(prev => ({
      ...prev,
      [role]: { ...(prev[role]||{}), [id]: !(prev[role]?.[id]||false) }
    }));
  };

  const filteredScreens = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = term
      ? screens.filter(s => s.name.toLowerCase().includes(term) || s.id.toLowerCase().includes(term))
      : screens;
    const groups = list.reduce((acc, s) => { (acc[s.group] ||= []).push(s); return acc; }, {});
    return Object.entries(groups).map(([group, items]) => ({ group, items }));
  }, [q]);

  if (authLoading) return <Loading fullscreen message={t('loading')} />;
  if (!(isSuperAdmin || isAdmin)) {
    return (
      <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#f4e9ff,#eaf2ff)',padding:24}}>
        <div style={{maxWidth:720,margin:'0 auto',background:'#fff',borderRadius:16,boxShadow:'0 20px 40px rgba(0,0,0,0.15)',padding:32,textAlign:'center'}}>
          <Shield style={{width:56,height:56,color:'#ef4444',margin:'0 auto 12px'}} />
          <h2 style={{fontSize:22,fontWeight:800,marginBottom:8}}>Access Denied</h2>
          <p style={{color:'#4b5563'}}>Only admins can access this page.</p>
        </div>
      </div>
    );
  }
  if (loading) return <Loading fullscreen message={t('loading')} />;

  return (
    <div className="rolepro-page">
      <div className="rolepro-card">
        <div className="rolepro-hero">
          <div className="hero-row">
            <div style={{display:'flex',alignItems:'center',gap:16}}>
              <div className="logo">
                <Settings2 style={{width:28,height:28,color:'#fff'}} />
              </div>
              <div>
                <h1 className="rolepro-title">Role Access</h1>
                <p className="rolepro-subtitle">Enable/disable screens per role</p>
              </div>
            </div>
            <div className="rolepro-controls">
              <div className="rolepro-search">
                <Search style={{width:16,height:16,color:'rgba(255,255,255,0.85)'}} />
                <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search screens..." />
              </div>
              <div className="rolepro-chooser">
                <span>Role</span>
                <select value={activeRole} onChange={(e)=>setActiveRole(e.target.value)}>
                  {roles.map(r => (<option key={r} value={r}>{r}</option>))}
                </select>
                <button onClick={()=>{ const allOn={}; screens.forEach(s=>allOn[s.id]=true); setRoleScreens(p=>({ ...p, [activeRole]: { ...(p[activeRole]||{}), ...allOn } })); }} className="rolepro-btn">Enable all</button>
                <button onClick={()=>{ const allOff={}; screens.forEach(s=>allOff[s.id]=false); setRoleScreens(p=>({ ...p, [activeRole]: { ...(p[activeRole]||{}), ...allOff } })); }} className="rolepro-btn danger">Disable all</button>
              </div>
            </div>
          </div>
          <div className="rolepro-deco1" />
          <div className="rolepro-deco2" />
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:24}}>
          {filteredScreens.map(({ group, items }) => (
            <div key={group} className="rolepro-group">
              <div className="head">
                <div className="title">{group}</div>
                <div className="count">{items.length} screens</div>
              </div>
              <div className="rolepro-list">
                {items.map((s, idx) => (
                  <div key={s.id} className={`rolepro-row ${idx%2 ? 'alt' : ''}`}>
                    <div>
                      <div className="screen-name">{s.name}</div>
                      <div className="screen-id">{s.id}</div>
                    </div>
                    <div className="rolepro-rolegrid">
                      {roles.map(r => {
                        const on = !!(roleScreens[r]?.[s.id]);
                        return (
                          <div key={`${s.id}_${r}`} style={{display:'flex',alignItems:'center',justifyContent:'center'}}>
                            <button
                              onClick={()=>toggleScreen(r, s.id)}
                              role="switch"
                              aria-checked={on}
                              className={`switch ${on ? 'on' : 'off'}`}
                              title={`${r} toggle`}
                              style={{WebkitTapHighlightColor:'transparent'}}
                            >
                              <span className="knob" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="rolepro-savebar">
          <div className="bar">
            <div style={{display:'flex',alignItems:'center',gap:8,fontSize:14,color:'#374151'}}>
              <Save style={{width:16,height:16}} />
              <span>Make sure to save your changes</span>
            </div>
            <button onClick={saveRoleScreens} disabled={saving} className="save-btn" style={{opacity: saving ? 0.6 : 1, cursor: saving ? 'not-allowed' : 'pointer'}}>
              {saving ? (t('saving') || 'Saving...') : (t('save_role_access') || 'Save Role Access')}
            </button>
          </div>
        </div>

        {message && (
          <div className="rolepro-toast">{message}</div>
        )}
      </div>
    </div>
  );
}
