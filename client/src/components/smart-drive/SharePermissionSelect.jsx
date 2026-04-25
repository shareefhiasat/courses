import { useLang } from '@contexts/LangContext';
import { Eye, Download, MessageSquare, Edit } from 'lucide-react';

/**
 * SharePermissionSelect - Dropdown for selecting SharePermission level
 * Supports: VIEW, DOWNLOAD, COMMENT, EDIT
 */
export default function SharePermissionSelect({ value, onChange, disabled = false }) {
  const { t } = useLang();

  const permissions = [
    { value: 'VIEW', label: t('drive.permission.view'), icon: Eye, desc: t('drive.permission.viewDesc') },
    { value: 'DOWNLOAD', label: t('drive.permission.download'), icon: Download, desc: t('drive.permission.downloadDesc') },
    { value: 'COMMENT', label: t('drive.permission.comment'), icon: MessageSquare, desc: t('drive.permission.commentDesc') },
    { value: 'EDIT', label: t('drive.permission.edit'), icon: Edit, desc: t('drive.permission.editDesc') },
  ];

  return (
    <div>
      <label className="block text-sm font-medium text-[#e1e2ed] mb-2">
        {t('drive.permission')}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 border border-[#434655]/30 rounded-lg bg-[#1d1f27] text-white focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {permissions.map(({ value: val, label, icon: Icon }) => (
          <option key={val} value={val}>
            {label}
          </option>
        ))}
      </select>
      
      {/* Permission description */}
      <p className="mt-1.5 text-xs text-[#8d90a0]">
        {permissions.find(p => p.value === value)?.desc}
      </p>
    </div>
  );
}
