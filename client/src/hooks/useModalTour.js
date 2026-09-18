import { useState, useEffect, useCallback, useMemo } from 'react';
import { ACTIONS, EVENTS, STATUS } from 'react-joyride';
import TourTooltip from '@ui/TourTooltip/TourTooltip';
import { requestTourStart, releaseTour } from '@utils/tourScheduler';
import { isOnboardingTourEnabled } from '@utils/tourConfig.js';

const STEP_PREPARE_MS = 150;

/** Wait for layout/paint after tab switches before Joyride measures targets. */
function afterLayout(cb) {
  requestAnimationFrame(() => {
    requestAnimationFrame(cb);
  });
}

/** Nudge Joyride to recalculate spotlight bounds after DOM updates. */
function nudgeJoyrideLayout() {
  try {
    window.dispatchEvent(new Event('resize'));
  } catch {
    /* ignore */
  }
}

/** Reset scroll on modal/dialog bodies so Joyride measures viewport coords. */
export function resetModalScrollForTarget(target) {
  if (!target || target === 'body') return;
  try {
    const el = document.querySelector(target);
    if (!el) return;
    let node = el.parentElement;
    while (node) {
      const { overflowY } = window.getComputedStyle(node);
      if (overflowY === 'auto' || overflowY === 'scroll') {
        node.scrollTop = 0;
      }
      if (node.getAttribute('role') === 'dialog') break;
      node = node.parentElement;
    }
  } catch {
    /* ignore */
  }
}

/** Scroll modal targets into view before Joyride measures spotlight position. */
export function scrollTourTargetIntoView(target) {
  if (!target || target === 'body') return;
  try {
    const el = document.querySelector(target);
    if (!el) return;

    const dialog = el.closest('[role="dialog"]');
    const modalBody = dialog?.querySelector('[data-modal-body]');
    if (modalBody && window.getComputedStyle(modalBody).overflowY === 'visible') {
      el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
      return;
    }

    resetModalScrollForTarget(target);
    el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
  } catch {
    /* ignore */
  }
}

/**
 * Joyride hook for tours inside modals/dialogs.
 * Uses controlled stepIndex, global tour mutex, and a short prepare delay so
 * tab switches / layout updates finish before the spotlight is positioned.
 */
export function useModalTour({
  id,
  tourSeenKey,
  buildSteps,
  onStepPrepare,
  autoStart = true,
  autoStartDelay = 400,
  enabled = true,
}) {
  // Auto-start stays gated by the JOYRIDE_TOUR flag; manual help events are
  // checked at dispatch time so the navbar help icon can still start the tour.
  const autoEnabled = enabled && isOnboardingTourEnabled();
  const [run, setRun] = useState(false);
  const [tourEngaged, setTourEngaged] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [steps, setSteps] = useState([]);

  const resolveSteps = useCallback(() => {
    const raw = typeof buildSteps === 'function' ? buildSteps() : buildSteps;
    return (raw || []).filter(
      (s) => !s.target || s.target === 'body' || !!document.querySelector(s.target)
    );
  }, [buildSteps]);

  const prepareStep = useCallback(
    (step, onReady) => {
      if (!step) {
        onReady?.();
        return;
      }
      onStepPrepare?.(step);
      afterLayout(() => {
        scrollTourTargetIntoView(step.target);
        nudgeJoyrideLayout();
        onReady?.();
      });
    },
    [onStepPrepare]
  );

  const startTour = useCallback(() => {
    const built = resolveSteps();
    if (!built.length) return;
    requestTourStart(id, () => {
      setSteps(built);
      setStepIndex(0);
      setTourEngaged(true);
      setRun(false);
      prepareStep(built[0], () => {
        setTimeout(() => {
          setRun(true);
          nudgeJoyrideLayout();
        }, STEP_PREPARE_MS);
      });
    });
  }, [id, resolveSteps, prepareStep]);

  useEffect(() => {
    if (!autoEnabled || !autoStart) return undefined;
    const timer = setTimeout(() => {
      try {
        if (!localStorage.getItem(tourSeenKey)) startTour();
      } catch {
        /* ignore */
      }
    }, autoStartDelay);
    return () => clearTimeout(timer);
  }, [tourSeenKey, startTour, autoStart, autoStartDelay, autoEnabled]);

  const advanceStep = useCallback(
    (nextIndex) => {
      const nextStep = steps[nextIndex];
      if (!nextStep) return;
      setRun(false);
      prepareStep(nextStep, () => {
        setTimeout(() => {
          setStepIndex(nextIndex);
          setRun(true);
          nudgeJoyrideLayout();
        }, STEP_PREPARE_MS);
      });
    },
    [steps, prepareStep]
  );

  const callback = useCallback(
    (data) => {
      const { status, action, index, type } = data || {};

      if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status) || action === ACTIONS.CLOSE) {
        setRun(false);
        setTourEngaged(false);
        releaseTour(id);
        try {
          localStorage.setItem(tourSeenKey, 'true');
        } catch {
          /* ignore */
        }
        return;
      }

      if (type === EVENTS.STEP_AFTER) {
        if (action === ACTIONS.NEXT) {
          advanceStep(index + 1);
        } else if (action === ACTIONS.PREV) {
          advanceStep(index - 1);
        }
      }
    },
    [steps, tourSeenKey, id, advanceStep]
  );

  useEffect(() => {
    if (!enabled) return undefined;
    const handler = () => { if (isOnboardingTourEnabled()) startTour(); };
    window.addEventListener('app:joyride', handler);
    window.addEventListener('app:help', handler);
    return () => {
      window.removeEventListener('app:joyride', handler);
      window.removeEventListener('app:help', handler);
    };
  }, [enabled, startTour]);

  const TourTooltipComponent = useMemo(
    () => TourTooltip({ tourSeenKey }),
    [tourSeenKey]
  );

  return {
    run: run && steps.length > 0,
    stepIndex,
    steps,
    startTour,
    callback,
    TourTooltipComponent,
    tourActive: tourEngaged,
  };
}
