// Simple event bus for real-time updates
class EventBus {
  constructor() {
    this.events = {};
  }

  // Subscribe to an event
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    return () => {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    };
  }

  // Emit an event
  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data));
    }
  }

  // Remove all listeners for an event
  off(event) {
    delete this.events[event];
  }
}

// Create a singleton instance
const eventBus = new EventBus();

export default eventBus;

// Event constants
export const EVENTS = {
  ACTIVITY_UPDATE: 'activity_update',
  STUDENT_UPDATE: 'student_update',
  ATTENDANCE_MARKED: 'attendance_marked',
  ATTENDANCE_DELETED: 'attendance_deleted',
  BEHAVIOR_LOGGED: 'behavior_logged',
  PARTICIPATION_ADDED: 'participation_added',
  PENALTY_ASSIGNED: 'penalty_assigned',
  REFRESH_RECENT_ACTIVITY: 'refresh_recent_activity',
  REFRESH_STUDENT_DATA: 'refresh_student_data',
  REFRESH_ROSTER: 'refresh_roster',
  REFRESH_TODAY_ACTIVITY: 'refresh_today_activity'
};
