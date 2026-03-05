import { useState, useCallback, useMemo } from 'react';
import { 
  parseBulkStudentNumbers, 
  bulkValidateStudents, 
  bulkUpsertAttendance,
  computeDateKey 
} from '@services/business/bulkAttendanceService';
import { formatQatarDateOnly, getQatarNow } from '@utils/qatarDate';
import { ATTENDANCE_STATUS, ATTENDANCE_TYPE_CATEGORY } from '@constants/attendanceTypes';
import { getStudentsByClass } from '@services/business/enrollmentService';
import logger from '@utils/logger';
import eventBus, { EVENTS } from '@utils/eventBus';

const useManualBulkScan = ({ programId, subjectId, classId, markedBy, performedBy, performedByName, performedByEmail, attendanceMode = ATTENDANCE_TYPE_CATEGORY.REGULAR, onSuccess, t, showSuccess, showError }) => {
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
  const [progress, setProgress] = useState({ processed: 0, total: 0, percentage: 0, currentBatch: 0, totalBatches: 0 });
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
        classId,
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
      logger.info('[useManualBulkScan] Adding all students for class:', { classId });
      
      // Get students enrolled in this specific class
      const studentsResponse = await getStudentsByClass(classId);
      
      if (!studentsResponse.success || !studentsResponse.data) {
        logger.error('[useManualBulkScan] Failed to fetch class students:', studentsResponse);
        setError('Failed to fetch class students');
        return;
      }

      const classStudents = studentsResponse.data;
      logger.info('[useManualBulkScan] Fetched class students:', { 
        totalFetched: classStudents.length,
        classId,
        allStudents: classStudents.map(s => ({
          id: s.id,
          name: s.name || s.displayName || 'No name',
          role: s.role,
          hasStudentNumber: !!s.studentNumber,
          studentNumber: s.studentNumber
        }))
      });

      // Get ALL students for display, but separate those with/without numbers
      const allStudents = classStudents.filter(student => student.isStudent === true);
      const studentsWithNumbers = allStudents.filter(student => student.studentNumber);
      const studentsWithoutNumbers = allStudents.filter(student => !student.studentNumber);

      logger.info('[useManualBulkScan] Filtering details:', {
        totalFetched: classStudents.length,
        allStudentsCount: allStudents.length,
        studentsWithNumbersCount: studentsWithNumbers.length,
        studentsWithoutNumbersCount: studentsWithoutNumbers.length,
        allStudentDetails: allStudents.map(s => ({
          id: s.id,
          name: s.name || s.displayName || 'No name',
          role: s.role,
          hasStudentNumber: !!s.studentNumber,
          studentNumber: s.studentNumber
        }))
      });

      // Show ALL fetched people with their roles (not just students)
      logger.info('[useManualBulkScan] All class members:', {
        totalMembers: classStudents.length,
        members: classStudents.map(s => ({
          id: s.id,
          name: s.name || s.displayName || 'No name',
          role: s.role,
          hasStudentNumber: !!s.studentNumber,
          studentNumber: s.studentNumber,
          isStudent: s.isStudent // Use actual isStudent flag, not computed from role
        }))
      });

      logger.info('[useManualBulkScan] Student breakdown:', { 
        totalStudents: allStudents.length,
        withNumbers: studentsWithNumbers.length,
        withoutNumbers: studentsWithoutNumbers.length,
        classId: classId
      });

      if (allStudents.length === 0) {
        setError('No students found in this program');
        return;
      }

      // Get student numbers for validation (only those with numbers)
      const studentNumbers = studentsWithNumbers.map(student => student.studentNumber);

      logger.info('[useManualBulkScan] Student numbers for validation:', {
        totalStudents: allStudents.length,
        validatableNumbers: studentNumbers.length,
        nonValidatable: studentsWithoutNumbers.length
      });

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
        logger.info('[useManualBulkScan] About to validate students:', { 
          studentCount: parseResult.parsed.length,
          studentNumbers: parseResult.parsed
        });
        
        try {
          await validateStudents();
          logger.info('[useManualBulkScan] Validation completed successfully');
        } catch (validationError) {
          logger.error('[useManualBulkScan] Validation failed:', validationError);
          setError(`Validation failed: ${validationError.message}`);
          return;
        }
      }

      logger.info('[useManualBulkScan] Added all students:', { 
        totalStudents: allStudents.length,
        withNumbers: studentsWithNumbers.length,
        withoutNumbers: studentsWithoutNumbers.length,
        limitedTo: limitedNumbers.length,
        validNumbers: parseResult.parsed.length,
        invalid: parseResult.invalid.length,
        duplicates: parseResult.duplicates.length
      });

      // Show feedback about how many students were added
      const addedCount = parseResult.parsed.length;
      if (addedCount > 0) {
        showSuccess(t('added_n_students_success', { count: addedCount }) || `Added ${addedCount} students successfully`);
      } else {
        showSuccess(t('no_new_students_to_add') || 'No new students to add');
      }

      // Show warning if limited
      if (allStudents.length > 100) {
        setError(`Limited to first 100 students out of ${allStudents.length} total`);
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

  // Clear all state for fresh operations
  const clearState = useCallback(() => {
    setInputText('');
    setParsedNumbers([]);
    setInvalidRows([]);
    setDuplicates([]);
    setValidatedStudents({ found: [], notFound: [] });
    setError(null);
    setResult(null);
    logger.info('[useManualBulkScan] State cleared for fresh operation');
  }, [setInputText, setParsedNumbers, setInvalidRows, setDuplicates, setValidatedStudents, setError, setResult]);

  // Submit attendance for validated students
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
    setProgress({ processed: 0, total: 0, percentage: 0, currentBatch: 0, totalBatches: 0 });

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
        notes: t('bulk_attendance_notes', { count: validatedStudents.found.length }) || `Bulk attendance - ${validatedStudents.found.length} students`,
        onProgress: (progressData) => {
          setProgress(progressData);
          logger.debug('[useManualBulkScan] Progress update:', progressData);
        }
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

  // Add all students EXCEPT the ones listed
  const addAllExcept = useCallback(async () => {
    if (!programId) {
      setError('Program ID is required to add all students');
      return;
    }

    if (parsedNumbers.length === 0) {
      setError('Please enter student numbers to exclude first');
      return;
    }

    // Clear previous results but keep input for this operation
    setValidatedStudents({ found: [], notFound: [] });
    setError(null);
    setResult(null);

    setAddingAll(true);
    setError(null);

    try {
      logger.info('[useManualBulkScan] Adding all students EXCEPT listed ones:', { 
        classId,
        excludeCount: parsedNumbers.length,
        excludedNumbers: parsedNumbers
      });
      
      // Get students enrolled in this specific class
      const studentsResponse = await getStudentsByClass(classId);
      
      if (!studentsResponse.success || !studentsResponse.data) {
        logger.error('[useManualBulkScan] Failed to fetch class students:', studentsResponse);
        setError('Failed to fetch class students');
        return;
      }

      const classStudents = studentsResponse.data;
      logger.info('[useManualBulkScan] Fetched class students:', { 
        totalFetched: classStudents.length,
        classId 
      });

      // Get ALL students for display, then filter for validation
      const allStudents = classStudents.filter(student => student.isStudent === true);
      const studentsWithNumbers = allStudents.filter(student => student.studentNumber);
      const studentsWithoutNumbers = allStudents.filter(student => !student.studentNumber);
      
      // For validation, exclude listed student numbers
      const validatableStudents = studentsWithNumbers.filter(student => 
        !parsedNumbers.includes(student.studentNumber) // Exclude listed student numbers
      );

      logger.info('[useManualBulkScan] Filtered students (excluding listed):', { 
        totalStudents: allStudents.length,
        withNumbers: studentsWithNumbers.length,
        withoutNumbers: studentsWithoutNumbers.length,
        validatableAfterExclusion: validatableStudents.length,
        excludedCount: parsedNumbers.length,
        classId: classId
      });

      if (validatableStudents.length === 0 && studentsWithoutNumbers.length === 0) {
        setError('No students found after exclusions');
        return;
      }

      const studentNumbers = validatableStudents.map(student => student.studentNumber);

      if (validatableStudents.length === 0 && studentsWithoutNumbers.length > 0) {
        setError('Only students without student numbers remain after exclusions');
        return;
      }

      // Limit to 100 students
      const limitedNumbers = studentNumbers.slice(0, 100);
      if (validatableStudents.length > 100) {
        logger.warn('[useManualBulkScan] Limited students to 100:', { 
          total: validatableStudents.length, 
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
      // Note: We don't call validateStudents() here because we want to validate
      // the remaining students AFTER exclusion, not the excluded students themselves

      // Create validated students object for remaining students (after exclusion)
      const remainingStudents = validatableStudents.map(student => ({
        studentNumber: student.studentNumber,
        studentId: student.id,
        displayName: student.displayName || student.name,
        email: student.email,
        studentData: student
      }));

      setValidatedStudents({
        found: remainingStudents,
        notFound: []
      });

      // Populate input with remaining student numbers for review
      if (remainingStudents.length > 0) {
        const remainingStudentNumbers = remainingStudents.map(s => s.studentNumber);
        const inputText = remainingStudentNumbers.join('\n');
        
        // Set the input text with remaining students
        setInputText(inputText);
        
        // Trigger parse to show the students in the UI
        await parseInput();
      } else {
        logger.warn('[useManualBulkScan] No students remaining after exclusions');
        setError(t('no_students_remaining_after_exclusions') || 'No students remaining after exclusions');
        
        // Clear the input and validated students since there are no students to add
        setInputText('');
        setParsedNumbers([]);
        setValidatedStudents({ found: [], notFound: [] });
        return;
      }

      logger.info('[useManualBulkScan] Added all students except listed:', { 
        totalStudents: allStudents.length,
        withNumbers: studentsWithNumbers.length,
        withoutNumbers: studentsWithoutNumbers.length,
        validatableAfterExclusion: validatableStudents.length,
        excludedCount: parsedNumbers.length,
        limitedTo: limitedNumbers.length,
        validNumbers: parseResult.parsed.length,
        invalid: parseResult.invalid.length,
        duplicates: parseResult.duplicates.length
      });

      // Show feedback about how many students were added
      const addedCount = parseResult.parsed.length;
      const excludedCount = parsedNumbers.length;
      if (addedCount > 0) {
        showSuccess(t('added_n_students_excluded_m_success', { added: addedCount, excluded: excludedCount }) || `Added ${addedCount} students (excluded ${excludedCount})`);
      } else {
        showSuccess(t('no_students_to_add_after_exclusions') || `No students to add (excluded ${excludedCount})`);
      }

      // Show warning if limited
      if (allStudents.length > 100) {
        setError(`Limited to first 100 students out of ${allStudents.length} total (after exclusions)`);
      }

    } catch (error) {
      logger.error('[useManualBulkScan] Error adding all except:', {
        error: error.message,
        stack: error.stack,
        programId
      });
      setError('Failed to add all students. Please try again.');
    } finally {
      setAddingAll(false);
    }
  }, [programId, classId, parsedNumbers, parseBulkStudentNumbers, parseInput, submit, setValidatedStudents, setError, setResult, setAddingAll]);

  
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
    progress,
    result,
    parseInput,
    validateStudents,
    removeChip,
    clearAll,
    clearState,
    addAllStudents,
    addAllExcept,
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
