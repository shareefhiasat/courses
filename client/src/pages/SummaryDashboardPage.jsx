import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { info, error, warn, debug } from '@logger';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { Button, SimpleLoading, useToast, Card, CardBody, Select } from '@ui';
import dashboardBusinessService from '@services/business/dashboardBusinessService.js';

const SummaryDashboardPage = () => {
  const { user, isAdmin, isHR, isSuperAdmin, isInstructor } = useAuth();
  const { t, lang, isRTL } = useLang();
  const { theme } = useTheme();
  const toast = useToast();
  
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [accessiblePrograms, setAccessiblePrograms] = useState([]);
  
  // Load accessible programs based on category access
  const loadAccessiblePrograms = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/user-category-access/user/:userId/programs'.replace(':userId', user.id));
      const result = await response.json();
      
      if (result.success) {
        setAccessiblePrograms(result.data);
        if (result.data.length > 0) {
          setSelectedProgram(result.data[0].id.toString());
        }
      }
    } catch (error) {
      console.error('Error loading accessible programs:', error);
    }
  }, [user.id]);
  
  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await dashboardBusinessService.getDashboardSummary(selectedProgram);
      
      if (result.success) {
        setDashboardData(result.data);
      } else {
        setError(result.error);
        toast.error(result.error || t('failed_to_load_dashboard') || 'Failed to load dashboard');
      }
    } catch (error) {
      setError(error.message);
      toast.error(error.message || t('failed_to_load_dashboard') || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [toast, t, selectedProgram]);
  
  // Load data on mount
  useEffect(() => {
    loadAccessiblePrograms();
  }, [loadAccessiblePrograms]);
  
  useEffect(() => {
    if (selectedProgram) {
      loadDashboardData();
    }
  }, [loadDashboardData, selectedProgram]);
  
  // Program options
  const programOptions = useMemo(() => {
    return [
      { value: '', label: t('all_programs') || 'All Programs' },
      ...accessiblePrograms.map(program => ({
        value: program.id.toString(),
        label: isRTL ? `${program.nameAr || program.nameEn} (${program.code})` : `${program.nameEn} (${program.code})`
      }))
    ];
  }, [accessiblePrograms, isRTL, t]);
  
  // Check permissions
  const hasPermission = isAdmin || isHR || isSuperAdmin;
  
  if (!hasPermission) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.125rem', fontWeight: '500', color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}>
          {t('access_denied') || 'Access Denied'}
        </div>
        <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginTop: '0.5rem' }}>
          {t('dashboard_permission_required') || 'You need admin or HR privileges to view the dashboard.'}
        </div>
      </div>
    );
  }
  
  return (
    <div style={{ padding: '1rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            {t('summary_dashboard') || 'Summary Dashboard'}
          </h1>
          <p style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
            {t('dashboard_welcome') || `Welcome back, ${user?.displayName || user?.firstName || 'User'}`}
          </p>
        </div>
        
        {/* Program Selector */}
        {accessiblePrograms.length > 0 && (
          <div style={{ minWidth: '250px' }}>
            <Select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              options={programOptions}
              style={{ width: '100%' }}
            />
          </div>
        )}
      </div>
      
      {loading ? (
        <SimpleLoading />
      ) : error ? (
        <div style={{ padding: '1rem', color: 'red' }}>
          {error}
        </div>
      ) : dashboardData ? (
        <>
          {/* Quick Stats Row */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem', 
            marginBottom: '1.5rem' 
          }}>
            {/* Total Teachers */}
            <Card>
              <CardBody>
                <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginBottom: '0.25rem' }}>
                  {t('total_teachers') || 'Total Teachers'}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '600', color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}>
                  {dashboardData.totalTeachers || 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                  {dashboardData.activeTeachers || 0} {t('active') || 'active'}
                </div>
              </CardBody>
            </Card>
            
            {/* Subjects */}
            <Card>
              <CardBody>
                <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginBottom: '0.25rem' }}>
                  {t('subjects') || 'Subjects'}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '600', color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}>
                  {dashboardData.totalSubjects || 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                  {dashboardData.totalCategories || 0} {t('categories') || 'categories'}
                </div>
              </CardBody>
            </Card>
            
            {/* Classrooms */}
            <Card>
              <CardBody>
                <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginBottom: '0.25rem' }}>
                  {t('classrooms') || 'Classrooms'}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '600', color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}>
                  {dashboardData.totalClassrooms || 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                  {dashboardData.availableClassrooms || 0} {t('available') || 'available'}
                </div>
              </CardBody>
            </Card>
            
            {/* This Week Sessions */}
            <Card>
              <CardBody>
                <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginBottom: '0.25rem' }}>
                  {t('this_week_sessions') || 'This Week Sessions'}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '600', color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}>
                  {dashboardData.weekSessions || 0}
                </div>
              </CardBody>
            </Card>
            
            {/* This Month Sessions */}
            <Card>
              <CardBody>
                <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginBottom: '0.25rem' }}>
                  {t('this_month_sessions') || 'This Month Sessions'}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '600', color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}>
                  {dashboardData.monthSessions || 0}
                </div>
              </CardBody>
            </Card>
            
            {/* This Year Sessions */}
            <Card>
              <CardBody>
                <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginBottom: '0.25rem' }}>
                  {t('this_year_sessions') || 'This Year Sessions'}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '600', color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}>
                  {dashboardData.yearSessions || 0}
                </div>
              </CardBody>
            </Card>
          </div>
          
          {/* Main Content Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
            {/* Today's Schedule */}
            <Card>
              <CardBody>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '1rem' }}>
                  {t('today_schedule') || "Today's Schedule"}
                </h3>
                <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginBottom: '0.5rem' }}>
                  {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </div>
                {dashboardData.todaySchedule && dashboardData.todaySchedule.length > 0 ? (
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {dashboardData.todaySchedule.map((session, index) => (
                      <div
                        key={index}
                        style={{
                          padding: '0.75rem',
                          borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: '500', fontSize: '0.875rem' }}>
                            {isRTL ? session.subject?.nameAr : session.subject?.nameEn}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                            {session.program?.nameEn} | {session.classroom?.nameEn || t('no_classroom') || 'No Classroom'}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                            {session.timeSlot?.startTime} - {session.timeSlot?.endTime}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                            {session.instructor?.displayName || session.instructor?.firstName}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '2rem', textAlign: 'center', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                    {t('no_sessions_today') || 'No sessions today'}
                  </div>
                )}
              </CardBody>
            </Card>
            
            {/* Side Widgets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Upcoming Holidays */}
              <Card>
                <CardBody>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '1rem' }}>
                    {t('upcoming_holidays') || 'Upcoming Holidays'}
                  </h3>
                  {dashboardData.holidays && dashboardData.holidays.length > 0 ? (
                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                      {dashboardData.holidays.map((holiday, index) => (
                        <div
                          key={index}
                          style={{
                            padding: '0.5rem',
                            borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                            fontSize: '0.875rem'
                          }}
                        >
                          <div style={{ fontWeight: '500' }}>
                            {isRTL ? holiday.descriptionAr : holiday.descriptionEn}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                            {new Date(holiday.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '1rem', textAlign: 'center', color: theme === 'dark' ? '#9ca3af' : '#6b7280', fontSize: '0.875rem' }}>
                      {t('no_upcoming_holidays') || 'No upcoming holidays'}
                    </div>
                  )}
                </CardBody>
              </Card>
              
              {/* Quick Actions */}
              <Card>
                <CardBody>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '1rem' }}>
                    {t('quick_actions') || 'Quick Actions'}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <Button variant="outline" style={{ width: '100%' }} onClick={() => window.location.href = '/flexible-schedule'}>
                      {t('view_schedule') || 'View Full Schedule'}
                    </Button>
                    <Button variant="outline" style={{ width: '100%' }} onClick={() => window.location.href = '/instructor-availability'}>
                      {t('manage_instructor_availability') || 'Manage Instructor Availability'}
                    </Button>
                    <Button variant="outline" style={{ width: '100%' }} onClick={() => window.location.href = '/classroom-availability'}>
                      {t('manage_room_availability') || 'Manage Room Availability'}
                    </Button>
                    {isSuperAdmin && (
                      <Button variant="outline" style={{ width: '100%' }} onClick={() => window.location.href = '/user-category-access'}>
                        {t('manage_category_access') || 'Manage Category Access'}
                      </Button>
                    )}
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
          
          {/* Teacher Load & Subject Sessions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
            {/* Teacher Load */}
            <Card>
              <CardBody>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '1rem' }}>
                  {t('teacher_load_month') || 'Teacher Load (This Month)'}
                </h3>
                {dashboardData.teacherLoad && dashboardData.teacherLoad.length > 0 ? (
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {dashboardData.teacherLoad.map((item, index) => (
                      <div
                        key={index}
                        style={{
                          padding: '0.5rem',
                          borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.875rem'
                        }}
                      >
                        <span>{item.instructorName}</span>
                        <span style={{ fontWeight: '500' }}>{item.sessionCount} {t('sessions') || 'sessions'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '1rem', textAlign: 'center', color: theme === 'dark' ? '#9ca3af' : '#6b7280', fontSize: '0.875rem' }}>
                    {t('no_teacher_data') || 'No teacher data available'}
                  </div>
                )}
              </CardBody>
            </Card>
            
            {/* Subject Sessions */}
            <Card>
              <CardBody>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '1rem' }}>
                  {t('subject_sessions_month') || 'Subject Sessions (This Month)'}
                </h3>
                {dashboardData.subjectSessions && dashboardData.subjectSessions.length > 0 ? (
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {dashboardData.subjectSessions.map((item, index) => (
                      <div
                        key={index}
                        style={{
                          padding: '0.5rem',
                          borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.875rem'
                        }}
                      >
                        <span>{isRTL ? item.subjectNameAr : item.subjectNameEn}</span>
                        <span style={{ fontWeight: '500' }}>{item.sessionCount} {t('sessions') || 'sessions'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '1rem', textAlign: 'center', color: theme === 'dark' ? '#9ca3af' : '#6b7280', fontSize: '0.875rem' }}>
                    {t('no_subject_data') || 'No subject data available'}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default SummaryDashboardPage;
