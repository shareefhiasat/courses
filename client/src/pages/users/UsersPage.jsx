import React, { useState, useEffect, useMemo, useCallback, useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@contexts/ThemeContext';
import { useLang } from '@contexts/LangContext';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@ui';
import logger from '@utils/logger';
import { getQatarTimeAgo, formatQatarDate } from '@utils/timezone';
import { getThemedIcon } from '@constants/iconTypes';
import { ROLE_STRINGS } from '@utils/userUtils';
import { ACTIVITY_LOG_TYPES } from '@services/other/activityLogger';
import { Button, Input, Select, ToggleSwitch, AdvancedDataGrid, Card, CardBody, ConfirmModal } from '@ui';
import { DeleteModal, useDeleteModal } from '@ui';
import { QREmailModal, useQREmailModal } from '@ui';
import { ProgramsSelect } from '@ui';
import { getUsers, addUser, updateUser, deleteUser as deleteUserFromService, deleteStudent, disableUser, enableUser, isUserDisabledAtUserLevel, isStudent, isAdmin as isAdminUser } from '@services/business/userService';
import { getPrograms } from '@services/business/programService';
import { getClasses } from '@services/business/classService';
import { getSubjects } from '@services/business/programService';
import { getEnrollments } from '@services/business/enrollmentService';
import { getAllowlist } from '@services/other/config';
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
  
  // Allowlist state (previously was props)
  const [autoAddToAllowlist, setAutoAddToAllowlist] = useState(true);
  const [allowlist, setAllowlist] = useState(() => {
    logger.info('🔧 USER_PAGE: Initializing allowlist state', { timestamp: new Date().toISOString() });
    return { allowedEmails: [], adminEmails: [], allowedStudents: [], allowedInstructors: [], allowedHr: [], superAdmins: [] };
  });
  
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
    role: ROLE_STRINGS.STUDENT,
    studentNumber: '',
    order: ''
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

  const loadData = useCallback(async (isInitial = false) => {
    if (!isAdmin && !isSuperAdmin) {
      setPageState(PAGE_STATES.ERROR);
      return;
    }
    
    if (!isInitial) setPageState(PAGE_STATES.LOADING);
    try {
      logger.info('USER_PAGE: Loading users and reference data', { 
        timestamp: new Date().toISOString()
      });
      
      const [usersResult, programsResult, classesResult, subjectsResult, enrollmentsResult, allowlistResult] = await Promise.all([
        getUsers(),
        getPrograms(),
        getClasses(),
        getSubjects(),
        getEnrollments(),
        getAllowlist().catch(error => {
          logger.warn('USER_PAGE: Failed to load allowlist', { error: error.message });
          return { success: false, data: { allowedEmails: [], adminEmails: [], allowedStudents: [], superAdmins: [] } };
        })
      ]);
      
      if (usersResult.success) {
        setUsers(usersResult.data || []);
        logger.info('USER_PAGE: Successfully loaded users', { count: usersResult.data?.length || 0 });
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
      
      // Load allowlist data
      if (allowlistResult.success) {
        setAllowlist(allowlistResult.data || { allowedEmails: [], adminEmails: [], allowedStudents: [], allowedInstructors: [], allowedHr: [], superAdmins: [] });
        logger.info('USER_PAGE: Successfully loaded allowlist', { 
          allowedEmails: allowlistResult.data?.allowedEmails?.length || 0,
          adminEmails: allowlistResult.data?.adminEmails?.length || 0,
          allowedStudents: allowlistResult.data?.allowedStudents?.length || 0,
          allowedInstructors: allowlistResult.data?.allowedInstructors?.length || 0,
          allowedHr: allowlistResult.data?.allowedHr?.length || 0,
          superAdmins: allowlistResult.data?.superAdmins?.length || 0
        });

        // Merge actual users with invited users from allowlist
        if (usersResult.success) {
          const actualUsers = usersResult.data || [];
          const allowlistData = allowlistResult.data || {};
          
          // Get all invited emails from allowlist
          const invitedEmails = [
            ...(allowlistData.allowedEmails || []),
            ...(allowlistData.adminEmails || []),
            ...(allowlistData.allowedStudents || []),
            ...(allowlistData.allowedInstructors || []),
            ...(allowlistData.allowedHr || []),
            ...(allowlistData.superAdmins || [])
          ];

          // Find invited users who haven't signed up yet
          const invitedUsers = invitedEmails
            .filter(email => !actualUsers.some(user => user.email === email))
            .map(email => {
              // Determine role from allowlist arrays
              let role = ROLE_STRINGS.STUDENT; // default
              if (allowlistData.allowedStudents?.includes(email)) role = ROLE_STRINGS.STUDENT;
              else if (allowlistData.allowedInstructors?.includes(email)) role = ROLE_STRINGS.INSTRUCTOR;
              else if (allowlistData.allowedHr?.includes(email)) role = ROLE_STRINGS.HR;
              else if (allowlistData.adminEmails?.includes(email)) role = ROLE_STRINGS.ADMIN;
              else if (allowlistData.superAdmins?.includes(email)) role = ROLE_STRINGS.SUPER_ADMIN;
              else if (allowlistData.allowedEmails?.includes(email)) role = ROLE_STRINGS.STUDENT; // legacy

              return {
                email: email,
                role: role,
                displayName: email.split('@')[0], // Use email prefix as display name
                realName: '',
                studentNumber: '',
                order: '',
                status: 'invited', // Custom status for invited users
                isInvited: true, // Flag to identify invited users
                createdAt: new Date(), // Use current time as invite time
                disabled: false,
                id: email, // Add unique ID for DataGrid
                docId: email // Add docId for consistency
              };
            });

          // Combine actual users with invited users
          const allUsers = [...actualUsers, ...invitedUsers];
          setUsers(allUsers);
          
          logger.info('USER_PAGE: Successfully loaded users with invited', { 
            actualUsers: actualUsers.length,
            invitedUsers: invitedUsers.length,
            total: allUsers.length
          });
        }
      } else {
        logger.warn('USER_PAGE: Using empty allowlist due to load failure');
        setAllowlist({ allowedEmails: [], adminEmails: [], allowedStudents: [], allowedInstructors: [], allowedHr: [], superAdmins: [] });
      }
      
      setPageState(PAGE_STATES.SUCCESS);
    } catch (error) {
      logger.error('USER_PAGE: Failed to load data', { error: error.message });
      toast?.showError(t('users_failed_to_load_data') + ': ' + error.message);
      setPageState(PAGE_STATES.ERROR);
    }
  }, [isAdmin, isSuperAdmin, t, toast]);

  // Simple initial load without global loading (dashboard tabs handle it)
  useLayoutEffect(() => {
    if (authLoading) return;
    if (!user) return;
    if (!isAdmin && !isSuperAdmin) return;

    loadData(true);
  }, [authLoading, user?.uid, user, isAdmin, isSuperAdmin, loadData]);

  // Handler functions - must be defined before gridColumns
  const handleEditUser = useCallback((user) => {
    logger.info('USER_PAGE: handleEditUser called', {
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
      logger.warn('USER_PAGE: Edit attempted on invited user - blocking', {
        email: user.email,
        reason: 'Invited users cannot be edited. Cancel invitation and re-add instead.'
      });
      toast?.showError('Cannot edit invited users. Cancel invitation and re-add with new details.');
      return;
    }

    // Check if user has proper ID for editing
    const userId = user.id || user.uid || user.email;
    if (!userId) {
      logger.error('USER_PAGE: No valid ID found for editing user', {
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

    logger.info('USER_PAGE: Setting up edit form', {
      userId: userId,
      userEmail: user.email,
      userDisplayName: user.displayName
    });

    setEditingUser(user);
    setFormData({
      email: user.email || '',
      displayName: user.displayName || '',
      realName: user.realName || '',
      studentNumber: user.studentNumber || '',
      order: user.order || '',
      role: user.role || ROLE_STRINGS.STUDENT
    });

    logger.info('USER_PAGE: Edit form setup complete', {
      formData: {
        email: user.email || '',
        displayName: user.displayName || '',
        realName: user.realName || '',
        studentNumber: user.studentNumber || '',
        order: user.order || '',
        role: user.role || ROLE_STRINGS.STUDENT
      }
    });
  }, []);

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
      logger.error('USER_PAGE: Failed to load related records for delete:', error);
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
            await loadData();
          } else {
            toast?.showError(result.error || t('users_failed_to_disable_user'));
          }
        } catch (error) {
          logger.error('USER_PAGE: Failed to soft delete user:', error);
          toast?.showError(t('users_error', { error: error.message }));
        }
      }, relatedRecords);
    } else {
      deleteUser(userToDelete, async () => {
        try {
          const result = await deleteStudent(userId);
          if (result.success) {
            toast?.showSuccess(t('users_deleted_successfully'));
            await loadData();
          } else {
            toast?.showError(result.error || t('users_failed_to_delete_user'));
          }
        } catch (error) {
          logger.error('USER_PAGE: Failed to delete student:', error);
          toast?.showError(t('users_error', { error: error.message }));
        }
      }, relatedRecords);
    }
  }, [deleteUser, toast, loadData, enrollments, t]);

  const handleToggleUserStatus = useCallback(async (user) => {
    // Allow disabling any user (including admins) - only restriction is for delete
    const isCurrentlyDisabled = isUserDisabledAtUserLevel(user);
    const action = isCurrentlyDisabled ? 'enable' : 'disable';

    logger.info('USER_PAGE: handleToggleUserStatus called', {
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
          
          logger.info('USER_PAGE: Confirming user status change', {
            userId: userId,
            currentDisabled: isCurrentlyDisabled,
            newDisabledState: newDisabledState,
            action: action
          });

          // Call the appropriate Cloud Function
          const result = newDisabledState 
            ? await disableUser(userId)
            : await enableUser(userId);
          
          logger.info('USER_PAGE: Cloud function result', {
            userId: userId,
            action: action,
            success: result.success,
            payload: result.payload
          });
          
          if (result.success) {
            // Close modal first
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
            
            logger.info('USER_PAGE: User status update successful', {
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
        
        logger.info('USER_PAGE: About to reload data after status change', {
          timestamp: new Date().toISOString(),
          userId: userId,
          action: action
        });
        
        // Force reload data with timestamp to ensure fresh data
        await loadData(true);
        
        // Force grid re-render to update button states
        setGridRefreshKey(prev => prev + 1);
        
        logger.info('USER_PAGE: Data reload completed after status change', {
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
          logger.error('Error:', error);
          toast?.showError(t('users_action_failed', { error: error.message }));
        }
      }
    });
  }, [toast, loadData, t]);

  const handleResetPassword = useCallback(async (email) => {
    // Show confirmation modal
    setConfirmModal({
      isOpen: true,
      title: t('users_reset_password'),
      message: t('users_reset_password_confirmation', { email }),
      confirmText: t('users_reset_password'),
      variant: 'danger',
      onConfirm: async () => {
        try {
      const { sendPasswordResetEmail } = await import('firebase/auth');
      const { auth } = await import('@services/other/config');
      await sendPasswordResetEmail(auth, email);
      
      // Close modal on success
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
      toast?.showSuccess(t('users_password_reset_email_sent', { email }));
    } catch (error) {
          // Close modal on error too
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          logger.error('Error:', error);
          toast?.showError(t('users_action_failed', { error: error.message }));
        }
      }
    });
  }, [toast, t]);

  const handleSendWelcomeEmail = useCallback(async (email, role, displayName) => {
    // Show confirmation modal
    setConfirmModal({
      isOpen: true,
      title: t('send_welcome_email') || 'Send Welcome Email',
      message: t('send_welcome_email_confirmation', { email }) || `Send welcome email to ${email}?`,
      confirmText: t('send_email') || 'Send Email',
      variant: 'primary',
      onConfirm: async () => {
        try {
          const { sendUserWelcomeEmail } = await import('@services/business/notificationService');
          const result = await sendUserWelcomeEmail({
            email: email,
            role: role,
            displayName: displayName,
            userId: email // Use email as userId for now
          });
          
          if (result.success) {
            toast?.showSuccess(t('welcome_email_sent') || 'Welcome email sent successfully!');
            logger.info('✅ Welcome email sent manually via consolidated service', { email, role });
          } else {
            toast?.showError(t('welcome_email_failed') || 'Failed to send welcome email');
            logger.error('❌ Failed to send welcome email via consolidated service', { email, role, error: result.error });
          }
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          logger.error('Error:', error);
          toast?.showError(t('users_action_failed', { error: error.message }));
        }
      }
    });
  }, [toast, t]);

  const handleRemoveFromAllowlist = useCallback(async (email, role) => {
    // Show confirmation modal
    setConfirmModal({
      isOpen: true,
      title: t('remove_invitation') || 'Remove Invitation',
      message: t('remove_invitation_confirmation', { email }) || `Remove invitation for ${email}? They will no longer be able to sign up.`,
      confirmText: t('remove') || 'Remove',
      variant: 'danger',
      onConfirm: async () => {
        try {
          // Import allowlist functions
          const { getAllowlist, updateAllowlist } = await import('@services/other/config');
          
          // Get current allowlist
          const allowlistResult = await getAllowlist();
          if (!allowlistResult.success) {
            throw new Error('Failed to load allowlist');
          }
          
          const allowlistData = allowlistResult.data;
          let newAllowlist = { ...allowlistData };
          
          // Remove from appropriate array based on role
          if (role === ROLE_STRINGS.STUDENT) {
            if (newAllowlist.allowedStudents?.includes(email)) {
              newAllowlist.allowedStudents = newAllowlist.allowedStudents.filter(e => e !== email);
            } else if (newAllowlist.allowedEmails?.includes(email)) {
              newAllowlist.allowedEmails = newAllowlist.allowedEmails.filter(e => e !== email);
            }
          } else if (role === ROLE_STRINGS.INSTRUCTOR) {
            newAllowlist.allowedInstructors = newAllowlist.allowedInstructors?.filter(e => e !== email) || [];
          } else if (role === ROLE_STRINGS.HR) {
            newAllowlist.allowedHr = newAllowlist.allowedHr?.filter(e => e !== email) || [];
          } else if (role === ROLE_STRINGS.ADMIN) {
            newAllowlist.adminEmails = newAllowlist.adminEmails?.filter(e => e !== email) || [];
          } else if (role === ROLE_STRINGS.SUPER_ADMIN) {
            // Don't allow removing SuperAdmins from allowlist
            toast?.showError('Cannot remove SuperAdmin invitation');
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
            return;
          }
          
          // Save updated allowlist
          const updateResult = await updateAllowlist(newAllowlist);
          if (updateResult.success) {
            toast?.showSuccess(t('invitation_removed') || 'Invitation removed successfully');
            logger.info('✅ Invitation removed successfully', { email, role });
            
            // Reload data to update the grid
            loadData(true);
          } else {
            throw new Error(updateResult.error);
          }
          
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          logger.error('Error removing invitation:', error);
          toast?.showError(t('failed_to_remove_invitation') || 'Failed to remove invitation');
        }
      }
    });
  }, [toast, t, loadData]);

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
  }, [editingUser, formData]);

  // Read text values from refs into form state before submit
  const syncRefsToState = useCallback(() => {
    return {
      email: emailRef.current?.value ?? formData.email,
      displayName: displayNameRef.current?.value ?? formData.displayName,
      realName: formData.realName,
      studentNumber: formData.studentNumber,
      order: formData.order,
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
        if (statusFilter === 'active') return !isUserDisabledAtUserLevel(user);
        if (statusFilter === 'disabled') return isUserDisabledAtUserLevel(user);
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
      field: 'studentNumber', 
      headerName: t('student_number') || 'Student Number', 
      width: 140,
      renderCell: (params) => {
        return (
          <span style={{ 
            fontFamily: 'monospace', 
            fontSize: '0.875rem',
            color: '#059669',
            fontWeight: 600
          }}>
            {params.value || '—'}
          </span>
        );
      }
    },
    {
      field: 'order', 
      headerName: t('order') || 'Order', 
      width: 120,
      renderCell: (params) => {
        // Debug logging for order column
        if (params.row.email === 'hafole1668@hutudns.com') {
          console.log('ORDER COLUMN DEBUG:', {
            value: params.value,
            row: params.row,
            hasOrder: !!params.value,
            orderType: typeof params.value,
            allFields: Object.keys(params.row)
          });
        }
        
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
      field: 'role', headerName: t('role_col'), width: 180,
      renderCell: (params) => {
        // Get all roles from boolean flags
        const userRoles = [];
        if (params.row.isSuperAdmin) userRoles.push(ROLE_STRINGS.SUPER_ADMIN);
        if (params.row.isAdmin) userRoles.push(ROLE_STRINGS.ADMIN);
        if (params.row.isInstructor) userRoles.push(ROLE_STRINGS.INSTRUCTOR);
        if (params.row.isHR) userRoles.push(ROLE_STRINGS.HR);
        if (params.row.isStudent) userRoles.push(ROLE_STRINGS.STUDENT);
        
        // Fallback to role field if no boolean flags
        if (userRoles.length === 0) {
          const fallbackRole = params.row.role || params.value || ROLE_STRINGS.STUDENT;
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
          [ROLE_STRINGS.SUPER_ADMIN]: '#f59e0b',
          [ROLE_STRINGS.ADMIN]: '#4f46e5', 
          [ROLE_STRINGS.INSTRUCTOR]: '#0ea5e9',
          [ROLE_STRINGS.HR]: '#8b5cf6',
          [ROLE_STRINGS.STUDENT]: '#16a34a'
        };
        
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
            {userRoles.map((role, idx) => {
              const icon = roleIcons[role] || roleIcons[ROLE_STRINGS.STUDENT];
              const color = roleColors[role] || roleColors[ROLE_STRINGS.STUDENT];
              const displayName = role.replace(/_/g, ' ');
              
              return (
                <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <span style={{ color }}>{icon}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 500, textTransform: 'capitalize' }}>
                    {displayName}
                  </span>
                  {idx < userRoles.length - 1 && <span style={{ color: '#9ca3af' }}>,</span>}
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
        
        const isDisabled = isUserDisabledAtUserLevel(params.row);
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
      field: 'createdAt', headerName: t('joined'), width: 220,
      valueGetter: (params) => params.value,
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
      field: 'actions', headerName: t('actions_col'), width: 350, sortable: false, filterable: false,
      renderCell: (params) => (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {params.row.isInvited ? (
            // Invited users get limited actions
            <>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => handleSendWelcomeEmail(params.row.email, params.row.role, params.row.displayName)}
                title={t('resend_welcome_email') || 'Resend Welcome Email'}
                style={{ border: 'none' }}
              >
                {getThemedIcon('ui', 'mail', 16, theme)}
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => handleRemoveFromAllowlist(params.row.email, params.row.role)}
                title={t('remove_invitation') || 'Remove Invitation'}
                style={{ border: 'none', color: '#dc2626' }}
              >
                {getThemedIcon('ui', 'x', 16, theme)}
              </Button>
            </>
          ) : (
            // Existing users get full actions
            <>
              {/* Edit button - always first */}
              {(() => {
                const isSuperAdminUser = params.row.isSuperAdmin || params.row.role === ROLE_STRINGS.SUPER_ADMIN;
                const currentUserIsSuperAdmin = user?.isSuperAdmin || user?.role === ROLE_STRINGS.SUPER_ADMIN;
                const canEdit = !isSuperAdminUser || currentUserIsSuperAdmin;
                
                logger.info('USER_PAGE: Edit button rendering', {
                  userEmail: params.row.email,
                  userId: params.row.id,
                  isInvited: params.row.isInvited,
                  canEdit: canEdit,
                  isSuperAdminUser: isSuperAdminUser,
                  currentUserIsSuperAdmin: currentUserIsSuperAdmin
                });
                
                return (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    icon={getThemedIcon('ui', 'edit', 16, theme)} 
                    onClick={() => {
                      logger.info('USER_PAGE: Edit button clicked', {
                        userEmail: params.row.email,
                        userId: params.row.id,
                        isInvited: params.row.isInvited,
                        canEdit: canEdit
                      });
                      handleEditUser(params.row);
                    }}
                    disabled={!canEdit}
                    title={canEdit ? (t('edit') || 'Edit') : 'Only Super Admin can edit Super Admin'}
                    style={{ opacity: canEdit ? 1 : 0.5 }}
                  >
                    {t('edit') || 'Edit'}
                  </Button>
                );
              })()}
              
              {/* Reset Password button - always second */}
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => handleResetPassword(params.row.email)}
                title={t('reset_password') || 'Reset Password'}
                style={{ border: 'none' }}
              >
                {getThemedIcon('ui', 'key_round', 16, theme)}
              </Button>
              
              {/* Welcome Email button - third (beside reset password) */}
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => handleSendWelcomeEmail(params.row.email, params.row.role, params.row.displayName)}
                title={t('send_welcome_email') || 'Send Welcome Email'}
                style={{ border: 'none' }}
              >
                {getThemedIcon('ui', 'mail', 16, theme)}
              </Button>
              
              {/* Disable/Enable button - fourth */}
              <Button 
                size="sm" 
                variant="ghost" 
                icon={isUserDisabledAtUserLevel(params.row) ? getThemedIcon('ui', 'user_check', 16, theme) : getThemedIcon('ui', 'user_x', 16, theme)}
                style={{ color: isUserDisabledAtUserLevel(params.row) ? '#28a745' : '#dc2626' }}
                onClick={() => handleToggleUserStatus(params.row)}
                title={isUserDisabledAtUserLevel(params.row) ? 'Enable' : 'Disable'}
                // Remove the admin restriction - allow disable for all users
              >
                {isUserDisabledAtUserLevel(params.row) ? 'Enable' : 'Disable'}
              </Button>
              
              {/* QR Code buttons - fifth and sixth */}
              {(() => {
                // Check if user has student role from boolean flags
                const hasStudentRole = isStudent(params.row);
                const isSuperAdminUser = params.row.isSuperAdmin || params.row.role === ROLE_STRINGS.SUPER_ADMIN;
                const isInstructorUser = params.row.isInstructor || params.row.role === ROLE_STRINGS.INSTRUCTOR;

                // Show QR code for students (functional), super admins, and instructors (disabled)
                if (params.row.studentNumber && (hasStudentRole || isSuperAdminUser || isInstructorUser)) {
                  const canUseQR = hasStudentRole;
                  let title;
                  
                  if (canUseQR) {
                    title = t('view_qr_code') || 'View QR Code';
                  } else if (isSuperAdminUser && isInstructorUser) {
                    title = 'QR Code (Student only) - Super Admin & Instructor';
                  } else if (isSuperAdminUser) {
                    title = 'QR Code (Student only) - Super Admin';
                  } else if (isInstructorUser) {
                    title = 'QR Code (Student only) - Instructor';
                  } else {
                    title = 'QR Code (Student only)';
                  }
                  
                  return (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => canUseQR && openQRCodeInNewTab(params.row)}
                        title={title}
                        disabled={!canUseQR}
                        style={{ opacity: canUseQR ? 1 : 0.5, border: 'none' }}
                      >
                        {getThemedIcon('ui', 'qr_code', 16, theme)}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => canUseQR && handleSendQRCodeEmail(params.row)}
                        title={canUseQR ? 'Send QR Code Email' : 'QR Code Email (Student only)'}
                        disabled={!canUseQR}
                        style={{ opacity: canUseQR ? 1 : 0.5, border: 'none' }}
                      >
                        {getThemedIcon('ui', 'qr_code', 16, theme)}
                      </Button>
                    </>
                  );
                }
                return null; // Don't show QR buttons if no student number
              })()}
              
              {/* Delete button - always last */}
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
            </>
          )}
        </div>
      )
    }
  ], [t, theme, handleEditUser, openQRCodeInNewTab, handleSendQRCodeEmail, handleResetPassword, handleSendWelcomeEmail, handleRemoveFromAllowlist, handleToggleUserStatus, handleDeleteUser, user?.isSuperAdmin, user?.role]);

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
    logger.info('USER_PAGE: Form submit started', {
      timestamp: new Date().toISOString(),
      editingUser: editingUser ? {
        id: editingUser.id,
        email: editingUser.email,
        displayName: editingUser.displayName,
        isInvited: editingUser.isInvited,
        hasId: !!editingUser.id,
        hasUid: !!editingUser.uid
      } : null,
      isEditMode: !!editingUser,
      isCurrentlySaving: saving
    });

    // Prevent duplicate submissions
    if (saving) {
      logger.warn('USER_PAGE: Form submit blocked - already saving', {
        timestamp: new Date().toISOString(),
        isSaving: saving
      });
      return;
    }

    e.preventDefault();
    const textValues = syncRefsToState();
    
    logger.info('USER_PAGE: Form values collected', {
      textValues: {
        email: textValues.email,
        displayName: textValues.displayName,
        realName: textValues.realName,
        studentNumber: textValues.studentNumber,
        order: textValues.order,
        role: textValues.role
      }
    });
    
    if (!textValues.email.trim()) {
      logger.warn('USER_PAGE: Validation failed - email empty');
      toast?.showError('Email is required');
      return;
    }

    // Validate student number is required for students
    if (formData.role === ROLE_STRINGS.STUDENT && !textValues.studentNumber?.trim()) {
      logger.warn('USER_PAGE: Validation failed - student number required for student');
      toast?.showError('Student number is required for students');
      return;
    }

    // Validate email uniqueness across all users
    const emailDuplicate = users.some(user => 
      user.email === textValues.email.trim() && 
      (user.id !== editingUser?.id && user.email !== editingUser?.email)
    );
    
    if (emailDuplicate) {
      logger.warn('USER_PAGE: Validation failed - email duplicate', {
        newEmail: textValues.email.trim(),
        editingUserEmail: editingUser?.email
      });
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
        logger.warn('USER_PAGE: Validation failed - student number duplicate', {
          newStudentNumber: textValues.studentNumber.trim(),
          editingUserStudentNumber: editingUser?.studentNumber
        });
        toast?.showError('Student number must be unique. This student number is already in use.');
        return;
      }
    }

    logger.info('USER_PAGE: Validation passed, proceeding with submit');
    setSaving(true);
    try {
      const submitData = {
        ...formData,
        ...textValues
      };
      
      logger.info('USER_PAGE: Submit data prepared', {
        submitData: {
          email: submitData.email,
          displayName: submitData.displayName,
          realName: submitData.realName,
          studentNumber: submitData.studentNumber,
          order: submitData.order,
          role: submitData.role
        }
      });
      
      if (editingUser) {
        logger.info('USER_PAGE: Attempting to update user', {
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
        logger.info('USER_PAGE: User ID determined for update', {
          userId: userId,
          idSource: editingUser.id ? 'id' : editingUser.uid ? 'uid' : editingUser.email ? 'email' : 'unknown'
        });
        
        if (!userId) {
          logger.error('USER_PAGE: No valid user ID found for update', { 
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

        logger.info('USER_PAGE: Calling updateUser service', {
          userId: userId,
          serviceFunction: 'updateUser'
        });
        
        const result = await updateUser(userId, submitData);
        
        logger.info('USER_PAGE: Update service response received', {
          success: result.success,
          error: result.error,
          userId: userId
        });
        
        if (!result.success) {
          logger.error('USER_PAGE: Update failed', {
            error: result.error,
            userId: userId
          });
          throw new Error(result.error || 'Failed to update user');
        }

        logger.info('USER_PAGE: Update successful, logging activity');
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
          logger.info('USER_PAGE: Calling loadData after user update', {
            timestamp: new Date().toISOString(),
            userId: userId
          });
          await loadData();
        }
        resetForm();
      } else {
        // Add to allowlist if checkbox is checked
        if (autoAddToAllowlist && submitData.email) {
          // Validate student number is required for student invites
          if (submitData.role === ROLE_STRINGS.STUDENT && !submitData.studentNumber?.trim()) {
            logger.warn('❌ USER_PAGE: Student invite rejected - missing student number', {
              email: submitData.email,
              role: submitData.role,
              timestamp: new Date().toISOString()
            });
            toast?.showError('Student number is required for student invites. Please provide a student number.');
            return;
          }

          // Validate student number uniqueness for student invites
          if (submitData.role === ROLE_STRINGS.STUDENT && submitData.studentNumber?.trim()) {
            const studentNumberDuplicate = users.some(user => 
              user.studentNumber === submitData.studentNumber.trim()
            );
            
            logger.info('🔧 USER_PAGE: Checking student number uniqueness for invite', {
              email: submitData.email,
              studentNumber: submitData.studentNumber.trim(),
              isDuplicate: studentNumberDuplicate,
              existingUsers: users.filter(u => u.studentNumber).length
            });
            
            if (studentNumberDuplicate) {
              logger.warn('❌ USER_PAGE: Student invite rejected - duplicate student number', {
                email: submitData.email,
                studentNumber: submitData.studentNumber.trim(),
                timestamp: new Date().toISOString()
              });
              toast?.showError('Student number must be unique. This student number is already assigned to another user.');
              return;
            }
          }

          logger.info('🔧 USER_PAGE: Adding user to allowlist', {
            email: submitData.email,
            role: submitData.role,
            studentNumber: submitData.studentNumber,
            autoAddToAllowlist: autoAddToAllowlist,
            timestamp: new Date().toISOString()
          });

          // Log validation success for students
          if (submitData.role === ROLE_STRINGS.STUDENT) {
            logger.info('✅ USER_PAGE: Student invite validation passed', {
              email: submitData.email,
              studentNumber: submitData.studentNumber,
              timestamp: new Date().toISOString()
            });
          }

          const { updateAllowlist } = await import('@services/other/config');
          
          // Use specific arrays for each role (new structure)
          let targetList;
          switch (submitData.role) {
            case ROLE_STRINGS.STUDENT:
              targetList = 'allowedStudents';
              break;
            case ROLE_STRINGS.INSTRUCTOR:
              targetList = 'allowedInstructors';
              break;
            case ROLE_STRINGS.HR:
              targetList = 'allowedHr';
              break;
            case ROLE_STRINGS.ADMIN:
              targetList = 'adminEmails';
              break;
            default:
              targetList = 'adminEmails'; // fallback
          }
          const currentEmails = allowlist[targetList] || [];

          logger.info('🔧 USER_PAGE: Allowlist target determined', {
            targetList: targetList,
            currentEmails: currentEmails,
            emailExists: currentEmails.includes(submitData.email)
          });

          if (!currentEmails.includes(submitData.email)) {
            const updatedAllowlist = {
              ...allowlist,
              [targetList]: [...currentEmails, submitData.email]
            };
            setAllowlist(updatedAllowlist);

            logger.info('🔧 USER_PAGE: Saving updated allowlist', {
              updatedAllowlist: updatedAllowlist,
              targetList: targetList
            });

            // Save to Firestore
            try {
              const result = await updateAllowlist(updatedAllowlist);
              if (result.success) {
                logger.info('✅ USER_PAGE: Successfully added to allowlist', {
                  email: submitData.email,
                  role: submitData.role,
                  targetList: targetList
                });

                // Send welcome email
                try {
                  const { sendUserWelcomeEmail } = await import('@services/business/notificationService');
                  const emailResult = await sendUserWelcomeEmail({
                    email: submitData.email,
                    role: submitData.role,
                    displayName: submitData.displayName,
                    userId: submitData.email // Use email as userId for now
                  });
                  
                  if (emailResult.success) {
                    logger.info('📧 USER_PAGE: Welcome email sent successfully via consolidated service', {
                      email: submitData.email,
                      role: submitData.role
                    });
                    toast?.showSuccess(t('user_added_and_email_sent') || 'User added and welcome email sent!');
                  } else {
                    logger.warn('⚠️ USER_PAGE: Welcome email failed, but user was added', {
                      email: submitData.email,
                      role: submitData.role,
                      error: emailResult.error
                    });
                    toast?.showSuccess(t('user_added_email_failed') || 'User added, but email failed to send');
                  }
                } catch (emailError) {
                  logger.error('❌ USER_PAGE: Exception sending welcome email', {
                    email: submitData.email,
                    role: submitData.role,
                    error: emailError.message
                  });
                  toast?.showSuccess(t('user_added_email_failed') || 'User added, but email failed to send');
                }
              } else {
                logger.error('❌ USER_PAGE: Failed to update allowlist', {
                  error: result.error,
                  email: submitData.email,
                  role: submitData.role
                });
                toast?.showError(t('failed_to_update_allowlist') || 'Failed to update allowlist');
              }
            } catch (allowlistError) {
              logger.error('❌ USER_PAGE: Exception updating allowlist', {
                error: allowlistError.message,
                email: submitData.email,
                role: submitData.role,
                stack: allowlistError.stack
              });
              toast?.showError(t('failed_to_update_allowlist') || 'Failed to update allowlist');
            }
          } else {
            logger.info('ℹ️ USER_PAGE: Email already exists in allowlist', {
              email: submitData.email,
              role: submitData.role,
              targetList: targetList
            });
          }
          
          toast?.showSuccess(`✅ ${submitData.role === ROLE_STRINGS.STUDENT ? 'Student' : submitData.role.toUpperCase()} invitation prepared!\n\n📧 Email: ${submitData.email}\n🎯 Role: ${submitData.role}\n📋 Next steps: Ask them to check their email and sign up to activate their account.\n\nThey will receive their role permissions automatically after signing up.`);
        } else {
          logger.info('ℹ️ USER_PAGE: No allowlist update - checkbox disabled or no email', {
            autoAddToAllowlist: autoAddToAllowlist,
            email: submitData.email,
            role: submitData.role
          });
          toast?.showInfo(t('no_changes_saved_provide_email_or_enable_allowlist') || 'No changes saved. Provide an email or enable allowlist option.');
        }
      }

      // Only reload if editing (not adding new user to allowlist)
      if (editingUser) {
        logger.info('USER_PAGE: Calling loadData after user update', {
          timestamp: new Date().toISOString(),
          userId: userId
        });
        await loadData();
      }
      resetForm();
    } catch (error) {
      toast?.showError('Error: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = useCallback((clearRefs = true) => {
    logger.info('USER_PAGE: resetForm called', {
      timestamp: new Date().toISOString(),
      clearRefs: clearRefs,
      hadEditingUser: !!editingUser
    });
    
    setEditingUser(null);
    setFormData({
      email: '',
      displayName: '',
      realName: '',
      role: ROLE_STRINGS.STUDENT,
      studentNumber: '',
      order: ''
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
      <p style={{ color: '#555', marginBottom: '1rem' }}>{t('invite_users_blurb')}</p>

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
        border: theme === 'dark' ? '1px solid #374151' : 'none',
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
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder={t('user_email_placeholder')}
            required
          />
          <Input
            type="text"
            value={formData.displayName}
            onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
            placeholder={t('user_display_name_placeholder')}
          />
        </div>
        
        <div className="form-row">
          <Input
            type="text"
            value={formData.realName}
            onChange={(e) => setFormData(prev => ({ ...prev, realName: e.target.value }))}
            placeholder={t('real_name_placeholder') || 'Real Name (First Last)'}
          />
          <Input
            type="text"
            value={formData.studentNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, studentNumber: e.target.value }))}
            placeholder={t('student_number_placeholder') || 'Student Number'}
            required={formData.role === ROLE_STRINGS.STUDENT}
          />
          <Input
            type="number"
            value={formData.order}
            onChange={(e) => setFormData(prev => ({ ...prev, order: e.target.value }))}
            placeholder={t('student_order_placeholder') || 'Order/Sequence'}
            description={t('student_order_description') || 'Display order for student lists'}
          />
          <Select
            value={formData.role}
            searchable
            placeholder={t('role') || 'Role'}
            onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
            options={[
              { value: ROLE_STRINGS.STUDENT, label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: getRoleIconColor(ROLE_STRINGS.STUDENT) }}>
                    {getRoleIconThemed(ROLE_STRINGS.STUDENT)}
                  </span>
                  {t('student') || 'Student'}
                </span>
              )},
              { value: ROLE_STRINGS.INSTRUCTOR, label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: getRoleIconColor(ROLE_STRINGS.INSTRUCTOR) }}>
                    {getRoleIconThemed(ROLE_STRINGS.INSTRUCTOR)}
                  </span>
                  {t('instructor') || 'Instructor'}
                </span>
              )},
              { value: ROLE_STRINGS.HR, label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: getRoleIconColor(ROLE_STRINGS.HR) }}>
                    {getRoleIconThemed(ROLE_STRINGS.HR)}
                  </span>
                  {t('hr') || 'HR'}
                </span>
              )},
              { value: ROLE_STRINGS.ADMIN, label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: getRoleIconColor(ROLE_STRINGS.ADMIN) }}>
                    {getRoleIconThemed(ROLE_STRINGS.ADMIN)}
                  </span>
                  {t('admin') || 'Admin'}
                </span>
              )},
              { value: ROLE_STRINGS.SUPER_ADMIN, label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: getRoleIconColor(ROLE_STRINGS.SUPER_ADMIN) }}>
                    {getRoleIconThemed(ROLE_STRINGS.SUPER_ADMIN)}
                  </span>
                  {t('super_admin') || 'Super Admin'}
                </span>
              )},
            ]}
          />
        </div>

        {!editingUser && (
          <div className="form-row flex-row">
            <ToggleSwitch
              label="Auto-add email to allowlist"
              checked={autoAddToAllowlist}
              onChange={(checked) => setAutoAddToAllowlist(checked)}
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
            <Button onClick={loadData} style={{ marginTop: '1rem' }}>
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
