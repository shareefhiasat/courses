/**
 * Generic Workflow Engine
 *
 * Config-driven workflow system supporting multi-stage approval processes.
 * Each workflow definition specifies stages with role-based approvers.
 * Instances track progress through stages, with history audit trail.
 *
 * Design principles:
 *   - Workflow definitions are data, not code (stored in DB)
 *   - Stages execute sequentially; parallel stages use same `order` value
 *   - Each stage has required approvers (roles) and optional escalation SLA
 *   - Instances are immutable once completed/rejected
 *   - Full audit trail in workflow_history
 */

import { PrismaClient } from '@prisma/client';
import notificationGateway from './notifications/index.js';
import { EVENTS } from './notifications/constants.js';

const prisma = new PrismaClient();

const ok = (payload) => ({ success: true, payload, timestamp: Date.now() });
const err = (code, message) => ({
  success: false,
  error: { code, message },
  timestamp: Date.now(),
});

// --------------------------------------------------------------------------
// Workflow Definition Management
// --------------------------------------------------------------------------

/**
 * Create a new workflow definition with stages.
 *
 * @param {object} input
 * @param {string} input.name - e.g., "Attendance Report Approval"
 * @param {string} input.description
 * @param {string} input.entityType - e.g., "file", "attendance_report"
 * @param {object[]} input.stages - [{name, order, approverRoles[], requiredApprovals, slaHours}]
 * @param {object} actor
 */
export async function createWorkflowDefinition(input, actor) {
  try {
    const { name, description, entityType, stages } = input || {};
    if (!name || !entityType || !stages?.length) {
      return err('INVALID_INPUT', 'name, entityType, and stages required');
    }
    if (!(actor.roles || []).includes('super_admin')) {
      return err('ACCESS_DENIED', 'Only super_admin can create workflow definitions');
    }

    const definition = await prisma.workflowDefinition.create({
      data: {
        name,
        description,
        entityType,
        isActive: true,
        stages: {
          create: stages.map((s) => ({
            name: s.name,
            order: s.order,
            approverRoles: s.approverRoles || [],
            requiredApprovals: s.requiredApprovals || 1,
            slaHours: s.slaHours || null,
          })),
        },
      },
      include: { stages: { orderBy: { order: 'asc' } } },
    });

    return ok(definition);
  } catch (error) {
    console.error('[workflowEngine.createWorkflowDefinition]', error);
    return err('CREATE_DEFINITION_FAILED', error.message);
  }
}

export async function getWorkflowDefinition(definitionId) {
  try {
    const definition = await prisma.workflowDefinition.findUnique({
      where: { id: definitionId },
      include: { stages: { orderBy: { order: 'asc' } } },
    });
    if (!definition) return err('NOT_FOUND', 'Workflow definition not found');
    return ok(definition);
  } catch (error) {
    console.error('[workflowEngine.getWorkflowDefinition]', error);
    return err('GET_DEFINITION_FAILED', error.message);
  }
}

