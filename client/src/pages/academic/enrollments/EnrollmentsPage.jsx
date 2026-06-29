import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Joyride from 'react-joyride';
import TourTooltip from '@ui/TourTooltip/TourTooltip';
import { scheduleTourStart } from '@utils/tourScheduler';
import { info, error, warn, debug } from '@services/utils/logger.js';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { getLocalizedUserName, applyLocalizedNameFields } from '@utils/localizedUserName';
import { pickInstructorName, pickStudentName } from '@utils/pickLocalizedName';
import { useTheme } from '@contexts/ThemeContext';
import { getPrograms, getSubjects } from '@services/business/programService';
import { getClasses } from '@services/business/classService';
import { getStudentsByClass, toggleStudentAccess as toggleStudentAccessService } from '@services/business/enrollmentService';
import { Container, Card, CardBody, Button, Input, EmptyState, useToast, Select, YearSelect } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import { getAcademicTermOptions, getAcademicTermLabel } from '@constants/academicTerms';
import styles from './EnrollmentsPage.module.css';
import { GlobalLoadingFallback, useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import PortalTooltip from '@ui/PortalTooltip';

const EnrollmentsPage = () => {
  const { user, isAdmin, isInstructor, isSuperAdmin } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const toast = useToast();
  const { startLoading } = useGlobalLoading();

  // ── Guided Tour ───────────────────────────────────────────────────────────
  const [runTour, setRunTour] = useState(false);
  const [tourSteps, setTourSteps] = useState([]);
  const tourSeenKey = `enrollmentsTourSeen_${lang}`;
  const buildTourSteps = useCallback(() => [
    { target: '[data-tour="enroll-filters"]',  content: t('tour.enrollments_filters'), disableBeacon: true, placement: 'bottom' },
    { target: '[data-tour="enroll-classes"]',  content: t('tour.manage_enroll_class'), disableBeacon: true, placement: 'right' },
    { target: '[data-tour="enroll-students"]', content: t('tour.enrollments_grid'),    disableBeacon: true, placement: 'left' },
  ].filter(s => !!document.querySelector(s.target)), [t]);
  const startTour = useCallback(() => { const steps = buildTourSteps(); if (!steps.length) return; setTourSteps(steps); setRunTour(true); }, [buildTourSteps]);
  useEffect(() => {
    window.addEventListener('app:joyride', startTour);
    window.addEventListener('app:help', startTour);
    return () => { window.removeEventListener('app:joyride', startTour); window.removeEventListener('app:help', startTour); };
  }, [startTour]);
  useEffect(() => scheduleTourStart(tourSeenKey, lang, startTour), [tourSeenKey, lang, startTour]);
  const handleTourCallback = useCallback((data) => {
    const { status, action } = data || {};
    if (status === 'finished' || status === 'skipped' || action === 'close') { setRunTour(false); try { localStorage.setItem(tourSeenKey, 'true'); } catch {} }
  }, [tourSeenKey]);
  const TourTooltipComponent = useMemo(() => TourTooltip({ tourSeenKey }), [tourSeenKey]);
  // ─────────────────────────────────────────────────────────────────────────
  const [classes, setClasses] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(null);
  const [classLoading, setClassLoading] = useState(false);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [programFilter, setProgramFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [termFilter, setTermFilter] = useState('all');
  const [enrollmentStatusFilter, setEnrollmentStatusFilter] = useState('all');
  const [classSearch, setClassSearch] = useState('');

  const matchUserId = useCallback((left, right) => {
    if (left == null || right == null) return false;
    return String(left) === String(right);
  }, []);

  const availableYears = useMemo(() => {
    const years = new Set();
    classes.forEach(cls => {
      if (cls.year) {
        years.add(String(cls.year));
      } else if (cls.term && cls.term.includes(' ')) {
        const parts = cls.term.split(' ');
        if (parts.length > 1) {
          const yearPart = parts[parts.length - 1];
          if (yearPart && !isNaN(yearPart)) {
            years.add(yearPart);
          }
        }
      }
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [classes]);

  const availableTerms = useMemo(() => {
    const terms = new Set();
    classes.forEach(cls => {
      if (cls.term) {
        // For separate term field, use it directly
        terms.add(cls.term);
      }
    });
    
    // Convert to options with localized labels
    const termValues = Array.from(terms).sort();
    return termValues.map(termValue => ({
      value: termValue,
      label: getAcademicTermLabel(termValue, lang, t)
    }));
  }, [classes, lang, t]);

  const filteredClasses = useMemo(() => {
    let result = [...classes];
    
    // Quick text search across class name, code, year, term
    if (classSearch) {
      const q = classSearch.toLowerCase();
      result = result.filter(cls => {
        const name = (cls.name || '').toLowerCase();
        const code = (cls.code || '').toLowerCase();
        const year = String(cls.year || '');
        const term = (cls.term || '').toLowerCase();
        return name.includes(q) || code.includes(q) || year.includes(q) || term.includes(q);
      });
    }
    
    // Filter by program
    if (programFilter !== 'all') {
      result = result.filter(cls => {
        if (!cls.subjectId) return false;
        const subject = subjects.find(s => (s.docId || s.id) === cls.subjectId);
        if (!subject) return false;
        return (subject.programId || '') === programFilter;
      });
    }
    
    // Filter by subject
    if (subjectFilter !== 'all') {
      result = result.filter(cls => {
        return (cls.subjectId || '') === subjectFilter;
      });
    }
    
    // Filter by class
    if (classFilter !== 'all') {
      result = result.filter(cls => {
        const classId = cls.id || cls.docId;
        return String(classId) === String(classFilter);
      });
    }
    
    // Filter by year
    if (yearFilter !== 'all') {
      result = result.filter(cls => {
        if (cls.year && String(cls.year) === yearFilter) return true;
        if (cls.term && cls.term.includes(' ')) {
          const parts = cls.term.split(' ');
          if (parts.length > 1 && parts[parts.length - 1] === yearFilter) return true;
        }
        return false;
      });
    }
    
    // Filter by term
    if (termFilter !== 'all') {
      result = result.filter(cls => {
        if (!cls.term) return false;
        // For separate term field, use it directly
        if (cls.term === termFilter) return true;
        // Backward compatibility: check if term is part of combined field
        if (cls.term.includes(' ')) {
          const termPart = cls.term.split(' ')[0];
          return termPart === termFilter;
        }
        return false;
      });
    }
    
    // Sort by name
    result.sort((a, b) => (a.name || a.code || '').localeCompare(b.name || b.code || ''));
    
    return result;
  }, [classes, subjects, programFilter, subjectFilter, classFilter, yearFilter, termFilter, classSearch]);

  
  const loadData = async () => {
    const stopLoading = startLoading();
    try {
      const [classesSnap, programsRes, subjectsRes] = await Promise.all([
        getClasses(),
        getPrograms(),
        getSubjects()
      ]);
      
      const classesData = classesSnap.success ? classesSnap.data : [];
      setClasses(classesData);
      
      if (programsRes.success) setPrograms(programsRes.data || []);
      if (subjectsRes.success) setSubjects(subjectsRes.data || []);
      if (classesSnap.success) {
        setClasses(classesSnap.data);
      } else {
        error('[EnrollmentsPage] Classes service error:', classesSnap.error);
        toast.error(classesSnap.error || t('failed_to_load_classes') || 'Failed to load classes');
      }
    } catch (e) {
      error('[EnrollmentsPage] Error loading data:', e);
    } finally {
      setInitialLoading(false);
      stopLoading();
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadStudents = async (classId) => {
    setLoading(true);
    try {
      const result = await getStudentsByClass(classId);
      if (!result.success) {
        throw new Error(result.error || t('enrollments_failed_to_load_students'));
      }

      const normalizedStudents = (result.data || []).map((enrollment) => {
        const studentUser = enrollment.user || {};
        const userId = enrollment.userId ?? studentUser.id;
        return {
          ...enrollment,
          id: userId,
          userId,
          email: studentUser.email || enrollment.email || '',
          displayName: studentUser.displayName,
          displayNameAr: studentUser.displayNameAr,
          firstName: studentUser.firstName,
          lastName: studentUser.lastName,
          firstNameAr: studentUser.firstNameAr,
          lastNameAr: studentUser.lastNameAr,
          isDisabled: Boolean(enrollment.isDisabled),
        };
      });

      setStudents(normalizedStudents);
    } catch (e) {
      error('[EnrollmentsPage] Error loading students:', e);
      toast.error(
        t('failed_to_load_students', { error: e?.message || 'unknown error' }) ||
        'Failed to load students: ' + (e?.message || 'unknown error')
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleStudentAccess = async (studentId, currentlyDisabled) => {
    if (!selectedClass) return;
    
    // Set button loading state
    setButtonLoading(studentId);
    
    try {
      // Get student details for notifications
      const student = students.find(s => matchUserId(s.id || s.userId, studentId));
      
      const result = await toggleStudentAccessService(
        selectedClass.id, 
        studentId, 
        currentlyDisabled,
        {
          studentEmail: student?.email,
          studentName: getLocalizedUserName(student, lang),
          className: selectedClass.name || selectedClass.code,
          instructorName: getLocalizedUserName(user, lang),
          lang: t('lang') || 'en'
        }
      );
      
      if (result.success) {
        const action = currentlyDisabled ? 'enabled' : 'disabled';
        toast?.showSuccess(
          t(`student_access_${action}_success`) || 
          t('enrollments_student_access_action_success', { action, notificationSent: result.data.notificationSent ? ' and notification sent' : '' })
        );
        // Reload students to reflect the change
        await loadStudents(selectedClass.id);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      error('Failed to toggle student access:', error);
      toast?.showError(t('failed_to_update_student_access') || 'Failed to update student access');
    } finally {
      // Clear button loading state
      setButtonLoading(null);
    }
  };

  const filteredStudents = students.filter(s => {
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const localizedName = getLocalizedUserName(s, lang, '').toLowerCase();
      if (
        !localizedName.includes(term) &&
        !(s.displayName || '').toLowerCase().includes(term) &&
        !(s.email || '').toLowerCase().includes(term) &&
        !String(s.id || s.userId || '').toLowerCase().includes(term)
      ) {
        return false;
      }
    }

    // Enrollment status filter
    if (enrollmentStatusFilter !== 'all') {
      if (enrollmentStatusFilter === 'active' && s.isDisabled) return false;
      if (enrollmentStatusFilter === 'inactive' && !s.isDisabled) return false;
    }

    return true;
  });

  if (!isAdmin && !isInstructor && !isSuperAdmin) {
    return (
      <Container maxWidth="md" className={styles.accessDenied}>
        {getThemedIcon('ui', 'shield', 48, theme)}
        <h2>{t('access_denied') || 'Access Denied'}</h2>
        <p>{t('page_only_accessible_instructors_admins') || 'This page is only accessible to instructors and admins.'}</p>
      </Container>
    );
  }

  // Full-page loading
  if (initialLoading) {
    return <GlobalLoadingFallback />;
  }

  return (
    <Container maxWidth="xl" className={styles.page} style={{ padding: '1rem 0' }}>
      <Joyride continuous run={runTour && tourSteps.length > 0} steps={tourSteps} callback={handleTourCallback} scrollOffset={100} scrollToFirstStep showSkipButton showProgress tooltipComponent={TourTooltipComponent}
        locale={{ back: t('tour_back'), close: t('tour_close'), last: t('tour_finish'), next: t('tour_next'), skip: t('tour_skip') }}
        styles={{ options: { primaryColor: 'var(--color-primary,#800020)', textColor: theme === 'dark' ? '#e5e7eb' : '#111', backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', zIndex: 10000 } }}
      />
      <div className={styles.layout}>
        {/* Class List */}
        <Card data-tour="enroll-classes" className={styles.classList}>
          <CardBody style={{ position: 'relative' }}>
            <div className={styles.classListHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{t('classes') || 'Classes'} ({filteredClasses.length})</span>
              
            </div>
            
            {filterLoading && (
              <div style={{ 
                position: 'absolute', 
                top: '3rem', 
                left: 0, 
                right: 0, 
                bottom: 0, 
                background: theme === 'dark' ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255,255,255,0.95)', 
                zIndex: 1000, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                borderRadius: '8px'
              }}>
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <div className="simple-loading__spinner" style={{ width: '32px', height: '32px' }}>
                    <div className="simple-loading__spinner-circle" style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderWidth: '3px',
                      borderTopColor: 'var(--primary, #800020)'
                    }}></div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Quick Search */}
            <div style={{ marginBottom: '0.5rem' }}>
              <Input
                type="text"
                placeholder={t('search_classes_quick') || 'Quick search: class name, code, year, semester...'}
                value={classSearch}
                onChange={(e) => setClassSearch(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
            
            {/* Filters */}
            <div data-tour="enroll-filters" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginBottom: '1rem' }}>
              <Select
                searchable
                value={programFilter}
                onChange={(e) => {
                  setFilterLoading(true);
                  setProgramFilter(e.target.value);
                  setTimeout(() => setFilterLoading(false), 800);
                }}
                options={[
                  { value: 'all', label: t('enrollments_all_programs_filter') },
                  ...programs.map(p => ({
                    value: p.docId || p.id,
                    label: p.nameEn || p.nameAr || p.code || p.docId
                  }))
                ]}
                fullWidth
              />
              <Select
                searchable
                value={subjectFilter}
                onChange={(e) => {
                  setFilterLoading(true);
                  setSubjectFilter(e.target.value);
                  setTimeout(() => setFilterLoading(false), 800);
                }}
                options={[
                  { value: 'all', label: t('enrollments_all_subjects_filter') },
                  ...subjects
                    .filter(s => programFilter === 'all' || s.programId === programFilter)
                    .map(s => ({
                      value: s.docId || s.id,
                      label: `${s.code || ''} - ${s.nameEn || s.nameAr || s.docId}`
                    }))
                ]}
                fullWidth
              />
              <Select
                searchable
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                options={[
                  { value: 'all', label: t('enrollments_all_classes_filter') },
                  ...classes
                    .filter(c => {
                      if (subjectFilter !== 'all' && c.subjectId !== subjectFilter) return false;
                      if (programFilter !== 'all') {
                        const subject = subjects.find(s => (s.docId || s.id) === c.subjectId);
                        if (!subject || subject.programId !== programFilter) return false;
                      }
                      return true;
                    })
                    .map(c => ({
                      value: c.id || c.docId,
                      label: `${c.name || c.code || 'Unnamed'}${c.code ? ` (${c.code})` : ''}`
                    }))
                ]}
                fullWidth
              />
              <Select
                searchable
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                options={[
                  { value: 'all', label: t('enrollments_all_years_filter') },
                  ...availableYears.map(year => ({ value: year, label: year }))
                ]}
                fullWidth
              />
              <Select
                searchable
                value={termFilter}
                onChange={(e) => setTermFilter(e.target.value)}
                options={[
                  { value: 'all', label: t('enrollments_all_terms_filter') },
                  ...availableTerms
                ]}
                fullWidth
              />
            </div>
            
            <div className={styles.classItems}>
            {filteredClasses.map((cls, idx) => {
              const classId = cls.id || cls.docId;
              const isSelected = (selectedClass?.id === classId) || (selectedClass?.docId === classId);
              const uniqueKey = classId || `class-${idx}`;
              return (
                <div
                  key={uniqueKey}
                  onClick={() => { 
                    if (classId) {
                      setSelectedClass({ ...cls, id: classId, docId: classId }); 
                      setClassLoading(true);
                      loadStudents(classId).finally(() => setClassLoading(false));
                    }
                  }}
                  className={`${styles.classItem} ${isSelected ? styles.classItemSelected : ''}`}
                  style={{ cursor: classId ? 'pointer' : 'default' }}
                >
                  <div className={styles.className}>{cls.name || cls.code || 'Unnamed Class'}</div>
                  <div className={styles.classInfo}>
                    {cls.term && `${cls.term}`} {cls.year && `• ${cls.year}`}
                  </div>
                </div>
              );
            })}
            </div>
          </CardBody>
        </Card>

        {/* Students List */}
        <Card data-tour="enroll-students" className={styles.studentsPanel}>
          <CardBody>
          {!selectedClass ? (
            <EmptyState
              icon={getThemedIcon('ui', 'search', 16, theme)}
              title={t('select_class') || 'Select a class to manage student access'}
            />
          ) : (
            <>
              <div className={styles.selectedClassHeader}>
                <h2>{selectedClass.name || selectedClass.code}</h2>
                <div className={styles.stats}>
                  {t('total_students') || 'Total Students'}: {students.length}
                  {' • '}
                  {t('disabled') || 'Disabled'}: {students.filter(s => s.isDisabled).length}
                </div>
              </div>

              {/* Search and Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Input
                  type="text"
                  placeholder={t('search_students') || 'Search students...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                  style={{ flex: 3 }}
                />

                <Select
                  value={enrollmentStatusFilter}
                  onChange={(e) => setEnrollmentStatusFilter(e.target.value)}
                  options={[
                    { value: 'all', label: t('all_enrollment_status') || 'All Enrollment Status' },
                    { value: 'active', label: t('enrollment_active') || 'Active' },
                    { value: 'inactive', label: t('enrollment_inactive') || 'Inactive/Dropped' }
                  ]}
                  placeholder={t('filter_by_enrollment_status') || 'Filter by enrollment status'}
                  style={{ minWidth: '180px' }}
                />
                
                {/* Info Button */}
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <PortalTooltip content={t('click_to_see_info_about_disabling_students')} position="top">
                  <button
                    onClick={() => setShowInfoTooltip(!showInfoTooltip)}
                    style={{
                      background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                      border: '1px solid #dee2e6',
                      borderRadius: '50%',
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                    }}
                  >
                    {getThemedIcon('ui', 'info', 14, theme)}
                  </button>
                </PortalTooltip>
                  
                  {showInfoTooltip && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      right: '0',
                      marginTop: '0.5rem',
                      background: 'linear-gradient(135deg, #ffffff, #f8f9fa)',
                      border: '1px solid #e9ecef',
                      borderRadius: '12px',
                      padding: '1rem',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.08)',
                      zIndex: 1000,
                      width: '280px',
                      fontSize: '0.85rem',
                      color: '#495057'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: '600', color: '#343a40' }}>
                        {getThemedIcon('ui', 'alert_circle', 16, theme)}
                        <span>{t('disabling_students') || 'Disabling Students'}</span>
                      </div>
                      <div style={{ lineHeight: '1.4' }}>
                        {t('disable_student_info') || 'When you disable a student, they lose access to:'}
                        <ul style={{ margin: '0.5rem 0', paddingLeft: '1.2rem', color: '#6c757d' }}>
                          <li>{t('class_chat_participation') || 'Class chat participation'}</li>
                          <li>{t('viewing_class_activities') || 'Viewing class activities'}</li>
                          <li>{t('submitting_assignments') || 'Submitting assignments'}</li>
                          <li>{t('attendance_scanning') || 'Attendance scanning'}</li>
                        </ul>
                        <div style={{ marginTop: '0.5rem', fontStyle: 'italic', color: '#8b5cf6' }}>
                          {t('re_enable_access') || 'You can re-enable access anytime.'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Students Table */}
              {loading || classLoading ? (
                <div className={styles.loadingState}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    margin: '0 auto'
                  }}>
                    <div className="simple-loading__spinner" style={{ width: '32px', height: '32px' }}>
                      <div className="simple-loading__spinner-circle" style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderWidth: '3px',
                        borderTopColor: 'var(--primary, #800020)'
                      }}></div>
                    </div>
                  </div>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div style={{ 
                  padding: '2rem', 
                  textAlign: 'center', 
                  color: 'transparent',
                  minHeight: '100px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {/* Hidden empty state - no magnifier or text */}
                </div>
              ) : (
                <div className={styles.studentsList}>
                  {filteredStudents.map(student => (
                    <div
                      key={student.id}
                      className={`${styles.studentItem} ${student.isDisabled ? styles.studentDisabled : ''}`}
                    >
                      <div className={styles.studentInfo}>
                        <div className={styles.studentName}>
                          {getLocalizedUserName(student, lang) || student.email}
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            color: student.isDisabled
                              ? 'var(--color-danger, #dc2626)'
                              : 'var(--color-success, #28a745)'
                          }}>
                            {student.isDisabled
                              ? getThemedIcon('ui', 'user_x', 14, theme)
                              : getThemedIcon('ui', 'check_circle', 14, theme)}
                            {student.isDisabled
                              ? (t('status_disabled') || 'Disabled')
                              : (t('status_active') || 'Active')}
                          </span>
                        </div>
                        <div className={styles.studentEmail}>
                          {student.email}
                        </div>
                      </div>
                      <Button
                        onClick={() => toggleStudentAccess(student.id, student.isDisabled)}
                        variant={student.isDisabled ? 'primary' : 'danger'}
                        size="sm"
                        disabled={buttonLoading === student.id}
                        icon={buttonLoading === student.id ? (
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center' 
                          }}>
                            <div className="simple-loading__spinner" style={{ width: '16px', height: '16px' }}>
                              <div className="simple-loading__spinner-circle" style={{ 
                                width: '16px', 
                                height: '16px', 
                                borderWidth: '2px',
                                borderTopColor: 'currentColor'
                              }}></div>
                            </div>
                          </div>
                        ) : (
                          student.isDisabled ? getThemedIcon('ui', 'user_check', 16, theme) : getThemedIcon('ui', 'user_x', 16, theme)
                        )}
                      >
                        {buttonLoading === student.id ? '' : (student.isDisabled ? 'Enable' : 'Disable')}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          </CardBody>
        </Card>
      </div>
    </Container>
  );
};

export default EnrollmentsPage;
