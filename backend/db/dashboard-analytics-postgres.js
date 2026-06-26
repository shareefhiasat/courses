/**
 * Dashboard Analytics DB Service
 * Aggregates drive, workflow, and activity metrics for dashboard widgets.
 * Role-based: HR/Super Admin see all, Admin/Instructor see own data only.
 */

import prisma from './prismaClient.js';


/**
 * Get drive analytics (files, folders, file types, sizes, activity)
 * @param {object} opts - { userId, role, scope }
 */
async function getDriveAnalytics({ userId, role, scope = 'all' }) {
  const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'HR';
  const fileWhere = { isDeleted: false };
  const folderWhere = { isDeleted: false };

  if (!isAdmin) {
    fileWhere.ownerId = userId;
    folderWhere.ownerId = userId;
  }

  const [totalFiles, totalFolders, totalStorageSize, filesByMime, filesByBucket, fileActivities, recentFiles, storageByUserRaw] = await Promise.all([
    prisma.file.count({ where: fileWhere }),
    prisma.folder.count({ where: folderWhere }),
    prisma.file.aggregate({ where: fileWhere, _sum: { size: true } }),
    prisma.file.groupBy({ by: ['mimeType'], where: fileWhere, _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 20 }),
    prisma.file.groupBy({ by: ['bucket'], where: fileWhere, _count: { id: true } }),
    prisma.fileActivity.groupBy({
      by: ['action'],
      where: isAdmin ? {} : { userId },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20,
    }),
    prisma.file.findMany({
      where: fileWhere,
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, name: true, mimeType: true, size: true, bucket: true, createdAt: true, ownerId: true, folderId: true },
    }),
    isAdmin ? prisma.file.groupBy({
      by: ['ownerId'],
      where: { isDeleted: false },
      _sum: { size: true },
      _count: { id: true },
      orderBy: { _sum: { size: 'desc' } },
      take: 50,
    }) : Promise.resolve([]),
  ]);

  // Resolve owner names for storage by user
  let storageByUser = [];
  if (isAdmin && storageByUserRaw.length > 0) {
    const ownerIds = storageByUserRaw.map(s => s.ownerId).filter(Boolean);
    const owners = await prisma.user.findMany({
      where: { id: { in: ownerIds } },
      select: { id: true, displayName: true, email: true },
    }).catch(() => []);
    const ownerMap = new Map(owners.map(o => [o.id, o]));
    storageByUser = storageByUserRaw
      .map(s => {
        const owner = ownerMap.get(s.ownerId);
        const totalBytes = s._sum.size || 0;
        return {
          ownerId: s.ownerId,
          label: owner?.displayName || owner?.email || `User ${s.ownerId}`,
          totalStorageSize: totalBytes,
          storageMB: Math.round((totalBytes / (1024 * 1024)) * 100) / 100,
          fileCount: s._count.id,
        };
      })
      .filter(s => s.totalStorageSize > 0);
  }

  const MIME_TO_EXT = {
    'application/pdf': 'PDF',
    'image/png': 'PNG',
    'image/jpeg': 'JPG',
    'image/jpg': 'JPG',
    'image/gif': 'GIF',
    'image/webp': 'WEBP',
    'image/svg+xml': 'SVG',
    'image/bmp': 'BMP',
    'image/tiff': 'TIFF',
    'video/mp4': 'MP4',
    'video/webm': 'WEBM',
    'video/avi': 'AVI',
    'video/mov': 'MOV',
    'video/quicktime': 'MOV',
    'audio/mpeg': 'MP3',
    'audio/mp3': 'MP3',
    'audio/wav': 'WAV',
    'audio/ogg': 'OGG',
    'application/msword': 'DOC',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/vnd.ms-excel': 'XLS',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
    'application/vnd.ms-powerpoint': 'PPT',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
    'application/zip': 'ZIP',
    'application/x-zip-compressed': 'ZIP',
    'application/x-rar-compressed': 'RAR',
    'application/x-7z-compressed': '7Z',
    'application/json': 'JSON',
    'application/xml': 'XML',
    'text/xml': 'XML',
    'text/plain': 'TXT',
    'text/csv': 'CSV',
    'text/html': 'HTML',
    'text/css': 'CSS',
    'text/javascript': 'JS',
    'application/javascript': 'JS',
    'application/x-pdf': 'PDF',
    'application/octet-stream': 'FILE',
  };

  function mimeToExt(mime) {
    if (!mime) return 'FILE';
    const lower = mime.toLowerCase();
    if (MIME_TO_EXT[lower]) return MIME_TO_EXT[lower];
    const parts = lower.split('/');
    if (parts.length > 1) {
      let ext = parts[parts.length - 1];
      ext = ext.replace(/^x-/, '').replace(/^\./, '');
      return ext.toUpperCase();
    }
    return mime.toUpperCase();
  }

  const mimeTypeGroups = filesByMime.map(m => ({
    mimeType: m.mimeType,
    label: mimeToExt(m.mimeType),
    fileCount: m._count.id,
  }));

  const bucketGroups = filesByBucket.map(b => ({
    bucket: b.bucket,
    label: b.bucket,
    fileCount: b._count.id,
  }));

  const activityGroups = fileActivities.map(a => ({
    action: a.action,
    label: a.action,
    activityCount: a._count.id,
  }));

  const totalSize = totalStorageSize._sum.size || 0;

  return {
    overview: {
      totalFiles,
      totalFolders,
      totalStorageSize: totalSize,
      totalActivities: fileActivities.reduce((s, a) => s + a._count.id, 0),
      uniqueMimeTypes: filesByMime.length,
      buckets: filesByBucket.length,
    },
    filesByMimeType: mimeTypeGroups,
    filesByBucket: bucketGroups,
    fileActivities: activityGroups,
    recentFiles,
    storageByUser,
  };
}

