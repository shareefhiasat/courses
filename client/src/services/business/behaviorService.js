import { RECORD_TYPES } from '@utils/sharedTypes';
import { ROLE_STRINGS } from '@utils/userUtils';
import { info, error, warn, debug } from '../utils/logger.js';
import { logActivity, ACTIVITY_LOG_TYPES } from '../other/activityLogger';
// import { notificationGateway } from './notificationGateway'; // Removed - notifications now handled by backend
// import { NOTIFICATION_TRIGGERS } from '@constants/notificationTypes'; // Removed - notifications now handled by backend
import { getCreateAuditData, getUpdateAuditData } from '@utils/auditHelper';
import behaviorDbService from '../db/behaviorDbService-postgres.js';

const serviceName = 'behaviorService';

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
    info(`${serviceName}:createBehavior`, {
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
      classId: classId ? parseInt(classId) : null,
      userId: parseInt(studentId),
      ...(subjectId ? { subjectId: parseInt(subjectId) } : {}),
      ...(programId ? { programId: parseInt(programId) } : {}),
      // Automatically map numeric type to typeId or fallback to 1
      typeId: typeof type === 'number' ? type : (typeof type === 'string' ? parseInt(type) || 1 : 1),
      points: typeof points !== 'undefined' ? Number(points) : 0,
      descriptionEn: description || '',
      descriptionAr: description || '',
      date: todayStr,
      performedBy,
      performedByName,
      performedByEmail,
      ...auditData
    };

    if (typeof type === 'string') {
      console.warn('⚠️ [DEBUG] Legacy string type code received in behaviorService:', type);
    }

    const result = await behaviorDbService.create(payload);

    // Check if database operation was successful
    if (!result || !result.success || !result.data || !result.data.id) {
      throw new Error('Failed to create behavior record in database');
    }

    if (sendNotification && studentId) {
      // Notifications are now handled by the backend
    }

    // Log activity
    try {
      await logActivity(ACTIVITY_LOG_TYPES.BEHAVIOR_CREATED, {
        behaviorId: result.data?.id || 'unknown',
        studentId,
        classId,
        subjectId,
        type
      });
    } catch (logError) {
      warn(`${serviceName}:createBehavior:logError`, { error: logError });
    }

    return { success: true, id: result.data.id };
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
    info(`${serviceName}:updateBehavior`, { behaviorId, userId: user?.uid, updateFields: Object.keys(updateData) });
    
    const existingDoc = await behaviorDbService.getById(behaviorId);
    const existingData = existingDoc.data || {};
    const existingHistory = existingData.history || [];
    
    const auditData = getUpdateAuditData(user);
    const result = await behaviorDbService.update(behaviorId, {
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
      warn(`${serviceName}:updateBehavior:logError`, { error: logError });
    }
    
    // Send update notification if student exists
    if (existingData.studentId) {
      // Notifications are now handled by the backend
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
    info(`${serviceName}:deleteBehavior`, { behaviorId, hasBehaviorData: !!behaviorData });
    
    if (!behaviorId) {
      return { success: false, error: 'Behavior ID is required' };
    }
    
    // Get document data before deletion for logging
    let dataToDelete = behaviorData;
    if (!dataToDelete) {
      const existingDoc = await behaviorDbService.getById(behaviorId);
      if (existingDoc.data) {
        dataToDelete = existingDoc.data;
      }
    }
    
    const result = await behaviorDbService.delete(behaviorId);
    info(`${serviceName}:deleteBehavior:success`, { behaviorId });
    
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
      warn(`${serviceName}:deleteBehavior:logError`, { error: logError });
    }
    
    // Send deletion notification if student exists
    if (dataToDelete?.studentId) {
      // Notifications are now handled by the backend
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
    info(`${serviceName}:getBehaviorsByClassAndDate`, { classId, date });
    const result = await behaviorDbService.getAll({ classId, date });
    return {
      success: result.success,
      data: result.data || [],
      message: result.success ? 'Behaviors retrieved successfully' : result.error
    };
  } catch (error) {
    error(`${serviceName}:getBehaviorsByClassAndDate:error`, { error: error.message, classId, date });
    return {
      success: false,
      error: error.message || 'Failed to retrieve behaviors',
      data: []
    };
  }
};

export const getBehaviors = async (params = {}) => {
  try {
    info(`${serviceName}:getBehaviors`, { params });
    const result = await behaviorDbService.getAll(params);
    return {
      success: result.success,
      data: result.data || [],
      message: result.success ? 'Behaviors retrieved successfully' : result.error
    };
  } catch (error) {
    error(`${serviceName}:getBehaviors:error`, { error: error.message });
    return {
      success: false,
      error: error.message || 'Failed to retrieve behaviors',
      data: []
    };
  }
};

/**
 * Get behaviors by student ID
 * @param {string} studentId - Student user ID
 * @param {Object} params - Optional query parameters
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getBehaviorsByStudent = async (studentId, params = {}) => {
  try {
    info(`${serviceName}:getBehaviorsByStudent`, { studentId, params });
    
    if (!studentId) {
      return {
        success: false,
        error: 'Student ID is required',
        data: []
      };
    }
    
    const result = await behaviorDbService.getByStudent(studentId, params);
    return {
      success: result.success,
      data: result.data || [],
      message: result.success ? 'Student behaviors retrieved successfully' : result.error
    };
  } catch (err) {
    error(`${serviceName}:getBehaviorsByStudent:error`, { error: err.message, studentId, params });
    return {
      success: false,
      error: err.message || 'Failed to retrieve student behaviors',
      data: []
    };
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
 * @param {Array} params.students - Students array for enrichment
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
  students = [],
  filters = {},
  lang = 'en'
}) {
  try {
    setPageState('LOADING');
    
    // Use database layer instead of direct Firebase calls
    const result = await behaviorDbService.getAll();
    const behaviors = result.data || [];
    
    // Enrich behaviors with program, subject, and class names
    const enrichedBehaviors = behaviors.map(behavior => {
      const enriched = { ...behavior };
      
      // Map user information to student display fields
      if (behavior.user) {
        enriched.studentName = behavior.user.displayName || behavior.user.realName || behavior.user.firstName && behavior.user.lastName 
          ? `${behavior.user.firstName} ${behavior.user.lastName}` 
          : behavior.user.email || 'Unknown';
        enriched.studentEmail = behavior.user.email;
        enriched.studentId = behavior.userId || behavior.user.id;
      } else {
        enriched.studentName = behavior.studentName || 'Unknown';
        enriched.studentEmail = behavior.studentEmail || '';
        enriched.studentId = behavior.studentId || behavior.userId;
      }
      
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
                  warn(`${serviceName}:enrichment:programNotFound`, { programId: subject.programId });
                }
              } else {
                warn(`${serviceName}:enrichment:subjectMissingProgramId`, { subjectId: classItem.subjectId });
              }
            } else {
              warn(`${serviceName}:enrichment:classMissingSubjectId`, { classId: behavior.classId });
            }
          } else {
            warn(`${serviceName}:enrichment:missingClassId`, { classId: behavior.classId });
          }
        } else {
          warn(`${serviceName}:enrichment:classNotFound`, { classId: behavior.classId });
        }
      } else {
        warn(`${serviceName}:enrichment:missingClassId`, { behaviorId: behavior.docId });
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
    error(`${serviceName}:loadBehaviors:error`, { error });
    toast?.error(t('failed_to_load_behaviors') + ': ' + error.message);
    setPageState('ERROR');
  } finally {
    setPageState('IDLE');
  }
};
