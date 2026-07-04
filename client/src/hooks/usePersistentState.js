import { useState, useCallback, useEffect } from 'react';

/**
 * Wraps useState with localStorage persistence.
 * The value is saved to localStorage on every change and restored on mount.
 *
 * @param {string} key - localStorage key
 * @param {*} initialValue - initial value if nothing in localStorage
 * @returns {[value, setValue]} - same API as useState
 */
export const usePersistentState = (key, initialValue) => {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) {
        return JSON.parse(saved);
      }
    } catch {}
    return typeof initialValue === 'function' ? initialValue() : initialValue;
  });

  const setPersistentValue = useCallback((next) => {
    setValue(prev => {
      const resolved = typeof next === 'function' ? next(prev) : next;
      try {
        localStorage.setItem(key, JSON.stringify(resolved));
      } catch {}
      return resolved;
    });
  }, [key]);

  return [value, setPersistentValue];
};

/**
 * Saves an object of filter values to localStorage under a composite key.
 * Useful for persisting multiple filters per tab/mode.
 *
 * @param {string} prefix - e.g. 'homepage_filters_activities'
 * @param {Object} filterValues - { completedFilter: false, pendingFilter: true, ... }
 */
export const saveFiltersToStorage = (prefix, filterValues) => {
  try {
    localStorage.setItem(prefix, JSON.stringify(filterValues));
  } catch {}
};

/**
 * Loads saved filter values from localStorage.
 *
 * @param {string} prefix - e.g. 'homepage_filters_activities'
 * @param {Object} defaults - default values for keys not found in storage
 * @returns {Object} merged filter values
 */
export const loadFiltersFromStorage = (prefix, defaults = {}) => {
  try {
    const saved = localStorage.getItem(prefix);
    if (saved) {
      return { ...defaults, ...JSON.parse(saved) };
    }
  } catch {}
  return defaults;
};

export default usePersistentState;
