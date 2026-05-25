import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Clock, CheckCircle, XCircle, Filter, Download, RefreshCw } from 'lucide-react';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { Button, useToast } from '@ui';
import { Card, CardContent, CardHeader, CardTitle } from '@ui';
import { SimpleLoading, EmptyState } from '@ui';
import { getAnalyticsData } from '@services/api/workflow-documents-api.js';

const WorkflowAnalyticsPage = () => {
  const { t } = useLang();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    program: '',
    workflowType: ''
  });

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        ...filters
      };

      const response = await getAnalyticsData(params);
      
      if (response.success) {
        setAnalyticsData(response.data);
      } else {
        setError(response.error || 'Failed to fetch analytics data');
      }
    } catch (err) {
      setError('Failed to fetch analytics data');
      console.error('Error fetching analytics data:', err);
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

    fetchAnalyticsData();
  }, [filters]);

  // Export analytics data as CSV
  const exportData = () => {
    if (!analyticsData) return;

    const csvContent = [
      'Metric,Value',
      `Total Documents,${analyticsData.overallStatistics.totalDocuments}`,
      `Total Approved,${analyticsData.overallStatistics.totalApproved}`,
      `Total Rejected,${analyticsData.overallStatistics.totalRejected}`,
      `Overall Approval Rate,${analyticsData.overallStatistics.overallApprovalRate}%`,
      '',
      'Workflow Type,Cycle Time (hours),Approval Rate (%)',
      ...Object.entries(analyticsData.cycleTimeByType).map(([type, time]) => 
        `${type},${time.toFixed(2)},${analyticsData.approvalRateByType[type]?.toFixed(2) || 0}`
      ),
      '',
      'Rejection Reason,Count',
      ...analyticsData.rejectionReasons.map(({ reason, count }) => `"${reason}",${count}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(t('workflow.analytics.exported', 'Analytics data exported successfully'));
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            {t('workflow.analytics.title', 'Workflow Analytics Dashboard')}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('workflow.analytics.subtitle', 'Track workflow performance and identify bottlenecks')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {t('common.filters', 'Filters')}
          </Button>
          <Button
            variant="outline"
            onClick={fetchAnalyticsData}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('common.refresh', 'Refresh')}
          </Button>
          <Button
            variant="success"
            onClick={exportData}
          >
            <Download className="h-4 w-4 mr-2" />
            {t('common.export', 'Export')}
          </Button>
        </div>
      </div>

      {/* Overall Statistics */}
      {analyticsData?.overallStatistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">{t('workflow.analytics.totalDocuments', 'Total Documents')}</p>
                  <p className="text-2xl font-bold">{analyticsData.overallStatistics.totalDocuments}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">{t('workflow.analytics.totalApproved', 'Total Approved')}</p>
                  <p className="text-2xl font-bold">{analyticsData.overallStatistics.totalApproved}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm text-gray-600">{t('workflow.analytics.totalRejected', 'Total Rejected')}</p>
                  <p className="text-2xl font-bold">{analyticsData.overallStatistics.totalRejected}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">{t('workflow.analytics.approvalRate', 'Approval Rate')}</p>
                  <p className="text-2xl font-bold">{analyticsData.overallStatistics.overallApprovalRate.toFixed(1)}%</p>
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
                <label className="block text-sm font-medium mb-1">{t('workflow.analytics.startDate', 'Start Date')}</label>
                <input
                  type="date"
                  className="w-full p-2 border rounded"
                  value={filters.startDate || ''}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('workflow.analytics.endDate', 'End Date')}</label>
                <input
                  type="date"
                  className="w-full p-2 border rounded"
                  value={filters.endDate || ''}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('workflow.analytics.program', 'Program')}</label>
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
                <label className="block text-sm font-medium mb-1">{t('workflow.analytics.workflowType', 'Workflow Type')}</label>
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

      {/* Cycle Time by Workflow Type */}
      {analyticsData?.cycleTimeByType && Object.keys(analyticsData.cycleTimeByType).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t('workflow.analytics.cycleTime', 'Average Cycle Time by Workflow Type')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analyticsData.cycleTimeByType).map(([type, time]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="font-medium">{type}</span>
                  <span className="text-2xl font-bold">{time.toFixed(2)}h</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approval Rate by Workflow Type */}
      {analyticsData?.approvalRateByType && Object.keys(analyticsData.approvalRateByType).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              {t('workflow.analytics.approvalRateByType', 'Approval Rate by Workflow Type')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analyticsData.approvalRateByType).map(([type, rate]) => (
                <div key={type} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{type}</span>
                    <span className="font-bold">{rate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rejection Reasons */}
      {analyticsData?.rejectionReasons && analyticsData.rejectionReasons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              {t('workflow.analytics.rejectionReasons', 'Top Rejection Reasons')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analyticsData.rejectionReasons.map(({ reason, count }, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">{reason}</span>
                  <span className="font-bold">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {analyticsData?.rejectionReasons && analyticsData.rejectionReasons.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            {t('workflow.analytics.noRejections', 'No rejections recorded in the selected period')}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WorkflowAnalyticsPage;
