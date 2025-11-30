import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { Container, Card, CardBody, Button, Badge, Tabs } from '../components/ui';
import StatCard from '../components/ui/StatCard/StatCard';
import ProgressWidget from '../components/ui/ProgressWidget/ProgressWidget';
import Leaderboard from '../components/ui/Leaderboard/Leaderboard';
import {
  BookOpen, Clock, Trophy, Target, Calendar, Users, Play,
  CheckCircle, Lock, ChevronDown, ChevronUp, User, Award
} from 'lucide-react';
import styles from './CourseProgressDetailPage.module.css';

export default function CourseProgressDetailPage() {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { courseId } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [expandedChapters, setExpandedChapters] = useState(new Set());
  const [activeTab, setActiveTab] = useState('overview');
  
  const [courseData, setCourseData] = useState({
    title: 'Advanced Mathematics',
    description: 'Master complex mathematical concepts and problem-solving techniques',
    instructor: {
      name: 'Dr. Sarah Johnson',
      email: 'sarah.johnson@university.edu',
      avatar: null
    },
    enrolledStudents: 156,
    totalLessons: 42,
    completedLessons: 28,
    estimatedHours: 60,
    spentHours: 38,
    difficulty: 'intermediate',
    category: 'Mathematics',
    enrolledAt: new Date('2024-01-15'),
    lastAccessed: new Date(),
    overallProgress: 67,
    
    chapters: [
      {
        id: '1',
        title: 'Foundations of Calculus',
        description: 'Basic concepts and limits',
        lessons: 8,
        completedLessons: 8,
        estimatedTime: 12,
        progress: 100,
        locked: false,
        lessonsList: [
          { id: '1-1', title: 'Introduction to Limits', completed: true, duration: 45 },
          { id: '1-2', title: 'Limit Properties', completed: true, duration: 50 },
          { id: '1-3', title: 'Continuity', completed: true, duration: 40 },
          { id: '1-4', title: 'Derivatives Introduction', completed: true, duration: 55 },
          { id: '1-5', title: 'Differentiation Rules', completed: true, duration: 60 },
          { id: '1-6', title: 'Chain Rule', completed: true, duration: 45 },
          { id: '1-7', title: 'Implicit Differentiation', completed: true, duration: 50 },
          { id: '1-8', title: 'Related Rates', completed: true, duration: 55 }
        ]
      },
      {
        id: '2',
        title: 'Applications of Derivatives',
        description: 'Real-world applications and optimization',
        lessons: 10,
        completedLessons: 7,
        estimatedTime: 15,
        progress: 70,
        locked: false,
        lessonsList: [
          { id: '2-1', title: 'Critical Points', completed: true, duration: 40 },
          { id: '2-2', title: 'First Derivative Test', completed: true, duration: 45 },
          { id: '2-3', title: 'Second Derivative Test', completed: true, duration: 40 },
          { id: '2-4', title: 'Curve Sketching', completed: true, duration: 50 },
          { id: '2-5', title: "L'Hôpital's Rule", completed: true, duration: 45 },
          { id: '2-6', title: 'Optimization Problems', completed: true, duration: 55 },
          { id: '2-7', title: 'Newton\'s Method', completed: true, duration: 40 },
          { id: '2-8', title: 'Linear Approximation', completed: false, duration: 35 },
          { id: '2-9', title: 'Differentials', completed: false, duration: 30 },
          { id: '2-10', title: 'Applications Review', completed: false, duration: 60 }
        ]
      },
      {
        id: '3',
        title: 'Integration Techniques',
        description: 'Advanced integration methods',
        lessons: 12,
        completedLessons: 8,
        estimatedTime: 18,
        progress: 67,
        locked: false,
        lessonsList: [
          { id: '3-1', title: 'Antiderivatives', completed: true, duration: 45 },
          { id: '3-2', title: 'Area Under Curves', completed: true, duration: 50 },
          { id: '3-3', title: 'Definite Integrals', completed: true, duration: 55 },
          { id: '3-4', title: 'Fundamental Theorem', completed: true, duration: 60 },
          { id: '3-5', title: 'Substitution Rule', completed: true, duration: 50 },
          { id: '3-6', title: 'Integration by Parts', completed: true, duration: 55 },
          { id: '3-7', title: 'Trigonometric Integrals', completed: true, duration: 60 },
          { id: '3-8', title: 'Partial Fractions', completed: true, duration: 65 },
          { id: '3-9', title: 'Improper Integrals', completed: false, duration: 50 },
          { id: '3-10', title: 'Numerical Integration', completed: false, duration: 45 },
          { id: '3-11', title: 'Applications of Integration', completed: false, duration: 55 },
          { id: '3-12', title: 'Integration Review', completed: false, duration: 70 }
        ]
      },
      {
        id: '4',
        title: 'Advanced Topics',
        description: 'Multivariable calculus and beyond',
        lessons: 12,
        completedLessons: 5,
        estimatedTime: 15,
        progress: 42,
        locked: false,
        lessonsList: [
          { id: '4-1', title: 'Functions of Several Variables', completed: true, duration: 50 },
          { id: '4-2', title: 'Partial Derivatives', completed: true, duration: 55 },
          { id: '4-3', title: 'Gradients and Directional Derivatives', completed: true, duration: 60 },
          { id: '4-4', title: 'Maxima and Minima', completed: true, duration: 55 },
          { id: '4-5', title: 'Lagrange Multipliers', completed: true, duration: 65 },
          { id: '4-6', title: 'Double Integrals', completed: false, duration: 60 },
          { id: '4-7', title: 'Triple Integrals', completed: false, duration: 65 },
          { id: '4-8', title: 'Change of Variables', completed: false, duration: 55 },
          { id: '4-9', title: 'Vector Fields', completed: false, duration: 50 },
          { id: '4-10', title: 'Line Integrals', completed: false, duration: 60 },
          { id: '4-11', title: 'Surface Integrals', completed: false, duration: 65 },
          { id: '4-12', title: 'Final Review', completed: false, duration: 75 }
        ]
      }
    ],
    
    assignments: [
      {
        id: '1',
        title: 'Calculus Problem Set #1',
        description: 'Limits and derivatives practice',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        submitted: true,
        score: 92,
        maxScore: 100,
        priority: 'medium'
      },
      {
        id: '2',
        title: 'Optimization Project',
        description: 'Real-world optimization problems',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        submitted: false,
        score: null,
        maxScore: 100,
        priority: 'high'
      },
      {
        id: '3',
        title: 'Integration Techniques',
        description: 'Advanced integration methods',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        submitted: false,
        score: null,
        maxScore: 100,
        priority: 'medium'
      }
    ],
    
    quizzes: [
      {
        id: '1',
        title: 'Limits and Continuity Quiz',
        description: 'Test your understanding of limits',
        questions: 15,
        estimatedTime: 30,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        completed: true,
        score: 88
      },
      {
        id: '2',
        title: 'Derivatives Assessment',
        description: 'Comprehensive derivatives test',
        questions: 20,
        estimatedTime: 45,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        completed: false,
        score: null
      }
    ],
    
    leaderboard: [
      { id: '1', name: 'Alice Chen', score: 2850, avatar: null, subtitle: 'Top Performer' },
      { id: '2', name: 'Bob Smith', score: 2720, avatar: null, subtitle: 'Rising Star' },
      { id: '3', name: 'Carol Davis', score: 2680, avatar: null, subtitle: 'Consistent' },
      { id: '4', name: 'David Wilson', score: 2590, avatar: null, subtitle: 'Hard Worker' },
      { id: '5', name: 'Emma Thompson', score: 2450, avatar: null, subtitle: 'Improving' },
      { id: '6', name: 'Frank Martinez', score: 2380, avatar: null, subtitle: 'Dedicated' },
      { id: '7', name: 'Grace Lee', score: 2290, avatar: null, subtitle: 'Steady' },
      { id: '8', name: 'Henry Brown', score: 2150, avatar: null, subtitle: 'Progressing' }
    ]
  });

  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  const loadCourseData = async () => {
    setLoading(true);
    try {
      // Mock data loading - replace with actual Firebase calls
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error loading course data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleChapterExpansion = (chapterId) => {
    setExpandedChapters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chapterId)) {
        newSet.delete(chapterId);
      } else {
        newSet.add(chapterId);
      }
      return newSet;
    });
  };

  const calculateTimeRemaining = () => {
    const remainingLessons = courseData.totalLessons - courseData.completedLessons;
    const avgTimePerLesson = courseData.estimatedHours / courseData.totalLessons;
    return Math.round(remainingLessons * avgTimePerLesson);
  };

  const formatDueDate = (date) => {
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `${diffDays} days`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <Container maxWidth="lg">
          <div className={styles.loadingContent}>
            <div className={styles.loadingHeader} />
            <div className={styles.loadingStats} />
            <div className={styles.loadingTabs} />
          </div>
        </Container>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'chapters', label: 'Chapters' },
    { id: 'assignments', label: 'Assignments' },
    { id: 'quizzes', label: 'Quizzes' },
    { id: 'leaderboard', label: 'Leaderboard' }
  ];

  return (
    <div className={styles.courseProgressDetail}>
      <Container maxWidth="lg">
        {/* Course Header */}
        <div className={styles.courseHeader}>
          <div className={styles.headerContent}>
            <div className={styles.courseInfo}>
              <div className={styles.courseMeta}>
                <Badge variant="primary" size="sm">{courseData.category}</Badge>
                <Badge variant={courseData.difficulty === 'beginner' ? 'success' : courseData.difficulty === 'intermediate' ? 'warning' : 'danger'} size="sm">
                  {courseData.difficulty}
                </Badge>
              </div>
              <h1 className={styles.courseTitle}>{courseData.title}</h1>
              <p className={styles.courseDescription}>{courseData.description}</p>
              
              <div className={styles.instructorInfo}>
                <div className={styles.instructor}>
                  <User size={16} style={{ color: '#64748b' }} />
                  <span>{courseData.instructor.name}</span>
                </div>
                <div className={styles.enrollment}>
                  <Users size={16} style={{ color: '#64748b' }} />
                  <span>{courseData.enrolledStudents} students</span>
                </div>
                <div className={styles.enrollmentDate}>
                  <Calendar size={16} style={{ color: '#64748b' }} />
                  <span>Enrolled {courseData.enrolledAt.toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            <div className={styles.headerActions}>
              <Button
                variant="outline"
                onClick={() => navigate('/courses')}
              >
                Back to Courses
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  const nextLesson = courseData.chapters.find(ch => ch.progress < 100)?.lessonsList.find(l => !l.completed);
                  if (nextLesson) {
                    navigate(`/lesson/${nextLesson.id}`);
                  }
                }}
              >
                <Play size={16} style={{ marginRight: 6 }} />
                Continue Learning
              </Button>
            </div>
          </div>
        </div>

        {/* Course Stats */}
        <div className={styles.courseStats}>
          <div className={styles.statsGrid}>
            <StatCard
              title="Overall Progress"
              value={`${courseData.overallProgress}%`}
              icon={<Trophy size={24} />}
              color="success"
              trend="up"
              trendValue="+5% this week"
            />
            <StatCard
              title="Completed Lessons"
              value={`${courseData.completedLessons}/${courseData.totalLessons}`}
              icon={<CheckCircle size={24} />}
              color="primary"
              subtitle={`${courseData.totalLessons - courseData.completedLessons} remaining`}
            />
            <StatCard
              title="Time Spent"
              value={`${courseData.spentHours}h`}
              icon={<Clock size={24} />}
              color="info"
              trend="up"
              trendValue={`${calculateTimeRemaining()}h remaining`}
            />
            <StatCard
              title="Current Streak"
              value="7 days"
              icon={<Award size={24} />}
              color="warning"
              trend="up"
              trendValue="Personal best!"
            />
          </div>
        </div>

        {/* Tabs Content */}
        <div className={styles.tabsContent}>
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            className={styles.courseTabs}
          />

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className={styles.tabContent}>
              <div className={styles.overviewGrid}>
                <Card>
                  <CardBody>
                    <h3 className={styles.sectionTitle}>Course Progress</h3>
                    <ProgressWidget
                      title="Overall Completion"
                      value={courseData.overallProgress}
                      max={100}
                      label="Complete"
                      icon={<Target size={20} />}
                      color="success"
                      showTrend={true}
                      trend="up"
                      size="large"
                    />
                    
                    <div className={styles.progressBreakdown}>
                      <h4>Progress by Chapter</h4>
                      {courseData.chapters.map(chapter => (
                        <div key={chapter.id} className={styles.chapterProgress}>
                          <div className={styles.chapterInfo}>
                            <span className={styles.chapterName}>{chapter.title}</span>
                            <span className={styles.chapterStats}>
                              {chapter.completedLessons}/{chapter.lessons} lessons
                            </span>
                          </div>
                          <div className={styles.chapterProgressBar}>
                            <div
                              className={styles.chapterProgressFill}
                              style={{ width: `${chapter.progress}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody>
                    <h3 className={styles.sectionTitle}>Recent Activity</h3>
                    <div className={styles.activityList}>
                      <div className={styles.activityItem}>
                        <div className={styles.activityIcon}>
                          <CheckCircle size={16} style={{ color: '#10b981' }} />
                        </div>
                        <div className={styles.activityContent}>
                          <p className={styles.activityTitle}>Completed "Chain Rule"</p>
                          <p className={styles.activityTime}>2 hours ago</p>
                        </div>
                      </div>
                      <div className={styles.activityItem}>
                        <div className={styles.activityIcon}>
                          <Award size={16} style={{ color: '#f59e0b' }} />
                        </div>
                        <div className={styles.activityContent}>
                          <p className={styles.activityTitle}>Earned "Quick Learner" badge</p>
                          <p className={styles.activityTime}>Yesterday</p>
                        </div>
                      </div>
                      <div className={styles.activityItem}>
                        <div className={styles.activityIcon}>
                          <BookOpen size={16} style={{ color: '#8b5cf6' }} />
                        </div>
                        <div className={styles.activityContent}>
                          <p className={styles.activityTitle}>Started "Integration Techniques"</p>
                          <p className={styles.activityTime}>2 days ago</p>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>
            </div>
          )}

          {/* Chapters Tab */}
          {activeTab === 'chapters' && (
            <div className={styles.tabContent}>
              <div className={styles.chaptersList}>
                {courseData.chapters.map((chapter, index) => (
                  <Card key={chapter.id} className={styles.chapterCard}>
                    <CardBody>
                      <div
                        className={styles.chapterHeader}
                        onClick={() => toggleChapterExpansion(chapter.id)}
                      >
                        <div className={styles.chapterInfo}>
                          <div className={styles.chapterNumber}>
                            {chapter.locked ? (
                              <Lock size={20} style={{ color: '#64748b' }} />
                            ) : (
                              <span>{index + 1}</span>
                            )}
                          </div>
                          <div className={styles.chapterDetails}>
                            <h3 className={styles.chapterTitle}>{chapter.title}</h3>
                            <p className={styles.chapterDescription}>{chapter.description}</p>
                            <div className={styles.chapterMeta}>
                              <span>{chapter.completedLessons}/{chapter.lessons} lessons</span>
                              <span>•</span>
                              <span>{chapter.estimatedTime}h estimated</span>
                              <span>•</span>
                              <span>{chapter.progress}% complete</span>
                            </div>
                          </div>
                        </div>
                        <div className={styles.chapterActions}>
                          <div className={styles.expandIcon}>
                            {expandedChapters.has(chapter.id) ? (
                              <ChevronUp size={20} />
                            ) : (
                              <ChevronDown size={20} />
                            )}
                          </div>
                        </div>
                      </div>

                      {expandedChapters.has(chapter.id) && (
                        <div className={styles.lessonsList}>
                          {chapter.lessonsList.map(lesson => (
                            <div
                              key={lesson.id}
                              className={`${styles.lessonItem} ${lesson.completed ? styles.completed : ''}`}
                            >
                              <div className={styles.lessonStatus}>
                                {lesson.completed ? (
                                  <CheckCircle size={16} style={{ color: '#10b981' }} />
                                ) : (
                                  <div className={styles.lessonCircle} />
                                )}
                              </div>
                              <div className={styles.lessonInfo}>
                                <h4 className={styles.lessonTitle}>{lesson.title}</h4>
                                <span className={styles.lessonDuration}>{lesson.duration} min</span>
                              </div>
                              <Button
                                variant={lesson.completed ? 'outline' : 'primary'}
                                size="sm"
                                disabled={chapter.locked}
                              >
                                {lesson.completed ? 'Review' : 'Start'}
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Assignments Tab */}
          {activeTab === 'assignments' && (
            <div className={styles.tabContent}>
              <div className={styles.assignmentsList}>
                {courseData.assignments.map(assignment => (
                  <Card key={assignment.id}>
                    <CardBody>
                      <div className={styles.assignmentHeader}>
                        <div className={styles.assignmentInfo}>
                          <h3 className={styles.assignmentTitle}>{assignment.title}</h3>
                          <p className={styles.assignmentDescription}>{assignment.description}</p>
                          <div className={styles.assignmentMeta}>
                            <Badge
                              variant={assignment.priority === 'high' ? 'danger' : 'warning'}
                              size="sm"
                            >
                              {assignment.priority} priority
                            </Badge>
                            <span className={styles.dueDate}>
                              Due: {formatDueDate(assignment.dueDate)}
                            </span>
                          </div>
                        </div>
                        <div className={styles.assignmentStatus}>
                          {assignment.submitted ? (
                            <div className={styles.submittedInfo}>
                              <div className={styles.score}>
                                <span className={styles.scoreValue}>{assignment.score}</span>
                                <span className={styles.scoreMax}>/ {assignment.maxScore}</span>
                              </div>
                              <Badge variant="success" size="sm">Submitted</Badge>
                            </div>
                          ) : (
                            <Button variant="primary" size="sm">
                              Start Assignment
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Quizzes Tab */}
          {activeTab === 'quizzes' && (
            <div className={styles.tabContent}>
              <div className={styles.quizzesList}>
                {courseData.quizzes.map(quiz => (
                  <Card key={quiz.id}>
                    <CardBody>
                      <div className={styles.quizHeader}>
                        <div className={styles.quizInfo}>
                          <h3 className={styles.quizTitle}>{quiz.title}</h3>
                          <p className={styles.quizDescription}>{quiz.description}</p>
                          <div className={styles.quizMeta}>
                            <span>{quiz.questions} questions</span>
                            <span>•</span>
                            <span>{quiz.estimatedTime} min</span>
                            <span>•</span>
                            <span>Due: {formatDueDate(quiz.dueDate)}</span>
                          </div>
                        </div>
                        <div className={styles.quizStatus}>
                          {quiz.completed ? (
                            <div className={styles.completedQuiz}>
                              <div className={styles.score}>
                                <span className={styles.scoreValue}>{quiz.score}%</span>
                              </div>
                              <Badge variant="success" size="sm">Completed</Badge>
                            </div>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => navigate(`/quiz/${quiz.id}`)}
                            >
                              Start Quiz
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Leaderboard Tab */}
          {activeTab === 'leaderboard' && (
            <div className={styles.tabContent}>
              <Leaderboard
                data={courseData.leaderboard}
                title="Course Leaderboard"
                showRank={true}
                showScore={true}
                showProgress={false}
                maxItems={20}
              />
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
