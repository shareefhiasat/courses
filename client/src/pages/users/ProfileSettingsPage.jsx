import React, { useState, useEffect, useCallback, useRef, useLayoutEffect, useMemo } from 'react';
import { info, error, warn, debug } from '@services/utils/logger.js';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useTypography } from '@contexts/TypographyContext';
import { Navigate } from 'react-router-dom';
import { getUserProfile, updateUser } from '@services/business/userService';
import { getAllUserImages } from '@services/business/userImageService';
import { getThemedIcon, getUserRoleColor, getIconWithColor } from '@constants/iconTypes';
import { Container, Card, CardBody, Button, Input, Spinner, useToast, FontFamilyPicker, TextSizePicker } from '@ui';
import { GlobalLoadingFallback, useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { ToggleSwitch } from '@ui';
import Joyride from 'react-joyride';
import TourTooltip from '@ui/TourTooltip/TourTooltip';
import styles from './ProfileSettingsPage.module.css';
import { DEFAULT_ACCENT, normalizeHexColor, trySanitizeHexColor, adjustColor, hexToRgbString } from '@utils/color';
import { applyAccentColorGlobally } from '@utils/theme';
import useNotifications from '@hooks/useNotifications';
import notificationManager from '@utils/notifications';
import { ActivityLogger } from '@services/other/activityLogger';
import { useMobileDetect } from '@hooks/useMobileDetect';
import PortalTooltip from '@ui/PortalTooltip';
import UserImageUpload from '@components/ui/UserImageUpload/UserImageUpload';
import NotificationPreferencesSection from '@components/ui/NotificationPreferencesSection/NotificationPreferencesSection';

const ProfileSettingsPage = () => {
  const { user, loading: authLoading, isSuperAdmin, isAdmin, isInstructor, isHR, updateUserProfileImage } = useAuth();
  const { t, lang, toggleLang } = useLang();
  const { theme } = useTheme();
  const { fontLtr, fontRtl, setFontLtr, setFontRtl, saveTypographyToServer } = useTypography();
  const toast = useToast();
  const { startLoading } = useGlobalLoading();
  const {
    settings: notificationSettings,
    updateSetting,
    checkSupport
  } = useNotifications();
  const { isMobile: isMobileDevice } = useMobileDetect();
  
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

  // ── Guided Tour ──────────────────────────────────────────────────────────
  const [runTour, setRunTour] = useState(false);
  const [tourSteps, setTourSteps] = useState([]);
  const tourSeenKey = `profileTourSeen_${lang}`;

  const buildTourSteps = useCallback(() => [
    { target: '[data-tour="profile-personal-info"]', content: t('tour.profile_personal_info') || 'Update your personal details. Some fields like email and display name are managed by Keycloak.', disableBeacon: true, placement: 'bottom' },
    { target: '[data-tour="profile-arabic-names"]', content: t('tour.profile_arabic_names') || 'Enter your name in Arabic for bilingual display.', disableBeacon: true, placement: 'bottom' },
    { target: '[data-tour="profile-images"]', content: t('tour.profile_images') || 'Upload your profile photo, QID, and military ID images.', disableBeacon: true, placement: 'bottom' },
    { target: '[data-tour="profile-appearance"]', content: t('tour.profile_appearance') || 'Customize your accent color, language preference, and security settings.', disableBeacon: true, placement: 'bottom' },
    { target: '[data-tour="profile-notifications"]', content: t('tour.profile_notifications') || 'Configure notification channels, device alerts, and category preferences.', disableBeacon: true, placement: 'top' },
    { target: '[data-tour="profile-save"]', content: t('tour.profile_save') || 'Don\'t forget to save your changes when you\'re done.', disableBeacon: true, placement: 'top' },
  ].filter(s => !!document.querySelector(s.target)), [t]);

  const startTour = useCallback(() => {
    const steps = buildTourSteps();
    if (steps.length === 0) return;
    setTourSteps(steps);
    setRunTour(true);
  }, [buildTourSteps]);

  useEffect(() => {
    window.addEventListener('app:joyride', startTour);
    window.addEventListener('app:help', startTour);
    return () => { window.removeEventListener('app:joyride', startTour); window.removeEventListener('app:help', startTour); };
  }, [startTour]);

  useEffect(() => {
    try { if (!localStorage.getItem(tourSeenKey)) startTour(); } catch {}
  }, [tourSeenKey, startTour]);

  const handleTourCallback = useCallback((data) => {
    const { status, action } = data || {};
    if (status === 'finished' || status === 'skipped' || action === 'close') {
      setRunTour(false);
      try { localStorage.setItem(tourSeenKey, 'true'); } catch {}
    }
  }, [tourSeenKey]);
  const TourTooltipComponent = useMemo(() => TourTooltip({ tourSeenKey }), [tourSeenKey]);
  // ──────────────────────────────────────────────────────────────────────────

  // Callback handlers for image operations
  const handleImageUploadSuccess = useCallback((imageData) => {
    setUserImages(prev => ({
      ...prev,
      [imageData.type]: imageData.url
    }));
    if (imageData.type === 'profile' && imageData.url) {
      updateUserProfileImage(imageData.url);
    }
    toast.success(t('user_images.upload_success', 'Image uploaded successfully'));
  }, [t, toast, updateUserProfileImage]);

  const handleImageDeleteSuccess = useCallback((imageType) => {
    setUserImages(prev => ({
      ...prev,
      [imageType]: null
    }));
    if (imageType === 'profile') {
      updateUserProfileImage(null);
    }
    toast.success(t('user_images.delete_success', 'Image deleted successfully'));
  }, [t, toast, updateUserProfileImage]);

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
    if (!checkSupport().notification) {
      toast.error(t('notifications_browser_not_supported') || 'Your browser does not support notifications.');
      return;
    }
    if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
      toast.error(t('notifications_permission_denied') || 'Notification permission was denied. Please enable it in your browser settings.');
      return;
    }
    try {
      await notificationManager.smartNotification('default', t('profile_test_notification') || 'Test Notification', t('profile_test_notification_message') || 'This is a test notification.', {
        settings: {
          sound: notificationSettings.soundEnabled,
          vibration: notificationSettings.vibrationEnabled,
          browser: true
        }
      });
      toast.success(t('profile_test_notification_sent') || 'Test notification sent.');
    } catch (err) {
      error('Failed to send test notification:', err);
      toast.error(t('notifications_failed_to_send_test_notification') || 'Failed to send test notification.');
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
      });

      if (!updateResult?.success) {
        throw new Error(updateResult?.error || 'Failed to update profile');
      }

      if (notificationPrefsRef.current?.save) {
        await notificationPrefsRef.current.save({ silent: true });
      }

      try {
        await saveTypographyToServer();
      } catch (typographyErr) {
        warn('Failed to save typography preferences:', typographyErr);
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
  const deviceLabel = isMobileDevice ? t('mobile') : t('desktop');

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
        // Notification settings are loaded by useNotifications hook automatically
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
  }, [authLoading, user, startLoading]);

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
      <Joyride
        continuous
        run={runTour}
        steps={tourSteps}
        showSkipButton
        showProgress
        tooltipComponent={TourTooltipComponent}
        callback={handleTourCallback}
        locale={{
          back: t('tour_back') || (lang === 'ar' ? 'السابق' : 'Back'),
          close: t('tour_close') || (lang === 'ar' ? 'إغلاق' : 'Close'),
          last: t('tour_finish') || (lang === 'ar' ? 'إنهاء' : 'Finish'),
          next: t('tour_next') || (lang === 'ar' ? 'التالي' : 'Next'),
          skip: t('tour_skip') || (lang === 'ar' ? 'تخطي' : 'Skip')
        }}
        styles={{
          options: {
            primaryColor: 'var(--color-primary, #1e90ff)',
            textColor: theme === 'dark' ? '#e5e7eb' : '#000',
            backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
            overlayColor: 'rgba(0,0,0,0.5)'
          }
        }}
      />
      <div className={styles.content}>
        <Card data-tour="profile-personal-info">
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

              <div className={styles.formGridFull} data-tour="profile-arabic-names">
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

        <Card data-tour="profile-images">
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

        <Card data-tour="profile-appearance">
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

              <div className={styles.typographySection} data-tour="profile-typography">
                <h3 className={styles.sectionSubtitle}>
                  {getThemedIcon('ui', 'file_text', 18, theme)}
                  {t('profile_typography') || 'Typography'}
                </h3>
                <p className={styles.sectionHint}>
                  {t('profile_typography_hint') || 'Choose separate fonts for English and Arabic. Changes apply immediately; click Save to sync across devices.'}
                </p>
                <FontFamilyPicker
                  script="ltr"
                  value={fontLtr}
                  onChange={setFontLtr}
                  label={t('profile_font_english') || 'English font'}
                />
                <FontFamilyPicker
                  script="rtl"
                  value={fontRtl}
                  onChange={setFontRtl}
                  label={t('profile_font_arabic') || 'Arabic font'}
                />
                <TextSizePicker />
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

              </div>
            </div>
          </CardBody>
        </Card>

        <Card data-tour="profile-notifications">
          <CardBody>
            <div className={styles.cardHeader}>
              {getThemedIcon('ui', 'smartphone', 24, theme)}
              <h2>{t('profile_notifications')}</h2>
            </div>

            <div className={`${styles.formSection} ${styles.notificationsLayout}`}>
              {isMobileDevice && (
                <div className={styles.mobileBanner}>
                  {t('profile_mobile_device_detected')}
                </div>
              )}

              <div className={styles.notificationPanel}>
                <div className={styles.panelHeader}>
                  <span className={styles.panelTitle}>{t('profile_notification_channels') || 'Notification Channels'}</span>
                  <span className={styles.deviceBadge}>
                    {isMobileDevice
                      ? getThemedIcon('ui', 'smartphone', 12, theme)
                      : getThemedIcon('ui', 'monitor', 12, theme)}
                    {deviceLabel}
                  </span>
                </div>

                <div className={styles.channelGrid}>
                  {/* Sound */}
                  <PortalTooltip content={t('notifications_sound_enabled') || 'Sound Effects'} position="top">
                    <button
                      className={`${styles.channelBtn} ${notificationSettings.soundEnabled ? styles.channelActive : ''}`}
                      onClick={async () => {
                        const next = !notificationSettings.soundEnabled;
                        await updateSetting('soundEnabled', next);
                        if (next) notificationManager.playNotificationSound('default');
                        toast.success(next ? t('profile_sound_enabled') : t('profile_sound_disabled'));
                      }}
                    >
                      {getThemedIcon('ui', 'volume2', 22, notificationSettings.soundEnabled ? '#fff' : theme)}
                      <span className={styles.channelLabel}>{t('profile_sound_effects') || 'Sound'}</span>
                    </button>
                  </PortalTooltip>

                  {/* Vibration — only on mobile */}
                  {checkSupport().vibration && (
                    <PortalTooltip content={t('notifications_vibration_enabled') || 'Vibration'} position="top">
                      <button
                        className={`${styles.channelBtn} ${notificationSettings.vibrationEnabled ? styles.channelActive : ''}`}
                        onClick={async () => {
                          const next = !notificationSettings.vibrationEnabled;
                          await updateSetting('vibrationEnabled', next);
                          if (next) notificationManager.vibrate('default');
                          toast.success(next ? t('profile_vibration_enabled') : t('profile_vibration_disabled'));
                        }}
                      >
                        {getThemedIcon('ui', 'vibrate', 22, notificationSettings.vibrationEnabled ? '#fff' : theme)}
                        <span className={styles.channelLabel}>{t('profile_vibration') || 'Vibrate'}</span>
                      </button>
                    </PortalTooltip>
                  )}

                  {/* Browser notifications */}
                  {checkSupport().notification && (
                    <PortalTooltip content={t('notifications_browser_notifications') || 'Browser Notifications'} position="top">
                      <button
                        className={`${styles.channelBtn} ${notificationSettings.browserNotificationsEnabled ? styles.channelActive : ''}`}
                        onClick={async () => {
                          const next = !notificationSettings.browserNotificationsEnabled;
                          if (next && typeof Notification !== 'undefined' && Notification.permission === 'default') {
                            await Notification.requestPermission();
                          }
                          await updateSetting('browserNotificationsEnabled', next);
                          toast.success(next ? t('profile_browser_notifications_enabled') : t('profile_browser_notifications_disabled'));
                        }}
                      >
                        {getThemedIcon('ui', 'bell', 22, notificationSettings.browserNotificationsEnabled ? '#fff' : theme)}
                        <span className={styles.channelLabel}>{t('profile_browser_notifications') || 'Browser'}</span>
                      </button>
                    </PortalTooltip>
                  )}

                  {/* Test notification */}
                  <PortalTooltip content={t('notifications_test_browser_notification') || 'Test Browser Notification'} position="top">
                    <button
                      className={styles.channelBtn}
                      onClick={handleTestBrowserNotification}
                    >
                      {getThemedIcon('ui', 'test_tube', 22, theme)}
                      <span className={styles.channelLabel}>{t('profile_test_notification_button') || 'Test'}</span>
                    </button>
                  </PortalTooltip>
                </div>

                {/* Browser permission status */}
                {checkSupport().notification && (
                  <div className={styles.permissionHint}>
                    {typeof Notification !== 'undefined' && Notification.permission === 'granted'
                      ? `✓ ${t('profile_browser_notifications_enabled') || 'Browser notifications enabled'}`
                      : typeof Notification !== 'undefined' && Notification.permission === 'denied'
                        ? `⚠ ${t('notifications_permission_denied') || 'Permission denied — enable in browser settings'}`
                        : `ℹ ${t('profile_permission_description') || 'Click the bell icon to request permission'}`}
                  </div>
                )}
              </div>

              <div className={styles.notificationsDivider} />

              <NotificationPreferencesSection ref={notificationPrefsRef} embedded />
            </div>
          </CardBody>
        </Card>

        <div className={styles.actions} data-tour="profile-save">
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
