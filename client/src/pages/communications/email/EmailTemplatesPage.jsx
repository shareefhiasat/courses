import React from 'react';
import { EmailTemplates } from '@ui';


import { info, error, warn, debug } from '@services/utils/logger.js';const EmailTemplatesPage = () => {
  return (
    <div className="email-templates-tab">
      <EmailTemplates />
    </div>
  );
};

export default EmailTemplatesPage;
