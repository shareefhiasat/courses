import { useState, useEffect, useCallback } from 'react';
import { getDocs, collection, query, orderBy } from 'firebase/firestore';
import { db } from '@services/other/config';
import { getPrograms, getSubjects } from '@services/business/programService';
import { ATTENDANCE_STATUS } from '@constants/attendanceTypes';
import { PENALTY_TYPES } from '@constants/penaltyTypes';
import { ABSENCE_TYPES } from '@constants/absenceTypes';
import { ACTIVITY_TYPES, ACTIVITY_TYPE_LABELS } from '@constants/activityTypes';
import logger from '@utils/logger';

const EMPTY_RAW = {
  activities: [],
  submissions: [],
  users: [],
  classes: [],
  attendance: [],
  activityLogs: [],
  enrollments: [],
  quizzes: [],
  quizSubmissions: [],
  notifications: [],
  emailLogs: [],
  programs: [],
  subjects: [],
  penalties: [],
  absences: [],
  studentMarks: [],
  behaviors: [],
  participations: [],
  announcements: [],
  resources: [],
  courses: [],
  scheduledReports: [],
  studentProgress: [],
  subjectMarksDistribution: [],
  notificationLogs: [],
  attendanceSessions: []
};

/**
 * useAnalyticsData
 * Fetches all admin-level raw collections needed by the analytics dashboard.
 * Returns { rawData, loading, permErrors, reload }.
 */
