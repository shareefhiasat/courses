import React from 'react';
import { Card, CardBody, ProgressBar } from '../ui';
import { BookOpen, Target, Trophy, CalendarCheck } from 'lucide-react';
import styles from '../../pages/StudentDashboardPage_NEW.module.css';

export default function StatsCards({ stats, attendanceStats }) {
  return (
    <div className={styles.statsGrid}>
      <Card className={styles.statCard}>
        <CardBody>
          <div className={styles.statCardContent}>
            <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <BookOpen size={24} />
            </div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{stats.enrolledClasses}</div>
              <div className={styles.statLabel}>Enrolled Classes</div>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className={styles.statCard}>
        <CardBody>
          <div className={styles.statCardContent}>
            <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
              <Target size={24} />
            </div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{stats.completedTasks}/{stats.totalTasks}</div>
              <div className={styles.statLabel}>Tasks Completed</div>
              <ProgressBar 
                value={stats.completionRate} 
                max={100}
                variant="success"
                size="sm"
                className={styles.statProgress}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className={styles.statCard}>
        <CardBody>
          <div className={styles.statCardContent}>
            <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
              <Trophy size={24} />
            </div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{stats.avgGrade}%</div>
              <div className={styles.statLabel}>Average Grade</div>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className={styles.statCard}>
        <CardBody>
          <div className={styles.statCardContent}>
            <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
              <CalendarCheck size={24} />
            </div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{attendanceStats?.attendanceRate || 0}%</div>
              <div className={styles.statLabel}>Attendance Rate</div>
              <div className={styles.statSubtext}>
                {attendanceStats?.present || 0}/{attendanceStats?.totalSessions || 0} sessions
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}




