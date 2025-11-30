import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getQuiz, submitQuiz } from '../firebase/quizzes';
import { addActivityLog } from '../firebase/firestore';
import TrueFalseGame from '../components/games/TrueFalseGame';
import SpinWheelGame from '../components/games/SpinWheelGame';
import GroupSortGame from '../components/games/GroupSortGame';
import AirplaneGame from '../components/games/AirplaneGame';
import AnagramGame from '../components/games/AnagramGame';
import CategorizeGame from '../components/games/CategorizeGame';
import { Play, Clock, Trophy, AlertCircle } from 'lucide-react';

const TEMPLATES = {
  MULTIPLE_CHOICE: 'multiple_choice',
  TRUE_FALSE: 'true_false',
  GROUP_SORT: 'group_sort',
  SPIN_WHEEL: 'spin_wheel',
  CATEGORIZE: 'categorize',
  AIRPLANE: 'airplane',
  ANAGRAM: 'anagram'
};

export default function StudentQuizPage() {
  const { quizId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  const loadQuiz = async () => {
    setLoading(true);
    const result = await getQuiz(quizId);
    if (result.success) {
      setQuiz(result.data);
      // Log quiz view
      if (user) {
        try {
          await addActivityLog({
            type: 'activity_viewed',
            userId: user.uid,
            email: user.email,
            displayName: user.displayName || user.email,
            userAgent: navigator.userAgent,
            metadata: { quizId, quizTitle: result.data?.title || 'Untitled Quiz', activityType: 'quiz' }
          });
        } catch (e) { console.warn('Failed to log quiz view:', e); }
      }
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleComplete = async (results) => {
    const isPublic = quiz?.visibility === 'public';
    const allowAnon = !!quiz?.allowAnonymous;
    const submission = user
      ? {
          quizId,
          userId: user.uid,
          userName: user.displayName || user.email,
          ...results
        }
      : {
          quizId,
          isAnonymous: true,
          userId: null,
          userName: 'Anonymous',
          ...results
        };

    // If not logged in, only allow when public and anonymous is allowed
    if (!user && !(isPublic && allowAnon)) {
      alert('Please login to submit this quiz.');
      navigate('/login');
      return;
    }

    const result = await submitQuiz(submission);
    if (result.success) {
      // Log quiz submission
      if (user) {
        try {
          await addActivityLog({
            type: 'quiz_submit',
            userId: user.uid,
            email: user.email,
            displayName: user.displayName || user.email,
            userAgent: navigator.userAgent,
            metadata: { quizId, quizTitle: quiz?.title || 'Untitled Quiz', score: results.score, maxScore: results.maxScore }
          });
        } catch (e) { console.warn('Failed to log quiz submit:', e); }
      }
      // Show success or navigate to results
      alert('Quiz submitted successfully!');
      navigate('/activities');
    } else {
      alert('Failed to submit quiz: ' + result.error);
    }
  };

  if (loading || authLoading) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p>Loading quiz...</p>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
        <AlertCircle size={64} style={{ color: '#ef4444', marginBottom: '1rem', margin: '0 auto' }} />
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: '1rem' }}>Quiz Not Found</h2>
        <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>{error || 'This quiz does not exist or has been deleted.'}</p>
        <button
          onClick={() => navigate('/activities')}
          style={{ padding: '0.75rem 2rem', background: '#667eea', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
        >
          Back to Activities
        </button>
      </div>
    );
  }

  // Gate start: if quiz is not public and no user, require login
  const isPublic = quiz?.visibility === 'public';
  const allowAnon = !!quiz?.allowAnonymous;

  if (!started) {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '2rem' }}>
        <div style={{ padding: '2rem', background: 'white', borderRadius: 16, border: '1px solid var(--border)', textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: '1rem' }}>
            {quiz.template === TEMPLATES.TRUE_FALSE && '✓✗'}
            {quiz.template === TEMPLATES.SPIN_WHEEL && '🎡'}
            {quiz.template === TEMPLATES.GROUP_SORT && '📊'}
            {quiz.template === TEMPLATES.AIRPLANE && '✈️'}
            {quiz.template === TEMPLATES.ANAGRAM && '🔤'}
            {quiz.template === TEMPLATES.CATEGORIZE && '🗂️'}
            {quiz.template === TEMPLATES.MULTIPLE_CHOICE && '📝'}
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: '1rem' }}>{quiz.title}</h1>
          {quiz.description && (
            <p style={{ fontSize: 16, color: 'var(--muted)', marginBottom: '2rem' }}>{quiz.description}</p>
          )}
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: '2rem', textAlign: 'left' }}>
            <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: '0.25rem' }}>Questions</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{quiz.questions?.length || 0}</div>
            </div>
            {quiz.settings?.timeLimit > 0 && (
              <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: '0.25rem' }}>Time Limit</div>
                <div style={{ fontSize: 24, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={20} />
                  {quiz.settings.timeLimit} min
                </div>
              </div>
            )}
            {quiz.settings?.showLeaderboard && (
              <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: '0.25rem' }}>Leaderboard</div>
                <div style={{ fontSize: 24, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Trophy size={20} />
                  Enabled
                </div>
              </div>
            )}
          </div>

          {quiz.assignment?.deadline && (
            <div style={{ padding: '1rem', background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8, marginBottom: '2rem' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#92400e' }}>
                Deadline: {new Date(quiz.assignment.deadline).toLocaleString()}
              </div>
            </div>
          )}

          <button
            onClick={() => {
              if (!user && !isPublic) {
                alert('Please login to take this quiz.');
                navigate('/login');
                return;
              }
              if (!user && isPublic && !allowAnon) {
                alert('This public quiz requires login to play.');
                navigate('/login');
                return;
              }
              setStarted(true);
            }}
            style={{
              padding: '1rem 3rem',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              fontSize: 18,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <Play size={20} />
            Start Quiz
          </button>
        </div>
      </div>
    );
  }

  // Render appropriate game template
  const renderGame = () => {
    const gameProps = {
      questions: quiz.questions,
      settings: quiz.settings,
      onComplete: handleComplete
    };

    switch (quiz.template) {
      case TEMPLATES.TRUE_FALSE:
        // Convert questions to true/false format
        const tfQuestions = quiz.questions.map(q => ({
          ...q,
          correctAnswer: q.options?.find(opt => opt.correct)?.text === 'True'
        }));
        return <TrueFalseGame {...gameProps} questions={tfQuestions} />;
      
      case TEMPLATES.SPIN_WHEEL:
        return <SpinWheelGame {...gameProps} />;
      
      case TEMPLATES.GROUP_SORT:
        // Convert to group sort format
        const groups = [
          { name: 'True', items: [], color: '#10b981' },
          { name: 'False', items: [], color: '#ef4444' }
        ];
        quiz.questions.forEach(q => {
          const correctOption = q.options?.find(opt => opt.correct);
          if (correctOption?.text === 'True') {
            groups[0].items.push(q.question);
          } else {
            groups[1].items.push(q.question);
          }
        });
        return <GroupSortGame data={{ groups }} settings={gameProps.settings} onComplete={handleComplete} />;
      
      case TEMPLATES.AIRPLANE:
        return <AirplaneGame {...gameProps} />;
      
      case TEMPLATES.ANAGRAM:
        // Convert to anagram format
        const anagramQuestions = quiz.questions.map(q => ({
          ...q,
          hint: q.question,
          answer: q.options?.find(opt => opt.correct)?.text || ''
        }));
        return <AnagramGame {...gameProps} questions={anagramQuestions} />;
      
      case TEMPLATES.CATEGORIZE:
        // Similar to group sort but with more categories
        const categories = [
          { name: 'Yes', items: [], color: '#10b981' },
          { name: 'No', items: [], color: '#ef4444' },
          { name: 'Maybe', items: [], color: '#f59e0b' }
        ];
        return <CategorizeGame data={{ categories }} settings={gameProps.settings} onComplete={handleComplete} />;
      
      default:
        return <div>Unsupported template</div>;
    }
  };

  return renderGame();
}
