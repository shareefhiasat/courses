import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { info, error, warn, debug } from '@services/utils/logger.js';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useAuth } from '@contexts/AuthContext';
import { getThemedIcon, getIconWithColor } from '@constants/iconTypes';
import { DIFFICULTY_TYPES, DIFFICULTY_LABELS } from '@constants/difficultyTypes';
import { RECORD_TYPES } from '@utils/sharedTypes';
import { sendQuizAvailable } from '@services/business/notificationService';
import { getEnrollments } from '@services/business/enrollmentService';
import { getUsers, getUser } from '@services/business/userService';
import { getAllQuizzes, getQuizzesByCreator, deleteQuiz, getQuiz, createQuiz, updateQuiz } from '@services/business/quizService';
import { updateActivity, deleteActivity } from '@services/business/activitiesService';
import { logActivity, ACTIVITY_LOG_TYPES } from '@services/other/activityLogger';
import { Container, Button, Card, CardBody, Input, Select, Spinner, useToast, RichTextEditor, SimpleLoading, Badge } from '@ui';
import { ToggleSwitch, LanguageToggle } from '@ui';
import QuizBuilderPageStyles from './QuizBuilderPage.module.css';
import QuizManagementPageStyles from './QuizManagementPage.module.css';

// Import all the constants and helper functions from QuizBuilderPage
const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'multiple_choice',
  SINGLE_CHOICE: 'single_choice',
  TRUE_FALSE: 'true_false'
};

function getDefaultOptions(type = QUESTION_TYPES.MULTIPLE_CHOICE, t = null) {
  switch (type) {
    case QUESTION_TYPES.TRUE_FALSE:
      return [
        { id: '1', text: t?.('true_option') || 'True', text_en: t?.('true_option') || 'True', text_ar: t?.('true_option') || 'صحيح', correct: false },
        { id: '2', text: t?.('false_option') || 'False', text_en: t?.('false_option') || 'False', text_ar: t?.('false_option') || 'خطأ', correct: false }
      ];
    case QUESTION_TYPES.SINGLE_CHOICE:
      return [
        { id: '1', text: '', text_en: '', text_ar: '', correct: false },
        { id: '2', text: '', text_en: '', text_ar: '', correct: false },
        { id: '3', text: '', text_en: '', text_ar: '', correct: false },
        { id: '4', text: '', text_en: '', text_ar: '', correct: false }
      ];
    case QUESTION_TYPES.MULTIPLE_CHOICE:
    default:
      return [
        { id: '1', text: '', text_en: '', text_ar: '', correct: false },
        { id: '2', text: '', text_en: '', text_ar: '', correct: false },
        { id: '3', text: '', text_en: '', text_ar: '', correct: false },
        { id: '4', text: '', text_en: '', text_ar: '', correct: false }
      ];
  }
}

