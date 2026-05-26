/**
 * Workflow Inbox Page
 * 
 * PURPOSE: Display user's workflow inbox items with filtering and actions
 * ARCHITECTURE: Page Component → Hook → Service → API
 */

import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  User,
  Filter,
  RefreshCw,
  Eye,
  EyeOff,
  Search,
  ArrowLeft,
  X,
  Plus,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { format } from "date-fns";
import { getQatarTimeAgo, formatQatarDate } from '@utils/timezone';
import { getSlaInfo, sortBySlaUrgency } from '@utils/sla.js';
import { info, error, warn, debug } from '@services/utils/logger.js';
import { getThemedIcon } from '@constants/iconTypes';
import { useAuth } from "@contexts/AuthContext";
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import useWorkflowInbox from "@hooks/useWorkflowInbox";
import useNotifications from "@hooks/useNotifications";
import { getUsers } from '@services/business/userService';
import { Button, useToast } from '@ui';
import { Card, CardContent, CardHeader, CardTitle, Badge, Input, Select, SimpleLoading, EmptyState, AdvancedDataGrid } from '@ui';
import { GlobalLoadingFallback, useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import CollapsibleDashboardSection from '@components/ui/CollapsibleDashboardSection/CollapsibleDashboardSection.jsx';
import WorkflowDiagram from '@components/workflow/WorkflowDiagram';

const WorkflowInboxPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLang();
  const { theme } = useTheme();
  const { triggerNotification } = useNotifications();
  const toast = useToast();
  const { startLoading } = useGlobalLoading();
  
  // Collapsible states
  const [isStatsCollapsed, setIsStatsCollapsed] = useState(false);
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(false);
  const [sortBySla, setSortBySla] = useState(true); // Default to SLA sorting
  const [selectedDocumentForWorkflow, setSelectedDocumentForWorkflow] = useState(null);
  const [showWorkflowDiagram, setShowWorkflowDiagram] = useState(false);
  
  const {
    inboxItems,
    loading,
    error,
    pagination,
    filters,
    unreadCount,
    markAsRead,
    updateFilters,
    updatePagination,
    refresh,
    bulkMarkAsRead
  } = useWorkflowInbox();

  const [recipientOptions, setRecipientOptions] = useState([{ value: '', label: t('workflow.inbox.allRecipients', 'All Recipients') }]);

  useEffect(() => {
    const loadRecipients = async () => {
      try {
        const result = await getUsers({ max: 500 });
        if (!result?.success || !Array.isArray(result.data)) {
          setRecipientOptions([{ value: '', label: t('workflow.inbox.allRecipients', 'All Recipients') }]);
          return;
        }

        const options = [
          { value: '', label: t('workflow.inbox.allRecipients', 'All Recipients') },
          ...result.data.map((u) => {
            const displayName = u.displayName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || `User ${u.id}`;
            return {
              value: String(u.id),
              label: `${displayName}${u.email ? ` (${u.email})` : ''}`
            };
          })
        ];

        setRecipientOptions(options);
      } catch {
        setRecipientOptions([{ value: '', label: t('workflow.inbox.allRecipients', 'All Recipients') }]);
      }
    };

    loadRecipients();
  }, [t]);

  // Action type options - will be populated from lookup table
  const actionOptions = useMemo(() => [
    { value: '', label: t('workflow.inbox.allActions', 'All Actions') },
    { value: 'sent', label: t('workflow.actions.sent', 'Sent') },
    { value: 'review', label: t('workflow.actions.review', 'Review') },
    { value: 'approve', label: t('workflow.actions.approve', 'Approve') },
    { value: 'revise', label: t('workflow.actions.revise', 'Revise') },
    { value: 'approved', label: t('workflow.actions.approved', 'Approved') },
    { value: 'return', label: t('workflow.actions.return', 'Return') },
    { value: 'close', label: t('workflow.actions.close', 'Close') },
    { value: 'send', label: t('workflow.actions.send', 'Send') }
  ], [t]);

  // Apply SLA sorting to inbox items
  const sortedInboxItems = useMemo(() => {
    if (sortBySla) {
      return sortBySlaUrgency(inboxItems);
    }
    return inboxItems;
  }, [inboxItems, sortBySla]);

  // Status badge variants
  const getStatusVariant = (action) => {
    switch (action) {
      case 'sent':
        return 'default';
      case 'review':
        return 'warning';
      case 'approve':
        return 'info';
      case 'revise':
        return 'destructive';
      case 'approved':
        return 'success';
      case 'return':
        return 'secondary';
      case 'close':
        return 'outline';
      case 'send':
        return 'default';
      default:
        return 'secondary';
    }
  };

  // Action icons
  const getActionIcon = (action) => {
    switch (action) {
      case 'sent':
        return <Send className="h-4 w-4" />;
      case 'review':
        return <Eye className="h-4 w-4" />;
      case 'approve':
        return <CheckCircle className="h-4 w-4" />;
      case 'revise':
        return <AlertCircle className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'return':
        return <ArrowLeft className="h-4 w-4" />;
      case 'close':
        return <X className="h-4 w-4" />;
      case 'send':
        return <Send className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Handle mark as read
  const handleMarkAsRead = useCallback(async (inboxItemId) => {
    const result = await markAsRead(inboxItemId);
    if (result.success) {
      triggerNotification('success', t('workflow.inbox.markedAsRead', 'Item marked as read'));
    } else {
      triggerNotification('error', result.error || t('workflow.inbox.markReadError', 'Failed to mark as read'));
    }
  }, [t, triggerNotification, markAsRead]);

  // Handle show workflow diagram
  const handleShowWorkflowDiagram = useCallback((document) => {
    setSelectedDocumentForWorkflow(document);
    setShowWorkflowDiagram(true);
  }, []);

  // Grid columns
  const columns = useMemo(() => [
    {
      field: 'document',
      headerName: t('workflow.inbox.document', 'Document'),
      flex: 1,
      renderCell: (params) => (
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {getActionIcon(params.row.action)}
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {params.row.document?.title}
            </div>
            <div className="text-sm text-gray-500">
              {params.row.document?.description}
            </div>
          </div>
        </div>
      )
    },
    {
      field: 'action',
      headerName: t('workflow.inbox.action', 'Action'),
      width: 120,
      renderCell: (params) => (
        <Badge variant={getStatusVariant(params.value)}>
          {t(`workflow.actions.${params.value}`, params.value)}
        </Badge>
      )
    },
    {
      field: 'isRead',
      headerName: t('workflow.inbox.status', 'Status'),
      width: 100,
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          {params.value ? (
            <EyeOff className="h-4 w-4 text-gray-400" />
          ) : (
            <Eye className="h-4 w-4 text-blue-500" />
          )}
          <span className="text-sm">
            {params.value ? t('workflow.inbox.read', 'Read') : t('workflow.inbox.unread', 'Unread')}
          </span>
        </div>
      )
    },
    {
      field: 'document.creator',
      headerName: t('workflow.inbox.from', 'From'),
      width: 150,
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-400" />
          <span className="text-sm">
            {params.row.rowType === 'sent'
              ? (params.row.document?.currentAssignee?.displayName || params.row.document?.currentAssignee?.firstName || t('workflow.inbox.unassigned', 'Unassigned'))
              : (params.row.document?.creator?.displayName || params.row.document?.creator?.firstName || t('workflow.inbox.unknown', 'Unknown'))}
          </span>
        </div>
      )
    },
    {
      field: 'createdAt',
      headerName: t('workflow.inbox.received', 'Received'),
      width: 120,
      renderCell: (params) => (
        <div className="text-sm text-gray-500">
          {formatQatarDate(new Date(params.value), 'MMM d, yyyy')}
        </div>
      )
    },
    {
      field: 'sla',
      headerName: t('workflow.inbox.sla', 'SLA'),
      width: 100,
      renderCell: (params) => {
        const slaInfo = getSlaInfo(params.row.document?.submittedAt);
        return (
          <div className="flex flex-col gap-1">
            <Badge variant={slaInfo.badgeVariant} className="text-xs">
              {slaInfo.timeElapsed}
            </Badge>
            {slaInfo.isOverdue && (
              <span className="text-xs text-red-600 font-medium">
                {t('workflow.inbox.overdue', 'Overdue')}
              </span>
            )}
          </div>
        );
      }
    },
    {
      field: 'actions',
      headerName: t('workflow.inbox.actions', 'Actions'),
      width: 220,
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/workflow-documents/${params.row.documentId || params.row.document?.id}`)}
          >
            {t('workflow.inbox.open', 'Open')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleShowWorkflowDiagram(params.row.document)}
          >
            {t('workflow.inbox.workflow', 'Workflow')}
          </Button>
          {!params.row.isRead && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleMarkAsRead(params.row.id)}
            >
              {t('workflow.inbox.markRead', 'Mark Read')}
            </Button>
          )}
        </div>
      )
    }
  ], [t, handleMarkAsRead, theme, navigate]);

  // Handle bulk mark as read
  const handleBulkMarkAsRead = async () => {
    const unreadItems = inboxItems.filter(item => !item.isRead);
    if (unreadItems.length === 0) return;

    const itemIds = unreadItems.map(item => item.id);
    const result = await bulkMarkAsRead(itemIds);
    
    if (result.failed === 0) {
      triggerNotification('success', t('workflow.inbox.allMarkedAsRead', 'All items marked as read'));
    } else {
      triggerNotification('warning', t('workflow.inbox.someMarkedAsRead', 'Some items marked as read'));
    }
  };

  // Handle search
  const handleSearch = (searchTerm) => {
    updateFilters({ search: searchTerm });
  };

  // Handle filter change
  const handleFilterChange = (filterName, value) => {
    updateFilters({ [filterName]: value });
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    updatePagination({ page: newPage });
  };

  if (loading && inboxItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <SimpleLoading />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Collapsible Header */}
      <Card className="shadow-sm border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {t('workflow.inbox.title', 'Workflow Inbox')}
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  {t('workflow.inbox.description', 'Manage your workflow documents and approvals')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/drive')}
                className="p-2"
                title={t('workflow.inbox.workspace', 'Workspace')}
              >
                <FileText className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/workflow/create')}
                className="p-2"
                title={t('workflow.inbox.createDocument', 'Create Document')}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                disabled={loading}
                className="p-2"
                title={t('workflow.inbox.refresh', 'Refresh')}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              {unreadCount > 0 && (
                <Button
                  size="sm"
                  onClick={handleBulkMarkAsRead}
                  disabled={loading}
                  className="p-2 bg-blue-600 hover:bg-blue-700 text-white"
                  title={t('workflow.inbox.markAllRead', 'Mark All Read')}
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsStatsCollapsed(!isStatsCollapsed)}
                className="p-2"
                title={isStatsCollapsed ? 'Show Stats' : 'Hide Stats'}
              >
                {isStatsCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Collapsible Stats Dashboard */}
      <CollapsibleDashboardSection
        title={t('workflow.inbox.statistics', 'Statistics')}
        icon={<FileText className="h-4 w-4" />}
        sectionId="workflow-stats"
        defaultMode="full"
        color="#6366f1"
        count={inboxItems.length}
        headerRight={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsStatsCollapsed(!isStatsCollapsed)}
            className="p-2"
            title={isStatsCollapsed ? 'Show Stats' : 'Hide Stats'}
          >
            {isStatsCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        }
      >
        <div className="p-4">
          {/* Main Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <Send className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {inboxItems.filter(item => item.action === 'sent' || item.action === 'send').length}
                    </div>
                    <div className="text-xs text-gray-600">
                      {t('workflow.inbox.sent', 'Sent')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <Eye className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {inboxItems.filter(item => item.action === 'review').length}
                    </div>
                    <div className="text-xs text-gray-600">
                      {t('workflow.inbox.pendingReview', 'Pending Review')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {inboxItems.filter(item => item.action === 'approved' || item.action === 'approve').length}
                    </div>
                    <div className="text-xs text-gray-600">
                      {t('workflow.inbox.approved', 'Approved')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {inboxItems.filter(item => item.action === 'revise' || item.action === 'return').length}
                    </div>
                    <div className="text-xs text-gray-600">
                      {t('workflow.inbox.needsAction', 'Needs Action')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <Eye className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {unreadCount}
                    </div>
                    <div className="text-xs text-gray-600">
                      {t('workflow.inbox.unread', 'Unread')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-gray-500 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <Clock className="h-6 w-6 text-gray-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {inboxItems.filter(item => item.action === 'close').length}
                    </div>
                    <div className="text-xs text-gray-600">
                      {t('workflow.inbox.closed', 'Closed')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-indigo-500 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <FileText className="h-6 w-6 text-indigo-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {inboxItems.length}
                    </div>
                    <div className="text-xs text-gray-600">
                      {t('workflow.inbox.total', 'Total Items')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CollapsibleDashboardSection>

      {/* Collapsible Filters */}
      <CollapsibleDashboardSection
        title={t('workflow.inbox.filters', 'Filters')}
        icon={<Filter className="h-4 w-4" />}
        sectionId="workflow-filters"
        defaultMode="full"
        color="#3b82f6"
        count={Object.values(filters).filter(v => v !== null && v !== '' && v !== 'all').length}
        inlineFilters={
          <div className="flex items-center gap-2">
            <Select
              value={filters.viewMode || 'all'}
              onChange={(valueOrEvent) => {
                const value = valueOrEvent?.target?.value ?? valueOrEvent;
                updateFilters({ viewMode: value });
              }}
              options={[
                { value: 'all', label: t('workflow.inbox.viewAll', 'All') },
                { value: 'received', label: t('workflow.inbox.viewReceived', 'Received') },
                { value: 'sent', label: t('workflow.inbox.viewSent', 'Sent') }
              ]}
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              placeholder={t('workflow.inbox.viewPlaceholder', 'View')}
            />
            <Button
              variant={sortBySla ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBySla(!sortBySla)}
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              {t('workflow.inbox.sortBySla', 'Sort by SLA')}
            </Button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t('workflow.inbox.searchPlaceholder', 'Search...')}
                value={filters.search || ''}
                onChange={(e) => updateFilters({ search: e.target.value })}
                className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <Select
              value={filters.action || ''}
              onChange={(valueOrEvent) => updateFilters({ action: valueOrEvent?.target?.value ?? valueOrEvent })}
              options={actionOptions}
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              placeholder={t('workflow.inbox.actionPlaceholder', 'Action')}
            />
            <Select
              value={filters.isRead !== null ? filters.isRead.toString() : ''}
              onChange={(valueOrEvent) => {
                const value = valueOrEvent?.target?.value ?? valueOrEvent;
                updateFilters({ 
                  isRead: value === '' ? null : value === 'true' 
                });
              }}
              options={[
                { value: '', label: t('workflow.inbox.allStatus', 'All Status') },
                { value: 'false', label: t('workflow.inbox.unread', 'Unread') },
                { value: 'true', label: t('workflow.inbox.read', 'Read') }
              ]}
              className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              placeholder={t('workflow.inbox.statusPlaceholder', 'Status')}
            />
            <Select
              value={filters.recipientId || ''}
              onChange={(valueOrEvent) => {
                const value = valueOrEvent?.target?.value ?? valueOrEvent;
                updateFilters({ recipientId: value });
              }}
              options={recipientOptions}
              className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              placeholder={t('workflow.inbox.recipientPlaceholder', 'Recipient')}
            />
            <Button
              variant="outline"
              onClick={() => {
                updateFilters({
                  viewMode: 'all',
                  search: '',
                  action: '',
                  isRead: null,
                  recipientId: ''
                });
              }}
              className="border-gray-300 hover:border-blue-500"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        }
      >
        <div className="p-4">
          {/* Filters content is now inline in header */}
        </div>
      </CollapsibleDashboardSection>

      {/* Error */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Grid */}
      {sortedInboxItems.length > 0 ? (
        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-0">
            <AdvancedDataGrid
              rows={sortedInboxItems}
              columns={columns}
              pagination={pagination}
              onPageChange={handlePageChange}
              loading={loading}
              getRowId={(row) => row.id}
              className="border-none"
              pageSizeOptions={[10, 25, 50, 100]}
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-12 text-center">
            <EmptyState
              icon={<FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />}
              title={t('workflow.inbox.emptyTitle', 'No workflow items found')}
              description={t('workflow.inbox.emptyDescription', 'Create your first workflow document or adjust your filters to see existing items.')}
              action={
                <Button
                  onClick={() => navigate('/workflow/create')}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('workflow.inbox.createFirst', 'Create Workflow Document')}
                </Button>
              }
            />
          </CardContent>
        </Card>
      )}

      {/* Workflow Diagram Modal */}
      {showWorkflowDiagram && selectedDocumentForWorkflow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {t('workflow.inbox.workflowProgress', 'Workflow Progress')}: {selectedDocumentForWorkflow.title}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowWorkflowDiagram(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 overflow-auto" style={{ height: 'calc(90vh - 60px)' }}>
              <WorkflowDiagram
                status={selectedDocumentForWorkflow.status}
                workflowType={selectedDocumentForWorkflow.workflowType || 'ATTENDANCE_REPORT'}
                onNodeClick={(nodeId) => console.log('Node clicked:', nodeId)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowInboxPage;
