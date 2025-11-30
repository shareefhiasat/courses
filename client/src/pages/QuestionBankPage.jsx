/**
 * Question Bank Page
 * Manage reusable questions library
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Container,
  Card,
  CardBody,
  Button,
  Input,
  Select,
  Badge,
  SearchBar,
  Modal,
  useToast,
  EmptyState,
  Loading
} from '../components/ui';
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Edit2,
  Trash2,
  Copy,
  Tag,
  BookOpen,
  TrendingUp
} from 'lucide-react';
import {
  getAllQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  duplicateQuestion,
  searchQuestions,
  getAllTags,
  bulkImportQuestions
} from '../firebase/questionBank';
import { QUESTION_TYPES, QUESTION_TYPE_CONFIG } from '../utils/questionTypes';
import { exportToCSV, importFromCSV } from '../utils/quizImportExport';
import styles from './QuestionBankPage.module.css';

export default function QuestionBankPage() {
  const { user, isAdmin, isInstructor } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  useEffect(() => {
    if (!isAdmin && !isInstructor) {
      navigate('/');
      return;
    }
    loadQuestions();
    loadTags();
  }, [user, isAdmin, isInstructor]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const result = await getAllQuestions();
      if (result.success) {
        setQuestions(result.data);
      } else {
        toast.error('Failed to load questions');
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      toast.error('Error loading questions');
    } finally {
      setLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      const result = await getAllTags();
      if (result.success) {
        setAllTags(result.data);
      }
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          q.question?.toLowerCase().includes(searchLower) ||
          q.tags?.some((tag) => tag.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      // Type filter
      if (selectedType && q.type !== selectedType) return false;

      // Difficulty filter
      if (selectedDifficulty && q.difficulty !== selectedDifficulty) return false;

      // Tags filter
      if (selectedTags.length > 0) {
        const hasTag = selectedTags.some((tag) => q.tags?.includes(tag));
        if (!hasTag) return false;
      }

      return true;
    });
  }, [questions, searchTerm, selectedType, selectedDifficulty, selectedTags]);

  const handleSearch = async (term) => {
    setSearchTerm(term);
    if (term.length > 2) {
      const result = await searchQuestions(term);
      if (result.success) {
        setQuestions(result.data);
      }
    } else if (term.length === 0) {
      loadQuestions();
    }
  };

  const handleEdit = (question) => {
    setEditingQuestion(question);
    setShowEditModal(true);
  };

  const handleDelete = async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;

    try {
      const result = await deleteQuestion(questionId);
      if (result.success) {
        toast.success('Question deleted');
        loadQuestions();
      } else {
        toast.error('Failed to delete question');
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Error deleting question');
    }
  };

  const handleDuplicate = async (questionId) => {
    try {
      const result = await duplicateQuestion(questionId);
      if (result.success) {
        toast.success('Question duplicated');
        loadQuestions();
      } else {
        toast.error('Failed to duplicate question');
      }
    } catch (error) {
      console.error('Error duplicating question:', error);
      toast.error('Error duplicating question');
    }
  };

  const handleExport = () => {
    const exportData = {
      title: 'Question Bank Export',
      questions: filteredQuestions
    };
    exportToCSV(exportData);
    toast.success(`Exported ${filteredQuestions.length} questions`);
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = importFromCSV(text);

      if (result.success) {
        const importResult = await bulkImportQuestions(result.data, user.uid);
        if (importResult.success) {
          toast.success(
            `Imported ${importResult.data.successful} questions (${importResult.data.failed} failed)`
          );
          loadQuestions();
        } else {
          toast.error('Failed to import questions');
        }
      } else {
        toast.error('Failed to parse CSV file');
      }
    } catch (error) {
      console.error('Error importing questions:', error);
      toast.error('Error importing questions');
    }
  };

  const handleCreateNew = () => {
    setEditingQuestion({
      question: '',
      type: QUESTION_TYPES.SINGLE_CHOICE,
      options: [],
      tags: [],
      difficulty: 'medium',
      points: 1
    });
    setShowEditModal(true);
  };

  if (loading) {
    return <Loading fullscreen />;
  }

  return (
    <div className={styles.questionBankPage}>
      <Container maxWidth="xl">
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <BookOpen size={32} className={styles.headerIcon} />
            <div>
              <h1>Question Bank</h1>
              <p>{questions.length} questions in library</p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <label htmlFor="import-file">
              <Button variant="outline" as="span">
                <Upload size={16} />
                Import
              </Button>
            </label>
            <input
              id="import-file"
              type="file"
              accept=".csv"
              onChange={handleImport}
              style={{ display: 'none' }}
            />
            <Button variant="outline" onClick={handleExport}>
              <Download size={16} />
              Export
            </Button>
            <Button variant="primary" onClick={handleCreateNew}>
              <Plus size={16} />
              New Question
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className={styles.filtersCard}>
          <CardBody>
            <div className={styles.filtersRow}>
              <SearchBar
                value={searchTerm}
                onChange={handleSearch}
                placeholder="Search questions by text or tags..."
                className={styles.searchBar}
              />
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter size={16} />
                Filters
              </Button>
            </div>

            {showFilters && (
              <div className={styles.advancedFilters}>
                <Select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  options={[
                    { value: '', label: 'All Types' },
                    ...Object.entries(QUESTION_TYPE_CONFIG).map(([key, config]) => ({
                      value: key,
                      label: config.label
                    }))
                  ]}
                />
                <Select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  options={[
                    { value: '', label: 'All Difficulties' },
                    { value: 'easy', label: 'Easy' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'hard', label: 'Hard' }
                  ]}
                />
                <div className={styles.tagsFilter}>
                  {allTags.slice(0, 10).map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? 'primary' : 'outline'}
                      onClick={() => {
                        if (selectedTags.includes(tag)) {
                          setSelectedTags(selectedTags.filter((t) => t !== tag));
                        } else {
                          setSelectedTags([...selectedTags, tag]);
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Stats */}
        <div className={styles.statsRow}>
          <Card>
            <CardBody>
              <div className={styles.stat}>
                <span className={styles.statValue}>{filteredQuestions.length}</span>
                <span className={styles.statLabel}>Questions</span>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className={styles.stat}>
                <span className={styles.statValue}>{allTags.length}</span>
                <span className={styles.statLabel}>Tags</span>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className={styles.stat}>
                <span className={styles.statValue}>
                  {new Set(questions.map((q) => q.type)).size}
                </span>
                <span className={styles.statLabel}>Types</span>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Questions List */}
        {filteredQuestions.length === 0 ? (
          <EmptyState
            icon={<Search size={48} />}
            title="No questions found"
            description="Try adjusting your search or filters"
          />
        ) : (
          <div className={styles.questionsList}>
            {filteredQuestions.map((question) => {
              const typeConfig = QUESTION_TYPE_CONFIG[question.type];
              return (
                <Card key={question.id} className={styles.questionCard}>
                  <CardBody>
                    <div className={styles.questionHeader}>
                      <div className={styles.questionType}>
                        <span className={styles.typeIcon}>{typeConfig?.icon}</span>
                        <Badge variant="secondary">{typeConfig?.label}</Badge>
                      </div>
                      <div className={styles.questionActions}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(question)}
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicate(question.id)}
                        >
                          <Copy size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(question.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>

                    <div className={styles.questionContent}>
                      <p className={styles.questionText}>{question.question}</p>
                      {question.tags && question.tags.length > 0 && (
                        <div className={styles.questionTags}>
                          {question.tags.map((tag) => (
                            <Badge key={tag} variant="outline" size="sm">
                              <Tag size={12} />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className={styles.questionFooter}>
                      <Badge variant={
                        question.difficulty === 'easy' ? 'success' :
                        question.difficulty === 'hard' ? 'danger' : 'warning'
                      }>
                        {question.difficulty}
                      </Badge>
                      <span className={styles.usageCount}>
                        <TrendingUp size={14} />
                        Used {question.usageCount || 0} times
                      </span>
                      <span className={styles.points}>{question.points || 1} pts</span>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
}
