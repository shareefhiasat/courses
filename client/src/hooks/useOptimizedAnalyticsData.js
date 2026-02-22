import React, { cache } from 'react';
import useAnalyticsData from '@hooks/useAnalyticsData';
import logger from '@utils/logger';

/**
 * Cached data fetchers using React.cache for deduplication
 * These functions will cache results based on their arguments
 */

// Cache individual data source fetches
const fetchCachedEnrollments = cache(async (filters) => {
  logger.log('[CachedDataFetchers] Fetching enrollments with filters:', filters);
  // Simulate API call - replace with actual service call
  return [];
});

const fetchCachedAttendance = cache(async (filters) => {
  logger.log('[CachedDataFetchers] Fetching attendance with filters:', filters);
  return [];
});

const fetchCachedMarks = cache(async (filters) => {
  logger.log('[CachedDataFetchers] Fetching marks with filters:', filters);
  return [];
});

const fetchCachedParticipations = cache(async (filters) => {
  logger.log('[CachedDataFetchers] Fetching participations with filters:', filters);
  return [];
});

const fetchCachedBehaviors = cache(async (filters) => {
  logger.log('[CachedDataFetchers] Fetching behaviors with filters:', filters);
  return [];
});

const fetchCachedPenalties = cache(async (filters) => {
  logger.log('[CachedDataFetchers] Fetching penalties with filters:', filters);
  return [];
});

const fetchCachedClasses = cache(async (filters) => {
  logger.log('[CachedDataFetchers] Fetching classes with filters:', filters);
  return [];
});

const fetchCachedUsers = cache(async (filters) => {
  logger.log('[CachedDataFetchers] Fetching users with filters:', filters);
  return [];
});

const fetchCachedActivityLogs = cache(async (filters) => {
  logger.log('[CachedDataFetchers] Fetching activity logs with filters:', filters);
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
  
  logger.log('[fetchWidgetDataParallel] Fetching data for sources:', Array.from(dataSources));
  
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
    logger.log(`[fetchWidgetDataParallel] Completed in ${(endTime - startTime).toFixed(2)}ms`);
    
    return dataSourceMap;
  } catch (error) {
    logger.error('[fetchWidgetDataParallel] Error fetching data:', error);
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
      logger.log('[useOptimizedAnalyticsData] Loading analytics data...');
    } else {
      logger.log('[useOptimizedAnalyticsData] Analytics data loaded');
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
export const processWidgetDataOptimized = cache((widget, rawData, globalFilters) => {
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
        processedData = processAttendanceData(widget, rawData.attendance || [], globalFilters);
        break;
      case 'marks':
        processedData = processMarksData(widget, rawData.marks || [], globalFilters);
        break;
      case 'participations':
        processedData = processParticipationData(widget, rawData.participations || [], globalFilters);
        break;
      case 'behaviors':
        processedData = processBehaviorData(widget, rawData.behaviors || [], globalFilters);
        break;
      case 'penalties':
        processedData = processPenaltyData(widget, rawData.penalties || [], globalFilters);
        break;
      default:
        processedData = [];
    }
  }
  
  const endTime = performance.now();
  logger.log(`[processWidgetDataOptimized] Processed ${dataSource} in ${(endTime - startTime).toFixed(2)}ms`);
  
  return processedData;
});

// Helper functions for data processing
function processMultiSourceActivityData(widget, data, filters) {
  logger.log('[processMultiSourceActivityData] Processing combined activity data:', {
    totalRecords: data.length,
    filters: filters,
    groupBy: widget.groupBy
  });
  
  let filtered = data;
  
  if (filters.classId) {
    filtered = filtered.filter(item => item.classId === filters.classId);
    logger.log(`[processMultiSourceActivityData] Filtered by classId ${filters.classId}: ${filtered.length} records`);
  }
  
  if (filters.studentId) {
    filtered = filtered.filter(item => item.studentId === filters.studentId);
    logger.log(`[processMultiSourceActivityData] Filtered by studentId ${filters.studentId}: ${filtered.length} records`);
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
        'video': 'Video',
        'presentation': 'Presentation',
        'discussion': 'Discussion',
        'forum': 'Forum',
        'other': 'Other'
      };
      
      const key = typeMap[rawType] || rawType;
      grouped[key] = (grouped[key] || 0) + 1;
    });
    
    logger.log('[processMultiSourceActivityData] Type distribution:', typeDistribution);
    logger.log('[processMultiSourceActivityData] Mapped grouped data:', grouped);
    
    const result = Object.entries(grouped).map(([label, value]) => ({ label, value }));
    logger.log('[processMultiSourceActivityData] Final result:', result);
    
    return result;
  }
  
  logger.log('[processMultiSourceActivityData] No grouping, returning total count:', filtered.length);
  return [{ label: widget.title || 'Activities', value: filtered.length }];
}

