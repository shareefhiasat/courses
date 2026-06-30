import React, { useState, useEffect, useMemo, useCallback, useRef, useLayoutEffect } from 'react';
import Joyride from 'react-joyride';
import TourTooltip from '@ui/TourTooltip/TourTooltip';
import { scheduleTourStart } from '@utils/tourScheduler';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@ui';
import { useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { AdvancedDataGrid, GridQuickFilterChips } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import { formatQatarStandard, formatQatarForInput, parseQatarFromInput, getQatarNow } from '@utils/qatarDate';
import { addResource, updateResource, deleteResource, getResources } from '@services/business/resourceService';
// import { notificationGateway } from '@services/business/notificationGateway'; // Removed - notifications now handled by backend
import { getEnrollments } from '@services/business/enrollmentService';
import { logActivity, ACTIVITY_LOG_TYPES } from '@services/other/activityLogger.jsx';
// import { NOTIFICATION_TRIGGERS } from '@constants/notificationTypes'; // Removed - notifications now handled by backend
import { getUserById } from '@services/business/userService';
import { useAuditGridColumns } from '@hooks/useAuditGridColumns.js';
import { Button, Input, Textarea, Select, ToggleSwitch, DatePicker, RichTextEditor } from '@ui';
import { DeleteModal, useDeleteModal } from '@ui';
import { getResourceTypeConfig, getResourceTypeOptions } from '@constants/dashboardTypes.jsx';
// OLD: import { RESOURCE_TYPES } from '@constants/dashboardTypes.jsx';
// NOW: Using database-driven resource types via getResourceTypes service
import { getCategories } from '@services/business/categoryService';
import { getResourceTypes } from '@services/business/resourceTypeService';
import { getAllPriorityTypes } from '@services/business/priorityTypesService.js';
import { ProgramsSelect } from '@ui';
import { getLocalizedName, createDropdownOptions } from '@utils/languageHelpers';
import { info, error, warn, debug } from '@services/utils/logger.js';

// Import all services at top level to prevent duplicate calls
import { getPrograms } from '@services/business/programService';
import { getSubjects } from '@services/business/subjectService';
import { getClasses } from '@services/business/classService';
import { getCourses } from '@services/business/courseService';
import { getUsers } from '@services/business/userService';

const ResourcesPage = () => {
  const { user } = useAuth();
  const { t, lang, isRTL } = useLang();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const uiToast = useToast();
  const toast = useMemo(() => ({
    showSuccess: uiToast.success,
    showError: uiToast.error,
    showInfo: uiToast.info,
  }), [uiToast.success, uiToast.error, uiToast.info]);

  // State management
  const [resources, setResources] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [resourceTypes, setResourceTypes] = useState([]);
  const [priorityTypes, setPriorityTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const { startLoading } = useGlobalLoading();
  
  // Filter state
  const [resourceProgramFilter, setResourceProgramFilter] = useState('');
  const [resourceSubjectFilter, setResourceSubjectFilter] = useState('');
  const [resourceClassFilter, setResourceClassFilter] = useState('');
  const [resourceTypeFilter, setResourceTypeFilter] = useState('');
  const [resourceCategoryFilter, setResourceCategoryFilter] = useState('');
  const [resourceTitleEnFilter, setResourceTitleEnFilter] = useState('');
  const [resourceTitleArFilter, setResourceTitleArFilter] = useState('');
  const [resourceDescriptionEnFilter, setResourceDescriptionEnFilter] = useState('');
  const [resourceDescriptionArFilter, setResourceDescriptionArFilter] = useState('');
  
  const [resourceForm, setResourceForm] = useState({ 
    title: '', 
    titleEn: '',
    titleAr: '',
    description: '', 
    descriptionEn: '',
    descriptionAr: '',
    url: '', 
    typeId: null, 
    dueDate: '', 
    optional: false, 
    featured: false, 
    programId: '', 
    subjectId: '', 
    classId: '', 
    categoryId: ''
  });
  
  const [editingResource, setEditingResource] = useState(null);
  const [resourceEmailOptions, setResourceEmailOptions] = useState({ sendEmail: false, createAnnouncement: false });
  const { deleteModal, showDeleteModal, hideDeleteModal } = useDeleteModal(t);

  // ── Guided Tour ──────────────────────────────────────────────────────────
  const [runTour, setRunTour] = useState(false);
  const tourSeenKey = `resourcesTourSeen_${lang}`;
  const tourSteps = useMemo(() => [
    { target: 'body', content: t('tour.resources_filters'), disableBeacon: true, placement: 'center' },
    { target: '[data-tour="resources-form"]', content: t('tour.resources_upload'), disableBeacon: true, placement: 'bottom' },
    { target: '[data-tour="resources-grid"]', content: t('tour.resources_grid'), disableBeacon: true, placement: 'top' },
    { target: '[data-tour="resources-grid"]', content: t('tour.resources_category'), disableBeacon: true, placement: 'top' },
    { target: '[data-tour="resources-grid"]', content: t('tour.resources_edit'), disableBeacon: true, placement: 'top' },
    { target: '[data-tour="resources-grid"]', content: t('tour.resources_delete'), disableBeacon: true, placement: 'top' },
    { target: '[data-tour="resources-grid"]', content: t('tour.resources_export'), disableBeacon: true, placement: 'top' },
  ], [lang, t]);
  useEffect(() => {
    const start = () => setRunTour(true);
    window.addEventListener('app:joyride', start);
    window.addEventListener('app:help', start);
    return () => { window.removeEventListener('app:joyride', start); window.removeEventListener('app:help', start); };
  }, []);
  useEffect(() => scheduleTourStart(tourSeenKey, lang, () => setRunTour(true)), [tourSeenKey, lang]);
  const handleTourCallback = useCallback((data) => {
    const { status, action } = data || {};
    if (status === 'finished' || status === 'skipped' || action === 'close') { setRunTour(false); try { localStorage.setItem(tourSeenKey, 'true'); } catch {} }
  }, [tourSeenKey]);
  const TourTooltipComponent = useMemo(() => TourTooltip({ tourSeenKey }), [tourSeenKey]);
  // ──────────────────────────────────────────────────────────────────────────
  
  // Refs for text inputs — avoids re-rendering on every keystroke
  const titleEnRef = useRef(null);
  const titleArRef = useRef(null);
  const urlRef = useRef(null);
  
  // Sync refs when editing
  useEffect(() => {
    if (titleEnRef.current) titleEnRef.current.value = resourceForm.titleEn || '';
    if (titleArRef.current) titleArRef.current.value = resourceForm.titleAr || '';
    if (urlRef.current) urlRef.current.value = resourceForm.url || '';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingResource]);

  // Function to load classes filtered by subject
  const loadClassesBySubject = useCallback(async (subjectId) => {
    try {
      const params = subjectId && subjectId !== 'all' ? { subjectId } : {};
      const result = await getClasses(params);
      if (result.success) {
        setClasses(result.data || []);
      } else {
        error('Failed to load classes:', result.error);
        setClasses([]);
      }
    } catch (error) {
      error('Error loading classes:', error);
      setClasses([]);
    }
  }, []);

  const loadData = useCallback(async (isInitial = false) => {
    if (!isInitial) setLoading(true);
    try {
      const [
        programsResult,
        subjectsResult,
        coursesResult,
        usersResult,
        resourcesResult,
        categoriesResult,
        resourceTypesResult
      ] = await Promise.all([
        getPrograms(),
        getSubjects(),
        getCourses(),
        getUsers(),
        getResources(),
        getCategories(),
        getResourceTypes(),
      ]);
      
      // Load classes based on current subject filter
      await loadClassesBySubject(resourceSubjectFilter);
      
      if (programsResult.success) setPrograms(programsResult.data || []);
      if (subjectsResult.success) setSubjects(subjectsResult.data || []);
      if (coursesResult.success) setCourses(coursesResult.data || []);
      if (usersResult.success) setUsers(usersResult.data || []);
      if (resourcesResult.success) {
        setResources(resourcesResult.data || []);
      } else {
        error('Failed to load resources:', resourcesResult.error);
      }
      if (categoriesResult.success) setCategories(categoriesResult.data || []);
      if (resourceTypesResult.success) setResourceTypes(resourceTypesResult.data || []);
      else console.error('[ResourcesPage] Failed to load resource types:', resourceTypesResult.error);
    } catch (error) {
      error('Error loading data:', error);
      toast?.showError(t('error_loading_data') || 'Error loading data');
    } finally {
      if (!isInitial) setLoading(false);
    }
  }, [toast, t]);

  // Load data on component mount with Global Loading
  useLayoutEffect(() => {
    let stopLoading = null;

    const initialLoad = async () => {
      stopLoading = startLoading({ message: t('loading_resources') || 'Loading resources...' });
      await loadData(true);
      if (stopLoading) stopLoading();
      setLoading(false);
    };

    initialLoad();

    return () => {
      if (stopLoading) stopLoading();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload classes when subject filter changes
  useEffect(() => {
    loadClassesBySubject(resourceSubjectFilter);
  }, [resourceSubjectFilter, loadClassesBySubject]);

  const [resourceToDelete, setResourceToDelete] = useState(null);

  // Custom delete confirmation handler
  const handleDeleteConfirm = useCallback(async () => {
    // Get the resource from state
    const resource = resourceToDelete;
    
    // Safety check to ensure resource exists
    if (!resource || !(resource.docId || resource.id)) {
      error('Invalid resource provided to handleDeleteConfirm:', resource);
      toast?.showError(t('resources_error_deleting', { error: 'Invalid resource' }));
      hideDeleteModal();
      setResourceToDelete(null);
      return;
    }
    
    const resourceId = resource.docId || resource.id;
    
    // Optimistic update
    setResources(prev => prev.filter(r => (r.docId || r.id) !== resourceId));
    
    try {
      const result = await deleteResource(resourceId);
      if (result.success) {
        try {
          await logActivity(ACTIVITY_LOG_TYPES.RESOURCE_DELETED, {
            resourceId,
            resourceTitle: resource.title,
            resourceType: resource.resourceType?.nameEn || resource.typeId
          });
        } catch (e) { warn('Failed to log activity:', e); }
        toast?.showSuccess(t('resources_deleted_successfully'));
        await loadData();
      } else {
        // Rollback on error
        setResources(prev => [...prev, resource]);
        toast?.showError(t('resources_error_deleting', { error: result.error }));
      }
    } catch (error) {
      // Rollback on error
      setResources(prev => [...prev, resource]);
      error('Error deleting resource:', error);
      toast?.showError(t('resources_error_deleting', { error: error.message }));
    } finally {
      // Clean up
      hideDeleteModal();
      setResourceToDelete(null);
    }
  }, [resourceToDelete, toast, loadData, t, hideDeleteModal]);
  
  const handleDelete = useCallback((params) => {
    const resource = params.row;
    const resourceName = resource.titleEn || resource.title || resource.name || 'this resource';
    
    // Store the resource to delete in state
    setResourceToDelete(resource);
    showDeleteModal('resource', resourceName, handleDeleteConfirm);
  }, [showDeleteModal, handleDeleteConfirm]);

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
  
  // Read text values from refs into form state before submit
  // description_en and description_ar are controlled via state (WYSIWYG)
  const syncRefsToState = useCallback(() => {
    return {
      titleEn: titleEnRef.current?.value ?? resourceForm.titleEn,
      titleAr: titleArRef.current?.value ?? resourceForm.titleAr,
      descriptionEn: resourceForm.descriptionEn,
      descriptionAr: resourceForm.descriptionAr,
      url: urlRef.current?.value ?? resourceForm.url,
    };
  }, [resourceForm]);

  const handleResourceSubmit = useCallback(async (e) => {
    e.preventDefault();
    console.time('[PERF] handleResourceSubmit');
    setLoading(true);
    
    try {
      // Read text fields from refs
      const textValues = syncRefsToState();
      
      if (!textValues.titleEn?.trim() || !textValues.url?.trim()) {
        toast?.showError(t('resources_title_and_url_required'));
        setLoading(false);
        return;
      }

      // Prepare resource data with program/subject/class and Qatar timestamps
      const resourceData = {
        titleEn: textValues.titleEn.trim(),
        titleAr: textValues.titleAr?.trim() || '',
        descriptionEn: textValues.descriptionEn?.trim() || '',
        descriptionAr: textValues.descriptionAr?.trim() || '',
        url: textValues.url.trim(),
        typeId: resourceForm.typeId,
        programId: resourceForm.programId || null,
        subjectId: resourceForm.subjectId || null,
        classId: resourceForm.classId || null,
        categoryId: resourceForm.categoryId,
        dueDate: resourceForm.dueDate ? parseQatarFromInput(resourceForm.dueDate) : null,
        optional: resourceForm.optional || false,
        featured: resourceForm.featured || false
      };
      
      const result = editingResource && (editingResource.docId || editingResource.id) ?
        await updateResource(editingResource.docId || editingResource.id, resourceData, user, resourceEmailOptions) :
        await addResource(resourceData, user);

      if (result.success) {
        const resourceId = editingResource?.docId || editingResource?.id || result?.id;
        
        // Log activity
        try {
          await logActivity(editingResource ? ACTIVITY_LOG_TYPES.RESOURCE_UPDATED : ACTIVITY_LOG_TYPES.RESOURCE_CREATED, {
            resourceId,
            resourceTitle: resourceForm.title,
            resourceType: resourceTypes.find(rt => rt.id === resourceForm.typeId)?.nameEn || resourceForm.typeId
          });
        } catch (e) { }

        // Send notifications using notification gateway (only for new resources)
        if (!editingResource && resourceData.classId) {
          // Notifications are now handled by the backend
        }

        await loadData();
        setResourceForm({ title: '', titleEn: '', titleAr: '', description: '', descriptionEn: '', descriptionAr: '', url: '', typeId: null, dueDate: '', optional: false, featured: false, programId: '', subjectId: '', classId: '', categoryId: '' });
        if (titleEnRef.current) titleEnRef.current.value = '';
        if (titleArRef.current) titleArRef.current.value = '';
        setResourceEmailOptions({ sendEmail: false, createAnnouncement: false });
        setEditingResource(null);
        toast?.showSuccess(editingResource ? (t('resource_updated_successfully') || 'Resource updated successfully!') : (t('resource_created_successfully') || 'Resource created successfully!'));
      } else {
        toast?.showError(t('resources_error_updating_creating', { action: editingResource ? 'updating' : 'creating', error: result.error }));
      }
    } catch (error) {
      error('Error saving resource:', error);
      toast?.showError(t('resources_error_updating_creating', { action: editingResource ? 'updating' : 'creating', error: error.message }));
    } finally {
      setLoading(false);
      console.timeEnd('[PERF] handleResourceSubmit');
    }
  }, [resourceForm, editingResource, user, toast, t, syncRefsToState, loadData, resourceEmailOptions]);

  const handleEdit = useCallback((params) => {
    setEditingResource(params.row);
    setResourceForm({
      title: params.row.title || '',
      titleEn: params.row.titleEn || params.row.title || '',
      titleAr: params.row.titleAr || '',
      description: params.row.description || '',
      descriptionEn: params.row.descriptionEn || params.row.description || '',
      descriptionAr: params.row.descriptionAr || '',
      url: params.row.url || '',
      typeId: params.row.typeId,
      dueDate: params.row.dueDate ? formatQatarForInput(params.row.dueDate) : '',
      optional: !params.row.isRequired || false, // Invert isRequired to optional
      featured: params.row.featured || false,
      programId: params.row.programId || '',
      subjectId: params.row.subjectId || '',
      classId: params.row.classId || '',
      categoryId: params.row.categoryId || ''
    });
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingResource(null);
    setResourceForm({ title: '', titleEn: '', titleAr: '', description: '', descriptionEn: '', descriptionAr: '', url: '', typeId: null, dueDate: '', optional: false, featured: false, programId: '', subjectId: '', classId: '', categoryId: '' });
    if (titleEnRef.current) titleEnRef.current.value = '';
    if (titleArRef.current) titleArRef.current.value = '';
    setResourceEmailOptions({ sendEmail: false, createAnnouncement: false });
  }, []);

  const handleClearFilters = () => {
    setResourceProgramFilter('all');
    setResourceSubjectFilter('all');
    setResourceClassFilter('all');
    setResourceCategoryFilter('all');
  };

  const auditColumns = useAuditGridColumns({ users });

  const gridColumns = useMemo(() => [
    { 
      field: 'titleEn', 
      headerName: t('title_en_col'), 
      flex: 1, 
      minWidth: 200,
      renderCell: (params) => {
        const title = params?.row?.titleEn || params?.value || '';
        return title || (t('no_title') || 'No title');
      }
    },
    { 
      field: 'titleAr', 
      headerName: t('title_ar_col'), 
      flex: 1, 
      minWidth: 200,
      renderCell: (params) => {
        const title = params?.row?.titleAr || params?.value || '';
        return title || (t('no_title') || 'No title');
      }
    },
    {
      field: 'url', 
      headerName: t('resource_url'), 
      flex: 1, 
      minWidth: 250,
      renderCell: (params) => {
        const url = params?.row?.url || params?.value || '';
        if (!url) return '—';
        return (
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              color: 'var(--color-primary, #800020)', 
              textDecoration: 'underline',
              wordBreak: 'break-all'
            }}
          >
            {url.length > 50 ? url.substring(0, 50) + '...' : url}
          </a>
        );
      }
    },
    {
      field: 'resourceType', headerName: t('type_col'), width: 140,
      renderCell: (params) => {
        // Access the row data directly instead of relying on valueGetter
        const resourceType = params.row?.resourceType;
        
        if (!resourceType) {
          // No resource type assigned - show placeholder
          return (
            <span style={{ 
              color: 'var(--text-muted, #6b7280)',
              fontStyle: 'italic'
            }}>
              —
            </span>
          );
        }
        
        // Use the FK relationship data
        const name = lang === 'ar' ? resourceType.nameAr : resourceType.nameEn;
        const icon = getThemedIcon('ui', resourceType.icon || resourceType.code?.toLowerCase() || 'file', 16, theme);
        
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            {icon} {name}
          </span>
        );
      }
    },
    {
      field: 'categoryId',
      headerName: t('category'),
      width: 150,
      valueGetter: (params) => {
        const row = params?.row || {};
        return row.categoryId || params?.value || null;
      },
      renderCell: (params) => {
        const categoryId = params.value || params.row?.categoryId;
        
        if (!categoryId) {
          return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted, #6b7280)' }}>
              {getThemedIcon('ui', 'folder', 16, theme)}
              —
            </span>
          );
        }
        
        const category = categories.find(c => (c.docId || c.id) === categoryId);
        
        if (!category) {
          return <span>{categoryId}</span>;
        }
        
        const categoryName = lang === 'ar' ? (category.nameAr || category.nameEn) : (category.nameEn || category.nameAr);
        
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            {getThemedIcon('ui', category.icon || 'folder', 16, theme)}
            {categoryName || categoryId}
          </span>
        );
      }
    },
    {
      field: 'programId',
      headerName: t('program') || 'Program',
      width: 150,
      valueGetter: (params) => {
        const row = params?.row || {};
        return row.programId || params?.value || null;
      },
      renderCell: (params) => {
        const programId = params.value || params.row?.programId;
        // Convert to string for comparison to prevent NaN
        const normalizedProgramId = programId ? String(programId) : null;
        
        if (!normalizedProgramId) return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-success, #16a34a)' }}>
            {/*{getThemedIcon('ui', 'globe', 16, theme)} */}
            {t('public_label')}
          </span>
        );
        
        const program = programs.find(p => String(p.docId || p.id) === normalizedProgramId);
        if (!program) return '—';
        const programName = lang === 'ar' ? (program.nameAr || program.nameEn) : (program.nameEn || program.nameAr);
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            {/*{getThemedIcon('ui', 'target', 16, theme)} */}
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
        return row.subjectId || params?.value || null;
      },
      renderCell: (params) => {
        const subjectId = params.value || params.row?.subjectId;
        if (!subjectId) return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted, #6b7280)' }}>
            {/*{getThemedIcon('ui', 'book_open', 16, theme)} */}
            —
          </span>
        );
        const subject = subjects.find(s => (s.docId || s.id) === subjectId);
        if (!subject) return '—';
        const subjectName = lang === 'ar' ? (subject.nameAr || subject.nameEn) : (subject.nameEn || subject.nameAr);
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            {/*{getThemedIcon('ui', 'book_open', 16, theme)} */}
            {subjectName}
          </span>
        );
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
        const classId = params.value || params.row?.classId;
        if (!classId) return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted, #6b7280)' }}>
            {/*{getThemedIcon('ui', 'users', 16, theme)} */}
            —
          </span>
        );
        const classItem = classes.find(c => (c.docId || c.id) === classId);
        if (!classItem) return params.value;
        const className = lang === 'ar' 
          ? (classItem.nameAr || classItem.nameEn || classItem.name) 
          : (classItem.nameEn || classItem.nameAr || classItem.name);
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            {/*{getThemedIcon('ui', 'users', 16, theme)} */}
            {className}{classItem.code ? ` (${classItem.code})` : ''}
          </span>
        );
      }
    },
    {
      field: 'dueDate', headerName: t('due_date_col'), width: 180,
      valueGetter: (params) => params.value,
      renderCell: (params) => {
        if (!params.value) return (t('no_deadline') || 'No deadline');
        return formatQatarStandard(params.value);
      }
    },
    {
      field: 'optional', headerName: t('optional'), width: 100,
      renderCell: (params) => (
        <span style={{ 
          color: params.value ? 'var(--color-success, #16a34a)' : 'var(--color-danger, #dc3545)',
          fontWeight: params.value ? '600' : '400',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          {params.value ? getThemedIcon('ui', 'check', 16, theme) : getThemedIcon('ui', 'x_circle', 16, theme)}
        </span>
      )
    },
    {
      field: 'featured', headerName: t('featured'), width: 100,
      renderCell: (params) => (
        <span style={{ 
          color: params.value ? 'var(--color-warning, #ffc107)' : 'var(--text-muted, #6b7280)',
          fontWeight: params.value ? '600' : '400',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          {params.value ? getThemedIcon('ui', 'star', 16, theme) : '—'}
        </span>
      )
    },
    ...auditColumns,
    {
      field: 'actions', headerName: t('actions') || 'Actions', width: 200, sortable: false, filterable: false,
      renderCell: (params) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button 
            size="sm" 
            variant="ghost" 
            className="editHover" 
            icon={getThemedIcon('ui', 'edit', 16, theme)} 
            onClick={() => handleEdit(params)}
          >
            {t('edit') || 'Edit'}
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="deleteHover" 
            icon={getThemedIcon('ui', 'trash', 16, theme)} 
            style={{ color: '#dc2626' }} 
            onClick={() => handleDelete(params)}
          >
            {t('delete') || 'Delete'}
          </Button>
        </div>
      )
    }
  ], [programs, subjects, classes, courses, theme, lang, t, handleEdit, handleDelete, users, auditColumns]);

  const filteredResources = resources.filter(r => {
    // Apply type filter first (before public resources check)
    if (resourceTypeFilter && r.typeId !== parseInt(resourceTypeFilter)) {
      return false;
    }
    
    // If resource has no program/subject/class, it's public and should be included
    if (!r.programId && !r.subjectId && !r.classId && !r.courseId) {
      return true;
    }
    
    if (resourceClassFilter && r.classId !== resourceClassFilter) {
      return false;
    }
    if (resourceSubjectFilter && r.subjectId !== resourceSubjectFilter) {
      return false;
    }
    if (resourceProgramFilter && r.programId !== resourceProgramFilter) {
      return false;
    }
    if (resourceCategoryFilter && r.categoryId !== resourceCategoryFilter) {
      return false;
    }
    
    // Text search filters
    if (resourceTitleEnFilter && (!r.titleEn || !r.titleEn.toLowerCase().includes(resourceTitleEnFilter.toLowerCase()))) return false;
    if (resourceTitleArFilter && (!r.titleAr || !r.titleAr.includes(resourceTitleArFilter))) return false;
    if (resourceDescriptionEnFilter && (!r.descriptionEn || !r.descriptionEn.toLowerCase().includes(resourceDescriptionEnFilter.toLowerCase()))) return false;
    if (resourceDescriptionArFilter && (!r.descriptionAr || !r.descriptionAr.includes(resourceDescriptionArFilter))) return false;
    
    return true;
  });

  return (
    <div className="resources-tab">
      <Joyride continuous run={runTour} steps={tourSteps} callback={handleTourCallback} scrollOffset={100} scrollToFirstStep showSkipButton showProgress tooltipComponent={TourTooltipComponent}
        locale={{ back: t('tour_back'), close: t('tour_close'), last: t('tour_finish'), next: t('tour_next'), skip: t('tour_skip') }}
        styles={{ options: { primaryColor: 'var(--color-primary,#800020)', textColor: theme === 'dark' ? '#e5e7eb' : '#111', backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', zIndex: 10000 } }}
      />
      {editingResource && (
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
          {getThemedIcon('ui', 'edit', 16, theme)} {t('editing_resource') || 'Editing Resource'}: {editingResource.title || editingResource.titleEn}
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'0.5rem' }}>
        
      </div>
      <form data-tour="resources-form" onSubmit={handleResourceSubmit} className="dashboard-form">
        {/* Basic Info Section */}
        <div className="form-row wide-cols">
          <ProgramsSelect
            programs={programs}
            subjects={subjects}
            classes={classes}
            selectedProgram={resourceForm.programId}
            selectedSubject={resourceForm.subjectId}
            selectedClass={resourceForm.classId}
            onProgramChange={handleDropdownChange(setResourceForm, 'programId', ['subjectId', 'classId'])}
            onSubjectChange={handleDropdownChange(setResourceForm, 'subjectId', ['classId'])}
            onClassChange={handleDropdownChange(setResourceForm, 'classId')}
            showLabels={false}
          />
        </div>

        <div className="form-row">
          <Select
            searchable
            placeholder={t('category_optional') || 'Category (Optional)'}
            value={resourceForm.categoryId ? String(resourceForm.categoryId) : ''}
            onChange={(e) => setResourceForm({ ...resourceForm, categoryId: e.target.value ? parseInt(e.target.value) : null })}
            options={[
              { value: '', label: t('no_category') || 'No Category', icon: getThemedIcon('ui', 'folder', 16, theme) },
              ...categories.map(category => ({
                value: String(category.id),
                label: getLocalizedName(category, lang),
                icon: getThemedIcon('ui', category.icon || 'folder', 16, theme)
              }))
            ]}
          />
          <Select
            searchable
            placeholder={t('resource_type_optional') || 'Resource Type (Optional)'}
            value={resourceForm.typeId ? String(resourceForm.typeId) : ''}
            onChange={(e) => setResourceForm({ ...resourceForm, typeId: e.target.value ? parseInt(e.target.value) : null })}
            options={resourceTypes.length > 0 
              ? resourceTypes.map(resourceType => ({
                  value: String(resourceType.id),
                  label: getLocalizedName(resourceType, lang),
                  icon: getThemedIcon('ui', resourceType.icon || 'file', 16, theme)
                }))
              : getResourceTypeOptions(theme)
            }
          />
        </div>

        <div className="form-row">
          <Input
            type="text"
            placeholder={t('resource_title') + ' (EN)'}
            ref={titleEnRef}
            defaultValue={resourceForm.titleEn || ''}
            required
          />
          <Input
            type="text"
            placeholder={t('resource_title') + ' (AR)'}
            ref={titleArRef}
            defaultValue={resourceForm.titleAr || ''}
          />
        </div>

        {/* Content Section - WYSIWYG */}
        <div className="form-row">
          <div style={{ flex: 1, marginInlineEnd: '16px' }}>
            <RichTextEditor
              value={resourceForm.descriptionEn}
              onChange={(html) => setResourceForm(prev => ({ ...prev, descriptionEn: html }))}
              placeholder={t('resource_description') + ' (EN)'}
              height={100}
              dir="ltr"
            />
          </div>
          <div style={{ flex: 1 }}>
            <RichTextEditor
              value={resourceForm.descriptionAr}
              onChange={(html) => setResourceForm(prev => ({ ...prev, descriptionAr: html }))}
              placeholder={t('resource_description') + ' (AR)'}
              height={100}
              dir="rtl"
            />
          </div>
        </div>

        <div className="form-row">
          <input
            ref={urlRef}
            type="url"
            placeholder={t('resource_url') || 'Resource URL*'}
            defaultValue={resourceForm.url}
            className="dashboard-input"
            required
          />
        </div>

        <div className="form-row">
          <DatePicker
            type="datetime"
            value={resourceForm.dueDate || ''}
            onChange={(iso) => setResourceForm({ ...resourceForm, dueDate: iso })}
            placeholder={t('due_date') + ' (' + t('optional') + ')'}
          />
        </div>

        {/* Settings Section */}
        <div className="form-row flex-row">
          <ToggleSwitch
            label={t('optional_resource')}
            checked={resourceForm.optional}
            onChange={(checked) => setResourceForm({ ...resourceForm, optional: checked })}
          />
          <ToggleSwitch
            label={t('featured_resource') || 'Featured Resource'}
            checked={resourceForm.featured}
            onChange={(checked) => setResourceForm({ ...resourceForm, featured: checked })}
          />
          {/* Email notification option hidden */}
          {/* <ToggleSwitch
            label={t('send_email_notification') || 'Send email notification'}
            checked={resourceEmailOptions.sendEmail}
            onChange={(checked) => setResourceEmailOptions({ ...resourceEmailOptions, sendEmail: checked })}
          /> */}
        </div>

        {/* Form Actions */}
        <div className="form-row flex-row">
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Button type="submit" variant="primary" loading={loading}>
              {(editingResource ? t('update') : t('save'))}
            </Button>
          </div>
        </div>
      </form>

      {/* Filters */}
      <div className="filters-container" style={{ 
        display: 'none', 
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
        {/* First row: Program, Subject, Class filters */}
        <ProgramsSelect
          programs={programs}
          subjects={subjects}
          classes={classes}
          selectedProgram={resourceProgramFilter}
          selectedSubject={resourceSubjectFilter}
          selectedClass={resourceClassFilter}
          onProgramChange={(value) => {
            console.log('🔍 Resources filter program change:', { value });
            setResourceProgramFilter(value);
          }}
          onSubjectChange={(value) => {
            console.log('🔍 Resources filter subject change:', { value });
            setResourceSubjectFilter(value);
          }}
          onClassChange={(value) => {
            console.log('🔍 Resources filter class change:', { value });
            setResourceClassFilter(value);
          }}
          showClass={true}
          showLabels={false}
          style={{ width: '100%' }}
        />
        
        {/* Second row: Type and Category filters */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Select
            value={resourceTypeFilter || ''}
            onChange={(e) => setResourceTypeFilter(e.target.value)}
            options={resourceTypes.length > 0 
              ? [{ value: '', label: t('all_types') || 'All Types', icon: getThemedIcon('ui', 'filter', 16, theme) }, 
                ...createDropdownOptions(resourceTypes, lang, item => item.id, (item, currentLang) => getLocalizedName(item, currentLang)).map(option => ({
                  ...option,
                  icon: getThemedIcon('ui', option.icon || 'file', 16, theme)
                }))]
              : getResourceTypeOptions(theme)
            }
            placeholder={t('all_types') || 'All Types'}
            style={{ minWidth: '300px', width: '300px' }}
          />
          
          <Select
            value={resourceCategoryFilter || ''}
            onChange={(e) => setResourceCategoryFilter(e.target.value)}
            options={categories.length > 0 
              ? [{ value: '', label: t('all_categories') || 'All Categories', icon: getThemedIcon('ui', 'folder', 16, theme) },
                ...categories.map(category => ({
                  value: String(category.id),
                  label: getLocalizedName(category, lang),
                  icon: getThemedIcon('ui', category.icon || 'folder', 16, theme)
                }))]
              : [{ value: '', label: lang === 'ar' ? 'جميع الفئات' : 'All Categories', icon: getThemedIcon('ui', 'folder', 16, theme) }]
            }
            placeholder={t('all_categories') || 'All Categories'}
            style={{ minWidth: '200px' }}
          />
        </div>
        
        {/* Third row: Title and Description filters */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Input
            value={resourceTitleEnFilter}
            onChange={(e) => setResourceTitleEnFilter(e.target.value)}
            placeholder={lang === 'ar' ? 'بحث بالعنوان (إنجليزي)' : 'Search by Title (English)'}
            style={{ minWidth: '250px' }}
            prefixIcon={getThemedIcon('ui', 'search', 16, theme)}
          />
          
          <Input
            value={resourceTitleArFilter}
            onChange={(e) => setResourceTitleArFilter(e.target.value)}
            placeholder={lang === 'ar' ? 'بحث بالعنوان (عربي)' : 'Search by Title (Arabic)'}
            style={{ minWidth: '250px' }}
            prefixIcon={getThemedIcon('ui', 'search', 16, theme)}
          />
          
          <Input
            value={resourceDescriptionEnFilter}
            onChange={(e) => setResourceDescriptionEnFilter(e.target.value)}
            placeholder={lang === 'ar' ? 'بحث بالوصف (إنجليزي)' : 'Search by Description (English)'}
            style={{ minWidth: '250px' }}
            prefixIcon={getThemedIcon('ui', 'file_text', 16, theme)}
          />
          
          <Input
            value={resourceDescriptionArFilter}
            onChange={(e) => setResourceDescriptionArFilter(e.target.value)}
            placeholder={lang === 'ar' ? 'بحث بالوصف (عربي)' : 'Search by Description (Arabic)'}
            style={{ minWidth: '250px' }}
            prefixIcon={getThemedIcon('ui', 'file_text', 16, theme)}
          />
        </div>
      </div>
      
      {(resourceProgramFilter || resourceSubjectFilter || resourceClassFilter || resourceTypeFilter || resourceCategoryFilter || resourceTitleEnFilter || resourceTitleArFilter || resourceDescriptionEnFilter || resourceDescriptionArFilter) && (
        <div style={{ 
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          marginBottom: '1rem',
          background: isDark ? '#1e3a8a' : '#eff6ff',
          border: isDark ? '1px solid #3b82f6' : '1px solid #bfdbfe',
          borderRadius: '9999px',
          fontSize: 'var(--font-size-sm)',
          fontWeight: '500',
          color: isDark ? '#dbeafe' : '#1e40af'
        }}>
          {getThemedIcon('ui', 'filter', 14, theme)}
          {t('showing_filtered') || 'Showing'} {filteredResources.length} {t('of') || 'of'} {resources.length} {t('resources') || 'Resources'}
        </div>
      )}

      <GridQuickFilterChips
        activeId={resourceTypeFilter ? String(resourceTypeFilter) : 'all'}
        onChange={(id) => setResourceTypeFilter(id === 'all' ? '' : id)}
        chips={[
          {
            id: 'all',
            label: lang === 'ar' ? 'إجمالي' : 'Total',
            count: resources.length,
            icon: getThemedIcon('ui', 'target', 16, theme),
            variant: 'blue',
          },
          ...resourceTypes.map((resourceType) => {
            const count = resources.filter((r) => r.typeId === resourceType.id).length;
            if (count === 0) return null;
            return {
              id: String(resourceType.id),
              label: lang === 'ar' ? resourceType.nameAr : resourceType.nameEn,
              count,
              icon: getThemedIcon('ui', resourceType.code?.toLowerCase() || 'file', 16, theme),
              variant: 'gray',
            };
          }).filter(Boolean),
        ]}
      />

      <div data-tour="resources-grid" style={{ marginTop: '1rem' }}>
        <AdvancedDataGrid
          gridId="resources"
          rows={filteredResources}
          getRowId={(row) => row.id?.toString() || row.docId?.toString()}
          columns={gridColumns}
          pageSize={50}
          pageSizeOptions={[10, 25, 50, 100]}
          checkboxSelection
          exportFileName="resources"
          showExportButton
          exportLabel={t('export') || 'Export'}
        />
      </div>

      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={hideDeleteModal}
        onConfirm={handleDeleteConfirm}
        entityType={deleteModal.entityType}
        entityName={deleteModal.entityName}
        t={t}
      />
    </div>
  );
};

export default ResourcesPage;
