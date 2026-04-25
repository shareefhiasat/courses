import React, { useState, useCallback, useMemo } from 'react';
import { info, error, warn, debug } from '@logger';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { Button, SimpleLoading, useToast, AdvancedDataGrid, Card, CardBody, Input, Select } from '@ui';
import { DeleteModal, useDeleteModal } from '@ui';
import * as adminScopeService from '@services/business/adminScopeService';

const AdminScopeAssignmentPage = () => {
  const { user, isSuperAdmin, isHR } = useAuth();
  const { t, lang, isRTL } = useLang();
  const { theme } = useTheme();
  const toast = useToast();
  
  const [adminScopes, setAdminScopes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [scopeForm, setScopeForm] = useState({
    userId: '',
    scopeType: 'PROGRAM',
    programId: '',
    classroomId: '',
    instructorUserId: ''
  });
  
  const [editingScope, setEditingScope] = useState(null);
  const [saving, setSaving] = useState(false);
  const { deleteModal, deleteEntity, handleDeleteConfirm, hideDeleteModal } = useDeleteModal(t);
  
  // Load admin scopes
  const loadAdminScopes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminScopeService.getAllAdminScopes();
      if (result.success) {
        setAdminScopes(result.data);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Create admin scope
  const handleCreate = useCallback(async (e) => {
    e.preventDefault();
    
    setSaving(true);
    try {
      const scopeData = {
        ...scopeForm,
        createdBy: user.id
      };
      
      const result = await adminScopeService.createAdminScope(scopeData, user);
      
      if (result.success) {
        toast.success(t('scope_created_successfully') || 'Scope created successfully');
        resetForm();
        loadAdminScopes();
      } else {
        toast.error(result.error || t('failed_to_create_scope') || 'Failed to create scope');
      }
    } catch (error) {
      toast.error(error.message || t('failed_to_create_scope') || 'Failed to create scope');
    } finally {
      setSaving(false);
    }
  }, [scopeForm, user, toast, t, loadAdminScopes]);
  
  // Update admin scope
  const handleUpdate = useCallback(async (e) => {
    e.preventDefault();
    
    if (!editingScope) return;
    
    setSaving(true);
    try {
      const result = await adminScopeService.updateAdminScope(editingScope.id, scopeForm, user);
      
      if (result.success) {
        toast.success(t('scope_updated_successfully') || 'Scope updated successfully');
        resetForm();
        loadAdminScopes();
      } else {
        toast.error(result.error || t('failed_to_update_scope') || 'Failed to update scope');
      }
    } catch (error) {
      toast.error(error.message || t('failed_to_update_scope') || 'Failed to update scope');
    } finally {
      setSaving(false);
    }
  }, [editingScope, scopeForm, user, toast, t, loadAdminScopes]);
  
  // Delete admin scope
  const handleDelete = useCallback(async (scopeId) => {
    setSaving(true);
    try {
      const result = await adminScopeService.deleteAdminScope(scopeId, user);
      
      if (result.success) {
        toast.success(t('scope_deleted_successfully') || 'Scope deleted successfully');
        hideDeleteModal();
        loadAdminScopes();
      } else {
        toast.error(result.error || t('failed_to_delete_scope') || 'Failed to delete scope');
      }
    } catch (error) {
      toast.error(error.message || t('failed_to_delete_scope') || 'Failed to delete scope');
    } finally {
      setSaving(false);
    }
  }, [user, toast, t, hideDeleteModal, loadAdminScopes]);
  
  // Edit scope
  const handleEdit = useCallback((scope) => {
    setEditingScope(scope);
    setScopeForm({
      userId: scope.userId?.toString() || '',
      scopeType: scope.scopeType,
      programId: scope.programId?.toString() || '',
      classroomId: scope.classroomId?.toString() || '',
      instructorUserId: scope.instructorUserId?.toString() || ''
    });
  }, []);
  
  // Reset form
  const resetForm = useCallback(() => {
    setEditingScope(null);
    setScopeForm({
      userId: '',
      scopeType: 'PROGRAM',
      programId: '',
      classroomId: '',
      instructorUserId: ''
    });
  }, []);
  
  // Load data on mount
  React.useEffect(() => {
    loadAdminScopes();
  }, [loadAdminScopes]);
  
  // Scope type options
  const scopeTypeOptions = [
    { value: 'PROGRAM', label: t('program') || 'Program' },
    { value: 'CLASSROOM', label: t('classroom') || 'Classroom' },
    { value: 'INSTRUCTOR', label: t('instructor') || 'Instructor' }
  ];
  
  // Columns for admin scopes grid
  const columns = useMemo(() => [
    {
      field: 'user',
      headerName: t('user') || 'User',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => params.row.user?.displayName || params.row.user?.firstName || 'Unknown'
    },
    {
      field: 'scopeType',
      headerName: t('scope_type') || 'Scope Type',
      flex: 0.5,
      minWidth: 120
    },
    {
      field: 'program',
      headerName: t('program') || 'Program',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => params.row.program?.nameEn || params.row.program?.code || '-'
    },
    {
      field: 'classroom',
      headerName: t('classroom') || 'Classroom',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => params.row.classroom?.nameEn || params.row.classroom?.code || '-'
    },
    {
      field: 'instructor',
      headerName: t('instructor') || 'Instructor',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => params.row.instructor?.displayName || params.row.instructor?.firstName || '-'
    },
    {
      field: 'isActive',
      headerName: t('active') || 'Active',
      flex: 0.5,
      minWidth: 80,
      renderCell: (params) => params.value ? '✓' : '✗'
    }
  ], [t]);
  
  // Check permissions
  const hasPermission = isSuperAdmin || isHR;
  
  if (!hasPermission) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.125rem', fontWeight: '500', color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}>
          {t('access_denied') || 'Access Denied'}
        </div>
        <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginTop: '0.5rem' }}>
          {t('admin_scope_permission_required') || 'You need super-admin or HR privileges to manage admin scopes.'}
        </div>
      </div>
    );
  }
  
  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
          {t('admin_scope_assignment') || 'Admin Scope Assignment'}
        </h1>
        <p style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
          {t('admin_scope_description') || 'Assign admin scopes to control which resources users can manage'}
        </p>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem' }}>
        {/* Form */}
        <Card>
          <CardBody>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '1rem' }}>
              {editingScope ? t('edit_scope') || 'Edit Scope' : t('create_scope') || 'Create Scope'}
            </h3>
            
            <form onSubmit={editingScope ? handleUpdate : handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Input
                label={t('user_id') || 'User ID'}
                value={scopeForm.userId}
                onChange={(e) => setScopeForm({ ...scopeForm, userId: e.target.value })}
                required
              />
              
              <Select
                label={t('scope_type') || 'Scope Type'}
                value={scopeForm.scopeType}
                onChange={(e) => setScopeForm({ ...scopeForm, scopeType: e.target.value })}
                options={scopeTypeOptions}
                required
              />
              
              {scopeForm.scopeType === 'PROGRAM' && (
                <Input
                  label={t('program_id') || 'Program ID'}
                  value={scopeForm.programId}
                  onChange={(e) => setScopeForm({ ...scopeForm, programId: e.target.value })}
                  required
                />
              )}
              
              {scopeForm.scopeType === 'CLASSROOM' && (
                <Input
                  label={t('classroom_id') || 'Classroom ID'}
                  value={scopeForm.classroomId}
                  onChange={(e) => setScopeForm({ ...scopeForm, classroomId: e.target.value })}
                  required
                />
              )}
              
              {scopeForm.scopeType === 'INSTRUCTOR' && (
                <Input
                  label={t('instructor_user_id') || 'Instructor User ID'}
                  value={scopeForm.instructorUserId}
                  onChange={(e) => setScopeForm({ ...scopeForm, instructorUserId: e.target.value })}
                  required
                />
              )}
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button type="submit" disabled={saving}>
                  {saving ? t('saving') || 'Saving...' : (editingScope ? t('update') || 'Update' : t('create') || 'Create')}
                </Button>
                <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>
                  {t('cancel') || 'Cancel'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
        
        {/* Data Grid */}
        <Card>
          <CardBody>
            {loading ? (
              <SimpleLoading />
            ) : error ? (
              <div style={{ padding: '1rem', color: 'red' }}>
                {error}
              </div>
            ) : (
              <AdvancedDataGrid
                rows={adminScopes}
                columns={columns}
                onEdit={handleEdit}
                onDelete={handleDelete}
                pageSize={10}
                disableSelectionOnClick
              />
            )}
          </CardBody>
        </Card>
      </div>
      
      {/* Delete Modal */}
      {deleteModal.isOpen && (
        <DeleteModal
          isOpen={deleteModal.isOpen}
          onClose={hideDeleteModal}
          onConfirm={() => handleDelete(deleteModal.entity.id)}
          title={t('confirm_delete') || 'Confirm Delete'}
          message={t('confirm_delete_scope_message') || 'Are you sure you want to delete this admin scope?'}
          entityName={deleteModal.entity?.user?.displayName || deleteModal.entity?.user?.firstName || 'Scope'}
        />
      )}
    </div>
  );
};

export default AdminScopeAssignmentPage;
