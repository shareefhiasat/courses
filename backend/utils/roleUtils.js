/**
 * Role normalization and hierarchy helpers (backend).
 */

import { LMS_ROLES as ROLES } from '../services/keycloakAdminService.js';

const ROLE_HIERARCHY = [
  ROLES.STUDENT,
  ROLES.INSTRUCTOR,
  ROLES.HR,
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN,
];

export function normalizeRoles(roles = []) {
  return roles.map((r) => {
    const lower = String(r).toLowerCase();
    if (lower === 'super-admin' || lower === 'superadmin' || lower === 'super_admin') return ROLES.SUPER_ADMIN;
    if (lower === 'admin') return ROLES.ADMIN;
    if (lower === 'hr') return ROLES.HR;
    if (lower === 'instructor') return ROLES.INSTRUCTOR;
    if (lower === 'student') return ROLES.STUDENT;
    return lower;
  });
}

export function hasRole(roles, role) {
  return normalizeRoles(roles).includes(role);
}

export function isSuperAdmin(roles) {
  return hasRole(roles, ROLES.SUPER_ADMIN);
}

export function isHR(roles) {
  return hasRole(roles, ROLES.HR);
}

export function getHighestRole(roles = []) {
  const normalized = normalizeRoles(roles);
  let highest = null;
  let highestIndex = -1;
  normalized.forEach((role) => {
    const idx = ROLE_HIERARCHY.indexOf(role);
    if (idx > highestIndex) {
      highestIndex = idx;
      highest = role;
    }
  });
  return highest;
}

export function getEffectiveRoles(roles = []) {
  return [...new Set(normalizeRoles(roles))];
}

export default {
  normalizeRoles,
  hasRole,
  isSuperAdmin,
  isHR,
  getHighestRole,
  getEffectiveRoles,
  ROLES,
};
