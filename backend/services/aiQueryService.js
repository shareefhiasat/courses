/**
 * AI Query Engine Service
 *
 * Coordinates parsing, permission/scope validation, tool execution,
 * and bilingual answer templating.
 */

import { processWithLLM } from '../ai/llmEngine.js';
import { parseQuery, extractDateRange } from '../ai/parser.js';
import { checkToolAccess } from '../ai/permissions.js';
import { getTool } from '../ai/tools/index.js';
import { isCacheAvailable } from '../ai/cache.js';
import { getCachedAnswerData, setCachedAnswerData } from '../ai/dataCache.js';
import {
  getQuestionById,
  isQuestionAllowed,
} from '../ai/questionsCatalog.js';

const AI_LLM_PRIMARY = process.env.AI_LLM_PRIMARY !== 'false';  // default to smart LLM-first
const AI_LLM_FALLBACK = process.env.AI_LLM_FALLBACK === 'true'; // legacy fallback when parser is unknown
const AI_LLM_ONLY = process.env.AI_LLM_ONLY === 'true';         // no regex fallback at all

/**
 * Detect simple greetings / small talk so the assistant replies warmly
 * instead of falling through to the "unknown" parser.
 */
function detectGreeting(message = '') {
  const trimmed = message.trim().toLowerCase();
  const greetingPatterns = [
    /^hi+$/, /^hey+$/, /^hello+$/, /^howdy$/, /^greetings$/,
    /^good (morning|afternoon|evening|night)$/,
    /^assalamu alaikum$/, /^salam$/, /^marhaba$/, /^marhaban$/,
    /^merhaba$/, /^selam$/,
    /^مرحبا$/, /^مرحباً$/, /^السلام عليكم$/, /^سلام$/, /^صباح الخير$/, /^مساء الخير$/,
    /^أهلا$/, /^أهلاً$/, /^هلا$/, /^هاي$/, /^هلو$/,
  ];
  return greetingPatterns.some((pattern) => pattern.test(trimmed));
}

/**
 * Format raw tool output into clear, structured Arabic or English text.
 */
