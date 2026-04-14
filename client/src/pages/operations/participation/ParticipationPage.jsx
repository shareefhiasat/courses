import React, { useEffect, useState, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import { debug } from "@services/utils/logger";
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { RECORD_TYPES } from '@utils/sharedTypes';
import { Button, Select, useToast, AdvancedDataGrid, ProgramsSelect } from '@ui';
import { useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { DeleteModal, useDeleteModal } from '@ui';
import { createParticipation, updateParticipation, deleteParticipation, getParticipations } from '@services/business/participationService';
import { useLookupTypes } from '@hooks/useLookupTypes.js';
// OLD: import { PARTICIPATION_TYPES, PARTICIPATION_TYPE_ICONS } from '@constants/participationTypes';
// NOW: Using useLookupTypes hook for all lookup data
import { getPrograms, getSubjects, getSubject, fetchProgram } from '@services/business/programService';
import { getClasses, getClassById } from '@services/business/classService';
import { getEnrollments, getStudentsByClass } from '@services/business/enrollmentService';
import { getAllUsers, getUserById, getUsersByIds, getUserByEmail } from '@services/business/userService';
import { ACTIVITY_LOG_TYPES } from '@services/other/activityLogger';
import { formatQatarDate } from '@utils/timezone';
import { getUserStatus, getUserStatusSummary, USER_STATUS, getStatusIconProps } from '@utils/userStatus';
import { isUserDisabled, getUserId, getUserDisplayNameSync } from '@services/business/userService';
import { 
  PAGE_STATES, 
  FORM_STATES,
} from '@constants/pageTypes';
import { getThemedIcon } from '@constants/iconTypes';

const ParticipationPage = ({ isDashboardTab = false, hideActions = false }) => {
  const { user, isHR, isAdmin, isSuperAdmin, isInstructor } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const toast = useToast();
  const { data: lookupData } = useLookupTypes({
    types: ['participation-types']
  });

  // Create participation type icons from lookup data
  const PARTICIPATION_TYPE_ICONS = (lookupData['participation-types'] || []).reduce((acc, type) => {
    acc[type.id] = type.icon || 'MessageSquare';
    return acc;
  }, {});

  const [pageState, setPageState] = useState(PAGE_STATES.LOADING);
  const [formState, setFormState] = useState(FORM_STATES.IDLE);
  const [loading, setLoading] = useState(false);
  const [participations, setParticipations] = useState([]);
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
    typeId: '',
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
  const commentRef = useRef(null);
  const pointsRef = useRef(null);

  // Map frontend type IDs to database codes (same pattern as PenaltiesPage)
  const mapTypeToDatabaseCode = useCallback((frontendType) => {
    const typeMapping = {
      'explain_lesson': 'POSITIVE',
      'ask_question': 'POSITIVE',
      'answer_question': 'POSITIVE',
      'help_classmate': 'HELPFUL',
      'gave_project': 'EXCELLENT',
      'gave_paper': 'EXCELLENT',
      'gave_research': 'EXCELLENT',
      'active_discussion': 'POSITIVE',
      'answered_question': 'POSITIVE',
      'helped_classmate': 'HELPFUL',
      'excellent': 'EXCELLENT',
      'good': 'POSITIVE',
      'average': 'POSITIVE',
      'positive': 'POSITIVE',
      'helpful': 'HELPFUL',
      'participation': 'PARTICIPATED',
      'other': 'POSITIVE'
    };
    
    const dbCode = typeMapping[frontendType];
    console.log('🔍 [DEBUG] Participation mapping type:', frontendType, '→', dbCode);
    return dbCode || 'POSITIVE'; // Default to POSITIVE if not found
  }, []);

  // Sync refs when editing
  useEffect(() => {
    console.log('🔍 [DEBUG] useEffect for syncing refs triggered');
    console.log('🔍 [DEBUG] editingParticipation:', !!editingParticipation);
    console.log('🔍 [DEBUG] formData.comment:', formData.comment);
    console.log('🔍 [DEBUG] commentRef.current:', commentRef.current);
    
    if (commentRef.current) {
      console.log('🔍 [DEBUG] Setting commentRef.current.value to:', formData.comment || '');
      commentRef.current.value = formData.comment || '';
    }
    if (pointsRef.current) pointsRef.current.value = formData.points || 1;
  }, [editingParticipation, formData.comment, formData.points]);

  // Read text values from refs into form state before submit
  const syncRefsToState = useCallback(() => {
    return {
      comment: commentRef.current?.value ?? formData.comment,
      points: parseInt(pointsRef.current?.value) || formData.points || 1
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
  const filteredEnrollmentsForSelect = useMemo(() => {
    if (isHR || isAdmin || isSuperAdmin) {
      return enrollments; // HR/Admins see all students
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
  }, [enrollments, classes, user?.uid, user?.email, isHR, isAdmin, isSuperAdmin, isInstructor]);

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
      debug(t('participation_failed_to_load_data'), error);
    }
  }, []);

  const loadParticipations = useCallback(async (isInitial = false) => {
    if (!isInitial) setLoading(true);
    try {
      const result = await getParticipations();
      
      if (result.success) {
        // DEBUG: Log existing participation types and their codes
        const existingTypes = result.data?.map(p => ({
          id: p.typeId,
          code: p.participationType?.code,
          nameEn: p.participationType?.nameEn,
          nameAr: p.participationType?.nameAr
        })).filter(Boolean);
        
        console.log('🔍 [DEBUG] Existing participation types in database:');
        existingTypes.forEach(type => {
          console.log(`  - ID: ${type.id}, Code: ${type.code}, Name: ${type.nameEn}`);
        });
        
        console.log('🔍 [DEBUG] Sample participation:', result.data?.[0]);
        
        setParticipations(result.data || []);
      } else {
        toast.error(result.error || 'Failed to load participations');
        return;
      }

      let data = result.data || [];

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
          
          // Fix 1: Use userId instead of studentId, and use pre-populated user object
          if (enrichedParticipation.userId && enrichedParticipation.user) {
            // Use the pre-populated user object from API
            const user = enrichedParticipation.user;
            enrichedParticipation.studentName = user.displayName || user.realName || user.email || 'N/A';
            enrichedParticipation.studentEmail = user.email;
            enrichedParticipation.studentId = enrichedParticipation.userId; // Set studentId for grid
          } else if (enrichedParticipation.userId) {
            // Fallback: fetch user data if user object is missing
            try {
              const studentData = await fetchUser(enrichedParticipation.userId);
              if (studentData) {
                enrichedParticipation.studentName = studentData.displayName || studentData.email || 'N/A';
                enrichedParticipation.studentEmail = studentData.email;
                enrichedParticipation.studentId = enrichedParticipation.userId;
              }
            } catch (err) {
              debug('Failed to fetch student:', err);
            }
          }
          
          if (enrichedParticipation.classId) {
            try {
              const classData = await fetchClass(enrichedParticipation.classId);
              if (classData) {
                enrichedParticipation.className = classData.name || classData.code || 'N/A';
                enrichedParticipation.classTerm = classData.term;
                // If subjectId is missing, try to get it from class
                if (!enrichedParticipation.subjectId && classData.subjectId) {
                  enrichedParticipation.subjectId = classData.subjectId;
                }
              }
            } catch (err) {
            }
          }
          
          // Load subject from participation or class
          const subjectIdToLoad = enrichedParticipation.subjectId;
          if (subjectIdToLoad) {
            try {
              const subjectData = await fetchSubjectData(subjectIdToLoad);
              if (subjectData) {
                enrichedParticipation.subjectName = lang === 'ar' 
                  ? (subjectData.nameAr || subjectData.nameEn || subjectData.code || 'N/A')
                  : (subjectData.nameEn || subjectData.nameAr || subjectData.code || 'N/A');
                
                // Load program from subject
                if (subjectData.programId) {
                  try {
                    const programData = await fetchProgram(subjectData.programId);
                    if (programData) {
                      // Fix 2: Handle both response formats
                      const program = programData.data || programData;
                      enrichedParticipation.programName = lang === 'ar'
                        ? (program.nameAr || program.nameEn || program.code || 'N/A')
                        : (program.nameEn || program.nameAr || program.code || 'N/A');
                    } else {
                      enrichedParticipation.programName = 'N/A';
                    }
                  } catch (err) {
                    enrichedParticipation.programName = 'N/A';
                  }
                } else {
                  enrichedParticipation.programName = 'N/A';
                }
              }
            } catch (err) {
            }
          }
          
          // Add created by and updated by display fields
          enrichedParticipation.createdByDisplay = (() => {
            if (enrichedParticipation.creator?.displayName) {
              return enrichedParticipation.creator.displayName;
            }
            if (enrichedParticipation.createdBy) {
              // Search in all users (students array contains all users)
              const creatorUser = students.find(u => (u.docId || u.id) === enrichedParticipation.createdBy || (u.docId || u.id) === parseInt(enrichedParticipation.createdBy));
              if (creatorUser) {
                return creatorUser.displayName || creatorUser.realName || creatorUser.email;
              }
              // Search in userCache as fallback
              const cachedUser = userCache[enrichedParticipation.createdBy];
              if (cachedUser) {
                return cachedUser.displayName || cachedUser.realName || cachedUser.email;
              }
              return `ID: ${enrichedParticipation.createdBy}`;
            }
            return '—';
          })();
          
          enrichedParticipation.updatedByDisplay = (() => {
            if (enrichedParticipation.updater?.displayName) {
              return enrichedParticipation.updater.displayName;
            }
            if (enrichedParticipation.updatedBy) {
              // Search in all users (students array contains all users)
              const updaterUser = students.find(u => (u.docId || u.id) === enrichedParticipation.updatedBy || (u.docId || u.id) === parseInt(enrichedParticipation.updatedBy));
              if (updaterUser) {
                return updaterUser.displayName || updaterUser.realName || updaterUser.email;
              }
              // Search in userCache as fallback
              const cachedUser = userCache[enrichedParticipation.updatedBy];
              if (cachedUser) {
                return cachedUser.displayName || cachedUser.realName || cachedUser.email;
              }
              return `ID: ${enrichedParticipation.updatedBy}`;
            }
            return '—';
          })();
          
          } catch (err) {
          debug('Failed to enrich participation:', enrichedParticipation.id || enrichedParticipation.docId, err);
        }
        return enrichedParticipation;
      }));
      

      // Create a new array to ensure React detects the change
      setParticipations([...enriched]);
    } catch (error) {
      debug(t('participation_failed_to_load_participations'), error);
      toast.error(t('failed_to_save_participation') + ': ' + error.message);
    } finally {
      if (!isInitial) setLoading(false);
    }
  }, [toast, t, fetchUser, fetchClass, fetchSubjectData, lang]);

  // Use GlobalLoading for initial data load
  useLayoutEffect(() => {
    if (!isHR && !isAdmin && !isSuperAdmin && !isInstructor) return;

    let stopLoading = null;

    const initialLoad = async () => {
      stopLoading = startLoading({ message: t('participation_loading_participations') });
      await Promise.all([loadData(), loadParticipations(true)]);
      if (stopLoading) stopLoading();
      setLoading(false);
      
      // Log page view after load
      try {
        debug('🔍 PARTICIPATION VIEWING LOG - About to log activity:', {
          timestamp: new Date(),
          timestampUTC: new Date().toISOString(),
          userTime: new Date().toLocaleString(),
          qatarTime: new Date().toLocaleString('en-US', { timeZone: 'Asia/Qatar' }),
          userId: user?.uid,
          userEmail: user?.email,
          activityType: ACTIVITY_LOG_TYPES.PARTICIPATION_VIEWED
        });
        debug('✅ PARTICIPATION VIEWING LOG - Activity logged successfully');
      } catch (e) {
        debug('❌ PARTICIPATION VIEWING LOG - Error logging activity:', e);
      }
    };

    initialLoad();

    return () => {
      if (stopLoading) stopLoading();
    };
  }, [isHR, isAdmin, isSuperAdmin, isInstructor]); // Remove loadData and loadParticipations to prevent infinite loop

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    
    // Early validation - check if form is properly filled
    if (!formData.studentId || !formData.type) {
      setTimeout(() => {
        toast.error(t('participation.select_student_and_type', 'Please select a student and participation type'));
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
        toast.error(t('participation.user_info_failed', 'Failed to get user information'));
        return;
      }
      
      const participationData = {
        userId: formData.studentId, // Backend expects userId, not studentId
        classId: formData.classId,
        subjectId: subjectId,
        programId: formData.programId,
        type: mapTypeToDatabaseCode(formData.type), // Apply type mapping
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
      console.log('🔍 [DEBUG] Participation data being sent:', participationData);
      console.log('🔍 [DEBUG] Available participation types:', (lookupData['participation-types'] || []).map(pt => pt.id));
      console.log('🔍 [DEBUG] userId value:', userId);
      console.log('🔍 [DEBUG] userId type:', typeof userId);
      console.log('🔍 [DEBUG] formData.studentId:', formData.studentId);
      console.log('🔍 [DEBUG] formData.studentId type:', typeof formData.studentId);

      let result;
      if (editingParticipation) {
        // For updates, use the original participation type code if the type hasn't changed
        let typeToSend = mapTypeToDatabaseCode(formData.type);
        
        console.log('🔍 [DEBUG] Original participation participationType:', editingParticipation.participationType);
        console.log('🔍 [DEBUG] Original participation typeId:', editingParticipation.typeId);
        console.log('🔍 [DEBUG] Form type:', formData.type);
        console.log('🔍 [DEBUG] Mapped type code:', typeToSend);
        
        // If the form type is 'other' (meaning unknown type), preserve the original type code
        if (formData.type === 'other' && editingParticipation.participationType?.code) {
          typeToSend = editingParticipation.participationType.code;
          console.log('🔍 [DEBUG] Form type is "other", using original participation type code:', typeToSend);
        } else {
          console.log('🔍 [DEBUG] Using mapped type code:', typeToSend);
        }
        
        console.log('🔍 [DEBUG] Final type to send:', typeToSend);
        
        console.log('🔍 [DEBUG] Updating participation with data:', {
          userId: participationData.userId,
          classId: participationData.classId,
          subjectId: participationData.subjectId,
          type: typeToSend, // Use determined type code
          description: '',
          feedback: '',
          points: participationData.points,
          comment: participationData.comment,
          programId: participationData.programId
        });
        
        console.log('🔍 [DEBUG] Actual data sent to updateParticipation:', {
          userId: participationData.userId,
          classId: participationData.classId,
          subjectId: participationData.subjectId,
          type: typeToSend,
          description: '',
          feedback: '',
          points: participationData.points,
          comment: participationData.comment,
          programId: participationData.programId
        });
        
        result = await updateParticipation(editingParticipation.docId || editingParticipation.id, {
          userId: participationData.userId, // Backend expects userId
          classId: participationData.classId,
          subjectId: participationData.subjectId,
          type: typeToSend, // Use determined type code
          description: '', // Empty since removed
          feedback: '', // Empty since removed
          points: participationData.points,
          comment: participationData.comment,
          programId: participationData.programId
        });
              } else {
        // For create, map frontend type to database code
        const dbTypeCode = mapTypeToDatabaseCode(formData.type);
        
        console.log('🔍 [DEBUG] Creating participation with mapped type:', dbTypeCode);
        console.log('🔍 [DEBUG] Original create data:', participationData);
        
        // Create a new object with the mapped type
        const createData = {
          ...participationData,
          type: dbTypeCode // Use mapped database code
        };
        
        console.log('🔍 [DEBUG] Final create data:', createData);
        
        result = await createParticipation(createData);
              }

      if (result.success) {
        toast.success(editingParticipation ? t('participation_updated') : t('participation_recorded'));
        setEditingParticipation(null);
        resetForm();
        loadParticipations();
      } else {
        toast.error(result.error || 'Operation failed');
      }
    } catch (error) {
      toast.error(t('failed_to_save_participation') + ': ' + error.message);
    } finally {
      setSaving(false);
    }
  }, [formData, editingParticipation, loadParticipations, setSaving, fetchClass, syncRefsToState, user, mapTypeToDatabaseCode]);

  const handleEdit = useCallback((participation) => {
    console.log('🔍 [DEBUG] handleEdit called with participation:', participation);
    console.log('🔍 [DEBUG] participation.type:', participation.type);
    console.log('🔍 [DEBUG] participation.typeId:', participation.typeId);
    console.log('🔍 [DEBUG] participation.participationType:', participation.participationType);
    console.log('🔍 [DEBUG] Available types:', (lookupData['participation-types'] || []).map(pt => pt.id));
    
    setEditingParticipation(participation);
    
    // Fix: Map participationType.code to lowercase type ID, handling unknown types
    const participationTypeCode = participation.participationType?.code?.toLowerCase();
    
    // Check if this type exists in our frontend constants
    const frontendType = (lookupData['participation-types'] || []).find(pt => pt.id === participationTypeCode);
    const mappedType = frontendType ? participationTypeCode : 'other'; // Default to 'other' for unknown types
    
    console.log('🔍 [DEBUG] participationTypeCode:', participationTypeCode);
    console.log('🔍 [DEBUG] frontendType found:', !!frontendType);
    console.log('🔍 [DEBUG] Mapped participation type:', mappedType);
    
    const newFormData = {
      programId: participation.programId || '',
      studentId: participation.studentId || '',
      classId: participation.classId || '',
      subjectId: participation.subjectId || '',
      type: mappedType, // Fix: Use mapped type from participationType.code
      points: participation.points || 1,
      comment: participation.comment || ''
    };
    
    console.log('🔍 [DEBUG] Setting formData to:', newFormData);
    setFormData(newFormData);
  }, []);

  const handleDelete = useCallback((participation) => {
    deleteEntity('participation', participation, async () => {
      setParticipations(prev => prev.filter(p => (p.docId || p.id) !== (participation.docId || participation.id)));
      try {
        const result = await deleteParticipation(participation.id || participation.docId);
        if (!result.success) {
          throw new Error(result.error);
        }
        toast.success(t('participation_deleted') || 'Participation deleted successfully');
        await loadParticipations();
      } catch (error) {
        setParticipations(prev => [...prev, participation]);
        toast.error(error.message);
      }
    });
  }, [deleteEntity, loadParticipations]);

  const resetForm = () => {
    setFormData({
      programId: '',
      studentId: '',
      classId: '',
      subjectId: '',
      typeId: '',
      points: 1,
      comment: ''
    });
    // Clear refs
    if (commentRef.current) commentRef.current.value = '';
    if (pointsRef.current) pointsRef.current.value = '1';
    setEditingParticipation(null);
  };

  // Filter participations based on selected filters
  const filteredParticipations = participations.filter(participation => {
    if (programFilter) {
      const subject = subjects.find(s => (s.docId || s.id) === participation.subjectId);
      if (!subject || subject.programId !== programFilter) return false;
    }
    if (subjectFilter && participation.subjectId !== subjectFilter) return false;
    if (classFilter && participation.classId !== classFilter) return false;
    if (typeFilter !== 'all' && participation.type !== typeFilter) return false;
    if (studentFilter && participation.studentId !== studentFilter) return false;
    return true;
  });

  const columns = useMemo(() => [
    {
      field: 'studentName',
      headerName: t('participation_user'),
      flex: 1,
      minWidth: 200,
      renderCell: (params) => {
        const row = params?.row || {};
        const rowId = row.id || row.docId || params?.id;
        
        
        // Get studentName and studentEmail from row first
        let studentName = row.studentName || params?.value;
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
        
        // If not available, try to get from participations state
        if (!studentName && rowId) {
          const foundRow = participations.find(p => (p.id || p.docId) === rowId);
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
      headerName: t('participation_class'),
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
          const classTerm = row.classTerm;
          if (classTerm) text += ` (${classTerm})`;
          return text;
        }
        return 'N/A';
      }
    },
    {
      field: 'typeId',
      headerName: t('participation_type'),
      width: 180,
      renderCell: (params) => {
        // Try to get the participationType object from the row data first
        const row = params.row;
        let typeName = params.value; // Default to the numeric value
        
        if (row.participationType) {
          // Use the participationType object from the enriched data
          typeName = lang === 'ar' ? row.participationType.nameAr : row.participationType.nameEn;
        } else if (row.type) {
          // Fallback: try to find by frontend type ID
          const participationType = (lookupData['participation-types'] || []).find(pt => pt.id === row.type);
          typeName = participationType ? (lang === 'ar' ? (participationType.nameAr || participationType.nameEn) : participationType.nameEn) : row.type;
        } else {
          // Final fallback: try to match numeric typeId with frontend types (index-based)
          const typeIndex = parseInt(params.value) - 1; // Assuming IDs start from 1
          const participationTypesArray = lookupData['participation-types'] || [];
          const participationType = participationTypesArray[typeIndex];
          typeName = participationType ? (lang === 'ar' ? (participationType.nameAr || participationType.nameEn) : participationType.nameEn) : params.value;
        }
        
        return typeName || params.value;
      }
    },
    {
      field: 'points',
      headerName: t('participation_points'),
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
        // Try to get from row first, then from params.value, then from participations state
        let programName = row.programName || params?.value;
        if (!programName && rowId) {
          const foundRow = participations.find(p => (p.id || p.docId) === rowId);
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
        // Try to get from row first, then from params.value, then from participations state
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
        
        // Final fallback from participations state
        if (!subjectName && rowId) {
          const foundRow = participations.find(p => (p.id || p.docId) === rowId);
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
    {
      field: 'createdAt',
      headerName: t('participation_date'),
      width: 150,
      valueGetter: (params) => {
        
        // Check if params directly contains the timestamp
        if (params && typeof params === 'object' && params.seconds) {
          const date = new Date(params.seconds * 1000);
          return formatQatarDate(date, "MMM dd, yyyy 'at' h:mm:ss a");
        }
        
        // Check if params.value directly contains the timestamp
        if (params.value && typeof params.value === 'object' && params.value.seconds) {
          const date = new Date(params.value.seconds * 1000);
          return formatQatarDate(date, "MMM dd, yyyy 'at' h:mm:ss a");
        }
        
        // Fallback to original logic
        if (!params.row.createdAt) {
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
          return 'Invalid Date';
        }
        const formattedDate = formatQatarDate(date, "MMM dd, yyyy 'at' h:mm:ss a");
        return formattedDate;
      }
    },
    {
      field: 'createdByDisplay',
      headerName: t('created_by') || 'Created By',
      width: 150,
      renderCell: (params) => {
        const value = params.value;
        return value || '—';
      }
    },
    {
      field: 'updatedByDisplay', 
      headerName: t('updated_by') || 'Updated By',
      width: 150,
      renderCell: (params) => {
        const value = params.value;
        return value || '—';
      }
    },
    ...(hideActions ? [] : [{
      field: 'actions',
      headerName: t('participation_actions'),
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
            {t('participation_edit')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={getThemedIcon('ui', 'trash', 16, theme)}
            onClick={() => handleDelete(params.row)}
            style={{ color: '#dc2626' }}
          >
            {t('participation_delete')}
          </Button>
        </div>
      )
    }])
  ], [theme, lang, t, handleEdit, handleDelete, hideActions, subjects, participations, students, userCache]);

  return (
    <div>
      {/*<div style={{ marginBottom: '12px' }}>*/}
      {/*  <h1 style={{ margin: 0, fontSize: '1.5rem' }}>HR Participations</h1>*/}
      {/*</div>*/}

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
          {getThemedIcon('ui', 'edit', 16, theme)} {t('editing_participation', { participationType: (lookupData['participation-types'] || []).find(pt => pt.id === editingParticipation.type)?.nameEn || editingParticipation.type }) || `Editing Participation: ${(lookupData['participation-types'] || []).find(pt => pt.id === editingParticipation.type)?.nameEn || editingParticipation.type}`}
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
              { value: '', label: t('participation_select_student') },
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
                    displayLabel: getUserDisplayNameSync(u),
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
                          {u.displayName || u.realName || u.email || t('participation_unknown_student')}
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
              { value: '', label: t('participation_select_type') },
              ...(lookupData['participation-types'] || []).map(pt => ({ value: pt.id, label: lang === 'ar' ? (pt.nameAr || pt.nameEn) : pt.nameEn, icon: PARTICIPATION_TYPE_ICONS[pt.id] }))
            ]}
            placeholder={t('select_participation_type')}
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
            placeholder={t('participation_enter_points')}
            min={-10}
            max={10}
            step={1}
            className="dashboard-input"
            style={{ width: '100%' }}
          />
        </div>
        <div className="form-actions">
          <Button type="submit" variant="primary" loading={saving}>
            {editingParticipation ? t('participation_edit_participation') : t('participation_add_participation')}
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
                      displayLabel: getUserDisplayNameSync(u),
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
                            {u.displayName || u.realName || u.email || t('participation_unknown_student')}
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
                { value: 'all', label: t('participation_all_types') },
                ...(lookupData['participation-types'] || []).map(pt => ({ value: pt.id, label: lang === 'ar' ? (pt.nameAr || pt.nameEn) : pt.nameEn, icon: PARTICIPATION_TYPE_ICONS[pt.id] }))
              ]}
              placeholder={t('type') || 'Type'}
            />
          </div>
        </div>
      </div>

      {filteredParticipations.length !== participations.length && (
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
          {t('showing_filtered') || 'Showing'} {filteredParticipations.length} {t('of') || 'of'} {participations.length} {t('participations') || 'Participations'}
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
          {getThemedIcon('ui', 'alert_circle', 16, theme)}
          {t('total') || 'Total'} {participations.length}
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
          {new Set(participations.map(p => p.studentId)).size} {t('students') || 'Students'}
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
          {participations.filter(p => (p.points || 0) > 0).reduce((sum, p) => sum + (p.points || 0), 0)} {t('participation_positive')}
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
          {participations.filter(p => (p.points || 0) < 0).reduce((sum, p) => sum + (p.points || 0), 0)} {t('participation_negative')}
        </div>
        
        {/* Type-specific counter chips */}
        {(lookupData['participation-types'] || []).map(pt => {
          const count = participations.filter(p => p.type === pt.id).length;
          if (count === 0) return null;
          return (
            <div key={pt.id} style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              padding: '0.5rem 0.75rem', 
              background: '#fef3c7', 
              border: '1px solid #fde68a', 
              borderRadius: '9999px',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#92400e'
            }}>
              {PARTICIPATION_TYPE_ICONS[pt.id]}
              {count} {lang === 'ar' ? pt.label_ar : pt.label_en}
            </div>
          );
        })}
      </div>

      <div>
        <AdvancedDataGrid
          rows={filteredParticipations}
          columns={columns}
          pageSize={10}
          pageSizeOptions={[10, 25, 50, 100]}
          checkboxSelection
          disableRowSelectionOnClick
          exportFileName="participations"
          showExportButton
          exportLabel={t('export') || 'Export'}
          loadingOverlayMessage={loading ? t('participation_loading_participations_overlay') : undefined}
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

export default ParticipationPage;
