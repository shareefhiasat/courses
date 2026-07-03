/**
 * User data scope profile + explicit grants (visibility lens layer).
 */

import prisma from './prismaClient.js';

const DEFAULT_PROFILE = {
  programsMode: 'UCA',
  subjectsMode: 'UCA',
  classesMode: 'UCA',
  instructorsMode: 'ALL',
  roomsMode: 'ALL',
};

const GRANT_INCLUDE = {
  instructor: {
    select: {
      id: true, displayName: true, firstName: true, lastName: true, displayNameAr: true,
    },
  },
  classroom: { select: { id: true, code: true, nameEn: true, nameAr: true } },
  program: { select: { id: true, code: true, nameEn: true, nameAr: true } },
  subject: { select: { id: true, code: true, nameEn: true, nameAr: true } },
  class: { select: { id: true, code: true, nameEn: true, nameAr: true } },
};

export async function getOrCreateProfile(userId) {
  let profile = await prisma.userDataScopeProfile.findUnique({ where: { userId } });
  if (!profile) {
    profile = await prisma.userDataScopeProfile.create({
      data: { userId, ...DEFAULT_PROFILE },
    });
  }
  return profile;
}

export async function getFullUserDataScope(userId) {
  const [profile, instructorGrants, roomGrants, programGrants, subjectGrants, classGrants] = await Promise.all([
    getOrCreateProfile(userId),
    prisma.userInstructorGrant.findMany({
      where: { userId, isActive: true },
      include: { instructor: GRANT_INCLUDE.instructor },
    }),
    prisma.userRoomGrant.findMany({
      where: { userId, isActive: true },
      include: { classroom: GRANT_INCLUDE.classroom },
    }),
    prisma.userProgramGrant.findMany({
      where: { userId, isActive: true },
      include: { program: GRANT_INCLUDE.program },
    }),
    prisma.userSubjectGrant.findMany({
      where: { userId, isActive: true },
      include: { subject: GRANT_INCLUDE.subject },
    }),
    prisma.userClassGrant.findMany({
      where: { userId, isActive: true },
      include: { class: GRANT_INCLUDE.class },
    }),
  ]);

  return {
    profile,
    grants: {
      instructors: instructorGrants,
      rooms: roomGrants,
      programs: programGrants,
      subjects: subjectGrants,
      classes: classGrants,
    },
  };
}

export async function upsertProfile(userId, payload = {}, actorId = null) {
  const data = {};
  const fields = ['programsMode', 'subjectsMode', 'classesMode', 'instructorsMode', 'roomsMode', 'notes'];
  fields.forEach((f) => {
    if (payload[f] !== undefined) data[f] = payload[f];
  });
  if (actorId) data.updatedBy = actorId;

  const profile = await prisma.userDataScopeProfile.upsert({
    where: { userId },
    create: { userId, ...DEFAULT_PROFILE, ...data, createdBy: actorId },
    update: data,
  });
  return { success: true, data: profile };
}

async function syncGrants(model, userId, idField, ids = []) {
  const uniqueIds = [...new Set((ids || []).map(Number).filter(Boolean))];
  await prisma[model].updateMany({ where: { userId }, data: { isActive: false } });
  for (const id of uniqueIds) {
    const existing = await prisma[model].findFirst({ where: { userId, [idField]: id } });
    if (existing) {
      await prisma[model].update({ where: { id: existing.id }, data: { isActive: true } });
    } else {
      await prisma[model].create({ data: { userId, [idField]: id, isActive: true } });
    }
  }
}

export async function saveUserDataScope(userId, payload = {}, actorId = null) {
  const { profile: profilePayload, grants = {} } = payload;
  if (profilePayload) {
    await upsertProfile(userId, profilePayload, actorId);
  }
  if (grants.instructorIds !== undefined) {
    await syncGrants('userInstructorGrant', userId, 'instructorUserId', grants.instructorIds);
  }
  if (grants.roomIds !== undefined) {
    await syncGrants('userRoomGrant', userId, 'classroomId', grants.roomIds);
  }
  if (grants.programIds !== undefined) {
    await syncGrants('userProgramGrant', userId, 'programId', grants.programIds);
  }
  if (grants.subjectIds !== undefined) {
    await syncGrants('userSubjectGrant', userId, 'subjectId', grants.subjectIds);
  }
  if (grants.classIds !== undefined) {
    await syncGrants('userClassGrant', userId, 'classId', grants.classIds);
  }
  const full = await getFullUserDataScope(userId);
  return { success: true, data: full };
}

export default {
  getOrCreateProfile,
  getFullUserDataScope,
  upsertProfile,
  saveUserDataScope,
};
