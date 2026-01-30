import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import logger from '@utils/logger';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useNavigate } from 'react-router-dom';
import { getUsers, getClasses, getEnrollments } from '@firebaseServices/firestore';
import { getPrograms, getSubjects } from '@firebaseServices/programs';
import { markAttendance, getAttendanceByClass, getAttendanceByStudent, deleteAttendance } from '@firebaseServices/attendance';
import { createPenalty, getPenalties, deletePenalty } from '@firebaseServices/penalties';
import { PENALTY_TYPES } from '@constants/penaltyTypes';
import { db } from '@firebaseServices/config';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { addNotification } from '@firebaseServices/notifications';
import { sendStudentNotification } from '@utils/notificationService';
import { BEHAVIOR_TYPES } from '@constants/behaviorTypes';
import { PARTICIPATION_TYPES } from '@constants/participationTypes';
import { Select, DatePicker, Button, Loading, Card, CardBody } from '@ui';
import { FancyLoading } from '@ui';
import { BookOpen, FileText, Users, Filter, Star } from 'lucide-react';
import QRScanner from '@/components/qr-scanner/QRScanner';
import StudentRoster from '@/components/qr-scanner/StudentRoster';
import StudentActionPanel from '@/components/qr-scanner/StudentActionPanel';
import StudentActionPanelNew from '@/components/qr-scanner/StudentActionPanelNew';
import '@/components/qr-scanner/ui/qr-scanner-ui.css';
import './InstructorQRScannerPage.module.css';
import eventBus, { EVENTS } from '@utils/eventBus';

const InstructorQRScannerPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { t, lang, isRTL } = useLang();
  const navigate = useNavigate();

  // Filter state
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedProgramId, setSelectedProgramId] = useState('all');
  const [selectedSubjectId, setSelectedSubjectId] = useState('all');
  const [selectedClassId, setSelectedClassId] = useState('all');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // Format as yyyy-MM-dd
  });
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [attendanceFilter, setAttendanceFilter] = useState('all');
  const [participationMin, setParticipationMin] = useState('');
  const [participationMax, setParticipationMax] = useState('');
  const [penaltyFilter, setPenaltyFilter] = useState('all');

  // Data state
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedStudentForAction, setSelectedStudentForAction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gridLoading, setGridLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [enrollments, setEnrollments] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [penaltyRecords, setPenaltyRecords] = useState([]);
  const [error, setError] = useState(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favoriteBehaviors, setFavoriteBehaviors] = useState([]);
  const [showScanner, setShowScanner] = useState(true);
  const [sendNotifications, setSendNotifications] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);

  // Debounced resize handler for performance
  useEffect(() => {
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsMobile(window.innerWidth <= 768);
      }, 150);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Redirect to login if session expired (no user)
  useEffect(() => {
    if (!user && !authLoading) {
      logger.debug('[QR Scanner] No user found - redirecting to login');
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // Sidebar state
  const [activityRefresh, setActivityRefresh] = useState(null);
  const [deleteActivityModalOpen, setDeleteActivityModalOpen] = useState(false);
  const [activityToDelete, setDeleteActivityData] = useState(null);
  const [deleteActivityLoading, setDeleteActivityLoading] = useState(false);

  // Handle activity refresh from QRScanner
  const handleActivityUpdate = useCallback((refreshFunction) => {
    if (refreshFunction) {
      refreshFunction(); // Call the refresh function immediately
    }
  }, []);

  // Handle activity deletion from QRScanner
  const handleDeleteActivity = (activity) => {
    setDeleteActivityData(activity);
    setDeleteActivityModalOpen(true);
  };

  const confirmDeleteActivity = async () => {
    if (!activityToDelete) return;
    
    setDeleteActivityLoading(true);
    try {
      let result;
      if (activityToDelete.type === 'attendance') {
        result = await deleteAttendance(activityToDelete.id);
        if (result.success) {
          eventBus.emit(EVENTS.ATTENDANCE_MARKED, { studentId: activityToDelete.studentId });
        }
      } else if (activityToDelete.type === 'penalty') {
        result = await deletePenalty(activityToDelete.id);
        if (result.success) {
          eventBus.emit(EVENTS.PENALTY_ASSIGNED, { studentId: activityToDelete.studentId });
        }
      }
      
      if (result?.success) {
        triggerActivityRefresh();
        loadStudents(selectedClassId, selectedDate);
      }
    } catch (error) {
      console.error('Error deleting activity:', error);
    } finally {
      setDeleteActivityLoading(false);
      setDeleteActivityModalOpen(false);
      setDeleteActivityData(null);
    }
  };

  // Memoized trigger activity refresh
  const triggerActivityRefresh = useCallback(() => {
    if (activityRefresh) {
      activityRefresh();
    }
  }, [activityRefresh]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Debounce search query for performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Memoized options for dropdowns - following DashboardPage pattern
  const programOptions = useMemo(() => {
    const opts = [
      { value: 'all', label: t('all_programs'), icon: <Filter size={16} color="#374151" /> }
    ];
    const validPrograms = programs
      .filter(prog => prog.docId || prog.id)
      .map(prog => {
        const value = prog.docId || prog.id;
        const label = lang === 'ar' ? (prog.name_ar || prog.name_en || prog.name || prog.code || value) : (prog.name_en || prog.name || prog.code || value);
        return { value, label, icon: <BookOpen size={16} color="#374151" /> };
      });
    return [...opts, ...validPrograms];
  }, [programs, t, lang]);

  const subjectOptions = useMemo(() => {
    const opts = [
      { value: 'all', label: t('all_subjects'), icon: <Filter size={16} color="#374151" /> }
    ];
    const validSubjects = subjects
      .filter(sub => {
        if (!selectedProgramId || selectedProgramId === 'all') return true;
        const subProgramId = sub.programId || sub.program || '';
        const formProgramId = selectedProgramId;
        return subProgramId === formProgramId;
      })
      .filter(sub => sub.docId || sub.id)
      .map(sub => {
        const value = sub.docId || sub.id;
        const label = lang === 'ar' ? (sub.name_ar || sub.name_en || sub.name || sub.code || value) : (sub.name_en || sub.name || sub.code || value);
        return { value, label, icon: <FileText size={16} color="#374151" /> };
      });
    return [...opts, ...validSubjects];
  }, [subjects, selectedProgramId, t, lang]);

  const classOptions = useMemo(() => {
    const opts = [
      { value: 'all', label: t('all_classes'), icon: <Filter size={16} color="#374151" /> }
    ];
    const validClasses = classes
      .filter(cls => {
        if (!selectedSubjectId || selectedSubjectId === 'all') return true;
        const clsSubjectId = cls.subjectId || cls.subject || '';
        const formSubjectId = selectedSubjectId;
        return clsSubjectId === formSubjectId;
      })
      .filter(cls => cls.docId || cls.id)
      .map(cls => {
        const value = cls.docId || cls.id;
        const name = lang === 'ar' ? (cls.name_ar || cls.name) : (cls.name || cls.name_ar || t('unnamed_class'));
        const label = `${name}${cls.code ? ` (${cls.code})` : ''}`;
        return { value, label, icon: <Users size={16} color="#374151" /> };
      });
    return [...opts, ...validClasses];
  }, [classes, selectedSubjectId, t, lang]);

  // Load programs on mount
  useEffect(() => {
    logger.debug('[QR Scanner] Initializing page...');
    loadPrograms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load subjects when program changes
  useEffect(() => {
    if (selectedProgramId && selectedProgramId !== 'all') {
      setGridLoading(true);
      loadSubjects(selectedProgramId);
    } else {
      setGridLoading(true);
      loadSubjects(null);
      setSubjects([]);
      setSelectedSubjectId('all');
      setSelectedClassId('all');
      setGridLoading(false);
    }
  }, [selectedProgramId]);

  // Load classes when subject changes
  useEffect(() => {
    if (selectedSubjectId && selectedSubjectId !== 'all') {
      loadClasses(selectedSubjectId);
    } else {
      setClasses([]);
      setSelectedClassId('all');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubjectId]);

  // Load students when class or date changes
  useEffect(() => {
    if (selectedClassId && selectedClassId !== 'all') {
      loadStudents(selectedClassId, selectedDate);
    } else {
      setStudents([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassId, selectedDate]);

  // Load favorite behaviors when student changes
  useEffect(() => {
    if (selectedStudent?.id) {
      const studentFavorites = selectedStudent.favoriteBehaviors || [];
      setFavoriteBehaviors(studentFavorites);
    } else {
      setFavoriteBehaviors([]);
    }
  }, [selectedStudent?.id]);

  // Listen for real-time attendance updates
  useEffect(() => {
    const unsubscribe = eventBus.on(EVENTS.ATTENDANCE_MARKED, (data) => {
      // If the update is for the current class, refresh students
      if (data.classId === selectedClassId) {
        loadStudents(selectedClassId, selectedDate);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassId, selectedDate]);

  const loadPrograms = async () => {
    try {
      const programsResponse = await getPrograms();
      let programsData = programsResponse.success ? programsResponse.data : [];

      if (programsData.length === 0) {
        logger.warn('[QR Scanner] No programs found in database');
      }

      setPrograms(programsData);
      setInitialLoading(false);
    } catch (error) {
      logger.error('[QR Scanner] Error loading programs:', error);
      setPrograms([]);
      setError('Failed to load programs: ' + error.message);
      setInitialLoading(false);
    }
  };

  const loadSubjects = async (programId) => {
    try {
      const subjectsResponse = await getSubjects(programId || null);
      let subjectsData = subjectsResponse.success ? subjectsResponse.data : [];
      
      // Sort client-side when filtering by program to avoid index requirement
      if (programId) {
        subjectsData.sort((a, b) => (a.code || '').localeCompare(b.code || ''));
      }

      setSubjects(subjectsData);
      setGridLoading(false);
    } catch (error) {
      logger.error('[QR Scanner] Error loading subjects:', error);
      setSubjects([]);
      setGridLoading(false);
      setError('Failed to load subjects: ' + error.message);
    }
  };

  const loadClasses = async (subjectId) => {
    try {
      const classesResponse = await getClasses();
      const allClasses = classesResponse.success ? classesResponse.data : [];
      
      let filteredClasses = allClasses;
      
      // If user is admin or super admin, show all classes
      if (user?.role === 'admin' || user?.role === 'super_admin') {
        if (subjectId && subjectId !== 'all') {
          filteredClasses = allClasses.filter(c => c.subjectId === subjectId);
        }
      } else {
        // Regular instructor - only show their classes
        filteredClasses = allClasses.filter(c => 
          c.instructorId === user?.uid || c.ownerEmail === user?.email
        );
        if (subjectId && subjectId !== 'all') {
          filteredClasses = filteredClasses.filter(c => c.subjectId === subjectId);
        }
      }
      
      if (filteredClasses.length === 0) {
        // console.warn('[QR Scanner] No classes found');
      }

      setClasses(filteredClasses);
    } catch (error) {
      logger.error('[QR Scanner] Error loading classes:', error);
      setClasses([]);
      setError('Failed to load classes: ' + error.message);
    }
  };

  // Memoized loadStudents function for performance
  const loadStudents = useCallback(async (classId, date) => {
    try {
      logger.debug('[QR Scanner] Loading students for class:', classId, 'date:', date);
      setLoading(true);

      // Parallel data fetching for better performance
      const [enrollmentsResponse, usersResponse, penaltiesResponse] = await Promise.all([
        getEnrollments(),
        getUsers(),
        getPenalties()
      ]);

      const allEnrollments = enrollmentsResponse.success ? enrollmentsResponse.data : [];
      const allUsers = usersResponse.success ? usersResponse.data : [];
      const allPenalties = penaltiesResponse.success ? penaltiesResponse.data : [];
      
      // Create Set for O(1) lookup performance
      const classEnrollments = allEnrollments.filter(e => e.classId === classId);
      const studentIdSet = new Set(classEnrollments.map(e => e.userId));
      const studentUsers = allUsers.filter(u => 
        studentIdSet.has(u.id) || studentIdSet.has(u.docId)
      );
      
      setEnrollments(classEnrollments);

      if (studentUsers.length === 0) {
        logger.warn('[QR Scanner] No students found for this class');
      }

      // Get attendance for selected date
      const dateObj = new Date(date);
      const dateStr = dateObj.toISOString().split('T')[0];
      const attendanceResponse = await getAttendanceByClass(classId, dateStr);
      const attendance = attendanceResponse.success ? attendanceResponse.data : [];
      setAttendanceRecords(attendance);

      // Create penalty map for O(1) lookup
      const penaltyMap = new Map();
      allPenalties.forEach(p => {
        if (studentIdSet.has(p.studentId)) {
          const existing = penaltyMap.get(p.studentId) || [];
          existing.push(p);
          penaltyMap.set(p.studentId, existing);
        }
      });
      setPenaltyRecords(Array.from(penaltyMap.values()).flat());

      // Process students in parallel batches for better performance
      const BATCH_SIZE = 10;
      const studentsWithData = [];
      
      for (let i = 0; i < studentUsers.length; i += BATCH_SIZE) {
        const batch = studentUsers.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(batch.map(async (student) => {
          const studentId = student.id || student.docId;
          const studentName = student.displayName || student.realName || student.name || student.email;
          
          // Find the primary attendance record
          const studentRecords = attendance.filter(a => a.studentId === studentId);
          const todayAttendance = studentRecords.find(a => !a.delta) || studentRecords[0];

          // Fetch all attendance records for this student
          const studentAttendanceResponse = await getAttendanceByStudent(studentId);
          const studentAttendanceRecords = studentAttendanceResponse.success ? studentAttendanceResponse.data : [];

          // Calculate totals efficiently
          let participationTotal = 0;
          let behaviorTotal = 0;
          let totalAttendanceCount = 0;
          const studentParticipationHistory = [];
          const studentBehaviorHistory = [];
          
          studentAttendanceRecords.forEach(record => {
            if (record.delta) {
              const category = record.category || (record.delta > 0 ? 'participation' : 'behavior');
              const historyItem = {
                id: record.id,
                date: record.date,
                time: record.timestamp,
                points: record.delta,
                reason: record.notes || record.reason || '',
                markedBy: record.markedBy,
                category
              };

              if (category === 'participation') {
                participationTotal += record.delta;
                studentParticipationHistory.push(historyItem);
              } else if (category === 'behavior') {
                behaviorTotal += record.delta;
                studentBehaviorHistory.push(historyItem);
              }
            }
            
            if (record.status === 'present' || record.status === 'late') {
              totalAttendanceCount++;
            }
          });

          // Get penalties from map
          const penalties = penaltyMap.get(studentId) || [];
          const penaltyTotal = penalties.reduce((sum, p) => {
            const pPoints = p.points;
            if (pPoints !== null && pPoints !== undefined && pPoints !== '' && !isNaN(pPoints)) {
              return sum + Number(pPoints);
            }
            return sum;
          }, 0);

          return {
            id: studentId,
            docId: student.docId,
            studentId: student.studentId || studentId,
            studentNumber: student.studentNumber,
            name: studentName,
            email: student.email,
            attendance: todayAttendance?.status || 'absent_no_excuse',
            participation: participationTotal,
            behavior: behaviorTotal,
            penalty: penaltyTotal,
            totalAttendance: totalAttendanceCount,
            isPinned: student.isPinned || false,
            behaviorHistory: studentBehaviorHistory,
            participationHistory: studentParticipationHistory,
            penaltyHistory: penalties
          };
        }));
        
        studentsWithData.push(...batchResults);
      }

      setStudents(studentsWithData);
    } catch (error) {
      logger.error('[QR Scanner] Error loading students:', error);
      setStudents([]);
      setError('Failed to load students: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleScan = useCallback((studentId) => {
    // studentId here is the reference ID (like STU-JLHXQ2)
    const student = students.find(s => s.studentId === studentId || s.id === studentId || `STU-${s.studentNumber}` === studentId);
    if (student) {
      setSelectedStudentForAction(student); // Use new panel instead of old
      // Always use the user ID (student.id) for attendance marking, not reference ID
      logger.debug('handleScan: Found student', {
        referenceId: studentId,
        userId: student.id,
        studentName: student.displayName || student.name
      });
      handleMarkAttendance(student.id, 'present', 'Marked present via QR camera scan', 'qr_camera');
    } else {
      logger.error('handleScan: Student not found', { studentId });
    }
  }, [students]);

  const handleStudentSelect = useCallback((student) => {
    setSelectedStudentForAction(student); // Use new panel instead of old
  }, []);

  // Listen for attendance updates to refresh students
  useEffect(() => {
    const unsubscribeAttendanceDeleted = eventBus.on(EVENTS.ATTENDANCE_DELETED, () => {
      // Refresh students when attendance is deleted
      if (selectedClassId && selectedDate) {
        loadStudents(selectedClassId, selectedDate);
      }
    });

    return () => {
      unsubscribeAttendanceDeleted();
    };
  }, [selectedClassId, selectedDate, loadStudents]);

  const handleMarkAttendance = useCallback(async (studentId, status, notes = '', method = 'manual_instructor') => {
    try {
      // Ensure selectedDate is a string in yyyy-MM-dd format
      const dateStr = typeof selectedDate === 'string' ? selectedDate : selectedDate.toISOString().split('T')[0];
      
      await markAttendance({
        classId: selectedClassId,
        studentId,
        date: dateStr,
        status,
        notes,
        method,
        markedBy: user.uid
      });

      // Reload students to reflect changes
      await loadStudents(selectedClassId, selectedDate);
      
      // Small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Emit real-time event for activity updates
      // Use user ID as primary, but include reference ID for QR scanner compatibility
      const student = students.find(s => s.id === studentId);
      const referenceId = student ? `STU-${student.studentNumber}` : studentId;
      
      eventBus.emit(EVENTS.ATTENDANCE_MARKED, {
        studentId, // Primary: user ID for data consistency
        referenceId, // Secondary: reference ID for QR scanner
        classId: selectedClassId,
        status,
        performedBy: user,
        timestamp: new Date()
      });
      
      // Trigger activity refresh to update recent activity
      triggerActivityRefresh();

      // Send notifications if enabled
      if (sendNotifications) {
        const student = students.find(s => s.id === studentId);
        const currentClass = classes.find(c => (c.id || c.docId) === selectedClassId);
        if (student && currentClass) {
          const statusLabels = {
            present: { en: 'Present', ar: 'حاضر' },
            absent_no_excuse: { en: 'Absent', ar: 'غائب (بدون عذر)' },
            absent_with_excuse: { en: 'Absent (Excused)', ar: 'غائب (بعذر)' },
            late: { en: 'Late', ar: 'متأخر' },
            excused_leave: { en: 'Excused Leave', ar: 'إجازة' },
            human_case: { en: 'Human Case', ar: 'حالة إنسانية' }
          };

          const label = statusLabels[status] || { en: status, ar: status };

          await sendStudentNotification({
            userId: student.id,
            email: student.email,
            title: t('attendance_marked_title'),
            message: t('attendance_marked_msg', { 
              className: currentClass.name || currentClass.code,
              status: lang === 'ar' ? (label.ar || label.en) : label.en
            }),
            type: 'attendance',
            templateId: 'attendance_marked_default',
            variables: {
              recipientName: student.displayName || student.realName || student.name || student.email,
              className: currentClass.name || currentClass.code,
              className_ar: currentClass.name_ar || currentClass.name || currentClass.code,
              status: label.en,
              status_ar: label.ar,
              date: dateStr,
              notes: notes,
              notes_ar: notes
            },
            sendEmailNotification: true
          });
        }
      }
    } catch (error) {
      logger.error('Error marking attendance:', error);
    }
  }, [selectedClassId, selectedDate, user, students, classes, sendNotifications, t, lang, loadStudents, triggerActivityRefresh]);

  const handleBehaviorSubmit = useCallback(async (studentId, actions, note, pointsOverride = {}) => {
    console.log('🔧 handleBehaviorSubmit called:', { studentId, actions, note, pointsOverride }); // Debug
    try {
      // Handle participation
      const participationActions = actions.filter(a =>
        PARTICIPATION_TYPES.some(pt => pt.id === a.type)
      );

      // Handle behavior
      const behaviorActions = actions.filter(a =>
        BEHAVIOR_TYPES.some(bt => bt.id === a.type)
      );

      // Handle penalties
      const penaltyActions = actions.filter(a => a.points < 0);
      
      console.log('🔧 Action categories:', { 
        participationActions: participationActions.length, 
        behaviorActions: behaviorActions.length, 
        penaltyActions: penaltyActions.length 
      }); // Debug

      // Save to Firebase
      for (const action of actions) {
        const points = pointsOverride[action.type] !== undefined
          ? pointsOverride[action.type]
          : action.points;
          
        console.log('🔧 Processing action:', { action, points, category: action.category }); // Debug

        if (action.category === 'penalty') {
          // Add penalty (only for actions with category 'penalty')
          console.log('🔧 Creating penalty for:', { studentId, action, points }); // Debug
          await createPenalty({
            studentId,
            classId: selectedClassId,
            subjectId: selectedSubjectId,
            type: action.type,
            points: Math.abs(points),
            reason: note,
            createdBy: user.uid
          });
          console.log('✅ Penalty created successfully'); // Debug
          console.log('🔄 Triggering student and activity refresh after penalty'); // Debug
        } else if (action.category === 'behavior' || action.category === 'participation') {
          // Add behavior/participation using markAttendance with delta
          console.log('🔧 Creating behavior/participation for:', { studentId, action, points }); // Debug
          // Add participation/behavior using markAttendance with delta
          // Get student information for proper naming
          console.log('🔧 Looking for student in students array:', { 
            studentId, 
            totalStudents: students.length, 
            studentIds: students.map(s => s.id).slice(0, 3) // Show first 3 IDs
          }); // Debug
          
          const studentData = students.find(s => s.id === studentId);
          const studentInfo = studentData ? {
            name: studentData.name || studentData.displayName || 'Unknown',
            email: studentData.email,
            studentId: studentData.studentId,
            referenceId: studentData.referenceId
          } : null;
          
          console.log('🔧 Student info found:', { studentData, studentInfo }); // Debug
          
          console.log('🔧 Calling markAttendance with:', {
            classId: selectedClassId,
            studentId,
            date: selectedDate,
            status: null,
            markedBy: user.uid,
            method: 'manual',
            notes: `${action.label_en || action.type}: ${note}`,
            delta: points,
            category: action.category,
            studentInfo,
            className: classes.find(c => c.id === selectedClassId)?.name || ''
          }); // Debug
          
          await markAttendance({
            classId: selectedClassId,
            studentId,
            date: selectedDate,
            status: null, // No status for delta records
            markedBy: user.uid,
            method: 'manual',
            notes: `${action.label_en || action.type}: ${note}`,
            delta: points,
            category: action.category,
            studentInfo, // Pass student information
            className: classes.find(c => c.id === selectedClassId)?.name || ''
          });
          
          console.log('✅ markAttendance completed successfully'); // Debug

          // ALSO add to dedicated collections for Dashboard compatibility
          try {
            if (action.category === 'behavior') {
              await addDoc(collection(db, 'behaviors'), {
                studentId,
                classId: selectedClassId,
                subjectId: selectedSubjectId,
                type: action.type || 'unknown',
                points: points,
                description: note,
                createdBy: user.uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
            } else if (action.category === 'participation') {
              await addDoc(collection(db, 'participations'), {
                studentId,
                classId: selectedClassId,
                subjectId: selectedSubjectId,
                type: action.type || 'participation',
                points: points,
                description: note,
                createdBy: user.uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
            }
          } catch (e) {
            logger.error(`Error saving to ${action.category} collection:`, e);
          }
        } else {
          console.log('🔧 Unknown action category:', action.category); // Debug
        }
      }

      // Reload students with a small delay to allow Firestore to propagate
      setTimeout(async () => {
        await loadStudents(selectedClassId, selectedDate);
        
        // Trigger activity refresh to update recent activity
        triggerActivityRefresh();
      }, 500);

      // Emit events for each action type
      participationActions.forEach(action => {
        eventBus.emit(EVENTS.PARTICIPATION_ADDED, {
          studentId,
          actionType: action.type,
          points: pointsOverride[action.type] || action.points,
          performedBy: user,
          timestamp: new Date()
        });
      });

      behaviorActions.forEach(action => {
        eventBus.emit(EVENTS.BEHAVIOR_LOGGED, {
          studentId,
          actionType: action.type,
          points: pointsOverride[action.type] || action.points,
          note,
          performedBy: user,
          timestamp: new Date()
        });
      });

      penaltyActions.forEach(action => {
        eventBus.emit(EVENTS.PENALTY_ASSIGNED, {
          studentId,
          actionType: action.type,
          points: pointsOverride[action.type] || action.points,
          performedBy: user,
          timestamp: new Date()
        });
      });

      // Update selected student
      const updatedStudent = students.find(s => s.id === studentId);
      setSelectedStudentForAction(updatedStudent); // Use new panel instead of old

      // Send notifications if enabled
      if (sendNotifications) {
        const student = students.find(s => s.id === studentId);
        const currentClass = classes.find(c => (c.id || c.docId) === selectedClassId);
        if (student && currentClass) {
          for (const action of actions) {
            const points = pointsOverride[action.type] !== undefined
              ? pointsOverride[action.type]
              : action.points;

            let type = 'info';
            let templateId = '';
            let title = '';

            if (points < 0) {
              type = 'penalty';
              templateId = 'penalty_assigned_default';
              title = t('delete_penalty_title');
            } else if (PARTICIPATION_TYPES.some(pt => pt.id === action.type)) {
              type = 'participation';
              templateId = 'participation_added_default';
              title = t('participation_recorded');
            } else {
              type = 'behavior';
              templateId = 'behavior_logged_default';
              title = t('behavior_recorded');
            }

            await sendStudentNotification({
              userId: student.id,
              email: student.email,
              title,
              message: t('action_logged_msg', {
                type: t(type),
                className: currentClass.name || currentClass.code,
                label: lang === 'ar' ? (action.label_ar || action.label_en || action.type) : (action.label_en || action.label || action.type)
              }),
              type,
              templateId,
              variables: {
                recipientName: student.displayName || student.realName || student.name || student.email,
                className: currentClass.name || currentClass.code,
                className_ar: currentClass.name_ar || currentClass.name || currentClass.code,
                label: action.label_en || action.label || action.type,
                label_ar: action.label_ar || action.label || action.type,
                points: points >= 0 ? `+${points}` : points,
                notes: note,
                notes_ar: note
              },
              sendEmailNotification: true
            });
          }
        }
      }
    } catch (error) {
      logger.error('Error submitting behavior:', error);
    }
  }, [selectedClassId, selectedSubjectId, selectedDate, user?.uid, students, classes, sendNotifications, t, lang, loadStudents, triggerActivityRefresh]);

  const handleTogglePin = useCallback((studentId) => {
    // TODO: Implement pin/unpin in Firebase
    setStudents(prevStudents =>
      prevStudents.map(s =>
        s.id === studentId ? { ...s, isPinned: !s.isPinned } : s
      )
    );
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedStudent(null);
  }, []);

  const handleDownload = useCallback(() => {
    try {
      // Get current class and subject info for filename
      const currentClass = classes.find(c => (c.id || c.docId) === selectedClassId);
      const currentSubject = subjects.find(s => (s.id || s.docId) === selectedSubjectId);
      
      const className = currentClass?.name || currentClass?.code || 'Class';
      const subjectName = currentSubject?.name || currentSubject?.code || 'Subject';
      const dateStr = selectedDate || new Date().toISOString().split('T')[0];
      
      // Create CSV content
      const headers = [
        t('student_id') || 'Student ID',
        t('student') || 'Name',
        t('email') || 'Email',
        t('attendance') || 'Attendance',
        t('participation') || 'Participation',
        t('behavior') || 'Behavior',
        t('penalty') || 'Penalty',
        t('total_attendance') || 'Total Attendance'
      ];
      const csvContent = [
        headers.join(','),
        ...students.map(student => [
          `STU-${student.studentNumber || student.id?.slice(-4) || '0000'}`,
          `"${student.name || 'Unknown'}"`,
          student.email || '',
          student.attendance || 'absent_no_excuse',
          student.participation || 0,
          student.behavior || 0,
          student.penalty || 0,
          student.totalAttendance || 0
        ].join(','))
      ].join('\n');
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${className}_${subjectName}_${dateStr}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      logger.debug('CSV downloaded successfully');
    } catch (error) {
      logger.error('Error downloading CSV:', error);
      alert('Failed to download CSV. Please try again.');
    }
  }, [students, classes, subjects, selectedClassId, selectedSubjectId, selectedDate, t]);

  const handleRefresh = useCallback(() => {
    // Reload students data
    if (selectedClassId && selectedClassId !== 'all') {
      loadStudents(selectedClassId, selectedDate);
    }
    // Trigger activity refresh
    triggerActivityRefresh();
  }, [selectedClassId, selectedDate, loadStudents, triggerActivityRefresh]);

  const handleSort = useCallback((field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField, sortDirection]);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handleFilter = useCallback(() => {
    setShowFilterDialog(true);
  }, []);

  const applyFilters = useCallback(() => {
    setShowFilterDialog(false);
    // The filtering will be applied in useMemo
  }, []);

  const clearFilters = useCallback(() => {
    setAttendanceFilter('all');
    setParticipationMin('');
    setParticipationMax('');
    setPenaltyFilter('all');
    setShowFilterDialog(false);
  }, []);

  const handleStudentAction = useCallback((student) => {
    setSelectedStudentForAction(student);
  }, []);

  const handleCloseActionPanel = useCallback(() => {
    setSelectedStudentForAction(null);
  }, []);

  // Memoized filtered students for performance
  const filteredStudents = useMemo(() => {
    let filtered = students;

    // Apply search filter
    if (debouncedSearchQuery) {
      filtered = filtered.filter(student =>
        student.name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        student.email?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        student.studentId?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        student.studentNumber?.toString().includes(debouncedSearchQuery)
      );
    }

    // Apply attendance filter
    if (attendanceFilter !== 'all') {
      filtered = filtered.filter(student => student.attendance === attendanceFilter);
    }

    // Apply participation range filter
    if (participationMin !== '') {
      const min = parseFloat(participationMin);
      if (!isNaN(min)) {
        filtered = filtered.filter(student => student.participation >= min);
      }
    }
    if (participationMax !== '') {
      const max = parseFloat(participationMax);
      if (!isNaN(max)) {
        filtered = filtered.filter(student => student.participation <= max);
      }
    }

    // Apply penalty filter
    if (penaltyFilter === 'none') {
      filtered = filtered.filter(student => !student.penalty || student.penalty === 0);
    } else if (penaltyFilter === 'hasPenalty') {
      filtered = filtered.filter(student => student.penalty && student.penalty > 0);
    }

    // Sort students
    const sorted = [...filtered].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle nested values
      if (sortField === 'name') {
        aValue = aValue || '';
        bValue = bValue || '';
      }

      // Handle numeric values
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Handle string values
      aValue = aValue?.toString() || '';
      bValue = bValue?.toString() || '';

      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });

    return sorted;
  }, [students, debouncedSearchQuery, attendanceFilter, participationMin, participationMax, penaltyFilter, sortField, sortDirection]);

  // Calculate pagination
  const total = filteredStudents.length;
  const totalPages = Math.ceil(total / pageSize);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'var(--background-secondary, #f9fafb)'
      }}>
        <FancyLoading fullscreen />
      </div>
    );
  }

  if (!user && !authLoading) {
    return null;
  }

  if (initialLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'var(--background-secondary, #f9fafb)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #8b5cf6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: 'var(--text-muted, #6b7280)' }}>{t('loading_programs')}</p>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'var(--background-secondary, #f9fafb)'
      }}>
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '0.75rem',
          border: '1px solid #fee2e2',
          maxWidth: '500px'
        }}>
          <h3 style={{ color: 'var(--color-danger, #dc2626)', margin: '0 0 1rem 0' }}>{t('error_loading_page')}</h3>
          <p style={{ color: 'var(--text-muted, #6b7280)', margin: '0 0 1rem 0' }}>{error}</p>
          <button
            onClick={() => {
              setError(null);
              setInitialLoading(true);
              loadPrograms();
            }}
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--color-primary, #8b5cf6)',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer'
            }}
          >
            {t('retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="qr-scanner-container" dir={isRTL ? 'rtl' : 'ltr'} style={{
      minHeight: '100vh',
      background: 'var(--background-secondary, #f9fafb)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Top Bar with Filters */}
      <header style={{
        background: 'var(--panel, white)',
        borderBottom: '1px solid var(--border, #e5e7eb)',
        padding: isMobile ? '0.5rem 1rem' : '1rem 1.5rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          maxWidth: '1600px',
          margin: '0 auto',
          flexWrap: 'wrap'
        }}>
          {/*<div style={{*/}
          {/*  display: 'flex',*/}
          {/*  alignItems: 'center',*/}
          {/*  gap: '0.5rem',*/}
          {/*  color: '#111827',*/}
          {/*  fontWeight: 600*/}
          {/*}}>*/}
          {/*  <svg style={{ width: '1.25rem', height: '1.25rem', color: '#8b5cf6' }} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">*/}
          {/*    <rect x="3" y="3" width="7" height="9" />*/}
          {/*    <rect x="14" y="3" width="7" height="5" />*/}
          {/*    <rect x="14" y="12" width="7" height="9" />*/}
          {/*    <rect x="3" y="16" width="7" height="5" />*/}
          {/*  </svg>*/}
          {/*  <span>{t('qr_scanner')}</span>*/}
          {/*</div>*/}

          <div style={{ 
            display: 'flex', 
            gap: '0.75rem', 
            flex: 1, 
            alignItems: 'center', 
            flexWrap: 'wrap',
            flexDirection: 'column'
          }}>
            <div style={{ width: '100%', minWidth: '100%' }}>
              <Select
                size="small"
                searchable
                value={selectedProgramId}
                onChange={(e) => {
                  setSelectedProgramId(e.target.value);
                  setSelectedSubjectId('all');
                  setSelectedClassId('all');
                }}
                options={programOptions}
                style={{ width: '100%', minWidth: '100%' }}
                placeholder={gridLoading ? t('loading') || 'Loading...' : (t('all_programs') || 'All Programs')}
                disabled={gridLoading}
              />
            </div>

            <div style={{ width: '100%', minWidth: '100%' }}>
              <Select
                size="small"
                searchable
                value={selectedSubjectId}
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value);
                  setSelectedClassId('all');
                }}
                options={subjectOptions}
                style={{ width: '100%', minWidth: '100%' }}
                placeholder={gridLoading ? t('loading') || 'Loading...' : (t('all_subjects') || 'All Subjects')}
                disabled={gridLoading}
              />
            </div>

            <div style={{ width: '100%', minWidth: '100%' }}>
              <Select
                size="small"
                searchable
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                }}
                options={classOptions}
                style={{ width: '100%', minWidth: '100%' }}
                placeholder={t('all_classes')}
              />
            </div>
          </div>

          {/* Date picker and notification on same row */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            marginTop: '0.5rem',
            flexWrap: 'wrap'
          }}>
            <div style={{ width: '100%', maxWidth: '300px' }}>
              {!gridLoading && selectedClassId && selectedClassId !== 'all' && (
                <DatePicker
                  value={selectedDate}
                  onChange={(date) => setSelectedDate(date)}
                  format="yyyy-MM-dd"
                />
              )}
              {gridLoading && (
                <div style={{
                  height: '38px',
                  background: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#9ca3af',
                  fontSize: '0.875rem'
                }}>
                  {t('loading') || 'Loading...'}
                </div>
              )}
              {!gridLoading && (!selectedClassId || selectedClassId === 'all') && (
                <div style={{
                  height: '38px',
                  background: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#9ca3af',
                  fontSize: '0.875rem'
                }}>
                  {t('select_class_first') || 'Select class first'}
                </div>
              )}
            </div>
            
            <div 
              onClick={() => setSendNotifications(!sendNotifications)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.5rem 1rem',
                background: sendNotifications ? '#f0fdf4' : '#fef2f2',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                border: `1px solid ${sendNotifications ? 'var(--color-success-light, #bbf7d0)' : 'var(--color-danger-light, #fecaca)'}`,
                transition: 'all 0.2s',
                userSelect: 'none',
                whiteSpace: 'nowrap'
              }}
            >
              <div style={{
                width: '2.5rem',
                height: '1.25rem',
                background: sendNotifications ? '#10b981' : '#ef4444',
                borderRadius: '1rem',
                position: 'relative',
                transition: 'background 0.2s',
                flexShrink: 0
              }}>
                <div style={{
                  width: '1rem',
                  height: '1rem',
                  background: 'white',
                  borderRadius: '50%',
                  position: 'absolute',
                  top: '0.125rem',
                  left: sendNotifications ? (isRTL ? '0.125rem' : '1.375rem') : (isRTL ? '1.375rem' : '0.125rem'),
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: 600, 
                  color: sendNotifications ? '#166534' : '#991b1b',
                  lineHeight: 1
                }}>
                  {sendNotifications ? `${t('notifications')}: ${lang === 'ar' ? 'مفعلة' : 'ON'}` : `${t('notifications')}: ${lang === 'ar' ? 'معطلة' : 'OFF'}`}
                </span>
                <span style={{ fontSize: '0.625rem', color: sendNotifications ? '#15803d' : '#b91c1c', marginTop: '2px' }}>
                  {t('email_notification')} + {lang === 'ar' ? 'النظام' : 'System'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div style={{
        padding: isMobile ? '0.5rem' : '1.5rem',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: '1.5rem',
        maxWidth: '1600px',
        margin: '0 auto'
      }}>
        {/* Sidebar with Scanner */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          width: isMobile ? '100%' : '300px',
          flexShrink: 0
        }}>
          {showScanner && selectedClassId && (
            <QRScanner 
              onScan={handleScan} 
              classId={selectedClassId}
              onActivityUpdate={handleActivityUpdate}
              onDeleteActivity={handleDeleteActivity}
              selectedProgramId={selectedProgramId}
              selectedSubjectId={selectedSubjectId}
              selectedClassId={selectedClassId}
              selectedProgramName={(() => {
                const program = programs.find(p => p.id === selectedProgramId);
                logger.debug('Program lookup:', {
                  selectedProgramId,
                  totalPrograms: programs.length,
                  found: !!program,
                  programName: program?.name || 'NOT_FOUND'
                });
                return program?.name || '';
              })()}
              selectedSubjectName={(() => {
                const subject = subjects.find(s => s.id === selectedSubjectId);
                logger.debug('Subject lookup:', {
                  selectedSubjectId,
                  totalSubjects: subjects.length,
                  found: !!subject,
                  subjectName: subject?.name || 'NOT_FOUND'
                });
                return subject?.name || '';
              })()}
              selectedClassName={(() => {
                const cls = classes.find(c => c.id === selectedClassId);
                logger.debug('Class lookup:', {
                  selectedClassId,
                  totalClasses: classes.length,
                  found: !!cls,
                  className: cls?.name || 'NOT_FOUND'
                });
                return cls?.name || '';
              })()}
              loading={false}
              students={students}
            />
          )}
        </div>

        {/* Main Content */}
        <div style={{ width: isMobile ? '100%' : 'calc(100% - 300px)' }}>
          {initialLoading ? (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'var(--overlay, rgba(0, 0, 0, 0.5))',
              backdropFilter: 'blur(4px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FancyLoading fullscreen />
            </div>
          ) : loading ? (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FancyLoading fullscreen />
            </div>
          ) : !selectedClassId || selectedClassId === 'all' ? (
            <div style={{
              background: 'white',
              borderRadius: '0.75rem',
              border: '1px solid #e5e7eb',
              padding: '3rem',
              textAlign: 'center'
            }}>
              <p style={{ color: 'var(--text-muted, #6b7280)', margin: 0 }}>
                {t('select_filters_to_view_students')}
              </p>
            </div>
          ) : (
            <div style={{ width: '100%' }}>
              {/* Refresh Button */}
              {/* <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => loadStudents(selectedClassId, selectedDate)}
                  disabled={loading}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  {loading ? (
                    <>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid white',
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      {t('loading')}
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 4v6h-6"/>
                        <path d="M1 20v-6h6"/>
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                      </svg>
                      {t('refresh')}
                    </>
                  )}
                </button>
              </div> */}
              
              <StudentRoster
              students={paginatedStudents}
              onStudentSelect={handleStudentSelect}
              selectedStudentId={selectedStudent?.id}
              onTogglePin={handleTogglePin}
              onDownload={handleDownload}
              onFilter={handleFilter}
              onRefresh={handleRefresh}
              onStudentAction={handleStudentAction}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalStudents={total}
              selectedProgramId={selectedProgramId}
              selectedSubjectId={selectedSubjectId}
              selectedClassId={selectedClassId}
              selectedDate={selectedDate}
            />
            </div>
          )}
        </div>

        {/* Student Action Panel */}
        {selectedStudent && (
          <>
            {gridLoading && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FancyLoading fullscreen />
              </div>
            )}
            <StudentActionPanel
              student={selectedStudent}
              onClose={handleClosePanel}
              onBehaviorSubmit={handleBehaviorSubmit}
              onMarkAttendance={handleMarkAttendance}
              behaviorTypes={showFavoritesOnly ? BEHAVIOR_TYPES.filter(b => favoriteBehaviors.includes(b.id)) : BEHAVIOR_TYPES}
              participationTypes={showFavoritesOnly ? PARTICIPATION_TYPES.filter(p => favoriteBehaviors.includes(p.id)) : PARTICIPATION_TYPES}
              showFavoritesOnly={showFavoritesOnly}
              onToggleFavorites={() => setShowFavoritesOnly(!showFavoritesOnly)}
              favoriteBehaviors={favoriteBehaviors}
              onToggleFavorite={(behaviorId) => {
                setFavoriteBehaviors(prev => 
                  prev.includes(behaviorId) 
                    ? prev.filter(id => id !== behaviorId)
                    : [...prev, behaviorId]
                );
              }}
              sendNotifications={sendNotifications}
              onToggleNotifications={() => setSendNotifications(!sendNotifications)}
            />
          </>
        )}

        {/* Student Action Panel New */}
        {selectedStudentForAction && (
          <>
            <StudentActionPanelNew
              student={selectedStudentForAction}
              onClose={handleCloseActionPanel}
              onBehaviorSubmit={handleBehaviorSubmit}
              onParticipationSubmit={handleBehaviorSubmit}
              onPenaltySubmit={handleBehaviorSubmit}
              onMarkAttendance={handleMarkAttendance}
              options={[
                ...BEHAVIOR_TYPES.map(type => ({ ...type, category: 'behavior' })),
                ...PARTICIPATION_TYPES.map(type => ({ ...type, category: 'participation' })),
                ...PENALTY_TYPES.map(type => ({
                  id: type.id,
                  label_en: type.label_en,
                  label_ar: type.label_ar,
                  icon: type.icon,
                  color: type.color,
                  points: -type.points, // Make points negative for penalties
                  category: 'penalty'
                }))
              ]}
              showFavoritesOnly={showFavoritesOnly}
              onToggleFavorites={() => setShowFavoritesOnly(!showFavoritesOnly)}
              favoriteBehaviors={favoriteBehaviors}
              onToggleFavorite={(behaviorId) => {
                setFavoriteBehaviors(prev => 
                  prev.includes(behaviorId) 
                    ? prev.filter(id => id !== behaviorId)
                    : [...prev, behaviorId]
                );
              }}
              sendNotifications={sendNotifications}
              onToggleNotifications={() => setSendNotifications(!sendNotifications)}
              selectedDate={selectedDate}
            />
          </>
        )}

        {/* Filter Dialog */}
        {showFilterDialog && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'var(--overlay, rgba(0, 0, 0, 0.5))',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              background: 'var(--panel, white)',
              borderRadius: '0.75rem',
              padding: '2rem',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '80vh',
              overflow: 'auto'
            }}>
              <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--text, #111827)', fontSize: '1.25rem' }}>
                {t('filter_students')}
              </h3>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-secondary, #374151)' }}>
                  {t('attendance_status')}
                </label>
                <select
                  value={attendanceFilter}
                  onChange={(e) => setAttendanceFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid var(--border, #d1d5db)',
                    background: 'var(--input-bg, white)',
                    color: 'var(--text, #111827)',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="all">{t('all_status')}</option>
                  <option value="present">{lang === 'ar' ? 'حاضر' : 'Present'}</option>
                  <option value="absent_no_excuse">{lang === 'ar' ? 'غائب (بدون عذر)' : 'Absent (No Excuse)'}</option>
                  <option value="absent_with_excuse">{lang === 'ar' ? 'غائب (بعذر)' : 'Absent (Excused)'}</option>
                  <option value="late">{lang === 'ar' ? 'متأخر' : 'Late'}</option>
                  <option value="excused_leave">{lang === 'ar' ? 'إجازة' : 'Excused Leave'}</option>
                  <option value="human_case">{lang === 'ar' ? 'حالة إنسانية' : 'Human Case'}</option>
                </select>
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#374151' }}>
                  {t('participation_range')}
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="number"
                    placeholder={t('min')}
                    value={participationMin}
                    onChange={(e) => setParticipationMin(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: '1px solid var(--border, #d1d5db)',
                    background: 'var(--input-bg, white)',
                    color: 'var(--text, #111827)',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  />
                  <span style={{ color: 'var(--text-muted, #6b7280)' }}>{t('to')}</span>
                  <input
                    type="number"
                    placeholder={t('max')}
                    value={participationMax}
                    onChange={(e) => setParticipationMax(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: '1px solid var(--border, #d1d5db)',
                    background: 'var(--input-bg, white)',
                    color: 'var(--text, #111827)',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#374151' }}>
                  {t('penalty_status')}
                </label>
                <select
                  value={penaltyFilter}
                  onChange={(e) => setPenaltyFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid var(--border, #d1d5db)',
                    background: 'var(--input-bg, white)',
                    color: 'var(--text, #111827)',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="all">{t('all_students')}</option>
                  <option value="none">{t('no_penalties')}</option>
                  <option value="hasPenalty">{t('has_penalties')}</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={clearFilters}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid var(--border, #d1d5db)',
                    background: 'var(--input-bg, white)',
                    color: 'var(--text-muted, #6b7280)',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  {t('clear')}
                </button>
                <button
                  onClick={() => setShowFilterDialog(false)}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid var(--border, #d1d5db)',
                    background: 'var(--input-bg, white)',
                    color: 'var(--text-muted, #6b7280)',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={applyFilters}
                  style={{
                    padding: '0.5rem 1rem',
                    border: 'none',
                    background: 'var(--color-primary, #8b5cf6)',
                    color: 'white',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  {t('apply_filters')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Activity Confirmation Modal */}
        {deleteActivityModalOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <Card style={{ maxWidth: '400px', margin: '1rem' }}>
              <CardBody>
                <h3>{t('delete_activity_title', { type: activityToDelete?.type === 'attendance' ? t('attendance') : t('penalties') })}</h3>
                <p>{t('delete_activity_msg', { studentName: activityToDelete?.studentName || t('this_student') })}</p>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <Button variant="outline" onClick={() => setDeleteActivityModalOpen(false)}>
                    {t('cancel') || 'Cancel'}
                  </Button>
                  <Button variant="primary" onClick={confirmDeleteActivity} loading={deleteActivityLoading} style={{ backgroundColor: '#dc2626' }}>
                    {t('delete') || 'Delete'}
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorQRScannerPage;
