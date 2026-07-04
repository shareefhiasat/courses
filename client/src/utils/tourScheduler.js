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

const pageTourStack = [];
const tourProviders = new Map();
let tourRouterInstalled = false;

/** Suppress any in-flight dashboard/shell tour before starting a nested page tour. */
function suppressShellTours() {
  window.dispatchEvent(new CustomEvent('tour-suppress-shell'));
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
    suppressShellTours();
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
  if (pageTourStack.length === 0) return false;
  suppressShellTours();
  const top = pageTourStack[pageTourStack.length - 1];
  top.startTour();
  return true;
}

/**
 * Delay child page tour auto-start until the dashboard tour finishes.
 * After the dashboard tour completes, waits ~1s before starting the page tour.
 * If the dashboard tour does not auto-start within a short window (e.g. user landed
 * on a tab with its own tour), the page tour starts anyway.
 */
export function scheduleTourStart(tourSeenKey, lang, startTour) {
  try {
    if (localStorage.getItem(tourSeenKey)) return;

    const dashboardTourKey = `dashboardHelpSeen_${lang}`;
    if (!localStorage.getItem(dashboardTourKey)) {
      let started = false;
      const startOnce = () => {
        if (started) return;
        started = true;
        startTour();
        window.removeEventListener('dashboard-tour-finished', onDashboardDone);
        clearTimeout(fallbackTimer);
      };
      const onDashboardDone = () => {
        if (started) return;
        clearTimeout(fallbackTimer);
        setTimeout(startOnce, 1000);
      };
      window.addEventListener('dashboard-tour-finished', onDashboardDone);
      const fallbackTimer = setTimeout(startOnce, 1000);
      return () => {
        window.removeEventListener('dashboard-tour-finished', onDashboardDone);
        clearTimeout(fallbackTimer);
      };
    }
    startTour();
  } catch {
    startTour();
  }
}
