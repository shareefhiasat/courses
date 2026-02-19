/**
 * Metric Cards Component
 * Modern metric cards with data visualization, trends, and micro-interactions
 */

import React, { useState } from 'react';
import { getThemedIcon } from '@constants/iconTypes';

const MetricCards = ({ memoryUsage, connectionCount, operationsCount, historicalData, theme, t }) => {
  const [hoveredCard, setHoveredCard] = useState(null);

  // Calculate trend for memory usage
  const getMemoryTrend = () => {
    if (historicalData.length < 2) return 'stable';
    const recent = historicalData.slice(-5);
    const trend = recent[recent.length - 1].memoryUsage - recent[0].memoryUsage;
    if (trend > 5) return 'increasing';
    if (trend < -5) return 'decreasing';
    return 'stable';
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'increasing': return 'trending_up';
      case 'decreasing': return 'trending_down';
      default: return 'minus';
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'increasing': return 'text-red-500';
      case 'decreasing': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const memoryTrend = getMemoryTrend();

  // Mini sparkline component
  const Sparkline = ({ data, color = 'blue' }) => {
    if (data.length < 2) return null;
    
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg className="w-full h-12" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline
          points={points}
          fill="none"
          stroke={color === 'blue' ? '#3B82F6' : color === 'green' ? '#10B981' : '#8B5CF6'}
          strokeWidth="2"
          className="opacity-60"
        />
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color === 'blue' ? '#3B82F6' : color === 'green' ? '#10B981' : '#8B5CF6'} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color === 'blue' ? '#3B82F6' : color === 'green' ? '#10B981' : '#8B5CF6'} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={`${points} 100,100 0,100`}
          fill={`url(#gradient-${color})`}
        />
      </svg>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* Memory Usage Card */}
      <div
        className={`bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 p-6 transition-all duration-300 hover:scale-105 hover:shadow-3xl cursor-pointer ${
          hoveredCard === 'memory' ? 'ring-2 ring-blue-500/50' : ''
        }`}
        onMouseEnter={() => setHoveredCard('memory')}
        onMouseLeave={() => setHoveredCard(null)}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              {getThemedIcon('ui', 'cpu', 20, theme, 'text-white')}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {t('memory_usage') || 'Memory Usage'}
              </h3>
              <div className="flex items-center gap-1">
                {getThemedIcon('ui', getTrendIcon(memoryTrend), 12, theme, getTrendColor(memoryTrend))}
                <span className={`text-xs ${getTrendColor(memoryTrend)}`}>
                  {t(memoryTrend) || memoryTrend}
                </span>
              </div>
            </div>
          </div>
          {memoryUsage && memoryUsage.percentage > 80 && (
            <span className="text-xs bg-red-500 text-white px-3 py-1 rounded-full font-semibold animate-pulse">
              {t('critical') || 'Critical'}
            </span>
          )}
        </div>

        {memoryUsage ? (
          <div className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">
                  {memoryUsage.used}MB
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  {t('of') || 'of'} {memoryUsage.total}MB
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {memoryUsage.percentage}%
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {t('of_limit') || 'of limit'}
                </div>
              </div>
            </div>

            {/* Progress Ring */}
            <div className="relative h-4">
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4">
                <div
                  className={`h-4 rounded-full transition-all duration-1000 shadow-lg ${
                    memoryUsage.percentage > 80 ? 'bg-gradient-to-r from-red-500 to-red-600' : 
                    memoryUsage.percentage > 60 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 
                    'bg-gradient-to-r from-green-500 to-green-600'
                  }`}
                  style={{ width: `${Math.min(memoryUsage.percentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Historical Trend */}
            {historicalData.length > 1 && (
              <div className="mt-4">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  {t('recent_trend') || 'Recent Trend'}
                </div>
                <Sparkline 
                  data={historicalData.slice(-10).map(d => d.memoryUsage)} 
                  color="blue" 
                />
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            {getThemedIcon('ui', 'cpu', 48, theme, 'text-slate-300 dark:text-slate-600')}
            <div className="text-slate-500 dark:text-slate-400 text-sm mt-2">
              {t('memory_monitoring_not_available') || 'Memory monitoring not available'}
            </div>
          </div>
        )}
      </div>

      {/* Active Connections Card */}
      <div
        className={`bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 p-6 transition-all duration-300 hover:scale-105 hover:shadow-3xl cursor-pointer ${
          hoveredCard === 'connections' ? 'ring-2 ring-green-500/50' : ''
        }`}
        onMouseEnter={() => setHoveredCard('connections')}
        onMouseLeave={() => setHoveredCard(null)}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
              {getThemedIcon('ui', 'link', 20, theme, 'text-white')}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {t('active_connections') || 'Active Connections'}
              </h3>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {t('realtime_listeners') || 'Real-time listeners'}
              </div>
            </div>
          </div>
          {connectionCount > 10 && (
            <span className="text-xs bg-yellow-500 text-white px-3 py-1 rounded-full font-semibold">
              {t('many') || 'Many'}
            </span>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-4xl font-bold text-slate-900 dark:text-white">
              {connectionCount}
            </div>
            <div className="text-right">
              <div className={`text-sm font-medium ${
                connectionCount === 0 ? 'text-green-600 dark:text-green-400' :
                connectionCount <= 5 ? 'text-blue-600 dark:text-blue-400' :
                connectionCount <= 10 ? 'text-yellow-600 dark:text-yellow-400' :
                'text-red-600 dark:text-red-400'
              }`}>
                {connectionCount === 0 ? t('optimal') || 'Optimal' :
                 connectionCount <= 5 ? t('good') || 'Good' :
                 connectionCount <= 10 ? t('moderate') || 'Moderate' :
                 t('high') || 'High'}
              </div>
            </div>
          </div>

          {/* Connection Status Indicator */}
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              connectionCount === 0 ? 'bg-green-500' :
              connectionCount <= 5 ? 'bg-blue-500' :
              connectionCount <= 10 ? 'bg-yellow-500' :
              'bg-red-500'
            } animate-pulse`} />
            <span className="text-sm text-slate-600 dark:text-slate-300">
              {connectionCount === 0 ? t('no_active_connections') || 'No active connections' :
               connectionCount === 1 ? t('one_connection_active') || '1 connection active' :
               t('connections_active') || `${connectionCount} connections active`}
            </span>
          </div>

          {/* Historical Trend */}
          {historicalData.length > 1 && (
            <div className="mt-4">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                {t('recent_trend') || 'Recent Trend'}
              </div>
              <Sparkline 
                data={historicalData.slice(-10).map(d => d.connectionCount)} 
                color="green" 
              />
            </div>
          )}
        </div>
      </div>

      {/* Operations Tracked Card */}
      <div
        className={`bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 p-6 transition-all duration-300 hover:scale-105 hover:shadow-3xl cursor-pointer ${
          hoveredCard === 'operations' ? 'ring-2 ring-purple-500/50' : ''
        }`}
        onMouseEnter={() => setHoveredCard('operations')}
        onMouseLeave={() => setHoveredCard(null)}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
              {getThemedIcon('ui', 'bar_chart', 20, theme, 'text-white')}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {t('operations_tracked') || 'Operations Tracked'}
              </h3>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {t('unique_operations') || 'Unique operations'}
              </div>
            </div>
          </div>
          {operationsCount > 20 && (
            <span className="text-xs bg-purple-500 text-white px-3 py-1 rounded-full font-semibold">
              {t('active') || 'Active'}
            </span>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-4xl font-bold text-slate-900 dark:text-white">
              {operationsCount}
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-purple-600 dark:text-purple-400">
                {operationsCount === 0 ? t('none') || 'None' :
                 operationsCount <= 5 ? t('few') || 'Few' :
                 operationsCount <= 15 ? t('moderate') || 'Moderate' :
                 t('many') || 'Many'}
              </div>
            </div>
          </div>

          {/* Operations Status */}
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              operationsCount === 0 ? 'bg-gray-400' :
              operationsCount <= 5 ? 'bg-purple-500' :
              operationsCount <= 15 ? 'bg-purple-600' :
              'bg-purple-700'
            } animate-pulse`} />
            <span className="text-sm text-slate-600 dark:text-slate-300">
              {operationsCount === 0 ? t('no_operations_tracked') || 'No operations tracked' :
               operationsCount === 1 ? t('one_operation_tracked') || '1 operation tracked' :
               t('operations_tracked_count') || `${operationsCount} operations tracked`}
            </span>
          </div>

          {/* Historical Trend */}
          {historicalData.length > 1 && (
            <div className="mt-4">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                {t('recent_trend') || 'Recent Trend'}
              </div>
              <Sparkline 
                data={historicalData.slice(-10).map(d => d.operationsCount)} 
                color="purple" 
              />
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default MetricCards;
