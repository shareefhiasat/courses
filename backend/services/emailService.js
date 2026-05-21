/**
 * Email Service for sending emails via SMTP
 */

import nodemailer from 'nodemailer';

// SMTP configuration (for production)
const smtpConfig = {
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  } : undefined,
};

// Create transporter
const transporter = nodemailer.createTransport(smtpConfig);

/**
 * Send an email
 * @param {object} options - Email options
 * @param {string|string[]} options.to - Recipient email(s)
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text body
 * @param {string} options.html - HTML body (optional)
 * @returns {Promise<object>} Send result
 */
export async function sendEmail({ to, subject, text, html }) {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@qaf-lms.local',
      to,
      subject,
      text,
      html,
    });

    console.log('[emailService] Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[emailService] Error sending email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send file sharing email
 * @param {object} options - Sharing options
 * @param {string|string[]} options.to - Recipient email(s)
 * @param {string} options.senderName - Name of the person sharing
 * @param {string} options.fileName - Name of the file being shared
 * @param {string} options.shareUrl - URL to access the shared file
 * @param {string} options.message - Optional message from sender
 * @returns {Promise<object>} Send result
 */
export async function sendShareEmail({ to, senderName, fileName, shareUrl, message }) {
  const subject = `${senderName} shared a document with you`;
  
  const text = `
${senderName} has shared a document with you:

File: ${fileName}

${message || ''}

Access the document: ${shareUrl}

This link will expire in 24 hours.
  `.trim();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #800000;">${senderName} shared a document with you</h2>
      <p><strong>File:</strong> ${fileName}</p>
      ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
      <p><a href="${shareUrl}" style="background-color: #800000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Access Document</a></p>
      <p style="color: #666; font-size: 12px;">This link will expire in 24 hours.</p>
    </div>
  `;

  return sendEmail({ to, subject, text, html });
}

export default {
  sendEmail,
  sendShareEmail,
};