export default function QuizzesPage() {
  const lastSavedRef = useRef(null);
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const { user, isAdmin, isInstructor, isStudent, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const quizId = searchParams.get('id');
  const mode = searchParams.get('mode'); // 'add' or 'edit'
  const toast = useToast();

  // Localized question type info
  const QUESTION_TYPE_INFO = useMemo(() => ({
    [QUESTION_TYPES.MULTIPLE_CHOICE]: {
      name: t('quiz_question_multiple_choice'),
      icon: getThemedIcon('ui', 'list_checks', 20, theme),
      description: t('quiz_question_multiple_choice_desc'),
      color: 'var(--color-primary, #6366f1)'
    },
    [QUESTION_TYPES.SINGLE_CHOICE]: {
      name: t('quiz_question_single_choice'),
      icon: getThemedIcon('ui', 'check_circle', 20, theme),
      description: t('quiz_question_single_choice_desc'),
      color: '#0ea5e9'
    },
    [QUESTION_TYPES.TRUE_FALSE]: {
      name: t('quiz_question_true_false'),
      icon: getThemedIcon('ui', 'help_circle', 20, theme),
      description: t('quiz_question_true_false_desc'),
      color: '#f59e0b'
    }
  }), [t, theme]);

  // Mode: 'list', 'add', 'edit', 'build', 'preview'
  const [viewMode, setViewMode] = useState(() => {
    if (mode === 'add') return 'add';
    if (quizId) return 'edit';
    return 'list';
  });

  const [step, setStep] = useState('setup'); // setup, build, preview (for add/edit)
  const [selectedType, setSelectedType] = useState(QUESTION_TYPES.MULTIPLE_CHOICE);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [explanationLang, setExplanationLang] = useState('en'); // Language for explanation editor
  const [quizLang, setQuizLang] = useState('en'); // 'en' or 'ar' for quiz title/description
  const [questionLang, setQuestionLang] = useState('en'); // 'en' or 'ar' for question text
  const [optionLang, setOptionLang] = useState('en'); // 'en' or 'ar' for option text
  const [quizzes, setQuizzes] = useState([]);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, item: null, onConfirm: null, relatedData: null, warningMessage: null });

  const defaultQuizTemplate = useMemo(() => ({
    title: '',
    title_en: '',
    title_ar: '',
    description: '',
    description_en: '',
    description_ar: '',
    type: QUESTION_TYPES.MULTIPLE_CHOICE,
    difficulty: DIFFICULTY_TYPES.MEDIUM,
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

  const normalizeQuestion = useCallback((question = {}) => {
    // Parse options if they're a JSON string
    const parsedOptions = typeof question.options === 'string' 
      ? (question.options ? JSON.parse(question.options) : [])
      : question.options;
    
    console.log('[normalizeQuestion] Input question:', {
      id: question.id,
      questionEn: question.questionEn,
      question_ar: question.question_ar,
      explanationEn: question.explanationEn,
      explanation_ar: question.explanation_ar,
      optionsType: typeof question.options,
      options: parsedOptions?.map(o => ({ textEn: o.textEn, text_ar: o.text_ar }))
    });
    
    const baseOptions = Array.isArray(parsedOptions) ? parsedOptions : [];
    const resolvedType = question.type || QUESTION_TYPES.MULTIPLE_CHOICE;
    
    const questionText = question.question || question.question_en || question.questionEn || '';
    const questionTextAr = question.question_ar || question.questionAr || questionText;

    const normalizedOptions = baseOptions.length > 0
      ? baseOptions.map(opt => ({
          ...opt,
          text: opt.text || opt.text_en || opt.textEn || '',
          text_en: opt.text_en || opt.textEn || opt.text || '',
          text_ar: opt.text_ar || opt.textAr || opt.text || ''
        }))
      : getDefaultOptions(resolvedType, t).map(opt => ({
          ...opt,
          text: opt.text || opt.text_en || opt.textEn || '',
          text_en: opt.text_en || opt.textEn || opt.text || '',
          text_ar: opt.text_ar || opt.textAr || opt.text || ''
        }));

    return {
      id: question.id || generateUniqueId(),
      type: resolvedType,
      question: questionText,
      question_en: question.question_en || question.questionEn || questionText,
      question_ar: question.question_ar || question.questionAr || questionTextAr,
      image: question.image || null,
      explanation: question.explanation || '',
      explanation_en: question.explanation_en || question.explanationEn || question.explanation || '',
      explanation_ar: question.explanation_ar || question.explanationAr || question.explanation || '',
      points: Number.isFinite(question.points) ? question.points : 1,
      timeLimit: Number.isFinite(question.timeLimit) ? question.timeLimit : 0,
      difficulty: question.difficulty || 'medium',
      options: normalizedOptions
    };
  }, []);

  const normalizeQuizData = useCallback((data = {}) => {
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
      titleEn: data.titleEn || data.title || '',
      titleAr: data.titleAr || data.title || '',
      descriptionEn: data.descriptionEn || data.description || '',
      descriptionAr: data.descriptionAr || data.description || '',
      type: data.type || defaultQuizTemplate.type,
      difficulty: data.difficulty || defaultQuizTemplate.difficulty,
      estimatedTime: Number.isFinite(data.estimatedTime) ? data.estimatedTime : defaultQuizTemplate.estimatedTime,
      questions: normalizedQuestions,
      settings: mergedSettings
    };
  }, [defaultQuizTemplate, normalizeQuestion]);

  const [quizData, setQuizData] = useState(() => normalizeQuizData());
  const [originalQuizData, setOriginalQuizData] = useState(null); // Store original for comparison

  const toDate = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value.toDate === 'function') return value.toDate();
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const formatQuiz = useCallback(async (quiz) => {
    const createdAt = toDate(quiz.createdAt);
    const questionsArray = Array.isArray(quiz.questions) ? quiz.questions : [];

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
      difficulty: (quiz.difficulty || 'general').toLowerCase(),
      estimatedTime: Number.isFinite(quiz.duration) ? quiz.duration : 0,
      duration: Number.isFinite(quiz.duration) ? quiz.duration : 0,
      questionCount: Number.isFinite(quiz.questionCount) ? quiz.questionCount : questionsArray.length,
      totalAttempts: Number.isFinite(quiz.totalAttempts) ? quiz.totalAttempts : 0,
      averageScore: Number.isFinite(quiz.averageScore) ? quiz.averageScore : 0,
      allowRetake: quiz.maxAttempts > 1,
      maxAttempts: quiz.maxAttempts || 1,
      randomizeQuestions: quiz.randomizeQuestions || false,
      randomizeAnswers: quiz.randomizeAnswers || false,
      showCorrectAnswers: quiz.showCorrectAnswers || false,
      passingScore: quiz.passingScore || 60,
      createdAt,
      createdBy: quiz.createdBy || '',
      creatorName,
      updatedAt: toDate(quiz.updatedAt),
      questions: questionsArray
    };
  }, [t, lang]);

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
      console.error('Error loading quizzes:', error);
      const message = String(error?.message || '').toLowerCase().includes('permission')
        ? t('quiz_no_permission')
        : (error?.message || t('quiz_failed_to_load'));
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin, isInstructor, t, formatQuiz]);

  const loadQuiz = useCallback(async (id) => {
    setLoading(true);
    try {
      const result = await getQuiz(id);
      if (result.success) {
        const normalized = normalizeQuizData(result.data);
        setQuizData(normalized);
        setOriginalQuizData(JSON.parse(JSON.stringify(normalized))); // Deep copy for comparison
        setSelectedType(normalized.type || QUESTION_TYPES.MULTIPLE_CHOICE);
        setStep('build');
        setActiveQuestionIndex(normalized.questions.length > 0 ? 0 : -1);
        setViewMode('edit');
      }
    } catch (error) {
      console.error('Error loading quiz:', error);
    } finally {
      setLoading(false);
    }
  }, [normalizeQuizData]);

  // Load quizzes list
  useEffect(() => {
    if (viewMode === 'list' && !authLoading && user) {
      loadQuizzes();
    }
  }, [viewMode, authLoading, user, loadQuizzes]);

  // Load quiz for editing
  useEffect(() => {
    if (viewMode === 'edit' && quizId) {
      loadQuiz(quizId);
    }
  }, [viewMode, quizId, loadQuiz]);

  // Log state changes when active question changes
  useEffect(() => {
    if (activeQuestionIndex >= 0 && quizData.questions[activeQuestionIndex]) {
      const question = quizData.questions[activeQuestionIndex];
      info('[QuestionChange] Active question changed:', {
        activeQuestionIndex,
        questionId: question.id,
        questionText: question.question?.substring(0, 50),
        optionsCount: question.options?.length,
        options: question.options?.map((opt, idx) => ({
          index: idx,
          id: opt.id,
          text: opt.text?.substring(0, 50),
          correct: opt.correct
        })),
        timestamp: new Date().toISOString()
      });
    }
  }, [activeQuestionIndex, quizData.questions]);

  // Reset to list when mode changes
  useEffect(() => {
    if (!quizId && !mode) {
      setViewMode('list');
    }
  }, [quizId, mode]);

  const saveQuiz = async () => {
    const titleEn = (quizData.titleEn || quizData.title || '').trim();
    const titleAr = (quizData.titleAr || quizData.title || '').trim();
    
    // Only require at least one title to be present
    if (!titleEn && !titleAr) {
      toast?.showError?.(t('quiz_title_required') || 'Please enter a quiz title');
      return;
    }
    if (quizData.questions.length === 0) {
      toast?.showError?.(t('quiz_add_question_required'));
      return;
    }

    // Check if score changed and activities are connected (for editing)
    if (quizId && originalQuizData) {
      const newTotalScore = quizData.questions.reduce((sum, q) => sum + (q.points || 1), 0);
      const originalTotalScore = originalQuizData.questions.reduce((sum, q) => sum + (q.points || 1), 0);
      
      if (newTotalScore !== originalTotalScore) {
        // Check for connected activities
        try {
          const activitiesResult = await getActivities();
          const connectedActivities = activitiesResult.success ? activitiesResult.data.filter(a => a.quizId === quizId) : [];
          
          if (connectedActivities.length > 0) {
            const confirmMessage = `⚠️ WARNING: This quiz is connected to ${connectedActivities.length} activity/activities.\n\n` +
              `Changing the total score from ${originalTotalScore} to ${newTotalScore} will affect:\n` +
              `- Students who have already submitted this quiz\n` +
              `- Existing scores and grades\n` +
              `- Activity max scores that are synced from this quiz\n\n` +
              `Are you sure you want to continue?`;
            
            if (!window.confirm(confirmMessage)) {
              return;
            }
          }
        } catch (error) {
          warn('Failed to check connected activities:', error);
        }
      }
    }

    setSaving(true);
    
    // Clean up quiz data before sending - remove settings object and use direct fields
    // Prioritize settings values if they exist (UI updates settings object)
    const quizDataToSend = {
      ...quizData,
      titleEn: quizData.titleEn || quizData.title || '',
      titleAr: quizData.titleAr || '',
      descriptionEn: quizData.descriptionEn || quizData.description || '',
      descriptionAr: quizData.descriptionAr || '',
      difficulty: quizData.difficulty || 'medium',
      duration: quizData.duration || quizData.estimatedTime || 60,
      // Use settings values if they exist, otherwise use direct fields
      maxAttempts: quizData.settings?.allowRetake ? 3 : (quizData.maxAttempts || 1),
      passingScore: quizData.settings?.passingScore || quizData.passingScore || 60,
      randomizeQuestions: quizData.settings?.randomizeOrder !== undefined ? quizData.settings.randomizeOrder : (quizData.randomizeQuestions || false),
      randomizeAnswers: quizData.settings?.shuffleOptions !== undefined ? quizData.settings.shuffleOptions : (quizData.randomizeAnswers || false),
      showCorrectAnswers: quizData.settings?.showCorrectAnswers !== undefined ? quizData.settings.showCorrectAnswers : (quizData.showCorrectAnswers || false),
      updatedBy: user?.uid || quizData.updatedBy,
      // Remove settings object - backend doesn't use it
      settings: undefined
    };
    
    console.log('[Quiz Save] Starting save for quiz:', quizId);
    console.log('[Quiz Save] Quiz data to send:', JSON.stringify(quizDataToSend, null, 2));
    console.log('[Quiz Save] Questions count:', quizDataToSend.questions?.length);
    quizDataToSend.questions?.forEach((q, i) => {
      console.log(`[Quiz Save] Question ${i}:`, {
        question_en: q.question_en,
        question_ar: q.question_ar,
        optionsCount: q.options?.length
      });
    });
    
    toast?.showInfo?.(quizId ? 'Updating quiz...' : 'Creating quiz...');
    try {
      let targetQuizId = quizId;

      if (quizId) {
        debug('[Save] Updating quiz:', quizId);
        const result = await updateQuiz(quizId, quizDataToSend);
        if (result.success) {
          debug('[Save] Quiz updated successfully');
          toast?.showSuccess?.('Quiz updated successfully!');
          setViewMode('list');
          loadQuizzes();
        } else {
          throw new Error(result.error);
        }
      } else {
        debug('[Save] Creating new quiz');
        const result = await createQuiz(quizDataToSend, user.uid);
        if (result.success) {
          targetQuizId = result.id;
          info('[Save] Quiz created successfully:', targetQuizId);
          toast?.showSuccess?.('Quiz created successfully!');
          setViewMode('list');
          loadQuizzes();
        } else {
          throw new Error(result.error);
        }
      }

      // Update last saved time
      lastSavedRef.current = new Date();

      // TODO: Activity sync disabled temporarily - needs review
      // The quiz saves successfully without this sync

    } catch (err) {
      error('Error saving quiz:', err);
      toast?.showError?.(t('quiz_error_saving') + ': ' + (err?.message || err));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (quiz) => {
    info('Edit quiz clicked:', quiz);
    setViewMode('edit');
    navigate(`/quizzes?id=${quiz.id}`, { replace: true });
    // Load quiz immediately
    if (quiz.id) {
      loadQuiz(quiz.id);
    }
  };

  const handleDelete = async (quizIdToDelete) => {
    const quiz = quizzes.find(q => q.id === quizIdToDelete);
    if (!quiz) return;

    try {
      // TODO: Implement getQuizSubmissions when available
      const quizSubmissions = [];

      const itemName = lang === 'ar' ? (quiz.titleAr || quiz.titleEn || quiz.title || quiz.name || t('quiz_untitled')) : (quiz.titleEn || quiz.titleAr || quiz.title || quiz.name || t('quiz_untitled'));

      setDeleteModal({
        open: true,
        item: { ...quiz, _displayName: itemName },
        onConfirm: async () => {
          setDeleting(quizIdToDelete);
          try {
            const result = await deleteQuiz(quizIdToDelete);
            if (!result.success) {
              throw new Error(result.error || t('quiz_failed_to_delete'));
            }

            try {
              await logActivity(ACTIVITY_LOG_TYPES.QUIZ_DELETED, {
                quizId: quizIdToDelete,
                quizTitle: quiz?.title || quiz?.name || t('quiz_unknown_title')
              });
            } catch (e) { console.warn('Failed to log activity:', e); }

            try {
              await deleteActivity(quizIdToDelete);
            } catch (e) {
              console.warn('[Quiz Delete] Failed to delete associated activity (non-blocking):', e);
            }

            setQuizzes(prev => prev.filter(q => q.id !== quizIdToDelete));
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
      console.error('Failed to check related data:', error);
      setDeleteModal({
        open: true,
        item: { ...quiz, _displayName: lang === 'ar' ? (quiz.titleAr || quiz.titleEn || quiz.title || quiz.name || t('quiz_untitled')) : (quiz.titleEn || quiz.titleAr || quiz.title || quiz.name || t('quiz_untitled')) },
        onConfirm: async () => {
          setDeleting(quizIdToDelete);
          try {
            const result = await deleteQuiz(quizIdToDelete);
            if (!result.success) {
              throw new Error(result.error || t('quiz_failed_to_delete'));
            }
            setQuizzes(prev => prev.filter(q => q.id !== quizIdToDelete));
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

  const handlePreview = (quizIdToPreview) => {
    navigate(`/quiz-preview/${quizIdToPreview}`);
  };

  const handleAddNew = () => {
    setQuizData(normalizeQuizData());
    setSelectedType(QUESTION_TYPES.MULTIPLE_CHOICE);
    setStep('setup');
    setActiveQuestionIndex(0);
    setViewMode('add');
    navigate('/quizzes?mode=add');
  };

  const handleCancel = () => {
    setViewMode('list');
    navigate('/quizzes');
  };

  // Import all builder functions from QuizBuilderPage (abbreviated for space)
  const addQuestion = () => {
    const newQuestion = {
      id: generateUniqueId(),
      type: selectedType,
      question: '',
      image: null,
      options: getDefaultOptions(selectedType, t),
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

  const updateOption = useCallback((questionIndex, optionId, updates) => {
    info('[UpdateOption] Called:', { questionIndex, optionId, updates, timestamp: new Date().toISOString() });
    
    setQuizData(prev => {
      const currentQuestion = prev.questions[questionIndex];
      if (!currentQuestion) {
        warn('[UpdateOption] Question not found at index:', questionIndex);
        return prev;
      }

      const optionIndex = currentQuestion.options.findIndex(opt => opt.id === optionId);
      if (optionIndex === -1) {
        warn('[UpdateOption] Option not found:', { optionId, availableIds: currentQuestion.options.map(o => o.id) });
        return prev;
      }

      const updatedOptions = currentQuestion.options.map((opt, idx) => {
        if (opt.id === optionId) {
          const updated = { ...opt, ...updates };
          info('[UpdateOption] Updating option:', { 
            before: { id: opt.id, text: opt.text?.substring(0, 50) }, 
            after: { id: updated.id, text: updated.text?.substring(0, 50) },
            index: idx
          });
          return updated;
        }
        return opt;
      });

      const updatedQuestions = [...prev.questions];
      updatedQuestions[questionIndex] = {
        ...currentQuestion,
        options: updatedOptions
      };

      info('[UpdateOption] State updated:', {
        questionIndex,
        questionId: currentQuestion.id,
        optionsCount: updatedOptions.length,
        updatedOptionText: updatedOptions[optionIndex]?.text?.substring(0, 50)
      });

      return { ...prev, questions: updatedQuestions };
    });
  }, []);

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
      updateQuestion(questionIndex, {
        options: question.options.map(opt => ({
          ...opt,
          correct: opt.id === optionId
        }))
      });
    } else if (question.type === QUESTION_TYPES.MULTIPLE_CHOICE) {
      updateOption(questionIndex, optionId, {
        correct: !question.options.find(opt => opt.id === optionId)?.correct
      });
    } else if (question.type === QUESTION_TYPES.TRUE_FALSE) {
      updateQuestion(questionIndex, {
        options: question.options.map(opt => ({
          ...opt,
          correct: opt.id === optionId
        }))
      });
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (viewMode === 'add' || viewMode === 'edit') {
          saveQuiz();
        }
      }
      // Ctrl/Cmd + N to add new question
      if ((e.ctrlKey || e.metaKey) && e.key === 'n' && step === 'build') {
        e.preventDefault();
        addQuestion();
      }
      // Escape to cancel
      if (e.key === 'Escape') {
        handleCancel();
      }
      // Arrow keys to navigate questions
      if (step === 'build' && quizData.questions.length > 0) {
        if (e.key === 'ArrowDown' && activeQuestionIndex < quizData.questions.length - 1) {
          e.preventDefault();
          setActiveQuestionIndex(activeQuestionIndex + 1);
        }
        if (e.key === 'ArrowUp' && activeQuestionIndex > 0) {
          e.preventDefault();
          setActiveQuestionIndex(activeQuestionIndex - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, step, activeQuestionIndex, quizData.questions.length, saveQuiz, addQuestion]);

  const getQuestionIcon = (type) => {
    switch (type) {
      case QUESTION_TYPES.MULTIPLE_CHOICE:
        return getThemedIcon('ui', 'list_checks', 16, theme);
      case QUESTION_TYPES.SINGLE_CHOICE:
        return getThemedIcon('ui', 'check_circle', 16, theme);
      case QUESTION_TYPES.TRUE_FALSE:
        return getThemedIcon('ui', 'help_circle', 16, theme);
      default:
        return getThemedIcon('ui', 'help_circle', 16, theme);
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

  const getQuizTypeIcon = (type) => {
    switch (type) {
      case 'multiple_choice':
        return getThemedIcon('ui', 'list_checks', 16, theme);
      case 'single_choice':
        return getThemedIcon('ui', 'check_circle', 16, theme);
      case 'true_false':
        return getThemedIcon('ui', 'help_circle', 16, theme);
      default:
        return getThemedIcon('ui', 'help_circle', 16, theme);
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
      case DIFFICULTY_TYPES.EASY:
        return DIFFICULTY_LABELS[DIFFICULTY_TYPES.EASY];
      case DIFFICULTY_TYPES.MEDIUM:
        return DIFFICULTY_LABELS[DIFFICULTY_TYPES.MEDIUM];
      case DIFFICULTY_TYPES.HARD:
        return DIFFICULTY_LABELS[DIFFICULTY_TYPES.HARD];
      default:
        return 'Medium';
    }
  };

  const getDifficultyChipClass = (difficulty) => {
    switch ((difficulty || '').toLowerCase()) {
      case DIFFICULTY_TYPES.EASY:
        return QuizManagementPageStyles.difficultyBeginner;
      case DIFFICULTY_TYPES.MEDIUM:
        return QuizManagementPageStyles.difficultyIntermediate;
      case DIFFICULTY_TYPES.HARD:
        return QuizManagementPageStyles.difficultyAdvanced;
      default:
        return QuizManagementPageStyles.difficultyDefault;
    }
  };

  const renderMetaChips = (quiz) => {
    const chips = [];
    // Calculate total points from questions if available, otherwise use a default
    const totalPoints = quiz.questions?.reduce((sum, q) => sum + (q.points || 1), 0) || (quiz.questionCount || 0);

    chips.push(
      <Badge key={`${quiz.id}-type`} variant="subtle" color="primary" size="small">
        {getQuizTypeIcon(quiz.type)}
        <span style={{ marginLeft: '0.25rem' }}>{getQuizTypeLabel(quiz.type)}</span>
      </Badge>
    );

    chips.push(
      <Badge key={`${quiz.id}-questions`} variant="subtle" color="info" size="small">
        {getThemedIcon('ui', 'list_checks', 12, theme)}
        <span style={{ marginLeft: '0.25rem' }}>{quiz.questionCount || 0} {quiz.questionCount === 1 ? 'question' : 'questions'}</span>
      </Badge>
    );

    chips.push(
      <Badge key={`${quiz.id}-points`} variant="subtle" color="warning" size="small">
        {getThemedIcon('ui', 'award', 12, theme)}
        <span style={{ marginLeft: '0.25rem' }}>{totalPoints} {totalPoints === 1 ? 'point' : 'points'}</span>
      </Badge>
    );

    // Calculate total time - match builder logic
    let totalTimeMinutes = 0;
    const totalTimeLimit = quiz.duration || 0; // duration field in DB
    const hasPerQuestionTime = quiz.questions?.some(q => q.timeLimit > 0);
    const totalPerQuestionTime = quiz.questions?.reduce((sum, q) => sum + (q.timeLimit || 0), 0) || 0;
    const estimatedTime = quiz.estimatedTime || 0;

    if (totalTimeLimit > 0) {
      chips.push(
        <Badge key={`${quiz.id}-time`} variant="outline" color="danger" size="small">
          {getThemedIcon('ui', 'clock', 12, theme)}
          <span style={{ marginLeft: '0.25rem' }}>{totalTimeLimit} min total</span>
        </Badge>
      );
    } else if (hasPerQuestionTime && totalPerQuestionTime > 0) {
      const totalMinutes = Math.ceil(totalPerQuestionTime / 60);
      chips.push(
        <Badge key={`${quiz.id}-time`} variant="outline" color="info" size="small">
          {getThemedIcon('ui', 'clock', 12, theme)}
          <span style={{ marginLeft: '0.25rem' }}>~{totalMinutes} min (per question)</span>
        </Badge>
      );
    } else if (estimatedTime > 0) {
      chips.push(
        <Badge key={`${quiz.id}-time`} variant="subtle" color="info" size="small">
          {getThemedIcon('ui', 'clock', 12, theme)}
          <span style={{ marginLeft: '0.25rem' }}>{estimatedTime} min</span>
        </Badge>
      );
    }

    // Use same difficulty label logic as builder
    const difficultyLabel = quiz.difficulty === DIFFICULTY_TYPES.EASY ? 'Easy' 
      : quiz.difficulty === DIFFICULTY_TYPES.MEDIUM ? 'Medium' 
      : quiz.difficulty === DIFFICULTY_TYPES.HARD ? 'Hard' 
      : 'Medium';
    
    chips.push(
      <Badge key={`${quiz.id}-difficulty`} variant="subtle" color={quiz.difficulty === DIFFICULTY_TYPES.EASY ? 'success' : quiz.difficulty === DIFFICULTY_TYPES.MEDIUM ? 'warning' : 'danger'} size="small">
        {difficultyLabel}
      </Badge>
    );

    // Check for retake allowed using maxAttempts field
    if (quiz.maxAttempts > 1) {
      chips.push(
        <Badge key={`${quiz.id}-retake`} variant="outline" color="info" size="small">
          {getThemedIcon('ui', 'repeat', 12, theme)}
          <span style={{ marginLeft: '0.25rem' }}>Retake allowed</span>
        </Badge>
      );
    }

    // Use randomizeQuestions field instead of settings.randomizeOrder
    if (quiz.randomizeQuestions) {
      chips.push(
        <Badge key={`${quiz.id}-shuffle-questions`} variant="outline" color="primary" size="small">
          {getThemedIcon('ui', 'shuffle', 12, theme)}
          <span style={{ marginLeft: '0.25rem' }}>Shuffle questions</span>
        </Badge>
      );
    }

    // Use randomizeAnswers field instead of settings.shuffleOptions
    if (quiz.randomizeAnswers) {
      chips.push(
        <Badge key={`${quiz.id}-shuffle-options`} variant="outline" color="primary" size="small">
          {getThemedIcon('ui', 'shuffle', 12, theme)}
          <span style={{ marginLeft: '0.25rem' }}>Shuffle options</span>
        </Badge>
      );
    }

    return (
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {chips}
      </div>
    );
  };

  const formatCreatedInfo = (quiz) => {
    if (quiz.creatorName && quiz.creatorName !== 'Unknown') {
      return `Created by ${quiz.creatorName}`;
    }
    return 'Created automatically';
  };

  const questionCount = quizData.questions?.length ?? 0;
  const estimatedTime = Number.isFinite(quizData.estimatedTime) ? quizData.estimatedTime : 0;

  const getDifficultyChipClassForBuilder = (difficulty) => {
    switch ((difficulty || '').toLowerCase()) {
      case DIFFICULTY_TYPES.EASY:
        return QuizBuilderPageStyles.difficultyBeginner;
      case DIFFICULTY_TYPES.MEDIUM:
        return QuizBuilderPageStyles.difficultyIntermediate;
      case DIFFICULTY_TYPES.HARD:
        return QuizBuilderPageStyles.difficultyAdvanced;
      default:
        return QuizBuilderPageStyles.difficultyDefault;
    }
  };

  const getDifficultyLabelForBuilder = (difficulty) => {
    const key = (difficulty || '').toLowerCase();
    return DIFFICULTY_LABELS[key] || (difficulty ? difficulty : 'Medium');
  };

  const renderMetaChipsForBuilder = () => {
    const chips = [];
    const typeLabel = QUESTION_TYPE_INFO[quizData.type]?.name || 'Quiz';
    const totalPoints = quizData.questions.reduce((sum, q) => sum + (q.points || 1), 0);
    const totalTimeLimit = quizData.settings?.timeLimit || 0;
    const hasPerQuestionTime = quizData.questions.some(q => q.timeLimit > 0);
    const totalPerQuestionTime = quizData.questions.reduce((sum, q) => sum + (q.timeLimit || 0), 0);

    chips.push(
      <Badge key="type" variant="subtle" color="primary" size="small">
        {getQuestionIcon(quizData.type)}
        <span style={{ marginLeft: '0.25rem' }}>{typeLabel}</span>
      </Badge>
    );

    chips.push(
      <Badge key="questions" variant="subtle" color="info" size="small">
        {getThemedIcon('ui', 'list_checks', 12, theme)}
        <span style={{ marginLeft: '0.25rem' }}>{questionCount} {questionCount === 1 ? 'question' : 'questions'}</span>
      </Badge>
    );

    chips.push(
      <Badge key="points" variant="subtle" color="warning" size="small">
        {getThemedIcon('ui', 'award', 12, theme)}
        <span style={{ marginLeft: '0.25rem' }}>{totalPoints} {totalPoints === 1 ? 'point' : 'points'}</span>
      </Badge>
    );

    if (totalTimeLimit > 0) {
      chips.push(
        <Badge key="time-total" variant="outline" color="danger" size="small">
          {getThemedIcon('ui', 'clock', 12, theme)}
          <span style={{ marginLeft: '0.25rem' }}>{totalTimeLimit} min total</span>
        </Badge>
      );
    } else if (hasPerQuestionTime && totalPerQuestionTime > 0) {
      const totalMinutes = Math.ceil(totalPerQuestionTime / 60);
      chips.push(
        <Badge key="time-per-question" variant="outline" color="info" size="small">
          {getThemedIcon('ui', 'clock', 12, theme)}
          <span style={{ marginLeft: '0.25rem' }}>~{totalMinutes} min (per question)</span>
        </Badge>
      );
    } else {
      chips.push(
        <Badge key="time-estimated" variant="subtle" color="info" size="small">
          {getThemedIcon('ui', 'clock', 12, theme)}
          <span style={{ marginLeft: '0.25rem' }}>{estimatedTime} min</span>
        </Badge>
      );
    }

    chips.push(
      <Badge key="difficulty" variant="subtle" color={quizData.difficulty === DIFFICULTY_TYPES.EASY ? 'success' : quizData.difficulty === DIFFICULTY_TYPES.MEDIUM ? 'warning' : 'danger'} size="small">
        {getDifficultyLabelForBuilder(quizData.difficulty)}
      </Badge>
    );

    if (quizData.settings?.allowRetake) {
      chips.push(
        <Badge key="retake" variant="outline" color="info" size="small">
          {getThemedIcon('ui', 'repeat', 12, theme)}
          <span style={{ marginLeft: '0.25rem' }}>Retake allowed</span>
        </Badge>
      );
    }

    if (quizData.settings?.randomizeOrder) {
      chips.push(
        <Badge key="shuffle-questions" variant="outline" color="primary" size="small">
          {getThemedIcon('ui', 'shuffle', 12, theme)}
          <span style={{ marginLeft: '0.25rem' }}>Shuffle questions</span>
        </Badge>
      );
    }

    if (quizData.settings?.shuffleOptions) {
      chips.push(
        <Badge key="shuffle-options" variant="outline" color="primary" size="small">
          {getThemedIcon('ui', 'shuffle', 12, theme)}
          <span style={{ marginLeft: '0.25rem' }}>Shuffle options</span>
        </Badge>
      );
    }

    return <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>{chips}</div>;
  };

  // LIST VIEW
  if (authLoading) {
    return <GlobalLoadingFallback />;
  }

  if (viewMode === 'list') {
    const totalAttempts = quizzes.reduce((sum, quiz) => sum + (quiz.totalAttempts || 0), 0);
    const averageScore = quizzes.length > 0
      ? Math.round(quizzes.reduce((sum, quiz) => sum + (quiz.averageScore || 0), 0) / quizzes.length)
      : 0;

    if (loading) {
      return (
        <SimpleLoading
          loading
          fullscreen
          type="brand"
          size="lg"
        />
      );
    }

    return (
      <div className={QuizManagementPageStyles.quizManagement}>
        <Container maxWidth="lg">
          {/* Stats Cards with Create Quiz on same line */}
          <div className={QuizManagementPageStyles.statsSection}>
            <div className={QuizManagementPageStyles.statsGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {!isStudent && (
              <Card style={{ cursor: 'pointer', transition: 'all 0.2s', border: '2px dashed var(--color-primary, #800020)' }} onClick={handleAddNew}>
                <CardBody style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', minHeight: '100px' }}>
                  {getThemedIcon('ui', 'plus', 24, theme)}
                  <span style={{ fontWeight: 600, color: 'var(--color-primary, #800020)', fontSize: '0.875rem' }}>{t('create_quiz') || 'Create Quiz'}</span>
                </CardBody>
              </Card>
              )}
              
              <Card className={QuizManagementPageStyles.statCard}>
                <CardBody>
                  <div className={QuizManagementPageStyles.statContent}>
                    <div className={QuizManagementPageStyles.statIcon}>
                      {getThemedIcon('ui', 'list_checks', 16, theme)}
                    </div>
                    <div className={QuizManagementPageStyles.statInfo}>
                      <h3 className={QuizManagementPageStyles.statValue}>{quizzes.length}</h3>
                      <p className={QuizManagementPageStyles.statLabel}>Total Quizzes</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
              
              <Card className={QuizManagementPageStyles.statCard}>
                <CardBody>
                  <div className={QuizManagementPageStyles.statContent}>
                    <div className={QuizManagementPageStyles.statIcon}>
                      {getThemedIcon('ui', 'users', 16, theme)}
                    </div>
                    <div className={QuizManagementPageStyles.statInfo}>
                      <h3 className={QuizManagementPageStyles.statValue}>{totalAttempts}</h3>
                      <p className={QuizManagementPageStyles.statLabel}>Total Attempts</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
              
              <Card className={QuizManagementPageStyles.statCard}>
                <CardBody>
                  <div className={QuizManagementPageStyles.statContent}>
                    <div className={QuizManagementPageStyles.statIcon}>
                      {getThemedIcon('ui', 'check_circle', 16, theme)}
                    </div>
                    <div className={QuizManagementPageStyles.statInfo}>
                      <h3 className={QuizManagementPageStyles.statValue}>{averageScore}%</h3>
                      <p className={QuizManagementPageStyles.statLabel}>Average Score</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
              
              <Card className={QuizManagementPageStyles.statCard}>
                <CardBody>
                  <div className={QuizManagementPageStyles.statContent}>
                    <div className={QuizManagementPageStyles.statIcon}>
                      {getThemedIcon('ui', 'clock', 16, theme)}
                    </div>
                    <div className={QuizManagementPageStyles.statInfo}>
                      <h3 className={QuizManagementPageStyles.statValue}>
                        {quizzes.reduce((sum, q) => sum + (q.estimatedTime || 0), 0)}
                      </h3>
                      <p className={QuizManagementPageStyles.statLabel}>Total Minutes</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
              
              <Card className={QuizManagementPageStyles.statCard}>
                <CardBody>
                  <div className={QuizManagementPageStyles.statContent}>
                    <div className={QuizManagementPageStyles.statIcon}>
                      {getThemedIcon('ui', 'help_circle', 16, theme)}
                    </div>
                    <div className={QuizManagementPageStyles.statInfo}>
                      <h3 className={QuizManagementPageStyles.statValue}>
                        {quizzes.reduce((sum, q) => sum + (q.questionCount || 0), 0)}
                      </h3>
                      <p className={QuizManagementPageStyles.statLabel}>Total Questions</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>

          {/* Quizzes List */}
          <div className={QuizManagementPageStyles.quizzesSection}>
            {error && (
              <div className={QuizManagementPageStyles.errorAlert}>
                {getThemedIcon('ui', 'alert_circle', 20, theme)}
                <span>{error}</span>
              </div>
            )}

            {quizzes.length === 0 ? (
              <Card>
                <CardBody className={QuizManagementPageStyles.emptyState}>
                  {getThemedIcon('ui', 'help_circle', 48, theme)}
                  <h3>No Quizzes Yet</h3>
                  {!isStudent && <p>{t('create_quiz') || 'Create your first quiz to get started'}</p>}
                  {!isStudent && (
                  <Button
                    variant="primary"
                    onClick={handleAddNew}
                  >
                    {getThemedIcon('ui', 'plus', 16, theme)}
                    {t('create_quiz') || 'Create Quiz'}
                  </Button>
                  )}
                </CardBody>
              </Card>
            ) : (
              <div className={QuizManagementPageStyles.quizzesList}>
                {quizzes.map(quiz => (
                  <Card key={quiz.id} className={QuizManagementPageStyles.quizCard}>
                    <CardBody>
                      <div className={QuizManagementPageStyles.quizHeader}>
                        <div className={QuizManagementPageStyles.quizInfo}>
                          {renderMetaChips(quiz)}
                          <h3 className={QuizManagementPageStyles.quizTitle}>
                            {lang === 'ar' 
                              ? (quiz.titleAr || quiz.titleEn || quiz.title || 'Untitled Quiz')
                              : (quiz.titleEn || quiz.titleAr || quiz.title || 'Untitled Quiz')}
                          </h3>
                          {(quiz.descriptionEn || quiz.descriptionAr || quiz.description) && (
                            <p className={QuizManagementPageStyles.quizDescription}>
                              {lang === 'ar'
                                ? (quiz.descriptionAr || quiz.descriptionEn || quiz.description || '')
                                : (quiz.descriptionEn || quiz.descriptionAr || quiz.description || '')}
                            </p>
                          )}

                          <div className={QuizManagementPageStyles.quizStats}>
                            <div className={QuizManagementPageStyles.statItem}>
                              {getThemedIcon('ui', 'users', 14, theme)}
                              <span>{quiz.totalAttempts || 0} attempts</span>
                            </div>
                            <div className={QuizManagementPageStyles.statItem}>
                              {getThemedIcon('ui', 'check_circle', 14, theme)}
                              <span>{quiz.averageScore || 0}% avg score</span>
                            </div>
                          </div>
                        </div>

                        <div className={QuizManagementPageStyles.quizActions}>
                          <Button
                            variant="outline"
                            size="sm"
                            className={QuizManagementPageStyles.iconButton}
                            title="Preview quiz"
                            aria-label="Preview quiz"
                            onClick={() => handlePreview(quiz.id)}
                          >
                            {getThemedIcon('ui', 'play', 16, theme)}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className={QuizManagementPageStyles.iconButton}
                            title="Edit quiz"
                            aria-label="Edit quiz"
                            onClick={() => handleEdit(quiz)}
                          >
                            {getThemedIcon('ui', 'edit', 16, theme)}
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            className={QuizManagementPageStyles.iconButton}
                            onClick={() => handleDelete(quiz.id)}
                            disabled={deleting === quiz.id}
                            title="Delete quiz"
                            aria-label="Delete quiz"
                          >
                            {deleting === quiz.id ? (
                              <Spinner size="sm" />
                            ) : (
                              getThemedIcon('ui', 'trash', 16, theme)
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className={QuizManagementPageStyles.quizFooter}>
                        <span className={QuizManagementPageStyles.createdInfo}>
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

        {deleteModal.open && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <Card style={{ maxWidth: '400px', margin: '1rem' }}>
              <CardBody>
                <h3>Delete Quiz</h3>
                <p>Are you sure you want to delete this quiz? This action cannot be undone.</p>
                {deleteModal.warningMessage && (
                  <p style={{ color: '#dc2626', fontSize: '0.875rem' }}>{deleteModal.warningMessage}</p>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <Button variant="outline" onClick={() => setDeleteModal({ open: false, item: null, onConfirm: null, relatedData: null, warningMessage: null })}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={deleteModal.onConfirm || (() => {})} loading={deleting !== null} style={{ backgroundColor: '#dc2626' }}>
                    Delete
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // ADD/EDIT VIEW - Use QuizBuilderPage component structure
  // This is a simplified version - you'll need to copy the full builder JSX from QuizBuilderPage
  // For now, I'll show the structure and you can import the full builder component or copy the JSX

  if (loading && viewMode === 'edit') {
    return (
      <SimpleLoading
        loading
        fullscreen
        type="brand"
        size="lg"
      />
    );
  }

  // Progress stepper component
  const renderProgressStepper = () => {
    const steps = [
      { id: 'setup', label: 'Setup', icon: 'settings' },
      { id: 'build', label: 'Questions', icon: 'list_checks' },
      { id: 'preview', label: 'Preview', icon: 'eye' }
    ];

    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.5rem', 
        marginBottom: '2.5rem', 
        padding: '1.25rem 1.5rem', 
        background: theme === 'light' ? '#ffffff' : 'rgba(255,255,255,0.03)', 
        borderRadius: '12px',
        border: `1px solid ${theme === 'light' ? '#e5e7eb' : 'rgba(255,255,255,0.1)'}`,
        boxShadow: theme === 'light' ? '0 2px 8px rgba(0,0,0,0.04)' : '0 2px 8px rgba(0,0,0,0.2)'
      }}>
        {steps.map((s, index) => {
          const isActive = step === s.id;
          const isCompleted = steps.findIndex(st => st.id === step) > index;
          const iconColor = isActive || isCompleted ? '#fff' : (theme === 'light' ? '#6b7280' : 'rgba(255,255,255,0.6)');
          
          return (
            <React.Fragment key={s.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isActive 
                    ? 'linear-gradient(135deg, var(--color-primary, #800020) 0%, #a00028 100%)' 
                    : (isCompleted 
                      ? 'linear-gradient(135deg, var(--color-primary, #800020) 0%, #a00028 100%)' 
                      : (theme === 'light' ? '#f3f4f6' : 'rgba(255,255,255,0.1)')),
                  color: isActive || isCompleted ? '#fff' : (theme === 'light' ? '#9ca3af' : 'rgba(255,255,255,0.4)'),
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  transition: 'all 0.3s ease',
                  boxShadow: isActive || isCompleted ? '0 4px 12px rgba(128, 0, 32, 0.3)' : 'none'
                }}>
                  {isCompleted ? getIconWithColor('ui', 'check', 18, iconColor) : getIconWithColor('ui', s.icon, 20, iconColor)}
                </div>
                <span style={{
                  fontSize: '0.95rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--color-primary, #800020)' : (theme === 'light' ? '#374151' : 'rgba(255,255,255,0.7)'),
                  transition: 'all 0.3s ease'
                }}>
                  {s.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div style={{
                  width: '32px',
                  height: '2px',
                  background: isCompleted 
                    ? 'linear-gradient(90deg, var(--color-primary, #800020) 0%, #a00028 100%)' 
                    : (theme === 'light' ? '#e5e7eb' : 'rgba(255,255,255,0.1)'),
                  borderRadius: '1px',
                  transition: 'all 0.3s ease'
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // For add/edit mode, redirect to the builder view
  // We'll render the builder UI here
  return (
    <div className={QuizBuilderPageStyles.quizBuilder}>
      <Container maxWidth="xl">
        {(viewMode === 'add' || viewMode === 'edit') && (
          renderProgressStepper()
        )}

        {(viewMode === 'add' || viewMode === 'edit') && step === 'setup' && (
          <Card>
            <CardBody>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <Badge
                  variant="solid"
                  color="primary"
                  style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
                  onClick={handleCancel}
                >
                  {getIconWithColor('ui', 'arrow_left', 14, '#fff')}
                  Back
                </Badge>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>
                  {viewMode === 'edit' ? 'Edit Quiz' : 'Create New Quiz'}
                </h1>
              </div>

              <div className={QuizBuilderPageStyles.typeGrid}>
                {Object.entries(QUESTION_TYPE_INFO).map(([type, info]) => (
                  <button
                    key={type}
                    className={`${QuizBuilderPageStyles.typeCard} ${selectedType === type ? QuizBuilderPageStyles.active : ''}`}
                    onClick={() => setSelectedType(type)}
                  >
                    <div className={QuizBuilderPageStyles.typeIcon} style={{ color: info.color }}>
                      {info.icon}
                    </div>
                    <h3>{info.name}</h3>
                    <p>{info.description}</p>
                  </button>
                ))}
              </div>

              <div className={QuizBuilderPageStyles.setupForm}>
                <LanguageToggle value={quizLang} onChange={setQuizLang} style={{ marginLeft: 'auto', marginBottom: '0.5rem' }} />
                <div className={QuizBuilderPageStyles.formGrid}>
                  <div className={QuizBuilderPageStyles.formField}>
                    <Input
                      placeholder={quizLang === 'en' ? 'Quiz Title (English)' : 'عنوان الاختبار (عربي)'}
                      value={quizLang === 'en'
                        ? (quizData.titleEn || quizData.title || '')
                        : (quizData.titleAr || quizData.title || '')}
                      onChange={(e) => {
                        const value = e.target.value;
                        setQuizData(prev => {
                          const updated = { ...prev };
                          if (quizLang === 'en') {
                            updated.titleEn = value;
                            updated.title = value;
                          } else {
                            updated.titleAr = value;
                            // Don't overwrite title when typing Arabic
                          }
                          return updated;
                        });
                      }}
                      className={QuizBuilderPageStyles.titleInput}
                    />
                  </div>
                  <div className={QuizBuilderPageStyles.formField}>
                    <Input
                      placeholder={quizLang === 'en' ? 'Quiz Description (optional)' : 'وصف الاختبار (اختياري)'}
                      value={quizLang === 'en'
                        ? (quizData.descriptionEn || quizData.description || '')
                        : (quizData.descriptionAr || quizData.description || '')}
                      onChange={(e) => {
                        const value = e.target.value;
                        setQuizData(prev => ({
                          ...prev,
                          description: quizLang === 'en' ? value : (prev.descriptionEn || prev.description || ''),
                          [quizLang === 'en' ? 'descriptionEn' : 'descriptionAr']: value
                        }));
                      }}
                      className={QuizBuilderPageStyles.descriptionInput}
                    />
                  </div>
                </div>
              </div>

              <div className={QuizBuilderPageStyles.setupActions}>
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
                  disabled={!((quizData.titleEn || quizData.title || '').trim() && (quizData.titleAr || quizData.title || '').trim())}
                >
                  Continue to Questions
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {(viewMode === 'add' || viewMode === 'edit') && step === 'build' && (
          <>
            <div className={QuizBuilderPageStyles.builderHeader}>
              <div className={QuizBuilderPageStyles.headerLeft}>
                <Badge
                  variant="outline"
                  color="default"
                  style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
                  onClick={() => setStep('setup')}
                >
                  {getThemedIcon('ui', 'arrow_left', 14, theme)}
                  Back
                </Badge>
                <div className={QuizBuilderPageStyles.headerSummary}>
                  <h1 className={QuizBuilderPageStyles.quizTitle}>
                    {lang === 'ar' ? (quizData.titleAr || quizData.titleEn || quizData.title) : (quizData.titleEn || quizData.titleAr || quizData.title)}
                  </h1>
                  {renderMetaChipsForBuilder()}
                  {viewMode === 'edit' && quizId && lastSavedRef.current && (
                    <span style={{ fontSize: '0.75rem', color: '#10b981', marginLeft: '1rem' }}>
                      Last saved: {lastSavedRef.current.toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
              <div className={QuizBuilderPageStyles.headerActions}>
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="Preview quiz"
                  onClick={() => setStep('preview')}
                  disabled={questionCount === 0}
                >
                  {getThemedIcon('ui', 'eye', 16, theme)}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={saveQuiz}
                  disabled={saving}
                  aria-label="Save quiz"
                >
                  {saving ? <Spinner size="sm" /> : getIconWithColor('ui', 'save', 16, '#fff')}
                </Button>
              </div>
            </div>

            <div className={QuizBuilderPageStyles.builderContent}>
              {/* Questions Sidebar */}
              <div className={QuizBuilderPageStyles.questionsSidebar}>
                <div className={QuizBuilderPageStyles.sidebarHeader}>
                  <h3>Questions</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addQuestion}
                    title="Add question"
                  >
                    {getThemedIcon('ui', 'plus', 14, theme)}
                  </Button>
                </div>
                <div className={QuizBuilderPageStyles.questionsList}>
                  {quizData.questions.map((question, index) => (
                    <div
                      key={question.id}
                      className={`${QuizBuilderPageStyles.questionTab} ${activeQuestionIndex === index ? QuizBuilderPageStyles.active : ''}`}
                      onClick={() => setActiveQuestionIndex(index)}
                      role="button"
                      tabIndex={0}
                    >
                      <span className={QuizBuilderPageStyles.questionNumber}>Q{index + 1}</span>
                      <span className={QuizBuilderPageStyles.questionType}>
                        <span className={QuizBuilderPageStyles.questionTypeIcon}>
                          {QUESTION_TYPE_INFO[question.type]?.icon || getThemedIcon('ui', 'help_circle', 14, theme)}
                        </span>
                        <span className={QuizBuilderPageStyles.questionPreview}>
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
                        className={QuizBuilderPageStyles.deleteQuestion}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteQuestion(index);
                        }}
                        aria-label={`Delete question ${index + 1}`}
                      >
                        {getThemedIcon('ui', 'trash', 14, theme)}
                      </button>
                    </div>
                  ))}
                  {quizData.questions.length === 0 && (
                    <div className={QuizBuilderPageStyles.emptyQuestions}>
                      <p>No questions yet</p>
                      <Button variant="outline" size="sm" onClick={addQuestion}>
                        Add your first question
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Question Editor */}
              <div className={QuizBuilderPageStyles.questionEditor}>
                {quizData.questions.length > 0 && activeQuestionIndex >= 0 && activeQuestionIndex < quizData.questions.length ? (
                  <Card>
                    <CardBody>
                      <div className={QuizBuilderPageStyles.questionHeader}>
                        <h3>Question {activeQuestionIndex + 1}</h3>
                      </div>
                      
                      <div className={QuizBuilderPageStyles.questionTypeSelector}>
                        <label>Question Type</label>
                        <Select
                          value={quizData.questions[activeQuestionIndex]?.type || QUESTION_TYPES.MULTIPLE_CHOICE}
                          onChange={(e) => {
                            const newType = e.target.value;
                            info('[QuestionType] Changing type:', {
                              from: quizData.questions[activeQuestionIndex]?.type,
                              to: newType,
                              activeQuestionIndex
                            });
                            const currentQuestion = quizData.questions[activeQuestionIndex];
                            if (currentQuestion) {
                              updateQuestion(activeQuestionIndex, {
                                type: newType,
                                options: getDefaultOptions(newType, t)
                              });
                              info('[QuestionType] Type updated successfully');
                            } else {
                              error('[QuestionType] No current question found');
                            }
                          }}
                          options={Object.entries(QUESTION_TYPE_INFO).map(([value, info]) => ({
                            value,
                            label: info.name
                          }))}
                          size="sm"
                          disabled={false}
                          searchable={false}
                        />
                      </div>

                      <div className={QuizBuilderPageStyles.questionForm}>
                        <div className={QuizBuilderPageStyles.questionTextEditor}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <label style={{ fontSize: 14, fontWeight: 500 }}>
                              {lang === 'ar' ? 'نص السؤال' : 'Question Text'}
                            </label>
                            <LanguageToggle value={questionLang} onChange={setQuestionLang} />
                          </div>
                          <RichTextEditor
                            key={`question-text-${questionLang}-${quizData.questions[activeQuestionIndex]?.id || activeQuestionIndex}`}
                            label={questionLang === 'en'
                              ? (lang === 'ar' ? 'نص السؤال (إنجليزي)' : 'Question Text (English)')
                              : (lang === 'ar' ? 'نص السؤال (عربي)' : 'Question Text (Arabic)')}
                            placeholder={questionLang === 'en'
                              ? (lang === 'ar' ? 'أدخل سؤالك هنا...' : 'Enter your question here...')
                              : (lang === 'ar' ? 'أدخل سؤالك بالعربية هنا...' : 'Enter your question in Arabic here...')}
                            value={questionLang === 'en'
                              ? (quizData.questions[activeQuestionIndex]?.question_en || quizData.questions[activeQuestionIndex]?.question || '')
                              : (quizData.questions[activeQuestionIndex]?.question_ar || '')}
                            onChange={(html) => {
                              console.log('[Question Text onChange] questionLang:', questionLang, 'html:', html);
                              if (questionLang === 'en') {
                                updateQuestion(activeQuestionIndex, { question: html, question_en: html });
                              } else {
                                updateQuestion(activeQuestionIndex, { question_ar: html });
                              }
                            }}
                            height={120}
                            className={QuizBuilderPageStyles.questionInput}
                          />
                        </div>

                        <div className={QuizBuilderPageStyles.optionsSection}>
                          <div className={QuizBuilderPageStyles.optionsHeader}>
                            <h4>Answer Options</h4>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <LanguageToggle value={optionLang} onChange={setOptionLang} />
                            {quizData.questions[activeQuestionIndex]?.type !== QUESTION_TYPES.TRUE_FALSE && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => addOption(activeQuestionIndex)}
                                title="Add option"
                              >
                                {getThemedIcon('ui', 'plus', 14, theme)}
                              </Button>
                            )}
                            </div>
                          </div>

                          <div className={QuizBuilderPageStyles.optionsList}>
                            {quizData.questions[activeQuestionIndex]?.options?.map((option, optIndex) => {
                              if (!option || !option.id) return null;
                              return (
                                <div key={option.id} className={QuizBuilderPageStyles.optionRow} style={{
                                  border: option.correct ? '2px solid #10b981' : '1px solid ' + (theme === 'light' ? '#e5e7eb' : 'rgba(255,255,255,0.2)'),
                                  background: option.correct ? (theme === 'light' ? '#ecfdf5' : 'rgba(16, 185, 129, 0.1)') : 'transparent',
                                  transition: 'all 0.2s'
                                }}>
                                  <button
                                    className={`${QuizBuilderPageStyles.correctToggle} ${option.correct ? QuizBuilderPageStyles.correct : ''}`}
                                    onClick={() => {
                                      const currentQuestion = quizData.questions[activeQuestionIndex];
                                      if (currentQuestion) {
                                        setCorrectAnswer(activeQuestionIndex, option.id);
                                      }
                                    }}
                                    style={{
                                      background: option.correct ? '#10b981' : (theme === 'light' ? '#f3f4f6' : 'rgba(255,255,255,0.1)'),
                                      color: option.correct ? '#fff' : (theme === 'light' ? '#6b7280' : 'rgba(255,255,255,0.5)'),
                                      border: option.correct ? '2px solid #10b981' : '1px solid ' + (theme === 'light' ? '#d1d5db' : 'rgba(255,255,255,0.2)')
                                    }}
                                    title={option.correct ? 'Mark as incorrect' : 'Mark as correct'}
                                  >
                                    {option.correct ? getThemedIcon('ui', 'check_circle', 16, theme) : getThemedIcon('ui', 'x_circle', 16, theme)}
                                  </button>
                                  <div style={{ flex: 1 }}>
                                    <RichTextEditor
                                      key={`option-${option.id}-${optionLang}-${activeQuestionIndex}-${quizData.questions[activeQuestionIndex]?.id || 'new'}`}
                                      placeholder={`Option ${optIndex + 1}`}
                                      value={optionLang === 'en'
                                        ? (option.text_en || option.text || '')
                                        : (option.text_ar || option.text || '')}
                                      onChange={(html) => {
                                        const currentQuestion = quizData.questions[activeQuestionIndex];
                                        if (!currentQuestion) {
                                          return;
                                        }
                                        if (!option.id) {
                                          return;
                                        }
                                        if (optionLang === 'en') {
                                          updateOption(activeQuestionIndex, option.id, { text: html, text_en: html });
                                        } else {
                                          updateOption(activeQuestionIndex, option.id, { text_ar: html });
                                        }
                                      }}
                                      height={100}
                                      className={QuizBuilderPageStyles.optionInput}
                                    />
                                  </div>
                                  {quizData.questions[activeQuestionIndex]?.type !== QUESTION_TYPES.TRUE_FALSE && (
                                    <button
                                      className={QuizBuilderPageStyles.deleteOption}
                                      onClick={() => {
                                        const currentQuestion = quizData.questions[activeQuestionIndex];
                                        if (currentQuestion) {
                                          deleteOption(activeQuestionIndex, option.id);
                                        }
                                      }}
                                      title="Delete option"
                                    >
                                      {getThemedIcon('ui', 'trash', 14, theme)}
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className={QuizBuilderPageStyles.questionSettings}>
                          <div className={QuizBuilderPageStyles.settingRow}>
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
                          <div className={QuizBuilderPageStyles.settingRow}>
                            <label>Time Limit (seconds)</label>
                            <Input
                              type="number"
                              value={quizData.questions[activeQuestionIndex]?.timeLimit || 0}
                              onChange={(e) => updateQuestion(activeQuestionIndex, { timeLimit: parseInt(e.target.value) || 0 })}
                              min="0"
                              max="600"
                              placeholder={t('quizzes.no_limit', 'No limit')}
                              style={{ width: '120px' }}
                            />
                          </div>
                          <div className={QuizBuilderPageStyles.settingRow}>
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
                        </div>

                        <div className={QuizBuilderPageStyles.quizSettingsSection} style={{ marginTop: '1.5rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
                          <h4 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>Quiz Settings</h4>
                          <div className={QuizBuilderPageStyles.togglesContainer}>
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

                        <div className={QuizBuilderPageStyles.explanationSection}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <label style={{ fontWeight: 600 }}>Explanation (Optional)</label>
                            <LanguageToggle value={explanationLang} onChange={setExplanationLang} style={{ marginLeft: 'auto' }} />
                          </div>
                          <RichTextEditor
                            key={`explanation-${explanationLang}-${quizData.questions[activeQuestionIndex]?.id || activeQuestionIndex}`}
                            label={explanationLang === 'ar' ? 'الشرح (عربي)' : 'Explanation (English)'}
                            value={explanationLang === 'ar' 
                              ? (quizData.questions[activeQuestionIndex]?.explanation_ar || '')
                              : (quizData.questions[activeQuestionIndex]?.explanation_en || quizData.questions[activeQuestionIndex]?.explanation || '')
                            }
                            onChange={(html) => {
                              const update = explanationLang === 'ar' 
                                ? { explanation_ar: html }
                                : { explanation_en: html, explanation: html };
                              updateQuestion(activeQuestionIndex, update);
                            }}
                            placeholder={explanationLang === 'ar' ? 'اشرح لماذا هذه الإجابة صحيحة...' : 'Describe why this answer is correct...'}
                            helperText="Shown to students after they answer the question."
                            height={120}
                          />
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ) : (
                  <Card>
                    <CardBody className={QuizBuilderPageStyles.emptyEditor}>
                      {getThemedIcon('ui', 'help_circle', 48, theme)}
                      <h3>No Questions Yet</h3>
                      <p>Add your first question to get started</p>
                      <Button variant="primary" onClick={addQuestion}>
                        {getThemedIcon('ui', 'plus', 16, theme)}
                        Add Question
                      </Button>
                    </CardBody>
                  </Card>
                )}
              </div>
            </div>
          </>
        )}

        {/* Preview step - similar structure to QuizBuilderPage */}
        {(viewMode === 'add' || viewMode === 'edit') && step === 'preview' && (
          <Card>
            <CardBody>
              <div className={QuizBuilderPageStyles.previewHeader}>
                <Button
                  variant="outline"
                  onClick={() => setStep('build')}
                >
                  ← Back to Edit
                </Button>
                <div className={QuizBuilderPageStyles.headerSummary}>
                  <h1 className={QuizBuilderPageStyles.quizTitle}>
                    {lang === 'ar' ? (quizData.titleAr || quizData.titleEn || quizData.title) : (quizData.titleEn || quizData.titleAr || quizData.title)}
                  </h1>
                  {renderMetaChipsForBuilder()}
                  {viewMode === 'edit' && quizId && lastSavedRef.current && (
                    <span style={{ fontSize: '0.75rem', color: '#10b981', marginLeft: '1rem' }}>
                      Last saved: {lastSavedRef.current.toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <div className={QuizBuilderPageStyles.previewActions}>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={saveQuiz}
                    disabled={saving}
                    aria-label="Save quiz"
                  >
                    {saving ? <Spinner size="sm" /> : getIconWithColor('ui', 'save', 16, '#fff')}
                  </Button>
                </div>
              </div>

              <div className={QuizBuilderPageStyles.previewContent}>
                {questionCount === 0 ? (
                  <div className={QuizBuilderPageStyles.emptyPreview}>
                    {getThemedIcon('ui', 'help_circle', 48, theme)}
                    <h3>No Questions to Preview</h3>
                    <p>Add some questions to see how your quiz will look</p>
                    <Button variant="outline" onClick={() => setStep('build')}>
                      Add Questions
                    </Button>
                  </div>
                ) : (
                  <div className={QuizBuilderPageStyles.questionsPreview}>
                    {quizData.questions.map((question, qIndex) => (
                      <Card key={question.id} className={QuizBuilderPageStyles.previewQuestionCard}>
                        <CardBody>
                          <div className={QuizBuilderPageStyles.previewQuestionHeader}>
                            <div className={QuizBuilderPageStyles.questionNumber}>Question {qIndex + 1}</div>
                            <div className={QuizBuilderPageStyles.questionType}>
                              {getQuestionIcon(question.type)}
                              <span>{getQuestionTypeLabel(question.type)}</span>
                            </div>
                            <div className={QuizBuilderPageStyles.questionPoints}>
                              {question.points || 1} point{question.points !== 1 ? 's' : ''}
                            </div>
                          </div>

                          <div 
                            className={QuizBuilderPageStyles.previewQuestionText}
                            dangerouslySetInnerHTML={{ __html: (lang === 'ar' ? (question.question_ar || question.question || '<p>No question text</p>') : (question.question_en || question.question || '<p>No question text</p>')) }}
                          />

                          <div className={QuizBuilderPageStyles.previewOptions}>
                            {question.options?.map((option, oIndex) => (
                              <div
                                key={option.id}
                                className={`${QuizBuilderPageStyles.previewOption} ${option.correct ? QuizBuilderPageStyles.correct : QuizBuilderPageStyles.incorrect}`}
                              >
                                <div className={QuizBuilderPageStyles.optionIndicator}>
                                  {option.correct ? (
                                    getThemedIcon('ui', 'check_circle', 20, theme)
                                  ) : (
                                    <div className={QuizBuilderPageStyles.optionRadio} />
                                  )}
                                </div>
                                <div 
                                  className={QuizBuilderPageStyles.optionText}
                                  dangerouslySetInnerHTML={{ __html: option.text || `Option ${oIndex + 1}` }}
                                />
                              </div>
                            ))}
                          </div>

                          {question.explanation && (
                            <div className={QuizBuilderPageStyles.previewExplanation}>
                              <h4>Explanation:</h4>
                              <div
                                className={QuizBuilderPageStyles.previewExplanationContent}
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
        )}
      </Container>
    </div>
  );
}


