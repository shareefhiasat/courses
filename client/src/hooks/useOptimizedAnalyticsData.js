import React from 'react';
import useAnalyticsData from '@hooks/useAnalyticsData';
import { info, error, warn, debug } from '@services/utils/logger.js';

/** React.cache is React 19+; provide a Map-based fallback for React 18. */
function memoCache(fn) {
  const store = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (store.has(key)) {
      return store.get(key);
    }
    const result = fn(...args);
    store.set(key, result);
    return result;
  };
}

const cache = typeof React.cache === 'function' ? React.cache : memoCache;

/**
 * Cached data fetchers using React.cache for deduplication
 * These functions will cache results based on their arguments
 */

// Cache individual data source fetches
const fetchCachedEnrollments = cache(async (filters) => {
  info('[CachedDataFetchers] Fetching enrollments with filters:', filters);
  // Simulate API call - replace with actual service call
  return [];
});

const fetchCachedAttendance = cache(async (filters) => {
  info('[CachedDataFetchers] Fetching attendance with filters:', filters);
  return [];
});

const fetchCachedMarks = cache(async (filters) => {
  info('[CachedDataFetchers] Fetching marks with filters:', filters);
  return [];
});

const fetchCachedParticipations = cache(async (filters) => {
  info('[CachedDataFetchers] Fetching participations with filters:', filters);
  return [];
});

const fetchCachedBehaviors = cache(async (filters) => {
  info('[CachedDataFetchers] Fetching behaviors with filters:', filters);
  return [];
});

const fetchCachedPenalties = cache(async (filters) => {
  info('[CachedDataFetchers] Fetching penalties with filters:', filters);
  return [];
});

const fetchCachedClasses = cache(async (filters) => {
  info('[CachedDataFetchers] Fetching classes with filters:', filters);
  return [];
});

const fetchCachedUsers = cache(async (filters) => {
  info('[CachedDataFetchers] Fetching users with filters:', filters);
  return [];
});

const fetchCachedActivityLogs = cache(async (filters) => {
  info('[CachedDataFetchers] Fetching activity logs with filters:', filters);
  return [];
});

/**
 * Parallel data fetcher for multiple widget data sources
 * Uses Promise.all for optimal performance
 */
export const fetchWidgetDataParallel = cache(async (widgets, globalFilters) => {
  const startTime = performance.now();
  
  // Extract unique data sources from all widgets
  const dataSources = new Set();
  widgets.forEach(widget => {
    if (widget.dataSource) {
      dataSources.add(widget.dataSource);
    }
  });
  
  info('[fetchWidgetDataParallel] Fetching data for sources:', Array.from(dataSources));
  
  // Create fetch promises for each data source
  const fetchPromises = [];
  const dataSourceMap = {};
  
  if (dataSources.has('enrollments')) {
    fetchPromises.push(
      fetchCachedEnrollments(globalFilters)
        .then(data => { dataSourceMap.enrollments = data; })
    );
  }
  
  if (dataSources.has('attendance')) {
    fetchPromises.push(
      fetchCachedAttendance(globalFilters)
        .then(data => { dataSourceMap.attendance = data; })
    );
  }
  
  if (dataSources.has('marks')) {
    fetchPromises.push(
      fetchCachedMarks(globalFilters)
        .then(data => { dataSourceMap.marks = data; })
    );
  }
  
  if (dataSources.has('participations')) {
    fetchPromises.push(
      fetchCachedParticipations(globalFilters)
        .then(data => { dataSourceMap.participations = data; })
    );
  }
  
  if (dataSources.has('behaviors')) {
    fetchPromises.push(
      fetchCachedBehaviors(globalFilters)
        .then(data => { dataSourceMap.behaviors = data; })
    );
  }
  
  if (dataSources.has('penalties')) {
    fetchPromises.push(
      fetchCachedPenalties(globalFilters)
        .then(data => { dataSourceMap.penalties = data; })
    );
  }
  
  if (dataSources.has('classes')) {
    fetchPromises.push(
      fetchCachedClasses(globalFilters)
        .then(data => { dataSourceMap.classes = data; })
    );
  }
  
  if (dataSources.has('users')) {
    fetchPromises.push(
      fetchCachedUsers(globalFilters)
        .then(data => { dataSourceMap.users = data; })
    );
  }
  
  if (dataSources.has('activityLogs')) {
    fetchPromises.push(
      fetchCachedActivityLogs(globalFilters)
        .then(data => { dataSourceMap.activityLogs = data; })
    );
  }
  
  // Wait for all data to be fetched in parallel
  try {
    await Promise.all(fetchPromises);
    
    const endTime = performance.now();
    info(`[fetchWidgetDataParallel] Completed in ${(endTime - startTime).toFixed(2)}ms`);
    
    return dataSourceMap;
  } catch (error) {
    error('[fetchWidgetDataParallel] Error fetching data:', error);
    throw error;
  }
});

