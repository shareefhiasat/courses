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
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./config";

/**
 * Penalties Collection
 * Track academic penalties for students
 * Based on Arabic academic regulations
 */

export const getPenalties = async (studentId = null, subjectId = null) => {
  try {
    let q;
    if (studentId && subjectId) {
      q = query(
        collection(db, "penalties"),
        where("studentId", "==", studentId),
        where("subjectId", "==", subjectId),
        orderBy("createdAt", "desc")
      );
    } else if (studentId) {
      q = query(
        collection(db, "penalties"),
        where("studentId", "==", studentId),
        orderBy("createdAt", "desc")
      );
    } else if (subjectId) {
      q = query(
        collection(db, "penalties"),
        where("subjectId", "==", subjectId),
        orderBy("createdAt", "desc")
      );
    } else {
      q = query(collection(db, "penalties"), orderBy("createdAt", "desc"));
    }
    const qs = await getDocs(q);
    const items = [];
    qs.forEach((d) => items.push({ docId: d.id, ...d.data() }));
    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const createPenalty = async (penaltyData) => {
  try {
    const {
      sendEmailNotification = false,
      sendInAppNotification = false,
      ...penaltyFields
    } = penaltyData;

    const penalty = {
      ...penaltyFields,
      createdAt: serverTimestamp(), // UTC in Firestore, displayed in Qatar timezone
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, "penalties"), penalty);

    // Send notifications if requested
    if (sendInAppNotification || sendEmailNotification) {
      await sendPenaltyNotifications({
        penaltyId: docRef.id,
        penalty,
        sendEmail: sendEmailNotification,
        sendInApp: sendInAppNotification,
      });
    }

    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Send notifications for penalty
 */
const sendPenaltyNotifications = async ({
  penaltyId,
  penalty,
  sendEmail,
  sendInApp,
}) => {
  try {
    const { getDoc } = await import("firebase/firestore");
    const { doc } = await import("firebase/firestore");
    const { db } = await import("./config");
    const { addNotification } = await import("./notifications");
    const { sendEmail: sendEmailFunc } = await import("./firestore");

    const studentDoc = await getDoc(doc(db, "users", penalty.studentId));
    if (!studentDoc.exists()) {
      console.warn("Student not found for penalty notification");
      return;
    }

    const student = studentDoc.data();
    const penaltyType = PENALTY_TYPES.find((pt) => pt.id === penalty.type) || {
      label_en: penalty.type,
      label_ar: penalty.type,
    };

    let subjectName = "";
    if (penalty.subjectId) {
      const subjectDoc = await getDoc(doc(db, "subjects", penalty.subjectId));
      if (subjectDoc.exists()) {
        const subject = subjectDoc.data();
        subjectName = subject.name_en || subject.code || "";
      }
    }

    const notificationTitle = "Academic Penalty Recorded";
    const notificationMessage = `A penalty has been recorded: ${
      penaltyType.label_en
    }${subjectName ? ` for ${subjectName}` : ""}`;

    // In-app notification
    if (sendInApp) {
      await addNotification({
        userId: penalty.studentId,
        title: notificationTitle,
        message: notificationMessage,
        type: "penalty",
        metadata: {
          penaltyId,
          penaltyType: penalty.type,
          subjectId: penalty.subjectId || null,
          severity: penalty.severity || "minor",
          description: penalty.description || "",
        },
        data: { penaltyId, subjectId: penalty.subjectId },
      });
    }

    // Email notification
    if (sendEmail && student.email) {
      await sendEmailFunc({
        to: student.email,
        template: "penaltyRecorded",
        type: "penalty",
        data: {
          studentName: student.displayName || student.email,
          penaltyType: penaltyType.label_en,
          penaltyTypeAr: penaltyType.label_ar,
          subjectName: subjectName || "General",
          description: penalty.description || "",
          severity: penalty.severity || "minor",
          action: penalty.action || "",
          date: new Date().toLocaleDateString(),
        },
        metadata: {
          penaltyId,
          studentId: penalty.studentId,
          subjectId: penalty.subjectId,
        },
      });
    }
  } catch (error) {
    console.error("Error sending penalty notifications:", error);
  }
};

export const updatePenalty = async (penaltyId, data) => {
  try {
    const docRef = doc(db, "penalties", penaltyId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deletePenalty = async (penaltyId) => {
  try {
    await deleteDoc(doc(db, "penalties", penaltyId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Penalty Types based on Arabic regulations:
 * 1. Cheating (with material evidence)
 * 2. Attempting to cheat or assisting in cheating
 * 3. Impersonation
 * 4. Disrupting exam system
 * 5. Forgery in school documents
 * 6. Other violations disrupting public order
 */
export const PENALTY_TYPES = [
  { 
    id: "cheating", 
    label_ar: "الغش", 
    label_en: "Cheating",
    points: 10,
    description_ar: "الغش في الاختبارات أو الواجبات باستخدام مواد غير مسموح بها",
    description_en: "Using unauthorized materials or methods during exams or assignments"
  },
  {
    id: "attempted_cheating",
    label_ar: "محاولة الغش أو مساعدة في الغش",
    label_en: "Attempted Cheating or Assisting in Cheating",
    points: 5,
    description_ar: "محاولة الغش أو مساعدة الآخرين على الغش في الاختبارات",
    description_en: "Attempting to cheat or assisting others in cheating during exams"
  },
  { 
    id: "impersonation", 
    label_ar: "الانتحال", 
    label_en: "Impersonation",
    points: 15,
    description_ar: "انتحال شخصية طالب آخر أو السماح لشخص آخر بانتحال شخصيتك",
    description_en: "Pretending to be another student or allowing someone to take your place"
  },
  {
    id: "exam_disruption",
    label_ar: "تعطيل نظام الاختبار",
    label_en: "Exam System Disruption",
    points: 8,
    description_ar: "إثارة الفوضى أو تعطيل سير الاختبار بشكل متعمد",
    description_en: "Causing disruption or intentionally interfering with exam proceedings"
  },
  {
    id: "forgery",
    label_ar: "التزوير في وثائق المدرسة",
    label_en: "Forgery in School Documents",
    points: 20,
    description_ar: "تزوير التوقيعات أو الوثائق المدرسية الرسمية",
    description_en: "Forging signatures or official school documents"
  },
  {
    id: "repetitive_absence_with_excuse",
    label_ar: "غياب متكرر بعذر",
    label_en: "Repetitive Absence (With Excuse)",
    points: 2,
    description_ar: "التغيب المتكرر عن الحصص مع تقديم أعذار",
    description_en: "Frequent absences from classes with excuses"
  },
  {
    id: "repetitive_absence_without_excuse",
    label_ar: "غياب متكرر بدون عذر",
    label_en: "Repetitive Absence (Without Excuse)",
    points: 5,
    description_ar: "التغيب المتكرر عن الحصص بدون تقديم أعذار مقبولة",
    description_en: "Frequent absences from classes without valid excuses"
  },
  {
    id: "absent_no_excuse",
    label_ar: "غياب بدون عذر",
    label_en: "Absent (No Excuse)",
    points: 3,
    description_ar: "الغياب بدون تقديم عذر مقبول",
    description_en: "Absence without providing an acceptable excuse"
  },
  {
    id: "absent_with_excuse",
    label_ar: "غياب بعذر",
    label_en: "Absent (With Excuse)",
    points: 1,
    description_ar: "الغياب مع تقديم عذر رسمي مقبول",
    description_en: "Absence with an accepted official excuse"
  },
  { 
    id: "late", 
    label_ar: "تأخر", 
    label_en: "Late",
    points: 1,
    description_ar: "التأخر عن الحصة بدون عذر مقبول",
    description_en: "Arriving late to class without an acceptable excuse"
  },
  {
    id: "other",
    label_ar: "مخالفات أخرى تعطل النظام العام",
    label_en: "Other Violations Disrupting Public Order",
    points: 5,
    description_ar: "أي مخالفات أخرى تؤثر على النظام العام للمدرسة",
    description_en: "Any other violations that disrupt the school's public order"
  },
];

/**
 * Absences Tracking
 * Track student absences with types and penalties
 */
export const getAbsences = async (
  studentId = null,
  subjectId = null,
  semester = null
) => {
  try {
    let q;
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

    if (conditions.length > 0) {
      q = query(
        collection(db, "absences"),
        ...conditions,
        orderBy("date", "desc")
      );
    } else {
      q = query(collection(db, "absences"), orderBy("date", "desc"));
    }

    const qs = await getDocs(q);
    const items = [];
    qs.forEach((d) => items.push({ docId: d.id, ...d.data() }));
    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const recordAbsence = async (absenceData) => {
  try {
    const absence = {
      ...absenceData,
      createdAt: serverTimestamp(), // UTC in Firestore, displayed in Qatar timezone
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, "absences"), absence);
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateAbsence = async (absenceId, data) => {
  try {
    const docRef = doc(db, "absences", absenceId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteAbsence = async (absenceId) => {
  try {
    await deleteDoc(doc(db, "absences", absenceId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Absence Types based on Arabic regulations:
 * - With excuse (official document): -0.25 points per session
 * - Without excuse: -0.50 points per session
 * - Bereavement (death of close relative): No deduction, 3 days leave
 * - Exceeding 20%: Automatic failure (FB grade)
 */
export const ABSENCE_TYPES = [
  {
    id: "with_excuse",
    label_ar: "بعذر رسمي",
    label_en: "With Official Excuse",
    deduction: 0.25,
  },
  {
    id: "without_excuse",
    label_ar: "بدون عذر",
    label_en: "Without Excuse",
    deduction: 0.5,
  },
  {
    id: "bereavement",
    label_ar: "وفاة قريب",
    label_en: "Bereavement",
    deduction: 0,
  },
  {
    id: "beyond_control",
    label_ar: "أسباب خارجة عن السيطرة",
    label_en: "Beyond Control (accident, weather, hospitalization)",
    deduction: 0.25,
  },
];

/**
 * Calculate absence percentage and penalties
 */
export const calculateAbsenceStats = (absences, totalSessions) => {
  if (!totalSessions || totalSessions === 0) {
    return {
      totalAbsences: 0,
      withExcuse: 0,
      withoutExcuse: 0,
      percentage: 0,
      attendanceDeduction: 0,
      exceedsLimit: false,
      willFail: false,
    };
  }

  const withExcuse = absences.filter(
    (a) => a.type === "with_excuse" || a.type === "beyond_control"
  ).length;
  const withoutExcuse = absences.filter(
    (a) => a.type === "without_excuse"
  ).length;
  const totalAbsences = absences.length;
  const percentage = (totalAbsences / totalSessions) * 100;

  // Calculate attendance deduction
  const attendanceDeduction = withExcuse * 0.25 + withoutExcuse * 0.5;

  const exceedsLimit = percentage > 20;
  const willFail = exceedsLimit;

  return {
    totalAbsences,
    withExcuse,
    withoutExcuse,
    percentage: Math.round(percentage * 100) / 100,
    attendanceDeduction: Math.round(attendanceDeduction * 100) / 100,
    exceedsLimit,
    willFail,
  };
};
