import React, { useState, useEffect, useMemo } from 'react';
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
import { Container, Loading, Button, Select, Card, EmptyState } from '../components/ui';
import { 
  Calendar, Users, CheckCircle, XCircle, Clock, Download, 
  Filter, Search, BarChart3, TrendingUp, User as UserIcon,
  AlertCircle, Award, Target, Activity
} from 'lucide-react';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, orderBy, limit as fbLimit } from 'firebase/firestore';
import styles from './ManualAttendancePage.module.css';

const ManualAttendancePage = () => {
  const { user, isAdmin, isInstructor } = useAuth();
  const { t } = useLang();
  
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState({});
  const [stats, setStats] = useState(null);
  const [viewMode, setViewMode] = useState('mark'); // 'mark' | 'history' | 'analytics'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'present' | 'absent' | 'late'
  
  // History view states
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Analytics states
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

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

  const loadHistory = async () => {
    if (!selectedClass) return;
    
    setHistoryLoading(true);
    try {
      let attendanceQuery = query(
        collection(db, 'attendance'),
        where('classId', '==', selectedClass),
        orderBy('date', 'desc'),
        fbLimit(100)
      );

      if (startDate && endDate) {
        attendanceQuery = query(
          collection(db, 'attendance'),
          where('classId', '==', selectedClass),
          where('date', '>=', startDate),
          where('date', '<=', endDate),
          orderBy('date', 'desc')
        );
      }

      const snapshot = await getDocs(attendanceQuery);
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setHistoryRecords(records);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadAnalytics = async () => {
    if (!selectedClass) return;
    
    setAnalyticsLoading(true);
    try {
      // Get all attendance records for the class
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('classId', '==', selectedClass)
      );
      
      const snapshot = await getDocs(attendanceQuery);
      const records = snapshot.docs.map(doc => doc.data());
      
      // Calculate analytics
      const totalRecords = records.length;
      const presentCount = records.filter(r => r.status === 'present').length;
      const absentCount = records.filter(r => r.status === 'absent').length;
      const lateCount = records.filter(r => r.status === 'late').length;
      
      // Trend data (last 7 days)
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayRecords = records.filter(r => r.date === dateStr);
        const dayPresent = dayRecords.filter(r => r.status === 'present').length;
        const dayTotal = dayRecords.length;
        const rate = dayTotal > 0 ? (dayPresent / dayTotal) * 100 : 0;
        
        last7Days.push({
          date: dateStr,
          label: date.toLocaleDateString('en-US', { weekday: 'short' }),
          rate: rate.toFixed(1),
          present: dayPresent,
          total: dayTotal
        });
      }
      
      // Student attendance rates
      const studentRates = {};
      const studentsInClass = enrollments
        .filter(e => e.classId === selectedClass && e.role === 'student')
        .map(e => e.userId);
      
      studentsInClass.forEach(studentId => {
        const studentRecords = records.filter(r => r.studentId === studentId);
        const studentPresent = studentRecords.filter(r => r.status === 'present').length;
        const total = studentRecords.length;
        const rate = total > 0 ? (studentPresent / total) * 100 : 0;
        
        const student = users.find(u => u.docId === studentId);
        studentRates[studentId] = {
          name: student?.displayName || student?.email || studentId,
          rate: rate.toFixed(1),
          present: studentPresent,
          total
        };
      });
      
      // Top students (sorted by attendance rate)
      const topStudents = Object.entries(studentRates)
        .sort((a, b) => parseFloat(b[1].rate) - parseFloat(a[1].rate))
        .slice(0, 5)
        .map(([id, data]) => ({ id, ...data }));
      
      // Class breakdown (if multiple classes)
      const classBreakdown = classes.map(cls => {
        const classRecords = records.filter(r => r.classId === cls.id);
        const classPresent = classRecords.filter(r => r.status === 'present').length;
        const classTotal = classRecords.length;
        const rate = classTotal > 0 ? (classPresent / classTotal) * 100 : 0;
        
        return {
          id: cls.id,
          name: cls.name || cls.code || cls.id,
          rate: rate.toFixed(1),
          present: classPresent,
          total: classTotal
        };
      }).filter(c => c.total > 0);
      
      setAnalyticsData({
        totalRecords,
        presentCount,
        absentCount,
        lateCount,
        overallRate: totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(1) : 0,
        last7Days,
        topStudents,
        classBreakdown
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClass && selectedDate && viewMode === 'mark') {
      loadAttendance();
    }
  }, [selectedClass, selectedDate, viewMode]);

  useEffect(() => {
    if (selectedClass && viewMode === 'mark') {
      loadStats();
    }
  }, [selectedClass, viewMode]);

  useEffect(() => {
    if (selectedClass && viewMode === 'history') {
      loadHistory();
    }
  }, [selectedClass, viewMode, startDate, endDate]);

  useEffect(() => {
    if (selectedClass && viewMode === 'analytics') {
      loadAnalytics();
    }
  }, [selectedClass, viewMode]);

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
            metadata: { 
              studentId, 
              studentName: student?.displayName || student?.email || 'Unknown', 
              classId: selectedClass, 
              date: selectedDate, 
              status, 
              markedBy: user.uid 
            }
          });
        } catch (e) { 
          console.warn('Failed to log attendance:', e); 
        }
        
        setAttendance(prev => ({ ...prev, [studentId]: status }));
        loadStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
    }
  };

  const handleBulkMark = async (status) => {
    if (!selectedClass || !selectedDate) return;
    
    const studentsInClass = enrollments
      .filter(e => e.classId === selectedClass && e.role === 'student')
      .map(e => e.userId);
    
    for (const studentId of studentsInClass) {
      await handleMarkAttendance(studentId, status);
    }
  };

  const exportAttendance = () => {
    const classData = classes.find(c => c.id === selectedClass);
    const className = classData?.name || classData?.code || selectedClass;
    
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

  const exportHistory = () => {
    const classData = classes.find(c => c.id === selectedClass);
    const className = classData?.name || classData?.code || selectedClass;
    
    const csvContent = [
      ['Date', 'Student', 'Status', 'Marked By', 'Method'],
      ...historyRecords.map(record => {
        const student = users.find(u => u.docId === record.studentId);
        const markedByUser = users.find(u => u.docId === record.markedBy);
        return [
          record.date,
          student?.displayName || student?.email || record.studentId,
          record.status,
          markedByUser?.displayName || markedByUser?.email || record.markedBy,
          record.method || 'manual'
        ];
      })
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance_history_${className}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!user || (!isAdmin && !isInstructor)) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return <Loading variant="fullscreen" message={t('loading') || 'Loading...'} />;
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
  const absentCount = Object.values(attendance).filter(s => s === 'absent').length;
  const lateCount = Object.values(attendance).filter(s => s === 'late').length;
  const totalStudents = enrollments.filter(e => e.classId === selectedClass && e.role === 'student').length;
  const attendanceRate = totalStudents > 0 
    ? ((presentCount / totalStudents) * 100).toFixed(1) 
    : 0;

  return (
    <div className={styles.page}>
      <Container>
        <div className={styles.container}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <Calendar size={32} className={styles.headerIcon} />
              <h1 className={styles.title}>
                {t('attendance_management') || 'Attendance Management'}
              </h1>
            </div>
            <p className={styles.subtitle}>
              {t('attendance_desc') || 'Professional attendance tracking with history and analytics'}
            </p>
          </div>

          {/* View Mode Tabs */}
          <div className={styles.viewModeTabs}>
            <button
              onClick={() => setViewMode('mark')}
              className={`${styles.tabButton} ${viewMode === 'mark' ? styles.tabButtonActive : ''}`}
            >
              <CheckCircle size={18} />
              {t('mark_attendance') || 'Mark Attendance'}
            </button>
            <button
              onClick={() => setViewMode('history')}
              className={`${styles.tabButton} ${viewMode === 'history' ? styles.tabButtonActive : ''}`}
            >
              <Clock size={18} />
              {t('history') || 'History'}
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              className={`${styles.tabButton} ${viewMode === 'analytics' ? styles.tabButtonActive : ''}`}
            >
              <BarChart3 size={18} />
              {t('analytics') || 'Analytics'}
            </button>
          </div>

          {/* Filters */}
          <div className={styles.filtersCard}>
            <div className={styles.filtersGrid}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>
                  {t('select_class') || 'Select Class'}
                </label>
                <Select
                  searchable
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  options={[
                    { value: '', label: t('select_class') || 'Select a class' },
                    ...classes.map(cls => ({ 
                      value: cls.id, 
                      label: cls.name || cls.code || cls.id 
                    }))
                  ]}
                  fullWidth
                />
              </div>

              {viewMode === 'mark' && (
                <>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>
                      {t('select_date') || 'Select Date'}
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className={styles.dateInput}
                    />
                  </div>

                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>
                      {t('filter_status') || 'Filter Status'}
                    </label>
                    <Select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      options={[
                        { value: 'all', label: t('all') || 'All' },
                        { value: 'present', label: t('present') || 'Present' },
                        { value: 'absent', label: t('absent') || 'Absent' },
                        { value: 'late', label: t('late') || 'Late' }
                      ]}
                      fullWidth
                    />
                  </div>
                </>
              )}

              {viewMode === 'history' && (
                <>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>
                      {t('start_date') || 'Start Date'}
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className={styles.dateInput}
                    />
                  </div>

                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>
                      {t('end_date') || 'End Date'}
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className={styles.dateInput}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Stats Cards (Mark View Only) */}
          {selectedClass && viewMode === 'mark' && (
            <div className={styles.statsGrid}>
              <div className={`${styles.statCard} ${styles.statCardPresent}`}>
                <div className={styles.statLabel}>{t('present') || 'Present'}</div>
                <div className={styles.statValue}>{presentCount}</div>
              </div>

              <div className={`${styles.statCard} ${styles.statCardAbsent}`}>
                <div className={styles.statLabel}>{t('absent') || 'Absent'}</div>
                <div className={styles.statValue}>{absentCount}</div>
              </div>

              <div className={`${styles.statCard} ${styles.statCardLate}`}>
                <div className={styles.statLabel}>{t('late') || 'Late'}</div>
                <div className={styles.statValue}>{lateCount}</div>
              </div>

              <div className={`${styles.statCard} ${styles.statCardRate}`}>
                <div className={styles.statLabel}>{t('attendance_rate') || 'Attendance Rate'}</div>
                <div className={styles.statValue}>{attendanceRate}%</div>
              </div>

              <div className={`${styles.statCard} ${styles.statCardTotal}`}>
                <div className={styles.statLabel}>{t('total_students') || 'Total Students'}</div>
                <div className={styles.statValue}>{totalStudents}</div>
              </div>
            </div>
          )}

          {/* Mark Attendance View */}
          {viewMode === 'mark' && selectedClass && (
            <div className={styles.markView}>
              <div className={styles.markHeader}>
                <h2 className={styles.markTitle}>
                  {t('student_list') || 'Student List'}
                </h2>
                <div className={styles.bulkActions}>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleBulkMark('present')}
                  >
                    {t('mark_all_present') || 'Mark All Present'}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleBulkMark('absent')}
                  >
                    {t('mark_all_absent') || 'Mark All Absent'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Download size={18} />}
                    onClick={exportAttendance}
                  >
                    {t('export') || 'Export'}
                  </Button>
                </div>
              </div>

              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead className={styles.tableHead}>
                    <tr>
                      <th>#</th>
                      <th>{t('student') || 'Student'}</th>
                      <th>{t('email') || 'Email'}</th>
                      <th style={{ textAlign: 'center' }}>{t('status') || 'Status'}</th>
                      <th style={{ textAlign: 'center' }}>{t('actions') || 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className={styles.tableBody}>
                    {studentsInClass.map((student, index) => (
                      <tr 
                        key={student.id}
                        className={
                          student.status === 'present' ? styles.tableRowPresent :
                          student.status === 'late' ? styles.tableRowLate : ''
                        }
                      >
                        <td>{index + 1}</td>
                        <td>
                          <div className={styles.studentInfo}>
                            <div className={styles.studentAvatar}>
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                            <div className={styles.studentDetails}>
                              <div className={styles.studentName}>{student.name}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className={styles.studentEmail}>{student.email}</div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`${styles.statusBadge} ${
                            student.status === 'present' ? styles.statusPresent :
                            student.status === 'late' ? styles.statusLate :
                            styles.statusAbsent
                          }`}>
                            {student.status === 'present' && <CheckCircle size={14} />}
                            {student.status === 'absent' && <XCircle size={14} />}
                            {student.status === 'late' && <Clock size={14} />}
                            {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                          </span>
                        </td>
                        <td>
                          <div className={styles.actionButtons}>
                            <button
                              onClick={() => handleMarkAttendance(student.id, 'present')}
                              disabled={student.status === 'present'}
                              className={`${styles.actionButton} ${styles.actionButtonPresent}`}
                            >
                              <CheckCircle size={16} />
                              {t('present') || 'Present'}
                            </button>
                            <button
                              onClick={() => handleMarkAttendance(student.id, 'late')}
                              disabled={student.status === 'late'}
                              className={`${styles.actionButton} ${styles.actionButtonLate}`}
                            >
                              <Clock size={16} />
                              {t('late') || 'Late'}
                            </button>
                            <button
                              onClick={() => handleMarkAttendance(student.id, 'absent')}
                              disabled={student.status === 'absent'}
                              className={`${styles.actionButton} ${styles.actionButtonAbsent}`}
                            >
                              <XCircle size={16} />
                              {t('absent') || 'Absent'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {studentsInClass.length === 0 && (
                <div className={styles.emptyState}>
                  <Users size={48} className={styles.emptyStateIcon} />
                  <p>{t('no_students') || 'No students found in this class'}</p>
                </div>
              )}
            </div>
          )}

          {/* History View */}
          {viewMode === 'history' && selectedClass && (
            <div className={styles.historyView}>
              <div className={styles.historyHeader}>
                <h2 className={styles.historyTitle}>
                  {t('attendance_history') || 'Attendance History'}
                </h2>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Download size={18} />}
                  onClick={exportHistory}
                  disabled={historyRecords.length === 0}
                >
                  {t('export') || 'Export'}
                </Button>
              </div>

              {historyLoading ? (
                <div style={{ padding: '3rem', textAlign: 'center' }}>
                  <Loading />
                </div>
              ) : (
                <div className={styles.historyList}>
                  {historyRecords.map(record => {
                    const student = users.find(u => u.docId === record.studentId);
                    const markedByUser = users.find(u => u.docId === record.markedBy);
                    
                    return (
                      <div key={record.id} className={styles.historyItem}>
                        <div className={styles.historyDate}>
                          <Calendar size={16} />
                          {new Date(record.date).toLocaleDateString('en-GB')}
                        </div>
                        <div className={styles.historyStudent}>
                          {student?.displayName || student?.email || record.studentId}
                        </div>
                        <div>
                          <span className={`${styles.statusBadge} ${
                            record.status === 'present' ? styles.statusPresent :
                            record.status === 'late' ? styles.statusLate :
                            styles.statusAbsent
                          }`}>
                            {record.status === 'present' && <CheckCircle size={14} />}
                            {record.status === 'absent' && <XCircle size={14} />}
                            {record.status === 'late' && <Clock size={14} />}
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          </span>
                        </div>
                        <div className={styles.historyMarkedBy}>
                          {markedByUser?.displayName || markedByUser?.email || record.markedBy}
                        </div>
                        <div className={styles.historyMarkedBy}>
                          {record.method || 'manual'}
                        </div>
                      </div>
                    );
                  })}
                  
                  {historyRecords.length === 0 && (
                    <div className={styles.emptyState}>
                      <Clock size={48} className={styles.emptyStateIcon} />
                      <p>{t('no_history') || 'No attendance history found'}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Analytics View */}
          {viewMode === 'analytics' && selectedClass && (
            <div className={styles.analyticsView}>
              {analyticsLoading ? (
                <div style={{ padding: '3rem', textAlign: 'center' }}>
                  <Loading />
                </div>
              ) : analyticsData ? (
                <>
                  {/* Overview Stats */}
                  <div className={styles.statsGrid}>
                    <div className={`${styles.statCard} ${styles.statCardPresent}`}>
                      <div className={styles.statLabel}>{t('total_present') || 'Total Present'}</div>
                      <div className={styles.statValue}>{analyticsData.presentCount}</div>
                    </div>

                    <div className={`${styles.statCard} ${styles.statCardAbsent}`}>
                      <div className={styles.statLabel}>{t('total_absent') || 'Total Absent'}</div>
                      <div className={styles.statValue}>{analyticsData.absentCount}</div>
                    </div>

                    <div className={`${styles.statCard} ${styles.statCardLate}`}>
                      <div className={styles.statLabel}>{t('total_late') || 'Total Late'}</div>
                      <div className={styles.statValue}>{analyticsData.lateCount}</div>
                    </div>

                    <div className={`${styles.statCard} ${styles.statCardRate}`}>
                      <div className={styles.statLabel}>{t('overall_rate') || 'Overall Rate'}</div>
                      <div className={styles.statValue}>{analyticsData.overallRate}%</div>
                    </div>

                    <div className={`${styles.statCard} ${styles.statCardTotal}`}>
                      <div className={styles.statLabel}>{t('total_records') || 'Total Records'}</div>
                      <div className={styles.statValue}>{analyticsData.totalRecords}</div>
                    </div>
                  </div>

                  {/* Analytics Cards */}
                  <div className={styles.analyticsGrid}>
                    {/* 7-Day Trend */}
                    <div className={styles.analyticsCard}>
                      <div className={styles.analyticsCardHeader}>
                        <div 
                          className={styles.analyticsCardIcon}
                          style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
                        >
                          <TrendingUp size={24} />
                        </div>
                        <h3 className={styles.analyticsCardTitle}>
                          {t('7_day_trend') || '7-Day Trend'}
                        </h3>
                      </div>
                      <div className={styles.trendChart}>
                        {analyticsData.last7Days.map((day, index) => (
                          <div
                            key={index}
                            className={styles.trendBar}
                            style={{ height: `${day.rate}%` }}
                            title={`${day.label}: ${day.rate}% (${day.present}/${day.total})`}
                          >
                            <div className={styles.trendBarLabel}>{day.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Top Students */}
                    <div className={styles.analyticsCard}>
                      <div className={styles.analyticsCardHeader}>
                        <div 
                          className={styles.analyticsCardIcon}
                          style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
                        >
                          <Award size={24} />
                        </div>
                        <h3 className={styles.analyticsCardTitle}>
                          {t('top_students') || 'Top Students'}
                        </h3>
                      </div>
                      <div className={styles.topStudents}>
                        {analyticsData.topStudents.map((student, index) => (
                          <div key={student.id} className={styles.topStudentItem}>
                            <div className={styles.topStudentRank}>{index + 1}</div>
                            <div className={styles.topStudentInfo}>
                              <div className={styles.topStudentName}>{student.name}</div>
                              <div className={styles.topStudentRate}>
                                {student.present}/{student.total} sessions
                              </div>
                            </div>
                            <div className={styles.topStudentBadge}>{student.rate}%</div>
                          </div>
                        ))}
                        
                        {analyticsData.topStudents.length === 0 && (
                          <div className={styles.emptyState}>
                            <p>{t('no_data') || 'No data available'}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Class Breakdown */}
                    {analyticsData.classBreakdown.length > 1 && (
                      <div className={styles.analyticsCard}>
                        <div className={styles.analyticsCardHeader}>
                          <div 
                            className={styles.analyticsCardIcon}
                            style={{ background: 'linear-gradient(135deg, #60a5fa, #3b82f6)' }}
                          >
                            <Target size={24} />
                          </div>
                          <h3 className={styles.analyticsCardTitle}>
                            {t('class_breakdown') || 'Class Breakdown'}
                          </h3>
                        </div>
                        <div className={styles.classBreakdown}>
                          {analyticsData.classBreakdown.map(cls => (
                            <div key={cls.id} className={styles.classBreakdownItem}>
                              <div className={styles.classBreakdownName}>{cls.name}</div>
                              <div className={styles.classBreakdownRate}>{cls.rate}%</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className={styles.emptyState}>
                  <BarChart3 size={48} className={styles.emptyStateIcon} />
                  <p>{t('no_analytics') || 'No analytics data available'}</p>
                </div>
              )}
            </div>
          )}

          {/* No Class Selected */}
          {!selectedClass && (
            <div className={styles.emptyState}>
              <AlertCircle size={48} className={styles.emptyStateIcon} />
              <p>{t('select_class_prompt') || 'Please select a class to continue'}</p>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
};

export default ManualAttendancePage;
