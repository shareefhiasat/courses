/**
 * Dashboard Analytics Controller
 * Provides aggregated metrics for drive, workflow, and activity widgets.
 */
import dashboardAnalyticsDb from '../db/dashboard-analytics-postgres.js';

const getAnalytics = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { classId } = req.query;

    const result = await dashboardAnalyticsDb.getDashboardAnalytics({
      userId,
      role,
      classId: classId || null,
    });

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('[DashboardAnalyticsController] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getDriveAnalytics = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const result = await dashboardAnalyticsDb.getDriveAnalytics({ userId, role });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getWorkflowAnalytics = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const result = await dashboardAnalyticsDb.getWorkflowAnalytics({ userId, role });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getActivityAnalytics = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { classId } = req.query;
    const result = await dashboardAnalyticsDb.getActivityAnalytics({ userId, role, classId });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export default {
  getAnalytics,
  getDriveAnalytics,
  getWorkflowAnalytics,
  getActivityAnalytics,
};
