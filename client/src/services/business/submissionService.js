import { SUBMISSION_STATUS, RECORD_TYPES } from '@utils/sharedTypes';
import { 
  getSubmissionsByUser as getSubmissionsByUserFromDb,
  getSubmissionsByActivity as getSubmissionsByActivityFromDb,
  getSubmission as getSubmissionFromDb,
  createSubmission as createSubmissionToDb,
  updateSubmission as updateSubmissionInDb,
  deleteSubmission as deleteSubmissionFromDb,
  getSubmissions as getSubmissionsFromDb
} from '../db/submissionsDbService';

// Submit activity completion
export const submitActivity = async (userId, activityId, classId, data = {}) => {
  try {
    // Check for existing submission
    const q = query(
      collection(db, 'submissions'),
      where('userId', '==', userId),
      where('activityId', '==', activityId),
      where('classId', '==', classId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // Update existing submission if retakes allowed
      const submissionDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, 'submissions', submissionDoc.id), {
        ...data,
        status: SUBMISSION_STATUS.COMPLETED,
        submittedAt: serverTimestamp(),
        retakeCount: (submissionDoc.data().retakeCount || 0) + 1
      });
      return { success: true, id: submissionDoc.id, message: 'Submission updated' };
    } else {
      // Create new submission
      const docRef = await addDoc(collection(db, 'submissions'), {
        userId,
        activityId,
        classId,
        status: SUBMISSION_STATUS.COMPLETED,
        submittedAt: serverTimestamp(),
        score: null, // Will be set by instructor
        feedback: '',
        retakeCount: 0,
        ...data
      });
      return { success: true, id: docRef.id, message: 'Activity submitted' };
    }
  } catch (error) {
    logger.error('Error submitting activity:', error);
    return { success: false, error: error.message };
  }
};

// Get user submissions for a specific activity
export const getUserSubmissions = async (userId, activityId = null) => {
  try {
    let q;
    if (activityId) {
      q = query(
        collection(db, 'submissions'),
        where('userId', '==', userId),
        where('activityId', '==', activityId)
      );
    } else {
      q = query(
        collection(db, 'submissions'),
        where('userId', '==', userId)
      );
    }
    
    const querySnapshot = await getDocs(q);
    const submissions = [];
    querySnapshot.forEach((doc) => {
      submissions.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: submissions };
  } catch (error) {
    logger.error('Error getting submissions:', error);
    return { success: false, error: error.message };
  }
};

// Get class submissions for instructor
export const getClassSubmissions = async (classId) => {
  try {
    const q = query(
      collection(db, 'submissions'),
      where('classId', '==', classId)
    );
    
    const querySnapshot = await getDocs(q);
    const submissions = [];
    querySnapshot.forEach((doc) => {
      submissions.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: submissions };
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
      gradedAt: serverTimestamp(),
      status: SUBMISSION_STATUS.GRADED,
      gradedBy
    };

    // Update submission
    await updateDoc(doc(db, 'submissions', submissionId), update);

    // Auto-award points based on score
    if (score !== undefined) {
      const submissionDoc = await getDoc(doc(db, 'submissions', submissionId));
      if (submissionDoc.exists()) {
        const submission = submissionDoc.data();
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
    const qs = await getDocs(collection(db, "submissions"));
    const items = [];
    qs.forEach((d) => items.push({ docId: d.id, ...d.data() }));
    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Delete submission
export const deleteSubmission = async (id) => {
  try {
    await deleteDoc(doc(db, "submissions", id));
    return { success: true };
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
    // Get all activities for the class
    const activitiesQuery = query(
      collection(db, RECORD_TYPES.ACTIVITY),
      where('classId', '==', classId)
    );
    
    const activitiesSnapshot = await getDocs(activitiesQuery);
    const activities = [];
    activitiesSnapshot.forEach((doc) => {
      activities.push({ id: doc.id, ...doc.data() });
    });
    
    // Get user submissions
    const submissionsQuery = query(
      collection(db, 'submissions'),
      where('userId', '==', userId),
      where('classId', '==', classId)
    );
    
    const submissionsSnapshot = await getDocs(submissionsQuery);
    const submissions = {};
    submissionsSnapshot.forEach((doc) => {
      const data = doc.data();
      submissions[data.activityId] = { id: doc.id, ...data };
    });
    
    // Calculate progress
    const totalActivities = activities.filter(a => !a.optional).length;
    const completedActivities = activities.filter(a => 
      !a.optional && submissions[a.id] && submissions[a.id].status === SUBMISSION_STATUS.COMPLETED
    ).length;
    const gradedActivities = activities.filter(a => 
      !a.optional && submissions[a.id] && submissions[a.id].status === SUBMISSION_STATUS.GRADED
    ).length;
    
    const totalScore = activities.reduce((sum, activity) => {
      const submission = submissions[activity.id];
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

