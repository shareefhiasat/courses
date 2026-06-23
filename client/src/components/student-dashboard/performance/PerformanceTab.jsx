import React, { useMemo, memo } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { BarChart3, ClipboardList } from 'lucide-react';
import CollapsibleSection from '@components/scheduling/CollapsibleSection';
import PerformanceAnalytics from './PerformanceAnalytics';
import AttendanceTab from '../attendance/AttendanceTab';

/**
 * Performance Tab — analytics widgets on top + existing attendance/history below.
 * Renamed from "Attendance" to "Performance" to reflect the broader analytics scope.
 */
const PerformanceTab = memo(({
  studentId,
  classId,
  attendance,
  participations,
  penalties,
  behaviors,
  students,
  canInlineEdit,
  canDeleteRecords,
  onRefresh,
  t,
  lang,
  // Analytics props
  dashData,
  lookupData,
  isRTL,
  lastUpdatedAt,
}) => {
  const { theme } = useTheme();
  const { t: tFn } = useLang();

  const summaryText = useMemo(() => {
    const att = attendance?.length || 0;
    const pen = penalties?.length || 0;
    const beh = behaviors?.length || 0;
    const par = participations?.length || 0;
    return `${att} ${tFn('attendance') || 'attendance'} · ${pen} ${tFn('penalties') || 'penalties'} · ${beh} ${tFn('behaviors') || 'behaviors'} · ${par} ${tFn('participations') || 'participations'}`;
  }, [attendance, penalties, behaviors, participations, tFn]);

  return (
    <div>
      <CollapsibleSection
        title={t('performance_analytics') || (lang === 'ar' ? 'تحليلات الأداء' : 'Performance Analytics')}
        summary={summaryText}
        icon={BarChart3}
        defaultOpen
        testId="performance-analytics-section"
      >
        <PerformanceAnalytics
          dashData={dashData}
          lookupData={lookupData}
          isRTL={isRTL}
          onReload={onRefresh}
          lastUpdatedAt={lastUpdatedAt}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title={t('attendance_history') || (lang === 'ar' ? 'سجل الحضور' : 'Attendance History')}
        summary={`${attendance?.length || 0} ${tFn('records') || 'records'}`}
        icon={ClipboardList}
        defaultOpen={false}
        testId="attendance-history-section"
      >
        <AttendanceTab
          studentId={studentId}
          classId={classId}
          attendance={attendance}
          participations={participations}
          penalties={penalties}
          behaviors={behaviors}
          students={students}
          canInlineEdit={canInlineEdit}
          canDeleteRecords={canDeleteRecords}
          onRefresh={onRefresh}
          t={t}
          lang={lang}
        />
      </CollapsibleSection>
    </div>
  );
});

PerformanceTab.displayName = 'PerformanceTab';
export default PerformanceTab;
