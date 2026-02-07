import React, { useState } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import { setCourse, deleteCourse } from '@firebaseServices/courseService';
import { Button, Input, NumberInput, AdvancedDataGrid, useToast } from '@ui';

const CategoriesPage = ({ 
  courses = [], 
  courseForm = { id: '', name_en: '', name_ar: '', order: 0 },
  setCourseForm,
  editingCourse,
  setEditingCourse,
  deleteModal,
  setDeleteModal,
  loadData,
  theme
}) => {
  const { t, lang } = useLang();
  const uiToast = useToast();
  const toast = {
    showSuccess: uiToast.success,
    showError: uiToast.error,
    showInfo: uiToast.info,
  };

  const handleAddDefaultCategories = async () => {
    try {
      await setCourse('programming', { name_en: 'Programming', name_ar: 'البرمجة', order: 1 });
      await setCourse('computing', { name_en: 'Computing', name_ar: 'الحوسبة', order: 2 });
      await setCourse('algorithm', { name_en: 'Algorithm', name_ar: 'الخوارزميات', order: 3 });
      await setCourse('general', { name_en: 'General', name_ar: 'عام', order: 4 });
      toast?.showSuccess('Default categories added!');
      loadData();
    } catch (err) {
      toast?.showError('Failed to add defaults: ' + err.message);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!courseForm.id.trim()) { 
      toast?.showError('Category ID required'); 
      return; 
    }
    try {
      await setCourse(courseForm.id, { 
        name_en: courseForm.name_en, 
        name_ar: courseForm.name_ar, 
        order: Number(courseForm.order) || 0 
      });
      toast?.showSuccess(editingCourse ? 'Category updated!' : 'Category created!');
      setCourseForm({ id: '', name_en: '', name_ar: '', order: 0 });
      setEditingCourse(null);
      loadData();
    } catch (err) {
      toast?.showError('Failed to save category: ' + err.message);
    }
  };

  const handleEdit = (params) => {
    setCourseForm({
      id: params.row.docId,
      name_en: params.row.name_en || '',
      name_ar: params.row.name_ar || '',
      order: params.row.order || 0
    });
    setEditingCourse(params.row.docId);
  };

  const handleDelete = (params) => {
    setDeleteModal({
      open: true,
      item: params.row,
      type: 'category',
      onConfirm: async () => {
        await deleteCourse(params.row.docId);
        toast?.showSuccess('Category deleted');
        loadData();
        setDeleteModal({ open: false, item: null, type: null, onConfirm: null });
      }
    });
  };

  const handleCancelEdit = () => {
    setCourseForm({ id: '', name_en: '', name_ar: '', order: 0 });
    setEditingCourse(null);
  };

  const columns = [
    {
      field: 'docId', 
      headerName: 'ID', 
      width: 150,
      renderCell: (params) => <code>{params.value}</code>
    },
    {
      field: 'name_en', 
      headerName: 'Name (EN)', 
      flex: 1, 
      minWidth: 200,
      renderCell: (params) => params.value || '—'
    },
    {
      field: 'name_ar', 
      headerName: 'Name (AR)', 
      flex: 1, 
      minWidth: 200,
      renderCell: (params) => params.value || '—'
    },
    {
      field: 'order', 
      headerName: 'Order', 
      width: 100,
      renderCell: (params) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          {getThemedIcon('ui', 'database', 16, theme)} {params.value ?? 0}
        </span>
      )
    },
    {
      field: 'actions', 
      headerName: 'Actions', 
      width: 200, 
      sortable: false, 
      filterable: false,
      renderCell: (params) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button 
            size="sm" 
            variant="ghost" 
            className="editHover" 
            icon={getThemedIcon('ui', 'edit', 16, theme)} 
            onClick={() => handleEdit(params)}
          >
            {t('edit') || 'Edit'}
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="deleteHover" 
            icon={getThemedIcon('ui', 'trash', 16, theme)} 
            style={{ color: '#dc2626' }} 
            onClick={() => handleDelete(params)}
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="courses-tab">
      <p style={{ color: '#666', marginBottom: '1rem' }}>{t('manage_categories')}</p>

      {courses.length === 0 && (
        <div style={{ padding: '1.5rem', background: '#f8f9fa', borderRadius: 8, marginBottom: '1rem', textAlign: 'center' }}>
          <p style={{ marginBottom: '0.75rem', color: '#555' }}>{t('no_categories_yet')}</p>
          <button
            type="button"
            onClick={handleAddDefaultCategories}
            style={{ padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #800020, #600018)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' }}
          >
            ➕ {t('add_default_categories')}
          </button>
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="dashboard-form">
        <div className="form-row">
          <Input
            placeholder="ID (e.g., python)"
            value={courseForm.id}
            onChange={(e) => setCourseForm({ ...courseForm, id: e.target.value.toLowerCase().trim() })}
            disabled={!!editingCourse}
            required
            fullWidth
          />
          <Input
            placeholder="Name (English)"
            value={courseForm.name_en}
            onChange={(e) => setCourseForm({ ...courseForm, name_en: e.target.value })}
            required
            fullWidth
          />
          <Input
            placeholder="Name (Arabic)"
            value={courseForm.name_ar}
            onChange={(e) => setCourseForm({ ...courseForm, name_ar: e.target.value })}
            fullWidth
          />
          <NumberInput
            placeholder="Order"
            value={courseForm.order}
            onChange={(e) => setCourseForm({ ...courseForm, order: e.target.value })}
            fullWidth
          />
        </div>
        <div className="form-actions">
          <Button type="submit" variant="primary">
            {editingCourse ? 'Update' : 'Add'}
          </Button>
          {editingCourse && (
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

      <AdvancedDataGrid
        rows={courses}
        getRowId={(row) => row.docId || row.id}
        columns={columns}
        pageSize={10}
        pageSizeOptions={[5, 10, 20, 50]}
        checkboxSelection
        exportFileName="categories"
        showExportButton
        exportLabel={t('export') || 'Export'}
      />
    </div>
  );
};

export default CategoriesPage;
