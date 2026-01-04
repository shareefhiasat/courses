/**
 * Student Dashboard - Completely Revamped
 * Features: PDF/Image Export, Compact View Toggle, Smart UI/UX
 * Serves: Students, HR, Instructors, Admins
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { 
  Container, Button, Select, Tabs, useToast, Loading, Card, CardBody, Badge, EmptyState
} from '../components/ui';
import InfoTooltip from '../components/ui/InfoTooltip/InfoTooltip';
import {
  RefreshCw, CheckCircle, Sparkles, Plus as PlusIcon, Download, FileImage, FileText, LayoutGrid, LayoutList, Clock,
  BarChart3, CalendarCheck, TrendingUp, Award, AlertTriangle, XCircle, User, UserCheck, UserX, UserMinus, Info
} from 'lucide-react';
import { getCardConfig, getShapeRadius } from '../utils/cardColors';
import { ACTIVITY_TYPES, ACTIVITY_TYPE_LABELS } from '../constants/activityTypes';
import { 
  getUserStatus, 
  getUserStatusSummary, 
  getStatusIconProps, 
  USER_STATUS,
  canParticipate,
  canViewDashboard
} from '../utils/userStatus';
import { collection, query, where, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getAttendanceByStudent, getAttendanceStats } from '../firebase/attendance';
import { getPenalties, getAbsences, PENALTY_TYPES } from '../firebase/penalties';
import { getStudentMarks } from '../firebase/grading';
import { getSubjects, getPrograms } from '../firebase/programs';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import styles from './StudentDashboardPage_NEW.module.css';

// Participation and Behavior Types
const PARTICIPATION_TYPES = [
  { id: 'explain_lesson', label_ar: 'شرح الدرس', label_en: 'Explained Lesson' },
  { id: 'gave_project', label_ar: 'قدم مشروع', label_en: 'Gave Project' },
  { id: 'gave_paper', label_ar: 'قدم ورقة', label_en: 'Gave Paper' },
  { id: 'gave_research', label_ar: 'قدم بحث', label_en: 'Gave Research' },
  { id: 'active_discussion', label_ar: 'نقاش نشط', label_en: 'Active Discussion' },
  { id: 'answered_question', label_ar: 'أجاب على سؤال', label_en: 'Answered Question' },
  { id: 'helped_classmate', label_ar: 'ساعد زميل', label_en: 'Helped Classmate' },
  { id: 'other', label_ar: 'أخرى', label_en: 'Other' }
];

const BEHAVIOR_TYPES = [
  { id: 'talk_in_class', label_ar: 'التحدث في الصف', label_en: 'Talk in Class' },
  { id: 'sleep', label_ar: 'النوم', label_en: 'Sleep' },
  { id: 'bathroom_requests', label_ar: 'طلبات الحمام المتكررة', label_en: 'Frequent Bathroom Requests' },
  { id: 'mobile_in_class', label_ar: 'استخدام الهاتف', label_en: 'Mobile Phone in Class' },
  { id: 'disruptive', label_ar: 'سلوك مشتت', label_en: 'Disruptive Behavior' },
  { id: 'late_arrival', label_ar: 'تأخر الوصول', label_en: 'Late Arrival' },
  { id: 'inappropriate_language', label_ar: 'لغة غير لائقة', label_en: 'Inappropriate Language' },
  { id: 'other', label_ar: 'أخرى', label_en: 'Other' }
];

export default function StudentDashboardPage() {
  const { t, lang } = useLang();
  const { user, userProfile, isAdmin, isInstructor, isHR, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const exportRef = useRef(null);
  
  // State
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [quizResults, setQuizResults] = useState([]);
  const [classes, setClasses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [penalties, setPenalties] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [participations, setParticipations] = useState([]);
  const [behaviors, setBehaviors] = useState([]);
  const [studentMarks, setStudentMarks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [programs, setPrograms] = useState([]);
  
  // View modes
  const [viewMode, setViewMode] = useState('overview');
  const [isCompactView, setIsCompactView] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // Filters
  const [selectedProgram, setSelectedProgram] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [taskFilter, setTaskFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // For admin/instructor viewing student dashboard
  const [studentsList, setStudentsList] = useState([]);

  // Determine which user's data to show
  const displayUserId = selectedStudent || user?.uid;
  const displayName = selectedStudent 
    ? studentsList.find(s => s.id === selectedStudent)?.displayName || 'Student'
    : userProfile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Student';

  useEffect(() => {
    if (user) {
      console.log('🔍 [StudentDashboard] Current user:', { 
        uid: user.uid, 
        email: user.email,
        displayName: user.displayName,
        isAdmin,
        isInstructor,
        isHR,
        isSuperAdmin
      });
      console.log('🔍 [StudentDashboard] Loading data for user:', displayUserId, 'selectedStudent:', selectedStudent);
      loadDashboardData();
    }
  }, [user, selectedStudent, displayUserId, isAdmin, isInstructor, isHR, isSuperAdmin, selectedProgram, selectedSubject, selectedClass]);

  useEffect(() => {
    if (isAdmin || isInstructor || isHR) {
      loadStudentsList();
    }
  }, [isAdmin, isInstructor, isHR]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const targetUserId = displayUserId;
      console.log('🔍 [StudentDashboard] Loading dashboard data for user ID:', targetUserId);

      // Load classes and enrollments
      const enrollmentsQuery = query(
        collection(db, 'enrollments'),
        where('userId', '==', targetUserId)
      );
      const enrollmentsSnap = await getDocs(enrollmentsQuery);
      const enrollmentsData = enrollmentsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('🔍 [StudentDashboard] Found enrollments:', enrollmentsData.length, enrollmentsData);
      setEnrollments(enrollmentsData);

      const classIds = enrollmentsData.map(e => e.classId).filter(Boolean);
      
      // Load classes
      if (classIds.length > 0) {
        const classesData = [];
        for (const classId of classIds) {
          try {
            const classDoc = await getDoc(doc(db, 'classes', classId));
            if (classDoc.exists()) {
              classesData.push({ id: classDoc.id, ...classDoc.data() });
            }
          } catch (err) {
            console.warn('Failed to load class:', classId, err);
          }
        }
        setClasses(classesData);
      }

      // Load activities
      try {
        if (classIds.length > 0) {
          // Use 'in' query for up to 10 classes
          const limitedClassIds = classIds.slice(0, 10);
          try {
            const activitiesQuery = query(collection(db, 'activities'), where('classId', 'in', limitedClassIds));
            const activitiesSnap = await getDocs(activitiesQuery);
            const activitiesData = activitiesSnap.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            
            // Load submissions
            const submissionsQuery = query(
              collection(db, 'submissions'),
              where('userId', '==', targetUserId)
            );
            const submissionsSnap = await getDocs(submissionsQuery);
            const submissionsData = submissionsSnap.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setSubmissions(submissionsData);

            // Load quiz results
            const quizResultsQuery = query(
              collection(db, 'quizResults'),
              where('userId', '==', targetUserId)
            );
            const quizResultsSnap = await getDocs(quizResultsQuery);
            const quizResultsData = quizResultsSnap.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setQuizResults(quizResultsData);

            // Combine into tasks array
            const tasksArray = activitiesData.map(activity => {
              const submission = submissionsData.find(s => s.activityId === activity.id);
              const quizResult = quizResultsData.find(q => q.quizId === activity.id);
              
              return {
                id: activity.id,
                title: activity.title_en || activity.title,
                type: activity.type || ACTIVITY_TYPES.QUIZ,
                classId: activity.classId,
                className: classesData.find(c => c.id === activity.classId)?.name || 'Unknown',
                deadline: activity.deadline,
                status: getTaskStatus(activity, submission, quizResult),
                score: quizResult?.percentage || submission?.score,
                maxScore: activity.maxScore || 100,
                isGraded: !!submission?.grade || !!quizResult,
                allowRetake: activity.allowRetake || activity.settings?.allowRetake,
                completedAt: submission?.submittedAt || quizResult?.completedAt,
                ...activity
              };
            });

            setTasks(tasksArray);
          } catch (permError) {
            // Permission error - skip activities loading (non-critical)
            console.warn('No permission to load activities (non-critical):', permError);
            setTasks([]);
          }
        } else {
          // No classes enrolled - skip activities
          setTasks([]);
        }
      } catch (error) {
        console.warn('Failed to load activities/tasks:', error);
        setTasks([]);
      }

      // Load attendance data
      try {
        const attendanceResult = await getAttendanceByStudent(targetUserId);
        if (attendanceResult.success) {
          setAttendance(attendanceResult.data);
        }
      } catch (error) {
        console.warn('Failed to load attendance:', error);
      }

      // Load attendance stats for all enrolled classes
      if (classIds.length > 0) {
        try {
          const statsPromises = classIds.map(classId => getAttendanceStats(classId, targetUserId));
          const statsResults = await Promise.all(statsPromises);
          const combinedStats = statsResults.reduce((acc, result) => {
            if (result.success && result.data) {
              acc.totalSessions += result.data.totalSessions || 0;
              acc.present += result.data.present || 0;
              acc.absent += result.data.absent || 0;
              acc.late += result.data.late || 0;
              acc.leave += result.data.leave || 0;
            }
            return acc;
          }, { totalSessions: 0, present: 0, absent: 0, late: 0, leave: 0 });
          
          combinedStats.attendanceRate = combinedStats.totalSessions > 0
            ? ((combinedStats.present / combinedStats.totalSessions) * 100).toFixed(1)
            : 0;
          
          setAttendanceStats(combinedStats);
        } catch (error) {
          console.warn('Failed to load attendance stats:', error);
        }
      }

      // Load penalties
      try {
        const penaltiesResult = await getPenalties(targetUserId);
        if (penaltiesResult.success) {
          setPenalties(penaltiesResult.data || []);
        }
      } catch (error) {
        console.warn('Failed to load penalties:', error);
      }

      // Load absences
      try {
        const absencesResult = await getAbsences(targetUserId);
        if (absencesResult.success) {
          setAbsences(absencesResult.data || []);
        }
      } catch (error) {
        console.warn('Failed to load absences:', error);
      }

      // Load participations - with permission handling
      try {
        const participationsQuery = query(
          collection(db, 'participations'),
          where('studentId', '==', targetUserId),
          orderBy('createdAt', 'desc')
        );
        const participationsSnap = await getDocs(participationsQuery);
        const participationsData = participationsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setParticipations(participationsData);
      } catch (error) {
        const message = String(error?.message || '').toLowerCase();
        const code = error?.code || '';
        if (code === 'permission-denied' || message.includes('missing or insufficient permissions')) {
          console.warn('StudentDashboard: permission denied for participations, showing empty');
          setParticipations([]);
        } else {
          console.warn('Failed to load participations:', error);
        }
      }

      // Load behaviors - with permission handling
      try {
        const behaviorsQuery = query(
          collection(db, 'behaviors'),
          where('studentId', '==', targetUserId),
          orderBy('createdAt', 'desc')
        );
        const behaviorsSnap = await getDocs(behaviorsQuery);
        const behaviorsData = behaviorsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setBehaviors(behaviorsData);
      } catch (error) {
        const message = String(error?.message || '').toLowerCase();
        const code = error?.code || '';
        if (code === 'permission-denied' || message.includes('missing or insufficient permissions')) {
          console.warn('StudentDashboard: permission denied for behaviors, showing empty');
          setBehaviors([]);
        } else {
          console.warn('Failed to load behaviors:', error);
        }
      }

      // Load student marks
      try {
        const marksResult = await getStudentMarks(targetUserId);
        if (marksResult.success) {
          setStudentMarks(marksResult.data || []);
        }
      } catch (error) {
        console.warn('Failed to load student marks:', error);
      }

      // Load subjects and programs
      try {
        const [subjectsResult, programsResult] = await Promise.all([
          getSubjects(),
          getPrograms()
        ]);
        if (subjectsResult.success) {
          setSubjects(subjectsResult.data || []);
        }
        if (programsResult.success) {
          setPrograms(programsResult.data || []);
        }
      } catch (error) {
        console.warn('Failed to load subjects/programs:', error);
      }

    } catch (error) {
      const message = String(error?.message || '').toLowerCase();
      const code = error?.code || '';

      if (code === 'permission-denied' || message.includes('missing or insufficient permissions')) {
        console.warn('StudentDashboard: permission denied, showing empty dashboard view');
        setTasks([]);
        setEnrollments([]);
        setQuizResults([]);
        setSubmissions([]);
        setAttendance([]);
        setPenalties([]);
        setAbsences([]);
        setParticipations([]);
        setBehaviors([]);
        setStudentMarks([]);
      } else {
        console.error('Error loading dashboard:', error);
        toast?.error?.('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadStudentsList = async () => {
    try {
      console.log('🔍 [StudentDashboard] Loading students list...');
      
      // Load all students
      const usersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'student')));
      console.log(`🔍 [StudentDashboard] Found ${usersSnap.size} students in collection`);

      // Load all enrollments
      const enrollmentsSnap = await getDocs(collection(db, 'enrollments'));
      console.log(`🔍 [StudentDashboard] Found ${enrollmentsSnap.size} enrollments`);

      // Create a map of userId -> [enrollments]
      const enrollmentsByUser = {};
      enrollmentsSnap.docs.forEach(doc => {
        const data = doc.data();
        const userId = data.userId;
        if (userId) {
          if (!enrollmentsByUser[userId]) {
            enrollmentsByUser[userId] = [];
          }
          enrollmentsByUser[userId].push({ id: doc.id, ...data });
        }
      });

      const students = usersSnap.docs
        .map(doc => {
          const data = doc.data();
          const studentId = doc.id;
          const studentEnrollments = enrollmentsByUser[studentId] || [];
          const hasEnrollments = studentEnrollments.length > 0;
          
          // Get user status using utility
          const status = getUserStatus(data, studentEnrollments);
          const statusSummary = getUserStatusSummary(data, studentEnrollments);
          
          return {
            id: studentId,
            docId: studentId,
            ...data,
            displayName: data.displayName || data.name || data.email?.split('@')[0] || 'Unknown',
            hasEnrollments,
            enrollmentCount: studentEnrollments.length,
            status,
            statusSummary,
            email: data.email || 'no-email@example.com'
          };
        });

      console.log('🔍 [StudentDashboard] Processed students:', students.map(s => ({
        id: s.id,
        name: s.displayName,
        email: s.email,
        status: s.status,
        enrollments: s.enrollmentCount,
        canParticipate: s.statusSummary?.canParticipate,
        canViewDashboard: s.statusSummary?.canViewDashboard
      })));

      // Log current user status
      if (user) {
        const currentUserInList = students.find(s => s.id === user.uid);
        if (currentUserInList) {
          console.log('🔍 [StudentDashboard] Current user status:', {
            id: currentUserInList.id,
            email: currentUserInList.email,
            status: currentUserInList.status,
            enrollments: currentUserInList.enrollmentCount,
            canParticipate: currentUserInList.statusSummary?.canParticipate,
            canViewDashboard: currentUserInList.statusSummary?.canViewDashboard
          });
        } else {
          console.log('🔍 [StudentDashboard] Current user not found in students list:', {
            uid: user.uid,
            email: user.email,
            role: user.role
          });
        }
      }
      
      setStudentsList(students);
    } catch (error) {
      console.error('Error loading students:', error);
      setStudentsList([]);
    }
  };

  const getTaskStatus = (activity, submission, quizResult) => {
    if (quizResult || submission?.submittedAt) {
      return 'completed';
    }
    
    if (activity.deadline) {
      const deadline = activity.deadline.toDate();
      const now = new Date();
      
      if (now > deadline) {
        return 'overdue';
      }
      
      const hoursUntilDeadline = (deadline - now) / (1000 * 60 * 60);
      if (hoursUntilDeadline <= 24) {
        return 'urgent';
      }
    }
    
    return 'pending';
  };

  // Filter tasks based on top-level filters
  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];

    // Filter by program
    if (selectedProgram !== 'all') {
      filtered = filtered.filter(t => {
        const taskClass = classes.find(c => c.id === t.classId);
        if (!taskClass) return false;
        const taskSubject = subjects.find(s => (s.docId || s.id) === taskClass.subjectId);
        return taskSubject?.programId === selectedProgram;
      });
    }

    // Filter by subject
    if (selectedSubject !== 'all') {
      filtered = filtered.filter(t => {
        const taskClass = classes.find(c => c.id === t.classId);
        return taskClass?.subjectId === selectedSubject;
      });
    }

    // Filter by class
    if (selectedClass !== 'all') {
      filtered = filtered.filter(t => t.classId === selectedClass);
    }

    // Filter by task type
    if (taskFilter !== 'all') {
      filtered = filtered.filter(t => t.type === taskFilter);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    return filtered.sort((a, b) => {
      if (a.status === 'urgent' && b.status !== 'urgent') return -1;
      if (a.status !== 'urgent' && b.status === 'urgent') return 1;
      if (a.status === 'overdue' && b.status !== 'overdue') return -1;
      if (a.status !== 'overdue' && b.status === 'overdue') return 1;
      return 0;
    });
  }, [tasks, classes, subjects, selectedProgram, selectedSubject, selectedClass, taskFilter, statusFilter]);

  // Calculate comprehensive stats
  const stats = useMemo(() => {
    const enrolledCount = enrollments.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const totalTasks = tasks.length;
    const totalHours = Math.round(tasks.filter(t => t.status === 'completed').length * 1.5);
    const gradedTasks = tasks.filter(t => t.isGraded && t.score != null);
    const avgGrade = gradedTasks.length > 0
      ? Math.round(gradedTasks.reduce((sum, t) => sum + t.score, 0) / gradedTasks.length)
      : 0;

    // Additional stats
    const totalPenalties = penalties.length;
    const totalParticipations = participations.length;
    const totalBehaviors = behaviors.length;
    const totalAbsences = absences.length;
    const participationScore = totalParticipations - totalBehaviors; // Net participation

    return {
      enrolledClasses: enrolledCount,
      completedTasks,
      totalTasks,
      totalHours,
      avgGrade,
      completionRate: totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0,
      totalPenalties,
      totalParticipations,
      totalBehaviors,
      totalAbsences,
      participationScore
    };
  }, [tasks, enrollments, penalties, participations, behaviors, absences]);

  // Urgent tasks
  const urgentTasks = useMemo(() => {
    return tasks
      .filter(t => t.status === 'urgent' || t.status === 'overdue')
      .slice(0, 3);
  }, [tasks]);

  // Export to PDF
  const handleExportPDF = async () => {
    if (!exportRef.current) return;
    
    setExporting(true);
    try {
      const canvas = await html2canvas(exportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`student-dashboard-${displayName}-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Dashboard exported to PDF successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export PDF: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  // Export to Image
  const handleExportImage = async () => {
    if (!exportRef.current) return;
    
    setExporting(true);
    try {
      const canvas = await html2canvas(exportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `student-dashboard-${displayName}-${new Date().toISOString().split('T')[0]}.png`;
      link.href = imgData;
      link.click();
      toast.success('Dashboard exported to image successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export image: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <Loading fullscreen variant="overlay" message={t('loading') || 'Loading dashboard...'} fancyVariant="dots" />;
  }

  return (
    <div className={styles.dashboard} ref={exportRef}>
      <Container maxWidth="xxl">
        {/* Header with Export Options */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.headerLeft}>
              <div className={styles.welcomeSection}>
              </div>
            </div>
            
            <div className={styles.headerRight}>
            </div>
          </div>
        </div>

        {/* Top-Level Filters */}
        <Card style={{ marginBottom: '1.5rem' }}>
          <CardBody>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
              {(isAdmin || isInstructor || isHR) && (
                <Select
                  searchable
                  value={selectedStudent || ''}
                  onChange={(e) => {
                    const value = e?.target?.value || e?.value || e || '';
                    console.log('🔍 [StudentDashboard] User selected:', value);
                    setSelectedStudent(value || null);
                  }}
                  options={[
                    { 
                      value: '', 
                      label: (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <User size={16} />
                          <span>{t('view_my_dashboard') || 'View My Dashboard'}</span>
                        </div>
                      ) 
                    },
                    ...studentsList.map(student => {
                      const status = student.status || USER_STATUS.ACTIVE;
                      const iconProps = getStatusIconProps(status);
                      const IconComponent = {
                        'UserCheck': UserCheck,
                        'UserX': UserX,
                        'UserMinus': UserMinus,
                        'AlertCircle': AlertTriangle,
                        'Info': Info
                      }[iconProps.name] || User;
                      
                      const isDisabled = status === USER_STATUS.DELETED;
                      const statusLabel = student.statusSummary?.label || status;
                      
                      return {
                        value: student.id || student.docId,
                        label: (
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            gap: 8,
                            opacity: isDisabled ? 0.7 : 1
                          }}>
                            <IconComponent size={16} color={iconProps.color} />
                            <span style={{ 
                              textDecoration: isDisabled ? 'line-through' : 'none',
                              flex: 1
                            }}>
                              {student.displayName || student.email || 'Unknown'}
                            </span>
                            <span style={{ 
                              fontSize: '0.8em',
                              color: '#9CA3AF',
                              marginLeft: 'auto'
                            }}>
                              {statusLabel}
                              {student.enrollmentCount > 0 && ` • ${student.enrollmentCount} ${t('enrollments') || 'enrollments'}`}
                            </span>
                          </div>
                        ),
                        disabled: isDisabled
                      };
                    })
                  ]}
                  placeholder={t('select_user') || "Select User"}
                  style={{ minWidth: 250 }}
                />
              )}
              <Select
                searchable
                value={selectedProgram}
                onChange={(e) => {
                  setSelectedProgram(e.target.value);
                  setSelectedSubject('all');
                  setSelectedClass('all');
                  if (isAdmin || isInstructor || isHR) {
                    setSelectedStudent(null);
                  }
                }}
                options={[
                  { value: 'all', label: t('all_programs') || 'All Programs' },
                  ...programs.map(p => ({
                    value: p.docId || p.id,
                    label: p.name_en || p.name_ar || p.code || p.docId
                  }))
                ]}
                placeholder={t('all_programs') || 'All Programs'}
                style={{ minWidth: 200 }}
              />
              <Select
                searchable
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setSelectedClass('all');
                  if (isAdmin || isInstructor || isHR) {
                    setSelectedStudent(null);
                  }
                }}
                options={[
                  { value: 'all', label: t('all_subjects') || 'All Subjects' },
                  ...subjects
                    .filter(s => selectedProgram === 'all' || s.programId === selectedProgram)
                    .map(s => ({
                      value: s.docId || s.id,
                      label: `${s.code || ''} - ${s.name_en || s.name_ar || s.docId}`.trim()
                    }))
                ]}
                placeholder={t('all_subjects') || 'All Subjects'}
                style={{ minWidth: 200 }}
              />
              <Select
                searchable
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  if (isAdmin || isInstructor || isHR) {
                    setSelectedStudent(null);
                  }
                }}
                options={[
                  { value: 'all', label: t('all_classes') || 'All Classes' },
                  ...classes
                    .filter(c => {
                      if (selectedProgram !== 'all') {
                        const subject = subjects.find(s => (s.docId || s.id) === c.subjectId);
                        return subject?.programId === selectedProgram;
                      }
                      if (selectedSubject !== 'all') {
                        return c.subjectId === selectedSubject;
                      }
                      // Filter for instructors
                      if (isInstructor && !isAdmin && !isSuperAdmin) {
                        return c.instructorId === user.uid || c.ownerEmail === user.email || c.instructor === user.email;
                      }
                      return true;
                    })
                    .map(c => ({
                      value: c.id || c.docId,
                      label: `${c.name || c.code || c.id}${c.term ? ` (${c.term})` : ''}`
                    }))
                ]}
                placeholder={t('select_class') || 'Select Class'}
                style={{ minWidth: 200 }}
              />
              </div>
              <div className={styles.actionButtons} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCompactView(!isCompactView)}
                  icon={isCompactView ? <LayoutGrid size={16} /> : <LayoutList size={16} />}
                  tooltip={isCompactView ? 'Switch to Full View' : 'Switch to Compact View'}
                  className={styles.actionButton}
                >
                  {isCompactView ? 'Full View' : 'Compact'}
                </Button>
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={handleExportImage}
                  loading={exporting}
                  icon={<FileImage size={16} />}
                  tooltip="Export as Image"
                  className={styles.actionButton}
                >
                  Image
                </Button>
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={handleExportPDF}
                  loading={exporting}
                  icon={<FileText size={16} />}
                  tooltip="Export as PDF"
                  className={styles.actionButton}
                >
                  PDF
                </Button>
                <Button variant="outline" size="sm" onClick={loadDashboardData}>
                  <RefreshCw size={16} /> {t('refresh') || 'Refresh'}
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Enhanced Stats Cards */}
        <div className={styles.statsGrid}>
          {[
            { type: 'enrolled-classes', value: stats.enrolledClasses, suffix: '' },
            { type: 'tasks-completed', value: `${stats.completedTasks}/${stats.totalTasks}`, suffix: '', subtext: `${stats.completionRate}% ${t('complete') || 'Complete'}` },
            { type: 'average-grade', value: stats.avgGrade, suffix: '%' },
            { type: 'attendance-rate', value: attendanceStats?.attendanceRate || 0, suffix: '%', subtext: `${attendanceStats?.present || 0}/${attendanceStats?.totalSessions || 0} ${t('sessions') || 'sessions'}` },
            ...(!isCompactView ? [
              { type: 'participations', value: stats.totalParticipations, suffix: '' },
              { type: 'penalties', value: stats.totalPenalties, suffix: '' },
              { type: 'behaviors', value: stats.totalBehaviors, suffix: '' },
              { type: 'net-participation', value: stats.participationScore || stats.netParticipation || 0, suffix: '', subtext: `${stats.totalParticipations || 0} + / ${stats.totalBehaviors || 0} -` }
            ] : [])
          ].map((stat, idx) => {
            const config = getCardConfig(stat.type, t);
            const IconComponent = config.icon;
            const borderRadius = getShapeRadius(config.shape);
            
            // Tooltip content for each card type
            const tooltips = {
              'enrolled-classes': t('tooltip_enrolled_classes') || 'Total number of classes you are currently enrolled in. This includes all active class enrollments.',
              'tasks-completed': t('tooltip_tasks_completed') || 'Number of completed tasks out of total assigned tasks. Shows your task completion progress and percentage.',
              'average-grade': t('tooltip_average_grade') || 'Your overall average grade percentage across all graded assignments, quizzes, and exams.',
              'attendance-rate': t('tooltip_attendance_rate') || 'Percentage of class sessions you have attended. Shows present sessions out of total sessions.',
              'participations': t('tooltip_participations') || 'Total number of positive participation points earned through active engagement in class activities.',
              'penalties': t('tooltip_penalties') || 'Total number of penalties received. These are negative points for rule violations or misconduct.',
              'behaviors': t('tooltip_behaviors') || 'Total number of behavior incidents recorded. These may affect your participation score.',
              'net-participation': t('tooltip_net_participation') || 'Net participation score calculated as positive participations minus negative behaviors. Shows your overall engagement balance.'
            };
            
            return (
              <Card key={idx} className={styles.statCard} style={{ position: 'relative', overflow: 'visible' }}>
                <CardBody>
                  <div className={styles.statCardContent}>
                    <div className={styles.statIcon} style={{ background: config.gradient, borderRadius: borderRadius }}>
                      <IconComponent size={20} />
                    </div>
                    <div className={styles.statInfo} style={{ position: 'relative', overflow: 'visible', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <div className={styles.statValue}>{stat.value}{stat.suffix}</div>
                        <div style={{ position: 'relative', zIndex: 10000 }}>
                          <InfoTooltip>
                            <div style={{ padding: '0.5rem', fontSize: '0.875rem', lineHeight: '1.5', maxWidth: '250px', whiteSpace: 'normal' }}>
                              {tooltips[stat.type] || config.label}
                            </div>
                          </InfoTooltip>
                        </div>
                      </div>
                      <div className={styles.statLabel}>{config.label}</div>
                      {stat.subtext && <div className={styles.statSubtext}>{stat.subtext}</div>}
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>

        {/* View Mode Tabs */}
        <div className={styles.viewModeTabs}>
          <Tabs
            activeTab={viewMode}
            onTabChange={setViewMode}
            tabs={[
              { value: 'overview', label: t('overview') || 'Overview', icon: <BarChart3 size={16} /> },
              { value: 'tasks', label: t('my_tasks') || 'My Tasks', icon: <CheckCircle size={16} /> },
              { value: 'attendance', label: t('attendance') || 'Attendance', icon: <CalendarCheck size={16} /> },
              { value: 'performance', label: t('performance') || 'Performance', icon: <TrendingUp size={16} /> },
              { value: 'marks', label: t('marks') || 'Marks', icon: <Award size={16} /> },
              { value: 'penalties', label: t('penalties') || 'Penalties', icon: <AlertTriangle size={16} /> },
              { value: 'participations', label: t('participations') || 'Participations', icon: <PlusIcon size={16} /> },
              { value: 'behaviors', label: t('behaviors') || 'Behaviors', icon: <XCircle size={16} /> }
            ]}
            size="lg"
          />
        </div>

        {/* Content based on view mode */}
        {viewMode === 'overview' && (
          <div className={isCompactView ? styles.compactView : styles.fullView}>
            <div style={{ display: 'grid', gridTemplateColumns: isCompactView ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {/* Urgent Tasks */}
              {urgentTasks.length > 0 && (
                <Card>
                  <CardBody>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertTriangle size={20} style={{ color: '#ef4444' }} />
                        {t('urgent_tasks') || 'Urgent Tasks'}
                      </h3>
                      <Badge variant="danger">{urgentTasks.length}</Badge>
                    </div>
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      {urgentTasks.map(task => (
                        <div key={task.id} style={{ 
                          padding: '0.75rem', 
                          background: '#fef2f2', 
                          borderRadius: 8, 
                          border: '1px solid #fecaca' 
                        }}>
                          <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{task.title}</div>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            {task.className} • Due {task.deadline?.toDate ? task.deadline.toDate().toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setViewMode('tasks')} style={{ marginTop: '1rem', width: '100%' }}>
                      {t('view_all_tasks') || 'View All Tasks'} →
                    </Button>
                  </CardBody>
                </Card>
              )}

              {/* Recent Attendance */}
              <Card>
                <CardBody>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CalendarCheck size={20} style={{ color: '#10b981' }} />
                      {t('recent_attendance') || 'Recent Attendance'}
                    </h3>
                  </div>
                  {attendance.length === 0 ? (
                    <EmptyState
                      icon={CalendarCheck}
                      title={t('no_attendance_records') || 'No attendance records yet'}
                      description={t('attendance_will_appear_here') || 'Your attendance will appear here once classes begin'}
                    />
                  ) : (
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                      {attendance.slice(0, 5).map((record, idx) => (
                        <div key={idx} style={{ 
                          padding: '0.75rem', 
                          background: '#f0fdf4', 
                          borderRadius: 8,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                              {record.className || 'Unknown Class'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                              {record.date?.toDate ? record.date.toDate().toLocaleDateString() : 'N/A'}
                            </div>
                          </div>
                          <Badge variant={record.status === 'present' ? 'success' : record.status === 'late' ? 'warning' : 'danger'}>
                            {record.status || 'N/A'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => setViewMode('attendance')} style={{ marginTop: '1rem', width: '100%' }}>
                    {t('view_full_history') || 'View Full History'} →
                  </Button>
                </CardBody>
              </Card>

              {/* Performance Summary */}
              <Card>
                <CardBody>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <TrendingUp size={20} style={{ color: '#3b82f6' }} />
                      {t('performance_summary') || 'Performance Summary'}
                    </h3>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                        {stats.completedTasks}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        {t('completed_tasks') || 'Completed Tasks'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                        {stats.avgGrade}%
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        {t('average_score') || 'Average Score'}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setViewMode('performance')} style={{ marginTop: '1rem', width: '100%' }}>
                    {t('view_full_performance') || 'View Full Performance'} →
                  </Button>
                </CardBody>
              </Card>
            </div>
          </div>
        )}

        {viewMode === 'tasks' && (
          <div className={isCompactView ? styles.compactView : styles.fullView}>
            <Card>
              <CardBody>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <h2 style={{ margin: 0 }}>{t('my_tasks') || 'My Tasks'}</h2>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <Select
                      value={taskFilter}
                      onChange={(e) => setTaskFilter(e.target.value)}
                      options={[
                        { value: 'all', label: t('all_types') || 'All Types' },
                        { value: 'quiz', label: t('quizzes') || 'Quizzes' },
                        { value: 'homework', label: t('homework') || 'Homework' },
                        { value: 'training', label: t('training') || 'Training' },
                        { value: 'labandproject', label: t('lab_and_project') || 'Lab & Project' }
                      ]}
                      style={{ minWidth: 150 }}
                    />
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      options={[
                        { value: 'all', label: t('all_status') || 'All Status' },
                        { value: 'pending', label: t('pending') || 'Pending' },
                        { value: 'urgent', label: t('urgent') || 'Urgent' },
                        { value: 'overdue', label: t('overdue') || 'Overdue' },
                        { value: 'completed', label: t('completed') || 'Completed' }
                      ]}
                      style={{ minWidth: 150 }}
                    />
                  </div>
                </div>
                {filteredTasks.length === 0 ? (
                  <EmptyState
                    icon={CheckCircle}
                    title={t('no_tasks_assigned') || 'No tasks assigned yet'}
                    description={t('quizzes_homework_resources_will_appear') || 'Quizzes, homework, and resources will appear here'}
                  />
                ) : (
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {filteredTasks.map(task => (
                      <Card key={task.id} style={{ 
                        borderLeft: `4px solid ${
                          task.status === 'urgent' ? '#ef4444' : 
                          task.status === 'overdue' ? '#f59e0b' : 
                          task.status === 'completed' ? '#10b981' : '#6b7280'
                        }` 
                      }}>
                        <CardBody>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '1rem' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1.125rem' }}>{task.title}</h3>
                                <Badge variant={
                                  task.status === 'urgent' ? 'danger' : 
                                  task.status === 'overdue' ? 'warning' : 
                                  task.status === 'completed' ? 'success' : 'default'
                                }>
                                  {task.status}
                                </Badge>
                              </div>
                              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                                {task.className} • {ACTIVITY_TYPE_LABELS[task.type] || task.type}
                              </div>
                              {task.deadline && (
                                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                  <Clock size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                                  Due: {task.deadline.toDate ? task.deadline.toDate().toLocaleString() : 'N/A'}
                                </div>
                              )}
                              {task.isGraded && task.score != null && (
                                <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                                  Score: {task.score}% / {task.maxScore}%
                                </div>
                              )}
                            </div>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => navigate(task.type === 'quiz' ? `/quiz/${task.id}` : `/activity/${task.id}`)}
                            >
                              {task.status === 'completed' ? (t('view') || 'View') : (task.type === 'quiz' ? (t('start') || 'Start') : (t('submit') || 'Submit'))}
                            </Button>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        )}

        {viewMode === 'attendance' && (
          <div className={isCompactView ? styles.compactView : styles.fullView}>
            <Card>
              <CardBody>
                <h2 style={{ margin: '0 0 1.5rem 0' }}>{t('attendance') || 'Attendance'}</h2>
                {attendance.length === 0 ? (
                  <EmptyState
                    icon={CalendarCheck}
                    title={t('no_attendance_records') || 'No attendance records yet'}
                    description={t('attendance_will_appear_here') || 'Your attendance will appear here once classes begin'}
                  />
                ) : (
                  <div>
                    {attendanceStats && (
                      <div style={{ display: 'grid', gridTemplateColumns: isCompactView ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                        <Card style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' }}>
                          <CardBody>
                            <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                              {attendanceStats.attendanceRate?.toFixed(1) || 0}%
                            </div>
                            <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>{t('attendance_rate') || 'Attendance Rate'}</div>
                          </CardBody>
                        </Card>
                        <Card style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white' }}>
                          <CardBody>
                            <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                              {attendanceStats.present || 0}
                            </div>
                            <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>{t('present_sessions') || 'Present Sessions'}</div>
                          </CardBody>
                        </Card>
                        <Card style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white' }}>
                          <CardBody>
                            <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                              {attendanceStats.late || 0}
                            </div>
                            <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>{t('late_sessions') || 'Late Sessions'}</div>
                          </CardBody>
                        </Card>
                        <Card style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white' }}>
                          <CardBody>
                            <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                              {attendanceStats.absent || 0}
                            </div>
                            <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>{t('absent_sessions') || 'Absent Sessions'}</div>
                          </CardBody>
                        </Card>
                      </div>
                    )}
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      {attendance.map((record, idx) => {
                        const date = record.date?.toDate ? record.date.toDate() : new Date(record.date || 0);
                        return (
                          <Card key={idx} style={{ 
                            borderLeft: `4px solid ${
                              record.status === 'present' ? '#10b981' : 
                              record.status === 'late' ? '#f59e0b' : 
                              record.status === 'absent' ? '#ef4444' : '#6b7280'
                            }` 
                          }}>
                            <CardBody>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 600, marginBottom: '0.25rem', fontSize: '1rem' }}>
                                    {record.className || 'Unknown Class'}
                                  </div>
                                  <div style={{ fontSize: '0.875rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <CalendarCheck size={14} />
                                    {date.toLocaleDateString()} • {date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </div>
                                <Badge variant={
                                  record.status === 'present' ? 'success' : 
                                  record.status === 'late' ? 'warning' : 
                                  record.status === 'absent' ? 'danger' : 'default'
                                } style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                                  {record.status === 'present' ? (t('present') || 'Present') :
                                   record.status === 'late' ? (t('late') || 'Late') :
                                   record.status === 'absent' ? (t('absent') || 'Absent') : record.status || 'N/A'}
                                </Badge>
                              </div>
                            </CardBody>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        )}

        {viewMode === 'performance' && (
          <div className={isCompactView ? styles.compactView : styles.fullView}>
            <Card>
              <CardBody>
                <h2 style={{ margin: '0 0 1.5rem 0' }}>{t('performance') || 'Performance'}</h2>
                <div style={{ display: 'grid', gridTemplateColumns: isCompactView ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                  <div style={{ padding: '1.5rem', background: '#f0f9ff', borderRadius: 12 }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#3b82f6', marginBottom: '0.5rem' }}>
                      {stats.completedTasks}
                    </div>
                    <div style={{ fontSize: '1rem', color: '#6b7280' }}>{t('completed_tasks') || 'Completed Tasks'}</div>
                  </div>
                  <div style={{ padding: '1.5rem', background: '#f0fdf4', borderRadius: 12 }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#10b981', marginBottom: '0.5rem' }}>
                      {stats.avgGrade}%
                    </div>
                    <div style={{ fontSize: '1rem', color: '#6b7280' }}>{t('average_score') || 'Average Score'}</div>
                  </div>
                  <div style={{ padding: '1.5rem', background: '#fef3c7', borderRadius: 12 }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#f59e0b', marginBottom: '0.5rem' }}>
                      {stats.completionRate}%
                    </div>
                    <div style={{ fontSize: '1rem', color: '#6b7280' }}>{t('completion_rate') || 'Completion Rate'}</div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {viewMode === 'marks' && (
          <div className={isCompactView ? styles.compactView : styles.fullView}>
            <Card>
              <CardBody>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <h2 style={{ margin: 0 }}>{t('marks') || 'Marks & Grades'}</h2>
                </div>
                {studentMarks.length === 0 ? (
                  <EmptyState
                    icon={Award}
                    title={t('no_marks_yet') || 'No marks recorded yet'}
                    description={t('check_back_later_for_updates') || 'Check back later for updates on your grades.'}
                  />
                ) : (
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {studentMarks
                      .filter(m => {
                        // Filter by program
                        if (selectedProgram !== 'all') {
                          const subject = subjects.find(s => (s.docId || s.id) === m.subjectId);
                          if (subject?.programId !== selectedProgram) return false;
                        }
                        // Filter by subject
                        if (selectedSubject !== 'all') {
                          if (m.subjectId !== selectedSubject) return false;
                        }
                        return true;
                      })
                      .map((mark, idx) => {
                        const subject = subjects.find(s => (s.docId || s.id) === mark.subjectId);
                        const totalMarks = (mark.marks?.midTermExam || 0) + (mark.marks?.finalExam || 0) + 
                                          (mark.marks?.homework || 0) + (mark.marks?.labsProjectResearch || 0) + 
                                          (mark.marks?.quizzes || 0) + (mark.marks?.participation || 0) + 
                                          (mark.marks?.attendance || 0);
                        return (
                          <Card key={idx}>
                            <CardBody>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <div>
                                  <h3 style={{ margin: 0, fontSize: '1.25rem' }}>
                                    {subject?.name_en || subject?.name_ar || mark.subjectId}
                                  </h3>
                                  <p style={{ margin: '0.25rem 0 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
                                    {mark.semester} {mark.academicYear}
                                  </p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                                    {totalMarks.toFixed(1)}%
                                  </div>
                                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{t('total') || 'Total'}</div>
                                </div>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: isCompactView ? '1fr' : 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                                {[
                                  { key: 'midTermExam', label: t('mid_term') || 'Mid-Term Exam', value: mark.marks?.midTermExam, color: '#3b82f6' },
                                  { key: 'finalExam', label: t('final') || 'Final Exam', value: mark.marks?.finalExam, color: '#8b5cf6' },
                                  { key: 'homework', label: t('homework') || 'Homework', value: mark.marks?.homework, color: '#10b981' },
                                  { key: 'labsProjectResearch', label: t('labs_projects') || 'Labs/Projects', value: mark.marks?.labsProjectResearch, color: '#f59e0b' },
                                  { key: 'quizzes', label: t('quizzes') || 'Quizzes', value: mark.marks?.quizzes, color: '#ef4444' },
                                  { key: 'participation', label: t('participation') || 'Participation', value: mark.marks?.participation, color: '#06b6d4' },
                                  { key: 'attendance', label: t('attendance') || 'Attendance', value: mark.marks?.attendance, color: '#84cc16' }
                                ].filter(item => item.value != null).map((item, idx) => (
                                  <Card key={idx} style={{ borderTop: `4px solid ${item.color}`, padding: '0.75rem' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem', fontWeight: 500 }}>
                                      {item.label}
                                    </div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: item.color }}>
                                      {item.value}%
                                    </div>
                                  </Card>
                                ))}
                              </div>
                              {mark.grade && (
                                <div style={{ marginTop: '1rem', padding: '1rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 8, color: 'white', textAlign: 'center' }}>
                                  <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.25rem' }}>{t('final_grade') || 'Final Grade'}</div>
                                  <div style={{ fontSize: '2rem', fontWeight: 700 }}>{mark.grade}</div>
                                  {mark.points != null && (
                                    <div style={{ fontSize: '0.875rem', opacity: 0.9, marginTop: '0.25rem' }}>
                                      {mark.points.toFixed(2)} {t('gpa_points') || 'GPA Points'}
                                    </div>
                                  )}
                                </div>
                              )}
                            </CardBody>
                          </Card>
                        );
                      })}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        )}

        {(viewMode === 'penalties' || viewMode === 'participations' || viewMode === 'behaviors') && (
          <div className={isCompactView ? styles.compactView : styles.fullView}>
            <Card>
              <CardBody>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <Tabs
                    activeTab={viewMode}
                    onTabChange={setViewMode}
                    tabs={[
                      { value: 'penalties', label: t('penalties') || 'Penalties', icon: <AlertTriangle size={16} /> },
                      { value: 'participations', label: t('participations') || 'Participations', icon: <PlusIcon size={16} /> },
                      { value: 'behaviors', label: t('behaviors') || 'Behaviors', icon: <XCircle size={16} /> }
                    ]}
                    size="lg"
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Download size={16} />}
                      onClick={() => {
                        let data = [];
                        let filename = '';
                        if (viewMode === 'penalties') {
                          data = penalties
                            .filter(p => {
                              if (selectedProgram !== 'all') {
                                const subject = subjects.find(s => (s.docId || s.id) === p.subjectId);
                                if (subject?.programId !== selectedProgram) return false;
                              }
                              if (selectedSubject !== 'all') {
                                if (p.subjectId !== selectedSubject) return false;
                              }
                              return true;
                            })
                            .map(p => ({
                            Type: PENALTY_TYPES.find(pt => pt.id === p.type)?.[`label_${lang}`] || p.type,
                            Subject: subjects.find(s => (s.docId || s.id) === p.subjectId)?.[`name_${lang}`] || '',
                            Description: p.description || '',
                            Date: p.createdAt?.toDate ? p.createdAt.toDate().toLocaleString() : ''
                          }));
                          filename = 'penalties.csv';
                        } else if (viewMode === 'participations') {
                          data = participations
                            .filter(p => {
                              if (selectedProgram !== 'all') {
                                const subject = subjects.find(s => (s.docId || s.id) === p.subjectId);
                                if (subject?.programId !== selectedProgram) return false;
                              }
                              if (selectedSubject !== 'all') {
                                if (p.subjectId !== selectedSubject) return false;
                              }
                              return true;
                            })
                            .map(p => ({
                            Type: PARTICIPATION_TYPES.find(pt => pt.id === p.type)?.[`label_${lang}`] || p.type,
                            Subject: subjects.find(s => (s.docId || s.id) === p.subjectId)?.[`name_${lang}`] || '',
                            Comment: p.comment || '',
                            Date: p.createdAt?.toDate ? p.createdAt.toDate().toLocaleString() : ''
                          }));
                          filename = 'participations.csv';
                        } else if (viewMode === 'behaviors') {
                          data = behaviors
                            .filter(b => {
                              if (selectedProgram !== 'all') {
                                const subject = subjects.find(s => (s.docId || s.id) === b.subjectId);
                                if (subject?.programId !== selectedProgram) return false;
                              }
                              if (selectedSubject !== 'all') {
                                if (b.subjectId !== selectedSubject) return false;
                              }
                              return true;
                            })
                            .map(b => ({
                            Type: BEHAVIOR_TYPES.find(bt => bt.id === b.type)?.[`label_${lang}`] || b.type,
                            Subject: subjects.find(s => (s.docId || s.id) === b.subjectId)?.[`name_${lang}`] || '',
                            Comment: b.comment || '',
                            Date: b.createdAt?.toDate ? b.createdAt.toDate().toLocaleString() : ''
                          }));
                          filename = 'behaviors.csv';
                        }
                        
                        if (data.length === 0) {
                          toast.error(t('no_data_to_export') || 'No data to export');
                          return;
                        }
                        
                        const headers = Object.keys(data[0]);
                        const csvContent = [
                          headers.join(','),
                          ...data.map(row => headers.map(header => `"${String(row[header] || '').replace(/"/g, '""')}"`).join(','))
                        ].join('\n');
                        
                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(blob);
                        link.download = filename;
                        link.click();
                        toast.success(t('exported_successfully') || 'Exported successfully');
                      }}
                    >
                      {t('export') || 'Export'}
                    </Button>
                  </div>
                </div>
                
                {viewMode === 'penalties' && (
                  <div>
                    {penalties.length === 0 ? (
                      <EmptyState
                        icon={AlertTriangle}
                        title={t('no_penalties') || 'No penalties recorded'}
                        description={t('great_job_keeping_up') || 'Great job keeping up with your academic responsibilities!'}
                      />
                    ) : (
                      <div style={{ display: 'grid', gap: '0.75rem' }}>
                        {penalties
                          .filter(p => {
                            if (selectedProgram !== 'all') {
                              const subject = subjects.find(s => (s.docId || s.id) === p.subjectId);
                              if (subject?.programId !== selectedProgram) return false;
                            }
                            if (selectedSubject !== 'all') {
                              if (p.subjectId !== selectedSubject) return false;
                            }
                            return true;
                          })
                          .map((penalty, idx) => {
                            const penaltyType = PENALTY_TYPES.find(pt => pt.id === penalty.type) || { label_en: penalty.type };
                            const subject = subjects.find(s => (s.docId || s.id) === penalty.subjectId);
                            const createdAt = penalty.createdAt?.toDate ? penalty.createdAt.toDate() : new Date(penalty.createdAt || 0);
                            return (
                              <Card key={idx} style={{ borderLeft: '4px solid #f59e0b' }}>
                                <CardBody>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                        <Badge variant="warning">
                                          {lang === 'ar' ? penaltyType.label_ar : penaltyType.label_en}
                                        </Badge>
                                        {subject && (
                                          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                            {lang === 'ar' ? subject.name_ar : subject.name_en}
                                          </span>
                                        )}
                                      </div>
                                      {penalty.description && (
                                        <p style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>{penalty.description}</p>
                                      )}
                                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                        {createdAt.toLocaleDateString()} {createdAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                      </div>
                                    </div>
                                  </div>
                                </CardBody>
                              </Card>
                            );
                          })}
                      </div>
                    )}
                  </div>
                )}

                {viewMode === 'participations' && (
                  <div>
                    {participations.length === 0 ? (
                      <EmptyState
                        icon={PlusIcon}
                        title={t('no_participations') || 'No participations recorded'}
                        description={t('engage_in_class_to_earn_points') || 'Engage in class discussions and activities to earn participation points!'}
                      />
                    ) : (
                      <div style={{ display: 'grid', gap: '0.75rem' }}>
                        {participations
                          .filter(p => {
                            if (selectedProgram !== 'all') {
                              const subject = subjects.find(s => (s.docId || s.id) === p.subjectId);
                              if (subject?.programId !== selectedProgram) return false;
                            }
                            if (selectedSubject !== 'all') {
                              if (p.subjectId !== selectedSubject) return false;
                            }
                            return true;
                          })
                          .map((participation, idx) => {
                            const participationType = PARTICIPATION_TYPES.find(pt => pt.id === participation.type) || { label_en: participation.type };
                            const subject = subjects.find(s => (s.docId || s.id) === participation.subjectId);
                            const createdAt = participation.createdAt?.toDate ? participation.createdAt.toDate() : new Date(participation.createdAt || 0);
                            return (
                              <Card key={idx} style={{ borderLeft: '4px solid #10b981' }}>
                                <CardBody>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                        <Badge variant="success">
                                          +1 {lang === 'ar' ? participationType.label_ar : participationType.label_en}
                                        </Badge>
                                        {subject && (
                                          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                            {lang === 'ar' ? subject.name_ar : subject.name_en}
                                          </span>
                                        )}
                                      </div>
                                      {participation.comment && (
                                        <p style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>{participation.comment}</p>
                                      )}
                                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                        {createdAt.toLocaleDateString()} {createdAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                      </div>
                                    </div>
                                  </div>
                                </CardBody>
                              </Card>
                            );
                          })}
                      </div>
                    )}
                  </div>
                )}

                {viewMode === 'behaviors' && (
                  <div>
                    {behaviors.length === 0 ? (
                      <EmptyState
                        icon={XCircle}
                        title={t('no_behaviors') || 'No behaviors recorded'}
                        description={t('keep_up_the_good_work') || 'Keep up the good work! No negative behaviors to report.'}
                      />
                    ) : (
                      <div style={{ display: 'grid', gap: '0.75rem' }}>
                        {behaviors
                          .filter(b => {
                            if (selectedProgram !== 'all') {
                              const subject = subjects.find(s => (s.docId || s.id) === b.subjectId);
                              if (subject?.programId !== selectedProgram) return false;
                            }
                            if (selectedSubject !== 'all') {
                              if (b.subjectId !== selectedSubject) return false;
                            }
                            return true;
                          })
                          .map((behavior, idx) => {
                            const behaviorType = BEHAVIOR_TYPES.find(bt => bt.id === behavior.type) || { label_en: behavior.type };
                            const subject = subjects.find(s => (s.docId || s.id) === behavior.subjectId);
                            const createdAt = behavior.createdAt?.toDate ? behavior.createdAt.toDate() : new Date(behavior.createdAt || 0);
                            return (
                              <Card key={idx} style={{ borderLeft: '4px solid #ef4444' }}>
                                <CardBody>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                        <Badge variant="danger">
                                          -1 {lang === 'ar' ? behaviorType.label_ar : behaviorType.label_en}
                                        </Badge>
                                        {subject && (
                                          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                            {lang === 'ar' ? subject.name_ar : subject.name_en}
                                          </span>
                                        )}
                                      </div>
                                      {behavior.comment && (
                                        <p style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>{behavior.comment}</p>
                                      )}
                                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                        {createdAt.toLocaleDateString()} {createdAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                      </div>
                                    </div>
                                  </div>
                                </CardBody>
                              </Card>
                            );
                          })}
                      </div>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        )}
      </Container>
    </div>
  );
}
