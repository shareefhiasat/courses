// Type definitions for QR Scanner components

/**
 * @typedef {'present' | 'late' | 'absent'} AttendanceStatus
 */

/**
 * @typedef {'talking' | 'sleeping' | 'phone_use' | 'out_of_seat' | 'participation'} BehaviorType
 */

/**
 * @typedef {Object} BehaviorAction
 * @property {BehaviorType} type
 * @property {number} points
 * @property {Date} timestamp
 * @property {string} [note]
 */

/**
 * @typedef {Object} Student
 * @property {string} id
 * @property {string} studentId
 * @property {string} name
 * @property {AttendanceStatus} attendance
 * @property {number} participation
 * @property {number} behavior
 * @property {number} penalty
 * @property {boolean} isPinned
 * @property {BehaviorAction[]} behaviorHistory
 */

export {};
