import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { getQuiz } from '../firebase/quizzes';
import { getUser } from '../firebase/firestore';
import { Container, Card, CardBody, Button, Spinner, Badge, Loading, useToast } from '../components/ui';
import {
  Clock, CheckCircle, HelpCircle, ListChecks, Play, Edit, Circle, Shuffle, Repeat, Award, ArrowLeft
} from 'lucide-react';
import styles from './QuizPreviewPage.module.css';

export default function QuizPreviewPage() {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { quizId } = useParams();
  const toast = useToast();
  
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
    toast?.showInfo?.('Starting quiz...');
    navigate(`/quiz/${quizId}`);
  };

  const handleEditQuiz = () => {
    navigate(`/quizzes?id=${quizId}`);
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
        <div className={styles.previewHeader} style={{ marginBottom: '2rem', padding: '2rem', background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '2rem' }}>
            <div style={{ flex: 1 }}>
              <Badge
                variant="outline"
                color="default"
                style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', marginBottom: '1.5rem' }}
                onClick={() => navigate('/quizzes')}
              >
                <ArrowLeft size={14} />
                Back to Edit
              </Badge>
              <h1 className={styles.quizTitle} style={{ marginBottom: '0.75rem', fontSize: '2rem', fontWeight: 700, color: '#1f2937' }}>{quizData.title}</h1>
              {quizData.description && (
                <p className={styles.quizDescription} style={{ color: '#6b7280', marginBottom: '1.25rem', fontSize: '1.1rem', lineHeight: '1.6' }}>{quizData.description}</p>
              )}
              <div className={styles.metaGrid} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <Badge variant="subtle" color="primary" size="medium">
                  {getQuestionIcon(quizData.type)}
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem' }}>{getQuestionTypeLabel(quizData.type)}</span>
                </Badge>
                <Badge variant="subtle" color="info" size="medium">
                  <ListChecks size={14} style={{ marginRight: '0.5rem' }} />
                  {quizData.questions.length} {quizData.questions.length === 1 ? 'question' : 'questions'}
                </Badge>
                <Badge variant="subtle" color="warning" size="medium">
                  <Award size={14} style={{ marginRight: '0.5rem' }} />
                  {quizData.questions.reduce((sum, q) => sum + (q.points || 1), 0)} points
                </Badge>
                {(quizData.settings?.timeLimit > 0) ? (
                  <Badge variant="outline" color="danger" size="medium">
                    <Clock size={14} style={{ marginRight: '0.5rem' }} />
                    {quizData.settings.timeLimit} min limit
                  </Badge>
                ) : (
                  <Badge variant="subtle" color="info" size="medium">
                    <Clock size={14} style={{ marginRight: '0.5rem' }} />
                    {quizData.estimatedTime} min
                  </Badge>
                )}
                <Badge variant="subtle" color={getDifficultyColor(quizData.difficulty)} size="medium">
                  {getDifficultyLabel(quizData.difficulty)}
                </Badge>
                {quizData.settings?.allowRetake && (
                  <Badge variant="outline" color="info" size="medium">
                    <Repeat size={14} style={{ marginRight: '0.5rem' }} />
                    Retake allowed
                  </Badge>
                )}
                {quizData.settings?.randomizeOrder && (
                  <Badge variant="outline" color="primary" size="medium">
                    <Shuffle size={14} style={{ marginRight: '0.5rem' }} />
                    Shuffle questions
                  </Badge>
                )}
                {quizData.settings?.shuffleOptions && (
                  <Badge variant="outline" color="primary" size="medium">
                    <Shuffle size={14} style={{ marginRight: '0.5rem' }} />
                    Shuffle options
                  </Badge>
                )}
                {quizData.creatorName && quizData.creatorName !== 'Unknown' && (
                  <Badge variant="outline" color="default" size="medium">
                    Created by {quizData.creatorName}
                  </Badge>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {user?.uid === quizData.createdBy || user?.isAdmin ? (
                <Badge
                  variant="outline"
                  color="primary"
                  style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                  onClick={handleEditQuiz}
                  title="Edit quiz"
                >
                  <Edit size={14} />
                  Edit
                </Badge>
              ) : null}
              <Badge
                variant="solid"
                color="success"
                style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', fontSize: '0.95rem', fontWeight: 600 }}
                onClick={handleStartQuiz}
              >
                <Play size={16} />
                Start Quiz
              </Badge>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className={styles.questionsSection} style={{ marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1f2937', marginBottom: '1.5rem' }}>Questions Preview</h2>
          <div className={styles.questionsList} style={{ display: 'grid', gap: '1.25rem' }}>
            {quizData.questions.map((question, qIndex) => (
              <Card key={question.id} className={styles.questionCard} style={{ padding: '1.5rem', background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <CardBody style={{ padding: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    <Badge variant="subtle" color="primary" size="medium">#{qIndex + 1}</Badge>
                    <Badge variant="outline" color="info" size="medium">
                      {getQuestionIcon(question.type)}
                      <span style={{ marginLeft: '0.5rem' }}>{getQuestionTypeLabel(question.type)}</span>
                    </Badge>
                    <Badge variant="subtle" color="default" size="medium">
                      {question.points || 1} point{question.points !== 1 ? 's' : ''}
                    </Badge>
                  </div>

                  <div 
                    className={styles.questionText}
                    style={{ marginBottom: '1.25rem', fontSize: '1.05rem', lineHeight: '1.7', color: '#374151' }}
                    dangerouslySetInnerHTML={{ __html: (lang === 'ar' ? (question.question_ar || question.question) : (question.question_en || question.question)) }}
                  />

                  <div className={styles.optionsList} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {question.options?.map((option) => (
                      <div
                        key={option.id}
                        className={`${styles.optionItem} ${option.correct ? styles.correct : ''}`}
                        style={{ 
                          padding: '1rem', 
                          borderRadius: '8px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.75rem',
                          background: option.correct ? '#f0fdf4' : '#f9fafb',
                          border: option.correct ? '1px solid #86efac' : '1px solid #e5e7eb'
                        }}
                      >
                        <div className={styles.optionIndicator}>
                          {option.correct ? (
                            <CheckCircle size={20} style={{ color: '#10b981' }} />
                          ) : (
                            <Circle size={20} style={{ color: '#9ca3af' }} />
                          )}
                        </div>
                        <div 
                          className={styles.optionText}
                          style={{ fontSize: '0.95rem', color: '#374151', lineHeight: '1.6' }}
                          dangerouslySetInnerHTML={{ __html: option.text }}
                        />
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>

      </Container>
    </div>
  );
}
