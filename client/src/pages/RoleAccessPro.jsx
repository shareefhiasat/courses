import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Shield, Settings2, Save, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { Container, Card, CardBody, Button, Input, Select, Badge, Spinner, useToast, Loading } from '../components/ui';
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
  const [expandedGroups, setExpandedGroups] = useState({});

  const roles = ['admin', 'instructor', 'hr', 'student'];

  const screens = [
    // MAIN
    { id: 'home', name: 'Home', group: 'MAIN', description: 'Main landing page with activities and announcements' },
    { id: 'dashboard', name: 'Dashboard', group: 'MAIN', description: 'Admin dashboard for system overview' },
    { id: 'studentDashboard', name: 'Student Dashboard', group: 'MAIN', description: 'Student dashboard with progress and stats' },
    { id: 'studentProfile', name: 'Student Profile', group: 'MAIN', description: 'View and manage student profiles' },
    { id: 'activities', name: 'Activities', group: 'MAIN', description: 'Browse and complete learning activities' },
    { id: 'progress', name: 'Progress', group: 'MAIN', description: 'Track your learning progress' },
    { id: 'resources', name: 'Resources', group: 'MAIN', description: 'Access learning resources and materials' },
    // QUIZ
    { id: 'quizzes', name: 'Quizzes', group: 'QUIZ', description: 'Manage and take quizzes' },
    { id: 'quizManagement', name: 'Quiz Management', group: 'QUIZ', description: 'Manage and organize quizzes' },
    { id: 'quizBuilder', name: 'Quiz Builder', group: 'QUIZ', description: 'Create and edit quizzes' },
    { id: 'quizResults', name: 'Quiz Results', group: 'QUIZ', description: 'View quiz results and analytics' },
    { id: 'reviewResults', name: 'Review Results', group: 'QUIZ', description: 'Review and evaluate quiz, homework, training, and lab & project results' },
    // CLASSES
    { id: 'classSchedules', name: 'Class Schedule', group: 'CLASSES', description: 'View class schedules and timetables' },
    { id: 'manageEnrollments', name: 'Manage Enrollments', group: 'CLASSES', description: 'Manage student enrollments in classes' },
    { id: 'myEnrollments', name: 'My Enrollments', group: 'CLASSES', description: 'View your enrolled classes' },
    { id: 'enrollments', name: 'Enrollments', group: 'CLASSES', description: 'Manage student enrollments' },
    // ACADEMIC
    { id: 'programs', name: 'Programs', group: 'ACADEMIC', description: 'Manage academic programs' },
    { id: 'subjects', name: 'Subjects', group: 'ACADEMIC', description: 'Manage subjects within programs' },
    { id: 'classes', name: 'Classes', group: 'ACADEMIC', description: 'Manage classes for subjects' },
    { id: 'marksEntry', name: 'Marks Entry', group: 'ACADEMIC', description: 'Enter and manage student marks' },
    { id: 'courseProgress', name: 'Course Progress', group: 'ACADEMIC', description: 'View detailed course progress' },
    // ATTENDANCE
    { id: 'attendance', name: 'Attendance (Instructor)', group: 'ATTENDANCE', description: 'Take attendance for classes' },
    { id: 'manualAttendance', name: 'Manual Attendance', group: 'ATTENDANCE', description: 'Manually record attendance' },
    { id: 'hrAttendance', name: 'HR Attendance', group: 'ATTENDANCE', description: 'HR attendance tracking and management' },
    { id: 'myAttendance', name: 'My Attendance (Student)', group: 'ATTENDANCE', description: 'View your attendance records' },
    { id: 'hrPenalties', name: 'HR Penalties', group: 'ATTENDANCE', description: 'HR penalties management' },
    { id: 'instructorParticipation', name: 'Instructor Participation', group: 'ATTENDANCE', description: 'Track student participation (+1 points)' },
    { id: 'instructorBehavior', name: 'Instructor Behavior', group: 'ATTENDANCE', description: 'Track student behavior (-1 points)' },
    // ANALYTICS
    { id: 'analytics', name: 'Analytics', group: 'ANALYTICS', description: 'View system analytics and reports' },
    { id: 'advancedAnalytics', name: 'Advanced Analytics', group: 'ANALYTICS', description: 'Advanced analytics with custom widgets' },
    // COMMUNICATION
    { id: 'chat', name: 'Chat', group: 'COMMUNICATION', description: 'Communicate with students and instructors' },
    { id: 'scheduledReports', name: 'Scheduled Reports', group: 'COMMUNICATION', description: 'Schedule automated reports to be sent via email' },
    { id: 'smtpConfig', name: 'SMTP Config', group: 'COMMUNICATION', description: 'Configure SMTP settings for emails' },
    // COMMUNITY
    { id: 'notifications', name: 'Notifications', group: 'COMMUNITY', description: 'Manage your notifications' },
    // WORKSPACE SETTINGS
    { id: 'profile', name: 'Profile Settings', group: 'SETTINGS', description: 'Manage your profile and preferences' },
    { id: 'roleAccess', name: 'Role Access', group: 'SETTINGS', description: 'Manage role-based access control' },
  ];

  const defaultRoleScreens = {
    admin: { 
      home: true, dashboard: true, studentDashboard: true, studentProfile: true, activities: true, progress: true, resources: true,
      quizzes: true, quizManagement: true, quizBuilder: true, quizResults: true, reviewResults: true,
      classSchedules: true, manageEnrollments: true, myEnrollments: true, enrollments: true,
      programs: true, subjects: true, classes: true, marksEntry: true, courseProgress: true,
      attendance: true, manualAttendance: true, hrAttendance: true, myAttendance: false, hrPenalties: true, instructorParticipation: true, instructorBehavior: true,
      analytics: true, advancedAnalytics: true,
      chat: true, scheduledReports: true, smtpConfig: true,
      notifications: true,
      profile: true, roleAccess: true
    },
    instructor: { 
      home: true, dashboard: false, studentDashboard: false, studentProfile: true, activities: true, progress: false, resources: true,
      quizzes: true, quizManagement: true, quizBuilder: true, quizResults: true, reviewResults: false,
      classSchedules: true, manageEnrollments: true, myEnrollments: false, enrollments: false,
      programs: false, subjects: false, classes: false, marksEntry: true, courseProgress: false,
      attendance: true, manualAttendance: false, hrAttendance: false, myAttendance: false, hrPenalties: false, instructorParticipation: true, instructorBehavior: true,
      analytics: true, advancedAnalytics: false,
      chat: true, scheduledReports: false, smtpConfig: false,
      notifications: true,
      profile: true, roleAccess: false
    },
    hr: { 
      home: true, dashboard: false, studentDashboard: false, studentProfile: true, activities: false, progress: false, resources: false,
      quizzes: false, quizManagement: false, quizBuilder: false, quizResults: false, reviewResults: false,
      classSchedules: false, manageEnrollments: false, myEnrollments: false, enrollments: false,
      programs: false, subjects: false, classes: false, marksEntry: false, courseProgress: false,
      attendance: false, manualAttendance: false, hrAttendance: true, myAttendance: false, hrPenalties: true, instructorParticipation: false, instructorBehavior: false,
      analytics: true, advancedAnalytics: false,
      chat: false, scheduledReports: false, smtpConfig: false,
      notifications: true,
      profile: true, roleAccess: false
    },
    student: { 
      home: true, dashboard: false, studentDashboard: true, studentProfile: false, activities: true, progress: true, resources: true,
      quizzes: true, quizManagement: false, quizBuilder: false, quizResults: true, reviewResults: false,
      classSchedules: false, manageEnrollments: false, myEnrollments: true, enrollments: false,
      programs: false, subjects: false, classes: false, marksEntry: false, courseProgress: true,
      attendance: false, manualAttendance: false, hrAttendance: false, myAttendance: true, hrPenalties: false, instructorParticipation: false, instructorBehavior: false,
      analytics: false, advancedAnalytics: false,
      chat: true, scheduledReports: false, smtpConfig: false,
      notifications: true,
      profile: true, roleAccess: false
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
    return <Loading variant="overlay" fullscreen message={t('loading') || 'Loading role access...'} />;
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
      {isSuperAdmin && (
        <div style={{ 
          padding: '0.75rem 1rem', 
          marginBottom: '1rem', 
          background: 'rgba(128, 0, 32, 0.1)', 
          border: '1px solid rgba(128, 0, 32, 0.3)', 
          borderRadius: 8,
          fontSize: '0.875rem',
          color: 'var(--color-primary, #800020)'
        }}>
          <strong>Super Admin Note:</strong> Super admins bypass all role restrictions and have access to all screens regardless of these settings.
        </div>
      )}
      <Card>
        <CardBody>
          <div className={styles.header}>
            <div className={styles.headerContent} style={{ display: 'none' }}>
              <Settings2 size={32} className={styles.headerIcon} />
              {/* Title removed per user request */}
            </div>
            
            <div className={styles.controls}>
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search screens..."
                className={styles.searchInput}
              />
              
              <div className={styles.roleControls}>
                <Select
                  value={activeRole}
                  onChange={(e) => setActiveRole(e.target.value)}
                  label={t('role') || 'Role'}
                  options={roles.map(r => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1) }))}
                />
                
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
                <div 
                  className={styles.groupHeader}
                  onClick={() => setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }))}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {expandedGroups[group] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    <h3>{group}</h3>
                  </div>
                  <Badge variant="subtle" color="default" style={{ color: '#000' }}>{items.length} screens</Badge>
                </div>
                
                {expandedGroups[group] && (
                  <>
                    {/* Role Header Row */}
                    <div className={styles.screenRow} style={{ paddingTop: '.75rem', paddingBottom: '.75rem', background: 'var(--panel-hover, #f8f9fa)' }}>
                      <div className={styles.screenInfo} style={{ flex: 1, minWidth: 0 }}>
                        <div className={styles.screenName} style={{ opacity: .7, fontWeight: 600 }}>Screen</div>
                      </div>
                      <div className={styles.roleToggles} style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexShrink: 0 }}>
                        {roles.map(r => (
                          <div key={`role-head-${r}`} style={{
                            minWidth: 64,
                            textTransform: 'capitalize',
                            fontSize: 12,
                            fontWeight: 600,
                            color: r === activeRole ? 'var(--color-primary, #800020)' : 'var(--text-muted, #666)',
                            display: 'flex',
                            justifyContent: 'center'
                          }}>
                            {r}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className={styles.screensList}>
                      {items.map((s, idx) => (
                        <div key={s.id} className={`${styles.screenRow} ${idx % 2 ? styles.alt : ''}`}>
                          <div className={styles.screenInfo} style={{ flex: 1, minWidth: 0 }}>
                            <div className={styles.screenName}>{s.name}</div>
                            {s.description && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #666)', marginTop: '0.25rem' }}>
                                {s.description}
                              </div>
                            )}
                            <div className={styles.screenId}>{s.id}</div>
                          </div>
                          
                          <div className={styles.roleToggles} style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexShrink: 0 }}>
                            {roles.map(r => {
                              const on = !!(roleScreens[r]?.[s.id]);
                              return (
                                <div key={`${s.id}_${r}`} style={{ minWidth: 64, display: 'flex', justifyContent: 'center' }}>
                                  <button
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
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
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
