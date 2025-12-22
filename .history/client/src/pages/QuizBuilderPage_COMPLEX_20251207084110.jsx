import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLang } from '../contexts/LangContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Plus, Save, Eye, Share2, Settings, Image as ImageIcon, 
  Clock, Trash2, GripVertical, Copy, Download, QrCode as QrCodeIcon,
  Play, Trophy, BarChart3, Users, Calendar
} from 'lucide-react';
import QRCodeGenerator from '../components/QRCodeGenerator';
import MultipleChoiceGame from '../components/games/MultipleChoiceGame';
import TrueFalseGame from '../components/games/TrueFalseGame';
import SpinWheelGame from '../components/games/SpinWheelGame';
import GroupSortGame from '../components/games/GroupSortGame';
import AirplaneGame from '../components/games/AirplaneGame';
import AnagramGame from '../components/games/AnagramGame';
import CategorizeGame from '../components/games/CategorizeGame';

// Template types
const TEMPLATES = {
  MULTIPLE_CHOICE: 'multiple_choice',
  TRUE_FALSE: 'true_false',
  GROUP_SORT: 'group_sort',
  SPIN_WHEEL: 'spin_wheel',
  CATEGORIZE: 'categorize',
  AIRPLANE: 'airplane',
  ANAGRAM: 'anagram'
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
  }
};

