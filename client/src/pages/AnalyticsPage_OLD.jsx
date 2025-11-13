import React, { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';

const Stat = ({ label, value, color = '#667eea' }) => (
  <div style={{ padding:'1rem', border:'1px solid var(--border)', borderRadius:12, background:'var(--panel)' }}>
    <div style={{ fontSize:12, color:'var(--muted)', marginBottom:6 }}>{label}</div>
    <div style={{ fontSize:22, fontWeight:800, color }}>{value}</div>
  </div>
);

const Bar = ({ label, value, max }) => {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ marginBottom:8 }}>
      <div style={{ fontSize:12, color:'var(--muted)', marginBottom:4 }}>{label} — {value}</div>
      <div style={{ height:10, background:'rgba(0,0,0,0.08)', borderRadius:999 }}>
        <div style={{ width: pct+'%', height:'100%', background:'#667eea', borderRadius:999 }} />
      </div>
    </div>
  );
};

export default function AnalyticsPage() {
  const { t } = useLang();
  const { user, isAdmin, isInstructor } = useAuth();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [attendanceStats, setAttendanceStats] = useState({ totalSessions: 0, totalMarks: 0, present: 0, absent: 0 });
  const [byClass, setByClass] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true); setErr('');
      try {
        // Attendance totals
        const sessionsSnap = await getDocs(collection(db, 'attendanceSessions'));
        const marksCounts = [];
        let totalMarks = 0; let present = 0; let absent = 0;
        const byClassMap = new Map();
        for (const sDoc of sessionsSnap.docs) {
          const s = sDoc.data();
          const classId = s.classId || 'general';
          const marksSnap = await getDocs(collection(db, 'attendanceSessions', sDoc.id, 'marks'));
          const count = marksSnap.size;
          totalMarks += count;
          marksCounts.push(count);
          let presentCount = 0, absentCount = 0;
          marksSnap.forEach(m => {
            const md = m.data();
            if ((md.status || 'present') === 'present') presentCount++; else if (md.status === 'absent') absentCount++; else absentCount++;
          });
          present += presentCount; absent += absentCount;
          byClassMap.set(classId, (byClassMap.get(classId) || 0) + count);
        }
        setAttendanceStats({ totalSessions: sessionsSnap.size, totalMarks, present, absent });
        setByClass(Array.from(byClassMap.entries()).map(([k,v])=>({ classId: k, value: v }))); 
      } catch (e) {
        setErr(e?.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const maxByClass = useMemo(() => byClass.reduce((m, r)=>Math.max(m, r.value), 0), [byClass]);

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '1rem' }}>
      <h1 style={{ marginTop: 0 }}>{t('analytics') || 'Analytics'}</h1>
      {err && <div style={{ marginBottom:12, color:'#ef4444' }}>{String(err)}</div>}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px,1fr))', gap:12, marginBottom:16 }}>
        <Stat label={t('total_sessions') || 'Total Sessions'} value={attendanceStats.totalSessions} />
        <Stat label={t('total_marks') || 'Total Marks'} value={attendanceStats.totalMarks} />
        <Stat label={t('present') || 'Present'} value={attendanceStats.present} color="#10b981" />
        <Stat label={t('absent') || 'Absent'} value={attendanceStats.absent} color="#ef4444" />
      </div>

      <div style={{ padding:'1rem', border:'1px solid var(--border)', borderRadius:12, background:'var(--panel)' }}>
        <div style={{ fontWeight:700, marginBottom:8 }}>{t('attendance_by_class') || 'Attendance by Class'}</div>
        {byClass.length === 0 && (
          <div style={{ fontSize:12, color:'var(--muted)' }}>{t('no_data') || 'No data available'}</div>
        )}
        {byClass.map(row => (
          <Bar key={row.classId} label={row.classId} value={row.value} max={maxByClass} />
        ))}
      </div>
    </div>
  );
}
