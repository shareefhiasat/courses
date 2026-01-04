import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, doc, getDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Container, Card, CardBody, Button, Select, Loading, Badge, useToast, AdvancedDataGrid, Modal, Input, Checkbox } from '../components/ui';
import { getPrograms, getSubjects } from '../firebase/programs';
import { getClasses } from '../firebase/firestore';
import { getCardConfig, getShapeRadius } from '../utils/cardColors';
import { addNotification } from '../firebase/notifications';
import { sendEmail } from '../firebase/firestore';
import { Edit, Check, X, Mail, Send, CheckSquare } from 'lucide-react';
import styles from './QuizResultsPage.module.css';

const QuizResultsPage = () => {
  const { user, isAdmin, isInstructor, isHR, isSuperAdmin } = useAuth();
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [loading, setLoading] = useState(true);
  const [quizResults, setQuizResults] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [classes, setClasses] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  
  // Filters
  const [selectedQuiz, setSelectedQuiz] = useState('all');
  const [selectedProgram, setSelectedProgram] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState('all');
  
  // Mark override and review states
  const [editingResult, setEditingResult] = useState(null);
  const [overrideScore, setOverrideScore] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);
  const [bulkActionModal, setBulkActionModal] = useState({ open: false, action: null });
  const [sendEmailNotification, setSendEmailNotification] = useState(false);
  const [sendInAppNotification, setSendInAppNotification] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    if (user && programs.length > 0) {
      loadQuizResults();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedQuiz, selectedProgram, selectedSubject, selectedClass, selectedStudent, user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load programs, subjects, classes with permission filtering
      const [programsRes, subjectsRes, classesRes] = await Promise.all([
        getPrograms(),
        getSubjects(),
        getClasses()
      ]);

      let programsData = programsRes.success ? (programsRes.data || []) : [];
      let subjectsData = subjectsRes.success ? (subjectsRes.data || []) : [];
      let classesData = classesRes.success ? (classesRes.data || []) : [];

      // Filter for instructors: only show classes they have access to
      if (isInstructor && !isAdmin && !isSuperAdmin) {
        // Filter classes by instructorId or ownerEmail
        classesData = classesData.filter(c => 
          c.instructorId === user.uid || 
          c.ownerEmail === user.email ||
          c.instructor === user.email
        );
        
        // Get unique subject IDs from accessible classes
        const accessibleSubjectIds = new Set(classesData.map(c => c.subjectId).filter(Boolean));
        subjectsData = subjectsData.filter(s => accessibleSubjectIds.has(s.docId || s.id));
        
        // Get unique program IDs from accessible subjects
        const accessibleProgramIds = new Set(subjectsData.map(s => s.programId).filter(Boolean));
        programsData = programsData.filter(p => accessibleProgramIds.has(p.docId || p.id));
      }

      setPrograms(programsData);
      setSubjects(subjectsData);
      setClasses(classesData);

      // Load quizzes - filter by accessible classes for instructors
      let quizzesQuery = query(collection(db, 'quizzes'), orderBy('createdAt', 'desc'));
      const quizzesSnap = await getDocs(quizzesQuery);
      let quizzesData = quizzesSnap.docs.map(d => ({ id: d.id, docId: d.id, ...d.data() }));
      
      // Filter quizzes for instructors
      if (isInstructor && !isAdmin && !isSuperAdmin) {
        const accessibleClassIds = new Set(classesData.map(c => c.id || c.docId));
        quizzesData = quizzesData.filter(q => 
          !q.classId || accessibleClassIds.has(q.classId)
        );
      }
      
      setQuizzes(quizzesData);

      // Load students - filter by accessible classes for instructors
      if (isInstructor && !isAdmin && !isSuperAdmin) {
        // Get students from enrollments in accessible classes
        const accessibleClassIds = classesData.map(c => c.id || c.docId);
        const enrollmentsSnap = await getDocs(
          query(collection(db, 'enrollments'), where('classId', 'in', accessibleClassIds.slice(0, 10)))
        );
        const studentIds = new Set(enrollmentsSnap.docs.map(d => d.data().userId).filter(Boolean));
        const studentsData = await Promise.all(
          Array.from(studentIds).slice(0, 50).map(async (studentId) => {
            try {
              const studentDoc = await getDoc(doc(db, 'users', studentId));
              if (studentDoc.exists()) {
                return { id: studentId, docId: studentId, ...studentDoc.data() };
              }
            } catch (err) {
              console.warn('Failed to load student:', studentId, err);
            }
            return null;
          })
        );
        setStudents(studentsData.filter(Boolean));
      } else {
        // Admin/HR: load all students
        const studentsSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'student')));
        const studentsData = studentsSnap.docs.map(d => ({ id: d.id, docId: d.id, ...d.data() }));
        setStudents(studentsData);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter classes based on program/subject selection
  const filteredClasses = useMemo(() => {
    let result = classes;
    
    if (selectedProgram !== 'all') {
      result = result.filter(c => {
        if (!c.subjectId) return false;
        const subject = subjects.find(s => (s.docId || s.id) === c.subjectId);
        return subject?.programId === selectedProgram;
      });
    }
    
    if (selectedSubject !== 'all') {
      result = result.filter(c => (c.subjectId || '') === selectedSubject);
    }
    
    return result;
  }, [classes, subjects, selectedProgram, selectedSubject]);

  // Filter quizzes based on class selection
  const filteredQuizzes = useMemo(() => {
    if (selectedClass === 'all') return quizzes;
    return quizzes.filter(q => q.classId === selectedClass);
  }, [quizzes, selectedClass]);

  const loadQuizResults = async () => {
    setLoading(true);
    try {
      // Use quizSubmissions collection instead of quizResults (which doesn't exist in firestore rules)
      let q;
      
      // Build query - handle orderBy carefully as it might fail if no index
      try {
        if (selectedQuiz !== 'all') {
          q = query(
            collection(db, 'quizSubmissions'),
            where('quizId', '==', selectedQuiz),
            orderBy('submittedAt', 'desc')
          );
        } else {
          q = query(collection(db, 'quizSubmissions'), orderBy('submittedAt', 'desc'));
        }
      } catch (orderByError) {
        // If orderBy fails (no index), try without it
        console.warn('OrderBy failed, trying without:', orderByError);
        if (selectedQuiz !== 'all') {
          q = query(collection(db, 'quizSubmissions'), where('quizId', '==', selectedQuiz));
        } else {
          q = query(collection(db, 'quizSubmissions'));
        }
      }
      
      const resultsSnap = await getDocs(q);
      let results = resultsSnap.docs.map(d => {
        const data = d.data();
        return { 
          id: d.id, 
          docId: d.id, 
          ...data,
          // Ensure we have required fields
          quizId: data.quizId || null,
          userId: data.userId || null,
          score: data.score || 0,
          maxScore: data.maxScore || 100,
          submittedAt: data.submittedAt || null
        };
      });
      
      // Sort manually if orderBy failed
      if (results.length > 0 && results[0].submittedAt) {
        results.sort((a, b) => {
          const aTime = a.submittedAt?.toDate ? a.submittedAt.toDate().getTime() : (a.submittedAt ? new Date(a.submittedAt).getTime() : 0);
          const bTime = b.submittedAt?.toDate ? b.submittedAt.toDate().getTime() : (b.submittedAt ? new Date(b.submittedAt).getTime() : 0);
          return bTime - aTime;
        });
      }

      // Enrich with quiz, student, class, subject, program info (like enrollments)
      const enriched = await Promise.all(results.map(async (result) => {
        // Initialize with defaults (like HR Penalties)
        const enrichedResult = {
          ...result,
          id: result.id || result.docId,
          docId: result.docId || result.id,
          quizTitle: 'N/A',
          studentName: 'N/A',
          studentEmail: null,
          className: 'N/A',
          subjectName: 'N/A',
          programName: 'N/A',
          classSubjectId: null,
          subjectProgramId: null,
          quizClassId: null
        };

        try {
          // Get quiz info
          let quizData = null;
          if (result.quizId) {
            try {
              const quizDoc = await getDoc(doc(db, 'quizzes', result.quizId));
              if (quizDoc.exists()) {
                quizData = quizDoc.data();
                enrichedResult.quizTitle = quizData.title || quizData.name || 'Unknown Quiz';
                enrichedResult.quizClassId = quizData.classId || (quizData.assignedClassIds && quizData.assignedClassIds.length > 0 ? quizData.assignedClassIds[0] : null);
              }
            } catch (err) {
              console.warn('Failed to load quiz:', result.quizId, err);
            }
          }

          // Get student info
          if (result.userId) {
            try {
              const studentDoc = await getDoc(doc(db, 'users', result.userId));
              if (studentDoc.exists()) {
                const studentData = studentDoc.data();
                enrichedResult.studentName = studentData.displayName || studentData.email || 'N/A';
                enrichedResult.studentEmail = studentData.email;
              }
            } catch (err) {
              console.warn('Failed to load student:', result.userId, err);
            }
          }

          // Get class info - check multiple sources
          let classId = result.classId || enrichedResult.quizClassId;
          
          // If no classId from submission or quiz, try assignedClassIds from quiz
          if (!classId && quizData?.assignedClassIds && quizData.assignedClassIds.length > 0) {
            classId = quizData.assignedClassIds[0]; // Use first assigned class
          }
          
          if (classId) {
            try {
              const classDoc = await getDoc(doc(db, 'classes', classId));
              if (classDoc.exists()) {
                const classData = classDoc.data();
                enrichedResult.className = classData.name || classData.code || 'N/A';
                enrichedResult.classSubjectId = classData.subjectId;
              }
            } catch (err) {
              console.warn('Failed to load class:', classId, err);
            }
          }
          
          // Get subject info
          if (enrichedResult.classSubjectId) {
            try {
              const subjectDoc = await getDoc(doc(db, 'subjects', enrichedResult.classSubjectId));
              if (subjectDoc.exists()) {
                const subjectData = subjectDoc.data();
                enrichedResult.subjectName = subjectData.name_en || subjectData.name_ar || subjectData.code || 'N/A';
                enrichedResult.subjectProgramId = subjectData.programId;
              }
            } catch (err) {
              console.warn('Failed to load subject:', enrichedResult.classSubjectId, err);
            }
          }
          
          // Get program info
          if (enrichedResult.subjectProgramId) {
            try {
              const programDoc = await getDoc(doc(db, 'programs', enrichedResult.subjectProgramId));
              if (programDoc.exists()) {
                const programData = programDoc.data();
                enrichedResult.programName = programData.name_en || programData.name_ar || programData.code || 'N/A';
              }
            } catch (err) {
              console.warn('Failed to load program:', enrichedResult.subjectProgramId, err);
            }
          }
        } catch (err) {
          console.warn('Failed to enrich result:', err);
        }
        return enrichedResult;
      }));

      // Apply filters
      let filtered = enriched;
      
      // Filter by program
      if (selectedProgram !== 'all') {
        filtered = filtered.filter(r => r.subjectProgramId === selectedProgram);
      }
      
      // Filter by subject
      if (selectedSubject !== 'all') {
        filtered = filtered.filter(r => r.classSubjectId === selectedSubject);
      }
      
      // Filter by class
      if (selectedClass !== 'all') {
        filtered = filtered.filter(r => (r.classId || r.quizClassId) === selectedClass);
      }
      
      // Filter by student
      if (selectedStudent !== 'all') {
        filtered = filtered.filter(r => r.userId === selectedStudent);
      }
      
      // For instructors: additional filtering by accessible classes
      if (isInstructor && !isAdmin && !isSuperAdmin) {
        const accessibleClassIds = new Set(classes.map(c => c.id || c.docId));
        filtered = filtered.filter(r => {
          const classId = r.classId || r.quizClassId;
          return !classId || accessibleClassIds.has(classId);
        });
      }

      setQuizResults(filtered);
      
      // Log for debugging
      if (filtered.length === 0 && results.length > 0) {
        console.log('Results filtered out:', { total: results.length, filtered: filtered.length });
      }
    } catch (error) {
      console.error('Failed to load quiz results:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      toast?.error?.('Failed to load quiz results: ' + error.message);
      // Set empty array on error to prevent showing stale data
      setQuizResults([]);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      field: 'studentName',
      headerName: 'Student',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => {
        const row = params?.row || {};
        const studentName = row.studentName;
        if (studentName && studentName !== 'N/A') {
          return studentName;
        }
        if (row.studentEmail) {
          return row.studentEmail;
        }
        return 'N/A';
      }
    },
    {
      field: 'quizTitle',
      headerName: 'Quiz',
      flex: 1,
      minWidth: 200,
      valueGetter: (params) => {
        const row = params?.row || {};
        const quizTitle = row.quizTitle;
        if (quizTitle && quizTitle !== 'N/A') {
          return quizTitle;
        }
        return 'N/A';
      }
    },
    {
      field: 'programName',
      headerName: 'Program',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => {
        const row = params?.row || {};
        const programName = row.programName;
        if (programName && programName !== 'N/A') {
          return programName;
        }
        return 'N/A';
      }
    },
    {
      field: 'subjectName',
      headerName: 'Subject',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => {
        const row = params?.row || {};
        const subjectName = row.subjectName;
        if (subjectName && subjectName !== 'N/A') {
          return subjectName;
        }
        return 'N/A';
      }
    },
    {
      field: 'className',
      headerName: 'Class',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => {
        const row = params?.row || {};
        const className = row.className;
        if (className && className !== 'N/A') {
          return className;
        }
        return 'N/A';
      }
    },
    {
      field: 'score',
      headerName: 'Score',
      width: 200,
      renderCell: (params) => {
        const row = params.row;
        const score = row.overrideScore !== undefined ? row.overrideScore : (row.score || 0);
        const maxScore = row.maxScore || 100;
        const percentage = maxScore > 0 ? ((score / maxScore) * 100).toFixed(1) : 0;
        const isOverridden = row.overrideScore !== undefined;
        const isApproved = row.approved === true;
        const isReviewed = row.reviewed === true;
        
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 600 }}>{score}/{maxScore}</span>
              <Badge variant={percentage >= 80 ? 'success' : percentage >= 60 ? 'warning' : 'danger'}>
                {percentage}%
              </Badge>
              {isOverridden && (
                <Badge variant="outline" color="warning" size="small" title="Score overridden">
                  <Edit size={10} />
                </Badge>
              )}
              {isApproved ? (
                <Badge variant="success" size="small" title="Approved">
                  <Check size={10} />
                </Badge>
              ) : isReviewed ? (
                <Badge variant="warning" size="small" title="Reviewed but not approved">
                  <X size={10} />
                </Badge>
              ) : null}
            </div>
            {(isAdmin || isSuperAdmin || isInstructor) && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditingResult(row);
                  setOverrideScore(score.toString());
                }}
                title="Override score"
              >
                <Edit size={12} />
              </Button>
            )}
          </div>
        );
      }
    },
    {
      field: 'submittedAt',
      headerName: 'Submitted',
      width: 180,
      valueGetter: (params) => {
        const date = params.row.submittedAt?.toDate ? params.row.submittedAt.toDate() : new Date(params.row.submittedAt || 0);
        return date.toLocaleString('en-GB');
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 250,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const row = params.row;
        const isApproved = row.approved === true;
        
        return (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate(`/quiz-preview/${row.quizId}?resultId=${row.id}`)}
            >
              View Details
            </Button>
            {(isAdmin || isSuperAdmin || isInstructor) && (
              <>
                {!isApproved && (
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => handleApproveResult(row.id, true)}
                    title="Approve and notify student"
                  >
                    <Check size={12} />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSendNotification(row)}
                  title="Send notification"
                >
                  <Send size={12} />
                </Button>
              </>
            )}
          </div>
        );
      }
    }
  ];

  // Handler functions for mark override, approval, and notifications
  const handleOverrideScore = async () => {
    if (!editingResult || !overrideScore) return;
    
    const newScore = parseFloat(overrideScore);
    if (isNaN(newScore) || newScore < 0) {
      toast.error('Please enter a valid score');
      return;
    }

    try {
      const resultRef = doc(db, 'quizSubmissions', editingResult.id);
      await updateDoc(resultRef, {
        overrideScore: newScore,
        overrideBy: user.uid,
        overrideAt: new Date(),
        reviewed: true
      });

      // Update local state
      setQuizResults(prev => prev.map(r => 
        r.id === editingResult.id 
          ? { ...r, overrideScore: newScore, reviewed: true, overrideBy: user.uid }
          : r
      ));

      toast.success('Score overridden successfully');
      setEditingResult(null);
      setOverrideScore('');
    } catch (error) {
      console.error('Error overriding score:', error);
      toast.error('Failed to override score: ' + error.message);
    }
  };

  const handleApproveResult = async (resultId, sendNotification = false) => {
    try {
      const resultRef = doc(db, 'quizSubmissions', resultId);
      const result = quizResults.find(r => r.id === resultId);
      
      await updateDoc(resultRef, {
        approved: true,
        reviewed: true,
        approvedBy: user.uid,
        approvedAt: new Date()
      });

      // Update local state
      setQuizResults(prev => prev.map(r => 
        r.id === resultId 
          ? { ...r, approved: true, reviewed: true, approvedBy: user.uid }
          : r
      ));

      if (sendNotification && result) {
        await sendResultNotification(result, true);
      }

      toast.success('Result approved successfully');
    } catch (error) {
      console.error('Error approving result:', error);
      toast.error('Failed to approve result: ' + error.message);
    }
  };

  const handleSendNotification = async (result) => {
    await sendResultNotification(result, false);
  };

  const sendResultNotification = async (result, isApproval = false) => {
    try {
      // Get quiz and student info
      const [quizDoc, studentDoc] = await Promise.all([
        getDoc(doc(db, 'quizzes', result.quizId)),
        getDoc(doc(db, 'users', result.userId))
      ]);

      if (!quizDoc.exists() || !studentDoc.exists()) {
        toast.error('Quiz or student not found');
        return;
      }

      const quiz = quizDoc.data();
      const student = studentDoc.data();
      const score = result.overrideScore !== undefined ? result.overrideScore : (result.score || 0);
      const maxScore = result.maxScore || 100;
      const percentage = maxScore > 0 ? ((score / maxScore) * 100).toFixed(1) : 0;

      // Send in-app notification
      if (sendInAppNotification) {
        await addNotification({
          userId: result.userId,
          title: isApproval ? 'Quiz Graded and Approved' : 'Quiz Graded',
          message: `Your quiz "${quiz.title || 'Quiz'}" has been ${isApproval ? 'graded and approved' : 'graded'}. Score: ${score}/${maxScore} (${percentage}%)`,
          type: 'quiz',
          metadata: {
            quizId: result.quizId,
            submissionId: result.id,
            score: score,
            maxScore: maxScore,
            percentage: parseFloat(percentage),
            approved: isApproval
          },
          data: { quizId: result.quizId, submissionId: result.id }
        });
      }

      // Send email notification
      if (sendEmailNotification && student.email) {
        await sendEmail({
          to: student.email,
          template: 'quizGradeReleased',
          type: 'quiz',
          data: {
            studentName: student.displayName || student.email,
            quizTitle: quiz.title || 'Quiz',
            score: score,
            totalPoints: maxScore,
            percentage: parseFloat(percentage),
            passed: parseFloat(percentage) >= 60,
            resultsUrl: `${window.location.origin}/quiz-preview/${result.quizId}?resultId=${result.id}`,
            approved: isApproval
          },
          metadata: {
            quizId: result.quizId,
            submissionId: result.id
          }
        });
      }

      toast.success('Notification sent successfully');
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification: ' + error.message);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedRows.length === 0) {
      toast.error('Please select at least one result');
      return;
    }

    try {
      const batch = writeBatch(db);
      let count = 0;

      for (const rowId of selectedRows) {
        const result = quizResults.find(r => (r.id || r.docId) === rowId);
        if (result && !result.approved) {
          const resultRef = doc(db, 'quizSubmissions', result.id);
          batch.update(resultRef, {
            approved: true,
            reviewed: true,
            approvedBy: user.uid,
            approvedAt: new Date()
          });
          count++;
        }
      }

      if (count > 0) {
        await batch.commit();

        // Update local state
        setQuizResults(prev => prev.map(r => 
          selectedRows.includes(r.id || r.docId) && !r.approved
            ? { ...r, approved: true, reviewed: true, approvedBy: user.uid }
            : r
        ));

        // Send notifications if requested
        if (sendInAppNotification || sendEmailNotification) {
          for (const rowId of selectedRows) {
            const result = quizResults.find(r => (r.id || r.docId) === rowId);
            if (result && !result.approved) {
              await sendResultNotification(result, true);
            }
          }
        }

        toast.success(`Approved ${count} result(s) successfully`);
        setSelectedRows([]);
        setBulkActionModal({ open: false, action: null });
      }
    } catch (error) {
      console.error('Error bulk approving:', error);
      toast.error('Failed to approve results: ' + error.message);
    }
  };

  // Calculate enhanced statistics
  const stats = useMemo(() => {
    if (quizResults.length === 0) {
      return {
        total: 0,
        average: 0,
        passed: 0,
        failed: 0,
        passRate: 0,
        excellent: 0,
        good: 0,
        needsImprovement: 0,
        averageTime: 0,
        totalQuizzes: 0,
        uniqueStudents: 0
      };
    }

    const total = quizResults.length;
    const totalScore = quizResults.reduce((sum, r) => {
      const score = r.score || 0;
      const maxScore = r.maxScore || 100;
      return sum + (maxScore > 0 ? (score / maxScore) * 100 : 0);
    }, 0);
    const average = total > 0 ? (totalScore / total).toFixed(1) : 0;
    
    const passed = quizResults.filter(r => {
      const score = r.score || 0;
      const maxScore = r.maxScore || 100;
      const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
      return percentage >= 60;
    }).length;
    
    const failed = total - passed;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
    
    const excellent = quizResults.filter(r => {
      const score = r.score || 0;
      const maxScore = r.maxScore || 100;
      const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
      return percentage >= 90;
    }).length;
    
    const good = quizResults.filter(r => {
      const score = r.score || 0;
      const maxScore = r.maxScore || 100;
      const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
      return percentage >= 70 && percentage < 90;
    }).length;
    
    const needsImprovement = quizResults.filter(r => {
      const score = r.score || 0;
      const maxScore = r.maxScore || 100;
      const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
      return percentage < 60;
    }).length;
    
    // Calculate average time (if available)
    const timesWithValues = quizResults.filter(r => r.timeSpent && r.timeSpent > 0);
    const averageTime = timesWithValues.length > 0
      ? (timesWithValues.reduce((sum, r) => sum + (r.timeSpent || 0), 0) / timesWithValues.length / 60).toFixed(1)
      : 0;
    
    // Unique quizzes and students
    const uniqueQuizzes = new Set(quizResults.map(r => r.quizId).filter(Boolean)).size;
    const uniqueStudents = new Set(quizResults.map(r => r.userId).filter(Boolean)).size;

    return { 
      total, 
      average, 
      passed, 
      failed, 
      passRate,
      excellent,
      good,
      needsImprovement,
      averageTime,
      totalQuizzes: uniqueQuizzes,
      uniqueStudents
    };
  }, [quizResults]);

  if (loading && quizResults.length === 0) {
    return (
      <Container>
        <Loading message="Loading quiz results..." fancyVariant="dots" />
      </Container>
    );
  }

  return (
    <Container>
      <div style={{ marginBottom: '2rem' }}>

        {/* Enhanced Statistics Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { type: 'total-results', value: stats.total, suffix: '' },
            { type: 'average-score', value: stats.average, suffix: '%' },
            { type: 'passed', value: stats.passed, suffix: '' },
            { type: 'failed', value: stats.failed, suffix: '' },
            { type: 'pass-rate', value: stats.passRate, suffix: '%' },
            { type: 'excellent', value: stats.excellent, suffix: '' },
            { type: 'good', value: stats.good, suffix: '' },
            { type: 'needs-improvement', value: stats.needsImprovement, suffix: '' },
            { type: 'unique-students', value: stats.uniqueStudents, suffix: '' },
            { type: 'unique-quizzes', value: stats.totalQuizzes, suffix: '' }
          ].map((stat, idx) => {
            const config = getCardConfig(stat.type, t);
            const IconComponent = config.icon;
            const borderRadius = getShapeRadius(config.shape);
            
            return (
              <Card key={idx}>
                <CardBody>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ 
                      padding: '0.75rem', 
                      background: config.bg, 
                      borderRadius: borderRadius,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <IconComponent size={24} style={{ color: config.iconColor }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                        {config.label}
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: config.iconColor }}>
                        {stat.value}{stat.suffix}
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>

        {/* Enhanced Filters */}
        <Card style={{ marginBottom: '1.5rem' }}>
          <CardBody>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <Select
                searchable
                value={selectedProgram}
                onChange={(e) => {
                  setSelectedProgram(e.target.value);
                  setSelectedSubject('all');
                  setSelectedClass('all');
                }}
                options={[
                  { value: 'all', label: 'All Programs' },
                  ...programs.map(p => ({
                    value: p.docId || p.id,
                    label: p.name_en || p.name_ar || p.code || p.docId
                  }))
                ]}
                placeholder="Filter by Program"
                fullWidth
              />
              <Select
                searchable
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setSelectedClass('all');
                }}
                options={[
                  { value: 'all', label: 'All Subjects' },
                  ...subjects
                    .filter(s => selectedProgram === 'all' || s.programId === selectedProgram)
                    .map(s => ({
                      value: s.docId || s.id,
                      label: `${s.code || ''} - ${s.name_en || s.name_ar || s.docId}`.trim()
                    }))
                ]}
                placeholder="Filter by Subject"
                fullWidth
              />
              <Select
                searchable
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                options={[
                  { value: 'all', label: 'All Classes' },
                  ...filteredClasses.map(c => ({
                    value: c.id || c.docId,
                    label: `${c.name || c.code || c.id}${c.term ? ` (${c.term})` : ''}`
                  }))
                ]}
                placeholder="Filter by Class"
                fullWidth
              />
              <Select
                searchable
                value={selectedQuiz}
                onChange={(e) => setSelectedQuiz(e.target.value)}
                options={[
                  { value: 'all', label: 'All Quizzes' },
                  ...filteredQuizzes.map(q => ({
                    value: q.id || q.docId,
                    label: q.title || q.name || q.id
                  }))
                ]}
                placeholder="Filter by Quiz"
                fullWidth
              />
              <Select
                searchable
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                options={[
                  { value: 'all', label: 'All Students' },
                  ...students.map(s => ({
                    value: s.id || s.docId,
                    label: `${s.displayName || s.email}${s.email ? ` (${s.email})` : ''}`
                  }))
                ]}
                placeholder="Filter by Student"
                fullWidth
              />
            </div>
          </CardBody>
        </Card>

        {/* Bulk Actions */}
        {(isAdmin || isSuperAdmin || isInstructor) && selectedRows.length > 0 && (
          <Card style={{ marginBottom: '1rem' }}>
            <CardBody>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600 }}>
                  {selectedRows.length} result(s) selected
                </span>
                <Button
                  variant="success"
                  onClick={() => setBulkActionModal({ open: true, action: 'approve' })}
                >
                  <CheckSquare size={14} style={{ marginRight: '0.5rem' }} />
                  Approve Selected
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Send notifications to selected
                    selectedRows.forEach(rowId => {
                      const result = quizResults.find(r => (r.id || r.docId) === rowId);
                      if (result) sendResultNotification(result, false);
                    });
                    toast.success(`Sending notifications to ${selectedRows.length} student(s)...`);
                  }}
                >
                  <Send size={14} style={{ marginRight: '0.5rem' }} />
                  Send Notifications
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedRows([])}
                >
                  Clear Selection
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Results Table */}
        <Card>
          <CardBody>
            {loading ? (
              <Loading message="Loading results..." fancyVariant="dots" />
            ) : (
              <AdvancedDataGrid
                rows={quizResults}
                getRowId={(row) => row.docId || row.id}
                columns={columns}
                pageSize={25}
                pageSizeOptions={[10, 25, 50, 100]}
                checkboxSelection
                onSelectionModelChange={(newSelection) => setSelectedRows(newSelection)}
                selectionModel={selectedRows}
                exportFileName="quiz-results"
              />
            )}
          </CardBody>
        </Card>

        {/* Override Score Modal */}
        <Modal
          open={editingResult !== null}
          onClose={() => {
            setEditingResult(null);
            setOverrideScore('');
          }}
          title="Override Score"
        >
          {editingResult && (
            <div style={{ padding: '1rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <p><strong>Student:</strong> {editingResult.studentName}</p>
                <p><strong>Quiz:</strong> {editingResult.quizTitle}</p>
                <p><strong>Current Score:</strong> {editingResult.overrideScore !== undefined ? editingResult.overrideScore : editingResult.score}/{editingResult.maxScore}</p>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  New Score (0 - {editingResult.maxScore})
                </label>
                <Input
                  type="number"
                  min="0"
                  max={editingResult.maxScore}
                  value={overrideScore}
                  onChange={(e) => setOverrideScore(e.target.value)}
                  fullWidth
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditingResult(null);
                    setOverrideScore('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleOverrideScore}
                >
                  Save
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Bulk Approve Modal */}
        <Modal
          open={bulkActionModal.open && bulkActionModal.action === 'approve'}
          onClose={() => setBulkActionModal({ open: false, action: null })}
          title="Bulk Approve Results"
        >
          <div style={{ padding: '1rem' }}>
            <p style={{ marginBottom: '1rem' }}>
              Approve {selectedRows.length} selected result(s)? This will mark them as reviewed and approved.
            </p>
            <div style={{ marginBottom: '1rem' }}>
              <Checkbox
                label="Send in-app notification"
                checked={sendInAppNotification}
                onChange={(checked) => setSendInAppNotification(checked)}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <Checkbox
                label="Send email notification"
                checked={sendEmailNotification}
                onChange={(checked) => setSendEmailNotification(checked)}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <Button
                variant="ghost"
                onClick={() => setBulkActionModal({ open: false, action: null })}
              >
                Cancel
              </Button>
              <Button
                variant="success"
                onClick={handleBulkApprove}
              >
                Approve & Notify
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Container>
  );
};

export default QuizResultsPage;
