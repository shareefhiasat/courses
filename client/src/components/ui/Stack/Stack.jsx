import React from 'react';
import styles from './Stack.module.css';

/**
 * Stack Component
 * 
 * A layout component for vertical or horizontal spacing.
 */
const Stack = ({
  children,
  direction = 'vertical',
  spacing = 'md',
  align = 'stretch',
  justify = 'start',
  className = '',
}) => {
  const stackClasses = [
    styles.stack,
    styles[direction],
    styles[`spacing-${spacing}`],
    styles[`align-${align}`],
    styles[`justify-${justify}`],
    className
  ].filter(Boolean).join(' ');

  return <div className={stackClasses}>{children}</div>;
};

export default Stack;
