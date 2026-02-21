import { getStudentRank } from '@constants/sharedConfig';
import logger from '@utils/logger';
import { 
  getStudentGamification as getStudentGamificationFromDb,
  setStudentGamification as setStudentGamificationToDb,
  awardPoints as awardPointsToDb,
  updateStudentRank as updateStudentRankInDb,
  getLeaderboard as getLeaderboardFromDb,
  getClassLeaderboard as getClassLeaderboardFromDb
} from '../db/gamificationDbService';
import { getUserById } from './userService';

/**
 * Gamification Service
 * Handles points, ranks, skills, and leaderboard functionality
 */

// Award points to student(s)
export const awardPoints = async (pointsData) => {
  try {
    const {
      studentIds,
      points,
      category,
      reason,
      awardedBy,
      classId,
      activityId,
    } = pointsData;

    const results = await Promise.all(
      studentIds.map(async (studentId) => {
        // Get current user data to check existing points
        const userResult = await getUserById(studentId);
        const currentPoints = userResult.success && userResult.data 
          ? userResult.data.totalPoints || 0 
          : 0;
        const oldRank = getStudentRank(currentPoints);

        // Use database service to award points
        const pointData = {
          studentId,
          classId,
          awardedBy,
          points: Number(points),
          category,
          reason: reason || "",
          activityId: activityId || null,
          timestamp: new Date()
        };

        const awardResult = await awardPointsToDb(pointData);
        if (!awardResult.success) {
          return { studentId, success: false, error: awardResult.error };
        }

        // Update student's total points using user service
        const newPoints = currentPoints + Number(points);
        const { updateUser } = await import('./userService');
        const updateResult = await updateUser(studentId, {
          totalPoints: newPoints,
          lastPointsUpdate: new Date()
        });

        // Check if rank changed
        const newRank = getStudentRank(newPoints);
        const rankChanged = oldRank.current.name !== newRank.current.name;

        return {
          studentId,
          oldPoints: currentPoints,
          newPoints,
          oldRank: oldRank.current,
          newRank: newRank.current,
          rankChanged,
          pointsAwarded: Number(points)
        };
      })
    );

    return { success: true, data: results };
  } catch (error) {
    logger.error("Error awarding points:", error);
    return { success: false, error: error.message };
  }
};

// Get points for a student - with performance monitoring and memoization
export const getStudentPoints = async (studentId) => {
  try {
    // Use database service to get student points
    const { getStudentPoints: getStudentPointsFromDb } = await import('../db/gamificationDbService');
    const result = await getStudentPointsFromDb(studentId);
    return result;
  } catch (error) {
    logger.error("Error getting student points:", error);
    return { success: false, error: error.message };
  }
};

// Get all points for a class
export const getClassPoints = async (classId) => {
  try {
    // Use database service to get class points
    const { getClassPoints: getClassPointsFromDb } = await import('../db/gamificationDbService');
    const result = await getClassPointsFromDb(classId);
    return result;
  } catch (error) {
    logger.error("Error getting class points:", error);
    return { success: false, error: error.message };
  }
};

// Get leaderboard for a class
export const getClassLeaderboard = async (classId) => {
  try {
    // Use database service to get class leaderboard
    const result = await getClassLeaderboardFromDb(classId);
    return result;
  } catch (error) {
    logger.error("Error getting class leaderboard:", error);
    return { success: false, error: error.message };
  }
};

// Create or update skill
export const saveSkill = async (skillData) => {
  try {
    // Use database service to save skill
    const { saveSkill: saveSkillToDb } = await import('../db/gamificationDbService');
    const result = await saveSkillToDb(skillData);
    return result;
  } catch (error) {
    logger.error("Error saving skill:", error);
    return { success: false, error: error.message };
  }
};

// Get skills for a class
export const getClassSkills = async (classId) => {
  try {
    // Use database service to get class skills
    const { getClassSkills: getClassSkillsFromDb } = await import('../db/gamificationDbService');
    const result = await getClassSkillsFromDb(classId);
    return result;
  } catch (error) {
    logger.error("Error getting class skills:", error);
    return { success: false, error: error.message };
  }
};

// Delete skill
export const deleteSkill = async (skillId) => {
  try {
    // Use database service to delete skill
    const { deleteSkill: deleteSkillFromDb } = await import('../db/gamificationDbService');
    const result = await deleteSkillFromDb(skillId);
    return result;
  } catch (error) {
    logger.error("Error deleting skill:", error);
    return { success: false, error: error.message };
  }
};

