import React, { useState, useEffect, memo, useLayoutEffect } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@ui/Toast/Toast';
import { CollapsibleDashboardSection, ProgramsSelect } from '@ui';
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
import { MODE_TYPES } from '@utils/sharedTypes';
import logger from '@utils/logger';
import { ActivityLogger } from '@services/other/activityLogger';

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
 * - Optimized data loading to prevent excessive re-renders
 */
const AnalyticsDashboardPage = memo(() => {
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const { user, isAdmin, isSuperAdmin, isInstructor } = useAuth();
  const toast = useToast();
  
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
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Filter states
  const [enrollmentProgramFilter, setEnrollmentProgramFilter] = useState('');
  const [enrollmentSubjectFilter, setEnrollmentSubjectFilter] = useState('');
  const [enrollmentClassFilter, setEnrollmentClassFilter] = useState('');
  
  // Load all data function
  const loadAllData = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    }
    
        
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
      ] = await Promise.allSettled([
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
      
      // Helper to handle settled promises
      const handleSettled = (result) => {
        if (result.status === 'fulfilled') {
          return result.value.success ? result.value.data || [] : [];
        }
        logger.warn('⚠️ [AnalyticsDashboardPage] Collection not available or failed to load:', result.reason?.message || result.reason);
        return [];
      };
      
      if (programsRes.status === 'fulfilled' && programsRes.value.success) setPrograms(programsRes.value.data || []);
      if (subjectsRes.status === 'fulfilled' && subjectsRes.value.success) setSubjects(subjectsRes.value.data || []);
      if (classesRes.status === 'fulfilled' && classesRes.value.success) setClasses(classesRes.value.data || []);
      if (enrollmentsRes.status === 'fulfilled' && enrollmentsRes.value.success) setEnrollments(enrollmentsRes.value.data || []);
      if (activitiesRes.status === 'fulfilled' && activitiesRes.value.success) setActivities(activitiesRes.value.data || []);
      if (usersRes.status === 'fulfilled' && usersRes.value.success) setUsers(usersRes.value.data || []);
      if (quizzesRes.status === 'fulfilled' && quizzesRes.value.success) setQuizzes(quizzesRes.value.data || []);
      if (announcementsRes.status === 'fulfilled' && announcementsRes.value.success) setAnnouncements(announcementsRes.value.data || []);
      if (penaltiesRes.status === 'fulfilled' && penaltiesRes.value.success) setPenalties(penaltiesRes.value.data || []);
      if (behaviorsRes.status === 'fulfilled' && behaviorsRes.value.success) setBehaviors(behaviorsRes.value.data || []);
      if (participationsRes.status === 'fulfilled' && participationsRes.value.success) setParticipations(participationsRes.value.data || []);
      
      // Load resource count with current filters
      const filters = {};
      if (enrollmentProgramFilter && enrollmentProgramFilter !== '') {
        filters.programId = enrollmentProgramFilter;
      }
      if (enrollmentSubjectFilter && enrollmentSubjectFilter !== '') {
        filters.subjectId = enrollmentSubjectFilter;
      }
      if (enrollmentClassFilter && enrollmentClassFilter !== '') {
        filters.classId = enrollmentClassFilter;
      }

      const resourceResult = await getResourceCount(filters);
      if (resourceResult.success) {
        setResourceCount(resourceResult.count);
      } else {
        logger.error('❌ [AnalyticsDashboardPage] Error fetching resource count:', resourceResult.error);
        setResourceCount(0);
      }
      
      // Mark data as loaded to prevent re-loading
      setDataLoaded(true);
      
      // Show success toast for refresh
      if (isRefresh) {
        toast.success('Dashboard refreshed successfully!', 2000);
      }
      
    } catch (error) {
      logger.error('❌ [AnalyticsDashboardPage] Error loading data:', error);
      if (isRefresh) {
        toast.error('Failed to refresh dashboard', 3000);
      }
    } finally {
      if (isRefresh) {
        setIsRefreshing(false);
      }
    }
  };
  
  // Load all data only once on component mount
  useLayoutEffect(() => {
    // Only load data if not already loaded and user is authenticated
    if (dataLoaded || !user) return;
    
    loadAllData(false);
  }, [user, dataLoaded]); // Add dataLoaded dependency to prevent re-runs

  // Update resource count when filters change
  useEffect(() => {
    // Only update if data is already loaded (to avoid conflicts with initial load)
    if (!dataLoaded) return;
    
    const updateResourceCount = async () => {
      try {
        const filters = {};
        if (enrollmentProgramFilter && enrollmentProgramFilter !== '') {
          filters.programId = enrollmentProgramFilter;
        }
        if (enrollmentSubjectFilter && enrollmentSubjectFilter !== '') {
          filters.subjectId = enrollmentSubjectFilter;
        }
        if (enrollmentClassFilter && enrollmentClassFilter !== '') {
          filters.classId = enrollmentClassFilter;
        }

        const result = await getResourceCount(filters);
        if (result.success) {
          setResourceCount(result.count);
        } else {
          logger.error('❌ [AnalyticsDashboardPage] Error fetching resource count:', result.error);
          setResourceCount(0);
        }
      } catch (error) {
        logger.error('❌ [AnalyticsDashboardPage] Exception fetching resource count:', error);
        setResourceCount(0);
      }
    };

    updateResourceCount();
  }, [enrollmentProgramFilter, enrollmentSubjectFilter, enrollmentClassFilter, dataLoaded]);

  // Safety check: ensure programs is an array
  const safePrograms = Array.isArray(programs) ? programs : [];

  return (
    <CollapsibleDashboardSection
      sectionId="summary-cards"
      title={t('dashboard_statistics') || 'Dashboard Statistics'}
      icon={getThemedIcon('ui', 'bar_chart', 20, theme)}
      color="var(--color-primary, var(--primary-maroon, #800020))"
      defaultMode="full"
      data-tour="stats"
      inlineFilters={
        <ProgramsSelect
          programs={safePrograms}
          subjects={subjects}
          classes={classes}
          selectedProgram={enrollmentProgramFilter}
          selectedSubject={enrollmentSubjectFilter}
          selectedClass={enrollmentClassFilter}
          onProgramChange={(value) => {
            setEnrollmentProgramFilter(value);
            setEnrollmentSubjectFilter('');
            setEnrollmentClassFilter('');
          }}
          onSubjectChange={(value) => {
            setEnrollmentSubjectFilter(value);
            setEnrollmentClassFilter('');
          }}
          onClassChange={(value) => {
            setEnrollmentClassFilter(value);
          }}
          showLabels={false}
          fullWidth
          className="flex-nowrap"
          style={{ gap: '0.5rem', width: '100%' }}
        />
      }
      onRefresh={() => loadAllData(true)}
      refreshing={isRefreshing}
    >
      <div style={{ marginBottom: '0.75rem' }}>
        {/* Summary Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '0.5rem',
            justifyContent: 'center'
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
                if (enrollmentProgramFilter && enrollmentProgramFilter !== '') return s.programId === enrollmentProgramFilter;
                return true;
              }).length,
              tooltip: isSuperAdmin ? (t('total_subjects_all') || 'Total number of subjects') : (t('total_subjects_accessible') || 'Subjects in your accessible programs')
            }] : []),
            // Classes - All roles with filtering
            {
              type: 'classes',
              value: classes.filter(c => {
                if (enrollmentProgramFilter && enrollmentProgramFilter !== '') {
                  const subject = subjects.find(s => (s.docId || s.id) === c.subjectId);
                  return subject?.programId === enrollmentProgramFilter;
                }
                if (enrollmentSubjectFilter && enrollmentSubjectFilter !== '') {
                  return c.subjectId === enrollmentSubjectFilter;
                }
                if (enrollmentClassFilter && enrollmentClassFilter !== '') {
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
                if (enrollmentClassFilter && enrollmentClassFilter !== '') {
                  return e.classId === enrollmentClassFilter;
                }
                if (enrollmentSubjectFilter && enrollmentSubjectFilter !== '') {
                  const classItem = classes.find(c => (c.id || c.docId) === e.classId);
                  return classItem?.subjectId === enrollmentSubjectFilter;
                }
                if (enrollmentProgramFilter && enrollmentProgramFilter !== '') {
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
                if (enrollmentClassFilter && enrollmentClassFilter !== '') {
                  return a.classId === enrollmentClassFilter;
                }
                if (enrollmentSubjectFilter && enrollmentSubjectFilter !== '') {
                  const classItem = classes.find(c => (c.id || c.docId) === a.classId);
                  return classItem?.subjectId === enrollmentSubjectFilter;
                }
                if (enrollmentProgramFilter && enrollmentProgramFilter !== '') {
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
            }
          ].map((stat, idx) => {
            const config = getCardConfig(stat.type, t, theme);
            const IconComponent = config.icon;
            const borderRadius = getShapeRadius(config.shape);
            return (
              <div
                key={idx}
                style={{
                  padding: '0.75rem',
                  background: theme === 'dark' ? '#1f2937' : '#ffffff',
                  border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: stat.onClick ? 'pointer' : 'default',
                  transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s'
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
                    e.currentTarget.style.borderColor = theme === 'dark' ? '#374151' : '#e5e7eb';
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

      {/* Second Row - User Roles (Admin and Super Admin only) */}
      {(isAdmin || isSuperAdmin) && (
        <div style={{ marginBottom: '0.75rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '0.5rem',
              justifyContent: 'center'
            }}
          >
            {[
              {
                type: 'students',
                value: users.filter(u => u.isStudent === true).length,
                tooltip: t('total_students_system') || 'Total number of students in the system'
              },
              {
                type: 'instructors',
                value: users.filter(u => u.isInstructor === true).length,
                tooltip: t('total_instructors_system') || 'Total number of instructors/teachers in the system'
              },
              {
                type: 'hr',
                value: users.filter(u => u.isHR === true).length,
                tooltip: t('total_hr_system') || 'Total number of HR users in the system'
              },
              {
                type: 'admins',
                value: users.filter(u => u.isAdmin === true).length,
                tooltip: t('total_admins_system') || 'Total number of admin users in the system'
              },
              {
                type: 'superadmins',
                value: users.filter(u => u.isSuperAdmin === true).length,
                tooltip: t('total_superadmins_system') || 'Total number of super admin users in the system'
              }
            ].map((stat, idx) => {
              const config = getCardConfig(stat.type, t, theme);
              const IconComponent = config.icon;
              const borderRadius = getShapeRadius(config.shape);
              return (
                <div
                  key={`role-${idx}`}
                  style={{
                    padding: '0.75rem',
                    background: theme === 'dark' ? '#1f2937' : '#ffffff',
                    border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '0.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'default',
                    transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s'
                  }}
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
      )}

      {/* Third Row - Other Statistics */}
      <div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '0.5rem',
            justifyContent: 'center'
          }}
        >
          {[
            // Activities
            {
              type: 'activities',
              value: activities.filter(a => {
                if (enrollmentClassFilter && enrollmentClassFilter !== '') {
                  return a.classId === enrollmentClassFilter;
                }
                if (enrollmentSubjectFilter && enrollmentSubjectFilter !== '') {
                  const classItem = classes.find(c => (c.id || c.docId) === a.classId);
                  return classItem?.subjectId === enrollmentSubjectFilter;
                }
                if (enrollmentProgramFilter && enrollmentProgramFilter !== '') {
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
              type: MODE_TYPES.ANNOUNCEMENTS,
              value: announcements.filter(a => {
                if (enrollmentClassFilter && enrollmentClassFilter !== '') {
                  return a.classId === enrollmentClassFilter;
                }
                if (enrollmentSubjectFilter && enrollmentSubjectFilter !== '') {
                  return a.subjectId === enrollmentSubjectFilter;
                }
                if (enrollmentProgramFilter && enrollmentProgramFilter !== '') {
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
                if (enrollmentClassFilter && enrollmentClassFilter !== '') {
                  return p.classId === enrollmentClassFilter;
                }
                if (enrollmentSubjectFilter && enrollmentSubjectFilter !== '') {
                  return p.subjectId === enrollmentSubjectFilter;
                }
                if (enrollmentProgramFilter && enrollmentProgramFilter !== '') {
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
                if (enrollmentClassFilter && enrollmentClassFilter !== '') {
                  return b.classId === enrollmentClassFilter;
                }
                if (enrollmentSubjectFilter && enrollmentSubjectFilter !== '') {
                  return b.subjectId === enrollmentSubjectFilter;
                }
                if (enrollmentProgramFilter && enrollmentProgramFilter !== '') {
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
                if (enrollmentClassFilter && enrollmentClassFilter !== '') {
                  return p.classId === enrollmentClassFilter;
                }
                if (enrollmentSubjectFilter && enrollmentSubjectFilter !== '') {
                  return p.subjectId === enrollmentSubjectFilter;
                }
                if (enrollmentProgramFilter && enrollmentProgramFilter !== '') {
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
                key={`other-${idx}`}
                style={{
                  padding: '0.75rem',
                  background: theme === 'dark' ? '#1f2937' : '#ffffff',
                  border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: stat.onClick ? 'pointer' : 'default',
                  transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s'
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
                    e.currentTarget.style.borderColor = theme === 'dark' ? '#374151' : '#e5e7eb';
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
});

export default memo(AnalyticsDashboardPage, () => true); // Prevent re-renders unless props change

