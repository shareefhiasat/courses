import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import logger from '@utils/logger';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import { Button, Select, SimpleLoading, Textarea, useToast, AdvancedDataGrid, StudentSelect, Card, CardBody, Input, ProgramsSelect } from '@ui';
import DeleteModal, { useDeleteModal } from '@ui/DeleteModal/DeleteModal';
import { getPrograms, getSubjects, getSubject } from '@services/business/programService';
import { getClassById } from '@services/business/classService';
import { getClasses } from '@services/business/classService';
import { getEnrollments, getEnrollmentsByClass } from '@services/business/enrollmentService';
import { getAllUsers, getUserById, getUsersByIds } from '@services/business/userService';
import { loadParticipations, createParticipation, updateParticipation, deleteParticipation } from '@services/business/participationService';
import { formatQatarDateOnly } from '@utils/timezone';
import { formatQatarStandard } from '@utils/qatarDate';
import { Timestamp, serverTimestamp } from 'firebase/firestore';
import { PARTICIPATION_TYPES, getParticipationLabel, getParticipationTypeById } from '@constants/participationTypes';
import { getUserStatus, getUserStatusSummary, USER_STATUS, getStatusIconProps } from '@utils/userStatus';
import { 
  PAGE_STATES, 
  FORM_STATES,
  COMMON_GRID_COLUMNS
} from '@constants/pageTypes';

