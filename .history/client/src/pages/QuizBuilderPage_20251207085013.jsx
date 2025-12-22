import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useLang } from '../contexts/LangContext';
import { useAuth } from '../contexts/AuthContext';
import {
  Plus, Save, Eye, Trash2, GripVertical, Clock, Copy, Play,
  CheckCircle, XCircle, HelpCircle, ListChecks, Repeat, Award
} from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { notifyQuizAvailable } from '../firebase/quizNotifications';
import { getEnrollments, getUsers } from '../firebase/firestore';
import { Container, Button, Card, CardBody, Input, Select, Spinner, useToast, RichTextEditor, Loading } from '../components/ui';
import ToggleSwitch from '../components/ToggleSwitch';
import styles from './QuizBuilderPage.module.css';

// Simplified question types
const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'multiple_choice',
  SINGLE_CHOICE: 'single_choice',
  TRUE_FALSE: 'true_false'
};

const DIFFICULTY_LABELS = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced'
};

const QUESTION_TYPE_INFO = {
  [QUESTION_TYPES.MULTIPLE_CHOICE]: {
    name: 'Multiple Choice',
    icon: <ListChecks size={20} />,
    description: 'Select one or more correct answers',
    color: 'var(--color-primary, #6366f1)'
  },
  [QUESTION_TYPES.SINGLE_CHOICE]: {
    name: 'Single Choice',
    icon: <CheckCircle size={20} />,
    description: 'Select only one correct answer',
    color: '#0ea5e9'
  },
  [QUESTION_TYPES.TRUE_FALSE]: {
    name: 'True/False',
    icon: <HelpCircle size={20} />,
    description: 'Simple true or false question',
    color: '#f59e0b'
  }
};

function getDefaultOptions(type = QUESTION_TYPES.MULTIPLE_CHOICE) {
  switch (type) {
    case QUESTION_TYPES.TRUE_FALSE:
      return [
        { id: '1', text: 'True', correct: false },
        { id: '2', text: 'False', correct: false }
      ];
    case QUESTION_TYPES.SINGLE_CHOICE:
      return [
        { id: '1', text: '', correct: false },
        { id: '2', text: '', correct: false },
        { id: '3', text: '', correct: false },
        { id: '4', text: '', correct: false }
      ];
    case QUESTION_TYPES.MULTIPLE_CHOICE:
    default:
      return [
        { id: '1', text: '', correct: false },
        { id: '2', text: '', correct: false },
        { id: '3', text: '', correct: false },
        { id: '4', text: '', correct: false }
      ];
  }
}

