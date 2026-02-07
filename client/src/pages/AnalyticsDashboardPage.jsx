import React from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { CollapsibleDashboardSection, Select } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import { getCardConfig, getShapeRadius } from '@utils/cardColors';

/**
 * AnalyticsDashboardPage - Dashboard Statistics Page
 * 
 * This component provides a comprehensive dashboard statistics interface,
 * extracted from DashboardPage.jsx for better modularity.
 * 
 * Features:
 * - Summary cards with counts for programs, subjects, classes, enrollments, activities, users, submissions, quizzes, announcements, resources
 * - Filtering by program, subject, and class
 * - Role-based access control
 * - Theme-aware styling with centralized icons
 */
const AnalyticsDashboardPage = ({
  programs,
  subjects,
  classes,
  enrollments,
  activities,
  users,
  submissions,
  quizzes,
  announcements,
  resources,
  enrollmentProgramFilter,
  enrollmentSubjectFilter,
  enrollmentClassFilter,
  setEnrollmentProgramFilter,
  setEnrollmentSubjectFilter,
  setEnrollmentClassFilter,
  user,
  isSuperAdmin,
  isAdmin,
  isInstructor
}) => {
  const { t, lang } = useLang();
  const { theme } = useTheme();

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
              ...programs.map(p => ({
                value: p.docId || p.id,
                label: p.name_en || p.name_ar || p.code || p.docId,
                icon: getThemedIcon('ui', 'book_open', 14, theme)
              }))
            ]}
            style={{ minWidth: 140 }}
            placeholder={t('all_programs')}
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
              ...programs.map(p => ({
                value: p.docId || p.id,
                label: p.name_en || p.name_ar || p.code || p.docId,
                icon: getThemedIcon('ui', 'book_open', 16, theme)
              }))
            ]}
            style={{ minWidth: 180 }}
            placeholder={t('all_programs')}
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
              ...subjects
                .filter(s => enrollmentProgramFilter === 'all' || s.programId === enrollmentProgramFilter)
                .map(s => ({
                  value: s.docId || s.id,
                  label: `${s.code || ''} - ${s.name_en || s.name_ar || s.docId}`.trim(),
                  icon: getThemedIcon('ui', 'file_text', 16, theme)
                }))
            ]}
            style={{ minWidth: 180 }}
            placeholder={t('all_subjects')}
          />
          <Select
            size="small"
            searchable
            value={enrollmentClassFilter}
            onChange={(e) => setEnrollmentClassFilter(e.target.value)}
            options={[
              { value: 'all', label: t('all_classes'), icon: getThemedIcon('ui', 'filter', 16, theme) },
              ...classes
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '0.75rem'
          }}
        >
          {[
            // Programs - Super Admin only
            ...(isSuperAdmin ? [{
              type: 'programs',
              value: programs.length,
              tooltip: 'Total number of programs in the system'
            }] : []),
            // Subjects - Admin and Super Admin
            ...((isAdmin || isSuperAdmin) ? [{
              type: 'subjects',
              value: subjects.filter(s => {
                if (enrollmentProgramFilter !== 'all') return s.programId === enrollmentProgramFilter;
                return true;
              }).length,
              tooltip: isSuperAdmin ? 'Total number of subjects' : 'Subjects in your accessible programs'
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
              tooltip: isSuperAdmin ? 'Total number of classes' : isAdmin ? 'Classes in your accessible programs' : 'Your classes'
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
              tooltip: isSuperAdmin ? 'Total number of enrollments' : isAdmin ? 'Enrollments in your accessible programs' : 'Enrollments in your classes'
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
              tooltip: isSuperAdmin ? 'Total number of activities' : isAdmin ? 'Activities in your accessible programs' : 'Activities in your classes'
            },
            // Users - Admin and Super Admin only
            ...((isAdmin || isSuperAdmin) ? [{
              type: 'users',
              value: users.length,
              tooltip: 'Total number of users in the system'
            }] : []),
            // Submissions
            {
              type: 'submissions',
              value: submissions.filter(s => {
                if (enrollmentClassFilter !== 'all') {
                  const activity = activities.find(a => a.id === s.activityId);
                  return activity?.classId === enrollmentClassFilter;
                }
                if (enrollmentSubjectFilter !== 'all') {
                  const activity = activities.find(a => a.id === s.activityId);
                  if (!activity) return false;
                  const classItem = classes.find(c => (c.id || c.docId) === activity.classId);
                  return classItem?.subjectId === enrollmentSubjectFilter;
                }
                if (enrollmentProgramFilter !== 'all') {
                  const activity = activities.find(a => a.id === s.activityId);
                  if (!activity) return false;
                  const classItem = classes.find(c => (c.id || c.docId) === activity.classId);
                  const subject = subjects.find(s => (s.docId || s.id) === classItem?.subjectId);
                  return subject?.programId === enrollmentProgramFilter;
                }
                if (isInstructor && !isAdmin && !isSuperAdmin) {
                  const activity = activities.find(a => a.id === s.activityId);
                  if (!activity) return false;
                  const classItem = classes.find(c => (c.id || c.docId) === activity.classId);
                  return classItem && (classItem.instructorId === user.uid || classItem.ownerEmail === user.email || classItem.instructor === user.email);
                }
                return true;
              }).length,
              tooltip: isSuperAdmin ? 'Total number of submissions' : isAdmin ? 'Submissions in your accessible programs' : 'Submissions from your students'
            },
            // Quizzes
            {
              type: 'quizzes',
              value: quizzes.length,
              tooltip: 'Total number of quizzes. Click to view all quizzes.',
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
              tooltip: 'Total number of announcements'
            },
            // Resources
            {
              type: 'resources',
              value: resources.filter(r => {
                // If resource has no program/subject/class, it's public and should be included
                if (!r.programId && !r.subjectId && !r.classId) {
                  return true;
                }
                if (enrollmentClassFilter !== 'all') {
                  return r.classId === enrollmentClassFilter;
                }
                if (enrollmentSubjectFilter !== 'all') {
                  return r.subjectId === enrollmentSubjectFilter;
                }
                if (enrollmentProgramFilter !== 'all') {
                  return r.programId === enrollmentProgramFilter;
                }
                return true;
              }).length,
              tooltip: 'Total number of resources'
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
