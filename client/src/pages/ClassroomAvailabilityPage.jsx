import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { Button, SimpleLoading, useToast, Input, Select, DeleteModal } from '@ui';
import MultiSelect from '@components/ui/MultiSelect';
import { useDeleteModal } from '@hooks/useDeleteModal.js';
import AdvancedDataGrid from '@components/ui/AdvancedDataGrid';
import { 
  getAllClassroomAvailabilities, 
  createClassroomAvailability, 
  updateClassroomAvailability, 
  deleteClassroomAvailability 
} from '@services/business/classroomAvailabilityService.js';
import { getAllClassrooms } from '@services/business/classroomService.js';
import { formatDateTime } from '@utils/dateUtils.js';
import { getUserDisplayName as getAuthUserDisplayName } from '@services/business/authService';
import { exportToCSV } from '@utils/csvExport.js';

const ClassroomAvailabilityPage = () => {
  const { user, isAdmin, isHR, isSuperAdmin } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const toast = useToast();
  const { deleteModal, deleteEntity, handleDeleteConfirm, hideDeleteModal } = useDeleteModal(t);

  const [availabilities, setAvailabilities] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formState, setFormState] = useState('creating'); // creating, editing
  const [editingAvailability, setEditingAvailability] = useState(null);
  const [saving, setSaving] = useState(false);
  const [gridKey, setGridKey] = useState(0);

  const [formData, setFormData] = useState({
    classroomId: '',
    dayOfWeek: ['Sun'],
    slots: [{ startTime: '09:00', endTime: '10:00' }],
    startDate: '',
    endDate: '',
  });

  const dayOptions = [
    { value: 'Sun', label: 'Sunday' },
    { value: 'Mon', label: 'Monday' },
    { value: 'Tue', label: 'Tuesday' },
    { value: 'Wed', label: 'Wednesday' },
    { value: 'Thu', label: 'Thursday' },
    { value: 'Fri', label: 'Friday' },
    { value: 'Sat', label: 'Saturday' }
  ];

  const loadAvailabilities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAllClassroomAvailabilities();
      if (result.success) {
        setAvailabilities(result.data);
      } else {
        setError(result.error);
        toast.error(result.error || 'Failed to load classroom availabilities');
      }
    } catch (error) {
      setError(error.message);
      toast.error(error.message || 'Failed to load classroom availabilities');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadClassrooms = useCallback(async () => {
    try {
      const result = await getAllClassrooms();
      if (result.success) {
        setClassrooms(result.data);
      }
    } catch (error) {
      console.error('Failed to load classrooms:', error);
    }
  }, []);

  useEffect(() => {
    loadAvailabilities();
    loadClassrooms();
  }, [loadAvailabilities, loadClassrooms]);

  const handleNewAvailability = () => {
    setEditingAvailability(null);
    setFormData({
      classroomId: '',
      dayOfWeek: ['Sun'],
      slots: [{ startTime: '09:00', endTime: '10:00' }],
      startDate: '',
      endDate: '',
    });
    setFormState('creating');
  };

  const handleEditAvailability = (availability) => {
    setEditingAvailability(availability);
    setFormData({
      classroomId: availability.classroomId?.toString() || '',
      dayOfWeek: availability.dayOfWeek || ['Sun'],
      slots: availability.slots && availability.slots.length > 0 
        ? availability.slots.map(s => ({ startTime: s.startTime, endTime: s.endTime }))
        : [{ startTime: '09:00', endTime: '10:00' }],
      startDate: availability.startDate ? new Date(availability.startDate).toISOString().split('T')[0] : '',
      endDate: availability.endDate ? new Date(availability.endDate).toISOString().split('T')[0] : '',
    });
    setFormState('editing');
  };

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleAddSlot = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      slots: [...prev.slots, { startTime: '09:00', endTime: '10:00' }]
    }));
  }, []);

  const handleRemoveSlot = useCallback((index) => {
    setFormData(prev => ({
      ...prev,
      slots: prev.slots.filter((_, i) => i !== index)
    }));
  }, []);

  const handleSlotChange = useCallback((index, field, value) => {
    setFormData(prev => ({
      ...prev,
      slots: prev.slots.map((slot, i) => 
        i === index ? { ...slot, [field]: value } : slot
      )
    }));
  }, []);

  const handleSaveAvailability = async (e) => {
    e?.preventDefault();
    try {
      setSaving(true);

      // Validation
      if (!formData.classroomId || formData.classroomId.trim() === '') {
        toast.error('Classroom is required');
        return;
      }
      if (!formData.dayOfWeek || formData.dayOfWeek.length === 0) {
        toast.error('Day of week is required');
        return;
      }
      if (!formData.slots || formData.slots.length === 0) {
        toast.error('At least one time slot is required');
        return;
      }
      if (!formData.startDate || !formData.endDate) {
        toast.error('Start date and end date are required');
        return;
      }
      if (new Date(formData.startDate) > new Date(formData.endDate)) {
        toast.error('Start date must be before or equal to end date');
        return;
      }

      // Validate each slot
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      for (let i = 0; i < formData.slots.length; i++) {
        const slot = formData.slots[i];
        if (!slot.startTime || !slot.endTime) {
          toast.error(`Slot ${i + 1}: Start time and end time are required`);
          return;
        }
        if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
          toast.error(`Slot ${i + 1}: Time must be in HH:mm format (e.g., 09:00)`);
          return;
        }
        const startMinutes = parseInt(slot.startTime.split(':')[0]) * 60 + parseInt(slot.startTime.split(':')[1]);
        const endMinutes = parseInt(slot.endTime.split(':')[0]) * 60 + parseInt(slot.endTime.split(':')[1]);
        if (endMinutes <= startMinutes) {
          toast.error(`Slot ${i + 1}: End time must be after start time`);
          return;
        }
      }

      const payload = {
        classroomId: parseInt(formData.classroomId),
        dayOfWeek: formData.dayOfWeek || [],
        slots: formData.slots,
        startDate: formData.startDate ? new Date(formData.startDate) : null,
        endDate: formData.endDate ? new Date(formData.endDate) : null,
      };

      console.log('[ClassroomAvailabilityListPage] Saving availability with payload:', payload);

      let result;
      if (editingAvailability) {
        result = await updateClassroomAvailability(editingAvailability.id, payload, user);
      } else {
        result = await createClassroomAvailability(payload, user);
      }

      console.log('[ClassroomAvailabilityListPage] Save result:', result);

      if (result.success) {
        toast.success(editingAvailability ? 'Availability updated' : 'Availability created');
        resetForm();
        setGridKey(prev => prev + 1);
        loadAvailabilities();
      } else {
        toast.error(result.error || 'Failed to save availability');
      }
    } catch (error) {
      console.error('[ClassroomAvailabilityListPage] Save error:', error);
      toast.error(error.message || 'Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = useCallback(() => {
    setFormData({
      classroomId: '',
      dayOfWeek: ['Sun'],
      slots: [{ startTime: '09:00', endTime: '10:00' }],
      startDate: '',
      endDate: '',
    });
    setEditingAvailability(null);
    setFormState('creating');
  }, []);

  const handleCancel = useCallback(() => {
    resetForm();
  }, [resetForm]);

  const formatDate = useCallback((dateValue) => {
    return formatDateTime(dateValue, lang);
  }, [lang]);

  const handleDeleteAvailability = async (availability) => {
    try {
      setSaving(true);
      const result = await deleteClassroomAvailability(availability.id, user);

      console.log('[ClassroomAvailabilityListPage] Delete result:', result);

      if (result.success) {
        toast.success('Availability deleted');
        setGridKey(prev => prev + 1);
        loadAvailabilities();
      } else {
        toast.error(result.error || 'Failed to delete availability');
      }
    } catch (error) {
      console.error('[ClassroomAvailabilityListPage] Delete error:', error);
      toast.error(error.message || 'Failed to delete availability');
    } finally {
      setSaving(false);
    }
  };

  // Build grid columns
  const gridColumns = useMemo(() => {
    const columns = [
      {
        field: 'classroom',
        headerName: 'Classroom',
        flex: 1,
        minWidth: 150,
        renderCell: (params) => {
          const classroom = params?.row?.classroom;
          if (!classroom) return '—';
          return `${classroom.code} - ${classroom.nameEn}`;
        }
      },
      {
        field: 'dayOfWeek',
        headerName: 'Day(s)',
        width: 150,
        renderCell: (params) => {
          const days = params?.value;
          if (!days || !Array.isArray(days) || days.length === 0) return '—';
          return days.join(', ');
        }
      },
      {
        field: 'slots',
        headerName: 'Time Slots',
        width: 200,
        renderCell: (params) => {
          const slots = params?.value;
          if (!slots || !Array.isArray(slots) || slots.length === 0) return '—';
          return slots.map(s => `${s.startTime}-${s.endTime}`).join(', ');
        }
      },
      {
        field: 'daysCount',
        headerName: 'Days Count',
        width: 100,
        renderCell: (params) => {
          const row = params?.row;
          if (!row.startDate || !row.endDate) return '—';
          
          const start = new Date(row.startDate);
          const end = new Date(row.endDate);
          const daysOfWeek = row.dayOfWeek || [];
          
          if (daysOfWeek.length === 0) return '—';
          
          // Count days in range that match selected days of week
          let count = 0;
          const current = new Date(start);
          const dayMap = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' };
          
          while (current <= end) {
            const dayName = dayMap[current.getDay()];
            if (daysOfWeek.includes(dayName)) {
              count++;
            }
            current.setDate(current.getDate() + 1);
          }
          
          return count;
        }
      },
      {
        field: 'startDate',
        headerName: 'Start Date',
        width: 120,
        renderCell: (params) => {
          const value = params?.value;
          return value ? formatDate(value) : '—';
        }
      },
      {
        field: 'endDate',
        headerName: 'End Date',
        width: 120,
        renderCell: (params) => {
          const value = params?.value;
          return value ? formatDate(value) : '—';
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
                onClick={() => handleEditAvailability(row)}
                disabled={saving}
              >
                {t('edit') || 'Edit'}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteEntity('availability', `${row.classroom?.code} - ${row.dayOfWeek}`, () => handleDeleteAvailability(row))}
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
  }, [formatDate, handleEditAvailability, deleteEntity, saving, t]);

  const handleExport = useCallback(() => {
    const result = exportToCSV(availabilities, gridColumns, 'classroom-availability.csv');
    if (result.success) {
      toast.success('Classroom availability exported successfully');
    } else {
      toast.error(result.error || 'Failed to export classroom availability');
    }
  }, [availabilities, gridColumns, toast]);

  const hasPermission = isAdmin || isHR || isSuperAdmin;

  if (!hasPermission) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.125rem', fontWeight: '500', color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}>
          Access Denied
        </div>
        <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginTop: '0.5rem' }}>
          You need admin or HR privileges to manage classroom availability.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      {/* Form - Always visible */}
      <form onSubmit={handleSaveAvailability} style={{ marginBottom: '2rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Classroom *</label>
            <Select
              value={formData.classroomId}
              onChange={(e) => handleInputChange('classroomId', e.target.value)}
              options={classrooms.map(c => ({ value: c.id.toString(), label: `${c.code} - ${c.nameEn}` }))}
              disabled={saving}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Day(s) of Week</label>
            <MultiSelect
              value={formData.dayOfWeek}
              onChange={(value) => handleInputChange('dayOfWeek', value)}
              options={dayOptions}
              placeholder="Select days..."
              disabled={saving}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontWeight: '500' }}>Time Slots *</label>
              <Button
                type="button"
                onClick={handleAddSlot}
                disabled={saving}
                style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
              >
                + Add Slot
              </Button>
            </div>
            {formData.slots.map((slot, index) => (
              <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <Input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => handleSlotChange(index, 'startTime', e.target.value)}
                    disabled={saving}
                    placeholder="Start Time"
                  />
                </div>
                <span style={{ padding: '0 0.5rem' }}>—</span>
                <div style={{ flex: 1 }}>
                  <Input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => handleSlotChange(index, 'endTime', e.target.value)}
                    disabled={saving}
                    placeholder="End Time"
                  />
                </div>
                {formData.slots.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => handleRemoveSlot(index)}
                    disabled={saving}
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem', backgroundColor: '#ef4444' }}
                  >
                    ×
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Start Date *</label>
            <Input
              type="date"
              value={formData.startDate}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              disabled={saving}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>End Date *</label>
            <Input
              type="date"
              value={formData.endDate}
              onChange={(e) => handleInputChange('endDate', e.target.value)}
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
          Classroom Availability ({availabilities.length})
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={availabilities.length === 0}
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
          rows={availabilities}
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

export default ClassroomAvailabilityPage;
