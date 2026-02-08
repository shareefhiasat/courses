import React, { useState, useEffect } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useAuth } from '@contexts/AuthContext';
import { getThemedIcon } from '@constants/iconTypes';
import { addClass, updateClass, deleteClass, getClasses } from '@firebaseServices/classService';
import { getPrograms, getSubjects } from '@firebaseServices/programService';
import { getUsers } from '@firebaseServices/userService';
import { getEnrollments } from '@firebaseServices/enrollmentService';
import { getActivities } from '@firebaseServices/activityService';
import { logActivity, ACTIVITY_TYPES } from '@firebaseServices/activityLogger.jsx';
import { USER_ROLES } from '@constants/userRoles';
import { 
  Button, 
  Input, 
  Select, 
  AdvancedDataGrid, 
  useToast, 
  YearSelect,
  UserSelect
} from '@ui';
import { RibbonTabs } from '@ui';
import logger from '@utils/logger';

const ClassesPage = () => {
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const { user } = useAuth();
  const uiToast = useToast();
  
  // Main data state
  const [classes, setClasses] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [activities, setActivities] = useState([]);
  
  // Form state
  const [classForm, setClassForm] = useState({ id: '', name: '', nameAr: '', code: '', term: '', ownerEmail: '', subjectId: '' });
  const [editingClass, setEditingClass] = useState(null);
  const [activeClassFormTab, setActiveClassFormTab] = useState('basic');
  
  // Filter state
  const [classProgramFilter, setClassProgramFilter] = useState('');
  const [classSubjectFilter, setClassSubjectFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, item: null, type: null, onConfirm: null });

  // Load all data
  const loadData = async () => {
    setLoading(true);
    try {
      const [classesRes, programsRes, subjectsRes, usersRes, enrollmentsRes, activitiesRes] = await Promise.all([
        getClasses(),
        getPrograms(),
        getSubjects(),
        getUsers(),
        getEnrollments(),
        getActivities()
      ]);
      
      if (classesRes?.success) setClasses(classesRes.data || []);
      if (programsRes?.success) setPrograms(programsRes.data || []);
      if (subjectsRes?.success) setSubjects(subjectsRes.data || []);
      if (usersRes?.success) {
        setUsers(usersRes.data || []);
        // Debug: Log users and their roles
        console.log('🔍 [ClassesPage] Loaded users:', usersRes.data?.map(u => ({
          email: u.email,
          displayName: u.displayName || u.name,
          role: u.role,
          active: u.active
        })));
      }
      if (enrollmentsRes?.success) setEnrollments(enrollmentsRes.data || []);
      if (activitiesRes?.success) setActivities(activitiesRes.data || []);
    } catch (error) {
      console.error('🔍 [ClassesPage] Error loading data:', error);
      toast?.showError('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);
  
  // Utility functions
  const handleDropdownChange = (field, value) => {
    setClassForm(prev => ({ ...prev, [field]: value }));
  };
  
  // Generate subject options for form
  const classFormSubjectOptions = [
    { value: '', label: t('select_subject') || 'Select Subject' },
    ...(subjects || []).map(s => ({
      value: s.docId,
      label: lang === 'ar' ? (s.name_ar || s.name_en) : (s.name_en || s.docId)
    }))
  ];
  
  // Clear filters
  const handleClearFilters = () => {
    setClassProgramFilter('');
    setClassSubjectFilter('');
    setClassFilter('');
  };
  
  const toast = {
    showSuccess: uiToast.success,
    showError: uiToast.error,
    showInfo: uiToast.info,
  };

  const handleClassSubmit = async (e) => {
    e.preventDefault();
    if (!classForm.name.trim()) {
      toast?.showError(t('class_name') + ' is required');
      return;
    }

    setLoading(true);
    try {
      const result = editingClass ?
        await updateClass(editingClass.docId, classForm) :
        await addClass(classForm);

      if (result.success) {
        // Log activity
        try {
          await logActivity(editingClass ? ACTIVITY_TYPES.CLASS_UPDATED : ACTIVITY_TYPES.CLASS_CREATED, {
            classId: editingClass?.docId || result.id,
            className: classForm.name,
            classCode: classForm.code,
            subjectId: classForm.subjectId
          });
        } catch (e) { }
        await loadData();
        setEditingClass(null);
        setClassForm({ id: '', name: '', nameAr: '', code: '', term: '', ownerEmail: '', subjectId: '' });
        toast?.showSuccess(editingClass ? 'Class updated successfully!' : 'Class created successfully!');
      } else {
        toast?.showError('Error: ' + result.error);
      }
    } catch (error) {
      toast?.showError('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (params) => {
    setEditingClass(params.row);
    setClassForm({
      id: params.row.id,
      name: params.row.name || '',
      nameAr: params.row.nameAr || '',
      code: params.row.code || '',
      term: params.row.term || '',
      ownerEmail: params.row.ownerEmail || '',
      subjectId: params.row.subjectId || ''
    });
  };

  const handleDelete = (params) => {
    const classItem = params.row;
    const classEnrollments = enrollments.filter(e => e.classId === classItem.docId);
    const relatedActivities = activities.filter(a => (a.classId || '') === classItem.docId);
    
    setDeleteModal({
      open: true,
      item: classItem,
      type: 'class',
      onConfirm: async () => {
        // Optimistic update
        const prevClasses = classes;
        setClasses(prev => prev.filter(c => c.docId !== classItem.docId));
        try {
          // deleteClass now handles cascade deletion of enrollments and attendance
          const result = await deleteClass(classItem.docId);
          if (result.success) {
            // Log activity
            try {
              await logActivity(ACTIVITY_TYPES.CLASS_DELETED, {
                classId: classItem.docId,
                className: classItem.name
              });
            } catch (e) { }
            await loadData();
            toast?.showSuccess(`Class deleted successfully! Removed ${classEnrollments.length} enrollment(s) and related attendance records.`);
            setDeleteModal({ open: false, item: null, type: null, onConfirm: null });
          } else {
            // Rollback on error
            setClasses(prevClasses);
            toast?.showError('Error deleting class: ' + result.error);
            setDeleteModal({ open: false, item: null, type: null, onConfirm: null });
          }
        } catch (error) {
          // Rollback on error
          setClasses(prevClasses);
          toast?.showError('Error deleting class: ' + error.message);
          setDeleteModal({ open: false, item: null, type: null, onConfirm: null });
        }
      },
      relatedData: {
        enrollments: classEnrollments,
        activities: relatedActivities
      },
      warningMessage: classEnrollments.length > 0 || relatedActivities.length > 0
        ? `This class has ${classEnrollments.length} enrollment(s) and ${relatedActivities.length} activity(ies) that will be deleted.`
        : null
    });
  };

  const handleCancelEdit = () => {
    setEditingClass(null);
    setClassForm({ id: '', name: '', nameAr: '', code: '', term: '', ownerEmail: '', subjectId: '' });
    setActiveClassFormTab('basic');
  };

  const handleTabNavigation = (direction) => {
    if (direction === 'next') {
      if (activeClassFormTab === 'basic') {
        setActiveClassFormTab('academic');
      } else if (activeClassFormTab === 'academic') {
        setActiveClassFormTab('settings');
      }
    } else {
      if (activeClassFormTab === 'settings') {
        setActiveClassFormTab('academic');
      } else if (activeClassFormTab === 'academic') {
        setActiveClassFormTab('basic');
      }
    }
  };

  const columns = [
    { field: 'name', headerName: t('name') || 'Name', flex: 1, minWidth: 180 },
    { 
      field: 'code', 
      headerName: t('code') || 'Code', 
      width: 120,
      valueGetter: (params) => {
        const row = params?.row || {};
        const code = row.code || params?.value;
        return code || '—';
      }
    },
    {
      field: 'subjectId', headerName: t('subject') || 'Subject', flex: 1, minWidth: 180,
      valueGetter: (params) => {
        const row = params?.row || {};
        const subjectId = row.subjectId || params?.value;
        if (!subjectId) return '—';
        const subject = subjects.find(s => (s.docId === subjectId) || (s.id === subjectId));
        if (!subject) return '—';
        const subjectName = lang === 'ar' ? (subject.name_ar || subject.name_en) : subject.name_en;
        return subjectName || '—';
      },
      renderCell: (params) => {
        const row = params?.row || {};
        const subjectId = row.subjectId || params?.value;
        if (!subjectId) return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted, #6b7280)' }}>
            {getThemedIcon('ui', 'book_open', 16, theme)} —
          </span>
        );
        const subject = subjects.find(s => (s.docId === subjectId) || (s.id === subjectId));
        if (!subject) return '—';
        const subjectName = lang === 'ar' ? (subject.name_ar || subject.name_en) : subject.name_en;
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            {getThemedIcon('ui', 'book_open', 16, theme)} {subjectName || '—'}
          </span>
        );
      }
    },
    { 
      field: 'term', 
      headerName: t('term') || 'Term', 
      width: 140,
      renderCell: (params) => {
        const term = params.value;
        if (!term) return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted, #6b7280)' }}>
            {getThemedIcon('ui', 'calendar', 16, theme)} —
          </span>
        );
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            {/*{getThemedIcon('ui', 'calendar', 16, theme)} */}
            {term}
          </span>
        );
      }
    },
    {
      field: 'ownerEmail', headerName: t('owner') || 'Owner', flex: 1, minWidth: 200,
      valueGetter: (params) => {
        const row = params?.row || {};
        const email = row.ownerEmail || params?.value;
        if (!email) return '—';
        const owner = users.find(u => u.email === email);
        if (owner) {
          const displayName = owner.displayName || owner.name || owner.realName || '';
          return displayName ? `${displayName} (${email})` : email;
        }
        return email;
      },
      renderCell: (params) => {
        const row = params?.row || {};
        const email = row.ownerEmail || params?.value;
        if (!email) return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted, #6b7280)' }}>
            {getThemedIcon('ui', 'user', 16, theme)} —
          </span>
        );
        const owner = users.find(u => u.email === email);
        if (owner) {
          const displayName = owner.displayName || owner.name || owner.realName || '';
          return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              {/*{getThemedIcon('ui', 'user', 16, theme)} */}
              {displayName ? `${displayName} (${email})` : email}
            </span>
          );
        }
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            {/*{getThemedIcon('ui', 'user', 16, theme)} */}
            {email}
          </span>
        );
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
            Edit
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

  const filteredClasses = classes.filter(classItem => {
    if (classProgramFilter && classProgramFilter !== 'all' && classItem.programId !== classProgramFilter) return false;
    if (classSubjectFilter && classSubjectFilter !== 'all' && classItem.subjectId !== classSubjectFilter) return false;
    if (classFilter && classFilter !== 'all' && classItem.docId !== classFilter) return false;
    return true;
  });

  return (
    <div className="classes-tab">
      {editingClass && (
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
          {getThemedIcon('ui', 'edit', 16, theme)} Editing Class: {editingClass.name} ({editingClass.code || 'No code'})
        </div>
      )}

      <RibbonTabs
        categories={[
          {
            id: 'class-fields',
            items: [
              { key: 'basic', label: t('basic_info') || 'Basic Info', icon: getThemedIcon('ui', 'home', 14, theme) },
              { key: 'academic', label: t('academic_info') || 'Academic Info', icon: getThemedIcon('ui', 'graduation_cap', 14, theme) },
              { key: 'settings', label: t('settings') || 'Settings', icon: getThemedIcon('ui', 'settings', 14, theme) }
            ]
          }
        ]}
        activeCategory="class-fields"
        activeItem={activeClassFormTab}
        onChange={({ item }) => setActiveClassFormTab(item)}
      />
      
      <form onSubmit={handleClassSubmit} className="dashboard-form">
        {/* Form Actions - Show on all tabs - MOVED TO TOP */}
        <div className="form-actions" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {activeClassFormTab !== 'basic' && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => handleTabNavigation('previous')}
                >
                  ← Previous
                </Button>
              )}
              {activeClassFormTab !== 'settings' && (
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={() => handleTabNavigation('next')}
                >
                  Next →
                </Button>
              )}
              {activeClassFormTab === 'settings' && (
                <Button type="submit" variant="primary" loading={loading}>
                  {(editingClass ? t('update') : t('save'))}
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

        {/* Basic Info Tab */}
        {activeClassFormTab === 'basic' && (
          <>
            <div className="form-row wide-cols">
              <Input
                placeholder={t('class_name')}
                value={classForm.name}
                onChange={e => setClassForm({ ...classForm, name: e.target.value })}
                required
              />
              <Input
                placeholder={t('class_name_arabic')}
                value={classForm.nameAr || ''}
                onChange={e => setClassForm({ ...classForm, nameAr: e.target.value })}
                dir="rtl"
              />
              <Input
                placeholder={t('class_code') + ' (' + t('optional') + ')'}
                value={classForm.code}
                onChange={e => setClassForm({ ...classForm, code: e.target.value })}
              />
            </div>
          </>
        )}

        {/* Academic Info Tab */}
        {activeClassFormTab === 'academic' && (
          <>
            <div className="form-row">
              <Select
                searchable
                placeholder={t('all_subjects')}
                value={classForm.subjectId || ''}
                onChange={e => {
                  const newSubjectId = e.target.value;
                  setClassForm({ ...classForm, subjectId: newSubjectId });
                }}
                options={classFormSubjectOptions}
                required
              />
              {/* Debug: Show users count and roles */}
              {process.env.NODE_ENV === 'development' && (
                <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>
                  Debug: {users.length} users loaded | 
                  Admin/Instructors: {users.filter(u => u.role === USER_ROLES.SUPER_ADMIN || u.role === USER_ROLES.ADMIN || u.role === USER_ROLES.INSTRUCTOR).length} |
                  Active: {users.filter(u => (u.role === USER_ROLES.SUPER_ADMIN || u.role === USER_ROLES.ADMIN || u.role === USER_ROLES.INSTRUCTOR) && u.active).length}
                </div>
              )}
              <UserSelect
                users={users}
                enrollments={enrollments}
                value={classForm.ownerEmail}
                onChange={e => setClassForm({ ...classForm, ownerEmail: e.target.value })}
                placeholder={t('select_instructor') || 'Select Instructor'}
                roleFilter={[USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.INSTRUCTOR]}
                includeAll={false}
                showEnrollments={false}
                showStatus={true}
                useEmailAsValue={true}
                searchable={true}
                required
              />
            </div>
            <div className="form-row compact-cols">
              <Select
                searchable
                placeholder={t('term')}
                value={classForm.term?.split(' ')[0] || ''}
                onChange={e => {
                  const year = classForm.term?.split(' ')[1] || new Date().getFullYear();
                  setClassForm({ ...classForm, term: e.target.value ? `${e.target.value} ${year}` : '' });
                }}
                options={[
                  { value: '', label: t('term') || 'Select Term' },
                  { value: 'Fall', label: t('fall') || 'Fall' },
                  { value: 'Spring', label: t('spring') || 'Spring' },
                  { value: 'Summer', label: t('summer') || 'Summer' }
                ]}
                required
              />
              <div style={{ width: '100%' }}>
                <YearSelect
                  value={classForm.term?.split(' ')[1] || ''}
                  onChange={e => {
                    const semester = classForm.term?.split(' ')[0] || '';
                    setClassForm({
                      ...classForm,
                      term: semester ? `${semester} ${e.target.value}` : e.target.value
                    });
                  }}
                  startYear={2024}
                  yearsAhead={5}
                  label={null}
                  placeholder={t('year') || 'Year'}
                  searchable
                  required
                />
              </div>
            </div>
          </>
        )}

        {/* Settings Tab */}
        {activeClassFormTab === 'settings' && (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
            {getThemedIcon('ui', 'settings', 48, theme)}
            <p>Additional class settings can be added here in the future.</p>
            <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Features like class capacity, schedule, enrollment restrictions, etc.</p>
          </div>
        )}
      </form>

      {/* Filters for Classes */}
      <div className="filters-container" style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginBottom: '1rem', background: '#f8f9fa', padding: '1rem', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', width: '100%' }}>
        <Select
          value={classProgramFilter || ''}
          onChange={(e) => setClassProgramFilter(e.target.value)}
          options={[
            { value: '', label: t('all_programs') || 'All Programs' },
            ...(programs || []).map(p => ({
              value: p.docId,
              label: lang === 'ar' ? (p.name_ar || p.name_en) : (p.name_en || p.docId)
            }))
          ]}
          placeholder={t('all_programs') || 'All Programs'}
          searchable
          icon={getThemedIcon('ui', 'filter', 16, theme)}
        />
        <Select
          value={classSubjectFilter || ''}
          onChange={(e) => setClassSubjectFilter(e.target.value)}
          options={[
            { value: '', label: t('all_subjects') || 'All Subjects' },
            ...(subjects || []).map(s => ({
              value: s.docId,
              label: lang === 'ar' ? (s.name_ar || s.name_en) : (s.name_en || s.docId)
            }))
          ]}
          placeholder={t('all_subjects') || 'All Subjects'}
          searchable
          icon={getThemedIcon('ui', 'filter', 16, theme)}
        />
        <Select
          value={classFilter || ''}
          onChange={(e) => setClassFilter(e.target.value)}
          options={[
            { value: '', label: t('all_classes') || 'All Classes' },
            ...(classes || []).map(c => ({
              value: c.docId,
              label: `${c.name || c.code || 'Unnamed'}${c.code ? ` (${c.code})` : ''}${c.term ? ` - ${c.term}` : ''}`
            }))
          ]}
          placeholder={t('all_classes') || 'All Classes'}
          searchable
          icon={getThemedIcon('ui', 'filter', 16, theme)}
        />
      </div>

      <div style={{ marginTop: '1rem' }}>
        <AdvancedDataGrid
          rows={filteredClasses}
          getRowId={(row) => row.docId || row.id}
          columns={columns}
          pageSize={10}
          pageSizeOptions={[5, 10, 20, 50]}
          checkboxSelection
          exportFileName="classes"
          showExportButton
          exportLabel={t('export') || 'Export'}
          loadingOverlayMessage={loading ? "Loading classes..." : undefined}
          fancyVariant="dots"
        />
      </div>
    </div>
  );
};

export default ClassesPage;
