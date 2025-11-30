import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { Container, Card, CardBody, Button, Badge, Spinner } from '../components/ui';
import {
  BookOpen, Clock, Users, Calendar, TrendingUp, Award,
  ChevronRight, Play, CheckCircle, AlertCircle
} from 'lucide-react';
import styles from './MyEnrollmentsPage.module.css';

export default function MyEnrollmentsPage() {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState([]);
  const [filter, setFilter] = useState('all'); // all, active, completed

  useEffect(() => {
    loadEnrollments();
  }, []);

  const loadEnrollments = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual Firebase call
      const mockEnrollments = [
        {
          id: '1',
          classId: 'class-1',
          className: 'Advanced Mathematics',
          classCode: 'MATH301',
          instructor: 'Dr. Smith',
          term: 'Fall 2024',
          schedule: 'Mon, Wed 10:00 AM - 11:30 AM',
          progress: 75,
          grade: 'A',
          status: 'active',
          totalHours: 45,
          completedHours: 34,
          nextClass: new Date(Date.now() + 2 * 60 * 60 * 1000),
          assignments: { pending: 2, completed: 8 },
          quizzes: { pending: 1, completed: 5 }
        },
        {
          id: '2',
          classId: 'class-2',
          className: 'Physics Principles',
          classCode: 'PHYS201',
          instructor: 'Prof. Johnson',
          term: 'Fall 2024',
          schedule: 'Tue, Thu 2:00 PM - 3:30 PM',
          progress: 60,
          grade: 'B+',
          status: 'active',
          totalHours: 40,
          completedHours: 24,
          nextClass: new Date(Date.now() + 5 * 60 * 60 * 1000),
          assignments: { pending: 3, completed: 5 },
          quizzes: { pending: 2, completed: 3 }
        },
        {
          id: '3',
          classId: 'class-3',
          className: 'Chemistry Fundamentals',
          classCode: 'CHEM101',
          instructor: 'Dr. Williams',
          term: 'Fall 2024',
          schedule: 'Mon, Wed, Fri 1:00 PM - 2:00 PM',
          progress: 90,
          grade: 'A',
          status: 'active',
          totalHours: 36,
          completedHours: 32,
          nextClass: new Date(Date.now() + 24 * 60 * 60 * 1000),
          assignments: { pending: 1, completed: 10 },
          quizzes: { pending: 0, completed: 6 }
        },
        {
          id: '4',
          classId: 'class-4',
          className: 'Biology Lab',
          classCode: 'BIO150',
          instructor: 'Prof. Davis',
          term: 'Summer 2024',
          schedule: 'Completed',
          progress: 100,
          grade: 'A-',
          status: 'completed',
          totalHours: 30,
          completedHours: 30,
          nextClass: null,
          assignments: { pending: 0, completed: 12 },
          quizzes: { pending: 0, completed: 8 }
        },
        {
          id: '5',
          classId: 'class-5',
          className: 'Computer Science Intro',
          classCode: 'CS101',
          instructor: 'Dr. Anderson',
          term: 'Summer 2024',
          schedule: 'Completed',
          progress: 100,
          grade: 'B+',
          status: 'completed',
          totalHours: 42,
          completedHours: 42,
          nextClass: null,
          assignments: { pending: 0, completed: 15 },
          quizzes: { pending: 0, completed: 10 }
        }
      ];
      
      setEnrollments(mockEnrollments);
    } catch (error) {
      console.error('Error loading enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredEnrollments = () => {
    if (filter === 'all') return enrollments;
    return enrollments.filter(e => e.status === filter);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" size="sm">Active</Badge>;
      case 'completed':
        return <Badge variant="primary" size="sm">Completed</Badge>;
      default:
        return <Badge variant="secondary" size="sm">{status}</Badge>;
    }
  };

  const getGradeColor = (grade) => {
    if (grade.startsWith('A')) return '#10b981';
    if (grade.startsWith('B')) return '#3b82f6';
    if (grade.startsWith('C')) return '#f59e0b';
    return '#ef4444';
  };

  const formatNextClass = (date) => {
    if (!date) return 'No upcoming class';
    
    const now = new Date();
    const diff = date - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `In ${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `In ${hours} hour${hours > 1 ? 's' : ''}`;
    return 'Starting soon';
  };

  const handleViewProgress = (classId) => {
    navigate(`/course-progress/${classId}`);
  };

  const handleStartLearning = (classId) => {
    navigate(`/activities?class=${classId}`);
  };

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <Container maxWidth="lg">
          <div className={styles.loadingContent}>
            <Spinner size="lg" />
            <p>Loading your enrollments...</p>
          </div>
        </Container>
      </div>
    );
  }

  const filteredEnrollments = getFilteredEnrollments();
  const activeCount = enrollments.filter(e => e.status === 'active').length;
  const completedCount = enrollments.filter(e => e.status === 'completed').length;

  return (
    <div className={styles.enrollmentsPage}>
      <Container maxWidth="lg">
        {/* Header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>My Enrollments</h1>
            <p className={styles.pageDescription}>
              View and manage your enrolled classes
            </p>
          </div>
          <div className={styles.headerStats}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{activeCount}</span>
              <span className={styles.statLabel}>Active</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{completedCount}</span>
              <span className={styles.statLabel}>Completed</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{enrollments.length}</span>
              <span className={styles.statLabel}>Total</span>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className={styles.filterTabs}>
          <button
            className={`${styles.filterTab} ${filter === 'all' ? styles.active : ''}`}
            onClick={() => setFilter('all')}
          >
            All Classes ({enrollments.length})
          </button>
          <button
            className={`${styles.filterTab} ${filter === 'active' ? styles.active : ''}`}
            onClick={() => setFilter('active')}
          >
            Active ({activeCount})
          </button>
          <button
            className={`${styles.filterTab} ${filter === 'completed' ? styles.active : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed ({completedCount})
          </button>
        </div>

        {/* Enrollments List */}
        <div className={styles.enrollmentsList}>
          {filteredEnrollments.length === 0 ? (
            <Card>
              <CardBody className={styles.emptyState}>
                <BookOpen size={48} style={{ color: '#ccc', marginBottom: 16 }} />
                <h3>No Enrollments Found</h3>
                <p>You don't have any {filter !== 'all' ? filter : ''} enrollments yet.</p>
              </CardBody>
            </Card>
          ) : (
            filteredEnrollments.map((enrollment) => (
              <Card key={enrollment.id} className={styles.enrollmentCard}>
                <CardBody>
                  <div className={styles.cardHeader}>
                    <div className={styles.classInfo}>
                      <div className={styles.classTitleRow}>
                        <h3 className={styles.className}>{enrollment.className}</h3>
                        {getStatusBadge(enrollment.status)}
                      </div>
                      <div className={styles.classMeta}>
                        <span className={styles.classCode}>{enrollment.classCode}</span>
                        <span className={styles.separator}>•</span>
                        <span>{enrollment.instructor}</span>
                        <span className={styles.separator}>•</span>
                        <span>{enrollment.term}</span>
                      </div>
                      <div className={styles.schedule}>
                        <Calendar size={14} />
                        <span>{enrollment.schedule}</span>
                      </div>
                    </div>
                    <div className={styles.gradeBox} style={{ borderColor: getGradeColor(enrollment.grade) }}>
                      <div className={styles.gradeValue} style={{ color: getGradeColor(enrollment.grade) }}>
                        {enrollment.grade}
                      </div>
                      <div className={styles.gradeLabel}>Grade</div>
                    </div>
                  </div>

                  <div className={styles.progressSection}>
                    <div className={styles.progressHeader}>
                      <span className={styles.progressLabel}>Progress</span>
                      <span className={styles.progressValue}>{enrollment.progress}%</span>
                    </div>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${enrollment.progress}%` }}
                      />
                    </div>
                    <div className={styles.progressStats}>
                      <span>{enrollment.completedHours} / {enrollment.totalHours} hours</span>
                    </div>
                  </div>

                  <div className={styles.statsRow}>
                    <div className={styles.statBox}>
                      <div className={styles.statIcon}>
                        <CheckCircle size={16} style={{ color: '#10b981' }} />
                      </div>
                      <div className={styles.statContent}>
                        <div className={styles.statNumber}>
                          {enrollment.assignments.completed}
                        </div>
                        <div className={styles.statText}>Assignments Done</div>
                      </div>
                    </div>
                    <div className={styles.statBox}>
                      <div className={styles.statIcon}>
                        <AlertCircle size={16} style={{ color: '#f59e0b' }} />
                      </div>
                      <div className={styles.statContent}>
                        <div className={styles.statNumber}>
                          {enrollment.assignments.pending}
                        </div>
                        <div className={styles.statText}>Pending</div>
                      </div>
                    </div>
                    <div className={styles.statBox}>
                      <div className={styles.statIcon}>
                        <Award size={16} style={{ color: '#8b5cf6' }} />
                      </div>
                      <div className={styles.statContent}>
                        <div className={styles.statNumber}>
                          {enrollment.quizzes.completed}
                        </div>
                        <div className={styles.statText}>Quizzes Done</div>
                      </div>
                    </div>
                  </div>

                  {enrollment.status === 'active' && enrollment.nextClass && (
                    <div className={styles.nextClassBanner}>
                      <Clock size={16} />
                      <span>Next class: {formatNextClass(enrollment.nextClass)}</span>
                    </div>
                  )}

                  <div className={styles.cardActions}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewProgress(enrollment.classId)}
                    >
                      View Progress
                      <ChevronRight size={16} style={{ marginLeft: 4 }} />
                    </Button>
                    {enrollment.status === 'active' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleStartLearning(enrollment.classId)}
                      >
                        <Play size={16} style={{ marginRight: 4 }} />
                        Continue Learning
                      </Button>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))
          )}
        </div>
      </Container>
    </div>
  );
}
