import React from 'react';
import { EmailManager } from '@ui';

const AllowlistPage = ({
  allowlist,
  setAllowlist,
  handleAllowlistSave,
  loading,
  t
}) => {
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
        <button onClick={handleAllowlistSave} className="submit-btn" disabled={loading} style={{ position: 'relative', opacity: loading ? 0.7 : 1 }}>
          {loading && <span style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>⏳</span>}
          <span style={{ opacity: loading ? 0 : 1 }}>{t('save') + ' Allowlist Changes'}</span>
        </button>
      </div>
    </div>
  );
};

export default AllowlistPage;
