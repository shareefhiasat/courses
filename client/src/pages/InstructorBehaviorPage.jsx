import React, { useEffect, useState, useCallback, useMemo } from 'react';
import logger from '@utils/logger';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import { Button, Select, Loading, Textarea, useToast, AdvancedDataGrid, StudentSelect, Card, CardBody, Input } from '@ui';
import { getPrograms, getSubjects } from '@firebaseServices/programService';
import { getClasses } from '@firebaseServices/classService';
import { getEnrollments } from '@firebaseServices/enrollmentService';
import { addNotification } from '@firebaseServices/notificationService';
import { logActivity, ACTIVITY_TYPES } from '@firebaseServices/activityLogger';
import { getBehaviors, createBehavior, updateBehavior, deleteBehavior } from '@firebaseServices/behaviorService';
import { getUserById } from '@firebaseServices/userService';
import { formatQatarDateOnly } from '@utils/timezone';
import { BEHAVIOR_TYPES, getBehaviorLabel, getBehaviorTypeById } from '@constants/behaviorTypes.jsx';
import { getUserStatus, getUserStatusSummary, USER_STATUS, getStatusIconProps } from '@utils/userStatus';
import { 
  PAGE_STATES, 
  FORM_STATES, 
  MODAL_TYPES,
  TYPE_ICONS,
  getTypeIcon,
  COMMON_GRID_COLUMNS,
  VALIDATION_RULES,
  COMMON_FILTERS,
  PAGE_LAYOUTS,
  getThemeStyles,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
} from '@constants/pageTypes';
import styles from './ProgramsManagementPage.module.css';

