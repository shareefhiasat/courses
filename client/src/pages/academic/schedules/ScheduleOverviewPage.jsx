import React, { useState, useEffect, useMemo, useCallback, useLayoutEffect } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import { Select, YearSelect, Button, Calendar } from '@ui';
import { GlobalLoadingFallback, useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { getSchedules } from '@services/business/scheduleService';
import { transformSchedulesToCalendarEvents } from '@services/business/scheduleService';
import { getPrograms, getSubjects } from '@services/business/programService';
import { getUsers } from '@services/business/userService';
import logger from '@utils/logger';
import './ScheduleOverviewPage.css';

const ScheduleOverviewPage = () => {
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const { user, isAdmin, isInstructor, loading: authLoading } = useAuth();
  const toast = useToast();
  const { startLoading } = useGlobalLoading();

  const [term, setTerm] = useState('');
  const [year, setYear] = useState('');
  const [classes, setClasses] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  
  const [programFilter, setProgramFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [instructorFilter, setInstructorFilter] = useState('all');

  // Auth loading check
  if (authLoading) {
    return <GlobalLoadingFallback />;
  }

  // Use GlobalLoading for initial data load
  useLayoutEffect(() => {
    if (authLoading) return;
    if (!user) return;

    let stopped = false;
    const stopGlobalLoading = startLoading();
    const safeStop = () => {
      if (stopped) return;
      stopped = true;
      stopGlobalLoading();
    };

    const loadData = async () => {
      try {
        await Promise.all([
          loadMetadata(),
          loadSchedules()
        ]);
      } catch (error) {
        console.error('Error loading schedule data:', error);
      } finally {
        safeStop();
      }
    };

    loadData();

    return () => {
      safeStop();
    };
  }, [authLoading, user, loadMetadata, loadSchedules, startLoading]);

  useEffect(() => {
    loadMetadata();
  }, []);

  const loadMetadata = async () => {
    try {
      const [programsRes, subjectsRes, usersRes] = await Promise.all([
        getPrograms(),
        getSubjects(),
        getUsers()
      ]);
      
      if (programsRes?.success) setPrograms(programsRes.data || []);
      if (subjectsRes?.success) setSubjects(subjectsRes.data || []);
      if (usersRes?.success) setUsers(usersRes.data || []);
    } catch (error) {
      logger.error('[ScheduleOverview] Error loading metadata:', error);
    }
  };

  const loadSchedules = useCallback(async () => {
    if (!term || !year) {
      toast?.error?.(t('term_year_required') || 'Please select both term and year');
      return;
    }

    setLoading(true);
    try {
      const result = await getSchedules(term, year);
      
      if (result.success) {
        setClasses(result.data || []);
        if (result.data.length === 0) {
          toast?.info?.(t('no_schedules_found') || 'No schedules found for this term and year');
        }
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      logger.error('[ScheduleOverview] Error loading schedules:', error);
      toast?.error?.((t('error_loading_schedules') || 'Error loading schedules: ') + error.message);
    } finally {
      setLoading(false);
    }
  }, [term, year, toast, t]);

  const filteredClasses = useMemo(() => {
    let result = [...classes];

    if (programFilter && programFilter !== 'all') {
      result = result.filter(cls => cls.programId === programFilter);
    }

    if (subjectFilter && subjectFilter !== 'all') {
      result = result.filter(cls => cls.subjectId === subjectFilter);
    }

    if (instructorFilter && instructorFilter !== 'all') {
      result = result.filter(cls => cls.ownerEmail === instructorFilter);
    }

    return result;
  }, [classes, programFilter, subjectFilter, instructorFilter]);

  const calendarEvents = useMemo(() => {
    if (!term || !year || filteredClasses.length === 0) {
      return [];
    }

    const termStartDates = {
      'Fall': new Date(parseInt(year), 8, 1),
      'Spring': new Date(parseInt(year), 0, 1),
      'Summer': new Date(parseInt(year), 5, 1),
      'Winter': new Date(parseInt(year), 11, 1)
    };

    const termEndDates = {
      'Fall': new Date(parseInt(year), 11, 31),
      'Spring': new Date(parseInt(year), 4, 31),
      'Summer': new Date(parseInt(year), 7, 31),
      'Winter': new Date(parseInt(year) + 1, 2, 31)
    };

    const startDate = termStartDates[term] || new Date(parseInt(year), 0, 1);
    const endDate = termEndDates[term] || new Date(parseInt(year), 11, 31);

    return transformSchedulesToCalendarEvents(filteredClasses, startDate, endDate);
  }, [filteredClasses, term, year]);

  const handleSelectEvent = useCallback((event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowEventModal(false);
    setSelectedEvent(null);
  }, []);

  const getInstructorName = useCallback((email) => {
    if (!email) return t('unknown') || 'Unknown';
    const instructor = users.find(u => u.email === email);
    return instructor ? (instructor.displayName || instructor.name || email) : email;
  }, [users, t]);

  const getSubjectName = useCallback((subjectId) => {
    if (!subjectId) return t('unknown') || 'Unknown';
    const subject = subjects.find(s => (s.docId === subjectId || s.id === subjectId));
    if (!subject) return t('unknown') || 'Unknown';
    return lang === 'ar' ? (subject.name_ar || subject.name_en) : subject.name_en;
  }, [subjects, lang, t]);

  const getProgramName = useCallback((programId) => {
    if (!programId) return t('unknown') || 'Unknown';
    const program = programs.find(p => (p.docId === programId || p.id === programId));
    if (!program) return t('unknown') || 'Unknown';
    return lang === 'ar' ? (program.name_ar || program.name_en) : program.name_en;
  }, [programs, lang, t]);

  const instructorOptions = useMemo(() => {
    const instructors = users.filter(u => u.isInstructor === true || u.role === 'INSTRUCTOR');
    return [
      { value: 'all', label: t('all_instructors') || 'All Instructors' },
      ...instructors.map(instructor => ({
        value: instructor.email,
        label: instructor.displayName || instructor.name || instructor.email
      }))
    ];
  }, [users, t]);

  const programOptions = useMemo(() => {
    return [
      { value: 'all', label: t('all_programs') || 'All Programs' },
      ...programs.map(program => ({
        value: program.docId || program.id,
        label: lang === 'ar' ? (program.name_ar || program.name_en) : program.name_en
      }))
    ];
  }, [programs, lang, t]);

  const subjectOptions = useMemo(() => {
    let filteredSubjects = subjects;
    
    if (programFilter && programFilter !== 'all') {
      filteredSubjects = subjects.filter(s => s.programId === programFilter);
    }

    return [
      { value: 'all', label: t('all_subjects') || 'All Subjects' },
      ...filteredSubjects.map(subject => ({
        value: subject.docId || subject.id,
        label: lang === 'ar' ? (subject.name_ar || subject.name_en) : subject.name_en
      }))
    ];
  }, [subjects, programFilter, lang, t]);

  if (!isAdmin && !isInstructor) {
    return (
      <div className="schedule-overview-access-denied">
        <h2>{t('access_denied') || 'Access Denied'}</h2>
        <p>{t('instructor_admin_only') || 'This page is only accessible to instructors and admins.'}</p>
      </div>
    );
  }

  return (
    <div className="schedule-overview-page">
      <div className="schedule-overview-header">
        <div className="header-content">
          <div className="header-icon">
            {getThemedIcon('ui', 'calendar', 32, theme)}
          </div>
          <div className="header-text">
            <h1>{t('schedule_overview') || 'Schedule Overview'}</h1>
            <p>{t('schedule_overview_description') || 'View and manage class schedules for the semester'}</p>
          </div>
        </div>
      </div>

      <div className="schedule-filters-section">
        <div className="mandatory-filters">
          <div className="filter-label-required">
            {getThemedIcon('ui', 'alert_circle', 16, theme)}
            <span>{t('required_filters') || 'Required Filters'}</span>
          </div>
          <div className="mandatory-filters-row">
            <Select
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              options={[
                { value: '', label: t('select_term') || 'Select Term *' },
                { value: 'Fall', label: t('fall') || 'Fall' },
                { value: 'Spring', label: t('spring') || 'Spring' },
                { value: 'Summer', label: t('summer') || 'Summer' },
                { value: 'Winter', label: t('winter') || 'Winter' }
              ]}
              placeholder={t('select_term') || 'Select Term *'}
              required
            />
            <YearSelect
              value={year}
              onChange={(e) => setYear(e.target.value)}
              startYear={2024}
              yearsAhead={5}
              placeholder={t('select_year') || 'Select Year *'}
              required
            />
            <Button
              onClick={loadSchedules}
              variant="primary"
              disabled={!term || !year || loading}
              icon={getThemedIcon('ui', 'search', 16, theme)}
            >
              {t('load_schedules') || 'Load Schedules'}
            </Button>
          </div>
        </div>

        {classes.length > 0 && (
          <div className="optional-filters">
            <div className="filter-label">
              {getThemedIcon('ui', 'filter', 16, theme)}
              <span>{t('filter_by') || 'Filter By'}</span>
            </div>
            <div className="optional-filters-row">
              <Select
                value={programFilter}
                onChange={(e) => {
                  setProgramFilter(e.target.value);
                  setSubjectFilter('all');
                }}
                options={programOptions}
                placeholder={t('all_programs') || 'All Programs'}
              />
              <Select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                options={subjectOptions}
                placeholder={t('all_subjects') || 'All Subjects'}
              />
              <Select
                value={instructorFilter}
                onChange={(e) => setInstructorFilter(e.target.value)}
                options={instructorOptions}
                placeholder={t('all_instructors') || 'All Instructors'}
              />
              {(programFilter !== 'all' || subjectFilter !== 'all' || instructorFilter !== 'all') && (
                <Button
                  onClick={() => {
                    setProgramFilter('all');
                    setSubjectFilter('all');
                    setInstructorFilter('all');
                  }}
                  variant="outline"
                  icon={getThemedIcon('ui', 'x', 16, theme)}
                >
                  {t('clear_filters') || 'Clear'}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* No inline loading needed - GlobalLoading handles page-level loading */}

      {!loading && term && year && classes.length > 0 && (
        <>
          <div className="schedule-stats">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#dbeafe' }}>
                {getThemedIcon('ui', 'target', 20, theme)}
              </div>
              <div className="stat-content">
                <div className="stat-value">{filteredClasses.length}</div>
                <div className="stat-label">{t('total_classes') || 'Total Classes'}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#fef3c7' }}>
                {getThemedIcon('ui', 'calendar', 20, theme)}
              </div>
              <div className="stat-content">
                <div className="stat-value">{calendarEvents.length}</div>
                <div className="stat-label">{t('scheduled_sessions') || 'Scheduled Sessions'}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#dcfce7' }}>
                {getThemedIcon('ui', 'users', 20, theme)}
              </div>
              <div className="stat-content">
                <div className="stat-value">{new Set(filteredClasses.map(c => c.ownerEmail)).size}</div>
                <div className="stat-label">{t('instructors') || 'Instructors'}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#fce7f3' }}>
                {getThemedIcon('ui', 'book_open', 20, theme)}
              </div>
              <div className="stat-content">
                <div className="stat-value">{new Set(filteredClasses.map(c => c.subjectId)).size}</div>
                <div className="stat-label">{t('subjects') || 'Subjects'}</div>
              </div>
            </div>
          </div>

          <div className="calendar-section">
            <Calendar
              events={calendarEvents}
              onSelectEvent={handleSelectEvent}
              defaultView="month"
              views={['month', 'week', 'day', 'agenda']}
            />
          </div>
        </>
      )}

      {!loading && term && year && classes.length === 0 && (
        <div className="no-schedules-message">
          <div className="no-schedules-icon">
            {getThemedIcon('ui', 'calendar', 64, theme)}
          </div>
          <h3>{t('no_schedules_found') || 'No Schedules Found'}</h3>
          <p>{t('no_schedules_description') || 'There are no class schedules for the selected term and year.'}</p>
        </div>
      )}

      {!loading && (!term || !year) && (
        <div className="select-term-message">
          <div className="select-term-icon">
            {getThemedIcon('ui', 'calendar', 64, theme)}
          </div>
          <h3>{t('select_term_year') || 'Select Term and Year'}</h3>
          <p>{t('select_term_year_description') || 'Please select a term and year to view the schedule overview.'}</p>
        </div>
      )}

      {showEventModal && selectedEvent && (
        <div className="event-modal-overlay" onClick={handleCloseModal}>
          <div className="event-modal" onClick={(e) => e.stopPropagation()}>
            <div className="event-modal-header">
              <h3>{selectedEvent.title}</h3>
              <button onClick={handleCloseModal} className="modal-close-btn">
                {getThemedIcon('ui', 'x', 20, theme)}
              </button>
            </div>
            <div className="event-modal-body">
              <div className="event-detail">
                <div className="event-detail-icon">
                  {getThemedIcon('ui', 'calendar', 16, theme)}
                </div>
                <div className="event-detail-content">
                  <div className="event-detail-label">{t('date') || 'Date'}</div>
                  <div className="event-detail-value">
                    {selectedEvent.start.toLocaleDateString(lang === 'ar' ? 'ar-QA' : 'en-GB', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
              <div className="event-detail">
                <div className="event-detail-icon">
                  {getThemedIcon('ui', 'clock', 16, theme)}
                </div>
                <div className="event-detail-content">
                  <div className="event-detail-label">{t('time') || 'Time'}</div>
                  <div className="event-detail-value">
                    {selectedEvent.start.toLocaleTimeString(lang === 'ar' ? 'ar-QA' : 'en-GB', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })} - {selectedEvent.end.toLocaleTimeString(lang === 'ar' ? 'ar-QA' : 'en-GB', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
              {selectedEvent.resource?.duration && (
                <div className="event-detail">
                  <div className="event-detail-icon">
                    {getThemedIcon('ui', 'clock', 16, theme)}
                  </div>
                  <div className="event-detail-content">
                    <div className="event-detail-label">{t('duration') || 'Duration'}</div>
                    <div className="event-detail-value">{selectedEvent.resource.duration} {t('minutes') || 'minutes'}</div>
                  </div>
                </div>
              )}
              {selectedEvent.resource?.subjectId && (
                <div className="event-detail">
                  <div className="event-detail-icon">
                    {getThemedIcon('ui', 'book_open', 16, theme)}
                  </div>
                  <div className="event-detail-content">
                    <div className="event-detail-label">{t('subject') || 'Subject'}</div>
                    <div className="event-detail-value">{getSubjectName(selectedEvent.resource.subjectId)}</div>
                  </div>
                </div>
              )}
              {selectedEvent.resource?.programId && (
                <div className="event-detail">
                  <div className="event-detail-icon">
                    {getThemedIcon('ui', 'graduation_cap', 16, theme)}
                  </div>
                  <div className="event-detail-content">
                    <div className="event-detail-label">{t('program') || 'Program'}</div>
                    <div className="event-detail-value">{getProgramName(selectedEvent.resource.programId)}</div>
                  </div>
                </div>
              )}
              {selectedEvent.resource?.instructorEmail && (
                <div className="event-detail">
                  <div className="event-detail-icon">
                    {getThemedIcon('ui', 'user', 16, theme)}
                  </div>
                  <div className="event-detail-content">
                    <div className="event-detail-label">{t('instructor') || 'Instructor'}</div>
                    <div className="event-detail-value">{getInstructorName(selectedEvent.resource.instructorEmail)}</div>
                  </div>
                </div>
              )}
              {selectedEvent.resource?.classCode && (
                <div className="event-detail">
                  <div className="event-detail-icon">
                    {getThemedIcon('ui', 'tag', 16, theme)}
                  </div>
                  <div className="event-detail-content">
                    <div className="event-detail-label">{t('class_code') || 'Class Code'}</div>
                    <div className="event-detail-value">{selectedEvent.resource.classCode}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleOverviewPage;
