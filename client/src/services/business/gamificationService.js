import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp,
  setDoc
} from 'firebase/firestore';
import { db } from '../other/config';
import { getStudentRank } from '@constants/sharedConfig';

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
        // Get current rank before awarding
        const studentRef = doc(db, "users", studentId);
        const studentSnap = await getDoc(studentRef);
        const currentPoints = studentSnap.exists()
          ? studentSnap.data().totalPoints || 0
          : 0;
        const oldRank = getStudentRank(currentPoints);

        // Add point record
        await addDoc(collection(db, "points"), {
          studentId,
          classId,
          awardedBy,
          points: Number(points),
          category,
          reason: reason || "",
          activityId: activityId || null,
          timestamp: Timestamp.now(),
        });

        // Update student's total points
        const newPoints = currentPoints + Number(points);
        if (studentSnap.exists()) {
          await updateDoc(studentRef, {
            totalPoints: newPoints,
            lastPointsUpdate: Timestamp.now(),
          });
        }

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
    console.error("Error awarding points:", error);
    return { success: false, error: error.message };
  }
};

// Get points for a student
export const getStudentPoints = async (studentId) => {
  try {
    const q = query(
      collection(db, "points"),
      where("studentId", "==", studentId),
      orderBy("timestamp", "desc")
    );
    const qs = await getDocs(q);
    const points = [];
    qs.forEach((d) => points.push({ id: d.id, ...d.data() }));
    return { success: true, data: points };
  } catch (error) {
    console.error("Error getting student points:", error);
    return { success: false, error: error.message };
  }
};

// Get all points for a class
export const getClassPoints = async (classId) => {
  try {
    const q = query(
      collection(db, "points"),
      where("classId", "==", classId),
      orderBy("timestamp", "desc")
    );
    const qs = await getDocs(q);
    const points = [];
    qs.forEach((d) => points.push({ id: d.id, ...d.data() }));
    return { success: true, data: points };
  } catch (error) {
    console.error("Error getting class points:", error);
    return { success: false, error: error.message };
  }
};

// Get leaderboard for a class
export const getClassLeaderboard = async (classId) => {
  try {
    // Get all enrollments for the class
    const enrollmentsQuery = query(
      collection(db, "enrollments"),
      where("classId", "==", classId)
    );
    const enrollmentsSnapshot = await getDocs(enrollmentsQuery);

    const leaderboard = [];
    for (const enrollmentDoc of enrollmentsSnapshot.docs) {
      const enrollment = enrollmentDoc.data();
      
      // Get user data with total points
      const userDoc = await getDoc(doc(db, "users", enrollment.userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const totalPoints = userData.totalPoints || 0;
        const rank = getStudentRank(totalPoints);
        
        leaderboard.push({
          userId: enrollment.userId,
          displayName: userData.displayName || userData.email,
          email: userData.email,
          totalPoints,
          rank: rank.current,
          lastPointsUpdate: userData.lastPointsUpdate?.toDate()
        });
      }
    }

    // Sort by total points descending
    leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);
    
    return { success: true, data: leaderboard };
  } catch (error) {
    console.error("Error getting class leaderboard:", error);
    return { success: false, error: error.message };
  }
};

// Create or update skill
export const saveSkill = async (skillData) => {
  try {
    const { docId, ...data } = skillData;
    if (docId) {
      await updateDoc(doc(db, "skills", docId), {
        ...data,
        updatedAt: Timestamp.now()
      });
    } else {
      await addDoc(collection(db, "skills"), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    }
    return { success: true };
  } catch (error) {
    console.error("Error saving skill:", error);
    return { success: false, error: error.message };
  }
};

// Get skills for a class
export const getClassSkills = async (classId) => {
  try {
    const q = query(collection(db, "skills"), where("classId", "==", classId));
    const qs = await getDocs(q);
    const skills = [];
    qs.forEach((d) => skills.push({ id: d.id, ...d.data() }));
    return { success: true, data: skills };
  } catch (error) {
    console.error("Error getting class skills:", error);
    return { success: false, error: error.message };
  }
};

// Delete skill
export const deleteSkill = async (skillId) => {
  try {
    await deleteDoc(doc(db, "skills", skillId));
    return { success: true };
  } catch (error) {
    console.error("Error deleting skill:", error);
    return { success: false, error: error.message };
  }
};
