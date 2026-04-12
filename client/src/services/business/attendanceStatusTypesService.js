/**
 * Attendance Status Types Service - Business Logic Layer
 * 
 * PURPOSE: Business logic for attendance status types operations
 * ARCHITECTURE: Frontend Components → Business Service → Database Service → PostgreSQL
 */

import attendanceStatusTypesDbService from '../db/attendanceStatusTypesDbService-postgres.js';
import { info, error, warn, debug } from '../utils/logger.js';

const serviceName = 'attendanceStatusTypesService';

// In-memory cache for attendance status types
let statusTypesCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get all attendance status types (with caching)
 */
export const getAttendanceStatusTypes = async (params = {}) => {
  try {
    info(`${serviceName}:getAttendanceStatusTypes`, { params });
    
    // Check cache first
    const now = Date.now();
    if (statusTypesCache && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION)) {
      debug(`${serviceName}:getAttendanceStatusTypes:cache_hit`);
      return {
        success: true,
        data: statusTypesCache,
        message: 'Attendance status types retrieved from cache'
      };
    }
    
    const result = await attendanceStatusTypesDbService.getActive(params);
    
    if (result.success && result.data) {
      // Update cache
      statusTypesCache = result.data;
      cacheTimestamp = now;
    }
    
    return {
      success: result.success,
      data: result.data || [],
      message: result.success ? 'Attendance status types retrieved successfully' : result.error
    };
  } catch (error) {
    error(`${serviceName}:getAttendanceStatusTypes:error`, { error: error.message, params });
    return {
      success: false,
      error: error.message || 'Failed to retrieve attendance status types',
      data: []
    };
  }
};

/**
 * Get attendance status type by code
 */
export const getAttendanceStatusTypeByCode = async (code, params = {}) => {
  try {
    info(`${serviceName}:getAttendanceStatusTypeByCode`, { code, params });
    
    // Check cache first
    if (statusTypesCache) {
      const cached = statusTypesCache.find(type => type.code === code);
      if (cached) {
        return {
          success: true,
          data: cached,
          message: 'Attendance status type retrieved from cache'
        };
      }
    }
    
    const result = await attendanceStatusTypesDbService.getByCode(code, params);
    
    return {
      success: result.success,
      data: result.data,
      message: result.success ? 'Attendance status type retrieved successfully' : result.error
    };
  } catch (error) {
    error(`${serviceName}:getAttendanceStatusTypeByCode:error`, { error: error.message, code, params });
    return {
      success: false,
      error: error.message || 'Failed to retrieve attendance status type',
      data: null
    };
  }
};

/**
 * Get localized attendance label by code
 */
export const getLocalizedAttendanceLabel = async (code, lang = 'en') => {
  try {
    info(`${serviceName}:getLocalizedAttendanceLabel`, { code, lang });
    
    // Check cache first
    if (statusTypesCache) {
      const cached = statusTypesCache.find(type => type.code === code);
      if (cached) {
        const label = lang === 'ar' ? (cached.nameAr || cached.nameEn) : cached.nameEn;
        return label || code;
      }
    }
    
    // Fallback to database call
    const result = await attendanceStatusTypesDbService.getLocalizedLabel(code, lang);
    return result;
  } catch (error) {
    error(`${serviceName}:getLocalizedAttendanceLabel:error`, { error: error.message, code, lang });
    return code; // Fallback to code
  }
};

/**
 * Get attendance color by code
 */
export const getAttendanceColor = async (code) => {
  try {
    info(`${serviceName}:getAttendanceColor`, { code });
    
    // Check cache first
    if (statusTypesCache) {
      const cached = statusTypesCache.find(type => type.code === code);
      if (cached && cached.color) {
        return cached.color;
      }
    }
    
    // Fallback to database call
    const result = await attendanceStatusTypesDbService.getColor(code);
    return result;
  } catch (error) {
    error(`${serviceName}:getAttendanceColor:error`, { error: error.message, code });
    return '#6b7280'; // Default gray
  }
};

/**
 * Get attendance icon by code
 */
