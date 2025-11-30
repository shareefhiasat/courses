import React from 'react';
import styles from './Avatar.module.css';

/**
 * Avatar Component
 * 
 * Display user avatars with fallback to initials.
 */
const Avatar = ({
  src,
  alt,
  name,
  size = 'md',
  shape = 'circle',
  status,
  className = '',
}) => {
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const avatarClasses = [
    styles.avatar,
    styles[size],
    styles[shape],
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={avatarClasses}>
      {src ? (
        <img src={src} alt={alt || name} className={styles.image} />
      ) : (
        <span className={styles.initials}>{getInitials(name)}</span>
      )}
      {status && <span className={`${styles.status} ${styles[`status-${status}`]}`}></span>}
    </div>
  );
};

export default Avatar;
