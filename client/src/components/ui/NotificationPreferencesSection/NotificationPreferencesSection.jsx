/**
 * Notification Preferences Section
 * 
 * Manages notification channel preferences per category.
 * Integrates with the backend notification preferences API.
 */

import React, { useState, useEffect } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useToast } from '@ui';
import { Card, CardBody, ToggleSwitch, Spinner } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import { apiService } from '@services/api/apiService';

const NotificationPreferencesSection = () => {
  const { t, isRTL } = useLang();
  const { theme } = useTheme();
  const toast = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    inAppEnabled: true,
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: false,
    matrix: {}
  });

  // Categories for the matrix
  const categories = [
    { key: 'WORKFLOW', label: t('category_workflow', 'Workflow'), icon: 'workflow' },
    { key: 'ACADEMIC', label: t('category_academic', 'Academic'), icon: 'academic' },
    { key: 'ATTENDANCE', label: t('category_attendance', 'Attendance'), icon: 'attendance' },
    { key: 'ASSESSMENT', label: t('category_assessment', 'Assessment'), icon: 'assessment' },
    { key: 'ANNOUNCEMENT', label: t('category_announcement', 'Announcement'), icon: 'announcement' },
    { key: 'BEHAVIOR', label: t('category_behavior', 'Behavior'), icon: 'behavior' },
    { key: 'FILE', label: t('category_file', 'File'), icon: 'file' },
    { key: 'QR', label: t('category_qr', 'QR Code'), icon: 'qr' }
  ];

  // Channels
  const channels = [
    { key: 'in_app', label: t('channel_in_app', 'In-App'), icon: 'bell' },
    { key: 'email', label: t('channel_email', 'Email'), icon: 'mail' },
    { key: 'sms', label: t('channel_sms', 'SMS'), icon: 'message' },
    { key: 'push', label: t('channel_push', 'Push'), icon: 'smartphone' }
  ];

  // Load preferences
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/notifications/preferences');
      if (response.data?.preferences) {
        setPreferences(response.data.preferences);
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
      toast.error(t('error_loading_preferences', 'Failed to load preferences'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await apiService.put('/notifications/preferences', preferences);
      if (response.data?.success) {
        toast.success(t('preferences_saved', 'Preferences saved successfully'));
      }
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
      toast.error(t('error_saving_preferences', 'Failed to save preferences'));
    } finally {
      setSaving(false);
    }
  };

  const handleMasterToggle = (channel, value) => {
    setPreferences(prev => ({
      ...prev,
      [`${channel}Enabled`]: value
    }));
  };

  const handleMatrixToggle = (category, channel, value) => {
    setPreferences(prev => ({
      ...prev,
      matrix: {
        ...prev.matrix,
        [category]: {
          ...prev.matrix[category],
          [channel]: value
        }
      }
    }));
  };

  const isChannelEnabled = (channel) => {
    return preferences[`${channel}Enabled`];
  };

  const isCategoryChannelEnabled = (category, channel) => {
    const categoryConfig = preferences.matrix[category];
    return categoryConfig?.[channel] !== false;
  };

  if (loading) {
    return (
      <Card>
        <CardBody>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
            <Spinner size="md" />
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {getThemedIcon('ui', 'settings', 24, theme)}
          <h2>{t('notification_preferences', 'Notification Preferences')}</h2>
        </div>

        {/* Master Toggles */}
        <div style={{
          marginBottom: '2rem',
          padding: '1rem',
          background: '#f9fafb',
          borderRadius: 8,
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontWeight: 600, marginBottom: '1rem', color: '#374151' }}>
            {t('master_channels', 'Master Channel Toggles')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {channels.map(channel => (
              <div
                key={channel.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  background: '#fff',
                  borderRadius: 6,
                  border: '1px solid #e5e7eb'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {getThemedIcon('ui', channel.icon, 18, theme)}
                  <span style={{ fontSize: '0.9rem', color: '#374151' }}>
                    {channel.label}
                  </span>
                </div>
                <ToggleSwitch
                  checked={isChannelEnabled(channel.key)}
                  onChange={(value) => handleMasterToggle(channel.key, value)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Category Matrix */}
        <div style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          background: '#f9fafb',
          borderRadius: 8,
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontWeight: 600, marginBottom: '1rem', color: '#374151' }}>
            {t('category_preferences', 'Category Preferences')}
          </div>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
            {t('category_preferences_desc', 'Configure which notification categories you want to receive via each channel.')}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {categories.map(category => (
              <div
                key={category.key}
                style={{
                  padding: '1rem',
                  background: '#fff',
                  borderRadius: 6,
                  border: '1px solid #e5e7eb'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  {getThemedIcon('ui', category.icon, 16, theme)}
                  <span style={{ fontWeight: 500, fontSize: '0.9rem', color: '#374151' }}>
                    {category.label}
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                  {channels.map(channel => (
                    <div
                      key={channel.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.85rem',
                        color: '#6b7280'
                      }}
                    >
                      <ToggleSwitch
                        checked={isChannelEnabled(channel.key) && isCategoryChannelEnabled(category.key, channel.key)}
                        onChange={(value) => handleMatrixToggle(category.key, channel.key, value)}
                        disabled={!isChannelEnabled(channel.key)}
                        size="sm"
                      />
                      <span>{channel.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#8A1538',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontSize: '0.9rem',
              fontWeight: 500,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1
            }}
          >
            {saving ? t('saving', 'Saving...') : t('save_preferences', 'Save Preferences')}
          </button>
        </div>
      </CardBody>
    </Card>
  );
};

export default NotificationPreferencesSection;
