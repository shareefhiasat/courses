import React, { useMemo } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { Card, CardBody } from '@ui';
import BarChart from '@components/charts/BarChart';
import PieChart from '@components/charts/PieChart';
import { CalendarDays, Clock, Users, BookOpen } from 'lucide-react';

function EffortStatCard({ value, label, Icon, iconColor, iconBg, theme }) {
  const muted = theme === 'dark' ? '#9ca3af' : '#6b7280';
  return (
    <Card>
      <CardBody>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            backgroundColor: iconBg,
            borderRadius: '0.375rem',
            padding: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon size={16} color={iconColor} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 'var(--font-size-xs)', color: muted }}>{label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{value ?? 0}</div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export default function EffortReportView({ report, isRTL, hideStatCards = false }) {
  const { t } = useLang();
  const { theme } = useTheme();
  const muted = theme === 'dark' ? '#9ca3af' : '#6b7280';
  const border = theme === 'dark' ? '#374151' : '#e5e7eb';

  const teacherChartData = useMemo(() =>
    (report?.chartData?.byTeacher || []).slice(0, 10).map((d) => ({
      label: d.label,
      value: d.value,
      color: '#3b82f6',
    })),
  [report]);

  const subjectChartData = useMemo(() =>
    (report?.chartData?.bySubject || []).slice(0, 8).map((d, i) => ({
      label: d.label,
      value: d.value,
      color: ['#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#84cc16', '#6366f1'][i % 8],
    })),
  [report]);

  if (!report) return null;

  return (
    <div data-testid="effort-report-view">
      {!hideStatCards && (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { label: t('total_sessions'), value: report.totals?.sessionCount, Icon: CalendarDays, iconColor: '#3b82f6', iconBg: theme === 'dark' ? '#1e3a5f' : '#dbeafe' },
          { label: t('teaching_hours'), value: report.totals?.teachingHours, Icon: Clock, iconColor: '#10b981', iconBg: theme === 'dark' ? '#064e3b' : '#d1fae5' },
          { label: t('total_teachers'), value: report.totals?.teacherCount, Icon: Users, iconColor: '#8b5cf6', iconBg: theme === 'dark' ? '#4c1d95' : '#ede9fe' },
          { label: t('courses'), value: report.totals?.courseCount, Icon: BookOpen, iconColor: '#f59e0b', iconBg: theme === 'dark' ? '#78350f' : '#fef3c7' },
        ].map((s) => (
          <EffortStatCard key={s.label} {...s} theme={theme} />
        ))}
      </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <Card>
          <CardBody>
            <h4 style={{ marginBottom: '0.75rem' }}>{t('teacher_load_month')}</h4>
            <BarChart data={teacherChartData} size={{ width: 360, height: 220 }} horizontal />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <h4 style={{ marginBottom: '0.75rem' }}>{t('subject_distribution')}</h4>
            <PieChart data={subjectChartData} size={{ width: 280, height: 220 }} />
          </CardBody>
        </Card>
      </div>

      <Card style={{ marginBottom: '1.5rem' }}>
        <CardBody>
          <h4 style={{ marginBottom: '0.75rem' }}>{t('teacher_effort_report')}</h4>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
              <thead>
                <tr style={{ background: theme === 'dark' ? '#374151' : '#f3f4f6' }}>
                  {['instructor', 'sessions', 'teaching_hours', 'subjects', 'classes'].map((h) => (
                    <th key={h} style={{ padding: '0.5rem', textAlign: 'start', borderBottom: `1px solid ${border}` }}>
                      {t(h) || h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(report.teachers || []).map((row) => (
                  <tr key={row.instructorId}>
                    <td style={{ padding: '0.5rem', borderBottom: `1px solid ${border}` }}>
                      {isRTL ? row.instructorNameAr : row.instructorName}
                    </td>
                    <td style={{ padding: '0.5rem', borderBottom: `1px solid ${border}` }}>{row.sessionCount}</td>
                    <td style={{ padding: '0.5rem', borderBottom: `1px solid ${border}` }}>{row.teachingHours}</td>
                    <td style={{ padding: '0.5rem', borderBottom: `1px solid ${border}` }}>{row.subjectCount}</td>
                    <td style={{ padding: '0.5rem', borderBottom: `1px solid ${border}` }}>{row.classCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <Card style={{ marginBottom: '1.5rem' }}>
        <CardBody>
          <h4 style={{ marginBottom: '0.75rem' }}>{t('courses') || 'Courses'}</h4>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
              <thead>
                <tr style={{ background: theme === 'dark' ? '#374151' : '#f3f4f6' }}>
                  {[t('program'), t('subject'), t('class'), t('location'), t('capacity'), t('sessions'), t('teaching_hours')].map((h) => (
                    <th key={h} style={{ padding: '0.5rem', textAlign: 'start', borderBottom: `1px solid ${border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(report.courses || []).map((row, i) => (
                  <tr key={i}>
                    <td style={{ padding: '0.5rem', borderBottom: `1px solid ${border}` }}>
                      {isRTL ? row.program?.nameAr : row.program?.nameEn || '—'}
                    </td>
                    <td style={{ padding: '0.5rem', borderBottom: `1px solid ${border}` }}>
                      {isRTL ? row.subject?.nameAr : row.subject?.nameEn || '—'}
                    </td>
                    <td style={{ padding: '0.5rem', borderBottom: `1px solid ${border}` }}>
                      {isRTL ? row.class?.nameAr : row.class?.nameEn || '—'}
                    </td>
                    <td style={{ padding: '0.5rem', borderBottom: `1px solid ${border}` }}>{row.location || '—'}</td>
                    <td style={{ padding: '0.5rem', borderBottom: `1px solid ${border}` }}>{row.capacity ?? '—'}</td>
                    <td style={{ padding: '0.5rem', borderBottom: `1px solid ${border}` }}>{row.sessionCount}</td>
                    <td style={{ padding: '0.5rem', borderBottom: `1px solid ${border}` }}>{row.teachingHours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {report.reportFormat === 'breakdown' && report.sessions?.length > 0 && (
        <Card>
          <CardBody>
            <h4 style={{ marginBottom: '0.75rem' }}>{t('session_breakdown') || 'Session Breakdown'}</h4>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {report.sessions.map((s, i) => (
                <div key={i} style={{ padding: '0.5rem 0', borderBottom: `1px solid ${border}`, fontSize: 'var(--font-size-sm)' }}>
                  <strong>{new Date(s.date).toLocaleDateString()}</strong>
                  {' · '}{isRTL ? s.instructor?.displayNameAr : s.instructor?.displayName}
                  {' · '}{isRTL ? s.subject?.nameAr : s.subject?.nameEn || '—'}
                  {' · '}{s.timeSlot?.startTime}–{s.timeSlot?.endTime}
                  {' · '}{s.location || '—'}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
