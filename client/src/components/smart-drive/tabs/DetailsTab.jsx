import { useLang } from '@contexts/LangContext';
import { File, Calendar, User, HardDrive, Folder } from 'lucide-react';

/**
 * DetailsTab - File metadata display
 */
export default function DetailsTab({ file }) {
  const { t } = useLang();

  const formatSize = (bytes) => {
    if (!bytes && bytes !== 0) return '—';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  };

  const formatDate = (date) => {
    if (!date) return '—';
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString();
  };

  const details = [
    {
      icon: File,
      label: t('drive.fileName'),
      value: file.name,
    },
    {
      icon: HardDrive,
      label: t('drive.fileSize'),
      value: formatSize(file.size),
    },
    {
      icon: File,
      label: t('drive.mimeType'),
      value: file.mimeType || '—',
    },
    {
      icon: User,
      label: t('drive.owner'),
      value: file.owner?.displayName || file.owner?.email || '—',
    },
    {
      icon: Folder,
      label: t('drive.location'),
      value: file.folderPath || t('drive.myDrive'),
    },
    {
      icon: Calendar,
      label: t('drive.created'),
      value: formatDate(file.createdAt),
    },
    {
      icon: Calendar,
      label: t('drive.modified'),
      value: formatDate(file.updatedAt),
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">
        {t('drive.fileDetails')}
      </h3>

      <div className="space-y-3">
        {details.map(({ icon: Icon, label, value }, idx) => (
          <div
            key={idx}
            className="flex items-start gap-3 p-3 bg-[#1d1f27] rounded-lg border border-[#434655]/30"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#32343d] flex items-center justify-center">
              <Icon className="w-5 h-5 text-[#b4c5ff]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#8d90a0] mb-1">
                {label}
              </p>
              <p className="text-sm font-medium text-white break-all">
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Checksum if available */}
      {file.checksumSha256 && (
        <div className="mt-4 p-3 bg-[#1d1f27] rounded-lg border border-[#434655]/30">
          <p className="text-sm text-[#8d90a0] mb-1">
            {t('drive.checksum')} (SHA-256)
          </p>
          <p className="text-xs font-mono text-white break-all">
            {file.checksumSha256}
          </p>
        </div>
      )}
    </div>
  );
}
