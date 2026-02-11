import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import logger from '@utils/logger';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { Button, Select, Loading, Input, Textarea, useToast, AdvancedDataGrid, StudentSelectOption, StudentSelect, Card, CardBody, ProgramsSelect, NumberInput } from '@ui';
import DeleteModal, { useDeleteModal } from '@ui/DeleteModal/DeleteModal';
import { createPenalty, updatePenalty, deletePenalty, getPenalties } from '@firebaseServices/penaltyService';
import { PENALTY_TYPES, PENALTY_TYPE_ICONS } from '@constants/penaltyTypes';
import { ABSENCE_TYPES } from '@constants/absenceTypes';
import { RECORD_TYPES } from '@utils/sharedTypes';
import { getPrograms, getSubjects, getSubject } from '@firebaseServices/programService';
import { getClasses, getClassById } from '@firebaseServices/classService';
import { getEnrollments, getEnrollmentsByClass, getStudentsByClass } from '@firebaseServices/enrollmentService';
import { addNotification } from '@firebaseServices/notificationService';
import { getUserById } from '@firebaseServices/userService';
import { logActivity, ACTIVITY_LOG_TYPES } from '@firebaseServices/activityLogger';
import { formatQatarDateOnly } from '@utils/timezone';
import { getUserStatus, getUserStatusSummary, USER_STATUS, getStatusIconProps } from '@utils/userStatus';
import { 
  PAGE_STATES, 
  FORM_STATES,
  COMMON_GRID_COLUMNS
} from '@constants/pageTypes';
import { getThemedIcon } from '@constants/iconTypes';
import styles from './ProgramsManagementPage.module.css';

