import React from 'react';
import { Select } from '@ui';
import { useLang } from '@contexts/LangContext';
import { getLocalizedUserName } from '@utils/localizedUserName';
import { getUserStatus, getUserStatusSummary, getStatusIconProps, getStatusDescription, USER_STATUS, USER_STATUS_LABELS } from '@utils/userStatus';
import { getThemedIcon, getUserRoleIcon } from '@constants/iconTypes';
import { getThemeColor } from '@constants';
import { ROLE_STRINGS } from '@constants';
import { isInstructor, isAdmin, isHR, isSuperAdmin, isStudent, getUserRoles } from '@services/business/userService';


import { info, error, warn, debug } from '@services/utils/logger.js';/**
 * UserSelect Component
 * 
 * A reusable user selection dropdown with status icons, enrollment counts,
 * and consistent styling. Used throughout the Dashboard for user selection.
 * 
 * @param {Object} props
 * @param {Array} props.users - Array of user objects
 * @param {Array} props.enrollments - Array of enrollment objects
 * @param {Array} props.classes - Array of class objects (for instructor class counting)
 * @param {string} props.value - Selected user ID or email
 * @param {Function} props.onChange - Change handler
 * @param {string} props.placeholder - Placeholder text
 * @param {Array} props.roleFilter - Array of roles to filter by (optional)
 * @param {boolean} props.includeAll - Include "All Users" option
 * @param {boolean} props.showEnrollments - Show enrollment counts
 * @param {boolean} props.showStatus - Show user status
 * @param {boolean} props.useEmailAsValue - Use email instead of user ID as value
 * @param {boolean} props.searchable - Enable search functionality
 * @param {string} props.size - Select size
 * @param {boolean} props.fullWidth - Take full width
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Inline styles
 * @param {'light'|'dark'} props.theme - Theme variant
 */