export function formatAnswer(toolName, resultData, lang = 'ar', params = {}) {
  const isAr = lang === 'ar';
  if (!resultData) {
    return isAr
      ? 'لم يتم العثور على بيانات تطابق استفسارك ضمن الصلاحيات الممنوحة لك.'
      : 'No data matching your query was found within your permitted scope.';
  }

  const { target, targetAr, dateRange } = resultData;
  const targetLabel = isAr ? (targetAr || target) : target;
  const dateLabel = isAr ? dateRange?.labelAr : dateRange?.labelEn;
  const scopePrefix = targetLabel ? `[${targetLabel}${dateLabel ? ` - ${dateLabel}` : ''}]` : '';

  switch (toolName) {
    case 'attendanceSummary': {
      const { counts, attendanceRate } = resultData;
      if (isAr) {
        return `${scopePrefix}\nإحصائيات الحضور والغياب:\n• إجمالي السجلات: ${counts.total}\n• عدد الحاضرين: ${counts.present} (${attendanceRate}%)\n• عدد الغياب: ${counts.absent}\n• الإجازات والأعذار: ${counts.excused}\n• الحالات الإنسانية: ${counts.humanCase}`;
      }
      return `${scopePrefix}\nAttendance Summary:\n• Total Records: ${counts.total}\n• Present: ${counts.present} (${attendanceRate}%)\n• Absences: ${counts.absent}\n• Excused / Leaves: ${counts.excused}\n• Human Cases: ${counts.humanCase}`;
    }

    case 'absenceWarningCounts': {
      const { firstWarningCount, finalWarningCount, firstWarningStudents, finalWarningStudents } = resultData;
      if (isAr) {
        let msg = `${scopePrefix}\nإحصائيات إنذارات الغياب:\n• إنذار أول (4 غيابات فأكثر): ${firstWarningCount} طالب\n• إنذار نهائي (9 غيابات فأكثر): ${finalWarningCount} طالب`;
        if (finalWarningStudents && finalWarningStudents.length > 0) {
          msg += '\n\nأمثلة على الطلاب المستحقين للإنذار النهائي:';
          finalWarningStudents.forEach((s) => {
            msg += `\n- ${s.nameAr || s.name} (${s.militaryNumber || 'بدون رقم عسكري'}) - ${s.absences} غياب`;
          });
        }
        return msg;
      }
      let msg = `${scopePrefix}\nAbsence Warning Counts:\n• First Warning (4+ absences): ${firstWarningCount} student(s)\n• Final Warning (9+ absences): ${finalWarningCount} student(s)`;
      if (finalWarningStudents && finalWarningStudents.length > 0) {
        msg += '\n\nSample students eligible for Final Warning:';
        finalWarningStudents.forEach((s) => {
          msg += `\n- ${s.name || s.nameAr} (${s.militaryNumber || 'No ID'}) - ${s.absences} absences`;
        });
      }
      return msg;
    }

    case 'lateCount': {
      const { lateCount, sampleRecords } = resultData;
      if (isAr) {
        let msg = `${scopePrefix}\nسجلات التأخير (خاص بالإدارة):\n• إجمالي حالات التأخير: ${lateCount}`;
        if (sampleRecords && sampleRecords.length > 0) {
          msg += '\n\nأحدث حالات التأخير المسجلة:';
          sampleRecords.forEach((r) => {
            msg += `\n- ${r.studentNameAr || r.studentName} | ${r.className} | ${r.date}`;
          });
        }
        return msg;
      }
      let msg = `${scopePrefix}\nLate Attendance Summary (Admin only):\n• Total Late Records: ${lateCount}`;
      if (sampleRecords && sampleRecords.length > 0) {
        msg += '\n\nRecent Late Records:';
        sampleRecords.forEach((r) => {
          msg += `\n- ${r.studentName || r.studentNameAr} | ${r.className} | ${r.date}`;
        });
      }
      return msg;
    }

    case 'humanCaseCount': {
      const { humanCaseCount, sampleRecords } = resultData;
      if (isAr) {
        let msg = `${scopePrefix}\nالحالات الإنسانية:\n• إجمالي الحالات: ${humanCaseCount}`;
        if (sampleRecords && sampleRecords.length > 0) {
          msg += '\n\nالسجلات المسجلة:';
          sampleRecords.forEach((r) => {
            const name = r.studentNameAr || r.studentName || 'غير معروف';
            const cls = r.classNameAr || r.className || '-';
            msg += `\n- ${name} (${cls}) - ${r.date}${r.notes ? ` [ملاحظة: ${r.notes}]` : ''}`;
          });
        }
        return msg;
      }
      let msg = `${scopePrefix}\nHuman Cases Summary:\n• Total Human Cases: ${humanCaseCount}`;
      if (sampleRecords && sampleRecords.length > 0) {
        msg += '\n\nRecent Records:';
        sampleRecords.forEach((r) => {
          const name = r.studentName || r.studentNameAr || 'Unknown';
          const cls = r.className || r.classNameAr || '-';
          msg += `\n- ${name} (${cls}) - ${r.date}${r.notes ? ` [Note: ${r.notes}]` : ''}`;
        });
      }
      return msg;
    }

    case 'studentCount': {
      const { uniqueStudents, totalEnrollments, classBreakdown } = resultData;
      if (isAr) {
        let msg = `${scopePrefix}\nأعداد الطلاب والدارسين المصرح بها:\n• إجمالي الطلاب (الفريدين): ${uniqueStudents}\n• إجمالي التسجيلات بالفصول: ${totalEnrollments}`;
        const entries = Object.entries(classBreakdown || {});
        if (entries.length > 0) {
          msg += '\n\nتوزيع الطلاب حسب الفصول:';
          entries.slice(0, 6).forEach(([cName, count]) => {
            msg += `\n• ${cName}: ${count} طالب`;
          });
        }
        return msg;
      }
      let msg = `${scopePrefix}\nStudent Counts (Permitted Scope):\n• Unique Students: ${uniqueStudents}\n• Total Class Enrollments: ${totalEnrollments}`;
      const entries = Object.entries(classBreakdown || {});
      if (entries.length > 0) {
        msg += '\n\nBreakdown by Class:';
        entries.slice(0, 6).forEach(([cName, count]) => {
          msg += `\n• ${cName}: ${count} students`;
        });
      }
      return msg;
    }

    case 'marksSummary': {
      const { totalRecords, average, passed, failed } = resultData;
      if (isAr) {
        return `${scopePrefix}\nملخص الدرجات والعلامات:\n• إجمالي السجلات: ${totalRecords}\n• متوسط الدرجات: ${average}%\n• عدد الناجحين: ${passed}\n• عدد الراسبين: ${failed}`;
      }
      return `${scopePrefix}\nMarks Summary:\n• Total Records: ${totalRecords}\n• Average Score: ${average}%\n• Passed: ${passed}\n• Failed: ${failed}`;
    }

    case 'scheduleSummary': {
      const { sessionCount, sessions } = resultData;
      if (isAr) {
        let msg = `${scopePrefix}\nجدول المحاضرات والحصص:\n• إجمالي الحصص المجدولة: ${sessionCount}`;
        if (sessions && sessions.length > 0) {
          msg += '\n\nالمحاضرات:';
          sessions.slice(0, 5).forEach((s) => {
            msg += `\n• ${s.className} (${s.subjectName}) | المحاضر: ${s.instructorName} | القاعة: ${s.room} | الوقت: ${s.startTime}`;
          });
        }
        return msg;
      }
      let msg = `${scopePrefix}\nScheduled Lectures & Sessions:\n• Total Sessions: ${sessionCount}`;
      if (sessions && sessions.length > 0) {
        msg += '\n\nSessions:';
        sessions.slice(0, 5).forEach((s) => {
          msg += `\n• ${s.className} (${s.subjectName}) | Inst: ${s.instructorName} | Room: ${s.room} | Time: ${s.startTime}`;
        });
      }
      return msg;
    }

    case 'workflowSummary': {
      if (resultData.isSingleDocument) {
        const { id, title, status, className, submitter, createdAt, approvedAt, approvedBy } = resultData;
        if (isAr) {
          return `معاملة رقم #${id} - ${title}\n• الحالة: ${status}\n• الفصل: ${className || '-'}\n• مقدم الطلب: ${submitter || '-'}\n• تاريخ الإنشاء: ${createdAt}\n${approvedAt ? `• تاريخ ووقت الاعتماد: ${approvedAt} (بواسطة ${approvedBy || '-'})` : '• لم يتم الاعتماد بعد'}`;
        }
        return `Workflow #${id} - ${title}\n• Status: ${status}\n• Class: ${className || '-'}\n• Submitter: ${submitter || '-'}\n• Created At: ${createdAt}\n${approvedAt ? `• Approved At: ${approvedAt} (by ${approvedBy || '-'})` : '• Not yet approved'}`;
      }
      const { statusCounts, recentDocuments } = resultData;
      if (isAr) {
        let msg = `${scopePrefix}\nملخص معاملات سير العمل:\n• المعاملات المعلقة (قيد المراجعة): ${statusCounts.pending}\n• المعاملات المعتمدة: ${statusCounts.approved}\n• المعاملات المرفوضة: ${statusCounts.rejected}\n• المسودات: ${statusCounts.draft}`;
        if (recentDocuments && recentDocuments.length > 0) {
          msg += '\n\nأحدث المعاملات:';
          recentDocuments.forEach((d) => {
            msg += `\n• #${d.id} ${d.title} [${d.status}] - ${d.createdAt}`;
          });
        }
        return msg;
      }
      let msg = `${scopePrefix}\nWorkflow Documents Summary:\n• Pending Review: ${statusCounts.pending}\n• Approved: ${statusCounts.approved}\n• Rejected: ${statusCounts.rejected}\n• Drafts: ${statusCounts.draft}`;
      if (recentDocuments && recentDocuments.length > 0) {
        msg += '\n\nRecent Documents:';
        recentDocuments.forEach((d) => {
          msg += `\n• #${d.id} ${d.title} [${d.status}] - ${d.createdAt}`;
        });
      }
      return msg;
    }

    case 'notesAndComments': {
      if (resultData.isSpecificDoc) {
        const { workflowId, title, comments, statusReasons } = resultData;
        if (isAr) {
          let msg = `الملاحظات والتعليقات على المعاملة #${workflowId} (${title}):`;
          if (comments && comments.length > 0) {
            msg += '\n\nالتعليقات:';
            comments.forEach((c) => {
              msg += `\n• ${c.author} (${c.date}): "${c.comment}"`;
            });
          }
          if (statusReasons && statusReasons.length > 0) {
            msg += '\n\nأسباب وتفاصيل تغيير الحالة:';
            statusReasons.forEach((r) => {
              msg += `\n• ${r.actor} [${r.status}] (${r.date}): "${r.reason}"`;
            });
          }
          if ((!comments || comments.length === 0) && (!statusReasons || statusReasons.length === 0)) {
            msg += '\nلا توجد تعليقات أو ملاحظات مسجلة على هذه المعاملة.';
          }
          return msg;
        }
        let msg = `Notes and Comments on Workflow #${workflowId} (${title}):`;
        if (comments && comments.length > 0) {
          msg += '\n\nComments:';
          comments.forEach((c) => {
            msg += `\n• ${c.author} (${c.date}): "${c.comment}"`;
          });
        }
        if (statusReasons && statusReasons.length > 0) {
          msg += '\n\nStatus History Reasons:';
          statusReasons.forEach((r) => {
            msg += `\n• ${r.actor} [${r.status}] (${r.date}): "${r.reason}"`;
          });
        }
        return msg;
      }

      const { workflowComments, attendanceNotes } = resultData;
      if (isAr) {
        let msg = `${scopePrefix}\nأحدث الملاحظات والتعليقات (خاص بالإدارة):`;
        if (workflowComments && workflowComments.length > 0) {
          msg += '\n\nتعليقات سير العمل:';
          workflowComments.forEach((wc) => {
            msg += `\n• #${wc.workflowId} (${wc.author} - ${wc.date}): "${wc.comment}"`;
          });
        }
        if (attendanceNotes && attendanceNotes.length > 0) {
          msg += '\n\nملاحظات الحضور:';
          attendanceNotes.forEach((an) => {
            msg += `\n• ${an.studentName} (${an.className} - ${an.date}): "${an.notes}"`;
          });
        }
        return msg;
      }
      let msg = `${scopePrefix}\nRecent Notes & Comments (Admin only):`;
      if (workflowComments && workflowComments.length > 0) {
        msg += '\n\nWorkflow Comments:';
        workflowComments.forEach((wc) => {
          msg += `\n• #${wc.workflowId} (${wc.author} - ${wc.date}): "${wc.comment}"`;
        });
      }
      if (attendanceNotes && attendanceNotes.length > 0) {
        msg += '\n\nAttendance Notes:';
        attendanceNotes.forEach((an) => {
          msg += `\n• ${an.studentName} (${an.className} - ${an.date}): "${an.notes}"`;
        });
      }
      return msg;
    }

    case 'topAbsenceStudent': {
      const { topStudents, dateRange } = resultData;
      if (isAr) {
        let msg = `${scopePrefix}\nالطالب الأكثر غياباً:`;
        if (topStudents && topStudents.length > 0) {
          topStudents.slice(0, 5).forEach((s, i) => {
            msg += `\n${i + 1}. ${s.nameAr || s.name} (${s.militaryNumber || 'بدون رقم عسكري'}) - ${s.absenceCount} غياب - فصل: ${s.className || '-'}`;
          });
        } else {
          msg += '\nلا توجد سجلات غياب ضمن النطاق المصرح به.';
        }
        return msg;
      }
      let msg = `${scopePrefix}\nStudent(s) with Most Absences:`;
      if (topStudents && topStudents.length > 0) {
        topStudents.slice(0, 5).forEach((s, i) => {
          msg += `\n${i + 1}. ${s.name || s.nameAr} (${s.militaryNumber || 'No ID'}) - ${s.absenceCount} absences - Class: ${s.className || '-'}`;
        });
      } else {
        msg += '\nNo absence records found within your permitted scope.';
      }
      return msg;
    }

    case 'classCount': {
      const { totalCount, programBreakdown, classes } = resultData;
      if (classes && classes.length > 0) {
        const list = classes
          .map((c, i) => isAr
            ? `${i + 1}. ${c.name}${c.code ? ` (${c.code})` : ''} — ${c.program}${c.subject ? ` | المادة: ${c.subject}` : ''}`
            : `${i + 1}. ${c.name}${c.code ? ` (${c.code})` : ''} — ${c.program}${c.subject ? ` | Subject: ${c.subject}` : ''}`)
          .join('\n');
        return isAr
          ? `${scopePrefix}\nقائمة الفصول (${totalCount}):\n${list}`
          : `${scopePrefix}\nClass List (${totalCount}):\n${list}`;
      }
      const breakdown = Object.entries(programBreakdown || {})
        .map(([prog, count]) => isAr ? `  • ${prog}: ${count}` : `  • ${prog}: ${count}`)
        .join('\n');
      return isAr
        ? `${scopePrefix} إجمالي الفصول: ${totalCount}\n${breakdown}`
        : `${scopePrefix} Total Classes: ${totalCount}\n${breakdown}`;
    }

    case 'attendanceTypes': {
      const { types, count } = resultData;
      const list = (types || [])
        .map((t) => isAr ? `  • ${t.nameAr || t.nameEn} (${t.code})` : `  • ${t.nameEn || t.nameAr} (${t.code})`)
        .join('\n');
      return isAr
        ? `أنواع الحضور (${count}):\n${list}`
        : `Attendance Types (${count}):\n${list}`;
    }

    case 'programInfo': {
      const { programs, count } = resultData;
      const list = (programs || [])
        .map((p) => isAr
          ? `  • ${p.nameAr || p.nameEn} (${p.code}) — فصول: ${p.classCount}, مواد: ${p.subjectCount}, طلاب: ${p.studentCount}`
          : `  • ${p.nameEn || p.nameAr} (${p.code}) — Classes: ${p.classCount}, Subjects: ${p.subjectCount}, Students: ${p.studentCount}`)
        .join('\n');
      return isAr
        ? `البرامج (${count}):\n${list}`
        : `Programs (${count}):\n${list}`;
    }

    case 'subjectInfo': {
      const { subjects, count } = resultData;
      const list = (subjects || [])
        .map((s) => isAr
          ? `  • ${s.nameAr || s.nameEn} (${s.code}) — ساعات: ${s.credits || 'N/A'}`
          : `  • ${s.nameEn || s.nameAr} (${s.code}) — Credits: ${s.credits || 'N/A'}`)
        .join('\n');
      return isAr
        ? `${scopePrefix} المواد (${count}):\n${list}`
        : `${scopePrefix} Subjects (${count}):\n${list}`;
    }

    case 'enrollmentInfo': {
      const { totalEnrollments, statusBreakdown } = resultData;
      const breakdown = Object.entries(statusBreakdown || {})
        .map(([code, info]) => isAr ? `  • ${info.name}: ${info.count}` : `  • ${info.name}: ${info.count}`)
        .join('\n');
      return isAr
        ? `${scopePrefix} إجمالي التسجيلات: ${totalEnrollments}\n${breakdown}`
        : `${scopePrefix} Total Enrollments: ${totalEnrollments}\n${breakdown}`;
    }

    case 'penaltySummary': {
      const { totalPenalties, totalPoints, typeBreakdown } = resultData;
      const breakdown = Object.entries(typeBreakdown || {})
        .map(([code, info]) => isAr ? `  • ${info.name}: ${info.count} (${info.points} نقطة)` : `  • ${info.name}: ${info.count} (${info.points} pts)`)
        .join('\n');
      return isAr
        ? `${scopePrefix} إجمالي العقوبات: ${totalPenalties} | النقاط: ${totalPoints}\n${breakdown}`
        : `${scopePrefix} Total Penalties: ${totalPenalties} | Points: ${totalPoints}\n${breakdown}`;
    }

    case 'behaviorSummary': {
      const { totalBehaviors, totalPoints, typeBreakdown } = resultData;
      const breakdown = Object.entries(typeBreakdown || {})
        .map(([code, info]) => isAr ? `  • ${info.name}: ${info.count} (${info.points} نقطة)` : `  • ${info.name}: ${info.count} (${info.points} pts)`)
        .join('\n');
      return isAr
        ? `${scopePrefix} إجمالي السلوكيات: ${totalBehaviors} | النقاط: ${totalPoints}\n${breakdown}`
        : `${scopePrefix} Total Behaviors: ${totalBehaviors} | Points: ${totalPoints}\n${breakdown}`;
    }

    case 'marksDistribution': {
      const { distributions, count } = resultData;
      const list = (distributions || [])
        .map((d) => {
          const typeName = d.assessmentType?.nameAr || d.assessmentType?.nameEn || d.assessmentType?.code || 'N/A';
          return isAr
            ? `  • ${typeName}: وزن ${d.weight}%, حد أقصى ${d.maxMarks}`
            : `  • ${typeName}: weight ${d.weight}%, max ${d.maxMarks}`;
        })
        .join('\n');
      return isAr
        ? `${scopePrefix} توزيع الدرجات (${count}):\n${list}`
        : `${scopePrefix} Marks Distribution (${count}):\n${list}`;
    }

    case 'participationSummary': {
      const { totalParticipations, totalPoints, totalPositive, totalNegative, typeBreakdown } = resultData;
      const breakdown = Object.entries(typeBreakdown || {})
        .map(([code, info]) => isAr ? `  • ${info.name}: ${info.count} (${info.points} نقطة)` : `  • ${info.name}: ${info.count} (${info.points} pts)`)
        .join('\n');
      return isAr
        ? `${scopePrefix} إجمالي المشاركات: ${totalParticipations} | نقاط موجبة: ${totalPositive} | نقاط سالبة: ${totalNegative}\n${breakdown}`
        : `${scopePrefix} Total Participations: ${totalParticipations} | Positive: ${totalPositive} | Negative: ${totalNegative}\n${breakdown}`;
    }

    case 'activityInfo': {
      const { activities, count } = resultData;
      const list = (activities || [])
        .map((a) => isAr
          ? `  • ${a.title} — النوع: ${a.typeName || 'N/A'}, التسليمات: ${a.submissionCount}, الموعد: ${a.dueDate ? new Date(a.dueDate).toLocaleDateString('ar') : 'N/A'}`
          : `  • ${a.title} — Type: ${a.typeName || 'N/A'}, Submissions: ${a.submissionCount}, Due: ${a.dueDate ? new Date(a.dueDate).toLocaleDateString('en') : 'N/A'}`)
        .join('\n');
      return isAr
        ? `${scopePrefix} الأنشطة (${count}):\n${list}`
        : `${scopePrefix} Activities (${count}):\n${list}`;
    }

    case 'announcementInfo': {
      const { announcements, count } = resultData;
      const list = (announcements || [])
        .map((a) => isAr
          ? `  • ${a.title} — ${a.createdAt ? new Date(a.createdAt).toLocaleDateString('ar') : 'N/A'}${a.className ? ` | ${a.className}` : ''}`
          : `  • ${a.title} — ${a.createdAt ? new Date(a.createdAt).toLocaleDateString('en') : 'N/A'}${a.className ? ` | ${a.className}` : ''}`)
        .join('\n');
      return isAr
        ? `${scopePrefix} الإعلانات (${count}):\n${list}`
        : `${scopePrefix} Announcements (${count}):\n${list}`;
    }

    case 'quizSummary': {
      const { totalQuizzes, totalAttempts, avgScore, passRate, passedCount, statusBreakdown } = resultData;
      const breakdown = Object.entries(statusBreakdown || {})
        .map(([code, info]) => isAr ? `  • ${info.name}: ${info.count}` : `  • ${info.name}: ${info.count}`)
        .join('\n');
      return isAr
        ? `${scopePrefix} الاختبارات: ${totalQuizzes} | المحاولات: ${totalAttempts} | متوسط: ${avgScore} | نسبة النجاح: ${passRate}%\n${breakdown}`
        : `${scopePrefix} Quizzes: ${totalQuizzes} | Attempts: ${totalAttempts} | Avg: ${avgScore} | Pass Rate: ${passRate}%\n${breakdown}`;
    }

    case 'standupAttendance': {
      const { counts, attendanceRate } = resultData;
      return isAr
        ? `${scopePrefix} طابور الصباح — الحاضر: ${counts.present}, الغائب: ${counts.absent}, المتأخر: ${counts.late}, بعذر: ${counts.excused} | نسبة الحضور: ${attendanceRate}%`
        : `${scopePrefix} Standup Attendance — Present: ${counts.present}, Absent: ${counts.absent}, Late: ${counts.late}, Excused: ${counts.excused} | Rate: ${attendanceRate}%`;
    }

    case 'classroomInfo': {
      const { classrooms, count } = resultData;
      const list = (classrooms || [])
        .map((c) => isAr
          ? `  • ${c.nameAr || c.nameEn} (${c.code}) — سعة: ${c.capacity || 'N/A'}${c.building ? `, مبنى: ${c.building}` : ''}${c.statusName ? `, الحالة: ${c.statusName}` : ''}`
          : `  • ${c.nameEn || c.nameAr} (${c.code}) — Capacity: ${c.capacity || 'N/A'}${c.building ? `, Building: ${c.building}` : ''}${c.statusName ? `, Status: ${c.statusName}` : ''}`)
        .join('\n');
      return isAr
        ? `القاعات (${count}):\n${list}`
        : `Classrooms (${count}):\n${list}`;
    }

    case 'submissionSummary': {
      const { totalSubmissions, statusBreakdown } = resultData;
      const breakdown = Object.entries(statusBreakdown || {})
        .map(([code, info]) => isAr ? `  • ${info.name}: ${info.count}` : `  • ${info.name}: ${info.count}`)
        .join('\n');
      return isAr
        ? `${scopePrefix} إجمالي التسليمات: ${totalSubmissions}\n${breakdown}`
        : `${scopePrefix} Total Submissions: ${totalSubmissions}\n${breakdown}`;
    }

    case 'holidayInfo': {
      const { holidays, count } = resultData;
      const list = (holidays || [])
        .map((h) => isAr
          ? `  • ${h.nameAr || h.nameEn} — ${h.startDate ? new Date(h.startDate).toLocaleDateString('ar') : 'N/A'} إلى ${h.endDate ? new Date(h.endDate).toLocaleDateString('ar') : 'N/A'}${h.typeName ? ` (${h.typeName})` : ''}`
          : `  • ${h.nameEn || h.nameAr} — ${h.startDate ? new Date(h.startDate).toLocaleDateString('en') : 'N/A'} to ${h.endDate ? new Date(h.endDate).toLocaleDateString('en') : 'N/A'}${h.typeName ? ` (${h.typeName})` : ''}`)
        .join('\n');
      return isAr
        ? `الإجازات (${count}):\n${list}`
        : `Holidays (${count}):\n${list}`;
    }

    case 'breakSessionSummary': {
      const { breakSessions, count, typeBreakdown } = resultData;
      const list = (breakSessions || [])
        .map((b) => isAr
          ? `  • ${b.nameAr || b.nameEn} — ${b.startTime} إلى ${b.endTime}${b.typeName ? ` (${b.typeName})` : ''}`
          : `  • ${b.nameEn || b.nameAr} — ${b.startTime} to ${b.endTime}${b.typeName ? ` (${b.typeName})` : ''}`)
        .join('\n');
      return isAr
        ? `الاستراحات (${count}):\n${list}`
        : `Break Sessions (${count}):\n${list}`;
    }

    case 'sessionSummary': {
      const { totalSessions, statusBreakdown, typeBreakdown } = resultData;
      const sBreakdown = Object.entries(statusBreakdown || {})
        .map(([code, info]) => isAr ? `  • ${info.name}: ${info.count}` : `  • ${info.name}: ${info.count}`)
        .join('\n');
      const tBreakdown = Object.entries(typeBreakdown || {})
        .map(([code, info]) => isAr ? `  • ${info.name}: ${info.count}` : `  • ${info.name}: ${info.count}`)
        .join('\n');
      return isAr
        ? `${scopePrefix} إجمالي الجلسات: ${totalSessions}\nحسب الحالة:\n${sBreakdown}\nحسب النوع:\n${tBreakdown}`
        : `${scopePrefix} Total Sessions: ${totalSessions}\nBy Status:\n${sBreakdown}\nBy Type:\n${tBreakdown}`;
    }

    case 'academicClosureInfo': {
      const { closures, count, typeBreakdown } = resultData;
      const list = (closures || [])
        .map((c) => isAr
          ? `  • ${c.nameAr || c.nameEn} — ${c.startDate ? new Date(c.startDate).toLocaleDateString('ar') : 'N/A'} إلى ${c.endDate ? new Date(c.endDate).toLocaleDateString('ar') : 'N/A'}${c.typeName ? ` (${c.typeName})` : ''}${c.scopeName ? ` | ${c.scopeName}` : ''}`
          : `  • ${c.nameEn || c.nameAr} — ${c.startDate ? new Date(c.startDate).toLocaleDateString('en') : 'N/A'} to ${c.endDate ? new Date(c.endDate).toLocaleDateString('en') : 'N/A'}${c.typeName ? ` (${c.typeName})` : ''}${c.scopeName ? ` | ${c.scopeName}` : ''}`)
        .join('\n');
      return isAr
        ? `الإغلاقات الأكاديمية (${count}):\n${list}`
        : `Academic Closures (${count}):\n${list}`;
    }

    case 'exportHistory': {
      const { exports, count } = resultData;
      const list = (exports || [])
        .map((e) => isAr
          ? `  • ${e.fileName || e.exportType} — ${e.format}, ${e.status}, ${e.createdAt ? new Date(e.createdAt).toLocaleDateString('ar') : 'N/A'}${e.recordCount ? ` (${e.recordCount} سجل)` : ''}`
          : `  • ${e.fileName || e.exportType} — ${e.format}, ${e.status}, ${e.createdAt ? new Date(e.createdAt).toLocaleDateString('en') : 'N/A'}${e.recordCount ? ` (${e.recordCount} records)` : ''}`)
        .join('\n');
      return isAr
        ? `سجل التصدير (${count}):\n${list}`
        : `Export History (${count}):\n${list}`;
    }

    default:
      return JSON.stringify(resultData, null, 2);
  }
}