const InstructorBehaviorPage = ({ isDashboardTab = false, hideActions = false }) => {
  const { user, isInstructor, isAdmin, isSuperAdmin } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const toast = useToast();
  const [pageState, setPageState] = useState(PAGE_STATES.LOADING);
  const [formState, setFormState] = useState(FORM_STATES.IDLE);
  const [behaviors, setBehaviors] = useState([]);
  const [editingBehavior, setEditingBehavior] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, item: null, type: MODAL_TYPES.DELETE });
  const [classes, setClasses] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [userCache, setUserCache] = useState({}); // Cache for user data fetched on demand
  const [formData, setFormData] = useState({
    studentId: '',
    classId: '',
    subjectId: '',
    type: '',
    description: '',
    points: -1,
    comment: ''
  });
  const [saving, setSaving] = useState(false);

  // Memoized function to fetch user data on demand and cache it
  const fetchUser = useCallback(async (userId) => {
    if (!userId || userCache[userId]) {
      return userCache[userId];
    }
    
    try {
      const result = await getUserById(userId);
      if (result.success) {
        const userData = result.data;
        setUserCache(prev => ({ ...prev, [userId]: userData }));
        return userData;
      }
    } catch (err) {
      logger.error('Failed to fetch user:', userId, err);
    }
    return null;
  }, [userCache]);

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
    } catch (e) { }
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
        logger.error('Failed to load students:', err);
      }
    })();
  }, [formData.classId]);

  const loadData = async () => {
    try {
      const [classesRes, programsRes, subjectsRes, enrollmentsRes] = await Promise.all([
        getClasses(),
        getPrograms(),
        getSubjects(),
        getEnrollments()
      ]);
      if (classesRes.success) setClasses(classesRes.data || []);
      if (programsRes.success) setPrograms(programsRes.data || []);
      if (subjectsRes.success) setSubjects(subjectsRes.data || []);
      if (enrollmentsRes.success) setEnrollments(enrollmentsRes.data || []);
    } catch (error) {
      logger.error('Failed to load data:', error);
    }
  };

  const loadBehaviors = async () => {
    setLoading(true);
    try {
      const result = await getBehaviors();
      if (!result.success) {
        throw new Error(result.error);
      }
      
      let data = result.data.map(d => ({ id: d.id, docId: d.id, ...d }));
      
      // Enrich with student, class, subject info
      const enriched = await Promise.all(data.map(async (behavior, idx) => {
        // Create a new object to avoid mutation issues, ensuring id and docId are preserved
        const enrichedBehavior = { 
          ...behavior,
          id: behavior.id || behavior.docId,
          docId: behavior.docId || behavior.id
        };
        try {
          // Initialize with N/A as fallback
          enrichedBehavior.studentName = 'N/A';
          enrichedBehavior.className = 'N/A';
          enrichedBehavior.subjectName = 'N/A';
          
          if (enrichedBehavior.studentId) {
            try {
              const studentData = await fetchUser(enrichedBehavior.studentId);
              if (studentData) {
                enrichedBehavior.studentName = studentData.displayName || studentData.email || 'N/A';
                enrichedBehavior.studentEmail = studentData.email;
              }
            } catch (err) {
            }
          }
          
          if (enrichedBehavior.classId) {
            try {
              const classData = await fetchClass(enrichedBehavior.classId);
              if (classData) {
                enrichedBehavior.className = classData.name || classData.code || 'N/A';
                enrichedBehavior.classTerm = classData.term;
                // If subjectId is missing, try to get it from class
                if (!enrichedBehavior.subjectId && classData.subjectId) {
                  enrichedBehavior.subjectId = classData.subjectId;
                }
              }
            } catch (err) {
            }
          }
          
          // Load subject from behavior or class
          const subjectIdToLoad = enrichedBehavior.subjectId;
          if (subjectIdToLoad) {
            try {
              const subjectData = await fetchSubject(subjectIdToLoad);
              if (subjectData) {
                enrichedBehavior.subjectName = subjectData.name_en || subjectData.name_ar || subjectData.code || 'N/A';
              }
            } catch (err) {
            }
          }
          
          if (enrichedBehavior.createdBy) {
            try {
              const instructorData = await fetchUser(enrichedBehavior.createdBy);
              if (instructorData) {
                enrichedBehavior.instructorName = instructorData.displayName || instructorData.email;
              }
            } catch (err) {
            }
          }
        } catch (err) {
          logger.error('Failed to enrich behavior:', enrichedBehavior.id || enrichedBehavior.docId, err);
        }
        return enrichedBehavior;
      }));
      
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
      
      // Create a new array to ensure React detects the change
      setBehaviors([...filtered]);
      setPageState(PAGE_STATES.LOADED);
    } catch (error) {
      logger.error('Failed to load behaviors:', error);
      toast.error(t('failed_to_load_behaviors') + ': ' + error.message);
      setPageState(PAGE_STATES.ERROR);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation - description is required for behaviors
    if (!formData.studentId || !formData.classId || !formData.type || !formData.description.trim()) {
      toast.error(t('fill_required_fields_behavior'));
      return;
    }

    setSaving(true);
    try {
      const classData = await fetchClass(formData.classId);
      const subjectId = formData.subjectId || classData?.subjectId;
      
      const behaviorData = {
        studentId: formData.studentId,
        classId: formData.classId,
        subjectId: subjectId,
        type: formData.type,
        description: formData.description.trim(),
        points: parseInt(formData.points) || 0,
        comment: formData.comment.trim(),
        createdBy: user.uid,
        performedBy: user.uid,
        performedByName: user.displayName || user.email,
        performedByEmail: user.email
      };

      if (editingBehavior) {
        const result = await updateBehavior(editingBehavior.id, {
          ...behaviorData,
          updatedBy: user.uid
        });
        
        if (!result.success) {
          throw new Error(result.error);
        }
        
        // Log activity
        try {
          await logActivity(ACTIVITY_TYPES.BEHAVIOR_UPDATED, {
            behaviorId: editingBehavior.id,
            studentId: formData.studentId,
            classId: formData.classId,
            subjectId: subjectId,
            type: formData.type
          });
        } catch (e) { }
        toast.success(t('behavior_updated'));
      } else {
        const studentData = await fetchUser(formData.studentId);
        const result = await createBehavior({
          ...behaviorData,
          studentInfo: studentData ? {
            displayName: studentData.displayName || studentData.email,
            email: studentData.email
          } : null,
          className: classData?.name || classData?.code || 'Class',
          sendNotification: true
        });
        
        if (!result.success) {
          throw new Error(result.error);
        }
        
        // Log activity
        try {
          await logActivity(ACTIVITY_TYPES.BEHAVIOR_CREATED, {
            behaviorId: result.id,
            studentId: formData.studentId,
            classId: formData.classId,
            subjectId: subjectId,
            type: formData.type
          });
        } catch (e) { }
        toast.success(t('behavior_recorded'));
      }

      setEditingBehavior(null);
      resetForm();
      loadBehaviors();
    } catch (error) {
      logger.error('Failed to save behavior:', error);
      toast.error(t('failed_to_save_behavior') + ': ' + error.message);
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
      description: behavior.description || '',
      points: behavior.points || -1,
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
      const result = await deleteBehavior(deleteModal.item.id);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      // Log activity
      try {
        await logActivity(ACTIVITY_TYPES.BEHAVIOR_DELETED, {
          behaviorId: deleteModal.item.id,
          studentId: deleteModal.item.studentId,
          classId: deleteModal.item.classId,
          subjectId: deleteModal.item.subjectId,
          type: deleteModal.item.type
        });
      } catch (e) { }
      toast.success(t('behavior_deleted'));
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
      description: '',
      points: -1,
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
      headerName: 'User',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => {
        const row = params?.row || {};
        const rowId = row.id || row.docId || params?.id;
        
                
        // Get studentName and studentEmail from row first
        let studentName = row.studentName || params?.value;
        let studentEmail = row.studentEmail;
        let studentId = row.studentId;
        
        // If studentName is email or missing, try to get realName from user data
        if (!studentName || studentName === 'N/A' || studentName.includes('@')) {
          // Try to find user data to get realName/displayName
          const user = students.find(u => u.email === studentEmail || (u.docId || u.id) === studentId);
          if (user?.realName) {
            studentName = user.realName;
                      } else if (user?.displayName) {
            studentName = user.displayName;
                      } else if (studentId && userCache[studentId]) {
            // Try cached user data
            const cachedUser = userCache[studentId];
            if (cachedUser?.realName) {
              studentName = cachedUser.realName;
                          } else if (cachedUser?.displayName) {
              studentName = cachedUser.displayName;
                          }
          } else if (studentId) {
            // Fetch user data asynchronously (non-blocking)
            fetchUser(studentId);
                      }
        }
        
        // If not available, try to get from behaviors state
        if (!studentName && rowId) {
          const foundRow = behaviors.find(b => (b.id || b.docId) === rowId);
          studentName = foundRow?.studentName;
          studentEmail = foundRow?.studentEmail;
          studentId = foundRow?.studentId;
          ('Behavior User Debug - Found from behaviors state:', { studentName, studentEmail, studentId });
          
          // Try to get realName from user data
          if (!studentName || studentName === 'N/A' || studentName.includes('@')) {
            const user = students.find(u => u.email === studentEmail || (u.docId || u.id) === studentId);
            if (user?.realName) {
              studentName = user.realName;
              ('Behavior User Debug - Found realName from students array (fallback):', user.realName);
            } else if (user?.displayName) {
              studentName = user.displayName;
              ('Behavior User Debug - Found displayName from students array (fallback):', user.displayName);
            } else if (studentId && userCache[studentId]) {
              // Try cached user data
              const cachedUser = userCache[studentId];
              if (cachedUser?.realName) {
                studentName = cachedUser.realName;
                ('Behavior User Debug - Found realName from cache (fallback):', cachedUser.realName);
              } else if (cachedUser?.displayName) {
                studentName = cachedUser.displayName;
                ('Behavior User Debug - Found displayName from cache (fallback):', cachedUser.displayName);
              }
            } else if (studentId) {
              // Fetch user data asynchronously (non-blocking)
              fetchUser(studentId);
              ('Behavior User Debug - Triggered async fetch for studentId (fallback):', studentId);
            }
          }
        }
        
        const displayName = studentName && studentName !== 'N/A' ? studentName : (studentEmail || 'N/A');
        
        ('Behavior User Debug - Final displayName:', displayName);
        ('Behavior User Debug - Final studentEmail:', studentEmail);
        ('=== BEHAVIOR USER DEBUG END ===');
        
        // Format as "Name (email)" like enrollments, but only if we have both and they're different
        if (studentEmail && studentEmail !== displayName && !displayName.includes('@')) {
          return `${displayName} (${studentEmail})`;
        }
        
        return displayName;
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
        const behaviorType = getBehaviorTypeById(params.value);
        return behaviorType ? (lang === 'ar' ? behaviorType.label_ar : behaviorType.label_en) : params.value;
      }
    },
    {
      field: 'points',
      headerName: 'Points',
      width: 100,
      valueGetter: (params) => {
        ('InstructorBehaviorPage: Full params object:', params);
        ('InstructorBehaviorPage: Using params.value directly:', params.value, 'type:', typeof params.value);
        return Number(params.value) || 0;
      },
      renderCell: (params) => {
        // Get the value from the row data directly to ensure we have the correct points value
        const value = params.row.points || params.value || 0;
        return (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px',
            fontWeight: 'bold',
            color: value > 0 ? '#22c55e' : value < 0 ? '#ef4444' : '#6b7280'
          }}>
            {value > 0 && '+'}{value}
            {value > 0 && <TrendingUp size={14} color="#22c55e" />}
            {value < 0 && <TrendingDown size={14} color="#ef4444" />}
          </div>
        );
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
        // Debug logging for date investigation
        ('=== BEHAVIOR DATE DEBUG ===');
        ('Behavior Date Debug - params:', params);
        ('Behavior Date Debug - params.value:', params.value);
        ('Behavior Date Debug - params.row:', params.row);
        
        // Check if params directly contains the timestamp
        if (params && typeof params === 'object' && params.seconds) {
          const date = new Date(params.seconds * 1000);
          ('Behavior Date Debug - Using params.seconds:', params.seconds, '-> date:', date);
          ('Behavior Date Debug - Formatted date:', formatQatarDateOnly(date));
          ('=== BEHAVIOR DATE DEBUG END ===');
          return formatQatarDateOnly(date);
        }
        
        // Check if params.value directly contains the timestamp
        if (params.value && typeof params.value === 'object' && params.value.seconds) {
          const date = new Date(params.value.seconds * 1000);
          ('Behavior Date Debug - Using params.value.seconds:', params.value.seconds, '-> date:', date);
          ('Behavior Date Debug - Formatted date:', formatQatarDateOnly(date));
          ('=== BEHAVIOR DATE DEBUG END ===');
          return formatQatarDateOnly(date);
        }
        
        // Fallback to original logic
        if (!params.row.createdAt) {
          ('Behavior Date Debug - No createdAt found, returning "No Date"');
          ('=== BEHAVIOR DATE DEBUG END ===');
          return 'No Date';
        }
        // Handle Firebase Timestamp properly
        let date;
        if (params.row.createdAt?.toDate) {
          date = params.row.createdAt.toDate();
        } else if (params.row.createdAt?.seconds) {
          date = new Date(params.row.createdAt.seconds * 1000);
        } else {
          date = new Date(params.row.createdAt);
        }
        if (isNaN(date.getTime())) {
          ('Behavior Date Debug - Invalid date, returning "Invalid Date"');
          ('=== BEHAVIOR DATE DEBUG END ===');
          return 'Invalid Date';
        }
        const formattedDate = formatQatarDateOnly(date);
        ('Behavior Date Debug - Formatted date (fallback):', formattedDate);
        ('=== BEHAVIOR DATE DEBUG END ===');
        return formattedDate;
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
            icon={<User size={16} />}
            onClick={() => window.open(`/student-profile/${params.row.studentId}`, '_blank')}
            style={{ color: 'var(--attendance-accent, #800020)' }}
          >
            Profile
          </Button>
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
          <Edit size={16} /> Editing Behavior: {getBehaviorLabel(editingBehavior.type, lang) || editingBehavior.type}
        </div>
      )}

      {!isDashboardTab && (
        <form onSubmit={handleSubmit} className="dashboard-form">
        <div className="form-row">
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
            placeholder={t('select_class')}
            required
          />
          <Select
            searchable
            value={formData.studentId}
            onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
            options={[
              { value: '', label: t('select_student') || 'Select Student' },
              ...students
                .map(u => {
                  // Get user enrollments count
                  const userEnrollments = enrollments.filter(e => e.userId === (u.docId || u.id));
                  const enrollmentCount = userEnrollments.length;
                  
                  // Get status utilities
                  const status = getUserStatus(u, userEnrollments);
                  const statusSummary = getUserStatusSummary(u, userEnrollments);
                  const iconProps = getStatusIconProps(status);
                  const IconComponent = () => {
                    switch (iconProps.name) {
                      case 'UserCheck': return getThemedIcon('user_status', 'active', 24, theme);
                      case 'UserX': return getThemedIcon('user_status', 'inactive', 24, theme);
                      case 'UserMinus': return getThemedIcon('user_status', 'suspended', 24, theme);
                      case 'AlertCircle': return getThemedIcon('ui', 'alert_triangle', 24, theme);
                      default: return getThemedIcon('ui', 'info', 24, theme);
                    }
                  };
                  
                  const isDisabled = status === USER_STATUS.DELETED;
                  const statusLabel = statusSummary?.label || status;
                  
                  return {
                    value: u.docId || u.id,
                    displayLabel: u.displayName || u.realName || u.email || 'Unknown',
                    label: (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: 8,
                        opacity: isDisabled ? 0.7 : 1
                      }}>
                        <IconComponent />
                        <span style={{ 
                          textDecoration: isDisabled ? 'line-through' : 'none',
                          flex: 1
                        }}>
                          {u.displayName || u.realName || u.email || 'Unknown'}
                        </span>
                        <span style={{ 
                          fontSize: '0.8em',
                          color: '#9CA3AF',
                          marginLeft: 'auto'
                        }}>
                          {statusLabel}
                          {enrollmentCount > 0 && ` • ${enrollmentCount} ${t('enrollments') || 'enrollments'}`}
                        </span>
                      </div>
                    ),
                    disabled: isDisabled
                  };
                })
            ]}
            placeholder={t('select_student')}
            required
            disabled={!formData.classId}
          />
          <Select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            options={[
              { value: '', label: 'Select Type' },
              ...BEHAVIOR_TYPES.map(bt => {
                let icon;
                switch (bt.icon) {
                  case 'MessageSquare':
                    icon = getThemedIcon('ui', 'message_square', 16, theme);
                    break;
                  case 'Bed':
                    icon = getThemedIcon('ui', 'bed', 16, theme);
                    break;
                  case 'Users':
                    icon = getThemedIcon('ui', 'users', 16, theme);
                    break;
                  case 'Smartphone':
                    icon = getThemedIcon('ui', 'smartphone', 16, theme);
                    break;
                  case 'AlertTriangle':
                    icon = getThemedIcon('ui', 'alert_triangle', 16, theme);
                    break;
                  case 'Clock':
                    icon = getThemedIcon('ui', 'clock', 16, theme);
                    break;
                  case 'XCircle':
                    icon = getThemedIcon('ui', 'x_circle', 16, theme);
                    break;
                  case 'HelpCircle':
                    icon = getThemedIcon('ui', 'help_circle', 16, theme);
                    break;
                  default:
                    icon = getThemedIcon('ui', 'alert_triangle', 16, theme);
                }
                return { value: bt.id, label: getBehaviorLabel(bt.id, lang), icon };
              })
            ]}
            placeholder={t('select_behavior_type')}
            required
          />
        </div>
        <div className="form-row">
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder={t('description_required_behavior')}
            rows={3}
            required
          />
          <Textarea
            value={formData.comment}
            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
            placeholder="Comment (optional)"
            rows={3}
          />
        </div>
        <div className="form-row">
          <Select
            value={formData.points}
            onChange={(e) => setFormData({ ...formData, points: e.target.value })}
            options={Array.from({ length: 21 }, (_, i) => ({
              value: i - 10,
              label: `${i - 10 > 0 ? '+' : ''}${i - 10}`
            }))}
            placeholder="Points"
            searchable={false}
          />
        </div>
        <div className="form-actions">
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
              ...BEHAVIOR_TYPES.map(bt => {
                let icon;
                switch (bt.icon) {
                  case 'MessageSquare':
                    icon = getThemedIcon('ui', 'message_square', 16, theme);
                    break;
                  case 'Bed':
                    icon = getThemedIcon('ui', 'bed', 16, theme);
                    break;
                  case 'Users':
                    icon = getThemedIcon('ui', 'users', 16, theme);
                    break;
                  case 'Smartphone':
                    icon = getThemedIcon('ui', 'smartphone', 16, theme);
                    break;
                  case 'AlertTriangle':
                    icon = getThemedIcon('ui', 'alert_triangle', 16, theme);
                    break;
                  case 'Clock':
                    icon = getThemedIcon('ui', 'clock', 16, theme);
                    break;
                  case 'XCircle':
                    icon = getThemedIcon('ui', 'x_circle', 16, theme);
                    break;
                  case 'HelpCircle':
                    icon = getThemedIcon('ui', 'help_circle', 16, theme);
                    break;
                  default:
                    icon = getThemedIcon('ui', 'alert_triangle', 16, theme);
                }
                return { value: bt.id, label: getBehaviorLabel(bt.id, lang), icon };
              })
            ]}
            placeholder="Type"
          />
        </div>
      </div>

      {/* Summary Chips */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          padding: '0.5rem 0.75rem', 
          background: '#fef2f2', 
          border: '1px solid #fecaca', 
          borderRadius: '9999px',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: '#991b1b'
        }}>
          <Target size={16} color="#991b1b" />
          {behaviors.length} Total
        </div>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          padding: '0.5rem 0.75rem', 
          background: '#fef2f2', 
          border: '1px solid #fecaca', 
          borderRadius: '9999px',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: '#991b1b'
        }}>
          <Users size={16} color="#991b1b" />
          {new Set(behaviors.map(b => b.studentId)).size} Students
        </div>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          padding: '0.5rem 0.75rem', 
          background: '#f0fdf4', 
          border: '1px solid #bbf7d0', 
          borderRadius: '9999px',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: '#166534'
        }}>
          <TrendingUp size={16} color="#166534" />
          {behaviors.filter(b => (b.points || 0) > 0).reduce((sum, b) => sum + (b.points || 0), 0)} Positive
        </div>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          padding: '0.5rem 0.75rem', 
          background: '#fef2f2', 
          border: '1px solid #fecaca', 
          borderRadius: '9999px',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: '#991b1b'
        }}>
          <TrendingDown size={16} color="#991b1b" />
          {behaviors.filter(b => (b.points || 0) < 0).reduce((sum, b) => sum + (b.points || 0), 0)} Negative
        </div>
      </div>

      <div className={styles.content}>
        <AdvancedDataGrid
          rows={behaviors}
          getRowId={(row) => row.docId || row.id}
          columns={columns}
          pageSize={10}
          pageSizeOptions={[10, 25, 50, 100]}
          checkboxSelection
          exportFileName="behaviors"
          showExportButton
          exportLabel="Export"
          loadingOverlayMessage={loading ? "Loading behaviors..." : undefined}
          fancyVariant="dots"
        />
      </div>

      {deleteModal.open && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <Card style={{ maxWidth: '400px', margin: '1rem' }}>
            <CardBody>
              <h3>Delete Behavior</h3>
              <p>Are you sure you want to delete this behavior record?</p>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <Button variant="outline" onClick={() => setDeleteModal({ open: false, item: null })}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={confirmDelete} style={{ backgroundColor: '#dc2626' }}>
                  Delete
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
};

export default InstructorBehaviorPage;
