import React, { useState, useEffect, useCallback, useMemo, useLayoutEffect } from 'react';
import { info, error, warn, debug } from '@services/utils/logger.js';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { DIFFICULTY_TYPES, DIFFICULTY_LABELS } from '@constants/difficultyTypes';
import { Container, Card, CardBody, Button, Spinner } from '@ui';
import { GlobalLoadingFallback, useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import {
  Plus, Edit, Trash2, Play, Clock, Users, HelpCircle, ListChecks,
  CheckCircle, AlertCircle, Repeat, Award
} from 'lucide-react';
import { getAllQuizzes, getQuizzesByCreator, deleteQuiz } from '@services/business/quizService';
import { deleteActivity } from '@services/business/activitiesService';
import { getUser } from '@services/business/userService';
import { logActivity, ACTIVITY_LOG_TYPES } from '@services/other/activityLogger';
import { DeleteConfirmationModal } from '@ui';
import styles from './QuizManagementPage.module.css';
import PortalTooltip from '@ui/PortalTooltip';

export default function QuizManagementPage() {
  const { t, lang } = useLang();
  const { user, isAdmin, isInstructor, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { startLoading } = useGlobalLoading();
  
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState([]);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, item: null, onConfirm: null, relatedData: null, warningMessage: null });

  useEffect(() => {
    if (!authLoading && user) {
      loadQuizzes();
    } else if (!authLoading && !user) {
      setLoading(false);
      setError(t('quiz_please_log_in'));
    }
  }, [authLoading, user, loadQuizzes, t]);

  const toDate = useCallback((value) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value.toDate === 'function') return value.toDate();
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, []);

  const formatQuiz = useCallback(async (quiz) => {
    const createdAt = toDate(quiz.createdAt);
    const settings = quiz.settings || {};
    const questionsArray = Array.isArray(quiz.questions) ? quiz.questions : [];

    // Load creator name (display only a clean name, never raw email)
    let creatorName = t('quiz_unknown_creator');
    if (quiz.createdBy) {
      try {
        const userResult = await getUser(quiz.createdBy);
        if (userResult.success && userResult.data) {
          const { displayName, name, email } = userResult.data;
          const emailName = email ? email.split('@')[0] : '';
          creatorName = displayName || name || emailName || t('quiz_unknown_creator');
        }
      } catch (err) {
        warn('Failed to load creator name:', err);
      }
    }

    return {
      id: quiz.id,
      title: lang === 'ar' ? (quiz.titleAr || quiz.titleEn || quiz.title || t('quiz_untitled')) : (quiz.titleEn || quiz.titleAr || quiz.title || t('quiz_untitled')),
      description: lang === 'ar' ? (quiz.descriptionAr || quiz.descriptionEn || quiz.description || '') : (quiz.descriptionEn || quiz.descriptionAr || quiz.description || ''),
      type: quiz.type || 'multiple_choice',
      difficulty: (quiz.difficulty || settings.difficulty || 'general').toLowerCase(),
      estimatedTime: Number.isFinite(quiz.estimatedTime) ? quiz.estimatedTime : (settings.timeLimit || 0),
      questionCount: Number.isFinite(quiz.questionCount) ? quiz.questionCount : questionsArray.length,
      totalAttempts: Number.isFinite(quiz.totalAttempts) ? quiz.totalAttempts : 0,
      averageScore: Number.isFinite(quiz.averageScore) ? quiz.averageScore : 0,
      allowRetake: typeof quiz.allowRetake === 'boolean' ? quiz.allowRetake : !!settings.allowRetake,
      createdAt,
      createdBy: quiz.createdBy || settings.createdBy || '',
      creatorName,
      updatedAt: toDate(quiz.updatedAt)
    };
  }, [lang, toDate, t]);

  const loadQuizzes = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      let response;
      if (isAdmin) {
        response = await getAllQuizzes();
      } else if (isInstructor) {
        response = await getQuizzesByCreator(user.uid);
      } else {
        response = await getQuizzesByCreator(user.uid);
      }

      if (!response?.success) {
        throw new Error(response?.error || t('quiz_failed_to_load'));
      }

      const quizzesWithCreators = await Promise.all(
        (response.data || [])
          .filter(Boolean)
          .map(q => formatQuiz(q))
      );

      const normalized = quizzesWithCreators.sort((a, b) => {
        const ad = a.createdAt ? a.createdAt.getTime() : 0;
        const bd = b.createdAt ? b.createdAt.getTime() : 0;
        return bd - ad;
      });

      setQuizzes(normalized);
    } catch (error) {
      error('Error loading quizzes:', error);
      const message = String(error?.message || '').toLowerCase().includes('permission')
        ? t('quiz_no_permission')
        : (error?.message || t('quiz_failed_to_load'));
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin, isInstructor, formatQuiz, t]);

  const handleEdit = (quiz) => {
    navigate(`/quiz-builder?id=${quiz.id}`,
      { state: { quiz } }
    );
  };

  const handleDelete = async (quizId) => {
    const quiz = quizzes.find(q => q.id === quizId);
    if (!quiz) return;

    // Check for related data (quiz submissions)
    try {
      const submissionsResult = await getQuizSubmissions({ quizId });
      const submissionsData = submissionsResult.success ? submissionsResult.data : [];
      const quizSubmissions = submissionsData;

      // Create readable item name
      const itemName = lang === 'ar' ? (quiz.titleAr || quiz.titleEn || quiz.title || quiz.name || t('quiz_untitled')) : (quiz.titleEn || quiz.titleAr || quiz.title || quiz.name || t('quiz_untitled'));

      setDeleteModal({
        open: true,
        item: { ...quiz, _displayName: itemName },
        onConfirm: async () => {
          setDeleting(quizId);
          try {
            const result = await deleteQuiz(quizId);
            if (!result.success) {
              throw new Error(result.error || t('quiz_failed_to_delete'));
            }

            // Log activity
            try {
              await logActivity(ACTIVITY_LOG_TYPES.QUIZ_DELETED, {
                quizId,
                quizTitle: quiz?.title || quiz?.name || t('quiz_unknown_title')
              });
            } catch (e) { warn('Failed to log activity:', e); }

            // Best-effort clean up of mirrored activity document
            try {
              await deleteActivity(quizId);
            } catch {
              // ignore if no activity doc exists
            }

            setQuizzes(prev => prev.filter(q => q.id !== quizId));
            setDeleteModal({ open: false, item: null, onConfirm: null, relatedData: null, warningMessage: null });
          } catch (error) {
            alert(t('quiz_failed_to_delete') + ': ' + error.message);
          } finally {
            setDeleting(null);
          }
        },
        relatedData: {
          [t('quiz_submission_label')]: quizSubmissions.map(s => ({
            ...s,
            _label: t('quiz_submission_label')
          }))
        },
        warningMessage: quizSubmissions.length > 0 
          ? `This quiz has ${quizSubmissions.length} submission(s) that should be deleted first.`
          : null
      });
    } catch (error) {
      error('Failed to check related data:', error);
      // Still show modal but without related data
      setDeleteModal({
        open: true,
        item: { ...quiz, _displayName: lang === 'ar' ? (quiz.titleAr || quiz.titleEn || quiz.title || quiz.name || 'Untitled Quiz') : (quiz.titleEn || quiz.titleAr || quiz.title || quiz.name || 'Untitled Quiz') },
        onConfirm: async () => {
          setDeleting(quizId);
          try {
            const result = await deleteQuiz(quizId);
            if (!result.success) {
              throw new Error(result.error || t('quiz_failed_to_delete'));
            }
            setQuizzes(prev => prev.filter(q => q.id !== quizId));
            setDeleteModal({ open: false, item: null, onConfirm: null, relatedData: null, warningMessage: null });
          } catch (error) {
            alert(t('quiz_failed_to_delete') + ': ' + error.message);
          } finally {
            setDeleting(null);
          }
        },
        relatedData: null,
        warningMessage: null
      });
    }
  };

  const handlePreview = (quizId) => {
    navigate(`/quiz-preview/${quizId}`);
  };

  const getQuizTypeIcon = (type) => {
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

  const getQuizTypeLabel = (type) => {
    switch (type) {
      case 'multiple_choice':
        return t('quiz_multiple_choice');
      case 'single_choice':
        return t('quiz_single_choice');
      case 'true_false':
        return t('quiz_true_false');
      default:
        return t('quiz_type_quiz');
    }
  };

  const getDifficultyLabel = (difficulty) => {
    switch ((difficulty || '').toLowerCase()) {
      case DIFFICULTY_TYPES.BEGINNER:
        return DIFFICULTY_LABELS[DIFFICULTY_TYPES.BEGINNER];
      case DIFFICULTY_TYPES.INTERMEDIATE:
        return DIFFICULTY_LABELS[DIFFICULTY_TYPES.INTERMEDIATE];
      case DIFFICULTY_TYPES.ADVANCED:
        return DIFFICULTY_LABELS[DIFFICULTY_TYPES.ADVANCED];
      default:
        return DIFFICULTY_LABELS[DIFFICULTY_TYPES.BEGINNER];
    }
  };

  const getDifficultyChipClass = (difficulty) => {
    switch ((difficulty || '').toLowerCase()) {
      case DIFFICULTY_TYPES.BEGINNER:
        return styles.difficultyBeginner;
      case DIFFICULTY_TYPES.INTERMEDIATE:
        return styles.difficultyIntermediate;
      case DIFFICULTY_TYPES.ADVANCED:
        return styles.difficultyAdvanced;
      default:
        return styles.difficultyDefault;
    }
  };

  const renderMetaChips = (quiz) => {
    const chips = [];

    chips.push(
      <span key={`${quiz.id}-type`} className={`${styles.metaChip} ${styles.typeChip}`}>
        <span className={styles.metaChipIcon}>{getQuizTypeIcon(quiz.type)}</span>
        <span>{getQuizTypeLabel(quiz.type)}</span>
      </span>
    );

    chips.push(
      <span key={`${quiz.id}-questions`} className={`${styles.metaChip} ${styles.infoChip}`}>
        <span className={styles.metaChipIcon}><ListChecks size={14} /></span>
        <span>{quiz.questionCount || 0} {quiz.questionCount === 1 ? (t('question') || 'question') : (t('questions') || 'questions')}</span>
      </span>
    );

    if (quiz.estimatedTime) {
      chips.push(
        <span key={`${quiz.id}-time`} className={`${styles.metaChip} ${styles.infoChip}`}>
          <span className={styles.metaChipIcon}><Clock size={14} /></span>
          <span>{quiz.estimatedTime} {t('min') || 'min'}</span>
        </span>
      );
    }

    chips.push(
      <span key={`${quiz.id}-difficulty`} className={`${styles.metaChip} ${getDifficultyChipClass(quiz.difficulty)}`}>
        <span className={styles.metaChipIcon}><Award size={14} /></span>
        <span>{getDifficultyLabel(quiz.difficulty)}</span>
      </span>
    );

    if (quiz.allowRetake) {
      chips.push(
        <span key={`${quiz.id}-retake`} className={`${styles.metaChip} ${styles.retakeChip}`}>
          <span className={styles.metaChipIcon}><Repeat size={14} /></span>
          <span>{t('retake_allowed') || 'Retake allowed'}</span>
        </span>
      );
    }

    return (
      <div className={styles.metaChips}>
        {chips}
      </div>
    );
  };

  const formatCreatedInfo = (quiz) => {
    // Always show only the creator name (no email, no date stamp)
    if (quiz.creatorName && quiz.creatorName !== 'Unknown') {
      return (t('created_by') || 'Created by') + ` ${quiz.creatorName}`;
    }
    return (t('created_automatically') || 'Created automatically');
  };

  const totalAttempts = quizzes.reduce((sum, quiz) => sum + (quiz.totalAttempts || 0), 0);
  const averageScore = quizzes.length > 0
    ? Math.round(quizzes.reduce((sum, quiz) => sum + (quiz.averageScore || 0), 0) / quizzes.length)
    : 0;

  // Use GlobalLoading for initial data load
  useLayoutEffect(() => {
    if (authLoading) return;
    if (!user) return;
    if (!isAdmin && !isInstructor) return;

    let stopped = false;
    const stopGlobalLoading = startLoading();
    const safeStop = () => {
      if (stopped) return;
      stopped = true;
      stopGlobalLoading();
    };

    const loadData = async () => {
      try {
        await loadQuizzes();
      } catch (error) {
        error('Error loading quizzes:', error);
      } finally {
        safeStop();
      }
    };

    loadData();

    return () => {
      safeStop();
    };
  }, [authLoading, user, isAdmin, isInstructor, loadQuizzes, startLoading]);

  return (
    <div className={styles.quizManagement}>
      <Container maxWidth="lg">

        {/* Stats Cards */}
        <div className={styles.statsSection}>
          <div className={styles.statsGrid}>
            <Card className={styles.statCard}>
              <CardBody>
                <div className={styles.statContent}>
                  <div className={styles.statIcon}>
                    <ListChecks size={16} style={{ color: 'var(--color-primary, #800020)' }} />
                  </div>
                  <div className={styles.statInfo}>
                    <h3 className={styles.statValue}>{quizzes.length}</h3>
                    <p className={styles.statLabel}>{t('total_quizzes') || 'Total Quizzes'}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
            
            <Card className={styles.statCard}>
              <CardBody>
                <div className={styles.statContent}>
                  <div className={styles.statIcon}>
                    <Users size={16} style={{ color: '#10b981' }} />
                  </div>
                  <div className={styles.statInfo}>
                    <h3 className={styles.statValue}>{totalAttempts}</h3>
                    <p className={styles.statLabel}>{t('total_attempts') || 'Total Attempts'}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
            
            <Card className={styles.statCard}>
              <CardBody>
                <div className={styles.statContent}>
                  <div className={styles.statIcon}>
                    <CheckCircle size={16} style={{ color: '#f59e0b' }} />
                  </div>
                  <div className={styles.statInfo}>
                    <h3 className={styles.statValue}>{averageScore}%</h3>
                    <p className={styles.statLabel}>{t('average_score') || 'Average Score'}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
            
            <Card className={styles.statCard}>
              <CardBody>
                <div className={styles.statContent}>
                  <div className={styles.statIcon}>
                    <Clock size={16} style={{ color: '#6366f1' }} />
                  </div>
                  <div className={styles.statInfo}>
                    <h3 className={styles.statValue}>
                      {quizzes.reduce((sum, q) => sum + (q.estimatedTime || 0), 0)}
                    </h3>
                    <p className={styles.statLabel}>{t('total_minutes') || 'Total Minutes'}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
            
            <Card className={styles.statCard}>
              <CardBody>
                <div className={styles.statContent}>
                  <div className={styles.statIcon}>
                    <HelpCircle size={16} style={{ color: '#ec4899' }} />
                  </div>
                  <div className={styles.statInfo}>
                    <h3 className={styles.statValue}>
                      {quizzes.reduce((sum, q) => sum + (q.questionCount || 0), 0)}
                    </h3>
                    <p className={styles.statLabel}>{t('total_questions') || 'Total Questions'}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Quizzes List */}
        <div className={styles.quizzesSection}>
          {error && (
            <div className={styles.errorAlert}>
              <AlertCircle size={20} style={{ color: '#ef4444', marginRight: 8 }} />
              <span>{error}</span>
            </div>
          )}

          {quizzes.length === 0 ? (
            <Card>
              <CardBody className={styles.emptyState}>
                <HelpCircle size={48} style={{ color: '#d1d5db', marginBottom: 16 }} />
                <h3>{t('no_quizzes_yet') || 'No Quizzes Yet'}</h3>
                <p>{t('create_first_quiz_to_get_started') || 'Create your first quiz to get started'}</p>
                <Button
                  variant="primary"
                  onClick={() => navigate('/quiz-builder')}
                >
                  <Plus size={16} style={{ marginRight: 6 }} />
                  {t('create_quiz') || 'Create Quiz'}
                </Button>
              </CardBody>
            </Card>
          ) : (
            <div className={styles.quizzesList}>
              {quizzes.map(quiz => (
                <Card key={quiz.id} className={styles.quizCard}>
                  <CardBody>
                    <div className={styles.quizHeader}>
                      <div className={styles.quizInfo}>
                        {renderMetaChips(quiz)}
                        <h3 className={styles.quizTitle}>
                          {lang === 'ar' 
                            ? (quiz.titleAr || quiz.titleEn || quiz.title || (t('untitled_quiz') || 'Untitled Quiz'))
                            : (quiz.titleEn || quiz.titleAr || quiz.title || (t('untitled_quiz') || 'Untitled Quiz'))}
                        </h3>
                        {(quiz.descriptionEn || quiz.descriptionAr || quiz.description) && (
                          <p className={styles.quizDescription}>
                            {lang === 'ar'
                              ? (quiz.descriptionAr || quiz.descriptionEn || quiz.description || '')
                              : (quiz.descriptionEn || quiz.descriptionAr || quiz.description || '')}
                          </p>
                        )}

                        <div className={styles.quizStats}>
                          <div className={styles.statItem}>
                            <Users size={14} style={{ color: '#64748b' }} />
                            <span>{quiz.totalAttempts || 0} {t('attempts') || 'attempts'}</span>
                          </div>
                          <div className={styles.statItem}>
                            <CheckCircle size={14} style={{ color: '#10b981' }} />
                            <span>{quiz.averageScore || 0}% {t('avg_score') || 'avg score'}</span>
                          </div>
                        </div>
                      </div>

                      <div className={styles.quizActions}>
                        <PortalTooltip content={t('preview_quiz')} position="top">
                        <Button
                          variant="outline"
                          size="sm"
                          className={styles.iconButton}
                          aria-label={t('preview_quiz')}
                          onClick={() => handlePreview(quiz.id)}
                        >
                          <Play size={16} />
                        </Button>
                      </PortalTooltip>
                        <PortalTooltip content={t('edit_quiz')} position="top">
                        <Button
                          variant="outline"
                          size="sm"
                          className={styles.iconButton}
                          aria-label={t('edit_quiz')}
                          onClick={() => handleEdit(quiz)}
                        >
                          <Edit size={16} />
                        </Button>
                      </PortalTooltip>
                        <PortalTooltip content={t('delete_quiz')} position="top">
                        <Button
                          variant="danger"
                          size="sm"
                          className={styles.iconButton}
                          onClick={() => handleDelete(quiz.id)}
                          disabled={deleting === quiz.id}
                          aria-label={t('delete_quiz')}
                        >
                          {deleting === quiz.id ? (
                            <Spinner size="sm" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </Button>
                      </PortalTooltip>
                      </div>
                    </div>

                    <div className={styles.quizFooter}>
                      <span className={styles.createdInfo}>
                        {formatCreatedInfo(quiz)}
                      </span>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Container>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, item: null, onConfirm: null, relatedData: null, warningMessage: null })}
        onConfirm={deleteModal.onConfirm || (() => {})}
        title={t('delete_quiz') || 'Delete Quiz'}
        message={t('delete_quiz_confirmation') || 'Are you sure you want to delete this quiz? This action cannot be undone.'}
        itemName={deleteModal.item?._displayName || deleteModal.item?.title || deleteModal.item?.name || deleteModal.item?.id}
        relatedData={deleteModal.relatedData}
        warningMessage={deleteModal.warningMessage}
        loading={deleting !== null}
      />
    </div>
  );
}
