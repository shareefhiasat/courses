import React from 'react';
import { useLang } from '@contexts/LangContext';
import { resolveUserRole, ROLE_DISPLAY_NAMES } from '@utils/userUtils';
import { getIconWithColor, getUserRoleColor } from '@constants/iconTypes';

/**
 * Shared role badge component for chat UI.
 * Renders a role icon + label with consistent styling.
 *
 * Props:
 * - user: user object (any format — Prisma, Keycloak, normalized)
 * - size: icon size in px (default 12)
 * - fontSize: label font size (default '0.7rem')
 * - showLabel: whether to show text label (default true)
 * - style: additional styles to merge
 */
const RoleBadge = ({ user, size = 12, fontSize = '0.7rem', showLabel = true, style }) => {
  const { t } = useLang();
  const role = resolveUserRole(user);
  if (!role) return null;

  const color = getUserRoleColor(role);
  const normalizedRole = role.toLowerCase();
  const label = t(`role_label_${normalizedRole}`) || ROLE_DISPLAY_NAMES[role?.toUpperCase()] || normalizedRole;
  const icon = getIconWithColor('user_role', normalizedRole, size, color);

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: showLabel ? 2 : 0,
        fontSize,
        background: `${color}15`,
        color,
        padding: '1px 5px',
        borderRadius: 8,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        flexShrink: 0,
        ...style,
      }}
      title={label}
    >
      {icon}
      {showLabel && label}
    </span>
  );
};

export default RoleBadge;
