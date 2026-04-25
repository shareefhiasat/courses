import { useLang } from '@contexts/LangContext';
import { FileX, Search, Trash2, Upload, FolderPlus } from 'lucide-react';

/**
 * EmptyState - Contextual empty states for different scenarios
 * Types: no-files, no-results, trash-empty, shared-empty
 */
export default function EmptyState({ type = 'no-files', onUpload, onCreateFolder }) {
  const { t } = useLang();

  const states = {
    'no-files': {
      icon: FileX,
      title: t('drive.empty.noFiles'),
      description: t('drive.empty.noFilesDesc'),
      actions: [
        { label: t('drive.uploadFiles'), icon: Upload, onClick: onUpload, primary: true },
        { label: t('drive.createFolder'), icon: FolderPlus, onClick: onCreateFolder },
      ],
    },
    'no-results': {
      icon: Search,
      title: t('drive.empty.noResults'),
      description: t('drive.empty.noResultsDesc'),
      actions: [],
    },
    'trash-empty': {
      icon: Trash2,
      title: t('drive.empty.trashEmpty'),
      description: t('drive.empty.trashEmptyDesc'),
      actions: [],
    },
    'shared-empty': {
      icon: FileX,
      title: t('drive.empty.sharedEmpty'),
      description: t('drive.empty.sharedEmptyDesc'),
      actions: [],
    },
  };

  const state = states[type] || states['no-files'];
  const Icon = state.icon;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-[#f3f4f6] flex items-center justify-center mb-6">
        <Icon className="w-10 h-10 text-[#9ca3af]" />
      </div>

      <h3 className="text-xl font-semibold text-[#111827] mb-2">
        {state.title}
      </h3>

      <p className="text-sm text-[#6b7280] mb-6 max-w-md">
        {state.description}
      </p>

      {state.actions.length > 0 && (
        <div className="flex items-center gap-3">
          {state.actions.map((action, idx) => {
            const ActionIcon = action.icon;
            return (
              <button
                key={idx}
                onClick={action.onClick}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  action.primary
                    ? 'bg-[#2563eb] text-white hover:bg-[#2563eb]/90'
                    : 'bg-[#f3f4f6] text-[#374151] hover:bg-[#e5e7eb]'
                }`}
              >
                <ActionIcon className="w-4 h-4" />
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
