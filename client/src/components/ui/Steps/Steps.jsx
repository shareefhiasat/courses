import React from 'react';
import { Check } from 'lucide-react';
import styles from './Steps.module.css';

/**
 * Steps Component
 * 
 * Step-by-step progress indicator.
 */
const Steps = ({
  steps = [],
  current = 0,
  direction = 'horizontal',
  className = '',
}) => {
  const stepsClasses = [
    styles.steps,
    styles[direction],
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={stepsClasses}>
      {steps.map((step, index) => {
        const isCompleted = index < current;
        const isCurrent = index === current;
        const isUpcoming = index > current;

        const stepClasses = [
          styles.step,
          isCompleted && styles.completed,
          isCurrent && styles.current,
          isUpcoming && styles.upcoming,
        ].filter(Boolean).join(' ');

        return (
          <div key={index} className={stepClasses}>
            <div className={styles.stepIndicator}>
              <div className={styles.stepCircle}>
                {isCompleted ? (
                  <Check size={16} />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={styles.stepLine} />
              )}
            </div>
            <div className={styles.stepContent}>
              <div className={styles.stepTitle}>{step.title}</div>
              {step.description && (
                <div className={styles.stepDescription}>{step.description}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Steps;
