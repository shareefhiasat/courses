const { beforeUserCreated, beforeUserSignedIn } = require('firebase-functions/v2/identity');
const { onCall } = require('firebase-functions/v2/https');
const { onRequest } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { onDocumentCreated, onDocumentDeleted } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { defineString } = require('firebase-functions/params');
const nodemailer = require('nodemailer');
const { createHomeworkSubmission } = require('./upload');

// Environment variables for Gmail SMTP and site URL
const gmailEmail = defineString('GMAIL_EMAIL');
const gmailPassword = defineString('GMAIL_PASSWORD');
const siteUrlParam = defineString('SITE_URL');

const { getAuth } = require('firebase-admin/auth');
const crypto = require('crypto');

// Initialize Nodemailer transporter once the params are loaded
let mailTransport;

async function initializeMailTransport() {
  if (mailTransport) return mailTransport;
  
  // Try to get SMTP config from Firestore first
  try {
    const smtpDoc = await db.collection('config').doc('smtp').get();
    if (smtpDoc.exists) {
      const smtpConfig = smtpDoc.data();
      mailTransport = nodemailer.createTransport({
        host: smtpConfig.host || 'smtp.gmail.com',
        port: smtpConfig.port || 587,
        secure: smtpConfig.secure || false,
        auth: {
          user: smtpConfig.user || gmailEmail.value(),
          pass: smtpConfig.password || gmailPassword.value(),
        },
      });

      return mailTransport;
    }
  } catch (error) {
    console.warn('Could not load SMTP config from Firestore, using environment variables');
  }
  
  // Fallback to environment variables
  mailTransport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailEmail.value(),
      pass: gmailPassword.value(),
    },
  });
  return mailTransport;
}

initializeApp();
const db = getFirestore();

// -------------------------------
// Attendance MVP (QR with rotation)
// -------------------------------
const ATTENDANCE_SECRET = defineString('ATTENDANCE_SECRET');

function signToken(payload, ttlSeconds = 30) {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const body = { ...payload, exp };
  const data = Buffer.from(JSON.stringify(body)).toString('base64url');
  const secret = ATTENDANCE_SECRET.value();
  const sig = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64url');
  return `${data}.${sig}`;
}

function verifyToken(token) {
  const [data, sig] = (token || '').split('.');
  if (!data || !sig) return { ok: false, error: 'bad_token' };
  const secret = ATTENDANCE_SECRET.value();
  const expect = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  if (sig !== expect) return { ok: false, error: 'sig_mismatch' };
  let body;
  try { body = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')); } catch { return { ok: false, error: 'bad_token' }; }
  if ((body.exp || 0) < Math.floor(Date.now() / 1000)) return { ok: false, error: 'expired' };
  return { ok: true, body };
}

async function readAttendanceConfig() {
  try {
    const snap = await db.collection('config').doc('attendance').get();
    if (snap.exists) return snap.data();
  } catch {}
  return { rotationSeconds: 30, sessionMinutes: 15, strictDeviceBinding: true };
}

exports.attendanceCreateSession = onCall(async (req) => {
  const { classId, subjectId } = req.data || {};
  if (!req.auth) throw new Error('auth_required');
  if (!classId) throw new Error('classId_required');
  const cfg = await readAttendanceConfig();
  const now = new Date();
  const end = new Date(now.getTime() + (cfg.sessionMinutes || 15) * 60 * 1000);
  const docRef = await db.collection('attendanceSessions').add({
    classId,
    subjectId: subjectId || null,
    createdBy: req.auth.uid,
    createdAt: FieldValue.serverTimestamp(),
    status: 'open',
    rotationSeconds: cfg.rotationSeconds || 30,
    strictDeviceBinding: cfg.strictDeviceBinding !== false,
    endAt: end,
  });
  // set first token
  const token = signToken({ sid: docRef.id, classId }, cfg.rotationSeconds || 30);
  await docRef.update({ token, tokenIssuedAt: FieldValue.serverTimestamp() });
  return { sessionId: docRef.id, token, rotationSeconds: cfg.rotationSeconds, endAt: end.toISOString() };
});

exports.attendanceRotateToken = onSchedule({ schedule: 'every 1 minutes', timeZone: 'UTC' }, async () => {
  const open = await db.collection('attendanceSessions').where('status', '==', 'open').get();
  const updates = [];
  open.forEach((d) => {
    const sid = d.id; const data = d.data();
    const rot = data.rotationSeconds || 30;
    const token = signToken({ sid, classId: data.classId }, rot);
    updates.push(d.ref.update({ token, tokenIssuedAt: FieldValue.serverTimestamp() }));
  });
  await Promise.all(updates);
});

exports.attendanceScan = onCall(async (req) => {
  const { sid, token, deviceHash, status, reason, note } = req.data || {};
  if (!req.auth) throw new Error('auth_required');
  if (!sid || !token) throw new Error('sid_and_token_required');
  const v = verifyToken(token);
  if (!v.ok) throw new Error(`invalid_token:${v.error}`);
  const docRef = db.collection('attendanceSessions').doc(sid);
  const snap = await docRef.get();
  if (!snap.exists) throw new Error('session_not_found');
  const s = snap.data();
  if (s.status !== 'open') throw new Error('session_closed');
  if (s.strictDeviceBinding) {
    const markRef = docRef.collection('marks').doc(req.auth.uid);
    const mark = await markRef.get();
    const saved = mark.exists ? (mark.data().deviceHash || null) : null;
    if (saved && deviceHash && saved !== deviceHash) {
      // block and flag anomaly
      await docRef.collection('events').add({
        type: 'anomaly_device_change', uid: req.auth.uid, at: FieldValue.serverTimestamp(), saved, deviceHash
      });
      throw new Error('device_change_blocked');
    }
  }
  // record attendance with optional leave status
  const markData = {
    uid: req.auth.uid,
    status: status || 'present', // present|absent|late|leave
    deviceHash: deviceHash || null,
    at: FieldValue.serverTimestamp(),
  };
  if (status === 'leave' && reason) {
    markData.reason = reason; // medical|official|other
  }
  if (note) {
    markData.note = note;
  }
  await docRef.collection('marks').doc(req.auth.uid).set(markData, { merge: true });
  return { ok: true };
});

exports.attendanceCloseSession = onCall(async (req) => {
  const { sid } = req.data || {};
  if (!req.auth) throw new Error('auth_required');
  if (!sid) throw new Error('sid_required');
  const ref = db.collection('attendanceSessions').doc(sid);
  await ref.update({ status: 'closed', closedAt: FieldValue.serverTimestamp() });
  return { ok: true };
});

// Manual attendance override (for HR, Instructor, Admin, Super Admin)
exports.attendanceManualOverride = onCall(async (req) => {
  const { sid, uid, status, reason, note } = req.data || {};
  if (!req.auth) throw new Error('auth_required');
  if (!sid || !uid || !status) throw new Error('sid_uid_status_required');
  
  // Check permissions: admin, HR, instructor, or super admin
  let hasPermission = false;
  try {
    // Check admin claim
    const token = await getAuth().verifyIdToken(req.auth.token);
    if (token.admin) {
      hasPermission = true;
    } else {
      // Check user doc for HR, instructor, or super admin
      const userDoc = await db.collection('users').doc(req.auth.uid).get();
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.isHR || userData.isInstructor || userData.isSuperAdmin || userData.role === 'hr' || userData.role === 'instructor') {
          hasPermission = true;
        }
      }
      // Also check allowlist for admin emails
      if (!hasPermission) {
        const allowlistDoc = await db.collection('config').doc('allowlist').get();
        if (allowlistDoc.exists()) {
          const { adminEmails = [] } = allowlistDoc.data();
          const email = (req.auth.token.email || '').toLowerCase();
          hasPermission = adminEmails.some(e => (e || '').toLowerCase() === email);
        }
      }
    }
  } catch (err) {
    console.error('Permission check error:', err);
  }
  
  if (!hasPermission) throw new Error('permission_denied');
  
  // Get session
  const sessionRef = db.collection('attendanceSessions').doc(sid);
  const sessionSnap = await sessionRef.get();
  if (!sessionSnap.exists()) throw new Error('session_not_found');
  
  // Override mark
  const markData = {
    uid: uid,
    status: status, // present|absent|late|leave
    overriddenBy: req.auth.uid,
    overriddenAt: FieldValue.serverTimestamp(),
    manual: true,
  };
  if (reason) markData.reason = reason;
  if (note) markData.note = note;
  
  await sessionRef.collection('marks').doc(uid).set(markData, { merge: true });
  
  // Log event
  await sessionRef.collection('events').add({
    type: 'manual_override',
    uid: uid,
    status: status,
    actor: req.auth.uid,
    reason: reason || null,
    note: note || null,
    at: FieldValue.serverTimestamp(),
  });
  
  return { ok: true };
});

