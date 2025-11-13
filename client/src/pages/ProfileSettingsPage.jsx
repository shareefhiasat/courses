import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { Navigate } from 'react-router-dom';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { User, Mail, Phone, Hash, Palette, Save, Settings, Shield } from 'lucide-react';
import Loading from '../components/Loading';
import { useToast } from '../components/ToastProvider';
import './ProfileSettingsPage.css';

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
        toast?.error?.(t('error_loading_profile') || 'Error loading profile');
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

      toast?.success?.(t('profile_updated') || 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast?.error?.(t('error_updating_profile') || 'Error updating profile');
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

  if (authLoading || loading) return <Loading />;
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
    <div className="profile-settings-page">
      <div className="profile-header">
        <div className="header-content">
          <div className="header-icon">
            <Settings size={32} />
          </div>
          <div>
            <h1>{t('profile_settings')}</h1>
            <p>{t('manage_your_profile') || 'Manage your profile and preferences'}</p>
          </div>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <div className="card-header">
            <User size={24} />
            <h2>{t('personal_information') || 'Personal Information'}</h2>
          </div>

          <div className="form-section">
            <div className="form-group">
              <label htmlFor="email">
                <Mail size={18} />
                {t('email')}
              </label>
              <input
                id="email"
                type="email"
                value={user.email || ''}
                disabled
                className="input-disabled"
              />
              <small className="help-text">
                {t('email_cannot_be_changed') || 'Email address cannot be changed'}
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="displayName">
                <User size={18} />
                {t('display_name')}
              </label>
              <input
                id="displayName"
                type="text"
                value={profileData.displayName}
                onChange={(e) => handleChange('displayName', e.target.value)}
                placeholder={t('display_name_placeholder') || 'Enter your display name'}
              />
            </div>

            <div className="form-group">
              <label htmlFor="realName">
                <User size={18} />
                {t('real_name')}
              </label>
              <input
                id="realName"
                type="text"
                value={profileData.realName}
                onChange={(e) => handleChange('realName', e.target.value)}
                placeholder={t('real_name_placeholder')}
              />
            </div>

            <div className="form-group">
              <label htmlFor="studentNumber">
                <Hash size={18} />
                {t('student_number')}
              </label>
              <input
                id="studentNumber"
                type="text"
                value={profileData.studentNumber}
                onChange={(e) => handleChange('studentNumber', e.target.value)}
                placeholder={t('student_number_placeholder')}
              />
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber">
                <Phone size={18} />
                {t('phone_number')}
              </label>
              <input
                id="phoneNumber"
                type="tel"
                value={profileData.phoneNumber}
                onChange={(e) => handleChange('phoneNumber', e.target.value)}
                placeholder={t('phone_number_placeholder') || 'Enter your phone number'}
              />
            </div>
          </div>
        </div>

        <div className="profile-card">
          <div className="card-header">
            <Palette size={24} />
            <h2>{t('appearance') || 'Appearance'}</h2>
          </div>

          <div className="form-section">
            <div className="form-group">
              <label>{t('message_color')}</label>
              <div className="color-picker">
                {colorOptions.map(color => (
                  <button
                    key={color}
                    className={`color-option ${profileData.messageColor === color ? 'selected' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleChange('messageColor', color)}
                    title={color}
                  />
                ))}
              </div>
              <div className="color-preview">
                <div className="preview-label">{t('preview')}:</div>
                <div 
                  className="message-bubble-preview"
                  style={{ backgroundColor: profileData.messageColor }}
                >
                  {t('sample_message') || 'This is how your messages will look'}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>{t('language')}</label>
              <button 
                onClick={toggleLang}
                className="language-toggle"
              >
                <span className="language-icon">🌐</span>
                {lang === 'en' ? 'English' : 'العربية'}
                <span className="toggle-hint">
                  {t('click_to_switch') || 'Click to switch'}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="profile-card">
          <div className="card-header">
            <Shield size={24} />
            <h2>{t('security') || 'Security'}</h2>
          </div>

          <div className="form-section">
            <div className="form-group">
              <label>
                <Shield size={18} />
                {t('otp_login') || 'OTP Login'}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                <button
                  onClick={() => handleChange('preferOTPLogin', !profileData.preferOTPLogin)}
                  style={{
                    padding: '0.75rem 1.25rem',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    background: profileData.preferOTPLogin ? '#10b981' : '#e5e7eb',
                    color: profileData.preferOTPLogin ? 'white' : '#374151',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {profileData.preferOTPLogin ? (t('enabled') || 'Enabled') : (t('disabled') || 'Disabled')}
                </button>
              </div>
              <small className="help-text" style={{ marginTop: '8px', display: 'block' }}>
                {t('otp_login_description') || 'When enabled, you can request a one-time password via email for login instead of using your regular password. More secure and convenient.'}
              </small>
            </div>
          </div>
        </div>

        <div className="profile-actions">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary save-btn"
          >
            <Save size={20} />
            {saving ? t('saving') : t('save_changes')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsPage;
