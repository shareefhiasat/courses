import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLang } from '../contexts/LangContext';
import { useAuth } from '../contexts/AuthContext';
import {
  Plus, Save, Eye, Share2, Settings, Image as ImageIcon,
  Clock, Trash2, GripVertical, Copy, Download, QrCode as QrCodeIcon,
  Play, Trophy, BarChart3, Users, Calendar, MessageSquare, Smartphone, Check
} from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import QRCodeGenerator from '../components/QRCodeGenerator';
import MultipleChoiceGame from '../components/games/MultipleChoiceGame';
import TrueFalseGame from '../components/games/TrueFalseGame';
import SpinWheelGame from '../components/games/SpinWheelGame';
import GroupSortGame from '../components/games/GroupSortGame';
import AirplaneGame from '../components/games/AirplaneGame';
import AnagramGame from '../components/games/AnagramGame';
import CategorizeGame from '../components/games/CategorizeGame';
import ChatGame from '../components/games/ChatGame';

// Template types
const TEMPLATES = {
  MULTIPLE_CHOICE: 'multiple_choice',
  TRUE_FALSE: 'true_false',
  GROUP_SORT: 'group_sort',
  SPIN_WHEEL: 'spin_wheel',
  CATEGORIZE: 'categorize',
  AIRPLANE: 'airplane',
  ANAGRAM: 'anagram',
  CHAT_QUIZ: 'chat_quiz'
};

const TEMPLATE_INFO = {
  [TEMPLATES.MULTIPLE_CHOICE]: {
    name: 'Multiple Choice Quiz',
    icon: '📝',
    description: 'Classic quiz with multiple choice questions',
    color: '#667eea'
  },
  [TEMPLATES.TRUE_FALSE]: {
    name: 'True or False',
    icon: '✓✗',
    description: 'Simple true/false questions',
    color: '#10b981'
  },
  [TEMPLATES.GROUP_SORT]: {
    name: 'Group Sort',
    icon: '📊',
    description: 'Drag items into correct groups',
    color: '#f59e0b'
  },
  [TEMPLATES.SPIN_WHEEL]: {
    name: 'Spin the Wheel',
    icon: '🎡',
    description: 'Spin wheel to select random questions',
    color: '#8b5cf6'
  },
  [TEMPLATES.CATEGORIZE]: {
    name: 'Categorize',
    icon: '🗂️',
    description: 'Sort items into categories',
    color: '#06b6d4'
  },
  [TEMPLATES.AIRPLANE]: {
    name: 'Airplane Game',
    icon: '✈️',
    description: 'Fly through correct answers',
    color: '#ef4444'
  },
  [TEMPLATES.ANAGRAM]: {
    name: 'Anagram',
    icon: '🔤',
    description: 'Unscramble the letters',
    color: '#ec4899'
  },
  [TEMPLATES.CHAT_QUIZ]: {
    name: 'Chat Quiz',
    icon: <MessageSquare size={32} />,
    description: 'Quiz in a chat interface',
    color: '#25D366'
  }
};

