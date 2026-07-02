/**
 * One-time script: rename attendance_status_types code 'ABSENT' → 'ABSENT_NO_EXCUSE'
 * and update all related records.
 *
 * Run with: node backend/scripts/rename-absent-status.cjs
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Renaming ABSENT → ABSENT_NO_EXCUSE...');

  // 1. Rename the status type code
  const existing = await prisma.attendanceStatusTypes.findFirst({
    where: { code: 'ABSENT' },
  });

  if (!existing) {
    console.log('✅ No ABSENT status type found — already renamed or not seeded.');
    return;
  }

  // Check if ABSENT_NO_EXCUSE already exists (from backfill script)
  const alreadyExists = await prisma.attendanceStatusTypes.findFirst({
    where: { code: 'ABSENT_NO_EXCUSE' },
  });

  if (alreadyExists) {
    // Merge: update all attendances pointing to the old ABSENT status to the new one
    console.log('  ABSENT_NO_EXCUSE already exists (id=' + alreadyExists.id + '), merging records...');
    await prisma.attendance.updateMany({
      where: { statusId: existing.id },
      data: { statusId: alreadyExists.id },
    });
    // Also update amendments
    await prisma.attendanceAmendment.updateMany({
      where: { fromStatusId: existing.id },
      data: { fromStatusId: alreadyExists.id },
    });
    await prisma.attendanceAmendment.updateMany({
      where: { toStatusId: existing.id },
      data: { toStatusId: alreadyExists.id },
    });
    // Deactivate the old status
    await prisma.attendanceStatusTypes.update({
      where: { id: existing.id },
      data: { isActive: false },
    });
    console.log('  ✅ Merged ' + existing.id + ' → ' + alreadyExists.id + ' and deactivated old status.');
  } else {
    // Simple rename
    await prisma.attendanceStatusTypes.update({
      where: { id: existing.id },
      data: { code: 'ABSENT_NO_EXCUSE', nameEn: 'Absent (No Excuse)' },
    });
    console.log('  ✅ Renamed status type id=' + existing.id + ' code ABSENT → ABSENT_NO_EXCUSE');
  }

  // 2. Update any deduction rules that reference 'ABSENT'
  await prisma.absenceDeductionRule.updateMany({
    where: { statusCode: 'ABSENT' },
    data: { statusCode: 'ABSENT_NO_EXCUSE' },
  });
  console.log('  ✅ Updated absence_deduction_rules');

  console.log('🎉 Done!');
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
