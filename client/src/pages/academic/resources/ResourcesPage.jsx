import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@ui';
import { AdvancedDataGrid } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import { formatQatarStandard, formatQatarForInput, parseQatarFromInput, getQatarNow } from '@utils/qatarDate';
import { addResource, updateResource, deleteResource, getResources } from '@services/business/resourceService';
import { notificationGateway } from '@services/business/notificationGateway';
import { getEnrollments } from '@services/business/enrollmentService';
import { logActivity, ACTIVITY_LOG_TYPES } from '@services/other/activityLogger.jsx';
import { NOTIFICATION_TRIGGERS } from '@constants/notificationTypes';
import { getUserById } from '@services/business/userService';
import { Button, Input, Textarea, Select, ToggleSwitch, DatePicker } from '@ui';
import DeleteModal, { useDeleteModal } from '@ui/DeleteModal/DeleteModal';
import { getResourceTypeConfig, getResourceTypeOptions, RESOURCE_TYPES } from '@constants/dashboardTypes.jsx';
import { getCategories } from '@services/business/categoryService';
import ProgramsSelect from '@ui/Select/ProgramsSelect';
import logger from '@utils/logger';

// Import all services at top level to prevent duplicate calls
import { getPrograms } from '@services/business/programService';
import { getSubjects } from '@services/business/subjectService';
import { getClasses } from '@services/business/classService';
import { getCourses } from '@services/business/courseService';
import { getUsers } from '@services/business/userService';

