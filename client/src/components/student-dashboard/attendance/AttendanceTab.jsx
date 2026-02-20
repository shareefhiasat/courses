import React, { useState, useMemo, useCallback } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { Badge, EmptyState, Button } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import { StudentRosterHistory } from '@components/ui/history';
import useStudentAttendanceActions from '@hooks/useStudentAttendanceActions';
import styles from './AttendanceTab.module.css';

/**
 * Attendance Tab – shows attendance history with inline editing for staff.
 * Reuses StudentRosterHistory, HistoryDayHeader, HistorySection from history components.
 */
const AttendanceTab = React.memo(({
  studentId,
  classId,
  attendance = [],
  participations = [],
  penalties = [],
  behaviors = [],
  canInlineEdit = false,
  canDeleteRecords = false,
  onRefresh,
  t,
  lang,
}) => {
  const { theme } = useTheme();
  const [activeFilters, setActiveFilters] = useState(['attendance', 'participation', 'behavior', 'penalty']);
  const [expandedDays, setExpandedDays] = useState({});
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  const actions = useStudentAttendanceActions({
    classId,
    selectedDate,
    onRefresh,
  });

  // Merge all log types for the history component
  const studentHistory = useMemo(() => ({
    attendance,
    participations,
    penalties,
    behaviors,
  }), [attendance, participations, penalties, behaviors]);

  // Group logs by date for the history component
  const groupedLogs = useMemo(() => {
    const allLogs = [
      ...attendance.map(a => ({ ...a, logType: 'attendance', date: a.date || a.timestamp })),
      ...participations.map(p => ({ ...p, logType: 'participation', date: p.date || p.timestamp })),
      ...penalties.map(p => ({ ...p, logType: 'penalty', date: p.date || p.timestamp })),
      ...behaviors.map(b => ({ ...b, logType: 'behavior', date: b.date || b.timestamp })),
    ];

    const dayMap = new Map();
    allLogs.forEach(log => {
      const dateKey = typeof log.date === 'string'
        ? log.date.split('T')[0]
        : log.date?.toDate?.()?.toISOString?.()?.split('T')[0] || 'unknown';
      if (!dayMap.has(dateKey)) {
        dayMap.set(dateKey, {
          date: dateKey,
          attendance: [],
          participations: [],
          penalties: [],
          behaviors: [],
        });
      }
      const day = dayMap.get(dateKey);
      if (log.logType === 'attendance') day.attendance.push(log);
      else if (log.logType === 'participation') day.participations.push(log);
      else if (log.logType === 'penalty') day.penalties.push(log);
      else if (log.logType === 'behavior') day.behaviors.push(log);
    });

    return Array.from(dayMap.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, data]) => ({ date, ...data }));
  }, [attendance, participations, penalties, behaviors]);

  const toggleFilter = useCallback((filter) => {
    setActiveFilters(prev =>
      prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
    );
  }, []);

  const toggleDay = useCallback((dateKey) => {
    setExpandedDays(prev => ({ ...prev, [dateKey]: !prev[dateKey] }));
  }, []);

  const expandAll = useCallback(() => {
    const all = {};
    groupedLogs.forEach(d => { all[d.date] = true; });
    setExpandedDays(all);
  }, [groupedLogs]);

  const collapseAll = useCallback(() => setExpandedDays({}), []);

  // Attendance stats summary
  const stats = useMemo(() => {
    const total = attendance.length;
    const present = attendance.filter(a => a.status === 'present').length;
    const late = attendance.filter(a => a.status === 'late').length;
    const absent = attendance.filter(a =>
      a.status === 'absent_no_excuse' || a.status === 'absent'
    ).length;
    const excused = attendance.filter(a =>
      a.status === 'absent_with_excuse' || a.status === 'excused_leave' || a.status === 'human_case'
    ).length;
    const rate = total > 0 ? ((present + late) / total) * 100 : 0;
    return { total, present, late, absent, excused, rate };
  }, [attendance]);

  // Delete handlers passed to history components
  const handleDeleteEntry = useCallback(async (entry) => {
    if (!canDeleteRecords) return;
    const { logType, id } = entry;
    if (logType === 'attendance') await actions.handleDeleteAttendance(studentId, id);
    else if (logType === 'participation') await actions.handleDeleteParticipation(studentId, id);
    else if (logType === 'penalty') await actions.handleDeletePenalty(studentId, id);
    else if (logType === 'behavior') await actions.handleDeleteBehavior(studentId, id);
  }, [canDeleteRecords, actions, studentId]);

  const filterLabels = {
    attendance: t('attendance') || 'Attendance',
    participation: t('participations') || 'Participations',
    penalty: t('penalties') || 'Penalties',
    behavior: t('behaviors') || 'Behaviors',
  };

  const filterColors = {
    attendance: 'info',
    participation: 'success',
    penalty: 'danger',
    behavior: 'warning',
  };

  if (groupedLogs.length === 0 && !canInlineEdit) {
    return (
      <EmptyState
        title={lang === 'ar' ? 'لا توجد سجلات حضور' : 'No attendance records found'}
      />
    );
  }

  return (
    <div className={styles.container}>
      {/* Stats summary bar */}
      <div className={styles.statsBar}>
        <div className={styles.statChip} data-type="present">
          {getThemedIcon('ui', 'check_circle', 14, theme)}
          <span>{t('present') || 'Present'}</span>
          <strong>{stats.present}</strong>
        </div>
        <div className={styles.statChip} data-type="late">
          {getThemedIcon('ui', 'clock', 14, theme)}
          <span>{t('late') || 'Late'}</span>
          <strong>{stats.late}</strong>
        </div>
        <div className={styles.statChip} data-type="absent">
          {getThemedIcon('ui', 'x_circle', 14, theme)}
          <span>{t('absent') || 'Absent'}</span>
          <strong>{stats.absent}</strong>
        </div>
        <div className={styles.statChip} data-type="excused">
          {getThemedIcon('ui', 'shield', 14, theme)}
          <span>{t('excused') || 'Excused'}</span>
          <strong>{stats.excused}</strong>
        </div>
        <div className={styles.statChip} data-type="rate">
          {getThemedIcon('ui', 'bar_chart_2', 14, theme)}
          <span>{t('rate') || 'Rate'}</span>
          <strong>{stats.rate.toFixed(1)}%</strong>
        </div>
      </div>

      {/* Inline edit: date selector for staff */}
      {canInlineEdit && (
        <div className={styles.editBar}>
          <label className={styles.dateLabel}>
            {getThemedIcon('ui', 'calendar', 14, theme)}
            {t('select_date') || 'Select Date'}
          </label>
          <input
            type="date"
            className={styles.dateInput}
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
          />
        </div>
      )}

      {/* Filter chips */}
      <div className={styles.filterRow}>
        {Object.entries(filterLabels).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`${styles.filterChip} ${activeFilters.includes(key) ? styles.filterActive : ''}`}
            onClick={() => toggleFilter(key)}
            data-type={key}
          >
            {label}
          </button>
        ))}

        <div className={styles.expandControls}>
          <Button variant="ghost" size="sm" onClick={expandAll}>
            {lang === 'ar' ? 'توسيع الكل' : 'Expand All'}
          </Button>
          <Button variant="ghost" size="sm" onClick={collapseAll}>
            {lang === 'ar' ? 'طي الكل' : 'Collapse All'}
          </Button>
        </div>
      </div>

      {/* History list */}
      {groupedLogs.length === 0 ? (
        <EmptyState
          title={lang === 'ar' ? 'لا توجد سجلات' : 'No records found'}
        />
      ) : (
        <StudentRosterHistory
          student={{ id: studentId }}
          studentHistory={studentHistory}
          expandedDays={expandedDays}
          activeFilters={activeFilters}
          onToggleDay={toggleDay}
          onDeleteEntry={canDeleteRecords ? handleDeleteEntry : undefined}
          showDeleteButton={canDeleteRecords}
        />
      )}
    </div>
  );
});

AttendanceTab.displayName = 'AttendanceTab';
export default AttendanceTab;
