const functions = require("firebase-functions");
const admin = require("firebase-admin");

/**
 * Firebase Cloud Function to send QR code via email
 * Sends a student's QR code to their email address
 */
exports.sendQRCodeEmail = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Must be authenticated to send QR code emails"
    );
  }

  // Validate input
  if (!data.studentId || !data.studentEmail) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing required fields: studentId, studentEmail"
    );
  }

  try {
    // Get student information
    const studentDoc = await admin
      .firestore()
      .collection("users")
      .doc(data.studentId)
      .get();

    if (!studentDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Student not found"
      );
    }

    const student = studentDoc.data();

    // Generate QR code
    const { generateStudentQRCode } = require('../client/src/utils/qrCode');
    const qrCodeDataURL = await generateStudentQRCode(student.referenceId || `STU-${student.studentNumber || student.uid.slice(-4)}`);

    if (!qrCodeDataURL) {
      throw new functions.https.HttpsError(
        "internal",
        "Failed to generate QR code"
      );
    }

    // Get SMTP configuration
    const configDoc = await admin
      .firestore()
      .collection("config")
      .doc("smtp")
      .get();

    if (!configDoc.exists) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Email configuration not found. Please configure email settings in the dashboard."
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
        "Incomplete SMTP configuration"
      );
    }

    // Create nodemailer transporter
    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransporter({
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

    // Prepare email content
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #800020; margin: 0; font-size: 24px;">🎓 Your Student QR Code</h1>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: #374151; font-size: 16px; margin: 0 0 10px 0;">
              <strong>${student.displayName || student.name || 'Student'}</strong><br>
              <span style="color: #6b7280;">ID: STU-${student.studentNumber || student.uid.slice(-4) || '0000'}</span>
            </p>
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            <img src="${qrCodeDataURL}" alt="Student QR Code" style="border: 2px solid #e5e7eb; border-radius: 8px;" />
          </div>
          
          <div style="background-color: #fffbeb; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <h3 style="color: #059669; margin: 0 0 10px 0; font-size: 16px;">📱 How to use your QR code:</h3>
            <ol style="color: #374151; font-size: 14px; line-height: 1.6; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Show this QR code to your instructor for attendance tracking</li>
              <li style="margin-bottom: 8px;">Keep it saved on your mobile device for easy access</li>
              <li style="margin-bottom: 8px;">This QR code contains your student ID and profile information</li>
            </ol>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              This is an automated email from CS Learning Hub.<br>
              If you did not request this QR code, please contact support.
            </p>
          </div>
        </div>
      </div>
    `;

    // Prepare email options
    const mailOptions = {
      from: `"${smtpConfig.senderName || "CS Learning Hub"}" <${smtpConfig.user}>`,
      to: data.studentEmail,
      subject: `🎓 Your QR Code - CS Learning Hub`,
      html: emailHtml,
      attachments: [
        {
          filename: `QR_Code_${student.displayName || student.name}_${new Date().toISOString().split('T')[0]}.png`,
          content: qrCodeDataURL.split(',')[1], // Remove data:image/png;base64, prefix
          encoding: 'base64'
        }
      ]
    };

    // Send email
    console.log("Sending QR code email to:", data.studentEmail);
    const info = await transporter.sendMail(mailOptions);
    console.log("QR code email sent successfully:", info.messageId);

    // Log successful email to Firestore
    await admin
      .firestore()
      .collection("emailLogs")
      .add({
        to: [data.studentEmail],
        subject: `🎓 Your QR Code - CS Learning Hub`,
        type: "qr_code",
        templateId: "student_qr_code",
        recipientCount: 1,
        status: "sent",
        messageId: info.messageId,
        response: info.response,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        sentBy: context.auth?.uid || "system",
        senderEmail: context.auth?.token?.email || "system",
        metadata: {
          studentId: data.studentId,
          studentName: student.displayName || student.name,
          qrCodeGenerated: true
        }
      });

    return {
      success: true,
      messageId: info.messageId,
      message: "QR code email sent successfully",
    };

  } catch (error) {
    console.error("Error sending QR code email:", error);

    // Log failed email to Firestore
    try {
      await admin
        .firestore()
        .collection("emailLogs")
        .add({
          to: [data.studentEmail],
          subject: `🎓 Your QR Code - CS Learning Hub`,
          type: "qr_code",
          templateId: "student_qr_code",
          recipientCount: 1,
          status: "failed",
          error: error.message,
          errorCode: error.code || "unknown",
          attemptedAt: admin.firestore.FieldValue.serverTimestamp(),
          sentBy: context.auth?.uid || "system",
          senderEmail: context.auth?.token?.email || "system",
          metadata: {
            studentId: data.studentId
          }
        });
    } catch (logError) {
      console.error("Error logging failed QR code email:", logError);
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
    } else {
      throw new functions.https.HttpsError(
        "internal",
        `Failed to send QR code email: ${error.message}`
      );
    }
  }
});
