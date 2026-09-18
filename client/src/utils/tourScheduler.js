/**
 * Tour scheduling utilities — cascade dashboard vs page tours without overlap.
 *
 * Auto-start (child pages):
 *   useEffect(() => scheduleTourStart(tourSeenKey, lang, startTour), [tourSeenKey, lang, startTour]);
 *
 * Help / joyride button (nested pages inside dashboard):
 *   useEffect(() => registerPageTour('my-page', startTour, getStepCount), [startTour, getStepCount]);
 *
 * Help badge count:
 *   registerTourAvailability('my-page', { tourSeenKey: (lang) => `..._${lang}`, getStepCount })
 */

import { isOnboardingTourEnabled, endManualTour } from '@utils/tourConfig.js';

const pageTourStack = [];
const tourProviders = new Map();
let tourRouterInstalled = false;

/** Only one Joyride may be active app-wide (prevents stacked overlays). */
let activeTourId = null;
const tourWaitQueue = [];

const QUEUE_DRAIN_MS = 450;

export function getActiveTourId() {
  return activeTourId;
}

export function isAnyTourActive() {
  return activeTourId !== null;
}

function drainTourQueue() {
  if (activeTourId || tourWaitQueue.length === 0) return;
  const next = tourWaitQueue.shift();
  activeTourId = next.id;
  next.startFn();
  window.dispatchEvent(new CustomEvent('tour-started', { detail: { id: next.id } }));
}

/**
 * Start a tour now, or queue it if another tour is already running.
 * Ensures tours always play one-after-another — never two overlays at once.
 */
export function requestTourStart(id, startFn) {
  if (!isOnboardingTourEnabled()) return;
  if (activeTourId === id) return;

  if (activeTourId) {
    const dupIdx = tourWaitQueue.findIndex((e) => e.id === id);
    if (dupIdx >= 0) tourWaitQueue.splice(dupIdx, 1);
    tourWaitQueue.push({ id, startFn });
    return;
  }

  activeTourId = id;
  startFn();
  window.dispatchEvent(new CustomEvent('tour-started', { detail: { id } }));
}

/** Call when a tour finishes, is skipped, or is closed. */
export function releaseTour(id) {
  if (activeTourId !== id) return;
  activeTourId = null;
  endManualTour();

  if (id === 'dashboard-shell') {
    window.dispatchEvent(new CustomEvent('dashboard-tour-finished'));
  }
  window.dispatchEvent(new CustomEvent('tour-ended', { detail: { id } }));
  notifyTourAvailabilityChanged();
  setTimeout(drainTourQueue, QUEUE_DRAIN_MS);
}

/** Force-stop a running tour (e.g. shell suppressed by a page tour). */
export function cancelTour(id) {
  if (activeTourId === id) {
    activeTourId = null;
    endManualTour();
    window.dispatchEvent(new CustomEvent('tour-ended', { detail: { id, cancelled: true } }));
    setTimeout(drainTourQueue, QUEUE_DRAIN_MS);
  }
  for (let i = tourWaitQueue.length - 1; i >= 0; i -= 1) {
    if (tourWaitQueue[i].id === id) tourWaitQueue.splice(i, 1);
  }
}

/**
 * Install a capture-phase router so help/joyride events reach only one tour.
 * Nested page tours (registerPageTour) win over shell tours and duplicate listeners.
 */
export function installTourEventRouter() {
  if (tourRouterInstalled) return;
  tourRouterInstalled = true;

  const route = (e) => {
    if (pageTourStack.length === 0) return;
    const top = pageTourStack[pageTourStack.length - 1];
    top.startTour();
    e.stopImmediatePropagation();
  };

  window.addEventListener('app:joyride', route, true);
  window.addEventListener('app:help', route, true);
}

/** Dashboard tabs whose embedded page owns its own tour on first visit. */
export const DASHBOARD_TABS_WITH_PAGE_TOUR = new Set([
  'user-category-access',
  'programs',
  'subjects',
  'classes',
  'enrollments',
  'manage-enrollments',
  'marks',
  'penalty',
  'participation',
  'behavior',
  'activities',
  'announcements',
  'resources',
]);

function notifyTourAvailabilityChanged() {
  window.dispatchEvent(new CustomEvent('tour-availability-changed'));
}

/** Register a tour for help-badge counting (unseen tours on current screen). */
export function registerTourAvailability(id, { tourSeenKey, getStepCount }) {
  tourProviders.set(id, { tourSeenKey, getStepCount });
  notifyTourAvailabilityChanged();
  return () => {
    tourProviders.delete(id);
    notifyTourAvailabilityChanged();
  };
}

/** Count unseen tours (not steps) available on the current screen. */
export function getUnseenTourCount(lang) {
  let count = 0;
  for (const provider of tourProviders.values()) {
    try {
      const key = provider.tourSeenKey(lang);
      if (localStorage.getItem(key)) continue;
      const steps = provider.getStepCount?.() ?? 0;
      if (steps > 0) count += 1;
    } catch { /* ignore */ }
  }
  return count;
}

export function notifyPageTourFinished(detail = {}) {
  window.dispatchEvent(new CustomEvent('page-tour-finished', { detail }));
  notifyTourAvailabilityChanged();
}

/**
 * Register a page-level tour handler. While mounted, help/joyride events route here
 * instead of the dashboard shell tour.
 */
export function registerPageTour(id, startTour, getStepCount) {
  const entry = { id, startTour, getStepCount };
  pageTourStack.push(entry);
  notifyTourAvailabilityChanged();
  return () => {
    const idx = pageTourStack.indexOf(entry);
    if (idx >= 0) pageTourStack.splice(idx, 1);
    notifyTourAvailabilityChanged();
  };
}

/** Returns true when a nested page tour consumed the event. */
export function dispatchPageTourIfRegistered() {
  if (!isOnboardingTourEnabled()) return false;
  if (pageTourStack.length === 0) return false;
  const top = pageTourStack[pageTourStack.length - 1];
  top.startTour();
  return true;
}

/**
 * Delay child page tour auto-start until the dashboard shell tour finishes.
 * Page tours never auto-start while the dashboard tour is still playing.
 */
export function scheduleTourStart(tourSeenKey, lang, startTour) {
  if (!isOnboardingTourEnabled()) return undefined;
  try {
    if (localStorage.getItem(tourSeenKey)) return undefined;

    const dashboardTourKey = `dashboardHelpSeen_${lang}`;
    const dashboardUnseen = !localStorage.getItem(dashboardTourKey);

    if (dashboardUnseen) {
      const onDashboardDone = () => {
        window.removeEventListener('dashboard-tour-finished', onDashboardDone);
        setTimeout(startTour, QUEUE_DRAIN_MS);
      };
      window.addEventListener('dashboard-tour-finished', onDashboardDone);
      return () => window.removeEventListener('dashboard-tour-finished', onDashboardDone);
    }

    if (isAnyTourActive()) {
      const onTourEnded = () => {
        if (!isAnyTourActive()) {
          window.removeEventListener('tour-ended', onTourEnded);
          setTimeout(startTour, QUEUE_DRAIN_MS);
        }
      };
      window.addEventListener('tour-ended', onTourEnded);
      return () => window.removeEventListener('tour-ended', onTourEnded);
    }

    startTour();
  } catch {
    startTour();
  }
  return undefined;
}
