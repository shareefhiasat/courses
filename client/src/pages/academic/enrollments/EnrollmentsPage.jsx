import React, { useEffect, useState, useMemo, useCallback } from 'react';
import logger from '@utils/logger';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getPrograms, getSubjects } from '@services/business/programService';
import { getClasses } from '@services/business/classService';
import { getEnrolledStudents, toggleStudentAccess as toggleStudentAccessService } from '@services/business/enrollmentService';
import { Container, Card, CardBody, Button, Input, Badge, EmptyState, useToast, Select, YearSelect, Loading } from '@ui';
import { FancyLoading } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import styles from './EnrollmentsPage.module.css';

const EnrollmentsPage = () => {
  const { user, isAdmin, isInstructor } = useAuth();
  const { t } = useLang();
  const { theme } = useTheme();
  const toast = useToast();
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

  const availableYears = useMemo(() => {
    const years = new Set();
    classes.forEach(cls => {
      if (cls.year) {
        years.add(String(cls.year));
      } else if (cls.term) {
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
        const termPart = cls.term.split(' ')[0];
        if (termPart) terms.add(termPart);
      }
    });
    return Array.from(terms).sort();
  }, [classes]);

  const filteredClasses = useMemo(() => {
    let result = [...classes];
    
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
        if (cls.term) {
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
        const termPart = cls.term.split(' ')[0];
        return termPart === termFilter;
      });
    }
    
    // Sort by name
    result.sort((a, b) => (a.name || a.code || '').localeCompare(b.name || b.code || ''));
    
    return result;
  }, [classes, programs, subjects, programFilter, subjectFilter, classFilter, yearFilter, termFilter]);

  
  const loadData = async () => {
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
        logger.error('[EnrollmentsPage] Classes service error:', classesSnap.error);
        toast.error(classesSnap.error || t('failed_to_load_classes') || 'Failed to load classes');
      }
    } catch (e) {
      logger.error('[EnrollmentsPage] Error loading data:', e);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadStudents = async (classId) => {
    setLoading(true);
    try {
      const result = await getEnrolledStudents(classId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to load students');
      }

      setStudents(result.data || []);
    } catch (e) {
      logger.error('[EnrollmentsPage] Error loading students:', e);
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
      const student = students.find(s => (s.docId || s.id) === studentId);
      
      const result = await toggleStudentAccessService(
        selectedClass.id, 
        studentId, 
        currentlyDisabled,
        {
          studentEmail: student?.email,
          studentName: student?.displayName || student?.realName,
          className: selectedClass.name || selectedClass.code,
          instructorName: user?.displayName || user?.realName,
          lang: t('lang') || 'en'
        }
      );
      
      if (result.success) {
        const action = currentlyDisabled ? 'enabled' : 'disabled';
        toast?.showSuccess(
          t(`student_access_${action}_success`) || 
          `Student access ${action} successfully${result.data.notificationSent ? ' and notification sent' : ''}`
        );
        // Reload students to reflect the change
        await loadStudents(selectedClass.id);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      logger.error('Failed to toggle student access:', error);
      toast?.showError(t('failed_to_update_student_access') || 'Failed to update student access');
    } finally {
      // Clear button loading state
      setButtonLoading(null);
    }
  };

  const filteredStudents = students.filter(s => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (s.displayName || '').toLowerCase().includes(term) ||
      (s.email || '').toLowerCase().includes(term) ||
      (s.id || '').toLowerCase().includes(term)
    );
  });

  if (!isAdmin && !isInstructor) {
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
    return (
      <Loading 
        variant="overlay" 
        fullscreen 
        message={t('loading_enrollments') || 'Loading enrollments...'} 
        fancyVariant="dots" 
      />
    );
  }

  return (
    <Container maxWidth="xl" className={styles.page} style={{ padding: '1rem 0' }}>
      <div className={styles.layout}>
        {/* Class List */}
        <Card className={styles.classList}>
          <CardBody style={{ position: 'relative' }}>
            <div className={styles.classListHeader}>{t('classes') || 'Classes'} ({filteredClasses.length})</div>
            
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
                  <FancyLoading />
                </div>
              </div>
            )}
            
            {/* Filters */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginBottom: '1rem' }}>
              <Select
                searchable
                value={programFilter}
                onChange={(e) => {
                  setFilterLoading(true);
                  setProgramFilter(e.target.value);
                  setTimeout(() => setFilterLoading(false), 800);
                }}
                options={[
                  { value: 'all', label: t('all_programs_filter') || 'All Programs' },
                  ...programs.map(p => ({
                    value: p.docId || p.id,
                    label: p.name_en || p.name_ar || p.code || p.docId
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
                  { value: 'all', label: t('all_subjects_filter') || 'All Subjects' },
                  ...subjects
                    .filter(s => programFilter === 'all' || s.programId === programFilter)
                    .map(s => ({
                      value: s.docId || s.id,
                      label: `${s.code || ''} - ${s.name_en || s.name_ar || s.docId}`
                    }))
                ]}
                fullWidth
              />
              <Select
                searchable
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                options={[
                  { value: 'all', label: t('all_classes_filter') || 'All Classes' },
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
                  { value: 'all', label: t('all_years') || 'All Years' },
                  ...availableYears.map(year => ({ value: year, label: year }))
                ]}
                fullWidth
              />
              <Select
                searchable
                value={termFilter}
                onChange={(e) => setTermFilter(e.target.value)}
                options={[
                  { value: 'all', label: t('all_terms') || 'All Terms' },
                  ...availableTerms.map(term => ({ value: term, label: term }))
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
        <Card className={styles.studentsPanel}>
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
                  style={{ flex: 1 }}
                />
                
                {/* Info Button */}
                <div style={{ position: 'relative', display: 'inline-block' }}>
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
                    title="Click to see info about disabling students"
                  >
                    {getThemedIcon('ui', 'info', 14, theme)}
                  </button>
                  
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
                    <FancyLoading />
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
                          {student.displayName || student.email}
                          {student.isDisabled && (
                            <Badge variant="danger" size="sm">{t('disabled') || 'DISABLED'}</Badge>
                          )}
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
                            <FancyLoading standalone={true} />
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
