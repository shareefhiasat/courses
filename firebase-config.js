// Initialize Firebase (v12 SDK)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-analytics.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, sendPasswordResetEmail } from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js';
import { initializeFirestore, doc, setDoc, getDoc, updateDoc, collection, addDoc, query, orderBy, limit, getDocs, onSnapshot, serverTimestamp, deleteDoc } from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-functions.js';
import { getDatabase, ref as dbRef, onValue, onDisconnect, set, serverTimestamp as rtdbServerTimestamp } from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js';
import { getStorage, ref as storageRef, uploadBytes, uploadBytesResumable, getDownloadURL } from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-storage.js';

// Firebase Configuration (updated) - main-one-32026
export const firebaseConfig = {
  apiKey: "AIzaSyD9taKFsiHD16IqiOq8g22LKOkiH1Ak-7k",
  authDomain: "main-one-32026.firebaseapp.com",
  projectId: "main-one-32026",
  storageBucket: "main-one-32026.firebasestorage.app",
  messagingSenderId: "86442250402",
  appId: "1:86442250402:web:cbec3a98961b28846ac7fb",
  measurementId: "G-DH7SMX0GRH"
};

const app = initializeApp(firebaseConfig);
// Initialize Analytics (no-op if not supported)
try { getAnalytics(app); } catch {}

// Initialize Firestore with optimized settings to reduce 400 errors
// NOTE: Do not use experimentalForceLongPolling together with experimentalAutoDetectLongPolling
const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  useFetchStreams: false
});

const auth = getAuth(app);
const storage = getStorage(app);
const functions = getFunctions(app, 'us-central1');

