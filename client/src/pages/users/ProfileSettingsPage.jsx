import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { info, error, warn, debug } from '@services/utils/logger.js';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { Navigate } from 'react-router-dom';
import { getUserProfile, updateUser } from '@services/business/userService';
import { getAllUserImages } from '@services/business/userImageService';
import { getThemedIcon, getUserRoleColor, getIconWithColor } from '@constants/iconTypes';
import { Container, Card, CardBody, Button, Input, Spinner, useToast } from '@ui';
import { GlobalLoadingFallback, useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { ToggleSwitch } from '@ui';
import styles from './ProfileSettingsPage.module.css';
import { DEFAULT_ACCENT, normalizeHexColor, trySanitizeHexColor, adjustColor, hexToRgbString } from '@utils/color';
import { applyAccentColorGlobally } from '@utils/theme';
import useNotifications from '@hooks/useNotifications';
import notificationManager from '@utils/notifications';
import { ActivityLogger } from '@services/other/activityLogger';
import UserImageUpload from '@components/ui/UserImageUpload/UserImageUpload';
import NotificationPreferencesSection from '@components/ui/NotificationPreferencesSection/NotificationPreferencesSection';

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
    displayNameAr: '',
    firstNameAr: '',
    lastNameAr: '',
    studentNumber: '',
    phoneNumber: '',
    messageColor: DEFAULT_ACCENT,
    preferOTPLogin: false
  });
  const [customColorInput, setCustomColorInput] = useState(DEFAULT_ACCENT);
  const [userImages, setUserImages] = useState({
    profile: null,
    qid: null,
    military: null,
    additional: null
  });
  const [loadingImages, setLoadingImages] = useState(false);
  const notificationPrefsRef = useRef(null);

  // Callback handlers for image operations
  const handleImageUploadSuccess = useCallback((imageData) => {
    setUserImages(prev => ({
      ...prev,
      [imageData.type]: imageData.url
    }));
    toast.success(t('user_images.upload_success', 'Image uploaded successfully'));
  }, [t, toast]);

  const handleImageDeleteSuccess = useCallback((imageType) => {
    setUserImages(prev => ({
      ...prev,
      [imageType]: null
    }));
    toast.success(t('user_images.delete_success', 'Image deleted successfully'));
  }, [t, toast]);

  const handleImageError = useCallback((error) => {
    toast.error(error || t('user_images.upload_error', 'Failed to upload image'));
  }, [t, toast]);

  useEffect(() => {
    const profileUserId = user?.dbId ?? user?.uid;
    if (!profileUserId) return;

    const loadProfile = async () => {
      try {
        const userProfile = await getUserProfile(profileUserId);
        if (userProfile) {
          const resolvedColor = normalizeHexColor(userProfile.messageColor, DEFAULT_ACCENT);
          // Save to localStorage for ChatPage access
          localStorage.setItem('userMessageColor', resolvedColor);
          setProfileData({
            displayName: userProfile.displayName || user.displayName || '',
            realName: userProfile.realName || '',
            displayNameAr: userProfile.displayNameAr || '',
            firstNameAr: userProfile.firstNameAr || '',
            lastNameAr: userProfile.lastNameAr || '',
            studentNumber: userProfile.studentNumber || '',
            phoneNumber: userProfile.phoneNumber || '',
            messageColor: resolvedColor,
            preferOTPLogin: userProfile.preferOTPLogin || false
          });
          setCustomColorInput(resolvedColor);
          // Apply color on load
          applyAccentColorGlobally(resolvedColor);
        } else {
          // Fallback to Keycloak user data if API fails
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
      } catch (err) {
        // Fallback to Keycloak user data if API fails
        warn('Profile API failed, using Keycloak data:', err);
        const fallbackColor = normalizeHexColor(null, DEFAULT_ACCENT);
        setProfileData(prev => ({
          ...prev,
          displayName: user.displayName || '',
          messageColor: fallbackColor
        }));
        setCustomColorInput(fallbackColor);
        // Apply fallback color on load
        applyAccentColorGlobally(fallbackColor);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  // Load user images
  useEffect(() => {
    if (!user?.uid) return;

    const loadUserImages = async () => {
      setLoadingImages(true);
      try {
        const result = await getAllUserImages(user.uid);
        if (result.success && result.data?.images) {
          // Extract just the URL strings from the image objects
          const imageUrls = {};
          Object.keys(result.data.images).forEach(type => {
            imageUrls[type] = result.data.images[type]?.url || null;
          });
          setUserImages(imageUrls);
        }
      } catch (err) {
        error('Failed to load user images:', err);
      } finally {
        setLoadingImages(false);
      }
    };

    loadUserImages();
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
        toast.success(t('profile_test_notification_sent'));
      } catch (error) {
        error('Failed to send test notification:', error);
        toast.error(t('notifications_failed_to_send_test_notification'));
      }
    } else {
      toast.error(t('profile_browser_not_supported'));
    }
  };

  const handleSave = async () => {
    const profileUserId = user?.dbId ?? user?.uid;
    if (!profileUserId) return;

    setSaving(true);
    try {
      const normalizedColor = normalizeHexColor(profileData.messageColor, DEFAULT_ACCENT);
      const updateResult = await updateUser(profileUserId, {
        displayNameAr: profileData.displayNameAr || null,
        firstNameAr: profileData.firstNameAr || null,
        lastNameAr: profileData.lastNameAr || null,
        phoneNumber: profileData.phoneNumber,
        messageColor: normalizedColor,
        preferOTPLogin: profileData.preferOTPLogin
      });

      if (!updateResult?.success) {
        throw new Error(updateResult?.error || 'Failed to update profile');
      }

      if (notificationPrefsRef.current?.save) {
        await notificationPrefsRef.current.save({ silent: true });
      }

      try {
        await ActivityLogger.profileUpdate();
      } catch (logError) {
        warn('Failed to log profile update activity:', logError);
      }

      applyAccentColorGlobally(normalizedColor);
      toast.success(t('profile_updated'));
    } catch (err) {
      error('Error updating profile:', err);
      toast.error(t('error_updating_profile'));
    } finally {
      setSaving(false);
    }
  };

  const statusLabel = (enabled) => (enabled ? t('enabled') : t('disabled'));
  const deviceLabel = isMobile() ? t('mobile') : t('desktop');

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
          initializeNotifications()
        ]);
      } catch (err) {
        console.error('Error loading profile data:', err);
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

  const keycloakHelperStyle = { color: '#F59E0B' };

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

  const renderRoleBadge = (role, labelKey) => {
    const color = getUserRoleColor(role);
    return (
      <span
        className={styles.roleBadge}
        style={{ color, borderColor: color, background: `${color}20` }}
      >
        {getIconWithColor('user_role', role, 14, color)}
        {t(labelKey)}
      </span>
    );
  };

  return (
    <Container maxWidth="lg" className={styles.page}>
      <div className={styles.content}>
        <Card>
          <CardBody>
            <div className={styles.cardHeader}>
              {getThemedIcon('ui', 'user', 24, theme)}
              <h2>{t('profile_personal_information')}</h2>
            </div>

            <div className={styles.roleBar}>
              <div className={styles.roleList}>
                {isSuperAdmin && renderRoleBadge('super_admin', 'profile_super_admin')}
                {isAdmin && !isSuperAdmin && renderRoleBadge('admin', 'profile_admin')}
                {isInstructor && renderRoleBadge('instructor', 'profile_instructor')}
                {isHR && renderRoleBadge('hr', 'profile_hr')}
                {!isSuperAdmin && !isAdmin && !isInstructor && !isHR && renderRoleBadge('student', 'profile_student')}
              </div>
            </div>

            <div className={styles.formGrid}>
              <Input
                id="email"
                type="email"
                label={t('email')}
                value={user.email || ''}
                disabled
                helperText={t('profile_email_managed_by_keycloak')}
                helperTextStyle={keycloakHelperStyle}
              />

              <Input
                id="displayName"
                type="text"
                label={t('display_name')}
                value={user.displayName || ''}
                disabled
                helperText={t('profile_display_name_managed_by_keycloak')}
                helperTextStyle={keycloakHelperStyle}
                maxLength={100}
              />

              <Input
                id="realName"
                type="text"
                label={t('real_name')}
                value={`${user.firstName || ''} ${user.lastName || ''}`.trim() || ''}
                disabled
                helperText={t('profile_real_name_managed_by_keycloak')}
                helperTextStyle={keycloakHelperStyle}
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
                description={t('student_number_readonly')}
              />

              <Input
                id="phoneNumber"
                type="tel"
                label={t('phone_number')}
                value={profileData.phoneNumber}
                onChange={(e) => handleChange('phoneNumber', e.target.value)}
                placeholder={t('phone_number_placeholder')}
                maxLength={100}
              />

              <div className={styles.formGridFull}>
                <h3 className={styles.sectionHeading}>{t('arabic_name_section')}</h3>
                <p className={styles.sectionHint}>{t('arabic_name_helper')}</p>
              </div>

              <Input
                id="displayNameAr"
                type="text"
                label={t('display_name_ar')}
                value={profileData.displayNameAr}
                onChange={(e) => handleChange('displayNameAr', e.target.value)}
                placeholder={t('display_name_ar_placeholder')}
                maxLength={100}
                dir="rtl"
              />

              <Input
                id="firstNameAr"
                type="text"
                label={t('first_name_ar')}
                value={profileData.firstNameAr}
                onChange={(e) => handleChange('firstNameAr', e.target.value)}
                placeholder={t('first_name_ar_placeholder')}
                maxLength={100}
                dir="rtl"
              />

              <Input
                id="lastNameAr"
                type="text"
                label={t('last_name_ar')}
                value={profileData.lastNameAr}
                onChange={(e) => handleChange('lastNameAr', e.target.value)}
                placeholder={t('last_name_ar_placeholder')}
                maxLength={100}
                dir="rtl"
              />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className={styles.cardHeader}>
              {getThemedIcon('ui', 'image', 24, theme)}
              <h2>{t('user_images.title', 'User Images')}</h2>
            </div>

            <div className={styles.formSection}>
              <p className={styles.helpText} style={{ marginBottom: '1rem' }}>
                {t('user_images.description', 'Upload your profile photo, QID/ID card, and military ID. Maximum file size: 5MB. Allowed formats: JPEG, PNG, PDF.')}
              </p>

              <div className={styles.imageGrid}>
                <UserImageUpload
                  userId={user?.uid}
                  imageType="profile"
                  currentImageUrl={userImages.profile}
                  editable={true}
                  onUploadSuccess={handleImageUploadSuccess}
                  onDeleteSuccess={handleImageDeleteSuccess}
                  onError={handleImageError}
                />

                <UserImageUpload
                  userId={user?.uid}
                  imageType="qid"
                  currentImageUrl={userImages.qid}
                  editable={true}
                  onUploadSuccess={handleImageUploadSuccess}
                  onDeleteSuccess={handleImageDeleteSuccess}
                  onError={handleImageError}
                />

                <UserImageUpload
                  userId={user?.uid}
                  imageType="military"
                  currentImageUrl={userImages.military}
                  editable={true}
                  onUploadSuccess={handleImageUploadSuccess}
                  onDeleteSuccess={handleImageDeleteSuccess}
                  onError={handleImageError}
                />
              </div>
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
              <div className={styles.appearanceRow}>
                <div className={styles.appearanceToggle}>
                  <span className={styles.appearanceToggleLabel}>
                    {getThemedIcon('ui', 'globe', 18, theme)}
                    {t('profile_language')}
                  </span>
                  <ToggleSwitch
                    checked={lang === 'ar'}
                    onChange={() => toggleLang()}
                  />
                </div>

                <div className={styles.appearanceToggle}>
                  <span className={styles.appearanceToggleLabel}>
                    {getThemedIcon('ui', 'shield', 18, theme)}
                    {t('profile_prefer_otp_login')}
                  </span>
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
              <h2>{t('profile_notifications')}</h2>
            </div>

            <div className={`${styles.formSection} ${styles.notificationsLayout}`}>
              {isMobile() && (
                <div className={styles.mobileBanner}>
                  {t('profile_mobile_device_detected')}
                </div>
              )}

              {!notificationSettings.permissionsRequested && (
                <div className={styles.permissionBlock}>
                  <Button
                    variant="primary"
                    onClick={async () => {
                      await initializeNotifications();
                      toast.success(t('profile_permissions_requested'));
                    }}
                    disabled={notificationsInitializing}
                    loading={notificationsInitializing}
                    icon={getThemedIcon('ui', 'settings', 16, theme)}
                  >
                    {notificationsInitializing
                      ? t('profile_requesting')
                      : t('profile_enable_notifications')}
                  </Button>
                  <p className={styles.helpText}>
                    {t('profile_permission_description')}
                  </p>
                </div>
              )}

              <div className={styles.notificationsTopGrid}>
                <div className={styles.notificationPanel}>
                  <div className={styles.panelHeader}>
                    <span className={styles.panelTitle}>{t('profile_device_alerts')}</span>
                    <span className={styles.deviceBadge}>
                      {isMobile()
                        ? getThemedIcon('ui', 'smartphone', 12, theme)
                        : getThemedIcon('ui', 'monitor', 12, theme)}
                      {deviceLabel}
                    </span>
                  </div>

                  <div className={styles.settingList}>
                    <div className={styles.settingRow}>
                      <div className={styles.settingInfo}>
                        {getThemedIcon('ui', 'volume2', 18, theme)}
                        <div className={styles.settingText}>
                          <div className={styles.settingLabel}>{t('profile_sound_effects')}</div>
                          <div className={styles.settingStatus}>
                            {statusLabel(notificationSettings.soundEnabled)}
                          </div>
                        </div>
                      </div>
                      <div className={styles.settingActions}>
                        <ToggleSwitch
                          checked={notificationSettings.soundEnabled}
                          onChange={async (checked) => {
                            const success = await updateSetting('soundEnabled', checked);
                            if (success) {
                              toast.success(checked ? t('profile_sound_enabled') : t('profile_sound_disabled'));
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
                            title={t('profile_test_sound')}
                          >
                            {getThemedIcon('ui', 'volume2', 14, theme)}
                          </Button>
                        )}
                      </div>
                    </div>

                    {checkSupport().vibration && (
                      <div className={styles.settingRow}>
                        <div className={styles.settingInfo}>
                          {getThemedIcon('ui', 'vibrate', 18, theme)}
                          <div className={styles.settingText}>
                            <div className={styles.settingLabel}>{t('profile_vibration')}</div>
                            <div className={styles.settingStatus}>
                              {statusLabel(notificationSettings.vibrationEnabled)}
                            </div>
                          </div>
                        </div>
                        <div className={styles.settingActions}>
                          <ToggleSwitch
                            checked={notificationSettings.vibrationEnabled}
                            onChange={async (checked) => {
                              const success = await updateSetting('vibrationEnabled', checked);
                              if (success) {
                                toast.success(checked ? t('profile_vibration_enabled') : t('profile_vibration_disabled'));
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
                              title={t('profile_test_vibration')}
                            >
                              {getThemedIcon('ui', 'vibrate', 14, theme)}
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {checkSupport().notification && (
                      <div className={styles.settingRow}>
                        <div className={styles.settingInfo}>
                          {getThemedIcon('ui', 'bell', 18, theme)}
                          <div className={styles.settingText}>
                            <div className={styles.settingLabel}>{t('profile_browser_notifications')}</div>
                            <div className={styles.settingStatus}>
                              {statusLabel(notificationSettings.browserNotificationsEnabled)}
                            </div>
                          </div>
                        </div>
                        <div className={styles.settingActions}>
                          <ToggleSwitch
                            checked={notificationSettings.browserNotificationsEnabled}
                            onChange={async (checked) => {
                              const success = await updateSetting('browserNotificationsEnabled', checked);
                              if (success) {
                                toast.success(
                                  checked
                                    ? t('profile_browser_notifications_enabled')
                                    : t('profile_browser_notifications_disabled')
                                );
                              }
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleTestBrowserNotification}
                            title={t('profile_test_notification_button')}
                          >
                            {getThemedIcon('ui', 'test_tube', 14, theme)}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.notificationPanel}>
                  <div className={styles.panelHeader}>
                    <span className={styles.panelTitle}>{t('profile_supported_features')}</span>
                    <span className={styles.deviceBadge}>
                      {isMobile()
                        ? getThemedIcon('ui', 'smartphone', 12, theme)
                        : getThemedIcon('ui', 'monitor', 12, theme)}
                      {deviceLabel}
                    </span>
                  </div>

                  <div className={styles.settingList}>
                    {[
                      { icon: 'volume2', label: t('profile_sound_effects'), supported: checkSupport().audio },
                      { icon: 'bell', label: t('profile_browser_notifications'), supported: checkSupport().notification },
                      { icon: 'vibrate', label: t('profile_vibration'), supported: checkSupport().vibration },
                      { icon: 'settings', label: t('profile_service_worker'), supported: checkSupport().serviceWorker }
                    ].map((feature) => (
                      <div
                        key={feature.icon}
                        className={`${styles.capabilityRow} ${feature.supported ? styles.supported : styles.unsupported}`}
                      >
                        <span className={styles.capabilityLabel}>
                          {getThemedIcon('ui', feature.icon, 16, theme)}
                          {feature.label}
                        </span>
                        <span className={`${styles.capabilityIcon} ${feature.supported ? styles.supported : styles.unsupported}`}>
                          {feature.supported ? '✓' : '✗'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.notificationsDivider} />

              <NotificationPreferencesSection ref={notificationPrefsRef} embedded />
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
            {saving ? t('saving') : t('profile_save_changes')}
          </Button>
        </div>
      </div>
    </Container>
  );
};

// Accent color is applied globally via applyAccentColorGlobally from utils/theme

export default ProfileSettingsPage;
