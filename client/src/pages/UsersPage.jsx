import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@contexts/ThemeContext';
import { useLang } from '@contexts/LangContext';
import { useToast } from '@ui';
import logger from '@utils/logger';
import { getQatarTimeAgo, formatQatarDate } from '@utils/timezone';
import { getThemedIcon } from '@constants/iconTypes';
import { USER_ROLES } from '@constants/userRoles';
import { ACTIVITY_TYPES } from '@constants/activityTypes';
import { Button, Input, Select, ToggleSwitch, RibbonTabs, AdvancedDataGrid } from '@ui';

const UsersPage = ({
  users,
  enrollments,
  allowlist,
  autoAddToAllowlist,
  setAutoAddToAllowlist,
  userForm,
  setUserForm,
  editingUser,
  setEditingUser,
  activeUserFormTab,
  setActiveUserFormTab,
  loading,
  setLoading,
  loadData,
  userToDelete,
  setUserToDelete,
  setShowUserDeletionModal,
  theme
}) => {
  const navigate = useNavigate();
  const { t } = useLang();
  const toast = useToast();

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
    if (!userForm.email.trim()) {
      toast?.showError('Email is required');
      return;
    }

    // Validate student number is required for students
    if (userForm.role === USER_ROLES.STUDENT && !userForm.studentNumber?.trim()) {
      toast?.showError('Student number is required for students');
      return;
    }

    // Validate student number uniqueness for students
    if (userForm.role === USER_ROLES.STUDENT && userForm.studentNumber?.trim()) {
      const isDuplicate = users.some(user => 
        user.studentNumber === userForm.studentNumber.trim() && 
        user.docId !== editingUser?.docId
      );
      
      if (isDuplicate) {
        toast?.showError('Student number must be unique. This student number is already in use.');
        return;
      }
    }

    setLoading(true);
    try {
      if (editingUser) {
        const { updateUser } = await import('@firebaseServices/userService');
        const result = await updateUser(editingUser.docId, userForm);
        if (!result.success) throw new Error(result.error || 'Failed to update user');
        // Log activity
        try {
          const { logActivity } = await import('@firebaseServices/activityLogger');
          await logActivity(ACTIVITY_TYPES.USER_UPDATED, {
            userId: editingUser.docId,
            userEmail: userForm.email,
            userDisplayName: userForm.displayName,
            userRole: userForm.role
          });
        } catch (e) { }
        toast?.showSuccess('User updated successfully!');
      } else {
        // Add to allowlist if checkbox is checked
        if (autoAddToAllowlist && userForm.email) {
          const { updateAllowlist } = await import('@firebaseServices/config');
          const targetList = userForm.role === USER_ROLES.ADMIN ? 'adminEmails' : 'allowedEmails';
          const currentEmails = allowlist[targetList] || [];

          if (!currentEmails.includes(userForm.email)) {
            const updatedAllowlist = {
              ...allowlist,
              [targetList]: [...currentEmails, userForm.email]
            };
            setAutoAddToAllowlist(updatedAllowlist);

            // Save to Firestore
            try {
              await updateAllowlist(updatedAllowlist);
            } catch (allowlistError) {
              toast?.showWarning('Failed to update allowlist: ' + allowlistError.message);
            }
          }
          toast?.showSuccess(`Invite prepared. ${userForm.email} added to ${userForm.role} allowlist. Ask them to sign up.`);
        } else {
          toast?.showInfo('No changes saved. Provide an email or enable allowlist option.');
        }
      }

      await loadData();
      setEditingUser(null);
      setUserForm({ email: '', displayName: '', realName: '', studentNumber: '', order: '', role: USER_ROLES.STUDENT });
    } catch (error) {
      toast?.showError('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      email: user.email || '',
      displayName: user.displayName || '',
      realName: user.realName || '',
      studentNumber: user.studentNumber || '',
      order: user.order || '',
      role: user.role || 'student'
    });
  };

  const handleImpersonateUser = async (userId, userEmail) => {
    const { impersonateUser } = await import('@firebaseServices/authService');
    const result = await impersonateUser(userId);
    if (result.success) {
      toast?.showSuccess(t('impersonation_started') || 'Now viewing as student');
      navigate('/');
    } else {
      toast?.showError(result.error || 'Failed to impersonate');
    }
  };

  const handleResetPassword = async (email) => {
    try {
      const { sendPasswordResetEmail } = await import('firebase/auth');
      const { auth } = await import('@firebaseServices/config');
      await sendPasswordResetEmail(auth, email);
      toast?.showSuccess(`Password reset email sent to ${email}`);
    } catch (error) {
      logger.error('Error:', error);
      toast?.showError('Failed: ' + error.message);
    }
  };

  const handleToggleUserStatus = async (user) => {
    try {
      const { updateUser } = await import('@firebaseServices/userService');
      const userId = user.docId || user.id;
      const isCurrentlyDisabled = user.disabled || user.isDisabled;
      const result = await updateUser(userId, {
        disabled: !isCurrentlyDisabled,
        isDisabled: !isCurrentlyDisabled
      });
      if (result.success) {
        // Log activity
        try {
          const { logActivity } = await import('@firebaseServices/activityLogger');
          await logActivity(ACTIVITY_TYPES.USER_UPDATED, {
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
  };

  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setShowUserDeletionModal(true);
  };

  const openQRCodeInNewTab = (user) => {
    const qrUrl = `/qr-code-display?studentNumber=${encodeURIComponent(user.studentNumber)}&name=${encodeURIComponent(user.displayName || user.email)}`;
    window.open(qrUrl, '_blank', 'width=400,height=600');
  };

  const handleCancel = () => {
    setEditingUser(null);
    setUserForm({ email: '', displayName: '', role: USER_ROLES.STUDENT, studentNumber: '', order: '' });
    setActiveUserFormTab('basic');
  };

  const handleTabNavigation = (direction) => {
    if (direction === 'next') {
      if (activeUserFormTab === 'basic') {
        setActiveUserFormTab('academic');
      } else if (activeUserFormTab === 'academic') {
        setActiveUserFormTab('role');
      }
    } else {
      if (activeUserFormTab === 'role') {
        setActiveUserFormTab('academic');
      } else if (activeUserFormTab === 'academic') {
        setActiveUserFormTab('basic');
      }
    }
  };

  return (
    <div className="users-page">
      <p style={{ color: '#555', marginBottom: '1rem' }}>{t('invite_users_blurb')}</p>

      {editingUser && (
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
          {getThemedIcon('ui', 'edit', 16, theme)} Editing User: {editingUser.displayName || editingUser.email}
        </div>
      )}

      <RibbonTabs
        categories={[
          {
            id: 'user-fields',
            items: [
              { key: 'basic', label: 'Basic Info', icon: getThemedIcon('ui', 'user', 14, theme) },
              { key: 'academic', label: 'Academic Info', icon: getThemedIcon('ui', 'graduation_cap', 14, theme) },
              { key: 'role', label: 'Role & Access', icon: getThemedIcon('ui', 'shield', 14, theme) }
            ]
          }
        ]}
        activeCategory="user-fields"
        activeItem={activeUserFormTab}
        onChange={({ category, item }) => setActiveUserFormTab(item)}
      />
      
      <form onSubmit={handleFormSubmit} className="dashboard-form">
        {activeUserFormTab === 'basic' && (
          <div className="form-row">
            <Input
              type="email"
              placeholder={t('user_email_placeholder')}
              value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              required
            />
            <Input
              type="text"
              placeholder={t('user_display_name_placeholder')}
              value={userForm.displayName}
              onChange={(e) => setUserForm({ ...userForm, displayName: e.target.value })}
            />
          </div>
        )}

        {activeUserFormTab === 'academic' && (
          <div className="form-row">
            <Input
              type="text"
              placeholder={t('real_name_placeholder') || 'Real Name (First Last)'}
              value={userForm.realName || ''}
              onChange={(e) => setUserForm({ ...userForm, realName: e.target.value })}
            />
            <Input
              type="text"
              placeholder={t('student_number_placeholder') || 'Student Number (Required)'}
              value={userForm.studentNumber || ''}
              onChange={(e) => setUserForm({ ...userForm, studentNumber: e.target.value })}
              required
            />
            <Input
              type="number"
              placeholder={t('student_order_placeholder') || 'Order/Sequence (Optional)'}
              value={userForm.order || ''}
              onChange={(e) => setUserForm({ ...userForm, order: e.target.value })}
              description={t('student_order_description') || 'Display order for student lists'}
            />
            <div /> {/* Empty div to maintain grid layout */}
          </div>
        )}

        {activeUserFormTab === 'role' && (
          <div className="form-row">
            <Select
              searchable
              placeholder={t('role') || 'Role'}
              value={userForm.role}
              onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
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
              fullWidth
            />
          </div>
        )}

        {!editingUser && (
          <div className="form-row flex-row">
            <ToggleSwitch
              label="Auto-add email to student allowlist"
              checked={autoAddToAllowlist}
              onChange={(checked) => setAutoAddToAllowlist(checked)}
            />
          </div>
        )}

        <div className="form-actions">
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {activeUserFormTab !== 'basic' && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => handleTabNavigation('prev')}
                >
                  ← Previous
                </Button>
              )}
              {activeUserFormTab !== 'role' && (
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={() => handleTabNavigation('next')}
                >
                  Next →
                </Button>
              )}
              {activeUserFormTab === 'role' && (
                <Button type="submit" variant="primary" loading={loading}>
                  {(editingUser ? t('update') : t('save'))}
                </Button>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
              >
                {t('cancel') || 'Cancel'}
              </Button>
            </div>
          </div>
        </div>
      </form>

      <div style={{ marginTop: '1rem' }}>
        <AdvancedDataGrid
          rows={users}
          getRowId={(row) => row.docId || row.id}
          columns={[
            { field: 'email', headerName: t('email_col'), flex: 1, minWidth: 220 },
            { field: 'displayName', headerName: t('display_name_col'), flex: 1, minWidth: 180 },
            {
              field: 'studentNumber', 
              headerName: t('student_number') || 'Student Number', 
              width: 140,
              renderCell: (params) => {
                if (params.row.role === 'student') {
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
                if (params.row.role === 'student') {
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
              field: 'role', headerName: t('role_col'), width: 120,
              renderCell: (params) => {
                const role = params.value || t('student');
                const roleIcons = {
                  'superadmin': getThemedIcon('ui', 'crown', 16, theme),
                  'admin': getThemedIcon('ui', 'shield', 16, theme),
                  'instructor': getThemedIcon('ui', 'book_open', 16, theme),
                  'hr': getThemedIcon('ui', 'users', 16, theme),
                  'student': getThemedIcon('ui', 'user', 16, theme)
                };
                const roleColors = {
                  'superadmin': '#f59e0b',
                  'admin': '#4f46e5', 
                  'instructor': '#0ea5e9',
                  'hr': '#8b5cf6',
                  'student': '#16a34a'
                };
                const normalizedRole = role.toLowerCase();
                const icon = roleIcons[normalizedRole] || roleIcons['student'];
                const color = roleColors[normalizedRole] || roleColors['student'];
                
                return (
                  <span style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    color: color,
                    fontWeight: 600
                  }}>
                    {icon} {role}
                  </span>
                );
              }
            },
            {
              field: 'status', 
              headerName: t('status'), 
              width: 120,
              renderCell: (params) => {
                const isDisabled = params.row.disabled || params.row.isDisabled;
                const isArchived = params.row.archived || params.row.deleted;
                
                if (isArchived) {
                  return (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--text-muted, #6b7280)', fontWeight: 500 }}>
                      {getThemedIcon('ui', 'archive', 16, theme)} {t('status_archived')}
                    </span>
                  );
                } else if (isDisabled) {
                  return (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--color-danger, #dc2626)', fontWeight: 500 }}>
                      {getThemedIcon('ui', 'user_x', 16, theme)} {t('status_disabled')}
                    </span>
                  );
                } else {
                  return (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--color-success, #28a745)', fontWeight: 500 }}>
                      {getThemedIcon('ui', 'user_check', 16, theme)} {t('status_active')}
                    </span>
                  );
                }
              }
            },
            {
              field: 'enrolledClasses', headerName: t('enrolled_classes_col'), width: 140,
              valueGetter: (params) => {
                const userId = params.row.docId || params.row.id;
                const userEnrollments = enrollments.filter(e => {
                  const enrollmentUserId = e.userId || e.userDocId;
                  return enrollmentUserId === userId || (e.userEmail || e.email) === params.row.email;
                });
                return userEnrollments.length;
              }
            },
            {
              field: 'progress', headerName: t('progress'), width: 180,
              renderCell: (params) => {
                const userId = params.row.docId || params.row.id;
                return (
                  <a
                    href={`/student-dashboard?userId=${userId}`}
                    style={{ color: 'var(--color-primary, #800020)', textDecoration: 'none', fontWeight: 600 }}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/student-dashboard?userId=${userId}`);
                    }}
                  >
                    View Dashboard →
                  </a>
                );
              }
            },
            {
              field: 'createdAt', headerName: t('joined'), width: 180,
              valueGetter: (params) => params.value,
              renderCell: (params) => {
                if (!params.value) return (t('unknown') || 'Unknown');
                const date = params.value?.toDate ? params.value.toDate() : (params.value?.seconds ? new Date(params.value.seconds * 1000) : new Date(params.value));
                if (isNaN(date.getTime())) return (t('unknown') || 'Unknown');
                return formatQatarDate(date);
              }
            },
            {
              field: 'actions', headerName: t('actions_col'), width: 280, sortable: false, filterable: false,
              renderCell: (params) => (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Button size="sm" variant="ghost" icon={getThemedIcon('ui', 'edit', 16, theme)} onClick={() => handleEditUser(params.row)}>
                    {t('edit') || 'Edit'}
                  </Button>
                  {(params.row.role || 'student') === 'student' && (
                    <Button 
                      size="sm" 
                      variant="primary" 
                      onClick={() => handleImpersonateUser(params.row.docId || params.row.id, params.row.email)}
                      title={t('impersonate_student') || 'View as Student'}
                    >
                      {getThemedIcon('ui', 'eye', 16, theme)}
                    </Button>
                  )}
                  {(params.row.role || 'student') === 'student' && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => openQRCodeInNewTab(params.row)}
                      title={t('view_qr_code') || 'View QR Code'}
                    >
                      {getThemedIcon('ui', 'qr_code', 16, theme)}
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleResetPassword(params.row.email)}
                    title={t('reset_password') || 'Reset Password'}
                  >
                    {getThemedIcon('ui', 'key_round', 16, theme)}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    icon={params.row.disabled || params.row.isDisabled ? getThemedIcon('ui', 'user_check', 16, theme) : getThemedIcon('ui', 'user_x', 16, theme)}
                    style={{ color: params.row.disabled || params.row.isDisabled ? '#28a745' : '#dc2626' }}
                    onClick={() => handleToggleUserStatus(params.row)}
                    title={params.row.disabled || params.row.isDisabled ? 'Enable User' : 'Disable User'}
                  >
                    {params.row.disabled || params.row.isDisabled ? 'Enable' : 'Disable'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    icon={getThemedIcon('ui', 'trash', 16, theme)}
                    style={{ color: '#dc2626' }}
                    onClick={() => handleDeleteUser(params.row)}
                  >
                    {t('delete') || 'Delete'}
                  </Button>
                </div>
              )
            }
          ]}
          pageSize={10}
          pageSizeOptions={[5, 10, 20, 50]}
          checkboxSelection
          exportFileName="users"
          showExportButton
          exportLabel={t('export') || 'Export'}
        />
      </div>
    </div>
  );
};

export default UsersPage;