const ParticipationPage = ({ isDashboardTab = false, hideActions = false }) => {
  const { user, isInstructor, isAdmin, isSuperAdmin, isHR } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const toast = useToast();
  const [pageState, setPageState] = useState(PAGE_STATES.LOADING);
  const [formState, setFormState] = useState(FORM_STATES.IDLE);
  const [participationsRaw, setParticipationsRaw] = useState([]);
  const [editingParticipation, setEditingParticipation] = useState(null);
  const { deleteModal, deleteEntity, handleDeleteConfirm, hideDeleteModal } = useDeleteModal(t);
  const [classes, setClasses] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectStudents, setSelectStudents] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [userCache, setUserCache] = useState({}); // Cache for user data fetched on demand
  const [formData, setFormData] = useState({
    programId: '',
    studentId: '',
    classId: '',
    subjectId: '',
    type: '',
    description: '',
    points: 1,
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
  const commentRef = useRef(null);
  const pointsRef = useRef(null);

  // Sync refs when editing
  useEffect(() => {
    if (descriptionRef.current) descriptionRef.current.value = formData.description || '';
    if (commentRef.current) commentRef.current.value = formData.comment || '';
    if (pointsRef.current) pointsRef.current.value = formData.points || 1;
  }, [editingParticipation, formData.description, formData.comment, formData.points]);

  // Read text values from refs into form state before submit
  const syncRefsToState = useCallback(() => {
    return {
      description: descriptionRef.current?.value ?? formData.description,
      comment: commentRef.current?.value ?? formData.comment,
      points: parseInt(pointsRef.current?.value) || formData.points || 1
    };
  }, [formData.description, formData.comment, formData.points]);

  // Memoized function to fetch user data on demand and cache it
  const fetchUser = useCallback(async (userId) => {
    if (!userId || userCache[userId]) {
      return userCache[userId];
    }
    
    try {
      const userResult = await getUserById(userId);
      if (userResult.success) {
        const userData = userResult.data;
        setUserCache(prev => ({ ...prev, [userId]: userData }));
        return userData;
      }
    } catch (err) {
      logger.error('Failed to fetch user:', userId, err);
    }
    return null;
  }, [userCache]);

  // Filter enrollments based on user role for student dropdown
  const filteredEnrollmentsForSelect = useMemo(() => {
    if (isAdmin || isSuperAdmin || isHR) {
      return enrollments; // Admins/HR see all students
    }
    if (isInstructor) {
      // Instructors see students from their classes
      return enrollments.filter(enrollment => {
        const classItem = classes.find(c => (c.docId || c.id) === enrollment.classId);
        return classItem && (
          classItem.instructorId === user?.uid ||
          classItem.ownerEmail === user?.email ||
          classItem.instructor === user?.email
        );
      });
    }
    return []; // Other roles see no students
  }, [enrollments, classes, user?.uid, user?.email, isAdmin, isSuperAdmin, isHR, isInstructor]);

  useEffect(() => {
    const loadSelectStudents = async () => {
      if (isSuperAdmin || isAdmin || isHR) {
        const result = await getAllUsers({ studentsOnly: true });
        setSelectStudents(result.success ? result.data : []);
        return;
      }
      if (isInstructor) {
        const enrollmentUserIds = enrollments
          .map(e => e.userId || e.userDocId)
          .filter(Boolean);
        const result = await getUsersByIds(enrollmentUserIds);
        const usersMap = result.success ? result.data : {};
        setSelectStudents(Object.values(usersMap).filter(Boolean));
        return;
      }
      setSelectStudents([]);
    };
    loadSelectStudents();
  }, [enrollments, isSuperAdmin, isAdmin, isHR, isInstructor]);

  // Filters
  const [programFilter, setProgramFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [studentFilter, setStudentFilter] = useState('');

  useEffect(() => {
    if (!isInstructor && !isAdmin && !isSuperAdmin && !isHR) return;
    loadData();
  }, [isInstructor, isAdmin, isSuperAdmin, isHR]);

  useEffect(() => {
    loadParticipationsData();
  }, [classes, programs, subjects, toast, t]);

  // Load students when class changes
  useEffect(() => {
    if (!formData.classId) {
      setStudents([]);
      return;
    }
    (async () => {
      try {
        const enrollmentsResult = await getEnrollmentsByClass(formData.classId);
        const enrollmentIds = enrollmentsResult.success 
          ? enrollmentsResult.data.map(e => e.userId).filter(Boolean)
          : [];
        if (enrollmentIds.length === 0) {
          setStudents([]);
          return;
        }
        const studentsData = await Promise.all(
          enrollmentIds.map(async (studentId) => {
            const userResult = await getUserById(studentId);
            if (userResult.success && userResult.data) {
              const data = userResult.data;
              return { id: studentId, docId: studentId, ...data, displayName: data.displayName || data.email };
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

  const loadParticipationsData = () => {
    // Only run if we have the required data
    if (classes.length === 0 || programs.length === 0 || subjects.length === 0) {
      logger.log('🔍 [ParticipationPage] Skipping loadParticipationsData - missing data:', {
        hasClasses: classes.length,
        hasPrograms: programs.length,
        hasSubjects: subjects.length
      });
      return;
    }
    
    logger.log('🔍 [ParticipationPage] Loading participations with data:', {
      hasClasses: classes.length,
      hasPrograms: programs.length,
      hasSubjects: subjects.length
    });
    
    loadParticipations({
      setParticipations: setParticipationsRaw,
      setPageState,
      toast,
      t,
      classes,
      programs,
      subjects,
      filters: {},
      lang // Pass the current language
    });
  };

  const filteredParticipations = useMemo(() => {
    let filtered = [...participationsRaw];
    if (programFilter) {
      filtered = filtered.filter(p => {
        if (p.subjectId) {
          const subject = subjects.find(s => (s.docId || s.id) === p.subjectId);
          return subject?.programId === programFilter;
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
    if (studentFilter) {
      filtered = filtered.filter(p => p.studentId === studentFilter);
    }
    return filtered;
  }, [participationsRaw, programFilter, subjectFilter, classFilter, typeFilter, studentFilter, classes, subjects]);

  const gridRows = useMemo(() => {
    return filteredParticipations.map((row) => {
      const subjectFromRow = lang === 'ar'
        ? (row.subjectName_ar || row.subjectName)
        : (row.subjectName_en || row.subjectName);
      const programFromRow = lang === 'ar'
        ? (row.programName_ar || row.programName)
        : (row.programName_en || row.programName);

      let subjectDisplay = subjectFromRow;
      if (!subjectDisplay || subjectDisplay === 'N/A') {
        const subject = subjects.find(s => (s.docId || s.id) === row.subjectId);
        subjectDisplay = lang === 'ar'
          ? (subject?.name_ar || subject?.name_en || subject?.name || subject?.code || 'N/A')
          : (subject?.name_en || subject?.name_ar || subject?.name || subject?.code || 'N/A');
      }

      let programDisplay = programFromRow;
      if (!programDisplay || programDisplay === 'N/A') {
        const program = programs.find(p => (p.docId || p.id) === row.programId);
        programDisplay = lang === 'ar'
          ? (program?.name_ar || program?.name_en || program?.name || program?.code || 'N/A')
          : (program?.name_en || program?.name_ar || program?.name || program?.code || 'N/A');
      }

      return {
        ...row,
        subjectNameDisplay: subjectDisplay || 'N/A',
        programNameDisplay: programDisplay || 'N/A'
      };
    });
  }, [filteredParticipations, lang, subjects, programs]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    // Read text fields from refs (uncontrolled inputs)
    const textValues = syncRefsToState();
    
    // Validation
    if (!formData.studentId || !formData.classId || !formData.type) {
      toast.error('Please fill in all required fields (Student, Class, Type)');
      return;
    }

    setSaving(true);
    try {
      const classResult = await getClassById(formData.classId);
      const classData = classResult.success ? classResult.data : {};
      const subjectId = formData.subjectId || classData.subjectId;
      
      const participationData = {
        studentId: formData.studentId,
        classId: formData.classId,
        subjectId: subjectId,
        programId: formData.programId || (subjects.find(s => (s.docId || s.id) === subjectId)?.programId),
        type: formData.type,
        description: textValues.description.trim(),
        points: textValues.points || 0,
        comment: textValues.comment.trim(),
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
        const result = await updateParticipation(editingParticipation.id, {
          ...participationData,
          updatedBy: user.uid
        });
        if (!result.success) {
          throw new Error(result.error);
        }
        toast.success(t('participation_updated'));
      } else {
        const result = await createParticipation({
          ...participationData,
          createdBy: user.uid,
          performedBy: user.uid,
          performedByName: user.displayName || user.email,
          performedByEmail: user.email
        });
        if (!result.success) {
          throw new Error(result.error);
        }
        const docRef = { id: result.id };
        
        toast.success(t('participation_recorded'));
      }

      setEditingParticipation(null);
      resetForm();
      loadParticipationsData();
    } catch (error) {
      logger.error('Failed to save participation:', error);
      toast.error(t('failed_to_save_participation') + ': ' + error.message);
    } finally {
      setSaving(false);
    }
  });

  const handleEdit = useCallback((participation) => {
    setEditingParticipation(participation);
    setFormData({
      programId: participation.programId || '',
      studentId: participation.studentId || '',
      classId: participation.classId || '',
      subjectId: participation.subjectId || '',
      type: participation.type || '',
      description: participation.description || '',
      points: participation.points || 1,
      comment: participation.comment || ''
    });
  });

  const handleDelete = useCallback((participation) => {
    deleteEntity('participation', participation, async () => {
      setParticipationsRaw(prev => prev.filter(p => p.docId !== participation.docId));
      try {
        const result = await deleteParticipation(participation.id, participation);
        if (!result.success) {
          throw new Error(result.error);
        }
        toast?.showSuccess(t('participation_deleted'));
        await loadParticipationsData();
      } catch (error) {
        setParticipationsRaw(prev => [...prev, participation]);
        logger.error('Delete failed:', error);
        toast?.showError(error.message);
      }
    });
  }, [deleteEntity, toast, t, loadParticipationsData]);

  const resetForm = () => {
    setFormData({
      programId: '',
      studentId: '',
      classId: '',
      subjectId: '',
      type: '',
      description: '',
      points: 1,
      comment: ''
    });
    // Clear refs
    if (descriptionRef.current) descriptionRef.current.value = '';
    if (commentRef.current) commentRef.current.value = '';
    if (pointsRef.current) pointsRef.current.value = '1';
    setEditingParticipation(null);
  };

  if (!isInstructor && !isAdmin && !isSuperAdmin) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Access Denied</div>;
  }

  const filteredClasses = classes.filter(c => {
    if (subjectFilter && c.subjectId !== subjectFilter) return false;
    if (programFilter) {
      const subject = subjects.find(s => (s.docId || s.id) === c.subjectId);
      if (subject?.programId !== programFilter) return false;
    }
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
        logger.debug('=== USER DEBUG ===');
        logger.debug('User Debug - Row data:', row);
        logger.debug('User Debug - studentName from row:', row.studentName);
        logger.debug('User Debug - studentEmail from row:', row.studentEmail);
        logger.debug('User Debug - studentId from row:', row.studentId);
        
        // Get studentName and studentEmail from row first
        let studentName = row.studentName;
        let studentEmail = row.studentEmail;
        let studentId = row.studentId;
        
        // If studentName is email or missing, try to get realName from user data
        if (!studentName || studentName === 'N/A' || studentName.includes('@')) {
          // Try to find user data to get realName/displayName
          const user = students.find(u => u.email === studentEmail || (u.docId || u.id) === studentId);
          if (user?.realName) {
            studentName = user.realName;
            logger.debug('User Debug - Found realName from students array:', user.realName);
          } else if (user?.displayName) {
            studentName = user.displayName;
            logger.debug('User Debug - Found displayName from students array:', user.displayName);
          } else if (studentId && userCache[studentId]) {
            // Try cached user data
            const cachedUser = userCache[studentId];
            if (cachedUser?.realName) {
              studentName = cachedUser.realName;
              logger.debug('User Debug - Found realName from cache:', cachedUser.realName);
            } else if (cachedUser?.displayName) {
              studentName = cachedUser.displayName;
                          }
          } else if (studentId) {
            // Fetch user data asynchronously (non-blocking)
            fetchUser(studentId);
            logger.debug('User Debug - Triggered async fetch for studentId:', studentId);
          }
        }
        
        // If not available, try to get from participations state
        if (!studentName && rowId) {
          const foundRow = participationsRaw.find(p => (p.id || p.docId) === rowId);
          studentName = foundRow?.studentName;
          studentEmail = foundRow?.studentEmail;
          studentId = foundRow?.studentId;
          logger.debug('User Debug - Found from participations state:', { studentName, studentEmail, studentId });
          
          // Try to get realName from user data
          if (!studentName || studentName === 'N/A' || studentName.includes('@')) {
            const user = students.find(u => u.email === studentEmail || (u.docId || u.id) === studentId);
            if (user?.realName) {
              studentName = user.realName;
              logger.debug('User Debug - Found realName from students array (fallback):', user.realName);
            } else if (user?.displayName) {
              studentName = user.displayName;
              logger.debug('User Debug - Found displayName from students array (fallback):', user.displayName);
            } else if (studentId && userCache[studentId]) {
              // Try cached user data
              const cachedUser = userCache[studentId];
              if (cachedUser?.realName) {
                studentName = cachedUser.realName;
                logger.debug('User Debug - Found realName from cache (fallback):', cachedUser.realName);
              } else if (cachedUser?.displayName) {
                studentName = cachedUser.displayName;
                logger.debug('User Debug - Found displayName from cache (fallback):', cachedUser.displayName);
              }
            } else if (studentId) {
              // Fetch user data asynchronously (non-blocking)
              fetchUser(studentId);
              logger.debug('User Debug - Triggered async fetch for studentId (fallback):', studentId);
            }
          }
        }
        
        const displayName = studentName && studentName !== 'N/A' ? studentName : (studentEmail || 'N/A');
        
        logger.debug('User Debug - Final displayName:', displayName);
        logger.debug('User Debug - Final studentEmail:', studentEmail);
        logger.debug('=== END USER DEBUG ===');
        
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
        // Try to get from row first, then from params.value, then from participations state
        let className = row.className || params?.value;
        if (!className && rowId) {
          const foundRow = participationsRaw.find(p => (p.id || p.docId) === rowId);
          className = foundRow?.className;
        }
        if (className && className !== 'N/A') {
          let text = className;
          const classTerm = row.classTerm || (rowId ? participationsRaw.find(p => (p.id || p.docId) === rowId)?.classTerm : null);
          if (classTerm) text += ` (${classTerm})`;
          return text;
        }
        return 'N/A';
      }
    },
    {
      field: 'subjectNameDisplay',
      headerName: t('subject') || 'Subject',
      flex: 1,
      minWidth: 120
    },
    {
      field: 'programNameDisplay',
      headerName: t('program') || 'Program',
      flex: 1,
      minWidth: 150
    },
    {
      field: 'type',
      headerName: t('type') || 'Type',
      width: 180,
      renderCell: (params) => {
        const participationType = getParticipationTypeById(params.value);
        if (!participationType) return params.value || '—';
        
        // Map the icon component name to centralized icon system
        let iconName;
        switch (participationType.icon.type.name) { // Get the component name from React element
          case 'MessageSquare':
            iconName = 'message_square';
            break;
          case 'Award':
            iconName = 'award';
            break;
          case 'FileText':
            iconName = 'file_text';
            break;
          case 'HelpCircle':
            iconName = 'help_circle';
            break;
          case 'Users':
            iconName = 'users';
            break;
          case 'Star':
            iconName = 'star';
            break;
          case 'ThumbsUp':
            iconName = 'thumbs_up';
            break;
          case 'Minus':
            iconName = 'minus';
            break;
          case 'CheckCircle':
            iconName = 'check_circle';
            break;
          case 'MoreHorizontal':
            iconName = 'more_horizontal';
            break;
          default:
            iconName = 'star';
        }
        
        const icon = getThemedIcon('ui', iconName, 16, theme);
        const label = lang === 'ar' ? participationType.label_ar : participationType.label_en;
        
        return (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            padding: '4px 8px',
            borderRadius: '4px',
            backgroundColor: '#f3f4f6',
            color: '#374151',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>
            {icon}
            <span>{label}</span>
          </div>
        );
      }
    },
    {
      field: 'points',
      headerName: t('points') || 'Points',
      width: 100,
      valueGetter: (params) => {
        // logger.debug('InstructorParticipationPage: Full params object:', params);
        // logger.debug('InstructorParticipationPage: Using params.value directly:', params.value, 'type:', typeof params.value);
        return Number(params.value) || 0;
      },
      renderCell: (params) => {
        const value = params.value || 0;
        return (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px',
            fontWeight: 'bold',
            color: value > 0 ? '#22c55e' : value < 0 ? '#ef4444' : '#6b7280'
          }}>
            {value > 0 && '+'}{value}
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
        logger.debug('=== DATE DEBUG ===');
        logger.debug('Date Debug - params:', params);
        logger.debug('Date Debug - params.value:', params.value);
        logger.debug('Date Debug - params.row:', params.row);
        
        // Check if params directly contains the timestamp (as shown in logs)
        if (params && typeof params === 'object' && params.seconds) {
          const date = new Date(params.seconds * 1000);
          logger.debug('Date Debug - Using params.seconds:', params.seconds, '-> date:', date);
          logger.debug('Date Debug - Formatted date:', formatQatarDateOnly(date));
          logger.debug('=== END DATE DEBUG ===');
          return formatQatarStandard(date);
        }
        
        // Check if params.value directly contains the timestamp
        if (params.value && typeof params.value === 'object' && params.value.seconds) {
          const date = new Date(params.value.seconds * 1000);
          logger.debug('Date Debug - Using params.value.seconds:', params.value.seconds, '-> date:', date);
          logger.debug('Date Debug - Formatted date:', formatQatarDateOnly(date));
          logger.debug('=== END DATE DEBUG ===');
          return formatQatarStandard(date);
        }
        
        // Fallback to original logic if params.value doesn't have timestamp
        const rowId = params?.id;
        let row = params?.row || {};
        
        // If row is empty, try to find it in participations state
        if (!row || Object.keys(row).length === 0) {
          const foundRow = participationsRaw.find(p => (p.id || p.docId) === rowId);
          if (foundRow) {
            row = foundRow;
          }
        }

        logger.debug('Date Debug - rowId:', rowId);
        logger.debug('Date Debug - Row data:', row);
        logger.debug('Date Debug - createdAt:', row.createdAt);
        logger.debug('Date Debug - createdAt type:', typeof row.createdAt);
        logger.debug('Date Debug - Has toDate method:', typeof row.createdAt?.toDate);
        logger.debug('Date Debug - createdAt keys:', row.createdAt ? Object.keys(row.createdAt) : 'N/A');
        
        if (!row.createdAt) {
          logger.debug('Date Debug - No createdAt found, returning "No Date"');
          logger.debug('=== END DATE DEBUG ===');
          return 'No Date';
        }
        
        let date;
        // Check if createdAt is a Firebase Timestamp object with toDate method
        if (typeof row.createdAt.toDate === 'function') {
          date = row.createdAt.toDate();
          logger.debug('Date Debug - Using toDate():', date);
        } 
        // Check if createdAt is an object with seconds property (likely a raw Firebase Timestamp)
        else if (row.createdAt && typeof row.createdAt === 'object' && row.createdAt.seconds) {
          date = new Date(row.createdAt.seconds * 1000);
          logger.debug('Date Debug - Using seconds:', row.createdAt.seconds, '-> date:', date);
        } 
        // Otherwise, assume it's a string or number that Date constructor can handle
        else {
          date = new Date(row.createdAt);
          logger.debug('Date Debug - Using new Date():', date);
        }

        
        if (isNaN(date.getTime())) {
          logger.debug('Date Debug - Invalid date, returning "Invalid Date"');
          logger.debug('=== END DATE DEBUG ===');
          return 'Invalid Date';
        }
        const formattedDate = formatQatarStandard(date);
        logger.debug('Date Debug - Formatted date:', formattedDate);
        logger.debug('=== END DATE DEBUG ===');
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
            Profile
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={getThemedIcon('ui', 'edit', 16, theme)}
            onClick={() => handleEdit(params.row)}
          >
            {t('edit_participation') || 'Edit'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={getThemedIcon('ui', 'trash', 16, theme)}
            onClick={() => handleDelete(params.row)}
            style={{ color: '#dc2626' }}
          >
            {t('delete_participation') || 'Delete'}
          </Button>
        </div>
      )
    }])
  ], [theme, lang, t, handleEdit, handleDelete, hideActions, programs, subjects, students, userCache]);

  return (
    <div>
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
          {getThemedIcon('ui', 'edit', 16, theme)} Editing Participation: {getParticipationLabel(editingParticipation.type, lang) || editingParticipation.type}
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
                  const iconMap = {
                    'UserCheck': 'active',
                    'UserX': 'inactive',
                    'UserMinus': 'suspended',
                    'AlertCircle': 'alert_triangle',
                    'Info': 'info'
                  };
                  const iconName = iconMap[iconProps.name] || 'user';
                  
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
                        {getThemedIcon('user_status', iconName, 16, theme)}
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
              ...PARTICIPATION_TYPES.map(pt => {
                // Map the icon component name to centralized icon system
                let iconName;
                switch (pt.icon.type.name) { // Get the component name from React element
                  case 'MessageSquare':
                    iconName = 'message_square';
                    break;
                  case 'Award':
                    iconName = 'award';
                    break;
                  case 'FileText':
                    iconName = 'file_text';
                    break;
                  case 'HelpCircle':
                    iconName = 'help_circle';
                    break;
                  case 'Users':
                    iconName = 'users';
                    break;
                  case 'Star':
                    iconName = 'star';
                    break;
                  case 'ThumbsUp':
                    iconName = 'thumbs_up';
                    break;
                  case 'Minus':
                    iconName = 'minus';
                    break;
                  case 'CheckCircle':
                    iconName = 'check_circle';
                    break;
                  case 'MoreHorizontal':
                    iconName = 'more_horizontal';
                    break;
                  default:
                    iconName = 'star';
                }
                return { 
                  value: pt.id, 
                  label: getParticipationLabel(pt.id, lang), 
                  icon: getThemedIcon('ui', iconName, 16, theme) 
                };
              })
            ]}
            placeholder={t('select_participation_type')}
            required
          />
        </div>
        <div className="form-row">
          <textarea
            ref={descriptionRef}
            defaultValue={formData.description}
            placeholder={t('description_optional_participation')}
            className="dashboard-textarea"
            rows={3}
          />
          <textarea
            ref={commentRef}
            defaultValue={formData.comment}
            placeholder="Comment (optional)"
            className="dashboard-textarea"
            rows={3}
          />
        </div>
        <div className="form-row">
          <input
            ref={pointsRef}
            type="number"
            defaultValue={formData.points}
            placeholder="Points"
            min={-10}
            max={10}
            step={1}
            className="dashboard-input"
            style={{ width: '100%' }}
          />
        </div>
        <div className="form-actions">
          <Button type="submit" variant="primary" loading={saving}>
            {editingParticipation ? (t('update') || 'Update') : (t('save') || 'Save')}
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
              {t('cancel') || 'Cancel'} {t('edit_participation') || 'Edit'}
            </Button>
          )}
        </div>
      </form>
      )}

      {/* Filters */}
      <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 16, alignItems: 'end' }}>
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
              searchable
              value={studentFilter}
              onChange={(e) => setStudentFilter(e.target.value)}
              options={[
                { value: '', label: t('all_students') || 'All Students' },
                ...selectStudents
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
                        case 'UserCheck': return getThemedIcon('user_status', 'active', 16, theme);
                        case 'UserX': return getThemedIcon('user_status', 'inactive', 16, theme);
                        case 'UserMinus': return getThemedIcon('user_status', 'suspended', 16, theme);
                        case 'AlertCircle': return getThemedIcon('ui', 'alert_triangle', 16, theme);
                        default: return getThemedIcon('ui', 'info', 16, theme);
                      }
                    };
                    
                    const isDisabled = status === USER_STATUS.DELETED;
                    
                    return {
                      value: u.docId || u.id,
                      displayLabel: u.displayName || u.realName || u.email || (t('unknown') || 'Unknown'),
                      label: (
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          gap: 6,
                          opacity: isDisabled ? 0.7 : 1
                        }}>
                          <IconComponent />
                          <span style={{ 
                            textDecoration: isDisabled ? 'line-through' : 'none',
                            flex: 1
                          }}>
                            {u.displayName || u.realName || u.email || (t('unknown') || 'Unknown')}
                          </span>
                        </div>
                      ),
                      disabled: isDisabled
                    };
                  })
              ]}
              showLabels={false}
              className="flex-1"
            />
          </div>
          <div style={{ minWidth: '200px' }}>
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Types' },
                ...PARTICIPATION_TYPES.map(pt => {
                  let icon;
                  switch (pt.icon) {
                    case 'MessageSquare':
                      icon = getThemedIcon('ui', 'message_square', 16, theme);
                      break;
                    case 'Award':
                      icon = getThemedIcon('ui', 'award', 16, theme);
                      break;
                    case 'FileText':
                      icon = getThemedIcon('ui', 'file_text', 16, theme);
                      break;
                    case 'Users':
                      icon = getThemedIcon('ui', 'users', 16, theme);
                      break;
                    case 'HelpCircle':
                      icon = getThemedIcon('ui', 'help_circle', 16, theme);
                      break;
                    case 'Star':
                      icon = getThemedIcon('ui', 'star', 16, theme);
                      break;
                    case 'ThumbsUp':
                      icon = getThemedIcon('ui', 'thumbs_up', 16, theme);
                      break;
                    case 'Minus':
                      icon = getThemedIcon('ui', 'minus', 16, theme);
                      break;
                    case 'X':
                      icon = getThemedIcon('ui', 'x', 16, theme);
                      break;
                    default:
                      icon = getThemedIcon('ui', 'star', 16, theme);
                  }
                  return { value: pt.id, label: getParticipationLabel(pt.id, lang), icon };
                })
              ]}
              placeholder="Type"
            />
          </div>
        </div>
      </div>

      {filteredParticipations.length !== participationsRaw.length && (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          marginBottom: '1rem',
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '9999px',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: '#1e40af'
        }}>
          {getThemedIcon('ui', 'filter', 14, theme)}
          {t('showing_filtered') || 'Showing'} {filteredParticipations.length} {t('of') || 'of'} {participationsRaw.length} {t('participations') || 'Participations'}
        </div>
      )}

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
          {getThemedIcon('ui', 'target', 16, theme)}
          {participationsRaw.length} Total
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
          {new Set(participationsRaw.map(p => p.studentId)).size} Students
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
          {participationsRaw.filter(p => (p.points || 0) > 0).reduce((sum, p) => sum + (p.points || 0), 0)} Positive
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
          {participationsRaw.filter(p => (p.points || 0) < 0).reduce((sum, p) => sum + (p.points || 0), 0)} Negative
        </div>
      </div>

      <div>
        {/* logger.debug('InstructorParticipationPage: Grid receiving participations data:', participations) */}
        <AdvancedDataGrid
          rows={gridRows}
          getRowId={(row) => row.docId || row.id}
          columns={columns}
          pageSize={10}
          pageSizeOptions={[10, 25, 50, 100]}
          checkboxSelection
          disableRowSelectionOnClick
          exportFileName="participations"
          showExportButton
          exportLabel="Export"
          loadingOverlayMessage={pageState === PAGE_STATES.LOADING ? "Loading participations..." : undefined}
        />
      </div>

      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={hideDeleteModal}
        onConfirm={handleDeleteConfirm}
        entityType={deleteModal.entityType}
        entityName={deleteModal.entityName}
        loading={pageState === PAGE_STATES.LOADING}
        t={t}
      />
    </div>
  );
};

export default ParticipationPage;