// HTTP wrapper for curl/testing: Authorization: Bearer <Firebase ID token>
exports.sendEmailHttp = onRequest(async (req, res) => {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
    if (!token) return res.status(401).json({ error: 'Missing Authorization Bearer token' });

    const { getAuth } = require('firebase-admin/auth');
    let decoded;
    try {
      decoded = await getAuth().verifyIdToken(token);
    } catch (e) {
      return res.status(401).json({ error: 'Invalid ID token' });
    }

    // Admin check: custom claim OR allowlist adminEmails
    let isAdminUser = !!decoded.admin;
    if (!isAdminUser) {
      try {
        const allowlistDoc = await db.collection('config').doc('allowlist').get();
        if (allowlistDoc.exists) {
          const { adminEmails = [] } = allowlistDoc.data();
          const email = (decoded.email || '').toLowerCase();
          isAdminUser = adminEmails.some(e => (e || '').toLowerCase() === email);
        }
      } catch {}
    }
    if (!isAdminUser) return res.status(403).json({ error: 'Admin access required' });

    const data = req.body?.data || req.body || {};
    const { to, cc, bcc, subject, body, html, text, type } = data;
    const recipients = Array.isArray(to) ? to : (to ? [to] : []);
    if (recipients.length === 0) return res.status(400).json({ error: 'At least one recipient is required' });
    if (!subject) return res.status(400).json({ error: 'Subject is required' });
    if (!body && !html && !text) return res.status(400).json({ error: 'Email content (body, html, or text) is required' });

    const transporter = await initializeMailTransport();
    const smtpDoc = await db.collection('config').doc('smtp').get();
    const senderName = smtpDoc.exists ? smtpDoc.data().senderName || 'CS Learning Hub' : 'CS Learning Hub';
    const senderEmail = smtpDoc.exists ? smtpDoc.data().user : gmailEmail.value();

    const emailHtml = html || `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">💻 CS Learning Hub</h1>
        </div>
        <div style="padding: 20px; background: #f9f9f9;">
          <div style="background: white; padding: 20px; border-radius: 8px;">
            ${(body || text || '').replace(/\n/g, '<br>')}
          </div>
        </div>
        <div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p>This email was sent from CS Learning Hub</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `${'${'}senderName}` + ` <${'${'}senderEmail}>`,
      to: recipients.join(', '),
      cc: cc && (Array.isArray(cc) ? cc.join(', ') : cc) || undefined,
      bcc: bcc && (Array.isArray(bcc) ? bcc.join(', ') : bcc) || undefined,
      subject,
      html: emailHtml,
      text: text || body,
    });

    await db.collection('emailLogs').add({
      sentBy: decoded.uid,
      sentAt: FieldValue.serverTimestamp(),
      to: recipients,
      cc: cc || [],
      bcc: bcc || [],
      subject,
      type: type || 'custom',
      status: 'sent',
      recipientCount: recipients.length,
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('sendEmailHttp error:', error);
    try {
      await db.collection('emailLogs').add({
        sentBy: 'unknown',
        sentAt: FieldValue.serverTimestamp(),
        to: [],
        subject: 'unknown',
        type: 'custom',
        status: 'failed',
        error: error.message,
      });
    } catch {}
    return res.status(500).json({ error: error.message || 'Internal error' });
  }
});

// Server-side allowlist enforcement
exports.beforeUserCreated = beforeUserCreated(async (event) => {
  const { email } = event.data;
  
  try {
    // Get allowlist from Firestore config
    const allowlistDoc = await db.collection('config').doc('allowlist').get();
    
    if (!allowlistDoc.exists) {
      console.warn('No allowlist config found, blocking all signups');
      throw new Error('Registration is currently closed');
    }
    
    const allowlist = allowlistDoc.data();
    const allowedEmails = allowlist.allowedEmails || [];
    const adminEmails = allowlist.adminEmails || [];
    
    // Check if email is in allowlist OR adminEmails (case-insensitive)
    const isAllowed = [...allowedEmails, ...adminEmails].some(allowed => 
      allowed.toLowerCase() === email.toLowerCase()
    );
    
    if (!isAllowed) {
      console.log(`Blocked signup attempt for: ${email}`);
      console.log(`Allowed emails:`, allowedEmails);
      console.log(`Admin emails:`, adminEmails);
      throw new Error('This email is not authorized to register');
    }
    
    console.log(`Approved signup for: ${email}`);
    
    // Set admin custom claim if email is in adminEmails
    const isAdmin = adminEmails.some(admin => 
      admin.toLowerCase() === email.toLowerCase()
    );
    
    if (isAdmin) {
      return {
        customClaims: {
          admin: true
        }
      };
    }
    
    return {};
    
  } catch (error) {
    console.error('Error in beforeUserCreated:', error);
    throw error;
  }
});

// Callable bootstrap: ensure the signed-in user gets admin claim
// if their email is present in config/allowlist.adminEmails.
exports.ensureAdminClaim = onCall(async (request) => {
  const { auth } = request;
  if (!auth) throw new Error('Authentication required');

  const uid = auth.uid;
  const email = auth.token.email || '';

  try {
    const allowlistDoc = await db.collection('config').doc('allowlist').get();
    if (!allowlistDoc.exists) throw new Error('Allowlist not configured');
    const { adminEmails = [] } = allowlistDoc.data();
    const listed = adminEmails.some(e => (e || '').toLowerCase() === email.toLowerCase());
    if (!listed) throw new Error('Your email is not in adminEmails');

    await getAuth().setCustomUserClaims(uid, { ...(auth.token || {}), admin: true });
    return { success: true };
  } catch (err) {
    console.error('ensureAdminClaim error', err);
    throw new Error(err.message || 'Failed to set admin claim');
  }
});

// Paginated activities query for admin dashboard
// Triggers when a student is enrolled in a class
exports.onEnrollmentCreated = onDocumentCreated("enrollments/{enrollmentId}", (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    console.log("No data associated with the event");
    return;
  }
  const data = snapshot.data();
  const userId = data.userId;
  const classId = data.classId;

  const userRef = db.collection('users').doc(userId);
  return userRef.update({
    enrolledClasses: FieldValue.arrayUnion(classId)
  });
});

// Triggers when a student is unenrolled from a class
exports.onEnrollmentDeleted = onDocumentDeleted("enrollments/{enrollmentId}", (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    console.log("No data associated with the event");
    return;
  }
  const data = snapshot.data();
  const userId = data.userId;
  const classId = data.classId;

  const userRef = db.collection('users').doc(userId);
  return userRef.update({
    enrolledClasses: FieldValue.arrayRemove(classId)
  });
});

// Scheduled function to check for unread chats and send notifications
exports.sendUnreadChatNotifications = onSchedule("every 24 hours", async (event) => {
  initializeMailTransport(); // Ensure transporter is ready
  const SITE_URL = process.env.SITE_URL || 'https://cs-learning-hub.web.app';
  const usersSnapshot = await db.collection('users').get();
  if (usersSnapshot.empty) {
    console.log("No users found.");
    return;
  }

  const twelveHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  for (const userDoc of usersSnapshot.docs) {
    const user = userDoc.data();
    const userId = userDoc.id;
    let unreadCount = 0;

    // Get all chats this user is part of (simplified)
    // A more robust solution would query an 'enrollments' or 'chat_members' collection
    const enrolledClasses = user.enrolledClasses || [];
    const chatIds = ['global', ...enrolledClasses];

    for (const chatId of chatIds) {
      const messagesRef = db.collection(`chats/${chatId}/messages`);
      const unreadQuery = messagesRef
        .where('timestamp', '>', user.lastNotified || twelveHoursAgo)
        .where('senderId', '!=', userId); // Don't count own messages

      const unreadSnapshot = await unreadQuery.get();
      unreadCount += unreadSnapshot.size;
    }

    if (unreadCount > 0) {
      const mailOptions = {
        from: `"LMS Platform" <${gmailEmail.value()}>`,
        to: user.email,
        subject: "You have unread messages",
        html: `<p>You have ${unreadCount} unread messages waiting for you. Please log in to view them.</p>`,
      };

      try {
        await mailTransport.sendMail(mailOptions);
        console.log(`Sent chat notification to ${user.email}`);
        // Update user's lastNotified timestamp
        await db.collection('users').doc(userId).update({ lastNotified: new Date() });
      } catch (error) {
        console.error(`Failed to send chat notification to ${user.email}:`, error);
      }
    }
  }
});

exports.getActivitiesPaginated = onCall(async (request) => {
  const { auth, data } = request;
  
  if (!auth || !auth.token.admin) {
    throw new Error('Admin access required');
  }
  
  try {
    const { page = 1, limit = 10, filters = {}, sortBy = 'order' } = data;
    let query = db.collection('activities');
    
    // Apply filters
    if (filters.course) query = query.where('course', '==', filters.course);
    if (filters.type) query = query.where('type', '==', filters.type);
    if (filters.difficulty) query = query.where('difficulty', '==', filters.difficulty);
    
    // Apply sorting
    query = query.orderBy(sortBy);
    
    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.offset(offset).limit(limit);
    
    const snapshot = await query.get();
    const activities = [];
    snapshot.forEach(doc => {
      activities.push({ id: doc.id, ...doc.data() });
    });
    
    // Get total count for pagination info
    let countQuery = db.collection('activities');
    if (filters.course) countQuery = countQuery.where('course', '==', filters.course);
    if (filters.type) countQuery = countQuery.where('type', '==', filters.type);
    if (filters.difficulty) countQuery = countQuery.where('difficulty', '==', filters.difficulty);
    
    const countSnapshot = await countQuery.get();
    const total = countSnapshot.size;
    
    return {
      activities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error getting paginated activities:', error);
    throw new Error('Failed to fetch activities');
  }
});

// Allow sign-in for all users (email verification disabled)
// Users are manually added to allowlist, so verification is not required
exports.beforeUserSignedIn = beforeUserSignedIn(async (event) => {
  const { email } = event.data || {};

  try {
    console.log(`User signing in: ${email}`);
    // Allow all sign-ins - no email verification required
    return {};
  } catch (err) {
    console.error('beforeSignIn error:', err);
    throw err;
  }
});

// Callable function to send emails (admin only)
exports.sendEmail = onCall(async (request) => {
  const { auth, data } = request;
  
  if (!auth) {
    throw new Error('Authentication required');
  }
  
  // Check if user has admin claim
  if (!auth.token.admin) {
    throw new Error('Admin access required');
  }
  
  const { to, cc, bcc, subject, body, html, text, type } = data;
  
  // Support both array and string for 'to'
  const recipients = Array.isArray(to) ? to : [to];
  
  if (!recipients || recipients.length === 0) {
    throw new Error('At least one recipient is required');
  }
  
  if (!subject) {
    throw new Error('Subject is required');
  }
  
  if (!body && !html && !text) {
    throw new Error('Email content (body, html, or text) is required');
  }
  
  try {
    const transporter = await initializeMailTransport();
    
    // Get sender info from SMTP config or use default
    const smtpDoc = await db.collection('config').doc('smtp').get();
    const senderName = smtpDoc.exists ? smtpDoc.data().senderName || 'CS Learning Hub' : 'CS Learning Hub';
    const senderEmail = smtpDoc.exists ? smtpDoc.data().user : gmailEmail.value();
    
    // Use provided HTML or wrap body in template
    const emailHtml = html || `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">💻 CS Learning Hub</h1>
        </div>
        <div style="padding: 20px; background: #f9f9f9;">
          <div style="background: white; padding: 20px; border-radius: 8px;">
            ${(body || text || '').replace(/\n/g, '<br>')}
          </div>
        </div>
        <div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p>This email was sent from CS Learning Hub</p>
        </div>
      </div>
    `;
    
    const mailOptions = {
      from: `${senderName} <${senderEmail}>`,
      to: recipients.join(', '),
      cc: cc && cc.length > 0 ? (Array.isArray(cc) ? cc.join(', ') : cc) : undefined,
      bcc: bcc && bcc.length > 0 ? (Array.isArray(bcc) ? bcc.join(', ') : bcc) : undefined,
      subject: subject,
      html: emailHtml,
      text: text || body
    };
    
    await transporter.sendMail(mailOptions);
    
    // Log email sent
    await db.collection('emailLogs').add({
      sentBy: auth.uid,
      sentAt: FieldValue.serverTimestamp(),
      to: recipients,
      cc: cc || [],
      bcc: bcc || [],
      subject: subject,
      type: type || 'custom',
      status: 'sent',
      recipientCount: recipients.length
    });
    
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Log failed email
    await db.collection('emailLogs').add({
      sentBy: auth.uid,
      sentAt: FieldValue.serverTimestamp(),
      to: recipients,
      subject: subject,
      type: type || 'custom',
      status: 'failed',
      error: error.message,
      recipientCount: recipients.length
    });
    
    throw new Error('Failed to send email: ' + error.message);
  }
});

exports.createHomeworkSubmission = createHomeworkSubmission;

// Callable function to manage allowlist (admin only)
exports.updateAllowlist = onCall(async (request) => {
  const { auth, data } = request;
  
  if (!auth) {
    throw new Error('Authentication required');
  }
  
  // Check if user has admin claim
  if (!auth.token.admin) {
    throw new Error('Admin access required');
  }
  
  try {
    const { allowedEmails, adminEmails } = data;
    
    await db.collection('config').doc('allowlist').set({
      allowedEmails: allowedEmails || [],
      adminEmails: adminEmails || [],
      updatedAt: new Date(),
      updatedBy: auth.uid
    }, { merge: true });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating allowlist:', error);
    throw new Error('Failed to update allowlist');
  }
});

// Admin send password reset email (admin only) - SIMPLE VERSION
exports.adminSendPasswordReset = onCall(async (request) => {
  const { auth, data } = request;
  
  if (!auth) {
    throw new Error('Authentication required');
  }
  
  // Check admin
  let isAdmin = false;
  try {
    const allowlistDoc = await db.collection('config').doc('allowlist').get();
    if (allowlistDoc.exists) {
      const { adminEmails = [] } = allowlistDoc.data();
      const email = (auth.token.email || '').toLowerCase();
      isAdmin = adminEmails.some(e => (e || '').toLowerCase() === email);
    }
  } catch (err) {
    console.error('Error checking admin:', err);
  }
  
  if (!isAdmin) {
    throw new Error('Admin access required');
  }
  
  const { email } = data;
  if (!email) {
    throw new Error('Email is required');
  }
  
  try {
    // Generate reset link using Admin SDK
    const resetLink = await getAuth().generatePasswordResetLink(email);
    
    console.log('Password reset link generated for:', email);
    return { success: true, message: 'Password reset link generated', resetLink };
  } catch (error) {
    console.error('Error generating reset link:', error);
    throw new Error('Failed to generate reset link: ' + error.message);
  }
});

// Send welcome email on signup
exports.sendWelcomeEmail = onCall(async (request) => {
  const { data } = request;
  const { email, displayName, userId } = data;
  
  if (!email) {
    throw new Error('Email is required');
  }
  
  try {
    console.log('Sending welcome email to:', email);
    
    const emailEnabled = await isEmailEnabled(db, 'welcomeSignup');
    if (!emailEnabled) {
      console.log('Welcome emails are disabled');
      return { success: true, message: 'Welcome emails are disabled' };
    }
    
    const settingsDoc = await db.collection('config').doc('emailSettings').get();
    const templateId = settingsDoc.exists 
      ? settingsDoc.data().templates?.welcomeSignup || 'welcome_signup_default'
      : 'welcome_signup_default';
    
    await sendTemplatedEmail(
      templateId,
      email,
      {
        recipientName: displayName || email.split('@')[0],
        userEmail: email,
        displayName: displayName || email.split('@')[0],
        platformUrl: 'https://main-one-32026.web.app',
        siteName: 'CS Learning Hub',
        currentDate: new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Qatar' })
      },
      'welcomeSignup',
      { userId: userId || null }
    );
    
    console.log('Welcome email sent successfully');
    return { success: true, message: 'Welcome email sent' };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw new Error('Failed to send welcome email: ' + error.message);
  }
});

// Test SMTP configuration (admin only)
exports.testSMTP = onCall(async (request) => {
  const { auth, data } = request;
  
  if (!auth) {
    throw new Error('Authentication required');
  }
  
  // Check admin via claim or allowlist
  let isAdminUser = !!auth.token.admin;
  if (!isAdminUser) {
    try {
      const allowlistDoc = await db.collection('config').doc('allowlist').get();
      if (allowlistDoc.exists) {
        const { adminEmails = [] } = allowlistDoc.data();
        const email = (auth.token.email || '').toLowerCase();
        isAdminUser = adminEmails.some(e => (e || '').toLowerCase() === email);
      }
    } catch {}
  }
  
  if (!isAdminUser) {
    throw new Error('Admin access required');
  }
  
  const { to } = data;
  const recipient = to || auth.token.email;
  
  if (!recipient) {
    throw new Error('Recipient email is required');
  }
  
  try {
    const transporter = await initializeMailTransport();
    const smtpDoc = await db.collection('config').doc('smtp').get();
    const senderName = smtpDoc.exists ? smtpDoc.data().senderName || 'CS Learning Hub' : 'CS Learning Hub';
    const senderEmail = smtpDoc.exists ? smtpDoc.data().user : gmailEmail.value();
    
    await transporter.sendMail({
      from: `${senderName} <${senderEmail}>`,
      to: recipient,
      subject: '✅ SMTP Test - Configuration Working!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">✅ SMTP Test Successful!</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #667eea; margin-top: 0;">Your SMTP configuration is working correctly!</h2>
              <p style="color: #555; line-height: 1.6;">This is a test email sent from your CS Learning Hub dashboard to verify that your SMTP settings are configured properly.</p>
              <div style="background: #f0f8ff; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0;">
                <p style="margin: 0; color: #333;"><strong>Configuration Details:</strong></p>
                <p style="margin: 5px 0; color: #666;">Sender: ${senderName}</p>
                <p style="margin: 5px 0; color: #666;">Email: ${senderEmail}</p>
                <p style="margin: 5px 0; color: #666;">Recipient: ${recipient}</p>
              </div>
              <p style="color: #555;">You can now send emails to your students with confidence! 🎉</p>
            </div>
          </div>
          <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
            <p>This is an automated test email from CS Learning Hub</p>
            <p>Sent at ${new Date().toLocaleString('en-GB')}</p>
          </div>
        </div>
      `
    });
    
    return { success: true, message: 'Test email sent successfully!' };
  } catch (error) {
    console.error('SMTP test error:', error);
    return { success: false, error: error.message || 'Failed to send test email' };
  }
});

