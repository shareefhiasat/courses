import { useState, useEffect, useCallback } from 'react';
import { useLang } from '@contexts/LangContext';
import { GitBranch, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import axios from 'axios';

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

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED': return 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'REJECTED': return 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'PENDING': return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
      case 'REVISED': return 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default: return 'text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800/80 border-gray-200 dark:border-gray-700';
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
      <div className="flex items-center justify-center h-48 text-sm text-gray-500 dark:text-gray-400" role="status">
        {t('common.loading')}&hellip;
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-red-600 dark:text-red-400" role="alert">
        {error}
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-sm text-gray-500 dark:text-gray-400">
        <GitBranch className="w-10 h-10 mb-3 opacity-50" aria-hidden="true" />
        {t('drive.noWorkflow')}
      </div>
    );
  }

  const StatusIcon = getStatusIcon(workflow.status);
  const statusColorClass = getStatusColor(workflow.status);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {t('drive.workflowStatus')}
      </h3>

      <div className={`p-4 rounded-xl border ${statusColorClass}`}>
        <div className="flex items-center gap-3 mb-3">
          <StatusIcon className="w-6 h-6" aria-hidden="true" />
          <div className="flex-1">
            <h4 className="font-semibold text-current">
              {workflow.definition?.name || t('drive.workflow')}
            </h4>
            <p className="text-xs opacity-80 mt-0.5 text-current">
              {workflow.definition?.description}
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-black/10 dark:bg-white/10 text-current">
            {t(`workflow.status.${workflow.status.toLowerCase()}`) || workflow.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm text-current">
          <div>
            <p className="opacity-70 text-xs mb-1">{t('drive.initiatedBy')}</p>
            <p className="font-medium">{workflow.initiatedBy?.displayName || workflow.initiatedBy?.email || '\u2014'}</p>
          </div>
          <div>
            <p className="opacity-70 text-xs mb-1">{t('drive.initiatedAt')}</p>
            <p className="font-medium">{formatDate(workflow.createdAt)}</p>
          </div>
        </div>

        {workflow.completedAt && (
          <div className="mt-3 pt-3 border-t border-current/10">
            <p className="opacity-70 text-xs mb-1">{t('drive.completedAt')}</p>
            <p className="font-medium text-sm">{formatDate(workflow.completedAt)}</p>
          </div>
        )}
      </div>

      {workflow.currentStage && (
        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
          <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            {t('drive.currentStage')}
          </h5>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {workflow.currentStage.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t('drive.assignedTo')}: {workflow.currentStage.assignedRole}
          </p>
        </div>
      )}

      {workflow.steps && workflow.steps.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-sm font-semibold text-gray-900 dark:text-white">
            {t('drive.workflowSteps')} ({workflow.steps.length})
          </h5>
          {workflow.steps.map((step, idx) => (
            <div
              key={step.id}
              className="p-3 bg-white rounded-xl border border-gray-200 shadow-sm text-sm"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-900 dark:text-white">
                  {step.stage?.name || `${t('drive.step')} ${idx + 1}`}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  step.status === 'COMPLETED'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                  {t(`workflow.stepStatus.${step.status.toLowerCase()}`) || step.status}
                </span>
              </div>
              {step.comments && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{step.comments}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
