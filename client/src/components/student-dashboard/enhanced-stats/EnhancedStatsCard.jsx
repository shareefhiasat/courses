import React, { useState } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  BarChart,
  Bar
} from 'recharts';
import styles from './EnhancedStatsCard.module.css';

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981', 
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  orange: '#f97316'
};

const EnhancedStatsCard = React.memo(({ 
  type, 
  value, 
  data, 
  title, 
  icon,
  showChart = true,
  isStaff = false,
  selectedStudentId = null
}) => {
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const [chartType, setChartType] = useState('pie');

  const getChartData = () => {
    switch (type) {
      case 'attendance':
        if (!data) return [];
        const present = data.presentCount || 0;
        const absent = data.absentCount || 0;
        const late = data.lateCount || 0;
        const total = present + absent + late;
        
        return [
          { name: t('present') || 'Present', value: present, percentage: total > 0 ? (present / total * 100).toFixed(1) : 0 },
          { name: t('absent') || 'Absent', value: absent, percentage: total > 0 ? (absent / total * 100).toFixed(1) : 0 },
          { name: t('late') || 'Late', value: late, percentage: total > 0 ? (late / total * 100).toFixed(1) : 0 }
        ].filter(item => item.value > 0);

      case 'gpa':
        if (!data) return [];
        return data.map(item => ({
          name: item.name || 'Course',
          gpa: item.gpa || 0,
          grade: item.grade || 'N/A'
        }));

      case 'netScore':
        if (!data) return [];
        return [
          { name: t('participations') || 'Participations', value: data.participationPoints || 0, color: COLORS.success },
          { name: t('penalties') || 'Penalties', value: Math.abs(data.penaltyPoints || 0), color: COLORS.danger }
        ];

      default:
        return [];
    }
  };

  const chartData = getChartData();

  const renderChart = () => {
    if (!showChart || chartData.length === 0) return null;

    switch (type) {
      case 'attendance':
        return (
          <div className={styles.chartContainer}>
            {chartType === 'pie' ? (
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={45}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={
                        entry.name === (t('present') || 'Present') ? COLORS.success :
                        entry.name === (t('absent') || 'Absent') ? COLORS.danger : COLORS.warning
                      } />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [`${value} (${chartData.find(d => d.name === name)?.percentage}%)`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill={COLORS.primary} />
                </BarChart>
              </ResponsiveContainer>
            )}
            <div className={styles.chartToggle}>
              <button
                type="button"
                className={`${styles.toggleBtn} ${chartType === 'pie' ? styles.active : ''}`}
                onClick={() => setChartType('pie')}
              >
                {getThemedIcon('ui', 'pie_chart', 12, theme)}
              </button>
              <button
                type="button"
                className={`${styles.toggleBtn} ${chartType === 'bar' ? styles.active : ''}`}
                onClick={() => setChartType('bar')}
              >
                {getThemedIcon('ui', 'bar_chart', 12, theme)}
              </button>
            </div>
          </div>
        );

      case 'gpa':
        return (
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 4]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="gpa" stroke={COLORS.purple} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );

      case 'netScore':
        return (
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={25}
                  outerRadius={45}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        );

      default:
        return null;
    }
  };

  const getDisplayValue = () => {
    switch (type) {
      case 'attendance':
        const total = (data?.presentCount || 0) + (data?.absentCount || 0) + (data?.lateCount || 0);
        return total > 0 ? `${data?.presentCount || 0}/${total}` : '0/0';
      
      case 'gpa':
        return typeof value === 'number' ? value.toFixed(2) : '0.00';
      
      case 'netScore':
        const netValue = value || 0;
        return `${netValue >= 0 ? '+' : ''}${netValue}`;
      
      default:
        return value || '0';
    }
  };

  const getSubtitle = () => {
    switch (type) {
      case 'attendance':
        const total = (data?.presentCount || 0) + (data?.absentCount || 0) + (data?.lateCount || 0);
        return total > 0 ? `${((data?.presentCount || 0) / total * 100).toFixed(1)}%` : '0%';
      
      case 'gpa':
        if (isStaff && !selectedStudentId) {
          return t('class_average') || 'Class Average';
        }
        return t('student_gpa') || 'Student GPA';
      
      case 'netScore':
        return t('participation_minus_penalties') || 'Participation - Penalties';
      
      default:
        return '';
    }
  };

  return (
    <div className={styles.enhancedCard} data-theme={theme} data-type={type}>
      <div className={styles.cardHeader}>
        <div className={styles.cardIcon}>
          {icon || getThemedIcon('ui', 'activity', 20, theme)}
        </div>
        <div className={styles.cardInfo}>
          <h3 className={styles.cardTitle}>{title}</h3>
          <p className={styles.cardSubtitle}>{getSubtitle()}</p>
        </div>
      </div>

      <div className={styles.cardValue}>
        <span className={styles.value}>{getDisplayValue()}</span>
        {type === 'attendance' && (
          <span className={styles.percentage}>{getSubtitle()}</span>
        )}
      </div>

      {renderChart()}

      {type === 'attendance' && chartData.length > 0 && (
        <div className={styles.legend}>
          {chartData.map((item, index) => (
            <div key={index} className={styles.legendItem}>
              <div 
                className={styles.legendColor}
                style={{
                  backgroundColor: item.name === (t('present') || 'Present') ? COLORS.success :
                                   item.name === (t('absent') || 'Absent') ? COLORS.danger : COLORS.warning
                }}
              />
              <span className={styles.legendText}>
                {item.name}: {item.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

EnhancedStatsCard.displayName = 'EnhancedStatsCard';
export default EnhancedStatsCard;
