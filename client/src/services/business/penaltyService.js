import { notificationGateway } from "./notificationGateway";
import { NOTIFICATION_TRIGGERS } from "@constants/notificationTypes";
import { RECORD_TYPES } from "@utils/sharedTypes";
import { ROLE_STRINGS } from "@utils/userUtils";
import logger from '@utils/logger';
import { PENALTY_TYPES } from "@constants/penaltyTypes";
import { logActivity, ACTIVITY_LOG_TYPES } from '../other/activityLogger';
import {
  createPenalty as createPenaltyInDb,
  updatePenalty as updatePenaltyInDb,
  deletePenalty as deletePenaltyInDb,
  getPenalty as getPenaltyFromDb,
  getPenalties as getPenaltiesFromDb,
  getPenaltiesByStudent as getPenaltiesByStudentFromDb,
  getPenaltiesByClass as getPenaltiesByClassFromDb,
  getPenaltiesByClassAndDate as getPenaltiesByClassAndDateFromDb
} from '../db/penaltyDbService';

const toYmd = (tsOrDate) => {
  if (!tsOrDate) return null;
  const d = tsOrDate?.toDate ? tsOrDate.toDate() : new Date(tsOrDate);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
};

/**
 * Create a penalty record
 * @param {Object} params
 * @param {string} params.classId - Class ID
 * @param {string} params.studentId - Student user ID
 * @param {string} params.subjectId - Optional subject ID
 * @param {string} params.type - Type of penalty
 * @param {number} params.points - Penalty points (negative for penalties)
 * @param {string} params.description - Optional description
 * @param {string} params.createdBy - User ID who created the record
 * @param {string} params.date - Optional date string (YYYY-MM-DD)
 * @param {Object} params.studentInfo - Optional { email, displayName } for notifications
 * @param {string} params.className - Optional class name for notifications
 * @param {boolean} params.sendNotification - Whether to send notification (default: true)
 */
