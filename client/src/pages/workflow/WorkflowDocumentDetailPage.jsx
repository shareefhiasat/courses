/**
 * Workflow Document Detail Page
 * 
 * PURPOSE: Display WorkflowDocument details with file download, version history, and comments
 * ARCHITECTURE: Page Component → Hook → Service → API
 * NOTE: This is for WorkflowDocument system (Epic 1), not the existing Workflow system
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '@services/api/apiService';
import { formatQatarDate } from '@utils/timezone';
import { getSlaInfo } from '@utils/sla.js';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { Button, useToast, CountdownLoading } from '@ui';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@ui';
import { SimpleLoading, EmptyState, Modal, Textarea, Input } from '@ui';
import { approveWorkflowDocument, rejectWorkflowDocument, returnWorkflowDocument, resubmitWorkflowDocument, uploadSignedDocument, withdrawWorkflowDocument, updateWorkflowDocumentStatus } from '@services/api/workflow-documents-api.js';
import WorkflowDiagram from '@components/workflow/WorkflowDiagram.jsx';
import WorkflowHistory from '@components/workflow/WorkflowHistory.jsx';
import CollapsibleDashboardSection from '@components/ui/CollapsibleDashboardSection/CollapsibleDashboardSection.jsx';
import VersionsTab from '@components/smart-drive/tabs/VersionsTab.jsx';
import WorkflowCommentsTab from '@components/workflow/WorkflowCommentsTab.jsx';
import { getThemedIcon } from '@constants/iconTypes';
import { getStatusVariant, WORKFLOW_STATUS } from '@constants/workflowStatusTypes';
import { getWorkflowDocument } from '@services/api/workflow-documents-api.js';

const WorkflowDocumentDetailPage = () => {
  const { t } = useLang();
  const { documentId } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const toast = useToast();

  // Handle AuthContext not being available during lazy load
  if (!auth || auth.loading) {
    return <SimpleLoading />;
  }

  const { user } = auth;

  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionModal, setActionModal] = useState(null); // 'approve', 'reject', 'return', 'submit', 'sendToNext', 'resubmit', 'upload-signed', 'withdraw'
  const [comment, setComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [resubmitFile, setResubmitFile] = useState(null);
  const [signedFile, setSignedFile] = useState(null);
  const [isVisible, setIsVisible] = useState(true);
  const [diagramKey, setDiagramKey] = useState(0);
  const [selectedStage, setSelectedStage] = useState(null);
  const commentInputRef = useRef(null);

  // Handle visibility change
  useEffect(() => {
    const handleVisibility = () => setIsVisible(!window.document.hidden);
    window.document.addEventListener('visibilitychange', handleVisibility);
    return () => window.document.removeEventListener('visibilitychange', handleVisibility);
  }, []);


  // Fetch document details
  const fetchDocument = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getWorkflowDocument(documentId);

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

  // Check if user can perform review actions
  const canReview = () => {
    if (!document || !user) return false;
    const userRoles = (user.roles || []).map(r => r.toLowerCase());
    const isHR = userRoles.includes('hr');
    const isAdmin = userRoles.includes('admin');
    const isSuperAdmin = userRoles.includes('super_admin');
    const isSubmitter = document.submitterId === user.id;
    const isCurrentAssignee = document.currentAssigneeId === user.id;
    
    // Super Admin can review any document
    if (isSuperAdmin) return true;
    
    // HR or Admin can review if:
    // 1. They are the current assignee (specific user assignment)
    // 2. OR the document is assigned to their role (role-based assignment)
    if (isHR || isAdmin) {
      if (isCurrentAssignee && !isSubmitter) return true;
      
      // Check role-based assignment
      if (!document.currentAssigneeId) {
        // Document is role-based assigned
        if (isHR && document.workflowType === 'GENERAL') return true;
        if (isAdmin && document.workflowType === 'ATTENDANCE_WEEKLY') return true;
      }
    }
    
    return false;
  };

  // Check if user can return (any participant can return if not completed/rejected)
  const canReturn = () => {
    if (!document || !user) return false;
    // Cannot return if already in terminal states
    if (document.status === WORKFLOW_STATUS.APPROVED || document.status === WORKFLOW_STATUS.REJECTED) {
      return false;
    }
    // Cannot return if in draft state (nothing to return from)
    if (document.status === WORKFLOW_STATUS.DRAFT) {
      return false;
    }
    // Any participant (submitter, assignee, HR, Admin) can return
    const userRoles = (user.roles || []).map(r => r.toLowerCase());
    const isHR = userRoles.includes('hr');
    const isAdmin = userRoles.includes('admin');
    const isSuperAdmin = userRoles.includes('super_admin');
    const isSubmitter = document.submitterId === user.id;
    const isCurrentAssignee = document.currentAssigneeId === user.id;
    
    if (isSuperAdmin) return true;
    if (isSubmitter) return true;
    if (isCurrentAssignee) return true;
    if (isHR || isAdmin) return true;
    
    return false;
  };

  // Check if user can reject (only owner or super admin)
  const canReject = () => {
    if (!document || !user) return false;
    const userRoles = (user.roles || []).map(r => r.toLowerCase());
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
    return document.status === WORKFLOW_STATUS.SUBMITTED || document.status === WORKFLOW_STATUS.UNDER_REVIEW;
  };

  // Handle approve action
  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const commentValue = commentInputRef.current?.value || '';
      const result = await approveWorkflowDocument(documentId, { comment: commentValue });
      if (result.success) {
        toast.success(t('workflow.document.approved', 'Document approved successfully'));
        // Force immediate refresh before closing modal
        await fetchDocument();
        setDiagramKey(prev => prev + 1); // Force WorkflowDiagram re-render
        setActionModal(null);
        window.location.reload(); // Full page refresh to ensure UI updates
        setComment('');
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
    const commentValue = commentInputRef.current?.value || '';
    console.log('[REJECT ACTION] Starting reject action', { documentId, currentStatus: document?.status, comment: commentValue });
    if (!commentValue.trim()) {
      toast.error(t('workflow.document.commentRequired', 'Comment is required for rejection'));
      return;
    }
    setActionLoading(true);
    try {
      const result = await rejectWorkflowDocument(documentId, { comment: commentValue });
      console.log('[REJECT ACTION] API response', result);
      if (result.success) {
        toast.success(t('workflow.document.rejected', 'Document rejected successfully'));
        console.log('[REJECT ACTION] Reject successful, new status:', result.data?.status);
        // Force immediate refresh before closing modal
        await fetchDocument();
        setDiagramKey(prev => prev + 1); // Force WorkflowDiagram re-render
        setActionModal(null);
        window.location.reload(); // Full page refresh to ensure UI updates
      } else {
        toast.error(result.error || t('workflow.document.rejectError', 'Failed to reject document'));
      }
    } catch (err) {
      console.error('[REJECT ACTION] Error:', err);
      toast.error(t('workflow.document.rejectError', 'Failed to reject document'));
    } finally {
      setActionLoading(false);
    }
  };

  // Handle return action
  const handleReturn = async () => {
    const commentValue = commentInputRef.current?.value || '';
    console.log('[RETURN ACTION] Starting return action', { documentId, currentStatus: document?.status, comment: commentValue });
    if (!commentValue.trim()) {
      toast.error(t('workflow.document.commentRequired', 'Comment is required for return'));
      return;
    }
    setActionLoading(true);
    try {
      const result = await returnWorkflowDocument(documentId, { comment: commentValue });
      console.log('[RETURN ACTION] API response', result);
      if (result.success) {
        toast.success(t('workflow.document.returned', 'Document returned successfully'));
        console.log('[RETURN ACTION] Return successful, new status:', result.data?.status);
        // Force immediate refresh before closing modal
        await fetchDocument();
        setDiagramKey(prev => prev + 1); // Force WorkflowDiagram re-render
        setActionModal(null);
        setComment('');
      } else {
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
          // Force immediate refresh before closing modal
          await fetchDocument();
          setDiagramKey(prev => prev + 1); // Force WorkflowDiagram re-render
          setActionModal(null);
          setComment('');
          setResubmitFile(null);
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
    const isRejected = document.status === WORKFLOW_STATUS.REJECTED;
    return isSubmitter && isRejected;
  };

  // Check if user can upload signed document (Admin only for weekly summaries)
  const canUploadSigned = () => {
    if (!document || !user) return false;
    const userRoles = (user.roles || []).map(r => r.toLowerCase());
    const isAdmin = userRoles.includes('admin');
    const isWeeklySummary = document.workflowType === 'ATTENDANCE_WEEKLY';
    const isUnderAdminReview = document.status === WORKFLOW_STATUS.SUBMITTED || document.status === WORKFLOW_STATUS.UNDER_ADMIN_REVIEW;
    return isAdmin && isWeeklySummary && isUnderAdminReview;
  };

  // Check if user can re-upload document (HR/Admin during review)
  const canReupload = () => {
    if (!document || !user) return false;
    const userRoles = (user.roles || []).map(r => r.toLowerCase());
    const isHR = userRoles.includes('hr');
    const isAdmin = userRoles.includes('admin');
    const isSuperAdmin = userRoles.includes('super_admin');
    const isSubmitter = document.submitterId === user.dbId;
    const isCurrentAssignee = document.currentAssigneeId === user.dbId;
    
    // Super Admin can re-upload any document
    if (isSuperAdmin) return true;
    
    // HR or Admin can re-upload if they can review the document
    if (isHR || isAdmin) {
      if (isCurrentAssignee && !isSubmitter) return true;
      
      // Check role-based assignment
      if (!document.currentAssigneeId) {
        if (isHR && document.workflowType === 'GENERAL') return true;
        if (isAdmin && document.workflowType === 'ATTENDANCE_WEEKLY') return true;
      }
    }
    
    return false;
  };

  // Handle document re-upload
  const handleReupload = async () => {
    if (!resubmitFile) {
      toast.error(t('workflow.document.fileRequired', 'File is required for re-upload'));
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
          toast.success(t('workflow.document.reuploaded', 'Document re-uploaded successfully'));
          // Force immediate refresh before closing modal
          await fetchDocument();
          setDiagramKey(prev => prev + 1); // Force WorkflowDiagram re-render
          setActionModal(null);
          setComment('');
          setResubmitFile(null);
        } else {
          toast.error(result.error || t('workflow.document.reuploadError', 'Failed to re-upload document'));
        }
        setActionLoading(false);
      };
      reader.onerror = () => {
        toast.error(t('workflow.document.fileReadError', 'Failed to read file'));
        setActionLoading(false);
      };
      reader.readAsDataURL(resubmitFile);
    } catch (err) {
      toast.error(t('workflow.document.reuploadError', 'Failed to re-upload document'));
      setActionLoading(false);
    }
  };
  const canWithdraw = () => {
    if (!document || !user) return false;
    const isSubmitter = document.submitterId === user.id;
    const isSubmitted = document.status === WORKFLOW_STATUS.SUBMITTED;
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
          // Force immediate refresh before closing modal
          await fetchDocument();
          setDiagramKey(prev => prev + 1); // Force WorkflowDiagram re-render
          setActionModal(null);
          setComment('');
          setSignedFile(null);
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

  // Handle submit action (move from draft to submitted)
  const handleSubmit = async () => {
    setActionLoading(true);
    try {
      const result = await updateWorkflowDocumentStatus(documentId, { status: 'SUBMITTED', reason: comment || 'Document submitted for review' });
      if (result.success) {
        toast.success(t('workflow.document.submitted', 'Document submitted successfully'));
        await fetchDocument();
        setDiagramKey(prev => prev + 1);
        setActionModal(null);
        setComment('');
        // Full page refresh for submit
        window.location.reload();
      } else {
        toast.error(result.error || t('workflow.document.submitError', 'Failed to submit document'));
      }
    } catch (err) {
      toast.error(t('workflow.document.submitError', 'Failed to submit document'));
    } finally {
      setActionLoading(false);
    }
  };

  // Handle send to next step action
  const handleSendToNext = async () => {
    setActionLoading(true);
    try {
      // Determine next status based on workflow type
      // GENERAL_HR: SUBMITTED → UNDER_HR_REVIEW → APPROVED
      // GENERAL_ADMIN: SUBMITTED → UNDER_ADMIN_REVIEW → APPROVED
      // GENERAL_MIXED_HR_ADMIN: SUBMITTED → UNDER_HR_REVIEW → UNDER_ADMIN_REVIEW → APPROVED
      // GENERAL_MIXED_ADMIN_HR: SUBMITTED → UNDER_ADMIN_REVIEW → UNDER_HR_REVIEW → APPROVED
      let nextStatus;
      if (document.workflowType === 'GENERAL_HR') {
        nextStatus = 'UNDER_HR_REVIEW';
      } else if (document.workflowType === 'GENERAL_ADMIN') {
        nextStatus = 'UNDER_ADMIN_REVIEW';
      } else if (document.workflowType === 'GENERAL_MIXED_HR_ADMIN') {
        nextStatus = 'UNDER_HR_REVIEW';
      } else if (document.workflowType === 'GENERAL_MIXED_ADMIN_HR') {
        nextStatus = 'UNDER_ADMIN_REVIEW';
      } else {
        nextStatus = 'UNDER_HR_REVIEW'; // default
      }
      
      const result = await updateWorkflowDocumentStatus(documentId, { status: nextStatus, reason: comment || 'Sent to next step' });
      if (result.success) {
        toast.success(t('workflow.document.sentToNext', 'Document sent to next step successfully'));
        await fetchDocument();
        setDiagramKey(prev => prev + 1);
        setActionModal(null);
        setComment('');
      } else {
        toast.error(result.error || t('workflow.document.sendToNextError', 'Failed to send to next step'));
      }
    } catch (err) {
      toast.error(t('workflow.document.sendToNextError', 'Failed to send to next step'));
    } finally {
      setActionLoading(false);
    }
  };

  // Handle document withdrawal
  const handleWithdraw = async () => {
    const commentValue = commentInputRef.current?.value || '';
    setActionLoading(true);
    try {
      const result = await withdrawWorkflowDocument(documentId, { comment: commentValue });
      if (result.success) {
        toast.success(t('workflow.document.withdrawn', 'Document withdrawn successfully'));
        // Force immediate refresh before closing modal
        await fetchDocument();
        setDiagramKey(prev => prev + 1); // Force WorkflowDiagram re-render
        setActionModal(null);
        setComment('');
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
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center px-4 py-6">
      <div className="w-full space-y-8" style={{ maxWidth: '1400px' }}>

      {/* Auto-refresh countdown indicator */}
      {document && document.status !== WORKFLOW_STATUS.APPROVED && document.status !== WORKFLOW_STATUS.REJECTED && (
        <CountdownLoading 
          duration={10}
          isActive={isVisible}
        />
      )}

      {/* Document Title and Description */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{document?.title || '-'}</h2>
            </div>
            {document?.description && (
              <div>
                <p className="text-gray-600">{document.description}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top row: Workflow Progress (full width) */}
      <div>
        {/* Workflow Progress */}
        <div style={{
          background: 'var(--panel, white)',
          borderRadius: '0.75rem',
          border: '1px solid var(--border, #e5e7eb)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          padding: '1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {getThemedIcon('ui', 'workflow', 20)}
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text, #111827)', margin: 0 }}>
                {t('workflow.document.workflowProgress', 'Workflow Progress')}
              </h3>
            </div>
            <div className="flex items-center gap-2 flex-nowrap">
              {/* Action buttons removed - use context menu on workflow diagram instead */}
              {/* {canReview() && isReviewable() && (
                <>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => setActionModal('approve')}
                    className="flex items-center gap-2 whitespace-nowrap"
                  >
                    {getThemedIcon('ui', 'thumbs_up', 16)}
                    {t('workflow.document.approve', 'Approve')}
                  </Button>
                  {canReject() && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setActionModal('reject')}
                      className="flex items-center gap-2 whitespace-nowrap"
                    >
                      <XCircle size={16} />
                      {t('workflow.document.reject', 'Reject')}
                    </Button>
                  )}
                  {canReturn() && (
                    <Button
                      variant="warning"
                      size="sm"
                      onClick={() => setActionModal('return')}
                      className="flex items-center gap-2 whitespace-nowrap"
                    >
                      {getThemedIcon('ui', 'rotate_ccw', 16)}
                      {t('workflow.document.return', 'Return')}
                    </Button>
                  )}
                  {canReupload() && (
                    <Button
                      variant="info"
                      size="sm"
                      onClick={() => setActionModal('reupload')}
                      className="flex items-center gap-2 whitespace-nowrap"
                    >
                      {getThemedIcon('ui', 'upload', 16)}
                      {t('workflow.document.reupload', 'Re-upload')}
                    </Button>
                  )}
                </>
              )} */}
              {canResubmit() && (
                <Button
                  variant="info"
                  size="sm"
                  onClick={() => setActionModal('resubmit')}
                  className="flex items-center gap-2 whitespace-nowrap"
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
                  className="flex items-center gap-2 whitespace-nowrap"
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
                  className="flex items-center gap-2 whitespace-nowrap"
                >
                  {getThemedIcon('ui', 'rotate_ccw', 16)}
                  {t('workflow.document.withdraw', 'Withdraw')}
                </Button>
              )}
            </div>
          </div>

          {/* Status Legend */}
          <div style={{ marginBottom: '1rem' }}>
            <div className="flex items-center gap-4 flex-wrap">
              {[
                { label: 'Draft', color: '#6b7280', icon: 'file_text' },
                { label: 'Submitted', color: '#3b82f6', icon: 'send' },
                { label: 'HR Review', color: '#8b5cf6', icon: 'alert_triangle' },
                { label: 'Admin Review', color: '#8b5cf6', icon: 'alert_triangle' },
                { label: 'Completed', color: '#10b981', icon: 'check_circle' },
                { label: 'Rejected', color: '#ef4444', icon: 'x_circle' }
              ].map((status) => (
                <div key={status.label} className="flex items-center gap-2">
                  {getThemedIcon('ui', status.icon, 16, status.color)}
                  <span className="text-sm" style={{ color: status.color }}>
                    {status.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <WorkflowDiagram
            key={diagramKey} // Force re-render on actions
            status={document.status}
            workflowType={document.workflowType}
            document={document}
            currentAssignee={document.currentAssignee}
            onApprove={() => setActionModal('approve')}
            onReturn={() => setActionModal('return')}
            onReject={() => setActionModal('reject')}
            onSubmit={() => setActionModal('submit')}
            onSendToNext={() => setActionModal('sendToNext')}
            onDelete={() => setActionModal('withdraw')}
            onRefresh={fetchDocument}
            onStageFilterChange={setSelectedStage}
          />
        </div>
      </div>

      {/* Bottom row: Attachments, Comments, and Status History */}
      <div className="grid grid-cols-1 lg:grid-cols-[40%_40%_20%]">
        {/* Attached Document and Versions */}
        {document.file && (
          <div style={{
            background: 'var(--panel, white)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border, #e5e7eb)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            padding: '1.5rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              {getThemedIcon('ui', 'paperclip', 20)}
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text, #111827)', margin: 0 }}>
                {t('workflow.document.attachments', 'Attached Document & Versions')}
              </h3>
            </div>
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
                onClick={async () => {
                  try {
                    const { apiService } = await import('@services/api/apiService.js');
                    const response = await apiService.get(`/drive/files/${document.fileId}/download`, {
                      responseType: 'blob'
                    });

                    if (!response.success && !response.data) {
                      throw new Error(response.error || t('common.downloadFailed', 'Download failed'));
                    }

                    const blob = response.data || response;
                    const blobUrl = window.URL.createObjectURL(blob);

                    const link = window.document.createElement('a');
                    link.href = blobUrl;
                    link.download = '';
                    window.document.body.appendChild(link);
                    link.click();
                    window.document.body.removeChild(link);
                    window.URL.revokeObjectURL(blobUrl);
                  } catch (error) {
                    console.error('Download failed:', error);
                    toast.error(error.message || t('common.downloadFailed', 'Download failed'));
                  }
                }}
                style={{ padding: '0.5rem' }}
              >
                {getThemedIcon('ui', 'download', 16)}
              </Button>
            </div>

            {/* Versions list using VersionsTab component */}
            <div style={{ height: '500px' }}>
              <VersionsTab fileId={document.file.id} useWorkflowEndpoint={true} />
            </div>
          </div>
        </div>
        )}

        {/* Comments */}
        <div style={{
          background: 'var(--panel, white)',
          borderRadius: '0.75rem',
          border: '1px solid var(--border, #e5e7eb)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          padding: '1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            {getThemedIcon('ui', 'message', 20)}
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text, #111827)', margin: 0 }}>
              {t('workflow.document.comments', 'Comments')}
            </h3>
          </div>
          <WorkflowCommentsTab 
            workflowId={documentId} 
            selectedStage={selectedStage}
            onStageFilterChange={setSelectedStage}
          />
        </div>

        {/* Status History */}
        {document.statusHistory && document.statusHistory.length > 0 && (
          <div style={{
            background: 'var(--panel, white)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border, #e5e7eb)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            padding: '1.5rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              {getThemedIcon('ui', 'clock', 20)}
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text, #111827)', margin: 0 }}>
                {t('workflow.document.statusHistory', 'Status History')}
              </h3>
              <Badge variant="secondary" style={{ marginLeft: 'auto' }}>
                {document.statusHistory.length}
              </Badge>
            </div>
            <div style={{ height: '500px', overflowY: 'auto' }}>
              <WorkflowHistory statusHistory={document.statusHistory} />
            </div>
          </div>
        )}
      </div>

      {/* Step Details Modal */}
      {actionModal && (
        <Modal
          isOpen={!!actionModal}
          size="small"
          showCloseButton={false}
          className="compact-modal"
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
              : actionModal === 'submit'
              ? t('workflow.document.submitTitle', 'Submit Document')
              : actionModal === 'sendToNext'
              ? t('workflow.document.sendToNextTitle', 'Send to Next Step')
              : actionModal === 'resubmit'
              ? t('workflow.document.resubmitTitle', 'Resubmit Document')
              : actionModal === 'reupload'
              ? t('workflow.document.reuploadTitle', 'Re-upload Document')
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
                : actionModal === 'submit'
                ? t('workflow.document.submitConfirm', 'Submit this document for review. The file can be edited separately from Smart Drive.')
                : actionModal === 'sendToNext'
                ? t('workflow.document.sendToNextConfirm', 'Send this document to the next review step.')
                : actionModal === 'resubmit'
                ? t('workflow.document.resubmitConfirm', 'Upload a new file to resubmit this document for review.')
                : actionModal === 'reupload'
                ? t('workflow.document.reuploadConfirm', 'Upload a modified file to replace the current document. This will keep the document in the same workflow stage.')
                : actionModal === 'upload-signed'
                ? t('workflow.document.uploadSignedConfirm', 'Upload the signed document after student signatures. This will reassign the document to HR for final review.')
                : t('workflow.document.withdrawConfirm', 'Are you sure you want to withdraw this document? It will be reverted to DRAFT status and you can resubmit it after making corrections.')}
            </p>
            {(actionModal === 'resubmit' || actionModal === 'reupload' || actionModal === 'upload-signed') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('workflow.document.selectFile', 'Select File')}
                </label>
                <input
                  type="file"
                  onChange={(e) => {
                    if (actionModal === 'resubmit' || actionModal === 'reupload') {
                      setResubmitFile(e.target.files[0]);
                    } else {
                      setSignedFile(e.target.files[0]);
                    }
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {(actionModal === 'resubmit' || actionModal === 'reupload' ? resubmitFile : signedFile) && (
                  <p className="text-sm text-gray-600 mt-2">
                    {t('workflow.document.selectedFile', 'Selected:')} {actionModal === 'resubmit' || actionModal === 'reupload' ? resubmitFile.name : signedFile.name}
                  </p>
                )}
              </div>
            )}
            <Input
              ref={commentInputRef}
              placeholder={
                actionModal === 'approve' || actionModal === 'withdraw'
                  ? t('workflow.document.optionalComment', 'Add optional comment...')
                  : t('workflow.document.requiredComment', 'Add required comment...')
              }
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setActionModal(null);
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
                  else if (actionModal === 'submit') handleSubmit();
                  else if (actionModal === 'sendToNext') handleSendToNext();
                  else if (actionModal === 'resubmit') handleResubmit();
                  else if (actionModal === 'reupload') handleReupload();
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
                  : actionModal === 'submit'
                  ? t('workflow.document.submit', 'Submit')
                  : actionModal === 'sendToNext'
                  ? t('workflow.document.sendToNext', 'Send to Next Step')
                  : actionModal === 'resubmit'
                  ? t('workflow.document.resubmit', 'Resubmit')
                  : actionModal === 'reupload'
                  ? t('workflow.document.reupload', 'Re-upload')
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
