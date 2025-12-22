import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { getAllQuizzes, getQuizSubmissions, getQuizAnalytics } from '../firebase/quizzes';
import { Container, Card, CardBody, Button, Spinner, Badge, Loading, Chart, EmptyState, Input, Select, SearchBar } from '../components/ui';
import { Trophy, Users, BarChart3, Download, Eye, Edit, ArrowLeft, Filter, TrendingUp, Calendar, Clock, CheckCircle, HelpCircle, Repeat, Award, Star, StarOff, Pin, Hourglass } from 'lucide-react';
import UnifiedCard from '../components/UnifiedCard';
import styles from './QuizResultsPage.module.css';

export default function QuizResultsPage() {
  const { user, isAdmin, isInstructor, loading: authLoading } = useAuth();
  const { t, lang } = useLang();
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
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [bookmarkFilter, setBookmarkFilter] = useState(false);
  const [featuredFilter, setFeaturedFilter] = useState(false);
  const [retakeFilter, setRetakeFilter] = useState(false);
  const [gradedFilter, setGradedFilter] = useState('all'); // 'all', 'graded', 'not_graded'

  // Get unique classes from quizzes - must be before early returns
  const availableClasses = React.useMemo(() => {
    const classes = new Set();
    quizzes.forEach(q => {
      if (q.classId) classes.add(q.classId);
      if (q.className) classes.add(q.className);
    });
    return Array.from(classes);
  }, [quizzes]);

  // Filter quizzes - must be before early returns
  const filteredQuizzes = React.useMemo(() => {
    return quizzes.filter(q => {
      const matchSearch = !searchTerm || 
        q.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchClass = classFilter === 'all' || q.classId === classFilter || q.className === classFilter;
      // Bookmark filter would need bookmarks state - skip for now
      const matchDifficulty = difficultyFilter === 'all' || (q.difficulty || '').toLowerCase() === difficultyFilter.toLowerCase();
      return matchSearch && matchClass && matchDifficulty;
    });
  }, [quizzes, searchTerm, classFilter, difficultyFilter]);

  useEffect(() => {
    if (user) {
      loadQuizzes();
    }
  }, [user]);


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
    <div className="content-section" style={{ padding: '1rem 0' }}>
      <Container maxWidth="xl">
      {/* Unified Filters Section (same style as ActivitiesPage) */}
      <div className="filters-section" style={{
        background: 'white',
        padding: '1rem 1.5rem',
        borderRadius: '12px',
        marginBottom: '2rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        position: 'relative'
      }}>
        {/* Row: Search + View Toggle + Create Button */}
        <div className="filter-group" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <input
              type="search"
              placeholder={t('search_quizzes') || 'Search quizzes...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 10 }}
            />
          </div>
        </div>

        {/* Difficulty chips */}
        <div style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap', marginRight: 12 }}>
          <button 
            onClick={() => setDifficultyFilter('all')} 
            title={t('all_difficulties') || 'All Difficulties'} 
            style={{ 
              padding: '6px 12px', 
              borderRadius: 999, 
              border: '1px solid rgba(0,0,0,0.06)', 
              background: difficultyFilter === 'all' ? 'var(--color-primary, #800020)' : '#fff', 
              color: difficultyFilter === 'all' ? '#fff' : 'var(--color-primary, #800020)', 
              fontWeight: 700 
            }}
          >
            {t('all_difficulties') || 'All Difficulties'}
          </button>
          {[
            { id: 'beginner', label: t('beginner') || 'Beginner', bg: '#e8f5e9', fg: '#2e7d32' },
            { id: 'intermediate', label: t('intermediate') || 'Intermediate', bg: '#fff7ed', fg: '#b45309' },
            { id: 'advanced', label: t('advanced') || 'Advanced', bg: '#fee2e2', fg: '#b91c1c' }
          ].map(lv => {
            const active = difficultyFilter === lv.id;
            return (
              <button 
                key={lv.id} 
                onClick={() => setDifficultyFilter(active ? 'all' : lv.id)} 
                title={lv.label}
                style={{ 
                  padding: '6px 12px', 
                  borderRadius: 999, 
                  border: '1px solid transparent', 
                  background: active ? lv.fg : lv.bg, 
                  color: active ? '#fff' : lv.fg, 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: 6, 
                  fontWeight: 600 
                }}
              >
                <Award size={14} /> {lv.label}
              </button>
            );
          })}
        </div>

        {/* Status toggles: bookmark, featured, retake, graded, pending */}
        <div style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => setBookmarkFilter(v => !v)} title={t('bookmarked') || 'Bookmarked'} style={{ width: 32, height: 32, borderRadius: 999, border: '1px solid #f5c518', background: bookmarkFilter ? '#f5c518' : '#fff', color: bookmarkFilter ? '#1f2937' : '#b45309', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            {bookmarkFilter ? <Star size={16} fill="#f5c518" /> : <StarOff size={16} />}
          </button>
          <button onClick={() => setFeaturedFilter(v => !v)} title={t('featured') || 'Featured'} style={{ width: 32, height: 32, borderRadius: 999, border: '1px solid #c7d2fe', background: featuredFilter ? '#4f46e5' : '#eef2ff', color: featuredFilter ? '#fff' : '#4f46e5', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <Pin size={16} />
          </button>
          <button onClick={() => setRetakeFilter(v => !v)} title={t('retake_allowed') || 'Retake'} style={{ width: 32, height: 32, borderRadius: 999, border: '1px solid #bae6fd', background: retakeFilter ? '#0ea5e9' : '#ecfeff', color: retakeFilter ? '#fff' : '#0ea5e9', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <Repeat size={16} />
          </button>
          <button onClick={() => setGradedFilter(p => p === 'graded' ? 'all' : 'graded')} title={t('graded') || 'Graded'} style={{ width: 32, height: 32, borderRadius: 999, border: '1px solid #bbf7d0', background: gradedFilter === 'graded' ? '#16a34a' : '#ecfdf5', color: gradedFilter === 'graded' ? '#fff' : '#16a34a', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={16} />
          </button>
          <button onClick={() => setGradedFilter(p => p === 'not_graded' ? 'all' : 'not_graded')} title={t('pending') || 'Pending'} style={{ width: 32, height: 32, borderRadius: 999, border: '1px solid #fde68a', background: gradedFilter === 'not_graded' ? '#f59e0b' : '#fffbeb', color: gradedFilter === 'not_graded' ? '#fff' : '#b45309', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <Hourglass size={16} />
          </button>
        </div>

        {/* Class filter chips */}
        {availableClasses.length > 0 && (
          <div style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap', marginRight: 12, marginTop: '0.5rem' }}>
            <button 
              onClick={() => setClassFilter('all')} 
              title={t('all_classes') || 'All Classes'} 
              style={{ 
                padding: '6px 12px', 
                borderRadius: 999, 
                border: '1px solid rgba(0,0,0,0.06)', 
                background: classFilter === 'all' ? 'var(--color-primary, #800020)' : '#fff', 
                color: classFilter === 'all' ? '#fff' : 'var(--color-primary, #800020)', 
                fontWeight: 700 
              }}
            >
              {t('all_classes') || 'All Classes'}
            </button>
            {availableClasses.map(cls => {
              const active = classFilter === cls;
              return (
                <button 
                  key={cls} 
                  onClick={() => setClassFilter(active ? 'all' : cls)} 
                  title={cls}
                  style={{ 
                    padding: '6px 12px', 
                    borderRadius: 999, 
                    border: '1px solid #cbd5e1', 
                    background: active ? '#475569' : '#f1f5f9', 
                    color: active ? '#fff' : '#475569', 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: 6, 
                    fontWeight: 600 
                  }}
                >
                  {cls}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
        {filteredQuizzes.length === 0 ? (
          <EmptyState 
            title={t('no_quizzes_found') || 'No quizzes found'} 
            message={t('try_adjusting_filters') || 'Try adjusting your filters'} 
          />
        ) : (
          filteredQuizzes.map(quiz => (
            <UnifiedCard
              key={quiz.id}
              flavor="quiz"
              item={quiz}
              lang={lang}
              t={t}
              onStart={() => loadQuizDetails(quiz)}
              onDetails={() => loadQuizDetails(quiz)}
            />
          ))
        )}
      </div>
      </Container>
    </div>
  );
}