/**
 * Optimized hook for widget data fetching with caching
 * This hook extends useAnalyticsData with performance optimizations
 */
export function useOptimizedAnalyticsData() {
  const analyticsData = useAnalyticsData();
  
  // Add performance monitoring
  React.useEffect(() => {
    if (analyticsData.loading) {
      info('[useOptimizedAnalyticsData] Loading analytics data...');
    } else {
      info('[useOptimizedAnalyticsData] Analytics data loaded');
    }
  }, [analyticsData.loading]);
  
  return {
    ...analyticsData,
    // Add parallel fetch method
    fetchParallel: fetchWidgetDataParallel
  };
}

/**
 * Memoized widget data processor to avoid unnecessary recalculations
 */
export const processWidgetDataOptimized = cache((widget, rawData, globalFilters, t = null, lang = 'en') => {
  const startTime = performance.now();
  
  // Process data based on widget configuration
  let processedData = [];
  
  // ── Multi-source merge: dataSource can be comma-separated e.g. "activities,announcements,resources" ──
  const { dataSource, groupBy, aggregation = 'count', filters = [], dateRange, customDateFrom, customDateTo } = widget;
  
  if (dataSource && dataSource.includes(',')) {
    // Handle multiple data sources
    const sources = dataSource.split(',').map(s => s.trim()).filter(Boolean);
    const combinedData = [];
    
    sources.forEach(source => {
      const sourceData = rawData[source] || [];
      combinedData.push(...sourceData);
    });
    
    // Process combined data with activity type mapping
    processedData = processMultiSourceActivityData(widget, combinedData, globalFilters);
  } else {
    // Handle single data source
    switch (dataSource) {
      case 'enrollments':
        processedData = processEnrollmentData(widget, rawData.enrollments || [], globalFilters, rawData);
        break;
      case 'attendance':
        // Combine attendance data from multiple sources
        const attendanceData = [
          ...(rawData.attendance || []),
          ...(rawData.absences || []),
          ...(rawData.attendanceSessions || [])
        ];
        processedData = processAttendanceData(widget, attendanceData, globalFilters, rawData);
        break;
      case 'marks':
        processedData = processMarksData(widget, rawData.marks || [], globalFilters);
        break;
      case 'participations':
        processedData = processGenericData(widget, rawData.participations || [], globalFilters, rawData, 'participations');
        break;
      case 'behaviors':
        processedData = processGenericData(widget, rawData.behaviors || [], globalFilters, rawData, 'behaviors');
        break;
      case 'penalties':
        processedData = processGenericData(widget, rawData.penalties || [], globalFilters, rawData, 'penalties');
        break;
      case 'absences':
        processedData = processGenericData(widget, rawData.absences || [], globalFilters, rawData, 'absences');
        break;
      case 'users':
        processedData = processGenericData(widget, rawData.users || [], globalFilters, rawData, 'users');
        break;
      case 'classes':
        processedData = processGenericData(widget, rawData.classes || [], globalFilters, rawData, 'classes');
        break;
      case 'programs':
        processedData = processGenericData(widget, rawData.programs || [], globalFilters, rawData, 'programs');
        break;
      case 'subjects':
        processedData = processGenericData(widget, rawData.subjects || [], globalFilters, rawData, 'subjects');
        break;
      case 'announcements':
      case 'resources':
      case 'activityLogs':
        processedData = processGenericData(widget, rawData[dataSource] || [], globalFilters, rawData, dataSource);
        break;
      default:
        processedData = [];
    }
  }
  
  const endTime = performance.now();
  // Disable all logging to prevent console spam
  // if (import.meta.env.MODE === 'development') {
  //   info(`[processWidgetDataOptimized] Processed ${dataSource} in ${(endTime - startTime).toFixed(2)}ms`);
  // }
  
  return processedData;
});

