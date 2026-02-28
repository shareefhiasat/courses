import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { EmailManager, useToast } from '@ui';
import { GlobalLoadingFallback, useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { useLang } from '@contexts/LangContext';
import { useAuth } from '@contexts/AuthContext';
import { getAllowlist, updateAllowlist } from '@services/other/config';
import logger from '@utils/logger';

const AllowlistPage = () => {
  const { t } = useLang();
  const { user, loading: authLoading, isSuperAdmin } = useAuth();
  const toast = useToast();
  const { startLoading } = useGlobalLoading();
  const [allowlist, setAllowlist] = useState({ allowedEmails: [], adminEmails: [] });
  const [saving, setSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [savedTimeDisplay, setSavedTimeDisplay] = useState('');

  // Optimistic update with instant save
  const saveChanges = useCallback(async (newAllowlist, showSuccessMessage = false) => {
    setSaving(true);
    try {
      const result = await updateAllowlist(newAllowlist);
      if (result.success) {
        const now = new Date();
        setLastSavedTime(now);
        setSavedTimeDisplay('Just saved');
        if (showSuccessMessage) {
          toast?.showSuccess('Changes saved successfully!');
        }
        logger.info('Allowlist saved successfully');
      } else {
        logger.error('Save failed:', result.error);
        toast?.showError('Failed to save changes: ' + result.error);
        // Revert to previous state on error
        const prevResult = await getAllowlist();
        if (prevResult.success) {
          setAllowlist(prevResult.data || { allowedEmails: [], adminEmails: [] });
        }
      }
    } catch (error) {
      logger.error('Save error:', error);
      toast?.showError('Failed to save changes: ' + error.message);
      // Revert to previous state on error
      try {
        const prevResult = await getAllowlist();
        if (prevResult.success) {
          setAllowlist(prevResult.data || { allowedEmails: [], adminEmails: [] });
        }
      } catch (revertError) {
        logger.error('Failed to revert changes:', revertError);
      }
    } finally {
      setSaving(false);
    }
  }, [toast]);

  // Instant save on any change
  const handleEmailsChange = useCallback(async (newEmails, type) => {
    // Prevent multiple simultaneous saves
    if (saving) return;
    
    const newAllowlist = { 
      ...allowlist, 
      [type]: newEmails 
    };
    
    // Update UI immediately (optimistic update)
    setAllowlist(newAllowlist);
    
    // Save immediately in background
    saveChanges(newAllowlist);
  }, [allowlist, saveChanges, saving]);

  const handleAllowlistSave = async () => {
    await saveChanges(allowlist, true);
  };

  // Update last saved time display every second without triggering component re-renders
  useEffect(() => {
    if (!lastSavedTime) return;
    
    const interval = setInterval(() => {
      const now = new Date();
      const diff = now - lastSavedTime;
      const seconds = Math.floor(diff / 1000);
      
      let displayText;
      if (seconds < 10) {
        displayText = 'Just saved';
      } else if (seconds < 60) {
        displayText = `Saved ${seconds}s ago`;
      } else if (seconds < 3600) {
        displayText = `Saved ${Math.floor(seconds / 60)}m ago`;
      } else {
        displayText = `Saved ${lastSavedTime.toLocaleTimeString()}`;
      }
      
      setSavedTimeDisplay(displayText);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [lastSavedTime]);

  // Use GlobalLoading for initial data load
  useLayoutEffect(() => {
    if (authLoading) return;
    if (!user) return;
    if (!isSuperAdmin) return;

    let stopped = false;
    const stopGlobalLoading = startLoading();
    const safeStop = () => {
      if (stopped) return;
      stopped = true;
      stopGlobalLoading();
    };

    const loadData = async () => {
      try {
        const result = await getAllowlist();
        if (result.success) {
          setAllowlist(result.data || { allowedEmails: [], adminEmails: [] });
        } else {
          toast.error(t('allowlist_failed_to_load'));
        }
      } catch (error) {
        console.error(t('allowlist_error_loading'), error);
        toast.error(t('allowlist_error_loading'));
      } finally {
        safeStop();
      }
    };

    loadData();

    return () => {
      safeStop();
    };
  }, [authLoading, user, isSuperAdmin, startLoading, toast]);

  return (
    <div className="allowlist-tab">
      <EmailManager
        emails={allowlist.allowedEmails || []}
        onEmailsChange={(emails) => handleEmailsChange(emails, 'allowedEmails')}
        title={t('student_emails')}
        placeholder={t('allowlist_student_emails_placeholder')}
        description={t('students_can_register')}
        excludeEmails={allowlist.adminEmails || []}
        excludeMessage={t('allowlist_exclude_student_message')}
      />
      <EmailManager
        emails={allowlist.adminEmails || []}
        onEmailsChange={(emails) => handleEmailsChange(emails, 'adminEmails')}
        title={t('admin_emails')}
        placeholder={t('allowlist_admin_emails_placeholder')}
        description={t('admins_get_privileges')}
        excludeEmails={allowlist.allowedEmails || []}
        excludeMessage={t('allowlist_exclude_admin_message')}
      />
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary, #666)' }}>
          {saving ? (
            <span style={{ color: 'var(--color-primary, #10b981)' }}>
              💾 Saving...
            </span>
          ) : savedTimeDisplay ? (
            <span style={{ color: 'var(--color-success, #22c55e)' }}>
              ✅ {savedTimeDisplay}
            </span>
          ) : (
            <span style={{ color: 'var(--text-secondary, #666)' }}>
              Ready to edit
            </span>
          )}
        </div>
        <button 
          onClick={handleAllowlistSave} 
          className="submit-btn" 
          disabled={saving} 
          style={{ 
            position: 'relative', 
            opacity: saving ? 0.7 : 1,
            background: 'var(--color-primary, #10b981)'
          }}
        >
          {saving && <span style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>⏳</span>}
          <span style={{ opacity: saving ? 0 : 1 }}>
            {t('allowlist_save_changes')}
          </span>
        </button>
      </div>
    </div>
  );
};

export default AllowlistPage;
