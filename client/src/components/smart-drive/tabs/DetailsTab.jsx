import { useLang } from '@contexts/LangContext';
import { File, Calendar, User, HardDrive, Folder } from 'lucide-react';

export default function DetailsTab({ file }) {
  const { t } = useLang();

  const formatSize = (bytes) => {
    if (!bytes && bytes !== 0) return '\u2014';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  };

  const formatDate = (date) => {
    if (!date) return '\u2014';
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '\u2014';
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
      value: file.mimeType || '\u2014',
    },
    {
      icon: User,
      label: t('drive.owner'),
      value: file.owner?.displayName || file.owner?.email || '\u2014',
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
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {t('drive.fileDetails')}
      </h3>

      <div className="grid grid-cols-1 gap-3">
        {details.map(({ icon: Icon, label, value }, idx) => (
          <div
            key={idx}
            className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Icon className="w-5 h-5 text-blue-600" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 mb-0.5">
                {label}
              </p>
              <p className="text-sm font-medium text-gray-900 break-all">
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {file.checksumSha256 && (
        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm mt-3">
          <p className="text-sm text-gray-900 mb-1">
            {t('drive.checksum')} (SHA-256)
          </p>
          <p className="text-xs font-mono text-gray-900 break-all">
            {file.checksumSha256}
          </p>
        </div>
      )}
    </div>
  );
}
