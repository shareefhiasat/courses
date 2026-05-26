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
import { approveWorkflowDocument, rejectWorkflowDocument, returnWorkflowDocument, resubmitWorkflowDocument, uploadSignedDocument, withdrawWorkflowDocument } from '@services/api/workflow-documents-api.js';
import WorkflowDiagram from '@components/workflow/WorkflowDiagram.jsx';
import WorkflowHistory from '@components/workflow/WorkflowHistory.jsx';
import WorkflowCommentsTab from '@components/workflow/WorkflowCommentsTab.jsx';
import CollapsibleDashboardSection from '@components/ui/CollapsibleDashboardSection/CollapsibleDashboardSection.jsx';
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
  const [fileVersions, setFileVersions] = useState([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  // Polling for real-time status updates
  useEffect(() => {
    const pollInterval = 30000; // 30 seconds

    const pollStatus = async () => {
      if (!document || document.status === 'APPROVED' || document.status === 'REJECTED') {
        return; // Don't poll for terminal states
      }

      try {
        const token = localStorage.getItem('keycloak_token');
        const response = await fetch(`/api/v1/workflow-documents/${documentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
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

  // Fetch file versions when document is loaded
  useEffect(() => {
    const fetchFileVersions = async () => {
      if (!document?.file?.id) return;

      setLoadingVersions(true);
      try {
        // Use the drive versions API with the file ID
        const response = await apiService.get(`/drive/files/${document.file.id}/versions`);
        if (response.success) {
          setFileVersions(response.data || []);
        }
      } catch (err) {
        console.warn('File versions endpoint not available:', err.message);
        setFileVersions([]);
      } finally {
        setLoadingVersions(false);
      }
    };

    fetchFileVersions();
  }, [document?.file?.id]);

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

      {/* Two-column layout for Status History and Attachments */}
      <div className="grid grid-cols-1 lg:grid-cols-[50%_50%] gap-6">
        {/* Left column - Status History */}
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

        {/* Right column - Attached Document and Versions */}
        {document.file && (
          <CollapsibleDashboardSection
            title={t('workflow.document.attachments', 'Attached Document & Versions')}
            icon={getThemedIcon('ui', 'paperclip', 20)}
            sectionId="attachments"
            color="#f59e0b"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Current file */}
            <div style={{
              padding: '1rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border, #e5e7eb)',
              background: 'var(--panel, white)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
            }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                borderRadius: '0.5rem',
                background: 'var(--color-primary-alpha, rgba(37,99,235,0.1))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary, #3b82f6)',
              }}>
                {getThemedIcon('ui', 'file', 24)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text, #111827)' }}>
                  {document.file.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)' }}>
                  {document.file.mimeType} • {(document.file.size / 1024).toFixed(1)} KB
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`/api/v1/files/${document.fileId}/download`, '_blank')}
                style={{ padding: '0.5rem' }}
              >
                {getThemedIcon('ui', 'download', 16)}
              </Button>
            </div>

            {/* Versions list */}
            {fileVersions.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted, #6b7280)' }}>
                  {t('workflow.document.versions', 'Versions')} ({fileVersions.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {fileVersions.map((version) => (
                    <div
                      key={version.id}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '0.375rem',
                        border: version.isCurrent ? '1px solid var(--color-primary, #3b82f6)' : '1px solid var(--border, #e5e7eb)',
                        background: version.isCurrent ? 'var(--color-primary-alpha, rgba(37,99,235,0.05))' : 'var(--panel, white)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                      }}
                    >
                      <div style={{
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '9999px',
                        background: version.isCurrent ? 'var(--color-primary, #3b82f6)' : 'var(--text-muted, #6b7280)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}>
                        v{version.versionNumber}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text, #111827)' }}>
                          {version.changeNote || t('workflow.document.version', 'Version')} {version.versionNumber}
                          {version.isCurrent && (
                            <span style={{
                              marginLeft: '0.5rem',
                              padding: '0.125rem 0.5rem',
                              borderRadius: '9999px',
                              background: 'var(--color-primary, #3b82f6)',
                              color: 'white',
                              fontSize: '0.625rem',
                              fontWeight: 600,
                            }}>
                              {t('common.current', 'Current')}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)' }}>
                          {version.uploadedBy?.displayName || version.uploadedBy?.email || 'Unknown'} • {new Date(version.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`/api/v1/workflow-documents/${document.fileId}/versions/${version.id}/download`, '_blank')}
                      >
                        {getThemedIcon('ui', 'download', 16)}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {loadingVersions && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', color: 'var(--text-muted, #6b7280)' }}>
                {t('common.loading', 'Loading')}...
              </div>
            )}
          </div>
        </CollapsibleDashboardSection>
        )}
      </div>

      {/* Comments section - full width below */}
      <CollapsibleDashboardSection
        title={t('workflow.document.comments', 'Comments')}
        icon={getThemedIcon('ui', 'message', 20)}
        sectionId="comments"
        color="#8b5cf6"
      >
        <WorkflowCommentsTab workflowId={documentId} />
      </CollapsibleDashboardSection>

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
      </div>
    </div>
  );
};

export default WorkflowDocumentDetailPage;
