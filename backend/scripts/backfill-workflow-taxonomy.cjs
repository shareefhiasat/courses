/**
 * One-time backfill: populate approvalFlow, workflowCategory, attendanceSubtype
 * from legacy workflowType on existing WorkflowDocument rows.
 *
 * Usage: node backend/scripts/backfill-workflow-taxonomy.cjs
 */

const { PrismaClient } = require('../../client/node_modules/@prisma/client');

const prisma = new PrismaClient();

const MAPPING = {
  ATTENDANCE_DAILY: {
    workflowCategory: 'ATTENDANCE',
    attendanceSubtype: 'DAILY',
    approvalFlow: 'INSTRUCTOR_THEN_HR',
  },
  ATTENDANCE_WEEKLY: {
    workflowCategory: 'ATTENDANCE',
    attendanceSubtype: 'WEEKLY_SUMMARY',
    approvalFlow: 'HR_THEN_ADMIN',
  },
  GENERAL_HR: {
    workflowCategory: 'GENERAL',
    attendanceSubtype: null,
    approvalFlow: 'HR_ONLY',
  },
  GENERAL_ADMIN: {
    workflowCategory: 'GENERAL',
    attendanceSubtype: null,
    approvalFlow: 'ADMIN_ONLY',
  },
  GENERAL_MIXED_HR_ADMIN: {
    workflowCategory: 'GENERAL',
    attendanceSubtype: null,
    approvalFlow: 'HR_THEN_ADMIN',
  },
  GENERAL_MIXED_ADMIN_HR: {
    workflowCategory: 'GENERAL',
    attendanceSubtype: null,
    approvalFlow: 'ADMIN_THEN_HR',
  },
};

async function seedDeductionRules() {
  const count = await prisma.absenceDeductionRule.count();
  if (count > 0) {
    console.log(`Skipping deduction rules seed (${count} already exist)`);
    return;
  }

  const defaults = [
    { statusCode: 'ABSENT_NO_EXCUSE', absenceTypeId: 'without_excuse', deduction: 0.5, isExcused: false },
    { statusCode: 'ABSENT_WITH_EXCUSE', absenceTypeId: 'with_excuse', deduction: 0.25, isExcused: true },
    { statusCode: 'EXCUSED_LEAVE', absenceTypeId: 'with_excuse', deduction: 0.25, isExcused: true },
    { statusCode: 'LATE', absenceTypeId: null, deduction: 0.5, isExcused: false },
    { statusCode: 'HUMAN_CASE', absenceTypeId: 'medical_emergency', deduction: 0.25, isExcused: true },
    { absenceTypeId: 'bereavement', deduction: 0, isExcused: true },
  ];

  await prisma.absenceDeductionRule.createMany({ data: defaults });
  console.log(`Seeded ${defaults.length} absence deduction rules`);
}

async function main() {
  const docs = await prisma.workflowDocument.findMany({
    select: { id: true, workflowType: true, workflowCategory: true },
  });

  let updated = 0;
  for (const doc of docs) {
    const mapped = MAPPING[doc.workflowType];
    if (!mapped) continue;

    if (doc.workflowCategory && doc.workflowCategory !== 'GENERAL') continue;

    await prisma.workflowDocument.update({
      where: { id: doc.id },
      data: mapped,
    });
    updated += 1;
  }

  console.log(`Backfilled taxonomy on ${updated} workflow documents`);
  await seedDeductionRules();
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