// Helper functions for data processing
function processMultiSourceActivityData(widget, data, filters) {
  // Disable all logging to prevent console spam
  // if (import.meta.env.MODE === 'development') {
  //   info('[processMultiSourceActivityData] Processing combined activity data:', {
  //     totalRecords: data.length,
  //     filters: filters,
  //     groupBy: widget.groupBy
  //   });
  // }
  
  let filtered = data;
  
  if (filters.classId) {
    filtered = filtered.filter(item => item.classId === filters.classId);
  // Disable all logging to prevent console spam
  // if (import.meta.env.MODE === 'development') {
  //   info(`[processMultiSourceActivityData] Filtered by classId ${filters.classId}: ${filtered.length} records`);
  // }
  }
  
  if (filters.studentId) {
    filtered = filtered.filter(item => item.studentId === filters.studentId);
  // Disable all logging to prevent console spam
  // if (import.meta.env.MODE === 'development') {
  //   info(`[processMultiSourceActivityData] Filtered by studentId ${filters.studentId}: ${filtered.length} records`);
  // }
  }
  
  if (widget.groupBy === 'type') {
    const grouped = {};
    const typeDistribution = {};
    
    filtered.forEach(item => {
      const rawType = item.type || 'Unknown';
      typeDistribution[rawType] = (typeDistribution[rawType] || 0) + 1;
      
      // Enhanced activity type mapping for all activity types
      const typeMap = {
        // Quiz types
        'quiz': 'Quiz',
        'quizzes': 'Quiz',
        
        // Assignment types
        'homework': 'Homework',
        'assignment': 'Assignment',
        'assignments': 'Assignment',
        
        // Training types
        'training': 'Training',
        'trainings': 'Training',
        
        // Lab & Project types
        'lab_and_project': 'Lab & Project',
        'lab': 'Lab',
        'project': 'Project',
        'lab_project': 'Lab & Project',
        
        // Exam types
        'mid_exam': 'Mid Exam',
        'midterm': 'Mid Exam',
        'midterm_exam': 'Mid Exam',
        'final_exam': 'Final Exam',
        'final': 'Final Exam',
        'finalterm': 'Final Exam',
        'finalterm_exam': 'Final Exam',
        
        // Announcement types
        'announcement': 'Announcement',
        'announcements': 'Announcement',
        
        // Resource types
        'resource': 'Resource',
        'resources': 'Resource',
        'video': 'Video',
        'videos': 'Video',
        'link': 'Link',
        'links': 'Link',
        'document': 'Document',
        'documents': 'Document',
        'file': 'File',
        'files': 'File',
        
        // Activity types
        'activity': 'Activity',
        'activities': 'Activity',
        'task': 'Task',
        'tasks': 'Task',
        
        // Behavior types
        'positive': 'Positive',
        'negative': 'Negative',
        'warning': 'Warning',
        'praise': 'Praise',
        'discipline': 'Discipline',
        
        // Other types
        'reading': 'Reading',
        'presentation': 'Presentation',
        'discussion': 'Discussion',
        'forum': 'Forum',
        'other': 'Other'
      };
      
      const key = typeMap[rawType] || rawType;
      grouped[key] = (grouped[key] || 0) + 1;
    });
    
    const result = Object.entries(grouped).map(([label, value]) => ({ label, value }));
    
  // Disable all logging to prevent console spam
  // if (import.meta.env.MODE === 'development') {
  //   info('[processMultiSourceActivityData] Type distribution:', typeDistribution);
  //   info('[processMultiSourceActivityData] Mapped grouped data:', grouped);
  //   info('[processMultiSourceActivityData] Final result:', result);
  // }
    
    return result;
  }
  
  // Handle other groupBy fields
  if (['classId', 'programId', 'subjectId', 'userId', 'createdBy', 'date'].includes(widget.groupBy)) {
    const grouped = {};
    const distribution = {};
    
    filtered.forEach(item => {
      let key = 'Unknown';
      
      switch (widget.groupBy) {
        case 'classId':
          const classItem = rawData.classes?.find(c => c.id === item.classId);
          key = classItem?.nameEn || classItem?.name || classItem?.className || `Class ${item.classId?.substring(0, 8)}`;
          break;
          
        case 'programId':
          const programItem = rawData.programs?.find(p => p.id === item.programId);
          key = programItem?.nameEn || programItem?.name || programItem?.programName || `Program ${item.programId?.substring(0, 8)}`;
          break;
          
        case 'subjectId':
          const subjectItem = rawData.subjects?.find(s => s.id === item.subjectId);
          key = subjectItem?.nameEn || subjectItem?.name || subjectItem?.subjectName || `Subject ${item.subjectId?.substring(0, 8)}`;
          break;
          
        case 'userId':
        case 'createdBy':
          const userItem = rawData.users?.find(u => u.id === (item.userId || item.createdBy));
          key = userItem?.realNameEn || userItem?.realName || userItem?.displayNameEn || userItem?.displayName || userItem?.name || `User ${item.userId?.substring(0, 8)}`;
          break;
          
        case 'date':
          const date = item.date || item.createdAt || item.when;
          if (date) {
            const dateObj = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
            key = dateObj.toLocaleDateString();
          } else {
            key = 'No Date';
          }
          break;
          
        default:
          key = item[widget.groupBy] || 'Unknown';
      }
      
      grouped[key] = (grouped[key] || 0) + 1;
      distribution[key] = (distribution[key] || 0) + 1;
    });
    
    const result = Object.entries(grouped).map(([label, value]) => ({ label, value }));
  // Disable all logging to prevent console spam
  // if (import.meta.env.MODE === 'development') {
  //   info(`[processMultiSourceActivityData] ${widget.groupBy} distribution:`, distribution);
  //   info('[processMultiSourceActivityData] Mapped grouped data:', grouped);
  //   info('[processMultiSourceActivityData] Final result:', result);
  // }
    
    return result;
  }
  
  // Disable all logging to prevent console spam
  // if (import.meta.env.MODE === 'development') {
  //   info('[processMultiSourceActivityData] No grouping, returning total count:', filtered.length);
  // }
  return [{ label: widget.title || 'Activities', value: filtered.length }];
}

