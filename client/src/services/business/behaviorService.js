import { notificationGateway } from './notificationGateway';
import { NOTIFICATION_TRIGGERS } from '@constants/notificationTypes';
import { RECORD_TYPES } from '@utils/sharedTypes';
import { USER_ROLES } from '@constants/userRoles';
import logger from '@utils/logger';
import { logActivity, ACTIVITY_LOG_TYPES } from '../other/activityLogger';
import { getCreateAuditData, getUpdateAuditData } from '@utils/auditHelper';
import {
  createBehavior as createBehaviorInDb,
  updateBehavior as updateBehaviorInDb,
  deleteBehavior as deleteBehaviorInDb,
  getBehavior as getBehaviorFromDb,
  getBehaviors as getBehaviorsFromDb,
  getBehaviorsByStudent as getBehaviorsByStudentFromDb,
  getBehaviorsByClass as getBehaviorsByClassFromDb,
  getBehaviorsByClassAndDate as getBehaviorsByClassAndDateFromDb
} from '../db/behaviorDbService';

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
 * @param {Object} params.user - User object who created the record
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
  type,
  points,
  description = '',
  user,
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

    const auditData = getCreateAuditData(user);
    const payload = {
      classId,
      studentId,
      ...(subjectId ? { subjectId } : {}),
      ...(programId ? { programId } : {}),
      type,
      points,
      description,
      date: todayStr,
      performedBy,
      performedByName,
      performedByEmail,
      ...auditData
    };

    const result = await createBehaviorInDb(payload);

    if (sendNotification && studentId) {
      try {
        const actionLabel = points < 0 ? 'recorded' : 'added';
        const formattedDate = new Date(todayStr).toLocaleDateString('en-GB');
        
        // Use smart notification gateway
        await notificationGateway.send(NOTIFICATION_TRIGGERS.BEHAVIOR_RECORDED, {
          userId: studentId,
          role: USER_ROLES.STUDENT,
          classId: classId,
          title: `📋 Behavior ${actionLabel}`,
          message: `Behavior ${actionLabel} for ${className || 'class'} on ${formattedDate}${description ? ` - ${description}` : ''}`,
          type: RECORD_TYPES.BEHAVIOR,
          email: studentInfo?.email,
          templateId: 'behaviorNotification',
          variables: {
            studentName: studentInfo?.displayName || studentInfo?.email || 'Student',
            className: className || 'Class',
            date: formattedDate,
            category: 'Behavior',
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
        behaviorId: result.id,
        studentId,
        classId,
        subjectId,
        type
      });
    } catch (logError) {
      logger.warn('Failed to log behavior creation:', logError);
    }

    return { success: true, id: result.id };
  } catch (error) {
    console.error('Error creating behavior record:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update a behavior record
 * @param {string} behaviorId - Behavior record ID
 * @param {Object} updateData - Data to update
 * @param {Object} user - User object who updated the record
 */
export async function updateBehavior(behaviorId, updateData, user) {
  try {
    logger.info('BEHAVIOR: Updating behavior record', { behaviorId, userId: user?.uid, updateFields: Object.keys(updateData) });
    
    const existingDoc = await getBehaviorFromDb(behaviorId);
    const existingData = existingDoc.exists ? existingDoc.data() : {};
    const existingHistory = existingData.history || [];
    
    const auditData = getUpdateAuditData(user);
    const result = await updateBehaviorInDb(behaviorId, {
      ...updateData,
      ...auditData,
      // Track update history
      history: [...existingHistory, {
        changedBy: user?.uid,
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
          role: USER_ROLES.STUDENT,
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
 * Note: Behavior records are stored in the behaviors collection
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
      const existingDoc = await getBehaviorFromDb(behaviorId);
      if (existingDoc.exists) {
        dataToDelete = existingDoc.data();
      }
    }
    
    const result = await deleteBehaviorInDb(behaviorId);
    logger.log('[Behavior] Deleted behavior record:', behaviorId);
    
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
          role: USER_ROLES.STUDENT,
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
    const result = await getBehaviorsByClassAndDateFromDb(classId, date);
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getBehaviors = async () => {
  try {
    const result = await getBehaviorsFromDb();
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Load behaviors from database layer with enrichment
 * @param {Object} params - Parameters object
 * @param {Function} params.setBehaviors - Function to set behaviors state
 * @param {Function} params.setPageState - Function to set page state
 * @param {Function} params.toast - Toast function
 * @param {Function} params.t - Translation function
 * @param {Array} params.classes - Classes array for enrichment
 * @param {Array} params.programs - Programs array for enrichment
 * @param {Array} params.subjects - Subjects array for enrichment
 * @param {Object} params.filters - Filters to apply
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
  lang = 'en'
}) {
  try {
    setPageState('LOADING');
    
    // Use database layer instead of direct Firebase calls
    const result = await getBehaviorsFromDb();
    const behaviors = result.data || [];
    
    // Enrich behaviors with program, subject, and class names
    const enrichedBehaviors = behaviors.map(behavior => {
      const enriched = { ...behavior };
      
      // Get class information
      if (behavior.classId) {
        const classItem = classes.find(c => (c.id || c.docId) === behavior.classId);
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
                  logger.warn('Behavior enrichment: program not found', { programId: subject.programId });
                }
              } else {
                logger.warn('Behavior enrichment: subject missing programId', { subjectId: classItem.subjectId });
              }
            } else {
              logger.warn('Behavior enrichment: class missing subjectId', { classId: behavior.classId });
            }
          } else {
            logger.warn('Behavior enrichment: missing classId', { classId: behavior.classId });
          }
        } else {
          logger.warn('Behavior enrichment: class not found', { classId: behavior.classId });
        }
      } else {
        logger.warn('Behavior enrichment: missing classId', { behaviorId: behavior.docId });
      }
      return enriched;
    });
    
    // Apply filters
    let filtered = enrichedBehaviors;
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
};
