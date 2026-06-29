/**
 * Bulk Attendance Service
 *
 * PURPOSE:
 * Handles bulk attendance operations for scanning multiple students at once
 * Provides utilities for parsing, validating, and bulk updating attendance records
 *
 * ARCHITECTURE:
 * Frontend Components → Bulk Attendance Service → Attendance Service → Database
 */

import { info, error, warn, debug } from "../utils/logger.js";
import { markAttendance } from "./attendanceServiceUnified.js";
import { createStandupAttendance } from "./standupAttendanceService";
import { getStudentsByClass, getEnrollmentsByProgram } from "./enrollmentService";
import { getUsersByIds } from "./userService";
import {
  ATTENDANCE_STATUS,
  ATTENDANCE_TYPE_CATEGORY,
} from "@constants/attendanceTypes";

const serviceName = "bulkAttendanceService";

/**
 * Parse bulk student numbers from input text
 * @param {string} inputText - Raw input text containing student numbers
 * @returns {Array} Array of parsed student numbers
 */
export const parseBulkStudentNumbers = (inputText) => {
  try {
    info(`${serviceName}:parseBulkStudentNumbers`, {
      inputLength: inputText?.length,
      inputText: inputText,
    });

    if (!inputText || typeof inputText !== "string") {
      console.log('[parseBulkStudentNumbers] Invalid input:', inputText);
      return [];
    }

    // Split by common delimiters and clean up
    const numbers = inputText
      .split(/[\s,\n\r\t;]+/) // Split by whitespace, comma, newline, semicolon
      .map((num) => num.trim())
      .filter((num) => num.length > 0) // Remove empty strings
      .map((num) => {
        // Remove common prefixes only when followed by digit or space, not part of student number like STU006
        const cleaned = num.replace(/^(st|student|id|#)(?=\d|\s)/i, "").replace(/[^\w-]/g, "");
        console.log('[parseBulkStudentNumbers] Cleaning:', num, '->', cleaned);
        return cleaned;
      })
      .filter((num) => num.length > 0); // Remove empty after cleaning

    console.log('[parseBulkStudentNumbers] After cleaning:', numbers);

    const uniqueNumbers = [...new Set(numbers)]; // Remove duplicates

    debug(`${serviceName}:parseBulkStudentNumbers:success`, {
      originalCount: numbers.length,
      uniqueCount: uniqueNumbers.length,
      numbers: uniqueNumbers.slice(0, 10), // Log first 10 for debugging
    });

    console.log('[parseBulkStudentNumbers] Final result:', uniqueNumbers);
    return uniqueNumbers;
  } catch (err) {
    error(`${serviceName}:parseBulkStudentNumbers:error`, {
      error: err.message,
    });
    console.error('[parseBulkStudentNumbers] Error:', err);
    return [];
  }
};

/**
 * Validate students against class enrollment
 * @param {Array} studentNumbers - Array of student numbers to validate
 * @param {string} classId - Class ID to validate against
 * @returns {Promise<Object>} Validation result with found and notFound students
 */
export const bulkValidateStudents = async ({ studentNumbers, classId, programId, attendanceMode = ATTENDANCE_TYPE_CATEGORY.REGULAR }) => {
  try {
    info(`${serviceName}:bulkValidateStudents START`, {
      studentCount: studentNumbers.length,
      studentNumbers,
      classId,
      programId,
      attendanceMode,
    });

    if (!studentNumbers || studentNumbers.length === 0) {
      return { success: false, error: 'No student numbers provided', found: [], notFound: [] };
    }

    // In standup mode, require programId and use getEnrollmentsByProgram
    // In regular mode, require classId and use getStudentsByClass
    let studentsResponse;
    if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
      info(`${serviceName}:bulkValidateStudents - STANDUP MODE - Calling getEnrollmentsByProgram with programId:`, programId);
      if (!programId) {
        error(`${serviceName}:bulkValidateStudents - Missing programId for standup mode`);
        return { success: false, error: 'Program ID is required in standup mode', found: [], notFound: [] };
      }
      studentsResponse = await getEnrollmentsByProgram(programId);
      info(`${serviceName}:bulkValidateStudents - getEnrollmentsByProgram returned:`, {
        success: studentsResponse.success,
        studentCount: studentsResponse.data?.length || 0,
        data: studentsResponse.data
      });

      // Fetch full user data with student numbers for standup mode
      if (studentsResponse.success && studentsResponse.data.length > 0) {
        const userIds = [...new Set(studentsResponse.data.map(e => e.userId))];
        info(`${serviceName}:bulkValidateStudents - Fetching user data for userIds:`, userIds);
        const usersResponse = await getUsersByIds(userIds);
        info(`${serviceName}:bulkValidateStudents - getUsersByIds response:`, {
          success: usersResponse?.success,
          dataLength: usersResponse?.data?.length
        });

        // Merge user data with enrollments
        if (usersResponse.success && usersResponse.data) {
          const userMap = new Map(usersResponse.data.map(u => [u.id, u]));
          studentsResponse.data = studentsResponse.data.map(enrollment => {
            const user = userMap.get(enrollment.userId);
            return {
            ...enrollment,
            studentNumber: user?.studentNumber,
            displayName: user?.displayName || enrollment.user?.displayName || enrollment.user?.name,
            name: user?.name || enrollment.user?.name,
            displayNameAr: user?.displayNameAr || enrollment.user?.displayNameAr,
            firstNameAr: user?.firstNameAr || enrollment.user?.firstNameAr,
            lastNameAr: user?.lastNameAr || enrollment.user?.lastNameAr,
            };
          });
          info(`${serviceName}:bulkValidateStudents - Merged user data with enrollments`);
        }
      }
    } else {
      info(`${serviceName}:bulkValidateStudents - REGULAR MODE - Calling getStudentsByClass with classId:`, classId);
      if (!classId) {
        error(`${serviceName}:bulkValidateStudents - Missing classId for regular mode`);
        return { success: false, error: 'Class ID is required in regular mode', found: [], notFound: [] };
      }
      studentsResponse = await getStudentsByClass(classId);
      info(`${serviceName}:bulkValidateStudents - getStudentsByClass returned:`, {
        success: studentsResponse.success,
        studentCount: studentsResponse.data?.length || 0,
        data: studentsResponse.data
      });

      // Fetch full user data with student numbers for regular mode (same as standup mode)
      if (studentsResponse.success && studentsResponse.data.length > 0) {
        const userIds = [...new Set(studentsResponse.data.map(e => e.userId))];
        info(`${serviceName}:bulkValidateStudents - Fetching user data for userIds:`, userIds);
        const usersResponse = await getUsersByIds(userIds);
        info(`${serviceName}:bulkValidateStudents - getUsersByIds response:`, {
          success: usersResponse?.success,
          dataLength: usersResponse?.data?.length
        });

        // Merge user data with enrollments
        if (usersResponse.success && usersResponse.data) {
          const userMap = new Map(usersResponse.data.map(u => [u.id, u]));
          studentsResponse.data = studentsResponse.data.map(enrollment => {
            const user = userMap.get(enrollment.userId);
            return {
            ...enrollment,
            studentNumber: user?.studentNumber,
            displayName: user?.displayName || enrollment.user?.displayName || enrollment.user?.name,
            name: user?.name || enrollment.user?.name,
            displayNameAr: user?.displayNameAr || enrollment.user?.displayNameAr,
            firstNameAr: user?.firstNameAr || enrollment.user?.firstNameAr,
            lastNameAr: user?.lastNameAr || enrollment.user?.lastNameAr,
            };
          });
          info(`${serviceName}:bulkValidateStudents - Merged user data with enrollments`);
        }
      }
    }

    if (!studentsResponse.success) {
      throw new Error("Failed to fetch class students");
    }

    const classStudents = studentsResponse.data || [];

    // Create lookup maps for performance
    const studentMap = new Map();
    classStudents.forEach((student) => {
      // Handle both old student structure and new enrollment structure
      const studentId = student.userId || student.id || student.docId;
      const studentNumber =
        student.user?.studentNumber || student.studentNumber || student.studentId || student.id;
      const displayName =
        student.user?.displayName || student.user?.realName || student.displayName || student.realName || student.name || "Unknown";

      studentMap.set(studentId, {
        studentId,
        studentNumber,
        displayName,
        ...student,
      });
      studentMap.set(studentNumber, {
        studentId,
        studentNumber,
        displayName,
        ...student,
      });
      studentMap.set(String(studentId).toLowerCase(), {
        studentId,
        studentNumber,
        displayName,
        ...student,
      });
      studentMap.set(String(studentNumber).toLowerCase(), {
        studentId,
        studentNumber,
        displayName,
        ...student,
      });
    });

    // Validate each student number
    const found = [];
    const notFound = [];

    studentNumbers.forEach((number) => {
      const searchKey = number.toLowerCase();
      const student =
        studentMap.get(searchKey) ||
        studentMap.get(number) ||
        classStudents.find(
          (s) =>
            s.user?.studentNumber === number ||
            s.studentNumber === number ||
            s.studentId === number ||
            s.userId === number ||
            s.id === number ||
            s.docId === number,
        );

      if (student) {
        found.push({
          studentId: student.userId || student.id || student.docId,
          studentNumber:
            student.user?.studentNumber || student.studentNumber || student.studentId || student.id,
          displayName: student.user?.displayName || student.user?.realName || student.displayName || student.realName || student.name,
          displayNameAr: student.user?.displayNameAr || student.displayNameAr,
          firstNameAr: student.user?.firstNameAr || student.firstNameAr,
          lastNameAr: student.user?.lastNameAr || student.lastNameAr,
          email: student.user?.email || student.email,
          ...student,
        });
      } else {
        notFound.push(number);
      }
    });

    debug(`${serviceName}:bulkValidateStudents:success`, {
      total: studentNumbers.length,
      found: found.length,
      notFound: notFound.length,
      notFoundSample: notFound.slice(0, 5),
    });

    return { success: true, found, notFound };
  } catch (err) {
    error(`${serviceName}:bulkValidateStudents:error`, {
      error: err.message,
      studentCount: studentNumbers.length,
      classId,
      programId,
      attendanceMode,
    });

    return { success: false, error: err.message, found: [], notFound: studentNumbers };
  }
};

/**
 * Bulk upsert attendance records
 * @param {Array} students - Array of validated students
 * @param {Object} params - Attendance parameters
 * @returns {Promise<Object>} Bulk update result
 */
export const bulkUpsertAttendance = async (students, params = {}) => {
  try {
    const {
      classId,
      date,
      status = ATTENDANCE_STATUS.PRESENT,
      markedBy,
      performedBy,
      performedByName,
      performedByEmail,
      attendanceMode = ATTENDANCE_TYPE_CATEGORY.REGULAR,
      sendNotifications = false,
    } = params;

    info(`${serviceName}:bulkUpsertAttendance`, {
      studentCount: students.length,
      classId,
      status,
      attendanceMode,
    });

    if (!students || students.length === 0) {
      return { success: false, error: "No students to process", results: [] };
    }

    const results = [];
    const errors = [];

    // Process students in batches for better performance
    const BATCH_SIZE = 10;

    for (let i = 0; i < students.length; i += BATCH_SIZE) {
      const batch = students.slice(i, i + BATCH_SIZE);

      const batchPromises = batch.map(async (student) => {
        try {
          let result;
          if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
            // Use standup attendance service
            result = await createStandupAttendance({
              userId: student.studentId || student.id,
              status: status.toUpperCase(),
              date,
              notes: null,
              performedBy,
              performedByName,
              performedByEmail,
            });
          } else {
            // Use dual attendance service for regular attendance
            const attendanceParams = {
              userId: student.studentId || student.id,
              classId,
              date,
              status,
              notes: null,
              user: performedBy ? { id: performedBy, name: performedByName, email: performedByEmail } : null,
            };
            result = await markAttendance(attendanceParams, attendanceParams.user, attendanceMode);
          }

          if (result.success) {
            return {
              success: true,
              studentId: student.studentId,
              studentNumber: student.studentNumber,
              displayName: student.displayName,
              attendanceId: result.data?.id,
              message: "Attendance marked successfully",
            };
          } else {
            return {
              success: false,
              studentId: student.studentId,
              studentNumber: student.studentNumber,
              displayName: student.displayName,
              error: result.error || "Failed to mark attendance",
            };
          }
        } catch (err) {
          return {
            success: false,
            studentId: student.studentId,
            studentNumber: student.studentNumber,
            displayName: student.displayName,
            error: err.message || "Unexpected error",
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    // Separate successful and failed results
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    debug(`${serviceName}:bulkUpsertAttendance:success`, {
      total: students.length,
      successful: successful.length,
      failed: failed.length,
      failedSample: failed
        .slice(0, 3)
        .map((f) => ({ studentNumber: f.studentNumber, error: f.error })),
    });

    return {
      success: successful.length > 0,
      results,
      summary: {
        total: students.length,
        successful: successful.length,
        failed: failed.length,
      },
      error:
        failed.length > 0
          ? `${failed.length} students failed to process`
          : null,
    };
  } catch (err) {
    error(`${serviceName}:bulkUpsertAttendance:error`, {
      error: err.message,
      studentCount: students?.length,
    });

    return {
      success: false,
      error: err.message || "Failed to process bulk attendance",
      results: [],
    };
  }
};

/**
 * Compute date key for attendance operations
 * @param {string|Date} date - Date to compute key for
 * @returns {string} Date key in YYYY-MM-DD format
 */
export const computeDateKey = (date) => {
  try {
    info(`${serviceName}:computeDateKey`, { date });

    if (!date) {
      return new Date().toISOString().split("T")[0];
    }

    let dateObj;
    if (typeof date === "string") {
      dateObj = new Date(date);
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      throw new Error("Invalid date format");
    }

    if (isNaN(dateObj.getTime())) {
      throw new Error("Invalid date value");
    }

    const dateKey = dateObj.toISOString().split("T")[0];

    debug(`${serviceName}:computeDateKey:success`, {
      input: date,
      output: dateKey,
    });

    return dateKey;
  } catch (err) {
    error(`${serviceName}:computeDateKey:error`, {
      error: err.message,
      date,
    });

    // Fallback to today
    return new Date().toISOString().split("T")[0];
  }
};

/**
 * Bulk validate and process attendance in one operation
 * @param {string} inputText - Raw input text
 * @param {Object} params - Processing parameters
 * @returns {Promise<Object>} Complete processing result
 */
export const bulkProcessAttendance = async (inputText, params = {}) => {
  try {
    info(`${serviceName}:bulkProcessAttendance`, {
      inputLength: inputText?.length,
      classId: params.classId,
    });

    // Step 1: Parse student numbers
    const studentNumbers = parseBulkStudentNumbers(inputText);

    if (studentNumbers.length === 0) {
      return {
        success: false,
        error: "No valid student numbers found",
        parsedNumbers: [],
        validation: { found: [], notFound: [] },
        results: [],
      };
    }

    // Step 2: Validate students
    const validation = await bulkValidateStudents(
      studentNumbers,
      params.classId,
    );

    if (validation.found.length === 0) {
      return {
        success: false,
        error: "No valid students found in class",
        parsedNumbers: studentNumbers,
        validation,
        results: [],
      };
    }

    // Step 3: Process attendance
    const attendanceResult = await bulkUpsertAttendance(
      validation.found,
      params,
    );

    return {
      success: attendanceResult.success,
      parsedNumbers: studentNumbers,
      validation,
      results: attendanceResult.results,
      summary: attendanceResult.summary,
      error: attendanceResult.error,
    };
  } catch (err) {
    error(`${serviceName}:bulkProcessAttendance:error`, {
      error: err.message,
    });

    return {
      success: false,
      error: err.message || "Failed to process bulk attendance",
      parsedNumbers: [],
      validation: { found: [], notFound: [] },
      results: [],
    };
  }
};

// Export all functions for easy importing
export default {
  parseBulkStudentNumbers,
  bulkValidateStudents,
  bulkUpsertAttendance,
  computeDateKey,
  bulkProcessAttendance,
};
