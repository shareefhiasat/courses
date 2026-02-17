import React from 'react';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import styles from './Breadcrumb.module.css';

/**
 * Breadcrumb Component
 * 
 * Navigation breadcrumbs.
 */
const Breadcrumb = ({
  items,
  separator,
  showHome = true,
  className = '',
}) => {
  const { theme } = useTheme();
  
  // Use default separator if none provided
  const separatorElement = separator || getThemedIcon('ui', 'chevron_right', 16, theme);
  return (
    <nav className={`${styles.breadcrumb} ${className}`} aria-label="Breadcrumb">
      <ol className={styles.list}>
        {showHome && (
          <>
            <li className={styles.item}>
              <a href="/" className={styles.link}>
                {getThemedIcon('ui', 'home', 16, theme)}
              </a>
            </li>
            {items.length > 0 && (
              <li className={styles.separator} aria-hidden="true">
                {separatorElement}
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
                {separatorElement}
              </li>
            )}
          </React.Fragment>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