function processEnrollmentData(widget, data, filters, rawData) {
  // Apply filters and aggregations
  let filtered = data;
  
  // Disable all logging to prevent console spam
  // if (import.meta.env.MODE === 'development') {
  //   info('[processEnrollmentData] Processing enrollment data:', {
  //     totalRecords: data.length,
  //     filters: filters,
  //     groupBy: widget.groupBy,
  //     availablePrograms: rawData.programs?.length || 0
  //   });
  // }
  
  if (filters.classId) {
    filtered = filtered.filter(item => item.classId === filters.classId);
  // Disable all logging to prevent console spam
  // if (import.meta.env.MODE === 'development') {
  //   info(`[processEnrollmentData] Filtered by classId ${filters.classId}: ${filtered.length} records`);
  // }
  }
  
  if (filters.studentId) {
    filtered = filtered.filter(item => item.studentId === filters.studentId);
  // Disable all logging to prevent console spam
  // if (import.meta.env.MODE === 'development') {
  //   info(`[processEnrollmentData] Filtered by studentId ${filters.studentId}: ${filtered.length} records`);
  // }
  }
  
  // Group by specified field
  if (widget.groupBy) {
    const grouped = {};
    const rawDistribution = {};
    
    filtered.forEach(item => {
      const rawKey = item[widget.groupBy] || 'Unknown';
      rawDistribution[rawKey] = (rawDistribution[rawKey] || 0) + 1;
      
      // Map program IDs to names if grouping by program
      let key = rawKey;
      if (widget.groupBy === 'programId' || widget.groupBy === 'program') {
        const program = rawData.programs?.find(p => 
          p.docId === rawKey || p.id === rawKey
        );
        key = program?.name_en || program?.name || program?.code || rawKey;
      }
      
      grouped[key] = (grouped[key] || 0) + 1;
    });
    
    const result = Object.entries(grouped).map(([label, value]) => ({ label, value }));

  // Disable all logging to prevent console spam
  // if (import.meta.env.MODE === 'development') {
  //   info('[processEnrollmentData] Raw distribution:', rawDistribution);
  //   info('[processEnrollmentData] Mapped grouped data:', grouped);
  //   info('[processEnrollmentData] Final result:', result);
  // }
    
    return result;
  }
  
  // Disable all logging to prevent console spam
  // if (import.meta.env.MODE === 'development') {
  //   info('[processEnrollmentData] No grouping, returning total count:', filtered.length);
  // }
  // Return count if no grouping
  return [{ label: widget.title || 'Enrollments', value: filtered.length }];
}