// Import email rendering utilities
const { renderEmailTemplate, getEmailTemplate, isEmailEnabled, logEmail } = require('./emailRenderer');

/**
 * Send templated email with variable replacement
 * @param {string} templateId - Template ID from emailTemplates collection
 * @param {string|string[]} recipients - Email address(es)
 * @param {object} variables - Variables to replace in template
 * @param {string} triggerType - Type of trigger (for logging)
 * @param {object} metadata - Additional metadata for logging
 */
async function sendTemplatedEmail(templateId, recipients, variables = {}, triggerType = 'custom', metadata = {}) {
  try {
    // Get template
    const template = await getEmailTemplate(db, templateId);
    
    // Render HTML with variables
    const htmlBody = renderEmailTemplate(template.html, variables);
    const subject = renderEmailTemplate(template.subject, variables);
    
    // Get SMTP config
    const transporter = await initializeMailTransport();
    const smtpDoc = await db.collection('config').doc('smtp').get();
    const senderName = smtpDoc.exists ? smtpDoc.data().senderName || 'CS Learning Hub' : 'CS Learning Hub';
    const senderEmail = smtpDoc.exists ? smtpDoc.data().user : gmailEmail.value();
    
    // Prepare recipients
    const recipientList = Array.isArray(recipients) ? recipients : [recipients];
    
    // Send email
    await transporter.sendMail({
      from: `${senderName} <${senderEmail}>`,
      to: recipientList.join(', '),
      subject: subject,
      html: htmlBody
    });
    
    // Log email
    await logEmail(db, {
      type: triggerType,
      templateId: templateId,
      subject: subject,
      to: recipientList,
      from: senderEmail,
      senderName: senderName,
      variables: variables,
      htmlBody: htmlBody,
      status: 'sent',
      metadata: metadata
    });
    
    console.log(`Email sent successfully to ${recipientList.length} recipient(s)`);
    return { success: true, recipients: recipientList.length };
    
  } catch (error) {
    console.error('Error sending templated email:', error);
    
    // Log failed email
    try {
      await logEmail(db, {
        type: triggerType,
        templateId: templateId,
        to: Array.isArray(recipients) ? recipients : [recipients],
        status: 'failed',
        error: error.message,
        metadata: metadata
      });
    } catch (logError) {
      console.error('Error logging failed email:', logError);
    }
    
    throw error;
  }
}

