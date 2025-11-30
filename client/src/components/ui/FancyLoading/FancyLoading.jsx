import React from 'react';
import { Loader2 } from 'lucide-react';
import styles from './FancyLoading.module.css';

/**
 * FancyLoading - Beautiful overlay loading component with logo
 * 
 * @param {string} message - Loading message to display
 * @param {boolean} fullscreen - Whether to cover the entire screen
 * @param {string} variant - 'default' | 'minimal' | 'pulse' | 'dots'
 */
export const FancyLoading = ({ 
  message = 'Loading...', 
  fullscreen = false,
  variant = 'default'
}) => {
  const containerClass = fullscreen ? styles.fullscreen : styles.container;

  if (variant === 'minimal') {
    return (
      <div className={containerClass}>
        <div className={styles.minimal}>
          <Loader2 className={styles.spinnerIcon} size={40} />
          {message && <p className={styles.message}>{message}</p>}
        </div>
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className={containerClass}>
        <div className={styles.dotsWrapper}>
          <div className={styles.dots}>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
          </div>
          {message && <p className={styles.message}>{message}</p>}
        </div>
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={containerClass}>
        <div className={styles.pulseWrapper}>
          <div className={styles.pulse}>
            <div className={styles.pulseRing}></div>
            <div className={styles.pulseRing}></div>
            <div className={styles.pulseRing}></div>
            <div className={styles.pulseLogo}>📚</div>
          </div>
          {message && <p className={styles.message}>{message}</p>}
        </div>
      </div>
    );
  }

  // Default variant - Beautiful gradient spinner with logo
  return (
    <div className={containerClass}>
      <div className={styles.content}>
        {/* Animated Logo */}
        <div className={styles.logoWrapper}>
          <div className={styles.logoRing}></div>
          <div className={styles.logoRing2}></div>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>📚</span>
          </div>
        </div>

        {/* Gradient Spinner */}
        <div className={styles.spinner}>
          <div className={styles.spinnerCircle}></div>
        </div>

        {/* Message */}
        {message && (
          <div className={styles.messageWrapper}>
            <p className={styles.message}>{message}</p>
            <div className={styles.progressBar}>
              <div className={styles.progressFill}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FancyLoading;
