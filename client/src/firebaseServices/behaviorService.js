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
 * Create a behavior record
 * @param {Object} params
 * @param {string} params.classId - Class ID
 * @param {string} params.studentId - Student user ID
 * @param {string} params.subjectId - Optional subject ID
 * @param {string} params.type - Type of behavior
 * @param {number} params.points - Behavior points (negative for behavior issues)
 * @param {string} params.description - Optional description
 * @param {string} params.createdBy - User ID who created the record
 * @param {string} params.date - Optional date string (YYYY-MM-DD)
 * @param {Object} params.studentInfo - Optional { email, displayName } for notifications
 * @param {string} params.className - Optional class name for notifications
 * @param {boolean} params.sendNotification - Whether to send notification (default: true)
 */
export async function createBehavior({
  classId,
  studentId,
  subjectId = null,
  programId = null,
  type = 'behavior',
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
    logger.info('BEHAVIOR: Creating behavior record', {
      classId,
      studentId,
      subjectId,
      programId,
      type,
      points,
      description,
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
      description,
      date: todayStr,
      createdBy,
      performedBy,
      performedByName,
      performedByEmail,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'behaviors'), payload);

    if (sendNotification && studentId) {
      try {
        const formattedDate = new Date(todayStr).toLocaleDateString('en-GB');
        
        // Use smart notification gateway
        await notificationGateway.send(NOTIFICATION_TRIGGERS.BEHAVIOR_RECORDED, {
          userId: studentId,
          role: 'student',
          classId: classId,
          title: '⚠️ Behavior Recorded',
          message: `Behavior recorded for ${className || 'class'} on ${formattedDate}${description ? ` - ${description}` : ''}`,
          type: RECORD_TYPES.BEHAVIOR,
          email: studentInfo?.email,
          templateId: 'behaviorNotification',
          variables: {
            studentName: studentInfo?.displayName || studentInfo?.email || 'Student',
            className: className || 'Class',
            date: formattedDate,
            behaviorType: type,
            delta: points,
            notes: description || ''
          }
        });
      } catch (notifyError) {
        console.warn('Failed to send behavior notification via gateway:', notifyError);
      }
    }

    // Log activity
    try {
      await logActivity(ACTIVITY_LOG_TYPES.BEHAVIOR_CREATED, {
        behaviorId: docRef.id,
        studentId,
        classId,
        subjectId,
        type
      });
    } catch (logError) {
      logger.warn('Failed to log behavior creation:', logError);
    }

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating behavior record:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update a behavior record
 * @param {string} behaviorId - Behavior record ID
 * @param {Object} updateData - Data to update
 * @param {string} updateData.updatedBy - User ID who updated the record
 */
export async function updateBehavior(behaviorId, { updatedBy, ...updateData }) {
  try {
    logger.info('BEHAVIOR: Updating behavior record', { behaviorId, updatedBy, updateFields: Object.keys(updateData) });
    
    const docRef = doc(db, 'behaviors', behaviorId);
    
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
      await logActivity(ACTIVITY_LOG_TYPES.BEHAVIOR_UPDATED, {
        behaviorId,
        studentId: existingData.studentId,
        classId: existingData.classId,
        subjectId: existingData.subjectId,
        type: existingData.type
      });
    } catch (logError) {
      logger.warn('Failed to log behavior update:', logError);
    }
    
    // Send update notification if student exists
    if (existingData.studentId) {
      try {
        const formattedDate = new Date().toLocaleDateString('en-GB');
        
        // Get behavior type label
        const behaviorTypeLabel = existingData.type || 'behavior';
        
        await notificationGateway.send(NOTIFICATION_TRIGGERS.BEHAVIOR_UPDATED, {
          userId: existingData.studentId,
          role: 'student',
          classId: existingData.classId,
          title: '✏️ Behavior Record Updated',
          message: `Your behavior record has been updated on ${formattedDate}`,
          type: RECORD_TYPES.BEHAVIOR,
          templateId: 'behaviorUpdateNotification',
          variables: {
            studentName: existingData.studentInfo?.displayName || existingData.studentInfo?.email || 'Student',
            date: formattedDate,
            behaviorType: behaviorTypeLabel,
            updatedFields: Object.keys(updateData).join(', '),
            className: existingData.className || 'Class'
          }
        });
      } catch (notifyError) {
        console.warn('Failed to send behavior update notification via gateway:', notifyError);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating behavior record:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a behavior record
 */
export async function deleteBehavior(behaviorId, behaviorData = null) {
  try {
    logger.info('BEHAVIOR: Deleting behavior record', { behaviorId, hasBehaviorData: !!behaviorData });
    
    if (!behaviorId) {
      return { success: false, error: 'Behavior ID is required' };
    }
    
    // Get document data before deletion for logging
    let dataToDelete = behaviorData;
    if (!dataToDelete) {
      const docRef = doc(db, 'behaviors', behaviorId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        dataToDelete = docSnap.data();
      }
    }
    
    await deleteDoc(doc(db, 'behaviors', behaviorId));
    console.log('[Behavior] Deleted behavior record:', behaviorId);
    
    // Log activity
    try {
      await logActivity(ACTIVITY_LOG_TYPES.BEHAVIOR_DELETED, {
        behaviorId,
        studentId: dataToDelete?.studentId,
        classId: dataToDelete?.classId,
        subjectId: dataToDelete?.subjectId,
        type: dataToDelete?.type
      });
    } catch (logError) {
      logger.warn('Failed to log behavior deletion:', logError);
    }
    
    // Send deletion notification if student exists
    if (dataToDelete?.studentId) {
      try {
        const formattedDate = new Date().toLocaleDateString('en-GB');
        
        // Get behavior type label
        const behaviorTypeLabel = dataToDelete.type || 'behavior';
        
        await notificationGateway.send(NOTIFICATION_TRIGGERS.BEHAVIOR_DELETED, {
          userId: dataToDelete.studentId,
          role: 'student',
          classId: dataToDelete.classId,
          title: '🗑️ Behavior Record Removed',
          message: `Your behavior record has been removed on ${formattedDate}`,
          type: RECORD_TYPES.BEHAVIOR,
          templateId: 'behaviorDeleteNotification',
          variables: {
            studentName: dataToDelete.studentInfo?.displayName || dataToDelete.studentInfo?.email || 'Student',
            date: formattedDate,
            behaviorType: behaviorTypeLabel,
            className: dataToDelete.className || 'Class'
          }
        });
      } catch (notifyError) {
        console.warn('Failed to send behavior deletion notification via gateway:', notifyError);
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('[Behavior] Error deleting behavior record:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get behaviors by class and date
 * @param {string} classId - Class ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getBehaviorsByClassAndDate = async (classId, date) => {
  try {
    const behaviorsRef = collection(db, "behaviors");
    // Get all behaviors ordered by createdAt (no where clause to avoid index requirement)
    const behaviorsQuery = query(
      behaviorsRef,
      orderBy("createdAt", "desc")
    );
    const behaviorsSnapshot = await getDocs(behaviorsQuery);
    const allBehaviors = behaviorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Filter by classId and date in JavaScript
    const filteredBehaviors = allBehaviors.filter(behavior => 
      behavior.classId === classId && (
        behavior.date === date || toYmd(behavior.createdAt) === date
      )
    );
    
    return { success: true, data: filteredBehaviors };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getBehaviors = async () => {
  try {
    const behaviorsRef = collection(db, 'behaviors');
    const behaviorsQuery = query(behaviorsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(behaviorsQuery);
    const allBehaviors = snapshot.docs.map(d => ({ docId: d.id, ...d.data() }));
    return { success: true, data: allBehaviors };
  } catch (error) {
    logger.error('BEHAVIOR_SERVICE: Error getting behaviors:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Load behaviors from Firestore with enrichment
 * @param {Object} params - Parameters object
 * @param {Function} params.setBehaviors - Function to set behaviors state
 * @param {Function} params.setPageState - Function to set page state
 * @param {Function} params.toast - Toast function
 * @param {Function} params.t - Translation function
 * @param {Array} params.classes - Classes array for enrichment
 * @param {Array} params.programs - Programs array for enrichment
 * @param {Array} params.subjects - Subjects array for enrichment
 * @param {Object} params.filters - Filters to apply
 * @param {Function} params.getUserById - Function to fetch user data
 * @param {Function} params.fetchClass - Function to fetch class data
 * @param {Function} params.fetchSubject - Function to fetch subject data
 * @param {Function} params.fetchProgram - Function to fetch program data
 */
export async function loadBehaviors({
  setBehaviors,
  setPageState,
  toast,
  t,
  classes = [],
  programs = [],
  subjects = [],
  filters = {},
  getUserById,
  fetchClass,
  fetchSubject,
  fetchProgram
}) {
  try {
    setPageState('LOADING');
    const result = await getBehaviors();
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    let data = result.data.map(d => ({ id: d.id, docId: d.id, ...d }));
    
    // Enrich with student, class, subject, program info
    const enriched = await Promise.all(data.map(async (behavior) => {
      const enrichedBehavior = { 
        ...behavior,
        id: behavior.id || behavior.docId,
        docId: behavior.docId || behavior.id
      };
      
      try {
        // Initialize with N/A as fallback
        enrichedBehavior.studentName = 'N/A';
        enrichedBehavior.className = 'N/A';
        enrichedBehavior.subjectName = 'N/A';
        enrichedBehavior.programName = 'N/A';
        
        // Get student information
        if (enrichedBehavior.studentId) {
          try {
            const userResult = await getUserById(enrichedBehavior.studentId);
            if (userResult.success && userResult.data) {
              enrichedBehavior.studentName = userResult.data.displayName || userResult.data.email || 'N/A';
              enrichedBehavior.studentEmail = userResult.data.email;
            }
          } catch (err) {
            logger.error('Failed to fetch student:', enrichedBehavior.studentId, err);
          }
        }
        
        // Get class information
        if (enrichedBehavior.classId) {
          try {
            const classData = await fetchClass(enrichedBehavior.classId);
            if (classData && classData.success) {
              enrichedBehavior.className = classData.data.name || classData.data.code || 'N/A';
              enrichedBehavior.classTerm = classData.data.term;
              
              // If subjectId is missing, try to get it from class
              if (!enrichedBehavior.subjectId && classData.data.subjectId) {
                enrichedBehavior.subjectId = classData.data.subjectId;
              }
            }
          } catch (err) {
            logger.error('Failed to fetch class:', enrichedBehavior.classId, err);
          }
        }
        
        // Get subject and program information
        const subjectIdToLoad = enrichedBehavior.subjectId;
        if (subjectIdToLoad) {
          try {
            const subjectData = await fetchSubject(subjectIdToLoad);
            if (subjectData && subjectData.success) {
              enrichedBehavior.subjectName = subjectData.data.name_en || subjectData.data.name_ar || subjectData.data.code || 'N/A';
              
              // Get program from subject
              if (subjectData.data.programId) {
                try {
                  const programData = await fetchProgram(subjectData.data.programId);
                  if (programData && programData.success) {
                    enrichedBehavior.programName = programData.data.name_en || programData.data.name_ar || programData.data.code || 'N/A';
                  }
                } catch (err) {
                  enrichedBehavior.programName = 'N/A';
                }
              }
            }
          } catch (err) {
            logger.error('Failed to fetch subject:', subjectIdToLoad, err);
          }
        }
        
        // Get instructor information
        if (enrichedBehavior.createdBy) {
          try {
            const instructorData = await getUserById(enrichedBehavior.createdBy);
            if (instructorData.success && instructorData.data) {
              enrichedBehavior.instructorName = instructorData.data.displayName || instructorData.data.email;
            }
          } catch (err) {
            logger.error('Failed to fetch instructor:', enrichedBehavior.createdBy, err);
          }
        }
        
      } catch (err) {
        logger.error('Failed to enrich behavior:', enrichedBehavior.id || enrichedBehavior.docId, err);
      }
      
      return enrichedBehavior;
    }));
    
    // Apply filters
    let filtered = enriched;
    if (filters.programFilter) {
      filtered = filtered.filter(b => {
        if (b.subjectId) {
          const subject = subjects.find(s => (s.docId || s.id) === b.subjectId);
          return subject?.programId === filters.programFilter;
        }
        return false;
      });
    }
    if (filters.subjectFilter) {
      filtered = filtered.filter(b => {
        if (b.subjectId) return b.subjectId === filters.subjectFilter;
        if (b.classId) {
          const classItem = classes.find(c => (c.id || c.docId) === b.classId);
          return classItem?.subjectId === filters.subjectFilter;
        }
        return false;
      });
    }
    if (filters.classFilter) {
      filtered = filtered.filter(b => b.classId === filters.classFilter);
    }
    if (filters.typeFilter && filters.typeFilter !== 'all') {
      filtered = filtered.filter(b => b.type === filters.typeFilter);
    }
    
    setBehaviors(filtered);
    setPageState('LOADED');
  } catch (error) {
    logger.error('Failed to load behaviors:', error);
    toast?.error(t('failed_to_load_behaviors') + ': ' + error.message);
    setPageState('ERROR');
  } finally {
    setPageState('IDLE');
  }
}
