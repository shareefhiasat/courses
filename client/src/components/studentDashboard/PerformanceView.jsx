import React, { useMemo } from 'react';
import { Card, CardBody, Grid, ProgressBar } from '../ui';
import styles from '../../pages/StudentDashboardPage_NEW.module.css';

export default function PerformanceView({ tasks, quizResults, submissions, classes }) {
  const performanceByType = useMemo(() => {
    const types = ['quiz', 'homework', 'resource'];
    return types.map(type => {
      const typeTasks = tasks.filter(t => t.type === type);
      const completed = typeTasks.filter(t => t.status === 'completed').length;
      const total = typeTasks.length;
      const graded = typeTasks.filter(t => t.isGraded && t.score != null);
      const avgScore = graded.length > 0
        ? Math.round(graded.reduce((sum, t) => sum + t.score, 0) / graded.length)
        : 0;

      return {
        type,
        completed,
        total,
        avgScore,
        completionRate: total > 0 ? ((completed / total) * 100).toFixed(1) : 0
      };
    });
  }, [tasks]);

  const overallStats = useMemo(() => {
    const completed = tasks.filter(t => t.status === 'completed').length;
    const total = tasks.length;
    const graded = tasks.filter(t => t.isGraded && t.score != null);
    const avgScore = graded.length > 0
      ? Math.round(graded.reduce((sum, t) => sum + t.score, 0) / graded.length)
      : 0;

    return {
      completed,
      total,
      avgScore,
      completionRate: total > 0 ? ((completed / total) * 100).toFixed(1) : 0
    };
  }, [tasks]);

  return (
    <div className={styles.performanceView}>
      {/* Overall Performance Card */}
      <Card className={styles.overallPerformanceCard}>
        <CardBody>
          <h2>Overall Performance</h2>
          <div className={styles.overallPerformanceStats}>
            <div className={styles.overallStat}>
              <div className={styles.overallStatValue}>{overallStats.completed}/{overallStats.total}</div>
              <div className={styles.overallStatLabel}>Tasks Completed</div>
            </div>
            <div className={styles.overallStat}>
              <div className={styles.overallStatValue}>{overallStats.avgScore}%</div>
              <div className={styles.overallStatLabel}>Average Score</div>
            </div>
            <div className={styles.overallStat}>
              <div className={styles.overallStatValue}>{overallStats.completionRate}%</div>
              <div className={styles.overallStatLabel}>Completion Rate</div>
            </div>
          </div>
          <ProgressBar 
            value={overallStats.completionRate} 
            max={100}
            variant="primary"
            size="lg"
            className={styles.overallProgress}
          />
        </CardBody>
      </Card>

      {/* Performance by Type */}
      <Grid cols={3} gap="1.5rem">
        {performanceByType.map(perf => (
          <Card key={perf.type} className={styles.performanceCard}>
            <CardBody>
              <h3 className={styles.performanceTitle}>
                {perf.type === 'quiz' ? 'Quiz' : perf.type === 'homework' ? 'Homework' : 'Resource'} Performance
              </h3>
              <div className={styles.performanceStats}>
                <div className={styles.performanceStat}>
                  <div className={styles.performanceValue}>{perf.completed}/{perf.total}</div>
                  <div className={styles.performanceLabel}>Completed</div>
                </div>
                <div className={styles.performanceStat}>
                  <div className={styles.performanceValue}>{perf.avgScore}%</div>
                  <div className={styles.performanceLabel}>Avg Score</div>
                </div>
              </div>
              <ProgressBar 
                value={perf.completionRate} 
                max={100}
                variant="primary"
                size="md"
              />
            </CardBody>
          </Card>
        ))}
      </Grid>
    </div>
  );
}




