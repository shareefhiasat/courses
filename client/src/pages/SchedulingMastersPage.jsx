import React, { useState, useCallback, useMemo } from 'react';
import { info, error, warn, debug } from '@logger';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { Button, SimpleLoading, useToast, AdvancedDataGrid, Card, CardBody, Input } from '@ui';
import { DeleteModal, useDeleteModal } from '@ui';
import { useSchedulingMasters } from '@hooks/useSchedulingMasters.js';

const SchedulingMastersPage = () => {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const { t, lang, isRTL } = useLang();
  const { theme } = useTheme();
  const toast = useToast();
  
  const [activeTab, setActiveTab] = useState('classrooms');
  const { deleteModal, deleteEntity, handleDeleteConfirm, hideDeleteModal } = useDeleteModal(t);
  
  // Use scheduling masters hook
  const {
    // Classrooms
    classrooms,
    classroomsLoading,
    classroomsError,
    createClassroom,
    updateClassroom,
    deleteClassroom,
    loadClassrooms,
    
    // Time slots
    timeSlots,
    timeSlotsLoading,
    timeSlotsError,
    createTimeSlot,
    updateTimeSlot,
    deleteTimeSlot,
    loadTimeSlots,
    bulkInitTimeSlots,
    
    // Holidays
    holidays,
    holidaysLoading,
    holidaysError,
    createHoliday,
    updateHoliday,
    deleteHoliday,
    loadHolidays,
    
    // Teacher availability
    teacherAvailabilities,
    teacherAvailabilitiesLoading,
    teacherAvailabilitiesError,
    createTeacherAvailability,
    updateTeacherAvailability,
    deleteTeacherAvailability,
    loadTeacherAvailabilities
  } = useSchedulingMasters();
  
  // Form states
  const [classroomForm, setClassroomForm] = useState({
    code: '',
    nameEn: '',
    nameAr: '',
    locationEn: '',
    locationAr: '',
    capacity: '',
    status: 'Available',
    isActive: true
  });
  
  const [timeSlotForm, setTimeSlotForm] = useState({
    labelEn: '',
    labelAr: '',
    startTime: '',
    endTime: '',
    durationMinutes: '',
    sortOrder: '',
    isBreak: false,
    isActive: true
  });
  
  const [holidayForm, setHolidayForm] = useState({
    descriptionEn: '',
    descriptionAr: '',
    type: 'Public',
    startDate: '',
    endDate: '',
    isRecurring: false,
    isActive: true
  });
  
  const [teacherAvailabilityForm, setTeacherAvailabilityForm] = useState({
    userId: '',
    availableDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
    maxSessionsPerDay: 3,
    status: 'Active',
    isActive: true
  });
  
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Check permissions
  const hasPermission = isAdmin || isSuperAdmin;
  
  if (!hasPermission) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.125rem', fontWeight: '500', color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}>
          {t('access_denied') || 'Access Denied'}
        </div>
        <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginTop: '0.5rem' }}>
          {t('scheduling_permission_required') || 'You need admin privileges to manage scheduling masters.'}
        </div>
      </div>
    );
  }
  
  // Tab configuration
  const tabs = [
    { id: 'classrooms', label: t('classrooms') || 'Classrooms', icon: '🏫' },
    { id: 'timeSlots', label: t('time_slots') || 'Time Slots', icon: '🕐' },
    { id: 'holidays', label: t('holidays') || 'Holidays', icon: '🎉' },
    { id: 'teacherAvailability', label: t('teacher_availability') || 'Teacher Availability', icon: '👨‍🏫' }
  ];
  
  // Classroom columns
  const classroomColumns = useMemo(() => [
    {
      field: 'code',
      headerName: t('code') || 'Code',
      flex: 1,
      minWidth: 120
    },
    {
      field: isRTL ? 'nameAr' : 'nameEn',
      headerName: t('name') || 'Name',
      flex: 1,
      minWidth: 150
    },
    {
      field: 'locationEn',
      headerName: t('location') || 'Location',
      flex: 1,
      minWidth: 120
    },
    {
      field: 'capacity',
      headerName: t('capacity') || 'Capacity',
      flex: 0.5,
      minWidth: 80
    },
    {
      field: 'status',
      headerName: t('status') || 'Status',
      flex: 0.5,
      minWidth: 100
    },
    {
      field: 'isActive',
      headerName: t('active') || 'Active',
      flex: 0.5,
      minWidth: 80,
      renderCell: (params) => params.value ? '✓' : '✗'
    }
  ], [t, isRTL]);
  
  // Time slot columns
  const timeSlotColumns = useMemo(() => [
    {
      field: 'sortOrder',
      headerName: t('order') || 'Order',
      flex: 0.5,
      minWidth: 60
    },
    {
      field: isRTL ? 'labelAr' : 'labelEn',
      headerName: t('label') || 'Label',
      flex: 1,
      minWidth: 150
    },
    {
      field: 'startTime',
      headerName: t('start_time') || 'Start Time',
      flex: 0.5,
      minWidth: 100
    },
    {
      field: 'endTime',
      headerName: t('end_time') || 'End Time',
      flex: 0.5,
      minWidth: 100
    },
    {
      field: 'durationMinutes',
      headerName: t('duration') || 'Duration (min)',
      flex: 0.5,
      minWidth: 100
    },
    {
      field: 'isBreak',
      headerName: t('break') || 'Break',
      flex: 0.5,
      minWidth: 80,
      renderCell: (params) => params.value ? '✓' : '✗'
    },
    {
      field: 'isActive',
      headerName: t('active') || 'Active',
      flex: 0.5,
      minWidth: 80,
      renderCell: (params) => params.value ? '✓' : '✗'
    }
  ], [t, isRTL]);
  
  // Holiday columns
  const holidayColumns = useMemo(() => [
    {
      field: isRTL ? 'descriptionAr' : 'descriptionEn',
      headerName: t('description') || 'Description',
      flex: 1,
      minWidth: 150
    },
    {
      field: 'type',
      headerName: t('type') || 'Type',
      flex: 0.5,
      minWidth: 100
    },
    {
      field: 'startDate',
      headerName: t('start_date') || 'Start Date',
      flex: 0.5,
      minWidth: 120
    },
    {
      field: 'endDate',
      headerName: t('end_date') || 'End Date',
      flex: 0.5,
      minWidth: 120
    },
    {
      field: 'isRecurring',
      headerName: t('recurring') || 'Recurring',
      flex: 0.5,
      minWidth: 100,
      renderCell: (params) => params.value ? '✓' : '✗'
    },
    {
      field: 'isActive',
      headerName: t('active') || 'Active',
      flex: 0.5,
      minWidth: 80,
      renderCell: (params) => params.value ? '✓' : '✗'
    }
  ], [t, isRTL]);
  
  // Teacher availability columns
  const teacherAvailabilityColumns = useMemo(() => [
    {
      field: 'user',
      headerName: t('teacher') || 'Teacher',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => params.row.user?.displayName || params.row.user?.firstName || 'Unknown'
    },
    {
      field: 'availableDays',
      headerName: t('available_days') || 'Available Days',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => params.value?.join(', ') || '-'
    },
    {
      field: 'maxSessionsPerDay',
      headerName: t('max_sessions') || 'Max Sessions/Day',
      flex: 0.5,
      minWidth: 100
    },
    {
      field: 'status',
      headerName: t('status') || 'Status',
      flex: 0.5,
      minWidth: 100
    },
    {
      field: 'isActive',
      headerName: t('active') || 'Active',
      flex: 0.5,
      minWidth: 80,
      renderCell: (params) => params.value ? '✓' : '✗'
    }
  ], [t]);
  
  // Handlers
  const handleEdit = useCallback((item) => {
    setEditingItem(item);
    
    switch (activeTab) {
      case 'classrooms':
        setClassroomForm({
          code: item.code || '',
          nameEn: item.nameEn || '',
          nameAr: item.nameAr || '',
          locationEn: item.locationEn || '',
          locationAr: item.locationAr || '',
          capacity: item.capacity || '',
          status: item.status || 'Available',
          isActive: item.isActive !== undefined ? item.isActive : true
        });
        break;
      case 'timeSlots':
        setTimeSlotForm({
          labelEn: item.labelEn || '',
          labelAr: item.labelAr || '',
          startTime: item.startTime || '',
          endTime: item.endTime || '',
          durationMinutes: item.durationMinutes || '',
          sortOrder: item.sortOrder || '',
          isBreak: item.isBreak || false,
          isActive: item.isActive !== undefined ? item.isActive : true
        });
        break;
      case 'holidays':
        setHolidayForm({
          descriptionEn: item.descriptionEn || '',
          descriptionAr: item.descriptionAr || '',
          type: item.type || 'Public',
          startDate: item.startDate?.split('T')[0] || '',
          endDate: item.endDate?.split('T')[0] || '',
          isRecurring: item.isRecurring || false,
          isActive: item.isActive !== undefined ? item.isActive : true
        });
        break;
      case 'teacherAvailability':
        setTeacherAvailabilityForm({
          userId: item.userId || '',
          availableDays: item.availableDays || ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
          maxSessionsPerDay: item.maxSessionsPerDay || 3,
          status: item.status || 'Active',
          isActive: item.isActive !== undefined ? item.isActive : true
        });
        break;
    }
  }, [activeTab]);
  
  const handleDelete = useCallback((item) => {
    deleteEntity(item);
  }, [deleteEntity]);
  
  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteModal.entity) return;
    
    setSaving(true);
    try {
      let result;
      switch (activeTab) {
        case 'classrooms':
          result = await deleteClassroom(deleteModal.entity.id);
          break;
        case 'timeSlots':
          result = await deleteTimeSlot(deleteModal.entity.id);
          break;
        case 'holidays':
          result = await deleteHoliday(deleteModal.entity.id);
          break;
        case 'teacherAvailability':
          result = await deleteTeacherAvailability(deleteModal.entity.id);
          break;
      }
      
      if (result.success) {
        toast.success(t('deleted_successfully') || 'Deleted successfully');
        hideDeleteModal();
      } else {
        toast.error(result.error || t('failed_to_delete') || 'Failed to delete');
      }
    } catch (error) {
      toast.error(error.message || t('failed_to_delete') || 'Failed to delete');
    } finally {
      setSaving(false);
    }
  }, [deleteModal.entity, activeTab, deleteClassroom, deleteTimeSlot, deleteHoliday, deleteTeacherAvailability, toast, t, hideDeleteModal]);
  
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    setSaving(true);
    try {
      let result;
      
      switch (activeTab) {
        case 'classrooms':
          if (editingItem) {
            result = await updateClassroom(editingItem.id, classroomForm);
          } else {
            result = await createClassroom(classroomForm);
          }
          break;
        case 'timeSlots':
          if (editingItem) {
            result = await updateTimeSlot(editingItem.id, timeSlotForm);
          } else {
            result = await createTimeSlot(timeSlotForm);
          }
          break;
        case 'holidays':
          if (editingItem) {
            result = await updateHoliday(editingItem.id, holidayForm);
          } else {
            result = await createHoliday(holidayForm);
          }
          break;
        case 'teacherAvailability':
          if (editingItem) {
            result = await updateTeacherAvailability(editingItem.id, teacherAvailabilityForm);
          } else {
            result = await createTeacherAvailability(teacherAvailabilityForm);
          }
          break;
      }
      
      if (result.success) {
        toast.success(editingItem ? t('updated_successfully') || 'Updated successfully' : t('created_successfully') || 'Created successfully');
        setEditingItem(null);
        resetForm();
      } else {
        toast.error(result.error || t('failed_to_save') || 'Failed to save');
      }
    } catch (error) {
      toast.error(error.message || t('failed_to_save') || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }, [activeTab, editingItem, classroomForm, timeSlotForm, holidayForm, teacherAvailabilityForm, createClassroom, updateClassroom, createTimeSlot, updateTimeSlot, createHoliday, updateHoliday, createTeacherAvailability, updateTeacherAvailability, toast, t]);
  
  const resetForm = useCallback(() => {
    setEditingItem(null);
    setClassroomForm({
      code: '',
      nameEn: '',
      nameAr: '',
      locationEn: '',
      locationAr: '',
      capacity: '',
      status: 'Available',
      isActive: true
    });
    setTimeSlotForm({
      labelEn: '',
      labelAr: '',
      startTime: '',
      endTime: '',
      durationMinutes: '',
      sortOrder: '',
      isBreak: false,
      isActive: true
    });
    setHolidayForm({
      descriptionEn: '',
      descriptionAr: '',
      type: 'Public',
      startDate: '',
      endDate: '',
      isRecurring: false,
      isActive: true
    });
    setTeacherAvailabilityForm({
      userId: '',
      availableDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
      maxSessionsPerDay: 3,
      status: 'Active',
      isActive: true
    });
  }, []);
  
  const handleBulkInitTimeSlots = useCallback(async () => {
    setSaving(true);
    try {
      const result = await bulkInitTimeSlots();
      if (result.success) {
        toast.success(t('time_slots_initialized') || 'Time slots initialized successfully');
      } else {
        toast.error(result.error || t('failed_to_initialize') || 'Failed to initialize time slots');
      }
    } catch (error) {
      toast.error(error.message || t('failed_to_initialize') || 'Failed to initialize time slots');
    } finally {
      setSaving(false);
    }
  }, [bulkInitTimeSlots, toast, t]);
  
  // Render form based on active tab
  const renderForm = () => {
    switch (activeTab) {
      case 'classrooms':
        return (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input
              label={t('code') || 'Code'}
              value={classroomForm.code}
              onChange={(e) => setClassroomForm({ ...classroomForm, code: e.target.value })}
              required
            />
            <Input
              label={t('name_en') || 'Name (English)'}
              value={classroomForm.nameEn}
              onChange={(e) => setClassroomForm({ ...classroomForm, nameEn: e.target.value })}
              required
            />
            <Input
              label={t('name_ar') || 'Name (Arabic)'}
              value={classroomForm.nameAr}
              onChange={(e) => setClassroomForm({ ...classroomForm, nameAr: e.target.value })}
            />
            <Input
              label={t('location_en') || 'Location (English)'}
              value={classroomForm.locationEn}
              onChange={(e) => setClassroomForm({ ...classroomForm, locationEn: e.target.value })}
            />
            <Input
              label={t('location_ar') || 'Location (Arabic)'}
              value={classroomForm.locationAr}
              onChange={(e) => setClassroomForm({ ...classroomForm, locationAr: e.target.value })}
            />
            <Input
              label={t('capacity') || 'Capacity'}
              type="number"
              value={classroomForm.capacity}
              onChange={(e) => setClassroomForm({ ...classroomForm, capacity: e.target.value })}
              required
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button type="submit" disabled={saving}>
                {saving ? t('saving') || 'Saving...' : (editingItem ? t('update') || 'Update' : t('create') || 'Create')}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>
                {t('cancel') || 'Cancel'}
              </Button>
            </div>
          </form>
        );
      case 'timeSlots':
        return (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input
              label={t('label_en') || 'Label (English)'}
              value={timeSlotForm.labelEn}
              onChange={(e) => setTimeSlotForm({ ...timeSlotForm, labelEn: e.target.value })}
              required
            />
            <Input
              label={t('label_ar') || 'Label (Arabic)'}
              value={timeSlotForm.labelAr}
              onChange={(e) => setTimeSlotForm({ ...timeSlotForm, labelAr: e.target.value })}
            />
            <Input
              label={t('start_time') || 'Start Time'}
              type="time"
              value={timeSlotForm.startTime}
              onChange={(e) => setTimeSlotForm({ ...timeSlotForm, startTime: e.target.value })}
              required
            />
            <Input
              label={t('end_time') || 'End Time'}
              type="time"
              value={timeSlotForm.endTime}
              onChange={(e) => setTimeSlotForm({ ...timeSlotForm, endTime: e.target.value })}
              required
            />
            <Input
              label={t('duration_minutes') || 'Duration (minutes)'}
              type="number"
              value={timeSlotForm.durationMinutes}
              onChange={(e) => setTimeSlotForm({ ...timeSlotForm, durationMinutes: e.target.value })}
              required
            />
            <Input
              label={t('sort_order') || 'Sort Order'}
              type="number"
              value={timeSlotForm.sortOrder}
              onChange={(e) => setTimeSlotForm({ ...timeSlotForm, sortOrder: e.target.value })}
              required
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button type="submit" disabled={saving}>
                {saving ? t('saving') || 'Saving...' : (editingItem ? t('update') || 'Update' : t('create') || 'Create')}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>
                {t('cancel') || 'Cancel'}
              </Button>
              <Button type="button" variant="outline" onClick={handleBulkInitTimeSlots} disabled={saving}>
                {t('initialize_defaults') || 'Initialize Defaults'}
              </Button>
            </div>
          </form>
        );
      case 'holidays':
        return (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input
              label={t('description_en') || 'Description (English)'}
              value={holidayForm.descriptionEn}
              onChange={(e) => setHolidayForm({ ...holidayForm, descriptionEn: e.target.value })}
              required
            />
            <Input
              label={t('description_ar') || 'Description (Arabic)'}
              value={holidayForm.descriptionAr}
              onChange={(e) => setHolidayForm({ ...holidayForm, descriptionAr: e.target.value })}
            />
            <Input
              label={t('type') || 'Type'}
              value={holidayForm.type}
              onChange={(e) => setHolidayForm({ ...holidayForm, type: e.target.value })}
              required
            />
            <Input
              label={t('start_date') || 'Start Date'}
              type="date"
              value={holidayForm.startDate}
              onChange={(e) => setHolidayForm({ ...holidayForm, startDate: e.target.value })}
              required
            />
            <Input
              label={t('end_date') || 'End Date'}
              type="date"
              value={holidayForm.endDate}
              onChange={(e) => setHolidayForm({ ...holidayForm, endDate: e.target.value })}
              required
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button type="submit" disabled={saving}>
                {saving ? t('saving') || 'Saving...' : (editingItem ? t('update') || 'Update' : t('create') || 'Create')}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>
                {t('cancel') || 'Cancel'}
              </Button>
            </div>
          </form>
        );
      case 'teacherAvailability':
        return (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input
              label={t('user_id') || 'User ID'}
              value={teacherAvailabilityForm.userId}
              onChange={(e) => setTeacherAvailabilityForm({ ...teacherAvailabilityForm, userId: e.target.value })}
              required
            />
            <Input
              label={t('max_sessions_per_day') || 'Max Sessions Per Day'}
              type="number"
              value={teacherAvailabilityForm.maxSessionsPerDay}
              onChange={(e) => setTeacherAvailabilityForm({ ...teacherAvailabilityForm, maxSessionsPerDay: parseInt(e.target.value) })}
              required
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button type="submit" disabled={saving}>
                {saving ? t('saving') || 'Saving...' : (editingItem ? t('update') || 'Update' : t('create') || 'Create')}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>
                {t('cancel') || 'Cancel'}
              </Button>
            </div>
          </form>
        );
      default:
        return null;
    }
  };
  
  // Render data grid based on active tab
  const renderDataGrid = () => {
    const loading = activeTab === 'classrooms' ? classroomsLoading :
                    activeTab === 'timeSlots' ? timeSlotsLoading :
                    activeTab === 'holidays' ? holidaysLoading :
                    teacherAvailabilitiesLoading;
    
    const error = activeTab === 'classrooms' ? classroomsError :
                  activeTab === 'timeSlots' ? timeSlotsError :
                  activeTab === 'holidays' ? holidaysError :
                  teacherAvailabilitiesError;
    
    const data = activeTab === 'classrooms' ? classrooms :
                 activeTab === 'timeSlots' ? timeSlots :
                 activeTab === 'holidays' ? holidays :
                 teacherAvailabilities;
    
    const columns = activeTab === 'classrooms' ? classroomColumns :
                    activeTab === 'timeSlots' ? timeSlotColumns :
                    activeTab === 'holidays' ? holidayColumns :
                    teacherAvailabilityColumns;
    
    if (loading) {
      return <SimpleLoading />;
    }
    
    if (error) {
      return (
        <div style={{ padding: '1rem', color: 'red' }}>
          {error}
        </div>
      );
    }
    
    return (
      <AdvancedDataGrid
        rows={data}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        pageSize={10}
        disableSelectionOnClick
      />
    );
  };
  
  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
          {t('scheduling_masters') || 'Scheduling Masters'}
        </h1>
        <p style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
          {t('scheduling_masters_description') || 'Manage classrooms, time slots, holidays, and teacher availability'}
        </p>
      </div>
      
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`, paddingBottom: '0.5rem' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              resetForm();
            }}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: activeTab === tab.id ? (theme === 'dark' ? '#374151' : '#f3f4f6') : 'transparent',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: activeTab === tab.id ? '500' : '400',
              color: theme === 'dark' ? '#f3f4f6' : '#1f2937'
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
      
      {/* Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem' }}>
        {/* Form */}
        <Card>
          <CardBody>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '1rem' }}>
              {editingItem ? t('edit') || 'Edit' : t('create_new') || 'Create New'}
            </h3>
            {renderForm()}
          </CardBody>
        </Card>
        
        {/* Data Grid */}
        <Card>
          <CardBody>
            {renderDataGrid()}
          </CardBody>
        </Card>
      </div>
      
      {/* Delete Modal */}
      {deleteModal.isOpen && (
        <DeleteModal
          isOpen={deleteModal.isOpen}
          onClose={hideDeleteModal}
          onConfirm={handleDeleteConfirm}
          title={t('confirm_delete') || 'Confirm Delete'}
          message={t('confirm_delete_message') || 'Are you sure you want to delete this item?'}
          entityName={deleteModal.entity?.code || deleteModal.entity?.labelEn || deleteModal.entity?.descriptionEn || deleteModal.entity?.user?.displayName || 'Item'}
        />
      )}
    </div>
  );
};

export default SchedulingMastersPage;
