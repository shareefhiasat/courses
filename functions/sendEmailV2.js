const functions = require("firebase-functions");
const nodemailer = require("nodemailer");
const admin = require("firebase-admin");
const { renderEmailTemplate, getEmailTemplate } = require("./emailRenderer");

/**
 * Firebase Cloud Function to send emails (Updated - No Admin Check)
 * Requires SMTP configuration in Firestore: config/smtp
 */
exports.sendEmail = functions.https.onCall(async (data, context) => {
  // Check authentication (any authenticated user can send)
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Must be authenticated to send emails"
    );
  }

  // Validate input
  if (!data.to || (!data.subject && !data.templateId)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing required fields: to, subject or templateId"
    );
  }

  const db = admin.firestore({
    ignoreUndefinedProperties: true
  });

  try {
    // 1. Prepare email content (either from template or raw HTML)
    let emailHtml = data.html || data.body || data.text || "";
    let emailSubject = data.subject || "";

    if (data.templateId) {
      try {
        const template = await getEmailTemplate(db, data.templateId);
        emailHtml = renderEmailTemplate(template.html || template.body, data.variables || {}, data.siteUrl);
        
        // Render subject if it contains variables
        if (template.subject) {
          emailSubject = renderEmailTemplate(template.subject, data.variables || {}, data.siteUrl);
        }
      } catch (templateError) {
        console.error("Error rendering template:", templateError);
        // If template fails and no fallback subject/html, throw error
        if (!emailSubject || !emailHtml) {
          throw new functions.https.HttpsError(
            "internal",
            "Failed to render email template: " + templateError.message
          );
        }
      }
    }

    // Get SMTP configuration (priority: env vars → test SMTP → Firestore → Gmail default)
    const { getSMTPConfigForFunctions } = require("./config/smtp");
    const smtpConfig = await getSMTPConfigForFunctions();

    // Validate SMTP config
    if (
      !smtpConfig.host ||
      !smtpConfig.port ||
      !smtpConfig.user ||
      !smtpConfig.password
    ) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        `Incomplete SMTP configuration (source: ${smtpConfig.source || 'unknown'}). Please configure SMTP via environment variables or Firestore.`
      );
    }

    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.port === 465, // true for 465, false for other ports
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.password,
      },
      tls: {
        rejectUnauthorized: false, // Accept self-signed certificates
      },
    });

    // Prepare email options
    const mailOptions = {
      from: `"${smtpConfig.senderName || "CS Learning Hub"}" <${
        smtpConfig.user
      }>`,
      to: Array.isArray(data.to) ? data.to.join(", ") : data.to,
      subject: emailSubject,
      html: emailHtml,
      text: data.text || data.body || emailSubject, // Fallback text
    };

    // Add CC and BCC if provided
    if (data.cc) {
      mailOptions.cc = Array.isArray(data.cc) ? data.cc.join(", ") : data.cc;
    }
    if (data.bcc) {
      mailOptions.bcc = Array.isArray(data.bcc)
        ? data.bcc.join(", ")
        : data.bcc;
    }

    // Send email
    console.log("Sending email to:", mailOptions.to);
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);

    // Log successful email to Firestore
    await db
      .collection("emailLogs")
      .add({
        to: Array.isArray(data.to) ? data.to : [data.to],
        subject: emailSubject, // Use rendered subject instead of data.subject
        type: data.type || "custom", // system, class, quiz, attendance, newsletter, custom
        classId: data.classId || null,
        templateId: data.template || null,
        recipientCount: Array.isArray(data.to) ? data.to.length : 1,
        status: "sent",
        messageId: info.messageId,
        response: info.response,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        sentBy: (context.auth && context.auth.uid) || "system",
        senderEmail: (context.auth && context.auth.token && context.auth.token.email) || "system",
        metadata: data.metadata || {},
      });

    return {
      success: true,
      messageId: info.messageId,
      message: "Email sent successfully",
    };
  } catch (error) {
    console.error("Error sending email:", error);

    // Log failed email to Firestore
    try {
      await db
        .collection("emailLogs")
        .add({
          to: Array.isArray(data.to) ? data.to : [data.to],
          subject: emailSubject, // Use rendered subject instead of data.subject
          type: data.type || "custom",
          classId: data.classId || null,
          templateId: data.template || null,
          recipientCount: Array.isArray(data.to) ? data.to.length : 1,
          status: "failed",
          error: error.message,
          errorCode: error.code || "unknown",
          attemptedAt: admin.firestore.FieldValue.serverTimestamp(),
          sentBy: (context.auth && context.auth.uid) || "system",
          senderEmail: (context.auth && context.auth.token && context.auth.token.email) || "system",
          metadata: data.metadata || {},
        });
    } catch (logError) {
      console.error("Error logging failed email:", logError);
    }

    // Throw user-friendly error
    if (error.code === "EAUTH") {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Email authentication failed. Please check SMTP credentials."
      );
    } else if (error.code === "ECONNECTION") {
      throw new functions.https.HttpsError(
        "unavailable",
        "Could not connect to email server. Please check SMTP settings."
      );
    } else if (error.responseCode === 550) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid recipient email address."
      );
    } else {
      throw new functions.https.HttpsError(
        "internal",
        `Failed to send email: ${error.message}`
      );
    }
  }
});

/**
 * Test email function for SMTP configuration testing
 */
exports.testEmail = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Must be authenticated"
    );
  }

  const testEmail = data.testEmail || (context.auth && context.auth.token && context.auth.token.email);

  // Use the sendEmail function
  return exports.sendEmail.run(
    {
      to: testEmail,
      subject: "✅ CS Learning Hub - SMTP Test Email",
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #800020;">✅ Email Configuration Successful!</h2>
        <p>Congratulations! Your SMTP configuration is working correctly.</p>
        <p>You can now send email notifications to your students.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 0.9rem;">
          This is an automated test email from CS Learning Hub.<br>
          Sent at: ${new Date().toLocaleString()}
        </p>
      </div>
    `,
    },
    context
  );
});
