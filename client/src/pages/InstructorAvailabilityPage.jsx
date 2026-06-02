import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
  deleteInstructorAvailability 
} from '@services/business/instructorAvailabilityService.js';
import { getAllUsers, getUserRoles } from '@services/business/userService.js';
import { getAllPrograms } from '@services/business/programService.js';
import { getAllSubjects } from '@services/business/subjectService.js';
import { getAllClasses } from '@services/business/classService.js';
import { formatDateTime } from '@utils/dateUtils.js';
import { getUserDisplayName as getAuthUserDisplayName } from '@services/business/authService';
import { exportToCSV } from '@utils/csvExport.js';

const InstructorAvailabilityPage = () => {
  const { user, isAdmin, isHR, isSuperAdmin } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const toast = useToast();
  const { deleteModal, deleteEntity, handleDeleteConfirm, hideDeleteModal } = useDeleteModal(t);

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
        toast.error(result.error || 'Failed to load instructor availabilities');
      }
    } catch (error) {
      setError(error.message);
      toast.error(error.message || 'Failed to load instructor availabilities');
    } finally {
      setLoading(false);
    }
  }, [toast, filterSearch, filterInstructor, filterDay, filterStartDate, filterEndDate, filterTimeFrom, filterTimeTo, filterProgram, filterSubject, filterClass]);

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
      if (!formData.instructorUserId || formData.instructorUserId.trim() === '') {
        toast.error('Instructor is required');
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
        toast.success(editingAvailability ? 'Availability updated' : 'Availability created');
        resetForm();
        setGridKey(prev => prev + 1);
        loadAvailabilities();
      } else {
        toast.error(result.error || 'Failed to save availability');
      }
    } catch (error) {
      console.error('[InstructorAvailabilityListPage] Save error:', error);
      toast.error(error.message || 'Failed to save availability');
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
      const result = await deleteInstructorAvailability(availability.id, user);

      console.log('[InstructorAvailabilityListPage] Delete result:', result);

      if (result.success) {
        toast.success('Availability deleted');
        setGridKey(prev => prev + 1);
        loadAvailabilities();
      } else {
        toast.error(result.error || 'Failed to delete availability');
      }
    } catch (error) {
      console.error('[InstructorAvailabilityListPage] Delete error:', error);
      toast.error(error.message || 'Failed to delete availability');
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
          return instructor.displayName || `${instructor.firstName} ${instructor.lastName}`;
        }
      },
      {
        field: 'dayOfWeek',
        headerName: t('days_of_week') || 'Day(s)',
        width: 150,
        renderCell: (params) => {
          const days = params?.value;
          if (!days || !Array.isArray(days) || days.length === 0) return '—';
          return days.join(', ');
        }
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
        headerName: 'Program',
        flex: 1,
        minWidth: 150,
        renderCell: (params) => {
          const program = params?.row?.program;
          if (!program) return '—';
          return program.nameEn || '—';
        }
      },
      {
        field: 'subject',
        headerName: 'Subject',
        flex: 1,
        minWidth: 150,
        renderCell: (params) => {
          const subject = params?.row?.subject;
          if (!subject) return '—';
          return subject.nameEn || '—';
        }
      },
      {
        field: 'class',
        headerName: 'Class',
        flex: 1,
        minWidth: 150,
        renderCell: (params) => {
          const cls = params?.row?.class;
          if (!cls) return '—';
          return cls.nameEn || '—';
        }
      }
    ];

    // Add audit columns
    columns.push(
      {
        field: 'creator',
        headerName: t('created_by') || 'Created By',
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
        headerName: t('created_at') || 'Created At',
        flex: 0.8,
        minWidth: 120,
        renderCell: (params) => {
          const value = params?.value;
          return formatDate(value);
        }
      },
      {
        field: 'updater',
        headerName: t('updated_by') || 'Updated By',
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
        headerName: t('updated_at') || 'Updated At',
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
  }, [formatDate, handleEditAvailability, deleteEntity, saving, t]);

  // Backend handles filtering
  const filteredAvailabilities = availabilities;

  const handleExport = useCallback(() => {
    const result = exportToCSV(filteredAvailabilities, gridColumns, 'instructor-availability.csv');
    if (result.success) {
      toast.success('Instructor availability exported successfully');
    } else {
      toast.error(result.error || 'Failed to export instructor availability');
    }
  }, [filteredAvailabilities, gridColumns, toast]);

  const hasPermission = isAdmin || isHR || isSuperAdmin;

  if (!hasPermission) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.125rem', fontWeight: '500', color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}>
          Access Denied
        </div>
        <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginTop: '0.5rem' }}>
          You need admin or HR privileges to manage instructor availability.
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
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Program</label>
            <Select
              value={formData.programId}
              onChange={(e) => handleInputChange('programId', e.target.value)}
              options={[{ value: '', label: 'None' }, ...(programs || []).map(p => ({ value: p.id.toString(), label: p.nameEn || p.name }))]}
              disabled={saving}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Subject</label>
            <Select
              value={formData.subjectId}
              onChange={(e) => handleInputChange('subjectId', e.target.value)}
              options={[{ value: '', label: 'None' }, ...(subjects || []).map(s => ({ value: s.id.toString(), label: s.nameEn || s.name }))]}
              disabled={saving}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Class</label>
            <Select
              value={formData.classId}
              onChange={(e) => handleInputChange('classId', e.target.value)}
              options={[{ value: '', label: 'None' }, ...(classes || []).map(c => ({ value: c.id.toString(), label: c.nameEn || c.name }))]}
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

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'flex-end' }}>
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
            options={[{ value: '', label: t('all_days') || 'All Days' }, ...['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => ({ value: d, label: d }))]}
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
            options={[{ value: '', label: 'All Programs' }, ...(programs || []).map(p => ({ value: p.id.toString(), label: p.nameEn || p.name }))]}
            placeholder="Program"
          />
        </div>
        <div style={{ flex: '1 1 150px' }}>
          <Select
            value={filterSubject}
            onChange={e => setFilterSubject(e.target.value)}
            options={[{ value: '', label: 'All Subjects' }, ...(subjects || []).map(s => ({ value: s.id.toString(), label: s.nameEn || s.name }))]}
            placeholder="Subject"
          />
        </div>
        <div style={{ flex: '1 1 150px' }}>
          <Select
            value={filterClass}
            onChange={e => setFilterClass(e.target.value)}
            options={[{ value: '', label: 'All Classes' }, ...(classes || []).map(c => ({ value: c.id.toString(), label: c.nameEn || c.name }))]}
            placeholder="Class"
          />
        </div>
        {(filterSearch || filterInstructor || filterDay || filterStartDate || filterEndDate || filterTimeFrom || filterTimeTo || filterProgram || filterSubject || filterClass) && (
          <button onClick={() => { setFilterSearch(''); setFilterInstructor(''); setFilterDay(''); setFilterStartDate(''); setFilterEndDate(''); setFilterTimeFrom(''); setFilterTimeTo(''); setFilterProgram(''); setFilterSubject(''); setFilterClass(''); }}
            style={{ border: `1px solid ${theme === 'dark' ? '#374151' : '#d1d5db'}`, backgroundColor: 'transparent', cursor: 'pointer', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
          >✕ Clear</button>
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
          Instructor Availability ({filteredAvailabilities.length}{filteredAvailabilities.length !== availabilities.length ? ` of ${availabilities.length}` : ''})
        </h3>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={filteredAvailabilities.length === 0}>
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
