import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLang } from '../contexts/LangContext';
import { useAuth } from '../contexts/AuthContext';
import {
  Plus, Save, Eye, Trash2, GripVertical, Clock, Copy, Play,
  CheckCircle, XCircle, HelpCircle, ListChecks, Repeat, Award,
  Edit, Users, AlertCircle, ArrowLeft, Shuffle, Languages
} from 'lucide-react';
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { notifyQuizAvailable } from '../firebase/quizNotifications';
import { getEnrollments, getUsers, getUser } from '../firebase/firestore';
import { getAllQuizzes, getQuizzesByCreator, deleteQuiz, getQuiz, createQuiz, updateQuiz } from '../firebase/quizzes';
import { logActivity, ACTIVITY_TYPES } from '../firebase/activityLogger';
import { Container, Button, Card, CardBody, Input, Select, Spinner, useToast, RichTextEditor, Loading, Badge } from '../components/ui';
import ToggleSwitch from '../components/ToggleSwitch';
import LanguageToggle from '../components/LanguageToggle';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import QuizBuilderPageStyles from './QuizBuilderPage.module.css';
import QuizManagementPageStyles from './QuizManagementPage.module.css';

// Import all the constants and helper functions from QuizBuilderPage
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
        { id: '1', text: 'True', text_en: 'True', text_ar: 'True', correct: false },
        { id: '2', text: 'False', text_en: 'False', text_ar: 'False', correct: false }
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
  const { user, isAdmin, isInstructor, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const quizId = searchParams.get('id');
  const mode = searchParams.get('mode'); // 'add' or 'edit'
  const toast = useToast();

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
    
    const questionText = question.question || question.question_en || '';
    const questionTextAr = question.question_ar || questionText;

    const normalizedOptions = baseOptions.length > 0
      ? baseOptions.map(opt => ({
          ...opt,
          text: opt.text || opt.text_en || '',
          text_en: opt.text_en || opt.text || '',
          text_ar: opt.text_ar || opt.text || ''
        }))
      : getDefaultOptions(resolvedType).map(opt => ({
          ...opt,
          text: opt.text || opt.text_en || '',
          text_en: opt.text_en || opt.text || '',
          text_ar: opt.text_ar || opt.text || ''
        }));

    return {
      id: question.id || generateUniqueId(),
      type: resolvedType,
      question: questionText,
      question_en: question.question_en || questionText,
      question_ar: question.question_ar || questionTextAr,
      image: question.image || null,
      explanation: question.explanation || '',
      explanation_en: question.explanation_en || question.explanation || '',
      explanation_ar: question.explanation_ar || question.explanation || '',
      points: Number.isFinite(question.points) ? question.points : 1,
      timeLimit: Number.isFinite(question.timeLimit) ? question.timeLimit : 0,
      difficulty: question.difficulty || 'medium',
      options: normalizedOptions
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
      title_en: data.title_en || data.title || '',
      title_ar: data.title_ar || data.title || '',
      description_en: data.description_en || data.description || '',
      description_ar: data.description_ar || data.description || '',
      type: data.type || defaultQuizTemplate.type,
      difficulty: data.difficulty || defaultQuizTemplate.difficulty,
      estimatedTime: Number.isFinite(data.estimatedTime) ? data.estimatedTime : defaultQuizTemplate.estimatedTime,
      questions: normalizedQuestions,
      settings: mergedSettings
    };
  };

  const [quizData, setQuizData] = useState(() => normalizeQuizData());
  const [originalQuizData, setOriginalQuizData] = useState(null); // Store original for comparison

  // Load quizzes list
  useEffect(() => {
    if (viewMode === 'list' && !authLoading && user) {
      loadQuizzes();
    }
  }, [viewMode, authLoading, user]);

  // Load quiz for editing
  useEffect(() => {
    if (viewMode === 'edit' && quizId) {
      loadQuiz(quizId);
    }
  }, [viewMode, quizId]);

  // Log state changes when active question changes
  useEffect(() => {
    if (activeQuestionIndex >= 0 && quizData.questions[activeQuestionIndex]) {
      const question = quizData.questions[activeQuestionIndex];
      console.log('[QuestionChange] Active question changed:', {
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
      title: lang === 'ar' ? (quiz.title_ar || quiz.title_en || quiz.title || 'Untitled Quiz') : (quiz.title_en || quiz.title_ar || quiz.title || 'Untitled Quiz'),
      description: lang === 'ar' ? (quiz.description_ar || quiz.description_en || quiz.description || '') : (quiz.description_en || quiz.description_ar || quiz.description || ''),
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

  const loadQuiz = async (id) => {
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
  };

  const saveQuiz = async () => {
    const titleEn = (quizData.title_en || quizData.title || '').trim();
    const titleAr = (quizData.title_ar || quizData.title || '').trim();
    if (!titleEn || !titleAr) {
      toast?.showError?.('Please enter quiz title in both English and Arabic');
      return;
    }
    if (quizData.questions.length === 0) {
      toast?.showError?.('Please add at least one question');
      return;
    }

    // Check if score changed and activities are connected (for editing)
    if (quizId && originalQuizData) {
      const newTotalScore = quizData.questions.reduce((sum, q) => sum + (q.points || 1), 0);
      const originalTotalScore = originalQuizData.questions.reduce((sum, q) => sum + (q.points || 1), 0);
      
      if (newTotalScore !== originalTotalScore) {
        // Check for connected activities
        try {
          const activitiesQuery = query(collection(db, 'activities'), where('quizId', '==', quizId));
          const activitiesSnap = await getDocs(activitiesQuery);
          const connectedActivities = activitiesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          
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
          console.warn('Failed to check connected activities:', error);
        }
      }
    }

    setSaving(true);
    toast?.showInfo?.(quizId ? 'Updating quiz...' : 'Creating quiz...');
    try {
      let targetQuizId = quizId;

      if (quizId) {
        console.log('[Save] Updating quiz:', quizId);
        const result = await updateQuiz(quizId, quizData);
        if (result.success) {
          console.log('[Save] Quiz updated successfully');
          toast?.showSuccess?.('Quiz updated successfully!');
          setViewMode('list');
          loadQuizzes();
        } else {
          throw new Error(result.error);
        }
      } else {
        console.log('[Save] Creating new quiz');
        const result = await createQuiz(quizData, user.uid);
        if (result.success) {
          targetQuizId = result.id;
          console.log('[Save] Quiz created successfully:', targetQuizId);
          toast?.showSuccess?.('Quiz created successfully!');
          setViewMode('list');
          loadQuizzes();
        } else {
          throw new Error(result.error);
        }
      }

      // Update last saved time
      lastSavedRef.current = new Date();

      // Sync to Activities collection
      if (targetQuizId) {
        const activityData = {
          title_en: quizData.title_en || quizData.title || '',
          title_ar: quizData.title_ar || quizData.title || '',
          description_en: quizData.description_en || quizData.description || '',
          description_ar: quizData.description_ar || quizData.description || '',
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
            const assignedClassIds = quizData.assignedClassIds || (quizData.classId ? [quizData.classId] : []);
            
            if (assignedClassIds.length > 0) {
              const enrollmentsResult = await getEnrollments();
              const usersResult = await getUsers();
              
              if (enrollmentsResult.success && usersResult.success) {
                const enrollments = enrollmentsResult.data || [];
                const users = usersResult.data || [];
                const usersMap = new Map(users.map(u => [u.id || u.docId, u]));
                
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
                    { 
                      id: targetQuizId, 
                      title: quizData.title_en || quizData.title || '',
                      title_en: quizData.title_en || quizData.title || '',
                      title_ar: quizData.title_ar || quizData.title || '',
                      description: quizData.description_en || quizData.description || '',
                      description_en: quizData.description_en || quizData.description || '',
                      description_ar: quizData.description_ar || quizData.description || '',
                      settings: quizData.settings 
                    },
                    studentsToNotify
                  );
                }
              }
            }
          } catch (notifyError) {
            console.warn('Failed to send quiz notifications:', notifyError);
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

  const handleEdit = (quiz) => {
    console.log('Edit quiz clicked:', quiz);
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
      const submissionsQuery = query(
        collection(db, 'quizSubmissions'),
        where('quizId', '==', quizIdToDelete)
      );
      const submissionsSnap = await getDocs(submissionsQuery);
      const quizSubmissions = submissionsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const itemName = lang === 'ar' ? (quiz.title_ar || quiz.title_en || quiz.title || quiz.name || 'Untitled Quiz') : (quiz.title_en || quiz.title_ar || quiz.title || quiz.name || 'Untitled Quiz');

      setDeleteModal({
        open: true,
        item: { ...quiz, _displayName: itemName },
        onConfirm: async () => {
          setDeleting(quizIdToDelete);
          try {
            const result = await deleteQuiz(quizIdToDelete);
            if (!result.success) {
              throw new Error(result.error || 'Failed to delete quiz');
            }

            try {
              await logActivity(ACTIVITY_TYPES.QUIZ_DELETED, {
                quizId: quizIdToDelete,
                quizTitle: quiz?.title || quiz?.name || 'Unknown'
              });
            } catch (e) { console.warn('Failed to log activity:', e); }

            try {
              await deleteDoc(doc(db, 'activities', quizIdToDelete));
            } catch {}

            setQuizzes(prev => prev.filter(q => q.id !== quizIdToDelete));
            setDeleteModal({ open: false, item: null, onConfirm: null, relatedData: null, warningMessage: null });
          } catch (error) {
            alert('Failed to delete quiz: ' + error.message);
          } finally {
            setDeleting(null);
          }
        },
        relatedData: {
          'Quiz Submissions': quizSubmissions.map(s => ({
            ...s,
            _label: `Quiz Submission`
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
        item: { ...quiz, _displayName: lang === 'ar' ? (quiz.title_ar || quiz.title_en || quiz.title || quiz.name || 'Untitled Quiz') : (quiz.title_en || quiz.title_ar || quiz.title || quiz.name || 'Untitled Quiz') },
        onConfirm: async () => {
          setDeleting(quizIdToDelete);
          try {
            const result = await deleteQuiz(quizIdToDelete);
            if (!result.success) {
              throw new Error(result.error || 'Failed to delete quiz');
            }
            setQuizzes(prev => prev.filter(q => q.id !== quizIdToDelete));
            setDeleteModal({ open: false, item: null, onConfirm: null, relatedData: null, warningMessage: null });
          } catch (error) {
            alert('Failed to delete quiz: ' + error.message);
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

  const updateOption = useCallback((questionIndex, optionId, updates) => {
    console.log('[UpdateOption] Called:', { questionIndex, optionId, updates, timestamp: new Date().toISOString() });
    
    setQuizData(prev => {
      const currentQuestion = prev.questions[questionIndex];
      if (!currentQuestion) {
        console.warn('[UpdateOption] Question not found at index:', questionIndex);
        return prev;
      }

      const optionIndex = currentQuestion.options.findIndex(opt => opt.id === optionId);
      if (optionIndex === -1) {
        console.warn('[UpdateOption] Option not found:', { optionId, availableIds: currentQuestion.options.map(o => o.id) });
        return prev;
      }

      const updatedOptions = currentQuestion.options.map((opt, idx) => {
        if (opt.id === optionId) {
          const updated = { ...opt, ...updates };
          console.log('[UpdateOption] Updating option:', { 
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

      console.log('[UpdateOption] State updated:', {
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
        return QuizManagementPageStyles.difficultyBeginner;
      case 'intermediate':
        return QuizManagementPageStyles.difficultyIntermediate;
      case 'advanced':
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
        <ListChecks size={12} style={{ marginRight: '0.25rem' }} />
        {quiz.questionCount || 0} {quiz.questionCount === 1 ? 'question' : 'questions'}
      </Badge>
    );

    chips.push(
      <Badge key={`${quiz.id}-points`} variant="subtle" color="warning" size="small">
        <Award size={12} style={{ marginRight: '0.25rem' }} />
        {totalPoints} {totalPoints === 1 ? 'point' : 'points'}
      </Badge>
    );

    // Calculate total time from per-question time limits or use quiz-level timeLimit
    let totalTimeMinutes = 0;
    if (quiz.settings?.timeLimit > 0) {
      // Quiz-level time limit (in minutes) - legacy support
      totalTimeMinutes = quiz.settings.timeLimit;
    } else if (quiz.questions && Array.isArray(quiz.questions) && quiz.questions.length > 0) {
      // Calculate from per-question time limits (in seconds)
      const totalSeconds = quiz.questions.reduce((sum, q) => sum + (q.timeLimit || 0), 0);
      totalTimeMinutes = Math.round(totalSeconds / 60);
    } else if (quiz.estimatedTime) {
      totalTimeMinutes = quiz.estimatedTime;
    }

    if (totalTimeMinutes > 0) {
      chips.push(
        <Badge key={`${quiz.id}-time`} variant={quiz.settings?.timeLimit > 0 ? "outline" : "subtle"} color={quiz.settings?.timeLimit > 0 ? "danger" : "info"} size="small">
          <Clock size={12} style={{ marginRight: '0.25rem' }} />
          {totalTimeMinutes} min{quiz.settings?.timeLimit > 0 ? ' limit' : ''}
        </Badge>
      );
    }

    chips.push(
      <Badge key={`${quiz.id}-difficulty`} variant="subtle" color={quiz.difficulty === 'beginner' ? 'success' : quiz.difficulty === 'intermediate' ? 'warning' : 'danger'} size="small">
        {getDifficultyLabel(quiz.difficulty)}
      </Badge>
    );

    if (quiz.allowRetake || quiz.settings?.allowRetake) {
      chips.push(
        <Badge key={`${quiz.id}-retake`} variant="outline" color="info" size="small">
          <Repeat size={12} style={{ marginRight: '0.25rem' }} />
          Retake allowed
        </Badge>
      );
    }

    if (quiz.settings?.randomizeOrder) {
      chips.push(
        <Badge key={`${quiz.id}-shuffle-questions`} variant="outline" color="primary" size="small">
          <Shuffle size={12} style={{ marginRight: '0.25rem' }} />
          Shuffle questions
        </Badge>
      );
    }

    if (quiz.settings?.shuffleOptions) {
      chips.push(
        <Badge key={`${quiz.id}-shuffle-options`} variant="outline" color="primary" size="small">
          <Shuffle size={12} style={{ marginRight: '0.25rem' }} />
          Shuffle options
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
      case 'beginner':
        return QuizBuilderPageStyles.difficultyBeginner;
      case 'intermediate':
        return QuizBuilderPageStyles.difficultyIntermediate;
      case 'advanced':
        return QuizBuilderPageStyles.difficultyAdvanced;
      default:
        return QuizBuilderPageStyles.difficultyDefault;
    }
  };

  const getDifficultyLabelForBuilder = (difficulty) => {
    const key = (difficulty || '').toLowerCase();
    return DIFFICULTY_LABELS[key] || (difficulty ? difficulty : 'General');
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
        <ListChecks size={12} style={{ marginRight: '0.25rem' }} />
        {questionCount} {questionCount === 1 ? 'question' : 'questions'}
      </Badge>
    );

    chips.push(
      <Badge key="points" variant="subtle" color="warning" size="small">
        <Award size={12} style={{ marginRight: '0.25rem' }} />
        {totalPoints} {totalPoints === 1 ? 'point' : 'points'}
      </Badge>
    );

    if (totalTimeLimit > 0) {
      chips.push(
        <Badge key="time-total" variant="outline" color="danger" size="small">
          <Clock size={12} style={{ marginRight: '0.25rem' }} />
          {totalTimeLimit} min total
        </Badge>
      );
    } else if (hasPerQuestionTime && totalPerQuestionTime > 0) {
      const totalMinutes = Math.ceil(totalPerQuestionTime / 60);
      chips.push(
        <Badge key="time-per-question" variant="outline" color="info" size="small">
          <Clock size={12} style={{ marginRight: '0.25rem' }} />
          ~{totalMinutes} min (per question)
        </Badge>
      );
    } else {
      chips.push(
        <Badge key="time-estimated" variant="subtle" color="info" size="small">
          <Clock size={12} style={{ marginRight: '0.25rem' }} />
          {estimatedTime} min
        </Badge>
      );
    }

    chips.push(
      <Badge key="difficulty" variant="subtle" color={quizData.difficulty === 'beginner' ? 'success' : quizData.difficulty === 'intermediate' ? 'warning' : 'danger'} size="small">
        {getDifficultyLabelForBuilder(quizData.difficulty)}
      </Badge>
    );

    if (quizData.settings?.allowRetake) {
      chips.push(
        <Badge key="retake" variant="outline" color="info" size="small">
          <Repeat size={12} style={{ marginRight: '0.25rem' }} />
          Retake allowed
        </Badge>
      );
    }

    if (quizData.settings?.randomizeOrder) {
      chips.push(
        <Badge key="shuffle-questions" variant="outline" color="primary" size="small">
          <Shuffle size={12} style={{ marginRight: '0.25rem' }} />
          Shuffle questions
        </Badge>
      );
    }

    if (quizData.settings?.shuffleOptions) {
      chips.push(
        <Badge key="shuffle-options" variant="outline" color="primary" size="small">
          <Shuffle size={12} style={{ marginRight: '0.25rem' }} />
          Shuffle options
        </Badge>
      );
    }

    return <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>{chips}</div>;
  };

  // LIST VIEW
  if (viewMode === 'list') {
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
      <div className={QuizManagementPageStyles.quizManagement}>
        <Container maxWidth="lg">
          {/* Stats Cards with Create Quiz on same line */}
          <div className={QuizManagementPageStyles.statsSection}>
            <div className={QuizManagementPageStyles.statsGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <Card style={{ cursor: 'pointer', transition: 'all 0.2s', border: '2px dashed var(--color-primary, #800020)' }} onClick={handleAddNew}>
                <CardBody style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', minHeight: '100px' }}>
                  <Plus size={24} style={{ color: 'var(--color-primary, #800020)' }} />
                  <span style={{ fontWeight: 600, color: 'var(--color-primary, #800020)', fontSize: '0.875rem' }}>Create Quiz</span>
                </CardBody>
              </Card>
              
              <Card className={QuizManagementPageStyles.statCard}>
                <CardBody>
                  <div className={QuizManagementPageStyles.statContent}>
                    <div className={QuizManagementPageStyles.statIcon}>
                      <ListChecks size={16} style={{ color: '#8b5cf6' }} />
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
                      <Users size={16} style={{ color: '#10b981' }} />
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
                      <CheckCircle size={16} style={{ color: '#f59e0b' }} />
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
                      <Clock size={16} style={{ color: '#6366f1' }} />
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
                      <HelpCircle size={16} style={{ color: '#ec4899' }} />
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
                <AlertCircle size={20} style={{ color: '#ef4444', marginRight: 8 }} />
                <span>{error}</span>
              </div>
            )}

            {quizzes.length === 0 ? (
              <Card>
                <CardBody className={QuizManagementPageStyles.emptyState}>
                  <HelpCircle size={48} style={{ color: '#d1d5db', marginBottom: 16 }} />
                  <h3>No Quizzes Yet</h3>
                  <p>Create your first quiz to get started</p>
                  <Button
                    variant="primary"
                    onClick={handleAddNew}
                  >
                    <Plus size={16} style={{ marginRight: 6 }} />
                    Create Quiz
                  </Button>
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
                              ? (quiz.title_ar || quiz.title_en || quiz.title || 'Untitled Quiz')
                              : (quiz.title_en || quiz.title_ar || quiz.title || 'Untitled Quiz')}
                          </h3>
                          {(quiz.description_en || quiz.description_ar || quiz.description) && (
                            <p className={QuizManagementPageStyles.quizDescription}>
                              {lang === 'ar'
                                ? (quiz.description_ar || quiz.description_en || quiz.description || '')
                                : (quiz.description_en || quiz.description_ar || quiz.description || '')}
                            </p>
                          )}

                          <div className={QuizManagementPageStyles.quizStats}>
                            <div className={QuizManagementPageStyles.statItem}>
                              <Users size={14} style={{ color: '#64748b' }} />
                              <span>{quiz.totalAttempts || 0} attempts</span>
                            </div>
                            <div className={QuizManagementPageStyles.statItem}>
                              <CheckCircle size={14} style={{ color: '#10b981' }} />
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
                            <Play size={16} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className={QuizManagementPageStyles.iconButton}
                            title="Edit quiz"
                            aria-label="Edit quiz"
                            onClick={() => handleEdit(quiz)}
                          >
                            <Edit size={16} />
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
                              <Trash2 size={16} />
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

        <DeleteConfirmationModal
          open={deleteModal.open}
          onClose={() => setDeleteModal({ open: false, item: null, onConfirm: null, relatedData: null, warningMessage: null })}
          onConfirm={deleteModal.onConfirm || (() => {})}
          title="Delete Quiz"
          message="Are you sure you want to delete this quiz? This action cannot be undone."
          itemName={deleteModal.item?._displayName || deleteModal.item?.title || deleteModal.item?.name || deleteModal.item?.id}
          relatedData={deleteModal.relatedData}
          warningMessage={deleteModal.warningMessage}
          loading={deleting !== null}
        />
      </div>
    );
  }

  // ADD/EDIT VIEW - Use QuizBuilderPage component structure
  // This is a simplified version - you'll need to copy the full builder JSX from QuizBuilderPage
  // For now, I'll show the structure and you can import the full builder component or copy the JSX

  if (loading && (viewMode === 'add' || viewMode === 'edit')) {
    return (
      <Loading
        variant="overlay"
        fullscreen
        message="Loading quiz..."
      />
    );
  }

  // For add/edit mode, redirect to the builder view
  // We'll render the builder UI here
  return (
    <div className={QuizBuilderPageStyles.quizBuilder}>
      <Container maxWidth="xl">
        {(viewMode === 'add' || viewMode === 'edit') && step === 'setup' && (
          <Card>
            <CardBody>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <Badge
                  variant="outline"
                  color="default"
                  style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
                  onClick={handleCancel}
                >
                  <ArrowLeft size={14} />
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
                        ? (quizData.title_en || quizData.title || '')
                        : (quizData.title_ar || quizData.title || '')}
                      onChange={(e) => {
                        const value = e.target.value;
                        setQuizData(prev => ({
                          ...prev,
                          title: quizLang === 'en' ? value : (prev.title_en || prev.title || ''),
                          [quizLang === 'en' ? 'title_en' : 'title_ar']: value
                        }));
                      }}
                      className={QuizBuilderPageStyles.titleInput}
                    />
                  </div>
                  <div className={QuizBuilderPageStyles.formField}>
                    <Input
                      placeholder={quizLang === 'en' ? 'Quiz Description (optional)' : 'وصف الاختبار (اختياري)'}
                      value={quizLang === 'en'
                        ? (quizData.description_en || quizData.description || '')
                        : (quizData.description_ar || quizData.description || '')}
                      onChange={(e) => {
                        const value = e.target.value;
                        setQuizData(prev => ({
                          ...prev,
                          description: quizLang === 'en' ? value : (prev.description_en || prev.description || ''),
                          [quizLang === 'en' ? 'description_en' : 'description_ar']: value
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
                  disabled={!((quizData.title_en || quizData.title || '').trim() && (quizData.title_ar || quizData.title || '').trim())}
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
                  <ArrowLeft size={14} />
                  Back
                </Badge>
                <div className={QuizBuilderPageStyles.headerSummary}>
                  <h1 className={QuizBuilderPageStyles.quizTitle}>
                    {lang === 'ar' ? (quizData.title_ar || quizData.title_en || quizData.title) : (quizData.title_en || quizData.title_ar || quizData.title)}
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
                    <Plus size={14} />
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
                          {QUESTION_TYPE_INFO[question.type]?.icon || <HelpCircle size={14} />}
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
                        <Trash2 size={14} />
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
                            console.log('[QuestionType] Changing type:', {
                              from: quizData.questions[activeQuestionIndex]?.type,
                              to: newType,
                              activeQuestionIndex
                            });
                            const currentQuestion = quizData.questions[activeQuestionIndex];
                            if (currentQuestion) {
                              updateQuestion(activeQuestionIndex, {
                                type: newType,
                                options: getDefaultOptions(newType)
                              });
                              console.log('[QuestionType] Type updated successfully');
                            } else {
                              console.error('[QuestionType] No current question found');
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
                              const currentQuestion = quizData.questions[activeQuestionIndex];
                              if (currentQuestion && currentQuestion.id) {
                                if (questionLang === 'en') {
                                  updateQuestion(activeQuestionIndex, { question: html, question_en: html });
                                } else {
                                  updateQuestion(activeQuestionIndex, { question_ar: html });
                                }
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
                                <Plus size={14} />
                              </Button>
                            )}
                            </div>
                          </div>

                          <div className={QuizBuilderPageStyles.optionsList}>
                            {quizData.questions[activeQuestionIndex]?.options?.map((option, optIndex) => {
                              if (!option || !option.id) return null;
                              return (
                                <div key={option.id} className={QuizBuilderPageStyles.optionRow}>
                                  <button
                                    className={`${QuizBuilderPageStyles.correctToggle} ${option.correct ? QuizBuilderPageStyles.correct : ''}`}
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
                                    >
                                      <Trash2 size={14} />
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
                              placeholder="No limit"
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
                    {lang === 'ar' ? (quizData.title_ar || quizData.title_en || quizData.title) : (quizData.title_en || quizData.title_ar || quizData.title)}
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
                    {saving ? <Spinner size="sm" /> : <Save size={16} />}
                  </Button>
                </div>
              </div>

              <div className={QuizBuilderPageStyles.previewContent}>
                {questionCount === 0 ? (
                  <div className={QuizBuilderPageStyles.emptyPreview}>
                    <HelpCircle size={48} style={{ color: '#ccc', marginBottom: 16 }} />
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
                                    <CheckCircle size={20} style={{ color: '#10b981' }} />
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


