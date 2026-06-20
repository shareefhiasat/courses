import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { Button, SimpleLoading, useToast, Input, Select, DeleteModal, UserSelect, CategorySelect } from '@ui';
import { useDeleteModal } from '@hooks/useDeleteModal.js';
import AdvancedDataGrid from '@components/ui/AdvancedDataGrid';
import userCategoryAccessService from '@services/business/userCategoryAccessService.js';
import { getCategories } from '@services/business/categoryService.js';
import { getAllUsers, getUserRoles } from '@services/business/userService.js';
import { getAllPrograms } from '@services/business/programService.js';
import { getAllSubjects } from '@services/business/subjectService.js';
import { getAllClasses } from '@services/business/classService.js';
import { formatDateTime } from '@utils/dateUtils.js';
import { getUserDisplayName as getAuthUserDisplayName } from '@services/business/authService';

const UserCategoryAccessPage = () => {
  const { user, isSuperAdmin } = useAuth();
  const { t, isRTL, lang } = useLang();
  const { theme } = useTheme();
  const toast = useToast();
  const { deleteModal, deleteEntity, handleDeleteConfirm, hideDeleteModal } = useDeleteModal(t);
  
  const [accesses, setAccesses] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formState, setFormState] = useState('creating'); // creating, editing
  const [editingAccess, setEditingAccess] = useState(null);
  const [saving, setSaving] = useState(false);
  const [gridKey, setGridKey] = useState(0);

  // Filter state
  const [filterSearch, setFilterSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterClass, setFilterClass] = useState('');
  
  const [formData, setFormData] = useState({
    userId: '',
    categoryId: '',
    programId: '',
    subjectId: '',
    classId: '',
  });
  
  const loadUsers = useCallback(async () => {
    try {
      const result = await getAllUsers();
      if (result.success) {
        // Filter users to only show admin, HR, and instructor users
        const filteredUsers = (result.data || []).filter(user => {
          const roles = getUserRoles(user);
          return roles.includes('admin') || roles.includes('hr') || roles.includes('instructor');
        });
        setUsers(filteredUsers);
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
  
  const loadPrograms = useCallback(async () => {
    try {
      const result = await getAllPrograms();
      if (result.success) {
        setPrograms(result.data);
      }
    } catch (error) {
      console.error('Error loading programs:', error);
    }
  }, []);
  
  const loadSubjects = useCallback(async () => {
    try {
      const result = await getAllSubjects();
      if (result.success) {
        setSubjects(result.data);
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  }, []);
  
  const loadClasses = useCallback(async () => {
    try {
      const result = await getAllClasses();
      if (result.success) {
        setClasses(result.data);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  }, []);
  
  const loadAccesses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {};
      if (filterCategory) filters.categoryId = filterCategory;
      if (filterProgram) filters.programId = filterProgram;
      if (filterSubject) filters.subjectId = filterSubject;
      if (filterClass) filters.classId = filterClass;
      
      const result = await userCategoryAccessService.getAllUserCategoryAccesses(filters);
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
  }, [toast, filterCategory, filterProgram, filterSubject, filterClass]);

  useEffect(() => {
    loadAccesses();
  }, [loadAccesses]);
  
  useEffect(() => {
    loadUsers();
    loadCategories();
    loadPrograms();
    loadSubjects();
    loadClasses();
  }, [loadUsers, loadCategories, loadPrograms, loadSubjects, loadClasses]);
  
  const handleNewAccess = () => {
    setEditingAccess(null);
    setFormData({
      userId: '',
      categoryId: '',
      programId: '',
      subjectId: '',
      classId: '',
    });
    setFormState('creating');
  };
  
  const handleEditAccess = (access) => {
    setEditingAccess(access);
    setFormData({
      userId: access.userId.toString(),
      categoryId: access.categoryId.toString(),
      programId: access.programId?.toString() || '',
      subjectId: access.subjectId?.toString() || '',
      classId: access.classId?.toString() || '',
    });
    setFormState('editing');
  };
  
  const handleSaveAccess = async (e) => {
    e?.preventDefault();
    try {
      setSaving(true);

      // Validation
      if (!formData.userId || formData.userId === null || formData.userId === undefined || (typeof formData.userId === 'string' && formData.userId.trim() === '')) {
        toast.error('User is required');
        return;
      }
      if (!formData.categoryId || formData.categoryId === null || formData.categoryId === undefined || (typeof formData.categoryId === 'string' && formData.categoryId.trim() === '')) {
        toast.error('Category is required');
        return;
      }

      const payload = {
        userId: formData.userId ? parseInt(formData.userId) : null,
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
        programId: formData.programId ? parseInt(formData.programId) : null,
        subjectId: formData.subjectId ? parseInt(formData.subjectId) : null,
        classId: formData.classId ? parseInt(formData.classId) : null,
      };

      let result;
      if (editingAccess) {
        result = await userCategoryAccessService.updateUserCategoryAccess(parseInt(editingAccess.id), { ...payload, updatedBy: user.dbId });
      } else {
        result = await userCategoryAccessService.createUserCategoryAccess({ ...payload, createdBy: user.dbId });
      }

      if (result.success) {
        toast.success(editingAccess ? t('access_updated') : t('access_created'));
        resetForm();
        setGridKey(prev => prev + 1);
        loadAccesses();
      } else {
        toast.error(result.error || t('failed_to_save_access'));
      }
    } catch (error) {
      toast.error(error.message || t('failed_to_save_access'));
    } finally {
      setSaving(false);
    }
  };
  
  const resetForm = useCallback(() => {
    setFormData({
      userId: '',
      categoryId: '',
      programId: '',
      subjectId: '',
      classId: '',
    });
    setEditingAccess(null);
    setFormState('creating');
  }, []);

  const handleCancel = useCallback(() => {
    resetForm();
  }, [resetForm]);

  const formatDate = useCallback((dateValue) => {
    return formatDateTime(dateValue, lang);
  }, [lang]);

  const localizedName = useCallback((entity) => {
    if (!entity) return '—';
    return lang === 'ar'
      ? (entity.nameAr || entity.nameEn || entity.name)
      : (entity.nameEn || entity.nameAr || entity.name);
  }, [lang]);

  const handleDeleteAccess = async (access) => {
    try {
      setSaving(true);
      const result = await userCategoryAccessService.deleteUserCategoryAccess(access.id);

      if (result.success) {
        toast.success(t('access_deleted'));
        setGridKey(prev => prev + 1);
        loadAccesses();
      } else {
        toast.error(result.error || t('failed_to_delete_access'));
      }
    } catch (error) {
      toast.error(error.message || t('failed_to_delete_access'));
    } finally {
      setSaving(false);
    }
  };
  
  // Build grid columns
  const gridColumns = useMemo(() => {
    const columns = [
      {
        field: 'user',
        headerName: t('user'),
        flex: 1,
        minWidth: 150,
        renderCell: (params) => {
          const rowUser = params?.row?.user;
          if (!rowUser) return '—';
          return getAuthUserDisplayName(rowUser, [], lang) || rowUser.displayName || rowUser.firstName || t('user');
        }
      },
      {
        field: 'category',
        headerName: t('category'),
        flex: 1,
        minWidth: 150,
        renderCell: (params) => localizedName(params?.row?.category)
      },
      {
        field: 'program',
        headerName: t('program'),
        flex: 1,
        minWidth: 150,
        renderCell: (params) => localizedName(params?.row?.program)
      },
      {
        field: 'subject',
        headerName: t('subject'),
        flex: 1,
        minWidth: 150,
        renderCell: (params) => localizedName(params?.row?.subject)
      },
      {
        field: 'class',
        headerName: t('class'),
        flex: 1,
        minWidth: 150,
        renderCell: (params) => localizedName(params?.row?.class)
      }
    ];

    // Add audit columns
    columns.push(
      {
        field: 'creator',
        headerName: t('created_by'),
        flex: 1,
        minWidth: 150,
        renderCell: (params) => {
          const creator = params?.row?.creator;
          if (!creator) return '—';
          return getAuthUserDisplayName(creator, [], lang);
        }
      },
      {
        field: 'createdAt',
        headerName: t('created_at'),
        flex: 0.8,
        minWidth: 120,
        renderCell: (params) => {
          const value = params?.value;
          return formatDate(value);
        }
      },
      {
        field: 'updater',
        headerName: t('updated_by'),
        flex: 1,
        minWidth: 150,
        renderCell: (params) => {
          const updater = params?.row?.updater;
          if (!updater) return '—';
          return getAuthUserDisplayName(updater, [], lang);
        }
      },
      {
        field: 'updatedAt',
        headerName: t('updated_at'),
        flex: 0.8,
        minWidth: 120,
        renderCell: (params) => {
          const value = params?.value;
          return formatDate(value);
        }
      },
      {
        field: 'actions',
        headerName: t('actions'),
        flex: 1,
        minWidth: 150,
        renderCell: (params) => {
          const row = params?.row || {};

          return (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditAccess(row)}
                disabled={saving}
              >
                {t('edit') || 'Edit'}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteEntity('user access', row, () => handleDeleteAccess(row))}
                disabled={saving}
              >
                {t('delete') || 'Delete'}
              </Button>
            </div>
          );
        }
      }
    );

    return columns;
  }, [formatDate, handleEditAccess, deleteEntity, saving, t, lang, localizedName]);

  // Derived filtered rows - backend handles filtering
  const filteredAccesses = accesses;

  if (!isSuperAdmin) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.125rem', fontWeight: '500', color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}>
          {t('access_denied')}
        </div>
        <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginTop: '0.5rem' }}>
          {t('super_admin_required')}
        </div>
      </div>
    );
  }
  
  return (
    <div style={{ padding: '1.5rem' }}>
      {/* Form - Always visible */}
      <form onSubmit={handleSaveAccess} style={{ marginBottom: '2rem' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div>
              <UserSelect
                value={formData.userId}
                onChange={(value) => {
                  if (value && value !== 'all') {
                    setFormData({ ...formData, userId: value });
                  }
                }}
                users={users}
                disabled={saving}
                placeholder={`${t('user')} *`}
              />
            </div>

            <div>
              <CategorySelect
                categories={categories}
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                disabled={saving}
                theme={theme}
                placeholder={`${t('category')} *`}
              />
            </div>

            <div>
              <Select
                value={formData.programId}
                onChange={(e) => {
                  const newProgramId = e.target.value;
                  setFormData({
                    ...formData,
                    programId: newProgramId,
                    subjectId: '',
                    classId: ''
                  });
                }}
                options={[
                  { value: '', label: t('select_program') },
                  ...programs.map(program => ({
                    value: program.id.toString(),
                    label: localizedName(program)
                  }))
                ]}
                disabled={saving}
                placeholder={`${t('program')} (${t('optional')})`}
              />
            </div>

            <div>
              <Select
                value={formData.subjectId}
                onChange={(e) => {
                  const newSubjectId = e.target.value;
                  setFormData({
                    ...formData,
                    subjectId: newSubjectId,
                    classId: ''
                  });
                }}
                options={[
                  { value: '', label: t('select_subject') },
                  ...subjects
                    .filter(subject => !formData.programId || subject.programId === parseInt(formData.programId))
                    .map(subject => ({
                      value: subject.id.toString(),
                      label: localizedName(subject)
                    }))
                ]}
                disabled={saving}
                placeholder={`${t('subject')} (${t('optional')})`}
              />
            </div>

            <div>
              <Select
                value={formData.classId}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                options={[
                  { value: '', label: t('select_class') },
                  ...classes
                    .filter(cls => {
                      if (!formData.subjectId) return false;
                      return cls.subjectId === parseInt(formData.subjectId);
                    })
                    .map(cls => ({
                      value: cls.id.toString(),
                      label: localizedName(cls)
                    }))
                ]}
                disabled={saving}
                placeholder={`${t('class')} (${t('optional')})`}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button
              type="submit"
              disabled={saving}
              loading={saving}
            >
              {saving ? t('saving') : (formState === 'creating' ? t('create') : t('update'))}
            </Button>
            {formState === 'editing' && (
              <Button
                variant="outline"
                type="button"
                onClick={handleCancel}
                disabled={saving}
              >
                {t('cancel') || 'Cancel'}
              </Button>
            )}
          </div>
        </form>

      {/* Filter Bar */}
      <div style={{
        display: 'flex', gap: '0.75rem', flexWrap: 'wrap',
        marginBottom: '1rem', alignItems: 'flex-end'
      }}>
        <div style={{ flex: '2 1 200px' }}>
          <Input
            value={filterSearch}
            onChange={e => setFilterSearch(e.target.value)}
            placeholder={t('search') || 'Search'}
          />
        </div>
        <div style={{ flex: '1 1 140px' }}>
          <Select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            options={[
              { value: '', label: t('all_categories') },
              ...categories.map(category => ({
                value: category.id.toString(),
                label: localizedName(category)
              }))
            ]}
            placeholder={t('category') || 'Category'}
          />
        </div>
        <div style={{ flex: '1 1 140px' }}>
          <Select
            value={filterProgram}
            onChange={e => setFilterProgram(e.target.value)}
            options={[
              { value: '', label: t('all_programs') },
              ...programs.map(program => ({
                value: program.id.toString(),
                label: localizedName(program)
              }))
            ]}
            placeholder={t('program') || 'Program'}
          />
        </div>
        <div style={{ flex: '1 1 140px' }}>
          <Select
            value={filterSubject}
            onChange={e => setFilterSubject(e.target.value)}
            options={[
              { value: '', label: t('all_subjects') },
              ...subjects.map(subject => ({
                value: subject.id.toString(),
                label: localizedName(subject)
              }))
            ]}
            placeholder={t('subject') || 'Subject'}
          />
        </div>
        <div style={{ flex: '1 1 140px' }}>
          <Select
            value={filterClass}
            onChange={e => setFilterClass(e.target.value)}
            options={[
              { value: '', label: t('all_classes') },
              ...classes.map(cls => ({
                value: cls.id.toString(),
                label: localizedName(cls)
              }))
            ]}
            placeholder={t('class') || 'Class'}
          />
        </div>
        {(filterSearch || filterCategory || filterProgram || filterSubject || filterClass) && (
          <button
            onClick={() => { setFilterSearch(''); setFilterCategory(''); setFilterProgram(''); setFilterSubject(''); setFilterClass(''); }}
            style={{
              border: `1px solid ${theme === 'dark' ? '#374151' : '#d1d5db'}`,
              backgroundColor: 'transparent', cursor: 'pointer',
              color: theme === 'dark' ? '#9ca3af' : '#6b7280'
            }}
          >{t('clear_filters')}</button>
        )}
      </div>

      {/* Grid Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '500' }}>
          {t('user_access_title', { count: `${filteredAccesses.length}${filteredAccesses.length !== accesses.length ? ` / ${accesses.length}` : ''}` })}
        </h3>
      </div>

      {/* Data Grid */}
      <div style={{
        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
        border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
        borderRadius: '0.5rem',
        overflow: 'hidden'
      }}>
        <AdvancedDataGrid
          key={gridKey}
          rows={filteredAccesses}
          columns={gridColumns}
          loading={loading}
          getRowId={(row) => row.id}
          disableSelectionOnClick
          hideFooter
        />
      </div>

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={hideDeleteModal}
        onConfirm={handleDeleteConfirm}
        entityType={deleteModal.entityType}
        entityName={deleteModal.entityName}
        loading={saving}
        theme={theme}
        t={t}
      />
    </div>
  );
};

export default UserCategoryAccessPage;
