/**
 * Generic Lookup Management Page
 * 
 * PURPOSE: Unified CRUD interface for all lookup types
 * ARCHITECTURE: Reusable component that works with any lookup type
 * 
 * This replaces individual pages for each lookup type with a single, 
 * configurable component that handles CRUD operations for all lookups.
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Joyride from 'react-joyride';
import TourTooltip from '@ui/TourTooltip/TourTooltip';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@components/ui/ToastProvider';
import { useLookupTypes } from '@hooks/useLookupTypes.js';
import { getDatabaseUserId } from '@services/business/authService';
import { useAuditGridColumns } from '@hooks/useAuditGridColumns.js';
import api from '@api';
import { PAGE_STATES, FORM_STATES } from '@constants/pageTypes';
import { useDeleteModal } from '@components/ui/DeleteModal/DeleteModal';
import DeleteModal from '@components/ui/DeleteModal/DeleteModal';
import Button from '@components/ui/Button';
import AdvancedDataGrid from '@components/ui/AdvancedDataGrid';
import Input from '@components/ui/Input';
import Textarea from '@components/ui/Textarea';
import Select from '@components/ui/Select';
import { info as logInfo, error as logError, warn, debug } from '@services/utils/logger.js';

/**
 * Lookup type configurations
 * Each lookup type can have custom field configurations
 */
