import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./config";
import { addNotification } from "./notifications";
import { sendEmail } from "./firestore";
import { ABSENCE_TYPES, calculateAbsenceStats } from '../constants/absenceTypes';
import { PENALTY_TYPES } from '../constants/penaltyTypes';

/**
 * Penalties Collection
 * Track academic penalties for students
 * Based on Arabic academic regulations
 */

export const getPenalties = async (studentId = null, subjectId = null) => {
  try {
    let q;
    if (studentId && subjectId) {
      q = query(
        collection(db, "penalties"),
        where("studentId", "==", studentId),
        where("subjectId", "==", subjectId),
        orderBy("createdAt", "desc")
      );
    } else if (studentId) {
      q = query(
        collection(db, "penalties"),
        where("studentId", "==", studentId),
        orderBy("createdAt", "desc")
      );
    } else if (subjectId) {
      q = query(
        collection(db, "penalties"),
        where("subjectId", "==", subjectId),
        orderBy("createdAt", "desc")
      );
    } else {
      q = query(collection(db, "penalties"), orderBy("createdAt", "desc"));
    }
    const qs = await getDocs(q);
    const items = [];
    qs.forEach((d) => items.push({ docId: d.id, ...d.data() }));
    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Get penalties by class and date
 * @param {string} classId - Class ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getPenaltiesByClassAndDate = async (classId, date) => {
  try {
    const penaltiesRef = collection(db, "penalties");
    // Get all penalties ordered by createdAt (no where clause to avoid index requirement)
    const penaltiesQuery = query(
      penaltiesRef,
      orderBy("createdAt", "desc")
    );
    const penaltiesSnapshot = await getDocs(penaltiesQuery);
    const allPenalties = penaltiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Filter by classId and date in JavaScript
    const filteredPenalties = allPenalties.filter(penalty => 
      penalty.classId === classId && penalty.date === date
    );
    
    return { success: true, data: filteredPenalties };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const createPenalty = async (penaltyData) => {
  try {
    const {
      sendEmailNotification = false,
      sendInAppNotification = false,
      createdBy, // User ID who created the penalty
      ...penaltyFields
    } = penaltyData;

    const penalty = {
      ...penaltyFields,
      createdAt: serverTimestamp(), // UTC in Firestore, displayed in Qatar timezone
      updatedAt: serverTimestamp(),
      // Track who created this penalty
      createdBy: createdBy || penaltyFields.markedBy || null,
    };
    const docRef = await addDoc(collection(db, "penalties"), penalty);

    // Send notifications if requested
    if (sendInAppNotification || sendEmailNotification) {
      await sendPenaltyNotifications({
        penaltyId: docRef.id,
        penalty,
        sendEmail: sendEmailNotification,
        sendInApp: sendInAppNotification,
      });
    }

    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Send notifications for penalty
 */
const sendPenaltyNotifications = async ({
  penaltyId,
  penalty,
  sendEmail,
  sendInApp,
}) => {
  try {
    const studentDoc = await getDoc(doc(db, "users", penalty.studentId));
    if (!studentDoc.exists()) {
      console.warn("Student not found for penalty notification");
      return;
    }

    const student = studentDoc.data();
    const penaltyType = PENALTY_TYPES.find((pt) => pt.id === penalty.type) || {
      label_en: penalty.type,
      label_ar: penalty.type,
    };

    let subjectName = "";
    if (penalty.subjectId) {
      const subjectDoc = await getDoc(doc(db, "subjects", penalty.subjectId));
      if (subjectDoc.exists()) {
        const subject = subjectDoc.data();
        subjectName = subject.name_en || subject.code || "";
      }
    }

    const notificationTitle = "Academic Penalty Recorded";
    const notificationMessage = `A penalty has been recorded: ${
      penaltyType.label_en
    }${subjectName ? ` for ${subjectName}` : ""}`;

    // In-app notification
    if (sendInApp) {
      await addNotification({
        userId: penalty.studentId,
        title: notificationTitle,
        message: notificationMessage,
        type: "penalty",
        metadata: {
          penaltyId,
          penaltyType: penalty.type,
          subjectId: penalty.subjectId || null,
          severity: penalty.severity || "minor",
          description: penalty.description || "",
        },
        data: { penaltyId, subjectId: penalty.subjectId },
      });
    }

    // Email notification
    if (sendEmail && student.email) {
      await sendEmailFunc({
        to: student.email,
        template: "penaltyRecorded",
        type: "penalty",
        data: {
          studentName: student.displayName || student.email,
          penaltyType: penaltyType.label_en,
          penaltyTypeAr: penaltyType.label_ar,
          subjectName: subjectName || "General",
          description: penalty.description || "",
          severity: penalty.severity || "minor",
          action: penalty.action || "",
          date: new Date().toLocaleDateString(),
        },
        metadata: {
          penaltyId,
          studentId: penalty.studentId,
          subjectId: penalty.subjectId,
        },
      });
    }
  } catch (error) {
    console.error("Error sending penalty notifications:", error);
  }
};

export const updatePenalty = async (penaltyId, data) => {
  try {
    const {
      updatedBy, // User ID who updated the penalty
      ...updateFields
    } = data;
    
    const docRef = doc(db, "penalties", penaltyId);
    await updateDoc(docRef, {
      ...updateFields,
      updatedAt: serverTimestamp(),
      updatedBy: updatedBy || null,
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deletePenalty = async (penaltyId) => {
  try {
    await deleteDoc(doc(db, "penalties", penaltyId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Absences Tracking
 * Track student absences with types and penalties
 */
export const getAbsences = async (
  studentId = null,
  subjectId = null,
  semester = null
) => {
  try {
    let q;
    const conditions = [];

    if (studentId) {
      conditions.push(where("studentId", "==", studentId));
    }
    if (subjectId) {
      conditions.push(where("subjectId", "==", subjectId));
    }
    if (semester) {
      conditions.push(where("semester", "==", semester));
    }

    if (conditions.length > 0) {
      q = query(
        collection(db, "absences"),
        ...conditions,
        orderBy("date", "desc")
      );
    } else {
      q = query(collection(db, "absences"), orderBy("date", "desc"));
    }

    const qs = await getDocs(q);
    const items = [];
    qs.forEach((d) => items.push({ docId: d.id, ...d.data() }));
    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const recordAbsence = async (absenceData) => {
  try {
    const absence = {
      ...absenceData,
      createdAt: serverTimestamp(), // UTC in Firestore, displayed in Qatar timezone
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, "absences"), absence);
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateAbsence = async (absenceId, data) => {
  try {
    const docRef = doc(db, "absences", absenceId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteAbsence = async (absenceId) => {
  try {
    await deleteDoc(doc(db, "absences", absenceId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Re-export for backward compatibility
export { ABSENCE_TYPES, calculateAbsenceStats, PENALTY_TYPES };

