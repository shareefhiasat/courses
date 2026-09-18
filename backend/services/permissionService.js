/**
 * Permission Service — single source of truth for file & folder ACL checks.
 *
 * Resolution order (first match wins, most permissive wins among direct ACLs):
 *   1. Owner                              → EDIT
 *   2. Super-admin role on the actor      → EDIT
 *   3. Direct user share on the FILE      → share.permission
 *   4. Direct role share on the FILE      → share.permission (user must have role)
 *   5. Direct user share on the FOLDER    → inherit for children files
 *   6. Direct role share on the FOLDER    → inherit for children files
 *   7. Ancestor folder share (recursive)  → inherit
 *   8. Denied
 *
 * Permission hierarchy: VIEW < DOWNLOAD < COMMENT < EDIT. `hasLevel` returns
 * true iff the granted permission is at least the required level.
 */

import prisma from '../db/prismaClient.js';
import { getAncestorIds } from './folderService.js';
import { hasRole, normalizeRoles } from '../utils/roleUtils.js';
import { LMS_ROLES as ROLES } from './keycloakAdminService.js';


const RANK = { VIEW: 1, DOWNLOAD: 2, COMMENT: 3, EDIT: 4 };

function actorIsSuperAdmin(roles = []) {
  return hasRole(roles, ROLES.SUPER_ADMIN);
}

function normalizeActorRoles(roles = []) {
  return normalizeRoles(roles).map((r) => String(r).toLowerCase());
}

function actorIsAdminOrHr(roles = []) {
  return hasRole(roles, ROLES.ADMIN) || hasRole(roles, ROLES.HR);
}

const WORKFLOW_OVERSIGHT_STATUSES = new Set([
  'DRAFT',
  'SUBMITTED',
  'UNDER_ADMIN_REVIEW',
  'UNDER_HR_REVIEW',
  'APPROVED',
  'REJECTED',
]);

const ok = (permission) => ({ allowed: true, permission });
const deny = (reason = 'no_matching_share') => ({ allowed: false, reason });

/**
 * @param {'VIEW'|'DOWNLOAD'|'COMMENT'|'EDIT'} granted
 * @param {'VIEW'|'DOWNLOAD'|'COMMENT'|'EDIT'} required
 */
export function hasLevel(granted, required) {
  return (RANK[granted] || 0) >= (RANK[required] || 0);
}

/**
 * Resolve a user's permission on a file (including inherited folder shares).
 *
 * @param {string} fileId
 * @param {object} actor - { userId, roles[] }
 * @returns {Promise<{ allowed: boolean, permission?: string, reason?: string }>}
 */
