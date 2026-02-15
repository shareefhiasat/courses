const functions = require("firebase-functions");
const admin = require("firebase-admin");

/**
 * Firebase Cloud Function to send QR code via email
 * Uses template system instead of hardcoded HTML
 */
exports.sendQRCodeEmail = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be authenticated to send QR code emails",
    );
  }

  // Validate input - accept new notification gateway format
  if (!data.to && !data.studentEmail) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required field: to (email)",
    );
  }

  try {
    // Extract email and template data
    const to = data.to || data.studentEmail;
    const templateId = data.templateId || "qr_code_student";
    const variables = data.variables || {};


    // Fetch template from Firestore
    const templateDoc = await admin
        .firestore()
        .collection("emailTemplates")
        .where("id", "==", templateId)
        .limit(1)
        .get();

    if (templateDoc.empty) {
      console.error("Template not found:", templateId);
      throw new functions.https.HttpsError(
          "not-found",
          `Email template not found: ${templateId}`,
      );
    }

    const template = templateDoc.docs[0].data();

    // Replace variables in template
    const replaceVariables = (text, vars) => {
      if (!text) return "";
      let result = text;
      Object.entries(vars).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, "g");
        result = result.replace(regex, value || "");
      });
      return result;
    };

    // Process template content
    const subject = replaceVariables(template.subject, variables);
    const html = replaceVariables(template.html, variables);
    const text = replaceVariables(template.text || "", variables);

    // Get SMTP configuration
    const configDoc = await admin
        .firestore()
        .collection("config")
        .doc("smtp")
        .get();

    if (!configDoc.exists) {
      throw new functions.https.HttpsError(
          "failed-precondition",
          "Email configuration not found. " +
          "Please configure email settings in the dashboard.",
      );
    }

    const smtpConfig = configDoc.data();

    // Validate SMTP config
    if (
      !smtpConfig.host ||
      !smtpConfig.port ||
      !smtpConfig.user ||
      !smtpConfig.password
    ) {
      throw new functions.https.HttpsError(
          "failed-precondition",
          "Incomplete SMTP configuration",
      );
    }

    // Create nodemailer transporter
    console.log("DEBUG: Creating nodemailer transporter...");
    const nodemailer = require("nodemailer");
    console.log("DEBUG: nodemailer loaded, creating transport...");
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
    console.log("DEBUG: Transporter created successfully");

    // Prepare email options using template
    const mailOptions = {
      from: `"${smtpConfig.senderName || "QAF Learning Hub"}" ` +
        `<${smtpConfig.user}>`,
      to: to,
      subject: subject,
      html: html,
      text: text,
    };

    const info = await transporter.sendMail(mailOptions);


    return {
      success: true,
      messageId: info.messageId,
      templateId: templateId,
      subject: subject,
    };
  } catch (error) {
    console.error("Error in sendQRCodeEmail:", error);
    throw new functions.https.HttpsError(
        "internal",
        error.message,
    );
  }
});
