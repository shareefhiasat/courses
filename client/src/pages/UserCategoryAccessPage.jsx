import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { Button, SimpleLoading, useToast, Card, CardBody, Modal, Input, Checkbox, Select, DeleteModal } from '@ui';
import { useDeleteModal } from '@hooks/useDeleteModal.js';
import { getUserRoleIcon } from '@constants/iconTypes';
import userCategoryAccessService from '@services/business/userCategoryAccessService.js';
import { getCategories } from '@services/business/categoryService.js';
import { getAllUsers, getUserRoles } from '@services/business/userService.js';

const UserCategoryAccessPage = () => {
  const { user, isSuperAdmin } = useAuth();
  const { t, isRTL } = useLang();
  const { theme } = useTheme();
  const toast = useToast();
  const { deleteModal, deleteEntity, handleDeleteConfirm, hideDeleteModal } = useDeleteModal(t);
  
  const [accesses, setAccesses] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingAccess, setEditingAccess] = useState(null);
  
  const [formData, setFormData] = useState({
    userId: '',
    categoryId: '',
    roleId: '',
    canView: true,
    canManage: false,
  });
  
  const loadUsers = useCallback(async () => {
    try {
      const result = await getAllUsers();
      if (result.success) {
        setUsers(result.data);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }, []);
  
  const loadCategories = useCallback(async () => {
    try {
      const result = await getCategories();
      if (result.success) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }, []);
  
  const loadRoles = useCallback(async () => {
    try {
      // Roles are typically derived from user data, so we'll use a static list
      // or load from users if needed. For now, set common roles
      setRoles([
        { id: 1, code: 'admin', name: 'Admin' },
        { id: 2, code: 'instructor', name: 'Instructor' },
        { id: 3, code: 'student', name: 'Student' },
        { id: 4, code: 'hr', name: 'HR' },
        { id: 5, code: 'super_admin', name: 'Super Admin' },
      ]);
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  }, []);
  
  const loadAccesses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await userCategoryAccessService.getAllUserCategoryAccesses();
      if (result.success) {
        setAccesses(result.data);
      } else {
        setError(result.error);
        toast.error(result.error || 'Failed to load accesses');
      }
    } catch (error) {
      setError(error.message);
      toast.error(error.message || 'Failed to load accesses');
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    loadUsers();
    loadCategories();
    loadRoles();
    loadAccesses();
  }, [loadUsers, loadCategories, loadRoles, loadAccesses]);
  
  const handleNewAccess = () => {
    setEditingAccess(null);
    setFormData({
      userId: '',
      categoryId: '',
      roleId: '',
      canView: true,
      canManage: false,
    });
    setShowDialog(true);
  };
  
  const handleEditAccess = (access) => {
    setEditingAccess(access);
    setFormData({
      userId: access.userId.toString(),
      categoryId: access.categoryId.toString(),
      roleId: access.roleId?.toString() || '',
      canView: access.canView,
      canManage: access.canManage,
    });
    setShowDialog(true);
  };
  
  const handleSaveAccess = async () => {
    try {
      const payload = {
        ...formData,
        userId: parseInt(formData.userId),
        categoryId: parseInt(formData.categoryId),
        roleId: formData.roleId ? parseInt(formData.roleId) : null,
        createdBy: user.dbId,
      };
      
      let result;
      if (editingAccess) {
        result = await userCategoryAccessService.updateUserCategoryAccess(editingAccess.id, { ...payload, updatedBy: user.dbId });
      } else {
        result = await userCategoryAccessService.createUserCategoryAccess(payload);
      }
      
      if (result.success) {
        toast.success(editingAccess ? 'Access updated' : 'Access created');
        setShowDialog(false);
        loadAccesses();
      } else {
        toast.error(result.error || 'Failed to save access');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to save access');
    }
  };
  
  const handleDeleteAccess = async (access) => {
    const userItem = users.find(u => u.id === access.userId);
    const category = categories.find(c => c.id === access.categoryId);
    const userName = userItem?.displayName || userItem?.firstName || 'User';
    const categoryName = category?.nameEn || category?.name || 'Category';
    
    deleteEntity('user category access', access, async () => {
      const result = await userCategoryAccessService.deleteUserCategoryAccess(access.id);
      if (result.success) {
        toast.success('Access deleted');
        loadAccesses();
      } else {
        toast.error(result.error || 'Failed to delete access');
      }
    });
  };
  
  if (!isSuperAdmin) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.125rem', fontWeight: '500', color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}>
          Access Denied
        </div>
        <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginTop: '0.5rem' }}>
          You need super admin privileges to manage user category access.
        </div>
      </div>
    );
  }
  
  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            User Category Access
          </h1>
          <p style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
            Manage which users can access specific categories and programs
          </p>
        </div>
        
        <Button onClick={handleNewAccess}>
          New Access
        </Button>
      </div>
      
      {loading ? (
        <SimpleLoading />
      ) : error ? (
        <div style={{ padding: '1rem', color: 'red' }}>
          {error}
        </div>
      ) : (
        <Card>
          <CardBody>
            {accesses.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {accesses.map((access) => (
                  <div
                    key={access.id}
                    style={{
                      padding: '1rem',
                      border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '500', fontSize: '1rem' }}>
                        {access.user?.displayName || access.user?.firstName} - {access.category?.nameEn}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginTop: '0.25rem' }}>
                        {access.canView ? 'Can View' : ''} {access.canManage ? 'Can Manage' : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Button variant="outline" size="sm" onClick={() => handleEditAccess(access)}>
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteAccess(access)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                No user category accesses configured
              </div>
            )}
          </CardBody>
        </Card>
      )}
      
      <Modal
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        title={editingAccess ? 'Edit Access' : 'New Access'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>User</label>
            <Select
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              options={[
                { value: '', label: 'Select user' },
                ...users.map(user => {
                  const roles = getUserRoles(user);
                  const primaryRole = roles[0] || 'student';
                  const roleIcon = getUserRoleIcon(primaryRole);
                  return {
                    value: user.id.toString(),
                    label: (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {roleIcon}
                        {user.displayName || user.firstName} ({user.email})
                      </span>
                    )
                  };
                })
              ]}
              disabled={!!editingAccess}
            />
          </div>
            
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Category</label>
            <Select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              options={[
                { value: '', label: 'Select category' },
                ...categories.map(category => ({
                  value: category.id.toString(),
                  label: isRTL ? `${category.nameAr || category.nameEn} (${category.categoryType})` : `${category.nameEn} (${category.categoryType})`
                }))
              ]}
            />
          </div>
            
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Role (Optional)</label>
            <Select
              value={formData.roleId}
              onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
              options={[
                { value: '', label: 'All roles' },
                ...roles.map(role => ({
                  value: role.id.toString(),
                  label: role.nameEn
                }))
              ]}
            />
          </div>
            
          <div style={{ display: 'flex', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Checkbox
                checked={formData.canView}
                onChange={(e) => setFormData({ ...formData, canView: e.target.checked })}
              />
              <span style={{ fontSize: '0.875rem' }}>Can View</span>
            </label>
              
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Checkbox
                checked={formData.canManage}
                onChange={(e) => setFormData({ ...formData, canManage: e.target.checked })}
              />
              <span style={{ fontSize: '0.875rem' }}>Can Manage</span>
            </label>
          </div>
            
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAccess}>
              Save
            </Button>
          </div>
        </div>
      </Modal>
      
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={hideDeleteModal}
        onConfirm={handleDeleteConfirm}
        entityType={deleteModal.entityType}
        entityName={deleteModal.entityName}
        loading={false}
        theme={theme}
        t={t}
      />
    </div>
  );
};

export default UserCategoryAccessPage;
