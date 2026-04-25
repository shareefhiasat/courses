/**
 * Dashboard Controller
 * 
 * PURPOSE: Controller layer for dashboard API endpoints
 * ARCHITECTURE: Routes → Controller → DB Service → PostgreSQL
 */

const dashboardDbService = require('../db/dashboard-postgres.js');

/**
 * Get dashboard summary
 */
const getDashboardSummary = async (req, res) => {
  try {
    const { userId } = req.user;
    const { programId, instructorId } = req.query;
    
    console.log('[DashboardController] Getting dashboard summary for user:', userId);
    
    const params = {
      programId: programId ? parseInt(programId) : null,
      instructorId: instructorId ? parseInt(instructorId) : null
    };
    
    const result = await dashboardDbService.getDashboardSummary(params);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to retrieve dashboard summary'
      });
    }
  } catch (error) {
    console.error('[DashboardController] Error getting dashboard summary:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve dashboard summary'
    });
  }
};

/**
 * Get teacher-specific dashboard
 */
const getTeacherDashboard = async (req, res) => {
  try {
    const { userId } = req.user;
    const { teacherUserId } = req.params;
    
    console.log('[DashboardController] Getting teacher dashboard for:', teacherUserId);
    
    // Users can only view their own dashboard unless they are admin/HR
    if (userId !== parseInt(teacherUserId) && 
        !['SUPER_ADMIN', 'ADMIN', 'HR'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    const result = await dashboardDbService.getTeacherDashboard(teacherUserId);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to retrieve teacher dashboard'
      });
    }
  } catch (error) {
    console.error('[DashboardController] Error getting teacher dashboard:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve teacher dashboard'
    });
  }
};

module.exports = {
  getDashboardSummary,
  getTeacherDashboard
};
