import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { getQuiz } from '../firebase/quizzes';
import { getUser } from '../firebase/firestore';
import { Container, Card, CardBody, Button, Spinner, Badge, Loading } from '../components/ui';
import {
  ArrowLeft, Clock, CheckCircle, HelpCircle, ListChecks, Play, Edit, Trophy
} from 'lucide-react';
import styles from './QuizPreviewPage.module.css';

export default function QuizPreviewPage() {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { quizId } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [quizData, setQuizData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  const loadQuiz = async () => {
    if (!quizId) {
      setError('Quiz ID not provided');
      return;
    }

    setLoading(true);
    try {
      const result = await getQuiz(quizId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to load quiz');
      }

      const quiz = result.data;
      
      // Load creator name (show only a clean name, never raw email)
      let creatorName = 'Unknown';
      if (quiz.createdBy) {
        try {
          const userResult = await getUser(quiz.createdBy);
          if (userResult.success && userResult.data) {
            const { realName, displayName, name, email } = userResult.data;
            const emailName = email ? email.split('@')[0] : '';
            creatorName = realName || displayName || name || emailName || 'Unknown';
          }
        } catch (err) {
          console.warn('Failed to load creator name:', err);
        }
      }

      setQuizData({
        ...quiz,
        creatorName,
        questionCount: quiz.questions?.length || 0
      });
    } catch (error) {
      setError(error.message || 'Failed to load quiz');
      console.error('Error loading quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const getQuestionIcon = (type) => {
    switch (type) {
      case 'multiple_choice':
        return <ListChecks size={16} />;
      case 'single_choice':
        return <CheckCircle size={16} />;
      case 'true_false':
        return <HelpCircle size={16} />;
      default:
        return <HelpCircle size={16} />;
    }
  };

  const getQuestionTypeLabel = (type) => {
    switch (type) {
      case 'multiple_choice':
        return 'Multiple Choice';
      case 'single_choice':
        return 'Single Choice';
      case 'true_false':
        return 'True/False';
      default:
        return 'Question';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch ((difficulty || '').toLowerCase()) {
      case 'beginner':
        return 'success';
      case 'intermediate':
        return 'warning';
      case 'advanced':
        return 'danger';
      default:
        return 'primary';
    }
  };

  const getDifficultyLabel = (difficulty) => {
    switch ((difficulty || '').toLowerCase()) {
      case 'beginner':
        return 'Beginner';
      case 'intermediate':
        return 'Intermediate';
      case 'advanced':
        return 'Advanced';
      default:
        return difficulty || 'General';
    }
  };

  const handleStartQuiz = () => {
    navigate(`/quiz/${quizId}`);
  };

  const handleEditQuiz = () => {
    navigate(`/quiz-builder?id=${quizId}`);
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

  if (error || !quizData) {
    return (
      <div className={styles.errorWrapper}>
        <Container maxWidth="lg">
          <Card>
            <CardBody className={styles.errorContent}>
              <h3>Error</h3>
              <p>{error || 'Quiz not found'}</p>
              <Button variant="outline" onClick={() => navigate('/quiz-management')}>
                Back to Quiz Management
              </Button>
            </CardBody>
          </Card>
        </Container>
      </div>
    );
  }

  return (
    <div className={styles.quizPreview}>
      <Container maxWidth="lg">
        {/* Header */}
        <div className={styles.previewHeader}>
          <div className={styles.previewTopBar}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/quiz-management')}
              title="Back"
              aria-label="Back to quiz management"
            >
              <ArrowLeft size={16} />
            </Button>

            <div className={styles.previewActions}>
              {user?.uid === quizData.createdBy || user?.isAdmin ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditQuiz}
                  title="Edit quiz"
                  aria-label="Edit quiz"
                >
                  <Edit size={16} />
                </Button>
              ) : null}
              <Button
                variant="primary"
                size="lg"
                onClick={handleStartQuiz}
                className={styles.startButton}
              >
                <Play size={18} style={{ marginRight: 8 }} />
                Start Quiz
              </Button>
            </div>
          </div>

          <div className={styles.previewHero}>
            <div className={styles.previewIcon}>
              <Trophy size={40} />
            </div>
            <div className={styles.quizInfo}>
              <h1 className={styles.quizTitle}>{quizData.title}</h1>
              <p className={styles.quizDescription}>{quizData.description}</p>
            </div>
          </div>

          <div className={styles.metaGrid}>
            <div className={styles.metaChip}>
              <span className={styles.metaIcon}><ListChecks size={16} /></span>
              <span>{quizData.questions.length} questions</span>
            </div>
            <div className={styles.metaChip}>
              <span className={styles.metaIcon}><Clock size={16} /></span>
              <span>{quizData.estimatedTime} minutes</span>
            </div>
            <div className={styles.metaChip}>
              <Badge variant={getDifficultyColor(quizData.difficulty)} size="sm">
                <span className={styles.metaIcon}><Trophy size={14} /></span>
                <span>{getDifficultyLabel(quizData.difficulty)}</span>
              </Badge>
            </div>
            <div className={styles.metaChip}>
              <span className={styles.metaLabel}>Created by</span>
              <span>{quizData.creatorName || 'Unknown'}</span>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className={styles.questionsSection}>
          <h2 className={styles.sectionTitle}>Question Breakdown</h2>
          <div className={styles.questionsList}>
            {quizData.questions.map((question, qIndex) => (
              <Card key={question.id} className={styles.questionCard}>
                <CardBody>
                  <div className={styles.questionHeader}>
                    <div className={styles.questionNumber}>#{qIndex + 1}</div>
                    <div className={styles.questionType}>
                      {getQuestionIcon(question.type)}
                      <span>{getQuestionTypeLabel(question.type)}</span>
                    </div>
                    <div className={styles.questionPoints}>
                      {question.points || 1} point{question.points !== 1 ? 's' : ''}
                    </div>
                  </div>

                  <div 
                    className={styles.questionText}
                    dangerouslySetInnerHTML={{ __html: question.question }}
                  />

                  <div className={styles.optionsList}>
                    {question.options?.map((option) => (
                      <div
                        key={option.id}
                        className={`${styles.optionItem} ${option.correct ? styles.correct : ''}`}
                      >
                        <div className={styles.optionIndicator}>
                          {option.correct ? (
                            <CheckCircle size={18} />
                          ) : (
                            <div className={styles.optionRadio} />
                          )}
                        </div>
                        <div 
                          className={styles.optionText}
                          dangerouslySetInnerHTML={{ __html: option.text }}
                        />
                      </div>
                    ))}
                  </div>

                  {question.explanation && (
                    <div className={styles.explanationSection}>
                      <h4>Explanation</h4>
                      <div dangerouslySetInnerHTML={{ __html: question.explanation }} />
                    </div>
                  )}

                  {question.timeLimit > 0 && (
                    <div className={styles.timeLimit}>
                      <Clock size={14} style={{ marginRight: 4 }} />
                      Time limit: {question.timeLimit} seconds
                    </div>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className={styles.footerActions}>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/quiz-management')}
          >
            Back to Quiz Management
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={handleStartQuiz}
          >
            <Play size={18} style={{ marginRight: 8 }} />
            Start Quiz
          </Button>
        </div>
      </Container>
    </div>
  );
}
