import React, { useState, useEffect, memo, useLayoutEffect } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useAuth } from '@contexts/AuthContext';
import { useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { CollapsibleDashboardSection } from '@ui';
import { FilterSelect } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import { getCardConfig, getShapeRadius } from '@utils/cardColors';
import { getResourceCount } from '@services/business/activityService';
import { getPrograms, getSubjects } from '@services/business/programService';
import { getClasses } from '@services/business/classService';
import { getEnrollments } from '@services/business/enrollmentService';
import { getActivities } from '@services/business/activityService';
import { getUsers } from '@services/business/userService';
import { getAllQuizzes } from '@services/business/quizService';
import { getAnnouncements } from '@services/business/activityService';
import { getPenalties } from '@services/business/penaltyService';
import { getBehaviors } from '@services/business/behaviorService';
import { getParticipations } from '@services/business/participationService';
import logger from '@utils/logger';

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
  const { startLoading } = useGlobalLoading();
  
  // Local state for all data
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [users, setUsers] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [penalties, setPenalties] = useState([]);
  const [behaviors, setBehaviors] = useState([]);
  const [participations, setParticipations] = useState([]);
  const [resourceCount, setResourceCount] = useState(0);
  const [loadingResourceCount, setLoadingResourceCount] = useState(false);
  
  // Filter states
  const [enrollmentProgramFilter, setEnrollmentProgramFilter] = useState('all');
  const [enrollmentSubjectFilter, setEnrollmentSubjectFilter] = useState('all');
  const [enrollmentClassFilter, setEnrollmentClassFilter] = useState('all');
  
  // Load all data on component mount
  useLayoutEffect(() => {
    let stopLoading = null;
    
    const loadAllData = async () => {
      // Start global loading immediately
      stopLoading = startLoading({ message: t('loading_statistics') || 'Loading statistics...' });
      
      try {
        const [
          programsRes,
          subjectsRes,
          classesRes,
          enrollmentsRes,
          activitiesRes,
          usersRes,
          quizzesRes,
          announcementsRes,
          penaltiesRes,
          behaviorsRes,
          participationsRes
        ] = await Promise.all([
          getPrograms(),
          getSubjects(),
          getClasses(),
          getEnrollments(),
          getActivities(),
          getUsers(),
          getAllQuizzes(),
          getAnnouncements(),
          getPenalties(),
          getBehaviors(),
          getParticipations()
        ]);
        
        if (programsRes.success) setPrograms(programsRes.data || []);
        if (subjectsRes.success) setSubjects(subjectsRes.data || []);
        if (classesRes.success) setClasses(classesRes.data || []);
        if (enrollmentsRes.success) setEnrollments(enrollmentsRes.data || []);
        if (activitiesRes.success) setActivities(activitiesRes.data || []);
        if (usersRes.success) setUsers(usersRes.data || []);
        if (quizzesRes.success) setQuizzes(quizzesRes.data || []);
        if (announcementsRes.success) setAnnouncements(announcementsRes.data || []);
        if (penaltiesRes.success) setPenalties(penaltiesRes.data || []);
        if (behaviorsRes.success) setBehaviors(behaviorsRes.data || []);
        if (participationsRes.success) setParticipations(participationsRes.data || []);
        
      } catch (error) {
        logger.error('🔍 [AnalyticsDashboardPage] Error loading data:', error);
      } finally {
        if (stopLoading) stopLoading();
      }
    };
    
    loadAllData();
    
    // Cleanup function to ensure loading stops if component unmounts
    return () => {
      if (stopLoading) stopLoading();
    };
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
          logger.log('🔍 [AnalyticsDashboardPage] Server-side resource count:', result.count);
        } else {
          logger.error('🔍 [AnalyticsDashboardPage] Error fetching resource count:', result.error);
          setResourceCount(0);
        }
      } catch (error) {
        logger.error('🔍 [AnalyticsDashboardPage] Exception fetching resource count:', error);
        setResourceCount(0);
      } finally {
        setLoadingResourceCount(false);
      }
    };

    fetchResourceCount();
  }, [enrollmentProgramFilter, enrollmentSubjectFilter, enrollmentClassFilter]);

  // Safety check: ensure programs is an array
  const safePrograms = Array.isArray(programs) ? programs : [];

  return (
    <CollapsibleDashboardSection
      sectionId="summary-cards"
      title={t('dashboard_statistics') || 'Dashboard Statistics'}
      icon={getThemedIcon('ui', 'bar_chart', 20, theme)}
      color={theme === 'dark' ? '#818cf8' : '#6366f1'}
      defaultMode="full"
      data-tour="stats"
      inlineFilters={
        <div style={{ display: 'flex', gap: '0.15rem', alignItems: 'center' }}>
          <FilterSelect
            filterKey="programs"
            value={enrollmentProgramFilter}
            onChange={(value) => {
              setEnrollmentProgramFilter(value);
              setEnrollmentSubjectFilter('all');
              setEnrollmentClassFilter('all');
            }}
            data={safePrograms}
            style={{ minWidth: 80, maxWidth: 110 }}
            size="small"
          />
          <FilterSelect
            filterKey="subjects"
            value={enrollmentSubjectFilter}
            onChange={(value) => {
              setEnrollmentSubjectFilter(value);
              setEnrollmentClassFilter('all');
            }}
            data={subjects.filter(s => enrollmentProgramFilter === 'all' || s.programId === enrollmentProgramFilter)}
            style={{ minWidth: 80, maxWidth: 110 }}
            size="small"
          />
          <FilterSelect
            filterKey="classes"
            value={enrollmentClassFilter}
            onChange={setEnrollmentClassFilter}
            data={classes.filter(c => {
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
            })}
            style={{ minWidth: 80, maxWidth: 110 }}
            size="small"
          />
        </div>
      }
    >
      <div style={{ marginBottom: '1rem' }}>
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
            },
            // Penalties
            {
              type: 'penalties',
              value: penalties.filter(p => {
                if (enrollmentClassFilter !== 'all') {
                  return p.classId === enrollmentClassFilter;
                }
                if (enrollmentSubjectFilter !== 'all') {
                  return p.subjectId === enrollmentSubjectFilter;
                }
                if (enrollmentProgramFilter !== 'all') {
                  return p.programId === enrollmentProgramFilter;
                }
                if (isInstructor && !isAdmin && !isSuperAdmin) {
                  return p.instructorId === user.uid || p.instructorEmail === user.email;
                }
                return true;
              }).length,
              tooltip: t('total_penalties') || 'Total number of penalties'
            },
            // Behaviors
            {
              type: 'behaviors',
              value: behaviors.filter(b => {
                if (enrollmentClassFilter !== 'all') {
                  return b.classId === enrollmentClassFilter;
                }
                if (enrollmentSubjectFilter !== 'all') {
                  return b.subjectId === enrollmentSubjectFilter;
                }
                if (enrollmentProgramFilter !== 'all') {
                  return b.programId === enrollmentProgramFilter;
                }
                if (isInstructor && !isAdmin && !isSuperAdmin) {
                  return b.instructorId === user.uid || b.instructorEmail === user.email;
                }
                return true;
              }).length,
              tooltip: t('total_behaviors') || 'Total number of behavior records'
            },
            // Participations
            {
              type: 'participations',
              value: participations.filter(p => {
                if (enrollmentClassFilter !== 'all') {
                  return p.classId === enrollmentClassFilter;
                }
                if (enrollmentSubjectFilter !== 'all') {
                  return p.subjectId === enrollmentSubjectFilter;
                }
                if (enrollmentProgramFilter !== 'all') {
                  return p.programId === enrollmentProgramFilter;
                }
                if (isInstructor && !isAdmin && !isSuperAdmin) {
                  return p.instructorId === user.uid || p.instructorEmail === user.email;
                }
                return true;
              }).length,
              tooltip: t('total_participations') || 'Total number of participation records'
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
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                  borderRadius: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  if (stat.onClick) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = theme === 'dark' ? '0 2px 6px rgba(0, 0, 0, 0.3)' : '0 2px 6px rgba(0, 0, 0, 0.08)';
                    e.currentTarget.style.borderColor = config.iconColor;
                  }
                }}
                onMouseLeave={(e) => {
                  if (stat.onClick) {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = 'transparent';
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

export default memo(AnalyticsDashboardPage);

