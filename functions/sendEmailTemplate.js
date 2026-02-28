/**
 * Consolidated Email Service - Template Only
 * 
 * PURPOSE:
 * Single, reliable email function that ONLY uses templates from Firestore
 * No fallbacks, no raw HTML - templates are mandatory.
 * 
 * USAGE:
 * All email sending goes through this function using templateId
 * 
 * TEMPLATES:
 * Pulls from emailTemplates collection in Firestore
 * Template must exist or function fails with clear error
 */

const functions = require("firebase-functions");
const nodemailer = require("nodemailer");
const admin = require("firebase-admin");
const { renderEmailTemplate, getEmailTemplate } = require("./utils/emailRenderer");

/**
 * Send email using template from Firestore
 * REQUIRED: templateId (must exist in emailTemplates collection)
 * OPTIONAL: variables (for template substitution)
 */
exports.sendEmailTemplate = functions.https.onCall(async (data, context) => {
  // Authentication check
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Must be authenticated to send emails"
    );
  }

  // Validate required fields
  if (!data.to || !data.templateId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing required fields: to, templateId"
    );
  }

  const db = admin.firestore({
    ignoreUndefinedProperties: true
  });

  try {
    console.log(`📧 Sending email template: ${data.templateId} to: ${data.to}`);

    // 1. Get template from Firestore (MUST exist)
    const template = await getEmailTemplate(db, data.templateId);
    if (!template) {
      throw new functions.https.HttpsError(
        "not-found",
        `Email template not found: ${data.templateId}`
      );
    }

    console.log(`✅ Template found: ${template.name || template.id}`);

    // 2. Render template with variables
    const variables = data.variables || {};
    const emailHtml = renderEmailTemplate(template.html || template.body, variables, data.siteUrl);
    const emailSubject = renderEmailTemplate(template.subject || 'No Subject', variables, data.siteUrl);

    console.log(`📝 Template rendered with ${Object.keys(variables).length} variables`);

    // 3. Get SMTP configuration
    const { getSMTPConfigForFunctions } = require("./config/smtp");
    const smtpConfig = await getSMTPConfigForFunctions();

    // Validate SMTP config
    if (!smtpConfig.host || !smtpConfig.port || !smtpConfig.user || !smtpConfig.password) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        `SMTP configuration incomplete (source: ${smtpConfig.source || 'unknown'})`
      );
    }

    // 4. Create transporter and send
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.port === 465,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.password,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: `"${smtpConfig.senderName || "QAF Learning Hub"}" <${smtpConfig.user}>`,
      to: Array.isArray(data.to) ? data.to.join(", ") : data.to,
      subject: emailSubject,
      html: emailHtml,
      text: template.text ? renderEmailTemplate(template.text, variables, data.siteUrl) : emailSubject,
    };

    // Add CC/BCC if provided
    if (data.cc) mailOptions.cc = Array.isArray(data.cc) ? data.cc.join(", ") : data.cc;
    if (data.bcc) mailOptions.bcc = Array.isArray(data.bcc) ? data.bcc.join(", ") : data.bcc;

    console.log(`🚀 Sending email via ${smtpConfig.provider || smtpConfig.source}`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully: ${info.messageId}`);

    // 5. Log to Firestore
    await db.collection("emailLogs").add({
      to: Array.isArray(data.to) ? data.to : [data.to],
      subject: emailSubject,
      templateId: data.templateId,
      variables: Object.keys(variables),
      recipientCount: Array.isArray(data.to) ? data.to.length : 1,
      status: "sent",
      messageId: info.messageId,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      sentBy: context.auth.uid,
      senderEmail: context.auth.token.email,
      smtpProvider: smtpConfig.provider || smtpConfig.source,
    });

    return {
      success: true,
      messageId: info.messageId,
      templateId: data.templateId,
      subject: emailSubject,
      provider: smtpConfig.provider || smtpConfig.source,
    };

  } catch (error) {
    console.error(`❌ Email send failed for template ${data.templateId}:`, error);

    // Log failure
    try {
      await db.collection("emailLogs").add({
        to: Array.isArray(data.to) ? data.to : [data.to],
        templateId: data.templateId,
        status: "failed",
        error: error.message,
        errorCode: error.code || "unknown",
        attemptedAt: admin.firestore.FieldValue.serverTimestamp(),
        sentBy: context.auth.uid,
        senderEmail: context.auth.token.email,
      });
    } catch (logError) {
      console.error("Failed to log email error:", logError);
    }

    // Throw user-friendly error
    if (error.code === "EAUTH") {
      throw new functions.https.HttpsError("failed-precondition", "Email authentication failed");
    } else if (error.code === "ECONNECTION") {
      throw new functions.https.HttpsError("unavailable", "Email server connection failed");
    } else if (error.responseCode === 550) {
      throw new functions.https.HttpsError("invalid-argument", "Invalid recipient email");
    } else {
      throw new functions.https.HttpsError("internal", `Email send failed: ${error.message}`);
    }
  }
});

/**
 * Test email template function
 */
exports.testEmailTemplate = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Must be authenticated");
  }

  const testEmail = data.testEmail || context.auth.token.email;
  const templateId = data.templateId || 'welcome_signup_default';

  return exports.sendEmailTemplate.run({
    to: testEmail,
    templateId: templateId,
    variables: {
      recipientName: context.auth.token.displayName || 'Test User',
      userEmail: testEmail,
      siteName: 'QAF Learning Hub',
      currentDate: new Date().toLocaleDateString()
    }
  }, context);
});
