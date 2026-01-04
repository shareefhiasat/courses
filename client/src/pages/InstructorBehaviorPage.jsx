import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { db } from '../firebase/config';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, query, where, orderBy, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Edit, Trash } from 'lucide-react';
import { Button, Select, Loading, Textarea, useToast, AdvancedDataGrid } from '../components/ui';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import { getPrograms, getSubjects } from '../firebase/programs';
import { getClasses } from '../firebase/firestore';
import { addNotification } from '../firebase/notifications';
import { logActivity, ACTIVITY_TYPES } from '../firebase/activityLogger';
import { formatQatarDateOnly } from '../utils/timezone';
import styles from './ProgramsManagementPage.module.css';

const BEHAVIOR_TYPES = [
  { id: 'talk_in_class', label_ar: 'التحدث في الصف', label_en: 'Talk in Class' },
  { id: 'sleep', label_ar: 'النوم', label_en: 'Sleep' },
  { id: 'bathroom_requests', label_ar: 'طلبات الحمام المتكررة', label_en: 'Frequent Bathroom Requests' },
  { id: 'mobile_in_class', label_ar: 'استخدام الهاتف', label_en: 'Mobile Phone in Class' },
  { id: 'disruptive', label_ar: 'سلوك مشتت', label_en: 'Disruptive Behavior' },
  { id: 'late_arrival', label_ar: 'تأخر الوصول', label_en: 'Late Arrival' },
  { id: 'inappropriate_language', label_ar: 'لغة غير لائقة', label_en: 'Inappropriate Language' },
  { id: 'other', label_ar: 'أخرى', label_en: 'Other' }
];

