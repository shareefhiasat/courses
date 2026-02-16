import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { db } from '@services/other/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Container, Card, CardBody, Button, Input, Select, Badge, useToast } from '@ui';
import { GlobalLoadingFallback } from '@/contexts/GlobalLoadingContext';
import { USER_ROLES } from '@constants/userRoles';
import { getAllLocalizedScreens, SCREEN_GROUPS } from '@constants/screenDefinitions';
import { getThemedIcon } from '@constants/iconTypes';
import { NOTIFICATION_CHANNELS, NOTIFICATION_TRIGGERS, SCREEN_NOTIFICATION_MAPPING } from '@constants/notificationTypes';
import logger from '@utils/logger';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [accessFilter, setAccessFilter] = useState('all'); // 'all', 'enabled', 'disabled'
  const [expandedGroups, setExpandedGroups] = useState({});
  const [expandedNotifications, setExpandedNotifications] = useState({});
  
  // Lazy loaded notification settings
  const [loadedNotificationSettings, setLoadedNotificationSettings] = useState(new Set());
  
  // Refs for debouncing
  const searchTimeoutRef = useRef(null);
  const previousRoleScreensRef = useRef({});

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
      profile: true, roleAccess: false
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

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Track changes for save button state
  const hasChanges = useMemo(() => {
    const current = JSON.stringify(roleScreens);
    const previous = JSON.stringify(previousRoleScreensRef.current);
    return current !== previous;
  }, [roleScreens]);

  // Update previous state when saved
  useEffect(() => {
    if (!saving) {
      previousRoleScreensRef.current = { ...roleScreens };
    }
  }, [saving, roleScreens]);

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

  const loadNotificationSettings = useCallback(async (screenId) => {
    const key = `${activeRole}_${screenId}`;
    if (loadedNotificationSettings.has(key)) return;
    
    try {
      // Simulate loading or fetch from API if needed
      // For now, we'll just mark it as loaded
      setLoadedNotificationSettings(prev => new Set([...prev, key]));
    } catch (error) {
      logger.error('Error loading notification settings:', error);
    }
  }, [activeRole, loadedNotificationSettings]);

  const toggleScreen = (role, id) => {
    setRoleScreens(prev => ({
      ...prev,
      [role]: { ...(prev[role]||{}), [id]: !(prev[role]?.[id]||false) }
    }));
  };

  const filteredScreens = useMemo(() => {
    let filtered = screens;
    
    // Group filter
    if (selectedGroup !== 'all') {
      filtered = filtered.filter(s => s.group === selectedGroup);
    }
    
    // Search filter (using debounced query)
    if (debouncedSearchQuery.trim()) {
      const term = debouncedSearchQuery.trim().toLowerCase();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(term) || 
        s.id.toLowerCase().includes(term) ||
        (s.description && s.description.toLowerCase().includes(term))
      );
    }
    
    // Access filter
    if (accessFilter !== 'all') {
      filtered = filtered.filter(s => {
        const hasAccess = !!(roleScreens[activeRole]?.[s.id]);
        return accessFilter === 'enabled' ? hasAccess : !hasAccess;
      });
    }
    
    // Group by category
    const groups = filtered.reduce((acc, s) => { 
      (acc[s.group] ||= []).push(s); 
      return acc; 
    }, {});
    
    return Object.entries(groups).map(([group, items]) => ({ 
      group: t(group) || group.charAt(0).toUpperCase() + group.slice(1).toLowerCase(), // Capitalize first letter only
      items: items.sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically
    }));
  }, [screens, selectedGroup, debouncedSearchQuery, accessFilter, activeRole, roleScreens, t]);

  if (authLoading || loading) {
    return <GlobalLoadingFallback />;
  }
  
  if (!(isSuperAdmin)) {
    return (
      <Container maxWidth="md" className={styles.accessDenied}>
        <Card>
          <CardBody className={styles.accessDeniedContent}>
            {getThemedIcon('ui', 'shield', 56, theme)}
            <h2>Access Denied</h2>
            <p>Only super admins can access this page.</p>
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search_screens') || 'Search screens...'}
                className={styles.searchInput}
              />
              
              <div className={styles.filterControls}>
                <Select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  label={t('category') || 'Category'}
                  options={[
                    { value: 'all', label: t('all_categories') || 'All categories' },
                    ...Object.values(SCREEN_GROUPS).map(group => ({
                      value: group,
                      label: t(group) || group.charAt(0).toUpperCase() + group.slice(1).toLowerCase()
                    }))
                  ]}
                />
                
                <Select
                  value={accessFilter}
                  onChange={(e) => setAccessFilter(e.target.value)}
                  label={t('access_filter') || 'Access Filter'}
                  options={[
                    { value: 'all', label: t('all_screens') || 'All Screens' },
                    { value: 'enabled', label: t('enabled_only') || 'Enabled Only' },
                    { value: 'disabled', label: t('disabled_only') || 'Disabled Only' }
                  ]}
                />
              </div>
              
              <div className={styles.roleControls}>
                <Select
                  value={activeRole}
                  onChange={(e) => setActiveRole(e.target.value)}
                  label={t('select_role_to_configure') || 'Select role to configure'}
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
                  {t('enable_all') || 'Enable all'}
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
                  {t('disable_all') || 'Disable all'}
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
                    <div className={styles.screenRow} style={{ paddingTop: '.5rem', paddingBottom: '.5rem', background: 'var(--panel-hover, #f8f9fa)' }}>
                      <div className={styles.screenInfo} style={{ flex: 1, minWidth: 0 }}>
                        {/* Screen label removed */}
                      </div>
                      <div className={styles.roleToggles} style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexShrink: 0 }}>
                        {roles.map(r => (
                          <div key={`role-head-${r}`} style={{
                            minWidth: 64,
                            textTransform: 'capitalize',
                            fontSize: 12,
                            fontWeight: 600,
                            color: r === activeRole ? 'var(--color-primary, #800020)' : 'var(--text-muted, #666)',
                            display: 'none' // Hide role labels
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
                                            onClick={() => {
                                              const key = `${activeRole}_${s.id}`;
                                              setExpandedNotifications(prev => ({ ...prev, [key]: !prev[key] }));
                                              if (!expandedNotifications[key]) {
                                                loadNotificationSettings(s.id);
                                              }
                                            }}
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
              disabled={saving || !hasChanges}
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

