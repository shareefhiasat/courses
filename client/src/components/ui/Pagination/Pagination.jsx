import React from 'react';
import { getThemedIcon } from '@constants/iconTypes';
import { useLang } from '@contexts/LangContext';
import styles from './Pagination.module.css';


import { info, error, warn, debug } from '@services/utils/logger.js';/**
 * Pagination Component
 * 
 * Navigate through pages of data.
 */
const Pagination = ({
  currentPage = 1,
  totalPages,
  onPageChange,
  showFirstLast = true,
  maxVisible = 5,
  className = '',
}) => {
  const { t } = useLang();
  const getPageNumbers = () => {
    const pages = [];
    const halfVisible = Math.floor(maxVisible / 2);
    
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  if (totalPages <= 1) return null;

  return (
    <div className={`${styles.pagination} ${className}`}>
      {showFirstLast && (
        <button
          className={styles.button}
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          aria-label={t('first_page')}
        >
          {getThemedIcon('ui', 'chevrons_left', 16)}
        </button>
      )}
      
      <button
        className={styles.button}
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label={t('previous_page')}
      >
        {getThemedIcon('ui', 'chevron_left', 16)}
      </button>

      {getPageNumbers().map((page) => (
        <button
          key={page}
          className={`${styles.button} ${page === currentPage ? styles.active : ''}`}
          onClick={() => handlePageChange(page)}
        >
          {page}
        </button>
      ))}

      <button
        className={styles.button}
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label={t('next_page')}
      >
        {getThemedIcon('ui', 'chevron_right', 16)}
      </button>

      {showFirstLast && (
        <button
          className={styles.button}
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label={t('last_page')}
        >
          {getThemedIcon('ui', 'chevrons_right', 16)}
        </button>
      )}
    </div>
  );
};

export default Pagination;
