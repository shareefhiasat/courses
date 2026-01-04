import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { scanAttendance, simpleDeviceHash } from '../firebase/attendance';
import { Button, Select, Loading, DatePicker, useToast } from '../components/ui';
import { Download } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

const StudentAttendancePage = () => {
  const { user } = useAuth();
  const { t } = useLang();
  const toast = useToast();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const handleRawValueRef = useRef(null);
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
    let html5QrCode = null;
    const start = async () => {
      try {
        const videoElement = videoRef.current;
        if (!videoElement) return;

        // Check if mediaDevices is available (required for camera access)
        // Polyfill for older browsers and mobile devices
        if (!navigator.mediaDevices) {
          navigator.mediaDevices = {};
        }
        
        if (!navigator.mediaDevices.getUserMedia) {
          // Try legacy API for older browsers
          const getUserMedia = navigator.getUserMedia || 
                              navigator.webkitGetUserMedia || 
                              navigator.mozGetUserMedia || 
                              navigator.msGetUserMedia;
          
          if (getUserMedia) {
            navigator.mediaDevices.getUserMedia = (constraints) => {
              return new Promise((resolve, reject) => {
                getUserMedia.call(navigator, constraints, resolve, reject);
              });
            };
          } else {
            setMessage('Camera access not supported in this browser. Please use manual entry.');
            return;
          }
        }

        // Use html5-qrcode for better mobile support
        // Ensure container has unique ID
        if (!videoElement.id) {
          videoElement.id = 'qr-reader-container-' + Date.now();
        }
        const containerId = videoElement.id;
        
        // Clear any existing scanner instance to prevent double views
        if (html5QrCodeRef.current) {
          try {
            if (html5QrCodeRef.current.isScanning) {
              await html5QrCodeRef.current.stop();
            }
            await html5QrCodeRef.current.clear();
          } catch (e) {
            console.warn('[StudentAttendance] Cleanup warning:', e);
          }
        }
        
        // Ensure container is completely empty before creating new scanner
        const container = document.getElementById(containerId);
        if (container) {
          container.innerHTML = '';
          // Remove any leftover video/canvas elements
          const videos = container.querySelectorAll('video');
          videos.forEach(v => {
            if (v.srcObject) {
              const tracks = v.srcObject.getTracks();
              tracks.forEach(track => track.stop());
            }
            v.remove();
          });
          const canvases = container.querySelectorAll('canvas');
          canvases.forEach(c => c.remove());
        }
        
        html5QrCode = new Html5Qrcode(containerId);
        html5QrCodeRef.current = html5QrCode;

        const config = {
          fps: 30, // Higher FPS for faster detection
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          disableFlip: false,
          videoConstraints: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          // Better mobile support
          supportedScanTypes: [],
          formatsToSupport: [Html5Qrcode.SCAN_TYPE_CAMERA]
        };

        setScanning(true);
        setMessage('');

        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          async (decodedText, decodedResult) => {
            // Successfully scanned QR code
            if (handleRawValueRef.current) {
              // Stop scanning first
              if (html5QrCode && html5QrCode.isScanning) {
                await html5QrCode.stop();
                setScanning(false);
              }
              // Show success toast
              if (toast?.success) {
                toast.success(t('qr_code_detected') || 'QR code detected! Processing...');
              }
              // Process the scan
              await handleRawValueRef.current(decodedText);
            }
          },
          (errorMessage) => {
            // Ignore scanning errors (they're frequent during scanning)
            // Only show errors if scanning is not active
            if (!scanning) {
              console.log('[QR Scanner]', errorMessage);
            }
          }
        );
      } catch (e) {
        console.error('[StudentAttendance] QR Scanner error:', e);
        setMessage(e?.message || 'Failed to start camera. Please check permissions and use manual entry.');
        setScanning(false);
        
        // Clean up on error
        if (html5QrCode && html5QrCode.isScanning) {
          try {
            await html5QrCode.stop();
          } catch {}
        }
      }
    };

    // Add unique ID to container element if not present
    if (videoRef.current && !videoRef.current.id) {
      videoRef.current.id = 'qr-reader-container';
    }

    start();

    return () => {
      // Cleanup
      if (html5QrCode) {
        if (html5QrCode.isScanning) {
          html5QrCode.stop().catch(() => {});
        }
        try {
          html5QrCode.clear().catch(() => {});
        } catch {}
      }
      // Clean up container and media tracks
      const container = videoRef.current;
      if (container) {
        container.innerHTML = '';
        const videos = container.querySelectorAll('video');
        videos.forEach(v => {
          if (v.srcObject) {
            const tracks = v.srcObject.getTracks();
            tracks.forEach(track => track.stop());
          }
          v.remove();
        });
        const canvases = container.querySelectorAll('canvas');
        canvases.forEach(c => c.remove());
      }
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
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
        const { doc, getDoc, collection, getDocs, query, where } = await import('firebase/firestore');
        const { db } = await import('../firebase/config');
        const { getEnrollments } = await import('../firebase/firestore');
        
        // Get user data including visibility preference
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        const userData = userSnap.exists() ? userSnap.data() : {};
        let ids = Array.isArray(userData.enrolledClasses) ? userData.enrolledClasses : [];
        
        // Also check enrollments collection
        const enrollmentsResult = await getEnrollments();
        if (enrollmentsResult.success) {
          const allEnr = enrollmentsResult.data || [];
          const byUid = allEnr.filter(e => e.userId === user.uid);
          let mine = byUid;
          if (mine.length === 0 && user.email) {
            const byEmail = allEnr.filter(e => (e.userEmail || e.email) === user.email);
            mine = byEmail;
          }
          const enrollmentIds = new Set(mine.map(e => e.classId));
          ids = Array.from(new Set([...ids, ...enrollmentIds]));
        }
        
        // Check user-level visibility preference
        setShowHistory(userData.showAttendanceHistory !== false);
        
        // Fetch all classes, then filter by ids
        const clsSnap = await getDocs(collection(db, 'classes'));
        const all = [];
        const visibilityMap = {};
        clsSnap.forEach(d => {
          const classData = d.data();
          all.push({ id: d.id, docId: d.id, ...classData });
          // Store class-level visibility setting
          visibilityMap[d.id] = classData.attendanceVisibility !== false;
        });
        setClassVisibilitySettings(visibilityMap);
        
        const options = all.filter(c => ids.includes(c.id) || ids.includes(c.docId)).map(c => ({ id: c.id, name: c.name || c.code || c.id }));
        setClassOptions(options);
        if (!classId && options.length === 1) setClassId(options[0].id);
      } catch (e) {
        console.error('[StudentAttendance] Error loading classes:', e);
      }
    };
    load();
  }, [user]);

  // Load history with filters
  useEffect(() => {
    const run = async () => {
      if (!user?.uid) return;
      setHistLoading(true);
      try {
        const { collection, getDocs, query, where, orderBy, doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../firebase/config');
        
        // Get all attendance sessions
        const sessionsQuery = query(collection(db, 'attendanceSessions'), orderBy('createdAt', 'desc'));
        const sessionsSnap = await getDocs(sessionsQuery);
        
        const allMarks = [];
        
        // For each session, get the mark for this student
        for (const sessionDoc of sessionsSnap.docs) {
          const sessionData = sessionDoc.data();
          const sessionId = sessionDoc.id;
          
          // Apply class filter early
          if (histClassFilter !== 'all' && sessionData.classId !== histClassFilter) {
            continue;
          }
          
          // Get mark for this student
          try {
            const markDoc = await getDoc(doc(db, 'attendanceSessions', sessionId, 'marks', user.uid));
            if (markDoc.exists()) {
              const markData = markDoc.data();
              const markDate = markData.at?.toDate ? markData.at.toDate() : (markData.updatedAt?.toDate ? markData.updatedAt.toDate() : new Date(sessionData.createdAt?.toDate ? sessionData.createdAt.toDate() : sessionData.createdAt || 0));
              
              // Apply date filters
              if (fromDate) {
                const from = new Date(fromDate);
                if (markDate < from) continue;
              }
              if (toDate) {
                const to = new Date(toDate);
                to.setHours(23, 59, 59, 999);
                if (markDate > to) continue;
              }
              
              // Apply status filter
              if (statusFilter !== 'all') {
                const status = markData.status || 'present';
                if (status !== statusFilter) continue;
              }
              
              // Get class name
              let className = sessionData.classId;
              try {
                const classDoc = await getDoc(doc(db, 'classes', sessionData.classId));
                if (classDoc.exists()) {
                  const classData = classDoc.data();
                  className = classData.name || classData.code || sessionData.classId;
                }
              } catch {}
              
              allMarks.push({
                id: `${sessionId}_${user.uid}`,
                sessionId,
                classId: sessionData.classId,
                className,
                status: markData.status || 'present',
                reason: markData.reason,
                feedback: markData.feedback,
                at: markDate,
                createdAt: markDate,
                updatedAt: markData.updatedAt?.toDate ? markData.updatedAt.toDate() : markDate
              });
            }
          } catch (e) {
            // Skip if mark doesn't exist or error
            continue;
          }
        }
        
        // Sort by date descending
        allMarks.sort((a, b) => (b.at || b.createdAt) - (a.at || a.createdAt));
        
        setHistory(allMarks);
      } catch (e) {
        console.error('[StudentAttendance] Error loading history:', e);
      } finally {
        setHistLoading(false);
      }
    };
    run();
  }, [user, statusFilter, histClassFilter, fromDate, toDate]);

  const parsePayload = (raw) => {
    try {
      // Handle 6-digit code - need to find active session with matching manual code
      if (/^\d{6}$/.test(raw.trim())) {
        // This is a 6-digit code, we'll need to look it up
        return { manualCode: raw.trim(), sid: null, token: null };
      }
      
      // Expect qaf://attend?sid=...&t=...
      if (raw.startsWith('qaf://')) {
        const u = new URL(raw.replace('qaf://', 'https://'));
        const sid = u.searchParams.get('sid');
        const tkn = u.searchParams.get('t');
        return { sid, token: tkn };
      }
      // Also allow direct URL form
      if (raw.includes('http://') || raw.includes('https://')) {
        const u = new URL(raw);
        const sid = u.searchParams.get('sid');
        const tkn = u.searchParams.get('t');
        return { sid, token: tkn };
      }
      // Try parsing as relative URL with query params
      if (raw.includes('?sid=') || raw.includes('&sid=')) {
        const parts = raw.split('?');
        if (parts.length > 1) {
          const params = new URLSearchParams(parts[1]);
          const sid = params.get('sid');
          const tkn = params.get('t');
          return { sid, token: tkn };
        }
      }
      return { sid: null, token: null };
    } catch { return { sid: null, token: null }; }
  };

  const handleRawValue = async (raw) => {
    const parsed = parsePayload(raw);
    
    // Handle 6-digit manual code
    if (parsed.manualCode) {
      try {
        setMessage(t('looking_up_session') || 'Looking up session...');
        const { collection, getDocs, query, where } = await import('firebase/firestore');
        const { db } = await import('../firebase/config');
        
        // Find active session with matching manual code
        const sessionsQuery = query(
          collection(db, 'attendanceSessions'),
          where('status', '==', 'open')
        );
        const sessionsSnap = await getDocs(sessionsQuery);
        
        let foundSession = null;
        // Try to find session by checking if manual code matches (code is generated from token hash)
        // Generate code from token using same algorithm as AttendancePage: hash % 1000000
        const sessionsList = sessionsSnap.docs.map(d => ({ id: d.id, token: d.data().token || '', ...d.data() }));
        
        // Check all active sessions - token is stored in session document
        for (const session of sessionsList) {
          if (session.token) {
            // Generate code from token (same logic as AttendancePage)
            const hash = session.token.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const code = String(hash % 1000000).padStart(6, '0');
            
            if (code === parsed.manualCode) {
              foundSession = { id: session.id, token: session.token };
              break;
            }
          }
        }
        
        if (!foundSession) {
          setMessage(t('session_not_found') || 'Session not found. Please check the code or use the full attendance link.');
          setLastResult({ ok: false, error: 'Session not found' });
          if (toast?.error) {
            toast.error(t('session_not_found') || 'Session not found. Please use the full link from your instructor.');
          }
          return;
        }
        
        parsed.sid = foundSession.id;
        parsed.token = foundSession.token;
      } catch (e) {
        console.error('[StudentAttendance] Error looking up manual code:', e);
        setMessage(t('error_looking_up') || 'Error looking up session. Please use the full attendance link.');
        setLastResult({ ok: false, error: e?.message || 'Lookup failed' });
        if (toast?.error) {
          toast.error(t('error_looking_up') || 'Error looking up session. Please use the full link.');
        }
        return;
      }
    }
    
    const { sid, token } = parsed;
    if (!sid || !token) {
      setMessage(t('invalid_code_or_link') || 'Invalid code or link. Please enter a 6-digit code or paste the full attendance link.');
      setLastResult({ ok: false, error: 'Invalid input' });
      return;
    }
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
      setManualText(''); // Clear manual input after successful scan
      
      // Show success toast
      if (toast?.success) {
        toast.success(t('attendance_recorded') || 'Attendance recorded successfully!');
      }
    } catch (e) {
      setLastResult({ ok: false, error: e?.message || 'error' });
      setMessage(`${t('error') || 'Error'}: ${e?.message || 'unknown'}`);
    }
  };

  // Store handleRawValue in ref for use in useEffect
  handleRawValueRef.current = handleRawValue;

  const handleManualSubmit = async () => {
    if (!manualText.trim()) {
      setMessage(t('please_enter_code') || 'Please enter a code or paste the attendance link');
      return;
    }
    await handleRawValue(manualText.trim());
  };

  const onSelectClass = (val) => {
    setClassId(val);
    try { localStorage.setItem('attend_class', val || ''); } catch {}
  };

  return (
    <>
    <div className="content-section" style={{ maxWidth: 880, margin: '0 auto', padding: '1rem' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, alignItems:'start' }}>
        <div style={{ position: 'relative', background: '#000', borderRadius: 12, overflow: 'hidden', minHeight: '240px', width: '100%' }}>
          <div ref={videoRef} id="qr-reader-container" style={{ width: '100%', minHeight: '240px', position: 'relative' }} />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          {!scanning && (
            <div style={{ position:'absolute', inset:0, display:'grid', placeItems:'center', color:'#fff', background:'rgba(0,0,0,0.7)', padding: '1rem', textAlign: 'center', zIndex: 1 }}>
              <div>
                <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                  {(t('camera_loading') || 'Initializing camera...').replaceAll('_',' ')}
                </div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                  {(t('allow_camera_permission') || 'Please allow camera access when prompted.').replaceAll('_',' ')}
                </div>
              </div>
            </div>
          )}
          {scanning && (
            <div style={{ position:'absolute', top: 8, left: 8, background:'rgba(16, 185, 129, 0.9)', color:'white', padding:'0.25rem 0.5rem', borderRadius:6, fontSize:'0.75rem', fontWeight:600, zIndex: 2 }}>
              {(t('scanning') || 'Scanning...').replaceAll('_',' ')}
            </div>
          )}
        </div>
        <div style={{ width: '100%' }}>
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
    {showHistory && <div className="content-section" style={{ maxWidth: 880, margin: '1rem auto', padding: '1rem', background:'var(--panel)', borderRadius:12 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(120px, 1fr))', gap: 8, marginBottom: 12 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <strong style={{ fontSize: '1rem' }}>{(t('attendance_history') || 'Attendance History').replaceAll('_',' ')}</strong>
        </div>
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
        <DatePicker
          type="date"
          value={fromDate}
          onChange={(iso) => setFromDate(iso || '')}
          placeholder={t('from_date') || 'From Date'}
          size="small"
        />
        <DatePicker
          type="date"
          value={toDate}
          onChange={(iso) => setToDate(iso || '')}
          placeholder={t('to_date') || 'To Date'}
          size="small"
        />
      </div>
      {histLoading ? (
        <Loading />
      ) : history.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
          {t('no_records') || 'No records found'}
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
              {t('showing') || 'Showing'} {history.length} {t('records') || 'records'}
            </div>
            <Button 
              variant="secondary" 
              size="sm"
              icon={<Download size={16} />}
              onClick={()=>{
                const headers = ['Date','Status','Class','Reason','Note'];
                const csvRows = history.map(h => [
                  (h.at || h.createdAt || h.updatedAt) ? new Date(h.at || h.createdAt || h.updatedAt).toLocaleString('en-GB') : '',
                  h.status||'present', 
                  h.className||h.classId||'',
                  h.reason||'',
                  h.feedback||h.note||''
                ]);
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
          {history.map((h, i) => (
            <div key={h.id || i} style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:8, padding:'0.75rem', display:'flex', flexDirection:'column', gap: 6 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight:600, wordBreak: 'break-word' }}>{h.className || h.classId || 'Unknown Class'}</div>
                  <div style={{ fontSize:12, color:'#666', marginTop: 4 }}>{(t('session')||'Session').replaceAll('_',' ')}: {h.sessionId ? h.sessionId.slice(0, 8) + '...' : '—'}</div>
                </div>
                <span style={{ fontWeight:700, color: h.status==='present' ? '#10b981' : h.status==='late' ? '#f59e0b' : h.status==='leave' ? '#8b5cf6' : '#6b7280', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>{(h.status||'—').toString().replace('_', ' ')}</span>
              </div>
              <div style={{ fontSize:12, color:'#666' }}>
                {new Date(h.at || h.createdAt || h.updatedAt || Date.now()).toLocaleString('en-GB')}
              </div>
              {h.reason && (
                <div style={{ fontSize:11, color:'#666', fontStyle:'italic' }}>
                  {t('reason') || 'Reason'}: {h.reason}
                </div>
              )}
              {h.feedback && (
                <div style={{ fontSize:11, color:'#666' }}>
                  {h.feedback}
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>}
    </>
  );
};

export default StudentAttendancePage;
