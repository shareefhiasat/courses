import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Joyride from 'react-joyride';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { Button, SimpleLoading, useToast, Input, Select, DeleteModal, UserSelect } from '@ui';
import MultiSelect from '@components/ui/MultiSelect';
import { useDeleteModal } from '@hooks/useDeleteModal.js';
import AdvancedDataGrid from '@components/ui/AdvancedDataGrid';
import { 
  getAllInstructorAvailabilities, 
  createInstructorAvailability, 
  updateInstructorAvailability, 
  deleteInstructorAvailability,
  validateInstructorAvailabilityChange
} from '@services/business/instructorAvailabilityService.js';
import { getAllUsers, getUserRoles } from '@services/business/userService.js';
import { getAllPrograms } from '@services/business/programService.js';
import { getAllSubjects } from '@services/business/subjectService.js';
import { getAllClasses } from '@services/business/classService.js';
import { formatDateTime } from '@utils/dateUtils.js';
import { useAuditGridColumns } from '@hooks/useAuditGridColumns.js';
import { exportToCSV } from '@utils/csvExport.js';
import {
  getWeekDayOptions,
  formatWeekDayCodes,
  getLocalizedProgramName,
  getLocalizedSubjectName,
  getLocalizedClassName,
  getLocalizedInstructorName,
} from '@utils/schedulingDisplayUtils.js';
import AvailabilityChangeConflictPanel from '@components/AvailabilityChangeConflictPanel.jsx';
import { useAvailabilityChangeValidation } from '@hooks/useAvailabilityChangeValidation.js';

