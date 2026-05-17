import { useState } from 'react';
import { Info, Clock, MessageSquare, Activity, GitBranch } from 'lucide-react';
import { useLang } from '@contexts/LangContext';
import Modal from '@ui/Modal/Modal';
import Button from '@ui/Button/Button';
import Tabs from '@ui/Tabs/Tabs';
import DetailsTab from './tabs/DetailsTab';
import VersionsTab from './tabs/VersionsTab';
import CommentsTab from './tabs/CommentsTab';
import ActivityTab from './tabs/ActivityTab';
import WorkflowTab from './tabs/WorkflowTab';

export default function FileDetailsModal({ file, onClose, onDownload, onShare, onStar, onTrash }) {
  const { t } = useLang();
  const [activeTab, setActiveTab] = useState('details');

  const tabs = [
    { value: 'details', label: t('drive.details'), icon: <Info className="w-4 h-4" aria-hidden="true" /> },
    { value: 'versions', label: t('drive.versions'), icon: <Clock className="w-4 h-4" aria-hidden="true" /> },
    { value: 'comments', label: t('drive.comments'), icon: <MessageSquare className="w-4 h-4" aria-hidden="true" /> },
    { value: 'activity', label: t('drive.activity'), icon: <Activity className="w-4 h-4" aria-hidden="true" /> },
    { value: 'workflow', label: t('drive.workflow'), icon: <GitBranch className="w-4 h-4" aria-hidden="true" /> },
  ];

  const footer = (
    <div className="flex items-center gap-3">
      {onDownload && (
        <Button variant="primary" onClick={() => onDownload(file.id)}>
          {t('drive.download')}
        </Button>
      )}
      {onShare && (
        <Button variant="secondary" onClick={() => onShare(file)}>
          {t('drive.share')}
        </Button>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={file.name}
      size="large"
      showCloseButton={true}
      footer={footer}
      titleStyle={{ fontSize: '1.25rem', fontWeight: '600' }}
    >
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant="default"
        size="md"
        className="mb-5"
      />

      <div className="min-h-[320px]">
        {activeTab === 'details' && <DetailsTab file={file} />}
        {activeTab === 'versions' && <VersionsTab fileId={file.id} />}
        {activeTab === 'comments' && <CommentsTab fileId={file.id} />}
        {activeTab === 'activity' && <ActivityTab fileId={file.id} />}
        {activeTab === 'workflow' && <WorkflowTab fileId={file.id} />}
      </div>
    </Modal>
  );
}
