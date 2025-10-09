import { 
  doc, 
  collection, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from './config';

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
        status: 'completed',
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
        status: 'completed',
        submittedAt: serverTimestamp(),
        score: null, // Will be set by instructor
        feedback: '',
        retakeCount: 0,
        ...data
      });
      return { success: true, id: docRef.id, message: 'Activity submitted' };
    }
  } catch (error) {
    console.error('Error submitting activity:', error);
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
    console.error('Error getting submissions:', error);
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
    console.error('Error getting class submissions:', error);
    return { success: false, error: error.message };
  }
};

// Grade submission (instructor only)
export const gradeSubmission = async (submissionId, score, feedback = '') => {
  try {
    await updateDoc(doc(db, 'submissions', submissionId), {
      score,
      feedback,
      gradedAt: serverTimestamp(),
      status: 'graded'
    });
    return { success: true, message: 'Submission graded' };
  } catch (error) {
    console.error('Error grading submission:', error);
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
    console.error('Error checking retake eligibility:', error);
    return { canRetake: false, reason: 'Error checking eligibility' };
  }
};

// Get activity progress for user
export const getActivityProgress = async (userId, classId) => {
  try {
    // Get all activities for the class
    const activitiesQuery = query(
      collection(db, 'activities'),
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
      !a.optional && submissions[a.id] && submissions[a.id].status === 'completed'
    ).length;
    const gradedActivities = activities.filter(a => 
      !a.optional && submissions[a.id] && submissions[a.id].status === 'graded'
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
    console.error('Error getting activity progress:', error);
    return { success: false, error: error.message };
  }
};
