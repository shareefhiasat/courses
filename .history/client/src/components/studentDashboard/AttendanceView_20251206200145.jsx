import React from 'react';
import { Card, CardBody, Grid, Badge, ProgressBar, EmptyState } from '../ui';
import {
  CheckCircle, XCircle, Clock, CalendarClock, Calendar, CalendarCheck
} from 'lucide-react';
import { ATTENDANCE_STATUS, ATTENDANCE_STATUS_LABELS } from '../../firebase/attendance';
import { useLang } from '../../contexts/LangContext';
import styles from '../../pages/StudentDashboardPage_NEW.module.css';

export default function AttendanceView({ attendance, attendanceStats, classes }) {
  const { lang } = useLang();

  return (
    <div className={styles.attendanceView}>
      <Grid cols={2} gap="1.5rem">
        {/* Attendance Summary */}
        <Card>
          <CardBody>
            <h2>Attendance Summary</h2>
            <div className={styles.attendanceSummaryGrid}>
              <div className={styles.attendanceSummaryCard} style={{ background: 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)' }}>
                <CheckCircle size={32} className={styles.summaryIcon} />
                <div className={styles.summaryValue}>{attendanceStats?.present || 0}</div>
                <div className={styles.summaryLabel}>Present</div>
              </div>
              <div className={styles.attendanceSummaryCard} style={{ background: 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)' }}>
                <XCircle size={32} className={styles.summaryIcon} />
                <div className={styles.summaryValue}>{attendanceStats?.absent || 0}</div>
                <div className={styles.summaryLabel}>Absent</div>
              </div>
              <div className={styles.attendanceSummaryCard} style={{ background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)' }}>
                <Clock size={32} className={styles.summaryIcon} />
                <div className={styles.summaryValue}>{attendanceStats?.late || 0}</div>
                <div className={styles.summaryLabel}>Late</div>
              </div>
              <div className={styles.attendanceSummaryCard} style={{ background: 'linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%)' }}>
                <CalendarClock size={32} className={styles.summaryIcon} />
                <div className={styles.summaryValue}>{attendanceStats?.totalSessions || 0}</div>
                <div className={styles.summaryLabel}>Total Sessions</div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Attendance Rate */}
        <Card>
          <CardBody>
            <h2>Attendance Rate</h2>
            <div className={styles.attendanceRateDisplay}>
              <div className={styles.rateCircle}>
                <div className={styles.rateValue}>{attendanceStats?.attendanceRate || 0}%</div>
              </div>
              <ProgressBar 
                value={attendanceStats?.attendanceRate || 0} 
                max={100}
                variant={attendanceStats?.attendanceRate >= 80 ? 'success' : attendanceStats?.attendanceRate >= 60 ? 'warning' : 'danger'}
                size="lg"
                className={styles.rateProgress}
              />
            </div>
          </CardBody>
        </Card>
      </Grid>

      {/* Attendance History */}
      <Card className={styles.attendanceHistoryCard}>
        <CardBody>
          <h2>Attendance History</h2>
          {attendance.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="No attendance records"
              description="Your attendance will appear here once recorded."
            />
          ) : (
            <div className={styles.attendanceHistory}>
              {attendance.map((record, idx) => (
                <div key={idx} className={styles.attendanceHistoryItem}>
                  <div className={styles.historyDate}>
                    <Calendar size={16} />
                    {new Date(record.date).toLocaleDateString('en-GB', { 
                      weekday: 'short', 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div className={styles.historyClass}>
                    {classes.find(c => c.id === record.classId)?.name || 'Unknown Class'}
                  </div>
                  <Badge 
                    variant={
                      record.status === ATTENDANCE_STATUS.PRESENT || record.status === 'present' ? 'success' : 
                      record.status === ATTENDANCE_STATUS.ABSENT_NO_EXCUSE || record.status === 'absent' ? 'danger' : 
                      record.status === ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE ? 'warning' :
                      record.status === ATTENDANCE_STATUS.LATE || record.status === 'late' ? 'warning' : 
                      record.status === ATTENDANCE_STATUS.EXCUSED_LEAVE ? 'info' :
                      record.status === ATTENDANCE_STATUS.HUMAN_CASE ? 'info' : 'default'
                    }
                    style={ATTENDANCE_STATUS_LABELS[record.status] ? { 
                      backgroundColor: ATTENDANCE_STATUS_LABELS[record.status].color,
                      color: '#fff'
                    } : {}}
                  >
                    {ATTENDANCE_STATUS_LABELS[record.status]?.[lang === 'ar' ? 'ar' : 'en'] || record.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}



