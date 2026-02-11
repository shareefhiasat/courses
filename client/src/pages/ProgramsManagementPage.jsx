import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import logger from '@utils/logger';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { Navigate } from 'react-router-dom';
import { getPrograms, createProgram, updateProgram, deleteProgram } from '@firebaseServices/programService';
import { Loading, Button, Input, Textarea, useToast, AdvancedDataGrid } from '@ui';
import DeleteModal, { useDeleteModal } from '@ui/DeleteModal/DeleteModal';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import { logActivity, ACTIVITY_LOG_TYPES } from '@firebaseServices/activityLogger';
import styles from './ProgramsManagementPage.module.css';

const ProgramsManagementPage = () => {
  const { isAdmin, isSuperAdmin, loading: authLoading } = useAuth();
  const { t } = useLang();
  const { theme } = useTheme();
  const toast = useToast();
  
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProgram, setEditingProgram] = useState(null);
  const { deleteModal, deleteProgram: deleteProgramModal, handleDeleteConfirm, hideDeleteModal } = useDeleteModal(t);
  
  // Refs for performance (uncontrolled inputs)
  const nameEnRef = useRef(null);
  const nameArRef = useRef(null);
  const descEnRef = useRef(null);
  const descArRef = useRef(null);
  const codeRef = useRef(null);
  const durationRef = useRef(null);
  const minGPARef = useRef(null);
  const creditHoursRef = useRef(null);
  const [formData, setFormData] = useState({
    name_en: '',
    name_ar: '',
    code: '',
    description_en: '',
    description_ar: '',
    duration_years: 2,
    minGPA: 1.5,
    totalCreditHours: 70
  });

  const syncRefsToState = useCallback(() => {
    return {
      code: codeRef.current?.value ?? formData.code,
      name_en: nameEnRef.current?.value ?? formData.name_en,
      name_ar: nameArRef.current?.value ?? formData.name_ar,
      description_en: descEnRef.current?.value ?? formData.description_en,
      description_ar: descArRef.current?.value ?? formData.description_ar,
      duration_years: durationRef.current?.value ? Number.parseInt(durationRef.current.value) : formData.duration_years,
      minGPA: minGPARef.current?.value ? Number.parseFloat(minGPARef.current.value) : formData.minGPA,
      totalCreditHours: creditHoursRef.current?.value ? Number.parseInt(creditHoursRef.current.value) : formData.totalCreditHours
    };
  }, [formData]);

  const loadPrograms = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getPrograms();
      if (result.success) {
        setPrograms(result.data || []);
      } else {
        toast.error(result.error || t('failed_to_load_programs') || 'Failed to load programs');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  // Sync refs when editing an existing program
  useEffect(() => {
    if (codeRef.current) codeRef.current.value = formData.code || '';
    if (nameEnRef.current) nameEnRef.current.value = formData.name_en || '';
    if (nameArRef.current) nameArRef.current.value = formData.name_ar || '';
    if (descEnRef.current) descEnRef.current.value = formData.description_en || '';
    if (descArRef.current) descArRef.current.value = formData.description_ar || '';
    if (durationRef.current) durationRef.current.value = formData.duration_years?.toString() || '2';
    if (minGPARef.current) minGPARef.current.value = formData.minGPA?.toString() || '1.5';
    if (creditHoursRef.current) creditHoursRef.current.value = formData.totalCreditHours?.toString() || '70';
  }, [editingProgram]); // only when we load a program for editing

  useEffect(() => {
    if (!authLoading && (isAdmin || isSuperAdmin)) {
      loadPrograms();
    }
  }, [authLoading, isAdmin, isSuperAdmin, loadPrograms]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.time('[PERF] handleProgramSubmit');
    
    // Sync refs to get text values
    const textValues = syncRefsToState();
    
    // Validation
    if (!textValues.name_en || !textValues.name_ar || !formData.code) {
      toast.error(t('please_fill_required_fields') || 'Please fill in all required fields');
      return;
    }

    const programData = {
      ...formData,
      ...textValues
    };

    setLoading(true);
    try {
      let result;
      if (editingProgram) {
        result = await updateProgram(editingProgram.docId, programData);
      } else {
        result = await createProgram(programData);
      }

      if (result.success) {
        // Log activity
        try {
          await logActivity(editingProgram ? ACTIVITY_LOG_TYPES.PROGRAM_UPDATED : ACTIVITY_LOG_TYPES.PROGRAM_CREATED, {
            programId: editingProgram?.docId || result.id,
            programName: textValues.name_en,
            programCode: formData.code
          });
        } catch (e) { logger.warn('Failed to log activity:', e); }
        toast.success(editingProgram ? t('program_updated_successfully') || 'Program updated successfully' : t('program_created_successfully') || 'Program created successfully');
        setEditingProgram(null);
        resetForm();
        loadPrograms();
      } else {
        toast.error(result.error || t('operation_failed') || 'Operation failed');
      }
    } catch (error) {
      logger.error('Error saving program:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
      console.timeEnd('[PERF] handleProgramSubmit');
    }
  };

  const handleEdit = useCallback((program) => {
    setEditingProgram(program);
    setFormData({
      name_en: program.name_en || '',
      name_ar: program.name_ar || '',
      code: program.code || '',
      description_en: program.description_en || '',
      description_ar: program.description_ar || '',
      duration_years: program.duration_years || 2,
      minGPA: program.minGPA ?? 1.5,
      totalCreditHours: program.totalCreditHours || 70
    });
    // Sync refs
    if (nameEnRef.current) nameEnRef.current.value = program.name_en || '';
    if (nameArRef.current) nameArRef.current.value = program.name_ar || '';
    if (descEnRef.current) descEnRef.current.value = program.description_en || '';
    if (descArRef.current) descArRef.current.value = program.description_ar || '';
  }, []);

  const handleDelete = useCallback((program) => {
    deleteProgramModal(program, async () => {
      // Optimistic update
      setPrograms(prev => prev.filter(p => (p.docId || p.id) !== (program.docId || program.id)));
      
      try {
        const result = await deleteProgram(program.docId);
        if (result.success) {
          // Log activity
          try {
            await logActivity(ACTIVITY_LOG_TYPES.PROGRAM_DELETED, {
              programId: program.docId,
              programName: program.name_en,
              programCode: program.code
            });
          } catch (e) { logger.warn('Failed to log activity:', e); }
          toast.success(t('program_deleted_successfully') || 'Program deleted successfully');
          await loadPrograms();
        } else {
          // Rollback on failure
          setPrograms(prev => [...prev, program]);
          toast.error(result.error || t('failed_to_delete_program') || 'Failed to delete program');
        }
      } catch (error) {
        // Rollback on error
        setPrograms(prev => [...prev, program]);
        logger.error('Error deleting program:', error);
        toast.error(error.message);
      }
    });
  }, [deleteProgramModal, toast, t, loadPrograms]);


  const resetForm = () => {
    setFormData({
      name_en: '',
      name_ar: '',
      code: '',
      description_en: '',
      description_ar: '',
      duration_years: 2,
      minGPA: 1.5,
      totalCreditHours: 70
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
      headerName: t('program_code') || 'Code', 
      width: 120,
      valueGetter: (params) => {
        const row = params?.row || {};
        const code = row.code || params?.value;
        return code || '—';
      }
    },
    { field: 'name_en', headerName: t('program_name_en') || 'Name (EN)', flex: 1, minWidth: 180 },
    { field: 'name_ar', headerName: t('program_name_ar') || 'Name (AR)', flex: 1, minWidth: 180 },
    {
      field: 'duration_years',
      headerName: t('duration_years') || 'Duration (Years)',
      width: 140,
      valueGetter: (params) => `${params.value || 2} ${t('years') || 'years'}`
    },
    {
      field: 'minGPA',
      headerName: t('min_gpa_header') || 'Min GPA',
      width: 100,
      valueGetter: (params) => {
        const row = params?.row || {};
        const value = row.minGPA ?? params?.value;
        if (value === null || value === undefined) return 'N/A';
        if (typeof value === 'number') return value.toFixed(2);
        const numValue = Number.parseFloat(value);
        if (isNaN(numValue)) return 'N/A';
        return numValue.toFixed(2);
      }
    },
    { field: 'totalCreditHours', headerName: t('credit_hours_header') || 'Credit Hours', width: 120 },
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


  if (authLoading) {
    return <Loading variant="overlay" message={t('loading') || 'Loading...'} fancyVariant="dots" />;
  }

  if (!isAdmin && !isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={styles.container}>
      {editingProgram && (
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
          {getThemedIcon('ui', 'edit', 16, theme)} {t('editing_program', { programName: editingProgram.name_en, programCode: editingProgram.code || t('no_code') || 'No code' }) || `Editing Program: ${editingProgram.name_en} (${editingProgram.code || 'No code'})`}
        </div>
      )}

      <form onSubmit={handleSubmit} className="dashboard-form">
        <div className="form-row">
          <Input
            ref={codeRef}
            defaultValue={formData.code}
            placeholder={t('program_code_placeholder') || 'Program Code * (e.g., CS-DIP)'}
            required
          />
          <Input
            ref={nameEnRef}
            defaultValue={formData.name_en}
            placeholder={t('program_name_en_placeholder') || 'Program Name (English) * (e.g., Computer Science Diploma)'}
            required
          />
          <Input
            ref={nameArRef}
            defaultValue={formData.name_ar}
            placeholder={t('program_name_ar_placeholder') || 'Program Name (Arabic) * (e.g., دبلوم علوم الحاسوب)'}
            required
            dir="rtl"
          />
          <input
            ref={durationRef}
            type="number"
            defaultValue={formData.duration_years}
            placeholder={t('duration_years_placeholder') || 'Duration (Years)'}
            min={1}
            max={10}
            className="dashboard-input"
          />
          <input
            ref={minGPARef}
            type="number"
            defaultValue={formData.minGPA}
            placeholder={t('minimum_gpa_placeholder') || 'Minimum GPA'}
            min={0}
            max={4}
            step={0.1}
            className="dashboard-input"
          />
          <input
            ref={creditHoursRef}
            type="number"
            defaultValue={formData.totalCreditHours}
            placeholder={t('total_credit_hours_placeholder') || 'Total Credit Hours'}
            min={1}
            className="dashboard-input"
          />
        </div>
        <div className="form-row">
          <Textarea
            ref={descEnRef}
            defaultValue={formData.description_en}
            placeholder={t('description_en_placeholder') || 'Description (English)'}
            rows={2}
          />
          <Textarea
            ref={descArRef}
            defaultValue={formData.description_ar}
            placeholder={t('description_ar_placeholder') || 'Description (Arabic) - وصف البرنامج بالعربية'}
            rows={2}
            dir="rtl"
          />
        </div>
        <div className="form-actions">
          <Button type="submit" variant="primary" loading={loading}>
            {editingProgram ? (t('update') || 'Update') : (t('save') || 'Save')}
          </Button>
          {editingProgram && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setEditingProgram(null);
                resetForm();
              }}
            >
              {t('cancel') || 'Cancel'}
            </Button>
          )}
        </div>
      </form>

      <div className={styles.content}>
        <AdvancedDataGrid
            rows={programs}
            getRowId={(row) => row.docId || row.id}
            columns={gridColumns}
            pageSize={10}
            pageSizeOptions={[10, 25, 50, 100]}
            checkboxSelection
            exportFileName="programs"
            showExportButton
            exportLabel={t('export') || 'Export'}
            loadingOverlayMessage={loading ? (t('loading_programs') || "Loading programs...") : undefined}
            fancyVariant="dots"
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

export default ProgramsManagementPage;

