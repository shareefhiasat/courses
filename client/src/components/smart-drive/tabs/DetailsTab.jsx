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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
        {details.map(({ icon: Icon, label, value }, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem',
              background: 'var(--panel, white)',
              borderRadius: '0.75rem',
              border: '1px solid var(--border, #e5e7eb)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            <div
              style={{
                flexShrink: 0,
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '0.5rem',
                background: 'var(--color-primary-alpha, rgba(37, 99, 235, 0.1))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon className="w-5 h-5" style={{ color: 'var(--color-primary, #2563eb)' }} aria-hidden="true" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text, #111827)', margin: 0, marginBottom: '0.125rem' }}>
                {label}
              </p>
              <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text, #111827)', margin: 0, wordBreak: 'break-all' }}>
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {file.checksumSha256 && (
        <div
          style={{
            padding: '1rem',
            background: 'var(--panel, white)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border, #e5e7eb)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            marginTop: '0.75rem',
          }}
        >
          <p style={{ fontSize: '0.875rem', color: 'var(--text, #111827)', margin: 0, marginBottom: '0.25rem' }}>
            {t('drive.checksum')} ({t('drive.checksumSha256') || 'SHA-256'})
          </p>
          <p style={{ fontSize: '0.75rem', fontFamily: 'ui-monospace, monospace', color: 'var(--text, #111827)', margin: 0, wordBreak: 'break-all' }}>
            {file.checksumSha256}
          </p>
        </div>
      )}
    </div>
  );
}
