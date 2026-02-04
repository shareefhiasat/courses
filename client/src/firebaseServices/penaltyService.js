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
import { addNotification } from "./notificationService";
import { RECORD_TYPES } from "@utils/sharedTypes";

const toYmd = (tsOrDate) => {
  if (!tsOrDate) return null;
  const d = tsOrDate?.toDate ? tsOrDate.toDate() : new Date(tsOrDate);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
};

/**
 * Penalties Collection
 * Track academic penalties for students
 * Based on Arabic academic regulations
 */

export const getPenalties = async (studentId = null, subjectId = null) => {
  try {
    // console.log('🔧 getPenalties called with studentId:', studentId, 'subjectId:', subjectId);
    
    let q;
    if (studentId && subjectId) {
      // console.log('🔧 Querying with studentId and subjectId');
      q = query(
        collection(db, "penalties"),
        where("studentId", "==", studentId),
        where("subjectId", "==", subjectId),
        orderBy("createdAt", "desc")
      );
    } else if (studentId) {
      // console.log('🔧 Querying with studentId only:', studentId);
      q = query(
        collection(db, "penalties"),
        where("studentId", "==", studentId)
        // Temporarily removed orderBy to avoid index requirement
        // orderBy("createdAt", "desc")
      );
    } else if (subjectId) {
      q = query(
        collection(db, "penalties"),
        where("subjectId", "==", subjectId),
        orderBy("createdAt", "desc")
      );
    } else {
      // console.log('🔧 Querying all penalties');
      q = query(collection(db, "penalties"), orderBy("createdAt", "desc"));
    }
    
    const qs = await getDocs(q);
    // console.log('🔧 Query returned', qs.docs.length, 'documents');
    
    const items = [];
    qs.forEach((d) => {
      const penalty = { docId: d.id, ...d.data() };
      items.push(penalty);
      // Debug log each penalty
      // console.log('🔧 getPenalties - found penalty:', {
      //   id: penalty.docId,
      //   studentId: penalty.studentId,
      //   date: penalty.date,
      //   type: penalty.type,
      //   points: penalty.points
      // });
    });
    
    // Sort client-side if we removed server-side orderBy
    if (studentId && !subjectId) {
      items.sort((a, b) => {
        const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds || 0) * 1000;
        const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds || 0) * 1000;
        return bTime - aTime; // descending (newest first)
      });
    }
    
    // console.log('🔧 getPenalties - total penalties found:', items.length, 'for studentId:', studentId);
    return { success: true, data: items };
  } catch (error) {
    console.error('🔧 Error in getPenalties:', error);
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
    console.error('🔧 Error in getPenaltiesByClassAndDate:', error);
    return { success: false, error: error.message };
  }
};

export const createPenalty = async ({
  classId,
  studentId,
  subjectId = null,
  type = RECORD_TYPES.PENALTY,
  points = 0,
  reason = '',
  note = '',
  description = '',
  createdBy,
  performedBy,
  performedByName,
  performedByEmail,
  date = null,
  studentInfo = null,
  className = '',
  sendNotification = true
}) => {
  try {
    const todayStr = date || toYmd(new Date());

    const payload = {
      classId,
      studentId,
      ...(subjectId ? { subjectId } : {}),
      type,
      points,
      reason,
      note,
      description,
      date: todayStr,
      createdBy,
      performedBy,
      performedByName,
      performedByEmail,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, "penalties"), payload);

    // Send notifications if requested
    if (sendNotification && studentId) {
      try {
        const formattedDate = new Date(todayStr).toLocaleDateString('en-GB');
        
        // In-app notification
        await addNotification({
          userId: studentId,
          title: '⚠️ Penalty Recorded',
          message: `Penalty recorded for ${className || 'class'} on ${formattedDate}${description ? ` - ${description}` : ''}`,
          type: RECORD_TYPES.PENALTY,
          classId: classId,
          metadata: {
            date: todayStr,
            points,
            type,
            className: className,
            method: 'manual'
          }
        });
      } catch (notifyError) {
        console.warn('Failed to send penalty notification:', notifyError);
      }
    }

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating penalty record:', error);
    return { success: false, error: error.message };
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

