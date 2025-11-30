import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './Dropdown.module.css';

/**
 * Dropdown Component
 * 
 * A dropdown menu with customizable trigger and items.
 */
const Dropdown = ({
  trigger,
  items,
  align = 'start',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleItemClick = (item) => {
    if (item.onClick) {
      item.onClick();
    }
    if (!item.keepOpen) {
      setIsOpen(false);
    }
  };

  return (
    <div className={`${styles.dropdown} ${className}`} ref={dropdownRef}>
      <div className={styles.trigger} onClick={() => setIsOpen(!isOpen)}>
        {trigger || (
          <button className={styles.defaultTrigger}>
            Menu <ChevronDown size={16} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className={`${styles.menu} ${styles[`align-${align}`]}`}>
          {items.map((item, index) => (
            <React.Fragment key={index}>
              {item.divider ? (
                <div className={styles.divider} />
              ) : (
                <button
                  className={`${styles.item} ${item.danger ? styles.danger : ''} ${item.disabled ? styles.disabled : ''}`}
                  onClick={() => !item.disabled && handleItemClick(item)}
                  disabled={item.disabled}
                >
                  {item.icon && <span className={styles.icon}>{item.icon}</span>}
                  <span className={styles.label}>{item.label}</span>
                  {item.badge && <span className={styles.badge}>{item.badge}</span>}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