/**
 * Resolve quick-question params into the full shape the tools expect.
 * Converts a `dateRange` string key (e.g. "this_month") into dateFrom/dateTo
 * and labelEn/labelAr using the existing parser helper.
 */
function resolveQuickParams(params = {}) {
  const resolved = { ...params };
  if (params.dateRange) {
    const phrase = String(params.dateRange).replace(/_/g, ' ');
    const range = extractDateRange(phrase);
    if (range) {
      resolved.dateFrom = range.dateFrom;
      resolved.dateTo = range.dateTo;
      resolved.labelEn = range.labelEn;
      resolved.labelAr = range.labelAr;
    }
  }
  return resolved;
}

/**
 * Execute a predefined quick question.
 *
 * Bypasses the LLM entirely: maps questionId → tool/params, checks access,
 * tries the metric cache, and executes the tool directly if needed.
 */
export async function processQuickQuestion(req, { questionId, lang = 'ar', extraParams = {} } = {}) {
  const userLang = lang === 'en' ? 'en' : 'ar';
  const catalogEntry = getQuestionById(questionId);

  if (!catalogEntry) {
    return {
      success: false,
      tool: 'unknown',
      answer: userLang === 'ar' ? 'السؤال المختار غير معروف.' : 'Selected question is not known.',
      fromCache: false,
      cachedAt: null,
    };
  }

  if (!isQuestionAllowed(catalogEntry, { isAdmin: req.user?.isAdmin, isSuperAdmin: req.user?.isSuperAdmin })) {
    return {
      success: false,
      tool: catalogEntry.tool,
      answer: userLang === 'ar' ? 'ليس لديك صلاحية لهذا السؤال.' : 'You do not have permission for this question.',
      fromCache: false,
      cachedAt: null,
    };
  }

  const toolName = catalogEntry.tool;
  const accessCheck = checkToolAccess(req, toolName);
  if (!accessCheck.allowed) {
    return {
      success: false,
      tool: toolName,
      answer: userLang === 'ar' ? (accessCheck.reasonAr || accessCheck.reason) : accessCheck.reason,
      error: accessCheck.reason,
      fromCache: false,
      cachedAt: null,
    };
  }

  const resolvedParams = resolveQuickParams({ ...catalogEntry.params, ...extraParams });

  // Try the precomputed metric cache first
  const cached = await getCachedAnswerData(req, toolName, resolvedParams);
  if (cached && cached.data !== undefined) {
    return {
      success: true,
      tool: toolName,
      answer: formatAnswer(toolName, cached.data, userLang, resolvedParams),
      data: cached.data,
      params: resolvedParams,
      fromCache: true,
      cachedAt: cached.cachedAt,
    };
  }

  // Execute the tool directly
  const tool = getTool(toolName);
  if (!tool) {
    return {
      success: false,
      tool: toolName,
      answer: userLang === 'ar' ? 'الأداة المطلوبة غير متوفرة.' : 'The requested tool is not available.',
      fromCache: false,
      cachedAt: null,
    };
  }

  let toolResult;
  try {
    toolResult = await tool.execute(req, resolvedParams);
  } catch (toolError) {
    console.error('[AI Quick] Tool execution error:', { tool: toolName, error: toolError.message });
    return {
      success: false,
      tool: toolName,
      answer: userLang === 'ar'
        ? 'حدث خطأ أثناء تنفيذ الاستعلام. يرجى المحاولة مرة أخرى.'
        : 'An error occurred while executing the query. Please try again later.',
      fromCache: false,
      cachedAt: null,
    };
  }

  if (!toolResult || !toolResult.success) {
    return {
      success: false,
      tool: toolName,
      answer: toolResult?.error || (userLang === 'ar' ? 'فشل تنفيذ الأداة.' : 'Tool execution failed.'),
      fromCache: false,
      cachedAt: null,
    };
  }

  // Cache the live result for the next request
  try {
    await setCachedAnswerData(req, toolName, resolvedParams, toolResult.data);
  } catch (cacheErr) {
    console.warn('[AI Quick] Failed to cache result:', cacheErr.message);
  }

  return {
    success: true,
    tool: toolName,
    answer: formatAnswer(toolName, toolResult.data, userLang, resolvedParams),
    data: toolResult.data,
    params: resolvedParams,
    fromCache: false,
    cachedAt: null,
  };
}

