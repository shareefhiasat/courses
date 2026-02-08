import React, { useState, useEffect, useCallback, useMemo } from 'react';
import logger from '@utils/logger';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { Navigate } from 'react-router-dom';
import { getPrograms, createProgram, updateProgram, deleteProgram } from '@firebaseServices/programService';
import { Loading, Button, Input, Textarea, NumberInput, useToast, AdvancedDataGrid, Modal } from '@ui';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import { logActivity, ACTIVITY_TYPES } from '@firebaseServices/activityLogger';
import styles from './ProgramsManagementPage.module.css';

const ProgramsManagementPage = () => {
  const { isAdmin, isSuperAdmin, loading: authLoading } = useAuth();
  const { t } = useLang();
  const { theme } = useTheme();
  const toast = useToast();
  
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProgram, setEditingProgram] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [programToDelete, setProgramToDelete] = useState(null);
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

  useEffect(() => {
    if (!authLoading && (isAdmin || isSuperAdmin)) {
      loadPrograms();
    }
  }, [authLoading, isAdmin, isSuperAdmin, loadPrograms]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name_en || !formData.name_ar || !formData.code) {
      toast.error(t('please_fill_required_fields') || 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      let result;
      if (editingProgram) {
        result = await updateProgram(editingProgram.docId, formData);
      } else {
        result = await createProgram(formData);
      }

      if (result.success) {
        // Log activity
        try {
          await logActivity(editingProgram ? ACTIVITY_TYPES.PROGRAM_UPDATED : ACTIVITY_TYPES.PROGRAM_CREATED, {
            programId: editingProgram?.docId || result.id,
            programName: formData.name_en,
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
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (program) => {
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
  };

  const handleDelete = (program) => {
    setProgramToDelete(program);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!programToDelete) return;

    setLoading(true);
    try {
      const result = await deleteProgram(programToDelete.docId);
      if (result.success) {
        // Log activity
        try {
          await logActivity(ACTIVITY_TYPES.PROGRAM_DELETED, {
            programId: programToDelete.docId,
            programName: programToDelete.name_en,
            programCode: programToDelete.code
          });
        } catch (e) { logger.warn('Failed to log activity:', e); }
        toast.success(t('program_deleted_successfully') || 'Program deleted successfully');
        loadPrograms();
      } else {
        toast.error(result.error || t('failed_to_delete_program') || 'Failed to delete program');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
      setDeleteModalOpen(false);
      setProgramToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setProgramToDelete(null);
  };

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
  };


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
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder={t('program_code_placeholder') || 'Program Code * (e.g., CS-DIP)'}
            required
          />
          <Input
            value={formData.name_en}
            onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
            placeholder={t('program_name_en_placeholder') || 'Program Name (English) * (e.g., Computer Science Diploma)'}
            required
          />
          <Input
            value={formData.name_ar}
            onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
            placeholder={t('program_name_ar_placeholder') || 'Program Name (Arabic) * (e.g., دبلوم علوم الحاسوب)'}
            required
            dir="rtl"
          />
          <NumberInput
            value={formData.duration_years}
            onChange={(e) => setFormData({ ...formData, duration_years: Number.parseInt(e.target.value) || 2 })}
            placeholder={t('duration_years_placeholder') || 'Duration (Years)'}
            min={1}
            max={10}
          />
          <NumberInput
            value={formData.minGPA}
            onChange={(e) => setFormData({ ...formData, minGPA: Number.parseFloat(e.target.value) || 1.5 })}
            placeholder={t('minimum_gpa_placeholder') || 'Minimum GPA'}
            min={0}
            max={4}
            step={0.1}
          />
          <NumberInput
            value={formData.totalCreditHours}
            onChange={(e) => setFormData({ ...formData, totalCreditHours: Number.parseInt(e.target.value) || 70 })}
            placeholder={t('total_credit_hours_placeholder') || 'Total Credit Hours'}
            min={1}
          />
        </div>
        <div className="form-row">
          <Textarea
            value={formData.description_en}
            onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
            placeholder={t('description_en_placeholder') || 'Description (English)'}
            rows={2}
          />
          <Textarea
            value={formData.description_ar}
            onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
            placeholder={t('description_ar_placeholder') || 'Description (Arabic) - وصف البرنامج بالعربية'}
            rows={2}
            dir="rtl"
          />
        </div>
        <div className="form-actions">
          <Button type="submit" variant="primary" loading={loading}>
            {editingProgram ? t('update') || 'Update' : t('add_program') || 'Add Program'}
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
            columns={[
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
            ]}
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={cancelDelete}
        title={t('delete_confirmation') || 'Delete Confirmation'}
        size="medium"
      >
        <div style={{ padding: '0 20px' }}>
          <p style={{ marginBottom: '20px', lineHeight: '1.5', fontSize: '0.95rem' }}>
            {t('confirm_delete_program_message', { 
              programName: programToDelete?.name_en || 'this program' 
            }) || `Are you sure you want to delete program "${programToDelete?.name_en || 'this program'}"?`}
          </p>
          <p style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: '20px', fontWeight: 500 }}>
            {t('delete_warning') || 'This action cannot be undone.'}
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '10px' }}>
            <Button
              variant="ghost"
              onClick={cancelDelete}
              disabled={loading}
            >
              {t('cancel') || 'Cancel'}
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              disabled={loading}
              loading={loading}
            >
              {t('delete') || 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default ProgramsManagementPage;

