import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@ui';
import { RibbonTabs, AdvancedDataGrid } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import { formatDateTime } from '@utils/date';
import { formatQatarDate } from '@utils/timezone';
import logger from '@utils/logger';
import { ACTIVITY_TYPES, getActivityTypeConfig, getActivityTypeOptionsForDropdown, getThemeColor } from '@constants';
import { ACTIVITY_LOG_TYPES } from '@firebaseServices/activityLogger';
import { DIFFICULTY_TYPES, getDifficultyOptionsForDropdown } from '@constants/difficultyTypes';
import { getActivityTypes } from '@firebaseServices/activityService';
import { getPrograms, getSubjects, getClasses } from '@firebaseServices/programService.js';
import { getCategories } from '@firebaseServices/categoryService';
import { getActivities, addActivity, updateActivity, deleteActivity } from '@firebaseServices/activityService';
import { getAllQuizzes } from '@firebaseServices/quizService';
import { Select, Input, Textarea, DatePicker, NumberInput, Button, ToggleSwitch, UrlInput } from '@ui';
import DeleteModal from '@ui/history/DeleteModal';
import { RECORD_TYPES } from '@utils/sharedTypes';
import { convertTimestampsToISOStrings, COMMON_DATE_FIELDS } from '@utils/date.js';
import ProgramsSelect from '@ui/Select/ProgramsSelect';


/**
 * ActivitiesPage - Activities management page
 * 
 * This component provides a comprehensive activities management interface,
 * extracted from DashboardPage.jsx for better modularity.
 * 
 * Features:
 * - Multi-tab activity form (Basic Info, Content, Settings)
 * - Activity creation and editing
 * - Quiz integration with override settings
 * - Advanced data grid with filtering and export
 * - Email notification options
 * - Activity deletion with confirmation
 */