export async function listWorkflowDefinitions(filters = {}) {
  try {
    const { entityType, isActive } = filters;
    const where = {};
    if (entityType) where.entityType = entityType;
    if (typeof isActive === 'boolean') where.isActive = isActive;

    const definitions = await prisma.workflowDefinition.findMany({
      where,
      include: { stages: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    return ok(definitions);
  } catch (error) {
    console.error('[workflowEngine.listWorkflowDefinitions]', error);
    return err('LIST_DEFINITIONS_FAILED', error.message);
  }
}

// --------------------------------------------------------------------------
// Workflow Instance Lifecycle
// --------------------------------------------------------------------------

/**
 * Start a new workflow instance for an entity (e.g., a file).
 *
 * @param {object} input
 * @param {string} input.definitionId
 * @param {string} input.entityId - e.g., fileId
 * @param {object} [input.metadata] - custom data
 * @param {object} actor
 */
export async function startWorkflow(input, actor) {
  try {
    const { definitionId, entityId, metadata } = input || {};
    if (!definitionId || !entityId) {
      return err('INVALID_INPUT', 'definitionId and entityId required');
    }
    if (!actor?.userId) return err('NO_ACTOR', 'Authenticated actor required');

    const definition = await prisma.workflowDefinition.findUnique({
      where: { id: definitionId },
      include: { stages: { orderBy: { order: 'asc' } } },
    });
    if (!definition || !definition.isActive) {
      return err('DEFINITION_NOT_FOUND', 'Workflow definition not found or inactive');
    }
    if (!definition.stages.length) {
      return err('NO_STAGES', 'Workflow has no stages defined');
    }

    // Check for existing active instance.
    const existing = await prisma.workflowInstance.findFirst({
      where: {
        definitionId,
        entityId,
        status: { in: ['PENDING'] },
      },
    });
    if (existing) {
      return err('INSTANCE_EXISTS', 'Active workflow instance already exists for this entity');
    }

    const firstStage = definition.stages[0];
    const slaDeadline = firstStage.slaHours
      ? new Date(Date.now() + firstStage.slaHours * 3_600_000)
      : null;

    const instance = await prisma.workflowInstance.create({
      data: {
        definitionId,
        entityId,
        status: 'PENDING',
        currentStageId: firstStage.id,
        metadata: metadata || {},
        initiatedById: actor.userId,
        steps: {
          create: {
            stageId: firstStage.id,
            status: 'PENDING',
            assignedRoles: firstStage.approverRoles,
            requiredApprovals: firstStage.requiredApprovals,
            slaDeadline,
          },
        },
      },
      include: {
        definition: true,
        currentStage: true,
        steps: { orderBy: { enteredAt: 'asc' } },
      },
    });

    await prisma.workflowHistory.create({
      data: {
        instanceId: instance.id,
        action: 'workflow_started',
        performedById: actor.userId,
        metadata: { definitionName: definition.name },
      },
    });

    // Notify approvers for first stage
    const approverUsers = await prisma.user.findMany({
      where: { roles: { hasSome: firstStage.approverRoles } },
      select: { id: true, email: true, name: true },
    });
    for (const user of approverUsers) {
      await notificationGateway.emit(EVENTS.WORKFLOW_ASSIGNED, {
        instanceId: instance.id,
        workflowName: definition.name,
        stageName: firstStage.name,
        userName: user.name,
      }, { userId: user.id, email: user.email, name: user.name }, actor);
    }

    return ok(instance);
  } catch (error) {
    console.error('[workflowEngine.startWorkflow]', error);
    return err('START_WORKFLOW_FAILED', error.message);
  }
}

/**
 * Approve the current stage of a workflow instance.
 *
 * @param {string} instanceId
 * @param {object} input
 * @param {string} [input.comment]
 * @param {object} actor
 */
export async function approveStage(instanceId, input, actor) {
  try {
    if (!actor?.userId) return err('NO_ACTOR', 'Authenticated actor required');

    const instance = await prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: {
        definition: { include: { stages: { orderBy: { order: 'asc' } } } },
        currentStage: true,
        steps: { where: { status: 'PENDING' }, orderBy: { createdAt: 'asc' } },
      },
    });
    if (!instance) return err('NOT_FOUND', 'Workflow instance not found');
    if (instance.status !== 'PENDING') {
      return err('INVALID_STATE', `Workflow is ${instance.status}, cannot approve`);
    }

    const currentStep = instance.steps[0];
    if (!currentStep) return err('NO_PENDING_STEP', 'No pending step found');

    // Check if actor has required role.
    const hasRole = currentStep.assignedRoles.some((r) => (actor.roles || []).includes(r));
    const isAdmin = (actor.roles || []).includes('super_admin');
    if (!hasRole && !isAdmin) {
      return err('ACCESS_DENIED', `Requires one of: ${currentStep.assignedRoles.join(', ')}`);
    }

    // Check if actor already approved this step.
    const alreadyApproved = (currentStep.approvals || []).some((a) => a.userId === actor.userId);
    if (alreadyApproved) {
      return err('ALREADY_APPROVED', 'You have already approved this step');
    }

    // Record approval.
    const approvals = [
      ...(currentStep.approvals || []),
      { userId: actor.userId, approvedAt: new Date().toISOString(), comment: input?.comment },
    ];
    const approvalCount = approvals.length;

    await prisma.workflowHistory.create({
      data: {
        instanceId: instance.id,
        action: 'stage_approved',
        performedById: actor.userId,
        metadata: {
          stageName: instance.currentStage.name,
          comment: input?.comment,
          approvalCount,
          requiredApprovals: currentStep.requiredApprovals,
        },
      },
    });

    // Check if stage is complete.
    if (approvalCount >= currentStep.requiredApprovals) {
      await prisma.workflowStep.update({
        where: { id: currentStep.id },
        data: { status: 'approved', approvals, completedAt: new Date() },
      });

      // Move to next stage or complete workflow.
      const currentStageOrder = instance.currentStage.order;
      const nextStage = instance.definition.stages.find((s) => s.order > currentStageOrder);

      if (nextStage) {
        const nextSlaDeadline = nextStage.slaHours
          ? new Date(Date.now() + nextStage.slaHours * 3_600_000)
          : null;

        await prisma.workflowInstance.update({
          where: { id: instanceId },
          data: { currentStageId: nextStage.id },
        });

        await prisma.workflowStep.create({
          data: {
            instanceId,
            stageId: nextStage.id,
            status: 'PENDING',
            assignedRoles: nextStage.approverRoles,
            requiredApprovals: nextStage.requiredApprovals,
            slaDeadline: nextSlaDeadline,
          },
        });

        await prisma.workflowHistory.create({
          data: {
            instanceId,
            action: 'stage_advanced',
            performedById: actor.userId,
            metadata: { fromStage: instance.currentStage.name, toStage: nextStage.name },
          },
        });

        // Notify initiator of approval
        const [approver, initiator] = await Promise.all([
          prisma.user.findUnique({ where: { id: actor.userId }, select: { name: true } }),
          prisma.user.findUnique({ where: { id: instance.initiatedById }, select: { id: true, email: true, name: true } }),
        ]);
        if (initiator) {
          await notificationGateway.emit(EVENTS.WORKFLOW_APPROVED, {
            instanceId: instance.id,
            workflowName: instance.definition?.name,
            stageName: instance.currentStage.name,
            approverName: approver?.name || 'Unknown',
          }, { userId: initiator.id, email: initiator.email, name: initiator.name }, actor);
        }

        // Notify next stage approvers
        const nextApprovers = await prisma.user.findMany({
          where: { roles: { hasSome: nextStage.approverRoles } },
          select: { id: true, email: true, name: true },
        });
        for (const user of nextApprovers) {
          await notificationGateway.emit(EVENTS.WORKFLOW_ASSIGNED, {
            instanceId: instance.id,
            workflowName: instance.definition?.name,
            stageName: nextStage.name,
            userName: user.name,
          }, { userId: user.id, email: user.email, name: user.name }, actor);
        }
      } else {
        // Workflow complete.
        await prisma.workflowInstance.update({
          where: { id: instanceId },
          data: { status: 'COMPLETED', completedAt: new Date() },
        });

        await prisma.workflowHistory.create({
          data: {
            instanceId,
            action: 'workflow_completed',
            performedById: actor.userId,
            metadata: { finalStage: instance.currentStage.name },
          },
        });

        // Notify initiator of final approval and completion
        const [approver, initiator] = await Promise.all([
          prisma.user.findUnique({ where: { id: actor.userId }, select: { name: true } }),
          prisma.user.findUnique({ where: { id: instance.initiatedById }, select: { id: true, email: true, name: true } }),
        ]);
        if (initiator) {
          await notificationGateway.emit(EVENTS.WORKFLOW_APPROVED, {
            instanceId: instance.id,
            workflowName: instance.definition?.name,
            stageName: instance.currentStage.name,
            approverName: approver?.name || 'Unknown',
          }, { userId: initiator.id, email: initiator.email, name: initiator.name }, actor);
          await notificationGateway.emit(EVENTS.WORKFLOW_COMPLETED, {
            instanceId: instance.id,
            workflowName: instance.definition?.name,
          }, { userId: initiator.id, email: initiator.email, name: initiator.name }, actor);
        }
      }
    } else {
      // Still need more approvals for this stage.
      await prisma.workflowStep.update({
        where: { id: currentStep.id },
        data: { approvals },
      });
    }

    const updated = await prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: {
        definition: true,
        currentStage: true,
        steps: { orderBy: { enteredAt: 'asc' } },
      },
    });

    return ok(updated);
  } catch (error) {
    console.error('[workflowEngine.approveStage]', error);
    return err('APPROVE_FAILED', error.message);
  }
}

