import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronLeft, ChevronRight, Filter, BarChart3 } from 'lucide-react';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { Button, useToast } from '@ui';
import { Card, CardContent, CardHeader, CardTitle } from '@ui';
import { SimpleLoading, EmptyState } from '@ui';
import { getComplianceData } from '@services/api/workflow-documents-api.js';

const CalendarCompliancePage = () => {
  const { t } = useLang();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [complianceData, setComplianceData] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    program: '',
    instructorId: null,
    workflowType: ''
  });

  // Fetch compliance data
  const fetchComplianceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date range for current month
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);

      const params = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        ...filters
      };

      const response = await getComplianceData(params);
      
      if (response.success) {
        setComplianceData(response.data.complianceByDate);
        setStatistics(response.data.statistics);
      } else {
        setError(response.error || 'Failed to fetch compliance data');
      }
    } catch (err) {
      setError('Failed to fetch compliance data');
      console.error('Error fetching compliance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if user has HR or Admin role
    if (!user || !user.roles || (!user.roles.includes('hr') && !user.roles.includes('admin'))) {
      setError('Access denied. HR or Admin role required.');
      setLoading(false);
      return;
    }

    fetchComplianceData();
  }, [currentMonth, filters]);

  // Navigate to previous month
  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Get day status color
  const getDayStatusColor = (dateStr) => {
    const dayData = complianceData?.find(d => d.date === dateStr);
    if (!dayData) return 'bg-gray-100';
    
    switch (dayData.status) {
      case 'complete':
        return 'bg-green-100 hover:bg-green-200';
      case 'partial':
        return 'bg-yellow-100 hover:bg-yellow-200';
      case 'missed':
        return 'bg-red-100 hover:bg-red-200';
      case 'weekend':
        return 'bg-gray-200';
      default:
        return 'bg-gray-100';
    }
  };

  // Get day status indicator
  const getDayStatusIndicator = (dateStr) => {
    const dayData = complianceData?.find(d => d.date === dateStr);
    if (!dayData) return null;
    
    switch (dayData.status) {
      case 'complete':
        return <div className="w-2 h-2 bg-green-500 rounded-full" />;
      case 'partial':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full" />;
      case 'missed':
        return <div className="w-2 h-2 bg-red-500 rounded-full" />;
      default:
        return null;
    }
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDay = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2" />);
    }

    // Add days of the month
    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayData = complianceData?.find(d => d.date === dateStr);
      
      days.push(
        <div
          key={day}
          className={`p-2 min-h-[80px] border border-gray-200 rounded cursor-pointer transition-colors ${getDayStatusColor(dateStr)}`}
          onClick={() => dayData && setSelectedDate(dayData)}
        >
          <div className="flex justify-between items-start">
            <span className="font-medium text-sm">{day}</span>
            {getDayStatusIndicator(dateStr)}
          </div>
          {dayData && dayData.details.length > 0 && (
            <div className="mt-1 text-xs text-gray-600">
              {dayData.submitted}/{dayData.expected} submitted
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <SimpleLoading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <EmptyState
          title="Access Denied"
          description={error}
          actionLabel="Go Back"
          onAction={() => navigate('/workflow')}
        />
      </div>
    );
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            {t('workflow.compliance.title', 'Calendar Compliance View')}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('workflow.compliance.subtitle', 'Track submission compliance and identify missed days')}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          {t('common.filters', 'Filters')}
        </Button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">{t('workflow.compliance.submissionRate', 'Submission Rate')}</p>
                  <p className="text-2xl font-bold">{statistics.submissionRate.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-green-500 rounded-full" />
                <div>
                  <p className="text-sm text-gray-600">{t('workflow.compliance.completeDays', 'Complete Days')}</p>
                  <p className="text-2xl font-bold">{statistics.completeDays}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-yellow-500 rounded-full" />
                <div>
                  <p className="text-sm text-gray-600">{t('workflow.compliance.partialDays', 'Partial Days')}</p>
                  <p className="text-2xl font-bold">{statistics.partialDays}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-red-500 rounded-full" />
                <div>
                  <p className="text-sm text-gray-600">{t('workflow.compliance.missedDays', 'Missed Days')}</p>
                  <p className="text-2xl font-bold">{statistics.missedDays}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>{t('common.filters', 'Filters')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('workflow.compliance.program', 'Program')}</label>
                <select
                  className="w-full p-2 border rounded"
                  value={filters.program}
                  onChange={(e) => setFilters({ ...filters, program: e.target.value })}
                >
                  <option value="">All Programs</option>
                  <option value="OFFICER">Officer</option>
                  <option value="NCO">NCO</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('workflow.compliance.workflowType', 'Workflow Type')}</label>
                <select
                  className="w-full p-2 border rounded"
                  value={filters.workflowType}
                  onChange={(e) => setFilters({ ...filters, workflowType: e.target.value })}
                >
                  <option value="">All Types</option>
                  <option value="ATTENDANCE_DAILY">Daily Attendance</option>
                  <option value="ATTENDANCE_WEEKLY">Weekly Summary</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={previousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Header */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-medium text-sm text-gray-600 p-2">
                {day}
              </div>
            ))}
          </div>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {generateCalendarDays()}
          </div>
          {/* Legend */}
          <div className="flex gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span>{t('workflow.compliance.complete', 'Complete')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full" />
              <span>{t('workflow.compliance.partial', 'Partial')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <span>{t('workflow.compliance.missed', 'Missed')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-300 rounded-full" />
              <span>{t('workflow.compliance.weekend', 'Weekend')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Details */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle>
              {t('workflow.compliance.detailsFor', 'Details for')} {selectedDate.date}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('workflow.compliance.expected', 'Expected')}:</span>
                <span className="font-medium">{selectedDate.expected}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('workflow.compliance.submitted', 'Submitted')}:</span>
                <span className="font-medium">{selectedDate.submitted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('workflow.compliance.status', 'Status')}:</span>
                <span className="font-medium capitalize">{selectedDate.status}</span>
              </div>
              
              {selectedDate.details.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">{t('workflow.compliance.submissions', 'Submissions')}:</h3>
                  <div className="space-y-2">
                    {selectedDate.details.map(detail => (
                      <div key={detail.id} className="p-2 bg-gray-50 rounded text-sm">
                        <div className="font-medium">{detail.title}</div>
                        <div className="text-gray-600">
                          {detail.instructorName} - {detail.program} - {detail.subject}
                        </div>
                        <div className="text-gray-500 text-xs">
                          Status: {detail.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setSelectedDate(null)}
            >
              {t('common.close', 'Close')}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CalendarCompliancePage;
