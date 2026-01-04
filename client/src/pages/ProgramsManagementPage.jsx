import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { Navigate } from 'react-router-dom';
import { getPrograms, createProgram, updateProgram, deleteProgram } from '../firebase/programs';
import { Loading, Button, Input, Textarea, NumberInput, useToast, AdvancedDataGrid } from '../components/ui';
import { Edit, Trash } from 'lucide-react';
import { logActivity, ACTIVITY_TYPES } from '../firebase/activityLogger';
import styles from './ProgramsManagementPage.module.css';

const ProgramsManagementPage = () => {
  const { isAdmin, isSuperAdmin, loading: authLoading } = useAuth();
  const toast = useToast();
  
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProgram, setEditingProgram] = useState(null);
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

  useEffect(() => {
    if (!authLoading && (isAdmin || isSuperAdmin)) {
      loadPrograms();
    }
  }, [authLoading, isAdmin, isSuperAdmin]);

  const loadPrograms = async () => {
    setLoading(true);
    try {
      const result = await getPrograms();
      if (result.success) {
        setPrograms(result.data || []);
      } else {
        toast.error(result.error || 'Failed to load programs');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name_en || !formData.name_ar || !formData.code) {
      toast.error('Please fill in all required fields');
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
        } catch (e) { console.warn('Failed to log activity:', e); }
        toast.success(editingProgram ? 'Program updated successfully' : 'Program created successfully');
        setEditingProgram(null);
        resetForm();
        loadPrograms();
      } else {
        toast.error(result.error || 'Operation failed');
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

  const handleDelete = async (program) => {
    if (!globalThis.confirm(`Are you sure you want to delete program "${program.name_en}"?`)) {
      return;
    }

    setLoading(true);
    try {
      const result = await deleteProgram(program.docId);
      if (result.success) {
        // Log activity
        try {
          await logActivity(ACTIVITY_TYPES.PROGRAM_DELETED, {
            programId: program.docId,
            programName: program.name_en,
            programCode: program.code
          });
        } catch (e) { console.warn('Failed to log activity:', e); }
        toast.success('Program deleted successfully');
        loadPrograms();
      } else {
        toast.error(result.error || 'Failed to delete program');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
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
    return <Loading variant="overlay" message="Loading..." fancyVariant="dots" />;
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
          <Edit size={16} /> Editing Program: {editingProgram.name_en} ({editingProgram.code || 'No code'})
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <Input
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="Program Code * (e.g., CS-DIP)"
            required
          />
          <Input
            value={formData.name_en}
            onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
            placeholder="Program Name (English) * (e.g., Computer Science Diploma)"
            required
          />
          <Input
            value={formData.name_ar}
            onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
            placeholder="Program Name (Arabic) * (e.g., دبلوم علوم الحاسوب)"
            required
            dir="rtl"
          />
          <NumberInput
            value={formData.duration_years}
            onChange={(e) => setFormData({ ...formData, duration_years: Number.parseInt(e.target.value) || 2 })}
            placeholder="Duration (Years)"
            min={1}
            max={10}
          />
          <NumberInput
            value={formData.minGPA}
            onChange={(e) => setFormData({ ...formData, minGPA: Number.parseFloat(e.target.value) || 1.5 })}
            placeholder="Minimum GPA"
            min={0}
            max={4}
            step={0.1}
          />
          <NumberInput
            value={formData.totalCreditHours}
            onChange={(e) => setFormData({ ...formData, totalCreditHours: Number.parseInt(e.target.value) || 70 })}
            placeholder="Total Credit Hours"
            min={1}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <Textarea
            value={formData.description_en}
            onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
            placeholder="Description (English)"
            rows={2}
          />
          <Textarea
            value={formData.description_ar}
            onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
            placeholder="Description (Arabic) - وصف البرنامج بالعربية"
            rows={2}
            dir="rtl"
          />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Button type="submit" variant="primary" loading={loading}>
            {editingProgram ? 'Update' : 'Add Program'}
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
              Cancel Edit
            </Button>
          )}
        </div>
      </form>

      <div className={styles.content}>
        {loading ? (
          <Loading message="Loading programs..." fancyVariant="dots" />
        ) : (
          <AdvancedDataGrid
            rows={programs}
            getRowId={(row) => row.docId || row.id}
            columns={[
              { 
                field: 'code', 
                headerName: 'Code', 
                width: 120,
                valueGetter: (params) => {
                  const row = params?.row || {};
                  const code = row.code || params?.value;
                  return code || '—';
                }
              },
              { field: 'name_en', headerName: 'Name (EN)', flex: 1, minWidth: 180 },
              { field: 'name_ar', headerName: 'Name (AR)', flex: 1, minWidth: 180 },
              {
                field: 'duration_years',
                headerName: 'Duration (Years)',
                width: 140,
                valueGetter: (params) => `${params.value || 2} years`
              },
              {
                field: 'minGPA',
                headerName: 'Min GPA',
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
              { field: 'totalCreditHours', headerName: 'Credit Hours', width: 120 },
              {
                field: 'actions',
                headerName: 'Actions',
                width: 200,
                sortable: false,
                filterable: false,
                renderCell: (params) => (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Edit size={16} />}
                      onClick={() => handleEdit(params.row)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Trash size={16} />}
                      onClick={() => handleDelete(params.row)}
                      style={{ color: '#dc2626' }}
                    >
                      Delete
                    </Button>
                  </div>
                )
              }
            ]}
            pageSize={10}
            pageSizeOptions={[10, 25, 50, 100]}
            checkboxSelection
            exportFileName="programs"
          />
        )}
      </div>

    </div>
  );
};

export default ProgramsManagementPage;

