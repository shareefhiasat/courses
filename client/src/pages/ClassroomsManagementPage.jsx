import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { Button, SimpleLoading, useToast, Input, Select, DeleteModal } from '@ui';
import { useDeleteModal } from '@hooks/useDeleteModal.js';
import AdvancedDataGrid from '@components/ui/AdvancedDataGrid';
import { getAllClassrooms, createClassroom, updateClassroom, deleteClassroom } from '@services/business/classroomService.js';
import { useAuditGridColumns } from '@hooks/useAuditGridColumns.js';
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

  // Filter state
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterBuilding, setFilterBuilding] = useState('');
  const [filterCapacity, setFilterCapacity] = useState('');
  const [filterRoomNumber, setFilterRoomNumber] = useState('');

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
      const params = {};
      if (filterSearch) params.search = filterSearch;
      if (filterStatus) params.status = filterStatus;
      if (filterBuilding) params.building = filterBuilding;
      if (filterCapacity) params.capacity = filterCapacity;
      if (filterRoomNumber) params.roomNumber = filterRoomNumber;
      
      const result = await getAllClassrooms(params);
      if (result.success) {
        setClassrooms(result.data);
      } else {
        setError(result.error);
        toast.error(result.error || t('failed_to_load_classrooms'));
      }
    } catch (error) {
      setError(error.message);
      toast.error(error.message || t('failed_to_load_classrooms'));
    } finally {
      setLoading(false);
    }
  }, [toast, t, filterSearch, filterStatus, filterBuilding, filterCapacity, filterRoomNumber]);
  
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
        toast.error(t('classroom_code_required'));
        return;
      }
      if (!formData.name || formData.name.trim() === '') {
        toast.error(t('classroom_name_en_required'));
        return;
      }
      const capacity = parseInt(formData.capacity);
      if (isNaN(capacity) || capacity <= 0) {
        toast.error(t('capacity_positive_required'));
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
        toast.success(editingClassroom ? t('classroom_updated') : t('classroom_created'));
        resetForm();
        setGridKey(prev => prev + 1);
        loadClassrooms();
      } else {
        toast.error(result.error || t('failed_to_save_classroom'));
      }
    } catch (error) {
      console.error('[ClassroomsManagementPage] Save error:', error);
      toast.error(error.message || t('failed_to_save_classroom'));
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

  const auditColumns = useAuditGridColumns();

  const handleDeleteClassroom = async (classroom) => {
    try {
      setSaving(true);
      const result = await deleteClassroom(classroom.id, user);

      console.log('[ClassroomsManagementPage] Delete result:', result);

      if (result.success) {
        toast.success(t('classroom_deleted'));
        setGridKey(prev => prev + 1);
        loadClassrooms();
      } else {
        toast.error(result.error || t('failed_to_delete_classroom'));
      }
    } catch (error) {
      console.error('[ClassroomsManagementPage] Delete error:', error);
      toast.error(error.message || t('failed_to_delete_classroom'));
    } finally {
      setSaving(false);
    }
  };

  // Build grid columns
  const gridColumns = useMemo(() => {
    const columns = [
      {
        field: 'code',
        headerName: t('code'),
        flex: 0.5,
        minWidth: 100
      },
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
        field: 'capacity',
        headerName: t('capacity') || 'Capacity',
        width: 100,
        renderCell: (params) => params?.value || '—'
      },
      {
        field: 'locationEn',
        headerName: t('building') || 'Building',
        flex: 1,
        minWidth: 120,
        renderCell: (params) => params?.value || '—'
      },
      {
        field: 'floor',
        headerName: t('floor') || 'Floor',
        width: 100,
        renderCell: (params) => params?.value || '—'
      },
      {
        field: 'roomNumber',
        headerName: t('room_number') || 'Room Number',
        width: 120,
        renderCell: (params) => params?.value || '—'
      },
      {
        field: 'status',
        headerName: t('status') || 'Status',
        width: 100,
        renderCell: (params) => {
          const status = params?.value;
          if (!status) return '—';
          const statusMap = {
            Available: t('available'),
            UnderMaintenance: t('under_maintenance'),
            Closed: t('closed'),
          };
          return statusMap[status] || status;
        }
      }
    ];

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
  }, [auditColumns, handleEditClassroom, deleteEntity, saving, t]);

  // Derived filtered rows - backend handles filtering
  const filteredClassrooms = classrooms;

  const handleExport = useCallback(() => {
    const result = exportToCSV(filteredClassrooms, gridColumns, 'classrooms.csv');
    if (result.success) {
      toast.success(t('classrooms_exported'));
    } else {
      toast.error(result.error || t('failed_to_export_classrooms'));
    }
  }, [filteredClassrooms, gridColumns, toast, t]);

  const hasPermission = isAdmin || isHR || isSuperAdmin;
  
  if (!hasPermission) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: '500', color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}>
          {t('access_denied')}
        </div>
        <div style={{ fontSize: 'var(--font-size-sm)', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginTop: '0.5rem' }}>
          {t('admin_hr_required_classrooms')}
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
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>{t('code')} *</label>
              <Input
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                placeholder={t('classroom_code_placeholder')}
                disabled={saving}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>{t('name_english')}</label>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder={t('classroom_name_placeholder')}
                disabled={saving}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>{t('name_arabic')}</label>
              <Input
                value={formData.nameAr}
                onChange={(e) => handleInputChange('nameAr', e.target.value)}
                placeholder={t('classroom_name_ar_placeholder')}
                disabled={saving}
              />
            </div>


            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>{t('capacity')}</label>
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
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>{t('building')}</label>
              <Input
                value={formData.building}
                onChange={(e) => handleInputChange('building', e.target.value)}
                placeholder={t('building_placeholder')}
                disabled={saving}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>{t('floor')}</label>
              <Input
                value={formData.floor}
                onChange={(e) => handleInputChange('floor', e.target.value)}
                placeholder={t('floor_placeholder')}
                disabled={saving}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>{t('room_number')}</label>
              <Input
                value={formData.roomNumber}
                onChange={(e) => handleInputChange('roomNumber', e.target.value)}
                placeholder={t('room_number_placeholder')}
                disabled={saving}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>{t('status')}</label>
              <Select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                options={[
                  { value: 'Available', label: t('available') },
                  { value: 'UnderMaintenance', label: t('under_maintenance') },
                  { value: 'Closed', label: t('closed') }
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
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            options={[
              { value: '', label: t('all_statuses') || 'All Statuses' },
              { value: 'Available', label: t('available') || 'Available' },
              { value: 'UnderMaintenance', label: t('under_maintenance') || 'Under Maintenance' },
              { value: 'Closed', label: t('closed') || 'Closed' }
            ]}
            placeholder={t('status') || 'Status'}
          />
        </div>
        <div style={{ flex: '1 1 140px' }}>
          <Input
            value={filterBuilding}
            onChange={e => setFilterBuilding(e.target.value)}
            placeholder={t('building') || 'Building'}
          />
        </div>
        <div style={{ flex: '1 1 100px' }}>
          <Input
            type="number"
            value={filterCapacity}
            onChange={e => setFilterCapacity(e.target.value)}
            placeholder={t('capacity') || 'Capacity'}
          />
        </div>
        <div style={{ flex: '1 1 120px' }}>
          <Input
            value={filterRoomNumber}
            onChange={e => setFilterRoomNumber(e.target.value)}
            placeholder={t('room_number') || 'Room Number'}
          />
        </div>
        {(filterSearch || filterStatus || filterBuilding || filterCapacity || filterRoomNumber) && (
          <button
            onClick={() => { setFilterSearch(''); setFilterStatus(''); setFilterBuilding(''); setFilterCapacity(''); setFilterRoomNumber(''); }}
            style={{
              border: `1px solid ${theme === 'dark' ? '#374151' : '#d1d5db'}`,
              backgroundColor: 'transparent', cursor: 'pointer',
              color: theme === 'dark' ? '#9ca3af' : '#6b7280'
            }}
          >✕ {t('clear')}</button>
        )}
      </div>

      {/* Grid Header with Export */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)', fontWeight: '500' }}>
          {t('classrooms_title', { count: `${filteredClassrooms.length}${filteredClassrooms.length !== classrooms.length ? ` / ${classrooms.length}` : ''}` })}
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={filteredClassrooms.length === 0}
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
          rows={filteredClassrooms}
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
