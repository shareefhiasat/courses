import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { Button, SimpleLoading, useToast, Card, CardBody, Select, Modal, Input } from '@ui';
import flexibleSchedulingService from '@services/business/flexibleSchedulingService.js';
import { getAllPrograms, getSubjects } from '@services/business/programService.js';
import { getAllClassrooms } from '@services/business/classroomService.js';
import { getAllTimeSlots } from '@services/business/timeSlotService.js';
import { getUsersByRole } from '@services/business/userService.js';

const FlexibleScheduleCalendarPage = () => {
  const { user, isAdmin, isHR, isSuperAdmin } = useAuth();
  const { t, lang, isRTL } = useLang();
  const { theme } = useTheme();
  const toast = useToast();
  
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedInstructor, setSelectedInstructor] = useState('');
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // month, week, day
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    programId: '',
    subjectId: '',
    instructorUserId: '',
    classroomId: '',
    timeSlotId: '',
    date: '',
    notes: '',
  });
  
  // Reference data
  const [programs, setPrograms] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  // Load sessions
  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {};
      if (selectedProgram) filters.programId = selectedProgram;
      if (selectedInstructor) filters.instructorUserId = selectedInstructor;
      if (selectedClassroom) filters.classroomId = selectedClassroom;
      
      const result = await flexibleSchedulingService.getFlexibleScheduleSessions(filters);
      
      if (result.success) {
        setSessions(result.data);
      } else {
        setError(result.error);
        toast.error(result.error || t('failed_to_load_sessions') || 'Failed to load sessions');
      }
    } catch (error) {
      setError(error.message);
      toast.error(error.message || t('failed_to_load_sessions') || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, [selectedProgram, selectedInstructor, selectedClassroom, toast, t]);
  
  // Load reference data
  const loadReferenceData = useCallback(async () => {
    try {
      // Load programs
      const programsResult = await getAllPrograms();
      if (programsResult.success) {
        setPrograms(programsResult.data);
      }
      
      // Load instructors
      const instructorsResult = await getUsersByRole('instructor');
      if (instructorsResult.success) {
        setInstructors(instructorsResult.data);
      }
      
      // Load classrooms
      const classroomsResult = await getAllClassrooms();
      if (classroomsResult.success) {
        setClassrooms(classroomsResult.data);
      }
      
      // Load time slots
      const timeSlotsResult = await getAllTimeSlots();
      if (timeSlotsResult.success) {
        setTimeSlots(timeSlotsResult.data);
      }
      
      // Load subjects
      const subjectsResult = await getSubjects();
      if (subjectsResult.success) {
        setSubjects(subjectsResult.data);
      }
    } catch (error) {
      console.error('Error loading reference data:', error);
    }
  }, []);
  
  // Load data on mount
  useEffect(() => {
    loadReferenceData();
    loadSessions();
  }, [loadReferenceData, loadSessions]);
  
  // Reload sessions when filters change
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);
  
  // Handle session click
  const handleSessionClick = (session) => {
    setEditingSession(session);
    setFormData({
      programId: session.programId.toString(),
      subjectId: session.subjectId?.toString() || '',
      instructorUserId: session.instructorUserId.toString(),
      classroomId: session.classroomId?.toString() || '',
      timeSlotId: session.timeSlotId.toString(),
      date: session.date.split('T')[0],
      notes: session.notes || '',
    });
    setShowSessionDialog(true);
  };
  
  // Handle new session
  const handleNewSession = () => {
    setEditingSession(null);
    setFormData({
      programId: selectedProgram || '',
      subjectId: '',
      instructorUserId: '',
      classroomId: '',
      timeSlotId: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setShowSessionDialog(true);
  };
  
  // Save session
  const handleSaveSession = async () => {
    try {
      const payload = {
        programId: formData.programId ? parseInt(formData.programId) : null,
        subjectId: formData.subjectId ? parseInt(formData.subjectId) : null,
        instructorUserId: formData.instructorUserId ? parseInt(formData.instructorUserId) : null,
        classroomId: formData.classroomId ? parseInt(formData.classroomId) : null,
        timeSlotId: formData.timeSlotId ? parseInt(formData.timeSlotId) : null,
        date: formData.date,
        notes: formData.notes,
        createdBy: user.dbId,
      };
      
      let result;
      if (editingSession) {
        result = await flexibleSchedulingService.updateFlexibleScheduleSession(editingSession.id, { ...payload, updatedBy: user.dbId });
      } else {
        result = await flexibleSchedulingService.createFlexibleScheduleSession(payload);
      }
      
      if (result.success) {
        toast.success(editingSession ? t('session_updated') || 'Session updated' : t('session_created') || 'Session created');
        setShowSessionDialog(false);
        loadSessions();
      } else {
        toast.error(result.error || t('failed_to_save_session') || 'Failed to save session');
      }
    } catch (error) {
      toast.error(error.message || t('failed_to_save_session') || 'Failed to save session');
    }
  };
  
  // Delete session
  const handleDeleteSession = async (sessionId) => {
    if (!confirm(t('confirm_delete_session') || 'Are you sure you want to delete this session?')) {
      return;
    }
    
    try {
      const result = await flexibleSchedulingService.deleteFlexibleScheduleSession(sessionId);
      
      if (result.success) {
        toast.success(t('session_deleted') || 'Session deleted');
        loadSessions();
      } else {
        toast.error(result.error || t('failed_to_delete_session') || 'Failed to delete session');
      }
    } catch (error) {
      toast.error(error.message || t('failed_to_delete_session') || 'Failed to delete session');
    }
  };
  
  // Filter sessions for current view
  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      const sessionDate = new Date(session.date);
      
      if (viewMode === 'month') {
        return sessionDate.getMonth() === currentDate.getMonth() && 
               sessionDate.getFullYear() === currentDate.getFullYear();
      } else if (viewMode === 'week') {
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return sessionDate >= weekStart && sessionDate <= weekEnd;
      } else {
        return sessionDate.toDateString() === currentDate.toDateString();
      }
    });
  }, [sessions, viewMode, currentDate]);
  
  // Group sessions by date
  const sessionsByDate = useMemo(() => {
    const grouped = {};
    filteredSessions.forEach(session => {
      const dateKey = session.date.split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(session);
    });
    return grouped;
  }, [filteredSessions]);
  
  // Get days for current view
  const viewDays = useMemo(() => {
    const days = [];
    
    if (viewMode === 'month') {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      // Add padding days from previous month
      const startDay = firstDay.getDay();
      for (let i = startDay - 1; i >= 0; i--) {
        const day = new Date(firstDay);
        day.setDate(day.getDate() - (i + 1));
        days.push({ date: day, isCurrentMonth: false });
      }
      
      // Add days of current month
      for (let i = 1; i <= lastDay.getDate(); i++) {
        days.push({ date: new Date(year, month, i), isCurrentMonth: true });
      }
      
      // Add padding days from next month
      const endDay = lastDay.getDay();
      for (let i = 1; i <= (6 - endDay); i++) {
        const day = new Date(lastDay);
        day.setDate(day.getDate() + i);
        days.push({ date: day, isCurrentMonth: false });
      }
    } else if (viewMode === 'week') {
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - currentDate.getDay());
      for (let i = 0; i < 7; i++) {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + i);
        days.push({ date: day, isCurrentMonth: true });
      }
    } else {
      days.push({ date: currentDate, isCurrentMonth: true });
    }
    
    return days;
  }, [viewMode, currentDate]);
  
  // Navigate dates
  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else {
      newDate.setDate(newDate.getDate() + direction);
    }
    
    setCurrentDate(newDate);
  };
  
  // Check permissions
  const hasPermission = isAdmin || isHR || isSuperAdmin;
  
  if (!hasPermission) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.125rem', fontWeight: '500', color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}>
          {t('access_denied') || 'Access Denied'}
        </div>
        <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginTop: '0.5rem' }}>
          {t('scheduling_permission_required') || 'You need admin or HR privileges to view scheduling.'}
        </div>
      </div>
    );
  }
  
  return (
    <div style={{ padding: '1rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            {t('flexible_schedule') || 'Flexible Schedule'}
          </h1>
          <p style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
            {t('manage_flexible_sessions') || 'Manage flexible training sessions'}
          </p>
        </div>
        
        <Button onClick={handleNewSession}>
          {t('new_session') || 'New Session'}
        </Button>
      </div>
      
      {/* Filters */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <CardBody>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>{t('program') || 'Program'}</label>
              <Select
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                options={[
                  { value: '', label: t('all_programs') || 'All Programs' },
                  ...programs.map(p => ({ value: p.id.toString(), label: isRTL ? p.nameAr || p.nameEn : p.nameEn }))
                ]}
              />
            </div>
            
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>{t('instructor') || 'Instructor'}</label>
              <Select
                value={selectedInstructor}
                onChange={(e) => setSelectedInstructor(e.target.value)}
                options={[
                  { value: '', label: t('all_instructors') || 'All Instructors' },
                  ...instructors.map(i => ({ value: i.id.toString(), label: i.displayName || i.firstName }))
                ]}
              />
            </div>
            
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>{t('classroom') || 'Classroom'}</label>
              <Select
                value={selectedClassroom}
                onChange={(e) => setSelectedClassroom(e.target.value)}
                options={[
                  { value: '', label: t('all_classrooms') || 'All Classrooms' },
                  ...classrooms.map(c => ({ value: c.id.toString(), label: isRTL ? c.nameAr || c.nameEn : c.nameEn }))
                ]}
              />
            </div>
            
            <div style={{ minWidth: '150px' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>{t('view') || 'View'}</label>
              <Select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                options={[
                  { value: 'month', label: t('month') || 'Month' },
                  { value: 'week', label: t('week') || 'Week' },
                  { value: 'day', label: t('day') || 'Day' },
                ]}
              />
            </div>
          </div>
        </CardBody>
      </Card>
      
      {loading ? (
        <SimpleLoading />
      ) : error ? (
        <div style={{ padding: '1rem', color: 'red' }}>
          {error}
        </div>
      ) : (
        <>
          {/* Calendar Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <Button variant="outline" onClick={() => navigateDate(-1)}>
              {t('previous') || 'Previous'}
            </Button>
            <div style={{ fontSize: '1.125rem', fontWeight: '500' }}>
              {currentDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
            </div>
            <Button variant="outline" onClick={() => navigateDate(1)}>
              {t('next') || 'Next'}
            </Button>
          </div>
          
          {/* Calendar Grid */}
          <Card>
            <CardBody>
              {viewMode === 'month' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', backgroundColor: theme === 'dark' ? '#374151' : '#e5e7eb' }}>
                  {/* Day headers */}
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} style={{ 
                      padding: '0.5rem', 
                      textAlign: 'center', 
                      backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb',
                      fontWeight: '500',
                      fontSize: '0.875rem'
                    }}>
                      {day}
                    </div>
                  ))}
                  
                  {/* Calendar days */}
                  {viewDays.map(({ date, isCurrentMonth }) => {
                    const dateKey = date.toISOString().split('T')[0];
                    const daySessions = sessionsByDate[dateKey] || [];
                    
                    return (
                      <div key={dateKey} style={{ 
                        minHeight: '120px', 
                        padding: '0.5rem', 
                        backgroundColor: isCurrentMonth ? (theme === 'dark' ? '#1f2937' : '#ffffff') : (theme === 'dark' ? '#111827' : '#f3f4f6'),
                        opacity: isCurrentMonth ? 1 : 0.5
                      }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                          {date.getDate()}
                        </div>
                        {daySessions.map(session => (
                          <div
                            key={session.id}
                            onClick={() => handleSessionClick(session)}
                            style={{
                              padding: '0.25rem',
                              marginBottom: '0.25rem',
                              backgroundColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {session.timeSlot?.startTime} {isRTL ? session.subject?.nameAr : session.subject?.nameEn} - {isRTL ? session.classroom?.nameAr : session.classroom?.nameEn}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
              
              {viewMode === 'week' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', backgroundColor: theme === 'dark' ? '#374151' : '#e5e7eb' }}>
                  {viewDays.map(({ date }) => {
                    const dateKey = date.toISOString().split('T')[0];
                    const daySessions = sessionsByDate[dateKey] || [];
                    
                    return (
                      <div key={dateKey} style={{ 
                        minHeight: '400px', 
                        padding: '0.5rem', 
                        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff'
                      }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                          {date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })}
                        </div>
                        {daySessions.map(session => (
                          <div
                            key={session.id}
                            onClick={() => handleSessionClick(session)}
                            style={{
                              padding: '0.5rem',
                              marginBottom: '0.5rem',
                              backgroundColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            <div style={{ fontWeight: '500', fontSize: '0.875rem' }}>
                              {session.timeSlot?.startTime} - {session.timeSlot?.endTime}
                            </div>
                            <div style={{ fontSize: '0.75rem' }}>
                              {isRTL ? session.subject?.nameAr : session.subject?.nameEn}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                              {isRTL ? session.classroom?.nameAr : session.classroom?.nameEn}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                              {session.instructor?.displayName}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
              
              {viewMode === 'day' && (
                <div>
                  <div style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '1rem' }}>
                    {currentDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  {filteredSessions.length > 0 ? (
                    filteredSessions.map(session => (
                      <Card key={session.id} style={{ marginBottom: '1rem' }}>
                        <CardBody>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontWeight: '500', fontSize: '1rem' }}>
                                {session.timeSlot?.startTime} - {session.timeSlot?.endTime}
                              </div>
                              <div style={{ fontSize: '0.875rem' }}>
                                {isRTL ? session.subject?.nameAr : session.subject?.nameEn}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                                {session.instructor?.displayName} | {session.classroom?.nameEn}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <Button variant="outline" size="sm" onClick={() => handleSessionClick(session)}>
                                {t('edit') || 'Edit'}
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleDeleteSession(session.id)}>
                                {t('delete') || 'Delete'}
                              </Button>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    ))
                  ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                      {t('no_sessions_this_day') || 'No sessions scheduled for this day'}
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        </>
      )}
      
      {/* Session Modal */}
      <Modal
        isOpen={showSessionDialog}
        onClose={() => setShowSessionDialog(false)}
        title={editingSession ? t('edit_session') || 'Edit Session' : t('new_session') || 'New Session'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>{t('program') || 'Program'}</label>
            <Select
                value={formData.programId}
                onChange={(e) => setFormData({ ...formData, programId: e.target.value })}
                options={programs.map(p => ({ value: p.id.toString(), label: isRTL ? p.nameAr || p.nameEn : p.nameEn }))}
              />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>{t('subject') || 'Subject'}</label>
            <Select
              value={formData.subjectId}
              onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
              options={subjects.filter(s => !formData.programId || s.programId === parseInt(formData.programId)).map(s => ({ value: s.id.toString(), label: isRTL ? s.nameAr || s.nameEn : s.nameEn }))}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>{t('instructor') || 'Instructor'}</label>
            <Select
              value={formData.instructorUserId}
              onChange={(e) => setFormData({ ...formData, instructorUserId: e.target.value })}
              options={instructors.map(i => ({ value: i.id.toString(), label: i.displayName || i.firstName }))}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>{t('classroom') || 'Classroom'}</label>
            <Select
              value={formData.classroomId}
              onChange={(e) => setFormData({ ...formData, classroomId: e.target.value })}
              options={classrooms.filter(c => !formData.programId || c.programId === parseInt(formData.programId)).map(c => ({ value: c.id.toString(), label: isRTL ? c.nameAr || c.nameEn : c.nameEn }))}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>{t('time_slot') || 'Time Slot'}</label>
            <Select
              value={formData.timeSlotId}
              onChange={(e) => setFormData({ ...formData, timeSlotId: e.target.value })}
              options={timeSlots.filter(ts => !formData.programId || ts.programId === parseInt(formData.programId)).map(ts => ({ value: ts.id.toString(), label: `${ts.startTime} - ${ts.endTime}` }))}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>{t('date') || 'Date'}</label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>{t('notes') || 'Notes'}</label>
            <Input
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder={t('optional_notes') || 'Optional notes'}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <Button variant="outline" onClick={() => setShowSessionDialog(false)}>
              {t('cancel') || 'Cancel'}
            </Button>
            <Button onClick={handleSaveSession}>
              {t('save') || 'Save'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FlexibleScheduleCalendarPage;
