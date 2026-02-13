import React from 'react';
import { EmailLogs } from '@ui';

/**
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
