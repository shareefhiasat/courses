import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@services/other/config';
import logger from '@utils/logger';

/**
 * useWidgetDashboard
 * Persists widget configs to Firestore: users/{uid}/preferences (field: dashboards.{dashboardKey})
 * Falls back to localStorage if user is not authenticated.
 *
 * Returns: { widgets, setWidgets, pinnedIds, setPinnedIds, loading }
 */
const useWidgetDashboard = (uid, dashboardKey, defaultWidgets = []) => {
  const [widgets, setWidgetsState] = useState(defaultWidgets);
  const [pinnedIds, setPinnedIdsState] = useState([]);
  const [loading, setLoading] = useState(true);
  const saveTimerRef = useRef(null);
  const skipSaveRef = useRef(false);

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      if (uid) {
        try {
          const ref = doc(db, 'users', uid);
          const snap = await getDoc(ref);
          if (!cancelled && snap.exists()) {
            const prefs = snap.data()?.preferences?.dashboards?.[dashboardKey];
            if (prefs?.widgets?.length) {
              setWidgetsState(prefs.widgets);
              setPinnedIdsState(prefs.pinnedIds || []);
              setLoading(false);
              return;
            }
          }
        } catch (e) {
          logger.warn('[useWidgetDashboard] Firestore load failed, falling back to localStorage:', e);
        }
      }

      // Fallback: localStorage
      try {
        const saved = localStorage.getItem(`wdg_${dashboardKey}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (!cancelled) {
            setWidgetsState(parsed.widgets || defaultWidgets);
            setPinnedIdsState(parsed.pinnedIds || []);
          }
        }
      } catch {}

      if (!cancelled) setLoading(false);
    };

    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, dashboardKey]);

  // ── Debounced save ────────────────────────────────────────────────────────
  const debouncedSave = useCallback((nextWidgets, nextPinned) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const payload = { widgets: nextWidgets, pinnedIds: nextPinned };

      // Always write localStorage as fast cache
      try {
        localStorage.setItem(`wdg_${dashboardKey}`, JSON.stringify(payload));
      } catch {}

      // Write Firestore if authenticated
      if (uid) {
        try {
          const ref = doc(db, 'users', uid);
          await setDoc(ref, {
            preferences: {
              dashboards: {
                [dashboardKey]: { ...payload, updatedAt: serverTimestamp() }
              }
            }
          }, { merge: true });
        } catch (e) {
          logger.warn('[useWidgetDashboard] Firestore save failed:', e);
        }
      }
    }, 800);
  }, [uid, dashboardKey]);

  // ── Setters that also persist ─────────────────────────────────────────────
  const setWidgets = useCallback((next, skipSave = false) => {
    const resolved = typeof next === 'function' ? next(widgets) : next;
    setWidgetsState(resolved);
    if (!skipSave && !skipSaveRef.current) {
      debouncedSave(resolved, pinnedIds);
    }
  }, [widgets, pinnedIds, debouncedSave]);

  // ── Control save mechanism ────────────────────────────────────────────────
  const setSkipSave = useCallback((skip) => {
    skipSaveRef.current = skip;
  }, []);

  const setPinnedIds = useCallback((next) => {
    const resolved = typeof next === 'function' ? next(pinnedIds) : next;
    setPinnedIdsState(resolved);
    debouncedSave(widgets, resolved);
  }, [widgets, pinnedIds, debouncedSave]);

  return { widgets, setWidgets, pinnedIds, setPinnedIds, loading, setSkipSave };
};

export default useWidgetDashboard;