const useAnalyticsData = () => {
  const [loading, setLoading] = useState(true);
  const [rawData, setRawData] = useState(EMPTY_RAW);
  const [permErrors, setPermErrors] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadAllData = useCallback(async () => {
    // Prevent multiple simultaneous refreshes
    if (isRefreshing) {
      console.log('[REFRESH DEBUG] ⏸️ Refresh already in progress, skipping...');
      return;
    }

    console.log('[REFRESH DEBUG] 🔄 Starting analytics data refresh...');
    setIsRefreshing(true);
    setLoading(true);
    const errors = {};
    const next = { ...EMPTY_RAW };

    const safeLoad = async (key, loader) => {
      try {
        console.log(`[REFRESH DEBUG] 📥 Loading ${key}...`);
        const snap = await loader();
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        next[key] = data;
        console.log(`[REFRESH DEBUG] ✅ Loaded ${key}:`, data.length, 'records');
        
        // DEBUG: Show raw Firestore data structure for classes
        if (key === 'classes' && data.length > 0) {
          console.log(`[CLASSES DEBUG] Raw Firestore docs:`, snap.docs.slice(0, 2).map(d => ({
            id: d.id,
            data: d.data()
          })));
          console.log(`[CLASSES DEBUG] Mapped data:`, data.slice(0, 2));
        }
        
        // Show sample data for key collections
        if (key === 'attendance' && data.length > 0) {
          console.log(`[REFRESH DEBUG] 📊 Attendance sample:`, data.slice(0, 2));
          const statusCounts = {};
          data.forEach(item => {
            const status = item.status || 'unknown';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
          });
          console.log(`[REFRESH DEBUG] 📈 Attendance status distribution:`, statusCounts);
        }
        
        // Show sample data for announcements and resources
        if ((key === 'announcements' || key === 'resources')) {
          console.log(`[REFRESH DEBUG] 📋 ${key} loaded:`, data.length, 'records');
          if (data.length > 0) {
            console.log(`[REFRESH DEBUG] 📋 ${key} sample:`, data.slice(0, 2));
          }
        }
        
        // Show sample data for students collection
        if (key === 'students') {
          console.log(`[REFRESH DEBUG] 👥 Students loaded:`, data.length, 'records');
          if (data.length > 0) {
            console.log(`[REFRESH DEBUG] 👥 Students sample:`, data.slice(0, 3).map(s => ({
              id: s.id || s.uid,
              displayName: s.displayName,
              name: s.name,
              firstName: s.firstName,
              lastName: s.lastName,
              studentNumber: s.studentNumber,
              email: s.email
            })));
          }
        }
        
              } catch (e) {
        const code = (e?.code || e?.message || '').toString();
        if (code.includes('permission-denied')) errors[key] = 'permission-denied';
        console.error(`[REFRESH DEBUG] ❌ Failed to load ${key}:`, e);
        logger.warn(`[useAnalyticsData] failed to load ${key}:`, e);
      }
    };

    await Promise.all([
      safeLoad('activities', () => getDocs(collection(db, 'activities'))),
      safeLoad('submissions', () => getDocs(collection(db, 'submissions'))),
      safeLoad('users', () => getDocs(collection(db, 'users'))),
      // students collection removed - use users collection instead to avoid permission errors
      safeLoad('classes', () => getDocs(collection(db, 'classes'))),
      safeLoad('attendance', () => getDocs(collection(db, 'attendance'))),
      safeLoad('activityLogs', () => getDocs(query(collection(db, 'activityLogs'), orderBy('when', 'desc')))),
      safeLoad('enrollments', () => getDocs(collection(db, 'enrollments'))),
      safeLoad('quizzes', () => getDocs(collection(db, 'quizzes'))),
      safeLoad('quizSubmissions', () => getDocs(collection(db, 'quizSubmissions'))),
      safeLoad('notifications', () => getDocs(query(collection(db, 'notifications'), orderBy('createdAt', 'desc')))),
      safeLoad('emailLogs', () => getDocs(query(collection(db, 'emailLogs'), orderBy('timestamp', 'desc')))),
      safeLoad('announcements', () => getDocs(collection(db, 'announcements'))),
      safeLoad('resources', () => getDocs(collection(db, 'resources'))),
      safeLoad('programs', async () => {
        const res = await getPrograms();
        return { docs: (res.data || []).map(p => ({ id: p.docId, data: () => p })) };
      }),
      safeLoad('subjects', async () => {
        const res = await getSubjects();
        return { docs: (res.data || []).map(s => ({ id: s.docId, data: () => s })) };
      }),
      safeLoad('penalties', () => getDocs(collection(db, 'penalties'))),
      safeLoad('absences', () => getDocs(collection(db, 'absences'))),
      safeLoad('studentMarks', () => getDocs(collection(db, 'studentMarks'))),
      safeLoad('behaviors', () => getDocs(collection(db, 'behaviors'))),
      safeLoad('participations', () => getDocs(collection(db, 'participations'))),
      safeLoad('courses', () => getDocs(collection(db, 'courses'))),
      safeLoad('scheduledReports', () => getDocs(collection(db, 'scheduledReports'))),
      safeLoad('studentProgress', () => getDocs(collection(db, 'studentProgress'))),
      safeLoad('subjectMarksDistribution', () => getDocs(collection(db, 'subjectMarksDistribution'))),
      safeLoad('notificationLogs', () => getDocs(collection(db, 'notificationLogs'))),
      safeLoad('attendanceSessions', () => getDocs(collection(db, 'attendanceSessions')))
    ]);

    console.log('[REFRESH DEBUG] 🎉 Refresh completed!');
    console.log('[REFRESH DEBUG] 📊 Final data summary:', Object.keys(next).reduce((acc, key) => {
      acc[key] = next[key].length;
      return acc;
    }, {}));
    
    if (Object.keys(errors).length > 0) {
      console.log('[REFRESH DEBUG] ⚠️ Errors encountered:', errors);
    }
    
    setRawData(next);
    setPermErrors(errors);
    setLoading(false);
    setIsRefreshing(false);
  }, [isRefreshing]);

  useEffect(() => {
    loadAllData();
  }, []); // Empty dependency array - only run once on mount

  const reloadWithDebug = () => {
    console.log('[REFRESH DEBUG] 🔄 Reload function called!');
    console.log('[REFRESH DEBUG] 🕐 Timestamp:', new Date().toISOString());
    console.log('[REFRESH DEBUG] 📊 Current rawData keys:', Object.keys(rawData));
    return loadAllData();
  };

  const smartReload = async (widget) => {
    console.log('[SMART REFRESH DEBUG] 🔄 Smart reload started!');
    console.log('[SMART REFRESH DEBUG] 📊 Widget:', widget.title || 'Untitled');
    console.log('[SMART REFRESH DEBUG] 🕐 Timestamp:', new Date().toISOString());
    
    const collections = getWidgetCollections(widget);
    console.log('[SMART REFRESH DEBUG] 📋 Collections to reload:', collections);
    
    const freshData = {};
    const newPermErrors = {};
    
    // Local safeLoad function for smart reload - returns data instead of setting state
    const safeLoad = async (key, loadFn) => {
      try {
        console.log(`[SMART REFRESH DEBUG] 📥 Loading ${key}...`);
        const data = await loadFn();
        
        // Handle Firestore QuerySnapshot
        let docs = [];
        if (data && data.docs) {
          // Firestore QuerySnapshot
          docs = data.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } else if (Array.isArray(data)) {
          // Direct array data
          docs = data.map(doc => ({ id: doc.id || doc.uid || doc.docId, ...doc }));
        } else if (data) {
          // Single document or other data
          docs = [{ id: data.id || data.uid || data.docId, ...data }];
        }
        
        console.log(`[SMART REFRESH DEBUG] ✅ Loaded ${key}: ${docs.length} records`);
        freshData[key] = docs;
        return docs;
      } catch (e) {
        const code = (e?.code || e?.message || '').toString();
        if (code.includes('permission-denied')) newPermErrors[key] = 'permission-denied';
        console.error(`[SMART REFRESH DEBUG] ❌ Failed to load ${key}:`, e);
        logger.warn(`[useAnalyticsData] failed to load ${key}:`, e);
        freshData[key] = [];
        return [];
      }
    };
    
    try {
      const loadPromises = collections.map(async (collectionName) => {
        console.log(`[SMART REFRESH DEBUG] 📥 Loading ${collectionName}...`);
        
        let loadFn;
        switch (collectionName) {
          case 'activities':
            loadFn = () => getDocs(collection(db, 'activities'));
            break;
          case 'submissions':
            loadFn = () => getDocs(collection(db, 'submissions'));
            break;
          case 'users':
            loadFn = () => getDocs(collection(db, 'users'));
            break;
          // students case removed - use users collection instead
          case 'classes':
            loadFn = () => getDocs(collection(db, 'classes'));
            break;
          case 'attendance':
            loadFn = () => getDocs(collection(db, 'attendance'));
            break;
          case 'activityLogs':
            loadFn = () => getDocs(collection(db, 'activityLogs'));
            break;
          case 'enrollments':
            loadFn = () => getDocs(collection(db, 'enrollments'));
            break;
          case 'quizzes':
            loadFn = () => getDocs(collection(db, 'quizzes'));
            break;
          case 'quizSubmissions':
            loadFn = () => getDocs(collection(db, 'quizSubmissions'));
            break;
          case 'notifications':
            loadFn = () => getDocs(collection(db, 'notifications'));
            break;
          case 'emailLogs':
            loadFn = () => getDocs(collection(db, 'emailLogs'));
            break;
          case 'announcements':
            loadFn = () => getDocs(collection(db, 'announcements'));
            break;
          case 'resources':
            loadFn = () => getDocs(collection(db, 'resources'));
            break;
          case 'programs':
            loadFn = () => getProgramsSorted();
            break;
          case 'subjects':
            loadFn = () => getSubjectsSorted();
            break;
          case 'penalties':
            loadFn = () => getDocs(collection(db, 'penalties'));
            break;
          case 'absences':
            loadFn = () => getDocs(collection(db, 'attendance')); // absences use attendance collection
            break;
          case 'studentMarks':
            loadFn = () => getDocs(collection(db, 'studentMarks'));
            break;
          case 'behaviors':
            loadFn = () => getDocs(collection(db, 'behaviors'));
            break;
          case 'participations':
            loadFn = () => getDocs(collection(db, 'participations'));
            break;
          case 'courses':
            loadFn = () => getDocs(collection(db, 'courses'));
            break;
          case 'scheduledReports':
            loadFn = () => getDocs(collection(db, 'scheduledReports'));
            break;
          case 'studentProgress':
            loadFn = () => getDocs(collection(db, 'studentProgress'));
            break;
          case 'subjectMarksDistribution':
            loadFn = () => getDocs(collection(db, 'subjectMarksDistribution'));
            break;
          case 'notificationLogs':
            loadFn = () => getDocs(collection(db, 'notificationLogs'));
            break;
          case 'attendanceSessions':
            loadFn = () => getDocs(collection(db, 'attendanceSessions'));
            break;
          default:
            console.warn(`[SMART REFRESH DEBUG] ⚠️ Unknown collection: ${collectionName}`);
            return;
        }
        
        return safeLoad(collectionName, loadFn);
      });
      
      await Promise.all(loadPromises);
      
      console.log('[SMART REFRESH DEBUG] ✅ Smart reload completed successfully!');
      
      // Return fresh data for the widget
      return { freshData, permErrors: newPermErrors };
    } catch (error) {
      console.error('[SMART REFRESH DEBUG] ❌ Smart reload failed:', error);
      return { freshData: {}, permErrors: newPermErrors };
    }
  };

  return { rawData, loading, permErrors, reload: reloadWithDebug, smartReload };
};