export default function QuizBuilderPage() {
  const { t } = useLang();
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

  useEffect(() => {
    if (quizId) {
      loadQuiz(quizId);
    }
  }, [quizId]);

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
          alert('Quiz created successfully!');
          navigate(`/quiz-builder?id=${result.id}`);
        } else {
          throw new Error(result.error);
        }
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
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
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
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>
        {/* <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: '0.5rem' }}>
          Create New Quiz/Game
        </h1>
        <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>
          Choose a template to get started
        </p> */}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {Object.entries(TEMPLATE_INFO).map(([key, info]) => (
            <div
              key={key}
              onClick={() => {
                setSelectedTemplate(key);
                setQuizData(prev => ({ ...prev, template: key }));
                setStep('build');
              }}
              style={{
                padding: '2rem',
                border: '2px solid var(--border)',
                borderRadius: 16,
                background: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = info.color;
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: 48, marginBottom: '1rem' }}>{info.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: '0.5rem', color: info.color }}>
                {info.name}
              </h3>
              <p style={{ fontSize: 14, color: 'var(--muted)' }}>{info.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Build Step
  if (step === 'build') {
    return (
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '1.5rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', padding: '1rem', background: 'white', borderRadius: 12, border: '1px solid var(--border)' }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              placeholder="Quiz Title"
              value={quizData.title}
              onChange={(e) => setQuizData(prev => ({ ...prev, title: e.target.value }))}
              style={{ fontSize: 24, fontWeight: 700, border: 'none', outline: 'none', width: '100%' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: '0.5rem' }}>
              <span style={{ 
                padding: '4px 12px', 
                background: TEMPLATE_INFO[selectedTemplate]?.color + '20',
                color: TEMPLATE_INFO[selectedTemplate]?.color,
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 600
              }}>
                {TEMPLATE_INFO[selectedTemplate]?.icon} {TEMPLATE_INFO[selectedTemplate]?.name}
              </span>
              <span style={{ fontSize: 14, color: 'var(--muted)' }}>
                {quizData.questions.length} questions
              </span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setStep('template')}
              style={{ padding: '0.75rem 1.5rem', background: '#f3f4f6', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
            >
              Change Template
            </button>
            <button
              onClick={() => setStep('settings')}
              style={{ padding: '0.75rem 1.5rem', background: '#f3f4f6', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Settings size={18} />
              Settings
            </button>
            <button
              onClick={() => setStep('preview')}
              style={{ padding: '0.75rem 1.5rem', background: '#667eea', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Eye size={18} />
              Preview
            </button>
            <button
              onClick={saveQuiz}
              disabled={saving}
              style={{ padding: '0.75rem 1.5rem', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Questions List */}
        <div style={{ display: 'grid', gap: 16 }}>
          {quizData.questions.map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              index={index}
              template={selectedTemplate}
              onUpdate={(updates) => updateQuestion(question.id, updates)}
              onDelete={() => deleteQuestion(question.id)}
              onAddOption={() => addOption(question.id)}
              onUpdateOption={(optionId, updates) => updateOption(question.id, optionId, updates)}
              onDeleteOption={(optionId) => deleteOption(question.id, optionId)}
            />
          ))}

          {/* Add Question Button */}
          <button
            onClick={addQuestion}
            style={{
              padding: '2rem',
              border: '2px dashed var(--border)',
              borderRadius: 12,
              background: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontSize: 16,
              fontWeight: 600,
              color: '#667eea'
            }}
          >
            <Plus size={20} />
            Add Question
          </button>
        </div>
      </div>
    );
  }

  // Settings Step
  if (step === 'settings') {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={() => setStep('build')}
            style={{ padding: '0.5rem 1rem', background: '#f3f4f6', border: 'none', borderRadius: 8, cursor: 'pointer' }}
          >
            ← Back to Builder
          </button>
        </div>

        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: '1.5rem' }}>Quiz Settings</h2>

        <div style={{ display: 'grid', gap: 24 }}>
          {/* Access & Visibility */}
          <div style={{ padding: '1.5rem', background: 'white', borderRadius: 12, border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: '1rem' }}>Access & Visibility</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Visibility</label>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {[
                    { key: 'private', label: 'Private' },
                    { key: 'class', label: 'Class' },
                    { key: 'public', label: 'Public' }
                  ].map(opt => (
                    <label key={opt.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: 8, background: quizData.visibility === opt.key ? 'rgba(102,126,234,0.12)' : 'transparent' }}>
                      <input
                        type="radio"
                        name="visibility"
                        checked={quizData.visibility === opt.key}
                        onChange={() => setQuizData(prev => ({ ...prev, visibility: opt.key }))}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={!!quizData.allowAnonymous}
                  onChange={(e) => setQuizData(prev => ({ ...prev, allowAnonymous: e.target.checked }))}
                />
                <span>Allow anonymous play (only applies when Public)</span>
              </label>
            </div>
          </div>

          {/* Time Settings */}
          <div style={{ padding: '1.5rem', background: 'white', borderRadius: 12, border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={20} />
              Time Settings
            </h3>
            <div style={{ display: 'grid', gap: 12 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>Total Time Limit (minutes, 0 = no limit)</span>
                <input
                  type="number"
                  min="0"
                  value={quizData.settings.timeLimit}
                  onChange={(e) => setQuizData(prev => ({
                    ...prev,
                    settings: { ...prev.settings, timeLimit: parseInt(e.target.value) || 0 }
                  }))}
                  style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 8 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>Time Per Question (seconds, 0 = no limit)</span>
                <input
                  type="number"
                  min="0"
                  value={quizData.settings.timePerQuestion}
                  onChange={(e) => setQuizData(prev => ({
                    ...prev,
                    settings: { ...prev.settings, timePerQuestion: parseInt(e.target.value) || 0 }
                  }))}
                  style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 8 }}
                />
              </label>
            </div>
          </div>

          {/* Quiz Behavior */}
          <div style={{ padding: '1.5rem', background: 'white', borderRadius: 12, border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: '1rem' }}>Quiz Behavior</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={quizData.settings.randomizeOrder}
                  onChange={(e) => setQuizData(prev => ({
                    ...prev,
                    settings: { ...prev.settings, randomizeOrder: e.target.checked }
                  }))}
                />
                <span>Randomize question order</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={quizData.settings.showCorrectAnswers}
                  onChange={(e) => setQuizData(prev => ({
                    ...prev,
                    settings: { ...prev.settings, showCorrectAnswers: e.target.checked }
                  }))}
                />
                <span>Show correct answers after submission</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={quizData.settings.allowRetake}
                  onChange={(e) => setQuizData(prev => ({
                    ...prev,
                    settings: { ...prev.settings, allowRetake: e.target.checked }
                  }))}
                />
                <span>Allow retakes</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={quizData.settings.showLeaderboard}
                  onChange={(e) => setQuizData(prev => ({
                    ...prev,
                    settings: { ...prev.settings, showLeaderboard: e.target.checked }
                  }))}
                />
                <span>Show leaderboard</span>
              </label>
            </div>
          </div>

          {/* Assignment Settings */}
          <div style={{ padding: '1.5rem', background: 'white', borderRadius: 12, border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={20} />
              Assignment Settings
            </h3>
            <div style={{ display: 'grid', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={quizData.assignment.isAssignment}
                  onChange={(e) => setQuizData(prev => ({
                    ...prev,
                    assignment: { ...prev.assignment, isAssignment: e.target.checked }
                  }))}
                />
                <span>Set as assignment</span>
              </label>
              
              {quizData.assignment.isAssignment && (
                <>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>Deadline</span>
                    <input
                      type="datetime-local"
                      value={quizData.assignment.deadline || ''}
                      onChange={(e) => setQuizData(prev => ({
                        ...prev,
                        assignment: { ...prev.assignment, deadline: e.target.value }
                      }))}
                      style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 8 }}
                    />
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={quizData.assignment.notifyStudents}
                      onChange={(e) => setQuizData(prev => ({
                        ...prev,
                        assignment: { ...prev.assignment, notifyStudents: e.target.checked }
                      }))}
                    />
                    <span>Send notification to students</span>
                  </label>
                </>
              )}
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        {quizId && (
          <div style={{ marginTop: '2rem' }}>
            <QRCodeGenerator
              url={`${window.location.origin}/quiz/${quizId}`}
              title={quizData.title || 'Quiz'}
            />
          </div>
        )}

        <div style={{ marginTop: '2rem', display: 'flex', gap: 12 }}>
          <button
            onClick={() => setStep('build')}
            style={{ flex: 1, padding: '1rem', background: '#f3f4f6', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
          >
            Back to Builder
          </button>
          <button
            onClick={saveQuiz}
            disabled={saving}
            style={{ flex: 1, padding: '1rem', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
          >
            {saving ? 'Saving...' : 'Save & Publish'}
          </button>
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
        <div style={{ maxWidth: 720, margin: '2rem auto', textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 12 }}>🤔</div>
          <h2 style={{ margin: 0, fontWeight: 800 }}>Nothing to preview</h2>
          <p style={{ color: '#6b7280' }}>Add at least one question before previewing.</p>
          <button
            onClick={() => setStep('build')}
            style={{ marginTop: 12, padding: '0.6rem 1rem', borderRadius: 8, border: '1px solid #ddd', cursor: 'pointer' }}
          >Back to Builder</button>
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
        default:
          return <div>Template not supported</div>;
      }
    };

    return (
      <div>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '1rem 2rem 0' }}>
          <button
            onClick={() => setStep('build')}
            style={{ padding: '0.75rem 1.5rem', background: '#f3f4f6', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, marginBottom: '1rem' }}
          >
            ← Back to Builder
          </button>
          <div style={{ padding: '1rem', background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8, marginBottom: '1rem', textAlign: 'center' }}>
            <strong>Preview Mode</strong> - This is a fully functional preview of your quiz
          </div>
        </div>
        {renderPreviewGame()}
      </div>
    );
  }

  return null;
}

// Question Card Component
function QuestionCard({ question, index, template, onUpdate, onDelete, onAddOption, onUpdateOption, onDeleteOption }) {
  const [showImagePicker, setShowImagePicker] = useState(false);

  return (
    <div style={{ padding: '1.5rem', background: 'white', borderRadius: 12, border: '1px solid var(--border)' }}>
      {/* Question Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: '1rem' }}>
        <div style={{ cursor: 'grab', color: 'var(--muted)' }}>
          <GripVertical size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.5rem' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--muted)' }}>Question {index + 1}</span>
            <input
              type="number"
              min="1"
              value={question.points}
              onChange={(e) => onUpdate({ points: parseInt(e.target.value) || 1 })}
              style={{ width: 60, padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 12 }}
              placeholder="Points"
            />
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>points</span>
          </div>
          <textarea
            placeholder="Enter your question here..."
            value={question.question}
            onChange={(e) => onUpdate({ question: e.target.value })}
            style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 8, fontSize: 16, minHeight: 80, resize: 'vertical' }}
          />
        </div>
        <button
          onClick={onDelete}
          style={{ padding: '0.5rem', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, cursor: 'pointer' }}
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Question Image */}
      {question.image && (
        <div style={{ marginBottom: '1rem' }}>
          <img src={question.image} alt="Question" style={{ maxWidth: 200, borderRadius: 8 }} />
          <button
            onClick={() => onUpdate({ image: null })}
            style={{ marginLeft: 8, padding: '4px 8px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}
          >
            Remove
          </button>
        </div>
      )}

      {/* Add Image Button */}
      {!question.image && (
        <button
          onClick={() => {
            const url = prompt('Enter image URL:');
            if (url) onUpdate({ image: url });
          }}
          style={{ marginBottom: '1rem', padding: '0.5rem 1rem', background: '#f3f4f6', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}
        >
          <ImageIcon size={16} />
          Add Image
        </button>
      )}

      {/* Options */}
      <div style={{ display: 'grid', gap: 8 }}>
        {question.options.map((option, optIndex) => (
          <div key={option.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type={template === TEMPLATES.MULTIPLE_CHOICE ? 'radio' : 'checkbox'}
              checked={option.correct}
              onChange={(e) => {
                if (template === TEMPLATES.MULTIPLE_CHOICE) {
                  // Only one correct answer
                  question.options.forEach(opt => {
                    onUpdateOption(opt.id, { correct: opt.id === option.id });
                  });
                } else {
                  onUpdateOption(option.id, { correct: e.target.checked });
                }
              }}
              style={{ width: 20, height: 20 }}
            />
            <input
              type="text"
              placeholder={`Option ${optIndex + 1}`}
              value={option.text}
              onChange={(e) => onUpdateOption(option.id, { text: e.target.value })}
              style={{ flex: 1, padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 6 }}
            />
            {option.image && (
              <img src={option.image} alt="Option" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
            )}
            <button
              onClick={() => {
                const url = prompt('Enter image URL for this option:');
                if (url) onUpdateOption(option.id, { image: url });
              }}
              style={{ padding: '0.5rem', background: '#f3f4f6', border: 'none', borderRadius: 4, cursor: 'pointer' }}
            >
              <ImageIcon size={16} />
            </button>
            {question.options.length > 2 && (
              <button
                onClick={() => onDeleteOption(option.id)}
                style={{ padding: '0.5rem', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 4, cursor: 'pointer' }}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add Option Button */}
      {template !== TEMPLATES.TRUE_FALSE && (
        <button
          onClick={onAddOption}
          style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', background: '#f3f4f6', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Plus size={16} />
          Add Option
        </button>
      )}
    </div>
  );
}
