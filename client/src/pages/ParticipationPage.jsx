import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import logger from '@utils/logger';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import { Button, Select, Loading, Textarea, useToast, AdvancedDataGrid, StudentSelect, Card, CardBody, Input, ProgramsSelect, NumberInput } from '@ui';
import DeleteModal, { useDeleteModal } from '@ui/DeleteModal/DeleteModal';
import { getPrograms, getSubjects, getSubject } from '@firebaseServices/programService';
import { getClassById } from '@firebaseServices/classService';
import { getClasses } from '@firebaseServices/classService';
import { getEnrollments, getEnrollmentsByClass } from '@firebaseServices/enrollmentService';
import { getUserById } from '@firebaseServices/userService';
import { addNotification } from '@firebaseServices/notificationService';
import { loadParticipations, createParticipation, updateParticipation, deleteParticipation } from '@firebaseServices/participationService';
import { formatQatarDateOnly } from '@utils/timezone';
import { Timestamp, serverTimestamp } from 'firebase/firestore';
import { PARTICIPATION_TYPES, getParticipationLabel, getParticipationTypeById } from '@constants/participationTypes';
import { getUserStatus, getUserStatusSummary, USER_STATUS, getStatusIconProps } from '@utils/userStatus';
import { 
  PAGE_STATES, 
  FORM_STATES,
  COMMON_GRID_COLUMNS
} from '@constants/pageTypes';
import styles from './ProgramsManagementPage.module.css';

