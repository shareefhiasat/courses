/**
 * Workflow Inbox Page
 * 
 * PURPOSE: Display user's workflow inbox items with filtering and actions
 * ARCHITECTURE: Page Component → Hook → Service → API
 */

import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  User,
  Filter,
  RefreshCw,
  Search,
  X,
  FileText,
  Eye,
  Workflow,
  XCircle,
  GitBranch
} from 'lucide-react';
import { format } from "date-fns";
import { formatQatarDate } from '@utils/timezone';
import { getSlaInfo } from '@utils/sla.js';
import { getStatusVariant as getActionVariant, getStatusColorClasses } from '@constants/workflowStatusTypes';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import useNotifications from '@hooks/useNotifications';
import useWorkflowInbox from "@hooks/useWorkflowInbox";
import { Button, useToast } from '@ui';
import { Card, CardContent, CardHeader, CardTitle, Badge, Input, SimpleLoading, EmptyState, AdvancedDataGrid } from '@ui';
import { useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import WorkflowDiagram from '@components/workflow/WorkflowDiagram';

const WorkflowInboxPage = () => {
  const navigate = useNavigate();
  const { t } = useLang();
  const { theme } = useTheme();
  const { triggerNotification } = useNotifications();
  const toast = useToast();
  const { startLoading } = useGlobalLoading();
  
  const [selectedDocumentForWorkflow, setSelectedDocumentForWorkflow] = useState(null);
  const [showWorkflowDiagram, setShowWorkflowDiagram] = useState(false);
  
  const {
    documents,
    loading,
    error,
    pagination,
    filters,
    stats,
    unreadCount,
    updateFilters,
    updatePagination,
    refresh
  } = useWorkflowInbox({}, triggerNotification);


  // Status badge variants - using centralized status constants
  const getStatusVariant = (status) => {
    return getActionVariant(status);
  };

  // Get status icon
  const getStatusIcon = (status) => {
    const statusUpper = status?.toUpperCase();
    switch (statusUpper) {
      case 'DRAFT':
        return <Clock className="h-4 w-4" />;
      case 'SUBMITTED':
        return <Clock className="h-4 w-4" />;
      case 'UNDER_REVIEW':
      case 'UNDER_ADMIN_REVIEW':
        return <AlertCircle className="h-4 w-4" />;
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4" />;
      case 'AMENDED':
        return <GitBranch className="h-4 w-4" />;
      case 'CLOSED':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    const statusUpper = status?.toUpperCase();
    switch (statusUpper) {
      case 'DRAFT':
        return '#6b7280';
      case 'SUBMITTED':
        return '#f59e0b';
      case 'UNDER_REVIEW':
      case 'UNDER_ADMIN_REVIEW':
        return '#3b82f6';
      case 'APPROVED':
        return '#10b981';
      case 'REJECTED':
        return '#ef4444';
      case 'AMENDED':
        return '#f59e0b';
      case 'CLOSED':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  // Handle show workflow diagram
  const handleShowWorkflowDiagram = useCallback((document) => {
    setSelectedDocumentForWorkflow(document);
    setShowWorkflowDiagram(true);
  }, []);

  // Grid columns - Updated for WorkflowDocument model
  const columns = useMemo(() => [
    {
      field: 'title',
      headerName: t('workflow.inbox.document', 'Document'),
      flex: 1,
      renderCell: (params) => (
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <FileText className="h-5 w-5 text-gray-400" />
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {params.row.title}
            </div>
            <div className="text-sm text-gray-500">
              {params.row.description}
            </div>
          </div>
        </div>
      )
    },
    {
      field: 'status',
      headerName: t('workflow.inbox.status', 'Status'),
      width: 160,
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          <div 
            className="flex items-center justify-center rounded-full"
            style={{ 
              backgroundColor: getStatusColor(params.value),
              width: '24px',
              height: '24px'
            }}
          >
            <span style={{ color: '#ffffff' }} className="text-xs">
              {getStatusIcon(params.value)}
            </span>
          </div>
          <span className="text-sm font-medium">
            {params.value}
          </span>
        </div>
      )
    },
    {
      field: 'submitter',
      headerName: t('workflow.inbox.from', 'From'),
      width: 180,
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-400" />
          <span className="text-sm">
            {params.row.submitter?.displayName || params.row.submitter?.firstName || params.row.submitter?.lastName || t('workflow.inbox.unknown', 'Unknown')}
          </span>
        </div>
      )
    },
    {
      field: 'currentAssignee',
      headerName: t('workflow.inbox.assignedTo', 'Assigned To'),
      width: 180,
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-400" />
          <span className="text-sm">
            {params.row.currentAssignee?.displayName || params.row.currentAssignee?.firstName || params.row.currentAssignee?.lastName || t('workflow.inbox.unassigned', 'Unassigned')}
          </span>
        </div>
      )
    },
    {
      field: 'createdAt',
      headerName: t('workflow.inbox.received', 'Received'),
      width: 120,
      renderCell: (params) => {
        const date = params.value ? new Date(params.value) : null;
        const isValidDate = date && !isNaN(date.getTime());
        
        return (
          <div className="text-sm text-gray-500">
            {isValidDate ? formatQatarDate(date, 'MMM d, yyyy') : 'N/A'}
          </div>
        );
      }
    },
    {
      field: 'sla',
      headerName: t('workflow.inbox.sla', 'SLA'),
      width: 100,
      renderCell: (params) => {
        const submittedAt = params.row.submittedAt || params.row.createdAt;
        const slaInfo = getSlaInfo(submittedAt);
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
      width: 240,
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/workflow-documents/${params.row.id}`)}
            className="h-8 px-3"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleShowWorkflowDiagram(params.row)}
            className="h-8 px-3"
          >
            <Workflow className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ], [t, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle page change
  const handlePageChange = (newPage) => {
    updatePagination({ page: newPage });
  };

  if (loading && documents.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <SimpleLoading />
      </div>
    );
  }

  return (
    <div className="flex justify-center px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-7xl w-full space-y-6">

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-3">
              <div className="flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.urgent}
                </div>
                <div className="text-xs text-gray-600">
                  {t('workflow.inbox.urgent', 'Urgent')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-3">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.pending}
                </div>
                <div className="text-xs text-gray-600">
                  {t('workflow.inbox.pending', 'Pending')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-3">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.completed}
                </div>
                <div className="text-xs text-gray-600">
                  {t('workflow.inbox.completed', 'Completed')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-sm border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Search - always visible */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t('workflow.inbox.searchPlaceholder', 'Search documents...')}
                value={filters.search || ''}
                onChange={(e) => updateFilters({ search: e.target.value })}
                className="pl-10"
              />
            </div>

            {/* View Filters - compact */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">{t('workflow.inbox.view', 'View')}:</span>
              <div className="flex gap-1">
                {[
                  { value: 'all', label: t('workflow.inbox.all', 'All') },
                  { value: 'needs_action', label: t('workflow.inbox.needsAction', 'Action') },
                  { value: 'waiting', label: t('workflow.inbox.waiting', 'Waiting') },
                  { value: 'completed', label: t('workflow.inbox.completed', 'Done') }
                ].map((item) => (
                  <Button
                    key={item.value}
                    variant={filters.viewMode === item.value ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => updateFilters({ viewMode: item.value })}
                    className="h-8 px-3"
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Status Filter - dropdown style */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">{t('workflow.inbox.status', 'Status')}:</span>
              <select
                value={filters.status || ''}
                onChange={(e) => updateFilters({ status: e.target.value })}
                className="h-8 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('workflow.inbox.all', 'All')}</option>
                {['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'UNDER_ADMIN_REVIEW', 'APPROVED', 'REJECTED', 'AMENDED', 'CLOSED'].map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  updateFilters({
                    viewMode: 'all',
                    search: '',
                    status: '',
                    workflowType: ''
                  });
                }}
                title={t('workflow.inbox.clearFilters', 'Clear filters')}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={refresh}
                disabled={loading}
                title={t('workflow.inbox.refresh', 'Refresh')}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
      {documents.length > 0 ? (
        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-0">
            <AdvancedDataGrid
              rows={documents}
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
              icon={<CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />}
              title={t('workflow.inbox.emptyTitle', 'No workflow items found')}
              description={t('workflow.inbox.emptyDescription', 'Adjust your filters to see existing items.')}
            />
          </CardContent>
        </Card>
      )}

      {/* Workflow Diagram Modal */}
      {showWorkflowDiagram && selectedDocumentForWorkflow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full h-full overflow-hidden">
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
            <div className="p-4 overflow-auto" style={{ height: 'calc(100vh - 60px)' }}>
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
    </div>
  );
};

export default WorkflowInboxPage;
