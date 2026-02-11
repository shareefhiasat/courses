import { doc, deleteDoc, collection, addDoc, serverTimestamp, updateDoc, getDoc, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from './config';
import { notificationGateway } from './notificationGateway';
import { NOTIFICATION_TRIGGERS } from '@constants/notificationTypes';
import { RECORD_TYPES } from '@utils/sharedTypes';
import logger from '@utils/logger';
import { logActivity, ACTIVITY_LOG_TYPES } from './activityLogger';

const toYmd = (tsOrDate) => {
  if (!tsOrDate) return null;
  const d = tsOrDate?.toDate ? tsOrDate.toDate() : new Date(tsOrDate);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Create a participation record
 * @param {Object} params
 * @param {string} params.classId - Class ID
 * @param {string} params.studentId - Student user ID
 * @param {string} params.subjectId - Subject ID (optional)
 * @param {string} params.type - 'participation' or 'behavior' (default: 'participation')
 * @param {number} params.points - Participation points (default: 0)
 * @param {string} params.description - Optional description
 * @param {string} params.createdBy - User ID who created the record
 * @param {string} params.date - Date string (YYYY-MM-DD) (default: today)
 * @param {Object} params.studentInfo - Optional { email, displayName } for notifications
 * @param {string} params.className - Optional class name for notifications
 * @param {boolean} params.sendNotification - Whether to send notification (default: true)
 */
export async function createParticipation({
  classId,
  studentId,
  subjectId = null,
  type = 'participation',
  points = 0,
  description = '',
  createdBy,
  performedBy,
  performedByName,
  performedByEmail,
  date = null,
  studentInfo = null,
  className = '',
  sendNotification = true
}) {
  try {
    const todayStr = date || toYmd(new Date());

    const payload = {
      classId,
      studentId,
      ...(subjectId ? { subjectId } : {}),
      type,
      points,
      description,
      date: todayStr,
      createdBy,
      performedBy,
      performedByName,
      performedByEmail,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'participations'), payload);

    if (sendNotification && studentId) {
      try {
        const actionLabel = points > 0 ? 'added' : 'recorded';
        const formattedDate = new Date(todayStr).toLocaleDateString('en-GB');
        
        // Use smart notification gateway
        await notificationGateway.send(NOTIFICATION_TRIGGERS.PARTICIPATION_RECORDED, {
          userId: studentId,
          role: 'student',
          classId: classId,
          title: `📝 Participation ${actionLabel}`,
          message: `Participation ${actionLabel} for ${className || 'class'} on ${formattedDate}${description ? ` - ${description}` : ''}`,
          type: RECORD_TYPES.PARTICIPATION,
          email: studentInfo?.email,
          templateId: 'participationNotification',
          variables: {
            studentName: studentInfo?.displayName || studentInfo?.email || 'Student',
            className: className || 'Class',
            date: formattedDate,
            category: 'Participation',
            delta: points,
            notes: description || ''
          }
        });
      } catch (notifyError) {
        console.warn('Failed to send participation notification via gateway:', notifyError);
      }
    }

    // Log activity
    try {
      await logActivity(ACTIVITY_LOG_TYPES.PARTICIPATION_CREATED, {
        participationId: docRef.id,
        studentId,
        classId,
        subjectId,
        type
      });
    } catch (logError) {
      logger.warn('Failed to log participation creation:', logError);
    }

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating participation record:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update a participation record
 * @param {string} participationId - Participation record ID
 * @param {Object} updateData - Data to update
 * @param {string} updateData.updatedBy - User ID who updated the record
 */
export async function updateParticipation(participationId, { updatedBy, ...updateData }) {
  try {
    const docRef = doc(db, 'participations', participationId);
    
    // Get existing document to preserve history
    const existingDoc = await getDoc(docRef);
    const existingData = existingDoc.exists() ? existingDoc.data() : {};
    const existingHistory = existingData.history || [];
    
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
      updatedBy,
      // Track update history
      history: [...existingHistory, {
        changedBy: updatedBy,
        changedAt: new Date().toISOString(),
        changes: Object.keys(updateData)
      }]
    });

    // Log activity
    try {
      await logActivity(ACTIVITY_LOG_TYPES.PARTICIPATION_UPDATED, {
        participationId,
        studentId: existingData.studentId,
        classId: existingData.classId,
        subjectId: existingData.subjectId,
        type: existingData.type
      });
    } catch (logError) {
      logger.warn('Failed to log participation update:', logError);
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating participation record:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a participation record
 * Note: Participation records are stored in the participations collection
 */
export async function deleteParticipation(participationId, participationData = null) {
  try {
    if (!participationId) {
      return { success: false, error: 'Participation ID is required' };
    }
    
    // Get document data before deletion for logging
    let dataToDelete = participationData;
    if (!dataToDelete) {
      const docRef = doc(db, 'participations', participationId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        dataToDelete = docSnap.data();
      }
    }
    
    await deleteDoc(doc(db, 'participations', participationId));
    console.log('[Participation] Deleted participation record:', participationId);
    
    // Log activity
    try {
      await logActivity(ACTIVITY_LOG_TYPES.PARTICIPATION_DELETED, {
        participationId,
        studentId: dataToDelete?.studentId,
        classId: dataToDelete?.classId,
        subjectId: dataToDelete?.subjectId,
        type: dataToDelete?.type
      });
    } catch (logError) {
      logger.warn('Failed to log participation deletion:', logError);
    }
    
    return { success: true };
  } catch (error) {
    console.error('[Participation] Error deleting participation record:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get participations by class and date
 * @param {string} classId - Class ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getParticipationsByClassAndDate = async (classId, date) => {
  try {
    const participationsRef = collection(db, "participations");
    // Get all participations ordered by createdAt (no where clause to avoid index requirement)
    const participationsQuery = query(
      participationsRef,
      orderBy("createdAt", "desc")
    );
    const participationsSnapshot = await getDocs(participationsQuery);
    const allParticipations = participationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Filter by classId and date in JavaScript
    const filteredParticipations = allParticipations.filter(participation => 
      participation.classId === classId && (
        participation.date === date || toYmd(participation.createdAt) === date
      )
    );
    
    return { success: true, data: filteredParticipations };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getParticipations = async () => {
  try {
    const participationsRef = collection(db, "participations");
    const participationsQuery = query(participationsRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(participationsQuery);
    const allParticipations = snapshot.docs.map(d => ({ docId: d.id, ...d.data() }));
    return { success: true, data: allParticipations };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Load participations from Firestore
 * @param {Function} setParticipations - Function to set participations state
 * @param {Function} setPageState - Function to set page state
 * @param {Function} toast - Toast function
 * @param {Function} t - Translation function
 */
export async function loadParticipations(
  setParticipations,
  setPageState,
  toast,
  t
) {
  try {
    setPageState('LOADING');
    const snap = await getDocs(query(collection(db, 'participations'), orderBy('createdAt', 'desc')));
    
    const participations = snap.docs.map(doc => ({
      docId: doc.id,
      id: doc.id,
      ...doc.data()
    }));
    
    setParticipations(participations);
    setPageState('LOADED');
  } catch (error) {
    logger.error('Failed to load participations:', error);
    toast?.error(t('failed_to_load_participations') + ': ' + error.message);
    setPageState('ERROR');
  } finally {
    setPageState('IDLE');
  }
};
