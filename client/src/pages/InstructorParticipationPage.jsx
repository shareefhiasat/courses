import React, { useEffect, useState, useCallback, useMemo } from 'react';
import logger from '@utils/logger';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import { Button, Select, Loading, Textarea, useToast, AdvancedDataGrid, StudentSelect, Card, CardBody, Input, ProgramsSelect } from '@ui';
import { getPrograms, getSubjects, getSubject } from '@firebaseServices/programService';
import { getClassById } from '@firebaseServices/classService';
import { getClasses } from '@firebaseServices/classService';
import { getEnrollments, getEnrollmentsByClass } from '@firebaseServices/enrollmentService';
import { getUserById } from '@firebaseServices/userService';
import { addNotification } from '@firebaseServices/notificationService';
import { logActivity, ACTIVITY_LOG_TYPES } from '@firebaseServices/activityLogger';
import { formatQatarDateOnly } from '@utils/timezone';
import { db } from '@firebaseServices/config';
import { collection, query, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { PARTICIPATION_TYPES, getParticipationLabel, getParticipationTypeById } from '@constants/participationTypes';
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

const InstructorParticipationPage = ({ isDashboardTab = false, hideActions = false }) => {
  const { user, isInstructor, isAdmin, isSuperAdmin } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const toast = useToast();
  const [pageState, setPageState] = useState(PAGE_STATES.LOADING);
  const [formState, setFormState] = useState(FORM_STATES.IDLE);
  const [participations, setParticipations] = useState([]);
  const [editingParticipation, setEditingParticipation] = useState(null);
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
    points: 1,
    comment: ''
  });
  const [saving, setSaving] = useState(false);

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

  const loadParticipations = async () => {
    setPageState(PAGE_STATES.LOADING);
    try {
      const snap = await getDocs(query(collection(db, 'participations'), orderBy('createdAt', 'desc')));
      let data = snap.docs.map(d => ({ id: d.id, docId: d.id, ...d.data() }));
      
      // Enrich with student, class, subject info
      const enriched = await Promise.all(data.map(async (participation, idx) => {
        // Create a new object to avoid mutation issues, ensuring id and docId are preserved
        const enrichedParticipation = { 
          ...participation,
          id: participation.id || participation.docId,
          docId: participation.docId || participation.id
        };
        try {
          // Initialize with N/A as fallback
          enrichedParticipation.studentName = 'N/A';
          enrichedParticipation.className = 'N/A';
          enrichedParticipation.subjectName = 'N/A';
          
          if (enrichedParticipation.studentId) {
            try {
              const userResult = await getUserById(enrichedParticipation.studentId);
              if (userResult.success) {
                const studentData = userResult.data;
                // console.log('InstructorParticipationPage: Student data from Firebase:', studentData);
                // console.log('InstructorParticipationPage: displayName:', studentData.displayName, 'email:', studentData.email);
                enrichedParticipation.studentName = studentData.displayName || studentData.email || 'N/A';
                enrichedParticipation.studentEmail = studentData.email;
                } else {
                }
            } catch (err) {
              logger.error('❌ Failed to load student:', enrichedParticipation.studentId, err);
            }
          } else {
            }
          
          if (enrichedParticipation.classId) {
            try {
              const classResult = await getClassById(enrichedParticipation.classId);
              if (classResult.success) {
                const classData = classResult.data;
                enrichedParticipation.className = classData.name || classData.code || 'N/A';
                enrichedParticipation.classTerm = classData.term;
                // If subjectId is missing, try to get it from class
                if (!enrichedParticipation.subjectId && classData.subjectId) {
                  enrichedParticipation.subjectId = classData.subjectId;
                  }
                } else {
                }
            } catch (err) {
              logger.error('❌ Failed to load class:', enrichedParticipation.classId, err);
            }
          } else {
            }
          
          // Load subject from participation or class
          const subjectIdToLoad = enrichedParticipation.subjectId;
          if (subjectIdToLoad) {
            try {
              const subjectResult = await getSubject(subjectIdToLoad);
              if (subjectResult.success) {
                const subjectData = subjectResult.data;
                enrichedParticipation.subjectName = subjectData.name_en || subjectData.name_ar || subjectData.code || 'N/A';
                } else {
                }
            } catch (err) {
              logger.error('❌ Failed to load subject:', subjectIdToLoad, err);
            }
          } else {
            }
          
          } catch (err) {
          logger.error('❌ Failed to enrich participation:', enrichedParticipation.id || enrichedParticipation.docId, err);
        }
        
        try {
          if (enrichedParticipation.createdBy) {
            try {
              const instructorResult = await getUserById(enrichedParticipation.createdBy);
              if (instructorResult.success) {
                const instructorData = instructorResult.data;
                enrichedParticipation.instructorName = instructorData.displayName || instructorData.email;
              }
            } catch (err) {
              }
          }
        } catch (err) {
          logger.error('❌ Failed to enrich participation:', enrichedParticipation.id || enrichedParticipation.docId, err);
        }
        return enrichedParticipation;
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
      // console.log('InstructorParticipationPage: Setting participations with data:', filtered.length, 'items');
      // console.log('InstructorParticipationPage: Sample participation data:', filtered[0]);
      // console.log('InstructorParticipationPage: Full filtered array:', filtered);
      setParticipations([...filtered]);
    } catch (error) {
      logger.error('Failed to load participations:', error);
      toast.error(t('failed_to_save_participation') + ': ' + error.message);
    } finally {
      setPageState(PAGE_STATES.IDLE);
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
        } catch (e) { }
        toast.success(t('participation_updated'));
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
        } catch (e) { }
        
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
  };

  const handleEdit = (participation) => {
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
  };

  const handleDelete = async (participation) => {
    setDeleteModal({ open: true, item: participation });
  };

  const confirmDelete = async () => {
    if (!deleteModal.item) return;
    
    setPageState(PAGE_STATES.LOADING);
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
      } catch (e) { }
      toast.success(t('participation_deleted'));
      loadParticipations();
    } catch (error) {
      toast.error('Failed to delete participation: ' + error.message);
    } finally {
      setPageState(PAGE_STATES.IDLE);
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

  const columns = [
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
        // console.log('InstructorParticipationPage: Full params object:', params);
        // console.log('InstructorParticipationPage: Using params.value directly:', params.value, 'type:', typeof params.value);
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
          {getThemedIcon('ui', 'edit', 16, theme)} Editing Participation: {getParticipationLabel(editingParticipation.type, lang) || editingParticipation.type}
        </div>
      )}

      {!isDashboardTab && (
        <form onSubmit={handleSubmit} className="dashboard-form">
        <div className="form-row">
          <Select
            value={programs.find(p => subjects.find(s => s.docId === (classes.find(c => c.id === formData.classId)?.subjectId))?.programId === p.docId)?.docId || ''}
            onChange={(e) => {
              // Reset subject and class when program changes
              setFormData({ ...formData, subjectId: '', classId: '', studentId: '' });
            }}
            options={[
              { value: '', label: t('all_programs') || 'All Programs' },
              ...programs.map(program => ({
                value: program.docId || program.id,
                label: program[`name_${lang}`] || program.name || 'Unnamed Program',
              }))
            ]}
            placeholder={t('program') || 'Program'}
            label={t('program') || 'Program'}
          />
          <Select
            value={formData.subjectId || classes.find(c => c.id === formData.classId)?.subjectId || ''}
            onChange={(e) => {
              setFormData({ ...formData, subjectId: e.target.value, classId: '', studentId: '' });
            }}
            options={[
              { value: '', label: t('all_subjects') || 'All Subjects' },
              ...(programs.find(p => subjects.find(s => s.docId === (classes.find(c => c.id === formData.classId)?.subjectId))?.programId === p.docId)?.docId ?
                subjects.filter(subject => subject.programId === programs.find(p => subjects.find(s => s.docId === (classes.find(c => c.id === formData.classId)?.subjectId))?.programId === p.docId)?.docId).map(subject => ({
                  value: subject.docId || subject.id,
                  label: subject[`name_${lang}`] || subject.name || 'Unnamed Subject',
                })) : subjects.map(subject => ({
                  value: subject.docId || subject.id,
                  label: subject[`name_${lang}`] || subject.name || 'Unnamed Subject',
                })))
            ]}
            placeholder={t('subject') || 'Subject'}
            label={t('subject') || 'Subject'}
            disabled={!programs.find(p => subjects.find(s => s.docId === (classes.find(c => c.id === formData.classId)?.subjectId))?.programId === p.docId)?.docId}
          />
          <Select
            searchable
            value={formData.classId}
            onChange={(e) => {
              setFormData({ ...formData, classId: e.target.value, studentId: '' });
              const selectedClass = classes.find(c => (c.id || c.docId) === e.target.value);
              if (selectedClass?.subjectId) {
                setFormData(prev => ({ ...prev, subjectId: selectedClass.subjectId, classId: e.target.value }));
              }
            }}
            options={[
              { value: '', label: t('all_classes') || 'All Classes' },
              ...(formData.subjectId || classes.find(c => c.id === formData.classId)?.subjectId ?
                classes.filter(cls => cls.subjectId === (formData.subjectId || classes.find(c => c.id === formData.classId)?.subjectId)).map(cls => ({
                  value: cls.docId || cls.id,
                  label: cls.name || 'Unnamed Class',
                  code: cls.code,
                })) : classes.map(cls => ({
                  value: cls.docId || cls.id,
                  label: cls.name || 'Unnamed Class',
                  code: cls.code,
                })))
            ]}
            placeholder={t('select_class')}
            label={t('class') || 'Class'}
            disabled={!formData.subjectId && !classes.find(c => c.id === formData.classId)?.subjectId}
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
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder={t('description_optional_participation')}
            rows={3}
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
            {editingParticipation ? (t('update_participation') || 'Update') : (t('save_participation') || 'Save')}
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
              label="Type"
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
        {/* console.log('InstructorParticipationPage: Grid receiving participations data:', participations) */}
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
              <h3>{t('delete_participation') || 'Delete Participation'}</h3>
              <p>{t('delete_participation_confirmation') || 'Are you sure you want to delete this participation record?'}</p>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <Button variant="outline" onClick={() => setDeleteModal({ open: false, item: null })}>
                  {t('cancel') || 'Cancel'}
                </Button>
                <Button variant="primary" onClick={confirmDelete} style={{ backgroundColor: '#dc2626' }}>
                  {t('delete_participation') || 'Delete'}
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
};

export default InstructorParticipationPage;
