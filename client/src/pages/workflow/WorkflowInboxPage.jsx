/**
 * Workflow Inbox Page
 * 
 * PURPOSE: Display user's workflow inbox items with filtering and actions
 * ARCHITECTURE: Page Component → Hook → Service → API
 */

import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from "date-fns";
import { formatQatarDate } from '@utils/timezone';
import { getSlaInfo } from '@utils/sla.js';
import { getStatusVariant as getActionVariant, getStatusColorClasses, getWorkflowStatusIcon } from '@constants/workflowStatusTypes';
import { getThemedIcon, getUserRoleIcon, getUserRoleColor } from '@constants/iconTypes';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import useNotifications from '@hooks/useNotifications';
import useWorkflowInbox from "@hooks/useWorkflowInbox";
import { Button, useToast } from '@ui';
import { Card, CardContent, CardHeader, CardTitle, Badge, Input, SimpleLoading, EmptyState, AdvancedDataGrid } from '@ui';
import { useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { AlertCircle } from 'lucide-react';

const WorkflowInboxPage = () => {
  const navigate = useNavigate();
  const { t } = useLang();
  const { theme } = useTheme();
  const { triggerNotification } = useNotifications();
  const toast = useToast();
  const { startLoading } = useGlobalLoading();

  // Helper to get file type icon based on mimeType
  const getFileIconName = (mimeType) => {
    if (!mimeType) return 'file';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'music';
    if (mimeType.includes('pdf')) return 'file_text';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return 'archive';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'table';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'file_text';
    return 'file';
  };
  
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

  // Get status color
  const getStatusColor = (status) => {
    const statusUpper = status?.toUpperCase();
    switch (statusUpper) {
      case 'DRAFT':
        return '#6b7280';
      case 'SUBMITTED':
        return '#3b82f6';
      case 'UNDER_REVIEW':
        return '#3b82f6';
      case 'UNDER_ADMIN_REVIEW':
        return '#8b5cf6';
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

  // Grid columns - Updated for WorkflowDocument model
  const columns = useMemo(() => [
    {
      field: 'id',
      headerName: 'ID',
      width: 80,
      renderCell: (params) => {
        return (
          <div className="text-sm text-gray-900 font-mono">
            #{params.value}
          </div>
        );
      }
    },
    {
      field: 'title',
      headerName: t('workflow.inbox.document', 'Document'),
      width: 250,
      renderCell: (params) => {
        const mimeType = params.row.file?.mimeType;
        const icon = getThemedIcon('ui', getFileIconName(mimeType), 20, theme);
        
        return (
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 flex items-center">
              {icon}
            </div>
            <div className="font-medium text-gray-900">
              {params.row.title}
            </div>
          </div>
        );
      }
    },
    {
      field: 'description',
      headerName: t('workflow.inbox.description', 'Description'),
      width: 200,
      renderCell: (params) => {
        return (
          <div className="text-sm text-gray-500">
            {params.row.description || '-'}
          </div>
        );
      }
    },
    {
      field: 'status',
      headerName: t('workflow.inbox.status', 'Status'),
      width: 80,
      renderCell: (params) => {
        const statusUpper = params.value?.toUpperCase();
        let iconColor = '#6b7280';
        
        switch (statusUpper) {
          case 'DRAFT':
            iconColor = '#6b7280';
            break;
          case 'SUBMITTED':
            iconColor = '#3b82f6';
            break;
          case 'UNDER_REVIEW':
            iconColor = '#3b82f6';
            break;
          case 'UNDER_ADMIN_REVIEW':
            iconColor = '#8b5cf6';
            break;
          case 'APPROVED':
            iconColor = '#10b981';
            break;
          case 'REJECTED':
            iconColor = '#ef4444';
            break;
          default:
            iconColor = '#6b7280';
        }
        
        const StatusIcon = getWorkflowStatusIcon(params.value);
        
        return (
          <div className="flex items-center justify-center" title={params.value}>
            <StatusIcon className="h-5 w-5" style={{ color: iconColor }} />
          </div>
        );
      }
    },
    {
      field: 'nextStatus',
      headerName: t('workflow.inbox.nextStatus', 'Next Status'),
      width: 150,
      renderCell: (params) => {
        const currentStatus = params.row.status?.toUpperCase();
        let nextStatus = '-';
        let NextStatusIcon = null;
        let iconColor = '#6b7280';
        
        switch (currentStatus) {
          case 'DRAFT':
            nextStatus = t('workflow.inbox.nextStatusSubmitted', 'Submitted');
            NextStatusIcon = getWorkflowStatusIcon('SUBMITTED');
            iconColor = '#3b82f6';
            break;
          case 'SUBMITTED':
            nextStatus = t('workflow.inbox.nextStatusUnderReview', 'HR Review');
            NextStatusIcon = getWorkflowStatusIcon('UNDER_REVIEW');
            iconColor = '#3b82f6';
            break;
          case 'UNDER_REVIEW':
            nextStatus = t('workflow.inbox.nextStatusAdminReview', 'Admin Review');
            NextStatusIcon = getWorkflowStatusIcon('UNDER_ADMIN_REVIEW');
            iconColor = '#8b5cf6';
            break;
          case 'UNDER_ADMIN_REVIEW':
            nextStatus = t('workflow.inbox.nextStatusApproved', 'Approved');
            NextStatusIcon = getWorkflowStatusIcon('APPROVED');
            iconColor = '#10b981';
            break;
          case 'APPROVED':
            nextStatus = t('workflow.inbox.nextStatusCompleted', 'Completed');
            NextStatusIcon = getWorkflowStatusIcon('APPROVED');
            iconColor = '#10b981';
            break;
          case 'REJECTED':
            nextStatus = t('workflow.inbox.nextStatusResubmit', 'Resubmit');
            NextStatusIcon = getWorkflowStatusIcon('SUBMITTED');
            iconColor = '#3b82f6';
            break;
          default:
            nextStatus = '-';
        }
        
        return (
          <div className="flex items-center gap-2">
            {NextStatusIcon && (
              <NextStatusIcon className="h-4 w-4" style={{ color: iconColor }} />
            )}
            <span className="text-sm" style={{ color: iconColor }}>
              {nextStatus}
            </span>
          </div>
        );
      }
    },
    {
      field: 'submitter',
      headerName: t('workflow.inbox.from', 'From'),
      width: 150,
      renderCell: (params) => {
        const submitter = params.row.submitter;
        
        console.log('[WorkflowInbox] From Debug - Detailed:', {
          submitter,
          submitterId: params.row.submitterId,
          submitterKeys: submitter ? Object.keys(submitter) : 'null',
          submitterDisplayName: submitter?.displayName,
          submitterFirstName: submitter?.firstName,
          submitterLastName: submitter?.lastName,
          submitterEmail: submitter?.email,
          submitterRoleAssignments: submitter?.roleAssignments,
          row: params.row
        });
        
        const displayName = submitter?.displayName || 
                          (submitter?.firstName && submitter?.lastName ? `${submitter.firstName} ${submitter.lastName}` : null) ||
                          submitter?.email ||
                          t('workflow.inbox.unknown', 'Unknown');
        
        // Get role type from role assignments
        const roleAssignments = submitter?.roleAssignments || [];
        const primaryRole = roleAssignments.length > 0 ? roleAssignments[0].role : null;
        
        const getRoleType = (roleCode) => {
          if (!roleCode) return null;
          const code = roleCode.toLowerCase();
          if (code.includes('super_admin') || code.includes('superadmin')) return 'super_admin';
          if (code.includes('owner') || code.includes('مالك')) return 'owner';
          if (code.includes('hr') || code.includes('موارد')) return 'hr';
          if (code.includes('admin') || code.includes('إدارة')) return 'admin';
          if (code.includes('instructor') || code.includes('معلم')) return 'instructor';
          if (code.includes('student') || code.includes('طالب')) return 'student';
          return null;
        };
        
        const roleType = getRoleType(primaryRole?.code);
        
        return (
          <div className="flex items-center gap-2">
            {roleType ? (
              React.cloneElement(getUserRoleIcon(roleType), { 
                color: getUserRoleColor(roleType), 
                size: 16 
              })
            ) : (
              getThemedIcon('ui', 'user', 16, theme)
            )}
            <span className="text-sm">
              {displayName}
            </span>
          </div>
        );
      }
    },
    {
      field: 'currentAssignee',
      headerName: t('workflow.inbox.assignedTo', 'Assigned To'),
      width: 180,
      renderCell: (params) => {
        const assignee = params.row.currentAssignee;
        
        console.log('[WorkflowInbox] Assigned To Debug - Detailed:', {
          assignee,
          assigneeId: params.row.currentAssigneeId,
          assigneeKeys: assignee ? Object.keys(assignee) : 'null',
          assigneeDisplayName: assignee?.displayName,
          assigneeFirstName: assignee?.firstName,
          assigneeLastName: assignee?.lastName,
          assigneeEmail: assignee?.email,
          assigneeRoleAssignments: assignee?.roleAssignments,
          submitterId: params.row.submitterId,
          status: params.row.status,
          row: params.row
        });
        
        // If no assignee, show role based on workflow type
        if (!assignee) {
          const workflowType = params.row.workflowType;
          let roleLabel = t('workflow.inbox.unassigned', 'Unassigned');
          let roleIcon = getThemedIcon('ui', 'user', 16, theme);
          
          if (workflowType === 'ATTENDANCE_WEEKLY') {
            roleLabel = t('roles.admin', 'Admin');
            roleIcon = React.cloneElement(getUserRoleIcon('admin'), { color: getUserRoleColor('admin'), size: 16 });
          } else if (workflowType === 'GENERAL') {
            roleLabel = t('roles.hr', 'HR');
            roleIcon = React.cloneElement(getUserRoleIcon('hr'), { color: getUserRoleColor('hr'), size: 16 });
          }
          
          return (
            <div className="flex items-center gap-2">
              {roleIcon}
              <span className="text-sm">
                {roleLabel}
              </span>
            </div>
          );
        }

        // Check if assignee has role assignments
        const roleAssignments = assignee.roleAssignments || [];
        const primaryRole = roleAssignments.length > 0 ? roleAssignments[0].role : null;
        
        console.log('[WorkflowInbox] Role assignments:', {
          roleAssignments,
          primaryRole,
          roleCount: roleAssignments.length
        });
        
        // Get role type from role code
        const getRoleType = (roleCode) => {
          if (!roleCode) return null;
          const code = roleCode.toLowerCase();
          if (code.includes('super_admin') || code.includes('superadmin')) return 'super_admin';
          if (code.includes('owner') || code.includes('مالك')) return 'owner';
          if (code.includes('hr') || code.includes('موارد')) return 'hr';
          if (code.includes('admin') || code.includes('إدارة')) return 'admin';
          if (code.includes('instructor') || code.includes('معلم')) return 'instructor';
          if (code.includes('student') || code.includes('طالب')) return 'student';
          return null;
        };

        const roleType = getRoleType(primaryRole?.code);
        const displayName = assignee?.displayName || 
                          (assignee?.firstName && assignee?.lastName ? `${assignee.firstName} ${assignee.lastName}` : null) ||
                          assignee?.email ||
                          t('workflow.inbox.unknown', 'Unknown');
        
        console.log('[WorkflowInbox] Final display:', {
          roleType,
          displayName,
          primaryRoleCode: primaryRole?.code
        });
        
        return (
          <div className="flex items-center gap-2">
            {roleType ? (
              React.cloneElement(getUserRoleIcon(roleType), { 
                color: getUserRoleColor(roleType), 
                size: 16 
              })
            ) : (
              getThemedIcon('ui', 'user', 16, theme)
            )}
            <span className="text-sm">
              {displayName}
            </span>
          </div>
        );
      }
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
          <div className="flex items-center gap-1">
            <Badge variant={slaInfo.badgeVariant} className="text-xs">
              {slaInfo.timeElapsed}
            </Badge>
            {slaInfo.isOverdue && (
              <span className="text-xs text-red-600 font-medium whitespace-nowrap">
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
      width: 120,
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => window.open(`/workflow-documents/${params.row.id}`, '_blank')}
            className="h-8 px-3"
          >
            {getThemedIcon('ui', 'eye', 16, 'white')}
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
      <div className="max-w-[1600px] w-full space-y-6">

      {/* Filters */}
      <Card className="shadow-sm border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Search - always visible */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                {getThemedIcon('ui', 'search', 16, '#9ca3af')}
              </div>
              <Input
                placeholder={t('workflow.inbox.searchPlaceholder', 'Search documents...')}
                value={filters.search || ''}
                onChange={(e) => updateFilters({ search: e.target.value })}
                className="pl-10"
              />
            </div>

            {/* Status Filter - badge toggles */}
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { value: 'DRAFT', label: 'Draft', color: '#6b7280', icon: 'file_text' },
                { value: 'SUBMITTED', label: 'Submitted', color: '#3b82f6', icon: 'send' },
                { value: 'UNDER_REVIEW', label: 'HR Review', color: '#3b82f6', icon: 'alert_triangle' },
                { value: 'UNDER_ADMIN_REVIEW', label: 'Admin Review', color: '#8b5cf6', icon: 'alert_triangle' },
                { value: 'APPROVED', label: 'Approved', color: '#10b981', icon: 'check_circle' },
                { value: 'REJECTED', label: 'Rejected', color: '#ef4444', icon: 'x_circle' }
              ].map((status) => {
                const isSelected = filters.status === status.value;
                return (
                  <button
                    key={status.value}
                    onClick={() => updateFilters({ status: isSelected ? '' : status.value })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={{
                      backgroundColor: isSelected ? status.color : 'transparent',
                      color: isSelected ? 'white' : status.color,
                      border: `1px solid ${isSelected ? status.color : status.color}20`
                    }}
                  >
                    {getThemedIcon('ui', status.icon, 14, isSelected ? 'white' : status.color)}
                    {status.label}
                  </button>
                );
              })}
            </div>

            {/* Assignment Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { value: 'assigned_to_me', label: 'Me', color: '#8b5cf6', icon: 'user' },
                { value: 'assigned_to_my_role', label: 'My Role', color: '#8b5cf6', icon: 'users' },
                { value: 'i_own', label: 'I Own', color: '#10b981', icon: 'user_check' }
              ].map((assignment) => {
                const isSelected = filters.assignment === assignment.value;
                return (
                  <button
                    key={assignment.value}
                    onClick={() => updateFilters({ assignment: isSelected ? '' : assignment.value })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={{
                      backgroundColor: isSelected ? assignment.color : 'transparent',
                      color: isSelected ? 'white' : assignment.color,
                      border: `1px solid ${isSelected ? assignment.color : assignment.color}20`
                    }}
                  >
                    {getThemedIcon('ui', assignment.icon, 14, isSelected ? 'white' : assignment.color)}
                    {assignment.label}
                  </button>
                );
              })}
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
                    workflowType: '',
                    assignment: ''
                  });
                }}
                title={t('workflow.inbox.clearFilters', 'Clear filters')}
              >
                {getThemedIcon('ui', 'x', 16, theme)}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={refresh}
                disabled={loading}
                title={t('workflow.inbox.refresh', 'Refresh')}
              >
                {getThemedIcon('ui', 'refresh_cw', 16, theme)}
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
              icon={getThemedIcon('ui', 'check_circle', 64, '#d1d5db')}
              title={t('workflow.inbox.emptyTitle', 'No workflow items found')}
              description={t('workflow.inbox.emptyDescription', 'Adjust your filters to see existing items.')}
            />
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
};

export default WorkflowInboxPage;
