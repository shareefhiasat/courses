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
import ChatGame from '../components/games/ChatGame';
import MultipleChoiceGame from '../components/games/MultipleChoiceGame';
import { Container, Card, CardBody, Button, Spinner, Badge, Grid } from '../components/ui';
import { Play, Clock, Trophy, AlertCircle } from 'lucide-react';
import { useLang } from '../contexts/LangContext';

const TEMPLATES = {
  MULTIPLE_CHOICE: 'multiple_choice',
  TRUE_FALSE: 'true_false',
  GROUP_SORT: 'group_sort',
  SPIN_WHEEL: 'spin_wheel',
  CATEGORIZE: 'categorize',
  AIRPLANE: 'airplane',
  ANAGRAM: 'anagram',
  CHAT_QUIZ: 'chat_quiz'
};

export default function StudentQuizPage() {
  const { t, lang } = useLang();
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-500 dark:text-gray-400">{t('loading') || 'Loading...'}</p>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
          <AlertCircle size={64} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('quiz_not_found') || 'Quiz Not Found'}</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{error || t('quiz_not_found_desc') || 'This quiz does not exist or has been deleted.'}</p>
          <Button variant="primary" onClick={() => navigate('/activities')}>
            {t('back_to_activities') || 'Back to Activities'}
          </Button>
        </div>
      </div>
    );
  }

  // Gate start: if quiz is not public and no user, require login
  const isPublic = quiz?.visibility === 'public';
  const allowAnon = !!quiz?.allowAnonymous;

  if (!started) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-8 sm:p-12 text-center">
              <div className="text-6xl mb-6 animate-bounce">
                {quiz.template === TEMPLATES.TRUE_FALSE && '✓✗'}
                {quiz.template === TEMPLATES.SPIN_WHEEL && '🎡'}
                {quiz.template === TEMPLATES.GROUP_SORT && '📊'}
                {quiz.template === TEMPLATES.AIRPLANE && '✈️'}
                {quiz.template === TEMPLATES.ANAGRAM && '🔤'}
                {quiz.template === TEMPLATES.CATEGORIZE && '🗂️'}
                {quiz.template === TEMPLATES.MULTIPLE_CHOICE && '📝'}
                {quiz.template === TEMPLATES.CHAT_QUIZ && '💬'}
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
                {quiz.title}
              </h1>

              {quiz.description && (
                <p className="text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                  {quiz.description}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('questions') || 'Questions'}</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{quiz.questions?.length || 0}</div>
                </div>

                {quiz.settings?.timeLimit > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('time_limit') || 'Time Limit'}</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
                      <Clock size={20} className="text-indigo-500" />
                      {quiz.settings.timeLimit} min
                    </div>
                  </div>
                )}

                {quiz.settings?.showLeaderboard && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('leaderboard') || 'Leaderboard'}</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
                      <Trophy size={20} className="text-yellow-500" />
                      {t('enabled') || 'Enabled'}
                    </div>
                  </div>
                )}
              </div>

              {quiz.assignment?.deadline && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-sm font-medium mb-8">
                  <Clock size={16} />
                  {t('deadline') || 'Deadline'}: {new Date(quiz.assignment.deadline).toLocaleString()}
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
                className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white text-lg font-bold rounded-xl hover:bg-indigo-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-indigo-500/30 flex items-center justify-center gap-3"
              >
                <Play size={24} fill="currentColor" />
                {t('start_quiz') || 'Start Quiz'}
              </button>
            </div>
          </div>
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

      case TEMPLATES.MULTIPLE_CHOICE:
        return <MultipleChoiceGame {...gameProps} />;

      case TEMPLATES.CHAT_QUIZ:
        return <ChatGame {...gameProps} />;

      default:
        return <div>Unsupported template</div>;
    }
  };

  return renderGame();
}
