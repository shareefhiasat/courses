import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { Container, Card, CardBody, Button, Loading, Spinner } from '../components/ui';
import {
  Plus, Edit, Trash2, Play, Clock, Users, HelpCircle, ListChecks,
  CheckCircle, AlertCircle, Repeat, Award
} from 'lucide-react';
import { getAllQuizzes, getQuizzesByCreator, deleteQuiz } from '../firebase/quizzes';
import { getUser } from '../firebase/firestore';
import { db } from '../firebase/config';
import { doc, deleteDoc } from 'firebase/firestore';
import styles from './QuizManagementPage.module.css';

export default function QuizManagementPage() {
  const { t, lang } = useLang();
  const { user, isAdmin, isInstructor, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState([]);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (!authLoading && user) {
      loadQuizzes();
    } else if (!authLoading && !user) {
      setLoading(false);
      setError('Please log in to view quizzes');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const toDate = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value.toDate === 'function') return value.toDate();
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const formatQuiz = async (quiz) => {
    const createdAt = toDate(quiz.createdAt);
    const settings = quiz.settings || {};
    const questionsArray = Array.isArray(quiz.questions) ? quiz.questions : [];

    // Load creator name (display only a clean name, never raw email)
    let creatorName = 'Unknown';
    if (quiz.createdBy) {
      try {
        const userResult = await getUser(quiz.createdBy);
        if (userResult.success && userResult.data) {
          const { displayName, name, email } = userResult.data;
          const emailName = email ? email.split('@')[0] : '';
          creatorName = displayName || name || emailName || 'Unknown';
        }
      } catch (err) {
        console.warn('Failed to load creator name:', err);
      }
    }

    return {
      id: quiz.id,
      title: quiz.title || 'Untitled Quiz',
      description: quiz.description || '',
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
  };

  const loadQuizzes = async () => {
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
        throw new Error(response?.error || 'Failed to load quizzes');
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
      console.error('Error loading quizzes:', error);
      const message = String(error?.message || '').toLowerCase().includes('permission')
        ? 'You do not have permission to view quizzes yet.'
        : (error?.message || 'Failed to load quizzes');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (quiz) => {
    navigate(`/quiz-builder?id=${quiz.id}`,
      { state: { quiz } }
    );
  };

  const handleDelete = async (quizId) => {
    if (!window.confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      return;
    }

    setDeleting(quizId);
    try {
      const result = await deleteQuiz(quizId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete quiz');
      }

      // Best-effort clean up of mirrored activity document
      try {
        await deleteDoc(doc(db, 'activities', quizId));
      } catch {
        // ignore if no activity doc exists
      }

      setQuizzes(prev => prev.filter(q => q.id !== quizId));
    } catch (error) {
      alert('Failed to delete quiz: ' + error.message);
    } finally {
      setDeleting(null);
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
        return 'Multiple Choice';
      case 'single_choice':
        return 'Single Choice';
      case 'true_false':
        return 'True/False';
      default:
        return 'Quiz';
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
        return 'General';
    }
  };

  const getDifficultyChipClass = (difficulty) => {
    switch ((difficulty || '').toLowerCase()) {
      case 'beginner':
        return styles.difficultyBeginner;
      case 'intermediate':
        return styles.difficultyIntermediate;
      case 'advanced':
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
        <span>{quiz.questionCount || 0} {quiz.questionCount === 1 ? 'question' : 'questions'}</span>
      </span>
    );

    if (quiz.estimatedTime) {
      chips.push(
        <span key={`${quiz.id}-time`} className={`${styles.metaChip} ${styles.infoChip}`}>
          <span className={styles.metaChipIcon}><Clock size={14} /></span>
          <span>{quiz.estimatedTime} min</span>
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
          <span>Retake allowed</span>
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
      return `Created by ${quiz.creatorName}`;
    }
    return 'Created automatically';
  };

  const totalAttempts = quizzes.reduce((sum, quiz) => sum + (quiz.totalAttempts || 0), 0);
  const averageScore = quizzes.length > 0
    ? Math.round(quizzes.reduce((sum, quiz) => sum + (quiz.averageScore || 0), 0) / quizzes.length)
    : 0;

  if (loading) {
    return (
      <Loading
        variant="overlay"
        fullscreen
        message={t('loading_quizzes') || 'Loading quizzes...'}
      />
    );
  }

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
                    <ListChecks size={16} style={{ color: '#8b5cf6' }} />
                  </div>
                  <div className={styles.statInfo}>
                    <h3 className={styles.statValue}>{quizzes.length}</h3>
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
                <h3>No Quizzes Yet</h3>
                <p>Create your first quiz to get started</p>
                <Button
                  variant="primary"
                  onClick={() => navigate('/quiz-builder')}
                >
                  <Plus size={16} style={{ marginRight: 6 }} />
                  Create Quiz
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
                        <h3 className={styles.quizTitle}>{quiz.title}</h3>
                        {quiz.description && (
                          <p className={styles.quizDescription}>{quiz.description}</p>
                        )}

                        <div className={styles.quizStats}>
                          <div className={styles.statItem}>
                            <Users size={14} style={{ color: '#64748b' }} />
                            <span>{quiz.totalAttempts || 0} attempts</span>
                          </div>
                          <div className={styles.statItem}>
                            <CheckCircle size={14} style={{ color: '#10b981' }} />
                            <span>{quiz.averageScore || 0}% avg score</span>
                          </div>
                        </div>
                      </div>

                      <div className={styles.quizActions}>
                        <Button
                          variant="outline"
                          size="sm"
                          className={styles.iconButton}
                          title="Preview quiz"
                          aria-label="Preview quiz"
                          onClick={() => handlePreview(quiz.id)}
                        >
                          <Play size={16} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={styles.iconButton}
                          title="Edit quiz"
                          aria-label="Edit quiz"
                          onClick={() => handleEdit(quiz)}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          className={styles.iconButton}
                          onClick={() => handleDelete(quiz.id)}
                          disabled={deleting === quiz.id}
                          title="Delete quiz"
                          aria-label="Delete quiz"
                        >
                          {deleting === quiz.id ? (
                            <Spinner size="sm" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </Button>
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
    </div>
  );
}
