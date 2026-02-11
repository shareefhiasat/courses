import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getNotificationLogs } from '@firebaseServices/notificationService';
import { formatDateTime } from '@utils/date';
import { Loading, Modal, Select, Button, Card, CardBody, Badge, AdvancedDataGrid, DatePicker, useToast } from '@ui';
import { getNotificationTriggerOptions, getNotificationChannelOptions } from '@constants';
import InfoTooltip from '@ui/InfoTooltip/InfoTooltip';
import './NotificationLogsPage.css';

const NotificationLogsPage = () => {
  let lang = 'en';
  let t = (key, fallback) => {
    // Fallback function that returns the key or fallback
    return fallback || key;
  };
  
  try {
    const langContext = useLang();
    if (langContext && typeof langContext.t === 'function') {
      lang = langContext.lang || 'en';
      t = langContext.t;
    }
  } catch (error) {
    console.warn('useLang context not available:', error);
    // Use fallback function already set above
  }
  const { theme } = useTheme();
  
  let toast = {
    showSuccess: () => {},
    showError: () => {},
    showInfo: () => {},
  };
  
  try {
    const uiToast = useToast();
    toast = {
      showSuccess: uiToast.success,
      showError: uiToast.error,
      showInfo: uiToast.info,
    };
  } catch (error) {
    console.warn('useToast hook not available:', error);
  }
  
  const [loading, setLoading] = useState(false);
  const [notificationLogs, setNotificationLogs] = useState([]);
  const [notificationLogFilters, setNotificationLogFilters] = useState({
    trigger: '',
    channel: '',
    startDate: null,
    endDate: null
  });
  const [selectedNotificationLog, setSelectedNotificationLog] = useState(null);
  const [notificationLogModalOpen, setNotificationLogModalOpen] = useState(false);
  
  const triggerOptions = useMemo(() => getNotificationTriggerOptions(), []);
  const channelOptions = useMemo(() => getNotificationChannelOptions(), []);
  
  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getNotificationLogs(notificationLogFilters);
      if (result?.success) {
        setNotificationLogs(result.data);
      } else {
        toast?.showError('Failed to load notification logs');
      }
    } catch (error) {
      toast?.showError('Error loading notification logs: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadData();
  }, [notificationLogFilters]);
  
  const handleFilterChange = (filterName, value) => {
    setNotificationLogFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };
  
  const columns = [
    {
      key: 'timestamp',
      label: t('timestamp', 'Timestamp'),
      render: (value) => formatDateTime(value),
      sortable: true
    },
    {
      key: 'trigger',
      label: t('trigger', 'Trigger'),
      render: (value) => {
        const option = triggerOptions.find(opt => opt.value === value);
        return option ? option.label : value;
      }
    },
    {
      key: 'channel',
      label: t('channel', 'Channel'),
      render: (value) => {
        const option = channelOptions.find(opt => opt.value === value);
        return option ? option.label : value;
      }
    },
    {
      key: 'recipientCount',
      label: t('recipients', 'Recipients'),
      render: (value) => <Badge variant="secondary">{value}</Badge>
    },
    {
      key: 'status',
      label: t('status', 'Status'),
      render: (value) => (
        <Badge variant={value === 'sent' ? 'success' : 'error'}>
          {value}
        </Badge>
      )
    }
  ];
  
  return (
    <div className="notification-logs-page">
      <div className="tab-header">
        <h2>{t('notification_logs', 'Notification Logs')}</h2>
        <div className="tooltip-wrapper">
          <InfoTooltip contentKey={`help.notification_logs`} />
        </div>
      </div>
      
      <Card className="filter-card">
        <CardBody>
          <div className="filters-row">
            <Select
              label={t('trigger', 'Trigger')}
              options={triggerOptions}
              value={notificationLogFilters.trigger}
              onChange={(value) => handleFilterChange('trigger', value)}
              clearable
            />
            <Select
              label={t('channel', 'Channel')}
              options={channelOptions}
              value={notificationLogFilters.channel}
              onChange={(value) => handleFilterChange('channel', value)}
              clearable
            />
            <DatePicker
              label={t('start_date', 'Start Date')}
              value={notificationLogFilters.startDate}
              onChange={(value) => handleFilterChange('startDate', value)}
            />
            <DatePicker
              label={t('end_date', 'End Date')}
              value={notificationLogFilters.endDate}
              onChange={(value) => handleFilterChange('endDate', value)}
            />
          </div>
        </CardBody>
      </Card>
      
      {loading ? (
        <Loading variant="overlay" />
      ) : (
        <AdvancedDataGrid
          data={notificationLogs}
          columns={columns}
          sortable
          pagination
          itemsPerPage={20}
          emptyMessage={t('no_notification_logs', 'No notification logs found')}
          onRowClick={(row) => {
            setSelectedNotificationLog(row);
            setNotificationLogModalOpen(true);
          }}
        />
      )}

      {/* Notification Log Detail Modal */}
      {notificationLogModalOpen && selectedNotificationLog && (
        <Modal
          isOpen={notificationLogModalOpen}
          onClose={() => {
            setNotificationLogModalOpen(false);
            setSelectedNotificationLog(null);
          }}
          title={t('notification_log_details', 'Notification Log Details')}
          size="medium"
        >
          <div style={{ padding: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <strong>{t('timestamp', 'Timestamp')}:</strong>
              <div>{formatDateTime(selectedNotificationLog.timestamp)}</div>

              <strong>{t('trigger', 'Trigger')}:</strong>
              <div><Badge text={selectedNotificationLog.trigger} type="info" size="small" /></div>

              <strong>{t('channel', 'Channel')}:</strong>
              <div><Badge text={selectedNotificationLog.channel} type="info" size="small" /></div>

              <strong>{t('user_id', 'User ID')}:</strong>
              <div>{selectedNotificationLog.userId || 'N/A'}</div>

              <strong>{t('role', 'Role')}:</strong>
              <div><Badge text={selectedNotificationLog.role} type={selectedNotificationLog.role === 'admin' ? 'error' : 'success'} size="small" /></div>

              <strong>{t('status', 'Status')}:</strong>
              <div>
                <Badge
                  text={selectedNotificationLog.success ? t('success', 'Success') : t('failed', 'Failed')}
                  type={selectedNotificationLog.success ? 'success' : 'error'}
                  size="small"
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ marginBottom: '0.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.25rem' }}>
                {t('content_details', 'Content Details')}
              </h4>
              <div className="detail-item" style={{ marginBottom: '0.5rem' }}>
                <strong>{t('title', 'Title')}:</strong>
                <div style={{ padding: '0.5rem', background: theme === 'dark' ? '#333' : '#f9f9f9', borderRadius: '4px', marginTop: '0.25rem' }}>
                  {selectedNotificationLog.details?.title || 'N/A'}
                </div>
              </div>
              <div className="detail-item">
                <strong>{t('message', 'Message')}:</strong>
                <div style={{ padding: '0.5rem', background: theme === 'dark' ? '#333' : '#f9f9f9', borderRadius: '4px', marginTop: '0.25rem', whiteSpace: 'pre-wrap' }}>
                  {selectedNotificationLog.details?.message || 'N/A'}
                </div>
              </div>
            </div>

            {selectedNotificationLog.details?.variables && Object.keys(selectedNotificationLog.details.variables).length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '0.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.25rem' }}>
                  {t('variables', 'Variables')}
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem 1rem', padding: '0.5rem', background: theme === 'dark' ? '#333' : '#f9f9f9', borderRadius: '4px' }}>
                  {Object.entries(selectedNotificationLog.details.variables).map(([key, value]) => (
                    <React.Fragment key={key}>
                      <span style={{ fontWeight: 600, color: '#888' }}>{key}:</span>
                      <span>{String(value)}</span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            {selectedNotificationLog.details?.error && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '0.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.25rem', color: '#ef4444' }}>
                  {t('error_details', 'Error Details')}
                </h4>
                <div style={{ padding: '0.5rem', background: '#fef2f2', color: '#991b1b', borderRadius: '4px', border: '1px solid #fee2e2' }}>
                  {selectedNotificationLog.details.error}
                </div>
              </div>
            )}

            <div className="form-actions" style={{ marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <Button onClick={() => setNotificationLogModalOpen(false)}>
                {t('close', 'Close')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default NotificationLogsPage;
