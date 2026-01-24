import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import jsQR from 'jsqr';
import { getAttendanceByClass } from '../../firebase/attendance';
import { getPenalties } from '../../firebase/penalties';
import { getUsers } from '../../firebase/firestore';
import eventBus, { EVENTS } from '../../utils/eventBus';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LangContext';
import { RefreshCw } from 'lucide-react';

const QrCodeIcon = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const CameraIcon = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
    <circle cx="12" cy="13" r="3"/>
  </svg>
);

const AttendanceIcon = ({ style }) => (
  <svg style={style} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="m22 21-3-3 3-3"/>
    <path d="M16 8h6"/>
  </svg>
);

export default function QRScanner({ onScan, classId, onActivityUpdate, onDeleteActivity }) {
  const { user } = useAuth();
  const { t, lang, isRTL } = useLang();
  const [isScanning, setIsScanning] = useState(false);
  const [recentScans, setRecentScans] = useState(0);
  const [error, setError] = useState('');
  const [cameraMode, setCameraMode] = useState('environment'); // 'environment' for back camera, 'user' for front
  const [devices, setDevices] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [recentActivity, setRecentActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [expandedActivities, setExpandedActivities] = useState(new Set());
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    };
    setIsMobile(checkMobile());
  }, []);

  // Get available cameras
  useEffect(() => {
    const getDevices = async () => {
      try {
        const deviceList = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = deviceList.filter(device => device.kind === 'videoinput');
        setDevices(videoDevices);
      } catch (err) {
        console.error('Error getting devices:', err);
      }
    };
    getDevices();
  }, []);

  const startCamera = async () => {
    try {
      setError('');
      setIsScanning(true);

      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Request camera access with appropriate constraints
      const constraints = {
        video: {
          facingMode: cameraMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Start scanning for QR codes
      scanIntervalRef.current = setInterval(scanQRCode, 100);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please check permissions.');
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    setIsScanning(false);
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        handleQRCodeDetected(code.data);
      }
    }
  };

  const handleQRCodeDetected = (data) => {
    // console.log('QR Code detected:', data);
    onScan(data);
    setRecentScans(prev => prev + 1);
    stopCamera();
  };

  const toggleCamera = () => {
    if (isScanning) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const switchCameraMode = () => {
    const newMode = cameraMode === 'environment' ? 'user' : 'environment';
    setCameraMode(newMode);
    
    if (isScanning) {
      stopCamera();
      setTimeout(() => {
        setCameraMode(newMode);
        startCamera();
      }, 100);
    }
  };

  // Fetch real activity data
  const toggleActivityExpansion = (activityId) => {
    const newExpanded = new Set(expandedActivities);
    if (newExpanded.has(activityId)) {
      newExpanded.delete(activityId);
    } else {
      newExpanded.add(activityId);
    }
    setExpandedActivities(newExpanded);
  };

  const fetchRecentActivity = async () => {
    if (!classId) return;
    
    setActivityLoading(true);
    try {
      // Small delay to ensure Firestore has processed the update
      await new Promise(resolve => setTimeout(resolve, 500));

      // Use local date string YYYY-MM-DD to avoid timezone shifts
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      // Get today's attendance records for this class
      const attendanceResponse = await getAttendanceByClass(classId, todayStr);
      const attendanceRecords = attendanceResponse.success ? attendanceResponse.data : [];
      
      // Get today's penalty records for students in this class
      const penaltiesResponse = await getPenalties();
      const allPenalties = penaltiesResponse.success ? penaltiesResponse.data : [];
      
      // Get all users to find student names
      const usersResponse = await getUsers();
      const allUsers = usersResponse.success ? usersResponse.data : [];
      
      // Create a map of studentId to student name
      const studentMap = {};
      allUsers.forEach(u => {
        const userId = u.id || u.docId;
        const name = u.displayName || u.realName || u.name || (u.email ? u.email.split('@')[0] : 'Unknown');
        studentMap[userId] = name;
      });
      
      // Filter penalties for today only
      const todayPenalties = allPenalties.filter(p => {
        if (!p.studentId || !studentMap[p.studentId]) return false;
        
        // Handle Firestore serverTimestamp field values (might be null if just created locally)
        const timestamp = p.createdAt || p.timestamp;
        if (!timestamp) return true; // Assume today if no timestamp yet (just created)
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        
        return dateStr === todayStr;
      });
      
      console.log('[QR Scanner] Activity refresh found:', attendanceRecords.length, 'attendance,', todayPenalties.length, 'penalties');
      
      // Combine and format activity logs
      const activityLogs = [
        ...attendanceRecords.map(record => ({
          id: record.id || `attendance-${Math.random()}`,
          time: record.timestamp || record.updatedAt || record.date,
          type: record.category || (record.delta ? (record.delta > 0 ? 'participation' : 'behavior') : 'attendance'),
          studentId: record.studentId,
          studentName: studentMap[record.studentId] || 'Unknown Student',
          status: record.status || 'present',
          delta: record.delta,
          label: record.notes || record.reason || '',
          method: record.method || 'QR Scan',
          performedBy: record.performedBy || user || { displayName: 'System', email: 'system@qaf.com' },
          scanMethod: record.scanMethod || (record.method === 'QR Scan' ? 'auto' : 'manual_instructor')
        })),
        ...todayPenalties.map(record => ({
          id: record.id || record.docId || `penalty-${Math.random()}`,
          time: record.createdAt || record.timestamp || new Date(),
          type: 'penalty',
          studentId: record.studentId,
          studentName: studentMap[record.studentId] || 'Unknown Student',
          status: 'penalty',
          label: record.reason || record.type || 'Penalty',
          points: record.points,
          performedBy: record.performedBy || user || { displayName: 'System', email: 'system@qaf.com' },
          scanMethod: 'manual_instructor'
        }))
      ].sort((a, b) => {
        const timeA = a.time?.toDate ? a.time.toDate() : new Date(a.time);
        const timeB = b.time?.toDate ? b.time.toDate() : new Date(b.time);
        return timeB - timeA;
      }).slice(0, 15);
      
      // Remove duplicate attendance records for same student
      const uniqueLogs = [];
      const seen = new Set();
      
      activityLogs.forEach(log => {
        // Create a unique key based on student and action type
        // For attendance, we only want the latest one
        if (log.type === 'attendance') {
          const key = `${log.studentId}-${log.type}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueLogs.push(log);
          }
        } else {
          // For behavior/participation/penalty, show all
          uniqueLogs.push(log);
        }
      });
      
      console.log('[QR Scanner] Final activity logs (deduped):', uniqueLogs.length);
      
      // Format time for display
      const formattedLogs = uniqueLogs.map(log => ({
        ...log,
        time: log.time?.toDate ? log.time.toDate().toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        }) : (log.time instanceof Date ? log.time.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        }) : log.time || '')
      }));
      
      setRecentActivity(formattedLogs);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      setRecentActivity([]);
    } finally {
      setActivityLoading(false);
    }
  };

  // Listen for real-time activity updates
  useEffect(() => {
    const unsubscribeActivity = eventBus.on(EVENTS.ACTIVITY_UPDATE, () => {
      fetchRecentActivity();
    });

    const unsubscribeAttendance = eventBus.on(EVENTS.ATTENDANCE_MARKED, () => {
      fetchRecentActivity();
    });

    const unsubscribeBehavior = eventBus.on(EVENTS.BEHAVIOR_LOGGED, () => {
      fetchRecentActivity();
    });

    const unsubscribeParticipation = eventBus.on(EVENTS.PARTICIPATION_ADDED, () => {
      fetchRecentActivity();
    });

    const unsubscribePenalty = eventBus.on(EVENTS.PENALTY_ASSIGNED, () => {
      fetchRecentActivity();
    });

    return () => {
      unsubscribeActivity();
      unsubscribeAttendance();
      unsubscribeBehavior();
      unsubscribeParticipation();
      unsubscribePenalty();
    };
  }, [classId]);

  // Expose refresh function to parent
  useEffect(() => {
    if (onActivityUpdate) {
      onActivityUpdate(fetchRecentActivity);
    }
  }, [onActivityUpdate]);

  // Fetch activity when classId changes
  useEffect(() => {
    if (classId) {
      fetchRecentActivity();
    }
  }, [classId]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} style={{
      background: 'var(--panel, white)',
      borderRadius: '0.75rem',
      border: '1px solid var(--border, #e5e7eb)',
      padding: '1.5rem'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <QrCodeIcon className="w-5 h-5" style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-primary, #8b5cf6)' }} />
          <h3 style={{ fontWeight: 600, color: 'var(--text, #111827)', margin: 0, fontSize: '0.875rem' }}>
            {t('scanner')} {isScanning ? t('active') || 'Active' : t('ready') || 'Ready'}
          </h3>
        </div>
        <span style={{
          fontSize: '0.75rem',
          padding: '0.25rem 0.5rem',
          background: isScanning ? '#dcfce7' : '#dbeafe',
          color: isScanning ? '#166534' : '#1e40af',
          borderRadius: '0.375rem',
          fontWeight: 500
        }}>
          {isScanning ? t('scanning') || 'SCANNING' : t('idle') || 'IDLE'}
        </span>
      </div>

      <div style={{
        background: '#0f172a',
        borderRadius: '0.5rem',
        aspectRatio: '4/3',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {!isScanning ? (
          <div style={{ textAlign: 'center', zIndex: 1 }}>
            <CameraIcon className="w-12 h-12" style={{ 
              width: '3rem', 
              height: '3rem', 
              color: '#475569',
              margin: '0 auto 0.75rem'
            }} />
            <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.875rem', margin: 0 }}>
              {t('tap_to_activate')}
            </p>
            {error && (
              <p style={{ color: 'var(--color-danger, #ef4444)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                {error}
              </p>
            )}
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              style={{ display: 'none' }}
            />
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none'
            }}>
              <div style={{
                width: '60%',
                height: '60%',
                border: '2px solid #8b5cf6',
                borderRadius: '0.5rem',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '1rem',
                  height: '1rem',
                  borderTop: '3px solid #8b5cf6',
                  borderLeft: '3px solid #8b5cf6'
                }} />
                <div style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '1rem',
                  height: '1rem',
                  borderTop: '3px solid #8b5cf6',
                  borderRight: '3px solid #8b5cf6'
                }} />
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '1rem',
                  height: '1rem',
                  borderBottom: '3px solid #8b5cf6',
                  borderLeft: '3px solid #8b5cf6'
                }} />
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: '1rem',
                  height: '1rem',
                  borderBottom: '3px solid #8b5cf6',
                  borderRight: '3px solid #8b5cf6'
                }} />
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: '#8b5cf6',
                  animation: 'qr-scan-line 2s linear infinite'
                }} />
              </div>
            </div>
          </>
        )}

        <Button
          onClick={toggleCamera}
          variant="ghost"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            zIndex: isScanning ? 0 : 2
          }}
        >
          <span className="qr-sr-only">{isScanning ? 'Stop camera' : 'Activate camera'}</span>
        </Button>
      </div>

      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem'
        }}>
          <h4 style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: '#111827',
            margin: 0
          }}>
            {t('recent_activity') || 'Recent Activity'}
          </h4>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchRecentActivity}
            title="Refresh activity"
            style={{ padding: '0.25rem' }}
          >
            <RefreshCw style={{ width: '1rem', height: '1rem' }} />
          </Button>
        </div>
        {/*<div style={{*/}
        {/*  display: 'flex',*/}
        {/*  alignItems: 'center',*/}
        {/*  justifyContent: 'space-between',*/}
        {/*  fontSize: '0.875rem',*/}
        {/*  marginBottom: '1rem',*/}
        {/*  fontWeight: 600,*/}
        {/*  color: '#111827'*/}
        {/*}}>*/}
        {/*  <span>Recent Activity</span>*/}
        {/*  <span style={{ */}
        {/*    fontSize: '0.75rem', */}
        {/*    background: '#8b5cf6', */}
        {/*    color: 'white', */}
        {/*    padding: '0.25rem 0.5rem', */}
        {/*    borderRadius: '0.25rem',*/}
        {/*    fontWeight: 500 */}
        {/*  }}>*/}
        {/*    ACTIVE*/}
        {/*  </span>*/}
        {/*</div>*/}
        
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '0.75rem',
          [isRTL ? 'paddingRight' : 'paddingLeft']: '1rem',
          [isRTL ? 'borderRight' : 'borderLeft']: '3px solid #8b5cf6'
        }}>
          {/* Real activity logs from Firebase */}
          {activityLoading ? (
            <div style={{
              padding: '1rem',
              color: '#9ca3af',
              fontSize: '0.875rem',
              textAlign: 'center'
            }}>
              {t('loading')}...
            </div>
          ) : recentActivity.length === 0 ? (
            <div style={{
              padding: '1rem',
              color: '#9ca3af',
              fontSize: '0.875rem'
            }}>
              {t('no_recent_activity')}
            </div>
          ) : (
            recentActivity.map((activity) => {
              const getScanMethodDisplay = (scanMethod) => {
                switch(scanMethod) {
                  case 'auto':
                    return {
                      icon: '',
                      text: lang === 'ar' ? 'مسح QR' : 'QR Scan',
                      color: '#10b981'
                    };
                  case 'manual_instructor':
                    return {
                      icon: '',
                      text: lang === 'ar' ? 'يدوي' : 'Manual',
                      color: '#3b82f6'
                    };
                  case 'manual_hr':
                    return {
                      icon: '',
                      text: lang === 'ar' ? 'يدوي (موارد بشرية)' : 'Manual (HR)',
                      color: '#8b5cf6'
                    };
                  case 'manual_student':
                    return {
                      icon: '',
                      text: lang === 'ar' ? 'يدوي (طالب)' : 'Manual (Student)',
                      color: '#f59e0b'
                    };
                  default:
                    return {
                      icon: '',
                      text: lang === 'ar' ? 'يدوي' : 'Manual',
                      color: '#6b7280'
                    };
                }
              };

              const getStatusColor = (status, type, delta) => {
                if (type === 'participation' || delta > 0) return '#3b82f6';
                if (type === 'behavior' || delta < 0) return '#f97316';
                if (type === 'penalty') return '#dc2626';
                
                switch(status?.toLowerCase()) {
                  case 'present': return '#16a34a';
                  case 'late': return '#eab308';
                  case 'human_case': return '#8b5cf6';
                  case 'absent': 
                  case 'absent_no_excuse': 
                  case 'absent_with_excuse':
                  case 'excused_leave':
                    return '#dc2626';
                  default: return '#6b7280';
                }
              };
              
              const getStatusIcon = (status, type, delta) => {
                if (type === 'participation' || delta > 0) {
                  return (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="m21 16-8-5-5-5 5"/>
                    </svg>
                  );
                }
                if (type === 'behavior' || delta < 0) {
                  return (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                    </svg>
                  );
                }
                if (type === 'penalty') {
                  return (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                  );
                }

                switch(status?.toLowerCase()) {
                  case 'present': 
                    return (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    );
                  case 'late': 
                    return (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 12 12"></polyline>
                      </svg>
                    );
                  case 'absent':
                  case 'absent_no_excuse':
                  case 'absent_with_excuse':
                  case 'excused_leave':
                    return (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    );
                  case 'human_case':
                    return (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                    );
                  default: 
                    return (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                      </svg>
                    );
                }
              };
              
              const getStatusLabel = (status, type, delta) => {
                if (type === 'participation' || delta > 0) return t('participation') || 'Participation';
                if (type === 'behavior' || delta < 0) return t('behavior') || 'Behavior';
                if (type === 'penalty') return t('penalty') || 'Penalty';

                switch(status?.toLowerCase()) {
                  case 'present': return t('present');
                  case 'late': return t('late');
                  case 'absent': return t('absent');
                  case 'absent_no_excuse': return t('absent');
                  case 'absent_with_excuse': return t('absent_excused');
                  case 'excused_leave': return t('excused_leave');
                  case 'human_case': return t('human_case');
                  default: return status || t('present');
                }
              };
              
              return (
                <div key={activity.id} style={{
                  borderBottom: '1px solid #e5e7eb',
                  paddingBottom: expandedActivities.has(activity.id) ? '0.75rem' : '0.25rem'
                }}>
                  <div 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.5rem 0',
                      cursor: 'pointer'
                    }}
                    onClick={() => toggleActivityExpansion(activity.id)}
                  >
                    <div style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: getStatusColor(activity.status, activity.type, activity.delta),
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      {getStatusIcon(activity.status, activity.type, activity.delta)} {getStatusLabel(activity.status, activity.type, activity.delta)}
                    </div>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary, #374151)', flex: 1 }}>
                      {activity.studentName}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      {onDeleteActivity && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteActivity(activity);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-danger, #ef4444)',
                            cursor: 'pointer',
                            padding: '0.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '0.25rem'
                          }}
                          title="Delete activity"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                        </button>
                      )}
                      <svg 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        style={{
                          transform: expandedActivities.has(activity.id) ? (isRTL ? 'rotate(180deg)' : 'rotate(180deg)') : (isRTL ? 'rotate(90deg)' : 'rotate(0deg)'),
                          transition: 'transform 0.2s',
                          color: '#6b7280'
                        }}
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </div>
                  </div>
                  
                  {expandedActivities.has(activity.id) && (
                    <div style={{ 
                      paddingLeft: '3.5rem',
                      paddingTop: '0.5rem',
                      fontSize: '0.75rem',
                      color: '#6b7280'
                    }}>
                      <div style={{ marginBottom: '0.25rem' }}>
                        <strong>{t('date') || 'Date'}:</strong> {new Date().toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')} {activity.time?.toDate ? activity.time.toDate().toLocaleTimeString(lang === 'ar' ? 'ar-SA' : 'en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : (activity.time instanceof Date ? activity.time.toLocaleTimeString(lang === 'ar' ? 'ar-SA' : 'en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : activity.time || '')}
                      </div>
                      <div style={{ marginBottom: '0.25rem' }}>
                        <strong>{t('method') || 'Method'}:</strong> {getScanMethodDisplay(activity.scanMethod).text}
                      </div>
                      <div>
                        <strong>{t('by') || 'By'}:</strong> {activity.performedBy?.displayName || activity.performedBy?.email?.split('@')[0] || t('unknown')}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
        
        {devices.length > 1 && isScanning && (
          <button
            onClick={switchCameraMode}
            style={{
              width: '100%',
              padding: '0.5rem',
              background: '#f3f4f6',
              border: '1px solid #e5e7eb',
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              cursor: 'pointer',
              marginTop: '0.5rem'
            }}
          >
            Switch to {cameraMode === 'environment' ? 'Front' : 'Back'} Camera
          </button>
        )}
      </div>

      <style jsx>{`
        @keyframes qr-scan-line {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
      `}</style>
    </div>
  );
}
