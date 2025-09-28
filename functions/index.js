const { beforeUserCreated, beforeUserSignedIn } = require('firebase-functions/v2/identity');
const { onCall } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { onDocumentCreated, onDocumentDeleted } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { defineString } = require('firebase-functions/params');
const nodemailer = require('nodemailer');

// Environment variables for Gmail SMTP
const gmailEmail = defineString('GMAIL_EMAIL');
const gmailPassword = defineString('GMAIL_PASSWORD');

const { getAuth } = require('firebase-admin/auth');

// Initialize Nodemailer transporter once the params are loaded
let mailTransport;

function initializeMailTransport() {
  if (mailTransport) return;
  mailTransport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailEmail.value(),
      pass: gmailPassword.value(),
    },
  });
}

initializeApp();
const db = getFirestore();

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
    
    // Check if email is in allowlist (case-insensitive)
    const isAllowed = allowedEmails.some(allowed => 
      allowed.toLowerCase() === email.toLowerCase()
    );
    
    if (!isAllowed) {
      console.log(`Blocked signup attempt for: ${email}`);
      throw new Error('This email is not authorized to register');
    }
    
    console.log(`Approved signup for: ${email}`);
    
    // Set admin custom claim if email is in adminEmails
    const adminEmails = allowlist.adminEmails || [];
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

// Function to send email on new announcement
exports.sendAnnouncementEmail = onDocumentCreated("announcements/{announcementId}", async (event) => {
  initializeMailTransport(); // Ensure transporter is ready
  const snapshot = event.data;
  if (!snapshot) {
    console.log("No data associated with the event");
    return;
  }
  const ann = snapshot.data();

  let userEmails = [];

  // Get target user emails
  if (ann.target === 'global') {
    const usersSnapshot = await db.collection('users').get();
    usersSnapshot.forEach(doc => userEmails.push(doc.data().email));
  } else {
    // It's a class-based announcement
    const enrollmentsSnapshot = await db.collection('enrollments').where('classId', '==', ann.target).get();
    enrollmentsSnapshot.forEach(doc => userEmails.push(doc.data().userEmail));
  }

  if (userEmails.length === 0) {
    console.log('No users to notify for this announcement.');
    return;
  }

  // Email content
  const mailOptions = {
    from: `"LMS Platform" <${gmailEmail.value()}>`,
    to: userEmails.join(','),
    subject: `New Announcement: ${ann.title}`,
    html: `<h1>${ann.title}</h1><p>${ann.content}</p>`,
  };

  try {
    await mailTransport.sendMail(mailOptions);
    console.log(`Announcement email sent to: ${userEmails.join(', ')}`);
  } catch (error) {
    console.error('There was an error while sending the email:', error);
  }
});

// Scheduled function to check for unread chats and send notifications
exports.sendUnreadChatNotifications = onSchedule("every 24 hours", async (event) => {
  initializeMailTransport(); // Ensure transporter is ready

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

// Require verified email before sign-in (admins bypass)
exports.beforeUserSignedIn = beforeUserSignedIn(async (event) => {
  const { email, emailVerified } = event.data || {};

  try {
    // Load adminEmails for bypass
    const allowlistDoc = await db.collection('config').doc('allowlist').get();
    const adminEmails = allowlistDoc.exists ? (allowlistDoc.data().adminEmails || []) : [];
    const isAdmin = !!email && adminEmails.some(a => a.toLowerCase() === email.toLowerCase());

    // If not verified and not admin, block sign-in
    if (!isAdmin && emailVerified === false) {
      throw new Error('Email not verified. Please verify your email to sign in.');
    }

    // Allow sign-in (no token changes here)
    return {};
  } catch (err) {
    console.error('beforeSignIn error:', err);
    throw err;
  }
});

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
