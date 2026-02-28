/**
 * Backend Constants - Secure server-side configuration
 * These values should never be exposed to the client
 */

// Super Admin Configuration
// In production, these should come from environment variables or server-side config
const getSuperAdminEmails = () => {
  // Try to get from environment variables first
  const envEmails = import.meta.env.VITE_SUPER_ADMIN_EMAILS;
  if (envEmails) {
    return envEmails.split(',').map(email => email.trim().toLowerCase());
  }
  
  // Fallback to default for development
  return [
    'shareef.hiasat@gmail.com'
    // Add more super admin emails here in the future
  ];
};

export const SUPER_ADMIN_EMAILS = getSuperAdminEmails();

// System Configuration
export const SYSTEM_CONFIG = {
  maxSuperAdmins: parseInt(import.meta.env.VITE_MAX_SUPER_ADMINS) || 10,
  requireSuperAdminApproval: import.meta.env.VITE_REQUIRE_SUPER_ADMIN_APPROVAL === 'true',
  allowSuperAdminSelfManagement: import.meta.env.VITE_ALLOW_SUPER_ADMIN_SELF_MANAGEMENT !== 'false'
};

// Helper function to check if email is super admin
export const isSuperAdminEmail = (email) => {
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase());
};

// Helper function to get all super admin emails
export const getSuperAdminEmailsList = () => {
  return [...SUPER_ADMIN_EMAILS];
};
