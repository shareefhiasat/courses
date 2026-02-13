import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@contexts/ThemeContext';
import { useLang } from '@contexts/LangContext';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@ui';
import logger from '@utils/logger';
import { getQatarTimeAgo, formatQatarDate } from '@utils/timezone';
import { getThemedIcon } from '@constants/iconTypes';
import { USER_ROLES } from '@constants/userRoles';
import { ACTIVITY_LOG_TYPES } from '@firebaseServices/activityLogger';
import { Button, Input, Select, ToggleSwitch, AdvancedDataGrid, Loading, Card, CardBody, ConfirmModal } from '@ui';
import DeleteModal, { useDeleteModal } from '@ui/DeleteModal/DeleteModal';
import ProgramsSelect from '@ui/Select/ProgramsSelect';
import { getUsers, addUser, updateUser, deleteUser as deleteUserFromService, isUserDisabledAtUserLevel, isStudent, isAdmin as isAdminUser } from '@firebaseServices/userService';
import { getPrograms } from '@firebaseServices/programService';
import { getClasses } from '@firebaseServices/classService';
import { getSubjects } from '@firebaseServices/programService';
import { getEnrollments } from '@firebaseServices/enrollmentService';
import { getAttendanceByStudent } from '@firebaseServices/attendanceService';
import { getPenalties } from '@firebaseServices/penaltyService';
import { getBehaviors } from '@firebaseServices/behaviorService';
import { getParticipations } from '@firebaseServices/participationService';
import { getUserSubmissions } from '@firebaseServices/submissionService';
import { PAGE_STATES, FORM_STATES } from '@constants/pageTypes';