function processAttendanceData(widget, data, filters) {
  let filtered = data;
  
  const debugInfo = {
    totalRecords: data.length,
    filters: filters,
    groupBy: widget.groupBy,
    dataSources: {
      attendance: data.filter(item => item.status !== undefined).length,
      absences: data.filter(item => item.absenceType !== undefined).length,
      attendanceSessions: data.filter(item => item.sessionDate !== undefined).length
    },
    sampleData: data.slice(0, 3).map(item => ({
      id: item.id,
      hasStatus: !!item.status,
      hasAbsenceType: !!item.absenceType,
      hasAttendanceStatus: !!item.attendanceStatus,
      status: item.status || item.absenceType || item.attendanceStatus || 'Unknown'
    }))
  };
  
  // Disable all logging to prevent console spam
  // if (import.meta.env.MODE === 'development') {
  //   info('[processAttendanceData] Processing attendance data:', debugInfo);
  // }
  
  // Log if we found data from alternative sources
  // Disable all logging to prevent console spam
  // if (import.meta.env.MODE === 'development') {
  //   if (debugInfo.dataSources.absences > 0 || debugInfo.dataSources.attendanceSessions > 0) {
  //     console.log('🎉 Found attendance data from alternative sources:', {
  //       absences: debugInfo.dataSources.absences,
  //       attendanceSessions: debugInfo.dataSources.attendanceSessions
  //     });
  //   }
  // }
  
  if (filters.classId) {
    filtered = filtered.filter(item => item.classId === filters.classId);
  // Disable all logging to prevent console spam
  // if (import.meta.env.MODE === 'development') {
  //   info(`[processAttendanceData] Filtered by classId ${filters.classId}: ${filtered.length} records`);
  // }
  }
  
  if (filters.studentId) {
    filtered = filtered.filter(item => item.studentId === filters.studentId);
  // Disable all logging to prevent console spam
  // if (import.meta.env.MODE === 'development') {
  //   info(`[processAttendanceData] Filtered by studentId ${filters.studentId}: ${filtered.length} records`);
  // }
  }
  
  if (widget.groupBy === 'status' || widget.groupBy === 'attendanceType') {
    const grouped = {};
    const statusDistribution = {};
    
    filtered.forEach(item => {
      // Handle different data structures from multiple sources
      let status = 'Unknown';
      
      // From attendance collection
      if (item.status) {
        status = item.status;
      }
      // From absences collection
      else if (item.absenceType) {
        status = item.absenceType;
      }
      // From attendanceSessions collection
      else if (item.attendanceStatus) {
        status = item.attendanceStatus;
      }
      
      // Clean, non-duplicate status mapping
      const statusMap = {
        'present': 'Present',
        'late': 'Late',
        'absent_with_excuse': 'Absent (Excused)',
        'absent': 'Absent (No Excuse)',
        'absent_no_excuse': 'Absent (No Excuse)',
        'excused': 'Absent (Excused)',
        'excused_leave': 'Excused Leave',
        'human_case': 'Human Case',
        'closed': 'Closed',
        'open': 'Open',
        'active': 'Active',
        // Handle absence types
        'sick': 'Absent (Excused)',
        'medical': 'Absent (Excused)',
        'personal': 'Absent (Excused)',
        'unexcused': 'Absent (No Excuse)',
        'no_show': 'Absent (No Excuse)'
      };
      
      const key = statusMap[status.toLowerCase()] || status;
      grouped[key] = (grouped[key] || 0) + 1;
      statusDistribution[status] = (statusDistribution[status] || 0) + 1;
    });
    
    const result = Object.entries(grouped).map(([label, value]) => ({ label, value }));

  // Disable all logging to prevent console spam
  // if (import.meta.env.MODE === 'development') {
  //   info('[processAttendanceData] Status distribution:', statusDistribution);
  //   info('[processAttendanceData] Mapped grouped data:', grouped);
  //   info('[processAttendanceData] Final result:', result);
  // }
    
    return result;
  }
  
  // Handle other groupBy fields for attendance
  if (['classId', 'studentId', 'createdBy', 'date'].includes(widget.groupBy)) {
    const grouped = {};
    const distribution = {};
    
    filtered.forEach(item => {
      let key = 'Unknown';
      
      switch (widget.groupBy) {
        case 'classId':
          const classItem = rawData.classes?.find(c => c.id === item.classId);
          key = classItem?.nameEn || classItem?.name || classItem?.className || `Class ${item.classId?.substring(0, 8)}`;
          break;
          
        case 'studentId':
          const userItem = rawData.users?.find(u => u.id === item.studentId);
          key = userItem?.realNameEn || userItem?.realName || userItem?.displayNameEn || userItem?.displayName || userItem?.name || `Student ${item.studentId?.substring(0, 8)}`;
          break;
          
        case 'createdBy':
          const creatorItem = rawData.users?.find(u => u.id === item.createdBy);
          key = creatorItem?.realNameEn || creatorItem?.realName || creatorItem?.displayNameEn || creatorItem?.displayName || creatorItem?.name || `User ${item.createdBy?.substring(0, 8)}`;
          break;
          
        case 'date':
          const date = item.date || item.createdAt || item.when;
          if (date) {
            const dateObj = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
            key = dateObj.toLocaleDateString();
          } else {
            key = 'No Date';
          }
          break;
          
        default:
          key = item[widget.groupBy] || 'Unknown';
      }
      
      grouped[key] = (grouped[key] || 0) + 1;
      distribution[key] = (distribution[key] || 0) + 1;
    });
    
    const result = Object.entries(grouped).map(([label, value]) => ({ label, value }));

  // Disable all logging to prevent console spam
  // if (import.meta.env.MODE === 'development') {
  //   info(`[processAttendanceData] ${widget.groupBy} distribution:`, distribution);
  //   info('[processAttendanceData] Mapped grouped data:', grouped);
  //   info('[processAttendanceData] Final result:', result);
  // }
    
    return result;
  }
  
  // Disable all logging to prevent console spam
  // if (import.meta.env.MODE === 'development') {
  //   info('[processAttendanceData] No grouping, returning total count:', filtered.length);
  // }
  return [{ label: widget.title || 'Attendance', value: filtered.length }];
}

