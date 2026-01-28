import React, { useState, useEffect } from 'react';
import styles from './FancyLoading.module.css';

/**
 * FancyLoading - Beautiful overlay loading component with logo
 *
 * @param {boolean} fullscreen - Whether to cover the entire screen
 * @param {boolean} standalone - Whether to show standalone without container
 */
export const FancyLoading = ({
  fullscreen = false,
  standalone = false,
}) => {
  const [brandLoadFailed, setBrandLoadFailed] = useState(false);
  
  console.log('🔍 FancyLoading: Rendering with props:', { fullscreen, standalone });
  
  const containerClass = fullscreen ? styles.fullscreen : (standalone ? styles.standalone : styles.container);

  // Inline styles as backup for rotation animation
  const rotatingStyle = {
    animation: 'rotate 4s linear infinite',
    WebkitAnimation: 'rotate 4s linear infinite',
    MozAnimation: 'rotate 4s linear infinite',
    transformOrigin: 'center center',
    WebkitTransformOrigin: 'center center',
    MozTransformOrigin: 'center center'
  };

  if (standalone) {
    // Return just the rotating logo without container
    return (
      <div className={styles.brandWrapper}>
        {!brandLoadFailed ? (
          <img
            src="/qaf_logo_transparent.png"
            alt="Qatar Armed Forces Seal"
            className={styles.brandLogo}
            style={rotatingStyle}
            onError={(e) => {
              console.log('🔍 FancyLoading: Logo failed to load', e);
              setBrandLoadFailed(true);
            }}
            onLoad={() => {
              console.log('🔍 FancyLoading: Logo loaded successfully');
            }}
          />
        ) : (
          <div className={styles.brandLogoFallback}>QAF</div>
        )}
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <div className={styles.brandWrapper}>
        {!brandLoadFailed ? (
          <img
            src="/qaf_logo_transparent.png"
            alt="Qatar Armed Forces Seal"
            className={styles.brandLogo}
            style={rotatingStyle}
            onError={(e) => {
              console.log('🔍 FancyLoading: Logo failed to load', e);
              setBrandLoadFailed(true);
            }}
            onLoad={() => {
              console.log('🔍 FancyLoading: Logo loaded successfully');
            }}
          />
        ) : (
          <div className={styles.brandLogoFallback}>QAF</div>
        )}
      </div>
    </div>
  );
};

export default FancyLoading;
