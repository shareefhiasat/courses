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

const PARTICIPATION_TYPES = [
  { id: 'explain_lesson', label_ar: 'شرح الدرس', label_en: 'Explained Lesson' },
  { id: 'gave_project', label_ar: 'قدم مشروع', label_en: 'Gave Project' },
  { id: 'gave_paper', label_ar: 'قدم ورقة', label_en: 'Gave Paper' },
  { id: 'gave_research', label_ar: 'قدم بحث', label_en: 'Gave Research' },
  { id: 'active_discussion', label_ar: 'نقاش نشط', label_en: 'Active Discussion' },
  { id: 'answered_question', label_ar: 'أجاب على سؤال', label_en: 'Answered Question' },
  { id: 'helped_classmate', label_ar: 'ساعد زميل', label_en: 'Helped Classmate' },
  { id: 'other', label_ar: 'أخرى', label_en: 'Other' }
];

const InstructorParticipationPage = ({ isDashboardTab = false, hideActions = false }) => {
  const { user, isInstructor, isAdmin, isSuperAdmin } = useAuth();
  const { t, lang } = useLang();
  const toast = useToast();
  const [participations, setParticipations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingParticipation, setEditingParticipation] = useState(null);
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
  }, [isInstructor, isAdmin, isSuperAdmin]);

  useEffect(() => {
    loadParticipations();
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

  const loadParticipations = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'participations'), orderBy('createdAt', 'desc')));
      let data = snap.docs.map(d => ({ id: d.id, docId: d.id, ...d.data() }));
      
      // Enrich with student, class, subject info
      console.log('🔍 Starting enrichment for', data.length, 'participations');
      const enriched = await Promise.all(data.map(async (participation, idx) => {
        // Create a new object to avoid mutation issues, ensuring id and docId are preserved
        const enrichedParticipation = { 
          ...participation,
          id: participation.id || participation.docId,
          docId: participation.docId || participation.id
        };
        console.log(`🔍 [${idx}] Enriching participation:`, enrichedParticipation.id || enrichedParticipation.docId, {
          studentId: enrichedParticipation.studentId,
          classId: enrichedParticipation.classId,
          subjectId: enrichedParticipation.subjectId
        });
        
        try {
          // Initialize with N/A as fallback
          enrichedParticipation.studentName = 'N/A';
          enrichedParticipation.className = 'N/A';
          enrichedParticipation.subjectName = 'N/A';
          
          if (enrichedParticipation.studentId) {
            try {
              console.log(`🔍 [${idx}] Loading student:`, enrichedParticipation.studentId);
              const studentDoc = await getDoc(doc(db, 'users', enrichedParticipation.studentId));
              if (studentDoc.exists()) {
                const studentData = studentDoc.data();
                enrichedParticipation.studentName = studentData.displayName || studentData.email || 'N/A';
                enrichedParticipation.studentEmail = studentData.email;
                console.log('✅ Participation - Loaded student:', enrichedParticipation.studentId, '→', enrichedParticipation.studentName);
                console.log(`✅ [${idx}] Final studentName:`, enrichedParticipation.studentName);
              } else {
                console.warn('⚠️ Participation - Student not found:', enrichedParticipation.studentId);
              }
            } catch (err) {
              console.error('❌ Failed to load student:', enrichedParticipation.studentId, err);
            }
          } else {
            console.warn('⚠️ Participation - No studentId:', enrichedParticipation.id || enrichedParticipation.docId);
          }
          
          if (enrichedParticipation.classId) {
            try {
              console.log(`🔍 [${idx}] Loading class:`, enrichedParticipation.classId);
              const classDoc = await getDoc(doc(db, 'classes', enrichedParticipation.classId));
              if (classDoc.exists()) {
                const classData = classDoc.data();
                enrichedParticipation.className = classData.name || classData.code || 'N/A';
                enrichedParticipation.classTerm = classData.term;
                // If subjectId is missing, try to get it from class
                if (!enrichedParticipation.subjectId && classData.subjectId) {
                  enrichedParticipation.subjectId = classData.subjectId;
                  console.log(`🔍 [${idx}] Got subjectId from class:`, classData.subjectId);
                }
                console.log('✅ Participation - Loaded class:', enrichedParticipation.classId, '→', enrichedParticipation.className);
                console.log(`✅ [${idx}] Final className:`, enrichedParticipation.className);
              } else {
                console.warn('⚠️ Participation - Class not found:', enrichedParticipation.classId);
              }
            } catch (err) {
              console.error('❌ Failed to load class:', enrichedParticipation.classId, err);
            }
          } else {
            console.warn('⚠️ Participation - No classId:', enrichedParticipation.id || enrichedParticipation.docId);
          }
          
          // Load subject from participation or class
          const subjectIdToLoad = enrichedParticipation.subjectId;
          if (subjectIdToLoad) {
            try {
              console.log(`🔍 [${idx}] Loading subject:`, subjectIdToLoad);
              const subjectDoc = await getDoc(doc(db, 'subjects', subjectIdToLoad));
              if (subjectDoc.exists()) {
                const subjectData = subjectDoc.data();
                enrichedParticipation.subjectName = subjectData.name_en || subjectData.name_ar || subjectData.code || 'N/A';
                console.log('✅ Participation - Loaded subject:', subjectIdToLoad, '→', enrichedParticipation.subjectName);
                console.log(`✅ [${idx}] Final subjectName:`, enrichedParticipation.subjectName);
              } else {
                console.warn('⚠️ Participation - Subject not found:', subjectIdToLoad);
              }
            } catch (err) {
              console.error('❌ Failed to load subject:', subjectIdToLoad, err);
            }
          } else {
            console.warn('⚠️ Participation - No subjectId:', enrichedParticipation.id || enrichedParticipation.docId);
          }
          
          console.log(`✅ [${idx}] Final enriched participation:`, {
            id: enrichedParticipation.id || enrichedParticipation.docId,
            studentName: enrichedParticipation.studentName,
            className: enrichedParticipation.className,
            subjectName: enrichedParticipation.subjectName
          });
        } catch (err) {
          console.error('❌ Failed to enrich participation:', enrichedParticipation.id || enrichedParticipation.docId, err);
        }
        
        try {
          if (enrichedParticipation.createdBy) {
            try {
              const instructorDoc = await getDoc(doc(db, 'users', enrichedParticipation.createdBy));
              if (instructorDoc.exists()) {
                const instructorData = instructorDoc.data();
                enrichedParticipation.instructorName = instructorData.displayName || instructorData.email;
              }
            } catch (err) {
              console.warn('Failed to load instructor:', err);
            }
          }
        } catch (err) {
          console.error('❌ Failed to enrich participation:', enrichedParticipation.id || enrichedParticipation.docId, err);
        }
        return enrichedParticipation;
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
      
      console.log('✅ Setting participations state with', filtered.length, 'items');
      console.log('✅ Sample participation data:', filtered[0] ? {
        id: filtered[0].id,
        studentName: filtered[0].studentName,
        className: filtered[0].className,
        subjectName: filtered[0].subjectName,
        fullRow: filtered[0]
      } : 'No data');
      // Create a new array to ensure React detects the change
      setParticipations([...filtered]);
    } catch (error) {
      console.error('Failed to load participations:', error);
      toast.error('Failed to load participations: ' + error.message);
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
      const classDoc = await getDoc(doc(db, 'classes', formData.classId));
      const classData = classDoc.exists() ? classDoc.data() : {};
      const subjectId = formData.subjectId || classData.subjectId;
      
      const participationData = {
        studentId: formData.studentId,
        classId: formData.classId,
        subjectId: subjectId,
        type: formData.type,
        comment: formData.comment.trim(),
        points: 1,
        createdBy: user.uid,
        ...(editingParticipation ? {
          updatedAt: Timestamp.now(),
          updatedBy: user.uid
        } : {
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
      };

      if (editingParticipation) {
        await updateDoc(doc(db, 'participations', editingParticipation.id), participationData);
        // Log activity
        try {
          await logActivity(ACTIVITY_TYPES.PARTICIPATION_UPDATED, {
            participationId: editingParticipation.id,
            studentId: formData.studentId,
            classId: formData.classId,
            subjectId: subjectId,
            type: formData.type
          });
        } catch (e) { console.warn('Failed to log activity:', e); }
        toast.success('Participation updated successfully');
      } else {
        const docRef = await addDoc(collection(db, 'participations'), participationData);
        
        // Log activity
        try {
          await logActivity(ACTIVITY_TYPES.PARTICIPATION_CREATED, {
            participationId: docRef.id,
            studentId: formData.studentId,
            classId: formData.classId,
            subjectId: subjectId,
            type: formData.type
          });
        } catch (e) { console.warn('Failed to log activity:', e); }
        
        // Send notification to student (with error handling)
        try {
          const participationType = PARTICIPATION_TYPES.find(pt => pt.id === formData.type) || { label_en: formData.type };
          await addNotification({
            userId: formData.studentId,
            title: '✅ Participation Recorded',
            message: `You received +1 participation point: ${participationType.label_en}${formData.comment ? ` - ${formData.comment}` : ''}`,
            type: 'participation',
            metadata: {
              participationId: docRef.id,
              type: formData.type,
              classId: formData.classId,
              subjectId: subjectId
            },
            data: { participationId: docRef.id, classId: formData.classId, subjectId: subjectId }
          });
        } catch (notifError) {
          // Notification is optional - log but don't fail the operation
          console.warn('Failed to send notification (non-critical):', notifError);
        }
        toast.success('Participation created successfully');
      }

      setEditingParticipation(null);
      resetForm();
      loadParticipations();
    } catch (error) {
      console.error('Failed to save participation:', error);
      toast.error('Failed to save participation: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (participation) => {
    setEditingParticipation(participation);
    setFormData({
      studentId: participation.studentId || '',
      classId: participation.classId || '',
      subjectId: participation.subjectId || '',
      type: participation.type || '',
      comment: participation.comment || ''
    });
  };

  const handleDelete = async (participation) => {
    setDeleteModal({ open: true, item: participation });
  };

  const confirmDelete = async () => {
    if (!deleteModal.item) return;
    
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'participations', deleteModal.item.id));
      // Log activity
      try {
        await logActivity(ACTIVITY_TYPES.PARTICIPATION_DELETED, {
          participationId: deleteModal.item.id,
          studentId: deleteModal.item.studentId,
          classId: deleteModal.item.classId,
          subjectId: deleteModal.item.subjectId,
          type: deleteModal.item.type
        });
      } catch (e) { console.warn('Failed to log activity:', e); }
      toast.success('Participation deleted successfully');
      loadParticipations();
    } catch (error) {
      toast.error('Failed to delete participation: ' + error.message);
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
        // Try to get from row first, then from params.value, then from participations state
        let studentName = row.studentName || params?.value;
        if (!studentName && rowId) {
          const foundRow = participations.find(p => (p.id || p.docId) === rowId);
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
        // Try to get from row first, then from params.value, then from participations state
        let className = row.className || params?.value;
        if (!className && rowId) {
          const foundRow = participations.find(p => (p.id || p.docId) === rowId);
          className = foundRow?.className;
        }
        if (className && className !== 'N/A') {
          let text = className;
          const classTerm = row.classTerm || (rowId ? participations.find(p => (p.id || p.docId) === rowId)?.classTerm : null);
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
        // Try to get from row first, then from params.value, then from participations state
        let subjectName = row.subjectName || params?.value;
        if (!subjectName && rowId) {
          const foundRow = participations.find(p => (p.id || p.docId) === rowId);
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
        const participationType = PARTICIPATION_TYPES.find(pt => pt.id === params.value);
        return participationType ? (lang === 'ar' ? participationType.label_ar : participationType.label_en) : params.value;
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
      {!isDashboardTab && editingParticipation && (
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
          <Edit size={16} /> Editing Participation: {PARTICIPATION_TYPES.find(pt => pt.id === editingParticipation.type)?.label_en || editingParticipation.type}
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
              ...PARTICIPATION_TYPES.map(pt => ({ value: pt.id, label: lang === 'ar' ? pt.label_ar : pt.label_en }))
            ]}
            placeholder="Participation Type *"
            required
          />
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <Textarea
            value={formData.comment}
            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
            placeholder="Comment (optional)"
            rows={3}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Button type="submit" variant="primary" loading={saving}>
            {editingParticipation ? 'Update' : 'Save'}
          </Button>
          {editingParticipation && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setEditingParticipation(null);
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
              ...PARTICIPATION_TYPES.map(pt => ({ value: pt.id, label: lang === 'ar' ? pt.label_ar : pt.label_en }))
            ]}
            placeholder="Type"
          />
        </div>
      </div>

      <div className={styles.content}>
        {loading ? (
          <Loading message="Loading participations..." fancyVariant="dots" />
        ) : (
          <AdvancedDataGrid
            rows={participations}
            getRowId={(row) => row.docId || row.id}
            columns={columns}
            pageSize={10}
            pageSizeOptions={[10, 25, 50, 100]}
            checkboxSelection
            disableRowSelectionOnClick
            exportFileName="participations"
            showExportButton
            exportLabel="Export"
          />
        )}
      </div>

      <DeleteConfirmationModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, item: null })}
        onConfirm={confirmDelete}
        title="Delete Participation"
        message="Are you sure you want to delete this participation record?"
      />
    </div>
  );
};

export default InstructorParticipationPage;