// Upload a submission file to Storage and append history in Firestore
export async function uploadSubmission(activityId, file, note = '') {
  if (!auth.currentUser) return { success: false, error: 'Not authenticated' };
  if (!file) return { success: false, error: 'No file' };
  try {
    const uid = auth.currentUser.uid;
    const safeName = `${Date.now()}_${file.name.replace(/[^A-Za-z0-9_.-]/g,'_')}`;
    const path = `submissions/${uid}/${activityId}/${safeName}`;
    const r = storageRef(storage, path);
    await uploadBytes(r, file);
    const url = await getDownloadURL(r);

    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    const data = snap.exists() ? snap.data() : {};
    const progress = data.progress || {};
    const entry = progress[activityId] || {};
    const submissions = Array.isArray(entry.submissions) ? entry.submissions.slice() : [];
    submissions.push({
      path,
      url,
      filename: file.name,
      size: file.size,
      contentType: file.type || 'application/octet-stream',
      note,
      uploadedAt: serverTimestamp()
    });
    progress[activityId] = { ...entry, submissions };
    await updateDoc(userRef, { progress });
    return { success: true, url, path };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// Upload avatar to Storage and update user profile document
export async function uploadAvatar(file) {
  if (!auth.currentUser) return { success: false, error: 'Not authenticated' };
  if (!file) return { success: false, error: 'No file' };
  try {
    const uid = auth.currentUser.uid;
    const safeName = `${Date.now()}_${file.name.replace(/[^A-Za-z0-9_.-]/g,'_')}`;
    const path = `avatars/${uid}/${safeName}`;
    const r = storageRef(storage, path);
    await uploadBytes(r, file);
    const url = await getDownloadURL(r);
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    const data = snap.exists() ? snap.data() : {};
    await updateDoc(userRef, { ...data, avatarUrl: url, avatarPath: path });
    return { success: true, url };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// Videos (YouTube / Shorts)
export function subscribeVideos(callback) {
  try {
    const qy = query(collection(db, 'videos'), orderBy('order', 'asc'));
    return onSnapshot(qy, (snap) => {
      const items = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() }));
      callback(items);
    });
  } catch (e) {
    console.error('subscribeVideos error', e);
    return () => {};
  }
}
// Remove duplicate declarations - already defined above

// Auth functions
export async function signUp(email, password, displayName) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user profile
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      displayName: displayName,
      createdAt: new Date(),
      progress: {},
      totalScore: 0
    });
    
    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function signIn(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function signOutUser() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Password reset (optional)
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Email-link (passwordless) auth
export async function sendEmailLink(email) {
  try {
    const actionCodeSettings = {
      url: window.location.origin + '/',
      handleCodeInApp: true
    };
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    window.localStorage.setItem('emailForSignIn', email);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function completeEmailLinkSignIn() {
  try {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        // Ask user for their email if not available
        email = window.prompt('Please provide your email for confirmation');
      }
      const result = await signInWithEmailLink(auth, email, window.location.href);
      window.localStorage.removeItem('emailForSignIn');
      return { success: true, user: result.user };
    }
    return { success: false, error: 'Not an email link sign-in URL' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Progress functions
export async function saveProgress(activityId, completed = true) {
  if (!auth.currentUser) return { success: false, error: 'Not authenticated' };
  
  try {
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const progress = userDoc.data().progress || {};
      progress[activityId] = {
        ...progress[activityId],
        completed,
        completedAt: serverTimestamp(),
        attempts: (progress[activityId]?.attempts || 0) + 1
      };
      
      await updateDoc(userRef, { progress });
      return { success: true };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Grade functions
export async function setGrade(userId, activityId, grade, maxScore) {
  if (!auth.currentUser) return { success: false, error: 'Not authenticated' };
  
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const progress = userDoc.data().progress || {};
      progress[activityId] = {
        ...progress[activityId],
        grade: Number(grade),
        maxScore: Number(maxScore),
        gradedAt: serverTimestamp(),
        gradedBy: auth.currentUser.email
      };
      
      await updateDoc(userRef, { progress });
      return { success: true };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getProgress() {
  if (!auth.currentUser) return { success: false, error: 'Not authenticated' };
  
  try {
    const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
    if (userDoc.exists()) {
      return { success: true, progress: userDoc.data().progress || {} };
    }
    return { success: true, progress: {} };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Leaderboard functions
export async function submitScore(activityId, score, nickname) {
  if (!auth.currentUser) return { success: false, error: 'Not authenticated' };
  
  try {
    await addDoc(collection(db, 'leaderboard'), {
      activityId,
      score,
      nickname: nickname || 'Anonymous',
      userId: auth.currentUser.uid,
      submittedAt: new Date()
    });
    
    // Update user's total score
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const currentTotal = userDoc.data().totalScore || 0;
      await updateDoc(userRef, { totalScore: currentTotal + score });
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getLeaderboard(activityId, limitCount = 10) {
  try {
    const q = query(
      collection(db, 'leaderboard'),
      orderBy('score', 'desc'),
      orderBy('submittedAt', 'asc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const scores = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (!activityId || data.activityId === activityId) {
        scores.push({
          nickname: data.nickname,
          score: data.score,
          submittedAt: data.submittedAt
        });
      }
    });
    
    return { success: true, scores };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Auth state listener
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

export { auth, db };
export { storage };

// Activities (Firestore)
export async function getPublicActivities() {
  try {
    const q = query(collection(db, 'activities'), orderBy('order', 'asc'));
    const snap = await getDocs(q);
    const arr = [];
    snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
    return { success: true, items: arr };
  } catch (e) {
    return { success: false, error: e.message, items: [] };
  }
}

export async function upsertActivity(activity) {
  try {
    const id = activity.id;
    await setDoc(doc(db, 'activities', id), {
      ...activity,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// Delete an activity by ID
export async function deleteActivity(activityId) {
  try {
    await deleteDoc(doc(db, 'activities', activityId));
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// Check if current user has admin custom claim
export async function isAdmin() {
  try {
    if (!auth.currentUser) return false;
    const token = await auth.currentUser.getIdTokenResult(true);
    return !!token.claims?.admin;
  } catch (e) {
    return false;
  }
}

// Allowlist configuration in Firestore (fallback to JSON in client if missing)
export async function getAllowlistConfig() {
  try {
    const docRef = doc(db, 'config', 'allowlist');
    const d = await getDoc(docRef);
    if (d.exists()) return { success: true, data: d.data() };
    return { success: true, data: null };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function setAllowlistConfig(data) {
  try {
    const docRef = doc(db, 'config', 'allowlist');
    await setDoc(docRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// Secure admin-only update via Callable Function (preferred)
export async function updateAllowlistRemote({ allowedEmails = [], adminEmails = [] }) {
  try {
    const fn = httpsCallable(functions, 'updateAllowlist');
    const res = await fn({ allowedEmails, adminEmails });
    return { success: true, data: res?.data };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ===== Classes/Subjects =====

export async function upsertClass(classData) {
  if (!classData.id) return { success: false, error: 'Class ID is required' };
  try {
    await setDoc(doc(db, 'classes', classData.id), classData, { merge: true });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function getClasses() {
  try {
    const snapshot = await getDocs(collection(db, 'classes'));
    const classes = [];
    snapshot.forEach(doc => classes.push({ id: doc.id, ...doc.data() }));
    return { success: true, classes };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function deleteClass(classId) {
  try {
    await deleteDoc(doc(db, 'classes', classId));
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ===== Enrollments =====

export async function getEnrollments(classId) {
  try {
    const q = query(collection(db, 'enrollments'), where('classId', '==', classId));
    const snapshot = await getDocs(q);
    const enrollments = [];
    snapshot.forEach(doc => enrollments.push({ id: doc.id, ...doc.data() }));
    return { success: true, enrollments };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function enrollStudent(classId, userId, userEmail) {
  try {
    const enrollmentData = { classId, userId, userEmail, enrolledAt: new Date() };
    const docRef = await addDoc(collection(db, 'enrollments'), enrollmentData);
    return { success: true, id: docRef.id };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function unenrollStudent(enrollmentId) {
  try {
    await deleteDoc(doc(db, 'enrollments', enrollmentId));
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ===== Homework Submissions =====

export function uploadHomeworkFile(file, userId, activityId, onProgress) {
  const r = storageRef(storage, `submissions/${userId}/${activityId}/${file.name}`);
  const uploadTask = uploadBytesResumable(r, file);

  uploadTask.on('state_changed',
    (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      onProgress(progress);
    },
    (error) => {
      console.error('Upload failed:', error);
      onProgress(-1, error); // Indicate error
    },
    () => {
      getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
        onProgress(100, null, downloadURL);
      });
    }
  );

  return uploadTask;
}

export async function createSubmission(submissionData) {
  try {
    const docRef = await addDoc(collection(db, 'submissions'), submissionData);
    return { success: true, id: docRef.id };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function updateSubmission(submissionId, data) {
    try {
        await updateDoc(doc(db, 'submissions', submissionId), data);
        return { success: true };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

export async function getUserSubmissions(userId) {
  try {
    const q = query(collection(db, 'submissions'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    const submissions = [];
    snapshot.forEach(doc => submissions.push({ id: doc.id, ...doc.data() }));
    return { success: true, submissions };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function getAllSubmissions() {
  try {
    const snapshot = await getDocs(collection(db, 'submissions'));
    const submissions = [];
    snapshot.forEach(doc => submissions.push({ id: doc.id, ...doc.data() }));
    return { success: true, submissions };
  } catch (e) {
    return { success: false, error: e.message };
  }
}


// Ask backend to set admin custom claim if current user's email is in adminEmails
export async function ensureAdminClaimRemote() {
  try {
    const fn = httpsCallable(functions, 'ensureAdminClaim');
    const res = await fn({});
    return { success: true, data: res?.data };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ===== User Presence (Realtime Database) =====

export async function createAnnouncement(announcementData) {
  try {
    const dataWithTimestamp = {
      ...announcementData,
      createdAt: serverTimestamp()
    };
    await addDoc(collection(db, 'announcements'), dataWithTimestamp);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function getAnnouncements(limitCount = 20) {
  try {
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    const announcements = [];
    snapshot.forEach(doc => announcements.push({ id: doc.id, ...doc.data() }));
    return { success: true, announcements };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export function manageUserPresence() {
  const rtdb = getDatabase();
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  const userStatusRef = dbRef(rtdb, '/status/' + uid);

  const isOfflineForDatabase = {
    state: 'offline',
    last_changed: rtdbServerTimestamp(),
  };

  const isOnlineForDatabase = {
    state: 'online',
    last_changed: rtdbServerTimestamp(),
  };

  // Listen for connection state
  onValue(dbRef(rtdb, '.info/connected'), (snapshot) => {
    if (snapshot.val() === false) {
      return; // Not connected
    }

    // On disconnect, set status to offline
    onDisconnect(userStatusRef).set(isOfflineForDatabase).then(() => {
      // On connect, set status to online
      set(userStatusRef, isOnlineForDatabase);
    });
  });
}

// Announcements
export function subscribeAnnouncements(callback, enrolledClasses = [], limitCount = 20) {
  try {
    const targets = ['global', ...enrolledClasses].filter(Boolean); // Ensure no empty strings
    if (targets.length === 0) targets.push('global'); // Fallback for users not in any class

    const qy = query(
      collection(db, 'announcements'), 
      where('target', 'in', targets),
      orderBy('createdAt', 'desc'), 
      limit(limitCount)
    );
    return onSnapshot(qy, (snap) => {
      const items = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() }));
      callback(items);
    });
  } catch (e) {
    console.error('Error subscribing to announcements', e);
    return () => {}; // Return a no-op unsub function
  }
}

// Resources (like Blackboard): simple list of links or HTML blocks
export function subscribeResources(callback, limitCount = 100) {
  try {
    const qy = query(collection(db, 'resources'), orderBy('order', 'asc'));
    return onSnapshot(qy, (snap) => {
      const items = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() }));
      callback(items);
    });
  } catch (e) {
    console.error('subscribeResources error', e);
    return () => {};
  }
}

export async function upsertResource(resource) {
  try {
    const id = resource.id;
    await setDoc(doc(db, 'resources', id), {
      ...resource,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// Chats
export function chatIdForStudent(uid) {
  return `${uid}__admin`;
}

export function subscribeChat(chatId, callback, limitCount = 200) {
  try {
    const qy = query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc'), limit(limitCount));
    return onSnapshot(qy, (snap) => {
      const msgs = [];
      snap.forEach(d => msgs.push({ id: d.id, ...d.data() }));
      callback(msgs);
    });
  } catch (e) {
    console.error('subscribeChat error', e);
    return () => {};
  }
}

export async function sendChatMessage({ chatId, text, file }) {
  try {
    let attachmentUrl = '';
    let attachmentType = '';
    if (file) {
      const path = `chats/${chatId}/${Date.now()}_${file.name}`;
      const r = storageRef(storage, path);
      await uploadBytes(r, file);
      attachmentUrl = await getDownloadURL(r);
      attachmentType = file.type || 'application/octet-stream';
    }
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      senderId: auth.currentUser?.uid || 'anon',
      senderEmail: auth.currentUser?.email || '',
      text: text || '',
      attachmentUrl,
      attachmentType,
      createdAt: serverTimestamp()
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
