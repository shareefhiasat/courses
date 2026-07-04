/**
 * TEMP debug logs for SideDrawer state machine.
 * Filter DevTools console with: DrawerTLog
 * Set enabled false or delete this file when behavior is stable.
 */
const DRAWER_TLOG_ENABLED = true;

export function drawerTlog(event, data = {}) {
  if (!DRAWER_TLOG_ENABLED) return;
  console.log(
    `%c[DrawerTLog] ${event}`,
    'color:#7c3aed;font-weight:600',
    { ...data, _ts: Number(performance.now().toFixed(1)) }
  );
}

export function drawerTlogSnapshot(label, state) {
  drawerTlog(`snapshot:${label}`, state);
}