export default function QuizBuilderPage() {
  const { t, lang } = useLang();
  const { user, isAdmin, isInstructor } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const quizId = searchParams.get('id');

  const [step, setStep] = useState('template'); // template, build, settings, preview
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    template: null,
    questions: [],
    visibility: 'private',
    allowAnonymous: false,
    settings: {
      timeLimit: 0, // 0 = no limit
      timePerQuestion: 0,
      randomizeOrder: false,
      showCorrectAnswers: true,
      allowRetake: true,
      passingScore: 0,
      showLeaderboard: true
    },
    assignment: {
      isAssignment: false,
      classId: null,
      deadline: null,
      notifyStudents: false
    }
  });

  const [draggedItem, setDraggedItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeQuestionId, setActiveQuestionId] = useState(null);

  useEffect(() => {
    if (quizId) {
      loadQuiz(quizId);
    }
  }, [quizId]);

  // Ensure an active question is always selected when questions exist
  useEffect(() => {
    if (!activeQuestionId && quizData.questions.length > 0) {
      setActiveQuestionId(quizData.questions[0].id);
    }
  }, [activeQuestionId, quizData.questions]);

  const loadQuiz = async (id) => {
    const { getQuiz } = await import('../firebase/quizzes');
    const result = await getQuiz(id);
    if (result.success) {
      setQuizData(result.data);
      setSelectedTemplate(result.data.template);
      setStep('build');
    }
  };

  const saveQuiz = async () => {
    if (!quizData.title.trim()) {
      alert('Please enter a quiz title');
      return;
    }
    if (quizData.questions.length === 0) {
      alert('Please add at least one question');
      return;
    }

    setSaving(true);
    try {
      const { createQuiz, updateQuiz } = await import('../firebase/quizzes');

      let targetQuizId = quizId;

      if (quizId) {
        const result = await updateQuiz(quizId, quizData);
        if (result.success) {
          alert('Quiz updated successfully!');
        } else {
          throw new Error(result.error);
        }
      } else {
        const result = await createQuiz(quizData, user.uid);
        if (result.success) {
          targetQuizId = result.id;
          alert('Quiz created successfully!');
          navigate(`/quiz-builder?id=${result.id}`);
        } else {
          throw new Error(result.error);
        }
      }

      // Sync to Activities
      if (targetQuizId) {
        const activityData = {
          title_en: quizData.title,
          title_ar: quizData.title,
          description_en: quizData.description || '',
          description_ar: quizData.description || '',
          type: 'quiz',
          level: 'beginner',
          internalQuizId: targetQuizId,
          updatedAt: serverTimestamp(),
          createdBy: user.uid,
          points: quizData.questions.reduce((acc, q) => acc + (q.points || 1), 0),
          allowRetake: quizData.settings.allowRetake,
          visibility: quizData.visibility
        };

        if (!quizId) {
          activityData.createdAt = serverTimestamp();
        }

        if (quizData.assignment?.isAssignment && quizData.assignment.classId) {
          activityData.classId = quizData.assignment.classId;
          activityData.deadline = quizData.assignment.deadline;
        }

        await setDoc(doc(db, 'activities', targetQuizId), activityData, { merge: true });
      }

    } catch (error) {
      console.error('Error saving quiz:', error);
      alert('Failed to save quiz: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const addQuestion = () => {
    const newQuestion = {
      id: Date.now().toString(),
      type: selectedTemplate,
      question: '',
      image: null,
      options: selectedTemplate === TEMPLATES.TRUE_FALSE
        ? [{ id: '1', text: 'True', correct: false }, { id: '2', text: 'False', correct: false }]
        : [{ id: '1', text: '', correct: false }],
      explanation: '',
      points: 1,
      timeLimit: 0
    };

    setQuizData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
    setActiveQuestionId(newQuestion.id);
  };

  const updateQuestion = (questionId, updates) => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.map(q =>
        q.id === questionId ? { ...q, ...updates } : q
      )
    }));
  };

  const deleteQuestion = (questionId) => {
    setQuizData(prev => {
      const remaining = prev.questions.filter(q => q.id !== questionId);

      if (remaining.length === 0) {
        setActiveQuestionId(null);
      } else if (activeQuestionId === questionId) {
        setActiveQuestionId(remaining[0].id);
      }

      return {
        ...prev,
        questions: remaining
      };
    });
  };

  const reorderQuestions = (fromIndex, toIndex) => {
    const newQuestions = [...quizData.questions];
    const [removed] = newQuestions.splice(fromIndex, 1);
    newQuestions.splice(toIndex, 0, removed);
    setQuizData(prev => ({ ...prev, questions: newQuestions }));
  };

  const addOption = (questionId) => {
    const question = quizData.questions.find(q => q.id === questionId);
    if (!question) return;

    const newOption = {
      id: Date.now().toString(),
      text: '',
      image: null,
      correct: false
    };

    updateQuestion(questionId, {
      options: [...question.options, newOption]
    });
  };

  const updateOption = (questionId, optionId, updates) => {
    const question = quizData.questions.find(q => q.id === questionId);
    if (!question) return;

    updateQuestion(questionId, {
      options: question.options.map(opt =>
        opt.id === optionId ? { ...opt, ...updates } : opt
      )
    });
  };

  const deleteOption = (questionId, optionId) => {
    const question = quizData.questions.find(q => q.id === questionId);
    if (!question) return;

    updateQuestion(questionId, {
      options: question.options.filter(opt => opt.id !== optionId)
    });
  };

  // Template Selection Step
  if (step === 'template') {
    return (
      <div className="min-h-screen bg-[#f3f4f6] text-gray-900 p-8 font-sans selection:bg-indigo-500/30">
        {/* Ambient Background Effects (Dark Mode Only) */}
        <div className="hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/20 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-10 pt-4">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-2 tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-purple-600 drop-shadow-sm">
                {t('create_new_game') || 'Create New Game'}
              </span>
            </h1>
            <p className="text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
              {t('choose_template') || 'Select a template to craft your next interactive masterpiece.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
            {Object.entries(TEMPLATE_INFO).map(([key, info], idx) => (
              <div
                key={key}
                onClick={() => {
                  setSelectedTemplate(key);
                  setQuizData(prev => ({ ...prev, template: key }));
                  setStep('build');
                }}
                className="group relative h-[230px] rounded-2xl cursor-pointer bg-white border border-gray-200 hover:border-indigo-400 transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
              >
                {/* Card Background */}
                <div className="absolute inset-0 rounded-2xl" />

                {/* Hover Glow (Dark Mode) */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl pointer-events-none"
                  style={{ background: `radial-gradient(circle at center, ${info.color}26 0%, transparent 70%)` }}
                />

                <div className="relative h-full p-6 flex flex-col items-center justify-center text-center z-10">
                  {/* Icon Container */}
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-sm transform group-hover:scale-110 group-hover:rotate-1 transition-all duration-200"
                    style={{
                      background: `linear-gradient(135deg, ${info.color}22, ${info.color}11)`,
                      border: `1px solid ${info.color}40`,
                      boxShadow: `0 4px 10px ${info.color}24`
                    }}
                  >
                    <span className="drop-shadow-sm">{info.icon}</span>
                  </div>

                  <h3 className="text-lg font-semibold mb-1 text-gray-900 group-hover:text-indigo-700 transition-colors duration-200">
                    {info.name}
                  </h3>

                  <p className="text-gray-500 text-sm leading-relaxed group-hover:text-gray-700 transition-colors px-2">
                    {info.description}
                  </p>

                  {/* Action Indicator */}
                  <div className="absolute bottom-4 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                    <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: info.color }}>
                      Start Building
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Build Step
  if (step === 'build') {
    return (
      <div className="min-h-screen bg-[#f3f4f6] text-gray-900 flex flex-col" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        {/* Top Toolbar */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-50 px-6 py-3 shadow-sm">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 w-full">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm"
                style={{
                  backgroundColor: `${TEMPLATE_INFO[selectedTemplate]?.color}20`,
                  color: TEMPLATE_INFO[selectedTemplate]?.color,
                  border: `1px solid ${TEMPLATE_INFO[selectedTemplate]?.color}40`
                }}
              >
                {TEMPLATE_INFO[selectedTemplate]?.icon}
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  placeholder={t('quiz_title') || "Untitled Quiz"}
                  value={quizData.title}
                  onChange={(e) => setQuizData(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-transparent border-none text-xl font-bold text-gray-900 placeholder-gray-400 focus:ring-0 w-full p-0"
                />
                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mt-0.5">
                  <span className="uppercase tracking-wider">{TEMPLATE_INFO[selectedTemplate]?.name}</span>
                  <span>•</span>
                  <span>{quizData.questions.length} Questions</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setStep('template')}
                className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors"
              >
                Templates
              </button>
              <div className="h-6 w-px bg-gray-200 dark:bg-white/10 mx-2" />
              <button
                onClick={() => setStep('settings')}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
                title={t('settings')}
              >
                <Settings size={20} />
              </button>
              <button
                onClick={() => setStep('preview')}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
                title={t('preview')}
              >
                <Eye size={20} />
              </button>
              <button
                onClick={saveQuiz}
                disabled={saving}
                className="ml-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-md shadow-indigo-500/20 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Save</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Builder Canvas */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#f3f4f6]">
          <div className="max-w-5xl mx-auto">
            {/* Empty state when no questions exist */}
            {quizData.questions.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-dashed border-gray-300 p-10 text-center">
                <p className="text-gray-600 mb-4 text-base">
                  {t('no_questions_yet') || 'No questions yet. Start by adding your first question.'}
                </p>
                <button
                  onClick={addQuestion}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0066ff] text-white font-semibold text-sm shadow-md hover:bg-[#0052cc] transition-colors"
                >
                  <Plus size={18} />
                  {t('add_first_question') || 'Add first question'}
                </button>
              </div>
            ) : (
              <div className="flex gap-6 items-start">
                {/* Sidebar question list */}
                <aside className="w-64 bg-[#f7f8fc] rounded-2xl border border-[#e2e4ee] p-3">
                  <div className="mb-2 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {t('questions') || 'Questions'}
                  </div>
                  <div className="space-y-2">
                    {quizData.questions.map((q, idx) => {
                      const isActive = (q.id === activeQuestionId) || (!activeQuestionId && idx === 0);
                      const label = q.question?.trim() || `${t('question') || 'Question'} ${idx + 1}`;
                      return (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => setActiveQuestionId(q.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg border text-sm flex items-center gap-3 transition-colors ${isActive
                            ? 'bg-white border-[#0066ff] text-gray-900 shadow-sm'
                            : 'bg-transparent border-transparent text-gray-600 hover:bg-white hover:border-gray-200'
                            }`}
                        >
                          <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold border ${isActive ? 'bg-[#0066ff] text-white border-[#0066ff]' : 'bg-white text-gray-600 border-gray-300'}`}>
                            {idx + 1}
                          </span>
                          <span className="flex-1 truncate">{label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={addQuestion}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-300 text-xs font-medium text-gray-600 hover:border-[#0066ff] hover:text-[#0066ff] hover:bg-white transition-colors"
                  >
                    <Plus size={14} />
                    {t('add_question') || 'Add question'}
                  </button>
                </aside>

                {/* Main editor for active question */}
                <section className="flex-1 flex flex-col gap-4">
                  {(() => {
                    const activeIndex = quizData.questions.findIndex(q => q.id === activeQuestionId);
                    const safeIndex = activeIndex >= 0 ? activeIndex : 0;
                    const activeQuestion = quizData.questions[safeIndex];

                    if (!activeQuestion) return null;

                    return (
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <QuestionCard
                          question={activeQuestion}
                          index={safeIndex}
                          template={selectedTemplate}
                          onUpdate={(updates) => updateQuestion(activeQuestion.id, updates)}
                          onDelete={() => deleteQuestion(activeQuestion.id)}
                          onAddOption={() => addOption(activeQuestion.id)}
                          onUpdateOption={(optionId, updates) => updateOption(activeQuestion.id, optionId, updates)}
                          onDeleteOption={(optionId) => deleteOption(activeQuestion.id, optionId)}
                        />
                      </div>
                    );
                  })()}

                  {/* Add Question Button below editor */}
                  <div className="pt-2">
                    <button
                      onClick={addQuestion}
                      type="button"
                      className="group w-full rounded-2xl border border-dashed border-gray-300 hover:border-[#0066ff] hover:bg-white transition-all duration-150 flex items-center justify-center gap-2 py-3 bg-transparent"
                    >
                      <div className="w-7 h-7 rounded-full border border-[#0066ff] text-[#0066ff] flex items-center justify-center text-sm font-semibold">
                        <Plus size={18} />
                      </div>
                      <span className="text-gray-600 group-hover:text-[#0066ff] font-medium text-xs">
                        {t('add_question') || 'Add question'}
                      </span>
                    </button>
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Settings Step
  if (step === 'settings') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f1115] text-gray-900 dark:text-white p-6 transition-colors duration-300" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex items-center gap-4">
            <button
              onClick={() => setStep('build')}
              className="px-4 py-2 bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 rounded-xl transition-colors font-medium text-sm flex items-center gap-2 shadow-sm border border-gray-200 dark:border-transparent"
            >
              ← {t('back_to_builder') || 'Back to Builder'}
            </button>
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-white dark:to-gray-400">
              {t('quiz_settings') || 'Game Configuration'}
            </h2>
          </div>

          <div className="grid gap-6">
            {/* Access & Visibility */}
            <div className="p-8 bg-white dark:bg-[#1a1d24]/60 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-white/5 shadow-lg dark:shadow-2xl">
              <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"><Eye size={20} /></div>
                {t('access_visibility') || 'Access & Visibility'}
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-3 text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('visibility') || 'Who can play?'}</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { key: 'private', label: t('private') || 'Private', icon: '🔒' },
                      { key: 'class', label: t('class') || 'Class Only', icon: 'school' },
                      { key: 'public', label: t('public') || 'Public', icon: '🌍' }
                    ].map(opt => (
                      <label
                        key={opt.key}
                        className={`relative flex flex-col items-center justify-center gap-3 p-4 rounded-2xl cursor-pointer transition-all duration-300 border-2 ${quizData.visibility === opt.key
                          ? 'bg-indigo-50 dark:bg-indigo-600/10 border-indigo-500 shadow-md'
                          : 'bg-gray-50 dark:bg-white/5 border-transparent hover:bg-gray-100 dark:hover:bg-white/10'
                          }`}
                      >
                        <input
                          type="radio"
                          name="visibility"
                          checked={quizData.visibility === opt.key}
                          onChange={() => setQuizData(prev => ({ ...prev, visibility: opt.key }))}
                          className="hidden"
                        />
                        <span className="text-2xl">{opt.icon === 'school' ? <span className="material-icons text-2xl">school</span> : opt.icon}</span>
                        <span className={`font-bold ${quizData.visibility === opt.key ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          {opt.label}
                        </span>
                        {quizData.visibility === opt.key && (
                          <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-indigo-500" />
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={!!quizData.allowAnonymous}
                      onChange={(e) => setQuizData(prev => ({ ...prev, allowAnonymous: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </div>
                  <span className="text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors font-medium">
                    {t('allow_anonymous') || 'Allow anonymous players (Public mode only)'}
                  </span>
                </label>
              </div>
            </div>

            {/* Time Settings */}
            <div className="p-8 bg-white dark:bg-[#1a1d24]/60 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-white/5 shadow-lg dark:shadow-2xl">
              <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400"><Clock size={20} /></div>
                {t('time_settings') || 'Time Controls'}
              </h3>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('total_time_limit') || 'Total Time Limit (minutes)'}</label>
                  <input
                    type="number"
                    min="0"
                    value={quizData.settings.timeLimit}
                    onChange={(e) => setQuizData(prev => ({
                      ...prev,
                      settings: { ...prev.settings, timeLimit: parseInt(e.target.value) || 0 }
                    }))}
                    className="w-full bg-white dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all font-mono text-lg"
                  />
                  <p className="text-xs text-gray-400 mt-2">Set to 0 for no limit</p>
                </div>
                <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('time_per_question') || 'Time Per Question (seconds)'}</label>
                  <input
                    type="number"
                    min="0"
                    value={quizData.settings.timePerQuestion}
                    onChange={(e) => setQuizData(prev => ({
                      ...prev,
                      settings: { ...prev.settings, timePerQuestion: parseInt(e.target.value) || 0 }
                    }))}
                    className="w-full bg-white dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all font-mono text-lg"
                  />
                  <p className="text-xs text-gray-400 mt-2">Set to 0 for no limit</p>
                </div>
              </div>
            </div>

            {/* Quiz Behavior */}
            <div className="p-8 bg-white dark:bg-[#1a1d24]/60 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-white/5 shadow-lg dark:shadow-2xl">
              <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400"><Settings size={20} /></div>
                {t('quiz_behavior') || 'Game Mechanics'}
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { key: 'randomizeOrder', label: t('randomize_order') || 'Randomize Questions' },
                  { key: 'showCorrectAnswers', label: t('show_correct_answers') || 'Reveal Answers' },
                  { key: 'allowRetake', label: t('allow_retakes') || 'Allow Retakes' },
                  { key: 'showLeaderboard', label: t('show_leaderboard') || 'Show Leaderboard' }
                ].map(item => (
                  <label key={item.key} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-all cursor-pointer group">
                    <span className="text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white font-medium">{item.label}</span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={quizData.settings[item.key]}
                        onChange={(e) => setQuizData(prev => ({
                          ...prev,
                          settings: { ...prev.settings, [item.key]: e.target.checked }
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Assignment Settings */}
            <div className="p-8 bg-white dark:bg-[#1a1d24]/60 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-white/5 shadow-lg dark:shadow-2xl">
              <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-3">
                <div className="p-2 rounded-lg bg-pink-500/10 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400"><Calendar size={20} /></div>
                {t('assignment_settings') || 'Assignment Mode'}
              </h3>

              <div className="space-y-6">
                <label className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={quizData.assignment.isAssignment}
                      onChange={(e) => setQuizData(prev => ({
                        ...prev,
                        assignment: { ...prev.assignment, isAssignment: e.target.checked }
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
                  </div>
                  <span className="text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors font-medium">
                    {t('set_as_assignment') || 'Enable Assignment Mode'}
                  </span>
                </label>

                {quizData.assignment.isAssignment && (
                  <div className="pl-4 border-l-2 border-pink-500/30 space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                    <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('deadline') || 'Submission Deadline'}</label>
                      <input
                        type="datetime-local"
                        value={quizData.assignment.deadline || ''}
                        onChange={(e) => setQuizData(prev => ({
                          ...prev,
                          assignment: { ...prev.assignment, deadline: e.target.value }
                        }))}
                        className="w-full bg-white dark:bg-[#0f1115] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                      />
                    </div>

                    <label className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={quizData.assignment.notifyStudents}
                        onChange={(e) => setQuizData(prev => ({
                          ...prev,
                          assignment: { ...prev.assignment, notifyStudents: e.target.checked }
                        }))}
                        className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-pink-500 focus:ring-pink-500"
                      />
                      <span className="text-gray-600 dark:text-gray-300">{t('send_notification') || 'Notify students via email'}</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          {quizId && (
            <div className="mt-8 p-8 bg-white rounded-3xl shadow-2xl text-center">
              <QRCodeGenerator
                url={`${window.location.origin}/quiz/${quizId}`}
                title={quizData.title || 'Quiz'}
              />
            </div>
          )}

          <div className="mt-12 flex gap-6">
            <button
              onClick={saveQuiz}
              disabled={saving}
              className="flex-1 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-900/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('saving') || 'Saving...'}
                </>
              ) : (
                <>
                  <Save size={20} />
                  {t('save_publish') || 'Save & Publish Game'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Preview Step - Show actual game
  if (step === 'preview') {
    const qList = Array.isArray(quizData?.questions) ? quizData.questions : [];
    // Guard: no questions -> show info and return
    if (qList.length === 0) {
      return (
        <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center p-10 bg-white rounded-3xl border border-gray-200 shadow-xl">
            <div className="text-6xl mb-6">🤔</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('nothing_to_preview') || 'Empty Canvas'}</h2>
            <p className="text-gray-500 mb-6 text-base">{t('add_questions_first') || 'Add at least one question to preview your game.'}</p>
            <button
              onClick={() => setStep('build')}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-md"
            >
              {t('back_to_builder') || 'Start Building'}
            </button>
          </div>
        </div>
      );
    }

    const renderPreviewGame = () => {
      const gameProps = {
        questions: qList,
        settings: quizData.settings,
        onComplete: (results) => {
          alert('Preview completed! Score: ' + results.score);
          setStep('build');
        }
      };

      switch (selectedTemplate) {
        case TEMPLATES.MULTIPLE_CHOICE:
          return <MultipleChoiceGame {...gameProps} />;
        case TEMPLATES.TRUE_FALSE:
          const tfQuestions = qList.map(q => ({
            ...q,
            correctAnswer: q.options?.find(opt => opt.correct)?.text === 'True'
          }));
          return <TrueFalseGame {...gameProps} questions={tfQuestions} />;
        case TEMPLATES.SPIN_WHEEL:
          return <SpinWheelGame {...gameProps} />;
        case TEMPLATES.GROUP_SORT:
          const groups = [
            { name: 'True', items: [], color: '#10b981' },
            { name: 'False', items: [], color: '#ef4444' }
          ];
          qList.forEach(q => {
            const correctOption = q.options?.find(opt => opt.correct);
            if (correctOption?.text === 'True') {
              groups[0].items.push(q.question);
            } else {
              groups[1].items.push(q.question);
            }
          });
          return <GroupSortGame data={{ groups }} settings={gameProps.settings} onComplete={gameProps.onComplete} />;
        case TEMPLATES.AIRPLANE:
          return <AirplaneGame {...gameProps} />;
        case TEMPLATES.ANAGRAM:
          const anagramQuestions = qList.map(q => ({
            ...q,
            hint: q.question,
            answer: q.options?.find(opt => opt.correct)?.text || ''
          }));
          return <AnagramGame {...gameProps} questions={anagramQuestions} />;
        case TEMPLATES.CATEGORIZE:
          const categories = [
            { name: 'Yes', items: [], color: '#10b981' },
            { name: 'No', items: [], color: '#ef4444' },
            { name: 'Maybe', items: [], color: '#f59e0b' }
          ];
          return <CategorizeGame data={{ categories }} settings={gameProps.settings} onComplete={gameProps.onComplete} />;
        case TEMPLATES.CHAT_QUIZ:
          return <ChatGame {...gameProps} />;
        default:
          return <div className="text-gray-500 dark:text-white text-center p-10">Template not supported</div>;
      }
    };

    return (
      <div className="min-h-screen bg-[#f3f4f6] flex flex-col" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        {/* Preview Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setStep('build')}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-sm flex items-center gap-2"
            >
              ← {t('exit_preview') || 'Exit Preview'}
            </button>
            <div className="px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-full text-yellow-700 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
              Preview Mode
            </div>
          </div>
          <div className="text-gray-500 text-sm">
            Playing as <span className="text-gray-900 font-bold">Student</span>
          </div>
        </div>

        {/* Game Stage */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-lg border border-gray-200 p-4 md:p-8">
            {renderPreviewGame()}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// Question Card Component - Modern Design
function QuestionCard({ question, index, template, onUpdate, onDelete, onAddOption, onUpdateOption, onDeleteOption }) {
  const [showImagePicker, setShowImagePicker] = useState(false);
  const { t } = useLang();

  return (
    <div className="group relative bg-white rounded-2xl border border-gray-200 hover:border-indigo-400 transition-all duration-200 shadow-sm overflow-hidden">
      {/* Question Header */}
      <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-bold text-sm">
            {index + 1}
          </div>
          <span className="text-sm font-medium text-gray-500">
            {template === TEMPLATES.MULTIPLE_CHOICE ? 'Multiple Choice' :
              template === TEMPLATES.TRUE_FALSE ? 'True/False' : 'Question'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
            <input
              type="number"
              min="1"
              value={question.points}
              onChange={(e) => onUpdate({ points: parseInt(e.target.value) || 1 })}
              className="w-12 bg-transparent text-center font-semibold text-gray-900 focus:outline-none"
            />
            <span className="text-xs font-medium text-gray-500">{t('points') || 'pts'}</span>
          </div>

          <button
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            title={t('delete_question') || "Delete"}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Question Input */}
      <div className="p-6 pt-4">
        <textarea
          placeholder={t('enter_question') || "Type your question here..."}
          value={question.question}
          onChange={(e) => onUpdate({ question: e.target.value })}
          className="w-full p-0 text-lg font-medium text-gray-900 placeholder-gray-400 bg-transparent border-none focus:outline-none focus:ring-0 resize-none min-h-[60px]"
          rows={2}
        />

        {/* Question Image */}
        {question.image && (
          <div className="mt-4 relative inline-block group/image">
            <img src={question.image} alt="Question" className="max-w-sm max-h-48 rounded-lg border border-gray-200" />
            <button
              onClick={() => onUpdate({ image: null })}
              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover/image:opacity-100 transition-opacity shadow-lg"
              title="Remove Image"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}

        {/* Image Picker */}
        {showImagePicker && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <input
              type="text"
              placeholder="Paste image URL..."
              className="w-full p-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onUpdate({ image: e.currentTarget.value });
                  setShowImagePicker(false);
                }
              }}
            />
            <p className="text-xs text-gray-500 mt-2">Press Enter to add</p>
          </div>
        )}
      </div>

      {/* Options */}
      <div className="px-6 pb-6 space-y-3">
        {question.options.map((option, optIndex) => (
          <div key={option.id} className="flex items-center gap-3 group/option">
            <button
              onClick={() => {
                if (template === TEMPLATES.MULTIPLE_CHOICE) {
                  const newOptions = question.options.map(o => ({
                    ...o,
                    correct: o.id === option.id
                  }));
                  onUpdate({ options: newOptions });
                } else {
                  onUpdateOption(option.id, { correct: !option.correct });
                }
              }}
              className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${option.correct
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'border-gray-300 hover:border-green-500'
                }`}
            >
              {option.correct && <Check size={14} strokeWidth={3} />}
            </button>

            <input
              type="text"
              value={option.text}
              onChange={(e) => onUpdateOption(option.id, { text: e.target.value })}
              placeholder={`Option ${optIndex + 1}`}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all outline-none ${option.correct
                  ? 'bg-green-50 border-green-200 text-green-900 placeholder-green-600/50'
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-indigo-400'
                }`}
            />

            <button
              onClick={() => onDeleteOption(option.id)}
              className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover/option:opacity-100"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}

        {/* Add Option / Image Buttons */}
        <div className="flex items-center gap-2 pt-2">
          {template !== TEMPLATES.TRUE_FALSE && (
            <button
              onClick={onAddOption}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
            >
              <Plus size={16} />
              {t('add_option') || 'Add option'}
            </button>
          )}

          {!question.image && (
            <button
              onClick={() => setShowImagePicker(!showImagePicker)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ImageIcon size={16} />
              {t('add_image') || 'Add image'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
