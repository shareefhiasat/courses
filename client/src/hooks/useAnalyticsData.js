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

  const loadAllData = useCallback(async () => {
    console.log('[REFRESH DEBUG] 🔄 Starting analytics data refresh...');
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
  }, []);

  useEffect(() => {
    loadAllData();
  }, []); // Empty dependency array - only run once on mount

  return { rawData, loading, permErrors, reload: loadAllData };
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
export const processWidgetData = (widget, rawData, globalFilters = {}, comparisonOffset = 0) => {
  const { dataSource, groupBy, aggregation = 'count', filters = [], dateRange, customDateFrom, customDateTo } = widget;

  // ── Multi-source merge: dataSource can be comma-separated e.g. "activities,announcements,resources" ──
  let dataset;
  if (dataSource && dataSource.includes(',')) {
    const sources = dataSource.split(',').map(s => s.trim()).filter(Boolean);
    dataset = sources.flatMap(src => (rawData[src] || []).map(item => ({ ...item, _source: src })));
  } else {
    dataset = (rawData[dataSource] || []).map(item => ({ ...item, _source: dataSource }));
  }

  // DEBUG: Log widget processing start
  console.log(`[WIDGET DEBUG] 🎯 Processing widget: ${widget.title || 'Untitled'}`);
  console.log(`[WIDGET DEBUG] 📋 Widget config:`, { dataSource, groupBy, aggregation, dateRange, customDateFrom, customDateTo });
  console.log(`[WIDGET DEBUG] 🔽 Global filters:`, globalFilters);
  console.log(`[WIDGET DEBUG] 📊 Raw data count:`, dataset.length, 'records');
  
  // DEBUG: Show available data sources
  const availableSources = Object.keys(rawData).filter(key => rawData[key] && rawData[key].length > 0);
  console.log(`[WIDGET DEBUG] 📚 Available data sources with data:`, availableSources);
  
  // DEBUG: Show all status values for attendance
  if (dataSource === 'attendance' && dataset.length > 0) {
    const allStatuses = [...new Set(dataset.map(item => item.status))].filter(Boolean);
    console.log(`[WIDGET DEBUG] 📋 ALL status values found:`, allStatuses);
    
    // Check specifically for human_case variations
    const humanCaseVariations = ['human_case', 'human case', 'humanCase', 'Human Case', 'HUMAN_CASE'];
    const foundHumanCases = dataset.filter(item => 
      humanCaseVariations.some(variation => 
        item.status && item.status.toLowerCase().includes(variation.toLowerCase())
      )
    );
    if (foundHumanCases.length > 0) {
      console.log(`[WIDGET DEBUG] 🚨 Found human case records:`, foundHumanCases.length, foundHumanCases);
    } else {
      console.log(`[WIDGET DEBUG] ❌ No human case records found in dataset`);
    }
    
    // Show sample records with their status
    console.log(`[WIDGET DEBUG] 📝 Sample attendance records with status:`, 
      dataset.slice(0, 5).map(item => ({ id: item.id, status: item.status, date: item.date }))
    );
  }


  // DEBUG: Show all activity types for activities
  if (dataSource && (dataSource.includes('activities') || dataSource.includes('announcements') || dataSource.includes('resources')) && dataset.length > 0) {
    const allTypes = [...new Set(dataset.map(item => item.type))].filter(Boolean);
    console.log(`[WIDGET DEBUG] 📋 ALL activity types found in activities collection:`, allTypes);
    
    // Check specifically for announcement and resource variations
    const announcementVariations = ['announcement', 'announcements', 'Announcement', 'Announcements', 'ANNOUNCEMENT'];
    const resourceVariations = ['resource', 'resources', 'Resource', 'Resources', 'RESOURCE'];
    
    const foundAnnouncements = dataset.filter(item => 
      announcementVariations.some(variation => 
        item.type && item.type.toLowerCase().includes(variation.toLowerCase())
      )
    );
    const foundResources = dataset.filter(item => 
      resourceVariations.some(variation => 
        item.type && item.type.toLowerCase().includes(variation.toLowerCase())
      )
    );
    
    console.log(`[WIDGET DEBUG] 📢 Found announcements in activities:`, foundAnnouncements.length, foundAnnouncements);
    console.log(`[WIDGET DEBUG] 📚 Found resources in activities:`, foundResources.length, foundResources);
    
    // Check specifically for missing activity types using official constants
    const expectedTypes = [
      ACTIVITY_TYPES.QUIZ,
      ACTIVITY_TYPES.HOMEWORK,
      ACTIVITY_TYPES.TRAINING,
      ACTIVITY_TYPES.LAB_AND_PROJECT,
      ACTIVITY_TYPES.MID_EXAM,
      ACTIVITY_TYPES.FINAL_EXAM,
      'announcement',
      'resource'
    ];
    const missingTypes = expectedTypes.filter(type => !allTypes.includes(type));
    if (missingTypes.length > 0) {
      console.log(`[WIDGET DEBUG] ❌ Missing expected activity types:`, missingTypes);
    }
    
    // Count by type
    const typeCounts = {};
    dataset.forEach(item => {
      const type = item.type || 'unknown';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    console.log(`[WIDGET DEBUG] 📊 Type distribution:`, typeCounts);
    
    // Show sample records with their type
    console.log(`[WIDGET DEBUG] 📝 Sample activity records with type:`, 
      dataset.slice(0, 10).map(item => ({ 
        id: item.id, 
        type: item.type, 
        title: item.title || item.name || 'No title',
        description: item.description ? item.description.substring(0, 50) + '...' : 'No description'
      }))
    );
  }

  // Guard clause: if groupBy is empty, return empty data to prevent infinite loops
  if (!groupBy || groupBy.trim() === '') {
    console.warn('[processWidgetData] Empty groupBy provided, returning empty data');
    return [];
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

  // DEBUG: Log after global filters
  console.log(`[WIDGET DEBUG] 🔽 After global filters:`, dataset.length, 'records');

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
      
      // DEBUG: Log date filtering details
      console.log(`[WIDGET DEBUG] 📅 Date filtering:`, {
        dateRange,
        rangeMs,
        cutoff: new Date(cutoff).toLocaleDateString(),
        upperBound: new Date(upperBound).toLocaleDateString()
      });
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
    
    // DEBUG: Log date filtering results
    console.log(`[WIDGET DEBUG] 📅 After date filtering:`, beforeDateFilter, '->', dataset.length, 'records');
    if (dataSource === 'attendance' && dataset.length > 0) {
      const statusCounts = {};
      dataset.forEach(item => {
        const status = item.status || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      console.log(`[WIDGET DEBUG] 📊 Attendance status after filtering:`, statusCounts);
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
        const cls = (rawData.classes || []).find(c => (c.id || c.docId) === cId);
        if (cls?.programId) pId = cls.programId;
      }
      if (pId === 'Unknown' && sId) {
        const sub = (rawData.subjects || []).find(s => (s.id || s.docId) === sId);
        if (sub?.programId) pId = sub.programId;
      }
      const prog = (rawData.programs || []).find(p => (p.id || p.docId) === pId);
      return prog ? (prog.name_en || prog.name || prog.code || pId) : pId;
    }
    if (groupBy === 'subjectId' || groupBy === 'subject') {
      const sId = item.subjectId || item.subject || item.subject_id || 'Unknown';
      const sub = (rawData.subjects || []).find(s => (s.id || s.docId) === sId);
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
      // Map attendance status to proper labels
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
        'closed': 'Closed', // For session status
        'open': 'Open',
        'active': 'Active'
      };
      return statusMap[status] || status;
    }
    if (groupBy === 'absenceType' || (dataSource === 'absences' && groupBy === 'type')) {
      const at = item.type || 'Unknown';
      return ABSENCE_TYPES.find(a => a.id === at)?.label_en || at;
    }
    if (groupBy === 'status' && dataSource === 'attendance') {
      let s = item.status || 'unknown';
      if (s === 'absent') s = ATTENDANCE_STATUS.ABSENT_NO_EXCUSE;
      if (s === 'excused') s = ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE;
      return s;
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
      // For items from announcements/resources collections that may not have a type field,
      // fall back to their source collection name as the type label
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
        'activity': 'Activity'
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
    return { label, value: typeof finalValue === 'number' ? parseFloat(finalValue.toFixed(2)) : finalValue };
  });

  chartData.sort((a, b) => b.value - a.value);
  
  // DEBUG: Log final results
  console.log(`[WIDGET DEBUG] 🎉 Final chart data:`, chartData);
  console.log(`[WIDGET DEBUG] 📈 Grouped data:`, grouped);
  
  return chartData;
};

export default useAnalyticsData;