const ResourcesPage = () => {
  const { user } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const uiToast = useToast();
  const toast = {
    showSuccess: uiToast.success,
    showError: uiToast.error,
    showInfo: uiToast.info,
  };

  // State management
  const [resources, setResources] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  
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
    title_en: '',
    title_ar: '',
    description: '', 
    description_en: '',
    description_ar: '',
    url: '', 
    type: 'link', 
    dueDate: '', 
    optional: false, 
    featured: false, 
    programId: '', 
    subjectId: '', 
    classId: '', 
    courseId: '',
    categoryId: ''
  });
  
  const [editingResource, setEditingResource] = useState(null);
  const [resourceEmailOptions, setResourceEmailOptions] = useState({ sendEmail: false, createAnnouncement: false });
  const { deleteModal, deleteResource: deleteResourceModal, handleDeleteConfirm, hideDeleteModal } = useDeleteModal(t);
  
  // Refs for text inputs — avoids re-rendering on every keystroke
  const titleEnRef = useRef(null);
  const titleArRef = useRef(null);
  const descEnRef = useRef(null);
  const descArRef = useRef(null);
  const urlRef = useRef(null);
  
  // Sync refs when editing
  useEffect(() => {
    if (titleEnRef.current) titleEnRef.current.value = resourceForm.title_en || '';
    if (titleArRef.current) titleArRef.current.value = resourceForm.title_ar || '';
    if (descEnRef.current) descEnRef.current.value = resourceForm.description_en || '';
    if (descArRef.current) descArRef.current.value = resourceForm.description_ar || '';
    if (urlRef.current) urlRef.current.value = resourceForm.url || '';
  }, [editingResource]);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        programsResult,
        subjectsResult,
        classesResult,
        coursesResult,
        usersResult,
        resourcesResult,
        categoriesResult
      ] = await Promise.all([
        getPrograms(),
        getSubjects(),
        getClasses(),
        getCourses(),
        getUsers(),
        getResources(),
        getCategories()
      ]);
      
      if (programsResult.success) setPrograms(programsResult.data || []);
      if (subjectsResult.success) setSubjects(subjectsResult.data || []);
      if (classesResult.success) setClasses(classesResult.data || []);
      if (coursesResult.success) setCourses(coursesResult.data || []);
      if (usersResult.success) setUsers(usersResult.data || []);
      if (resourcesResult.success) {
        setResources(resourcesResult.data || []);
      } else {
        logger.error('Failed to load resources:', resourcesResult.error);
      }
      if (categoriesResult.success) setCategories(categoriesResult.data || []);
    } catch (error) {
      logger.error('Error loading data:', error);
      toast?.showError(t('error_loading_data') || 'Error loading data');
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

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
  const syncRefsToState = useCallback(() => {
    return {
      title_en: titleEnRef.current?.value ?? resourceForm.title_en,
      title_ar: titleArRef.current?.value ?? resourceForm.title_ar,
      description_en: descEnRef.current?.value ?? resourceForm.description_en,
      description_ar: descArRef.current?.value ?? resourceForm.description_ar,
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
      
      if (!textValues.title_en?.trim() || !textValues.url?.trim()) {
        toast?.showError(t('title_and_url_required') || 'Title and URL are required');
        setLoading(false);
        return;
      }

      // Prepare resource data with program/subject/class and Qatar timestamps
      const resourceData = {
        ...resourceForm,
        ...textValues,
        title: textValues.title_en.trim(),
        title_en: textValues.title_en.trim(),
        title_ar: textValues.title_ar?.trim() || '',
        description: textValues.description_en?.trim() || '',
        description_en: textValues.description_en?.trim() || '',
        description_ar: textValues.description_ar?.trim() || '',
        url: textValues.url.trim(),
        programId: resourceForm.programId || null,
        subjectId: resourceForm.subjectId || null,
        classId: resourceForm.classId || null,
        courseId: resourceForm.courseId || null,
        dueDate: resourceForm.dueDate ? parseQatarFromInput(resourceForm.dueDate) : null,
        updatedAt: getQatarNow(),
        updatedBy: user?.id || 'unknown'
      };
      if (!editingResource) {
        resourceData.createdAt = getQatarNow();
        resourceData.createdBy = user?.id || 'unknown';
      }
      
      const result = editingResource && editingResource.docId ?
        await updateResource(editingResource.docId, resourceData, resourceEmailOptions) :
        await addResource(resourceData);

      if (result.success) {
        const resourceId = editingResource?.docId || result?.id;
        
        // Log activity
        try {
          await logActivity(editingResource ? ACTIVITY_LOG_TYPES.RESOURCE_UPDATED : ACTIVITY_LOG_TYPES.RESOURCE_CREATED, {
            resourceId,
            resourceTitle: resourceForm.title,
            resourceType: resourceForm.type
          });
        } catch (e) { }

        // Send notifications using notification gateway (only for new resources)
        if (!editingResource && resourceData.classId) {
          try {
            const enrollmentsResult = await getEnrollments({ classId: resourceData.classId });
            const studentIds = (enrollmentsResult.data || []).map(e => e.userId);
            
            for (const studentId of studentIds) {
              const { data: student } = await getUserById(studentId);
              if (student && student.email) {
                await notificationGateway.send(NOTIFICATION_TRIGGERS.RESOURCE_NEW, {
                  userId: studentId,
                  role: 'student',
                  classId: resourceData.classId,
                  email: student.email,
                  lang: student.preferredLanguage || 'en',
                  variables: {
                    studentName: student.displayName || student.name || 'Student',
                    resourceTitle: resourceForm.title,
                    resourceType: resourceForm.type || 'document',
                    resourceUrl: resourceForm.url
                  }
                });
              }
            }
          } catch (notifyError) {
            console.warn('Failed to send resource notifications:', notifyError);
          }
        }

        await loadData();
        setResourceForm({ title: '', title_en: '', title_ar: '', description: '', description_en: '', description_ar: '', url: '', type: 'link', dueDate: '', optional: false, featured: false, programId: '', subjectId: '', classId: '', courseId: '', categoryId: '' });
        if (titleEnRef.current) titleEnRef.current.value = '';
        if (titleArRef.current) titleArRef.current.value = '';
        if (descEnRef.current) descEnRef.current.value = '';
        if (descArRef.current) descArRef.current.value = '';
        setResourceEmailOptions({ sendEmail: false, createAnnouncement: false });
        setEditingResource(null);
        toast?.showSuccess(editingResource ? (t('resource_updated_successfully') || 'Resource updated successfully!') : (t('resource_created_successfully') || 'Resource created successfully!'));
      } else {
        toast?.showError(`Error ${editingResource ? 'updating' : 'creating'} resource: ` + result.error);
      }
    } catch (error) {
      logger.error('Error saving resource:', error);
      toast?.showError(`Error ${editingResource ? 'updating' : 'creating'} resource: ` + error.message);
    } finally {
      setLoading(false);
      console.timeEnd('[PERF] handleResourceSubmit');
    }
  }, [resourceForm, editingResource, user, toast, t, syncRefsToState, loadData]);

  const handleEdit = useCallback((params) => {
    setEditingResource(params.row);
    setResourceForm({
      title: params.row.title || '',
      title_en: params.row.title_en || params.row.title || '',
      title_ar: params.row.title_ar || '',
      description: params.row.description || '',
      description_en: params.row.description_en || params.row.description || '',
      description_ar: params.row.description_ar || '',
      url: params.row.url || '',
      type: params.row.type || 'link',
      dueDate: params.row.dueDate ? formatQatarForInput(params.row.dueDate) : '',
      optional: params.row.optional || false,
      featured: params.row.featured || false,
      programId: params.row.programId || '',
      subjectId: params.row.subjectId || '',
      classId: params.row.classId || '',
      courseId: params.row.courseId || '',
      categoryId: params.row.categoryId || ''
    });
  }, []);

  const handleDelete = useCallback((params) => {
    const resource = params.row;
    deleteResourceModal(resource, async () => {
      // Optimistic update
      setResources(prev => prev.filter(r => (r.docId || r.id) !== (resource.docId || resource.id)));
      
      try {
        const result = await deleteResource(resource.docId);
        if (result.success) {
          try {
            await logActivity(ACTIVITY_LOG_TYPES.RESOURCE_DELETED, {
              resourceId: resource.docId,
              resourceTitle: resource.title,
              resourceType: resource.type
            });
          } catch (e) { logger.warn('Failed to log activity:', e); }
          toast?.showSuccess('Resource deleted successfully!');
          await loadData();
        } else {
          // Rollback on error
          setResources(prev => [...prev, resource]);
          toast?.showError('Error deleting resource: ' + result.error);
        }
      } catch (error) {
        // Rollback on error
        setResources(prev => [...prev, resource]);
        logger.error('Error deleting resource:', error);
        toast?.showError('Error deleting resource: ' + error.message);
      }
    });
  }, [deleteResourceModal, toast, loadData]);

  const handleCancelEdit = useCallback(() => {
    setEditingResource(null);
    setResourceForm({ title: '', title_en: '', title_ar: '', description: '', description_en: '', description_ar: '', url: '', type: 'link', dueDate: '', optional: false, featured: false, programId: '', subjectId: '', classId: '', courseId: '', categoryId: '' });
    if (titleEnRef.current) titleEnRef.current.value = '';
    if (titleArRef.current) titleArRef.current.value = '';
    if (descEnRef.current) descEnRef.current.value = '';
    if (descArRef.current) descArRef.current.value = '';
    setResourceEmailOptions({ sendEmail: false, createAnnouncement: false });
  }, []);

  const handleClearFilters = () => {
    setResourceProgramFilter('all');
    setResourceSubjectFilter('all');
    setResourceClassFilter('all');
    setResourceCategoryFilter('all');
  };

  const gridColumns = useMemo(() => [
    { 
      field: 'title_en', 
      headerName: 'Title (EN)', 
      flex: 1, 
      minWidth: 200,
      renderCell: (params) => {
        const title = params?.row?.title_en || params?.value || '';
        return title || (t('no_title') || 'No title');
      }
    },
    { 
      field: 'title_ar', 
      headerName: 'Title (AR)', 
      flex: 1, 
      minWidth: 200,
      renderCell: (params) => {
        const title = params?.row?.title_ar || params?.value || '';
        return title || (t('no_title') || 'No title');
      }
    },
    {
      field: 'url', 
      headerName: 'Resource URL', 
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
      field: 'type', headerName: t('type_col'), width: 140,
      renderCell: (params) => {
        const config = getResourceTypeConfig(params.value, theme);
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            {config.icon} {config.label}
          </span>
        );
      }
    },
    {
      field: 'courseId', headerName: t('category') || 'Category', width: 150,
      valueGetter: (params) => {
        const row = params?.row || {};
        return row.courseId || params?.value || null;
      },
      renderCell: (params) => {
        const courseId = params.value || params.row?.courseId;
        if (!courseId) return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted, #6b7280)' }}>
            {/*{getThemedIcon('ui', 'tag', 16, theme)} */}
            —
          </span>
        );
        const course = courses.find(c => (c.docId || c.id) === courseId);
        if (!course) return '—';
        const courseName = lang === 'ar' ? (course.name_ar || course.name_en) : (course.name_en || course.name_ar);
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            {getThemedIcon('ui', 'tag', 16, theme)} {courseName}
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
        if (!programId) return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-success, #16a34a)' }}>
            {/*{getThemedIcon('ui', 'globe', 16, theme)} */}
            Public
          </span>
        );
        const program = programs.find(p => (p.docId || p.id) === programId);
        if (!program) return '—';
        const programName = lang === 'ar' ? (program.name_ar || program.name_en) : (program.name_en || program.name_ar);
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
        const subjectName = lang === 'ar' ? (subject.name_ar || subject.name_en) : (subject.name_en || subject.name_ar);
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
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            {/*{getThemedIcon('ui', 'users', 16, theme)} */}
            {classItem.name}{classItem.code ? ` (${classItem.code})` : ''}
          </span>
        );
      }
    },
    {
      field: 'description', headerName: t('description_col'), flex: 1, minWidth: 200,
      renderCell: (params) => params.value ? (params.value.length > 50 ? params.value.substring(0, 50) + '...' : params.value) : (t('no_description') || 'No description')
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
      field: 'optional', headerName: 'Optional', width: 100,
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
      field: 'featured', headerName: 'Featured', width: 100,
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
    {
      field: 'sendEmail', headerName: 'Email Sent', width: 120,
      renderCell: (params) => {
        // Check if email was sent (this might be stored differently, but for now we'll use the form state)
        const sendEmail = params?.row?.sendEmail || false;
        return (
          <span style={{ 
            color: sendEmail ? 'var(--color-info, #17a2b8)' : 'var(--text-muted, #6b7280)',
            fontWeight: sendEmail ? '600' : '400'
          }}>
            {sendEmail ? '📧' : '—'}
          </span>
        );
      }
    },
    {
      field: 'createdAt', headerName: 'Created', width: 180,
      valueGetter: (params) => params.value,
      renderCell: (params) => {
        if (!params.value) return 'Unknown';
        return formatQatarStandard(params.value);
      }
    },
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
  ], [programs, subjects, classes, courses, theme, lang, t]);

  const filteredResources = resources.filter(r => {
    // Apply type filter first (before public resources check)
    if (resourceTypeFilter && r.type !== resourceTypeFilter) {
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
    if (resourceTitleEnFilter && (!r.title_en || !r.title_en.toLowerCase().includes(resourceTitleEnFilter.toLowerCase()))) return false;
    if (resourceTitleArFilter && (!r.title_ar || !r.title_ar.includes(resourceTitleArFilter))) return false;
    if (resourceDescriptionEnFilter && (!r.description_en || !r.description_en.toLowerCase().includes(resourceDescriptionEnFilter.toLowerCase()))) return false;
    if (resourceDescriptionArFilter && (!r.description_ar || !r.description_ar.includes(resourceDescriptionArFilter))) return false;
    
    return true;
  });

  return (
    <div className="resources-tab">
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
          {getThemedIcon('ui', 'edit', 16, theme)} {t('editing_resource') || 'Editing Resource'}: {editingResource.title || editingResource.title_en}
        </div>
      )}

      
      <form onSubmit={handleResourceSubmit} className="dashboard-form">
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
          <Select
            searchable
            placeholder={t('category_optional') || 'Category (Optional)'}
            value={resourceForm.categoryId || ''}
            onChange={(e) => setResourceForm({ ...resourceForm, categoryId: e.target.value })}
            options={[
              { value: '', label: t('no_category') || 'No Category', icon: getThemedIcon('ui', 'folder', 16, theme) },
              ...categories.map(category => ({
                value: category.docId,
                label: category.name || category.name_en || 'Unnamed Category',
                icon: getThemedIcon('ui', category.icon || 'folder', 16, theme)
              })).sort((a, b) => a.label.localeCompare(b.label))
            ]}
          />
        </div>

        <div className="form-row">
          <Input
            type="text"
            placeholder={t('resource_title') + ' (EN)'}
            ref={titleEnRef}
            defaultValue={resourceForm.title_en || ''}
            required
          />
          <Input
            type="text"
            placeholder={t('resource_title') + ' (AR)'}
            ref={titleArRef}
            defaultValue={resourceForm.title_ar || ''}
          />
          <Select
            searchable
            placeholder={t('resource_type') || 'Resource Type'}
            value={resourceForm.type}
            onChange={(e) => setResourceForm({ ...resourceForm, type: e.target.value })}
            options={getResourceTypeOptions(theme)}
          />
        </div>

        {/* Content Section */}
        <div className="form-row">
          <div style={{ flex: 1, marginRight: '16px' }}>
            <textarea
              ref={descEnRef}
              placeholder={t('resource_description') + ' (EN)'}
              defaultValue={resourceForm.description_en || ''}
              rows={3}
              style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '4px', resize: 'vertical' }}
            />
          </div>
          
          <div style={{ flex: 1 }}>
            <textarea
              ref={descArRef}
              placeholder={t('resource_description') + ' (AR)'}
              defaultValue={resourceForm.description_ar || ''}
              rows={3}
              style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '4px', resize: 'vertical' }}
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
          <ToggleSwitch
            label={t('send_email_notification') || 'Send email notification'}
            checked={resourceEmailOptions.sendEmail}
            onChange={(checked) => setResourceEmailOptions({ ...resourceEmailOptions, sendEmail: checked })}
          />
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
        {/* First row: Program, Subject, Class filters */}
        <ProgramsSelect
          programs={programs}
          subjects={subjects}
          classes={classes}
          selectedProgram={resourceProgramFilter}
          selectedSubject={resourceSubjectFilter}
          selectedClass={resourceClassFilter}
          onProgramChange={(programId) => setResourceProgramFilter(programId)}
          onSubjectChange={(subjectId) => setResourceSubjectFilter(subjectId)}
          onClassChange={(classId) => setResourceClassFilter(classId)}
          showClass={true}
          showLabels={false}
          style={{ width: '100%' }}
        />
        
        {/* Second row: Type and Category filters */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Select
            value={resourceTypeFilter || ''}
            onChange={(e) => setResourceTypeFilter(e.target.value)}
            options={getResourceTypeOptions(theme)}
            placeholder={t('all_types') || 'All Types'}
            style={{ minWidth: '300px', width: '300px' }}
          />
          
          <Select
            value={resourceCategoryFilter || ''}
            onChange={(e) => setResourceCategoryFilter(e.target.value)}
            options={[
              { value: '', label: lang === 'ar' ? 'جميع الفئات' : 'All Categories', icon: getThemedIcon('ui', 'folder', 16, theme) },
              ...categories.map(category => ({
                value: category.docId,
                label: category.name || category.name_en || 'Unnamed Category',
                icon: getThemedIcon('ui', category.icon || 'folder', 16, theme)
              }))
            ]}
            placeholder={lang === 'ar' ? 'جميع الفئات' : 'All Categories'}
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
          fontSize: '0.875rem',
          fontWeight: '500',
          color: isDark ? '#dbeafe' : '#1e40af'
        }}>
          {getThemedIcon('ui', 'filter', 14, theme)}
          {t('showing_filtered') || 'Showing'} {filteredResources.length} {t('of') || 'of'} {resources.length} {t('resources') || 'Resources'}
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
          {resources.length} {lang === 'ar' ? 'إجمالي' : 'Total'}
        </div>
        
        {/* Resource Type Chips - Only show if count > 0 */}
        {resources.filter(r => r.type === RESOURCE_TYPES.DOCUMENT).length > 0 && (
          <div style={{ 
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
            {getThemedIcon('ui', 'file_text', 16, theme)}
            {resources.filter(r => r.type === RESOURCE_TYPES.DOCUMENT).length} {lang === 'ar' ? 'مستندات' : 'Documents'}
          </div>
        )}
        
        {resources.filter(r => r.type === RESOURCE_TYPES.LINK).length > 0 && (
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            padding: '0.5rem 0.75rem', 
            background: isDark ? '#831843' : '#fce7f3', 
            border: isDark ? '1px solid #be185d' : '1px solid #fbcfe8', 
            borderRadius: '9999px',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: isDark ? '#fce7f3' : '#831843'
          }}>
            {getThemedIcon('ui', 'link', 16, theme)}
            {resources.filter(r => r.type === RESOURCE_TYPES.LINK).length} {lang === 'ar' ? 'روابط' : 'Links'}
          </div>
        )}
        
        {resources.filter(r => r.type === RESOURCE_TYPES.VIDEO).length > 0 && (
          <div style={{ 
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
            {getThemedIcon('ui', 'video', 16, theme)}
            {resources.filter(r => r.type === RESOURCE_TYPES.VIDEO).length} {lang === 'ar' ? 'فيديوهات' : 'Videos'}
          </div>
        )}
      </div>

      <div style={{ marginTop: '1rem' }}>
        <AdvancedDataGrid
          rows={filteredResources}
          getRowId={(row) => row.docId || row.id || Math.random().toString(36).substr(2, 9)}
          columns={gridColumns}
          pageSize={10}
          pageSizeOptions={[5, 10, 20, 50]}
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
