import React, { useState, useEffect, useCallback, useMemo, useLayoutEffect } from 'react';
import logger from '@utils/logger';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { Navigate } from 'react-router-dom';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@services/other/config';
import { getUserProfile, getUserDisplayName } from '@services/business/userService';
import { getThemedIcon } from '@constants/iconTypes';
import { Container, Card, CardBody, Button, Input, Spinner, useToast } from '@ui';
import { GlobalLoadingFallback, useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { ToggleSwitch } from '@ui';
import styles from './ProfileSettingsPage.module.css';
import { DEFAULT_ACCENT, normalizeHexColor, trySanitizeHexColor, adjustColor, hexToRgbString } from '@utils/color';
import { applyAccentColorGlobally } from '@utils/theme';
import useNotifications from '@hooks/useNotifications';
import notificationManager from '@utils/notifications';
import { ActivityLogger } from '@services/other/activityLogger';

const ProfileSettingsPage = () => {
  const { user, loading: authLoading, isSuperAdmin, isAdmin, isInstructor, isHR } = useAuth();
  const { t, lang, toggleLang } = useLang();
  const { theme } = useTheme();
  const toast = useToast();
  const { startLoading } = useGlobalLoading();
  const { 
    settings: notificationSettings, 
    isInitializing: notificationsInitializing,
    initializeNotifications,
    updateSetting,
    checkSupport,
    isMobile
  } = useNotifications();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: '',
    realName: '',
    studentNumber: '',
    phoneNumber: '',
    messageColor: DEFAULT_ACCENT,
    preferOTPLogin: false
  });
  const [customColorInput, setCustomColorInput] = useState(DEFAULT_ACCENT);

  useEffect(() => {
    if (!user?.uid) return;

    const loadProfile = async () => {
      try {
        const userProfile = await getUserProfile(user);
        if (userProfile) {
          const resolvedColor = normalizeHexColor(userProfile.messageColor, DEFAULT_ACCENT);
          // Save to localStorage for ChatPage access
          localStorage.setItem('userMessageColor', resolvedColor);
          setProfileData({
            displayName: userProfile.displayName || user.displayName || '',
            realName: userProfile.realName || '',
            studentNumber: userProfile.studentNumber || '',
            phoneNumber: userProfile.phoneNumber || '',
            messageColor: resolvedColor,
            preferOTPLogin: userProfile.preferOTPLogin || false
          });
          setCustomColorInput(resolvedColor);
          // Apply color on load
          applyAccentColorGlobally(resolvedColor);
        } else {
          const fallbackColor = normalizeHexColor(null, DEFAULT_ACCENT);
          setProfileData(prev => ({
            ...prev,
            displayName: user.displayName || '',
            messageColor: fallbackColor
          }));
          setCustomColorInput(fallbackColor);
          // Apply fallback color on load
          applyAccentColorGlobally(fallbackColor);
        }
      } catch (error) {
        logger.error('Error loading profile:', error);
        toast.error(t('error_loading_profile') || 'Error loading profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleTestBrowserNotification = async () => {
    if (checkSupport().notification) {
      try {
        notificationManager.smartNotification('default', t('profile_test_notification'), t('profile_test_notification_message'), {
            settings: {
              sound: notificationSettings.soundEnabled,
              vibration: notificationSettings.vibrationEnabled,
              browser: notificationSettings.browserNotificationsEnabled
            }
          });
        toast.success(t('test_notification_sent') || 'Test notification sent');
      } catch (error) {
        logger.error('Failed to send test notification:', error);
        toast.error(t('failed_to_send_test_notification') || 'Failed to send test notification');
      }
    } else {
      toast.error(t('browser_notifications_not_supported') || 'Browser notifications not supported');
    }
  };

  const handleSave = async () => {
    if (!user?.uid) return;

    setSaving(true);
    try {
      const normalizedColor = normalizeHexColor(profileData.messageColor, DEFAULT_ACCENT);
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: profileData.displayName,
        realName: profileData.realName,
        phoneNumber: profileData.phoneNumber,
        messageColor: normalizedColor,
        preferOTPLogin: profileData.preferOTPLogin
      });

      // Log profile update activity
      try {
        await ActivityLogger.profileUpdate();
      } catch (error) {
        logger.warn('Failed to log profile update activity:', error);
      }

      // Apply color globally immediately
      applyAccentColorGlobally(normalizedColor);
      
      toast.success(t('profile_updated') || 'Profile updated successfully');
    } catch (error) {
      logger.error('Error updating profile:', error);
      toast.error(t('error_updating_profile') || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  useEffect(() => {
    setCustomColorInput(normalizeHexColor(profileData.messageColor, DEFAULT_ACCENT));
  }, [profileData.messageColor]);

  // Use GlobalLoading for initial data load
  useLayoutEffect(() => {
    if (authLoading) return;
    if (!user) return;

    let stopped = false;
    const stopGlobalLoading = startLoading();
    const safeStop = () => {
      if (stopped) return;
      stopped = true;
      stopGlobalLoading();
    };

    const loadData = async () => {
      try {
        await Promise.all([
          loadUserProfile(),
          initializeNotifications()
        ]);
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        safeStop();
      }
    };

    loadData();

    return () => {
      safeStop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, initializeNotifications, startLoading]);

  if (!user) return <Navigate to="/login" />;

  const handleCustomColorInput = (value) => {
    setCustomColorInput(value);
    const normalized = trySanitizeHexColor(value);
    if (normalized) {
      handleChange('messageColor', normalized);
      // Save to localStorage for ChatPage access
      localStorage.setItem('userMessageColor', normalized);
    }
  };

  const handleColorSelection = (value) => {
    const normalized = normalizeHexColor(value, DEFAULT_ACCENT);
    handleChange('messageColor', normalized);
    // Save to localStorage for ChatPage access
    localStorage.setItem('userMessageColor', normalized);
    // Apply color immediately for preview
    applyAccentColorGlobally(normalized);
  };

  const colorOptions = [
    '#8B5CF6', // Purple
    '#800020', // Blue
    '#10B981', // Green
    '#F59E0B', // Orange
    '#EF4444', // Red
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#6366F1', // Indigo
  ];

  return (
    <Container maxWidth="lg" className={styles.page}>
      <div className={styles.content}>
        <Card>
          <CardBody>
            <div className={styles.cardHeader}>
              {getThemedIcon('ui', 'user', 24, theme)}
              <h2>{t('profile_personal_information')}</h2>
            </div>

            {/* Role Display */}
            <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>{t('profile_your_role')}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                {isSuperAdmin && (
                  <span style={{ color: '#f59e0b', border: '1.5px solid #f59e0b', background: 'rgba(245, 158, 11, 0.1)', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 700, padding: '4px 12px', borderRadius: 999 }}>
                    {getThemedIcon('user_role', 'super_admin', 14, theme)} {t('profile_super_admin')}
                  </span>
                )}
                {isAdmin && !isSuperAdmin && (
                  <span style={{ color: '#4f46e5', border: '1.5px solid #4f46e5', background: 'rgba(79, 70, 229, 0.1)', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 700, padding: '4px 12px', borderRadius: 999 }}>
                    {getThemedIcon('user_role', 'admin', 14, theme)} {t('profile_admin')}
                  </span>
                )}
                {isInstructor && (
                  <span style={{ color: '#0ea5e9', border: '1.5px solid #0ea5e9', background: 'rgba(14, 165, 233, 0.1)', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 700, padding: '4px 12px', borderRadius: 999 }}>
                    {getThemedIcon('user_role', 'instructor', 14, theme)} {t('profile_instructor')}
                  </span>
                )}
                {isHR && (
                  <span style={{ color: '#8b5cf6', border: '1.5px solid #8b5cf6', background: 'rgba(139, 92, 246, 0.1)', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 700, padding: '4px 12px', borderRadius: 999 }}>
                    {getThemedIcon('user_role', 'hr', 14, theme)} {t('profile_hr')}
                  </span>
                )}
                {!isSuperAdmin && !isAdmin && !isInstructor && !isHR && (
                  <span style={{ color: '#16a34a', border: '1.5px solid #16a34a', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 700, padding: '4px 12px', borderRadius: 999 }}>{t('profile_student')}</span>
                )}
              </div>
            </div>

            <div className={styles.formSection}>
              <Input
                id="email"
                type="email"
                label={t('email')}
                value={user.email || ''}
                disabled
                helperText={t('email_cannot_be_changed') || 'Email address cannot be changed'}
              />

              <Input
                id="displayName"
                type="text"
                label={t('display_name')}
                value={profileData.displayName}
                onChange={(e) => handleChange('displayName', e.target.value)}
                placeholder={t('display_name_placeholder') || 'Enter your display name'}
                maxLength={100}
              />

              <Input
                id="realName"
                type="text"
                label={t('real_name')}
                value={profileData.realName}
                onChange={(e) => handleChange('realName', e.target.value)}
                placeholder={t('real_name_placeholder')}
                maxLength={100}
              />

              <Input
                id="studentNumber"
                type="text"
                label={t('student_number')}
                value={profileData.studentNumber}
                disabled
                placeholder={t('student_number_placeholder')}
                maxLength={100}
                description={t('student_number_readonly') || 'Student number cannot be changed here. Contact administrator if you need to update it.'}
              />

              <Input
                id="phoneNumber"
                type="tel"
                label={t('phone_number')}
                value={profileData.phoneNumber}
                onChange={(e) => handleChange('phoneNumber', e.target.value)}
                placeholder={t('phone_number_placeholder') || 'Enter your phone number'}
                maxLength={100}
              />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className={styles.cardHeader}>
              {getThemedIcon('ui', 'palette', 24, theme)}
              <h2>{t('appearance') || 'Appearance'}</h2>
            </div>

            <div className={styles.formSection}>
              {/* Theme Color Selection */}

              <div className={styles.colorSelectionArea}>
                  <div className={styles.colorPicker}>
                    {colorOptions.map(color => (
                      <button
                        key={color}
                        className={`${styles.colorOption} ${profileData.messageColor === color ? styles.selected : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => handleColorSelection(color)}
                        title={color}
                      />
                    ))}
                  </div>

                  <div className={styles.customColorSection}>
                    <div className={styles.customColorHeader}>
                      <div className={styles.customColorInputs}>
                        <div className={styles.colorPickerWrapper}>
                          <input
                            type="color"
                            className={styles.nativeColorInput}
                            value={normalizeHexColor(customColorInput || profileData.messageColor, DEFAULT_ACCENT)}
                            onChange={(e) => handleColorSelection(e.target.value)}
                          />
                        </div>
                        <div className={styles.hexInputWrapper}>
                          <Input
                            label={t('hex') || 'HEX'}
                            value={customColorInput}
                            onChange={(e) => handleCustomColorInput(e.target.value)}
                            placeholder="#667EEA"
                            size="small"
                            maxLength={100}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              {/* Compact Settings Row */}
              <div style={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                padding: '1rem 0',
                borderTop: '1px solid #e5e7eb',
                marginTop: '1rem'
              }}>
                {/* Language Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {getThemedIcon('ui', 'globe', 18, theme)}
                  <ToggleSwitch
                    checked={lang === 'ar'}
                    onChange={() => toggleLang()}
                  />
                </div>

                {/* OTP Login Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {getThemedIcon('ui', 'shield', 18, theme)}
                  <ToggleSwitch
                    checked={profileData.preferOTPLogin}
                    onChange={(checked) => handleChange('preferOTPLogin', checked)}
                  />
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className={styles.cardHeader}>
              {getThemedIcon('ui', 'smartphone', 24, theme)}
              <h2>{t('notifications') || 'Notifications'}</h2>
            </div>

            <div className={styles.formSection}>
              {/* Mobile Detection Info */}
              {isMobile() && (
                <div style={{ 
                  marginBottom: '1rem', 
                  padding: '0.75rem', 
                  background: '#e0f2fe', 
                  borderRadius: 8, 
                  border: '1px solid #0ea5e9',
                  fontSize: '0.875rem',
                  color: '#0369a1'
                }}>
                  📱 {t('mobile_device_detected') || 'Mobile device detected - Notification sounds and vibration will work even when screen is off'}
                </div>
              )}

              {/* Permission Status */}
              {!notificationSettings.permissionsRequested && (
                <div style={{ marginBottom: '1rem' }}>
                  <Button
                    variant="primary"
                    onClick={async () => {
                      await initializeNotifications();
                      toast.success(t('permissions_requested') || 'Notification permissions requested');
                    }}
                    disabled={notificationsInitializing}
                    loading={notificationsInitializing}
                    icon={getThemedIcon('ui', 'settings', 16, theme)}
                  >
                    {notificationsInitializing 
                      ? (t('requesting') || 'Requesting...') 
                      : (t('enable_notifications') || 'Enable Notifications')
                    }
                  </Button>
                  <p className={styles.helpText} style={{ marginTop: '0.5rem' }}>
                    {t('permission_description') || 'Enable notifications to receive alerts with sound and vibration even when your phone is asleep.'}
                  </p>
                </div>
              )}

              {/* Compact Notification Settings Row */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '2rem',
                marginBottom: '1rem',
                padding: '1rem',
                background: '#f9fafb',
                borderRadius: 8,
                border: '1px solid #e5e7eb'
              }}>
                {/* Sound Setting */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {getThemedIcon('ui', 'volume2', 18, theme)}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <ToggleSwitch
                        checked={notificationSettings.soundEnabled}
                        onChange={async (checked) => {
                          const success = await updateSetting('soundEnabled', checked);
                          if (success) {
                            toast.success(checked 
                              ? (t('sound_enabled') || 'Sound enabled') 
                              : (t('sound_disabled') || 'Sound disabled'));
                          }
                        }}
                      />
                      {notificationSettings.soundEnabled && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            import('@utils/notifications').then(({ default: nm }) => {
                              nm.playNotificationSound('default');
                            });
                          }}
                          title={t('test_sound') || 'Test Sound'}
                        >
                          {getThemedIcon('ui', 'volume2', 16, theme)}
                        </Button>
                      )}
                    </div>
                  </div>

                {/* Vibration Setting */}
                {checkSupport().vibration && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {getThemedIcon('ui', 'vibrate', 18, theme)}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <ToggleSwitch
                        checked={notificationSettings.vibrationEnabled}
                        onChange={async (checked) => {
                          const success = await updateSetting('vibrationEnabled', checked);
                          if (success) {
                            toast.success(checked 
                              ? (t('vibration_enabled') || 'Vibration enabled') 
                              : (t('vibration_disabled') || 'Vibration disabled'));
                          }
                        }}
                      />
                      {notificationSettings.vibrationEnabled && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            import('@utils/notifications').then(({ default: nm }) => {
                              nm.vibrate('default');
                            });
                          }}
                          title={t('test_vibration') || 'Test Vibration'}
                        >
                          {getThemedIcon('ui', 'vibrate', 16, theme)}
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Browser Notifications Setting */}
                {checkSupport().notification && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {getThemedIcon('ui', 'bell', 18, theme)}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <ToggleSwitch
                        checked={notificationSettings.browserNotificationsEnabled}
                        onChange={async (checked) => {
                          const success = await updateSetting('browserNotificationsEnabled', checked);
                          if (success) {
                            toast.success(checked 
                              ? (t('browser_notifications_enabled') || 'Browser notifications enabled') 
                              : (t('browser_notifications_disabled') || 'Browser notifications disabled'));
                          }
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleTestBrowserNotification}
                        title={t('test_browser_notification') || 'Test Browser Notification'}
                      >
                        {getThemedIcon('ui', 'test_tube', 16, theme)}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Support Info */}
              <div style={{ 
                padding: '0.75rem', 
                background: '#f9fafb', 
                borderRadius: 8, 
                border: '1px solid #e5e7eb',
                fontSize: '0.875rem',
                color: '#6b7280'
              }}>
                <div style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{t('supported_features') || 'Supported Features'}</span>
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                    {isMobile() ? <>{getThemedIcon('ui', 'smartphone', 14, theme)} Mobile</> : <>{getThemedIcon('ui', 'monitor', 14, theme)} Desktop</>}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                  <div>{getThemedIcon('ui', 'volume2', 16, theme)}{t('audio_notifications') || 'Audio'}: {checkSupport().audio ? '✅' : '❌'}</div>
                  <div>{getThemedIcon('ui', 'vibrate', 16, theme)}{t('vibration') || 'Vibration'}: {checkSupport().vibration ? '✅' : '❌'}</div>
                  <div>{getThemedIcon('ui', 'bell', 16, theme)}{t('browser_notifications') || 'Browser'}: {checkSupport().notification ? '✅' : '❌'}</div>
                  <div>{getThemedIcon('ui', 'settings', 16, theme)}{t('service_worker') || 'Service Worker'}: {checkSupport().serviceWorker ? '✅' : '❌'}</div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <div className={styles.actions}>
          <Button
            variant="primary"
            size="lg"
            icon={getThemedIcon('ui', 'save', 20, theme)}
            onClick={handleSave}
            disabled={saving}
            loading={saving}
          >
            {saving ? t('saving') : t('save_changes')}
          </Button>
        </div>
      </div>
    </Container>
  );
};

// Accent color is applied globally via applyAccentColorGlobally from utils/theme

export default ProfileSettingsPage;
