import React, { useMemo } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  LineChart,
  Line
} from 'recharts';
import styles from './NetScoreAnalysis.module.css';

const COLORS = {
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  primary: '#3b82f6',
  purple: '#8b5cf6',
  orange: '#f97316'
};

const NetScoreAnalysis = React.memo(({ 
  participations = [], 
  penalties = [], 
  behaviors = [],
  marks = [],
  quizResults = [],
  isStaff = false,
  selectedStudentId = null
}) => {
  const { t, lang } = useLang();
  const { theme } = useTheme();

  // Process participation data
  const participationData = useMemo(() => {
    const groupedByType = participations.reduce((acc, p) => {
      const type = p.type || 'general';
      acc[type] = (acc[type] || 0) + (Number(p.points) || 0);
      return acc;
    }, {});

    return Object.entries(groupedByType).map(([type, points]) => ({
      name: t(`participation_${type}`) || type,
      points,
      count: participations.filter(p => (p.type || 'general') === type).length
    }));
  }, [participations, t]);

  // Process penalty data
  const penaltyData = useMemo(() => {
    const groupedByType = penalties.reduce((acc, p) => {
      const type = p.type || 'general';
      acc[type] = (acc[type] || 0) + Math.abs(Number(p.points) || 0);
      return acc;
    }, {});

    return Object.entries(groupedByType).map(([type, points]) => ({
      name: t(`penalty_${type}`) || type,
      points,
      count: penalties.filter(p => (p.type || 'general') === type).length
    }));
  }, [penalties, t]);

  // Process quiz results for performance trends
  const quizPerformanceData = useMemo(() => {
    return quizResults.map((quiz, index) => ({
      name: quiz.name || `Quiz ${index + 1}`,
      score: quiz.score || 0,
      maxScore: quiz.maxScore || 100,
      percentage: quiz.maxScore ? ((quiz.score || 0) / quiz.maxScore * 100).toFixed(1) : 0,
      date: quiz.date || new Date().toISOString()
    })).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [quizResults]);

  // Process marks/grades data
  const marksData = useMemo(() => {
    return marks.map((mark, index) => ({
      name: mark.courseName || mark.subject || `Course ${index + 1}`,
      grade: mark.grade || 'N/A',
      points: mark.points || 0,
      totalMarks: mark.totalMarks || 100,
      percentage: mark.totalMarks ? ((mark.totalMarks || 0) / mark.totalMarks * 100).toFixed(1) : 0
    }));
  }, [marks]);

  // Calculate net score breakdown
  const netScoreBreakdown = useMemo(() => {
    const totalParticipationPoints = participations.reduce((sum, p) => sum + (Number(p.points) || 0), 0);
    const totalPenaltyPoints = penalties.reduce((sum, p) => sum + (Number(p.points) || 0), 0);
    const totalBehaviorPoints = behaviors.reduce((sum, b) => sum + (Number(b.points) || 0), 0);
    
    return [
      { 
        name: t('participations') || 'Participations', 
        value: totalParticipationPoints, 
        color: COLORS.success 
      },
      { 
        name: t('penalties') || 'Penalties', 
        value: Math.abs(totalPenaltyPoints), 
        color: COLORS.danger 
      },
      { 
        name: t('behaviors') || 'Behaviors', 
        value: totalBehaviorPoints, 
        color: COLORS.warning 
      }
    ].filter(item => item.value > 0);
  }, [participations, penalties, behaviors, t]);

  // Performance trend data
  const performanceTrend = useMemo(() => {
    const allScores = [
      ...quizPerformanceData.map(q => ({ name: q.name, score: parseFloat(q.percentage), type: 'Quiz' })),
      ...marksData.map(m => ({ name: m.name, score: parseFloat(m.percentage), type: 'Assignment' }))
    ].sort((a, b) => a.name.localeCompare(b.name));

    return allScores.slice(-10); // Last 10 items
  }, [quizPerformanceData, marksData]);

  const totalNetScore = useMemo(() => {
    return participations.reduce((sum, p) => sum + (Number(p.points) || 0), 0) +
           penalties.reduce((sum, p) => sum + (Number(p.points) || 0), 0) +
           behaviors.reduce((sum, b) => sum + (Number(b.points) || 0), 0);
  }, [participations, penalties, behaviors]);

  return (
    <div className={styles.netScoreAnalysis} data-theme={theme}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          {getThemedIcon('ui', 'trending_up', 20, theme)}
          {t('dashboard.net_score_analysis') || (lang === 'ar' ? 'تحليل الصافي' : 'Net Score Analysis')}
        </h2>
        <div className={styles.totalScore}>
          <span className={styles.scoreValue}>
            {totalNetScore >= 0 ? '+' : ''}{totalNetScore}
          </span>
          <span className={styles.scoreLabel}>
            {t('dashboard.total_net_score') || (lang === 'ar' ? 'إجمالي الصافي' : 'Total Net Score')}
          </span>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        
        {/* Net Score Breakdown Pie Chart */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>
            {t('dashboard.score_breakdown') || (lang === 'ar' ? 'تفصيل الدرجات' : 'Score Breakdown')}
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={netScoreBreakdown}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, value, percentage }) => `${name}: ${value}`}
              >
                {netScoreBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Participation Types Bar Chart */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>
            {t('dashboard.participation_analysis') || (lang === 'ar' ? 'تحليل المشاركة' : 'Participation Analysis')}
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={participationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="points" fill={COLORS.success} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Trend Line Chart */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>
            {t('dashboard.performance_trend') || (lang === 'ar' ? 'اتجاه الأداء' : 'Performance Trend')}
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={performanceTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="score" stroke={COLORS.primary} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Breakdown Table */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>
            {t('dashboard.detailed_breakdown') || (lang === 'ar' ? 'تفصيل مفصل' : 'Detailed Breakdown')}
          </h3>
          <div className={styles.breakdownTable}>
            <div className={styles.tableRow}>
              <span className={styles.tableHeader}>{t('type') || 'Type'}</span>
              <span className={styles.tableHeader}>{t('count') || 'Count'}</span>
              <span className={styles.tableHeader}>{t('points') || 'Points'}</span>
            </div>
            
            {participationData.map((item, index) => (
              <div key={`participation-${index}`} className={styles.tableRow}>
                <span className={styles.tableCell}>{item.name}</span>
                <span className={styles.tableCell}>{item.count}</span>
                <span className={`${styles.tableCell} ${styles.positive}`}>+{item.points}</span>
              </div>
            ))}
            
            {penaltyData.map((item, index) => (
              <div key={`penalty-${index}`} className={styles.tableRow}>
                <span className={styles.tableCell}>{item.name}</span>
                <span className={styles.tableCell}>{item.count}</span>
                <span className={`${styles.tableCell} ${styles.negative}`}>-{item.points}</span>
              </div>
            ))}
            
            <div className={`${styles.tableRow} ${styles.totalRow}`}>
              <span className={styles.tableCell}>{t('total') || 'Total'}</span>
              <span className={styles.tableCell}>
                {participations.length + penalties.length + behaviors.length}
              </span>
              <span className={`${styles.tableCell} ${totalNetScore >= 0 ? styles.positive : styles.negative}`}>
                {totalNetScore >= 0 ? '+' : ''}{totalNetScore}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Insights Section */}
      <div className={styles.insightsSection}>
        <h3 className={styles.insightsTitle}>
          {getThemedIcon('ui', 'lightbulb', 16, theme)}
          {t('dashboard.key_insights') || (lang === 'ar' ? 'رؤى رئيسية' : 'Key Insights')}
        </h3>
        
        <div className={styles.insightsGrid}>
          <div className={styles.insightCard}>
            <h4>{t('dashboard.participation_strength') || (lang === 'ar' ? 'قوة المشاركة' : 'Participation Strength')}</h4>
            <p>
              {participations.length > 5 ? 
                (t('dashboard.high_participation') || (lang === 'ar' ? 'مشاركة عالية' : 'High Participation')) :
                participations.length > 2 ?
                (t('dashboard.moderate_participation') || (lang === 'ar' ? 'مشاركة متوسطة' : 'Moderate Participation')) :
                (t('dashboard.low_participation') || (lang === 'ar' ? 'مشاركة منخفضة' : 'Low Participation'))
              }
            </p>
          </div>
          
          <div className={styles.insightCard}>
            <h4>{t('dashboard.penalty_impact') || (lang === 'ar' ? 'تأثير العقوبات' : 'Penalty Impact')}</h4>
            <p>
              {penalties.length === 0 ? 
                (t('dashboard.no_penalties') || (lang === 'ar' ? 'لا توجد عقوبات' : 'No Penalties')) :
                penalties.length <= 2 ?
                (t('dashboard.minimal_penalties') || (lang === 'ar' ? 'عقوبات طفيفة' : 'Minimal Penalties')) :
                (t('dashboard.significant_penalties') || (lang === 'ar' ? 'عقوبات كبيرة' : 'Significant Penalties'))
              }
            </p>
          </div>
          
          <div className={styles.insightCard}>
            <h4>{t('dashboard.overall_trend') || (lang === 'ar' ? 'الاتجاه العام' : 'Overall Trend')}</h4>
            <p>
              {totalNetScore >= 10 ? 
                (t('dashboard.excellent_performance') || (lang === 'ar' ? 'أداء ممتاز' : 'Excellent Performance')) :
                totalNetScore >= 0 ?
                (t('dashboard.good_performance') || (lang === 'ar' ? 'أداء جيد' : 'Good Performance')) :
                (t('dashboard.needs_improvement') || (lang === 'ar' ? 'يحتاج تحسين' : 'Needs Improvement'))
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

NetScoreAnalysis.displayName = 'NetScoreAnalysis';
export default NetScoreAnalysis;
