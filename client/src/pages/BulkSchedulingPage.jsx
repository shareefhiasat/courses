import React, { useState, useCallback, useMemo } from 'react';
import { info, error, warn, debug } from '@logger';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { Button, SimpleLoading, useToast, Card, CardBody, Input, Select } from '@ui';
import { useConflictCheck } from '@hooks/useConflictCheck.js';
import * as classroomService from '@services/business/classroomService';
import * as timeSlotService from '@services/business/timeSlotService';
import * as scheduleSessionService from '@services/business/scheduleSessionService';

const BulkSchedulingPage = () => {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const { t, lang, isRTL } = useLang();
  const { theme } = useTheme();
  const toast = useToast();
  
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [instructorUserId, setInstructorUserId] = useState('');
  const [classroomId, setClassroomId] = useState('');
  const [timeSlotId, setTimeSlotId] = useState('');
  
  // Recurrence settings
  const [recurrenceType, setRecurrenceType] = useState('weekly');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [selectedDays, setSelectedDays] = useState(['Sun', 'Mon', 'Tue', 'Wed', 'Thu']);
  const [interval, setInterval] = useState(1);
  
  const [classrooms, setClassrooms] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [previewSessions, setPreviewSessions] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const { checkConflicts, checkBulkConflicts } = useConflictCheck();
  
  // Load classrooms
  const loadClassrooms = useCallback(async () => {
    setLoading(true);
    try {
      const result = await classroomService.getAllClassrooms();
      if (result.success) {
        setClassrooms(result.data);
      }
    } catch (error) {
      error('Failed to load classrooms:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Load time slots
  const loadTimeSlots = useCallback(async () => {
    setLoading(true);
    try {
      const result = await timeSlotService.getSchedulableTimeSlots({});
      if (result.success) {
        setTimeSlots(result.data);
      }
    } catch (error) {
      error('Failed to load time slots:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Generate preview sessions based on recurrence rule
  const generatePreview = useCallback(async () => {
    if (!classId || !subjectId || !instructorUserId || !timeSlotId || !startDate || !endDate) {
      toast.error(t('please_fill_required_fields') || 'Please fill all required fields');
      return;
    }
    
    setGenerating(true);
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const sessions = [];
      const dayMap = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };
      
      let currentDate = new Date(start);
      
      while (currentDate <= end) {
        const dayOfWeek = currentDate.getDay();
        const dayName = Object.keys(dayMap).find(key => dayMap[key] === dayOfWeek);
        
        // Check if this day should be included based on recurrence
        let includeDay = false;
        
        switch (recurrenceType) {
          case 'daily':
            includeDay = true;
            break;
          case 'weekly':
            includeDay = selectedDays.includes(dayName);
            break;
          case 'biweekly':
            const weekNumber = Math.floor((currentDate - start) / (7 * 24 * 60 * 60 * 1000));
            includeDay = selectedDays.includes(dayName) && weekNumber % interval === 0;
            break;
          case 'monthly':
            const monthNumber = Math.floor((currentDate.getMonth() - start.getMonth()) + (currentDate.getFullYear() - start.getFullYear()) * 12);
            includeDay = selectedDays.includes(dayName) && monthNumber % interval === 0;
            break;
          default:
            includeDay = selectedDays.includes(dayName);
        }
        
        if (includeDay) {
          sessions.push({
            classId: parseInt(classId),
            subjectId: parseInt(subjectId),
            instructorUserId,
            timeSlotId: parseInt(timeSlotId),
            classroomId: classroomId ? parseInt(classroomId) : null,
            date: currentDate.toISOString().split('T')[0]
          });
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      setPreviewSessions(sessions);
      setShowPreview(true);
      toast.success(t('generated_preview') || `Generated ${sessions.length} sessions preview`);
    } catch (error) {
      toast.error(error.message || t('failed_to_generate_preview') || 'Failed to generate preview');
    } finally {
      setGenerating(false);
    }
  }, [classId, subjectId, instructorUserId, timeSlotId, classroomId, startDate, endDate, recurrenceType, selectedDays, interval, toast, t]);
  
  // Check conflicts for preview sessions
  const checkPreviewConflicts = useCallback(async () => {
    if (previewSessions.length === 0) {
      toast.warning(t('no_sessions_to_check') || 'No sessions to check');
      return;
    }
    
    setGenerating(true);
    try {
      const result = await checkBulkConflicts(previewSessions);
      
      if (result.hasConflicts) {
        toast.error(t('conflicts_detected_count') || `Detected ${result.conflicts.length} conflicts`);
      } else {
        toast.success(t('no_conflicts_detected') || 'No conflicts detected');
      }
    } catch (error) {
      toast.error(error.message || t('failed_to_check_conflicts') || 'Failed to check conflicts');
    } finally {
      setGenerating(false);
    }
  }, [previewSessions, checkBulkConflicts, toast, t]);
  
  // Bulk create sessions
  const handleBulkCreate = useCallback(async () => {
    if (previewSessions.length === 0) {
      toast.warning(t('no_sessions_to_create') || 'No sessions to create');
      return;
    }
    
    // Check conflicts first
    const conflictResult = await checkBulkConflicts(previewSessions);
    
    if (conflictResult.hasConflicts) {
      toast.error(t('resolve_conflicts_first') || 'Please resolve conflicts before creating sessions');
      return;
    }
    
    setSaving(true);
    try {
      const result = await scheduleSessionService.bulkCreateScheduleSessions(previewSessions, user);
      
      if (result.success) {
        toast.success(t('sessions_created_successfully') || `Created ${result.count || previewSessions.length} sessions successfully`);
        // Reset form
        setClassId('');
        setSubjectId('');
        setInstructorUserId('');
        setClassroomId('');
        setTimeSlotId('');
        setPreviewSessions([]);
        setShowPreview(false);
      } else {
        toast.error(result.error || t('failed_to_create_sessions') || 'Failed to create sessions');
      }
    } catch (error) {
      toast.error(error.message || t('failed_to_create_sessions') || 'Failed to create sessions');
    } finally {
      setSaving(false);
    }
  }, [previewSessions, checkBulkConflicts, user, toast, t]);
  
  // Toggle day selection
  const toggleDay = useCallback((day) => {
    setSelectedDays(prev => {
      if (prev.includes(day)) {
        return prev.filter(d => d !== day);
      } else {
        return [...prev, day];
      }
    });
  }, []);
  
  // Classroom options
  const classroomOptions = useMemo(() => {
    return classrooms.map(c => ({
      value: c.id.toString(),
      label: isRTL ? `${c.nameAr || c.nameEn} (${c.code})` : `${c.nameEn} (${c.code})`
    }));
  }, [classrooms, isRTL]);
  
  // Time slot options
  const timeSlotOptions = useMemo(() => {
    return timeSlots.map(ts => ({
      value: ts.id.toString(),
      label: isRTL ? `${ts.labelAr || ts.labelEn} (${ts.startTime} - ${ts.endTime})` : `${ts.labelEn} (${ts.startTime} - ${ts.endTime})`
    }));
  }, [timeSlots, isRTL]);
  
  // Recurrence type options
  const recurrenceOptions = [
    { value: 'daily', label: t('daily') || 'Daily' },
    { value: 'weekly', label: t('weekly') || 'Weekly' },
    { value: 'biweekly', label: t('biweekly') || 'Bi-Weekly' },
    { value: 'monthly', label: t('monthly') || 'Monthly' }
  ];
  
  // Day options
  const dayOptions = [
    { value: 'Sun', label: t('sunday') || 'Sunday' },
    { value: 'Mon', label: t('monday') || 'Monday' },
    { value: 'Tue', label: t('tuesday') || 'Tuesday' },
    { value: 'Wed', label: t('wednesday') || 'Wednesday' },
    { value: 'Thu', label: t('thursday') || 'Thursday' },
    { value: 'Fri', label: t('friday') || 'Friday' },
    { value: 'Sat', label: t('saturday') || 'Saturday' }
  ];
  
  // Check permissions
  const hasPermission = isAdmin || isSuperAdmin;
  
  if (!hasPermission) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.125rem', fontWeight: '500', color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}>
          {t('access_denied') || 'Access Denied'}
        </div>
        <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginTop: '0.5rem' }}>
          {t('bulk_scheduling_permission_required') || 'You need admin privileges to bulk schedule sessions.'}
        </div>
      </div>
    );
  }
  
  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
          {t('bulk_scheduling') || 'Bulk Scheduling'}
        </h1>
        <p style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
          {t('bulk_scheduling_description') || 'Generate multiple schedule sessions using recurrence rules'}
        </p>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Configuration Form */}
        <Card>
          <CardBody>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '1rem' }}>
              {t('configuration') || 'Configuration'}
            </h3>
            
            <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Input
                label={t('class_id') || 'Class ID'}
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                required
              />
              
              <Input
                label={t('subject_id') || 'Subject ID'}
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                required
              />
              
              <Input
                label={t('instructor_user_id') || 'Instructor User ID'}
                value={instructorUserId}
                onChange={(e) => setInstructorUserId(e.target.value)}
                required
              />
              
              <Select
                label={t('classroom') || 'Classroom'}
                value={classroomId}
                onChange={(e) => setClassroomId(e.target.value)}
                options={classroomOptions}
                placeholder={t('select_classroom') || 'Select classroom'}
              />
              
              <Select
                label={t('time_slot') || 'Time Slot'}
                value={timeSlotId}
                onChange={(e) => setTimeSlotId(e.target.value)}
                options={timeSlotOptions}
                placeholder={t('select_time_slot') || 'Select time slot'}
                required
              />
              
              <div style={{ borderTop: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`, paddingTop: '1rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                  {t('recurrence_settings') || 'Recurrence Settings'}
                </h4>
                
                <Select
                  label={t('recurrence_type') || 'Recurrence Type'}
                  value={recurrenceType}
                  onChange={(e) => setRecurrenceType(e.target.value)}
                  options={recurrenceOptions}
                />
                
                <Input
                  label={t('start_date') || 'Start Date'}
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
                
                <Input
                  label={t('end_date') || 'End Date'}
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
                
                {recurrenceType !== 'daily' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      {t('selected_days') || 'Selected Days'}
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {dayOptions.map(day => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleDay(day.value)}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: selectedDays.includes(day.value)
                              ? (theme === 'dark' ? '#3b82f6' : '#2563eb')
                              : (theme === 'dark' ? '#374151' : '#f3f4f6'),
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                            color: selectedDays.includes(day.value) ? '#ffffff' : (theme === 'dark' ? '#f3f4f6' : '#1f2937'),
                            fontSize: '0.875rem'
                          }}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {(recurrenceType === 'biweekly' || recurrenceType === 'monthly') && (
                  <Input
                    label={t('interval') || 'Interval'}
                    type="number"
                    value={interval}
                    onChange={(e) => setInterval(parseInt(e.target.value))}
                    min="1"
                    required
                  />
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <Button
                  type="button"
                  onClick={generatePreview}
                  disabled={generating}
                >
                  {generating ? t('generating') || 'Generating...' : t('generate_preview') || 'Generate Preview'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
        
        {/* Preview */}
        <Card>
          <CardBody>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '1rem' }}>
              {t('preview') || 'Preview'} ({previewSessions.length} {t('sessions') || 'sessions'})
            </h3>
            
            {showPreview ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{
                  maxHeight: '300px',
                  overflowY: 'auto',
                  border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '0.375rem'
                }}>
                  {previewSessions.map((session, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '0.5rem',
                        borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                        fontSize: '0.875rem',
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span>{session.date}</span>
                      <span style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                        {t('session') || 'Session'} {index + 1}
                      </span>
                    </div>
                  ))}
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button
                    variant="outline"
                    onClick={checkPreviewConflicts}
                    disabled={generating}
                  >
                    {generating ? t('checking') || 'Checking...' : t('check_conflicts') || 'Check Conflicts'}
                  </Button>
                  <Button
                    onClick={handleBulkCreate}
                    disabled={saving}
                  >
                    {saving ? t('creating') || 'Creating...' : t('create_all') || 'Create All'}
                  </Button>
                </div>
              </div>
            ) : (
              <div style={{
                padding: '2rem',
                textAlign: 'center',
                color: theme === 'dark' ? '#9ca3af' : '#6b7280'
              }}>
                {t('no_preview_yet') || 'No preview generated yet. Click "Generate Preview" to see the sessions.'}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default BulkSchedulingPage;
