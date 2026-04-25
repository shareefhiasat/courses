import { useState, useEffect, useCallback } from 'react';
import { useLang } from '@contexts/LangContext';
import { GitBranch, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import axios from 'axios';

/**
 * WorkflowTab - WorkflowInstance status (read-only)
 */
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
      const response = await axios.get(`/api/v1/workflows`, {
        params: { fileId }
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

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED': return 'text-[#a5d6a7] bg-[#1d4e1d] border-[#2d6a2d]';
      case 'REJECTED': return 'text-[#ffb4ab] bg-[#4e1d1d] border-[#6a2d2d]';
      case 'PENDING': return 'text-[#ffd699] bg-[#4e3d1d] border-[#6a5d2d]';
      case 'REVISED': return 'text-[#b4c5ff] bg-[#1d2d4e] border-[#2d3d6a]';
      default: return 'text-[#8d90a0] bg-[#1d1f27] border-[#434655]/30';
    }
  };

  const formatDate = (date) => {
    if (!date) return '—';
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString();
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-[#8d90a0]">
        {t('common.loading')}...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-sm text-[#ffb4ab]">
        {error}
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="p-8 text-center text-sm text-[#8d90a0]">
        <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-50" />
        {t('drive.noWorkflow')}
      </div>
    );
  }

  const StatusIcon = getStatusIcon(workflow.status);
  const statusColorClass = getStatusColor(workflow.status);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">
        {t('drive.workflowStatus')}
      </h3>

      {/* Workflow Header */}
      <div className={`p-4 rounded-lg border ${statusColorClass}`}>
        <div className="flex items-center gap-3 mb-3">
          <StatusIcon className="w-6 h-6" />
          <div className="flex-1">
            <h4 className="font-semibold">
              {workflow.definition?.name || t('drive.workflow')}
            </h4>
            <p className="text-xs opacity-80 mt-0.5">
              {workflow.definition?.description}
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-black/20">
            {t(`workflow.status.${workflow.status.toLowerCase()}`) || workflow.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="opacity-70 text-xs mb-1">{t('drive.initiatedBy')}</p>
            <p className="font-medium">
              {workflow.initiatedBy?.displayName || workflow.initiatedBy?.email || '—'}
            </p>
          </div>
          <div>
            <p className="opacity-70 text-xs mb-1">{t('drive.initiatedAt')}</p>
            <p className="font-medium">
              {formatDate(workflow.createdAt)}
            </p>
          </div>
        </div>

        {workflow.completedAt && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="opacity-70 text-xs mb-1">{t('drive.completedAt')}</p>
            <p className="font-medium text-sm">
              {formatDate(workflow.completedAt)}
            </p>
          </div>
        )}
      </div>

      {/* Current Stage */}
      {workflow.currentStage && (
        <div className="p-4 bg-[#1d1f27] rounded-lg border border-[#434655]/30">
          <h5 className="text-sm font-semibold text-white mb-2">
            {t('drive.currentStage')}
          </h5>
          <p className="text-sm text-[#e1e2ed]">
            {workflow.currentStage.name}
          </p>
          <p className="text-xs text-[#8d90a0] mt-1">
            {t('drive.assignedTo')}: {workflow.currentStage.assignedRole}
          </p>
        </div>
      )}

      {/* Workflow Steps */}
      {workflow.steps && workflow.steps.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-sm font-semibold text-white">
            {t('drive.workflowSteps')} ({workflow.steps.length})
          </h5>
          {workflow.steps.map((step, idx) => (
            <div
              key={step.id}
              className="p-3 bg-[#1d1f27] rounded-lg border border-[#434655]/30 text-sm"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-white">
                  {step.stage?.name || `${t('drive.step')} ${idx + 1}`}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  step.status === 'COMPLETED' ? 'bg-[#1d4e1d] text-[#a5d6a7]' : 'bg-[#32343d] text-[#8d90a0]'
                }`}>
                  {t(`workflow.stepStatus.${step.status.toLowerCase()}`) || step.status}
                </span>
              </div>
              {step.comments && (
                <p className="text-xs text-[#8d90a0] mt-2">
                  {step.comments}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
