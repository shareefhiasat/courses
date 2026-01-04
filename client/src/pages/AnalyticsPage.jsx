import React, { useEffect, useMemo, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { Container, Card, CardBody, Button, Badge, Grid, ProgressBar, Loading } from '../components/ui';
import { BarChart3, TrendingUp, Users, Calendar, Award, FileText, Download } from 'lucide-react';
import styles from './AnalyticsPage.module.css';

const KPICard = ({ label, value, subtitle, icon: Icon, color = '#800020' }) => (
  <Card className={styles.kpiCard}>
    <CardBody>
      <div className={styles.kpiContent}>
        <div>
          <div className={styles.kpiLabel}>{label}</div>
          <div className={styles.kpiValue} style={{ color }}>{value}</div>
          {subtitle && <div className={styles.kpiSubtitle}>{subtitle}</div>}
        </div>
        {Icon && (
          <div className={styles.kpiIcon} style={{ background: `${color}15` }}>
            <Icon size={24} style={{ color }} />
          </div>
        )}
      </div>
    </CardBody>
  </Card>
);

export default function AnalyticsPage() {
  const { t } = useLang();
  const { user, isAdmin, isInstructor, isHR } = useAuth();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  
  // Stats
  const [attendanceStats, setAttendanceStats] = useState({ totalSessions: 0, totalMarks: 0, present: 0, absent: 0, late: 0, leave: 0 });
  const [byClass, setByClass] = useState([]);
  const [studentStats, setStudentStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [submissionStats, setSubmissionStats] = useState({ total: 0, graded: 0, pending: 0, late: 0 });
  const [performanceStats, setPerformanceStats] = useState({ avgScore: 0, topPerformers: [] });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    setErr('');
    try {
      // Attendance analytics
      const sessionsSnap = await getDocs(collection(db, 'attendanceSessions'));
      let totalMarks = 0, present = 0, absent = 0, late = 0, leave = 0;
      const byClassMap = new Map();
      const classNames = new Map();

      for (const sDoc of sessionsSnap.docs) {
        const s = sDoc.data();
        const classId = s.classId || 'general';
        const marksSnap = await getDocs(collection(db, 'attendanceSessions', sDoc.id, 'marks'));
        const count = marksSnap.size;
        totalMarks += count;

        let presentCount = 0, absentCount = 0, lateCount = 0, leaveCount = 0;
        marksSnap.forEach(m => {
          const md = m.data();
          const status = md.status || 'present';
          if (status === 'present') presentCount++;
          else if (status === 'absent') absentCount++;
          else if (status === 'late') lateCount++;
          else if (status === 'leave') leaveCount++;
        });
        
        present += presentCount;
        absent += absentCount;
        late += lateCount;
        leave += leaveCount;

        if (!byClassMap.has(classId)) {
          byClassMap.set(classId, { present: 0, absent: 0, late: 0, leave: 0, total: 0 });
        }
        const classData = byClassMap.get(classId);
        classData.present += presentCount;
        classData.absent += absentCount;
        classData.late += lateCount;
        classData.leave += leaveCount;
        classData.total += count;
      }

      // Load class names
      const classesSnap = await getDocs(collection(db, 'classes'));
      classesSnap.forEach(c => {
        classNames.set(c.id, c.data().name || c.data().code || c.id);
      });

      setAttendanceStats({ totalSessions: sessionsSnap.size, totalMarks, present, absent, late, leave });
      setByClass(Array.from(byClassMap.entries()).map(([classId, stats]) => ({
        classId,
        className: classNames.get(classId) || classId,
        ...stats
      })));

      // Student analytics
      const usersSnap = await getDocs(collection(db, 'users'));
      const students = usersSnap.docs.filter(d => {
        const data = d.data();
        return !data.isAdmin && !data.isInstructor && !data.isHR;
      });
      setStudentStats({ total: students.length, active: students.length, inactive: 0 });

      // Submission analytics
      const submissionsSnap = await getDocs(collection(db, 'submissions'));
      let graded = 0, pending = 0, lateCount = 0;
      submissionsSnap.forEach(s => {
        const data = s.data();
        if (data.status === 'graded') graded++;
        else if (data.status === 'pending') pending++;
        if (data.late) lateCount++;
      });
      setSubmissionStats({ total: submissionsSnap.size, graded, pending, late: lateCount });

      // Performance analytics (avg score)
      let totalScore = 0, scoreCount = 0;
      submissionsSnap.forEach(s => {
        const data = s.data();
        if (data.score !== undefined && data.score !== null) {
          totalScore += data.score;
          scoreCount++;
        }
      });
      const avgScore = scoreCount > 0 ? (totalScore / scoreCount).toFixed(1) : 0;
      setPerformanceStats({ avgScore, topPerformers: [] });

    } catch (e) {
      setErr(e?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const maxByClass = useMemo(() => byClass.reduce((m, r) => Math.max(m, r.total), 0), [byClass]);
  const attendanceRate = attendanceStats.totalMarks > 0 ? ((attendanceStats.present / attendanceStats.totalMarks) * 100).toFixed(1) : 0;

  const exportCSV = () => {
    const rows = [
      ['Class', 'Total', 'Present', 'Absent', 'Late', 'Leave', 'Attendance Rate'],
      ...byClass.map(c => [
        c.className,
        c.total,
        c.present,
        c.absent,
        c.late,
        c.leave,
        c.total > 0 ? ((c.present / c.total) * 100).toFixed(1) + '%' : '0%'
      ])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading && byClass.length === 0) {
    return (
      <Loading
        variant="overlay"
        fullscreen
        message={t('loading_analytics') || t('loading') || 'Loading analytics...'}
      />
    );
  }

  return (
    <Container maxWidth="xl" className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1>{t('analytics') || 'Analytics'}</h1>
          <p>Comprehensive overview of attendance, performance, and engagement</p>
        </div>
        <Button
          onClick={exportCSV}
          icon={<Download size={18} />}
          variant="primary"
        >
          Export CSV
        </Button>
      </div>

      {err && <div className={styles.error}>{String(err)}</div>}

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <KPICard label="Total Sessions" value={attendanceStats.totalSessions} icon={Calendar} color="#800020" />
        <KPICard label="Total Students" value={studentStats.total} icon={Users} color="#10b981" />
        <KPICard label="Attendance Rate" value={attendanceRate + '%'} subtitle={`${attendanceStats.present} / ${attendanceStats.totalMarks} present`} icon={TrendingUp} color="#f59e0b" />
        <KPICard label="Avg Performance" value={performanceStats.avgScore} subtitle="Based on graded submissions" icon={Award} color="#8b5cf6" />
        <KPICard label="Total Submissions" value={submissionStats.total} subtitle={`${submissionStats.graded} graded`} icon={FileText} color="#06b6d4" />
      </div>

      {/* Attendance Breakdown */}
      <Grid cols={2} gap="md" className={styles.breakdownGrid}>
        <Card>
          <CardBody>
            <h3 className={styles.sectionTitle}>Attendance Breakdown</h3>
            <ProgressBar label="Present" value={attendanceStats.present} max={attendanceStats.totalMarks} color="success" />
            <ProgressBar label="Absent" value={attendanceStats.absent} max={attendanceStats.totalMarks} color="danger" />
            <ProgressBar label="Late" value={attendanceStats.late} max={attendanceStats.totalMarks} color="warning" />
            <ProgressBar label="Leave" value={attendanceStats.leave} max={attendanceStats.totalMarks} color="info" />
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h3 className={styles.sectionTitle}>Submission Status</h3>
            <ProgressBar label="Graded" value={submissionStats.graded} max={submissionStats.total} color="success" />
            <ProgressBar label="Pending" value={submissionStats.pending} max={submissionStats.total} color="warning" />
            <ProgressBar label="Late Submissions" value={submissionStats.late} max={submissionStats.total} color="danger" />
          </CardBody>
        </Card>
      </Grid>

      {/* Attendance by Class */}
      <Card>
        <CardBody>
          <h3 className={styles.sectionTitle}>Attendance by Class</h3>
          {byClass.length === 0 ? (
            <div className={styles.noData}>{t('no_data') || 'No data available'}</div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>CLASS</th>
                    <th>TOTAL</th>
                    <th>PRESENT</th>
                    <th>ABSENT</th>
                    <th>LATE</th>
                    <th>LEAVE</th>
                    <th>RATE</th>
                  </tr>
                </thead>
                <tbody>
                  {byClass.map((row) => {
                    const rate = row.total > 0 ? ((row.present / row.total) * 100).toFixed(1) : 0;
                    return (
                      <tr key={row.classId}>
                        <td className={styles.className}>{row.className}</td>
                        <td>{row.total}</td>
                        <td className={styles.present}>{row.present}</td>
                        <td className={styles.absent}>{row.absent}</td>
                        <td className={styles.late}>{row.late}</td>
                        <td className={styles.leave}>{row.leave}</td>
                        <td>
                          <Badge variant={rate >= 80 ? 'success' : rate >= 60 ? 'warning' : 'danger'}>
                            {rate}%
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </Container>
  );
}
