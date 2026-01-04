/**
 * Firebase Cloud Functions
 *
 * To deploy:
 * 1. Install Firebase CLI: npm install -g firebase-tools
 * 2. Login: firebase login
 * 3. Initialize (if not done): firebase init functions
 * 4. Deploy: firebase deploy --only functions
 *
 * To deploy this specific function:
 * firebase deploy --only functions:processScheduledReports
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { onSchedule } = require("firebase-functions/v2/scheduler");

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Scheduled Reports Processor
 * Runs on a schedule to generate and send reports
 *
 * To set up a schedule:
 * 1. Go to Firebase Console > Functions > Scheduler
 * 2. Create a new schedule
 * 3. Set the schedule (e.g., "0 8 * * *" for daily at 8 AM)
 * 4. Point it to this function
 *
 * Or use Pub/Sub with Cloud Scheduler:
 * - Create a Cloud Scheduler job
 * - Set it to publish to a Pub/Sub topic
 * - This function subscribes to that topic
 */
exports.processScheduledReports = onSchedule(
  {
    schedule: "every 1 hours", // Default: check every hour
    timeZone: "UTC",
    memory: "512MB",
    timeoutSeconds: 540,
  },
  async (event) => {
    console.log("Processing scheduled reports...");

    try {
      // Get all enabled scheduled reports that are due
      const now = admin.firestore.Timestamp.now();
      const reportsSnapshot = await db
        .collection("scheduledReports")
        .where("enabled", "==", true)
        .where("nextRunAt", "<=", now)
        .get();

      if (reportsSnapshot.empty) {
        console.log("No reports due for processing");
        return;
      }

      const reports = [];
      reportsSnapshot.forEach((doc) => {
        reports.push({ id: doc.id, ...doc.data() });
      });

      console.log(`Found ${reports.length} reports to process`);

      // Process each report
      for (const report of reports) {
        try {
          await processReport(report);

          // Update nextRunAt based on schedule
          const nextRunAt = calculateNextRun(
            report.schedule,
            report.customSchedule
          );
          await db.collection("scheduledReports").doc(report.id).update({
            lastRunAt: now,
            nextRunAt: nextRunAt,
            updatedAt: now,
          });

          console.log(`Processed report: ${report.id}`);
        } catch (error) {
          console.error(`Error processing report ${report.id}:`, error);
          // Continue with other reports even if one fails
        }
      }
    } catch (error) {
      console.error("Error in processScheduledReports:", error);
      throw error;
    }
  }
);

/**
 * Process a single report
 */
async function processReport(report) {
  const { reportType, templateId, recipients, filters = {} } = report;

  // Generate report data based on type
  let reportData;
  if (reportType === "analytics") {
    reportData = await generateAnalyticsReport(filters);
  } else if (reportType === "student-dashboard") {
    reportData = await generateStudentDashboardReport(filters);
  } else {
    throw new Error(`Unknown report type: ${reportType}`);
  }

  // Get email template
  const templateDoc = await db
    .collection("emailTemplates")
    .doc(templateId)
    .get();
  if (!templateDoc.exists) {
    throw new Error(`Template ${templateId} not found`);
  }
  const template = templateDoc.data();

  // Generate PDF/image (you'll need to install libraries like pdfkit, puppeteer, or html-pdf)
  // For now, we'll send the data as HTML
  const reportHtml = generateReportHtml(reportData, reportType, template);

  // Send email to recipients
  const emailPromises = recipients.map((email) =>
    sendReportEmail({
      to: email,
      subject: `${report.title} - ${new Date().toLocaleDateString()}`,
      html: reportHtml,
      // If you generate PDF, attach it here:
      // attachments: [{ filename: 'report.pdf', content: pdfBuffer }]
    })
  );

  await Promise.all(emailPromises);
  console.log(`Sent report to ${recipients.length} recipients`);
}

/**
 * Generate analytics report data
 */
