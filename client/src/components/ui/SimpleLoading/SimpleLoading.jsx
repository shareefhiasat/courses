import React from 'react';
import './SimpleLoading.css';

/**
 * SimpleLoading - A simplified, single loading component
 * Easy to use, prevents flickering, minimal configuration
 * 
 * @param {Object} props
 * @param {boolean} props.loading - Whether to show loading
 * @param {string} props.type - 'brand' | 'spinner' (default: 'brand')
 * @param {string} props.size - 'sm' | 'md' | 'lg' (default: 'md')
 * @param {boolean} props.overlay - Show as overlay (default: false)
 * @param {boolean} props.fullscreen - Show fullscreen (default: false)
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Additional inline styles
 */
const SimpleLoading = ({
  loading = true,
  type = 'brand',
  size = 'md',
  overlay = false,
  fullscreen = false,
  className = '',
  style = {},
  children
}) => {
  if (!loading) {
    return children || null;
  }

  const containerClass = [
    'simple-loading',
    fullscreen ? 'simple-loading--fullscreen' : '',
    overlay ? 'simple-loading--overlay' : '',
    `simple-loading--${size}`,
    className
  ].filter(Boolean).join(' ');

  const renderContent = () => {
    switch (type) {
      case 'brand':
        return (
          <div className="simple-loading__brand">
            <div className="simple-loading__brand-logo">
              <img 
                src="/qaf_logo_transparent.png" 
                alt="Loading..." 
                className="simple-loading__brand-img"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="simple-loading__brand-fallback">QAF</div>
            </div>
          </div>
        );
      
      case 'spinner':
      default:
        return (
          <div className="simple-loading__spinner">
            <div className="simple-loading__spinner-circle"></div>
          </div>
        );
    }
  };

  return (
    <div className={containerClass} style={style}>
      <div className="simple-loading__content">
        {renderContent()}
      </div>
    </div>
  );
};

// Brand-only fullscreen (no message) - Used by GlobalLoadingContext
SimpleLoading.BrandFullscreen = (props) => (
  <SimpleLoading fullscreen loading type="brand" size="lg" {...props} />
);

// Brand-only overlay (no message) - Used by legacy or specific overlay needs
SimpleLoading.BrandOverlay = (props) => (
  <SimpleLoading overlay loading type="brand" {...props} />
);

export default SimpleLoading;
