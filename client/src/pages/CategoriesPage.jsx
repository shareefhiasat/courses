import React, { useEffect, useState, useCallback, useMemo } from 'react';
import logger from '@utils/logger';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import { Button, Select, Loading, Textarea, useToast, AdvancedDataGrid, Card, CardBody, Input } from '@ui';
import { getCategories, addCategory, updateCategory, deleteCategory } from '@firebaseServices/categoryService';
import { 
  PAGE_STATES, 
  FORM_STATES, 
  MODAL_TYPES
} from '@constants/pageTypes';
import styles from './ProgramsManagementPage.module.css';

const CategoriesPage = ({ isDashboardTab = false, hideActions = false }) => {
  const { user, isInstructor, isAdmin, isSuperAdmin } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const toast = useToast();
  const [pageState, setPageState] = useState(PAGE_STATES.LOADING);
  const [formState, setFormState] = useState(FORM_STATES.IDLE);
  const [categories, setCategories] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, item: null, type: MODAL_TYPES.DELETE });
  const [formData, setFormData] = useState({
    name_en: '',
    name_ar: '',
    icon: '',
    description_en: '',
    description_ar: '',
    color: '#3b82f6',
    order: 1
  });
  const [saving, setSaving] = useState(false);

  // Dynamic form validation
  const formErrors = useMemo(() => {
    const errors = {};
    
    if (!formData.name_en.trim()) {
      errors.name_en = t('name_english_required') || 'English name is required';
    }
    
    if (!formData.name_ar.trim()) {
      errors.name_ar = t('name_arabic_required') || 'Arabic name is required';
    }
    
    if (formData.order && (isNaN(formData.order) || parseInt(formData.order) < 1)) {
      errors.order = t('order_must_be_positive') || 'Order must be a positive number';
    }
    
    return errors;
  }, [formData, t]);

  // Check if form is valid
  const isFormValid = useMemo(() => {
    return Object.keys(formErrors).length === 0;
  }, [formErrors]);

  // Dynamic icon options from centralized icon system
  const iconOptions = useMemo(() => {
    const availableIcons = [
      'folder', 'book', 'code', 'database', 'globe', 'monitor', 
      'server', 'cloud', 'cpu', 'hard_drive', 'wifi', 'shield', 
      'lock', 'key', 'bug', 'puzzle', 'layers', 'package', 
      'terminal', 'settings', 'brain', 'star', 'heart', 'zap',
      'target', 'award', 'trophy', 'flag', 'bookmark', 'tag'
    ];
    
    return availableIcons.map(icon => ({
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
      (cat.description_en && cat.description_en.trim()) || 
      (cat.description_ar && cat.description_ar.trim())
    ).length;
    
    return { total, withIcons, withColors, withDescriptions };
  }, [categories]);

  useEffect(() => {
    if (!isInstructor && !isAdmin && !isSuperAdmin) return;
    loadData();
  }, [isInstructor, isAdmin, isSuperAdmin]);

  const loadData = async () => {
    setPageState(PAGE_STATES.LOADING);
    try {
      const result = await getCategories();
      if (result.success) {
        // Sort categories by order field
        const sortedCategories = (result.data || []).sort((a, b) => 
          (a.order || 999) - (b.order || 999)
        );
        setCategories(sortedCategories);
        
        // Show success message for data loading
        if (sortedCategories.length > 0) {
          toast.success(t('categories_loaded_successfully') || `Loaded ${sortedCategories.length} categories`);
        }
      } else {
        toast.error(t('failed_to_load_categories') + ': ' + result.error);
      }
    } catch (error) {
      logger.error('Failed to load categories:', error);
      toast.error(t('failed_to_load_categories') + ': ' + error.message);
      setPageState(PAGE_STATES.ERROR);
    } finally {
      setPageState(PAGE_STATES.READY);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Dynamic validation
    if (!isFormValid) {
      const firstError = Object.values(formErrors)[0];
      toast.error(firstError);
      return;
    }

    setSaving(true);
    try {
      const categoryData = {
        name_en: formData.name_en.trim(),
        name_ar: formData.name_ar.trim(),
        icon: formData.icon.trim(),
        description_en: formData.description_en.trim(),
        description_ar: formData.description_ar.trim(),
        color: formData.color,
        order: parseInt(formData.order) || 1
      };

      if (editingCategory) {
        // Update existing category
        const result = await updateCategory(editingCategory.docId || editingCategory.id, categoryData);
        if (result.success) {
          toast.success(t('category_updated_successfully') || 'Category updated successfully');
        } else {
          toast.error(t('failed_to_update_category') || 'Failed to update category: ' + result.error);
        }
      } else {
        // Create new category
        const result = await addCategory(categoryData);
        if (result.success) {
          toast.success(t('category_created_successfully') || 'Category created successfully');
        } else {
          toast.error(t('failed_to_create_category') || 'Failed to create category: ' + result.error);
        }
      }
      
      resetForm();
      loadData();
    } catch (error) {
      logger.error('Failed to save category:', error);
      toast.error(t('failed_to_save_category') || 'Failed to save category: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name_en: category.name_en || '',
      name_ar: category.name_ar || '',
      icon: category.icon || '',
      description_en: category.description_en || '',
      description_ar: category.description_ar || '',
      color: category.color || '#3b82f6',
      order: category.order || 1
    });
  };

  const handleDelete = (category) => {
    setDeleteModal({ open: true, item: category, type: MODAL_TYPES.DELETE });
  };

  const confirmDelete = async () => {
    if (!deleteModal.item) return;
    
    setPageState(PAGE_STATES.LOADING);
    try {
      const categoryId = deleteModal.item.docId || deleteModal.item.id;
      const result = await deleteCategory(categoryId);
      if (result.success) {
        toast.success(t('category_deleted_successfully'));
        loadData();
      } else {
        toast.error('Failed to delete category: ' + result.error);
      }
    } catch (e) {
      toast.error('Failed to delete category: ' + e.message);
    } finally {
      setPageState(PAGE_STATES.IDLE);
      setDeleteModal({ open: false, item: null });
    }
  };

  const resetForm = () => {
    setFormData({
      name_en: '',
      name_ar: '',
      icon: '',
      description_en: '',
      description_ar: '',
      color: '#3b82f6',
      order: 1
    });
    setEditingCategory(null);
  };

  if (!isInstructor && !isAdmin && !isSuperAdmin) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Access Denied</div>;
  }

  const columns = [
    {
      field: 'name_en',
      headerName: t('name_english') || 'Name (English)',
      flex: 1,
      minWidth: 150
    },
    {
      field: 'name_ar',
      headerName: t('name_arabic') || 'Name (Arabic)',
      flex: 1,
      minWidth: 150
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
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            {getThemedIcon('ui', icon, 16, theme)}
            {icon}
          </span>
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
      field: 'order',
      headerName: t('order') || 'Order',
      flex: 0.5,
      minWidth: 80
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
              variant="outline"
              onClick={() => handleEdit(row)}
              disabled={hideActions}
            >
              {getThemedIcon('ui', 'edit', 16, theme)}
            </Button>
            <Button
              size="small"
              variant="outline"
              onClick={() => handleDelete(row)}
              disabled={hideActions}
              style={{ color: '#dc2626', borderColor: '#dc2626' }}
            >
              {getThemedIcon('ui', 'delete', 16, theme)}
            </Button>
          </div>
        );
      }
    }
  ];

  return (
    <div className={styles.container}>
      {!isDashboardTab && editingCategory && (
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
          {getThemedIcon('ui', 'edit', 16, theme)} {t('editing_category') || 'Editing Category'}: {editingCategory.name_en || editingCategory.name_ar || editingCategory.docId}
        </div>
      )}

      {!isDashboardTab && (
        <form onSubmit={handleSubmit} className="dashboard-form">
          <div className="form-row">
            <Input
              value={formData.name_en}
              onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
              placeholder={t('enter_name_english') || 'Enter name in English'}
              label={t('name_english') || 'Name (English)'}
              required
              error={formErrors.name_en}
            />
            <Input
              value={formData.name_ar}
              onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
              placeholder={t('enter_name_arabic') || 'Enter name in Arabic'}
              label={t('name_arabic') || 'Name (Arabic)'}
              required
              error={formErrors.name_ar}
            />
          </div>
          <div className="form-row">
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                {t('icon') || 'Icon'}
              </label>
              <Select
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                options={[
                  { value: '', label: 'Select Icon' },
                  ...iconOptions.map(opt => ({
                    value: opt.value,
                    label: (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {getThemedIcon('ui', opt.icon, 16, theme)}
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
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              type="color"
              label={t('color') || 'Color'}
            />
          </div>
          <div className="form-row">
            <Input
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: e.target.value })}
              type="number"
              min="1"
              label={t('order') || 'Order'}
              error={formErrors.order}
            />
          </div>
          <div className="form-row">
            <Textarea
              value={formData.description_en}
              onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
              placeholder={t('enter_description_english') || 'Enter description in English'}
              rows={3}
              label={t('description_english') || 'Description (English)'}
            />
          </div>
          <div className="form-row">
            <Textarea
              value={formData.description_ar}
              onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
              placeholder={t('enter_description_arabic') || 'Enter description in Arabic'}
              rows={3}
              label={t('description_arabic') || 'Description (Arabic)'}
            />
          </div>
          <div className="form-actions">
            <Button 
              type="submit" 
              variant="primary" 
              loading={saving}
              disabled={!isFormValid || saving}
            >
              {saving ? (t('saving') || 'Saving...') : (editingCategory ? (t('update_category') || 'Update') : (t('add_category') || 'Add'))}
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
      )}

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
            {getThemedIcon('ui', 'palette', 16, theme)}
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

      <div className={styles.content}>
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
          fancyVariant="dots"
        />
      </div>

      {deleteModal.open && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <Card style={{ maxWidth: '400px', margin: '1rem' }}>
            <CardBody>
              <h3>{t('confirm_delete_category') || 'Confirm Delete'}</h3>
              <p>{t('confirm_delete_message') || 'Are you sure you want to delete this category? This action cannot be undone.'}</p>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <Button variant="outline" onClick={() => setDeleteModal({ open: false, item: null })}>
                  {t('cancel') || 'Cancel'}
                </Button>
                <Button variant="primary" onClick={confirmDelete} style={{ backgroundColor: '#dc2626' }}>
                  {t('delete') || 'Delete'}
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;