export default function QuizBuilderPage() {
  const { t, lang } = useLang();
  const { user, isAdmin, isInstructor } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const quizId = searchParams.get('id');
  const toast = useToast();

  // If navigated from QuizManagementPage with mock/loaded quiz data
  const initialQuizFromState = location.state?.quiz || null;

  const [step, setStep] = useState('setup'); // setup, build, preview
  const [selectedType, setSelectedType] = useState(QUESTION_TYPES.MULTIPLE_CHOICE);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  const defaultQuizTemplate = useMemo(() => ({
    title: '',
    description: '',
    type: QUESTION_TYPES.MULTIPLE_CHOICE,
    difficulty: 'beginner',
    estimatedTime: 10,
    questions: [],
    settings: {
      timeLimit: 0,
      allowRetake: true,
      showCorrectAnswers: true,
      randomizeOrder: false,
      shuffleOptions: false,
      passingScore: 70
    }
  }), []);

  const generateUniqueId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const normalizeQuestion = (question = {}) => {
    const baseOptions = Array.isArray(question.options) ? question.options : [];
    const resolvedType = question.type || QUESTION_TYPES.MULTIPLE_CHOICE;
    
    // Support bilingual questions - migrate old format
    const questionText = question.question || question.question_en || '';
    const questionTextAr = question.question_ar || questionText;

    return {
      id: question.id || generateUniqueId(),
      type: resolvedType,
      question: questionText, // Keep for backward compatibility
      question_en: question.question_en || questionText,
      question_ar: question.question_ar || questionTextAr,
      image: question.image || null,
      explanation: question.explanation || '',
      explanation_en: question.explanation_en || question.explanation || '',
      explanation_ar: question.explanation_ar || question.explanation || '',
      points: Number.isFinite(question.points) ? question.points : 1,
      timeLimit: Number.isFinite(question.timeLimit) ? question.timeLimit : 0,
      difficulty: question.difficulty || 'medium',
      topic: question.topic || 'General',
      options: baseOptions.length > 0 ? baseOptions : getDefaultOptions(resolvedType)
    };
  };

  const normalizeQuizData = (data = {}) => {
    const mergedSettings = {
      ...defaultQuizTemplate.settings,
      ...(data.settings || {})
    };

    const normalizedQuestions = Array.isArray(data.questions)
      ? data.questions.map(normalizeQuestion)
      : [];

    return {
      ...defaultQuizTemplate,
      ...data,
      type: data.type || defaultQuizTemplate.type,
      difficulty: data.difficulty || defaultQuizTemplate.difficulty,
      estimatedTime: Number.isFinite(data.estimatedTime) ? data.estimatedTime : defaultQuizTemplate.estimatedTime,
      questions: normalizedQuestions,
      settings: mergedSettings
    };
  };

  const [quizData, setQuizData] = useState(() => normalizeQuizData());

  const questionCount = quizData.questions?.length ?? 0;
  const estimatedTime = Number.isFinite(quizData.estimatedTime) ? quizData.estimatedTime : 0;

  const handleCancel = () => {
    if (location.state?.from) {
      navigate(-1);
    } else {
      navigate('/quiz-management');
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

  const getDifficultyLabel = (difficulty) => {
    const key = (difficulty || '').toLowerCase();
    return DIFFICULTY_LABELS[key] || (difficulty ? difficulty : 'General');
  };

  const renderMetaChips = () => {
    const chips = [];
    const typeLabel = QUESTION_TYPE_INFO[quizData.type]?.name || 'Quiz';

    chips.push(
      <span key="type" className={`${styles.metaChip} ${styles.typeChip}`}>
        <span className={styles.metaChipIcon}>{getQuestionIcon(quizData.type)}</span>
        <span>{typeLabel}</span>
      </span>
    );

    chips.push(
      <span key="questions" className={`${styles.metaChip} ${styles.infoChip}`}>
        <span className={styles.metaChipIcon}><ListChecks size={14} /></span>
        <span>{questionCount} {questionCount === 1 ? 'question' : 'questions'}</span>
      </span>
    );

    chips.push(
      <span key="time" className={`${styles.metaChip} ${styles.infoChip}`}>
        <span className={styles.metaChipIcon}><Clock size={14} /></span>
        <span>{estimatedTime} min</span>
      </span>
    );

    chips.push(
      <span key="difficulty" className={`${styles.metaChip} ${getDifficultyChipClass(quizData.difficulty)}`}>
        <span className={styles.metaChipIcon}><Award size={14} /></span>
        <span>{getDifficultyLabel(quizData.difficulty)}</span>
      </span>
    );

    if (quizData.settings?.allowRetake) {
      chips.push(
        <span key="retake" className={`${styles.metaChip} ${styles.retakeChip}`}>
          <span className={styles.metaChipIcon}><Repeat size={14} /></span>
          <span>Retake allowed</span>
        </span>
      );
    }

    return <div className={styles.metaChips}>{chips}</div>;
  };

  useEffect(() => {
    // 1) Edit mode via router state (only if it actually contains questions)
    if (initialQuizFromState && Array.isArray(initialQuizFromState.questions) && initialQuizFromState.questions.length > 0) {
      const normalized = normalizeQuizData(initialQuizFromState);
      setQuizData(normalized);
      setSelectedType(normalized.type || QUESTION_TYPES.MULTIPLE_CHOICE);
      setStep('build');
      setActiveQuestionIndex(normalized.questions.length > 0 ? 0 : -1);
      return;
    }

    // 2) Always load full quiz from backend when only ID or a trimmed quiz is provided
    if (quizId) {
      loadQuiz(quizId);
    }
  }, [quizId, initialQuizFromState]);

  const loadQuiz = async (id) => {
    setLoading(true);
    try {
      const { getQuiz } = await import('../firebase/quizzes');
      const result = await getQuiz(id);
      if (result.success) {
        const normalized = normalizeQuizData(result.data);
        setQuizData(normalized);
        setSelectedType(normalized.type || QUESTION_TYPES.MULTIPLE_CHOICE);
        setStep('build');
        setActiveQuestionIndex(normalized.questions.length > 0 ? 0 : -1);
      }
    } catch (error) {
      console.error('Error loading quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveQuiz = async () => {
    if (!quizData.title.trim()) {
      toast?.showError?.('Please enter a quiz title');
      return;
    }
    if (quizData.questions.length === 0) {
      toast?.showError?.('Please add at least one question');
      return;
    }

    setSaving(true);
    try {
      const { createQuiz, updateQuiz } = await import('../firebase/quizzes');

      let targetQuizId = quizId;

      if (quizId) {
        const result = await updateQuiz(quizId, quizData);
        if (result.success) {
          toast?.showSuccess?.('Quiz updated successfully!');
        } else {
          throw new Error(result.error);
        }
      } else {
        const result = await createQuiz(quizData, user.uid);
        if (result.success) {
          targetQuizId = result.id;
          toast?.showSuccess?.('Quiz created successfully!');
          navigate(`/quiz-builder?id=${result.id}`);
        } else {
          throw new Error(result.error);
        }
      }

      // Sync to Activities collection
      if (targetQuizId) {
        const activityData = {
          title_en: quizData.title,
          title_ar: quizData.title,
          description_en: quizData.description || '',
          description_ar: quizData.description || '',
          type: 'quiz',
          level: quizData.difficulty,
          internalQuizId: targetQuizId,
          updatedAt: serverTimestamp(),
          createdBy: user.uid,
          points: quizData.questions.reduce((acc, q) => acc + (q.points || 1), 0),
          allowRetake: quizData.settings.allowRetake,
          estimatedTime: quizData.estimatedTime,
          questionCount: quizData.questions.length
        };

        if (!quizId) {
          activityData.createdAt = serverTimestamp();
        }

        await setDoc(doc(db, 'activities', targetQuizId), activityData, { merge: true });

        // Send notifications for new quizzes
        if (!quizId && targetQuizId) {
          try {
            // Get students to notify based on assigned classes
            const assignedClassIds = quizData.assignedClassIds || (quizData.classId ? [quizData.classId] : []);
            
            if (assignedClassIds.length > 0) {
              // Get enrollments for assigned classes
              const enrollmentsResult = await getEnrollments();
              const usersResult = await getUsers();
              
              if (enrollmentsResult.success && usersResult.success) {
                const enrollments = enrollmentsResult.data || [];
                const users = usersResult.data || [];
                const usersMap = new Map(users.map(u => [u.id || u.docId, u]));
                
                // Filter students enrolled in assigned classes
                const studentIds = new Set(
                  enrollments
                    .filter(e => assignedClassIds.includes(e.classId) && e.role !== 'instructor')
                    .map(e => e.userId)
                );
                
                const studentsToNotify = Array.from(studentIds)
                  .map(id => usersMap.get(id))
                  .filter(Boolean);
                
                if (studentsToNotify.length > 0) {
                  await notifyQuizAvailable(
                    { id: targetQuizId, title: quizData.title, description: quizData.description, settings: quizData.settings },
                    studentsToNotify
                  );
                  console.log(`Notified ${studentsToNotify.length} students about new quiz`);
                }
              }
            }
          } catch (notifyError) {
            console.warn('Failed to send quiz notifications:', notifyError);
            // Don't fail the save operation if notifications fail
          }
        }
      }

    } catch (error) {
      console.error('Error saving quiz:', error);
      toast?.showError?.('Failed to save quiz: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const addQuestion = () => {
    const newQuestion = {
      id: generateUniqueId(),
      type: selectedType,
      question: '',
      image: null,
      options: getDefaultOptions(selectedType),
      explanation: '',
      points: 1,
      timeLimit: 0
    };

    setQuizData(prev => {
      const prevQuestions = prev.questions || [];
      const nextQuestions = [...prevQuestions, newQuestion];
      setActiveQuestionIndex(nextQuestions.length - 1);
      return {
        ...prev,
        questions: nextQuestions
      };
    });
  };

  const updateQuestion = (index, updates) => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === index ? { ...q, ...updates } : q
      )
    }));
  };

  const deleteQuestion = (index) => {
    const newQuestions = quizData.questions.filter((_, i) => i !== index);
    setQuizData(prev => ({ ...prev, questions: newQuestions }));
    if (activeQuestionIndex >= newQuestions.length && newQuestions.length > 0) {
      setActiveQuestionIndex(newQuestions.length - 1);
    }
  };

  const addOption = (questionIndex) => {
    const question = quizData.questions[questionIndex];
    if (!question) return;

    const newOption = {
      id: generateUniqueId(),
      text: '',
      correct: false
    };

    updateQuestion(questionIndex, {
      options: [...question.options, newOption]
    });
  };

  const updateOption = (questionIndex, optionId, updates) => {
    const question = quizData.questions[questionIndex];
    if (!question) return;

    updateQuestion(questionIndex, {
      options: question.options.map(opt =>
        opt.id === optionId ? { ...opt, ...updates } : opt
      )
    });
  };

  const deleteOption = (questionIndex, optionId) => {
    const question = quizData.questions[questionIndex];
    if (!question) return;

    updateQuestion(questionIndex, {
      options: question.options.filter(opt => opt.id !== optionId)
    });
  };

  const setCorrectAnswer = (questionIndex, optionId) => {
    const question = quizData.questions[questionIndex];
    if (!question) return;

    if (question.type === QUESTION_TYPES.SINGLE_CHOICE) {
      // Single choice - clear all others, set this one
      updateQuestion(questionIndex, {
        options: question.options.map(opt => ({
          ...opt,
          correct: opt.id === optionId
        }))
      });
    } else if (question.type === QUESTION_TYPES.MULTIPLE_CHOICE) {
      // Multiple choice - toggle this option
      updateOption(questionIndex, optionId, {
        correct: !question.options.find(opt => opt.id === optionId)?.correct
      });
    } else if (question.type === QUESTION_TYPES.TRUE_FALSE) {
      // True/false - clear all others, set this one
      updateQuestion(questionIndex, {
        options: question.options.map(opt => ({
          ...opt,
          correct: opt.id === optionId
        }))
      });
    }
  };

  const getQuestionIcon = (type) => {
    switch (type) {
      case QUESTION_TYPES.MULTIPLE_CHOICE:
        return <ListChecks size={16} />;
      case QUESTION_TYPES.SINGLE_CHOICE:
        return <CheckCircle size={16} />;
      case QUESTION_TYPES.TRUE_FALSE:
        return <HelpCircle size={16} />;
      default:
        return <HelpCircle size={16} />;
    }
  };

  const getQuestionTypeLabel = (type) => {
    switch (type) {
      case QUESTION_TYPES.MULTIPLE_CHOICE:
        return 'Multiple Choice';
      case QUESTION_TYPES.SINGLE_CHOICE:
        return 'Single Choice';
      case QUESTION_TYPES.TRUE_FALSE:
        return 'True/False';
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

  // Preview Step
  if (step === 'preview') {
    return (
      <div className={styles.quizBuilder}>
        <Container maxWidth="lg">
          <Card>
            <CardBody>
              <div className={styles.previewHeader}>
                <Button
                  variant="outline"
                  onClick={() => setStep('build')}
                >
                  ← Back to Edit
                </Button>
                <div className={styles.headerSummary}>
                  <h1 className={styles.quizTitle}>{quizData.title}</h1>
                  {renderMetaChips()}
                </div>
                <div className={styles.previewActions}>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={saveQuiz}
                    disabled={saving}
                    aria-label="Save quiz"
                  >
                    {saving ? <Spinner size="sm" /> : <Save size={16} />}
                  </Button>
                </div>
              </div>

              <div className={styles.previewContent}>
                {questionCount === 0 ? (
                  <div className={styles.emptyPreview}>
                    <HelpCircle size={48} style={{ color: '#ccc', marginBottom: 16 }} />
                    <h3>No Questions to Preview</h3>
                    <p>Add some questions to see how your quiz will look</p>
                    <Button variant="outline" onClick={() => setStep('build')}>
                      Add Questions
                    </Button>
                  </div>
                ) : (
                  <div className={styles.questionsPreview}>
                    {quizData.questions.map((question, qIndex) => (
                      <Card key={question.id} className={styles.previewQuestionCard}>
                        <CardBody>
                          <div className={styles.previewQuestionHeader}>
                            <div className={styles.questionNumber}>Question {qIndex + 1}</div>
                            <div className={styles.questionType}>
                              {getQuestionIcon(question.type)}
                              <span>{getQuestionTypeLabel(question.type)}</span>
                            </div>
                            <div className={styles.questionPoints}>
                              {question.points || 1} point{question.points !== 1 ? 's' : ''}
                            </div>
                          </div>

                          <div 
                            className={styles.previewQuestionText}
                            dangerouslySetInnerHTML={{ __html: question.question || '<p>No question text</p>' }}
                          />

                          <div className={styles.previewOptions}>
                            {question.options?.map((option, oIndex) => (
                              <div
                                key={option.id}
                                className={`${styles.previewOption} ${option.correct ? styles.correct : styles.incorrect}`}
                              >
                                <div className={styles.optionIndicator}>
                                  {option.correct ? (
                                    <CheckCircle size={20} style={{ color: '#10b981' }} />
                                  ) : (
                                    <div className={styles.optionRadio} />
                                  )}
                                </div>
                                <div 
                                  className={styles.optionText}
                                  dangerouslySetInnerHTML={{ __html: option.text || `Option ${oIndex + 1}` }}
                                />
                              </div>
                            ))}
                          </div>

                          {question.explanation && (
                            <div className={styles.previewExplanation}>
                              <h4>Explanation:</h4>
                              <div
                                className={styles.previewExplanationContent}
                                dangerouslySetInnerHTML={{ __html: question.explanation }}
                              />
                            </div>
                          )}
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </Container>
      </div>
    );
  }

  // Setup Step
  if (step === 'setup') {
    return (
      <div className={styles.quizBuilder}>
        <Container maxWidth="lg">
          <Card>
            <CardBody>
              {/* <h1 className={styles.pageTitle}>Create New Quiz</h1>
              <p className={styles.pageDescription}>
                Choose the type of quiz you want to create
              </p> */}

              <div className={styles.typeGrid}>
                {Object.entries(QUESTION_TYPE_INFO).map(([type, info]) => (
                  <button
                    key={type}
                    className={`${styles.typeCard} ${selectedType === type ? styles.active : ''}`}
                    onClick={() => setSelectedType(type)}
                  >
                    <div className={styles.typeIcon} style={{ color: info.color }}>
                      {info.icon}
                    </div>
                    <h3>{info.name}</h3>
                    <p>{info.description}</p>
                  </button>
                ))}
              </div>

              <div className={styles.setupForm}>
                <div className={styles.formGrid}>
                  <div className={styles.formField}>
                    <Input
                      placeholder="Quiz Title"
                      value={quizData.title}
                      onChange={(e) => setQuizData(prev => ({ ...prev, title: e.target.value }))}
                      className={styles.titleInput}
                    />
                  </div>
                  <div className={styles.formField}>
                    <Input
                      placeholder="Quiz Description (optional)"
                      value={quizData.description}
                      onChange={(e) => setQuizData(prev => ({ ...prev, description: e.target.value }))}
                      className={styles.descriptionInput}
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <Select
                    value={quizData.difficulty}
                    onChange={(e) => setQuizData(prev => ({ ...prev, difficulty: e.target.value }))}
                    options={[
                      { value: 'beginner', label: 'Beginner' },
                      { value: 'intermediate', label: 'Intermediate' },
                      { value: 'advanced', label: 'Advanced' }
                    ]}
                  />
                  <Input
                    type="number"
                    placeholder="Estimated time (minutes)"
                    value={quizData.estimatedTime}
                    onChange={(e) => setQuizData(prev => ({ ...prev, estimatedTime: parseInt(e.target.value) || 10 }))}
                    min="1"
                    max="180"
                  />
                </div>

                <div className={styles.togglesContainer}>
                  <ToggleSwitch
                    label="Beginner"
                    checked={quizData.difficulty === 'beginner'}
                    onChange={(checked) => setQuizData(prev => ({ ...prev, difficulty: checked ? 'beginner' : 'intermediate' }))}
                  />
                  <ToggleSwitch
                    label="Allow retake"
                    checked={quizData.settings?.allowRetake || false}
                    onChange={(checked) => setQuizData(prev => ({
                      ...prev,
                      settings: { ...prev.settings, allowRetake: checked }
                    }))}
                  />
                  <ToggleSwitch
                    label="Shuffle question order"
                    checked={quizData.settings?.randomizeOrder || false}
                    onChange={(checked) => setQuizData(prev => ({
                      ...prev,
                      settings: { ...prev.settings, randomizeOrder: checked }
                    }))}
                  />
                  <ToggleSwitch
                    label="Shuffle answer options"
                    checked={quizData.settings?.shuffleOptions || false}
                    onChange={(checked) => setQuizData(prev => ({
                      ...prev,
                      settings: { ...prev.settings, shuffleOptions: checked }
                    }))}
                  />
                </div>
              </div>

              <div className={styles.setupActions}>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setQuizData(prev => ({ ...prev, type: selectedType }));
                    setStep('build');
                  }}
                  disabled={!quizData.title.trim()}
                >
                  Continue to Questions
                </Button>
              </div>
            </CardBody>
          </Card>
        </Container>
      </div>
    );
  }

  // Build Step
  return (
    <div className={styles.quizBuilder}>
      <Container maxWidth="xl">
        <div className={styles.builderHeader}>
          <div className={styles.headerLeft}>
            <Button
              variant="outline"
              onClick={() => setStep('setup')}
            >
              ← Back
            </Button>
            <div className={styles.headerSummary}>
              <h1 className={styles.quizTitle}>{quizData.title}</h1>
              {renderMetaChips()}
            </div>
          </div>
          <div className={styles.headerActions}>
            <Button
              variant="outline"
              size="sm"
              aria-label="Preview quiz"
              onClick={() => setStep('preview')}
              disabled={questionCount === 0}
            >
              <Eye size={16} />
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={saveQuiz}
              disabled={saving}
              aria-label="Save quiz"
            >
              {saving ? <Spinner size="sm" /> : <Save size={16} />}
            </Button>
          </div>
        </div>

        <div className={styles.builderContent}>
          {/* Questions Sidebar */}
          <div className={styles.questionsSidebar}>
            <div className={styles.sidebarHeader}>
              <h3>Questions</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={addQuestion}
                title="Add question"
              >
                <Plus size={14} />
              </Button>
            </div>
            <div className={styles.questionsList}>
              {quizData.questions.map((question, index) => {
                const isDragging = false;
                return (
                  <div
                    key={question.id}
                    className={`${styles.questionTab} ${activeQuestionIndex === index ? styles.active : ''}`}
                    onClick={() => setActiveQuestionIndex(index)}
                    draggable={!quizData.settings?.randomizeOrder}
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', index.toString());
                      e.currentTarget.style.opacity = '0.5';
                    }}
                    onDragEnd={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.dataTransfer.dropEffect = 'move';
                      e.currentTarget.style.borderTop = '3px solid #8b5cf6';
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.style.borderTop = '';
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.currentTarget.style.borderTop = '';
                      const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
                      const targetIndex = index;
                      if (draggedIndex !== targetIndex && !isNaN(draggedIndex)) {
                        const newQuestions = [...quizData.questions];
                        const [removed] = newQuestions.splice(draggedIndex, 1);
                        newQuestions.splice(targetIndex, 0, removed);
                        setQuizData(prev => ({ ...prev, questions: newQuestions }));
                        // Update active index if needed
                        if (activeQuestionIndex === draggedIndex) {
                          setActiveQuestionIndex(targetIndex);
                        } else if (activeQuestionIndex === targetIndex && draggedIndex < targetIndex) {
                          setActiveQuestionIndex(activeQuestionIndex + 1);
                        } else if (activeQuestionIndex === targetIndex && draggedIndex > targetIndex) {
                          setActiveQuestionIndex(activeQuestionIndex - 1);
                        } else if (activeQuestionIndex > draggedIndex && activeQuestionIndex <= targetIndex) {
                          setActiveQuestionIndex(activeQuestionIndex - 1);
                        } else if (activeQuestionIndex < draggedIndex && activeQuestionIndex >= targetIndex) {
                          setActiveQuestionIndex(activeQuestionIndex + 1);
                        }
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActiveQuestionIndex(index);
                      }
                    }}
                  >
                    {!quizData.settings?.randomizeOrder && (
                      <GripVertical size={14} className={styles.dragHandle} style={{ color: '#94a3b8', cursor: 'grab' }} />
                    )}
                    <span className={styles.questionNumber}>Q{index + 1}</span>
                    <span className={styles.questionType}>
                      <span className={styles.questionTypeIcon}>
                        {QUESTION_TYPE_INFO[question.type]?.icon || <HelpCircle size={14} />}
                      </span>
                      <span className={styles.questionPreview}>
                        {(() => {
                          const htmlText = question.question || '';
                          const tempDiv = document.createElement('div');
                          tempDiv.innerHTML = htmlText;
                          const text = tempDiv.textContent || tempDiv.innerText || '';
                          const words = text.trim().split(/\s+/).filter(w => w.length > 0);
                          return words.length > 0 ? words.slice(0, 2).join(' ') : 'New Question';
                        })()}
                      </span>
                    </span>
                    <button
                      className={styles.deleteQuestion}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteQuestion(index);
                      }}
                      aria-label={`Delete question ${index + 1}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
              {quizData.questions.length === 0 && (
                <div className={styles.emptyQuestions}>
                  <p>No questions yet</p>
                  <Button variant="outline" size="sm" onClick={addQuestion}>
                    Add your first question
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Question Editor */}
          <div className={styles.questionEditor}>
            {quizData.questions.length > 0 && activeQuestionIndex >= 0 && activeQuestionIndex < quizData.questions.length ? (
              <Card>
                <CardBody>
                  <div className={styles.questionHeader}>
                    <h3>Question {activeQuestionIndex + 1}</h3>
                  </div>
                  
                  <div className={styles.questionTypeSelector}>
                    <label>Question Type</label>
                    <Select
                      value={quizData.questions[activeQuestionIndex]?.type || QUESTION_TYPES.MULTIPLE_CHOICE}
                      onChange={(e) => {
                        const currentQuestion = quizData.questions[activeQuestionIndex];
                        if (currentQuestion) {
                          updateQuestion(activeQuestionIndex, {
                            type: e.target.value,
                            options: getDefaultOptions(e.target.value)
                          });
                        }
                      }}
                      options={Object.entries(QUESTION_TYPE_INFO).map(([value, info]) => ({
                        value,
                        label: info.name
                      }))}
                      size="sm"
                    />
                  </div>

                  <div className={styles.questionForm}>
                    <div className={styles.questionTextEditor}>
                      <RichTextEditor
                        key={`question-text-en-${quizData.questions[activeQuestionIndex]?.id || activeQuestionIndex}`}
                        label={lang === 'ar' ? 'نص السؤال (إنجليزي)' : 'Question Text (English)'}
                        placeholder={lang === 'ar' ? 'أدخل سؤالك هنا...' : 'Enter your question here...'}
                        value={quizData.questions[activeQuestionIndex]?.question_en || quizData.questions[activeQuestionIndex]?.question || ''}
                        onChange={(html) => {
                          const currentQuestion = quizData.questions[activeQuestionIndex];
                          if (currentQuestion && currentQuestion.id) {
                            updateQuestion(activeQuestionIndex, { 
                              question: html, // Keep for backward compatibility
                              question_en: html 
                            });
                          }
                        }}
                        height={120}
                        className={styles.questionInput}
                      />
                    </div>
                    <div className={styles.questionTextEditor} style={{ marginTop: '1rem' }}>
                      <RichTextEditor
                        key={`question-text-ar-${quizData.questions[activeQuestionIndex]?.id || activeQuestionIndex}`}
                        label={lang === 'ar' ? 'نص السؤال (عربي)' : 'Question Text (Arabic)'}
                        placeholder={lang === 'ar' ? 'أدخل سؤالك بالعربية هنا...' : 'Enter your question in Arabic here...'}
                        value={quizData.questions[activeQuestionIndex]?.question_ar || ''}
                        onChange={(html) => {
                          const currentQuestion = quizData.questions[activeQuestionIndex];
                          if (currentQuestion && currentQuestion.id) {
                            updateQuestion(activeQuestionIndex, { question_ar: html });
                          }
                        }}
                        height={120}
                        className={styles.questionInput}
                      />
                    </div>

                    <div className={styles.optionsSection}>
                      <div className={styles.optionsHeader}>
                        <h4>Answer Options</h4>
                        {quizData.questions[activeQuestionIndex]?.type !== QUESTION_TYPES.TRUE_FALSE && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addOption(activeQuestionIndex)}
                            title="Add option"
                          >
                            <Plus size={14} />
                          </Button>
                        )}
                      </div>

                      <div className={styles.optionsList}>
                        {quizData.questions[activeQuestionIndex]?.options?.map((option, optIndex) => {
                          if (!option || !option.id) return null;
                          return (
                            <div key={option.id} className={styles.optionRow}>
                              <button
                                className={`${styles.correctToggle} ${option.correct ? styles.correct : ''}`}
                                onClick={() => {
                                  const currentQuestion = quizData.questions[activeQuestionIndex];
                                  if (currentQuestion) {
                                    setCorrectAnswer(activeQuestionIndex, option.id);
                                  }
                                }}
                              >
                                {option.correct ? <CheckCircle size={16} /> : <XCircle size={16} />}
                              </button>
                              <div style={{ flex: 1 }}>
                                <RichTextEditor
                                  key={`option-${option.id}-${quizData.questions[activeQuestionIndex]?.id || activeQuestionIndex}`}
                                  placeholder={`Option ${optIndex + 1}`}
                                  value={option.text || ''}
                                  onChange={(html) => {
                                    const currentQuestion = quizData.questions[activeQuestionIndex];
                                    if (currentQuestion && currentQuestion.id && option.id) {
                                      updateOption(activeQuestionIndex, option.id, { text: html });
                                    }
                                  }}
                                  height={100}
                                  className={styles.optionInput}
                                />
                              </div>
                              {quizData.questions[activeQuestionIndex]?.type !== QUESTION_TYPES.TRUE_FALSE && (
                                <button
                                  className={styles.deleteOption}
                                  onClick={() => {
                                    const currentQuestion = quizData.questions[activeQuestionIndex];
                                    if (currentQuestion) {
                                      deleteOption(activeQuestionIndex, option.id);
                                    }
                                  }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className={styles.questionSettings}>
                      <div className={styles.settingRow}>
                        <label>Points</label>
                        <Input
                          type="number"
                          value={quizData.questions[activeQuestionIndex]?.points || 1}
                          onChange={(e) => updateQuestion(activeQuestionIndex, { points: parseInt(e.target.value) || 1 })}
                          min="1"
                          max="100"
                          style={{ width: '100px' }}
                        />
                      </div>
                      <div className={styles.settingRow}>
                        <label>Time Limit (seconds)</label>
                        <Input
                          type="number"
                          value={quizData.questions[activeQuestionIndex]?.timeLimit || 0}
                          onChange={(e) => updateQuestion(activeQuestionIndex, { timeLimit: parseInt(e.target.value) || 0 })}
                          min="0"
                          max="600"
                          placeholder="No limit"
                          style={{ width: '120px' }}
                        />
                      </div>
                      <div className={styles.settingRow}>
                        <label>Difficulty</label>
                        <Select
                          value={quizData.questions[activeQuestionIndex]?.difficulty || 'medium'}
                          onChange={(e) => updateQuestion(activeQuestionIndex, { difficulty: e.target.value })}
                          options={[
                            { value: 'easy', label: 'Easy' },
                            { value: 'medium', label: 'Medium' },
                            { value: 'hard', label: 'Hard' }
                          ]}
                          style={{ width: '120px' }}
                        />
                      </div>
                      <div className={styles.settingRow}>
                        <label>Topic</label>
                        <Input
                          type="text"
                          value={quizData.questions[activeQuestionIndex]?.topic || 'General'}
                          onChange={(e) => updateQuestion(activeQuestionIndex, { topic: e.target.value })}
                          placeholder="e.g., Algebra, History"
                          style={{ width: '180px' }}
                        />
                      </div>
                    </div>

                    <div className={styles.explanationSection}>
                      <RichTextEditor
                        label="Explanation (Optional)"
                        value={quizData.questions[activeQuestionIndex]?.explanation || ''}
                        onChange={(html) => updateQuestion(activeQuestionIndex, { explanation: html })}
                        placeholder="Describe why this answer is correct..."
                        helperText="Shown to students after they answer the question."
                        height={120}
                      />
                    </div>
                  </div>
                </CardBody>
              </Card>
            ) : (
              <Card>
                <CardBody className={styles.emptyEditor}>
                  <HelpCircle size={48} style={{ color: '#ccc', marginBottom: 16 }} />
                  <h3>No Questions Yet</h3>
                  <p>Add your first question to get started</p>
                  <Button variant="primary" onClick={addQuestion}>
                    <Plus size={16} style={{ marginRight: 6 }} />
                    Add Question
                  </Button>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      </Container>
    </div>
  );

  // Preview Step
  if (step === 'preview') {
    return (
      <div className={styles.quizBuilder}>
        <Container maxWidth="lg">
          <Card>
            <CardBody>
              <div className={styles.previewHeader}>
                <Button
                  variant="outline"
                  onClick={() => setStep('build')}
                >
                  ← Back to Edit
                </Button>
                <div>
                  <h1 className={styles.quizTitle}>{quizData.title}</h1>
                  <p className={styles.quizMeta}>
                    {quizData.questions.length} questions • {quizData.estimatedTime} min • {quizData.difficulty}
                  </p>
                </div>
                <div className={styles.previewActions}>
                  <Button
                    variant="primary"
                    onClick={saveQuiz}
                    disabled={saving}
                  >
                    {saving ? <Spinner size="sm" /> : <Save size={16} style={{ marginRight: 6 }} />}
                    {saving ? 'Saving...' : 'Save Quiz'}
                  </Button>
                </div>
              </div>

              <div className={styles.previewContent}>
                {quizData.questions.length === 0 ? (
                  <div className={styles.emptyPreview}>
                    <HelpCircle size={48} style={{ color: '#ccc', marginBottom: 16 }} />
                    <h3>No Questions to Preview</h3>
                    <p>Add some questions to see how your quiz will look</p>
                    <Button variant="outline" onClick={() => setStep('build')}>
                      Add Questions
                    </Button>
                  </div>
                ) : (
                  <div className={styles.questionsPreview}>
                    {quizData.questions.map((question, qIndex) => (
                      <Card key={question.id} className={styles.previewQuestionCard}>
                        <CardBody>
                          <div className={styles.previewQuestionHeader}>
                            <div className={styles.questionNumber}>Question {qIndex + 1}</div>
                            <div className={styles.questionType}>
                              {getQuestionIcon(question.type)}
                              <span>{getQuestionTypeLabel(question.type)}</span>
                            </div>
                            <div className={styles.questionPoints}>
                              {question.points || 1} point{question.points !== 1 ? 's' : ''}
                            </div>
                          </div>

                          <div 
                            className={styles.previewQuestionText}
                            dangerouslySetInnerHTML={{ __html: question.question || '<p>No question text</p>' }}
                          />

                          <div className={styles.previewOptions}>
                            {question.options?.map((option, oIndex) => (
                              <div
                                key={option.id}
                                className={`${styles.previewOption} ${option.correct ? styles.correct : styles.incorrect}`}
                              >
                                <div className={styles.optionIndicator}>
                                  {option.correct ? (
                                    <CheckCircle size={20} style={{ color: '#10b981' }} />
                                  ) : (
                                    <div className={styles.optionRadio} />
                                  )}
                                </div>
                                <div 
                                  className={styles.optionText}
                                  dangerouslySetInnerHTML={{ __html: option.text || `Option ${oIndex + 1}` }}
                                />
                              </div>
                            ))}
                          </div>

                          {question.explanation && (
                            <div className={styles.previewExplanation}>
                              <h4>Explanation:</h4>
                              <div
                                className={styles.previewExplanationContent}
                                dangerouslySetInnerHTML={{ __html: question.explanation }}
                              />
                            </div>
                          )}
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </Container>
      </div>
    );
  }
}
