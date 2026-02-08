import React from 'react';
import { Select } from '@ui';
import { USER_ROLES } from '@constants/userRoles';
import { getUserStatus, getUserStatusSummary, getStatusIconProps, USER_STATUS } from '@utils/userStatus';
import { getThemedIcon } from '@constants/iconTypes';
import { getThemeColor } from '@constants/dashboardTypes';

/**
 * UserSelect Component
 * 
 * A reusable user selection dropdown with status icons, enrollment counts,
 * and consistent styling. Used throughout the Dashboard for user selection.
 * 
 * @param {Object} props
 * @param {Array} props.users - Array of user objects
 * @param {Array} props.enrollments - Array of enrollment objects
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

  // Filter users by role if specified
  const filteredUsers = roleFilter 
    ? users.filter(u => roleFilter.includes(u.role))
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
      // Get user enrollments count
      const userEnrollments = enrollments.filter(e => e.userId === (u.docId || u.id));
      const enrollmentCount = userEnrollments.length;
      
      // Get status information
      const status = getUserStatus(u, userEnrollments);
      const statusSummary = getUserStatusSummary(u, userEnrollments);
      const iconProps = getStatusIconProps(status);
      const IconComponent = getIconComponent(iconProps.name);
      
      const isDisabled = status === USER_STATUS.DELETED;
      const statusLabel = statusSummary?.label || status;
      
      options.push({
        value: useEmailAsValue ? u.email : (u.docId || u.id),
        displayLabel: u.displayName || u.realName || u.email || 'Unknown',
        label: (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: 8,
            opacity: isDisabled ? 0.7 : 1
          }}>
            {showStatus && <span>{IconComponent}</span>}
            <span style={{ 
              textDecoration: isDisabled ? 'line-through' : 'none',
              flex: 1
            }}>
              {u.displayName || u.realName || u.email || 'Unknown'}
            </span>
            {(showStatus || showEnrollments) && (
              <span style={{ 
                fontSize: '0.8em',
                color: '#9CA3AF',
                marginLeft: 'auto'
              }}>
                {showStatus && statusLabel}
                {showStatus && showEnrollments && enrollmentCount > 0 && ' • '}
                {showEnrollments && enrollmentCount > 0 && `${enrollmentCount} enrollments`}
              </span>
            )}
          </div>
        ),
        disabled: isDisabled
      });
    });

    return options;
  };

  return (
    <Select
      value={value}
      onChange={onChange}
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