function processMarksData(widget, data, filters) {
  let filtered = data;
  
  if (filters.classId) {
    filtered = filtered.filter(item => item.classId === filters.classId);
  }
  
  if (filters.studentId) {
    filtered = filtered.filter(item => item.studentId === filters.studentId);
  }
  
  if (widget.groupBy === 'subject') {
    const grouped = {};
    const sums = {};
    const counts = {};
    
    filtered.forEach(item => {
      const key = item.subjectName || 'Unknown';
      const value = parseFloat(item.mark) || 0;
      sums[key] = (sums[key] || 0) + value;
      counts[key] = (counts[key] || 0) + 1;
    });
    
    return Object.keys(sums).map(key => ({
      label: key,
      value: counts[key] > 0 ? (sums[key] / counts[key]).toFixed(2) : 0
    }));
  }
  
  return [{ label: widget.title || 'Marks', value: filtered.length }];
}

function processParticipationData(widget, data, filters) {
  let filtered = data;
  
  if (filters.classId) {
    filtered = filtered.filter(item => item.classId === filters.classId);
  }
  
  if (filters.studentId) {
    filtered = filtered.filter(item => item.studentId === filters.studentId);
  }
  
  return [{ label: widget.title || 'Participations', value: filtered.length }];
}

function processBehaviorData(widget, data, filters) {
  let filtered = data;
  
  info('[processBehaviorData] Processing behavior data:', {
    totalRecords: data.length,
    filters: filters,
    groupBy: widget.groupBy
  });
  
  if (filters.classId) {
    filtered = filtered.filter(item => item.classId === filters.classId);
    info(`[processBehaviorData] Filtered by classId ${filters.classId}: ${filtered.length} records`);
  }
  
  if (filters.studentId) {
    filtered = filtered.filter(item => item.studentId === filters.studentId);
    info(`[processBehaviorData] Filtered by studentId ${filters.studentId}: ${filtered.length} records`);
  }
  
  if (widget.groupBy === 'type') {
    const grouped = {};
    const typeDistribution = {};
    
    filtered.forEach(item => {
      const rawType = item.type || 'Unknown';
      typeDistribution[rawType] = (typeDistribution[rawType] || 0) + 1;
      
      // Clean, non-duplicate type mapping
      const typeMap = {
        'quiz': 'Quiz',
        'homework': 'Homework', 
        'training': 'Training',
        'lab_and_project': 'Lab & Project',
        'mid_exam': 'Mid Exam',
        'final_exam': 'Final Exam',
        'announcement': 'Announcement',
        'announcements': 'Announcement',
        'resource': 'Resource',
        'resources': 'Resource',
        'assignment': 'Assignment',
        'video': 'Video',
        'reading': 'Reading',
        'activity': 'Activity',
        'positive': 'Positive',
        'negative': 'Negative',
        'warning': 'Warning',
        'praise': 'Praise',
        'discipline': 'Discipline'
      };
      
      const key = typeMap[rawType] || rawType;
      grouped[key] = (grouped[key] || 0) + 1;
    });
    
    info('[processBehaviorData] Type distribution:', typeDistribution);
    info('[processBehaviorData] Mapped grouped data:', grouped);
    
    const result = Object.entries(grouped).map(([label, value]) => ({ label, value }));
    filtered = filtered.filter(item => item.classId === filters.classId);
  }
  
  if (filters.studentId) {
    filtered = filtered.filter(item => item.studentId === filters.studentId);
  }
  
  if (widget.groupBy === 'type') {
    const grouped = {};
    filtered.forEach(item => {
      const rawType = item.type || 'Unknown';
      // Map penalty types to proper labels (same as original hook)
      const typeMap = {
        'late': 'Late',
        'absent': 'Absent',
        'unauthorized_leave': 'Unauthorized Leave',
        'misconduct': 'Misconduct',
        'cheating': 'Cheating',
        'plagiarism': 'Plagiarism',
        'disruptive': 'Disruptive Behavior',
        'uniform_violation': 'Uniform Violation',
        'mobile_phone': 'Mobile Phone Violation',
        'other': 'Other'
      };
      const key = typeMap[rawType] || rawType;
      grouped[key] = (grouped[key] || 0) + 1;
    });
    
    return Object.entries(grouped).map(([label, value]) => ({ label, value }));
  }
  
  return [{ label: widget.title || 'Penalties', value: filtered.length }];
}

