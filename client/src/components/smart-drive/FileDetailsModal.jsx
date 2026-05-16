import { useState } from 'react';
import { X, Info, Clock, MessageSquare, Activity, GitBranch } from 'lucide-react';
import { useLang } from '@contexts/LangContext';
import Tabs from '@ui/Tabs/Tabs';
import DetailsTab from './tabs/DetailsTab';
import VersionsTab from './tabs/VersionsTab';
import CommentsTab from './tabs/CommentsTab';
import ActivityTab from './tabs/ActivityTab';
import WorkflowTab from './tabs/WorkflowTab';

/**
 * FileDetailsModal - Tabbed modal for file metadata, versions, comments, activity, workflow
 * Download-only preview (no in-browser rendering)
 */
export default function FileDetailsModal({ file, onClose, onDownload, onShare, onStar, onTrash }) {
  const { t } = useLang();
  const [activeTab, setActiveTab] = useState('details');

  const tabs = [
    { value: 'details', label: t('drive.details'), icon: <Info className="w-4 h-4" /> },
    { value: 'versions', label: t('drive.versions'), icon: <Clock className="w-4 h-4" /> },
    { value: 'comments', label: t('drive.comments'), icon: <MessageSquare className="w-4 h-4" /> },
    { value: 'activity', label: t('drive.activity'), icon: <Activity className="w-4 h-4" /> },
    { value: 'workflow', label: t('drive.workflow'), icon: <GitBranch className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="file-details-title"
      />
      {/* Modal */}
      <div 
        className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
        role="presentation"
      >
        <div 
          className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-700 shadow-2xl pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <header className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex-1 min-w-0 me-4">
              <h2 id="file-details-title" className="text-xl font-semibold text-gray-900 dark:text-white truncate">
                {file.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {file.mimeType}
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => onDownload?.(file.id)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                aria-label={t('drive.download')}
              >
                {t('drive.download')}
              </button>
              <button
                onClick={() => onShare?.(file)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                aria-label={t('drive.share')}
              >
                {t('drive.share')}
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                aria-label={t('close') || 'Close'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </header>

        {/* Tabs */}
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          variant="underline"
          size="md"
          className="border-b border-gray-200 dark:border-gray-700"
        />

        {/* Tab Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details' && <DetailsTab file={file} />}
          {activeTab === 'versions' && <VersionsTab fileId={file.id} />}
          {activeTab === 'comments' && <CommentsTab fileId={file.id} />}
          {activeTab === 'activity' && <ActivityTab fileId={file.id} />}
          {activeTab === 'workflow' && <WorkflowTab fileId={file.id} />}
        </main>
      </div>
    </div>
    </>
  );
}
