import { useLang } from '@contexts/LangContext';
import { Shield } from 'lucide-react';

/**
 * RoleSelect - Dropdown for selecting Keycloak roles
 * Supports: hr, admin, instructor, student
 */
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
      <label className="block text-sm font-medium text-[#e1e2ed] mb-2">
        <Shield className="w-4 h-4 inline me-1" />
        {t('drive.selectRole')}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 border border-[#434655]/30 rounded-lg bg-[#1d1f27] text-white focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">{t('drive.chooseRole')}</option>
        {roles.map(({ value: val, label }) => (
          <option key={val} value={val}>
            {label}
          </option>
        ))}
      </select>
      
      {value && (
        <p className="mt-1.5 text-xs text-[#8d90a0]">
          {roles.find(r => r.value === value)?.desc}
        </p>
      )}
    </div>
  );
}
