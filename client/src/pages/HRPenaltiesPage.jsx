import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { db } from '../firebase/config';
import { collection, getDocs, doc, query, where, orderBy, getDoc } from 'firebase/firestore';
import { Edit, Trash } from 'lucide-react';
import { Button, Select, Loading, Input, Textarea, useToast, AdvancedDataGrid, StudentSelectOption } from '../components/ui';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import { PENALTY_TYPES, ABSENCE_TYPES, createPenalty, updatePenalty, deletePenalty, getPenalties } from '../firebase/penalties';
import { getPrograms, getSubjects } from '../firebase/programs';
import { getClasses } from '../firebase/firestore';
import { addNotification } from '../firebase/notifications';
import { logActivity, ACTIVITY_TYPES } from '../firebase/activityLogger';
import { formatQatarDateOnly } from '../utils/timezone';
import styles from './ProgramsManagementPage.module.css';

const HRPenaltiesPage = ({ isDashboardTab = false, hideActions = false }) => {
  const { user, isHR, isAdmin, isSuperAdmin } = useAuth();
  const { t, lang } = useLang();
  const toast = useToast();
  const [penalties, setPenalties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPenalty, setEditingPenalty] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, item: null });
  const [classes, setClasses] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({
    studentId: '',
    classId: '',
    subjectId: '',
    type: '',
    severity: 'minor',
    description: '',
    feedback: ''
  });
  const [saving, setSaving] = useState(false);

  // Filters
  const [programFilter, setProgramFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    if (!isHR && !isAdmin && !isSuperAdmin) return;
    loadData();
    // Log page view
    try {
      logActivity(ACTIVITY_TYPES.PENALTY_VIEWED, {});
    } catch (e) { console.warn('Failed to log activity:', e); }
  }, [isHR, isAdmin, isSuperAdmin]);

  useEffect(() => {
    loadPenalties();
  }, [programFilter, subjectFilter, classFilter, typeFilter]);

  // Load students when class changes
  useEffect(() => {
    if (!formData.classId) {
      setStudents([]);
      return;
    }
    (async () => {
      try {
        const enrollmentsSnap = await getDocs(query(
          collection(db, 'enrollments'),
          where('classId', '==', formData.classId)
        ));
        const enrollmentIds = enrollmentsSnap.docs.map(d => d.data().userId).filter(Boolean);
        if (enrollmentIds.length === 0) {
          setStudents([]);
          return;
        }
        const studentsData = await Promise.all(
          enrollmentIds.map(async (studentId) => {
            const studentDoc = await getDoc(doc(db, 'users', studentId));
            if (studentDoc.exists()) {
              const data = studentDoc.data();
              return { id: studentId, ...data, displayName: data.displayName || data.email };
            }
            return null;
          })
        );
        setStudents(studentsData.filter(Boolean));
      } catch (err) {
        console.error('Failed to load students:', err);
      }
    })();
  }, [formData.classId]);

  const loadData = async () => {
    try {
      const [classesRes, programsRes, subjectsRes] = await Promise.all([
        getClasses(),
        getPrograms(),
        getSubjects()
      ]);
      if (classesRes.success) setClasses(classesRes.data || []);
      if (programsRes.success) setPrograms(programsRes.data || []);
      if (subjectsRes.success) setSubjects(subjectsRes.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const loadPenalties = async () => {
    setLoading(true);
    try {
      const result = await getPenalties();
      if (!result.success) {
        toast.error(result.error || 'Failed to load penalties');
        return;
      }

      let data = result.data || [];

      // Enrich with student, class, subject info
      console.log('🔍 Starting enrichment for', data.length, 'penalties');
      const enriched = await Promise.all(data.map(async (penalty, idx) => {
        // Create a new object to avoid mutation issues, ensuring id and docId are preserved
        const enrichedPenalty = { 
          ...penalty,
          id: penalty.id || penalty.docId,
          docId: penalty.docId || penalty.id
        };
        console.log(`🔍 [${idx}] Enriching penalty:`, enrichedPenalty.id || enrichedPenalty.docId, {
          studentId: enrichedPenalty.studentId,
          classId: enrichedPenalty.classId,
          subjectId: enrichedPenalty.subjectId
        });
        
        try {
          // Initialize with N/A as fallback
          enrichedPenalty.studentName = 'N/A';
          enrichedPenalty.className = 'N/A';
          enrichedPenalty.subjectName = 'N/A';
          
          if (enrichedPenalty.studentId) {
            try {
              console.log(`🔍 [${idx}] Loading student:`, enrichedPenalty.studentId);
              const studentDoc = await getDoc(doc(db, 'users', enrichedPenalty.studentId));
              if (studentDoc.exists()) {
                const studentData = studentDoc.data();
                enrichedPenalty.studentName = studentData.displayName || studentData.email || 'N/A';
                enrichedPenalty.studentEmail = studentData.email;
                console.log('✅ Penalty - Loaded student:', enrichedPenalty.studentId, '→', enrichedPenalty.studentName);
                console.log(`✅ [${idx}] Final studentName:`, enrichedPenalty.studentName);
              } else {
                console.warn('⚠️ Penalty - Student not found:', enrichedPenalty.studentId);
              }
            } catch (err) {
              console.warn('Failed to load student:', enrichedPenalty.studentId, err);
            }
          } else {
            console.warn('⚠️ Penalty - No studentId:', enrichedPenalty.id || enrichedPenalty.docId);
          }
          
          if (enrichedPenalty.classId) {
            try {
              console.log(`🔍 [${idx}] Loading class:`, enrichedPenalty.classId);
              const classDoc = await getDoc(doc(db, 'classes', enrichedPenalty.classId));
              if (classDoc.exists()) {
                const classData = classDoc.data();
                enrichedPenalty.className = classData.name || classData.code || 'N/A';
                enrichedPenalty.classTerm = classData.term;
                // If subjectId is missing, try to get it from class
                if (!enrichedPenalty.subjectId && classData.subjectId) {
                  enrichedPenalty.subjectId = classData.subjectId;
                  console.log(`🔍 [${idx}] Got subjectId from class:`, classData.subjectId);
                }
                console.log('✅ Penalty - Loaded class:', enrichedPenalty.classId, '→', enrichedPenalty.className);
                console.log(`✅ [${idx}] Final className:`, enrichedPenalty.className);
              } else {
                console.warn('⚠️ Penalty - Class not found:', enrichedPenalty.classId);
              }
            } catch (err) {
              console.warn('Failed to load class:', enrichedPenalty.classId, err);
            }
          } else {
            console.warn('⚠️ Penalty - No classId:', enrichedPenalty.id || enrichedPenalty.docId);
          }
          
          // Load subject from penalty or class
          const subjectIdToLoad = enrichedPenalty.subjectId;
          if (subjectIdToLoad) {
            try {
              console.log(`🔍 [${idx}] Loading subject:`, subjectIdToLoad);
              const subjectDoc = await getDoc(doc(db, 'subjects', subjectIdToLoad));
              if (subjectDoc.exists()) {
                const subjectData = subjectDoc.data();
                enrichedPenalty.subjectName = subjectData.name_en || subjectData.name_ar || subjectData.code || 'N/A';
                console.log('✅ Penalty - Loaded subject:', subjectIdToLoad, '→', enrichedPenalty.subjectName);
                console.log(`✅ [${idx}] Final subjectName:`, enrichedPenalty.subjectName);
              } else {
                console.warn('⚠️ Penalty - Subject not found:', subjectIdToLoad);
              }
            } catch (err) {
              console.warn('Failed to load subject:', subjectIdToLoad, err);
            }
          } else {
            console.warn('⚠️ Penalty - No subjectId:', enrichedPenalty.id || enrichedPenalty.docId);
          }
          
          console.log(`✅ [${idx}] Final enriched penalty:`, {
            id: enrichedPenalty.id || enrichedPenalty.docId,
            studentName: enrichedPenalty.studentName,
            className: enrichedPenalty.className,
            subjectName: enrichedPenalty.subjectName
          });
        } catch (err) {
          console.error('Failed to enrich penalty:', enrichedPenalty.id || enrichedPenalty.docId, err);
        }
        return enrichedPenalty;
      }));
      
      console.log('✅ Enrichment complete. Sample enriched data:', enriched.slice(0, 2));

      // Apply filters
      let filtered = enriched;
      if (programFilter !== 'all') {
        filtered = filtered.filter(p => {
          if (p.subjectId) {
            const subject = subjects.find(s => (s.docId || s.id) === p.subjectId);
            return subject?.programId === programFilter;
          }
          if (p.classId) {
            const classItem = classes.find(c => (c.id || c.docId) === p.classId);
            if (classItem?.subjectId) {
              const subject = subjects.find(s => (s.docId || s.id) === classItem.subjectId);
              return subject?.programId === programFilter;
            }
          }
          return false;
        });
      }
      if (subjectFilter !== 'all') {
        filtered = filtered.filter(p => {
          if (p.subjectId) return p.subjectId === subjectFilter;
          if (p.classId) {
            const classItem = classes.find(c => (c.id || c.docId) === p.classId);
            return classItem?.subjectId === subjectFilter;
          }
          return false;
        });
      }
      if (classFilter !== 'all') {
        filtered = filtered.filter(p => p.classId === classFilter);
      }
      if (typeFilter !== 'all') {
        filtered = filtered.filter(p => p.type === typeFilter);
      }

      console.log('✅ Setting penalties state with', filtered.length, 'items');
      console.log('✅ Sample penalty data:', filtered[0] ? {
        id: filtered[0].id,
        studentName: filtered[0].studentName,
        className: filtered[0].className,
        subjectName: filtered[0].subjectName,
        fullRow: filtered[0]
      } : 'No data');
      // Create a new array to ensure React detects the change
      setPenalties([...filtered]);
    } catch (error) {
      console.error('Failed to load penalties:', error);
      toast.error('Failed to load penalties: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.studentId || !formData.classId || !formData.type) {
      toast.error('Please fill in all required fields (Student, Class, Type)');
      return;
    }

    setSaving(true);
    try {
      // Get class to find subjectId
      const classDoc = await getDoc(doc(db, 'classes', formData.classId));
      const classData = classDoc.exists() ? classDoc.data() : {};
      const subjectId = formData.subjectId || classData.subjectId;
      
      const penaltyData = {
        studentId: formData.studentId,
        classId: formData.classId,
        subjectId: subjectId,
        type: formData.type,
        severity: formData.severity || 'minor',
        description: formData.description.trim(),
        feedback: formData.feedback.trim(),
        createdBy: user.uid,
        sendInAppNotification: true,
        sendEmailNotification: false
      };

      let result;
      if (editingPenalty) {
        result = await updatePenalty(editingPenalty.docId || editingPenalty.id, {
          studentId: penaltyData.studentId,
          classId: penaltyData.classId,
          subjectId: penaltyData.subjectId,
          type: penaltyData.type,
          description: penaltyData.description,
          feedback: penaltyData.feedback,
          severity: penaltyData.severity
        });
        // Log activity
        if (result.success) {
          try {
            await logActivity(ACTIVITY_TYPES.PENALTY_UPDATED, {
              penaltyId: editingPenalty.docId || editingPenalty.id,
              studentId: penaltyData.studentId,
              classId: penaltyData.classId,
              subjectId: penaltyData.subjectId,
              type: penaltyData.type
            });
          } catch (e) { console.warn('Failed to log activity:', e); }
        }
      } else {
        result = await createPenalty(penaltyData);
        // Log activity
        if (result.success) {
          try {
            await logActivity(ACTIVITY_TYPES.PENALTY_CREATED, {
              penaltyId: result.id,
              studentId: penaltyData.studentId,
              classId: penaltyData.classId,
              subjectId: penaltyData.subjectId,
              type: penaltyData.type
            });
          } catch (e) { console.warn('Failed to log activity:', e); }
        }
      }

      if (result.success) {
        toast.success(editingPenalty ? 'Penalty updated successfully' : 'Penalty created successfully');
        setEditingPenalty(null);
        resetForm();
        loadPenalties();
      } else {
        toast.error(result.error || 'Operation failed');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (penalty) => {
    setEditingPenalty(penalty);
    setFormData({
      studentId: penalty.studentId || '',
      classId: penalty.classId || '',
      subjectId: penalty.subjectId || '',
      type: penalty.type || '',
      severity: penalty.severity || 'minor',
      description: penalty.description || '',
      feedback: penalty.feedback || ''
    });
  };

  const handleDelete = async (penalty) => {
    setDeleteModal({ open: true, item: penalty });
  };

  const confirmDelete = async () => {
    if (!deleteModal.item) return;
    
    setLoading(true);
    try {
      const result = await deletePenalty(deleteModal.item.docId || deleteModal.item.id);
      if (result.success) {
        // Log activity
        try {
          await logActivity(ACTIVITY_TYPES.PENALTY_DELETED, {
            penaltyId: deleteModal.item.docId || deleteModal.item.id,
            studentId: deleteModal.item.studentId,
            classId: deleteModal.item.classId,
            subjectId: deleteModal.item.subjectId,
            type: deleteModal.item.type
          });
        } catch (e) { console.warn('Failed to log activity:', e); }
        
        // Send withdrawal notification
        try {
          await addNotification({
            userId: deleteModal.item.studentId,
            type: 'penalty',
            title: 'Penalty Withdrawn',
            message: `Your penalty for "${PENALTY_TYPES.find(pt => pt.id === deleteModal.item.type)?.label_en || deleteModal.item.type}" has been withdrawn.`,
            data: { penaltyId: deleteModal.item.id, action: 'withdrawn' }
          });
        } catch (notifError) {
          console.warn('Failed to send withdrawal notification:', notifError);
        }
        toast.success('Penalty deleted successfully');
        loadPenalties();
      } else {
        toast.error(result.error || 'Failed to delete penalty');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
      setDeleteModal({ open: false, item: null });
    }
  };

  const resetForm = () => {
    setFormData({
      studentId: '',
      classId: '',
      subjectId: '',
      type: '',
      severity: 'minor',
      description: '',
      feedback: ''
    });
  };

  if (!isHR && !isAdmin && !isSuperAdmin) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Access Denied</div>;
  }

  const filteredClasses = classes.filter(c => {
    if (subjectFilter !== 'all' && c.subjectId !== subjectFilter) return false;
    if (programFilter !== 'all') {
      const subject = subjects.find(s => (s.docId || s.id) === c.subjectId);
      if (subject?.programId !== programFilter) return false;
    }
    return true;
  });

  // Filter penalties based on selected filters
  const filteredPenalties = penalties.filter(penalty => {
    if (programFilter !== 'all') {
      const subject = subjects.find(s => (s.docId || s.id) === penalty.subjectId);
      if (!subject || subject.programId !== programFilter) return false;
    }
    if (subjectFilter !== 'all' && penalty.subjectId !== subjectFilter) return false;
    if (classFilter !== 'all' && penalty.classId !== classFilter) return false;
    if (typeFilter !== 'all' && penalty.type !== typeFilter) return false;
    return true;
  });

  const columns = [
    {
      field: 'studentName',
      headerName: 'Student',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => {
        const row = params?.row || {};
        const rowId = row.id || row.docId || params?.id;
        // Try to get from row first, then from params.value, then from penalties state
        let studentName = row.studentName || params?.value;
        if (!studentName && rowId) {
          const foundRow = penalties.find(p => (p.id || p.docId) === rowId);
          studentName = foundRow?.studentName;
        }
        if (studentName && studentName !== 'N/A') {
          return studentName;
        }
        if (row.studentEmail) {
          return row.studentEmail;
        }
        return 'N/A';
      }
    },
    {
      field: 'className',
      headerName: 'Class',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => {
        const row = params?.row || {};
        const rowId = row.id || row.docId || params?.id;
        // Try to get from row first, then from params.value, then from penalties state
        let className = row.className || params?.value;
        if (!className && rowId) {
          const foundRow = penalties.find(p => (p.id || p.docId) === rowId);
          className = foundRow?.className;
        }
        if (className && className !== 'N/A') {
          let text = className;
          const classTerm = row.classTerm || (rowId ? penalties.find(p => (p.id || p.docId) === rowId)?.classTerm : null);
          if (classTerm) text += ` (${classTerm})`;
          return text;
        }
        return 'N/A';
      }
    },
    {
      field: 'subjectName',
      headerName: 'Subject',
      flex: 1,
      minWidth: 120,
      valueGetter: (params) => {
        const row = params?.row || {};
        const rowId = row.id || row.docId || params?.id;
        // Try to get from row first, then from params.value, then from penalties state
        let subjectName = row.subjectName || params?.value;
        if (!subjectName && rowId) {
          const foundRow = penalties.find(p => (p.id || p.docId) === rowId);
          subjectName = foundRow?.subjectName;
        }
        if (subjectName && subjectName !== 'N/A') {
          return subjectName;
        }
        return 'N/A';
      }
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 180,
      renderCell: (params) => {
        const penaltyType = PENALTY_TYPES.find(pt => pt.id === params.value);
        return penaltyType ? (lang === 'ar' ? penaltyType.label_ar : penaltyType.label_en) : params.value;
      }
    },
    {
      field: 'severity',
      headerName: 'Severity',
      width: 100,
      renderCell: (params) => {
        const severity = params.value || 'minor';
        return severity.charAt(0).toUpperCase() + severity.slice(1);
      }
    },
    {
      field: 'createdAt',
      headerName: 'Date',
      width: 150,
      valueGetter: (params) => {
        const date = params.row.createdAt?.toDate ? params.row.createdAt.toDate() : new Date(params.row.createdAt || 0);
        return formatQatarDateOnly(date);
      }
    },
    ...(hideActions ? [] : [{
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
    }])
  ];

  return (
    <div className={styles.container}>
      {/*<div style={{ marginBottom: '12px' }}>*/}
      {/*  <h1 style={{ margin: 0, fontSize: '1.5rem' }}>HR Penalties</h1>*/}
      {/*</div>*/}

      {!isDashboardTab && editingPenalty && (
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
          <Edit size={16} /> Editing Penalty: {PENALTY_TYPES.find(pt => pt.id === editingPenalty.type)?.label_en || editingPenalty.type}
        </div>
      )}

      {!isDashboardTab && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <Select
            searchable
            value={formData.classId}
            onChange={(e) => setFormData({ ...formData, classId: e.target.value, studentId: '' })}
            options={[
              { value: '', label: 'Select Class' },
              ...filteredClasses.map(c => ({
                value: c.id || c.docId,
                label: `${c.name || c.code || c.id}${c.term ? ` (${c.term}${c.year ? ` ${c.year}` : ''}${c.semester ? ` ${c.semester}` : ''})` : ''}`
              }))
            ]}
            placeholder="Class *"
            required
          />
          <Select
            searchable
            value={formData.studentId}
            onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
            options={[
              { value: '', label: 'Select Student' },
              ...students.map(student => {
                const displayName = student.displayName || student.name || student.email || student.id;
                const status =
                  (student.status?.toLowerCase?.()) ||
                  (student.archived ? 'archived' : student.deleted ? 'deleted' : 'active');
                return {
                  value: student.id || student.docId,
                  label: (
                    <StudentSelectOption
                      name={displayName}
                      email={student.email}
                      status={status}
                      statusLabel={student.statusLabel}
                      enrollmentCount={student.enrollmentCount}
                    />
                  ),
                  displayLabel: displayName,
                  searchText: [displayName, student.email].filter(Boolean).join(' ')
                };
              })
            ]}
            placeholder="Student *"
            required
            disabled={!formData.classId}
          />
          <Select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            options={[
              { value: '', label: 'Select Type' },
              ...PENALTY_TYPES.map(pt => ({ value: pt.id, label: lang === 'ar' ? pt.label_ar : pt.label_en }))
            ]}
            placeholder="Penalty Type *"
            required
          />
          <Select
            value={formData.severity}
            onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
            options={[
              { value: 'minor', label: 'Minor' },
              { value: 'major', label: 'Major' }
            ]}
            placeholder="Severity"
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Description (optional)"
            rows={3}
          />
          <Textarea
            value={formData.feedback}
            onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
            placeholder="Feedback/Notes (optional)"
            rows={3}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Button type="submit" variant="primary" loading={saving}>
            {editingPenalty ? 'Update' : 'Save'}
          </Button>
          {editingPenalty && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setEditingPenalty(null);
                resetForm();
              }}
            >
              Cancel Edit
            </Button>
          )}
        </div>
      </form>
      )}

      {/* Filters */}
      <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
          <Select
            searchable
            value={programFilter}
            onChange={(e) => {
              setProgramFilter(e.target.value);
              setSubjectFilter('all');
              setClassFilter('all');
            }}
            options={[
              { value: 'all', label: 'All Programs' },
              ...programs.map(p => ({
                value: p.docId || p.id,
                label: p.name_en || p.name_ar || p.code || p.docId
              }))
            ]}
            placeholder="Program"
          />
          <Select
            searchable
            value={subjectFilter}
            onChange={(e) => {
              setSubjectFilter(e.target.value);
              setClassFilter('all');
            }}
            options={[
              { value: 'all', label: 'All Subjects' },
              ...subjects
                .filter(s => programFilter === 'all' || s.programId === programFilter)
                .map(s => ({
                  value: s.docId || s.id,
                  label: `${s.code || ''} - ${s.name_en || s.name_ar || s.docId}`.trim()
                }))
            ]}
            placeholder="Subject"
          />
          <Select
            searchable
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Classes' },
              ...filteredClasses.map(c => ({
                value: c.id || c.docId,
                label: `${c.name || c.code || c.id}${c.term ? ` (${c.term}${c.year ? ` ${c.year}` : ''}${c.semester ? ` ${c.semester}` : ''})` : ''}`
              }))
            ]}
            placeholder="Class"
          />
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Types' },
              ...PENALTY_TYPES.map(pt => ({ value: pt.id, label: lang === 'ar' ? pt.label_ar : pt.label_en }))
            ]}
            placeholder="Type"
          />
        </div>
      </div>

      <div className={styles.content}>
        {loading ? (
          <Loading message="Loading penalties..." fancyVariant="dots" />
        ) : (
          <AdvancedDataGrid
            rows={filteredPenalties}
            columns={columns}
            pageSize={10}
            pageSizeOptions={[10, 25, 50, 100]}
            checkboxSelection
            disableRowSelectionOnClick
            exportFileName="penalties"
            showExportButton
            exportLabel="Export"
          />
        )}
      </div>

      <DeleteConfirmationModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, item: null })}
        onConfirm={confirmDelete}
        title="Delete Penalty"
        message={`Are you sure you want to delete this penalty? A notification will be sent to the student.`}
      />
    </div>
  );
};

export default HRPenaltiesPage;
