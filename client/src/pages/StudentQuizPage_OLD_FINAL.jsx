import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { getQuiz, submitQuiz } from '../firebase/quizzes';
import { addActivityLog } from '../firebase/firestore';
import { Container, Card, CardBody, Button, Spinner, Badge, ProgressBar } from '../components/ui';
import {
  Play, Clock, Trophy, AlertCircle, CheckCircle, XCircle,
  HelpCircle, ListChecks, ArrowLeft, ArrowRight, Flag
} from 'lucide-react';
import styles from './StudentQuizPage.module.css';

// Simplified question types matching the builder
const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'multiple_choice',
  SINGLE_CHOICE: 'single_choice',
  TRUE_FALSE: 'true_false'
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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  useEffect(() => {
    let timer;
    if (started && !showResults && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [started, showResults, timeLeft]);

  const loadQuiz = async () => {
    setLoading(true);
    try {
      const result = await getQuiz(quizId);
      if (result.success) {
        setQuiz(result.data);
        setTimeLeft(result.data.settings?.timeLimit * 60 || 0);
        
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
    } catch (err) {
      setError('Failed to load quiz');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = () => {
    setStarted(true);
    setCurrentQuestionIndex(0);
    setAnswers({});
    if (quiz.settings?.timeLimit) {
      setTimeLeft(quiz.settings.timeLimit * 60);
    }
  };

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleMultipleChoiceAnswer = (questionId, optionId) => {
    const question = quiz.questions.find(q => q.id === questionId);
    if (!question) return;

    const currentAnswers = answers[questionId] || [];
    let newAnswers;

    if (currentAnswers.includes(optionId)) {
      newAnswers = currentAnswers.filter(id => id !== optionId);
    } else {
      newAnswers = [...currentAnswers, optionId];
    }

    handleAnswer(questionId, newAnswers);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const calculateScore = () => {
        let correct = 0;
        let total = 0;

        quiz.questions.forEach(question => {
          const userAnswer = answers[question.id];
          const correctOptions = question.options.filter(opt => opt.correct).map(opt => opt.id);
          
          total += question.points || 1;

          if (question.type === QUESTION_TYPES.MULTIPLE_CHOICE) {
            if (Array.isArray(userAnswer) && 
                userAnswer.length === correctOptions.length &&
                userAnswer.every(id => correctOptions.includes(id))) {
              correct += question.points || 1;
            }
          } else {
            // Single choice and true/false
            if (userAnswer === correctOptions[0]) {
              correct += question.points || 1;
            }
          }
        });

        return { correct, total, percentage: Math.round((correct / total) * 100) };
      };

      const score = calculateScore();
      const submission = {
        quizId,
        userId: user?.uid || null,
        userName: user?.displayName || user?.email || 'Anonymous',
        answers,
        score: score.correct,
        totalPoints: score.total,
        percentage: score.percentage,
        completedAt: new Date().toISOString(),
        timeSpent: quiz.settings?.timeLimit ? (quiz.settings.timeLimit * 60 - timeLeft) : null
      };

      const result = await submitQuiz(submission);
      if (result.success) {
        setResults(score);
        setShowResults(true);
        
        // Log quiz submission
        if (user) {
          try {
            await addActivityLog({
              type: 'quiz_submit',
              userId: user.uid,
              email: user.email,
              displayName: user.displayName || user.email,
              userAgent: navigator.userAgent,
              metadata: { quizId, quizTitle: quiz?.title || 'Untitled Quiz', score: score.percentage }
            });
          } catch (e) { console.warn('Failed to log quiz submission:', e); }
        }
      } else {
        setError('Failed to submit quiz');
      }
    } catch (err) {
      setError('Failed to submit quiz');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionIcon = (type) => {
    switch (type) {
      case QUESTION_TYPES.MULTIPLE_CHOICE:
        return <ListChecks size={20} />;
      case QUESTION_TYPES.SINGLE_CHOICE:
        return <CheckCircle size={20} />;
      case QUESTION_TYPES.TRUE_FALSE:
        return <HelpCircle size={20} />;
      default:
        return <HelpCircle size={20} />;
    }
  };

  const getQuestionTypeLabel = (type) => {
    switch (type) {
      case QUESTION_TYPES.MULTIPLE_CHOICE:
        return 'Multiple Choice';
      case QUESTION_TYPES.SINGLE_CHOICE:
        return 'Single Choice';
      case QUESTION_TYPES.TRUE_FALSE:
        return 'True / False';
      default:
        return 'Question';
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <Spinner size="lg" />
        <p>Loading quiz...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorWrapper}>
        <Container maxWidth="md">
          <Card>
            <CardBody className={styles.errorContent}>
              <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: 16 }} />
              <h2>Error</h2>
              <p>{error}</p>
              <Button onClick={() => navigate('/activities')}>
                Back to Activities
              </Button>
            </CardBody>
          </Card>
        </Container>
      </div>
    );
  }

  if (!started) {
    return (
      <div className={styles.quizStart}>
        <Container maxWidth="md">
          <Card>
            <CardBody className={styles.startContent}>
              <div className={styles.quizHeader}>
                <div className={styles.quizIcon}>
                  <Trophy size={48} style={{ color: '#8b5cf6' }} />
                </div>
                <div>
                  <h1 className={styles.quizTitle}>{quiz.title}</h1>
                  <p className={styles.quizDescription}>{quiz.description}</p>
                </div>
              </div>

              <div className={styles.quizInfo}>
                <div className={styles.infoItem}>
                  <HelpCircle size={16} style={{ color: '#6b7280' }} />
                  <span>{quiz.questions.length} questions</span>
                </div>
                <div className={styles.infoItem}>
                  <Clock size={16} style={{ color: '#6b7280' }} />
                  <span>{quiz.estimatedTime || 10} min estimated</span>
                </div>
                <div className={styles.infoItem}>
                  <Trophy size={16} style={{ color: '#6b7280' }} />
                  <span>{quiz.difficulty}</span>
                </div>
                {quiz.settings?.timeLimit > 0 && (
                  <div className={styles.infoItem}>
                    <Clock size={16} style={{ color: '#ef4444' }} />
                    <span>{quiz.settings.timeLimit} min time limit</span>
                  </div>
                )}
              </div>

              <div className={styles.startActions}>
                <Button
                  variant="outline"
                  onClick={() => navigate('/activities')}
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  onClick={startQuiz}
                  size="lg"
                >
                  <Play size={20} style={{ marginRight: 8 }} />
                  Start Quiz
                </Button>
              </div>
            </CardBody>
          </Card>
        </Container>
      </div>
    );
  }

  if (showResults && results) {
    return (
      <div className={styles.quizResults}>
        <Container maxWidth="md">
          <Card>
            <CardBody className={styles.resultsContent}>
              <div className={styles.resultsHeader}>
                <Trophy size={64} style={{ color: results.percentage >= 70 ? '#10b981' : '#f59e0b' }} />
                <h1>Quiz Completed!</h1>
                <p className={styles.resultsTitle}>{quiz.title}</p>
              </div>

              <div className={styles.scoreDisplay}>
                <div className={styles.scoreCircle}>
                  <span className={styles.scorePercentage}>{results.percentage}%</span>
                  <span className={styles.scoreLabel}>Score</span>
                </div>
                <div className={styles.scoreDetails}>
                  <div className={styles.scoreItem}>
                    <span className={styles.scoreLabel}>Correct</span>
                    <span className={styles.scoreValue}>{results.correct}</span>
                  </div>
                  <div className={styles.scoreItem}>
                    <span className={styles.scoreLabel}>Total</span>
                    <span className={styles.scoreValue}>{results.total}</span>
                  </div>
                  <div className={styles.scoreItem}>
                    <span className={styles.scoreLabel}>Status</span>
                    <Badge 
                      variant={results.percentage >= 70 ? 'success' : 'warning'}
                      size="sm"
                    >
                      {results.percentage >= 70 ? 'Passed' : 'Failed'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className={styles.resultsActions}>
                <Button
                  variant="outline"
                  onClick={() => navigate('/activities')}
                >
                  Back to Activities
                </Button>
                {quiz.settings?.allowRetake && (
                  <Button
                    variant="primary"
                    onClick={startQuiz}
                  >
                    <Play size={16} style={{ marginRight: 6 }} />
                    Retake Quiz
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>
        </Container>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  return (
    <div className={styles.quizTaking}>
      <Container maxWidth="lg">
        {/* Quiz Header */}
        <div className={styles.quizHeader}>
          <div className={styles.headerLeft}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/activities')}
            >
              <ArrowLeft size={16} style={{ marginRight: 4 }} />
              Exit
            </Button>
            <div>
              <h2 className={styles.quizTitle}>{quiz.title}</h2>
              <p className={styles.questionProgress}>
                Question {currentQuestionIndex + 1} of {quiz.questions.length}
              </p>
            </div>
          </div>
          <div className={styles.headerRight}>
            {timeLeft > 0 && (
              <div className={styles.timer}>
                <Clock size={16} style={{ color: timeLeft < 300 ? '#ef4444' : '#6b7280' }} />
                <span style={{ color: timeLeft < 300 ? '#ef4444' : '#6b7280' }}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className={styles.progressSection}>
          <ProgressBar 
            value={progress} 
            max={100}
            variant="primary"
            size="sm"
          />
        </div>

        {/* Question Card */}
        <Card className={styles.questionCard}>
          <CardBody>
            <div className={styles.questionHeader}>
              <div className={styles.questionType}>
                {getQuestionIcon(currentQuestion.type)}
                <span>{getQuestionTypeLabel(currentQuestion.type)}</span>
              </div>
              <div className={styles.questionPoints}>
                {currentQuestion.points || 1} point{currentQuestion.points !== 1 ? 's' : ''}
              </div>
            </div>

            <h3 className={styles.questionText}>
              {currentQuestion.question}
            </h3>

            <div className={styles.optionsList}>
              {currentQuestion.options.map((option, index) => {
                const isSelected = currentQuestion.type === QUESTION_TYPES.MULTIPLE_CHOICE
                  ? (answers[currentQuestion.id] || []).includes(option.id)
                  : answers[currentQuestion.id] === option.id;

                return (
                  <button
                    key={option.id}
                    className={`${styles.optionButton} ${isSelected ? styles.selected : ''}`}
                    onClick={() => {
                      if (currentQuestion.type === QUESTION_TYPES.MULTIPLE_CHOICE) {
                        handleMultipleChoiceAnswer(currentQuestion.id, option.id);
                      } else {
                        handleAnswer(currentQuestion.id, option.id);
                      }
                    }}
                  >
                    <div className={styles.optionIndicator}>
                      {isSelected ? (
                        currentQuestion.type === QUESTION_TYPES.MULTIPLE_CHOICE ? (
                          <CheckCircle size={20} />
                        ) : (
                          <CheckCircle size={20} />
                        )
                      ) : (
                        <div className={styles.optionRadio} />
                      )}
                    </div>
                    <span className={styles.optionText}>{option.text}</span>
                  </button>
                );
              })}
            </div>
          </CardBody>
        </Card>

        {/* Navigation */}
        <div className={styles.navigation}>
          <div className={styles.navLeft}>
            <Button
              variant="outline"
              onClick={prevQuestion}
              disabled={currentQuestionIndex === 0}
            >
              <ArrowLeft size={16} style={{ marginRight: 6 }} />
              Previous
            </Button>
          </div>
          <div className={styles.navCenter}>
            <span className={styles.questionIndicator}>
              {currentQuestionIndex + 1} / {quiz.questions.length}
            </span>
          </div>
          <div className={styles.navRight}>
            {currentQuestionIndex === quiz.questions.length - 1 ? (
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={isSubmitting || Object.keys(answers).length === 0}
              >
                {isSubmitting ? <Spinner size="sm" /> : <Flag size={16} style={{ marginRight: 6 }} />}
                Submit Quiz
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={nextQuestion}
              >
                Next
                <ArrowRight size={16} style={{ marginLeft: 6 }} />
              </Button>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
