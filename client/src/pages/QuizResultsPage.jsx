import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAllQuizzes, getQuizSubmissions, getQuizAnalytics } from '../firebase/quizzes';
import { Container, Card, CardBody, Button, Spinner, Badge, Loading, Chart, EmptyState, Input, Select, SearchBar } from '../components/ui';
import { Trophy, Users, BarChart3, Download, Eye, Edit, ArrowLeft, Filter, TrendingUp, Calendar } from 'lucide-react';
import styles from './QuizResultsPage.module.css';

export default function QuizResultsPage() {
  const { user, isAdmin, isInstructor } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [studentFilter, setStudentFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    setLoading(true);
    const result = await getAllQuizzes();
    if (result.success) {
      setQuizzes(result.data);
    }
    setLoading(false);
  };

  const loadQuizDetails = async (quiz) => {
    setSelectedQuiz(quiz);
    const [submissionsResult, analyticsResult] = await Promise.all([
      getQuizSubmissions(quiz.id),
      getQuizAnalytics(quiz.id)
    ]);
    
    if (submissionsResult.success) {
      setSubmissions(submissionsResult.data);
    }
    if (analyticsResult.success) {
      setAnalytics(analyticsResult.data);
    }
  };

  const exportCSV = () => {
    if (!submissions.length) return;
    
    const headers = ['Student', 'Score', 'Percentage', 'Completed At'];
    const rows = submissions.map(s => [
      s.userName || s.userId,
      s.score,
      s.percentage?.toFixed(1) + '%',
      new Date(s.completedAt?.seconds * 1000).toLocaleString()
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedQuiz.title}-results.csv`;
    a.click();
  };

  if (loading) {
    return (
      <Loading
        variant="overlay"
        fullscreen
        message="Loading quizzes..."
      />
    );
  }

  if (selectedQuiz) {
    return (
      <Container maxWidth="xl" className={styles.page}>
        <Button
          onClick={() => { setSelectedQuiz(null); setSubmissions([]); setAnalytics(null); }}
          variant="outline"
          icon={<ArrowLeft size={16} />}
          className={styles.backButton}
        >
          Back to All Quizzes
        </Button>

        <div className={styles.header}>
          <h1>{selectedQuiz.title}</h1>
          <p>{selectedQuiz.description}</p>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className={styles.analyticsGrid}>
            <Card>
              <CardBody>
                <div className={styles.statLabel}>
                  <Users size={20} style={{ color: '#667eea' }} />
                  <span>Submissions</span>
                </div>
                <div className={styles.statValue}>{analytics.totalSubmissions}</div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className={styles.statLabel}>
                  <Trophy size={20} style={{ color: '#f59e0b' }} />
                  <span>Avg Score</span>
                </div>
                <div className={styles.statValue}>{analytics.avgScore.toFixed(1)}</div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className={styles.statLabel}>
                  <BarChart3 size={20} style={{ color: '#10b981' }} />
                  <span>Completion</span>
                </div>
                <div className={styles.statValue}>{analytics.completionRate.toFixed(0)}%</div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Charts Row */}
        {analytics && submissions.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Score Distribution Chart */}
            <Card className={styles.chartCard}>
              <CardBody>
                <Chart
                  type="bar"
                  title="Score Distribution"
                  data={submissions.map((s, idx) => ({
                    name: s.userName || `#${idx + 1}`,
                    score: s.percentage || 0
                  }))}
                  xKey="name"
                  yKeys={['score']}
                  height={260}
                />
              </CardBody>
            </Card>

            {/* Per-Student Trend Chart */}
            <Card className={styles.chartCard}>
              <CardBody>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <TrendingUp size={20} style={{ color: '#667eea' }} />
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Student Performance Trends</h3>
                </div>
                <Chart
                  type="line"
                  data={(() => {
                    // Group submissions by student
                    const studentMap = {};
                    submissions.forEach(s => {
                      const name = s.userName || s.userId;
                      if (!studentMap[name]) studentMap[name] = [];
                      studentMap[name].push(s.percentage || 0);
                    });
                    // Calculate trend (show last 5 attempts per student)
                    return Object.entries(studentMap).slice(0, 5).map(([name, scores]) => ({
                      name,
                      avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
                      lastScore: scores[scores.length - 1]
                    }));
                  })()}
                  xKey="name"
                  yKeys={['avgScore', 'lastScore']}
                  height={260}
                />
              </CardBody>
            </Card>
          </div>
        )}

        {/* Question Difficulty Heatmap */}
        {analytics?.questionStats && (
          <Card className={styles.heatmapCard} style={{ marginBottom: '1.5rem' }}>
            <CardBody>
              <h2 className={styles.sectionTitle}>Question Difficulty Heatmap</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {Object.entries(analytics.questionStats).map(([questionId, stats]) => {
                  const attempts = stats.total || 0;
                  const correctPct = attempts > 0 ? (stats.correct / attempts) * 100 : 0;
                  const getColor = (pct) => {
                    if (pct >= 80) return '#10b981'; // green
                    if (pct >= 60) return '#f59e0b'; // yellow
                    if (pct >= 40) return '#f97316'; // orange
                    return '#ef4444'; // red
                  };
                  return (
                    <div
                      key={questionId}
                      style={{
                        backgroundColor: getColor(correctPct),
                        color: 'white',
                        padding: '1rem',
                        borderRadius: '8px',
                        textAlign: 'center',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                      }}
                      title={`${correctPct.toFixed(1)}% correct, ${attempts} attempts, ${Math.round(stats.avgTime || 0)}s avg`}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      Q{questionId.slice(-3)}
                      <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                        {correctPct.toFixed(0)}%
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', fontSize: '0.8rem', color: '#666' }}>
                <span><span style={{ display: 'inline-block', width: 12, height: 12, backgroundColor: '#10b981', borderRadius: 2, marginRight: 4 }}></span>Easy (≥80%)</span>
                <span><span style={{ display: 'inline-block', width: 12, height: 12, backgroundColor: '#f59e0b', borderRadius: 2, marginRight: 4 }}></span>Medium (60-79%)</span>
                <span><span style={{ display: 'inline-block', width: 12, height: 12, backgroundColor: '#f97316', borderRadius: 2, marginRight: 4 }}></span>Hard (40-59%)</span>
                <span><span style={{ display: 'inline-block', width: 12, height: 12, backgroundColor: '#ef4444', borderRadius: 2, marginRight: 4 }}></span>Very Hard {'(<40%)'}</span>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Question Difficulty Table */}
        {analytics?.questionStats && (
          <Card className={styles.questionStatsCard}>
            <CardBody>
              <h2 className={styles.sectionTitle}>Detailed Question Analysis</h2>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Question ID</th>
                    <th>Correct %</th>
                    <th>Attempts</th>
                    <th>Avg Time (sec)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(analytics.questionStats).map(([questionId, stats]) => {
                    const attempts = stats.total || 0;
                    const correctPct = attempts > 0 ? (stats.correct / attempts) * 100 : 0;
                    return (
                      <tr key={questionId}>
                        <td>{questionId}</td>
                        <td>
                          <Badge
                            variant={correctPct >= 80 ? 'success' : correctPct >= 50 ? 'warning' : 'danger'}
                          >
                            {correctPct.toFixed(1)}%
                          </Badge>
                        </td>
                        <td>{attempts}</td>
                        <td>{Math.round(stats.avgTime || 0)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardBody>
          </Card>
        )}

        {/* Export Button */}
        <div className={styles.exportWrapper}>
          <Button
            onClick={exportCSV}
            variant="success"
            icon={<Download size={18} />}
          >
            Export CSV
          </Button>
        </div>

        {/* Submissions Table with Student Filter */}
        <Card>
          <CardBody className={styles.tableContainer}>
            <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <SearchBar
                value={studentFilter}
                onChange={(e) => setStudentFilter(e.target.value)}
                placeholder="Search students..."
                style={{ maxWidth: 300 }}
              />
              <span style={{ fontSize: '0.9rem', color: '#666' }}>
                Showing {submissions.filter(s => 
                  studentFilter === 'all' || 
                  s.userName?.toLowerCase().includes(studentFilter.toLowerCase()) ||
                  s.userEmail?.toLowerCase().includes(studentFilter.toLowerCase())
                ).length} of {submissions.length} submissions
              </span>
            </div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Completed At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions
                  .filter(s => 
                    studentFilter === 'all' || 
                    s.userName?.toLowerCase().includes(studentFilter.toLowerCase()) ||
                    s.userEmail?.toLowerCase().includes(studentFilter.toLowerCase())
                  )
                  .map((submission) => (
                  <tr key={submission.id}>
                    <td>{submission.userName || submission.userId}</td>
                    <td className={styles.scoreCell}>{submission.score}</td>
                    <td>
                      <Badge variant={submission.percentage >= 80 ? 'success' : submission.percentage >= 60 ? 'warning' : 'danger'}>
                        {submission.percentage?.toFixed(1)}%
                      </Badge>
                    </td>
                    <td className={styles.dateCell}>
                      {submission.completedAt ? new Date(submission.completedAt.seconds * 1000).toLocaleString() : 'In progress'}
                    </td>
                    <td>
                      <Button
                        onClick={() => alert('View details coming soon')}
                        variant="ghost"
                        size="sm"
                        icon={<Eye size={16} />}
                      />
                    </td>
                  </tr>
                ))}
                {submissions.length === 0 && (
                  <tr>
                    <td colSpan="5" className={styles.emptyCell}>
                      No submissions yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardBody>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Quiz Results</h1>
          <p>View and manage quiz submissions</p>
        </div>
        <Button
          onClick={() => navigate('/quiz-builder')}
          variant="primary"
        >
          + Create New Quiz
        </Button>
      </div>

      {/* Filters Section */}
      <Card className={styles.filtersCard}>
        <CardBody>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              icon={<Filter size={16} />}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
            <SearchBar
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search quizzes..."
              style={{ flex: 1 }}
            />
          </div>
          
          {showFilters && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <Select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Classes' },
                  { value: 'class1', label: 'Class 1' },
                  { value: 'class2', label: 'Class 2' }
                ]}
                placeholder="Filter by class"
              />
              <Select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Time' },
                  { value: 'today', label: 'Today' },
                  { value: 'week', label: 'This Week' },
                  { value: 'month', label: 'This Month' }
                ]}
                placeholder="Filter by date"
              />
            </div>
          )}
        </CardBody>
      </Card>

      <div className={styles.quizList}>
        {quizzes
          .filter(q => {
            const matchSearch = !searchTerm || 
              q.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              q.description?.toLowerCase().includes(searchTerm.toLowerCase());
            return matchSearch;
          })
          .map(quiz => (
          <Card
            key={quiz.id}
            className={styles.quizCard}
          >
            <CardBody>
              <div 
                className={styles.quizContent}
                style={{ cursor: 'pointer' }}
                onClick={() => loadQuizDetails(quiz)}
              >
                <div className={styles.quizInfo}>
                  <h3>{quiz.title}</h3>
                  <p>{quiz.description}</p>
                  <div className={styles.quizMeta}>
                    <span>📝 {quiz.questions?.length || 0} questions</span>
                    <span>🎮 {quiz.template}</span>
                    {quiz.assignment?.isAssignment && (
                      <Badge variant="warning" size="sm">Assignment</Badge>
                    )}
                  </div>
                </div>
                <div 
                  className={styles.quizActions}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    onClick={() => navigate(`/quiz-builder?id=${quiz.id}`)}
                    variant="ghost"
                    size="sm"
                    icon={<Edit size={16} />}
                  />
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
        {quizzes.length === 0 && (
          <EmptyState
            icon={Trophy}
            title="No Quizzes Yet"
            description="Create your first quiz to get started"
            action={
              <Button
                onClick={() => navigate('/quiz-builder')}
                variant="primary"
              >
                Create Quiz
              </Button>
            }
          />
        )}
      </div>
    </Container>
  );
}
