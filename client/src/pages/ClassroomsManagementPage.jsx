import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { Button, SimpleLoading, useToast, Input, Select, DeleteModal } from '@ui';
import { useDeleteModal } from '@hooks/useDeleteModal.js';
import AdvancedDataGrid from '@components/ui/AdvancedDataGrid';
import { getAllClassrooms, createClassroom, updateClassroom, deleteClassroom } from '@services/business/classroomService.js';
import { formatDateTime } from '@utils/dateUtils.js';
import { getUserDisplayName as getAuthUserDisplayName } from '@services/business/authService';
import { exportToCSV } from '@utils/csvExport.js';

const ClassroomsManagementPage = () => {
  const { user, isAdmin, isHR, isSuperAdmin } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const toast = useToast();
  const { deleteModal, deleteEntity, handleDeleteConfirm, hideDeleteModal } = useDeleteModal(t);

  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formState, setFormState] = useState('creating'); // creating, editing
  const [editingClassroom, setEditingClassroom] = useState(null);
  const [saving, setSaving] = useState(false);
  const [gridKey, setGridKey] = useState(0);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    nameAr: '',
    capacity: 30,
    building: '',
    floor: '',
    roomNumber: '',
    status: 'Available',
  });
  
  const loadClassrooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAllClassrooms();
      if (result.success) {
        setClassrooms(result.data);
      } else {
        setError(result.error);
        toast.error(result.error || 'Failed to load classrooms');
      }
    } catch (error) {
      setError(error.message);
      toast.error(error.message || 'Failed to load classrooms');
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    loadClassrooms();
  }, [loadClassrooms]);
  
  const handleNewClassroom = () => {
    setEditingClassroom(null);
    setFormData({
      code: '',
      name: '',
      nameAr: '',
      capacity: 30,
      building: '',
      floor: '',
      roomNumber: '',
      status: 'Available',
    });
    setFormState('creating');
  };
  
  const handleEditClassroom = (classroom) => {
    setEditingClassroom(classroom);
    setFormData({
      code: classroom.code || '',
      name: classroom.nameEn || '',
      nameAr: classroom.nameAr || '',
      capacity: classroom.capacity || 30,
      building: classroom.locationEn || '',
      floor: classroom.floor || '',
      roomNumber: classroom.roomNumber || '',
      status: classroom.status || 'Available',
    });
    setFormState('editing');
  };
  
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);
  
  const handleSaveClassroom = async (e) => {
    e?.preventDefault();
    try {
      setSaving(true);

      // Validation
      if (!formData.code || formData.code.trim() === '') {
        toast.error('Code is required');
        return;
      }
      if (!formData.name || formData.name.trim() === '') {
        toast.error('Name (English) is required');
        return;
      }
      const capacity = parseInt(formData.capacity);
      if (isNaN(capacity) || capacity <= 0) {
        toast.error('Capacity must be a positive number');
        return;
      }

      const payload = {
        code: formData.code.trim(),
        nameEn: formData.name.trim(),
        nameAr: formData.nameAr?.trim() || null,
        capacity: capacity,
        locationEn: formData.building?.trim() || null,
        floor: formData.floor?.trim() || null,
        roomNumber: formData.roomNumber?.trim() || null,
        status: formData.status,
        createdBy: user.dbId,
      };

      console.log('[ClassroomsManagementPage] Saving classroom with payload:', payload);
      console.log('[ClassroomsManagementPage] User dbId:', user.dbId);

      let result;
      if (editingClassroom) {
        payload.updatedBy = user.dbId;
        result = await updateClassroom(editingClassroom.id, payload, user);
      } else {
        result = await createClassroom(payload, user);
      }

      console.log('[ClassroomsManagementPage] Save result:', result);

      if (result.success) {
        toast.success(editingClassroom ? 'Classroom updated' : 'Classroom created');
        resetForm();
        setGridKey(prev => prev + 1);
        loadClassrooms();
      } else {
        toast.error(result.error || 'Failed to save classroom');
      }
    } catch (error) {
      console.error('[ClassroomsManagementPage] Save error:', error);
      toast.error(error.message || 'Failed to save classroom');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = useCallback(() => {
    setFormData({
      code: '',
      name: '',
      nameAr: '',
      capacity: 30,
      building: '',
      floor: '',
      roomNumber: '',
      status: 'Available',
    });
    setEditingClassroom(null);
    setFormState('creating');
  }, []);

  const handleCancel = useCallback(() => {
    resetForm();
  }, [resetForm]);

  const formatDate = useCallback((dateValue) => {
    return formatDateTime(dateValue, lang);
  }, [lang]);

  const handleDeleteClassroom = async (classroom) => {
    try {
      setSaving(true);
      const result = await deleteClassroom(classroom.id, user);

      console.log('[ClassroomsManagementPage] Delete result:', result);

      if (result.success) {
        toast.success('Classroom deleted');
        setGridKey(prev => prev + 1);
        loadClassrooms();
      } else {
        toast.error(result.error || 'Failed to delete classroom');
      }
    } catch (error) {
      console.error('[ClassroomsManagementPage] Delete error:', error);
      toast.error(error.message || 'Failed to delete classroom');
    } finally {
      setSaving(false);
    }
  };

  // Build grid columns
  const gridColumns = useMemo(() => {
    const columns = [
      {
        field: 'code',
        headerName: 'Code',
        flex: 0.5,
        minWidth: 100
      },
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
        field: 'capacity',
        headerName: 'Capacity',
        width: 100,
        renderCell: (params) => params?.value || '—'
      },
      {
        field: 'locationEn',
        headerName: 'Building',
        flex: 1,
        minWidth: 120,
        renderCell: (params) => params?.value || '—'
      },
      {
        field: 'floor',
        headerName: 'Floor',
        width: 100,
        renderCell: (params) => params?.value || '—'
      },
      {
        field: 'roomNumber',
        headerName: 'Room Number',
        width: 120,
        renderCell: (params) => params?.value || '—'
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 100,
        renderCell: (params) => {
          const status = params?.value;
          if (!status) return '—';
          const statusMap = {
            'Available': t('available') || 'Available',
            'UnderMaintenance': t('underMaintenance') || 'Under Maintenance',
            'Closed': t('closed') || 'Closed'
          };
          const displayValue = statusMap[status];
          // Ensure proper spacing if translation returns the key without space
          if (displayValue === 'UnderMaintenance') {
            return 'Under Maintenance';
          }
          return displayValue || status;
        }
      }
    ];

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
          return getAuthUserDisplayName(creator);
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
          return getAuthUserDisplayName(updater);
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
                onClick={() => handleEditClassroom(row)}
                disabled={saving}
              >
                {t('edit') || 'Edit'}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteEntity('classroom', row, () => handleDeleteClassroom(row))}
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
  }, [formatDate, handleEditClassroom, deleteEntity, saving, t]);

  const handleExport = useCallback(() => {
    const result = exportToCSV(classrooms, gridColumns, 'classrooms.csv');
    if (result.success) {
      toast.success('Classrooms exported successfully');
    } else {
      toast.error(result.error || 'Failed to export classrooms');
    }
  }, [classrooms, gridColumns, toast]);

  const hasPermission = isAdmin || isHR || isSuperAdmin;
  
  if (!hasPermission) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.125rem', fontWeight: '500', color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}>
          Access Denied
        </div>
        <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginTop: '0.5rem' }}>
          You need admin or HR privileges to manage classrooms.
        </div>
      </div>
    );
  }
  
  return (
    <div style={{ padding: '1.5rem' }}>
      {/* Form - Always visible */}
      <form onSubmit={handleSaveClassroom} style={{ marginBottom: '2rem' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Code *</label>
              <Input
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                placeholder="Enter classroom code (e.g., R101)"
                disabled={saving}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Name (English)</label>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter classroom name"
                disabled={saving}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Name (Arabic)</label>
              <Input
                value={formData.nameAr}
                onChange={(e) => handleInputChange('nameAr', e.target.value)}
                placeholder="Enter classroom name in Arabic"
                disabled={saving}
              />
            </div>


            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Capacity</label>
              <Input
                type="number"
                value={formData.capacity}
                onChange={(e) => handleInputChange('capacity', e.target.value)}
                min="1"
                max="100"
                disabled={saving}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Building</label>
              <Input
                value={formData.building}
                onChange={(e) => handleInputChange('building', e.target.value)}
                placeholder="Building name or number"
                disabled={saving}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Floor</label>
              <Input
                value={formData.floor}
                onChange={(e) => handleInputChange('floor', e.target.value)}
                placeholder="Floor number"
                disabled={saving}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Room Number</label>
              <Input
                value={formData.roomNumber}
                onChange={(e) => handleInputChange('roomNumber', e.target.value)}
                placeholder="Room number"
                disabled={saving}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Status</label>
              <Select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                options={[
                  { value: 'Available', label: 'Available' },
                  { value: 'UnderMaintenance', label: 'Under Maintenance' },
                  { value: 'Closed', label: 'Closed' }
                ]}
                disabled={saving}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button
              type="submit"
              disabled={saving}
              loading={saving}
            >
              {saving ? 'Saving...' : (formState === 'creating' ? 'Create' : 'Update')}
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

      {/* Grid Header with Export */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '500' }}>
          Classrooms ({classrooms.length})
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={classrooms.length === 0}
        >
          {t('export') || 'Export'}
        </Button>
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
          rows={classrooms}
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

export default ClassroomsManagementPage;
