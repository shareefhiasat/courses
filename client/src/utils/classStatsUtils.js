import { getEnrollments } from '@services/business/enrollmentService.js';
import { getPenalties } from '@services/business/penaltyService.js';
import { getBehaviors } from '@services/business/behaviorService.js';
import { getAllQuizzes } from '@services/business/quizService.js';
import { getActivities } from '@services/business/activitiesService.js';
import { getAnnouncements } from '@services/business/announcementService.js';
import { getResources } from '@services/business/resourceService.js';
import { formatWorkloadSessionTime } from './schedulingDisplayUtils.js';

function classIdOf(item) {
  return item?.docId ?? item?.id;
}

function matchesClassId(recordClassId, classId) {
  if (recordClassId == null || classId == null) return false;
  return String(recordClassId) === String(classId);
}

/** Build per-class stats map (enrollments, activities, resources, etc.). */
export async function fetchClassStatsMap(classList, options = {}) {
  const { scheduledSessions = [] } = options;
  const stats = {};

  if (!classList?.length) return stats;

  const classIds = classList.map(classIdOf).filter(Boolean);
  if (!classIds.length) return stats;

  const [
    enrollmentsRes,
    penaltiesRes,
    behaviorsRes,
    quizzesRes,
    activitiesRes,
    announcementsRes,
    resourcesRes
  ] = await Promise.all([
    getEnrollments().catch(() => ({ success: false, data: [] })),
    getPenalties().catch(() => ({ success: false, data: [] })),
    getBehaviors().catch(() => ({ success: false, data: [] })),
    getAllQuizzes().catch(() => ({ success: false, data: [] })),
    getActivities().catch(() => ({ success: false, data: [] })),
    getAnnouncements().catch(() => ({ success: false, data: [] })),
    getResources().catch(() => ({ success: false, data: [] }))
  ]);

  for (const classId of classIds) {
    const classEnrollments = enrollmentsRes.success
      ? enrollmentsRes.data.filter((e) => matchesClassId(e.classId, classId))
      : [];
    const classPenalties = penaltiesRes.success
      ? penaltiesRes.data.filter((p) => matchesClassId(p.classId, classId))
      : [];
    const classBehaviors = behaviorsRes.success
      ? behaviorsRes.data.filter((b) => matchesClassId(b.classId, classId))
      : [];
    const classQuizzes = quizzesRes.success
      ? quizzesRes.data.filter((q) => matchesClassId(q.classId, classId))
      : [];
    const classActivities = activitiesRes.success
      ? activitiesRes.data.filter((a) => matchesClassId(a.classId, classId))
      : [];
    const classAnnouncements = announcementsRes.success
      ? announcementsRes.data.filter((a) => matchesClassId(a.classId, classId))
      : [];
    const classResources = resourcesRes.success
      ? resourcesRes.data.filter((r) => matchesClassId(r.classId, classId))
      : [];
    const classSessions = scheduledSessions.filter((s) => matchesClassId(s.classId, classId));
    const activeSessions = classSessions.filter((s) => s.status !== 'cancelled');
    const sortedSessions = [...activeSessions].sort(
      (a, b) => new Date(a.startDateTime) - new Date(b.startDateTime)
    );
    const now = new Date();
    const upcoming = sortedSessions.filter((s) => new Date(s.startDateTime) >= now);
    const nextSession = upcoming[0] || sortedSessions[sortedSessions.length - 1] || null;

    stats[classId] = {
      students: classEnrollments.length,
      penalties: classPenalties.length,
      behaviors: classBehaviors.length,
      quizzes: classQuizzes.length,
      activities: classActivities.length,
      announcements: classAnnouncements.length,
      resources: classResources.length,
      sessions: activeSessions.length,
      nextSessionAt: nextSession?.startDateTime || null,
      sessionList: sortedSessions.map((s) => ({
        id: s.id,
        startDateTime: s.startDateTime,
        endDateTime: s.endDateTime,
        status: s.status
      }))
    };
  }

  return stats;
}

/** One-line schedule summary (count + next session). */
export function formatClassScheduleSummary(clsId, classStats, lang, t) {
  const stats = classStats?.[clsId];
  const count = stats?.sessions ?? 0;
  if (count <= 0) return t('classcard_no_scheduled_sessions');
  return t('classcard_scheduled_count', { count });
}

export function formatClassSessionTime(startDateTime, lang) {
  return formatWorkloadSessionTime(startDateTime, lang);
}

export function getClassYears(classes) {
  const years = new Set();
  for (const cls of classes) {
    if (cls.year) years.add(String(cls.year));
    else if (cls.term?.includes(' ')) {
      const parts = cls.term.split(' ');
      const yearPart = parts[parts.length - 1];
      if (yearPart && !Number.isNaN(Number(yearPart))) years.add(yearPart);
    }
  }
  return [...years].sort((a, b) => Number(b) - Number(a));
}
