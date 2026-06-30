/**
 * Notification Preferences Section
 *
 * Channel and category preferences. When embedded in ProfileSettingsPage,
 * defers saving to the parent via ref.
 */

import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useToast, Spinner, ToggleSwitch } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import { apiService } from '@services/api/apiService';
import PortalTooltip from '@ui/PortalTooltip';
import styles from './NotificationPreferencesSection.module.css';

const CHANNEL_PREF_KEYS = {
  in_app: 'inAppEnabled',
  email: 'emailEnabled',
  sms: 'smsEnabled',
  push: 'pushEnabled',
};

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
    { key: 'PARTICIPATION', label: t('profile_category_participation'), icon: 'users' },
    { key: 'PENALTY', label: t('profile_category_penalty'), icon: 'alert-triangle' },
    { key: 'RESOURCE', label: t('profile_category_resource'), icon: 'book-open' },
    { key: 'COMMUNICATION', label: t('profile_category_communication'), icon: 'message-circle' },
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
      if (response?.preferences) {
        const { inAppEnabled, emailEnabled, smsEnabled, pushEnabled, matrix } = response.preferences;
        setPreferences({
          inAppEnabled: inAppEnabled ?? true,
          emailEnabled: emailEnabled ?? false,
          smsEnabled: smsEnabled ?? false,
          pushEnabled: pushEnabled ?? false,
          matrix: matrix || {},
        });
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
    const payload = {
      inAppEnabled: preferences.inAppEnabled,
      emailEnabled: preferences.emailEnabled,
      smsEnabled: preferences.smsEnabled,
      pushEnabled: preferences.pushEnabled,
      matrix: preferences.matrix || {},
    };
    const response = await apiService.put('/notifications/preferences', payload);
    if (response?.success) {
      if (!silent) {
        toast.success(t('profile_preferences_saved'));
      }
      return true;
    }
    throw new Error(response?.error || 'Failed to save preferences');
  };

  useImperativeHandle(ref, () => ({
    save: savePreferences,
    isLoading: () => loading
  }));

  const handleMasterToggle = (channel, value) => {
    const prefKey = CHANNEL_PREF_KEYS[channel];
    if (!prefKey) return;
    setPreferences(prev => ({
      ...prev,
      [prefKey]: value,
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

  const isChannelEnabled = (channel) => preferences[CHANNEL_PREF_KEYS[channel]];

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
        <div className={styles.channelGrid}>
          {channels.map(channel => {
            const enabled = isChannelEnabled(channel.key);
            return (
              <PortalTooltip key={channel.key} content={channel.label} position="top">
                <button
                  className={`${styles.channelBtn} ${enabled ? styles.channelActive : ''}`}
                  onClick={() => handleMasterToggle(channel.key, !enabled)}
                >
                  {getThemedIcon('ui', channel.icon, 22, enabled ? '#fff' : theme)}
                  <span className={styles.channelLabel}>{channel.label}</span>
                </button>
              </PortalTooltip>
            );
          })}
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
