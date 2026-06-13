import React, { useState, useEffect, useMemo, useCallback, useRef, useLayoutEffect } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useAuth } from '@contexts/AuthContext';
import { useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { getThemedIcon } from '@constants/iconTypes';
import { info, error, warn, debug } from '@services/utils/logger.js';
import { formatQatarStandard } from '@utils/qatarDate';
import { addClass, updateClass, deleteClass, getClasses } from '@services/business/classService';
import { getPrograms, getSubjects } from '@services/business/programService';
import { getAllClassrooms } from '@services/business/classroomService';
import { getUsers } from '@services/business/userService';
import { getEnrollments } from '@services/business/enrollmentService';
import { getActivities } from '@services/business/activitiesService';
import { logActivity, ACTIVITY_LOG_TYPES } from '@services/other/activityLogger.jsx';
import { getUserDisplayProps } from '@utils/userDisplayUtils.js';
import { ROLE_STRINGS } from '@utils/userUtils';
import { isAdmin, isInstructor, isSuperAdmin } from '@services/business/userService';
import { makeCurrentUserSuperAdminAndInstructor } from '@utils/userRoleManager';
import { 
  Button, 
  Input, 
  Select, 
  AdvancedDataGrid, 
  useToast, 
  YearSelect,
  UserSelect
} from '@ui';
import { DeleteModal, useDeleteModal } from '@ui';
import { ProgramsSelect } from '@ui';

const ClassesPage = () => {
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const { user } = useAuth();
  const uiToast = useToast();
  
  // Main data state
  const [classes, setClasses] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredInstructorUsers, setFilteredInstructorUsers] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [activities, setActivities] = useState([]);
  
  // Form state
  const [classForm, setClassForm] = useState({ id: '', nameEn: '', nameAr: '', code: '', term: '', year: '', locationEn: '', locationAr: '', descriptionEn: '', descriptionAr: '', ownerEmail: '', instructorId: '', substituteInstructorId: '', classroomId: '', subjectId: '', programId: '', classId: '', maxCapacity: '' });
  const [editingClass, setEditingClass] = useState(null);
  const { deleteModal, deleteClass: deleteClassModal, handleDeleteConfirm, hideDeleteModal } = useDeleteModal(t);
  
  // Refs for performance
  const nameRef = useRef(null);
  const nameArRef = useRef(null);
  const codeRef = useRef(null);
  const locationEnRef = useRef(null);
  const locationArRef = useRef(null);
  const descriptionEnRef = useRef(null);
  const descriptionArRef = useRef(null);
  const capacityRef = useRef(null);
  
  // Filter state
  const [classProgramFilter, setClassProgramFilter] = useState('');
  const [classSubjectFilter, setClassSubjectFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [classInstructorFilter, setClassInstructorFilter] = useState('');
  const [classTermFilter, setClassTermFilter] = useState('');
  const [classYearFilter, setClassYearFilter] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const { startLoading } = useGlobalLoading();

  const toast = useMemo(() => ({
    showSuccess: uiToast.success,
    showError: uiToast.error,
    showInfo: uiToast.info,
  }), [uiToast.success, uiToast.error, uiToast.info]);

  // Load all data
  const loadData = useCallback(async (isInitial = false) => {
    if (!isInitial) setLoading(true);
    try {
      const [classesRes, programsRes, subjectsRes, classroomsRes, usersRes, enrollmentsRes, activitiesRes] = await Promise.all([
        getClasses(),
        getPrograms(),
        getSubjects(),
        getAllClassrooms(),
        getUsers(),
        getEnrollments(),
        getActivities()
      ]);
      
      console.log('🔍 [ClassesPage] API Response - subjectsRes:', subjectsRes);
      
      if (classesRes?.success) setClasses(classesRes.data || []);
      if (programsRes?.success) setPrograms(programsRes.data || []);
      if (subjectsRes?.success) setSubjects(subjectsRes.data || []);
      if (classroomsRes?.success) setClassrooms(classroomsRes.data || []);
      if (usersRes?.success) {
        const usersArray = Array.isArray(usersRes.data) ? usersRes.data : [];
        setUsers(usersArray);
        
        // Debug: Log all users to see their structure
        info('🔍 [ClassesPage] All users loaded:', { 
          totalUsers: usersArray.length, 
          sampleUsers: usersArray.slice(0, 3).map(u => ({
            id: u.id,
            email: u.email,
            displayName: u.displayName,
            roleAssignments: u.roleAssignments,
            roles: u.roles,
            realm_access: u.realm_access,
            resource_access: u.resource_access
          }))
        });
        
        // Filter instructor users using centralized utilities (FLAG ONLY)
        const instructorUsers = usersArray.filter(u => {
          const isInstructorRole = isSuperAdmin(u) || isInstructor(u);
          info('🔍 [ClassesPage] Checking user for instructor role:', {
            userId: u.id,
            email: u.email,
            displayName: u.displayName,
            isInstructorRole,
            isSuperAdmin: isSuperAdmin(u),
            isAdmin: isAdmin(u),
            isInstructor: isInstructor(u),
            roleAssignments: u.roleAssignments,
            roles: u.roles
          });
          return isInstructorRole;
        });
        
        info('🔍 [ClassesPage] Filtered instructor users:', {
          totalInstructors: instructorUsers.length,
          instructors: instructorUsers.map(u => ({
            id: u.id,
            email: u.email,
            displayName: u.displayName
          }))
        });
        
        setFilteredInstructorUsers(instructorUsers || []);
      }
      
      // If no users loaded but we have current user, add them as instructor
      if ((!usersRes?.success || !usersRes.data?.length) && user) {
        const currentUserAsInstructor = {
          id: user.id,
          email: user.email,
          displayName: user.displayName || user.name || user.email,
          // Add role flags based on user roles
          isSuperAdmin: user.realm_access?.roles?.includes('super-admin') || false,
          isAdmin: user.realm_access?.roles?.includes('admin') || false,
          isInstructor: user.realm_access?.roles?.includes('instructor') || false
        };
        
        // Only add if user has instructor-like roles
        if (currentUserAsInstructor.isSuperAdmin || currentUserAsInstructor.isInstructor) {
          setFilteredInstructorUsers([currentUserAsInstructor]);
        }
      }
      
      // Additional fallback: If no instructors found but we have users, try to detect instructors differently
      if (usersRes?.success && usersRes.data?.length > 0) {
        const usersArray = Array.isArray(usersRes.data) ? usersRes.data : [];
        
        // Debug: Log all users to see their structure
        info('🔍 [ClassesPage] All users for instructor detection:', { 
          totalUsers: usersArray.length, 
          users: usersArray.map(u => ({
            id: u.id,
            email: u.email,
            displayName: u.displayName,
            roleAssignments: u.roleAssignments,
            detectedRoles: u.roleAssignments?.map(ra => ra.role?.code) || []
          }))
        });
        
        const instructorUsers = usersArray.filter(u => {
          // Try multiple detection methods
          const method1 = isSuperAdmin(u) || isInstructor(u);

          // Method 2: Check roleAssignments directly
          const method2 = u.roleAssignments && Array.isArray(u.roleAssignments) &&
            u.roleAssignments.some(ra =>
              ra.role && (ra.role.code === 'instructor' || ra.role.code === 'super_admin')
            );

          // Method 3: Check for instructor-like email or display name patterns
          const method3 = u.email && (
            u.email.includes('instructor') ||
            u.email.includes('teacher')
          );

          // Method 4: Specific known instructor users (temporary fix)
          const method4 = u.email === 'instructor@instructor.com';

          const isInstructorRole = method1 || method2 || method3 || method4;
          
          if (!method1 && (method2 || method3 || method4)) {
            warn('🔍 [ClassesPage] Instructor detected by fallback method:', {
              userId: u.id,
              email: u.email,
              displayName: u.displayName,
              method1,
              method2,
              method3,
              method4,
              roleAssignments: u.roleAssignments
            });
          }
          
          return isInstructorRole;
        });
        
        if (instructorUsers.length > 0) {
          info('🔍 [ClassesPage] Found instructors via fallback:', {
            totalInstructors: instructorUsers.length,
            instructors: instructorUsers.map(u => ({
              id: u.id,
              email: u.email,
              displayName: u.displayName
            }))
          });
          setFilteredInstructorUsers(instructorUsers);
        } else {
          warn('🔍 [ClassesPage] No instructors found even with fallback methods');
        }
      }
      if (enrollmentsRes?.success) setEnrollments(enrollmentsRes.data || []);
      if (activitiesRes?.success) setActivities(activitiesRes.data || []);
    } catch (errorData) {
      error('🔍 [ClassesPage] Error loading data:', errorData);
      toast?.showError(t('classes_failed_to_load_data'));
    } finally {
      if (!isInitial) setLoading(false);
    }
  }, [t, toast]);

  // Load data on mount with Global Loading
  useLayoutEffect(() => {
    let stopLoading = null;

    const initialLoad = async () => {
      stopLoading = startLoading({ message: t('loading_classes') || 'Loading classes...' });
      await loadData(true);
      if (stopLoading) stopLoading();
      setLoading(false);
    };

    initialLoad();

    return () => {
      if (stopLoading) stopLoading();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Utility functions
  const handleDropdownChange = useCallback((setter, field, resetFields = []) => {
    return (value) => {
      console.log('🔍 [ClassesPage] handleDropdownChange called:', { field, value, resetFields });
      setter(prev => {
        const newState = { ...prev, [field]: value };
        resetFields.forEach(resetField => {
          newState[resetField] = '';
        });
        console.log('🔍 [ClassesPage] handleDropdownChange new state:', newState);
        return newState;
      });
    };
  }, []);

  const syncRefsToState = useCallback(() => {
    const textValues = {
      nameEn: nameRef.current?.value ?? classForm.nameEn,
      nameAr: nameArRef.current?.value ?? classForm.nameAr,
      code: codeRef.current?.value ?? classForm.code,
      locationEn: locationEnRef.current?.value ?? classForm.locationEn,
      locationAr: locationArRef.current?.value ?? classForm.locationAr,
      descriptionEn: descriptionEnRef.current?.value ?? classForm.descriptionEn,
      descriptionAr: descriptionArRef.current?.value ?? classForm.descriptionAr,
      maxCapacity: capacityRef.current?.value ?? classForm.maxCapacity
    };
    return textValues;
  }, [classForm]);
  
  // Clear filters
  const handleClearFilters = () => {
    setClassProgramFilter('');
    setClassSubjectFilter('');
    setClassFilter('');
  };

  const handleClassSubmit = useCallback(async (e) => {
    e.preventDefault();
    console.time('[PERF] handleClassSubmit');
    
    // Sync refs
    const textValues = syncRefsToState();
    
    if (!textValues.nameEn.trim()) {
      toast?.showError(t('classes_name_required'));
      return;
    }

    if (!classForm.programId) {
      toast?.showError(t('program_required') || 'Program is required');
      return;
    }

    if (!classForm.subjectId) {
      toast?.showError(t('subject_required') || 'Subject is required');
      return;
    }

    const classData = {
      ...classForm,
      ...textValues
    };

    // Clean up data before sending to API
    if (classData.maxCapacity === '' || classData.maxCapacity === null) {
      classData.maxCapacity = null;
    } else {
      classData.maxCapacity = parseInt(classData.maxCapacity, 10);
    }

    // Convert ID fields from strings to integers
    if (classData.programId) {
      classData.programId = parseInt(classData.programId, 10);
    }
    if (classData.subjectId) {
      classData.subjectId = parseInt(classData.subjectId, 10);
    }
    if (classData.instructorId) {
      classData.instructorId = parseInt(classData.instructorId, 10);
    }
    if (classData.substituteInstructorId) {
      classData.substituteInstructorId = parseInt(classData.substituteInstructorId, 10);
    }
    if (classData.classroomId) {
      classData.classroomId = parseInt(classData.classroomId, 10);
    }

    // Add missing fields
    classData.isActive = classData.isActive !== false; // Default to true
    if (!classData.descriptionEn) classData.descriptionEn = null;
    if (!classData.descriptionAr) classData.descriptionAr = null;

    // Remove id field when updating to prevent creating new records
    if (editingClass) {
      info('🔧 [ClassesPage] Before cleanup - classData:', classData);
      delete classData.id;
      delete classData.docId; // Also remove docId if present
      info('🔧 [ClassesPage] After cleanup - classData:', classData);
    }

    setLoading(true);
    try {
      info('🚀 [ClassesPage] Calling service:', editingClass ? 'updateClass' : 'addClass');
      console.log('🚀 [ClassesPage] Service params:', {
        docId: editingClass?.docId,
        classDataKeys: Object.keys(classData),
        userData: { email: user?.email, uid: user?.uid }
      });
      
      const result = editingClass ?
        await updateClass(editingClass.id || editingClass.docId, classData, user) :
        await addClass(classData, user);

      info('📋 [ClassesPage] Service result:', result);
      info('📋 [ClassesPage] Result success:', result.success);
      info('📋 [ClassesPage] Result ID:', result.id);

      if (result.success) {
        // Log activity
        try {
          await logActivity(editingClass ? ACTIVITY_LOG_TYPES.CLASS_UPDATED : ACTIVITY_LOG_TYPES.CLASS_CREATED, {
            classId: editingClass?.docId || result.id,
            className: textValues.nameEn,
            classCode: textValues.code,
            subjectId: classForm.subjectId
          });
        } catch (e) { warn('Failed to log activity:', e); }
        await loadData();
        setEditingClass(null);
        setClassForm({ id: '', nameEn: '', nameAr: '', code: '', term: '', year: '', locationEn: '', locationAr: '', descriptionEn: '', descriptionAr: '', ownerEmail: '', instructorId: '', substituteInstructorId: '', classroomId: '', subjectId: '', programId: '', classId: '', maxCapacity: '' });
        // Clear refs
        if (nameRef.current) nameRef.current.value = '';
        if (nameArRef.current) nameArRef.current.value = '';
        if (codeRef.current) codeRef.current.value = '';
        if (locationEnRef.current) locationEnRef.current.value = '';
        if (locationArRef.current) locationArRef.current.value = '';
        if (descriptionEnRef.current) descriptionEnRef.current.value = '';
        if (descriptionArRef.current) descriptionArRef.current.value = '';
        if (capacityRef.current) capacityRef.current.value = '';
        toast?.showSuccess(editingClass ? t('classes_updated_successfully') : t('classes_created_successfully'));
      } else {
        toast?.showError(t('classes_error_saving', { error: result.error }));
        // Refresh grid even on error to show current state
        await loadData();
      }
    } catch (error) {
      error('Error saving class:', error);
      toast?.showError(t('classes_error_saving', { error: error.message }));
      // Refresh grid even on error to show current state
      await loadData();
    } finally {
      setLoading(false);
      console.timeEnd('[PERF] handleClassSubmit');
    }
  }, [classForm, editingClass, toast, t, syncRefsToState, loadData]);

  const handleEdit = useCallback((params) => {
    const row = params.row;
    info('🔧 [ClassesPage] handleEdit called with:', row);
    
    // Set editing state FIRST
    setEditingClass(row);
    
    // Split term into term and year if it's combined
    let term = row.term || '';
    let year = row.year || ''; // Check for separate year field first
    
    info('🔧 [ClassesPage] Edit - Raw data:', { term: row.term, year: row.year });
    
    // If no separate year field, try to extract from combined term
    if (!year && term && term.includes(' ')) {
      const termParts = term.split(' ');
      term = termParts[0] || '';
      year = termParts[1] || '';
      info('🔧 [ClassesPage] Edit - Extracted from combined:', { term, year });
    } else {
      info('🔧 [ClassesPage] Edit - Using separate fields:', { term, year });
    }
    
    setEditingClass(row);
    setClassForm({
      id: row.id,
      nameEn: row.nameEn || '',
      nameAr: row.nameAr || '',
      code: row.code || '',
      term: term,
      year: year,
      locationEn: row.locationEn || '',
      locationAr: row.locationAr || '',
      descriptionEn: row.descriptionEn || '',
      descriptionAr: row.descriptionAr || '',
      ownerEmail: row.ownerEmail || row.instructor?.email || '',
      instructorId: row.instructorId || row.instructor?.id || '',
      substituteInstructorId: row.substituteInstructorId || row.substituteInstructor?.id || '',
      classroomId: row.classroomId || row.classroom?.id || '',
      subjectId: row.subjectId || '',
      programId: row.programId || '',
      classId: row.classId || '',
      maxCapacity: row.maxCapacity || ''
    });

    info('🔧 [ClassesPage] handleEdit - editingClass set to:', row);
    console.log('🔧 [ClassesPage] handleEdit - classForm set to:', {
      id: row.id,
      nameEn: row.nameEn || '',
      nameAr: row.nameAr || '',
      code: row.code || '',
      term: term,
      year: year,
      locationEn: row.locationEn || '',
      locationAr: row.locationAr || '',
      ownerEmail: row.ownerEmail || '',
      subjectId: row.subjectId || '',
      programId: row.programId || '',
      classId: row.classId || '',
      maxCapacity: row.maxCapacity || ''
    });
    
    // Sync refs
    if (nameRef.current) nameRef.current.value = row.nameEn || '';
    if (nameArRef.current) nameArRef.current.value = row.nameAr || '';
    if (codeRef.current) codeRef.current.value = row.code || '';
    if (locationEnRef.current) locationEnRef.current.value = row.locationEn || '';
    if (locationArRef.current) locationArRef.current.value = row.locationAr || '';
    if (descriptionEnRef.current) descriptionEnRef.current.value = row.descriptionEn || '';
    if (descriptionArRef.current) descriptionArRef.current.value = row.descriptionAr || '';
    if (capacityRef.current) capacityRef.current.value = row.maxCapacity || '';
  }, []);

  const handleDelete = useCallback((params) => {
    const classItem = params.row;
    deleteClassModal(classItem, async () => {
      // Optimistic update
      setClasses(prev => prev.filter(c => (c.docId || c.id) !== (classItem.docId || classItem.id)));
      
      try {
        const classId = classItem.docId || classItem.id;
        if (!classId) {
          toast?.showError('Class ID is required');
          return;
        }
        const result = await deleteClass(classId);
        if (result.success) {
          try {
            await logActivity(ACTIVITY_LOG_TYPES.CLASS_DELETED, {
              classId: classId,
              className: classItem.nameEn,
              classCode: classItem.code
            });
          } catch (e) { warn('Failed to log activity:', e); }
          toast?.showSuccess(t('classes_deleted_successfully'));
          await loadData();
        } else {
          // Rollback
          setClasses(prev => [...prev, classItem]);
          toast?.showError(t('classes_error_deleting', { error: result.error }));
        }
      } catch (error) {
        // Rollback
        setClasses(prev => [...prev, classItem]);
        error('Error deleting class:', error);
        toast?.showError(t('classes_error_deleting', { error: error.message }));
      }
    });
  }, [deleteClassModal, toast, loadData, t]);

const handleCancelEdit = useCallback(() => {
    setEditingClass(null);
    setClassForm({ id: '', nameEn: '', nameAr: '', code: '', term: '', year: '', locationEn: '', locationAr: '', descriptionEn: '', descriptionAr: '', ownerEmail: '', instructorId: '', substituteInstructorId: '', classroomId: '', subjectId: '', programId: '', classId: '', maxCapacity: '' });
    // Clear refs
    if (nameRef.current) nameRef.current.value = '';
    if (nameArRef.current) nameArRef.current.value = '';
    if (codeRef.current) codeRef.current.value = '';
    if (locationEnRef.current) locationEnRef.current.value = '';
    if (locationArRef.current) locationArRef.current.value = '';
    if (descriptionEnRef.current) descriptionEnRef.current.value = '';
    if (descriptionArRef.current) descriptionArRef.current.value = '';
    if (capacityRef.current) capacityRef.current.value = '';
  }, []);

  const gridColumns = useMemo(() => [
    { field: 'nameEn', headerName: t('name') || 'Name', flex: 1, minWidth: 180 },
    { 
      field: 'code', 
      headerName: t('code') || 'Code', 
      width: 120,
      valueGetter: (params) => {
        const row = params?.row || {};
        const code = row.code || params?.value;
        return code || '—';
      }
    },
    {
      field: 'subjectId', headerName: t('subject') || 'Subject', flex: 1, minWidth: 180,
      valueGetter: (params) => {
        const row = params?.row || {};
        return row.subjectId || row.subject || params?.value || null;
      },
      renderCell: (params) => {
        const subjectId = params.value || params.row?.subjectId || params.row?.subject;
        if (!subjectId) return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            {t('general') || 'General'}
          </span>
        );
        const subject = subjects.find(s => (s.docId || s.id) === subjectId);
        if (!subject) return '—';
        const subjectName = lang === 'ar' 
          ? (subject.nameAr || subject.nameEn || subject.name || subjectId) 
          : (subject.nameEn || subject.nameAr || subject.name || subjectId);
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            {subjectName}
          </span>
        );
      },
      valueFormatter: (params) => {
        if (!params.value) return t('general') || 'General';
        const subject = subjects.find(s => (s.docId || s.id) === params.value);
        if (!subject) return '—';
        const subjectName = lang === 'ar' 
          ? (subject.nameAr || subject.nameEn || subject.name || params.value) 
          : (subject.nameEn || subject.nameAr || subject.name || params.value);
        return subjectName;
      }
    },
    {
      field: 'programId', headerName: t('program') || 'Program', flex: 1, minWidth: 180,
      valueGetter: (params) => {
        const row = params?.row || {};
        return row.programId || row.program || params?.value || null;
      },
      renderCell: (params) => {
        const programId = params.value || params.row?.programId || params.row?.program;
        if (!programId) return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            {t('general') || 'General'}
          </span>
        );
        const program = programs.find(p => (p.docId || p.id) === programId);
        if (!program) return '—';
        const programName = lang === 'ar' 
          ? (program.nameAr || program.nameEn || program.name || programId) 
          : (program.nameEn || program.nameAr || program.name || programId);
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            {programName}
          </span>
        );
      },
      valueFormatter: (params) => {
        if (!params.value) return t('general') || 'General';
        const program = programs.find(p => (p.docId || p.id) === params.value);
        if (!program) return '—';
        const programName = lang === 'ar' 
          ? (program.nameAr || program.nameEn || program.name || params.value) 
          : (program.nameEn || program.nameAr || program.name || params.value);
        return programName;
      }
    },
    { 
      field: 'term', 
      headerName: t('term') || 'Term', 
      width: 140,
      valueGetter: (params) => {
        const term = params.value || params.row?.term;
        if (!term) return null;
        // Extract term part (Fall, Spring, etc.) from "Fall 2025"
        const termParts = term.split(' ');
        return termParts[0] || term;
      },
      renderCell: (params) => {
        const term = params.value || params.row?.term;
        if (!term) return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted, #6b7280)' }}>
            {getThemedIcon('ui', 'calendar', 16, theme)} —
          </span>
        );
        // Extract term part (Fall, Spring, etc.) from "Fall 2025"
        const termParts = term.split(' ');
        const termName = termParts[0] || term;
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            {getThemedIcon('ui', 'calendar', 16, theme)}
            {termName}
          </span>
        );
      }
    },
    {
      field: 'year',
      headerName: t('year') || 'Year', 
      width: 100,
      valueGetter: (params) => {
        // Check for separate year field first
        if (params.row?.year) return params.row.year;
        
        // Fallback to combined term field for backward compatibility
        const term = params.row?.term;
        if (!term) return null;
        const termParts = term.split(' ');
        return termParts[1] || null;
      },
      renderCell: (params) => {
        // Check for separate year field first
        if (params.row?.year) {
          return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              {params.row.year}
            </span>
          );
        }
        
        // Fallback to combined term field for backward compatibility
        const term = params.row?.term;
        if (!term) return '—';
        const termParts = term.split(' ');
        const year = termParts[1] || '—';
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            {year}
          </span>
        );
      }
    },
    {
      field: 'locationEn',
      headerName: t('location_english') || 'Location (English)',
      flex: 1, minWidth: 150,
      valueGetter: (params) => params.value || params.row?.locationEn || '—',
      renderCell: (params) => {
        const location = params.value || params.row?.locationEn;
        return location || '—';
      }
    },
    {
      field: 'locationAr',
      headerName: t('location_arabic') || 'Location (Arabic)',
      flex: 1, minWidth: 150,
      valueGetter: (params) => params.value || params.row?.locationAr || '—',
      renderCell: (params) => {
        const location = params.value || params.row?.locationAr;
        return location || '—';
      }
    },
    {
      field: 'descriptionEn',
      headerName: t('description_english') || 'Description (English)',
      flex: 1, minWidth: 200,
      valueGetter: (params) => params.value || params.row?.descriptionEn || '—',
      renderCell: (params) => {
        const description = params.value || params.row?.descriptionEn;
        return description || '—';
      }
    },
    {
      field: 'descriptionAr',
      headerName: t('description_arabic') || 'Description (Arabic)',
      flex: 1, minWidth: 200,
      valueGetter: (params) => params.value || params.row?.descriptionAr || '—',
      renderCell: (params) => {
        const description = params.value || params.row?.descriptionAr;
        return description || '—';
      }
    },
    {
      field: 'maxCapacity', 
      headerName: t('capacity') || 'Capacity', 
      width: 100,
      valueGetter: (params) => params.value || params.row?.maxCapacity || '—',
      renderCell: (params) => {
        const capacity = params.value || params.row?.maxCapacity;
        return capacity || '—';
      }
    },
    {
      field: 'ownerEmail', headerName: t('owner') || 'Owner', flex: 1, minWidth: 200,
      valueGetter: (params) => {
        const row = params?.row || {};
        const email = row.ownerEmail || params?.value;
        if (!email) return '—';
        const owner = users.find(u => u.email === email);
        if (owner) {
          const displayName = owner.displayName || owner.name || owner.realName || '';
          return displayName ? `${displayName} (${email})` : email;
        }
        return email;
      },
      renderCell: (params) => {
        const row = params?.row || {};
        const email = row.ownerEmail || params?.value;
        if (!email) return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted, #6b7280)' }}>
            {getThemedIcon('ui', 'user', 16, theme)} —
          </span>
        );
        const owner = users.find(u => u.email === email);
        if (owner) {
          const displayName = owner.displayName || owner.name || owner.realName || '';
          return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              {/*{getThemedIcon('ui', 'user', 16, theme)} */}
              {displayName ? `${displayName} (${email})` : email}
            </span>
          );
        }
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            {/*{getThemedIcon('ui', 'user', 16, theme)} */}
            {email}
          </span>
        );
      }
    },
    {
      field: 'createdAt',
      headerName: t('created_at') || 'Created At',
      width: 180,
      valueGetter: (params) => params.value,
      renderCell: (params) => {
        const createdAt = params.value || params.row?.createdAt;
        if (!createdAt) return '—';
        
        // If it's already a formatted string, display it directly
        if (typeof createdAt === 'string' && createdAt.includes('UTC+3')) {
          return createdAt;
        }
        
        // Otherwise, format it
        return formatQatarStandard(createdAt);
      },
      valueFormatter: (params) => {
        if (!params.value) return '—';
        
        // If it's already a formatted string, return it directly
        if (typeof params.value === 'string' && params.value.includes('UTC+3')) {
          return params.value;
        }
        
        // Otherwise, format it
        return formatQatarStandard(params.value);
      }
    },
    {
      field: 'createdBy',
      headerName: t('created_by') || 'Created By',
      width: 180,
      valueGetter: (params) => {
        const creator = params.row?.creator;
        return creator?.displayName || creator?.firstName || creator?.email || '—';
      },
      renderCell: (params) => {
        const creator = params.row?.creator;
        if (!creator) return '—';
        
        const displayProps = getUserDisplayProps(creator);
        return (
          <span title={displayProps.title} style={displayProps.style}>
            {displayProps.children}
          </span>
        );
      }
    },
    {
      field: 'updatedBy',
      headerName: t('updated_by') || 'Updated By',
      width: 180,
      valueGetter: (params) => {
        const updater = params.row?.updater;
        return updater?.displayName || updater?.firstName || updater?.email || '—';
      },
      renderCell: (params) => {
        const updater = params.row?.updater;
        if (!updater) return '—';
        
        const displayProps = getUserDisplayProps(updater);
        return (
          <span title={displayProps.title} style={displayProps.style}>
            {displayProps.children}
          </span>
        );
      }
    },
    {
      field: 'actions', headerName: t('actions') || 'Actions', width: 200, sortable: false, filterable: false,
      renderCell: (params) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button 
            size="sm" 
            variant="ghost" 
            className="editHover" 
            icon={getThemedIcon('ui', 'edit', 16, theme)} 
            onClick={() => handleEdit(params)}
          >
            Edit
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="deleteHover" 
            icon={getThemedIcon('ui', 'trash', 16, theme)} 
            style={{ color: '#dc2626' }} 
            onClick={() => handleDelete(params)}
          >
            {t('delete') || 'Delete'}
          </Button>
        </div>
      )
    }
  ], [subjects, users, theme, lang, t, handleEdit, handleDelete, programs]);

  const filteredClasses = classes.filter(classItem => {
    if (classProgramFilter && classProgramFilter !== 'all' && classItem.programId !== classProgramFilter) return false;
    if (classSubjectFilter && classSubjectFilter !== 'all' && classItem.subjectId !== classSubjectFilter) return false;
    if (classFilter && classFilter !== 'all' && classItem.docId !== classFilter) return false;
    if (classInstructorFilter && classItem.ownerEmail !== classInstructorFilter) return false;
    if (classTermFilter && !classItem.term.includes(classTermFilter)) return false;
    if (classYearFilter && !classItem.term.includes(classYearFilter)) return false;
    return true;
  });

  return (
    <div className="classes-tab">
      {editingClass && (
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
          {getThemedIcon('ui', 'edit', 16, theme)} Editing Class: {editingClass.nameEn} ({editingClass.code || 'No code'})
        </div>
      )}

      <form onSubmit={handleClassSubmit} className="dashboard-form">
        {/* Basic Info - First Row */}
        <div className="form-row">
          <Input
            ref={nameRef}
            placeholder={t('class_name')}
            defaultValue={classForm.nameEn}
            required
          />
          <Input
            ref={nameArRef}
            placeholder={t('class_name_arabic')}
            defaultValue={classForm.nameAr || ''}
            dir="rtl"
          />
          <Input
            ref={codeRef}
            placeholder={t('class_code') + ' (' + t('optional') + ')' }
            defaultValue={classForm.code}
          />
        </div>

        {/* Location & Capacity - Second Row */}
        <div className="form-row">
          <Input
            ref={locationEnRef}
            placeholder={t('location_english') || 'Location (English)'}
            defaultValue={classForm.locationEn || ''}
          />
          <Input
            ref={locationArRef}
            placeholder={t('location_arabic') || 'Location (Arabic)'}
            defaultValue={classForm.locationAr || ''}
            dir="rtl"
          />
          <Input
            ref={capacityRef}
            placeholder={t('capacity') || 'Capacity'}
            defaultValue={classForm.maxCapacity || ''}
            type="number"
            min="1"
          />
        </div>

        {/* Description Fields */}
        <div className="form-row">
          <Input
            ref={descriptionEnRef}
            placeholder={t('description_english') || 'Description (English)'}
            defaultValue={classForm.descriptionEn || ''}
          />
          <Input
            ref={descriptionArRef}
            placeholder={t('description_arabic') || 'Description (Arabic)'}
            defaultValue={classForm.descriptionAr || ''}
            dir="rtl"
          />
        </div>

        {/* Academic Info */}
        <div className="form-row">
          <ProgramsSelect
            programs={programs}
            subjects={subjects}
            classes={[]} // Pass empty array to hide class selection
            selectedProgram={classForm.programId}
            selectedSubject={classForm.subjectId}
            selectedClass=""
            onProgramChange={handleDropdownChange(setClassForm, 'programId', ['subjectId'])}
            onSubjectChange={handleDropdownChange(setClassForm, 'subjectId')}
            onClassChange={() => {}}
            showClasses={false} // Use correct prop name
            showLabels={false}
            required
          />
          <UserSelect
            users={filteredInstructorUsers}
            enrollments={enrollments}
            classes={classes}
            value={classForm.ownerEmail}
            onChange={(selectedEmail) => {
              const selectedInstructor = filteredInstructorUsers.find(u => u.email === selectedEmail);

              // Set both ownerEmail and instructorId
              setClassForm({
                ...classForm,
                ownerEmail: selectedEmail,
                instructorId: selectedInstructor ? selectedInstructor.id : ''
              });
            }}
            placeholder={t('select_instructor') + ' (' + t('optional') + ')' || 'Select Instructor (Optional)'}
            roleFilter={[]} // No filtering needed - already filtered
            includeAll={false}
            showEnrollments={true}
            showStatus={true}
            useEmailAsValue={true}
            searchable={true}
          />
          <UserSelect
            users={filteredInstructorUsers}
            enrollments={enrollments}
            classes={classes}
            value={classForm.substituteInstructorId ? filteredInstructorUsers.find(u => u.id === parseInt(classForm.substituteInstructorId))?.email : ''}
            onChange={(selectedEmail) => {
              const selectedInstructor = filteredInstructorUsers.find(u => u.email === selectedEmail);
              setClassForm({
                ...classForm,
                substituteInstructorId: selectedInstructor ? selectedInstructor.id : ''
              });
            }}
            placeholder="Substitute Instructor (Optional)"
            roleFilter={[]}
            includeAll={false}
            showEnrollments={true}
            showStatus={true}
            useEmailAsValue={true}
            searchable={true}
          />
          <Select
            searchable
            placeholder="Classroom (Optional)"
            value={classForm.classroomId || ''}
            onChange={e => setClassForm({ ...classForm, classroomId: e.target.value })}
            options={[
              { value: '', label: 'Select Classroom (Optional)' },
              ...classrooms.map(c => ({ 
                value: String(c.id), 
                label: `${c.code} - ${c.nameEn} (${c.capacity} seats)` 
              }))
            ]}
          />
        </div>
        <div className="form-row compact-cols">
          <Select
            searchable
            placeholder={t('term')}
            value={classForm.term || ''}
            onChange={e => setClassForm({ ...classForm, term: e.target.value })}
            options={[
              { value: '', label: t('term') || 'Select Term' },
              { value: 'Fall', label: t('fall') || 'Fall' },
              { value: 'Spring', label: t('spring') || 'Spring' },
              { value: 'Summer', label: t('summer') || 'Summer' }
            ]}
            required
          />
          <div style={{ width: '100%' }}>
            <YearSelect
              value={classForm.year || ''}
              onChange={e => setClassForm({ ...classForm, year: e.target.value })}
              startYear={2024}
              yearsAhead={5}
              label={null}
              placeholder={t('year') || 'Year'}
              searchable
              required
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <Button type="submit" variant="primary" loading={loading}>
            {(editingClass ? t('update') : t('save'))}
          </Button>
          {editingClass && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancelEdit}
            >
              {t('cancel') || 'Cancel'}
            </Button>
          )}
        </div>
      </form>

      {/* Filters for Classes */}
      <div className="filters-container" style={{ 
        display: 'none', 
        flexDirection: 'column',
        gap: '1rem', 
        marginBottom: '1rem', 
        background: '#f8f9fa', 
        padding: '1rem', 
        borderRadius: 12, 
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)', 
        width: '100%' 
      }}>
        <ProgramsSelect
          programs={programs}
          subjects={subjects}
          classes={classes}
          selectedProgram={classProgramFilter}
          selectedSubject={classSubjectFilter}
          selectedClass=""
          onProgramChange={(e) => {
            const programId = e?.target?.value !== undefined ? e.target.value : e;
            console.log('🔍 Classes filter program change:', { programId });
            setClassProgramFilter(programId);
          }}
          onSubjectChange={(e) => {
            const subjectId = e?.target?.value !== undefined ? e.target.value : e;
            console.log('🔍 Classes filter subject change:', { subjectId });
            setClassSubjectFilter(subjectId);
          }}
          onClassChange={() => {}}
          showClass={false}
          showLabels={false}
          style={{ width: '100%' }}
        />
        
        {/* Second row: Instructor, Term, Year filters */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Select
            value={classInstructorFilter || ''}
            onChange={(e) => setClassInstructorFilter(e.target.value)}
            options={[
              { value: '', label: lang === 'ar' ? 'جميع المدربين' : 'All Instructors', icon: getThemedIcon('ui', 'users', 16, theme) },
              ...(Array.isArray(users) ? users.filter(u => isSuperAdmin(u) || isInstructor(u)) : []).map(instructor => ({
                  value: instructor.email,
                  label: instructor.displayName || instructor.name || instructor.email,
                  icon: getThemedIcon('ui', 'user', 16, theme)
                }))
            ]}
            placeholder={lang === 'ar' ? 'جميع المدربين' : 'All Instructors'}
            style={{ minWidth: '200px' }}
          />
          
          <Select
            value={classTermFilter || ''}
            onChange={(e) => setClassTermFilter(e.target.value)}
            options={[
              { value: '', label: lang === 'ar' ? 'جميع الفصول' : 'All Terms', icon: getThemedIcon('ui', 'calendar', 16, theme) },
              { value: 'Fall', label: lang === 'ar' ? 'خريف' : 'Fall', icon: getThemedIcon('ui', 'calendar', 16, theme) },
              { value: 'Spring', label: lang === 'ar' ? 'ربيع' : 'Spring', icon: getThemedIcon('ui', 'calendar', 16, theme) },
              { value: 'Summer', label: lang === 'ar' ? 'صيف' : 'Summer', icon: getThemedIcon('ui', 'sun', 16, theme) },
              { value: 'Winter', label: lang === 'ar' ? 'شتاء' : 'Winter', icon: getThemedIcon('ui', 'moon', 16, theme) }
            ]}
            placeholder={lang === 'ar' ? 'جميع الفصول' : 'All Terms'}
            style={{ minWidth: '150px' }}
          />
          
          <Select
            value={classYearFilter || ''}
            onChange={(e) => setClassYearFilter(e.target.value)}
            options={[
              { value: '', label: lang === 'ar' ? 'جميع السنوات' : 'All Years', icon: getThemedIcon('ui', 'calendar', 16, theme) },
              ...Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return {
                  value: year.toString(),
                  label: year.toString(),
                  icon: getThemedIcon('ui', 'calendar', 16, theme)
                };
              })
            ]}
            placeholder={lang === 'ar' ? 'جميع السنوات' : 'All Years'}
            style={{ minWidth: '120px' }}
          />
        </div>
        
      </div>

      {(classProgramFilter || classSubjectFilter || classInstructorFilter || classTermFilter || classYearFilter) && (
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
          {t('showing_filtered') || 'Showing'} {filteredClasses.length} {t('of') || 'of'} {classes.length} {t('classes') || 'Classes'}
        </div>
      )}

      {/* Summary Chips */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          padding: '0.5rem 0.75rem', 
          background: '#f0f9ff', 
          border: '1px solid #bae6fd', 
          borderRadius: '9999px',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: '#0369a1'
        }}>
          {getThemedIcon('ui', 'target', 16, theme)}
          {classes.length} {lang === 'ar' ? 'إجمالي' : 'Total'}
        </div>
        <div style={{ 
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
          {getThemedIcon('ui', 'book', 16, theme)}
          {new Set(classes.map(c => c.subjectId)).size} {lang === 'ar' ? 'مواد' : 'Subjects'}
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
          {getThemedIcon('ui', 'graduation_cap', 16, theme)}
          {new Set(classes.map(c => c.programId)).size} {lang === 'ar' ? 'برامج' : 'Programs'}
        </div>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <AdvancedDataGrid
          key={classes.length} // Force re-render when classes data changes
          rows={filteredClasses}
          getRowId={(row) => row.docId || row.id}
          columns={gridColumns}
          pageSize={10}
          pageSizeOptions={[5, 10, 20, 50]}
          checkboxSelection
          exportFileName="classes"
          showExportButton
          exportLabel={t('export') || 'Export'}
          loadingOverlayMessage={loading ? "Loading classes..." : undefined}
        />
      </div>

      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={hideDeleteModal}
        onConfirm={handleDeleteConfirm}
        entityType={deleteModal.entityType}
        entityName={deleteModal.entityName}
      />
    </div>
  );
};

export default ClassesPage;
