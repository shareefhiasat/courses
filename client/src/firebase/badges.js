import { doc, setDoc, getDoc, collection, getDocs, serverTimestamp, runTransaction, updateDoc } from 'firebase/firestore';
import { db } from './config';

// =========================================================================
// BADGE SYSTEM - FIRESTORE HELPER
// =========================================================================

/*
 * DATABASE STRUCTURES
 *
 * /badges/{badgeId}
 *   - id: string
 *   - name: string
 *   - description: string
 *   - icon: string (URL or Lucide icon name)
 *   - category: 'completion' | 'performance' | 'engagement' | 'special'
 *   - trigger: 'quiz_completion' | 'homework_completion' | 'login_streak' | 'manual'
 *   - requirement: number (e.g., 10 for 10 quizzes, 7 for 7-day streak)
 *   - points: number (XP awarded with badge)
 *
 * /users/{userId}/badges/{badgeId}
 *   - badgeId: string
 *   - earnedAt: timestamp
 *   - progress: number (current progress towards requirement)
 *   - level: number (if badge has multiple levels)
 *
 * /users/{userId}/stats/{statId} (e.g., statId = 'general')
 *   - quizzesCompleted: number
 *   - homeworksCompleted: number
 *   - trainingsCompleted: number
 *   - assignmentsSubmitted: number
 *   - totalTimeSpent: number (in seconds)
 *   - loginStreak: number
 *   - lastLoginDate: string (YYYY-MM-DD)
 *   - averageScore: number
 *   - perfectScores: number
 */

/**
 * Get all badge definitions from the database.
 */
export async function getBadgeDefinitions() {
  try {
    const snapshot = await getDocs(collection(db, 'badges'));
    const badges = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data: badges };
  } catch (error) {
    const code = (error && error.code) || '';
    if (code === 'permission-denied') {
      console.warn('Badges: permission denied while loading definitions');
      return { success: false, error: 'permission-denied', data: [] };
    }
    console.warn('Error getting badge definitions:', error?.message || error);
    return { success: false, error: error?.message, data: [] };
  }
}

/**
 * Get all badges a specific user has earned.
 * @param {string} userId - The user's ID.
 */
export async function getUserBadges(userId) {
  try {
    const snapshot = await getDocs(collection(db, `users/${userId}/badges`));
    const badges = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data: badges };
  } catch (error) {
    const code = (error && error.code) || '';
    if (code === 'permission-denied') {
      console.warn('Badges: permission denied while loading user badges');
      return { success: false, error: 'permission-denied', data: [] };
    }
    console.warn('Error getting user badges:', error?.message || error);
    return { success: false, error: error?.message, data: [] };
  }
}

/**
 * Get the statistics for a specific user.
 * @param {string} userId - The user's ID.
 */
export async function getUserStats(userId) {
  try {
    const docRef = doc(db, `users/${userId}/stats`, 'general');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    } else {
      return { success: true, data: null }; // No stats yet
    }
  } catch (error) {
    const code = (error && error.code) || '';
    if (code === 'permission-denied') {
      console.warn('Badges: permission denied while loading user stats');
      return { success: false, error: 'permission-denied', data: null };
    }
    console.warn('Error getting user stats:', error?.message || error);
    return { success: false, error: error?.message, data: null };
  }
}

/**
 * Manually award a medal/badge to one or more students.
 * @param {string[]} studentIds - Array of student IDs.
 * @param {object} medal - The medal/badge object to award.
 * @param {string} reason - Optional reason for the award.
 * @param {string} awardedBy - The ID of the user giving the award.
 */
export async function awardManualMedal(studentIds, medal, reason, awardedBy) {
  try {
    const batch = [];
    studentIds.forEach(studentId => {
      const awardRef = doc(collection(db, `users/${studentId}/badges`));
      const pointRef = doc(collection(db, 'points'));
      
      batch.push(setDoc(awardRef, {
        badgeId: medal.id,
        name: medal.name,
        icon: medal.icon,
        category: 'manual',
        earnedAt: serverTimestamp(),
        awardedBy,
        reason
      }));

      batch.push(setDoc(pointRef, {
        studentId,
        points: medal.points || 1,
        category: 'participation',
        reason: medal.name,
        awardedBy,
        timestamp: serverTimestamp()
      }));
    });

    // This should be a batched write, but for simplicity and feedback, we do it one by one.
    // For production, use `writeBatch`.
    await Promise.all(batch);

    return { success: true };
  } catch (error) {
    console.error('Error awarding manual medal:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Process an event that might trigger a badge.
 * This function will be the core of the auto-award system.
 * @param {string} userId - The user's ID.
 * @param {string} eventType - e.g., 'quiz_completed', 'homework_submitted', 'login'.
 * @param {object} eventData - Additional data about the event.
 */
export async function processBadgeTrigger(userId, eventType, eventData = {}) {
  try {
    // Minimal implementation: track resource completions in user stats
    if (eventType === 'resource_completed') {
      const statsRef = doc(db, `users/${userId}/stats`, 'general');
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(statsRef);
        const curr = snap.exists() ? snap.data() : {};
        const next = {
          ...curr,
          resourcesCompleted: Math.max(0, parseInt(curr.resourcesCompleted || 0, 10)) + 1,
          lastUpdatedAt: serverTimestamp()
        };
        if (snap.exists()) tx.update(statsRef, next); else tx.set(statsRef, next);
      });
    }
    // Placeholder: extend with other event types later
    return { success: true, newBadges: [] };
  } catch (error) {
    console.warn('processBadgeTrigger failed:', error?.message || error);
    return { success: false, error: error?.message };
  }
}
