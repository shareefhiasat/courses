import { useState, useEffect } from 'react';
import { useToast } from '@ui';
import { useLang } from '@contexts/LangContext';
import { collection, query, orderBy, limit, where, getDocs } from 'firebase/firestore';
import { db } from '@services/other/config';
import { formatDateTime } from '@utils/date';
import { AdvancedDataGrid, SimpleLoading, Select, Input, Badge } from '@ui';
import { 
  getEmailTypeIcon, 
  getEmailStatusOptions, 
  getEmailTypeOptions, 
  getEmailStatusBadge
} from '@constants/emailTypes';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import PortalTooltip from '@ui/PortalTooltip';

const EmailLogs = ({ defaultTypeFilter = 'all', actionsSlot = null }) => {
  const toast = useToast();
  const { t } = useLang();
  const { theme } = useTheme();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [missingIndexUrl, setMissingIndexUrl] = useState('');
  const [filters, setFilters] = useState({
    type: defaultTypeFilter,
    status: 'all',
    search: '',
    dateRange: 'last7days'
  });
  const [selectedLog, setSelectedLog] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.type, filters.status, filters.dateRange]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      let q = query(
          collection(db, 'emailLogs'),
          orderBy('timestamp', 'desc'),
          limit(100)
      );

      // Apply filters
      if (filters.type !== 'all') {
        q = query(q, where('type', '==', filters.type));
      }

      if (filters.status !== 'all') {
        q = query(q, where('status', '==', filters.status));
      }

      const snapshot = await getDocs(q);

      const logList = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        // Only add valid objects, skip any malformed data
        if (data && typeof data === 'object') {
          logList.push({ id: doc.id, ...data });
        } else {
          logger.warn('[EmailLogs] Skipping invalid document:', doc.id, data);
        }
      });

      setMissingIndexUrl('');
      setLogs(logList);
    } catch (error) {
      // Detect missing index error and provide a helpful link instead of noisy toasts
      const msg = error?.message || '';
      const idxPrefix = 'https://console.firebase.google.com';
      const match = msg.includes('requires an index') && msg.match(/https:\/\/console\.firebase\.google\.com[^\s)]+/);
      if (match && match[0]) {
        setMissingIndexUrl(match[0]);
      } else {
        logger.error('Error loading logs:', error);
        toast?.showError(t('emaillogs_failed_to_load') + (error?.message || ''));
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      const toArray = Array.isArray(log?.to) ? log.to : [log?.to];
      return (
          log?.subject?.toLowerCase().includes(search) ||
          toArray.some(email => email?.toLowerCase().includes(search)) ||
          log?.type?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const gridRows = filteredLogs
  .map((log, index) => {
    if (!log || typeof log !== 'object') {
      logger.warn('[EmailLogs] Skipping malformed log row:', log);
      return null;
    }

    const resolvedId = log.id || log.docId || `log-${index}`;

    return {
      ...log,
      id: resolvedId,
      __rowIndex: index,
    };
  })
  .filter(Boolean);

  return (
      <div>
        {missingIndexUrl && (
            <div style={{
              marginBottom: '1rem',
              padding: '0.75rem 1rem',
              background: '#fdecea',
              color: '#611a15',
              border: '1px solid #f5c2c7',
              borderRadius: 8
            }}>
              <strong>{t('emaillogs_action_needed')}</strong> {t('emaillogs_requires_index')}
              <a href={missingIndexUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#b02a37', textDecoration: 'underline', marginLeft: 6 }}>{t('emaillogs_create_index')}</a>
              . {t('emaillogs_after_index_build')}
            </div>
        )}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ color: '#666', fontSize: '0.95rem', marginBottom: '1rem' }}>
            {t('emaillogs_description')}
          </p>

          {/* Filters */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            {defaultTypeFilter === 'all' && <Select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                options={getEmailTypeOptions(theme)}
                fullWidth
                searchable
            />}

            <Select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                options={getEmailStatusOptions(theme)}
                fullWidth
                searchable
            />

            <Input
                type="text"
                placeholder={t('emaillogs_search_placeholder')}
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                fullWidth
            />
          </div>

          {actionsSlot && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                {actionsSlot}
              </div>
          )}
        </div>

        {/* Logs Grid */}
        <AdvancedDataGrid
            rows={gridRows}
            getRowId={(row) => row.id || row.__rowIndex}
            columns={[
              {
                field: 'timestamp',
                headerName: t('date_time'),
                width: 180,
                renderCell: (params) => {
                  const r = params.row || {};
                  const ts = r.timestamp || r.sentAt || r.createdAt || r.date;
                  if (!ts) return '—';
                  try {
                    if (ts && typeof ts.toDate === 'function') {
                      return formatDateTime(ts);
                    }
                    if (typeof ts === 'number') {
                      return formatDateTime({ toDate: () => new Date(ts) });
                    }
                    if (typeof ts === 'string') {
                      return formatDateTime({ toDate: () => new Date(ts) });
                    }
                  } catch {}
                  return '—';
                }
              },
              {
                field: 'type',
                headerName: t('type'),
                width: 150,
                renderCell: (params) => (
                    <span style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
                {getEmailTypeIcon(params.value, 18, theme)}
                      <span style={{ fontSize: '0.85rem' }}>{params.value}</span>
              </span>
                )
              },
              {
                field: 'subject',
                headerName: t('subject'),
                flex: 1,
                minWidth: 200,
                renderCell: (params) => {
                  const r = params.row || {};
                  const value = r.subject || r.title || r.summary;
                  return value || '—';
                }
              },
              {
                field: 'to',
                headerName: t('to'),
                width: 200,
                renderCell: (params) => {
                  const r = params.row || {};
                  const rawTo = r.to || r.recipients || r.recipient;
                  const toArray = Array.isArray(rawTo) ? rawTo : (rawTo ? [rawTo] : []);
                  if (toArray.length === 0) return '—';
                  return toArray.length === 1 ? toArray[0] : `${toArray.length} ${t('emaillogs_recipients')}`;
                }
              },
              {
                field: 'status',
                headerName: t('status'),
                width: 120,
                renderCell: (params) => getEmailStatusBadge(params.value, t, theme)
              },
              {
                field: 'actions',
                headerName: t('actions_col'),
                width: 100,
                sortable: false,
                renderCell: (params) => (
                    <PortalTooltip content={t('view')} position="top">
                    <button
                        onClick={() => {
                          setSelectedLog(params.row);
                          setShowPreview(true);
                        }}
                        style={{
                          padding: '6px 12px',
                          background: 'var(--color-primary, #0d6efd)',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                    >
                      {getThemedIcon('ui', 'eye', 16, theme)}
                    </button>
                    </PortalTooltip>
                )
              }
            ]}
            pageSize={20}
            pageSizeOptions={[10, 20, 50, 100]}
            checkboxSelection
            exportFileName="email-logs"
            showExportButton
            exportLabel={t('export') || 'Export'}
            loadingOverlayMessage={loading ? "Loading email logs..." : undefined}
        />

        {/* Preview Overlay (full-screen, highly visible) */}
        {showPreview && selectedLog && (
            <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(0, 0, 0, 0.7)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  zIndex: 99999,
                  padding: '3rem 2rem 2rem'
                }}
                onClick={() => {
                  logger.log('Closing email log preview overlay');
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
                  padding: '0.75rem 1rem',
                  background: 'var(--color-primary, #800020)',
                  color: 'white',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem' }}>
                    {getEmailTypeIcon(selectedLog.type, 18, theme)}
                    <span style={{ fontWeight: 500, maxWidth: 420, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedLog.subject || 'Email log'}
                </span>
                  </div>
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
                <div style={{ flex: 1, overflowY: 'auto', background: '#f5f5f5a3', padding: '1.25rem' }}>
                  <div style={{ background: 'white', borderRadius: 10, padding: '1.25rem', border: '1px solid #e5e7eb' }}>
                    {/* Metadata box */}
                    <div style={{ marginBottom: '1.25rem', padding: '1rem', background: '#f8f9fa', borderRadius: 8 }}>
                      <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.9rem' }}>
                        <div><strong>Date/Time:</strong> {selectedLog.timestamp ? formatDateTime(selectedLog.timestamp) : 'N/A'}</div>
                        <div><strong>Type:</strong> {getEmailTypeIcon(selectedLog.type, 16, theme)} {selectedLog.type}</div>
                        <div><strong>Subject:</strong> {selectedLog.subject}</div>
                        <div><strong>From:</strong> {selectedLog.senderName} &lt;{selectedLog.from}&gt;</div>
                        <div><strong>To:</strong> {Array.isArray(selectedLog.to) ? selectedLog.to.join(', ') : selectedLog.to}</div>
                        <div><strong>Status:</strong> {getEmailStatusBadge(selectedLog.status, t, theme)}</div>
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
                                      color: 'var(--color-primary, #800020)',
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

