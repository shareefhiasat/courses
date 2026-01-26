/**
 * Email Testing Utilities
 * Integration with Mailtrap for email testing
 * 
 * Features:
 * - Check Mailtrap inbox for received emails
 * - Wait for emails to arrive
 * - Extract links from emails
 * - Verify email content
 */

import { testConfig } from '../config/test-config';

/**
 * Get emails from Mailtrap inbox
 * @param {number} limit - Number of emails to fetch
 * @returns {Promise<Array>} Array of emails
 */
export async function getEmailsFromMailtrap(limit = 10) {
  const { mailtrap } = testConfig;
  
  // Try API token first (for inbox API)
  const token = mailtrap.apiToken || mailtrap.sendAPI.token;
  
  if (!token || !mailtrap.inboxId) {
    console.warn('Mailtrap credentials not configured. Skipping email check.');
    return [];
  }

  try {
    const response = await fetch(
      `${mailtrap.baseURL}/inboxes/${mailtrap.inboxId}/messages?limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      // If inbox API fails, try alternative endpoint
      if (response.status === 404) {
        console.warn('Mailtrap inbox not found. Check inbox ID.');
        return [];
      }
      throw new Error(`Mailtrap API error: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : (data.messages || []);
  } catch (error) {
    console.error('Error fetching emails from Mailtrap:', error);
    return [];
  }
}

/**
 * Wait for email to arrive in Mailtrap
 * @param {string} recipientEmail - Email address to check
 * @param {string} subjectContains - Subject text to match
 * @param {number} timeout - Maximum time to wait (ms)
 * @returns {Promise<Object|null>} Email object or null
 */
export async function waitForEmail(recipientEmail, subjectContains = '', timeout = 30000) {
  const startTime = Date.now();
  const checkInterval = 2000; // Check every 2 seconds

  while (Date.now() - startTime < timeout) {
    const emails = await getEmailsFromMailtrap(20);
    
    const matchingEmail = emails.find(email => {
      const matchesRecipient = email.to_email === recipientEmail || 
                               email.to_email?.includes(recipientEmail);
      const matchesSubject = !subjectContains || 
                            email.subject?.toLowerCase().includes(subjectContains.toLowerCase());
      return matchesRecipient && matchesSubject;
    });

    if (matchingEmail) {
      return matchingEmail;
    }

    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }

  return null;
}

/**
 * Get email body content
 * @param {string} emailId - Mailtrap email ID
 * @returns {Promise<string>} Email body HTML/text
 */
export async function getEmailBody(emailId) {
  const { mailtrap } = testConfig;
  
  if (!mailtrap.apiToken || !mailtrap.inboxId) {
    return null;
  }

  try {
    const response = await fetch(
      `${mailtrap.baseURL}/inboxes/${mailtrap.inboxId}/messages/${emailId}/body.html`,
      {
        headers: {
          'Authorization': `Bearer ${mailtrap.apiToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      // Try text version
      const textResponse = await fetch(
        `${mailtrap.baseURL}/inboxes/${mailtrap.inboxId}/messages/${emailId}/body.txt`,
        {
          headers: {
            'Authorization': `Bearer ${mailtrap.apiToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (textResponse.ok) {
        return await textResponse.text();
      }
      
      throw new Error(`Mailtrap API error: ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    console.error('Error fetching email body:', error);
    return null;
  }
}

/**
 * Extract link from email body
 * @param {string} emailBody - Email HTML/text content
 * @param {string} linkText - Text to find in link
 * @returns {string|null} Extracted URL
 */
export function extractLinkFromEmail(emailBody, linkText = '') {
  if (!emailBody) return null;

  // Try to find link with specific text
  if (linkText) {
    const regex = new RegExp(`<a[^>]*>.*?${linkText}.*?</a>`, 'i');
    const match = emailBody.match(regex);
    if (match) {
      const hrefMatch = match[0].match(/href=["']([^"']+)["']/i);
      if (hrefMatch) return hrefMatch[1];
    }
  }

  // Find any URL in the email
  const urlRegex = /https?:\/\/[^\s<>"']+/gi;
  const urls = emailBody.match(urlRegex);
  return urls ? urls[0] : null;
}

/**
 * Check if email was sent to super admin
 * @param {string} subjectContains - Subject text to match
 * @param {number} timeout - Maximum time to wait (ms)
 * @returns {Promise<Object|null>} Email object or null
 */
export async function waitForSuperAdminEmail(subjectContains = '', timeout = 30000) {
  const { gmail } = testConfig;
  return await waitForEmail(gmail.email, subjectContains, timeout);
}

/**
 * Verify email was received
 * @param {string} recipientEmail - Email address
 * @param {string} subjectContains - Subject text
 * @param {number} timeout - Timeout in ms
 * @returns {Promise<boolean>} True if email found
 */
export async function verifyEmailReceived(recipientEmail, subjectContains = '', timeout = 30000) {
  const email = await waitForEmail(recipientEmail, subjectContains, timeout);
  return email !== null;
}

/**
 * Get all emails for a recipient
 * @param {string} recipientEmail - Email address
 * @param {number} limit - Max emails to fetch
 * @returns {Promise<Array>} Array of emails
 */
export async function getEmailsForRecipient(recipientEmail, limit = 20) {
  const emails = await getEmailsFromMailtrap(limit);
  return emails.filter(email => {
    const toEmail = email.to_email || email.to || '';
    return toEmail.toLowerCase().includes(recipientEmail.toLowerCase());
  });
}