const InstructorAvailabilityPage = () => {
  const { user, isAdmin, isHR, isSuperAdmin } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const toast = useToast();
  const { deleteModal, deleteEntity, handleDeleteConfirm, hideDeleteModal } = useDeleteModal(t);

  // ── Guided Tour ───────────────────────────────────────────────────────────
  const [runTour, setRunTour] = useState(false);
  const tourSeenKey = `instrAvailTourSeen_${lang}`;
  const tourSteps = useMemo(() => [
    { target: 'body', content: t('tour.instr_avail_filters'), disableBeacon: true, placement: 'center' },
    { target: '[data-tour="instr-avail-form"]', content: t('tour.instr_avail_filters'), disableBeacon: true, placement: 'bottom' },
    { target: '[data-tour="instr-avail-filters"]', content: t('tour.instr_avail_filters'), disableBeacon: true, placement: 'bottom' },
    { target: '[data-tour="instr-avail-grid"]', content: t('tour.instr_avail_grid'), disableBeacon: true, placement: 'top' },
    { target: '[data-tour="instr-avail-grid"]', content: t('tour.instr_avail_conflict'), disableBeacon: true, placement: 'top' },
    { target: '[data-tour="instr-avail-export"]', content: t('tour.instr_avail_export'), disableBeacon: true, placement: 'top' },
  ], [lang, t]);
  useEffect(() => {
    const start = () => setRunTour(true);
    window.addEventListener('app:joyride', start);
    window.addEventListener('app:help', start);
    return () => { window.removeEventListener('app:joyride', start); window.removeEventListener('app:help', start); };
  }, []);
  useEffect(() => { try { if (!localStorage.getItem(tourSeenKey)) setRunTour(true); } catch {} }, [tourSeenKey]);
  const handleTourCallback = useCallback((data) => {
    const { status } = data || {};
    if (status === 'finished' || status === 'skipped') { setRunTour(false); try { localStorage.setItem(tourSeenKey, 'true'); } catch {} }
  }, [tourSeenKey]);
  // ─────────────────────────────────────────────────────────────────────────

  const [availabilities, setAvailabilities] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formState, setFormState] = useState('creating'); // creating, editing
  const [editingAvailability, setEditingAvailability] = useState(null);
  const [saving, setSaving] = useState(false);
  const [gridKey, setGridKey] = useState(0);

  // Filter state
  const [filterSearch, setFilterSearch] = useState('');
  const [filterInstructor, setFilterInstructor] = useState('');
  const [filterDay, setFilterDay] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterTimeFrom, setFilterTimeFrom] = useState('');
  const [filterTimeTo, setFilterTimeTo] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [deleteValidation, setDeleteValidation] = useState(null);
  
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);

  const [formData, setFormData] = useState({
    instructorUserId: '',
    dayOfWeek: ['Sun'],
    slots: [{ startTime: '09:00', endTime: '10:00' }],
    startDate: '',
    endDate: '',
    maxSessionsPerDay: 3,
    maxHoursPerWeek: null,
    programId: '',
    subjectId: '',
    classId: '',
  });

  const { validation: changeValidation, validating, runValidation, clearValidation } = useAvailabilityChangeValidation({
    validateFn: validateInstructorAvailabilityChange,
    formData,
    editingAvailabilityId: editingAvailability?.id,
    instructorUserId: formData.instructorUserId ? parseInt(formData.instructorUserId, 10) : null,
    enabled: formState === 'editing'
  });

  const dayOptions = useMemo(() => getWeekDayOptions(t), [t]);

  const localizedEntityName = useCallback((entity) => {
    if (!entity) return '';
    if (lang === 'ar' && entity.nameAr) return entity.nameAr;
    return entity.nameEn || entity.name || '';
  }, [lang]);

  const loadAvailabilities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filterSearch) params.search = filterSearch;
      if (filterInstructor) params.instructorUserId = filterInstructor;
      if (filterDay) params.dayOfWeek = filterDay;
      if (filterStartDate) params.startDate = filterStartDate;
      if (filterEndDate) params.endDate = filterEndDate;
      if (filterTimeFrom) params.timeFrom = filterTimeFrom;
      if (filterTimeTo) params.timeTo = filterTimeTo;
      if (filterProgram) params.programId = filterProgram;
      if (filterSubject) params.subjectId = filterSubject;
      if (filterClass) params.classId = filterClass;
      
      const result = await getAllInstructorAvailabilities(params);
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
  }, [toast, t, filterSearch, filterInstructor, filterDay, filterStartDate, filterEndDate, filterTimeFrom, filterTimeTo, filterProgram, filterSubject, filterClass]);

  const loadInstructors = useCallback(async () => {
    try {
      // Get users who are instructors (filter by role)
      const result = await getAllUsers({ limit: 1000 });
      if (result.success) {
        // Filter users who have instructor role
        const instructors = (result.data || []).filter(user => {
          const roles = getUserRoles(user);
          return roles.includes('instructor');
        });
        setInstructors(instructors);
      }
    } catch (error) {
      console.error('Failed to load instructors:', error);
    }
  }, []);
  
  const loadPrograms = useCallback(async () => {
    try {
      const result = await getAllPrograms();
      if (result.success) {
        setPrograms(result.data);
      }
    } catch (error) {
      console.error('Error loading programs:', error);
    }
  }, []);
  
  const loadSubjects = useCallback(async () => {
    try {
      const result = await getAllSubjects();
      if (result.success) {
        setSubjects(result.data);
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  }, []);
  
  const loadClasses = useCallback(async () => {
    try {
      const result = await getAllClasses();
      if (result.success) {
        setClasses(result.data);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  }, []);

  useEffect(() => {
    loadAvailabilities();
    loadInstructors();
    loadPrograms();
    loadSubjects();
    loadClasses();
  }, [loadAvailabilities, loadInstructors, loadPrograms, loadSubjects, loadClasses]);

  const handleNewAvailability = () => {
    setEditingAvailability(null);
    setFormData({
      instructorUserId: '',
      dayOfWeek: ['Sun'],
      slots: [{ startTime: '09:00', endTime: '10:00' }],
      startDate: '',
      endDate: '',
      maxSessionsPerDay: 3,
      maxHoursPerWeek: null,
      programId: '',
      subjectId: '',
      classId: '',
    });
    setFormState('creating');
  };

  const handleEditAvailability = (availability) => {
    setEditingAvailability(availability);
    setFormData({
      instructorUserId: availability.instructorUserId?.toString() || '',
      dayOfWeek: availability.dayOfWeek || ['Sun'],
      slots: availability.slots && availability.slots.length > 0 
        ? availability.slots.map(s => ({ startTime: s.startTime, endTime: s.endTime }))
        : [{ startTime: '09:00', endTime: '10:00' }],
      startDate: availability.startDate ? new Date(availability.startDate).toISOString().split('T')[0] : '',
      endDate: availability.endDate ? new Date(availability.endDate).toISOString().split('T')[0] : '',
      programId: availability.programId?.toString() || '',
      subjectId: availability.subjectId?.toString() || '',
      classId: availability.classId?.toString() || '',
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
      if (!formData.instructorUserId || formData.instructorUserId.trim() === '') {
        toast.error(t('instructor_required'));
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
        instructorUserId: parseInt(formData.instructorUserId),
        dayOfWeek: formData.dayOfWeek || [],
        slots: formData.slots,
        startDate: formData.startDate ? new Date(formData.startDate) : null,
        endDate: formData.endDate ? new Date(formData.endDate) : null,
        maxSessionsPerDay: formData.maxSessionsPerDay || 3,
        maxHoursPerWeek: formData.maxHoursPerWeek || null,
        programId: formData.programId ? parseInt(formData.programId) : null,
        subjectId: formData.subjectId ? parseInt(formData.subjectId) : null,
        classId: formData.classId ? parseInt(formData.classId) : null,
        createdBy: user?.dbId,
      };

      console.log('[InstructorAvailabilityListPage] Saving availability with payload:', payload);

      let result;
      if (editingAvailability) {
        result = await updateInstructorAvailability(editingAvailability.id, { ...payload, updatedBy: user?.dbId });
      } else {
        result = await createInstructorAvailability(payload);
      }

      console.log('[InstructorAvailabilityListPage] Save result:', result);

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
      console.error('[InstructorAvailabilityListPage] Save error:', error);
      toast.error(error.message || t('failed_to_save_availability'));
    } finally {
      setSaving(false);
    }
  };

  const resetForm = useCallback(() => {
    setFormData({
      instructorUserId: '',
      dayOfWeek: ['Sun'],
      slots: [{ startTime: '', endTime: '' }],
      startDate: '',
      endDate: '',
      maxSessionsPerDay: 3,
      maxHoursPerWeek: null,
      programId: '',
      subjectId: '',
      classId: '',
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
        instructorUserId: availability.instructorUserId,
        action: 'delete'
      });
      if (preview && !preview.valid) {
        setDeleteValidation(preview);
        toast.error(t('availability_change_blocked_title'));
        return;
      }

      const result = await deleteInstructorAvailability(availability.id, user);

      console.log('[InstructorAvailabilityListPage] Delete result:', result);

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
      console.error('[InstructorAvailabilityListPage] Delete error:', error);
      toast.error(error.message || t('failed_to_delete_availability'));
    } finally {
      setSaving(false);
    }
  };

  // Build grid columns
  const gridColumns = useMemo(() => {
    const columns = [
      {
        field: 'instructor',
        headerName: t('instructor') || 'Instructor',
        flex: 1,
        minWidth: 200,
        renderCell: (params) => {
          const instructor = params?.row?.instructor;
          if (!instructor) return '—';
          return getLocalizedInstructorName(instructor, lang, instructor.displayName || `${instructor.firstName} ${instructor.lastName}`);
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
      },
      {
        field: 'program',
        headerName: t('program'),
        flex: 1,
        minWidth: 150,
        renderCell: (params) => {
          const program = params?.row?.program;
          if (!program) return '—';
          return getLocalizedProgramName(program, lang) || '—';
        }
      },
      {
        field: 'subject',
        headerName: t('subject'),
        flex: 1,
        minWidth: 150,
        renderCell: (params) => {
          const subject = params?.row?.subject;
          if (!subject) return '—';
          return getLocalizedSubjectName(subject, lang) || '—';
        }
      },
      {
        field: 'class',
        headerName: t('class'),
        flex: 1,
        minWidth: 150,
        renderCell: (params) => {
          const cls = params?.row?.class;
          if (!cls) return '—';
          return getLocalizedClassName(cls, lang) || '—';
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
                onClick={() => deleteEntity('availability', `${row.instructor?.code} - ${row.dayOfWeek}`, () => handleDeleteAvailability(row))}
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
  }, [auditColumns, formatDate, handleEditAvailability, deleteEntity, saving, t, lang]);

  // Backend handles filtering
  const filteredAvailabilities = availabilities;

  const handleExport = useCallback(() => {
    const result = exportToCSV(filteredAvailabilities, gridColumns, 'instructor-availability.csv');
    if (result.success) {
      toast.success(t('instructor_availability_exported'));
    } else {
      toast.error(result.error || t('failed_to_export_instructor_availability'));
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
          {t('admin_hr_required_instructor_availability')}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      <Joyride continuous run={runTour} steps={tourSteps} callback={handleTourCallback} scrollOffset={100} scrollToFirstStep
        locale={{ back: t('tour_back'), close: t('tour_close'), last: t('tour_finish'), next: t('tour_next'), skip: t('tour_skip') }}
        styles={{ options: { primaryColor: 'var(--color-primary,#800020)', textColor: theme === 'dark' ? '#e5e7eb' : '#111', backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', zIndex: 10000 } }}
      />
      {/* Form - Always visible */}
      <form data-tour="instr-avail-form" onSubmit={handleSaveAvailability} style={{ marginBottom: '2rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>{t('instructor') || 'Instructor'} *</label>
            <UserSelect
              value={formData.instructorUserId}
              onChange={(value) => handleInputChange('instructorUserId', value)}
              users={instructors}
              disabled={saving}
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

          <div style={{ gridColumn: '1 / -1', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ flex: '1 1 180px', minWidth: 0 }}>
              <Select
                value={formData.programId}
                onChange={(e) => handleInputChange('programId', e.target.value)}
                options={(programs || []).map(p => ({ value: p.id.toString(), label: localizedEntityName(p) }))}
                disabled={saving}
                placeholder={`${t('program')} (${t('optional_label')})`}
              />
            </div>
            <div style={{ flex: '1 1 180px', minWidth: 0 }}>
              <Select
                value={formData.subjectId}
                onChange={(e) => handleInputChange('subjectId', e.target.value)}
                options={(subjects || []).map(s => ({ value: s.id.toString(), label: localizedEntityName(s) }))}
                disabled={saving}
                placeholder={`${t('subject')} (${t('optional_label')})`}
              />
            </div>
            <div style={{ flex: '1 1 180px', minWidth: 0 }}>
              <Select
                value={formData.classId}
                onChange={(e) => handleInputChange('classId', e.target.value)}
                options={(classes || []).map(c => ({ value: c.id.toString(), label: localizedEntityName(c) }))}
                disabled={saving}
                placeholder={`${t('class')} (${t('optional_label')})`}
              />
            </div>
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
      <div data-tour="instr-avail-filters" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'flex-end' }}>
        <div style={{ flex: '2 1 180px' }}>
          <Input
            value={filterSearch}
            onChange={e => setFilterSearch(e.target.value)}
            placeholder={t('search') || 'Search'}
          />
        </div>
        <div style={{ flex: '1 1 180px' }}>
          <UserSelect
            value={filterInstructor}
            onChange={setFilterInstructor}
            users={instructors}
            placeholder={t('instructor') || 'Instructor'}
            includeAll={true}
            allValue=""
            allLabel={t('all_instructors') || 'All Instructors'}
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
        <div style={{ flex: '1 1 150px' }}>
          <Select
            value={filterProgram}
            onChange={e => setFilterProgram(e.target.value)}
            options={[{ value: '', label: t('all_programs') }, ...(programs || []).map(p => ({ value: p.id.toString(), label: localizedEntityName(p) }))]}
            placeholder={t('program')}
          />
        </div>
        <div style={{ flex: '1 1 150px' }}>
          <Select
            value={filterSubject}
            onChange={e => setFilterSubject(e.target.value)}
            options={[{ value: '', label: t('all_subjects') }, ...(subjects || []).map(s => ({ value: s.id.toString(), label: localizedEntityName(s) }))]}
            placeholder={t('subject')}
          />
        </div>
        <div style={{ flex: '1 1 150px' }}>
          <Select
            value={filterClass}
            onChange={e => setFilterClass(e.target.value)}
            options={[{ value: '', label: t('all_classes') }, ...(classes || []).map(c => ({ value: c.id.toString(), label: localizedEntityName(c) }))]}
            placeholder={t('class')}
          />
        </div>
        {(filterSearch || filterInstructor || filterDay || filterStartDate || filterEndDate || filterTimeFrom || filterTimeTo || filterProgram || filterSubject || filterClass) && (
          <button onClick={() => { setFilterSearch(''); setFilterInstructor(''); setFilterDay(''); setFilterStartDate(''); setFilterEndDate(''); setFilterTimeFrom(''); setFilterTimeTo(''); setFilterProgram(''); setFilterSubject(''); setFilterClass(''); }}
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
          {t('instructor_availability_title', { count: `${filteredAvailabilities.length}${filteredAvailabilities.length !== availabilities.length ? ` / ${availabilities.length}` : ''}` })}
        </h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="button" onClick={() => setRunTour(true)} style={{ display:'inline-flex', alignItems:'center', padding:'0.35rem 0.65rem', fontSize:'0.8125rem', borderRadius:'6px', border:'none', background:'var(--color-primary,#800020)', color:'white', cursor:'pointer', fontWeight:700 }}>?</button>
          <Button data-tour="instr-avail-export" variant="outline" size="sm" onClick={handleExport} disabled={filteredAvailabilities.length === 0}>
            {t('export') || 'Export'}
          </Button>
        </div>
      </div>

      {/* Data Grid */}
      <div data-tour="instr-avail-grid" style={{
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

export default InstructorAvailabilityPage;
