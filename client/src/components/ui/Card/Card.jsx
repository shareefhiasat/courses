import React from 'react';
import styles from './Card.module.css';

/**
 * Card Component
 * 
 * A flexible container component for grouping related content.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Card content
 * @param {'sm'|'md'|'lg'|'xl'} props.elevation - Shadow depth
 * @param {'sm'|'md'|'lg'} props.padding - Internal padding
 * @param {boolean} props.hoverable - Whether card has hover effect
 * @param {Function} props.onClick - Click handler (makes card clickable)
 * @param {string} props.className - Additional CSS classes
 */
const Card = ({
  children,
  elevation = 'md',
  padding = 'md',
  hoverable = false,
  onClick,
  className = '',
  ...rest
}) => {
  const cardClasses = [
    styles.card,
    styles[`elevation-${elevation}`],
    styles[`padding-${padding}`],
    (hoverable || onClick) && styles.hoverable,
    onClick && styles.clickable,
    className
  ].filter(Boolean).join(' ');

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      className={cardClasses}
      onClick={onClick}
      {...rest}
    >
      {children}
    </Component>
  );
};

/**
 * CardHeader Component
 * 
 * Header section of a card with optional title and actions.
 */
export const CardHeader = ({
  children,
  title,
  subtitle,
  actions,
  className = '',
}) => {
  return (
    <div className={`${styles.cardHeader} ${className}`}>
      <div className={styles.cardHeaderContent}>
        {title && <h3 className={styles.cardTitle}>{title}</h3>}
        {subtitle && <p className={styles.cardSubtitle}>{subtitle}</p>}
        {children}
      </div>
      {actions && <div className={styles.cardActions}>{actions}</div>}
    </div>
  );
};

/**
 * CardBody Component
 * 
 * Main content area of a card.
 */
export const CardBody = ({ children, className = '' }) => {
  return (
    <div className={`${styles.cardBody} ${className}`}>
      {children}
    </div>
  );
};

/**
 * CardFooter Component
 * 
 * Footer section of a card, typically for actions.
 */
export const CardFooter = ({ children, className = '' }) => {
  return (
    <div className={`${styles.cardFooter} ${className}`}>
      {children}
    </div>
  );
};

export default Card;
