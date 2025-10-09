import { useState, useEffect } from 'react';
import { useToast } from './ToastProvider';
import Modal from './Modal';
import { useLang } from '../contexts/LangContext';

const EmailLogs = () => {
  const toast = useToast();
  const { t } = useLang();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    search: '',
    dateRange: 'last7days'
  });
  const [selectedLog, setSelectedLog] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadLogs();
  }, [filters.type, filters.status, filters.dateRange]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const { collection, query, orderBy, limit, where } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');
      
      let q = query(
        collection(db, 'emailLogs'),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
      
      // Apply filters
      if (filters.type !== 'all') {
        const { query: queryFn, where: whereFn } = await import('firebase/firestore');
        q = queryFn(q, whereFn('type', '==', filters.type));
      }
      
      if (filters.status !== 'all') {
        const { query: queryFn, where: whereFn } = await import('firebase/firestore');
        q = queryFn(q, whereFn('status', '==', filters.status));
      }
      
      const { getDocs } = await import('firebase/firestore');
      const snapshot = await getDocs(q);
      
      const logList = [];
      snapshot.forEach(doc => {
        logList.push({ id: doc.id, ...doc.data() });
      });
      
      setLogs(logList);
    } catch (error) {
      console.error('Error loading logs:', error);
      toast?.showError('Failed to load email logs: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      const toArray = Array.isArray(log.to) ? log.to : [log.to];
      return (
        log.subject?.toLowerCase().includes(search) ||
        toArray.some(email => email?.toLowerCase().includes(search)) ||
        log.type?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const getTypeIcon = (type) => {
    const icons = {
      announcement: '📢',
      activity: '📝',
      activity_complete: '✅',
      activity_graded: '🎯',
      enrollment: '🎓',
      resource: '📚',
      chat_digest: '💬',
      custom: '✉️'
    };
    return icons[type] || '✉️';
  };

  const getStatusBadge = (status) => {
    if (status === 'sent') {
      return <span style={{ padding: '4px 8px', background: '#d4edda', color: '#155724', borderRadius: 4, fontSize: '0.8rem', fontWeight: 600 }}>✓ {t('sent_status')}</span>;
    } else {
      return <span style={{ padding: '4px 8px', background: '#f8d7da', color: '#721c24', borderRadius: 4, fontSize: '0.8rem', fontWeight: 600 }}>✗ {t('failed_status')}</span>;
    }
  };

  const exportToCSV = () => {
    const headers = ['Date/Time', 'Type', 'Subject', 'To', 'Status', 'Error'];
    const rows = filteredLogs.map(log => [
      log.timestamp?.toDate?.()?.toLocaleString('en-GB') || '',
      log.type || '',
      log.subject || '',
      Array.isArray(log.to) ? log.to.join('; ') : log.to || '',
      log.status || '',
      log.error || ''
    ]);
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast?.showSuccess('Logs exported to CSV!');
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading email logs...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ color: '#666', fontSize: '0.95rem', marginBottom: '1rem' }}>
          View all sent emails with full audit trail. Search by recipient, subject, or type.
        </p>

        {/* Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: 6 }}
            >
              <option value="all">All Types</option>
              <option value="announcement">📢 Announcements</option>
              <option value="activity">📝 Activities</option>
              <option value="activity_graded">🎯 Grading</option>
              <option value="activity_complete">✅ Completions</option>
              <option value="enrollment">🎓 Enrollments</option>
              <option value="resource">📚 Resources</option>
              <option value="chat_digest">💬 Chat Digest</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: 6 }}
            >
              <option value="all">All Status</option>
              <option value="sent">✓ Sent</option>
              <option value="failed">✗ Failed</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Search</label>
            <input
              type="text"
              placeholder="Search by email, subject..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: 6 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              onClick={exportToCSV}
              disabled={filteredLogs.length === 0}
              style={{
                padding: '8px 16px',
                background: filteredLogs.length === 0 ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: filteredLogs.length === 0 ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem'
              }}
            >
              📥 Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      {filteredLogs.length === 0 ? (
        <div style={{
          padding: '3rem',
          textAlign: 'center',
          background: '#f8f9fa',
          borderRadius: 12,
          border: '2px dashed #ddd'
        }}>
          <p style={{ fontSize: '1.1rem', color: '#666' }}>
            {filters.search || filters.type !== 'all' || filters.status !== 'all' 
              ? 'No logs found matching your filters.' 
              : 'No email logs yet. Emails will appear here once sent.'}
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: 8 }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #ddd', fontWeight: 600 }}>{t('date_time')}</th>
                <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #ddd', fontWeight: 600 }}>{t('type')}</th>
                <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #ddd', fontWeight: 600 }}>{t('subject')}</th>
                <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #ddd', fontWeight: 600 }}>{t('to')}</th>
                <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #ddd', fontWeight: 600 }}>{t('status')}</th>
                <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #ddd', fontWeight: 600 }}>{t('actions_col')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => {
                const toArray = Array.isArray(log.to) ? log.to : [log.to];
                return (
                  <tr key={log.id} style={{ borderBottom: '1px solid #f3f3f3' }}>
                    <td style={{ padding: '12px', fontSize: '0.85rem' }}>
                      {log.timestamp?.toDate?.()?.toLocaleString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) || 'N/A'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ fontSize: '1.2rem' }}>{getTypeIcon(log.type)}</span>
                      <span style={{ marginLeft: '8px', fontSize: '0.85rem' }}>{log.type}</span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.9rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.subject || 'No subject'}
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.85rem' }}>
                      {toArray.length === 1 ? toArray[0] : `${toArray.length} recipients`}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {getStatusBadge(log.status)}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button
                        onClick={() => {
                          console.log('👁️ View button clicked!');
                          console.log('Log data:', log);
                          setSelectedLog(log);
                          setShowPreview(true);
                          console.log('Set showPreview to true');
                        }}
                        style={{
                          padding: '6px 12px',
                          background: '#0d6efd',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        👁️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Preview Overlay (full-screen, highly visible) */}
      {showPreview && selectedLog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '2rem'
          }}
          onClick={() => {
            console.log('Closing email log preview overlay');
            setShowPreview(false);
            setSelectedLog(null);
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 12,
              maxWidth: '980px',
              width: '100%',
              maxHeight: '92vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: '1.15rem' }}>📧 Email Log Preview</h2>
              <button
                onClick={() => {
                  setShowPreview(false);
                  setSelectedLog(null);
                }}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content */}
            <div style={{ flex: 1, overflowY: 'auto', background: '#f5f5f5', padding: '1.25rem' }}>
              <div style={{ background: 'white', borderRadius: 10, padding: '1.25rem', border: '1px solid #e5e7eb' }}>
                {/* Metadata box */}
                <div style={{ marginBottom: '1.25rem', padding: '1rem', background: '#f8f9fa', borderRadius: 8 }}>
                  <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.9rem' }}>
                    <div><strong>Date/Time:</strong> {selectedLog.timestamp?.toDate?.()?.toLocaleString('en-GB') || 'N/A'}</div>
                    <div><strong>Type:</strong> {getTypeIcon(selectedLog.type)} {selectedLog.type}</div>
                    <div><strong>Subject:</strong> {selectedLog.subject}</div>
                    <div><strong>From:</strong> {selectedLog.senderName} &lt;{selectedLog.from}&gt;</div>
                    <div><strong>To:</strong> {Array.isArray(selectedLog.to) ? selectedLog.to.join(', ') : selectedLog.to}</div>
                    <div><strong>Status:</strong> {getStatusBadge(selectedLog.status)}</div>
                    {selectedLog.error && (
                      <div style={{ color: '#dc3545' }}><strong>Error:</strong> {selectedLog.error}</div>
                    )}
                    <div><strong>Template ID:</strong> <code>{selectedLog.templateId}</code></div>
                  </div>
                </div>

                {/* Variables Used */}
                {selectedLog.variables && Object.keys(selectedLog.variables).length > 0 && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem' }}>Variables Used:</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {Object.keys(selectedLog.variables).map(key => (
                        <span
                          key={key}
                          style={{
                            padding: '4px 8px',
                            background: '#e7f3ff',
                            borderRadius: 4,
                            fontSize: '0.8rem',
                            color: '#667eea',
                            fontFamily: 'monospace'
                          }}
                        >
                          {`{{${key}}}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* HTML Preview */}
                {selectedLog.htmlBody && (
                  <div>
                    <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem' }}>Email Preview:</h4>
                    <div
                      style={{
                        border: '1px solid #ddd',
                        borderRadius: 8,
                        padding: '1rem',
                        background: 'white',
                        maxHeight: '60vh',
                        overflowY: 'auto'
                      }}
                      dangerouslySetInnerHTML={{ __html: selectedLog.htmlBody }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailLogs;
