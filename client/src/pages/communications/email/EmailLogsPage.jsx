import React from 'react';
import { EmailLogs } from '@ui';


import { info, error, warn, debug } from '@services/utils/logger.js';/**
 * EmailLogsPage - Email logs management page
 * 
 * This component provides a dedicated page for viewing email logs,
 * extracted from DashboardPage.jsx for better modularity.
 * 
 * Features:
 * - Email logs viewing and management
 * - Filter and search capabilities
 * - Export functionality
 * - Responsive design
 */
const EmailLogsPage = () => {
  return (
    <div className="email-logs-tab">
      <EmailLogs />
    </div>
  );
};

export default EmailLogsPage;
