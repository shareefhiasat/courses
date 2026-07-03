import React, { useState, useMemo, useEffect, useLayoutEffect, useCallback } from 'react';
import Joyride from 'react-joyride';
import TourTooltip from '@ui/TourTooltip/TourTooltip';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useColorTheme } from '@contexts/ColorThemeContext';
import { Tabs } from '@ui';
import { GlobalLoadingFallback, useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import iconTypes from '@constants/iconTypes';
import { getAcademicTermOptions, getAcademicTermLabel } from '@constants/academicTerms';
const { getIconWithColor } = iconTypes;
import useDashboardData from '@hooks/useDashboardData';
import useStudentDashboardFilters from '@hooks/useStudentDashboardFilters';
import { UnifiedFilterSection } from '@/components/filters';

import { info, error, warn, debug } from '@services/utils/logger.js';import './StudentDashboardPageModern.css';

export default function StudentDashboardPageModern() {
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const { user, userProfile, isAdmin, isInstructor, isHR, loading: authLoading } = useAuth();
  const { startLoading } = useGlobalLoading();
  const { primaryColor } = useColorTheme();

  // ── Guided Tour ──────────────────────────────────────────────────────────
  const [runTour, setRunTour] = useState(false);
  const [tourSteps, setTourSteps] = useState([]);
  const tourSeenKey = `studentDashModernTourSeen_${lang}`;
  const buildTourSteps = useCallback(() => [
    { target: '[data-tour="nav-tabs"]', content: t('tour.student_dash_tabs'), disableBeacon: true, placement: 'bottom' },
    { target: '[data-tour="student-dash-filters"]', content: t('tour.student_dash_filters'), disableBeacon: true, placement: 'bottom' },
    { target: '[data-tour="student-dash-content"]', content: t('tour.student_dash_content'), disableBeacon: true, placement: 'top' },
  ].filter(s => !!document.querySelector(s.target)), [t]);
  const startTour = useCallback(() => { const steps = buildTourSteps(); if (!steps.length) return; setTourSteps(steps); setRunTour(true); }, [buildTourSteps]);
  useEffect(() => {
    window.addEventListener('app:joyride', startTour);
    window.addEventListener('app:help', startTour);
    return () => { window.removeEventListener('app:joyride', startTour); window.removeEventListener('app:help', startTour); };
  }, [startTour]);
  useEffect(() => { try { if (!localStorage.getItem(tourSeenKey)) startTour(); } catch {} }, [tourSeenKey, startTour]);
  const handleTourCallback = useCallback((data) => {
    const { status, action } = data || {};
    if (status === 'finished' || status === 'skipped' || action === 'close') { setRunTour(false); try { localStorage.setItem(tourSeenKey, 'true'); } catch {} }
  }, [tourSeenKey]);
  const TourTooltipComponent = useMemo(() => TourTooltip({ tourSeenKey }), [tourSeenKey]);
  // ──────────────────────────────────────────────────────────────────────────
  
  const [activeView, setActiveView] = useState('overview');
  const [selectedStudent, setSelectedStudent] = useState('all');
  const [selectedProgram, setSelectedProgram] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedTerm, setSelectedTerm] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const displayUserId = selectedStudent === 'all' ? user?.uid : selectedStudent;
  const { enrollments, loading, reload } = useDashboardData(displayUserId);
  const { students, programs, subjects, classes, loading: filtersLoading } = useStudentDashboardFilters({ 
    enableStudentList: isAdmin || isInstructor || isHR 
  });

  const displayName = useMemo(() => {
    if (selectedStudent !== 'all' && selectedStudent) {
      return students.find(s => s.id === selectedStudent)?.displayName || 'Student';
    }
    return userProfile?.displayName || user?.displayName || 'Student';
  }, [selectedStudent, students, userProfile, user]);

  const availableYears = useMemo(() => {
    const years = new Set();
    enrollments?.forEach(enrollment => {
      const year = enrollment.academicYear || enrollment.year;
      if (year) years.add(String(year));
    });
    return Array.from(years).sort();
  }, [enrollments]);

  const availableTerms = useMemo(() => {
    const terms = new Set();
    enrollments?.forEach(enrollment => {
      const term = enrollment.semester || enrollment.term;
      if (term) terms.add(term);
    });
    
    // Convert to options with localized labels
    const termValues = Array.from(terms).sort();
    return termValues.map(termValue => ({
      value: termValue,
      label: getAcademicTermLabel(termValue, lang, t)
    }));
  }, [enrollments, lang, t]);

  const studentOptions = useMemo(() => {
    return [
      { value: 'all', label: t('all_students') },
      ...students.map(student => ({
        value: student.id,
        label: student.displayName || student.email
      }))
    ];
  }, [students, t]);

  const navItems = [
    { id: 'overview', label: { en: 'Overview', ar: 'نظرة عامة' }, icon: 'layout_grid' },
    { id: 'tasks', label: { en: 'Tasks', ar: 'المهام' }, icon: 'clipboard_list' },
    { id: 'attendance', label: { en: 'Attendance', ar: 'الحضور' }, icon: 'calendar_check' },
    { id: 'performance', label: { en: 'Performance', ar: 'الأداء' }, icon: 'trending_up' },
    { id: 'marks', label: { en: 'Marks', ar: 'الدرجات' }, icon: 'award' },
    { id: 'penalties', label: { en: 'Penalties', ar: 'العقوبات' }, icon: 'alert_triangle' },
    { id: 'participations', label: { en: 'Participations', ar: 'المشاركات' }, icon: 'thumbs_up' },
    { id: 'behaviors', label: { en: 'Behaviors', ar: 'السلوكيات' }, icon: 'star' }
  ];

  const tabs = navItems.map(item => ({
    value: item.id,
    label: item.label[lang] || item.label.en,
    icon: activeView === item.id ? getIconWithColor('ui', item.icon, 16, '#ffffff') : getIconWithColor('ui', item.icon, 16, primaryColor),
    badge: activeView === item.id ? 0 : undefined
  }));

  const stats = useMemo(() => {
    return {
      total: enrollments?.length || 0,
      completed: 0,
      pending: 0,
      overdue: 0
    };
  }, [enrollments]);

  // Use GlobalLoading for initial data load
  useLayoutEffect(() => {
    if (authLoading) return;
    if (!user) return;

    let stopped = false;
    const stopGlobalLoading = startLoading();
    const safeStop = () => {
      if (stopped) return;
      stopped = true;
      stopGlobalLoading();
    };

    const loadData = async () => {
      try {
        await reload(); // Use the reload function from useDashboardData
      } catch (error) {
        error('Error loading dashboard data:', error);
      } finally {
        safeStop();
      }
    };

    loadData();

    return () => {
      safeStop();
    };
  }, [authLoading, user, reload, startLoading]);

  if (authLoading) return <GlobalLoadingFallback />;

  return (
    <div className="student-dashboard-page-modern" data-theme={theme} style={{ padding: '0rem 0', position: 'relative' }}>
      <Joyride continuous run={runTour && tourSteps.length > 0} steps={tourSteps} callback={handleTourCallback} scrollOffset={100} scrollToFirstStep showSkipButton showProgress tooltipComponent={TourTooltipComponent}
        locale={{ back: t('tour_back'), close: t('tour_close'), last: t('tour_finish'), next: t('tour_next'), skip: t('tour_skip') }}
        styles={{ options: { primaryColor: 'var(--color-primary,#800020)', textColor: theme === 'dark' ? '#e5e7eb' : '#111', backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', zIndex: 10000 } }}
      />
      <div className="content-section" style={{ position: 'relative' }}>
        {/* Navigation Tabs - Matching HomePage pattern */}
        <div data-tour="nav-tabs" style={{ marginBottom: '0.15rem' }}>
          <Tabs
            tabs={tabs}
            activeTab={activeView}
            onTabChange={setActiveView}
            variant="default"
          />
        </div>

        {/* Unified Filters Section */}
        {(isAdmin || isInstructor || isHR) && (
          <div data-tour="student-dash-filters">
          <UnifiedFilterSection
            stats={stats}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            searchPlaceholder={t('search_students')}
            programs={programs}
            subjects={subjects}
            classes={classes}
            selectedProgram={selectedProgram}
            setSelectedProgram={setSelectedProgram}
            selectedSubject={selectedSubject}
            setSelectedSubject={setSelectedSubject}
            selectedClass={selectedClass}
            setSelectedClass={setSelectedClass}
            students={studentOptions}
            selectedStudent={selectedStudent}
            setSelectedStudent={setSelectedStudent}
            years={availableYears}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            terms={availableTerms}
            selectedTerm={selectedTerm}
            setSelectedTerm={setSelectedTerm}
            theme={theme}
            lang={lang}
            t={t}
            primaryColor={primaryColor}
          />
          </div>
        )}

        {/* Content Area */}
        <div data-tour="student-dash-content" className="mt-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              {navItems.find(item => item.id === activeView)?.label[lang] || 'Overview'}
            </h2>
            <div className="text-slate-600 dark:text-slate-400">
              {lang === 'ar' ? `عرض ${navItems.find(item => item.id === activeView)?.label.ar || 'نظرة عامة'} للطالب: ${displayName}` : 
               `Showing ${navItems.find(item => item.id === activeView)?.label.en || 'Overview'} for student: ${displayName}`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
