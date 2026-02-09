import React, { useState, useEffect } from 'react';
import { useTheme } from '@contexts/ThemeContext';
import { useLang } from '@contexts/LangContext';
import { useToast } from '@ui';
import { getQatarTimeAgo, formatQatarDate } from '@utils/timezone';
import { getThemedIcon } from '@constants/iconTypes';
import { Button, Input, Select, UserSelect, DateRangeSlider, AdvancedDataGrid, Modal } from '@ui';
import { getLoginLogs, deleteAllLoginLogs, deleteLoginLogsByType } from '@firebaseServices/activityService';
import { getUsers } from '@firebaseServices/userService';
import { getEnrollments } from '@firebaseServices/enrollmentService';

const LogsActivityPage = () => {
  const { t } = useLang();
  const toast = useToast();
  const theme = useTheme();

  // Component state - no longer received as props
  const [loginLogs, setLoginLogs] = useState([]);
  const [activityTypeFilter, setActivityTypeFilter] = useState('all');
  const [loginSearch, setLoginSearch] = useState('');
  const [loginUserFilter, setLoginUserFilter] = useState('all');
  const [loginFrom, setLoginFrom] = useState('');
  const [loginTo, setLoginTo] = useState('');
  const [activityAutoRefreshMs, setActivityAutoRefreshMs] = useState(0);
  const [activityNowTick, setActivityNowTick] = useState(Date.now());
  const [activityLastUpdatedAt, setActivityLastUpdatedAt] = useState(Date.now());
  const [users, setUsers] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ open: false });
  const [loading, setLoading] = useState(false);

  // Load data function
  const loadData = async () => {
    setLoading(true);
    try {
      const [loginLogsRes, usersRes, enrollmentsRes] = await Promise.all([
        getLoginLogs(),
        getUsers(),
        getEnrollments()
      ]);

      if (loginLogsRes?.success) {
        setLoginLogs(loginLogsRes.data);
      }
      if (usersRes?.success) {
        setUsers(usersRes.data);
      }
      if (enrollmentsRes?.success) {
        setEnrollments(enrollmentsRes.data);
      }
    } catch (error) {
      console.error('Error loading logs data:', error);
      toast?.showError('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Auto-refresh for Activity tab
  useEffect(() => {
    if (!activityAutoRefreshMs) return;
    const id = setInterval(() => {
      loadData();
      setActivityLastUpdatedAt(Date.now());
    }, activityAutoRefreshMs);
    return () => clearInterval(id);
  }, [activityAutoRefreshMs]);

  // Update activity tick for progress bar
  useEffect(() => {
    if (!activityAutoRefreshMs) return;
    const id = setInterval(() => setActivityNowTick(Date.now()), 250);
    return () => clearInterval(id);
  }, [activityAutoRefreshMs]);

  const filteredLoginLogs = () => {
    let filtered = loginLogs;
    
    // Filter by activity type
    if (activityTypeFilter && activityTypeFilter !== 'all') {
      filtered = filtered.filter(log => log.type === activityTypeFilter);
    }
    
    // Filter by search (email, name, user agent)
    if (loginSearch) {
      const searchLower = loginSearch.toLowerCase();
      filtered = filtered.filter(log => 
        (log.userEmail && log.userEmail.toLowerCase().includes(searchLower)) ||
        (log.userName && log.userName.toLowerCase().includes(searchLower)) ||
        (log.userAgent && log.userAgent.toLowerCase().includes(searchLower))
      );
    }
    
    // Filter by user
    if (loginUserFilter && loginUserFilter !== 'all') {
      filtered = filtered.filter(log => log.userEmail === loginUserFilter);
    }
    
    // Filter by date range
    if (loginFrom) {
      const fromDate = new Date(loginFrom.split('/').reverse().join('-'));
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(log => {
        const logDate = log.timestamp?.seconds ? 
          new Date(log.timestamp.seconds * 1000) : 
          new Date(log.timestamp);
        return logDate >= fromDate;
      });
    }
    
    if (loginTo) {
      const toDate = new Date(loginTo.split('/').reverse().join('-'));
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(log => {
        const logDate = log.timestamp?.seconds ? 
          new Date(log.timestamp.seconds * 1000) : 
          new Date(log.timestamp);
        return logDate <= toDate;
      });
    }
    
    // Sort by timestamp (newest first)
    filtered.sort((a, b) => {
      const aTime = a.timestamp?.seconds ? a.timestamp.seconds * 1000 : new Date(a.timestamp).getTime();
      const bTime = b.timestamp?.seconds ? b.timestamp.seconds * 1000 : new Date(b.timestamp).getTime();
      return bTime - aTime;
    });
    
    return filtered;
  };

  const getActivityLogOptions = (t) => [
    { value: 'all', label: t('all_activities') || 'All Activities' },
    { value: 'login', label: t('login') || 'Login' },
    { value: 'logout', label: t('logout') || 'Logout' },
    { value: 'session_start', label: t('session_start') || 'Session Start' },
    { value: 'session_end', label: t('session_end') || 'Session End' },
    { value: 'password_reset', label: t('password_reset') || 'Password Reset' },
    { value: 'profile_update', label: t('profile_update') || 'Profile Update' },
    { value: 'role_change', label: t('role_change') || 'Role Change' },
    { value: 'impersonation_start', label: t('impersonation_start') || 'Impersonation Start' },
    { value: 'impersonation_end', label: t('impersonation_end') || 'Impersonation End' },
    { value: 'security_alert', label: t('security_alert') || 'Security Alert' },
    { value: 'api_access', label: t('api_access') || 'API Access' },
    { value: 'penalty_viewed', label: t('penalty_viewed') || 'Penalty Viewed' }
  ];

  const getActivityLogTypeConfig = (type, theme) => {
    const configs = {
      login: { icon: getThemedIcon('ui', 'log_in', 16, theme), label: 'Login' },
      logout: { icon: getThemedIcon('ui', 'log_out', 16, theme), label: 'Logout' },
      session_start: { icon: getThemedIcon('ui', 'play', 16, theme), label: 'Session Start' },
      session_end: { icon: getThemedIcon('ui', 'stop', 16, theme), label: 'Session End' },
      password_reset: { icon: getThemedIcon('ui', 'key_round', 16, theme), label: 'Password Reset' },
      profile_update: { icon: getThemedIcon('ui', 'user', 16, theme), label: 'Profile Update' },
      role_change: { icon: getThemedIcon('ui', 'shield', 16, theme), label: 'Role Change' },
      impersonation_start: { icon: getThemedIcon('ui', 'eye', 16, theme), label: 'Impersonation Start' },
      impersonation_end: { icon: getThemedIcon('ui', 'eye_off', 16, theme), label: 'Impersonation End' },
      security_alert: { icon: getThemedIcon('ui', 'alert_triangle', 16, theme), label: 'Security Alert' },
      api_access: { icon: getThemedIcon('ui', 'api', 16, theme), label: 'API Access' },
      penalty_viewed: { icon: getThemedIcon('penalty_type', 'eye', 16, theme), label: 'Penalty Viewed' }
    };
    return configs[type] || configs.login;
  };

  return (
    <div className="login-activity-tab">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '0.5rem 0 1rem', flexWrap: 'wrap', padding: '1rem', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <Select value={activityTypeFilter} onChange={(e) => setActivityTypeFilter(e.target.value)} options={getActivityLogOptions(t)} style={{ minWidth: '200px', flex: '1' }} />
        <Input
          type="text"
          placeholder={t('search_by_email_name_ua')}
          value={loginSearch}
          onChange={(e) => setLoginSearch(e.target.value)}
          style={{ minWidth: '200px', flex: '1' }}
        />
        <UserSelect
          users={users}
          enrollments={enrollments}
          value={loginUserFilter}
          onChange={(e) => setLoginUserFilter(e.target.value)}
          placeholder={t('all_users') || 'All Users'}
          includeAll={true}
          showEnrollments={true}
          showStatus={true}
          searchable={true}
          size="small"
          style={{ minWidth: '200px', flex: '1' }}
        />
        <DateRangeSlider
          fromDate={loginFrom ? (() => {
            try {
              if (loginFrom.includes('/')) {
                const [dd, mm, yyyy] = loginFrom.split('/');
                return `${yyyy}-${mm}-${dd}`;
              }
              return loginFrom;
            } catch {
              return '';
            }
          })() : ''}
          toDate={loginTo ? (() => {
            try {
              if (loginTo.includes('/')) {
                const [dd, mm, yyyy] = loginTo.split('/');
                return `${yyyy}-${mm}-${dd}`;
              }
              return loginTo;
            } catch {
              return '';
            }
          })() : ''}
          onChange={({ fromDate, toDate }) => {
            if (fromDate) {
              const date = new Date(fromDate);
              setLoginFrom(`${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`);
            } else {
              setLoginFrom('');
            }
            if (toDate) {
              const date = new Date(toDate);
              setLoginTo(`${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`);
            } else {
              setLoginTo('');
            }
          }}
          placeholderFrom={t('from') || 'From'}
          placeholderTo={t('to') || 'To'}
          style={{ minWidth: '250px', flex: '1' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <Select
            value={activityAutoRefreshMs}
            onChange={(e) => setActivityAutoRefreshMs(Number(e.target.value))}
            options={[
              { value: 0, label: 'Off' },
              { value: 10000, label: '10 sec' },
              { value: 30000, label: '30 sec' },
              { value: 60000, label: '1 min' },
              { value: 300000, label: '5 min' }
            ]}
            size="small"
            style={{ minWidth: '150px' }}
          />
          {activityAutoRefreshMs > 0 && (
            <div style={{ width: 120, height: 6, background: '#e5e7eb', borderRadius: 999, overflow: 'hidden' }} title="Next auto refresh">
              <div style={{ height: '100%', width: `${Math.min(100, ((activityNowTick - activityLastUpdatedAt) % activityAutoRefreshMs) / activityAutoRefreshMs * 100)}%`, background: '#10b981', transition: 'width 0.25s linear' }} />
            </div>
          )}
          <Button 
            onClick={() => {
              loadData();
              setActivityLastUpdatedAt(Date.now());
            }} 
            variant="outline" 
            size="small" 
            title={t('refresh') || 'Refresh'}
            icon={getThemedIcon('ui', 'refresh', 16, theme)}
          >
            Refresh
          </Button>
          <Button 
            onClick={() => {
              const isAllTypes = activityTypeFilter === 'all';
              const filterOption = getActivityLogOptions(t).find(opt => opt.value === activityTypeFilter);
              const description = isAllTypes ? 'all login logs' : `${filterOption?.label || activityTypeFilter} logs`;
              setDeleteModal({
                open: true,
                type: 'login_logs',
                item: { description, filterType: activityTypeFilter },
                onConfirm: async () => {
                  setLoading(true);
                  try {
                    // Import dynamically to avoid circular dependencies
                    const { deleteAllLoginLogs, deleteLoginLogsByType, getLoginLogs } = await import('@firebaseServices/activityService');
                    
                    // Add progress tracking
                    const onProgress = (processed, total, percentage) => {
                      toast?.showInfo(`Deleting logs: ${processed}/${total} (${percentage}%)`);
                    };
                    let result;
                    if (activityTypeFilter === 'all') {
                      result = await deleteAllLoginLogs(onProgress);
                    } else {
                      result = await deleteLoginLogsByType(activityTypeFilter, onProgress);
                    }
                    if (result.success) {
                      toast?.showSuccess(`Successfully deleted ${result.deletedCount} ${description}`);
                      // Refresh the login logs data
                      const loginLogsRes = await getLoginLogs();
                      if (loginLogsRes.success) {
                        setLoginLogs(loginLogsRes.data);
                      }
                    } else {
                      toast?.showError('Failed to delete login logs: ' + result.error);
                    }
                  } catch (error) {
                    console.error('Error deleting login logs:', error);
                    toast?.showError('An error occurred while deleting login logs');
                  } finally {
                    setLoading(false);
                    setDeleteModal({ open: false });
                  }
                }
              });
            }} 
            variant="danger" 
            size="small" 
            title="Delete All Logs"
            icon={getThemedIcon('ui', 'trash', 16, theme)}
          >
            Delete All
          </Button>
        </div>
      </div>
      <AdvancedDataGrid
        rows={filteredLoginLogs().slice(0, 500)}
        getRowId={(row) => row.docId || row.id}
        columns={[
          {
            field: 'type', 
            headerName: t('type_col'), 
            width: 200,
            renderCell: (params) => {
              const type = params.value || 'login';
              const config = getActivityLogTypeConfig(type, theme);
              return (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                  {config.icon} {t(type) || config.label}
                </span>
              );
            }
          },
          {
            field: 'timestamp', 
            headerName: t('when'), 
            width: 180,
            valueGetter: (params) => params.value,
            renderCell: (params) => {
              const timestamp = params.value;
              const activityType = params.row?.type;
              if (!timestamp) return '—';
              // Handle both Firestore Timestamp and regular Date
              const date = timestamp?.seconds ? 
                new Date(timestamp.seconds * 1000) : 
                new Date(timestamp);
              // For penalty viewing activities, use Qatar timezone and log details
              if (activityType === 'penalty_viewed') {
                const qatarTimeAgo = getQatarTimeAgo(date);
                console.log('🔍 PENALTY VIEWING DISPLAY - Rendering timestamp:', {
                  rawTimestamp: timestamp,
                  convertedDate: date,
                  convertedDateUTC: date.toISOString(),
                  qatarTimeAgo,
                  activityType,
                  clientTime: new Date().toISOString(),
                  clientTimeQatar: new Date().toLocaleString('en-US', { timeZone: 'Asia/Qatar' })
                });
                return qatarTimeAgo || formatQatarDate(date);
              }
              // Use Qatar timezone for other activities too
              return getQatarTimeAgo(date) || formatQatarDate(date);
            }
          },
          {
            field: 'userName', 
            headerName: t('user_col'), 
            flex: 1, 
            minWidth: 150,
            renderCell: (params) => params.value || '—'
          },
          {
            field: 'userEmail', 
            headerName: t('email_col'), 
            flex: 1, 
            minWidth: 200,
            renderCell: (params) => params.value || '—'
          },
          {
            field: 'userAgent', 
            headerName: t('user_agent_col'), 
            flex: 2, 
            minWidth: 300,
            renderCell: (params) => (
              <div style={{ maxWidth: 520, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {params.value || '—'}
              </div>
            )
          },
          {
            field: 'details',
            headerName: t('description_col'),
            flex: 1,
            minWidth: 200,
            renderCell: (params) => {
              const details = params.value || {};
              if (Object.keys(details).length === 0) return '—';
              // Show relevant details based on activity type
              const type = params.row.type;
              let detailText = '';
              if (type === 'login' && details.ip) {
                detailText = `IP: ${details.ip}`;
              } else if (type === 'logout' && details.sessionDuration) {
                detailText = `Session: ${details.sessionDuration}`;
              } else if (details.action) {
                detailText = details.action;
              } else if (details.message) {
                detailText = details.message;
              }
              return detailText || JSON.stringify(details);
            }
          }
        ]}
        pageSize={20}
        pageSizeOptions={[10, 20, 50, 100]}
        checkboxSelection
        exportFileName="login-activity"
        showExportButton
        exportLabel={t('export') || 'Export'}
        loadingOverlayMessage={loading ? "Loading login activity..." : undefined}
        fancyVariant="dots"
      />
      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <Modal
          isOpen={deleteModal.open}
          onClose={() => setDeleteModal({ open: false })}
          title={deleteModal.type === 'login_logs' ? 'Delete Activity Logs' : 'Confirm Deletion'}
          size="small"
        >
          <div style={{ padding: '1rem' }}>
            <p style={{ marginBottom: '1rem', color: '#666' }}>
              {deleteModal.type === 'login_logs' ?
                `Are you sure you want to delete ${deleteModal.item?.description}? This action cannot be undone.` :
                'Are you sure you want to delete this item?'
              }
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <Button
                variant="outline"
                onClick={() => setDeleteModal({ open: false })}
              >
                {t('cancel') || 'Cancel'}
              </Button>
              <Button
                variant="danger"
                loading={loading}
                onClick={deleteModal.onConfirm}
              >
                {t('delete') || 'Delete'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default LogsActivityPage;