const ActivitiesPage = () => {
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const { user } = useAuth();
  const toast = useToast();
  
  // Internal state management
  const [activities, setActivities] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [activityForm, setActivityForm] = useState({
    id: '', title_en: '', title_ar: '', description_en: '', description_ar: '',
    type: ACTIVITY_TYPES.HOMEWORK, programId: '', subjectId: '', classId: '', categoryId: null,
    difficulty: DIFFICULTY_TYPES.BEGINNER, maxScore: 100, allowRetake: false, dueDate: undefined,
    show: true, quizId: '', overrideQuizSettings: false, featured: false,
    optional: false, requiresSubmission: false, url: '', image: '',
    descriptionMode: 'en' // Start with English description mode
  });
  const [editingActivity, setEditingActivity] = useState(null);
  const [activeActivityFormTab, setActiveActivityFormTab] = useState('basic');
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [emailOptions, setEmailOptions] = useState({
    sendEmail: false,
    createAnnouncement: false,
    emailLang: 'en'
  });
  const [deleteModal, setDeleteModal] = useState({ 
    isOpen: false, 
    entityType: RECORD_TYPES.ACTIVITY, 
    entityName: '', 
    onConfirm: null 
  });
  
  
    
  const [activityTypes, setActivityTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Data loading function
  const loadData = useCallback(async () => {
    setDataLoading(true);
    try {
      const [
        programsResult, 
        subjectsResult, 
        classesResult, 
        categoriesResult,
        activitiesResult,
        quizzesResult
      ] = await Promise.all([
        getPrograms(),
        getSubjects(), 
        getClasses(),
        getCategories(),
        getActivities(),
        getAllQuizzes()
      ]);
      
            
      if (programsResult.success) setPrograms(programsResult.data || []);
      if (subjectsResult.success) setSubjects(subjectsResult.data || []);
      if (classesResult.success) setClasses(classesResult.data || []);
      if (categoriesResult.success) setCategories(categoriesResult.data || []);
      if (activitiesResult.success) setActivities(activitiesResult.data || []);
      if (quizzesResult.success) setQuizzes(quizzesResult.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast?.showError('Failed to load data');
    } finally {
      setDataLoading(false);
    }
  }, [toast]);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handler functions
  const handleDropdownChange = useCallback((setter, field, resetFields = []) => {
    return (value) => {
      setter(prev => {
        const newState = { ...prev, [field]: value };
        resetFields.forEach(resetField => {
          newState[resetField] = '';
        });
        return newState;
      });
    };
  }, []);

  const resetActivityForm = useCallback(() => {
    setActivityForm({
      id: '', title_en: '', title_ar: '', description_en: '', description_ar: '',
      type: ACTIVITY_TYPES.HOMEWORK, programId: '', subjectId: '', classId: '', categoryId: null,
      difficulty: DIFFICULTY_TYPES.BEGINNER, maxScore: 100, allowRetake: false, dueDate: undefined,
      show: true, quizId: '', overrideQuizSettings: false, featured: false,
      optional: false, requiresSubmission: false, url: '', image: ''
    });
  }, []);

  // Optimized form field handlers to prevent lag
  const handleFieldChange = useCallback((field, value) => {
    setActivityForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleActivitySubmit = useCallback(async (e) => {
    if (e) e.preventDefault(); // Prevent form submission reload
    setLoading(true);
    setFormErrors({});

    try {
      // Validate required fields
      if (!activityForm.title_en || activityForm.title_en.trim() === '') {
        throw new Error('Activity title is required');
      }
      
      // Clean the activity data
      const activityData = {
        ...activityForm,
        title_en: activityForm.title_en.trim(),
        title_ar: activityForm.title_ar?.trim() || '',
        description_en: activityForm.description_en?.trim() || '',
        description_ar: activityForm.description_ar?.trim() || '',
        url: activityForm.url?.trim() || '',
        image: activityForm.image?.trim() || '',
        maxScore: activityForm.maxScore || 100,
        dueDate: activityForm.dueDate, // Keep the due date as-is
        updatedAt: new Date().toISOString(),
        updatedBy: user?.id || 'unknown'
      };
      
      // Remove undefined values before saving to prevent Firebase errors
      if (activityData.dueDate === undefined) {
        delete activityData.dueDate;
      }

      if (editingActivity && editingActivity.docId && editingActivity.docId !== 'new') {
        await updateActivity(editingActivity.docId, activityData);
        toast?.showSuccess('Activity updated successfully');
        
        // Update local activities array instead of reloading
        setActivities(prev => prev.map(a => 
          (a.docId || a.id) === editingActivity.docId 
            ? { ...a, ...activityData, docId: editingActivity.docId }
            : a
        ));
      } else {
        activityData.createdAt = new Date().toISOString(); // UTC timestamp
        activityData.updatedAt = new Date().toISOString(); // UTC timestamp
        activityData.createdBy = user?.id || 'unknown';
        
        const result = await addActivity(activityData);
        
        if (result.success) {
          console.log('🔍 [SAVE] Activity created successfully with ID:', result.id);
          toast?.showSuccess('Activity created successfully');
        } else {
          throw new Error(result.error || 'Failed to create activity');
        }
      }

      // Reset form and reload data
      setActivityForm({
        id: '', title_en: '', title_ar: '', description_en: '', description_ar: '',
        type: ACTIVITY_TYPES.HOMEWORK, programId: '', subjectId: '', classId: '', categoryId: null,
        difficulty: DIFFICULTY_TYPES.BEGINNER, maxScore: 100, allowRetake: false, dueDate: undefined,
        show: true, quizId: '', overrideQuizSettings: false, featured: false,
        optional: false, requiresSubmission: false, url: '', image: ''
      });
      setEditingActivity(null);
      setActiveActivityFormTab('basic');
    } catch (error) {
      console.error('Error saving activity:', error);
      
      // Check if it's a network error
      const isNetworkError = error.message.includes('WebChannel') || 
                            error.message.includes('network') ||
                            error.code === 'unavailable' ||
                            error.message.includes('Failed to save activity after multiple attempts');
      
      if (isNetworkError) {
        toast?.showError(
          'Network error occurred. Please check your connection and try again.',
          { 
            action: {
              label: 'Retry',
              onClick: () => handleActivitySubmit()
            }
          }
        );
      } else {
        toast?.showError(error.message || 'Error saving activity');
      }
    } finally {
      setLoading(false);
    }
  }, [activityForm, editingActivity, user, toast, loadData]);

  const handleEditActivity = useCallback((activity) => {
    const activityForForm = convertTimestampsToISOStrings(activity, COMMON_DATE_FIELDS.ACTIVITY);
    
    setEditingActivity(activity);
    
    // Set basic form data first
    setActivityForm({
      id: activityForForm.id || '',
      title_en: activityForForm.title_en || '',
      title_ar: activityForForm.title_ar || '',
      description_en: activityForForm.description_en || '',
      description_ar: activityForForm.description_ar || '',
      type: activityForForm.type || 'homework',
      programId: activityForForm.programId || '',
      subjectId: activityForForm.subjectId || '',
      classId: activityForForm.classId || '',
      categoryId: activityForForm.categoryId || null,
      difficulty: activityForForm.difficulty || 'beginner',
      maxScore: activityForForm.maxScore || 100,
      allowRetake: activityForForm.allowRetake || false,
      dueDate: activityForForm.dueDate || undefined, // Ensure undefined instead of null
      show: activityForForm.show !== false,
      quizId: activityForForm.quizId || '',
      overrideQuizSettings: activityForForm.overrideQuizSettings || false,
      featured: activityForForm.featured || false,
      optional: activityForForm.optional || false,
      requiresSubmission: activityForForm.requiresSubmission || false,
      url: activityForForm.url || '',
      image: activityForForm.image || ''
    });
    
    // If activity has a quizId, fetch the quiz data and sync it
    if (activity.quizId && activity.type === 'quiz') {
      const selectedQuiz = quizzes.find(q => q.id === activity.quizId);
      
      if (selectedQuiz) {
        const quizMaxScore = selectedQuiz.questions?.reduce((sum, q) => sum + (q.points || 1), 0) || 100;
        const quizDifficulty = selectedQuiz.difficulty || 'beginner';
        const quizAllowRetake = selectedQuiz.settings?.allowRetake !== undefined 
          ? selectedQuiz.settings.allowRetake 
          : (selectedQuiz.allowRetake !== undefined ? selectedQuiz.allowRetake : false);
        
        // Update form with quiz data
        setActivityForm(prev => ({
          ...prev,
          quizId: activity.quizId,
          // Only sync quiz data if not overriding settings
          ...(activity.overrideQuizSettings ? {} : {
            difficulty: quizDifficulty,
            allowRetake: quizAllowRetake,
            maxScore: quizMaxScore
          })
        }));
      }
    }
    
    setActiveActivityFormTab('basic');
  }, [quizzes]);

  // Create options from local state (only keeping category options)
  const activityCategoryOptions = useMemo(() => {
    const opts = [
      { value: '', label: t('all_categories'), icon: getThemedIcon('ui', 'filter', 16, theme) }
    ];
    const validCategories = categories
      .filter(cat => cat.docId || cat.id)
      .map(cat => {
        const value = cat.docId || cat.id;
        const label = lang === 'ar' 
          ? (cat.name_ar || cat.name_en || value) 
          : (cat.name_en || cat.name_ar || value);
        return { value, label, icon: getThemedIcon('ui', cat.icon || 'folder', 16, theme) };
      })
      .sort((a, b) => (a.label || '').localeCompare(b.label || '', undefined, { numeric: true }));
    return [...opts, ...validCategories];
  }, [categories, lang, t, theme]);

  return (
    <div className="activities-tab">
      {editingActivity && (
        <div style={{ 
          padding: '0.75rem 1rem', 
          background: '#fef3c7', 
          border: '1px solid #fbbf24', 
          borderRadius: '8px', 
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {getThemedIcon('ui', 'edit', 16, theme)} {t('editing_activity') || 'Editing Activity'}: {editingActivity.title_en || editingActivity.title}
        </div>
      )}

      
      <form onSubmit={handleActivitySubmit} className="dashboard-form">
        {/* Basic Info Section */}
        <div className="form-row">
          <ProgramsSelect
            programs={programs}
            subjects={subjects}
            classes={classes}
            selectedProgram={activityForm.programId}
            selectedSubject={activityForm.subjectId}
            selectedClass={activityForm.classId}
            onProgramChange={(programId) => setActivityForm(prev => ({ ...prev, programId, subjectId: '', classId: '' }))}
            onSubjectChange={(subjectId) => setActivityForm(prev => ({ ...prev, subjectId, classId: '' }))}
            onClassChange={(classId) => setActivityForm(prev => ({ ...prev, classId }))}
            showLabels={false}
            className="flex gap-2"
          />
        </div>
            <div className="form-row wide-cols">
              <Select
                searchable
                placeholder={t('all_categories')}
                value={activityForm.categoryId}
                onChange={(e) => {
                  const value = e?.target?.value !== undefined ? e.target.value : e;
                  setActivityForm(prev => ({ ...prev, categoryId: value }));
                }}
                options={activityCategoryOptions}
                icon={getThemedIcon('ui', 'filter', 16, theme)}
              />
            </div>
            <div className="form-row">
              <Select
                searchable
                placeholder={t('type') || 'Activity Type'}
                value={activityForm.type}
                onChange={(e) => handleFieldChange('type', e.target.value)}
                options={getActivityTypeOptionsForDropdown(theme, lang)}
                style={{ width: '100%' }}
                icon={getThemedIcon('ui', 'layers', 16, theme)}
              />
              <div style={{ position: 'relative', width: '100%' }}>
                <Select
                  searchable
                  placeholder={t('difficulty') || 'Difficulty'}
                  value={activityForm.difficulty || DIFFICULTY_TYPES.BEGINNER}
                  onChange={(e) => {
                    if (activityForm.quizId && !activityForm.overrideQuizSettings) {
                      toast?.showInfo?.(t('difficulty_synced_from_quiz') || 'Difficulty is synced from quiz. Enable "Override quiz settings" to edit.');
                      return;
                    }
                    handleFieldChange('difficulty', e.target.value);
                  }}
                  options={getDifficultyOptionsForDropdown(theme, lang)}
                  style={{ width: '100%' }}
                  icon={getThemedIcon('ui', 'target', 16, theme)}
                  disabled={activityForm.quizId && !activityForm.overrideQuizSettings}
                />
                {activityForm.quizId && !activityForm.overrideQuizSettings && (
                  <div
                    style={{
                      position: 'absolute',
                      right: '32px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#ef4444',
                      pointerEvents: 'none',
                      zIndex: 10
                    }}
                    title="Locked - synced from quiz"
                  >
                    {getThemedIcon('ui', 'lock', 16, theme)}
                  </div>
                )}
              </div>
            </div>
            <div className="form-row">
              <div>
                <Input
                  type="text"
                  placeholder={t('title_english') || t('title_en') || 'Title (English)'}
                  value={activityForm.title_en}
                  onChange={(e) => {
                    setActivityForm({ ...activityForm, title_en: e.target.value });
                  }}
                  required
                  error={formErrors.title_en}
                />
              </div>
              <Input
                type="text"
                placeholder={t('title_arabic') || t('title_ar') || 'Title (Arabic)'}
                value={activityForm.title_ar}
                onChange={(e) => {
                  setActivityForm({ ...activityForm, title_ar: e.target.value });
                }}
              />
            </div>

        {/* Content Section */}
        <div className="form-row">
          <div style={{ flex: 1, marginRight: '16px' }}>
            <Textarea
              placeholder={t('description_english') || t('description_en') || 'Description (English)'}
              value={activityForm.description_en}
              onChange={(e) => {
                setActivityForm({ ...activityForm, description_en: e.target.value });
              }}
              rows={3}
              fullWidth
            />
          </div>
          
          <div style={{ flex: 1 }}>
            <Textarea
              placeholder={t('description_arabic') || t('description_ar') || 'Description (Arabic)'}
              value={activityForm.description_ar}
              onChange={(e) => {
                setActivityForm({ ...activityForm, description_ar: e.target.value });
              }}
              rows={3}
              fullWidth
              style={{ direction: 'rtl' }}
            />
          </div>
        </div>
            <div className="form-row">
              <div>
                <UrlInput
                  placeholder={t('activity_url_label') || 'Activity URL'}
                  value={activityForm.url}
                  onChange={(e) => handleFieldChange('url', e.target.value)}
                  required={activityForm.type !== 'quiz'}
                  error={formErrors.url}
                  onOpen={(href) => window.open(href, '_blank')}
                  onCopy={() => toast?.showSuccess(t('copied') || 'Copied')}
                  onClear={() => setActivityForm({ ...activityForm, url: '' })}
                  fullWidth
                />
              </div>
              <DatePicker
                type="datetime"
                value={activityForm.dueDate || ''}
                onChange={(iso) => handleFieldChange('dueDate', iso || undefined)}
                placeholder={t('pick_due_date') || 'Pick due date & time'}
              />
              <UrlInput
                placeholder={t('image_url') || 'Image URL'}
                value={activityForm.image}
                onChange={(e) => handleFieldChange('image', e.target.value)}
                onOpen={(href) => window.open(href, '_blank')}
                onCopy={() => toast?.showSuccess(t('copied') || 'Copied')}
                onClear={() => setActivityForm({ ...activityForm, image: '' })}
                fullWidth
              />
              <div style={{ position: 'relative', width: '100%' }}>
                <NumberInput
                  placeholder={t('max_score') || 'Max Score'}
                  value={activityForm.maxScore || 100}
                  onChange={(e) => {
                    if (activityForm.quizId && !activityForm.overrideQuizSettings) {
                      toast?.showInfo?.('Max score is synced from quiz. Enable "Override quiz settings" to edit.');
                      return;
                    }
                    handleFieldChange('maxScore', Math.max(1, Number.parseInt(e.target.value || '0', 10)));
                  }}
                  min={1}
                  fullWidth
                  disabled={activityForm.quizId && !activityForm.overrideQuizSettings}
                />
                {activityForm.quizId && !activityForm.overrideQuizSettings && (
                  <span 
                    style={{ 
                      position: 'absolute',
                      right: '12px', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      color: '#ef4444',
                      pointerEvents: 'none',
                      zIndex: 10
                    }} 
                    title="Locked - synced from quiz"
                  >
                    {getThemedIcon('ui', 'lock', 16, theme)}
                  </span>
                )}
              </div>
            </div>
            
            {/* Quiz Selector - Only show for quiz type */}
            {activityForm.type === 'quiz' && (
              <div className="form-row single-column">
                <Select
                  searchable
                  placeholder={t('select_quiz') || 'Select Quiz (Optional)'}
                  value={activityForm.quizId || ''}
                  onChange={(e) => {
                    const selectedQuizId = e.target.value;
                    const selectedQuiz = quizzes.find(q => (q.id || q.docId) === selectedQuizId);
                    if (selectedQuiz) {
                      const quizMaxScore = selectedQuiz.questions?.reduce((sum, q) => sum + (q.points || 1), 0) || 100;
                      const quizDifficulty = selectedQuiz.difficulty || 'beginner';
                      const quizAllowRetake = selectedQuiz.settings?.allowRetake !== undefined 
                        ? selectedQuiz.settings.allowRetake 
                        : (selectedQuiz.allowRetake !== undefined ? selectedQuiz.allowRetake : false);
                      
                      setActivityForm(prev => {
                        const newForm = {
                          ...prev,
                          quizId: selectedQuizId,
                          ...(prev.overrideQuizSettings ? {} : {
                            difficulty: quizDifficulty,
                            allowRetake: quizAllowRetake,
                            maxScore: quizMaxScore,
                            // Sync quiz title and description to activity form
                            title_en: selectedQuiz.title_en || selectedQuiz.title || '',
                            title_ar: selectedQuiz.title_ar || '',
                            description_en: selectedQuiz.description_en || '',
                            description_ar: selectedQuiz.description_ar || ''
                          })
                        };
                        return newForm;
                      });
                    } else {
                      setActivityForm(prev => ({ ...prev, quizId: selectedQuizId }));
                    }
                  }}
                  options={[
                    { value: '', label: t('select_quiz') || 'Select Quiz (Optional)' },
                    ...quizzes
                      .filter((quiz, index, self) => 
                        index === self.findIndex(q => q.id === quiz.id)
                      )
                      .filter(quiz => quiz.id)
                      .map((quiz) => ({
                        value: quiz.id,
                        label: `${quiz.title || 'Untitled Quiz'} (${quiz.questions?.length || quiz.questionCount || 0} questions)`
                      }))
                  ]}
                  style={{ width: '100%' }}
                />
                {activityForm.quizId && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: '#f0f8ff', borderRadius: '6px' }}>
                    <ToggleSwitch
                      label="Override quiz settings (retake, difficulty, total marks)"
                      checked={activityForm.overrideQuizSettings || false}
                      onChange={(checked) => {
                        setActivityForm(prev => {
                          if (!checked && prev.quizId) {
                            const selectedQuiz = quizzes.find(q => q.id === prev.quizId);
                            if (selectedQuiz) {
                              const quizMaxScore = selectedQuiz.questions?.reduce((sum, q) => sum + (q.points || 1), 0) || 100;
                              const quizDifficulty = selectedQuiz.difficulty || 'beginner';
                              const quizAllowRetake = selectedQuiz.settings?.allowRetake !== undefined 
                                ? selectedQuiz.settings.allowRetake 
                                : (selectedQuiz.allowRetake !== undefined ? selectedQuiz.allowRetake : false);
                              return {
                                ...prev,
                                overrideQuizSettings: false,
                                difficulty: quizDifficulty,
                                allowRetake: quizAllowRetake,
                                maxScore: quizMaxScore,
                                // Re-sync quiz title and description when disabling override
                                title_en: selectedQuiz.title_en || selectedQuiz.title || '',
                                title_ar: selectedQuiz.title_ar || '',
                                description_en: selectedQuiz.description_en || '',
                                description_ar: selectedQuiz.description_ar || ''
                              };
                            }
                          }
                          return { ...prev, overrideQuizSettings: checked };
                        });
                      }}
                    />
                    {!activityForm.overrideQuizSettings && (
                      <span style={{ fontSize: '0.75rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {getThemedIcon('ui', 'lock', 12, theme)} Synced from quiz
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

        {/* Settings Section */}
        <div className="form-row compact-cols">
          <ToggleSwitch
            label={t('show_to_students') || 'Show to students'}
            checked={activityForm.show}
            onChange={(checked) => handleFieldChange('show', checked)}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ToggleSwitch
              label={t('allow_retakes') || 'Allow retakes'}
              checked={activityForm.allowRetake || false}
              onChange={(checked) => {
                if (activityForm.quizId && !activityForm.overrideQuizSettings) {
                  toast?.showInfo?.('Allow retakes is synced from quiz. Enable "Override quiz settings" to edit.');
                  return;
                }
                handleFieldChange('allowRetake', checked);
              }}
              disabled={activityForm.quizId && !activityForm.overrideQuizSettings}
            />
            {activityForm.quizId && !activityForm.overrideQuizSettings && (
              <span 
                style={{ color: '#ef4444', flexShrink: 0 }} 
                title="Locked - synced from quiz"
              >
                {getThemedIcon('ui', 'lock', 14, theme)}
              </span>
            )}
          </div>
          <ToggleSwitch
            label={t('featured') || 'Featured'}
            checked={activityForm.featured}
            onChange={(checked) => handleFieldChange('featured', checked)}
          />
          <ToggleSwitch
            label={t('optional') || 'Optional (if off: Required)'}
            checked={activityForm.optional}
            onChange={(checked) => handleFieldChange('optional', checked)}
          />
          <ToggleSwitch
            label={t('requires_submission') || 'Requires Submission'}
            checked={activityForm.requiresSubmission}
            onChange={(checked) => handleFieldChange('requiresSubmission', checked)}
          />
        </div>
        
        {/* Email Notification Options */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.75rem',
          padding: '1rem',
          background: '#f0f8ff',
          borderRadius: '8px',
          border: '2px solid var(--color-primary, #800020)'
        }}>
          <ToggleSwitch
            label={t('send_email_to_students') || 'Send email to students'}
            checked={emailOptions.sendEmail}
            onChange={(checked) => setEmailOptions({ ...emailOptions, sendEmail: checked })}
          />
          <ToggleSwitch
            label={t('create_announcement') || 'Create announcement'}
            checked={emailOptions.createAnnouncement}
            onChange={(checked) => setEmailOptions({ ...emailOptions, createAnnouncement: checked })}
          />
          {emailOptions.sendEmail && (
        <div>
              <small>{t('language') || 'Language'}</small>
              <Select
                searchable
                placeholder={t('language') || 'Language'}
                value={emailOptions.emailLang}
                onChange={(e) => setEmailOptions({ ...emailOptions, emailLang: e.target.value })}
                options={[
                  { value: 'en', label: lang === 'ar' ? 'الإنجليزية' : 'English' },
                  { value: 'ar', label: lang === 'ar' ? 'العربية' : 'Arabic' },
                  { value: 'both', label: lang === 'ar' ? 'ثنائي اللغة' : 'Bilingual' }
                ]}
              />
            </div>
          )}
        </div>
        
        {/* Form Actions */}
        <div className="form-actions">
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <Button type="submit" variant="primary" loading={loading}>
                {(editingActivity ? (t('update') || 'Update') : (t('save') || 'Save'))}
              </Button>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setEditingActivity(null);
                  resetActivityForm();
                  setActiveActivityFormTab('basic');
                }}
                style={{ display: editingActivity ? 'block' : 'none' }}
              >
                {t('cancel') || 'Cancel'}
              </Button>
            </div>
          </div>
        </div>
      </form>
      
      <div style={{ marginTop: '1rem' }}>
        <AdvancedDataGrid
          rows={activities}
          getRowId={(row) => row.docId || row.id}
          columns={[
            { field: 'title_en', headerName: t('title_en_col'), flex: 1, minWidth: 160,
              renderCell: (params) => {
                const row = params?.row || {};
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ color: getThemeColor('text.primary', theme) }}>
                      {row.title_en || row.title || ''}
                    </div>
                    <div style={{ color: getThemeColor('text.secondary', theme), fontSize: '12px' }}>
                      {row.title_ar || ''}
                    </div>
                  </div>
                );
              }
            },
            { field: 'title_ar', headerName: t('title_ar_col'), flex: 1, minWidth: 160,
              renderCell: (params) => {
                const row = params?.row || {};
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ color: getThemeColor('text.secondary', theme), fontSize: '12px' }}>
                      {row.title_ar || ''}
                    </div>
                    <div style={{ color: getThemeColor('text.primary', theme), fontSize: '12px' }}>
                      {row.title_en || row.title || ''}
                    </div>
                  </div>
                );
              }
            },
            {
              field: 'programId',
              headerName: t('program') || 'Program',
              width: 150,
              valueGetter: (params) => {
                const row = params?.row || {};
                return row.programId || row.program || params?.value || null;
              },
              renderCell: (params) => {
                const programId = params.value || params.row?.programId || params.row?.program;
                if (!programId) return (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {t('general') || 'General'}
                  </span>
                );
                const program = programs.find(p => (p.docId || p.id) === programId);
                if (!program) return '—';
                const programName = lang === 'ar' 
                  ? (program.name_ar || program.name_en || program.name || programId) 
                  : (program.name_en || program.name_ar || program.name || programId);
                return (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {programName}
                  </span>
                );
              }
            },
            {
              field: 'subjectId',
              headerName: t('subject') || 'Subject',
              width: 150,
              valueGetter: (params) => {
                const row = params?.row || {};
                return row.subjectId || row.subject || params?.value || null;
              },
              renderCell: (params) => {
                const subjectId = params.value || params.row?.subjectId || params.row?.subject;
                if (!subjectId) return (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {t('general') || 'General'}
                  </span>
                );
                const subject = subjects.find(s => (s.docId || s.id) === subjectId);
                if (!subject) return '—';
                const subjectName = lang === 'ar' 
                  ? (subject.name_ar || subject.name_en || subject.name || subjectId) 
                  : (subject.name_en || subject.name_ar || subject.name || subjectId);
                return (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {subjectName}
                  </span>
                );
              }
            },
            { 
              field: 'classId', 
              headerName: t('class_col') || 'Class', 
              width: 180,
              renderCell: (params) => {
                if (!params.value) return (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {t('general') || 'General'}
                  </span>
                );
                const classItem = classes.find(c => (c.docId || c.id) === params.value);
                if (!classItem) return params.value;
                return (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {classItem.name}{classItem.code ? ` (${classItem.code})` : ''}
                  </span>
                );
              }
            },
            { 
              field: 'type', 
              headerName: t('type_col') || 'Type', 
              width: 140,
              valueGetter: (params) => {
                const row = params?.row || {};
                return row.type || params?.value || null;
              },
              renderCell: (params) => {
                const type = params.value || params.row?.type;
                if (!type) return '—';
                const typeConfig = getActivityTypeConfig(type, theme, lang);
                return (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {typeConfig.text}
                  </span>
                );
              }
            },
            { 
              field: 'difficulty', 
              headerName: t('difficulty_col'), 
              width: 140,
              renderCell: (params) => {
                const difficulty = params.value;
                if (!difficulty) return '—';
                const difficultyMap = {
                  'easy': { text: 'Easy' },
                  'medium': { text: 'Medium' },
                  'hard': { text: 'Hard' }
                };
                const difficultyConfig = difficultyMap[difficulty.toLowerCase()] || { text: difficulty };
                return (
                  <span>
                    {difficultyConfig.text}
                  </span>
                );
              }
            },
            {
              field: 'maxScore',
              headerName: t('max_score') || 'Max Score',
              width: 120,
              renderCell: (params) => params.value || '—'
            },
                        {
              field: 'quizId',
              headerName: t('quiz') || 'Quiz',
              width: 200,
              valueGetter: (params) => {
                const row = params?.row || {};
                return row.quizId || row.quiz || params?.value || null;
              },
              renderCell: (params) => {
                const quizId = params.value || params.row?.quizId || params.row?.quiz;
                if (!quizId) return '—';
                const quiz = quizzes.find(q => q.id === quizId);
                return quiz ? (quiz.title || 'Untitled Quiz') : quizId;
              }
            },
            {
              field: 'dueDate', headerName: t('assignment_due_date_col'), flex: 1, minWidth: 200,
              valueGetter: (params) => params.value,
              renderCell: (params) => (params.value ? formatDateTime(params.value) : (t('no_deadline_set') || 'No deadline set'))
            },
            {
              field: 'createdAt', headerName: 'Created Date', width: 180,
              valueGetter: (params) => params.value,
              renderCell: (params) => {
                if (!params.value) return 'Unknown';
                // Log the raw value for debugging
                logger.debug('Activities Date Debug - Raw params.value:', params.value);
                logger.debug('Activities Date Debug - Type:', typeof params.value);
                logger.debug('Activities Date Debug - Has toDate:', typeof params.value?.toDate);
                let date;
                if (params.value?.toDate) {
                  date = params.value.toDate();
                  logger.debug('Activities Date Debug - Using toDate():', date);
                } else if (params.value?.seconds) {
                  date = new Date(params.value.seconds * 1000);
                  logger.debug('Activities Date Debug - Using seconds:', params.value.seconds, '-> date:', date);
                } else if (typeof params.value === 'string' || typeof params.value === 'number') {
                  date = new Date(params.value);
                  logger.debug('Activities Date Debug - Using new Date():', date);
                } else {
                  date = new Date(params.value);
                  logger.debug('Activities Date Debug - Fallback new Date():', date);
                }
                logger.debug('Activities Date Debug - Final date:', date, 'isValid:', !isNaN(date.getTime()));
                if (isNaN(date.getTime())) {
                  return 'Invalid Date';
                }
                return formatQatarDate(date);
              }
            },
            {
              field: 'show', headerName: t('visible') || 'Visible', width: 100,
              renderCell: (params) => {
                const isVisible = params.value;
                return (
                  <span style={{ 
                    color: isVisible ? getThemeColor('success', theme) : getThemeColor('error', theme),
                    fontWeight: 500,
                    fontSize: '0.85rem'
                  }}>
                    {isVisible ? (t('yes') || 'Yes') : (t('no') || 'No')}
                  </span>
                );
              }
            },
            {
              field: 'allowRetake', headerName: t('allow_retakes') || 'Allow Retakes', width: 120,
              renderCell: (params) => {
                const allowed = params.value;
                return (
                  <span style={{ 
                    color: allowed ? getThemeColor('success', theme) : getThemeColor('muted', theme),
                    fontWeight: 500,
                    fontSize: '0.85rem'
                  }}>
                    {allowed ? (t('yes') || 'Yes') : (t('no') || 'No')}
                  </span>
                );
              }
            },
            {
              field: 'featured', headerName: t('featured') || 'Featured', width: 100,
              renderCell: (params) => {
                const isFeatured = params.value;
                return (
                  <span style={{ 
                    color: isFeatured ? getThemeColor('warning', theme) : getThemeColor('muted', theme),
                    fontWeight: 500,
                    fontSize: '0.85rem'
                  }}>
                    {isFeatured ? (t('yes') || 'Yes') : (t('no') || 'No')}
                  </span>
                );
              }
            },
            {
              field: 'optional', headerName: t('optional') || 'Optional', width: 100,
              renderCell: (params) => {
                const isOptional = params.value;
                return (
                  <span style={{ 
                    color: isOptional ? getThemeColor('info', theme) : getThemeColor('muted', theme),
                    fontWeight: 500,
                    fontSize: '0.85rem'
                  }}>
                    {isOptional ? (t('yes') || 'Yes') : (t('no') || 'No')}
                  </span>
                );
              }
            },
            {
              field: 'requiresSubmission', headerName: t('requires_submission') || 'Requires Submission', width: 150,
              renderCell: (params) => {
                const required = params.value;
                return (
                  <span style={{ 
                    color: required ? getThemeColor('error', theme) : getThemeColor('muted', theme),
                    fontWeight: 500,
                    fontSize: '0.85rem'
                  }}>
                    {required ? (t('yes') || 'Yes') : (t('no') || 'No')}
                  </span>
                );
              }
            },
            {
              field: 'actions', headerName: t('actions') || 'Actions', width: 200, sortable: false, filterable: false,
              renderCell: useMemo(() => (params) => (
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button size="sm" variant="ghost" className="editHover" icon={getThemedIcon('ui', 'edit', 16, theme)} onClick={() => handleEditActivity(params.row)}>
                    {t('edit') || 'Edit'}
                  </Button>
                  <Button size="sm" variant="ghost" className="deleteHover" icon={getThemedIcon('ui', 'trash', 16, theme)} style={{ color: '#dc2626' }} onClick={() => {
                    const activity = params.row;
                    setDeleteModal({
                      isOpen: true,
                      entityType: RECORD_TYPES.ACTIVITY,
                      entityName: activity.title_en || activity.title || 'this activity',
                      onConfirm: async () => {
                        setActivities(prev => prev.filter(a => (a.docId || a.id) !== (activity.docId || activity.id)));
                        try {
                          const result = await deleteActivity(activity.docId, activity);
                          if (result.success) {
                            toast?.showSuccess(t('activity_deleted_successfully') || 'Activity deleted successfully!');
                            await loadData();
                            setDeleteModal({ isOpen: false, entityType: RECORD_TYPES.ACTIVITY, entityName: '', onConfirm: null });
                          } else {
                            setActivities(prev => [...prev, activity].sort((a, b) => a.order - b.order));
                            toast?.showError(t('error_deleting_activity') || 'Error deleting activity: ' + result.error);
                            setDeleteModal({ isOpen: false, entityType: RECORD_TYPES.ACTIVITY, entityName: '', onConfirm: null });
                          }
                        } catch (error) {
                          setActivities(prev => [...prev, activity].sort((a, b) => a.order - b.order));
                          toast?.showError(t('error_deleting_activity') || 'Error deleting activity: ' + error.message);
                          setDeleteModal({ isOpen: false, entityType: RECORD_TYPES.ACTIVITY, entityName: '', onConfirm: null });
                        }
                      }
                    });
                  }}>
                    Delete
                  </Button>
                </div>
              ), [handleEditActivity, t, theme, toast, loadData])
            }
          ]}
          pageSize={10}
          pageSizeOptions={[10, 20, 50, 100]}
          checkboxSelection
          exportFileName="activities"
          showExportButton
          exportLabel={t('export') || 'Export'}
          loadingOverlayMessage={loading ? "Loading..." : undefined} fancyVariant="dots"
        />
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, entityType: RECORD_TYPES.ACTIVITY, entityName: '', onConfirm: null })}
        onConfirm={deleteModal.onConfirm}
        entityType={deleteModal.entityType}
        entityName={deleteModal.entityName}
        deleteLoading={loading}
        t={t}
      />
    </div>
  );
};

export default ActivitiesPage;