const InstructorBehaviorPage = ({ isDashboardTab = false, hideActions = false }) => {
  const { user, isInstructor, isAdmin, isSuperAdmin } = useAuth();
  const { t, lang } = useLang();
  const toast = useToast();
  const [behaviors, setBehaviors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBehavior, setEditingBehavior] = useState(null);
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
    comment: ''
  });
  const [saving, setSaving] = useState(false);

  // Filters
  const [programFilter, setProgramFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    if (!isInstructor && !isAdmin && !isSuperAdmin) return;
    loadData();
    // Log page view
    try {
      logActivity(ACTIVITY_TYPES.BEHAVIOR_VIEWED, {});
    } catch (e) { console.warn('Failed to log activity:', e); }
  }, [isInstructor, isAdmin, isSuperAdmin]);

  useEffect(() => {
    loadBehaviors();
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

  const loadBehaviors = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'behaviors'), orderBy('createdAt', 'desc')));
      let data = snap.docs.map(d => ({ id: d.id, docId: d.id, ...d.data() }));
      
      // Enrich with student, class, subject info
      console.log('🔍 Starting enrichment for', data.length, 'behaviors');
      const enriched = await Promise.all(data.map(async (behavior, idx) => {
        // Create a new object to avoid mutation issues, ensuring id and docId are preserved
        const enrichedBehavior = { 
          ...behavior,
          id: behavior.id || behavior.docId,
          docId: behavior.docId || behavior.id
        };
        console.log(`🔍 [${idx}] Enriching behavior:`, enrichedBehavior.id || enrichedBehavior.docId, {
          studentId: enrichedBehavior.studentId,
          classId: enrichedBehavior.classId,
          subjectId: enrichedBehavior.subjectId
        });
        
        try {
          // Initialize with N/A as fallback
          enrichedBehavior.studentName = 'N/A';
          enrichedBehavior.className = 'N/A';
          enrichedBehavior.subjectName = 'N/A';
          
          if (enrichedBehavior.studentId) {
            try {
              console.log(`🔍 [${idx}] Loading student:`, enrichedBehavior.studentId);
              const studentDoc = await getDoc(doc(db, 'users', enrichedBehavior.studentId));
              if (studentDoc.exists()) {
                const studentData = studentDoc.data();
                enrichedBehavior.studentName = studentData.displayName || studentData.email || 'N/A';
                enrichedBehavior.studentEmail = studentData.email;
                console.log('✅ Behavior - Loaded student:', enrichedBehavior.studentId, '→', enrichedBehavior.studentName);
                console.log(`✅ [${idx}] Final studentName:`, enrichedBehavior.studentName);
              } else {
                console.warn('⚠️ Behavior - Student not found:', enrichedBehavior.studentId);
              }
            } catch (err) {
              console.warn('Failed to load student:', enrichedBehavior.studentId, err);
            }
          } else {
            console.warn('⚠️ Behavior - No studentId:', enrichedBehavior.id || enrichedBehavior.docId);
          }
          
          if (enrichedBehavior.classId) {
            try {
              console.log(`🔍 [${idx}] Loading class:`, enrichedBehavior.classId);
              const classDoc = await getDoc(doc(db, 'classes', enrichedBehavior.classId));
              if (classDoc.exists()) {
                const classData = classDoc.data();
                enrichedBehavior.className = classData.name || classData.code || 'N/A';
                enrichedBehavior.classTerm = classData.term;
                // If subjectId is missing, try to get it from class
                if (!enrichedBehavior.subjectId && classData.subjectId) {
                  enrichedBehavior.subjectId = classData.subjectId;
                  console.log(`🔍 [${idx}] Got subjectId from class:`, classData.subjectId);
                }
                console.log('✅ Behavior - Loaded class:', enrichedBehavior.classId, '→', enrichedBehavior.className);
                console.log(`✅ [${idx}] Final className:`, enrichedBehavior.className);
              } else {
                console.warn('⚠️ Behavior - Class not found:', enrichedBehavior.classId);
              }
            } catch (err) {
              console.warn('Failed to load class:', enrichedBehavior.classId, err);
            }
          } else {
            console.warn('⚠️ Behavior - No classId:', enrichedBehavior.id || enrichedBehavior.docId);
          }
          
          // Load subject from behavior or class
          const subjectIdToLoad = enrichedBehavior.subjectId;
          if (subjectIdToLoad) {
            try {
              console.log(`🔍 [${idx}] Loading subject:`, subjectIdToLoad);
              const subjectDoc = await getDoc(doc(db, 'subjects', subjectIdToLoad));
              if (subjectDoc.exists()) {
                const subjectData = subjectDoc.data();
                enrichedBehavior.subjectName = subjectData.name_en || subjectData.name_ar || subjectData.code || 'N/A';
                console.log('✅ Behavior - Loaded subject:', subjectIdToLoad, '→', enrichedBehavior.subjectName);
                console.log(`✅ [${idx}] Final subjectName:`, enrichedBehavior.subjectName);
              } else {
                console.warn('⚠️ Behavior - Subject not found:', subjectIdToLoad);
              }
            } catch (err) {
              console.warn('Failed to load subject:', subjectIdToLoad, err);
            }
          } else {
            console.warn('⚠️ Behavior - No subjectId:', enrichedBehavior.id || enrichedBehavior.docId);
          }
          
          console.log(`✅ [${idx}] Final enriched behavior:`, {
            id: enrichedBehavior.id || enrichedBehavior.docId,
            studentName: enrichedBehavior.studentName,
            className: enrichedBehavior.className,
            subjectName: enrichedBehavior.subjectName
          });
          
          if (enrichedBehavior.createdBy) {
            try {
              const instructorDoc = await getDoc(doc(db, 'users', enrichedBehavior.createdBy));
              if (instructorDoc.exists()) {
                const instructorData = instructorDoc.data();
                enrichedBehavior.instructorName = instructorData.displayName || instructorData.email;
              }
            } catch (err) {
              console.warn('Failed to load instructor:', err);
            }
          }
        } catch (err) {
          console.error('Failed to enrich behavior:', enrichedBehavior.id || enrichedBehavior.docId, err);
        }
        return enrichedBehavior;
      }));
      
      console.log('✅ Enrichment complete. Sample enriched data:', enriched.slice(0, 2));
      
      // Apply filters (same logic as participations)
      let filtered = enriched;
      if (programFilter !== 'all') {
        filtered = filtered.filter(b => {
          if (b.subjectId) {
            const subject = subjects.find(s => (s.docId || s.id) === b.subjectId);
            return subject?.programId === programFilter;
          }
          if (b.classId) {
            const classItem = classes.find(c => (c.id || c.docId) === b.classId);
            if (classItem?.subjectId) {
              const subject = subjects.find(s => (s.docId || s.id) === classItem.subjectId);
              return subject?.programId === programFilter;
            }
          }
          return false;
        });
      }
      if (subjectFilter !== 'all') {
        filtered = filtered.filter(b => {
          if (b.subjectId) return b.subjectId === subjectFilter;
          if (b.classId) {
            const classItem = classes.find(c => (c.id || c.docId) === b.classId);
            return classItem?.subjectId === subjectFilter;
          }
          return false;
        });
      }
      if (classFilter !== 'all') {
        filtered = filtered.filter(b => b.classId === classFilter);
      }
      if (typeFilter !== 'all') {
        filtered = filtered.filter(b => b.type === typeFilter);
      }
      
      console.log('✅ Setting behaviors state with', filtered.length, 'items');
      console.log('✅ Sample behavior data:', filtered[0] ? {
        id: filtered[0].id,
        studentName: filtered[0].studentName,
        className: filtered[0].className,
        subjectName: filtered[0].subjectName,
        fullRow: filtered[0]
      } : 'No data');
      // Create a new array to ensure React detects the change
      setBehaviors([...filtered]);
    } catch (error) {
      console.error('Failed to load behaviors:', error);
      toast.error('Failed to load behaviors: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation - comment is required for behaviors
    if (!formData.studentId || !formData.classId || !formData.type || !formData.comment.trim()) {
      toast.error('Please fill in all required fields (Student, Class, Type, Comment)');
      return;
    }

    setSaving(true);
    try {
      const classDoc = await getDoc(doc(db, 'classes', formData.classId));
      const classData = classDoc.exists() ? classDoc.data() : {};
      const subjectId = formData.subjectId || classData.subjectId;
      
      const behaviorData = {
        studentId: formData.studentId,
        classId: formData.classId,
        subjectId: subjectId,
        type: formData.type,
        comment: formData.comment.trim(),
        points: -1,
        createdBy: user.uid,
        ...(editingBehavior ? {
          updatedAt: Timestamp.now(),
          updatedBy: user.uid
        } : {
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
      };

      if (editingBehavior) {
        await updateDoc(doc(db, 'behaviors', editingBehavior.id), behaviorData);
        // Log activity
        try {
          await logActivity(ACTIVITY_TYPES.BEHAVIOR_UPDATED, {
            behaviorId: editingBehavior.id,
            studentId: formData.studentId,
            classId: formData.classId,
            subjectId: subjectId,
            type: formData.type
          });
        } catch (e) { console.warn('Failed to log activity:', e); }
        toast.success('Behavior updated successfully');
      } else {
        const docRef = await addDoc(collection(db, 'behaviors'), behaviorData);
        
        // Log activity
        try {
          await logActivity(ACTIVITY_TYPES.BEHAVIOR_CREATED, {
            behaviorId: docRef.id,
            studentId: formData.studentId,
            classId: formData.classId,
            subjectId: subjectId,
            type: formData.type
          });
        } catch (e) { console.warn('Failed to log activity:', e); }
        
        // Send notification to student
        const behaviorType = BEHAVIOR_TYPES.find(bt => bt.id === formData.type) || { label_en: formData.type };
        await addNotification({
          userId: formData.studentId,
          title: '⚠️ Behavior Recorded',
          message: `You received -1 behavior point: ${behaviorType.label_en} - ${formData.comment}`,
          type: 'behavior',
          metadata: {
            behaviorId: docRef.id,
            type: formData.type,
            classId: formData.classId,
            subjectId: subjectId,
            comment: formData.comment
          },
          data: { behaviorId: docRef.id, classId: formData.classId, subjectId: subjectId }
        });
        toast.success('Behavior created successfully');
      }

      setEditingBehavior(null);
      resetForm();
      loadBehaviors();
    } catch (error) {
      console.error('Failed to save behavior:', error);
      toast.error('Failed to save behavior: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (behavior) => {
    setEditingBehavior(behavior);
    setFormData({
      studentId: behavior.studentId || '',
      classId: behavior.classId || '',
      subjectId: behavior.subjectId || '',
      type: behavior.type || '',
      comment: behavior.comment || ''
    });
  };

  const handleDelete = async (behavior) => {
    setDeleteModal({ open: true, item: behavior });
  };

  const confirmDelete = async () => {
    if (!deleteModal.item) return;
    
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'behaviors', deleteModal.item.id));
      // Log activity
      try {
        await logActivity(ACTIVITY_TYPES.BEHAVIOR_DELETED, {
          behaviorId: deleteModal.item.id,
          studentId: deleteModal.item.studentId,
          classId: deleteModal.item.classId,
          subjectId: deleteModal.item.subjectId,
          type: deleteModal.item.type
        });
      } catch (e) { console.warn('Failed to log activity:', e); }
      toast.success('Behavior deleted successfully');
      loadBehaviors();
    } catch (error) {
      toast.error('Failed to delete behavior: ' + error.message);
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
      comment: ''
    });
  };

  if (!isInstructor && !isAdmin && !isSuperAdmin) {
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

  const columns = [
    {
      field: 'studentName',
      headerName: 'Student',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => {
        const row = params?.row || {};
        const rowId = row.id || row.docId || params?.id;
        // Try to get from row first, then from params.value, then from behaviors state
        let studentName = row.studentName || params?.value;
        if (!studentName && rowId) {
          const foundRow = behaviors.find(b => (b.id || b.docId) === rowId);
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
        // Try to get from row first, then from params.value, then from behaviors state
        let className = row.className || params?.value;
        if (!className && rowId) {
          const foundRow = behaviors.find(b => (b.id || b.docId) === rowId);
          className = foundRow?.className;
        }
        let text = className || 'N/A';
        const classTerm = row.classTerm || (rowId ? behaviors.find(b => (b.id || b.docId) === rowId)?.classTerm : null);
        if (classTerm) text += ` (${classTerm})`;
        return text;
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
        // Try to get from row first, then from params.value, then from behaviors state
        let subjectName = row.subjectName || params?.value;
        if (!subjectName && rowId) {
          const foundRow = behaviors.find(b => (b.id || b.docId) === rowId);
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
        const behaviorType = BEHAVIOR_TYPES.find(bt => bt.id === params.value);
        return behaviorType ? (lang === 'ar' ? behaviorType.label_ar : behaviorType.label_en) : params.value;
      }
    },
    {
      field: 'comment',
      headerName: 'Comment',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => params.value || '—'
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
      {!isDashboardTab && editingBehavior && (
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
          <Edit size={16} /> Editing Behavior: {BEHAVIOR_TYPES.find(bt => bt.id === editingBehavior.type)?.label_en || editingBehavior.type}
        </div>
      )}

      {!isDashboardTab && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <Select
            searchable
            value={formData.classId}
            onChange={(e) => {
              setFormData({ ...formData, classId: e.target.value, studentId: '', subjectId: '' });
              const selectedClass = classes.find(c => (c.id || c.docId) === e.target.value);
              if (selectedClass?.subjectId) {
                setFormData(prev => ({ ...prev, subjectId: selectedClass.subjectId }));
              }
            }}
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
              ...students.map(s => ({
                value: s.id,
                label: `${s.displayName || s.email}${s.email ? ` (${s.email})` : ''}`
              }))
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
              ...BEHAVIOR_TYPES.map(bt => ({ value: bt.id, label: lang === 'ar' ? bt.label_ar : bt.label_en }))
            ]}
            placeholder="Behavior Type *"
            required
          />
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <Textarea
            value={formData.comment}
            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
            placeholder="Comment (required) - Explain the behavior..."
            rows={3}
            required
          />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Button type="submit" variant="primary" loading={saving}>
            {editingBehavior ? 'Update' : 'Save'}
          </Button>
          {editingBehavior && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setEditingBehavior(null);
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
              ...BEHAVIOR_TYPES.map(bt => ({ value: bt.id, label: lang === 'ar' ? bt.label_ar : bt.label_en }))
            ]}
            placeholder="Type"
          />
        </div>
      </div>

      <div className={styles.content}>
        {loading ? (
          <Loading message="Loading behaviors..." fancyVariant="dots" />
        ) : (
          <AdvancedDataGrid
            rows={behaviors}
            getRowId={(row) => row.docId || row.id}
            columns={columns}
            pageSize={10}
            pageSizeOptions={[10, 25, 50, 100]}
            checkboxSelection
            exportFileName="behaviors"
          />
        )}
      </div>

      <DeleteConfirmationModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, item: null })}
        onConfirm={confirmDelete}
        title="Delete Behavior"
        message="Are you sure you want to delete this behavior record?"
      />
    </div>
  );
};

export default InstructorBehaviorPage;
