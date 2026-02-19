/**
 * Dashboard Header Component
 * Modern header with live status indicators and elegant controls
 */

import React, { useState } from 'react';
import { getThemedIcon } from '@constants/iconTypes';
import { Button, Select } from '@ui';

const DashboardHeader = ({
  title,
  subtitle,
  isAutoRefresh,
  refreshInterval,
  onToggleAutoRefresh,
  onRefreshIntervalChange,
  onClearMetrics,
  onExportData,
  alerts,
  theme,
  t
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const criticalAlerts = alerts.filter(alert => alert.type === 'critical').length;
  const warningAlerts = alerts.filter(alert => alert.type === 'warning').length;

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 p-6 sm:p-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        
        {/* Title Section */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="p-4 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-2xl shadow-lg">
              {getThemedIcon('ui', 'activity', 32, theme, 'text-white')}
            </div>
            {/* Live indicator */}
            <div className="absolute -top-1 -right-1">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-ping absolute"></div>
              </div>
            </div>
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-slate-900 dark:from-white to-slate-600 dark:to-slate-300 bg-clip-text text-transparent">
              {title}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
              {subtitle}
              <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                {currentTime.toLocaleTimeString()}
              </span>
            </p>
          </div>
        </div>

        {/* Controls Section */}
        <div className="flex flex-wrap items-center gap-4">
          
          {/* Alert Indicators */}
          {(criticalAlerts > 0 || warningAlerts > 0) && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2">
              {criticalAlerts > 0 && (
                <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                  {getThemedIcon('ui', 'alert_triangle', 16, theme)}
                  <span className="text-sm font-bold">{criticalAlerts}</span>
                </span>
              )}
              {warningAlerts > 0 && (
                <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                  {getThemedIcon('ui', 'alert_circle', 16, theme)}
                  <span className="text-sm font-bold">{warningAlerts}</span>
                </span>
              )}
            </div>
          )}

          {/* Refresh Controls */}
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl p-2">
            <Button
              onClick={onToggleAutoRefresh}
              variant={isAutoRefresh ? 'primary' : 'secondary'}
              size="sm"
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105"
            >
              {getThemedIcon('ui', isAutoRefresh ? 'pause' : 'play', 16, theme)}
              {isAutoRefresh ? (t('pause') || 'Pause') : (t('resume') || 'Resume')}
            </Button>
            <Select
              value={refreshInterval}
              onChange={(value) => onRefreshIntervalChange(Number(value))}
              className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-sm"
              disabled={!isAutoRefresh}
              options={[
                { value: 1000, label: t('1s') || '1s' },
                { value: 5000, label: t('5s') || '5s' },
                { value: 10000, label: t('10s') || '10s' },
                { value: 30000, label: t('30s') || '30s' }
              ]}
            />
          </div>

          {/* Action Menu */}
          <div className="relative">
            <div className="flex items-center gap-2">
              <Button
                onClick={onClearMetrics}
                variant="danger"
                size="sm"
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105"
              >
                {getThemedIcon('ui', 'trash', 16, theme)}
                {t('clear_metrics') || 'Clear'}
              </Button>
              
              <div className="relative">
                <Button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  variant="secondary"
                  size="sm"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105"
                >
                  {getThemedIcon('ui', 'download', 16, theme)}
                  {t('export') || 'Export'}
                </Button>
                
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50">
                    <button
                      onClick={() => {
                        onExportData();
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
                    >
                      {getThemedIcon('ui', 'file_json', 16, theme)}
                      <span className="text-sm">Export JSON</span>
                    </button>
                    <button
                      onClick={() => {
                        // Export CSV functionality
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
                    >
                      {getThemedIcon('ui', 'file_csv', 16, theme)}
                      <span className="text-sm">Export CSV</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
