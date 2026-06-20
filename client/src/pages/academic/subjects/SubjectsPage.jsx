import React, { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import { info, error, warn, debug } from '@services/utils/logger.js';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { Navigate } from 'react-router-dom';
import { getThemedIcon } from '@constants/iconTypes';
import { getUsers } from '@services/business/userService';
import { getSubjectTypes } from '@services/business/subjectTypeService.js';
import { getRequirementTypes } from '@services/business/requirementTypeService.js';
import { getClasses } from '@services/business/classService';
import { getPrograms } from '@services/business/programService';
import { getSubjects, createSubject, updateSubject, deleteSubject } from '@services/business/subjectService';
import { SimpleLoading, Button, Input, Select, useToast, AdvancedDataGrid } from '@ui';
import { useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { DeleteModal, useDeleteModal } from '@ui';
import { useTheme } from '@contexts/ThemeContext';
import { getUserDisplayProps } from '@utils/userDisplayUtils.js';
import { getLocalizedName, createDropdownOptions, createLocalizedValueGetter } from '@utils/languageHelpers';
import { formatDateTime } from '@utils/dateUtils.js';
import { getLocalizedUserName } from '@utils/localizedUserName.js';
// OLD: import { ACTIVITY_TYPES } from '@constants';
// NOW: Not used in this component
import styles from './SubjectsPage.module.css';

const SubjectsPage = () => {
  const { isAdmin, isSuperAdmin, isInstructor, user, loading: authLoading } = useAuth();
  const { lang, t } = useLang();
  const { theme } = useTheme();
  const toast = useToast();
  
  const { startLoading } = useGlobalLoading();
  
  const [subjects, setSubjects] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjectTypes, setSubjectTypes] = useState([]);
  const [requirementTypes, setRequirementTypes] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSubject, setEditingSubject] = useState(null);
  const { deleteModal, deleteSubject: deleteSubjectModal, handleDeleteConfirm, hideDeleteModal } = useDeleteModal(t);
  
  // Refs for performance
  const nameEnRef = useRef(null);
  const nameArRef = useRef(null);
  const descEnRef = useRef(null);
  const descArRef = useRef(null);
  const codeRef = useRef(null);
  const creditHoursRef = useRef(null);
  const typeRef = useRef(null);
  const requirementTypeRef = useRef(null);
  const [formData, setFormData] = useState({
    programId: '',
    code: '',
    nameEn: '',
    nameAr: '',
    descriptionEn: '',
    descriptionAr: '',
    creditHours: 3,
    type: '', // Will be set to first subject type ID after loading
    requirementType: '' // Will be set to first requirement type ID after loading
  });

  const syncRefsToState = useCallback(() => {
    return {
      code: codeRef.current?.value ?? formData.code,
      nameEn: nameEnRef.current?.value ?? formData.nameEn,
      nameAr: nameArRef.current?.value ?? formData.nameAr,
      descriptionEn: descEnRef.current?.value ?? formData.descriptionEn,
      descriptionAr: descArRef.current?.value ?? formData.descriptionAr,
      creditHours: creditHoursRef.current?.value ? Number.parseInt(creditHoursRef.current.value) : formData.creditHours,
      // Note: totalHours and hoursPerWeek are not in the database schema, only credits is used
      type: typeRef.current?.value ?? formData.type,
      requirementType: requirementTypeRef.current?.value ?? formData.requirementType
    };
  }, [formData]);

  const loadData = useCallback(async (isInitial = false) => {
    if (!isInitial) setLoading(true);
    try {
      const [subjectsResult, programsResult, usersResult, subjectTypesResult, requirementTypesResult] = await Promise.allSettled([
        getSubjects(),
        getPrograms(),
        getUsers(),
        getSubjectTypes().catch(() => ({ success: false, data: [] })), // Graceful fallback
        getRequirementTypes().catch(() => ({ success: false, data: [] })) // Graceful fallback
      ]);

      // Handle results with fallbacks
      if (subjectsResult.status === 'fulfilled' && subjectsResult.value.success) {
        setSubjects(subjectsResult.value.data || []);
      }
      if (programsResult.status === 'fulfilled' && programsResult.value.success) {
        setPrograms(programsResult.value.data || []);
      }
      if (usersResult.status === 'fulfilled' && usersResult.value.success) {
        setUsers(usersResult.value.data || []);
      }
      if (subjectTypesResult.status === 'fulfilled' && subjectTypesResult.value.success) {
        setSubjectTypes(subjectTypesResult.value.data || []);
      }
      if (requirementTypesResult.status === 'fulfilled' && requirementTypesResult.value.success) {
        setRequirementTypes(requirementTypesResult.value.data || []);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      if (!isInitial) setLoading(false);
    }
  }, [toast]);

  // Set default values when lookup data loads or provide fallbacks
  useEffect(() => {
    if (subjectTypes.length > 0 && !formData.type) {
      setFormData(prev => ({ ...prev, type: subjectTypes[0].id })); // Use integer ID
    }
    if (requirementTypes.length > 0 && !formData.requirementType) {
      setFormData(prev => ({ ...prev, requirementType: requirementTypes[0].id })); // Use integer ID
    }
    
    // Fallback to hardcoded values if lookup data fails to load
    if (subjectTypes.length === 0 && !formData.type) {
      setFormData(prev => ({ ...prev, type: 1 })); // Default to CORE (id: 1)
    }
    if (requirementTypes.length === 0 && !formData.requirementType) {
      setFormData(prev => ({ ...prev, requirementType: 1 })); // Default to MANDATORY (id: 1)
    }
  }, [subjectTypes, requirementTypes, formData.type, formData.requirementType]);

  // Use GlobalLoading for initial data load
  useLayoutEffect(() => {
    if (authLoading) return;
    if (!isAdmin && !isSuperAdmin && !isInstructor) return;

    let stopLoading = null;

    const initialLoad = async () => {
      stopLoading = startLoading({ message: t('loading_subjects') || 'Loading subjects...' });
      await loadData(true);
      if (stopLoading) stopLoading();
      setLoading(false);
      // logActivity(ACTIVITY_LOG_TYPES.SUBJECT_VIEWED, {}); // Removed to prevent warning logs
    };

    initialLoad();

    return () => {
      if (stopLoading) stopLoading();
    };
  }, [authLoading, isAdmin, isSuperAdmin, isInstructor, startLoading, loadData, t]);

  // Sync refs when editing an existing subject
  useEffect(() => {
    if (codeRef.current) codeRef.current.value = formData.code || '';
    if (nameEnRef.current) nameEnRef.current.value = formData.nameEn || '';
    if (nameArRef.current) nameArRef.current.value = formData.nameAr || '';
    if (descEnRef.current) descEnRef.current.value = formData.descriptionEn || '';
    if (descArRef.current) descArRef.current.value = formData.descriptionAr || '';
    if (creditHoursRef.current) creditHoursRef.current.value = formData.creditHours?.toString() || '3';
    if (typeRef.current) typeRef.current.value = formData.type?.toString() || '1';
    if (requirementTypeRef.current) requirementTypeRef.current.value = formData.requirementType?.toString() || '1';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingSubject]); // only when we load a subject for editing

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    console.time('[PERF] handleSubjectSubmit');
    
    // Sync refs
    const textValues = syncRefsToState();
    
    // Validation with specific error messages
    if (!formData.programId) {
      toast.error(t('please_select_program') || 'Please select a program');
      return;
    }
    
    if (!textValues.code || textValues.code.trim() === '') {
      toast.error(t('please_enter_subject_code') || 'Please enter subject code');
      return;
    }
    
    if (!textValues.nameEn || textValues.nameEn.trim() === '') {
      toast.error(t('please_enter_subject_name_english') || 'Please enter subject name in English');
      return;
    }
    
    if (!textValues.nameAr || textValues.nameAr.trim() === '') {
      toast.error(t('please_enter_subject_name_arabic') || 'Please enter subject name in Arabic');
      return;
    }

    const subjectData = {
      programId: parseInt(formData.programId), // Convert to integer for database
      code: textValues.code,
      nameEn: textValues.nameEn,
      nameAr: textValues.nameAr,
      descriptionEn: textValues.descriptionEn,
      descriptionAr: textValues.descriptionAr,
      credits: textValues.creditHours, // Fixed: use creditHours from form
      typeId: parseInt(formData.type) || 1, // Use integer ID from lookup, default to CORE (id: 1)
      requirementTypeId: parseInt(formData.requirementType) || 1, // Use integer ID from lookup, default to MANDATORY (id: 1)
      isActive: true // Explicitly set active status
    };

    setLoading(true);
    try {
      let result;
      if (editingSubject) {
        result = await updateSubject(editingSubject.id, subjectData, user);
      } else {
        result = await createSubject(subjectData, user);
      }
      
      if (result.success) {
        // Log activity
        try {
          await logActivity(editingSubject ? ACTIVITY_LOG_TYPES.SUBJECT_UPDATED : ACTIVITY_LOG_TYPES.SUBJECT_CREATED, {
            subjectId: editingSubject?.id || result.id,
            subjectName: textValues.nameEn,
            subjectCode: formData.code,
            programId: formData.programId
          });
        } catch (e) { warn('Failed to log activity:', e); }
        toast.success(editingSubject ? t('subject_updated_successfully') || 'Subject updated successfully' : t('subject_created_successfully') || 'Subject created successfully');
        setEditingSubject(null);
        resetForm();
        // Don't call loadData() here to prevent double loading
      } else {
        toast.error(result.error || t('operation_failed_subject') || 'Operation failed');
      }
    } catch (error) {
      toast.error(error.message || t('subjects_error_message', { error: error.message }));
    } finally {
      setLoading(false);
      console.timeEnd('[PERF] handleSubjectSubmit');
    }
  }, [editingSubject, formData, toast, t, loadData, syncRefsToState]);

  const handleEdit = useCallback((subject) => {
    setEditingSubject(subject);
    
    // Find the program that contains this subject
    const programWithSubject = programs.find(program => 
      program.subjects && program.subjects.some(s => s.id === subject.id)
    );
    
    setFormData({
      programId: programWithSubject ? programWithSubject.id : subject.programId || '',
      code: subject.code || '',
      nameEn: subject.nameEn || subject.name || '',
      nameAr: subject.nameAr || subject.name || '',
      requirementType: subject.requirementTypeId || 1, // Use integer ID
      descriptionEn: subject.descriptionEn || subject.description || '',
      descriptionAr: subject.descriptionAr || subject.description || '',
      creditHours: subject.creditHours || 3,
      type: subject.typeId || 1, // Use integer ID
      classIds: subject.classIds || []
    });
    
    // Sync refs
    if (nameEnRef.current) nameEnRef.current.value = subject.nameEn || subject.name || '';
    if (nameArRef.current) nameArRef.current.value = subject.nameAr || subject.name || '';
    if (descEnRef.current) descEnRef.current.value = subject.descriptionEn || subject.description || '';
    if (descArRef.current) descArRef.current.value = subject.descriptionAr || subject.description || '';
    if (typeRef.current) typeRef.current.value = subject.typeId || 1; // Use integer ID
    if (requirementTypeRef.current) requirementTypeRef.current.value = subject.requirementTypeId || 1; // Use integer ID
  }, [programs]);

  const handleDelete = useCallback((subject) => {
    deleteSubjectModal(subject, async () => {
      // Optimistic update
      setSubjects(prev => prev.filter(s => (s.docId || s.id) !== (subject.docId || subject.id)));
      
      try {
        const result = await deleteSubject(subject.id);
        if (result.success) {
          try {
            await logActivity(ACTIVITY_LOG_TYPES.SUBJECT_DELETED, {
              subjectId: subject.id,
              subjectName: subject.nameEn || subject.nameAr,
              subjectCode: subject.code
            });
          } catch (e) { /* Activity logging failed */ }
          toast.success(t('subject_deleted_successfully') || 'Subject deleted successfully');
          // Don't call loadData() here to prevent double loading
        } else {
          // Rollback
          setSubjects(prev => [...prev, subject]);
          toast.error(result.error || t('failed_to_delete_subject') || 'Failed to delete subject');
        }
      } catch (error) {
        // Rollback
        setSubjects(prev => [...prev, subject]);
        toast.error(error.message || t('subjects_error_message', { error: error.message }));
      }
    });
  }, [deleteSubjectModal, toast, t, loadData]);

