/**
 * World-Class Student Dashboard - Unified Performance & Attendance View
 * Modern, clean design inspired by leading SaaS products
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { 
  Container, Card, CardBody, Button, Badge, Grid, EmptyState, 
  Select, Tabs, ProgressBar, useToast, Loading 
} from '../components/ui';
import {
  BookOpen, Clock, Trophy, Award, Target, TrendingUp, 
  CheckCircle, XCircle, AlertCircle, FileText, FileQuestion,
  Calendar, Bell, RefreshCw, Eye, BarChart3, Filter,
  BookmarkCheck, Play, FileArchive, Inbox, ArrowRight,
  Users, Flame, Zap, Star, Activity, PieChart, CalendarCheck,
  CalendarX, CalendarClock, GraduationCap, Medal, ChevronRight,
  Download, Upload, BookMarked, Sparkles
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getAttendanceByStudent, getAttendanceStats } from '../firebase/attendance';
import { getUserBadges, getUserStats } from '../firebase/badges';
import styles from './StudentDashboardPage_NEW.module.css';

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
  const [badges, setBadges] = useState([]);
  const [userStats, setUserStats] = useState(null);
  
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

      // Load badges and stats
      const badgesResult = await getUserBadges(targetUserId);
      if (badgesResult.success) {
        setBadges(badgesResult.data);
      }

      const statsResult = await getUserStats(targetUserId);
      if (statsResult.success) {
        setUserStats(statsResult.data);
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
        <div className={styles.statsGrid}>
          <Card className={styles.statCard}>
            <CardBody>
              <div className={styles.statCardContent}>
                <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #800020 0%, #600018 100%)' }}>
                  <BookOpen size={24} />
                </div>
                <div className={styles.statInfo}>
                  <div className={styles.statValue}>{stats.enrolledClasses}</div>
                  <div className={styles.statLabel}>Enrolled Classes</div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className={styles.statCard}>
            <CardBody>
              <div className={styles.statCardContent}>
                <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                  <Target size={24} />
                </div>
                <div className={styles.statInfo}>
                  <div className={styles.statValue}>{stats.completedTasks}/{stats.totalTasks}</div>
                  <div className={styles.statLabel}>Tasks Completed</div>
                  <ProgressBar 
                    value={stats.completionRate} 
                    max={100}
                    variant="success"
                    size="sm"
                    className={styles.statProgress}
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className={styles.statCard}>
            <CardBody>
              <div className={styles.statCardContent}>
                <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                  <Trophy size={24} />
                </div>
                <div className={styles.statInfo}>
                  <div className={styles.statValue}>{stats.avgGrade}%</div>
                  <div className={styles.statLabel}>Average Grade</div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className={styles.statCard}>
            <CardBody>
              <div className={styles.statCardContent}>
                <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
                  <CalendarCheck size={24} />
                </div>
                <div className={styles.statInfo}>
                  <div className={styles.statValue}>{attendanceStats?.attendanceRate || 0}%</div>
                  <div className={styles.statLabel}>Attendance Rate</div>
                  <div className={styles.statSubtext}>
                    {attendanceStats?.present || 0}/{attendanceStats?.totalSessions || 0} sessions
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

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
            badges={badges}
            userStats={userStats}
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
            badges={badges}
            userStats={userStats}
          />
        )}
      </Container>
    </div>
  );
}

// Overview View Component
function OverviewView({ urgentTasks, tasks, attendance, attendanceStats, badges, userStats, navigate, setViewMode }) {
  return (
    <Grid cols={3} gap="1.5rem" className={styles.overviewGrid}>
      {/* Urgent Tasks Widget */}
      {urgentTasks.length > 0 && (
        <Card className={styles.urgentTasksCard}>
          <CardBody>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                <AlertCircle size={20} className={styles.urgentIcon} />
                <h3>Urgent Tasks</h3>
              </div>
              <Badge variant="danger" size="sm">{urgentTasks.length}</Badge>
            </div>
            <div className={styles.urgentTasksList}>
              {urgentTasks.map(task => (
                <div key={task.id} className={styles.urgentTaskItem}>
                  <div className={styles.urgentTaskInfo}>
                    <div className={styles.urgentTaskTitle}>{task.title}</div>
                    <div className={styles.urgentTaskMeta}>
                      {task.className} • Due {new Date(task.deadline.toDate()).toLocaleDateString('en-GB')}
                    </div>
                  </div>
                  <Button size="sm" variant="primary">
                    {task.type === 'quiz' ? 'Start' : 'Submit'}
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm" className={styles.viewAllButton} onClick={() => setViewMode('tasks')}>
              View All Tasks <ChevronRight size={16} />
            </Button>
          </CardBody>
        </Card>
      )}

      {/* Recent Attendance Widget */}
      <Card className={styles.attendanceCard}>
        <CardBody>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>
              <CalendarCheck size={20} />
              <h3>Recent Attendance</h3>
            </div>
          </div>
          <div className={styles.attendanceOverview}>
            <div className={styles.attendanceStats}>
              <div className={styles.attendanceStat}>
                <CheckCircle size={18} className={styles.presentIcon} />
                <span>{attendanceStats?.present || 0} Present</span>
              </div>
              <div className={styles.attendanceStat}>
                <XCircle size={18} className={styles.absentIcon} />
                <span>{attendanceStats?.absent || 0} Absent</span>
              </div>
              <div className={styles.attendanceStat}>
                <Clock size={18} className={styles.lateIcon} />
                <span>{attendanceStats?.late || 0} Late</span>
              </div>
            </div>
            <div className={styles.attendanceList}>
              {attendance.slice(0, 5).map((record, idx) => (
                <div key={idx} className={styles.attendanceItem}>
                  <div className={styles.attendanceDate}>
                    {new Date(record.date).toLocaleDateString('en-GB')}
                  </div>
                  <Badge 
                    variant={record.status === 'present' ? 'success' : record.status === 'absent' ? 'danger' : 'warning'}
                    size="sm"
                  >
                    {record.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
          <Button variant="ghost" size="sm" className={styles.viewAllButton} onClick={() => setViewMode('attendance')}>
            View Full History <ChevronRight size={16} />
          </Button>
        </CardBody>
      </Card>

      {/* Achievements Widget */}
      <Card className={styles.achievementsCard}>
        <CardBody>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>
              <Medal size={20} />
              <h3>Achievements</h3>
            </div>
            <Badge variant="primary" size="sm">{badges.length}</Badge>
          </div>
          <div className={styles.badgesList}>
            {badges.slice(0, 6).map((badge, idx) => (
              <div key={idx} className={styles.badgeItem} title={badge.name}>
                <div className={styles.badgeIcon}>{badge.icon || '🏆'}</div>
              </div>
            ))}
          </div>
          {badges.length === 0 && (
            <EmptyState
              icon={Medal}
              title="No badges yet"
              description="Complete tasks to earn achievements!"
              size="sm"
            />
          )}
          <Button variant="ghost" size="sm" className={styles.viewAllButton} onClick={() => setViewMode('performance')}>
            View All Achievements <ChevronRight size={16} />
          </Button>
        </CardBody>
      </Card>
    </Grid>
  );
}

// Tasks View Component
function TasksView({ filteredTasks, classes, selectedClass, setSelectedClass, taskFilter, setTaskFilter, statusFilter, setStatusFilter, navigate }) {
  return (
    <div className={styles.tasksView}>
      <Card>
        <CardBody>
          <div className={styles.tasksHeader}>
            <h2>My Tasks</h2>
            <div className={styles.tasksFilters}>
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
                size="sm"
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
            <div className={styles.tasksList}>
              {filteredTasks.map(task => (
                <TaskCard key={task.id} task={task} navigate={navigate} />
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

// Task Card Component
function TaskCard({ task, navigate }) {
  const statusConfig = {
    completed: { color: 'success', icon: CheckCircle, label: 'Completed' },
    pending: { color: 'default', icon: Clock, label: 'Pending' },
    urgent: { color: 'warning', icon: AlertCircle, label: 'Due Soon' },
    overdue: { color: 'danger', icon: XCircle, label: 'Overdue' }
  };

  const typeConfig = {
    quiz: { icon: FileQuestion, label: 'Quiz', color: '#800020' },
    homework: { icon: BookOpen, label: 'Homework', color: '#f59e0b' },
    resource: { icon: FileArchive, label: 'Resource', color: '#10b981' }
  };

  const status = statusConfig[task.status] || statusConfig.pending;
  const type = typeConfig[task.type] || typeConfig.homework;
  const TypeIcon = type.icon;
  const StatusIcon = status.icon;

  return (
    <div className={styles.taskCard}>
      <div className={styles.taskCardHeader}>
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
            size="sm"
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
            onClick={() => navigate(task.type === 'quiz' ? `/quiz/${task.id}` : `/activity/${task.id}`)}
          >
            <Play size={14} /> {task.type === 'quiz' ? 'Start Quiz' : 'View Details'}
          </Button>
        )}
      </div>
    </div>
  );
}

// Attendance View Component
function AttendanceView({ attendance, attendanceStats, classes }) {
  return (
    <div className={styles.attendanceView}>
      <Grid cols={2} gap="1.5rem">
        {/* Attendance Summary */}
        <Card>
          <CardBody>
            <h2>Attendance Summary</h2>
            <div className={styles.attendanceSummaryGrid}>
              <div className={styles.attendanceSummaryCard} style={{ background: 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)' }}>
                <CheckCircle size={32} className={styles.summaryIcon} />
                <div className={styles.summaryValue}>{attendanceStats?.present || 0}</div>
                <div className={styles.summaryLabel}>Present</div>
              </div>
              <div className={styles.attendanceSummaryCard} style={{ background: 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)' }}>
                <XCircle size={32} className={styles.summaryIcon} />
                <div className={styles.summaryValue}>{attendanceStats?.absent || 0}</div>
                <div className={styles.summaryLabel}>Absent</div>
              </div>
              <div className={styles.attendanceSummaryCard} style={{ background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)' }}>
                <Clock size={32} className={styles.summaryIcon} />
                <div className={styles.summaryValue}>{attendanceStats?.late || 0}</div>
                <div className={styles.summaryLabel}>Late</div>
              </div>
              <div className={styles.attendanceSummaryCard} style={{ background: 'linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%)' }}>
                <CalendarClock size={32} className={styles.summaryIcon} />
                <div className={styles.summaryValue}>{attendanceStats?.totalSessions || 0}</div>
                <div className={styles.summaryLabel}>Total Sessions</div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Attendance Rate */}
        <Card>
          <CardBody>
            <h2>Attendance Rate</h2>
            <div className={styles.attendanceRateDisplay}>
              <div className={styles.rateCircle}>
                <div className={styles.rateValue}>{attendanceStats?.attendanceRate || 0}%</div>
              </div>
              <ProgressBar 
                value={attendanceStats?.attendanceRate || 0} 
                max={100}
                variant={attendanceStats?.attendanceRate >= 80 ? 'success' : attendanceStats?.attendanceRate >= 60 ? 'warning' : 'danger'}
                size="lg"
                className={styles.rateProgress}
              />
            </div>
          </CardBody>
        </Card>
      </Grid>

      {/* Attendance History */}
      <Card className={styles.attendanceHistoryCard}>
        <CardBody>
          <h2>Attendance History</h2>
          {attendance.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="No attendance records"
              description="Your attendance will appear here once recorded."
            />
          ) : (
            <div className={styles.attendanceHistory}>
              {attendance.map((record, idx) => (
                <div key={idx} className={styles.attendanceHistoryItem}>
                  <div className={styles.historyDate}>
                    <Calendar size={16} />
                    {new Date(record.date).toLocaleDateString('en-GB', { 
                      weekday: 'short', 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div className={styles.historyClass}>
                    {classes.find(c => c.id === record.classId)?.name || 'Unknown Class'}
                  </div>
                  <Badge 
                    variant={
                      record.status === 'present' ? 'success' : 
                      record.status === 'absent' ? 'danger' : 
                      record.status === 'late' ? 'warning' : 'default'
                    }
                  >
                    {record.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

// Performance View Component
function PerformanceView({ tasks, quizResults, submissions, classes, badges, userStats }) {
  const performanceByType = useMemo(() => {
    const types = ['quiz', 'homework', 'resource'];
    return types.map(type => {
      const typeTasks = tasks.filter(t => t.type === type);
      const completed = typeTasks.filter(t => t.status === 'completed').length;
      const total = typeTasks.length;
      const graded = typeTasks.filter(t => t.isGraded && t.score != null);
      const avgScore = graded.length > 0
        ? Math.round(graded.reduce((sum, t) => sum + t.score, 0) / graded.length)
        : 0;

      return {
        type,
        completed,
        total,
        avgScore,
        completionRate: total > 0 ? ((completed / total) * 100).toFixed(1) : 0
      };
    });
  }, [tasks]);

  return (
    <div className={styles.performanceView}>
      <Grid cols={3} gap="1.5rem">
        {performanceByType.map(perf => (
          <Card key={perf.type} className={styles.performanceCard}>
            <CardBody>
              <h3 className={styles.performanceTitle}>
                {perf.type === 'quiz' ? 'Quiz' : perf.type === 'homework' ? 'Homework' : 'Resource'} Performance
              </h3>
              <div className={styles.performanceStats}>
                <div className={styles.performanceStat}>
                  <div className={styles.performanceValue}>{perf.completed}/{perf.total}</div>
                  <div className={styles.performanceLabel}>Completed</div>
                </div>
                <div className={styles.performanceStat}>
                  <div className={styles.performanceValue}>{perf.avgScore}%</div>
                  <div className={styles.performanceLabel}>Avg Score</div>
                </div>
              </div>
              <ProgressBar 
                value={perf.completionRate} 
                max={100}
                variant="primary"
                size="md"
              />
            </CardBody>
          </Card>
        ))}
      </Grid>

      {/* Badges Section */}
      <Card className={styles.badgesSection}>
        <CardBody>
          <h2>Achievements & Badges</h2>
          {badges.length === 0 ? (
            <EmptyState
              icon={Medal}
              title="No achievements yet"
              description="Complete tasks and maintain good attendance to earn badges!"
            />
          ) : (
            <div className={styles.badgesGrid}>
              {badges.map((badge, idx) => (
                <div key={idx} className={styles.badgeCard}>
                  <div className={styles.badgeIconLarge}>{badge.icon || '🏆'}</div>
                  <div className={styles.badgeName}>{badge.name}</div>
                  <div className={styles.badgeDescription}>{badge.description}</div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