const UserSelect = ({
  users = [],
  enrollments = [],
  classes = [],
  value,
  onChange,
  placeholder = 'Select User',
  roleFilter = null,
  includeAll = false,
  showEnrollments = true,
  showStatus = true,
  useEmailAsValue = false,
  searchable = true,
  size = 'medium',
  fullWidth = false,
  className = '',
  style = {},
  theme = 'light',
  ...rest
}) => {
  const { lang } = useLang();
  
  // Icon component mapping using centralized system
  const getIconComponent = (iconName) => {
    const iconMap = {
      'UserCheck': getThemedIcon('user_status', 'active', 16, theme),
      'UserX': getThemedIcon('user_status', 'inactive', 16, theme),
      'UserMinus': getThemedIcon('user_status', 'suspended', 16, theme),
      'AlertCircle': getThemedIcon('ui', 'alert_triangle', 16, theme),
      'Info': getThemedIcon('ui', 'info', 16, theme),
      'User': getThemedIcon('ui', 'user', 16, theme),
      'BookOpen': getThemedIcon('ui', 'book_open', 16, theme),
      'Users': getThemedIcon('ui', 'users', 16, theme),
      'Shield': getThemedIcon('ui', 'shield', 16, theme),
      'Crown': getThemedIcon('ui', 'crown', 16, theme)
    };
    return iconMap[iconName] || getThemedIcon('ui', 'user', 16, theme);
  };

  // Filter users by role if specified (using both flag-based utilities and string role field)
  const filteredUsers = roleFilter && roleFilter.length > 0 
    ? users.filter(u => {
        // Check each role in roleFilter against user flags and string role field
        return roleFilter.some(role => {
          const userRoleString = (u.role || '').toLowerCase();
          
          switch (role) {
            case ROLE_STRINGS.SUPER_ADMIN:
              return isSuperAdmin(u) || userRoleString === ROLE_STRINGS.SUPER_ADMIN;
            case ROLE_STRINGS.ADMIN:
              return isAdmin(u) || userRoleString === ROLE_STRINGS.ADMIN;
            case ROLE_STRINGS.INSTRUCTOR:
              return isInstructor(u) || userRoleString === ROLE_STRINGS.INSTRUCTOR;
            case ROLE_STRINGS.HR:
              return isHR(u) || userRoleString === ROLE_STRINGS.HR;
            case ROLE_STRINGS.STUDENT:
              return isStudent(u) || userRoleString === ROLE_STRINGS.STUDENT;
            default:
              return false;
          }
        });
      })
    : users;

  // Generate user options with rich information
  const generateUserOptions = () => {
    const options = [];

    // Add "All Users" option if requested
    if (includeAll) {
      options.push({
        value: 'all',
        label: (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {getIconComponent('User')}
            <span>All Users</span>
          </div>
        )
      });
    }

    // Add user options
    filteredUsers.forEach(u => {
      // Get user enrollments count (for students) or classes taught (for instructors)
      let enrollmentCount = 0;
      let displayCount = '';
      
      if (isInstructor(u) || isAdmin(u)) {
        // For instructors: count classes they teach
        // Count classes owned by this instructor
        let taughtClasses = [];
        
        if (classes && classes.length > 0) {
          // Count classes where this user is the owner
          taughtClasses = classes.filter(c => 
            c.ownerEmail === u.email || 
            c.createdBy === (u.docId || u.id)
          );
        } else {
          // Fallback to enrollment-based counting (for backward compatibility)
          taughtClasses = enrollments.filter(e => 
            e.instructorId === (u.docId || u.id) || e.ownerEmail === u.email
          );
        }
        
        enrollmentCount = taughtClasses.length;
        displayCount = enrollmentCount > 0 ? `${enrollmentCount} classes` : 'No classes';
      } else {
        // For students: count their enrollments
        const userEnrollments = enrollments.filter(e => e.userId === (u.docId || u.id));
        enrollmentCount = userEnrollments.length;
        displayCount = enrollmentCount > 0 ? `${enrollmentCount} enrollments` : 'No enrollments';
      }
      
      // Get status information
      // For instructors, admins, and HR: calculate status based on their existence, not student enrollments
      let status, statusSummary, iconProps;
      
      const userRoles = getUserRoles(u);
      const isStaff = userRoles.includes('instructor') || userRoles.includes('teacher') ||
                      userRoles.includes('admin') || userRoles.includes('super_admin') ||
                      userRoles.includes('hr') || userRoles.includes('human_resources');
      
      if (isStaff) {
        // For staff roles: use a simplified status check that doesn't rely on student enrollments
        if (u.deleted === true || u.deletedAt) {
          status = USER_STATUS.DELETED;
        } else if (u.archived === true || u.archivedAt) {
          status = USER_STATUS.ARCHIVED;
        } else if (u.disabled === true || u.disabledAt) {
          status = USER_STATUS.DISABLED;
        } else {
          // Staff are active if they exist, regardless of enrollments
          status = USER_STATUS.ACTIVE;
        }
        
        // Create a minimal status summary for staff
        statusSummary = {
          status,
          label: status === USER_STATUS.ACTIVE ? 'Active' : USER_STATUS_LABELS[status] || status,
          canLogin: status !== USER_STATUS.DELETED && status !== USER_STATUS.DISABLED,
          hasFullAccess: status === USER_STATUS.ACTIVE,
          hasReadOnlyAccess: status === USER_STATUS.ARCHIVED,
          canParticipate: status === USER_STATUS.ACTIVE,
          canViewDashboard: status !== USER_STATUS.DELETED,
          enrollmentCount: enrollmentCount,
          iconProps: getStatusIconProps(status),
          description: status === USER_STATUS.ACTIVE ? 'User is active' : getStatusDescription(status)
        };
      } else {
        // For students: use the normal status calculation
        status = getUserStatus(u, enrollments);
        statusSummary = getUserStatusSummary(u, enrollments);
        
        // For students with no enrollments, show them as Active with green icon
        if (status === USER_STATUS.NO_ENROLLMENTS) {
          status = USER_STATUS.ACTIVE; // Change status to get green icon
          statusSummary = {
            ...statusSummary,
            label: 'Active'
          };
        }
      }
      
      iconProps = getStatusIconProps(status);
      let IconComponent = getIconComponent(iconProps.name);
      
      // Add role-specific icon based on user's primary role using centralized system
      let RoleIcon = null;
      if (userRoles.includes('super_admin')) {
        RoleIcon = getUserRoleIcon('super_admin');
      } else if (userRoles.includes('admin')) {
        RoleIcon = getUserRoleIcon('admin');
      } else if (userRoles.includes('hr') || userRoles.includes('human_resources')) {
        RoleIcon = getUserRoleIcon('hr');
      } else if (userRoles.includes('instructor') || userRoles.includes('teacher')) {
        RoleIcon = getUserRoleIcon('instructor');
      }
      
      if (RoleIcon) {
        IconComponent = (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {IconComponent}
            {RoleIcon}
          </div>
        );
      }
      
      const isDisabled = status === USER_STATUS.DELETED;
      const statusLabel = statusSummary?.label || status;
      
      const localizedName = getLocalizedUserName(u, lang, 'Unknown');
      options.push({
        value: useEmailAsValue ? u.email : (u.docId || u.id),
        displayLabel: localizedName,
        label: localizedName,
        icon: IconComponent,
        disabled: isDisabled
      });
    });

    return options;
  };

  return (
    <Select
      value={value}
      onChange={(e) => {
        const selectedValue = e?.target?.value || e?.value || '';
        onChange(selectedValue);
      }}
      placeholder={placeholder}
      options={generateUserOptions()}
      searchable={searchable}
      size={size}
      fullWidth={fullWidth}
      className={className}
      style={style}
      theme={theme}
      {...rest}
    />
  );
};

export default UserSelect;
