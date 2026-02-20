import React, { useEffect, useState, useCallback, useMemo } from 'react';
import logger from '@utils/logger';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { Button, Select, DatePicker, Tooltip } from '@ui';
import { useTheme } from '@contexts/ThemeContext';
import { useColorTheme } from '@contexts/ColorThemeContext';
import { useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { getThemedIcon } from '@constants/iconTypes';
import { ATTENDANCE_STATUS, ATTENDANCE_STATUS_LABELS } from '@constants/attendanceTypes';
import { getPrograms, getSubjects } from '@services/business/programService';
import { getClasses } from '@services/business/classService';
import { getAttendanceStats, getAttendanceMarksForExport, getAllAttendanceSessions, updateAttendanceMark, getAttendanceMarksCount } from '@services/business/attendanceService';
import { getUsers, getUserById } from '@services/business/userService';

const HRAttendancePage = () => {
  const { user, isHR, isAdmin, loading: authLoading } = useAuth();
  const { t } = useLang();
  const { theme } = useTheme();
  const { primaryColor } = useColorTheme();
  const { startLoading } = useGlobalLoading();
  
  // Update localStorage with your preferred color if it's different
  if (user?.uid && primaryColor !== '#EF4444') {
    console.log('🎨 [HRAttendance] Updating stored color to your preference #EF4444');
    localStorage.setItem(`accent_color_${user.uid}`, '#EF4444');
    // Force a re-render by updating the state
    window.location.reload();
  }
  
  // Use the user's primary color or fallback to maroon
  const actualPrimaryColor = primaryColor || '#800020';
  
  // Helper function to get icon color based on theme
  const getIconColor = (defaultColor, theme) => {
    return theme === 'light' ? 'white' : defaultColor;
  };
  
  // Helper function to create attendance summary badges
  const createAttendanceBadge = (count, iconType, color, tooltipText) => {
    if (!count || count <= 0) return null;
    
    return (
      <Tooltip content={tooltipText}>
        <span 
          style={{ 
            background: `${color}15`, 
            color: color, 
            padding: '1px 4px', 
            borderRadius: 3,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '2px'
          }}
        >
          {getThemedIcon('ui', iconType, 10, getIconColor(color, theme))}
          {count}
        </span>
      </Tooltip>
    );
  };
  
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
    logger.log('[HRAttendance] loadSessions called with filters:', {
      programFilter,
      subjectFilter,
      classFilter,
      yearFilter,
      termFilter,
      dateFrom,
      dateTo
    });
    
    const stopLoading = startLoading({ message: t('hr_attendance_loading_attendance_sessions') });
    try {
      // Use attendance service to get attendance sessions
      const attendanceResult = await getAllAttendanceSessions();
      const data = attendanceResult.success ? attendanceResult.data.sessions || [] : [];
      
      logger.log('[HRAttendance] Fetched sessions count:', data.length);
      
      // Log sample session data structure for debugging
      if (data.length > 0) {
        logger.log('[HRAttendance] Sample session data:', {
          id: data[0].id,
          classId: data[0].classId,
          classYear: data[0].classYear,
          classTerm: data[0].classTerm,
          createdAt: data[0].createdAt,
          createdAtType: typeof data[0].createdAt,
          createdAtToDate: data[0].createdAt?.toDate ? data[0].createdAt.toDate() : 'N/A'
        });
      }
      
      // Enrich sessions with class, instructor data, and scan counts
      const enriched = await Promise.all(data.map(async (session) => {
        let className = session.classId || t('hr_attendance_general');
        let instructorName = session.instructorId || t('hr_attendance_unknown');
        let scanCounts = { total: 0 };
        
        // Get class name
        if (session.classId) {
          const classItem = classes.find(c => (c.id || c.docId) === session.classId);
          if (classItem) {
            className = classItem.name || classItem.code || session.classId;
          }
        }
        
        // Get instructor name
        if (session.createdBy) {
          try {
            const userResult = await getUserById(session.createdBy);
            if (userResult.success && userResult.data) {
              const userData = userResult.data;
              // Priority: displayName -> realName -> email
              instructorName = userData.displayName && userData.displayName.trim() 
                ? userData.displayName 
                : userData.realName && userData.realName.trim()
                  ? userData.realName
                  : userData.email || session.instructorId;
            }
          } catch (err) {
            logger.warn('Failed to get instructor name:', err);
          }
        }
        
        // Get scan counts
        try {
          const countResult = await getAttendanceMarksCount(session.id);
          if (countResult.success) {
            scanCounts = countResult.data;
          }
        } catch (err) {
          logger.warn('Failed to get scan counts:', err);
        }
        
        return {
          ...session,
          className,
          instructorName,
          scanCounts
        };
      }));
      
      // Apply filters
      let filtered = enriched;
      logger.log('[HRAttendance] Starting with enriched sessions count:', filtered.length);
      
      // Filter by program
      if (programFilter !== 'all') {
        logger.log('[HRAttendance] Applying program filter:', programFilter);
        filtered = filtered.filter(s => {
          if (!s.classId) return false;
          const classItem = classes.find(c => (c.id || c.docId) === s.classId);
          if (!classItem || !classItem.subjectId) return false;
          const subject = subjects.find(sub => (sub.docId || sub.id) === classItem.subjectId);
          if (!subject) return false;
          return (subject.programId || '') === programFilter;
        });
        logger.log('[HRAttendance] After program filter count:', filtered.length);
      }
      
      // Filter by subject
      if (subjectFilter !== 'all') {
        logger.log('[HRAttendance] Applying subject filter:', subjectFilter);
        filtered = filtered.filter(s => {
          if (!s.classId) return false;
          const classItem = classes.find(c => (c.id || c.docId) === s.classId);
          if (!classItem) return false;
          return (classItem.subjectId || '') === subjectFilter;
        });
        logger.log('[HRAttendance] After subject filter count:', filtered.length);
      }
      
      // Filter by class
      if (classFilter !== 'all') {
        logger.log('[HRAttendance] Applying class filter:', classFilter);
        filtered = filtered.filter(s => s.classId === classFilter);
        logger.log('[HRAttendance] After class filter count:', filtered.length);
      }
      
      // Filter by year
      if (yearFilter !== 'all') {
        logger.log('[HRAttendance] Applying year filter:', yearFilter);
        logger.log('[HRAttendance] Sessions before year filter:', filtered.map(s => ({
          id: s.id,
          classYear: s.classYear,
          classTerm: s.classTerm
        })));
        
        filtered = filtered.filter(s => {
          // Check classYear field
          if (s.classYear && String(s.classYear) === yearFilter) {
            logger.log('[HRAttendance] Session matched by classYear:', s.id, s.classYear);
            return true;
          }
          
          // Check classTerm field for year in term like "Fall 2025"
          if (s.classTerm) {
            const parts = s.classTerm.split(' ');
            if (parts.length > 1 && parts[parts.length - 1] === yearFilter) {
              logger.log('[HRAttendance] Session matched by classTerm:', s.id, s.classTerm);
              return true;
            }
          }
          
          // Check createdAt date year
          if (s.createdAt) {
            const createdDate = s.createdAt?.toDate ? s.createdAt.toDate() : new Date(s.createdAt || 0);
            const createdYear = String(createdDate.getFullYear());
            if (createdYear === yearFilter) {
              logger.log('[HRAttendance] Session matched by createdAt year:', s.id, createdYear);
              return true;
            }
          }
          
          return false;
        });
        logger.log('[HRAttendance] After year filter count:', filtered.length);
      }
      
      // Filter by term
      if (termFilter !== 'all') {
        logger.log('[HRAttendance] Applying term filter:', termFilter);
        logger.log('[HRAttendance] Sessions before term filter:', filtered.map(s => ({
          id: s.id,
          classTerm: s.classTerm
        })));
        
        filtered = filtered.filter(s => {
          if (!s.classTerm) return false;
          const termPart = s.classTerm.split(' ')[0];
          const matches = termPart === termFilter;
          if (matches) {
            logger.log('[HRAttendance] Session matched by term:', s.id, s.classTerm, 'termPart:', termPart);
          }
          return matches;
        });
        logger.log('[HRAttendance] After term filter count:', filtered.length);
      }
      if (dateFrom) {
        logger.log('[HRAttendance] Applying dateFrom filter:', dateFrom);
        const from = new Date(dateFrom);
        filtered = filtered.filter(s => {
          const createdAt = s.createdAt?.toDate ? s.createdAt.toDate() : new Date(s.createdAt || 0);
          return createdAt >= from;
        });
        logger.log('[HRAttendance] After dateFrom filter count:', filtered.length);
      }
      if (dateTo) {
        logger.log('[HRAttendance] Applying dateTo filter:', dateTo);
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        filtered = filtered.filter(s => {
          const createdAt = s.createdAt?.toDate ? s.createdAt.toDate() : new Date(s.createdAt || 0);
          return createdAt <= to;
        });
        logger.log('[HRAttendance] After dateTo filter count:', filtered.length);
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

      // Auto-close expired sessions using service function
      if (expiredSessions.length > 0) {
        await Promise.all(expiredSessions.map(async (sessionId) => {
          try {
            const { closeAttendanceSession } = await import('@services/business/attendanceService');
            await closeAttendanceSession(sessionId);
          } catch (err) {
            console.warn('Failed to auto-close session:', err);
          }
        }));
        // Reload sessions after closing expired ones
        const reloadResult = await getAllAttendanceSessions();
        if (reloadResult.success) {
          let updatedData = reloadResult.data.sessions || [];
        
          // Re-enrich sessions with class and user data
          const reEnriched = await Promise.all(updatedData.map(async (session) => {
            try {
              if (session.classId) {
                const classResult = await getClasses();
                if (classResult.success) {
                  const classItem = classResult.data.find(c => (c.id || c.docId) === session.classId);
                  if (classItem) {
                    session.className = classItem.name || classItem.code || session.classId;
                    session.classTerm = classItem.term;
                    session.classYear = classItem.year;
                  }
                }
                
                if (session.createdBy) {
                  const userResult = await getUserById(session.createdBy);
                  if (userResult.success) {
                    const userData = userResult.data;
                    session.instructorName = userData.displayName || userData.email;
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
      }

      // Sort by date desc
      filtered.sort((a, b) => {
        const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return bDate - aDate;
      });

      setSessions(filtered);
      setInitialDataLoaded(true);
      logger.log('[HRAttendance] Final sessions set:', filtered.length, 'sessions');
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

  // Add logging for filter changes
  useEffect(() => {
    logger.log('[HRAttendance] Program filter changed to:', programFilter);
  }, [programFilter]);

  useEffect(() => {
    logger.log('[HRAttendance] Subject filter changed to:', subjectFilter);
  }, [subjectFilter]);

  useEffect(() => {
    logger.log('[HRAttendance] Class filter changed to:', classFilter);
  }, [classFilter]);

  useEffect(() => {
    logger.log('[HRAttendance] Year filter changed to:', yearFilter);
  }, [yearFilter]);

  useEffect(() => {
    logger.log('[HRAttendance] Term filter changed to:', termFilter);
  }, [termFilter]);

  const loadMarks = async (sessionId) => {
    const stopLoading = startLoading({ message: t('hr_attendance_loading_attendance_marks') });
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
      const result = await updateAttendanceMark(sessionId, uid, newStatus, newReason, newFeedback, user?.uid);
      if (!result.success) {
        throw new Error(result.error);
      }
      // Reload marks
      await loadMarks(sessionId);
      setEditingMark(null);
      setReason('');
      setFeedback('');
    } catch (e) {
      logger.error('[HR] Error updating mark:', e);
      alert(t('hr_attendance_failed_to_update') + ': ' + (e?.message || t('hr_attendance_unknown_error')));
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
  if (!initialDataLoaded && authLoading && sessions.length === 0 && classes.length === 0) {
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
              onChange={(e) => {
                logger.log('[HRAttendance] Program filter changing from:', programFilter, 'to:', e.target.value);
                setProgramFilter(e.target.value);
              }}
              options={[
                { value: 'all', label: 'All Programs' },
                ...programs.map(p => ({
                  value: p.docId || p.id,
                  label: p.name_en || p.name_ar || p.code || p.docId
                }))
              ]}
              fullWidth
              placeholder={t('all_programs') || 'All Programs'}
            />
          </div>
          <div>
            <Select
              searchable
              value={subjectFilter}
              onChange={(e) => {
                logger.log('[HRAttendance] Subject filter changing from:', subjectFilter, 'to:', e.target.value);
                setSubjectFilter(e.target.value);
              }}
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
              placeholder={t('all_subjects') || 'All Subjects'}
            />
          </div>
          <div>
            <Select
              searchable
              value={classFilter}
              onChange={(e) => {
                logger.log('[HRAttendance] Class filter changing from:', classFilter, 'to:', e.target.value);
                setClassFilter(e.target.value);
              }}
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
              placeholder={t('all_classes') || 'All Classes'}
            />
          </div>
          <div>
            <Select
              searchable
              value={yearFilter}
              onChange={(e) => {
                logger.log('[HRAttendance] Year filter changing from:', yearFilter, 'to:', e.target.value);
                setYearFilter(e.target.value);
              }}
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
              placeholder={t('all_years') || 'All Years'}
            />
          </div>
          <div>
            <Select
              searchable
              value={termFilter}
              onChange={(e) => {
                logger.log('[HRAttendance] Term filter changing from:', termFilter, 'to:', e.target.value);
                setTermFilter(e.target.value);
              }}
              options={[
                { value: 'all', label: 'All Terms' },
                ...Array.from(new Set(classes.map(c => {
                  if (c.term) return c.term.split(' ')[0];
                  return null;
                }).filter(Boolean))).sort().map(term => ({ value: term, label: term }))
              ]}
              fullWidth
              placeholder={t('all_terms') || 'All Terms'}
            />
          </div>
          <div>
            <Select
              searchable
              value={statusFilter}
              onChange={(e) => {
                logger.log('[HRAttendance] Status filter changing from:', statusFilter, 'to:', e.target.value);
                setStatusFilter(e.target.value);
              }}
              options={[
                { value: 'all', label: t('all_status') || 'All Status' },
                { value: ATTENDANCE_STATUS.PRESENT, label: ATTENDANCE_STATUS_LABELS.present.en },
                { value: ATTENDANCE_STATUS.LATE, label: ATTENDANCE_STATUS_LABELS.late.en },
                { value: ATTENDANCE_STATUS.ABSENT_NO_EXCUSE, label: ATTENDANCE_STATUS_LABELS.absent_no_excuse.en },
                { value: ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE, label: ATTENDANCE_STATUS_LABELS.absent_with_excuse.en },
                { value: ATTENDANCE_STATUS.EXCUSED_LEAVE, label: ATTENDANCE_STATUS_LABELS.excused_leave.en },
                { value: ATTENDANCE_STATUS.HUMAN_CASE, label: ATTENDANCE_STATUS_LABELS.human_case.en }
              ]}
              fullWidth
              placeholder={t('all_status') || 'All Status'}
            />
          </div>
          <div>
            <DatePicker
              type="date"
              value={dateFrom ? (dateFrom.includes('/') ? new Date(dateFrom.split('/').reverse().join('-')).toISOString().split('T')[0] : dateFrom) : ''}
              onChange={(iso) => {
                logger.log('[HRAttendance] DateFrom changing from:', dateFrom, 'to:', iso ? new Date(iso).toLocaleDateString('en-CA') : '');
                setDateFrom(iso ? new Date(iso).toLocaleDateString('en-CA') : '');
              }}
              placeholder={t('from_date') || 'From Date'}
              fullWidth
            />
          </div>
          <div>
            <DatePicker
              type="date"
              value={dateTo ? (dateTo.includes('/') ? new Date(dateTo.split('/').reverse().join('-')).toISOString().split('T')[0] : dateTo) : ''}
              onChange={(iso) => {
                logger.log('[HRAttendance] DateTo changing from:', dateTo, 'to:', iso ? new Date(iso).toLocaleDateString('en-CA') : '');
                setDateTo(iso ? new Date(iso).toLocaleDateString('en-CA') : '');
              }}
              placeholder={t('to_date') || 'To Date'}
              fullWidth
            />
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ flex: '1 1 300px', padding: '0.75rem', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12, maxHeight: 600, overflowY: 'auto' }}>
          <div style={{ 
            fontWeight: 700, 
            fontSize: 14, 
            marginBottom: 8,
            color: theme === 'dark' ? '#f9fafb' : '#111827'
          }}>{t('sessions') || 'Sessions'} ({sessions.length})</div>
          {initialDataLoaded && sessions.length === 0 && <div style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>{t('no_sessions') || 'No sessions found'}</div>}
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
                    background: isSelected 
                      ? (theme === 'dark' ? `${actualPrimaryColor}25` : `${actualPrimaryColor}15`)
                      : (theme === 'dark' ? '#1f2937' : '#fff'),
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ 
                    fontWeight: 600, 
                    fontSize: 13, 
                    marginBottom: 4,
                    color: theme === 'dark' ? '#f9fafb' : '#111827'
                  }}>{className}</div>
                  
                  {/* Attendance Summaries */}
                  {session.scanCounts && (
                    <div style={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: '0.25rem', 
                      marginBottom: '0.5rem',
                      fontSize: 11
                    }}>
                      {createAttendanceBadge(
                        session.scanCounts.present || session.scanCounts.PRESENT || 0,
                        'check_circle',
                        '#10b981',
                        t('present') || 'Present'
                      )}
                      {createAttendanceBadge(
                        session.scanCounts.late || session.scanCounts.LATE || 0,
                        'clock',
                        '#f59e0b',
                        t('late') || 'Late'
                      )}
                      {createAttendanceBadge(
                        (session.scanCounts.absent_no_excuse || session.scanCounts.absent || 0) + 
                        (session.scanCounts.ABSENT_NO_EXCUSE || 0),
                        'x_circle',
                        '#ef4444',
                        t('absent_no_excuse') || 'Absent (No Excuse)'
                      )}
                      {createAttendanceBadge(
                        session.scanCounts.absent_with_excuse || session.scanCounts.ABSENT_WITH_EXCUSE || 0,
                        'file_text',
                        '#3b82f6',
                        t('absent_with_excuse') || 'Absent (Excused)'
                      )}
                      {createAttendanceBadge(
                        session.scanCounts.excused_leave || session.scanCounts.EXCUSED_LEAVE || 0,
                        'home',
                        '#8b5cf6',
                        t('excused_leave') || 'Excused Leave'
                      )}
                      {createAttendanceBadge(
                        session.scanCounts.human_case || session.scanCounts.HUMAN_CASE || 0,
                        'heart',
                        '#ec4899',
                        t('human_case') || 'Human Case'
                      )}
                    </div>
                  )}
                  
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
                    {session.scanCounts && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6b7280', fontWeight: 600 }}>
                        {getThemedIcon('ui', 'users', 12, theme)}
                        {session.scanCounts.total || 0} {t('scans') || 'scans'}
                      </span>
                    )}
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
              <div style={{ fontSize: 13, color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                {t('select_session') || 'Select a session to view attendance details'}
              </div>
            </div>
          )}
          {selectedSession && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontWeight: 700, 
                    fontSize: 16, 
                    marginBottom: '0.25rem',
                    color: theme === 'dark' ? '#f9fafb' : '#111827'
                  }}>
                    {selectedSession.className || classes.find(c => c.id === selectedSession.classId)?.name || selectedSession.classId}
                  </div>
                  {selectedSession.instructorName && (
                    <div style={{ 
                      fontSize: 11, 
                      color: 'var(--muted)', 
                      marginBottom: '0.25rem' 
                    }}>
                      {getThemedIcon('ui', 'user', 12, theme)}
                      {selectedSession.instructorName}
                    </div>
                  )}
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.35rem 0.75rem',
                    background: marks.length > 0 ? `${actualPrimaryColor}15` : 'rgba(107, 114, 128, 0.1)',
                    border: `1px solid ${marks.length > 0 ? actualPrimaryColor : '#6b7280'}`,
                    borderRadius: 6,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    color: marks.length > 0 ? actualPrimaryColor : '#6b7280'
                  }}>
                    {getThemedIcon('ui', 'users', 14, theme)}
                    <span>{marks.length} {t('scans') || 'scans'}</span>
                  </div>
                </div>
                <Button 
                  variant="success" 
                  size="small"
                  icon={getThemedIcon('ui', 'download', 14, theme)}
                  style={{ background: actualPrimaryColor, borderColor: actualPrimaryColor }}
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
                {marks.length === 0 && <div style={{ 
                    padding: '1rem', 
                    textAlign: 'center', 
                    color: theme === 'dark' ? '#9ca3af' : '#6b7280' 
                  }}>
                    {t('no_marks') || 'No attendance records'}
                  </div>}
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
                      <div key={uniqueKey} style={{ 
                      padding: '0.5rem 0.75rem', 
                      border: '1px solid var(--border)', 
                      borderRadius: 6, 
                      background: theme === 'dark' ? '#1f2937' : '#fff' 
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isEditing ? 8 : 0 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ 
                              fontWeight: 600, 
                              fontSize: 13, 
                              marginBottom: 2,
                              color: theme === 'dark' ? '#f9fafb' : '#111827'
                            }}>
                              {mark.userName}
                            </div>
                            <div style={{ 
                              fontSize: 10, 
                              color: theme === 'dark' ? '#9ca3af' : '#6b7280' 
                            }}>
                              {mark.userEmail}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ padding: '3px 8px', borderRadius: 6, background: statusColor + '20', color: statusColor, fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap' }}>
                              {statusLabel}
                            </div>
                            {!isEditing && (
                              <button 
                              onClick={() => { setEditingMark(mark); setReason(mark.reason || ''); setFeedback(mark.feedback || ''); }} 
                              style={{ 
                                padding: '0.3rem 0.6rem', 
                                border: '1px solid var(--border)', 
                                borderRadius: 6, 
                                background: actualPrimaryColor, 
                                color: 'white', 
                                fontSize: 11, 
                                fontWeight: 600 
                              }}
                            >
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
                          <div style={{ 
                            marginTop: 8, 
                            padding: '0.75rem', 
                            background: theme === 'dark' ? '#374151' : '#f9fafb', 
                            borderRadius: 6 
                          }}>
                            <div style={{ marginBottom: 6 }}>
                              <label style={{ 
                                display: 'block', 
                                marginBottom: 3, 
                                fontSize: 10, 
                                fontWeight: 600,
                                color: theme === 'dark' ? '#f9fafb' : '#111827'
                              }}>
                                {t('status') || 'Status'}
                              </label>
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
                                style={{ background: actualPrimaryColor, borderColor: actualPrimaryColor }}
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
                                style={{ borderColor: actualPrimaryColor, color: actualPrimaryColor }}
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
