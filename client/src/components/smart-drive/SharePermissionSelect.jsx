import { useLang } from '@contexts/LangContext';
import { getThemedIcon } from '@constants/iconTypes';

export default function SharePermissionSelect({ value, onChange, disabled = false }) {
  const { t } = useLang();

  const permissions = [
    { value: 'VIEW', label: t('drive.permission.view'), icon: 'eye', desc: t('drive.permission.viewDesc') },
    { value: 'DOWNLOAD', label: t('drive.permission.download'), icon: 'download', desc: t('drive.permission.downloadDesc') },
    { value: 'COMMENT', label: t('drive.permission.comment'), icon: 'message', desc: t('drive.permission.commentDesc') },
    { value: 'EDIT', label: t('drive.permission.edit'), icon: 'edit', desc: t('drive.permission.editDesc') },
  ];

  const selectedPerm = permissions.find(p => p.value === value);
  const selectedIcon = selectedPerm?.icon || 'eye';

  return (
    <div>
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          fontSize: 'var(--font-size-sm)',
          fontWeight: 500,
          color: 'var(--text, #111827)',
          marginBottom: '0.5rem',
        }}
      >
        {getThemedIcon('ui', selectedIcon, 16, 'light')}
        {t('drive.permission')}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '0.75rem 0.875rem',
          border: '1px solid var(--border, #d1d5db)',
          borderRadius: '0.5rem',
          background: 'var(--panel, white)',
          color: 'var(--text, #111827)',
          fontSize: 'var(--font-size-sm)',
          outline: 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
          minHeight: '2.75rem',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-primary, #2563eb)';
          e.currentTarget.style.boxShadow = '0 0 0 2px var(--color-primary-alpha, rgba(37, 99, 235, 0.2))';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--border, #d1d5db)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {permissions.map(({ value: val, label }) => (
          <option key={val} value={val}>
            {label}
          </option>
        ))}
      </select>

      {selectedPerm && (
        <p style={{ marginTop: '0.375rem', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted, #6b7280)' }}>
          {selectedPerm.desc}
        </p>
      )}
    </div>
  );
}