/**
 * Reject the current stage (terminates workflow).
 *
 * @param {string} instanceId
 * @param {object} input
 * @param {string} input.reason
 * @param {object} actor
 */
export async function rejectStage(instanceId, input, actor) {
  try {
    if (!actor?.userId) return err('NO_ACTOR', 'Authenticated actor required');

    const instance = await prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: {
        currentStage: true,
        steps: { where: { status: 'pending' }, orderBy: { createdAt: 'asc' } },
      },
    });
    if (!instance) return err('NOT_FOUND', 'Workflow instance not found');
    if (instance.status !== 'PENDING') {
      return err('INVALID_STATE', `Workflow is ${instance.status}, cannot reject`);
    }

    const currentStep = instance.steps[0];
    if (!currentStep) return err('NO_PENDING_STEP', 'No pending step found');

    const hasRole = currentStep.assignedRoles.some((r) => (actor.roles || []).includes(r));
    const isAdmin = (actor.roles || []).includes('super_admin');
    if (!hasRole && !isAdmin) {
      return err('ACCESS_DENIED', `Requires one of: ${currentStep.assignedRoles.join(', ')}`);
    }

    await prisma.workflowStep.update({
      where: { id: currentStep.id },
      data: {
        status: 'REJECTED',
        completedAt: new Date(),
        rejectionReason: input?.reason,
      },
    });

    await prisma.workflowInstance.update({
      where: { id: instanceId },
      data: { status: 'REJECTED', completedAt: new Date() },
    });

    await prisma.workflowHistory.create({
      data: {
        instanceId,
        action: 'workflow_rejected',
        performedById: actor.userId,
        metadata: {
          stageName: instance.currentStage.name,
          reason: input?.reason,
        },
      },
    });

    // Notify initiator of rejection
    const [rejecter, initiator] = await Promise.all([
      prisma.user.findUnique({ where: { id: actor.userId }, select: { name: true } }),
      prisma.user.findUnique({ where: { id: instance.initiatedById }, select: { id: true, email: true, name: true } }),
    ]);
    if (initiator) {
      await notificationGateway.emit(EVENTS.WORKFLOW_REJECTED, {
        instanceId: instance.id,
        workflowName: instance.definition?.name,
        stageName: instance.currentStage.name,
        rejecterName: rejecter?.name || 'Unknown',
        reason: input?.reason,
      }, { userId: initiator.id, email: initiator.email, name: initiator.name }, actor);
    }

    const updated = await prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: {
        definition: true,
        currentStage: true,
        steps: { orderBy: { enteredAt: 'asc' } },
      },
    });

    return ok(updated);
  } catch (error) {
    console.error('[workflowEngine.rejectStage]', error);
    return err('REJECT_FAILED', error.message);
  }
}

