import React, { useEffect, useState, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import { debug } from "@services/utils/logger";
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { RECORD_TYPES } from '@utils/sharedTypes';
import { Button, Select, useToast, AdvancedDataGrid, ProgramsSelect, GridQuickFilterChips } from '@ui';
import { useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { DeleteModal, useDeleteModal } from '@ui';
import { createPenalty, updatePenalty, deletePenalty, getPenalties } from '@services/business/penaltyService';
import { useLookupTypes } from '@hooks/useLookupTypes.js';
// OLD: import { PENALTY_TYPES, PENALTY_TYPE_ICONS } from '@constants/penaltyTypes';
// NOW: Using useLookupTypes hook for all lookup data
import { getPrograms, getSubjects, getSubject, fetchProgram } from '@services/business/programService';
import { getClasses, getClassById } from '@services/business/classService';
import { getEnrollments, getStudentsByClass } from '@services/business/enrollmentService';
import { getAllUsers, getUserById, getUsersByIds, getUserByEmail } from '@services/business/userService';
import { useAuditGridColumns } from '@hooks/useAuditGridColumns.js';
import { ACTIVITY_LOG_TYPES } from '@services/other/activityLogger';
import { getUserStatus, getUserStatusSummary, USER_STATUS, getStatusIconProps } from '@utils/userStatus';
import { isUserDisabled, getUserId, getUserDisplayNameSync } from '@services/business/userService';
import { applyLocalizedNameFields } from '@utils/localizedUserName';
import { pickStudentName } from '@utils/pickLocalizedName';
import { 
  PAGE_STATES, 
  FORM_STATES,
} from '@constants/pageTypes';
import { getThemedIcon } from '@constants/iconTypes';

const PenaltiesPage = ({ isDashboardTab = false, hideActions = false }) => {
  const { user, isHR, isAdmin, isSuperAdmin, isInstructor } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const toast = useToast();
  const { data: lookupData } = useLookupTypes({
    types: ['penalty-types']
  });

  // Create penalty type icons from lookup data - using unified icon mapping like attendance
  const PENALTY_TYPE_ICONS = useMemo(() => {
    const iconMap = {
      AlertTriangle: getThemedIcon('ui', 'alert_triangle', 16, theme),
      MessageSquare: getThemedIcon('ui', 'message_square', 16, theme),
      AlertCircle: getThemedIcon('ui', 'alert_circle', 16, theme),
      XCircle: getThemedIcon('ui', 'x_circle', 16, theme),
      HelpCircle: getThemedIcon('ui', 'help_circle', 16, theme),
      Clock: getThemedIcon('ui', 'clock', 16, theme),
      Users: getThemedIcon('ui', 'users', 16, theme),
      Bed: getThemedIcon('ui', 'bed', 16, theme),
      Shield: getThemedIcon('ui', 'shield', 16, theme),
      MoreHorizontal: getThemedIcon('ui', 'more_horizontal', 16, theme),
    };
    
    return (lookupData['penalty-types'] || []).reduce((acc, type) => {
      const iconName = type.icon || 'AlertTriangle';
      acc[type.id] = iconMap[iconName] || iconMap.AlertTriangle;
      return acc;
    }, {});
  }, [lookupData, theme]);

  const [pageState, setPageState] = useState(PAGE_STATES.LOADING);
  const [formState, setFormState] = useState(FORM_STATES.IDLE);
  const [loading, setLoading] = useState(false);
  const [penalties, setPenalties] = useState([]);
  const [editingPenalty, setEditingPenalty] = useState(null);
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
    typeId: '',
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
  const commentRef = useRef(null);
  const pointsRef = useRef(null);

  // Map frontend type IDs to database codes
  const mapTypeToDatabaseCode = useCallback((frontendType) => {
    const typeMapping = {
      'cheating': 'CHEATING',
      'impersonation': 'PLAGIARISM', // Database has PLAGIARISM not IMPERSONATION
      'exam_disruption': 'DISRUPTION', // Database has DISRUPTION not EXAM_DISRUPTION
      'forgery': 'FORGERY', // This might need adjustment based on actual DB
      'other': 'MISCONDUCT', // Use MISCONDUCT as the "other" option
      'dress_code': 'DRESS_CODE' // Add missing type
    };
    
    const dbCode = typeMapping[frontendType];
    console.log('🔍 [DEBUG] Mapping type:', frontendType, '→', dbCode);
    return dbCode || frontendType.toUpperCase();
  }, []);

  // Sync refs when editing
  useEffect(() => {
    console.log('🔍 [DEBUG] useEffect for syncing refs triggered');
    console.log('🔍 [DEBUG] editingPenalty:', !!editingPenalty);
    console.log('🔍 [DEBUG] formData.comment:', formData.comment);
    console.log('🔍 [DEBUG] commentRef.current:', commentRef.current);
    
    if (commentRef.current) {
      console.log('🔍 [DEBUG] Setting commentRef.current.value to:', formData.comment || '');
      commentRef.current.value = formData.comment || '';
    }
    if (pointsRef.current) pointsRef.current.value = formData.points || -1;
  }, [editingPenalty, formData.comment, formData.points]);

  // Read text values from refs into form state before submit
  const syncRefsToState = useCallback(() => {
    return {
      comment: commentRef.current?.value ?? formData.comment,
      points: parseInt(pointsRef.current?.value) || formData.points || -1
    };
  }, [formData.comment, formData.points]);

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
      debug('Failed to fetch user:', userId, err);
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
      debug('Failed to fetch class:', classId, err);
    }
    return null;
  }, []);

  // Function to fetch subject data on demand and cache it
  const fetchSubjectData = useCallback(async (subjectId) => {
    if (!subjectId) return null;
    
    try {
      const result = await getSubject(subjectId);
      if (result.success) {
        return result.data;
      }
    } catch (err) {
      debug('Failed to fetch subject:', subjectId, err);
    }
    return null;
  }, []);

  // Filter enrollments based on user role for student dropdown
  const filteredEnrollmentsForSelect = enrollments;

  // Load users - merge both selectStudents and all users logic to prevent infinite loop
  useEffect(() => {
    const loadUsers = async () => {
      if (isSuperAdmin || isAdmin || isHR) {
        // Load all users for display resolution
        const allUsersResult = await getAllUsers(); 
        setStudents(allUsersResult.success ? allUsersResult.data : []);
        
        // Load students only for dropdown
        const studentsResult = await getAllUsers({ studentsOnly: true });
        setSelectStudents(studentsResult.success ? studentsResult.data : []);
        return;
      }
      if (isInstructor) {
        // For instructors, load students from their enrollments
        const enrollmentUserIds = enrollments
          .map(e => e.userId || e.userDocId)
          .filter(Boolean);
        
        if (enrollmentUserIds.length > 0) {
          const result = await getUsersByIds(enrollmentUserIds);
          const usersMap = result.success ? result.data : {};
          const usersList = Object.values(usersMap).filter(Boolean);
          
          // Use same list for both purposes
          setStudents(usersList);
          setSelectStudents(usersList);
        } else {
          setStudents([]);
          setSelectStudents([]);
        }
        return;
      }
      // Other roles get no users
      setStudents([]);
      setSelectStudents([]);
    };
    loadUsers();
  }, [enrollments, isSuperAdmin, isAdmin, isHR, isInstructor]);

  // Filters
  const [programFilter, setProgramFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [studentFilter, setStudentFilter] = useState('');
  const { startLoading } = useGlobalLoading();

  // Load data - classes, programs, subjects, enrollments
  const loadData = useCallback(async () => {
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
      debug(t('penalty_failed_to_load_data'), error);
    }
  }, []);

  const loadPenalties = useCallback(async (isInitial = false) => {
    if (!isInitial) setLoading(true);
    try {
      const result = await getPenalties();
      
      if (result.success) {
        // DEBUG: Log existing penalty types and their codes
        const existingTypes = result.data?.map(p => ({
          id: p.typeId,
          code: p.penaltyType?.code,
          nameEn: p.penaltyType?.nameEn,
          nameAr: p.penaltyType?.nameAr
        })).filter(Boolean);
        
        console.log('🔍 [DEBUG] Existing penalty types in database:');
        existingTypes.forEach(type => {
          console.log(`  - ID: ${type.id}, Code: ${type.code}, Name: ${type.nameEn}`);
        });
        
        console.log('🔍 [DEBUG] Sample penalty:', result.data?.[0]);
        
        setPenalties(result.data || []);
      } else {
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
          
          // Fix 1: Use userId instead of studentId, and use pre-populated user object
          if (enrichedPenalty.userId && enrichedPenalty.user) {
            const user = enrichedPenalty.user;
            applyLocalizedNameFields(enrichedPenalty, user, 'N/A');
            enrichedPenalty.studentEmail = user.email;
            enrichedPenalty.studentId = enrichedPenalty.userId;
          } else if (enrichedPenalty.userId) {
            // Fallback: fetch user data if user object is missing
            try {
              const studentData = await fetchUser(enrichedPenalty.userId);
              if (studentData) {
                applyLocalizedNameFields(enrichedPenalty, studentData, 'N/A');
                enrichedPenalty.studentEmail = studentData.email;
                enrichedPenalty.studentId = enrichedPenalty.userId;
              }
            } catch (err) {
              debug('Failed to fetch student:', err);
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
              const subjectData = await fetchSubjectData(subjectIdToLoad);
              if (subjectData) {
                enrichedPenalty.subjectName = lang === 'ar' 
                  ? (subjectData.nameAr || subjectData.nameEn || subjectData.code || 'N/A')
                  : (subjectData.nameEn || subjectData.nameAr || subjectData.code || 'N/A');
                
                // Load program from subject
                if (subjectData.programId) {
                  try {
                    const programData = await fetchProgram(subjectData.programId);
                    if (programData) {
                      // Fix 2: Handle both response formats
                      const program = programData.data || programData;
                      enrichedPenalty.programName = lang === 'ar'
                        ? (program.nameAr || program.nameEn || program.code || 'N/A')
                        : (program.nameEn || program.nameAr || program.code || 'N/A');
                    } else {
                      enrichedPenalty.programName = 'N/A';
                    }
                  } catch (err) {
                    enrichedPenalty.programName = 'N/A';
                  }
                } else {
                  enrichedPenalty.programName = 'N/A';
                }
              }
            } catch (err) {
            }
          }
          
          } catch (err) {
          debug('Failed to enrich penalty:', enrichedPenalty.id || enrichedPenalty.docId, err);
        }
        return enrichedPenalty;
      }));
      

      // Create a new array to ensure React detects the change
      setPenalties([...enriched]);
    } catch (error) {
      debug(t('penalty_failed_to_load_penalties'), error);
      toast.error(t('failed_to_save_penalty') + ': ' + error.message);
    } finally {
      if (!isInitial) setLoading(false);
    }
  }, [toast, t, fetchUser, fetchClass, fetchSubjectData, lang]);

  // Use GlobalLoading for initial data load
  useLayoutEffect(() => {
    if (!isHR && !isAdmin && !isSuperAdmin && !isInstructor) return;

    let stopLoading = null;

    const initialLoad = async () => {
      stopLoading = startLoading({ message: t('penalty_loading_penalties') });
      await Promise.all([loadData(), loadPenalties(true)]);
      if (stopLoading) stopLoading();
      setLoading(false);
      
      // Log page view after load
      try {
        debug('🔍 PENALTY VIEWING LOG - About to log activity:', {
          timestamp: new Date(),
          timestampUTC: new Date().toISOString(),
          userTime: new Date().toLocaleString(),
          qatarTime: new Date().toLocaleString('en-US', { timeZone: 'Asia/Qatar' }),
          userId: user?.uid,
          userEmail: user?.email,
          activityType: ACTIVITY_LOG_TYPES.PENALTY_VIEWED
        });
        debug('✅ PENALTY VIEWING LOG - Activity logged successfully');
      } catch (e) {
        debug('❌ PENALTY VIEWING LOG - Error logging activity:', e);
      }
    };

    initialLoad();

    return () => {
      if (stopLoading) stopLoading();
    };
  }, [isHR, isAdmin, isSuperAdmin, isInstructor]); // Remove loadData and loadPenalties to prevent infinite loop

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    
    // Early validation - check if form is properly filled
    if (!formData.studentId || !formData.type) {
      setTimeout(() => {
        toast.error(t('penalty.select_student_and_type', 'Please select a student and penalty type'));
      }, 0);
      return false;
    }
    
    // Read text fields from refs (uncontrolled inputs)
    const textValues = syncRefsToState();

    setSaving(true);
    try {
      // Only fetch class data if classId is provided
      let classData = null;
      let subjectId = formData.subjectId;
      
      if (formData.classId) {
        classData = await fetchClass(formData.classId);
        subjectId = formData.subjectId || classData?.subjectId;
      }
      
      // Get current user's database ID (not Keycloak UUID)
      const currentUser = await getUserByEmail(user.email);
      const userId = currentUser?.data?.id || currentUser?.id;
      
      if (!userId) {
        toast.error(t('penalty.user_info_failed', 'Failed to get user information'));
        return;
      }
      
      const penaltyData = {
        studentId: formData.studentId, // Backend expects studentId, not userId
        classId: formData.classId,
        subjectId: subjectId,
        programId: formData.programId,
        type: formData.type,
        description: '', // Will be empty since we removed the field
        reason: '', // Will be empty since we removed the field
        note: '', // Will be empty since we removed the field
        feedback: '', // Will be empty since we removed the field
        points: textValues.points || 0,
        comment: textValues.comment?.trim() || '',
        createdBy: userId, // Use database integer ID
        performedBy: userId, // Use database integer ID
        performedByName: user.displayName || user.email,
        performedByEmail: user.email,
        sendInAppNotification: true,
        sendEmailNotification: false
      };

      // DEBUG: Log the data being sent
      console.log('🔍 [DEBUG] Penalty data being sent:', penaltyData);
      console.log('🔍 [DEBUG] Available penalty types:', (lookupData['penalty-types'] || []).map(pt => pt.id));
      console.log('🔍 [DEBUG] userId value:', userId);
      console.log('🔍 [DEBUG] userId type:', typeof userId);
      console.log('🔍 [DEBUG] formData.studentId:', formData.studentId);
      console.log('🔍 [DEBUG] formData.studentId type:', typeof formData.studentId);

      let result;
      if (editingPenalty) {
        // Map frontend type to database code for update
        const dbTypeCode = mapTypeToDatabaseCode(penaltyData.type);
        
        // For updates, use the original penalty type code if the type hasn't changed
        let typeToSend = dbTypeCode;
        
        console.log('🔍 [DEBUG] Original penalty penaltyType:', editingPenalty.penaltyType);
        console.log('🔍 [DEBUG] Original penalty typeId:', editingPenalty.typeId);
        console.log('🔍 [DEBUG] Form type:', penaltyData.type);
        console.log('🔍 [DEBUG] Mapped type code:', dbTypeCode);
        
        // If the form type is 'other' (meaning unknown type), preserve the original type code
        if (penaltyData.type === 'other' && editingPenalty.penaltyType?.code) {
          typeToSend = editingPenalty.penaltyType.code;
          console.log('🔍 [DEBUG] Form type is "other", using original penalty type code:', typeToSend);
        } else {
          console.log('🔍 [DEBUG] Using mapped type code:', typeToSend);
        }
        
        console.log('🔍 [DEBUG] Final type to send:', typeToSend);
        
        console.log('🔍 [DEBUG] Updating penalty with data:', {
          studentId: penaltyData.studentId,
          classId: penaltyData.classId,
          subjectId: penaltyData.subjectId,
          type: typeToSend, // Use determined type code
          description: '',
          feedback: '',
          points: penaltyData.points,
          comment: penaltyData.comment,
          programId: penaltyData.programId
        });
        
        console.log('🔍 [DEBUG] Actual data sent to updatePenalty:', {
          studentId: penaltyData.studentId,
          classId: penaltyData.classId,
          subjectId: penaltyData.subjectId,
          type: typeToSend,
          description: '',
          feedback: '',
          points: penaltyData.points,
          comment: penaltyData.comment,
          programId: penaltyData.programId
        });
        
        result = await updatePenalty(editingPenalty.docId || editingPenalty.id, {
          studentId: penaltyData.studentId, // Backend expects studentId
          classId: penaltyData.classId,
          subjectId: penaltyData.subjectId,
          type: typeToSend, // Use determined type code
          description: '', // Empty since removed
          feedback: '', // Empty since removed
          points: penaltyData.points,
          comment: penaltyData.comment,
          programId: penaltyData.programId
        });
              } else {
        // For create, map frontend type to database code
        const dbTypeCode = mapTypeToDatabaseCode(penaltyData.type);
        
        console.log('🔍 [DEBUG] Creating penalty with mapped type:', dbTypeCode);
        console.log('🔍 [DEBUG] Original create data:', penaltyData);
        
        // Create a new object with the mapped type
        const createData = {
          ...penaltyData,
          type: dbTypeCode // Use mapped database code
        };
        
        console.log('🔍 [DEBUG] Final create data:', createData);
        
        result = await createPenalty(createData);
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
  }, [formData, editingPenalty, loadPenalties, setSaving, fetchClass, syncRefsToState, user, mapTypeToDatabaseCode]);

  const handleEdit = useCallback((penalty) => {
    console.log('🔍 [DEBUG] handleEdit called with penalty:', penalty);
    console.log('🔍 [DEBUG] penalty.type:', penalty.type);
    console.log('🔍 [DEBUG] penalty.typeId:', penalty.typeId);
    console.log('🔍 [DEBUG] penalty.penaltyType:', penalty.penaltyType);
    console.log('🔍 [DEBUG] Available types:', (lookupData['penalty-types'] || []).map(pt => pt.id));
    
    setEditingPenalty(penalty);
    
    // Fix: Map penaltyType.code to lowercase type ID, handling unknown types
    const penaltyTypeCode = penalty.penaltyType?.code?.toLowerCase();
    
    // Check if this type exists in our frontend constants
    const frontendType = (lookupData['penalty-types'] || []).find(pt => pt.id === penaltyTypeCode);
    const mappedType = frontendType ? penaltyTypeCode : 'other'; // Default to 'other' for unknown types
    
    console.log('🔍 [DEBUG] penaltyTypeCode:', penaltyTypeCode);
    console.log('🔍 [DEBUG] frontendType found:', !!frontendType);
    console.log('🔍 [DEBUG] Mapped penalty type:', mappedType);
    
    const newFormData = {
      programId: penalty.programId || '',
      studentId: penalty.studentId || '',
      classId: penalty.classId || '',
      subjectId: penalty.subjectId || '',
      type: mappedType, // Fix: Use mapped type from penaltyType.code
      points: penalty.points || -1,
      comment: penalty.comment || ''
    };
    
    console.log('🔍 [DEBUG] Setting formData to:', newFormData);
    setFormData(newFormData);
  }, []);

  const handleDelete = useCallback((penalty) => {
    deleteEntity('penalty', penalty, async () => {
      setPenalties(prev => prev.filter(p => (p.docId || p.id) !== (penalty.docId || penalty.id)));
      try {
        const result = await deletePenalty(penalty.id || penalty.docId);
        if (!result.success) {
          throw new Error(result.error);
        }
        toast.success(t('penalty_deleted') || 'Penalty deleted successfully');
        await loadPenalties();
      } catch (error) {
        setPenalties(prev => [...prev, penalty]);
        toast.error(error.message);
      }
    });
  }, [deleteEntity, loadPenalties]);

  const resetForm = () => {
    setFormData({
      programId: '',
      studentId: '',
      classId: '',
      subjectId: '',
      typeId: '',
      points: -1,
      comment: ''
    });
    // Clear refs
    if (commentRef.current) commentRef.current.value = '';
    if (pointsRef.current) pointsRef.current.value = '-1';
    setEditingPenalty(null);
  };

  // Filter penalties based on selected filters
  const filteredPenalties = penalties.filter(penalty => {
    if (programFilter) {
      const subject = subjects.find(s => (s.docId || s.id) === penalty.subjectId);
      if (!subject || subject.programId !== programFilter) return false;
    }
    if (subjectFilter && penalty.subjectId !== subjectFilter) return false;
    if (classFilter && penalty.classId !== classFilter) return false;
    if (typeFilter !== 'all' && typeFilter !== 'points-positive' && typeFilter !== 'points-negative' && penalty.type !== typeFilter) return false;
    if (typeFilter === 'points-positive' && (penalty.points || 0) <= 0) return false;
    if (typeFilter === 'points-negative' && (penalty.points || 0) >= 0) return false;
    if (studentFilter && penalty.studentId !== studentFilter) return false;
    return true;
  });

  const auditColumns = useAuditGridColumns({
    users: students,
    columnOverrides: {
      createdAt: { headerName: t('penalty_date'), width: 150 },
    },
  });

  const columns = useMemo(() => [
    {
      field: 'studentName',
      headerName: t('penalty_user'),
      flex: 1,
      minWidth: 200,
      renderCell: (params) => {
        const row = params?.row || {};
        const rowId = row.id || row.docId || params?.id;
        
        
        let studentName = pickStudentName(row, row.user, lang, row.studentName || params?.value || 'N/A');
        let studentEmail = row.studentEmail;
        let studentId = row.studentId || row.userId; // Fix: Use userId as fallback
        
        // If studentName is email or missing, try to get realName from user data
        if (!studentName || studentName === 'N/A' || studentName.includes('@')) {
          // Try to find user data to get realName/displayName
          // Handle both string and integer IDs
          const user = students.find(u => 
            u.email === studentEmail || 
            (u.docId || u.id) === studentId || 
            (u.docId || u.id) === parseInt(studentId) ||
            String(u.docId || u.id) === String(studentId)
          );
          
          if (user?.realName) {
            studentName = user.realName;
          } else if (user?.displayName) {
            studentName = user.displayName;
          } else if (user?.email) {
            studentName = user.email;
          } else if (studentId && userCache[studentId]) {
            // Try cached user data
            const cachedUser = userCache[studentId];
            if (cachedUser?.realName) {
              studentName = cachedUser.realName;
            } else if (cachedUser?.displayName) {
              studentName = cachedUser.displayName;
            } else if (cachedUser?.email) {
              studentName = cachedUser.email;
            }
          } else if (studentId && userCache[parseInt(studentId)]) {
            // Try cached user data with integer ID
            const cachedUser = userCache[parseInt(studentId)];
            if (cachedUser?.realName) {
              studentName = cachedUser.realName;
            } else if (cachedUser?.displayName) {
              studentName = cachedUser.displayName;
            } else if (cachedUser?.email) {
              studentName = cachedUser.email;
            }
          }
          
          // Final fallback: show ID
          if (!studentName || studentName === 'N/A') {
            studentName = `Student ID: ${studentId}`;
          }
        }
        
        // If not available, try to get from penalties state
        if (!studentName && rowId) {
          const foundRow = penalties.find(p => (p.id || p.docId) === rowId);
          studentName = foundRow?.studentName;
          studentEmail = foundRow?.studentEmail;
          studentId = foundRow?.studentId;
          
          // Try to get realName from user data
          if (!studentName || studentName === 'N/A' || studentName.includes('@')) {
            const user = students.find(u => 
              u.email === studentEmail || 
              (u.docId || u.id) === studentId || 
              (u.docId || u.id) === parseInt(studentId) ||
              String(u.docId || u.id) === String(studentId)
            );
            if (user?.realName) {
              studentName = user.realName;
            } else if (user?.displayName) {
              studentName = user.displayName;
            } else if (user?.email) {
              studentName = user.email;
            } else if (studentId && userCache[studentId]) {
              // Try cached user data
              const cachedUser = userCache[studentId];
              if (cachedUser?.realName) {
                studentName = cachedUser.realName;
              } else if (cachedUser?.displayName) {
                studentName = cachedUser.displayName;
              } else if (cachedUser?.email) {
                studentName = cachedUser.email;
              }
            } else if (studentId && userCache[parseInt(studentId)]) {
              // Try cached user data with integer ID
              const cachedUser = userCache[parseInt(studentId)];
              if (cachedUser?.realName) {
                studentName = cachedUser.realName;
              } else if (cachedUser?.displayName) {
                studentName = cachedUser.displayName;
              } else if (cachedUser?.email) {
                studentName = cachedUser.email;
              }
            }
            
            // Final fallback: show ID
            if (!studentName || studentName === 'N/A') {
              studentName = `Student ID: ${studentId}`;
            }
          }
        }
        
        const displayName = studentName && studentName !== 'N/A' ? studentName : (studentEmail || 'N/A');
        
        // Format as "Name (email)" like enrollments, but only if we have both and they're different
        if (studentEmail && studentEmail !== displayName && !displayName.includes('@')) {
          return `${displayName} (${studentEmail})`;
        }
        
        return displayName;
      }
    },
    {
      field: 'className',
      headerName: t('penalty_class'),
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
      field: 'typeId',
      headerName: t('penalty_type'),
      width: 180,
      renderCell: (params) => {
        // Try to get the penaltyType object from the row data first
        const row = params.row;
        let typeName = params.value; // Default to the numeric value
        
        if (row.penaltyType) {
          // Use the penaltyType object from the enriched data
          typeName = lang === 'ar' ? row.penaltyType.nameAr : row.penaltyType.nameEn;
        } else if (row.type) {
          // Fallback: try to find by frontend type ID
          const penaltyType = (lookupData['penalty-types'] || []).find(pt => pt.id === row.type);
          typeName = penaltyType ? (lang === 'ar' ? (penaltyType.nameAr || penaltyType.nameEn) : penaltyType.nameEn) : row.type;
        } else {
          // Final fallback: try to match numeric typeId with frontend types (index-based)
          const typeIndex = parseInt(params.value) - 1; // Assuming IDs start from 1
          const penaltyTypesArray = lookupData['penalty-types'] || [];
          const penaltyType = penaltyTypesArray[typeIndex];
          typeName = penaltyType ? (lang === 'ar' ? (penaltyType.nameAr || penaltyType.nameEn) : penaltyType.nameEn) : params.value;
        }
        
        return typeName || params.value;
      }
    },
    {
      field: 'points',
      headerName: t('penalty_points'),
      width: 100,
      valueGetter: (params) => {
        return Number(params.value) || 0;
      },
      renderCell: (params) => {
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
            {value > 0 && getThemedIcon('ui', 'trending_up', 14, theme)}
            {value < 0 && getThemedIcon('ui', 'trending_down', 14, theme)}
          </div>
        );
      }
    },
    {
      field: 'programName',
      headerName: t('program') || 'Program',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => {
        const row = params?.row || {};
        const rowId = row.id || row.docId || params?.id;
        // Try to get from row first, then from params.value, then from penalties state
        let programName = row.programName || params?.value;
        if (!programName && rowId) {
          const foundRow = penalties.find(p => (p.id || p.docId) === rowId);
          programName = foundRow?.programName;
        }
        if (programName && programName !== 'N/A') {
          return programName;
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
        
        // If still not found, try to resolve from subjects array using subjectId
        if (!subjectName || subjectName === 'N/A') {
          const subjectId = row.subjectId;
          if (subjectId) {
            const subject = subjects.find(s => (s.docId || s.id) === subjectId);
            if (subject) {
              subjectName = lang === 'ar' ? (subject.nameAr || subject.nameEn || subject.code) : (subject.nameEn || subject.nameAr || subject.code);
            }
          }
        }
        
        // Final fallback from penalties state
        if (!subjectName && rowId) {
          const foundRow = penalties.find(p => (p.id || p.docId) === rowId);
          subjectName = foundRow?.subjectName;
        }
        
        return (subjectName && subjectName !== 'N/A') ? subjectName : 'N/A';
      }
    },
    {
      field: 'comment',
      headerName: t('comment') || 'Comment',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => params.value || '—'
    },
    ...auditColumns,
    ...(hideActions ? [] : [{
      field: 'actions',
      headerName: t('penalty_actions'),
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
            {t('penalty_edit')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={getThemedIcon('ui', 'trash', 16, theme)}
            onClick={() => handleDelete(params.row)}
            style={{ color: '#dc2626' }}
          >
            {t('penalty_delete')}
          </Button>
        </div>
      )
    }])
  ], [theme, lang, t, handleEdit, handleDelete, hideActions, subjects, penalties, students, auditColumns]);

  return (
    <div>
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
          {getThemedIcon('ui', 'edit', 16, theme)} {t('editing_penalty', { penaltyType: (lookupData['penalty-types'] || []).find(pt => pt.id === editingPenalty.type)?.nameEn || editingPenalty.type }) || `Editing Penalty: ${(lookupData['penalty-types'] || []).find(pt => pt.id === editingPenalty.type)?.nameEn || editingPenalty.type}`}
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
            onChange={(e) => setFormData(prev => ({ ...prev, studentId: e.target.value }))}
            options={[
              { value: '', label: t('penalty_select_student') },
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
                      case 'UserCheck': return getThemedIcon('user_status', 'active', 24, theme);
                      case 'UserX': return getThemedIcon('user_status', 'inactive', 24, theme);
                      case 'UserMinus': return getThemedIcon('user_status', 'suspended', 24, theme);
                      case 'AlertCircle': return getThemedIcon('ui', 'alert_triangle', 24, theme);
                      default: return getThemedIcon('ui', 'info', 24, theme);
                    }
                  };
                  
                  const isDisabled = isUserDisabled(status);
                  const statusLabel = statusSummary?.label || status;
                  
                  return {
                    value: getUserId(u),
                    displayLabel: getUserDisplayNameSync(u, lang),
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
                          {u.displayName || u.realName || u.email || t('penalty_unknown_student')}
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
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
            options={[
              { value: '', label: t('penalty_select_type') },
              ...(lookupData['penalty-types'] || []).map(pt => ({ value: pt.id, label: lang === 'ar' ? (pt.nameAr || pt.nameEn) : pt.nameEn, icon: PENALTY_TYPE_ICONS[pt.id] }))
            ]}
            placeholder={t('select_penalty_type')}
            required
          />
        </div>
        {/* Comment and Points Row */}
        <div className="form-row">
          <textarea
            ref={commentRef}
            defaultValue={formData.comment}
            placeholder={t('comment_optional') || 'Comment (optional)'}
            className="dashboard-textarea"
            rows={3}
          />
          <input
            ref={pointsRef}
            type="number"
            defaultValue={formData.points}
            placeholder={t('penalty_enter_points')}
            min={-10}
            max={10}
            step={1}
            className="dashboard-input"
            style={{ width: '100%' }}
          />
        </div>
        <div className="form-actions">
          <Button type="submit" variant="primary" loading={saving}>
            {editingPenalty ? t('penalty_edit_penalty') : t('penalty_add_penalty')}
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
        {/* First Row: Program, Subject, Class */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, alignItems: 'end', marginBottom: 16 }}>
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
        </div>
        
        {/* Second Row: Student and Type */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'end' }}>
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
                        case 'UserX': return getThemedIcon('user_status', 'deleted', 16, theme);
                        case 'UserMinus': return getThemedIcon('user_status', 'archived', 16, theme);
                        case 'AlertCircle': return getThemedIcon('ui', 'alert_triangle', 16, theme);
                        default: return getThemedIcon('ui', 'info', 16, theme);
                      }
                    };
                    
                    const isDisabled = isUserDisabled(status);
                    
                    return {
                      value: getUserId(u),
                      displayLabel: getUserDisplayNameSync(u, lang),
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
                            {u.displayName || u.realName || u.email || t('penalty_unknown_student')}
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
                { value: 'all', label: t('penalty_all_types') },
                ...(lookupData['penalty-types'] || []).map(pt => ({ value: pt.id, label: lang === 'ar' ? (pt.nameAr || pt.nameEn) : pt.nameEn, icon: PENALTY_TYPE_ICONS[pt.id] }))
              ]}
              placeholder={t('type') || 'Type'}
            />
          </div>
        </div>
      </div>

      {filteredPenalties.length !== penalties.length && (
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
          {t('showing_filtered') || 'Showing'} {filteredPenalties.length} {t('of') || 'of'} {penalties.length} {t('penalties') || 'Penalties'}
        </div>
      )}

      <GridQuickFilterChips
        activeId={typeFilter === 'all' ? 'all' : String(typeFilter)}
        onChange={(id) => setTypeFilter(id === 'all' ? 'all' : id)}
        chips={[
          {
            id: 'all',
            label: t('total') || 'Total',
            count: penalties.length,
            icon: getThemedIcon('ui', 'alert_circle', 16, theme),
            variant: 'red',
          },
          {
            id: 'points-positive',
            label: t('penalty_positive'),
            count: penalties.filter((p) => (p.points || 0) > 0).length,
            icon: getThemedIcon('ui', 'trending_up', 16, theme),
            variant: 'green',
          },
          {
            id: 'points-negative',
            label: t('penalty_negative'),
            count: penalties.filter((p) => (p.points || 0) < 0).length,
            icon: getThemedIcon('ui', 'trending_down', 16, theme),
            variant: 'red',
          },
          {
            id: 'stat-students',
            label: t('students') || 'Students',
            count: new Set(penalties.map((p) => p.studentId)).size,
            icon: getThemedIcon('ui', 'users', 16, theme),
            variant: 'red',
            filterable: false,
          },
          ...(lookupData['penalty-types'] || []).map((pt) => {
            const count = penalties.filter((p) => p.type === pt.id).length;
            if (count === 0) return null;
            return {
              id: String(pt.id),
              label: lang === 'ar' ? pt.label_ar : pt.label_en,
              count,
              icon: PENALTY_TYPE_ICONS[pt.id],
              variant: 'amber',
            };
          }).filter(Boolean),
        ]}
      />

      <div>
        <AdvancedDataGrid
          gridId="penalties"
          rows={filteredPenalties}
          columns={columns}
          pageSize={50}
          pageSizeOptions={[10, 25, 50, 100]}
          checkboxSelection
          disableRowSelectionOnClick
          exportFileName="penalties"
          showExportButton
          exportLabel={t('export') || 'Export'}
          loadingOverlayMessage={loading ? t('penalty_loading_penalties_overlay') : undefined}
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

