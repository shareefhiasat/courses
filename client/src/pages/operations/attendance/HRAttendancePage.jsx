import React, { useEffect, useState, useCallback, useMemo } from 'react';
import logger from '@utils/logger';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { Button, Select, DatePicker } from '@ui';
import { useTheme } from '@contexts/ThemeContext';
import { useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { getThemedIcon } from '@constants/iconTypes';
import { ATTENDANCE_STATUS, ATTENDANCE_STATUS_LABELS } from '@constants/attendanceTypes';
import { getPrograms, getSubjects } from '@services/business/programService';
import { getClasses } from '@services/business/classService';
import { getAttendanceStats, getAttendanceMarksForExport } from '@services/business/attendanceService';
import { getUsers, getUserById } from '@services/business/userService';

const HRAttendancePage = () => {
  const { user, isHR, isAdmin, loading: authLoading } = useAuth();
  const { t } = useLang();
  const { theme } = useTheme();
  const { startLoading } = useGlobalLoading();
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [marks, setMarks] = useState([]);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [programFilter, setProgramFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [termFilter, setTermFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [classes, setClasses] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [editingMark, setEditingMark] = useState(null);
  const [savingMark, setSavingMark] = useState(null);
  const [reason, setReason] = useState('');
  const [feedback, setFeedback] = useState('');

  // Load classes, programs, subjects
  useEffect(() => {
    (async () => {
      try {
        const [classesResult, programsRes, subjectsRes] = await Promise.all([
          getClasses(),
          getPrograms(),
          getSubjects()
        ]);
        const opts = classesResult.success ? classesResult.data : [];
        setClasses(opts);
        if (programsRes.success) setPrograms(programsRes.data || []);
        if (subjectsRes.success) setSubjects(subjectsRes.data || []);
      } catch {}
    })();
  }, []);

  const loadSessions = useCallback(async () => {
    const stopLoading = startLoading({ message: t('loading_attendance_sessions') || 'Loading attendance sessions...' });
    try {
      // Use attendance service to get attendance data
      const attendanceResult = await getAttendanceStats();
      const data = attendanceResult.success ? attendanceResult.data.sessions || [] : [];
      
      // Simplified enrichment - just use classId as className for now
      const enriched = data.map(session => ({
        ...session,
        className: session.classId || 'General',
        instructorName: session.instructorId || 'Unknown'
      }));
      
      // Apply filters
      let filtered = enriched;
      
      // Filter by program
      if (programFilter !== 'all') {
        filtered = filtered.filter(s => {
          if (!s.classId) return false;
          const classItem = classes.find(c => (c.id || c.docId) === s.classId);
          if (!classItem || !classItem.subjectId) return false;
          const subject = subjects.find(sub => (sub.docId || sub.id) === classItem.subjectId);
          if (!subject) return false;
          return (subject.programId || '') === programFilter;
        });
      }
      
      // Filter by subject
      if (subjectFilter !== 'all') {
        filtered = filtered.filter(s => {
          if (!s.classId) return false;
          const classItem = classes.find(c => (c.id || c.docId) === s.classId);
          if (!classItem) return false;
          return (classItem.subjectId || '') === subjectFilter;
        });
      }
      
      // Filter by class
      if (classFilter !== 'all') {
        filtered = filtered.filter(s => s.classId === classFilter);
      }
      
      // Filter by year
      if (yearFilter !== 'all') {
        filtered = filtered.filter(s => {
          if (s.classYear && String(s.classYear) === yearFilter) return true;
          if (s.classTerm) {
            const parts = s.classTerm.split(' ');
            if (parts.length > 1 && parts[parts.length - 1] === yearFilter) return true;
          }
          return false;
        });
      }
      
      // Filter by term
      if (termFilter !== 'all') {
        filtered = filtered.filter(s => {
          if (!s.classTerm) return false;
          const termPart = s.classTerm.split(' ')[0];
          return termPart === termFilter;
        });
      }
      if (dateFrom) {
        const from = new Date(dateFrom);
        filtered = filtered.filter(s => {
          const createdAt = s.createdAt?.toDate ? s.createdAt.toDate() : new Date(s.createdAt || 0);
          return createdAt >= from;
        });
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        filtered = filtered.filter(s => {
          const createdAt = s.createdAt?.toDate ? s.createdAt.toDate() : new Date(s.createdAt || 0);
          return createdAt <= to;
        });
      }

      // Check for expired sessions and auto-close them
      const now = new Date();
      const sessionDurationMinutes = 15; // Default session duration
      const expiredSessions = [];
      
      filtered.forEach(session => {
        if (session.status === 'open') {
          const createdAt = session.createdAt?.toDate ? session.createdAt.toDate() : new Date(session.createdAt || 0);
          const elapsedMinutes = (now - createdAt) / (1000 * 60);
          const duration = session.durationMinutes || sessionDurationMinutes;
          
          if (elapsedMinutes > duration) {
            expiredSessions.push(session.id);
          }
        }
      });

      // Auto-close expired sessions
      if (expiredSessions.length > 0) {
        await Promise.all(expiredSessions.map(async (sessionId) => {
          try {
            await updateDoc(doc(db, 'attendanceSessions', sessionId), { status: 'closed' });
          } catch (err) {
            console.warn('Failed to auto-close session:', err);
          }
        }));
        // Reload and re-filter sessions after closing
        const updatedSnap = await getDocs(collection(db, 'attendanceSessions'));
        let updatedData = updatedSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Re-enrich
        const reEnriched = await Promise.all(updatedData.map(async (session) => {
          try {
            if (session.classId) {
              const classDoc = await getDoc(doc(db, 'classes', session.classId));
              if (classDoc.exists()) {
                const classData = classDoc.data();
                session.className = classData.name || classData.code || session.classId;
                session.classTerm = classData.term;
                session.classYear = classData.year;
                
                if (session.createdBy) {
                  const userDoc = await getDoc(doc(db, 'users', session.createdBy));
                  if (userDoc.exists()) {
                    const userData = userDoc.data();
                    session.instructorName = userData.displayName || userData.email;
                  }
                }
              }
            }
          } catch (err) {
            logger.warn('Failed to enrich session:', err);
          }
          return session;
        }));
        
        filtered = reEnriched;
        
        // Re-apply filters
        if (classFilter !== 'all') {
          filtered = filtered.filter(s => s.classId === classFilter);
        }
        if (dateFrom) {
          const from = new Date(dateFrom);
          filtered = filtered.filter(s => {
            const createdAt = s.createdAt?.toDate ? s.createdAt.toDate() : new Date(s.createdAt || 0);
            return createdAt >= from;
          });
        }
        if (dateTo) {
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          filtered = filtered.filter(s => {
            const createdAt = s.createdAt?.toDate ? s.createdAt.toDate() : new Date(s.createdAt || 0);
            return createdAt <= to;
          });
        }
      }

      // Sort by date desc
      filtered.sort((a, b) => {
        const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return bDate - aDate;
      });

      setSessions(filtered);
      setInitialDataLoaded(true);
    } catch (e) {
      logger.error('[HR] Error loading sessions:', e);
    } finally {
      stopLoading();
    }
  }, [programFilter, subjectFilter, classFilter, yearFilter, termFilter, dateFrom, dateTo, classes, subjects, startLoading, t]);

  // Load attendance sessions
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const loadMarks = async (sessionId) => {
    const stopLoading = startLoading({ message: t('loading_attendance_marks') || 'Loading attendance marks...' });
    try {
      const result = await getAttendanceMarksForExport(sessionId);
      let data = result.success ? result.data : [];

      // Enrich with user data
      const enriched = await Promise.all(data.map(async (mark) => {
        try {
          // Use business service to get user data
          const userResult = await getUserById(mark.uid);
          if (userResult.success) {
            const userData = userResult.data;
            return { ...mark, userName: userData.displayName || userData.email, userEmail: userData.email };
          }
        } catch {}
        return mark;
      }));

      // Apply status filter
      let filtered = enriched;
      if (statusFilter !== 'all') {
        filtered = enriched.filter(m => {
          const status = m.status || 'present';
          // Handle legacy statuses
          if (statusFilter === ATTENDANCE_STATUS.ABSENT_NO_EXCUSE && (status === 'absent' || status === 'absent_no_excuse')) return true;
          if (statusFilter === ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE && status === 'absent_with_excuse') return true;
          if (statusFilter === ATTENDANCE_STATUS.EXCUSED_LEAVE && (status === 'leave' || status === 'excused_leave')) return true;
          return status === statusFilter;
        });
      }

      setMarks(filtered);
    } catch (e) {
      logger.error('[HR] Error loading marks:', e);
    } finally {
      stopLoading();
    }
  };

  const updateMarkStatus = async (sessionId, uid, newStatus, newReason, newFeedback) => {
    try {
      await updateDoc(doc(db, 'attendanceSessions', sessionId, 'marks', uid), {
        status: newStatus,
        reason: newReason || null,
        feedback: newFeedback || null,
        updatedBy: user?.uid,
        updatedAt: new Date()
      });
      // Reload marks
      await loadMarks(sessionId);
      setEditingMark(null);
      setReason('');
      setFeedback('');
    } catch (e) {
      logger.error('[HR] Error updating mark:', e);
      alert('Failed to update: ' + (e?.message || 'unknown error'));
    }
  };

  const exportSessionCSV = async (sessionId) => {
    try {
      const result = await getAttendanceMarksForExport(sessionId);
      const rows = result.success ? result.data : [];
      
      // Enrich with user data
      const enriched = await Promise.all(rows.map(async (mark) => {
        try {
          // Use business service to get user data
          const userResult = await getUserById(mark.uid);
          if (userResult.success) {
            const userData = userResult.data;
            return { ...mark, userName: userData.displayName || userData.email, userEmail: userData.email };
          }
        } catch {}
        return mark;
      }));

      const headers = ['UID', 'Name', 'Email', 'Status', 'Reason', 'Feedback', 'Device Hash', 'Scanned At', 'Updated By'];
      const csvRows = enriched.map(r => [
        r.uid,
        r.userName || '',
        r.userEmail || '',
        r.status || 'present',
        r.reason || '',
        r.feedback || '',
        r.deviceHash || '',
        (r.at && r.at.toDate ? r.at.toDate() : new Date()).toLocaleString('en-GB'),
        r.updatedBy || ''
      ]);
      const csv = [headers.join(','), ...csvRows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hr_attendance_${sessionId}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      alert('Export failed: ' + (e?.message || 'unknown error'));
    }
  };

  // Show loading while auth is resolving
  if (authLoading) {
    return (
      <SimpleLoading 
        loading
        fullscreen
        type="brand"
        size="lg"
      />
    );
  }

  // Add initial loading state
  if (!initialDataLoaded && loading && sessions.length === 0 && classes.length === 0) {
    return (
      <SimpleLoading 
        loading
        fullscreen
        type="brand"
        size="lg"
      />
    );
  }

  if (!isHR && !isAdmin) {
    return (
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
        {getThemedIcon('ui', 'alert_triangle', 48, theme)}
        <h2>Access Denied</h2>
        <p>This page is only accessible to HR personnel.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '1rem' }}>

      {/* Filters */}
      <div style={{ marginBottom: 16, padding: '0.75rem', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 8 }}>
          <div>
            <Select
              searchable
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Programs' },
                ...programs.map(p => ({
                  value: p.docId || p.id,
                  label: p.name_en || p.name_ar || p.code || p.docId
                }))
              ]}
              fullWidth
              placeholder="Program"
            />
          </div>
          <div>
            <Select
              searchable
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Subjects' },
                ...subjects
                  .filter(s => programFilter === 'all' || s.programId === programFilter)
                  .map(s => ({
                    value: s.docId || s.id,
                    label: `${s.code || ''} - ${s.name_en || s.name_ar || s.docId}`
                  }))
              ]}
              fullWidth
              placeholder="Subject"
            />
          </div>
          <div>
            <Select
              searchable
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              options={[
                { value: 'all', label: t('all_classes') || 'All Classes' },
                ...classes
                  .filter(c => {
                    if (subjectFilter !== 'all' && c.subjectId !== subjectFilter) return false;
                    if (programFilter !== 'all') {
                      const subject = subjects.find(s => (s.docId || s.id) === c.subjectId);
                      if (!subject || subject.programId !== programFilter) return false;
                    }
                    return true;
                  })
                  .map(c => ({ value: c.id || c.docId, label: c.name || c.code || c.id }))
              ]}
              fullWidth
              placeholder={t('class') || 'Class'}
            />
          </div>
          <div>
            <Select
              searchable
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Years' },
                ...Array.from(new Set(classes.map(c => {
                  if (c.year) return String(c.year);
                  if (c.term) {
                    const parts = c.term.split(' ');
                    if (parts.length > 1) return parts[parts.length - 1];
                  }
                  return null;
                }).filter(Boolean))).sort((a, b) => Number(b) - Number(a)).map(year => ({ value: year, label: year }))
              ]}
              fullWidth
              placeholder="Year"
            />
          </div>
          <div>
            <Select
              searchable
              value={termFilter}
              onChange={(e) => setTermFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Terms' },
                ...Array.from(new Set(classes.map(c => {
                  if (c.term) return c.term.split(' ')[0];
                  return null;
                }).filter(Boolean))).sort().map(term => ({ value: term, label: term }))
              ]}
              fullWidth
              placeholder="Term"
            />
          </div>
          <div>
            <Select
              searchable
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: t('all') || 'All Status' },
                { value: ATTENDANCE_STATUS.PRESENT, label: ATTENDANCE_STATUS_LABELS.present.en },
                { value: ATTENDANCE_STATUS.LATE, label: ATTENDANCE_STATUS_LABELS.late.en },
                { value: ATTENDANCE_STATUS.ABSENT_NO_EXCUSE, label: ATTENDANCE_STATUS_LABELS.absent_no_excuse.en },
                { value: ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE, label: ATTENDANCE_STATUS_LABELS.absent_with_excuse.en },
                { value: ATTENDANCE_STATUS.EXCUSED_LEAVE, label: ATTENDANCE_STATUS_LABELS.excused_leave.en },
                { value: ATTENDANCE_STATUS.HUMAN_CASE, label: ATTENDANCE_STATUS_LABELS.human_case.en }
              ]}
              fullWidth
              placeholder={t('status') || 'Status'}
            />
          </div>
          <div>
            <DatePicker
              type="date"
              value={dateFrom ? (dateFrom.includes('/') ? new Date(dateFrom.split('/').reverse().join('-')).toISOString().split('T')[0] : dateFrom) : ''}
              onChange={(iso) => setDateFrom(iso ? new Date(iso).toLocaleDateString('en-CA') : '')}
              placeholder={t('from_date') || 'From Date'}
              fullWidth
            />
          </div>
          <div>
            <DatePicker
              type="date"
              value={dateTo ? (dateTo.includes('/') ? new Date(dateTo.split('/').reverse().join('-')).toISOString().split('T')[0] : dateTo) : ''}
              onChange={(iso) => setDateTo(iso ? new Date(iso).toLocaleDateString('en-CA') : '')}
              placeholder={t('to_date') || 'To Date'}
              fullWidth
            />
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ flex: '1 1 300px', padding: '0.75rem', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12, maxHeight: 600, overflowY: 'auto' }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{t('sessions') || 'Sessions'} ({sessions.length})</div>
          {!loading && sessions.length === 0 && <div style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>{t('no_sessions') || 'No sessions found'}</div>}
          <div style={{ display: 'grid', gap: 6 }}>
            {sessions.map((session, idx) => {
              const className = session.className || classes.find(c => c.id === session.classId)?.name || session.classId;
              const createdAt = session.createdAt?.toDate ? session.createdAt.toDate() : new Date(session.createdAt || 0);
              const isSelected = selectedSession?.id === session.id;
              const uniqueKey = session.id || `session-${idx}`;
              return (
                <div
                  key={uniqueKey}
                  onClick={() => { setSelectedSession(session); loadMarks(session.id); }}
                  style={{
                    padding: '0.5rem 0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    background: isSelected ? 'rgba(102,126,234,0.12)' : '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{className}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {session.instructorName && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {getThemedIcon('ui', 'user', 12, theme)}
                        {session.instructorName}
                      </span>
                    )}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {getThemedIcon('ui', 'calendar', 12, theme)}
                      {createdAt.toLocaleDateString('en-GB')} {createdAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: session.status === 'open' ? '#10b981' : '#6b7280', fontWeight: 600 }}>
                      <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: session.status === 'open' ? '#10b981' : '#6b7280' }}></span>
                      {session.status === 'open' ? (t('active_session') || 'Active Session') : (t('ended') || 'Ended')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Marks Detail */}
        <div style={{ flex: '2 1 400px', padding: '0.75rem', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12 }}>
          {!selectedSession && (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--muted)' }}>
              {getThemedIcon('ui', 'search', 36, theme)}
              <div style={{ fontSize: 13 }}>{t('select_session') || 'Select a session to view attendance details'}</div>
            </div>
          )}
          {selectedSession && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: '0.25rem' }}>
                    {selectedSession.className || classes.find(c => c.id === selectedSession.classId)?.name || selectedSession.classId}
                  </div>
                  {selectedSession.instructorName && (
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: '0.25rem' }}>
                      {getThemedIcon('ui', 'user', 12, theme)}
                      {selectedSession.instructorName}
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: '0.5rem', fontFamily: 'monospace' }}>
                    Session ID: {selectedSession.id}
                  </div>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.35rem 0.75rem',
                    background: marks.length > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                    border: `1px solid ${marks.length > 0 ? '#10b981' : '#6b7280'}`,
                    borderRadius: 6,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    color: marks.length > 0 ? '#10b981' : '#6b7280'
                  }}>
                    {getThemedIcon('ui', 'users', 14, theme)}
                    <span>{marks.length} {t('scans') || 'scans'}</span>
                  </div>
                </div>
                <Button 
                  variant="success" 
                  size="small"
                  icon={getThemedIcon('ui', 'download', 14, theme)}
                  onClick={() => exportSessionCSV(selectedSession.id)}
                >
                  {t('export_csv') || 'Export CSV'}
                </Button>
              </div>

              {/* Summary Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 8, marginBottom: 12 }}>
                {[
                  { key: ATTENDANCE_STATUS.PRESENT, label: ATTENDANCE_STATUS_LABELS.present },
                  { key: ATTENDANCE_STATUS.LATE, label: ATTENDANCE_STATUS_LABELS.late },
                  { key: ATTENDANCE_STATUS.ABSENT_NO_EXCUSE, label: ATTENDANCE_STATUS_LABELS.absent_no_excuse },
                  { key: ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE, label: ATTENDANCE_STATUS_LABELS.absent_with_excuse },
                  { key: ATTENDANCE_STATUS.EXCUSED_LEAVE, label: ATTENDANCE_STATUS_LABELS.excused_leave },
                  { key: ATTENDANCE_STATUS.HUMAN_CASE, label: ATTENDANCE_STATUS_LABELS.human_case }
                ].map(({ key, label }) => {
                  const count = marks.filter(m => {
                    const status = m.status || 'present';
                    // Handle legacy statuses
                    if (key === ATTENDANCE_STATUS.ABSENT_NO_EXCUSE && (status === 'absent' || status === 'absent_no_excuse')) return true;
                    if (key === ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE && status === 'absent_with_excuse') return true;
                    if (key === ATTENDANCE_STATUS.EXCUSED_LEAVE && (status === 'leave' || status === 'excused_leave')) return true;
                    return status === key;
                  }).length;
                  const color = label.color || '#6b7280';
                  const displayLabel = label.en || key;
                  return (
                    <div key={key} style={{ padding: '0.5rem 0.75rem', background: color + '15', border: `1px solid ${color}`, borderRadius: 6, textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: color, lineHeight: 1.2 }}>{count}</div>
                      <div style={{ fontSize: 9, textTransform: 'uppercase', fontWeight: 600, color: color, marginTop: 2, lineHeight: 1.2 }}>{displayLabel}</div>
                    </div>
                  );
                })}
              </div>

              {/* Marks Table */}
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {marks.length === 0 && <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--muted)' }}>{t('no_marks') || 'No attendance records'}</div>}
                {marks.length > 0 && (
                <div style={{ display: 'grid', gap: 6 }}>
                  {marks.map((mark, idx) => {
                    const isEditing = editingMark?.uid === mark.uid;
                    const status = mark.status || 'present';
                    // Handle legacy statuses
                    const normalizedStatus = status === 'absent' ? ATTENDANCE_STATUS.ABSENT_NO_EXCUSE : 
                                           status === 'leave' ? ATTENDANCE_STATUS.EXCUSED_LEAVE : status;
                    const statusInfo = ATTENDANCE_STATUS_LABELS[normalizedStatus] || ATTENDANCE_STATUS_LABELS.present;
                    const statusColor = statusInfo.color || '#6b7280';
                    const statusLabel = statusInfo.en || status;
                    const uniqueKey = mark.uid || `mark-${idx}`;
                    return (
                      <div key={uniqueKey} style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: 6, background: '#fff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isEditing ? 8 : 0 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{mark.userName}</div>
                            <div style={{ fontSize: 10, color: 'var(--muted)' }}>{mark.userEmail}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ padding: '3px 8px', borderRadius: 6, background: statusColor + '20', color: statusColor, fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap' }}>
                              {statusLabel}
                            </div>
                            {!isEditing && (
                              <button onClick={() => { setEditingMark(mark); setReason(mark.reason || ''); setFeedback(mark.feedback || ''); }} style={{ padding: '0.3rem 0.6rem', border: '1px solid var(--border)', borderRadius: 6, background: '#800020', color: 'white', fontSize: 11, fontWeight: 600 }}>
                                {t('edit') || 'Edit'}
                              </button>
                            )}
                          </div>
                        </div>
                        {!isEditing && (mark.reason || mark.feedback) && (
                          <div style={{ fontSize: 10, color: '#6b7280', marginTop: 4 }}>
                            {mark.reason && <span><strong>{t('reason') || 'Reason'}:</strong> {mark.reason}</span>}
                            {mark.reason && mark.feedback && <span> • </span>}
                            {mark.feedback && <span><strong>{t('feedback') || 'Note'}:</strong> {mark.feedback}</span>}
                          </div>
                        )}
                        {isEditing && (
                          <div style={{ marginTop: 8, padding: '0.75rem', background: '#f9fafb', borderRadius: 6 }}>
                            <div style={{ marginBottom: 6 }}>
                              <label style={{ display: 'block', marginBottom: 3, fontSize: 10, fontWeight: 600 }}>{t('status') || 'Status'}</label>
                              <Select
                                size="small"
                                value={normalizedStatus}
                                onChange={(e) => setEditingMark({ ...mark, status: e.target.value })}
                                options={[
                                  { value: ATTENDANCE_STATUS.PRESENT, label: `${ATTENDANCE_STATUS_LABELS.present.en} - ${ATTENDANCE_STATUS_LABELS.present.ar}` },
                                  { value: ATTENDANCE_STATUS.LATE, label: `${ATTENDANCE_STATUS_LABELS.late.en} - ${ATTENDANCE_STATUS_LABELS.late.ar}` },
                                  { value: ATTENDANCE_STATUS.ABSENT_NO_EXCUSE, label: `❌ ${ATTENDANCE_STATUS_LABELS.absent_no_excuse.en} - ${ATTENDANCE_STATUS_LABELS.absent_no_excuse.ar}` },
                                  { value: ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE, label: `📝 ${ATTENDANCE_STATUS_LABELS.absent_with_excuse.en} - ${ATTENDANCE_STATUS_LABELS.absent_with_excuse.ar}` },
                                  { value: ATTENDANCE_STATUS.EXCUSED_LEAVE, label: `🚪 ${ATTENDANCE_STATUS_LABELS.excused_leave.en} - ${ATTENDANCE_STATUS_LABELS.excused_leave.ar}` },
                                  { value: ATTENDANCE_STATUS.HUMAN_CASE, label: `💜 ${ATTENDANCE_STATUS_LABELS.human_case.en} - ${ATTENDANCE_STATUS_LABELS.human_case.ar}` }
                                ]}
                                fullWidth
                              />
                            </div>
                            <div style={{ marginBottom: 6 }}>
                              <label style={{ display: 'block', marginBottom: 3, fontSize: 10, fontWeight: 600 }}>{t('reason') || 'Reason'}</label>
                              <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g., Medical appointment" style={{ width: '100%', padding: '0.35rem', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11 }} />
                            </div>
                            <div style={{ marginBottom: 6 }}>
                              <label style={{ display: 'block', marginBottom: 3, fontSize: 10, fontWeight: 600 }}>{t('feedback') || 'Feedback'}</label>
                              <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Additional notes..." rows={2} style={{ width: '100%', padding: '0.35rem', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11, resize: 'vertical' }} />
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <Button 
                                variant="success"
                                size="small"
                                loading={savingMark === mark.uid}
                                onClick={async () => {
                                  setSavingMark(mark.uid);
                                  await updateMarkStatus(selectedSession.id, mark.uid, editingMark.status, reason, feedback);
                                  setSavingMark(null);
                                }}
                              >
                                {t('save') || 'Save'}
                              </Button>
                              <Button 
                                variant="outline" 
                                size="small"
                                onClick={() => { setEditingMark(null); setReason(''); setFeedback(''); }}
                              >
                                {t('cancel') || 'Cancel'}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HRAttendancePage;
