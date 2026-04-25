import React, { useState, useCallback, useEffect } from 'react';
import { info, error, warn, debug } from '@logger';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { Button, SimpleLoading, useToast, Card, CardBody } from '@ui';
import dashboardBusinessService from '@services/business/dashboardBusinessService.js';

const SummaryDashboardPage = () => {
  const { user, isAdmin, isHR, isSuperAdmin, isInstructor } = useAuth();
  const { t, lang, isRTL } = useLang();
  const { theme } = useTheme();
  const toast = useToast();
  
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await dashboardBusinessService.getDashboardSummary();
      
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
  }, [toast, t]);
  
  // Load data on mount
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);
  
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
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
          {t('summary_dashboard') || 'Summary Dashboard'}
        </h1>
        <p style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
          {t('dashboard_welcome') || `Welcome back, ${user?.displayName || user?.firstName || 'User'}`}
        </p>
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
            {/* Today's Sessions */}
            <Card>
              <CardBody>
                <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginBottom: '0.25rem' }}>
                  {t('today_sessions') || "Today's Sessions"}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '600', color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}>
                  {dashboardData.todaySchedule?.totalSessions || 0}
                </div>
              </CardBody>
            </Card>
            
            {/* Active Teachers */}
            <Card>
              <CardBody>
                <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginBottom: '0.25rem' }}>
                  {t('active_teachers') || 'Active Teachers'}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '600', color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}>
                  {dashboardData.teacherLoad?.length || 0}
                </div>
              </CardBody>
            </Card>
            
            {/* Active Classrooms */}
            <Card>
              <CardBody>
                <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginBottom: '0.25rem' }}>
                  {t('active_classrooms') || 'Active Classrooms'}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '600', color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}>
                  {dashboardData.classroomUtilization?.length || 0}
                </div>
              </CardBody>
            </Card>
            
            {/* Conflicts */}
            <Card>
              <CardBody>
                <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginBottom: '0.25rem' }}>
                  {t('conflicts') || 'Conflicts'}
                </div>
                <div style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '600', 
                  color: dashboardData.conflicts?.hasConflicts ? (theme === 'dark' ? '#fca5a5' : '#dc2626') : (theme === 'dark' ? '#f3f4f6' : '#1f2937')
                }}>
                  {dashboardData.conflicts?.count || 0}
                </div>
              </CardBody>
            </Card>
            
            {/* Pending Items */}
            <Card>
              <CardBody>
                <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginBottom: '0.25rem' }}>
                  {t('pending_items') || 'Pending Items'}
                </div>
                <div style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '600', 
                  color: dashboardData.pendingItems?.hasPending ? (theme === 'dark' ? '#fbbf24' : '#d97706') : (theme === 'dark' ? '#f3f4f6' : '#1f2937')
                }}>
                  {dashboardData.pendingItems?.count || 0}
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
                {dashboardData.todaySchedule?.sessions && dashboardData.todaySchedule.sessions.length > 0 ? (
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {dashboardData.todaySchedule.sessions.map((session, index) => (
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
                            {session.class?.nameEn} | {session.classroom?.nameEn || t('no_classroom') || 'No Classroom'}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                            {session.timeSlot?.startTime}
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
                    {t('no_sessions_today') || 'No sessions scheduled for today'}
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
                            {holiday.startDate} - {holiday.endDate}
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
                    <Button variant="outline" style={{ width: '100%' }}>
                      {t('view_schedule') || 'View Full Schedule'}
                    </Button>
                    <Button variant="outline" style={{ width: '100%' }}>
                      {t('manage_masters') || 'Manage Scheduling Masters'}
                    </Button>
                    <Button variant="outline" style={{ width: '100%' }}>
                      {t('bulk_schedule') || 'Bulk Schedule Sessions'}
                    </Button>
                    {isSuperAdmin && (
                      <Button variant="outline" style={{ width: '100%' }}>
                        {t('manage_scopes') || 'Manage Admin Scopes'}
                      </Button>
                    )}
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
          
          {/* Teacher Load & Classroom Utilization */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
            {/* Teacher Load */}
            <Card>
              <CardBody>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '1rem' }}>
                  {t('teacher_load') || 'Teacher Load'}
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
            
            {/* Classroom Utilization */}
            <Card>
              <CardBody>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '1rem' }}>
                  {t('classroom_utilization') || 'Classroom Utilization'}
                </h3>
                {dashboardData.classroomUtilization && dashboardData.classroomUtilization.length > 0 ? (
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {dashboardData.classroomUtilization.map((item, index) => (
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
                        <span>{item.classroomName}</span>
                        <span style={{ fontWeight: '500' }}>{item.sessionCount} {t('sessions') || 'sessions'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '1rem', textAlign: 'center', color: theme === 'dark' ? '#9ca3af' : '#6b7280', fontSize: '0.875rem' }}>
                    {t('no_classroom_data') || 'No classroom data available'}
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
