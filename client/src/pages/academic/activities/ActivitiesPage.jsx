import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@ui';
import { AdvancedDataGrid } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import { formatQatarStandard, formatQatarForInput, parseQatarFromInput, getQatarNow } from '@utils/qatarDate';
import logger from '@utils/logger';
import { ACTIVITY_TYPES, getActivityTypeConfig, getActivityTypeOptionsForDropdown, getThemeColor } from '@constants';
import { DIFFICULTY_TYPES, getDifficultyConfig, getDifficultyOptionsForDropdown } from '@constants/difficultyTypes';
import { getPrograms, getSubjects, getClasses } from '@services/business/programService.js';
import { getCategories } from '@services/business/categoryService';
import { getActivities, addActivity, updateActivity, deleteActivity as deleteActivityService } from '@services/business/activityService';
import { getAllQuizzes } from '@services/business/quizService';
import { Select, DatePicker, Button, ToggleSwitch, UrlInput, Input } from '@ui';
import DeleteModal, { useDeleteModal } from '@ui/DeleteModal/DeleteModal';
import { RECORD_TYPES } from '@utils/sharedTypes';
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
  const isDark = theme === 'dark';
  const { user } = useAuth();
  const toast = useToast();
  
  // Internal state management
  const [activities, setActivities] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  
  // Filter state
  const [activityProgramFilter, setActivityProgramFilter] = useState('');
  const [activitySubjectFilter, setActivitySubjectFilter] = useState('');
  const [activityClassFilter, setActivityClassFilter] = useState('');
  const [activityTypeFilter, setActivityTypeFilter] = useState('');
  const [activityDifficultyFilter, setActivityDifficultyFilter] = useState('');
  const [activityTitleEnFilter, setActivityTitleEnFilter] = useState('');
  const [activityTitleArFilter, setActivityTitleArFilter] = useState('');
  const [activityDescriptionEnFilter, setActivityDescriptionEnFilter] = useState('');
  const [activityDescriptionArFilter, setActivityDescriptionArFilter] = useState('');
  
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
  const { deleteModal, deleteActivity, handleDeleteConfirm, hideDeleteModal } = useDeleteModal(t);
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
      logger.error('Error loading data:', error);
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

  // Simple field change for dropdowns/toggles (not text inputs)
  const handleFieldChange = useCallback((field, value) => {
    setActivityForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleEmailOptionChange = useCallback((field, value) => {
    logger.log('🔔 Activity bell toggle changed:', { field, value, previous: emailOptions[field] });
    setEmailOptions(prev => ({ ...prev, [field]: value }));
  }, [emailOptions]);

  // Refs for text inputs — avoids re-rendering the whole page on every keystroke
  const titleEnRef = useRef(null);
  const titleArRef = useRef(null);
  const descEnRef = useRef(null);
  const descArRef = useRef(null);
  const urlRef = useRef(null);
  const imageRef = useRef(null);

  // Sync refs when editing an existing activity
  useEffect(() => {
    if (titleEnRef.current) titleEnRef.current.value = activityForm.title_en || '';
    if (titleArRef.current) titleArRef.current.value = activityForm.title_ar || '';
    if (descEnRef.current) descEnRef.current.value = activityForm.description_en || '';
    if (descArRef.current) descArRef.current.value = activityForm.description_ar || '';
    if (urlRef.current) urlRef.current.value = activityForm.url || '';
    if (imageRef.current) imageRef.current.value = activityForm.image || '';
  }, [editingActivity]); // only when we load an activity for editing

  // Read text values from refs into form state before submit
  const syncRefsToState = useCallback(() => {
    return {
      title_en: titleEnRef.current?.value ?? activityForm.title_en,
      title_ar: titleArRef.current?.value ?? activityForm.title_ar,
      description_en: descEnRef.current?.value ?? activityForm.description_en,
      description_ar: descArRef.current?.value ?? activityForm.description_ar,
      url: urlRef.current?.value ?? activityForm.url,
      image: imageRef.current?.value ?? activityForm.image,
    };
  }, [activityForm]);

  const handleActivitySubmit = useCallback(async (e) => {
    if (e) e.preventDefault();
    logger.time('[PERF] handleActivitySubmit');
    setLoading(true);
    setFormErrors({});

    try {
      // Read text fields from refs (uncontrolled inputs)
      const textValues = syncRefsToState();
      logger.log('[FORM] Text values from refs:', textValues);

      if (!textValues.title_en || textValues.title_en.trim() === '') {
        throw new Error('Activity title is required');
      }
      
      // Clean the activity data
      const activityData = {
        ...activityForm,
        ...textValues,
        title_en: textValues.title_en.trim(),
        title_ar: textValues.title_ar?.trim() || '',
        description_en: textValues.description_en?.trim() || '',
        description_ar: textValues.description_ar?.trim() || '',
        url: textValues.url?.trim() || '',
        image: textValues.image?.trim() || '',
        maxScore: activityForm.maxScore || 100,
        dueDate: activityForm.dueDate ? parseQatarFromInput(activityForm.dueDate) : undefined,
        updatedAt: getQatarNow(),
        updatedBy: user?.id || 'unknown'
      };
      
      // Remove undefined values before saving to prevent Firebase errors
      if (activityData.dueDate === undefined) {
        delete activityData.dueDate;
      }

      if (editingActivity && editingActivity.docId && editingActivity.docId !== 'new') {
        await updateActivity(editingActivity.docId, activityData, emailOptions);
        toast?.showSuccess('Activity updated successfully');
        
        // Update local activities array instead of reloading
        setActivities(prev => prev.map(a => 
          (a.docId || a.id) === editingActivity.docId 
            ? { ...a, ...activityData, docId: editingActivity.docId }
            : a
        ));
      } else {
        activityData.createdAt = getQatarNow(); // Qatar timestamp
        activityData.updatedAt = getQatarNow(); // Qatar timestamp
        activityData.createdBy = user?.id || 'unknown';
        
        const result = await addActivity(activityData);
        
        if (result.success) {
          logger.log('🔍 [SAVE] Activity created successfully with ID:', result.id);
          toast?.showSuccess('Activity created successfully');
        } else {
          throw new Error(result.error || 'Failed to create activity');
        }
      }

      // Reset form and clear refs
      resetActivityForm();
      if (titleEnRef.current) titleEnRef.current.value = '';
      if (titleArRef.current) titleArRef.current.value = '';
      if (descEnRef.current) descEnRef.current.value = '';
      if (descArRef.current) descArRef.current.value = '';
      if (urlRef.current) urlRef.current.value = '';
      if (imageRef.current) imageRef.current.value = '';
      setEditingActivity(null);
      setActiveActivityFormTab('basic');
    } catch (error) {
      logger.error('Error saving activity:', error);
      toast?.showError(error.message || 'Error saving activity');
    } finally {
      setLoading(false);
      logger.timeEnd('[PERF] handleActivitySubmit');
    }
  }, [activityForm, editingActivity, user, toast, syncRefsToState, resetActivityForm]);

  const handleEditActivity = useCallback((activity) => {
    // Convert dueDate to input format for editing
    const activityForForm = {
      ...activity,
      dueDate: activity.dueDate ? formatQatarForInput(activity.dueDate) : undefined
    };
    
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

  // Clear filters
  const handleClearActivityFilters = () => {
    setActivityProgramFilter('');
    setActivitySubjectFilter('');
    setActivityClassFilter('');
    setActivityTypeFilter('');
    setActivityDifficultyFilter('');
  };

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

  // Memoize columns to prevent re-renders
  const gridColumns = useMemo(() => [
    { field: 'title_en', headerName: t('title_en_col'), flex: 1, minWidth: 160,
      renderCell: (params) => {
        const row = params?.row || {};
        return (
          <div style={{ display: 'flex', flexDirection: 'row', gap: '4px', alignItems: 'center' }}>
            <div style={{ color: getThemeColor('text.primary', theme) }}>
              {row.title_en || row.title || ''}
            </div>
            {row.title_en && row.title_ar && (
              <span style={{ color: getThemeColor('text.secondary', theme), fontSize: '10px' }}>•</span>
            )}
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
          <div style={{ display: 'flex', flexDirection: 'row', gap: '4px', alignItems: 'center' }}>
            <div style={{ color: getThemeColor('text.primary', theme), fontSize: '12px' }}>
              {row.title_ar || ''}
            </div>
            {row.title_ar && row.title_en && (
              <span style={{ color: getThemeColor('text.secondary', theme), fontSize: '10px' }}>•</span>
            )}
            <div style={{ color: getThemeColor('text.secondary', theme), fontSize: '12px' }}>
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
      },
      valueFormatter: (params) => {
        if (!params.value) return t('general') || 'General';
        const program = programs.find(p => (p.docId || p.id) === params.value);
        if (!program) return '—';
        const programName = lang === 'ar' 
          ? (program.name_ar || program.name_en || program.name || params.value) 
          : (program.name_en || program.name_ar || program.name || params.value);
        return programName;
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
      },
      valueFormatter: (params) => {
        if (!params.value) return t('general') || 'General';
        const subject = subjects.find(s => (s.docId || s.id) === params.value);
        if (!subject) return '—';
        const subjectName = lang === 'ar' 
          ? (subject.name_ar || subject.name_en || subject.name || params.value) 
          : (subject.name_en || subject.name_ar || subject.name || params.value);
        return subjectName;
      }
    },
    { 
      field: 'classId', 
      headerName: t('class_col') || 'Class', 
      width: 180,
      valueGetter: (params) => {
        const row = params?.row || {};
        return row.classId || params?.value || null;
      },
      renderCell: (params) => {
        if (!params.value) return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            {t('general') || 'General'}
          </span>
        );
        const classItem = classes.find(c => (c.docId || c.id) === params.value);
        if (!classItem) return params.value;
        const className = lang === 'ar' 
          ? (classItem.name_ar || classItem.name_en || classItem.name || params.value) 
          : (classItem.name_en || classItem.name_ar || classItem.name || params.value);
        const suffix = lang === 'ar' ? '' : (classItem.code ? ` (${classItem.code})` : '');
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            {className}{suffix}
          </span>
        );
      },
      valueFormatter: (params) => {
        if (!params.value) return t('general') || 'General';
        const classItem = classes.find(c => (c.docId || c.id) === params.value);
        if (!classItem) return params.value;
        const className = lang === 'ar' 
          ? (classItem.name_ar || classItem.name_en || classItem.name || params.value) 
          : (classItem.name_en || classItem.name_ar || classItem.name || params.value);
        const suffix = lang === 'ar' ? '' : (classItem.code ? ` (${classItem.code})` : '');
        return `${className}${suffix}`;
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
            {getThemedIcon('ui', typeConfig.icon, 14, theme)}
            {typeConfig.text}
          </span>
        );
      },
      valueFormatter: (params) => {
        if (!params.value) return '—';
        const typeConfig = getActivityTypeConfig(params.value, theme, lang);
        return typeConfig.text;
      }
    },
    { 
      field: 'difficulty', 
      headerName: t('difficulty_col'), 
      width: 140,
      renderCell: (params) => {
        const difficulty = params.value;
        if (!difficulty) return '—';
        const difficultyConfig = getDifficultyConfig(difficulty, theme, lang);
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            {getThemedIcon('ui', difficultyConfig.icon, 14, theme)}
            {difficultyConfig.text}
          </span>
        );
      },
      valueFormatter: (params) => {
        if (!params.value) return '—';
        const difficultyConfig = getDifficultyConfig(params.value, theme, lang);
        return difficultyConfig.text;
      }
    },
    {
      field: 'maxScore',
      headerName: t('max_score') || 'Max Score',
      width: 120,
      renderCell: (params) => params.value || '—',
      valueFormatter: (params) => params.value || '—'
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
      },
      valueFormatter: (params) => {
        if (!params.value) return '—';
        const quiz = quizzes.find(q => q.id === params.value);
        if (!quiz) return params.value;
        const quizTitle = lang === 'ar' 
          ? (quiz.title_ar || quiz.title_en || quiz.title || 'Untitled Quiz') 
          : (quiz.title_en || quiz.title_ar || quiz.title || 'Untitled Quiz');
        return quizTitle;
      }
    },
    {
      field: 'dueDate', headerName: t('assignment_due_date_col'), flex: 1, minWidth: 200,
      valueGetter: (params) => params.value,
      renderCell: (params) => (params.value ? formatQatarStandard(params.value) : (t('no_deadline_set') || 'No deadline set')),
      valueFormatter: (params) => {
        if (!params.value) return t('no_deadline_set') || 'No deadline set';
        return formatQatarStandard(params.value);
      }
    },
    {
      field: 'createdAt', headerName: 'Created Date', width: 180,
      valueGetter: (params) => params.value,
      renderCell: (params) => {
        if (!params.value) return 'Unknown';
        return formatQatarStandard(params.value);
      },
      valueFormatter: (params) => {
        if (!params.value) return 'Unknown';
        return formatQatarStandard(params.value);
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
      },
      valueFormatter: (params) => params.value ? (t('yes') || 'Yes') : (t('no') || 'No')
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
      },
      valueFormatter: (params) => params.value ? (t('yes') || 'Yes') : (t('no') || 'No')
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
      },
      valueFormatter: (params) => params.value ? (t('yes') || 'Yes') : (t('no') || 'No')
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
      },
      valueFormatter: (params) => params.value ? (t('yes') || 'Yes') : (t('no') || 'No')
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
      },
      valueFormatter: (params) => params.value ? (t('yes') || 'Yes') : (t('no') || 'No')
    },
    {
      field: 'actions', headerName: t('actions') || 'Actions', width: 150, sortable: false, filterable: false,
      renderCell: (params) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="sm" variant="ghost" className="editHover" icon={getThemedIcon('ui', 'edit', 16, theme)} onClick={() => handleEditActivity(params.row)}>
            {t('edit') || 'Edit'}
          </Button>
          <Button size="sm" variant="ghost" className="deleteHover" icon={getThemedIcon('ui', 'trash', 16, theme)} style={{ color: '#dc2626' }} onClick={() => {
            const activity = params.row;
            deleteActivity(activity, async () => {
              setActivities(prev => prev.filter(a => (a.docId || a.id) !== (activity.docId || activity.id)));
              try {
                const result = await deleteActivityService(activity.docId, activity);
                if (result.success) {
                  toast?.showSuccess(t('activity_deleted_successfully') || 'Activity deleted successfully!');
                  await loadData();
                } else {
                  setActivities(prev => [...prev, activity].sort((a, b) => a.order - b.order));
                  toast?.showError(t('error_deleting_activity') || 'Error deleting activity: ' + result.error);
                }
              } catch (error) {
                setActivities(prev => [...prev, activity].sort((a, b) => a.order - b.order));
                toast?.showError(t('error_deleting_activity') || 'Error deleting activity: ' + error.message);
              }
            });
          }}>
            {t('delete') || 'Delete'}
          </Button>
        </div>
      )
    }
  ], [programs, subjects, classes, quizzes, theme, lang, t, handleEditActivity, toast, loadData]);

  const filteredActivities = activities.filter(activity => {
    if (activityProgramFilter && activity.programId !== activityProgramFilter) return false;
    if (activitySubjectFilter && activity.subjectId !== activitySubjectFilter) return false;
    if (activityClassFilter && activity.classId !== activityClassFilter) return false;
    if (activityTypeFilter && activity.type !== activityTypeFilter) return false;
    if (activityDifficultyFilter && activity.difficulty !== activityDifficultyFilter) return false;
    
    // Text search filters
    if (activityTitleEnFilter && (!activity.title_en || !activity.title_en.toLowerCase().includes(activityTitleEnFilter.toLowerCase()))) return false;
    if (activityTitleArFilter && (!activity.title_ar || !activity.title_ar.includes(activityTitleArFilter))) return false;
    if (activityDescriptionEnFilter && (!activity.description_en || !activity.description_en.toLowerCase().includes(activityDescriptionEnFilter.toLowerCase()))) return false;
    if (activityDescriptionArFilter && (!activity.description_ar || !activity.description_ar.includes(activityDescriptionArFilter))) return false;
    
    return true;
  });

  return (
    <div className="activities-tab">
      {editingActivity && (
        <div style={{ 
          padding: '0.75rem 1rem', 
          background: isDark ? '#78350f' : '#fef3c7', 
          border: isDark ? '1px solid #92400e' : '1px solid #fbbf24', 
          borderRadius: '8px', 
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: isDark ? '#fef3c7' : '#78350f'
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
            onProgramChange={handleDropdownChange(setActivityForm, 'programId', ['subjectId', 'classId'])}
            onSubjectChange={handleDropdownChange(setActivityForm, 'subjectId', ['classId'])}
            onClassChange={handleDropdownChange(setActivityForm, 'classId')}
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
                  handleFieldChange('categoryId', value);
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
                <input
                  ref={titleEnRef}
                  type="text"
                  placeholder={(t('title_english') || 'Title (English)') + '*'}
                  defaultValue={activityForm.title_en}
                  className="dashboard-input"
                  required
                />
              </div>
              <input
                ref={titleArRef}
                type="text"
                placeholder={t('title_arabic') || 'Title (Arabic)'}
                defaultValue={activityForm.title_ar}
                className="dashboard-input"
                style={{ direction: 'rtl' }}
              />
            </div>

        {/* Content Section */}
        <div className="form-row">
          <div style={{ flex: 1, marginRight: '16px' }}>
            <textarea
              ref={descEnRef}
              placeholder={t('description_english') || 'Description (English)'}
              defaultValue={activityForm.description_en}
              rows={3}
              className="dashboard-input dashboard-textarea"
            />
          </div>
          
          <div style={{ flex: 1 }}>
            <textarea
              ref={descArRef}
              placeholder={t('description_arabic') || 'Description (Arabic)'}
              defaultValue={activityForm.description_ar}
              rows={3}
              className="dashboard-input dashboard-textarea"
              style={{ direction: 'rtl' }}
            />
          </div>
        </div>
            <div className="form-row">
              <UrlInput
                placeholder="https://example.com or activity-link"
                value={activityForm.url || ''}
                onChange={(e) => handleFieldChange('url', e.target.value)}
                fullWidth
              />
              <DatePicker
                type="datetime"
                value={activityForm.dueDate || ''}
                onChange={(iso) => handleFieldChange('dueDate', iso || undefined)}
                placeholder={t('pick_due_date') || 'Pick due date & time'}
                theme={theme}
              />
              <UrlInput
                placeholder="https://example.com/image.jpg"
                value={activityForm.image || ''}
                onChange={(e) => handleFieldChange('image', e.target.value)}
                fullWidth
              />
              <input
                type="number"
                placeholder="100"
                value={activityForm.maxScore || 100}
                onChange={(e) => {
                  if (activityForm.quizId && !activityForm.overrideQuizSettings) {
                    toast?.showInfo?.(t('max_score_synced_from_quiz') || 'Max score is synced from quiz. Enable "Override quiz settings" to edit.');
                    return;
                  }
                  handleFieldChange('maxScore', Math.max(1, Number.parseInt(e.target.value || '0', 10)));
                }}
                min={1}
                max={1000}
                step={1}
                style={{ width: '100%' }}
                disabled={activityForm.quizId && !activityForm.overrideQuizSettings}
              />
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
                  <div>
                    <ToggleSwitch
                      label={t('override_quiz_settings') || 'Override quiz settings (retake, difficulty, total marks)'}
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
            key="toggle-show"
            label={t('show_to_students') || 'Show to students'}
            checked={activityForm.show}
            onChange={(checked) => handleFieldChange('show', checked)}
          />
          <div key="toggle-allowRetake-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ToggleSwitch
              key="toggle-allowRetake"
              label={t('allow_retakes') || 'Allow retakes'}
              checked={activityForm.allowRetake || false}
              onChange={(checked) => {
                if (activityForm.quizId && !activityForm.overrideQuizSettings) {
                  toast?.showInfo?.(t('allow_retakes_synced_from_quiz') || 'Allow retakes is synced from quiz. Enable "Override quiz settings" to edit.');
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
            key="toggle-featured"
            label={t('featured') || 'Featured'}
            checked={activityForm.featured}
            onChange={(checked) => handleFieldChange('featured', checked)}
          />
          <ToggleSwitch
            key="toggle-optional"
            label={t('optional') || 'Optional (if off: Required)'}
            checked={activityForm.optional}
            onChange={(checked) => handleFieldChange('optional', checked)}
          />
          <ToggleSwitch
            key="toggle-requiresSubmission"
            label={t('requires_submission') || 'Requires Submission'}
            checked={activityForm.requiresSubmission}
            onChange={(checked) => handleFieldChange('requiresSubmission', checked)}
          />
        </div>
        
        {/* Email Notification Options */}

          <ToggleSwitch
            key="toggle-sendEmail"
            label={t('send_email_to_students') || 'Send email to students'}
            checked={emailOptions.sendEmail}
            onChange={(checked) => handleEmailOptionChange('sendEmail', checked)}
          />
          {emailOptions.sendEmail && (
        <div>
              <small>{t('language') || 'Language'}</small>
              <Select
                searchable
                placeholder={t('language') || 'Language'}
                value={emailOptions.emailLang}
                onChange={(e) => handleEmailOptionChange('emailLang', e.target.value)}
                options={[
                  { value: 'en', label: lang === 'ar' ? 'الإنجليزية' : 'English' },
                  { value: 'ar', label: lang === 'ar' ? 'العربية' : 'Arabic' },
                  { value: 'both', label: lang === 'ar' ? 'ثنائي اللغة' : 'Bilingual' }
                ]}
              />
            </div>
          )}

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
      
      {/* Filters */}
      <div className="filters-container" style={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: '1rem', 
        marginBottom: '1rem', 
        background: isDark ? '#1f2937' : '#f8f9fa', 
        padding: '1rem', 
        borderRadius: 12, 
        border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
        boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.05)', 
        width: '100%' 
      }}>
        {/* First row: Program, Subject, Class filters - spanning whole row */}
        <ProgramsSelect
          programs={programs}
          subjects={subjects}
          classes={classes}
          selectedProgram={activityProgramFilter}
          selectedSubject={activitySubjectFilter}
          selectedClass={activityClassFilter}
          onProgramChange={(programId) => setActivityProgramFilter(programId)}
          onSubjectChange={(subjectId) => setActivitySubjectFilter(subjectId)}
          onClassChange={(classId) => setActivityClassFilter(classId)}
          showClass={true}
          showLabels={false}
          style={{ width: '100%' }}
        />
        
        {/* Second row: Type and Difficulty filters */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Select
            value={activityTypeFilter || ''}
            onChange={(e) => setActivityTypeFilter(e.target.value)}
            options={[
              { value: '', label: t('all_types') || 'All Types', icon: getThemedIcon('ui', 'filter', 16, theme) },
              ...getActivityTypeOptionsForDropdown(theme, lang)
            ]}
            placeholder={t('all_types') || 'All Types'}
            style={{ minWidth: '200px' }}
          />
          <Select
            value={activityDifficultyFilter || ''}
            onChange={(e) => setActivityDifficultyFilter(e.target.value)}
            options={[
              { value: '', label: t('all_difficulties') || 'All Difficulties', icon: getThemedIcon('ui', 'filter', 16, theme) },
              ...getDifficultyOptionsForDropdown(theme, lang)
            ]}
            placeholder={t('all_difficulties') || 'All Difficulties'}
            style={{ minWidth: '200px' }}
          />
        </div>
        
        {/* Third row: Title and Description filters */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Input
            value={activityTitleEnFilter}
            onChange={(e) => setActivityTitleEnFilter(e.target.value)}
            placeholder={lang === 'ar' ? 'بحث بالعنوان (إنجليزي)' : 'Search by Title (English)'}
            style={{ minWidth: '250px' }}
            prefixIcon={getThemedIcon('ui', 'search', 16, theme)}
          />
          
          <Input
            value={activityTitleArFilter}
            onChange={(e) => setActivityTitleArFilter(e.target.value)}
            placeholder={lang === 'ar' ? 'بحث بالعنوان (عربي)' : 'Search by Title (Arabic)'}
            style={{ minWidth: '250px' }}
            prefixIcon={getThemedIcon('ui', 'search', 16, theme)}
          />
          
          <Input
            value={activityDescriptionEnFilter}
            onChange={(e) => setActivityDescriptionEnFilter(e.target.value)}
            placeholder={lang === 'ar' ? 'بحث بالوصف (إنجليزي)' : 'Search by Description (English)'}
            style={{ minWidth: '250px' }}
            prefixIcon={getThemedIcon('ui', 'file_text', 16, theme)}
          />
          
          <Input
            value={activityDescriptionArFilter}
            onChange={(e) => setActivityDescriptionArFilter(e.target.value)}
            placeholder={lang === 'ar' ? 'بحث بالوصف (عربي)' : 'Search by Description (Arabic)'}
            style={{ minWidth: '250px' }}
            prefixIcon={getThemedIcon('ui', 'file_text', 16, theme)}
          />
        </div>
      </div>
      
      {(activityProgramFilter || activitySubjectFilter || activityClassFilter || activityTypeFilter || activityDifficultyFilter || activityTitleEnFilter || activityTitleArFilter || activityDescriptionEnFilter || activityDescriptionArFilter) && (
        <div style={{ 
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          marginBottom: '1rem',
          background: isDark ? '#1e3a8a' : '#eff6ff',
          border: isDark ? '1px solid #3b82f6' : '1px solid #bfdbfe',
          borderRadius: '9999px',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: isDark ? '#dbeafe' : '#1e40af'
        }}>
          {getThemedIcon('ui', 'filter', 14, theme)}
          {t('showing_filtered') || 'Showing'} {filteredActivities.length} {t('of') || 'of'} {activities.length} {t('activities') || 'Activities'}
        </div>
      )}
      
      {/* Summary Chips */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          padding: '0.5rem 0.75rem', 
          background: isDark ? '#1e3a8a' : '#f0f9ff', 
          border: isDark ? '1px solid #3b82f6' : '1px solid #bae6fd', 
          borderRadius: '9999px',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: isDark ? '#dbeafe' : '#0369a1'
        }}>
          {getThemedIcon('ui', 'target', 16, theme)}
          {activities.length} {t('total') || 'Total'}
        </div>
        
        {/* Activity Type Chips */}
        {Object.entries(ACTIVITY_TYPES).map(([key, type]) => {
          const config = getActivityTypeConfig(type, theme, lang);
          const count = activities.filter(a => a.type === type).length;
          if (count === 0) return null;
          return (
            <div key={type} style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              padding: '0.5rem 0.75rem', 
              background: isDark ? '#78350f' : '#fef3c7', 
              border: isDark ? '1px solid #92400e' : '1px solid #fde68a', 
              borderRadius: '9999px',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: isDark ? '#fef3c7' : '#92400e'
            }}>
              {getThemedIcon('ui', config.icon, 16, theme)}
              {count} {config.text}
            </div>
          );
        })}
        
        {/* Difficulty Chips */}
        {Object.entries(DIFFICULTY_TYPES).map(([key, difficulty]) => {
          const config = getDifficultyConfig(difficulty, theme, lang);
          const count = activities.filter(a => a.difficulty === difficulty).length;
          if (count === 0) return null;
          return (
            <div key={difficulty} style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              padding: '0.5rem 0.75rem', 
              background: isDark ? '#14532d' : '#f0fdf4', 
              border: isDark ? '1px solid #16a34a' : '1px solid #bbf7d0', 
              borderRadius: '9999px',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: isDark ? '#dcfce7' : '#166534'
            }}>
              {getThemedIcon('ui', config.icon, 16, theme)}
              {count} {config.text}
            </div>
          );
        })}
      </div>
      
      <div style={{ marginTop: '1rem' }}>
        <AdvancedDataGrid
          key={`activities-grid-${lang}`}
          rows={filteredActivities}
          getRowId={(row) => row.docId || row.id}
          direction={lang === 'ar' ? 'rtl' : 'ltr'}
          lang={lang}
          columns={gridColumns}
          pageSize={10}
          pageSizeOptions={[10, 20, 50, 100]}
          checkboxSelection
          exportFileName="activities"
          showExportButton
          exportLabel={t('export') || 'Export'}
          loadingOverlayMessage={loading ? "Loading..." : undefined}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={hideDeleteModal}
        onConfirm={handleDeleteConfirm}
        entityType={deleteModal.entityType}
        entityName={deleteModal.entityName}
        loading={loading}
        t={t}
      />
    </div>
  );
};

export default ActivitiesPage;
