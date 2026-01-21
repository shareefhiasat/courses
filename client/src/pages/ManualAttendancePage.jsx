import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { useTheme } from '../contexts/ThemeContext';
import { Container, Loading, Button, Select, Card, EmptyState } from '../components/ui';
import { 
  Calendar, Users, CheckCircle, XCircle, Clock, Download, 
  Filter, Search, BarChart3, TrendingUp, User as UserIcon,
  AlertCircle, Award, Target, Activity, BookOpen, QrCode
} from 'lucide-react';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, orderBy, limit as fbLimit } from 'firebase/firestore';
import { getSubjects, getPrograms } from '../firebase/programs';
import { 
  getAttendanceByClass, 
  getAttendanceByStudent, 
  markAttendance,
  getAttendanceStats,
  ATTENDANCE_STATUS,
  ATTENDANCE_STATUS_LABELS
} from '../firebase/attendance';
import { addActivityLog } from '../firebase/firestore';
import { getCardConfig, getShapeRadius } from '../utils/cardColors';
import styles from './ManualAttendancePage.module.css';

const ManualAttendancePage = () => {
  const { user, isAdmin, isInstructor } = useAuth();
  const { t } = useLang();
  const { isDark, theme } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
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

  // Get dynamic accent color from theme
  const accentColor = useMemo(() => {
    try {
      const savedColor = localStorage.getItem('userMessageColor');
      return savedColor || (theme?.accent || '#800020');
    } catch {
      return theme?.accent || '#800020';
    }
  }, [theme]);

  // Utility function to ensure string values
  const ensureString = (value) => {
    if (value === null || value === undefined) return '';
    return String(value);
  };

  // Filter state variables
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const programOptions = useMemo(() => {
    const opts = [
      { value: '', label: 'All Programs', icon: <Filter size={16} color="#374151" /> }
    ];
    const validPrograms = programs.map(prog => {
      const value = ensureString(prog.docId || prog.id);
      const label = prog.name || prog.name_en || prog.name_ar || value;
      return { value, label, icon: <BookOpen size={16} color="#374151" /> };
    });
    return [...opts, ...validPrograms];
  }, [programs, t]);

  const subjectOptions = useMemo(() => {
    const opts = [
      { value: '', label: 'All Subjects', icon: <Filter size={16} color="#374151" /> }
    ];
    
    const validSubjects = subjects
      .filter(sub => {
        if (!selectedProgram) return true;
        const subProgramId = ensureString(sub.programId || sub.program || '');
        const formProgramId = ensureString(selectedProgram);
        return subProgramId === formProgramId;
      })
      .map(sub => {
        const value = ensureString(sub.docId || sub.id);
        const label = sub.name || sub.name_en || sub.name_ar || value;
        return { value, label, icon: <BookOpen size={16} color="#374151" /> };
      });
      
    return [...opts, ...validSubjects];
  }, [subjects, selectedProgram, t]);

  const classOptions = useMemo(() => {
    const opts = [
      { value: '', label: 'All Classes', icon: <Filter size={16} color="#374151" /> }
    ];
    
    // Create subject to program mapping
    const subjectToProgramMap = {};
    subjects.forEach(subject => {
      const subjectId = ensureString(subject.docId || subject.id);
      const programId = ensureString(subject.programId || subject.program || '');
      if (programId) {
        subjectToProgramMap[subjectId] = programId;
      }
    });
    
    const validClasses = classes
      .filter(cls => {
        if (!selectedProgram && !selectedSubject) return true;
        
        const clsSubjectId = ensureString(cls.subjectId || cls.subjectDocId || '');
        const clsProgramId = ensureString(cls.programId || cls.programDocId || '') || 
                           subjectToProgramMap[clsSubjectId] || '';
        
        const formProgramId = ensureString(selectedProgram);
        const formSubjectId = ensureString(selectedSubject);
        
        if (formProgramId && clsProgramId !== formProgramId) return false;
        if (formSubjectId && clsSubjectId !== formSubjectId) return false;
        return true;
      })
      .map(cls => {
        const value = ensureString(cls.docId || cls.id);
        const label = `${cls.name || cls.code || cls.id} - ${cls.term || ''} ${cls.year || ''}`;
        return { value, label, icon: <BookOpen size={16} color="#374151" /> };
      });
      
    return [...opts, ...validClasses];
  }, [classes, selectedProgram, selectedSubject, subjects, t]);

  useEffect(() => {
    if (user && (isAdmin || isInstructor)) {
      loadData();
    }
  }, [user, isAdmin, isInstructor]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [classesRes, enrollmentsRes, usersRes, programsRes, subjectsRes] = await Promise.all([
        getClasses(),
        getEnrollments(),
        getUsers(),
        getPrograms(),
        getSubjects()
      ]);

      let classesData = [];
      if (classesRes.success) {
        classesData = classesRes.data || [];
        
        // Filter classes by instructor if not admin
        if (!isAdmin && isInstructor && user) {
          const instructorClasses = classesData.filter(cls => 
            cls.instructorId === user.uid || 
            cls.createdBy === user.uid ||
            cls.ownerId === user.uid
          );
          classesData = instructorClasses;
        }
      }
      
      if (enrollmentsRes.success) setEnrollments(enrollmentsRes.data || []);
      if (usersRes.success) setUsers(usersRes.data || []);
      if (programsRes.success) setPrograms(programsRes.data || []);
      if (subjectsRes.success) setSubjects(subjectsRes.data || []);
      setClasses(classesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendance = async () => {
    if (!selectedClass || !selectedDate) return;
    
    try {
      const attendanceData = await getAttendanceByClass(selectedClass, selectedDate);
      setAttendance(attendanceData || {});
    } catch (error) {
      console.error('Error loading attendance:', error);
    }
  };

  const loadHistory = async () => {
    if (!selectedClass) return;
    
    setHistoryLoading(true);
    try {
      const records = await getAttendanceByStudent(selectedClass);
      setHistoryRecords(records || []);
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
      const data = await getAttendanceStats(selectedClass);
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleMarkAttendance = async (studentId, status) => {
    try {
      await markAttendance(selectedClass, studentId, selectedDate, status);
      setAttendance(prev => ({
        ...prev,
        [studentId]: status
      }));
      
      // Log activity
      await addActivityLog({
        type: 'attendance_marked',
        userId: user.uid,
        classId: selectedClass,
        studentId,
        status,
        date: selectedDate,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error marking attendance:', error);
    }
  };

  const handleBulkMark = (status) => {
    const studentsInClass = enrollments
      .filter(e => e.classId === selectedClass)
      .map(e => e.userId);
    
    studentsInClass.forEach(studentId => {
      handleMarkAttendance(studentId, status);
    });
  };

  const exportAttendance = () => {
    // Export logic here
    console.log('Exporting attendance...');
  };

  // Get students enrolled in selected class (exclude instructors)
  const studentsInClass = enrollments
    .filter(e => {
      const matchesClass = e.classId === selectedClass;
      // Include if role is 'student' OR if role is not set (default to student) OR if role is not 'instructor'
      const isStudent = !e.role || e.role === 'student' || (e.role !== 'instructor' && e.role !== 'admin');
      return matchesClass && isStudent;
    })
    .map(e => {
      const student = users.find(u => u.docId === e.userId || u.id === e.userId);
      return {
        id: e.userId,
        name: student?.displayName || student?.email || e.userId,
        email: student?.email || '',
        status: attendance[e.userId] || 'absent'
      };
    })
    .filter(s => {
      // Apply status filter
      if (selectedStatus && selectedStatus !== 'all') {
        return s.status === selectedStatus;
      }
      return true;
    });

  const presentCount = Object.values(attendance).filter(s => s === 'present' || s === ATTENDANCE_STATUS.PRESENT).length;
  const absentCount = Object.values(attendance).filter(s => 
    s === 'absent' || s === ATTENDANCE_STATUS.ABSENT_NO_EXCUSE || s === ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE
  ).length;
  const lateCount = Object.values(attendance).filter(s => s === 'late' || s === ATTENDANCE_STATUS.LATE).length;
  const excusedCount = Object.values(attendance).filter(s => 
    s === ATTENDANCE_STATUS.EXCUSED_LEAVE || s === ATTENDANCE_STATUS.HUMAN_CASE
  ).length;
  const totalStudents = enrollments.filter(e => {
    const matchesClass = e.classId === selectedClass;
    const isStudent = !e.role || e.role === 'student' || (e.role !== 'instructor' && e.role !== 'admin');
    return matchesClass && isStudent;
  }).length;

  const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  useEffect(() => {
    if (selectedClass && selectedDate) {
      loadAttendance();
    }
  }, [selectedClass, selectedDate]);

  useEffect(() => {
    if (selectedClass && viewMode === 'history') {
      loadHistory();
    }
  }, [selectedClass, viewMode]);

  useEffect(() => {
    if (selectedClass && viewMode === 'analytics') {
      loadAnalytics();
    }
  }, [selectedClass, viewMode]);

  // Authentication and authorization check
  if (!user) {
    // Redirect to login if not authenticated
    window.location.href = '/login';
    return (
      <div className={`${styles.page} ${isDark ? 'dark' : ''}`} style={{ '--attendance-accent': accentColor }}>
        <Container>
          <Loading />
        </Container>
      </div>
    );
  }

  if (!isAdmin && !isInstructor) {
    // Redirect to home if not authorized
    window.location.href = '/';
    return (
      <div className={`${styles.page} ${isDark ? 'dark' : ''}`} style={{ '--attendance-accent': accentColor }}>
        <Container>
          <Loading />
        </Container>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`${styles.page} ${isDark ? 'dark' : ''}`} style={{ '--attendance-accent': accentColor }}>
        <Container>
          <Loading />
        </Container>
      </div>
    );
  }

  return (
    <div className={`${styles.page} ${isDark ? 'dark' : ''}`} style={{ '--attendance-accent': accentColor }}>
      <Container>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.container}>
            {/* View Mode Tabs */}
            <div className={styles.viewTabs}>
              <button
                className={`${styles.tabButton} ${viewMode === 'mark' ? styles.tabButtonActive : ''}`}
                onClick={() => setViewMode('mark')}
              >
                <QrCode size={18} />
                {t('mark_attendance') || 'Mark Attendance'}
              </button>
              <button
                className={`${styles.tabButton} ${viewMode === 'history' ? styles.tabButtonActive : ''}`}
                onClick={() => setViewMode('history')}
              >
                <Clock size={18} />
                {t('history') || 'History'}
              </button>
              <button
                className={`${styles.tabButton} ${viewMode === 'analytics' ? styles.tabButtonActive : ''}`}
                onClick={() => setViewMode('analytics')}
              >
                <BarChart3 size={18} />
                {t('analytics') || 'Analytics'}
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filtersCard}>
          <div className={styles.filtersGrid}>
            <div>
              <Select
                searchable
                value={selectedProgram}
                onChange={(e) => {
                  setSelectedProgram(e.target.value);
                  setSelectedSubject('');
                  setSelectedClass('');
                }}
                options={programOptions}
                fullWidth
                placeholder="Program"
              />
            </div>

            <div>
              <Select
                searchable
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setSelectedClass('');
                }}
                options={subjectOptions}
                fullWidth
                disabled={!selectedProgram}
                placeholder="Subject"
              />
            </div>

            <div>
              <Select
                searchable
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                options={classOptions}
                fullWidth
                disabled={!selectedSubject}
                placeholder="Class"
              />
            </div>

            <div>
              <Select
                searchable
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                options={[
                  { value: '', label: 'All Years' },
                  ...[...new Set(classes.map(c => {
                    // Try different year fields
                    if (c.year) return String(c.year);
                    if (c.academicYear) return String(c.academicYear);
                    // Extract from term like "FALL 2025"
                    if (c.term && typeof c.term === 'string') {
                      const parts = c.term.split(' ');
                      if (parts.length > 1) {
                        const year = parts[parts.length - 1];
                        if (/^\d{4}$/.test(year)) return year;
                      }
                    }
                    return null;
                  }).filter(Boolean))].sort((a, b) => b.localeCompare(a)).map((y) => ({ value: y, label: y }))
                ]}
                fullWidth
                placeholder="Year"
              />
            </div>

            <div>
              <Select
                searchable
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                options={[
                  { value: '', label: 'All Terms' },
                  ...[...new Set(classes.map(c => {
                    // Try different term fields
                    if (c.term && typeof c.term === 'string') {
                      // Extract term part from "FALL 2025"
                      const parts = c.term.split(' ');
                      if (parts.length > 1) {
                        return parts[0]; // "FALL"
                      }
                      return c.term; // If it's just "FALL"
                    }
                    if (c.sessionTerm) return String(c.sessionTerm);
                    return null;
                  }).filter(Boolean))].sort().map((t) => ({ value: t, label: t }))
                ]}
                fullWidth
                placeholder="Term"
              />
            </div>

            <div>
              <Select
                searchable
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                options={[
                  { value: '', label: 'All Status' },
                  { value: 'present', label: 'Present' },
                  { value: 'absent', label: 'Absent' },
                  { value: 'late', label: 'Late' }
                ]}
                fullWidth
                placeholder="Status"
              />
            </div>

            {viewMode === 'mark' && (
              <>
                <div>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className={styles.dateInput}
                    placeholder="Select Date"
                  />
                </div>

                <div>
                  <Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    options={[
                      { value: 'all', label: 'All' },
                      { value: 'present', label: 'Present' },
                      { value: 'absent', label: 'Absent' },
                      { value: 'late', label: 'Late' }
                    ]}
                    fullWidth
                    placeholder="Filter Status"
                  />
                </div>
              </>
            )}

            {viewMode === 'history' && (
              <>
                <div>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={styles.dateInput}
                    placeholder="Start Date"
                  />
                </div>

                <div>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={styles.dateInput}
                    placeholder="End Date"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stats Cards (Mark View Only) */}
        {selectedClass && selectedClass !== '__placeholder__' && viewMode === 'mark' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {[
              {
                type: 'present',
                value: presentCount,
                label: t('present') || 'Present',
                icon: CheckCircle,
                color: '#22c55e'
              },
              {
                type: 'absent',
                value: absentCount,
                label: t('absent') || 'Absent',
                icon: XCircle,
                color: '#ef4444'
              },
              {
                type: 'late',
                value: lateCount,
                label: t('late') || 'Late',
                icon: Clock,
                color: '#f59e0b'
              },
              {
                type: 'rate',
                value: `${attendanceRate}%`,
                label: t('attendance_rate') || 'Attendance Rate',
                icon: TrendingUp,
                color: '#8b5cf6'
              },
              {
                type: 'total',
                value: totalStudents,
                label: t('total_students') || 'Total Students',
                icon: Users,
                color: '#3b82f6'
              }
            ].map((stat, idx) => {
              const config = getCardConfig(stat.type, t);
              const IconComponent = stat.icon;
              const borderRadius = getShapeRadius(config.shape);
              
              return (
                <Card
                  key={idx}
                  padding="xs"
                  style={{
                    cursor: 'default',
                    background: `linear-gradient(135deg, ${stat.color}22, ${stat.color}11)`,
                    border: `1px solid ${stat.color}33`,
                    borderRadius: borderRadius
                  }}
                >
                  <CardBody style={{ padding: '1rem', display: 'flex', flex: 1 }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      width: '100%' 
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: stat.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white'
                          }}>
                            <IconComponent size={20} />
                          </div>
                          <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--attendance-text)', lineHeight: 1 }}>
                              {stat.value}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--attendance-text-muted)', marginTop: '0.25rem' }}>
                              {stat.label}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}

        {/* Prompt to select class */}
        {viewMode === 'mark' && (!selectedClass) && (
          <div className={styles.emptyState}>
            <Calendar size={64} className={styles.emptyStateIcon} />
            <h3>{t('select_class_prompt') || 'Select a Class'}</h3>
            <p>{t('select_class_desc') || 'Please select a program, subject, and class from the dropdowns above to manage attendance'}</p>
          </div>
        )}

        {/* Mark Attendance View */}
        {viewMode === 'mark' && selectedClass && selectedClass !== '__placeholder__' && (
          <div className={styles.attendanceSection}>
            <div className={styles.attendanceHeader}>
              <h3>{t('mark_attendance') || 'Mark Attendance'}</h3>
              <div className={styles.bulkActions}>
                <Button onClick={() => handleBulkMark('present')} style={{ background: '#22c55e', color: 'white', marginRight: '0.5rem' }}>
                  {t('mark_all_present') || 'Mark All Present'}
                </Button>
                <Button onClick={() => handleBulkMark('absent')} style={{ background: '#ef4444', color: 'white', marginRight: '0.5rem' }}>
                  {t('mark_all_absent') || 'Mark All Absent'}
                </Button>
                <Button onClick={exportAttendance} style={{ background: '#3b82f6', color: 'white' }}>
                  <Download size={16} style={{ marginRight: '0.5rem' }} />
                  {t('export') || 'Export'}
                </Button>
              </div>
            </div>

            <div className={styles.attendanceGrid}>
              {studentsInClass.map(student => (
                <div key={student.id} className={styles.studentCard}>
                  <div className={styles.studentInfo}>
                    <div className={styles.studentName}>{student.name}</div>
                    <div className={styles.studentEmail}>{student.email}</div>
                  </div>
                  <div className={styles.attendanceActions}>
                    <Button
                      onClick={() => handleMarkAttendance(student.id, 'present')}
                      className={`${styles.attendanceBtn} ${styles.presentBtn}`}
                      disabled={attendance[student.id] === 'present'}
                    >
                      <CheckCircle size={16} />
                      {t('present') || 'Present'}
                    </Button>
                    <Button
                      onClick={() => handleMarkAttendance(student.id, 'absent')}
                      className={`${styles.attendanceBtn} ${styles.absentBtn}`}
                      disabled={attendance[student.id] === 'absent'}
                    >
                      <XCircle size={16} />
                      {t('absent') || 'Absent'}
                    </Button>
                    <Button
                      onClick={() => handleMarkAttendance(student.id, 'late')}
                      className={`${styles.attendanceBtn} ${styles.lateBtn}`}
                      disabled={attendance[student.id] === 'late'}
                    >
                      <Clock size={16} />
                      {t('late') || 'Late'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History View */}
        {viewMode === 'history' && selectedClass && (
          <div className={styles.historySection}>
            <h3>{t('attendance_history') || 'Attendance History'}</h3>
            {historyLoading ? (
              <Loading />
            ) : historyRecords.length > 0 ? (
              <div className={styles.historyGrid}>
                {historyRecords.map(record => (
                  <div key={record.id} className={styles.historyCard}>
                    <div className={styles.historyDate}>
                      {new Date(record.date).toLocaleDateString()}
                    </div>
                    <div className={styles.historyDetails}>
                      <div className={styles.historyStudent}>{record.studentName}</div>
                      <div className={styles.historyStatus}>{record.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Clock size={64} />}
                title={t('no_history') || 'No History Found'}
                description={t('no_history_desc') || 'No attendance records found for this class.'}
              />
            )}
          </div>
        )}

        {/* Analytics View */}
        {viewMode === 'analytics' && selectedClass && (
          <div className={styles.analyticsSection}>
            <h3>{t('attendance_analytics') || 'Attendance Analytics'}</h3>
            {analyticsLoading ? (
              <Loading />
            ) : analyticsData ? (
              <div className={styles.analyticsGrid}>
                {/* Analytics content here */}
              </div>
            ) : (
              <EmptyState
                icon={<BarChart3 size={64} />}
                title={t('no_analytics') || 'No Analytics Available'}
                description={t('no_analytics_desc') || 'Analytics data is not available for this class.'}
              />
            )}
          </div>
        )}
      </Container>
    </div>
  );
};

export default ManualAttendancePage;
