import { db } from './config';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';

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
      attendanceData
    ] = await Promise.all([
      getEnrollments(userId),
      getActivities(userId),
      getQuizSubmissions(userId),
      getAttendanceRecords(userId)
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
    const performanceData = calculatePerformance(quizSubmissionsData);
    dashboardData.overallScore = performanceData.overallScore;
    dashboardData.improvementAreas = performanceData.improvementAreas;
    dashboardData.strongSubjects = performanceData.strongSubjects;

    // Calculate learning time from attendance and activities
    dashboardData.learningTimeData = calculateLearningTime(attendanceData, activitiesData);
    dashboardData.totalClassHours = calculateTotalHours(attendanceData);

    // Get achievements count
    dashboardData.achievements = await getAchievementsCount(userId);

    return { success: true, data: dashboardData };
  } catch (error) {
    console.error('[Dashboard] Error loading dashboard data:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get user enrollments
 */
async function getEnrollments(userId) {
  try {
    const enrollmentsRef = collection(db, 'enrollments');
    const q = query(enrollmentsRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    if (error.code === 'permission-denied') {
      console.warn('[Dashboard] Permission denied for enrollments');
    }
    return [];
  }
}

/**
 * Get user activities
 */
async function getActivities(userId) {
  try {
    const activitiesRef = collection(db, 'activities');
    const q = query(
      activitiesRef,
      where('assignedTo', 'array-contains', userId),
      orderBy('dueDate', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    if (error.code === 'permission-denied') {
      console.warn('[Dashboard] Permission denied for activities');
    }
    return [];
  }
}

/**
 * Get quiz submissions
 */
async function getQuizSubmissions(userId) {
  try {
    const submissionsRef = collection(db, 'quizSubmissions');
    const q = query(
      submissionsRef,
      where('userId', '==', userId),
      orderBy('completedAt', 'desc'),
      limit(50)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    if (error.code === 'permission-denied') {
      console.warn('[Dashboard] Permission denied for quiz submissions');
    }
    return [];
  }
}

/**
 * Get attendance records
 */
async function getAttendanceRecords(userId) {
  try {
    const attendanceRef = collection(db, 'attendance');
    const q = query(
      attendanceRef,
      where('studentId', '==', userId),
      orderBy('date', 'desc'),
      limit(90) // Last 90 days
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    if (error.code === 'permission-denied') {
      console.warn('[Dashboard] Permission denied for attendance records');
    }
    return [];
  }
}

/**
 * Process enrollments to get class data
 */
async function processEnrollments(enrollments, userId) {
  const enrolledClasses = [];
  const upcomingClasses = [];
  let completedClasses = 0;

  for (const enrollment of enrollments) {
    if (!enrollment.classId) continue;

    try {
      const classesRef = collection(db, 'classes');
      const classQuery = query(classesRef, where('__name__', '==', enrollment.classId));
      const classSnapshot = await getDocs(classQuery);

      if (!classSnapshot.empty) {
        const classData = { id: classSnapshot.docs[0].id, ...classSnapshot.docs[0].data() };
        enrolledClasses.push(classData);

        // Check if completed
        if (enrollment.status === 'completed' || classData.status === 'completed') {
          completedClasses++;
        }

        // Get upcoming sessions from schedule
        if (classData.schedule && classData.schedule.days && classData.schedule.days.length > 0) {
          const nextSession = getNextClassSession(classData);
          if (nextSession) {
            upcomingClasses.push({
              id: classData.id,
              title: classData.name || classData.code,
              instructor: classData.instructorName || 'Unknown',
              time: nextSession,
              type: 'lecture'
            });
          }
        }
      }
    } catch (error) {
      console.warn(`[Dashboard] Error loading class ${enrollment.classId}:`, error);
    }
  }

  // Sort upcoming classes by time
  upcomingClasses.sort((a, b) => a.time - b.time);

  return { enrolledClasses, completedClasses, upcomingClasses: upcomingClasses.slice(0, 5) };
}

/**
 * Calculate next class session from schedule
 */
function getNextClassSession(classData) {
  if (!classData.schedule || !classData.schedule.days || classData.schedule.days.length === 0) {
    return null;
  }

  const now = new Date();
  const dayMap = { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 };
  const scheduledDays = classData.schedule.days.map(d => dayMap[d]).filter(d => d !== undefined);

  if (scheduledDays.length === 0) return null;

  // Find next scheduled day
  const currentDay = now.getDay();
  let daysUntilNext = 7;

  for (const day of scheduledDays) {
    const diff = (day - currentDay + 7) % 7;
    if (diff === 0) {
      // Today - check if time has passed
      const [hours, minutes] = (classData.schedule.startTime || '09:00').split(':');
      const classTime = new Date(now);
      classTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      if (classTime > now) {
        return classTime;
      }
    } else if (diff < daysUntilNext) {
      daysUntilNext = diff;
    }
  }

  // Calculate next session date
  const nextDate = new Date(now);
  nextDate.setDate(now.getDate() + daysUntilNext);
  const [hours, minutes] = (classData.schedule.startTime || '09:00').split(':');
  nextDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

  return nextDate;
}

/**
 * Process pending tasks from activities
 */
function processPendingTasks(activities) {
  const now = new Date();
  const pendingAssignments = [];
  const pendingQuizzes = [];

  for (const activity of activities) {
    if (!activity.dueDate) continue;

    const dueDate = activity.dueDate.toDate ? activity.dueDate.toDate() : new Date(activity.dueDate);
    
    // Only include future or recent tasks
    if (dueDate < now) continue;

    const taskData = {
      id: activity.id,
      title: activity.title || 'Untitled',
      course: activity.className || activity.courseName || 'Unknown',
      dueDate: dueDate,
      priority: calculatePriority(dueDate)
    };

    if (activity.type === 'quiz') {
      pendingQuizzes.push({
        ...taskData,
        questions: activity.questionCount || 0,
        estimatedTime: activity.estimatedTime || 30
      });
    } else if (activity.type === 'assignment') {
      pendingAssignments.push(taskData);
    }
  }

  return {
    pendingAssignments: pendingAssignments.slice(0, 5),
    pendingQuizzes: pendingQuizzes.slice(0, 5)
  };
}

/**
 * Calculate task priority based on due date
 */
function calculatePriority(dueDate) {
  const now = new Date();
  const hoursUntilDue = (dueDate - now) / (1000 * 60 * 60);

  if (hoursUntilDue < 24) return 'high';
  if (hoursUntilDue < 72) return 'medium';
  return 'low';
}

/**
 * Calculate learning streak from attendance and activities
 */
function calculateStreak(attendanceRecords, activities) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Combine dates from attendance and completed activities
  const activeDates = new Set();

  // Add attendance dates
  attendanceRecords.forEach(record => {
    if (record.status === 'present' && record.date) {
      const date = record.date.toDate ? record.date.toDate() : new Date(record.date);
      date.setHours(0, 0, 0, 0);
      activeDates.add(date.getTime());
    }
  });

  // Add activity completion dates
  activities.forEach(activity => {
    if (activity.completedAt) {
      const date = activity.completedAt.toDate ? activity.completedAt.toDate() : new Date(activity.completedAt);
      date.setHours(0, 0, 0, 0);
      activeDates.add(date.getTime());
    }
  });

  const sortedDates = Array.from(activeDates).sort((a, b) => b - a);

  // Calculate current streak
  let currentStreak = 0;
  let checkDate = today.getTime();

  for (let i = 0; i < sortedDates.length; i++) {
    if (sortedDates[i] === checkDate) {
      currentStreak++;
      checkDate -= 24 * 60 * 60 * 1000; // Go back one day
    } else if (sortedDates[i] < checkDate) {
      break;
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate = null;

  for (const dateTime of sortedDates) {
    if (prevDate === null) {
      tempStreak = 1;
    } else {
      const dayDiff = (prevDate - dateTime) / (24 * 60 * 60 * 1000);
      if (dayDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    prevDate = dateTime;
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  // Calculate weekly progress (last 7 days)
  const weekAgo = today.getTime() - 7 * 24 * 60 * 60 * 1000;
  const weeklyProgress = sortedDates.filter(d => d >= weekAgo).length;

  return { currentStreak, longestStreak, weeklyProgress };
}

/**
 * Calculate performance metrics from quiz submissions
 */
function calculatePerformance(submissions) {
  if (submissions.length === 0) {
    return {
      overallScore: 0,
      improvementAreas: [],
      strongSubjects: []
    };
  }

  // Group by subject/quiz
  const subjectScores = {};

  submissions.forEach(submission => {
    const subject = submission.quizTitle || submission.subject || 'General';
    const score = submission.percentage || 0;

    if (!subjectScores[subject]) {
      subjectScores[subject] = [];
    }
    subjectScores[subject].push(score);
  });

  // Calculate averages and trends
  const subjectStats = Object.entries(subjectScores).map(([subject, scores]) => {
    const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    
    // Calculate trend (compare first half vs second half)
    const mid = Math.floor(scores.length / 2);
    const firstHalf = scores.slice(0, mid);
    const secondHalf = scores.slice(mid);
    
    const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((s, v) => s + v, 0) / firstHalf.length : avg;
    const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((s, v) => s + v, 0) / secondHalf.length : avg;
    
    let trend = 'neutral';
    if (secondAvg > firstAvg + 5) trend = 'up';
    else if (secondAvg < firstAvg - 5) trend = 'down';

    return { subject, score: Math.round(avg), trend };
  });

  // Sort by score
  subjectStats.sort((a, b) => b.score - a.score);

  // Overall score (weighted average)
  const totalScore = submissions.reduce((sum, s) => sum + (s.percentage || 0), 0);
  const overallScore = Math.round(totalScore / submissions.length);

  return {
    overallScore,
    strongSubjects: subjectStats.filter(s => s.score >= 80).slice(0, 3),
    improvementAreas: subjectStats.filter(s => s.score < 80).slice(0, 3)
  };
}

/**
 * Calculate learning time data for chart
 */
function calculateLearningTime(attendanceRecords, activities) {
  const learningData = {};
  const today = new Date();

  // Initialize last 15 days
  for (let i = 14; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    learningData[dateKey] = { date: dateKey, hours: 0, activities: 0 };
  }

  // Add attendance hours
  attendanceRecords.forEach(record => {
    if (record.status === 'present' && record.date) {
      const date = record.date.toDate ? record.date.toDate() : new Date(record.date);
      const dateKey = date.toISOString().split('T')[0];
      
      if (learningData[dateKey]) {
        learningData[dateKey].hours += record.duration || 1;
        learningData[dateKey].activities += 1;
      }
    }
  });

  // Add activity completion time
  activities.forEach(activity => {
    if (activity.completedAt) {
      const date = activity.completedAt.toDate ? activity.completedAt.toDate() : new Date(activity.completedAt);
      const dateKey = date.toISOString().split('T')[0];
      
      if (learningData[dateKey]) {
        learningData[dateKey].hours += (activity.timeSpent || 30) / 60; // Convert minutes to hours
        learningData[dateKey].activities += 1;
      }
    }
  });

  return Object.values(learningData);
}

/**
 * Calculate total class hours
 */
function calculateTotalHours(attendanceRecords) {
  return attendanceRecords
    .filter(r => r.status === 'present')
    .reduce((sum, r) => sum + (r.duration || 1), 0);
}

/**
 * Get achievements count
 */
async function getAchievementsCount(userId) {
  try {
    const badgesRef = collection(db, 'userBadges');
    const q = query(badgesRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.warn('[Dashboard] Error loading achievements:', error);
    return 0;
  }
}
