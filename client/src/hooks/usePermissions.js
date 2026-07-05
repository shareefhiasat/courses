import { useMemo } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { resolveScreenIdFromNavItem } from '@config/navigationRegistry.js';
import { hasPermissionWithDeps } from '@constants/permissionDependencies.js';

const ROLE_HIERARCHY = ['student', 'instructor', 'hr', 'admin', 'super_admin'];

function roleHasPermission(operation, roleCode) {
  const perm = operation.permissions.find((p) => p.role === roleCode);
  return Boolean(perm?.allowed);
}

export const usePermissions = () => {
  const {
    isSuperAdmin,
    isHR,
    isAdmin,
    isInstructor,
    isStudent,
    permissions: permissionsData,
    permissionsLoading,
    loading: authLoading,
    initialized,
    refetchPermissions,
  } = useAuth();

  const roleCodes = useMemo(() => {
    const roles = [];
    if (isSuperAdmin) roles.push('super_admin');
    if (isAdmin) roles.push('admin');
    if (isHR) roles.push('hr');
    if (isInstructor) roles.push('instructor');
    if (isStudent) roles.push('student');
    return roles;
  }, [isSuperAdmin, isHR, isAdmin, isInstructor, isStudent]);

  const highestRoleCode = useMemo(() => {
    if (roleCodes.length === 0) return null;
    let highestIndex = -1;
    let highestRole = null;
    roleCodes.forEach((r) => {
      const index = ROLE_HIERARCHY.indexOf(r);
      if (index > highestIndex) {
        highestIndex = index;
        highestRole = r;
      }
    });
    return highestRole;
  }, [roleCodes]);

  const loading = authLoading
    || permissionsLoading
    || (initialized && roleCodes.length > 0 && !permissionsData);

  // Union: allowed if ANY of the user's roles grants the operation
  const permissions = useMemo(() => {
    if (!permissionsData || roleCodes.length === 0) return {};

    const result = {};
    permissionsData.forEach((screen) => {
      screen.operations.forEach((operation) => {
        const allowed = roleCodes.some((roleCode) => roleHasPermission(operation, roleCode));
        if (allowed) {
          result[operation.operationKey] = true;
        }
      });
    });

    return result;
  }, [permissionsData, roleCodes]);

  return {
    loading,
    roleCode: highestRoleCode,
    allRoles: roleCodes,
    ...permissions,
    hasPermission: (permissionName) => hasPermissionWithDeps(permissions, permissionName),
    refetchPermissions,
    canAccessScreen: (target) => {
      if (isSuperAdmin || roleCodes.includes('super_admin')) return true;

      if (target == null) return false;

      let normalizedScreenId;
      if (typeof target === 'object') {
        normalizedScreenId = resolveScreenIdFromNavItem(target);
      } else if (typeof target === 'string') {
        normalizedScreenId = target.includes('/') || target.includes('?') || target.includes('#')
          ? resolveScreenIdFromNavItem({ path: target })
          : target;
      } else {
        return false;
      }

      if (!normalizedScreenId || !permissionsData?.length) return false;

      const screen = permissionsData.find((s) => s.screenId === normalizedScreenId);
      if (!screen) return false;

      return screen.operations.some((operation) =>
        roleCodes.some((roleCode) => roleHasPermission(operation, roleCode))
      );
    },
  };
};
