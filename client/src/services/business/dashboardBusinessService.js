/**
 * Business Service Layer - Dashboard
 * Business logic for dashboard operations
 * Uses db-services for data access
 */

import {
  getUserEnrollments,
  getUserActivities,
  getUserQuizSubmissions,
  getUserAttendanceRecords,
  getUserBadges,
  getClassById,
  getSubjectById,
  getProgramById,
  getQuizById,
  getActivityById,
  getUserGradeRecords,
  getUserParticipationRecords,
  getUserBehaviorRecords
} from '../db-services/dashboardDbService.js';

/**
 * Get comprehensive dashboard data for a student
 * @param {string} userId - The student's user ID
 * @returns {Promise<Object>} Dashboard data object
 */
export async function getStudentDashboard(userId) {
  try {
    const dashboardData = {
      enrolledClasses: 0,
      completedClasses: 0,
      totalClassHours: 0,
      achievements: 0,
      currentStreak: 0,
      longestStreak: 0,
      weeklyGoal: 5,
      weeklyProgress: 0,
      overallScore: 0,
      improvementAreas: [],
      strongSubjects: [],
      upcomingClasses: [],
      pendingAssignments: [],
      pendingQuizzes: [],
      learningTimeData: []
    };

    // Parallel data fetching for better performance
    const [
      enrollmentsData,
      activitiesData,
      quizSubmissionsData,
      attendanceData,
      badgesData,
      gradeRecords,
      participationRecords,
      behaviorRecords
    ] = await Promise.all([
      getUserEnrollments(userId),
      getUserActivities(userId),
      getUserQuizSubmissions(userId),
      getUserAttendanceRecords(userId),
      getUserBadges(userId),
      getUserGradeRecords(userId),
      getUserParticipationRecords(userId),
      getUserBehaviorRecords(userId)
    ]);

    // Process enrollments
    const { enrolledClasses, completedClasses, upcomingClasses } = await processEnrollments(
      enrollmentsData,
      userId
    );
    dashboardData.enrolledClasses = enrolledClasses.length;
    dashboardData.completedClasses = completedClasses;
    dashboardData.upcomingClasses = upcomingClasses;

    // Process activities for pending tasks
    const { pendingAssignments, pendingQuizzes } = processPendingTasks(activitiesData);
    dashboardData.pendingAssignments = pendingAssignments;
    dashboardData.pendingQuizzes = pendingQuizzes;

    // Calculate learning streak from attendance
    const streakData = calculateStreak(attendanceData, activitiesData);
    dashboardData.currentStreak = streakData.currentStreak;
    dashboardData.longestStreak = streakData.longestStreak;
    dashboardData.weeklyProgress = streakData.weeklyProgress;

    // Process quiz submissions for performance insights
    const performanceData = calculatePerformance(quizSubmissionsData, gradeRecords);
    dashboardData.overallScore = performanceData.overallScore;
    dashboardData.improvementAreas = performanceData.improvementAreas;
    dashboardData.strongSubjects = performanceData.strongSubjects;

    // Calculate learning time from attendance and activities
    dashboardData.learningTimeData = calculateLearningTime(attendanceData, activitiesData);
    dashboardData.totalClassHours = calculateTotalHours(attendanceData);

    // Get achievements count
    dashboardData.achievements = badgesData.length;

    // Calculate participation and behavior insights
    const behaviorInsights = calculateBehaviorInsights(participationRecords, behaviorRecords);
    dashboardData.participationScore = behaviorInsights.participationScore;
    dashboardData.behaviorScore = behaviorInsights.behaviorScore;

    return { success: true, data: dashboardData };
  } catch (error) {
    console.error('[DashboardBusinessService] Error loading dashboard data:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Process enrollments to extract class information
 */
async function processEnrollments(enrollments, userId) {
  const enrolledClasses = [];
  const completedClasses = [];
  const upcomingClasses = [];

  for (const enrollment of enrollments) {
    if (enrollment.status === 'active') {
      try {
        const classInfo = await getClassById(enrollment.classId);
        if (classInfo) {
          enrolledClasses.push({
            ...classInfo,
            enrollmentId: enrollment.docId,
            enrolledAt: enrollment.enrolledAt
          });

          // Check for upcoming classes (within next 7 days)
          const classDate = new Date(classInfo.schedule?.[0]?.date || classInfo.createdAt);
          const now = new Date();
          const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          
          if (classDate > now && classDate <= weekFromNow) {
            upcomingClasses.push({
              ...classInfo,
              enrollmentId: enrollment.docId,
              scheduledDate: classDate
            });
          }
        }
      } catch (error) {
        console.error('[DashboardBusinessService] Error processing enrollment:', error);
      }
    } else if (enrollment.status === 'completed') {
      completedClasses.push(enrollment);
    }
  }

  return { enrolledClasses, completedClasses, upcomingClasses };
}

/**
 * Process activities to identify pending tasks
 */
function processPendingTasks(activities) {
  const now = new Date();
  const pendingAssignments = [];
  const pendingQuizzes = [];

  for (const activity of activities) {
    if (activity.dueDate && activity.status !== 'completed') {
      const dueDate = activity.dueDate.toDate ? activity.dueDate.toDate() : new Date(activity.dueDate);
      
      if (dueDate > now) {
        const taskInfo = {
          ...activity,
          dueDate,
          isOverdue: false,
          daysUntilDue: Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24))
        };

        if (activity.type === 'quiz') {
          pendingQuizzes.push(taskInfo);
        } else {
          pendingAssignments.push(taskInfo);
        }
      }
    }
  }

  return { pendingAssignments, pendingQuizzes };
}

/**
 * Calculate learning streak from attendance and activities
 */
function calculateStreak(attendanceData, activitiesData) {
  const now = new Date();
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let weeklyProgress = 0;

  // Get last 30 days of data
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentAttendance = attendanceData.filter(record => {
    const recordDate = new Date(record.date);
    return recordDate >= thirtyDaysAgo && record.status === 'present';
  });

  // Calculate current streak (consecutive days with activity)
  const sortedDates = [...new Set(recentAttendance.map(r => r.date))].sort().reverse();
  
  for (let i = 0; i < sortedDates.length; i++) {
    const currentDate = new Date(sortedDates[i]);
    const expectedDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    
    if (currentDate.toDateString() === expectedDate.toDateString()) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Calculate longest streak
  tempStreak = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const currentDate = new Date(sortedDates[i]);
    const prevDate = new Date(sortedDates[i - 1]);
    const dayDiff = (prevDate - currentDate) / (1000 * 60 * 60 * 24);
    
    if (dayDiff === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  // Calculate weekly progress (days attended in current week)
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  
  const thisWeekAttendance = recentAttendance.filter(record => {
    const recordDate = new Date(record.date);
    return recordDate >= weekStart;
  });
  
  weeklyProgress = thisWeekAttendance.length;

  return { currentStreak, longestStreak, weeklyProgress };
}

/**
 * Calculate performance metrics from quiz submissions and grades
 */
function calculatePerformance(quizSubmissions, gradeRecords) {
  const allScores = [];
  const subjectScores = {};

  // Process quiz submissions
  quizSubmissions.forEach(submission => {
    if (submission.score !== undefined && submission.percentage !== undefined) {
      allScores.push(submission.percentage);
      // Note: Would need to fetch subject info to group by subject
    }
  });

  // Process grade records
  gradeRecords.forEach(grade => {
    if (grade.percentage !== undefined) {
      allScores.push(grade.percentage);
      // Group by subject if available
      const subjectKey = grade.subjectId || 'general';
      if (!subjectScores[subjectKey]) {
        subjectScores[subjectKey] = [];
      }
      subjectScores[subjectKey].push(grade.percentage);
    }
  });

  const overallScore = allScores.length > 0 
    ? Math.round(allScores.reduce((sum, score) => sum + score, 0) / allScores.length)
    : 0;

  // Identify strong and weak areas
  const subjectAverages = Object.entries(subjectScores).map(([subject, scores]) => ({
    subject,
    average: scores.reduce((sum, score) => sum + score, 0) / scores.length,
    count: scores.length
  }));

  const sortedSubjects = subjectAverages.sort((a, b) => b.average - a.average);
  
  const strongSubjects = sortedSubjects
    .filter(s => s.average >= 80 && s.count >= 3)
    .slice(0, 3)
    .map(s => s.subject);

  const improvementAreas = sortedSubjects
    .filter(s => s.average < 70 && s.count >= 3)
    .slice(0, 3)
    .map(s => s.subject);

  return { overallScore, strongSubjects, improvementAreas };
}

/**
 * Calculate learning time data
 */
function calculateLearningTime(attendanceData, activitiesData) {
  const learningData = [];
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Group attendance by date
  const attendanceByDate = {};
  attendanceData.forEach(record => {
    if (record.status === 'present') {
      const date = record.date;
      if (!attendanceByDate[date]) {
        attendanceByDate[date] = 0;
      }
      // Assume 1 hour per attended class (could be enhanced with actual duration)
      attendanceByDate[date] += 1;
    }
  });

  // Generate daily data for the last 30 days
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    const hours = attendanceByDate[dateStr] || 0;
    
    learningData.push({
      date: dateStr,
      hours,
      dayName: date.toLocaleDateString('en', { weekday: 'short' })
    });
  }

  return learningData;
}

/**
 * Calculate total class hours
 */
function calculateTotalHours(attendanceData) {
  return attendanceData
    .filter(record => record.status === 'present')
    .length; // Assuming 1 hour per class
}

/**
 * Calculate behavior and participation insights
 */
function calculateBehaviorInsights(participationRecords, behaviorRecords) {
  const participationScore = participationRecords
    .filter(r => r.points && r.points > 0)
    .reduce((sum, r) => sum + (r.points || 0), 0);

  const behaviorScore = behaviorRecords
    .filter(r => r.points)
    .reduce((sum, r) => sum + (r.points || 0), 0);

  return { participationScore, behaviorScore };
}
