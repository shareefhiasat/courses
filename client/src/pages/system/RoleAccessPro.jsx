import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { db } from '@services/other/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Container, Card, CardBody, Button, Input, Select, Badge, Spinner, useToast, Loading } from '@ui';
import { USER_ROLES } from '@constants/userRoles';
import { getAllLocalizedScreens } from '@constants/screenDefinitions';
import { getThemedIcon } from '@constants/iconTypes';
import { NOTIFICATION_CHANNELS, NOTIFICATION_TRIGGERS, SCREEN_NOTIFICATION_MAPPING } from '@constants/notificationTypes';
import styles from './RoleAccessPro.module.css';

export default function RoleAccessPro() {
  const { user, isAdmin, isSuperAdmin, loading: authLoading } = useAuth();
  const { t, lang } = useLang();
  const theme = 'light'; // Hook into actual theme if available, otherwise default
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roleScreens, setRoleScreens] = useState({});
  const [notificationSettings, setNotificationSettings] = useState({});
  const [message, setMessage] = useState('');
  const [activeRole, setActiveRole] = useState(USER_ROLES.ADMIN);
  const [q, setQ] = useState('');
  const [expandedGroups, setExpandedGroups] = useState({});
  const [expandedNotifications, setExpandedNotifications] = useState({});

  const roles = [USER_ROLES.ADMIN, USER_ROLES.INSTRUCTOR, USER_ROLES.HR, USER_ROLES.STUDENT];

  // Get localized screens from centralized definitions
  const screens = getAllLocalizedScreens(t);

  const defaultRoleScreens = {
    admin: { 
      home: true, dashboard: true, studentDashboard: true, studentProfile: true, activities: true, resources: true,
      quizzes: true, quizManagement: true, quizBuilder: true, quizResults: true, reviewResults: true,
      classSchedules: true, manageEnrollments: true, myEnrollments: true, enrollments: true,
      programs: true, subjects: true, classes: true, marksEntry: true, courseProgress: true,
      attendance: true, hrAttendance: true, myAttendance: false, hrPenalties: true, instructorParticipation: true, instructorBehavior: true,
      analytics: true, advancedAnalytics: true,
      chat: true, scheduledReports: true, smtpConfig: true,
      notifications: true,
      profile: true, roleAccess: true
    },
    instructor: { 
      home: true, dashboard: false, studentDashboard: false, studentProfile: true, activities: true, resources: true,
      quizzes: true, quizManagement: true, quizBuilder: true, quizResults: true, reviewResults: false,
      classSchedules: true, manageEnrollments: true, myEnrollments: false, enrollments: false,
      programs: false, subjects: false, classes: false, marksEntry: true, courseProgress: false,
      attendance: true, hrAttendance: false, myAttendance: false, hrPenalties: false, instructorParticipation: true, instructorBehavior: true,
      analytics: true, advancedAnalytics: false,
      chat: true, scheduledReports: false, smtpConfig: false,
      notifications: true,
      profile: true, roleAccess: false
    },
    hr: { 
      home: true, dashboard: false, studentDashboard: false, studentProfile: true, activities: false, resources: false,
      quizzes: false, quizManagement: false, quizBuilder: false, quizResults: false, reviewResults: false,
      classSchedules: false, manageEnrollments: false, myEnrollments: false, enrollments: false,
      programs: false, subjects: false, classes: false, marksEntry: false, courseProgress: false,
      attendance: false, hrAttendance: true, myAttendance: false, hrPenalties: true, instructorParticipation: false, instructorBehavior: false,
      analytics: true, advancedAnalytics: false,
      chat: false, scheduledReports: false, smtpConfig: false,
      notifications: true,
      profile: true, roleAccess: false
    },
    student: { 
      home: true, dashboard: false, studentDashboard: true, studentProfile: false, activities: true, resources: true,
      quizzes: true, quizManagement: false, quizBuilder: false, quizResults: true, reviewResults: false,
      classSchedules: false, manageEnrollments: false, myEnrollments: true, enrollments: false,
      programs: false, subjects: false, classes: false, marksEntry: false, courseProgress: true,
      attendance: false, hrAttendance: false, myAttendance: true, hrPenalties: false, instructorParticipation: false, instructorBehavior: false,
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

      // Load notification settings
      const notifyRef = doc(db, 'config', 'notificationSettings');
      const notifySnap = await getDoc(notifyRef);
      if (notifySnap.exists()) setNotificationSettings(notifySnap.data());
      else setNotificationSettings({});
    } catch (e) {
      logger.error(e);
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
      
      const notifyRef = doc(db, 'config', 'notificationSettings');
      await setDoc(notifyRef, notificationSettings);
      
      toast.success(t('role_access_updated') || 'Role access and notification settings saved');
    } catch (e) {
      logger.error(e);
      toast.error('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleNotification = (role, trigger, channel) => {
    setNotificationSettings(prev => ({
      ...prev,
      [role]: {
        ...(prev[role] || {}),
        [trigger]: {
          ...(prev[role]?.[trigger] || { web: false, email: false, sms: false, whatsapp: false }),
          [channel]: !(prev[role]?.[trigger]?.[channel] || false)
        }
      }
    }));
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
            {getThemedIcon('ui', 'shield', 56, theme)}
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
          <strong>{t('super_admin_note') || 'Super Admin Note'}:</strong> {t('super_admin_bypass_note') || 'Super admins bypass all role restrictions and have access to all screens regardless of these settings.'}
        </div>
      )}
      <Card>
        <CardBody>
          <div className={styles.header}>
            <div className={styles.headerContent} style={{ display: 'none' }}>
              {getThemedIcon('ui', 'settings', 32, theme)}
              {/* Title removed per user request */}
            </div>
            
            <div className={styles.controls}>
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('search_screens') || 'Search screens...'}
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
                    {expandedGroups[group] ? getThemedIcon('ui', 'chevron_down', 18, theme) : getThemedIcon('ui', 'chevron_right', 18, theme)}
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
                            {items.map((s, idx) => {
                              const triggers = SCREEN_NOTIFICATION_MAPPING[s.id] || [];
                              const isExpanded = expandedNotifications[`${activeRole}_${s.id}`];

                              return (
                                <React.Fragment key={s.id}>
                                  <div className={`${styles.screenRow} ${idx % 2 ? styles.alt : ''}`}>
                                    <div className={styles.screenInfo} style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div className={styles.screenName}>{s.name}</div>
                                        {triggers.length > 0 && (
                                          <Button
                                            variant="ghost"
                                            size="xs"
                                            onClick={() => setExpandedNotifications(prev => ({ ...prev, [`${activeRole}_${s.id}`]: !isExpanded }))}
                                            style={{ padding: '2px', height: 'auto' }}
                                            title={t('configure_notifications') || 'Configure Notifications'}
                                          >
                                            {getThemedIcon('ui', 'bell', 14, theme)}
                                          </Button>
                                        )}
                                      </div>
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

                                  {/* Notification Sub-menu */}
                                  {isExpanded && triggers.length > 0 && (
                                    <div className={styles.notificationSubMenu} style={{ 
                                      padding: '0.75rem 1rem 0.75rem 2.5rem', 
                                      background: 'var(--panel-bg-alt, #f0f0f0)',
                                      borderBottom: '1px solid var(--border-color, #eee)'
                                    }}>
                                      <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-primary, #800020)' }}>
                                        {t('notification_settings_for') || 'Notification Settings for'} {s.name}
                                      </div>
                                      <table style={{ width: '100%', fontSize: '0.75rem' }}>
                                        <thead>
                                          <tr style={{ textAlign: 'left', opacity: 0.7 }}>
                                            <th style={{ padding: '4px' }}>{t('trigger') || 'Trigger'}</th>
                                            <th style={{ padding: '4px', textAlign: 'center' }}>{t('web') || 'Web'}</th>
                                            <th style={{ padding: '4px', textAlign: 'center' }}>{t('email') || 'Email'}</th>
                                            <th style={{ padding: '4px', textAlign: 'center' }}>{t('sms') || 'SMS'}</th>
                                            <th style={{ padding: '4px', textAlign: 'center' }}>{t('whatsapp') || 'WhatsApp'}</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {triggers.map(trigger => (
                                            <tr key={trigger}>
                                              <td style={{ padding: '4px' }}>{t(trigger) || trigger.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                                              {Object.values(NOTIFICATION_CHANNELS).map(channel => {
                                                const isActive = !!notificationSettings[activeRole]?.[trigger]?.[channel];
                                                return (
                                                  <td key={channel} style={{ padding: '4px', textAlign: 'center' }}>
                                                    <input 
                                                      type="checkbox" 
                                                      checked={isActive}
                                                      onChange={() => toggleNotification(activeRole, trigger, channel)}
                                                      disabled={channel === NOTIFICATION_CHANNELS.SMS || channel === NOTIFICATION_CHANNELS.WHATSAPP}
                                                      title={channel === NOTIFICATION_CHANNELS.SMS || channel === NOTIFICATION_CHANNELS.WHATSAPP ? 'Coming Soon' : channel}
                                                    />
                                                  </td>
                                                );
                                              })}
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className={styles.saveBar}>
            <div className={styles.saveBarContent}>
              {getThemedIcon('ui', 'save', 16, theme)}
              <span>{t('make_sure_to_save_changes') || 'Make sure to save your changes'}</span>
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

