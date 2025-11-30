import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { scanAttendance, simpleDeviceHash } from '../firebase/attendance';
import { Button, Select, Loading } from '../components/ui';
import { Download } from 'lucide-react';

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
              <Select
                value={attendanceStatus}
                onChange={(e)=>setAttendanceStatus(e.target.value)}
                options={[
                  { value: 'present', label: 'Present' },
                  { value: 'leave', label: 'Leave' }
                ]}
                fullWidth
              />
            </div>
            {attendanceStatus === 'leave' && (
              <>
                <div>
                  <Select
                    value={leaveReason}
                    onChange={(e)=>setLeaveReason(e.target.value)}
                    options={[
                      { value: 'medical', label: 'Sick Leave (Medical)' },
                      { value: 'official', label: 'Official Leave' },
                      { value: 'humanitarian', label: 'Humanitarian Case Leave' },
                      { value: 'personal', label: 'Personal Leave' }
                    ]}
                    fullWidth
                  />
                </div>
                <div>
                  <textarea value={leaveNote} onChange={(e)=>setLeaveNote(e.target.value)} placeholder="Enter reason details (optional)..." style={{ width:'100%', padding:'0.6rem', border:'1px solid var(--border)', borderRadius:8, background:'var(--panel)', color:'inherit', minHeight: 60, resize: 'vertical' }} />
                </div>
              </>
            )}
            <div>
              <input value={manualText} onChange={(e)=>setManualText(e.target.value)} placeholder="Enter 6-digit code or paste link" style={{ width:'100%', padding:'0.6rem', border:'1px solid var(--border)', borderRadius:8, background:'var(--panel)', color:'inherit' }} />
              <div style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>
                Enter the code shown on instructor's screen, or paste the full attendance link
              </div>
              <div style={{ marginTop: 8, display:'flex', gap: 8 }}>
                <button onClick={handleManualSubmit} style={{ padding:'0.6rem 1rem', border:'none', borderRadius:8, background:'#667eea', color:'#fff', fontWeight:600 }}>{(t('submit') || 'Submit').replaceAll('_',' ')}</button>
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
        <Select
          searchable
          size="small"
          value={histClassFilter}
          onChange={(e)=>setHistClassFilter(e.target.value)}
          options={[
            { value: 'all', label: (t('all_classes')||'All Classes').replaceAll('_',' ') },
            ...classOptions.map(c => ({ value: c.id, label: c.name }))
          ]}
        />
        <Select
          searchable
          size="small"
          value={statusFilter}
          onChange={(e)=>setStatusFilter(e.target.value)}
          options={[
            { value: 'all', label: (t('all')||'All').replaceAll('_',' ') },
            { value: 'present', label: (t('present')||'Present').replaceAll('_',' ') },
            { value: 'absent', label: (t('absent')||'Absent').replaceAll('_',' ') },
            { value: 'leave', label: (t('leave')||'Leave').replaceAll('_',' ') }
          ]}
        />
        <Select
          searchable
          size="small"
          value={fromDate}
          onChange={(e)=>setFromDate(e.target.value)}
          options={[
            { value: '', label: (t('from_date')||'From Date').replaceAll('_',' ') },
            ...Array(31).fill(0).map((_, i) => ({ value: `${i+1}`, label: `${i+1}` })),
          ]}
        />
        <Select
          searchable
          size="small"
          value={toDate}
          onChange={(e)=>setToDate(e.target.value)}
          options={[
            { value: '', label: (t('to_date')||'To Date').replaceAll('_',' ') },
            ...Array(31).fill(0).map((_, i) => ({ value: `${i+1}`, label: `${i+1}` })),
          ]}
        />
      </div>
      {histLoading ? (
        <Loading />
      ) : (
// ... (rest of the code remains the same)
        <div style={{ display:'grid', gap:8 }}>
          <div style={{ justifySelf: 'end' }}>
            <Button 
              variant="secondary" 
              size="sm"
              icon={<Download size={16} />}
              onClick={()=>{
                const headers = ['Date','Status','Class'];
                const csvRows = history.map(h => [new Date(h.scannedAt).toLocaleString('en-GB'), h.status||'present', h.className||'']);
                const csv = [headers.join(','), ...csvRows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(','))].join('\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob); const a = document.createElement('a');
                a.href = url; a.download = `attendance_history_${new Date().toISOString().split('T')[0]}.csv`; a.click();
                setTimeout(()=>URL.revokeObjectURL(url), 1000);
              }}
            >
              {t('export_csv') || 'Export CSV'}
            </Button>
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
