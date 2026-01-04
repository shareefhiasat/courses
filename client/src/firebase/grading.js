import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "./config";

/**
 * GPA Grading Rules
 * Based on Arabic academic documents
 */

// Default grading scale for regular courses
export const DEFAULT_GRADING_SCALE = [
  {
    grade: "A",
    description_ar: "ممتاز",
    description_en: "Excellent",
    minScore: 90,
    maxScore: 100,
    points: 4.0,
  },
  {
    grade: "B+",
    description_ar: "جيد جداً مرتفع",
    description_en: "Very Good High",
    minScore: 85,
    maxScore: 89,
    points: 3.5,
  },
  {
    grade: "B",
    description_ar: "جيد جداً",
    description_en: "Very Good",
    minScore: 80,
    maxScore: 84,
    points: 3.0,
  },
  {
    grade: "C+",
    description_ar: "جيد مرتفع",
    description_en: "Good High",
    minScore: 75,
    maxScore: 79,
    points: 2.5,
  },
  {
    grade: "C",
    description_ar: "جيد",
    description_en: "Good",
    minScore: 70,
    maxScore: 74,
    points: 2.0,
  },
  {
    grade: "D+",
    description_ar: "مقبول مرتفع",
    description_en: "Acceptable High",
    minScore: 65,
    maxScore: 69,
    points: 1.5,
  },
  {
    grade: "D",
    description_ar: "مقبول",
    description_en: "Acceptable",
    minScore: 60,
    maxScore: 64,
    points: 1.0,
  },
  {
    grade: "F",
    description_ar: "راسب",
    description_en: "Fail",
    minScore: 0,
    maxScore: 59,
    points: 0.0,
  },
  {
    grade: "WF",
    description_ar: "انسحاب إجباري",
    description_en: "Mandatory Withdrawal",
    minScore: null,
    maxScore: null,
    points: null,
  },
  {
    grade: "FA",
    description_ar:
      "رسوب بسبب تغيبه عن تقديم الاختبار النهائي وعدم تقديم عذر مقبول للغياب",
    description_en:
      "Failure due to absence from final exam without acceptable excuse",
    minScore: null,
    maxScore: null,
    points: null,
  },
  {
    grade: "FB",
    description_ar: "رسوب بسبب تجاوز نسبة الغياب المسموح بها (20%)",
    description_en: "Failure due to exceeding allowed absence rate (20%)",
    minScore: null,
    maxScore: null,
    points: null,
  },
];

// Grading scale for retake courses (no A grade, B+ starts at 85)
export const RETAKE_GRADING_SCALE = [
  {
    grade: "B+",
    description_ar: "جيد جداً مرتفع",
    description_en: "Very Good High",
    minScore: 85,
    maxScore: 100,
    points: 3.5,
  },
  {
    grade: "B",
    description_ar: "جيد جداً",
    description_en: "Very Good",
    minScore: 80,
    maxScore: 84,
    points: 3.0,
  },
  {
    grade: "C+",
    description_ar: "جيد مرتفع",
    description_en: "Good High",
    minScore: 75,
    maxScore: 79,
    points: 2.5,
  },
  {
    grade: "C",
    description_ar: "جيد",
    description_en: "Good",
    minScore: 70,
    maxScore: 74,
    points: 2.0,
  },
  {
    grade: "D+",
    description_ar: "مقبول مرتفع",
    description_en: "Acceptable High",
    minScore: 65,
    maxScore: 69,
    points: 1.5,
  },
  {
    grade: "D",
    description_ar: "مقبول",
    description_en: "Acceptable",
    minScore: 60,
    maxScore: 64,
    points: 1.0,
  },
  {
    grade: "F",
    description_ar: "راسب",
    description_en: "Fail",
    minScore: 0,
    maxScore: 59,
    points: 0.0,
  },
  {
    grade: "WF",
    description_ar: "انسحاب إجباري",
    description_en: "Mandatory Withdrawal",
    minScore: null,
    maxScore: null,
    points: null,
  },
  {
    grade: "FA",
    description_ar:
      "رسوب بسبب تغيبه عن تقديم الاختبار النهائي وعدم تقديم عذر مقبول للغياب",
    description_en:
      "Failure due to absence from final exam without acceptable excuse",
    minScore: null,
    maxScore: null,
    points: null,
  },
  {
    grade: "FB",
    description_ar: "رسوب بسبب تجاوز نسبة الغياب المسموح بها (20%)",
    description_en: "Failure due to exceeding allowed absence rate (20%)",
    minScore: null,
    maxScore: null,
    points: null,
  },
];

