/**
 * One-time script:
 * 1. Rename attendance_status_types code 'EXCUSED' → 'EXCUSED_LEAVE'
 * 2. Deactivate unused 'ABSENT_WITH_EXCUSE' (id=11, 0 records)
 * 3. Remap any deduction rules referencing 'EXCUSED' or 'ABSENT_WITH_EXCUSE' → 'EXCUSED_LEAVE'
 *
 * Run with: node backend/scripts/rename-excused-status.cjs
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Cleaning up excused status codes...');

  // 1. Rename EXCUSED → EXCUSED_LEAVE
  const excused = await prisma.attendanceStatusTypes.findFirst({
    where: { code: 'EXCUSED' },
  });

  if (excused) {
    // Check if EXCUSED_LEAVE already exists
    const excusedLeave = await prisma.attendanceStatusTypes.findFirst({
      where: { code: 'EXCUSED_LEAVE' },
    });

    if (excusedLeave) {
      console.log('  EXCUSED_LEAVE already exists (id=' + excusedLeave.id + '), merging records...');
      await prisma.attendance.updateMany({
        where: { statusId: excused.id },
        data: { statusId: excusedLeave.id },
      });
      await prisma.attendanceAmendment.updateMany({
        where: { fromStatusId: excused.id },
        data: { fromStatusId: excusedLeave.id },
      });
      await prisma.attendanceAmendment.updateMany({
        where: { toStatusId: excused.id },
        data: { toStatusId: excusedLeave.id },
      });
      await prisma.attendanceStatusTypes.update({
        where: { id: excused.id },
        data: { isActive: false },
      });
      console.log('  ✅ Merged EXCUSED → EXCUSED_LEAVE and deactivated old status.');
    } else {
      await prisma.attendanceStatusTypes.update({
        where: { id: excused.id },
        data: { code: 'EXCUSED_LEAVE', nameEn: 'Excused Leave' },
      });
      console.log('  ✅ Renamed EXCUSED → EXCUSED_LEAVE (id=' + excused.id + ')');
    }
  } else {
    console.log('  ✅ No EXCUSED status type found — already renamed.');
  }

  // 2. Deactivate ABSENT_WITH_EXCUSE (id=11) and remap any records
  const awe = await prisma.attendanceStatusTypes.findFirst({
    where: { code: 'ABSENT_WITH_EXCUSE' },
  });

  if (awe) {
    const excusedLeave = await prisma.attendanceStatusTypes.findFirst({
      where: { code: 'EXCUSED_LEAVE' },
    });

    if (excusedLeave) {
      const remapped = await prisma.attendance.updateMany({
        where: { statusId: awe.id },
        data: { statusId: excusedLeave.id },
      });
      console.log('  Remapped ' + remapped.count + ' attendance records from ABSENT_WITH_EXCUSE → EXCUSED_LEAVE');

      await prisma.attendanceAmendment.updateMany({
        where: { fromStatusId: awe.id },
        data: { fromStatusId: excusedLeave.id },
      });
      await prisma.attendanceAmendment.updateMany({
        where: { toStatusId: awe.id },
        data: { toStatusId: excusedLeave.id },
      });
    }

    await prisma.attendanceStatusTypes.update({
      where: { id: awe.id },
      data: { isActive: false },
    });
    console.log('  ✅ Deactivated ABSENT_WITH_EXCUSE (id=' + awe.id + ')');
  } else {
    console.log('  ✅ No ABSENT_WITH_EXCUSE status type found.');
  }

  // 3. Update deduction rules
  await prisma.absenceDeductionRule.updateMany({
    where: { statusCode: 'EXCUSED' },
    data: { statusCode: 'EXCUSED_LEAVE' },
  });
  await prisma.absenceDeductionRule.updateMany({
    where: { statusCode: 'ABSENT_WITH_EXCUSE' },
    data: { statusCode: 'EXCUSED_LEAVE' },
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
