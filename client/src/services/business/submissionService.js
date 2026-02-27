import { SUBMISSION_STATUS, RECORD_TYPES } from '@utils/sharedTypes';
import logger from '@utils/logger';
import { 
  getSubmissionsByUser as getSubmissionsByUserFromDb,
  getSubmissionsByActivity as getSubmissionsByActivityFromDb,
  getSubmission as getSubmissionFromDb,
  createSubmission as createSubmissionToDb,
  updateSubmission as updateSubmissionInDb,
  deleteSubmission as deleteSubmissionFromDb,
  getSubmissions as getSubmissionsFromDb,
  querySubmissions as querySubmissionsFromDb
} from '../db/submissionsDbService';
import { 
  getActivitiesByClass as getActivitiesByClassFromDb
} from '../db/activitiesDbService';

// Submit activity completion
export const submitActivity = async (userId, activityId, classId, data = {}) => {
  try {
    // Check for existing submission using database service
    const existingSubmissions = await getSubmissionsFromDb({
      userId,
      activityId,
      classId,
      limitCount: 1
    });
    
    if (!existingSubmissions.success) {
      return { success: false, error: existingSubmissions.error };
    }
    
    if (existingSubmissions.data.length > 0) {
      // Update existing submission if retakes allowed
      const existingSubmission = existingSubmissions.data[0];
      const updateResult = await updateSubmissionInDb(existingSubmission.docId, {
        ...data,
        status: SUBMISSION_STATUS.COMPLETED,
        retakeCount: (existingSubmission.retakeCount || 0) + 1
      });
      
      return updateResult.success 
        ? { success: true, id: existingSubmission.docId, message: 'Submission updated' }
        : updateResult;
    } else {
      // Create new submission
      const submissionData = {
        userId,
        activityId,
        classId,
        status: SUBMISSION_STATUS.COMPLETED,
        score: null, // Will be set by instructor
        feedback: '',
        retakeCount: 0,
        ...data
      };
      
      const createResult = await createSubmissionToDb(submissionData);
      return createResult;
    }
  } catch (error) {
    logger.error('Error submitting activity:', error);
    return { success: false, error: error.message };
  }
};

// Get user submissions for a specific activity
export const getUserSubmissions = async (userId, activityId = null) => {
  try {
    const filters = { userId };
    if (activityId) {
      filters.activityId = activityId;
    }
    
    const result = await getSubmissionsFromDb(filters);
    return result;
  } catch (error) {
    logger.error('Error getting submissions:', error);
    return { success: false, error: error.message };
  }
};

// Get class submissions for instructor
export const getClassSubmissions = async (classId) => {
  try {
    const result = await getSubmissionsFromDb({ classId });
    return result;
  } catch (error) {
    logger.error('Error getting class submissions:', error);
    return { success: false, error: error.message };
  }
};

// Grade submission (instructor only) with auto-award points
export const gradeSubmission = async (submissionId, score, feedback = '', gradedBy = null) => {
  try {
    const update = {
      score,
      feedback,
      status: SUBMISSION_STATUS.GRADED,
      gradedBy
    };

    // Update submission using database service
    const updateResult = await updateSubmissionInDb(submissionId, update);
    
    if (!updateResult.success) {
      return updateResult;
    }

    // Auto-award points based on score
    if (score !== undefined) {
      const submissionResult = await getSubmissionFromDb(submissionId);
      if (submissionResult.success && submissionResult.data) {
        const submission = submissionResult.data;
        const scoreNum = Number(score);

        // Award points based on performance
        let pointsToAward = 0;
        let category = "completion";

        if (scoreNum >= 90) {
          pointsToAward = 2; // Excellence
          category = "excellence";
        } else if (scoreNum >= 70) {
          pointsToAward = 1; // Good work
          category = "good_work";
        } else if (scoreNum >= 50) {
          pointsToAward = 1; // Completion
          category = "completion";
        }

        // Award points if score is passing
        if (pointsToAward > 0 && submission.userId) {
          try {
            // Import awardPoints function to avoid circular dependency
            const { awardPoints } = await import('./participationService');
            await awardPoints({
              studentIds: [submission.userId],
              points: pointsToAward,
              category: category,
              reason: `Activity graded: ${scoreNum}/100`,
              awardedBy: gradedBy || "system",
              classId: submission.classId || null,
              activityId: submission.activityId || null,
            });
          } catch (pointsError) {
            logger.warn("Failed to award points for graded submission:", pointsError);
          }
        }
      }
    }

    return { success: true, message: 'Submission graded' };
  } catch (error) {
    logger.error('Error grading submission:', error);
    return { success: false, error: error.message };
  }
};

