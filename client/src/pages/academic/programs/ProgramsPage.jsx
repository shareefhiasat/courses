import React, { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import Joyride from 'react-joyride';
import { usePageTour } from '@hooks/usePageTour';
import { getJoyrideBaseProps, getTourStyles } from '@utils/tourConfig';
import { info, error, warn, debug } from '@services/utils/logger.js';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { Navigate } from 'react-router-dom';
import { getPrograms, createProgram, updateProgram, deleteProgram } from '@services/business/programService';
import { getUsers } from '@services/business/userService';
import { useAuditGridColumns } from '@hooks/useAuditGridColumns.js';
import { getThemedIcon } from '@constants/iconTypes';
import { SimpleLoading, Button, Input, Textarea, useToast, AdvancedDataGrid } from '@ui';
import { useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { DeleteModal, useDeleteModal } from '@ui';
import { useTheme } from '@contexts/ThemeContext';
import { logActivity, ACTIVITY_LOG_TYPES } from '@services/other/activityLogger';
import styles from './ProgramsPage.module.css';

const ProgramsPage = () => {
  const { isAdmin, isSuperAdmin, user, loading: authLoading } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const toast = useToast();
  const { startLoading } = useGlobalLoading();
  
  const [programs, setPrograms] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProgram, setEditingProgram] = useState(null);
  const { deleteModal, deleteProgram: deleteProgramModal, handleDeleteConfirm, hideDeleteModal } = useDeleteModal(t);

  // ── Guided Tour ────────────────────────────────────────────────────────────
  const tourSteps = useMemo(() => [
    { target: 'body', content: t('tour.programs_search'), disableBeacon: true, placement: 'center' },
    { target: '[data-tour="programs-form"]', content: t('tour.programs_add'), disableBeacon: true, placement: 'bottom' },
    { target: '[data-tour="programs-grid"]', content: t('tour.programs_grid'), disableBeacon: true, placement: 'top' },
    { target: '[data-tour="programs-grid"]', content: t('tour.programs_edit'), disableBeacon: true, placement: 'top' },
    { target: '[data-tour="programs-grid"]', content: t('tour.programs_delete'), disableBeacon: true, placement: 'top' },
    { target: '[data-tour="programs-grid"]', content: t('tour.programs_export'), disableBeacon: true, placement: 'top' },
  ], [lang, t]);
  const { run: runTour, steps: activeTourSteps, callback: handleTourCallback, TourTooltipComponent } =
    usePageTour('programs', 'programsTourSeen', tourSteps);
  // ──────────────────────────────────────────────────────────────────────────
  
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
    nameEn: '',
    nameAr: '',
    code: '',
    descriptionEn: '',
    descriptionAr: '',
    durationYears: 2,
    minGPA: 1.5,
    totalCreditHours: 70
  });

  const syncRefsToState = useCallback(() => {
    return {
      code: codeRef.current?.value ?? formData.code,
      nameEn: nameEnRef.current?.value ?? formData.nameEn,
      nameAr: nameArRef.current?.value ?? formData.nameAr,
      descriptionEn: descEnRef.current?.value ?? formData.descriptionEn,
      descriptionAr: descArRef.current?.value ?? formData.descriptionAr,
      durationYears: durationRef.current?.value ? Number.parseInt(durationRef.current.value) : formData.durationYears,
      minGPA: minGPARef.current?.value ? Number.parseFloat(minGPARef.current.value) : formData.minGPA,
      totalCreditHours: creditHoursRef.current?.value ? Number.parseInt(creditHoursRef.current.value) : formData.totalCreditHours
    };
  }, [formData]);

  const loadPrograms = useCallback(async (isInitial = false) => {
    if (!isInitial) setLoading(true);
    try {
      const [programsResult, usersResult] = await Promise.all([
        getPrograms(),
        getUsers()
      ]);
      
      if (programsResult.success) {
        setPrograms(programsResult.data || []);
      } else {
        // Don't show toast on initial load, only on manual refresh
        if (!isInitial) {
          toast.error(programsResult.error || t('failed_to_load_programs'));
        }
      }
      
      if (usersResult.success) {
        setUsers(usersResult.data || []);
      } else {
        // Don't show toast on initial load, only on manual refresh
        if (!isInitial) {
          toast.error(usersResult.error || 'Failed to load users');
        }
      }
    } catch (error) {
      // Don't show toast on initial load, only on manual refresh
      if (!isInitial) {
        toast.error(error.message || t('programs_error_message', { error: error.message }));
      }
    } finally {
      if (!isInitial) setLoading(false);
    }
  }, [toast, t]);

  // Use GlobalLoading for initial data load
  useLayoutEffect(() => {
    if (authLoading) return;
    if (!isAdmin && !isSuperAdmin) return;

    let stopLoading = null;

    const initialLoad = async () => {
      stopLoading = startLoading({ message: t('loading_programs') });
      await loadPrograms(true);
      if (stopLoading) stopLoading();
      setLoading(false);
    };

    initialLoad();

    return () => {
      if (stopLoading) stopLoading();
    };
  }, [authLoading, isAdmin, isSuperAdmin, startLoading, t]);

  // Sync refs when editing an existing program
  useEffect(() => {
    if (codeRef.current) codeRef.current.value = formData.code || '';
    if (nameEnRef.current) nameEnRef.current.value = formData.nameEn || '';
    if (nameArRef.current) nameArRef.current.value = formData.nameAr || '';
    if (descEnRef.current) descEnRef.current.value = formData.descriptionEn || '';
    if (descArRef.current) descArRef.current.value = formData.descriptionAr || '';
    if (durationRef.current) durationRef.current.value = formData.durationYears?.toString() || '2';
    if (minGPARef.current) minGPARef.current.value = formData.minGPA?.toString() || '1.5';
    if (creditHoursRef.current) creditHoursRef.current.value = formData.totalCreditHours?.toString() || '70';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingProgram]); // only when we load a program for editing

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.time('[PERF] handleProgramSubmit');
    
    // Sync refs to get text values
    const textValues = syncRefsToState();
    
    // Validation
    if (!textValues.nameEn || !textValues.nameAr || !textValues.code) {
      toast.error(t('please_fill_required_fields'));
      return;
    }

    const programData = {
      ...formData,
      ...textValues
      // No mapping needed - schemas now match UI form exactly!
    };

    setLoading(true);
    try {
      let result;
      if (editingProgram) {
        result = await updateProgram(editingProgram.id, programData, user);
      } else {
        result = await createProgram(programData, user);
      }

      if (result.success) {
        // Log activity
        try {
          await logActivity(editingProgram ? ACTIVITY_LOG_TYPES.PROGRAM_UPDATED : ACTIVITY_LOG_TYPES.PROGRAM_CREATED, {
            programId: editingProgram?.id || result.id,
            programName: textValues.nameEn,
            programCode: formData.code
          });
        } catch (e) { /* Activity logging failed */ }
        toast.success(editingProgram ? t('program_updated_successfully') : t('program_created_successfully'));
        setEditingProgram(null);
        resetForm();
        loadPrograms();
      } else {
        toast.error(result.error || t('operation_failed'));
      }
    } catch (err) {
      toast.error(err.message || t('programs_error_message', { error: err.message }));
    } finally {
      setLoading(false);
      console.timeEnd('[PERF] handleProgramSubmit');
    }
  };

  const handleEdit = useCallback((program) => {
    setEditingProgram(program);
    setFormData({
      nameEn: program.nameEn || '',
      nameAr: program.nameAr || '',
      code: program.code || '',
      descriptionEn: program.descriptionEn || '',
      descriptionAr: program.descriptionAr || '',
      durationYears: program.durationYears || 2,
      minGPA: program.minGPA ?? 1.5,
      totalCreditHours: program.totalCreditHours || 70
    });
    // Sync refs
    if (nameEnRef.current) nameEnRef.current.value = program.nameEn || '';
    if (nameArRef.current) nameArRef.current.value = program.nameAr || '';
    if (descEnRef.current) descEnRef.current.value = program.descriptionEn || '';
    if (descArRef.current) descArRef.current.value = program.descriptionAr || '';
  }, []);

  const handleDelete = useCallback((program) => {
    deleteProgramModal(program, async () => {
      // Optimistic update
      setPrograms(prev => prev.filter(p => (p.docId || p.id) !== (program.docId || program.id)));
      
      try {
        const result = await deleteProgram(program.id);
        if (result.success) {
          // Log activity
          try {
            await logActivity(ACTIVITY_LOG_TYPES.PROGRAM_DELETED, {
              programId: program.id,
              programName: program.nameEn || program.nameAr,
              programCode: program.code
            });
          } catch (e) { /* Activity logging failed */ }
          toast.success(result.message || t('program_deleted_successfully'));
          await loadPrograms();
        } else if (result.code === 'HAS_DEPENDENCIES' && result.dependencies) {
          // Rollback and show force-delete confirmation
          setPrograms(prev => [...prev, program]);
          deleteProgramModal(program, async () => {
            setPrograms(prev => prev.filter(p => (p.docId || p.id) !== (program.docId || program.id)));
            try {
              const forceResult = await deleteProgram(program.id, null, { force: true });
              if (forceResult.success) {
                toast.success(forceResult.message || 'Program deactivated successfully');
                await loadPrograms();
              } else {
                setPrograms(prev => [...prev, program]);
                toast.error(forceResult.error || 'Failed to deactivate program');
              }
            } catch (err) {
              setPrograms(prev => [...prev, program]);
              toast.error(err.message || 'Failed to deactivate program');
            }
          }, { relatedRecords: result.dependencies });
        } else {
          // Rollback on failure
          setPrograms(prev => [...prev, program]);
          toast.error(result.error || t('failed_to_delete_program'));
        }
      } catch (error) {
        // Rollback on error
        setPrograms(prev => [...prev, program]);
        toast.error(error.message || t('programs_error_message', { error: error.message }));
      }
    });
  }, [deleteProgramModal, toast, t, loadPrograms]);


  const resetForm = () => {
    setFormData({
      nameEn: '',
      nameAr: '',
      code: '',
      descriptionEn: '',
      descriptionAr: '',
      durationYears: 2,
      minGPA: 1.5,
      totalCreditHours: 70
    });
    // Reset refs
    if (nameEnRef.current) nameEnRef.current.value = '';
    if (nameArRef.current) nameArRef.current.value = '';
    if (descEnRef.current) descEnRef.current.value = '';
    if (descArRef.current) descArRef.current.value = '';
  };

  const auditColumns = useAuditGridColumns({ users });

  const gridColumns = useMemo(() => [
    { 
      field: 'code', 
      headerName: t('program_code'), 
      width: 120,
      valueGetter: (params) => {
        const row = params?.row || {};
        const code = row.code || params?.value;
        return code || '—';
      }
    },
    { field: 'nameEn', headerName: t('program_name_en'), flex: 1, minWidth: 180 },
    { field: 'nameAr', headerName: t('program_name_ar'), flex: 1, minWidth: 180 },
    {
      field: 'durationYears',
      headerName: t('duration_years'),
      width: 140,
      valueGetter: (params) => `${params.value || 2} ${t('years')}`
    },
    {
      field: 'minGPA',
      headerName: t('min_gpa_header'),
      width: 100,
      valueGetter: (params) => {
        const row = params?.row || {};
        const value = row.minGPA ?? params?.value;
        if (value === null || value === undefined) return t('programs_na_value');
        if (typeof value === 'number') return value.toFixed(2);
        const numValue = Number.parseFloat(value);
        if (isNaN(numValue)) return t('programs_na_value');
        return numValue.toFixed(2);
      }
    },
    { field: 'totalCreditHours', headerName: t('credit_hours_header'), width: 120 },
    ...auditColumns,
    {
      field: 'actions',
      headerName: t('actions'),
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
            {t('edit')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={getThemedIcon('ui', 'trash', 16, theme)}
            onClick={() => handleDelete(params.row)}
            style={{ color: '#dc2626' }}
          >
            {t('delete')}
          </Button>
        </div>
      )
    }
  ], [t, theme, handleEdit, handleDelete, users, auditColumns]);


  if (authLoading) {
    return <GlobalLoadingFallback />;
  }

  if (!isAdmin && !isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={styles.container}>
      <Joyride
        {...getJoyrideBaseProps({ theme, t })}
        run={runTour}
        steps={activeTourSteps}
        callback={handleTourCallback}
        tooltipComponent={TourTooltipComponent}
        styles={getTourStyles(theme)}
      />
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
          {getThemedIcon('ui', 'edit', 16, theme)} {t('editing_program', { programName: editingProgram.nameEn || editingProgram.nameAr, programCode: editingProgram.code || t('programs_no_code') })}
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'0.5rem' }}>
        
      </div>
      <form data-tour="programs-form" onSubmit={handleSubmit} className="dashboard-form">
        <div className="form-row">
          <Input
            ref={codeRef}
            defaultValue={formData.code}
            placeholder={t('program_code_placeholder')}
            required
          />
          <Input
            ref={nameEnRef}
            defaultValue={formData.nameEn}
            placeholder={t('program_name_en_placeholder')}
            required
          />
          <Input
            ref={nameArRef}
            defaultValue={formData.nameAr}
            placeholder={t('program_name_ar_placeholder')}
            required
            dir="rtl"
          />
          <Input
            ref={durationRef}
            type="number"
            defaultValue={formData.durationYears}
            placeholder={t('duration_years_placeholder')}
            min={1}
            max={10}
          />
          <Input
            ref={minGPARef}
            type="number"
            defaultValue={formData.minGPA}
            placeholder={t('minimum_gpa_placeholder')}
            min={0}
            max={4}
            step={0.1}
          />
          <Input
            ref={creditHoursRef}
            type="number"
            defaultValue={formData.totalCreditHours}
            placeholder={t('total_credit_hours_placeholder')}
            min={1}
          />
        </div>
        <div className="form-row">
          <Input
            ref={descEnRef}
            defaultValue={formData.descriptionEn}
            placeholder={t('description_en_placeholder')}
          />
          <Input
            ref={descArRef}
            defaultValue={formData.descriptionAr}
            placeholder={t('description_ar_placeholder')}
            dir="rtl"
          />
        </div>
        <div className="form-actions">
          <Button type="submit" variant="primary" loading={loading}>
            {editingProgram ? (t('update')) : (t('save'))}
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
              {t('cancel')}
            </Button>
          )}
        </div>
      </form>

      <div className={styles.content} data-tour="programs-grid">
        <AdvancedDataGrid
            rows={programs}
            getRowId={(row) => row.docId || row.id}
            columns={gridColumns}
            pageSize={50}
            pageSizeOptions={[10, 25, 50, 100]}
            checkboxSelection
            exportFileName="programs"
            showExportButton
            exportLabel={t('export')}
            loadingOverlayMessage={loading ? (t('loading_programs')) : undefined}
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

export default ProgramsPage;

