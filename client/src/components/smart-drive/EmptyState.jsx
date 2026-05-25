import { useLang } from '@contexts/LangContext';
import { getThemedIcon } from '@constants/iconTypes';

/**
 * EmptyState - Contextual empty states for different scenarios
 * Types: no-files, no-results, trash-empty, shared-empty
 */
export default function EmptyState({ type = 'no-files', onUpload, onCreateFolder }) {
  const { t } = useLang();

  const states = {
    'no-files': {
      icon: 'x_circle',
      title: t('drive.empty.noFiles'),
      description: t('drive.empty.noFilesDesc'),
      actions: [
        { label: t('drive.uploadFiles'), icon: 'upload', onClick: onUpload, primary: true },
        { label: t('drive.createFolder'), icon: 'folder', onClick: onCreateFolder },
      ],
    },
    'no-results': {
      icon: 'search',
      title: t('drive.empty.noResults'),
      description: t('drive.empty.noResultsDesc'),
      actions: [],
    },
    'trash-empty': {
      icon: 'trash2',
      title: t('drive.empty.trashEmpty'),
      description: t('drive.empty.trashEmptyDesc'),
      actions: [],
    },
    'shared-empty': {
      icon: 'x_circle',
      title: t('drive.empty.sharedEmpty'),
      description: t('drive.empty.sharedEmptyDesc'),
      actions: [],
    },
  };

  const state = states[type] || states['no-files'];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-[#f3f4f6] flex items-center justify-center mb-6">
        {getThemedIcon('ui', state.icon, 40, 'muted')}
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
                {getThemedIcon('ui', action.icon, 16, action.primary ? 'white' : 'currentColor')}
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
