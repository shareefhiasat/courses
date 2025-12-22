import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { db } from '../firebase/config';
import { collection, getDocs, doc, updateDoc, query, where, orderBy, limit, getDoc } from 'firebase/firestore';
import { FileDown, Search, Filter, Calendar, User, AlertCircle, Clock, CheckCircle, XCircle, Activity, Users, Heart } from 'lucide-react';
import { Button, Select, Loading, DatePicker } from '../components/ui';
import { ATTENDANCE_STATUS, ATTENDANCE_STATUS_LABELS } from '../firebase/attendance';

const HRAttendancePage = () => {
  const { user, isHR, isAdmin } = useAuth();
  const { t } = useLang();
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [classFilter, setClassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [classes, setClasses] = useState([]);
  const [editingMark, setEditingMark] = useState(null);
  const [savingMark, setSavingMark] = useState(null);
  const [reason, setReason] = useState('');
  const [feedback, setFeedback] = useState('');

  // Load classes
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'classes'));
        const opts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setClasses(opts);
      } catch {}
    })();
  }, []);

  // Load attendance sessions
  useEffect(() => {
    loadSessions();
  }, [classFilter, dateFrom, dateTo]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'attendanceSessions'));
      let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Enrich with class and instructor info
      const enriched = await Promise.all(data.map(async (session) => {
        try {
          // Get class info
          if (session.classId) {
            const classDoc = await getDoc(doc(db, 'classes', session.classId));
            if (classDoc.exists()) {
              const classData = classDoc.data();
              session.className = classData.name || classData.code || session.classId;
              session.classTerm = classData.term;
              session.classYear = classData.year;
              
              // Get instructor info
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
          console.warn('Failed to enrich session:', err);
        }
        return session;
      }));
      
      // Apply filters
      let filtered = enriched;
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
            console.warn('Failed to enrich session:', err);
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
    } catch (e) {
      console.error('[HR] Error loading sessions:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadMarks = async (sessionId) => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'attendanceSessions', sessionId, 'marks'));
      let data = snap.docs.map(d => ({ id: d.id, uid: d.id, ...d.data() }));

      // Enrich with user data
      const enriched = await Promise.all(data.map(async (mark) => {
        try {
          const userDoc = await getDoc(doc(db, 'users', mark.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            return { ...mark, userName: userData.displayName || userData.email, userEmail: userData.email };
          }
        } catch {}
        return mark;
      }));

      // Apply status filter
      let filtered = enriched;
      if (statusFilter !== 'all') {
        filtered = enriched.filter(m => (m.status || 'present') === statusFilter);
      }

      setMarks(filtered);
    } catch (e) {
      console.error('[HR] Error loading marks:', e);
    } finally {
      setLoading(false);
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
      console.error('[HR] Error updating mark:', e);
      alert('Failed to update: ' + (e?.message || 'unknown error'));
    }
  };

  const exportSessionCSV = async (sessionId) => {
    try {
      const snap = await getDocs(collection(db, 'attendanceSessions', sessionId, 'marks'));
      const rows = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
      
      // Enrich with user data
      const enriched = await Promise.all(rows.map(async (mark) => {
        try {
          const userDoc = await getDoc(doc(db, 'users', mark.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
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

  if (!isHR && !isAdmin) {
    return (
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
        <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: '1rem' }} />
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
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              options={[
                { value: 'all', label: t('all_classes') || 'All Classes' },
                ...classes.map(c => ({ value: c.id, label: c.name || c.code || c.id }))
              ]}
              fullWidth
              placeholder={t('class') || 'Class'}
            />
          </div>
          <div>
            <Select
              searchable
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: t('all') || 'All Status' },
                { value: 'present', label: t('attended') || 'Attended' },
                { value: 'late', label: t('late') || 'Late' },
                { value: 'absent', label: t('absent') || 'Absent' },
                { value: 'leave', label: t('leave') || 'Leave' }
              ]}
              fullWidth
              placeholder={t('status') || 'Status'}
            />
          </div>
          <div>
            <DatePicker
              type="date"
              value={dateFrom}
              onChange={(iso) => setDateFrom(iso ? new Date(iso).toLocaleDateString('en-CA') : '')}
              placeholder={t('from_date') || 'From Date'}
              fullWidth
            />
          </div>
          <div>
            <DatePicker
              type="date"
              value={dateTo}
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
          {loading && <div style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>{t('loading') || 'Loading...'}</div>}
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
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{className}</div>
                  {session.instructorName && (
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 2 }}>
                      👤 {session.instructorName}
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 2 }}>
                    📅 {createdAt.toLocaleDateString('en-GB')} {createdAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div style={{ fontSize: 10, color: session.status === 'open' ? '#10b981' : '#6b7280', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {session.status === 'open' ? (
                      <>
                        <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#10b981' }}></span>
                        Active Session
                      </>
                    ) : (
                      <>
                        <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#6b7280' }}></span>
                        Ended
                      </>
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
              <Search size={36} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
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
                      👤 {selectedSession.instructorName}
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
                    <Users size={14} />
                    <span>{marks.length} {marks.length === 1 ? 'scan' : 'scans'}</span>
                  </div>
                </div>
                <Button 
                  variant="success" 
                  size="small"
                  icon={<FileDown size={14} />}
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
                            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{mark.userName || mark.uid}</div>
                            <div style={{ fontSize: 10, color: 'var(--muted)' }}>{mark.userEmail}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ padding: '3px 8px', borderRadius: 6, background: statusColor + '20', color: statusColor, fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap' }}>
                              {statusLabel}
                            </div>
                            {!isEditing && (
                              <button onClick={() => { setEditingMark(mark); setReason(mark.reason || ''); setFeedback(mark.feedback || ''); }} style={{ padding: '0.3rem 0.6rem', border: '1px solid var(--border)', borderRadius: 6, background: '#667eea', color: 'white', fontSize: 11, fontWeight: 600 }}>
                                {t('edit') || 'Edit'}
                              </button>
                            )}
                          </div>
                        </div>
                        {!isEditing && (mark.reason || mark.feedback) && (
                          <div style={{ fontSize: 10, color: '#6b7280', marginTop: 4 }}>
                            {mark.reason && <span><strong>Reason:</strong> {mark.reason}</span>}
                            {mark.reason && mark.feedback && <span> • </span>}
                            {mark.feedback && <span><strong>Note:</strong> {mark.feedback}</span>}
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
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HRAttendancePage;
