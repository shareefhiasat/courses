import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { Navigate } from 'react-router-dom';
import { getSubjects, getPrograms } from '../firebase/programs';
import { getSubjectMarksDistribution, setSubjectMarksDistribution, getStudentMarks, saveStudentMarks } from '../firebase/grading';
import { getUsers, getEnrollments, getClasses } from '../firebase/firestore';
import { logActivity, ACTIVITY_TYPES } from '../firebase/activityLogger';
import { MARK_TYPES } from '../constants/activityTypes';
import { Loading, Modal, Button, Input, Select, useToast, AdvancedDataGrid, Card, CardBody, Container } from '../components/ui';
import { FileSpreadsheet, Save, Edit, Award, Eye, AlertCircle, Award as ParticipationIcon, Calendar, Info } from 'lucide-react';
import CollapsibleSideWindow from '../components/CollapsibleSideWindow';
import InstructorBehaviorPage from './InstructorBehaviorPage';
import InstructorParticipationPage from './InstructorParticipationPage';
import HRPenaltiesPage from './HRPenaltiesPage';
import styles from './MarksEntryPage.module.css';

const MarksEntryPage = () => {
  const { user, isAdmin, isSuperAdmin, isInstructor, loading: authLoading } = useAuth();
  const { lang, t } = useLang();
  const toast = useToast();
  
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [marksDistribution, setMarksDistribution] = useState(null);
  const [studentMarks, setStudentMarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    midTermExam: 0,
    finalExam: 0,
    homework: 0,
    labsProjectResearch: 0,
    quizzes: 0,
    participation: 0,
    attendance: 0
  });
  const [editingDistribution, setEditingDistribution] = useState(false);
  const [distributionForm, setDistributionForm] = useState({
    midTermExam: 20,
    finalExam: 40,
    homework: 5,
    labsProjectResearch: 10,
    quizzes: 5,
    participation: 10,
    attendance: 10
  });

  // Filters
  const [programFilter, setProgramFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');

  // Normalize Select onChange (our Select sometimes passes event, sometimes raw value)
  const getSelectValue = (eventOrValue) => {
    if (eventOrValue && typeof eventOrValue === 'object' && 'target' in eventOrValue) {
      return eventOrValue.target?.value ?? 'all';
    }
    return eventOrValue ?? 'all';
  };

  // Side window state
  const [sideWindowOpen, setSideWindowOpen] = useState(false);
  const [sideWindowContent, setSideWindowContent] = useState(null);
  const [sideWindowStudent, setSideWindowStudent] = useState(null);
  const [sideWindowFilters, setSideWindowFilters] = useState({});

  // Filtered classes
  const filteredClasses = useMemo(() => {
    let result = [...classes];
    
    if (programFilter !== 'all') {
      result = result.filter(cls => {
        if (!cls.subjectId) return false;
        const subject = subjects.find(s => (s.docId || s.id) === cls.subjectId);
        if (!subject) return false;
        return (subject.programId || '') === programFilter;
      });
    }
    
    if (subjectFilter !== 'all') {
      result = result.filter(cls => (cls.subjectId || '') === subjectFilter);
    }
    
    if (classFilter !== 'all') {
      result = result.filter(cls => {
        const classId = cls.id || cls.docId;
        return String(classId) === String(classFilter);
      });
    }
    
    return result.sort((a, b) => (a.name || a.code || '').localeCompare(b.name || b.code || ''));
  }, [classes, programs, subjects, programFilter, subjectFilter, classFilter]);

  // Filtered students based on selected class
  const filteredStudents = useMemo(() => {
    if (classFilter === 'all') {
      console.log('No class filter applied');
      return [];
    }

    // Find the selected class
    const classItem = classes.find(c => {
      const classId = c.id || c.docId;
      return String(classId) === String(classFilter);
    });

    if (!classItem) {
      console.log('❌ Class not found for filter:', classFilter);
      return [];
    }

    console.log('🔍 Found class:', {
      id: classItem.id || classItem.docId,
      name: classItem.name
    });

    // Get all enrollments for this class
    const classEnrollments = enrollments.filter(e =>
        e.classId === (classItem.id || classItem.docId)
    );
    console.log('📋 Class Enrollments:', classEnrollments);

    // Get unique student IDs from enrollments
    const studentIds = [...new Set(classEnrollments.map(e => e.userId))];
    console.log('🆔 Student IDs from enrollments:', studentIds);

    if (studentIds.length === 0) {
      console.log('ℹ️ No student enrollments found for this class');
      return [];
    }

    // Create a map of student ID to student object for faster lookups
    const studentsMap = new Map();
    students.forEach(student => {
      const id = student.uid || student.docId;
      if (id) {
        studentsMap.set(id, student);
      }
    });

    // Log all available student IDs for debugging
    console.log('👥 Available Student IDs:', [...studentsMap.keys()]);

    // Find all enrolled students that exist in our students map
    const matchedStudents = studentIds
    .map(id => {
      const student = studentsMap.get(id);
      if (!student) {
        console.log(`❌ No student found for ID: ${id}`);
        return null;
      }
      
      console.log('🔍 Student data from database:', {
        id: student.uid || student.docId || student.id,
        realName: student.realName,
        fullName: student.fullName,
        displayName: student.displayName,
        studentNumber: student.studentNumber,
        email: student.email,
        allProps: Object.keys(student)
      });
      
      // Create a clean student object with only the properties we need
      const cleanStudent = {
        ...student,
        id: student.uid || student.docId || student.id,
        realName: student.realName,
        fullName: student.fullName,
        displayName: student.displayName,
        studentNumber: student.studentNumber,
        email: student.email
      };
      
      console.log('✨ Prepared student data for grid:', cleanStudent);
      return cleanStudent;
    })
    .filter(Boolean); // Remove null entries

    console.log('📊 Final Matched Students:', matchedStudents);

    if (matchedStudents.length === 0 && studentIds.length > 0) {
      console.warn('⚠️ No valid student records found for the enrolled students');
      console.warn('Expected Student IDs:', studentIds);
      console.warn('Available Student IDs:', [...studentsMap.keys()]);
    }

    // Ensure we have all necessary student fields
    return matchedStudents.map(student => ({
      ...student,
      // Ensure these fields are always included
      id: student.id || student.uid || student.docId,
      realName: student.realName || student.fullName || student.displayName || student.studentNumber || student.email || 'N/A',
      fullName: student.fullName || student.displayName || student.studentNumber || student.email || 'N/A',
      displayName: student.displayName || student.studentNumber || student.email || 'N/A',
      studentNumber: student.studentNumber || '',
      email: student.email || ''
    }));
  }, [classFilter, classes, enrollments, students]);

  // Merge marks with student data
  const studentsWithMarks = useMemo(() => {
    if (!filteredStudents.length) return [];

    console.log('🔄 Merging student data with marks...');
    console.log('📋 Filtered Students:', JSON.parse(JSON.stringify(filteredStudents)));
    console.log('📋 Marks Data:', JSON.parse(JSON.stringify(studentMarks)));

    const result = filteredStudents.map(student => {
      const studentId = student.id || student.uid || student.docId;
      const marks = studentMarks[studentId] || {};

      const merged = {
        ...student,
        ...Object.fromEntries(
            Object.entries(marks).filter(([key]) => !(key in student))
        ),
        id: studentId,
        realName: student.realName || student.fullName || student.displayName || student.studentNumber || student.email || 'N/A',
        fullName: student.fullName || student.displayName || student.studentNumber || student.email || 'N/A',
        displayName: student.displayName || student.studentNumber || student.email || 'N/A',
        studentNumber: student.studentNumber || '',
        email: student.email || ''
      };

      console.log(`🔗 Merged data for ${studentId}:`, merged);
      return merged;
    });

    console.log('✅ Final merged data:', JSON.parse(JSON.stringify(result)));
    return result;
  }, [filteredStudents, studentMarks]);

  // Selected subject from filters
  const selectedSubject = useMemo(() => {
    if (subjectFilter === 'all') return null;
    return subjects.find(s => (s.docId || s.id) === subjectFilter);
  }, [subjectFilter, subjects]);

  useEffect(() => {
    if (!authLoading && (isAdmin || isSuperAdmin || isInstructor)) {
      loadData();
      logActivity(ACTIVITY_TYPES.MARK_ENTRY_VIEWED);
    }
  }, [authLoading, isAdmin, isSuperAdmin, isInstructor]);

  useEffect(() => {
    if (selectedSubject && classFilter !== 'all' && enrollments.length > 0) {
      // Small delay to ensure enrollments are fully loaded with marks
      const timer = setTimeout(() => {
        loadMarksData();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedSubject, classFilter, enrollments.length]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [programsRes, subjectsRes, classesRes, enrollmentsRes] = await Promise.all([
        getPrograms(),
        getSubjects(),
        getClasses(),
        getEnrollments()
      ]);

      if (programsRes.success) {
        let programsList = programsRes.data || [];
        setPrograms(programsList);
      }

      if (subjectsRes.success) {
        let subjectsList = subjectsRes.data || [];
        if (isInstructor && !isAdmin && !isSuperAdmin) {
          subjectsList = subjectsList.filter(s => s.instructorId === user?.uid);
        }
        setSubjects(subjectsList);
      }

      if (classesRes.success) {
        setClasses(classesRes.data || []);
      }

      if (enrollmentsRes.success) {
        setEnrollments(enrollmentsRes.data || []);
      }

      // Load all students
      const usersResult = await getUsers();
      if (usersResult.success) {
        const studentsList = (usersResult.data || []).filter(u => u.role === 'student');
        setStudents(studentsList);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMarksData = async () => {
    if (!selectedSubject) return;
    
    setLoading(true);
    try {
      // Load marks distribution
      const distResult = await getSubjectMarksDistribution(selectedSubject.docId || selectedSubject.id);
      if (distResult.success && distResult.data) {
        const distribution = distResult.data.distribution || distResult.data;
        setMarksDistribution(distribution);
      } else {
        const defaultDist = {
          midTermExam: 20,
          finalExam: 40,
          homework: 5,
          labsProjectResearch: 10,
          quizzes: 5,
          participation: 10,
          attendance: 10
        };
        setMarksDistribution(defaultDist);
      }
      
      // Load existing marks for filtered students
      if (classFilter !== 'all') {
        // Get enrollments for this class to read marks directly
        const classEnrollments = enrollments.filter(e => {
          const eClassId = e.classId || e.classDocId;
          return String(eClassId) === String(classFilter);
        });
        const marksMap = {};
        const subjectId = selectedSubject.docId || selectedSubject.id;
        
        console.log('📊 [loadMarksData] Loading marks for class:', classFilter, 'subject:', subjectId);
        console.log('📊 [loadMarksData] Class enrollments found:', classEnrollments.length);
        console.log('📊 [loadMarksData] Enrollment samples:', classEnrollments.slice(0, 2).map(e => ({
          docId: e.docId,
          userId: e.userId,
          hasMarks: !!e.marks,
          marksKeys: e.marks ? Object.keys(e.marks) : []
        })));
        
        for (const enrollment of classEnrollments) {
          const studentId = enrollment.userId;
          if (!studentId) {
            console.warn('⚠️ [loadMarksData] Enrollment missing userId:', enrollment.docId);
            continue;
          }
          
          if (enrollment.marks && enrollment.marks[subjectId]) {
            const markData = enrollment.marks[subjectId];
            console.log('✅ [loadMarksData] Found marks for student:', studentId, {
              totalScore: markData.totalScore,
              grade: markData.grade,
              marks: markData.marks
            });
            marksMap[studentId] = {
              docId: enrollment.docId,
              studentId: studentId,
              subjectId: markData.subjectId || subjectId,
              semester: markData.semester || null,
              academicYear: markData.academicYear || null,
              marks: markData.marks || {},
              totalScore: markData.totalScore || 0,
              grade: markData.grade || '',
              points: markData.points || 0,
              isRetake: markData.isRetake || false,
              instructorId: markData.instructorId || null,
              createdAt: markData.createdAt || null,
              updatedAt: markData.updatedAt || null,
            };
          } else {
            console.log('ℹ️ [loadMarksData] No marks found for student:', studentId, {
              enrollmentId: enrollment.docId,
              hasMarks: !!enrollment.marks,
              marksKeys: enrollment.marks ? Object.keys(enrollment.marks) : [],
              lookingFor: subjectId
            });
          }
        }
        
        console.log('📊 [loadMarksData] Final marks map:', Object.keys(marksMap), 'students with marks');
        setStudentMarks(marksMap);
      }
    } catch (error) {
      console.error('Error loading marks data:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditMarks = (student) => {
    setEditingStudent(student);
    
    const studentId = student.uid || student.docId;
    const existing = studentMarks[studentId];
    if (existing) {
      setFormData({
        midTermExam: existing.marks?.midTermExam || 0,
        finalExam: existing.marks?.finalExam || 0,
        homework: existing.marks?.homework || 0,
        labsProjectResearch: existing.marks?.labsProjectResearch || 0,
        quizzes: existing.marks?.quizzes || 0,
        participation: existing.marks?.participation || 0,
        attendance: existing.marks?.attendance || 0
      });
    } else {
      setFormData({
        midTermExam: 0,
        finalExam: 0,
        homework: 0,
        labsProjectResearch: 0,
        quizzes: 0,
        participation: 0,
        attendance: 0
      });
    }
    
    setShowModal(true);
  };

  const calculateTotalScore = () => {
    if (!marksDistribution) return 0;
    
    return (
      (formData.midTermExam * marksDistribution.midTermExam / 100) +
      (formData.finalExam * marksDistribution.finalExam / 100) +
      (formData.homework * marksDistribution.homework / 100) +
      (formData.labsProjectResearch * marksDistribution.labsProjectResearch / 100) +
      (formData.quizzes * marksDistribution.quizzes / 100) +
      (formData.participation * marksDistribution.participation / 100) +
      (formData.attendance * marksDistribution.attendance / 100)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!editingStudent || !selectedSubject || classFilter === 'all') {
      toast.error('Missing required data');
      return;
    }
    
    setLoading(true);
    try {
      const result = await saveStudentMarks({
        studentId: editingStudent.uid || editingStudent.docId,
        subjectId: selectedSubject.docId || selectedSubject.id,
        classId: classFilter,
        semester: selectedSubject.semester || null,
        academicYear: selectedSubject.academicYear || null,
        marks: formData,
        instructorId: user.uid,
        sendEmailNotification: false,
        sendInAppNotification: false
      });

      if (result.success) {
        try {
          await logActivity(result.isUpdate ? ACTIVITY_TYPES.MARK_ENTRY_UPDATED : ACTIVITY_TYPES.MARK_ENTRY_CREATED, {
            markEntryId: result.id,
            studentId: editingStudent.uid || editingStudent.docId || '',
            subjectId: selectedSubject.docId || selectedSubject.id || '',
            totalScore: calculateTotalScore()
          });
        } catch (e) { console.warn('Failed to log activity:', e); }
        toast.success('Marks saved successfully');
        setShowModal(false);
        setEditingStudent(null);
        loadMarksData();
      } else {
        toast.error(result.error || 'Failed to save marks');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingStudent(null);
  };

  const openSideWindow = (content, student, filters) => {
    setSideWindowContent(content);
    setSideWindowStudent(student);
    setSideWindowFilters(filters);
    setSideWindowOpen(true);
  };

  const closeSideWindow = () => {
    setSideWindowOpen(false);
    setSideWindowContent(null);
    setSideWindowStudent(null);
    setSideWindowFilters({});
  };

  const handleAttendanceClick = () => {
    toast.info('Attendance feature coming soon! You can still add attendance marks manually.');
  };

  if (authLoading) {
    return <Loading variant="overlay" message="Loading..." fancyVariant="dots" />;
  }

  if (!isAdmin && !isSuperAdmin && !isInstructor) {
    return <Navigate to="/" replace />;
  }

  const columns = useMemo(() => [
    {
      field: 'displayName',
      headerName: 'Student',
      flex: 1,
      minWidth: 180,
      valueGetter: (params) => {
        // Check if we have a direct value first
        if (params.value) {
          return params.value;
        }

        // Fall back to row data
        const row = params.row || {};
        const student = {
          id: row.id || row.docId || row.uid || row.studentId,
          realName: row.realName,
          fullName: row.fullName,
          displayName: row.displayName,
          studentNumber: row.studentNumber,
          email: row.email,
          ...row
        };

        // Return the first available name in order of priority
        return (
            student.realName ||
            student.fullName ||
            student.displayName ||
            student.studentNumber ||
            student.email ||
            'N/A'
        );
      }
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1,
      minWidth: 200
    },
    {
      field: 'midTerm',
      headerName: `Mid-Term (${marksDistribution?.midTermExam || 20}%)`,
      width: 140,
      renderCell: (params) => {
        const studentId = params.row.uid || params.row.docId;
        const marks = studentMarks[studentId];
        return marks?.marks?.midTermExam || '-';
      }
    },
    {
      field: 'final',
      headerName: `Final (${marksDistribution?.finalExam || 40}%)`,
      width: 120,
      renderCell: (params) => {
        const studentId = params.row.uid || params.row.docId;
        const marks = studentMarks[studentId];
        return marks?.marks?.finalExam || '-';
      }
    },
    {
      field: 'homework',
      headerName: `Homework (${marksDistribution?.homework || 5}%)`,
      width: 140,
      renderCell: (params) => {
        const studentId = params.row.uid || params.row.docId;
        const marks = studentMarks[studentId];
        return marks?.marks?.homework || '-';
      }
    },
    {
      field: 'labs',
      headerName: `Labs/Projects (${marksDistribution?.labsProjectResearch || 10}%)`,
      width: 150,
      renderCell: (params) => {
        const studentId = params.row.uid || params.row.docId;
        const marks = studentMarks[studentId];
        return marks?.marks?.labsProjectResearch || '-';
      }
    },
    {
      field: 'quizzes',
      headerName: `Quizzes (${marksDistribution?.quizzes || 5}%)`,
      width: 120,
      renderCell: (params) => {
        const studentId = params.row.uid || params.row.docId;
        const marks = studentMarks[studentId];
        return marks?.marks?.quizzes || '-';
      }
    },
    {
      field: 'participation',
      headerName: `Participation (${marksDistribution?.participation || 10}%)`,
      width: 140,
      renderCell: (params) => {
        const studentId = params.row.uid || params.row.docId;
        const marks = studentMarks[studentId];
        return marks?.marks?.participation || '-';
      }
    },
    {
      field: 'attendance',
      headerName: `Attendance (${marksDistribution?.attendance || 10}%)`,
      width: 140,
      renderCell: (params) => {
        const studentId = params.row.uid || params.row.docId;
        const marks = studentMarks[studentId];
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>{marks?.marks?.attendance || '-'}</span>
            <Button
              variant="ghost"
              size="sm"
              icon={<Calendar size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                handleAttendanceClick();
              }}
              title="View Attendance (Coming Soon)"
            />
          </div>
        );
      }
    },
    {
      field: 'total',
      headerName: 'Total',
      width: 100,
      renderCell: (params) => {
        const studentId = params.row.uid || params.row.docId;
        const marks = studentMarks[studentId];
        return marks?.totalScore?.toFixed(2) || '-';
      }
    },
    {
      field: 'grade',
      headerName: 'Grade',
      width: 100,
      renderCell: (params) => {
        const studentId = params.row.uid || params.row.docId;
        const marks = studentMarks[studentId];
        if (!marks) return '-';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 700 }}>{marks.grade}</span>
            {marks.isRetake && <span style={{ fontSize: '0.75rem', color: '#f59e0b' }}>(Retake)</span>}
          </div>
        );
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 300,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const student = params.row;
        const classItem = classes.find(c => {
          const classId = c.id || c.docId;
          return String(classId) === String(classFilter);
        });
        const subject = selectedSubject;
        const program = subject ? programs.find(p => (p.docId || p.id) === subject.programId) : null;
        
        const filters = {
          programId: program?.docId || program?.id || 'all',
          subjectId: subject?.docId || subject?.id || 'all',
          classId: classFilter,
          studentId: student.uid
        };

        return (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Button
              variant="ghost"
              size="sm"
              icon={<Edit size={14} />}
              onClick={() => handleEditMarks(student)}
              title="Edit Marks"
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<AlertCircle size={14} />}
              onClick={() => openSideWindow('behavior', student, filters)}
              title="View Behavior"
            >
              Behavior
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<Award size={14} />}
              onClick={() => openSideWindow('penalties', student, filters)}
              title="View Penalties"
            >
              Penalties
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<ParticipationIcon size={14} />}
              onClick={() => openSideWindow('participation', student, filters)}
              title="View Participation"
            >
              Participation
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<Eye size={14} />}
              onClick={() => openSideWindow('sneakpeek', student, filters)}
              title="Sneak Peek"
            >
              Peek
            </Button>
          </div>
        );
      }
    }
  ], [marksDistribution, studentMarks]);

  const renderSideWindowContent = () => {
    if (!sideWindowContent || !sideWindowStudent) return null;

    switch (sideWindowContent) {
      case 'behavior':
        return (
          <InstructorBehaviorPage 
            isDashboardTab={true}
            initialFilters={sideWindowFilters}
            hideActions={true}
          />
        );
      case 'penalties':
        return (
          <HRPenaltiesPage 
            isDashboardTab={true}
            initialFilters={sideWindowFilters}
            hideActions={true}
          />
        );
      case 'participation':
        return (
          <InstructorParticipationPage 
            isDashboardTab={true}
            initialFilters={sideWindowFilters}
            hideActions={true}
          />
        );
      case 'sneakpeek':
        return (
          <div style={{ padding: '1rem' }}>
            <h3 style={{ marginTop: 0 }}>Student Overview</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <strong>Name:</strong> {sideWindowStudent.displayName || sideWindowStudent.email}
              </div>
              <div>
                <strong>Email:</strong> {sideWindowStudent.email}
              </div>
              {(() => {
                const studentId = sideWindowStudent.uid || sideWindowStudent.docId;
                const marks = studentMarks[studentId];
                return marks && (
                  <div>
                    <strong>Current Marks:</strong>
                    <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div>Total Score: {marks.totalScore?.toFixed(2) || 0}</div>
                      <div>Grade: {marks.grade || 'N/A'}</div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="xl" className={styles.page} style={{ padding: '1rem 0' }}>
      {/* Info Banner */}
      <Card style={{ marginBottom: '1rem', background: '#fef3c7', border: '1px solid #fbbf24' }}>
        <CardBody>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Info size={20} color="#f59e0b" />
            <span style={{ fontSize: '0.9rem', color: '#92400e' }}>
              <strong>Note:</strong> Marks entered here will not send any notifications to students. This is for manual entry only.
            </span>
          </div>
        </CardBody>
      </Card>

      {/* Filters */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <CardBody>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
            <Select
              searchable
              value={programFilter}
              onChange={(e) => {
                const val = getSelectValue(e);
                setProgramFilter(val);
                setSubjectFilter('all');
                setClassFilter('all');
              }}
              options={[
                { value: 'all', label: 'All Programs' },
                ...programs.map(p => ({
                  value: p.docId || p.id,
                  label: p.name_en || p.name_ar || p.code || p.docId
                }))
              ]}
              fullWidth
            />
            <Select
              searchable
              value={subjectFilter}
              onChange={(e) => {
                const val = getSelectValue(e);
                setSubjectFilter(val);
                setClassFilter('all');
              }}
              options={[
                { value: 'all', label: 'All Subjects' },
                ...subjects
                  .filter(s => programFilter === 'all' || s.programId === programFilter)
                  .map(s => ({
                    value: s.docId || s.id,
                    label: `${s.code || ''} - ${s.name_en || s.name_ar || s.docId}`
                  }))
              ]}
              fullWidth
              disabled={programFilter === 'all'}
            />
            <Select
              searchable
              value={classFilter}
              onChange={(e) => setClassFilter(getSelectValue(e))}
              options={[
                { value: 'all', label: 'All Classes' },
                ...filteredClasses.map(c => ({
                  value: c.id || c.docId,
                  label: `${c.name || c.code || 'Unnamed'}${c.code ? ` (${c.code})` : ''}${c.term ? ` - ${c.term}` : ''}${c.year ? ` ${c.year}` : ''}${c.semester ? ` - ${c.semester}` : ''}`
                }))
              ]}
              fullWidth
              disabled={subjectFilter === 'all'}
            />
          </div>
        </CardBody>
      </Card>

      {/* Marks Distribution */}
      {selectedSubject && marksDistribution && (
        <Card style={{ marginBottom: '1.5rem' }}>
          <CardBody>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ margin: 0 }}>Marks Distribution</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDistributionForm({
                    midTermExam: marksDistribution.midTermExam || 20,
                    finalExam: marksDistribution.finalExam || 40,
                    homework: marksDistribution.homework || 5,
                    labsProjectResearch: marksDistribution.labsProjectResearch || 10,
                    quizzes: marksDistribution.quizzes || 5,
                    participation: marksDistribution.participation || 10,
                    attendance: marksDistribution.attendance || 10
                  });
                  setEditingDistribution(true);
                }}
              >
                Configure
              </Button>
            </div>
            <div className={styles.distributionGrid}>
              <div>Mid-Term: {marksDistribution.midTermExam}%</div>
              <div>Final: {marksDistribution.finalExam}%</div>
              <div>Homework: {marksDistribution.homework}%</div>
              <div>Labs/Projects: {marksDistribution.labsProjectResearch}%</div>
              <div>Quizzes: {marksDistribution.quizzes}%</div>
              <div>Participation: {marksDistribution.participation}%</div>
              <div>Attendance: {marksDistribution.attendance}%</div>
              <div style={{ fontWeight: 600 }}>Total: {(
                (marksDistribution.midTermExam || 0) +
                (marksDistribution.finalExam || 0) +
                (marksDistribution.homework || 0) +
                (marksDistribution.labsProjectResearch || 0) +
                (marksDistribution.quizzes || 0) +
                (marksDistribution.participation || 0) +
                (marksDistribution.attendance || 0)
              )}%</div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Students Grid */}
      <Card>
        <CardBody>
          {loading ? (
            <Loading message="Loading student marks..." fancyVariant="dots" />
          ) : classFilter !== 'all' && selectedSubject ? (
            studentsWithMarks.length > 0 ? (
                <AdvancedDataGrid
                    rows={studentsWithMarks}
                    getRowId={(row) => row.id || row.docId || row.uid || row.studentId}
                    columns={columns}
                    pageSize={20}
                    autoHeight
                    showExportButton
                    exportFileName="marks"
                    exportLabel="Export"
                    // Add row selection and other props
                    checkboxSelection={false}
                    disableSelectionOnClick
                    disableColumnMenu
                    disableDensitySelector
                    disableColumnFilter
                    disableColumnSelector
                    disableVirtualization={false}
                    loading={loading}
                    components={{
                      NoRowsOverlay: () => (
                          <div style={{ padding: '16px' }}>
                            No students found
                          </div>
                      ),
                    }}
                    onRowClick={(params, event) => {
                      event.stopPropagation();
                    }}
                    sx={{
                      '& .MuiDataGrid-cell:focus': {
                        outline: 'none',
                      },
                    }}
                />
            ) : (
              <div className={styles.emptyState}>
                No students enrolled in this class.
              </div>
            )
          ) : (
            <div className={styles.emptyState}>
              Please select a program, subject, and class to view and enter marks.
            </div>
          )}
        </CardBody>
      </Card>

      {/* Edit Marks Modal */}
      {showModal && editingStudent && marksDistribution && (
        <Modal
          isOpen={showModal}
          onClose={handleCloseModal}
          title={`Enter Marks: ${editingStudent.displayName || editingStudent.email}`}
        >
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.marksGrid}>
              <Input
                label={`Mid-Term Exam (${marksDistribution.midTermExam}%)`}
                type="number"
                value={formData.midTermExam}
                onChange={(e) => setFormData({ ...formData, midTermExam: parseFloat(e.target.value) || 0 })}
                min={0}
                max={100}
                step={0.5}
              />
              <Input
                label={`Final Exam (${marksDistribution.finalExam}%)`}
                type="number"
                value={formData.finalExam}
                onChange={(e) => setFormData({ ...formData, finalExam: parseFloat(e.target.value) || 0 })}
                min={0}
                max={100}
                step={0.5}
              />
              <Input
                label={`Homework (${marksDistribution.homework}%)`}
                type="number"
                value={formData.homework}
                onChange={(e) => setFormData({ ...formData, homework: parseFloat(e.target.value) || 0 })}
                min={0}
                max={100}
                step={0.5}
              />
              <Input
                label={`Labs/Projects (${marksDistribution.labsProjectResearch}%)`}
                type="number"
                value={formData.labsProjectResearch}
                onChange={(e) => setFormData({ ...formData, labsProjectResearch: parseFloat(e.target.value) || 0 })}
                min={0}
                max={100}
                step={0.5}
              />
              <Input
                label={`Quizzes (${marksDistribution.quizzes}%)`}
                type="number"
                value={formData.quizzes}
                onChange={(e) => setFormData({ ...formData, quizzes: parseFloat(e.target.value) || 0 })}
                min={0}
                max={100}
                step={0.5}
              />
              <Input
                label={`Participation (${marksDistribution.participation}%)`}
                type="number"
                value={formData.participation}
                onChange={(e) => setFormData({ ...formData, participation: parseFloat(e.target.value) || 0 })}
                min={0}
                max={100}
                step={0.5}
              />
              <Input
                label={`Attendance (${marksDistribution.attendance}%)`}
                type="number"
                value={formData.attendance}
                onChange={(e) => setFormData({ ...formData, attendance: parseFloat(e.target.value) || 0 })}
                min={0}
                max={100}
                step={0.5}
              />
            </div>

            <div className={styles.totalScore}>
              <Award size={20} />
              <span>Calculated Total Score:</span>
              <strong>{calculateTotalScore().toFixed(2)}</strong>
              <span>/ 100</span>
            </div>

            <div className={styles.actions}>
              <Button
                type="button"
                variant="ghost"
                onClick={handleCloseModal}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                icon={<Save size={18} />}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Marks'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Distribution */}
      {editingDistribution && selectedSubject && (
        <Card style={{ marginBottom: '1rem', background: '#fef3c7', border: '1px solid #fbbf24' }}>
          <CardBody>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ margin: 0 }}>Edit Marks Distribution</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingDistribution(false)}
              >
                Cancel
              </Button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const total = (
                (distributionForm.midTermExam || 0) +
                (distributionForm.finalExam || 0) +
                (distributionForm.homework || 0) +
                (distributionForm.labsProjectResearch || 0) +
                (distributionForm.quizzes || 0) +
                (distributionForm.participation || 0) +
                (distributionForm.attendance || 0)
              );
              if (Math.abs(total - 100) > 0.01) {
                toast.error(`Total must be 100%. Current total: ${total.toFixed(1)}%`);
                return;
              }
              setLoading(true);
              try {
                const result = await setSubjectMarksDistribution(selectedSubject.docId || selectedSubject.id, distributionForm);
                if (result.success) {
                  toast.success('Marks distribution updated successfully');
                  setEditingDistribution(false);
                  loadMarksData();
                } else {
                  toast.error(result.error || 'Failed to update distribution');
                }
              } catch (error) {
                toast.error(error.message);
              } finally {
                setLoading(false);
              }
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <Input
                  label="Mid-Term Exam (%)"
                  type="number"
                  value={distributionForm.midTermExam}
                  onChange={(e) => setDistributionForm({ ...distributionForm, midTermExam: parseFloat(e.target.value) || 0 })}
                  min={0}
                  max={100}
                  step={0.5}
                />
                <Input
                  label="Final Exam (%)"
                  type="number"
                  value={distributionForm.finalExam}
                  onChange={(e) => setDistributionForm({ ...distributionForm, finalExam: parseFloat(e.target.value) || 0 })}
                  min={0}
                  max={100}
                  step={0.5}
                />
                <Input
                  label="Homework (%)"
                  type="number"
                  value={distributionForm.homework}
                  onChange={(e) => setDistributionForm({ ...distributionForm, homework: parseFloat(e.target.value) || 0 })}
                  min={0}
                  max={100}
                  step={0.5}
                />
                <Input
                  label="Labs/Projects/Research (%)"
                  type="number"
                  value={distributionForm.labsProjectResearch}
                  onChange={(e) => setDistributionForm({ ...distributionForm, labsProjectResearch: parseFloat(e.target.value) || 0 })}
                  min={0}
                  max={100}
                  step={0.5}
                />
                <Input
                  label="Quizzes (%)"
                  type="number"
                  value={distributionForm.quizzes}
                  onChange={(e) => setDistributionForm({ ...distributionForm, quizzes: parseFloat(e.target.value) || 0 })}
                  min={0}
                  max={100}
                  step={0.5}
                />
                <Input
                  label="Participation (%)"
                  type="number"
                  value={distributionForm.participation}
                  onChange={(e) => setDistributionForm({ ...distributionForm, participation: parseFloat(e.target.value) || 0 })}
                  min={0}
                  max={100}
                  step={0.5}
                />
                <Input
                  label="Attendance (%)"
                  type="number"
                  value={distributionForm.attendance}
                  onChange={(e) => setDistributionForm({ ...distributionForm, attendance: parseFloat(e.target.value) || 0 })}
                  min={0}
                  max={100}
                  step={0.5}
                />
              </div>
              <div style={{ padding: '0.75rem', background: 'var(--background)', borderRadius: '8px', marginBottom: '0.75rem' }}>
                <strong>Total: {(
                  (distributionForm.midTermExam || 0) +
                  (distributionForm.finalExam || 0) +
                  (distributionForm.homework || 0) +
                  (distributionForm.labsProjectResearch || 0) +
                  (distributionForm.quizzes || 0) +
                  (distributionForm.participation || 0) +
                  (distributionForm.attendance || 0)
                ).toFixed(1)}%</strong>
                {Math.abs((
                  (distributionForm.midTermExam || 0) +
                  (distributionForm.finalExam || 0) +
                  (distributionForm.homework || 0) +
                  (distributionForm.labsProjectResearch || 0) +
                  (distributionForm.quizzes || 0) +
                  (distributionForm.participation || 0) +
                  (distributionForm.attendance || 0)
                ) - 100) > 0.01 && (
                  <p style={{ color: '#dc2626', margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
                    Total must equal 100%
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading || Math.abs((
                    (distributionForm.midTermExam || 0) +
                    (distributionForm.finalExam || 0) +
                    (distributionForm.homework || 0) +
                    (distributionForm.labsProjectResearch || 0) +
                    (distributionForm.quizzes || 0) +
                    (distributionForm.participation || 0) +
                    (distributionForm.attendance || 0)
                  ) - 100) > 0.01}
                >
                  {loading ? 'Saving...' : 'Save Distribution'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {/* Side Window */}
      <CollapsibleSideWindow
        isOpen={sideWindowOpen}
        onClose={closeSideWindow}
        title={sideWindowContent === 'behavior' ? 'Behavior' :
              sideWindowContent === 'penalties' ? 'Penalties' :
              sideWindowContent === 'participation' ? 'Participation' : 'Student Overview'}
        studentName={sideWindowStudent?.displayName || sideWindowStudent?.email || 'Student'}
        searchable={false}
        initialFilters={sideWindowFilters}
        onSearch={(query, filters) => {
          // Search functionality can be implemented by child components
          // This just passes the search query and filters down
          setSideWindowFilters({ ...filters, searchQuery: query });
        }}
      >
        {renderSideWindowContent()}
      </CollapsibleSideWindow>
    </Container>
  );
};

export default MarksEntryPage;
