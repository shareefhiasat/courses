import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { getQuiz, submitQuiz } from '../firebase/quizzes';
import { addActivityLog } from '../firebase/firestore';
import { updateProgressAfterQuiz } from '../firebase/studentProgress';
import { useTimeTracking } from '../hooks/useTimeTracking';
import { randomizeQuestions, randomizeOptions } from '../utils/quizRandomization';
import { Container, Card, CardBody, Button, Badge, ProgressBar, Loading, Spinner, useToast, Tooltip } from '../components/ui';
import {
  Play, Clock, Trophy, AlertCircle, CheckCircle, XCircle,
  HelpCircle, ListChecks, ArrowLeft, ArrowRight, Flag, Save, RotateCcw, BookmarkCheck,
  Calculator as CalcIcon, Edit3, BookOpen, ChevronLeft, ChevronRight, Circle
} from 'lucide-react';
import Calculator from '../components/quiz/Calculator';
import ScratchPad from '../components/quiz/ScratchPad';
import FormulaSheet from '../components/quiz/FormulaSheet';
import DetailedResults from '../components/quiz/DetailedResults';
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
  
  // Track time spent taking quiz
  useTimeTracking(`quiz_${quizId}`, true);
  
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
  const [markedForReview, setMarkedForReview] = useState(new Set());
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [savedProgress, setSavedProgress] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [questionTimes, setQuestionTimes] = useState({}); // { [questionId]: seconds }
  const [shuffledQuestions, setShuffledQuestions] = useState(null); // Shuffled questions for this attempt
  const questionTimerRef = useRef({ questionId: null, startedAt: null });
  const toast = useToast();

  // Phase 4 tools
  const [showCalculator, setShowCalculator] = useState(false);
  const [showScratchPad, setShowScratchPad] = useState(false);
  const [showFormulas, setShowFormulas] = useState(false);
  const [showDetailedResults, setShowDetailedResults] = useState(false);

  // Use shuffled questions when quiz is started, otherwise original questions
  const activeQuestions = useMemo(() => {
    if (started && shuffledQuestions) return shuffledQuestions;
    return quiz?.questions || [];
  }, [started, shuffledQuestions, quiz?.questions]);

  const totalQuestions = activeQuestions.length;
  const answeredCount = useMemo(() => {
    if (!activeQuestions.length) return 0;
    return activeQuestions.reduce((count, question) => {
      const response = answers[question.id];
      if (Array.isArray(response)) {
        return count + (response.length > 0 ? 1 : 0);
      }
      return count + (response !== undefined && response !== null && response !== '' ? 1 : 0);
    }, 0);
  }, [answers, activeQuestions]);

  const markedCount = useMemo(() => markedForReview.size, [markedForReview]);

  useEffect(() => {
    loadQuiz();
    checkSavedProgress();
  }, [quizId]);

  useEffect(() => {
    let timer;
    if (started && !showResults) {
      timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [started, showResults]);

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

  const checkSavedProgress = async () => {
    if (!user?.uid || !quizId) return;
    
    try {
      const progressKey = `quiz_progress_${user.uid}_${quizId}`;
      const saved = localStorage.getItem(progressKey);
      if (saved) {
        const progress = JSON.parse(saved);
        setSavedProgress(progress);
        setShowResumeModal(true);
      }
    } catch (err) {
      console.error('Error checking saved progress:', err);
    }
  };

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
    setMarkedForReview(new Set());
    setElapsedTime(0);
    setQuestionTimes({});

    // Apply shuffle settings
    let questionsToUse = quiz?.questions || [];
    const settings = quiz?.settings || {};
    
    // Shuffle question order if enabled
    if (settings.randomizeOrder || settings.shuffleQuestions) {
      questionsToUse = randomizeQuestions(questionsToUse, user?.uid);
    }
    
    // Shuffle options within each question if enabled
    if (settings.shuffleOptions) {
      questionsToUse = questionsToUse.map(q => randomizeOptions(q, user?.uid));
    }
    
    setShuffledQuestions(questionsToUse);

    // Start per-question timer on first question
    const firstQuestion = questionsToUse[0];
    if (firstQuestion) {
      questionTimerRef.current = {
        questionId: firstQuestion.id,
        startedAt: Date.now()
      };
    } else {
      questionTimerRef.current = { questionId: null, startedAt: null };
    }

    if (quiz?.settings?.timeLimit) {
      setTimeLeft(quiz.settings.timeLimit * 60);
    }
    clearSavedProgress();
  };

  const resumeQuiz = () => {
    if (savedProgress) {
      setStarted(true);
      const idx = savedProgress.currentQuestionIndex || 0;
      setCurrentQuestionIndex(idx);
      setAnswers(savedProgress.answers || {});
      setMarkedForReview(new Set(savedProgress.markedForReview || []));
      setElapsedTime(savedProgress.elapsedTime || 0);
      setQuestionTimes({});

      const question = quiz?.questions?.[idx];
      if (question) {
        questionTimerRef.current = {
          questionId: question.id,
          startedAt: Date.now()
        };
      } else {
        questionTimerRef.current = { questionId: null, startedAt: null };
      }

      setShowResumeModal(false);
      toast?.showSuccess?.('Quiz resumed successfully');
    }
  };

  const startFresh = () => {
    clearSavedProgress();
    setShowResumeModal(false);
    startQuiz();
  };

  const saveProgress = () => {
    if (!user?.uid || !quizId) return;
    
    try {
      const progressKey = `quiz_progress_${user.uid}_${quizId}`;
      const progress = {
        currentQuestionIndex,
        answers,
        markedForReview: Array.from(markedForReview),
        elapsedTime,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(progressKey, JSON.stringify(progress));
      toast?.showSuccess?.('Progress saved successfully');
    } catch (err) {
      console.error('Error saving progress:', err);
      toast?.showError?.('Failed to save progress');
    }
  };

  const clearSavedProgress = () => {
    if (!user?.uid || !quizId) return;
    const progressKey = `quiz_progress_${user.uid}_${quizId}`;
    localStorage.removeItem(progressKey);
    setSavedProgress(null);
  };

  const toggleMarkForReview = (questionId) => {
    setMarkedForReview(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleMultipleChoiceAnswer = (questionId, optionId) => {
    const question = activeQuestions.find(q => q.id === questionId);
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

  function goToQuestionIndex(targetIndex) {
    if (!activeQuestions.length || !activeQuestions[targetIndex]) return;

    // Flush time spent on current question
    const { questionId, startedAt } = questionTimerRef.current || {};
    if (questionId && startedAt) {
      const deltaSec = Math.floor((Date.now() - startedAt) / 1000);
      if (deltaSec > 0) {
        setQuestionTimes(prev => ({
          ...prev,
          [questionId]: (prev?.[questionId] || 0) + deltaSec
        }));
      }
    }

    setCurrentQuestionIndex(targetIndex);
    const nextQuestion = activeQuestions[targetIndex];
    questionTimerRef.current = nextQuestion
      ? { questionId: nextQuestion.id, startedAt: Date.now() }
      : { questionId: null, startedAt: null };
  }

  const nextQuestion = () => {
    if (currentQuestionIndex < activeQuestions.length - 1) {
      goToQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      goToQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const goToNextMatchingQuestion = (predicate, emptyMessage) => {
    if (!activeQuestions.length) return;
    const total = activeQuestions.length;
    for (let offset = 1; offset <= total; offset += 1) {
      const idx = (currentQuestionIndex + offset) % total;
      if (predicate(activeQuestions[idx])) {
        goToQuestionIndex(idx);
        return;
      }
    }
    toast?.showInfo?.(emptyMessage);
  };

  const goToNextUnanswered = () => {
    goToNextMatchingQuestion((question) => {
      const response = answers[question.id];
      if (Array.isArray(response)) {
        return response.length === 0;
      }
      return response === undefined || response === null || response === '';
    }, 'All questions are answered');
  };

  const goToNextMarked = () => {
    goToNextMatchingQuestion((question) => markedForReview.has(question.id), 'No questions marked for review');
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Prepare per-question time map, including the currently active question
      const perQuestionTimes = { ...questionTimes };
      const { questionId, startedAt: timerStartedAt } = questionTimerRef.current || {};
      if (questionId && timerStartedAt) {
        const deltaSec = Math.floor((Date.now() - timerStartedAt) / 1000);
        if (deltaSec > 0) {
          perQuestionTimes[questionId] = (perQuestionTimes[questionId] || 0) + deltaSec;
        }
      }

      const calculateScore = (times) => {
        let correct = 0;
        let total = 0;
        const detailedAnswers = {};

        quiz.questions.forEach(question => {
          const userAnswer = answers[question.id];
          const correctOptions = question.options.filter(opt => opt.correct).map(opt => opt.id);
          const points = question.points || 1;

          total += points;
          let isCorrect = false;

          if (question.type === QUESTION_TYPES.MULTIPLE_CHOICE) {
            if (Array.isArray(userAnswer) &&
                userAnswer.length === correctOptions.length &&
                userAnswer.every(id => correctOptions.includes(id))) {
              isCorrect = true;
              correct += points;
            }
          } else {
            // Single choice and true/false
            if (userAnswer === correctOptions[0]) {
              isCorrect = true;
              correct += points;
            }
          }

          detailedAnswers[question.id] = {
            answer: userAnswer ?? null,
            isCorrect,
            timeSpent: times[question.id] || 0
          };
        });

        const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
        return { score: { correct, total, percentage }, detailedAnswers };
      };

      const { score, detailedAnswers } = calculateScore(perQuestionTimes);

      const completedAt = new Date();
      const totalTimeSeconds = elapsedTime;
      const quizStartedAt = new Date(completedAt.getTime() - totalTimeSeconds * 1000);

      const submission = {
        quizId,
        userId: user?.uid || null,
        userName: user?.displayName || user?.email || 'Anonymous',
        userEmail: user?.email || null,
        answers: detailedAnswers,
        score: score.correct,
        totalPoints: score.total,
        percentage: score.percentage,
        timeSpent: totalTimeSeconds,
        startedAt: quizStartedAt,
        completedAt,
        reviewedByInstructor: false,
        instructorFeedback: ''
      };

      const result = await submitQuiz(submission);
      if (result.success) {
        setResults(score);
        setShowResults(true);
        clearSavedProgress();
        
        // Update student progress in Firestore
        if (user?.uid) {
          try {
            await updateProgressAfterQuiz(user.uid, {
              quizId,
              score: score.correct,
              totalPoints: score.total,
              percentage: score.percentage
            });
          } catch (e) { console.warn('Failed to update student progress:', e); }
        }
        
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
        
        toast?.showSuccess?.('Quiz submitted successfully!');
      } else {
        setError('Failed to submit quiz');
        toast?.showError?.('Failed to submit quiz');
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
      <Loading
        variant="overlay"
        fullscreen
        message="Loading quiz..."
      />
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
                  className={styles.inlineButton}
                >
                  <Play size={20} />
                  Start
                </Button>
              </div>
            </CardBody>
          </Card>
        </Container>
      </div>
    );
  }

  if (showResults && results) {
    if (showDetailedResults) {
      return (
        <DetailedResults
          quiz={quiz}
          submission={{
            ...results,
            answers,
            userId: user.uid,
            quizId,
            timeSpent: elapsedTime
          }}
          classAverage={null} // TODO: Fetch from analytics
          topScore={null} // TODO: Fetch from analytics
          onRetryIncorrect={(questions) => {
            // Start practice mode with incorrect questions
            setQuiz({ ...quiz, questions });
            setAnswers({});
            setCurrentQuestionIndex(0);
            setShowResults(false);
            setShowDetailedResults(false);
            setStarted(true);
          }}
          onRetakeQuiz={() => {
            setShowResults(false);
            setShowDetailedResults(false);
            setStarted(false);
            setAnswers({});
            setCurrentQuestionIndex(0);
          }}
        />
      );
    }

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
                  variant="primary"
                  onClick={() => setShowDetailedResults(true)}
                >
                  View Detailed Results
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/activities')}
                >
                  Back to Activities
                </Button>
                {quiz.settings?.allowRetake && results.percentage < (quiz.settings?.passMark || 70) && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      // Reset results view and start a fresh attempt
                      setShowResults(false);
                      setResults(null);
                      setStarted(false);
                      setAnswers({});
                      setCurrentQuestionIndex(0);
                      startQuiz();
                    }}
                    className={styles.retakeButton}
                  >
                    <Play size={16} />
                    Retake Quiz
                    {quiz.difficulty && (
                      <Badge 
                        variant={quiz.difficulty === 'beginner' ? 'success' : quiz.difficulty === 'intermediate' ? 'warning' : 'danger'}
                        size="sm"
                        style={{ marginLeft: 8 }}
                      >
                        {quiz.difficulty}
                      </Badge>
                    )}
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>
        </Container>
      </div>
    );
  }

  const currentQuestion = activeQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / activeQuestions.length) * 100;

  return (
    <div className={styles.quizTaking}>
      <Container maxWidth="lg">
        {/* Compact Top Palette */}
        <div className={styles.topPalette}>
          <div className={styles.paletteHeader}>
            <Tooltip content="Exit Quiz">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/activities')}
                className={styles.iconButton}
              >
                <ArrowLeft size={18} />
              </Button>
            </Tooltip>
            <Tooltip content="Save Progress">
              <Button
                variant="ghost"
                size="sm"
                onClick={saveProgress}
                className={styles.iconButton}
              >
                <Save size={18} />
              </Button>
            </Tooltip>
            <span className={styles.paletteProgress}>Answered: {answeredCount}/{totalQuestions}</span>
            <span className={styles.paletteTimer}>
              <Clock size={14} /> {formatTime(elapsedTime)}
            </span>
            {timeLeft > 0 && (
              <span className={styles.paletteTimer} style={{ color: timeLeft < 300 ? '#ef4444' : '#6b7280' }}>
                <Clock size={14} /> {formatTime(timeLeft)}
              </span>
            )}
          </div>
          
          {activeQuestions.length > 1 && (
            <div className={styles.paletteQuestions}>
              {activeQuestions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined;
                const isMarked = markedForReview.has(q.id);
                const isCurrent = idx === currentQuestionIndex;
                return (
                  <button
                    key={q.id}
                    className={`${styles.paletteBtn} ${isCurrent ? styles.paletteCurrent : ''} ${isAnswered ? styles.paletteAnswered : ''} ${isMarked ? styles.paletteMarked : ''}`}
                    onClick={() => goToQuestionIndex(idx)}
                    title={`Question ${idx + 1}${isAnswered ? ' (Answered)' : ''}${isMarked ? ' (Marked)' : ''}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          )}
          
          <div className={styles.paletteLegend}>
            <span><div className={styles.legendCurrent}>●</div> Current</span>
            <span><CheckCircle size={14} /> Answered</span>
            <span><Flag size={14} /> Marked</span>
          </div>
        </div>

        {/* Compact Quiz Title */}
        <div className={styles.quizTitleSection}>
          <h2 className={styles.quizTitle}>{quiz.title}</h2>
          <span className={styles.questionProgress}>
            Question {currentQuestionIndex + 1} of {activeQuestions.length}
          </span>
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

        <div className={styles.questionLayout}>
          <div className={styles.questionColumn}>
            <Card className={styles.questionCard}>
              <CardBody>
                <div className={styles.questionHeader}>
                  <div className={styles.questionType}>
                    {getQuestionIcon(currentQuestion.type)}
                    <span>{getQuestionTypeLabel(currentQuestion.type)}</span>
                  </div>
                  <div className={styles.questionMeta}>
                    <div className={styles.questionPoints}>
                      {currentQuestion.points || 1} point{currentQuestion.points !== 1 ? 's' : ''}
                    </div>
                    <Button
                      variant={markedForReview.has(currentQuestion.id) ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => toggleMarkForReview(currentQuestion.id)}
                      title={markedForReview.has(currentQuestion.id) ? 'Unmark for review' : 'Mark for review'}
                      className={styles.iconMarkButton}
                    >
                      <BookmarkCheck size={16} />
                    </Button>
                  </div>
                </div>

                <h3
                  className={styles.questionText}
                  dangerouslySetInnerHTML={{ __html: currentQuestion.question }}
                />

                <div className={styles.optionsList}>
                  {currentQuestion.options.map((option) => {
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
                            <CheckCircle size={20} />
                          ) : (
                            <div className={styles.optionRadio} />
                          )}
                        </div>
                        <span
                          className={styles.optionText}
                          dangerouslySetInnerHTML={{ __html: option.text }}
                        />
                      </button>
                    );
                  })}
                </div>
              </CardBody>
            </Card>

            {/* Redesigned Bottom Navigation - Icon Only */}
            <div className={styles.bottomNav}>
              <div className={styles.navLeft}>
                <Tooltip content="Previous Question">
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={prevQuestion}
                    disabled={currentQuestionIndex === 0}
                    className={styles.navIconBtn}
                  >
                    <ChevronLeft size={20} />
                  </Button>
                </Tooltip>
                <Tooltip content="Next Unanswered">
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={goToNextUnanswered}
                    disabled={answeredCount === activeQuestions.length}
                    className={styles.navIconBtn}
                  >
                    <Circle size={18} />
                  </Button>
                </Tooltip>
                <Tooltip content="Next Marked">
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={goToNextMarked}
                    disabled={markedCount === 0}
                    className={styles.navIconBtn}
                  >
                    <Flag size={18} />
                  </Button>
                </Tooltip>
              </div>
              <div className={styles.navCenter}>
                <ProgressBar 
                  value={progress} 
                  max={100}
                  showLabel
                  label={`${answeredCount}/${totalQuestions}`}
                  className={styles.navProgress}
                />
              </div>
              <div className={styles.navRight}>
                <Tooltip content="Next Question">
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={nextQuestion}
                    disabled={currentQuestionIndex === activeQuestions.length - 1}
                    className={styles.navIconBtn}
                  >
                    <ChevronRight size={20} />
                  </Button>
                </Tooltip>
                <Tooltip content={currentQuestionIndex === activeQuestions.length - 1 ? "Submit Quiz" : "Skip to Submit"}>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={isSubmitting || Object.keys(answers).length === 0}
                    className={styles.submitBtn}
                  >
                    {isSubmitting ? <Spinner size="sm" /> : <CheckCircle size={20} />}
                  </Button>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* FABs for Tools */}
      <div className={styles.fabContainer}>
        {quiz.allowCalculator !== false && (
          <Tooltip content="Calculator">
            <button 
              className={`${styles.fab} ${showCalculator ? styles.fabActive : ''}`}
              onClick={() => setShowCalculator(!showCalculator)}
            >
              <CalcIcon size={20} />
            </button>
          </Tooltip>
        )}
        
        <Tooltip content="Scratch Pad">
          <button 
            className={`${styles.fab} ${showScratchPad ? styles.fabActive : ''}`}
            onClick={() => setShowScratchPad(!showScratchPad)}
          >
            <Edit3 size={20} />
          </button>
        </Tooltip>
        
        {quiz.formulas && quiz.formulas.length > 0 && (
          <Tooltip content="Formulas">
            <button 
              className={`${styles.fab} ${showFormulas ? styles.fabActive : ''}`}
              onClick={() => setShowFormulas(!showFormulas)}
            >
              <BookOpen size={20} />
            </button>
          </Tooltip>
        )}
      </div>

      {/* Phase 4 Tools - Floating Components */}
      {showCalculator && (
        <Calculator onClose={() => setShowCalculator(false)} />
      )}
      {showScratchPad && (
        <ScratchPad
          onClose={() => setShowScratchPad(false)}
          quizId={quizId}
          questionId={currentQuestion.id}
        />
      )}
      {showFormulas && quiz.formulas && (
        <FormulaSheet
          formulas={quiz.formulas}
          onClose={() => setShowFormulas(false)}
        />
      )}

      {/* Resume Modal */}
      {showResumeModal && savedProgress && (
        <Modal
          isOpen={showResumeModal}
          onClose={() => setShowResumeModal(false)}
          title="Resume Quiz?"
        >
          <div className={styles.resumeModal}>
            <p>You have an in-progress attempt for this quiz.</p>
            <div className={styles.progressInfo}>
              <div className={styles.progressItem}>
                <strong>Progress:</strong> {savedProgress.currentQuestionIndex + 1} / {quiz?.questions?.length || 0} questions
              </div>
              <div className={styles.progressItem}>
                <strong>Answers:</strong> {Object.keys(savedProgress.answers || {}).length} saved
              </div>
              <div className={styles.progressItem}>
                <strong>Saved:</strong> {new Date(savedProgress.savedAt).toLocaleString()}
              </div>
            </div>
            <p>Would you like to continue where you left off or start fresh?</p>
            <div className={styles.resumeActions}>
              <Button
                variant="outline"
                onClick={startFresh}
              >
                <RotateCcw size={16} style={{ marginRight: 6 }} />
                Start Fresh
              </Button>
              <Button
                variant="primary"
                onClick={resumeQuiz}
              >
                <Play size={16} style={{ marginRight: 6 }} />
                Continue
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
