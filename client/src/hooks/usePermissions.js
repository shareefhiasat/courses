import { useMemo, useEffect, useState } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { ROLES } from '@constants/permissionConfig';

// Role hierarchy - higher index = higher precedence
const ROLE_HIERARCHY = ['student', 'instructor', 'hr', 'admin', 'super_admin'];

export const usePermissions = () => {
  const { role, isSuperAdmin, isHR, isAdmin, isInstructor, isStudent, userRoles } = useAuth();
  const [permissionsData, setPermissionsData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Determine user's role codes (all roles the user has)
  const roleCodes = useMemo(() => {
    const roles = [];
    if (isSuperAdmin) roles.push('super_admin');
    if (isAdmin) roles.push('admin');
    if (isHR) roles.push('hr');
    if (isInstructor) roles.push('instructor');
    if (isStudent) roles.push('student');
    return roles;
  }, [isSuperAdmin, isHR, isAdmin, isInstructor, isStudent]);

  // Get the highest role based on hierarchy
  const highestRoleCode = useMemo(() => {
    if (roleCodes.length === 0) return null;
    
    let highestIndex = -1;
    let highestRole = null;
    
    roleCodes.forEach(role => {
      const index = ROLE_HIERARCHY.indexOf(role);
      if (index > highestIndex) {
        highestIndex = index;
        highestRole = role;
      }
    });
    
    return highestRole;
  }, [roleCodes]);

  // Fetch permissions from database
  useEffect(() => {
    const fetchPermissions = async () => {
      if (roleCodes.length === 0) {
        console.log('[usePermissions] No role codes, skipping fetch');
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('keycloak_token');
        console.log('[usePermissions] Fetching permissions for roles:', roleCodes);
        
        const response = await fetch('/api/v1/permissions', {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });

        console.log('[usePermissions] Response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('[usePermissions] Permissions data received:', data);
          setPermissionsData(data.data);
        } else {
          console.error('[usePermissions] Failed to fetch permissions:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('[usePermissions] Error fetching permissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [roleCodes]);

  // Extract permissions for the user's highest role
  const permissions = useMemo(() => {
    if (!permissionsData || !highestRoleCode) {
      // Default to no permissions if not loaded
      console.log('[usePermissions] No permissions data or role code');
      return {};
    }

    const result = {};
    
    permissionsData.forEach(screen => {
      screen.operations.forEach(operation => {
        // Check if any of the user's roles has this permission
        // Use highest role for precedence
        const perm = operation.permissions.find(p => p.role === highestRoleCode);
        if (perm && perm.allowed) {
          result[operation.operationKey] = true;
        }
      });
    });

    console.log('[usePermissions] Extracted permissions for role:', highestRoleCode, {
      count: Object.keys(result).length,
      permissions: Object.keys(result)
    });

    return result;
  }, [permissionsData, highestRoleCode]);

  // Store permissions data structure for screen access checking
  const permissionsDataForScreenAccess = permissionsData;

  return {
    loading,
    roleCode: highestRoleCode,
    allRoles: roleCodes,
    // All permissions as boolean flags
    ...permissions,
    // Helper functions
    hasPermission: (permissionName) => permissions[permissionName] || false,
    canAccessScreen: (screenId) => {
      // Super admin can access all screens
      if (highestRoleCode === 'super_admin') return true;
      
      // Handle undefined screenId (for items with key instead of path)
      if (!screenId || typeof screenId !== 'string') return false;
      
      // Handle case where permissions data is not loaded yet
      if (!permissionsDataForScreenAccess || permissionsDataForScreenAccess.length === 0) {
        return false;
      }
      
      // Strip leading slash and query params from screenId
      const normalizedScreenId = screenId.replace(/^\/+/, '').split('?')[0].split('/')[0];
      
      // Use permissions data structure directly - no need to parse operation keys
      // Check if user has ANY permission on this screen
      const hasAnyPermission = permissionsDataForScreenAccess.some(screen => {
        if (screen.screenId === normalizedScreenId) {
          return screen.operations.some(operation => {
            const perm = operation.permissions.find(p => p.role === highestRoleCode);
            return perm && perm.allowed;
          });
        }
        return false;
      });
      
      // Debug logging
      console.log('[usePermissions] canAccessScreen:', {
        originalPath: screenId,
        normalizedScreenId,
        hasAnyPermission,
        screenCount: permissionsDataForScreenAccess.length
      });
      
      return hasAnyPermission;
    }
  };
};
