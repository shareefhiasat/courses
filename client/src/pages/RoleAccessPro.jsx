import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Shield, Settings2, Check, X, Save, Search, ToggleLeft, ToggleRight } from 'lucide-react';
import Loading from '../components/Loading';

export default function RoleAccessPro() {
  const { user, isAdmin, isSuperAdmin, loading: authLoading } = useAuth();
  const { t } = useLang();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roleScreens, setRoleScreens] = useState({});
  const [message, setMessage] = useState('');
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

  const bulkSet = (role, value) => {
    const updates = {};
    screens.forEach(s => { updates[s.id] = !!value; });
    setRoleScreens(prev => ({
      ...prev,
      [role]: { ...(prev[role]||{}), ...updates }
    }));
  };

  if (authLoading) return <Loading fullscreen message={t('loading')} />;
  if (!(isSuperAdmin || isAdmin)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-10 text-center">
          <Shield className="w-14 h-14 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only admins can access this page.</p>
        </div>
      </div>
    );
  }
  if (loading) return <Loading fullscreen message={t('loading')} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-none mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 to-blue-600 p-6 md:p-8 shadow-[0_20px_60px_rgba(88,28,135,0.35)] ring-1 ring-white/20 mb-6">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center ring-4 ring-white/20">
                <Settings2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-white">Role Access</h1>
                <p className="text-white/80">Enable/disable screens per role</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2 shadow-inner">
                <Search className="w-4 h-4 text-white/80" />
                <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search screens..." className="bg-transparent placeholder-white/70 text-white outline-none w-48 md:w-64" />
              </div>
            </div>
          </div>
          <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full bg-white/15 blur-md" />
          <div className="absolute -bottom-16 -left-12 w-72 h-72 rounded-full bg-white/10 blur-md" />
        </div>

        {/* Roles header row */}
        <div className="hidden md:block sticky top-6 z-20 bg-white/80 backdrop-blur rounded-xl border border-white/60 shadow-md mb-3">
          <div className="px-6 py-3 grid grid-cols-1 md:grid-cols-5">
            <div className="col-span-1"></div>
            <div className="col-span-4">
              <div className="grid grid-cols-4 text-xs font-semibold text-gray-700 text-center">
                {roles.map(r => (
                  <div key={`hdr_${r}`} className="uppercase tracking-wide">{r}</div>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-4 gap-2 text-center">
                {roles.map(r => (
                  <div key={`bulk_${r}`} className="flex items-center justify-center gap-2">
                    <button onClick={()=>bulkSet(r,true)} className="px-2 py-1 text-[11px] rounded-md bg-emerald-500/20 text-emerald-700 hover:bg-emerald-500/30 shadow">Enable all</button>
                    <button onClick={()=>bulkSet(r,false)} className="px-2 py-1 text-[11px] rounded-md bg-rose-500/20 text-rose-700 hover:bg-rose-500/30 shadow">Disable all</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {filteredScreens.map(({ group, items }) => (
            <div key={group} className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="text-lg font-bold text-gray-900">{group}</div>
                <div className="text-xs text-gray-500">{items.length} screens</div>
              </div>
              <div className="divide-y divide-gray-100">
                {items.map((s, idx) => (
                  <div key={s.id} className={`px-6 py-4 flex flex-col md:flex-row md:items-center gap-4 ${idx%2? 'bg-gradient-to-r from-white to-slate-50':''} hover:bg-slate-50/80 transition-colors`}>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{s.name}</div>
                      <div className="text-xs font-mono text-gray-500">{s.id}</div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                      {roles.map(r => {
                        const on = !!(roleScreens[r]?.[s.id]);
                        return (
                          <div key={`${s.id}_${r}`} className="flex items-center justify-center">
                            <button
                              onClick={()=>toggleScreen(r, s.id)}
                              role="switch"
                              aria-checked={on}
                              className={`relative inline-flex h-8 w-16 items-center rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 ${on ? 'bg-emerald-500 shadow-inner' : 'bg-slate-300'}`}
                              title={`${r} toggle`}
                              style={{ WebkitTapHighlightColor: 'transparent' }}
                            >
                              <span className={`inline-block h-7 w-7 transform rounded-full bg-white shadow-md transition-transform ${on ? 'translate-x-8' : 'translate-x-1'}`}></span>
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

        <div className="fixed bottom-4 left-0 right-0 px-4">
          <div className="max-w-none mx-auto bg-white/90 backdrop-blur border border-gray-200 shadow-2xl rounded-xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-700"><Save className="w-4 h-4" /> <span>Make sure to save your changes</span></div>
            <button onClick={saveRoleScreens} disabled={saving} className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? (t('saving') || 'Saving...') : (t('save_role_access') || 'Save Role Access')}
            </button>
          </div>
        </div>

        {message && (
          <div className="fixed right-4 bottom-24 z-50 px-4 py-2 rounded-lg bg-emerald-500 text-white shadow-lg">{message}</div>
        )}
      </div>
    </div>
  );
}
