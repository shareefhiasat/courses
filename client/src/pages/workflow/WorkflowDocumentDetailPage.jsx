/**
 * Workflow Document Detail Page
 * 
 * PURPOSE: Display WorkflowDocument details with file download, version history, and comments
 * ARCHITECTURE: Page Component → Hook → Service → API
 * NOTE: This is for WorkflowDocument system (Epic 1), not the existing Workflow system
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '@services/api/apiService';
import { formatQatarDate } from '@utils/timezone';
import { getSlaInfo } from '@utils/sla.js';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { Button, useToast } from '@ui';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@ui';
import { SimpleLoading, EmptyState, Modal, Textarea } from '@ui';
import { approveWorkflowDocument, rejectWorkflowDocument, returnWorkflowDocument, resubmitWorkflowDocument, uploadSignedDocument, withdrawWorkflowDocument, listFileVersions, downloadFileVersion } from '@services/api/workflow-documents-api.js';
import WorkflowDiagram from '@components/workflow/WorkflowDiagram.jsx';
import WorkflowAttachments from '@components/workflow/WorkflowAttachments.jsx';
import WorkflowHistory from '@components/workflow/WorkflowHistory.jsx';
import WorkflowCommentsTab from '@components/workflow/WorkflowCommentsTab.jsx';
import CollapsibleDashboardSection from '@components/ui/CollapsibleDashboardSection/CollapsibleDashboardSection.jsx';
import FileDetailsModal from '@components/smart-drive/FileDetailsModal.jsx';
import { getThemedIcon } from '@constants/iconTypes';

const WorkflowDocumentDetailPage = () => {
  const { t } = useLang();
  const { documentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionModal, setActionModal] = useState(null); // 'approve', 'reject', 'return', 'resubmit', 'upload-signed', 'withdraw'
  const [comment, setComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [resubmitFile, setResubmitFile] = useState(null);
  const [signedFile, setSignedFile] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [versions, setVersions] = useState(null);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [selectedStep, setSelectedStep] = useState(null);
  const [stepDetailsModal, setStepDetailsModal] = useState(false);

  // Polling for real-time status updates
  useEffect(() => {
    const pollInterval = 30000; // 30 seconds

    const pollStatus = async () => {
      if (!document || document.status === 'APPROVED' || document.status === 'REJECTED') {
        return; // Don't poll for terminal states
      }

      try {
        const response = await fetch(`/api/v1/workflow-documents/${documentId}`, {
          headers: {
            'Authorization': `Bearer ${window.keycloak?.token}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data.status !== document.status) {
            // Status changed, update document
            setDocument(data.data);
            toast.info(t('workflow.document.statusUpdated', 'Document status has been updated'));
          }
        }
      } catch (err) {
        console.error('Error polling status:', err);
      }
    };

    const intervalId = setInterval(pollStatus, pollInterval);

    return () => clearInterval(intervalId);
  }, [document, documentId, t, toast]);

  // Handle workflow diagram node click
  const handleNodeClick = (node) => {
    setSelectedStep(node);
    setStepDetailsModal(true);
  };

  // Fetch document details
  const fetchDocument = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.get(`/workflow-documents/${documentId}`);

      if (response.success) {
        setDocument(response.data);
      } else {
        setError(response.error || 'Failed to fetch document');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  // Load document on mount
  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  // Fetch file versions
  const fetchVersions = useCallback(async () => {
    if (!document?.fileId) return;
    
    try {
      setVersionsLoading(true);
      const response = await listFileVersions(document.fileId);
      
      if (response.success) {
        setVersions(response.data.versions);
      } else {
        toast.error(response.error || 'Failed to fetch versions');
      }
    } catch (err) {
      toast.error('Failed to fetch versions');
    } finally {
      setVersionsLoading(false);
    }
  }, [document?.fileId, toast]);

  // Handle version history toggle
  const handleToggleVersionHistory = () => {
    if (!showVersionHistory && !versions) {
      fetchVersions();
    }
    setShowVersionHistory(!showVersionHistory);
  };

  // Handle version download
  const handleDownloadVersion = async (versionId, fileName) => {
    try {
      const response = await downloadFileVersion(document.fileId, versionId);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Version downloaded successfully');
    } catch (err) {
      toast.error('Failed to download version');
    }
  };

  // Status badge variants
  const getStatusVariant = (status) => {
    switch (status) {
      case 'DRAFT':
        return 'secondary';
      case 'SUBMITTED':
        return 'warning';
      case 'UNDER_REVIEW':
        return 'info';
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'destructive';
      case 'AMENDED':
        return 'warning';
      case 'CLOSED':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  // Handle file download
  const handleDownload = async (fileId, fileName) => {
    try {
      const response = await fetch(`/api/v1/files/${fileId}/download`, {
        headers: {
          'Authorization': `Bearer ${window.keycloak?.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'document';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(t('workflow.document.downloadSuccess', 'File downloaded successfully'));
    } catch (err) {
      toast.error(t('workflow.document.downloadError', 'Failed to download file'));
    }
  };

  // Handle preview
  const handlePreview = (file) => {
    setPreviewFile(file);
  };

  // Check if user can perform review actions
  const canReview = () => {
    if (!document || !user) return false;
    const userRoles = user.roles || [];
    const isHR = userRoles.includes('hr');
    const isAdmin = userRoles.includes('admin');
    const isSuperAdmin = userRoles.includes('super_admin');
    const isSubmitter = document.submitterId === user.id;
    const isCurrentAssignee = document.currentAssigneeId === user.id;
    
    // Super Admin can review any document
    if (isSuperAdmin) return true;
    
    // HR or Admin can review if they are the current assignee
    return (isHR || isAdmin) && isCurrentAssignee && !isSubmitter;
  };

  // Check if user can reject (only owner or super admin)
  const canReject = () => {
    if (!document || !user) return false;
    const userRoles = user.roles || [];
    const isSuperAdmin = userRoles.includes('super_admin');
    const isOwner = document.submitterId === user.id;
    
    // Super Admin can reject any document
    if (isSuperAdmin) return true;
    
    // Only owner can reject
    return isOwner;
  };

  // Check if document is in reviewable status
  const isReviewable = () => {
    if (!document) return false;
    return document.status === 'SUBMITTED' || document.status === 'UNDER_REVIEW';
  };

  // Handle approve action
  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const result = await approveWorkflowDocument(documentId, { comment });
      if (result.success) {
        toast.success(t('workflow.document.approved', 'Document approved successfully'));
        setActionModal(null);
        setComment('');
        fetchDocument(); // Refresh document data
      } else {
        toast.error(result.error || t('workflow.document.approveError', 'Failed to approve document'));
      }
    } catch (err) {
      toast.error(t('workflow.document.approveError', 'Failed to approve document'));
    } finally {
      setActionLoading(false);
    }
  };

  // Handle reject action
  const handleReject = async () => {
    if (!comment.trim()) {
      toast.error(t('workflow.document.commentRequired', 'Comment is required for rejection'));
      return;
    }
    setActionLoading(true);
    try {
      const result = await rejectWorkflowDocument(documentId, { comment });
      if (result.success) {
        toast.success(t('workflow.document.rejected', 'Document rejected successfully'));
        setActionModal(null);
        setComment('');
        fetchDocument(); // Refresh document data
      } else {
        toast.error(result.error || t('workflow.document.rejectError', 'Failed to reject document'));
      }
    } catch (err) {
      toast.error(t('workflow.document.rejectError', 'Failed to reject document'));
    } finally {
      setActionLoading(false);
    }
  };

  // Handle return action
  const handleReturn = async () => {
    if (!comment.trim()) {
      toast.error(t('workflow.document.commentRequired', 'Comment is required for return'));
      return;
    }
    setActionLoading(true);
    try {
      const result = await returnWorkflowDocument(documentId, { comment });
      if (result.success) {
        toast.success(t('workflow.document.returned', 'Document returned successfully'));
        setActionModal(null);
        setComment('');
        fetchDocument(); // Refresh document data
      } else {
        toast.error(result.error || t('workflow.document.returnError', 'Failed to return document'));
      }
    } catch (err) {
      toast.error(t('workflow.document.returnError', 'Failed to return document'));
    } finally {
      setActionLoading(false);
    }
  };

  // Handle resubmit action
  const handleResubmit = async () => {
    if (!resubmitFile) {
      toast.error(t('workflow.document.fileRequired', 'File is required for resubmission'));
      return;
    }
    setActionLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const fileData = e.target.result.split(',')[1]; // Get base64 data
        const result = await resubmitWorkflowDocument(documentId, {
          fileData,
          fileName: resubmitFile.name,
          fileType: resubmitFile.type,
          comment
        });
        if (result.success) {
          toast.success(t('workflow.document.resubmitted', 'Document resubmitted successfully'));
          setActionModal(null);
          setComment('');
          setResubmitFile(null);
          fetchDocument(); // Refresh document data
        } else {
          toast.error(result.error || t('workflow.document.resubmitError', 'Failed to resubmit document'));
        }
        setActionLoading(false);
      };
      reader.onerror = () => {
        toast.error(t('workflow.document.fileReadError', 'Failed to read file'));
        setActionLoading(false);
      };
      reader.readAsDataURL(resubmitFile);
    } catch (err) {
      toast.error(t('workflow.document.resubmitError', 'Failed to resubmit document'));
      setActionLoading(false);
    }
  };

  // Check if user can resubmit
  const canResubmit = () => {
    if (!document || !user) return false;
    const isSubmitter = document.submitterId === user.id;
    const isRejected = document.status === 'REJECTED';
    return isSubmitter && isRejected;
  };

  // Check if user can upload signed document (Admin only for weekly summaries)
  const canUploadSigned = () => {
    if (!document || !user) return false;
    const isAdmin = user.roles && user.roles.includes('admin');
    const isWeeklySummary = document.workflowType === 'ATTENDANCE_WEEKLY';
    const isUnderAdminReview = document.status === 'SUBMITTED' || document.status === 'UNDER_ADMIN_REVIEW';
    return isAdmin && isWeeklySummary && isUnderAdminReview;
  };

  // Check if user can withdraw document (only submitter, only SUBMITTED status)
  const canWithdraw = () => {
    if (!document || !user) return false;
    const isSubmitter = document.submitterId === user.id;
    const isSubmitted = document.status === 'SUBMITTED';
    return isSubmitter && isSubmitted;
  };

  // Handle signed document upload
  const handleUploadSigned = async () => {
    if (!signedFile) {
      toast.error(t('workflow.document.fileRequired', 'File is required for upload'));
      return;
    }
    setActionLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const fileData = e.target.result.split(',')[1]; // Get base64 data
        const result = await uploadSignedDocument(documentId, {
          fileData,
          fileName: signedFile.name,
          fileType: signedFile.type,
          comment
        });
        if (result.success) {
          toast.success(t('workflow.document.signedUploaded', 'Signed document uploaded successfully'));
          setActionModal(null);
          setComment('');
          setSignedFile(null);
          fetchDocument(); // Refresh document data
        } else {
          toast.error(result.error || t('workflow.document.uploadError', 'Failed to upload signed document'));
        }
        setActionLoading(false);
      };
      reader.onerror = () => {
        toast.error(t('workflow.document.fileReadError', 'Failed to read file'));
        setActionLoading(false);
      };
      reader.readAsDataURL(signedFile);
    } catch (err) {
      toast.error(t('workflow.document.uploadError', 'Failed to upload signed document'));
      setActionLoading(false);
    }
  };

  // Handle document withdrawal
  const handleWithdraw = async () => {
    setActionLoading(true);
    try {
      const result = await withdrawWorkflowDocument(documentId, { comment });
      if (result.success) {
        toast.success(t('workflow.document.withdrawn', 'Document withdrawn successfully'));
        setActionModal(null);
        setComment('');
        fetchDocument(); // Refresh document data
      } else {
        toast.error(result.error || t('workflow.document.withdrawError', 'Failed to withdraw document'));
      }
    } catch (err) {
      toast.error(t('workflow.document.withdrawError', 'Failed to withdraw document'));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <SimpleLoading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800">
              {getThemedIcon('ui', 'alert_circle', 20)}
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-12 text-center">
            <EmptyState
              icon={getThemedIcon('ui', 'file_text', 64)}
              title={t('workflow.document.notFound', 'Document not found')}
              description={t('workflow.document.notFoundDesc', 'The requested document could not be found.')}
              action={
                <Button
                  onClick={() => navigate('/workflow/inbox')}
                  className="mt-4"
                >
                  {getThemedIcon('ui', 'arrow_left', 16)}
                  {t('workflow.document.backToInbox', 'Back to Inbox')}
                </Button>
              }
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center px-4 py-6">
      <div className="w-full space-y-8" style={{ maxWidth: '1400px' }}>
      {/* Workflow Progress - Full Width */}
      <CollapsibleDashboardSection
        title={t('workflow.document.workflowProgress', 'Workflow Progress')}
        icon={getThemedIcon('ui', 'workflow', 20)}
        sectionId="workflow-diagram"
        color="#6366f1"
        headerRight={
          <div className="flex items-center gap-2">
            <Badge variant={getStatusVariant(document.status)}>
              {document.status}
            </Badge>
            {canReview() && isReviewable() && (
              <>
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => setActionModal('approve')}
                >
                  {getThemedIcon('ui', 'thumbs_up', 16)}
                  {t('workflow.document.approve', 'Approve')}
                </Button>
                {canReject() && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setActionModal('reject')}
                  >
                    {getThemedIcon('ui', 'thumbs_down', 16)}
                    {t('workflow.document.reject', 'Reject')}
                  </Button>
                )}
                <Button
                  variant="warning"
                  size="sm"
                  onClick={() => setActionModal('return')}
                >
                  {getThemedIcon('ui', 'rotate_ccw', 16)}
                  {t('workflow.document.return', 'Return')}
                </Button>
              </>
            )}
            {canResubmit() && (
              <Button
                variant="info"
                size="sm"
                onClick={() => setActionModal('resubmit')}
              >
                {getThemedIcon('ui', 'upload', 16)}
                {t('workflow.document.resubmit', 'Resubmit')}
              </Button>
            )}
            {canUploadSigned() && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActionModal('upload-signed')}
              >
                {getThemedIcon('ui', 'upload', 16)}
                {t('workflow.document.uploadSigned', 'Upload Signed')}
              </Button>
            )}
            {canWithdraw() && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActionModal('withdraw')}
              >
                {getThemedIcon('ui', 'rotate_ccw', 16)}
                {t('workflow.document.withdraw', 'Withdraw')}
              </Button>
            )}
          </div>
        }
      >
        <WorkflowDiagram
          status={document.status}
          workflowType={document.workflowType}
          document={document}
        />
      </CollapsibleDashboardSection>

      {/* Workflow Details - Full Width */}
      <CollapsibleDashboardSection
        title={t('workflow.document.details', 'Workflow Details')}
        icon={getThemedIcon('ui', 'info', 20)}
        sectionId="document-details"
        color="#3b82f6"
      >
        {/* Title and Description */}
        <div className="grid grid-cols-2 gap-6">
          <div className="min-h-[60px]">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                {t('workflow.document.title', 'Title')}
              </label>
              <p className="text-gray-900 text-sm">{document.title}</p>
            </div>
          </div>
          <div className="min-h-[60px]">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                {t('workflow.document.description', 'Description')}
              </label>
              <p className="text-gray-900 text-sm">{document.description}</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-6 border-t border-gray-200"></div>

        {/* Program, Subject, Class */}
        <div className="grid grid-cols-3 gap-6">
          <div className="min-h-[60px]">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                {t('workflow.document.program', 'Program')}
              </label>
              <p className="text-gray-900 text-sm flex items-center gap-2">
                {getThemedIcon('ui', 'book', 16)}
                {document.program || '-'}
              </p>
            </div>
          </div>
          <div className="min-h-[60px]">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                {t('workflow.document.class', 'Class')}
              </label>
              <p className="text-gray-900 text-sm flex items-center gap-2">
                {getThemedIcon('ui', 'users', 16)}
                {document.class?.name || '-'}
              </p>
            </div>
          </div>
          <div className="min-h-[60px]">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                {t('workflow.document.subject', 'Subject')}
              </label>
              <p className="text-gray-900 text-sm flex items-center gap-2">
                {getThemedIcon('ui', 'file_text', 16)}
                {document.subject || '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-6 border-t border-gray-200"></div>

        {/* Rest of the fields */}
        <div className="grid grid-cols-4 gap-6">
          <div className="min-h-[60px]">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                {t('workflow.document.workflowType', 'Workflow Type')}
              </label>
              <p className="text-gray-900 text-sm flex items-center gap-2">
                {getThemedIcon('ui', 'workflow', 16)}
                {document.workflowType}
              </p>
            </div>
          </div>
          <div className="min-h-[60px]">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                {t('workflow.document.submitter', 'Submitter')}
              </label>
              <p className="text-gray-900 text-sm flex items-center gap-2">
                {getThemedIcon('ui', 'user', 16)}
                {document.submitter?.name || document.submitter?.firstName || '-'}
              </p>
            </div>
          </div>
          <div className="min-h-[60px]">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                {t('workflow.document.currentAssignee', 'Current Assignee')}
              </label>
              <p className="text-gray-900 text-sm flex items-center gap-2">
                {getThemedIcon('ui', 'user', 16)}
                {document.currentAssignee?.name || document.currentAssignee?.firstName || '-'}
              </p>
            </div>
          </div>
          <div className="min-h-[60px]">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                {t('workflow.document.submittedAt', 'Submitted At')}
              </label>
              <p className="text-gray-900 text-sm flex items-center gap-2">
                {getThemedIcon('ui', 'calendar', 16)}
                {formatQatarDate(document.createdAt, 'MMM d, yyyy HH:mm')}
              </p>
            </div>
          </div>
          <div className="min-h-[60px]">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                {t('workflow.document.sla', 'SLA Status')}
              </label>
              <div className="flex items-center gap-2">
                {(() => {
                  const slaInfo = getSlaInfo(document.createdAt);
                  return (
                    <div className="flex flex-col gap-1">
                      <Badge variant={slaInfo.badgeVariant} className="text-xs w-fit">
                        {slaInfo.timeElapsed}
                      </Badge>
                      {slaInfo.isOverdue && (
                        <span className="text-xs text-red-600 font-medium">
                          {t('workflow.document.overdue', 'Overdue')}
                        </span>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
          <div className="min-h-[60px]">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                {t('workflow.document.date', 'Date')}
              </label>
              <p className="text-gray-900 text-sm flex items-center gap-2">
                {getThemedIcon('ui', 'calendar', 16)}
                {document.date ? formatQatarDate(new Date(document.date), 'MMM d, yyyy') : '-'}
              </p>
            </div>
          </div>
          <div className="min-h-[60px]">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                {t('workflow.document.reviewCycleCount', 'Review Cycles')}
              </label>
              <p className="text-gray-900 text-sm flex items-center gap-2">
                {getThemedIcon('ui', 'refresh', 16)}
                {document.reviewCycleCount || 0}
              </p>
            </div>
          </div>
          <div className="min-h-[60px]">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                {t('workflow.document.createdAt', 'Created')}
              </label>
              <p className="text-gray-900 text-sm flex items-center gap-2">
                {getThemedIcon('ui', 'clock', 16)}
                {formatQatarDate(new Date(document.createdAt), 'MMM d, yyyy HH:mm')}
              </p>
            </div>
          </div>
        </div>
      </CollapsibleDashboardSection>

      {/* Two-column layout for desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Primary content (2/3) */}
        <div className="lg:col-span-2 space-y-8">
          {/* File Download & Version History */}
          {document.file && (
            <CollapsibleDashboardSection
              title={t('workflow.document.file', 'Attached File')}
              icon={getThemedIcon('ui', 'file', 20)}
              sectionId="file-download"
              color="#10b981"
            >
              <WorkflowAttachments file={document.file} onDownload={handleDownload} onPreview={handlePreview} />
            </CollapsibleDashboardSection>
          )}
        </div>

        {/* Right column - Secondary info (1/3) */}
        <div className="lg:col-span-1 space-y-8">
          {/* Comments */}
          <CollapsibleDashboardSection
            title={t('workflow.document.comments', 'Comments')}
            icon={getThemedIcon('ui', 'message', 20)}
            sectionId="comments"
            color="#8b5cf6"
          >
            <WorkflowCommentsTab workflowId={documentId} />
          </CollapsibleDashboardSection>

          {/* Status History */}
          {document.statusHistory && document.statusHistory.length > 0 && (
            <CollapsibleDashboardSection
              title={t('workflow.document.statusHistory', 'Status History')}
              icon={getThemedIcon('ui', 'clock', 20)}
              sectionId="status-history"
              color="#ec4899"
              count={document.statusHistory.length}
            >
              <WorkflowHistory statusHistory={document.statusHistory} />
            </CollapsibleDashboardSection>
          )}
        </div>
      </div>

      {/* Step Details Modal */}
      {actionModal && (
        <Modal
          isOpen={!!actionModal}
          onClose={() => {
            setActionModal(null);
            setComment('');
            setResubmitFile(null);
            setSignedFile(null);
          }}
          title={
            actionModal === 'approve'
              ? t('workflow.document.approveTitle', 'Approve Document')
              : actionModal === 'reject'
              ? t('workflow.document.rejectTitle', 'Reject Document')
              : actionModal === 'return'
              ? t('workflow.document.returnTitle', 'Return Document')
              : actionModal === 'resubmit'
              ? t('workflow.document.resubmitTitle', 'Resubmit Document')
              : actionModal === 'upload-signed'
              ? t('workflow.document.uploadSignedTitle', 'Upload Signed Document')
              : t('workflow.document.withdrawTitle', 'Withdraw Document')
          }
        >
          <div className="space-y-4">
            <p>
              {actionModal === 'approve'
                ? t('workflow.document.approveConfirm', 'Are you sure you want to approve this document?')
                : actionModal === 'reject'
                ? t('workflow.document.rejectConfirm', 'Are you sure you want to reject this document? A comment is required.')
                : actionModal === 'return'
                ? t('workflow.document.returnConfirm', 'Are you sure you want to return this document for revision? A comment is required.')
                : actionModal === 'resubmit'
                ? t('workflow.document.resubmitConfirm', 'Upload a new file to resubmit this document for review.')
                : actionModal === 'upload-signed'
                ? t('workflow.document.uploadSignedConfirm', 'Upload the signed document after student signatures. This will reassign the document to HR for final review.')
                : t('workflow.document.withdrawConfirm', 'Are you sure you want to withdraw this document? It will be reverted to DRAFT status and you can resubmit it after making corrections.')}
            </p>
            {(actionModal === 'resubmit' || actionModal === 'upload-signed') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('workflow.document.selectFile', 'Select File')}
                </label>
                <input
                  type="file"
                  onChange={(e) => {
                    if (actionModal === 'resubmit') {
                      setResubmitFile(e.target.files[0]);
                    } else {
                      setSignedFile(e.target.files[0]);
                    }
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {(actionModal === 'resubmit' ? resubmitFile : signedFile) && (
                  <p className="text-sm text-gray-600 mt-2">
                    {t('workflow.document.selectedFile', 'Selected:')} {actionModal === 'resubmit' ? resubmitFile.name : signedFile.name}
                  </p>
                )}
              </div>
            )}
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                actionModal === 'approve' || actionModal === 'withdraw'
                  ? t('workflow.document.optionalComment', 'Add optional comment...')
                  : t('workflow.document.requiredComment', 'Add required comment...')
              }
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setActionModal(null);
                  setComment('');
                  setResubmitFile(null);
                  setSignedFile(null);
                }}
                disabled={actionLoading}
              >
                {getThemedIcon('ui', 'x', 16)}
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                variant={actionModal === 'approve' ? 'success' : actionModal === 'reject' ? 'destructive' : actionModal === 'return' ? 'warning' : 'info'}
                onClick={() => {
                  if (actionModal === 'approve') handleApprove();
                  else if (actionModal === 'reject') handleReject();
                  else if (actionModal === 'return') handleReturn();
                  else if (actionModal === 'resubmit') handleResubmit();
                  else if (actionModal === 'upload-signed') handleUploadSigned();
                  else if (actionModal === 'withdraw') handleWithdraw();
                }}
                disabled={actionLoading}
              >
                {actionLoading
                  ? t('common.processing', 'Processing...')
                  : actionModal === 'approve'
                  ? t('workflow.document.approve', 'Approve')
                  : actionModal === 'reject'
                  ? t('workflow.document.reject', 'Reject')
                  : actionModal === 'return'
                  ? t('workflow.document.return', 'Return')
                  : actionModal === 'resubmit'
                  ? t('workflow.document.resubmit', 'Resubmit')
                  : actionModal === 'upload-signed'
                  ? t('workflow.document.uploadSigned', 'Upload Signed')
                  : t('workflow.document.withdraw', 'Withdraw')}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Step Details Modal */}
      {stepDetailsModal && selectedStep && (
        <Modal
          isOpen={stepDetailsModal}
          onClose={() => {
            setStepDetailsModal(false);
            setSelectedStep(null);
          }}
          title={t('workflow.document.stepDetails', 'Step Details')}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('workflow.document.stepName', 'Step Name')}
              </label>
              <p className="text-gray-900">{selectedStep.data.label.props.children[1]}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('workflow.document.stepStatus', 'Status')}
              </label>
              <Badge variant={getStatusVariant(document.status)}>
                {document.status}
              </Badge>
            </div>
            {document.currentAssignee && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('workflow.document.currentAssignee', 'Current Assignee')}
                </label>
                <p className="text-gray-900 flex items-center gap-2">
                  {getThemedIcon('ui', 'user', 16)}
                  {document.currentAssignee?.name || document.currentAssignee?.firstName || '-'}
                </p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('workflow.document.submittedAt', 'Submitted At')}
              </label>
              <p className="text-gray-900 flex items-center gap-2">
                {getThemedIcon('ui', 'calendar', 16)}
                {formatQatarDate(document.createdAt, 'MMM d, yyyy HH:mm')}
              </p>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500">
                {t('workflow.document.historyNotePlaceholder', 'Full status history will be available in future enhancements.')}
              </p>
            </div>
          </div>
        </Modal>
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <FileDetailsModal
          file={previewFile}
          initialTab="details"
          userCanEdit={false}
          onClose={() => setPreviewFile(null)}
          onDownload={handleDownload}
        />
      )}
      </div>
    </div>
  );
};

export default WorkflowDocumentDetailPage;
