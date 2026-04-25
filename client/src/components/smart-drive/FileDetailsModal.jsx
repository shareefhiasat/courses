import { useState } from 'react';
import { X, Info, Clock, MessageSquare, Activity, GitBranch } from 'lucide-react';
import { useLang } from '@contexts/LangContext';
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
    { id: 'details', label: t('drive.details'), icon: Info },
    { id: 'versions', label: t('drive.versions'), icon: Clock },
    { id: 'comments', label: t('drive.comments'), icon: MessageSquare },
    { id: 'activity', label: t('drive.activity'), icon: Activity },
    { id: 'workflow', label: t('drive.workflow'), icon: GitBranch },
  ];

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-[#191b23] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-[#434655]/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#434655]/10 flex-shrink-0">
          <div className="flex-1 min-w-0 me-4">
            <h2 className="text-xl font-semibold text-white truncate">
              {file.name}
            </h2>
            <p className="text-sm text-[#8d90a0] mt-1">
              {file.mimeType}
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => onDownload?.(file.id)}
              className="px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#2563eb]/90 transition-colors text-sm font-medium"
            >
              {t('drive.download')}
            </button>
            <button
              onClick={() => onShare?.(file)}
              className="px-4 py-2 bg-[#32343d] text-white rounded-lg hover:bg-[#434655] transition-colors text-sm font-medium"
            >
              {t('drive.share')}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-[#8d90a0] hover:text-white hover:bg-[#32343d] rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#434655]/10 overflow-x-auto flex-shrink-0">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === id
                  ? 'border-[#2563eb] text-[#b4c5ff]'
                  : 'border-transparent text-[#8d90a0] hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details' && <DetailsTab file={file} />}
          {activeTab === 'versions' && <VersionsTab fileId={file.id} />}
          {activeTab === 'comments' && <CommentsTab fileId={file.id} />}
          {activeTab === 'activity' && <ActivityTab fileId={file.id} />}
          {activeTab === 'workflow' && <WorkflowTab fileId={file.id} />}
        </div>
      </div>
    </div>
  );
}