/**
 * getWidgetCollections
 * Determines which collections a widget needs for smart refresh
 * @param {object} widget - Widget config
 * @returns {array} - Array of collection names this widget depends on
 */
export const getWidgetCollections = (widget) => {
  const { dataSource, groupBy } = widget;
  const collections = new Set();
  
  // Add main data source(s)
  if (dataSource) {
    if (dataSource.includes(',')) {
      // Multi-source widget
      const sources = dataSource.split(',').map(s => s.trim()).filter(Boolean);
      sources.forEach(src => collections.add(src));
    } else if (dataSource === 'absences') {
      // Absences use attendance collection
      collections.add('attendance');
    } else {
      collections.add(dataSource);
    }
  }
  
  // Add collections needed for label resolution
  if (groupBy === 'classId') collections.add('classes');
  if (groupBy === 'programId') collections.add('programs');
  if (groupBy === 'subjectId') collections.add('subjects');
  if (groupBy === 'studentId' || groupBy === 'createdBy' || groupBy === 'performedBy') {
    collections.add('users');
  }
  if (groupBy === 'instructorId') collections.add('users');
  
  // Always include users for name resolution (students collection has permission issues)
  collections.add('users');
  
  console.log('[WIDGET DEBUG] 📋 Widget collections needed:', Array.from(collections));
  return Array.from(collections);
};

