import React from 'react';
import { Select } from '@ui';
import { getUserStatus, getUserStatusSummary, getStatusIconProps, USER_STATUS } from '@utils/userStatus';
import { getThemedIcon } from '@constants/iconTypes';
import { getThemeColor } from '@constants/dashboardTypes';
import { ROLE_STRINGS } from '@constants';

/**
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

  // Filter users by role if specified (using flag-based utilities)
  const filteredUsers = roleFilter && roleFilter.length > 0 
    ? users.filter(u => {
        // Check each role in roleFilter against user flags
        return roleFilter.some(role => {
          switch (role) {
            case ROLE_STRINGS.SUPER_ADMIN:
              return isSuperAdmin(u);
            case ROLE_STRINGS.ADMIN:
              return isAdmin(u);
            case ROLE_STRINGS.INSTRUCTOR:
              return isInstructor(u);
            case ROLE_STRINGS.HR:
              return isHR(u);
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
      
      if (isInstructorUser(u) || isAdminUser(u)) {
        // For instructors: count classes they teach
        console.log('🔍 [UserSelect] User Role Debug:', {
          userEmail: u.email,
          userId: u.docId || u.id,
          userRoles: {
            isInstructor: u.isInstructor,
            isAdmin: u.isAdmin,
            isSuperAdmin: u.isSuperAdmin,
            isHR: u.isHR,
            isStudent: u.isStudent
          },
          roleDetection: {
            isInstructorUser: isInstructorUser(u),
            isAdminUser: isAdminUser(u),
            isSuperAdminUser: isSuperAdminUser(u),
            hasAdminPrivileges: hasAdminPrivileges(u)
          }
        });
        
        console.log('🔍 [UserSelect] Instructor Debug:', {
          userEmail: u.email,
          userId: u.docId || u.id,
          totalEnrollments: enrollments.length,
          totalClasses: classes?.length || 0,
          isInstructor: isInstructorUser(u) || isAdminUser(u)
        });
        
        // Count classes owned by this instructor
        let taughtClasses = [];
        
        if (classes && classes.length > 0) {
          // Count classes where this user is the owner
          taughtClasses = classes.filter(c => 
            c.ownerEmail === u.email || 
            c.createdBy === (u.docId || u.id)
          );
          console.log('🔍 [UserSelect] Classes owned by instructor:', taughtClasses);
        } else {
          // Fallback to enrollment-based counting (for backward compatibility)
          taughtClasses = enrollments.filter(e => 
            e.instructorId === (u.docId || u.id) || e.ownerEmail === u.email
          );
          console.log('🔍 [UserSelect] Taught Classes from enrollments:', taughtClasses);
        }
        
        enrollmentCount = taughtClasses.length;
        displayCount = enrollmentCount > 0 ? `${enrollmentCount} classes` : 'No classes';
        
        console.log('🔍 [UserSelect] Instructor Final Count:', {
          enrollmentCount,
          displayCount,
          taughtClassesCount: taughtClasses.length
        });
      } else {
        // For students: count their enrollments
        console.log('🔍 [UserSelect] Student Branch Debug:', {
          userEmail: u.email,
          userId: u.docId || u.id,
          userRoles: {
            isInstructor: u.isInstructor,
            isAdmin: u.isAdmin,
            isSuperAdmin: u.isSuperAdmin,
            isHR: u.isHR,
            isStudent: u.isStudent
          },
          roleDetection: {
            isInstructorUser: isInstructorUser(u),
            isAdminUser: isAdminUser(u),
            isSuperAdminUser: isSuperAdminUser(u),
            hasAdminPrivileges: hasAdminPrivileges(u)
          },
          reason: 'Treated as student because isInstructorUser(u) || isAdminUser(u) returned false'
        });
        
        const userEnrollments = enrollments.filter(e => e.userId === (u.docId || u.id));
        enrollmentCount = userEnrollments.length;
        displayCount = enrollmentCount > 0 ? `${enrollmentCount} enrollments` : 'No enrollments';
      }
      
      // Get status information
      const status = getUserStatus(u, enrollments);
      const statusSummary = getUserStatusSummary(u, enrollments);
      const iconProps = getStatusIconProps(status);
      let IconComponent = getIconComponent(iconProps.name);
      
      // Add instructor icon if user is instructor
      if (isInstructorUser(u) || isAdminUser(u)) {
        const InstructorIcon = getIconComponent('BookOpen');
        IconComponent = (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {IconComponent}
            {InstructorIcon}
          </div>
        );
      }
      
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
                {showEnrollments && displayCount}
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
