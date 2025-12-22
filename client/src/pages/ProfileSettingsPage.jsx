import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { Navigate } from 'react-router-dom';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { User, Mail, Phone, Hash, Palette, Save, Settings, Shield } from 'lucide-react';
import { Container, Card, CardBody, Button, Input, Spinner, useToast } from '../components/ui';
import styles from './ProfileSettingsPage.module.css';
import { DEFAULT_ACCENT, normalizeHexColor, trySanitizeHexColor, adjustColor, hexToRgbString } from '../utils/color';

const ProfileSettingsPage = () => {
  const { user, loading: authLoading, isSuperAdmin, isAdmin, isInstructor, isHR } = useAuth();
  const { t, lang, toggleLang } = useLang();
  const toast = useToast();
  
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
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const resolvedColor = normalizeHexColor(data.messageColor, DEFAULT_ACCENT);
          setProfileData({
            displayName: data.displayName || user.displayName || '',
            realName: data.realName || '',
            studentNumber: data.studentNumber || '',
            phoneNumber: data.phoneNumber || '',
            messageColor: resolvedColor,
            preferOTPLogin: data.preferOTPLogin || false
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
        console.error('Error loading profile:', error);
        toast.error(t('error_loading_profile') || 'Error loading profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user?.uid) return;

    setSaving(true);
    try {
      const normalizedColor = normalizeHexColor(profileData.messageColor, DEFAULT_ACCENT);
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: profileData.displayName,
        realName: profileData.realName,
        studentNumber: profileData.studentNumber,
        phoneNumber: profileData.phoneNumber,
        messageColor: normalizedColor,
        preferOTPLogin: profileData.preferOTPLogin
      });

      // Apply color globally immediately
      applyAccentColorGlobally(normalizedColor);
      
      toast.success(t('profile_updated') || 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
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

  if (authLoading || loading) {
    return (
      <div className={styles.loadingWrapper}>
        <Spinner size="lg" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" />;

  const handleCustomColorInput = (value) => {
    setCustomColorInput(value);
    const normalized = trySanitizeHexColor(value);
    if (normalized) {
      handleChange('messageColor', normalized);
    }
  };

  const handleColorSelection = (value) => {
    const normalized = normalizeHexColor(value, DEFAULT_ACCENT);
    handleChange('messageColor', normalized);
    // Apply color immediately for preview
    applyAccentColorGlobally(normalized);
  };

  const colorOptions = [
    '#8B5CF6', // Purple
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Orange
    '#EF4444', // Red
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#6366F1', // Indigo
  ];

  return (
    <Container maxWidth="lg" className={styles.page}>
      <div className={styles.header}>
        <Settings size={32} className={styles.headerIcon} />
        <div>
          <h1 className={styles.title}>{t('profile_settings')}</h1>
          <p className={styles.subtitle}>{t('manage_your_profile') || 'Manage your profile and preferences'}</p>
        </div>
      </div>

      <div className={styles.content}>
        <Card>
          <CardBody>
            <div className={styles.cardHeader}>
              <User size={24} />
              <h2>{t('personal_information') || 'Personal Information'}</h2>
            </div>

            {/* Role Display */}
            <div style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem', background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Your Role</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                {isSuperAdmin && (
                  <span style={{ color: '#f59e0b', border: '1.5px solid #f59e0b', background: 'rgba(245, 158, 11, 0.1)', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 700, padding: '4px 12px', borderRadius: 999 }}>
                    <Shield size={14} /> Super Admin
                  </span>
                )}
                {isAdmin && !isSuperAdmin && (
                  <span style={{ color: '#4f46e5', border: '1.5px solid #4f46e5', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 700, padding: '4px 12px', borderRadius: 999 }}>Admin</span>
                )}
                {isInstructor && (
                  <span style={{ color: '#0ea5e9', border: '1.5px solid #0ea5e9', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 700, padding: '4px 12px', borderRadius: 999 }}>Instructor</span>
                )}
                {isHR && (
                  <span style={{ color: '#8b5cf6', border: '1.5px solid #8b5cf6', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 700, padding: '4px 12px', borderRadius: 999 }}>HR</span>
                )}
                {!isSuperAdmin && !isAdmin && !isInstructor && !isHR && (
                  <span style={{ color: '#16a34a', border: '1.5px solid #16a34a', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 700, padding: '4px 12px', borderRadius: 999 }}>Student</span>
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
              />

              <Input
                id="realName"
                type="text"
                label={t('real_name')}
                value={profileData.realName}
                onChange={(e) => handleChange('realName', e.target.value)}
                placeholder={t('real_name_placeholder')}
              />

              <Input
                id="studentNumber"
                type="text"
                label={t('student_number')}
                value={profileData.studentNumber}
                onChange={(e) => handleChange('studentNumber', e.target.value)}
                placeholder={t('student_number_placeholder')}
              />

              <Input
                id="phoneNumber"
                type="tel"
                label={t('phone_number')}
                value={profileData.phoneNumber}
                onChange={(e) => handleChange('phoneNumber', e.target.value)}
                placeholder={t('phone_number_placeholder') || 'Enter your phone number'}
              />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className={styles.cardHeader}>
              <Palette size={24} />
              <h2>{t('appearance') || 'Appearance'}</h2>
            </div>

            <div className={styles.formSection}>
              <div className={styles.formGroup}>
                <label>{t('message_color')}</label>
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
                <div className={styles.customColorControls}>
                  <div className={styles.customColorRow}>
                    <label htmlFor="customAccent" className={styles.customColorLabel}>
                      {t('custom_accent_color') || 'Custom Accent Color'}
                    </label>
                    <div className={styles.customColorInputs}>
                      <input
                        id="customAccent"
                        type="color"
                        className={styles.nativeColorInput}
                        value={normalizeHexColor(customColorInput || profileData.messageColor, DEFAULT_ACCENT)}
                        onChange={(e) => handleColorSelection(e.target.value)}
                      />
                      <Input
                        label="HEX"
                        value={customColorInput}
                        onChange={(e) => handleCustomColorInput(e.target.value)}
                        placeholder="#667EEA"
                        size="small"
                        fullWidth
                      />
                    </div>
                    <p className={styles.colorNote}>
                      {t('accent_color_description') || 'This accent updates chat bubbles and the primary interface color.'}
                    </p>
                  </div>
                </div>
                <div className={styles.colorPreview}>
                  <div className={styles.previewLabel}>{t('preview')}:</div>
                  <div 
                    className={styles.messageBubble}
                    style={{ backgroundColor: profileData.messageColor }}
                  >
                    {t('sample_message') || 'This is how your messages will look'}
                  </div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>{t('language')}</label>
                <Button
                  variant="outline"
                  onClick={toggleLang}
                  className={styles.languageToggle}
                >
                  <span>🌐</span>
                  {lang === 'en' ? 'English' : 'العربية'}
                  <span className={styles.toggleHint}>
                    {t('click_to_switch') || 'Click to switch'}
                  </span>
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className={styles.cardHeader}>
              <Shield size={24} />
              <h2>{t('security') || 'Security'}</h2>
            </div>

            <div className={styles.formSection}>
              <div className={styles.formGroup}>
                <label>
                  <Shield size={18} />
                  {t('otp_login') || 'OTP Login'}
                </label>
                <Button
                  variant={profileData.preferOTPLogin ? 'primary' : 'outline'}
                  onClick={() => handleChange('preferOTPLogin', !profileData.preferOTPLogin)}
                  className={styles.otpToggle}
                >
                  {profileData.preferOTPLogin ? (t('enabled') || 'Enabled') : (t('disabled') || 'Disabled')}
                </Button>
                <p className={styles.helpText}>
                  {t('otp_login_description') || 'When enabled, you can request a one-time password via email for login instead of using your regular password. More secure and convenient.'}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <div className={styles.actions}>
          <Button
            variant="primary"
            size="lg"
            icon={<Save size={20} />}
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

// Apply accent color globally to all components
const applyAccentColorGlobally = (color) => {
  if (typeof document === 'undefined') return;
  const accent = normalizeHexColor(color, DEFAULT_ACCENT);
  const root = document.documentElement;
  root.style.setProperty('--color-primary', accent);
  root.style.setProperty('--color-primary-light', adjustColor(accent, 15));
  root.style.setProperty('--color-primary-dark', adjustColor(accent, -15));
  root.style.setProperty('--color-primary-rgb', hexToRgbString(accent));
  root.style.setProperty('--input-focus', accent);
  // Apply to navbar and other components
  root.style.setProperty('--navbar-bg', accent);
  root.style.setProperty('--accent-color', accent);
  // Dispatch event for other components to react
  window.dispatchEvent(new CustomEvent('accent-color-changed', { detail: { color: accent } }));
};

export default ProfileSettingsPage;
