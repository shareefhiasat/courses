import React, { useState, useEffect } from 'react';
import styles from './FancyLoading.module.css';

/**
 * FancyLoading - Beautiful overlay loading component with logo
 *
 * @param {boolean} fullscreen - Whether to cover the entire screen
 */
export const FancyLoading = ({
  fullscreen = false,
}) => {
  const [brandLoadFailed, setBrandLoadFailed] = useState(false);
  
  const containerClass = fullscreen ? styles.fullscreen : styles.container;

  // Inline styles as backup for rotation animation
  const rotatingStyle = {
    animation: 'rotate 4s linear infinite',
    WebkitAnimation: 'rotate 4s linear infinite',
    MozAnimation: 'rotate 4s linear infinite',
    transformOrigin: 'center center',
    WebkitTransformOrigin: 'center center',
    MozTransformOrigin: 'center center'
  };

  return (
    <div className={containerClass}>
      <div className={styles.brandWrapper}>
        {!brandLoadFailed ? (
          <img
            src="https://upload.wikimedia.org/wikipedia/en/thumb/2/21/Seal_of_the_Qatar_Armed_Forces_General_Command.png/255px-Seal_of_the_Qatar_Armed_Forces_General_Command.png"
            alt="Qatar Armed Forces Seal"
            className={styles.brandLogo}
            style={rotatingStyle}
            onError={() => setBrandLoadFailed(true)}
          />
        ) : (
          <div className={styles.brandLogoFallback}>QAF</div>
        )}
      </div>
    </div>
  );
};

export default FancyLoading;
