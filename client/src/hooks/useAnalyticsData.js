import { useState, useEffect, useCallback } from 'react';
import { getDocs, collection, query, orderBy } from 'firebase/firestore';
import { db } from '@services/other/config';
import { getPrograms, getSubjects } from '@services/business/programService';
import { ATTENDANCE_STATUS } from '@constants/attendanceTypes';
import { PENALTY_TYPES } from '@constants/penaltyTypes';
import { ABSENCE_TYPES } from '@constants/absenceTypes';
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
  studentMarks: []
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
    setLoading(true);
    const errors = {};
    const next = { ...EMPTY_RAW };

    const safeLoad = async (key, loader) => {
      try {
        const snap = await loader();
        next[key] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch (e) {
        const code = (e?.code || e?.message || '').toString();
        if (code.includes('permission-denied')) errors[key] = 'permission-denied';
        logger.warn(`[useAnalyticsData] failed to load ${key}:`, e);
      }
    };

    await Promise.all([
      safeLoad('activities', () => getDocs(collection(db, 'activities'))),
      safeLoad('submissions', () => getDocs(collection(db, 'submissions'))),
      safeLoad('users', () => getDocs(collection(db, 'users'))),
      safeLoad('classes', () => getDocs(collection(db, 'classes'))),
      safeLoad('attendance', () => getDocs(collection(db, 'attendanceSessions'))),
      safeLoad('activityLogs', () => getDocs(query(collection(db, 'activityLogs'), orderBy('when', 'desc')))),
      safeLoad('enrollments', () => getDocs(collection(db, 'enrollments'))),
      safeLoad('quizzes', () => getDocs(collection(db, 'quizzes'))),
      safeLoad('quizSubmissions', () => getDocs(collection(db, 'quizSubmissions'))),
      safeLoad('notifications', () => getDocs(query(collection(db, 'notifications'), orderBy('createdAt', 'desc')))),
      safeLoad('emailLogs', () => getDocs(query(collection(db, 'emailLogs'), orderBy('timestamp', 'desc')))),
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
      safeLoad('studentMarks', () => getDocs(collection(db, 'studentMarks')))
    ]);

    setRawData(next);
    setPermErrors(errors);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

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
  let dataset = rawData[dataSource] || [];

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
    dataset = dataset.filter(item => {
      const ts =
        item.when?.seconds ? item.when.seconds * 1000 :
        item.createdAt?.seconds ? item.createdAt.seconds * 1000 :
        item.submittedAt?.seconds ? item.submittedAt.seconds * 1000 : 0;
      return ts >= cutoff && ts < upperBound;
    });
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
  return chartData;
};

export default useAnalyticsData;
