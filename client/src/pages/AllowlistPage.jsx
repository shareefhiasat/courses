import React, { useState, useEffect } from 'react';
import { EmailManager, useToast, Loading } from '@ui';
import { useLang } from '@contexts/LangContext';
import { getAllowlist, updateAllowlist } from '@firebaseServices/config';
import logger from '@utils/logger';

const AllowlistPage = () => {
  const { t } = useLang();
  const toast = useToast();
  const [allowlist, setAllowlist] = useState({ allowedEmails: [], adminEmails: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadAllowlist = async () => {
      setLoading(true);
      try {
        const result = await getAllowlist();
        if (result.success) {
          setAllowlist(result.data || { allowedEmails: [], adminEmails: [] });
        } else {
          logger.error('Failed to load allowlist:', result.error);
          toast?.showError('Failed to load allowlist: ' + result.error);
        }
      } catch (error) {
        logger.error('Error loading allowlist:', error);
        toast?.showError('Error loading allowlist: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    loadAllowlist();
  }, []);

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

  if (loading) {
    return <Loading variant="inline" message={t('loading') || 'Loading...'} fancyVariant="dots" />;
  }

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
