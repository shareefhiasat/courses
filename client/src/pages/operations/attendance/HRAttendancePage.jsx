import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { info, error, warn, debug } from '@services/utils/logger.js';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { Button, Select, DatePicker, Tooltip, AttendanceTypeSelect, Slider } from '@ui';
import { useTheme } from '@contexts/ThemeContext';
import { useColorTheme } from '@contexts/ColorThemeContext';
import { useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { getThemedIcon } from '@constants/iconTypes';
import { ATTENDANCE_STATUS, ATTENDANCE_STATUS_LABELS } from '@constants/attendanceTypes';
import { getPrograms, getSubjects } from '@services/business/programService';
import { getClasses } from '@services/business/classService';
import { getAttendanceStats, getAttendanceMarksForExport, getAllAttendanceSessions, updateAttendanceMark, getAttendanceMarksCount } from '@services/business/attendanceService';
import { getUsers, getUserById } from '@services/business/userService';
import { getAttendanceIcon, createAttendanceBadge } from '@constants/iconTypes';
import { getQatarNow, formatQatarDateOnly, formatQatarStandard } from '@utils/qatarDate';

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
  const [scanFilter, setScanFilter] = useState(null);
  const [scanFilterMode, setScanFilterMode] = useState('range'); // Always range mode
  const [scanFrom, setScanFrom] = useState(0);
  const [scanTo, setScanTo] = useState(50);
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
    info('[HRAttendance] loadSessions called with filters:', {
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
      
      info('[HRAttendance] Fetched sessions count:', data.length);
      
      // Log sample session data structure for debugging
      if (data.length > 0) {
        info('[HRAttendance] Sample session data:', {
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
        
        // Get class name and term/year info
        if (session.classId) {
          const classItem = classes.find(c => (c.id || c.docId) === session.classId);
          if (classItem) {
            className = classItem.name || classItem.code || session.classId;
            // Enrich with class term and year for filtering
            session.classTerm = classItem.term;
            // Use separate year field if available, otherwise extract from combined term
            session.classYear = classItem.year || (classItem.term && classItem.term.includes(' ') ? classItem.term.split(' ')[1] : undefined);
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
            warn('Failed to get instructor name:', err);
          }
        }
        
        // Get scan counts
        try {
          const countResult = await getAttendanceMarksCount(session.id);
          if (countResult.success) {
            scanCounts = countResult.data;
          }
        } catch (err) {
          warn('Failed to get scan counts:', err);
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
      info('[HRAttendance] Starting with enriched sessions count:', filtered.length);
      
      // Filter by program
      if (programFilter && programFilter !== 'all') {
        info('[HRAttendance] Applying program filter:', programFilter);
        filtered = filtered.filter(s => {
          if (!s.classId) return false;
          const classItem = classes.find(c => (c.id || c.docId) === s.classId);
          if (!classItem || !classItem.subjectId) return false;
          const subject = subjects.find(sub => (sub.docId || sub.id) === classItem.subjectId);
          if (!subject) return false;
          return (subject.programId || '') === programFilter;
        });
        info('[HRAttendance] After program filter count:', filtered.length);
      }
      
      // Filter by subject
      if (subjectFilter && subjectFilter !== 'all') {
        info('[HRAttendance] Applying subject filter:', subjectFilter);
        filtered = filtered.filter(s => {
          if (!s.classId) return false;
          const classItem = classes.find(c => (c.id || c.docId) === s.classId);
          if (!classItem) return false;
          return (classItem.subjectId || '') === subjectFilter;
        });
        info('[HRAttendance] After subject filter count:', filtered.length);
      }
      
      // Filter by class
      if (classFilter && classFilter !== 'all') {
        info('[HRAttendance] Applying class filter:', classFilter);
        filtered = filtered.filter(s => s.classId === classFilter);
        info('[HRAttendance] After class filter count:', filtered.length);
      }
      
      // Filter by year
      if (yearFilter && yearFilter !== 'all') {
        info('[HRAttendance] Applying year filter:', yearFilter);
        
        filtered = filtered.filter(s => {
          // Check classYear field first, then fallback to classTerm field
          if (s.classYear) {
            if (String(s.classYear) === yearFilter) {
              info('[HRAttendance] Session matched by classYear:', s.id, s.classYear);
              return true;
            }
          } else if (s.classTerm && s.classTerm.includes(' ')) {
            const parts = s.classTerm.split(' ');
            if (parts.length > 1 && parts[parts.length - 1] === yearFilter) {
              info('[HRAttendance] Session matched by classTerm:', s.id, s.classTerm);
              return true;
            }
          }
          
          // Check createdAt date year
          if (s.createdAt) {
            const createdDate = s.createdAt?.toDate ? s.createdAt.toDate() : new Date(s.createdAt || 0);
            const createdYear = String(createdDate.getFullYear());
            if (createdYear === yearFilter) {
              info('[HRAttendance] Session matched by createdAt year:', s.id, createdYear);
              return true;
            }
          }
          
          return false;
        });
        info('[HRAttendance] After year filter count:', filtered.length);
      } else {
        info('[HRAttendance] Year filter is "all", not applying year filter');
      }
      
      // Filter by term
      if (termFilter && termFilter !== 'all') {
        info('[HRAttendance] Applying term filter:', termFilter);
        
        filtered = filtered.filter(s => {
          if (!s.classTerm) return false;
          // For separate term field, use it directly
          // For combined term field, extract the first part
          const termPart = s.classTerm.includes(' ') ? s.classTerm.split(' ')[0] : s.classTerm;
          const matches = termPart === termFilter;
          if (matches) {
            info('[HRAttendance] Session matched by term:', s.id, s.classTerm, 'termPart:', termPart);
          }
          return matches;
        });
        info('[HRAttendance] After term filter count:', filtered.length);
      } else {
        info('[HRAttendance] Term filter is "all", not applying term filter');
      }
      if (dateFrom) {
        info('[HRAttendance] Applying dateFrom filter:', dateFrom);
        const from = new Date(dateFrom);
        filtered = filtered.filter(s => {
          const createdAt = s.createdAt?.toDate ? s.createdAt.toDate() : new Date(s.createdAt || 0);
          return createdAt >= from;
        });
        info('[HRAttendance] After dateFrom filter count:', filtered.length);
      } else {
        info('[HRAttendance] dateFrom is empty, not applying dateFrom filter');
      }
      if (dateTo) {
        info('[HRAttendance] Applying dateTo filter:', dateTo);
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        filtered = filtered.filter(s => {
          const createdAt = s.createdAt?.toDate ? s.createdAt.toDate() : new Date(s.createdAt || 0);
          return createdAt <= to;
        });
        info('[HRAttendance] After dateTo filter count:', filtered.length);
      } else {
        info('[HRAttendance] dateTo is empty, not applying dateTo filter');
      }

      // Filter by attendance status (filter sessions that contain students with the selected attendance type)
      if (statusFilter && statusFilter !== 'all') {
        info('[HRAttendance] Applying attendance status filter:', statusFilter);
        
        filtered = filtered.filter(session => {
          // Get the attendance counts for this session
          const counts = session.scanCounts || {};
          
          // Check if this session has any students with the selected status
          let hasStatusMatch = false;
          
          switch (statusFilter) {
            case ATTENDANCE_STATUS.PRESENT:
              hasStatusMatch = (counts.present || counts.PRESENT || 0) > 0;
              break;
            case ATTENDANCE_STATUS.LATE:
              hasStatusMatch = (counts.late || counts.LATE || 0) > 0;
              break;
            case ATTENDANCE_STATUS.ABSENT_NO_EXCUSE:
              hasStatusMatch = ((counts.absent_no_excuse || counts.absent || 0) + (counts.ABSENT_NO_EXCUSE || 0)) > 0;
              break;
            case ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE:
              hasStatusMatch = (counts.absent_with_excuse || counts.ABSENT_WITH_EXCUSE || 0) > 0;
              break;
            case ATTENDANCE_STATUS.EXCUSED_LEAVE:
              hasStatusMatch = (counts.excused_leave || counts.EXCUSED_LEAVE || 0) > 0;
              break;
            case ATTENDANCE_STATUS.HUMAN_CASE:
              hasStatusMatch = (counts.human_case || counts.HUMAN_CASE || 0) > 0;
              break;
            default:
              hasStatusMatch = false;
          }
          
          if (hasStatusMatch) {
            info('[HRAttendance] Session matched by attendance status:', session.id, 'statusFilter:', statusFilter);
          }
          
          return hasStatusMatch;
        });
        info('[HRAttendance] After status filter count:', filtered.length);
      } else {
        info('[HRAttendance] Status filter is "all", not applying status filter');
      }

      // Filter by scan count (always range mode)
      if (scanFrom > 0 || scanTo < 50) {
        info('[HRAttendance] Applying scan range filter:', scanFrom, 'to', scanTo);
        
        filtered = filtered.filter(session => {
          const totalScans = session.scanCounts?.total || 0;
          return totalScans >= scanFrom && totalScans <= scanTo;
        });
        
        info('[HRAttendance] After scan range filter count:', filtered.length);
      } else {
        info('[HRAttendance] Scan filter is not active, not applying scan filter');
      }

      // Check for expired sessions and auto-close them
      const now = getQatarNow();
      const sessionDurationMinutes = 15; // Default session duration
      const expiredSessions = [];
      
      filtered.forEach(session => {
        if (session.status === 'open') {
          const createdAt = session.createdAt?.toDate ? session.createdAt.toDate() : new Date(session.createdAt || 0);
          const qatarCreatedAt = new Date(createdAt.getTime() + (3 * 60 * 60 * 1000));
          const elapsedMinutes = (now - qatarCreatedAt) / (1000 * 60);
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
                    session.classYear = classItem.year || (classItem.term && classItem.term.includes(' ') ? classItem.term.split(' ')[1] : undefined);
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
              warn('Failed to enrich session:', err);
            }
            return session;
          }));
        
        filtered = reEnriched;
        
        // Re-apply filters
        if (programFilter && programFilter !== 'all') {
          filtered = filtered.filter(s => {
            if (!s.classId) return false;
            const classItem = classes.find(c => (c.id || c.docId) === s.classId);
            if (!classItem || !classItem.subjectId) return false;
            const subject = subjects.find(sub => (sub.docId || sub.id) === classItem.subjectId);
            if (!subject) return false;
            return (subject.programId || '') === programFilter;
          });
        }
        if (subjectFilter && subjectFilter !== 'all') {
          filtered = filtered.filter(s => {
            if (!s.classId) return false;
            const classItem = classes.find(c => (c.id || c.docId) === s.classId);
            if (!classItem) return false;
            return (classItem.subjectId || '') === subjectFilter;
          });
        }
        if (classFilter && classFilter !== 'all') {
          filtered = filtered.filter(s => s.classId === classFilter);
        }
        if (yearFilter && yearFilter !== 'all') {
          filtered = filtered.filter(s => {
            // Check classYear field
            if (s.classYear && String(s.classYear) === yearFilter) {
              return true;
            }
            
            // Check classTerm field for year in term like "Fall 2025"
            if (s.classTerm) {
              const parts = s.classTerm.split(' ');
              if (parts.length > 1 && parts[parts.length - 1] === yearFilter) {
                return true;
              }
            }
            
            // Check createdAt date year
            if (s.createdAt) {
              const createdDate = s.createdAt?.toDate ? s.createdAt.toDate() : new Date(s.createdAt || 0);
              const createdYear = String(createdDate.getFullYear());
              if (createdYear === yearFilter) {
                return true;
              }
            }
            
            return false;
          });
        }
        if (termFilter && termFilter !== 'all') {
          filtered = filtered.filter(s => {
            if (!s.classTerm) return false;
            // For separate term field, use it directly
            // For combined term field, extract the first part
            const termPart = s.classTerm.includes(' ') ? s.classTerm.split(' ')[0] : s.classTerm;
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
      console.log('[HRAttendance] Final sessions set:', filtered.length, 'sessions');
      console.log('[HRAttendance] Final filter values:', {
        programFilter,
        subjectFilter,
        classFilter,
        yearFilter,
        termFilter,
        dateFrom,
        dateTo
      });
      info('[HRAttendance] Final sessions set:', filtered.length, 'sessions');
      info('[HRAttendance] Final filter values:', {
        programFilter,
        subjectFilter,
        classFilter,
        yearFilter,
        termFilter,
        dateFrom,
        dateTo
      });
    } catch (e) {
      error('[HR] Error loading sessions:', e);
    } finally {
      stopLoading();
    }
  }, [programFilter, subjectFilter, classFilter, yearFilter, termFilter, dateFrom, dateTo, statusFilter, scanFrom, scanTo, classes, subjects, startLoading, t]);

  // Load attendance sessions
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Add logging for filter changes
  useEffect(() => {
    info('[HRAttendance] Program filter changed to:', programFilter);
  }, [programFilter]);

  useEffect(() => {
    info('[HRAttendance] Subject filter changed to:', subjectFilter);
  }, [subjectFilter]);

  useEffect(() => {
    info('[HRAttendance] Class filter changed to:', classFilter);
  }, [classFilter]);

  useEffect(() => {
    info('[HRAttendance] Year filter changed to:', yearFilter);
  }, [yearFilter]);

  useEffect(() => {
    info('[HRAttendance] Term filter changed to:', termFilter);
  }, [termFilter]);

  const loadMarks = async (sessionId) => {
    console.log('🔍 [HRAttendance] loadMarks called for sessionId:', sessionId);
    
    const stopLoading = startLoading({ message: t('hr_attendance_loading_attendance_marks') });
    try {
      const result = await getAttendanceMarksForExport(sessionId);
      let data = result.success ? result.data : [];
      
      console.log('🔍 [HRAttendance] Raw attendance data loaded:', {
        sessionId,
        success: result.success,
        dataCount: data.length,
        sampleData: data.slice(0, 3).map(m => ({
          uid: m.uid,
          status: m.status,
          displayName: m.displayName,
          email: m.email,
          timestamp: m.timestamp,
          createdAt: m.createdAt
        }))
      });

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
      console.log('🔍 [HRAttendance] Status filter debugging:', {
        statusFilter,
        totalMarks: enriched.length,
        sampleMarks: enriched.slice(0, 5).map(m => ({
          uid: m.uid,
          status: m.status,
          displayName: m.displayName,
          email: m.email
        }))
      });
      
      if (statusFilter && statusFilter !== 'all') {
        console.log('🔍 [HRAttendance] Applying status filter:', statusFilter);
        console.log('🔍 [HRAttendance] ATTENDANCE_STATUS constants:', ATTENDANCE_STATUS);
        
        filtered = enriched.filter(m => {
          const status = m.status || 'present';
          const matches = 
            // Handle legacy statuses
            (statusFilter === ATTENDANCE_STATUS.ABSENT_NO_EXCUSE && (status === 'absent' || status === 'absent_no_excuse')) ||
            (statusFilter === ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE && status === 'absent_with_excuse') ||
            (statusFilter === ATTENDANCE_STATUS.EXCUSED_LEAVE && (status === 'leave' || status === 'excused_leave')) ||
            // Direct match
            status === statusFilter;
          
          console.log('🔍 [HRAttendance] Mark status check:', {
            uid: m.uid,
            displayName: m.displayName,
            status: m.status,
            filter: statusFilter,
            matches
          });
          
          return matches;
        });
        
        console.log('🔍 [HRAttendance] After status filter count:', filtered.length);
      } else {
        console.log('🔍 [HRAttendance] Status filter is "all", showing all marks');
      }

      setMarks(filtered);
    } catch (e) {
      error('[HR] Error loading marks:', e);
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
      error('[HR] Error updating mark:', e);
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

      // Use Arabic headers based on language
      const headers = [
        '#',
        'رقم الطالب',
        'اسم الطالب',
        'حاضر',
        'غياب بدون عذر', 
        'غياب بعذر',
        'متأخر',
        'استئذان',
        'حالة إنسانية',
        'التاريخ',
        'الوقت',
        'الطريقة',
        'ملاحظات',
        'سجل بواسطة',
        'الطابع الزمني'
      ];
      
      const csvRows = enriched.map((r, index) => {
        const status = r.status || 'present';
        let attendanceStatus = '';
        
        // Map status to Arabic columns
        switch(status) {
          case 'present':
            attendanceStatus = 'X'; // حاضر
            break;
          case 'absent':
            attendanceStatus = ''; // غياب بدون عذر
            break;
          case 'excused':
            attendanceStatus = ''; // غياب بعذر  
            break;
          case 'late':
            attendanceStatus = ''; // متأخر
            break;
          case 'permission':
            attendanceStatus = ''; // استئذان
            break;
          case 'humanitarian':
            attendanceStatus = ''; // حالة إنسانية
            break;
          default:
            attendanceStatus = '';
        }
        
        const scanDate = (r.at && r.at.toDate ? r.at.toDate() : new Date());
        const dateStr = scanDate.toLocaleDateString('ar-SA');
        const timeStr = scanDate.toLocaleTimeString('ar-SA', { hour12: true });
        const timestamp = scanDate.toLocaleString('ar-SA');
        
        return [
          index + 1,
          r.uid || '',
          r.userName || '',
          attendanceStatus, // حاضر column
          '', // غياب بدون عذر column
          '', // غياب بعذر column  
          '', // متأخر column
          '', // استئذان column
          '', // حالة إنسانية column
          dateStr, // التاريخ
          timeStr, // الوقت
          'إجراء سريع', // الطريقة
          'Quick Present', // ملاحظات
          r.updatedBy || '', // marked by
          timestamp // الطابع الزمني
        ];
      });
      const csv = [headers.join(','), ...csvRows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hr_attendance_${sessionId}_${formatQatarDateOnly(getQatarNow())}.csv`;
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
        {/* Row 1: Program, Subject, Class */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, marginBottom: 8 }}>
          <div>
            <Select
              searchable
              value={programFilter}
              onChange={(e) => {
                info('[HRAttendance] Program filter changing from:', programFilter, 'to:', e.target.value);
                setProgramFilter(e.target.value);
              }}
              options={[
                { value: 'all', label: 'All Programs' },
                ...programs.map(p => ({
                  value: p.docId || p.id,
                  label: p.nameEn || p.nameAr || p.code || p.docId
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
                info('[HRAttendance] Subject filter changing from:', subjectFilter, 'to:', e.target.value);
                setSubjectFilter(e.target.value);
              }}
              options={[
                { value: 'all', label: 'All Subjects' },
                ...subjects
                  .filter(s => programFilter === 'all' || s.programId === programFilter)
                  .map(s => ({
                    value: s.docId || s.id,
                    label: `${s.code || ''} - ${s.nameEn || s.nameAr || s.docId}`
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
                info('[HRAttendance] Class filter changing from:', classFilter, 'to:', e.target.value);
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
        </div>
        
        {/* Row 2: Year, Term, Date From, Date To, Status */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
          <div>
            <Select
              searchable
              value={yearFilter}
              onChange={(e) => {
                info('[HRAttendance] Year filter changing from:', yearFilter, 'to:', e.target.value);
                setYearFilter(e.target.value);
              }}
              options={[
                { value: 'all', label: 'All Years' },
                ...Array.from(new Set(classes.map(c => {
                  if (c.year) return String(c.year);
                  if (c.term && c.term.includes(' ')) {
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
                info('[HRAttendance] Term filter changing from:', termFilter, 'to:', e.target.value);
                setTermFilter(e.target.value);
              }}
              options={[
                { value: 'all', label: 'All Terms' },
                ...Array.from(new Set(classes.map(c => {
                  if (c.term) {
                    // For separate term field, use it directly
                    // For combined term field, extract the first part
                    return c.term.includes(' ') ? c.term.split(' ')[0] : c.term;
                  }
                  return null;
                }).filter(Boolean))).sort().map(term => ({ value: term, label: term }))
              ]}
              fullWidth
              placeholder={t('all_terms') || 'All Terms'}
            />
          </div>
          <div>
            <DatePicker
              type="date"
              value={dateFrom ? (dateFrom.includes('/') ? new Date(dateFrom.split('/').reverse().join('-')).toISOString().split('T')[0] : dateFrom) : ''}
              onChange={(iso) => {
                info('[HRAttendance] DateFrom changing from:', dateFrom, 'to:', iso ? new Date(iso).toLocaleDateString('en-CA') : '');
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
                info('[HRAttendance] DateTo changing from:', dateTo, 'to:', iso ? new Date(iso).toLocaleDateString('en-CA') : '');
                setDateTo(iso ? new Date(iso).toLocaleDateString('en-CA') : '');
              }}
              placeholder={t('to_date') || 'To Date'}
              fullWidth
            />
          </div>
          <div>
            <AttendanceTypeSelect
              value={statusFilter}
              onChange={(e) => {
                info('[HRAttendance] Status filter changing from:', statusFilter, 'to:', e.target.value);
                setStatusFilter(e.target.value);
              }}
              fullWidth
            />
          </div>
        </div>
        
        {/* Row 3: Scan Filter */}
        <div style={{
          margin: '8px 0',
          padding: '8px',
          background: theme === 'dark' ? '#1f2937' : '#f9fafb',
          borderRadius: '8px',
          border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr auto', gap: '16px', alignItems: 'center' }}>
            {/* QR Code Icon */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              background: theme === 'dark' ? '#374151' : '#f3f4f6',
              borderRadius: '6px',
              border: `1px solid ${theme === 'dark' ? '#4b5563' : '#d1d5db'}`
            }}>
              {getThemedIcon('ui', 'qr_code', 16, theme)}
            </div>
            
            <Slider
              mode="single"
              min={0}
              max={50}
              step={1}
              value={scanFrom}
              onChange={(value) => {
                info('[HRAttendance] Scan from changing to:', value);
                setScanFrom(value);
              }}
              // label={t('scan_from') || 'From'}
              showValue={true}
            />
            <Slider
              mode="single"
              min={0}
              max={50}
              step={1}
              value={scanTo}
              onChange={(value) => {
                info('[HRAttendance] Scan to changing to:', value);
                setScanTo(value);
              }}
              // label={t('scan_to') || 'To'}
              showValue={true}
            />
            
            {/* Scan Count Chip (replaces delete icon) */}
            {(scanFrom > 0 || scanTo < 50) ? (
              <div style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                background: theme === 'dark' ? '#3b82f6' : '#2563eb',
                color: 'white',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '500',
                border: `1px solid ${theme === 'dark' ? '#2563eb' : '#1d4ed8'}`
              }}>
                {getThemedIcon('ui', 'qr_code', 12, 'white')}
                {scanFrom === scanTo 
                  ? `${scanFrom} scans` 
                  : `${scanFrom}-${scanTo} scans`
                }
              </div>
            ) : (
              <div
                onClick={() => {
                  info('[HRAttendance] Clearing scan filter');
                  setScanFrom(0);
                  setScanTo(50);
                }}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  background: theme === 'dark' ? '#374151' : '#f3f4f6',
                  border: `1px solid ${theme === 'dark' ? '#4b5563' : '#d1d5db'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke={theme === 'dark' ? '#6b7280' : '#9ca3af'}
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6"/>
                </svg>
              </div>
            )}
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
              const qatarCreatedAt = new Date(createdAt.getTime() + (3 * 60 * 60 * 1000));
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
                  
                  {/* Year and Term */}
                  {(session.classYear || session.classTerm) && (
                    <div style={{ 
                      fontSize: 11, 
                      color: 'var(--muted)', 
                      marginBottom: 4,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      flexWrap: 'wrap'
                    }}>
                      {session.classTerm && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          {getThemedIcon('ui', 'calendar', 10, theme)}
                          {session.classTerm}
                        </span>
                      )}
                    </div>
                  )}
                  
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
                        t('present') || 'Present',
                        theme
                      )}
                      {createAttendanceBadge(
                        session.scanCounts.late || session.scanCounts.LATE || 0,
                        'clock',
                        '#f59e0b',
                        t('late') || 'Late',
                        theme
                      )}
                      {createAttendanceBadge(
                        (session.scanCounts.absent_no_excuse || session.scanCounts.absent || 0) + 
                        (session.scanCounts.ABSENT_NO_EXCUSE || 0),
                        'x_circle',
                        '#ef4444',
                        t('absent_no_excuse') || 'Absent',
                        theme
                      )}
                      {createAttendanceBadge(
                        session.scanCounts.absent_with_excuse || session.scanCounts.ABSENT_WITH_EXCUSE || 0,
                        'file_text',
                        '#3b82f6',
                        t('absent_with_excuse') || 'Absent Excused',
                        theme
                      )}
                      {createAttendanceBadge(
                        session.scanCounts.excused_leave || session.scanCounts.EXCUSED_LEAVE || 0,
                        'heart',
                        '#8b5cf6',
                        t('excused_leave') || 'Excused Leave',
                        theme
                      )}
                      {createAttendanceBadge(
                        session.scanCounts.human_case || session.scanCounts.HUMAN_CASE || 0,
                        'heart',
                        '#8b5cf6',
                        t('human_case') || 'Human Case',
                        theme
                      )}
                    </div>
                  )}
                  
                  <div style={{ fontSize: 10, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {session.instructorName && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {getThemedIcon('ui', 'graduation_cap', 12, theme)}
                        {session.instructorName}
                      </span>
                    )}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {getThemedIcon('ui', 'calendar', 12, theme)}
                      {formatQatarStandard(qatarCreatedAt)}
                    </span>
                    {/* Session Duration */}
                    {(() => {
                      const startTime = qatarCreatedAt;
                      const endTime = session.closedAt ? (session.closedAt.toDate ? new Date(session.closedAt.toDate().getTime() + (3 * 60 * 60 * 1000)) : new Date(session.closedAt.getTime() + (3 * 60 * 60 * 1000))) : 
                                     (session.status === 'closed' ? qatarCreatedAt : getQatarNow());
                      const durationMs = endTime - startTime;
                      const durationMinutes = Math.max(1, Math.round(durationMs / (1000 * 60)));
                      const hours = Math.floor(durationMinutes / 60);
                      const minutes = durationMinutes % 60;
                      const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
                      
                      return (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {getThemedIcon('ui', 'clock', 12, theme)}
                          {durationText}
                        </span>
                      );
                    })()}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: session.status === 'open' ? '#10b981' : '#6b7280', fontWeight: 600 }}>
                      <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: session.status === 'open' ? '#10b981' : '#6b7280' }}></span>
                      {session.status === 'open' ? (t('active_session') || 'Active Session') : (t('ended') || 'Ended')}
                    </span>
                    {session.scanCounts && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6b7280', fontWeight: 600 }}>
                        {getThemedIcon('ui', 'qr_code', 12, theme)}
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
                      {getThemedIcon('ui', 'graduation_cap', 12, theme)}
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
                    {getThemedIcon('ui', 'qr_code', 14, theme)}
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
                      <div style={{ fontSize: 18, fontWeight: 700, color: color, lineHeight: 1.2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        {getThemedIcon('ui', getAttendanceIcon(key), 16, color)}
                        {count}
                      </div>
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
                                  { 
                                    value: ATTENDANCE_STATUS.PRESENT, 
                                    label: `${ATTENDANCE_STATUS_LABELS.present.en} - ${ATTENDANCE_STATUS_LABELS.present.ar}`,
                                    icon: getThemedIcon('ui', 'check', 16, '#10b981')
                                  },
                                  { 
                                    value: ATTENDANCE_STATUS.LATE, 
                                    label: `${ATTENDANCE_STATUS_LABELS.late.en} - ${ATTENDANCE_STATUS_LABELS.late.ar}`,
                                    icon: getThemedIcon('ui', 'clock', 16, '#f59e0b')
                                  },
                                  { 
                                    value: ATTENDANCE_STATUS.ABSENT_NO_EXCUSE, 
                                    label: `${ATTENDANCE_STATUS_LABELS.absent_no_excuse.en} - ${ATTENDANCE_STATUS_LABELS.absent_no_excuse.ar}`,
                                    icon: getThemedIcon('ui', 'x_circle', 16, '#ef4444')
                                  },
                                  { 
                                    value: ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE, 
                                    label: `${ATTENDANCE_STATUS_LABELS.absent_with_excuse.en} - ${ATTENDANCE_STATUS_LABELS.absent_with_excuse.ar}`,
                                    icon: getThemedIcon('ui', 'x_circle', 16, '#ef4444')
                                  },
                                  { 
                                    value: ATTENDANCE_STATUS.EXCUSED_LEAVE, 
                                    label: `${ATTENDANCE_STATUS_LABELS.excused_leave.en} - ${ATTENDANCE_STATUS_LABELS.excused_leave.ar}`,
                                    icon: getThemedIcon('ui', 'x_circle', 16, '#ef4444')
                                  },
                                  { 
                                    value: ATTENDANCE_STATUS.HUMAN_CASE, 
                                    label: `${ATTENDANCE_STATUS_LABELS.human_case.en} - ${ATTENDANCE_STATUS_LABELS.human_case.ar}`,
                                    icon: getThemedIcon('ui', 'heart', 16, '#8b5cf6')
                                  }
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
                                  // Refresh sessions to update the left side
                                  await loadSessions();
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