export async function createPenalty({
  classId,
  studentId,
  subjectId = null,
  programId = null,
  type,
  points,
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
    logger.info('PENALTY: Creating penalty record', {
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
      performedByEmail
    };

    const result = await createPenaltyInDb(payload);

    // Check if database operation was successful
    if (!result || !result.success || !result.data || !result.data.id) {
      throw new Error('Failed to create penalty record in database');
    }

    if (sendNotification && studentId) {
      try {
        const actionLabel = points < 0 ? 'recorded' : 'added';
        const formattedDate = new Date(todayStr).toLocaleDateString('en-GB');
        
        // Use smart notification gateway
        await notificationGateway.send(NOTIFICATION_TRIGGERS.PENALTY_ISSUED, {
          userId: studentId,
          role: ROLE_STRINGS.STUDENT,
          classId: classId,
          title: `⚠️ Penalty ${actionLabel}`,
          message: `Penalty ${actionLabel} for ${className || 'class'} on ${formattedDate}${description ? ` - ${description}` : ''}`,
          type: RECORD_TYPES.PENALTY,
          email: studentInfo?.email,
          templateId: 'penaltyNotification',
          variables: {
            studentName: studentInfo?.displayName || studentInfo?.email || 'Student',
            className: className || 'Class',
            date: formattedDate,
            category: 'Penalty',
            delta: points,
            notes: description || ''
          }
        });
      } catch (notifyError) {
        console.warn('Failed to send penalty notification via gateway:', notifyError);
      }
    }

    // Log activity
    try {
      await logActivity(ACTIVITY_LOG_TYPES.PENALTY_CREATED, {
        penaltyId: result.data?.id || 'unknown',
        studentId,
        classId,
        subjectId,
        type
      });
    } catch (logError) {
      logger.warn('Failed to log penalty creation:', logError);
    }

    return { success: true, id: result.data.id };
  } catch (error) {
    console.error('Error creating penalty record:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update a penalty record
 * @param {string} penaltyId - Penalty record ID
 * @param {Object} updateData - Data to update
 * @param {string} updateData.updatedBy - User ID who updated the record
 */
export async function updatePenalty(penaltyId, { updatedBy, ...updateData }) {
  try {
    logger.info('PENALTY: Updating penalty record', { penaltyId, updatedBy, updateFields: Object.keys(updateData) });
    
    const existingDoc = await getPenaltyFromDb(penaltyId);
    const existingData = existingDoc.exists ? existingDoc.data() : {};
    const existingHistory = existingData.history || [];
    
    const result = await updatePenaltyInDb(penaltyId, {
      ...updateData,
      updatedAt: new Date().toISOString(),
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
          role: ROLE_STRINGS.STUDENT,
          classId: existingData.classId,
          title: '✏️ Penalty Record Updated',
          message: `Your penalty record has been updated on ${formattedDate}`,
          type: RECORD_TYPES.PENALTY,
          templateId: 'penaltyUpdateNotification',
          variables: {
            studentName: existingData.studentInfo?.displayName || existingData.studentInfo?.email || 'Student',
            date: formattedDate,
            penaltyType: penaltyTypeLabel,
            updatedFields: Object.keys(updateData).join(', '),
            className: existingData.className || 'Class'
          }
        });
      } catch (notifyError) {
        console.warn('Failed to send penalty update notification via gateway:', notifyError);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating penalty record:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a penalty record
 * Note: Penalty records are stored in the penalties collection
 */
export async function deletePenalty(penaltyId, penaltyData = null) {
  try {
    logger.info('PENALTY: Deleting penalty record', { penaltyId, hasPenaltyData: !!penaltyData });
    
    if (!penaltyId) {
      return { success: false, error: 'Penalty ID is required' };
    }
    
    // Get document data before deletion for logging
    let dataToDelete = penaltyData;
    if (!dataToDelete) {
      const existingDoc = await getPenaltyFromDb(penaltyId);
      if (existingDoc.exists) {
        dataToDelete = existingDoc.data();
      }
    }
    
    const result = await deletePenaltyInDb(penaltyId);
    logger.log('[Penalty] Deleted penalty record:', penaltyId);
    
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
          role: ROLE_STRINGS.STUDENT,
          classId: dataToDelete.classId,
          title: '🗑️ Penalty Record Removed',
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
    console.error('[Penalty] Error deleting penalty record:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get penalties by class and date
 * @param {string} classId - Class ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getPenaltiesByClassAndDate = async (classId, date) => {
  try {
    const result = await getPenaltiesByClassAndDateFromDb(classId, date);
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getPenalties = async (studentId = null) => {
  try {
    // If studentId is provided, filter by student
    if (studentId) {
      const result = await getPenaltiesByStudentFromDb(studentId);
      return { success: true, data: result.data };
    }
    // Otherwise return all penalties
    const result = await getPenaltiesFromDb();
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getPenaltiesByStudent = async (studentId) => {
  try {
    const result = await getPenaltiesByStudentFromDb(studentId);
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Load penalties from database layer with enrichment
 * @param {Object} params - Parameters object
 * @param {Function} params.setPenalties - Function to set penalties state
 * @param {Function} params.setPageState - Function to set page state
 * @param {Function} params.toast - Toast function
 * @param {Function} params.t - Translation function
 * @param {Array} params.classes - Classes array for enrichment
 * @param {Array} params.programs - Programs array for enrichment
 * @param {Array} params.subjects - Subjects array for enrichment
 * @param {Object} params.filters - Filters to apply
 */
export async function loadPenalties({
  setPenalties,
  setPageState,
  toast,
  t,
  classes = [],
  programs = [],
  subjects = [],
  filters = {},
  lang = 'en'
}) {
  try {
    setPageState('LOADING');
    
    // Use database layer instead of direct Firebase calls
    const result = await getPenaltiesFromDb();
    const penalties = result.data || [];
    
    // Enrich penalties with program, subject, and class names
    const enrichedPenalties = penalties.map(penalty => {
      const enriched = { ...penalty };
      
      // Get class information
      if (penalty.classId) {
        const classItem = classes.find(c => (c.id || c.docId) === penalty.classId);
        if (classItem) {
          enriched.className = classItem.name || classItem.code || 'N/A';
          enriched.classTerm = classItem.term;
          
          // Get subject information
          if (classItem.subjectId) {
            const subject = subjects.find(s => (s.docId || s.id) === classItem.subjectId);
            if (subject) {
              // Store both name and ID for grid columns - use proper language fields
              enriched.subjectName = lang === 'ar' 
                ? (subject.name_ar || subject.name_en || subject.name || subject.code || 'N/A')
                : (subject.name_en || subject.name_ar || subject.name || subject.code || 'N/A');
              enriched.subjectName_en = subject.name_en || subject.name_ar || subject.name || subject.code || 'N/A';
              enriched.subjectName_ar = subject.name_ar || subject.name_en || subject.name || subject.code || 'N/A';
              enriched.subjectId = subject.docId || subject.id; // Add subject ID
              
              // Get program information
              if (subject.programId) {
                const program = programs.find(p => (p.docId || p.id) === subject.programId);
                if (program) {
                  // Store both name and ID for grid columns - use proper language fields
                  enriched.programName = lang === 'ar'
                    ? (program.name_ar || program.name_en || program.name || program.code || 'N/A')
                    : (program.name_en || program.name_ar || program.name || program.code || 'N/A');
                  enriched.programName_en = program.name_en || program.name_ar || program.name || program.code || 'N/A';
                  enriched.programName_ar = program.name_ar || program.name_en || program.name || program.code || 'N/A';
                  enriched.programId = program.docId || program.id; // Add program ID
                  
                } else {
                  logger.warn('Penalty enrichment: program not found', { programId: subject.programId });
                }
              } else {
                logger.warn('Penalty enrichment: subject missing programId', { subjectId: classItem.subjectId });
              }
            } else {
              logger.warn('Penalty enrichment: class missing subjectId', { classId: penalty.classId });
            }
          } else {
            logger.warn('Penalty enrichment: missing classId', { classId: penalty.classId });
          }
        } else {
          logger.warn('Penalty enrichment: class not found', { classId: penalty.classId });
        }
      } else {
        logger.warn('Penalty enrichment: missing classId', { penaltyId: penalty.docId });
      }
      return enriched;
    });
    
    // Apply filters
    let filtered = enrichedPenalties;
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
    
    setPenalties(filtered);
    setPageState('LOADED');
  } catch (error) {
    logger.error('Failed to load penalties:', error);
    toast?.error(t('failed_to_load_penalties') + ': ' + error.message);
    setPageState('ERROR');
  } finally {
    setPageState('IDLE');
  }
};
