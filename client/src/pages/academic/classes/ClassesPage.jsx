import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useAuth } from '@contexts/AuthContext';
import { getThemedIcon } from '@constants/iconTypes';
import logger from '@utils/logger';
import { addClass, updateClass, deleteClass, getClasses } from '@services/business/classService';
import { getPrograms, getSubjects } from '@services/business/programService';
import { getUsers } from '@services/business/userService';
import { getEnrollments } from '@services/business/enrollmentService';
import { getActivities } from '@services/business/activityService';
import { logActivity, ACTIVITY_LOG_TYPES } from '@services/other/activityLogger.jsx';
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
import DeleteModal, { useDeleteModal } from '@ui/DeleteModal/DeleteModal';
import ProgramsSelect from '@ui/Select/ProgramsSelect';

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
  const [classForm, setClassForm] = useState({ id: '', name: '', nameAr: '', code: '', term: '', ownerEmail: '', subjectId: '', programId: '', classId: '' });
  const [editingClass, setEditingClass] = useState(null);
  const { deleteModal, deleteClass: deleteClassModal, handleDeleteConfirm, hideDeleteModal } = useDeleteModal(t);
  
  // Refs for performance
  const nameRef = useRef(null);
  const nameArRef = useRef(null);
  const codeRef = useRef(null);
  
  // Filter state
  const [classProgramFilter, setClassProgramFilter] = useState('');
  const [classSubjectFilter, setClassSubjectFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [classInstructorFilter, setClassInstructorFilter] = useState('');
  const [classTermFilter, setClassTermFilter] = useState('');
  const [classYearFilter, setClassYearFilter] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);

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
        logger.log('🔍 [ClassesPage] Loaded users:', usersRes.data?.map(u => ({
          email: u.email,
          displayName: u.displayName || u.name,
          role: u.role,
          active: u.active
        })));
      }
      if (enrollmentsRes?.success) setEnrollments(enrollmentsRes.data || []);
      if (activitiesRes?.success) setActivities(activitiesRes.data || []);
    } catch (error) {
      logger.error('🔍 [ClassesPage] Error loading data:', error);
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

  const syncRefsToState = useCallback(() => {
    return {
      name: nameRef.current?.value ?? classForm.name,
      nameAr: nameArRef.current?.value ?? classForm.nameAr,
      code: codeRef.current?.value ?? classForm.code
    };
  }, [classForm]);
  
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

  const handleClassSubmit = useCallback(async (e) => {
    e.preventDefault();
    console.time('[PERF] handleClassSubmit');
    
    // Sync refs
    const textValues = syncRefsToState();
    
    if (!textValues.name.trim()) {
      toast?.showError(t('class_name') + ' is required');
      return;
    }

    const classData = {
      ...classForm,
      ...textValues
    };

    setLoading(true);
    try {
      const result = editingClass ?
        await updateClass(editingClass.docId, classData) :
        await addClass(classData);

      if (result.success) {
        // Log activity
        try {
          await logActivity(editingClass ? ACTIVITY_LOG_TYPES.CLASS_UPDATED : ACTIVITY_LOG_TYPES.CLASS_CREATED, {
            classId: editingClass?.docId || result.id,
            className: textValues.name,
            classCode: textValues.code,
            subjectId: classForm.subjectId
          });
        } catch (e) { logger.warn('Failed to log activity:', e); }
        await loadData();
        setEditingClass(null);
        setClassForm({ id: '', name: '', nameAr: '', code: '', term: '', ownerEmail: '', subjectId: '', programId: '', classId: '' });
        // Clear refs
        if (nameRef.current) nameRef.current.value = '';
        if (nameArRef.current) nameArRef.current.value = '';
        if (codeRef.current) codeRef.current.value = '';
        toast?.showSuccess(editingClass ? 'Class updated successfully!' : 'Class created successfully!');
      } else {
        toast?.showError('Error: ' + result.error);
      }
    } catch (error) {
      logger.error('Error saving class:', error);
      toast?.showError('Error: ' + error.message);
    } finally {
      setLoading(false);
      console.timeEnd('[PERF] handleClassSubmit');
    }
  }, [classForm, editingClass, toast, t, syncRefsToState, loadData]);

  const handleEdit = useCallback((params) => {
    setEditingClass(params.row);
    setClassForm({
      id: params.row.id,
      name: params.row.name || '',
      nameAr: params.row.nameAr || '',
      code: params.row.code || '',
      term: params.row.term || '',
      ownerEmail: params.row.ownerEmail || '',
      subjectId: params.row.subjectId || '',
      programId: params.row.programId || '',
      classId: params.row.classId || ''
    });
    // Sync refs
    if (nameRef.current) nameRef.current.value = params.row.name || '';
    if (nameArRef.current) nameArRef.current.value = params.row.nameAr || '';
    if (codeRef.current) codeRef.current.value = params.row.code || '';
  }, []);

  const handleDelete = useCallback((params) => {
    const classItem = params.row;
    deleteClassModal(classItem, async () => {
      // Optimistic update
      setClasses(prev => prev.filter(c => (c.docId || c.id) !== (classItem.docId || classItem.id)));
      
      try {
        const result = await deleteClass(classItem.docId);
        if (result.success) {
          try {
            await logActivity(ACTIVITY_LOG_TYPES.CLASS_DELETED, {
              classId: classItem.docId,
              className: classItem.name,
              classCode: classItem.code
            });
          } catch (e) { logger.warn('Failed to log activity:', e); }
          toast?.showSuccess('Class deleted successfully!');
          await loadData();
        } else {
          // Rollback
          setClasses(prev => [...prev, classItem]);
          toast?.showError('Error: ' + result.error);
        }
      } catch (error) {
        // Rollback
        setClasses(prev => [...prev, classItem]);
        logger.error('Error deleting class:', error);
        toast?.showError('Error: ' + error.message);
      }
    });
  }, [deleteClassModal, enrollments, activities, toast, loadData]);

const handleCancelEdit = useCallback(() => {
    setEditingClass(null);
    setClassForm({ id: '', name: '', nameAr: '', code: '', term: '', ownerEmail: '', subjectId: '', programId: '', classId: '' });
    // Clear refs
    if (nameRef.current) nameRef.current.value = '';
    if (nameArRef.current) nameArRef.current.value = '';
    if (codeRef.current) codeRef.current.value = '';
  }, []);

  const gridColumns = useMemo(() => [
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
            {/*{getThemedIcon('ui', 'book_open', 16, theme)}*/}
            —
          </span>
        );
        const subject = subjects.find(s => (s.docId === subjectId) || (s.id === subjectId));
        if (!subject) return '—';
        const subjectName = lang === 'ar' ? (subject.name_ar || subject.name_en) : subject.name_en;
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            {/*{getThemedIcon('ui', 'book_open', 16, theme)} */}
            {subjectName || '—'}
          </span>
        );
      }
    },
    {
      field: 'programId', headerName: t('program') || 'Program', flex: 1, minWidth: 180,
      valueGetter: (params) => {
        const row = params?.row || {};
        const programId = row.programId || params?.value;
        if (!programId) return '—';
        // Find program via subject
        const subject = subjects.find(s => (s.docId === row.subjectId) || (s.id === row.subjectId));
        if (subject && subject.programId) {
          const program = programs.find(p => (p.docId === subject.programId) || (p.id === subject.programId));
          if (program) {
            const programName = lang === 'ar' ? (program.name_ar || program.name_en) : program.name_en;
            return programName || '—';
          }
        }
        return '—';
      },
      renderCell: (params) => {
        const row = params?.row || {};
        const programId = row.programId || params?.value;
        if (!programId) return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted, #6b7280)' }}>
            —
          </span>
        );
        // Find program via subject
        const subject = subjects.find(s => (s.docId === row.subjectId) || (s.id === row.subjectId));
        if (subject && subject.programId) {
          const program = programs.find(p => (p.docId === subject.programId) || (p.id === subject.programId));
          if (program) {
            const programName = lang === 'ar' ? (program.name_ar || program.name_en) : program.name_en;
            return (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                {programName || '—'}
              </span>
            );
          }
        }
        return '—';
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
  ], [subjects, users, theme, lang, t, handleEdit, handleDelete]);

  const filteredClasses = classes.filter(classItem => {
    if (classProgramFilter && classProgramFilter !== 'all' && classItem.programId !== classProgramFilter) return false;
    if (classSubjectFilter && classSubjectFilter !== 'all' && classItem.subjectId !== classSubjectFilter) return false;
    if (classFilter && classFilter !== 'all' && classItem.docId !== classFilter) return false;
    if (classInstructorFilter && classItem.ownerEmail !== classInstructorFilter) return false;
    if (classTermFilter && !classItem.term.includes(classTermFilter)) return false;
    if (classYearFilter && !classItem.term.includes(classYearFilter)) return false;
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

      <form onSubmit={handleClassSubmit} className="dashboard-form">
        {/* Basic Info */}
        <div className="form-row wide-cols">
          <Input
            ref={nameRef}
            placeholder={t('class_name')}
            defaultValue={classForm.name}
            required
          />
          <Input
            ref={nameArRef}
            placeholder={t('class_name_arabic')}
            defaultValue={classForm.nameAr || ''}
            dir="rtl"
          />
          <Input
            ref={codeRef}
            placeholder={t('class_code') + ' (' + t('optional') + ')'}
            defaultValue={classForm.code}
          />
        </div>

        {/* Academic Info */}
        <div className="form-row">
          <ProgramsSelect
            programs={programs}
            subjects={subjects}
            classes={classes}
            selectedProgram={classForm.programId}
            selectedSubject={classForm.subjectId}
            selectedClass={classForm.classId || ''}
            onProgramChange={(programId) => setClassForm(prev => ({ ...prev, programId, subjectId: '', classId: '' }))}
            onSubjectChange={(subjectId) => setClassForm(prev => ({ ...prev, subjectId, classId: '' }))}
            onClassChange={(classId) => setClassForm(prev => ({ ...prev, classId }))}
            showLabels={false}
            required
          />
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

        {/* Form Actions */}
        <div className="form-actions">
          <Button type="submit" variant="primary" loading={loading}>
            {(editingClass ? t('update') : t('save'))}
          </Button>
          {editingClass && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancelEdit}
            >
              {t('cancel') || 'Cancel'}
            </Button>
          )}
        </div>
      </form>

      {/* Filters for Classes */}
      <div className="filters-container" style={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: '1rem', 
        marginBottom: '1rem', 
        background: '#f8f9fa', 
        padding: '1rem', 
        borderRadius: 12, 
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)', 
        width: '100%' 
      }}>
        <ProgramsSelect
          programs={programs}
          subjects={subjects}
          classes={classes}
          selectedProgram={classProgramFilter}
          selectedSubject={classSubjectFilter}
          selectedClass=""
          onProgramChange={(programId) => setClassProgramFilter(programId)}
          onSubjectChange={(subjectId) => setClassSubjectFilter(subjectId)}
          onClassChange={() => {}}
          showClass={false}
          showLabels={false}
          style={{ width: '100%' }}
        />
        
        {/* Second row: Instructor, Term, Year filters */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Select
            value={classInstructorFilter || ''}
            onChange={(e) => setClassInstructorFilter(e.target.value)}
            options={[
              { value: '', label: lang === 'ar' ? 'جميع المدربين' : 'All Instructors', icon: getThemedIcon('ui', 'users', 16, theme) },
              ...users.filter(u => u.isInstructor === true).map(instructor => ({
                  value: instructor.email,
                  label: instructor.displayName || instructor.email,
                  icon: getThemedIcon('ui', 'user', 16, theme)
                }))
            ]}
            placeholder={lang === 'ar' ? 'جميع المدربين' : 'All Instructors'}
            style={{ minWidth: '200px' }}
          />
          
          <Select
            value={classTermFilter || ''}
            onChange={(e) => setClassTermFilter(e.target.value)}
            options={[
              { value: '', label: lang === 'ar' ? 'جميع الفصول' : 'All Terms', icon: getThemedIcon('ui', 'calendar', 16, theme) },
              { value: 'Fall', label: lang === 'ar' ? 'خريف' : 'Fall', icon: getThemedIcon('ui', 'calendar', 16, theme) },
              { value: 'Spring', label: lang === 'ar' ? 'ربيع' : 'Spring', icon: getThemedIcon('ui', 'calendar', 16, theme) },
              { value: 'Summer', label: lang === 'ar' ? 'صيف' : 'Summer', icon: getThemedIcon('ui', 'sun', 16, theme) },
              { value: 'Winter', label: lang === 'ar' ? 'شتاء' : 'Winter', icon: getThemedIcon('ui', 'moon', 16, theme) }
            ]}
            placeholder={lang === 'ar' ? 'جميع الفصول' : 'All Terms'}
            style={{ minWidth: '150px' }}
          />
          
          <Select
            value={classYearFilter || ''}
            onChange={(e) => setClassYearFilter(e.target.value)}
            options={[
              { value: '', label: lang === 'ar' ? 'جميع السنوات' : 'All Years', icon: getThemedIcon('ui', 'calendar', 16, theme) },
              ...Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return {
                  value: year.toString(),
                  label: year.toString(),
                  icon: getThemedIcon('ui', 'calendar', 16, theme)
                };
              })
            ]}
            placeholder={lang === 'ar' ? 'جميع السنوات' : 'All Years'}
            style={{ minWidth: '120px' }}
          />
        </div>
        
      </div>

      {(classProgramFilter || classSubjectFilter || classInstructorFilter || classTermFilter || classYearFilter) && (
        <div style={{ 
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          marginBottom: '1rem',
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '9999px',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: '#1e40af'
        }}>
          {getThemedIcon('ui', 'filter', 14, theme)}
          {t('showing_filtered') || 'Showing'} {filteredClasses.length} {t('of') || 'of'} {classes.length} {t('classes') || 'Classes'}
        </div>
      )}

      {/* Summary Chips */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          padding: '0.5rem 0.75rem', 
          background: '#f0f9ff', 
          border: '1px solid #bae6fd', 
          borderRadius: '9999px',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: '#0369a1'
        }}>
          {getThemedIcon('ui', 'target', 16, theme)}
          {classes.length} {lang === 'ar' ? 'إجمالي' : 'Total'}
        </div>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          padding: '0.5rem 0.75rem', 
          background: '#fef3c7', 
          border: '1px solid #fde68a', 
          borderRadius: '9999px',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: '#92400e'
        }}>
          {getThemedIcon('ui', 'book', 16, theme)}
          {new Set(classes.map(c => c.subjectId)).size} {lang === 'ar' ? 'مواد' : 'Subjects'}
        </div>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          padding: '0.5rem 0.75rem', 
          background: '#f0fdf4', 
          border: '1px solid #bbf7d0', 
          borderRadius: '9999px',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: '#166534'
        }}>
          {getThemedIcon('ui', 'graduation_cap', 16, theme)}
          {new Set(classes.map(c => c.programId)).size} {lang === 'ar' ? 'برامج' : 'Programs'}
        </div>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <AdvancedDataGrid
          rows={filteredClasses}
          getRowId={(row) => row.docId || row.id}
          columns={gridColumns}
          pageSize={10}
          pageSizeOptions={[5, 10, 20, 50]}
          checkboxSelection
          exportFileName="classes"
          showExportButton
          exportLabel={t('export') || 'Export'}
          loadingOverlayMessage={loading ? "Loading classes..." : undefined}
        />
      </div>

      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={hideDeleteModal}
        onConfirm={handleDeleteConfirm}
        entityType={deleteModal.entityType}
        entityName={deleteModal.entityName}
      />
    </div>
  );
};

export default ClassesPage;
