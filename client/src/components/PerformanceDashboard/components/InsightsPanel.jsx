/**
 * Insights Panel Component
 * Intelligent performance insights with actionable recommendations
 */

import React, { useState } from 'react';
import { getThemedIcon } from '@constants/iconTypes';

const InsightsPanel = ({ metrics, memoryUsage, connectionCount, alerts, systemHealthScore, theme, t }) => {
  const [activeTab, setActiveTab] = useState('insights');
  const [expandedInsights, setExpandedInsights] = useState(new Set());

  // Generate intelligent insights based on current data
  const generateInsights = () => {
    const insights = [];

    // Memory insights
    if (memoryUsage) {
      if (memoryUsage.percentage > 80) {
        insights.push({
          id: 'memory-critical',
          type: 'critical',
          title: t('critical_memory_usage') || 'Critical Memory Usage',
          description: t('memory_critical_desc') || `Memory usage is at ${memoryUsage.percentage}%, which may cause performance degradation.`,
          impact: 'high',
          action: {
            label: t('optimize_memory') || 'Optimize Memory',
            handler: 'optimize-memory'
          },
          details: [
            t('memory_detail_1') || 'Clear unused data from application state',
            t('memory_detail_2') || 'Close unused real-time listeners',
            t('memory_detail_3') || 'Optimize image loading and caching'
          ]
        });
      } else if (memoryUsage.percentage > 60) {
        insights.push({
          id: 'memory-warning',
          type: 'warning',
          title: t('moderate_memory_usage') || 'Moderate Memory Usage',
          description: t('memory_warning_desc') || `Memory usage is at ${memoryUsage.percentage}%. Monitor for further increases.`,
          impact: 'medium',
          action: {
            label: t('monitor_memory') || 'Monitor Memory',
            handler: 'monitor-memory'
          },
          details: [
            t('memory_warning_detail_1') || 'Keep an eye on memory trends',
            t('memory_warning_detail_2') || 'Consider preventive cleanup'
          ]
        });
      } else {
        insights.push({
          id: 'memory-good',
          type: 'success',
          title: t('optimal_memory_usage') || 'Optimal Memory Usage',
          description: t('memory_good_desc') || `Memory usage is at ${memoryUsage.percentage}%, which is excellent.`,
          impact: 'low',
          action: null,
          details: [
            t('memory_good_detail_1') || 'Memory management is working well',
            t('memory_good_detail_2') || 'Continue current practices'
          ]
        });
      }
    }

    // Connection insights
    if (connectionCount > 10) {
      insights.push({
        id: 'connections-high',
        type: 'warning',
        title: t('high_connection_count') || 'High Connection Count',
        description: t('connections_high_desc') || `${connectionCount} active connections detected. Check for potential memory leaks.`,
        impact: 'medium',
        action: {
          label: t('check_listeners') || 'Check Listeners',
          handler: 'check-listeners'
        },
        details: [
          t('connections_detail_1') || 'Review real-time listener cleanup',
          t('connections_detail_2') || 'Ensure listeners are properly unmounted',
          t('connections_detail_3') || 'Check for duplicate connections'
        ]
      });
    }

    // Performance insights
    Object.entries(metrics).forEach(([operation, metric]) => {
      if (metric.averageDuration > 2000) {
        insights.push({
          id: `slow-${operation}`,
          type: 'critical',
          title: t('slow_operation_detected') || 'Slow Operation Detected',
          description: t('slow_operation_desc') || `${operation} is averaging ${metric.averageDuration.toFixed(0)}ms, which is significantly slow.`,
          impact: 'high',
          action: {
            label: t('optimize_operation') || 'Optimize Operation',
            handler: 'optimize-operation'
          },
          details: [
            t('slow_detail_1') || 'Check database query efficiency',
            t('slow_detail_2') || 'Add caching for frequently accessed data',
            t('slow_detail_3') || 'Review algorithm complexity'
          ]
        });
      } else if (metric.averageDuration > 1000) {
        insights.push({
          id: `moderate-${operation}`,
          type: 'warning',
          title: t('moderate_operation_speed') || 'Moderate Operation Speed',
          description: t('moderate_operation_desc') || `${operation} is averaging ${metric.averageDuration.toFixed(0)}ms. Consider optimization.`,
          impact: 'medium',
          action: {
            label: t('review_operation') || 'Review Operation',
            handler: 'review-operation'
          },
          details: [
            t('moderate_detail_1') || 'Analyze performance bottlenecks',
            t('moderate_detail_2') || 'Consider partial optimizations'
          ]
        });
      }

      // Success rate insights
      if (parseFloat(metric.successRate) < 90) {
        insights.push({
          id: `low-success-${operation}`,
          type: 'critical',
          title: t('low_success_rate') || 'Low Success Rate',
          description: t('low_success_desc') || `${operation} has a success rate of ${metric.successRate}%, which is concerning.`,
          impact: 'high',
          action: {
            label: t('investigate_errors') || 'Investigate Errors',
            handler: 'investigate-errors'
          },
          details: [
            t('error_detail_1') || 'Review error handling logic',
            t('error_detail_2') || 'Add retry mechanisms for transient failures',
            t('error_detail_3') || 'Improve input validation'
          ]
        });
      }
    });

    // System health insights
    if (systemHealthScore >= 90) {
      insights.push({
        id: 'system-excellent',
        type: 'success',
        title: t('excellent_system_health') || 'Excellent System Health',
        description: t('system_excellent_desc') || 'Overall system health score is excellent at ${systemHealthScore}%. Keep up the good work!',
        impact: 'low',
        action: null,
        details: [
          t('system_excellent_detail_1') || 'All systems performing optimally',
          t('system_excellent_detail_2') || 'Continue current monitoring practices'
        ]
      });
    } else if (systemHealthScore < 50) {
      insights.push({
        id: 'system-poor',
        type: 'critical',
        title: t('poor_system_health') || 'Poor System Health',
        description: t('system_poor_desc') || `System health score is ${systemHealthScore}%. Immediate attention required.`,
        impact: 'high',
        action: {
          label: t('improve_health') || 'Improve Health',
          handler: 'improve-health'
        },
        details: [
          t('system_poor_detail_1') || 'Address critical performance issues',
          t('system_poor_detail_2') || 'Review system architecture',
          t('system_poor_detail_3') || 'Consider performance optimization'
        ]
      });
    }

    return insights.sort((a, b) => {
      const impactOrder = { critical: 0, warning: 1, success: 2 };
      return impactOrder[a.type] - impactOrder[b.type];
    });
  };

  const insights = generateInsights();
  const criticalCount = insights.filter(i => i.type === 'critical').length;
  const warningCount = insights.filter(i => i.type === 'warning').length;
  const successCount = insights.filter(i => i.type === 'success').length;

  const toggleInsightExpansion = (insightId) => {
    const newExpanded = new Set(expandedInsights);
    if (newExpanded.has(insightId)) {
      newExpanded.delete(insightId);
    } else {
      newExpanded.add(insightId);
    }
    setExpandedInsights(newExpanded);
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'critical': return 'alert_triangle';
      case 'warning': return 'alert_circle';
      case 'success': return 'check_circle';
      default: return 'info';
    }
  };

  const getInsightColor = (type) => {
    switch (type) {
      case 'critical': return 'text-red-600 dark:text-red-400';
      case 'warning': return 'text-yellow-600 dark:text-yellow-400';
      case 'success': return 'text-green-600 dark:text-green-400';
      default: return 'text-blue-600 dark:text-blue-400';
    }
  };

  const getInsightBgColor = (type) => {
    switch (type) {
      case 'critical': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning': return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'success': return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      default: return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 p-6 sm:p-8">
      
      {/* Panel Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {getThemedIcon('ui', 'lightbulb', 24, theme, 'text-purple-600 dark:text-purple-400')}
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {t('performance_insights') || 'Performance Insights'}
          </h2>
        </div>
        
        {/* Summary Badges */}
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <span className="flex items-center gap-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-3 py-1 rounded-full font-semibold">
              {getThemedIcon('ui', 'alert_triangle', 12, theme)}
              {criticalCount} {t('critical') || 'Critical'}
            </span>
          )}
          {warningCount > 0 && (
            <span className="flex items-center gap-1 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-3 py-1 rounded-full font-semibold">
              {getThemedIcon('ui', 'alert_circle', 12, theme)}
              {warningCount} {t('warnings') || 'Warnings'}
            </span>
          )}
          {successCount > 0 && (
            <span className="flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full font-semibold">
              {getThemedIcon('ui', 'check_circle', 12, theme)}
              {successCount} {t('good') || 'Good'}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-slate-100 dark:bg-slate-700/50 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('insights')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === 'insights'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {t('insights') || 'Insights'}
        </button>
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === 'recommendations'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {t('recommendations') || 'Recommendations'}
        </button>
        <button
          onClick={() => setActiveTab('trends')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === 'trends'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {t('trends') || 'Trends'}
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === 'insights' && (
          <div className="space-y-4">
            {insights.length === 0 ? (
              <div className="text-center py-8">
                {getThemedIcon('ui', 'check_circle', 48, theme, 'text-green-500')}
                <div className="text-slate-600 dark:text-slate-300 mt-2">
                  {t('all_systems_optimal') || 'All systems are performing optimally'}
                </div>
              </div>
            ) : (
              insights.map((insight) => (
                <div
                  key={insight.id}
                  className={`border rounded-xl p-4 transition-all duration-200 hover:shadow-md ${getInsightBgColor(insight.type)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getThemedIcon('ui', getInsightIcon(insight.type), 20, theme, getInsightColor(insight.type))}
                      <div className="flex-1">
                        <h3 className={`font-semibold ${getInsightColor(insight.type)}`}>
                          {insight.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                          {insight.description}
                        </p>
                        
                        {expandedInsights.has(insight.id) && insight.details && (
                          <div className="mt-3 space-y-1">
                            {insight.details.map((detail, index) => (
                              <div key={index} className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2">
                                <span className="text-slate-400">•</span>
                                <span>{detail}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {insight.action && (
                        <button
                          onClick={() => {
                            // Handle action based on handler
                            console.log('Action:', insight.action.handler);
                          }}
                          className="px-3 py-1 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                          {insight.action.label}
                        </button>
                      )}
                      
                      {insight.details && (
                        <button
                          onClick={() => toggleInsightExpansion(insight.id)}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors"
                        >
                          {getThemedIcon('ui', expandedInsights.has(insight.id) ? 'chevron_up' : 'chevron_down', 16, theme)}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                {t('performance_optimization_tips') || 'Performance Optimization Tips'}
              </h3>
              <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <div className="flex items-start gap-2">
                  {getThemedIcon('ui', 'check_circle', 16, theme, 'text-blue-600')}
                  <span>{t('tip_memory_management') || 'Implement proper memory management to prevent leaks'}</span>
                </div>
                <div className="flex items-start gap-2">
                  {getThemedIcon('ui', 'check_circle', 16, theme, 'text-blue-600')}
                  <span>{t('tip_query_optimization') || 'Optimize database queries with proper indexing'}</span>
                </div>
                <div className="flex items-start gap-2">
                  {getThemedIcon('ui', 'check_circle', 16, theme, 'text-blue-600')}
                  <span>{t('tip_caching_strategy') || 'Implement caching strategies for frequently accessed data'}</span>
                </div>
                <div className="flex items-start gap-2">
                  {getThemedIcon('ui', 'check_circle', 16, theme, 'text-blue-600')}
                  <span>{t('tip_error_handling') || 'Add comprehensive error handling and retry logic'}</span>
                </div>
                <div className="flex items-start gap-2">
                  {getThemedIcon('ui', 'check_circle', 16, theme, 'text-blue-600')}
                  <span>{t('tip_monitoring_setup') || 'Set up proactive monitoring and alerting'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="space-y-4">
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
              <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-3">
                {t('performance_trends') || 'Performance Trends'}
              </h3>
              <div className="text-sm text-purple-800 dark:text-purple-200">
                {t('trends_analysis') || 'Trend analysis shows system performance over time. Historical data helps identify patterns and predict future issues.'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InsightsPanel;