export async function canAccessFile(fileId, actor) {
  if (!actor?.userId) return deny('no_actor');

  const file = await prisma.file.findUnique({
    where: { id: fileId },
    select: {
      id: true,
      ownerId: true,
      folderId: true,
      isDeleted: true,
    },
  });
  if (!file || file.isDeleted) return deny('file_not_found');
  const actorUserId = Number(actor.userId);
  if (Number.isNaN(actorUserId)) return deny('no_actor');

  if (file.ownerId === actorUserId) return ok('EDIT');
  if (actorIsSuperAdmin(actor.roles)) return ok('EDIT');

  // Check if user is a workflow participant via WorkflowDocument (simple workflow system)
  const workflowDoc = await prisma.workflowDocument.findFirst({
    where: { OR: [{ fileId }, { snapshotFileId: fileId }, { signedFileId: fileId }] },
    select: {
      submitterId: true,
      currentAssigneeId: true,
      status: true,
      workflowCategory: true,
      attendanceSubtype: true,
    },
  });

  if (workflowDoc) {
    const isSubmitter = workflowDoc.submitterId === actorUserId;
    const isAssignee = workflowDoc.currentAssigneeId === actorUserId;

    if (isSubmitter || isAssignee) {
      return ok('COMMENT');
    }

    const docStatus = String(workflowDoc.status || '').toUpperCase();
    if (actorIsAdminOrHr(actor.roles) && WORKFLOW_OVERSIGHT_STATUSES.has(docStatus)) {
      return ok('DOWNLOAD');
    }
  }

  // Check if user is a workflow participant via WorkflowInstance (engine-based workflow)
  const workflowInstance = await prisma.workflowInstance.findFirst({
    where: { fileId },
    select: {
      initiatedById: true,
      assignedUserId: true,
      assignedRole: true,
      steps: {
        select: {
          assignedUserId: true,
          actedById: true,
          assignedRole: true,
        },
      },
    },
  });

  if (workflowInstance) {
    const isInitiator = workflowInstance.initiatedById === actorUserId;
    const isDirectAssignee = workflowInstance.assignedUserId === actorUserId;
    const actorRolesUpper = normalizeActorRoles(actor.roles).map((r) => r.toUpperCase());
    const instanceRoleUpper = workflowInstance.assignedRole?.toUpperCase();
    const isRoleAssignee = instanceRoleUpper && actorRolesUpper.includes(instanceRoleUpper);
    const isStepAssignee = workflowInstance.steps.some(step => step.assignedUserId === actorUserId);
    const isStepRoleAssignee = workflowInstance.steps.some((step) => {
      const stepRole = step.assignedRole?.toUpperCase();
      return stepRole && actorRolesUpper.includes(stepRole);
    });
    const isActor = workflowInstance.steps.some(step => step.actedById === actorUserId);

    if (isInitiator || isDirectAssignee || isRoleAssignee || isStepAssignee || isStepRoleAssignee || isActor) {
      return ok('COMMENT'); // Workflow participants get COMMENT access (includes VIEW + DOWNLOAD + COMMENT)
    }
  }

  const now = new Date();

  // Direct file shares (user OR role).
  const direct = await prisma.fileShare.findMany({
    where: {
      fileId,
      OR: [
        { subjectType: 'USER', subjectUserId: actorUserId },
        {
          subjectType: 'ROLE',
          subjectRole: { in: normalizeActorRoles(actor.roles) },
        },
      ],
      AND: [
        { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      ],
    },
    select: { permission: true },
  });
  const directBest = bestRank(direct);
  if (directBest) return ok(directBest);

  // Ancestor folder shares.
  if (file.folderId) {
    const ancestors = await getAncestorIds(file.folderId);
    if (ancestors.length > 0) {
      const folderShares = await prisma.fileShare.findMany({
        where: {
          folderId: { in: ancestors },
          OR: [
            { subjectType: 'USER', subjectUserId: actorUserId },
            { subjectType: 'ROLE', subjectRole: { in: normalizeActorRoles(actor.roles) } },
          ],
          AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }],
        },
        select: { permission: true },
      });
      const inheritedBest = bestRank(folderShares);
      if (inheritedBest) return ok(inheritedBest);
    }
  }

  return deny();
}

/**
 * Folder variant of canAccessFile — owner/super-admin/direct/ancestor lookup.
 */
export async function canAccessFolder(folderId, actor) {
  if (!actor?.userId) return deny('no_actor');
  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    select: { id: true, ownerId: true, isDeleted: true },
  });
  if (!folder || folder.isDeleted) return deny('folder_not_found');
  const actorUserId = Number(actor.userId);
  if (Number.isNaN(actorUserId)) return deny('no_actor');

  if (folder.ownerId === actorUserId) return ok('EDIT');
  if (actorIsSuperAdmin(actor.roles)) return ok('EDIT');

  const now = new Date();
  const ancestors = await getAncestorIds(folderId);
  const scope = [folderId, ...ancestors.filter((a) => a !== folderId)];
  const rows = await prisma.fileShare.findMany({
    where: {
      folderId: { in: scope },
      OR: [
        { subjectType: 'USER', subjectUserId: actorUserId },
        { subjectType: 'ROLE', subjectRole: { in: normalizeActorRoles(actor.roles) } },
      ],
      AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }],
    },
    select: { permission: true },
  });
  const best = bestRank(rows);
  return best ? ok(best) : deny();
}

/**
 * Require a specific permission level for a file; throws HTTP-friendly errors.
 */
export async function requireFilePermission(fileId, actor, requiredLevel = 'VIEW') {
  const result = await canAccessFile(fileId, actor);
  if (!result.allowed) {
    const status = result.reason === 'file_not_found' ? 404 : 403;
    const err = new Error(result.reason || 'forbidden');
    err.status = status;
    err.code = result.reason === 'file_not_found' ? 'FILE_NOT_FOUND' : 'ACCESS_DENIED';
    throw err;
  }
  if (!hasLevel(result.permission, requiredLevel)) {
    const err = new Error(`Required ${requiredLevel}, granted ${result.permission}`);
    err.status = 403;
    err.code = 'INSUFFICIENT_PERMISSION';
    throw err;
  }
  return result.permission;
}

// -- helpers ----------------------------------------------------------------

function bestRank(shares) {
  let best = null;
  for (const s of shares) {
    if (!best || (RANK[s.permission] || 0) > (RANK[best] || 0)) best = s.permission;
  }
  return best;
}

export default {
  hasLevel,
  canAccessFile,
  canAccessFolder,
  requireFilePermission,
};
