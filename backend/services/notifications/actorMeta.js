import prisma from '../../db/prismaClient.js';

const ROLE_PRIORITY = ['super_admin', 'admin', 'hr', 'instructor', 'student'];

function inferRoleFromEmail(email) {
  if (!email) return null;
  const e = email.toLowerCase();
  if (e.includes('superadmin')) return 'super_admin';
  if (e.includes('admin')) return 'admin';
  if (e.includes('hr')) return 'hr';
  if (e.includes('instructor')) return 'instructor';
  if (e.includes('student')) return 'student';
  return null;
}

function resolveRole(user) {
  if (!user) return null;
  if (user.role) return String(user.role).toLowerCase();

  const fromRoleArray = (codes) => {
    if (!codes?.length) return null;
    const lowerCodes = codes.map((c) => c?.toLowerCase?.() || c).filter(Boolean);
    for (const p of ROLE_PRIORITY) {
      if (lowerCodes.includes(p)) return p;
    }
    return lowerCodes[0];
  };

  if (Array.isArray(user.roleAssignments) && user.roleAssignments.length > 0) {
    const code = fromRoleArray(user.roleAssignments.map((ra) => ra?.role?.code));
    if (code) return code;
  }
  if (Array.isArray(user.roles) && user.roles.length > 0) {
    const code = fromRoleArray(user.roles);
    if (code) return code;
  }

  if (user.isSuperAdmin) return 'super_admin';
  if (user.isAdmin) return 'admin';
  if (user.isHR) return 'hr';
  if (user.isInstructor) return 'instructor';
  if (user.isStudent) return 'student';

  return inferRoleFromEmail(user.email);
}

function buildEnglishName(user) {
  if (user.displayName?.trim()) return user.displayName.trim();
  if (user.firstName?.trim() || user.lastName?.trim()) {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim();
  }
  if (user.realName?.trim()) return user.realName.trim();
  if (user.email) return user.email;
  return 'Unknown User';
}

function buildArabicName(user) {
  if (user.displayNameAr?.trim()) return user.displayNameAr.trim();
  if (user.firstNameAr?.trim() || user.lastNameAr?.trim()) {
    return `${user.firstNameAr || ''} ${user.lastNameAr || ''}`.trim();
  }
  if (user.realNameAr?.trim()) return user.realNameAr.trim();
  if (user.displayName?.trim()) return user.displayName.trim();
  if (user.firstName?.trim() || user.lastName?.trim()) {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim();
  }
  if (user.email) return user.email;
  return 'Unknown User';
}

export function buildActorMeta(actor) {
  if (!actor) return {};

  const senderName = buildEnglishName(actor);
  const senderNameAr = buildArabicName(actor);
  const senderRole = resolveRole(actor);
  const keycloakId = actor.keycloakId || null;
  const userId = actor.id || actor.dbId || null;
  const senderImage = (keycloakId ? `/api/v1/user-images/proxy/${keycloakId}/profile` : null) || (userId ? `/api/v1/user-images/proxy/${userId}/profile` : null);

  const sender = {
    id: userId,
    keycloakId,
    email: actor.email || null,
    displayName: actor.displayName || null,
    displayNameAr: actor.displayNameAr || null,
    realName: actor.realName || null,
    firstName: actor.firstName || null,
    lastName: actor.lastName || null,
    firstNameAr: actor.firstNameAr || null,
    lastNameAr: actor.lastNameAr || null,
    profileImageUrl: actor.profileImageUrl || actor.additionalImageUrl || null,
    updatedAt: actor.updatedAt || actor.updated_at || null,
    role: actor.role ? String(actor.role).toLowerCase() : senderRole,
    roleAssignments: Array.isArray(actor.roleAssignments)
      ? actor.roleAssignments
          .filter((ra) => ra?.role?.code)
          .map((ra) => ({ role: { code: ra.role.code } }))
      : [],
  };

  return {
    sender,
    senderName,
    senderNameAr,
    senderId: userId,
    senderKeycloakId: keycloakId,
    senderImage,
    senderRole,
  };
}

export async function resolveActor(actor) {
  if (!actor) return null;
  if (actor.displayName && Array.isArray(actor.roleAssignments) && actor.roleAssignments.length > 0) {
    return actor;
  }

  const id = actor.dbId ?? actor.id ?? null;
  const keycloakId = actor.keycloakId ?? null;
  const or = [];
  if (id) or.push({ id });
  if (keycloakId) or.push({ keycloakId });
  if (or.length === 0) return actor;

  try {
    const user = await prisma.user.findFirst({
      where: { OR: or },
      include: { roleAssignments: { include: { role: { select: { code: true } } } } },
    });
    return user || actor;
  } catch (error) {
    console.error('[resolveActor] failed', error.message);
    return actor;
  }
}
