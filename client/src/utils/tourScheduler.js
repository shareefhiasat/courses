/**
 * Delays child page tour auto-start until the dashboard tour finishes.
 *
 * Usage (replaces the auto-start useEffect in child pages):
 *   useEffect(() => scheduleTourStart(tourSeenKey, lang, startTour), [tourSeenKey, lang, startTour]);
 */
export function scheduleTourStart(tourSeenKey, lang, startTour) {
  try {
    if (localStorage.getItem(tourSeenKey)) return;

    const dashboardTourKey = `dashboardHelpSeen_${lang}`;
    if (!localStorage.getItem(dashboardTourKey)) {
      // Dashboard tour will auto-start — wait for it to finish
      const handler = () => {
        startTour();
        window.removeEventListener('dashboard-tour-finished', handler);
      };
      window.addEventListener('dashboard-tour-finished', handler);
      return () => window.removeEventListener('dashboard-tour-finished', handler);
    }
    // Dashboard tour already seen — start immediately
    startTour();
  } catch {
    startTour();
  }
}
