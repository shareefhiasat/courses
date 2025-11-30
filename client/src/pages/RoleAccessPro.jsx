import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Shield, Settings2, Save, Search } from 'lucide-react';
import { Container, Card, CardBody, Button, Input, Select, Badge, Spinner, useToast } from '../components/ui';
import styles from './RoleAccessPro.module.css';

export default function RoleAccessPro() {
  const { user, isAdmin, isSuperAdmin, loading: authLoading } = useAuth();
  const { t } = useLang();
  const toast = useToast();

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
    try {
      const docRef = doc(db, 'config', 'roleScreens');
      await setDoc(docRef, roleScreens);
      toast.success(t('role_access_updated') || 'Role access saved');
    } catch (e) {
      console.error(e);
      toast.error('Error saving role access');
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

  if (authLoading || loading) {
    return (
      <div className={styles.loadingWrapper}>
        <Spinner size="lg" />
      </div>
    );
  }
  
  if (!(isSuperAdmin || isAdmin)) {
    return (
      <Container maxWidth="md" className={styles.accessDenied}>
        <Card>
          <CardBody className={styles.accessDeniedContent}>
            <Shield size={56} className={styles.accessDeniedIcon} />
            <h2>Access Denied</h2>
            <p>Only admins can access this page.</p>
          </CardBody>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" className={styles.page}>
      <Card>
        <CardBody>
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <Settings2 size={32} className={styles.headerIcon} />
              <div>
                <h1 className={styles.title}>Role Access</h1>
                <p className={styles.subtitle}>Enable/disable screens per role</p>
              </div>
            </div>
            
            <div className={styles.controls}>
              <Input
                icon={<Search size={16} />}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search screens..."
                className={styles.searchInput}
              />
              
              <div className={styles.roleControls}>
                <Select
                  value={activeRole}
                  onChange={(e) => setActiveRole(e.target.value)}
                  label="Role"
                >
                  {roles.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </Select>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const allOn = {};
                    screens.forEach(s => allOn[s.id] = true);
                    setRoleScreens(p => ({ ...p, [activeRole]: { ...(p[activeRole] || {}), ...allOn } }));
                  }}
                >
                  Enable all
                </Button>
                
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    const allOff = {};
                    screens.forEach(s => allOff[s.id] = false);
                    setRoleScreens(p => ({ ...p, [activeRole]: { ...(p[activeRole] || {}), ...allOff } }));
                  }}
                >
                  Disable all
                </Button>
              </div>
            </div>
          </div>

          <div className={styles.groups}>
            {filteredScreens.map(({ group, items }) => (
              <div key={group} className={styles.group}>
                <div className={styles.groupHeader}>
                  <h3>{group}</h3>
                  <Badge variant="subtle">{items.length} screens</Badge>
                </div>
                
                {/* Role Header Row */}
                <div className={styles.screenRow} style={{ paddingTop: '.75rem', paddingBottom: '.75rem' }}>
                  <div className={styles.screenInfo}>
                    <div className={styles.screenName} style={{ opacity: .7 }}>Screen</div>
                  </div>
                  <div className={styles.roleToggles}>
                    {roles.map(r => (
                      <div key={`role-head-${r}`} style={{
                        minWidth: 64,
                        textTransform: 'capitalize',
                        fontSize: 12,
                        fontWeight: 600,
                        color: r === activeRole ? 'var(--color-primary, #800020)' : 'var(--text-muted, #666)'
                      }}>
                        {r}
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.screensList}>
                  {items.map((s, idx) => (
                    <div key={s.id} className={`${styles.screenRow} ${idx % 2 ? styles.alt : ''}`}>
                      <div className={styles.screenInfo}>
                        <div className={styles.screenName}>{s.name}</div>
                        <div className={styles.screenId}>{s.id}</div>
                      </div>
                      
                      <div className={styles.roleToggles}>
                        {roles.map(r => {
                          const on = !!(roleScreens[r]?.[s.id]);
                          return (
                            <button
                              key={`${s.id}_${r}`}
                              type="button"
                              onClick={(e) => { e.preventDefault(); toggleScreen(r, s.id); }}
                              role="switch"
                              aria-checked={on}
                              className={`${styles.toggle} ${on ? styles.toggleOn : styles.toggleOff}`}
                              title={`${r} toggle`}
                              style={r === activeRole ? { outline: '2px solid rgba(128,0,32,0.25)' } : undefined}
                            >
                              <span className={styles.toggleKnob} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.saveBar}>
            <div className={styles.saveBarContent}>
              <Save size={16} />
              <span>Make sure to save your changes</span>
            </div>
            <Button
              variant="primary"
              onClick={saveRoleScreens}
              disabled={saving}
              loading={saving}
            >
              {saving ? (t('saving') || 'Saving...') : (t('save_role_access') || 'Save Role Access')}
            </Button>
          </div>
        </CardBody>
      </Card>
    </Container>
  );
}
