import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLang } from '../contexts/LangContext';
import { useAuth } from '../contexts/AuthContext';
import {
  Plus, Save, Eye, Trash2, GripVertical, Clock, Copy, Play,
  CheckCircle, XCircle, HelpCircle, ListChecks
} from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Container, Button, Card, CardBody, Input, Select, Spinner } from '../components/ui';
import styles from './QuizBuilderPage.module.css';

// Simplified question types
const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'multiple_choice',
  SINGLE_CHOICE: 'single_choice',
  TRUE_FALSE: 'true_false'
};

const QUESTION_TYPE_INFO = {
  [QUESTION_TYPES.MULTIPLE_CHOICE]: {
    name: 'Multiple Choice',
    icon: <ListChecks size={20} />,
    description: 'Select one or more correct answers',
    color: '#800020'
  },
  [QUESTION_TYPES.SINGLE_CHOICE]: {
    name: 'Single Choice',
    icon: <CheckCircle size={20} />,
    description: 'Select exactly one correct answer',
    color: '#10b981'
  },
  [QUESTION_TYPES.TRUE_FALSE]: {
    name: 'True/False',
    icon: <HelpCircle size={20} />,
    description: 'Simple true or false question',
    color: '#f59e0b'
  }
};

export default function QuizBuilderPage() {
  const { t, lang } = useLang();
  const { user, isAdmin, isInstructor } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const quizId = searchParams.get('id');

  const [step, setStep] = useState('setup'); // setup, build, preview
  const [selectedType, setSelectedType] = useState(QUESTION_TYPES.MULTIPLE_CHOICE);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    type: QUESTION_TYPES.MULTIPLE_CHOICE,
    difficulty: 'beginner',
    estimatedTime: 10, // minutes
    questions: [],
    settings: {
      timeLimit: 0,
      allowRetake: true,
      showCorrectAnswers: true,
      randomizeOrder: false,
      passingScore: 70
    }
  });

  useEffect(() => {
    if (quizId) {
      loadQuiz(quizId);
    }
  }, [quizId]);

  const loadQuiz = async (id) => {
    setLoading(true);
    try {
      const { getQuiz } = await import('../firebase/quizzes');
      const result = await getQuiz(id);
      if (result.success) {
        setQuizData(result.data);
        setStep('build');
      }
    } catch (error) {
      console.error('Error loading quiz:', error);
    } finally {
      setLoading(false);
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
      type: selectedType,
      question: '',
      image: null,
      options: getDefaultOptions(selectedType),
      explanation: '',
      points: 1,
      timeLimit: 0
    };

    setQuizData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
    setActiveQuestionIndex(quizData.questions.length);
  };

  const getDefaultOptions = (type) => {
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
        return [
          { id: '1', text: '', correct: false },
          { id: '2', text: '', correct: false },
          { id: '3', text: '', correct: false },
          { id: '4', text: '', correct: false }
        ];
      default:
        return [{ id: '1', text: '', correct: false }];
    }
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
      id: Date.now().toString(),
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

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <Spinner size="lg" />
        <p>Loading quiz...</p>
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
              <h1 className={styles.pageTitle}>Create New Quiz</h1>
              <p className={styles.pageDescription}>
                Choose the type of quiz you want to create
              </p>

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
                <div className={styles.formRow}>
                  <Input
                    placeholder="Quiz Title"
                    value={quizData.title}
                    onChange={(e) => setQuizData(prev => ({ ...prev, title: e.target.value }))}
                    className={styles.titleInput}
                  />
                </div>

                <div className={styles.formRow}>
                  <Input
                    placeholder="Quiz Description (optional)"
                    value={quizData.description}
                    onChange={(e) => setQuizData(prev => ({ ...prev, description: e.target.value }))}
                    className={styles.descriptionInput}
                  />
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
              </div>

              <div className={styles.setupActions}>
                <Button
                  variant="outline"
                  onClick={() => navigate('/activities')}
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
            <div>
              <h1 className={styles.quizTitle}>{quizData.title}</h1>
              <p className={styles.quizMeta}>
                {quizData.questions.length} questions • {quizData.estimatedTime} min • {quizData.difficulty}
              </p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Button
              variant="outline"
              onClick={() => setStep('preview')}
              disabled={quizData.questions.length === 0}
            >
              <Eye size={16} style={{ marginRight: 6 }} />
              Preview
            </Button>
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

        <div className={styles.builderContent}>
          {/* Questions Sidebar */}
          <div className={styles.questionsSidebar}>
            <div className={styles.sidebarHeader}>
              <h3>Questions</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={addQuestion}
              >
                <Plus size={14} style={{ marginRight: 4 }} />
                Add
              </Button>
            </div>
            <div className={styles.questionsList}>
              {quizData.questions.map((question, index) => (
                <button
                  key={question.id}
                  className={`${styles.questionTab} ${activeQuestionIndex === index ? styles.active : ''}`}
                  onClick={() => setActiveQuestionIndex(index)}
                >
                  <span className={styles.questionNumber}>Q{index + 1}</span>
                  <span className={styles.questionType}>
                    {QUESTION_TYPE_INFO[question.type]?.name || 'Unknown'}
                  </span>
                  <button
                    className={styles.deleteQuestion}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteQuestion(index);
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </button>
              ))}
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
            {quizData.questions.length > 0 ? (
              <Card>
                <CardBody>
                  <div className={styles.questionHeader}>
                    <h3>Question {activeQuestionIndex + 1}</h3>
                    <Select
                      value={quizData.questions[activeQuestionIndex]?.type || QUESTION_TYPES.MULTIPLE_CHOICE}
                      onChange={(e) => updateQuestion(activeQuestionIndex, {
                        type: e.target.value,
                        options: getDefaultOptions(e.target.value)
                      })}
                      options={Object.entries(QUESTION_TYPE_INFO).map(([value, info]) => ({
                        value,
                        label: info.name
                      }))}
                      size="sm"
                    />
                  </div>

                  <div className={styles.questionForm}>
                    <Input
                      placeholder="Enter your question here..."
                      value={quizData.questions[activeQuestionIndex]?.question || ''}
                      onChange={(e) => updateQuestion(activeQuestionIndex, { question: e.target.value })}
                      className={styles.questionInput}
                    />

                    <div className={styles.optionsSection}>
                      <div className={styles.optionsHeader}>
                        <h4>Answer Options</h4>
                        {quizData.questions[activeQuestionIndex]?.type !== QUESTION_TYPES.TRUE_FALSE && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addOption(activeQuestionIndex)}
                          >
                            <Plus size={14} style={{ marginRight: 4 }} />
                            Add Option
                          </Button>
                        )}
                      </div>

                      <div className={styles.optionsList}>
                        {quizData.questions[activeQuestionIndex]?.options?.map((option, optIndex) => (
                          <div key={option.id} className={styles.optionRow}>
                            <button
                              className={`${styles.correctToggle} ${option.correct ? styles.correct : ''}`}
                              onClick={() => setCorrectAnswer(activeQuestionIndex, option.id)}
                            >
                              {option.correct ? <CheckCircle size={16} /> : <XCircle size={16} />}
                            </button>
                            <Input
                              placeholder={`Option ${optIndex + 1}`}
                              value={option.text}
                              onChange={(e) => updateOption(activeQuestionIndex, option.id, { text: e.target.value })}
                              className={styles.optionInput}
                            />
                            {quizData.questions[activeQuestionIndex]?.type !== QUESTION_TYPES.TRUE_FALSE && (
                              <button
                                className={styles.deleteOption}
                                onClick={() => deleteOption(activeQuestionIndex, option.id)}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        ))}
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
}
