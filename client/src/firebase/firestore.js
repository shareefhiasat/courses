import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  query, 
  where, 
  orderBy,
  onSnapshot,
  Timestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from './config';

// Helper: Convert ISO string to Firestore Timestamp
const convertDatesToTimestamps = (data) => {
  const converted = { ...data };
  if (converted.dueDate && typeof converted.dueDate === 'string') {
    const date = new Date(converted.dueDate);
    if (!isNaN(date.getTime())) {
      converted.dueDate = Timestamp.fromDate(date);
    }
  }
  return converted;
};

// ===== Courses (for dynamic course list) =====
// Model: collection "courses" docs { id, name_en, name_ar, order }
export const getCourses = async () => {
  try {
    const q = query(collection(db, 'courses'), orderBy('order', 'asc'));
    const qs = await getDocs(q);
    const items = [];
    qs.forEach(d => items.push({ docId: d.id, ...d.data() }));
    return { success: true, data: items };
  } catch (error) {
    // Fallback: no collection present
    return { success: true, data: [] };
  }
};

export const setCourse = async (courseId, data) => {
  try {
    await setDoc(doc(db, 'courses', courseId), data, { merge: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteCourse = async (courseId) => {
  try {
    await deleteDoc(doc(db, 'courses', courseId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Ensure a deterministic users/{uid} doc exists
export const ensureUserDoc = async (uid, data = {}) => {
  if (!uid) return { success: false, error: 'uid required' };
  try {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    const base = {
      email: data.email || null,
      displayName: data.displayName || null,
      realName: data.realName || null,
      studentNumber: data.studentNumber || null,
      role: data.role || 'student',
      createdAt: Timestamp.now(),
    };
    await setDoc(ref, snap.exists() ? data : base, { merge: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ===== Activity Logs =====
// Model: collection "activityLogs" documents { type, userId, email, displayName, when: Timestamp, userAgent, metadata }
// Types: login, signup, profile_update, password_change, email_change, session_timeout, message_sent, message_received, submission, announcement_read
export const addActivityLog = async (log = {}) => {
  try {
    const payload = {
      type: log.type || 'login',
      userId: log.userId || null,
      email: log.email || null,
      displayName: log.displayName || null,
      userAgent: log.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : ''),
      when: Timestamp.now(),
      metadata: log.metadata || {}
    };
    const ref = await addDoc(collection(db, 'activityLogs'), payload);
    return { success: true, id: ref.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Legacy function for backward compatibility
export const addLoginLog = async (log = {}) => {
  return addActivityLog({ ...log, type: 'login' });
};

export const getLoginLogs = async () => {
  try {
    const q = query(collection(db, 'activityLogs'), orderBy('when', 'desc'));
    const qs = await getDocs(q);
    const items = [];
    qs.forEach(d => items.push({ docId: d.id, ...d.data() }));
    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Activities
export const getActivities = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'activities'));
    const activities = [];
    querySnapshot.forEach((d) => {
      activities.push({ docId: d.id, ...d.data() });
    });
    return { success: true, data: activities };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const addActivity = async (activityData) => {
  try {
    const convertedData = convertDatesToTimestamps(activityData);
    const docRef = await addDoc(collection(db, 'activities'), convertedData);
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateActivity = async (id, activityData) => {
  try {
    const convertedData = convertDatesToTimestamps(activityData);
    await updateDoc(doc(db, 'activities', id), convertedData);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteActivity = async (id) => {
  try {
    await deleteDoc(doc(db, 'activities', id));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Announcements
export const getAnnouncements = async () => {
  try {
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const announcements = [];
    querySnapshot.forEach((d) => {
      announcements.push({ docId: d.id, ...d.data() });
    });
    return { success: true, data: announcements };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const addAnnouncement = async (announcementData) => {
  try {
    const docRef = await addDoc(collection(db, 'announcements'), {
      ...announcementData,
      createdAt: Timestamp.now()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateAnnouncement = async (id, announcementData) => {
  try {
    await updateDoc(doc(db, 'announcements', id), announcementData);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteAnnouncement = async (id) => {
  try {
    await deleteDoc(doc(db, 'announcements', id));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Resources
export const getResources = async () => {
  try {
    const q = query(collection(db, 'resources'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const resources = [];
    querySnapshot.forEach((d) => {
      resources.push({ docId: d.id, ...d.data() });
    });
    return { success: true, data: resources };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const addResource = async (resourceData) => {
  try {
    const convertedData = convertDatesToTimestamps(resourceData);
    const docRef = await addDoc(collection(db, 'resources'), {
      ...convertedData,
      createdAt: Timestamp.now()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateResource = async (id, resourceData) => {
  try {
    const convertedData = convertDatesToTimestamps(resourceData);
    await updateDoc(doc(db, 'resources', id), convertedData);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteResource = async (id) => {
  try {
    await deleteDoc(doc(db, 'resources', id));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Users
export const getUsers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    const users = [];
    querySnapshot.forEach((d) => {
      users.push({ docId: d.id, ...d.data() });
    });
    return { success: true, data: users };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Allowlist
export const getAllowlist = async () => {
  try {
    const docRef = doc(db, 'config', 'allowlist');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    } else {
      return { success: false, error: 'No allowlist found' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateAllowlist = async (allowlistData) => {
  try {
    const docRef = doc(db, 'config', 'allowlist');
    await updateDoc(docRef, allowlistData);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Add user function
export const addUser = async (userData) => {
  try {
    // Enforce deterministic ID: uid is required
    if (!userData?.uid) {
      return { success: false, error: 'uid is required for addUser' };
    }
    const { uid, ...rest } = userData;
    await setDoc(doc(db, 'users', uid), { ...rest, createdAt: Timestamp.now() }, { merge: true });
    return { success: true, id: uid };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Admin cascade delete for a user
export const deleteUserCascade = async (uid) => {
  try {
    if (!uid) return { success: false, error: 'uid required' };
    const deletions = [];
    // notifications
    const nqs = await getDocs(query(collection(db, 'notifications'), where('userId', '==', uid)));
    nqs.forEach(d => deletions.push(deleteDoc(doc(db, 'notifications', d.id))));
    // enrollments
    const eqs = await getDocs(query(collection(db, 'enrollments'), where('userId', '==', uid)));
    eqs.forEach(d => deletions.push(deleteDoc(doc(db, 'enrollments', d.id))));
    // submissions
    const sqs = await getDocs(query(collection(db, 'submissions'), where('userId', '==', uid)));
    sqs.forEach(d => deletions.push(deleteDoc(doc(db, 'submissions', d.id))));
    // messages (sent by user)
    const mqs = await getDocs(query(collection(db, 'messages'), where('senderId', '==', uid)));
    mqs.forEach(d => deletions.push(deleteDoc(doc(db, 'messages', d.id))));
    // direct rooms containing user (delete room)
    const rqs = await getDocs(query(collection(db, 'directRooms'), where('participants', 'array-contains', uid)));
    rqs.forEach(d => deletions.push(deleteDoc(doc(db, 'directRooms', d.id))));
    await Promise.allSettled(deletions);
    // finally delete users/{uid}
    await deleteDoc(doc(db, 'users', uid));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Update user function
export const updateUser = async (id, userData) => {
  try {
    await updateDoc(doc(db, 'users', id), userData);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Delete user function
export const deleteUser = async (id) => {
  try {
    await deleteDoc(doc(db, 'users', id));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ===== Classes =====
export const getClasses = async () => {
  try {
    const qs = await getDocs(collection(db, 'classes'));
    const items = [];
    qs.forEach(d => items.push({ docId: d.id, ...d.data() }));
    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const addClass = async (data) => {
  try {
    const ref = await addDoc(collection(db, 'classes'), data);
    return { success: true, id: ref.id };
  } catch (error) { return { success: false, error: error.message }; }
};

export const updateClass = async (id, data) => {
  try { await updateDoc(doc(db, 'classes', id), data); return { success: true }; }
  catch (error) { return { success: false, error: error.message }; }
};

export const deleteClass = async (id) => {
  try { await deleteDoc(doc(db, 'classes', id)); return { success: true }; }
  catch (error) { return { success: false, error: error.message }; }
};

// ===== Enrollments =====
// Model: collection "enrollments" documents { userId, classId, role: 'student'|'ta'|'instructor', createdAt }
export const getEnrollments = async () => {
  try {
    const qs = await getDocs(collection(db, 'enrollments'));
    const items = [];
    qs.forEach(d => items.push({ docId: d.id, ...d.data() }));
    return { success: true, data: items };
  } catch (error) { return { success: false, error: error.message }; }
};

export const addEnrollment = async (data) => {
  try {
    const { userId, classId } = data || {};
    if (!userId || !classId) return { success: false, error: 'userId and classId are required' };
    const detId = `${userId}_${classId}`;
    // Write deterministic enrollment doc
    await setDoc(doc(db, 'enrollments', detId), { ...data, createdAt: Timestamp.now() }, { merge: true });
    // Keep users/{uid}.enrolledClasses in sync
    try { await updateDoc(doc(db, 'users', userId), { enrolledClasses: arrayUnion(classId) }); } catch {}
    return { success: true, id: detId };
  } catch (error) { return { success: false, error: error.message }; }
};

export const deleteEnrollment = async (id) => {
  try { await deleteDoc(doc(db, 'enrollments', id)); return { success: true }; }
  catch (error) { return { success: false, error: error.message }; }
};

// ===== Submissions =====
// Model: collection "submissions" documents { userId, activityId, score, status, submittedAt, files:[], feedback }
export const getSubmissions = async () => {
  try {
    const qs = await getDocs(collection(db, 'submissions'));
    const items = [];
    qs.forEach(d => items.push({ docId: d.id, ...d.data() }));
    return { success: true, data: items };
  } catch (error) { return { success: false, error: error.message }; }
};

export const gradeSubmission = async (id, update) => {
  try { await updateDoc(doc(db, 'submissions', id), update); return { success: true }; }
  catch (error) { return { success: false, error: error.message }; }
};

// ===== Email Functions =====
export const sendEmail = async (emailData) => {
  try {
    const { httpsCallable } = await import('firebase/functions');
    const { functions } = await import('./config');
    const sendEmailFunction = httpsCallable(functions, 'sendEmail');
    const result = await sendEmailFunction(emailData);
    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error sending email:', error);
    // Surface more info when available
    const message = (error && (error.message || error.code)) ? `${error.code || ''} ${error.message}`.trim() : 'Unknown error';
    return { success: false, error: message };
  }
};

// ===== SMTP Configuration =====
export const getSMTPConfig = async () => {
  try {
    const docRef = doc(db, 'config', 'smtp');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    }
    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateSMTPConfig = async (smtpData) => {
  try {
    const docRef = doc(db, 'config', 'smtp');
    await setDoc(docRef, smtpData, { merge: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ===== Student Announcements Feed (already ordered desc in getAnnouncements) =====

// ===== Email Logs (admin only via rules) =====
export const addEmailLog = async (log) => {
  try {
    const ref = await addDoc(collection(db, 'emailLogs'), {
      ...log,
      timestamp: Timestamp.now(),
    });
    return { success: true, id: ref.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getEmailLogs = async () => {
  try {
    const q = query(collection(db, 'emailLogs'), orderBy('timestamp', 'desc'));
    const qs = await getDocs(q);
    const items = [];
    qs.forEach(d => items.push({ docId: d.id, ...d.data() }));
    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteEmailLog = async (id) => {
  try {
    await deleteDoc(doc(db, 'emailLogs', id));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
