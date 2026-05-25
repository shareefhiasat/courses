/**
 * useWorkflowTasks Hook
 *
 * Fetches pending workflow approvals for the current user.
 * Used to display inbox/notification badges and task lists.
 */

import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@services/api/apiService';

const API_BASE = '/workflows';

export function useWorkflowTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.get(`${API_BASE}/my-tasks`);
      if (response.success) {
        const taskList = response.data?.payload || [];
        setTasks(taskList);
        setUnreadCount(taskList.length);
      } else {
        setError(response.error?.message || 'Failed to fetch tasks');
        setTasks([]);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('[useWorkflowTasks] fetch failed:', err);
      // Gracefully handle errors - don't break the page
      setError(err.message || 'Failed to fetch tasks');
      setTasks([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    // Poll every 2 minutes for new tasks.
    const interval = setInterval(fetchTasks, 120_000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  const approveTask = useCallback(async (instanceId, comment = '') => {
    try {
      const response = await axios.post(`${API_BASE}/instances/${instanceId}/approve`, {
        comment,
      });
      if (response.data.success) {
        fetchTasks(); // Refresh task list.
        return { success: true, payload: response.data.payload };
      }
      return { success: false, error: response.data.error };
    } catch (err) {
      console.error('[useWorkflowTasks] approve failed:', err);
      return { success: false, error: err.message };
    }
  }, [fetchTasks]);

  const rejectTask = useCallback(async (instanceId, reason = '') => {
    try {
      const response = await axios.post(`${API_BASE}/instances/${instanceId}/reject`, {
        reason,
      });
      if (response.data.success) {
        fetchTasks(); // Refresh task list.
        return { success: true, payload: response.data.payload };
      }
      return { success: false, error: response.data.error };
    } catch (err) {
      console.error('[useWorkflowTasks] reject failed:', err);
      return { success: false, error: err.message };
    }
  }, [fetchTasks]);

  const getInstanceHistory = useCallback(async (instanceId) => {
    try {
      const response = await axios.get(`${API_BASE}/instances/${instanceId}/history`);
      if (response.data.success) {
        return { success: true, payload: response.data.payload };
      }
      return { success: false, error: response.data.error };
    } catch (err) {
      console.error('[useWorkflowTasks] get history failed:', err);
      return { success: false, error: err.message };
    }
  }, []);

  return {
    tasks,
    loading,
    error,
    unreadCount,
    refreshTasks: fetchTasks,
    approveTask,
    rejectTask,
    getInstanceHistory,
  };
}

export default useWorkflowTasks;