/**
 * Calculate GPA from score
 */
export const calculateGPA = (score, isRetake = false) => {
  if (score === null || score === undefined) return null;

  const scale = isRetake ? RETAKE_GRADING_SCALE : DEFAULT_GRADING_SCALE;

  for (const rule of scale) {
    if (rule.minScore !== null && rule.maxScore !== null) {
      if (score >= rule.minScore && score <= rule.maxScore) {
        return {
          grade: rule.grade,
          points: rule.points,
          description_ar: rule.description_ar,
          description_en: rule.description_en,
        };
      }
    }
  }

  // Default to F if no match
  return {
    grade: "F",
    points: 0.0,
    description_ar: "راسب",
    description_en: "Fail",
  };
};

/**
 * Get grade description
 */
export const getGradeDescription = (grade, lang = "en") => {
  const scale = [...DEFAULT_GRADING_SCALE, ...RETAKE_GRADING_SCALE];
  const rule = scale.find((r) => r.grade === grade);
  if (rule) {
    return lang === "ar" ? rule.description_ar : rule.description_en;
  }
  return grade;
};

/**
 * Program GPA Rules
 * Each program can have custom grading rules
 */
export const getProgramGradingRules = async (programId) => {
  try {
    const docRef = doc(db, "programGradingRules", programId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: true, data: { docId: docSnap.id, ...docSnap.data() } };
    }
    // Return default if not found
    return {
      success: true,
      data: {
        programId,
        gradingScale: DEFAULT_GRADING_SCALE,
        retakeGradingScale: RETAKE_GRADING_SCALE,
        useDefault: true,
      },
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const setProgramGradingRules = async (programId, rules) => {
  try {
    const docRef = doc(db, "programGradingRules", programId);
    await setDoc(
      docRef,
      {
        ...rules,
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Subject Marks Distribution
 * Define how marks are distributed across different components
 */
export const getSubjectMarksDistribution = async (subjectId) => {
  try {
    const docRef = doc(db, "subjectMarksDistribution", subjectId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: true, data: { docId: docSnap.id, ...docSnap.data() } };
    }
    // Return default distribution
    return {
      success: true,
      data: {
        subjectId,
        midTermExam: 20,
        finalExam: 40,
        homework: 5,
        labsProjectResearch: 10,
        quizzes: 5,
        participation: 10,
        attendance: 10,
        total: 100,
      },
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const setSubjectMarksDistribution = async (subjectId, distribution) => {
  try {
    // Validate total is 100
    const total = Object.values(distribution).reduce((sum, val) => {
      if (typeof val === "number") return sum + val;
      return sum;
    }, 0);

    if (Math.abs(total - 100) > 0.01) {
      return { success: false, error: "Marks distribution must total 100%" };
    }

    const docRef = doc(db, "subjectMarksDistribution", subjectId);
    await setDoc(
      docRef,
      {
        ...distribution,
        total: 100,
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Student Marks
 * Store marks for each student in each subject
 * Option 2: Marks stored as subcollection of enrollments
 * Structure: enrollments/{enrollmentId}/marks/{markId}
 */
export const getStudentMarks = async (
  studentId,
  subjectId = null,
  classId = null,
  semester = null,
  academicYear = null
) => {
  try {
    // If we have studentId and classId, get marks from enrollment document
    if (studentId && classId) {
      const enrollmentId = `${studentId}_${classId}`;
      const enrollmentRef = doc(db, "enrollments", enrollmentId);
      const enrollmentSnap = await getDoc(enrollmentRef);

      if (!enrollmentSnap.exists()) {
        return { success: true, data: [] };
      }

      const enrollmentData = enrollmentSnap.data();
      const marksData = enrollmentData.marks || {};

      // Transform marks object to array format for backward compatibility
      const items = Object.entries(marksData)
        .map(([subjId, markData]) => {
          // Filter by subjectId if provided
          if (subjectId && subjId !== subjectId) {
            return null;
          }
          // Filter by semester if provided
          if (semester && markData.semester !== semester) {
            return null;
          }
          // Filter by academicYear if provided
          if (academicYear && markData.academicYear !== academicYear) {
            return null;
          }

          return {
            docId: enrollmentId,
            studentId: studentId,
            subjectId: markData.subjectId || subjId,
            semester: markData.semester || null,
            academicYear: markData.academicYear || null,
            marks: markData.marks || {},
            totalScore: markData.totalScore || 0,
            grade: markData.grade || "",
            points: markData.points || 0,
            isRetake: markData.isRetake || false,
            instructorId: markData.instructorId || null,
            createdAt: markData.createdAt || null,
            updatedAt: markData.updatedAt || null,
          };
        })
        .filter(Boolean);

      // Sort by updatedAt descending
      items.sort((a, b) => {
        const aTime = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0;
        const bTime = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0;
        return bTime - aTime;
      });

      return { success: true, data: items };
    }

    // Fallback: query old studentMarks collection for backward compatibility
    let q = query(collection(db, "studentMarks"));
    const conditions = [];

    if (studentId) {
      conditions.push(where("studentId", "==", studentId));
    }
    if (subjectId) {
      conditions.push(where("subjectId", "==", subjectId));
    }
    if (semester) {
      conditions.push(where("semester", "==", semester));
    }
    if (academicYear) {
      conditions.push(where("academicYear", "==", academicYear));
    }

    if (conditions.length > 0) {
      q = query(
        collection(db, "studentMarks"),
        ...conditions,
        orderBy("updatedAt", "desc")
      );
    } else {
      q = query(collection(db, "studentMarks"), orderBy("updatedAt", "desc"));
    }

    const qs = await getDocs(q);
    const items = [];
    qs.forEach((d) => items.push({ docId: d.id, ...d.data() }));
    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const saveStudentMarks = async (marksData) => {
  try {
    const {
      studentId,
      subjectId,
      classId,
      semester,
      academicYear,
      marks,
      instructorId,
      sendEmailNotification = false,
      sendInAppNotification = false,
    } = marksData;

    // Validate required fields
    if (!studentId) {
      return { success: false, error: "studentId is required" };
    }
    if (!subjectId) {
      return { success: false, error: "subjectId is required" };
    }
    if (!classId) {
      return { success: false, error: "classId is required" };
    }

    // Calculate total score based on distribution
    const distResult = await getSubjectMarksDistribution(subjectId);
    if (!distResult.success) {
      return { success: false, error: "Failed to get marks distribution" };
    }

    const distribution = distResult.data.distribution || distResult.data;
    const dist = distribution.distribution || distribution;
    const totalScore =
      (marks.midTermExam || 0) *
        ((dist.midTermExam || distribution.midTermExam || 0) / 100) +
      (marks.finalExam || 0) *
        ((dist.finalExam || distribution.finalExam || 0) / 100) +
      (marks.homework || 0) *
        ((dist.homework || distribution.homework || 0) / 100) +
      (marks.labsProjectResearch || 0) *
        ((dist.labsProjectResearch || distribution.labsProjectResearch || 0) /
          100) +
      (marks.quizzes || 0) *
        ((dist.quizzes || distribution.quizzes || 0) / 100) +
      (marks.participation || 0) *
        ((dist.participation || distribution.participation || 0) / 100) +
      (marks.attendance || 0) *
        ((dist.attendance || distribution.attendance || 0) / 100);

    // Get or create enrollment
    const enrollmentId = `${studentId}_${classId}`;
    const enrollmentRef = doc(db, "enrollments", enrollmentId);
    const enrollmentSnap = await getDoc(enrollmentRef);

    let enrollmentData = {};
    let isUpdate = false;

    if (enrollmentSnap.exists()) {
      enrollmentData = enrollmentSnap.data();
      isUpdate = true;
    } else {
      // Create enrollment if it doesn't exist
      enrollmentData = {
        userId: studentId,
        classId: classId,
        role: "student",
        createdAt: Timestamp.now(),
      };
    }

    // Check if enrollment is retake
    const isRetake = enrollmentData.isRetake || false;

    // Calculate GPA
    const gpaResult = calculateGPA(totalScore, isRetake);

    // Prepare marks object to store in enrollment document
    const marksObject = {
      [subjectId]: {
        subjectId,
        semester: semester || null,
        academicYear: academicYear || null,
        marks: {
          midTermExam: marks.midTermExam || 0,
          finalExam: marks.finalExam || 0,
          homework: marks.homework || 0,
          labsProjectResearch: marks.labsProjectResearch || 0,
          quizzes: marks.quizzes || 0,
          participation: marks.participation || 0,
          attendance: marks.attendance || 0,
        },
        totalScore: Math.round(totalScore * 100) / 100,
        grade: gpaResult.grade,
        points: gpaResult.points,
        isRetake,
        instructorId: instructorId || null,
        updatedAt: Timestamp.now(),
        createdAt: isUpdate
          ? enrollmentData.marks?.[subjectId]?.createdAt || Timestamp.now()
          : Timestamp.now(),
      },
    };

    // Update enrollment document with marks
    await updateDoc(enrollmentRef, {
      ...enrollmentData,
      marks: {
        ...(enrollmentData.marks || {}),
        ...marksObject,
      },
      updatedAt: Timestamp.now(),
    });

    // Prepare marks record for notifications
    const marksRecord = {
      id: enrollmentId,
      studentId,
      subjectId,
      classId,
      semester: semester || null,
      academicYear: academicYear || null,
      marks: marksObject[subjectId].marks,
      totalScore: marksObject[subjectId].totalScore,
      grade: marksObject[subjectId].grade,
      points: marksObject[subjectId].points,
      isRetake,
      instructorId: instructorId || null,
    };

    // Send notifications if requested
    if (sendInAppNotification || sendEmailNotification) {
      await sendMarksNotifications({
        studentId,
        subjectId,
        marksRecord,
        isUpdate,
        sendEmail: sendEmailNotification,
        sendInApp: sendInAppNotification,
      });
    }

    return { success: true, id: enrollmentId, isUpdate };
  } catch (error) {
    console.error("Error saving student marks:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Send notifications for marks entry
 */
const sendMarksNotifications = async ({
  studentId,
  subjectId,
  marksRecord,
  isUpdate,
  sendEmail,
  sendInApp,
}) => {
  try {
    // Get student and subject data
    const { getDoc } = await import("firebase/firestore");
    const { doc } = await import("firebase/firestore");
    const { db } = await import("./config");
    const { addNotification } = await import("./notifications");
    const { sendEmail: sendEmailFunc } = await import("./firestore");

    const [studentDoc, subjectDoc] = await Promise.all([
      getDoc(doc(db, "users", studentId)),
      getDoc(doc(db, "subjects", subjectId)),
    ]);

    if (!studentDoc.exists() || !subjectDoc.exists()) {
      console.warn("Student or subject not found for notifications");
      return;
    }

    const student = studentDoc.data();
    const subject = subjectDoc.data();

    const notificationTitle = isUpdate ? "Marks Updated" : "Marks Entered";
    const notificationMessage = `Your marks for ${
      subject.name_en || subject.code
    } have been ${isUpdate ? "updated" : "entered"}. Grade: ${
      marksRecord.grade
    } (${marksRecord.totalScore.toFixed(2)}%)`;

    // In-app notification
    if (sendInApp) {
      await addNotification({
        userId: studentId,
        title: notificationTitle,
        message: notificationMessage,
        type: "marks",
        metadata: {
          subjectId,
          subjectCode: subject.code,
          subjectName: subject.name_en,
          totalScore: marksRecord.totalScore,
          grade: marksRecord.grade,
          points: marksRecord.points,
          isUpdate,
        },
        data: { subjectId, markId: marksRecord.id },
      });
    }

    // Email notification
    if (sendEmail && student.email) {
      await sendEmailFunc({
        to: student.email,
        template: isUpdate ? "marksUpdated" : "marksEntered",
        type: "marks",
        data: {
          studentName: student.displayName || student.email,
          subjectCode: subject.code,
          subjectName: subject.name_en || subject.name_ar,
          totalScore: marksRecord.totalScore.toFixed(2),
          grade: marksRecord.grade,
          points: marksRecord.points,
          midTerm: marksRecord.marks.midTermExam,
          final: marksRecord.marks.finalExam,
          homework: marksRecord.marks.homework,
          labs: marksRecord.marks.labsProjectResearch,
          quizzes: marksRecord.marks.quizzes,
          participation: marksRecord.marks.participation,
          attendance: marksRecord.marks.attendance,
          isRetake: marksRecord.isRetake,
          isUpdate,
        },
        metadata: {
          subjectId,
          studentId,
          markId: marksRecord.id,
        },
      });
    }
  } catch (error) {
    console.error("Error sending marks notifications:", error);
  }
};
