import React, { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { BarChart3, TrendingUp, Users, Calendar, Award, FileText, Download } from 'lucide-react';

const KPICard = ({ label, value, subtitle, icon: Icon, color = '#667eea', trend }) => (
  <div style={{ padding: '1.5rem', border: '1px solid var(--border)', borderRadius: 16, background: 'var(--panel)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
      <div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 32, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
        {subtitle && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{subtitle}</div>}
      </div>
      {Icon && (
        <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={24} style={{ color }} />
        </div>
      )}
    </div>
    {trend && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: trend > 0 ? '#10b981' : '#ef4444' }}>
        <TrendingUp size={14} style={{ transform: trend < 0 ? 'rotate(180deg)' : 'none' }} />
        {Math.abs(trend)}% from last month
      </div>
    )}
  </div>
);

const ProgressBar = ({ label, value, max, color = '#667eea', showPercentage = true }) => {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color }}>{value}{showPercentage && ` (${pct}%)`}</div>
      </div>
      <div style={{ height: 8, background: 'rgba(0,0,0,0.06)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: pct + '%', height: '100%', background: color, borderRadius: 999, transition: 'width 0.3s ease' }} />
      </div>
    </div>
  );
};

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
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p>{t('loading') || 'Loading analytics...'}</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800 }}>{t('analytics') || 'Analytics'}</h1>
          <p style={{ margin: '0.5rem 0 0 0', color: 'var(--muted)' }}>Comprehensive overview of attendance, performance, and engagement</p>
        </div>
        <button
          onClick={exportCSV}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.75rem 1.5rem', background: '#667eea', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
        >
          <Download size={18} />
          Export CSV
        </button>
      </div>

      {err && <div style={{ marginBottom: 16, padding: '1rem', background: '#fee2e2', color: '#dc2626', borderRadius: 8 }}>{String(err)}</div>}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
        <KPICard label="Total Sessions" value={attendanceStats.totalSessions} icon={Calendar} color="#667eea" />
        <KPICard label="Total Students" value={studentStats.total} icon={Users} color="#10b981" />
        <KPICard label="Attendance Rate" value={attendanceRate + '%'} subtitle={`${attendanceStats.present} / ${attendanceStats.totalMarks} present`} icon={TrendingUp} color="#f59e0b" />
        <KPICard label="Avg Performance" value={performanceStats.avgScore} subtitle="Based on graded submissions" icon={Award} color="#8b5cf6" />
        <KPICard label="Total Submissions" value={submissionStats.total} subtitle={`${submissionStats.graded} graded`} icon={FileText} color="#06b6d4" />
      </div>

      {/* Attendance Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ padding: '1.5rem', border: '1px solid var(--border)', borderRadius: 16, background: 'var(--panel)' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: 18, fontWeight: 700 }}>Attendance Breakdown</h3>
          <ProgressBar label="Present" value={attendanceStats.present} max={attendanceStats.totalMarks} color="#10b981" />
          <ProgressBar label="Absent" value={attendanceStats.absent} max={attendanceStats.totalMarks} color="#ef4444" />
          <ProgressBar label="Late" value={attendanceStats.late} max={attendanceStats.totalMarks} color="#f59e0b" />
          <ProgressBar label="Leave" value={attendanceStats.leave} max={attendanceStats.totalMarks} color="#3b82f6" />
        </div>

        <div style={{ padding: '1.5rem', border: '1px solid var(--border)', borderRadius: 16, background: 'var(--panel)' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: 18, fontWeight: 700 }}>Submission Status</h3>
          <ProgressBar label="Graded" value={submissionStats.graded} max={submissionStats.total} color="#10b981" />
          <ProgressBar label="Pending" value={submissionStats.pending} max={submissionStats.total} color="#f59e0b" />
          <ProgressBar label="Late Submissions" value={submissionStats.late} max={submissionStats.total} color="#ef4444" />
        </div>
      </div>

      {/* Attendance by Class */}
      <div style={{ padding: '1.5rem', border: '1px solid var(--border)', borderRadius: 16, background: 'var(--panel)' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: 18, fontWeight: 700 }}>Attendance by Class</h3>
        {byClass.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>{t('no_data') || 'No data available'}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '12px', fontWeight: 600, fontSize: 13, color: 'var(--muted)' }}>CLASS</th>
                  <th style={{ textAlign: 'center', padding: '12px', fontWeight: 600, fontSize: 13, color: 'var(--muted)' }}>TOTAL</th>
                  <th style={{ textAlign: 'center', padding: '12px', fontWeight: 600, fontSize: 13, color: 'var(--muted)' }}>PRESENT</th>
                  <th style={{ textAlign: 'center', padding: '12px', fontWeight: 600, fontSize: 13, color: 'var(--muted)' }}>ABSENT</th>
                  <th style={{ textAlign: 'center', padding: '12px', fontWeight: 600, fontSize: 13, color: 'var(--muted)' }}>LATE</th>
                  <th style={{ textAlign: 'center', padding: '12px', fontWeight: 600, fontSize: 13, color: 'var(--muted)' }}>LEAVE</th>
                  <th style={{ textAlign: 'center', padding: '12px', fontWeight: 600, fontSize: 13, color: 'var(--muted)' }}>RATE</th>
                </tr>
              </thead>
              <tbody>
                {byClass.map((row, idx) => {
                  const rate = row.total > 0 ? ((row.present / row.total) * 100).toFixed(1) : 0;
                  return (
                    <tr key={row.classId} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px', fontWeight: 600 }}>{row.className}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>{row.total}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#10b981', fontWeight: 600 }}>{row.present}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#ef4444', fontWeight: 600 }}>{row.absent}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#f59e0b', fontWeight: 600 }}>{row.late}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#3b82f6', fontWeight: 600 }}>{row.leave}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{ padding: '4px 12px', background: rate >= 80 ? '#d1fae5' : rate >= 60 ? '#fef3c7' : '#fee2e2', color: rate >= 80 ? '#065f46' : rate >= 60 ? '#92400e' : '#991b1b', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>
                          {rate}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
