/**
 * Student Dashboard Page - Comprehensive Redesign
 * Central hub for tracking quizzes, assignments, homework, resources, and grades
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { 
  Container, Card, CardBody, Button, Badge, Grid, EmptyState, 
  Select, Tabs, ProgressBar, useToast, Loading, Spinner 
} from '../components/ui';
import {
  BookOpen, Clock, Trophy, Award, Target, TrendingUp, 
  CheckCircle, XCircle, AlertCircle, FileText, FileQuestion,
  Calendar, Bell, RefreshCw, Eye, BarChart3, Filter,
  BookmarkCheck, Play, FileArchive, Inbox, ArrowRight
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import styles from './StudentDashboardPage.module.css';

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
  
  // Filters
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedTerm, setSelectedTerm] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [taskFilter, setTaskFilter] = useState('all'); // all, quizzes, assignments, homework, resources
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, completed, overdue
  
  // For admin/instructor viewing student dashboard
  const [studentsList, setStudentsList] = useState([]);
  const [viewingAsStudent, setViewingAsStudent] = useState(false);

  // Determine which user's data to show
  const targetUserId = selectedStudent || user?.uid;
  const displayName = selectedStudent 
    ? studentsList.find(s => s.id === selectedStudent)?.displayName 
    : userProfile?.displayName || user?.displayName || 'Student';

  // Load data
  useEffect(() => {
    loadDashboardData();
  }, [targetUserId, selectedClass, selectedTerm]);

  const loadDashboardData = async () => {
    if (!targetUserId) return;
    
    setLoading(true);
    try {
      // Load classes (for filters)
      const classesSnap = await getDocs(collection(db, 'classes'));
      const classesData = classesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClasses(classesData);

      // Load enrollments
      const enrollmentsQuery = query(
        collection(db, 'enrollments'),
        where('studentId', '==', targetUserId)
      );
      const enrollmentsSnap = await getDocs(enrollmentsQuery);
      const enrollmentsData = enrollmentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEnrollments(enrollmentsData);

      // Load activities (quizzes, assignments, homework, resources)
      const activitiesSnap = await getDocs(collection(db, 'activities'));
      const activitiesData = activitiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Load submissions
      const submissionsQuery = query(
        collection(db, 'submissions'),
        where('studentId', '==', targetUserId)
      );
      const submissionsSnap = await getDocs(submissionsQuery);
      const submissionsData = submissionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubmissions(submissionsData);

      // Load quiz results
      const quizResultsQuery = query(
        collection(db, 'quizResults'),
        where('userId', '==', targetUserId)
      );
      const quizResultsSnap = await getDocs(quizResultsQuery);
      const quizResultsData = quizResultsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setQuizResults(quizResultsData);

      // Combine into tasks array
      const tasksArray = activitiesData.map(activity => {
        const submission = submissionsData.find(s => s.activityId === activity.id);
        const quizResult = quizResultsData.find(q => q.quizId === activity.id);
        
        return {
          id: activity.id,
          title: activity.title_en || activity.title,
          type: activity.type || 'activity', // quiz, assignment, homework, resource
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
    } catch (error) {
      const message = String(error?.message || '').toLowerCase();
      const code = error?.code || '';

      // Gracefully handle missing/insufficient permissions in production
      if (code === 'permission-denied' || message.includes('missing or insufficient permissions')) {
        console.warn('StudentDashboard: permission denied, showing empty dashboard view');
        setTasks([]);
        setEnrollments([]);
        setQuizResults([]);
        setSubmissions([]);
      } else {
        console.error('Error loading dashboard:', error);
        toast?.showError?.('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  // Load students list (for admin/instructor)
  useEffect(() => {
    if (isAdmin || isInstructor) {
      loadStudentsList();
    }
  }, [isAdmin, isInstructor]);

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

  // Helper: Determine task status
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

    return filtered;
  }, [tasks, selectedClass, taskFilter, statusFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const enrolledCount = enrollments.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const totalTasks = tasks.length;
    const totalHours = tasks
      .filter(t => t.status === 'completed' && t.estimatedTime)
      .reduce((sum, t) => sum + (t.estimatedTime || 0), 0);
    
    const gradedTasks = tasks.filter(t => t.isGraded && t.score != null);
    const avgGrade = gradedTasks.length > 0
      ? Math.round(gradedTasks.reduce((sum, t) => sum + t.score, 0) / gradedTasks.length)
      : 0;

    return {
      enrolledClasses: enrolledCount,
      completedTasks,
      totalTasks,
      totalHours,
      avgGrade
    };
  }, [tasks, enrollments]);

  // Urgent tasks (for notification widget)
  const urgentTasks = useMemo(() => {
    return tasks
      .filter(t => t.status === 'urgent' || t.status === 'overdue')
      .slice(0, 3);
  }, [tasks]);

  // Render loading
  if (loading) {
    return <Loading fullscreen variant="overlay" message="Loading dashboard..." />;
  }

  // Render task card
  const renderTaskCard = (task) => {
    const statusConfig = {
      completed: { color: 'success', icon: CheckCircle, label: 'Completed' },
      pending: { color: 'default', icon: Clock, label: 'Pending' },
      urgent: { color: 'warning', icon: AlertCircle, label: 'Due Soon' },
      overdue: { color: 'danger', icon: XCircle, label: 'Overdue' }
    };

    const typeConfig = {
      quiz: { icon: FileQuestion, label: 'Quiz', color: '#800020' },
      assignment: { icon: FileText, label: 'Assignment', color: '#0ea5e9' },
      homework: { icon: BookOpen, label: 'Homework', color: '#f59e0b' },
      resource: { icon: FileArchive, label: 'Resource', color: '#10b981' }
    };

    const status = statusConfig[task.status] || statusConfig.pending;
    const type = typeConfig[task.type] || typeConfig.assignment;
    const TypeIcon = type.icon;
    const StatusIcon = status.icon;

    return (
      <Card key={task.id} className={styles.taskCard}>
        <CardBody>
          <div className={styles.taskHeader}>
            <div className={styles.taskType}>
              <TypeIcon size={18} style={{ color: type.color }} />
              <span>{type.label}</span>
            </div>
            <Badge variant={status.color} size="sm">
              <StatusIcon size={14} />
              {status.label}
            </Badge>
          </div>

          <h3 className={styles.taskTitle}>{task.title}</h3>
          
          <div className={styles.taskMeta}>
            <span className={styles.className}>{task.className}</span>
            {task.deadline && (
              <span className={styles.deadline}>
                <Clock size={14} />
                {new Date(task.deadline.toDate()).toLocaleDateString('en-GB')}
              </span>
            )}
          </div>

          {task.isGraded && (
            <div className={styles.taskScore}>
              <Award size={16} />
              <span className={styles.score}>{task.score}%</span>
              <ProgressBar 
                value={task.score} 
                max={100}
                variant={task.score >= 70 ? 'success' : 'danger'}
              />
            </div>
          )}

          <div className={styles.taskActions}>
            {task.status === 'completed' ? (
              <>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => navigate(`/quiz-results?id=${task.id}`)}
                >
                  <Eye size={14} /> View Results
                </Button>
                {task.allowRetake && task.score < 70 && (
                  <Button 
                    size="sm" 
                    variant="primary"
                    onClick={() => navigate(`/quiz/${task.id}?retake=true`)}
                  >
                    <RefreshCw size={14} /> Retake
                  </Button>
                )}
              </>
            ) : (
              <Button 
                size="sm" 
                variant="primary"
                onClick={() => {
                  if (task.type === 'quiz') {
                    navigate(`/quiz/${task.id}`);
                  } else {
                    navigate(`/activities/${task.id}`);
                  }
                }}
              >
                <Play size={14} /> 
                {task.type === 'quiz' ? 'Start Quiz' : 'Open Task'}
              </Button>
            )}
          </div>
        </CardBody>
      </Card>
    );
  };

  return (
    <div className={styles.studentDashboard}>
      <Container maxWidth="xl">
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1>{displayName}'s Dashboard</h1>
            <p>Track your progress and manage all your tasks in one place</p>
          </div>
        </div>

        {/* Admin/Instructor Controls */}
        {(isAdmin || isInstructor) && (
          <Card className={styles.adminControls}>
            <CardBody>
              <div className={styles.filters}>
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
                  className={styles.filterSelect}
                />
              </div>
            </CardBody>
          </Card>
        )}

        {/* Summary Cards */}
        <Grid cols={4} gap="1rem" className={styles.statsGrid}>
          <Card className={styles.statCard}>
            <CardBody>
              <div className={styles.statIcon}>
                <BookOpen size={24} />
              </div>
              <div className={styles.statContent}>
                <div className={styles.statValue}>{stats.enrolledClasses}</div>
                <div className={styles.statLabel}>Enrolled Classes</div>
              </div>
            </CardBody>
          </Card>

          <Card className={styles.statCard}>
            <CardBody>
              <div className={styles.statIcon}>
                <CheckCircle size={24} />
              </div>
              <div className={styles.statContent}>
                <div className={styles.statValue}>{stats.completedTasks}</div>
                <div className={styles.statLabel}>Completed Tasks</div>
                <div className={styles.statSubtext}>of {stats.totalTasks}</div>
              </div>
            </CardBody>
          </Card>

          <Card className={styles.statCard}>
            <CardBody>
              <div className={styles.statIcon}>
                <Clock size={24} />
              </div>
              <div className={styles.statContent}>
                <div className={styles.statValue}>{stats.totalHours}h</div>
                <div className={styles.statLabel}>Total Hours</div>
              </div>
            </CardBody>
          </Card>

          <Card className={styles.statCard}>
            <CardBody>
              <div className={styles.statIcon}>
                <Trophy size={24} />
              </div>
              <div className={styles.statContent}>
                <div className={styles.statValue}>{stats.avgGrade}%</div>
                <div className={styles.statLabel}>Average Grade</div>
              </div>
            </CardBody>
          </Card>
        </Grid>

        {/* Urgent Tasks Widget */}
        {urgentTasks.length > 0 && (
          <Card className={styles.urgentTasksWidget}>
            <CardBody>
              <div className={styles.widgetHeader}>
                <div className={styles.widgetTitle}>
                  <Bell size={20} />
                  <h3>Urgent Tasks ({urgentTasks.length})</h3>
                </div>
                <Button size="sm" variant="ghost" onClick={() => navigate('/notifications')}>
                  View All <ArrowRight size={14} />
                </Button>
              </div>
              <div className={styles.urgentTasksList}>
                {urgentTasks.map(task => (
                  <div key={task.id} className={styles.urgentTask}>
                    <div className={styles.urgentTaskInfo}>
                      <AlertCircle size={18} className={styles.urgentIcon} />
                      <div>
                        <div className={styles.urgentTaskTitle}>{task.title}</div>
                        <div className={styles.urgentTaskMeta}>
                          {task.className} • Due {new Date(task.deadline.toDate()).toLocaleDateString('en-GB')}
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="primary">
                      {task.type === 'quiz' ? 'Start' : 'Submit'}
                    </Button>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Main Content: Tasks & Grades */}
        <Grid cols={1} gap="2rem">
          {/* My Tasks Section */}
          <Card>
            <CardBody>
              <div className={styles.sectionHeader}>
                <h2>My Tasks</h2>
                <div className={styles.taskFilters}>
                  <Select 
                    searchable
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    options={[
                      { value: 'all', label: 'All Classes' },
                      ...classes.map(cls => ({
                        value: cls.id,
                        label: cls.name
                      }))
                    ]}
                    placeholder="Select Class"
                    className={styles.filterSelect}
                  />

                  <Tabs
                    value={taskFilter}
                    onChange={setTaskFilter}
                    tabs={[
                      { value: 'all', label: 'All' },
                      { value: 'quiz', label: 'Quizzes' },
                      { value: 'homework', label: 'Homework' },
                      { value: 'resource', label: 'Resources' }
                    ]}
                    size="sm"
                  />

                  <Tabs
                    value={statusFilter}
                    onChange={setStatusFilter}
                    tabs={[
                      { value: 'all', label: 'All' },
                      { value: 'pending', label: 'Pending' },
                      { value: 'completed', label: 'Completed' },
                      { value: 'overdue', label: 'Overdue' }
                    ]}
                    size="sm"
                  />
                </div>
              </div>

              {filteredTasks.length === 0 ? (
                <EmptyState
                  icon={Inbox}
                  title="No tasks found"
                  description="You're all caught up! Check back later for new assignments."
                />
              ) : (
                <Grid cols={2} gap="1rem" className={styles.tasksGrid}>
                  {filteredTasks.map(renderTaskCard)}
                </Grid>
              )}
            </CardBody>
          </Card>
        </Grid>
      </Container>
    </div>
  );
}