/**
 * Execute AI query
 *
 * Flow: LLM engine (tool calling + natural language answer) → cache in Redis
 * Fallback: rule-based parser + template answers when Ollama is unavailable
 */
const GREETING_ANSWER_AR = `أهلاً بك! أنا المساعد الذكي للاستعلامات. يمكنني مساعدتك في:
• إحصائيات الحضور والغياب والطابور
• إنذارات الغياب (أول / نهائي)
• التأخير والحالات الإنسانية
• أعداد الطلاب والتسجيلات
• الفصول والبرامج والمواد
• جداول المحاضرات والجلسات
• متوسطات الدرجات وتوزيع الدرجات
• العقوبات والسلوك والمشاركة
• الأنشطة والإعلانات والاختبارات
• القاعات والتسليمات
• الإجازات والاستراحات والإغلاقات الأكاديمية
• معاملات سير العمل والملاحظات
• سجل التصدير

يمكنك اختيار أحد الاقتراحات أدناه أو كتابة سؤالك بحرية.`;

const GREETING_ANSWER_EN = `Hello! I am the Smart Query Assistant. I can help you with:
• Attendance, absences, and standup statistics
• Absence warnings (first / final)
• Late records and humanitarian cases
• Student counts and enrollments
• Classes, programs, and subjects
• Class schedules and sessions
• Marks averages and marks distribution
• Penalties, behaviors, and participation
• Activities, announcements, and quizzes
• Classrooms and submissions
• Holidays, break sessions, and academic closures
• Workflow approvals and notes
• Export history

Choose one of the suggestions below or type your question freely.`;

