/**
 * Mailtrap Send API Utilities
 * For sending emails via Mailtrap API (production-like testing)
 */

import { testConfig } from '../config/test-config';

/**
 * Send email via Mailtrap Send API
 * @param {Object} emailData - Email data
 * @param {string} emailData.to - Recipient email
 * @param {string} emailData.subject - Email subject
 * @param {string} emailData.text - Plain text content
 * @param {string} emailData.html - HTML content
 * @param {string} emailData.from - Sender email (optional)
 * @param {string} emailData.from_name - Sender name (optional)
 * @returns {Promise<Object>} Send result
 */
export async function sendEmailViaMailtrapAPI(emailData) {
  const { mailtrap } = testConfig;
  
  if (!mailtrap.sendAPI.token) {
    throw new Error('Mailtrap Send API token not configured');
  }

  try {
    const response = await fetch(`${mailtrap.sendAPI.baseURL}/api/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mailtrap.sendAPI.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: {
          email: emailData.from || 'hello@demomailtrap.co',
          name: emailData.from_name || 'QAF Learning Hub'
        },
        to: [
          {
            email: emailData.to
          }
        ],
        subject: emailData.subject,
        text: emailData.text || emailData.html?.replace(/<[^>]*>/g, '') || '',
        html: emailData.html || emailData.text || '',
        category: emailData.category || 'E2E Test'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mailtrap Send API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return {
      success: true,
      messageId: result.message_ids?.[0] || result.id,
      result
    };
  } catch (error) {
    console.error('Error sending email via Mailtrap API:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send test email to verify Mailtrap configuration
 * @param {string} recipientEmail - Email to send test to
 * @returns {Promise<Object>} Test result
 */
export async function testMailtrapSendAPI(recipientEmail = 'shareef.hiasat@gmail.com') {
  const testEmail = {
    to: recipientEmail,
    subject: 'QAF Courses - Mailtrap Send API Test',
    text: 'This is a test email sent via Mailtrap Send API for E2E testing.',
    html: '<p>This is a test email sent via <strong>Mailtrap Send API</strong> for E2E testing.</p>',
    category: 'E2E Test'
  };

  return await sendEmailViaMailtrapAPI(testEmail);
}
