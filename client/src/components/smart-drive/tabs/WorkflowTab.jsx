import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLang } from '@contexts/LangContext';
import { useNavigate } from 'react-router-dom';
import { getIcon, getIconWithColor, getThemedIcon } from '@constants/iconTypes';
import { WORKFLOW_STATUS } from '@constants/workflowStatusTypes';
import { apiService } from '@services/api/apiService';
import workflowService from '@services/business/workflowService';
import { updateWorkflowDocumentStatus, withdrawWorkflowDocument } from '@services/api/workflow-documents-api';
import { WORKFLOW_STATUS_CONFIG } from '@constants/driveConstants';
import { getWorkflowDisplayLabel, CATEGORY_BY_VALUE } from '@constants/workflowConfig';
import { ROLE_STRINGS } from '@utils/userUtils';
import { getLocalizedUserName } from '@utils/localizedUserName';
import Modal from '@ui/Modal/Modal';
import Select from '@ui/Select/Select';
import Tabs from '@ui/Tabs/Tabs';
import { getAllUsers } from '@services/business/userService';
import { handleFilePreview } from '@utils/fileUtils';
import { formatQatarDate, formatQatarDateOnly } from '@utils/timezone';

const formatRelativeTime = (date, lang, t) => {
  if (!date) return '\u2014';
  const now = new Date();
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '\u2014';
  
  const seconds = Math.floor((now - d) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) return t('common.justNow', 'just now');
  if (minutes < 60) return t('common.minutesAgo', { count: minutes }) || `${minutes}m ago`;
  if (hours < 24) return t('common.hoursAgo', { count: hours }) || `${hours}h ago`;
  if (days < 7) return t('common.daysAgo', { count: days }) || `${days}d ago`;
  return formatQatarDateOnly(date);
};

const formatDateHeader = (dateStr, t) => {
  return formatQatarDateOnly(dateStr);
};

const formatSize = (bytes) => {
  if (!bytes && bytes !== 0) return '\u2014';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
};

// Workflow action constants
const WORKFLOW_ACTIONS = {
  SUBMIT: 'submit',
  SEND_FOR_REVIEW: 'send_for_review',
  SEND_FOR_APPROVAL: 'send_for_approval',
  APPROVE: 'approve',
  REJECT: 'reject',
  REVISE: 'revise',
  CANCEL: 'cancel'
};

// Action icon mapping
const ACTION_ICONS = {
  [WORKFLOW_ACTIONS.SUBMIT]: 'send',
  [WORKFLOW_ACTIONS.APPROVE]: 'check_circle',
  [WORKFLOW_ACTIONS.REJECT]: 'x_circle',
  [WORKFLOW_ACTIONS.CANCEL]: 'alert_circle',
  [WORKFLOW_ACTIONS.REVISE]: 'edit'
};

// Action color mapping
const ACTION_COLORS = {
  [WORKFLOW_ACTIONS.SUBMIT]: '#3b82f6', // Blue
  [WORKFLOW_ACTIONS.APPROVE]: '#8b5cf6', // Purple
  [WORKFLOW_ACTIONS.REJECT]: '#dc2626', // Red
  [WORKFLOW_ACTIONS.CANCEL]: '#dc2626', // Red
  [WORKFLOW_ACTIONS.REVISE]: '#8b5cf6', // Purple
  [WORKFLOW_ACTIONS.SEND_FOR_REVIEW]: '#6b7280', // Gray
  [WORKFLOW_ACTIONS.SEND_FOR_APPROVAL]: '#8b5cf6' // Purple
};

// Assignee type constants
const ASSIGNEE_TYPES = {
  USER: 'user',
  ROLE: 'role'
};

const getActionColor = (action) => ACTION_COLORS[action] || '#8b5cf6';
const getActionIcon = (action) => ACTION_ICONS[action] || 'edit';

function getStepBadgeStyle(status) {
  const config = WORKFLOW_STATUS_CONFIG[status?.toLowerCase()];
  if (!config) {
    return {
      color: 'var(--text-muted, #6b7280)',
      bg: 'var(--background-secondary, #f3f4f6)',
    };
  }
  return {
    color: config.color,
    bg: config.bg,
  };
}

const WORKFLOW_TYPE_STYLES = {
  ATTENDANCE: { color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.1)' },
  PENALTY: { color: '#dc2626', bg: 'rgba(254, 226, 226, 0.8)' },
  BEHAVIOR: { color: '#d97706', bg: 'rgba(254, 243, 199, 0.8)' },
  DISCONTINUATION: { color: '#7c3aed', bg: 'rgba(237, 233, 254, 0.8)' },
  GENERAL: { color: '#0891b2', bg: 'rgba(8, 145, 178, 0.1)' },
  ATTENDANCE_DAILY: { color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.1)' },
  ATTENDANCE_WEEKLY: { color: '#db2777', bg: 'rgba(219, 39, 119, 0.1)' },
};

function getWorkflowTypeStyle(workflow) {
  const category = workflow?.workflowCategory;
  if (category && WORKFLOW_TYPE_STYLES[category]) {
    return WORKFLOW_TYPE_STYLES[category];
  }
  return WORKFLOW_TYPE_STYLES[workflow?.workflowType] || WORKFLOW_TYPE_STYLES.GENERAL;
}

