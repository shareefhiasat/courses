import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { useNavigate } from 'react-router-dom';
import { getUsers, getClasses, getEnrollments } from '../firebase/firestore';
import { getPrograms, getSubjects } from '../firebase/programs';
import { markAttendance, getAttendanceByClass, getAttendanceByStudent } from '../firebase/attendance';
import { createPenalty, getPenalties } from '../firebase/penalties';
import { sendStudentNotification } from '../utils/notificationService';
import { BEHAVIOR_TYPES, PARTICIPATION_TYPES } from '../constants/behaviorParticipation';
import { Select, DatePicker, Button, Loading } from '../components/ui';
import { FancyLoading } from '../components/ui/FancyLoading/FancyLoading';
import { BookOpen, FileText, Users, Filter, Star } from 'lucide-react';
import QRScanner from '../components/qr-scanner/QRScanner';
import StudentRoster from '../components/qr-scanner/StudentRoster';
import StudentActionPanel from '../components/qr-scanner/StudentActionPanel';
import StudentActionPanelNew from '../components/qr-scanner/StudentActionPanelNew';
import '../components/qr-scanner/ui/qr-scanner-ui.css';
import './InstructorQRScannerPage.module.css';
import eventBus, { EVENTS } from '../utils/eventBus';

const InstructorQRScannerPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLang();
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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Debug: Track selectedStudentForAction changes
  React.useEffect(() => {
    console.log('selectedStudentForAction changed to:', selectedStudentForAction);
  }, [selectedStudentForAction]);

  // Sidebar state
  const [activityRefresh, setActivityRefresh] = useState(null);

  // Handle activity refresh from QRScanner
  const handleActivityUpdate = useCallback((refreshFunction) => {
    setActivityRefresh(() => refreshFunction);
  }, []);

  // Trigger activity refresh when actions are performed
  const triggerActivityRefresh = () => {
    if (activityRefresh) {
      activityRefresh();
    }
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchQuery, setSearchQuery] = useState('');

  // Memoized options for dropdowns - following DashboardPage pattern
  const programOptions = useMemo(() => {
    const opts = [
      { value: 'all', label: 'All Programs', icon: <Filter size={16} color="#374151" /> }
    ];
    const validPrograms = programs
      .filter(prog => prog.docId || prog.id)
      .map(prog => {
        const value = prog.docId || prog.id;
        const label = prog.name_en || prog.name || prog.code || value;
        return { value, label, icon: <BookOpen size={16} color="#374151" /> };
      });
    return [...opts, ...validPrograms];
  }, [programs]);

  const subjectOptions = useMemo(() => {
    const opts = [
      { value: 'all', label: 'All Subjects', icon: <Filter size={16} color="#374151" /> }
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
        const label = sub.name_en || sub.name || sub.code || value;
        return { value, label, icon: <FileText size={16} color="#374151" /> };
      });
    return [...opts, ...validSubjects];
  }, [subjects, selectedProgramId]);

  const classOptions = useMemo(() => {
    const opts = [
      { value: 'all', label: 'All Classes', icon: <Filter size={16} color="#374151" /> }
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
        const name = cls.name || cls.name_ar || 'Unnamed Class';
        const label = `${name}${cls.code ? ` (${cls.code})` : ''}`;
        return { value, label, icon: <Users size={16} color="#374151" /> };
      });
    return [...opts, ...validClasses];
  }, [classes, selectedSubjectId]);

  // Load programs on mount
  useEffect(() => {
    console.log('[QR Scanner] Initializing page...');
    loadPrograms();
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
    console.log('[QR Scanner] useEffect for selectedSubjectId:', {
      selectedSubjectId,
      classesLength: classes.length,
      shouldLoad: selectedSubjectId && selectedSubjectId !== 'all'
    });
    
    if (selectedSubjectId && selectedSubjectId !== 'all') {
      loadClasses(selectedSubjectId);
    } else {
      console.log('[QR Scanner] Clearing classes (subject is all or empty)');
      setClasses([]);
      setSelectedClassId('all');
    }
  }, [selectedSubjectId]);

  // Load students when class or date changes
  useEffect(() => {
    console.log('[QR Scanner] useEffect for selectedClassId/date:', {
      selectedClassId,
      selectedDate,
      studentsLength: students.length,
      shouldLoad: selectedClassId && selectedClassId !== 'all'
    });
    
    if (selectedClassId && selectedClassId !== 'all') {
      loadStudents(selectedClassId, selectedDate);
    } else {
      console.log('[QR Scanner] Clearing students (class is all or empty)');
      setStudents([]);
    }
  }, [selectedClassId, selectedDate]);

  // Load favorite behaviors when student changes
  useEffect(() => {
    console.log('[QR Scanner] useEffect for selectedStudent:', {
      selectedStudent,
      studentId: selectedStudent?.id
    });
    
    if (selectedStudent?.id) {
      // Load student's existing favorite behaviors
      const studentFavorites = selectedStudent.favoriteBehaviors || [];
      setFavoriteBehaviors(studentFavorites);
      console.log('[QR Scanner] Loaded favorite behaviors for student:', studentFavorites);
    } else {
      // Clear favorites when no student selected
      setFavoriteBehaviors([]);
      console.log('[QR Scanner] Cleared favorite behaviors (no student selected)');
    }
  }, [selectedStudent?.id]);

  // Listen for real-time attendance updates
  useEffect(() => {
    const unsubscribe = eventBus.on(EVENTS.ATTENDANCE_MARKED, (data) => {
      console.log('[QR Scanner] Real-time attendance update received:', data);
      
      // If the update is for the current class, refresh students
      if (data.classId === selectedClassId) {
        console.log('[QR Scanner] Refreshing students due to attendance update');
        loadStudents(selectedClassId, selectedDate);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [selectedClassId, selectedDate]);

  const loadPrograms = async () => {
    try {
      const programsResponse = await getPrograms();
      let programsData = programsResponse.success ? programsResponse.data : [];

      if (programsData.length === 0) {
        console.warn('[QR Scanner] No programs found in database');
      }

      setPrograms(programsData);
      setInitialLoading(false);
    } catch (error) {
      console.error('[QR Scanner] Error loading programs:', error);
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
      console.error('[QR Scanner] Error loading subjects:', error);
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
      console.error('[QR Scanner] Error loading classes:', error);
      setClasses([]);
      setError('Failed to load classes: ' + error.message);
    }
  };

  const loadStudents = async (classId, date) => {
    try {
      console.log('[QR Scanner] Loading students for class:', classId, 'date:', date);
      setLoading(true);

      // Get enrollments for this class
      const enrollmentsResponse = await getEnrollments();
      const allEnrollments = enrollmentsResponse.success ? enrollmentsResponse.data : [];
      console.log('[QR Scanner] All enrollments:', allEnrollments);
      
      let classEnrollments = allEnrollments.filter(e => e.classId === classId);
      console.log('[QR Scanner] Class enrollments:', classEnrollments);
      setEnrollments(classEnrollments);

      // Get student data
      const usersResponse = await getUsers();
      const allUsers = usersResponse.success ? usersResponse.data : [];
      console.log('[QR Scanner] All users:', allUsers);
      
      let studentIds = classEnrollments.map(e => e.userId);
      console.log('[QR Scanner] Student IDs from enrollments:', studentIds);
      
      let studentUsers = allUsers.filter(u => studentIds.includes(u.id) || studentIds.includes(u.docId));
      console.log('[QR Scanner] Found student users:', studentUsers);

      // Always use real data - remove fallback
      if (studentUsers.length === 0) {
        console.warn('[QR Scanner] No students found for this class');
      }

      // Get attendance for selected date
      const dateObj = new Date(date);
      const dateStr = dateObj.toISOString().split('T')[0];
      const attendanceResponse = await getAttendanceByClass(classId, dateStr);
      const attendance = attendanceResponse.success ? attendanceResponse.data : [];
      console.log('[QR Scanner] Attendance records:', attendance);
      setAttendanceRecords(attendance);

      // Get penalties for these students
      const penaltiesResponse = await getPenalties();
      const allPenalties = penaltiesResponse.success ? penaltiesResponse.data : [];
      console.log('[QR Scanner] All penalties data:', allPenalties);
      console.log('[QR Scanner] Student IDs from enrollments:', studentIds);
      const studentPenalties = allPenalties.filter(p => studentIds.includes(p.studentId));
      console.log('[QR Scanner] Student penalties:', studentPenalties);
      setPenaltyRecords(studentPenalties);

      // Calculate totals and format data
      console.log('[QR Scanner] Processing student data for', studentUsers.length, 'students');
      
      const studentsWithData = await Promise.all(studentUsers.map(async (student) => {
        console.log('[QR Scanner] Processing student:', student.displayName || student.name || student.email, 'ID:', student.id);
        console.log('[QR Scanner] Full student object:', student);
        console.log('[QR Scanner] Student fields:', Object.keys(student));
        
        // Get attendance status for today - use docId for student ID matching
        const studentId = student.id || student.docId;
        const todayAttendance = attendance.find(a => a.studentId === studentId);
        
        console.log('[QR Scanner] Looking for attendance for studentId:', studentId, 'found:', todayAttendance?.status);

        // Fetch all attendance records for this student to calculate participation and behavior
        const attendanceResponse = await getAttendanceByStudent(studentId);
        const studentAttendanceRecords = attendanceResponse.success ? attendanceResponse.data : [];
        console.log('[QR Scanner] Student attendance records:', studentAttendanceRecords.length, 'for', student.displayName || student.name);

        // Calculate totals from attendance records
        let participationTotal = 0;
        let behaviorTotal = 0;
        let totalAttendance = 0;
        
        studentAttendanceRecords.forEach(record => {
          if (record.delta) {
            if (record.delta > 0) {
              participationTotal += record.delta;
            } else if (record.delta < 0) {
              behaviorTotal += record.delta; // negative values for penalties
            }
          }
          
          // Count present and late attendance for total attendance
          if (record.status === 'present' || record.status === 'late') {
            totalAttendance++;
          }
        });

        console.log('[QR Scanner] Calculated participation:', participationTotal, 'behavior:', behaviorTotal, 'for', student.displayName || student.name);

        // Calculate total penalty (all time) - use docId for matching
        const penalties = studentPenalties.filter(p => p.studentId === studentId);
        const penaltyTotal = penalties.reduce((sum, p) => {
          const points = p.points;
          // Only add if points is a valid number (not null, undefined, empty string, or NaN)
          if (points !== null && points !== undefined && points !== '' && !isNaN(points)) {
            return sum + Number(points);
          }
          return sum;
        }, 0);
        console.log('[QR Scanner] Student penalties:', penalties.length, 'records, total:', penaltyTotal, 'for', student.displayName || student.name, 'using studentId:', studentId);
        console.log('[QR Scanner] Penalty details:', penalties.map(p => ({ points: p.points, comment: p.comment, date: p.date })));

        const studentData = {
          id: studentId,
          docId: student.docId,
          studentId: student.studentId || studentId,
          studentNumber: student.studentNumber,
          name: student.displayName || student.realName || student.name || student.email,
          email: student.email,
          attendance: todayAttendance?.status || 'absent_no_excuse',
          participation: participationTotal,
          behavior: behaviorTotal,
          penalty: penaltyTotal,
          totalAttendance: totalAttendance,
          isPinned: student.isPinned || false,
          behaviorHistory: student.behaviorHistory || [],
          participationHistory: student.participationHistory || [],
          penaltyHistory: penalties || []
        };
        
        console.log('[QR Scanner] Final student data:', {
          name: studentData.name,
          id: studentData.id,
          docId: studentData.docId,
          studentId: studentData.studentId,
          studentNumber: studentData.studentNumber,
          participation: studentData.participation,
          behavior: studentData.behavior,
          penalty: studentData.penalty,
          totalAttendance: studentData.totalAttendance
        });
        
        return studentData;
      }));

      console.log('[QR Scanner] Students loaded:', studentsWithData);
      setStudents(studentsWithData);
    } catch (error) {
      console.error('[QR Scanner] Error loading students:', error);
      // Use fallback data even on error
      const fallbackStudents = [
        { id: 'student1', studentId: 'student1', name: 'John Smith', email: 'john@example.com', attendance: 'present', participation: 10, behavior: 5, penalty: 0, totalAttendance: 15 },
        { id: 'student2', studentId: 'student2', name: 'Jane Doe', email: 'jane@example.com', attendance: 'present', participation: 8, behavior: 7, penalty: 0, totalAttendance: 12 }
      ];
      setStudents(fallbackStudents);
      setError('Using sample data - Firebase connection issue: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = (studentId) => {
    const student = students.find(s => s.studentId === studentId || s.id === studentId);
    if (student) {
      setSelectedStudent(student);
      // Auto-mark as present
      handleMarkAttendance(student.id, 'present');
    }
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
  };

  const handleMarkAttendance = async (studentId, status, notes = '') => {
    try {
      // Ensure selectedDate is a string in yyyy-MM-dd format
      const dateStr = typeof selectedDate === 'string' ? selectedDate : selectedDate.toISOString().split('T')[0];
      
      await markAttendance({
        classId: selectedClassId,
        studentId,
        date: dateStr,
        status,
        notes,
        markedBy: user.uid
      });

      // Reload students to reflect changes
      await loadStudents(selectedClassId, selectedDate);
      
      // Small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Emit real-time event for activity updates
      eventBus.emit(EVENTS.ATTENDANCE_MARKED, {
        studentId,
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
            title: 'Attendance Marked',
            message: `Your attendance for ${currentClass.name || currentClass.code} has been marked as ${label.en}.`,
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
      console.error('Error marking attendance:', error);
    }
  };

  const handleBehaviorSubmit = async (studentId, actions, note, pointsOverride = {}) => {
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

      // Save to Firebase
      for (const action of actions) {
        const points = pointsOverride[action.type] !== undefined
          ? pointsOverride[action.type]
          : action.points;

        if (points < 0) {
          // Add penalty
          await createPenalty({
            studentId,
            classId: selectedClassId,
            subjectId: selectedSubjectId,
            type: action.type,
            points: Math.abs(points),
            reason: note,
            createdBy: user.uid
          });
        } else {
          // Add participation/behavior through user update
          // This would need a specific API endpoint
          // For now, we'll handle it in the reload
        }
      }

      // Reload students
      await loadStudents(selectedClassId, selectedDate);

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
      setSelectedStudent(updatedStudent);
      
      // Trigger activity refresh to update recent activity
      triggerActivityRefresh();

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
              title = 'Penalty Assigned';
            } else if (PARTICIPATION_TYPES.some(pt => pt.id === action.type)) {
              type = 'participation';
              templateId = 'participation_added_default';
              title = 'Participation Added';
            } else {
              type = 'behavior';
              templateId = 'behavior_logged_default';
              title = 'Behavior Logged';
            }

            await sendStudentNotification({
              userId: student.id,
              email: student.email,
              title,
              message: `A new ${type} action has been logged for you in ${currentClass.name || currentClass.code}: ${action.label_en || action.label || action.type}`,
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
      console.error('Error submitting behavior:', error);
    }
  };

  const handleTogglePin = async (studentId) => {
    // TODO: Implement pin/unpin in Firebase
    setStudents(prevStudents =>
      prevStudents.map(s =>
        s.id === studentId ? { ...s, isPinned: !s.isPinned } : s
      )
    );
  };

  const handleClosePanel = () => {
    setSelectedStudent(null);
  };

  const handleDownload = () => {
    try {
      // Get current class and subject info for filename
      const currentClass = classes.find(c => (c.id || c.docId) === selectedClassId);
      const currentSubject = subjects.find(s => (s.id || s.docId) === selectedSubjectId);
      
      const className = currentClass?.name || currentClass?.code || 'Class';
      const subjectName = currentSubject?.name || currentSubject?.code || 'Subject';
      const dateStr = selectedDate || new Date().toISOString().split('T')[0];
      
      // Create CSV content
      const headers = ['Student ID', 'Name', 'Email', 'Attendance', 'Participation', 'Behavior', 'Penalty', 'Total Attendance'];
      const csvContent = [
        headers.join(','),
        ...displayedStudents.map(student => [
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
      
      console.log('CSV downloaded successfully');
    } catch (error) {
      console.error('Error downloading CSV:', error);
      alert('Failed to download CSV. Please try again.');
    }
  };

  const handleRefresh = () => {
    // Reload students data
    if (selectedClassId && selectedClassId !== 'all') {
      loadStudents(selectedClassId, selectedDate);
    }
    // Trigger activity refresh
    triggerActivityRefresh();
  };

  const handleFilter = () => {
    setShowFilterDialog(true);
  };

  const applyFilters = () => {
    setShowFilterDialog(false);
    // The filtering will be applied in getFilteredAndSortedStudents
  };

  const clearFilters = () => {
    setAttendanceFilter('all');
    setParticipationMin('');
    setParticipationMax('');
    setPenaltyFilter('all');
    setShowFilterDialog(false);
  };

  const handleStudentAction = (student) => {
    console.log('Lightning button clicked!', student);
    console.log('Previous selectedStudentForAction:', selectedStudentForAction);
    setSelectedStudentForAction(student);
    console.log('After setSelectedStudentForAction, should be:', student);
  };

  const handleCloseActionPanel = () => {
    console.log('Closing action panel');
    setSelectedStudentForAction(null);
  };

  // Filter and sort students
  const getFilteredAndSortedStudents = () => {
    let filtered = [...students];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.studentId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Attendance filter
    if (attendanceFilter !== 'all') {
      filtered = filtered.filter(s => s.attendance === attendanceFilter);
    }

    // Participation range filter
    if (participationMin !== '') {
      filtered = filtered.filter(s => s.participation >= parseInt(participationMin));
    }
    if (participationMax !== '') {
      filtered = filtered.filter(s => s.participation <= parseInt(participationMax));
    }

    // Penalty filter
    if (penaltyFilter === 'none') {
      filtered = filtered.filter(s => s.penalty === 0);
    } else if (penaltyFilter === 'hasPenalty') {
      filtered = filtered.filter(s => s.penalty > 0);
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    // Pagination
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;

    return {
      students: filtered.slice(start, end),
      total: filtered.length
    };
  };

  const { students: displayedStudents, total } = getFilteredAndSortedStudents();
  const totalPages = Math.ceil(total / pageSize);

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f9fafb'
      }}>
        <FancyLoading />
      </div>
    );
  }

  // Redirect to login if session expired (no user)
  if (!user) {
    console.log('[QR Scanner] No user found - redirecting to login');
    navigate('/login');
    return null;
  }

  if (initialLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f9fafb'
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
          <p style={{ color: '#6b7280' }}>Loading programs...</p>
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
        background: '#f9fafb'
      }}>
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '0.75rem',
          border: '1px solid #fee2e2',
          maxWidth: '500px'
        }}>
          <h3 style={{ color: '#dc2626', margin: '0 0 1rem 0' }}>Error Loading Page</h3>
          <p style={{ color: '#6b7280', margin: '0 0 1rem 0' }}>{error}</p>
          <button
            onClick={() => {
              setError(null);
              setInitialLoading(true);
              loadPrograms();
            }}
            style={{
              padding: '0.5rem 1rem',
              background: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="qr-scanner-container" style={{
      minHeight: '100vh',
      background: '#f9fafb',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Top Bar with Filters */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '1rem 1.5rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          maxWidth: '1600px',
          margin: '0 auto',
          flexWrap: 'wrap'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#111827',
            fontWeight: 600
          }}>
            <svg style={{ width: '1.25rem', height: '1.25rem', color: '#8b5cf6' }} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="9" />
              <rect x="14" y="3" width="7" height="5" />
              <rect x="14" y="12" width="7" height="9" />
              <rect x="3" y="16" width="7" height="5" />
            </svg>
            <span>{t('qr_scanner')}</span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flex: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ minWidth: '180px' }}>
              <Select
                size="small"
                searchable
                value={selectedProgramId}
                onChange={(e) => {
                  console.log('[QR Scanner] Program dropdown changed:', {
                    oldValue: selectedProgramId,
                    newValue: e.target.value,
                    subjectsBefore: subjects.length,
                    classesBefore: classes.length
                  });
                  setSelectedProgramId(e.target.value);
                  setSelectedSubjectId('all');
                  setSelectedClassId('all');
                  console.log('[QR Scanner] After program change - resetting subject and class to all');
                }}
                options={[
                  { value: 'all', label: t('all_programs'), icon: <Filter size={16} color="#374151" /> },
                  ...programs.map(p => ({
                    value: p.docId || p.id,
                    label: p.name_en || p.name_ar || p.code || p.docId,
                    icon: <BookOpen size={16} color="#374151" />
                  }))
                ]}
                style={{ minWidth: 180 }}
                placeholder={t('all_programs')}
              />
            </div>

            <div style={{ minWidth: '180px' }}>
              <Select
                size="small"
                searchable
                value={selectedSubjectId}
                onChange={(e) => {
                  console.log('[QR Scanner] Subject dropdown changed:', {
                    oldValue: selectedSubjectId,
                    newValue: e.target.value,
                    currentProgramId: selectedProgramId,
                    subjectsAvailable: subjects.length,
                    classesBefore: classes.length
                  });
                  setSelectedSubjectId(e.target.value);
                  setSelectedClassId('all');
                  console.log('[QR Scanner] After subject change - resetting class to all');
                }}
                onOpen={() => {
                  console.log('[QR Scanner] Subject dropdown opened:', {
                    selectedProgramId,
                    subjectsCount: subjects.length,
                    filteredSubjects: subjects.filter(s => selectedProgramId === 'all' || s.programId === selectedProgramId).length,
                    currentSelectedSubject: selectedSubjectId
                  });
                }}
                options={[
                  { value: 'all', label: t('all_subjects'), icon: <Filter size={16} color="#374151" /> },
                  ...subjects
                    .filter(s => {
                      const shouldInclude = selectedProgramId === 'all' || s.programId === selectedProgramId;
                      if (!shouldInclude) {
                        console.log('[QR Scanner] Subject filtered out:', {
                          subjectId: s.docId || s.id,
                          subjectName: s.name_en || s.name_ar,
                          subjectProgramId: s.programId,
                          selectedProgramId
                        });
                      }
                      return shouldInclude;
                    })
                    .map(s => {
                      const mapped = {
                        value: s.docId || s.id,
                        label: `${s.code || ''} - ${s.name_en || s.name_ar || s.docId}`.trim(),
                        icon: <FileText size={16} color="#374151" />
                      };
                      return mapped;
                    })
                ]}
                style={{ minWidth: 180 }}
                placeholder={t('all_subjects')}
              />
            </div>

            <div style={{ minWidth: '180px' }}>
              <Select
                size="small"
                searchable
                value={selectedClassId}
                onChange={(e) => {
                  console.log('[QR Scanner] Class dropdown changed:', {
                    oldValue: selectedClassId,
                    newValue: e.target.value,
                    currentProgramId: selectedProgramId,
                    currentSubjectId: selectedSubjectId,
                    classesAvailable: classes.length
                  });
                  setSelectedClassId(e.target.value);
                }}
                onOpen={() => {
                  console.log('[QR Scanner] Class dropdown opened:', {
                    selectedProgramId,
                    selectedSubjectId,
                    classesCount: classes.length,
                    currentSelectedClass: selectedClassId
                  });
                }}
                options={[
                  { value: 'all', label: t('all_classes'), icon: <Filter size={16} color="#374151" /> },
                  ...classes
                    .filter(c => {
                      let shouldInclude = true;
                      let reason = '';
                      
                      if (selectedProgramId !== 'all') {
                        const subject = subjects.find(s => (s.docId || s.id) === c.subjectId);
                        if (!subject || subject.programId !== selectedProgramId) {
                          shouldInclude = false;
                          reason = `subject ${c.subjectId} not in program ${selectedProgramId}`;
                        }
                      }
                      
                      if (shouldInclude && selectedSubjectId !== 'all') {
                        if (c.subjectId !== selectedSubjectId) {
                          shouldInclude = false;
                          reason = `class subject ${c.subjectId} != selected subject ${selectedSubjectId}`;
                        }
                      }
                      
                      // Filter for instructors
                      if (shouldInclude && user && !user.isAdmin && !user.isSuperAdmin && user.isInstructor) {
                        if (!(c.instructorId === user.uid || c.ownerEmail === user.email || c.instructor === user.email)) {
                          shouldInclude = false;
                          reason = 'instructor filter';
                        }
                      }
                      
                      if (!shouldInclude) {
                        console.log('[QR Scanner] Class filtered out:', {
                          classId: c.id || c.docId,
                          className: c.name || c.code,
                          subjectId: c.subjectId,
                          reason
                        });
                      }
                      
                      return shouldInclude;
                    })
                    .map(c => {
                      const mapped = {
                        value: c.id || c.docId,
                        label: `${c.name || c.code || c.id}${c.term ? ` (${c.term})` : ''}`,
                        icon: <Users size={16} color="#374151" />
                      };
                      return mapped;
                    })
                ]}
                style={{ minWidth: 180 }}
                placeholder={t('all_classes') || 'All Classes'}
              />
            </div>

            <div style={{ minWidth: '150px' }}>
              <DatePicker
                value={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                format="yyyy-MM-dd"
              />
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: '#f3f4f6',
            borderRadius: '0.5rem'
          }}>
            <div style={{
              width: '0.5rem',
              height: '0.5rem',
              background: '#10b981',
              borderRadius: '9999px'
            }} />
            <span style={{
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              fontWeight: 500
            }}>
              {new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
              })}
            </span>
            <span style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              marginLeft: '0.5rem',
              padding: '0.25rem 0.5rem',
              background: 'white',
              borderRadius: '0.25rem'
            }}>
              {t('live') || 'LIVE'}
            </span>
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
              border: `1px solid ${sendNotifications ? '#bbf7d0' : '#fecaca'}`,
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
                left: sendNotifications ? '1.375rem' : '0.125rem',
                transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
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
                {sendNotifications ? t('notifications') + ': ON' : t('notifications') + ': OFF'}
              </span>
              <span style={{ fontSize: '0.625rem', color: sendNotifications ? '#15803d' : '#b91c1c', marginTop: '2px' }}>
                {t('email_notification')} + System
              </span>
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
            />
          )}
        </div>

        {/* Main Content */}
        <div>
          {initialLoading ? (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FancyLoading />
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
              <FancyLoading />
            </div>
          ) : !selectedClassId || selectedClassId === 'all' ? (
            <div style={{
              background: 'white',
              borderRadius: '0.75rem',
              border: '1px solid #e5e7eb',
              padding: '3rem',
              textAlign: 'center'
            }}>
              <p style={{ color: '#6b7280', margin: 0 }}>
                Please select a program, subject, and class to view students
              </p>
            </div>
          ) : (
            <div>
              {/* Refresh Button */}
              <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
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
              </div>
              
              <StudentRoster
              students={displayedStudents}
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
              onSort={(field) => {
                if (sortField === field) {
                  setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortField(field);
                  setSortDirection('asc');
                }
              }}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
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
                <FancyLoading />
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
            {console.log('Rendering StudentActionPanelNew for:', selectedStudentForAction)}
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
                // Comprehensive penalty options
                { id: 'penalty_late', label_en: 'Late', icon: 'Clock', color: '#dc2626', points: -5, category: 'penalty' },
                { id: 'penalty_absent', label_en: 'Absent', icon: 'XCircle', color: '#dc2626', points: -10, category: 'penalty' },
                { id: 'penalty_disruptive', label_en: 'Disruptive Behavior', icon: 'AlertTriangle', color: '#dc2626', points: -3, category: 'penalty' },
                { id: 'penalty_phone', label_en: 'Phone Usage', icon: 'Smartphone', color: '#dc2626', points: -2, category: 'penalty' },
                { id: 'penalty_homework', label_en: 'Missing Homework', icon: 'FileText', color: '#dc2626', points: -4, category: 'penalty' },
                { id: 'penalty_uniform', label_en: 'Uniform Violation', icon: 'X', color: '#dc2626', points: -1, category: 'penalty' },
                { id: 'penalty_talking', label_en: 'Excessive Talking', icon: 'MessageSquare', color: '#dc2626', points: -2, category: 'penalty' },
                { id: 'penalty_cheating', label_en: 'Cheating', icon: 'XCircle', color: '#dc2626', points: -15, category: 'penalty' },
                { id: 'penalty_sleeping', label_en: 'Sleeping in Class', icon: 'Bed', color: '#dc2626', points: -3, category: 'penalty' },
                { id: 'penalty_respect', label_en: 'Disrespectful', icon: 'AlertTriangle', color: '#dc2626', points: -5, category: 'penalty' },
                { id: 'penalty_materials', label_en: 'No Materials', icon: 'FileText', color: '#dc2626', points: -2, category: 'penalty' },
                { id: 'penalty_eating', label_en: 'Eating/Drinking', icon: 'MoreHorizontal', color: '#dc2626', points: -1, category: 'penalty' }
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
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '0.75rem',
              padding: '2rem',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '80vh',
              overflow: 'auto'
            }}>
              <h3 style={{ margin: '0 0 1.5rem 0', color: '#111827', fontSize: '1.25rem' }}>
                Filter Students
              </h3>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#374151' }}>
                  Attendance Status
                </label>
                <select
                  value={attendanceFilter}
                  onChange={(e) => setAttendanceFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="present">Present</option>
                  <option value="absent_no_excuse">Absent (No Excuse)</option>
                  <option value="absent_with_excuse">Absent (Excused)</option>
                  <option value="late">Late</option>
                  <option value="excused_leave">Excused Leave</option>
                  <option value="human_case">Human Case</option>
                </select>
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#374151' }}>
                  Participation Range
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="number"
                    placeholder="Min"
                    value={participationMin}
                    onChange={(e) => setParticipationMin(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  />
                  <span style={{ color: '#6b7280' }}>to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={participationMax}
                    onChange={(e) => setParticipationMax(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#374151' }}>
                  Penalty Status
                </label>
                <select
                  value={penaltyFilter}
                  onChange={(e) => setPenaltyFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="all">All Students</option>
                  <option value="none">No Penalties</option>
                  <option value="hasPenalty">Has Penalties</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={clearFilters}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #d1d5db',
                    background: 'white',
                    color: '#6b7280',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  Clear
                </button>
                <button
                  onClick={() => setShowFilterDialog(false)}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #d1d5db',
                    background: 'white',
                    color: '#6b7280',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={applyFilters}
                  style={{
                    padding: '0.5rem 1rem',
                    border: 'none',
                    background: '#8b5cf6',
                    color: 'white',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorQRScannerPage;