const LOOKUP_CONFIGS = {
  'category-types': {
    title: 'Category Types',
    fields: [
      { key: 'nameEn', label: 'Name (English)', type: 'text', required: true },
      { key: 'nameAr', label: 'Name (Arabic)', type: 'text', required: true },
      { key: 'descriptionEn', label: 'Description (English)', type: 'textarea', required: false },
      { key: 'descriptionAr', label: 'Description (Arabic)', type: 'textarea', required: false },
      { key: 'code', label: 'Code', type: 'text', required: true },
      { key: 'icon', label: 'Icon', type: 'text', required: false },
      { key: 'color', label: 'Color', type: 'text', required: false },
      { key: 'sortOrder', label: 'Sort Order', type: 'number', required: false, defaultValue: 1 }
    ]
  },
  'resource-types': {
    title: 'Resource Types',
    fields: [
      { key: 'nameEn', label: 'Name (English)', type: 'text', required: true },
      { key: 'nameAr', label: 'Name (Arabic)', type: 'text', required: true },
      { key: 'descriptionEn', label: 'Description (English)', type: 'textarea', required: false },
      { key: 'descriptionAr', label: 'Description (Arabic)', type: 'textarea', required: false },
      { key: 'code', label: 'Code', type: 'text', required: true },
      { key: 'icon', label: 'Icon', type: 'text', required: false },
      { key: 'color', label: 'Color', type: 'text', required: false },
      { key: 'sortOrder', label: 'Sort Order', type: 'number', required: false, defaultValue: 0 }
    ]
  },
  'priority-types': {
    title: 'Priority Types',
    fields: [
      { key: 'nameEn', label: 'Name (English)', type: 'text', required: true },
      { key: 'nameAr', label: 'Name (Arabic)', type: 'text', required: true },
      { key: 'descriptionEn', label: 'Description (English)', type: 'textarea', required: false },
      { key: 'descriptionAr', label: 'Description (Arabic)', type: 'textarea', required: false },
      { key: 'code', label: 'Code', type: 'text', required: true },
      { key: 'icon', label: 'Icon', type: 'text', required: false },
      { key: 'color', label: 'Color', type: 'text', required: false },
      { key: 'sortOrder', label: 'Sort Order', type: 'number', required: false, defaultValue: 0 }
    ]
  },
  'user-roles': {
    title: 'User Roles',
    fields: [
      { key: 'nameEn', label: 'Name (English)', type: 'text', required: true },
      { key: 'nameAr', label: 'Name (Arabic)', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea', required: false },
      { key: 'code', label: 'Code', type: 'text', required: true },
      { key: 'level', label: 'Level', type: 'number', required: false }
    ]
  },
  'subject-types': {
    title: 'Subject Types',
    fields: [
      { key: 'nameEn', label: 'Name (English)', type: 'text', required: true },
      { key: 'nameAr', label: 'Name (Arabic)', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea', required: false },
      { key: 'code', label: 'Code', type: 'text', required: true }
    ]
  },
  'assessment-types': {
    title: 'Assessment Types',
    fields: [
      { key: 'nameEn', label: 'Name (English)', type: 'text', required: true },
      { key: 'nameAr', label: 'Name (Arabic)', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea', required: false },
      { key: 'code', label: 'Code', type: 'text', required: true }
    ]
  },
  'question-types': {
    title: 'Question Types',
    fields: [
      { key: 'nameEn', label: 'Name (English)', type: 'text', required: true },
      { key: 'nameAr', label: 'Name (Arabic)', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea', required: false },
      { key: 'code', label: 'Code', type: 'text', required: true }
    ]
  },
  'attendance-status-types': {
    title: 'Attendance Status Types',
    fields: [
      { key: 'nameEn', label: 'Name (English)', type: 'text', required: true },
      { key: 'nameAr', label: 'Name (Arabic)', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea', required: false },
      { key: 'code', label: 'Code', type: 'text', required: true },
      { key: 'color', label: 'Color', type: 'text', required: false }
    ]
  },
  'enrollment-status-types': {
    title: 'Enrollment Status Types',
    fields: [
      { key: 'nameEn', label: 'Name (English)', type: 'text', required: true },
      { key: 'nameAr', label: 'Name (Arabic)', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea', required: false },
      { key: 'code', label: 'Code', type: 'text', required: true },
      { key: 'color', label: 'Color', type: 'text', required: false }
    ]
  },
  'activity-types': {
    title: 'Activity Types',
    fields: [
      { key: 'nameEn', label: 'Name (English)', type: 'text', required: true },
      { key: 'nameAr', label: 'Name (Arabic)', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea', required: false },
      { key: 'code', label: 'Code', type: 'text', required: true },
      { key: 'icon', label: 'Icon', type: 'text', required: false },
      { key: 'color', label: 'Color', type: 'text', required: false }
    ]
  },
  'participation-types': {
    title: 'Participation Types',
    fields: [
      { key: 'nameEn', label: 'Name (English)', type: 'text', required: true },
      { key: 'nameAr', label: 'Name (Arabic)', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea', required: false },
      { key: 'code', label: 'Code', type: 'text', required: true },
      { key: 'icon', label: 'Icon', type: 'text', required: false },
      { key: 'color', label: 'Color', type: 'text', required: false }
    ]
  },
  'penalty-types': {
    title: 'Penalty Types',
    fields: [
      { key: 'nameEn', label: 'Name (English)', type: 'text', required: true },
      { key: 'nameAr', label: 'Name (Arabic)', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea', required: false },
      { key: 'code', label: 'Code', type: 'text', required: true },
      { key: 'icon', label: 'Icon', type: 'text', required: false },
      { key: 'color', label: 'Color', type: 'text', required: false },
      { key: 'severity', label: 'Severity', type: 'number', required: false }
    ]
  },
  'submission-status-types': {
    title: 'Submission Status Types',
    fields: [
      { key: 'nameEn', label: 'Name (English)', type: 'text', required: true },
      { key: 'nameAr', label: 'Name (Arabic)', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea', required: false },
      { key: 'code', label: 'Code', type: 'text', required: true }
    ]
  },
  'quiz-status-types': {
    title: 'Quiz Status Types',
    fields: [
      { key: 'nameEn', label: 'Name (English)', type: 'text', required: true },
      { key: 'nameAr', label: 'Name (Arabic)', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea', required: false },
      { key: 'code', label: 'Code', type: 'text', required: true }
    ]
  },
  'user-status-types': {
    title: 'User Status Types',
    fields: [
      { key: 'nameEn', label: 'Name (English)', type: 'text', required: true },
      { key: 'nameAr', label: 'Name (Arabic)', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea', required: false },
      { key: 'code', label: 'Code', type: 'text', required: true }
    ]
  },
  'behavior-types': {
    title: 'Behavior Types',
    fields: [
      { key: 'nameEn', label: 'Name (English)', type: 'text', required: true },
      { key: 'nameAr', label: 'Name (Arabic)', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea', required: false },
      { key: 'code', label: 'Code', type: 'text', required: true },
      { key: 'icon', label: 'Icon', type: 'text', required: false },
      { key: 'color', label: 'Color', type: 'text', required: false },
      { key: 'severity', label: 'Severity', type: 'number', required: false }
    ]
  }
};

const LOOKUP_TITLE_KEYS = {
  'category-types': 'category_types',
  'resource-types': 'resource_types',
  'priority-types': 'priority_types',
  'user-roles': 'user_roles',
  'subject-types': 'subject_types',
  'assessment-types': 'assessment_types',
  'question-types': 'question_types',
  'attendance-status-types': 'attendance_status_types',
  'enrollment-status-types': 'enrollment_status_types',
  'activity-types': 'activity_types',
  'participation-types': 'participation_types',
  'penalty-types': 'penalty_types',
  'behavior-types': 'behavior_types',
};

const FIELD_LABEL_KEYS = {
  nameEn: 'name_english',
  nameAr: 'name_arabic',
  descriptionEn: 'description_english',
  descriptionAr: 'description_arabic',
  description: 'description',
  code: 'code',
  icon: 'icon',
  color: 'color',
  sortOrder: 'sort',
  severity: 'severity',
  level: 'level',
};

const LookupManagementPage = ({ lookupType }) => {
  const { user, isInstructor, isAdmin, isSuperAdmin } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const toast = useToast();
  
  // Get configuration for this lookup type
  const baseConfig = LOOKUP_CONFIGS[lookupType];
  const localizedTitle = useMemo(
    () => t(LOOKUP_TITLE_KEYS[lookupType] || lookupType),
    [lookupType, t]
  );
  const config = useMemo(() => {
    if (!baseConfig) return null;
    return {
      ...baseConfig,
      title: localizedTitle,
      fields: baseConfig.fields.map((field) => ({
        ...field,
        label: t(FIELD_LABEL_KEYS[field.key] || field.key),
      })),
    };
  }, [baseConfig, localizedTitle, t]);

  if (!config) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.125rem', fontWeight: '500', color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}>
          Unknown lookup type: {lookupType}
        </div>
      </div>
    );
  }

  // Use lookup hook for the specific type
  const { data: lookupData, loading: lookupLoading, error: lookupError, refetch: refetchLookup } = useLookupTypes({
    types: [lookupType],
    activeOnly: true // Only show active records
  });
  
  const [pageState, setPageState] = useState(PAGE_STATES.LOADING);
  const [formState, setFormState] = useState(FORM_STATES.IDLE);
  const [items, setItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const { deleteModal, deleteEntity, handleDeleteConfirm, hideDeleteModal } = useDeleteModal(t);
  const [saving, setSaving] = useState(false);

  // Initialize form data based on configuration
  const getInitialFormData = useCallback(() => {
    const initial = {};
    config.fields.forEach(field => {
      initial[field.key] = field.defaultValue || (field.type === 'number' ? 0 : (field.type === 'boolean' ? false : ''));
    });
    return initial;
  }, [config]);

  const [formData, setFormData] = useState(getInitialFormData());
  const nameEnRef = useRef(null);
  const nameArRef = useRef(null);
  const descEnRef = useRef(null);
  const descArRef = useRef(null);

  // Check if user has permission to view lookups
  const hasPermission = isInstructor || isAdmin || isSuperAdmin;
  
  // Don't render anything if user doesn't have permission
  if (!hasPermission) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.125rem', fontWeight: '500', color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}>
          {t('access_denied') || 'Access Denied'}
        </div>
      </div>
    );
  }

  // Load and process lookup data
  useEffect(() => {
    if (lookupLoading) {
      setPageState(PAGE_STATES.LOADING);
      return;
    }

    if (lookupError) {
      setPageState(PAGE_STATES.ERROR);
      return;
    }

    if (lookupData && lookupData[lookupType]) {
      const loadedItems = lookupData[lookupType] || [];
      logInfo(`🔍 [LOAD] ${config.title} loaded from lookup:`, loadedItems);
      
      // Sort items if sort field exists
      const sortedItems = [...loadedItems].sort((a, b) => {
        const aSort = a.sortOrder ?? a.sort ?? a.level;
        const bSort = b.sortOrder ?? b.sort ?? b.level;
        if (aSort !== undefined && bSort !== undefined) {
          return Number(aSort) - Number(bSort);
        }
        return (a.nameEn || '').localeCompare(b.nameEn || '');
      });
      
      logInfo(`🔍 [LOAD] Sorted ${config.title}:`, sortedItems);
      setItems(sortedItems);
      setPageState(PAGE_STATES.LOADED);
    } else {
      setItems([]);
      setPageState(PAGE_STATES.LOADED);
    }
  }, [lookupData, lookupLoading, lookupError, lookupType, config]);

  // Sync refs to form state
  const syncRefsToState = useCallback(() => {
    const synced = { ...formData };
    if (nameEnRef.current?.value) synced.nameEn = nameEnRef.current.value;
    if (nameArRef.current?.value) synced.nameAr = nameArRef.current.value;
    if (descEnRef.current?.value) synced.descriptionEn = descEnRef.current.value;
    if (descArRef.current?.value) synced.descriptionAr = descArRef.current.value;
    return synced;
  }, [formData]);

  const auditColumns = useAuditGridColumns();

  // Reset form
  const resetForm = useCallback(() => {
    setFormData(getInitialFormData());
    setEditingItem(null);
    setFormState(FORM_STATES.IDLE);
    
    // Clear refs
    if (nameEnRef.current) nameEnRef.current.value = '';
    if (nameArRef.current) nameArRef.current.value = '';
    if (descEnRef.current) descEnRef.current.value = '';
    if (descArRef.current) descArRef.current.value = '';
  }, [getInitialFormData]);

  // Handle form input changes
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Create or update item
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setFormState(FORM_STATES.SUBMITTING);
      
      // Get form data including refs
      const submitData = syncRefsToState();
      
      // Validate required fields
      const missingFields = config.fields
        .filter(field => field.required && !submitData[field.key])
        .map(field => field.label);
      
      if (missingFields.length > 0) {
        toast?.showError(`Required fields missing: ${missingFields.join(', ')}`);
        setFormState(FORM_STATES.ERROR);
        return;
      }

      // Get database user ID
      const userId = await getDatabaseUserId(user);
      
      let result;
      if (editingItem) {
        // Update existing item
        const updateData = { ...submitData, updatedBy: userId };
        result = await api.put(`/lookup/${lookupType}/${editingItem.id}`, updateData);
        logInfo('🔍 [UPDATE] Update result:', result);
      } else {
        // Create new item
        const createData = { ...submitData, createdBy: userId, updatedBy: userId };
        result = await api.post(`/lookup/${lookupType}`, createData);
        logInfo('🔍 [SUBMIT] Create result:', result);
      }

      if (result.success) {
        toast?.showSuccess(editingItem ? 'Item updated successfully' : 'Item created successfully');
        resetForm();
        refetchLookup();
      } else {
        toast?.showError(result.error || 'Operation failed');
        setFormState(FORM_STATES.ERROR);
      }
    } catch (error) {
      logError('handleSubmit error:', error);
      toast?.showError('An error occurred');
      setFormState(FORM_STATES.ERROR);
    } finally {
      setSaving(false);
    }
  }, [editingItem, syncRefsToState, config, user, lookupType, resetForm, refetchLookup, toast]);

  // Handle edit
  const handleEdit = useCallback((item) => {
    setEditingItem(item);
    setFormData(item);
    setFormState(FORM_STATES.EDITING);
    
    // Update refs
    if (nameEnRef.current) nameEnRef.current.value = item.nameEn || '';
    if (nameArRef.current) nameArRef.current.value = item.nameAr || '';
    if (descEnRef.current) descEnRef.current.value = item.descriptionEn || item.description || '';
    if (descArRef.current) descArRef.current.value = item.descriptionAr || item.description || '';
  }, []);

  // Handle delete
  const handleDelete = useCallback(async (item) => {
    try {
      setSaving(true);
      
      // Get database user ID
      const userId = await getDatabaseUserId(user);
      const requestData = { updatedBy: userId };
      
      const result = await api.delete(`/lookup/${lookupType}/${item.id}`, { data: requestData });
      
      if (result.success) {
        toast?.showSuccess('Item deleted successfully');
        refetchLookup();
      } else {
        toast?.showError(result.error || 'Delete failed');
      }
    } catch (error) {
      logError('handleDelete error:', error);
      toast?.showError('An error occurred');
    } finally {
      setSaving(false);
    }
  }, [user, lookupType, refetchLookup, toast]);

  // Cancel edit
  const handleCancel = useCallback(() => {
    resetForm();
  }, [resetForm]);

  // Render form field based on type
  const renderField = useCallback((field) => {
    const value = formData[field.key] || '';
    const placeholder = field.type === 'textarea'
      ? t('enter_description')
      : t('enter_field_placeholder', { field: field.label });
    const commonProps = {
      label: field.label,
      required: field.required,
      disabled: saving,
      value: typeof value === 'object' ? '' : String(value),
      onChange: (e) => handleInputChange(field.key, e.target.value)
    };

    switch (field.type) {
      case 'textarea':
        return <Textarea {...commonProps} placeholder={placeholder} />;
      case 'number':
        return <Input {...commonProps} type="number" placeholder={placeholder} />;
      case 'boolean':
        return (
          <Select
            {...commonProps}
            onChange={(e) => {
              const value = e?.target?.value;
              handleInputChange(field.key, value === true || value === 'true');
            }}
            options={[
              { value: 'true', label: t('yes') },
              { value: 'false', label: t('no') }
            ]}
          />
        );
      default:
        return <Input {...commonProps} placeholder={placeholder} />;
    }
  }, [formData, saving, handleInputChange, t]);

  // Build grid columns
  const gridColumns = useMemo(() => {
    const columns = [
      {
        field: 'nameEn',
        headerName: t('name_english'),
        flex: 1,
        minWidth: 150
      },
      {
        field: 'nameAr',
        headerName: t('name_arabic'),
        flex: 1,
        minWidth: 150
      },
      {
        field: 'code',
        headerName: t('code'),
        flex: 0.5,
        minWidth: 100
      }
    ];

    // Add description if available
    if (config.fields.some(f => f.key === 'description' || f.key === 'descriptionEn')) {
      columns.push({
        field: 'descriptionEn',
        headerName: t('description_english'),
        flex: 1,
        minWidth: 180,
        renderCell: (params) => {
          const desc = params?.row?.descriptionEn || params?.row?.description;
          return desc || '—';
        }
      });

      columns.push({
        field: 'descriptionAr',
        headerName: t('description_arabic'),
        flex: 1,
        minWidth: 180,
        renderCell: (params) => {
          const desc = params?.row?.descriptionAr || params?.row?.description;
          return desc || '—';
        }
      });
    }

    if (config.fields.some(f => f.key === 'icon')) {
      columns.push({
        field: 'icon',
        headerName: t('icon') || 'Icon',
        width: 140,
        renderCell: (params) => params?.value || '—'
      });
    }

    if (config.fields.some(f => f.key === 'color')) {
      columns.push({
        field: 'color',
        headerName: t('color') || 'Color',
        width: 130,
        renderCell: (params) => params?.value || '—'
      });
    }

    if (config.fields.some(f => f.key === 'sortOrder' || f.key === 'sort')) {
      columns.push({
        field: 'sortOrder',
        headerName: t('sort') || 'Sort',
        width: 90,
        renderCell: (params) => {
          const row = params?.row || {};
          const value = row.sortOrder ?? row.sort ?? row.level;
          return value ?? '—';
        }
      });
    }

    if (config.fields.some(f => f.key === 'isPositive')) {
      columns.push({
        field: 'isPositive',
        headerName: t('is_positive') || 'Is Positive',
        width: 110,
        renderCell: (params) => {
          const value = params?.row?.isPositive;
          if (value === undefined || value === null) return '—';
          return value ? t('yes') : t('no');
        }
      });
    }

    columns.push(
      ...auditColumns,
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
                onClick={() => handleEdit(row)}
                disabled={saving}
              >
                {t('edit') || 'Edit'}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteEntity(lookupType, row, () => handleDelete(row))}
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
  }, [config, auditColumns, handleEdit, deleteEntity, saving, t]);

  // Loading state
  if (pageState === PAGE_STATES.LOADING) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
          Loading {t('loading_lookup_type', { type: localizedTitle })}...
        </div>
      </div>
    );
  }

  // Error state
  if (pageState === PAGE_STATES.ERROR) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1rem', color: '#ef4444' }}>
          {t('error_loading_lookup_type', { type: localizedTitle })}
        </div>
        <Button
          variant="outline"
          onClick={refetchLookup}
          style={{ marginTop: '1rem' }}
        >
          {t('retry') || 'Retry'}
        </Button>
      </div>
    );
  }

  // ── Guided Tour ──────────────────────────────────────────────────────────
  // (declared inside the render function because it is a returned JSX block, not a hook)
  // NOTE: hooks can't be called conditionally, so we place them before the early-return guards
  // This block is defined ABOVE the return statement
  // eslint-disable-next-line react-hooks/rules-of-hooks

  return (
    <LookupPageWithTour
      lookupType={lookupType}
      theme={theme}
      t={t}
      lang={lang}
      config={config}
      localizedTitle={localizedTitle}
      formState={formState}
      setFormState={setFormState}
      saving={saving}
      renderField={renderField}
      handleSubmit={handleSubmit}
      handleCancel={handleCancel}
      items={items}
      gridColumns={gridColumns}
      lookupLoading={lookupLoading}
      deleteModal={deleteModal}
      hideDeleteModal={hideDeleteModal}
      handleDeleteConfirm={handleDeleteConfirm}
    />
  );
};

// Inner component so hooks are called unconditionally
const LookupPageWithTour = ({
  lookupType, theme, t, lang, config, localizedTitle,
  formState, setFormState, saving, renderField, handleSubmit, handleCancel,
  items, gridColumns, lookupLoading, deleteModal, hideDeleteModal, handleDeleteConfirm
}) => {
  const [runTour, setRunTour] = React.useState(false);
  const tourSeenKey = `lookupTourSeen_${lookupType}_${lang}`;
  const tourSteps = React.useMemo(() => [
    { target: 'body', content: t('tour.lookup_search'), disableBeacon: true, placement: 'center' },
    { target: '[data-tour="lookup-add-btn"]', content: t('tour.lookup_add'), disableBeacon: true, placement: 'bottom' },
    { target: '[data-tour="lookup-grid"]', content: t('tour.lookup_grid'), disableBeacon: true, placement: 'top' },
    { target: '[data-tour="lookup-grid"]', content: t('tour.lookup_edit'), disableBeacon: true, placement: 'top' },
    { target: '[data-tour="lookup-grid"]', content: t('tour.lookup_delete'), disableBeacon: true, placement: 'top' },
    { target: '[data-tour="lookup-grid"]', content: t('tour.lookup_color'), disableBeacon: true, placement: 'top' },
  ], [lookupType, lang, t]);
  React.useEffect(() => {
    const start = () => setRunTour(true);
    window.addEventListener('app:joyride', start);
    window.addEventListener('app:help', start);
    return () => { window.removeEventListener('app:joyride', start); window.removeEventListener('app:help', start); };
  }, []);
  React.useEffect(() => { try { if (!localStorage.getItem(tourSeenKey)) setRunTour(true); } catch {} }, [tourSeenKey]);
  const handleTourCb = React.useCallback((data) => {
    const { status, action } = data || {};
    if (status === 'finished' || status === 'skipped' || action === 'close') { setRunTour(false); try { localStorage.setItem(tourSeenKey, 'true'); } catch {} }
  }, [tourSeenKey]);
  const TourTooltipComponent = useMemo(() => TourTooltip({ tourSeenKey }), [tourSeenKey]);

  return (
    <div style={{ padding: '1.5rem' }}>
      <Joyride continuous run={runTour} steps={tourSteps} callback={handleTourCb} scrollOffset={100} scrollToFirstStep showSkipButton showProgress tooltipComponent={TourTooltipComponent}
        locale={{ back: t('tour_back'), close: t('tour_close'), last: t('tour_finish'), next: t('tour_next'), skip: t('tour_skip') }}
        styles={{ options: { primaryColor: 'var(--color-primary,#800020)', textColor: theme === 'dark' ? '#e5e7eb' : '#111', backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', zIndex: 10000 } }}
      />
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '1.875rem', 
            fontWeight: '600', 
            color: theme === 'dark' ? '#f9fafb' : '#111827',
            margin: 0
          }}>
            {config.title}
          </h1>
          <p style={{ 
            color: theme === 'dark' ? '#9ca3af' : '#6b7280',
            margin: '0.5rem 0 0 0'
          }}>
            {t('lookup_manage_description', { type: localizedTitle })}
          </p>
        </div>
        <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
          
          <Button
            data-tour="lookup-add-btn"
            onClick={() => setFormState(FORM_STATES.CREATING)}
            disabled={saving}
          >
            {t('create')} {localizedTitle}
          </Button>
        </div>
      </div>

      {/* Form */}
      {(formState === FORM_STATES.CREATING || formState === FORM_STATES.EDITING) && (
        <div style={{
          backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
          border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
          borderRadius: '0.5rem',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <h2 style={{ 
            fontSize: '1.25rem', 
            fontWeight: '500', 
            color: theme === 'dark' ? '#f9fafb' : '#111827',
            marginTop: 0,
            marginBottom: '1rem'
          }}>
            {formState === FORM_STATES.CREATING ? `${t('create')} ${localizedTitle}` : `${t('edit')} ${localizedTitle}`}
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              {config.fields.map(field => (
                <div key={field.key}>
                  {renderField(field)}
                </div>
              ))}
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button
                type="submit"
                disabled={saving}
                loading={saving}
              >
                {saving ? t('saving') : (formState === FORM_STATES.CREATING ? t('create') : t('update'))}
              </Button>
              <Button
                variant="outline"
                type="button"
                onClick={handleCancel}
                disabled={saving}
              >
                {t('cancel') || 'Cancel'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Data Grid */}
      <div data-tour="lookup-grid" style={{
        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
        border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
        borderRadius: '0.5rem',
        overflow: 'hidden'
      }}>
        <AdvancedDataGrid
          rows={items}
          columns={gridColumns}
          loading={lookupLoading}
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

export default LookupManagementPage;
