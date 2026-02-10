import React, { useState, useEffect } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useAuth } from '@contexts/AuthContext';
import { getThemedIcon } from '@constants/iconTypes';
import { addResource, updateResource, deleteResource, getResources } from '@firebaseServices/activityService';
import { notifyAllUsers, notifyUsersByClass } from '@firebaseServices/notificationService';
import { sendEmail } from '@firebaseServices/emailService';
import { getEnrollments } from '@firebaseServices/enrollmentService';
import { logActivity, ACTIVITY_LOG_TYPES } from '@firebaseServices/activityLogger.jsx';
import { formatQatarDate } from '@utils/timezone';
import { 
  Button, 
  Input, 
  Textarea, 
  Select, 
  AdvancedDataGrid, 
  useToast, 
  ToggleSwitch,
  DatePicker,
  UrlInput
} from '@ui';
import { RibbonTabs } from '@ui';
import { getResourceTypeConfig, getResourceTypeOptions } from '@constants/dashboardTypes.jsx';
import ProgramsSelect from '@ui/Select/ProgramsSelect';

// Import all services at top level to prevent duplicate calls
import { getPrograms } from '@firebaseServices/programService';
import { getSubjects } from '@firebaseServices/subjectService';
import { getClasses } from '@firebaseServices/classService';
import { getCourses } from '@firebaseServices/courseService';
import { getUsers } from '@firebaseServices/userService';

