import { canParticipate } from '@utils/userStatus';
import { notificationGateway } from "./notificationGateway";
import { NOTIFICATION_TRIGGERS } from "@constants/notificationTypes";
import { getUserById } from "./userService";
import { RECORD_TYPES } from "@utils/sharedTypes";
import { getCreateAuditData, getUpdateAuditData } from '@utils/auditHelper';
import logger from '@utils/logger';
import { ActivityLogger } from '../other/activityLogger';
import { 
  getQuizzes as getQuizzesFromDb,
  getQuiz as getQuizFromDb,
  create as createQuizToDb,
  update as updateQuizInDb,
  deleteQuiz as deleteQuizFromDb
} from '../db/quizzesDbService';

// Create a new quiz
export const createQuiz = async (quizData, user) => {
  try {
    const quizDataWithMetadata = {
      ...quizData,
      visibility: quizData?.visibility || "private", // 'private' | 'class' | 'public'
      allowAnonymous: !!quizData?.allowAnonymous,
      folderId: quizData?.folderId || null,
      assignedClassIds: Array.isArray(quizData?.assignedClassIds)
        ? quizData.assignedClassIds
        : quizData?.classId
        ? [quizData.classId]
        : [],
      term: quizData?.term || null,
    };

    const auditData = getCreateAuditData(user);
    const result = await createQuizToDb(quizDataWithMetadata, auditData);

    // Notify students about new quiz availability if it's assigned to classes
    const classIds = Array.isArray(quizData?.assignedClassIds) ? quizData.assignedClassIds : (quizData?.classId ? [quizData.classId] : []);
    if (classIds.length > 0 && quizData?.visibility !== 'private') {
      try {
        // Get all students in these classes using enrollmentsDbService
        const { getEnrollmentsByClassIds } = await import('../db/enrollmentsDbService');
        const enrollmentsResult = await getEnrollmentsByClassIds(classIds);
        
        if (enrollmentsResult.success) {
          const studentIds = [...new Set(enrollmentsResult.data.map(d => d.userId))];
          
          for (const studentId of studentIds) {
            const { data: student } = await getUserById(studentId);
            if (student && student.email) {
              await notificationGateway.send(NOTIFICATION_TRIGGERS.QUIZ_AVAILABLE, {
                userId: studentId,
                role: 'student',
                classId: classIds[0],
                title: 'New Quiz Available',
                message: `${quizData.title} is now available.`,
                type: RECORD_TYPES.QUIZ || 'quiz',
                email: student.email,
                templateId: 'quizAvailable',
                variables: {
                  studentName: student.displayName || student.name || 'Student',
                  quizTitle: quizData.title,
                  dueDate: quizData.settings?.dueDate ? new Date(quizData.settings.dueDate).toLocaleDateString() : 'N/A'
                }
              });
            }
          }
        }
      } catch (notifyError) {
        logger.warn('Failed to send quiz availability notifications:', notifyError);
      }
    }

    return { success: true, id: result.id };
  } catch (error) {
    logger.error("Error creating quiz:", error);
    return { success: false, error: error.message };
  }
};

// Get a quiz by ID - with performance monitoring and memoization
export const getQuiz = async (quizId) => {
  try {
    const result = await getQuizFromDb(quizId);

    if (result.success) {
      return { success: true, data: { id: result.data.docId, ...result.data } };
    } else {
      return { success: false, error: "Quiz not found" };
    }
  } catch (error) {
    logger.error("Error getting quiz:", error);
    return { success: false, error: error.message };
  }
};

// Get all quizzes - with performance monitoring
export const getAllQuizzes = async () => {
  try {
    const result = await getQuizzesFromDb();
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    if (error?.code === "permission-denied") {
      return { success: false, error: "permission-denied", data: [] };
    }
    logger.error("Error getting quizzes:", error?.message || error);
    return { success: false, error: error.message };
  }
};

