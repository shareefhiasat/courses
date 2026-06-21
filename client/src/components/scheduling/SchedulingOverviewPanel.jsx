import React, { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import CollapsibleSection from './CollapsibleSection';
import SchedulingStatCard from './SchedulingStatCard';
import { buildOverviewSummary } from '@utils/schedulingOverviewCards';

export default function SchedulingOverviewPanel({
  title,
  stats,
  cards,
  defaultOpen = false,
  actions,
  testId = 'scheduling-overview-panel',
}) {
  const { t } = useLang();
  const { theme } = useTheme();

  const summary = useMemo(() => buildOverviewSummary(stats || {}, t), [stats, t]);

  return (
    <CollapsibleSection
      title={title || t('scheduling_overview')}
      summary={summary}
      icon={BarChart3}
      defaultOpen={defaultOpen}
      actions={actions}
      testId={testId}
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '0.5rem',
      }}>
        {cards.map(({ value, label, Icon, iconColor, iconBg }) => (
          <SchedulingStatCard
            key={label}
            value={value}
            label={label}
            Icon={Icon}
            iconColor={iconColor}
            iconBg={iconBg}
            theme={theme}
          />
        ))}
      </div>
    </CollapsibleSection>
  );
}
