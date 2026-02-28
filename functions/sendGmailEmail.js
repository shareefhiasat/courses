/**
 * Simple Direct Email via Gmail SMTP
 * No templates, no complexity - just send email
 */
const functions = require('firebase-functions');
const nodemailer = require('nodemailer');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Send email directly via Gmail SMTP
 * Input: { to, subject, html, text }
 * Output: { success, messageId }
 */
exports.sendGmailEmail = functions.https.onCall(async (data, context) => {
  // Auth check
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Auth required');
  }

  // Validate
  if (!data.to || !data.subject) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing to or subject');
  }

  // Get SMTP config from environment (simple, no complexity)
  const config = functions.config();
  const smtp = config.smtp || {};
  
  const transporter = nodemailer.createTransport({
    host: smtp.host || process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(smtp.port || process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: smtp.user || process.env.SMTP_USER,
      pass: smtp.password || process.env.SMTP_PASSWORD,
    },
    tls: { rejectUnauthorized: false }
  });

  const info = await transporter.sendMail({
    from: `"QAF Learning Hub" <${smtp.user || process.env.SMTP_USER}>`,
    to: data.to,
    subject: data.subject,
    html: data.html || '',
    text: data.text || data.subject
  });

  return { success: true, messageId: info.messageId };
});
