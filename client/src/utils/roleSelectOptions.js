import { getUserRoleIcon } from '@constants/iconTypes';
import { ROLE_STRINGS } from '@utils/userUtils';

const ROLE_ICON_COLORS = {
  [ROLE_STRINGS.STUDENT]: '#16a34a',
  [ROLE_STRINGS.INSTRUCTOR]: '#0ea5e9',
  [ROLE_STRINGS.HR]: '#8b5cf6',
  [ROLE_STRINGS.ADMIN]: '#4f46e5',
  [ROLE_STRINGS.SUPER_ADMIN]: '#f59e0b',
};

const ROLE_ICON_KEYS = {
  [ROLE_STRINGS.STUDENT]: 'student',
  [ROLE_STRINGS.INSTRUCTOR]: 'instructor',
  [ROLE_STRINGS.HR]: 'hr',
  [ROLE_STRINGS.ADMIN]: 'admin',
  [ROLE_STRINGS.SUPER_ADMIN]: 'super_admin',
};

export function getRoleSelectIcon(role) {
  const key = ROLE_ICON_KEYS[role] || 'student';
  return getUserRoleIcon(key);
}

export function getRoleSelectColor(role) {
  return ROLE_ICON_COLORS[role] || ROLE_ICON_COLORS[ROLE_STRINGS.STUDENT];
}

const ROLE_LABEL_KEYS = {
  [ROLE_STRINGS.STUDENT]: 'student',
  [ROLE_STRINGS.INSTRUCTOR]: 'instructor',
  [ROLE_STRINGS.HR]: 'hr',
  [ROLE_STRINGS.ADMIN]: 'admin',
  [ROLE_STRINGS.SUPER_ADMIN]: 'super_admin',
};

export function buildRoleSelectOptions(t, {
  includeRoles = Object.values(ROLE_STRINGS),
  excludeRoles = [],
} = {}) {
  const excluded = new Set(excludeRoles);

  return includeRoles
    .filter((role) => !excluded.has(role))
    .map((role) => ({
      value: role,
      label: t(ROLE_LABEL_KEYS[role] || role) || role,
      icon: getRoleSelectIcon(role),
      color: getRoleSelectColor(role),
    }));
}

export const DRIVE_SHARE_ROLES = [
  ROLE_STRINGS.HR,
  ROLE_STRINGS.ADMIN,
  ROLE_STRINGS.INSTRUCTOR,
  ROLE_STRINGS.SUPER_ADMIN,
];
