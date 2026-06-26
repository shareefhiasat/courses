import { useState, useEffect, useCallback } from 'react';

/**
 * Shared guided-tour hook.
 * Handles: run state, step list, event listeners (app:joyride / app:help),
 * first-visit auto-start (localStorage), and callback.
 *
 * @param {string} storageKey  - unique key per page+lang, e.g. `notifTourSeen_en`
 * @param {Array}  steps       - Joyride step array
 */
export function useTour(storageKey, steps) {
  const [run, setRun] = useState(false);

  // Listen for global help / joyride events
  useEffect(() => {
    const start = () => setRun(true);
    window.addEventListener('app:joyride', start);
    window.addEventListener('app:help', start);
    return () => {
      window.removeEventListener('app:joyride', start);
      window.removeEventListener('app:help', start);
    };
  }, []);

  // Auto-start once per language
  useEffect(() => {
    try {
      if (storageKey && !localStorage.getItem(storageKey)) setRun(true);
    } catch {}
  }, [storageKey]);

  const callback = useCallback(
    (data) => {
      const { status } = data || {};
      if (status === 'finished' || status === 'skipped') {
        setRun(false);
        try {
          if (storageKey) localStorage.setItem(storageKey, 'true');
        } catch {}
      }
    },
    [storageKey]
  );

  return { run, setRun, steps, callback };
}