async function generateAnalyticsReport(filters) {
  // Fetch analytics data based on filters
  // This should match what AdvancedAnalytics.jsx does
  const data = {
    programs: [],
    subjects: [],
    enrollments: [],
    attendance: [],
    marks: [],
    penalties: [],
    // ... add more data sources
  };

  // Apply filters and fetch data
  if (filters.programId) {
    const programDoc = await db
      .collection("programs")
      .doc(filters.programId)
      .get();
    if (programDoc.exists) {
      data.programs.push({ id: programDoc.id, ...programDoc.data() });
    }
  } else {
    const programsSnapshot = await db.collection("programs").get();
    programsSnapshot.forEach((doc) => {
      data.programs.push({ id: doc.id, ...doc.data() });
    });
  }

  // Add more data fetching logic here...
  // Similar to AdvancedAnalytics.jsx loadAllData function

  return data;
}

/**
 * Generate student dashboard report data
 */
async function generateStudentDashboardReport(filters) {
  // Fetch student dashboard data
  const data = {
    students: [],
    attendance: [],
    marks: [],
    penalties: [],
    participations: [],
    behaviors: [],
  };

  // Apply filters and fetch data
  // Similar to StudentDashboardPage.jsx loadDashboardData function

  return data;
}

/**
 * Generate HTML report from data
 */
function generateReportHtml(data, reportType, template) {
  // Use template HTML and inject data
  let html = template.html || template.body || "";

  // Replace template variables with actual data
  // This is a simple example - you might want to use a templating engine like Handlebars
  html = html.replace(/\{\{reportDate\}\}/g, new Date().toLocaleDateString());
  html = html.replace(/\{\{reportData\}\}/g, JSON.stringify(data, null, 2));

  // For better formatting, you could use a library like handlebars or mustache
  // Or generate a proper HTML table/chart representation

  return html;
}

/**
 * Send report email
 * Uses nodemailer directly (same as sendEmail.js)
 */
async function sendReportEmail({ to, subject, html, attachments = [] }) {
  const nodemailer = require("nodemailer");

  // Get SMTP configuration from Firestore
  const configDoc = await db.collection("config").doc("smtp").get();
  if (!configDoc.exists) {
    throw new Error("SMTP configuration not found");
  }

  const smtpConfig = configDoc.data();
  if (
    !smtpConfig.host ||
    !smtpConfig.port ||
    !smtpConfig.user ||
    !smtpConfig.password
  ) {
    throw new Error("Incomplete SMTP configuration");
  }

  // Create transporter
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

  // Send email
  const mailOptions = {
    from: smtpConfig.from || smtpConfig.user,
    to,
    subject,
    html,
    attachments,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`Email sent: ${info.messageId}`);
  return info;
}

/**
 * Calculate next run time based on schedule
 */
function calculateNextRun(schedule, customSchedule) {
  const now = new Date();
  let nextRun = new Date(now);

  if (schedule === "daily") {
    nextRun.setDate(nextRun.getDate() + 1);
    nextRun.setHours(8, 0, 0, 0); // 8 AM
  } else if (schedule === "weekly") {
    nextRun.setDate(nextRun.getDate() + 7);
    nextRun.setHours(8, 0, 0, 0);
  } else if (schedule === "custom" && customSchedule) {
    // Parse cron expression (simplified - you might want a cron parser library)
    // For now, assume it's a valid cron expression
    // You could use node-cron or similar to parse and calculate next run
    nextRun = new Date(customSchedule);
  }

  return admin.firestore.Timestamp.fromDate(nextRun);
}

/**
 * Helper function to generate PDF (optional)
 * Requires: npm install pdfkit or puppeteer
 */
async function generatePDF(html) {
  // Option 1: Using puppeteer (recommended for HTML to PDF)
  // const puppeteer = require('puppeteer');
  // const browser = await puppeteer.launch();
  // const page = await browser.newPage();
  // await page.setContent(html);
  // const pdf = await page.pdf({ format: 'A4' });
  // await browser.close();
  // return pdf;

  // Option 2: Using pdfkit (for programmatic PDF generation)
  // const PDFDocument = require('pdfkit');
  // const doc = new PDFDocument();
  // // Add content to doc
  // return doc;

  // For now, return null (no PDF)
  return null;
}