const UsersPage = ({ isDashboardTab = false }) => {
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const { user, isAdmin, isSuperAdmin } = useAuth();
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
  
  // Allowlist state (previously was props)
  const [autoAddToAllowlist, setAutoAddToAllowlist] = useState(true);
  const [allowlist, setAllowlist] = useState([]);
  
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
    role: USER_ROLES.STUDENT,
    studentNumber: '',
    order: ''
  });
  const [saving, setSaving] = useState(false);
  
  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Confirm',
    variant: 'primary'
  });
  
  const { deleteModal, deleteUser, handleDeleteConfirm, hideDeleteModal } = useDeleteModal(t);

  // Load data function - must be defined before useEffect
  const loadData = useCallback(async () => {
    if (!isAdmin && !isSuperAdmin) {
      setPageState(PAGE_STATES.ERROR);
      return;
    }
    
    setPageState(PAGE_STATES.LOADING);
    try {
      logger.info('USER_PAGE: Loading users and reference data', { 
        timestamp: new Date().toISOString(),
        stackTrace: new Error().stack 
      });
      
      const [usersResult, programsResult, classesResult, subjectsResult, enrollmentsResult] = await Promise.all([
        getUsers(),
        getPrograms(),
        getClasses(),
        getSubjects(),
        getEnrollments()
      ]);
      
      if (usersResult.success) {
        setUsers(usersResult.data || []);
        logger.info('USER_PAGE: Successfully loaded users', { count: usersResult.data?.length || 0 });
      } else {
        toast?.showError('Failed to load users: ' + usersResult.error);
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
      logger.error('USER_PAGE: Failed to load data', { error: error.message });
      toast?.showError('Failed to load data: ' + error.message);
      setPageState(PAGE_STATES.ERROR);
    }
  }, [isAdmin, isSuperAdmin]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handler functions - must be defined before gridColumns
  const handleEditUser = useCallback((user) => {
    setEditingUser(user);
    setFormData({
      email: user.email || '',
      displayName: user.displayName || '',
      realName: user.realName || '',
      studentNumber: user.studentNumber || '',
      order: user.order || '',
      role: user.role || USER_ROLES.STUDENT
    });
  }, []);

  const handleDeleteUser = useCallback(async (userToDelete) => {
    const userId = userToDelete.docId || userToDelete.id;
    const role = userToDelete.role || USER_ROLES.STUDENT;
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
          const result = await updateUser(userId, {
            disabled: true,
            isDisabled: true
          });
          if (result.success) {
            // Log activity
            try {
              const { logActivity } = await import('@firebaseServices/activityLogger');
              await logActivity(ACTIVITY_LOG_TYPES.USER_UPDATED, {
                userId,
                userEmail: userToDelete.email,
                action: 'soft_deleted'
              });
            } catch (e) { }
            toast?.showSuccess(t('user_soft_deleted_success') || 'User disabled (soft-deleted) successfully');
            await loadData();
          } else {
            toast?.showError(result.error || 'Failed to disable user');
          }
        } catch (error) {
          logger.error('USER_PAGE: Failed to soft delete user:', error);
          toast?.showError('Error: ' + error.message);
        }
      }, relatedRecords);
    } else {
      deleteUser(userToDelete, async () => {
        try {
          const result = await deleteUserFromService(userId);
          if (result.success) {
            toast?.showSuccess('User deleted successfully');
            await loadData();
          } else {
            toast?.showError('Error: ' + result.error);
          }
        } catch (error) {
          toast?.showError('Error: ' + error.message);
        }
      }, relatedRecords);
    }
  }, [deleteUser, toast, loadData, enrollments]);

  const handleToggleUserStatus = useCallback(async (user) => {
    // Prevent disabling super admin
    if (isAdminUser(user) && !isUserDisabledAtUserLevel(user)) {
      toast?.showError('Cannot disable a Super Admin user');
      return;
    }

    const isCurrentlyDisabled = isUserDisabledAtUserLevel(user);
    const action = isCurrentlyDisabled ? 'enable' : 'disable';

    // Show confirmation modal
    setConfirmModal({
      isOpen: true,
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      message: `Are you sure you want to ${action} this user?\n\nUser: ${user.displayName || user.email}\nRole: ${user.role || 'student'}`,
      confirmText: `${action.charAt(0).toUpperCase() + action.slice(1)}`,
      variant: isCurrentlyDisabled ? 'primary' : 'danger',
      onConfirm: async () => {
        try {
      const userId = user.docId || user.id;
      const result = await updateUser(userId, {
        disabled: !isCurrentlyDisabled,
        isDisabled: !isCurrentlyDisabled
      });
      if (result.success) {
        // Log activity
        try {
          const { logActivity } = await import('@firebaseServices/activityLogger');
          await logActivity(ACTIVITY_LOG_TYPES.USER_UPDATED, {
            userId: userId,
            userEmail: user.email,
            action: isCurrentlyDisabled ? 'enabled' : 'disabled'
          });
        } catch (e) { }
        toast?.showSuccess(`User ${isCurrentlyDisabled ? 'enabled' : 'disabled'} successfully!`);
        await loadData();
      } else {
        toast?.showError(result.error || 'Failed to update user');
      }
    } catch (error) {
          logger.error('Error:', error);
          toast?.showError('Failed: ' + error.message);
        }
      }
    });
  }, [toast, loadData]);

  const handleResetPassword = useCallback(async (email) => {
    // Show confirmation modal
    setConfirmModal({
      isOpen: true,
      title: 'Reset Password',
      message: `Are you sure you want to reset the password for this user?\n\nAn email will be sent to: ${email}`,
      confirmText: 'Reset Password',
      variant: 'danger',
      onConfirm: async () => {
        try {
      const { sendPasswordResetEmail } = await import('firebase/auth');
      const { auth } = await import('@firebaseServices/config');
      await sendPasswordResetEmail(auth, email);
      toast?.showSuccess(`Password reset email sent to ${email}`);
    } catch (error) {
          logger.error('Error:', error);
          toast?.showError('Failed: ' + error.message);
        }
      }
    });
  }, [toast]);

  const openQRCodeInNewTab = useCallback((user) => {
    const qrUrl = `/qrcode/${encodeURIComponent(user.studentNumber)}`;
    window.open(qrUrl, '_blank');
  }, []);

  // Sync refs when editing
  useEffect(() => {
    if (emailRef.current) emailRef.current.value = formData.email || '';
    if (displayNameRef.current) displayNameRef.current.value = formData.displayName || '';
    if (realNameRef.current) realNameRef.current.value = formData.realName || '';
    if (studentNumberRef.current) studentNumberRef.current.value = formData.studentNumber || '';
    if (orderRef.current) orderRef.current.value = formData.order || '';
  }, [editingUser, formData]);

  // Read text values from refs into form state before submit
  const syncRefsToState = useCallback(() => {
    return {
      email: emailRef.current?.value ?? formData.email,
      displayName: displayNameRef.current?.value ?? formData.displayName,
      realName: realNameRef.current?.value ?? formData.realName,
      studentNumber: studentNumberRef.current?.value ?? formData.studentNumber,
      order: orderRef.current?.value ?? formData.order
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
    { value: USER_ROLES.SUPER_ADMIN, label: t('super_admin') || 'Super Admin' },
    { value: USER_ROLES.ADMIN, label: t('admin') || 'Admin' },
    { value: USER_ROLES.INSTRUCTOR, label: t('instructor') || 'Instructor' },
    { value: USER_ROLES.HR, label: t('hr') || 'HR' },
    { value: USER_ROLES.STUDENT, label: t('student') || 'Student' }
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
        if (params.row.role === USER_ROLES.STUDENT) {
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
        return '—';
      }
    },
    {
      field: 'order', 
      headerName: t('order') || 'Order', 
      width: 80,
      renderCell: (params) => {
        if (params.row.role === USER_ROLES.STUDENT) {
          return (
            <span style={{ 
              fontSize: '0.875rem',
              color: params.value ? '#1f2937' : '#9ca3af',
              fontWeight: params.value ? 600 : 400
            }}>
              {params.value || '—'}
            </span>
          );
        }
        return '—';
      }
    },
    {
      field: 'role', headerName: t('role_col'), width: 180,
      renderCell: (params) => {
        // Get all roles from boolean flags
        const userRoles = [];
        if (params.row.isSuperAdmin) userRoles.push(USER_ROLES.SUPER_ADMIN);
        if (params.row.isAdmin) userRoles.push(USER_ROLES.ADMIN);
        if (params.row.isInstructor) userRoles.push(USER_ROLES.INSTRUCTOR);
        if (params.row.isHR) userRoles.push(USER_ROLES.HR);
        if (params.row.isStudent) userRoles.push(USER_ROLES.STUDENT);
        
        // Fallback to role field if no boolean flags
        if (userRoles.length === 0) {
          const fallbackRole = params.row.role || params.value || USER_ROLES.STUDENT;
          userRoles.push(fallbackRole);
        }
        
        const roleIcons = {
          [USER_ROLES.SUPER_ADMIN]: getThemedIcon('ui', 'crown', 14, theme),
          [USER_ROLES.ADMIN]: getThemedIcon('ui', 'shield', 14, theme),
          [USER_ROLES.INSTRUCTOR]: getThemedIcon('ui', 'book_open', 14, theme),
          [USER_ROLES.HR]: getThemedIcon('ui', 'users', 14, theme),
          [USER_ROLES.STUDENT]: getThemedIcon('ui', 'user', 14, theme)
        };
        const roleColors = {
          [USER_ROLES.SUPER_ADMIN]: '#f59e0b',
          [USER_ROLES.ADMIN]: '#4f46e5', 
          [USER_ROLES.INSTRUCTOR]: '#0ea5e9',
          [USER_ROLES.HR]: '#8b5cf6',
          [USER_ROLES.STUDENT]: '#16a34a'
        };
        
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
            {userRoles.map((role, idx) => {
              const icon = roleIcons[role] || roleIcons[USER_ROLES.STUDENT];
              const color = roleColors[role] || roleColors[USER_ROLES.STUDENT];
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
      field: 'actions', headerName: t('actions_col'), width: 280, sortable: false, filterable: false,
      renderCell: (params) => (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(() => {
            const isSuperAdminUser = params.row.isSuperAdmin || params.row.role === USER_ROLES.SUPER_ADMIN;
            const currentUserIsSuperAdmin = user?.isSuperAdmin || user?.role === USER_ROLES.SUPER_ADMIN;
            const canEdit = !isSuperAdminUser || currentUserIsSuperAdmin;
            
            return (
              <Button 
                size="sm" 
                variant="ghost" 
                icon={getThemedIcon('ui', 'edit', 16, theme)} 
                onClick={() => handleEditUser(params.row)}
                disabled={!canEdit}
                title={canEdit ? (t('edit') || 'Edit') : 'Only Super Admin can edit Super Admin'}
                style={{ opacity: canEdit ? 1 : 0.5 }}
              >
                {t('edit') || 'Edit'}
              </Button>
            );
          })()}
          {(() => {
            // Check if user has student role from boolean flags
            const hasStudentRole = isStudent(params.row);
            const isSuperAdminUser = params.row.isSuperAdmin || params.row.role === USER_ROLES.SUPER_ADMIN;
            const isInstructorUser = params.row.isInstructor || params.row.role === USER_ROLES.INSTRUCTOR;

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
              );
            }
            return null;
          })()}
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => handleResetPassword(params.row.email)}
            title={t('reset_password') || 'Reset Password'}
            style={{ border: 'none' }}
          >
            {getThemedIcon('ui', 'key_round', 16, theme)}
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            icon={isUserDisabledAtUserLevel(params.row) ? getThemedIcon('ui', 'user_check', 16, theme) : getThemedIcon('ui', 'user_x', 16, theme)}
            style={{ color: isUserDisabledAtUserLevel(params.row) ? '#28a745' : '#dc2626' }}
            onClick={() => handleToggleUserStatus(params.row)}
            title={isUserDisabledAtUserLevel(params.row) ? 'Enable' : 'Disable'}
            disabled={isAdminUser(params.row) && !isUserDisabledAtUserLevel(params.row)}
          >
            {isUserDisabledAtUserLevel(params.row) ? 'Enable' : 'Disable'}
          </Button>
          {(() => {
            const isSuperAdminUser = params.row.isSuperAdmin || params.row.role === USER_ROLES.SUPER_ADMIN;
            const currentUserIsSuperAdmin = user?.isSuperAdmin || user?.role === USER_ROLES.SUPER_ADMIN;
            const canDelete = !isSuperAdminUser || currentUserIsSuperAdmin;
            
            return (
              <Button 
                size="sm" 
                variant="ghost" 
                icon={getThemedIcon('ui', 'trash', 16, theme)}
                style={{ color: '#dc2626', opacity: canDelete ? 1 : 0.5 }}
                onClick={() => canDelete && handleDeleteUser(params.row)}
                disabled={!canDelete}
                title={canDelete ? (t('delete') || 'Delete') : 'Cannot delete Super Admin'}
              >
                {t('delete') || 'Delete'}
              </Button>
            );
          })()}
        </div>
      )
    }
  ], [t, theme, handleEditUser, openQRCodeInNewTab, handleResetPassword, handleToggleUserStatus, handleDeleteUser]);

  // Helper function to get role icon using getThemedIcon
  const getRoleIconThemed = (role) => {
    const roleIconMap = {
      [USER_ROLES.STUDENT]: getThemedIcon('ui', 'user', 16, theme),
      [USER_ROLES.INSTRUCTOR]: getThemedIcon('ui', 'book_open', 16, theme),
      [USER_ROLES.HR]: getThemedIcon('ui', 'users', 16, theme),
      [USER_ROLES.ADMIN]: getThemedIcon('ui', 'shield', 16, theme),
      [USER_ROLES.SUPER_ADMIN]: getThemedIcon('ui', 'crown', 16, theme),
    };
    return roleIconMap[role] || roleIconMap[USER_ROLES.STUDENT];
  };

  // Helper function to get role icon color
  const getRoleIconColor = (role) => {
    const colorMap = {
      [USER_ROLES.STUDENT]: '#16a34a',
      [USER_ROLES.INSTRUCTOR]: '#0ea5e9',
      [USER_ROLES.HR]: '#8b5cf6',
      [USER_ROLES.ADMIN]: '#4f46e5',
      [USER_ROLES.SUPER_ADMIN]: '#f59e0b',
    };
    return colorMap[role] || colorMap[USER_ROLES.STUDENT];
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const textValues = syncRefsToState();
    
    if (!textValues.email.trim()) {
      toast?.showError('Email is required');
      return;
    }

    // Validate student number is required for students
    if (formData.role === USER_ROLES.STUDENT && !textValues.studentNumber?.trim()) {
      toast?.showError('Student number is required for students');
      return;
    }

    // Validate student number uniqueness for students
    if (formData.role === USER_ROLES.STUDENT && textValues.studentNumber?.trim()) {
      const isDuplicate = users.some(user => 
        user.studentNumber === textValues.studentNumber.trim() && 
        user.docId !== editingUser?.docId
      );
      
      if (isDuplicate) {
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
      
      if (editingUser) {
        const result = await updateUser(editingUser.docId, submitData);
        if (!result.success) throw new Error(result.error || 'Failed to update user');
        // Log activity
        try {
          const { logActivity } = await import('@firebaseServices/activityLogger');
          await logActivity(ACTIVITY_LOG_TYPES.USER_UPDATED, {
            userId: editingUser.docId,
            userEmail: submitData.email,
            userDisplayName: submitData.displayName,
            userRole: submitData.role
          });
        } catch (e) { }
        toast?.showSuccess('User updated successfully!');
      } else {
        // Add to allowlist if checkbox is checked
        if (autoAddToAllowlist && submitData.email) {
          const { updateAllowlist } = await import('@firebaseServices/config');
          const targetList = submitData.role === USER_ROLES.ADMIN ? 'adminEmails' : 'allowedEmails';
          const currentEmails = allowlist[targetList] || [];

          if (!currentEmails.includes(submitData.email)) {
            const updatedAllowlist = {
              ...allowlist,
              [targetList]: [...currentEmails, submitData.email]
            };
            setAllowlist(updatedAllowlist);

            // Save to Firestore
            try {
              await updateAllowlist(updatedAllowlist);
            } catch (allowlistError) {
              toast?.showWarning(t('failed_to_update_allowlist') + ': ' + allowlistError.message);
            }
          }
          toast?.showSuccess(t('invite_prepared_added_to_allowlist', { 
            email: submitData.email, 
            role: submitData.role 
          }) || `Invite prepared. ${submitData.email} added to ${submitData.role} allowlist. ${t('ask_them_to_sign_up') || 'Ask them to sign up.'}`);
        } else {
          toast?.showInfo(t('no_changes_saved_provide_email_or_enable_allowlist') || 'No changes saved. Provide an email or enable allowlist option.');
        }
      }

      // Only reload if editing (not adding new user to allowlist)
      if (editingUser) {
        logger.info('USER_PAGE: Calling loadData after user update', {
          timestamp: new Date().toISOString(),
          userId: editingUser.docId
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

  const resetForm = useCallback(() => {
    setEditingUser(null);
    setFormData({
      email: '',
      displayName: '',
      realName: '',
      role: USER_ROLES.STUDENT,
      studentNumber: '',
      order: ''
    });
    // Clear refs
    if (emailRef.current) emailRef.current.value = '';
    if (displayNameRef.current) displayNameRef.current.value = '';
    if (realNameRef.current) realNameRef.current.value = '';
    if (studentNumberRef.current) studentNumberRef.current.value = '';
    if (orderRef.current) orderRef.current.value = '';
  }, []);

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
            style={{ minWidth: '300px', flex: 3 }}
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
          {getRoleIconThemed(USER_ROLES.STUDENT)}
          {users.filter(u => u.role === USER_ROLES.STUDENT).length} {lang === 'ar' ? 'طلاب' : 'Students'}
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
          {getRoleIconThemed(USER_ROLES.INSTRUCTOR)}
          {users.filter(u => u.role === USER_ROLES.INSTRUCTOR).length} {lang === 'ar' ? 'مدرسين' : 'Instructors'}
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
          {getRoleIconThemed(USER_ROLES.ADMIN)}
          {users.filter(u => u.role === USER_ROLES.ADMIN || u.role === USER_ROLES.SUPER_ADMIN).length} {lang === 'ar' ? 'مدراء' : 'Admins'}
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
          {getRoleIconThemed(USER_ROLES.HR)}
          {users.filter(u => u.role === USER_ROLES.HR).length} {lang === 'ar' ? 'موارد بشرية' : 'HR'}
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
            ref={emailRef}
            type="email"
            defaultValue={formData.email}
            placeholder={t('user_email_placeholder')}
            required
          />
          <Input
            ref={displayNameRef}
            type="text"
            defaultValue={formData.displayName}
            placeholder={t('user_display_name_placeholder')}
          />
        </div>
        
        <div className="form-row">
          <Input
            ref={realNameRef}
            type="text"
            defaultValue={formData.realName}
            placeholder={t('real_name_placeholder') || 'Real Name (First Last)'}
          />
          <Input
            ref={studentNumberRef}
            type="text"
            defaultValue={formData.studentNumber}
            placeholder={t('student_number_placeholder') || 'Student Number'}
            required={formData.role === USER_ROLES.STUDENT}
          />
          <Input
            ref={orderRef}
            type="number"
            defaultValue={formData.order}
            placeholder={t('student_order_placeholder') || 'Order/Sequence'}
            description={t('student_order_description') || 'Display order for student lists'}
          />
          <Select
            searchable
            placeholder={t('role') || 'Role'}
            value={formData.role}
            onChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
            options={[
              { value: USER_ROLES.STUDENT, label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: getRoleIconColor(USER_ROLES.STUDENT) }}>
                    {getRoleIconThemed(USER_ROLES.STUDENT)}
                  </span>
                  {t('student') || 'Student'}
                </span>
              )},
              { value: USER_ROLES.INSTRUCTOR, label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: getRoleIconColor(USER_ROLES.INSTRUCTOR) }}>
                    {getRoleIconThemed(USER_ROLES.INSTRUCTOR)}
                  </span>
                  {t('instructor') || 'Instructor'}
                </span>
              )},
              { value: USER_ROLES.HR, label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: getRoleIconColor(USER_ROLES.HR) }}>
                    {getRoleIconThemed(USER_ROLES.HR)}
                  </span>
                  {t('hr') || 'HR'}
                </span>
              )},
              { value: USER_ROLES.ADMIN, label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: getRoleIconColor(USER_ROLES.ADMIN) }}>
                    {getRoleIconThemed(USER_ROLES.ADMIN)}
                  </span>
                  {t('admin') || 'Admin'}
                </span>
              )},
              { value: USER_ROLES.SUPER_ADMIN, label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: getRoleIconColor(USER_ROLES.SUPER_ADMIN) }}>
                    {getRoleIconThemed(USER_ROLES.SUPER_ADMIN)}
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
              onClick={resetForm}
            >
              {t('cancel') || 'Cancel'}
            </Button>
          </div>
        </div>
      </form>

      <div style={{ marginTop: '1rem' }}>
        {pageState === PAGE_STATES.LOADING ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <Loading />
            <p style={{ marginTop: '1rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>{t('loading_users') || 'Loading users...'}</p>
          </div>
        ) : pageState === PAGE_STATES.ERROR ? (
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
    </div>
  );
};

export default UsersPage;