export async function processAiQuery(req, message = '', userLang = 'ar', history = []) {
  console.log('[AI Service] Query:', { message: message.slice(0, 80), lang: userLang, userId: req.user?.id, historyLen: history?.length });

  // 0. Warmly handle simple greetings
  if (detectGreeting(message)) {
    return {
      success: true,
      tool: 'greeting',
      answer: userLang === 'ar' ? GREETING_ANSWER_AR : GREETING_ANSWER_EN,
      fromCache: false,
      cachedAt: null,
    };
  }

  // 1. Smart LLM-first path (Ollama + Redis + RAG), no regex dependency for intent
  if (AI_LLM_PRIMARY) {
    try {
      const llmResult = await processWithLLM(req, message, userLang, history);
      if (llmResult && llmResult.success && llmResult.tool !== 'unknown') {
        console.log('[AI Service] LLM primary result:', { tool: llmResult.tool, cached: llmResult.cached, answerLen: llmResult.answer?.length });
        return {
          ...llmResult,
          fromCache: !!llmResult.cached,
          cachedAt: null,
        };
      }
      // LLM answered directly (e.g. greeting-like question)
      if (llmResult && llmResult.success && llmResult.tool === 'direct' && llmResult.answer) {
        return {
          ...llmResult,
          fromCache: !!llmResult.cached,
          cachedAt: null,
        };
      }
      // LLM explicitly said unknown or failed
      if (llmResult && llmResult.success && llmResult.tool === 'unknown') {
        console.log('[AI Service] LLM could not map to tool');
      }
    } catch (error) {
      console.warn('[AI Service] LLM primary error:', error.message);
    }

    // If we are in LLM-only mode, do not fall back to the rule-based parser.
    if (AI_LLM_ONLY) {
      const isAr = userLang === 'ar';
      return {
        success: true,
        tool: 'unknown',
        answer: isAr
          ? 'لم أتمكن من فهم السؤال بالذكاء الاصطناعي. يمكنك إعادة صياغته أو الانتظار لحظة أخرى.'
          : 'I could not understand the question with the AI. Try rephrasing it or wait a moment.',
        fromCache: false,
        cachedAt: null,
      };
    }
  }

  // 2. Rule-based parser fallback (fast, deterministic, no LLM dependency)
  const parsed = await parseQuery(req, message);
  console.log('[AI Service] Parsed:', { tool: parsed.tool, params: { classId: parsed.params?.classId, dateLabel: parsed.params?.labelEn } });

  // 3. Legacy fallback: unknown intent → optional local Ollama stage
  if (parsed.tool === 'unknown') {
    if (AI_LLM_FALLBACK) {
      try {
        const llmResult = await processWithLLM(req, message, userLang, history);
        if (llmResult && llmResult.success) {
          console.log('[AI Service] LLM fallback result:', { tool: llmResult.tool, cached: llmResult.cached, answerLen: llmResult.answer?.length });
          return {
            ...llmResult,
            fromCache: !!llmResult.cached,
            cachedAt: null,
          };
        }
      } catch (error) {
        console.warn('[AI Service] LLM fallback error:', error.message);
      }
    }

    const isAr = userLang === 'ar';
    return {
      success: true,
      tool: 'unknown',
      answer: isAr
        ? 'هذا السؤال خارج نطاق المؤشرات والبيانات المتاحة لدي حالياً.'
        : 'This question is outside the supported metrics scope.',
      fromCache: false,
      cachedAt: null,
    };
  }

  // 4. Permission Gate
  const accessCheck = checkToolAccess(req, parsed.tool);
  if (!accessCheck.allowed) {
    return {
      success: false,
      tool: parsed.tool,
      answer: userLang === 'ar' ? (accessCheck.reasonAr || accessCheck.reason) : accessCheck.reason,
      error: accessCheck.reason,
      fromCache: false,
      cachedAt: null,
    };
  }

  // 4. Tool Lookup
  const tool = getTool(parsed.tool);
  if (!tool) {
    return {
      success: false,
      tool: parsed.tool,
      error: `Tool ${parsed.tool} is not implemented.`,
      fromCache: false,
      cachedAt: null,
    };
  }

  // 5. Try precomputed metric cache
  const cached = await getCachedAnswerData(req, parsed.tool, parsed.params);
  if (cached && cached.data !== undefined) {
    console.log('[AI Service] Metric cache hit:', parsed.tool);
    return {
      success: true,
      tool: parsed.tool,
      answer: formatAnswer(parsed.tool, cached.data, userLang, parsed.params),
      data: cached.data,
      params: parsed.params,
      fromCache: true,
      cachedAt: cached.cachedAt,
    };
  }

  // 6. Live tool execution
  let toolResult;
  try {
    toolResult = await tool.execute(req, parsed.params);
  } catch (toolError) {
    console.error('[AI Service] Tool execution error:', { tool: parsed.tool, error: toolError.message, stack: toolError.stack?.split('\n').slice(0, 3).join(' | ') });
    return {
      success: false,
      tool: parsed.tool,
      error: `Tool execution failed: ${toolError.message}`,
      answer: userLang === 'ar'
        ? 'حدث خطأ أثناء تنفيذ الاستعلام. يرجى المحاولة مرة أخرى.'
        : 'An error occurred while executing the query. Please try again later.',
      fromCache: false,
      cachedAt: null,
    };
  }
  console.log('[AI Service] Tool result:', { tool: parsed.tool, success: toolResult.success });
  if (!toolResult.success) {
    return {
      success: false,
      tool: parsed.tool,
      error: toolResult.error,
      answer: toolResult.error,
      fromCache: false,
      cachedAt: null,
    };
  }

  // 7. Store result in metric cache for next time
  try {
    await setCachedAnswerData(req, parsed.tool, parsed.params, toolResult.data);
  } catch (cacheErr) {
    console.warn('[AI Service] Failed to cache metric:', cacheErr.message);
  }

  // 8. Answer Formatting
  const answer = formatAnswer(parsed.tool, toolResult.data, userLang, parsed.params);

  return {
    success: true,
    tool: parsed.tool,
    answer,
    data: toolResult.data,
    params: parsed.params,
    fromCache: false,
    cachedAt: null,
  };
}

export default {
  processAiQuery,
  processQuickQuestion,
  formatAnswer,
};
