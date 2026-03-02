import logger from '@utils/logger';
import { formatQatarDateOnly, getQatarNow, getQatarTimestampString } from '@utils/qatarDate';
import { getUsers } from './userService';
import { markAttendance, getTodayAttendanceStatus } from './attendanceService';
import { ATTENDANCE_STATUS } from '@constants/attendanceTypes';

const BULK_OPERATION_LIMIT = 500;
const BATCH_SIZE = 50;

// Convert human-readable dateKey back to ISO format for database operations
const convertDateKeyToISO = (dateKey) => {
  try {
    // dateKey format: "March 2, 2026" (from bulk scan UI)
    // DB format: "February 28, 2026 at 7:07:53 AM UTC+3"
    logger.info('[BulkAttendanceService] Converting dateKey to ISO:', { dateKey });
    
    const date = new Date(dateKey);
    if (isNaN(date.getTime())) {
      // Fallback to today if parsing fails
      const fallback = formatQatarDateOnly(getQatarNow());
      logger.warn('[BulkAttendanceService] Date parsing failed, using fallback:', { dateKey, fallback });
      return fallback;
    }
    
    // Create proper ISO date string (YYYY-MM-DD format) using local date components
    // to avoid timezone offset issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const isoDate = `${year}-${month}-${day}`;
    
    logger.info('[BulkAttendanceService] Date conversion successful:', { 
      dateKey, 
      isoDate,
      originalDate: date.toISOString(),
      formattedDate: date.toLocaleDateString(),
      localDate: `${year}-${month}-${day}`,
      note: 'DB stores dates like "February 28, 2026 at 7:07:53 AM UTC+3"'
    });
    return isoDate;
  } catch (error) {
    logger.error('[BulkAttendanceService] Error converting dateKey to ISO:', { dateKey, error });
    return formatQatarDateOnly(getQatarNow());
  }
};

export const parseBulkStudentNumbers = (inputText) => {
  if (!inputText || typeof inputText !== 'string') {
    return {
      success: false,
      parsed: [],
      invalid: [],
      duplicates: [],
      error: 'Invalid input text'
    };
  }

  const lines = inputText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length > BULK_OPERATION_LIMIT) {
    return {
      success: false,
      parsed: [],
      invalid: [],
      duplicates: [],
      error: `Maximum ${BULK_OPERATION_LIMIT} student numbers allowed per operation`
    };
  }

  const parsed = [];
  const invalid = [];
  const seen = new Set();
  const duplicates = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    if (!/^\d+$/.test(trimmed)) {
      invalid.push({
        line: index + 1,
        value: trimmed,
        reason: 'Non-numeric value'
      });
      return;
    }

    if (seen.has(trimmed)) {
      duplicates.push({
        line: index + 1,
        value: trimmed
      });
      return;
    }

    seen.add(trimmed);
    parsed.push(trimmed);
  });

  return {
    success: true,
    parsed,
    invalid,
    duplicates,
    totalInput: lines.length,
    validCount: parsed.length
  };
};

