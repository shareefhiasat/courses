/**
 * Keycloak Admin Service
 * 
 * PURPOSE: Wrapper for Keycloak Admin REST API operations
 * Handles user management, role assignment, and password operations
 * 
 * ARCHITECTURE: Backend Controllers → Keycloak Admin Service → Keycloak Server
 */


const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:8080';
const KEYCLOAK_REALM = 'master'; // Force master realm to avoid confusion
const KEYCLOAK_ADMIN_CLIENT_ID = process.env.KEYCLOAK_ADMIN_CLIENT_ID || 'admin-cli';
const KEYCLOAK_ADMIN_CLIENT_SECRET = process.env.KEYCLOAK_ADMIN_CLIENT_SECRET;

// LMS canonical roles (must match database user roles table)
const LMS_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  HR: 'hr',
  INSTRUCTOR: 'instructor',
  STUDENT: 'student'
};

/**
 * Get admin access token using client credentials
 */
async function getAdminToken() {
  try {
    // Try admin credentials first
    const adminUsername = process.env.KEYCLOAK_ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin123';
    
    const response = await fetch(
      `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'password',
          client_id: KEYCLOAK_ADMIN_CLIENT_ID,
          username: adminUsername,
          password: adminPassword
        })
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Keycloak auth response:', data);
      throw new Error(data.error_description || 'Failed to authenticate with Keycloak');
    }
    
    return data.access_token;
  } catch (error) {
    console.error('Failed to get admin token:', error.message);
    throw new Error('Failed to authenticate with Keycloak admin API');
  }
}

/**
 * List users from Keycloak
 * @param {Object} options - Query options
 * @param {string} options.search - Search term
 * @param {number} options.first - Pagination offset
 * @param {number} options.max - Max results
 */
export async function listUsers({ search = '', first = 0, max = 100 } = {}) {
  try {
    const token = await getAdminToken();
    
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    params.append('first', first.toString());
    params.append('max', max.toString());
    
    const response = await fetch(
      `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const data = await response.json();
    
    // Ensure data is an array
    const usersArray = Array.isArray(data) ? data : [];
    
    return {
      success: true,
      data: usersArray,
      total: usersArray.length
    };
  } catch (error) {
    console.error('Failed to list users:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.errorMessage || error.message || 'Failed to list users'
    };
  }
}

/**
 * Create a new user in Keycloak
 * @param {Object} userData - User data
 * @param {string} userData.email - User email
 * @param {string} userData.firstName - First name
 * @param {string} userData.lastName - Last name
 * @param {boolean} userData.enabled - Account enabled status
 * @param {string} userData.temporaryPassword - Initial password
 */
export async function createUser({ email, firstName, lastName, enabled = true, temporaryPassword }) {
  try {
    const token = await getAdminToken();
    
    const userData = {
      username: email,
      email: email,
      firstName: firstName || '',
      lastName: lastName || '',
      enabled: enabled,
      emailVerified: false,
      credentials: temporaryPassword ? [{
        type: 'password',
        value: temporaryPassword,
        temporary: true
      }] : []
    };
    
    const response = await fetch(
      `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.errorMessage || 'Failed to create user');
    }
    
    // Extract user ID from Location header
    const locationHeader = response.headers.get('Location');
    const userId = locationHeader ? locationHeader.split('/').pop() : null;
    
    return {
      success: true,
      data: {
        id: userId,
        email,
        firstName,
        lastName,
        enabled
      },
      message: 'User created successfully'
    };
  } catch (error) {
    console.error('Failed to create user:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.errorMessage || error.message || 'Failed to create user'
    };
  }
}

/**
 * Set user password (admin operation)
 * @param {Object} options
 * @param {string} options.keycloakUserId - Keycloak user ID
 * @param {string} options.newPassword - New password
 * @param {boolean} options.temporary - Whether password is temporary
 */
export async function setUserPassword({ keycloakUserId, newPassword, temporary = false }) {
  try {
    const token = await getAdminToken();
    
    const response = await fetch(
      `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users/${keycloakUserId}/reset-password`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'password',
          value: newPassword,
          temporary: temporary
        })
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.errorMessage || 'Failed to set password');
    }
    
    return {
      success: true,
      message: 'Password updated successfully'
    };
  } catch (error) {
    console.error('Failed to set password:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.errorMessage || error.message || 'Failed to set password'
    };
  }
}

/**
 * Enable or disable user account
 * @param {Object} options
 * @param {string} options.keycloakUserId - Keycloak user ID
 * @param {boolean} options.enabled - Enabled status
 */
export async function setUserEnabled({ keycloakUserId, enabled }) {
  try {
    const token = await getAdminToken();
    
    const response = await fetch(
      `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users/${keycloakUserId}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          enabled: enabled
        })
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.errorMessage || 'Failed to update user status');
    }
    
    return {
      success: true,
      message: `User ${enabled ? 'enabled' : 'disabled'} successfully`
    };
  } catch (error) {
    console.error('Failed to update user status:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.errorMessage || error.message || 'Failed to update user status'
    };
  }
}

