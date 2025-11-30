import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { Navigate } from 'react-router-dom';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { User, Mail, Phone, Hash, Palette, Save, Settings, Shield } from 'lucide-react';
import { Container, Card, CardBody, Button, Input, Spinner, useToast } from '../components/ui';
import styles from './ProfileSettingsPage.module.css';

const ProfileSettingsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { t, lang, toggleLang } = useLang();
  const toast = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: '',
    realName: '',
    studentNumber: '',
    phoneNumber: '',
    messageColor: '#8B5CF6',
    preferOTPLogin: false
  });

  useEffect(() => {
    if (!user?.uid) return;

    const loadProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfileData({
            displayName: data.displayName || user.displayName || '',
            realName: data.realName || '',
            studentNumber: data.studentNumber || '',
            phoneNumber: data.phoneNumber || '',
            messageColor: data.messageColor || '#8B5CF6',
            preferOTPLogin: data.preferOTPLogin || false
          });
        } else {
          setProfileData(prev => ({
            ...prev,
            displayName: user.displayName || ''
          }));
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
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: profileData.displayName,
        realName: profileData.realName,
        studentNumber: profileData.studentNumber,
        phoneNumber: profileData.phoneNumber,
        messageColor: profileData.messageColor,
        preferOTPLogin: profileData.preferOTPLogin
      });

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

  if (authLoading || loading) {
    return (
      <div className={styles.loadingWrapper}>
        <Spinner size="lg" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" />;

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

            <div className={styles.formSection}>
              <Input
                id="email"
                type="email"
                label={t('email')}
                value={user.email || ''}
                disabled
                icon={<Mail size={18} />}
                helperText={t('email_cannot_be_changed') || 'Email address cannot be changed'}
              />

              <Input
                id="displayName"
                type="text"
                label={t('display_name')}
                value={profileData.displayName}
                onChange={(e) => handleChange('displayName', e.target.value)}
                placeholder={t('display_name_placeholder') || 'Enter your display name'}
                icon={<User size={18} />}
              />

              <Input
                id="realName"
                type="text"
                label={t('real_name')}
                value={profileData.realName}
                onChange={(e) => handleChange('realName', e.target.value)}
                placeholder={t('real_name_placeholder')}
                icon={<User size={18} />}
              />

              <Input
                id="studentNumber"
                type="text"
                label={t('student_number')}
                value={profileData.studentNumber}
                onChange={(e) => handleChange('studentNumber', e.target.value)}
                placeholder={t('student_number_placeholder')}
                icon={<Hash size={18} />}
              />

              <Input
                id="phoneNumber"
                type="tel"
                label={t('phone_number')}
                value={profileData.phoneNumber}
                onChange={(e) => handleChange('phoneNumber', e.target.value)}
                placeholder={t('phone_number_placeholder') || 'Enter your phone number'}
                icon={<Phone size={18} />}
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
                      onClick={() => handleChange('messageColor', color)}
                      title={color}
                    />
                  ))}
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

export default ProfileSettingsPage;
