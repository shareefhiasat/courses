import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { info, error, warn, debug } from '@logger';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon, CATEGORY_ICONS } from '@constants';
import { Button, Select, SimpleLoading, Textarea, useToast, AdvancedDataGrid, Card, CardBody, Input } from '@ui';
import { DeleteModal, useDeleteModal } from '@ui';
import { getCategories, addCategory, updateCategory, deleteCategory } from '@services/business/categoryService';
import { getUsers, getUserDisplayName } from '@services/business/userService';
import { getUserDisplayName as getAuthUserDisplayName } from '@services/business/authService';
import { formatDateTime } from '@utils/dateUtils.js';
import { useLookupTypes } from '@hooks/useLookupTypes.js';
import { 
  PAGE_STATES, 
  FORM_STATES
} from '@constants/pageTypes';

const CategoriesPage = ({ isDashboardTab = false, hideActions = false }) => {
  const { user, isInstructor, isAdmin, isSuperAdmin } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const toast = useToast();
  
  // Use lookup hook for category-types (always call hook, conditionally use data)
  const { data: lookupData, loading: lookupLoading, error: lookupError, refetch: refetchLookup } = useLookupTypes({
    types: ['category-types'],
    activeOnly: true // Only show active categories in the grid
  });
  
  const [pageState, setPageState] = useState(PAGE_STATES.LOADING);
  const [formState, setFormState] = useState(FORM_STATES.IDLE);
  const [categories, setCategories] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const { deleteModal, deleteEntity, handleDeleteConfirm, hideDeleteModal } = useDeleteModal(t);
  const [formData, setFormData] = useState({
    nameEn: '',
    nameAr: '',
    code: '',
    icon: '',
    descriptionEn: '',
    descriptionAr: '',
    color: '#3b82f6',
    sortOrder: 1
  });
  const [saving, setSaving] = useState(false);
  // Remove user caching since backend now includes user objects in the response

  // Check if user has permission to view categories
  const hasPermission = isInstructor || isAdmin || isSuperAdmin;
  
  // Don't render anything if user doesn't have permission
  if (!hasPermission) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.125rem', fontWeight: '500', color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}>
          {t('access_denied') || 'Access Denied'}
        </div>
        <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginTop: '0.5rem' }}>
          {t('categories_permission_required') || 'You need instructor or admin privileges to view categories.'}
        </div>
      </div>
    );
  }

  // Refs for uncontrolled inputs
  const nameEnRef = useRef(null);
  const nameArRef = useRef(null);
  const descEnRef = useRef(null);
  const descArRef = useRef(null);

  // Sync refs when editing
  useEffect(() => {
    if (nameEnRef.current) nameEnRef.current.value = formData.nameEn || '';
    if (nameArRef.current) nameArRef.current.value = formData.nameAr || '';
    if (descEnRef.current) descEnRef.current.value = formData.descriptionEn || '';
    if (descArRef.current) descArRef.current.value = formData.descriptionAr || '';
  }, [editingCategory, formData.nameEn, formData.nameAr, formData.descriptionEn, formData.descriptionAr]);

  // Read text values from refs into form state before submit
  const syncRefsToState = useCallback(() => {
    return {
      nameEn: nameEnRef.current?.value ?? formData.nameEn,
      nameAr: nameArRef.current?.value ?? formData.nameAr,
      descriptionEn: descEnRef.current?.value ?? formData.descriptionEn,
      descriptionAr: descArRef.current?.value ?? formData.descriptionAr
    };
  }, [formData.nameEn, formData.nameAr, formData.descriptionEn, formData.descriptionAr]);

  // Debug: Monitor form data changes
  useEffect(() => {
    info('🔍 [FORM] Form data changed:', formData);
  }, [formData]);

  // Format date with time in Qatar timezone
  const formatDate = useCallback((dateValue) => {
    return formatDateTime(dateValue, lang);
  }, [lang]);

  // Dynamic form validation
  const formErrors = useMemo(() => {
    const errors = {};
    
    if (formData.sortOrder && (isNaN(formData.sortOrder) || parseInt(formData.sortOrder) < 1)) {
      errors.sort = t('categories_sort_must_be_positive');
    }
    
    return errors;
  }, [formData, t]);

  // Check if form is valid
  const isFormValid = useMemo(() => {
    return Object.keys(formErrors).length === 0;
  }, [formErrors]);

  // Dynamic icon options from centralized icon system
  const iconOptions = useMemo(() => {
    return Object.values(CATEGORY_ICONS).map(icon => ({
      value: icon,
      label: t(icon) || icon.charAt(0).toUpperCase() + icon.slice(1).replace('_', ' '),
      icon: icon
    }));
  }, [t]);

  // Dynamic category statistics
  const categoryStats = useMemo(() => {
    const total = categories.length;
    const withIcons = categories.filter(cat => cat.icon).length;
    const withColors = categories.filter(cat => cat.color && cat.color !== '#3b82f6').length;
    const withDescriptions = categories.filter(cat => 
      (cat.descriptionEn && cat.descriptionEn.trim()) || 
      (cat.descriptionAr && cat.descriptionAr.trim())
    ).length;
    
    return { total, withIcons, withColors, withDescriptions };
  }, [categories]);

  useEffect(() => {
    // Update categories when lookup data changes (permission already checked above)
    if (lookupData && lookupData['category-types']) {
      const categoryTypes = lookupData['category-types'] || [];
      info('🔍 [LOAD] Categories loaded from lookup:', categoryTypes);
      // Sort categories by sort field
      const sortedCategories = categoryTypes.sort((a, b) => 
        (a.sortOrder ?? a.sort ?? 999) - (b.sortOrder ?? b.sort ?? 999)
      );
      info('🔍 [LOAD] Sorted categories:', sortedCategories);
      setCategories(sortedCategories);
      setPageState(PAGE_STATES.READY);
    } else if (lookupError) {
      error('Failed to load categories:', lookupError);
      toast.error(t('failed_to_load_categories') + ': ' + lookupError.message);
      setPageState(PAGE_STATES.ERROR);
    } else if (lookupLoading) {
      setPageState(PAGE_STATES.LOADING);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lookupData, lookupLoading, lookupError, t, toast]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    // Read text fields from refs (uncontrolled inputs)
    const textValues = syncRefsToState();
    
    // Dynamic validation
    if (!isFormValid) {
      const firstError = Object.values(formErrors)[0];
      toast.error(firstError);
      return;
    }

    setSaving(true);
    try {
      const categoryData = {
        nameEn: textValues.nameEn.trim(),
        nameAr: textValues.nameAr.trim(),
        code: formData.code.trim() || textValues.nameEn.trim().toUpperCase().replace(/\s+/g, '_'),
        icon: formData.icon.trim(),
        descriptionEn: textValues.descriptionEn.trim(),
        descriptionAr: textValues.descriptionAr.trim(),
        color: formData.color,
        sortOrder: parseInt(formData.sortOrder) || 1
      };
      
      info('🔍 [SUBMIT] Submitting category data:', categoryData);
      info('🔍 [SUBMIT] Form state before submit:', formData);
      info('🔍 [SUBMIT] Text values from refs:', textValues);

      if (editingCategory) {
        // Update existing category - use categoryService
        info('🔍 [SUBMIT] Updating category with ID:', editingCategory.id);
        const result = await updateCategory(editingCategory.id, categoryData, user);
        info('🔍 [SUBMIT] Update result:', result);
        
        if (result.success) {
          toast.success(t('category_updated_successfully') || 'Category updated successfully');
          // Refetch lookup data to refresh the grid
          refetchLookup();
        } else {
          toast.error(t('categories_failed_to_update_category') + (result.error || result.message));
        }
      } else {
        // Create new category - use categoryService
        info('🔍 [SUBMIT] Creating new category');
        const result = await addCategory(categoryData, user);
        info('🔍 [SUBMIT] Create result:', result);
        
        if (result.success) {
          toast.success(t('category_created_successfully') || 'Category created successfully');
          // Refetch lookup data to refresh the grid
          refetchLookup();
        } else {
          toast.error(t('categories_failed_to_create_category') + (result.error || result.message));
        }
      }
      
      resetForm();
      // Refresh the lookup data by triggering a re-fetch
      // The lookup hook will automatically update when the data changes
    } catch (error) {
      error('Failed to save category:', error);
      toast.error(t('categories_failed_to_save_category') + error.message);
    } finally {
      setSaving(false);
    }
  }, [formData, editingCategory, t, toast, formErrors, isFormValid, syncRefsToState, user, refetchLookup]);

  const handleEdit = useCallback((category) => {
    info('🔍 [EDIT] Editing category:', category);
    setEditingCategory(category);
    
    const formDataToSet = {
      nameEn: category.nameEn || '',
      nameAr: category.nameAr || '',
      code: category.code || '',
      icon: category.icon || '',
      descriptionEn: category.descriptionEn || '',
      descriptionAr: category.descriptionAr || '',
      color: category.color || '#3b82f6',
      sortOrder: category.sortOrder ?? category.sort ?? 1
    };
    
    info('🔍 [EDIT] Setting form data:', formDataToSet);
    setFormData(formDataToSet);
  }, []);

  const handleDelete = useCallback((category) => {
    deleteEntity('category', category, async () => {
      // Optimistically remove from UI
      setCategories(prev => prev.filter(c => c.id !== category.id));
      try {
        const result = await deleteCategory(category.id, user);
        info('🔍 [DELETE] Delete result:', result);
        
        if (result.success) {
          toast?.success(t('category_deleted_successfully') || 'Category deleted successfully');
          // Refetch lookup data to refresh the grid
          refetchLookup();
        } else {
          // Rollback on failure
          setCategories(prev => [...prev, category]);
          toast?.showError(result.error || result.message);
        }
      } catch (error) {
        // Rollback on error
        setCategories(prev => [...prev, category]);
        error('Delete failed:', error);
        toast?.showError(error.message);
      }
    });
  }, [deleteEntity, toast, t, user, refetchLookup]);

  const resetForm = () => {
    setFormData({
      nameEn: '',
      nameAr: '',
      code: '',
      icon: '',
      descriptionEn: '',
      descriptionAr: '',
      color: '#3b82f6',
      sortOrder: 1
    });
    setEditingCategory(null);
  };

  const columns = useMemo(() => [
    {
      field: 'nameEn',
      headerName: t('name_english') || 'Name (English)',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => {
        const value = params?.value;
        return value || '—';
      }
    },
    {
      field: 'nameAr',
      headerName: t('name_arabic') || 'Name (Arabic)',
      flex: 1,
      minWidth: 150
    },
    {
      field: 'descriptionEn',
      headerName: t('description_english') || 'Description (English)',
      flex: 1.5,
      minWidth: 200,
      renderCell: (params) => {
        const value = params?.value || '';
        return (
          <div style={{ 
            maxWidth: '300px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }} title={value}>
            {value || '—'}
          </div>
        );
      }
    },
    {
      field: 'descriptionAr',
      headerName: t('description_arabic') || 'Description (Arabic)',
      flex: 1.5,
      minWidth: 200,
      renderCell: (params) => {
        const value = params?.value || '';
        return (
          <div style={{ 
            maxWidth: '300px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }} title={value}>
            {value || '—'}
          </div>
        );
      }
    },
    {
      field: 'icon',
      headerName: t('icon') || 'Icon',
      flex: 0.5,
      minWidth: 120,
      renderCell: (params) => {
        const row = params?.row || {};
        const icon = row.icon || 'folder';
        return (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {getThemedIcon('ui', icon, 16, theme)}
            {icon}
          </div>
        );
      }
    },
    {
      field: 'color',
      headerName: t('color') || 'Color',
      flex: 0.5,
      minWidth: 100,
      renderCell: (params) => {
        const row = params?.row || {};
        const color = row.color || '#3b82f6';
        return (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              width: '16px',
              height: '16px',
              backgroundColor: color,
              borderRadius: '4px',
              border: '1px solid #e5e7eb'
            }} />
            <span>{color}</span>
          </div>
        );
      }
    },
    {
      field: 'sortOrder',
      headerName: t('sort') || 'Sort',
      flex: 0.5,
      minWidth: 80,
      renderCell: (params) => {
        const value = params?.value ?? params?.row?.sortOrder ?? params?.row?.sort;
        return value || '—';
      }
    },
    {
      field: 'createdAt',
      headerName: t('created_at') || 'Created At',
      flex: 0.8,
      minWidth: 120,
      renderCell: (params) => {
        const value = params?.value;
        return formatDate(value);
      }
    },
    {
      field: 'creator',
      headerName: t('created_by') || 'Created By',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => {
        const creator = params?.row?.creator;
        if (!creator) {
          return '—'; // Show dash for null/empty creator
        }
        
        // Use centralized authService for consistent display
        return getAuthUserDisplayName(creator, [], lang);
      }
    },
    {
      field: 'updatedAt',
      headerName: t('updated_at') || 'Updated At',
      flex: 0.8,
      minWidth: 120,
      renderCell: (params) => {
        const value = params?.value;
        return formatDate(value);
      }
    },
    {
      field: 'updater',
      headerName: t('updated_by') || 'Updated By',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => {
        const updater = params?.row?.updater;
        if (!updater) {
          return '—'; // Show dash for null/empty updater
        }
        
        // Use centralized authService for consistent display
        return getAuthUserDisplayName(updater, [], lang);
      }
    },
    {
      field: 'actions',
      headerName: t('actions') || 'Actions',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => {
        const row = params?.row || {};
        
        return (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              size="small"
              variant="ghost"
              onClick={() => handleEdit(row)}
              disabled={hideActions}
              icon={getThemedIcon('ui', 'edit', 16, theme)}
              title={t('edit_category') || 'Edit Category'}
            >
              {t('edit') || 'Edit'}
            </Button>
            <Button
              size="small"
              variant="ghost"
              onClick={() => handleDelete(row)}
              disabled={hideActions}
              style={{ color: '#dc2626' }}
              icon={getThemedIcon('ui', 'trash', 16, theme)}
              title={t('delete_category') || 'Delete Category'}
            >
              {t('delete') || 'Delete'}
            </Button>
          </div>
        );
      }
    }
  ], [theme, t, handleEdit, handleDelete, hideActions, toast]);

  return (
    <div>
      {editingCategory && (
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
          {getThemedIcon('ui', 'edit', 16, theme)} {t('editing_category') || 'Editing Category'}: {editingCategory.nameEn || editingCategory.nameAr || editingCategory.docId}
        </div>
      )}

      {/* Category Form */}
      <form onSubmit={handleSubmit} className="dashboard-form">
          <div className="form-row">
            <input
              ref={nameEnRef}
              type="text"
              defaultValue={formData.nameEn}
              placeholder={t('enter_name_english') || 'Enter name in English'}
              className="dashboard-input"
              required
            />
            <input
              ref={nameArRef}
              type="text"
              defaultValue={formData.nameAr}
              placeholder={t('enter_name_arabic') || 'Enter name in Arabic'}
              className="dashboard-input"
              style={{ direction: 'rtl' }}
              required
            />
            <Input
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              type="text"
              placeholder={t('enter_code') || 'Enter code (auto-generated if empty)'}
              error={formErrors.code}
            />
            <Input
              value={formData.sortOrder}
              onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
              type="number"
              min="1"
              placeholder={t('enter_sort') || 'Enter sort'}
              error={formErrors.sort}
            />
          </div>
          <div className="form-row">
            <div style={{ flex: 1 }}>
              <Select
                value={formData.icon}
                onChange={(e) => {
                  const newIcon = e.target.value;
                  info('🔍 [ICON] Icon changed from', formData.icon, 'to', newIcon);
                  setFormData({ ...formData, icon: newIcon });
                }}
                options={[
                  { value: '', label: t('select_icon') || 'Select Icon' },
                  ...iconOptions.map(opt => ({
                    value: opt.value,
                    label: (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {getThemedIcon('ui', opt.value, 16, theme)}
                        <span>{opt.label}</span>
                      </div>
                    )
                  }))
                ]}
                placeholder={t('select_icon') || 'Select an icon'}
              />
              {formData.icon && (
                <div style={{ 
                  marginTop: '8px', 
                  padding: '8px', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>{t('preview') || 'Preview'}:</span>
                  {getThemedIcon('ui', formData.icon, 20, theme)}
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>{formData.icon}</span>
                </div>
              )}
            </div>
            <Input
              value={formData.color}
              onChange={(e) => {
                const newColor = e.target.value;
                info('🔍 [COLOR] Color changed from', formData.color, 'to', newColor);
                setFormData({ ...formData, color: newColor });
              }}
              type="color"
              placeholder={t('select_color') || 'Select color'}
            />
          </div>
          <div className="form-row">
            <textarea
              ref={descEnRef}
              defaultValue={formData.descriptionEn}
              placeholder={t('enter_description_english') || 'Enter description in English'}
              className="dashboard-textarea"
              rows={3}
            />
            <textarea
              ref={descArRef}
              defaultValue={formData.descriptionAr}
              placeholder={t('enter_description_arabic') || 'Enter description in Arabic'}
              className="dashboard-textarea"
              rows={3}
              style={{ direction: 'rtl' }}
            />
          </div>
          <div className="form-actions">
            <Button 
              type="submit" 
              variant="primary" 
              loading={saving}
              disabled={!isFormValid || saving}
            >
              {saving ? (t('saving') || 'Saving...') : (editingCategory ? (t('update') || 'Update') : (t('save') || 'Save'))}
            </Button>
            {editingCategory && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setEditingCategory(null);
                  resetForm();
                }}
              >
                {t('cancel') || 'Cancel'}
              </Button>
            )}
          </div>
        </form>

      {/* Dynamic Summary Chips */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          padding: '0.5rem 0.75rem', 
          background: theme === 'dark' ? '#1f2937' : '#f8fafc', 
          border: `1px solid ${theme === 'dark' ? '#374151' : '#e2e8f0'}`, 
          borderRadius: '9999px',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: theme === 'dark' ? '#f3f4f6' : '#1f2937'
        }}>
          {getThemedIcon('ui', 'target', 16, theme)}
          {categoryStats.total} {t('total_categories') || 'Total Categories'}
        </div>
        
        {categoryStats.withIcons > 0 && (
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            padding: '0.5rem 0.75rem', 
            background: theme === 'dark' ? '#1e3a1f' : '#f0fdf4', 
            border: `1px solid ${theme === 'dark' ? '#365314' : '#bbf7d0'}`, 
            borderRadius: '9999px',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: theme === 'dark' ? '#bbf7d0' : '#166534'
          }}>
            {getThemedIcon('ui', 'star', 16, theme)}
            {categoryStats.withIcons} {t('with_icons') || 'With Icons'}
          </div>
        )}
        
        {categoryStats.withColors > 0 && (
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            padding: '0.5rem 0.75rem', 
            background: theme === 'dark' ? '#1e1b4b' : '#eef2ff', 
            border: `1px solid ${theme === 'dark' ? '#4338ca' : '#c7d2fe'}`, 
            borderRadius: '9999px',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: theme === 'dark' ? '#c7d2fe' : '#4338ca'
          }}>
            {getThemedIcon('ui', 'droplet', 16, theme)}
            {categoryStats.withColors} {t('with_custom_colors') || 'Custom Colors'}
          </div>
        )}
        
        {categoryStats.withDescriptions > 0 && (
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            padding: '0.5rem 0.75rem', 
            background: theme === 'dark' ? '#1f2937' : '#fef3c7', 
            border: `1px solid ${theme === 'dark' ? '#374151' : '#fbbf24'}`, 
            borderRadius: '9999px',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: theme === 'dark' ? '#fbbf24' : '#92400e'
          }}>
            {getThemedIcon('ui', 'file_text', 16, theme)}
            {categoryStats.withDescriptions} {t('with_descriptions') || 'With Descriptions'
          }
          </div>
        )}
      </div>

      <div>
        <AdvancedDataGrid
          rows={categories}
          getRowId={(row) => row.docId || row.id}
          columns={columns}
          pageSize={10}
          pageSizeOptions={[10, 25, 50, 100]}
          checkboxSelection
          exportFileName="categories"
          showExportButton
          exportLabel="Export"
          loadingOverlayMessage={pageState === PAGE_STATES.LOADING ? "Loading categories..." : undefined}
        />
      </div>

      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={hideDeleteModal}
        onConfirm={handleDeleteConfirm}
        entityType={deleteModal.entityType}
        entityName={deleteModal.entityName}
        loading={pageState === PAGE_STATES.LOADING}
        t={t}
      />
    </div>
  );
};

export default CategoriesPage;
