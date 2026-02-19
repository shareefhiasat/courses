/**
 * Performance Monitoring Dashboard
 * Real-time performance metrics and health monitoring for LMS services
 */

import React, { useState, useEffect } from 'react';
import { performanceMetrics, resourceMonitor } from '@utils/performance';

const PerformanceDashboard = () => {
  const [metrics, setMetrics] = useState({});
  const [memoryUsage, setMemoryUsage] = useState(null);
  const [connectionCount, setConnectionCount] = useState(0);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(performanceMetrics.getReport());
      setMemoryUsage(resourceMonitor.getMemoryUsage());
      setConnectionCount(resourceMonitor.getConnectionCount());
    };

    // Initial load
    updateMetrics();

    // Set up interval for real-time updates
    const interval = setInterval(updateMetrics, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const getHealthStatus = (operation, metric) => {
    if (!metric) return 'unknown';
    
    const avgDuration = metric.averageDuration;
    const successRate = parseFloat(metric.successRate);
    
    if (avgDuration > 2000 || successRate < 90) return 'critical';
    if (avgDuration > 1000 || successRate < 95) return 'warning';
    return 'healthy';
  };

  const getHealthColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatDuration = (ms) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const clearMetrics = () => {
    performanceMetrics.clear();
    setMetrics({});
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Performance Dashboard</h1>
            <div className="flex items-center space-x-4">
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1000}>1s</option>
                <option value={5000}>5s</option>
                <option value={10000}>10s</option>
                <option value={30000}>30s</option>
              </select>
              <button
                onClick={clearMetrics}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Clear Metrics
              </button>
            </div>
          </div>

          {/* System Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Memory Usage</h3>
              {memoryUsage ? (
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {memoryUsage.used}MB / {memoryUsage.total}MB
                  </div>
                  <div className="text-sm text-blue-700">
                    {memoryUsage.percentage}% of {memoryUsage.limit}MB limit
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${memoryUsage.percentage}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">Memory monitoring not available</div>
              )}
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-900 mb-2">Active Connections</h3>
              <div className="text-2xl font-bold text-green-600">{connectionCount}</div>
              <div className="text-sm text-green-700">Real-time listeners</div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">Operations Tracked</h3>
              <div className="text-2xl font-bold text-purple-600">
                {Object.keys(metrics).length}
              </div>
              <div className="text-sm text-purple-700">Unique operations</div>
            </div>
          </div>

          {/* Performance Metrics Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Operation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Health
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Calls
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Success Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Min/Max Duration
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(metrics).map(([operation, metric]) => {
                  const health = getHealthStatus(operation, metric);
                  return (
                    <tr key={operation} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {operation}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getHealthColor(health)}`}>
                          {health.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {metric.count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <span className={metric.successRate >= 95 ? 'text-green-600' : metric.successRate >= 90 ? 'text-yellow-600' : 'text-red-600'}>
                            {metric.successRate}
                          </span>
                          <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                metric.successRate >= 95 ? 'bg-green-600' : metric.successRate >= 90 ? 'bg-yellow-600' : 'bg-red-600'
                              }`}
                              style={{ width: `${metric.successRate}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={metric.averageDuration > 1000 ? 'text-red-600' : metric.averageDuration > 500 ? 'text-yellow-600' : 'text-green-600'}>
                          {formatDuration(metric.averageDuration)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDuration(metric.minDuration)} / {formatDuration(metric.maxDuration)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {Object.keys(metrics).length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg">No performance metrics available yet</div>
                <div className="text-gray-400 text-sm mt-2">
                  Metrics will appear as operations are performed
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Performance Tips */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Performance Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Slow Operations:</strong> Operations taking more than 1 second are highlighted in red.
                    Consider optimizing database queries or adding caching.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>Memory Usage:</strong> Monitor memory usage to prevent performance degradation.
                    Consider implementing cleanup for unused data.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 border-l-4 border-green-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-green-700">
                    <strong>Success Rate:</strong> Operations with success rate below 95% may need
                    better error handling or retry logic.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 border-l-4 border-purple-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-purple-700">
                    <strong>Real-time Connections:</strong> Monitor active connections to prevent
                    memory leaks from unclosed listeners.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;
