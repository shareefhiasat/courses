import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import styles from './Breadcrumb.module.css';

/**
 * Breadcrumb Component
 * 
 * Navigation breadcrumbs.
 */
const Breadcrumb = ({
  items,
  separator = <ChevronRight size={16} />,
  showHome = true,
  className = '',
}) => {
  return (
    <nav className={`${styles.breadcrumb} ${className}`} aria-label="Breadcrumb">
      <ol className={styles.list}>
        {showHome && (
          <>
            <li className={styles.item}>
              <a href="/" className={styles.link}>
                <Home size={16} />
              </a>
            </li>
            {items.length > 0 && (
              <li className={styles.separator} aria-hidden="true">
                {separator}
              </li>
            )}
          </>
        )}
        
        {items.map((item, index) => (
          <React.Fragment key={index}>
            <li className={styles.item}>
              {index === items.length - 1 ? (
                <span className={styles.current} aria-current="page">
                  {item.label}
                </span>
              ) : (
                <a href={item.href} className={styles.link}>
                  {item.label}
                </a>
              )}
            </li>
            {index < items.length - 1 && (
              <li className={styles.separator} aria-hidden="true">
                {separator}
              </li>
            )}
          </React.Fragment>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