const resetForm = () => {
    setFormData({
      programId: '',
      code: '',
      nameEn: '',
      nameAr: '',
      descriptionEn: '',
      descriptionAr: '',
      creditHours: 3,
      type: 1, // Default to CORE (id: 1)
      requirementType: 1, // Default to MANDATORY (id: 1)
      classIds: []
    });
    // Reset refs
    if (nameEnRef.current) nameEnRef.current.value = '';
    if (nameArRef.current) nameArRef.current.value = '';
    if (descEnRef.current) descEnRef.current.value = '';
    if (descArRef.current) descArRef.current.value = '';
  };

const gridColumns = useMemo(() => [
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
    { field: 'nameEn', headerName: t('name_en') || 'Name (EN)', flex: 1, minWidth: 180 },
    { field: 'nameAr', headerName: t('name_ar') || 'Name (AR)', flex: 1, minWidth: 180 },
    { field: 'credits', headerName: t('credits') || 'Credits', width: 100 },
    {
      field: 'type',
      headerName: t('type') || 'Type',
      width: 120,
      renderCell: (params) => {
        const row = params?.row || {};
        
        // First try to use the nested subjectType object (from API includes)
        if (row.subjectType && row.subjectType.nameEn) {
          return getLocalizedName(row.subjectType, lang);
        }
        
        // Fallback to typeId lookup
        const typeId = row.typeId;
        if (!typeId) return '—';
        
        // If lookup data exists, use it with language awareness
        if (subjectTypes.length > 0) {
          const type = subjectTypes.find(t => t.id === parseInt(typeId));
          return type ? getLocalizedName(type, lang) : typeId;
        }
        
        // Final fallback - show the raw typeId with indicator
        return `Type ${typeId}`;
      }
    },
    {
      field: 'requirementType',
      headerName: t('requirement_type') || 'Requirement Type',
      width: 150,
      renderCell: (params) => {
        const row = params?.row || {};
        
        // First try to use the nested requirementType object (from API includes)
        if (row.requirementType && row.requirementType.nameEn) {
          return getLocalizedName(row.requirementType, lang);
        }
        
        // Fallback to requirementTypeId lookup
        const requirementTypeId = row.requirementTypeId;
        if (!requirementTypeId) return '—';
        
        // If lookup data exists, use it with language awareness
        if (requirementTypes.length > 0) {
          const requirementType = requirementTypes.find(r => r.id === parseInt(requirementTypeId));
          return requirementType ? getLocalizedName(requirementType, lang) : requirementTypeId;
        }
        
        // Fallback to ID if lookup not loaded
        return requirementTypeId;
      }
    },
    {
      field: 'createdAt',
      headerName: t('created_at') || 'Created At',
      width: 180,
      valueGetter: (params) => {
        const row = params?.row || {};
        const createdAt = row.createdAt || params?.value;
        if (!createdAt) return '—';
        
        try {
          // Handle Firestore Timestamp
          if (typeof createdAt === 'object' && createdAt.toDate) {
            return formatDateTime(createdAt.toDate(), lang || 'en');
          }
          
          // Handle ISO string or timestamp string
          if (typeof createdAt === 'string' || typeof createdAt === 'number') {
            return formatDateTime(createdAt, lang || 'en');
          }
          
          return createdAt;
        } catch (error) {
          return createdAt || 'Invalid Date';
        }
      }
    },
    {
      field: 'creator',
      headerName: t('created_by') || 'Created By',
      width: 200,
      renderCell: (params) => {
        const creator = params.row?.creator;
        if (!creator) return '—';
        
        const displayProps = getUserDisplayProps(creator, users, { lang });
        return (
          <span title={displayProps.title} style={displayProps.style}>
            {displayProps.children}
          </span>
        );
      }
    },
    {
      field: 'updater',
      headerName: t('updated_by') || 'Updated By',
      width: 200,
      renderCell: (params) => {
        const updater = params.row?.updater;
        if (!updater) return '—';
        
        const displayProps = getUserDisplayProps(updater, users, { lang });
        return (
          <span title={displayProps.title} style={displayProps.style}>
            {displayProps.children}
          </span>
        );
      }
    },
    {
      field: 'updatedAt',
      headerName: t('updated_at') || 'Updated At',
      width: 180,
      renderCell: (params) => {
        const updatedAt = params.row?.updatedAt || params?.value;
        if (!updatedAt) return '—';
        if (typeof updatedAt === 'object' && updatedAt.toDate) {
          return formatDateTime(updatedAt.toDate(), lang);
        }
        return formatDateTime(updatedAt, lang);
      }
    },
    {
      field: 'createdBy',
      headerName: t('created_by') || 'Created By',
      width: 180,
      renderCell: (params) => {
        const creator = params.row?.creator;
        if (!creator) return '—';
        const user = users.find(u => (u.uid || u.id) === creator.id || u.id === creator);
        if (user) {
          return getLocalizedUserName(user, lang, user.displayName || user.name || user.email || '—');
        }
        return getLocalizedUserName(creator, lang, creator.displayName || creator.name || '—');
      }
    },
    {
      field: 'updatedBy',
      headerName: t('updated_by') || 'Updated By',
      width: 180,
      renderCell: (params) => {
        const updater = params.row?.updater;
        if (!updater) return '—';
        
        // Try to find user display name from users array
        const user = users.find(u => (u.uid || u.id) === updater.id || u.id === updater);
        if (user) {
          return getLocalizedUserName(user, lang, user.displayName || user.name || user.email || '—');
        }
        return getLocalizedUserName(updater, lang, updater.displayName || updater.name || '—');
      }
    },
    {
      field: 'actions',
      headerName: t('actions') || 'Actions',
      width: 200,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            size="sm"
            variant="ghost"
            icon={getThemedIcon('ui', 'edit', 16, theme)}
            onClick={() => handleEdit(params.row)}
          >
            {t('edit') || 'Edit'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={getThemedIcon('ui', 'trash', 16, theme)}
            onClick={() => handleDelete(params.row)}
            style={{ color: '#dc2626' }}
          >
            {t('delete') || 'Delete'}
          </Button>
        </div>
      )
    }
  ], [t, theme, handleEdit, handleDelete, users, subjectTypes, requirementTypes, lang]);

  return (
    <div className={styles.container}>
      {editingSubject && (
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
          {getThemedIcon('ui', 'edit', 16, theme)} {t('editing_subject', { subjectName: editingSubject.nameEn || editingSubject.nameAr, subjectCode: editingSubject.code || t('subjects_no_code') })}
        </div>
      )}

      <form onSubmit={handleSubmit} className="dashboard-form">
        <div className="form-row">
          <Select
            value={formData.programId}
            onChange={(e) => setFormData({ ...formData, programId: e.target.value })}
            placeholder={t('select_program') || 'Select Program *'}
            options={[
              { value: '', label: t('select_program') || 'Select Program' },
              ...programs.map(program => ({
                value: program.id,
                label: lang === 'ar' 
                  ? (program.nameAr || program.nameEn || program.name || program.id)
                  : (program.nameEn || program.nameAr || program.name || program.id),
              }))
            ]}
            required
          />
          <Input
            ref={codeRef}
            defaultValue={formData.code}
            placeholder={t('subject_code_placeholder') || 'Subject Code * (e.g., CS101)'}
            required
          />
          <Input
            ref={nameEnRef}
            defaultValue={formData.nameEn}
            placeholder={t('subject_name_en_placeholder') || 'Subject Name (English) * (e.g., Introduction to Programming)'}
            required
          />
          <Input
            ref={nameArRef}
            defaultValue={formData.nameAr}
            placeholder={t('subject_name_ar_placeholder') || 'Subject Name (Arabic) * (e.g., مقدمة في البرمجة)'}
            required
            dir="rtl"
          />
          <Input
            ref={creditHoursRef}
            type="number"
            defaultValue={formData.creditHours}
            placeholder={t('credit_hours_subject') || 'Credit Hours'}
            min={1}
            max={6}
          />
          <Select
            ref={typeRef}
            value={formData.type}
            onChange={(e) => {
              const value = e?.target?.value !== undefined ? e.target.value : e;
              const intValue = parseInt(value) || value;
              setFormData({ ...formData, type: intValue });
            }}
            placeholder={t('all_types') || 'All Types'}
            options={subjectTypes.length > 0 
              ? createDropdownOptions(subjectTypes, lang, item => item.id, (item, currentLang) => getLocalizedName(item, currentLang)).map(option => ({
                  ...option,
                  icon: getThemedIcon('ui', 'file_text', 16, theme)
                }))
              : [
                  { value: 1, label: t('core_subject') || 'Core Subject', icon: getThemedIcon('ui', 'file_text', 16, theme) },
                  { value: 2, label: t('elective_subject') || 'Elective Subject', icon: getThemedIcon('ui', 'users', 16, theme) },
                  { value: 3, label: t('specialization_subject') || 'Specialization Subject', icon: getThemedIcon('ui', 'message_square', 16, theme) }
                ]
            }
            required
          />
          <Select
            ref={requirementTypeRef}
            value={formData.requirementType}
            onChange={(e) => {
              const value = e?.target?.value !== undefined ? e.target.value : e;
              const intValue = parseInt(value) || value;
              setFormData({ ...formData, requirementType: intValue });
            }}
            placeholder={t('all_requirements') || 'All Requirements'}
            options={requirementTypes.length > 0
              ? createDropdownOptions(requirementTypes, lang, item => item.id, (item, currentLang) => getLocalizedName(item, currentLang)).map(option => ({
                  ...option,
                  icon: getThemedIcon('ui', 'filter', 16, theme)
                }))
              : [
                  { value: 1, label: t('mandatory') || 'Mandatory', icon: getThemedIcon('ui', 'filter', 16, theme) },
                  { value: 2, label: t('optional') || 'Optional', icon: getThemedIcon('ui', 'book_open', 16, theme) },
                  { value: 3, label: t('prerequisite') || 'Prerequisite', icon: getThemedIcon('ui', 'file_text', 16, theme) }
                ]
            }
            required
          />
        </div>
        <div className="form-row">
          <Input
            ref={descEnRef}
            defaultValue={formData.descriptionEn}
            placeholder={t('description_en_placeholder') || 'Description (English)'}
          />
          <Input
            ref={descArRef}
            defaultValue={formData.descriptionAr}
            placeholder={t('description_ar_placeholder') || 'Description (Arabic) - وصف المادة'}
            dir="rtl"
          />
        </div>
        <div className="form-actions">
          <Button type="submit" variant="primary" loading={loading}>
            {editingSubject ? (t('update') || 'Update') : (t('save') || 'Save')}
          </Button>
          {editingSubject && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setEditingSubject(null);
                resetForm();
              }}
            >
              {t('cancel_edit') || 'Cancel Edit'}
            </Button>
          )}
        </div>
      </form>

      <div className={styles.content}>          
        <AdvancedDataGrid
            rows={subjects}
            getRowId={(row) => row.docId || row.id}
            columns={gridColumns}
            pageSize={10}
            pageSizeOptions={[10, 25, 50, 100]}
            checkboxSelection
            exportFileName="subjects"
            showExportButton
            exportLabel={t('export') || 'Export'}
            loadingOverlayMessage={loading ? (t('loading_subjects') || "Loading subjects...") : undefined}
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

export default SubjectsPage;