/**
 * Get available realm roles
 */
async function getRealmRoles() {
  try {
    const token = await getAdminToken();
    
    const response = await fetch(
      `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/roles`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to get realm roles:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Set user roles (replaces existing roles with new ones)
 * @param {Object} options
 * @param {string} options.keycloakUserId - Keycloak user ID
 * @param {string[]} options.roles - Array of role names (from LMS_ROLES)
 */
export async function setUserRoles({ keycloakUserId, roles }) {
  try {
    const token = await getAdminToken();
    
    // Validate roles
    const validRoles = Object.values(LMS_ROLES);
    const invalidRoles = roles.filter(role => !validRoles.includes(role));
    if (invalidRoles.length > 0) {
      return {
        success: false,
        error: `Invalid roles: ${invalidRoles.join(', ')}. Valid roles: ${validRoles.join(', ')}`
      };
    }
    
    // Get all realm roles
    const allRealmRoles = await getRealmRoles();
    
    // Get current user roles
    const currentRolesResponse = await fetch(
      `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users/${keycloakUserId}/role-mappings/realm`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const currentRoles = await currentRolesResponse.json();
    const currentLmsRoles = currentRoles.filter(role => 
      validRoles.includes(role.name)
    );
    
    // Remove current LMS roles
    if (currentLmsRoles.length > 0) {
      await fetch(
        `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users/${keycloakUserId}/role-mappings/realm`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(currentLmsRoles)
        }
      );
    }
    
    // Add new roles
    const rolesToAdd = allRealmRoles.filter(role => roles.includes(role.name));
    
    if (rolesToAdd.length > 0) {
      await fetch(
        `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users/${keycloakUserId}/role-mappings/realm`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(rolesToAdd)
        }
      );
    }
    
    return {
      success: true,
      message: 'User roles updated successfully',
      data: { roles }
    };
  } catch (error) {
    console.error('Failed to set user roles:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.errorMessage || error.message || 'Failed to set user roles'
    };
  }
}

/**
 * Delete user from Keycloak
 * @param {Object} options
 * @param {string} options.keycloakUserId - Keycloak user ID
 */
export async function deleteUser({ keycloakUserId }) {
  try {
    const token = await getAdminToken();
    
    const response = await fetch(
      `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users/${keycloakUserId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.errorMessage || 'Failed to delete user');
    }
    
    return {
      success: true,
      message: 'User deleted successfully'
    };
  } catch (error) {
    console.error('Failed to delete user:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.errorMessage || error.message || 'Failed to delete user'
    };
  }
}

/**
 * Get user by email
 * @param {string} email - User email
 */
export async function getUserByEmail(email) {
  try {
    const token = await getAdminToken();
    
    const response = await fetch(
      `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users?email=${encodeURIComponent(email)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        success: true,
        data: data[0] // Return first matching user
      };
    }
    
    return {
      success: false,
      error: 'User not found'
    };
  } catch (error) {
    console.error('Failed to get user by email:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.errorMessage || error.message || 'Failed to get user by email'
    };
  }
}

/**
 * Get user by ID
 * @param {string} keycloakUserId - Keycloak user ID
 */
export async function getUserById(keycloakUserId) {
  try {
    const token = await getAdminToken();
    
    const response = await fetch(
      `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users/${keycloakUserId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const data = await response.json();
    
    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('Failed to get user:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.errorMessage || error.message || 'Failed to get user'
    };
  }
}

/**
 * Get realm roles assigned to a user
 * @param {string} keycloakUserId - Keycloak user ID
 */
export async function getUserRealmRoles(keycloakUserId) {
  try {
    const token = await getAdminToken();

    const response = await fetch(
      `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users/${keycloakUserId}/role-mappings/realm`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const data = await response.json();

    return {
      success: true,
      data: Array.isArray(data) ? data : []
    };
  } catch (error) {
    console.error('Failed to get user realm roles:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.errorMessage || error.message || 'Failed to get user realm roles'
    };
  }
}

export { LMS_ROLES };

export default {
  listUsers,
  createUser,
  setUserPassword,
  setUserEnabled,
  setUserRoles,
  deleteUser,
  getUserById,
  getUserRealmRoles,
  LMS_ROLES
};
