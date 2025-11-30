import React from 'react';
import styles from './Container.module.css';

/**
 * Container Component
 * 
 * A max-width wrapper for content.
 */
const Container = ({
  children,
  maxWidth = 'lg',
  padding = 'md',
  className = '',
}) => {
  const containerClasses = [
    styles.container,
    styles[`maxWidth-${maxWidth}`],
    styles[`padding-${padding}`],
    className
  ].filter(Boolean).join(' ');

  return <div className={containerClasses}>{children}</div>;
};

export default Container;
