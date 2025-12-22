import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { createSession, listOpenSessions, listenAttendanceSession, closeAttendanceSession } from '../firebase/attendance';
import QRCode from 'qrcode';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc, collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { Info, Users, Calendar, Download, ChevronDown, ChevronUp, Maximize2, Minimize2, PlayCircle, Square } from 'lucide-react';
import { Button, Select, Loading, YearSelect } from '../components/ui';
import styles from './AttendancePage.module.css';

const AttendancePageEnhanced = () => {
  const { user, isAdmin, isInstructor, isHR } = useAuth();
  const { t } = useLang();
  const [classId, setClassId] = useState(() => {
    try { return localStorage.getItem('att_instructor_class') || ''; } catch { return ''; }
  });
  const [session, setSession] = useState(null);
  const [sessionId, setSessionId] = useState('');
  const [token, setToken] = useState('');
  const [manualCode, setManualCode] = useState('');
  const qrCanvasRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [cfg, setCfg] = useState({ rotationSeconds: 30, sessionMinutes: 15, strictDeviceBinding: true, lateMode: false });
  const [savingCfg, setSavingCfg] = useState(false);
  const [classOptions, setClassOptions] = useState([]);
  const [err, setErr] = useState('');
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [termFilter, setTermFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [instructorFilter, setInstructorFilter] = useState('all');
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

  // Filtered classes based on term/year/instructor
  const filteredClasses = useMemo(() => {
    return classOptions.filter(c => {
      if (termFilter !== 'all' && c.term !== termFilter) return false;
      if (yearFilter !== 'all' && c.year !== yearFilter) return false;
      if (instructorFilter !== 'all' && (c.instructorId !== instructorFilter && c.instructor !== instructorFilter)) return false;
      return true;
    });
  }, [classOptions, termFilter, yearFilter, instructorFilter]);

  // Load classes (authorized roles only)
  useEffect(() => {
    if (!user) return;
    if (!(isAdmin || isInstructor || isHR)) return;
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'classes'));
        const opts = [];
        snap.forEach(d => {
          const data = d.data() || {};
          opts.push({ ...(data), id: d.id, docId: d.id });
        });
        setClassOptions(opts);
        if (!classId && opts.length === 1) setClassId(opts[0].id);
      } catch (e) {
        if (e?.code !== 'permission-denied') console.error('[Attendance] load classes:', e);
      }
    })();
  }, [user, isAdmin, isInstructor, isHR]);

  // Load config (admin only)
  useEffect(() => {
    if (!user || !isAdmin) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'config', 'attendance'));
        if (snap.exists()) {
          const data = snap.data();
          setCfg({ 
            rotationSeconds: data.rotationSeconds ?? 30, 
            sessionMinutes: data.sessionMinutes ?? 15, 
            strictDeviceBinding: data.strictDeviceBinding !== false,
            lateMode: data.lateMode || false
          });
        }
      } catch (e) {
        if (e?.code !== 'permission-denied') console.error('[Attendance] load cfg:', e);
      }
    })();
  }, [user, isAdmin]);

  // Listen to attendance count for active session
  useEffect(() => {
    if (!sessionId) {
      setAttendanceCount(0);
      return;
    }
    const unsubscribe = onSnapshot(
      collection(db, 'attendanceSessions', sessionId, 'marks'),
      (snapshot) => {
        setAttendanceCount(snapshot.size);
      },
      (error) => {
        console.error('[Attendance] Error listening to marks:', error);
      }
    );
    return () => unsubscribe();
  }, [sessionId]);

  const startSession = async () => {
    if (!user) { setErr('Please sign in'); return; }
    if (!classId) { setErr('Please select a class'); return; }
    setLoading(true);
    try {
      setErr('');
      console.log('[Attendance] startSession clicked', { classId, uid: user?.uid });
      const { id } = await createSession({ classId, createdBy: user.uid });
      console.log('[Attendance] createSession returned', { id });
      if (!id) throw new Error('No session id returned from backend');
      setSession({ id });
      setSessionId(id);
      setSessionStartTime(Date.now());
    } catch(e) {
      setErr(e?.message || 'Failed to start session');
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
      console.error('[Attendance] Error ending session:', e);
      // Handle CORS or other errors gracefully
      if (e?.message?.includes('CORS') || e?.code === 'internal') {
        // Try to close session locally if backend fails
        try {
          await setDoc(doc(db, 'attendanceSessions', sessionId), { status: 'closed' }, { merge: true });
          setSessionId('');
          setSession(null);
          setToken('');
          setSessionStartTime(null);
          setErr('Session closed locally. Backend may need CORS configuration.');
        } catch (localErr) {
          setErr('Failed to end session. Please try again or contact support.');
        }
      } else {
        setErr(e?.message || 'Failed to end session. Please try again.');
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
      await setDoc(doc(db, 'attendanceSessions', sessionId), { lateMode: newLateMode }, { merge: true });
    } catch(e) {
      setErr(e?.message || 'Failed to toggle late mode');
    }
  };

  const saveCfg = async () => {
    setSavingCfg(true);
    try {
      await setDoc(doc(db, 'config', 'attendance'), cfg, { merge: true });
    } finally { setSavingCfg(false); }
  };

  if (loading && !sessionId) {
    return <Loading variant="overlay" fullscreen message={t('loading') || 'Loading...'} />;
  }

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
            <PlayCircle size={32} style={{ animation: 'blink 1.5s ease-in-out infinite' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                Session Active
              </div>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                Duration: {durationDisplay} • {attendanceCount} scanned
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.2)', borderRadius: 8, fontWeight: 600 }}>
              {attendanceCount} Students
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
              <Square size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
              End Session
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
            fontSize: '1rem'
          }}
        >
          <span>Class Selection</span>
          {collapsedSections.class ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </button>
        {!collapsedSections.class && (
          <div style={{ padding: '0 1rem 1rem 1rem' }}>
            {/* Filters */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px,1fr))', gap:8, marginBottom:12 }}>
          <div>
            <Select
              searchable
              value={termFilter}
              onChange={(e)=>setTermFilter(e.target.value)}
              options={[
                { value: 'all', label: t('all_terms') || 'All Terms' },
                ...terms.map(term => ({ value: term, label: term }))
              ]}
              fullWidth
            />
          </div>
          <div>
            <YearSelect
              value={yearFilter === 'all' ? '' : yearFilter}
              onChange={(e)=>setYearFilter(e.target.value || 'all')}
              startYear={2024}
              yearsAhead={5}
              includeAll
              allValue="all"
              allLabel={t('all_years') || 'All Years'}
              fullWidth
              searchable
              label=""
            />
          </div>
          {(isAdmin || isHR) && instructors.length > 0 && (
            <div>
              <Select
                searchable
                value={instructorFilter}
                onChange={(e)=>setInstructorFilter(e.target.value)}
                options={[
                  { value: 'all', label: t('all_instructors') || 'All Instructors' },
                  ...instructors.map(inst => ({ value: inst, label: inst }))
                ]}
                fullWidth
              />
            </div>
          )}
        </div>

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
              fontSize: '0.875rem'
            }}
          >
            <span>{t('attendance_settings') || 'Attendance Settings'}</span>
            {collapsedSections.settings ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
          {!collapsedSections.settings && (
            <div style={{ padding: '0 0.75rem 0.75rem 0.75rem' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(120px,1fr))', gap: 8, marginBottom: 8 }}>
                <div>
                  <label style={{ display:'block', marginBottom: 4, fontWeight: 600, fontSize:10 }}>{t('qr_rotation_seconds') || 'QR Rotation (seconds)'}</label>
                  <input type="number" min={10} max={120} value={cfg.rotationSeconds}
                    onChange={(e)=>setCfg(v=>({ ...v, rotationSeconds: Math.max(10, Math.min(120, parseInt(e.target.value||'30',10))) }))}
                    style={{ width:'100%', padding:'0.4rem', border:'1px solid var(--border)', borderRadius:6, background:'var(--panel)', color:'inherit', fontSize: '0.8rem' }} />
                </div>
                <div>
                  <label style={{ display:'block', marginBottom: 4, fontWeight: 600, fontSize:10 }}>{t('session_duration_minutes') || 'Session Duration (minutes)'}</label>
                  <input type="number" min={5} max={180} value={cfg.sessionMinutes}
                    onChange={(e)=>setCfg(v=>({ ...v, sessionMinutes: Math.max(5, Math.min(180, parseInt(e.target.value||'15',10))) }))}
                    style={{ width:'100%', padding:'0.4rem', border:'1px solid var(--border)', borderRadius:6, background:'var(--panel)', color:'inherit', fontSize: '0.8rem' }} />
                </div>
                <div style={{ alignSelf:'end' }}>
                  <label style={{ display:'block', marginBottom: 4, fontWeight: 600, fontSize:10 }}>{t('strict_device_binding') || 'Strict Device Binding'}</label>
                  <button onClick={()=>setCfg(v=>({ ...v, strictDeviceBinding: !v.strictDeviceBinding }))} style={{ padding:'0.4rem 0.75rem', border:'1px solid var(--border)', borderRadius:6, background: cfg.strictDeviceBinding ? 'rgba(16,185,129,0.15)' : 'transparent', color:'inherit', fontWeight:600, fontSize: '0.8rem' }}>
                    {cfg.strictDeviceBinding ? (t('enabled')||'Enabled') : (t('disabled')||'Disabled')}
                  </button>
                </div>
                <div style={{ alignSelf:'end' }}>
                  <button onClick={saveCfg} disabled={savingCfg} style={{ padding:'0.4rem 1rem', border:'none', borderRadius:6, background:'#667eea', color:'white', fontWeight:600, fontSize: '0.8rem' }}>
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
              <button
                onClick={() => setQrSize(Math.max(200, qrSize - 40))}
                style={{ padding: '0.25rem 0.5rem', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--panel)', cursor: 'pointer', color: '#1f2937' }}
                title="Make QR smaller"
              >
                <Minimize2 size={16} />
              </button>
              <button
                onClick={() => setQrSize(Math.min(500, qrSize + 40))}
                style={{ padding: '0.25rem 0.5rem', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--panel)', cursor: 'pointer', color: '#1f2937' }}
                title="Make QR bigger"
              >
                <Maximize2 size={16} />
              </button>
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
              <div style={{ marginTop:12, padding:'1rem', background:'#fff', border:'2px solid #667eea', borderRadius:8, textAlign:'center' }}>
                <div style={{ fontSize:11, fontWeight:600, color:'var(--muted)', marginBottom:6 }}>MANUAL CODE</div>
                <div style={{ fontSize:32, fontWeight:700, letterSpacing:'0.2em', color:'#667eea', fontFamily:'monospace' }}>{manualCode}</div>
                <div style={{ fontSize:10, color:'var(--muted)', marginTop:6 }}>Rotates every {cfg.rotationSeconds}s</div>
                <div style={{ fontSize:9, color:'var(--muted)', marginTop:8, padding:'4px 8px', background:'#f3f4f6', borderRadius:4, fontFamily:'monospace' }}>
                  Session: {sessionId.slice(0,8)}...
                </div>
              </div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: '250px' }}>
            {!sessionId && <div style={{ fontSize: 14, color:'var(--muted)' }}>{(t('no_active_session') || 'No active session. Start a session to generate QR code.').replaceAll('_',' ')}</div>}
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
                  }} style={{ padding:'0.5rem 1rem', border:'1px solid var(--border)', borderRadius:8, background:'#fff', fontWeight:600 }}>
                    📋 {(t('copy_student_link')||'Copy Student Link').replaceAll('_',' ')}
                  </button>
                  <Button 
                    variant="secondary" 
                    icon={<Download size={16} />}
                    onClick={async()=>{
                      try {
                        const snap = await getDocs(collection(db, 'attendanceSessions', sessionId, 'marks'));
                        const rows = snap.docs.map(d => ({ uid: d.id, ...(d.data()||{}) }));
                        const headers = ['uid','status','deviceHash','scannedAt'];
                        const csvRows = rows.map(r => [r.uid, r.status||'present', r.deviceHash||'', (r.at && r.at.toDate ? r.at.toDate() : new Date()).toLocaleString('en-GB')]);
                        const csv = [headers.join(','), ...csvRows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(','))].join('\n');
                        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                        const url = URL.createObjectURL(blob); const a = document.createElement('a');
                        a.href = url; a.download = `attendance_${sessionId}_${new Date().toISOString().split('T')[0]}.csv`; a.click();
                        setTimeout(()=>URL.revokeObjectURL(url), 1000);
                      } catch(e) { setErr(e?.message || 'Export failed'); }
                    }}
                  >
                    {t('export_csv') || 'Export CSV'}
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
                background: !classId || loading ? '#9ca3af' : '#667eea',
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
      <div style={{ padding:'1rem', background:'#eff6ff', border:'1px solid #3b82f6', borderRadius: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 12, display:'flex', alignItems:'center', gap:8, color:'#1e40af' }}>
          <Info size={20} />
          <span>{t('how_to_use') || 'How to Use Attendance System'}</span>
        </div>
        <div style={{ fontSize:14, lineHeight:1.8, color:'#1e3a8a' }}>
          <p style={{ margin:'0 0 8px 0' }}><strong>1. Start Session:</strong> Select a class and click "Start Session" to generate a live QR code.</p>
          <p style={{ margin:'0 0 8px 0' }}><strong>2. Students Scan:</strong> Students open /my-attendance page and scan the QR code with their camera or paste the link manually.</p>
          <p style={{ margin:'0 0 8px 0' }}><strong>3. QR Rotation:</strong> The QR code token rotates every {cfg.rotationSeconds} seconds for security. Students must scan during the active session.</p>
          <p style={{ margin:'0 0 8px 0' }}><strong>4. Strict Device Binding:</strong> When enabled, each student can only scan from one device per session to prevent sharing.</p>
          <p style={{ margin:'0 0 8px 0' }}><strong>5. Late Mode:</strong> After ending the session, you can enable "Late Mode" to allow late arrivals to scan with a "late" status.</p>
          <p style={{ margin:'0 0 8px 0' }}><strong>6. Export:</strong> Click "Export CSV" to download attendance records for the session.</p>
          <p style={{ margin:'0 0 8px 0' }}><strong>7. Cost:</strong> QR rotation uses Firestore writes (~1 write per rotation). With 30s rotation and 15min session, that's ~30 writes per session. Very minimal cost.</p>
        </div>
      </div>
    </div>
  );
};

export default AttendancePageEnhanced;
