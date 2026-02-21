import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { EmptyState } from '@ui';
import { StudentRosterHistory } from '@components/ui/history';
import useStudentAttendanceActions from '@hooks/useStudentAttendanceActions';
import { PARTICIPATION_TYPES, BEHAVIOR_TYPES, PENALTY_TYPES } from '@constants';
import logger from '@utils/logger';
import styles from './AttendanceTab.module.css';
import { getThemedIcon } from '@constants/iconTypes';

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
  canDeleteRecords = false,
  onRefresh,
  t,
  lang,
  studentName,
}) => {
  const isRTL = lang === 'ar';

  const [activeFilters, setActiveFilters] = useState({
    attendance: true, participation: true, behavior: true, penalties: true,
  });
  const [expandedDays, setExpandedDays] = useState(() => new Map());
  const [expandedSections, setExpandedSections] = useState({
    participation: false, behavior: false, penalty: false,
  });

  useEffect(() => {
    logger.log('[AttendanceTab] Data received:', {
      studentId, classId,
      attendanceCount: attendance.length,
      participationsCount: participations.length,
      penaltiesCount: penalties.length,
      behaviorsCount: behaviors.length,
    });
  }, [studentId, classId, attendance, participations, penalties, behaviors]);

  const actions = useStudentAttendanceActions({ classId, onRefresh });

  const stats = useMemo(() => {
    const present = attendance.filter(a => a.status === 'present').length;
    const late = attendance.filter(a => a.status === 'late').length;
    const absentNoExcuse = attendance.filter(a => a.status === 'absent_no_excuse' || a.status === 'absent').length;
    const absentWithExcuse = attendance.filter(a => a.status === 'absent_with_excuse').length;
    const excusedLeave = attendance.filter(a => a.status === 'excused_leave').length;
    const humanCase = attendance.filter(a => a.status === 'human_case').length;
    const penaltyPoints = penalties.reduce((s, p) => s + (p.points || 0), 0);
    const behaviorPoints = behaviors.reduce((s, b) => s + (b.points || 0), 0);
    const participationPoints = participations.reduce((s, p) => s + (p.points || 0), 0);
    return {
      present, late, absentNoExcuse, absentWithExcuse, excusedLeave, humanCase,
      penaltyCount: penalties.length, penaltyPoints,
      behaviorPoints, behaviorCount: behaviors.length,
      participationPoints, participationCount: participations.length,
    };
  }, [attendance, penalties, behaviors, participations]);

  // Per-type breakdown for expandable sections (images 4 & 5 style — all types shown, even zero)
  const typeBreakdown = useMemo(() => {
    const participationBreakdown = PARTICIPATION_TYPES.map(pt => {
      const matching = participations.filter(p => p.type === pt.id);
      return {
        id: pt.id,
        label: lang === 'ar' ? pt.label_ar : pt.label_en,
        total: matching.reduce((s, p) => s + (p.points || 0), 0),
        count: matching.length,
        hasEntries: matching.length > 0,
      };
    });

    const behaviorBreakdown = BEHAVIOR_TYPES.map(bt => {
      const matching = behaviors.filter(b => b.type === bt.id);
      return {
        id: bt.id,
        label: lang === 'ar' ? bt.label_ar : bt.label_en,
        total: matching.reduce((s, b) => s + (b.points || 0), 0),
        count: matching.length,
        hasEntries: matching.length > 0,
      };
    });
    // Add behavior total row
    const behaviorPoints = behaviors.reduce((s, b) => s + (b.points || 0), 0);
    const behaviorCount = behaviors.length;
    behaviorBreakdown.push({
      id: '__total__',
      label: t('behavior') || 'Behavior',
      total: behaviorPoints,
      count: behaviorCount,
      hasEntries: behaviorCount > 0,
      isTotal: true,
    });

    const penaltyBreakdown = PENALTY_TYPES.map(pt => {
      const matching = penalties.filter(p => p.type === pt.id);
      return {
        id: pt.id,
        label: lang === 'ar' ? pt.label_ar : pt.label_en,
        total: matching.reduce((s, p) => s + (p.points || 0), 0),
        count: matching.length,
        hasEntries: matching.length > 0,
      };
    });

    return { participationBreakdown, behaviorBreakdown, penaltyBreakdown };
  }, [participations, behaviors, penalties, lang, t]);

  const groupedLogs = useMemo(() => {
    logger.log('🔧 AttendanceTab - processing logs:', {
      attendanceCount: attendance.length,
      participationsCount: participations.length,
      penaltiesCount: penalties.length,
      behaviorsCount: behaviors.length,
      studentId
    });

    // Log raw data samples
    if (attendance.length > 0) {
      logger.log('🔧 AttendanceTab - raw attendance sample:', attendance.slice(0, 2).map(a => ({
        id: a.id,
        time: a.time,
        timestamp: a.timestamp,
        date: a.date,
        status: a.status,
        timeType: typeof a.time,
        timestampType: typeof a.timestamp
      })));
    }
    if (participations.length > 0) {
      logger.log('🔧 AttendanceTab - raw participation sample:', participations.slice(0, 2).map(p => ({
        id: p.id,
        time: p.time,
        timestamp: p.timestamp,
        date: p.date,
        timeType: typeof p.time,
        timestampType: typeof p.timestamp
      })));
    }

    const allLogs = [
      ...attendance.map(a => ({ ...a, logType: 'attendance', time: a.time || a.timestamp })),
      ...participations.map(p => ({ ...p, logType: 'participation', time: p.time || p.timestamp })),
      ...penalties.map(p => ({ ...p, logType: 'penalty', time: p.time || p.timestamp })),
      ...behaviors.map(b => ({ ...b, logType: 'behavior', time: b.time || b.timestamp })),
    ];

    logger.log('🔧 AttendanceTab - all logs count:', allLogs.length);
    logger.log('🔧 AttendanceTab - sample logs:', allLogs.slice(0, 5).map(log => ({
      id: log.id,
      logType: log.logType,
      time: log.time,
      timeType: typeof log.time,
      hasToDate: !!log.time?.toDate,
      timestamp: log.timestamp
    })));

    const dayMap = new Map();
    allLogs.forEach((log, index) => {
      const dateObj = log.time?.toDate ? log.time.toDate() : new Date(log.time);
      const dateKey = isNaN(dateObj.getTime()) ? 'unknown' : dateObj.toISOString().split('T')[0];
      
      logger.log(`🔧 AttendanceTab - processing log ${index}:`, {
        logId: log.id,
        logType: log.logType,
        time: log.time,
        dateObj: dateObj,
        dateKey: dateKey,
        isValid: !isNaN(dateObj.getTime()),
        dateObjString: dateObj.toString()
      });
      
      if (isNaN(dateObj.getTime())) {
        logger.log('🔧 AttendanceTab - invalid date found:', {
          logId: log.id,
          logType: log.logType,
          time: log.time,
          dateObj: dateObj,
          dateKey: dateKey
        });
      }
      
      if (!dayMap.has(dateKey)) {
        dayMap.set(dateKey, { date: dateKey, attendance: [], participation: [], penalties: [], behavior: [] });
      }
      const d = dayMap.get(dateKey);
      if (log.logType === 'attendance') d.attendance.push(log);
      else if (log.logType === 'participation') d.participation.push(log);
      else if (log.logType === 'penalty') d.penalties.push(log);
      else if (log.logType === 'behavior') d.behavior.push(log);
    });
    
    const result = Array.from(dayMap.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([, data]) => data);
    
    logger.log('🔧 AttendanceTab - grouped logs result:', result.map(group => ({
      date: group.date,
      attendance: group.attendance.length,
      participation: group.participation.length,
      penalties: group.penalties.length,
      behavior: group.behavior.length,
      totalEntries: group.attendance.length + group.participation.length + group.penalties.length + group.behavior.length
    })));
    
    return result;
  }, [attendance, participations, penalties, behaviors, studentId]);

  const toggleFilter = useCallback((filter) => {
    setActiveFilters(prev => ({ ...prev, [filter]: !prev[filter] }));
  }, []);

  const toggleDay = useCallback((dateKey) => {
    setExpandedDays(prev => {
      const m = new Map(prev);
      if (m.has(dateKey)) m.delete(dateKey);
      else m.set(dateKey, true);
      return m;
    });
  }, []);

  const expandAll = useCallback(() => {
    const all = new Map();
    groupedLogs.forEach(d => all.set(d.date, true));
    setExpandedDays(all);
  }, [groupedLogs]);

  const collapseAll = useCallback(() => setExpandedDays(new Map()), []);

  const toggleSection = useCallback((section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  }, []);

  const handleDeleteAttendance = useCallback((sid, id) => { if (canDeleteRecords) actions.handleDeleteAttendance(sid, id); }, [canDeleteRecords, actions]);
  const handleDeleteParticipation = useCallback((sid, id) => { if (canDeleteRecords) actions.handleDeleteParticipation(sid, id); }, [canDeleteRecords, actions]);
  const handleDeleteBehavior = useCallback((sid, id) => { if (canDeleteRecords) actions.handleDeleteBehavior(sid, id); }, [canDeleteRecords, actions]);
  const handleDeletePenalty = useCallback((sid, id) => { if (canDeleteRecords) actions.handleDeletePenalty(sid, id); }, [canDeleteRecords, actions]);

  if (groupedLogs.length === 0) {
    return (
      <EmptyState
        title={t('attendance.no_records_found') || (lang === 'ar' ? 'لا توجد سجلات حضور' : 'No attendance records found')}
      />
    );
  }

  const SectionHeader = ({ label, bg, sectionKey, points, count }) => (
    <div onClick={() => toggleSection(sectionKey)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: bg, borderRadius: expandedSections[sectionKey] ? '0.5rem 0.5rem 0 0' : '0.5rem', cursor: 'pointer', userSelect: 'none' }}>
      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white' }}>
        {label} ({points} {t('points') || 'Points'}, {count} {t('entries') || 'entries'})
      </span>
      <span style={{ transform: expandedSections[sectionKey] ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0, display: 'inline-flex' }}>
        {getThemedIcon('ui', 'chevron_down', 16, 'white')}
      </span>
    </div>
  );

  const TypeRow = ({ item, textColor, totalBg }) => (
    <div className={styles.sectionRow} style={{ background: item.isTotal ? totalBg : (item.hasEntries ? undefined : undefined), fontWeight: item.isTotal ? 600 : 400 }}>
      <span style={{ color: textColor, flex: 1, fontSize: '0.8125rem' }}>{item.label}</span>
      <span style={{ color: item.hasEntries ? textColor : '#9ca3af', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
        {t('total') || 'Total'}: {item.total >= 0 ? '+' : ''}{item.total}&nbsp;&nbsp;{t('count') || 'Count'}: ({item.count})
      </span>
      {item.hasEntries && canDeleteRecords && <span style={{ width: 16 }} />}
    </div>
  );

  return (
    <div className={styles.container}>
      {/* Row 1: Present / Penalty / Behavior / Participation */}
      <div className={styles.statGrid4}>
        <div style={{ padding: '0.5rem 0.25rem', background: '#16a34a', borderRadius: '0.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '3rem' }}>
          <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'white', lineHeight: 1 }}>{stats.present}</div>
          <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.92)', fontWeight: 500, marginTop: '0.2rem', lineHeight: 1.2 }}>{t('present') || 'Present'}</div>
        </div>
        <div style={{ padding: '0.5rem 0.25rem', background: '#dc2626', borderRadius: '0.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '3rem' }}>
          <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'white', lineHeight: 1 }}>{stats.penaltyCount}</div>
          <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.92)', fontWeight: 500, marginTop: '0.2rem', lineHeight: 1.2 }}>{t('penalty') || 'Penalty'}</div>
        </div>
        <div style={{ padding: '0.5rem 0.25rem', background: '#f97316', borderRadius: '0.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '3rem' }}>
          <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'white', lineHeight: 1 }}>{stats.behaviorPoints}</div>
          <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.92)', fontWeight: 500, marginTop: '0.2rem', lineHeight: 1.2 }}>{t('behavior') || 'Behavior'}</div>
        </div>
        <div style={{ padding: '0.5rem 0.25rem', background: '#3b82f6', borderRadius: '0.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '3rem' }}>
          <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'white', lineHeight: 1 }}>{stats.participationCount}</div>
          <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.92)', fontWeight: 500, marginTop: '0.2rem', lineHeight: 1.2 }}>{t('participation') || 'Participation'}</div>
        </div>
      </div>

      {/* Row 2: Late / Excused Leave / Absent(Excused) / Absent / Human Case */}
      <div className={styles.statGrid5}>
        <div style={{ padding: '0.5rem 0.25rem', background: '#eab308', borderRadius: '0.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '3rem' }}>
          <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'white', lineHeight: 1 }}>{stats.late}</div>
          <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.92)', fontWeight: 500, marginTop: '0.2rem', lineHeight: 1.2 }}>{t('late') || 'Late'}</div>
        </div>
        <div style={{ padding: '0.5rem 0.25rem', background: '#ef4444', borderRadius: '0.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '3rem' }}>
          <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'white', lineHeight: 1 }}>{stats.excusedLeave}</div>
          <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.92)', fontWeight: 500, marginTop: '0.2rem', lineHeight: 1.2 }}>{t('excused_leave') || 'Excused Leave'}</div>
        </div>
        <div style={{ padding: '0.5rem 0.25rem', background: '#ef4444', borderRadius: '0.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '3rem' }}>
          <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'white', lineHeight: 1 }}>{stats.absentWithExcuse}</div>
          <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.92)', fontWeight: 500, marginTop: '0.2rem', lineHeight: 1.2 }}>{t('absent_excused') || 'Absent (Excused)'}</div>
        </div>
        <div style={{ padding: '0.5rem 0.25rem', background: '#ef4444', borderRadius: '0.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '3rem' }}>
          <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'white', lineHeight: 1 }}>{stats.absentNoExcuse}</div>
          <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.92)', fontWeight: 500, marginTop: '0.2rem', lineHeight: 1.2 }}>{t('absent') || 'Absent'}</div>
        </div>
        <div style={{ padding: '0.5rem 0.25rem', background: '#8b5cf6', borderRadius: '0.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '3rem' }}>
          <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'white', lineHeight: 1 }}>{stats.humanCase}</div>
          <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.92)', fontWeight: 500, marginTop: '0.2rem', lineHeight: 1.2 }}>{t('human_case') || 'Human Case'}</div>
        </div>
      </div>

      {/* Expandable type-breakdown sections (images 4 & 5 style) */}
      <div className={styles.sectionsContainer}>

        {/* Participation */}
        <SectionHeader label={t('participation_details') || 'Participation Details'} bg="#3b82f6" sectionKey="participation" points={stats.participationPoints} count={stats.participationCount} />
        {expandedSections.participation && (
          <div className={styles.sectionBody} style={{ borderInlineStart: '3px solid #3b82f6', background: '#f0f7ff', borderRadius: '0 0 0.5rem 0.5rem', padding: '0.25rem 0' }}>
            {typeBreakdown.participationBreakdown.map(item => (
              <TypeRow key={item.id} item={item} textColor="#1e3a8a" totalBg="#dbeafe" />
            ))}
          </div>
        )}

        {/* Behavior */}
        <SectionHeader label={t('behavior_details') || 'Behavior Details'} bg="#f97316" sectionKey="behavior" points={stats.behaviorPoints} count={stats.behaviorCount} />
        {expandedSections.behavior && (
          <div className={styles.sectionBody} style={{ borderInlineStart: '3px solid #f97316', background: '#fff7f0', borderRadius: '0 0 0.5rem 0.5rem', padding: '0.25rem 0' }}>
            {typeBreakdown.behaviorBreakdown.map(item => (
              <TypeRow key={item.id} item={item} textColor="#9a3412" totalBg="#fed7aa" />
            ))}
          </div>
        )}

        {/* Penalty */}
        <SectionHeader label={t('penalty_details') || 'Penalty Details'} bg="#dc2626" sectionKey="penalty" points={stats.penaltyPoints} count={stats.penaltyCount} />
        {expandedSections.penalty && (
          <div className={styles.sectionBody} style={{ borderInlineStart: '3px solid #dc2626', background: '#fff5f5', borderRadius: '0 0 0.5rem 0.5rem', padding: '0.25rem 0' }}>
            {typeBreakdown.penaltyBreakdown.map(item => (
              <TypeRow key={item.id} item={item} textColor="#7f1d1d" totalBg="#fecaca" />
            ))}
          </div>
        )}
      </div>

      {/* History timeline using StudentRosterHistory (filter bar + day-grouped entries) */}
      <StudentRosterHistory
        student={{ id: studentId }}
        studentHistory={{ [studentId]: groupedLogs.flatMap(day => [
          ...day.attendance.map(a => ({ ...a, type: 'attendance', logType: 'attendance' })),
          ...day.participation.map(p => ({ ...p, type: 'participation', logType: 'participation' })),
          ...day.penalties.map(p => ({ ...p, type: 'penalty', logType: 'penalty' })),
          ...day.behavior.map(b => ({ ...b, type: 'behavior', logType: 'behavior' })),
        ]) }}
        expandedDays={expandedDays}
        activeFilters={activeFilters}
        toggleDayExpansion={toggleDay}
        expandAllDays={expandAll}
        collapseAllDays={collapseAll}
        handleDeleteAttendance={canDeleteRecords ? handleDeleteAttendance : undefined}
        handleDeleteParticipation={canDeleteRecords ? handleDeleteParticipation : undefined}
        handleDeleteBehavior={canDeleteRecords ? handleDeleteBehavior : undefined}
        handleDeletePenalty={canDeleteRecords ? handleDeletePenalty : undefined}
        t={t}
        isRTL={isRTL}
        groupLogsByDay={(logs) => {
          const grouped = {};
          logs.forEach(log => {
            const dateObj = log.time?.toDate ? log.time.toDate() : new Date(log.time);
            const dateKey = isNaN(dateObj.getTime()) ? 'unknown' : dateObj.toISOString().split('T')[0];
            if (!grouped[dateKey]) grouped[dateKey] = { date: dateKey, attendance: [], penalties: [], participation: [], behavior: [] };
            if (log.logType === 'attendance') grouped[dateKey].attendance.push(log);
            else if (log.logType === 'penalty') grouped[dateKey].penalties.push(log);
            else if (log.logType === 'participation') grouped[dateKey].participation.push(log);
            else if (log.logType === 'behavior') grouped[dateKey].behavior.push(log);
          });
          return Object.values(grouped).sort((a, b) => new Date(b.date) - new Date(a.date));
        }}
        toggleFilter={toggleFilter}
        lang={lang}
        studentName={studentName}
      />
    </div>
  );
});

AttendanceTab.displayName = 'AttendanceTab';
export default AttendanceTab;
