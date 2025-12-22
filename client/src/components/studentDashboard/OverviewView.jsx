import React from 'react';
import { Card, CardBody, Button, Badge, Grid, EmptyState } from '../ui';
import {
  AlertCircle, CheckCircle, CalendarCheck, Clock, XCircle,
  ChevronRight, Inbox
} from 'lucide-react';
import { ATTENDANCE_STATUS, ATTENDANCE_STATUS_LABELS } from '../../firebase/attendance';
import styles from '../../pages/StudentDashboardPage_NEW.module.css';

export default function OverviewView({ 
  urgentTasks, 
  tasks, 
  attendance, 
  attendanceStats, 
  navigate, 
  setViewMode 
}) {
  return (
    <Grid cols={3} gap="1.5rem" className={styles.overviewGrid}>
      {/* Urgent Tasks Widget */}
      {urgentTasks.length > 0 && (
        <Card className={styles.urgentTasksCard}>
          <CardBody>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                <AlertCircle size={20} className={styles.urgentIcon} />
                <h3>Urgent Tasks</h3>
              </div>
              <Badge variant="danger" size="sm">{urgentTasks.length}</Badge>
            </div>
            <div className={styles.urgentTasksList}>
              {urgentTasks.map(task => (
                <div key={task.id} className={styles.urgentTaskItem}>
                  <div className={styles.urgentTaskInfo}>
                    <div className={styles.urgentTaskTitle}>{task.title}</div>
                    <div className={styles.urgentTaskMeta}>
                      {task.className} • Due {new Date(task.deadline.toDate()).toLocaleDateString('en-GB')}
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="primary"
                    onClick={() => navigate(task.type === 'quiz' ? `/quiz/${task.id}` : `/activity/${task.id}`)}
                  >
                    {task.type === 'quiz' ? 'Start' : 'Submit'}
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm" className={styles.viewAllButton} onClick={() => setViewMode('tasks')}>
              View All Tasks <ChevronRight size={16} />
            </Button>
          </CardBody>
        </Card>
      )}

      {/* Recent Attendance Widget */}
      <Card className={styles.attendanceCard}>
        <CardBody>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>
              <CalendarCheck size={20} />
              <h3>Recent Attendance</h3>
            </div>
          </div>
          {attendance.length === 0 ? (
            <div className={styles.emptyWidget}>
              <CalendarCheck size={40} className={styles.emptyIcon} />
              <p>No attendance records yet</p>
              <span className={styles.emptyHint}>Your attendance will appear here once classes begin</span>
            </div>
          ) : (
            <div className={styles.attendanceOverview}>
              <div className={styles.attendanceStats}>
                <div className={styles.attendanceStat}>
                  <CheckCircle size={18} className={styles.presentIcon} />
                  <span>{attendanceStats?.present || 0} Present</span>
                </div>
                <div className={styles.attendanceStat}>
                  <XCircle size={18} className={styles.absentIcon} />
                  <span>{attendanceStats?.absent || 0} Absent</span>
                </div>
                <div className={styles.attendanceStat}>
                  <Clock size={18} className={styles.lateIcon} />
                  <span>{attendanceStats?.late || 0} Late</span>
                </div>
              </div>
              <div className={styles.attendanceList}>
                {attendance.slice(0, 5).map((record, idx) => (
                  <div key={idx} className={styles.attendanceItem}>
                    <div className={styles.attendanceDate}>
                      {new Date(record.date).toLocaleDateString('en-GB')}
                    </div>
                    <Badge 
                      variant={
                        record.status === ATTENDANCE_STATUS.PRESENT || record.status === 'present' ? 'success' : 
                        record.status === ATTENDANCE_STATUS.ABSENT_NO_EXCUSE || record.status === 'absent' ? 'danger' : 
                        'warning'
                      }
                      size="sm"
                      style={ATTENDANCE_STATUS_LABELS[record.status] ? { 
                        backgroundColor: ATTENDANCE_STATUS_LABELS[record.status].color,
                        color: '#fff'
                      } : {}}
                    >
                      {ATTENDANCE_STATUS_LABELS[record.status]?.en || record.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
          <Button variant="ghost" size="sm" className={styles.viewAllButton} onClick={() => setViewMode('attendance')}>
            View Full History <ChevronRight size={16} />
          </Button>
        </CardBody>
      </Card>

      {/* Upcoming Tasks Widget - Show when no urgent tasks */}
      {urgentTasks.length === 0 && (
        <Card className={styles.upcomingTasksCard}>
          <CardBody>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                <CheckCircle size={20} />
                <h3>My Tasks</h3>
              </div>
              <Badge variant="success" size="sm">{tasks.length}</Badge>
            </div>
            {tasks.length === 0 ? (
              <div className={styles.emptyWidget}>
                <Inbox size={40} className={styles.emptyIcon} />
                <p>No tasks assigned yet</p>
                <span className={styles.emptyHint}>Quizzes, homework, and resources will appear here</span>
              </div>
            ) : (
              <div className={styles.tasksSummary}>
                <div className={styles.taskStat}>
                  <span className={styles.taskStatValue}>{tasks.filter(t => t.status === 'pending').length}</span>
                  <span className={styles.taskStatLabel}>Pending</span>
                </div>
                <div className={styles.taskStat}>
                  <span className={styles.taskStatValue}>{tasks.filter(t => t.status === 'completed').length}</span>
                  <span className={styles.taskStatLabel}>Completed</span>
                </div>
                <div className={styles.taskStat}>
                  <span className={styles.taskStatValue}>{tasks.filter(t => t.status === 'overdue').length}</span>
                  <span className={styles.taskStatLabel}>Overdue</span>
                </div>
              </div>
            )}
            <Button variant="ghost" size="sm" className={styles.viewAllButton} onClick={() => setViewMode('tasks')}>
              View All Tasks <ChevronRight size={16} />
            </Button>
          </CardBody>
        </Card>
      )}

      {/* Recent Performance Summary Widget */}
      <Card className={styles.performanceSummaryCard}>
        <CardBody>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>
              <CheckCircle size={20} />
              <h3>Performance Summary</h3>
            </div>
          </div>
          <div className={styles.performanceSummary}>
            <div className={styles.performanceSummaryItem}>
              <div className={styles.performanceSummaryValue}>
                {tasks.filter(t => t.status === 'completed').length}
              </div>
              <div className={styles.performanceSummaryLabel}>Completed Tasks</div>
            </div>
            <div className={styles.performanceSummaryItem}>
              <div className={styles.performanceSummaryValue}>
                {tasks.filter(t => t.isGraded && t.score != null).length > 0
                  ? Math.round(
                      tasks
                        .filter(t => t.isGraded && t.score != null)
                        .reduce((sum, t) => sum + t.score, 0) /
                      tasks.filter(t => t.isGraded && t.score != null).length
                    )
                  : 0}%
              </div>
              <div className={styles.performanceSummaryLabel}>Average Score</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" className={styles.viewAllButton} onClick={() => setViewMode('performance')}>
            View Full Performance <ChevronRight size={16} />
          </Button>
        </CardBody>
      </Card>
    </Grid>
  );
}




