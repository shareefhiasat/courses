import React, { useState, useCallback, useMemo } from 'react';
import { info, error, warn, debug } from '@logger';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { Button, SimpleLoading, useToast, Card, CardBody, Input, Select } from '@ui';
import { useScheduleCalendar } from '@hooks/useScheduleCalendar.js';
import { useConflictCheck } from '@hooks/useConflictCheck.js';
import * as classroomService from '@services/business/classroomService';
import * as timeSlotService from '@services/business/timeSlotService';
import * as scheduleSessionService from '@services/business/scheduleSessionService';

const ScheduleSessionEditorPage = ({ classId, subjectId, programId, onSave, onCancel }) => {
  const { user } = useAuth();
  const { t, lang, isRTL } = useLang();
  const { theme } = useTheme();
  const toast = useToast();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTimeSlotId, setSelectedTimeSlotId] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedClassroomId, setSelectedClassroomId] = useState('');
  const [notes, setNotes] = useState('');
  
  const [classrooms, setClassrooms] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [teachers, setTeachers] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const { checkConflicts, conflictResult, isChecking } = useConflictCheck();
  
  // Load classrooms
  const loadClassrooms = useCallback(async () => {
    setLoading(true);
    try {
      const result = await classroomService.getAllClassrooms({ programId });
      if (result.success) {
        setClassrooms(result.data);
      }
    } catch (error) {
      error('Failed to load classrooms:', error);
    } finally {
      setLoading(false);
    }
  }, [programId]);
  
  // Load time slots
  const loadTimeSlots = useCallback(async () => {
    setLoading(true);
    try {
      const result = await timeSlotService.getSchedulableTimeSlots({ programId });
      if (result.success) {
        setTimeSlots(result.data);
      }
    } catch (error) {
      error('Failed to load time slots:', error);
    } finally {
      setLoading(false);
    }
  }, [programId]);
  
  // Check conflicts when selection changes
  const handleCheckConflicts = useCallback(async () => {
    if (!selectedTeacherId || !selectedDate || !selectedTimeSlotId) {
      return;
    }
    
    await checkConflicts({
      instructorUserId: selectedTeacherId,
      date: selectedDate.toISOString().split('T')[0],
      timeSlotId: parseInt(selectedTimeSlotId),
      classroomId: selectedClassroomId ? parseInt(selectedClassroomId) : null,
      programId
    });
  }, [selectedTeacherId, selectedDate, selectedTimeSlotId, selectedClassroomId, programId, checkConflicts]);
  
  // Save schedule session
  const handleSave = useCallback(async () => {
    if (!classId || !subjectId || !selectedTeacherId || !selectedDate || !selectedTimeSlotId) {
      toast.error(t('please_fill_required_fields') || 'Please fill all required fields');
      return;
    }
    
    // Check for conflicts before saving
    await handleCheckConflicts();
    
    if (conflictResult && conflictResult.hasConflicts) {
      toast.error(t('scheduling_conflicts_detected') || 'Scheduling conflicts detected. Please resolve them before saving.');
      return;
    }
    
    setSaving(true);
    try {
      const sessionData = {
        classId,
        subjectId,
        instructorUserId: selectedTeacherId,
        timeSlotId: parseInt(selectedTimeSlotId),
        date: selectedDate.toISOString().split('T')[0],
        classroomId: selectedClassroomId ? parseInt(selectedClassroomId) : null,
        notes: notes || null
      };
      
      const result = await scheduleSessionService.createScheduleSession(sessionData, user);
      
      if (result.success) {
        toast.success(t('session_created_successfully') || 'Session created successfully');
        if (onSave) {
          onSave(result.data);
        }
      } else {
        toast.error(result.error || t('failed_to_create_session') || 'Failed to create session');
      }
    } catch (error) {
      toast.error(error.message || t('failed_to_create_session') || 'Failed to create session');
    } finally {
      setSaving(false);
    }
  }, [classId, subjectId, selectedTeacherId, selectedDate, selectedTimeSlotId, selectedClassroomId, notes, user, handleCheckConflicts, conflictResult, toast, t, onSave]);
  
  // Load data on mount
  React.useEffect(() => {
    loadClassrooms();
    loadTimeSlots();
  }, [loadClassrooms, loadTimeSlots]);
  
  // Classroom options
  const classroomOptions = useMemo(() => {
    return classrooms.map(c => ({
      value: c.id.toString(),
      label: isRTL ? `${c.nameAr || c.nameEn} (${c.code})` : `${c.nameEn} (${c.code})`,
      capacity: c.capacity,
      location: isRTL ? c.locationAr : c.locationEn
    }));
  }, [classrooms, isRTL]);
  
  // Time slot options
  const timeSlotOptions = useMemo(() => {
    return timeSlots.map(ts => ({
      value: ts.id.toString(),
      label: isRTL ? `${ts.labelAr || ts.labelEn} (${ts.startTime} - ${ts.endTime})` : `${ts.labelEn} (${ts.startTime} - ${ts.endTime})`,
      startTime: ts.startTime,
      endTime: ts.endTime,
      duration: ts.durationMinutes
    }));
  }, [timeSlots, isRTL]);
  
  // Teacher options (would come from user service in real implementation)
  const teacherOptions = useMemo(() => {
    // This is a placeholder - in real implementation, load from user service
    return [
      { value: '1', label: 'Teacher 1' },
      { value: '2', label: 'Teacher 2' },
      { value: '3', label: 'Teacher 3' }
    ];
  }, []);
  
  const selectedTimeSlot = timeSlots.find(ts => ts.id === parseInt(selectedTimeSlotId));
  const selectedClassroom = classrooms.find(c => c.id === parseInt(selectedClassroomId));
  
  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
          {t('schedule_session') || 'Schedule Session'}
        </h2>
        <p style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
          {t('schedule_session_description') || 'Create a new schedule session for this class'}
        </p>
      </div>
      
      {loading ? (
        <SimpleLoading />
      ) : (
        <Card>
          <CardBody>
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Date Selection */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  {t('date') || 'Date'} *
                </label>
                <Input
                  type="date"
                  value={selectedDate.toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  required
                />
              </div>
              
              {/* Time Slot Selection */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  {t('time_slot') || 'Time Slot'} *
                </label>
                <Select
                  value={selectedTimeSlotId}
                  onChange={(e) => setSelectedTimeSlotId(e.target.value)}
                  options={timeSlotOptions}
                  placeholder={t('select_time_slot') || 'Select time slot'}
                  required
                />
                {selectedTimeSlot && (
                  <div style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                    {t('duration') || 'Duration'}: {selectedTimeSlot.durationMinutes} {t('minutes') || 'minutes'}
                  </div>
                )}
              </div>
              
              {/* Teacher Selection */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  {t('teacher') || 'Teacher'} *
                </label>
                <Select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  options={teacherOptions}
                  placeholder={t('select_teacher') || 'Select teacher'}
                  required
                />
              </div>
              
              {/* Classroom Selection */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  {t('classroom') || 'Classroom'}
                </label>
                <Select
                  value={selectedClassroomId}
                  onChange={(e) => setSelectedClassroomId(e.target.value)}
                  options={classroomOptions}
                  placeholder={t('select_classroom') || 'Select classroom'}
                />
                {selectedClassroom && (
                  <div style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                    {t('capacity') || 'Capacity'}: {selectedClassroom.capacity} | {t('location') || 'Location'}: {isRTL ? selectedClassroom.locationAr : selectedClassroom.locationEn}
                  </div>
                )}
              </div>
              
              {/* Notes */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  {t('notes') || 'Notes'}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '0.5rem',
                    border: `1px solid ${theme === 'dark' ? '#374151' : '#d1d5db'}`,
                    borderRadius: '0.25rem',
                    backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                    color: theme === 'dark' ? '#f3f4f6' : '#1f2937'
                  }}
                  placeholder={t('optional_notes') || 'Optional notes'}
                />
              </div>
              
              {/* Conflict Check Button */}
              <Button
                type="button"
                variant="outline"
                onClick={handleCheckConflicts}
                disabled={isChecking || !selectedTeacherId || !selectedDate || !selectedTimeSlotId}
              >
                {isChecking ? t('checking') || 'Checking...' : t('check_conflicts') || 'Check Conflicts'}
              </Button>
              
              {/* Conflict Results */}
              {conflictResult && conflictResult.hasConflicts && (
                <div style={{
                  padding: '1rem',
                  backgroundColor: theme === 'dark' ? '#7f1d1d' : '#fef2f2',
                  border: `1px solid ${theme === 'dark' ? '#991b1b' : '#fecaca'}`,
                  borderRadius: '0.375rem'
                }}>
                  <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: theme === 'dark' ? '#fca5a5' : '#dc2626' }}>
                    {t('conflicts_detected') || 'Conflicts Detected'}
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.5rem', color: theme === 'dark' ? '#fca5a5' : '#dc2626' }}>
                    {conflictResult.conflicts.map((conflict, index) => (
                      <li key={index}>
                        {conflict.type}: {conflict.message || t('conflict_occurred') || 'A conflict occurred'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onCancel}
                  disabled={saving}
                >
                  {t('cancel') || 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  disabled={saving || (conflictResult && conflictResult.hasConflicts)}
                >
                  {saving ? t('saving') || 'Saving...' : t('save') || 'Save'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default ScheduleSessionEditorPage;
