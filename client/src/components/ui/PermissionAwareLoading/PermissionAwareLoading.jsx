import React from 'react';
import { FancyLoading } from '../FancyLoading';
import { useAuth } from '../../../contexts/AuthContext';
import { useLang } from '../../../contexts/LangContext';
import { Lock } from 'lucide-react';
import styles from './PermissionAwareLoading.module.css';

/**
 * PermissionAwareLoading - A loading component that handles both loading states and permission checks
 * 
 * @param {Object} props
 * @param {boolean} props.isLoading - Whether the component is in a loading state
 * @param {string|string[]} [props.requiredRole] - Required role(s) to view the content
 * @param {string} [props.loadingMessage] - Custom loading message
 * @param {boolean} [props.fullscreen] - Whether to show a fullscreen loading overlay
 * @param {string} [props.variant] - Loading variant: 'default' | 'minimal' | 'pulse' | 'dots'
 * @param {React.ReactNode} props.children - Child components to render when not loading and with permissions
 * @returns {JSX.Element}
 */
export const PermissionAwareLoading = ({
  isLoading = false,
  requiredRole = null,
  loadingMessage = null,
  fullscreen = true,
  variant = 'default',
  children
}) => {
  const { currentUser, userRole } = useAuth();
  const { t } = useLang();

  // Check if user has required role
  const hasPermission = React.useMemo(() => {
    if (!requiredRole) return true;
    if (!currentUser) return false;
    
    if (Array.isArray(requiredRole)) {
      return requiredRole.some(role => userRole === role);
    }
    return userRole === requiredRole;
  }, [currentUser, userRole, requiredRole]);

  // Show loading state
  if (isLoading) {
    return (
      <FancyLoading 
        message={loadingMessage || t('loading') || 'Loading...'} 
        fullscreen={fullscreen}
        variant={variant}
      />
    );
  }

  // Show permission denied
  if (!hasPermission) {
    return (
      <div className={`${styles.permissionDenied} ${fullscreen ? styles.fullscreen : ''}`}>
        <div className={styles.lockContainer}>
          <Lock size={48} className={styles.lockIcon} />
          <h2>{t('access_denied') || 'Access Denied'}</h2>
          <p>{t('no_permission') || 'You do not have permission to view this content.'}</p>
        </div>
      </div>
    );
  }

  // Render children when not loading and with permissions
  return <>{children}</>;
};

export default PermissionAwareLoading;
