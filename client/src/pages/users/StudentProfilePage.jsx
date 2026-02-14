import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import logger from '@utils/logger';
import { getThemedIcon } from '@constants/iconTypes';
import { getUserBadges, getUserStats, getBadgeDefinitions } from '@services/business/badgeService';
import { getPrograms, getSubjects } from '@services/business/programService';
import { getClasses } from '@services/business/classService';
import { getEnrollments } from '@services/business/enrollmentService';
import { getUsers } from '@services/business/userService';
import { getAttendanceByStudent } from '@services/business/attendanceService';
import { getSubmissionsByUser } from '@services/business/submissionsService';
import { useSearchParams } from 'react-router-dom';
import { Container, Loading, Select } from '@ui';
import { StudentQRCodeDisplay } from '@ui';
import styles from './StudentProfilePage.module.css';

const StudentProfilePage = () => {
  const { user, isAdmin, isHR, isInstructor } = useAuth();
  const { t } = useLang();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [searchParams, setSearchParams] = useSearchParams();
  const [targetUserId, setTargetUserId] = useState(searchParams.get('uid') || user?.uid);
  
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState(null);
  
  // Debug studentData when it changes
  useEffect(() => {
    logger.log('StudentProfilePage - studentData updated:', studentData);
    logger.log('StudentProfilePage - studentData.role:', studentData?.role);
  }, [studentData]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [performanceData, setPerformanceData] = useState({
    homework: { completed: 0, total: 0, avgScore: 0 },
    quiz: { completed: 0, total: 0, avgScore: 0 },
    training: { completed: 0, total: 0, avgScore: 0 },
  });
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [badges, setBadges] = useState([]);
  const [allBadges, setAllBadges] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [allClasses, setAllClasses] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filters, setFilters] = useState({ classId: '', year: '', term: '', semester: '' });
  const [allStudents, setAllStudents] = useState([]);
  const [showStudentList, setShowStudentList] = useState(false);

  // Filter options for cascading dropdowns
  const programOptions = useMemo(() => {
    const opts = [
      { value: '', label: 'All Programs', icon: getThemedIcon('ui', 'filter', 16, theme) }
    ];
    const validPrograms = programs
      .filter(prog => prog.docId || prog.id)
      .map(prog => {
        const value = prog.docId || prog.id;
        const label = prog.name || prog.name_en || prog.name_ar || value;
        return { value, label, icon: getThemedIcon('ui', 'book_open', 16, theme) };
      });
    return [...opts, ...validPrograms];
  }, [programs]);

  const subjectOptions = useMemo(() => {
    const opts = [
      { value: '', label: 'All Subjects', icon: getThemedIcon('ui', 'filter', 16, theme) }
    ];
    const validSubjects = subjects
      .filter(sub => {
        if (!filters.programId) return true;
        const subProgramId = sub.programId || sub.program || '';
        const formProgramId = filters.programId;
        return subProgramId === formProgramId;
      })
      .map(sub => {
        const value = sub.docId || sub.id;
        const label = sub.name || sub.name_en || sub.name_ar || value;
        return { value, label, icon: getThemedIcon('ui', 'book_open', 16, theme) };
      });
    return [...opts, ...validSubjects];
  }, [subjects, filters.programId]);

  const classOptions = useMemo(() => {
    const opts = [
      { value: '', label: 'All Classes', icon: getThemedIcon('ui', 'filter', 16, theme) }
    ];
    const validClasses = allClasses
      .filter(cls => {
        if (!filters.programId && !filters.subjectId) return true;
        const clsProgramId = cls.programId || cls.programDocId || '';
        const clsSubjectId = cls.subjectId || cls.subjectDocId || '';
        const formProgramId = filters.programId;
        const formSubjectId = filters.subjectId;
        
        if (formProgramId && clsProgramId !== formProgramId) return false;
        if (formSubjectId && clsSubjectId !== formSubjectId) return false;
        return true;
      })
      .map(cls => {
        const value = cls.docId || cls.id;
        const label = `${cls.name || cls.code || cls.id} - ${cls.term || ''} ${cls.year || ''}`;
        return { value, label, icon: getThemedIcon('ui', 'book_open', 16, theme) };
      });
    return [...opts, ...validClasses];
  }, [allClasses, filters.programId, filters.subjectId]);

  const yearOptions = useMemo(() => {
    const opts = [
      { value: '', label: 'All Years', icon: getThemedIcon('ui', 'filter', 16, theme) }
    ];
    const validYears = [...new Set(allClasses.map(c => c.year || c.academicYear).filter(Boolean))]
      .map(year => ({
        value: year,
        label: year,
        icon: getThemedIcon('ui', 'book_open', 16, theme)
      }));
    return [...opts, ...validYears];
  }, [allClasses]);

  const termOptions = useMemo(() => {
    const opts = [
      { value: '', label: 'All Terms', icon: getThemedIcon('ui', 'filter', 16, theme) }
    ];
    const validTerms = [...new Set(allClasses.map(c => c.term || c.sessionTerm).filter(Boolean))]
      .map(term => ({
        value: term,
        label: term,
        icon: getThemedIcon('ui', 'book_open', 16, theme)
      }));
    return [...opts, ...validTerms];
  }, [allClasses]);

  const semesterOptions = useMemo(() => {
    const opts = [
      { value: '', label: 'All Semesters', icon: getThemedIcon('ui', 'filter', 16, theme) }
    ];
    const validSemesters = [...new Set(allClasses.map(c => c.semester).filter(Boolean))]
      .map(semester => ({
        value: semester,
        label: semester,
        icon: getThemedIcon('ui', 'book_open', 16, theme)
      }));
    return [...opts, ...validSemesters];
  }, [allClasses]);

  const canViewOthers = isAdmin || isHR || isInstructor;

  useEffect(() => {
    if (canViewOthers) {
      loadAllClasses();
    }
  }, [canViewOthers]);

  useEffect(() => {
    if (targetUserId) {
      loadStudentProfile();
    }
  }, [targetUserId, filters]);

  // Sync URL when target changes
  useEffect(() => {
    if (!targetUserId) return;
    const params = new URLSearchParams(searchParams);
    if (params.get('uid') !== targetUserId) {
      params.set('uid', targetUserId);
      setSearchParams(params, { replace: true });
    }
  }, [targetUserId]);

  const loadAllClasses = async () => {
    try {
      // Load programs
      const programsResult = await getPrograms();
      const programsData = programsResult.success ? programsResult.data : [];
      setPrograms(programsData);
      
      // Load subjects  
      const subjectsResult = await getSubjects();
      const subjectsData = subjectsResult.success ? subjectsResult.data : [];
      setSubjects(subjectsData);
      
      // Load classes
      const classesResult = await getClasses();
      let classesData = classesResult.success ? classesResult.data : [];
      
      // If instructor (not admin/HR), filter by their classes only
      if (isInstructor && !isAdmin && !isHR) {
        classesData = classesData.filter(c => c.instructorId === user.uid);
      }
      
      setAllClasses(classesData);
      
      // Load all enrolled students from these classes
      await loadEnrolledStudents(classesData.map(c => c.id || c.docId));
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const loadEnrolledStudents = async (classIds) => {
    if (classIds.length === 0) return;
    try {
      const enrollmentsResult = await getEnrollments();
      const enrollmentsData = enrollmentsResult.success ? enrollmentsResult.data : [];
      const filteredEnrollments = enrollmentsData.filter(e => 
        classIds.slice(0, 10).includes(e.classId)
      );
      const studentIds = [...new Set(filteredEnrollments.map(e => e.userId))];
      
      // Load student user data
      const usersResult = await getUsers();
      const allUsers = usersResult.success ? usersResult.data : [];
      const students = allUsers.filter(user => 
        studentIds.includes(user.docId || user.id) && user.role === 'student'
      );
      setAllStudents(students);
    } catch (error) {
      console.error('Error loading enrolled students:', error);
    }
  };

  const loadStudentProfile = async () => {
    try {
      // Load student user data
      const usersResult = await getUsers();
      if (usersResult.success) {
        const student = usersResult.data.find(u => (u.docId || u.id) === targetUserId);
        if (student) {
          setStudentData(student);
        } else {
          logger.warn('Student not found:', targetUserId);
        }
      }

      // Load attendance data per class
      await loadAttendanceData();

      // Load performance data
      await loadPerformanceData();

      // Load badges and stats
      await loadBadgesAndStats();
    } catch (error) {
      console.error('Error loading student profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBadgesAndStats = async () => {
    try {
      const [badgesResult, statsResult, allBadgesResult] = await Promise.all([
        getUserBadges(targetUserId),
        getUserStats(targetUserId),
        getBadgeDefinitions()
      ]);

      if (badgesResult.success) {
        setBadges(badgesResult.data);
      }
      if (statsResult.success && statsResult.data) {
        setUserStats(statsResult.data);
      }
      if (allBadgesResult.success) {
        setAllBadges(allBadgesResult.data);
      }
    } catch (error) {
      console.error('Error loading badges and stats:', error);
    }
  };

  const totals = useMemo(() => {
    let total = 0, present = 0, absent = 0, late = 0, leave = 0;
    for (const c of attendanceData) {
      total += c.total; present += c.present; absent += c.absent; late += c.late; leave += c.leave;
    }
    const rate = total > 0 ? ((present / total) * 100).toFixed(1) : '0.0';
    return { total, present, absent, late, leave, rate };
  }, [attendanceData]);

  const searchUsers = async (text) => {
    if (!canViewOthers) return;
    const q = text.trim();
    setSearchText(text);
    if (!q) { setSearchResults([]); return; }
    try {
      setSearchLoading(true);
      // Simple client-side search using all students data
      const usersResult = await getUsers();
      if (usersResult.success) {
        const allStudents = usersResult.data.filter(user => user.role === 'student');
        const searchQuery = q.toLowerCase();
        
        const filtered = allStudents.filter(student => 
          (student.email && student.email.toLowerCase().includes(searchQuery)) ||
          (student.displayName && student.displayName.toLowerCase().includes(searchQuery)) ||
          (student.name && student.name.toLowerCase().includes(searchQuery))
        ).slice(0, 8);
        
        setSearchResults(filtered);
      }
    } catch (e) {
      console.warn('searchUsers:', e);
    } finally {
      setSearchLoading(false);
    }
  };

  const loadAttendanceData = async () => {
    try {
      // Get attendance data for the student
      const attendanceResult = await getAttendanceByStudent(targetUserId);
      const attendanceData = attendanceResult.success ? attendanceResult.data : [];
      
      const classAttendance = {};

      for (const attendance of attendanceData) {
        const classId = attendance.classId;

        // Apply filters
        if (filters.classId && classId !== filters.classId) continue;

        // Get mark for this student in this session
        const markDoc = await getDoc(doc(db, 'attendanceSessions', sessionDoc.id, 'marks', targetUserId));
        
        if (!classAttendance[classId]) {
          classAttendance[classId] = {
            classId,
            className: 'Loading...',
            classData: null,
            total: 0,
            present: 0,
            absent: 0,
            late: 0,
            leave: 0,
          };
        }

        classAttendance[classId].total++;

        if (markDoc.exists()) {
          const markData = markDoc.data();
          const status = markData.status || 'absent';
          classAttendance[classId][status]++;
        } else {
          classAttendance[classId].absent++;
        }
      }

      // Load class names and apply additional filters
      const filteredClasses = {};
      for (const classId in classAttendance) {
        try {
          const classDoc = await getDoc(doc(db, 'classes', classId));
          if (classDoc.exists()) {
            const classData = classDoc.data();
            classAttendance[classId].className = classData.name || classData.name_en || classId;
            classAttendance[classId].classData = classData;

            // Apply year/term/semester filters
            if (filters.year && String(classData.year || classData.academicYear) !== String(filters.year)) continue;
            if (filters.term && (classData.term || classData.sessionTerm) !== filters.term) continue;
            if (filters.semester && classData.semester !== filters.semester) continue;

            filteredClasses[classId] = classAttendance[classId];
          }
        } catch {}
      }

      setAttendanceData(Object.values(filteredClasses));
    } catch (error) {
      console.error('Error loading attendance data:', error);
    }
  };

  const loadPerformanceData = async () => {
    try {
      // Get all submissions for this student
      const submissionsResult = await getSubmissionsByUser(targetUserId);
      const submissionsData = submissionsResult.success ? submissionsResult.data : [];

      const performance = {
        homework: { completed: 0, total: 0, totalScore: 0, avgScore: 0 },
        quiz: { completed: 0, total: 0, totalScore: 0, avgScore: 0 },
        training: { completed: 0, total: 0, totalScore: 0, avgScore: 0 },
      };

      for (const submission of submissionsData) {
        const subData = submission;
        
        // Get activity type
        try {
          const activityDoc = await getDoc(doc(db, 'activities', subData.activityId));
          if (activityDoc.exists()) {
            const activityData = activityDoc.data();
            const type = activityData.type || 'training';
            
            if (performance[type]) {
              performance[type].total++;
              if (subData.status === 'completed' || subData.status === 'graded') {
                performance[type].completed++;
                if (subData.score !== undefined && subData.score !== null) {
                  performance[type].totalScore += subData.score;
                }
              }
            }
          }
        } catch {}
      }

      // Calculate averages
      Object.keys(performance).forEach(type => {
        if (performance[type].completed > 0) {
          performance[type].avgScore = (performance[type].totalScore / performance[type].completed).toFixed(1);
        }
      });

      setPerformanceData(performance);
    } catch (error) {
      console.error('Error loading performance data:', error);
    }
  };

  // Authentication check
  if (!user) {
    window.location.href = '/login';
    return <Loading variant="overlay" message={t('loading') || 'Loading...'} />;
  }

  if (loading) {
    return <Loading variant="overlay" message={t('loading') || 'Loading...'} />;
  }

  if (!studentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
          {getThemedIcon('ui', 'user', 64, theme)}
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Student Not Found
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.page} ${isDark ? 'dark' : ''}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className={styles.headerSection}>
          <div className="container mx-auto px-4">
            <div className={styles.headerContent}>
              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Student Info */}
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center">
                    {studentData?.avatar ? (
                      <img src={studentData.avatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      getThemedIcon('ui', 'user', 40, theme)
                    )}
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">
                      {studentData?.displayName || 
                       (studentData?.firstName && studentData?.lastName ? `${studentData.firstName} ${studentData.lastName}` : '') ||
                       studentData?.email?.split('@')[0] || 
                       'Unknown Student'}
                    </h1>
                    <p className="text-white/80 text-lg">{studentData?.email || 'No email'}</p>
                    {studentData?.studentNumber && (
                      <div className="mt-2">
                        <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm text-white font-medium">
                          Student ID: {studentData.studentNumber}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Search */}
                {canViewOthers && (
                  <div className={styles.searchContainer}>
                    {getThemedIcon('ui', 'search', 20, theme)}
                    <input
                      type="text"
                      value={searchText}
                      onChange={(e) => searchUsers(e.target.value)}
                      placeholder="Search students by name or email..."
                      className={styles.searchInput}
                    />
                    {searchText && searchResults.length > 0 && (
                      <div className={styles.searchResults}>
                        {searchResults.map(s => (
                          <div
                            key={s.uid}
                            onClick={() => {
                              setTargetUserId(s.uid);
                              setSearchText('');
                              setSearchResults([]);
                            }}
                            className={styles.searchResultItem}
                          >
                            <div className={styles.searchResultAvatar}>
                              {(s.displayName || s.email || '').charAt(0).toUpperCase()}
                            </div>
                            <div className={styles.searchResultInfo}>
                              <div className={styles.searchResultName}>
                                {s.displayName || s.email?.split('@')[0] || 'Unknown'}
                              </div>
                              <div className={styles.searchResultEmail}>
                                {s.email}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filters (Admin/Instructor only) */}
        {canViewOthers && (
          <div className={styles.filtersSection}>
            <div className={styles.filtersHeader}>
              <h3 className={styles.filtersTitle}>Filters</h3>
              <button
                onClick={() => setShowStudentList(!showStudentList)}
                className={styles.toggleStudentListBtn}
              >
                {getThemedIcon('ui', 'user', 16, theme)}
                {showStudentList ? 'Hide Student List' : 'Show All Students'}
              </button>
            </div>
            <div className={styles.filtersGrid}>
              <div>
                <Select
                  label="Class"
                  searchable
                  value={filters.classId}
                  onChange={(e) => setFilters({ ...filters, classId: e.target.value })}
                  options={classOptions}
                  fullWidth
                  className={styles.filterSelect}
                />
              </div>
              <div>
                <Select
                  label="Year"
                  searchable
                  value={filters.year}
                  onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                  options={yearOptions}
                  fullWidth
                  className={styles.filterSelect}
                />
              </div>
              <div>
                <Select
                  label="Term"
                  searchable
                  value={filters.term}
                  onChange={(e) => setFilters({ ...filters, term: e.target.value })}
                  options={termOptions}
                  fullWidth
                  className={styles.filterSelect}
                />
              </div>
              <div>
                <Select
                  label="Semester"
                  searchable
                  value={filters.semester}
                  onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
                  options={semesterOptions}
                  fullWidth
                  className={styles.filterSelect}
                />
              </div>
            </div>
          </div>
        )}

        {/* Student List View (Admin/Instructor only) */}
        {canViewOthers && showStudentList && (
          <div className="mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                {getThemedIcon('ui', 'users', 24, theme)}
                Students ({allStudents.length})
              </h2>
              {allStudents.length === 0 ? (
                <div className="text-center py-12">
                  {getThemedIcon('ui', 'user', 64, theme)}
                  <p className="text-gray-600 dark:text-gray-400">No students found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {allStudents.map((student) => (
                    <button
                      key={student.uid}
                      onClick={() => { setTargetUserId(student.uid); setShowStudentList(false); }}
                      className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-700 dark:to-gray-800 hover:from-purple-100 hover:to-blue-100 dark:hover:from-gray-600 dark:hover:to-gray-700 rounded-xl p-4 text-left transition-all transform hover:scale-105 shadow-md hover:shadow-xl border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-purple-600 dark:bg-purple-700 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {(student.displayName || student.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 dark:text-white truncate">
                            {student.displayName || 'No Name'}
                          </h3>
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{student.email}</p>
                        </div>
                      </div>
                      {student.studentNumber && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <FileText className="w-4 h-4" />
                          <span className="truncate">{student.studentNumber}</span>
                        </div>
                      )}
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Trophy className="w-3 h-3" />
                            View Profile
                          </span>
                          <span className="text-purple-600 dark:text-purple-400 font-medium">→</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Individual Student Profile (hide when showing list) */}
        {(!canViewOthers || !showStudentList) && (
          <>
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 hover:shadow-xl transition-shadow border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                {getThemedIcon('ui', 'calendar', 20, theme)}
              </div>
            </div>
            <div className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 mb-1">{t('total_sessions')}</div>
            <div className="text-3xl font-bold text-gray-800 dark:text-white">{totals.total}</div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl shadow-lg p-5 hover:shadow-xl transition-shadow border border-green-100 dark:border-green-800">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-xl flex items-center justify-center">
                {getThemedIcon('ui', 'check_circle', 20, theme)}
              </div>
            </div>
            <div className="text-xs uppercase font-semibold text-green-700 dark:text-green-400 mb-1">{t('present_count')}</div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{totals.present}</div>
          </div>
          
          <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-2xl shadow-lg p-5 hover:shadow-xl transition-shadow border border-red-100 dark:border-red-800">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-800 rounded-xl flex items-center justify-center">
                {getThemedIcon('ui', 'x_circle', 20, theme)}
              </div>
            </div>
            <div className="text-xs uppercase font-semibold text-red-700 dark:text-red-400 mb-1">{t('absent_count')}</div>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">{totals.absent}</div>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-2xl shadow-lg p-5 hover:shadow-xl transition-shadow border border-yellow-100 dark:border-yellow-800">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-800 rounded-xl flex items-center justify-center">
                {getThemedIcon('ui', 'clock', 20, theme)}
              </div>
            </div>
            <div className="text-xs uppercase font-semibold text-yellow-700 dark:text-yellow-400 mb-1">{t('late_count')}</div>
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{totals.late}</div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl shadow-lg p-5 hover:shadow-xl transition-shadow border border-blue-100 dark:border-blue-800">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-xl flex items-center justify-center">
                {getThemedIcon('ui', 'file_text', 20, theme)}
              </div>
            </div>
            <div className="text-xs uppercase font-semibold text-blue-700 dark:text-blue-400 mb-1">{t('leave_count')}</div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{totals.leave}</div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl shadow-lg p-5 hover:shadow-xl transition-shadow border border-purple-100 dark:border-purple-800">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-800 rounded-xl flex items-center justify-center">
                {getThemedIcon('ui', 'trending_up', 20, theme)}
              </div>
            </div>
            <div className="text-xs uppercase font-semibold text-purple-700 dark:text-purple-400 mb-1">{t('attendance_rate')}</div>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{totals.rate}%</div>
          </div>
        </div>

        {/* QR Code Display - Show for student profiles */}
        {logger.log('QR Code check - studentData:', studentData, 'role:', studentData?.role) || (
          <div className="mb-6">
            <StudentQRCodeDisplay 
              studentId={targetUserId} 
              showSettings={user?.uid === targetUserId || user?.isAdmin}
              compact={false}
            />
          </div>
        )}

        {/* Attendance Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 rounded-xl flex items-center justify-center">
              {getThemedIcon('ui', 'calendar', 24, theme)}
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              {t('attendance_summary')}
            </h2>
          </div>

          {attendanceData.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-300">{t('no_data')}</p>
          ) : (
            <div className="space-y-4">
              {attendanceData.map((classData, idx) => {
                const attendanceRate = classData.total > 0
                  ? ((classData.present / classData.total) * 100).toFixed(1)
                  : 0;

                return (
                  <div key={idx} className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 hover:shadow-lg transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center">
                        {getThemedIcon('ui', 'award', 20, theme)}
                      </div>
                      <h3 className="font-bold text-xl text-gray-800 dark:text-white">
                        {classData.className}
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center shadow-sm">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('total_sessions')}</p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-white">{classData.total}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center shadow-sm">
                        <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">{t('present_count')}</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{classData.present}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center shadow-sm">
                        <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">{t('absent_count')}</p>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">{classData.absent}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center shadow-sm">
                        <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400 mb-1">{t('late_count')}</p>
                        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{classData.late}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center shadow-sm">
                        <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">{t('leave_count')}</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{classData.leave}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center shadow-sm">
                        <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">{t('attendance_rate')}</p>
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{attendanceRate}%</p>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Attendance Progress</span>
                        <span className="text-sm font-bold text-purple-600 dark:text-purple-400">{attendanceRate}%</span>
                      </div>
                      <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                        <div
                          className="h-3 bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500 rounded-full"
                          style={{ width: `${attendanceRate}%` }}
                          aria-label="Attendance progress"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Performance Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 rounded-xl flex items-center justify-center">
              {getThemedIcon('ui', 'trending_up', 24, theme)}
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              {t('performance_summary')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Homework */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                {getThemedIcon('ui', 'file_text', 20, theme)}
                <h3 className="font-semibold text-lg text-gray-800 dark:text-white">
                  {t('homework_performance')}
                </h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('completed_count')}:</span>
                  <span className="font-semibold text-gray-800 dark:text-white">
                    {performanceData.homework.completed} / {performanceData.homework.total}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('average_grade')}:</span>
                  <span className="font-semibold text-gray-800 dark:text-white">
                    {performanceData.homework.avgScore}
                  </span>
                </div>
              </div>
            </div>

            {/* Quiz */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                {getThemedIcon('ui', 'award', 20, theme)}
                <h3 className="font-semibold text-lg text-gray-800 dark:text-white">
                  {t('quiz_performance')}
                </h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('completed_count')}:</span>
                  <span className="font-semibold text-gray-800 dark:text-white">
                    {performanceData.quiz.completed} / {performanceData.quiz.total}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('average_grade')}:</span>
                  <span className="font-semibold text-gray-800 dark:text-white">
                    {performanceData.quiz.avgScore}
                  </span>
                </div>
              </div>
            </div>

            {/* Training/Activities */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                {getThemedIcon('ui', 'clock', 20, theme)}
                <h3 className="font-semibold text-lg text-gray-800 dark:text-white">
                  {t('activity_performance')}
                </h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('completed_count')}:</span>
                  <span className="font-semibold text-gray-800 dark:text-white">
                    {performanceData.training.completed} / {performanceData.training.total}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('average_grade')}:</span>
                  <span className="font-semibold text-gray-800 dark:text-white">
                    {performanceData.training.avgScore}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Badges & Achievements Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mt-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {getThemedIcon('ui', 'trophy', 24, theme)}
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                {t('badges_achievements') || 'Badges & Achievements'}
              </h2>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {badges.length} / {allBadges.length} {t('earned') || 'earned'}
            </div>
          </div>

          {/* Stats Cards */}
          {userStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('login_streak') || 'Login Streak'}
                  </span>
                </div>
                <div className="text-3xl font-bold text-orange-600">
                  {userStats.loginStreak || 0} {t('days') || 'days'}
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('time_spent') || 'Time Spent'}
                  </span>
                </div>
                <div className="text-3xl font-bold text-blue-600">
                  {Math.floor((userStats.totalTimeSpent || 0) / 3600)}h
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  {getThemedIcon('ui', 'target', 20, theme)}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('avg_score') || 'Avg Score'}
                  </span>
                </div>
                <div className="text-3xl font-bold text-green-600">
                  {userStats.averageScore || 0}%
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-2">
                  {getThemedIcon('ui', 'award', 20, theme)}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('perfect_scores') || 'Perfect Scores'}
                  </span>
                </div>
                <div className="text-3xl font-bold text-purple-600">
                  {userStats.perfectScores || 0}
                </div>
              </div>
            </div>
          )}

          {/* Recent Badges (compact row) */}
          {badges && badges.length > 0 && (
            <div className="mb-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('recent_badges') || 'Recent Badges'}</div>
              <div className="flex items-center gap-2 flex-wrap">
                {badges
                  .slice()
                  .sort((a,b)=>{
                    const at = a.earnedAt?.seconds ? a.earnedAt.seconds : 0;
                    const bt = b.earnedAt?.seconds ? b.earnedAt.seconds : 0;
                    return bt - at;
                  })
                  .slice(0,6)
                  .map((b, i) => {
                    const def = allBadges.find(x => x.id === b.badgeId) || {};
                    return (
                      <div key={b.badgeId+':'+i} className="flex items-center gap-2 px-2 py-1 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs">
                        <span className="text-base leading-none">{def.icon || '🏅'}</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">{def.name || b.badgeId}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Badges Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {allBadges.map(badge => {
              const earned = badges.find(b => b.badgeId === badge.id);
              const isEarned = !!earned;

              return (
                <div
                  key={badge.id}
                  className={`relative rounded-xl p-4 transition-all duration-300 ${
                    isEarned
                      ? 'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/30 border-2 border-yellow-300 dark:border-yellow-700 shadow-lg hover:scale-105'
                      : 'bg-gray-100 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 opacity-50'
                  }`}
                  style={{
                    cursor: isEarned ? 'pointer' : 'default'
                  }}
                  title={badge.description}
                >
                  {/* Badge Icon */}
                  <div className="text-center mb-2">
                    <div className={`text-4xl ${!isEarned && 'grayscale'}`}>
                      {badge.icon}
                    </div>
                  </div>

                  {/* Badge Name */}
                  <div className="text-center">
                    <div className={`text-xs font-semibold ${
                      isEarned ? 'text-gray-800 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {badge.name}
                    </div>
                    
                    {/* Progress or Earned Date */}
                    {isEarned ? (
                      <div className="text-[10px] text-gray-600 dark:text-gray-400 mt-1">
                        {earned.earnedAt && new Date(earned.earnedAt.seconds * 1000).toLocaleDateString()}
                      </div>
                    ) : (
                      badge.requirement && (
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                          0 / {badge.requirement}
                        </div>
                      )
                    )}
                  </div>

                  {/* Earned Checkmark */}
                  {isEarned && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                      {getThemedIcon('ui', 'check', 16, theme)}
                    </div>
                  )}

                  {/* Points Badge */}
                  {badge.points && isEarned && (
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md">
                      +{badge.points}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* No Badges Message */}
          {allBadges.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              {getThemedIcon('ui', 'trophy', 64, theme)}
              <p>{t('no_badges_available') || 'No badges available yet'}</p>
            </div>
          )}
        </div>
        </>
        )}
      </div>
    </div>
  );
};

export default StudentProfilePage;
