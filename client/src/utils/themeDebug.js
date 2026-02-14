/**
 * Debug utility to track CSS variables and theme application
 * Add this script to browser console or include in development builds
 */

import logger from './logger';

export const debugThemeVariables = () => {
  // console.group('🎨 [Theme Debug] CSS Variables Analysis');
  
  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);
  
  // Get all relevant CSS variables
  const variables = [
    '--color-primary',
    '--color-primary-light', 
    '--color-primary-dark',
    '--color-primary-rgb',
    '--brand',
    '--brand2',
    '--btn',
    '--input-focus'
  ];
  
  // console.table(
  //   variables.map(varName => ({
  //     Variable: varName,
  //     'CSS Value': computedStyle.getPropertyValue(varName).trim() || 'NOT SET',
  //     'Direct Style': root.style.getPropertyValue(varName).trim() || 'NOT SET'
  //   }))
  // );
  
  // Check localStorage
  // console.group('🎨 [Theme Debug] localStorage Analysis');
  const storageKeys = Object.keys(localStorage).filter(key => key.includes('color') || key.includes('accent'));
  storageKeys.forEach(key => {
    // console.log(`${key}:`, localStorage.getItem(key));
  });
  // console.groupEnd();
  
  // Test actual element colors with retry logic
  // console.group('🎨 [Theme Debug] Element Computed Styles');
  
  const testElements = [
    { selector: 'input', name: 'Input' },
    { selector: 'textarea', name: 'Textarea' },
    { selector: '.brandLogo', name: 'Brand Logo' },
    { selector: '.input', name: '.input class' },
    { selector: '.textarea', name: '.textarea class' }
  ];
  
  testElements.forEach(({ selector, name }) => {
    const element = document.querySelector(selector);
    if (element) {
      const styles = getComputedStyle(element);
      // console.log(`${name}:`, {
      //   borderColor: styles.borderColor,
      //   boxShadow: styles.boxShadow,
      //   outlineColor: styles.outlineColor,
      //   backgroundColor: styles.backgroundColor,
      //   color: styles.color
      // });
    } else {
      // console.log(`${name}: Element not found with selector '${selector}'`);
    }
  });
  // console.groupEnd();
  
  // console.groupEnd();
};

// Auto-debug on load (development only)
if (process.env.NODE_ENV === 'development') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(debugThemeVariables, 1000);
    });
  } else {
    setTimeout(debugThemeVariables, 1000);
  }
}

// Real-time monitoring
export const startThemeMonitoring = () => {
  logger.log('🎨 [Theme Debug] Starting real-time monitoring...');
  
  // Monitor CSS variable changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
        const root = document.documentElement;
        const primaryColor = root.style.getPropertyValue('--color-primary');
        if (primaryColor) {
          logger.log('🎨 [Theme Debug] CSS variable changed:', {
            '--color-primary': primaryColor,
            '--brand': root.style.getPropertyValue('--brand'),
            timestamp: new Date().toISOString()
          });
        }
      }
    });
  });
  
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['style']
  });
  
  // Monitor input focus events
  document.addEventListener('focusin', (e) => {
    if (e.target.matches('input, textarea')) {
      const styles = getComputedStyle(e.target);
      // console.log('🎨 [Theme Debug] Input focused:', {
        //   element: e.target.tagName + (e.target.className ? '.' + e.target.className : ''),
        //   borderColor: styles.borderColor,
        //   boxShadow: styles.boxShadow,
        //   outlineColor: styles.outlineColor
        //   });
    }
  });
  
  return observer;
};

// Test specific element
export const debugElement = (selector) => {
  const element = document.querySelector(selector);
  if (!element) {
    // console.log(`🎨 [Theme Debug] Element not found: ${selector}`);
    return;
  }
  
  const styles = getComputedStyle(element);
  const parentStyles = getComputedStyle(element.parentElement);
  
  // console.group(`🎨 [Theme Debug] Element Analysis: ${selector}`);
  // console.log('Element:', element);
  // console.log('Computed Styles:', {
  //   borderColor: styles.borderColor,
  //   boxShadow: styles.boxShadow,
  //   outlineColor: styles.outlineColor,
  //   backgroundColor: styles.backgroundColor,
  //   color: styles.color,
  //   border: styles.border,
  //   outline: styles.outline
  // });
  // console.log('Parent Computed Styles:', {
  //   borderColor: parentStyles.borderColor,
  //   boxShadow: parentStyles.boxShadow,
  //   outlineColor: parentStyles.outlineColor
  // });
  // console.groupEnd();
};

// Make available globally for manual debugging
if (typeof window !== 'undefined') {
  window.debugThemeVariables = debugThemeVariables;
  window.startThemeMonitoring = startThemeMonitoring;
  window.debugElement = debugElement;
  // console.log('🎨 [Theme Debug] Available commands:');
  // console.log('  debugThemeVariables() - Analyze all theme variables');
  // console.log('  startThemeMonitoring() - Start real-time monitoring');
  // console.log('  debugElement("selector") - Debug specific element');
}
