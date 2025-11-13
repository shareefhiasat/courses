import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAllQuizzes, getQuizSubmissions, getQuizAnalytics } from '../firebase/quizzes';
import { Trophy, Users, BarChart3, Clock, Download, Eye, Trash2, Edit } from 'lucide-react';

export default function QuizResultsPage() {
  const { user, isAdmin, isInstructor } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [analytics, setAnalytics] = useState(null);

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
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p>Loading quizzes...</p>
      </div>
    );
  }

  if (selectedQuiz) {
    return (
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '2rem' }}>
        <button
          onClick={() => { setSelectedQuiz(null); setSubmissions([]); setAnalytics(null); }}
          style={{ padding: '0.5rem 1rem', background: '#f3f4f6', border: 'none', borderRadius: 8, cursor: 'pointer', marginBottom: '1rem' }}
        >
          ← Back to All Quizzes
        </button>

        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: '0.5rem' }}>{selectedQuiz.title}</h1>
          <p style={{ color: 'var(--muted)' }}>{selectedQuiz.description}</p>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: '2rem' }}>
            <div style={{ padding: '1.5rem', background: 'white', borderRadius: 12, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.5rem' }}>
                <Users size={20} style={{ color: '#667eea' }} />
                <span style={{ fontSize: 14, color: 'var(--muted)' }}>Submissions</span>
              </div>
              <div style={{ fontSize: 32, fontWeight: 800 }}>{analytics.totalSubmissions}</div>
            </div>
            <div style={{ padding: '1.5rem', background: 'white', borderRadius: 12, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.5rem' }}>
                <Trophy size={20} style={{ color: '#f59e0b' }} />
                <span style={{ fontSize: 14, color: 'var(--muted)' }}>Avg Score</span>
              </div>
              <div style={{ fontSize: 32, fontWeight: 800 }}>{analytics.avgScore.toFixed(1)}</div>
            </div>
            <div style={{ padding: '1.5rem', background: 'white', borderRadius: 12, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.5rem' }}>
                <BarChart3 size={20} style={{ color: '#10b981' }} />
                <span style={{ fontSize: 14, color: 'var(--muted)' }}>Completion</span>
              </div>
              <div style={{ fontSize: 32, fontWeight: 800 }}>{analytics.completionRate.toFixed(0)}%</div>
            </div>
          </div>
        )}

        {/* Export Button */}
        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={exportCSV}
            style={{ padding: '0.75rem 1.5rem', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>

        {/* Submissions Table */}
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Student</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>Score</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>Percentage</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>Completed At</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((submission, idx) => (
                <tr key={submission.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem' }}>{submission.userName || submission.userId}</td>
                  <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>{submission.score}</td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 12px',
                      background: submission.percentage >= 80 ? '#d1fae5' : submission.percentage >= 60 ? '#fef3c7' : '#fee2e2',
                      color: submission.percentage >= 80 ? '#065f46' : submission.percentage >= 60 ? '#92400e' : '#991b1b',
                      borderRadius: 12,
                      fontSize: 14,
                      fontWeight: 600
                    }}>
                      {submission.percentage?.toFixed(1)}%
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center', fontSize: 14, color: 'var(--muted)' }}>
                    {submission.completedAt ? new Date(submission.completedAt.seconds * 1000).toLocaleString() : 'In progress'}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <button
                      onClick={() => alert('View details coming soon')}
                      style={{ padding: '0.5rem', background: '#f3f4f6', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {submissions.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
                    No submissions yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: '0.5rem' }}>Quiz Results</h1>
          <p style={{ color: 'var(--muted)' }}>View and manage quiz submissions</p>
        </div>
        <button
          onClick={() => navigate('/quiz-builder')}
          style={{ padding: '0.75rem 1.5rem', background: '#667eea', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
        >
          + Create New Quiz
        </button>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        {quizzes.map(quiz => (
          <div
            key={quiz.id}
            style={{
              padding: '1.5rem',
              background: 'white',
              borderRadius: 12,
              border: '1px solid var(--border)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onClick={() => loadQuizDetails(quiz)}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#667eea';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: '0.5rem' }}>{quiz.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: '1rem' }}>{quiz.description}</p>
                <div style={{ display: 'flex', gap: 16, fontSize: 14 }}>
                  <span style={{ color: 'var(--muted)' }}>
                    📝 {quiz.questions?.length || 0} questions
                  </span>
                  <span style={{ color: 'var(--muted)' }}>
                    🎮 {quiz.template}
                  </span>
                  {quiz.assignment?.isAssignment && (
                    <span style={{ padding: '2px 8px', background: '#fef3c7', color: '#92400e', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
                      Assignment
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/quiz-builder?id=${quiz.id}`); }}
                  style={{ padding: '0.5rem', background: '#f3f4f6', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                >
                  <Edit size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {quizzes.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', background: 'white', borderRadius: 12, border: '1px solid var(--border)' }}>
            <Trophy size={64} style={{ color: 'var(--muted)', marginBottom: '1rem', margin: '0 auto' }} />
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: '0.5rem' }}>No Quizzes Yet</h3>
            <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>Create your first quiz to get started</p>
            <button
              onClick={() => navigate('/quiz-builder')}
              style={{ padding: '0.75rem 2rem', background: '#667eea', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
            >
              Create Quiz
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
