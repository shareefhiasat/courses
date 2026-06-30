/**
 * User preferences — dashboard widget layouts stored in user_preferences.settings JSON.
 */

import prisma from './prismaClient.js';


function emptyDashboardPayload() {
  return { widgets: [], pinnedIds: [] };
}

export async function getDashboardPreferences(userId, dashboardKey) {
  const row = await prisma.userPreferences.findUnique({
    where: { userId },
    select: { settings: true },
  });

  const dashboards = row?.settings?.dashboards || {};
  const entry = dashboards[dashboardKey];

  return {
    success: true,
    data: entry?.widgets?.length ? entry : emptyDashboardPayload(),
  };
}

export async function saveDashboardPreferences(userId, dashboardKey, payload, actorId) {
  const { widgets = [], pinnedIds = [] } = payload || {};

  const existing = await prisma.userPreferences.findUnique({
    where: { userId },
    select: { id: true, settings: true },
  });

  const settings = existing?.settings && typeof existing.settings === 'object'
    ? { ...existing.settings }
    : {};

  settings.dashboards = {
    ...(settings.dashboards || {}),
    [dashboardKey]: {
      widgets,
      pinnedIds,
      updatedAt: new Date().toISOString(),
    },
  };

  if (existing) {
    await prisma.userPreferences.update({
      where: { userId },
      data: {
        settings,
        updatedBy: actorId || userId,
      },
    });
  } else {
    await prisma.userPreferences.create({
      data: {
        userId,
        settings,
        createdBy: actorId || userId,
        updatedBy: actorId || userId,
      },
    });
  }

  return { success: true, data: { widgets, pinnedIds } };
}

export async function deleteDashboardPreferences(userId, dashboardKey, actorId) {
  const existing = await prisma.userPreferences.findUnique({
    where: { userId },
    select: { id: true, settings: true },
  });

  if (!existing?.settings?.dashboards?.[dashboardKey]) {
    return { success: true, data: emptyDashboardPayload() };
  }

  const settings = { ...existing.settings };
  const dashboards = { ...(settings.dashboards || {}) };
  delete dashboards[dashboardKey];
  settings.dashboards = dashboards;

  await prisma.userPreferences.update({
    where: { userId },
    data: { settings, updatedBy: actorId || userId },
  });

  return { success: true, data: emptyDashboardPayload() };
}

export async function getTypographyPreferences(userId) {
  const row = await prisma.userPreferences.findUnique({
    where: { userId },
    select: { settings: true },
  });

  const typography = row?.settings?.typography || null;

  return {
    success: true,
    data: typography,
  };
}

export async function saveTypographyPreferences(userId, payload, actorId) {
  const { fontLtr, fontRtl, textSize } = payload || {};

  const existing = await prisma.userPreferences.findUnique({
    where: { userId },
    select: { id: true, settings: true },
  });

  const settings = existing?.settings && typeof existing.settings === 'object'
    ? { ...existing.settings }
    : {};

  settings.typography = {
    ...(settings.typography || {}),
    fontLtr,
    fontRtl,
    textSize,
    updatedAt: new Date().toISOString(),
  };

  if (existing) {
    await prisma.userPreferences.update({
      where: { userId },
      data: {
        settings,
        updatedBy: actorId || userId,
      },
    });
  } else {
    await prisma.userPreferences.create({
      data: {
        userId,
        settings,
        createdBy: actorId || userId,
        updatedBy: actorId || userId,
      },
    });
  }

  return { success: true, data: settings.typography };
}
