import { useState, useEffect, useCallback } from 'react';
import { useLang } from '@contexts/LangContext';
import { getUnseenTourCount } from '@utils/tourScheduler';

/**
 * Navbar help-button badge: number of unseen guided tours on the current screen.
 */
export function useTourBadgeCount() {
  const { lang } = useLang();
  const refresh = useCallback(() => {
    try {
      return getUnseenTourCount(lang);
    } catch {
      return 0;
    }
  }, [lang]);

  const [count, setCount] = useState(refresh);

  useEffect(() => {
    setCount(refresh());
    const onChange = () => setCount(refresh());
    window.addEventListener('tour-availability-changed', onChange);
    window.addEventListener('page-tour-finished', onChange);
    window.addEventListener('dashboard-tour-finished', onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener('tour-availability-changed', onChange);
      window.removeEventListener('page-tour-finished', onChange);
      window.removeEventListener('dashboard-tour-finished', onChange);
      window.removeEventListener('storage', onChange);
    };
  }, [refresh]);

  return count;
}

export default useTourBadgeCount;
