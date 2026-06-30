import React from 'react';
import { getIconWithColor } from '@constants/iconTypes';
import PortalTooltip from '@ui/PortalTooltip';


import { info, error, warn, debug } from '@services/utils/logger.js';/**
 * Reusable stats bar component
 * Displays compact statistics with icons and counts
 * Used in HomePage, StudentDashboard, and ReviewResultsPage
 */
const StatsBar = ({
  stats,
  theme = 'light',
  primaryColor = '#800020',
  t = (key) => key,
  lang = 'en'
}) => {
  const isDark = theme === 'dark';

  const statItems = [];

  // Build stat items based on what's available in stats object
  if (stats.completed !== undefined) {
    statItems.push({
      icon: 'check_circle',
      color: '#16a34a',
      value: stats.completed,
      title: t('completed') || 'Completed'
    });
  }

  if (stats.pending !== undefined) {
    statItems.push({
      icon: 'hourglass',
      color: '#f59e0b',
      value: stats.pending,
      title: t('pending') || 'Pending'
    });
  }

  if (stats.overdue !== undefined) {
    statItems.push({
      icon: 'clock',
      color: '#dc2626',
      value: stats.overdue,
      title: t('overdue') || 'Overdue'
    });
  }

  if (stats.required !== undefined) {
    statItems.push({
      icon: 'alert_circle',
      color: '#b91c1c',
      value: stats.required,
      title: t('required') || 'Required'
    });
  }

  if (stats.optional !== undefined) {
    statItems.push({
      icon: 'book_open',
      color: '#f57c00',
      value: stats.optional,
      title: t('optional') || 'Optional'
    });
  }

  if (stats.featured !== undefined && stats.featured > 0) {
    statItems.push({
      icon: 'pin',
      color: '#4f46e5',
      value: stats.featured,
      title: t('featured') || 'Featured'
    });
  }

  if (stats.bookmarked !== undefined && stats.bookmarked > 0) {
    statItems.push({
      icon: 'star',
      color: '#f5c518',
      value: stats.bookmarked,
      title: t('bookmarked') || 'Bookmarked'
    });
  }

  if (stats.retakable !== undefined && stats.retakable > 0) {
    statItems.push({
      icon: 'repeat',
      color: '#0ea5e9',
      value: stats.retakable,
      title: t('retake_allowed') || 'Retakable'
    });
  }

  if (stats.total !== undefined) {
    statItems.push({
      icon: 'help_circle',
      color: primaryColor,
      value: stats.total,
      title: t('total') || 'Total'
    });
  }

  // For ReviewResultsPage stats
  if (stats.passed !== undefined) {
    statItems.push({
      icon: 'check_circle',
      color: '#16a34a',
      value: stats.passed,
      title: t('passed') || 'Passed'
    });
  }

  if (stats.failed !== undefined) {
    statItems.push({
      icon: 'x_circle',
      color: '#dc2626',
      value: stats.failed,
      title: t('failed') || 'Failed'
    });
  }

  if (stats.excellent !== undefined) {
    statItems.push({
      icon: 'award',
      color: '#10b981',
      value: stats.excellent,
      title: t('excellent') || 'Excellent'
    });
  }

  if (stats.average !== undefined) {
    statItems.push({
      icon: 'bar_chart_3',
      color: '#f59e0b',
      value: `${stats.average}%`,
      title: t('average_score') || 'Average Score'
    });
  }

  if (statItems.length === 0) return null;

  return (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.375rem 0.625rem',
        background: isDark ? '#0f172a' : '#f9fafb',
        borderRadius: 8,
        border: isDark ? '1px solid #333' : '1px solid #e5e7eb',
        fontSize: 'var(--font-size-sm)',
        flexWrap: 'wrap',
        color: isDark ? '#f8fafc' : '#111'
      }}>
      {statItems.map((item, idx) => (
        <PortalTooltip key={idx} content={item.title} position="top">
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 4
          }}
        >
          {getIconWithColor('ui', item.icon, 14, item.color)}
          <span style={{ fontWeight: 700, color: item.color }}>{item.value}</span>
        </div>
        </PortalTooltip>
      ))}
    </div>
  );
};

export default StatsBar;
