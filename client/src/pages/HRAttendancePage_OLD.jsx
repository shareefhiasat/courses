import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { db } from '../firebase/config';
import { collection, getDocs, doc, updateDoc, query, where, orderBy, limit, getDoc } from 'firebase/firestore';
import { FileDown, Search, Filter, Calendar, User, AlertCircle } from 'lucide-react';

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
      
      // Apply filters
      if (classFilter !== 'all') {
        data = data.filter(s => s.classId === classFilter);
      }
      if (dateFrom) {
        const from = new Date(dateFrom);
        data = data.filter(s => {
          const createdAt = s.createdAt?.toDate ? s.createdAt.toDate() : new Date(s.createdAt || 0);
          return createdAt >= from;
        });
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        data = data.filter(s => {
          const createdAt = s.createdAt?.toDate ? s.createdAt.toDate() : new Date(s.createdAt || 0);
          return createdAt <= to;
        });
      }

      // Sort by date desc
      data.sort((a, b) => {
        const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return bDate - aDate;
      });

      setSessions(data);
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
      <h1 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
        <User size={28} />
        {t('hr_attendance') || 'HR Attendance Monitoring'}
      </h1>

      {/* Filters */}
      <div style={{ marginBottom: 16, padding: '1rem', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={18} />
          <span>{t('filters') || 'Filters'}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 12 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>{t('class') || 'Class'}</label>
            <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--panel)', color: 'inherit' }}>
              <option value="all">{t('all_classes') || 'All Classes'}</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name || c.code || c.id}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>{t('status') || 'Status'}</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--panel)', color: 'inherit' }}>
              <option value="all">{t('all') || 'All'}</option>
              <option value="present">{t('attended') || 'Attended'}</option>
              <option value="late">{t('late') || 'Late'}</option>
              <option value="absent">{t('absent') || 'Absent'}</option>
              <option value="leave">{t('leave') || 'Leave'}</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>{t('from_date') || 'From Date'}</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--panel)', color: 'inherit' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>{t('to_date') || 'To Date'}</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--panel)', color: 'inherit' }} />
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
        <div style={{ padding: '1rem', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12, maxHeight: 600, overflowY: 'auto' }}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>{t('sessions') || 'Sessions'} ({sessions.length})</div>
          {loading && <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--muted)' }}>{t('loading') || 'Loading...'}</div>}
          {!loading && sessions.length === 0 && <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--muted)' }}>{t('no_sessions') || 'No sessions found'}</div>}
          <div style={{ display: 'grid', gap: 8 }}>
            {sessions.map(session => {
              const className = classes.find(c => c.id === session.classId)?.name || session.classId;
              const createdAt = session.createdAt?.toDate ? session.createdAt.toDate() : new Date(session.createdAt || 0);
              const isSelected = selectedSession?.id === session.id;
              return (
                <div
                  key={session.id}
                  onClick={() => { setSelectedSession(session); loadMarks(session.id); }}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    background: isSelected ? 'rgba(102,126,234,0.12)' : '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{className}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                    {createdAt.toLocaleDateString('en-GB')} {createdAt.toLocaleTimeString('en-GB')}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    Status: {session.status || 'open'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Marks Detail */}
        <div style={{ padding: '1rem', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12 }}>
          {!selectedSession && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
              <Search size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <div>{t('select_session') || 'Select a session to view attendance details'}</div>
            </div>
          )}
          {selectedSession && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>{classes.find(c => c.id === selectedSession.classId)?.name || selectedSession.classId}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {t('total_scans') || 'Total Scans'}: {marks.length}
                  </div>
                </div>
                <button onClick={() => exportSessionCSV(selectedSession.id)} style={{ padding: '0.5rem 1rem', border: '1px solid var(--border)', borderRadius: 8, background: '#10b981', color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileDown size={16} />
                  {t('export_csv') || 'Export CSV'}
                </button>
              </div>

              {/* Summary Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
                {['present', 'late', 'absent', 'leave'].map(status => {
                  const count = marks.filter(m => (m.status || 'present') === status).length;
                  const colors = { present: '#10b981', late: '#f59e0b', absent: '#ef4444', leave: '#6366f1' };
                  return (
                    <div key={status} style={{ padding: '0.75rem', background: colors[status] + '15', border: `1px solid ${colors[status]}`, borderRadius: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: 24, fontWeight: 700, color: colors[status] }}>{count}</div>
                      <div style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 600, color: colors[status] }}>{t(status) || status}</div>
                    </div>
                  );
                })}
              </div>

              {/* Marks Table */}
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {marks.length === 0 && <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--muted)' }}>{t('no_marks') || 'No attendance records'}</div>}
                <div style={{ display: 'grid', gap: 8 }}>
                  {marks.map(mark => {
                    const isEditing = editingMark?.uid === mark.uid;
                    const statusColor = { present: '#10b981', late: '#f59e0b', absent: '#ef4444', leave: '#6366f1' }[mark.status || 'present'] || '#6b7280';
                    return (
                      <div key={mark.uid} style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 8, background: '#fff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600 }}>{mark.userName || mark.uid}</div>
                            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{mark.userEmail}</div>
                          </div>
                          <div style={{ padding: '4px 8px', borderRadius: 6, background: statusColor + '20', color: statusColor, fontSize: 11, fontWeight: 600 }}>
                            {mark.status || 'present'}
                          </div>
                        </div>
                        {mark.reason && <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}><strong>Reason:</strong> {mark.reason}</div>}
                        {mark.feedback && <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}><strong>Feedback:</strong> {mark.feedback}</div>}
                        {!isEditing && (
                          <button onClick={() => { setEditingMark(mark); setReason(mark.reason || ''); setFeedback(mark.feedback || ''); }} style={{ padding: '0.4rem 0.75rem', border: '1px solid var(--border)', borderRadius: 6, background: '#667eea', color: 'white', fontSize: 12, fontWeight: 600, marginTop: 8 }}>
                            {t('edit') || 'Edit'}
                          </button>
                        )}
                        {isEditing && (
                          <div style={{ marginTop: 8, padding: '0.75rem', background: '#f9fafb', borderRadius: 8 }}>
                            <div style={{ marginBottom: 8 }}>
                              <label style={{ display: 'block', marginBottom: 4, fontSize: 11, fontWeight: 600 }}>{t('status') || 'Status'}</label>
                              <select value={mark.status || 'present'} onChange={(e) => setEditingMark({ ...mark, status: e.target.value })} style={{ width: '100%', padding: '0.4rem', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }}>
                                <option value="present">{t('attended') || 'Attended'}</option>
                                <option value="late">{t('late') || 'Late'}</option>
                                <option value="absent">{t('absent') || 'Absent'}</option>
                                <option value="leave">{t('leave') || 'Leave'}</option>
                              </select>
                            </div>
                            <div style={{ marginBottom: 8 }}>
                              <label style={{ display: 'block', marginBottom: 4, fontSize: 11, fontWeight: 600 }}>{t('reason') || 'Reason'}</label>
                              <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g., Medical appointment" style={{ width: '100%', padding: '0.4rem', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }} />
                            </div>
                            <div style={{ marginBottom: 8 }}>
                              <label style={{ display: 'block', marginBottom: 4, fontSize: 11, fontWeight: 600 }}>{t('feedback') || 'Feedback'}</label>
                              <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Additional notes..." rows={2} style={{ width: '100%', padding: '0.4rem', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, resize: 'vertical' }} />
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button onClick={() => updateMarkStatus(selectedSession.id, mark.uid, editingMark.status, reason, feedback)} style={{ padding: '0.4rem 0.75rem', border: 'none', borderRadius: 6, background: '#10b981', color: 'white', fontSize: 12, fontWeight: 600 }}>
                                {t('save') || 'Save'}
                              </button>
                              <button onClick={() => { setEditingMark(null); setReason(''); setFeedback(''); }} style={{ padding: '0.4rem 0.75rem', border: '1px solid var(--border)', borderRadius: 6, background: 'white', fontSize: 12, fontWeight: 600 }}>
                                {t('cancel') || 'Cancel'}
                              </button>
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
