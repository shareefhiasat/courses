import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Joyride from 'react-joyride';
import TourTooltip from '@ui/TourTooltip/TourTooltip';
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
  deleteClassroomAvailability,
  validateClassroomAvailabilityChange
} from '@services/business/classroomAvailabilityService.js';
import { getAllClassrooms } from '@services/business/classroomService.js';
import { formatDateTime } from '@utils/dateUtils.js';
import { useAuditGridColumns } from '@hooks/useAuditGridColumns.js';
import { exportToCSV } from '@utils/csvExport.js';
import {
  getWeekDayOptions,
  formatWeekDayCodes,
  getLocalizedClassroomName,
} from '@utils/schedulingDisplayUtils.js';
import AvailabilityChangeConflictPanel from '@components/AvailabilityChangeConflictPanel.jsx';
import { useAvailabilityChangeValidation } from '@hooks/useAvailabilityChangeValidation.js';

const ClassroomAvailabilityPage = () => {
  const { user, isAdmin, isHR, isSuperAdmin } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const toast = useToast();
  const { deleteModal, deleteEntity, handleDeleteConfirm, hideDeleteModal } = useDeleteModal(t);

  // ── Guided Tour ───────────────────────────────────────────────────────────
  const [runTour, setRunTour] = useState(false);
  const [tourSteps, setTourSteps] = useState([]);
  const tourSeenKey = `roomAvailTourSeen_${lang}`;
  const buildTourSteps = useCallback(() => [
    { target: '[data-tour="room-avail-form"]',    content: t('tour.room_avail_filters'), disableBeacon: true, placement: 'bottom' },
    { target: '[data-tour="room-avail-filters"]', content: t('tour.room_avail_filters'), disableBeacon: true, placement: 'bottom' },
    { target: '[data-tour="room-avail-grid"]',    content: t('tour.room_avail_grid'),    disableBeacon: true, placement: 'top' },
    { target: '[data-tour="room-avail-export"]',  content: t('tour.room_avail_export'),  disableBeacon: true, placement: 'top' },
  ].filter(s => !!document.querySelector(s.target)), [t]);
  const startTour = useCallback(() => { const steps = buildTourSteps(); if (!steps.length) return; setTourSteps(steps); setRunTour(true); }, [buildTourSteps]);
  useEffect(() => {
    window.addEventListener('app:joyride', startTour);
    window.addEventListener('app:help', startTour);
    return () => { window.removeEventListener('app:joyride', startTour); window.removeEventListener('app:help', startTour); };
  }, [startTour]);
  useEffect(() => { try { if (!localStorage.getItem(tourSeenKey)) startTour(); } catch {} }, [tourSeenKey, startTour]);
  const handleTourCallback = useCallback((data) => {
    const { status, action } = data || {};
    if (status === 'finished' || status === 'skipped' || action === 'close') { setRunTour(false); try { localStorage.setItem(tourSeenKey, 'true'); } catch {} }
  }, [tourSeenKey]);
  const TourTooltipComponent = useMemo(() => TourTooltip({ tourSeenKey }), [tourSeenKey]);
  // ─────────────────────────────────────────────────────────────────────────

  const [availabilities, setAvailabilities] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formState, setFormState] = useState('creating'); // creating, editing
  const [editingAvailability, setEditingAvailability] = useState(null);
  const [saving, setSaving] = useState(false);
  const [gridKey, setGridKey] = useState(0);

  // Filter state
  const [filterSearch, setFilterSearch] = useState('');
  const [filterClassroom, setFilterClassroom] = useState('');
  const [filterDay, setFilterDay] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterTimeFrom, setFilterTimeFrom] = useState('');
  const [filterTimeTo, setFilterTimeTo] = useState('');
  const [deleteValidation, setDeleteValidation] = useState(null);

  const [formData, setFormData] = useState({
    classroomId: '',
    dayOfWeek: ['Sun'],
    slots: [{ startTime: '09:00', endTime: '10:00' }],
    startDate: '',
    endDate: '',
  });

  const { validation: changeValidation, validating, runValidation, clearValidation } = useAvailabilityChangeValidation({
    validateFn: validateClassroomAvailabilityChange,
    formData,
    editingAvailabilityId: editingAvailability?.id,
    classroomId: formData.classroomId ? parseInt(formData.classroomId, 10) : null,
    enabled: formState === 'editing'
  });

  const dayOptions = useMemo(() => getWeekDayOptions(t), [t]);

  const classroomLabel = useCallback((c) => {
    const name = getLocalizedClassroomName(c, lang);
    return `${c.code} - ${name}`;
  }, [lang]);

  const loadAvailabilities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filterSearch) params.search = filterSearch;
      if (filterClassroom) params.classroomId = filterClassroom;
      if (filterDay) params.dayOfWeek = filterDay;
      if (filterStartDate) params.startDate = filterStartDate;
      if (filterEndDate) params.endDate = filterEndDate;
      if (filterTimeFrom) params.timeFrom = filterTimeFrom;
      if (filterTimeTo) params.timeTo = filterTimeTo;
      
      const result = await getAllClassroomAvailabilities(params);
      if (result.success) {
        setAvailabilities(result.data);
      } else {
        setError(result.error);
        toast.error(result.error || t('failed_to_load_availability'));
      }
    } catch (error) {
      setError(error.message);
      toast.error(error.message || t('failed_to_load_availability'));
    } finally {
      setLoading(false);
    }
  }, [toast, t, filterSearch, filterClassroom, filterDay, filterStartDate, filterEndDate, filterTimeFrom, filterTimeTo]);

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
    if (formState === 'editing' && formData.slots.length <= 1) {
      toast.error(t('availability_slots_required'));
      return;
    }
    setFormData(prev => ({
      ...prev,
      slots: prev.slots.filter((_, i) => i !== index)
    }));
  }, [formState, formData.slots.length, toast, t]);

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
        toast.error(t('availability_classroom_required'));
        return;
      }
      if (!formData.dayOfWeek || formData.dayOfWeek.length === 0) {
        toast.error(t('availability_days_required'));
        return;
      }
      if (!formData.slots || formData.slots.length === 0) {
        toast.error(t('availability_slots_required'));
        return;
      }
      if (!formData.startDate || !formData.endDate) {
        toast.error(t('availability_dates_required'));
        return;
      }
      if (new Date(formData.startDate) > new Date(formData.endDate)) {
        toast.error(t('availability_date_order_invalid'));
        return;
      }

      if (editingAvailability) {
        const preview = await runValidation('update');
        if (preview && !preview.valid) {
          toast.error(t('availability_change_blocked_title'));
          return;
        }
      }

      // Validate each slot
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      for (let i = 0; i < formData.slots.length; i++) {
        const slot = formData.slots[i];
        if (!slot.startTime || !slot.endTime) {
          toast.error(t('availability_slot_times_required', { slot: i + 1 }));
          return;
        }
        if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
          toast.error(t('availability_slot_time_format', { slot: i + 1 }));
          return;
        }
        const startMinutes = parseInt(slot.startTime.split(':')[0]) * 60 + parseInt(slot.startTime.split(':')[1]);
        const endMinutes = parseInt(slot.endTime.split(':')[0]) * 60 + parseInt(slot.endTime.split(':')[1]);
        if (endMinutes <= startMinutes) {
          toast.error(t('availability_slot_time_order', { slot: i + 1 }));
          return;
        }
      }

      const payload = {
        classroomId: parseInt(formData.classroomId),
        dayOfWeek: formData.dayOfWeek || [],
        slots: formData.slots,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
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
        toast.success(editingAvailability ? t('availability_updated') : t('availability_created'));
        resetForm();
        clearValidation();
        setDeleteValidation(null);
        setGridKey(prev => prev + 1);
        loadAvailabilities();
      } else {
        if (result.conflicts?.length) {
          setDeleteValidation({ valid: false, conflicts: result.conflicts, blockingCount: result.blockingCount });
        }
        toast.error(result.error || t('failed_to_save_availability'));
      }
    } catch (error) {
      console.error('[ClassroomAvailabilityListPage] Save error:', error);
      toast.error(error.message || t('failed_to_save_availability'));
    } finally {
      setSaving(false);
    }
  };

  const resetForm = useCallback(() => {
    setFormData({
      classroomId: '',
      dayOfWeek: ['Sun'],
      slots: [{ startTime: '', endTime: '' }],
      startDate: '',
      endDate: '',
    });
    setEditingAvailability(null);
    setFormState('creating');
    clearValidation();
    setDeleteValidation(null);
  }, [clearValidation]);

  const handleCancel = useCallback(() => {
    resetForm();
  }, [resetForm]);

  const auditColumns = useAuditGridColumns();

  const formatDate = useCallback((dateValue) => {
    return formatDateTime(dateValue, lang);
  }, [lang]);

  const handleDeleteAvailability = async (availability) => {
    try {
      setSaving(true);
      const preview = await runValidation('delete', {
        availabilityId: availability.id,
        classroomId: availability.classroomId,
        action: 'delete'
      });
      if (preview && !preview.valid) {
        setDeleteValidation(preview);
        toast.error(t('availability_change_blocked_title'));
        return;
      }

      const result = await deleteClassroomAvailability(availability.id, user);

      console.log('[ClassroomAvailabilityListPage] Delete result:', result);

      if (result.success) {
        toast.success(t('availability_deleted'));
        setDeleteValidation(null);
        setGridKey(prev => prev + 1);
        loadAvailabilities();
      } else {
        if (result.conflicts?.length) {
          setDeleteValidation({ valid: false, conflicts: result.conflicts, blockingCount: result.blockingCount });
        }
        toast.error(result.error || t('failed_to_delete_availability'));
      }
    } catch (error) {
      console.error('[ClassroomAvailabilityListPage] Delete error:', error);
      toast.error(error.message || t('failed_to_delete_availability'));
    } finally {
      setSaving(false);
    }
  };

  // Build grid columns
  const gridColumns = useMemo(() => {
    const columns = [
      {
        field: 'classroom',
        headerName: t('classroom') || 'Classroom',
        flex: 1,
        minWidth: 150,
        renderCell: (params) => {
          const classroom = params?.row?.classroom;
          if (!classroom) return '—';
          return classroomLabel(classroom);
        }
      },
      {
        field: 'dayOfWeek',
        headerName: t('days_of_week'),
        width: 150,
        renderCell: (params) => formatWeekDayCodes(params?.value, t)
      },
      {
        field: 'slots',
        headerName: t('time_slots') || 'Time Slots',
        width: 200,
        renderCell: (params) => {
          const slots = params?.value;
          if (!slots || !Array.isArray(slots) || slots.length === 0) return '—';
          return slots.map(s => `${s.startTime}-${s.endTime}`).join(', ');
        }
      },
      {
        field: 'daysCount',
        headerName: t('days_count') || 'Days Count',
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
        headerName: t('start_date') || 'Start Date',
        width: 120,
        renderCell: (params) => {
          const value = params?.value;
          return value ? formatDate(value) : '—';
        }
      },
      {
        field: 'endDate',
        headerName: t('end_date') || 'End Date',
        width: 120,
        renderCell: (params) => {
          const value = params?.value;
          return value ? formatDate(value) : '—';
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
  }, [auditColumns, formatDate, handleEditAvailability, deleteEntity, saving, t, lang, classroomLabel]);

  // Backend handles filtering
  const filteredAvailabilities = availabilities;

  const handleExport = useCallback(() => {
    const result = exportToCSV(filteredAvailabilities, gridColumns, 'classroom-availability.csv');
    if (result.success) {
      toast.success(t('room_availability_exported'));
    } else {
      toast.error(result.error || t('failed_to_export_room_availability'));
    }
  }, [filteredAvailabilities, gridColumns, toast, t]);

  const hasPermission = isAdmin || isHR || isSuperAdmin;

  if (!hasPermission) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.125rem', fontWeight: '500', color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}>
          {t('access_denied')}
        </div>
        <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginTop: '0.5rem' }}>
          {t('admin_hr_required_room_availability')}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      <Joyride continuous run={runTour && tourSteps.length > 0} steps={tourSteps} callback={handleTourCallback} scrollOffset={100} scrollToFirstStep showSkipButton showProgress tooltipComponent={TourTooltipComponent}
        locale={{ back: t('tour_back'), close: t('tour_close'), last: t('tour_finish'), next: t('tour_next'), skip: t('tour_skip') }}
        styles={{ options: { primaryColor: 'var(--color-primary,#800020)', textColor: theme === 'dark' ? '#e5e7eb' : '#111', backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', zIndex: 10000 } }}
      />
      {/* Form - Always visible */}
      <form data-tour="room-avail-form" onSubmit={handleSaveAvailability} style={{ marginBottom: '2rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>{t('classroom')} *</label>
            <Select
              value={formData.classroomId}
              onChange={(e) => handleInputChange('classroomId', e.target.value)}
              options={classrooms.map(c => ({ value: c.id.toString(), label: classroomLabel(c) }))}
              disabled={saving}
              placeholder={t('select_classroom') || 'Select classroom'}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>{t('days_of_week') || 'Day(s) of Week'}</label>
            <MultiSelect
              value={formData.dayOfWeek}
              onChange={(value) => handleInputChange('dayOfWeek', value)}
              options={dayOptions}
              placeholder={t('select_days') || 'Select days...'}
              disabled={saving}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontWeight: '500' }}>{t('time_slots')} *</label>
              <Button
                type="button"
                onClick={handleAddSlot}
                disabled={saving}
                style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
              >
                + {t('add_slot')}
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
                    placeholder={t('start_time')}
                  />
                </div>
                <span style={{ padding: '0 0.5rem' }}>—</span>
                <div style={{ flex: 1 }}>
                  <Input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => handleSlotChange(index, 'endTime', e.target.value)}
                    disabled={saving}
                    placeholder={t('end_time')}
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
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>{t('start_date')} *</label>
            <Input
              type="date"
              value={formData.startDate}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              disabled={saving}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>{t('end_date')} *</label>
            <Input
              type="date"
              value={formData.endDate}
              onChange={(e) => handleInputChange('endDate', e.target.value)}
              disabled={saving}
            />
          </div>
        </div>

        {(formState === 'editing' || deleteValidation) && (
          <AvailabilityChangeConflictPanel
            validation={deleteValidation || changeValidation}
            theme={theme}
            t={t}
            loading={validating}
          />
        )}

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            type="submit"
            disabled={saving || validating || (formState === 'editing' && changeValidation && !changeValidation.valid)}
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
      <div data-tour="room-avail-filters" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'flex-end' }}>
        <div style={{ flex: '2 1 180px' }}>
          <Input
            value={filterSearch}
            onChange={e => setFilterSearch(e.target.value)}
            placeholder={t('search') || 'Search'}
          />
        </div>
        <div style={{ flex: '1 1 160px' }}>
          <Select
            value={filterClassroom}
            onChange={e => setFilterClassroom(e.target.value)}
            options={[{ value: '', label: t('all_classrooms') }, ...classrooms.map(c => ({ value: String(c.id), label: classroomLabel(c) }))]}
            placeholder={t('classroom') || 'Classroom'}
          />
        </div>
        <div style={{ flex: '1 1 130px' }}>
          <Select
            value={filterDay}
            onChange={e => setFilterDay(e.target.value)}
            options={[{ value: '', label: t('all_days') }, ...dayOptions]}
            placeholder={t('day') || 'Day'}
          />
        </div>
        <div style={{ flex: '1 1 140px' }}>
          <Input
            type="date"
            value={filterStartDate}
            onChange={e => setFilterStartDate(e.target.value)}
            placeholder={t('start_date') || 'Start Date'}
          />
        </div>
        <div style={{ flex: '1 1 140px' }}>
          <Input
            type="date"
            value={filterEndDate}
            onChange={e => setFilterEndDate(e.target.value)}
            placeholder={t('end_date') || 'End Date'}
          />
        </div>
        <div style={{ flex: '1 1 100px' }}>
          <Input
            type="time"
            value={filterTimeFrom}
            onChange={e => setFilterTimeFrom(e.target.value)}
            placeholder={t('time_from') || 'From'}
          />
        </div>
        <div style={{ flex: '1 1 100px' }}>
          <Input
            type="time"
            value={filterTimeTo}
            onChange={e => setFilterTimeTo(e.target.value)}
            placeholder={t('time_to') || 'To'}
          />
        </div>
        {(filterSearch || filterClassroom || filterDay || filterStartDate || filterEndDate || filterTimeFrom || filterTimeTo) && (
          <button onClick={() => { setFilterSearch(''); setFilterClassroom(''); setFilterDay(''); setFilterStartDate(''); setFilterEndDate(''); setFilterTimeFrom(''); setFilterTimeTo(''); }}
            style={{ border: `1px solid ${theme === 'dark' ? '#374151' : '#d1d5db'}`, backgroundColor: 'transparent', cursor: 'pointer', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
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
        <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '500' }}>
          {t('room_availability_title', { count: `${filteredAvailabilities.length}${filteredAvailabilities.length !== availabilities.length ? ` / ${availabilities.length}` : ''}` })}
        </h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          
          <Button data-tour="room-avail-export" variant="outline" size="sm" onClick={handleExport} disabled={filteredAvailabilities.length === 0}>
            {t('export') || 'Export'}
          </Button>
        </div>
      </div>

      {/* Data Grid */}
      <div data-tour="room-avail-grid" style={{
        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
        border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
        borderRadius: '0.5rem',
        overflow: 'hidden'
      }}>
        <AdvancedDataGrid
          key={gridKey}
          rows={filteredAvailabilities}
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
