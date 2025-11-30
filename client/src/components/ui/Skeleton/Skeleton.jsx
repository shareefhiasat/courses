import React from 'react';
import styles from './Skeleton.module.css';

/**
 * Skeleton Component
 * 
 * Loading placeholder with shimmer effect.
 */
const Skeleton = ({
  variant = 'text',
  width,
  height,
  circle = false,
  count = 1,
  className = '',
}) => {
  const skeletonClasses = [
    styles.skeleton,
    styles[variant],
    circle && styles.circle,
    className
  ].filter(Boolean).join(' ');

  const style = {
    width: width || (variant === 'text' ? '100%' : undefined),
    height: height || (variant === 'text' ? '1em' : undefined),
  };

  if (count === 1) {
    return <div className={skeletonClasses} style={style} />;
  }

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={skeletonClasses} style={style} />
      ))}
    </>
  );
};

export default Skeleton;
