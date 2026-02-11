import { doc, deleteDoc, collection, addDoc, serverTimestamp, updateDoc, getDoc, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from './config';
import { notificationGateway } from './notificationGateway';
import { NOTIFICATION_TRIGGERS } from '@constants/notificationTypes';
import { RECORD_TYPES } from '@utils/sharedTypes';
import { USER_ROLES } from '@constants/userRoles';
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
  programId = null,
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
      ...(programId ? { programId } : {}),
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
          role: USER_ROLES.STUDENT,
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
    
    // Send update notification if student exists
    if (existingData.studentId) {
      try {
        const formattedDate = new Date().toLocaleDateString('en-GB');
        
        // Get participation type label
        const participationTypeLabel = existingData.type || 'participation';
        
        await notificationGateway.send(NOTIFICATION_TRIGGERS.PARTICIPATION_UPDATED, {
          userId: existingData.studentId,
          role: USER_ROLES.STUDENT,
          classId: existingData.classId,
          title: '✏️ Participation Record Updated',
          message: `Your participation record has been updated on ${formattedDate}`,
          type: RECORD_TYPES.PARTICIPATION,
          templateId: 'participationUpdateNotification',
          variables: {
            studentName: existingData.studentInfo?.displayName || existingData.studentInfo?.email || 'Student',
            date: formattedDate,
            participationType: participationTypeLabel,
            updatedFields: Object.keys(updateData).join(', '),
            className: existingData.className || 'Class'
          }
        });
      } catch (notifyError) {
        console.warn('Failed to send participation update notification via gateway:', notifyError);
      }
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
    
    // Send deletion notification if student exists
    if (dataToDelete?.studentId) {
      try {
        const formattedDate = new Date().toLocaleDateString('en-GB');
        
        // Get participation type label
        const participationTypeLabel = dataToDelete.type || 'participation';
        
        await notificationGateway.send(NOTIFICATION_TRIGGERS.PARTICIPATION_DELETED, {
          userId: dataToDelete.studentId,
          role: USER_ROLES.STUDENT,
          classId: dataToDelete.classId,
          title: '🗑️ Participation Record Removed',
          message: `Your participation record has been removed on ${formattedDate}`,
          type: RECORD_TYPES.PARTICIPATION,
          templateId: 'participationDeleteNotification',
          variables: {
            studentName: dataToDelete.studentInfo?.displayName || dataToDelete.studentInfo?.email || 'Student',
            date: formattedDate,
            participationType: participationTypeLabel,
            className: dataToDelete.className || 'Class'
          }
        });
      } catch (notifyError) {
        console.warn('Failed to send participation deletion notification via gateway:', notifyError);
      }
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
 * Load participations from Firestore with enrichment
 * @param {Object} params - Parameters object
 * @param {Function} params.setParticipations - Function to set participations state
 * @param {Function} params.setPageState - Function to set page state
 * @param {Function} params.toast - Toast function
 * @param {Function} params.t - Translation function
 * @param {Array} params.classes - Classes array for enrichment
 * @param {Array} params.programs - Programs array for enrichment
 * @param {Array} params.subjects - Subjects array for enrichment
 * @param {Object} params.filters - Filters to apply
 */
export async function loadParticipations({
  setParticipations,
  setPageState,
  toast,
  t,
  classes = [],
  programs = [],
  subjects = [],
  filters = {}
}) {
  try {
    setPageState('LOADING');
    const snap = await getDocs(query(collection(db, 'participations'), orderBy('createdAt', 'desc')));
    
    const participations = snap.docs.map(doc => ({
      docId: doc.id,
      id: doc.id,
      ...doc.data()
    }));
    
    // Enrich participations with program, subject, and class names
    const enrichedParticipations = participations.map(participation => {
      const enriched = { ...participation };
      
      // Get class information
      if (participation.classId) {
        const classItem = classes.find(c => (c.id || c.docId) === participation.classId);
        if (classItem) {
          enriched.className = classItem.name || classItem.code || 'N/A';
          enriched.classTerm = classItem.term;
          
          // Get subject information
          if (classItem.subjectId) {
            const subject = subjects.find(s => (s.docId || s.id) === classItem.subjectId);
            if (subject) {
              enriched.subjectName = subject.name || subject.code || 'N/A';
              
              // Get program information
              if (subject.programId) {
                const program = programs.find(p => (p.docId || p.id) === subject.programId);
                if (program) {
                  enriched.programName = program.name || program.code || 'N/A';
                }
              }
            }
          }
        }
      }
      
      return enriched;
    });
    
    // Apply filters
    let filtered = enrichedParticipations;
    if (filters.programFilter) {
      filtered = filtered.filter(p => {
        if (p.subjectId) {
          const subject = subjects.find(s => (s.docId || s.id) === p.subjectId);
          return subject?.programId === filters.programFilter;
        }
        return false;
      });
    }
    if (filters.subjectFilter) {
      filtered = filtered.filter(p => {
        if (p.subjectId) return p.subjectId === filters.subjectFilter;
        if (p.classId) {
          const classItem = classes.find(c => (c.id || c.docId) === p.classId);
          return classItem?.subjectId === filters.subjectFilter;
        }
        return false;
      });
    }
    if (filters.classFilter) {
      filtered = filtered.filter(p => p.classId === filters.classFilter);
    }
    if (filters.typeFilter && filters.typeFilter !== 'all') {
      filtered = filtered.filter(p => p.type === filters.typeFilter);
    }
    
    setParticipations(filtered);
    setPageState('LOADED');
  } catch (error) {
    logger.error('Failed to load participations:', error);
    toast?.error(t('failed_to_load_participations') + ': ' + error.message);
    setPageState('ERROR');
  } finally {
    setPageState('IDLE');
  }
};