// Export for use in other functions
module.exports.sendTemplatedEmail = sendTemplatedEmail;

// Send a test email for a specific template to the authenticated user's email
exports.sendTestEmailTemplate = onCall(async (request) => {
  const { auth, data } = request;
  if (!auth) {
    throw new Error('Authentication required');
  }

  const toEmail = auth.token.email;
  if (!toEmail) {
    throw new Error('User email not found');
  }

  const { templateId, variables } = data || {};
  if (!templateId) {
    throw new Error('templateId is required');
  }

  try {
    await sendTemplatedEmail(
      templateId,
      toEmail,
      variables || {},
      'test',
      { by: auth.uid || null }
    );

    return { success: true };
  } catch (error) {
    console.error('Error sending test email:', error);
    throw new Error('Failed to send test email: ' + error.message);
  }
});

// ============================================================================
// EMAIL TRIGGERS
// ============================================================================

// Trigger: When announcement is created
exports.onAnnouncementCreated = onDocumentCreated('announcements/{announcementId}', async (event) => {
  const announcement = event.data.data();
  const announcementId = event.params.announcementId;
  
  try {
    // Check if email notifications are enabled
    const emailEnabled = await isEmailEnabled(db, 'announcements');
    if (!emailEnabled) {
      console.log('Announcement emails are disabled');
      return;
    }
    
    // Get email settings to find template ID
    const settingsDoc = await db.collection('config').doc('emailSettings').get();
    const templateId = settingsDoc.exists 
      ? settingsDoc.data().announcements?.template || 'announcement_default'
      : 'announcement_default';
    
    // Get all users to send email to
    const usersSnapshot = await db.collection('users').get();
    const recipients = [];
    
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      if (userData.email) {
        recipients.push(userData.email);
      }
    });
    
    if (recipients.length === 0) {
      console.log('No recipients found');
      return;
    }
    
    // Prepare variables for template
    // Prefer Firestore-configured base URL, then functions param, then default
    let siteUrl = 'https://main-one-32026.web.app';
    try {
      const siteDoc = await db.collection('config').doc('site').get();
      if (siteDoc.exists && siteDoc.data()?.baseUrl) {
        siteUrl = siteDoc.data().baseUrl;
      } else if (siteUrlParam.value()) {
        siteUrl = siteUrlParam.value();
      }
    } catch {}
    const variables = {
      title: announcement.title_en || announcement.title || 'New Announcement',
      title_ar: announcement.title_ar || announcement.title || 'إعلان جديد',
      content: announcement.content_en || announcement.content || '',
      content_ar: announcement.content_ar || announcement.content || '',
      dateTime: announcement.createdAt || new Date(),
      link: `${siteUrl}/`,
      platformUrl: `${siteUrl}/`,
      siteUrl: `${siteUrl}/`
    };
    
    // Send email to all recipients (in batches to avoid rate limits)
    const batchSize = 50;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      for (const recipient of batch) {
        try {
          await sendTemplatedEmail(
            templateId,
            recipient,
            {
              ...variables,
              recipientName: recipient.split('@')[0] // Extract name from email
            },
            'announcement',
            { announcementId: announcementId }
          );
        } catch (error) {
          console.error(`Failed to send to ${recipient}:`, error);
          // Continue with other recipients
        }
      }
      
      // Small delay between batches
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`Announcement emails sent to ${recipients.length} recipients`);
    
  } catch (error) {
    console.error('Error in onAnnouncementCreated:', error);
  }
});

