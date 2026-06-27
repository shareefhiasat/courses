import { useState, useCallback } from 'react';

export function usePanelLayout(storageKey, defaultLayout) {
  const [layout, setLayout] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {
      // ignore
    }
    return defaultLayout;
  });

  const handleLayoutChange = useCallback((newLayout) => {
    setLayout(newLayout);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newLayout));
    } catch (e) {
      // ignore
    }
  }, [storageKey]);

  return [layout, handleLayoutChange];
}