// Generic data processing function for all data sources
function processGenericData(widget, data, filters, rawData, dataSourceName) {
  let filtered = data;
  
  // Disable all logging to prevent console spam
  // if (import.meta.env.MODE === 'development') {
  //   info(`[processGenericData] Processing ${dataSourceName} data:`, {
  //     totalRecords: data.length,
  //     filters: filters,
  //     groupBy: widget.groupBy
  //   });
  // }
  
  // Apply filters
  if (filters.classId) {
    filtered = filtered.filter(item => item.classId === filters.classId);
  }
  
  if (filters.studentId) {
    filtered = filtered.filter(item => item.studentId === filters.studentId);
  }
  
  if (filters.programId) {
    filtered = filtered.filter(item => item.programId === filters.programId);
  }
  
  // Handle groupBy
  if (widget.groupBy && widget.groupBy !== 'none') {
    const grouped = {};
    
    filtered.forEach(item => {
      let key = 'Unknown';
      
      switch (widget.groupBy) {
        case 'classId':
          const classItem = rawData.classes?.find(c => c.id === item.classId);
          key = classItem?.nameEn || classItem?.name || classItem?.className || `Class ${item.classId?.substring(0, 8) || 'Unknown'}`;
          break;
          
        case 'programId':
          const programItem = rawData.programs?.find(p => p.id === item.programId);
          key = programItem?.nameEn || programItem?.name || programItem?.programName || `Program ${item.programId?.substring(0, 8) || 'Unknown'}`;
          break;
          
        case 'subjectId':
          const subjectItem = rawData.subjects?.find(s => s.id === item.subjectId);
          key = subjectItem?.nameEn || subjectItem?.name || subjectItem?.subjectName || `Subject ${item.subjectId?.substring(0, 8) || 'Unknown'}`;
          break;
          
        case 'userId':
        case 'createdBy':
          const userId = item.userId || item.createdBy;
          const userItem = rawData.users?.find(u => u.id === userId);
          key = userItem?.realNameEn || userItem?.realName || userItem?.displayNameEn || userItem?.displayName || userItem?.name || `User ${userId?.substring(0, 8) || 'Unknown'}`;
          break;
          
        case 'studentId':
          const studentItem = rawData.users?.find(u => u.id === item.studentId);
          key = studentItem?.realNameEn || studentItem?.realName || studentItem?.displayNameEn || studentItem?.displayName || studentItem?.name || `Student ${item.studentId?.substring(0, 8) || 'Unknown'}`;
          break;
          
        case 'role':
          key = item.role || 'Unknown Role';
          break;
          
        case 'term':
          key = item.term || 'Unknown Term';
          break;
          
        case 'year':
          key = item.year || 'Unknown Year';
          break;
          
        case 'date':
          const date = item.date || item.createdAt || item.when;
          if (date) {
            const dateObj = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
            key = dateObj.toLocaleDateString();
          } else {
            key = 'No Date';
          }
          break;
          
        case 'penaltyType':
        case 'absenceType':
        case 'attendanceType':
          key = item[widget.groupBy] || item.type || 'Unknown';
          break;
          
        default:
          key = item[widget.groupBy] || 'Unknown';
      }
      
      grouped[key] = (grouped[key] || 0) + 1;
    });
    
    const result = Object.entries(grouped).map(([label, value]) => ({ label, value }));

  // Disable all logging to prevent console spam
  // if (import.meta.env.MODE === 'development') {
  //   info(`[processGenericData] ${widget.groupBy} distribution for ${dataSourceName}:`, grouped);
  //   info('[processGenericData] Final result:', result);
  // }
    
    return result;
  }
  
  // Disable all logging to prevent console spam
  // if (import.meta.env.MODE === 'development') {
  //   info(`[processGenericData] No grouping for ${dataSourceName}, returning total count:`, filtered.length);
  // }
  return [{ label: widget.title || dataSourceName, value: filtered.length }];
}
