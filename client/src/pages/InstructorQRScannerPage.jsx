import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { useNavigate } from 'react-router-dom';
import { getUsers, getClasses, getEnrollments } from '../firebase/firestore';
import { getPrograms, getSubjects } from '../firebase/programs';
import { markAttendance, getAttendanceByClass, getAttendanceByStudent } from '../firebase/attendance';
import { createPenalty, getPenalties } from '../firebase/penalties';
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
  const [selectedDate, setSelectedDate] = useState(new Date());

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

  // Debug: Track selectedStudentForAction changes
  React.useEffect(() => {
    console.log('selectedStudentForAction changed to:', selectedStudentForAction);
  }, [selectedStudentForAction]);

  // Sidebar state
  const [showScanner, setShowScanner] = useState(true);

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
    console.log('[QR Scanner] useEffect for selectedProgramId:', {
      selectedProgramId,
      subjectsLength: subjects.length,
      shouldLoad: selectedProgramId && selectedProgramId !== 'all'
    });
    
    if (selectedProgramId && selectedProgramId !== 'all') {
      setGridLoading(true);
      loadSubjects(selectedProgramId);
    } else {
      console.log('[QR Scanner] Loading all subjects (program is all or empty)');
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
      console.log('[QR Scanner] Loading classes for subject:', subjectId);
      const classesResponse = await getClasses();
      console.log('[QR Scanner] Classes response:', classesResponse);
      const allClasses = classesResponse.success ? classesResponse.data : [];
      console.log('[QR Scanner] All classes:', allClasses);
      console.log('[QR Scanner] All classes length:', allClasses.length);
      console.log('[QR Scanner] User role:', user?.role);
      console.log('[QR Scanner] User email:', user?.email);
      
      let filteredClasses = allClasses;
      
      // If user is admin or super admin, show all classes
      if (user?.role === 'admin' || user?.role === 'super_admin') {
        console.log('[QR Scanner] Admin user - showing all classes');
        if (subjectId && subjectId !== 'all') {
          filteredClasses = allClasses.filter(c => c.subjectId === subjectId);
        }
      } else {
        // Regular instructor - only show their classes
        console.log('[QR Scanner] Instructor user - filtering by instructor');
        filteredClasses = allClasses.filter(c => 
          c.instructorId === user?.uid || c.ownerEmail === user?.email
        );
        if (subjectId && subjectId !== 'all') {
          filteredClasses = filteredClasses.filter(c => c.subjectId === subjectId);
        }
      }
      
      console.log('[QR Scanner] Filtered classes for subject', subjectId, ':', filteredClasses);
      console.log('[QR Scanner] Filtered classes length:', filteredClasses.length);
      
      // Log each class
      filteredClasses.forEach((cls, index) => {
        console.log(`[QR Scanner] Class ${index}:`, {
          id: cls.id || cls.docId,
          name: cls.name || cls.code,
          subjectId: cls.subjectId,
          instructorId: cls.instructorId,
          ownerEmail: cls.ownerEmail,
          instructor: cls.instructor
        });
      });

      if (filteredClasses.length === 0) {
        console.warn('[QR Scanner] No classes found in database for subject:', subjectId);
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
      console.log('[QR Scanner] Sample penalty record:', allPenalties[0]);
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
      const dateStr = selectedDate.toISOString().split('T')[0];
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

      // Update selected student
      const updatedStudent = students.find(s => s.id === studentId);
      setSelectedStudent(updatedStudent);
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
    // TODO: Implement CSV download
    console.log('Download students data');
  };

  const handleFilter = () => {
    // TODO: Implement advanced filters
    console.log('Open filter dialog');
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
            <span>QR Scanner</span>
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
                      console.log('[QR Scanner] Subject mapped:', mapped);
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
                      console.log('[QR Scanner] Class mapped:', mapped);
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
              LIVE
            </span>
          </div>
        </div>
      </header>

      <div style={{
        padding: '1.5rem',
        display: 'grid',
        gridTemplateColumns: selectedStudent ? '300px 1fr 400px' : '300px 1fr',
        gap: '1.5rem',
        maxWidth: '1600px',
        margin: '0 auto'
      }}>
        {/* Sidebar with Scanner */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          {showScanner && selectedClassId && (
            <QRScanner onScan={handleScan} />
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
            <StudentRoster
              students={displayedStudents}
              onStudentSelect={handleStudentSelect}
              selectedStudentId={selectedStudent?.id}
              onTogglePin={handleTogglePin}
              onDownload={handleDownload}
              onFilter={handleFilter}
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
                // Add penalty types if they exist, otherwise create some default ones
                { id: 'penalty_late', label_en: 'Late Penalty', icon: 'Clock', color: '#dc2626', points: -5, category: 'penalty' },
                { id: 'penalty_absent', label_en: 'Absent Penalty', icon: 'XCircle', color: '#dc2626', points: -10, category: 'penalty' },
                { id: 'penalty_disruptive', label_en: 'Disruptive Behavior', icon: 'AlertTriangle', color: '#dc2626', points: -3, category: 'penalty' }
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
              selectedDate={selectedDate}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default InstructorQRScannerPage;
