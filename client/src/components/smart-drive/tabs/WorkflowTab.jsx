import { useState, useEffect, useCallback } from 'react';
import { useLang } from '@contexts/LangContext';
import { GitBranch, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import axios from 'axios';

const STATUS_STYLES = {
  APPROVED: {
    color: 'var(--status-approved, #16a34a)',
    bg: 'var(--status-approved-bg, rgba(22, 163, 74, 0.1))',
    borderColor: 'var(--status-approved-border, #86efac)',
  },
  REJECTED: {
    color: 'var(--status-rejected, #dc2626)',
    bg: 'var(--status-rejected-bg, rgba(220, 38, 38, 0.1))',
    borderColor: 'var(--status-rejected-border, #fca5a5)',
  },
  PENDING: {
    color: 'var(--status-pending, #d97706)',
    bg: 'var(--status-pending-bg, rgba(217, 119, 6, 0.1))',
    borderColor: 'var(--status-pending-border, #fcd34d)',
  },
  REVISED: {
    color: 'var(--status-revised, #2563eb)',
    bg: 'var(--status-revised-bg, rgba(37, 99, 235, 0.1))',
    borderColor: 'var(--status-revised-border, #93c5fd)',
  },
};

const DEFAULT_STATUS = {
  color: 'var(--text-muted, #6b7280)',
  bg: 'var(--background-secondary, #f3f4f6)',
  borderColor: 'var(--border, #e5e7eb)',
};

function getStatusStyle(status) {
  return STATUS_STYLES[status?.toUpperCase()] || DEFAULT_STATUS;
}

function getStepBadgeStyle(completed) {
  if (completed) {
    return {
      color: 'var(--status-approved, #16a34a)',
      bg: 'var(--status-approved-bg, rgba(22, 163, 74, 0.1))',
    };
  }
  return {
    color: 'var(--text-muted, #6b7280)',
    bg: 'var(--background-secondary, #f3f4f6)',
  };
}

export default function WorkflowTab({ fileId }) {
  const { t } = useLang();
  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWorkflow = useCallback(async () => {
    if (!fileId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/v1/workflows/instances`, {
        params: { entityId: fileId }
      });
      if (response.data.success) {
        const workflows = response.data.payload || [];
        setWorkflow(workflows.length > 0 ? workflows[0] : null);
      } else {
        setError(response.data.error?.message || 'Failed to fetch workflow');
      }
    } catch (err) {
      console.error('[WorkflowTab] fetch failed:', err);
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [fileId]);

  useEffect(() => {
    fetchWorkflow();
  }, [fetchWorkflow]);

  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED': return CheckCircle;
      case 'REJECTED': return XCircle;
      case 'PENDING': return Clock;
      case 'REVISED': return AlertCircle;
      default: return GitBranch;
    }
  };

  const formatDate = (date) => {
    if (!date) return '\u2014';
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '\u2014';
    return d.toLocaleString();
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

  if (!workflow) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '12rem', fontSize: '0.875rem', color: 'var(--text-muted, #6b7280)' }}>
        <GitBranch className="w-10 h-10 mb-3 opacity-50" aria-hidden="true" />
        {t('drive.noWorkflow')}
      </div>
    );
  }

  const StatusIcon = getStatusIcon(workflow.status);
  const statusStyle = getStatusStyle(workflow.status);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text, #111827)', marginBottom: '1rem', margin: 0 }}>
        {t('drive.workflowStatus')}
      </h3>

      <div
        style={{
          padding: '1rem',
          borderRadius: '0.75rem',
          border: '1px solid',
          borderColor: statusStyle.borderColor,
          background: statusStyle.bg,
          color: statusStyle.color,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <StatusIcon className="w-6 h-6" aria-hidden="true" />
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, fontWeight: 600, color: 'inherit' }}>
              {workflow.definition?.name || t('drive.workflow')}
            </h4>
            <p style={{ margin: '0.125rem 0 0', fontSize: '0.75rem', opacity: 0.8, color: 'inherit' }}>
              {workflow.definition?.description}
            </p>
          </div>
          <span
            style={{
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 500,
              background: 'rgba(0,0,0,0.1)',
              color: 'inherit',
            }}
          >
            {t(`workflow.status.${workflow.status.toLowerCase()}`) || workflow.status}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem', color: 'inherit' }}>
          <div>
            <p style={{ opacity: 0.7, fontSize: '0.75rem', marginBottom: '0.25rem', margin: 0 }}>{t('drive.initiatedBy')}</p>
            <p style={{ fontWeight: 500, margin: 0 }}>{workflow.initiatedBy?.displayName || workflow.initiatedBy?.email || '\u2014'}</p>
          </div>
          <div>
            <p style={{ opacity: 0.7, fontSize: '0.75rem', marginBottom: '0.25rem', margin: 0 }}>{t('drive.initiatedAt')}</p>
            <p style={{ fontWeight: 500, margin: 0 }}>{formatDate(workflow.createdAt)}</p>
          </div>
        </div>

        {workflow.completedAt && (
          <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid', borderColor: 'currentColor', opacity: 0.1 }}>
            <p style={{ opacity: 0.7, fontSize: '0.75rem', marginBottom: '0.25rem', margin: 0 }}>{t('drive.completedAt')}</p>
            <p style={{ fontWeight: 500, fontSize: '0.875rem', margin: 0 }}>{formatDate(workflow.completedAt)}</p>
          </div>
        )}
      </div>

      {workflow.currentStage && (
        <div style={{
          padding: '1rem',
          background: 'var(--panel, white)',
          borderRadius: '0.75rem',
          border: '1px solid var(--border, #e5e7eb)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        }}>
          <h5 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text, #111827)', margin: 0, marginBottom: '0.5rem' }}>
            {t('drive.currentStage')}
          </h5>
          <p style={{ fontSize: '0.875rem', color: 'var(--text, #374151)', margin: 0 }}>
            {workflow.currentStage.name}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)', margin: '0.25rem 0 0' }}>
            {t('drive.assignedTo')}: {workflow.currentStage.assignedRole}
          </p>
        </div>
      )}

      {workflow.steps && workflow.steps.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h5 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text, #111827)', margin: 0 }}>
            {t('drive.workflowSteps')} ({workflow.steps.length})
          </h5>
          {workflow.steps.map((step, idx) => {
            const badgeStyle = getStepBadgeStyle(step.status === 'COMPLETED');

            return (
              <div
                key={step.id}
                style={{
                  padding: '0.75rem',
                  background: 'var(--panel, white)',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border, #e5e7eb)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  fontSize: '0.875rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 500, color: 'var(--text, #111827)' }}>
                    {step.stage?.name || `${t('drive.step')} ${idx + 1}`}
                  </span>
                  <span
                    style={{
                      padding: '0.125rem 0.5rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      color: badgeStyle.color,
                      background: badgeStyle.bg,
                    }}
                  >
                    {t(`workflow.stepStatus.${step.status.toLowerCase()}`) || step.status}
                  </span>
                </div>
                {step.comments && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)', margin: '0.5rem 0 0' }}>{step.comments}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
