import React from 'react';
import PropTypes from 'prop-types';
import { User, UserCheck, UserX, UserMinus, AlertCircle, Info } from 'lucide-react';
import { USER_STATUS, getStatusIconProps } from '../../../utils/userStatus';
import styles from './StudentSelectOption.module.css';

const ICON_MAP = {
  UserCheck,
  UserX,
  UserMinus,
  AlertCircle,
  Info,
  User
};

const formatStatusLabel = (statusLabel, status) => {
  if (statusLabel) return statusLabel;
  if (!status) return '';
  return status
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const formatEnrollmentLabel = (count) => {
  if (typeof count !== 'number') return '';
  if (count < 0) return '';
  return `${count} ${count === 1 ? 'Enrollment' : 'Enrollments'}`;
};

const hexToRgba = (hex, alpha = 0.15) => {
  if (!hex || typeof hex !== 'string') return `rgba(107, 114, 128, ${alpha})`;
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized, 16);
  if (Number.isNaN(bigint)) return `rgba(107, 114, 128, ${alpha})`;
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const StudentSelectOption = ({
  name,
  email,
  primaryText,
  status = USER_STATUS.ACTIVE,
  statusLabel,
  enrollmentCount,
  secondaryText,
  icon: IconOverride,
  iconColor,
  iconBackground,
  isDisabled = false
}) => {
  const derivedPrimary = primaryText || name || email || 'Unknown User';
  const iconProps = getStatusIconProps(status);
  const IconComponent = IconOverride || ICON_MAP[iconProps.name] || User;
  const color = iconColor || iconProps.color || '#6b7280';
  const background = iconBackground || hexToRgba(color, 0.15);

  const statusText = formatStatusLabel(statusLabel, status);
  const enrollmentText = formatEnrollmentLabel(enrollmentCount);
  const fallbackSecondary = [statusText, enrollmentText].filter(Boolean).join(' • ');
  const derivedSecondary = secondaryText || fallbackSecondary;

  return (
    <div className={`${styles.option} ${isDisabled ? styles.disabled : ''}`} data-testid="student-select-option">
      <div className={styles.iconWrapper} aria-hidden="true">
        <span
          className={styles.iconBubble}
          style={{ color, backgroundColor: background }}
        >
          <IconComponent size={18} strokeWidth={2} />
        </span>
      </div>
      <div className={styles.textContent}>
        <span className={styles.primary}>{derivedPrimary}</span>
        {derivedSecondary && (
          <span className={styles.secondary}>{derivedSecondary}</span>
        )}
      </div>
    </div>
  );
};

StudentSelectOption.propTypes = {
  name: PropTypes.string,
  email: PropTypes.string,
  primaryText: PropTypes.string,
  status: PropTypes.string,
  statusLabel: PropTypes.string,
  enrollmentCount: PropTypes.number,
  secondaryText: PropTypes.string,
  icon: PropTypes.elementType,
  iconColor: PropTypes.string,
  iconBackground: PropTypes.string,
  isDisabled: PropTypes.bool
};

export default StudentSelectOption;