// --------------------------------------------------------------------------
// Query & Reporting
// --------------------------------------------------------------------------

export async function getWorkflowInstance(instanceId, actor) {
  try {
    const instance = await prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: {
        definition: { include: { stages: { orderBy: { order: 'asc' } } } },
        currentStage: true,
        steps: { orderBy: { enteredAt: 'asc' } },
        initiatedBy: { select: { id: true, name: true, email: true } },
      },
    });
    if (!instance) return err('NOT_FOUND', 'Workflow instance not found');
    return ok(instance);
  } catch (error) {
    console.error('[workflowEngine.getWorkflowInstance]', error);
    return err('GET_INSTANCE_FAILED', error.message);
  }
}

export async function listWorkflowInstances(filters = {}, actor) {
  try {
    const { entityId, definitionId, status } = filters;
    const where = {};
    if (entityId) where.fileId = entityId; // entityId maps to fileId in schema
    if (definitionId) where.definitionId = definitionId;
    if (status) where.status = status;

    const instances = await prisma.workflowInstance.findMany({
      where,
      include: {
        definition: true,
        currentStage: true,
        initiatedBy: { select: { id: true, displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return ok(instances);
  } catch (error) {
    console.error('[workflowEngine.listWorkflowInstances]', error);
    return err('LIST_INSTANCES_FAILED', error.message);
  }
}

export async function getWorkflowHistory(instanceId) {
  try {
    const history = await prisma.workflowHistory.findMany({
      where: { instanceId },
      include: { performedBy: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return ok(history);
  } catch (error) {
    console.error('[workflowEngine.getWorkflowHistory]', error);
    return err('GET_HISTORY_FAILED', error.message);
  }
}

/**
 * Get pending tasks for the current actor (based on their roles).
 */
export async function getMyPendingTasks(actor) {
  try {
    if (!actor?.userId) {
      return err('NO_ACTOR', 'Authenticated actor required');
    }

    const instances = await prisma.workflowInstance.findMany({
      where: { status: 'IN_REVIEW' },
      include: {
        definition: true,
        currentStage: true,
        initiatedBy: { select: { id: true, displayName: true } },
      },
    });

    const myTasks = instances.filter((inst) => {
      // Check if actor is assigned user
      if (inst.assignedUserId === actor.userId) return true;
      // Check if actor has assigned role (only if roles are available)
      if (inst.assignedRole && actor.roles?.length && actor.roles.includes(inst.assignedRole)) return true;
      return false;
    });

    return ok(myTasks);
  } catch (error) {
    console.error('[workflowEngine.getMyPendingTasks]', error);
    return err('GET_TASKS_FAILED', error.message);
  }
}

// --------------------------------------------------------------------------
// Simplified Single-Stage Workflow Actions
// --------------------------------------------------------------------------

/**
 * Submit workflow (Draft → Submitted)
 */
export async function submitWorkflow(instanceId, actor) {
  try {
    if (!actor?.userId) return err('NO_ACTOR', 'Authenticated actor required');

    const instance = await prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: { initiatedBy: true, definition: true },
    });
    if (!instance) return err('NOT_FOUND', 'Workflow instance not found');
    if (instance.status !== 'DRAFT') {
      return err('INVALID_STATE', `Workflow is ${instance.status}, cannot submit`);
    }

    await prisma.workflowInstance.update({
      where: { id: instanceId },
      data: { status: 'SUBMITTED' },
    });

    await prisma.workflowHistory.create({
      data: {
        instanceId,
        eventType: 'SUBMITTED',
        actorId: actor.userId,
        payload: { previousStatus: 'DRAFT', newStatus: 'SUBMITTED' },
      },
    });

    // Notify initiator
    await notificationGateway.emit(EVENTS.WORKFLOW_SUBMITTED, {
      instanceId: instance.id,
      workflowName: instance.definition?.name,
    }, { userId: instance.initiatedBy.id, email: instance.initiatedBy.email, name: instance.initiatedBy.displayName }, actor);

    const updated = await prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: { definition: true, initiatedBy: true },
    });
    return ok(updated);
  } catch (error) {
    console.error('[workflowEngine.submitWorkflow]', error);
    return err('SUBMIT_FAILED', error.message);
  }
}

/**
 * Send for review (Submitted → In Review)
 */
export async function sendForReview(instanceId, { assignedUserId, assignedRole, comment }, actor) {
  try {
    if (!actor?.userId) return err('NO_ACTOR', 'Authenticated actor required');
    if (!assignedUserId && !assignedRole) {
      return err('INVALID_INPUT', 'Must assign to user or role');
    }

    const instance = await prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: { initiatedBy: true, definition: true },
    });
    if (!instance) return err('NOT_FOUND', 'Workflow instance not found');
    if (instance.status !== 'SUBMITTED') {
      return err('INVALID_STATE', `Workflow is ${instance.status}, cannot send for review`);
    }

    await prisma.workflowInstance.update({
      where: { id: instanceId },
      data: {
        status: 'IN_REVIEW',
        assignedUserId,
        assignedRole,
      },
    });

    await prisma.workflowHistory.create({
      data: {
        instanceId,
        eventType: 'SENT_FOR_REVIEW',
        actorId: actor.userId,
        comment,
        payload: { assignedUserId, assignedRole, previousStatus: 'SUBMITTED', newStatus: 'IN_REVIEW' },
      },
    });

    // Notify assignee
    if (assignedUserId) {
      const assignee = await prisma.user.findUnique({ where: { id: assignedUserId } });
      if (assignee) {
        await notificationGateway.emit(EVENTS.WORKFLOW_SENT_FOR_REVIEW, {
          instanceId: instance.id,
          workflowName: instance.definition?.name,
          senderName: actor.name || 'Unknown',
          comment,
        }, { userId: assignee.id, email: assignee.email, name: assignee.displayName }, actor);
      }
    } else if (assignedRole) {
      // Notify all users with the role
      const assignees = await prisma.user.findMany({
        where: { roleAssignments: { some: { role: { code: assignedRole } } } },
      });
      for (const assignee of assignees) {
        await notificationGateway.emit(EVENTS.WORKFLOW_SENT_FOR_REVIEW, {
          instanceId: instance.id,
          workflowName: instance.definition?.name,
          senderName: actor.name || 'Unknown',
          comment,
        }, { userId: assignee.id, email: assignee.email, name: assignee.displayName }, actor);
      }
    }

    const updated = await prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: { definition: true, initiatedBy: true, assignedUser: true },
    });
    return ok(updated);
  } catch (error) {
    console.error('[workflowEngine.sendForReview]', error);
    return err('SEND_FOR_REVIEW_FAILED', error.message);
  }
}

