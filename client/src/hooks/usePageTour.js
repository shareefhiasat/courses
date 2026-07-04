import { useState, useEffect, useCallback, useMemo } from 'react';
import TourTooltip from '@ui/TourTooltip/TourTooltip';
import { useLang } from '@contexts/LangContext';
import {
  scheduleTourStart,
  registerPageTour,
  registerTourAvailability,
  notifyPageTourFinished,
  requestTourStart,
  releaseTour,
} from '@utils/tourScheduler';

/**
 * Standard page-level tour hook.
 * Registers with the global tour router so only one Joyride runs at a time.
 *
 * @param {string} id - unique page id for tourScheduler
 * @param {string} keyPrefix - localStorage prefix, e.g. `programsTourSeen` (lang appended automatically)
 * @param {Array|function} stepsOrBuilder - static step array or () => steps (DOM-filtered when builder)
 * @param {object} [options]
 * @param {boolean} [options.autoStart=true] - first-visit auto-start via scheduleTourStart
 * @param {boolean} [options.registerBadge=true] - contribute to navbar help badge count
 */
export function usePageTour(id, keyPrefix, stepsOrBuilder, options = {}) {
  const { autoStart = true, registerBadge = true } = options;
  const { lang } = useLang();
  const tourSeenKey = `${keyPrefix}_${lang}`;

  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState([]);

  const resolveSteps = useCallback(() => {
    const raw = typeof stepsOrBuilder === 'function' ? stepsOrBuilder() : stepsOrBuilder;
    const list = raw || [];
    return list.filter(
      (s) => !s.target || s.target === 'body' || !!document.querySelector(s.target)
    );
  }, [stepsOrBuilder]);

  const getStepCount = useCallback(() => resolveSteps().length, [resolveSteps]);

  const startTour = useCallback(() => {
    const built = resolveSteps();
    if (!built.length) return;
    requestTourStart(id, () => {
      setSteps(built);
      setRun(true);
    });
  }, [resolveSteps, id]);

  useEffect(() => registerPageTour(id, startTour, getStepCount), [id, startTour, getStepCount]);

  useEffect(() => {
    if (!registerBadge) return undefined;
    return registerTourAvailability(id, {
      tourSeenKey: (l) => `${keyPrefix}_${l}`,
      getStepCount,
    });
  }, [id, keyPrefix, getStepCount, registerBadge]);

  useEffect(() => {
    if (!autoStart) return undefined;
    return scheduleTourStart(tourSeenKey, lang, startTour);
  }, [tourSeenKey, lang, startTour, autoStart]);

  const callback = useCallback(
    (data) => {
      const { status, action } = data || {};
      if (status === 'finished' || status === 'skipped' || action === 'close') {
        setRun(false);
        try {
          localStorage.setItem(tourSeenKey, 'true');
        } catch {
          /* ignore */
        }
        releaseTour(id);
        notifyPageTourFinished({ id });
      }
    },
    [tourSeenKey, id]
  );

  const TourTooltipComponent = useMemo(
    () => TourTooltip({ tourSeenKey }),
    [tourSeenKey]
  );

  return { run, steps, startTour, callback, tourSeenKey, TourTooltipComponent };
}