/**
 * Get workflow analytics
 * @param {object} opts - { userId, role, scope }
 */
async function getWorkflowAnalytics({ userId, role, scope = 'all' }) {
  const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'HR';
  const docWhere = {};

  if (!isAdmin) {
    docWhere.OR = [
      { submitterId: userId },
      { instructorId: userId },
      { currentAssigneeId: userId },
    ];
  }

  const [totalDocs, docsByStatus, docsByType, docsByProgram, recentDocs, timelineDocs] = await Promise.all([
    prisma.workflowDocument.count({ where: docWhere }),
    prisma.workflowDocument.groupBy({ by: ['status'], where: docWhere, _count: { id: true } }),
    prisma.workflowDocument.groupBy({ by: ['workflowType'], where: docWhere, _count: { id: true } }),
    prisma.workflowDocument.groupBy({ by: ['program'], where: docWhere, _count: { id: true } }),
    prisma.workflowDocument.findMany({
      where: docWhere,
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, title: true, status: true, workflowType: true, program: true, subject: true, createdAt: true, submitterId: true },
    }),
    prisma.workflowDocument.findMany({
      where: docWhere,
      orderBy: { createdAt: 'asc' },
      select: { id: true, status: true, workflowType: true, createdAt: true },
    }),
  ]);

  const statusGroups = docsByStatus.map(s => ({
    status: s.status,
    label: s.status,
    documentCount: s._count.id,
  }));

  const typeGroups = docsByType.map(t => ({
    workflowType: t.workflowType,
    label: t.workflowType,
    documentCount: t._count.id,
  }));

  const programGroups = docsByProgram
    .filter(p => p.program)
    .map(p => ({
      program: p.program,
      label: p.program,
      documentCount: p._count.id,
    }));

  // Build timeline by day
  const timelineMap = new Map();
  for (const doc of timelineDocs) {
    const date = new Date(doc.createdAt).toISOString().split('T')[0];
    if (!timelineMap.has(date)) {
      timelineMap.set(date, { date, documentCount: 0 });
    }
    timelineMap.get(date).documentCount++;
  }
  const workflowTimeline = [...timelineMap.values()].sort((a, b) => a.date.localeCompare(b.date));

  const approved = docsByStatus.find(s => s.status === 'APPROVED')?._count.id || 0;
  const rejected = docsByStatus.filter(s => s.status === 'REJECTED' || s.status === 'AMENDED').reduce((sum, s) => sum + s._count.id, 0);
  const pending = docsByStatus.filter(s => s.status === 'DRAFT' || s.status === 'SUBMITTED' || s.status === 'UNDER_REVIEW' || s.status === 'UNDER_HR_REVIEW' || s.status === 'UNDER_ADMIN_REVIEW').reduce((sum, s) => sum + s._count.id, 0);

  return {
    overview: {
      totalDocuments: totalDocs,
      approvedCount: approved,
      rejectedCount: rejected,
      pendingCount: pending,
      workflowTypes: docsByType.length,
      approvalRate: totalDocs > 0 ? Math.round((approved / totalDocs) * 10000) / 100 : 0,
    },
    workflowByStatus: statusGroups,
    workflowByType: typeGroups,
    workflowByProgram: programGroups,
    workflowTimeline,
    recentDocuments: recentDocs,
  };
}

