import React, { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import logger from '@utils/logger';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { Navigate } from 'react-router-dom';
import { getThemedIcon } from '@constants/iconTypes';
import { getUsers } from '@services/business/userService';
import { getClasses } from '@services/business/classService';
import { getPrograms } from '@services/business/programService';
import { getSubjects, createSubject, updateSubject, deleteSubject } from '@services/business/subjectService';
import { SimpleLoading, Button, Input, Select, useToast, AdvancedDataGrid } from '@ui';
import { useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { DeleteModal, useDeleteModal } from '@ui';
import { useTheme } from '@contexts/ThemeContext';
import { logActivity, ACTIVITY_LOG_TYPES } from '@services/other/activityLogger';
import { ACTIVITY_TYPES } from '@constants';
import styles from './SubjectsManagementPage.module.css';

const SubjectsManagementPage = () => {
  const { isAdmin, isSuperAdmin, isInstructor, user, loading: authLoading } = useAuth();
  const { lang, t } = useLang();
  const { theme } = useTheme();
  const toast = useToast();
  
  const { startLoading } = useGlobalLoading();
  
  const [subjects, setSubjects] = useState([]);
  const [programs, setPrograms] = useState([]);
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
  const totalHoursRef = useRef(null);
  const hoursPerWeekRef = useRef(null);
  const [formData, setFormData] = useState({
    programId: '',
    code: '',
    name_en: '',
    name_ar: '',
    description_en: '',
    description_ar: '',
    creditHours: 3,
    totalHours: 36,
    type: 'lecture', // 'lecture' | 'lab' | 'mix'
    hoursPerWeek: 3,
    requirementType: 'general_mandatory' // 'general_mandatory' | 'major_mandatory' | 'major_optional'
  });

  const syncRefsToState = useCallback(() => {
    return {
      code: codeRef.current?.value ?? formData.code,
      name_en: nameEnRef.current?.value ?? formData.name_en,
      name_ar: nameArRef.current?.value ?? formData.name_ar,
      description_en: descEnRef.current?.value ?? formData.description_en,
      description_ar: descArRef.current?.value ?? formData.description_ar,
      creditHours: creditHoursRef.current?.value ? Number.parseInt(creditHoursRef.current.value) : formData.creditHours,
      totalHours: totalHoursRef.current?.value ? Number.parseInt(totalHoursRef.current.value) : formData.totalHours,
      hoursPerWeek: hoursPerWeekRef.current?.value ? Number.parseInt(hoursPerWeekRef.current.value) : formData.hoursPerWeek
    };
  }, [formData]);

  const loadData = useCallback(async (isInitial = false) => {
    if (!isInitial) setLoading(true);
    try {
      const [subjectsResult, programsResult] = await Promise.all([
        getSubjects(),
        getPrograms()
      ]);

      if (subjectsResult.success) {
        setSubjects(subjectsResult.data || []);
      }
      if (programsResult.success) {
        setPrograms(programsResult.data || []);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      if (!isInitial) setLoading(false);
    }
  }, [toast]);

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
    if (nameEnRef.current) nameEnRef.current.value = formData.name_en || '';
    if (nameArRef.current) nameArRef.current.value = formData.name_ar || '';
    if (descEnRef.current) descEnRef.current.value = formData.description_en || '';
    if (descArRef.current) descArRef.current.value = formData.description_ar || '';
    if (creditHoursRef.current) creditHoursRef.current.value = formData.creditHours?.toString() || '3';
    if (totalHoursRef.current) totalHoursRef.current.value = formData.totalHours?.toString() || '36';
    if (hoursPerWeekRef.current) hoursPerWeekRef.current.value = formData.hoursPerWeek?.toString() || '3';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingSubject]); // only when we load a subject for editing

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    console.time('[PERF] handleSubjectSubmit');
    
    // Sync refs
    const textValues = syncRefsToState();
    
    // Validation
    if (!formData.programId || !formData.code || !textValues.name_en || !textValues.name_ar) {
      toast.error(t('please_fill_required_fields_subject') || 'Please fill in all required fields');
      return;
    }

    const subjectData = {
      ...formData,
      ...textValues
    };

    setLoading(true);
    try {
      let result;
      if (editingSubject) {
        result = await updateSubject(editingSubject.docId, subjectData, user);
      } else {
        result = await createSubject(subjectData, user);
      }

      if (result.success) {
        // Log activity
        try {
          await logActivity(editingSubject ? ACTIVITY_LOG_TYPES.SUBJECT_UPDATED : ACTIVITY_LOG_TYPES.SUBJECT_CREATED, {
            subjectId: editingSubject?.docId || result.id,
            subjectName: textValues.name_en,
            subjectCode: formData.code,
            programId: formData.programId
          });
        } catch (e) { logger.warn('Failed to log activity:', e); }
        toast.success(editingSubject ? t('subject_updated_successfully') || 'Subject updated successfully' : t('subject_created_successfully') || 'Subject created successfully');
        setEditingSubject(null);
        resetForm();
        loadData();
      } else {
        toast.error(result.error || t('operation_failed_subject') || 'Operation failed');
      }
    } catch (error) {
      logger.error('Error saving subject:', error);
      toast.error(error.message || t('subjects_error_message', { error: error.message }));
    } finally {
      setLoading(false);
      console.timeEnd('[PERF] handleSubjectSubmit');
    }
  }, [editingSubject, formData, toast, t, loadData, syncRefsToState]);

  const handleEdit = useCallback((subject) => {
    setEditingSubject(subject);
    setFormData({
      programId: subject.programId || '',
      code: subject.code || '',
      name_en: subject.name_en || '',
      name_ar: subject.name_ar || '',
      requirementType: subject.requirementType || 'general_mandatory',
      description_en: subject.description_en || '',
      description_ar: subject.description_ar || '',
      creditHours: subject.creditHours || 3,
      totalHours: subject.totalHours || 36,
      type: subject.type || 'lecture',
      hoursPerWeek: subject.hoursPerWeek || 3,
      classIds: subject.classIds || []
    });
    // Sync refs
    if (nameEnRef.current) nameEnRef.current.value = subject.name_en || '';
    if (nameArRef.current) nameArRef.current.value = subject.name_ar || '';
    if (descEnRef.current) descEnRef.current.value = subject.description_en || '';
    if (descArRef.current) descArRef.current.value = subject.description_ar || '';
  }, []);

  const handleDelete = useCallback((subject) => {
    deleteSubjectModal(subject, async () => {
      // Optimistic update
      setSubjects(prev => prev.filter(s => (s.docId || s.id) !== (subject.docId || subject.id)));
      
      try {
        const result = await deleteSubject(subject.docId);
        if (result.success) {
          try {
            await logActivity(ACTIVITY_LOG_TYPES.SUBJECT_DELETED, {
              subjectId: subject.docId,
              subjectName: subject.name_en,
              subjectCode: subject.code
            });
          } catch (e) { logger.warn('Failed to log activity:', e); }
          toast.success(t('subject_deleted_successfully') || 'Subject deleted successfully');
          await loadData();
        } else {
          // Rollback
          setSubjects(prev => [...prev, subject]);
          toast.error(result.error || t('failed_to_delete_subject') || 'Failed to delete subject');
        }
      } catch (error) {
        // Rollback
        setSubjects(prev => [...prev, subject]);
        logger.error('Error deleting subject:', error);
        toast.error(error.message || t('subjects_error_message', { error: error.message }));
      }
    });
  }, [deleteSubjectModal, toast, t, loadData]);

