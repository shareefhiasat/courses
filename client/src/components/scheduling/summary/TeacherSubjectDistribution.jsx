import React from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { Card, CardBody } from '@ui';

function ListCard({ title, items, labelFn, countKey = 'sessionCount' }) {
  const { theme } = useTheme();
  const border = theme === 'dark' ? '#374151' : '#e5e7eb';
  const muted = theme === 'dark' ? '#9ca3af' : '#6b7280';

  return (
    <Card>
      <CardBody>
        <h4 style={{ fontSize: 'var(--font-size-md)', fontWeight: 500, marginBottom: '0.75rem' }}>{title}</h4>
        {!items?.length ? (
          <p style={{ color: muted, fontSize: 'var(--font-size-sm)' }}>—</p>
        ) : (
          items.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', borderBottom: `1px solid ${border}`, fontSize: 'var(--font-size-sm)' }}>
              <span>{labelFn(item)}</span>
              <span style={{ fontWeight: 500 }}>{item[countKey] ?? item.count}</span>
            </div>
          ))
        )}
      </CardBody>
    </Card>
  );
}

export default function TeacherSubjectDistribution({ effort }) {
  const { t, isRTL } = useLang();

  if (!effort) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
      <ListCard
        title={t('subject_distribution') || 'Subject Distribution'}
        items={effort.subjectDistribution}
        labelFn={(item) => (isRTL ? item.subjectNameAr : item.subjectNameEn)}
      />
      <ListCard
        title={t('break_type_distribution') || 'Break Distribution'}
        items={effort.breakByType}
        labelFn={(item) => t(`break_type_${item.breakType}`) || item.breakType}
        countKey="count"
      />
      <ListCard
        title={t('classroom_utilization') || 'Classroom Utilization'}
        items={effort.classroomUtilization}
        labelFn={(item) => item.classroom?.nameEn || '—'}
      />
    </div>
  );
}
