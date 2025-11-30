import React from 'react';
import styles from './Grid.module.css';

/**
 * Grid Component
 * 
 * A responsive grid layout.
 */
const Grid = ({
  children,
  cols = 1,
  gap = 'md',
  responsive = true,
  className = '',
}) => {
  const gridClasses = [
    styles.grid,
    styles[`cols-${cols}`],
    styles[`gap-${gap}`],
    responsive && styles.responsive,
    className
  ].filter(Boolean).join(' ');

  return <div className={gridClasses}>{children}</div>;
};

export default Grid;
