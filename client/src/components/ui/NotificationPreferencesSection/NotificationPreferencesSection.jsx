/**
 * Notification Preferences Section
 *
 * Channel and category preferences. When embedded in ProfileSettingsPage,
 * defers saving to the parent via ref.
 */

import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useToast } from '@ui';
import { ToggleSwitch, Spinner } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import { apiService } from '@services/api/apiService';
import styles from './NotificationPreferencesSection.module.css';

const NotificationPreferencesSection = forwardRef(function NotificationPreferencesSection(
  { embedded = false, onLoadingChange },
  ref
) {
  const { t } = useLang();
  const { theme } = useTheme();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState({
    inAppEnabled: true,
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: false,
    matrix: {}
  });

  const categories = [
    { key: 'WORKFLOW', label: t('profile_category_workflow'), icon: 'workflow' },
    { key: 'ACADEMIC', label: t('profile_category_academic'), icon: 'academic' },
    { key: 'ATTENDANCE', label: t('profile_category_attendance'), icon: 'attendance' },
    { key: 'ASSESSMENT', label: t('profile_category_assessment'), icon: 'assessment' },
    { key: 'ANNOUNCEMENT', label: t('profile_category_announcement'), icon: 'announcement' },
    { key: 'BEHAVIOR', label: t('profile_category_behavior'), icon: 'behavior' },
    { key: 'FILE', label: t('profile_category_file'), icon: 'file' },
    { key: 'QR', label: t('profile_category_qr'), icon: 'qr' }
  ];

  const channels = [
    { key: 'in_app', label: t('profile_channel_in_app'), icon: 'bell' },
    { key: 'email', label: t('profile_channel_email'), icon: 'mail' },
    { key: 'sms', label: t('profile_channel_sms'), icon: 'message' },
    { key: 'push', label: t('profile_channel_push'), icon: 'smartphone' }
  ];

  useEffect(() => {
    loadPreferences();
  }, []);

  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/notifications/preferences');
      if (response.data?.preferences) {
        setPreferences(response.data.preferences);
      }
    } catch (err) {
      console.error('Failed to load notification preferences:', err);
      if (!embedded) {
        toast.error(t('profile_error_loading_preferences'));
      }
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async ({ silent = false } = {}) => {
    const response = await apiService.put('/notifications/preferences', preferences);
    if (response.data?.success) {
      if (!silent) {
        toast.success(t('profile_preferences_saved'));
      }
      return true;
    }
    throw new Error('Failed to save preferences');
  };

  useImperativeHandle(ref, () => ({
    save: savePreferences,
    isLoading: () => loading
  }));

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

  const isChannelEnabled = (channel) => preferences[`${channel}Enabled`];

  const isCategoryChannelEnabled = (category, channel) => {
    const categoryConfig = preferences.matrix[category];
    return categoryConfig?.[channel] !== false;
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <div>
        <h3 className={styles.subsectionTitle}>{t('profile_master_channels')}</h3>
        <p className={styles.subsectionDesc}>{t('profile_master_channels_desc')}</p>
        <div className={styles.masterGrid}>
          {channels.map(channel => (
            <div key={channel.key} className={styles.masterItem}>
              <span className={styles.masterLabel}>
                {getThemedIcon('ui', channel.icon, 16, theme)}
                {channel.label}
              </span>
              <ToggleSwitch
                checked={isChannelEnabled(channel.key)}
                onChange={(value) => handleMasterToggle(channel.key, value)}
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className={styles.subsectionTitle}>{t('profile_category_preferences')}</h3>
        <p className={styles.subsectionDesc}>{t('profile_category_preferences_desc')}</p>
        <div className={styles.matrixWrap}>
          <table className={styles.matrixTable}>
            <thead>
              <tr>
                <th>{t('profile_category_column')}</th>
                {channels.map(channel => (
                  <th key={channel.key}>{channel.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map(category => (
                <tr key={category.key}>
                  <td>
                    <span className={styles.categoryCell}>
                      {getThemedIcon('ui', category.icon, 14, theme)}
                      {category.label}
                    </span>
                  </td>
                  {channels.map(channel => (
                    <td key={channel.key}>
                      <ToggleSwitch
                        checked={isChannelEnabled(channel.key) && isCategoryChannelEnabled(category.key, channel.key)}
                        onChange={(value) => handleMatrixToggle(category.key, channel.key, value)}
                        disabled={!isChannelEnabled(channel.key)}
                        size="sm"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

export default NotificationPreferencesSection;