const PenaltiesPage = ({ isDashboardTab = false, hideActions = false }) => {
  const { user, isHR, isAdmin, isSuperAdmin } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const toast = useToast();
  const [pageState, setPageState] = useState(PAGE_STATES.LOADING);
  const [formState, setFormState] = useState(FORM_STATES.IDLE);
  const [loading, setLoading] = useState(false);
  const [penalties, setPenalties] = useState([]);
  const [editingPenalty, setEditingPenalty] = useState(null);
  const { deleteModal, deleteItem, handleDeleteConfirm, hideDeleteModal } = useDeleteModal(t);
  const [classes, setClasses] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [userCache, setUserCache] = useState({}); // Cache for user data fetched on demand
  const [formData, setFormData] = useState({
    programId: '',
    studentId: '',
    classId: '',
    subjectId: '',
    type: '',
    description: '',
    feedback: '',
    points: -1,
    comment: ''
  });
  const [saving, setSaving] = useState(false);

  // Handler functions - same pattern as ActivitiesPage
  const handleDropdownChange = useCallback((setter, field, resetFields = []) => {
    return (value) => {
      setter(prev => {
        const newState = { ...prev, [field]: value };
        resetFields.forEach(resetField => {
          newState[resetField] = '';
        });
        return newState;
      });
    };
  }, []);

  // Refs for text inputs to prevent re-renders
  const descriptionRef = useRef(null);
  const feedbackRef = useRef(null);
  const commentRef = useRef(null);

  // Sync refs when editing
  useEffect(() => {
    if (descriptionRef.current) descriptionRef.current.value = formData.description || '';
    if (feedbackRef.current) feedbackRef.current.value = formData.feedback || '';
    if (commentRef.current) commentRef.current.value = formData.comment || '';
  }, [editingPenalty, formData.description, formData.feedback, formData.comment]);

  // Read text values from refs into form state before submit
  const syncRefsToState = useCallback(() => {
    return {
      description: descriptionRef.current?.value ?? formData.description,
      feedback: feedbackRef.current?.value ?? formData.feedback,
      comment: commentRef.current?.value ?? formData.comment
    };
  }, [formData.description, formData.feedback, formData.comment]);

  // Function to fetch user data on demand and cache it
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

  // Function to fetch class data on demand and cache it
  const fetchClass = useCallback(async (classId) => {
    if (!classId) return null;
    
    try {
      const result = await getClassById(classId);
      if (result.success) {
        return result.data;
      }
    } catch (err) {
      logger.error('Failed to fetch class:', classId, err);
    }
    return null;
  }, []);

  // Function to fetch subject data on demand and cache it
  const fetchSubject = useCallback(async (subjectId) => {
    if (!subjectId) return null;
    
    try {
      const result = await getSubject(subjectId);
      if (result.success) {
        return result.data;
      }
    } catch (err) {
      logger.error('Failed to fetch subject:', subjectId, err);
    }
    return null;
  }, []);

  // Filters
  const [programFilter, setProgramFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    if (!isHR && !isAdmin && !isSuperAdmin) return;
    loadData();
    // Log page view
    try {
      logger.debug('🔍 PENALTY VIEWING LOG - About to log activity:', {
        timestamp: new Date(),
        timestampUTC: new Date().toISOString(),
        userTime: new Date().toLocaleString(),
        qatarTime: new Date().toLocaleString('en-US', { timeZone: 'Asia/Qatar' }),
        userId: user?.uid,
        userEmail: user?.email,
        activityType: ACTIVITY_LOG_TYPES.PENALTY_VIEWED
      });
      
            
      logger.debug('✅ PENALTY VIEWING LOG - Activity logged successfully');
    } catch (e) {
      logger.error('❌ PENALTY VIEWING LOG - Error logging activity:', e);
    }
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
        const result = await getStudentsByClass(formData.classId);
        if (result.success) {
          setStudents(result.data);
        } else {
          logger.error('Failed to load students:', result.error);
          setStudents([]);
        }
      } catch (error) {
        logger.error('Failed to load students:', error);
        setStudents([]);
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
      const enriched = await Promise.all(data.map(async (penalty, idx) => {
        // Create a new object to avoid mutation issues, ensuring id and docId are preserved
        const enrichedPenalty = { 
          ...penalty,
          id: penalty.id || penalty.docId,
          docId: penalty.docId || penalty.id
        };
        try {
          // Initialize with N/A as fallback
          enrichedPenalty.studentName = 'N/A';
          enrichedPenalty.className = 'N/A';
          enrichedPenalty.subjectName = 'N/A';
          
          if (enrichedPenalty.studentId) {
            try {
              const studentData = await fetchUser(enrichedPenalty.studentId);
              if (studentData) {
                enrichedPenalty.studentName = studentData.displayName || studentData.email || 'N/A';
                enrichedPenalty.studentEmail = studentData.email;
              }
            } catch (err) {
            }
          }
          
          if (enrichedPenalty.classId) {
            try {
              const classData = await fetchClass(enrichedPenalty.classId);
              if (classData) {
                enrichedPenalty.className = classData.name || classData.code || 'N/A';
                enrichedPenalty.classTerm = classData.term;
                // If subjectId is missing, try to get it from class
                if (!enrichedPenalty.subjectId && classData.subjectId) {
                  enrichedPenalty.subjectId = classData.subjectId;
                }
              }
            } catch (err) {
            }
          }
          
          // Load subject from penalty or class
          const subjectIdToLoad = enrichedPenalty.subjectId;
          if (subjectIdToLoad) {
            try {
              const subjectData = await fetchSubject(subjectIdToLoad);
              if (subjectData) {
                enrichedPenalty.subjectName = subjectData.name_en || subjectData.name_ar || subjectData.code || 'N/A';
              }
            } catch (err) {
            }
          }
          
          } catch (err) {
          logger.error('Failed to enrich penalty:', enrichedPenalty.id || enrichedPenalty.docId, err);
        }
        return enrichedPenalty;
      }));
      

      // Apply filters
      let filtered = enriched;
      if (programFilter) {
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
      if (subjectFilter) {
        filtered = filtered.filter(p => {
          if (p.subjectId) return p.subjectId === subjectFilter;
          if (p.classId) {
            const classItem = classes.find(c => (c.id || c.docId) === p.classId);
            return classItem?.subjectId === subjectFilter;
          }
          return false;
        });
      }
      if (classFilter) {
        filtered = filtered.filter(p => p.classId === classFilter);
      }
      if (typeFilter !== 'all') {
        filtered = filtered.filter(p => p.type === typeFilter);
      }

      // Create a new array to ensure React detects the change
      setPenalties([...filtered]);
    } catch (error) {
      logger.error('Failed to load penalties:', error);
      toast.error(t('failed_to_save_penalty') + ': ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    // Read text fields from refs (uncontrolled inputs)
    const textValues = syncRefsToState();
    
    // Validation
    if (!formData.studentId || !formData.classId || !formData.type || !textValues.description.trim()) {
      toast.error(t('fill_required_fields_penalty') || 'Please fill in all required fields (Student, Class, Type, Description)');
      return;
    }

    setSaving(true);
    try {
      // Get class to find subjectId
      const classData = await fetchClass(formData.classId);
      const subjectId = formData.subjectId || classData?.subjectId;
      
      const penaltyData = {
        studentId: formData.studentId,
        classId: formData.classId,
        subjectId: subjectId,
        type: formData.type,
        description: textValues.description.trim(),
        feedback: textValues.feedback.trim(),
        points: parseInt(formData.points) || 0,
        comment: textValues.comment.trim(),
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
          points: penaltyData.points,
          comment: penaltyData.comment
        });
              } else {
        result = await createPenalty(penaltyData);
              }

      if (result.success) {
        toast.success(editingPenalty ? t('penalty_updated') : t('penalty_recorded'));
        setEditingPenalty(null);
        resetForm();
        loadPenalties();
      } else {
        toast.error(result.error || 'Operation failed');
      }
    } catch (error) {
      toast.error(t('failed_to_save_penalty') + ': ' + error.message);
    } finally {
      setSaving(false);
    }
  }, [formData, editingPenalty, descriptionRef, feedbackRef, commentRef, t, toast, loadPenalties]);

  const handleEdit = useCallback((penalty) => {
    setEditingPenalty(penalty);
    setFormData({
      programId: penalty.programId || '',
      studentId: penalty.studentId || '',
      classId: penalty.classId || '',
      subjectId: penalty.subjectId || '',
      type: penalty.type || '',
      description: penalty.description || '',
      feedback: penalty.feedback || '',
      points: penalty.points || -1,
      comment: penalty.comment || ''
    });
  }, []);

  const handleDelete = useCallback((penalty) => {
    deleteItem(penalty, async () => {
      setPenalties(prev => prev.filter(p => p.docId !== penalty.docId));
      try {
        const result = await deletePenalty(penalty.docId || penalty.id);
        if (result.success) {
          toast?.showSuccess(t('penalty_deleted'));
                    
          // Send withdrawal notification
          try {
            await addNotification({
              userId: penalty.studentId,
              type: RECORD_TYPES.PENALTY,
              title: 'Penalty Withdrawn',
              message: `Your penalty for "${PENALTY_TYPES.find(pt => pt.id === penalty.type)?.label_en || penalty.type}" has been withdrawn.`,
              data: { penaltyId: penalty.id, action: 'withdrawn' }
            });
          } catch (notifError) {
          }
          await loadPenalties();
        } else {
          setPenalties(prev => [...prev, penalty]);
          toast?.showError(result.error || t('failed_to_delete_penalty'));
        }
      } catch (error) {
        setPenalties(prev => [...prev, penalty]);
        logger.error('Delete failed:', error);
        toast?.showError(error.message);
      }
    });
  }, [deleteItem, toast, t, loadPenalties]);

  const resetForm = () => {
    setFormData({
      programId: '',
      studentId: '',
      classId: '',
      subjectId: '',
      type: '',
      description: '',
      feedback: '',
      points: -1,
      comment: ''
    });
    setEditingPenalty(null);
  };

  if (!isHR && !isAdmin && !isSuperAdmin) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>{t('access_denied') || 'Access Denied'}</div>;
  }

  const filteredClasses = classes.filter(c => {
    if (subjectFilter && c.subjectId !== subjectFilter) return false;
    if (programFilter) {
      const subject = subjects.find(s => (s.docId || s.id) === c.subjectId);
      if (subject?.programId !== programFilter) return false;
    }
    return true;
  });

  // Filter penalties based on selected filters
  const filteredPenalties = penalties.filter(penalty => {
    if (programFilter) {
      const subject = subjects.find(s => (s.docId || s.id) === penalty.subjectId);
      if (!subject || subject.programId !== programFilter) return false;
    }
    if (subjectFilter && penalty.subjectId !== subjectFilter) return false;
    if (classFilter && penalty.classId !== classFilter) return false;
    if (typeFilter !== 'all' && penalty.type !== typeFilter) return false;
    return true;
  });

  const columns = useMemo(() => [
    {
      field: 'studentName',
      headerName: t('user') || 'User',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => {
        const row = params?.row || {};
        const rowId = row.id || row.docId || params?.id;
        
        // Debug logging for user investigation
        logger.debug('=== HR PENALTIES USER DEBUG ===');
        logger.debug('HR Penalties User Debug - Row data:', row);
        logger.debug('HR Penalties User Debug - studentName from row:', row.studentName);
        logger.debug('HR Penalties User Debug - studentEmail from row:', row.studentEmail);
        logger.debug('HR Penalties User Debug - studentId from row:', row.studentId);
        
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
            logger.debug('HR Penalties User Debug - Found realName from students array:', user.realName);
          } else if (user?.displayName) {
            studentName = user.displayName;
            logger.debug('HR Penalties User Debug - Found displayName from students array:', user.displayName);
          } else if (studentId && userCache[studentId]) {
            // Try cached user data
            const cachedUser = userCache[studentId];
            if (cachedUser?.realName) {
              studentName = cachedUser.realName;
              logger.debug('HR Penalties User Debug - Found realName from cache:', cachedUser.realName);
            } else if (cachedUser?.displayName) {
              studentName = cachedUser.displayName;
              logger.debug('HR Penalties User Debug - Found displayName from cache:', cachedUser.displayName);
            }
          } else if (studentId) {
            // Fetch user data asynchronously (non-blocking)
            fetchUser(studentId);
            logger.debug('HR Penalties User Debug - Triggered async fetch for studentId:', studentId);
          }
        }
        
        // If not available, try to get from penalties state
        if (!studentName && rowId) {
          const foundRow = penalties.find(p => (p.id || p.docId) === rowId);
          studentName = foundRow?.studentName;
          studentEmail = foundRow?.studentEmail;
          studentId = foundRow?.studentId;
          logger.debug('HR Penalties User Debug - Found from penalties state:', { studentName, studentEmail, studentId });
          
          // Try to get realName from user data
          if (!studentName || studentName === 'N/A' || studentName.includes('@')) {
            const user = students.find(u => u.email === studentEmail || (u.docId || u.id) === studentId);
            if (user?.realName) {
              studentName = user.realName;
              logger.debug('HR Penalties User Debug - Found realName from students array (fallback):', user.realName);
            } else if (user?.displayName) {
              studentName = user.displayName;
              logger.debug('HR Penalties User Debug - Found displayName from students array (fallback):', user.displayName);
            } else if (studentId && userCache[studentId]) {
              // Try cached user data
              const cachedUser = userCache[studentId];
              if (cachedUser?.realName) {
                studentName = cachedUser.realName;
                logger.debug('HR Penalties User Debug - Found realName from cache (fallback):', cachedUser.realName);
              } else if (cachedUser?.displayName) {
                studentName = cachedUser.displayName;
                logger.debug('HR Penalties User Debug - Found displayName from cache (fallback):', cachedUser.displayName);
              }
            } else if (studentId) {
              // Fetch user data asynchronously (non-blocking)
              fetchUser(studentId);
              logger.debug('HR Penalties User Debug - Triggered async fetch for studentId (fallback):', studentId);
            }
          }
        }
        
        const displayName = studentName && studentName !== 'N/A' ? studentName : (studentEmail || 'N/A');
        
        logger.debug('HR Penalties User Debug - Final displayName:', displayName);
        logger.debug('HR Penalties User Debug - Final studentEmail:', studentEmail);
        logger.debug('=== HR PENALTIES USER DEBUG END ===');
        
        // Format as "Name (email)" like enrollments, but only if we have both and they're different
        if (studentEmail && studentEmail !== displayName && !displayName.includes('@')) {
          return `${displayName} (${studentEmail})`;
        }
        
        return displayName;
      }
    },
    {
      field: 'className',
      headerName: t('class') || 'Class',
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
          const classTerm = row.classTerm;
          if (classTerm) text += ` (${classTerm})`;
          return text;
        }
        return 'N/A';
      }
    },
    {
      field: 'subjectName',
      headerName: t('subject') || 'Subject',
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
      headerName: t('type') || 'Type',
      width: 180,
      renderCell: (params) => {
        const penaltyType = PENALTY_TYPES.find(pt => pt.id === params.value);
        return penaltyType ? (lang === 'ar' ? penaltyType.label_ar : penaltyType.label_en) : params.value;
      }
    },
    {
      field: 'points',
      headerName: t('points') || 'Points',
      width: 100,
      valueGetter: (params) => {
        return Number(params.value) || 0;
      },
      renderCell: (params) => {
        const value = Number(params.value) || 0;
        return (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px',
            fontWeight: 'bold',
            color: value > 0 ? '#22c55e' : value < 0 ? '#ef4444' : '#6b7280'
          }}>
            {value > 0 ? `+${value}` : value}
            {value > 0 && getThemedIcon('ui', 'trending_up', 14, theme)}
            {value < 0 && getThemedIcon('ui', 'trending_down', 14, theme)}
          </div>
        );
      }
    },
    {
      field: 'comment',
      headerName: t('comment') || 'Comment',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => params.value || '—'
    },
    {
      field: 'createdAt',
      headerName: t('date') || 'Date',
      width: 150,
      valueGetter: (params) => {
        // Debug logging for date investigation
        logger.debug('=== HR PENALTIES DATE DEBUG ===');
        logger.debug('HR Penalties Date Debug - params:', params);
        logger.debug('HR Penalties Date Debug - params.value:', params.value);
        logger.debug('HR Penalties Date Debug - params.row:', params.row);
        
        // Check if params directly contains the timestamp
        if (params && typeof params === 'object' && params.seconds) {
          const date = new Date(params.seconds * 1000);
          logger.debug('HR Penalties Date Debug - Using params.seconds:', params.seconds, '-> date:', date);
          logger.debug('HR Penalties Date Debug - Formatted date:', formatQatarDateOnly(date));
          logger.debug('=== HR PENALTIES DATE DEBUG END ===');
          return formatQatarDateOnly(date);
        }
        
        // Check if params.value directly contains the timestamp
        if (params.value && typeof params.value === 'object' && params.value.seconds) {
          const date = new Date(params.value.seconds * 1000);
          logger.debug('HR Penalties Date Debug - Using params.value.seconds:', params.value.seconds, '-> date:', date);
          logger.debug('HR Penalties Date Debug - Formatted date:', formatQatarDateOnly(date));
          logger.debug('=== HR PENALTIES DATE DEBUG END ===');
          return formatQatarDateOnly(date);
        }
        
        // Fallback to original logic
        if (!params.row.createdAt) {
          logger.debug('HR Penalties Date Debug - No createdAt found, returning "No Date"');
          logger.debug('=== HR PENALTIES DATE DEBUG END ===');
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
          logger.debug('HR Penalties Date Debug - Invalid date, returning "Invalid Date"');
          logger.debug('=== HR PENALTIES DATE DEBUG END ===');
          return 'Invalid Date';
        }
        const formattedDate = formatQatarDateOnly(date);
        logger.debug('HR Penalties Date Debug - Formatted date (fallback):', formattedDate);
        logger.debug('=== HR PENALTIES DATE DEBUG END ===');
        return formattedDate;
      }
    },
    ...(hideActions ? [] : [{
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
            icon={getThemedIcon('ui', 'user', 16, theme)}
            onClick={() => window.open(`/student-profile/${params.row.studentId}`, '_blank')}
            style={{ color: 'var(--attendance-accent, #800020)' }}
          >
            {t('profile') || 'Profile'}
          </Button>
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
    }])
  ], [theme, lang, t, handleEdit, handleDelete, hideActions]);

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
          {getThemedIcon('ui', 'edit', 16, theme)} {t('editing_penalty', { penaltyType: PENALTY_TYPES.find(pt => pt.id === editingPenalty.type)?.label_en || editingPenalty.type }) || `Editing Penalty: ${PENALTY_TYPES.find(pt => pt.id === editingPenalty.type)?.label_en || editingPenalty.type}`}
        </div>
      )}

      {!isDashboardTab && (
      <form onSubmit={handleSubmit} className="dashboard-form">
        {/* First Row: Programs, Subjects, Classes */}
        <div className="form-row">
          <ProgramsSelect
            programs={programs}
            subjects={subjects}
            classes={classes}
            selectedProgram={formData.programId}
            selectedSubject={formData.subjectId}
            selectedClass={formData.classId}
            onProgramChange={handleDropdownChange(setFormData, 'programId', ['subjectId', 'classId', 'studentId'])}
            onSubjectChange={handleDropdownChange(setFormData, 'subjectId', ['classId', 'studentId'])}
            onClassChange={(classId) => {
              setFormData(prev => {
                const newState = { ...prev, classId, studentId: '' };
                // Find the subject for this class and update program if needed
                const selectedClass = classes.find(c => (c.id || c.docId) === classId);
                if (selectedClass?.subjectId) {
                  const selectedSubject = subjects.find(s => (s.docId || s.id) === selectedClass.subjectId);
                  const programId = selectedSubject?.programId;
                  newState.subjectId = selectedClass.subjectId;
                  newState.programId = programId || prev.programId;
                }
                return newState;
              });
            }}
            showLabels={false}
            className="flex-1"
          />
        </div>

        {/* Second Row: Student, Type, and other fields */}
        <div className="form-row">
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
                      case 'UserX': return getThemedIcon('user_status', 'deleted', 24, theme);
                      case 'UserMinus': return getThemedIcon('user_status', 'archived', 24, theme);
                      case 'AlertCircle': return getThemedIcon('ui', 'alert_triangle', 24, theme);
                      default: return getThemedIcon('ui', 'info', 24, theme);
                    }
                  };
                  
                  const isDisabled = status === USER_STATUS.DELETED;
                  const statusLabel = statusSummary?.label || status;
                  
                  return {
                    value: u.docId || u.id,
                    displayLabel: u.displayName || u.realName || u.email || (t('unknown') || 'Unknown'),
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
                          {u.displayName || u.realName || u.email || (t('unknown') || 'Unknown')}
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
        </div>

        {/* Third Row: Type */}
        <div className="form-row">
          <Select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            options={[
              { value: '', label: t('select_type') || 'Select Type' },
              ...PENALTY_TYPES.map(pt => ({ value: pt.id, label: lang === 'ar' ? pt.label_ar : pt.label_en, icon: PENALTY_TYPE_ICONS[pt.id] }))
            ]}
            placeholder={t('select_penalty_type')}
            required
          />
        </div>
        {/* First Row: Programs, Subjects, Classes */}
        <div className="form-row">
          <textarea
            ref={descriptionRef}
            defaultValue={formData.description}
            placeholder={t('description_required_penalty')}
            className="dashboard-textarea"
            rows={3}
            required
          />
          <textarea
            ref={commentRef}
            defaultValue={formData.comment}
            placeholder={t('comment_optional') || 'Comment (optional)'}
            className="dashboard-textarea"
            rows={3}
          />
        </div>
        {/* First Row: Programs, Subjects, Classes */}
        <div className="form-row">
          <textarea
            ref={feedbackRef}
            defaultValue={formData.feedback}
            placeholder={t('hr_feedback_optional')}
            className="dashboard-textarea"
            rows={3}
          />
          <NumberInput
            value={formData.points}
            onChange={(value) => setFormData({ ...formData, points: value })}
            placeholder={t('points') || 'Points'}
            min={-10}
            max={10}
            step={1}
          />
        </div>
        <div className="form-actions">
          <Button type="submit" variant="primary" loading={saving}>
            {t('save') || 'Save'}
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
              {t('cancel_edit') || 'Cancel Edit'}
            </Button>
          )}
        </div>
      </form>
      )}

      {/* Filters */}
      <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'end' }}>
          <ProgramsSelect
            programs={programs}
            subjects={subjects}
            classes={classes}
            selectedProgram={programFilter}
            selectedSubject={subjectFilter}
            selectedClass={classFilter}
            onProgramChange={setProgramFilter}
            onSubjectChange={setSubjectFilter}
            onClassChange={setClassFilter}
            showLabels={false}
            className="flex-1"
          />
          <div style={{ minWidth: '200px' }}>
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[
                { value: 'all', label: t('all_types') || 'All Types' },
                ...PENALTY_TYPES.map(pt => ({ value: pt.id, label: lang === 'ar' ? pt.label_ar : pt.label_en, icon: PENALTY_TYPE_ICONS[pt.id] }))
              ]}
              placeholder={t('type') || 'Type'}
            />
          </div>
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
          {getThemedIcon('ui', 'alert_circle', 16, theme)}
          {t('total') || 'Total'} {penalties.length}
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
          {getThemedIcon('ui', 'users', 16, theme)}
          {new Set(penalties.map(p => p.studentId)).size} {t('students') || 'Students'}
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
          {getThemedIcon('ui', 'trending_up', 16, theme)}
          {penalties.filter(p => (p.points || 0) > 0).reduce((sum, p) => sum + (p.points || 0), 0)} {t('positive') || 'Positive'}
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
          {getThemedIcon('ui', 'trending_down', 16, theme)}
          {penalties.filter(p => (p.points || 0) < 0).reduce((sum, p) => sum + (p.points || 0), 0)} {t('negative') || 'Negative'}
        </div>
      </div>

      <div className={styles.content}>
        <AdvancedDataGrid
          rows={filteredPenalties}
          columns={columns}
          pageSize={10}
          pageSizeOptions={[10, 25, 50, 100]}
          checkboxSelection
          disableRowSelectionOnClick
          exportFileName="penalties"
          showExportButton
          exportLabel={t('export') || 'Export'}
          loadingOverlayMessage={loading ? (t('loading_penalties') || "Loading penalties...") : undefined}
          fancyVariant="dots"
        />
      </div>

      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={hideDeleteModal}
        onConfirm={handleDeleteConfirm}
        entityType={deleteModal.entityType}
        entityName={deleteModal.entityName}
        loading={loading}
        t={t}
      />
    </div>
  );
};

export default PenaltiesPage;
