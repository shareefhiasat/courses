/**
 * Formula Sheet Component (Phase 4.1)
 * Reference materials attachment for quizzes
 */

import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp, Download, FileText } from 'lucide-react';
import styles from './FormulaSheet.module.css';

const FormulaSheet = ({ formulas = [], onClose }) => {
  const [expandedSections, setExpandedSections] = useState({});

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
            <X size={18} />
          </button>
        </div>
        <div className={styles.empty}>
          <FileText size={48} />
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
          <button onClick={downloadSheet} className={styles.downloadBtn} title="Download">
            <Download size={16} />
          </button>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={18} />
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
                <ChevronUp size={20} />
              ) : (
                <ChevronDown size={20} />
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
