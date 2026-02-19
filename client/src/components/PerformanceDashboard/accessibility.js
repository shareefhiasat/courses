/**
 * Accessibility and Responsive Design Enhancements
 * WCAG 2.1 AA compliance and mobile-first responsive utilities
 */

// Accessibility utilities
export const accessibilityUtils = {
  // ARIA label generators
  generateMetricCardLabel: (metricName, value, unit, status) => {
    return `${metricName}: ${value} ${unit}. Status: ${status}`;
  },

  generateTableSortLabel: (column, direction) => {
    return `Sort by ${column}, currently ${direction === 'asc' ? 'ascending' : 'descending'}`;
  },

  generateHealthStatusLabel: (status, details) => {
    const statusText = status.charAt(0).toUpperCase() + status.slice(1);
    return `Health status: ${statusText}. ${details}`;
  },

  // Keyboard navigation helpers
  trapFocus: (element) => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            lastFocusable.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            firstFocusable.focus();
            e.preventDefault();
          }
        }
      }
    };

    element.addEventListener('keydown', handleKeyDown);
    return () => element.removeEventListener('keydown', handleKeyDown);
  },

  // Screen reader announcements
  announceToScreenReader: (message) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  },

  // Color contrast checker
  checkColorContrast: (foreground, background) => {
    const getLuminance = (hex) => {
      const rgb = parseInt(hex.slice(1), 16);
      const r = (rgb >> 16) & 0xff;
      const g = (rgb >> 8) & 0xff;
      const b = (rgb >> 0) & 0xff;
      
      const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);
    
    const contrast = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    
    return {
      ratio: contrast,
      wcagAA: contrast >= 4.5,
      wcagAAA: contrast >= 7,
      wcagAALarge: contrast >= 3,
      wcagAAALarge: contrast >= 4.5
    };
  }
};

// Responsive design utilities
export const responsiveUtils = {
  // Breakpoint definitions
  breakpoints: {
    xs: '320px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },

  // Media query helpers
  isMobile: () => window.innerWidth < 768,
  isTablet: () => window.innerWidth >= 768 && window.innerWidth < 1024,
  isDesktop: () => window.innerWidth >= 1024,

  // Touch device detection
  isTouchDevice: () => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },

  // Responsive font sizing
  getResponsiveFontSize: (sizes) => {
    const width = window.innerWidth;
    
    if (width < 640) return sizes.xs || sizes.base;
    if (width < 768) return sizes.sm || sizes.base;
    if (width < 1024) return sizes.md || sizes.base;
    if (width < 1280) return sizes.lg || sizes.base;
    return sizes.xl || sizes.base;
  },

  // Responsive spacing
  getResponsiveSpacing: (sizes) => {
    const width = window.innerWidth;
    
    if (width < 640) return sizes.xs || sizes.base;
    if (width < 768) return sizes.sm || sizes.base;
    if (width < 1024) return sizes.md || sizes.base;
    if (width < 1280) return sizes.lg || sizes.base;
    return sizes.xl || sizes.base;
  },

  // Adaptive layout helpers
  getGridLayout: (breakpoints) => {
    const width = window.innerWidth;
    
    if (width < breakpoints.sm) return breakpoints.xs || 1;
    if (width < breakpoints.md) return breakpoints.sm || 2;
    if (width < breakpoints.lg) return breakpoints.md || 3;
    if (width < breakpoints.xl) return breakpoints.lg || 4;
    return breakpoints.xl || breakpoints.lg || 4;
  }
};

// Performance optimization utilities
export const performanceUtils = {
  // Debounce for performance
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Throttle for performance
  throttle: (func, limit) => {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Lazy loading helper
  lazyLoad: (element, callback, options = {}) => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            callback(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, ...options }
    );
    
    observer.observe(element);
    return observer;
  },

  // Virtual scrolling helper
  createVirtualScroll: (container, itemHeight, renderItem) => {
    let scrollTop = 0;
    let containerHeight = 0;
    let totalItems = 0;
    let visibleStart = 0;
    let visibleEnd = 0;

    const updateVisibleRange = () => {
      visibleStart = Math.floor(scrollTop / itemHeight);
      visibleEnd = Math.min(
        totalItems - 1,
        Math.floor((scrollTop + containerHeight) / itemHeight)
      );
    };

    const render = () => {
      const fragment = document.createDocumentFragment();
      
      for (let i = visibleStart; i <= visibleEnd; i++) {
        const item = renderItem(i, i * itemHeight);
        fragment.appendChild(item);
      }
      
      container.innerHTML = '';
      container.appendChild(fragment);
    };

    const handleScroll = performanceUtils.throttle(() => {
      scrollTop = container.scrollTop;
      updateVisibleRange();
      render();
    }, 16);

    container.addEventListener('scroll', handleScroll);

    return {
      setItems: (count) => {
        totalItems = count;
        containerHeight = container.clientHeight;
        updateVisibleRange();
        render();
      },
      destroy: () => {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }
};

// Theme utilities
export const themeUtils = {
  // Dark mode detection
  isDarkMode: () => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  },

  // Reduced motion detection
  prefersReducedMotion: () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  // High contrast detection
  prefersHighContrast: () => {
    return window.matchMedia('(prefers-contrast: high)').matches;
  },

  // Theme change listener
  watchThemeChanges: (callback) => {
    const mediaQueries = [
      window.matchMedia('(prefers-color-scheme: dark)'),
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(prefers-contrast: high)')
    ];

    const handleChange = () => {
      callback({
        isDark: themeUtils.isDarkMode(),
        reducedMotion: themeUtils.prefersReducedMotion(),
        highContrast: themeUtils.prefersHighContrast()
      });
    };

    mediaQueries.forEach(mq => mq.addListener(handleChange));
    
    return () => {
      mediaQueries.forEach(mq => mq.removeListener(handleChange));
    };
  }
};

// Error handling utilities
export const errorUtils = {
  // Error boundary fallback
  createErrorFallback: (error, errorInfo) => {
    return {
      message: error.message || 'An unexpected error occurred',
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    };
  },

  // Retry mechanism
  retry: async (fn, maxAttempts = 3, delay = 1000) => {
    let lastError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxAttempts) {
          throw lastError;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
      }
    }
  },

  // Safe function wrapper
  safe: (fn, fallback = null) => {
    try {
      return fn();
    } catch (error) {
      console.error('Safe function error:', error);
      return fallback;
    }
  }
};

// Export all utilities
export default {
  accessibility: accessibilityUtils,
  responsive: responsiveUtils,
  performance: performanceUtils,
  theme: themeUtils,
  error: errorUtils
};
