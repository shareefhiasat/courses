import React, { useState, useEffect, useCallback, useMemo, useLayoutEffect } from 'react';
import { info, error, warn, debug } from '@services/utils/logger.js';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { DIFFICULTY_TYPES, DIFFICULTY_LABELS } from '@constants/difficultyTypes';
import { getQuiz } from '@services/business/quizService';
import { getUser } from '@services/business/userService';
import { Container, Card, CardBody, Button, Spinner, Badge, useToast } from '@ui';
import { GlobalLoadingFallback, useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import {
  Clock, CheckCircle, HelpCircle, ListChecks, Play, Edit, Circle, Shuffle, Repeat, Award, ArrowLeft
} from 'lucide-react';
import styles from './QuizPreviewPage.module.css';

export default function QuizPreviewPage() {
  const { t, lang } = useLang();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { quizId } = useParams();
  const toast = useToast();
  const { startLoading } = useGlobalLoading();
  
  const [loading, setLoading] = useState(true);
  const [quizData, setQuizData] = useState(null);
  const [error, setError] = useState('');


  const loadQuiz = useCallback(async () => {
    if (!quizId) {
      setError(t('quiz_id_not_provided') || 'Quiz ID not provided');
      return;
    }

    setLoading(true);
    try {
      const result = await getQuiz(quizId);
      if (!result.success) {
        throw new Error(result.error || (t('failed_to_load_quiz') || 'Failed to load quiz'));
      }

      const quiz = result.data;
      
      // Load creator name (show only a clean name, never raw email)
      let creatorName = t('unknown') || 'Unknown';
      if (quiz.createdBy) {
        try {
          const userResult = await getUser(quiz.createdBy);
          if (userResult.success && userResult.data) {
            const { realName, displayName, name, email } = userResult.data;
            const emailName = email ? email.split('@')[0] : '';
            creatorName = realName || displayName || name || emailName || (t('unknown') || 'Unknown');
          }
        } catch (err) {
          warn('Failed to load creator name:', err);
        }
      }

      setQuizData({
        ...quiz,
        creatorName,
        questionCount: quiz.questions?.length || 0
      });
    } catch (error) {
      setError(error.message || (t('failed_to_load_quiz') || 'Failed to load quiz'));
      error('Error loading quiz:', error);
    } finally {
      setLoading(false);
    }
  }, [quizId, t]);

  useEffect(() => {
    loadQuiz();
  }, [loadQuiz]);

  const getQuestionIcon = useCallback((type) => {
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
  }, []);

  const getQuestionTypeLabel = useCallback((type) => {
    switch (type) {
      case 'multiple_choice':
        return t('multiple_choice') || 'Multiple Choice';
      case 'single_choice':
        return t('single_choice') || 'Single Choice';
      case 'true_false':
        return t('true_false') || 'True/False';
      default:
        return t('question') || 'Question';
    }
  }, [t]);

  const getDifficultyColor = useCallback((difficulty) => {
    switch ((difficulty || '').toLowerCase()) {
      case DIFFICULTY_TYPES.BEGINNER:
        return 'success';
      case DIFFICULTY_TYPES.INTERMEDIATE:
        return 'warning';
      case DIFFICULTY_TYPES.ADVANCED:
        return 'danger';
      default:
        return 'primary';
    }
  }, []);

  const getDifficultyLabel = useCallback((difficulty) => {
    switch ((difficulty || '').toLowerCase()) {
      case DIFFICULTY_TYPES.BEGINNER:
        return DIFFICULTY_LABELS[DIFFICULTY_TYPES.BEGINNER];
      case DIFFICULTY_TYPES.INTERMEDIATE:
        return DIFFICULTY_LABELS[DIFFICULTY_TYPES.INTERMEDIATE];
      case DIFFICULTY_TYPES.ADVANCED:
        return DIFFICULTY_LABELS[DIFFICULTY_TYPES.ADVANCED];
      default:
        return difficulty || (t('general') || 'General');
    }
  }, [t]);

  const handleStartQuiz = () => {
    toast?.showInfo?.(t('starting_quiz') || 'Starting quiz...');
    navigate(`/quiz/${quizId}`);
  };

  const handleEditQuiz = () => {
    navigate(`/quizzes?id=${quizId}`);
  };

  // Use GlobalLoading for initial quiz data load
  useLayoutEffect(() => {
    if (authLoading) return;
    if (!user) return;
    if (!quizId) return;

    let stopped = false;
    const stopGlobalLoading = startLoading();
    const safeStop = () => {
      if (stopped) return;
      stopped = true;
      stopGlobalLoading();
    };

    const loadQuizData = async () => {
      try {
        setLoading(true);
        await loadQuiz(); // Use existing loadQuiz function
      } catch (error) {
        error('Error loading quiz data:', error);
      } finally {
        setLoading(false);
        safeStop();
      }
    };

    loadQuizData();

    return () => {
      safeStop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, quizId, startLoading]);

  if (error || !quizData) {
    return (
      <div className={styles.errorWrapper}>
        <Container maxWidth="lg">
          <Card>
            <CardBody className={styles.errorContent}>
              <h3>{t('error') || 'Error'}</h3>
              <p>{error || (t('quiz_not_found') || 'Quiz not found')}</p>
              <Button variant="outline" onClick={() => navigate('/quiz-management')}>
                {t('back_to_quiz_management') || 'Back to Quiz Management'}
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
                {t('back_to_edit') || 'Back to Edit'}
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
                  {quizData.questions.length} {quizData.questions.length === 1 ? (t('question') || 'question') : (t('questions') || 'questions')}
                </Badge>
                <Badge variant="subtle" color="warning" size="medium">
                  <Award size={14} style={{ marginRight: '0.5rem' }} />
                  {quizData.questions.reduce((sum, q) => sum + (q.points || 1), 0)} {t('points') || 'points'}
                </Badge>
                {(quizData.settings?.timeLimit > 0) ? (
                  <Badge variant="outline" color="danger" size="medium">
                    <Clock size={14} style={{ marginRight: '0.5rem' }} />
                    {quizData.settings.timeLimit} {t('min_limit') || 'min limit'}
                  </Badge>
                ) : (
                  <Badge variant="subtle" color="info" size="medium">
                    <Clock size={14} style={{ marginRight: '0.5rem' }} />
                    {quizData.estimatedTime} {t('min') || 'min'}
                  </Badge>
                )}
                <Badge variant="subtle" color={getDifficultyColor(quizData.difficulty)} size="medium">
                  {getDifficultyLabel(quizData.difficulty)}
                </Badge>
                {quizData.settings?.allowRetake && (
                  <Badge variant="outline" color="info" size="medium">
                    <Repeat size={14} style={{ marginRight: '0.5rem' }} />
                    {t('retake_allowed') || 'Retake allowed'}
                  </Badge>
                )}
                {quizData.settings?.randomizeOrder && (
                  <Badge variant="outline" color="primary" size="medium">
                    <Shuffle size={14} style={{ marginRight: '0.5rem' }} />
                    {t('shuffle_questions') || 'Shuffle questions'}
                  </Badge>
                )}
                {quizData.settings?.shuffleOptions && (
                  <Badge variant="outline" color="primary" size="medium">
                    <Shuffle size={14} style={{ marginRight: '0.5rem' }} />
                    {t('shuffle_options') || 'Shuffle options'}
                  </Badge>
                )}
                {quizData.creatorName && quizData.creatorName !== 'Unknown' && (
                  <Badge variant="outline" color="default" size="medium">
                    {t('created_by') || 'Created by'} {quizData.creatorName}
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
                  title={t('edit_quiz') || 'Edit quiz'}
                >
                  <Edit size={14} />
                  {t('edit') || 'Edit'}
                </Badge>
              ) : null}
              <Badge
                variant="solid"
                color="success"
                style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', fontSize: '0.95rem', fontWeight: 600 }}
                onClick={handleStartQuiz}
              >
                <Play size={16} />
                {t('start_quiz') || 'Start Quiz'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className={styles.questionsSection} style={{ marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1f2937', marginBottom: '1.5rem' }}>{t('questions_preview') || 'Questions Preview'}</h2>
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
                      {question.points || 1} {t('point') || 'point'}{question.points !== 1 ? (t('points_plural') || 's') : ''}
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
