import React, { useMemo } from 'react';
import { useLang } from '@contexts/LangContext';
import MultiSelect from '@components/ui/MultiSelect';
import { buildRoleSelectOptions, DRIVE_SHARE_ROLES } from '@utils/roleSelectOptions';
import { ROLE_STRINGS } from '@utils/userUtils';

/**
 * RoleMultiSelect — multi-role picker matching the Users page form control.
 */
export default function RoleMultiSelect({
  label,
  value = [],
  onChange,
  placeholder,
  disabled = false,
  required = false,
  includeRoles,
  excludeRoles = [],
  fullWidth = true,
  className = '',
  style = {},
}) {
  const { t } = useLang();

  const options = useMemo(
    () => buildRoleSelectOptions(t, {
      includeRoles: includeRoles || Object.values(ROLE_STRINGS),
      excludeRoles,
    }),
    [t, includeRoles, excludeRoles]
  );

  return (
    <MultiSelect
      label={label}
      required={required}
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder || t('select_roles') || 'Select roles...'}
      searchPlaceholder={t('search') || 'Search...'}
      disabled={disabled}
      fullWidth={fullWidth}
      className={className}
      style={style}
    />
  );
}

export { DRIVE_SHARE_ROLES };
