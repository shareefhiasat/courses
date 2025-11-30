import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { Navigate } from 'react-router-dom';
import { getClasses, getEnrollments, getUsers } from '../firebase/firestore';
import { 
  getAttendanceByClass, 
  getAttendanceByStudent, 
  markAttendance,
  getAttendanceStats 
} from '../firebase/attendance';
import { addActivityLog } from '../firebase/firestore';
import { Loading, useToast, Button, Select } from '../components/ui';
import { 
  Calendar, Users, CheckCircle, XCircle, Clock, Download, 
  Filter, Search, BarChart3, TrendingUp, User as UserIcon 
} from 'lucide-react';

const ManualAttendancePage = () => {
  const { user, isAdmin, isInstructor } = useAuth();
  const { t } = useLang();
  const toast = useToast();
  
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState({});
  const [stats, setStats] = useState(null);
  const [viewMode, setViewMode] = useState('mark'); // 'mark' | 'history' | 'analytics'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'present' | 'absent'

  useEffect(() => {
    if (user && (isAdmin || isInstructor)) {
      loadData();
    }
  }, [user, isAdmin, isInstructor]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [classesRes, enrollmentsRes, usersRes] = await Promise.all([
        getClasses(),
        getEnrollments(),
        getUsers()
      ]);

      if (classesRes.success) setClasses(classesRes.data);
      if (enrollmentsRes.success) setEnrollments(enrollmentsRes.data);
      if (usersRes.success) setUsers(usersRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast?.showError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadAttendance = async () => {
    if (!selectedClass || !selectedDate) return;
    
    try {
      const result = await getAttendanceByClass(selectedClass, selectedDate);
      if (result.success) {
        const attendanceMap = {};
        result.data.forEach(record => {
          attendanceMap[record.studentId] = record.status;
        });
        setAttendance(attendanceMap);
      }
    } catch (error) {
      console.error('Error loading attendance:', error);
    }
  };

  const loadStats = async () => {
    if (!selectedClass) return;
    
    try {
      const result = await getAttendanceStats(selectedClass);
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  useEffect(() => {
    if (selectedClass && selectedDate) {
      loadAttendance();
    }
  }, [selectedClass, selectedDate]);

  useEffect(() => {
    if (selectedClass) {
      loadStats();
    }
  }, [selectedClass]);

  const handleMarkAttendance = async (studentId, status) => {
    try {
      const result = await markAttendance({
        classId: selectedClass,
        studentId,
        date: selectedDate,
        status,
        markedBy: user.uid,
        method: 'manual'
      });

      if (result.success) {
        // Log attendance marking
        try {
          const student = users.find(u => u.docId === studentId);
          await addActivityLog({
            type: 'attendance_marked',
            userId: user.uid,
            email: user.email,
            displayName: user.displayName || user.email,
            userAgent: navigator.userAgent,
            metadata: { studentId, studentName: student?.displayName || student?.email || 'Unknown', classId: selectedClass, date: selectedDate, status, markedBy: user.uid }
          });
        } catch (e) { console.warn('Failed to log attendance:', e); }
        setAttendance(prev => ({ ...prev, [studentId]: status }));
        toast?.showSuccess(`Marked as ${status}`);
        loadStats(); // Refresh stats
      } else {
        toast?.showError(result.error || 'Failed to mark attendance');
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast?.showError('Failed to mark attendance');
    }
  };

  const exportAttendance = () => {
    const classData = classes.find(c => c.docId === selectedClass);
    const className = classData?.name_en || selectedClass;
    
    const studentsInClass = enrollments
      .filter(e => e.classId === selectedClass && e.role === 'student')
      .map(e => {
        const student = users.find(u => u.docId === e.userId);
        return {
          name: student?.displayName || student?.email || e.userId,
          email: student?.email || '',
          status: attendance[e.userId] || 'absent'
        };
      });

    const csvContent = [
      ['Student Name', 'Email', 'Status', 'Date', 'Class'],
      ...studentsInClass.map(s => [
        s.name,
        s.email,
        s.status,
        selectedDate,
        className
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance_${className}_${selectedDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!user || (!isAdmin && !isInstructor)) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return <Loading />;
  }

  const studentsInClass = enrollments
    .filter(e => e.classId === selectedClass && e.role === 'student')
    .map(e => {
      const student = users.find(u => u.docId === e.userId);
      return {
        id: e.userId,
        name: student?.displayName || student?.email || e.userId,
        email: student?.email || '',
        status: attendance[e.userId] || 'absent'
      };
    })
    .filter(s => filterStatus === 'all' || s.status === filterStatus);

  const presentCount = Object.values(attendance).filter(s => s === 'present').length;
  const absentCount = studentsInClass.length - presentCount;
  const attendanceRate = studentsInClass.length > 0 
    ? ((presentCount / studentsInClass.length) * 100).toFixed(1) 
    : 0;

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: 700, 
          marginBottom: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <Calendar size={32} />
          {t('manual_attendance') || 'Manual Attendance Management'}
        </h1>
        <p style={{ color: '#666', fontSize: '1rem' }}>
          {t('mark_attendance_desc') || 'Mark and track student attendance manually'}
        </p>
      </div>

      {/* View Mode Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '2rem',
        borderBottom: '2px solid #e5e7eb'
      }}>
        {[
          { key: 'mark', label: 'Mark Attendance', icon: <CheckCircle size={18} /> },
          { key: 'history', label: 'History', icon: <Clock size={18} /> },
          { key: 'analytics', label: 'Analytics', icon: <BarChart3 size={18} /> }
        ].map(mode => (
          <button
            key={mode.key}
            onClick={() => setViewMode(mode.key)}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'transparent',
              border: 'none',
              borderBottom: viewMode === mode.key ? '3px solid #800020' : '3px solid transparent',
              color: viewMode === mode.key ? '#800020' : '#666',
              fontWeight: viewMode === mode.key ? 600 : 400,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
          >
            {mode.icon}
            {mode.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '1rem',
        marginBottom: '2rem',
        padding: '1.5rem',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            fontWeight: 600,
            color: '#333'
          }}>
            {t('select_class') || 'Select Class'}
          </label>
          <Select
            searchable
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            options={[
              { value: '', label: t('select_class') || 'Select a class' },
              ...classes.map(cls => ({ value: cls.id, label: cls.name || cls.code || cls.id }))
            ]}
            fullWidth
          />
        </div>

        <div>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            fontWeight: 600,
            color: '#333'
          }}>
            {t('select_date') || 'Select Date'}
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          />
        </div>

        {viewMode === 'mark' && (
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: 600,
              color: '#333'
            }}>
              {t('filter_status') || 'Filter Status'}
            </label>
            <Select
              searchable
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={[
                { value: 'all', label: t('all') || 'All' },
                { value: 'present', label: t('present') || 'Present' },
                { value: 'absent', label: t('absent') || 'Absent' }
              ]}
              fullWidth
            />
          </div>
        )}
      </div>

      {/* Stats Cards */}
      {selectedClass && viewMode === 'mark' && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #4ade80, #22c55e)',
            borderRadius: '12px',
            color: 'white',
            boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
          }}>
            <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>
              Present
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>
              {presentCount}
            </div>
          </div>

          <div style={{
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #f87171, #ef4444)',
            borderRadius: '12px',
            color: 'white',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
          }}>
            <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>
              Absent
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>
              {absentCount}
            </div>
          </div>

          <div style={{
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
            borderRadius: '12px',
            color: 'white',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
          }}>
            <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>
              Attendance Rate
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>
              {attendanceRate}%
            </div>
          </div>

          <div style={{
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #a78bfa, #8b5cf6)',
            borderRadius: '12px',
            color: 'white',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
          }}>
            <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>
              Total Students
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>
              {studentsInClass.length}
            </div>
          </div>
        </div>
      )}

      {/* Mark Attendance View */}
      {viewMode === 'mark' && selectedClass && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
              {t('student_list') || 'Student List'}
            </h2>
            <Button
              variant="success"
              icon={<Download size={18} />}
              onClick={exportCSV}
            >
              {t('export') || 'Export CSV'}
            </Button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>#</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>
                    {t('student_name') || 'Student Name'}
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>
                    {t('email') || 'Email'}
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>
                    {t('status') || 'Status'}
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>
                    {t('actions') || 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {studentsInClass.map((student, index) => (
                  <tr 
                    key={student.id}
                    style={{ 
                      borderBottom: '1px solid #e5e7eb',
                      background: student.status === 'present' ? '#f0fdf4' : 'white'
                    }}
                  >
                    <td style={{ padding: '1rem' }}>{index + 1}</td>
                    <td style={{ padding: '1rem', fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <UserIcon size={18} />
                        {student.name}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', color: '#666' }}>{student.email}</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        background: student.status === 'present' ? '#dcfce7' : '#fee2e2',
                        color: student.status === 'present' ? '#166534' : '#991b1b'
                      }}>
                        {student.status === 'present' ? '✓ Present' : '✗ Absent'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleMarkAttendance(student.id, 'present')}
                          disabled={student.status === 'present'}
                          style={{
                            padding: '0.5rem 1rem',
                            background: student.status === 'present' ? '#d1d5db' : '#22c55e',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: student.status === 'present' ? 'not-allowed' : 'pointer',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <CheckCircle size={16} />
                          Present
                        </button>
                        <button
                          onClick={() => handleMarkAttendance(student.id, 'absent')}
                          disabled={student.status === 'absent'}
                          style={{
                            padding: '0.5rem 1rem',
                            background: student.status === 'absent' ? '#d1d5db' : '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: student.status === 'absent' ? 'not-allowed' : 'pointer',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <XCircle size={16} />
                          Absent
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {studentsInClass.length === 0 && (
            <div style={{ 
              padding: '3rem', 
              textAlign: 'center', 
              color: '#666' 
            }}>
              {t('no_students') || 'No students found in this class'}
            </div>
          )}
        </div>
      )}

      {/* History View - Placeholder */}
      {viewMode === 'history' && (
        <div style={{
          padding: '3rem',
          background: 'white',
          borderRadius: '12px',
          textAlign: 'center',
          color: '#666'
        }}>
          <Clock size={48} style={{ margin: '0 auto 1rem' }} />
          <h3>{t('attendance_history') || 'Attendance History'}</h3>
          <p>{t('coming_soon') || 'Coming soon...'}</p>
        </div>
      )}

      {/* Analytics View - Placeholder */}
      {viewMode === 'analytics' && (
        <div style={{
          padding: '3rem',
          background: 'white',
          borderRadius: '12px',
          textAlign: 'center',
          color: '#666'
        }}>
          <BarChart3 size={48} style={{ margin: '0 auto 1rem' }} />
          <h3>{t('attendance_analytics') || 'Attendance Analytics'}</h3>
          <p>{t('coming_soon') || 'Coming soon...'}</p>
        </div>
      )}
    </div>
  );
};

export default ManualAttendancePage;