export const getAttendanceIcon = async (code) => {
  try {
    info(`${serviceName}:getAttendanceIcon`, { code });
    
    // Check cache first
    if (statusTypesCache) {
      const cached = statusTypesCache.find(type => type.code === code);
      if (cached) {
        // Map status codes to icons
        const iconMap = {
          present: 'CheckCircle',
          absent: 'XCircle',
          late: 'Clock',
          excused: 'AlertCircle',
          sick: 'Heart',
          holiday: 'Calendar',
          cancelled: 'Ban'
        };
        return iconMap[code] || 'HelpCircle';
      }
    }
    
    // Fallback icons
    const iconMap = {
      present: 'CheckCircle',
      absent: 'XCircle',
      late: 'Clock',
      excused: 'AlertCircle',
      sick: 'Heart',
      holiday: 'Calendar',
      cancelled: 'Ban'
    };
    return iconMap[code] || 'HelpCircle';
  } catch (error) {
    error(`${serviceName}:getAttendanceIcon:error`, { error: error.message, code });
    return 'HelpCircle'; // Default icon
  }
};

/**
 * Get attendance display name by code
 */
export const getAttendanceLabel = async (code, lang = 'en') => {
  try {
    info(`${serviceName}:getAttendanceLabel`, { code, lang });
    
    // Check cache first
    if (statusTypesCache) {
      const cached = statusTypesCache.find(type => type.code === code);
      if (cached) {
        const label = lang === 'ar' ? (cached.nameAr || cached.nameEn) : cached.nameEn;
        return label || code;
      }
    }
    
    // Fallback to database call
    const result = await attendanceStatusTypesDbService.getLocalizedLabel(code, lang);
    return result;
  } catch (error) {
    error(`${serviceName}:getAttendanceLabel:error`, { error: error.message, code, lang });
    return code; // Fallback to code
  }
};

/**
 * Clear cache (useful after updates)
 */
export const clearCache = () => {
  info(`${serviceName}:clearCache`);
  statusTypesCache = null;
  cacheTimestamp = null;
};

/**
 * Refresh cache
 */
export const refreshCache = async () => {
  clearCache();
  return await getAttendanceStatusTypes();
};

// Synchronous fallback functions for backward compatibility
// These use cached data or fallback constants

/**
 * Synchronous version of getLocalizedAttendanceLabel
 * Uses cache or fallback to constants
 */
export const getLocalizedAttendanceLabelSync = (code, lang = 'en') => {
  // Try cache first
  if (statusTypesCache) {
    const cached = statusTypesCache.find(type => type.code === code);
    if (cached) {
      return lang === 'ar' ? (cached.nameAr || cached.nameEn) : cached.nameEn;
    }
  }
  
  // Fallback to constants
  const fallbackLabels = {
    en: {
      present: 'Present',
      absent: 'Absent',
      late: 'Late',
      excused: 'Excused',
      sick: 'Sick',
      holiday: 'Holiday',
      cancelled: 'Cancelled'
    },
    ar: {
      present: 'حاضر',
      absent: 'غائب',
      late: 'متأخر',
      excused: 'معذور',
      sick: 'مريض',
      holiday: 'عطلة',
      cancelled: 'ملغى'
    }
  };
  
  return fallbackLabels[lang]?.[code] || code;
};

/**
 * Synchronous version of getAttendanceColor
 * Uses cache or fallback to constants
 */
export const getAttendanceColorSync = (code) => {
  // Try cache first
  if (statusTypesCache) {
    const cached = statusTypesCache.find(type => type.code === code);
    if (cached && cached.color) {
      return cached.color;
    }
  }
  
  // Fallback colors
  const fallbackColors = {
    present: '#10b981', // Green
    absent: '#ef4444',  // Red
    late: '#f59e0b',    // Yellow
    excused: '#3b82f6', // Blue
    sick: '#8b5cf6',    // Purple
    holiday: '#06b6d4', // Cyan
    cancelled: '#6b7280' // Gray
  };
  return fallbackColors[code] || '#6b7280';
};

/**
 * Synchronous version of getAttendanceIcon
 * Uses cache or fallback to constants
 */
export const getAttendanceIconSync = (code) => {
  // Map status codes to icons
  const iconMap = {
    present: 'CheckCircle',
    absent: 'XCircle',
    late: 'Clock',
    excused: 'AlertCircle',
    sick: 'Heart',
    holiday: 'Calendar',
    cancelled: 'Ban'
  };
  return iconMap[code] || 'HelpCircle';
};

/**
 * Synchronous version of getAttendanceLabel
 * Uses cache or fallback to constants
 */
export const getAttendanceLabelSync = (code, lang = 'en') => {
  return getLocalizedAttendanceLabelSync(code, lang);
};

export default {
  getAttendanceStatusTypes,
  getAttendanceStatusTypeByCode,
  getLocalizedAttendanceLabel,
  getAttendanceColor,
  getAttendanceIcon,
  getAttendanceLabel,
  clearCache,
  refreshCache
};