/**
 * Get activity/submission/resource analytics
 * @param {object} opts - { userId, role, scope, classId }
 */
async function getActivityAnalytics({ userId, role, scope = 'all', classId }) {
  const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'HR';
  const isInstructor = role === 'INSTRUCTOR';

  // For instructors, filter to their classes
  let classFilter = {};
  if (isInstructor) {
    // Get instructor's classes
    const enrollments = await prisma.enrollment.findMany({
      where: { instructorId: userId, status: 'active' },
      select: { classId: true },
    });
    const classIds = enrollments.map(e => e.classId).filter(Boolean);
    classFilter = { classId: { in: classIds } };
  } else if (!isAdmin && userId) {
    // For students, filter to their enrollments
    const enrollments = await prisma.enrollment.findMany({
      where: { userId, status: 'active' },
      select: { classId: true },
    });
    const classIds = enrollments.map(e => e.classId).filter(Boolean);
    classFilter = { classId: { in: classIds } };
  }

  if (classId) {
    classFilter = { classId: parseInt(classId) };
  }

  const [totalActivities, activitiesByType, totalSubmissions, submissionsByStatus, totalResources, resourcesByType, recentActivities, recentSubmissions] = await Promise.all([
    prisma.activity.count({ where: { isActive: true, ...classFilter } }),
    prisma.activity.groupBy({
      by: ['typeId'],
      where: { isActive: true, ...classFilter },
      _count: { id: true },
    }),
    prisma.submission.count({
      where: isAdmin ? {} : { userId },
    }),
    prisma.submission.groupBy({
      by: ['statusId'],
      where: isAdmin ? {} : { userId },
      _count: { id: true },
    }),
    prisma.resource.count({ where: { isActive: true, ...(isAdmin ? {} : classFilter) } }),
    prisma.resource.groupBy({
      by: ['typeId'],
      where: { isActive: true, ...(isAdmin ? {} : classFilter) },
      _count: { id: true },
    }),
    prisma.activity.findMany({
      where: { isActive: true, ...classFilter },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, titleEn: true, titleAr: true, typeId: true, dueDate: true, maxScore: true, weight: true, createdAt: true, classId: true },
    }),
    prisma.submission.findMany({
      where: isAdmin ? {} : { userId },
      orderBy: { submittedAt: 'desc' },
      take: 50,
      select: { id: true, statusId: true, score: true, maxScore: true, submittedAt: true, userId: true, activityId: true },
    }),
  ]);

  // Resolve activity type names
  const typeIds = [...new Set(activitiesByType.map(a => a.typeId))];
  const types = await prisma.activityTypes.findMany({ where: { id: { in: typeIds } } });
  const typeMap = new Map(types.map(t => [t.id, t]));

  const activityTypeGroups = activitiesByType.map(a => {
    const type = typeMap.get(a.typeId);
    return {
      activityType: type?.code || `Type ${a.typeId}`,
      label: type?.nameEn || type?.code || `Type ${a.typeId}`,
      activityCount: a._count.id,
    };
  });

  // Resolve submission status names
  const statusIds = [...new Set(submissionsByStatus.map(s => s.statusId))];
  const statuses = await prisma.submissionStatusTypes.findMany({ where: { id: { in: statusIds } } });
  const statusMap = new Map(statuses.map(s => [s.id, s]));

  const submissionStatusGroups = submissionsByStatus.map(s => {
    const status = statusMap.get(s.statusId);
    return {
      status: status?.code || `Status ${s.statusId}`,
      label: status?.nameEn || status?.code || `Status ${s.statusId}`,
      submissionCount: s._count.id,
    };
  });

  // Resolve resource type names
  const resourceTypeIds = [...new Set(resourcesByType.map(r => r.typeId))];
  const resourceTypes = await prisma.resourceTypes.findMany({ where: { id: { in: resourceTypeIds } } }).catch(() => []);
  const resourceTypeMap = new Map(resourceTypes.map(t => [t.id, t]));

  const resourceTypeGroups = resourcesByType.map(r => {
    const type = resourceTypeMap.get(r.typeId);
    return {
      resourceType: type?.code || `Type ${r.typeId}`,
      label: type?.nameEn || type?.code || `Type ${r.typeId}`,
      resourceCount: r._count.id,
    };
  });

  // Activity timeline
  const activityTimelineMap = new Map();
  for (const act of recentActivities) {
    const date = new Date(act.createdAt).toISOString().split('T')[0];
    if (!activityTimelineMap.has(date)) {
      activityTimelineMap.set(date, { date, activityCount: 0 });
    }
    activityTimelineMap.get(date).activityCount++;
  }
  const activityTimeline = [...activityTimelineMap.values()].sort((a, b) => a.date.localeCompare(b.date));

  // Submission timeline
  const submissionTimelineMap = new Map();
  for (const sub of recentSubmissions) {
    const date = new Date(sub.submittedAt).toISOString().split('T')[0];
    if (!submissionTimelineMap.has(date)) {
      submissionTimelineMap.set(date, { date, submissionCount: 0 });
    }
    submissionTimelineMap.get(date).submissionCount++;
  }
  const submissionTimeline = [...submissionTimelineMap.values()].sort((a, b) => a.date.localeCompare(b.date));

  return {
    overview: {
      totalActivities,
      totalSubmissions,
      totalResources,
      activityTypes: activityTypeGroups.length,
      submissionStatuses: submissionStatusGroups.length,
      resourceTypes: resourceTypeGroups.length,
    },
    activitiesByType: activityTypeGroups,
    submissionsByStatus: submissionStatusGroups,
    resourcesByType: resourceTypeGroups,
    activityTimeline,
    submissionTimeline,
    recentActivities,
    recentSubmissions,
  };
}

/**
 * Get all dashboard analytics in one call
 */
export async function getDashboardAnalytics({ userId, role, classId }) {
  try {
    const [drive, workflow, activity] = await Promise.all([
      getDriveAnalytics({ userId, role }),
      getWorkflowAnalytics({ userId, role }),
      getActivityAnalytics({ userId, role, classId }),
    ]);

    return {
      success: true,
      data: {
        drive,
        workflow,
        activity,
      },
    };
  } catch (err) {
    console.error('[DashboardAnalytics] Error:', err);
    return { success: false, error: err.message };
  }
}

export default {
  getDashboardAnalytics,
  getDriveAnalytics,
  getWorkflowAnalytics,
  getActivityAnalytics,
};
