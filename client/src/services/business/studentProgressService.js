import logger from '@utils/logger';
import { 
  getStudentProgress as getStudentProgressFromDb,
  setStudentProgress as setStudentProgressToDb,
  updateStudentProgress as updateStudentProgressInDb,
  incrementStudentProgress as incrementStudentProgressInDb,
  getAllStudentProgress as getAllStudentProgressFromDb,
  getStudentProgressByClass as getStudentProgressByClassFromDb,
  deleteStudentProgress as deleteStudentProgressFromDb,
  initializeStudentProgress as initializeStudentProgressToDb
} from '../db/studentProgressDbService';

/**
 * Get student progress data
 */
export async function getStudentProgress(userId) {
  try {
    const result = await getStudentProgressFromDb(userId);
    
    if (result.success) {
      return result;
    } else {
      // Initialize default progress if doesn't exist
      const defaultProgress = {
        userId,
        enrolledClasses: 0,
        completedClasses: 0,
        totalClassHours: 0,
        achievements: 0,
        learningStreak: {
          current: 0,
          longest: 0,
          lastActiveDate: null
        },
        quizStats: {
          totalQuizzesTaken: 0,
          totalQuizzesCompleted: 0,
          averageScore: 0,
          totalPoints: 0
        },
        assignmentStats: {
          totalAssignments: 0,
          completedAssignments: 0,
          pendingAssignments: 0
        },
        performanceInsights: {
          overallPerformance: 0,
          strongTopics: [],
          weakTopics: []
        },
        learningTimeData: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await initializeStudentProgressToDb(userId);
      return { success: true, data: { id: userId, ...defaultProgress } };
    }
  } catch (error) {
    logger.error('Error getting student progress:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update student progress after quiz completion
 */
export async function updateProgressAfterQuiz(userId, quizData) {
  try {
    // Use database service to get current progress
    const currentResult = await getStudentProgressFromDb(userId);
    
    let currentData = {};
    if (currentResult.success) {
      currentData = currentResult.data;
    }
    
    const quizStats = currentData.quizStats || {};
    const totalCompleted = (quizStats.totalQuizzesCompleted || 0) + 1;
    const totalPoints = (quizStats.totalPoints || 0) + quizData.score;
    const newAverage = totalPoints / totalCompleted;
    
    const updateData = {
      'quizStats.totalQuizzesCompleted': (quizStats.totalQuizzesCompleted || 0) + 1,
      'quizStats.totalPoints': (quizStats.totalPoints || 0) + quizData.score,
      'quizStats.averageScore': newAverage,
      updatedAt: new Date()
    };
    
    const result = await updateStudentProgressInDb(userId, updateData);
    
    // Update learning streak
    await updateLearningStreak(userId);
    
    return { success: true };
  } catch (error) {
    logger.error('Error updating progress after quiz:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update learning streak
 */
export async function updateLearningStreak(userId) {
  try {
    // Use database service to get current progress
    const currentResult = await getStudentProgressFromDb(userId);
    
    if (!currentResult.success) {
      return { success: false, error: 'Progress not found' };
    }
    
    const data = currentResult.data;
    const streak = data.learningStreak || { current: 0, longest: 0, lastActiveDate: null };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let lastActive = null;
    if (streak.lastActiveDate) {
      lastActive = new Date(streak.lastActiveDate);
      lastActive.setHours(0, 0, 0, 0);
    }
    
    let newCurrent = streak.current;
    let newLongest = streak.longest;
    
    if (!lastActive) {
      // First activity
      newCurrent = 1;
    } else {
      const daysDiff = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 0) {
        // Same day, no change
        newCurrent = streak.current;
      } else if (daysDiff === 1) {
        // Consecutive day
        newCurrent = streak.current + 1;
      } else {
        // Streak broken
        newCurrent = 1;
      }
    }
    
    newLongest = Math.max(newLongest, newCurrent);
    
    const updateData = {
      'learningStreak.current': newCurrent,
      'learningStreak.longest': newLongest,
      'learningStreak.lastActiveDate': new Date().toISOString(),
      updatedAt: new Date()
    };
    
    const result = await updateStudentProgressInDb(userId, updateData);
    
    return { success: true, streak: { current: newCurrent, longest: newLongest } };
  } catch (error) {
    logger.error('Error updating learning streak:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Log learning time
 */
export async function logLearningTime(userId, hours) {
  try {
    // Use database service to get current progress
    const currentResult = await getStudentProgressFromDb(userId);
    
    if (!currentResult.success) {
      await getStudentProgress(userId); // Initialize if doesn't exist
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const data = currentResult.success && currentResult.data ? currentResult.data : {};
    const learningTimeData = data.learningTimeData || [];
    
    // Check if entry for today exists
    const todayEntry = learningTimeData.find(entry => {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === today.getTime();
    });
    
    if (todayEntry) {
      // Update existing entry
      todayEntry.hours += hours;
    } else {
      // Add new entry
      learningTimeData.push({
        date: new Date().toISOString(),
        hours
      });
    }
    
    // Keep only last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const filteredData = learningTimeData.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= thirtyDaysAgo;
    });
    
    const updateData = {
      learningTimeData: filteredData,
      totalClassHours: (data.totalClassHours || 0) + hours,
      updatedAt: new Date()
    };
    
    const result = await updateStudentProgressInDb(userId, updateData);
    
    return { success: true };
  } catch (error) {
    logger.error('Error logging learning time:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all students' progress (admin/instructor only)
 */
export async function getAllStudentsProgress() {
  try {
    // Use database service to get all student progress
    const result = await getAllStudentProgressFromDb();
    return result;
  } catch (error) {
    logger.error('Error getting all students progress:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get progress for students in a specific class
 */
export async function getClassStudentsProgress(classId) {
  try {
    // Use enrollment service to get students in class
    const { getStudentsByClass } = await import('./enrollmentService');
    const studentsResult = await getStudentsByClass(classId);
    
    if (!studentsResult.success) {
      return { success: false, error: studentsResult.error };
    }
    
    // Then get progress for those students
    const progressData = [];
    for (const student of studentsResult.data) {
      const result = await getStudentProgress(student.id);
      if (result.success) {
        progressData.push(result.data);
      }
    }
    
    return { success: true, data: progressData };
  } catch (error) {
    logger.error('Error getting class students progress:', error);
    return { success: false, error: error.message };
  }
}