// Get all submissions (admin function)
export const getSubmissions = async () => {
  try {
    const result = await getSubmissionsFromDb({ limitCount: 1000 }); // Get all submissions with high limit
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Delete submission
export const deleteSubmission = async (id) => {
  try {
    const result = await deleteSubmissionFromDb(id);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Check if activity can be retaken
export const canRetakeActivity = async (userId, activityId, activity) => {
  try {
    // Check if retakes are allowed
    if (!activity.allowRetakes) {
      return { canRetake: false, reason: 'Retakes not allowed' };
    }
    
    // Check due date if exists
    if (activity.dueDate) {
      const dueDate = activity.dueDate.toDate ? activity.dueDate.toDate() : new Date(activity.dueDate);
      if (new Date() > dueDate) {
        return { canRetake: false, reason: 'Past due date' };
      }
    }
    
    // Get user's submissions
    const result = await getUserSubmissions(userId, activityId);
    if (!result.success) {
      return { canRetake: false, reason: 'Error checking submissions' };
    }
    
    // Check max retakes if defined
    const maxRetakes = activity.maxRetakes || Infinity;
    const submissions = result.data;
    
    if (submissions.length >= maxRetakes + 1) {
      return { canRetake: false, reason: `Maximum retakes (${maxRetakes}) reached` };
    }
    
    return { canRetake: true, attemptsLeft: maxRetakes - submissions.length + 1 };
  } catch (error) {
    logger.error('Error checking retake eligibility:', error);
    return { canRetake: false, reason: 'Error checking eligibility' };
  }
};

// Get activity progress for user
export const getActivityProgress = async (userId, classId) => {
  try {
    // Get all activities for the class using database service
    const activitiesResult = await getActivitiesByClassFromDb(classId, { limitCount: 1000 });
    if (!activitiesResult.success) {
      return { success: false, error: activitiesResult.error };
    }
    
    const activities = activitiesResult.data;
    
    // Get user submissions using database service
    const submissionsResult = await getSubmissionsFromDb({ userId, classId });
    if (!submissionsResult.success) {
      return { success: false, error: submissionsResult.error };
    }
    
    const submissions = {};
    submissionsResult.data.forEach(submission => {
      submissions[submission.activityId] = submission;
    });
    
    // Calculate progress
    const totalActivities = activities.filter(a => !a.optional).length;
    const completedActivities = activities.filter(a => 
      !a.optional && submissions[a.docId] && submissions[a.docId].status === SUBMISSION_STATUS.COMPLETED
    ).length;
    const gradedActivities = activities.filter(a => 
      !a.optional && submissions[a.docId] && submissions[a.docId].status === SUBMISSION_STATUS.GRADED
    ).length;
    
    const totalScore = activities.reduce((sum, activity) => {
      const submission = submissions[activity.docId];
      if (submission && submission.score) {
        return sum + submission.score;
      }
      return sum;
    }, 0);
    
    return {
      success: true,
      data: {
        totalActivities,
        completedActivities,
        gradedActivities,
        totalScore,
        activities: activities.map(activity => ({
          ...activity,
          submission: submissions[activity.id] || null
        }))
      }
    };
  } catch (error) {
    logger.error('Error getting activity progress:', error);
    return { success: false, error: error.message };
  }
};

