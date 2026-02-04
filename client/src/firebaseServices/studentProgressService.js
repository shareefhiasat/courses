import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from './config';

/**
 * Get student progress data
 */
export async function getStudentProgress(userId) {
  try {
    const docRef = doc(db, 'studentProgress', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
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
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(docRef, defaultProgress);
      return { success: true, data: { id: userId, ...defaultProgress } };
    }
  } catch (error) {
    console.error('Error getting student progress:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update student progress after quiz completion
 */
export async function updateProgressAfterQuiz(userId, quizData) {
  try {
    const docRef = doc(db, 'studentProgress', userId);
    const docSnap = await getDoc(docRef);
    
    let currentData = {};
    if (docSnap.exists()) {
      currentData = docSnap.data();
    }
    
    const quizStats = currentData.quizStats || {};
    const totalCompleted = (quizStats.totalQuizzesCompleted || 0) + 1;
    const totalPoints = (quizStats.totalPoints || 0) + quizData.score;
    const newAverage = totalPoints / totalCompleted;
    
    await updateDoc(docRef, {
      'quizStats.totalQuizzesCompleted': increment(1),
      'quizStats.totalPoints': increment(quizData.score),
      'quizStats.averageScore': newAverage,
      updatedAt: serverTimestamp()
    });
    
    // Update learning streak
    await updateLearningStreak(userId);
    
    return { success: true };
  } catch (error) {
    console.error('Error updating progress after quiz:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update learning streak
 */
export async function updateLearningStreak(userId) {
  try {
    const docRef = doc(db, 'studentProgress', userId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return { success: false, error: 'Progress not found' };
    
    const data = docSnap.data();
    const streak = data.learningStreak || { current: 0, longest: 0, lastActiveDate: null };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let lastActive = null;
    if (streak.lastActiveDate) {
      lastActive = streak.lastActiveDate.toDate();
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
    
    await updateDoc(docRef, {
      'learningStreak.current': newCurrent,
      'learningStreak.longest': newLongest,
      'learningStreak.lastActiveDate': serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return { success: true, streak: { current: newCurrent, longest: newLongest } };
  } catch (error) {
    console.error('Error updating learning streak:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Log learning time
 */
export async function logLearningTime(userId, hours) {
  try {
    const docRef = doc(db, 'studentProgress', userId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      await getStudentProgress(userId); // Initialize if doesn't exist
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const data = docSnap.exists() ? docSnap.data() : {};
    const learningTimeData = data.learningTimeData || [];
    
    // Check if entry for today exists
    const todayEntry = learningTimeData.find(entry => {
      const entryDate = entry.date.toDate();
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === today.getTime();
    });
    
    if (todayEntry) {
      // Update existing entry
      todayEntry.hours += hours;
    } else {
      // Add new entry
      learningTimeData.push({
        date: serverTimestamp(),
        hours
      });
    }
    
    // Keep only last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const filteredData = learningTimeData.filter(entry => {
      const entryDate = entry.date.toDate ? entry.date.toDate() : new Date(entry.date);
      return entryDate >= thirtyDaysAgo;
    });
    
    await updateDoc(docRef, {
      learningTimeData: filteredData,
      totalClassHours: increment(hours),
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error logging learning time:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all students' progress (admin/instructor only)
 */
export async function getAllStudentsProgress() {
  try {
    const q = query(collection(db, 'studentProgress'));
    const querySnapshot = await getDocs(q);
    
    const progressData = [];
    querySnapshot.forEach((doc) => {
      progressData.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: progressData };
  } catch (error) {
    console.error('Error getting all students progress:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get progress for students in a specific class
 */
export async function getClassStudentsProgress(classId) {
  try {
    // First get all students enrolled in the class
    const enrollmentsQuery = query(
      collection(db, 'enrollments'),
      where('classId', '==', classId)
    );
    const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
    
    const studentIds = [];
    enrollmentsSnapshot.forEach((doc) => {
      studentIds.push(doc.data().userId);
    });
    
    // Then get progress for those students
    const progressData = [];
    for (const userId of studentIds) {
      const result = await getStudentProgress(userId);
      if (result.success) {
        progressData.push(result.data);
      }
    }
    
    return { success: true, data: progressData };
  } catch (error) {
    console.error('Error getting class students progress:', error);
    return { success: false, error: error.message };
  }
}
