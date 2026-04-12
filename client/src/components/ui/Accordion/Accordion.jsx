import React, { useState } from 'react';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import styles from './Accordion.module.css';


import { info, error, warn, debug } from '@services/utils/logger.js';/**
 * Accordion Component
 * 
 * Collapsible content sections.
 */
const AccordionItem = ({ title, children, isOpen, onToggle }) => {
  const { theme } = useTheme();
  
  return (
    <div className={styles.item}>
      <button className={styles.header} onClick={onToggle}>
        <span className={styles.title}>{title}</span>
        <span className={`${styles.icon} ${isOpen ? styles.iconOpen : ''}`}>
          {getThemedIcon('ui', 'chevron_down', 20, theme)}
        </span>
      </button>
      <div className={`${styles.content} ${isOpen ? styles.contentOpen : ''}`}>
        <div className={styles.contentInner}>{children}</div>
      </div>
    </div>
  );
};

const Accordion = ({
  items,
  allowMultiple = false,
  defaultOpen = [],
  className = '',
}) => {
  const [openItems, setOpenItems] = useState(new Set(defaultOpen));

  const handleToggle = (index) => {
    const newOpenItems = new Set(openItems);
    
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      if (!allowMultiple) {
        newOpenItems.clear();
      }
      newOpenItems.add(index);
    }
    
    setOpenItems(newOpenItems);
  };

  return (
    <div className={`${styles.accordion} ${className}`}>
      {items.map((item, index) => (
        <AccordionItem
          key={index}
          title={item.title}
          isOpen={openItems.has(index)}
          onToggle={() => handleToggle(index)}
        >
          {item.content}
        </AccordionItem>
      ))}
    </div>
  );
};

export default Accordion;