// Trigger: When activity is created
exports.onActivityCreated = onDocumentCreated('activities/{activityId}', async (event) => {
  const activity = event.data.data();
  const activityId = event.params.activityId;
  
  try {
    // Check if email notifications are enabled
    const emailEnabled = await isEmailEnabled(db, 'activities');
    if (!emailEnabled) {
      console.log('Activity emails are disabled');
      return;
    }
    
    // Get email settings
    const settingsDoc = await db.collection('config').doc('emailSettings').get();
    const templateId = settingsDoc.exists 
      ? settingsDoc.data().activities?.template || 'activity_default'
      : 'activity_default';
    
    // Get all users (or filter by class if needed)
    const usersSnapshot = await db.collection('users').get();
    const recipients = [];
    
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      if (userData.email && userData.role !== 'admin') {
        recipients.push({
          email: userData.email,
          name: userData.displayName || userData.email.split('@')[0]
        });
      }
    });
    
    if (recipients.length === 0) {
      console.log('No recipients found');
      return;
    }
    
    // Get course name
    let courseName = activity.course || 'General';
    let courseName_ar = activity.course || 'عام';
    
    try {
      const courseDoc = await db.collection('courses').doc(activity.course).get();
      if (courseDoc.exists) {
        courseName = courseDoc.data().name_en || courseName;
        courseName_ar = courseDoc.data().name_ar || courseName_ar;
      }
    } catch (e) {
      console.log('Could not fetch course name:', e);
    }
    
    // Prepare variables
    const variables = {
      activityTitle: activity.title_en || activity.title || 'New Activity',
      activityTitle_ar: activity.title_ar || activity.title || 'نشاط جديد',
      activityType: activity.type || 'activity',
      course: courseName,
      course_ar: courseName_ar,
      description: activity.description_en || activity.description || '',
      description_ar: activity.description_ar || activity.description || '',
      dueDateTime: activity.dueDate || null,
      maxScore: activity.maxScore || 100,
      difficulty: activity.difficulty || 'intermediate',
      link: `${process.env.SITE_URL || 'https://your-domain.com'}/activities`
    };
    
    // Send emails in batches
    const batchSize = 50;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      for (const recipient of batch) {
        try {
          await sendTemplatedEmail(
            templateId,
            recipient.email,
            {
              ...variables,
              recipientName: recipient.name
            },
            'activity',
            { activityId: activityId }
          );
        } catch (error) {
          console.error(`Failed to send to ${recipient.email}:`, error);
        }
      }
      
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`Activity emails sent to ${recipients.length} recipients`);
    
  } catch (error) {
    console.error('Error in onActivityCreated:', error);
  }
});

