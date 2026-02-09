import React, { useState, useEffect } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useAuth } from '@contexts/AuthContext';
import { CollapsibleDashboardSection, Select } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import { getCardConfig, getShapeRadius } from '@utils/cardColors';
import { getResourceCount } from '@firebaseServices/activityService';
import { getPrograms, getSubjects } from '@firebaseServices/programService';
import { getClasses } from '@firebaseServices/classService';
import { getEnrollments } from '@firebaseServices/enrollmentService';
import { getActivities } from '@firebaseServices/activityService';
import { getUsers } from '@firebaseServices/userService';
import { getAllQuizzes } from '@firebaseServices/quizService';
import { getAnnouncements } from '@firebaseServices/activityService';

/**
 * AnalyticsDashboardPage - Dashboard Statistics Page
 * 
 * This component provides a comprehensive dashboard statistics interface,
 * extracted from DashboardPage.jsx for better modularity.
 * 
 * Features:
 * - Summary cards with counts for programs, subjects, classes, enrollments, activities, users, quizzes, announcements, resources
 * - Filtering by program, subject, and class
 * - Role-based access control
 * - Theme-aware styling with centralized icons
 */
const AnalyticsDashboardPage = () => {
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const { user, isAdmin, isSuperAdmin, isInstructor } = useAuth();
  
  // Local state for all data
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [users, setUsers] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [resourceCount, setResourceCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingResourceCount, setLoadingResourceCount] = useState(false);
  
  // Filter states
  const [enrollmentProgramFilter, setEnrollmentProgramFilter] = useState('all');
  const [enrollmentSubjectFilter, setEnrollmentSubjectFilter] = useState('all');
  const [enrollmentClassFilter, setEnrollmentClassFilter] = useState('all');
  
  // Load all data on component mount
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        const [
          programsRes,
          subjectsRes,
          classesRes,
          enrollmentsRes,
          activitiesRes,
          usersRes,
          quizzesRes,
          announcementsRes
        ] = await Promise.all([
          getPrograms(),
          getSubjects(),
          getClasses(),
          getEnrollments(),
          getActivities(),
          getUsers(),
          getAllQuizzes(),
          getAnnouncements()
        ]);
        
        if (programsRes.success) setPrograms(programsRes.data || []);
        if (subjectsRes.success) setSubjects(subjectsRes.data || []);
        if (classesRes.success) setClasses(classesRes.data || []);
        if (enrollmentsRes.success) setEnrollments(enrollmentsRes.data || []);
        if (activitiesRes.success) setActivities(activitiesRes.data || []);
        if (usersRes.success) setUsers(usersRes.data || []);
        if (quizzesRes.success) setQuizzes(quizzesRes.data || []);
        if (announcementsRes.success) setAnnouncements(announcementsRes.data || []);
        
      } catch (error) {
        console.error('🔍 [AnalyticsDashboardPage] Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadAllData();
  }, []);

  // Fetch resource count from server based on current filters
  useEffect(() => {
    const fetchResourceCount = async () => {
      setLoadingResourceCount(true);
      try {
        const filters = {};
        if (enrollmentProgramFilter !== 'all') {
          filters.programId = enrollmentProgramFilter;
        }
        if (enrollmentSubjectFilter !== 'all') {
          filters.subjectId = enrollmentSubjectFilter;
        }
        if (enrollmentClassFilter !== 'all') {
          filters.classId = enrollmentClassFilter;
        }

        const result = await getResourceCount(filters);
        if (result.success) {
          setResourceCount(result.count);
          console.log('🔍 [AnalyticsDashboardPage] Server-side resource count:', result.count);
        } else {
          console.error('🔍 [AnalyticsDashboardPage] Error fetching resource count:', result.error);
          setResourceCount(0);
        }
      } catch (error) {
        console.error('🔍 [AnalyticsDashboardPage] Exception fetching resource count:', error);
        setResourceCount(0);
      } finally {
        setLoadingResourceCount(false);
      }
    };

    fetchResourceCount();
  }, [enrollmentProgramFilter, enrollmentSubjectFilter, enrollmentClassFilter]);

  // Safety check: ensure programs is an array
  const safePrograms = Array.isArray(programs) ? programs : [];
  
  if (loading) {
    return (
      <CollapsibleDashboardSection
        sectionId="summary-cards"
        title={t('dashboard_statistics') || 'Dashboard Statistics'}
        icon={getThemedIcon('ui', 'bar_chart', 20, theme)}
        color={theme === 'dark' ? '#818cf8' : '#6366f1'}
        defaultMode="full"
      >
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          {getThemedIcon('ui', 'loader', 24, theme)}
          <p style={{ marginTop: '1rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
            {t('loading_statistics') || 'Loading statistics...'}
          </p>
        </div>
      </CollapsibleDashboardSection>
    );
  }

  return (
    <CollapsibleDashboardSection
      sectionId="summary-cards"
      title={t('dashboard_statistics') || 'Dashboard Statistics'}
      icon={getThemedIcon('ui', 'bar_chart', 20, theme)}
      color={theme === 'dark' ? '#818cf8' : '#6366f1'}
      defaultMode="full"
      data-tour="stats"
      compactContent={
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Select
            size="small"
            searchable
            value={enrollmentProgramFilter}
            onChange={(e) => {
              setEnrollmentProgramFilter(e.target.value);
              setEnrollmentSubjectFilter('all');
              setEnrollmentClassFilter('all');
            }}
            options={[
              { value: 'all', label: t('all_programs'), icon: getThemedIcon('ui', 'filter', 14, theme) },
            ...safePrograms.map(p => ({
                value: p.docId || p.id,
                label: p.name_en || p.name || p.code || p.docId
              }))
            ]}
            style={{ minWidth: 140 }}
            placeholder={t('all_programs') || 'All Programs'}
          />
        </div>
      }
    >
      <div style={{ marginBottom: '1rem' }}>
        {/* Filters */}
        <div data-tour="filters" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <Select
            size="small"
            searchable
            value={enrollmentProgramFilter}
            onChange={(e) => {
              setEnrollmentProgramFilter(e.target.value);
              setEnrollmentSubjectFilter('all');
              setEnrollmentClassFilter('all');
            }}
            options={[
              { value: 'all', label: t('all_programs'), icon: getThemedIcon('ui', 'filter', 16, theme) },
            ...safePrograms.map(p => ({
                value: p.docId || p.id,
                label: p.name_en || p.name || p.code || p.docId
              }))
            ]}
            style={{ minWidth: 180 }}
            placeholder={t('all_programs') || 'All Programs'}
          />
          <Select
            size="small"
            searchable
            value={enrollmentSubjectFilter}
            onChange={(e) => {
              setEnrollmentSubjectFilter(e.target.value);
              setEnrollmentClassFilter('all');
            }}
            options={[
              { value: 'all', label: t('all_subjects'), icon: getThemedIcon('ui', 'filter', 16, theme) },
              ...(subjects || [])
                .filter(s => enrollmentProgramFilter === 'all' || s.programId === enrollmentProgramFilter)
                .map(s => ({
                  value: s.docId || s.id,
                  label: `${s.code || ''} - ${s.name_en || s.name || s.docId}`.trim()
                }))
            ]}
            style={{ minWidth: 180 }}
            placeholder={t('all_subjects') || 'All Subjects'}
          />
          <Select
            size="small"
            searchable
            value={enrollmentClassFilter}
            onChange={(e) => setEnrollmentClassFilter(e.target.value)}
            options={[
              { value: 'all', label: t('all_classes'), icon: getThemedIcon('ui', 'filter', 16, theme) },
              ...(classes || [])
                .filter(c => {
                  if (enrollmentProgramFilter !== 'all') {
                    const subject = subjects.find(s => (s.docId || s.id) === c.subjectId);
                    return subject?.programId === enrollmentProgramFilter;
                  }
                  if (enrollmentSubjectFilter !== 'all') {
                    return c.subjectId === enrollmentSubjectFilter;
                  }
                  if (enrollmentClassFilter !== 'all') {
                    return (c.id || c.docId) === enrollmentClassFilter;
                  }
                  if (isInstructor && !isAdmin && !isSuperAdmin) {
                    return c.instructorId === user.uid || c.ownerEmail === user.email || c.instructor === user.email;
                  }
                  return true;
                })
                .map(c => ({
                  value: c.id || c.docId,
                  label: `${c.name || c.code || c.id}${c.term ? ` (${c.term})` : ''}`,
                  icon: getThemedIcon('ui', 'users', 16, theme)
                }))
            ]}
            style={{ minWidth: 180 }}
            placeholder={t('all_classes') || 'All Classes'}
          />
        </div>
        {/* Summary Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '0.75rem'
          }}
        >
          {[
            // Programs - Super Admin only
            ...(isSuperAdmin ? [{
              type: 'programs',
              value: safePrograms.length,
              tooltip: t('total_programs_system') || 'Total number of programs in the system'
            }] : []),
            // Subjects - Admin and Super Admin
            ...((isAdmin || isSuperAdmin) ? [{
              type: 'subjects',
              value: subjects.filter(s => {
                if (enrollmentProgramFilter !== 'all') return s.programId === enrollmentProgramFilter;
                return true;
              }).length,
              tooltip: isSuperAdmin ? (t('total_subjects_all') || 'Total number of subjects') : (t('total_subjects_accessible') || 'Subjects in your accessible programs')
            }] : []),
            // Classes - All roles with filtering
            {
              type: 'classes',
              value: classes.filter(c => {
                if (enrollmentProgramFilter !== 'all') {
                  const subject = subjects.find(s => (s.docId || s.id) === c.subjectId);
                  return subject?.programId === enrollmentProgramFilter;
                }
                if (enrollmentSubjectFilter !== 'all') {
                  return c.subjectId === enrollmentSubjectFilter;
                }
                if (enrollmentClassFilter !== 'all') {
                  return (c.id || c.docId) === enrollmentClassFilter;
                }
                if (isInstructor && !isAdmin && !isSuperAdmin) {
                  return c.instructorId === user.uid || c.ownerEmail === user.email || c.instructor === user.email;
                }
                return true;
              }).length,
              tooltip: isSuperAdmin ? (t('total_classes_system') || 'Total number of classes') : isAdmin ? (t('total_classes_accessible') || 'Classes in your accessible programs') : (t('total_classes_instructor') || 'Your classes')
            },
            // Enrollments
            {
              type: 'enrollments',
              value: enrollments.filter(e => {
                if (enrollmentClassFilter !== 'all') {
                  return e.classId === enrollmentClassFilter;
                }
                if (enrollmentSubjectFilter !== 'all') {
                  const classItem = classes.find(c => (c.id || c.docId) === e.classId);
                  return classItem?.subjectId === enrollmentSubjectFilter;
                }
                if (enrollmentProgramFilter !== 'all') {
                  const classItem = classes.find(c => (c.id || c.docId) === e.classId);
                  const subject = subjects.find(s => (s.docId || s.id) === classItem?.subjectId);
                  return subject?.programId === enrollmentProgramFilter;
                }
                if (isInstructor && !isAdmin && !isSuperAdmin) {
                  const classItem = classes.find(c => (c.id || c.docId) === e.classId);
                  return classItem && (classItem.instructorId === user.uid || classItem.ownerEmail === user.email || classItem.instructor === user.email);
                }
                return true;
              }).length,
              tooltip: isSuperAdmin ? (t('total_enrollments_system') || 'Total number of enrollments') : isAdmin ? (t('total_enrollments_accessible') || 'Enrollments in your accessible programs') : (t('total_enrollments_instructor') || 'Enrollments in your classes')
            },
            // Activities
            {
              type: 'activities',
              value: activities.filter(a => {
                if (enrollmentClassFilter !== 'all') {
                  return a.classId === enrollmentClassFilter;
                }
                if (enrollmentSubjectFilter !== 'all') {
                  const classItem = classes.find(c => (c.id || c.docId) === a.classId);
                  return classItem?.subjectId === enrollmentSubjectFilter;
                }
                if (enrollmentProgramFilter !== 'all') {
                  const classItem = classes.find(c => (c.id || c.docId) === a.classId);
                  const subject = subjects.find(s => (s.docId || s.id) === classItem?.subjectId);
                  return subject?.programId === enrollmentProgramFilter;
                }
                if (isInstructor && !isAdmin && !isSuperAdmin) {
                  const classItem = classes.find(c => (c.id || c.docId) === a.classId);
                  return classItem && (classItem.instructorId === user.uid || classItem.ownerEmail === user.email || classItem.instructor === user.email);
                }
                return true;
              }).length,
              tooltip: isSuperAdmin ? (t('total_activities_system') || 'Total number of activities') : isAdmin ? (t('total_activities_accessible') || 'Activities in your accessible programs') : (t('total_activities_instructor') || 'Activities in your classes')
            },
            // Resources - Core statistic positioned on first line
            {
              type: 'resources',
              value: loadingResourceCount ? '...' : resourceCount,
              tooltip: loadingResourceCount ? (t('loading_resource_count') || 'Loading resource count...') : (t('total_resources') || 'Total number of resources (server-side count)')
            },
            // Users - Admin and Super Admin only
            ...((isAdmin || isSuperAdmin) ? [{
              type: 'users',
              value: users.length,
              tooltip: t('total_users_system') || 'Total number of users in the system'
            }] : []),
            // Quizzes
            {
              type: 'quizzes',
              value: quizzes.length,
              tooltip: t('total_quizzes') || 'Total number of quizzes. Click to view all quizzes.',
              onClick: () => window.location.href = '/quizzes',
              hoverable: true
            },
            // Announcements
            {
              type: 'announcements',
              value: announcements.filter(a => {
                if (enrollmentClassFilter !== 'all') {
                  return a.classId === enrollmentClassFilter;
                }
                if (enrollmentSubjectFilter !== 'all') {
                  return a.subjectId === enrollmentSubjectFilter;
                }
                if (enrollmentProgramFilter !== 'all') {
                  return a.programId === enrollmentProgramFilter;
                }
                return true;
              }).length,
              tooltip: t('total_announcements') || 'Total number of announcements'
            }
          ].map((stat, idx) => {
            const config = getCardConfig(stat.type, t, theme);
            const IconComponent = config.icon;
            const borderRadius = getShapeRadius(config.shape);
            return (
              <div
                key={idx}
                style={{
                  position: 'relative',
                  overflow: 'visible',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: stat.onClick ? 'pointer' : 'default',
                  transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                  border: '2px solid transparent',
                  backgroundColor: theme === 'dark' ? 'var(--card-bg, #1f2937)' : 'var(--card-bg, #ffffff)',
                  ':hover': {
                    transform: stat.onClick ? 'translateY(-1px)' : 'none',
                    boxShadow: stat.onClick ? (theme === 'dark' ? '0 2px 6px rgba(0, 0, 0, 0.3)' : '0 2px 6px rgba(0, 0, 0, 0.08)') : 'none',
                    borderColor: config.iconColor
                  }
                }}
                onClick={() => stat.onClick && stat.onClick()}
              >
                <div style={{ padding: '0.5rem', display: 'flex', flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    width: '100%',
                    height: '100%'
                  }}>
                    <div style={{
                      padding: '0.35rem',
                      background: config.bg,
                      borderRadius: borderRadius,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '0.1rem'
                    }}>
                      {React.cloneElement(IconComponent, { size: 16, style: { color: config.iconColor } })}
                    </div>
                    <div style={{
                      flex: 1,
                      minWidth: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      height: '100%',
                      gap: '0.1rem'
                    }}>
                      <span style={{
                        fontSize: '0.7rem',
                        color: theme === 'dark' ? 'var(--text-secondary, #9ca3af)' : 'var(--text-secondary, #6b7280)',
                        lineHeight: '1.1',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {config.label}
                      </span>
                      <div style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: config.iconColor,
                        lineHeight: '1.1'
                      }}>
                        {stat.value}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </CollapsibleDashboardSection>
  );
};

export default AnalyticsDashboardPage;
