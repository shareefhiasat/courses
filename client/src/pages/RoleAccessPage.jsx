import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Shield, Check, X } from 'lucide-react';
import Loading from '../components/Loading';

const RoleAccessPage = () => {
  const { user, isAdmin, isSuperAdmin, loading: authLoading } = useAuth();
  const { t } = useLang();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roleScreens, setRoleScreens] = useState({});
  const [message, setMessage] = useState('');
  const [activeRole, setActiveRole] = useState('admin');
  const [q, setQ] = useState('');

  // Define available screens
  const screens = [
    { id: 'dashboard', name: 'Dashboard' },
    { id: 'activities', name: 'Activities' },
    { id: 'resources', name: 'Resources' },
    { id: 'classes', name: 'Classes' },
    { id: 'attendance', name: 'Attendance (Instructor)' },
    { id: 'myAttendance', name: 'My Attendance (Student)' },
    { id: 'hrAttendance', name: 'HR Attendance' },
    { id: 'analytics', name: 'Analytics' },
    { id: 'studentProfile', name: 'Student Profile' },
    { id: 'classSchedule', name: 'Class Schedule' },
    { id: 'manageEnrollments', name: 'Manage Enrollments' },
    { id: 'chat', name: 'Chat' },
    { id: 'leaderboard', name: 'Leaderboard' },
    { id: 'progress', name: 'Progress' },
    { id: 'enrollments', name: 'Enrollments' },
    { id: 'notifications', name: 'Notifications' },
    { id: 'profile', name: 'Profile Settings' },
  ];

  const roles = ['admin', 'instructor', 'hr', 'student'];

  const filteredScreens = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return screens;
    return screens.filter(s => s.name.toLowerCase().includes(term) || s.id.toLowerCase().includes(term));
  }, [q]);

  // Default role screens
  const defaultRoleScreens = {
    admin: {
      dashboard: true,
      activities: true,
      resources: true,
      classes: true,
      attendance: true,
      analytics: true,
      studentProfile: true,
      classSchedule: true,
      manageEnrollments: true,
      chat: true,
      leaderboard: true,
      progress: true,
      enrollments: true,
      notifications: true,
      profile: true,
      hrAttendance: true,
      myAttendance: false,
    },
    instructor: {
      dashboard: false,
      activities: true,
      resources: true,
      classes: true,
      attendance: true,
      analytics: true,
      studentProfile: true,
      classSchedule: true,
      manageEnrollments: true,
      chat: true,
      leaderboard: true,
      progress: true,
      enrollments: true,
      notifications: true,
      profile: true,
      hrAttendance: false,
      myAttendance: false,
    },
    hr: {
      dashboard: false,
      activities: false,
      resources: false,
      classes: true,
      attendance: false,
      analytics: true,
      studentProfile: true,
      classSchedule: false,
      manageEnrollments: false,
      chat: false,
      leaderboard: false,
      progress: false,
      enrollments: true,
      notifications: true,
      profile: true,
      hrAttendance: true,
      myAttendance: false,
    },
    student: {
      dashboard: false,
      activities: true,
      resources: true,
      classes: true,
      attendance: false,
      analytics: false,
      studentProfile: true,
      classSchedule: false,
      manageEnrollments: false,
      chat: true,
      leaderboard: true,
      progress: true,
      enrollments: true,
      notifications: true,
      profile: true,
      hrAttendance: false,
      myAttendance: true,
    },
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    loadRoleScreens();
  }, [authLoading, user]);

  const loadRoleScreens = async () => {
    try {
      const docRef = doc(db, 'config', 'roleScreens');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setRoleScreens(docSnap.data());
      } else {
        // Set defaults
        setRoleScreens(defaultRoleScreens);
      }
    } catch (error) {
      console.error('Error loading role screens:', error);
      setRoleScreens(defaultRoleScreens);
    } finally {
      setLoading(false);
    }
  };

  const toggleScreen = (role, screenId) => {
    setRoleScreens(prev => ({
      ...prev,
      [role]: {
        ...(prev[role] || {}),
        [screenId]: !(prev[role]?.[screenId] || false),
      },
    }));
  };

  const saveRoleScreens = async () => {
    setSaving(true);
    setMessage('');
    try {
      const docRef = doc(db, 'config', 'roleScreens');
      await setDoc(docRef, roleScreens);
      setMessage(t('role_access_updated'));
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving role screens:', error);
      setMessage('Error saving role access');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return <Loading fullscreen message={t('loading')} />;
  }

  if (!(isSuperAdmin || isAdmin)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Only admins can access this page.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <Loading fullscreen message={t('loading')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6 pb-28">
      <div className="max-w-none mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-4">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              {t('role_access')}
            </h1>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-3 mt-2">
            <p className="text-gray-600 dark:text-gray-300 flex-1">
              {t('enable_disable_screens')}
            </p>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 p-4 rounded-lg mb-6">
            {message}
          </div>
        )}

        {/* Roles toggles - full width */
        }
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <input
                value={q}
                onChange={(e)=>setQ(e.target.value)}
                placeholder="Search screens..."
                className="w-64 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">Role</label>
              <select
                value={activeRole}
                onChange={(e)=>setActiveRole(e.target.value)}
                className="px-2 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 capitalize"
              >
                {roles.map(r => (<option key={`role_${r}`} value={r} className="capitalize">{r}</option>))}
              </select>
              <button
                onClick={()=>{
                  const allOn = {}; filteredScreens.forEach(s=>{ allOn[s.id] = true; });
                  setRoleScreens(prev=>({ ...prev, [activeRole]: { ...(prev[activeRole]||{}), ...allOn } }));
                }}
                className="px-3 py-1.5 rounded-md text-sm bg-green-600 text-white hover:bg-green-700"
              >Enable all</button>
              <button
                onClick={()=>{
                  const allOff = {}; filteredScreens.forEach(s=>{ allOff[s.id] = false; });
                  setRoleScreens(prev=>({ ...prev, [activeRole]: { ...(prev[activeRole]||{}), ...allOff } }));
                }}
                className="px-3 py-1.5 rounded-md text-sm bg-red-600 text-white hover:bg-red-700"
              >Disable all</button>
            </div>
          </div>

          {/* Role titles header (always visible) */}
          <div className="flex items-center gap-4 px-6 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <div className="w-96 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Permission / Screen</div>
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {roles.map(r => (
                <div key={r} className="text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider capitalize">{r}</div>
              ))}
            </div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredScreens.map((screen, idx) => (
              <div key={screen.id} className={`flex flex-col md:flex-row items-start md:items-center gap-4 px-6 py-4 ${idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/50'}`}>
                <div className="w-full md:w-96">
                  <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{screen.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">{screen.id}</div>
                </div>
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                  {roles.map(r => {
                    const on = !!(roleScreens[r]?.[screen.id]);
                    return (
                      <div key={r} className="flex flex-col items-center gap-1">
                        <div className="text-xs text-gray-600 dark:text-gray-400 capitalize">{r}</div>
                        <button
                          onClick={()=>toggleScreen(r, screen.id)}
                          role="switch"
                          aria-checked={on}
                          className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 ${on ? 'bg-green-500 shadow-inner' : 'bg-gray-300 dark:bg-gray-600'}`}
                          title={`${r} toggle`}
                          style={{ WebkitTapHighlightColor: 'transparent' }}
                        >
                          <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform ${on ? 'translate-x-7' : 'translate-x-1'}`}></span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sticky Save Bar */}
        <div className="fixed bottom-4 left-0 right-0 px-4">
          <div className="max-w-none mx-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-xl p-3 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-300">Make sure to save your changes</div>
            <button
              onClick={saveRoleScreens}
              disabled={saving}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? t('saving') : t('save_role_access')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleAccessPage;
