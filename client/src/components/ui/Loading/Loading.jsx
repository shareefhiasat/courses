import React from 'react';
import Spinner from '../Spinner';
import FancyLoading from '../FancyLoading';
import styles from './Loading.module.css';

/**
 * Loading Component
 * 
 * Unified loading state component that can be used throughout the application.
 * Supports multiple variants: spinner, fancy, overlay, fullscreen
 * 
 * @example
 * // Simple spinner
 * <Loading />
 * 
 * // Fancy loading with message
 * <Loading variant="fancy" message="Loading data..." />
 * 
 * // Fullscreen overlay
 * <Loading variant="overlay" message="Processing..." />
 * 
 * // Inline spinner with custom size
 * <Loading size="lg" message="Please wait..." />
 */
const Loading = ({
  variant = 'spinner', // 'spinner' | 'fancy' | 'overlay' | 'fullscreen' | 'inline'
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  message = '',
  fullscreen = false,
  overlay = false,
  className = '',
  style = {},
  fancyVariant = 'dots', // For FancyLoading: 'dots' | 'pulse' | 'bars' | 'ring' | 'dual-ring'
}) => {
  // Determine which variant to use
  const isFancy = variant === 'fancy';
  const isOverlay = variant === 'overlay' || overlay;
  const isFullscreen = variant === 'fullscreen' || fullscreen;
  const isInline = variant === 'inline';

  // Full-page QAF-style overlay using FancyLoading
  if (isOverlay || isFullscreen) {
    return (
      <FancyLoading
        fullscreen
        variant={fancyVariant || 'default'}
        message={message}
      />
    );
  }

  // Centered fancy loader (non-overlay)
  if (isFancy) {
    return (
      <FancyLoading
        fullscreen={false}
        variant={fancyVariant || 'default'}
        message={message}
      />
    );
  }

  // Render inline loading
  if (isInline) {
    return (
      <span className={`${styles.inline} ${className}`} style={style}>
        <Spinner size={size} />
        {message && <span className={styles.inlineMessage}>{message}</span>}
      </span>
    );
  }

  // Default: centered spinner
  return (
    <div className={`${styles.loadingContainer} ${className}`} style={style}>
      <Spinner size={size} />
      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
};

export default Loading;
