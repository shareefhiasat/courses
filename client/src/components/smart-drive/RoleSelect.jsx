import { useLang } from '@contexts/LangContext';
import { Shield } from 'lucide-react';

export default function RoleSelect({ value, onChange, disabled = false }) {
  const { t } = useLang();

  const roles = [
    { value: 'hr', label: t('roles.hr'), desc: t('roles.hrDesc') },
    { value: 'admin', label: t('roles.admin'), desc: t('roles.adminDesc') },
    { value: 'instructor', label: t('roles.instructor'), desc: t('roles.instructorDesc') },
    { value: 'student', label: t('roles.student'), desc: t('roles.studentDesc') },
  ];

  return (
    <div>
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          fontSize: '0.875rem',
          fontWeight: 500,
          color: 'var(--text, #111827)',
          marginBottom: '0.5rem',
        }}
      >
        <Shield className="w-4 h-4" aria-hidden="true" />
        {t('drive.selectRole')}
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
          fontSize: '0.875rem',
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
        <option value="">{t('drive.chooseRole')}</option>
        {roles.map(({ value: val, label }) => (
          <option key={val} value={val}>
            {label}
          </option>
        ))}
      </select>

      {value && (
        <p style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)' }}>
          {roles.find(r => r.value === value)?.desc}
        </p>
      )}
    </div>
  );
}