const ResourcesPage = () => {
  const { user } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();
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
  const [loading, setLoading] = useState(false);
  
  const [resourceForm, setResourceForm] = useState({ 
    title: '', 
    description: '', 
    url: '', 
    type: 'link', 
    dueDate: '', 
    optional: false, 
    featured: false, 
    programId: '', 
    subjectId: '', 
    classId: '', 
    courseId: '' 
  });
  
  const [editingResource, setEditingResource] = useState(null);
  const [activeResourceFormTab, setActiveResourceFormTab] = useState('basic');
  const [resourceEmailOptions, setResourceEmailOptions] = useState({ sendEmail: false, createAnnouncement: false });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, resource: null });
  
  const [resourceProgramFilter, setResourceProgramFilter] = useState('all');
  const [resourceSubjectFilter, setResourceSubjectFilter] = useState('all');
  const [resourceClassFilter, setResourceClassFilter] = useState('all');
  const [resourceCategoryFilter, setResourceCategoryFilter] = useState('all');

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load resources
      const resourcesResult = await getResources();
      if (resourcesResult.success) {
        setResources(resourcesResult.data || []);
      } else {
        console.error('🔍 [ResourcesPage] Failed to load resources:', resourcesResult.error);
      }

      // Load programs for dropdowns
      const programsResult = await getPrograms();
      if (programsResult.success) {
        setPrograms(programsResult.data || []);
      }

      // Load subjects for dropdowns
      const subjectsResult = await getSubjects();
      if (subjectsResult.success) {
        setSubjects(subjectsResult.data || []);
      }

      // Load classes for dropdowns
      const classesResult = await getClasses();
      if (classesResult.success) {
        setClasses(classesResult.data || []);
      }

      // Load courses for dropdowns
      const coursesResult = await getCourses();
      if (coursesResult.success) {
        setCourses(coursesResult.data || []);
      }

      // Load users for dropdowns
      const usersResult = await getUsers();
      if (usersResult.success) {
        setUsers(usersResult.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast?.showError(t('error_loading_data') || 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for dropdown options
  const activityProgramOptions = programs.map(program => ({
    value: program.id,
    label: program.name || program.title
  }));

  const activitySubjectOptions = subjects.map(subject => ({
    value: subject.id,
    label: subject.name || subject.title
  }));

  const activityClassOptions = classes.map(cls => ({
    value: cls.id,
    label: cls.name || cls.title
  }));

  const handleDropdownChange = (setState, field, resetFields = []) => (e) => {
    const value = e.target.value;
    setState(prev => {
      const newState = { ...prev, [field]: value };
      // Reset dependent fields
      resetFields.forEach(resetField => {
        newState[resetField] = '';
      });
      return newState;
    });
  };

  const handleResourceSubmit = async (e) => {
    e.preventDefault();
    if (!resourceForm.title.trim() || !resourceForm.url.trim()) {
      toast?.showError(t('title_and_url_required') || 'Title and URL are required');
      return;
    }

    setLoading(true);
    try {
      // Prepare resource data with program/subject/class
      const resourceData = {
        ...resourceForm,
        programId: resourceForm.programId || null,
        subjectId: resourceForm.subjectId || null,
        classId: resourceForm.classId || null,
        courseId: resourceForm.courseId || null
      };
      
      const result = editingResource ?
        await updateResource(editingResource.docId, resourceData) :
        await addResource(resourceData);

      if (result.success) {
        const resourceId = editingResource?.docId || result?.id;
        
        // Log activity
        try {
          await logActivity(editingResource ? ACTIVITY_TYPES.RESOURCE_UPDATED : ACTIVITY_TYPES.RESOURCE_CREATED, {
            resourceId,
            resourceTitle: resourceForm.title,
            resourceType: resourceForm.type
          });
        } catch (e) { }

        // Send email notification if requested (only for new resources)
        if (!editingResource && resourceEmailOptions.sendEmail) {
          try {
            // Determine recipients based on resource scope
            let recipients = [];
            if (resourceData.classId) {
              const enrollmentsResult = await getEnrollments({ classId: resourceData.classId });
              const userIds = (enrollmentsResult.data || []).map(e => e.userId);
              recipients = users.filter(u => userIds.includes(u.docId)).map(u => u.email).filter(Boolean);
            } else if (resourceData.subjectId) {
              // Get all classes for this subject, then all enrollments
              const subjectClasses = classes.filter(c => c.subjectId === resourceData.subjectId);
              const classIds = subjectClasses.map(c => c.docId || c.id);
              const enrollmentsResult = await getEnrollments();
              const userIds = (enrollmentsResult.data || []).filter(e => classIds.includes(e.classId)).map(e => e.userId);
              recipients = users.filter(u => userIds.includes(u.docId)).map(u => u.email).filter(Boolean);
            } else if (resourceData.programId) {
              // Get all subjects for this program, then all classes, then all enrollments
              const programSubjects = subjects.filter(s => s.programId === resourceData.programId);
              const subjectIds = programSubjects.map(s => s.docId || s.id);
              const programClasses = classes.filter(c => subjectIds.includes(c.subjectId));
              const classIds = programClasses.map(c => c.docId || c.id);
              const enrollmentsResult = await getEnrollments();
              const userIds = (enrollmentsResult.data || []).filter(e => classIds.includes(e.classId)).map(e => e.userId);
              recipients = users.filter(u => userIds.includes(u.docId)).map(u => u.email).filter(Boolean);
            } else {
              // Public resource - send to all users
              recipients = users.map(u => u.email).filter(Boolean);
            }

            if (recipients.length > 0) {
              const emailResult = await sendEmail({
                to: recipients,
                subject: `${t('new_resource')}: ${resourceForm.title}`,
                html: `<div><h2>${t('new_resource')}: ${resourceForm.title}</h2><p>${resourceForm.description || ''}</p><p><a href="${resourceForm.url}">${t('access_resource')}</a></p></div>`,
                type: 'resource'
              });
              if (emailResult.success) {
                // Email sent successfully
              }
            }
          } catch (emailError) {
            // Email error handled silently
          }
        }

        // Create announcement if requested (only for new resources)
        if (!editingResource && resourceEmailOptions.createAnnouncement) {
          try {
            const announcementData = {
              title: `${t('new_resource')}: ${resourceForm.title}`,
              content: t('new_resource_available', { title: resourceForm.title, description: resourceForm.description, url: resourceForm.url }) || `A new learning resource "${resourceForm.title}" has been added.\n\n${resourceForm.description}\n\nAccess it here: ${resourceForm.url}`,
              target: resourceData.classId ? 'class' : (resourceData.subjectId ? 'subject' : (resourceData.programId ? 'program' : 'global')),
              programId: resourceData.programId || null,
              subjectId: resourceData.subjectId || null,
              classId: resourceData.classId || null,
              type: 'resource',
              resourceId: resourceId
            };

            const { addAnnouncement } = await import('@firebaseServices/activityService');
            await addAnnouncement(announcementData);
            // Send notifications based on scope
            try {
              if (resourceData.classId) {
                await notifyUsersByClass(
                  resourceData.classId,
                  `📚 ${t('new_resource')}: ${resourceForm.title}`,
                  resourceForm.description || 'New resource available',
                  'resource'
                );
              } else {
                await notifyAllUsers(
                  `📚 ${t('new_resource')}: ${resourceForm.title}`,
                  resourceForm.description || 'New resource available',
                  'resource'
                );
              }
            } catch (notifErr) {
              // Notification error handled silently
            }
          } catch (announcementError) {
            // Announcement error handled silently
          }
        }

        // If no announcement requested, still send bell notification for visibility
        if (!editingResource && !resourceEmailOptions.createAnnouncement) {
          try {
            if (resourceData.classId) {
              await notifyUsersByClass(
                resourceData.classId,
                `📚 ${t('new_resource')}: ${resourceForm.title}`,
                resourceForm.description || 'New resource available',
                'resource'
              );
            } else {
              await notifyAllUsers(
                `📚 ${t('new_resource')}: ${resourceForm.title}`,
                resourceForm.description || 'New resource available',
                'resource'
              );
            }
          } catch (notifErr) {
            // Notification error handled silently
          }
        }

        await loadData();
        setResourceForm({ title: '', description: '', url: '', type: 'link', dueDate: '', optional: false, featured: false, programId: '', subjectId: '', classId: '', courseId: '' });
        setResourceEmailOptions({ sendEmail: false, createAnnouncement: false });
        setEditingResource(null);
        toast?.showSuccess(editingResource ? (t('resource_updated_successfully') || 'Resource updated successfully!') : (t('resource_created_successfully') || 'Resource created successfully!'));
      } else {
        toast?.showError(`Error ${editingResource ? 'updating' : 'creating'} resource: ` + result.error);
      }
    } catch (error) {
      toast?.showError(`Error ${editingResource ? 'updating' : 'creating'} resource: ` + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (params) => {
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
      dueDate: params.row.dueDate || '',
      optional: params.row.optional || false,
      featured: params.row.featured || false,
      programId: params.row.programId || '',
      subjectId: params.row.subjectId || '',
      classId: params.row.classId || '',
      courseId: params.row.courseId || ''
    });
  };

  const handleDelete = (params) => {
    setDeleteModal({
      open: true,
      item: params.row,
      type: 'resource',
      onConfirm: async () => {
        const resource = params.row;
        // Optimistic update
        const prevResources = resources;
        setResources(prev => prev.filter(r => r.docId !== resource.docId));
        try {
          const result = await deleteResource(resource.docId);
          if (result.success) {
            // Log activity
            try {
              await logActivity(ACTIVITY_TYPES.RESOURCE_DELETED, {
                resourceId: resource.docId,
                resourceTitle: resource.title,
                resourceType: resource.type
              });
            } catch (e) { }
            toast?.showSuccess('Resource deleted successfully!');
            await loadData();
            setDeleteModal({ open: false, item: null, type: null, onConfirm: null });
          } else {
            // Rollback on error
            setResources(prevResources);
            toast?.showError('Error deleting resource: ' + result.error);
            setDeleteModal({ open: false, item: null, type: null, onConfirm: null });
          }
        } catch (error) {
          // Rollback on error
          setResources(prevResources);
          toast?.showError('Error deleting resource: ' + error.message);
          setDeleteModal({ open: false, item: null, type: null, onConfirm: null });
        }
      }
    });
  };

  const handleCancelEdit = () => {
    setEditingResource(null);
    setResourceForm({ title: '', description: '', url: '', type: 'link', dueDate: '', optional: false, featured: false, programId: '', subjectId: '', classId: '', courseId: '' });
    setResourceEmailOptions({ sendEmail: false, createAnnouncement: false });
    setActiveResourceFormTab('basic');
  };

  const handleTabNavigation = (direction) => {
    if (direction === 'next') {
      if (activeResourceFormTab === 'basic') {
        setActiveResourceFormTab('content');
      } else if (activeResourceFormTab === 'content') {
        setActiveResourceFormTab('settings');
      }
    } else {
      if (activeResourceFormTab === 'settings') {
        setActiveResourceFormTab('content');
      } else if (activeResourceFormTab === 'content') {
        setActiveResourceFormTab('basic');
      }
    }
  };

  const handleClearFilters = () => {
    setResourceProgramFilter('all');
    setResourceSubjectFilter('all');
    setResourceClassFilter('all');
    setResourceCategoryFilter('all');
  };

  const columns = [
    { field: 'title', headerName: t('title_col'), flex: 1, minWidth: 200 },
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
        const date = params.value?.toDate ? params.value.toDate() : (params.value?.seconds ? new Date(params.value.seconds * 1000) : new Date(params.value));
        if (isNaN(date.getTime())) return (t('no_deadline') || 'No deadline');
        return formatQatarDate(date);
      }
    },
    {
      field: 'optional', headerName: t('required_col'), width: 120,
      renderCell: (params) => params.value ? (t('required_optional') || 'Optional') : (t('required_yes') || 'Required')
    },
    {
      field: 'createdAt', headerName: 'Created', width: 180,
      valueGetter: (params) => params.value,
      renderCell: (params) => {
        if (!params.value) return 'Unknown';
        const date = params.value?.toDate ? params.value.toDate() : (params.value?.seconds ? new Date(params.value.seconds * 1000) : new Date(params.value));
        if (isNaN(date.getTime())) return 'Unknown';
        return formatQatarDate(date);
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
  ];

  const filteredResources = resources.filter(r => {
    // If resource has no program/subject/class, it's public and should be included
    if (!r.programId && !r.subjectId && !r.classId && !r.courseId) {
      return true;
    }
    
    if (resourceClassFilter !== 'all') {
      return r.classId === resourceClassFilter;
    }
    if (resourceSubjectFilter !== 'all') {
      return r.subjectId === resourceSubjectFilter;
    }
    if (resourceProgramFilter !== 'all') {
      return r.programId === resourceProgramFilter;
    }
    if (resourceCategoryFilter !== 'all') {
      return r.courseId === resourceCategoryFilter;
    }
    return true;
  });

  return (
    <div className="resources-tab">
      {editingResource && (
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
          {getThemedIcon('ui', 'edit', 16, theme)} {t('editing_resource') || 'Editing Resource'}: {editingResource.title || editingResource.title_en}
        </div>
      )}

      {/* Form Navigation Buttons */}
      {editingResource && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '1rem',
          padding: '0.75rem',
          background: 'var(--background-secondary, #f8fafc)',
          border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: '8px'
        }}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setActiveResourceFormTab('basic')}
            disabled={activeResourceFormTab === 'basic'}
          >
            {t('previous') || 'Previous'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setActiveResourceFormTab('content')}
            disabled={activeResourceFormTab === 'content'}
          >
            {t('next') || 'Next'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingResource(null);
              setResourceForm({ title: '', description: '', url: '', type: 'link', dueDate: '', optional: false, featured: false, programId: '', subjectId: '', classId: '', courseId: '' });
              setResourceEmailOptions({ sendEmail: false, createAnnouncement: false });
              setActiveResourceFormTab('basic');
            }}
          >
            {t('cancel') || 'Cancel'}
          </Button>
        </div>
      )}

      <RibbonTabs
        categories={[
          {
            id: 'resource-fields',
            items: [
              { key: 'basic', label: 'Basic Info', icon: getThemedIcon('ui', 'book_open', 14, theme) },
              { key: 'content', label: 'Content', icon: getThemedIcon('ui', 'file_text', 14, theme) },
              { key: 'settings', label: 'Settings', icon: getThemedIcon('ui', 'settings', 14, theme) }
            ]
          }
        ]}
        activeCategory="resource-fields"
        activeItem={activeResourceFormTab}
        onChange={({ item }) => setActiveResourceFormTab(item)}
      />
      
      <form onSubmit={handleResourceSubmit} className="dashboard-form">
        {/* Basic Info Tab */}
        {activeResourceFormTab === 'basic' && (
          <>
            <div className="form-row wide-cols">
              <ProgramsSelect
                programs={programs}
                subjects={subjects}
                classes={classes}
                selectedProgram={resourceForm.programId}
                selectedSubject={resourceForm.subjectId}
                selectedClass={resourceForm.classId}
                onProgramChange={(programId) => setResourceForm(prev => ({ ...prev, programId, subjectId: '', classId: '' }))}
                onSubjectChange={(subjectId) => setResourceForm(prev => ({ ...prev, subjectId, classId: '' }))}
                onClassChange={(classId) => setResourceForm(prev => ({ ...prev, classId }))}
                showLabels={false}
              />
              <Select
                searchable
                placeholder={t('category_optional') || 'Category (Optional)'}
                value={resourceForm.courseId || ''}
                onChange={(e) => setResourceForm({ ...resourceForm, courseId: e.target.value })}
                options={[
                  { value: '', label: t('no_category') || 'No Category' },
                  ...courses.map(course => ({
                    value: course.docId,
                    label: lang === 'ar' ? (course.name_ar || course.name_en) : (course.name_en || course.name_ar)
                  })).sort((a, b) => a.label.localeCompare(b.label))
                ]}
              />
            </div>

            <div className="form-row">
              <Input
                type="text"
                placeholder={t('resource_title') + ' (EN)'}
                value={resourceForm.title_en || resourceForm.title || ''}
                onChange={(e) => setResourceForm({ ...resourceForm, title_en: e.target.value, title: e.target.value })}
                required
              />
              <Input
                type="text"
                placeholder={t('resource_title') + ' (AR)'}
                value={resourceForm.title_ar || ''}
                onChange={(e) => setResourceForm({ ...resourceForm, title_ar: e.target.value })}
              />
              <Select
                searchable
                placeholder={t('resource_type') || 'Resource Type'}
                value={resourceForm.type}
                onChange={(e) => setResourceForm({ ...resourceForm, type: e.target.value })}
                options={getResourceTypeOptions(theme)}
              />
            </div>
          </>
        )}

        {/* Content Tab */}
        {activeResourceFormTab === 'content' && (
          <>
            <div className="form-row">
              <Textarea
                placeholder={t('resource_description') + ' (EN)'}
                value={resourceForm.description_en || resourceForm.description || ''}
                onChange={(e) => setResourceForm({ ...resourceForm, description_en: e.target.value, description: e.target.value })}
                rows={3}
                fullWidth
              />
              <Textarea
                placeholder={t('resource_description') + ' (AR)'}
                value={resourceForm.description_ar || ''}
                onChange={(e) => setResourceForm({ ...resourceForm, description_ar: e.target.value })}
                rows={3}
                fullWidth
              />
            </div>

            <div className="form-row">
              <UrlInput
                placeholder={t('resource_url')}
                value={resourceForm.url}
                onChange={(e) => setResourceForm({ ...resourceForm, url: e.target.value })}
                required
                onOpen={(href) => window.open(href, '_blank')}
                onCopy={() => toast?.showSuccess(t('copied') || 'Copied')}
                onClear={() => setResourceForm({ ...resourceForm, url: '' })}
                fullWidth
              />
              <DatePicker
                type="datetime"
                value={resourceForm.dueDate}
                onChange={(iso) => setResourceForm({ ...resourceForm, dueDate: iso })}
                placeholder={t('due_date') + ' (' + t('optional') + ')'}
              />
            </div>
          </>
        )}

        {/* Settings Tab */}
        {activeResourceFormTab === 'settings' && (
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
            <ToggleSwitch
              label={t('create_announcement_bell') || 'Create announcement (bell notification)'}
              checked={resourceEmailOptions.createAnnouncement}
              onChange={(checked) => setResourceEmailOptions({ ...resourceEmailOptions, createAnnouncement: checked })}
            />
          </div>
        )}

        {/* Form Actions - Show on all tabs */}
        <div className="form-row flex-row">
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {activeResourceFormTab !== 'basic' && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => handleTabNavigation('previous')}
                >
                  {t('previous') || '← Previous'}
                </Button>
              )}
              {activeResourceFormTab !== 'settings' && (
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={() => handleTabNavigation('next')}
                >
                  {t('next') || 'Next →'}
                </Button>
              )}
              {activeResourceFormTab === 'settings' && (
                <Button type="submit" variant="primary" loading={loading}>
                  {(editingResource ? t('update') : t('save'))}
                </Button>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancelEdit}
              >
                {t('cancel') || 'Cancel'}
              </Button>
            </div>
          </div>
        </div>
      </form>

      <div style={{ marginTop: '1rem' }}>
        <AdvancedDataGrid
          rows={filteredResources}
          getRowId={(row) => row.docId || row.id}
          columns={columns}
          pageSize={10}
          pageSizeOptions={[5, 10, 20, 50]}
          checkboxSelection
          exportFileName="resources"
          showExportButton
          exportLabel={t('export') || 'Export'}
        />
      </div>
    </div>
  );
};

export default ResourcesPage;
