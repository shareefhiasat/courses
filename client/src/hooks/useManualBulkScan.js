import { useState, useCallback, useMemo } from 'react';
import { 
  parseBulkStudentNumbers, 
  bulkValidateStudents, 
  bulkUpsertAttendance,
  computeDateKey 
} from '@services/business/bulkAttendanceService';
import { formatQatarDateOnly, getQatarNow } from '@utils/qatarDate';
import { ATTENDANCE_STATUS } from '@constants/attendanceTypes';
import { getUsers } from '@services/business/userService';
import logger from '@utils/logger';
import eventBus, { EVENTS } from '@utils/eventBus';

const useManualBulkScan = ({ programId, subjectId, classId, markedBy, performedBy, performedByName, performedByEmail, onSuccess }) => {
  const [inputText, setInputText] = useState('');
  const [parsedNumbers, setParsedNumbers] = useState([]);
  const [invalidRows, setInvalidRows] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [validatedStudents, setValidatedStudents] = useState({ found: [], notFound: [] });
  const [selectedStatus, setSelectedStatus] = useState(ATTENDANCE_STATUS.PRESENT);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [addingAll, setAddingAll] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const dateKey = useMemo(() => computeDateKey(selectedDate), [selectedDate]);

  const parseInput = useCallback(() => {
    setError(null);
    setResult(null);
    setValidatedStudents({ found: [], notFound: [] });

    const parseResult = parseBulkStudentNumbers(inputText);
    
    if (!parseResult.success) {
      setError(parseResult.error);
      setParsedNumbers([]);
      setInvalidRows([]);
      setDuplicates([]);
      return;
    }

    setParsedNumbers(parseResult.parsed);
    setInvalidRows(parseResult.invalid);
    setDuplicates(parseResult.duplicates);

    logger.debug('[useManualBulkScan] Parsed input:', {
      totalInput: parseResult.totalInput,
      valid: parseResult.validCount,
      invalid: parseResult.invalid.length,
      duplicates: parseResult.duplicates.length
    });
  }, [inputText]);

  const validateStudents = useCallback(async () => {
    if (parsedNumbers.length === 0) {
      setError('No valid student numbers to validate');
      return;
    }

    if (!programId) {
      setError('Program ID is required for validation');
      return;
    }

    setValidating(true);
    setError(null);

    try {
      const validationResult = await bulkValidateStudents({
        programId,
        studentNumbers: parsedNumbers
      });

      if (!validationResult.success) {
        setError(validationResult.error);
        setValidatedStudents({ found: [], notFound: parsedNumbers });
      } else {
        setValidatedStudents({
          found: validationResult.found,
          notFound: validationResult.notFound
        });

        logger.debug('[useManualBulkScan] Validation complete:', {
          found: validationResult.found.length,
          notFound: validationResult.notFound.length
        });
      }
    } catch (err) {
      logger.error('[useManualBulkScan] Validation error:', err);
      setError(err.message || 'Failed to validate students');
      setValidatedStudents({ found: [], notFound: parsedNumbers });
    } finally {
      setValidating(false);
    }
  }, [parsedNumbers, programId]);

  const removeChip = useCallback((studentNumber) => {
    setParsedNumbers(prev => prev.filter(num => num !== studentNumber));
    setValidatedStudents(prev => ({
      found: prev.found.filter(s => s.studentNumber !== studentNumber),
      notFound: prev.notFound.filter(num => num !== studentNumber)
    }));
  }, []);

  const clearAll = useCallback(() => {
    setInputText('');
    setParsedNumbers([]);
    setInvalidRows([]);
    setDuplicates([]);
    setValidatedStudents({ found: [], notFound: [] });
    setSelectedStatus('present');
    setSelectedDate(new Date());
    setError(null);
    setResult(null);
    logger.debug('[useManualBulkScan] State cleared');
  }, []);

  // Auto-add all students functionality
  const addAllStudents = useCallback(async () => {
    if (!programId) {
      setError('Program ID is required to add all students');
      return;
    }

    setAddingAll(true);
    setError(null);

    try {
      logger.info('[useManualBulkScan] Adding all students for program:', { programId });
      
      // Get all users and filter by program
      const usersResponse = await getUsers();
      
      if (!usersResponse.success || !usersResponse.data) {
        logger.error('[useManualBulkScan] Failed to fetch users:', usersResponse);
        setError('Failed to fetch users');
        return;
      }

      const allUsers = usersResponse.data;
      logger.info('[useManualBulkScan] Fetched all users:', { 
        totalFetched: allUsers.length,
        programId 
      });

      // Filter users by program and role (student)
      // Note: Users don't have programId directly, they have enrolledClasses
      // We need to check if they're enrolled in the current class and are students
      const programStudents = allUsers.filter(user => 
        user.role === 'student' &&
        user.studentNumber &&
        user.enrolledClasses && 
        user.enrolledClasses.includes(classId)
      );

      logger.info('[useManualBulkScan] Filtered students by program:', { 
        totalUsers: allUsers.length,
        programStudents: programStudents.length,
        programId: programId
      });

      if (programStudents.length === 0) {
        setError('No students found in this program');
        return;
      }

      const studentNumbers = programStudents.map(student => student.studentNumber);

      if (studentNumbers.length === 0) {
        setError('No students found in this program');
        return;
      }

      // Limit to 100 students
      const limitedNumbers = studentNumbers.slice(0, 100);
      if (studentNumbers.length > 100) {
        logger.warn('[useManualBulkScan] Limited students to 100:', { 
          total: studentNumbers.length, 
          limited: limitedNumbers.length 
        });
      }

      // Create input text with student numbers
      const allStudentsText = limitedNumbers.join('\n');
      
      // Parse and validate all students
      setInputText(allStudentsText);
      const parseResult = parseBulkStudentNumbers(allStudentsText);
      
      if (!parseResult.success) {
        setError(parseResult.error);
        return;
      }

      setParsedNumbers(parseResult.parsed);
      setInvalidRows(parseResult.invalid);
      setDuplicates(parseResult.duplicates);

      // Validate students
      if (parseResult.parsed.length > 0) {
        await validateStudents();
      }

      logger.info('[useManualBulkScan] Added all students:', { 
        totalStudents: programStudents.length,
        limitedTo: limitedNumbers.length,
        validNumbers: parseResult.parsed.length,
        invalid: parseResult.invalid.length,
        duplicates: parseResult.duplicates.length
      });

      // Show warning if limited
      if (programStudents.length > 100) {
        setError(`Limited to first 100 students out of ${programStudents.length} total`);
      }

    } catch (error) {
      logger.error('[useManualBulkScan] Error adding all students:', {
        error: error.message,
        stack: error.stack,
        programId
      });
      setError('Failed to add all students. Please try again.');
    } finally {
      setAddingAll(false);
    }
  }, [programId, parseBulkStudentNumbers, validateStudents, setInputText, setParsedNumbers, setInvalidRows, setDuplicates, setError, setAddingAll]);

  const submit = useCallback(async () => {
    if (validatedStudents.found.length === 0) {
      setError('No valid students to submit');
      return;
    }

    if (!classId || !programId || !subjectId) {
      setError('Class, Program, and Subject are required');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    logger.info('[useManualBulkScan] Starting bulk submission:', {
      studentCount: validatedStudents.found.length,
      status: selectedStatus,
      dateKey,
      classId,
      programId,
      subjectId
    });

    try {
      const bulkResult = await bulkUpsertAttendance({
        programId,
        subjectId,
        classId,
        dateKey,
        studentIds: validatedStudents.found,
        status: selectedStatus,
        markedBy,
        performedBy,
        performedByName,
        performedByEmail,
        source: 'bulk',
        notes: `Bulk attendance - ${validatedStudents.found.length} students`
      });

      if (bulkResult.success) {
        setResult(bulkResult);
        
        // Log detailed results for each student
        bulkResult.results.detailed.forEach((studentResult, index) => {
          logger.info(`[useManualBulkScan] Student ${index + 1}/${bulkResult.results.detailed.length} result:`, {
            studentNumber: studentResult.studentNumber,
            studentName: studentResult.studentName,
            status: studentResult.status,
            message: studentResult.message,
            timestamp: studentResult.timestamp
          });
        });

        logger.info('[useManualBulkScan] Bulk operation completed successfully:', {
          summary: bulkResult.summary,
          status: selectedStatus,
          dateKey
        });

        if (onSuccess) {
          onSuccess(bulkResult);
        }

        // Trigger UI refresh events to update all components
        eventBus.emit(EVENTS.REFRESH_RECENT_ACTIVITY);
        eventBus.emit(EVENTS.REFRESH_STUDENT_DATA);
        eventBus.emit(EVENTS.REFRESH_ROSTER);
        eventBus.emit(EVENTS.REFRESH_TODAY_ACTIVITY);

        // Don't clearAll() - let user see the results
      } else {
        setError(bulkResult.error || 'Bulk operation failed');
        setResult(bulkResult);
        
        logger.error('[useManualBulkScan] Bulk operation failed:', {
          error: bulkResult.error,
          summary: bulkResult.summary
        });
      }
    } catch (err) {
      logger.error('[useManualBulkScan] Submit error:', {
        error: err.message,
        stack: err.stack,
        studentCount: validatedStudents.found.length,
        status: selectedStatus,
        dateKey
      });
      setError(err.message || 'Failed to submit bulk attendance');
    } finally {
      setLoading(false);
    }
  }, [
    validatedStudents.found,
    classId,
    programId,
    subjectId,
    dateKey,
    selectedStatus,
    markedBy,
    performedBy,
    performedByName,
    performedByEmail,
    onSuccess,
    clearAll
  ]);

  const canSubmit = useMemo(() => {
    return (
      validatedStudents.found.length > 0 &&
      !loading &&
      !validating &&
      classId &&
      programId &&
      subjectId &&
      selectedStatus
    );
  }, [validatedStudents.found.length, loading, validating, classId, programId, subjectId, selectedStatus]);

  return {
    inputText,
    setInputText,
    parsedNumbers,
    invalidRows,
    duplicates,
    validatedStudents,
    selectedStatus,
    setSelectedStatus,
    selectedDate,
    setSelectedDate,
    dateKey,
    loading,
    validating,
    addingAll,
    error,
    result,
    parseInput,
    validateStudents,
    removeChip,
    clearAll,
    addAllStudents,
    submit,
    canSubmit,
    stats: {
      totalInput: parsedNumbers.length,
      validParsed: parsedNumbers.length,
      invalid: invalidRows.length,
      duplicates: duplicates.length,
      found: validatedStudents.found.length,
      notFound: validatedStudents.notFound.length,
      // These will be populated after submission
      succeeded: result?.summary?.succeeded || 0,
      failed: result?.summary?.failed || 0,
      updated: result?.summary?.updated || 0,
      created: result?.summary?.created || 0,
      skipped: result?.summary?.skipped || 0,
      alreadyMarked: result?.summary?.alreadyMarked || 0
    }
  };
};

export default useManualBulkScan;
