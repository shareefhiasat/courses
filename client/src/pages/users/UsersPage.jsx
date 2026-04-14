import React, { useState, useEffect, useMemo, useCallback, useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@contexts/ThemeContext';
import { useLang } from '@contexts/LangContext';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@ui';
import { info, error, warn, debug } from '@services/utils/logger.js';
import { getQatarTimeAgo, formatQatarDate } from '@utils/timezone';
import { getThemedIcon } from '@constants/iconTypes';
import MultiSelect from '@components/ui/MultiSelect';
import { ROLE_STRINGS } from '@utils/userUtils';
import { ACTIVITY_LOG_TYPES } from '@services/other/activityLogger';
import { Button, Input, Select, ToggleSwitch, AdvancedDataGrid, Card, CardBody, ConfirmModal } from '@ui';
import { DeleteModal, useDeleteModal } from '@ui';
import { QREmailModal, useQREmailModal } from '@ui';
import { ProgramsSelect } from '@ui';
import PortalTooltip from '@ui/PortalTooltip';
import { getUsers, addUser, updateUser, deleteUser as deleteUserFromService, deleteStudent, disableUser, enableUser, isUserDisabledAtUserLevel, isStudent, isAdmin as isAdminUser, setUserPassword } from '@services/business/userService';
import { getPrograms } from '@services/business/programService';
import { getClasses } from '@services/business/classService';
import { getSubjects } from '@services/business/programService';
import { getEnrollments } from '@services/business/enrollmentService';
import { getAttendanceByStudent } from '@services/business/attendanceService';
import { getPenalties } from '@services/business/penaltyService';
import { getBehaviors } from '@services/business/behaviorService';
import { getParticipations } from '@services/business/participationService';
import { getUserSubmissions } from '@services/business/submissionService';
import { PAGE_STATES, FORM_STATES } from '@constants/pageTypes';

const UsersPage = ({ isDashboardTab = false }) => {
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const { user, isAdmin, isSuperAdmin, loading: authLoading } = useAuth();
  const toast = useToast();
  
  // Page state
  const [pageState, setPageState] = useState(PAGE_STATES.LOADING);
  const [formState, setFormState] = useState(FORM_STATES.IDLE);
  const [users, setUsers] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [enrollments, setEnrollments] = useState([]); // Add enrollments state
  
  // Form refs for performance (uncontrolled inputs)
  const emailRef = useRef(null);
  const displayNameRef = useRef(null);
  const realNameRef = useRef(null);
  const studentNumberRef = useRef(null);
  const orderRef = useRef(null);
  
  // Keycloak state
  const [autoAddToKeycloak, setAutoAddToKeycloak] = useState(true);
  
  // Quick filters
  const [programFilter, setProgramFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');
  
  // Form state
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    realName: '',
    role: ROLE_STRINGS.STUDENT, // Primary role for backward compatibility
    roles: [], // Multi-role array
    studentNumber: '',
    sequence: ''
  });
  const [saving, setSaving] = useState(false);
  const [gridRefreshKey, setGridRefreshKey] = useState(0);
  
  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: t('users_confirm_text'),
    variant: 'primary'
  });
  
  const { deleteModal, deleteUser, handleDeleteConfirm, hideDeleteModal } = useDeleteModal(t);
  const { isOpen: isQREmailModalOpen, student: qrEmailStudent, showQREmailModal, hideQREmailModal } = useQREmailModal(t);

  // Helper function to normalize user data from new schema to old format
  const normalizeUserData = useCallback((user) => {
    // Handle multiple roles from roleAssignments
    let allRoles = [ROLE_STRINGS.STUDENT]; // Default to student
    if (user.roleAssignments && Array.isArray(user.roleAssignments)) {
      const assignedRoles = user.roleAssignments
        .map(ra => ra.role?.code?.toLowerCase()) // Convert to lowercase
        .filter(code => code);
      if (assignedRoles.length > 0) {
        allRoles = assignedRoles;
      }
    } else if (user.roles && Array.isArray(user.roles)) {
      allRoles = user.roles;
    } else if (typeof user.role === 'string') {
      allRoles = [user.role.toLowerCase()];
    }
    
    return {
      ...user,
      role: allRoles[0] || ROLE_STRINGS.STUDENT, // First role as primary for compatibility
      roles: allRoles
    };
  }, []);

  const loadData = useCallback(async (isInitial = false) => {
    if (!isAdmin && !isSuperAdmin) {
      setPageState(PAGE_STATES.ERROR);
      return;
    }
    
    if (!isInitial) setPageState(PAGE_STATES.LOADING);
    try {
      
      const [usersResult, programsResult, classesResult, subjectsResult, enrollmentsResult] = await Promise.all([
        getUsers(),
        getPrograms(),
        getClasses(),
        getSubjects(),
        getEnrollments()
      ]);
      
      if (usersResult.success) {
        const normalizedUsers = (usersResult.data || []).map(normalizeUserData);
        setUsers(normalizedUsers);
      } else {
        toast?.showError(t('users_failed_to_load_users') + ': ' + usersResult.error);
      }
      
      if (programsResult.success) {
        setPrograms(programsResult.data || []);
      }
      
      if (classesResult.success) {
        setClasses(classesResult.data || []);
      }
      
      if (subjectsResult.success) {
        setSubjects(subjectsResult.data || []);
      }
      
      if (enrollmentsResult.success) {
        setEnrollments(enrollmentsResult.data || []);
      }
      
      setPageState(PAGE_STATES.SUCCESS);
    } catch (error) {
      error('USER_PAGE: Failed to load data', { error: error.message });
      toast?.showError(t('users_failed_to_load_data') + ': ' + error.message);
      setPageState(PAGE_STATES.ERROR);
    }
  }, [isAdmin, isSuperAdmin, t, toast, normalizeUserData]);

  // Simple initial load without global loading (dashboard tabs handle it)
  useLayoutEffect(() => {
    if (authLoading) return;
    if (!user) return;
    if (!isAdmin && !isSuperAdmin) return;

    loadData(true);
  }, [authLoading, user?.uid, user, isAdmin, isSuperAdmin, loadData]);

  // Debounced loadData to prevent multiple rapid calls
  const debouncedLoadData = useMemo(() => {
    let timeoutId;
    return (force = false) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        loadData(force);
      }, 100); // 100ms debounce
    };
  }, [loadData]);

  // Memoized disabled status check to prevent excessive calls
  const memoizedDisabledStatus = useMemo(() => {
    const cache = new Map();
    
    return (user) => {
      const cacheKey = `${user.id || user.docId}-${user.disabled}-${user.isDisabled}-${user.status}-${user.isActive}`;
      
      if (!cache.has(cacheKey)) {
        cache.set(cacheKey, isUserDisabledAtUserLevel(user));
      }
      
      return cache.get(cacheKey);
    };
  }, [users]); // Depend on users array to clear cache when data changes

  // Handler functions - must be defined before gridColumns
  // Helper function to determine user's primary role from various sources
  const getUserPrimaryRole = useCallback((user) => {
    if (user.isStudent) return ROLE_STRINGS.STUDENT;
    
    // Use normalized data
    const normalizedUser = normalizeUserData(user);
    return normalizedUser.role;
  }, [normalizeUserData]);

  const handleEditUser = useCallback((user) => {
    info('USER_PAGE: handleEditUser called', {
      timestamp: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        isInvited: user.isInvited,
        hasId: !!user.id,
        hasUid: !!user.uid,
        availableIds: {
          id: user.id,
          uid: user.uid,
          email: user.email
        }
      }
    });

    // Check if user is invited - if so, don't allow editing
    if (user.isInvited) {
      warn('USER_PAGE: Edit attempted on invited user - blocking', {
        email: user.email,
        reason: 'Invited users cannot be edited. Cancel invitation and re-add instead.'
      });
      toast?.showError('Cannot edit invited users. Cancel invitation and re-add with new details.');
      return;
    }

    // Check if user has proper ID for editing
    const userId = user.id || user.uid || user.email;
    if (!userId) {
      error('USER_PAGE: No valid ID found for editing user', {
        user: {
          email: user.email,
          displayName: user.displayName,
          isInvited: user.isInvited,
          availableIds: {
            id: user.id,
            uid: user.uid,
            email: user.email
          }
        }
      });
      toast?.showError('Cannot edit user - no valid ID found. User may need to sign up first.');
      return;
    }

    const primaryRole = getUserPrimaryRole(user);

    setEditingUser(user);
    setFormData({
      email: user.email || '',
      displayName: user.displayName || '',
      realName: user.realName || '',
      role: primaryRole,
      roles: user.roles || [primaryRole], // Multi-role array
      studentNumber: user.studentNumber || '',
      sequence: user.sequence || ''
    });
  }, [getUserPrimaryRole, toast]);

  const handleDeleteUser = useCallback(async (userToDelete) => {
    const userId = userToDelete.id || userToDelete.uid || userToDelete.email;
    const role = userToDelete.role || ROLE_STRINGS.STUDENT;
    const isStudentRole = isStudent(userToDelete);

    // Use already-loaded enrollments to compute enrollment and class counts
    const userEnrollments = enrollments.filter(e => e.userId === userId);
    const classesForUser = new Set(userEnrollments.map(e => e.classId)).size;

    let attendanceTotal = 0;
    let penaltiesTotal = 0;
    let behaviorsTotal = 0;
    let participationsTotal = 0;
    let submissionsTotal = 0;
    let activitiesCompleted = 0;

    try {
      const [attendanceRes, penaltiesRes, behaviorsRes, participationsRes, submissionsRes] = await Promise.all([
        getAttendanceByStudent(userId),
        getPenalties(userId),
        getBehaviors(),
        getParticipations(),
        getUserSubmissions(userId)
      ]);

      if (attendanceRes?.success && Array.isArray(attendanceRes.data)) {
        attendanceTotal = attendanceRes.data.length;
      }
      if (penaltiesRes?.success && Array.isArray(penaltiesRes.data)) {
        penaltiesTotal = penaltiesRes.data.length;
      }
      if (behaviorsRes?.success && Array.isArray(behaviorsRes.data)) {
        behaviorsTotal = behaviorsRes.data.filter(b => b.studentId === userId).length;
      }
      if (participationsRes?.success && Array.isArray(participationsRes.data)) {
        participationsTotal = participationsRes.data.filter(p => p.studentId === userId).length;
      }
      if (submissionsRes?.success && Array.isArray(submissionsRes.data)) {
        submissionsTotal = submissionsRes.data.length;
        activitiesCompleted = new Set(
          submissionsRes.data
            .map(s => s.activityId)
            .filter(Boolean)
        ).size;
      }
    } catch (error) {
      error('USER_PAGE: Failed to load related records for delete:', error);
    }

    const relatedRecords = {
      enrollments: userEnrollments.length,
      classes: classesForUser,
      attendance: attendanceTotal,
      penalties: penaltiesTotal,
      participations: participationsTotal,
      behaviors: behaviorsTotal,
      activities: activitiesCompleted,
      submissions: submissionsTotal
    };

    // Instructors and other staff must be soft-deleted (disabled), students can be fully deleted
    if (!isStudentRole) {
      deleteUser(userToDelete, async () => {
        try {
          const result = await disableUser(userId);
          if (result.success) {
            toast?.showSuccess(t('users_soft_deleted_success'));
            debouncedLoadData();
          } else {
            toast?.showError(result.error || t('users_failed_to_disable_user'));
          }
        } catch (error) {
          error('USER_PAGE: Failed to soft delete user:', error);
          toast?.showError(t('users_error', { error: error.message }));
        }
      }, relatedRecords);
    } else {
      deleteUser(userToDelete, async () => {
        try {
          const result = await deleteStudent(userId);
          if (result.success) {
            toast?.showSuccess(t('users_deleted_successfully'));
            debouncedLoadData();
          } else {
            toast?.showError(result.error || t('users_failed_to_delete_user'));
          }
        } catch (error) {
          error('USER_PAGE: Failed to delete student:', error);
          toast?.showError(t('users_error', { error: error.message }));
        }
      }, relatedRecords);
    }
  }, [deleteUser, toast, debouncedLoadData, enrollments, t]);

  const handleToggleUserStatus = useCallback(async (user) => {
    // Allow disabling any user (including admins) - only restriction is for delete
    const isCurrentlyDisabled = memoizedDisabledStatus(user);
    const action = isCurrentlyDisabled ? 'enable' : 'disable';

    info('USER_PAGE: handleToggleUserStatus called', {
      timestamp: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        isCurrentlyDisabled: isCurrentlyDisabled,
        disabled: user.disabled,
        isDisabled: user.isDisabled,
        disabledAt: user.disabledAt,
        status: user.status
      },
      action: action
    });

    // Show confirmation modal
    setConfirmModal({
      isOpen: true,
      title: isCurrentlyDisabled ? t('users_enable_user') : t('users_disable_user'),
      message: t('users_enable_disable_confirmation', { action, userName: user.displayName || user.email, userRole: user.role || 'student' }),
      confirmText: `${action.charAt(0).toUpperCase() + action.slice(1)}`,
      variant: isCurrentlyDisabled ? 'primary' : 'danger',
      onConfirm: async () => {
        try {
          const userId = user.docId || user.id;
          const newDisabledState = !isCurrentlyDisabled;
          
          info('USER_PAGE: Confirming user status change', {
            userId: userId,
            currentDisabled: isCurrentlyDisabled,
            newDisabledState: newDisabledState,
            action: action
          });

          // Call the appropriate Cloud Function
          const result = newDisabledState 
            ? await disableUser(userId)
            : await enableUser(userId);
          
          info('USER_PAGE: Cloud function result', {
            userId: userId,
            action: action,
            success: result.success,
            payload: result.payload
          });
          
          if (result.success) {
            // Close modal first
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
            
            info('USER_PAGE: User status update successful', {
              userId: userId,
              action: action
            });
            
            // Log activity
            try {
              const { logActivity } = await import('@services/other/activityLogger');
              await logActivity(ACTIVITY_LOG_TYPES.USER_UPDATED, {
                userId: userId,
                userEmail: user.email,
                action: isCurrentlyDisabled ? 'enabled' : 'disabled'
              }, userId);
            } catch (e) { }
        toast?.showSuccess(isCurrentlyDisabled ? t('users_enabled_successfully') : t('users_disabled_successfully'));
        
        info('USER_PAGE: About to reload data after status change', {
          timestamp: new Date().toISOString(),
          userId: userId,
          action: action
        });
        
        // Force reload data with timestamp to ensure fresh data
        debouncedLoadData(true);
        
        // Force grid re-render to update button states
        setGridRefreshKey(prev => prev + 1);
        
        info('USER_PAGE: Data reload completed after status change', {
          timestamp: new Date().toISOString(),
          userId: userId
        });
      } else {
        // Close modal on error too
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        toast?.showError(result.error || t('users_failed_to_update_user'));
      }
    } catch (error) {
          // Close modal on exception too
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          error('Error:', error);
          toast?.showError(t('users_action_failed', { error: error.message }));
        }
      }
    });
  }, [toast, debouncedLoadData, t, memoizedDisabledStatus]);

  // Password reset dialog state
  const [passwordResetModal, setPasswordResetModal] = useState({
    isOpen: false,
    user: null,
    newPassword: '',
    isKeycloakUser: false,
    loading: false
  });

  const handleResetPassword = useCallback(async (user) => {
    // Check if user exists in Keycloak (simplified check - in production would verify with backend)
    const isKeycloakUser = user.id || user.uid; // Users with IDs are likely in Keycloak
    
    setPasswordResetModal({
      isOpen: true,
      user: user,
      newPassword: '',
      isKeycloakUser: isKeycloakUser,
      loading: false
    });
  }, []);

  const handlePasswordResetConfirm = useCallback(async () => {
    const { user, newPassword, isKeycloakUser } = passwordResetModal;
    
    if (!newPassword || newPassword.length < 8) {
      toast?.showError('Password must be at least 8 characters long');
      return;
    }

    setPasswordResetModal(prev => ({ ...prev, loading: true }));

    try {
      // Call the password reset service
      const result = await setUserPassword(user.id, newPassword, isKeycloakUser);
      
      if (result.success) {
        toast?.showSuccess(
          isKeycloakUser 
            ? `Password reset successfully for ${user.email}. The new password has been set in Keycloak.`
            : `Password reset successfully for ${user.email}.`
        );
        setPasswordResetModal({ isOpen: false, user: null, newPassword: '', isKeycloakUser: false, loading: false });
      } else {
        toast?.showError(result.error || 'Failed to reset password');
        setPasswordResetModal(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Password reset error:', error);
      toast?.showError(`Failed to reset password: ${error.message}`);
      setPasswordResetModal(prev => ({ ...prev, loading: false }));
    }
  }, [passwordResetModal, toast]);

  const handleGeneratePassword = useCallback(() => {
    const generateStrongPassword = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      let password = '';
      for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };
    
    const newPassword = generateStrongPassword();
    setPasswordResetModal(prev => ({ ...prev, newPassword }));
  }, []);

  const handleSendWelcomeEmail = useCallback(async (email, role, displayName) => {
    toast?.showInfo('Welcome email functionality is currently disabled');
  }, [toast]);

  const openQRCodeInNewTab = useCallback((user) => {
    const qrUrl = `/qrcode/${encodeURIComponent(user.studentNumber)}`;
    window.open(qrUrl, '_blank');
  }, []);

  const handleSendQRCodeEmail = useCallback((user) => {
    showQREmailModal(user);
  }, [showQREmailModal]);

  // Sync refs when editing
  useEffect(() => {
    if (emailRef.current) emailRef.current.value = formData.email || '';
    if (displayNameRef.current) displayNameRef.current.value = formData.displayName || '';
    if (realNameRef.current) realNameRef.current.value = formData.realName || '';
    if (studentNumberRef.current) studentNumberRef.current.value = formData.studentNumber || '';
    if (orderRef.current) orderRef.current.value = formData.sequence || '';
  }, [editingUser, formData]);

  // Read text values from refs into form state before submit
  const syncRefsToState = useCallback(() => {
    return {
      email: emailRef.current?.value ?? formData.email,
      displayName: displayNameRef.current?.value ?? formData.displayName,
      realName: realNameRef.current?.value ?? formData.realName,
      studentNumber: studentNumberRef.current?.value ?? formData.studentNumber,
      sequence: orderRef.current?.value ?? formData.sequence,
      role: formData.role
    };
  }, [formData]);

  // Filter users based on all filters
  const filteredUsers = useMemo(() => {
    let filtered = [...users];
    
    // Search filter (email, displayName, realName)
    if (searchFilter) {
      const searchLower = searchFilter.toLowerCase();
      filtered = filtered.filter(user => 
        user.email?.toLowerCase().includes(searchLower) ||
        user.displayName?.toLowerCase().includes(searchLower) ||
        user.realName?.toLowerCase().includes(searchLower)
      );
    }
    
    // Role filter
    if (roleFilter && roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }
    
    // Status filter (based on centralized disabled helper)
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(user => {
        if (statusFilter === 'active') return !memoizedDisabledStatus(user);
        if (statusFilter === 'disabled') return memoizedDisabledStatus(user);
        return true;
      });
    }
    
    // Program filter - filter users enrolled in selected program
    if (programFilter) {
      filtered = filtered.filter(user => {
        // Check if user has any enrollment in the selected program
        return enrollments.some(enrollment => 
          (enrollment.userId === user.docId || enrollment.userEmail === user.email) &&
          enrollment.programId === programFilter
        );
      });
    }
    
    // Class filter - filter users enrolled in selected class
    if (classFilter) {
      filtered = filtered.filter(user => {
        // Check if user has any enrollment in the selected class
        return enrollments.some(enrollment => 
          (enrollment.userId === user.docId || enrollment.userEmail === user.email) &&
          enrollment.classId === classFilter
        );
      });
    }
    
    // Subject filter - filter users enrolled in selected subject
    if (subjectFilter) {
      filtered = filtered.filter(user => {
        // Check if user has any enrollment in the selected subject
        return enrollments.some(enrollment => 
          (enrollment.userId === user.docId || enrollment.userEmail === user.email) &&
          enrollment.subjectId === subjectFilter
        );
      });
    }
    
    return filtered;
  }, [users, enrollments, searchFilter, roleFilter, statusFilter, programFilter, classFilter, subjectFilter]);

  // Memoized options for dropdowns
  const roleOptions = useMemo(() => [
    { value: 'all', label: t('all_roles') || 'All Roles' },
    { value: ROLE_STRINGS.SUPER_ADMIN, label: t('super_admin') || 'Super Admin' },
    { value: ROLE_STRINGS.ADMIN, label: t('admin') || 'Admin' },
    { value: ROLE_STRINGS.INSTRUCTOR, label: t('instructor') || 'Instructor' },
    { value: ROLE_STRINGS.HR, label: t('hr') || 'HR' },
    { value: ROLE_STRINGS.STUDENT, label: t('student') || 'Student' }
  ], [t]);
  
  const statusOptions = useMemo(() => [
    { 
      value: 'all', 
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {t('all_status') || 'All Status'}
        </span>
      )
    },
    { 
      value: 'active', 
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-success, #28a745)' }}>
          {getThemedIcon('ui', 'check_circle', 16, theme)}
          {t('active') || 'Active'}
        </span>
      )
    },
    { 
      value: 'disabled', 
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-danger, #dc2626)' }}>
          {getThemedIcon('ui', 'user_x', 16, theme)}
          {t('disabled') || 'Disabled'}
        </span>
      )
    }
  ], [t, theme]);

  // Memoized options for program, class, and subject filters
  const programOptions = useMemo(() => [
    { value: '', label: t('all_programs') || 'All Programs' },
    ...programs.map(program => ({
      value: program.docId || program.id,
      label: program.title || program.name || program.programName || `Program ${program.docId?.slice(0, 8) || 'Unknown'}`
    }))
  ], [programs, t]);

  const classOptions = useMemo(() => [
    { value: '', label: t('all_classes') || 'All Classes' },
    ...classes.map(cls => ({
      value: cls.docId || cls.id,
      label: cls.title || cls.name || cls.className || `Class ${cls.docId?.slice(0, 8) || 'Unknown'}`
    }))
  ], [classes, t]);

  const subjectOptions = useMemo(() => [
    { value: '', label: t('all_subjects') || 'All Subjects' },
    ...subjects.map(subject => ({
      value: subject.docId || subject.id,
      label: subject.title || subject.name || subject.subjectName || `Subject ${subject.docId?.slice(0, 8) || 'Unknown'}`
    }))
  ], [subjects, t]);

  // Memoized grid columns for performance
  const gridColumns = useMemo(() => [
    { field: 'email', headerName: t('email_col'), flex: 1, minWidth: 220 },
    { field: 'displayName', headerName: t('display_name_col'), flex: 1, minWidth: 180 },
    { 
      field: 'realName', 
      headerName: t('real_name') || 'Real Name', 
      flex: 1, 
      minWidth: 180,
      renderCell: (params) => {
        return (
          <span style={{ 
            color: params.value ? 'inherit' : '#9ca3af',
            fontStyle: params.value ? 'normal' : 'italic'
          }}>
            {params.value || '—'}
          </span>
        );
      }
    },
    {
      field: 'sequence', 
      headerName: t('order') || 'Order', 
      width: 120,
      valueGetter: (params) => params.row.sequence,
      renderCell: (params) => {
        return (
          <span style={{ 
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            color: params.value ? '#059669' : '#9ca3af',
            fontWeight: 600
          }}>
            {params.value || '—'}
          </span>
        );
      }
    },
    {
      field: 'studentNumber', 
      headerName: t('student_number') || 'Student Number', 
      width: 150,
      valueGetter: (params) => params.row.studentNumber,
      renderCell: (params) => {
        return (
          <span style={{ 
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            color: params.value ? '#2563eb' : '#9ca3af',
            fontWeight: 500
          }}>
            {params.value || '—'}
          </span>
        );
      }
    },
    {
      field: 'roleIcons', 
      headerName: t('roles') || 'Roles', 
      width: 180,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        // Get all roles from multiple sources
        const userRoles = [];
        
        // First try to get from roleAssignments (new multi-role system)
        if (params.row.roleAssignments && Array.isArray(params.row.roleAssignments)) {
          params.row.roleAssignments.forEach(ra => {
            if (ra.role?.code) {
              // Convert uppercase database codes to lowercase
              userRoles.push(ra.role.code.toLowerCase());
            }
          });
        }
        
        // Fallback to roles array if available
        if (userRoles.length === 0 && params.row.roles && Array.isArray(params.row.roles)) {
          userRoles.push(...params.row.roles);
        }
        
        // Fallback to boolean flags
        if (userRoles.length === 0) {
          if (params.row.isSuperAdmin) userRoles.push(ROLE_STRINGS.SUPER_ADMIN);
          if (params.row.isAdmin) userRoles.push(ROLE_STRINGS.ADMIN);
          if (params.row.isInstructor) userRoles.push(ROLE_STRINGS.INSTRUCTOR);
          if (params.row.isHR) userRoles.push(ROLE_STRINGS.HR);
          if (params.row.isStudent) userRoles.push(ROLE_STRINGS.STUDENT);
        }
        
        // Final fallback to single role field
        if (userRoles.length === 0) {
          const roleField = params.row.role;
          let fallbackRole = ROLE_STRINGS.STUDENT;
          
          if (typeof roleField === 'object' && roleField?.code) {
            // Convert uppercase database codes to lowercase ROLE_STRINGS
            const normalizedCode = roleField.code.toLowerCase();
            fallbackRole = normalizedCode;
          } else if (typeof roleField === 'string') {
            // Convert uppercase database codes to lowercase ROLE_STRINGS
            fallbackRole = roleField.toLowerCase();
          }
          
          userRoles.push(fallbackRole);
        }
        
        const roleIcons = {
          [ROLE_STRINGS.SUPER_ADMIN]: getThemedIcon('ui', 'crown', 14, theme),
          [ROLE_STRINGS.ADMIN]: getThemedIcon('ui', 'shield', 14, theme),
          [ROLE_STRINGS.INSTRUCTOR]: getThemedIcon('ui', 'book_open', 14, theme),
          [ROLE_STRINGS.HR]: getThemedIcon('ui', 'users', 14, theme),
          [ROLE_STRINGS.STUDENT]: getThemedIcon('ui', 'user', 14, theme)
        };
        
        const roleColors = {
          [ROLE_STRINGS.SUPER_ADMIN]: '#dc2626', // Red for super admin
          [ROLE_STRINGS.ADMIN]: '#2563eb',       // Blue for admin
          [ROLE_STRINGS.INSTRUCTOR]: '#ea580c',  // Orange for instructor
          [ROLE_STRINGS.HR]: '#7c3aed',          // Purple for HR
          [ROLE_STRINGS.STUDENT]: '#0891b2'      // Cyan for student (instead of green)
        };
        
        const roleNames = {
          [ROLE_STRINGS.SUPER_ADMIN]: 'Super Admin',
          [ROLE_STRINGS.ADMIN]: 'Admin',
          [ROLE_STRINGS.INSTRUCTOR]: 'Instructor',
          [ROLE_STRINGS.HR]: 'HR',
          [ROLE_STRINGS.STUDENT]: 'Student'
        };
        
        return (
          <div style={{ display: 'flex', flexWrap: 'nowrap', gap: '2px', alignItems: 'center', padding: '2px 0' }}>
            {userRoles.map((role, idx) => {
              const icon = roleIcons[role];
              const color = roleColors[role];
              const name = roleNames[role] || role;
              
              return (
                <span 
                  key={idx} 
                  style={{ 
                    color, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '1px',
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {icon}
                  {name}
                </span>
              );
            })}
          </div>
        );
      }
    },
    {
      field: 'status', headerName: t('status_col'), width: 100,
      renderCell: (params) => {
        // Check if this is an invited user
        if (params.row.isInvited) {
          return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--color-warning, #f59e0b)', fontWeight: 500 }}>
              {getThemedIcon('ui', 'mail', 14, theme)}
              {t('status_invited') || 'Invited'}
            </span>
          );
        }
        
        const isDisabled = memoizedDisabledStatus(params.row);
        if (isDisabled) {
          return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--color-danger, #dc2626)', fontWeight: 500 }}>
              {getThemedIcon('ui', 'user_x', 14, theme)}
              {t('status_disabled') || 'Disabled'}
            </span>
          );
        } else {
          return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--color-success, #28a745)', fontWeight: 500 }}>
              {getThemedIcon('ui', 'check_circle', 14, theme)}
              {t('status_active') || 'Active'}
            </span>
          );
        }
      }
    },
    {
      field: 'createdAt', headerName: t('created_at') || 'Created At', width: 180,
      valueGetter: (params) => params.row.createdAt,
      renderCell: (params) => {
        if (!params.value) return (t('unknown') || 'Unknown');
        const date = params.value?.toDate ? params.value.toDate() : (params.value?.seconds ? new Date(params.value.seconds * 1000) : new Date(params.value));
        if (isNaN(date.getTime())) return (t('unknown') || 'Unknown');
        
        // Format as: FEB 11, 2026 at 11:02:55 PM
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        const month = months[date.getMonth()];
        const day = date.getDate();
        const year = date.getFullYear();
        const hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        
        return `${month} ${day}, ${year} at ${displayHours}:${minutes}:${seconds} ${ampm}`;
      }
    },
    {
      field: 'createdBy', headerName: t('created_by') || 'Created By', width: 150,
      valueGetter: (params) => params.row.createdBy,
      renderCell: (params) => {
        return getUserDisplayName(params.value);
      }
    },
    {
      field: 'updatedAt', headerName: t('updated_at') || 'Updated At', width: 180,
      valueGetter: (params) => params.row.updatedAt,
      renderCell: (params) => {
        if (!params.value) return (t('never') || 'Never');
        const date = params.value?.toDate ? params.value.toDate() : (params.value?.seconds ? new Date(params.value.seconds * 1000) : new Date(params.value));
        if (isNaN(date.getTime())) return (t('unknown') || 'Unknown');
        
        // Format as: FEB 11, 2026 at 11:02:55 PM
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        const month = months[date.getMonth()];
        const day = date.getDate();
        const year = date.getFullYear();
        const hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        
        return `${month} ${day}, ${year} at ${displayHours}:${minutes}:${seconds} ${ampm}`;
      }
    },
    {
      field: 'updatedBy', headerName: t('updated_by') || 'Updated By', width: 150,
      valueGetter: (params) => params.row.updatedBy,
      renderCell: (params) => {
        return getUserDisplayName(params.value);
      }
    },
    {
      field: 'actions', headerName: t('actions_col'), width: 350, sortable: false, filterable: false,
      renderCell: (params) => (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {params.row.isInvited ? (
            // Invited users get limited actions
            <>
              <PortalTooltip content={t('resend_welcome_email')} position="top">
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => handleSendWelcomeEmail(params.row.email, params.row.role, params.row.displayName)}
                style={{ border: 'none' }}
              >
                {getThemedIcon('ui', 'mail', 16, theme)}
              </Button>
            </PortalTooltip>
              <PortalTooltip content={t('remove_invitation')} position="top">
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => handleRemoveFromAllowlist(params.row.email, params.row.role)}
                style={{ border: 'none', color: '#dc2626' }}
              >
                {getThemedIcon('ui', 'x', 16, theme)}
              </Button>
            </PortalTooltip>
            </>
          ) : (
            // Existing users get full actions
            <>
              {/* Edit button - always first */}
              {(() => {
                const isSuperAdminUser = params.row.isSuperAdmin || params.row.role === ROLE_STRINGS.SUPER_ADMIN;
                const currentUserIsSuperAdmin = user?.isSuperAdmin || user?.role === ROLE_STRINGS.SUPER_ADMIN;
                const canEdit = !isSuperAdminUser || currentUserIsSuperAdmin;
                
                return (
                  <PortalTooltip content={canEdit ? t('edit') : t('only_super_admin_can_edit_super_admin')} position="top">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    icon={getThemedIcon('ui', 'edit', 16, theme)} 
                    onClick={() => {
                      info('USER_PAGE: Edit button clicked', {
                        userEmail: params.row.email,
                        userId: params.row.id,
                        isInvited: params.row.isInvited,
                        canEdit: canEdit
                      });
                      handleEditUser(params.row);
                    }}
                    disabled={!canEdit}
                    style={{ opacity: canEdit ? 1 : 0.5 }}
                  >
                    {t('edit')}
                  </Button>
                  </PortalTooltip>
                );
              })()}
              
              {/* Reset Password button - temporarily hidden */}
              {/* <PortalTooltip content={memoizedDisabledStatus(params.row) ? t('user_is_disabled_cannot_reset_password') : t('reset_password')} position="top">
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => handleResetPassword(params.row)}
                style={{ border: 'none', opacity: memoizedDisabledStatus(params.row) ? 0.5 : 1 }}
                disabled={memoizedDisabledStatus(params.row)}
              >
                {getThemedIcon('ui', 'key_round', 16, theme)}
              </Button>
            </PortalTooltip> */}
              
                            
              {/* Disable/Enable button - fourth */}
              <PortalTooltip content={memoizedDisabledStatus(params.row) ? t('enable') : t('disable')} position="top">
              <Button 
                size="sm" 
                variant="ghost" 
                icon={memoizedDisabledStatus(params.row) ? getThemedIcon('ui', 'user_check', 16, theme) : getThemedIcon('ui', 'user_x', 16, theme)}
                style={{ color: memoizedDisabledStatus(params.row) ? '#28a745' : '#dc2626' }}
                onClick={() => handleToggleUserStatus(params.row)}
                // Remove the admin restriction - allow disable for all users
              >
                {memoizedDisabledStatus(params.row) ? t('enable') : t('disable')}
              </Button>
            </PortalTooltip>
              
              {/* QR Code buttons - fifth and sixth - HIDDEN */}
              {(() => {
                // Check if user has student role from boolean flags
                const hasStudentRole = isStudent(params.row);
                const isSuperAdminUser = params.row.isSuperAdmin || params.row.role === ROLE_STRINGS.SUPER_ADMIN;
                const isInstructorUser = params.row.isInstructor || params.row.role === ROLE_STRINGS.INSTRUCTOR;

                // QR buttons temporarily hidden
                return null;
                
                // Show QR code for students (functional), super admins, and instructors (disabled)
                if (params.row.studentNumber && (hasStudentRole || isSuperAdminUser || isInstructorUser)) {
                  const canUseQR = hasStudentRole;
                  let title;
                  
                  if (canUseQR) {
                    title = t('view_qr_code') || 'View QR Code';
                  } else if (isSuperAdminUser && isInstructorUser) {
                    title = t('qr_code_student_only_super_admin_instructor') || 'QR Code (Student only) - Super Admin & Instructor';
                  } else if (isSuperAdminUser) {
                    title = t('qr_code_student_only_super_admin');
                  } else if (isInstructorUser) {
                    title = t('qr_code_student_only_instructor');
                  } else {
                    title = t('qr_code_student_only');
                  }
                  
                  return (
                    <>
                      <PortalTooltip content={title} position="top">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => canUseQR && openQRCodeInNewTab(params.row)}
                        disabled={!canUseQR}
                        style={{ opacity: canUseQR ? 1 : 0.5, border: 'none' }}
                      >
                        {getThemedIcon('ui', 'qr_code', 16, theme)}
                      </Button>
                      </PortalTooltip>
                      <PortalTooltip content={
                          !canUseQR ? t('qr_code_email_student_only') :
                          memoizedDisabledStatus(params.row) ? t('user_is_disabled_cannot_send_qr_code_email') :
                          t('send_qr_code_email')
                        } position="top">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => canUseQR && !memoizedDisabledStatus(params.row) && handleSendQRCodeEmail(params.row)}
                        disabled={!canUseQR || memoizedDisabledStatus(params.row)}
                        style={{ opacity: (canUseQR && !memoizedDisabledStatus(params.row)) ? 1 : 0.5, border: 'none' }}
                      >
                        {getThemedIcon('ui', 'qr_code', 16, theme)}
                      </Button>
                    </PortalTooltip>
                    </>
                  );
                }
                return null; // Don't show QR buttons if no student number
              })()}
              
              {/* Delete button - always last - DISABLED FOR SAFETY */}
              {/* 
              {(() => {
                const isSuperAdminUser = params.row.isSuperAdmin || params.row.role === ROLE_STRINGS.SUPER_ADMIN;
                const currentUserIsSuperAdmin = user?.isSuperAdmin || user?.role === ROLE_STRINGS.SUPER_ADMIN;
                const isStudentRole = isStudent(params.row);
                
                // Only students can be deleted
                const canDelete = isStudentRole && (!isSuperAdminUser || currentUserIsSuperAdmin);
                
                return (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    icon={getThemedIcon('ui', 'trash', 16, theme)}
                    style={{ color: '#dc2626', opacity: canDelete ? 1 : 0.5 }}
                    onClick={() => canDelete && handleDeleteUser(params.row)}
                    disabled={!canDelete}
                    title={canDelete ? (t('delete') || 'Delete') : (isStudentRole ? 'Cannot delete this user' : 'Only students can be deleted')}
                  >
                    {t('delete') || 'Delete'}
                  </Button>
                );
              })()}
              */}
            </>
          )}
        </div>
      )
    }
  ], [t, theme, handleEditUser, openQRCodeInNewTab, handleSendQRCodeEmail, handleResetPassword, handleSendWelcomeEmail, handleToggleUserStatus, handleDeleteUser, user?.isSuperAdmin, user?.role]);

  // Helper function to get user display name by ID
  const getUserDisplayName = useCallback((userId) => {
    if (!userId) return (t('system') || 'System');
    
    const user = users.find(u => u.id === userId);
    if (user) {
      return user.displayName || user.email || user.realName || `User ${userId}`;
    }
    
    return `User ${userId}`;
  }, [users, t]);

  // Helper function to get role icon using getThemedIcon
  const getRoleIconThemed = (role) => {
    const roleIconMap = {
      [ROLE_STRINGS.STUDENT]: getThemedIcon('ui', 'user', 16, theme),
      [ROLE_STRINGS.INSTRUCTOR]: getThemedIcon('ui', 'book_open', 16, theme),
      [ROLE_STRINGS.HR]: getThemedIcon('ui', 'users', 16, theme),
      [ROLE_STRINGS.ADMIN]: getThemedIcon('ui', 'shield', 16, theme),
      [ROLE_STRINGS.SUPER_ADMIN]: getThemedIcon('ui', 'crown', 16, theme),
    };
    return roleIconMap[role] || roleIconMap[ROLE_STRINGS.STUDENT];
  };

  // Helper function to get role icon color
  const getRoleIconColor = (role) => {
    const colorMap = {
      [ROLE_STRINGS.STUDENT]: '#16a34a',
      [ROLE_STRINGS.INSTRUCTOR]: '#0ea5e9',
      [ROLE_STRINGS.HR]: '#8b5cf6',
      [ROLE_STRINGS.ADMIN]: '#4f46e5',
      [ROLE_STRINGS.SUPER_ADMIN]: '#f59e0b',
    };
    return colorMap[role] || colorMap[ROLE_STRINGS.STUDENT];
  };

  const handleFormSubmit = async (e) => {
    // Prevent duplicate submissions
    if (saving) {
      return;
    }

    e.preventDefault();
    const textValues = syncRefsToState();
    
    if (!textValues.email.trim()) {
      toast?.showError('Email is required');
      return;
    }

    // Validate student number is required for students
    if (formData.role === ROLE_STRINGS.STUDENT && !textValues.studentNumber?.trim()) {
      toast?.showError('Student number is required for students');
      return;
    }

    // Validate email uniqueness across all users
    const emailDuplicate = users.some(user => 
      user.email === textValues.email.trim() && 
      (user.id !== editingUser?.id && user.email !== editingUser?.email)
    );
    
    if (emailDuplicate) {
      toast?.showError('Email already exists. Each user must have a unique email address.');
      return;
    }

    // Validate student number uniqueness across all users (for all roles that provide it)
    if (textValues.studentNumber?.trim()) {
      const studentNumberDuplicate = users.some(user => 
        user.studentNumber === textValues.studentNumber.trim() && 
        (user.id !== editingUser?.id && user.email !== editingUser?.email)
      );
      
      if (studentNumberDuplicate) {
        toast?.showError('Student number must be unique. This student number is already in use.');
        return;
      }
    }

    setSaving(true);
    try {
      const submitData = {
        ...formData,
        ...textValues
      };
      
      info('USER_PAGE: Submit data prepared', {
        submitData: {
          email: submitData.email,
          displayName: submitData.displayName,
          realName: submitData.realName,
          studentNumber: submitData.studentNumber,
          sequence: submitData.sequence,
          role: submitData.role
        }
      });
      
      if (editingUser) {
        info('USER_PAGE: Attempting to update user', {
          timestamp: new Date().toISOString(),
          editingUser: {
            id: editingUser.id,
            email: editingUser.email,
            hasId: !!editingUser.id,
            idType: typeof editingUser.id
          },
          submitDataKeys: Object.keys(submitData)
        });
        
        const userId = editingUser.id || editingUser.uid || editingUser.email;
        info('USER_PAGE: User ID determined for update', {
          userId: userId,
          idSource: editingUser.id ? 'id' : editingUser.uid ? 'uid' : editingUser.email ? 'email' : 'unknown'
        });
        
        if (!userId) {
          error('USER_PAGE: No valid user ID found for update', { 
            editingUser: {
              ...editingUser,
              availableIds: {
                id: editingUser.id,
                uid: editingUser.uid,
                email: editingUser.email
              },
              isInvited: editingUser.isInvited
            }
          });
          throw new Error('User ID not found - cannot update user. User may need to sign up first.');
        }

        const result = await updateUser(userId, submitData);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to update user');
        }

        // Log activity
        try {
          const { logActivity } = await import('@services/other/activityLogger');
          await logActivity(ACTIVITY_LOG_TYPES.USER_UPDATED, {
            userEmail: submitData.email,
            userDisplayName: submitData.displayName,
            userRole: submitData.role
          }, userId);
        } catch (e) { }
        toast?.showSuccess('User updated successfully!');
        
        // Only reload if editing (not adding new user to allowlist)
        if (editingUser) {
          debouncedLoadData();
        }
        resetForm();
      } else {
        // Add user to Keycloak if checkbox is checked
        if (autoAddToKeycloak && submitData.email) {
          // Validate student number is required for students
          if (submitData.role === ROLE_STRINGS.STUDENT && !submitData.studentNumber?.trim()) {
            warn('❌ USER_PAGE: Student creation rejected - missing student number', {
              email: submitData.email,
              role: submitData.role,
              reason: 'Student number is required for student accounts'
            });
            toast?.showError('Student number is required for student accounts');
            setSaving(false);
            return;
          }
          
          // Create user in Keycloak via API
          info('✅ USER_PAGE: Creating user in Keycloak', {
            email: submitData.email,
            role: submitData.role,
            studentNumber: submitData.studentNumber
          });
          
          try {
            const result = await addUser({
              email: submitData.email,
              displayName: submitData.displayName,
              firstName: submitData.displayName?.split(' ')[0] || submitData.displayName,
              lastName: submitData.displayName?.split(' ').slice(1).join(' ') || '',
              role: submitData.role,
              studentNumber: submitData.studentNumber,
              sequence: submitData.sequence
            });
            
            if (result.success) {
              toast?.showSuccess(t('user_created_successfully') || 'User created successfully');
              debouncedLoadData();
            } else {
              throw new Error(result.error || 'Failed to create user in Keycloak');
            }
          } catch (keycloakError) {
            error('❌ USER_PAGE: Failed to create user in Keycloak', {
              error: keycloakError.message,
              email: submitData.email,
              role: submitData.role
            });
            toast?.showError(`Failed to create user in Keycloak: ${keycloakError.message}`);
          }
        } else {
          info('ℹ️ USER_PAGE: No Keycloak creation - checkbox disabled or no email', {
            autoAddToKeycloak: autoAddToKeycloak,
            email: submitData.email,
            role: submitData.role
          });
          toast?.showInfo('No changes saved. Provide an email or enable Keycloak creation option.');
        }
      }

      // Only reload if editing (not adding new user to allowlist)
      if (editingUser) {
        const userId = editingUser.id || editingUser.uid || editingUser.email;
        info('USER_PAGE: Calling loadData after user update', {
          timestamp: new Date().toISOString(),
          userId: userId
        });
        debouncedLoadData();
      }
      resetForm();
    } catch (error) {
      toast?.showError('Error: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = useCallback((clearRefs = true) => {
    
    setEditingUser(null);
    setFormData({
      email: '',
      displayName: '',
      realName: '',
      role: ROLE_STRINGS.STUDENT,
      roles: [],
      studentNumber: '',
      sequence: ''
    });
    // Clear refs only when explicitly requested (not on role changes)
    if (clearRefs) {
      if (emailRef.current) emailRef.current.value = '';
      if (displayNameRef.current) displayNameRef.current.value = '';
    }
  }, []);

  if (authLoading) return <GlobalLoadingFallback />;

  return (
    <div className="users-page">
      <p style={{ color: '#555', marginBottom: '1rem' }}>Create and manage users with seamless Keycloak integration. All users are automatically provisioned with their assigned roles and secure temporary passwords.</p>
      
      {/* Keycloak Instructions */}
      <div style={{
        background: theme === 'dark' ? '#1e3a8a' : '#f8fafc',
        border: `1px solid ${theme === 'dark' ? '#3b82f6' : '#e2e8f0'}`,
        borderRadius: '8px',
        padding: '1.25rem',
        marginBottom: '1.5rem',
        boxShadow: theme === 'dark' ? '0 1px 3px rgba(59, 130, 246, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <h4 style={{ 
          margin: '0 0 0.75rem 0', 
          color: theme === 'dark' ? '#93c5fd' : '#1e40af',
          fontSize: '1rem',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {getThemedIcon('ui', 'info', 18, theme)}
          Automatic Keycloak User Management
        </h4>
        <div style={{ 
          fontSize: '0.875rem', 
          lineHeight: '1.6',
          color: theme === 'dark' ? '#cbd5e1' : '#334155'
        }}>
          <div style={{ 
            background: theme === 'dark' ? '#1e40af' : '#dbeafe',
            border: `1px solid ${theme === 'dark' ? '#3b82f6' : '#93c5fd'}`,
            borderRadius: '6px',
            padding: '0.75rem',
            marginBottom: '1rem',
            fontSize: '0.8rem'
          }}>
            <strong style={{ color: theme === 'dark' ? '#bfdbfe' : '#1e40af' }}>🤖 Automatic User Creation</strong><br />
            Users are automatically created in Keycloak with their assigned roles when you submit the form.
          </div>
          
          <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <span style={{ color: theme === 'dark' ? '#60a5fa' : '#2563eb', fontWeight: 'bold' }}>➤</span>
              <div>
                <strong>Create User:</strong> Fill form + enable "Create user in Keycloak" → User automatically created with temporary password
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <span style={{ color: theme === 'dark' ? '#60a5fa' : '#2563eb', fontWeight: 'bold' }}>➤</span>
              <div>
                <strong>Reset Password:</strong> Click key icon → New temporary password generated and shown to admin
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <span style={{ color: theme === 'dark' ? '#60a5fa' : '#2563eb', fontWeight: 'bold' }}>➤</span>
              <div>
                <strong>Disable/Enable:</strong> Click toggle button → User status automatically updated in Keycloak
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <span style={{ color: theme === 'dark' ? '#60a5fa' : '#2563eb', fontWeight: 'bold' }}>➤</span>
              <div>
                <strong>Role Assignment:</strong> User's role from form is automatically assigned in Keycloak
              </div>
            </div>
          </div>
          
          <div style={{
            background: theme === 'dark' ? '#374151' : '#fef3c7',
            border: `1px solid ${theme === 'dark' ? '#6b7280' : '#f59e0b'}`,
            borderRadius: '6px',
            padding: '0.75rem',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem'
          }}>
            <span style={{ color: theme === 'dark' ? '#fbbf24' : '#d97706', fontWeight: 'bold' }}>⚠️</span>
            <div>
              <strong style={{ color: theme === 'dark' ? '#fbbf24' : '#d97706' }}>Important:</strong> Ensure Keycloak admin credentials are configured in backend environment variables for automatic creation.
            </div>
          </div>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="filters-container" style={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: '1rem', 
        marginBottom: '1rem', 
        background: theme === 'dark' ? '#1f2937' : '#f8f9fa', 
        padding: '1rem', 
        borderRadius: 12, 
        boxShadow: theme === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.05)', 
        borderWidth: theme === 'dark' ? '1px' : '0',
borderStyle: theme === 'dark' ? 'solid' : 'none',
borderColor: theme === 'dark' ? '#374151' : 'transparent',
        width: '100%' 
      }}>
        {/* First line: Program, Subject, Class filters - full width */}
        <ProgramsSelect
          programs={programs}
          subjects={subjects}
          classes={classes}
          selectedProgram={programFilter}
          selectedSubject={subjectFilter}
          selectedClass={classFilter}
          onProgramChange={(programId) => setProgramFilter(programId)}
          onSubjectChange={(subjectId) => setSubjectFilter(subjectId)}
          onClassChange={(classId) => setClassFilter(classId)}
          showClass={true}
          showLabels={false}
          style={{ width: '100%' }}
        />
        
        {/* Second line: Search + Role + Status */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', width: '100%' }}>
          <Input
            type="text"
            placeholder={t('search_users') || 'Search by email or name...'}
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            prefix={getThemedIcon('ui', 'search', 16, theme)}
            style={{ minWidth: '500px', flex: 6 }}
          />
          
          <Select
            value={roleFilter || 'all'}
            onChange={(e) => setRoleFilter(e.target.value)}
            options={roleOptions.map(option => ({
              ...option,
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {option.value !== 'all' && getRoleIconThemed(option.value)}
                  {option.label}
                </span>
              )
            }))}
            placeholder={t('filter_by_role') || 'Filter by Role'}
            style={{ minWidth: '200px', flex: 1 }}
          />
          
          <Select
            value={statusFilter || 'all'}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={statusOptions}
            placeholder={t('filter_by_status') || 'Filter by Status'}
            style={{ minWidth: '200px', flex: 1 }}
          />
        </div>
      </div>
      
      {(programFilter || subjectFilter || classFilter || roleFilter || statusFilter) && (
        <div style={{ 
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          marginBottom: '1rem',
          background: theme === 'dark' ? '#1e3a8a' : '#eff6ff',
          border: theme === 'dark' ? '1px solid #3b82f6' : '1px solid #bfdbfe',
          borderRadius: '9999px',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: theme === 'dark' ? '#93c5fd' : '#1e40af'
        }}>
          {getThemedIcon('ui', 'filter', 14, theme)}
          {t('showing_filtered') || 'Showing'} {filteredUsers.length} {t('of') || 'of'} {users.length} {t('users') || 'Users'}
        </div>
      )}

      {/* Summary Chips */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          padding: '0.5rem 0.75rem', 
          background: theme === 'dark' ? '#1e293b' : '#f0f9ff', 
          border: theme === 'dark' ? '1px solid #475569' : '1px solid #bae6fd', 
          borderRadius: '9999px',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: theme === 'dark' ? '#94a3b8' : '#0369a1'
        }}>
          {getThemedIcon('ui', 'target', 16, theme)}
          {users.length} {lang === 'ar' ? 'إجمالي' : 'Total'}
        </div>
        
        {/* Role Chips - Always show counts */}
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          padding: '0.5rem 0.75rem', 
          background: theme === 'dark' ? '#451a03' : '#fef3c7', 
          border: theme === 'dark' ? '1px solid #92400e' : '1px solid #fde68a', 
          borderRadius: '9999px',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: theme === 'dark' ? '#fbbf24' : '#92400e'
        }}>
          {getRoleIconThemed(ROLE_STRINGS.STUDENT)}
          {users.filter(u => u.role === ROLE_STRINGS.STUDENT).length} {lang === 'ar' ? 'طلاب' : 'Students'}
        </div>
        
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          padding: '0.5rem 0.75rem', 
          background: theme === 'dark' ? '#831843' : '#fce7f3', 
          border: theme === 'dark' ? '1px solid #f9a8d4' : '1px solid #fbcfe8', 
          borderRadius: '9999px',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: theme === 'dark' ? '#f9a8d4' : '#831843'
        }}>
          {getRoleIconThemed(ROLE_STRINGS.INSTRUCTOR)}
          {users.filter(u => u.role === ROLE_STRINGS.INSTRUCTOR).length} {lang === 'ar' ? 'مدرسين' : 'Instructors'}
        </div>
        
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          padding: '0.5rem 0.75rem', 
          background: theme === 'dark' ? '#14532d' : '#f0fdf4', 
          border: theme === 'dark' ? '1px solid #22c55e' : '1px solid #bbf7d0', 
          borderRadius: '9999px',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: theme === 'dark' ? '#22c55e' : '#166534'
        }}>
          {getRoleIconThemed(ROLE_STRINGS.ADMIN)}
          {users.filter(u => u.role === ROLE_STRINGS.ADMIN || u.role === ROLE_STRINGS.SUPER_ADMIN).length} {lang === 'ar' ? 'مدراء' : 'Admins'}
        </div>
        
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          padding: '0.5rem 0.75rem', 
          background: theme === 'dark' ? '#0c4a6e' : '#e0f2fe', 
          border: theme === 'dark' ? '1px solid #0ea5e9' : '1px solid #7dd3fc', 
          borderRadius: '9999px',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: theme === 'dark' ? '#0ea5e9' : '#0c4a6e'
        }}>
          {getRoleIconThemed(ROLE_STRINGS.HR)}
          {users.filter(u => u.role === ROLE_STRINGS.HR).length} {lang === 'ar' ? 'موارد بشرية' : 'HR'}
        </div>
      </div>

      {editingUser && (
        <div style={{ 
          padding: '0.75rem 1rem', 
          background: theme === 'dark' ? '#451a03' : '#fef3c7', 
          border: theme === 'dark' ? '1px solid #92400e' : '1px solid #fbbf24', 
          borderRadius: '8px', 
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: theme === 'dark' ? '#fbbf24' : '#92400e'
        }}>
          {getThemedIcon('ui', 'edit', 16, theme)} Editing User: {editingUser.displayName || editingUser.email}
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="dashboard-form">
        {/* Single continuous form - no tabs for performance */}
        <div className="form-row">
          <Input
            type="email"
            ref={emailRef}
            placeholder={t('user_email_placeholder')}
            required
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          />
          <Input
            type="text"
            ref={displayNameRef}
            placeholder={t('user_display_name_placeholder')}
            onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
          />
        </div>
        
        <div className="form-row">
          <Input
            type="text"
            ref={realNameRef}
            placeholder={t('real_name_placeholder') || 'Real Name (First Last)'}
            onChange={(e) => setFormData(prev => ({ ...prev, realName: e.target.value }))}
          />
          <Input
            type="text"
            ref={studentNumberRef}
            placeholder={t('student_number_placeholder') || 'Student Number'}
            required={formData.role === ROLE_STRINGS.STUDENT}
            onChange={(e) => {
              // Update form state when student number changes
              setFormData(prev => ({ ...prev, studentNumber: e.target.value }));
            }}
          />
          <Input
            type="number"
            ref={orderRef}
            placeholder={t('student_order_placeholder') || 'Order/Sequence'}
            description={t('student_order_description') || 'Display order for student lists'}
            onChange={(e) => setFormData(prev => ({ ...prev, sequence: e.target.value }))}
          />
          {/* Multi-Role Select */}
          <MultiSelect
            options={[
              { value: ROLE_STRINGS.STUDENT, label: t('student') || 'Student', icon: getRoleIconThemed(ROLE_STRINGS.STUDENT), color: getRoleIconColor(ROLE_STRINGS.STUDENT) },
              { value: ROLE_STRINGS.INSTRUCTOR, label: t('instructor') || 'Instructor', icon: getRoleIconThemed(ROLE_STRINGS.INSTRUCTOR), color: getRoleIconColor(ROLE_STRINGS.INSTRUCTOR) },
              { value: ROLE_STRINGS.HR, label: t('hr') || 'HR', icon: getRoleIconThemed(ROLE_STRINGS.HR), color: getRoleIconColor(ROLE_STRINGS.HR) },
              { value: ROLE_STRINGS.ADMIN, label: t('admin') || 'Admin', icon: getRoleIconThemed(ROLE_STRINGS.ADMIN), color: getRoleIconColor(ROLE_STRINGS.ADMIN) },
              { value: ROLE_STRINGS.SUPER_ADMIN, label: t('super_admin') || 'Super Admin', icon: getRoleIconThemed(ROLE_STRINGS.SUPER_ADMIN), color: getRoleIconColor(ROLE_STRINGS.SUPER_ADMIN) }
            ]}
            value={formData.roles}
            onChange={(newRoles) => {
              setFormData(prev => ({ ...prev, roles: newRoles }));
              
              // Update primary role to first selected role
              if (newRoles.length > 0) {
                setFormData(prev => ({ ...prev, role: newRoles[0] }));
              } else {
                setFormData(prev => ({ ...prev, role: ROLE_STRINGS.STUDENT }));
              }
            }}
            placeholder={t('select_roles') || 'Select roles...'}
            searchable={true}
            style={{ flex: 1 }}
          />
          {/* Primary role text removed for cleaner UI */}
        </div>

        {!editingUser && (
          <div className="form-row flex-row">
            <ToggleSwitch
              label="Create user in Keycloak"
              checked={autoAddToKeycloak}
              onChange={(checked) => setAutoAddToKeycloak(checked)}
            />
          </div>
        )}

        <div className="form-actions">
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button type="submit" variant="primary" loading={saving}>
              {editingUser ? t('update') : t('save')}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => resetForm(true)}
            >
              {t('cancel') || 'Cancel'}
            </Button>
          </div>
        </div>
      </form>

      <div style={{ marginTop: '1rem' }}>
        {/* No loading state needed - GlobalLoading handles initial page load */}
        {pageState === PAGE_STATES.ERROR ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: theme === 'dark' ? '#f87171' : '#ef4444' }}>{t('error_loading_users') || 'Error loading users'}</p>
            <Button onClick={() => debouncedLoadData(true)} style={{ marginTop: '1rem' }}>
              {getThemedIcon('ui', 'refresh', 16, theme)} {t('retry') || 'Retry'}
            </Button>
          </div>
        ) : (
          <>
            <ConfirmModal
              isOpen={confirmModal.isOpen}
              onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              onConfirm={confirmModal.onConfirm}
              title={confirmModal.title}
              message={confirmModal.message}
              confirmText={confirmModal.confirmText}
              variant={confirmModal.variant}
              size="small"
            />

            {/* Password Reset Modal - temporarily hidden */}
            {/* <ConfirmModal
              isOpen={passwordResetModal.isOpen}
              onClose={() => setPasswordResetModal({ isOpen: false, user: null, newPassword: '', isKeycloakUser: false, loading: false })}
              onConfirm={handlePasswordResetConfirm}
              title="Reset Password"
              confirmText="Reset Password"
              variant="danger"
              size="medium"
              customContent={
                passwordResetModal.isOpen && (
                  <div style={{ padding: '1rem 0' }}>
                    <div style={{ marginBottom: '1rem' }}>
                      <strong>User:</strong> {passwordResetModal.user?.email}<br />
                      <strong>Name:</strong> {passwordResetModal.user?.displayName || 'N/A'}<br />
                      <strong>Keycloak User:</strong> {passwordResetModal.isKeycloakUser ? 'Yes' : 'No'}
                    </div>
                    
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        New Password:
                      </label>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <Input
                          type="text"
                          value={passwordResetModal.newPassword}
                          onChange={(e) => setPasswordResetModal(prev => ({ ...prev, newPassword: e.target.value }))}
                          placeholder={t('users.password_placeholder', 'Enter new password or generate one')}
                          style={{ flex: 1 }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleGeneratePassword}
                          disabled={passwordResetModal.loading}
                        >
                          {getThemedIcon('ui', 'refresh', 16, theme)} Generate
                        </Button>
                      </div>
                      {passwordResetModal.newPassword && (
                        <div style={{ 
                          marginTop: '0.5rem', 
                          fontSize: '0.875rem',
                          color: passwordResetModal.newPassword.length >= 8 ? '#16a34a' : '#dc2626'
                        }}>
                          Password strength: {passwordResetModal.newPassword.length >= 8 ? 'Good' : 'Too short (min 8 chars)'}
                        </div>
                      )}
                    </div>
                    
                    {passwordResetModal.isKeycloakUser && (
                      <div style={{ 
                        padding: '0.75rem', 
                        backgroundColor: theme === 'dark' ? '#1e3a8a' : '#eff6ff',
                        border: `1px solid ${theme === 'dark' ? '#3b82f6' : '#bfdbfe'}`,
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        color: theme === 'dark' ? '#93c5fd' : '#1e40af'
                      }}>
                        {getThemedIcon('ui', 'info', 14, theme)} 
                        This will update the password in Keycloak and the user will be able to login with the new password immediately.
                      </div>
                    )}
                  </div>
                )
              }
            /> */}
            
            <AdvancedDataGrid
              key={`users-grid-${gridRefreshKey}`}
              rows={filteredUsers}
              getRowId={(row) => row.docId || row.id}
              columns={gridColumns}
              pageSize={20}
              pageSizeOptions={[10, 20, 50, 100]}
              density="compact"
              checkboxSelection
              exportFileName="users"
              showExportButton
              exportLabel={t('export') || 'Export'}
              width="100%"
              sx={{
                '& .MuiDataGrid-root': {
                  border: 'none',
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb',
                },
                '& .MuiDataGrid-virtualScroller': {
                  backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
                }
              }}
            />
          </>
        )}
      </div>
      
      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={hideDeleteModal}
        onConfirm={handleDeleteConfirm}
        entityType={deleteModal.entityType}
        entityName={deleteModal.entityName}
        relatedRecords={deleteModal.relatedRecords}
        loading={saving}
        theme={theme}
        t={t}
      />
      
      {/* QR Email Modal */}
      <QREmailModal
        isOpen={isQREmailModalOpen}
        onClose={hideQREmailModal}
        student={qrEmailStudent}
        t={t}
      />
    </div>
  );
};

export default UsersPage;
