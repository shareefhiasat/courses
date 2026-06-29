import prisma from './prismaClient.js';

/**
 * Delete Guard Utility
 *
 * Checks all dependent records before allowing a delete operation.
 * Returns structured dependency info so the frontend can show warnings.
 */

/**
 * Check dependencies for a given model record.
 * Returns { hasDependencies, dependencies, totalDependencies }
 * dependencies is an array of { model, label, count, activeCount }
 */
export async function checkDependencies(modelName, recordId, relations) {
  const id = parseInt(recordId);
  const dependencies = [];

  for (const rel of relations) {
    const where = { [rel.foreignKey]: id };
    // Count all records (including inactive)
    const count = await prisma[rel.model].count({ where });

    if (count > 0) {
      // Also count active only for informational purposes
      let activeCount = count;
      if (rel.activeField) {
        activeCount = await prisma[rel.model].count({
          where: { ...where, [rel.activeField]: true }
        });
      }

      dependencies.push({
        model: rel.model,
        label: rel.label,
        count,
        activeCount
      });
    }
  }

  return {
    hasDependencies: dependencies.length > 0,
    dependencies,
    totalDependencies: dependencies.reduce((sum, d) => sum + d.count, 0)
  };
}

/**
 * Build a human-readable dependency message
 */
export function buildDependencyMessage(dependencies) {
  if (!dependencies || dependencies.length === 0) return '';

  const parts = dependencies.map(d => {
    if (d.activeCount === d.count) {
      return `${d.count} ${d.label}`;
    }
    return `${d.count} ${d.label} (${d.activeCount} active, ${d.count - d.activeCount} inactive)`;
  });

  return `Cannot delete: this record has associated ${parts.join(', ')}.`;
}

// ─── Predefined dependency maps ──────────────────────────────────────────────

export const CLASS_DEPENDENCIES = [
  { model: 'enrollment', foreignKey: 'classId', label: 'enrollments', activeField: undefined },
  { model: 'activity', foreignKey: 'classId', label: 'activities', activeField: 'isActive' },
  { model: 'attendance', foreignKey: 'classId', label: 'attendances', activeField: undefined },
  { model: 'announcement', foreignKey: 'classId', label: 'announcements', activeField: 'isActive' },
  { model: 'behavior', foreignKey: 'classId', label: 'behaviors', activeField: 'isActive' },
  { model: 'participation', foreignKey: 'classId', label: 'participations', activeField: 'isActive' },
  { model: 'penalty', foreignKey: 'classId', label: 'penalties', activeField: 'isActive' },
  { model: 'resource', foreignKey: 'classId', label: 'resources', activeField: 'isActive' },
  { model: 'studentMarks', foreignKey: 'classId', label: 'student marks', activeField: undefined },
  { model: 'scheduledSession', foreignKey: 'classId', label: 'scheduled sessions', activeField: undefined },
  { model: 'workflowDocument', foreignKey: 'classId', label: 'workflow documents', activeField: undefined },
];

export const SUBJECT_DEPENDENCIES = [
  { model: 'class', foreignKey: 'subjectId', label: 'classes', activeField: 'isActive' },
  { model: 'enrollment', foreignKey: 'subjectId', label: 'enrollments', activeField: undefined },
  { model: 'resource', foreignKey: 'subjectId', label: 'resources', activeField: 'isActive' },
  { model: 'announcement', foreignKey: 'subjectId', label: 'announcements', activeField: 'isActive' },
  { model: 'studentMarks', foreignKey: 'subjectId', label: 'student marks', activeField: undefined },
];

export const PROGRAM_DEPENDENCIES = [
  { model: 'subject', foreignKey: 'programId', label: 'subjects', activeField: 'isActive' },
  { model: 'class', foreignKey: 'programId', label: 'classes', activeField: 'isActive' },
  { model: 'enrollment', foreignKey: 'programId', label: 'enrollments', activeField: undefined },
  { model: 'resource', foreignKey: 'programId', label: 'resources', activeField: 'isActive' },
  { model: 'announcement', foreignKey: 'programId', label: 'announcements', activeField: 'isActive' },
  { model: 'standupAttendance', foreignKey: 'programId', label: 'standup attendances', activeField: undefined },
];

export const ACTIVITY_DEPENDENCIES = [
  { model: 'submission', foreignKey: 'activityId', label: 'submissions', activeField: undefined },
];

// ─── Lookup usage map ────────────────────────────────────────────────────────
// Maps each lookup model to its dependent models and the FK field
export const LOOKUP_USAGE_MAP = {
  behaviorTypes: [
    { model: 'behavior', foreignKey: 'typeId', label: 'behaviors' }
  ],
  participationTypes: [
    { model: 'participation', foreignKey: 'typeId', label: 'participations' }
  ],
  penaltyTypes: [
    { model: 'penalty', foreignKey: 'typeId', label: 'penalties' }
  ],
  subjectTypes: [
    { model: 'subject', foreignKey: 'typeId', label: 'subjects' }
  ],
  requirementTypes: [
    { model: 'subject', foreignKey: 'requirementTypeId', label: 'subjects' }
  ],
  categoryTypes: [
    { model: 'resource', foreignKey: 'categoryId', label: 'resources' },
    { model: 'program', foreignKey: 'categoryId', label: 'programs' }
  ],
  resourceTypes: [
    { model: 'resource', foreignKey: 'typeId', label: 'resources' }
  ],
  priorityTypes: [
    { model: 'announcement', foreignKey: 'priorityId', label: 'announcements' }
  ],
  userStatusTypes: [],
  enrollmentStatusTypes: [
    { model: 'enrollment', foreignKey: 'statusId', label: 'enrollments' }
  ],
  activityTypes: [
    { model: 'activity', foreignKey: 'typeId', label: 'activities' }
  ],
  attendanceStatusTypes: [
    { model: 'attendance', foreignKey: 'statusId', label: 'attendances' },
    { model: 'standupAttendance', foreignKey: 'statusId', label: 'standup attendances' }
  ],
  userRoles: [
    { model: 'userRoleAssignment', foreignKey: 'roleId', label: 'role assignments' }
  ],
  submissionStatusTypes: [
    { model: 'submission', foreignKey: 'statusId', label: 'submissions' }
  ],
  quizStatusTypes: [],
  questionDifficultyTypes: [],
  scheduleTypes: [],
  templateTypes: [],
  configTypes: [],
  assessmentTypes: [],
  activityLogActionTypes: [],
  questionTypes: [
    { model: 'question', foreignKey: 'typeId', label: 'questions' }
  ],
  targetAudienceTypes: [
    { model: 'announcement', foreignKey: 'targetAudienceId', label: 'announcements' }
  ],
};

/**
 * Check if a lookup record is used by any dependent model
 */
export async function checkLookupUsage(lookupModel, recordId) {
  const relations = LOOKUP_USAGE_MAP[lookupModel];
  if (!relations || relations.length === 0) {
    return { hasDependencies: false, dependencies: [], totalDependencies: 0 };
  }
  return checkDependencies(lookupModel, recordId, relations);
}