const ParticipationPage = ({ isDashboardTab = false, hideActions = false }) => {
  const { user, isInstructor, isAdmin, isSuperAdmin } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const toast = useToast();
  const [pageState, setPageState] = useState(PAGE_STATES.LOADING);
  const [formState, setFormState] = useState(FORM_STATES.IDLE);
  const [participations, setParticipations] = useState([]);
  const [editingParticipation, setEditingParticipation] = useState(null);
  const { deleteModal, deleteItem, handleDeleteConfirm, hideDeleteModal } = useDeleteModal(t);
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
    points: 1,
    comment: ''
  });
  const [saving, setSaving] = useState(false);

  // Refs for text inputs to prevent re-renders
  const descriptionRef = useRef(null);
  const commentRef = useRef(null);

  // Sync refs when editing
  useEffect(() => {
    if (descriptionRef.current) descriptionRef.current.value = formData.description || '';
    if (commentRef.current) commentRef.current.value = formData.comment || '';
  }, [editingParticipation, formData.description, formData.comment]);

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

  // Filters
  const [programFilter, setProgramFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    if (!isInstructor && !isAdmin && !isSuperAdmin) return;
    loadData();
  }, [isInstructor, isAdmin, isSuperAdmin]);

  useEffect(() => {
    loadParticipationsData();
  }, [programFilter, subjectFilter, classFilter, typeFilter]);

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
            const studentDoc = userResult.success ? { exists: true, data: userResult.data } : { exists: false };
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

  const loadParticipationsData = () => {
    loadParticipations(
      setParticipations,
      setPageState,
      toast,
      t
    );
  };

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
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
        type: formData.type,
        description: formData.description.trim(),
        points: parseInt(formData.points) || 0,
        comment: formData.comment.trim(),
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
        
        // Send notification to student (with error handling)
        try {
          const participationType = { label_en: getParticipationLabel(formData.type, 'en') || formData.type };
          await addNotification({
            userId: formData.studentId,
            title: '✅ Participation Recorded',
            message: t('participation_notification', { type: participationType.label_en || formData.type, description: formData.description }),
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
            // Notification is optional - log but don't fail the operation
        }
        toast.success(t('participation_recorded'));
      }

      setEditingParticipation(null);
      resetForm();
      loadParticipations();
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
    deleteItem(participation, async () => {
      setParticipations(prev => prev.filter(p => p.docId !== participation.docId));
      try {
        const result = await deleteParticipation(participation.id, participation);
        if (!result.success) {
          throw new Error(result.error);
        }
        toast?.showSuccess(t('participation_deleted'));
        await loadParticipationsData();
      } catch (error) {
        setParticipations(prev => [...prev, participation]);
        logger.error('Delete failed:', error);
        toast?.showError(error.message);
      }
    });
  }, [deleteItem, toast, t, loadParticipationsData]);

  const resetForm = () => {
    setFormData({
      studentId: '',
      classId: '',
      subjectId: '',
      type: '',
      description: '',
      points: 1,
      comment: ''
    });
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
      headerName: 'User',
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
          const foundRow = participations.find(p => (p.id || p.docId) === rowId);
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
            backgroundColor: participationType.color || '#f3f4f6',
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
      headerName: 'Points',
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
          return formatQatarDateOnly(date);
        }
        
        // Check if params.value directly contains the timestamp
        if (params.value && typeof params.value === 'object' && params.value.seconds) {
          const date = new Date(params.value.seconds * 1000);
          logger.debug('Date Debug - Using params.value.seconds:', params.value.seconds, '-> date:', date);
          logger.debug('Date Debug - Formatted date:', formatQatarDateOnly(date));
          logger.debug('=== END DATE DEBUG ===');
          return formatQatarDateOnly(date);
        }
        
        // Fallback to original logic if params.value doesn't have timestamp
        const rowId = params?.id;
        let row = params?.row || {};
        
        // If row is empty, try to find it in participations state
        if (!row || Object.keys(row).length === 0) {
          const foundRow = participations.find(p => (p.id || p.docId) === rowId);
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
        const formattedDate = formatQatarDateOnly(date);
        logger.debug('Date Debug - Formatted date:', formattedDate);
        logger.debug('=== END DATE DEBUG ===');
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
  ], [theme, lang, t, handleEdit, handleDelete, hideActions]);

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
          {getThemedIcon('ui', 'edit', 16, theme)} Editing Participation: {getParticipationLabel(editingParticipation.type, lang) || editingParticipation.type}
        </div>
      )}

      {!isDashboardTab && (
        <form onSubmit={handleSubmit} className="dashboard-form">
        <div className="form-row">
          <ProgramsSelect
            programs={programs}
            subjects={subjects}
            classes={classes}
            selectedProgram={formData.programId}
            selectedSubject={formData.subjectId}
            selectedClass={formData.classId}
            onProgramChange={(programId) => {
              setFormData({ ...formData, programId, subjectId: '', classId: '', studentId: '' });
            }}
            onSubjectChange={(subjectId) => {
              setFormData({ ...formData, subjectId, classId: '', studentId: '' });
            }}
            onClassChange={(classId) => {
              setFormData({ ...formData, classId, studentId: '' });
              // Find the subject for this class and update program if needed
              const selectedClass = classes.find(c => (c.id || c.docId) === classId);
              if (selectedClass?.subjectId) {
                const selectedSubject = subjects.find(s => (s.docId || s.id) === selectedClass.subjectId);
                const programId = selectedSubject?.programId;
                setFormData(prev => ({
                  ...prev,
                  subjectId: selectedClass.subjectId,
                  classId: classId,
                  programId: programId || prev.programId
                }));
              }
            }}
            showLabels={false}
            className="flex-1"
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
                  const iconMap = {
                    'UserCheck': 'user_check',
                    'UserX': 'user_x',
                    'UserMinus': 'user_minus',
                    'AlertCircle': 'alert_circle',
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
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder={t('description_optional_participation')}
            className="dashboard-textarea"
            rows={3}
          />
          <textarea
            value={formData.comment}
            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
            placeholder="Comment (optional)"
            className="dashboard-textarea"
            rows={3}
          />
        </div>
        <div className="form-row">
          <input
            type="number"
            value={formData.points}
            onChange={(e) => setFormData({ ...formData, points: Number(e.target.value) })}
            placeholder="Points"
            className="dashboard-input"
            min="-10"
            max="10"
            step="1"
          />
        </div>
        <div className="form-actions">
          <Button type="submit" variant="primary" loading={saving}>
            {t('save') || 'Save'}
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
            className="flex-1"
          />
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
          {participations.length} Total
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
          {new Set(participations.map(p => p.studentId)).size} Students
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
          {participations.filter(p => (p.points || 0) > 0).reduce((sum, p) => sum + (p.points || 0), 0)} Positive
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
          {participations.filter(p => (p.points || 0) < 0).reduce((sum, p) => sum + (p.points || 0), 0)} Negative
        </div>
      </div>

      <div className={styles.content}>
        {/* logger.debug('InstructorParticipationPage: Grid receiving participations data:', participations) */}
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
          loadingOverlayMessage={pageState === PAGE_STATES.LOADING ? "Loading participations..." : undefined}
          fancyVariant="dots"
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
