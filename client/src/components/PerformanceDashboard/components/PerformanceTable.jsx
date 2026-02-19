/**
 * Performance Table Component
 * Advanced data table with sorting, filtering, and interactive features
 */

import React, { useState, useMemo } from 'react';
import { getThemedIcon } from '@constants/iconTypes';

const PerformanceTable = ({ metrics, historicalData, theme, t }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'averageDuration', direction: 'desc' });
  const [filterConfig, setFilterConfig] = useState({ health: 'all', search: '' });
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Health status calculation
  const getHealthStatus = (operation, metric) => {
    if (!metric) return 'unknown';
    
    const avgDuration = metric.averageDuration;
    const successRate = parseFloat(metric.successRate);
    
    if (avgDuration > 2000 || successRate < 90) return 'critical';
    if (avgDuration > 1000 || successRate < 95) return 'warning';
    return 'healthy';
  };

  // Health color and icon mapping
  const getHealthInfo = (status) => {
    switch (status) {
      case 'healthy':
        return { color: 'text-green-600', bgColor: 'bg-green-100', icon: 'check_circle', label: 'Healthy' };
      case 'warning':
        return { color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: 'alert_triangle', label: 'Warning' };
      case 'critical':
        return { color: 'text-red-600', bgColor: 'bg-red-100', icon: 'x_circle', label: 'Critical' };
      default:
        return { color: 'text-gray-600', bgColor: 'bg-gray-100', icon: 'help_circle', label: 'Unknown' };
    }
  };

  // Duration formatting
  const formatDuration = (ms) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // Sorting logic
  const sortedMetrics = useMemo(() => {
    const entries = Object.entries(metrics);
    
    return entries.sort(([a, aMetric], [b, bMetric]) => {
      let aValue, bValue;
      
      switch (sortConfig.key) {
        case 'operation':
          aValue = a.toLowerCase();
          bValue = b.toLowerCase();
          break;
        case 'health':
          aValue = getHealthStatus(a, aMetric);
          bValue = getHealthStatus(b, bMetric);
          break;
        case 'count':
          aValue = aMetric.count;
          bValue = bMetric.count;
          break;
        case 'successRate':
          aValue = parseFloat(aMetric.successRate);
          bValue = parseFloat(bMetric.successRate);
          break;
        case 'averageDuration':
          aValue = aMetric.averageDuration;
          bValue = bMetric.averageDuration;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [metrics, sortConfig]);

  // Filtering logic
  const filteredMetrics = useMemo(() => {
    return sortedMetrics.filter(([operation, metric]) => {
      const health = getHealthStatus(operation, metric);
      
      // Health filter
      if (filterConfig.health !== 'all' && health !== filterConfig.health) {
        return false;
      }
      
      // Search filter
      if (filterConfig.search && !operation.toLowerCase().includes(filterConfig.search.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }, [sortedMetrics, filterConfig]);

  // Toggle row expansion
  const toggleRowExpansion = (operation) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(operation)) {
      newExpanded.delete(operation);
    } else {
      newExpanded.add(operation);
    }
    setExpandedRows(newExpanded);
  };

  // Handle sort
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Mini sparkline for performance trends
  const PerformanceSparkline = ({ operation }) => {
    const operationHistory = historicalData.slice(-20).map(d => d.avgResponseTime);
    if (operationHistory.length < 2) return null;
    
    const max = Math.max(...operationHistory);
    const min = Math.min(...operationHistory);
    const range = max - min || 1;
    
    const points = operationHistory.map((value, index) => {
      const x = (index / (operationHistory.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg className="w-16 h-8" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline
          points={points}
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2"
          className="opacity-60"
        />
      </svg>
    );
  };

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 overflow-hidden">
      
      {/* Table Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700/50 dark:to-slate-700 border-b border-slate-200 dark:border-slate-600">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {getThemedIcon('ui', 'table', 20, theme)}
            {t('performance_metrics') || 'Performance Metrics'}
            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
              ({filteredMetrics.length} {t('operations') || 'operations'})
            </span>
          </h2>
          
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder={t('search_operations') || 'Search operations...'}
                value={filterConfig.search}
                onChange={(e) => setFilterConfig(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-sm w-48"
              />
              {getThemedIcon('ui', 'search', 16, theme, 'text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2')}
            </div>
            
            {/* Health Filter */}
            <select
              value={filterConfig.health}
              onChange={(e) => setFilterConfig(prev => ({ ...prev, health: e.target.value }))}
              className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-sm"
            >
              <option value="all">{t('all_health') || 'All Health'}</option>
              <option value="healthy">{t('healthy_only') || 'Healthy Only'}</option>
              <option value="warning">{t('warning_only') || 'Warning Only'}</option>
              <option value="critical">{t('critical_only') || 'Critical Only'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50/50 dark:bg-slate-700/30">
            <tr>
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => handleSort('operation')}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  {t('operation') || 'Operation'}
                  {sortConfig.key === 'operation' && (
                    getThemedIcon('ui', sortConfig.direction === 'asc' ? 'chevron_up' : 'chevron_down', 12, theme)
                  )}
                </button>
              </th>
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => handleSort('health')}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  {t('health') || 'Health'}
                  {sortConfig.key === 'health' && (
                    getThemedIcon('ui', sortConfig.direction === 'asc' ? 'chevron_up' : 'chevron_down', 12, theme)
                  )}
                </button>
              </th>
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => handleSort('count')}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  {t('total_calls') || 'Total Calls'}
                  {sortConfig.key === 'count' && (
                    getThemedIcon('ui', sortConfig.direction === 'asc' ? 'chevron_up' : 'chevron_down', 12, theme)
                  )}
                </button>
              </th>
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => handleSort('successRate')}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  {t('success_rate') || 'Success Rate'}
                  {sortConfig.key === 'successRate' && (
                    getThemedIcon('ui', sortConfig.direction === 'asc' ? 'chevron_up' : 'chevron_down', 12, theme)
                  )}
                </button>
              </th>
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => handleSort('averageDuration')}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  {t('avg_duration') || 'Avg Duration'}
                  {sortConfig.key === 'averageDuration' && (
                    getThemedIcon('ui', sortConfig.direction === 'asc' ? 'chevron_up' : 'chevron_down', 12, theme)
                  )}
                </button>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                {t('trend') || 'Trend'}
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                {t('actions') || 'Actions'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredMetrics.map(([operation, metric]) => {
              const health = getHealthStatus(operation, metric);
              const healthInfo = getHealthInfo(health);
              const isExpanded = expandedRows.has(operation);
              
              return (
                <React.Fragment key={operation}>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-all duration-200">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                          {getThemedIcon('ui', 'zap', 16, theme)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-xs" title={operation}>
                            {operation}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {t('operation_id') || 'ID'}: {operation.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full ${healthInfo.bgColor} ${healthInfo.color}`}>
                        {getThemedIcon('ui', healthInfo.icon, 12, theme)}
                        {t(healthInfo.label.toLowerCase()) || healthInfo.label}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        {metric.count.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {t('calls') || 'calls'}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold ${
                          metric.successRate >= 95 ? 'text-green-600 dark:text-green-400' : 
                          metric.successRate >= 90 ? 'text-yellow-600 dark:text-yellow-400' : 
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {metric.successRate}%
                        </span>
                        <div className="w-20 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              metric.successRate >= 95 ? 'bg-green-500' : 
                              metric.successRate >= 90 ? 'bg-yellow-500' : 
                              'bg-red-500'
                            }`}
                            style={{ width: `${metric.successRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${
                          metric.averageDuration > 1000 ? 'text-red-600 dark:text-red-400' : 
                          metric.averageDuration > 500 ? 'text-yellow-600 dark:text-yellow-400' : 
                          'text-green-600 dark:text-green-400'
                        }`}>
                          {formatDuration(metric.averageDuration)}
                        </span>
                        {metric.averageDuration > 1000 && (
                          <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1 rounded-full font-semibold">
                            {t('slow') || 'Slow'}
                          </span>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <PerformanceSparkline operation={operation} />
                    </td>
                    
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleRowExpansion(operation)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        {getThemedIcon('ui', isExpanded ? 'chevron_up' : 'chevron_down', 16, theme)}
                      </button>
                    </td>
                  </tr>
                  
                  {/* Expanded Row */}
                  {isExpanded && (
                    <tr className="bg-slate-50 dark:bg-slate-700/20">
                      <td colSpan="7" className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                              {t('duration_details') || 'Duration Details'}
                            </h4>
                            <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                              <div className="flex justify-between">
                                <span>{t('min_duration') || 'Min'}:</span>
                                <span className="font-mono">{formatDuration(metric.minDuration)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>{t('max_duration') || 'Max'}:</span>
                                <span className="font-mono">{formatDuration(metric.maxDuration)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>{t('avg_duration') || 'Avg'}:</span>
                                <span className="font-mono">{formatDuration(metric.averageDuration)}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                              {t('performance_analysis') || 'Performance Analysis'}
                            </h4>
                            <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                              <div className="flex justify-between">
                                <span>{t('consistency') || 'Consistency'}:</span>
                                <span className={`font-semibold ${
                                  (metric.maxDuration - metric.minDuration) < 100 ? 'text-green-600' :
                                  (metric.maxDuration - metric.minDuration) < 500 ? 'text-yellow-600' :
                                  'text-red-600'
                                }`}>
                                  {(metric.maxDuration - metric.minDuration) < 100 ? t('excellent') || 'Excellent' :
                                   (metric.maxDuration - metric.minDuration) < 500 ? t('good') || 'Good' :
                                   t('variable') || 'Variable'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>{t('total_time') || 'Total Time'}:</span>
                                <span className="font-mono">{formatDuration(metric.averageDuration * metric.count)}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                              {t('recommendations') || 'Recommendations'}
                            </h4>
                            <div className="space-y-1 text-xs">
                              {metric.averageDuration > 1000 && (
                                <div className="flex items-start gap-1 text-yellow-600 dark:text-yellow-400">
                                  {getThemedIcon('ui', 'alert_triangle', 10, theme)}
                                  <span>{t('consider_optimization') || 'Consider optimization'}</span>
                                </div>
                              )}
                              {parseFloat(metric.successRate) < 95 && (
                                <div className="flex items-start gap-1 text-red-600 dark:text-red-400">
                                  {getThemedIcon('ui', 'alert_triangle', 10, theme)}
                                  <span>{t('check_error_handling') || 'Check error handling'}</span>
                                </div>
                              )}
                              {health === 'healthy' && (
                                <div className="flex items-start gap-1 text-green-600 dark:text-green-400">
                                  {getThemedIcon('ui', 'check_circle', 10, theme)}
                                  <span>{t('performing_well') || 'Performing well'}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>

        {/* Empty State */}
        {filteredMetrics.length === 0 && (
          <div className="text-center py-16">
            <div className="flex flex-col items-center gap-4">
              {getThemedIcon('ui', 'table', 64, theme, 'text-slate-300 dark:text-slate-600')}
              <div className="text-slate-500 dark:text-slate-400 text-xl font-semibold">
                {filterConfig.search || filterConfig.health !== 'all' 
                  ? (t('no_matching_operations') || 'No matching operations found')
                  : (t('no_performance_metrics') || 'No performance metrics available yet')
                }
              </div>
              <div className="text-slate-400 dark:text-slate-500 text-sm max-w-lg">
                {filterConfig.search || filterConfig.health !== 'all'
                  ? (t('try_adjusting_filters') || 'Try adjusting your filters or search terms')
                  : (t('metrics_will_appear') || 'Metrics will appear as operations are performed')
                }
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceTable;
