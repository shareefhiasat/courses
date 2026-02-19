import React, { useState, useEffect, useLayoutEffect } from 'react';
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

  const handleAllowlistSave = async () => {
    setSaving(true);
    try {
      const result = await updateAllowlist(allowlist);
      if (result.success) {
        toast?.showSuccess(t('allowlist_updated_successfully'));
      } else {
        logger.error(t('allowlist_failed_to_update'), result.error);
        toast?.showError(t('allowlist_failed_to_update') + result.error);
      }
    } catch (error) {
      logger.error(t('allowlist_error_updating'), error);
      toast?.showError(t('allowlist_error_updating') + error.message);
    } finally {
      setSaving(false);
    }
  };

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
        onEmailsChange={(emails) => setAllowlist({ ...allowlist, allowedEmails: emails })}
        title={t('student_emails')}
        placeholder={t('allowlist_student_emails_placeholder')}
        description={t('students_can_register')}
        excludeEmails={allowlist.adminEmails || []}
        excludeMessage={t('allowlist_exclude_student_message')}
      />
      <EmailManager
        emails={allowlist.adminEmails || []}
        onEmailsChange={(emails) => setAllowlist({ ...allowlist, adminEmails: emails })}
        title={t('admin_emails')}
        placeholder={t('allowlist_admin_emails_placeholder')}
        description={t('admins_get_privileges')}
        excludeEmails={allowlist.allowedEmails || []}
        excludeMessage={t('allowlist_exclude_admin_message')}
      />
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <button onClick={handleAllowlistSave} className="submit-btn" disabled={saving} style={{ position: 'relative', opacity: saving ? 0.7 : 1 }}>
          {saving && <span style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>⏳</span>}
          <span style={{ opacity: saving ? 0 : 1 }}>{t('allowlist_save_changes')}</span>
        </button>
      </div>
    </div>
  );
};

export default AllowlistPage;