// Get quizzes by creator - with performance monitoring and memoization
export const getQuizzesByCreator = async (userId) => {
  try {
    const quizzesRef = collection(db, "quizzes");
    const q = query(
      quizzesRef,
      where("createdBy", "==", userId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);

    const quizzes = [];
    querySnapshot.forEach((doc) => {
      quizzes.push({ id: doc.id, ...doc.data() });
    });

    return { success: true, data: quizzes };
  } catch (error) {
    logger.error("Error getting quizzes by creator:", error);
    return { success: false, error: error.message };
  }
};

// Update a quiz and cascade update related activities
export const updateQuiz = async (quizId, updates, user) => {
  try {
    // Build update object without undefined values
    const updatePayload = {
      ...updates,
      visibility: updates?.visibility || "private",
      allowAnonymous: updates?.allowAnonymous === true,
    };

    // Only include folderId if explicitly provided
    if ("folderId" in updates) {
      updatePayload.folderId = updates.folderId || null;
    }

    // Only include assignedClassIds if it's an array
    if (Array.isArray(updates?.assignedClassIds)) {
      updatePayload.assignedClassIds = updates.assignedClassIds;
    }

    const auditData = getUpdateAuditData(user);
    const result = await updateQuizInDb(quizId, updatePayload, auditData);

    // Cascade update related activities if quiz settings changed
    try {
      const {
        collection: col,
        query: q,
        where: w,
        getDocs: getDocsQuery,
        updateDoc: updateDocQuery,
      } = await import("firebase/firestore");
      const activitiesRef = col(db, RECORD_TYPES.ACTIVITY);
      const activitiesQuery = q(activitiesRef, w("quizId", "==", quizId));
      const activitiesSnap = await getDocsQuery(activitiesQuery);

      const cascadeUpdates = [];
      activitiesSnap.forEach((activityDoc) => {
        const activity = activityDoc.data();
        // Only update if activity doesn't override quiz settings
        if (!activity.overrideQuizSettings) {
          const activityUpdates = {};

          // Update difficulty if changed
          if (updates.difficulty !== undefined) {
            activityUpdates.difficulty = updates.difficulty;
          }

          // Update allowRetake if changed
          if (updates.settings?.allowRetake !== undefined) {
            activityUpdates.allowRetake = updates.settings.allowRetake;
          }

          // Update maxScore if questions changed (calculate total points)
          if (updates.questions && Array.isArray(updates.questions)) {
            const totalPoints = updates.questions.reduce(
              (sum, q) => sum + (q.points || 1),
              0
            );
            activityUpdates.maxScore = totalPoints;
          }

          if (Object.keys(activityUpdates).length > 0) {
            cascadeUpdates.push(
              updateDocQuery(
                doc(db, RECORD_TYPES.ACTIVITY, activityDoc.id),
                activityUpdates
              )
            );
          }
        }
      });

      if (cascadeUpdates.length > 0) {
        await Promise.all(cascadeUpdates);
        logger.log(
          `[Cascade] Updated ${cascadeUpdates.length} related activities`
        );
      }
    } catch (cascadeError) {
      logger.warn("Failed to cascade update activities:", cascadeError);
      // Don't fail the quiz update if cascade fails
    }

    return { success: true };
  } catch (error) {
    logger.error("Error updating quiz:", error);
    return { success: false, error: error.message };
  }
};

// Delete a quiz
export const deleteQuiz = async (quizId) => {
  try {
    const quizRef = doc(db, "quizzes", quizId);
    await deleteDoc(quizRef);
    return { success: true };
  } catch (error) {
    logger.error("Error deleting quiz:", error);
    return { success: false, error: error.message };
  }
};

// Submit a quiz (student) - with retake handling (overwrite if equal or better)
export const submitQuiz = async (submissionData) => {
  try {
    // Check if user can participate (not disabled/archived/deleted)
    try {
      const participationCheck = canParticipate();
      
      if (submissionData.userId && participationCheck) {
        try {
          // Load user data using userDbService
          const { getUserById: getUserByIdFromDb } = await import('../db/userDbService');
          const userResult = await getUserByIdFromDb(submissionData.userId);
          
          if (userResult.success) {
            const userData = userResult.data;

            // Load user enrollments using enrollmentsDbService
            let enrollments = [];
            try {
              const { getEnrollmentsByUserId } = await import('../db/enrollmentsDbService');
              const enrollmentsResult = await getEnrollmentsByUserId(submissionData.userId);
              
              if (enrollmentsResult.success) {
                enrollments = enrollmentsResult.data.map(d => ({
                  id: d.docId,
                  ...d,
                }));
              }
            } catch (e) {
              logger.warn("Failed to load enrollments for quiz check:", e);
            }

            if (!canParticipate(userData, enrollments)) {
              return {
                success: false,
                error:
                  "You cannot submit quizzes. Your account is disabled, archived, or you have no active enrollments.",
              };
            }
          }
        } catch (error) {
          logger.warn("Failed to check user status for quiz:", error);
          // Continue anyway - don't block if status check fails
        }
      }
    } catch (error) {
      logger.warn("Failed to check user participation:", error);
      // Continue anyway - don't block if status check fails
    }

    // Check for existing submissions if retake is allowed
    const quizResult = await getQuizFromDb(submissionData.quizId);
    const quiz = quizResult.success ? quizResult.data : null;
    const allowRetake =
      quiz?.settings?.allowRetake || quiz?.allowRetake || false;

    if (allowRetake && submissionData.userId) {
      // Find existing submission for this user and quiz using quizSubmissionsDbService
      const { getQuizSubmissions } = await import('../db/quizSubmissionsDbService');
      const existingSubmissionsResult = await getQuizSubmissions({
        quizId: submissionData.quizId,
        userId: submissionData.userId
      });

      if (existingSubmissionsResult.success && existingSubmissionsResult.data.length > 0) {
        // Find the best existing submission
        let bestSubmission = null;
        let bestPercentage = -1;

        existingSubmissionsResult.data.forEach((sub) => {
          const percentage =
            sub.percentage ||
            (sub.maxScore > 0
              ? Math.round((sub.score / sub.maxScore) * 100)
              : 0);
          if (percentage > bestPercentage) {
            bestPercentage = percentage;
            bestSubmission = { docId: sub.docId, ...sub };
          }
        });

        // Compare new score with best existing
        const newPercentage = submissionData.percentage || 0;

        if (newPercentage >= bestPercentage) {
          // New score is equal or better - update the best submission
          if (bestSubmission) {
            const { updateQuizSubmission } = await import('../db/quizSubmissionsDbService');
            await updateQuizSubmission(bestSubmission.docId, {
              ...submissionData,
              isRetake: true,
              previousScore: bestSubmission.score,
              previousPercentage: bestPercentage,
            });
            
            // Log quiz retake activity
            try {
              await ActivityLogger.quizSubmitted(
                submissionData.quizId, 
                quiz?.title || 'Untitled Quiz', 
                submissionData.percentage || 0
              );
            } catch (logError) {
              logger.warn('Failed to log quiz retake activity:', logError);
            }
            
            return {
              success: true,
              id: bestSubmission.docId,
              isRetake: true,
              previousScore: bestSubmission.score,
              previousPercentage: bestPercentage,
              newScore: submissionData.score,
              newPercentage: newPercentage,
            };
          }
        } else {
          // New score is worse - still save as new submission but don't overwrite
          const { createQuizSubmission } = await import('../db/quizSubmissionsDbService');
          const result = await createQuizSubmission({
            ...submissionData,
            isRetake: true,
            bestScore: bestSubmission.score,
            bestPercentage: bestPercentage,
          });
          return {
            success: true,
            id: result.id,
            isRetake: true,
            bestScore: bestSubmission.score,
            bestPercentage: bestPercentage,
            newScore: submissionData.score,
            newPercentage: newPercentage,
            message: `Your new score (${newPercentage}%) is lower than your best (${bestPercentage}%). Your best score is still ${bestPercentage}%.`,
          };
        }
      }
    }

    // No existing submission or retake not allowed - create new submission
    const { createQuizSubmission } = await import('../db/quizSubmissionsDbService');
    const result = await createQuizSubmission(submissionData);
    
    // Log quiz submitted activity (treat as assignment submission as requested)
    try {
      await ActivityLogger.quizSubmitted(
        submissionData.quizId, 
        quiz?.title || 'Untitled Quiz', 
        submissionData.percentage || 0
      );
    } catch (logError) {
      logger.warn('Failed to log quiz submission activity:', logError);
    }
    
    return { success: true, id: result.id };
  } catch (error) {
    logger.error("Error submitting quiz:", error);
    return { success: false, error: error.message };
  }
};

// Get submissions for a quiz
export const getQuizSubmissions = async (quizId) => {
  try {
    const { getQuizSubmissionsByQuiz } = await import('../db/quizSubmissionsDbService');
    const result = await getQuizSubmissionsByQuiz(quizId);

    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    logger.error("Error getting quiz submissions:", error);
    return { success: false, error: error.message };
  }
};

// Get submissions by student
export const getStudentSubmissions = async (userId) => {
  try {
    const { getQuizSubmissionsByUser } = await import('../db/quizSubmissionsDbService');
    const result = await getQuizSubmissionsByUser(userId);

    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    logger.error("Error getting student submissions:", error);
    return { success: false, error: error.message };
  }
};

// Get leaderboard for a quiz
export const getQuizLeaderboard = async (quizId, limit = 10) => {
  try {
    const submissionsRef = collection(db, "quizSubmissions");
    const q = query(
      submissionsRef,
      where("quizId", "==", quizId),
      orderBy("score", "desc"),
      orderBy("completedAt", "asc")
    );
    const querySnapshot = await getDocs(q);

    const leaderboard = [];
    querySnapshot.forEach((doc) => {
      leaderboard.push({ id: doc.id, ...doc.data() });
    });

    // Get unique users (best score per user)
    const uniqueUsers = new Map();
    leaderboard.forEach((submission) => {
      if (
        !uniqueUsers.has(submission.userId) ||
        uniqueUsers.get(submission.userId).score < submission.score
      ) {
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
    logger.error("Error getting quiz leaderboard:", error);
    return { success: false, error: error.message };
  }
};

// Update submission score (manual correction)
export const updateSubmissionScore = async (
  submissionId,
  newScore,
  correctedBy
) => {
  try {
    const submissionRef = doc(db, "quizSubmissions", submissionId);
    await updateDoc(submissionRef, {
      score: newScore,
      manuallyCorrected: true,
      correctedBy,
      correctedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    logger.error("Error updating submission score:", error);
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
    const uniqueStudents = new Set(data.map((s) => s.userId)).size;
    const totalScore = data.reduce((sum, s) => sum + (s.score || 0), 0);
    const avgScore = totalSubmissions > 0 ? totalScore / totalSubmissions : 0;
    const completionRate =
      (data.filter((s) => s.completedAt).length / totalSubmissions) * 100;

    // Question analysis (supports legacy array shape and new object map shape)
    const questionStats = {};
    data.forEach((submission) => {
      const ans = submission.answers;
      if (!ans) return;

      // Legacy: answers is array of { questionId, correct, timeSpent? }
      if (Array.isArray(ans)) {
        ans.forEach((answer) => {
          const qid = answer.questionId;
          if (!qid) return;
          if (!questionStats[qid]) {
            questionStats[qid] = {
              correct: 0,
              incorrect: 0,
              total: 0,
              totalTime: 0,
            };
          }
          questionStats[qid].total++;
          if (answer.correct) {
            questionStats[qid].correct++;
          } else {
            questionStats[qid].incorrect++;
          }
          if (typeof answer.timeSpent === "number") {
            questionStats[qid].totalTime += answer.timeSpent;
          }
        });
      } else if (typeof ans === "object") {
        // New: answers is an object keyed by questionId: { [questionId]: { isCorrect, timeSpent } }
        Object.entries(ans).forEach(([qid, value]) => {
          if (!questionStats[qid]) {
            questionStats[qid] = {
              correct: 0,
              incorrect: 0,
              total: 0,
              totalTime: 0,
            };
          }
          questionStats[qid].total++;
          if (value?.isCorrect) {
            questionStats[qid].correct++;
          } else {
            questionStats[qid].incorrect++;
          }
          if (typeof value?.timeSpent === "number") {
            questionStats[qid].totalTime += value.timeSpent;
          }
        });
      }
    });

    // Compute average time per question
    Object.keys(questionStats).forEach((qid) => {
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
        questionStats,
      },
    };
  } catch (error) {
    logger.error("Error getting quiz analytics:", error);
    return { success: false, error: error.message };
  }
};

// Duplicate quiz to another class/term as a new quiz (no reuse across classes)
export const duplicateQuizToClass = async (
  quizId,
  targetClassId,
  term,
  requestedBy
) => {
  try {
    const srcRef = doc(db, "quizzes", quizId);
    const snap = await getDoc(srcRef);
    if (!snap.exists())
      return { success: false, error: "Source quiz not found" };
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

    const quizzesRef = collection(db, "quizzes");
    const newRef = await addDoc(quizzesRef, payload);
    return { success: true, id: newRef.id };
  } catch (error) {
    logger.error("Error duplicating quiz:", error);
    return { success: false, error: error.message };
  }
};

// Minimal quiz folder helpers
export const createQuizFolder = async (folderData, userId) => {
  try {
    const ref = await addDoc(collection(db, "quizFolders"), {
      name: folderData?.name || "Untitled Folder",
      description: folderData?.description || "",
      ownerId: userId,
      classIds: Array.isArray(folderData?.classIds) ? folderData.classIds : [],
      term: folderData?.term || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true, id: ref.id };
  } catch (error) {
    logger.error("Error creating quiz folder:", error);
    return { success: false, error: error.message };
  }
};

export const listQuizFolders = async () => {
  try {
    const qs = await getDocs(collection(db, "quizFolders"));
    const items = [];
    qs.forEach((d) => items.push({ id: d.id, ...d.data() }));
    return { success: true, data: items };
  } catch (error) {
    logger.error("Error listing quiz folders:", error);
    return { success: false, error: error.message };
  }
};

