/**
 * World-Class Performance Dashboard
 * Modern, intuitive, and visually stunning performance monitoring interface
 * Follows enterprise-grade design standards with accessibility and performance optimization
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { performanceMetrics, resourceMonitor } from '@utils/performance';
import { getThemedIcon } from '@constants/iconTypes';
import { Button, Select } from '@ui';

// Import specialized components
import DashboardHeader from './components/DashboardHeader';
import MetricCards from './components/MetricCards';
import PerformanceTable from './components/PerformanceTable';
import InsightsPanel from './components/InsightsPanel';
import SystemHealthScore from './components/SystemHealthScore';

const WorldClassPerformanceDashboard = () => {
  const { t } = useLang();
  const { theme } = useTheme();
  const [metrics, setMetrics] = useState({});
  const [memoryUsage, setMemoryUsage] = useState(null);
  const [connectionCount, setConnectionCount] = useState(0);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [historicalData, setHistoricalData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');

  // Memoized update function with historical tracking
  const updateMetrics = useCallback(() => {
    const newMetrics = performanceMetrics.getReport();
    const newMemoryUsage = resourceMonitor.getMemoryUsage();
    const newConnectionCount = resourceMonitor.getConnectionCount();
    
    setMetrics(newMetrics);
    setMemoryUsage(newMemoryUsage);
    setConnectionCount(newConnectionCount);
    
    // Track historical data for trends
    const timestamp = Date.now();
    setHistoricalData(prev => {
      const newData = [...prev, {
        timestamp,
        memoryUsage: newMemoryUsage?.percentage || 0,
        connectionCount: newConnectionCount,
        operationsCount: Object.keys(newMetrics).length,
        avgResponseTime: Object.values(newMetrics).reduce((acc, m) => acc + (m.averageDuration || 0), 0) / Object.keys(newMetrics).length || 0
      }];
      // Keep only last 100 data points
      return newData.slice(-100);
    });
    
    // Generate alerts based on performance
    generateAlerts(newMetrics, newMemoryUsage, newConnectionCount);
  }, []);

  // Alert generation system
  const generateAlerts = useCallback((metrics, memory, connections) => {
    const newAlerts = [];
    
    // Memory alerts
    if (memory && memory.percentage > 80) {
      newAlerts.push({
        id: 'memory-high',
        type: 'critical',
        title: t('high_memory_usage') || 'High Memory Usage',
        message: `${memory.percentage}% memory usage detected`,
        action: 'optimize-memory'
      });
    }
    
    // Connection alerts
    if (connections > 10) {
      newAlerts.push({
        id: 'connections-high',
        type: 'warning',
        title: t('many_connections') || 'Many Active Connections',
        message: `${connections} active connections detected`,
        action: 'check-listeners'
      });
    }
    
    // Performance alerts
    Object.entries(metrics).forEach(([operation, metric]) => {
      if (metric.averageDuration > 1000) {
        newAlerts.push({
          id: `slow-${operation}`,
          type: 'warning',
          title: t('slow_operation') || 'Slow Operation',
          message: `${operation} averaging ${metric.averageDuration.toFixed(0)}ms`,
          action: 'optimize-operation'
        });
      }
      
      if (parseFloat(metric.successRate) < 95) {
        newAlerts.push({
          id: `low-success-${operation}`,
          type: 'critical',
          title: t('low_success_rate') || 'Low Success Rate',
          message: `${operation} success rate: ${metric.successRate}%`,
          action: 'check-errors'
        });
      }
    });
    
    setAlerts(newAlerts);
  }, [t]);

  useEffect(() => {
    updateMetrics();
    
    let interval = null;
    if (isAutoRefresh) {
      interval = setInterval(updateMetrics, refreshInterval);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [refreshInterval, isAutoRefresh, updateMetrics]);

  // Memoized calculations
  const systemHealthScore = useMemo(() => {
    let score = 100;
    
    // Memory impact
    if (memoryUsage?.percentage > 80) score -= 30;
    else if (memoryUsage?.percentage > 60) score -= 15;
    
    // Connection impact
    if (connectionCount > 10) score -= 20;
    else if (connectionCount > 5) score -= 10;
    
    // Performance impact
    Object.values(metrics).forEach(metric => {
      if (metric.averageDuration > 2000) score -= 25;
      else if (metric.averageDuration > 1000) score -= 10;
      
      if (parseFloat(metric.successRate) < 90) score -= 25;
      else if (parseFloat(metric.successRate) < 95) score -= 10;
    });
    
    return Math.max(0, Math.min(100, score));
  }, [memoryUsage, connectionCount, metrics]);

  const operationsCount = useMemo(() => Object.keys(metrics).length, [metrics]);

  const clearMetrics = useCallback(() => {
    performanceMetrics.clear();
    setMetrics({});
    setHistoricalData([]);
    setAlerts([]);
  }, []);

  const toggleAutoRefresh = useCallback(() => {
    setIsAutoRefresh(prev => !prev);
  }, []);

  const exportData = useCallback(() => {
    const data = {
      timestamp: new Date().toISOString(),
      metrics,
      memoryUsage,
      connectionCount,
      systemHealthScore,
      historicalData,
      alerts
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [metrics, memoryUsage, connectionCount, systemHealthScore, historicalData, alerts]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-screen-3xl mx-auto space-y-6">
        
        {/* Dashboard Header */}
        <DashboardHeader
          title={t('performance_dashboard') || 'Performance Dashboard'}
          subtitle={t('realtime_monitoring') || 'Real-time performance monitoring'}
          isAutoRefresh={isAutoRefresh}
          refreshInterval={refreshInterval}
          onToggleAutoRefresh={toggleAutoRefresh}
          onRefreshIntervalChange={setRefreshInterval}
          onClearMetrics={clearMetrics}
          onExportData={exportData}
          alerts={alerts}
          theme={theme}
          t={t}
        />

        {/* System Health Score */}
        <SystemHealthScore
          score={systemHealthScore}
          operationsCount={operationsCount}
          alertsCount={alerts.length}
          theme={theme}
          t={t}
        />

        {/* Metric Cards */}
        <MetricCards
          memoryUsage={memoryUsage}
          connectionCount={connectionCount}
          operationsCount={operationsCount}
          historicalData={historicalData}
          theme={theme}
          t={t}
        />

        {/* Performance Metrics Table */}
        <PerformanceTable
          metrics={metrics}
          historicalData={historicalData}
          theme={theme}
          t={t}
        />

        {/* Insights Panel */}
        <InsightsPanel
          metrics={metrics}
          memoryUsage={memoryUsage}
          connectionCount={connectionCount}
          alerts={alerts}
          systemHealthScore={systemHealthScore}
          theme={theme}
          t={t}
        />

      </div>
    </div>
  );
};

export default WorldClassPerformanceDashboard;
