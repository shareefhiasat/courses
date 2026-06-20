import { PrismaClient } from '@prisma/client';
import { calculateLetterGrade, MANUAL_GRADES } from '../utils/formatting/gradingStandards.js';
import notificationGateway from '../services/notifications/index.js';
import { EVENTS } from '../services/notifications/constants.js';
import { buildLocalizedNameFields, buildNotificationNameVars } from '../utils/localizedUserName.js';
import { getRequestScope, isRecordInScope, scopeForbidden } from '../utils/scopeAccess.js';
import { scopeArray } from '../utils/applyListScope.js';

const prisma = new PrismaClient();

// Get marks distribution for a subject
const getMarksDistribution = async (req, res) => {
  try {
    const { subjectId } = req.params;

    const scope = await getRequestScope(req);
    if (!scope.unrestricted) {
      const subject = await prisma.subject.findUnique({
        where: { id: parseInt(subjectId, 10) },
        select: { id: true, programId: true, categoryId: true },
      });
      if (!subject || !isRecordInScope(scope, subject)) {
        return scopeForbidden(res);
      }
    }

    const distribution = await prisma.marksDistribution.findUnique({
      where: { subjectId: parseInt(subjectId) },
      include: {
        subject: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        }
      }
    });

    if (!distribution) {
      // Return default distribution if none exists
      return res.json({
        success: true,
        data: {
          midTermExam: 20,
          finalExam: 40,
          homework: 5,
          labsProjectResearch: 10,
          quizzes: 5,
          participation: 10,
          attendance: 10
        }
      });
    }

    res.json({
      success: true,
      data: distribution
    });
  } catch (error) {
    console.error('[marks.js] Error getting marks distribution:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Set/Update marks distribution for a subject
const setMarksDistribution = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const distribution = req.body;

    // Convert all values to integers to handle form input strings
    const processedDistribution = {
      midTermExam: parseInt(distribution.midTermExam) || 0,
      finalExam: parseInt(distribution.finalExam) || 0,
      homework: parseInt(distribution.homework) || 0,
      labsProjectResearch: parseInt(distribution.labsProjectResearch) || 0,
      quizzes: parseInt(distribution.quizzes) || 0,
      participation: parseInt(distribution.participation) || 0,
      attendance: parseInt(distribution.attendance) || 0
    };

    // Validate that percentages add up to 100
    const total = 
      processedDistribution.midTermExam +
      processedDistribution.finalExam +
      processedDistribution.homework +
      processedDistribution.labsProjectResearch +
      processedDistribution.quizzes +
      processedDistribution.participation +
      processedDistribution.attendance;

    if (Math.abs(total - 100) > 0.01) {
      return res.status(400).json({
        success: false,
        error: `Total percentage must equal 100%. Current total: ${total}%`
      });
    }

    // Upsert (create or update)
    const result = await prisma.marksDistribution.upsert({
      where: { subjectId: parseInt(subjectId) },
      update: {
        midTermExam: processedDistribution.midTermExam,
        finalExam: processedDistribution.finalExam,
        homework: processedDistribution.homework,
        labsProjectResearch: processedDistribution.labsProjectResearch,
        quizzes: processedDistribution.quizzes,
        participation: processedDistribution.participation,
        attendance: processedDistribution.attendance,
        updatedBy: null // TODO: Get actual user ID from auth system
      },
      create: {
        subjectId: parseInt(subjectId),
        midTermExam: processedDistribution.midTermExam,
        finalExam: processedDistribution.finalExam,
        homework: processedDistribution.homework,
        labsProjectResearch: processedDistribution.labsProjectResearch,
        quizzes: processedDistribution.quizzes,
        participation: processedDistribution.participation,
        attendance: processedDistribution.attendance,
        createdBy: null // TODO: Get actual user ID from auth system
      },
      include: {
        subject: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[marks.js] Error setting marks distribution:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get student marks for a subject
const getStudentMarks = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { classId } = req.query;

    const scope = await getRequestScope(req);
    if (!scope.unrestricted) {
      const subject = await prisma.subject.findUnique({
        where: { id: parseInt(subjectId, 10) },
        select: { id: true, programId: true, categoryId: true },
      });
      if (!subject || !isRecordInScope(scope, subject)) {
        return scopeForbidden(res);
      }
      if (classId) {
        const cls = await prisma.class.findUnique({
          where: { id: parseInt(classId, 10) },
          select: { id: true, programId: true, subjectId: true, categoryId: true },
        });
        if (!cls || !isRecordInScope(scope, cls)) {
          return scopeForbidden(res);
        }
      }
    }

    const where = {
      subjectId: parseInt(subjectId)
    };

    if (classId) {
      where.classId = parseInt(classId);
    }

    const marks = await prisma.studentMarks.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            displayNameAr: true,
            displayName: true,
            studentNumber: true
          }
        },
        subject: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        },
        class: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        }
      },
      orderBy: {
        user: {
          studentNumber: 'asc'
        }
      }
    });

    // Add grade information to each student mark
    const marksWithGradeInfo = (await scopeArray(req, marks, 'classLinked')).map(mark => {
      const gradeInfo = calculateLetterGrade(mark.totalMarks, mark.isRepeated);
      return {
        ...mark,
        gradeInfo
      };
    });

    res.json({
      success: true,
      data: marksWithGradeInfo
    });
  } catch (error) {
    console.error('[marks.js] Error getting student marks:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update student marks
const updateStudentMarks = async (req, res) => {
  try {
    const { userId, subjectId, classId } = req.params;
    const marks = req.body || {};
    const isRepeated = Boolean(marks.isRepeated);
    const gradeType = marks.gradeType || 'calculated';

    // Calculate total marks based on distribution
    const distribution = await prisma.marksDistribution.findUnique({
      where: { subjectId: parseInt(subjectId) }
    });

    let totalMarks = 0;
    let letterGrade = 'F';
    
    if (gradeType === 'calculated' && distribution) {
      // Normal calculation for calculated grades
      totalMarks = 
        ((marks.midTermExam || 0) / distribution.midTermExam * distribution.midTermExam) +
        ((marks.finalExam || 0) / distribution.finalExam * distribution.finalExam) +
        ((marks.homework || 0) / distribution.homework * distribution.homework) +
        ((marks.labsProjectResearch || 0) / distribution.labsProjectResearch * distribution.labsProjectResearch) +
        ((marks.quizzes || 0) / distribution.quizzes * distribution.quizzes) +
        ((marks.participation || 0) / distribution.participation * distribution.participation) +
        ((marks.attendance || 0) / distribution.attendance * distribution.attendance);
      
      // Calculate letter grade using the utility with isRepeated flag
      const gradeResult = calculateLetterGrade(totalMarks, isRepeated);
      letterGrade = gradeResult.letter;
    } else if (gradeType !== 'calculated') {
      // Manual grades
      const MANUAL_GRADES = {
        'FB': 'Fail Due to Absence',
        'FA': 'Fail Due to Absence',
        'WF': 'Withdrawal with Grade'
      };
      letterGrade = gradeType;
      totalMarks = 0; // Manual grades show 0%
    }

    // Get previous state for history tracking
    const previousRecord = await prisma.studentMarks.findFirst({
      where: {
        userId: parseInt(userId),
        subjectId: parseInt(subjectId),
        classId: parseInt(classId),
        isRepeated
      }
    });

    // Get current user ID for history tracking
    const currentUserId = await getDatabaseUserId(req.user);

    const result = await prisma.studentMarks.upsert({
      where: {
        userId_subjectId_classId_isRepeated: {
          userId: parseInt(userId),
          subjectId: parseInt(subjectId),
          classId: parseInt(classId),
          isRepeated
        }
      },
      update: {
        midTermExam: marks.midTermExam,
        finalExam: marks.finalExam,
        homework: marks.homework,
        labsProjectResearch: marks.labsProjectResearch,
        quizzes: marks.quizzes,
        participation: marks.participation,
        attendance: marks.attendance,
        totalMarks,
        letterGrade,
        gradeType,
        updatedBy: currentUserId
      },
      create: {
        userId: parseInt(userId),
        subjectId: parseInt(subjectId),
        classId: parseInt(classId),
        isRepeated,
        gradeType,
        midTermExam: marks.midTermExam,
        finalExam: marks.finalExam,
        homework: marks.homework,
        labsProjectResearch: marks.labsProjectResearch,
        quizzes: marks.quizzes,
        participation: marks.participation,
        attendance: marks.attendance,
        totalMarks,
        letterGrade,
        createdBy: currentUserId
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            displayNameAr: true,
            displayName: true
          }
        }
      }
    });

    // Create history record
    const newState = {
      userId: parseInt(userId),
      subjectId: parseInt(subjectId),
      classId: parseInt(classId),
      isRepeated,
      gradeType,
      midTermExam: marks.midTermExam,
      finalExam: marks.finalExam,
      homework: marks.homework,
      labsProjectResearch: marks.labsProjectResearch,
      quizzes: marks.quizzes,
      participation: marks.participation,
      attendance: marks.attendance,
      totalMarks,
      letterGrade
    };

    if (previousRecord) {
      // Update case - detect changes
      const changedFields = detectChanges(previousRecord, newState);
      if (changedFields.length > 0) {
        await createMarksHistory(
          result.id,
          'updated',
          currentUserId,
          previousRecord,
          newState,
          changedFields,
          {
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          }
        );
      }
    } else {
      // Create case
      await createMarksHistory(
        result.id,
        'created',
        currentUserId,
        null,
        newState,
        null,
        {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      );
    }

    // Emit notification for marks update
    try {
      const subject = await prisma.subject.findUnique({
        where: { id: parseInt(subjectId) },
        select: { nameEn: true, nameAr: true }
      });

      const student = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
        select: { displayName: true, firstName: true, lastName: true, displayNameAr: true, firstNameAr: true, lastNameAr: true }
      });

      if (subject && student) {
        const eventType = isRepeated ? EVENTS.REPEATED_ATTEMPT_GRADED : (previousRecord ? EVENTS.MARKS_UPDATED : EVENTS.GRADE_POSTED);
        
        await notificationGateway.emit(
          eventType,
          {
            ...buildNotificationNameVars(student, 'Unknown Student'),
            subjectName: subject.nameEn || subject.nameAr,
            grade: letterGrade,
            totalMarks: `${totalMarks}%`
          },
          req.user,
          { userId: parseInt(userId) }
        );
      }
    } catch (notifError) {
      console.error('[marks.js] Failed to emit marks notification:', notifError);
    }

    // Create grade info object for response
    const gradeInfo = {
      letterGrade,
      totalMarks,
      gradeType,
      isRepeated
    };

    res.json({
      success: true,
      data: {
        ...result,
        gradeInfo
      }
    });
  } catch (error) {
    console.error('[marks.js] Error updating student marks:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Batch update student marks
const batchUpdateStudentMarks = async (req, res) => {
  try {
    const { subjectId, classId } = req.params;
    const { students } = req.body;

    if (!Array.isArray(students)) {
      return res.status(400).json({
        success: false,
        error: 'students must be an array'
      });
    }

    // Get distribution for calculations
    const distribution = await prisma.marksDistribution.findUnique({
      where: { subjectId: parseInt(subjectId) }
    });

    const results = await Promise.all(
      students.map(async (student) => {
        let totalMarks = 0;
        if (distribution) {
          totalMarks = 
            ((student.midTermExam || 0) * distribution.midTermExam / 100) +
            ((student.finalExam || 0) * distribution.finalExam / 100) +
            ((student.homework || 0) * distribution.homework / 100) +
            ((student.labsProjectResearch || 0) * distribution.labsProjectResearch / 100) +
            ((student.quizzes || 0) * distribution.quizzes / 100) +
            ((student.participation || 0) * distribution.participation / 100) +
            ((student.attendance || 0) * distribution.attendance / 100);
        }

        let letterGrade = 'F';
        if (totalMarks >= 90) letterGrade = 'A';
        else if (totalMarks >= 80) letterGrade = 'B';
        else if (totalMarks >= 70) letterGrade = 'C';
        else if (totalMarks >= 60) letterGrade = 'D';

        return prisma.studentMarks.upsert({
          where: {
            userId_subjectId_classId: {
              userId: parseInt(student.userId),
              subjectId: parseInt(subjectId),
              classId: parseInt(classId)
            }
          },
          update: {
            midTermExam: student.midTermExam,
            finalExam: student.finalExam,
            homework: student.homework,
            labsProjectResearch: student.labsProjectResearch,
            quizzes: student.quizzes,
            participation: student.participation,
            attendance: student.attendance,
            totalMarks,
            letterGrade,
            updatedBy: req.user?.id || null
          },
          create: {
            userId: parseInt(student.userId),
            subjectId: parseInt(subjectId),
            classId: parseInt(classId),
            midTermExam: student.midTermExam,
            finalExam: student.finalExam,
            homework: student.homework,
            labsProjectResearch: student.labsProjectResearch,
            quizzes: student.quizzes,
            participation: student.participation,
            attendance: student.attendance,
            totalMarks,
            letterGrade,
            createdBy: req.user?.id || null
          }
        });
      })
    );

    // Emit notifications for batch marks update
    try {
      const subject = await prisma.subject.findUnique({
        where: { id: parseInt(subjectId) },
        select: { nameEn: true, nameAr: true }
      });

      if (subject) {
        // Send individual notifications to each student
        await Promise.all(
          results.map(async (result) => {
            const student = await prisma.user.findUnique({
              where: { id: result.userId },
              select: { displayName: true, firstName: true, lastName: true, displayNameAr: true, firstNameAr: true, lastNameAr: true }
            });

            if (student) {
              await notificationGateway.emit(
                EVENTS.MARKS_UPDATED,
                {
                  ...buildNotificationNameVars(student, 'Unknown Student'),
                  subjectName: subject.nameEn || subject.nameAr,
                  grade: result.letterGrade,
                  totalMarks: `${result.totalMarks}%`
                },
                req.user,
                { userId: result.userId }
              );
            }
          })
        );
      }
    } catch (notifError) {
      console.error('[marks.js] Failed to emit batch marks notifications:', notifError);
    }

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('[marks.js] Error batch updating student marks:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get marks history for a specific student
const getStudentMarksHistory = async (req, res) => {
  try {
    const { userId, subjectId, classId } = req.params;
    
    // Get all history records for this student from the dedicated history table
    const marksHistory = await prisma.studentMarksHistory.findMany({
      where: {
        userId: parseInt(userId),
        subjectId: parseInt(subjectId),
        classId: parseInt(classId)
      },
      include: {
        actionUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            displayNameAr: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format the history for frontend consumption
    const formattedHistory = marksHistory.map(record => {
      // Parse the changed fields from JSON
      const changedFields = record.changedFields ? JSON.parse(record.changedFields) : [];
      
      // If this is a creation action, show initial entry
      if (record.actionType === 'created') {
        changedFields.push({
          field: 'initial',
          oldValue: null,
          newValue: 'Initial marks entry',
          fieldName: 'Initial Entry'
        });
      }

      return {
        id: record.id,
        actionType: record.actionType,
        timestamp: record.createdAt,
        user: record.actionUser,
        changes: changedFields,
        recordSnapshot: {
          isRepeated: record.isRepeated,
          totalMarks: record.totalMarks,
          letterGrade: record.letterGrade,
          gradeType: record.gradeType,
          midTermExam: record.midTermExam,
          finalExam: record.finalExam,
          homework: record.homework,
          labsProjectResearch: record.labsProjectResearch,
          quizzes: record.quizzes,
          participation: record.participation,
          attendance: record.attendance
        },
        metadata: {
          actionReason: record.actionReason,
          ipAddress: record.ipAddress,
          userAgent: record.userAgent
        }
      };
    });

    res.status(200).json({
      success: true,
      data: formattedHistory,
      total: formattedHistory.length
    });
  } catch (error) {
    console.error('[marks.js] Error getting student marks history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Helper function to get database user ID from Keycloak user
const getDatabaseUserId = async (user) => {
  try {
    if (!user) return null;
    
    // Try to find user by Keycloak ID (sub)
    if (user.sub) {
      const keycloakUser = await prisma.user.findFirst({ 
        where: { keycloakId: user.sub } 
      });
      if (keycloakUser) {
        console.log('🔍 Found user by sub/keycloakId:', keycloakUser.id);
        return keycloakUser.id;
      }
    }
    
    // Try to find user by email as fallback
    if (user.email) {
      const emailUser = await prisma.user.findFirst({ 
        where: { email: user.email } 
      });
      if (emailUser) {
        console.log('🔍 Found user by email:', emailUser.id);
        return emailUser.id;
      }
    }
    
    console.log('⚠️ Could not find database user for Keycloak user:', user.email || user.sub);
    return null;
  } catch (error) {
    console.error('[marks.js] Error getting database user ID:', error);
    return null;
  }
};

// Helper function to create history records
const createMarksHistory = async (studentMarksId, actionType, actionBy, previousState, newState, changedFields, metadata = {}) => {
  try {
    const historyRecord = {
      userId: newState.userId,
      subjectId: newState.subjectId,
      classId: newState.classId,
      actionType,
      previousState: previousState ? JSON.stringify(previousState) : null,
      newState: JSON.stringify(newState),
      changedFields: changedFields ? JSON.stringify(changedFields) : null,
      isRepeated: newState.isRepeated,
      gradeType: newState.gradeType,
      midTermExam: newState.midTermExam,
      finalExam: newState.finalExam,
      homework: newState.homework,
      labsProjectResearch: newState.labsProjectResearch,
      quizzes: newState.quizzes,
      participation: newState.participation,
      attendance: newState.attendance,
      totalMarks: newState.totalMarks,
      letterGrade: newState.letterGrade,
      actionReason: metadata.actionReason || null,
      ipAddress: metadata.ipAddress || null,
      userAgent: metadata.userAgent || null,
      studentMarks: {
        connect: {
          id: studentMarksId
        }
      }
    };

    // Only add actionUser relation if actionBy is provided
    if (actionBy) {
      historyRecord.actionUser = {
        connect: {
          id: actionBy
        }
      };
    }

    await prisma.studentMarksHistory.create({
      data: historyRecord
    });

    console.log(`[marks.js] Created history record: ${actionType} by user ${actionBy}`);
  } catch (error) {
    console.error('[marks.js] Error creating history record:', error);
    // Don't throw error - history logging failure shouldn't break the main operation
  }
};

// Helper function to detect changes between two states
const detectChanges = (previousState, newState) => {
  const changedFields = [];
  const fields = ['midTermExam', 'finalExam', 'homework', 'labsProjectResearch', 'quizzes', 'participation', 'attendance', 'isRepeated', 'gradeType'];
  
  fields.forEach(field => {
    if (previousState[field] !== newState[field]) {
      changedFields.push({
        field,
        oldValue: previousState[field],
        newValue: newState[field],
        fieldName: getFieldDisplayName(field)
      });
    }
  });

  return changedFields;
};

// Helper function to get display names for fields
const getFieldDisplayName = (field) => {
  const fieldNames = {
    midTermExam: 'Mid-Term Exam',
    finalExam: 'Final Exam',
    homework: 'Homework',
    labsProjectResearch: 'Labs/Projects',
    quizzes: 'Quizzes',
    participation: 'Participation',
    attendance: 'Attendance',
    isRepeated: 'Repeated Attempt',
    gradeType: 'Grade Type',
    totalMarks: 'Total Marks',
    letterGrade: 'Letter Grade'
  };
  return fieldNames[field] || field;
};

export {
  getMarksDistribution,
  setMarksDistribution,
  getStudentMarks,
  updateStudentMarks,
  getStudentMarksHistory,
  batchUpdateStudentMarks,
  getAllStudentMarksReport
};

/**
 * GET /api/v1/marks/report
 * Get all student marks with complete information for the marks grid
 */
const getAllStudentMarksReport = async (req, res) => {
  try {
    const { programId, subjectId, classId, year, term, isRepeated } = req.query;
    
    console.log('🔍 [MARKS DEBUG] getAllStudentMarksReport called with filters:', {
      programId,
      subjectId,
      classId,
      year,
      term,
      isRepeated
    });
    
    // Build where clause for classes
    const classWhere = {};
    if (programId) {
      classWhere.programId = parseInt(programId);
    }
    if (subjectId) {
      classWhere.subjectId = parseInt(subjectId);
    }
    if (classId) {
      classWhere.id = parseInt(classId);
    }
    if (year) {
      classWhere.year = year;
    }
    if (term) {
      classWhere.term = term;
    }
    
    // Get all enrollments with student, class, subject, program info
    const enrollments = await prisma.enrollment.findMany({
      where: {
        status: {
          code: 'ENROLLED'
        },
        ...(Object.keys(classWhere).length > 0 && {
          class: {
            ...classWhere
          }
        })
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            displayNameAr: true,
            email: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            studentNumber: true
          }
        },
        class: {
          include: {
            program: {
              select: {
                id: true,
                nameEn: true,
                nameAr: true,
                code: true
              }
            },
            subject: {
              select: {
                id: true,
                code: true,
                nameEn: true,
                nameAr: true
              }
            }
          }
        }
      }
    });
    
    console.log('🔍 [MARKS DEBUG] Found enrollments:', enrollments.length);

    const scope = await getRequestScope(req);
    const scopedEnrollments = scope.unrestricted
      ? enrollments
      : enrollments.filter((e) => isRecordInScope(scope, {
          classId: e.classId,
          subjectId: e.subjectId ?? e.class?.subjectId,
          programId: e.class?.programId ?? e.class?.program?.id,
          categoryId: e.class?.categoryId,
        }));

    console.log('🔍 [MARKS DEBUG] Enrollment details:', scopedEnrollments.map(e => ({
      userId: e.userId,
      userName: e.user.displayName || e.user.email,
      subjectId: e.subjectId,
      classId: e.classId,
      status: e.status?.code
    })));
    
    // Get all student marks for these enrollments
    const studentIds = scopedEnrollments.map(e => e.userId);
    const subjectIds = [...new Set(scopedEnrollments.map(e => e.subjectId))];
    const classIds = [...new Set(scopedEnrollments.map(e => e.classId))];
    
    const marks = await prisma.studentMarks.findMany({
      where: {
        userId: { in: studentIds },
        subjectId: { in: subjectIds },
        classId: { in: classIds },
        ...(isRepeated !== undefined && isRepeated !== '' && {
          isRepeated: isRepeated === 'true'
        })
      }
    });
    
    console.log('🔍 [MARKS DEBUG] Found marks records:', marks.length);
    console.log('🔍 [MARKS DEBUG] Marks with isRepeated status:', marks.map(m => ({
      userId: m.userId,
      subjectId: m.subjectId,
      classId: m.classId,
      isRepeated: m.isRepeated,
      gradeType: m.gradeType
    })));
    
    // Get marks distributions for all subjects
    const distributions = await prisma.marksDistribution.findMany({
      where: {
        subjectId: { in: subjectIds }
      }
    });
    
    // Create a map of marks by userId-subjectId-classId-isRepeated
    const marksMap = {};
    marks.forEach(m => {
      const key = `${m.userId}-${m.subjectId}-${m.classId}-${m.isRepeated}`;
      marksMap[key] = m;
    });
    
    // Create a map of distributions by subjectId
    const distributionMap = {};
    distributions.forEach(d => {
      distributionMap[d.subjectId] = d;
    });
    
    // Build the report data
    const reportData = [];
    scopedEnrollments.forEach(enrollment => {
      console.log('🔍 [MARKS DEBUG] Processing enrollment:', {
        userId: enrollment.userId,
        subjectId: enrollment.subjectId,
        classId: enrollment.classId
      });
      
      // Get both first attempt and repeated marks for this enrollment
      const firstAttemptKey = `${enrollment.userId}-${enrollment.subjectId}-${enrollment.classId}-false`;
      const repeatedAttemptKey = `${enrollment.userId}-${enrollment.subjectId}-${enrollment.classId}-true`;
      
      const firstAttemptMarks = marksMap[firstAttemptKey];
      const repeatedAttemptMarks = marksMap[repeatedAttemptKey];
      
      console.log('🔍 [MARKS DEBUG] Marks for enrollment:', {
        firstAttemptKey,
        hasFirstAttempt: !!firstAttemptMarks,
        repeatedAttemptKey,
        hasRepeatedAttempt: !!repeatedAttemptMarks
      });
      
      // Add first attempt record if exists
      if (firstAttemptMarks) {
        const studentMarks = firstAttemptMarks;
        const distribution = distributionMap[enrollment.subjectId] || {
          midTermExam: 20,
          finalExam: 40,
          homework: 5,
          labsProjectResearch: 10,
          quizzes: 5,
          participation: 10,
          attendance: 10
        };
        
        const totalMarks = 
          ((studentMarks.midTermExam || 0) / distribution.midTermExam * distribution.midTermExam) +
          ((studentMarks.finalExam || 0) / distribution.finalExam * distribution.finalExam) +
          ((studentMarks.homework || 0) / distribution.homework * distribution.homework) +
          ((studentMarks.labsProjectResearch || 0) / distribution.labsProjectResearch * distribution.labsProjectResearch) +
          ((studentMarks.quizzes || 0) / distribution.quizzes * distribution.quizzes) +
          ((studentMarks.participation || 0) / distribution.participation * distribution.participation) +
          ((studentMarks.attendance || 0) / distribution.attendance * distribution.attendance);
        
        const gradeType = studentMarks.gradeType || 'calculated';
        let letterGrade, gradeRange, gradeDescriptionEn, gradeDescriptionAr, gradingStandard;
        
        if (gradeType !== 'calculated') {
          const MANUAL_GRADES = [
            { letter: 'FB', description: 'Fail Due to Absence', descriptionAr: 'راسب بسبب الغياب' },
            { letter: 'FA', description: 'Fail Due to Absence', descriptionAr: 'راسب بسبب التغيب' },
            { letter: 'WF', description: 'Withdrawal with Grade', descriptionAr: 'انسحاب مع درجة' }
          ];
          
          const manualGrade = MANUAL_GRADES.find(g => g.letter === gradeType);
          if (manualGrade) {
            letterGrade = manualGrade.letter;
            gradeRange = 'Manual';
            gradeDescriptionEn = manualGrade.description;
            gradeDescriptionAr = manualGrade.descriptionAr;
            gradingStandard = 'Manual';
          }
        } else {
          const gradeResult = calculateLetterGrade(totalMarks, studentMarks.isRepeated || false);
          letterGrade = gradeResult.letter;
          gradeRange = gradeResult.range;
          gradeDescriptionEn = gradeResult.descriptionEn;
          gradeDescriptionAr = gradeResult.descriptionAr;
          gradingStandard = studentMarks.isRepeated ? 'Repeated' : 'First Attempt';
        }
        
        const studentNames = buildLocalizedNameFields(enrollment.user, 'Unknown Student');
        reportData.push({
          id: firstAttemptKey,
          studentId: enrollment.userId,
          studentNumber: enrollment.user.studentNumber || '',
          studentName: studentNames.studentName,
          studentNameAr: studentNames.studentNameAr,
          studentEmail: enrollment.user.email,
          programId: enrollment.class.programId,
          programName: enrollment.class.program?.nameEn || enrollment.class.program?.nameAr || 
            enrollment.class.program?.code,
          subjectId: enrollment.subjectId,
          subjectCode: enrollment.class.subject.code,
          subjectName: enrollment.class.subject.nameEn || enrollment.class.subject.nameAr,
          classId: enrollment.classId,
          className: enrollment.class.nameEn || enrollment.class.nameAr,
          classCode: enrollment.class.code,
          year: enrollment.class.year,
          term: enrollment.class.term,
          midTermExam: studentMarks.midTermExam || 0,
          finalExam: studentMarks.finalExam || 0,
          homework: studentMarks.homework || 0,
          labsProjectResearch: studentMarks.labsProjectResearch || 0,
          quizzes: studentMarks.quizzes || 0,
          participation: studentMarks.participation || 0,
          attendance: studentMarks.attendance || 0,
          totalMarks: gradeType !== 'calculated' ? 0 : totalMarks,
          letterGrade: letterGrade,
          gradeRange: gradeRange,
          gradeDescriptionEn: gradeDescriptionEn,
          gradeDescriptionAr: gradeDescriptionAr,
          isRepeated: studentMarks.isRepeated || false,
          gradingStandard: gradingStandard,
          gradeType: gradeType
        });
      }
      
      // Add repeated attempt record if exists
      if (repeatedAttemptMarks) {
        const studentMarks = repeatedAttemptMarks;
        const distribution = distributionMap[enrollment.subjectId] || {
          midTermExam: 20,
          finalExam: 40,
          homework: 5,
          labsProjectResearch: 10,
          quizzes: 5,
          participation: 10,
          attendance: 10
        };
        
        const totalMarks = 
          ((studentMarks.midTermExam || 0) / distribution.midTermExam * distribution.midTermExam) +
          ((studentMarks.finalExam || 0) / distribution.finalExam * distribution.finalExam) +
          ((studentMarks.homework || 0) / distribution.homework * distribution.homework) +
          ((studentMarks.labsProjectResearch || 0) / distribution.labsProjectResearch * distribution.labsProjectResearch) +
          ((studentMarks.quizzes || 0) / distribution.quizzes * distribution.quizzes) +
          ((studentMarks.participation || 0) / distribution.participation * distribution.participation) +
          ((studentMarks.attendance || 0) / distribution.attendance * distribution.attendance);
        
        const gradeType = studentMarks.gradeType || 'calculated';
        let letterGrade, gradeRange, gradeDescriptionEn, gradeDescriptionAr, gradingStandard;
        
        if (gradeType !== 'calculated') {
          const MANUAL_GRADES = [
            { letter: 'FB', description: 'Fail Due to Absence', descriptionAr: 'راسب بسبب الغياب' },
            { letter: 'FA', description: 'Fail Due to Absence', descriptionAr: 'راسب بسبب التغيب' },
            { letter: 'WF', description: 'Withdrawal with Grade', descriptionAr: 'انسحاب مع درجة' }
          ];
          
          const manualGrade = MANUAL_GRADES.find(g => g.letter === gradeType);
          if (manualGrade) {
            letterGrade = manualGrade.letter;
            gradeRange = 'Manual';
            gradeDescriptionEn = manualGrade.description;
            gradeDescriptionAr = manualGrade.descriptionAr;
            gradingStandard = 'Manual';
          }
        } else {
          const gradeResult = calculateLetterGrade(totalMarks, studentMarks.isRepeated || false);
          letterGrade = gradeResult.letter;
          gradeRange = gradeResult.range;
          gradeDescriptionEn = gradeResult.descriptionEn;
          gradeDescriptionAr = gradeResult.descriptionAr;
          gradingStandard = studentMarks.isRepeated ? 'Repeated' : 'First Attempt';
        }
        
        const studentNames = buildLocalizedNameFields(enrollment.user, 'Unknown Student');
        reportData.push({
          id: repeatedAttemptKey,
          studentId: enrollment.userId,
          studentNumber: enrollment.user.studentNumber || '',
          studentName: studentNames.studentName,
          studentNameAr: studentNames.studentNameAr,
          studentEmail: enrollment.user.email,
          programId: enrollment.class.programId,
          programName: enrollment.class.program?.nameEn || enrollment.class.program?.nameAr || 
            enrollment.class.program?.code,
          subjectId: enrollment.subjectId,
          subjectCode: enrollment.class.subject.code,
          subjectName: enrollment.class.subject.nameEn || enrollment.class.subject.nameAr,
          classId: enrollment.classId,
          className: enrollment.class.nameEn || enrollment.class.nameAr,
          classCode: enrollment.class.code,
          year: enrollment.class.year,
          term: enrollment.class.term,
          midTermExam: studentMarks.midTermExam || 0,
          finalExam: studentMarks.finalExam || 0,
          homework: studentMarks.homework || 0,
          labsProjectResearch: studentMarks.labsProjectResearch || 0,
          quizzes: studentMarks.quizzes || 0,
          participation: studentMarks.participation || 0,
          attendance: studentMarks.attendance || 0,
          totalMarks: gradeType !== 'calculated' ? 0 : totalMarks,
          letterGrade: letterGrade,
          gradeRange: gradeRange,
          gradeDescriptionEn: gradeDescriptionEn,
          gradeDescriptionAr: gradeDescriptionAr,
          isRepeated: studentMarks.isRepeated || false,
          gradingStandard: gradingStandard,
          gradeType: gradeType
        });
      }
    });
    
    // Filter by isRepeated if specified
    const filteredData = isRepeated !== undefined && isRepeated !== '' 
      ? reportData.filter(r => r.isRepeated === (isRepeated === 'true'))
      : reportData;
    
    console.log('🔍 [MARKS DEBUG] Report data before filter:', reportData.length);
    console.log('🔍 [MARKS DEBUG] Report data after isRepeated filter:', filteredData.length);
    console.log('🔍 [MARKS DEBUG] Sample records:', filteredData.slice(0, 5).map(r => ({
      studentId: r.studentId,
      subjectId: r.subjectId,
      classId: r.classId,
      isRepeated: r.isRepeated,
      gradeType: r.gradeType,
      letterGrade: r.letterGrade
    })));
    
    res.json({
      success: true,
      data: filteredData,
      total: filteredData.length
    });
  } catch (error) {
    console.error('[marks.js] Error getting student marks report:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