/**
 * Send for approval (In Review → Approval stage with new assignee)
 */
export async function sendForApproval(instanceId, { assignedUserId, assignedRole, comment }, actor) {
  try {
    if (!actor?.userId) return err('NO_ACTOR', 'Authenticated actor required');
    if (!assignedUserId && !assignedRole) {
      return err('INVALID_INPUT', 'Must assign to user or role');
    }

    const instance = await prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: { initiatedBy: true, definition: true },
    });
    if (!instance) return err('NOT_FOUND', 'Workflow instance not found');
    if (instance.status !== 'IN_REVIEW') {
      return err('INVALID_STATE', `Workflow is ${instance.status}, cannot send for approval`);
    }

    await prisma.workflowInstance.update({
      where: { id: instanceId },
      data: {
        assignedUserId,
        assignedRole,
      },
    });

    await prisma.workflowHistory.create({
      data: {
        instanceId,
        eventType: 'SENT_FOR_APPROVAL',
        actorId: actor.userId,
        comment,
        payload: { assignedUserId, assignedRole },
      },
    });

    // Notify new assignee
    if (assignedUserId) {
      const assignee = await prisma.user.findUnique({ where: { id: assignedUserId } });
      if (assignee) {
        await notificationGateway.emit(EVENTS.WORKFLOW_SENT_FOR_APPROVAL, {
          instanceId: instance.id,
          workflowName: instance.definition?.name,
          senderName: actor.name || 'Unknown',
          comment,
        }, { userId: assignee.id, email: assignee.email, name: assignee.displayName }, actor);
      }
    } else if (assignedRole) {
      const assignees = await prisma.user.findMany({
        where: { roleAssignments: { some: { role: { code: assignedRole } } } },
      });
      for (const assignee of assignees) {
        await notificationGateway.emit(EVENTS.WORKFLOW_SENT_FOR_APPROVAL, {
          instanceId: instance.id,
          workflowName: instance.definition?.name,
          senderName: actor.name || 'Unknown',
          comment,
        }, { userId: assignee.id, email: assignee.email, name: assignee.displayName }, actor);
      }
    }

    const updated = await prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: { definition: true, initiatedBy: true, assignedUser: true },
    });
    return ok(updated);
  } catch (error) {
    console.error('[workflowEngine.sendForApproval]', error);
    return err('SEND_FOR_APPROVAL_FAILED', error.message);
  }
}

