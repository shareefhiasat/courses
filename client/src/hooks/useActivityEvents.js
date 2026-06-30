import { useEffect } from 'react';
import eventBus, { EVENTS } from '@utils/eventBus';

/**
 * Shared event bus subscription hook for activity-related events.
 * Used by QRScanner, StudentRoster, StudentActionStatsPanel.
 *
 * @param {Object} options
 * @param {string|number} [options.studentId] - If set, only fires for matching studentId
 * @param {Function} [options.onAny] - Called for any activity event
 * @param {Function} [options.onAttendanceMarked]
 * @param {Function} [options.onBehaviorLogged]
 * @param {Function} [options.onParticipationAdded]
 * @param {Function} [options.onPenaltyAssigned]
 * @param {Function} [options.onRefreshStudentData]
 * @param {Function} [options.onRefreshRecentActivity]
 * @param {Function} [options.onRefreshTodayActivity]
 * @param {Function} [options.onRefreshRoster]
 * @param {Function} [options.onActivityUpdate]
 * @param {Array} [deps=[]] - Additional dependencies for the effect
 */
export const useActivityEvents = ({
  studentId,
  onAny,
  onAttendanceMarked,
  onBehaviorLogged,
  onParticipationAdded,
  onPenaltyAssigned,
  onRefreshStudentData,
  onRefreshRecentActivity,
  onRefreshTodayActivity,
  onRefreshRoster,
  onActivityUpdate,
} = {}, deps = []) => {
  useEffect(() => {
    const shouldFire = (data) => {
      if (!studentId) return true;
      return data?.studentId === studentId || !data?.studentId;
    };

    const wrap = (handler) => (data) => {
      if (!handler) return;
      if (shouldFire(data)) handler(data);
    };

    const subs = [];

    if (onAny || onAttendanceMarked) {
      subs.push(eventBus.on(EVENTS.ATTENDANCE_MARKED, wrap((data) => {
        onAttendanceMarked?.(data);
        onAny?.(data);
      })));
    }
    if (onAny || onBehaviorLogged) {
      subs.push(eventBus.on(EVENTS.BEHAVIOR_LOGGED, wrap((data) => {
        onBehaviorLogged?.(data);
        onAny?.(data);
      })));
    }
    if (onAny || onParticipationAdded) {
      subs.push(eventBus.on(EVENTS.PARTICIPATION_ADDED, wrap((data) => {
        onParticipationAdded?.(data);
        onAny?.(data);
      })));
    }
    if (onAny || onPenaltyAssigned) {
      subs.push(eventBus.on(EVENTS.PENALTY_ASSIGNED, wrap((data) => {
        onPenaltyAssigned?.(data);
        onAny?.(data);
      })));
    }
    if (onActivityUpdate) {
      subs.push(eventBus.on(EVENTS.ACTIVITY_UPDATE, () => onActivityUpdate()));
    }
    if (onRefreshStudentData) {
      subs.push(eventBus.on(EVENTS.REFRESH_STUDENT_DATA, wrap(onRefreshStudentData)));
    }
    if (onRefreshRecentActivity) {
      subs.push(eventBus.on(EVENTS.REFRESH_RECENT_ACTIVITY, onRefreshRecentActivity));
    }
    if (onRefreshTodayActivity) {
      subs.push(eventBus.on(EVENTS.REFRESH_TODAY_ACTIVITY, onRefreshTodayActivity));
    }
    if (onRefreshRoster) {
      subs.push(eventBus.on(EVENTS.REFRESH_ROSTER, onRefreshRoster));
    }

    return () => subs.forEach(unsub => unsub());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, ...deps]);
};

export default useActivityEvents;
