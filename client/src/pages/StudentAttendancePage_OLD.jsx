import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { scanAttendance, simpleDeviceHash } from '../firebase/attendance';

const StudentAttendancePage = () => {
  const { user } = useAuth();
  const { t } = useLang();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState('');
  const [manualText, setManualText] = useState('');
  const [lastResult, setLastResult] = useState(null);
  const [classId, setClassId] = useState(() => {
    try { return localStorage.getItem('attend_class') || ''; } catch { return ''; }
  });
  const [classOptions, setClassOptions] = useState([]);
  const [history, setHistory] = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // all|present|absent|anomaly
  const [histClassFilter, setHistClassFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState('present');
  const [leaveReason, setLeaveReason] = useState('medical');
  const [leaveNote, setLeaveNote] = useState('');
  const [showHistory, setShowHistory] = useState(true);
  const [classVisibilitySettings, setClassVisibilitySettings] = useState({});

  useEffect(() => {
    let stream;
    const start = async () => {
      if (!('BarcodeDetector' in window)) return; // Manual fallback below
      try {
        const video = videoRef.current;
        if (!video) return;
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        video.srcObject = stream;
        await video.play();
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        setScanning(true);
        const loop = async () => {
          if (!videoRef.current) return;
          try {
            const w = video.videoWidth; const h = video.videoHeight;
            if (w && h) {
              const canvas = canvasRef.current;
              if (canvas) {
                canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, w, h);
                const imageBitmap = await createImageBitmap(canvas);
                const codes = await detector.detect(imageBitmap);
                if (codes && codes[0]?.rawValue) {
                  const raw = codes[0].rawValue;
                  await handleRawValue(raw);
                }
              }
            }
          } catch {}
          rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
      } catch (e) {
        setMessage(e?.message || 'Camera error');
      }
    };
    start();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (stream) stream.getTracks().forEach(t => t.stop());
      setScanning(false);
    };
  }, []);

  // Auto-scan support when opened from external QR readers (URL contains sid & t)
  useEffect(() => {
    try {
      const u = new URL(window.location.href);
      const sid = u.searchParams.get('sid');
      const tkn = u.searchParams.get('t');
      const cls = u.searchParams.get('class');
      if (cls) {
        setClassId(cls);
        try { localStorage.setItem('attend_class', cls); } catch {}
      }
      if (sid && tkn) {
        handleRawValue(`${u.origin}/my-attendance?sid=${sid}&t=${tkn}`);
      }
    } catch {}
  }, []);

  // Load user's enrolled classes -> dropdown and check visibility settings
  useEffect(() => {
    const load = async () => {
      if (!user?.uid) return;
      try {
        const { doc, getDoc, collection, getDocs } = await import('firebase/firestore');
        const { db } = await import('../firebase/config');
        
        // Get user data including visibility preference
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        const userData = userSnap.exists() ? userSnap.data() : {};
        const ids = Array.isArray(userData.enrolledClasses) ? userData.enrolledClasses : [];
        
        // Check user-level visibility preference
        setShowHistory(userData.showAttendanceHistory !== false);
        
        // Fetch all classes, then filter by ids
        const clsSnap = await getDocs(collection(db, 'classes'));
        const all = [];
        const visibilityMap = {};
        clsSnap.forEach(d => {
          const classData = d.data();
          all.push({ id: d.id, ...classData });
          // Store class-level visibility setting
          visibilityMap[d.id] = classData.attendanceVisibility !== false;
        });
        setClassVisibilitySettings(visibilityMap);
        
        const options = all.filter(c => ids.includes(c.id) || ids.includes(c.docId)).map(c => ({ id: c.id, name: c.name || c.code || c.id }));
        setClassOptions(options);
        if (!classId && options.length === 1) setClassId(options[0].id);
      } catch {}
    };
    load();
  }, [user]);

  // Load history with filters
  useEffect(() => {
    const run = async () => {
      if (!user?.uid) return;
      setHistLoading(true);
      try {
        const { collectionGroup, getDocs, query, where, orderBy, limit } = await import('firebase/firestore');
        const { db } = await import('../firebase/config');
        let q = query(collectionGroup(db, 'marks'), where('__name__', '>=', ''), orderBy('updatedAt', 'desc'), limit(100));

        // Filter by docId==uid if possible
        try {
          q = query(collectionGroup(db, 'marks'), where('__name__', '==', user.uid), orderBy('updatedAt', 'desc'), limit(100));
        } catch {}

        const snap = await getDocs(q);
        let rows = snap.docs
          .filter(d => (d.id === user.uid) || (d.data()?.uid === user.uid) || (d.data()?.userId === user.uid))
          .map(d => ({ id: d.id, ...d.data(), _path: d.ref.parent?.parent?.path || '' }));

        // Apply client-side filters (class, status, dates)
        if (histClassFilter !== 'all') {
          rows = rows.filter(r => (r.classId === histClassFilter) || (r._path.includes(`/classes/${histClassFilter}/`)));
        }
        if (statusFilter !== 'all') {
          rows = rows.filter(r => (r.status || r.lastStatus) === statusFilter);
        }
        const from = fromDate ? new Date(fromDate) : null;
        const to = toDate ? new Date(toDate) : null;
        if (from) rows = rows.filter(r => (r.updatedAt?.toDate ? r.updatedAt.toDate() : new Date(r.updatedAt || r.at || r.createdAt || 0)) >= from);
        if (to) {
          const end = new Date(to); end.setHours(23,59,59,999);
          rows = rows.filter(r => (r.updatedAt?.toDate ? r.updatedAt.toDate() : new Date(r.updatedAt || r.at || r.createdAt || 0)) <= end);
        }

        setHistory(rows);
      } catch (e) {
        // silent
      } finally {
        setHistLoading(false);
      }
    };
    run();
  }, [user, statusFilter, histClassFilter, fromDate, toDate]);

  const parsePayload = (raw) => {
    try {
      // Expect qaf://attend?sid=...&t=...
      if (raw.startsWith('qaf://')) {
        const u = new URL(raw.replace('qaf://', 'https://'));
        const sid = u.searchParams.get('sid');
        const tkn = u.searchParams.get('t');
        return { sid, token: tkn };
      }
      // Also allow direct URL form
      const u = new URL(raw);
      const sid = u.searchParams.get('sid');
      const tkn = u.searchParams.get('t');
      return { sid, token: tkn };
    } catch { return { sid: null, token: null }; }
  };

  const handleRawValue = async (raw) => {
    const { sid, token } = parsePayload(raw);
    if (!sid || !token) return;
    try {
      setMessage(t('processing') || 'Processing...');
      const payload = { 
        sid, 
        token, 
        deviceHash: simpleDeviceHash(), 
        classId: (classId || undefined),
        status: attendanceStatus,
      };
      if (attendanceStatus === 'leave') {
        payload.reason = leaveReason;
        if (leaveNote.trim()) {
          payload.note = leaveNote.trim();
        }
      }
      const res = await scanAttendance(payload);
      setLastResult({ ok: true, sid, at: new Date().toISOString() });
      setMessage(t('attendance_recorded') || 'Attendance recorded.');
      setLeaveNote(''); // Clear note after successful scan
    } catch (e) {
      setLastResult({ ok: false, error: e?.message || 'error' });
      setMessage(`${t('error') || 'Error'}: ${e?.message || 'unknown'}`);
    }
  };

  const handleManualSubmit = async () => {
    await handleRawValue(manualText.trim());
  };

  const onSelectClass = (val) => {
    setClassId(val);
    try { localStorage.setItem('attend_class', val || ''); } catch {}
  };

  return (
    <>
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '1rem' }}>
      <h1 style={{ marginTop: 0 }}>{(t('scan_attendance') || 'Scan Attendance').replaceAll('_',' ')}</h1>

      <div style={{ display:'grid', gridTemplateColumns:'minmax(280px,360px) 1fr', gap: 16, alignItems:'start' }}>
        <div style={{ position: 'relative', background: '#000', borderRadius: 12, overflow: 'hidden' }}>
          <video ref={videoRef} playsInline muted style={{ width: '100%', height: 'auto', display: 'block' }} />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          {!('BarcodeDetector' in window) && (
            <div style={{ position:'absolute', inset:0, display:'grid', placeItems:'center', color:'#fff', background:'rgba(0,0,0,0.4)' }}>
              {(t('scanner_not_supported_use_manual') || 'Scanner not supported. Use manual entry.').replaceAll('_',' ')}
            </div>
          )}
        </div>
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr', gap: 8 }}>
            <div>
              <div style={{ marginBottom: 6, fontWeight: 700 }}>{(t('class') || 'Class').replaceAll('_',' ')}</div>
              <select value={classId} onChange={(e)=>onSelectClass(e.target.value)} style={{ width:'100%', padding:'0.6rem', border:'1px solid var(--border)', borderRadius:8, background:'var(--panel)', color:'inherit' }}>
                <option value="">{(t('select_class_optional') || 'Select class (optional)').replaceAll('_',' ')}</option>
                {classOptions.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <div style={{ marginBottom: 6, fontWeight: 700 }}>{(t('status') || 'Status').replaceAll('_',' ')}</div>
              <select value={attendanceStatus} onChange={(e)=>setAttendanceStatus(e.target.value)} style={{ width:'100%', padding:'0.6rem', border:'1px solid var(--border)', borderRadius:8, background:'var(--panel)', color:'inherit' }}>
                <option value="present">{(t('present_count') || 'Present').replaceAll('_',' ')}</option>
                <option value="leave">{(t('leave') || 'Leave').replaceAll('_',' ')}</option>
              </select>
            </div>
            {attendanceStatus === 'leave' && (
              <>
                <div>
                  <div style={{ marginBottom: 6, fontWeight: 700 }}>{(t('leave_reason') || 'Leave Reason').replaceAll('_',' ')}</div>
                  <select value={leaveReason} onChange={(e)=>setLeaveReason(e.target.value)} style={{ width:'100%', padding:'0.6rem', border:'1px solid var(--border)', borderRadius:8, background:'var(--panel)', color:'inherit' }}>
                    <option value="medical">{(t('medical') || 'Medical').replaceAll('_',' ')}</option>
                    <option value="official">{(t('official') || 'Official').replaceAll('_',' ')}</option>
                    <option value="other">{(t('other') || 'Other').replaceAll('_',' ')}</option>
                  </select>
                </div>
                <div>
                  <div style={{ marginBottom: 6, fontWeight: 700 }}>{(t('attendance_note') || 'Note').replaceAll('_',' ')} ({(t('optional') || 'Optional').replaceAll('_',' ')})</div>
                  <textarea value={leaveNote} onChange={(e)=>setLeaveNote(e.target.value)} placeholder="Enter reason details..." style={{ width:'100%', padding:'0.6rem', border:'1px solid var(--border)', borderRadius:8, background:'var(--panel)', color:'inherit', minHeight: 60, resize: 'vertical' }} />
                </div>
              </>
            )}
            <div>
              <div style={{ marginBottom: 6, fontWeight: 700 }}>{(t('manual_entry') || 'Manual Entry').replaceAll('_',' ')}</div>
              <input value={manualText} onChange={(e)=>setManualText(e.target.value)} placeholder="Paste link OR enter 6-digit code" style={{ width:'100%', padding:'0.6rem', border:'1px solid var(--border)', borderRadius:8, background:'var(--panel)', color:'inherit' }} />
              <div style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>
                Enter the 6-digit code shown on instructor's screen, or paste the full link
              </div>
              <div style={{ marginTop: 8, display:'flex', gap: 8 }}>
                <button onClick={handleManualSubmit} style={{ padding:'0.6rem 1rem', border:'none', borderRadius:8, background:'#800020', color:'#fff', fontWeight:600 }}>{(t('submit') || 'Submit').replaceAll('_',' ')}</button>
                <div style={{ alignSelf:'center', color:'var(--muted)', fontSize: 12 }}>{scanning ? ((t('scanning')||'Scanning...').replaceAll('_',' ')) : ((t('scanner_idle')||'Scanner idle').replaceAll('_',' '))}</div>
              </div>
              {message && <div style={{ marginTop: 8, fontSize: 14 }}>{message}</div>}
              {lastResult && (
                <div style={{ marginTop: 8, fontSize: 12, color: lastResult.ok ? '#10b981' : '#ef4444' }}>
                  {lastResult.ok ? ((t('last_scan_ok') || 'Last scan OK').replaceAll('_',' ')) : ((t('last_scan_failed') || 'Last scan failed').replaceAll('_',' '))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* History & Reports */}
    {showHistory && <div style={{ maxWidth: 880, margin: '1rem auto', padding: '1rem', background:'var(--panel)', borderRadius:12 }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap', marginBottom:8 }}>
        <strong>{(t('attendance_history') || 'Attendance History').replaceAll('_',' ')}</strong>
        <select value={histClassFilter} onChange={(e)=>setHistClassFilter(e.target.value)} style={{ padding:'0.4rem 0.6rem', borderRadius:8, border:'1px solid var(--border)' }}>
          <option value="all">{(t('all_classes')||'All Classes').replaceAll('_',' ')}</option>
          {classOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)} style={{ padding:'0.4rem 0.6rem', borderRadius:8, border:'1px solid var(--border)' }}>
          <option value="all">{(t('all')||'All').replaceAll('_',' ')}</option>
          <option value="present">{(t('present')||'Present').replaceAll('_',' ')}</option>
          <option value="absent">{(t('absent')||'Absent').replaceAll('_',' ')}</option>
          <option value="anomaly">{(t('anomaly')||'Anomaly').replaceAll('_',' ')}</option>
        </select>
        <input type="date" value={fromDate} onChange={(e)=>setFromDate(e.target.value)} style={{ padding:'0.4rem 0.6rem', borderRadius:8, border:'1px solid var(--border)' }} />
        <input type="date" value={toDate} onChange={(e)=>setToDate(e.target.value)} style={{ padding:'0.4rem 0.6rem', borderRadius:8, border:'1px solid var(--border)' }} />
      </div>
      {histLoading ? (
        <div style={{ padding:'1rem' }}>{(t('loading')||'Loading...').replaceAll('_',' ')}</div>
      ) : (
        <div style={{ display:'grid', gap:8 }}>
          <div style={{ justifySelf: 'end' }}>
            <button onClick={()=>{
              const headers = ['Class','Session','Status','Updated At'];
              const rows = history.map(h=>[
                (h.className||h.classId||''),
                (h.sessionId||''),
                (h.status||''),
                new Date(h.updatedAt?.toDate ? h.updatedAt.toDate() : (h.updatedAt || h.at || h.createdAt || Date.now())).toLocaleString('en-GB')
              ]);
              const csv = [headers.join(','), ...rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(','))].join('\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob); const a = document.createElement('a');
              a.href = url; a.download = `attendance_history_${new Date().toISOString().split('T')[0]}.csv`; a.click();
              setTimeout(()=>URL.revokeObjectURL(url), 1000);
            }} style={{ padding:'0.4rem 0.75rem', borderRadius:8, border:'1px solid var(--border)', background:'#fff' }}>{(t('export_csv')||'Export CSV').replaceAll('_',' ')}</button>
          </div>
          {history.length === 0 ? (
            <div style={{ padding:'0.5rem', color:'var(--muted)' }}>{(t('no_records')||'No records').replaceAll('_',' ')}</div>
          ) : history.map((h, i) => (
            <div key={i} style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:8, padding:'0.5rem 0.75rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontWeight:600 }}>{h.className || h.classId || h._path}</div>
                <div style={{ fontSize:12, color:'#666' }}>{(t('session')||'Session').replaceAll('_',' ')}: {h.sessionId || (h._path.split('/').slice(-1)[0])}</div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ fontWeight:700, color: h.status==='present' ? '#10b981' : h.status==='anomaly' ? '#ef4444' : '#6b7280' }}>{(h.status||'—').toString()}</span>
                <span style={{ fontSize:12, color:'#666' }}>
                  {new Date(h.updatedAt?.toDate ? h.updatedAt.toDate() : (h.updatedAt || h.at || h.createdAt || Date.now())).toLocaleString('en-GB')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>}
    </>
  );
};

export default StudentAttendancePage;
