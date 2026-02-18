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
        toast?.showSuccess('Allowlist updated successfully!');
      } else {
        logger.error('Failed to update allowlist:', result.error);
        toast?.showError('Failed to update allowlist: ' + result.error);
      }
    } catch (error) {
      logger.error('Error updating allowlist:', error);
      toast?.showError('Error updating allowlist: ' + error.message);
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
          toast.error('Failed to load allowlist');
        }
      } catch (error) {
        console.error('Error loading allowlist:', error);
        toast.error('Error loading allowlist');
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
        placeholder="student@example.edu"
        description={t('students_can_register')}
        excludeEmails={allowlist.adminEmails || []}
        excludeMessage="This email is already in admin list"
      />
      <EmailManager
        emails={allowlist.adminEmails || []}
        onEmailsChange={(emails) => setAllowlist({ ...allowlist, adminEmails: emails })}
        title={t('admin_emails')}
        placeholder="admin@example.edu"
        description={t('admins_get_privileges')}
        excludeEmails={allowlist.allowedEmails || []}
        excludeMessage="This email is already in student list"
      />
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <button onClick={handleAllowlistSave} className="submit-btn" disabled={saving} style={{ position: 'relative', opacity: saving ? 0.7 : 1 }}>
          {saving && <span style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>⏳</span>}
          <span style={{ opacity: saving ? 0 : 1 }}>{t('save') + ' Allowlist Changes'}</span>
        </button>
      </div>
    </div>
  );
};

export default AllowlistPage;
