/**
 * System Health Score Component
 * Overall system health visualization with score and indicators
 */

import React from 'react';
import { getThemedIcon } from '@constants/iconTypes';

const SystemHealthScore = ({ score, operationsCount, alertsCount, theme, t }) => {
  const getHealthColor = (score) => {
    if (score >= 90) return 'from-green-500 to-emerald-600';
    if (score >= 70) return 'from-yellow-500 to-orange-600';
    if (score >= 50) return 'from-orange-500 to-red-600';
    return 'from-red-500 to-rose-600';
  };

  const getHealthStatus = (score) => {
    if (score >= 90) return t('excellent') || 'Excellent';
    if (score >= 70) return t('good') || 'Good';
    if (score >= 50) return t('fair') || 'Fair';
    return t('critical') || 'Critical';
  };

  const getHealthIcon = (score) => {
    if (score >= 90) return 'check_circle';
    if (score >= 70) return 'alert_circle';
    if (score >= 50) return 'alert_triangle';
    return 'x_circle';
  };

  const getHealthTextColor = (score) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 50) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 p-6 sm:p-8">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
        
        {/* Score Display */}
        <div className="flex items-center gap-6">
          <div className="relative">
            {/* Circular Progress */}
            <div className="w-32 h-32 relative">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-slate-200 dark:text-slate-700"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - score / 100)}`}
                  className={`bg-gradient-to-r ${getHealthColor(score)} text-transparent transition-all duration-1000 ease-out`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">
                  {score}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {t('score') || 'Score'}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-2">
              {getThemedIcon('ui', getHealthIcon(score), 24, theme, getHealthTextColor(score))}
              <span className={`text-2xl font-bold ${getHealthTextColor(score)}`}>
                {getHealthStatus(score)}
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {t('system_health_description') || 'Overall system performance health'}
            </p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl mb-2 mx-auto">
              {getThemedIcon('ui', 'bar_chart', 20, theme, 'text-blue-600 dark:text-blue-400')}
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {operationsCount}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {t('operations') || 'Operations'}
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl mb-2 mx-auto">
              {getThemedIcon('ui', 'activity', 20, theme, 'text-purple-600 dark:text-purple-400')}
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {alertsCount}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {t('alerts') || 'Alerts'}
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl mb-2 mx-auto">
              {getThemedIcon('ui', 'zap', 20, theme, 'text-green-600 dark:text-green-400')}
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {Math.round(score)}%
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {t('health') || 'Health'}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {t('health_progress') || 'Health Progress'}
          </span>
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {score}%
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full bg-gradient-to-r ${getHealthColor(score)} transition-all duration-1000 ease-out shadow-lg`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default SystemHealthScore;
