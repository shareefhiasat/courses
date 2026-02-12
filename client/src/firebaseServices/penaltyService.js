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
import { notificationGateway } from "./notificationGateway";
import { NOTIFICATION_TRIGGERS } from "@constants/notificationTypes";
import { RECORD_TYPES } from "@utils/sharedTypes";
import { USER_ROLES } from "@constants/userRoles";
import logger from "@utils/logger";
import { logActivity, ACTIVITY_LOG_TYPES } from "./activityLogger";

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
    logger.info('PENALTIES: Fetching penalties', { studentId, subjectId });
    
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
  programId = null,
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
    logger.info('PENALTIES: Creating penalty', {
      classId,
      studentId,
      subjectId,
      programId,
      type,
      points,
      reason,
      performedBy,
      performedByName
    });
    const todayStr = date || toYmd(new Date());

    const payload = {
      classId,
      studentId,
      ...(subjectId ? { subjectId } : {}),
      ...(programId ? { programId } : {}),
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
        
        // Use smart notification gateway
        await notificationGateway.send(NOTIFICATION_TRIGGERS.PENALTY_ISSUED, {
          userId: studentId,
          role: USER_ROLES.STUDENT,
          classId: classId,
          title: '⚠️ Penalty Recorded',
          message: `Penalty recorded for ${className || 'class'} on ${formattedDate}${description ? ` - ${description}` : ''}`,
          type: RECORD_TYPES.PENALTY,
          email: studentInfo?.email,
          templateId: 'penaltyNotification',
          variables: {
            studentName: studentInfo?.displayName || studentInfo?.email || 'Student',
            className: className || 'Class',
            date: formattedDate,
            penaltyType: type,
            points,
            reason,
            notes: description || note || ''
          }
        });
      } catch (notifyError) {
        console.warn('Failed to send penalty notification via gateway:', notifyError);
      }
    }

    // Log activity
    try {
      await logActivity(ACTIVITY_LOG_TYPES.PENALTY_CREATED, {
        penaltyId: docRef.id,
        studentId,
        classId,
        subjectId,
        type
      });
    } catch (logError) {
      logger.warn('Failed to log penalty creation:', logError);
    }

    return { success: true, id: docRef.id };
  } catch (error) {
    logger.error('PENALTIES: Failed to create penalty', { error: error.message, penaltyData: { classId, studentId, type, points } });
    return { success: false, error: error.message };
  }
};

export const updatePenalty = async (penaltyId, data) => {
  try {
    logger.info('PENALTIES: Updating penalty', { penaltyId, updatedBy: data.updatedBy, updateFields: Object.keys(data) });
    
    const {
      updatedBy, // User ID who updated the penalty
      ...updateFields
    } = data;
    
    // Get existing document for logging
    const docRef = doc(db, "penalties", penaltyId);
    const existingDoc = await getDoc(docRef);
    const existingData = existingDoc.exists() ? existingDoc.data() : {};
    
    await updateDoc(docRef, {
      ...updateFields,
      updatedAt: serverTimestamp(),
      updatedBy: updatedBy || null,
    });
    
    // Log activity
    try {
      await logActivity(ACTIVITY_LOG_TYPES.PENALTY_UPDATED, {
        penaltyId,
        studentId: existingData.studentId,
        classId: existingData.classId,
        subjectId: existingData.subjectId,
        type: existingData.type
      });
    } catch (logError) {
      logger.warn('Failed to log penalty update:', logError);
    }
    
    // Send update notification if student exists
    if (existingData.studentId) {
      try {
        const formattedDate = new Date().toLocaleDateString('en-GB');
        
        // Get penalty type label
        const penaltyTypeLabel = existingData.type || 'penalty';
        
        await notificationGateway.send(NOTIFICATION_TRIGGERS.PENALTY_UPDATED, {
          userId: existingData.studentId,
          role: USER_ROLES.STUDENT,
          classId: existingData.classId,
          title: '✏️ Penalty Updated',
          message: `Your penalty record has been updated on ${formattedDate}`,
          type: RECORD_TYPES.PENALTY,
          templateId: 'penaltyUpdateNotification',
          variables: {
            studentName: existingData.studentInfo?.displayName || existingData.studentInfo?.email || 'Student',
            date: formattedDate,
            penaltyType: penaltyTypeLabel,
            updatedFields: Object.keys(updateFields).join(', '),
            className: existingData.className || 'Class'
          }
        });
      } catch (notifyError) {
        console.warn('Failed to send penalty update notification via gateway:', notifyError);
      }
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deletePenalty = async (penaltyId, penaltyData = null) => {
  try {
    logger.info('PENALTIES: Deleting penalty', { penaltyId, hasPenaltyData: !!penaltyData });
    
    // Get document data before deletion for logging
    let dataToDelete = penaltyData;
    if (!dataToDelete) {
      const docRef = doc(db, "penalties", penaltyId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        dataToDelete = docSnap.data();
      }
    }
    
    await deleteDoc(doc(db, "penalties", penaltyId));
    
    // Log activity
    try {
      await logActivity(ACTIVITY_LOG_TYPES.PENALTY_DELETED, {
        penaltyId,
        studentId: dataToDelete?.studentId,
        classId: dataToDelete?.classId,
        subjectId: dataToDelete?.subjectId,
        type: dataToDelete?.type
      });
    } catch (logError) {
      logger.warn('Failed to log penalty deletion:', logError);
    }
    
    // Send deletion notification if student exists
    if (dataToDelete?.studentId) {
      try {
        const formattedDate = new Date().toLocaleDateString('en-GB');
        
        // Get penalty type label
        const penaltyTypeLabel = dataToDelete.type || 'penalty';
        
        await notificationGateway.send(NOTIFICATION_TRIGGERS.PENALTY_DELETED, {
          userId: dataToDelete.studentId,
          role: USER_ROLES.STUDENT,
          classId: dataToDelete.classId,
          title: '🗑️ Penalty Removed',
          message: `Your penalty record has been removed on ${formattedDate}`,
          type: RECORD_TYPES.PENALTY,
          templateId: 'penaltyDeleteNotification',
          variables: {
            studentName: dataToDelete.studentInfo?.displayName || dataToDelete.studentInfo?.email || 'Student',
            date: formattedDate,
            penaltyType: penaltyTypeLabel,
            className: dataToDelete.className || 'Class'
          }
        });
      } catch (notifyError) {
        console.warn('Failed to send penalty deletion notification via gateway:', notifyError);
      }
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

