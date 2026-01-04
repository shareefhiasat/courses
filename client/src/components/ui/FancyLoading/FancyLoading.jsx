import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { DEFAULT_ACCENT, normalizeHexColor } from '../../../utils/color';
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
  const { user, userProfile } = useAuth();
  const [userAccentColor, setUserAccentColor] = useState(null); // Start with null to avoid maroon flash
  const [colorLoaded, setColorLoaded] = useState(false);
  
  useEffect(() => {
    const loadUserColor = async () => {
      // First try userProfile (fastest, already loaded)
      if (userProfile?.messageColor) {
        const color = normalizeHexColor(userProfile.messageColor, DEFAULT_ACCENT);
        setUserAccentColor(color);
        setColorLoaded(true);
        return;
      }
      
      // Try localStorage cache for instant load
      if (user?.uid) {
        try {
          const cachedColor = localStorage.getItem(`accent_color_${user.uid}`);
          if (cachedColor) {
            setUserAccentColor(normalizeHexColor(cachedColor, DEFAULT_ACCENT));
            setColorLoaded(true);
          }
        } catch {}
      }
      
      // Fallback: load from Firestore if user is available
      if (user?.uid) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const color = normalizeHexColor(data.messageColor, DEFAULT_ACCENT);
            setUserAccentColor(color);
            try {
              localStorage.setItem(`accent_color_${user.uid}`, color);
            } catch {}
            setColorLoaded(true);
          } else {
            setUserAccentColor(DEFAULT_ACCENT);
            setColorLoaded(true);
          }
        } catch (e) {
          console.warn('[FancyLoading] Error loading accent color:', e);
          setUserAccentColor(DEFAULT_ACCENT);
          setColorLoaded(true);
        }
      } else {
        // No user, use default color
        setUserAccentColor(DEFAULT_ACCENT);
        setColorLoaded(true);
      }
    };
    
    loadUserColor();
    
    // Listen for accent color changes (when user updates their color)
    const handler = (e) => {
      if (e?.detail?.color) {
        const color = normalizeHexColor(e.detail.color, DEFAULT_ACCENT);
        setUserAccentColor(color);
        if (user?.uid) {
          try {
            localStorage.setItem(`accent_color_${user.uid}`, color);
          } catch {}
        }
        setColorLoaded(true);
      }
    };
    window.addEventListener('accent-color-changed', handler);
    return () => window.removeEventListener('accent-color-changed', handler);
  }, [user, userProfile]);
  
  const primaryColor = userAccentColor || DEFAULT_ACCENT;
  const containerClass = fullscreen ? styles.fullscreen : styles.container;

  if (variant === 'minimal') {
    return (
      <div className={containerClass}>
        <div className={styles.minimal}>
          <Loader2 className={styles.spinnerIcon} size={40} style={{ color: primaryColor }} />
          {message && <p className={styles.message} style={{ color: primaryColor }}>{message}</p>}
        </div>
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className={containerClass} style={{ '--primary-color': primaryColor, opacity: colorLoaded ? 1 : 0, transition: 'opacity 0.2s ease-in' }}>
        <div className={styles.dotsWrapper}>
          <div className={styles.dots}>
            <div className={styles.dot} style={{ backgroundColor: primaryColor, borderColor: primaryColor }}></div>
            <div className={styles.dot} style={{ backgroundColor: primaryColor, borderColor: primaryColor }}></div>
            <div className={styles.dot} style={{ backgroundColor: primaryColor, borderColor: primaryColor }}></div>
          </div>
          {message && <p style={{ color: primaryColor, margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>{message}</p>}
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
          <div className={styles.logoRing} style={{ borderTopColor: primaryColor, borderRightColor: primaryColor }}></div>
          <div className={styles.logoRing2} style={{ borderTopColor: primaryColor, borderRightColor: primaryColor }}></div>
          <div className={styles.logo} style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor} 100%)` }}>
            <span className={styles.logoIcon}>📚</span>
          </div>
        </div>

        {/* Gradient Spinner */}
        <div className={styles.spinner}>
          <div className={styles.spinnerCircle} style={{ borderTopColor: primaryColor }}></div>
        </div>

        {/* Message */}
        {message && (
          <div className={styles.messageWrapper}>
            <p style={{ color: primaryColor, margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>{message}</p>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ background: `linear-gradient(90deg, ${primaryColor} 0%, ${primaryColor} 50%, ${primaryColor} 100%)` }}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FancyLoading;
