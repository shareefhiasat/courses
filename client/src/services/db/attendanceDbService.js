import attendanceDbService from './attendanceDbService-postgres.js';

import { info, error, warn, debug } from '@services/utils/logger.js'

export const getAttendanceRecords = attendanceDbService.getAttendance;
export const getAttendanceById = attendanceDbService.getAttendanceById;
export const createAttendanceRecord = attendanceDbService.create;
export const updateAttendanceRecord = attendanceDbService.update;
export const deleteAttendanceRecord = attendanceDbService.deleteAttendance;
export const getClassAttendanceStats = attendanceDbService.getClassStats;

export default attendanceDbService;
