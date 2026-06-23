/**
 * Maps a Prisma Notification record to the frontend-expected shape.
 * Frontend expects: id, type, title, message, data, link, isRead, isArchived, createdAt, priority, event
 */
export function mapNotification(prismaNotification) {
  if (!prismaNotification) return null;
  return {
    id: prismaNotification.id,
    type: prismaNotification.category,
    category: prismaNotification.category,
    event: prismaNotification.event,
    priority: prismaNotification.priority,
    title: prismaNotification.titleEn,
    titleEn: prismaNotification.titleEn,
    titleAr: prismaNotification.titleAr,
    message: prismaNotification.bodyEn,
    bodyEn: prismaNotification.bodyEn,
    bodyAr: prismaNotification.bodyAr,
    link: prismaNotification.link,
    data: prismaNotification.metadata,
    metadata: prismaNotification.metadata,
    isRead: prismaNotification.isRead,
    readAt: prismaNotification.readAt,
    isArchived: prismaNotification.isArchived,
    archivedAt: prismaNotification.archivedAt,
    groupKey: prismaNotification.groupKey,
    createdById: prismaNotification.createdById,
    createdAt: prismaNotification.createdAt,
  };
}

export function mapNotifications(prismaNotifications) {
  if (!Array.isArray(prismaNotifications)) return [];
  return prismaNotifications.map(mapNotification);
}