function processEnrollmentData(widget, data, filters, rawData) {
  // Apply filters and aggregations
  let filtered = data;
  
  logger.log('[processEnrollmentData] Processing enrollment data:', {
    totalRecords: data.length,
    filters: filters,
    groupBy: widget.groupBy,
    availablePrograms: rawData.programs?.length || 0
  });
  
  if (filters.classId) {
    filtered = filtered.filter(item => item.classId === filters.classId);
    logger.log(`[processEnrollmentData] Filtered by classId ${filters.classId}: ${filtered.length} records`);
  }
  
  if (filters.studentId) {
    filtered = filtered.filter(item => item.studentId === filters.studentId);
    logger.log(`[processEnrollmentData] Filtered by studentId ${filters.studentId}: ${filtered.length} records`);
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
    
    logger.log('[processEnrollmentData] Raw distribution:', rawDistribution);
    logger.log('[processEnrollmentData] Mapped grouped data:', grouped);
    
    const result = Object.entries(grouped).map(([label, value]) => ({ label, value }));
    logger.log('[processEnrollmentData] Final result:', result);
    
    return result;
  }
  
  logger.log('[processEnrollmentData] No grouping, returning total count:', filtered.length);
  // Return count if no grouping
  return [{ label: widget.title || 'Enrollments', value: filtered.length }];
}

function processAttendanceData(widget, data, filters) {
  let filtered = data;
  
  logger.log('[processAttendanceData] Processing attendance data:', {
    totalRecords: data.length,
    filters: filters,
    groupBy: widget.groupBy
  });
  
  if (filters.classId) {
    filtered = filtered.filter(item => item.classId === filters.classId);
    logger.log(`[processAttendanceData] Filtered by classId ${filters.classId}: ${filtered.length} records`);
  }
  
  if (filters.studentId) {
    filtered = filtered.filter(item => item.studentId === filters.studentId);
    logger.log(`[processAttendanceData] Filtered by studentId ${filters.studentId}: ${filtered.length} records`);
  }
  
  if (widget.groupBy === 'status' || widget.groupBy === 'attendanceType') {
    const grouped = {};
    const statusDistribution = {};
    
    filtered.forEach(item => {
      const status = item.status || 'Unknown';
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
        'active': 'Active'
      };
      
      const key = statusMap[status] || status;
      grouped[key] = (grouped[key] || 0) + 1;
      statusDistribution[status] = (statusDistribution[status] || 0) + 1;
    });
    
    logger.log('[processAttendanceData] Status distribution:', statusDistribution);
    logger.log('[processAttendanceData] Mapped grouped data:', grouped);
    
    const result = Object.entries(grouped).map(([label, value]) => ({ label, value }));
    logger.log('[processAttendanceData] Final result:', result);
    
    return result;
  }
  
  logger.log('[processAttendanceData] No grouping, returning total count:', filtered.length);
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
  
  logger.log('[processBehaviorData] Processing behavior data:', {
    totalRecords: data.length,
    filters: filters,
    groupBy: widget.groupBy
  });
  
  if (filters.classId) {
    filtered = filtered.filter(item => item.classId === filters.classId);
    logger.log(`[processBehaviorData] Filtered by classId ${filters.classId}: ${filtered.length} records`);
  }
  
  if (filters.studentId) {
    filtered = filtered.filter(item => item.studentId === filters.studentId);
    logger.log(`[processBehaviorData] Filtered by studentId ${filters.studentId}: ${filtered.length} records`);
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
    
    logger.log('[processBehaviorData] Type distribution:', typeDistribution);
    logger.log('[processBehaviorData] Mapped grouped data:', grouped);
    
    const result = Object.entries(grouped).map(([label, value]) => ({ label, value }));
    logger.log('[processBehaviorData] Final result:', result);
    
    return result;
  }
  
  logger.log('[processBehaviorData] No grouping, returning total count:', filtered.length);
  return [{ label: widget.title || 'Behaviors', value: filtered.length }];
}

function processPenaltyData(widget, data, filters) {
  let filtered = data;
  
  if (filters.classId) {
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
