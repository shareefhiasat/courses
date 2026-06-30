import React, { useEffect, useMemo, useRef, useState, useCallback, useLayoutEffect } from 'react';
import Joyride from 'react-joyride';
import TourTooltip from '@ui/TourTooltip/TourTooltip';
import { info, error, warn, debug } from '@services/utils/logger.js';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { createSession, listenAttendanceSession, closeAttendanceSession } from '@services/business/attendanceService';
import {
  getAttendanceConfigDoc,
  saveAttendanceConfigDoc,
  closeAttendanceSessionLocal,
  updateAttendanceSessionLateMode,
  listenAttendanceMarksCount,
  getAttendanceMarksForExport,
} from '@services/business/attendanceService';
import QRCode from 'qrcode';
import { getThemedIcon } from '@constants/iconTypes';
import { Button, Select, ProgramsSelect, Badge, Modal, Textarea, UserSelect } from '@ui';
import { useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { getPrograms, getSubjects } from '@services/business/programService';
import { getClasses } from '@services/business/classService';
import { getUsers } from '@services/business/userService';
import { ROLE_STRINGS } from '@constants';
import { ClipboardList, Play, Smartphone, CheckCircle, Copy, ListOrdered, QrCode, Settings, Clock, Users, Square, AlertCircle } from 'lucide-react';
import { getLocalizedClassName } from '@utils/schedulingDisplayUtils';
import { getLocalizedUserName } from '@utils/localizedUserName';
import PortalTooltip from '@ui/PortalTooltip';
import { exportGeneric } from '@services/export/excelExportService.js';
import { submitAttendanceReport } from '@services/business/workflowDocumentService.js';
import CollapsibleSection from '@components/scheduling/CollapsibleSection';
import SchedulingStatCard from '@components/scheduling/SchedulingStatCard';
import styles from './AttendancePage.module.css';

const AttendancePage = () => {
  const { user, isAdmin, isInstructor, isHR, loading: authLoading } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const { startLoading } = useGlobalLoading();
  const [classId, setClassId] = useState(() => {
    try { return localStorage.getItem('att_instructor_class') || ''; } catch { return ''; }
  });
  const [session, setSession] = useState(null);
  const [sessionId, setSessionId] = useState('');
  const [token, setToken] = useState('');
  const [manualCode, setManualCode] = useState('');
  const qrCanvasRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [cfg, setCfg] = useState({ rotationSeconds: 30, sessionMinutes: 15, strictDeviceBinding: true, lateMode: false });
  const [savingCfg, setSavingCfg] = useState(false);
  const [classOptions, setClassOptions] = useState([]);
  const [err, setErr] = useState('');
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [programFilter, setProgramFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [termFilter, setTermFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [instructorFilter, setInstructorFilter] = useState('');
  const [classQuickFilter, setClassQuickFilter] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [qrSize, setQrSize] = useState(() => {
    try { return parseInt(localStorage.getItem('attendance_qr_size') || '200', 10); } catch { return 200; }
  });
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [submitComments, setSubmitComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Guided Tour ────────────────────────────────────────────────────────────
  const [runTour, setRunTour] = useState(false);
  const [tourSteps, setTourSteps] = useState([]);
  const tourSeenKey = `attendanceTourSeen_${lang}`;

  useEffect(() => {
    setTourSteps([
      { target: '[data-tour="attendance-class-section"]', content: t('tour.attendance_class_section'), disableBeacon: true, placement: 'bottom' },
      { target: '[data-tour="attendance-settings"]', content: t('tour.attendance_settings'), disableBeacon: true, placement: 'bottom' },
      { target: '[data-tour="attendance-start-btn"]', content: t('tour.attendance_start_btn'), disableBeacon: true, placement: 'bottom' },
      { target: '[data-tour="attendance-qr-panel"]', content: t('tour.attendance_qr_panel'), disableBeacon: true, placement: 'bottom' },
      { target: '[data-tour="attendance-manual-code"]', content: t('tour.attendance_manual_code'), disableBeacon: true, placement: 'bottom' },
      { target: '[data-tour="attendance-copy-link"]', content: t('tour.attendance_copy_link'), disableBeacon: true, placement: 'bottom' },
      { target: '[data-tour="attendance-export"]', content: t('tour.attendance_export'), disableBeacon: true, placement: 'bottom' },
      { target: '[data-tour="attendance-submit-hr"]', content: t('tour.attendance_submit_hr'), disableBeacon: true, placement: 'bottom' },
      { target: '[data-tour="attendance-late-mode"]', content: t('tour.attendance_late_mode'), disableBeacon: true, placement: 'bottom' },
      { target: '[data-tour="attendance-active-banner"]', content: t('tour.attendance_active_banner'), disableBeacon: true, placement: 'bottom' },
      { target: '[data-tour="attendance-guidelines"]', content: t('tour.attendance_guidelines'), disableBeacon: true, placement: 'top' },
    ]);
  }, [lang, t]);

  useEffect(() => {
    const start = () => setRunTour(true);
    window.addEventListener('app:joyride', start);
    window.addEventListener('app:help', start);
    return () => { window.removeEventListener('app:joyride', start); window.removeEventListener('app:help', start); };
  }, []);

  useEffect(() => {
    try { if (!localStorage.getItem(tourSeenKey)) setRunTour(true); } catch {}
  }, [tourSeenKey]);

  const handleTourCallback = useCallback((data) => {
    const { status, action } = data || {};
    if (status === 'finished' || status === 'skipped' || action === 'close') {
      setRunTour(false);
      try { localStorage.setItem(tourSeenKey, 'true'); } catch {}
    }
  }, [tourSeenKey]);
  const TourTooltipComponent = useMemo(() => TourTooltip({ tourSeenKey }), [tourSeenKey]);
  // ──────────────────────────────────────────────────────────────────────────

  const selectedClass = useMemo(() => classOptions.find(c => (c.id||c.docId) === classId), [classOptions, classId]);

  // Extract unique terms, years, instructors for filters
  const terms = useMemo(() => [...new Set(classOptions.map(c => c.term).filter(Boolean))], [classOptions]);
  const years = useMemo(() => [...new Set(classOptions.map(c => c.year).filter(Boolean))], [classOptions]);
  const instructors = useMemo(() => {
    const map = new Map();
    classOptions.forEach(c => {
      const id = c.instructorId || c.instructor?.id;
      if (!id) return;
      if (map.has(id)) return;
      const inst = c.instructor || {};
      const name = inst.displayName || [inst.firstName, inst.lastName].filter(Boolean).join(' ') || inst.name || `Instructor ${id}`;
      map.set(id, { id, name });
    });
    return [...map.values()];
  }, [classOptions]);

  const getInstructorName = useCallback((id) => {
    if (!id) return '';
    const inst = instructors.find(i => String(i.id) === String(id));
    if (inst) return inst.name;
    const user = allUsers.find(u => String(u.docId || u.id) === String(id));
    return user ? getLocalizedUserName(user, lang, `Instructor ${id}`) : String(id);
  }, [instructors, allUsers, lang]);

  // DEBUG: Log data changes
  useEffect(() => {
    debug('[Attendance] Data state:', {
      classOptionsCount: classOptions.length,
      programsCount: programs.length,
      subjectsCount: subjects.length,
      terms: terms,
      years: years,
      instructorCount: instructors.length
    });
  }, [classOptions, programs, subjects, terms, years, instructors]);

  // DEBUG: Log filter changes
  useEffect(() => {
    debug('[Attendance] Filter state:', {
      programFilter,
      subjectFilter,
      classFilter,
      termFilter,
      yearFilter,
      instructorFilter
    });
  }, [programFilter, subjectFilter, classFilter, termFilter, yearFilter, instructorFilter]);

  // Filtered classes based on program/subject/class/term/year/instructor
  const filteredClasses = useMemo(() => {
    debug('[Attendance] Filtering classes:', { 
      totalClasses: classOptions.length, 
      filters: {
        programFilter,
        subjectFilter,
        classFilter,
        termFilter,
        yearFilter,
        instructorFilter
      },
      programFilterType: typeof programFilter,
      programFilterValue: programFilter
    });
    
    const filtered = classOptions.filter(c => {
      // Log each class being evaluated
      const classInfo = {
        id: c.id || c.docId,
        name: c.name || c.code,
        subjectId: c.subjectId,
        term: c.term,
        year: c.year,
        instructor: c.instructorId || c.instructor
      };
      
      // Filter by program - handle both string and object formats
      if (programFilter && programFilter !== '') {
        // Extract value if it's an object - handle multiple possible object structures
        let programValue;
        if (typeof programFilter === 'object') {
          programValue = programFilter.value || programFilter.id || programFilter.docId || programFilter.target?.value;
        } else {
          programValue = programFilter;
        }
        
        debug('[Attendance] Program filter processing:', {
          originalValue: programFilter,
          extractedValue: programValue,
          type: typeof programFilter
        });
        
        if (!c.subjectId) {
          debug('[Attendance] Class rejected: no subjectId', classInfo);
          return false;
        }
        const subject = subjects.find(s => (s.docId || s.id) === c.subjectId);
        if (!subject || String(subject.programId) !== String(programValue)) {
          debug('[Attendance] Class rejected: program mismatch', { 
            ...classInfo, 
            programFilter: programValue, 
            subjectProgramId: subject?.programId,
            programFilterType: typeof programFilter
          });
          return false;
        }
      }
      
      // Filter by subject
      if (subjectFilter && String(c.subjectId) !== String(subjectFilter)) {
        debug('[Attendance] Class rejected: subject mismatch', { ...classInfo, subjectFilter });
        return false;
      }
      
      // Filter by class
      if (classFilter) {
        const cId = c.id || c.docId;
        if (String(cId) !== String(classFilter)) {
          debug('[Attendance] Class rejected: class ID mismatch', { ...classInfo, classFilter });
          return false;
        }
      }
      
      // Filter by term - handle both full format and season name
      if (termFilter) {
        const classTerm = c.term || '';
        const matchesTerm = classTerm.toLowerCase().includes(termFilter.toLowerCase()) || 
                           termFilter.toLowerCase().includes(classTerm.toLowerCase());
        if (!matchesTerm) {
          debug('[Attendance] Class rejected: term mismatch', { ...classInfo, termFilter, classTerm });
          return false;
        }
      }
      
      // Filter by year
      if (yearFilter && c.year !== yearFilter) {
        debug('[Attendance] Class rejected: year mismatch', { ...classInfo, yearFilter });
        return false;
      }
      
      // Filter by instructor - only apply if not 'all' and not empty
      if (instructorFilter && instructorFilter !== 'all' && instructorFilter !== '') {
        if (c.instructorId !== instructorFilter && c.instructor !== instructorFilter) {
          debug('[Attendance] Class rejected: instructor mismatch', { ...classInfo, instructorFilter });
          return false;
        }
      }
      
      debug('[Attendance] Class passed all filters:', classInfo);
      return true;
    });
    
    debug('[Attendance] Filtered result:', { 
      inputCount: classOptions.length, 
      outputCount: filtered.length,
      filtered: filtered.map(c => ({
        id: c.id || c.docId,
        name: c.name || c.code,
        subjectId: c.subjectId,
        term: c.term,
        year: c.year
      }))
    });

    const quick = classQuickFilter.trim().toLowerCase();
    if (quick) {
      return filtered.filter(c => {
        const label = getLocalizedClassName(c, lang, c.name || c.code || '');
        const code = (c.code || '').toLowerCase();
        const term = (c.term || '').toLowerCase();
        const year = String(c.year || '');
        const instName = (getInstructorName(c.instructorId || c.instructor?.id) || '').toLowerCase();
        return label.toLowerCase().includes(quick)
          || code.includes(quick)
          || term.includes(quick)
          || year.includes(quick)
          || instName.includes(quick);
      });
    }

    return filtered;
  }, [classOptions, subjects, programFilter, subjectFilter, classFilter, termFilter, yearFilter, instructorFilter, classQuickFilter, lang, getInstructorName]);

  // Load classes, programs, subjects (authorized roles only)
  useEffect(() => {
    if (!user) return;
    if (!(isAdmin || isInstructor || isHR)) return;
    debug('[Attendance] Starting data load for user:', { uid: user.uid, email: user.email, roles: { isAdmin, isInstructor, isHR } });
    (async () => {
      try {
        debug('[Attendance] Fetching data...');
        const [classesResult, programsRes, subjectsRes, usersRes] = await Promise.all([
          getClasses(),
          getPrograms(),
          getSubjects(),
          (isAdmin || isHR) ? getUsers({ limit: 500 }) : Promise.resolve({ success: false })
        ]);
        
        debug('[Attendance] Raw data results:', {
          classesResult: classesResult.success ? `SUCCESS: ${classesResult.data?.length || 0} classes` : `FAILED: ${classesResult.error}`,
          programsRes: programsRes.success ? `SUCCESS: ${programsRes.data?.length || 0} programs` : `FAILED: ${programsRes.error}`,
          subjectsRes: subjectsRes.success ? `SUCCESS: ${subjectsRes.data?.length || 0} subjects` : `FAILED: ${subjectsRes.error}`
        });
        
        const opts = classesResult.success ? classesResult.data : [];
        debug('[Attendance] Sample classes data:', opts.slice(0, 3).map(c => ({
          id: c.id || c.docId,
          name: c.name || c.code,
          subjectId: c.subjectId,
          term: c.term,
          year: c.year,
          instructor: c.instructorId || c.instructor
        })));
        
        setClassOptions(opts);
        if (programsRes.success) {
          setPrograms(programsRes.data || []);
          debug('[Attendance] Sample programs data:', programsRes.data?.slice(0, 3).map(p => ({
            id: p.docId || p.id,
            name: p.nameEn || p.nameAr || p.name
          })));
        }
        if (subjectsRes.success) {
          setSubjects(subjectsRes.data || []);
          debug('[Attendance] Sample subjects data:', subjectsRes.data?.slice(0, 3).map(s => ({
            id: s.docId || s.id,
            name: s.nameEn || s.nameAr || s.name,
            programId: s.programId
          })));
        }
        if (usersRes.success) {
          setAllUsers(usersRes.data || []);
        }
        if (!classId && opts.length === 1) setClassId(opts[0].id);
        setInitialLoading(false);
        debug('[Attendance] Data load completed successfully');
      } catch (e) {
        error('[Attendance] Data load failed:', e);
        if (e?.code !== 'permission-denied') error('[Attendance] load data:', e);
      }
    })();
  }, [user, isAdmin, isInstructor, isHR, classId]);

  // Load config (admin only)
  useEffect(() => {
    if (!user || !isAdmin) return;
    (async () => {
      try {
        const data = await getAttendanceConfigDoc();
        if (data) {
          setCfg({ 
            rotationSeconds: data.rotationSeconds ?? 30, 
            sessionMinutes: data.sessionMinutes ?? 15, 
            strictDeviceBinding: data.strictDeviceBinding !== false,
            lateMode: data.lateMode || false
          });
        }
      } catch (e) {
        if (e?.code !== 'permission-denied') error('[Attendance] load cfg:', e);
      }
    })();
  }, [user, isAdmin]);

  // Listen to attendance count for active session
  useEffect(() => {
    if (!sessionId) {
      setAttendanceCount(0);
      return;
    }
    const unsubscribe = listenAttendanceMarksCount(sessionId, (count) => {
        setAttendanceCount(count);
      });
    return () => unsubscribe();
  }, [sessionId]);

  const startSession = async () => {
    if (!user) { setErr(t('attendance_please_sign_in')); return; }
    if (!classId) { setErr(t('attendance_please_select_a_class')); return; }
    setLoading(true);
    try {
      setErr('');
      debug('[Attendance] startSession clicked', { classId, uid: user?.uid });
      const { id } = await createSession({ classId, createdBy: user.uid });
      info('[Attendance] createSession returned', { id });
      if (!id) throw new Error(t('attendance_no_session_id_returned'));
      setSession({ id });
      setSessionId(id);
      setSessionStartTime(Date.now());
    } catch(e) {
      setErr(e?.message || t('attendance_failed_to_start_session'));
    } finally {
      setLoading(false);
    }
  };

  // Listen to live token updates
  useEffect(() => {
    if (!sessionId) return;
    const unsub = listenAttendanceSession(sessionId, (s) => {
      if (!s || s.status !== 'open') return;
      const t = s.token || '';
      setToken(t);
      // Generate 6-digit code from token
      if (t) {
        const hash = t.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const code = String(hash % 1000000).padStart(6, '0');
        setManualCode(code);
      }
    });
    return () => unsub && unsub();
  }, [sessionId]);

  // Render QR on token change
  useEffect(() => {
    const canvas = qrCanvasRef.current;
    if (!canvas || !token) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const payload = `${origin}/my-attendance?sid=${sessionId}&t=${encodeURIComponent(token)}`;
    QRCode.toCanvas(canvas, payload, { width: qrSize, errorCorrectionLevel: 'M' }).catch(()=>{});
  }, [token, sessionId, qrSize]);

  const endSession = async () => {
    if (!sessionId) return;
    setLoading(true);
    setErr('');
    try { 
      await closeAttendanceSession(sessionId);
      setSessionId('');
      setSession(null);
      setToken('');
      setSessionStartTime(null);
      setErr('');
    } catch (e) {
      error('[Attendance] Error ending session:', e);
      // Handle CORS or other errors gracefully
      if (e?.message?.includes('CORS') || e?.code === 'internal') {
        // Try to close session locally if backend fails
        try {
          await closeAttendanceSessionLocal(sessionId);
          setSessionId('');
          setSession(null);
          setToken('');
          setSessionStartTime(null);
          setErr(t('attendance_session_closed_locally'));
        } catch (localErr) {
          setErr(t('attendance_failed_to_end_session'));
        }
      } else {
        setErr(e?.message || t('attendance_failed_to_end_session_try_again'));
      }
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    try { localStorage.setItem('attendance_qr_size', String(qrSize)); } catch {}
  }, [qrSize]);

  const [durationDisplay, setDurationDisplay] = useState('0:00');

  // Update duration every second
  useEffect(() => {
    if (!sessionStartTime) {
      setDurationDisplay('0:00');
      return;
    }
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      setDurationDisplay(`${minutes}:${String(seconds).padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStartTime]);

  const toggleLateMode = async () => {
    if (!sessionId) return;
    try {
      const newLateMode = !cfg.lateMode;
      setCfg(v => ({ ...v, lateMode: newLateMode }));
      await updateAttendanceSessionLateMode(sessionId, newLateMode);
    } catch(e) {
      setErr(e?.message || (t('failed_to_toggle_late_mode') || 'Failed to toggle late mode'));
    }
  };

  const saveCfg = async () => {
    setSavingCfg(true);
    try {
      await saveAttendanceConfigDoc(cfg);
    } finally { setSavingCfg(false); }
  };

  const handleExportAndSubmit = async () => {
    if (!sessionId || !selectedClass) return;
    
    setShowSubmitDialog(true);
  };

  const confirmSubmission = async () => {
    if (!sessionId || !selectedClass) return;
    
    setIsSubmitting(true);
    try {
      const result = await getAttendanceMarksForExport(sessionId);
      const attendanceData = result.success ? result.data : [];
      
      const today = new Date().toISOString().split('T')[0];
      
      const submitResult = await submitAttendanceReport(attendanceData, {
        classId: selectedClass.id || selectedClass.docId,
        className: selectedClass.name || selectedClass.className,
        date: today,
        program: selectedClass.program || programFilter,
        subject: selectedClass.subject || subjectFilter,
        instructorId: user.id,
        comments: submitComments
      });

      if (submitResult.success) {
        setErr('');
        alert(`Attendance report submitted successfully! Document ID: ${submitResult.data.document.id}`);
        setShowSubmitDialog(false);
        setSubmitComments('');
      } else {
        setErr(submitResult.error || 'Submission failed');
      }
    } catch (error) {
      setErr(error.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Use GlobalLoading for initial data load
  useLayoutEffect(() => {
    if (authLoading) return;
    if (!user) return;
    if (!isAdmin && !isInstructor && !isHR) return;

    let stopped = false;
    const stopGlobalLoading = startLoading();
    const safeStop = () => {
      if (stopped) return;
      stopped = true;
      stopGlobalLoading();
    };

    // Wait for initialLoading to complete (set by the useEffect that loads classes/programs/subjects)
    const checkInterval = setInterval(() => {
      if (!initialLoading) {
        clearInterval(checkInterval);
        safeStop();
      }
    }, 100);

    return () => {
      clearInterval(checkInterval);
      safeStop();
    };
  }, [authLoading, user, isAdmin, isInstructor, isHR, initialLoading, startLoading]);

  const panelBg = theme === 'dark' ? '#1f2937' : 'var(--panel)';
  const mutedColor = theme === 'dark' ? '#9ca3af' : '#6b7280';
  const textColor = theme === 'dark' ? '#f3f4f6' : '#1f2937';

  const overviewCards = useMemo(() => [
    { value: sessionId ? durationDisplay : '—', label: t('attendance_session_duration') || 'Duration', Icon: Clock, iconColor: '#6366f1', iconBg: 'rgba(99,102,241,0.12)' },
    { value: attendanceCount, label: t('attendance_scanned') || 'Scanned', Icon: Users, iconColor: '#10b981', iconBg: 'rgba(16,185,129,0.12)' },
    { value: filteredClasses.length, label: t('attendance_classes_available') || 'Classes', Icon: ClipboardList, iconColor: '#f59e0b', iconBg: 'rgba(245,158,11,0.12)' },
    { value: selectedClass ? getLocalizedClassName(selectedClass, lang, selectedClass.name || selectedClass.code || '') : t('none') || 'None', label: t('attendance_selected_class') || 'Selected', Icon: CheckCircle, iconColor: '#800020', iconBg: 'rgba(128,0,32,0.12)' },
  ], [sessionId, durationDisplay, attendanceCount, filteredClasses.length, selectedClass, lang, t]);

  return (
    <div className="content-section" style={{ maxWidth: 1400, margin: '0 auto', padding: '1rem 1.25rem' }}>
      <Joyride
        continuous
        run={runTour}
        steps={tourSteps}
        disableScrolling={false}
        scrollOffset={100}
        scrollToFirstStep
        showSkipButton
        showProgress
        tooltipComponent={TourTooltipComponent}
        spotlightClicks={false}
        callback={handleTourCallback}
        locale={{
          back: t('tour_back') || 'Back',
          close: t('tour_close') || 'Close',
          last: t('tour_finish') || 'Finish',
          next: t('tour_next') || 'Next',
          skip: t('tour_skip') || 'Skip',
        }}
        styles={{
          options: {
            primaryColor: 'var(--color-primary, #800020)',
            textColor: theme === 'dark' ? '#e5e7eb' : '#000',
            backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
            overlayColor: 'rgba(0,0,0,0.5)',
            arrowColor: theme === 'dark' ? '#1f2937' : '#fff',
            zIndex: 10000,
          },
        }}
      />

      {err && (
        <div style={{ padding:'0.75rem 1rem', background: theme === 'dark' ? 'rgba(239,68,68,0.15)' : '#fef2f2', border:`1px solid ${theme === 'dark' ? '#7f1d1d' : '#fecaca'}`, borderRadius:8, color: theme === 'dark' ? '#fca5a5' : '#dc2626', marginBottom:16, display:'flex', alignItems:'center', gap:'0.5rem', fontSize: 'var(--font-size-sm)' }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          {err}
        </div>
      )}

      {/* Overview Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '0.5rem',
        marginBottom: '0.75rem',
      }}>
        {overviewCards.map((card) => (
          <SchedulingStatCard
            key={card.label}
            value={card.value}
            label={card.label}
            Icon={card.Icon}
            iconColor={card.iconColor}
            iconBg={card.iconBg}
            theme={theme}
          />
        ))}
      </div>

      {/* Active Session Banner */}
      {sessionId && (
        <div data-tour="attendance-active-banner" style={{
          marginBottom: 16,
          padding: '1rem 1.5rem',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          border: '2px solid #10b981',
          borderRadius: 12,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
          animation: 'pulse 2s ease-in-out infinite'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {getThemedIcon('ui', 'play_circle', 32, theme)}
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                {t('attendance_session_active')}
              </div>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                {t('attendance_session_duration')}: {durationDisplay} • {attendanceCount} {t('attendance_scanned')}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Badge style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '0.5rem 1rem', borderRadius: 8, fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
              {attendanceCount} {t('students') || 'Students'}
            </Badge>
            <button
              onClick={endSession}
              disabled={loading}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 8,
                background: 'rgba(239, 68, 68, 0.9)',
                color: 'white',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                fontSize: 'var(--font-size-sm)'
              }}
            >
              <Square size={14} />
              {t('attendance_end_session') || 'End Session'}
            </button>
          </div>
        </div>
      )}

      {/* Class Selection - Collapsible */}
      <CollapsibleSection
        title={t('attendance_class_selection')}
        icon={ClipboardList}
        defaultOpen
        storageKey="attendance-class"
        testId="attendance-class-section"
      >
        <div data-tour="attendance-class-section">
            {/* Filters */}
            <div style={{ marginBottom: 12 }}>
              {/* First Row: Program, Subject, Class */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                <ProgramsSelect
                  programs={programs}
                  subjects={subjects}
                  classes={classOptions}
                  selectedProgram={programFilter}
                  selectedSubject={subjectFilter}
                  selectedClass={classFilter}
                  selectedTerm={termFilter}
                  selectedYear={yearFilter}
                  onProgramChange={(val) => setProgramFilter(val)}
                  onSubjectChange={(val) => setSubjectFilter(val)}
                  onClassChange={(val) => setClassFilter(val)}
                  onTermChange={(val) => setTermFilter(val)}
                  onYearChange={(val) => setYearFilter(val)}
                  showTerms={false}
                  showYears={false}
                  showLabels={false}
                  style={{ flex: 1, minWidth: '270px' }}
                />
              </div>
              
              {/* Second Row: Term, Year */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ width: 'calc(50% - 4px)', minWidth: '200px' }}>
                  <Select
                    value={termFilter}
                    onChange={(e) => setTermFilter(e.target.value)}
                    options={[
                      { value: '', label: t('all_terms') || 'All Terms' },
                      { value: 'spring', label: t('spring') || 'Spring' },
                      { value: 'summer', label: t('summer') || 'Summer' },
                      { value: 'fall', label: t('fall') || 'Fall' }
                    ]}
                    placeholder={t('select_term') || 'Select Term'}
                    fullWidth
                  />
                </div>
                <div style={{ width: 'calc(50% - 4px)', minWidth: '200px' }}>
                  <Select
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                    options={[
                      { value: '', label: t('all_years') || 'All Years' },
                      ...Array.from({length: 5}, (_, i) => {
                        const year = new Date().getFullYear() - 2 + i;
                        return { value: String(year), label: String(year) };
                      })
                    ]}
                    placeholder={t('select_year') || 'Select Year'}
                    fullWidth
                  />
                </div>
              </div>
            </div>
            {(isAdmin || isHR) && allUsers.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <UserSelect
                  users={allUsers}
                  classes={classOptions}
                  value={instructorFilter}
                  onChange={(val) => setInstructorFilter(val === 'all' ? '' : (val || ''))}
                  placeholder={t('attendance_filter_by_instructor') || 'Filter by Instructor'}
                  roleFilter={[ROLE_STRINGS.INSTRUCTOR]}
                  includeAll
                  showEnrollments
                  searchable
                  fullWidth
                  theme={theme}
                />
              </div>
            )}

        {/* Quick Filter Input */}
        <div style={{ position: 'relative', marginBottom: 8 }}>
          <input
            type="text"
            value={classQuickFilter}
            onChange={(e) => setClassQuickFilter(e.target.value)}
            placeholder={t('attendance_quick_filter_classes') || 'Quick filter classes...'}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              border: `1px solid ${theme === 'dark' ? '#374151' : 'var(--border)'}`,
              borderRadius: 8,
              background: panelBg,
              color: textColor,
              fontSize: 'var(--font-size-sm)',
              outline: 'none',
            }}
          />
        </div>

        {/* Class List */}
        <div style={{ fontSize: 'var(--font-size-xs)', color: mutedColor, marginBottom:8 }}>
          {t('attendance_showing_of_classes', { shown: filteredClasses.length, total: classOptions.length })}
        </div>
        {filteredClasses.length === 0 && (
          <div style={{ padding:'1rem', textAlign:'center', color: mutedColor }}>
            {t('attendance_no_classes_found')}
          </div>
        )}
        <div style={{ display:'grid', gap:6, maxHeight:300, overflowY:'auto' }}>
          {filteredClasses.map(c => {
            const val = c.id || c.docId || '';
            const label = getLocalizedClassName(c, lang, c.name || c.code || val || '—');
            const checked = classId === val;
            return (
              <label key={val} className={styles.classOption} style={{ background: checked ? 'rgba(102,126,234,0.12)' : panelBg }} onClick={()=>{ setClassId(val); try { localStorage.setItem('att_instructor_class', val); } catch {}; }}>
                <input type="radio" name="classSelect" value={val} checked={checked} onChange={()=>{}} className={styles.classRadio} />
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, color: textColor }}>{label}</div>
                  <div style={{ fontSize:11, color: mutedColor, display:'flex', gap:8, flexWrap: 'wrap' }}>
                    {c.term && <span>{t('attendance_term_label')}: {c.term}</span>}
                    {c.year && <span>{t('attendance_year_label')}: {c.year}</span>}
                    {c.code && <span>{t('attendance_code_label')}: {c.code}</span>}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
        </div>
      </CollapsibleSection>

      {/* Attendance Settings - Collapsible (Admin only) */}
      {isAdmin && (
        <CollapsibleSection
          title={t('attendance_attendance_settings')}
          icon={Settings}
          defaultOpen={false}
          storageKey="attendance-settings"
          testId="attendance-settings"
        >
        <div data-tour="attendance-settings">
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(120px,1fr))', gap: 8, marginBottom: 8 }}>
                <div>
                  <label style={{ display:'block', marginBottom: 4, fontWeight: 600, fontSize:10, color: '#1f2937' }}>{t('attendance_rotation_seconds')}</label>
                  <input type="number" min={10} max={120} value={cfg.rotationSeconds}
                    onChange={(e)=>setCfg(v=>({ ...v, rotationSeconds: Math.max(10, Math.min(120, parseInt(e.target.value||'30',10))) }))}
                    style={{ width:'100%', padding:'0.4rem', border:'1px solid var(--border)', borderRadius:6, background:'var(--panel)', color:'inherit', fontSize: '0.8rem' }} />
                </div>
                <div>
                  <label style={{ display:'block', marginBottom: 4, fontWeight: 600, fontSize:10, color: '#1f2937' }}>{t('attendance_session_minutes')}</label>
                  <input type="number" min={5} max={180} value={cfg.sessionMinutes}
                    onChange={(e)=>setCfg(v=>({ ...v, sessionMinutes: Math.max(5, Math.min(180, parseInt(e.target.value||'15',10))) }))}
                    style={{ width:'100%', padding:'0.4rem', border:'1px solid var(--border)', borderRadius:6, background:'var(--panel)', color:'inherit', fontSize: '0.8rem' }} />
                </div>
                <div style={{ alignSelf:'end' }}>
                  <label style={{ display:'block', marginBottom: 4, fontWeight: 600, fontSize:10, color: '#1f2937' }}>{t('attendance_strict_device_binding')}</label>
                  <button onClick={()=>setCfg(v=>({ ...v, strictDeviceBinding: !v.strictDeviceBinding }))} style={{ padding:'0.4rem 0.75rem', border:'1px solid var(--border)', borderRadius:6, background: cfg.strictDeviceBinding ? 'rgba(16,185,129,0.15)' : 'transparent', color:'inherit', fontWeight:600, fontSize: '0.8rem' }}>
                    {cfg.strictDeviceBinding ? t('enabled') : t('disabled')}
                  </button>
                </div>
                <div style={{ alignSelf:'end' }}>
                  <button onClick={saveCfg} disabled={savingCfg} style={{ padding:'0.4rem 1rem', border:'none', borderRadius:6, background:'#800020', color:'white', fontWeight:600, fontSize: '0.8rem' }}>
                    {savingCfg ? t('saving') : t('attendance_save_settings')}
                  </button>
                </div>
              </div>
              {sessionId && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                  <button
                    onClick={toggleLateMode}
                    style={{
                      padding:'0.4rem 1rem',
                      border:'1px solid var(--border)',
                      borderRadius:6,
                      background: cfg.lateMode ? '#10b981' : 'var(--panel)',
                      color: cfg.lateMode ? 'white' : 'inherit',
                      fontWeight:600,
                      fontSize: '0.8rem',
                      width: '100%'
                    }}
                  >
                    {cfg.lateMode ? t('attendance_late_mode_on') : t('attendance_late_mode_off')}
                  </button>
                </div>
              )}
        </div>
        </CollapsibleSection>
      )}

      {/* Guidelines - Collapsible */}
      <CollapsibleSection
        title={t('attendance_how_to_use') || 'How to Use'}
        icon={ListOrdered}
        defaultOpen={false}
        storageKey="attendance-guidelines"
        testId="attendance-guidelines"
      >
      <div data-tour="attendance-guidelines" style={{ padding:'1rem', background: theme === 'dark' ? 'rgba(30,64,175,0.08)' : '#eff6ff', border:`1px solid ${theme === 'dark' ? '#1e3a8a' : '#800020'}`, borderRadius: 8 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '0.5rem', fontSize: 'var(--font-size-sm)', color: theme === 'dark' ? '#93c5fd' : '#1e3a8a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.7)', borderRadius: 6 }}>
            <strong>1.</strong>
            <span>{t('attendance_guide_step1')}</span>
          </div>
          {getThemedIcon('ui', 'chevron_right', 16, theme)}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.7)', borderRadius: 6 }}>
            <strong>2.</strong>
            <span>{t('attendance_guide_step2')}</span>
          </div>
          {getThemedIcon('ui', 'chevron_right', 16, theme)}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.7)', borderRadius: 6 }}>
            <strong>3.</strong>
            <span>{t('attendance_guide_step3')}</span>
          </div>
          {getThemedIcon('ui', 'chevron_right', 16, theme)}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.7)', borderRadius: 6 }}>
            <strong>4.</strong>
            <span>{t('attendance_guide_step4')}</span>
          </div>
          {getThemedIcon('ui', 'chevron_right', 16, theme)}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.7)', borderRadius: 6 }}>
            <strong>5.</strong>
            <span>{t('attendance_guide_step5')}</span>
          </div>
        </div>
      </div>
      </CollapsibleSection>

      {/* QR Code Panel - Collapsible */}
      <CollapsibleSection
        title={t('attendance_live_qr') || 'Live QR Code'}
        icon={QrCode}
        defaultOpen
        storageKey="attendance-qr"
        testId="attendance-qr-panel"
      >
      <div data-tour="attendance-qr-panel">
        {/* QR Code Display */}
        <div style={{
          padding:'1rem',
          background: sessionId ? 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(5,150,105,0.05) 100%)' : panelBg,
          border: sessionId ? '2px solid #10b981' : `1px solid ${theme === 'dark' ? '#374151' : 'var(--border)'}`,
          borderRadius: 12,
          transition: 'all 0.3s ease'
        }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ fontWeight: 700, fontSize: 'var(--font-size-md)', color: textColor }}>
            {t('attendance_live_qr')}
          </div>
          {sessionId && (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <PortalTooltip content={t('make_qr_smaller')} position="top">
              <button
                onClick={() => setQrSize(Math.max(200, qrSize - 40))}
                style={{ padding: '0.25rem 0.5rem', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--panel)', cursor: 'pointer', color: '#1f2937' }}
              >
                {getThemedIcon('ui', 'minus', 16, theme)}
              </button>
              </PortalTooltip>
              <PortalTooltip content={t('make_qr_bigger')} position="top">
              <button
                onClick={() => setQrSize(Math.min(500, qrSize + 40))}
                style={{ padding: '0.25rem 0.5rem', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--panel)', cursor: 'pointer', color: '#1f2937' }}
              >
                {getThemedIcon('ui', 'plus', 16, theme)}
              </button>
              </PortalTooltip>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <canvas
              ref={qrCanvasRef}
              width={qrSize}
              height={qrSize}
              style={{
                borderRadius: 8,
                background:'#fff',
                border: sessionId ? '3px solid #10b981' : '2px solid var(--border)',
                boxShadow: sessionId ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
                transition: 'all 0.3s ease'
              }}
            />
            {sessionId && manualCode && (
              <div data-tour="attendance-manual-code" style={{ marginTop:12, padding:'1rem', background:'#fff', border:'2px solid #800020', borderRadius:8, textAlign:'center' }}>
                <div style={{ fontSize:11, fontWeight:600, color:'var(--muted)', marginBottom:6 }}>{t('attendance_manual_code')}</div>
                <div style={{ fontSize:32, fontWeight:700, letterSpacing:'0.2em', color:'#800020', fontFamily:'monospace' }}>{manualCode}</div>
                <div style={{ fontSize:10, color:'var(--muted)', marginTop:6 }}>{t('attendance_rotates_every')} {cfg.rotationSeconds}s</div>
                <div style={{ fontSize:9, color:'var(--muted)', marginTop:8, padding:'4px 8px', background:'#f3f4f6', borderRadius:4, fontFamily:'monospace' }}>
                  {t('session')}: {sessionId.slice(0,8)}...
                </div>
              </div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: '250px' }}>
            {!sessionId && (
              <div style={{ fontSize: 'var(--font-size-sm)', color: mutedColor }}>
                <div style={{ marginBottom: 12, fontWeight: 600, color: textColor }}>
                  {t('attendance_how_to_start_session')}
                </div>
                <div style={{ lineHeight: 1.6 }}>
                  <div style={{ marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <ClipboardList size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span><strong>{t('attendance_step1')}:</strong> {t('attendance_select_class_instructions')}</span>
                  </div>
                  <div style={{ marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <Play size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span><strong>{t('attendance_step2')}:</strong> {t('attendance_click_start_session_instructions')}</span>
                  </div>
                  <div style={{ marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <Smartphone size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span><strong>{t('attendance_step3')}:</strong> {t('attendance_students_scan_instructions')}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <CheckCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span><strong>{t('attendance_step4')}:</strong> {t('attendance_records_instructions')}</span>
                  </div>
                </div>
              </div>
            )}
            {sessionId && (
              <>
                <div style={{ fontSize: 'var(--font-size-xs)', color:'var(--muted)', marginBottom:8 }}>
                  {t('attendance_qr_rotates_info', { seconds: cfg.rotationSeconds })}
                </div>
                <div style={{ marginTop:8, padding:'0.5rem 0.75rem', background:'rgba(0,0,0,0.04)', borderRadius:8, fontFamily:'monospace', fontSize:11, color:'var(--muted)', wordBreak:'break-all' }}>
                  {token ? token.slice(0,80)+'…' : t('attendance_waiting_token')}
                </div>
                {!token && (
                  <div style={{ marginTop:8, fontSize: 'var(--font-size-xs)', color:'#b45309' }}>
                    {t('attendance_waiting_for_backend')}
                  </div>
                )}
                <div style={{ marginTop:12, display:'flex', gap:8, flexWrap:'wrap' }}>
                  <button data-tour="attendance-copy-link" onClick={() => {
                    const origin = typeof window !== 'undefined' ? window.location.origin : '';
                    const link = `${origin}/my-attendance?sid=${sessionId}&t=${encodeURIComponent(token||'')}`;
                    navigator.clipboard && navigator.clipboard.writeText(link).catch(()=>{});
                  }} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding:'0.5rem 1rem', border:'1px solid var(--border)', borderRadius:8, background:'#fff', fontWeight:600, color: '#1f2937' }}>
                    <Copy size={14} />
                    {t('attendance_copy_student_link')}
                  </button>
                  <Button 
                    data-tour="attendance-export"
                    variant="secondary" 
                    icon={getThemedIcon('ui', 'download', 16, theme)}
                    onClick={async()=>{
                      try {
                        const result = await getAttendanceMarksForExport(sessionId);
                        const rows = result.success ? result.data : [];
                        const headers = ['uid','status','deviceHash','scannedAt'];
                        const dataRows = rows.map(r => [r.uid, r.status||'present', r.deviceHash||'', (r.at && r.at.toDate ? r.at.toDate() : new Date()).toLocaleString('en-GB')]);
                        const excelBlob = await exportGeneric(dataRows, headers, {
                          fileName: `attendance_${sessionId}_${new Date().toISOString().split('T')[0]}.xlsx`
                        });
                        const url = URL.createObjectURL(excelBlob); const a = document.createElement('a');
                        a.href = url; a.download = `attendance_${sessionId}_${new Date().toISOString().split('T')[0]}.xlsx`; a.click();
                        setTimeout(()=>URL.revokeObjectURL(url), 1000);
                      } catch(e) { setErr(e?.message || 'Export failed'); }
                    }}
                  >
                    {t('export_excel') || 'Export Excel'}
                  </Button>
                  {isInstructor && (
                    <Button 
                      data-tour="attendance-submit-hr"
                      variant="primary"
                      icon={getThemedIcon('ui', 'send', 16, theme)}
                      onClick={handleExportAndSubmit}
                      disabled={!sessionId || loading}
                    >
                      {t('export_submit_hr') || 'Export & Submit for HR Review'}
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        </div>

        {/* Buttons Row - Bottom */}
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', justifyContent: 'center', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
          {!sessionId ? (
            <button
              data-tour="attendance-start-btn"
              onClick={startSession}
              disabled={!classId || loading}
              style={{
                padding:'0.5rem 1.5rem',
                border:'none',
                borderRadius:8,
                background: !classId || loading ? '#9ca3af' : '#800020',
                color:'white',
                fontWeight:600,
                cursor: !classId || loading ? 'not-allowed' : 'pointer',
                fontSize: 'var(--font-size-sm)'
              }}
            >
              {loading ? t('attendance_starting') : t('attendance_start_session')}
            </button>
          ) : (
            <button
              data-tour="attendance-late-mode"
              onClick={toggleLateMode}
              style={{
                padding:'0.5rem 1.5rem',
                border:'1px solid var(--border)',
                borderRadius:8,
                background: cfg.lateMode ? '#10b981' : 'var(--panel)',
                color: cfg.lateMode ? 'white' : 'inherit',
                fontWeight:600,
                fontSize: 'var(--font-size-sm)'
              }}
            >
              {cfg.lateMode ? t('attendance_late_mode_on') : t('attendance_late_mode_off')}
            </button>
          )}
        </div>
      </div>
      </CollapsibleSection>

      {/* Submission Confirmation Dialog */}
      <Modal
        isOpen={showSubmitDialog}
        onClose={() => { setShowSubmitDialog(false); setSubmitComments(''); }}
        title={t('submit_attendance_report') || 'Submit Attendance Report for HR Review'}
        size="medium"
        footer={
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button
              variant="secondary"
              onClick={() => { setShowSubmitDialog(false); setSubmitComments(''); }}
              disabled={isSubmitting}
            >
              {t('cancel') || 'Cancel'}
            </Button>
            <Button
              variant="primary"
              onClick={confirmSubmission}
              disabled={isSubmitting}
              style={{ background: isSubmitting ? '#9ca3af' : '#10b981' }}
            >
              {isSubmitting ? (t('submitting') || 'Submitting...') : (t('confirm_submit') || 'Confirm & Submit')}
            </Button>
          </div>
        }
      >
        <p style={{ margin: '0 0 1rem 0', color: mutedColor, fontSize: 'var(--font-size-sm)' }}>
          {t('submit_confirmation') || 'This will generate an attendance report and submit it to HR for review. Are you sure you want to proceed?'}
        </p>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: textColor, fontSize: 'var(--font-size-sm)' }}>
            {t('optional_comments') || 'Optional Comments'}
          </label>
          <Textarea
            value={submitComments}
            onChange={(e) => setSubmitComments(e.target.value)}
            placeholder={t('add_submission_notes') || 'Add any notes for HR...'}
            rows={3}
          />
        </div>
      </Modal>
    </div>
  );
};

export default AttendancePage;
