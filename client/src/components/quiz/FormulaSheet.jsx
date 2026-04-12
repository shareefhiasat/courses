/**
 * Formula Sheet Component (Phase 4.1)
 * Reference materials attachment for quizzes
 */

import React, { useState, useEffect } from 'react';
import { getThemedIcon } from '@constants/iconTypes';
import { useLang } from '@contexts/LangContext';
import { ActivityLogger } from '@services/other/activityLogger';
import styles from './FormulaSheet.module.css';
import PortalTooltip from '@ui/PortalTooltip';


import { info, error, warn, debug } from '@services/utils/logger.js';const FormulaSheet = ({ formulas = [], onClose }) => {
  const { t } = useLang();
  const [expandedSections, setExpandedSections] = useState({});

  // Log formula sheet opened activity
  useEffect(() => {
    try {
      ActivityLogger.formulaSheetOpened();
    } catch (logError) {
      warn('Failed to log formula sheet opened activity:', logError);
    }
  }, []);

  const toggleSection = (index) => {
    setExpandedSections(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const downloadSheet = () => {
    const content = formulas.map(section => 
      `${section.title}\n${'-'.repeat(section.title.length)}\n${section.content}\n\n`
    ).join('');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'formula-sheet.txt';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!formulas || formulas.length === 0) {
    return (
      <div className={styles.formulaSheet}>
        <div className={styles.header}>
          <h3>Formula Sheet</h3>
          <button onClick={onClose} className={styles.closeBtn}>
            {getThemedIcon('ui', 'close', 18)}
          </button>
        </div>
        <div className={styles.empty}>
          {getThemedIcon('ui', 'file_text', 48)}
          <p>No formula sheet available for this quiz</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.formulaSheet}>
      <div className={styles.header}>
        <h3>Formula Sheet</h3>
        <div className={styles.headerActions}>
          <PortalTooltip content={t('download')} position="top">
          <button onClick={downloadSheet} className={styles.downloadBtn}>
            {getThemedIcon('ui', 'download', 16)}
          </button>
          </PortalTooltip>
          <button onClick={onClose} className={styles.closeBtn}>
            {getThemedIcon('ui', 'close', 18)}
          </button>
        </div>
      </div>

      <div className={styles.content}>
        {formulas.map((section, index) => (
          <div key={index} className={styles.section}>
            <button
              onClick={() => toggleSection(index)}
              className={styles.sectionHeader}
            >
              <h4>{section.title}</h4>
              {expandedSections[index] ? (
                getThemedIcon('ui', 'chevron_up', 20)
              ) : (
                getThemedIcon('ui', 'chevron_down', 20)
              )}
            </button>

            {expandedSections[index] && (
              <div className={styles.sectionContent}>
                {section.type === 'image' && section.imageUrl ? (
                  <img src={section.imageUrl} alt={section.title} className={styles.formulaImage} />
                ) : (
                  <pre className={styles.formulaText}>{section.content}</pre>
                )}
                
                {section.examples && section.examples.length > 0 && (
                  <div className={styles.examples}>
                    <h5>Examples:</h5>
                    {section.examples.map((example, i) => (
                      <div key={i} className={styles.example}>
                        <strong>Example {i + 1}:</strong>
                        <pre>{example}</pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FormulaSheet;

// Example usage data structure:
/*
const sampleFormulas = [
  {
    title: 'Algebra',
    content: 'Quadratic Formula: x = (-b ± √(b² - 4ac)) / 2a\nSlope Formula: m = (y₂ - y₁) / (x₂ - x₁)',
    examples: [
      'Solve x² + 5x + 6 = 0\nx = (-5 ± √(25 - 24)) / 2 = -2 or -3'
    ]
  },
  {
    title: 'Trigonometry',
    content: 'sin²θ + cos²θ = 1\ntan θ = sin θ / cos θ',
    type: 'image',
    imageUrl: '/formulas/trig.png'
  }
];
*/