// Callable function: Grade activity and send email
exports.gradeActivityWithEmail = onCall(async (request) => {
  const { auth, data } = request;
  
  if (!auth) {
    throw new Error('Authentication required');
  }
  
  // Check admin
  let isAdminUser = !!auth.token.admin;
  if (!isAdminUser) {
    try {
      const allowlistDoc = await db.collection('config').doc('allowlist').get();
      if (allowlistDoc.exists) {
        const { adminEmails = [] } = allowlistDoc.data();
        const email = (auth.token.email || '').toLowerCase();
        isAdminUser = adminEmails.some(e => (e || '').toLowerCase() === email);
      }
    } catch {}
  }
  
  if (!isAdminUser) {
    throw new Error('Admin access required');
  }
  
  const { submissionId, score, feedback, feedback_ar, sendEmail = true } = data;
  
  if (!submissionId || score === undefined) {
    throw new Error('submissionId and score are required');
  }
  
  try {
    // Update submission with grade
    const submissionRef = db.collection('submissions').doc(submissionId);
    const submissionDoc = await submissionRef.get();
    
    if (!submissionDoc.exists) {
      throw new Error('Submission not found');
    }
    
    const submission = submissionDoc.data();
    
    await submissionRef.update({
      score: score,
      feedback: feedback || '',
      feedback_ar: feedback_ar || feedback || '',
      reviewedAt: FieldValue.serverTimestamp(),
      reviewedBy: auth.uid
    });
    
    // Send email if requested and enabled
    if (sendEmail) {
      const emailEnabled = await isEmailEnabled(db, 'activityGraded');
      
      if (emailEnabled) {
        // Get student info
        const userDoc = await db.collection('users').doc(submission.userId).get();
        const userData = userDoc.exists ? userDoc.data() : {};
        
        // Get activity info
        const activityDoc = await db.collection('activities').doc(submission.activityId).get();
        const activity = activityDoc.exists ? activityDoc.data() : {};
        
        // Get template
        const settingsDoc = await db.collection('config').doc('emailSettings').get();
        const templateId = settingsDoc.exists 
          ? settingsDoc.data().activityGraded?.template || 'activity_graded_default'
          : 'activity_graded_default';
        
        // Prepare variables
        const variables = {
          studentName: userData.displayName || userData.email?.split('@')[0] || 'Student',
          activityTitle: activity.title_en || activity.title || 'Activity',
          activityTitle_ar: activity.title_ar || activity.title || 'نشاط',
          score: score,
          maxScore: activity.maxScore || 100,
          feedback: feedback || 'Good work!',
          feedback_ar: feedback_ar || feedback || 'عمل جيد!',
          dateTime: new Date(),
          link: `${process.env.SITE_URL || 'https://your-domain.com'}/progress`
        };
        
        // Send email
        if (userData.email) {
          await sendTemplatedEmail(
            templateId,
            userData.email,
            variables,
            'activity_graded',
            { 
              submissionId: submissionId,
              activityId: submission.activityId,
              userId: submission.userId
            }
          );
        }
      }
    }
    
    return { 
      success: true, 
      message: sendEmail ? 'Grade saved and email sent!' : 'Grade saved successfully!' 
    };
    
  } catch (error) {
    console.error('Error in gradeActivityWithEmail:', error);
    throw new Error('Failed to grade activity: ' + error.message);
  }
});