const resetForm = () => {
    setFormData({
      programId: '',
      code: '',
      name_en: '',
      name_ar: '',
      description_en: '',
      description_ar: '',
      creditHours: 3,
      totalHours: 36,
      type: 'lecture',
      hoursPerWeek: 3,
      requirementType: 'general_mandatory',
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
    { field: 'name_en', headerName: t('name_en') || 'Name (EN)', flex: 1, minWidth: 180 },
    { field: 'name_ar', headerName: t('name_ar') || 'Name (AR)', flex: 1, minWidth: 180 },
    { field: 'creditHours', headerName: t('credits') || 'Credits', width: 100 },
    { field: 'totalHours', headerName: t('total_hours') || 'Total Hours', width: 120 },
    {
      field: 'type',
      headerName: t('type') || 'Type',
      width: 120,
      valueGetter: (params) => {
        const row = params?.row || {};
        const type = row.type || params?.value;
        const typeMap = { lecture: t('lecture') || 'Lecture', lab: t('lab') || 'Lab', mix: t('mix') || 'Mix' };
        return type ? (typeMap[type] || type) : '—';
      }
    },
    { field: 'hoursPerWeek', headerName: t('hours_per_week') || 'Hours/Week', width: 120 },
    {
      field: 'createdAt',
      headerName: t('created_at') || 'Created At',
      width: 150,
      valueGetter: (params) => {
        const row = params?.row || {};
        const createdAt = row.createdAt || params?.value;
        if (!createdAt) return '—';
        // Handle both Firestore Timestamp and string formats
        if (typeof createdAt === 'object' && createdAt.toDate) {
          return createdAt.toDate().toLocaleDateString();
        }
        if (typeof createdAt === 'string') {
          return new Date(createdAt).toLocaleDateString();
        }
        return '—';
      }
    },
    {
      field: 'createdBy',
      headerName: t('created_by') || 'Created By (UID)',
      width: 180,
      valueGetter: (params) => {
        const row = params?.row || {};
        const createdBy = row.createdBy || params?.value;
        return createdBy || '—';
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
  ], [t, theme, handleEdit, handleDelete]);

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
          {getThemedIcon('ui', 'edit', 16, theme)} {t('editing_subject', { subjectName: editingSubject.name_en, subjectCode: editingSubject.code || t('subjects_no_code') })}
        </div>
      )}

      <form onSubmit={handleSubmit} className="dashboard-form">
        <div className="form-row">
          <Input
            ref={codeRef}
            defaultValue={formData.code}
            placeholder={t('subject_code_placeholder') || 'Subject Code * (e.g., CS101)'}
            required
          />
          <Input
            ref={nameEnRef}
            defaultValue={formData.name_en}
            placeholder={t('subject_name_en_placeholder') || 'Subject Name (English) * (e.g., Introduction to Programming)'}
            required
          />
          <Input
            ref={nameArRef}
            defaultValue={formData.name_ar}
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
          <Input
            ref={totalHoursRef}
            type="number"
            defaultValue={formData.totalHours}
            placeholder={t('total_hours_subject') || 'Total Hours'}
            min={1}
            helperText={t('total_hours_helper') || 'Total hours for the entire course'}
          />
          <Select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            placeholder={t('all_types') || 'All Types'}
            options={[
              { value: 'lecture', label: t('lecture') || 'Lecture', icon: getThemedIcon('ui', 'file_text', 16, theme) },
              { value: 'lab', label: t('lab') || 'Lab', icon: getThemedIcon('ui', 'users', 16, theme) },
              { value: 'mix', label: t('mix_lecture_lab') || 'Mix (Lecture + Lab)', icon: getThemedIcon('ui', 'file_text', 16, theme) }
            ]}
            required
          />
          <Select
            value={formData.requirementType}
            onChange={(e) => setFormData({ ...formData, requirementType: e.target.value })}
            placeholder={t('all_requirements') || 'All Requirements'}
            options={[
              { value: 'general_mandatory', label: t('general_mandatory') || 'General Mandatory', icon: getThemedIcon('ui', 'filter', 16, theme) },
              { value: 'major_mandatory', label: t('major_mandatory') || 'Major Mandatory', icon: getThemedIcon('ui', 'book_open', 16, theme) },
              { value: 'major_optional', label: t('major_optional') || 'Major Optional', icon: getThemedIcon('ui', 'file_text', 16, theme) }
            ]}
            required
          />
          <Input
            ref={hoursPerWeekRef}
            type="number"
            defaultValue={formData.hoursPerWeek}
            placeholder={t('hours_per_week_placeholder') || 'Hours Per Week'}
            min={1}
            max={20}
            step={0.5}
            helperTextInfo={t('weekly_contact_hours') || 'Weekly contact hours'}
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

export default SubjectsManagementPage;

