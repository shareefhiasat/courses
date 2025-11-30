import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit, startAt, endAt } from 'firebase/firestore';
import { User, Users, Calendar, TrendingUp, Award, FileText, Clock, Search, Trophy, Flame, Target, X } from 'lucide-react';
import { getUserBadges, getUserStats, getBadgeDefinitions } from '../firebase/badges';
import { useSearchParams } from 'react-router-dom';
import { Container, Loading, Select } from '../components/ui';
import styles from './StudentProfilePage.module.css';

const StudentProfilePage = () => {
  const { user, isAdmin, isHR, isInstructor } = useAuth();
  const { t } = useLang();
  const [searchParams, setSearchParams] = useSearchParams();
  const [targetUserId, setTargetUserId] = useState(searchParams.get('uid') || user?.uid);
  
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState(null);
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
  const [filters, setFilters] = useState({ classId: '', year: '', term: '', semester: '' });
  const [allStudents, setAllStudents] = useState([]);
  const [showStudentList, setShowStudentList] = useState(false);

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
      let classesQuery = collection(db, 'classes');
      
      // If instructor (not admin/HR), filter by their classes only
      if (isInstructor && !isAdmin && !isHR) {
        classesQuery = query(classesQuery, where('instructorId', '==', user.uid));
      }
      
      const classesSnap = await getDocs(classesQuery);
      const classes = classesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllClasses(classes);
      
      // Load all enrolled students from these classes
      await loadEnrolledStudents(classes.map(c => c.id));
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const loadEnrolledStudents = async (classIds) => {
    if (classIds.length === 0) return;
    try {
      const enrollmentsQuery = query(
        collection(db, 'enrollments'),
        where('classId', 'in', classIds.slice(0, 10)) // Firestore 'in' limit is 10
      );
      const enrollmentsSnap = await getDocs(enrollmentsQuery);
      const studentIds = [...new Set(enrollmentsSnap.docs.map(d => d.data().userId))];
      
      // Load student user data
      const students = [];
      for (const uid of studentIds) {
        try {
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (userDoc.exists()) {
            students.push({ uid, ...userDoc.data() });
          }
        } catch (e) {
          console.warn('Error loading student:', uid, e);
        }
      }
      setAllStudents(students);
    } catch (error) {
      console.error('Error loading enrolled students:', error);
    }
  };

  const loadStudentProfile = async () => {
    try {
      // Load student user data
      const userDoc = await getDoc(doc(db, 'users', targetUserId));
      if (userDoc.exists()) {
        setStudentData({ uid: targetUserId, ...userDoc.data() });
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
      // naive prefix search on email and displayName (requires composite indexes for prod scale)
      const usersRef = collection(db, 'users');
      const emailQ = query(usersRef, orderBy('email'), startAt(q), endAt(q + '\uf8ff'), limit(5));
      const nameQ = query(usersRef, orderBy('displayName'), startAt(q), endAt(q + '\uf8ff'), limit(5));
      const [emailSnap, nameSnap] = await Promise.all([getDocs(emailQ), getDocs(nameQ)]);
      const map = new Map();
      emailSnap.forEach(d => map.set(d.id, { uid: d.id, ...d.data() }));
      nameSnap.forEach(d => map.set(d.id, { uid: d.id, ...d.data() }));
      setSearchResults(Array.from(map.values()).slice(0, 8));
    } catch (e) {
      console.warn('searchUsers:', e);
    } finally {
      setSearchLoading(false);
    }
  };

  const loadAttendanceData = async () => {
    try {
      // Get all attendance sessions
      const sessionsQuery = query(collection(db, 'attendanceSessions'));
      const sessionsSnap = await getDocs(sessionsQuery);
      
      const classAttendance = {};

      for (const sessionDoc of sessionsSnap.docs) {
        const sessionData = sessionDoc.data();
        const classId = sessionData.classId;

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
      const submissionsQuery = query(
        collection(db, 'submissions'),
        where('userId', '==', targetUserId)
      );
      const submissionsSnap = await getDocs(submissionsQuery);

      const performance = {
        homework: { completed: 0, total: 0, totalScore: 0, avgScore: 0 },
        quiz: { completed: 0, total: 0, totalScore: 0, avgScore: 0 },
        training: { completed: 0, total: 0, totalScore: 0, avgScore: 0 },
      };

      for (const subDoc of submissionsSnap.docs) {
        const subData = subDoc.data();
        
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

  if (loading) {
    return <Loading variant="overlay" message={t('loading') || 'Loading...'} />;
  }

  if (!studentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Student Not Found
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-800 dark:to-blue-800 rounded-2xl shadow-2xl p-8 mb-6 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
          
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-xl ring-4 ring-white/30">
                <User className="w-10 h-10 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">
                  {studentData.displayName || studentData.email}
                </h1>
                <p className="text-purple-100 dark:text-purple-200 text-lg">{studentData.email}</p>
                {studentData.studentNumber && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm text-white font-medium">
                      {t('student_number')}: {studentData.studentNumber}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {canViewOthers && (
              <div className="relative w-full md:w-96">
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/20 backdrop-blur-md border border-white/30">
                  <Search className="w-5 h-5 text-white" />
                  <input
                    value={searchText}
                    onChange={(e)=>searchUsers(e.target.value)}
                    placeholder="Search students..."
                    className="flex-1 bg-transparent outline-none text-white placeholder-white/70"
                  />
                </div>
                {searchText && searchResults.length > 0 && (
                  <div className="absolute z-10 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-72 overflow-auto">
                    {searchResults.map(s => (
                      <button
                        key={s.uid}
                        onClick={()=>{ setTargetUserId(s.uid); setSearchText(''); setSearchResults([]); }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <div className="font-medium text-gray-900 dark:text-gray-100">{s.displayName || s.email}</div>
                        <div className="text-sm text-gray-500">{s.email}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Filters (Admin/Instructor only) */}
        {canViewOthers && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Filters</h3>
              <button
                onClick={() => setShowStudentList(!showStudentList)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                {showStudentList ? 'Hide Student List' : 'Show All Students'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Select
                  label="Class"
                  searchable
                  value={filters.classId}
                  onChange={(e) => setFilters({ ...filters, classId: e.target.value })}
                  options={[
                    { value: '', label: 'All Classes' },
                    ...allClasses.map((c) => ({ value: c.id, label: c.name || c.name_en || c.id }))
                  ]}
                  fullWidth
                />
              </div>
              <div>
                <Select
                  label="Year"
                  searchable
                  value={filters.year}
                  onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                  options={[
                    { value: '', label: 'All Years' },
                    ...[...new Set(allClasses.map(c => c.year || c.academicYear).filter(Boolean))].map((y) => ({ value: y, label: y }))
                  ]}
                  fullWidth
                />
              </div>
              <div>
                <Select
                  label="Term"
                  searchable
                  value={filters.term}
                  onChange={(e) => setFilters({ ...filters, term: e.target.value })}
                  options={[
                    { value: '', label: 'All Terms' },
                    ...[...new Set(allClasses.map(c => c.term || c.sessionTerm).filter(Boolean))].map((t) => ({ value: t, label: t }))
                  ]}
                  fullWidth
                />
              </div>
              <div>
                <Select
                  label="Semester"
                  searchable
                  value={filters.semester}
                  onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
                  options={[
                    { value: '', label: 'All Semesters' },
                    ...[...new Set(allClasses.map(c => c.semester).filter(Boolean))].map((s) => ({ value: s, label: s }))
                  ]}
                  fullWidth
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
                <Users className="w-6 h-6 text-purple-600" />
                Students ({allStudents.length})
              </h2>
              {allStudents.length === 0 ? (
                <div className="text-center py-12">
                  <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
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
                <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
            <div className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 mb-1">{t('total_sessions')}</div>
            <div className="text-3xl font-bold text-gray-800 dark:text-white">{totals.total}</div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl shadow-lg p-5 hover:shadow-xl transition-shadow border border-green-100 dark:border-green-800">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div className="text-xs uppercase font-semibold text-green-700 dark:text-green-400 mb-1">{t('present_count')}</div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{totals.present}</div>
          </div>
          
          <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-2xl shadow-lg p-5 hover:shadow-xl transition-shadow border border-red-100 dark:border-red-800">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-800 rounded-xl flex items-center justify-center">
                <X className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div className="text-xs uppercase font-semibold text-red-700 dark:text-red-400 mb-1">{t('absent_count')}</div>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">{totals.absent}</div>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-2xl shadow-lg p-5 hover:shadow-xl transition-shadow border border-yellow-100 dark:border-yellow-800">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-800 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <div className="text-xs uppercase font-semibold text-yellow-700 dark:text-yellow-400 mb-1">{t('late_count')}</div>
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{totals.late}</div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl shadow-lg p-5 hover:shadow-xl transition-shadow border border-blue-100 dark:border-blue-800">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="text-xs uppercase font-semibold text-blue-700 dark:text-blue-400 mb-1">{t('leave_count')}</div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{totals.leave}</div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl shadow-lg p-5 hover:shadow-xl transition-shadow border border-purple-100 dark:border-purple-800">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-800 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="text-xs uppercase font-semibold text-purple-700 dark:text-purple-400 mb-1">{t('attendance_rate')}</div>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{totals.rate}%</div>
          </div>
        </div>

        {/* Attendance Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
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
                        <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
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
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              {t('performance_summary')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Homework */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-blue-600" />
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
                <Award className="w-5 h-5 text-green-600" />
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
                <Clock className="w-5 h-5 text-purple-600" />
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
              <Trophy className="w-6 h-6 text-yellow-500" />
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
                  <Target className="w-5 h-5 text-green-500" />
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
                  <Award className="w-5 h-5 text-purple-500" />
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
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
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
              <Trophy className="w-16 h-16 mx-auto mb-4 opacity-30" />
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
