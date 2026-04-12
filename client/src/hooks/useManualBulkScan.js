import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  parseBulkStudentNumbers,
  bulkValidateStudents,
  bulkUpsertAttendance,
  computeDateKey,
} from "@services/business/bulkAttendanceService";
import { formatQatarDateOnly, getQatarNow } from "@utils/qatarDate";
import {
  ATTENDANCE_STATUS,
  ATTENDANCE_TYPE_CATEGORY,
} from "@constants/attendanceTypes";
import { getStudentsByClass } from "@services/business/enrollmentService";
import { info, error, warn, debug } from "@services/utils/logger.js";
import eventBus, { EVENTS } from "@utils/eventBus";

const useManualBulkScan = ({
  programId,
  subjectId,
  classId,
  markedBy,
  performedBy,
  performedByName,
  performedByEmail,
  attendanceMode = ATTENDANCE_TYPE_CATEGORY.REGULAR,
  onSuccess,
  t,
  showSuccess,
  showError,
}) => {
  console.log('[useManualBulkScan] Hook initialized with:', { programId, subjectId, classId, attendanceMode });

  // Use refs for callback props to prevent re-initialization when they change
  const onSuccessRef = useRef(onSuccess);
  const tRef = useRef(t);
  const showSuccessRef = useRef(showSuccess);
  const showErrorRef = useRef(showError);
  const programIdRef = useRef(programId);
  const classIdRef = useRef(classId);
  const subjectIdRef = useRef(subjectId);
  const attendanceModeRef = useRef(attendanceMode);

  // Update refs when props change
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);
  useEffect(() => {
    tRef.current = t;
  }, [t]);
  useEffect(() => {
    showSuccessRef.current = showSuccess;
  }, [showSuccess]);
  useEffect(() => {
    showErrorRef.current = showError;
  }, [showError]);
  useEffect(() => {
    programIdRef.current = programId;
  }, [programId]);
  useEffect(() => {
    classIdRef.current = classId;
  }, [classId]);
  useEffect(() => {
    subjectIdRef.current = subjectId;
  }, [subjectId]);
  useEffect(() => {
    attendanceModeRef.current = attendanceMode;
  }, [attendanceMode]);

  const [inputText, setInputText] = useState("");
  const [parsedNumbers, setParsedNumbers] = useState([]);
  const [invalidRows, setInvalidRows] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [validatedStudents, setValidatedStudents] = useState({
    found: [],
    notFound: [],
  });
  const [selectedStatus, setSelectedStatus] = useState(
    ATTENDANCE_STATUS.PRESENT,
  );
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [addingAll, setAddingAll] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({
    processed: 0,
    total: 0,
    percentage: 0,
    currentBatch: 0,
    totalBatches: 0,
  });
  const [result, setResult] = useState(null);

  const dateKey = useMemo(() => computeDateKey(selectedDate), [selectedDate]);

  const parseInput = useCallback(async () => {
    info("[useManualBulkScan] parseInput called:", { inputText, programId, classId, attendanceMode });
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

    debug("[useManualBulkScan] Parsed input:", {
      totalInput: parseResult.totalInput,
      valid: parseResult.validCount,
      invalid: parseResult.invalid.length,
      duplicates: parseResult.duplicates.length,
    });

    // Automatically validate students after parsing
    if (parseResult.parsed.length > 0 && programId) {
      setValidating(true);
      try {
        info("[useManualBulkScan] Auto-validating after parse:", {
          studentCount: parseResult.parsed.length,
          attendanceMode,
          programId,
          classId,
          studentNumbers: parseResult.parsed
        });

        const validationResult = await bulkValidateStudents({
          programId,
          classId: attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? null : classId,
          attendanceMode,
          studentNumbers: parseResult.parsed,
        });

        debug("[useManualBulkScan] Validation result:", {
          success: validationResult.success,
          error: validationResult.error,
          foundCount: validationResult.found?.length || 0,
          notFoundCount: validationResult.notFound?.length || 0
        });

        if (!validationResult.success) {
          setError(validationResult.error);
          setValidatedStudents({ found: [], notFound: parseResult.parsed });
        } else {
          setValidatedStudents({
            found: validationResult.found,
            notFound: validationResult.notFound,
          });

          debug("[useManualBulkScan] Auto-validation complete:", {
            found: validationResult.found.length,
            notFound: validationResult.notFound.length,
          });
        }
      } catch (err) {
        error("[useManualBulkScan] Auto-validation failed:", err);
        setError(`Validation failed: ${err.message}`);
      } finally {
        setValidating(false);
      }
    } else {
      debug("[useManualBulkScan] Skipping auto-validation:", {
        parsedCount: parseResult.parsed.length,
        hasProgramId: !!programId,
        programId,
        reason: parseResult.parsed.length === 0 ? 'No parsed numbers' : 'No program ID'
      });
    }
  }, [inputText, programId, classId, attendanceMode]);

  const validateStudents = useCallback(async () => {
    if (parsedNumbers.length === 0) {
      setError(
        t("no_valid_student_numbers_to_validate") ||
          "No valid student numbers to validate",
      );
      return;
    }

    if (!programId) {
      setError(
        t("program_id_required_for_validation") ||
          "Program ID is required for validation",
      );
      return;
    }

    setValidating(true);
    setError(null);

    try {
      info("[useManualBulkScan] About to validate with parsedNumbers:", {
        parsedNumbersCount: parsedNumbers.length,
        parsedNumbers: parsedNumbers,
        attendanceMode,
      });

      const validationResult = await bulkValidateStudents({
        programId,
        classId: attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? null : classId,
        attendanceMode,
        studentNumbers: parsedNumbers,
      });

      if (!validationResult.success) {
        setError(validationResult.error);
        setValidatedStudents({ found: [], notFound: parsedNumbers });
      } else {
        setValidatedStudents({
          found: validationResult.found,
          notFound: validationResult.notFound,
        });

        debug("[useManualBulkScan] Validation complete:", {
          found: validationResult.found.length,
          notFound: validationResult.notFound.length,
        });
      }
    } catch (err) {
      error("[useManualBulkScan] Validation error:", err);
      setError(
        err.message ||
          t("failed_to_validate_students") ||
          "Failed to validate students",
      );
      setValidatedStudents({ found: [], notFound: parsedNumbers });
    } finally {
      setValidating(false);
    }
  }, [parsedNumbers, programId]);

  const removeChip = useCallback((studentNumber) => {
    setParsedNumbers((prev) => prev.filter((num) => num !== studentNumber));
    setValidatedStudents((prev) => ({
      found: prev.found.filter((s) => s.studentNumber !== studentNumber),
      notFound: prev.notFound.filter((num) => num !== studentNumber),
    }));
  }, []);

  const clearAll = useCallback(() => {
    setInputText("");
    setParsedNumbers([]);
    setInvalidRows([]);
    setDuplicates([]);
    setValidatedStudents({ found: [], notFound: [] });
    setSelectedStatus("present");
    setSelectedDate(new Date());
    setError(null);
    setResult(null);
    debug("[useManualBulkScan] State cleared");
  }, []);

  // Auto-add all students functionality
  const addAllStudents = useCallback(async () => {
    const currentProgramId = programIdRef.current;
    const currentClassId = classIdRef.current;
    const currentAttendanceMode = attendanceModeRef.current;
    const currentT = tRef.current;

    console.log('[useManualBulkScan] addAllStudents called:', { programId: currentProgramId, classId: currentClassId, attendanceMode: currentAttendanceMode });
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
      console.log('[useManualBulkScan] addAllStudents - Starting to fetch students:', { programId: currentProgramId, classId: currentClassId, attendanceMode: currentAttendanceMode });
      info("[useManualBulkScan] Adding all students:", { classId: currentClassId, attendanceMode: currentAttendanceMode });

      // In standup mode, get students by program instead of class
      let studentsResponse;
      if (currentAttendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
        console.log('[useManualBulkScan] addAllStudents - STANDUP MODE - Calling getEnrollmentsByProgram with programId:', currentProgramId);
        // Get enrollments by program for standup mode
        const { getEnrollmentsByProgram } = await import("@services/business/enrollmentService");
        studentsResponse = await getEnrollmentsByProgram(currentProgramId);
        console.log('[useManualBulkScan] addAllStudents - getEnrollmentsByProgram response:', {
          success: studentsResponse?.success,
          dataLength: studentsResponse?.data?.length,
          data: studentsResponse?.data
        });
      } else {
        // In regular mode, validate classId before calling getStudentsByClass
        if (!currentClassId || currentClassId === 'all') {
          setError(
            currentT("please_select_class_first") || "Please select a class first"
          );
          return;
        }
        // Get students enrolled in this specific class for regular mode
        studentsResponse = await getStudentsByClass(currentClassId);
      }

      if (!studentsResponse.success || !studentsResponse.data) {
        error(
          "[useManualBulkScan] Failed to fetch students:",
          studentsResponse,
        );
        setError(
          attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP
            ? (t("failed_to_fetch_program_students") || "Failed to fetch program students")
            : (t("failed_to_fetch_class_students") || "Failed to fetch class students"),
        );
        return;
      }

      const allStudents = studentsResponse.data;
      info("[useManualBulkScan] Fetched students:", {
        totalFetched: allStudents.length,
        classId,
        attendanceMode,
        allStudents: allStudents.map((s) => ({
          id: s.id,
          name: s.name || s.displayName || "No name",
          role: s.role,
          hasStudentNumber: !!s.studentNumber,
          studentNumber: s.studentNumber,
        })),
      });

      // Get ALL students for display, but separate those with/without numbers
      info("[useManualBulkScan] Before filtering - allStudents:", {
        totalFetched: allStudents.length,
        sample: allStudents.slice(0, 3).map(s => ({
          id: s.userId || s.id,
          displayName: s.user?.displayName || s.displayName,
          hasStudentNumber: !!s.user?.studentNumber,
          studentNumber: s.user?.studentNumber
        }))
      });

      // In getStudentsByClass, all returned users are students (enrolled in the class)
      // No need to filter by isStudent since class enrollments only include students
      const students = allStudents;

      info("[useManualBulkScan] After filter (all users are students in class):", {
        studentsCount: students.length,
        sample: students.slice(0, 3).map(s => ({
          id: s.userId || s.id,
          displayName: s.user?.displayName || s.displayName,
          hasStudentNumber: !!s.user?.studentNumber,
          studentNumber: s.user?.studentNumber
        }))
      });

      const studentsWithNumbers = students.filter(
        (student) => student.user?.studentNumber,
      );
      const studentsWithoutNumbers = students.filter(
        (student) => !student.user?.studentNumber,
      );

      info("[useManualBulkScan] Filtering details:", {
        totalFetched: allStudents.length,
        allStudentsCount: students.length,
        studentsWithNumbersCount: studentsWithNumbers.length,
        studentsWithoutNumbersCount: studentsWithoutNumbers.length,
        allStudentDetails: students.map((s) => ({
          id: s.id,
          name: s.name || s.displayName || "No name",
          role: s.role,
          hasStudentNumber: !!s.studentNumber,
          studentNumber: s.studentNumber,
        })),
      });

      // Show ALL fetched people with their roles (not just students)
      info("[useManualBulkScan] All class members:", {
        totalMembers: allStudents.length,
        members: allStudents.map((s) => ({
          id: s.id,
          name: s.name || s.displayName || "No name",
          role: s.role,
          hasStudentNumber: !!s.studentNumber,
          studentNumber: s.studentNumber,
          isStudent: s.isStudent, // Use actual isStudent flag, not computed from role
        })),
      });

      info("[useManualBulkScan] Student breakdown:", {
        totalStudents: students.length,
        withNumbers: studentsWithNumbers.length,
        withoutNumbers: studentsWithoutNumbers.length,
        classId: classId,
      });

      if (students.length === 0) {
        setError(
          t("no_students_found_in_this_program") ||
            "No students found in this program",
        );
        return;
      }

      // Get student numbers for validation (only those with numbers)
      const studentNumbers = studentsWithNumbers.map(
        (student) => student.user?.studentNumber,
      );

      info("[useManualBulkScan] Student numbers for validation:", {
        totalStudents: allStudents.length,
        validatableNumbers: studentNumbers.length,
        nonValidatable: studentsWithoutNumbers.length,
      });

      // Limit to 100 students
      const limitedNumbers = studentNumbers.slice(0, 100);
      if (studentNumbers.length > 100) {
        warn("[useManualBulkScan] Limited students to 100:", {
          total: studentNumbers.length,
          limited: limitedNumbers.length,
        });
      }

      // Create input text with student numbers
      const allStudentsText = limitedNumbers.join("\n");

      info("[useManualBulkScan] About to set input text for Add All:", {
        studentCount: limitedNumbers.length,
        studentNumbers: limitedNumbers,
        inputText: allStudentsText,
      });

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

      // Validate students using the freshly parsed numbers
      if (parseResult.parsed.length > 0) {
        info("[useManualBulkScan] About to validate students:", {
          studentCount: parseResult.parsed.length,
          studentNumbers: parseResult.parsed,
        });

        try {
          // Validate with the fresh parsed numbers directly, not relying on state
          const validationResult = await bulkValidateStudents({
            programId,
            classId,
            attendanceMode,
            studentNumbers: parseResult.parsed, // Use fresh parsed numbers
          });

          if (!validationResult.success) {
            setError(validationResult.error);
            setValidatedStudents({ found: [], notFound: parseResult.parsed });
          } else {
            setValidatedStudents({
              found: validationResult.found,
              notFound: validationResult.notFound,
            });

            debug("[useManualBulkScan] Validation complete:", {
              found: validationResult.found.length,
              notFound: validationResult.notFound.length,
            });
          }

          info("[useManualBulkScan] Validation completed successfully");
          info("[useManualBulkScan] Validated students after validation:", {
            foundCount: validatedStudents.found.length,
            notFoundCount: validatedStudents.notFound.length,
            foundStudents: validatedStudents.found.map((s) => ({
              studentNumber: s.studentNumber,
              displayName: s.displayName,
            })),
          });
        } catch (validationError) {
          error("[useManualBulkScan] Validation failed:", validationError);
          setError(`Validation failed: ${validationError.message}`);
          return;
        }
      }

      info("[useManualBulkScan] Added all students:", {
        totalStudents: allStudents.length,
        withNumbers: studentsWithNumbers.length,
        withoutNumbers: studentsWithoutNumbers.length,
        limitedTo: limitedNumbers.length,
        validNumbers: parseResult.parsed.length,
        invalid: parseResult.invalid.length,
        duplicates: parseResult.duplicates.length,
      });

      // Show feedback about how many students were added
      const addedCount = parseResult.parsed.length;
      const addedStudentNumbers = parseResult.parsed.join(", ");

      if (addedCount > 0) {
        const message = `Added ${addedCount} students: ${addedStudentNumbers}`;
        showSuccess(message);
      } else {
        showSuccess("No new students to add");
      }

      // Show warning if limited
      if (allStudents.length > 100) {
        setError(
          `Limited to first 100 students out of ${allStudents.length} total`,
        );
      }
    } catch (err) {
      error("[useManualBulkScan] Error adding all students:", {
        error: err.message,
        stack: err.stack,
        programId,
      });
      setError(
        t("failed_to_add_all_students_please_try_again") ||
          "Failed to add all students. Please try again.",
      );
    } finally {
      setAddingAll(false);
    }
  }, [
    parseBulkStudentNumbers,
    validateStudents,
    setInputText,
    setParsedNumbers,
    setInvalidRows,
    setDuplicates,
    setError,
    setAddingAll,
  ]);

  // Clear all state for fresh operations
  const clearState = useCallback(() => {
    setInputText("");
    setParsedNumbers([]);
    setInvalidRows([]);
    setDuplicates([]);
    setValidatedStudents({ found: [], notFound: [] });
    setError(null);
    setResult(null);
    info("[useManualBulkScan] State cleared for fresh operation");
  }, [
    setInputText,
    setParsedNumbers,
    setInvalidRows,
    setDuplicates,
    setValidatedStudents,
    setError,
    setResult,
  ]);

  // Submit attendance for validated students
  const submit = useCallback(async () => {
    if (validatedStudents.found.length === 0) {
      setError(
        t("no_valid_students_to_submit") || "No valid students to submit",
      );
      return;
    }

    if (!classId || !programId || !subjectId) {
      setError(
        t("class_program_and_subject_are_required") ||
          "Class, Program, and Subject are required",
      );
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setProgress({
      processed: 0,
      total: 0,
      percentage: 0,
      currentBatch: 0,
      totalBatches: 0,
    });

    info("[useManualBulkScan] Starting bulk submission:", {
      studentCount: validatedStudents.found.length,
      status: selectedStatus,
      dateKey,
      classId,
      programId,
      subjectId,
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
        attendanceMode,
        source: "bulk",
        notes:
          t("bulk_attendance_notes", {
            count: validatedStudents.found.length,
          }) || `Bulk attendance (${validatedStudents.found.length} students)`,
        onProgress: (progressData) => {
          setProgress(progressData);
          debug("[useManualBulkScan] Progress update:", progressData);
        },
      });

      if (bulkResult.success) {
        setResult(bulkResult);

        // Log detailed results for each student
        bulkResult.results.detailed.forEach((studentResult, index) => {
          info(
            `[useManualBulkScan] Student ${index + 1}/${bulkResult.results.detailed.length} result:`,
            {
              studentNumber: studentResult.studentNumber,
              studentName: studentResult.studentName,
              status: studentResult.status,
              message: studentResult.message,
              timestamp: studentResult.timestamp,
            },
          );
        });

        info("[useManualBulkScan] Bulk operation completed successfully:", {
          summary: bulkResult.summary,
          status: selectedStatus,
          dateKey,
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
        setError(bulkResult.error || "Bulk operation failed");
        setResult(bulkResult);

        error("[useManualBulkScan] Bulk operation failed:", {
          error: bulkResult.error,
          summary: bulkResult.summary,
        });
      }
    } catch (err) {
      error("[useManualBulkScan] Submit error:", {
        error: err.message,
        stack: err.stack,
        studentCount: validatedStudents.found.length,
        status: selectedStatus,
        dateKey,
      });
      setError(err.message || "Failed to submit bulk attendance");
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
    attendanceMode,
    onSuccess,
    clearAll,
  ]);

  // Add all students EXCEPT the ones listed
  const addAllExcept = useCallback(async () => {
    if (!programId) {
      setError(
        t("program_id_required_to_add_all_students") ||
          "Program ID is required to add all students",
      );
      return;
    }

    // For "Add All Except", we need to parse the input first if not already parsed
    let excludeNumbers = parsedNumbers;

    if (excludeNumbers.length === 0 && inputText.trim()) {
      // Parse the input to get student numbers to exclude
      const parseResult = parseBulkStudentNumbers(inputText);
      if (!parseResult.success) {
        setError(parseResult.error);
        return;
      }
      excludeNumbers = parseResult.parsed || [];

      if (excludeNumbers.length === 0) {
        setError(
          t("please_enter_valid_student_numbers_to_exclude_first") ||
            "Please enter valid student numbers to exclude first",
        );
        return;
      }
    } else if (excludeNumbers.length === 0 && !inputText.trim()) {
      setError(
        t("please_enter_student_numbers_to_exclude_first") ||
          "Please enter student numbers to exclude first",
      );
      return;
    }

    // Clear previous state but preserve input text and parsed numbers for "add all except"
    const currentInputText = inputText;
    clearState();
    setInputText(currentInputText); // Restore input text
    setParsedNumbers(excludeNumbers); // Set the parsed exclude numbers
    setAddingAll(true);
    setError(null);

    try {
      info("[useManualBulkScan] Adding all students EXCEPT listed ones:", {
        classId,
        programId,
        attendanceMode,
        excludeCount: excludeNumbers.length,
        excludedNumbers: excludeNumbers,
      });

      // Get students based on attendance mode
      let studentsResponse;
      if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
        // In standup mode, get students by program
        const { getEnrollmentsByProgram } = await import("@services/business/enrollmentService");
        studentsResponse = await getEnrollmentsByProgram(programId);
      } else {
        // In regular mode, get students by class
        studentsResponse = await getStudentsByClass(classId);
      }

      if (!studentsResponse.success || !studentsResponse.data) {
        error(
          "[useManualBulkScan] Failed to fetch class students:",
          studentsResponse,
        );
        setError(
          t("failed_to_fetch_class_students") ||
            "Failed to fetch class students",
        );
        return;
      }

      const classStudents = studentsResponse.data;
      info("[useManualBulkScan] Fetched class students:", {
        totalFetched: classStudents.length,
        classId,
      });

      // Get ALL students for display, then filter for validation
      const allStudents = classStudents.filter(
        (student) => student.isStudent === true,
      );
      const studentsWithNumbers = allStudents.filter(
        (student) => student.studentNumber,
      );
      const studentsWithoutNumbers = allStudents.filter(
        (student) => !student.studentNumber,
      );

      // For validation, exclude listed student numbers
      const validatableStudents = studentsWithNumbers.filter(
        (student) => !excludeNumbers.includes(student.studentNumber), // Exclude listed student numbers
      );

      info("[useManualBulkScan] Filtered students (excluding listed):", {
        totalStudents: allStudents.length,
        withNumbers: studentsWithNumbers.length,
        withoutNumbers: studentsWithoutNumbers.length,
        validatableAfterExclusion: validatableStudents.length,
        excludedCount: excludeNumbers.length,
        classId: classId,
      });

      if (
        validatableStudents.length === 0 &&
        studentsWithoutNumbers.length === 0
      ) {
        setError(
          t("no_students_found_after_exclusions") ||
            "No students found after exclusions",
        );
        return;
      }

      const studentNumbers = validatableStudents.map(
        (student) => student.studentNumber,
      );

      if (
        validatableStudents.length === 0 &&
        studentsWithoutNumbers.length > 0
      ) {
        setError(
          t("only_students_without_numbers_remain_after_exclusions") ||
            "Only students without student numbers remain after exclusions",
        );
        return;
      }

      // Limit to 100 students
      const limitedNumbers = studentNumbers.slice(0, 100);
      if (validatableStudents.length > 100) {
        warn("[useManualBulkScan] Limited students to 100:", {
          total: validatableStudents.length,
          limited: limitedNumbers.length,
        });
      }

      // Create input text with student numbers
      const allStudentsText = limitedNumbers.join("\n");

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

      // Validate the remaining students (after exclusion) using direct validation
      const remainingStudentNumbers = validatableStudents.map(
        (student) => student.studentNumber,
      );

      if (remainingStudentNumbers.length > 0) {
        info(
          "[useManualBulkScan] About to validate remaining students for Add All Except:",
          {
            studentCount: remainingStudentNumbers.length,
            studentNumbers: remainingStudentNumbers,
          },
        );

        try {
          // Validate the remaining students directly
          const validationResult = await bulkValidateStudents({
            programId,
            classId,
            attendanceMode,
            studentNumbers: remainingStudentNumbers,
          });

          if (!validationResult.success) {
            setError(validationResult.error);
            setValidatedStudents({
              found: [],
              notFound: remainingStudentNumbers,
            });
          } else {
            setValidatedStudents({
              found: validationResult.found,
              notFound: validationResult.notFound,
            });

            debug("[useManualBulkScan] Add All Except validation complete:", {
              found: validationResult.found.length,
              notFound: validationResult.notFound.length,
            });
          }
        } catch (validationError) {
          error(
            "[useManualBulkScan] Add All Except validation failed:",
            validationError,
          );
          setError(`Validation failed: ${validationError.message}`);
          return;
        }
      } else {
        // No remaining students
        setValidatedStudents({ found: [], notFound: [] });
      }

      // Populate input with remaining student numbers for review
      if (remainingStudentNumbers.length > 0) {
        const inputText = remainingStudentNumbers.join("\n");

        info(
          "[useManualBulkScan] Setting input text with remaining students:",
          {
            remainingCount: remainingStudentNumbers.length,
            studentNumbers: remainingStudentNumbers,
            inputText: inputText,
          },
        );

        // Set the input text with remaining students
        setInputText(inputText);

        // Set parsed numbers to match the remaining students
        setParsedNumbers(remainingStudentNumbers);
      } else {
        warn("[useManualBulkScan] No students remaining after exclusions");
        setError(
          t("no_students_remaining_after_exclusions") ||
            "No students remaining after exclusions",
        );

        // Clear the input and validated students since there are no students to add
        setInputText("");
        setParsedNumbers([]);
        setValidatedStudents({ found: [], notFound: [] });
        return;
      }

      info("[useManualBulkScan] Added all students except listed:", {
        totalStudents: allStudents.length,
        withNumbers: studentsWithNumbers.length,
        withoutNumbers: studentsWithoutNumbers.length,
        validatableAfterExclusion: validatableStudents.length,
        excludedCount: parsedNumbers.length,
        limitedTo: limitedNumbers.length,
        validNumbers: parseResult.parsed.length,
        invalid: parseResult.invalid.length,
        duplicates: parseResult.duplicates.length,
      });

      // Show feedback about how many students were added
      const addedCount = parseResult.parsed.length;
      const excludedCount = parsedNumbers.length;
      const addedStudentNumbers = parseResult.parsed.join(", ");
      const excludedStudentNumbers = parsedNumbers.join(", ");

      if (addedCount > 0) {
        const message =
          excludedCount > 0
            ? `Added ${addedCount} students: ${addedStudentNumbers} (excluded ${excludedCount}: ${excludedStudentNumbers})`
            : `Added ${addedCount} students: ${addedStudentNumbers}`;
        showSuccess(message);
      } else {
        showSuccess(
          `No students to add (excluded ${excludedCount}: ${excludedStudentNumbers})`,
        );
      }

      // Show warning if limited
      if (allStudents.length > 100) {
        setError(
          `Limited to first 100 students out of ${allStudents.length} total (after exclusions)`,
        );
      }
    } catch (error) {
      error("[useManualBulkScan] Error adding all except:", {
        error: error.message,
        stack: error.stack,
        programId,
      });
      setError(
        t("failed_to_add_all_students_please_try_again") ||
          "Failed to add all students. Please try again.",
      );
    } finally {
      setAddingAll(false);
    }
  }, [
    programId,
    classId,
    parsedNumbers,
    parseBulkStudentNumbers,
    parseInput,
    submit,
    setValidatedStudents,
    setError,
    setResult,
    setAddingAll,
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
  }, [
    validatedStudents.found.length,
    loading,
    validating,
    classId,
    programId,
    subjectId,
    selectedStatus,
  ]);

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
      alreadyMarked: result?.summary?.alreadyMarked || 0,
    },
  };
};

export default useManualBulkScan;
