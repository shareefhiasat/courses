/**
 * Question Bank Page
 * Manage reusable questions library
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import logger from '@utils/logger';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
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
} from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import {
  getAllQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  duplicateQuestion,
  searchQuestions,
  getAllTags,
  bulkImportQuestions
} from '@firebaseServices/questionBankService';
import { QUESTION_TYPES, QUESTION_TYPE_CONFIG } from '@utils/questionTypes';
import { exportToCSV, importFromCSV } from '@utils/quizImportExport';
import styles from './QuestionBankPage.module.css';

export default function QuestionBankPage() {
  const { user, isAdmin, isInstructor } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();
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
  }, [user, isAdmin, isInstructor, loadQuestions, loadTags]);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAllQuestions();
      if (result.success) {
        setQuestions(result.data);
      } else {
        toast.error(t('failed_to_load_questions'));
      }
    } catch (error) {
      logger.error('Error loading questions:', error);
      toast.error(t('error_loading_questions'));
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  const loadTags = useCallback(async () => {
    try {
      const result = await getAllTags();
      if (result.success) {
        setAllTags(result.data);
      }
    } catch (error) {
      logger.error('Error loading tags:', error);
    }
  }, []);

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
        toast.success(t('question_duplicated'));
        loadQuestions();
      } else {
        toast.error(t('failed_to_duplicate_question'));
      }
    } catch (error) {
      logger.error('Error duplicating question:', error);
      toast.error(t('error_duplicating_question'));
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
            t('imported_questions', { 
              successful: importResult.data.successful, 
              failed: importResult.data.failed 
            })
          );
          loadQuestions();
        } else {
          toast.error(t('failed_to_import_questions'));
        }
      } else {
        toast.error(t('failed_to_parse_csv'));
      }
    } catch (error) {
      logger.error('Error importing questions:', error);
      toast.error(t('error_importing_questions'));
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
            {getThemedIcon('ui', 'book_open', 32, theme)}
            <div>
              <h1>Question Bank</h1>
              <p>{questions.length} questions in library</p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <label htmlFor="import-file">
              <Button variant="outline" as="span">
                {getThemedIcon('ui', 'upload', 16, theme)}
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
              {getThemedIcon('ui', 'download', 16, theme)}
              Export
            </Button>
            <Button variant="primary" onClick={handleCreateNew}>
              {getThemedIcon('ui', 'plus', 16, theme)}
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
                placeholder={t('search_questions_placeholder')}
                className={styles.searchBar}
              />
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                {getThemedIcon('ui', 'filter', 16, theme)}
                {t('filter')}
              </Button>
            </div>

            {showFilters && (
              <div className={styles.advancedFilters}>
                <Select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  options={[
                    { value: '', label: t('all_types') },
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
                    { value: '', label: t('all_difficulties') },
                    { value: 'easy', label: t('easy') },
                    { value: 'medium', label: t('medium') },
                    { value: 'hard', label: t('hard') }
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
                <span className={styles.statLabel}>{t('questions')}</span>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className={styles.stat}>
                <span className={styles.statValue}>{allTags.length}</span>
                <span className={styles.statLabel}>{t('tags')}</span>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className={styles.stat}>
                <span className={styles.statValue}>
                  {new Set(questions.map((q) => q.type)).size}
                </span>
                <span className={styles.statLabel}>{t('types')}</span>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Questions List */}
        {filteredQuestions.length === 0 ? (
          <EmptyState
            icon={getThemedIcon('ui', 'search', 48, theme)}
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
                          {getThemedIcon('ui', 'edit2', 16, theme)}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicate(question.id)}
                        >
                          {getThemedIcon('ui', 'copy', 16, theme)}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(question.id)}
                        >
                          {getThemedIcon('ui', 'trash2', 16, theme)}
                        </Button>
                      </div>
                    </div>

                    <div className={styles.questionContent}>
                      <p className={styles.questionText}>{question.question}</p>
                      {question.tags && question.tags.length > 0 && (
                        <div className={styles.questionTags}>
                          {question.tags.map((tag) => (
                            <Badge key={tag} variant="outline" size="sm">
                              {getThemedIcon('ui', 'tag', 12, theme)}
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
                        {t(question.difficulty)}
                      </Badge>
                      <span className={styles.usageCount}>
                        {getThemedIcon('ui', 'trending_up', 14, theme)}
                        {t('used_times', { count: question.usageCount || 0 })}
                      </span>
                      <span className={styles.points}>{question.points || 1} {t('pts')}</span>
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
