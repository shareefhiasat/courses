import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { Badge, EmptyState, Button } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import { StudentRosterHistory } from '@components/ui/history';
import useStudentAttendanceActions from '@hooks/useStudentAttendanceActions';
import logger from '@utils/logger';
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
  const [expandedDays, setExpandedDays] = useState(() => new Map());
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState('day'); // 'day' or 'month'

  // Debug: Log what data is being passed
  useEffect(() => {
    logger.log('[AttendanceTab] Data received:', {
      studentId,
      classId,
      attendanceCount: attendance.length,
      participationsCount: participations.length,
      penaltiesCount: penalties.length,
      behaviorsCount: behaviors.length,
      canInlineEdit,
      canDeleteRecords
    });
    
    // Log first few items of each array
    if (attendance.length > 0) {
      logger.log('[AttendanceTab] Sample attendance data:', attendance.slice(0, 2));
    }
    if (participations.length > 0) {
      logger.log('[AttendanceTab] Sample participation data:', participations.slice(0, 2));
    }
    if (penalties.length > 0) {
      logger.log('[AttendanceTab] Sample penalty data:', penalties.slice(0, 2));
    }
    if (behaviors.length > 0) {
      logger.log('[AttendanceTab] Sample behavior data:', behaviors.slice(0, 2));
    }
  }, [studentId, classId, attendance, participations, penalties, behaviors, canInlineEdit, canDeleteRecords]);

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

  // Group logs by date or month based on view mode
  const groupedLogs = useMemo(() => {
    const allLogs = [
      ...attendance.map(a => ({ ...a, logType: 'attendance', date: a.date || a.timestamp })),
      ...participations.map(p => ({ ...p, logType: 'participation', date: p.date || p.timestamp })),
      ...penalties.map(p => ({ ...p, logType: 'penalty', date: p.date || p.timestamp })),
      ...behaviors.map(b => ({ ...b, logType: 'behavior', date: b.date || b.timestamp })),
    ];

    if (viewMode === 'month') {
      // Group by month for monthly view
      const monthMap = new Map();
      allLogs.forEach(log => {
        const date = new Date(log.date);
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        if (!monthMap.has(monthKey)) {
          monthMap.set(monthKey, {
            date: monthKey,
            attendance: [],
            participations: [],
            penalties: [],
            behaviors: [],
            monthName: date.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long' })
          });
        }
        const month = monthMap.get(monthKey);
        if (log.logType === 'attendance') month.attendance.push(log);
        else if (log.logType === 'participation') month.participations.push(log);
        else if (log.logType === 'penalty') month.penalties.push(log);
        else if (log.logType === 'behavior') month.behaviors.push(log);
      });
      return Array.from(monthMap.values()).sort((a, b) => new Date(b.date) - new Date(a.date));
    } else {
      // Group by day for daily view (existing logic)
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
    }
  }, [attendance, participations, penalties, behaviors, viewMode, lang]);

  const toggleFilter = useCallback((filter) => {
    setActiveFilters(prev =>
      prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
    );
  }, []);

  const toggleDay = useCallback((dateKey) => {
    setExpandedDays(prev => {
      const newMap = new Map(prev);
      if (newMap.has(dateKey)) {
        newMap.delete(dateKey);
      } else {
        newMap.set(dateKey, true);
      }
      return newMap;
    });
  }, []);

  const expandAll = useCallback(() => {
    const all = new Map();
    groupedLogs.forEach(d => { all.set(d.date, true); });
    setExpandedDays(all);
  }, [groupedLogs]);

  const collapseAll = useCallback(() => setExpandedDays(new Map()), []);

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
    attendance: t('attendance.attendance') || 'Attendance',
    participation: t('participation.participations') || 'Participations',
    penalty: t('penalty.penalties') || 'Penalties',
    behavior: t('behavior.behaviors') || 'Behaviors',
  };

  const filterColors = {
    attendance: 'info',
    participation: 'success',
    penalty: 'danger',
    behavior: 'warning',
  };

  if (groupedLogs.length === 0 && !canInlineEdit) {
    return (
      <div>
        <EmptyState
          title={t('attendance.no_records_found') || (lang === 'ar' ? 'لا توجد سجلات حضور' : 'No attendance records found')}
        />
        {/* Debug info for development */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: '#fef2f2', border: '1px solid #ef4444', borderRadius: '8px', fontSize: '0.8rem' }}>
            <strong>Debug - Attendance Tab:</strong><br/>
          Student ID: {studentId || 'None'}<br/>
          Class ID: {classId || 'None'}<br/>
          Attendance Count: {attendance.length}<br/>
          Participations Count: {participations.length}<br/>
          Penalties Count: {penalties.length}<br/>
          Behaviors Count: {behaviors.length}<br/>
          Grouped Logs: {groupedLogs.length}<br/>
          Can Inline Edit: {canInlineEdit ? 'Yes' : 'No'}<br/>
          <details style={{ marginTop: '0.5rem' }}>
            <summary style={{ cursor: 'pointer', fontSize: '0.7rem' }}>View Raw Data</summary>
            <pre style={{ fontSize: '0.6rem', background: '#f8fafc', padding: '0.5rem', borderRadius: '4px', marginTop: '0.25rem' }}>
              {JSON.stringify({
                studentId,
                classId,
                attendance: attendance.slice(0, 2),
                participations: participations.slice(0, 2),
                penalties: penalties.slice(0, 2),
                behaviors: behaviors.slice(0, 2)
              }, null, 2)}
            </pre>
          </details>
        </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Stats summary bar */}
      <div className={styles.statsBar}>
        <div className={styles.statChip} data-type="present">
          {getThemedIcon('ui', 'check_circle', 14, theme)}
          <span>{t('attendance.present') || 'Present'}</span>
          <strong>{stats.present}</strong>
        </div>
        <div className={styles.statChip} data-type="late">
          {getThemedIcon('ui', 'clock', 14, theme)}
          <span>{t('attendance.late') || 'Late'}</span>
          <strong>{stats.late}</strong>
        </div>
        <div className={styles.statChip} data-type="absent">
          {getThemedIcon('ui', 'x_circle', 14, theme)}
          <span>{t('attendance.absent') || 'Absent'}</span>
          <strong>{stats.absent}</strong>
        </div>
        <div className={styles.statChip} data-type="excused">
          {getThemedIcon('ui', 'shield', 14, theme)}
          <span>{t('attendance.excused') || 'Excused'}</span>
          <strong>{stats.excused}</strong>
        </div>
        <div className={styles.statChip} data-type="rate">
          {getThemedIcon('ui', 'bar_chart_2', 14, theme)}
          <span>{t('attendance.rate') || 'Rate'}</span>
          <strong>{stats.rate.toFixed(1)}%</strong>
        </div>
      </div>

      {/* View mode toggle */}
      <div className={styles.viewModeToggle}>
        <Button
          variant={viewMode === 'day' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('day')}
        >
          {getThemedIcon('ui', 'calendar', 14, theme)}
          {t('attendance.view_by_day') || 'View by Day'}
        </Button>
        <Button
          variant={viewMode === 'month' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('month')}
        >
          {getThemedIcon('ui', 'calendar', 14, theme)}
          {t('attendance.view_by_month') || 'View by Month'}
        </Button>
      </div>

      {/* Inline edit: date selector for staff */}
      {canInlineEdit && (
        <div className={styles.editBar}>
          <label className={styles.dateLabel}>
            {getThemedIcon('ui', 'calendar', 14, theme)}
            {t('attendance.select_date') || 'Select Date'}
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
            {t('attendance.expand_all') || (lang === 'ar' ? 'توسيع الكل' : 'Expand All')}
          </Button>
          <Button variant="ghost" size="sm" onClick={collapseAll}>
            {t('attendance.collapse_all')}
          </Button>
        </div>
      </div>

      {/* History list */}
      {groupedLogs.length === 0 ? (
        <EmptyState
          title={t('attendance.no_records') || (lang === 'ar' ? 'لا توجد سجلات' : 'No records found')}
        />
      ) : (
        <StudentRosterHistory
          student={{ id: studentId }}
          studentHistory={{ [studentId]: groupedLogs.flatMap(day => [
            ...day.attendance.map(a => ({ ...a, type: 'attendance', logType: 'attendance' })),
            ...day.participations.map(p => ({ ...p, type: 'participation', logType: 'participation' })),
            ...day.penalties.map(p => ({ ...p, type: 'penalty', logType: 'penalty' })),
            ...day.behaviors.map(b => ({ ...b, type: 'behavior', logType: 'behavior' }))
          ]) }}
          expandedDays={expandedDays}
          activeFilters={activeFilters}
          toggleDayExpansion={toggleDay}
          expandAllDays={expandAll}
          collapseAllDays={collapseAll}
          handleDeleteAttendance={canDeleteRecords ? (studentId, entryId) => handleDeleteEntry({ logType: 'attendance', id: entryId }) : undefined}
          handleDeleteParticipation={canDeleteRecords ? (studentId, entryId) => handleDeleteEntry({ logType: 'participation', id: entryId }) : undefined}
          handleDeleteBehavior={canDeleteRecords ? (studentId, entryId) => handleDeleteEntry({ logType: 'behavior', id: entryId }) : undefined}
          handleDeletePenalty={canDeleteRecords ? (studentId, entryId) => handleDeleteEntry({ logType: 'penalty', id: entryId }) : undefined}
          t={t}
          isRTL={lang === 'ar'}
          groupLogsByDay={(logs) => {
            const grouped = {};

            logs.forEach(log => {
              const date = log.date;
              if (!grouped[date]) {
                grouped[date] = {
                  date: date,
                  attendance: [],
                  penalties: [],
                  participation: [],
                  behavior: []
                };
              }

              if (log.logType === 'attendance') {
                grouped[date].attendance.push(log);
              } else if (log.logType === 'penalty') {
                grouped[date].penalties.push(log);
              } else if (log.logType === 'participation') {
                grouped[date].participation.push(log);
              } else if (log.logType === 'behavior') {
                grouped[date].behavior.push(log);
              } else if (log.points > 0) {
                // Fallback for older records
                grouped[date].participation.push(log);
              } else if (log.points < 0) {
                // Fallback for older records
                grouped[date].penalties.push(log);
              }
            });

            // Sort each array by time (newest first)
            Object.keys(grouped).forEach(date => {
              grouped[date].attendance.sort((a, b) => {
                const timeA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
                const timeB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
                return timeB - timeA;
              });
              grouped[date].penalties.sort((a, b) => {
                const timeA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
                const timeB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
                return timeB - timeA;
              });
              grouped[date].participation.sort((a, b) => {
                const timeA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
                const timeB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
                return timeB - timeA;
              });
              grouped[date].behavior.sort((a, b) => {
                const timeA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
                const timeB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
                return timeB - timeA;
              });
            });

            return Object.values(grouped).sort((a, b) => {
              // Sort days by date (newest first)
              return new Date(b.date) - new Date(a.date);
            });
          }}
          toggleFilter={toggleFilter}
          lang={lang}
        />
      )}
    </div>
  );
});

AttendanceTab.displayName = 'AttendanceTab';
export default AttendanceTab;