/**
 * processWidgetData
 * Pure function: takes a widget config + rawData + globalFilters and returns
 * an array of { label, value } chart data points.
 *
 * @param {object} widget  - Widget config (dataSource, groupBy, aggregation, dateRange, filters, …)
 * @param {object} rawData - All raw collections from useAnalyticsData
 * @param {object} globalFilters - { classId, term, year, programId, subjectId, semester, studentId }
 * @param {number} comparisonOffset - 0 = current period, 1 = previous period
 */
export const processWidgetData = (widget, rawData, globalFilters = {}, comparisonOffset = 0, t = null, lang = 'en') => {
  const { dataSource, groupBy, aggregation = 'count', filters = [], dateRange, customDateFrom, customDateTo } = widget;

  // DEBUG: Log widget processing start with more details
  console.log(`[WIDGET DEBUG] 🎯 Processing: ${widget.title || 'Untitled'} (${dataSource}) - groupBy: "${groupBy}" - aggregation: ${aggregation}`);
  
  // Enhanced validation for groupBy
  if (!groupBy || groupBy.trim() === '' || groupBy === 'undefined' || groupBy === 'null') {
    console.warn('[processWidgetData] Invalid groupBy provided:', { groupBy, widgetTitle: widget.title, dataSource });
    return [];
  }

  // ── Multi-source merge: dataSource can be comma-separated e.g. "activities,announcements,resources" ──
  let dataset;
  if (dataSource && dataSource.includes(',')) {
    const sources = dataSource.split(',').map(s => s.trim()).filter(Boolean);
    dataset = sources.flatMap(src => (rawData[src] || []).map(item => ({ ...item, _source: src })));
  } else if (dataSource === 'absences') {
    // Special case: absences are stored in attendance collection with absence-related statuses
    dataset = (rawData.attendance || [])
      .filter(item => {
        const status = item.status || '';
        return status.includes('absent') || status.includes('excused') || status.includes('bereavement');
      })
      .map(item => ({ ...item, _source: 'attendance', type: item.status }));
  } else {
    dataset = (rawData[dataSource] || []).map(item => ({ ...item, _source: dataSource }));
  }

  // DEBUG: Log widget processing start (minimal)
  console.log(`[WIDGET DEBUG] 🎯 Processing: ${widget.title || 'Untitled'} (${dataSource})`);
  
  // DEBUG: Show absences filtering info
  if (dataSource === 'absences') {
    const totalAttendance = (rawData.attendance || []).length;
    console.log(`[WIDGET DEBUG] 📊 Absences: ${dataset.length} records filtered from ${totalAttendance} attendance records`);
    if (dataset.length > 0) {
      const statusCounts = {};
      dataset.forEach(item => {
        const status = item.status;
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      console.log(`[WIDGET DEBUG] 📈 Absence status breakdown:`, statusCounts);
    }
  }
  
  // DEBUG: Show all status values for attendance (only for attendance)
  if (dataSource === 'attendance' && dataset.length > 0) {
    const allStatuses = [...new Set(dataset.map(item => item.status))].filter(Boolean);
    console.log(`[WIDGET DEBUG] 📋 Status values:`, allStatuses);
  }
  

  // --- Global filter application ---
  if (globalFilters.studentId) {
    dataset = dataset.filter(i =>
      (i.userId || i.studentId || i.uid) === globalFilters.studentId
    );
  }
  if (globalFilters.classId) {
    dataset = dataset.filter(i =>
      (i.classId || i.class || i.class_id) === globalFilters.classId
    );
  }
  if (globalFilters.term) {
    dataset = dataset.filter(i =>
      (i.term || i.sessionTerm) === globalFilters.term
    );
  }
  if (globalFilters.year) {
    dataset = dataset.filter(i =>
      String(i.year || i.academicYear) === String(globalFilters.year)
    );
  }
  if (globalFilters.semester) {
    dataset = dataset.filter(i =>
      (i.semester || i.sessionSemester) === globalFilters.semester
    );
  }
  if (globalFilters.programId) {
    const programClasses = (rawData.classes || [])
      .filter(c => c.programId === globalFilters.programId)
      .map(c => c.docId || c.id);
    const programSubjects = (rawData.subjects || [])
      .filter(s => s.programId === globalFilters.programId)
      .map(s => s.docId || s.id);
    dataset = dataset.filter(i => {
      const cId = i.classId || i.class || i.class_id;
      const sId = i.subjectId || i.subject || i.subject_id;
      return programClasses.includes(cId) || programSubjects.includes(sId);
    });
  }
  if (globalFilters.subjectId) {
    dataset = dataset.filter(i =>
      (i.subjectId || i.subject || i.subject_id) === globalFilters.subjectId
    );
  }
  if (globalFilters.instructorId) {
    dataset = dataset.filter(i =>
      (i.instructorId || i.createdBy || i.markedBy || i.performedBy) === globalFilters.instructorId
    );
  }

  // DEBUG: Log after global filters (only if data was filtered out)
  if (dataset.length === 0) {
    console.log(`[WIDGET DEBUG] ❌ No data after filters`);
  }

  // --- Widget-level filters ---
  filters.forEach(filter => {
    if (filter.field && filter.operator && filter.value !== undefined) {
      dataset = dataset.filter(item => {
        const fv = item[filter.field];
        switch (filter.operator) {
          case 'equals': return fv === filter.value;
          case 'contains': return String(fv).toLowerCase().includes(String(filter.value).toLowerCase());
          case 'greater': return fv > filter.value;
          case 'less': return fv < filter.value;
          default: return true;
        }
      });
    }
  });

  // --- Date range ---
  if (dateRange && dateRange !== 'all') {
    let cutoff, upperBound;
    if (dateRange === 'custom' && customDateFrom && customDateTo) {
      cutoff = new Date(customDateFrom).getTime();
      upperBound = new Date(customDateTo).getTime() + 86400000 - 1;
    } else {
      const now = Date.now();
      const ranges = { today: 86400000, last7: 7 * 86400000, last30: 30 * 86400000, last90: 90 * 86400000 };
      const rangeMs = ranges[dateRange] || 0;
      cutoff = now - rangeMs - comparisonOffset * rangeMs;
      upperBound = comparisonOffset > 0 ? now - comparisonOffset * rangeMs : now;
      
      }
    
    const beforeDateFilter = dataset.length;
    dataset = dataset.filter(item => {
      let ts = 0;
      // For attendance records, prioritize the 'date' field (string format)
      if (dataSource === 'attendance' && item.date) {
        ts = new Date(item.date).getTime();
      } else {
        // Fallback to timestamp fields for other collections
        ts = item.when?.seconds ? item.when.seconds * 1000 :
             item.createdAt?.seconds ? item.createdAt.seconds * 1000 :
             item.submittedAt?.seconds ? item.submittedAt.seconds * 1000 : 0;
      }
      return ts >= cutoff && ts < upperBound;
    });
    
    // DEBUG: Log only if date filtering removed data
    if (beforeDateFilter > dataset.length) {
      console.log(`[WIDGET DEBUG] 📅 Date filter: ${beforeDateFilter} → ${dataset.length}`);
    }
  }

  // --- Group & aggregate ---
  const grouped = {};

  const resolveLabel = (item) => {
    if (groupBy === 'programId' || groupBy === 'program') {
      const cId = item.classId || item.class || item.class_id;
      const sId = item.subjectId || item.subject || item.subject_id;
      let pId = 'Unknown';
      if (cId) {
        const cls = (rawData.classes || []).find(c => c.id === cId); // Fixed: use id instead of docId
        if (cls?.programId) pId = cls.programId;
      }
      if (pId === 'Unknown' && sId) {
        const sub = (rawData.subjects || []).find(s => s.id === sId); // Fixed: use id instead of docId
        if (sub?.programId) pId = sub.programId;
      }
      const prog = (rawData.programs || []).find(p => p.id === pId); // Fixed: use id instead of docId
      return prog ? (prog.name_en || prog.name || prog.code || pId) : pId;
    }
    if (groupBy === 'classId' || groupBy === 'class') {
      const cId = item.classId || item.class || item.class_id;
      if (!cId) return 'Unknown';
      
      // Try direct ID match first (for properly structured data)
      const cls = (rawData.classes || []).find(c => 
        c.id === cId || 
        c.docId === cId || 
        c.classId === cId ||
        c._id === cId
      );
      
      if (cls) {
        return cls.name_en || cls.name || cls.code || cId;
      }
      
      // Fallback: Try to find class by program and subject (using stored values from records)
      const sId = item.subjectId || item.subject || item.subject_id;
      const pId = item.programId || item.program;
      if (sId && pId) {
        const matchingClass = (rawData.classes || []).find(c => 
          (c.subjectId === sId || c.subject === sId) && 
          (c.programId === pId || c.program === pId)
        );
        if (matchingClass) {
          return matchingClass.name_en || matchingClass.name || matchingClass.code || cId;
        }
      }
      
      return cId;
    }
    if (groupBy === 'subjectId' || groupBy === 'subject') {
      const sId = item.subjectId || item.subject || item.subject_id || 'Unknown';
      const sub = (rawData.subjects || []).find(s => s.id === sId); // Fixed: use id instead of docId
      return sub ? `${sub.code || ''} - ${sub.name_en || sub.name || sId}`.trim() : sId;
    }
    if (groupBy === 'date') {
      const ts =
        item.when?.seconds ? item.when.seconds * 1000 :
        item.createdAt?.seconds ? item.createdAt.seconds * 1000 :
        item.submittedAt?.seconds ? item.submittedAt.seconds * 1000 :
        item.timestamp?.seconds ? item.timestamp.seconds * 1000 : 0;
      return ts ? new Date(ts).toLocaleDateString('en-GB') : null;
    }
    if (groupBy === 'penaltyType' || (dataSource === 'penalties' && groupBy === 'type')) {
      const pt = item.type || 'Unknown';
      return PENALTY_TYPES.find(p => p.id === pt)?.label_en || pt;
    }
    if (groupBy === 'attendanceType' || (dataSource === 'attendance' && groupBy === 'status')) {
      const status = item.status || 'Unknown';
      // Always return clean English labels for grouping keys
      const statusMap = {
        'present': 'Present',
        'late': 'Late',
        'absent_with_excuse': 'Absent (Excused)',
        'absent': 'Absent (No Excuse)',
        'absent_no_excuse': 'Absent (No Excuse)',
        'excused_leave': 'Excused Leave',
        'human_case': 'Human Case',
        'human case': 'Human Case',
        'humanCase': 'Human Case',
        'Human Case': 'Human Case',
        'HUMAN_CASE': 'Human Case',
        'closed': 'Closed',
        'open': 'Open',
        'active': 'Active'
      };
      return statusMap[status] || status;
    }
    if (groupBy === 'absenceType' || (dataSource === 'absences' && groupBy === 'type')) {
      const status = item.status || item.type || 'Unknown';
      // Map attendance statuses to absence types
      const statusToAbsenceType = {
        'absent_with_excuse': 'with_excuse',
        'absent': 'without_excuse', 
        'absent_no_excuse': 'without_excuse',
        'excused_leave': 'with_excuse',
        'human_case': 'beyond_control',
        'bereavement': 'bereavement'
      };
      const absenceTypeId = statusToAbsenceType[status] || status;
      const absenceType = ABSENCE_TYPES.find(a => a.id === absenceTypeId);
      return absenceType ? absenceType.label_en : status;
    }
    if (groupBy === 'status' && dataSource === 'attendance') {
      let s = item.status || 'unknown';
      if (s === 'absent') s = ATTENDANCE_STATUS.ABSENT_NO_EXCUSE;
      if (s === 'excused') s = ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE;
      return s;
    }
    if (groupBy === 'createdBy' || groupBy === 'performedBy') {
      const userId = item.createdBy || item.performedBy || item.markedBy;
      if (!userId) return 'Unknown';
      
      // Try to find user in rawData.users
      const user = (rawData.users || []).find(u => 
        u.id === userId || u.uid === userId || u.docId === userId
      );
      
      if (user) {
        return user.displayName || user.name || user.email || userId;
      }
      
      // Try to use performedByName if available
      if (item.performedByName && item.performedByName !== 'Unknown') {
        return item.performedByName;
      }
      
      return userId;
    }
    if (groupBy === 'studentId') {
      const studentId = item.studentId || item.userId || item.uid;
      if (!studentId) return 'Unknown';
      
            
      // Try to find student in both users and students collections
      let student = (rawData.users || []).find(u => 
        u.id === studentId || u.uid === studentId || u.docId === studentId
      );
      
      if (!student) {
        // Try students collection
        student = (rawData.students || []).find(s => 
          s.id === studentId || s.uid === studentId || s.docId === studentId
        );
      }
      
      if (student) {
        // Try different field name combinations
        let resolvedName = student.displayName || student.name || '';
        
        // If displayName is empty, try firstName + lastName
        if (!resolvedName && (student.firstName || student.lastName)) {
          const firstName = student.firstName || '';
          const lastName = student.lastName || '';
          resolvedName = `${firstName} ${lastName}`.trim();
        }
        
        // Fall back to student number, email, or ID
        if (!resolvedName) {
          resolvedName = student.studentNumber || student.email || studentId;
        }
        
                return resolvedName;
      }
      
            return studentId;
    }
    if (groupBy === '_source') {
      const src = item._source || 'unknown';
      const sourceLabels = {
        'activities': 'Activities',
        'announcements': 'Announcements',
        'resources': 'Resources',
        'submissions': 'Submissions',
        'attendance': 'Attendance',
        'enrollments': 'Enrollments',
        'quizzes': 'Quizzes',
        'quizSubmissions': 'Quiz Submissions',
        'activityLogs': 'Activity Logs',
        'behaviors': 'Behaviors',
        'participations': 'Participations',
        'penalties': 'Penalties',
        'notifications': 'Notifications',
      };
      return sourceLabels[src] || src;
    }
    if (groupBy === 'type') {
      const rawType = item.type || item._source || 'Unknown';
      // Always return clean English labels for grouping keys
      const typeMap = {
        [ACTIVITY_TYPES.QUIZ]: ACTIVITY_TYPE_LABELS[ACTIVITY_TYPES.QUIZ],
        [ACTIVITY_TYPES.HOMEWORK]: ACTIVITY_TYPE_LABELS[ACTIVITY_TYPES.HOMEWORK],
        [ACTIVITY_TYPES.TRAINING]: ACTIVITY_TYPE_LABELS[ACTIVITY_TYPES.TRAINING],
        [ACTIVITY_TYPES.LAB_AND_PROJECT]: ACTIVITY_TYPE_LABELS[ACTIVITY_TYPES.LAB_AND_PROJECT],
        [ACTIVITY_TYPES.MID_EXAM]: ACTIVITY_TYPE_LABELS[ACTIVITY_TYPES.MID_EXAM],
        [ACTIVITY_TYPES.FINAL_EXAM]: ACTIVITY_TYPE_LABELS[ACTIVITY_TYPES.FINAL_EXAM],
        'announcement': 'Announcement',
        'announcements': 'Announcement',
        'resource': 'Resource',
        'resources': 'Resource',
        'assignment': 'Assignment',
        'video': 'Video',
        'reading': 'Reading',
        'activity': 'Activity',
        'link': 'Link',
        'unknown': 'Unknown'
      };
      return typeMap[rawType] || rawType;
    }
    return String(item[groupBy] || 'Unknown');
  };

  const accumulate = (key, item) => {
    const value = parseFloat(item.score || item.value || item.grade || item.percentage || 0);
    if (aggregation === 'count') {
      grouped[key] = (grouped[key] || 0) + 1;
    } else if (aggregation === 'sum') {
      grouped[key] = (grouped[key] || 0) + value;
    } else if (aggregation === 'avg') {
      if (!grouped[key]) grouped[key] = { sum: 0, count: 0 };
      grouped[key].sum += value;
      grouped[key].count += 1;
    } else if (aggregation === 'min') {
      grouped[key] = grouped[key] === undefined ? value : Math.min(grouped[key], value);
    } else if (aggregation === 'max') {
      grouped[key] = grouped[key] === undefined ? value : Math.max(grouped[key], value);
    } else if (aggregation === 'median') {
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(value);
    } else {
      grouped[key] = (grouped[key] || 0) + 1;
    }
  };

  // Special: studentMarks by markType
  if (dataSource === 'studentMarks' && groupBy === 'markType') {
    const markKeys = ['midTermExam', 'finalExam', 'homework', 'labsProjectResearch', 'quizzes', 'participation', 'attendance'];
    dataset.forEach(item => {
      markKeys.forEach(k => {
        if (typeof item[k] === 'number') {
          const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
          if (!grouped[label]) grouped[label] = { sum: 0, count: 0 };
          grouped[label].sum += item[k];
          grouped[label].count += 1;
        }
      });
    });
    Object.keys(grouped).forEach(k => {
      if (aggregation === 'avg') grouped[k] = grouped[k].count > 0 ? grouped[k].sum / grouped[k].count : 0;
      else if (aggregation === 'sum') grouped[k] = grouped[k].sum;
      else grouped[k] = grouped[k].count;
    });
  } else if (dataSource === 'quizSubmissions') {
    dataset.forEach(item => {
      const key = resolveLabel(item);
      if (!key) return;
      const score = parseFloat(item.score || item.percentage || 0);
      const maxScore = parseFloat(item.maxScore || 100);
      const ratio = maxScore > 0 ? (score / maxScore) * 100 : 0;
      if (aggregation === 'count') {
        grouped[key] = (grouped[key] || 0) + 1;
      } else if (aggregation === 'avg') {
        if (!grouped[key]) grouped[key] = { sum: 0, count: 0 };
        grouped[key].sum += ratio;
        grouped[key].count += 1;
      } else {
        grouped[key] = (grouped[key] || 0) + ratio;
      }
    });
  } else {
    dataset.forEach(item => {
      const key = resolveLabel(item);
      if (!key) return;
      accumulate(key, item);
    });
  }

  // --- Convert to chart data ---
  const chartData = Object.entries(grouped).map(([label, value]) => {
    let finalValue = value;
    if (aggregation === 'avg' && value && typeof value === 'object') {
      finalValue = value.count > 0 ? value.sum / value.count : 0;
    } else if (aggregation === 'median' && Array.isArray(value)) {
      const sorted = [...value].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      finalValue = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
    }
    
    // Apply translation to labels if translation function is available
    let finalLabel = label;
    if (t) {
      // Activity type translations
      const activityTypeKeyMap = {
        'Quiz': 'activity_type_quiz',
        'Homework': 'activity_type_homework',
        'Training': 'activity_type_training',
        'Lab & Project': 'activity_type_lab_project',
        'Mid-Term Exam': 'activity_type_mid_exam',
        'Final Exam': 'activity_type_final_exam',
        'Announcement': 'activity_type_announcement',
        'Resource': 'activity_type_resource',
        'Assignment': 'activity_type_assignment',
        'Video': 'activity_type_video',
        'Reading': 'activity_type_reading',
        'Activity': 'activity_type_activity',
        'Link': 'activity_type_link',
        'Unknown': 'activity_type_unknown'
      };
      
      // Attendance status translations
      const attendanceKeyMap = {
        'Present': 'attendance_present',
        'Late': 'attendance_late',
        'Absent (Excused)': 'attendance_absent_excused',
        'Absent (No Excuse)': 'attendance_absent_no_excuse',
        'Excused Leave': 'attendance_excused_leave',
        'Human Case': 'attendance_human_case',
        'Closed': 'attendance_closed',
        'Open': 'attendance_open',
        'Active': 'attendance_active'
      };
      
      // Try activity type translation first
      let translationKey = activityTypeKeyMap[label];
      if (translationKey) {
        const translatedLabel = t(translationKey);
        if (translatedLabel && translatedLabel !== translationKey) {
          finalLabel = translatedLabel;
        }
      } 
      
      // If not translated yet, try attendance translation
      if (finalLabel === label) {
        translationKey = attendanceKeyMap[label];
        if (translationKey) {
          const translatedLabel = t(translationKey);
          if (translatedLabel && translatedLabel !== translationKey) {
            finalLabel = translatedLabel;
          }
        }
      }
    }
    
    return { label: finalLabel, value: typeof finalValue === 'number' ? parseFloat(finalValue.toFixed(2)) : finalValue };
  });

  chartData.sort((a, b) => b.value - a.value);
  
  // DEBUG: Log final results (only if there are issues)
  if (chartData.length === 0 && dataset.length > 0) {
    console.log(`[WIDGET DEBUG] ⚠️ No chart data from ${dataset.length} records`);
  }
  
  return chartData;
};

export default useAnalyticsData;
