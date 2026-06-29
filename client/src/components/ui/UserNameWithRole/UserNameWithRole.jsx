import React from 'react';
import { useLang } from '@contexts/LangContext';
import { getUserRoleIcon, getUserRoleColor } from '@constants/iconTypes';
import { getLocalizedUserName } from '@utils/localizedUserName';
import { getUserRoleFromObject } from '@utils/userUtils';

export { getUserRoleFromObject };

export default function UserNameWithRole({ user, lang, fallback = '\u2014', size = 12, showName = true, style }) {
  const { t } = useLang();
  const role = getUserRoleFromObject(user);
  const icon = role ? getUserRoleIcon(role) : null;
  const color = role ? getUserRoleColor(role) : null;

  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', ...style }}>
      {showName && (
        <span>{getLocalizedUserName(user, lang, fallback)}</span>
      )}
      {role && icon && (
        <span
          title={t(`roles.${role}`, role)}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          {React.cloneElement(icon, { color, size })}
        </span>
      )}
    </span>
  );
}