// Trigger: When submission is created (student marks activity complete)
exports.onSubmissionCreated = onDocumentCreated('submissions/{submissionId}', async (event) => {
  const submission = event.data.data();
  const submissionId = event.params.submissionId;
  
  try {
    // Log activity
    try {
      await db.collection('activityLogs').add({
        type: 'submission',
        userId: submission.userId,
        when: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          submissionId: submissionId,
          activityId: submission.activityId
        }
      });
    } catch (logError) {
      console.error('Error logging submission activity:', logError);
    }
    
  } catch (error) {
    console.error('Error in onSubmissionCreated:', error);
  }
  
  try {
    // Check if email notifications are enabled
    const emailEnabled = await isEmailEnabled(db, 'activityComplete');
    if (!emailEnabled) {
      console.log('Activity completion emails are disabled');
      return;
    }
    
    // Get email settings
    const settingsDoc = await db.collection('config').doc('emailSettings').get();
    const templateId = settingsDoc.exists 
      ? settingsDoc.data().activityComplete?.template || 'activity_complete_default'
      : 'activity_complete_default';
    
    // Get student info
    const userDoc = await db.collection('users').doc(submission.userId).get();
    const userData = userDoc.exists ? userDoc.data() : {};
    
    // Get activity info
    const activityDoc = await db.collection('activities').doc(submission.activityId).get();
    const activity = activityDoc.exists ? activityDoc.data() : {};
    
    // Get all admin emails
    const allowlistDoc = await db.collection('config').doc('allowlist').get();
    const adminEmails = allowlistDoc.exists ? allowlistDoc.data().adminEmails || [] : [];
    
    if (adminEmails.length === 0) {
      console.log('No admin emails found');
      return;
    }
    
    // Prepare variables
    const variables = {
      studentName: userData.displayName || userData.email?.split('@')[0] || 'Student',
      studentEmail: userData.email || '',
      militaryNumber: userData.militaryNumber || 'N/A',
      activityTitle: activity.title_en || activity.title || 'Activity',
      dateTime: submission.submittedAt || new Date(),
      link: `${process.env.SITE_URL || 'https://your-domain.com'}/dashboard?tab=submissions`
    };
    
    // Send email to all admins
    for (const adminEmail of adminEmails) {
      try {
        await sendTemplatedEmail(
          templateId,
          adminEmail,
          variables,
          'activity_complete',
          { 
            submissionId: submissionId,
            activityId: submission.activityId,
            userId: submission.userId
          }
        );
      } catch (error) {
        console.error(`Failed to send to ${adminEmail}:`, error);
      }
    }
    
    console.log(`Activity completion emails sent to ${adminEmails.length} admins`);
    
  } catch (error) {
    console.error('Error in onSubmissionCreated:', error);
  }
});