export default function WorkflowTab({ fileId, onRefresh, isActive = true, isOwnedByUser = true }) {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef(null);
  const [viewMode, setViewMode] = useState('list');
  const [selectedDate, setSelectedDate] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, workflowId: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [rejectModal, setRejectModal] = useState({ isOpen: false, workflowId: null, reason: '' });
  const [actionModal, setActionModal] = useState({ isOpen: false, workflowId: null, action: null, comment: '', assignedUserId: null, assignedRole: null, assigneeType: ASSIGNEE_TYPES.USER });
  const [users, setUsers] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const commentRef = useRef('');

  const fetchUsers = useCallback(async (searchQuery = '') => {
    console.log('[WorkflowTab] fetchUsers called with searchQuery:', searchQuery);
    setSearchingUsers(true);
    try {
      const result = await getAllUsers({ search: searchQuery, limit: 50 });
      console.log('[WorkflowTab] fetchUsers result:', result);
      if (result.success) {
        const userList = result.data?.users || result.data || [];
        console.log('[WorkflowTab] Setting users:', userList.length, 'users');
        setUsers(userList);
      }
    } catch (error) {
      console.error('[WorkflowTab] Failed to fetch users:', error);
    } finally {
      setSearchingUsers(false);
    }
  }, []);

  useEffect(() => {
    if (actionModal.isOpen && (actionModal.action === 'send_for_review' || actionModal.action === 'send_for_approval' || actionModal.action === 'submit')) {
      fetchUsers();
    }
  }, [actionModal.isOpen, actionModal.action, fetchUsers]);

  const fetchWorkflow = useCallback(async () => {
    if (!fileId) return;
    setLoading(true);
    setError(null);
    try {
      const cacheBuster = Math.random().toString(36).substring(7);
      const response = await apiService.get('/workflow-documents', {
        params: { fileId: fileId, _nocache: cacheBuster },
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      console.log('[WorkflowTab] fetchWorkflow response:', response);
      if (response.success) {
        const workflows = response.data || response.payload || [];
        console.log('[WorkflowTab] workflows after fetch:', workflows);
        setWorkflows(workflows);
      } else {
        setError(response.error?.message || 'Failed to fetch workflow');
      }
    } catch (err) {
      console.error('[WorkflowTab] fetch failed:', err);
      setError(err.message || 'Failed to fetch workflow');
    } finally {
      setLoading(false);
    }
  }, [fileId]);

  useEffect(() => {
    fetchWorkflow();
  }, [fetchWorkflow]);

  // Refresh when tab becomes active (e.g., after navigating back from workflow detail page)
  useEffect(() => {
    if (isActive) {
      fetchWorkflow();
    }
  }, [isActive, fetchWorkflow]);

  // Close sort menu when clicking outside
  useEffect(() => {
    if (!showSortMenu) return;
    const handleClickOutside = (e) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target)) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSortMenu]);

  const getStatusIcon = (status) => {
    const config = WORKFLOW_STATUS_CONFIG[status?.toLowerCase()];
    return config?.icon || 'workflow';
  };

  const getStatusDescription = (status) => {
    return t(`workflow.status.${status?.toLowerCase()}`, status);
  };

  const statusCounts = useMemo(() => {
    return workflows.reduce((acc, workflow) => {
      const status = workflow.status || 'UNKNOWN';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
  }, [workflows]);

  const handleViewSnapshot = async (file, fileVersionId = null) => {
    console.log('🔍 [WorkflowTab] handleViewSnapshot called', { file, fileId: file.id, fileName: file.name, mimeType: file.mimeType, fileVersionId });
    await handleFilePreview(file, fileVersionId);
  };

  const handleViewWorkflowDetails = useCallback((workflowId) => {
    window.open(`/workflow-documents/${workflowId}`, '_blank');
  }, []);

  const handleDeleteWorkflow = useCallback(async () => {
    if (!deleteModal.workflowId || isDeleting) return;
    setIsDeleting(true);
    try {
      const result = await workflowService.deleteWorkflowDocument(deleteModal.workflowId);
      if (result.success) {
        // Remove from local state immediately - don't refetch since backend returns stale data
        setWorkflows(prev => prev.filter(w => w.id !== deleteModal.workflowId));
        setDeleteModal({ isOpen: false, workflowId: null });
        // Refresh parent grid
        if (onRefresh) onRefresh();
      } else {
        // If document is already deleted (404), treat as success
        if (result.error?.includes('not found') || result.status === 404) {
          setWorkflows(prev => prev.filter(w => w.id !== deleteModal.workflowId));
          setDeleteModal({ isOpen: false, workflowId: null });
          // Refresh parent grid
          if (onRefresh) onRefresh();
        } else {
          console.error('Failed to delete workflow:', result.error);
        }
      }
    } catch (error) {
      console.error('Error deleting workflow:', error);
      // If error is 404 (already deleted), treat as success
      if (error.response?.status === 404 || error.message?.includes('not found')) {
        setWorkflows(prev => prev.filter(w => w.id !== deleteModal.workflowId));
        setDeleteModal({ isOpen: false, workflowId: null });
        // Refresh parent grid
        if (onRefresh) onRefresh();
      }
    } finally {
      setIsDeleting(false);
    }
  }, [deleteModal.workflowId, isDeleting, onRefresh]);

  const handleRejectWorkflow = useCallback(async () => {
    if (!rejectModal.workflowId || !rejectModal.reason.trim()) return;
    try {
      const result = await workflowService.rejectWorkflowDocument(rejectModal.workflowId, { comment: rejectModal.reason.trim() });
      if (result.success) {
        // Update local state immediately to reflect status change
        setWorkflows(prev => prev.map(w => 
          w.id === rejectModal.workflowId 
            ? { ...w, status: 'REJECTED' }
            : w
        ));
        setRejectModal({ isOpen: false, workflowId: null, reason: '' });
        // Don't call fetchWorkflow - backend returns stale data, local state update is sufficient
      } else {
        console.error('Failed to reject workflow:', result.error);
      }
    } catch (error) {
      console.error('Error rejecting workflow:', error);
    }
  }, [rejectModal.workflowId, rejectModal.reason]);

  const handleWorkflowAction = useCallback(async () => {
    if (!actionModal.workflowId || !actionModal.action) return;
    
    try {
      let result;
      const { workflowId, action, assignedUserId, assignedRole } = actionModal;
      const comment = commentRef.current || actionModal.comment;
      
      switch (action) {
        case WORKFLOW_ACTIONS.SUBMIT:
          result = await updateWorkflowDocumentStatus(workflowId, { status: 'SUBMITTED', reason: comment });
          break;
        case WORKFLOW_ACTIONS.SEND_FOR_APPROVAL:
          result = await workflowService.sendWorkflowDocument(workflowId, { assignedUserId, assignedRole, comment });
          break;
        case WORKFLOW_ACTIONS.APPROVE:
          result = await workflowService.approveWorkflowDocument(workflowId, { comment });
          break;
        case WORKFLOW_ACTIONS.REJECT:
          result = await workflowService.rejectWorkflowDocument(workflowId, { comment, reason: comment });
          break;
        case WORKFLOW_ACTIONS.REVISE:
          result = await workflowService.returnWorkflowDocument(workflowId, { comment });
          break;
        case WORKFLOW_ACTIONS.CANCEL:
          result = await withdrawWorkflowDocument(workflowId, { comment });
          console.log('[WorkflowTab] Cancel result:', result);
          break;
        default:
          console.error('Unknown action:', action);
          return;
      }
      
      if (result.success) {
        // Update local state immediately to reflect status change
        let newStatus;
        switch (action) {
          case WORKFLOW_ACTIONS.SUBMIT:
            newStatus = 'SUBMITTED';
            break;
          case WORKFLOW_ACTIONS.APPROVE:
            newStatus = 'APPROVED';
            break;
          case WORKFLOW_ACTIONS.REJECT:
            newStatus = 'REJECTED';
            break;
          case WORKFLOW_ACTIONS.CANCEL:
            newStatus = 'DRAFT';
            break;
          case WORKFLOW_ACTIONS.REVISE:
            newStatus = 'NEEDS_REVISION';
            break;
          default:
            newStatus = null;
        }
        
        console.log('[WorkflowTab] Updating workflow status:', workflowId, 'to', newStatus);
        
        if (newStatus) {
          setWorkflows(prev => {
            const updated = prev.map(w => 
              w.id === workflowId 
                ? { ...w, status: newStatus }
                : w
            );
            console.log('[WorkflowTab] Updated workflows:', updated);
            return updated;
          });
        }
        
        setActionModal({ isOpen: false, workflowId: null, action: null, comment: '', assignedUserId: null, assignedRole: null, assigneeType: ASSIGNEE_TYPES.USER });
        commentRef.current = '';
        // Refresh parent grid after workflow action
        if (onRefresh) onRefresh();
        // Don't call fetchWorkflow - backend returns stale data, local state update is sufficient
      } else {
        console.error('Failed to perform workflow action:', result.error);
      }
    } catch (error) {
      console.error('Error performing workflow action:', error);
    }
  }, [actionModal, fetchWorkflow, onRefresh]);

  const getAvailableActions = (status, currentUser, workflow) => {
    const normalizedStatus = status?.toUpperCase();
    const isInitiator = workflow?.initiatedById === currentUser?.id;
    const isAssigned = workflow?.assignedUserId === currentUser?.id;
    const hasAssignedRole = workflow?.assignedRole && currentUser?.roles?.includes(workflow.assignedRole);
    const isAdmin = currentUser?.roles?.includes('super_admin') || currentUser?.roles?.includes('admin');
    
    // If file is not owned by user (shared with them), don't allow cancel
    const allowCancel = isOwnedByUser;
    
    switch (normalizedStatus) {
      case WORKFLOW_STATUS.DRAFT:
        return allowCancel ? ['submit', 'cancel'] : ['submit'];
      case WORKFLOW_STATUS.SUBMITTED:
        return allowCancel ? ['cancel'] : [];
      case 'IN_REVIEW':
        if (isAssigned || hasAssignedRole || isAdmin) {
          return ['approve', 'reject', 'send_for_approval'];
        }
        return allowCancel ? ['cancel'] : [];
      case WORKFLOW_STATUS.REJECTED:
        // REJECTED is a final state - no actions available
        return [];
      case WORKFLOW_STATUS.APPROVED:
      case 'CANCELLED':
        return [];
      default:
        return [];
    }
  };

  const filteredAndSortedWorkflows = useMemo(() => {
    let filtered = workflows;
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(w => 
        w.title?.toLowerCase().includes(query) ||
        w.workflowType?.toLowerCase().includes(query) ||
        w.workflowCategory?.toLowerCase().includes(query) ||
        w.attendanceSubtype?.toLowerCase().includes(query) ||
        w.status?.toLowerCase().includes(query) ||
        w.submitter?.displayName?.toLowerCase().includes(query) ||
        w.submitter?.email?.toLowerCase().includes(query)
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter((w) => w.workflowCategory === categoryFilter);
    }
    
    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'date-asc':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'type':
          return a.workflowType.localeCompare(b.workflowType);
        default:
          return 0;
      }
    });

    // Filter by selected date
    if (selectedDate) {
      return sorted.filter(w => {
        const workflowDate = new Date(w.createdAt).toDateString();
        return workflowDate === selectedDate;
      });
    }

    return sorted;
  }, [workflows, searchQuery, sortBy, selectedDate, categoryFilter]);

  // Group workflows by date for timeline
  const groupedWorkflows = useMemo(() => {
    return workflows.reduce((acc, workflow) => {
      const date = new Date(workflow.createdAt).toDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(workflow);
      return acc;
    }, {});
  }, [workflows]);

  const sortedDates = Object.keys(groupedWorkflows).sort((a, b) => new Date(b) - new Date(a));

  const formatDate = (date) => {
    if (!date) return '\u2014';
    return formatQatarDate(date, 'dd/MM/yyyy HH:mm');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '12rem', fontSize: '0.875rem', color: 'var(--text-muted, #6b7280)' }} role="status">
        {t('common.loading')}&hellip;
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '12rem', fontSize: '0.875rem', color: '#dc2626' }} role="alert">
        {error}
      </div>
    );
  }

  if (workflows.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '12rem', fontSize: '0.875rem', color: 'var(--text-muted, #6b7280)' }}>
        {getIcon('ui', 'workflow', 40, '#8b5cf6')}
        {t('drive.noWorkflow')}
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '1.5rem',
      maxWidth: '1400px',
      margin: '0 auto',
      width: '100%',
      padding: '0 1rem'
    }}>
      {/* Search and sort controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '1rem',
        background: 'var(--panel, white)',
        borderRadius: '0.75rem',
        border: '1px solid var(--border, #e5e7eb)'
      }}>
        <input
          type="text"
          placeholder={t('drive.searchWorkflows', 'Search workflows...')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            maxWidth: '300px',
            padding: '0.625rem 0.875rem',
            borderRadius: '0.5rem',
            border: '1px solid var(--border, #e5e7eb)',
            background: 'var(--panel, white)',
            color: 'var(--text, #111827)',
            fontSize: '0.875rem',
            outline: 'none',
          }}
          aria-label={t('drive.searchWorkflows', 'Search workflows...')}
        />
        <div style={{ width: '220px', flexShrink: 0 }}>
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={[
              { value: '', label: t('workflow.filters.allCategories', 'All categories') },
              ...Object.values(CATEGORY_BY_VALUE).map((cat) => ({
                value: cat.value,
                label: t(cat.labelKey, cat.value),
              })),
            ]}
            placeholder={t('workflow.filters.allCategories', 'All categories')}
            data-testid="workflow-category-filter"
          />
        </div>
        <button
          onClick={() => fetchWorkflow()}
          disabled={loading}
          style={{
            padding: '0.625rem 0.875rem',
            borderRadius: '0.5rem',
            border: '1px solid var(--border, #e5e7eb)',
            background: 'var(--panel, white)',
            color: 'var(--text, #374151)',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            opacity: loading ? 0.6 : 1,
            flexShrink: 0,
          }}
        >
          {getIcon('ui', 'refresh', 16, 'var(--text, #374151)')}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: 'auto' }}>
          <span style={{ 
            fontSize: '0.875rem', 
            color: 'var(--text-muted, #6b7280)',
            fontWeight: 500
          }}>
            {filteredAndSortedWorkflows.length} {filteredAndSortedWorkflows.length === 1 ? t('drive.workflow') : t('drive.workflows')}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.5rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border, #e5e7eb)',
                background: viewMode === 'grid' ? 'var(--color-primary-tint, #eff6ff)' : 'var(--panel, white)',
                cursor: 'pointer',
                color: viewMode === 'grid' ? 'var(--color-primary, #3b82f6)' : 'var(--text, #374151)',
              }}
            >
              {viewMode === 'grid' ? getIcon('ui', 'list', 16) : getIcon('ui', 'grid', 16)}
            </button>
            <div ref={sortMenuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.875rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border, #e5e7eb)',
                  background: 'var(--panel, white)',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  color: 'var(--text, #374151)',
                  fontWeight: 500,
                }}
              >
                {getIcon('ui', 'filter', 16)}
                <span>{t('drive.sort', 'Sort')}</span>
                {getIcon('ui', 'chevron_down', 16)}
              </button>
          {showSortMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              insetInlineEnd: 0,
              marginTop: '0.25rem',
              background: 'var(--panel, white)',
              border: '1px solid var(--border, #e5e7eb)',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              zIndex: 10,
              minWidth: '150px',
            }}>
              {[
                { value: 'date-desc', label: t('drive.sortNewest', 'Newest first') },
                { value: 'date-asc', label: t('drive.sortOldest', 'Oldest first') },
                { value: 'status', label: t('drive.sortStatus', 'Status') },
                { value: 'type', label: t('drive.sortType', 'Type') },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => {
                    setSortBy(option.value);
                    setShowSortMenu(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    textAlign: 'start',
                    background: sortBy === option.value ? 'var(--background-secondary, #f3f4f6)' : 'transparent',
                    border: 'none',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    color: 'var(--text, #374151)',
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
            </div>
          </div>
        </div>
      </div>

      {/* Status summary */}
      <div style={{ 
        display: 'flex', 
        gap: '0.75rem', 
        flexWrap: 'wrap', 
        alignItems: 'center',
        padding: '0.75rem 1rem',
        background: 'var(--background-secondary, #f9fafb)',
        borderRadius: '0.5rem',
        border: '1px solid var(--border, #e5e7eb)'
      }}>
        {Object.entries(statusCounts).map(([status, count]) => {
          const statusIcon = getStatusIcon(status);
          const config = WORKFLOW_STATUS_CONFIG[status?.toLowerCase()];
          const statusStyle = config ? { color: config.color, bg: config.bg } : { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)' };
          return (
            <div
              key={status}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.5rem',
                background: statusStyle.bg,
                border: `1px solid ${statusStyle.borderColor}`,
                fontSize: '0.875rem',
                color: statusStyle.color,
                cursor: 'default',
                transition: 'all 0.15s ease',
              }}
              title={getStatusDescription(status)}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <span style={{ color: statusStyle.color, display: 'flex', alignItems: 'center' }}>
                {getIcon('ui', statusIcon, 16, statusIcon === 'workflow' ? '#8b5cf6' : statusStyle.color)}
              </span>
              <span style={{ fontWeight: 500 }}>{t(`workflow.status.${status.toLowerCase()}`, status)}</span>
              <span style={{ 
                fontWeight: 600, 
                opacity: 0.9,
                background: 'rgba(255,255,255,0.3)',
                padding: '0.125rem 0.375rem',
                borderRadius: '0.25rem'
              }}>{count}</span>
            </div>
          );
        })}
      </div>

      {/* Workflow cards */}
      {viewMode === 'list' ? (
        <div style={{ display: 'flex', gap: '1.5rem', height: '100%' }}>
          {/* Left sidebar - Date timeline */}
          <div style={{
            width: '220px',
            flexShrink: 0,
            borderRight: '1px solid var(--border, #e5e7eb)',
            paddingInlineEnd: '1.5rem',
            overflowY: 'auto',
            maxHeight: '600px'
          }}>
            <h4 style={{ 
              fontSize: '0.875rem', 
              fontWeight: 600, 
              color: 'var(--text-muted, #6b7280)', 
              marginBottom: '1rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {getIcon('ui', 'clock', 16)}
              {t('drive.timeline') || 'Timeline'}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <button
                onClick={() => setSelectedDate(null)}
                style={{
                  padding: '0.625rem 0.875rem',
                  textAlign: 'start',
                  background: !selectedDate ? 'var(--color-primary-tint, #eff6ff)' : 'transparent',
                  border: !selectedDate ? '1px solid var(--color-primary, #3b82f6)' : '1px solid transparent',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  color: !selectedDate ? 'var(--color-primary, #3b82f6)' : 'var(--text, #374151)',
                  cursor: 'pointer',
                  fontWeight: !selectedDate ? 600 : 400,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => !selectedDate && (e.currentTarget.style.background = 'var(--background-secondary, #f9fafb)')}
                onMouseLeave={(e) => !selectedDate && (e.currentTarget.style.background = 'transparent')}
              >
                {t('drive.allActivities') || 'All Workflows'} ({workflows.length})
              </button>
              {sortedDates.map((date) => (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  style={{
                    padding: '0.625rem 0.875rem',
                    textAlign: 'start',
                    background: selectedDate === date ? 'var(--color-primary-tint, #eff6ff)' : 'transparent',
                    border: selectedDate === date ? '1px solid var(--color-primary, #3b82f6)' : '1px solid transparent',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    color: selectedDate === date ? 'var(--color-primary, #3b82f6)' : 'var(--text, #374151)',
                    cursor: 'pointer',
                    fontWeight: selectedDate === date ? 600 : 400,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => selectedDate !== date && (e.currentTarget.style.background = 'var(--background-secondary, #f9fafb)')}
                  onMouseLeave={(e) => selectedDate !== date && (e.currentTarget.style.background = 'transparent')}
                >
                  {formatDateHeader(date, t)} ({groupedWorkflows[date].length})
                </button>
              ))}
            </div>
          </div>

          {/* Right content - Compact list */}
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '600px' }}>
            {filteredAndSortedWorkflows.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '12rem', fontSize: '0.875rem', color: 'var(--text-muted, #6b7280)' }}>
                {getIcon('ui', 'workflow', 40, '#8b5cf6')}
                {t('drive.noWorkflowsFound')}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filteredAndSortedWorkflows.map((workflow) => {
                  const statusIcon = getStatusIcon(workflow.status);
                  const config = WORKFLOW_STATUS_CONFIG[workflow.status?.toLowerCase()];
                  const statusStyle = config ? { color: config.color, bg: config.bg } : { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)' };
                  const typeStyle = getWorkflowTypeStyle(workflow);

                  return (
                    <div
                      key={workflow.id}
                      style={{
                        padding: '0.875rem 1rem',
                        borderRadius: '0.75rem',
                        border: '1px solid var(--border, #e5e7eb)',
                        background: 'var(--panel, white)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        transition: 'all 0.15s ease',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--color-primary, #3b82f6)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border, #e5e7eb)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {/* Status icon */}
                      <div style={{
                        flexShrink: 0,
                        width: '2.25rem',
                        height: '2.25rem',
                        borderRadius: '9999px',
                        background: statusStyle.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `1px solid ${statusStyle.borderColor}`,
                      }}>
                        {getIconWithColor('ui', statusIcon, 18, statusStyle.color)}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                          <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text, #111827)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {workflow.title || t('drive.workflow')}
                          </span>
                          <span
                            style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '9999px',
                              fontSize: '0.6875rem',
                              fontWeight: 600,
                              background: typeStyle.bg,
                              color: typeStyle.color,
                              textTransform: 'uppercase',
                              whiteSpace: 'nowrap',
                              letterSpacing: '0.025em',
                            }}
                          >
                            {getWorkflowDisplayLabel(workflow, t)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8125rem', color: 'var(--text-muted, #6b7280)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            {getIcon('ui', 'user', 14, 'var(--text-muted, #6b7280)')}
                            {getLocalizedUserName(workflow.submitter, lang, '\u2014')}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            {getIcon('ui', 'calendar', 14, 'var(--text-muted, #6b7280)')}
                            {formatRelativeTime(workflow.createdAt, lang, t)}
                          </span>
                          {workflow.fileVersionNumber && (
                            <span style={{
                              padding: '0.125rem 0.5rem',
                              borderRadius: '0.375rem',
                              fontSize: '0.75rem',
                              background: 'var(--background-secondary, #f3f4f6)',
                              color: 'var(--text-muted, #6b7280)',
                              fontWeight: 500,
                            }}>
                              v{workflow.fileVersionNumber}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                        {workflow.file && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewSnapshot(workflow.file, workflow.fileVersionId);
                            }}
                            style={{
                              color: 'var(--color-primary, #3b82f6)',
                              textDecoration: 'none',
                              whiteSpace: 'nowrap',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '0.375rem',
                              borderRadius: '0.375rem',
                              transition: 'background 0.15s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-primary-tint, #eff6ff)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            {getIcon('ui', 'external_link', 16, 'var(--color-primary, #3b82f6)')}
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewWorkflowDetails(workflow.id);
                          }}
                          style={{
                            color: '#8b5cf6',
                            textDecoration: 'none',
                            whiteSpace: 'nowrap',
                            background: 'none',
                            border: '1px solid var(--border, #e5e7eb)',
                            cursor: 'pointer',
                            padding: '0.375rem',
                            borderRadius: '0.375rem',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#8b5cf6';
                            e.currentTarget.style.color = '#8b5cf6';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border, #e5e7eb)';
                            e.currentTarget.style.color = '#8b5cf6';
                          }}
                        >
                          {getIcon('ui', 'workflow', 16, '#8b5cf6')}
                        </button>
                        
                        {/* Dynamic Action Buttons */}
                        {getAvailableActions(workflow.status, { id: 1, roles: ['instructor'] }, workflow).map((action) => (
                          <button
                            key={action}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionModal({ 
                                isOpen: true, 
                                workflowId: workflow.id, 
                                action, 
                                comment: '', 
                                assignedUserId: null, 
                                assignedRole: null 
                              });
                            }}
                            style={{
                              color: getActionColor(action),
                              textDecoration: 'none',
                              whiteSpace: 'nowrap',
                              background: 'none',
                              border: '1px solid var(--border, #e5e7eb)',
                              cursor: 'pointer',
                              padding: '0.375rem',
                              borderRadius: '0.375rem',
                              transition: 'all 0.15s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = getActionColor(action);
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = 'var(--border, #e5e7eb)';
                            }}
                          >
                            {getIcon('ui', getActionIcon(action), 16, getActionColor(action))}
                          </button>
                        ))}
                        {isOwnedByUser && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteModal({ isOpen: true, workflowId: workflow.id });
                            }}
                            style={{
                              color: '#dc2626',
                              textDecoration: 'none',
                              whiteSpace: 'nowrap',
                              background: 'none',
                              border: '1px solid var(--border, #e5e7eb)',
                              cursor: 'pointer',
                              padding: '0.375rem',
                              borderRadius: '0.375rem',
                              transition: 'all 0.15s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#dc2626';
                            e.currentTarget.style.background = 'rgba(220, 38, 38, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border, #e5e7eb)';
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          {getIcon('ui', 'trash', 16, '#dc2626')}
                        </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
          gap: '1.25rem',
        }}>
          {filteredAndSortedWorkflows.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '12rem', fontSize: '0.875rem', color: 'var(--text-muted, #6b7280)', gridColumn: '1 / -1' }}>
              {getIcon('ui', 'workflow', 40, '#8b5cf6')}
              {t('drive.noWorkflowsFound', 'No workflows found')}
            </div>
          ) : filteredAndSortedWorkflows.map((workflow) => {
            const statusIcon = getStatusIcon(workflow.status);
            const StatusIcon = statusIcon;
            const config = WORKFLOW_STATUS_CONFIG[workflow.status?.toLowerCase()];
            const statusStyle = config ? { color: config.color, bg: config.bg } : { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)' };
            const typeStyle = getWorkflowTypeStyle(workflow);

            return (
              <div
                key={workflow.id}
                style={{
                  padding: '1.25rem',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border, #e5e7eb)',
                  background: 'var(--panel, white)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary, #3b82f6)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border, #e5e7eb)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Top row: Title + Status badge */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ margin: 0, fontWeight: 600, fontSize: '1.0625rem', color: 'var(--text, #111827)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {workflow.title || t('drive.workflow')}
                    </h4>
                  </div>
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      padding: '0.375rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      background: statusStyle.bg,
                      color: statusStyle.color,
                      border: `1px solid ${statusStyle.borderColor}`,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {getIcon('ui', statusIcon, 16)}
                    {t(`workflow.status.${workflow.status.toLowerCase()}`) || workflow.status}
                  </span>
                </div>

                {/* Second row: Type pill + Reviewer role */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      padding: '0.375rem 0.625rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      background: typeStyle.bg,
                      color: typeStyle.color,
                      textTransform: 'uppercase',
                      letterSpacing: '0.025em',
                    }}
                  >
                    {getWorkflowDisplayLabel(workflow, t)}
                  </span>
                  {workflow.currentAssignee && (
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #6b7280)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      {getIcon('ui', 'user', 14)}
                      {t('drive.assignedTo')}: {workflow.currentAssignee.displayName || workflow.currentAssignee.email}
                    </span>
                  )}
                </div>

                {/* Third row: Initiator + Timestamp + Version */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-muted, #6b7280)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    {getIcon('ui', 'user', 14)}
                    {workflow.submitter?.displayName || workflow.submitter?.email || '\u2014'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    {getIcon('ui', 'calendar', 14)}
                    {formatRelativeTime(workflow.createdAt, lang, t)}
                  </span>
                  {workflow.fileVersionNumber && (
                    <span style={{
                      padding: '0.125rem 0.5rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      background: 'var(--background-secondary, #f3f4f6)',
                      color: 'var(--text-muted, #6b7280)',
                      fontWeight: 500,
                    }}>
                      v{workflow.fileVersionNumber}
                    </span>
                  )}
                  {workflow.fileVersionAlias && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontStyle: 'italic' }}>
                      {getIcon('ui', 'git_branch', 14)}
                      {workflow.fileVersionAlias}
                    </span>
                  )}
                </div>

                {/* File attachment section */}
                {workflow.file && (
                  <div style={{
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    background: 'var(--background-secondary, #f9fafb)',
                    border: '1px solid var(--border, #e5e7eb)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flex: 1, minWidth: 0 }}>
                        {getIcon('ui', 'file_text', 18)}
                        <span style={{ fontSize: '0.875rem', color: 'var(--text, #374151)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>
                          {workflow.file.name}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #6b7280)', fontWeight: 500 }}>
                          {formatSize(workflow.file.size)}
                        </span>
                        <button
                          onClick={() => handleViewSnapshot(workflow.file, workflow.fileVersionId)}
                          style={{
                            color: 'var(--color-primary, #3b82f6)',
                            textDecoration: 'none',
                            whiteSpace: 'nowrap',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.375rem',
                            borderRadius: '0.375rem',
                            transition: 'background 0.15s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-primary-tint, #eff6ff)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          {getIcon('ui', 'external_link', 16)}
                        </button>
                        <button
                          onClick={() => handleViewWorkflowDetails(workflow.id)}
                          style={{
                            color: '#8b5cf6',
                            textDecoration: 'none',
                            whiteSpace: 'nowrap',
                            background: 'none',
                            border: '1px solid var(--border, #e5e7eb)',
                            cursor: 'pointer',
                            padding: '0.375rem',
                            borderRadius: '0.375rem',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#8b5cf6';
                            e.currentTarget.style.color = '#8b5cf6';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border, #e5e7eb)';
                            e.currentTarget.style.color = '#8b5cf6';
                          }}
                        >
                          {getIcon('ui', 'workflow', 16, '#8b5cf6')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Description */}
                {workflow.description && (
                  <p style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    color: 'var(--text-muted, #6b7280)',
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {workflow.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, workflowId: null })}
        title={t('workflow.deleteWorkflow', 'Delete Workflow')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ margin: 0, color: 'var(--text, #374151)' }}>
            {t('workflow.deleteWorkflowConfirm', 'Are you sure you want to hard delete this workflow document? This action cannot be undone.')}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button
              onClick={() => setDeleteModal({ isOpen: false, workflowId: null })}
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border, #e5e7eb)',
                background: 'var(--panel, white)',
                color: 'var(--text, #374151)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              {t('cancel', 'Cancel')}
            </button>
            <button
              onClick={handleDeleteWorkflow}
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: '#dc2626',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              {t('delete', 'Delete')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Reject Confirmation Modal */}
      <Modal
        isOpen={rejectModal.isOpen}
        onClose={() => setRejectModal({ isOpen: false, workflowId: null, reason: '' })}
        title={t('workflow.rejectWorkflow', 'Reject Workflow')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text, #374151)', marginBottom: '0.5rem' }}>
              {t('workflow.rejectReason', 'Reason for rejection')}
            </label>
            <textarea
              value={rejectModal.reason}
              onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
              placeholder={t('workflow.rejectReasonPlaceholder', 'Please provide a reason for rejection...')}
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '0.625rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border, #e5e7eb)',
                fontSize: '0.875rem',
                resize: 'vertical',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button
              onClick={() => setRejectModal({ isOpen: false, workflowId: null, reason: '' })}
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border, #e5e7eb)',
                background: 'var(--panel, white)',
                color: 'var(--text, #374151)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              {t('cancel', 'Cancel')}
            </button>
            <button
              onClick={handleRejectWorkflow}
              disabled={!rejectModal.reason.trim()}
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: !rejectModal.reason.trim() ? '#9ca3af' : '#dc2626',
                color: 'white',
                cursor: !rejectModal.reason.trim() ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              {t('drive.reject', 'Reject')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Workflow Action Modal */}
      <Modal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal({ isOpen: false, workflowId: null, action: null, comment: '', assignedUserId: null, assignedRole: null, assigneeType: ASSIGNEE_TYPES.USER })}
        title={actionModal.action ? actionModal.action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Workflow Action'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {(actionModal.action === 'send_for_review' || actionModal.action === 'send_for_approval' || actionModal.action === 'submit') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <Tabs
                tabs={[
                  { value: 'user', label: t('drive.people'), icon: getThemedIcon('ui', 'users', 16, 'light') },
                  { value: 'role', label: t('drive.roles'), icon: getThemedIcon('ui', 'shield', 16, 'light') }
                ]}
                activeTab={actionModal.assigneeType}
                onTabChange={(tab) => setActionModal({ ...actionModal, assigneeType: tab, assignedUserId: null, assignedRole: null })}
              />

              {actionModal.assigneeType === 'user' && (
                <div>
                  <Select
                    label={t('drive.selectUser')}
                    options={users.map(u => {
                      const role = u.roles?.[0] || '';
                      let roleIcon = null;
                      if (role === ROLE_STRINGS.ADMIN || role === ROLE_STRINGS.SUPER_ADMIN) {
                        roleIcon = getThemedIcon('ui', 'shield', 16, 'light');
                      } else if (role === ROLE_STRINGS.INSTRUCTOR) {
                        roleIcon = getThemedIcon('ui', 'graduation_cap', 16, 'light');
                      } else if (role === ROLE_STRINGS.HR) {
                        roleIcon = getThemedIcon('ui', 'users', 16, 'light');
                      }
                      return {
                        value: u.id,
                        label: u.displayName || u.email || u.name,
                        icon: roleIcon
                      };
                    })}
                    value={actionModal.assignedUserId}
                    onChange={(e) => setActionModal({ ...actionModal, assignedUserId: parseInt(e.target.value), assignedRole: null })}
                    placeholder={t('drive.searchUsers')}
                    searchPlaceholder={t('drive.searchUsers')}
                    disabled={searchingUsers}
                    onSearchChange={fetchUsers}
                  />
                </div>
              )}

              {actionModal.assigneeType === 'role' && (
                <div>
                  <Select
                    label={t('drive.selectRole') || 'Select Role'}
                    options={[
                      { value: ROLE_STRINGS.HR, label: t('roles.hr') },
                      { value: ROLE_STRINGS.ADMIN, label: t('roles.admin') },
                      { value: ROLE_STRINGS.INSTRUCTOR, label: t('roles.instructor') }
                    ]}
                    value={actionModal.assignedRole}
                    onChange={(e) => setActionModal({ ...actionModal, assignedRole: e.target.value, assignedUserId: null })}
                  />
                </div>
              )}
            </div>
          )}
          
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text, #374151)', marginBottom: '0.5rem' }}>
              {actionModal.action === 'reject' ? 'Reason (required)' : 'Comment (optional)'}
            </label>
            <textarea
              key={`comment-${actionModal.workflowId}-${actionModal.action}`}
              defaultValue={actionModal.comment}
              ref={commentRef}
              onChange={(e) => {
                console.log('[WorkflowTab] textarea onChange:', e.target.value);
                commentRef.current = e.target.value;
              }}
              onFocus={(e) => {
                console.log('[WorkflowTab] textarea onFocus:', actionModal.action);
              }}
              onBlur={(e) => {
                console.log('[WorkflowTab] textarea onBlur:', actionModal.action, 'value:', e.target.value);
                setActionModal({ ...actionModal, comment: e.target.value });
              }}
              placeholder={actionModal.action === 'reject' ? 'Please provide a reason...' : 'Add a comment...'}
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '0.625rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border, #e5e7eb)',
                fontSize: '0.875rem',
                resize: 'vertical',
              }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button
              onClick={() => setActionModal({ isOpen: false, workflowId: null, action: null, comment: '', assignedUserId: null, assignedRole: null })}
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border, #e5e7eb)',
                background: 'var(--panel, white)',
                color: 'var(--text, #374151)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              {t('cancel', 'Cancel')}
            </button>
            <button
              onClick={handleWorkflowAction}
              disabled={
                (actionModal.action === 'reject' && !actionModal.comment.trim()) ||
                ((actionModal.action === 'send_for_review' || actionModal.action === 'send_for_approval') && !actionModal.assignedUserId && !actionModal.assignedRole)
              }
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: (
                  (actionModal.action === 'reject' && !actionModal.comment.trim()) ||
                  ((actionModal.action === 'send_for_review' || actionModal.action === 'send_for_approval') && !actionModal.assignedUserId && !actionModal.assignedRole)
                ) ? '#9ca3af' : '#3b82f6',
                color: 'white',
                cursor: (
                  (actionModal.action === 'reject' && !actionModal.comment.trim()) ||
                  ((actionModal.action === 'send_for_review' || actionModal.action === 'send_for_approval') && !actionModal.assignedUserId && !actionModal.assignedRole)
                ) ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              {actionModal.action ? actionModal.action.replace('_', ' ').toUpperCase() : 'Confirm'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
