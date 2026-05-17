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
      <label className="flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-white mb-2">
        <Shield className="w-4 h-4" aria-hidden="true" />
        {t('drive.selectRole')}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">{t('drive.chooseRole')}</option>
        {roles.map(({ value: val, label }) => (
          <option key={val} value={val}>
            {label}
          </option>
        ))}
      </select>

      {value && (
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
          {roles.find(r => r.value === value)?.desc}
        </p>
      )}
    </div>
  );
}
