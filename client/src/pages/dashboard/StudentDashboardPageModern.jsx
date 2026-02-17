import React, { useState, useMemo, useEffect, useLayoutEffect } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useColorTheme } from '@contexts/ColorThemeContext';
import { Tabs } from '@ui';
import { GlobalLoadingFallback, useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import iconTypes from '@constants/iconTypes';
const { getIconWithColor } = iconTypes;
import useDashboardData from '@hooks/useDashboardData';
import useStudentDashboardFilters from '@hooks/useStudentDashboardFilters';
import { UnifiedFilterSection } from '@/components/filters';
import './StudentDashboardPageModern.css';

export default function StudentDashboardPageModern() {
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const { user, userProfile, isAdmin, isInstructor, isHR, loading: authLoading } = useAuth();
  const { startLoading } = useGlobalLoading();
  const { primaryColor } = useColorTheme();
  
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
    return Array.from(terms);
  }, [enrollments]);

  const studentOptions = useMemo(() => {
    return [
      { value: 'all', label: t('all_students') || 'All Students' },
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

  // Auth loading check
  if (authLoading) {
    return <GlobalLoadingFallback />;
  }

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
        console.error('Error loading dashboard data:', error);
      } finally {
        safeStop();
      }
    };

    loadData();

    return () => {
      safeStop();
    };
  }, [authLoading, user, reload, startLoading]);

  return (
    <div className="student-dashboard-page-modern" data-theme={theme} style={{ padding: '0rem 0', position: 'relative' }}>
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
          <UnifiedFilterSection
            stats={stats}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            searchPlaceholder={t('search_students') || 'Search students...'}
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
        )}

        {/* Content Area */}
        <div className="mt-6">
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
