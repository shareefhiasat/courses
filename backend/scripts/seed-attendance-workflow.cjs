/**
 * Seed Attendance Report Approval Workflow
 *
 * Creates a 3-stage approval workflow for attendance reports:
 *   1. Instructor Review (instructor role)
 *   2. HR Verification (hr role)
 *   3. Admin Final Approval (super_admin role)
 *
 * Run: node backend/scripts/seed-attendance-workflow.cjs
 */

const prisma = require('../db/prismaClient.js');

async function main() {
  console.log('🌱 Seeding Attendance Report Approval Workflow...\n');

  // Check if workflow already exists.
  const existing = await prisma.workflowDefinition.findFirst({
    where: { name: 'Attendance Report Approval' },
  });

  if (existing) {
    console.log('✓ Workflow "Attendance Report Approval" already exists (id:', existing.id, ')');
    console.log('  Skipping seed.\n');
    return;
  }

  // Create workflow definition with stages.
  const workflow = await prisma.workflowDefinition.create({
    data: {
      name: 'Attendance Report Approval',
      description: 'Multi-stage approval process for monthly attendance reports',
      entityType: 'file',
      isActive: true,
      stages: {
        create: [
          {
            name: 'Instructor Review',
            order: 1,
            approverRoles: ['instructor'],
            requiredApprovals: 1,
            slaHours: 24,
          },
          {
            name: 'HR Verification',
            order: 2,
            approverRoles: ['hr'],
            requiredApprovals: 1,
            slaHours: 48,
          },
          {
            name: 'Admin Final Approval',
            order: 3,
            approverRoles: ['super_admin'],
            requiredApprovals: 1,
            slaHours: 72,
          },
        ],
      },
    },
    include: { stages: { orderBy: { order: 'asc' } } },
  });

  console.log('✓ Created workflow definition:');
  console.log('  ID:', workflow.id);
  console.log('  Name:', workflow.name);
  console.log('  Entity Type:', workflow.entityType);
  console.log('  Stages:');
  workflow.stages.forEach((stage, idx) => {
    console.log(`    ${idx + 1}. ${stage.name}`);
    console.log(`       Approvers: ${stage.approverRoles.join(', ')}`);
    console.log(`       Required: ${stage.requiredApprovals} approval(s)`);
    console.log(`       SLA: ${stage.slaHours || 'none'} hours`);
  });

  console.log('\n✅ Attendance Report Approval workflow seeded successfully!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
