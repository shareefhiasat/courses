import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { Navigate } from 'react-router-dom';
import { getSubjects, createSubject, updateSubject, deleteSubject, getPrograms } from '../firebase/programs';
import { getUsers, getClasses } from '../firebase/firestore';
import { Loading, Button, Input, Select, NumberInput, useToast, AdvancedDataGrid } from '../components/ui';
import { Edit, Trash } from 'lucide-react';
import { logActivity, ACTIVITY_TYPES } from '../firebase/activityLogger';
import styles from './SubjectsManagementPage.module.css';

const SubjectsManagementPage = () => {
  const { isAdmin, isSuperAdmin, isInstructor, loading: authLoading } = useAuth();
  const { lang } = useLang();
  const toast = useToast();
  
  const [subjects, setSubjects] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSubject, setEditingSubject] = useState(null);
  const [filterProgram, setFilterProgram] = useState('all');
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

  useEffect(() => {
    if (!authLoading && (isAdmin || isSuperAdmin || isInstructor)) {
      loadData();
      logActivity(ACTIVITY_TYPES.SUBJECT_VIEWED);
    }
  }, [authLoading, isAdmin, isSuperAdmin, isInstructor]);

  const loadData = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.programId || !formData.code || !formData.name_en || !formData.name_ar) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      let result;
      if (editingSubject) {
        result = await updateSubject(editingSubject.docId, formData);
      } else {
        result = await createSubject(formData);
      }

      if (result.success) {
        // Log activity
        try {
          await logActivity(editingSubject ? ACTIVITY_TYPES.SUBJECT_UPDATED : ACTIVITY_TYPES.SUBJECT_CREATED, {
            subjectId: editingSubject?.docId || result.id,
            subjectName: formData.name_en,
            subjectCode: formData.code,
            programId: formData.programId
          });
        } catch (e) { console.warn('Failed to log activity:', e); }
        toast.success(editingSubject ? 'Subject updated successfully' : 'Subject created successfully');
        setEditingSubject(null);
        resetForm();
        loadData();
      } else {
        toast.error(result.error || 'Operation failed');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (subject) => {
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
  };

  const handleDelete = async (subject) => {
    if (!window.confirm(`Are you sure you want to delete subject "${subject.name_en}"?`)) {
      return;
    }

    setLoading(true);
    try {
      const result = await deleteSubject(subject.docId);
      if (result.success) {
        // Log activity
        try {
          await logActivity(ACTIVITY_TYPES.SUBJECT_DELETED, {
            subjectId: subject.docId,
            subjectName: subject.name_en
          });
        } catch (e) { console.warn('Failed to log activity:', e); }
        toast.success('Subject deleted successfully');
        loadData();
      } else {
        toast.error(result.error || 'Failed to delete subject');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

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
  };

  if (authLoading) {
    return <Loading variant="overlay" message="Loading..." fancyVariant="dots" />;
  }

  if (!isAdmin && !isSuperAdmin && !isInstructor) {
    return <Navigate to="/" replace />;
  }

  const filteredSubjects = filterProgram === 'all' 
    ? subjects 
    : subjects.filter(s => s.programId === filterProgram);

  const columns = [
    {
      key: 'code',
      label: 'Code',
      sortable: true
    },
    {
      key: 'name_en',
      label: 'Name (EN)',
      sortable: true
    },
    {
      key: 'name_ar',
      label: 'Name (AR)',
      sortable: true
    },
    {
      key: 'programId',
      label: 'Program',
      render: (value) => {
        const program = programs.find(p => p.docId === value);
        return program ? (lang === 'ar' ? program.name_ar : program.name_en) : 'N/A';
      }
    },
    {
      key: 'creditHours',
      label: 'Credits'
    },
    {
      key: 'totalHours',
      label: 'Hours'
    },
    {
      key: 'type',
      label: 'Type',
      render: (value) => {
        const typeMap = { lecture: 'Lecture', lab: 'Lab', mix: 'Mix' };
        return typeMap[value] || value;
      }
    },
    {
      key: 'hoursPerWeek',
      label: 'Hours/Week'
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, subject) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            variant="ghost"
            size="sm"
            icon={<Edit size={16} />}
            onClick={() => handleEdit(subject)}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<Trash size={16} />}
            onClick={() => handleDelete(subject)}
            style={{ color: '#dc2626' }}
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

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
          <Edit size={16} /> Editing Subject: {editingSubject.name_en} ({editingSubject.code || 'No code'})
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <Select
            value={formData.programId}
            onChange={(e) => setFormData({ ...formData, programId: e.target.value })}
            placeholder="Program * (Select Program)"
            options={[
              { value: '', label: 'Select Program' },
              ...programs.map(p => ({
                value: p.docId,
                label: lang === 'ar' ? p.name_ar : p.name_en
              }))
            ]}
            required
          />
          <Input
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="Subject Code * (e.g., CS101)"
            required
          />
          <Input
            value={formData.name_en}
            onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
            placeholder="Subject Name (English) * (e.g., Introduction to Programming)"
            required
          />
          <Input
            value={formData.name_ar}
            onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
            placeholder="Subject Name (Arabic) * (e.g., مقدمة في البرمجة)"
            required
            dir="rtl"
          />
          <NumberInput
            value={formData.creditHours}
            onChange={(e) => setFormData({ ...formData, creditHours: Number.parseInt(e.target.value) || 3 })}
            placeholder="Credit Hours"
            min={1}
            max={6}
          />
          <NumberInput
            value={formData.totalHours}
            onChange={(e) => setFormData({ ...formData, totalHours: Number.parseInt(e.target.value) || 36 })}
            placeholder="Total Hours"
            min={1}
            helperText="Total hours for the entire course"
          />
          <Select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            placeholder="Subject Type * (Select Type)"
            options={[
              { value: 'lecture', label: 'Lecture' },
              { value: 'lab', label: 'Lab' },
              { value: 'mix', label: 'Mix (Lecture + Lab)' }
            ]}
            required
          />
          <Select
            value={formData.requirementType}
            onChange={(e) => setFormData({ ...formData, requirementType: e.target.value })}
            placeholder="Requirement Type *"
            options={[
              { value: 'general_mandatory', label: 'General Mandatory' },
              { value: 'major_mandatory', label: 'Major Mandatory' },
              { value: 'major_optional', label: 'Major Optional' }
            ]}
            required
          />
          <NumberInput
            value={formData.hoursPerWeek}
            onChange={(e) => setFormData({ ...formData, hoursPerWeek: Number.parseFloat(e.target.value) || 3 })}
            placeholder="Hours Per Week"
            min={1}
            max={20}
            step={0.5}
            helperText="Weekly contact hours"
          />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Button type="submit" variant="primary" loading={loading}>
            {editingSubject ? 'Update' : 'Add Subject'}
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
              Cancel Edit
            </Button>
          )}
        </div>
      </form>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <Select
          value={filterProgram}
          onChange={(e) => setFilterProgram(e.target.value)}
          placeholder="Filter by Program"
          options={[
            { value: 'all', label: 'All Programs' },
            ...programs.map(p => ({
              value: p.docId,
              label: lang === 'ar' ? p.name_ar : p.name_en
            }))
          ]}
        />
      </div>

      <div className={styles.content}>
        {loading ? (
          <Loading message="Loading subjects..." fancyVariant="dots" />
        ) : (
          <AdvancedDataGrid
            rows={filteredSubjects}
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
                field: 'programId',
                headerName: 'Program',
                flex: 1,
                minWidth: 200,
                valueGetter: (params) => {
                  const row = params?.row || {};
                  const programId = row.programId || params?.value;
                  if (!programId) return 'N/A';
                  const program = programs.find(p => p.docId === programId || p.id === programId);
                  if (!program) return 'N/A';
                  return lang === 'ar' ? program.name_ar : program.name_en;
                }
              },
              { field: 'creditHours', headerName: 'Credits', width: 100 },
              { field: 'totalHours', headerName: 'Total Hours', width: 120 },
              {
                field: 'type',
                headerName: 'Type',
                width: 120,
                valueGetter: (params) => {
                  const row = params?.row || {};
                  const type = row.type || params?.value;
                  const typeMap = { lecture: 'Lecture', lab: 'Lab', mix: 'Mix' };
                  return type ? (typeMap[type] || type) : '—';
                }
              },
              { field: 'hoursPerWeek', headerName: 'Hours/Week', width: 120 },
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
            exportFileName="subjects"
          />
        )}
      </div>
    </div>
  );
};

export default SubjectsManagementPage;