/**
 * Approve workflow (In Review → Approved)
 */
export async function approveWorkflow(instanceId, { comment }, actor) {
  try {
    if (!actor?.userId) return err('NO_ACTOR', 'Authenticated actor required');

    const instance = await prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: { initiatedBy: true, definition: true },
    });
    if (!instance) return err('NOT_FOUND', 'Workflow instance not found');
    if (instance.status !== 'IN_REVIEW') {
      return err('INVALID_STATE', `Workflow is ${instance.status}, cannot approve`);
    }

    // Check if actor is assigned user or has assigned role
    const isAssignedUser = instance.assignedUserId === actor.userId;
    const hasAssignedRole = instance.assignedRole && actor.roles?.includes(instance.assignedRole);
    const isAdmin = actor.roles?.includes('super_admin') || actor.roles?.includes('admin');
    
    if (!isAssignedUser && !hasAssignedRole && !isAdmin) {
      return err('ACCESS_DENIED', 'You are not assigned to this workflow');
    }

    await prisma.workflowInstance.update({
      where: { id: instanceId },
      data: {
        status: 'APPROVED',
        completedAt: new Date(),
      },
    });

    await prisma.workflowHistory.create({
      data: {
        instanceId,
        eventType: 'APPROVED',
        actorId: actor.userId,
        comment,
        payload: { previousStatus: 'IN_REVIEW', newStatus: 'APPROVED' },
      },
    });

    // Notify initiator
    await notificationGateway.emit(EVENTS.WORKFLOW_APPROVED, {
      instanceId: instance.id,
      workflowName: instance.definition?.name,
      approverName: actor.name || 'Unknown',
    }, { userId: instance.initiatedBy.id, email: instance.initiatedBy.email, name: instance.initiatedBy.displayName }, actor);
    
    await notificationGateway.emit(EVENTS.WORKFLOW_COMPLETED, {
      instanceId: instance.id,
      workflowName: instance.definition?.name,
    }, { userId: instance.initiatedBy.id, email: instance.initiatedBy.email, name: instance.initiatedBy.displayName }, actor);

    const updated = await prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: { definition: true, initiatedBy: true },
    });
    return ok(updated);
  } catch (error) {
    console.error('[workflowEngine.approveWorkflow]', error);
    return err('APPROVE_FAILED', error.message);
  }
}

