import { db } from './config';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';

// Create a new quiz
export const createQuiz = async (quizData, userId) => {
  try {
    const quizzesRef = collection(db, 'quizzes');
    const docRef = await addDoc(quizzesRef, {
      ...quizData,
      visibility: quizData?.visibility || 'private', // 'private' | 'class' | 'public'
      allowAnonymous: !!quizData?.allowAnonymous,
      folderId: quizData?.folderId || null,
      assignedClassIds: Array.isArray(quizData?.assignedClassIds) ? quizData.assignedClassIds : (quizData?.classId ? [quizData.classId] : []),
      term: quizData?.term || null,
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating quiz:', error);
    return { success: false, error: error.message };
  }
};

// Get a quiz by ID
export const getQuiz = async (quizId) => {
  try {
    const quizRef = doc(db, 'quizzes', quizId);
    const quizSnap = await getDoc(quizRef);
    
    if (quizSnap.exists()) {
      return { success: true, data: { id: quizSnap.id, ...quizSnap.data() } };
    } else {
      return { success: false, error: 'Quiz not found' };
    }
  } catch (error) {
    console.error('Error getting quiz:', error);
    return { success: false, error: error.message };
  }
};

// Get all quizzes
export const getAllQuizzes = async () => {
  try {
    const quizzesRef = collection(db, 'quizzes');
    const q = query(quizzesRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const quizzes = [];
    querySnapshot.forEach((doc) => {
      quizzes.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: quizzes };
  } catch (error) {
    if (error?.code === 'permission-denied') {
      return { success: false, error: 'permission-denied', data: [] };
    }
    console.error('Error getting quizzes:', error?.message || error);
    return { success: false, error: error.message };
  }
};

// Get quizzes by creator
export const getQuizzesByCreator = async (userId) => {
  try {
    const quizzesRef = collection(db, 'quizzes');
    const q = query(quizzesRef, where('createdBy', '==', userId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const quizzes = [];
    querySnapshot.forEach((doc) => {
      quizzes.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: quizzes };
  } catch (error) {
    console.error('Error getting quizzes by creator:', error);
    return { success: false, error: error.message };
  }
};

// Update a quiz
export const updateQuiz = async (quizId, updates) => {
  try {
    const quizRef = doc(db, 'quizzes', quizId);
    
    // Build update object without undefined values
    const updatePayload = {
      ...updates,
      visibility: updates?.visibility || 'private',
      allowAnonymous: updates?.allowAnonymous === true,
      updatedAt: serverTimestamp()
    };
    
    // Only include folderId if explicitly provided
    if ('folderId' in updates) {
      updatePayload.folderId = updates.folderId || null;
    }
    
    // Only include assignedClassIds if it's an array
    if (Array.isArray(updates?.assignedClassIds)) {
      updatePayload.assignedClassIds = updates.assignedClassIds;
    }
    
    await updateDoc(quizRef, updatePayload);
    return { success: true };
  } catch (error) {
    console.error('Error updating quiz:', error);
    return { success: false, error: error.message };
  }
};

// Delete a quiz
export const deleteQuiz = async (quizId) => {
  try {
    const quizRef = doc(db, 'quizzes', quizId);
    await deleteDoc(quizRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting quiz:', error);
    return { success: false, error: error.message };
  }
};

// Submit a quiz (student)
export const submitQuiz = async (submissionData) => {
  try {
    const submissionsRef = collection(db, 'quizSubmissions');
    const docRef = await addDoc(submissionsRef, {
      ...submissionData,
      submittedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error submitting quiz:', error);
    return { success: false, error: error.message };
  }
};

// Get submissions for a quiz
export const getQuizSubmissions = async (quizId) => {
  try {
    const submissionsRef = collection(db, 'quizSubmissions');
    const q = query(submissionsRef, where('quizId', '==', quizId), orderBy('submittedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const submissions = [];
    querySnapshot.forEach((doc) => {
      submissions.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: submissions };
  } catch (error) {
    console.error('Error getting quiz submissions:', error);
    return { success: false, error: error.message };
  }
};

// Get submissions by student
export const getStudentSubmissions = async (userId) => {
  try {
    const submissionsRef = collection(db, 'quizSubmissions');
    const q = query(submissionsRef, where('userId', '==', userId), orderBy('submittedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const submissions = [];
    querySnapshot.forEach((doc) => {
      submissions.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: submissions };
  } catch (error) {
    console.error('Error getting student submissions:', error);
    return { success: false, error: error.message };
  }
};

// Get leaderboard for a quiz
export const getQuizLeaderboard = async (quizId, limit = 10) => {
  try {
    const submissionsRef = collection(db, 'quizSubmissions');
    const q = query(
      submissionsRef, 
      where('quizId', '==', quizId), 
      orderBy('score', 'desc'),
      orderBy('completedAt', 'asc')
    );
    const querySnapshot = await getDocs(q);
    
    const leaderboard = [];
    querySnapshot.forEach((doc) => {
      leaderboard.push({ id: doc.id, ...doc.data() });
    });
    
    // Get unique users (best score per user)
    const uniqueUsers = new Map();
    leaderboard.forEach(submission => {
      if (!uniqueUsers.has(submission.userId) || uniqueUsers.get(submission.userId).score < submission.score) {
        uniqueUsers.set(submission.userId, submission);
      }
    });
    
    const topScores = Array.from(uniqueUsers.values())
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return new Date(a.completedAt) - new Date(b.completedAt);
      })
      .slice(0, limit);
    
    return { success: true, data: topScores };
  } catch (error) {
    console.error('Error getting quiz leaderboard:', error);
    return { success: false, error: error.message };
  }
};

// Update submission score (manual correction)
export const updateSubmissionScore = async (submissionId, newScore, correctedBy) => {
  try {
    const submissionRef = doc(db, 'quizSubmissions', submissionId);
    await updateDoc(submissionRef, {
      score: newScore,
      manuallyCorrected: true,
      correctedBy,
      correctedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating submission score:', error);
    return { success: false, error: error.message };
  }
};

// Get quiz analytics
export const getQuizAnalytics = async (quizId) => {
  try {
    const submissions = await getQuizSubmissions(quizId);
    
    if (!submissions.success) {
      return submissions;
    }
    
    const data = submissions.data;
    const totalSubmissions = data.length;
    const uniqueStudents = new Set(data.map(s => s.userId)).size;
    const totalScore = data.reduce((sum, s) => sum + (s.score || 0), 0);
    const avgScore = totalSubmissions > 0 ? totalScore / totalSubmissions : 0;
    const completionRate = data.filter(s => s.completedAt).length / totalSubmissions * 100;
    
    // Question analysis (supports legacy array shape and new object map shape)
    const questionStats = {};
    data.forEach(submission => {
      const ans = submission.answers;
      if (!ans) return;

      // Legacy: answers is array of { questionId, correct, timeSpent? }
      if (Array.isArray(ans)) {
        ans.forEach(answer => {
          const qid = answer.questionId;
          if (!qid) return;
          if (!questionStats[qid]) {
            questionStats[qid] = { correct: 0, incorrect: 0, total: 0, totalTime: 0 };
          }
          questionStats[qid].total++;
          if (answer.correct) {
            questionStats[qid].correct++;
          } else {
            questionStats[qid].incorrect++;
          }
          if (typeof answer.timeSpent === 'number') {
            questionStats[qid].totalTime += answer.timeSpent;
          }
        });
      } else if (typeof ans === 'object') {
        // New: answers is an object keyed by questionId: { [questionId]: { isCorrect, timeSpent } }
        Object.entries(ans).forEach(([qid, value]) => {
          if (!questionStats[qid]) {
            questionStats[qid] = { correct: 0, incorrect: 0, total: 0, totalTime: 0 };
          }
          questionStats[qid].total++;
          if (value?.isCorrect) {
            questionStats[qid].correct++;
          } else {
            questionStats[qid].incorrect++;
          }
          if (typeof value?.timeSpent === 'number') {
            questionStats[qid].totalTime += value.timeSpent;
          }
        });
      }
    });

    // Compute average time per question
    Object.keys(questionStats).forEach(qid => {
      const stats = questionStats[qid];
      const answeredCount = stats.total || 1;
      stats.avgTime = stats.totalTime / answeredCount;
    });
    
    return {
      success: true,
      data: {
        totalSubmissions,
        uniqueStudents,
        avgScore,
        completionRate,
        questionStats
      }
    };
  } catch (error) {
    console.error('Error getting quiz analytics:', error);
    return { success: false, error: error.message };
  }
};

// Duplicate quiz to another class/term as a new quiz (no reuse across classes)
export const duplicateQuizToClass = async (quizId, targetClassId, term, requestedBy) => {
  try {
    const srcRef = doc(db, 'quizzes', quizId);
    const snap = await getDoc(srcRef);
    if (!snap.exists()) return { success: false, error: 'Source quiz not found' };
    const data = snap.data();

    const payload = {
      ...data,
      classId: targetClassId,
      assignedClassIds: [targetClassId],
      term: term || null,
      createdBy: requestedBy,
      // Reset timestamps and any identifiers that should not carry over
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Remove Firestore metadata-like fields if present
    delete payload.id;

    const quizzesRef = collection(db, 'quizzes');
    const newRef = await addDoc(quizzesRef, payload);
    return { success: true, id: newRef.id };
  } catch (error) {
    console.error('Error duplicating quiz:', error);
    return { success: false, error: error.message };
  }
};

// Minimal quiz folder helpers
export const createQuizFolder = async (folderData, userId) => {
  try {
    const ref = await addDoc(collection(db, 'quizFolders'), {
      name: folderData?.name || 'Untitled Folder',
      description: folderData?.description || '',
      ownerId: userId,
      classIds: Array.isArray(folderData?.classIds) ? folderData.classIds : [],
      term: folderData?.term || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true, id: ref.id };
  } catch (error) {
    console.error('Error creating quiz folder:', error);
    return { success: false, error: error.message };
  }
};

export const listQuizFolders = async () => {
  try {
    const qs = await getDocs(collection(db, 'quizFolders'));
    const items = [];
    qs.forEach(d => items.push({ id: d.id, ...d.data() }));
    return { success: true, data: items };
  } catch (error) {
    console.error('Error listing quiz folders:', error);
    return { success: false, error: error.message };
  }
};