export const bulkValidateStudents = async ({ programId, studentNumbers }) => {
  try {
    logger.debug('[BulkAttendanceService] Validating students:', {
      programId,
      count: studentNumbers.length
    });

    const usersResult = await getUsers();
    if (!usersResult.success) {
      return {
        success: false,
        error: 'Failed to fetch student data',
        found: [],
        notFound: studentNumbers
      };
    }

    const allUsers = usersResult.data || [];
    const found = [];
    const notFound = [];

    studentNumbers.forEach(studentNumber => {
      const student = allUsers.find(user => {
        const matches = [
          user.studentNumber === studentNumber,
          user.referenceId === studentNumber,
          user.studentId === studentNumber,
          user.id === studentNumber
        ];
        return matches.some(Boolean) && user.role === 'student';
      });

      if (student) {
        found.push({
          studentNumber,
          studentId: student.id || student.docId,
          displayName: student.displayName || student.name,
          email: student.email,
          studentData: student
        });
      } else {
        notFound.push(studentNumber);
      }
    });

    logger.debug('[BulkAttendanceService] Validation complete:', {
      foundCount: found.length,
      notFoundCount: notFound.length
    });

    return {
      success: true,
      found,
      notFound,
      totalValidated: studentNumbers.length
    };
  } catch (error) {
    logger.error('[BulkAttendanceService] Validation error:', error);
    return {
      success: false,
      error: error.message,
      found: [],
      notFound: studentNumbers
    };
  }
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const bulkUpsertAttendance = async ({
  programId,
  subjectId,
  classId,
  dateKey,
  studentIds,
  status,
  markedBy,
  performedBy,
  performedByName,
  performedByEmail,
  source = 'bulk',
  notes = ''
}) => {
  try {
    logger.info('[BulkAttendanceService] Starting bulk upsert:', {
      programId,
      subjectId,
      classId,
      dateKey,
      studentCount: studentIds.length,
      status,
      source,
      timestamp: getQatarTimestampString()
    });

    const results = {
      success: [],
      failed: [],
      updated: [],
      created: [],
      skipped: [],
      alreadyMarked: [],
      detailed: [] // Detailed results for each student
    };

    for (let i = 0; i < studentIds.length; i += BATCH_SIZE) {
      const batch = studentIds.slice(i, i + BATCH_SIZE);
      
      logger.debug(`[BulkAttendanceService] Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(studentIds.length/BATCH_SIZE)}:`, {
        batchSize: batch.length,
        batchRange: `${i}-${i + batch.length - 1}`
      });
      
      const batchPromises = batch.map(async (studentInfo) => {
        const studentId = studentInfo.studentId || studentInfo;
        const studentNumber = studentInfo.studentNumber || studentId;
        const studentName = studentInfo.displayName || studentInfo.name || 'Unknown';
        
        const detailedResult = {
          studentId,
          studentNumber,
          studentName,
          status: 'pending',
          message: '',
          timestamp: getQatarTimestampString()
        };

        try {
          // Convert dateKey to ISO format for database operations
          const isoDate = convertDateKeyToISO(dateKey);
          
          logger.info('[BulkAttendanceService] Processing student attendance:', {
            studentNumber,
            studentId,
            dateKey,
            isoDate,
            status
          });
          
          // Check if student is already marked for this date
          // Use studentNumber for consistent document ID lookup
          const existingAttendance = await getTodayAttendanceStatus(classId, studentNumber);
          
          if (existingAttendance.success && existingAttendance.data) {
            const existingStatus = existingAttendance.data.status;
            
            // If trying to mark with same status, skip
            if (existingStatus === status) {
              detailedResult.status = 'skipped';
              detailedResult.message = `Already marked as ${status} for ${dateKey}`;
              results.skipped.push(studentId);
              results.alreadyMarked.push({
                studentId,
                studentNumber,
                studentName,
                existingStatus,
                attemptedStatus: status
              });
              
              logger.debug(`[BulkAttendanceService] Student ${studentNumber} skipped - already marked as ${status}`, {
                studentId,
                studentNumber,
                existingStatus,
                dateKey
              });
            } else {
              // Update existing record to new status
              logger.info('[BulkAttendanceService] Calling markAttendance for UPDATE:', {
                classId,
                studentNumber,
                date: isoDate,
                status,
                method: source
              });
              
              const updateResult = await markAttendance({
                classId,
                programId,
                subjectId,
                studentId,
                studentNumber,
                date: isoDate, // Use ISO format
                status,
                markedBy,
                performedBy,
                performedByName,
                performedByEmail,
                method: source,
                notes: notes || `Bulk ${status} - ${source} (updated from ${existingStatus})`,
                timestamp: getQatarTimestampString(),
                studentInfo: studentInfo.studentData || null
              });

              if (updateResult.success) {
                detailedResult.status = 'updated';
                detailedResult.message = `Updated from ${existingStatus} to ${status} for ${dateKey}`;
                results.success.push(studentId);
                results.updated.push(studentId);
                
                logger.info(`[BulkAttendanceService] Student ${studentNumber} attendance updated`, {
                  studentId,
                  studentNumber,
                  studentName,
                  from: existingStatus,
                  to: status,
                  dateKey
                });
              } else {
                detailedResult.status = 'failed';
                detailedResult.message = updateResult.error || 'Failed to update attendance';
                results.failed.push({
                  studentId,
                  studentNumber,
                  studentName,
                  error: updateResult.error || 'Failed to update attendance'
                });
                
                logger.error(`[BulkAttendanceService] Failed to update student ${studentNumber}`, {
                  studentId,
                  studentNumber,
                  error: updateResult.error
                });
              }
            }
          } else {
            // Create new attendance record
            logger.info('[BulkAttendanceService] Calling markAttendance for CREATE:', {
              classId,
              studentNumber,
              date: isoDate,
              status,
              method: source
            });
            
            const createResult = await markAttendance({
              classId,
              programId,
              subjectId,
              studentId,
              studentNumber,
              date: isoDate, // Use ISO format
              status,
              markedBy,
              performedBy,
              performedByName,
              performedByEmail,
              method: source,
              notes: notes || `Bulk ${status} - ${source}`,
              timestamp: getQatarTimestampString(),
              studentInfo: studentInfo.studentData || null
            });

            if (createResult.success) {
              detailedResult.status = 'created';
              detailedResult.message = `Marked as ${status} for ${dateKey}`;
              results.success.push(studentId);
              results.created.push(studentId);
              
              logger.info(`[BulkAttendanceService] Student ${studentNumber} attendance created`, {
                studentId,
                studentNumber,
                studentName,
                status,
                dateKey
              });
            } else {
              detailedResult.status = 'failed';
              detailedResult.message = createResult.error || 'Failed to mark attendance';
              results.failed.push({
                studentId,
                studentNumber,
                studentName,
                error: createResult.error || 'Failed to mark attendance'
              });
              
              logger.error(`[BulkAttendanceService] Failed to mark student ${studentNumber}`, {
                studentId,
                studentNumber,
                error: createResult.error
              });
            }
          }
        } catch (error) {
          detailedResult.status = 'failed';
          detailedResult.message = error.message || 'Unexpected error occurred';
          results.failed.push({
            studentId,
            studentNumber,
            studentName,
            error: error.message || 'Unexpected error occurred'
          });
          
          logger.error(`[BulkAttendanceService] Unexpected error for student ${studentNumber}`, {
            studentId,
            studentNumber,
            error: error.message,
            stack: error.stack
          });
        }

        results.detailed.push(detailedResult);
        return detailedResult;
      });

      await Promise.all(batchPromises);
      
      if (i + BATCH_SIZE < studentIds.length) {
        logger.debug(`[BulkAttendanceService] Delaying before next batch...`);
        await delay(100);
      }
    }

    const totalProcessed = results.success.length + results.failed.length + results.skipped.length;
    
    logger.info('[BulkAttendanceService] Bulk upsert completed:', {
      summary: {
        total: studentIds.length,
        processed: totalProcessed,
        succeeded: results.success.length,
        failed: results.failed.length,
        updated: results.updated.length,
        created: results.created.length,
        skipped: results.skipped.length,
        alreadyMarked: results.alreadyMarked.length
      },
      status,
      dateKey,
      classId,
      duration: Date.now() - Date.now() // This would need proper timing
    });

    return {
      success: true,
      results,
      summary: {
        total: studentIds.length,
        processed: totalProcessed,
        succeeded: results.success.length,
        failed: results.failed.length,
        updated: results.updated.length,
        created: results.created.length,
        skipped: results.skipped.length,
        alreadyMarked: results.alreadyMarked.length
      }
    };
  } catch (error) {
    logger.error('[BulkAttendanceService] Bulk upsert error:', {
      error: error.message,
      stack: error.stack,
      studentCount: studentIds.length,
      status,
      dateKey
    });
    
    return {
      success: false,
      error: error.message,
      results: {
        success: [],
        failed: studentIds.map(s => ({
          studentId: s.studentId || s,
          studentNumber: s.studentNumber || s,
          studentName: s.displayName || s.name || 'Unknown',
          error: error.message
        })),
        updated: [],
        created: [],
        skipped: [],
        alreadyMarked: [],
        detailed: studentIds.map(s => ({
          studentId: s.studentId || s,
          studentNumber: s.studentNumber || s,
          studentName: s.displayName || s.name || 'Unknown',
          status: 'failed',
          message: error.message,
          timestamp: getQatarTimestampString()
        }))
      }
    };
  }
};

export const computeDateKey = (date) => {
  if (!date) {
    return formatQatarDateOnly(getQatarNow());
  }
  
  if (typeof date === 'string') {
    return date;
  }
  
  return formatQatarDateOnly(date);
};
