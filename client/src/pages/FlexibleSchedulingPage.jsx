import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { Button, SimpleLoading, useToast, Select } from '@ui';
import classroomAvailabilityService from '@services/business/classroomAvailabilityBusinessService.js';
import instructorAvailabilityService from '@services/business/instructorAvailabilityService.js';
import { getAllClassrooms } from '@services/business/classroomService.js';
import { getAllUsers } from '@services/business/userService.js';

const FlexibleSchedulingPage = () => {
  const { user, isAdmin, isHR, isSuperAdmin } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [classroomAvailabilities, setClassroomAvailabilities] = useState([]);
  const [instructorAvailabilities, setInstructorAvailabilities] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [instructors, setInstructors] = useState([]);
  
  // Filters
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [selectedInstructor, setSelectedInstructor] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState('week'); // week, day

  const hasPermission = isAdmin || isHR || isSuperAdmin;

  // Load all data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [classroomAvailResult, instructorAvailResult, classroomsResult, instructorsResult] = await Promise.all([
        classroomAvailabilityService.getAllClassroomAvailabilities(),
        instructorAvailabilityService.getAllInstructorAvailabilities(),
        getAllClassrooms(),
        getAllUsers({ limit: 1000 })
      ]);

      if (classroomAvailResult.success) {
        setClassroomAvailabilities(classroomAvailResult.data || []);
      }
      if (instructorAvailResult.success) {
        setInstructorAvailabilities(instructorAvailResult.data || []);
      }
      if (classroomsResult.success) {
        setClassrooms(classroomsResult.data || []);
      }
      if (instructorsResult.success) {
        setInstructors(instructorsResult.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load scheduling data');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculate week dates from selected date
  const weekDates = useMemo(() => {
    const date = new Date(selectedDate);
    const dayOfWeek = date.getDay();
    const sunday = new Date(date);
    sunday.setDate(date.getDate() - dayOfWeek);
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, [selectedDate]);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Find matching availabilities for a specific date and day
  const getAvailabilitiesForDate = useCallback((date, type) => {
    const dayName = dayNames[date.getDay()];
    const availabilities = type === 'classroom' ? classroomAvailabilities : instructorAvailabilities;
    
    return availabilities.filter(avail => {
      // Check if date is within range
      const startDate = new Date(avail.startDate);
      const endDate = new Date(avail.endDate);
      const checkDate = new Date(date);
      
      if (checkDate < startDate || checkDate > endDate) return false;
      
      // Check if day matches
      if (!avail.dayOfWeek || !avail.dayOfWeek.includes(dayName)) return false;
      
      // Apply filters
      if (type === 'classroom' && selectedClassroom && avail.classroomId !== parseInt(selectedClassroom)) {
        return false;
      }
      if (type === 'instructor' && selectedInstructor && avail.instructorUserId !== parseInt(selectedInstructor)) {
        return false;
      }
      
      return true;
    });
  }, [classroomAvailabilities, instructorAvailabilities, selectedClassroom, selectedInstructor, dayNames]);

  // Find overlapping slots between classroom and instructor
  const findMatchingSlots = useCallback((date) => {
    const classroomAvails = getAvailabilitiesForDate(date, 'classroom');
    const instructorAvails = getAvailabilitiesForDate(date, 'instructor');
    
    const matches = [];
    
    classroomAvails.forEach(classroomAvail => {
      instructorAvails.forEach(instructorAvail => {
        // Find overlapping slots
        classroomAvail.slots?.forEach(classroomSlot => {
          instructorAvail.slots?.forEach(instructorSlot => {
            // Check if slots overlap
            if (isTimeOverlap(classroomSlot.startTime, classroomSlot.endTime, 
                              instructorSlot.startTime, instructorSlot.endTime)) {
              matches.push({
                classroom: classroomAvail.classroom,
                instructor: instructorAvail.instructor,
                classroomSlot,
                instructorSlot,
                overlapStart: getMaxTime(classroomSlot.startTime, instructorSlot.startTime),
                overlapEnd: getMinTime(classroomSlot.endTime, instructorSlot.endTime)
              });
            }
          });
        });
      });
    });
    
    return matches;
  }, [getAvailabilitiesForDate]);

  // Helper: Check if two time ranges overlap
  const isTimeOverlap = (start1, end1, start2, end2) => {
    const start1Min = timeToMinutes(start1);
    const end1Min = timeToMinutes(end1);
    const start2Min = timeToMinutes(start2);
    const end2Min = timeToMinutes(end2);
    
    return (start1Min < end2Min) && (end1Min > start2Min);
  };

  const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const getMaxTime = (time1, time2) => {
    return timeToMinutes(time1) > timeToMinutes(time2) ? time1 : time2;
  };

  const getMinTime = (time1, time2) => {
    return timeToMinutes(time1) < timeToMinutes(time2) ? time1 : time2;
  };

  if (!hasPermission) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.125rem', fontWeight: '500', color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}>
          Access Denied
        </div>
        <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginTop: '0.5rem' }}>
          You need admin or HR privileges to access flexible scheduling.
        </div>
      </div>
    );
  }

  if (loading) {
    return <SimpleLoading message="Loading scheduling data..." />;
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
          Flexible Scheduling Calendar
        </h1>
        <p style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280', fontSize: '0.875rem' }}>
          View and manage instructor and classroom availability intersections
        </p>
      </div>

      {/* Filters */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
        padding: '1rem',
        backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb',
        borderRadius: '0.5rem'
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.875rem' }}>
            Classroom
          </label>
          <Select
            value={selectedClassroom}
            onChange={(e) => setSelectedClassroom(e.target.value)}
            options={[
              { value: '', label: 'All Classrooms' },
              ...classrooms.map(c => ({ 
                value: c.id.toString(), 
                label: `${c.code} - ${c.nameEn}` 
              }))
            ]}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.875rem' }}>
            Instructor
          </label>
          <Select
            value={selectedInstructor}
            onChange={(e) => setSelectedInstructor(e.target.value)}
            options={[
              { value: '', label: 'All Instructors' },
              ...instructors.map(u => ({ 
                value: u.id.toString(), 
                label: u.displayName || `${u.firstName} ${u.lastName}` 
              }))
            ]}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.875rem' }}>
            Week Starting
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '0.375rem',
              border: `1px solid ${theme === 'dark' ? '#374151' : '#d1d5db'}`,
              backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
              color: theme === 'dark' ? '#f3f4f6' : '#1f2937'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <Button onClick={loadData} style={{ width: '100%' }}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div style={{
        overflowX: 'auto',
        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
        borderRadius: '0.5rem',
        border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: theme === 'dark' ? '#111827' : '#f9fafb' }}>
              <th style={{ 
                padding: '0.75rem', 
                textAlign: 'left', 
                fontWeight: '600',
                borderBottom: `2px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`
              }}>
                Day
              </th>
              {weekDates.map((date, idx) => (
                <th key={idx} style={{ 
                  padding: '0.75rem', 
                  textAlign: 'center',
                  fontWeight: '600',
                  borderBottom: `2px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                  minWidth: '150px'
                }}>
                  <div>{dayNames[date.getDay()]}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '400', marginTop: '0.25rem' }}>
                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ 
                padding: '0.75rem', 
                fontWeight: '500',
                verticalAlign: 'top',
                borderRight: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`
              }}>
                Available Slots
              </td>
              {weekDates.map((date, idx) => {
                const matches = findMatchingSlots(date);
                return (
                  <td key={idx} style={{ 
                    padding: '0.5rem',
                    verticalAlign: 'top',
                    borderRight: idx < 6 ? `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}` : 'none'
                  }}>
                    {matches.length === 0 ? (
                      <div style={{ 
                        textAlign: 'center', 
                        color: theme === 'dark' ? '#6b7280' : '#9ca3af',
                        fontSize: '0.875rem',
                        padding: '1rem'
                      }}>
                        No matches
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {matches.map((match, matchIdx) => (
                          <div
                            key={matchIdx}
                            style={{
                              padding: '0.5rem',
                              backgroundColor: theme === 'dark' ? '#065f46' : '#d1fae5',
                              borderRadius: '0.375rem',
                              fontSize: '0.75rem',
                              border: `1px solid ${theme === 'dark' ? '#047857' : '#10b981'}`
                            }}
                          >
                            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                              {match.overlapStart} - {match.overlapEnd}
                            </div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.9 }}>
                              {match.classroom?.code || 'Classroom'}
                            </div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.9 }}>
                              {match.instructor?.displayName || 
                               `${match.instructor?.firstName} ${match.instructor?.lastName}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Summary Stats */}
      <div style={{
        marginTop: '1.5rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem'
      }}>
        <div style={{
          padding: '1rem',
          backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb',
          borderRadius: '0.5rem',
          border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`
        }}>
          <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
            Classroom Availabilities
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '600', marginTop: '0.25rem' }}>
            {classroomAvailabilities.length}
          </div>
        </div>

        <div style={{
          padding: '1rem',
          backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb',
          borderRadius: '0.5rem',
          border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`
        }}>
          <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
            Instructor Availabilities
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '600', marginTop: '0.25rem' }}>
            {instructorAvailabilities.length}
          </div>
        </div>

        <div style={{
          padding: '1rem',
          backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb',
          borderRadius: '0.5rem',
          border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`
        }}>
          <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
            Total Matches This Week
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '600', marginTop: '0.25rem' }}>
            {weekDates.reduce((sum, date) => sum + findMatchingSlots(date).length, 0)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlexibleSchedulingPage;
