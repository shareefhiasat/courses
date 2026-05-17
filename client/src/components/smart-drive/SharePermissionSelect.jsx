import { useLang } from '@contexts/LangContext';
import { Eye, Download, MessageSquare, Edit } from 'lucide-react';

export default function SharePermissionSelect({ value, onChange, disabled = false }) {
  const { t } = useLang();

  const permissions = [
    { value: 'VIEW', label: t('drive.permission.view'), icon: Eye, desc: t('drive.permission.viewDesc') },
    { value: 'DOWNLOAD', label: t('drive.permission.download'), icon: Download, desc: t('drive.permission.downloadDesc') },
    { value: 'COMMENT', label: t('drive.permission.comment'), icon: MessageSquare, desc: t('drive.permission.commentDesc') },
    { value: 'EDIT', label: t('drive.permission.edit'), icon: Edit, desc: t('drive.permission.editDesc') },
  ];

  const selectedPerm = permissions.find(p => p.value === value);
  const SelectedIcon = selectedPerm?.icon || Eye;

  return (
    <div>
      <label className="flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-white mb-2">
        <SelectedIcon className="w-4 h-4" aria-hidden="true" />
        {t('drive.permission')}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {permissions.map(({ value: val, label }) => (
          <option key={val} value={val}>
            {label}
          </option>
        ))}
      </select>

      {selectedPerm && (
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
          {selectedPerm.desc}
        </p>
      )}
    </div>
  );
}
