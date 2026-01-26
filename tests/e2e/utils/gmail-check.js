/**
 * Gmail Inbox Checking Utilities
 * Uses Gmail App Password to check inbox for test emails
 * 
 * Note: Gmail API requires OAuth2 for full access
 * For now, we'll use IMAP with app password for basic checking
 */

import { testConfig } from '../config/test-config';

/**
 * Check Gmail inbox for emails using IMAP
 * Requires: Gmail App Password configured
 * 
 * @param {string} searchTerm - Search term (subject, from, etc.)
 * @param {number} limit - Max emails to fetch
 * @returns {Promise<Array>} Array of emails
 */
export async function checkGmailInbox(searchTerm = '', limit = 10) {
  // Note: IMAP requires a Node.js library like 'imap' or 'node-imap'
  // For Playwright E2E tests, we'll use a simpler approach:
  // 1. Use Mailtrap Send API to send emails (they go to real Gmail)
  // 2. Use Gmail plus addressing to organize emails
  // 3. Manually check Gmail or use Gmail API (requires OAuth2 setup)
  
  console.log('Gmail inbox checking requires OAuth2 setup or IMAP library.');
  console.log('For E2E testing, we recommend:');
  console.log('1. Use Gmail plus addressing (shareef.hiasat+tag@gmail.com)');
  console.log('2. All emails go to your Gmail inbox');
  console.log('3. Filter/search by the tag in Gmail');
  console.log('4. Or use Mailtrap Inbox for SMTP testing');
  
  return [];
}

/**
 * Generate Gmail plus address for testing
 * Format: shareef.hiasat+DDMMYYYYHHMMrole@gmail.com
 * 
 * @param {string} role - User role (instructor, student, etc.)
 * @param {string} prefix - Optional prefix
 * @returns {string} Gmail plus address
 */
export function generateGmailPlusAddress(role = 'test', prefix = '') {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const timestamp = `${day}${month}${year}${hour}${minute}`;
  const tag = prefix ? `${timestamp}${prefix}${role}` : `${timestamp}${role}`;
  return `shareef.hiasat+${tag}@gmail.com`;
}

/**
 * Extract timestamp from Gmail plus address
 * @param {string} email - Gmail plus address
 * @returns {Object|null} { day, month, year, hour, minute } or null
 */
export function extractTimestampFromGmailPlus(email) {
  const match = email.match(/shareef\.hiasat\+(\d{12})/);
  if (!match) return null;
  
  const timestamp = match[1];
  return {
    day: timestamp.substring(0, 2),
    month: timestamp.substring(2, 4),
    year: timestamp.substring(4, 8),
    hour: timestamp.substring(8, 10),
    minute: timestamp.substring(10, 12)
  };
}
