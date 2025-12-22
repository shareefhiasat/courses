/**
 * Student Dashboard - Refactored into modular components
 * Modern, clean design for student learning management
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { 
  Container, Button, Select, Tabs, useToast, Loading 
} from '../components/ui';
import {
  RefreshCw, BarChart3, CheckCircle, CalendarCheck, TrendingUp, Sparkles
} from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getAttendanceByStudent, getAttendanceStats } from '../firebase/attendance';
import styles from './StudentDashboardPage_NEW.module.css';

// Import dashboard components
import StatsCards from '../components/studentDashboard/StatsCards';
import OverviewView from '../components/studentDashboard/OverviewView';
import TasksView from '../components/studentDashboard/TasksView';
import AttendanceView from '../components/studentDashboard/AttendanceView';
import PerformanceView from '../components/studentDashboard/PerformanceView';

export default function StudentDashboardPage() {
  const { t, lang } = useLang();
  const { user, userProfile, isAdmin, isInstructor, role } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  
  // State
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [quizResults, setQuizResults] = useState([]);
  const [classes, setClasses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState(null);
  
  // Filters
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [taskFilter, setTaskFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('overview'); // overview, tasks, attendance, performance
  
  // For admin/instructor viewing student dashboard
  const [studentsList, setStudentsList] = useState([]);

  // Determine which user's data to show
  const displayUserId = selectedStudent || user?.uid;
  const displayName = selectedStudent 
    ? studentsList.find(s => s.id === selectedStudent)?.displayName || 'Student'
    : userProfile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Student';

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, selectedStudent]);

  useEffect(() => {
    if (isAdmin || isInstructor) {
      loadStudentsList();
    }
  }, [isAdmin, isInstructor]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const targetUserId = displayUserId;

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
      setEnrollments(enrollmentsData);

      const classIds = enrollmentsData.map(e => e.classId).filter(Boolean);
      
      // Load classes
      if (classIds.length > 0) {
        const classesData = [];
        for (const classId of classIds) {
          const classDoc = await getDoc(doc(db, 'classes', classId));
          if (classDoc.exists()) {
            classesData.push({ id: classDoc.id, ...classDoc.data() });
          }
        }
        setClasses(classesData);
      }

      // Load activities
      const activitiesQuery = classIds.length > 0
        ? query(collection(db, 'activities'), where('classId', 'in', classIds.slice(0, 10)))
        : query(collection(db, 'activities'), where('show', '==', true));
      
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
          type: activity.type || 'activity',
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

      // Load attendance data
      const attendanceResult = await getAttendanceByStudent(targetUserId);
      if (attendanceResult.success) {
        setAttendance(attendanceResult.data);
      }

      // Load attendance stats for all enrolled classes
      if (classIds.length > 0) {
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
      } else {
        console.error('Error loading dashboard:', error);
        toast?.showError?.('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadStudentsList = async () => {
    try {
      const usersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'student')));
      const students = usersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        displayName: doc.data().displayName || doc.data().name || doc.data().email?.split('@')[0]
      }));
      setStudentsList(students);
    } catch (error) {
      console.error('Error loading students:', error);
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

  // Filter tasks
  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];

    if (selectedClass !== 'all') {
      filtered = filtered.filter(t => t.classId === selectedClass);
    }

    if (taskFilter !== 'all') {
      filtered = filtered.filter(t => t.type === taskFilter);
    }

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
  }, [tasks, selectedClass, taskFilter, statusFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const enrolledCount = enrollments.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const totalTasks = tasks.length;
    const totalHours = Math.round(tasks.filter(t => t.status === 'completed').length * 1.5);
    const gradedTasks = tasks.filter(t => t.isGraded && t.score != null);
    const avgGrade = gradedTasks.length > 0
      ? Math.round(gradedTasks.reduce((sum, t) => sum + t.score, 0) / gradedTasks.length)
      : 0;

    return {
      enrolledClasses: enrolledCount,
      completedTasks,
      totalTasks,
      totalHours,
      avgGrade,
      completionRate: totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0
    };
  }, [tasks, enrollments]);

  // Urgent tasks
  const urgentTasks = useMemo(() => {
    return tasks
      .filter(t => t.status === 'urgent' || t.status === 'overdue')
      .slice(0, 3);
  }, [tasks]);

  if (loading) {
    return <Loading fullscreen variant="overlay" message={t('loading') || 'Loading dashboard...'} />;
  }

  return (
    <div className={styles.dashboard}>
      <Container maxWidth="xxl">
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.headerLeft}>
              <div className={styles.welcomeSection}>
                <h1 className={styles.welcomeTitle}>
                  <Sparkles className={styles.sparkleIcon} />
                  Welcome back, {displayName}!
                </h1>
                <p className={styles.welcomeSubtitle}>
                  Here's what's happening with your learning journey
                </p>
              </div>
            </div>
            
            <div className={styles.headerRight}>
              {(isAdmin || isInstructor) && (
                <Select
                  searchable
                  value={selectedStudent || ''}
                  onChange={(e) => setSelectedStudent(e.target.value || null)}
                  options={[
                    { value: '', label: 'View My Dashboard' },
                    ...studentsList.map(student => ({
                      value: student.id,
                      label: `${student.displayName} (${student.studentNumber || student.email})`
                    }))
                  ]}
                  placeholder="Select Student"
                  className={styles.studentSelector}
                />
              )}
              <Button variant="outline" size="sm" onClick={loadDashboardData}>
                <RefreshCw size={16} /> Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <StatsCards stats={stats} attendanceStats={attendanceStats} />

        {/* View Mode Tabs */}
        <div className={styles.viewModeTabs}>
          <Tabs
            value={viewMode}
            onChange={setViewMode}
            tabs={[
              { value: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
              { value: 'tasks', label: 'My Tasks', icon: <CheckCircle size={16} /> },
              { value: 'attendance', label: 'Attendance', icon: <CalendarCheck size={16} /> },
              { value: 'performance', label: 'Performance', icon: <TrendingUp size={16} /> }
            ]}
            size="lg"
          />
        </div>

        {/* Content based on view mode */}
        {viewMode === 'overview' && (
          <OverviewView 
            urgentTasks={urgentTasks}
            tasks={tasks}
            attendance={attendance}
            attendanceStats={attendanceStats}
            navigate={navigate}
            setViewMode={setViewMode}
          />
        )}

        {viewMode === 'tasks' && (
          <TasksView
            filteredTasks={filteredTasks}
            classes={classes}
            selectedClass={selectedClass}
            setSelectedClass={setSelectedClass}
            taskFilter={taskFilter}
            setTaskFilter={setTaskFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            navigate={navigate}
          />
        )}

        {viewMode === 'attendance' && (
          <AttendanceView
            attendance={attendance}
            attendanceStats={attendanceStats}
            classes={classes}
          />
        )}

        {viewMode === 'performance' && (
          <PerformanceView
            tasks={tasks}
            quizResults={quizResults}
            submissions={submissions}
            classes={classes}
          />
        )}
      </Container>
    </div>
  );
}