// Trigger: When enrollment is created
exports.onEnrollmentCreated = onDocumentCreated('enrollments/{enrollmentId}', async (event) => {
  const enrollment = event.data.data();
  const enrollmentId = event.params.enrollmentId;
  
  try {
    // Check if email notifications are enabled
    const emailEnabled = await isEmailEnabled(db, 'enrollments');
    if (!emailEnabled) {
      console.log('Enrollment emails are disabled');
      return;
    }
    
    // Get email settings
    const settingsDoc = await db.collection('config').doc('emailSettings').get();
    const templateId = settingsDoc.exists 
      ? settingsDoc.data().enrollments?.template || 'enrollment_default'
      : 'enrollment_default';
    
    // Get student info
    const userDoc = await db.collection('users').doc(enrollment.userId).get();
    const userData = userDoc.exists ? userDoc.data() : {};
    
    if (!userData.email) {
      console.log('No email found for user');
      return;
    }
    
    // Get class info
    const classDoc = await db.collection('classes').doc(enrollment.classId).get();
    const classData = classDoc.exists ? classDoc.data() : {};
    
    // Get instructor info if available
    let instructorName = 'Instructor';
    let instructorEmail = '';
    if (classData.instructorId) {
      const instructorDoc = await db.collection('users').doc(classData.instructorId).get();
      if (instructorDoc.exists) {
        const instructorData = instructorDoc.data();
        instructorName = instructorData.displayName || instructorData.email?.split('@')[0] || 'Instructor';
        instructorEmail = instructorData.email || '';
      }
    }
    
    // Prepare variables
    const variables = {
      studentName: userData.displayName || userData.email.split('@')[0],
      className: classData.name || 'Class',
      classCode: classData.code || 'N/A',
      term: classData.term || 'Current Term',
      instructorName: instructorName,
      instructorEmail: instructorEmail
    };
    
    // Send welcome email
    await sendTemplatedEmail(
      templateId,
      userData.email,
      variables,
      'enrollment',
      { 
        enrollmentId: enrollmentId,
        classId: enrollment.classId,
        userId: enrollment.userId
      }
    );
    
    console.log(`Enrollment welcome email sent to ${userData.email}`);
    
  } catch (error) {
    console.error('Error in onEnrollmentCreated:', error);
  }
});

// Trigger: When resource is created
exports.onResourceCreated = onDocumentCreated('resources/{resourceId}', async (event) => {
  const resource = event.data.data();
  const resourceId = event.params.resourceId;
  
  try {
    // Check if email notifications are enabled
    const emailEnabled = await isEmailEnabled(db, 'resources');
    if (!emailEnabled) {
      console.log('Resource emails are disabled');
      return;
    }
    
    // Get email settings
    const settingsDoc = await db.collection('config').doc('emailSettings').get();
    const templateId = settingsDoc.exists 
      ? settingsDoc.data().resources?.template || 'resource_default'
      : 'resource_default';
    
    // Get all users (or filter by class if classId exists)
    const usersSnapshot = await db.collection('users').get();
    const recipients = [];
    
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      if (userData.email && userData.role !== 'admin') {
        recipients.push({
          email: userData.email,
          name: userData.displayName || userData.email.split('@')[0]
        });
      }
    });
    
    if (recipients.length === 0) {
      console.log('No recipients found');
      return;
    }
    
    // Prepare variables
    const variables = {
      resourceTitle: resource.title || 'New Resource',
      resourceType: resource.type || 'document',
      description: resource.description || '',
      link: resource.url || `${process.env.SITE_URL || 'https://your-domain.com'}/resources`
    };
    
    // Send emails in batches
    const batchSize = 50;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      for (const recipient of batch) {
        try {
          await sendTemplatedEmail(
            templateId,
            recipient.email,
            {
              ...variables,
              recipientName: recipient.name
            },
            'resource',
            { resourceId: resourceId }
          );
        } catch (error) {
          console.error(`Failed to send to ${recipient.email}:`, error);
        }
      }
      
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`Resource emails sent to ${recipients.length} recipients`);
    
  } catch (error) {
    console.error('Error in onResourceCreated:', error);
  }
});

// Scheduled function: Chat digest (runs every 3 hours)
exports.sendChatDigest = onSchedule('every 3 hours', async (event) => {
  try {
    console.log('Starting chat digest job...');
    
    // Check if chat digest is enabled
    const emailEnabled = await isEmailEnabled(db, 'chatDigest');
    if (!emailEnabled) {
      console.log('Chat digest emails are disabled');
      return;
    }
    
    // Get email settings
    const settingsDoc = await db.collection('config').doc('emailSettings').get();
    const templateId = settingsDoc.exists 
      ? settingsDoc.data().chatDigest?.template || 'chat_digest_default'
      : 'chat_digest_default';
    
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    const users = [];
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      if (userData.email) {
        users.push({
          id: doc.id,
          email: userData.email,
          name: userData.displayName || userData.email.split('@')[0]
        });
      }
    });
    
    // Get unread messages from the last 3 hours
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    
    let digestsSent = 0;
    
    // Process each user
    for (const user of users) {
      try {
        // Query messages where user is NOT in readBy array and message is recent
        const messagesSnapshot = await db.collection('messages')
          .where('timestamp', '>', threeHoursAgo)
          .orderBy('timestamp', 'desc')
          .limit(100)
          .get();
        
        const unreadMessages = [];
        messagesSnapshot.forEach(doc => {
          const msg = doc.data();
          const readBy = msg.readBy || [];
          
          // Check if user hasn't read this message and it's not their own message
          if (!readBy.includes(user.id) && msg.senderId !== user.id) {
            unreadMessages.push({
              senderName: msg.senderName || 'Unknown',
              text: msg.text || '',
              time: msg.timestamp?.toDate?.() || new Date(),
              type: msg.type || 'global'
            });
          }
        });
        
        // If user has unread messages, send digest
        if (unreadMessages.length > 0) {
          // Build message summary HTML
          const messageSummary = unreadMessages.slice(0, 10).map(msg => `
            <div style="padding: 12px; background: white; border-radius: 6px; margin-bottom: 8px; border-left: 3px solid #667eea;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <strong style="color: #333;">${msg.senderName}</strong>
                <span style="color: #999; font-size: 0.85rem;">${msg.time.toLocaleString('en-GB', { 
                  day: '2-digit', 
                  month: '2-digit', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}</span>
              </div>
              <p style="margin: 0; color: #555;">${msg.text.substring(0, 100)}${msg.text.length > 100 ? '...' : ''}</p>
            </div>
          `).join('');
          
          const variables = {
            recipientName: user.name,
            unreadCount: unreadMessages.length.toString(),
            messageSummary: messageSummary,
            chatLink: `${process.env.SITE_URL || 'https://your-domain.com'}/chat`
          };
          
          await sendTemplatedEmail(
            templateId,
            user.email,
            variables,
            'chat_digest',
            { userId: user.id, messageCount: unreadMessages.length }
          );
          
          digestsSent++;
        }
      } catch (error) {
        console.error(`Error processing digest for ${user.email}:`, error);
      }
    }
    
    console.log(`Chat digest job completed. Sent ${digestsSent} digests.`);
    
  } catch (error) {
    console.error('Error in sendChatDigest:', error);
  }
});
