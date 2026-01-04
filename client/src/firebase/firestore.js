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
  arrayRemove,
} from "firebase/firestore";
import { db } from "./config";

// Prevent duplicate ensureUserDoc writes during React StrictMode re-mounts
const _ensureUserDocOnce = new Set();

// Helper: Convert ISO string to Firestore Timestamp
const convertDatesToTimestamps = (data) => {
  const converted = { ...data };
  if (converted.dueDate && typeof converted.dueDate === "string") {
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
    const q = query(collection(db, "courses"), orderBy("order", "asc"));
    const qs = await getDocs(q);
    const items = [];
    qs.forEach((d) => items.push({ docId: d.id, ...d.data() }));
    return { success: true, data: items };
  } catch (error) {
    // Fallback: no collection present
    return { success: true, data: [] };
  }
};

export const setCourse = async (courseId, data) => {
  try {
    await setDoc(doc(db, "courses", courseId), data, { merge: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteCourse = async (courseId) => {
  try {
    await deleteDoc(doc(db, "courses", courseId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Ensure a deterministic users/{uid} doc exists
export const ensureUserDoc = async (uid, data = {}) => {
  if (!uid) return { success: false, error: "uid required" };
  if (_ensureUserDocOnce.has(uid)) return { success: true, skipped: true };
  try {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    const base = {
      email: data.email || null,
      displayName: data.displayName || null,
      realName: data.realName || null,
      studentNumber: data.studentNumber || null,
      role: data.role || "student",
      createdAt: Timestamp.now(),
    };
    await setDoc(ref, snap.exists() ? data : base, { merge: true });
    _ensureUserDocOnce.add(uid);
    return { success: true };
  } catch (error) {
    // Ignore permission-denied to avoid noisy console during restricted environments
    const code = error && (error.code || "").toString();
    if (code === "permission-denied") {
      console.warn("ensureUserDoc permission denied for uid:", uid);
      return { success: false, error: "permission-denied" };
    }
    return { success: false, error: error.message };
  }
};

// ===== Activity Logs =====
// Model: collection "activityLogs" documents { type, userId, email, displayName, when: Timestamp, userAgent, metadata }
// Types: login, signup, profile_update, password_change, email_change, session_timeout, message_sent, message_received, submission, announcement_read
export const addActivityLog = async (log = {}) => {
  try {
    const payload = {
      type: log.type || "login",
      userId: log.userId || null,
      email: log.email || null,
      displayName: log.displayName || null,
      userAgent:
        log.userAgent ||
        (typeof navigator !== "undefined" ? navigator.userAgent : ""),
      when: Timestamp.now(),
      metadata: log.metadata || {},
    };
    const ref = await addDoc(collection(db, "activityLogs"), payload);
    return { success: true, id: ref.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Legacy function for backward compatibility
export const addLoginLog = async (log = {}) => {
  return addActivityLog({ ...log, type: "login" });
};

export const getLoginLogs = async () => {
  try {
    const q = query(collection(db, "activityLogs"), orderBy("when", "desc"));
    const qs = await getDocs(q);
    const items = [];
    qs.forEach((d) => items.push({ docId: d.id, ...d.data() }));
    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Activities
export const getActivities = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "activities"));
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
    const docRef = await addDoc(collection(db, "activities"), convertedData);
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateActivity = async (id, activityData) => {
  try {
    const convertedData = convertDatesToTimestamps(activityData);
    await updateDoc(doc(db, "activities", id), convertedData);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteActivity = async (id) => {
  try {
    await deleteDoc(doc(db, "activities", id));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Announcements
export const getAnnouncements = async () => {
  try {
    const q = query(
      collection(db, "announcements"),
      orderBy("createdAt", "desc")
    );
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
    const docRef = await addDoc(collection(db, "announcements"), {
      ...announcementData,
      createdAt: Timestamp.now(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateAnnouncement = async (id, announcementData) => {
  try {
    await updateDoc(doc(db, "announcements", id), announcementData);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteAnnouncement = async (id) => {
  try {
    await deleteDoc(doc(db, "announcements", id));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Resources
export const getResources = async () => {
  try {
    const q = query(collection(db, "resources"), orderBy("createdAt", "desc"));
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
    const { serverTimestamp } = await import("firebase/firestore");
    const convertedData = convertDatesToTimestamps(resourceData);
    const docRef = await addDoc(collection(db, "resources"), {
      ...convertedData,
      createdAt: serverTimestamp(), // Use serverTimestamp for UTC storage
      updatedAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateResource = async (id, resourceData) => {
  try {
    const { serverTimestamp } = await import("firebase/firestore");
    const convertedData = convertDatesToTimestamps(resourceData);
    await updateDoc(doc(db, "resources", id), {
      ...convertedData,
      updatedAt: serverTimestamp(), // Use serverTimestamp for UTC storage
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteResource = async (id) => {
  try {
    await deleteDoc(doc(db, "resources", id));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Users
export const getUsers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    const users = [];
    querySnapshot.forEach((d) => {
      users.push({ docId: d.id, ...d.data() });
    });
    return { success: true, data: users };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getUser = async (uid) => {
  if (!uid) {
    return { success: false, error: "uid required" };
  }

  try {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return { success: false, error: "user_not_found" };
    }

    return {
      success: true,
      data: {
        docId: uid,
        ...snap.data(),
      },
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Allowlist
export const getAllowlist = async () => {
  try {
    const docRef = doc(db, "config", "allowlist");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    } else {
      return { success: false, error: "No allowlist found" };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateAllowlist = async (allowlistData) => {
  try {
    const docRef = doc(db, "config", "allowlist");
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
      return { success: false, error: "uid is required for addUser" };
    }
    const { uid, ...rest } = userData;
    await setDoc(
      doc(db, "users", uid),
      { ...rest, createdAt: Timestamp.now() },
      { merge: true }
    );
    return { success: true, id: uid };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Admin cascade delete for a user
export const deleteUserCascade = async (uid) => {
  try {
    if (!uid) return { success: false, error: "uid required" };
    const deletions = [];
    // notifications
    const nqs = await getDocs(
      query(collection(db, "notifications"), where("userId", "==", uid))
    );
    nqs.forEach((d) =>
      deletions.push(deleteDoc(doc(db, "notifications", d.id)))
    );
    // enrollments
    const eqs = await getDocs(
      query(collection(db, "enrollments"), where("userId", "==", uid))
    );
    eqs.forEach((d) => deletions.push(deleteDoc(doc(db, "enrollments", d.id))));
    // submissions
    const sqs = await getDocs(
      query(collection(db, "submissions"), where("userId", "==", uid))
    );
    sqs.forEach((d) => deletions.push(deleteDoc(doc(db, "submissions", d.id))));
    // attendance records
    const attQuery = await getDocs(
      query(collection(db, "attendance"), where("studentId", "==", uid))
    );
    attQuery.forEach((d) =>
      deletions.push(deleteDoc(doc(db, "attendance", d.id)))
    );
    // quiz submissions
    const quizSubQuery = await getDocs(
      query(collection(db, "quizSubmissions"), where("userId", "==", uid))
    );
    quizSubQuery.forEach((d) =>
      deletions.push(deleteDoc(doc(db, "quizSubmissions", d.id)))
    );
    // quiz results
    const quizResQuery = await getDocs(
      query(collection(db, "quizResults"), where("userId", "==", uid))
    );
    quizResQuery.forEach((d) =>
      deletions.push(deleteDoc(doc(db, "quizResults", d.id)))
    );
    // marks/grades
    const marksQuery = await getDocs(
      query(collection(db, "studentMarks"), where("studentId", "==", uid))
    );
    marksQuery.forEach((d) =>
      deletions.push(deleteDoc(doc(db, "studentMarks", d.id)))
    );
    // messages (sent by user)
    const mqs = await getDocs(
      query(collection(db, "messages"), where("senderId", "==", uid))
    );
    mqs.forEach((d) => deletions.push(deleteDoc(doc(db, "messages", d.id))));
    // direct rooms containing user (delete room)
    const rqs = await getDocs(
      query(
        collection(db, "directRooms"),
        where("participants", "array-contains", uid)
      )
    );
    rqs.forEach((d) => deletions.push(deleteDoc(doc(db, "directRooms", d.id))));
    await Promise.allSettled(deletions);
    // finally delete users/{uid}
    await deleteDoc(doc(db, "users", uid));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Update user function
export const updateUser = async (id, userData) => {
  try {
    await updateDoc(doc(db, "users", id), userData);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Delete user function
export const deleteUser = async (id) => {
  try {
    await deleteDoc(doc(db, "users", id));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ===== Classes =====
export const getClasses = async () => {
  try {
    const qs = await getDocs(collection(db, "classes"));
    const items = [];
    qs.forEach((d) => items.push({ docId: d.id, ...d.data() }));
    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const addClass = async (data) => {
  try {
    const ref = await addDoc(collection(db, "classes"), data);
    return { success: true, id: ref.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateClass = async (id, data) => {
  try {
    await updateDoc(doc(db, "classes", id), data);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteClass = async (id) => {
  try {
    // Cascade delete: enrollments, attendance, activities linked to this class
    const deletions = [];

    // Delete enrollments
    const enrollmentsQuery = query(
      collection(db, "enrollments"),
      where("classId", "==", id)
    );
    const enrollmentsSnap = await getDocs(enrollmentsQuery);
    enrollmentsSnap.forEach((d) =>
      deletions.push(deleteDoc(doc(db, "enrollments", d.id)))
    );

    // Delete attendance records
    const attendanceQuery = query(
      collection(db, "attendance"),
      where("classId", "==", id)
    );
    const attendanceSnap = await getDocs(attendanceQuery);
    attendanceSnap.forEach((d) =>
      deletions.push(deleteDoc(doc(db, "attendance", d.id)))
    );

    // Note: Activities with classId should be handled separately (they might be shared)
    // Class schedules are stored in classes.schedule, so they're deleted with the class

    await Promise.allSettled(deletions);
    await deleteDoc(doc(db, "classes", id));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ===== Enrollments =====
// Model: collection "enrollments" documents { userId, classId, role: 'student'|'ta'|'instructor', createdAt }
export const getEnrollments = async () => {
  try {
    const qs = await getDocs(collection(db, "enrollments"));
    const items = [];
    qs.forEach((d) => items.push({ docId: d.id, ...d.data() }));
    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const addEnrollment = async (data) => {
  try {
    const { userId, classId } = data || {};
    if (!userId || !classId)
      return { success: false, error: "userId and classId are required" };
    const detId = `${userId}_${classId}`;
    // Write deterministic enrollment doc
    await setDoc(
      doc(db, "enrollments", detId),
      { ...data, createdAt: Timestamp.now() },
      { merge: true }
    );
    // Keep users/{uid}.enrolledClasses in sync
    try {
      await updateDoc(doc(db, "users", userId), {
        enrolledClasses: arrayUnion(classId),
      });
    } catch {}

    // Update student progress
    try {
      const progressRef = doc(db, "studentProgress", userId);
      const progressSnap = await getDoc(progressRef);
      if (progressSnap.exists()) {
        await updateDoc(progressRef, {
          enrolledClasses: increment(1),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (e) {
      console.warn("Failed to update student progress:", e);
    }

    return { success: true, id: detId };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteEnrollment = async (id) => {
  try {
    const enrollmentDoc = await getDoc(doc(db, "enrollments", id));
    if (enrollmentDoc.exists()) {
      const enrollmentData = enrollmentDoc.data();
      const userId = enrollmentData.userId;
      const classId = enrollmentData.classId;

      // Cascade delete: attendance records for this enrollment
      const attendanceQuery = query(
        collection(db, "attendance"),
        where("studentId", "==", userId),
        where("classId", "==", classId)
      );
      const attendanceSnap = await getDocs(attendanceQuery);
      const attendanceDeletions = attendanceSnap.docs.map((d) =>
        deleteDoc(doc(db, "attendance", d.id))
      );
      await Promise.allSettled(attendanceDeletions);
    }

    await deleteDoc(doc(db, "enrollments", id));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ===== Submissions =====
// Model: collection "submissions" documents { userId, activityId, score, status, submittedAt, files:[], feedback }
export const getSubmissions = async () => {
  try {
    const qs = await getDocs(collection(db, "submissions"));
    const items = [];
    qs.forEach((d) => items.push({ docId: d.id, ...d.data() }));
    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const gradeSubmission = async (id, update) => {
  try {
    // Update submission
    await updateDoc(doc(db, "submissions", id), update);

    // Auto-award points based on score
    if (update.score !== undefined && update.status === "graded") {
      const submissionDoc = await getDoc(doc(db, "submissions", id));
      if (submissionDoc.exists()) {
        const submission = submissionDoc.data();
        const score = Number(update.score);

        // Award points based on performance
        let pointsToAward = 0;
        let category = "completion";

        if (score >= 90) {
          pointsToAward = 2; // Excellence
          category = "excellence";
        } else if (score >= 70) {
          pointsToAward = 1; // Good work
          category = "good_work";
        } else if (score >= 50) {
          pointsToAward = 1; // Completion
          category = "completion";
        }

        // Award points if score is passing
        if (pointsToAward > 0 && submission.userId) {
          await awardPoints({
            studentIds: [submission.userId],
            points: pointsToAward,
            category: category,
            reason: `Activity graded: ${score}/100`,
            awardedBy: update.gradedBy || "system",
            classId: submission.classId || null,
            activityId: submission.activityId || null,
          });
        }
      }
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteSubmission = async (id) => {
  try {
    await deleteDoc(doc(db, "submissions", id));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ===== Email Functions =====
export const sendEmail = async (emailData) => {
  try {
    const { httpsCallable } = await import("firebase/functions");
    const { functions } = await import("./config");
    const sendEmailFunction = httpsCallable(functions, "sendEmail");
    const result = await sendEmailFunction(emailData);
    return { success: true, data: result.data };
  } catch (error) {
    console.error("Error sending email:", error);
    // Surface more info when available
    const message =
      error && (error.message || error.code)
        ? `${error.code || ""} ${error.message}`.trim()
        : "Unknown error";
    return { success: false, error: message };
  }
};

// ===== SMTP Configuration =====
export const getSMTPConfig = async () => {
  try {
    const docRef = doc(db, "config", "smtp");
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
    const docRef = doc(db, "config", "smtp");
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
    const ref = await addDoc(collection(db, "emailLogs"), {
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
    const q = query(collection(db, "emailLogs"), orderBy("timestamp", "desc"));
    const qs = await getDocs(q);
    const items = [];
    qs.forEach((d) => items.push({ docId: d.id, ...d.data() }));
    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteEmailLog = async (id) => {
  try {
    await deleteDoc(doc(db, "emailLogs", id));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ========================================
// POINTS & SKILLS SYSTEM (Military Theme)
// ========================================

// Award points to student(s)
export const awardPoints = async (pointsData) => {
  try {
    const {
      studentIds,
      points,
      category,
      reason,
      awardedBy,
      classId,
      activityId,
    } = pointsData;

    const results = await Promise.all(
      studentIds.map(async (studentId) => {
        // Get current rank before awarding
        const studentRef = doc(db, "users", studentId);
        const studentSnap = await getDoc(studentRef);
        const currentPoints = studentSnap.exists()
          ? studentSnap.data().totalPoints || 0
          : 0;
        const oldRank = getStudentRank(currentPoints);

        // Add point record
        await addDoc(collection(db, "points"), {
          studentId,
          classId,
          awardedBy,
          points: Number(points),
          category,
          reason: reason || "",
          activityId: activityId || null,
          timestamp: Timestamp.now(),
        });

        // Update student's total points
        const newPoints = currentPoints + Number(points);
        if (studentSnap.exists()) {
          await updateDoc(studentRef, {
            totalPoints: newPoints,
            lastPointsUpdate: Timestamp.now(),
          });
        }

        // Check if rank changed
        const newRank = getStudentRank(newPoints);
        const rankChanged = oldRank.current.name !== newRank.current.name;

        return {
          studentId,
          oldRank: oldRank.current,
          newRank: newRank.current,
          rankChanged,
          pointsAwarded: Number(points),
          newTotalPoints: newPoints,
        };
      })
    );

    return { success: true, results };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get points for a student
export const getStudentPoints = async (studentId) => {
  try {
    const q = query(
      collection(db, "points"),
      where("studentId", "==", studentId),
      orderBy("timestamp", "desc")
    );
    const qs = await getDocs(q);
    const items = [];
    qs.forEach((d) => items.push({ docId: d.id, ...d.data() }));
    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get all points for a class
export const getClassPoints = async (classId) => {
  try {
    const q = query(
      collection(db, "points"),
      where("classId", "==", classId),
      orderBy("timestamp", "desc")
    );
    const qs = await getDocs(q);
    const items = [];
    qs.forEach((d) => items.push({ docId: d.id, ...d.data() }));
    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get student rank based on points
export const getStudentRank = (totalPoints) => {
  const ranks = [
    {
      name: "Recruit",
      nameAr: "مجند",
      icon: "🎖️",
      min: 0,
      max: 99,
      color: "#CD7F32",
    },
    {
      name: "Private",
      nameAr: "جندي",
      icon: "🪖",
      min: 100,
      max: 249,
      color: "#CD7F32",
    },
    {
      name: "Corporal",
      nameAr: "عريف",
      icon: "⭐",
      min: 250,
      max: 499,
      color: "#C0C0C0",
    },
    {
      name: "Sergeant",
      nameAr: "رقيب",
      icon: "⌃",
      min: 500,
      max: 999,
      color: "#C0C0C0",
    },
    {
      name: "Lieutenant",
      nameAr: "ملازم",
      icon: "━",
      min: 1000,
      max: 1999,
      color: "#D4AF37",
    },
    {
      name: "Captain",
      nameAr: "نقيب",
      icon: "━━",
      min: 2000,
      max: 3999,
      color: "#D4AF37",
    },
    {
      name: "Major",
      nameAr: "رائد",
      icon: "🍂",
      min: 4000,
      max: 6999,
      color: "#D4AF37",
    },
    {
      name: "Colonel",
      nameAr: "عقيد",
      icon: "🦅",
      min: 7000,
      max: 9999,
      color: "#D4AF37",
    },
    {
      name: "General",
      nameAr: "لواء",
      icon: "⭐",
      min: 10000,
      max: Infinity,
      color: "#D4AF37",
    },
  ];

  const currentRank =
    ranks.find((r) => totalPoints >= r.min && totalPoints <= r.max) || ranks[0];
  const nextRankIndex = ranks.findIndex((r) => r.name === currentRank.name) + 1;
  const nextRank = nextRankIndex < ranks.length ? ranks[nextRankIndex] : null;

  return {
    current: currentRank,
    next: nextRank,
    progress: nextRank
      ? ((totalPoints - currentRank.min) / (nextRank.min - currentRank.min)) *
        100
      : 100,
    pointsToNext: nextRank ? nextRank.min - totalPoints : 0,
  };
};

// Get leaderboard for a class
export const getClassLeaderboard = async (classId) => {
  try {
    // Get all enrollments for the class
    const enrollmentsQuery = query(
      collection(db, "enrollments"),
      where("classId", "==", classId)
    );
    const enrollmentsSnap = await getDocs(enrollmentsQuery);

    const leaderboard = [];

    for (const enrollDoc of enrollmentsSnap.docs) {
      const enrollment = enrollDoc.data();
      const studentRef = doc(db, "users", enrollment.userId);
      const studentSnap = await getDoc(studentRef);

      if (studentSnap.exists()) {
        const studentData = studentSnap.data();
        const totalPoints = studentData.totalPoints || 0;
        const rank = getStudentRank(totalPoints);

        leaderboard.push({
          studentId: enrollment.userId,
          displayName: studentData.displayName || "Unknown",
          email: studentData.email,
          totalPoints,
          rank: rank.current.name,
          rankIcon: rank.current.icon,
        });
      }
    }

    // Sort by points descending
    leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);

    return { success: true, data: leaderboard };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Create or update skill
export const saveSkill = async (skillData) => {
  try {
    const { docId, ...data } = skillData;
    if (docId) {
      await updateDoc(doc(db, "skills", docId), data);
      return { success: true, docId };
    } else {
      const docRef = await addDoc(collection(db, "skills"), {
        ...data,
        createdAt: Timestamp.now(),
      });
      return { success: true, docId: docRef.id };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get skills for a class
export const getClassSkills = async (classId) => {
  try {
    const q = query(collection(db, "skills"), where("classId", "==", classId));
    const qs = await getDocs(q);
    const items = [];
    qs.forEach((d) => items.push({ docId: d.id, ...d.data() }));
    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Delete skill
export const deleteSkill = async (skillId) => {
  try {
    await deleteDoc(doc(db, "skills", skillId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ===== Scheduled Reports =====
// Model: collection "scheduledReports" documents {
//   userId, title, description, schedule (daily/weekly/custom),
//   recipients (array of emails), templateId, reportType (analytics/student-dashboard),
//   filters (object), enabled, nextRunAt, lastRunAt, createdAt, updatedAt
// }
export const getScheduledReports = async (userId = null) => {
  try {
    let q;
    if (userId) {
      q = query(
        collection(db, "scheduledReports"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
    } else {
      q = query(
        collection(db, "scheduledReports"),
        orderBy("createdAt", "desc")
      );
    }
    const qs = await getDocs(q);
    const items = [];
    qs.forEach((d) => {
      const data = d.data();
      items.push({
        docId: d.id,
        ...data,
        nextRunAt: data.nextRunAt?.toDate
          ? data.nextRunAt.toDate()
          : data.nextRunAt,
        lastRunAt: data.lastRunAt?.toDate
          ? data.lastRunAt.toDate()
          : data.lastRunAt,
        createdAt: data.createdAt?.toDate
          ? data.createdAt.toDate()
          : data.createdAt,
        updatedAt: data.updatedAt?.toDate
          ? data.updatedAt.toDate()
          : data.updatedAt,
      });
    });
    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const addScheduledReport = async (reportData) => {
  try {
    const data = {
      ...reportData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      enabled: reportData.enabled !== false,
    };
    if (data.nextRunAt && data.nextRunAt instanceof Date) {
      data.nextRunAt = Timestamp.fromDate(data.nextRunAt);
    }
    const docRef = await addDoc(collection(db, "scheduledReports"), data);
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateScheduledReport = async (reportId, reportData) => {
  try {
    const data = {
      ...reportData,
      updatedAt: Timestamp.now(),
    };
    if (data.nextRunAt && data.nextRunAt instanceof Date) {
      data.nextRunAt = Timestamp.fromDate(data.nextRunAt);
    }
    if (data.lastRunAt && data.lastRunAt instanceof Date) {
      data.lastRunAt = Timestamp.fromDate(data.lastRunAt);
    }
    await updateDoc(doc(db, "scheduledReports", reportId), data);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteScheduledReport = async (reportId) => {
  try {
    await deleteDoc(doc(db, "scheduledReports", reportId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ===== Email Templates =====
export const getEmailTemplates = async () => {
  try {
    const q = query(
      collection(db, "emailTemplates"),
      orderBy("createdAt", "desc")
    );
    const qs = await getDocs(q);
    const items = [];
    qs.forEach((d) => items.push({ docId: d.id, ...d.data() }));
    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