/**
 * Reject workflow (In Review → Rejected)
 */
export async function rejectWorkflow(instanceId, { comment, reason }, actor) {
  try {
    if (!actor?.userId) return err('NO_ACTOR', 'Authenticated actor required');
    if (!reason) return err('INVALID_INPUT', 'Rejection reason is required');

    const instance = await prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: { initiatedBy: true, definition: true },
    });
    if (!instance) return err('NOT_FOUND', 'Workflow instance not found');
    if (instance.status !== 'IN_REVIEW') {
      return err('INVALID_STATE', `Workflow is ${instance.status}, cannot reject`);
    }

    // Check if actor is assigned user or has assigned role
    const isAssignedUser = instance.assignedUserId === actor.userId;
    const hasAssignedRole = instance.assignedRole && actor.roles?.includes(instance.assignedRole);
    const isAdmin = actor.roles?.includes('super_admin') || actor.roles?.includes('admin');
    
    if (!isAssignedUser && !hasAssignedRole && !isAdmin) {
      return err('ACCESS_DENIED', 'You are not assigned to this workflow');
    }

    await prisma.workflowInstance.update({
      where: { id: instanceId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
      },
    });

    await prisma.workflowHistory.create({
      data: {
        instanceId,
        eventType: 'REJECTED',
        actorId: actor.userId,
        comment,
        payload: { reason, previousStatus: 'IN_REVIEW', newStatus: 'REJECTED' },
      },
    });

    // Notify initiator
    await notificationGateway.emit(EVENTS.WORKFLOW_REJECTED, {
      instanceId: instance.id,
      workflowName: instance.definition?.name,
      rejecterName: actor.name || 'Unknown',
      reason,
    }, { userId: instance.initiatedBy.id, email: instance.initiatedBy.email, name: instance.initiatedBy.displayName }, actor);

    const updated = await prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: { definition: true, initiatedBy: true },
    });
    return ok(updated);
  } catch (error) {
    console.error('[workflowEngine.rejectWorkflow]', error);
    return err('REJECT_FAILED', error.message);
  }
}

