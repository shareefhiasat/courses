import React, { useEffect, useMemo, useRef, useState, useCallback, useLayoutEffect } from 'react';
import { info, error, warn, debug } from '@services/utils/logger.js';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { createSession, listOpenSessions, listenAttendanceSession, closeAttendanceSession } from '@services/business/attendanceService';
import {
  getAttendanceConfigDoc,
  saveAttendanceConfigDoc,
  closeAttendanceSessionLocal,
  updateAttendanceSessionLateMode,
  listenAttendanceMarksCount,
} from '@services/business/attendanceService';
import QRCode from 'qrcode';
import { getThemedIcon } from '@constants/iconTypes';
import { Button, Select, YearSelect, ProgramsSelect, TermSelect } from '@ui';
import { GlobalLoadingFallback, useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { getPrograms, getSubjects } from '@services/business/programService';
import { getClasses } from '@services/business/classService';
import styles from './AttendancePage.module.css';
import PortalTooltip from '@ui/PortalTooltip';
import { exportGeneric } from '@services/export/excelExportService.js';

const AttendancePageEnhanced = () => {
  const { user, isAdmin, isInstructor, isHR, loading: authLoading } = useAuth();
  const { t } = useLang();
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
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [collapsedSections, setCollapsedSections] = useState(() => {
    try { return JSON.parse(localStorage.getItem('attendance_collapsed') || '{"class":false,"settings":true}'); } catch { return { class: false, settings: true }; }
  });
  const [qrSize, setQrSize] = useState(() => {
    try { return parseInt(localStorage.getItem('attendance_qr_size') || '200', 10); } catch { return 200; }
  });
  const [sessionStartTime, setSessionStartTime] = useState(null);
  
  const selectedClass = useMemo(() => classOptions.find(c => (c.id||c.docId) === classId), [classOptions, classId]);

  // Extract unique terms, years, instructors for filters
  const terms = useMemo(() => [...new Set(classOptions.map(c => c.term).filter(Boolean))], [classOptions]);
  const years = useMemo(() => [...new Set(classOptions.map(c => c.year).filter(Boolean))], [classOptions]);
  const instructors = useMemo(() => [...new Set(classOptions.map(c => c.instructorId || c.instructor).filter(Boolean))], [classOptions]);

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
    
    return filtered;
  }, [classOptions, subjects, programFilter, subjectFilter, classFilter, termFilter, yearFilter, instructorFilter]);

  // Load classes, programs, subjects (authorized roles only)
  useEffect(() => {
    if (!user) return;
    if (!(isAdmin || isInstructor || isHR)) return;
    debug('[Attendance] Starting data load for user:', { uid: user.uid, email: user.email, roles: { isAdmin, isInstructor, isHR } });
    (async () => {
      try {
        debug('[Attendance] Fetching data...');
        const [classesResult, programsRes, subjectsRes] = await Promise.all([
          getClasses(),
          getPrograms(),
          getSubjects()
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
    try { localStorage.setItem('attendance_collapsed', JSON.stringify(collapsedSections)); } catch {}
  }, [collapsedSections]);

  useEffect(() => {
    try { localStorage.setItem('attendance_qr_size', String(qrSize)); } catch {}
  }, [qrSize]);

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

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

  const getSessionDuration = () => {
    return durationDisplay;
  };

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

  return (
    <div className="content-section" style={{ maxWidth: 1400, margin: '0 auto', padding: '1rem 1.25rem' }}>
      {err && <div style={{ padding:'0.75rem', background:'#fee', border:'1px solid #fcc', borderRadius:8, color:'#c00', marginBottom:16 }}>{err}</div>}

      {/* Active Session Banner */}
      {sessionId && (
        <div style={{
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
                {t('session_active') || 'Session Active'}
              </div>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                {t('duration') || 'Duration'}: {durationDisplay} • {attendanceCount} {t('scanned') || 'scanned'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.2)', borderRadius: 8, fontWeight: 600 }}>
              {attendanceCount} {t('students') || 'Students'}
            </div>
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
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {getThemedIcon('ui', 'square', 16, theme)}
            </button>
          </div>
        </div>
      )}

      {/* Class Selection - Collapsible */}
      <div style={{ marginBottom: 16, background:'var(--panel)', border:'1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <button
          onClick={() => toggleSection('class')}
          style={{
            width: '100%',
            padding: '1rem',
            border: 'none',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '1rem',
            color: '#1f2937'
          }}
        >
          <span>{t('class_selection') || 'Class Selection'}</span>
          {collapsedSections.class ? getThemedIcon('ui', 'plus', 20, theme) : getThemedIcon('ui', 'minus', 20, theme)}
        </button>
        {!collapsedSections.class && (
          <div style={{ padding: '0 1rem 1rem 1rem' }}>
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
                <div style={{ flex: 1, minWidth: '200px' }}>
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
                <div style={{ flex: 1, minWidth: '200px' }}>
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
            {(isAdmin || isHR) && instructors.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <Select
                  searchable
                  value={instructorFilter}
                  onChange={(e)=>setInstructorFilter(e.target.value)}
                  options={[
                    { value: '', label: t('all_instructors') || 'All Instructors' },
                    ...instructors.map(inst => ({ value: inst, label: inst }))
                  ]}
                  fullWidth
                />
              </div>
            )}

        {/* Class List */}
        <div style={{ fontSize:12, color:'var(--muted)', marginBottom:8 }}>
          {t('showing') || 'Showing'} {filteredClasses.length} {t('of') || 'of'} {classOptions.length} {t('classes') || 'classes'}
        </div>
        {filteredClasses.length === 0 && (
          <div style={{ padding:'1rem', textAlign:'center', color:'var(--muted)' }}>
            {t('no_classes_found') || 'No classes found. Adjust filters or create a class first.'}
          </div>
        )}
        <div style={{ display:'grid', gap:6, maxHeight:300, overflowY:'auto' }}>
          {filteredClasses.map(c => {
            const val = c.id || c.docId || '';
            const label = c.name || c.code || val || '—';
            const checked = classId === val;
            return (
              <label key={val} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', padding:'8px 10px', border:'1px solid var(--border)', borderRadius:8, background: checked ? 'rgba(102,126,234,0.12)' : 'var(--panel)' }} onClick={()=>{ setClassId(val); try { localStorage.setItem('att_instructor_class', val); } catch {}; }}>
                <input type="radio" name="classSelect" value={val} checked={checked} onChange={()=>{}} />
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600 }}>{label}</div>
                  <div style={{ fontSize:11, color:'var(--muted)', display:'flex', gap:8 }}>
                    {c.term && <span>Term: {c.term}</span>}
                    {c.year && <span>Year: {c.year}</span>}
                    {c.code && <span>Code: {c.code}</span>}
                  </div>
                </div>
              </label>
            );
          })}
            </div>
          </div>
        )}
      </div>

      {/* Attendance Settings - Below Class Selection */}
      {isAdmin && (
        <div style={{ marginBottom: 16, background:'var(--panel)', border:'1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <button
            onClick={() => toggleSection('settings')}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: 'none',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.875rem',
              color: '#1f2937'
            }}
          >
            <span>{t('attendance_settings') || 'Attendance Settings'}</span>
            {collapsedSections.settings ? getThemedIcon('ui', 'plus', 18, theme) : getThemedIcon('ui', 'minus', 18, theme)}
          </button>
          {!collapsedSections.settings && (
            <div style={{ padding: '0 0.75rem 0.75rem 0.75rem' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(120px,1fr))', gap: 8, marginBottom: 8 }}>
                <div>
                  <label style={{ display:'block', marginBottom: 4, fontWeight: 600, fontSize:10, color: '#1f2937' }}>{t('qr_rotation_seconds') || 'QR Rotation (seconds)'}</label>
                  <input type="number" min={10} max={120} value={cfg.rotationSeconds}
                    onChange={(e)=>setCfg(v=>({ ...v, rotationSeconds: Math.max(10, Math.min(120, parseInt(e.target.value||'30',10))) }))}
                    style={{ width:'100%', padding:'0.4rem', border:'1px solid var(--border)', borderRadius:6, background:'var(--panel)', color:'inherit', fontSize: '0.8rem' }} />
                </div>
                <div>
                  <label style={{ display:'block', marginBottom: 4, fontWeight: 600, fontSize:10, color: '#1f2937' }}>{t('session_duration_minutes') || 'Session Duration (minutes)'}</label>
                  <input type="number" min={5} max={180} value={cfg.sessionMinutes}
                    onChange={(e)=>setCfg(v=>({ ...v, sessionMinutes: Math.max(5, Math.min(180, parseInt(e.target.value||'15',10))) }))}
                    style={{ width:'100%', padding:'0.4rem', border:'1px solid var(--border)', borderRadius:6, background:'var(--panel)', color:'inherit', fontSize: '0.8rem' }} />
                </div>
                <div style={{ alignSelf:'end' }}>
                  <label style={{ display:'block', marginBottom: 4, fontWeight: 600, fontSize:10, color: '#1f2937' }}>{t('strict_device_binding') || 'Strict Device Binding'}</label>
                  <button onClick={()=>setCfg(v=>({ ...v, strictDeviceBinding: !v.strictDeviceBinding }))} style={{ padding:'0.4rem 0.75rem', border:'1px solid var(--border)', borderRadius:6, background: cfg.strictDeviceBinding ? 'rgba(16,185,129,0.15)' : 'transparent', color:'inherit', fontWeight:600, fontSize: '0.8rem' }}>
                    {cfg.strictDeviceBinding ? (t('enabled')||'Enabled') : (t('disabled')||'Disabled')}
                  </button>
                </div>
                <div style={{ alignSelf:'end' }}>
                  <button onClick={saveCfg} disabled={savingCfg} style={{ padding:'0.4rem 1rem', border:'none', borderRadius:6, background:'#800020', color:'white', fontWeight:600, fontSize: '0.8rem' }}>
                    {savingCfg ? (t('saving')||'Saving...') : (t('save_settings')||'Save Settings')}
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
                    {cfg.lateMode ? (t('late_mode_on') || 'Late Mode: ON') : (t('late_mode_off') || 'Late Mode: OFF')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main Container: QR Code + Buttons */}
      <div style={{ background:'var(--panel)', border:'1px solid var(--border)', borderRadius: 12, padding: '1rem' }}>
        {/* QR Code Display - Enhanced */}
        <div style={{
          padding:'1rem',
          background: sessionId ? 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(5,150,105,0.05) 100%)' : 'var(--panel)',
          border: sessionId ? '2px solid #10b981' : '1px solid var(--border)',
          borderRadius: 12,
          transition: 'all 0.3s ease'
        }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ fontWeight: 700, fontSize: '1rem' }}>
            {(t('live_qr') || 'Live QR Code').replaceAll('_',' ')}
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
              <div style={{ marginTop:12, padding:'1rem', background:'#fff', border:'2px solid #800020', borderRadius:8, textAlign:'center' }}>
                <div style={{ fontSize:11, fontWeight:600, color:'var(--muted)', marginBottom:6 }}>{t('manual_code') || 'MANUAL CODE'}</div>
                <div style={{ fontSize:32, fontWeight:700, letterSpacing:'0.2em', color:'#800020', fontFamily:'monospace' }}>{manualCode}</div>
                <div style={{ fontSize:10, color:'var(--muted)', marginTop:6 }}>{t('rotates_every') || 'Rotates every'} {cfg.rotationSeconds}s</div>
                <div style={{ fontSize:9, color:'var(--muted)', marginTop:8, padding:'4px 8px', background:'#f3f4f6', borderRadius:4, fontFamily:'monospace' }}>
                  {t('session') || 'Session'}: {sessionId.slice(0,8)}...
                </div>
              </div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: '250px' }}>
            {!sessionId && (
              <div style={{ fontSize: 14, color:'var(--muted)' }}>
                <div style={{ marginBottom: 12, fontWeight: 600, color: '#1f2937' }}>
                  {t('how_to_start_session') || 'How to Start Attendance Session'}
                </div>
                <div style={{ lineHeight: 1.6 }}>
                  <div style={{ marginBottom: 8 }}>📋 <strong>{t('step1') || 'Step 1'}:</strong> {t('select_class_instructions') || 'Select your class from the dropdown above'}</div>
                  <div style={{ marginBottom: 8 }}>▶️ <strong>{t('step2') || 'Step 2'}:</strong> {t('click_start_session_instructions') || 'Click the "Start Session" button below'}</div>
                  <div style={{ marginBottom: 8 }}>📱 <strong>{t('step3') || 'Step 3'}:</strong> {t('students_scan_instructions') || 'Students will scan the QR code or use manual code'}</div>
                  <div>✅ <strong>{t('step4') || 'Step 4'}:</strong> {t('attendance_records_instructions') || 'Attendance will be recorded automatically in real-time'}</div>
                </div>
              </div>
            )}
            {sessionId && (
              <>
                <div style={{ fontSize: 12, color:'var(--muted)', marginBottom:8 }}>
                  {t('qr_rotates_info') || `QR code rotates every ${cfg.rotationSeconds} seconds for security.`}
                </div>
                <div style={{ marginTop:8, padding:'0.5rem 0.75rem', background:'rgba(0,0,0,0.04)', borderRadius:8, fontFamily:'monospace', fontSize:11, color:'var(--muted)', wordBreak:'break-all' }}>
                  {token ? token.slice(0,80)+'…' : ((t('waiting_token')||'Waiting for token...').replaceAll('_',' '))}
                </div>
                {!token && (
                  <div style={{ marginTop:8, fontSize:12, color:'#b45309' }}>
                    {(t('waiting_for_backend')||'If this stays empty, ensure Cloud Functions are deployed and ATTENDANCE_SECRET is set.').replaceAll('_',' ')}
                  </div>
                )}
                <div style={{ marginTop:12, display:'flex', gap:8, flexWrap:'wrap' }}>
                  <button onClick={() => {
                    const origin = typeof window !== 'undefined' ? window.location.origin : '';
                    const link = `${origin}/my-attendance?sid=${sessionId}&t=${encodeURIComponent(token||'')}`;
                    navigator.clipboard && navigator.clipboard.writeText(link).catch(()=>{});
                  }} style={{ padding:'0.5rem 1rem', border:'1px solid var(--border)', borderRadius:8, background:'#fff', fontWeight:600, color: '#1f2937' }}>
                    📋 {(t('copy_student_link')||'Copy Student Link').replaceAll('_',' ')}
                  </button>
                  <Button 
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
                fontSize: '0.875rem'
              }}
            >
              {loading ? (t('starting') || 'Starting...') : (t('start_session') || 'Start Session')}
            </button>
          ) : (
            <button
              onClick={toggleLateMode}
              style={{
                padding:'0.5rem 1.5rem',
                border:'1px solid var(--border)',
                borderRadius:8,
                background: cfg.lateMode ? '#10b981' : 'var(--panel)',
                color: cfg.lateMode ? 'white' : 'inherit',
                fontWeight:600,
                fontSize: '0.875rem'
              }}
            >
              {cfg.lateMode ? (t('late_mode_on') || 'Late Mode: ON') : (t('late_mode_off') || 'Late Mode: OFF')}
            </button>
          )}
        </div>
      </div>

      {/* Guidelines */}
      <div style={{ padding:'1rem', background:'#eff6ff', border:'1px solid #800020', borderRadius: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 12, display:'flex', alignItems:'center', gap:8, color:'#1e40af' }}>
          {getThemedIcon('ui', 'info', 20, theme)}
          <span>{t('how_to_use') || 'How to Use Attendance System'}</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '0.5rem', fontSize: 13, color: '#1e3a8a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.7)', borderRadius: 6 }}>
            <strong>1.</strong>
            <span>{t('attendance_step1') || 'Select your class from the dropdown and click Start Session to generate QR code'}</span>
          </div>
          {getThemedIcon('ui', 'chevron_right', 16, theme)}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.7)', borderRadius: 6 }}>
            <strong>2.</strong>
            <span>{t('attendance_step2') || 'Students scan QR code with their phones or use manual code if needed'}</span>
          </div>
          {getThemedIcon('ui', 'chevron_right', 16, theme)}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.7)', borderRadius: 6 }}>
            <strong>3.</strong>
            <span>{t('attendance_step3') || 'QR code automatically rotates for security - attendance is recorded in real-time'}</span>
          </div>
          {getThemedIcon('ui', 'chevron_right', 16, theme)}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.7)', borderRadius: 6 }}>
            <strong>4.</strong>
            <span>{t('attendance_step4') || 'Enable Late Mode to allow late arrivals after session starts'}</span>
          </div>
          {getThemedIcon('ui', 'chevron_right', 16, theme)}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.7)', borderRadius: 6 }}>
            <strong>5.</strong>
            <span>{t('attendance_step5') || 'Export attendance data as CSV for records and reporting'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendancePageEnhanced;
