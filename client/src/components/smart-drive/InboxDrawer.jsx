/**
 * InboxDrawer Component
 *
 * Side drawer displaying pending workflow approvals.
 * Allows users to approve/reject tasks directly from the inbox.
 */

import React, { useState } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import { Button, Input } from '@ui';
import WorkflowBadge from './WorkflowBadge';

export default function InboxDrawer({ isOpen, onClose, tasks, onApprove, onReject }) {
  const { t, isRTL } = useLang();
  const { theme } = useTheme();
  const [selectedTask, setSelectedTask] = useState(null);
  const [comment, setComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const CloseIcon = getThemedIcon('x');
  const CheckIcon = getThemedIcon('check');
  const XIcon = getThemedIcon('x');
  const FileIcon = getThemedIcon('file');

  const handleApprove = async (task) => {
    setActionLoading(true);
    const result = await onApprove(task.id, comment);
    setActionLoading(false);
    if (result.success) {
      setComment('');
      setSelectedTask(null);
    }
  };

  const handleReject = async (task) => {
    setActionLoading(true);
    const result = await onReject(task.id, comment || 'Rejected');
    setActionLoading(false);
    if (result.success) {
      setComment('');
      setSelectedTask(null);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 ${isRTL ? 'left-0' : 'right-0'} h-full w-96 bg-white dark:bg-gray-800 shadow-2xl z-50 flex flex-col transition-transform`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {t('Pending Approvals')} ({tasks.length})
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <CloseIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {tasks.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <FileIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{t('No pending approvals')}</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                      {task.definition?.name || 'Workflow Approval'}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {t('Initiated by')}: {task.initiatedBy?.name || 'Unknown'}
                    </p>
                  </div>
                  <WorkflowBadge
                    status={task.status}
                    currentStage={task.currentStage?.name}
                    compact
                  />
                </div>

                {task.currentStage && (
                  <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border-l-4 border-blue-400">
                    <p className="text-xs font-medium text-blue-900 dark:text-blue-300">
                      {t('Current Stage')}: {task.currentStage.name}
                    </p>
                    {task.steps?.[0]?.slaDeadline && (
                      <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                        {t('Due')}: {new Date(task.steps[0].slaDeadline).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {selectedTask?.id === task.id ? (
                  <div className="mt-3 space-y-2">
                    <Input
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder={t('Add comment (optional)')}
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprove(task)}
                        disabled={actionLoading}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm py-2"
                      >
                        <CheckIcon className="w-4 h-4 me-1" />
                        {t('Approve')}
                      </Button>
                      <Button
                        onClick={() => handleReject(task)}
                        disabled={actionLoading}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm py-2"
                      >
                        <XIcon className="w-4 h-4 me-1" />
                        {t('Reject')}
                      </Button>
                      <Button
                        onClick={() => setSelectedTask(null)}
                        disabled={actionLoading}
                        className="px-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm py-2"
                      >
                        {t('Cancel')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => setSelectedTask(task)}
                    className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2"
                  >
                    {t('Review & Approve')}
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
