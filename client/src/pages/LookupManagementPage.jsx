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
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@components/ui/ToastProvider';
import { useLookupTypes } from '@hooks/useLookupTypes.js';
import { getDatabaseUserId } from '@services/business/authService';
import { getUserDisplayName as getAuthUserDisplayName } from '@services/business/authService';
import { formatDateTime } from '@utils/dateUtils.js';
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

const LookupManagementPage = ({ lookupType }) => {
  const { user, isInstructor, isAdmin, isSuperAdmin } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const toast = useToast();
  
  // Get configuration for this lookup type
  const config = LOOKUP_CONFIGS[lookupType];
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

  // Format date with time
  const formatDate = useCallback((dateValue) => {
    return formatDateTime(dateValue, lang);
  }, [lang]);

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
    const commonProps = {
      label: field.label,
      required: field.required,
      disabled: saving,
      value: typeof value === 'object' ? '' : String(value),
      onChange: (e) => handleInputChange(field.key, e.target.value)
    };

    switch (field.type) {
      case 'textarea':
        return <Textarea {...commonProps} placeholder={`Enter ${field.label.toLowerCase()}...`} />;
      case 'number':
        return <Input {...commonProps} type="number" placeholder={`Enter ${field.label.toLowerCase()}...`} />;
      case 'boolean':
        return (
          <Select
            {...commonProps}
            onChange={(e) => {
              const value = e?.target?.value;
              handleInputChange(field.key, value === true || value === 'true');
            }}
            options={[
              { value: 'true', label: 'Yes' },
              { value: 'false', label: 'No' }
            ]}
          />
        );
      default:
        return <Input {...commonProps} placeholder={`Enter ${field.label.toLowerCase()}...`} />;
    }
  }, [formData, saving, handleInputChange]);

  // Build grid columns
  const gridColumns = useMemo(() => {
    const columns = [
      {
        field: 'nameEn',
        headerName: 'Name (English)',
        flex: 1,
        minWidth: 150
      },
      {
        field: 'nameAr',
        headerName: 'Name (Arabic)',
        flex: 1,
        minWidth: 150
      },
      {
        field: 'code',
        headerName: 'Code',
        flex: 0.5,
        minWidth: 100
      }
    ];

    // Add description if available
    if (config.fields.some(f => f.key === 'description' || f.key === 'descriptionEn')) {
      columns.push({
        field: 'descriptionEn',
        headerName: 'Description (EN)',
        flex: 1,
        minWidth: 180,
        renderCell: (params) => {
          const desc = params?.row?.descriptionEn || params?.row?.description;
          return desc || '—';
        }
      });

      columns.push({
        field: 'descriptionAr',
        headerName: 'Description (AR)',
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
        headerName: 'Icon',
        width: 140,
        renderCell: (params) => params?.value || '—'
      });
    }

    if (config.fields.some(f => f.key === 'color')) {
      columns.push({
        field: 'color',
        headerName: 'Color',
        width: 130,
        renderCell: (params) => params?.value || '—'
      });
    }

    if (config.fields.some(f => f.key === 'sortOrder' || f.key === 'sort')) {
      columns.push({
        field: 'sortOrder',
        headerName: 'Sort',
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
        headerName: 'Is Positive',
        width: 110,
        renderCell: (params) => {
          const value = params?.row?.isPositive;
          if (value === undefined || value === null) return '—';
          return value ? 'Yes' : 'No';
        }
      });
    }

    // Add audit columns
    columns.push(
      {
        field: 'creator',
        headerName: 'Created By',
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
        headerName: 'Created At',
        flex: 0.8,
        minWidth: 120,
        renderCell: (params) => {
          const value = params?.value;
          return formatDate(value);
        }
      },
      {
        field: 'updater',
        headerName: 'Updated By',
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
        headerName: 'Updated At',
        flex: 0.8,
        minWidth: 120,
        renderCell: (params) => {
          const value = params?.value;
          return formatDate(value);
        }
      },
      {
        field: 'actions',
        headerName: 'Actions',
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
  }, [config, formatDate, handleEdit, deleteEntity, saving, t]);

  // Loading state
  if (pageState === PAGE_STATES.LOADING) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
          Loading {config.title.toLowerCase()}...
        </div>
      </div>
    );
  }

  // Error state
  if (pageState === PAGE_STATES.ERROR) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1rem', color: '#ef4444' }}>
          Error loading {config.title.toLowerCase()}
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

  return (
    <div style={{ padding: '1.5rem' }}>
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
            Manage {config.title.toLowerCase()} for the LMS system
          </p>
        </div>
        <Button
          onClick={() => setFormState(FORM_STATES.CREATING)}
          disabled={saving}
        >
          {t('create') || 'Create'} {config.title.slice(0, -1)}
        </Button>
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
            {formState === FORM_STATES.CREATING ? `Create ${config.title.slice(0, -1)}` : `Edit ${config.title.slice(0, -1)}`}
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
                {saving ? 'Saving...' : (formState === FORM_STATES.CREATING ? 'Create' : 'Update')}
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
      <div style={{
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
