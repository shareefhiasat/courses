/**
 * Workflow Inbox Page
 * 
 * PURPOSE: Display user's workflow inbox items with filtering and actions
 * ARCHITECTURE: Page Component → Hook → Service → API
 */

import React, { useMemo, useCallback, useEffect, useState } from 'react';
import Joyride from 'react-joyride';
import TourTooltip from '@ui/TourTooltip/TourTooltip';
import ColoredTooltip from '@components/ui/mui/ColoredTooltip';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from "date-fns";
import { getSlaInfo } from '@utils/sla.js';
import { getStatusVariant as getActionVariant, getStatusColorClasses, getWorkflowStatusIcon } from '@constants/workflowStatusTypes';
import { getThemedIcon, getUserRoleIcon, getUserRoleColor } from '@constants/iconTypes';
import { getLocalizedUserName } from '@utils/localizedUserName';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import useNotifications from '@hooks/useNotifications';
import useWorkflowInbox from "@hooks/useWorkflowInbox";
import { useAuditGridColumns } from '@hooks/useAuditGridColumns.js';
import { Button, useToast, GridQuickFilterChips } from '@ui';
import { Card, CardContent, CardHeader, CardTitle, Badge, Input, SimpleLoading, EmptyState, AdvancedDataGrid } from '@ui';
import { getCategoryFilterChips, getWorkflowDisplayLabel, WORKFLOW_CATEGORY_OPTIONS, CATEGORY_BY_VALUE } from '@constants/workflowConfig';
import WorkflowContextBar from '@components/workflow/WorkflowContextBar';
import { useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { AlertCircle, Trash2 } from 'lucide-react';
import { deleteWorkflowDocument } from '@services/business/workflowService';
import { useProgramSubjectMaps } from '@hooks/useProgramSubjectMaps';
import { useAuth } from '@contexts/AuthContext';

const WorkflowInboxPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const [selectedDocument, setSelectedDocument] = useState(null);

  // ── Guided Tour ──────────────────────────────────────────────────────────
  const [runTour, setRunTour] = useState(false);
  const tourSeenKey = `workflowInboxTourSeen_${lang}`;
  const tourSteps = useMemo(() => [
    { target: '[data-tour="workflow-filters"]', content: t('tour.workflow_filters'), disableBeacon: true, placement: 'bottom' },
    { target: '[data-tour="workflow-status-filters"]', content: t('tour.workflow_tabs'), disableBeacon: true, placement: 'bottom' },
    { target: '[data-tour="workflow-grid"]', content: t('tour.workflow_task_list'), disableBeacon: true, placement: 'top' },
    { target: '[data-tour="workflow-grid"]', content: t('tour.workflow_status'), disableBeacon: true, placement: 'top' },
    { target: '[data-tour="workflow-grid"]', content: t('tour.workflow_approve'), disableBeacon: true, placement: 'top' },
    { target: '[data-tour="workflow-grid"]', content: t('tour.workflow_priority'), disableBeacon: true, placement: 'top' },
  ], [lang, t]);
  useEffect(() => {
    const start = () => setRunTour(true);
    window.addEventListener('app:joyride', start);
    window.addEventListener('app:help', start);
    return () => { window.removeEventListener('app:joyride', start); window.removeEventListener('app:help', start); };
  }, []);
  useEffect(() => { try { if (!localStorage.getItem(tourSeenKey)) setRunTour(true); } catch {} }, [tourSeenKey]);
  const handleTourCallback = useCallback((data) => {
    const { status, action } = data || {};
    if (status === 'finished' || status === 'skipped' || action === 'close') { setRunTour(false); try { localStorage.setItem(tourSeenKey, 'true'); } catch {} }
  }, [tourSeenKey]);
  const TourTooltipComponent = useMemo(() => TourTooltip({ tourSeenKey }), [tourSeenKey]);
  // ── Program/Subject name lookups ─────────────────────────────────────────
  const { programMap, subjectMap } = useProgramSubjectMaps();

  // ──────────────────────────────────────────────────────────────────────────
  const { triggerNotification } = useNotifications();
  const toast = useToast();
  const { startLoading } = useGlobalLoading();
  const { user, isStudent } = useAuth();

  // Deny students access to workflow inbox
  if (isStudent) {
    return (
      <div className="dashboard-page">
        <div className="access-denied">
          <h2>{t('access_denied')}</h2>
          <p>{t('insufficient_privileges')}</p>
        </div>
      </div>
    );
  }

  // Check if user is super admin
  const isSuperAdmin = user?.roleAssignments?.some(ra => 
    ra.role?.code?.toLowerCase().includes('super_admin') || 
    ra.role?.code?.toLowerCase().includes('superadmin')
  );

  // Handle nuclear delete
  const handleNuclearDelete = async (documentId) => {
    if (!isSuperAdmin) {
      toast.error('Only Super Admin can perform nuclear delete');
      return;
    }

    if (!window.confirm('⚠️ NUCLEAR DELETE WARNING ⚠️\n\nThis will PERMANENTLY delete this workflow document and ALL associated data (comments, history, files).\n\nThis action CANNOT be undone.\n\nAre you absolutely sure you want to proceed?')) {
      return;
    }

    if (!window.confirm('FINAL CONFIRMATION\n\nType "DELETE" to confirm this nuclear delete action.')) {
      return;
    }

    try {
      startLoading();
      const result = await deleteWorkflowDocument(documentId);
      if (result.success) {
        toast.success('Document nuked successfully');
        refresh();
      } else {
        toast.error(result.error || 'Failed to delete document');
      }
    } catch (error) {
      console.error('Nuclear delete error:', error);
      toast.error('Failed to delete document');
    } finally {
      startLoading(false);
    }
  };

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

  const documentIdFilter = searchParams.get('documentId');

  useEffect(() => {
    if (!documentIdFilter || documents.length === 0) return;
    const match = documents.find((d) => String(d.id) === String(documentIdFilter));
    if (match) setSelectedDocument(match);
  }, [documentIdFilter, documents]);

  const displayDocuments = useMemo(() => {
    if (!documentIdFilter) return documents;
    return documents.filter((d) => String(d.id) === String(documentIdFilter));
  }, [documents, documentIdFilter]);

  const handleRowClick = useCallback((params) => {
    setSelectedDocument(params.row);
  }, []);

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
      case 'UNDER_HR_REVIEW':
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

  const categoryFilterChips = useMemo(() => getCategoryFilterChips(t), [t]);
  const activeCategoryId = filters.workflowCategory || 'all';

  const handleCategoryChipChange = useCallback((chipId) => {
    if (chipId === 'all') {
      updateFilters({ workflowCategory: '', attendanceSubtype: '' });
      return;
    }
    updateFilters({ workflowCategory: chipId, attendanceSubtype: '' });
  }, [updateFilters]);

  const receivedColumn = useAuditGridColumns({
    includeCreator: false,
    includeUpdater: false,
    includeUpdatedAt: false,
    columnOverrides: {
      createdAt: {
        headerName: t('workflow.inbox.received', 'Received'),
        width: 120,
      },
    },
  });

  // Grid columns - Updated for WorkflowDocument model
  const columns = useMemo(() => [
    {
      field: 'id',
      headerName: 'ID',
      width: 80,
      renderCell: (params) => {
        return (
          <div className="text-base font-bold text-black">
            {params.value}
          </div>
        );
      }
    },
    {
      field: 'workflowCategory',
      headerName: t('workflow.inbox.category', 'Category'),
      flex: 1,
      minWidth: 120,
      renderCell: (params) => {
        const category = params.row.workflowCategory || 'GENERAL';
        const catConfig = CATEGORY_BY_VALUE[category];
        const variant = catConfig?.variant || 'slate';
        const isDark = theme === 'dark';
        const textColorMap = {
          slate: isDark ? '#f3f4f6' : '#1f2937',
          blue: isDark ? '#93c5fd' : '#0369a1',
          red: isDark ? '#fca5a5' : '#991b1b',
          amber: isDark ? '#fcd34d' : '#92400e',
          purple: isDark ? '#d8b4fe' : '#6b21a8',
        };
        const color = textColorMap[variant] || textColorMap.slate;
        return (
          <span style={{ color, fontWeight: 600, fontSize: 'var(--font-size-sm)', whiteSpace: 'nowrap' }}>
            {getWorkflowDisplayLabel(params.row, t)}
          </span>
        );
      },
    },
    {
      field: 'targetStudent',
      headerName: t('workflow.inbox.targetStudent'),
      flex: 1,
      minWidth: 100,
      renderCell: (params) => {
        const student = params.row.targetStudent;
        if (!student) return <span className="text-sm text-gray-400">—</span>;
        const displayName = getLocalizedUserName(student, lang, '-');
        return (
          <div className="flex items-center gap-2">
            {React.cloneElement(getUserRoleIcon('student'), { color: getUserRoleColor('student'), size: 16 })}
            <span className="text-sm" style={{ color: getUserRoleColor('student') }}>
              {displayName}
            </span>
          </div>
        );
      }
    },
    {
      field: 'program',
      headerName: t('workflow.inbox.program', 'Program'),
      flex: 0.8,
      minWidth: 100,
      renderCell: (params) => {
        const code = params.row.program;
        if (!code) return <span className="text-sm text-gray-400">—</span>;
        const prog = programMap[code];
        const name = prog ? (lang === 'ar' ? (prog.nameAr || prog.nameEn) : prog.nameEn) : code;
        return <span className="text-sm" style={{ color: theme === 'dark' ? '#d1d5db' : '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>;
      }
    },
    {
      field: 'subject',
      headerName: t('workflow.inbox.subject', 'Subject'),
      flex: 0.8,
      minWidth: 100,
      renderCell: (params) => {
        const code = params.row.subject;
        if (!code) return <span className="text-sm text-gray-400">—</span>;
        const subj = subjectMap[code];
        const name = subj ? (lang === 'ar' ? (subj.nameAr || subj.nameEn) : subj.nameEn) : code;
        return <span className="text-sm" style={{ color: theme === 'dark' ? '#d1d5db' : '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>;
      }
    },
    {
      field: 'class',
      headerName: t('workflow.inbox.class', 'Class'),
      flex: 0.8,
      minWidth: 100,
      renderCell: (params) => {
        const cls = params.row.class;
        if (!cls) return <span className="text-sm text-gray-400">—</span>;
        const name = lang === 'ar' ? (cls.nameAr || cls.nameEn || cls.code) : (cls.nameEn || cls.nameAr || cls.code);
        return <span className="text-sm" style={{ color: theme === 'dark' ? '#d1d5db' : '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>;
      }
    },
    {
      field: 'workflowDate',
      headerName: t('workflow.inbox.date', 'Date'),
      flex: 0.8,
      minWidth: 110,
      renderCell: (params) => {
        const row = params.row;
        let dateStr = null;
        if (row.date) dateStr = format(new Date(row.date), 'dd/MM/yyyy');
        else if (row.dateFrom && row.dateTo) dateStr = `${format(new Date(row.dateFrom), 'dd/MM/yyyy')} - ${format(new Date(row.dateTo), 'dd/MM/yyyy')}`;
        else if (row.dateFrom) dateStr = format(new Date(row.dateFrom), 'dd/MM/yyyy');
        if (!dateStr) return <span className="text-sm text-gray-400">—</span>;
        return <span className="text-sm" style={{ color: theme === 'dark' ? '#d1d5db' : '#374151', whiteSpace: 'nowrap' }}>{dateStr}</span>;
      }
    },
    {
      field: 'title',
      headerName: t('workflow.inbox.workflowTitle', 'Workflow Title'),
      flex: 1,
      minWidth: 120,
      renderCell: (params) => {
        return (
          <div className="font-medium text-gray-900">
            {params.row.title}
          </div>
        );
      }
    },
    {
      field: 'originalFileName',
      headerName: t('workflow.inbox.document', 'Document'),
      flex: 1,
      minWidth: 120,
      renderCell: (params) => {
        const mimeType = params.row.file?.mimeType;
        const icon = getThemedIcon('ui', getFileIconName(mimeType), 14, theme);
        const originalFileName = params.row.file?.name || params.row.file?.originalName || '-';
        
        return (
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0 flex items-center">
              {icon}
            </div>
            <div className="font-medium text-gray-900 truncate" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {originalFileName}
            </div>
          </div>
        );
      }
    },
    {
      field: 'description',
      headerName: t('workflow.inbox.description', 'Description'),
      flex: 1,
      minWidth: 100,
      renderCell: (params) => {
        return (
          <div className="text-sm text-black truncate" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {params.row.description || '-'}
          </div>
        );
      }
    },
    {
      field: 'status',
      headerName: t('workflow.inbox.status', 'Status'),
      flex: 1,
      minWidth: 100,
      renderCell: (params) => {
        const statusUpper = params.value?.toUpperCase();
        let iconColor = '#6b7280';
        let statusText = params.value;
        
        switch (statusUpper) {
          case 'DRAFT':
            iconColor = '#6b7280';
            statusText = t('workflow.inbox.statusDraft', 'Draft');
            break;
          case 'SUBMITTED':
            iconColor = '#3b82f6';
            statusText = t('workflow.inbox.statusSubmitted', 'Submitted');
            break;
          case 'UNDER_HR_REVIEW':
            iconColor = '#3b82f6';
            statusText = t('workflow.inbox.statusUnderHrReview', 'HR Review');
            break;
          case 'UNDER_REVIEW':
            iconColor = '#3b82f6';
            statusText = t('workflow.inbox.statusUnderHrReview', 'HR Review');
            break;
          case 'UNDER_ADMIN_REVIEW':
            iconColor = '#8b5cf6';
            statusText = t('workflow.inbox.statusUnderAdminReview', 'Admin Review');
            break;
          case 'APPROVED':
            iconColor = '#10b981';
            statusText = t('workflow.inbox.statusCompleted', 'Completed');
            break;
          case 'REJECTED':
            iconColor = '#ef4444';
            statusText = t('workflow.inbox.statusRejected', 'Rejected');
            break;
          default:
            iconColor = '#6b7280';
        }
        
        const StatusIcon = getWorkflowStatusIcon(params.value);
        
        return (
          <div className="flex items-center gap-2">
            <StatusIcon className="h-4 w-4" style={{ color: iconColor }} />
            <span className="text-sm" style={{ color: iconColor }}>
              {statusText}
            </span>
          </div>
        );
      }
    },
    {
      field: 'nextStatus',
      headerName: t('workflow.inbox.nextStatus', 'Next Status'),
      flex: 1,
      minWidth: 100,
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
            nextStatus = t('workflow.inbox.nextStatusUnderHrReview', 'HR Review');
            NextStatusIcon = getWorkflowStatusIcon('UNDER_HR_REVIEW');
            iconColor = '#3b82f6';
            break;
          case 'UNDER_HR_REVIEW':
            nextStatus = t('workflow.inbox.nextStatusAdminReview', 'Admin Review');
            NextStatusIcon = getWorkflowStatusIcon('UNDER_ADMIN_REVIEW');
            iconColor = '#8b5cf6';
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
      flex: 1,
      minWidth: 100,
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
        
        const displayName = getLocalizedUserName(submitter, lang, t('workflow.inbox.unknown', 'Unknown'));
        
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
        const roleColor = roleType ? getUserRoleColor(roleType) : theme;
        
        return (
          <div className="flex items-center gap-2">
            {roleType ? (
              React.cloneElement(getUserRoleIcon(roleType), { 
                color: roleColor, 
                size: 16 
              })
            ) : (
              getThemedIcon('ui', 'user', 16, theme)
            )}
            <span className="text-sm" style={{ color: roleColor }}>
              {displayName}
            </span>
          </div>
        );
      }
    },
    {
      field: 'currentAssignee',
      headerName: t('workflow.inbox.assignedTo', 'Assigned To'),
      flex: 1,
      minWidth: 100,
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
        
        // If no assignee, show role or shared users from metadata
        if (!assignee) {
          const shareUsers = params.row.shareTargetUsers || [];
          if (shareUsers.length > 0) {
            const names = shareUsers.map((u) => getLocalizedUserName(u, lang, t('workflow.inbox.unknown', 'Unknown'))).join(', ');
            return (
              <div className="flex items-center gap-2">
                {getThemedIcon('ui', 'users', 16, theme)}
                <span className="text-sm" style={{ color: theme === 'dark' ? '#d1d5db' : '#374151' }}>
                  {names}
                </span>
              </div>
            );
          }

          const category = params.row.workflowCategory || 'GENERAL';
          const subtype = params.row.attendanceSubtype;
          let roleLabel = t('workflow.inbox.unassigned', 'Unassigned');
          let roleIcon = getThemedIcon('ui', 'user', 16, theme);
          let roleColor = theme;

          if (category === 'ATTENDANCE' && subtype === 'WEEKLY_SUMMARY') {
            roleLabel = t('roles.admin', 'Admin');
            roleColor = getUserRoleColor('admin');
            roleIcon = React.cloneElement(getUserRoleIcon('admin'), { color: roleColor, size: 16 });
          } else if (category === 'DISCONTINUATION') {
            roleLabel = t('roles.admin', 'Admin');
            roleColor = getUserRoleColor('admin');
            roleIcon = React.cloneElement(getUserRoleIcon('admin'), { color: roleColor, size: 16 });
          } else {
            roleLabel = t('roles.hr', 'HR');
            roleColor = getUserRoleColor('hr');
            roleIcon = React.cloneElement(getUserRoleIcon('hr'), { color: roleColor, size: 16 });
          }
          
          return (
            <div className="flex items-center gap-2">
              {roleIcon}
              <span className="text-sm" style={{ color: roleColor }}>
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
        const roleColor = roleType ? getUserRoleColor(roleType) : theme;
        const displayName = getLocalizedUserName(assignee, lang, t('workflow.inbox.unknown', 'Unknown'));
        
        console.log('[WorkflowInbox] Final display:', {
          roleType,
          displayName,
          primaryRoleCode: primaryRole?.code
        });
        
        return (
          <div className="flex items-center gap-2">
            {roleType ? (
              React.cloneElement(getUserRoleIcon(roleType), { 
                color: roleColor, 
                size: 16 
              })
            ) : (
              getThemedIcon('ui', 'user', 16, theme)
            )}
            <span className="text-sm" style={{ color: roleColor }}>
              {displayName}
            </span>
          </div>
        );
      }
    },
    ...receivedColumn,
    {
      field: 'sla',
      headerName: t('workflow.inbox.sla', 'SLA'),
      flex: 1,
      minWidth: 80,
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
      flex: 1,
      minWidth: 80,
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
          {isSuperAdmin && (
            <ColoredTooltip title="Nuclear Delete">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleNuclearDelete(params.row.id)}
                className="h-8 px-3"
              >
                <Trash2 size={16} />
              </Button>
            </ColoredTooltip>
          )}
        </div>
      )
    }
  ], [t, navigate, receivedColumn, programMap, subjectMap, lang, theme]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle page change
  const handlePageChange = (newPage) => {
    updatePagination({ page: newPage });
  };

  const statusFilterOptions = useMemo(() => [
    { value: 'DRAFT', label: t('workflow.inbox.statusDraft'), color: '#6b7280', icon: 'file_text' },
    { value: 'SUBMITTED', label: t('workflow.inbox.statusSubmitted'), color: '#3b82f6', icon: 'send' },
    { value: 'UNDER_HR_REVIEW', label: t('workflow.inbox.statusUnderHrReview'), color: '#3b82f6', icon: 'alert_triangle' },
    { value: 'UNDER_ADMIN_REVIEW', label: t('workflow.inbox.statusUnderAdminReview'), color: '#8b5cf6', icon: 'alert_triangle' },
    { value: 'APPROVED', label: t('workflow.inbox.statusCompleted'), color: '#10b981', icon: 'check_circle' },
    { value: 'REJECTED', label: t('workflow.inbox.statusRejected'), color: '#ef4444', icon: 'x_circle' },
  ], [t]);

  const assignmentFilterOptions = useMemo(() => [
    { value: 'assigned_to_me', label: t('workflow.inbox.filterAssignedToMe'), color: '#8b5cf6', icon: 'user' },
    { value: 'assigned_to_my_role', label: t('workflow.inbox.filterMyRole'), color: '#8b5cf6', icon: 'users' },
    { value: 'i_own', label: t('workflow.inbox.filterIOwn'), color: '#10b981', icon: 'user_check' },
  ], [t]);

  if (loading && documents.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <SimpleLoading />
      </div>
    );
  }

  return (
    <div className="flex justify-center px-4 sm:px-6 lg:px-8 py-6">
      <Joyride continuous run={runTour} steps={tourSteps} callback={handleTourCallback} scrollOffset={100} scrollToFirstStep showSkipButton showProgress tooltipComponent={TourTooltipComponent}
        locale={{ back: t('tour_back'), close: t('tour_close'), last: t('tour_finish'), next: t('tour_next'), skip: t('tour_skip') }}
        styles={{ options: { primaryColor: 'var(--color-primary,#800020)', textColor: theme === 'dark' ? '#e5e7eb' : '#111', backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', zIndex: 10000 } }}
      />
      <div className="max-w-[1600px] w-full space-y-6">

      {/* Filters */}
      <Card className="shadow-sm border-gray-200">
        <CardContent className="p-4">
          <div data-tour="workflow-filters" className="flex items-center gap-4 flex-wrap">
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

            <GridQuickFilterChips
              chips={categoryFilterChips}
              activeId={activeCategoryId}
              onChange={handleCategoryChipChange}
              style={{ marginBottom: 0 }}
            />

            {/* Status Filter - badge toggles */}
            <div data-tour="workflow-status-filters" className="flex items-center gap-1.5 flex-wrap">
              {statusFilterOptions.map((status) => {
                const isSelected = filters.status === status.value;
                return (
                  <button
                    key={status.value}
                    onClick={() => updateFilters({ status: isSelected ? '' : status.value })}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                    style={{
                      backgroundColor: isSelected ? status.color : 'transparent',
                      color: isSelected ? 'white' : status.color,
                      border: `1px solid ${status.color}20`
                    }}
                  >
                    {getThemedIcon('ui', status.icon, 12, isSelected ? 'white' : status.color)}
                    {status.label}
                  </button>
                );
              })}
            </div>

            {/* Assignment Filter */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {assignmentFilterOptions.map((assignment) => {
                const isSelected = filters.assignment === assignment.value;
                return (
                  <button
                    key={assignment.value}
                    onClick={() => updateFilters({ assignment: isSelected ? '' : assignment.value })}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                    style={{
                      backgroundColor: isSelected ? assignment.color : 'transparent',
                      color: isSelected ? 'white' : assignment.color,
                      border: `1px solid ${assignment.color}20`
                    }}
                  >
                    {getThemedIcon('ui', assignment.icon, 12, isSelected ? 'white' : assignment.color)}
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
                    workflowCategory: '',
                    attendanceSubtype: '',
                    assignment: ''
                  });
                }}
              >
                {getThemedIcon('ui', 'x', 16, theme)}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={refresh}
                disabled={loading}
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

      {/* Selected workflow header */}
      {selectedDocument && (
        <WorkflowContextBar
          document={selectedDocument}
          programMap={programMap}
          subjectMap={subjectMap}
        />
      )}

      {/* Data Grid */}
      {displayDocuments.length > 0 ? (
        <Card data-tour="workflow-grid" className="shadow-sm border-gray-200">
          <CardContent className="p-0">
            <AdvancedDataGrid
              rows={displayDocuments}
              columns={columns}
              pagination={pagination}
              onPageChange={handlePageChange}
              loading={loading}
              getRowId={(row) => row.id}
              onRowClick={handleRowClick}
              className="border-none"
              pageSizeOptions={[10, 25, 50, 100]}
              pageSize={50}
              sx={{
                '& .MuiDataGrid-cell': {
                  display: 'flex',
                  alignItems: 'center',
                },
                '& .MuiDataGrid-cell > div, & .MuiDataGrid-cell > span': {
                  display: 'flex',
                  alignItems: 'center',
                },
              }}
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
