import React, { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ATTENDANCE_TYPE_CATEGORY } from '@constants/attendanceTypes';
import { info, error as logError, warn, debug } from '@services/utils/logger.js';
import eventBus, { EVENTS } from '@utils/eventBus';

const BulkScanContext = createContext(null);

export const useBulkScan = () => {
  const context = useContext(BulkScanContext);
  if (!context) {
    throw new Error('useBulkScan must be used within a BulkScanProvider');
  }
  return context;
};

export const BulkScanProvider = ({ 
  children,
  programId,
  subjectId,
  classId,
  markedBy,
  performedBy,
  performedByName,
  performedByEmail,
  attendanceMode,
  onSuccess
}) => {
  const [inputText, setInputText] = useState("");
  const [parsedNumbers, setParsedNumbers] = useState([]);
  const [invalidRows, setInvalidRows] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [validatedStudents, setValidatedStudents] = useState({
    found: [],
    notFound: [],
  });
  const [selectedStudents, setSelectedStudents] = useState([]); // Students selected for submission (right list)
  const [excludedStudents, setExcludedStudents] = useState([]); // Students excluded from submission (left list)
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [addingAll, setAddingAll] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);

  // Refs for props to prevent re-initialization
  const programIdRef = useRef(programId);
  const classIdRef = useRef(classId);
  const subjectIdRef = useRef(subjectId);
  const attendanceModeRef = useRef(attendanceMode || ATTENDANCE_TYPE_CATEGORY.REGULAR);
  const markedByRef = useRef(markedBy);
  const performedByRef = useRef(performedBy);
  const performedByNameRef = useRef(performedByName);
  const performedByEmailRef = useRef(performedByEmail);
  const onSuccessRef = useRef(onSuccess);
  const tRef = useRef((key) => key);
  const showSuccessRef = useRef(() => {});
  const showErrorRef = useRef(() => {});

  // Update refs when props change
  const updateConfig = useCallback((config) => {
    programIdRef.current = config.programId;
    classIdRef.current = config.classId;
    subjectIdRef.current = config.subjectId;
    attendanceModeRef.current = config.attendanceMode;
    markedByRef.current = config.markedBy;
    performedByRef.current = config.performedBy;
    performedByNameRef.current = config.performedByName;
    performedByEmailRef.current = config.performedByEmail;
    onSuccessRef.current = config.onSuccess;
  }, []);

  // Update refs when provider props change
  useEffect(() => {
    updateConfig({
      programId,
      subjectId,
      classId,
      markedBy,
      performedBy,
      performedByName,
      performedByEmail,
      attendanceMode,
      onSuccess
    });
  }, [programId, subjectId, classId, markedBy, performedBy, performedByName, performedByEmail, attendanceMode, onSuccess, updateConfig]);

  const clearState = useCallback(() => {
    setInputText("");
    setParsedNumbers([]);
    setInvalidRows([]);
    setDuplicates([]);
    setValidatedStudents({ found: [], notFound: [] });
    setSelectedStudents([]);
    setExcludedStudents([]);
    setSelectedStatus(null);
    setSelectedDate(new Date());
    setError(null);
    setResult(null);
    debug("[BulkScanContext] State cleared");
  }, []);

  const clearAll = useCallback(() => {
    clearState();
    info("[BulkScanContext] State cleared for fresh operation");
  }, [clearState]);

  const removeChip = useCallback((studentNumber) => {
    setParsedNumbers((prev) => prev.filter((num) => num !== studentNumber));
    setValidatedStudents((prev) => ({
      found: prev.found.filter((s) => s.studentNumber !== studentNumber),
      notFound: prev.notFound.filter((num) => num !== studentNumber),
    }));
  }, []);

  // Move student from selected to excluded (move left)
  const moveToExcluded = useCallback((studentId) => {
    const student = selectedStudents.find(s => s.studentId === studentId || s.id === studentId);
    if (student) {
      setSelectedStudents(prev => prev.filter(s => s.studentId !== studentId && s.id !== studentId));
      setExcludedStudents(prev => [...prev, student]);
    }
  }, [selectedStudents]);

  // Move student from excluded to selected (move right)
  const moveToSelected = useCallback((studentId) => {
    const student = excludedStudents.find(s => s.studentId === studentId || s.id === studentId);
    if (student) {
      setExcludedStudents(prev => prev.filter(s => s.studentId !== studentId && s.id !== studentId));
      setSelectedStudents(prev => [...prev, student]);
    }
  }, [excludedStudents]);

  // Move all students from selected to excluded
  const moveAllToExcluded = useCallback(() => {
    setExcludedStudents(prev => [...prev, ...selectedStudents]);
    setSelectedStudents([]);
  }, [selectedStudents]);

  // Move all students from excluded to selected
  const moveAllToSelected = useCallback(() => {
    setSelectedStudents(prev => [...prev, ...excludedStudents]);
    setExcludedStudents([]);
  }, [excludedStudents]);

  const parseInput = useCallback(async () => {
    const currentT = tRef.current;
    info("[BulkScanContext] parseInput called:", {
      inputText,
      inputTextLength: inputText.length,
      programId: programIdRef.current,
      classId: classIdRef.current,
      attendanceMode: attendanceModeRef.current
    });

    if (!inputText.trim()) {
      setError(currentT("no_input_to_parse") || "No input to parse");
      return;
    }

    setValidating(true);
    setError(null);

    try {
      const { parseBulkStudentNumbers } = await import("@services/business/bulkAttendanceService");
      const parsedNumbers = parseBulkStudentNumbers(inputText);

      info("[BulkScanContext] parseBulkStudentNumbers returned:", {
        result: parsedNumbers,
        isArray: Array.isArray(parsedNumbers),
        length: Array.isArray(parsedNumbers) ? parsedNumbers.length : 0
      });

      // parseBulkStudentNumbers returns an array directly, not an object with success property
      if (Array.isArray(parsedNumbers) && parsedNumbers.length > 0) {
        setParsedNumbers(parsedNumbers);
        setInvalidRows([]);
        setDuplicates([]);
        setValidatedStudents({ found: [], notFound: [] });
        info("[BulkScanContext] Parsed student numbers successfully:", parsedNumbers);
      } else {
        setError(currentT("no_valid_student_numbers_found") || "No valid student numbers found");
        setParsedNumbers([]);
        setInvalidRows([]);
        setDuplicates([]);
        setValidatedStudents({ found: [], notFound: [] });
        warn("[BulkScanContext] No valid student numbers found in input");
      }
    } catch (err) {
      logError("[BulkScanContext] Parse error:", err);
      setError(`Parsing failed: ${err.message}`);
      setParsedNumbers([]);
      setInvalidRows([]);
      setDuplicates([]);
      setValidatedStudents({ found: [], notFound: [] });
    } finally {
      setValidating(false);
    }
  }, [inputText]);

  const validateStudents = useCallback(async ({ programId: overrideProgramId, classId: overrideClassId, attendanceMode: overrideAttendanceMode } = {}) => {
    debug("[BulkScanContext] validateStudents called:", {
      parsedNumbersLength: parsedNumbers.length,
      parsedNumbers,
      programId: overrideProgramId || programIdRef.current,
      classId: overrideClassId || classIdRef.current,
      attendanceMode: overrideAttendanceMode || attendanceModeRef.current
    });

    if (parsedNumbers.length === 0) {
      setError(
        tRef.current("no_valid_student_numbers_to_validate") ||
          "No valid student numbers to validate",
      );
      return;
    }

    setValidating(true);
    setError(null);

    try {
      const { bulkValidateStudents } = await import("@services/business/bulkAttendanceService");
      const validationResult = await bulkValidateStudents({
        programId: overrideProgramId || programIdRef.current,
        classId: overrideClassId || classIdRef.current,
        attendanceMode: overrideAttendanceMode || attendanceModeRef.current,
        studentNumbers: parsedNumbers,
      });

      debug("[BulkScanContext] Validation result:", {
        success: validationResult.success,
        found: validationResult.found?.length || 0,
        notFound: validationResult.notFound?.length || 0,
        error: validationResult.error
      });

      if (!validationResult.success) {
        setError(validationResult.error);
        setValidatedStudents({ found: [], notFound: parsedNumbers });
        setSelectedStudents([]);
      } else {
        setValidatedStudents({
          found: validationResult.found,
          notFound: validationResult.notFound,
        });
        // Populate selectedStudents with validated found students
        setSelectedStudents(validationResult.found);
        setExcludedStudents([]);

        debug("[BulkScanContext] Validation complete - selectedStudents set to:", {
          selectedStudentsLength: validationResult.found.length,
          found: validationResult.found.length,
          notFound: validationResult.notFound.length,
        });
      }
    } catch (err) {
      logError("[BulkScanContext] Validation error:", err);
      setError(`Validation failed: ${err.message}`);
      setValidatedStudents({ found: [], notFound: parsedNumbers });
      setSelectedStudents([]);
      setExcludedStudents([]);
    } finally {
      setValidating(false);
      debug("[BulkScanContext] Validation finished, validating set to false");
    }
  }, [parsedNumbers]);

  const submit = useCallback(async () => {
    if (validatedStudents.found.length === 0) {
      setError(t("no_valid_students_to_submit") || "No valid students to submit");
      return { success: false, error: t("no_valid_students_to_submit") };
    }

    setLoading(true);
    setError(null);

    try {
      const currentProgramId = programIdRef.current;
      const currentClassId = classIdRef.current;
      const currentAttendanceMode = attendanceModeRef.current;
      const currentShowSuccess = showSuccessRef.current;
      const currentShowError = showErrorRef.current;
      const currentT = tRef.current;
      const currentMarkedBy = markedByRef.current;
      const currentPerformedBy = performedByRef.current;
      const currentPerformedByName = performedByNameRef.current;
      const currentPerformedByEmail = performedByEmailRef.current;


      // Submit attendance for each selected student
      let successfulCount = 0;
      let failedCount = 0;
      const errors = [];

      for (const student of selectedStudents) {
        try {
          // Ensure date is in YYYY-MM-DD string format
          const dateStr = selectedDate ? new Date(selectedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

          // Import getNoteTypeFromStatus for proper note type constants
          const { getNoteTypeFromStatus } = await import("@constants/noteTypes");

          const attendanceData = {
            userId: student.userId || student.id,
            status: selectedStatus || 'present',
            date: dateStr,
            notes: getNoteTypeFromStatus(selectedStatus || 'present', 'bulk'),
            markedBy: currentMarkedBy,
            performedBy: currentPerformedBy,
            performedByName: currentPerformedByName,
            performedByEmail: currentPerformedByEmail,
            programId: currentProgramId,
            classId: currentClassId,
            subjectId: subjectIdRef.current
          };

          if (currentAttendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
            const { createStandupAttendance } = await import("@services/business/standupAttendanceService");
            // Standup attendance API only accepts: userId, status, date, notes
            const dateStr = selectedDate ? new Date(selectedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

            info("[BulkScanContext] STANDUP MODE - Status mapping:", {
              originalStatus: attendanceData.status,
              attendanceMode: currentAttendanceMode
            });

            // Map regular status to standup status
            const statusMapping = {
              'present': 'STANDUP_PRESENT',
              'late': 'STANDUP_LATE',
              'absent': 'STANDUP_ABSENT',
              'excused': 'STANDUP_CLINIC',
              'standup_present': 'STANDUP_PRESENT',
              'standup_late': 'STANDUP_LATE',
              'standup_absent': 'STANDUP_ABSENT',
              'standup_clinic': 'STANDUP_CLINIC',
              'LATE': 'STANDUP_LATE',
              'ABSENT_NO_EXCUSE': 'STANDUP_ABSENT',
              'PRESENT': 'STANDUP_PRESENT',
              'EXCUSED_LEAVE': 'STANDUP_CLINIC'
            };
            const mappedStatus = statusMapping[attendanceData.status] || attendanceData.status;

            info("[BulkScanContext] STANDUP MODE - Mapped status:", {
              mappedStatus,
              originalStatus: attendanceData.status,
              wasMapped: statusMapping[attendanceData.status] !== undefined
            });

            const standupData = {
              userId: attendanceData.userId,
              status: mappedStatus,
              date: dateStr,
              notes: mappedStatus,
              programId: currentProgramId
            };
            const result = await createStandupAttendance(standupData);
            if (result.success) {
              successfulCount++;
            } else {
              failedCount++;
              errors.push(`${student.displayName || student.studentNumber}: ${result.error}`);
            }
          } else {
            const { markAttendance } = await import("@services/business/attendanceServiceUnified");
            const result = await markAttendance(attendanceData, currentAttendanceMode);
            if (result.success) {
              successfulCount++;
            } else {
              failedCount++;
              errors.push(`${student.displayName || student.studentNumber}: ${result.error}`);
            }
          }
        } catch (err) {
          failedCount++;
          const errorMessage = err.response?.data?.error || err.message || 'Unknown error';
          errors.push(`${student.displayName || student.studentNumber}: ${errorMessage}`);
          logError("[BulkScanContext] Error submitting attendance for student:", {
            student,
            error: errorMessage,
            fullError: err,
            status: selectedStatus,
            attendanceMode: currentAttendanceMode
          });
        }
      }


      // Show success or error message
      if (failedCount === 0) {
        currentShowSuccess(
          currentT("attendance_submitted_successfully") || `Successfully submitted attendance for ${successfulCount} students`,
        );
      } else if (successfulCount > 0) {
        currentShowError(
          currentT("attendance_partially_submitted") || `Submitted ${successfulCount} students, ${failedCount} failed`,
        );
      } else {
        currentShowError(
          currentT("attendance_submission_failed") || `Failed to submit attendance for all ${failedCount} students`,
        );
      }

      // Emit event so activity list and roster refresh via event bus
      if (failedCount === 0 && successfulCount > 0) {
        eventBus.emit(EVENTS.ATTENDANCE_MARKED, { count: successfulCount });
      }

      // Call onSuccess callback
      const currentOnSuccess = onSuccessRef.current;
      if (currentOnSuccess) {
        currentOnSuccess({
          success: failedCount === 0,
          summary: {
            succeeded: successfulCount,
            failed: failedCount,
            total: selectedStudents.length,
            errors
          },
          selectedStatus
        });
      }

      setResult({
        success: failedCount === 0,
        summary: {
          total: validatedStudents.found.length,
          successful: successfulCount,
          failed: failedCount,
          errors
        },
      });

      // Clear state after successful submission
      if (failedCount === 0) {
        clearState();
      }
      
      return {
        success: failedCount === 0,
        summary: {
          total: validatedStudents.found.length,
          successful: successfulCount,
          failed: failedCount,
          errors
        }
      };
    } catch (err) {
      logError("[BulkScanContext] Submit error:", err);
      setError(err.message || "Failed to submit attendance");
      return {
        success: false,
        error: err.message || "Failed to submit attendance"
      };
    } finally {
      setLoading(false);
    }
  }, [validatedStudents.found, selectedStudents, selectedStatus, selectedDate, clearState]);

  const canSubmit = useMemo(() => {
    const result = (
      selectedStudents.length > 0 &&
      selectedStatus !== null &&
      !loading &&
      !validating
    );
    debug("[BulkScanContext] canSubmit check:", {
      selectedStudentsLength: selectedStudents.length,
      selectedStatus,
      loading,
      validating,
      canSubmit: result
    });
    return result;
  }, [selectedStudents.length, selectedStatus, loading, validating]);

  const stats = useMemo(() => {
    return {
      totalInput: parsedNumbers.length + invalidRows.length + duplicates.length,
      validParsed: parsedNumbers.length,
      invalid: invalidRows.length,
      duplicates: duplicates.length,
      found: validatedStudents.found.length,
      notFound: validatedStudents.notFound.length,
    };
  }, [parsedNumbers, invalidRows, duplicates, validatedStudents]);

  const addAllStudents = useCallback(async ({ programId: overrideProgramId, classId: overrideClassId, attendanceMode: overrideAttendanceMode } = {}) => {
    const currentProgramId = overrideProgramId || programIdRef.current;
    const currentClassId = overrideClassId || classIdRef.current;
    const currentAttendanceMode = overrideAttendanceMode || attendanceModeRef.current;
    const currentT = tRef.current;
    const currentShowSuccess = showSuccessRef.current;
    const currentShowError = showErrorRef.current;

    if (!currentProgramId) {
      setError(
        currentT("program_id_required_to_add_all_students") ||
          "Program ID is required to add all students",
      );
      return;
    }

    // Clear previous state before adding all students
    clearState();
    setAddingAll(true);
    setError(null);

    try {
      info("[BulkScanContext] Adding all students:", { classId: currentClassId, attendanceMode: currentAttendanceMode });

      // In standup mode, get students by program instead of class
      let studentsResponse;
      if (currentAttendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
        // Get enrollments by program for standup mode
        const { getEnrollmentsByProgram } = await import("@services/business/enrollmentService");
        studentsResponse = await getEnrollmentsByProgram(currentProgramId);

        // Fetch full user data with student numbers
        if (studentsResponse.success && studentsResponse.data.length > 0) {
          const userIds = studentsResponse.data.map(e => e.userId);
          // Deduplicate user IDs
          const uniqueUserIds = [...new Set(userIds)];
          const { getUsersByIds } = await import("@services/business/userService");
          const usersResponse = await getUsersByIds(uniqueUserIds);

          // Merge user data with enrollments
          if (usersResponse.success && usersResponse.data) {
            const userMap = new Map(usersResponse.data.map(u => [Number(u.id), u]));
            studentsResponse.data = studentsResponse.data.map(enrollment => ({
              ...enrollment,
              user: {
                ...enrollment.user,
                studentNumber: enrollment.user?.studentNumber || userMap.get(Number(enrollment.userId))?.studentNumber
              }
            }));
          }
        }
      } else {
        // In regular mode, validate classId before calling getStudentsByClass
        if (!currentClassId || currentClassId === 'all') {
          setError(
            currentT("please_select_class_first") || "Please select a class first"
          );
          return;
        }
        // Get students enrolled in this specific class for regular mode
        const { getStudentsByClass } = await import("@services/business/enrollmentService");
        studentsResponse = await getStudentsByClass(currentClassId);

        // Fetch full user data with student numbers (same as standup mode)
        if (studentsResponse.success && studentsResponse.data.length > 0) {
          const userIds = studentsResponse.data.map(e => e.userId);
          const uniqueUserIds = [...new Set(userIds)];
          const { getUsersByIds } = await import("@services/business/userService");
          const usersResponse = await getUsersByIds(uniqueUserIds);

          // Merge user data with enrollments
          if (usersResponse.success && usersResponse.data) {
            const userMap = new Map(usersResponse.data.map(u => [Number(u.id), u]));
            studentsResponse.data = studentsResponse.data.map(enrollment => ({
              ...enrollment,
              user: {
                ...enrollment.user,
                studentNumber: enrollment.user?.studentNumber || userMap.get(Number(enrollment.userId))?.studentNumber
              }
            }));
          }
        }
      }

      if (!studentsResponse.success || !studentsResponse.data) {
        logError(
          "[BulkScanContext] Failed to fetch students:",
          studentsResponse,
        );
        setError(
          currentAttendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP
            ? (currentT("failed_to_fetch_program_students") || "Failed to fetch program students")
            : (currentT("failed_to_fetch_class_students") || "Failed to fetch class students"),
        );
        return;
      }

      const allStudents = studentsResponse.data;
      info("[BulkScanContext] Fetched students:", {
        totalFetched: allStudents.length,
        classId: currentClassId,
        attendanceMode: currentAttendanceMode,
      });

      // Log sample enrollment structure to debug
      if (allStudents.length > 0) {
        info("[BulkScanContext] Sample enrollment structure:", {
          hasUser: !!allStudents[0].user,
          userStructure: allStudents[0].user ? Object.keys(allStudents[0].user) : [],
          hasStudentNumber: !!allStudents[0].user?.studentNumber,
          studentNumber: allStudents[0].user?.studentNumber,
        });
      }

      // Enrollment data has user objects with studentNumber, not isStudent field
      // Filter to only include enrollments with student numbers
      const studentsWithNumbers = allStudents.filter(
        (enrollment) => enrollment.user?.studentNumber,
      );
      const studentsWithoutNumbers = allStudents.filter(
        (enrollment) => !enrollment.user?.studentNumber,
      );

      info("[BulkScanContext] Filtering details:", {
        totalFetched: allStudents.length,
        studentsWithNumbersCount: studentsWithNumbers.length,
        studentsWithoutNumbersCount: studentsWithoutNumbers.length,
      });

      if (studentsWithNumbers.length === 0) {
        setError(
          currentT("no_students_found_in_this_program") ||
            "No students found in this program",
        );
        return;
      }

      // Get student numbers for validation (from user.studentNumber)
      const studentNumbers = studentsWithNumbers.map(
        (enrollment) => enrollment.user.studentNumber,
      );

      info("[BulkScanContext] Student numbers for validation:", {
        totalStudents: allStudents.length,
        validatableNumbers: studentNumbers.length,
        nonValidatable: studentsWithoutNumbers.length,
      });

      // Limit to 100 students
      const limitedNumbers = studentNumbers.slice(0, 100);
      if (studentNumbers.length > 100) {
        warn("[BulkScanContext] Limited students to 100:", {
          total: studentNumbers.length,
          limited: limitedNumbers.length,
        });
      }

      // Create input text with student numbers
      const allStudentsText = limitedNumbers.join("\n");

      info("[BulkScanContext] About to set input text for Add All:", {
        studentCount: limitedNumbers.length,
        studentNumbers: limitedNumbers,
        inputText: allStudentsText,
      });

      // Parse and validate all students
      setInputText(allStudentsText);
      
      // Import parse function
      const { parseBulkStudentNumbers } = await import("@services/business/bulkAttendanceService");
      const parseResult = parseBulkStudentNumbers(allStudentsText);

      // parseBulkStudentNumbers returns array directly, not object with success property
      const parsedNumbers = Array.isArray(parseResult) ? parseResult : [];

      setParsedNumbers(parsedNumbers);
      setInvalidRows([]);
      setDuplicates([]);

      // Validate students using the freshly parsed numbers
      if (parsedNumbers.length > 0) {
        info("[BulkScanContext] About to validate students:", {
          studentCount: parsedNumbers.length,
          studentNumbers: parsedNumbers,
        });

        try {
          // Import validation function
          const { bulkValidateStudents } = await import("@services/business/bulkAttendanceService");
          
          const validationResult = await bulkValidateStudents({
            programId: currentProgramId,
            classId: currentClassId,
            attendanceMode: currentAttendanceMode,
            studentNumbers: parsedNumbers,
          });

          if (!validationResult.success) {
            setError(validationResult.error);
            setValidatedStudents({ found: [], notFound: parsedNumbers });
            setSelectedStudents([]);
            setExcludedStudents([]);
          } else {
            setValidatedStudents({
              found: validationResult.found,
              notFound: validationResult.notFound,
            });
            // Auto-populate selectedStudents with all found students in Add All mode
            setSelectedStudents(validationResult.found);
            setExcludedStudents([]);

            debug("[BulkScanContext] Validation complete:", {
              found: validationResult.found.length,
              notFound: validationResult.notFound.length,
            });
          }

          info("[BulkScanContext] Validation completed successfully");
        } catch (err) {
          logError("[BulkScanContext] Validation error:", err);
          setError(`Validation failed: ${err.message}`);
        }
      }

      currentShowSuccess(
        currentT("students_added_successfully") || "Students added successfully",
      );
    } catch (err) {
      logError("[BulkScanContext] Error adding all students:", err);
      setError(
        err.message ||
          currentT("failed_to_add_all_students_please_try_again") ||
            "Failed to add all students. Please try again.",
      );
    } finally {
      setAddingAll(false);
    }
  }, [clearState]);

  const addAllExcept = useCallback(async ({ programId: overrideProgramId, classId: overrideClassId, attendanceMode: overrideAttendanceMode } = {}) => {
    // Implementation for addAllExcept
    // This would fetch all students except those in the input text
    const currentProgramId = overrideProgramId || programIdRef.current;
    const currentClassId = overrideClassId || classIdRef.current;
    const currentAttendanceMode = overrideAttendanceMode || attendanceModeRef.current;
    const currentT = tRef.current;

    if (!currentProgramId) {
      setError(
        currentT("program_id_required") ||
          "Program ID is required",
      );
      return;
    }

    setAddingAll(true);
    setError(null);

    try {
      // Get all students first
      let allStudentsResponse;
      if (currentAttendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
        const { getEnrollmentsByProgram } = await import("@services/business/enrollmentService");
        allStudentsResponse = await getEnrollmentsByProgram(currentProgramId);
      } else {
        if (!currentClassId || currentClassId === 'all') {
          setError(currentT("please_select_class_first") || "Please select a class first");
          return;
        }
        const { getStudentsByClass } = await import("@services/business/enrollmentService");
        allStudentsResponse = await getStudentsByClass(currentClassId);
      }

      if (!allStudentsResponse.success || !allStudentsResponse.data) {
        setError(currentT("failed_to_fetch_students") || "Failed to fetch students");
        return;
      }

      const allStudents = allStudentsResponse.data;
      const allStudentNumbers = allStudents
        .filter(s => s.isStudent && s.studentNumber)
        .map(s => s.studentNumber);

      // Get the numbers to exclude from input text
      const { parseBulkStudentNumbers } = await import("@services/business/bulkAttendanceService");
      const parseResult = parseBulkStudentNumbers(inputText);
      
      if (!parseResult.success) {
        setError(parseResult.error);
        return;
      }

      const numbersToExclude = parseResult.parsed;
      const numbersToAdd = allStudentNumbers.filter(num => !numbersToExclude.includes(num));

      if (numbersToAdd.length === 0) {
        setError(currentT("no_students_to_add") || "No students to add");
        return;
      }

      // Create input text with the numbers to add
      const allStudentsText = numbersToAdd.join("\n");
      setInputText(allStudentsText);
      setParsedNumbers(numbersToAdd);
      setInvalidRows([]);
      setDuplicates([]);

      // Validate the students
      const { bulkValidateStudents } = await import("@services/business/attendanceService");
      const validationResult = await bulkValidateStudents({
        programId: currentProgramId,
        classId: currentClassId,
        attendanceMode: currentAttendanceMode,
        studentNumbers: numbersToAdd,
      });

      if (!validationResult.success) {
        setError(validationResult.error);
        setValidatedStudents({ found: [], notFound: numbersToAdd });
      } else {
        setValidatedStudents({
          found: validationResult.found,
          notFound: validationResult.notFound,
        });
      }

      const currentShowSuccess = showSuccessRef.current;
      currentShowSuccess(
        currentT("students_added_successfully") || "Students added successfully",
      );
    } catch (err) {
      logError("[BulkScanContext] Error in addAllExcept:", err);
      setError(
        err.message ||
          currentT("failed_to_add_students") ||
            "Failed to add students. Please try again.",
      );
    } finally {
      setAddingAll(false);
    }
  }, [inputText, clearState]);

  const value = {
    inputText,
    setInputText,
    parsedNumbers,
    setParsedNumbers,
    invalidRows,
    setInvalidRows,
    duplicates,
    setDuplicates,
    validatedStudents,
    setValidatedStudents,
    selectedStudents,
    setSelectedStudents,
    excludedStudents,
    setExcludedStudents,
    selectedStatus,
    setSelectedStatus,
    selectedDate,
    setSelectedDate,
    loading,
    setLoading,
    validating,
    setValidating,
    addingAll,
    setAddingAll,
    error,
    setError,
    progress,
    setProgress,
    result,
    setResult,
    clearState,
    clearAll,
    addAllStudents,
    addAllExcept,
    removeChip,
    parseInput,
    validateStudents,
    submit,
    canSubmit,
    stats,
    updateConfig,
    moveToExcluded,
    moveToSelected,
    moveAllToExcluded,
    moveAllToSelected,
  };

  return (
    <BulkScanContext.Provider value={value}>
      {children}
    </BulkScanContext.Provider>
  );
};