/**
 * Revise workflow (Rejected → Draft)
 */
export async function reviseWorkflow(instanceId, { comment }, actor) {
  try {
    if (!actor?.userId) return err('NO_ACTOR', 'Authenticated actor required');

    const instance = await prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: { initiatedBy: true, definition: true },
    });
    if (!instance) return err('NOT_FOUND', 'Workflow instance not found');
    if (instance.status !== 'REJECTED') {
      return err('INVALID_STATE', `Workflow is ${instance.status}, cannot revise`);
    }
    if (instance.revisionCount >= 20) {
      return err('REVISION_LIMIT', 'Maximum revision limit (20) reached');
    }

    await prisma.workflowInstance.update({
      where: { id: instanceId },
      data: {
        status: 'DRAFT',
        revisionCount: { increment: 1 },
        lastRevisedAt: new Date(),
        assignedUserId: null,
        assignedRole: null,
        rejectionReason: null,
      },
    });

    await prisma.workflowHistory.create({
      data: {
        instanceId,
        eventType: 'REVISED',
        actorId: actor.userId,
        comment,
        payload: { 
          revisionCount: instance.revisionCount + 1,
          previousStatus: 'REJECTED', 
          newStatus: 'DRAFT' 
        },
      },
    });

    // Notify initiator
    await notificationGateway.emit(EVENTS.WORKFLOW_REVISED, {
      instanceId: instance.id,
      workflowName: instance.definition?.name,
      revisionCount: instance.revisionCount + 1,
      comment,
    }, { userId: instance.initiatedBy.id, email: instance.initiatedBy.email, name: instance.initiatedBy.displayName }, actor);

    const updated = await prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: { definition: true, initiatedBy: true },
    });
    return ok(updated);
  } catch (error) {
    console.error('[workflowEngine.reviseWorkflow]', error);
    return err('REVISE_FAILED', error.message);
  }
}

/**
 * Cancel workflow (Any active state → Cancelled)
 */
export async function cancelWorkflow(instanceId, { comment }, actor) {
  try {
    if (!actor?.userId) return err('NO_ACTOR', 'Authenticated actor required');

    const instance = await prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: { initiatedBy: true, definition: true },
    });
    if (!instance) return err('NOT_FOUND', 'Workflow instance not found');
    if (instance.status === 'APPROVED' || instance.status === 'CANCELLED') {
      return err('INVALID_STATE', `Workflow is ${instance.status}, cannot cancel`);
    }

    await prisma.workflowInstance.update({
      where: { id: instanceId },
      data: {
        status: 'CANCELLED',
        completedAt: new Date(),
      },
    });

    await prisma.workflowHistory.create({
      data: {
        instanceId,
        eventType: 'CANCELLED',
        actorId: actor.userId,
        comment,
        payload: { previousStatus: instance.status, newStatus: 'CANCELLED' },
      },
    });

    // Notify initiator
    await notificationGateway.emit(EVENTS.WORKFLOW_CANCELLED, {
      instanceId: instance.id,
      workflowName: instance.definition?.name,
      comment,
    }, { userId: instance.initiatedBy.id, email: instance.initiatedBy.email, name: instance.initiatedBy.displayName }, actor);

    const updated = await prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: { definition: true, initiatedBy: true },
    });
    return ok(updated);
  } catch (error) {
    console.error('[workflowEngine.cancelWorkflow]', error);
    return err('CANCEL_FAILED', error.message);
  }
}

export default {
  createWorkflowDefinition,
  getWorkflowDefinition,
  listWorkflowDefinitions,
  startWorkflow,
  approveStage,
  rejectStage,
  getWorkflowInstance,
  listWorkflowInstances,
  getWorkflowHistory,
  getMyPendingTasks,
  submitWorkflow,
  sendForReview,
  sendForApproval,
  approveWorkflow,
  rejectWorkflow,
  reviseWorkflow,
  cancelWorkflow,
};
