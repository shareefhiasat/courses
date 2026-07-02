/**
 * DB Migration: Rename attendance status codes to ATTENDANCE_ prefix
 *
 * Changes:
 *   PRESENT        → ATTENDANCE_PRESENT
 *   ABSENT_NO_EXCUSE → ATTENDANCE_ABSENT
 *   LATE           → ATTENDANCE_LATE
 *   EXCUSED_LEAVE  → ATTENDANCE_LEAVE
 *   HUMAN_CASE     → ATTENDANCE_HUMAN_CASE
 *   SICK_LEAVE     → deactivated (0 records, merged into ATTENDANCE_LEAVE)
 *   EARLY_DEPARTURE → deactivated (0 records, merged into ATTENDANCE_HUMAN_CASE)
 *
 * Also updates:
 *   - absence_deduction_rules.statusCode references
 *   - Any attendance records pointing to deactivated status types
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const RENAME_MAP = {
  'PRESENT':          'ATTENDANCE_PRESENT',
  'ABSENT_NO_EXCUSE': 'ATTENDANCE_ABSENT',
  'LATE':             'ATTENDANCE_LATE',
  'EXCUSED_LEAVE':    'ATTENDANCE_LEAVE',
  'HUMAN_CASE':       'ATTENDANCE_HUMAN_CASE',
};

const DEACTIVATE_CODES = ['SICK_LEAVE', 'EARLY_DEPARTURE'];

async function main() {
  console.log('=== Renaming attendance status codes to ATTENDANCE_ prefix ===\n');

  // 1. Rename codes in attendance_status_types
  for (const [oldCode, newCode] of Object.entries(RENAME_MAP)) {
    const existing = await prisma.attendanceStatusTypes.findFirst({
      where: { code: oldCode },
    });
    if (!existing) {
      console.log(`  SKIP: ${oldCode} not found in DB`);
      continue;
    }

    // Check if new code already exists
    const newExisting = await prisma.attendanceStatusTypes.findFirst({
      where: { code: newCode },
    });

    if (newExisting) {
      // Merge: move attendance records from old to new, then deactivate old
      console.log(`  MERGE: ${oldCode} (id=${existing.id}) → ${newCode} (id=${newExisting.id})`);
      const updated = await prisma.attendance.updateMany({
        where: { statusId: existing.id },
        data: { statusId: newExisting.id },
      });
      console.log(`    Moved ${updated.count} attendance records`);
      await prisma.attendanceStatusTypes.update({
        where: { id: existing.id },
        data: { isActive: false },
      });
      console.log(`    Deactivated old ${oldCode}`);
    } else {
      await prisma.attendanceStatusTypes.update({
        where: { id: existing.id },
        data: { code: newCode },
      });
      console.log(`  RENAME: ${oldCode} → ${newCode} (id=${existing.id})`);
    }
  }

  // 2. Deactivate SICK_LEAVE and EARLY_DEPARTURE
  for (const code of DEACTIVATE_CODES) {
    const existing = await prisma.attendanceStatusTypes.findFirst({
      where: { code },
    });
    if (!existing) {
      console.log(`  SKIP: ${code} not found`);
      continue;
    }

    // Find replacement status
    const replacementCode = code === 'SICK_LEAVE' ? 'ATTENDANCE_LEAVE' : 'ATTENDANCE_HUMAN_CASE';
    const replacement = await prisma.attendanceStatusTypes.findFirst({
      where: { code: replacementCode },
    });

    if (replacement) {
      const updated = await prisma.attendance.updateMany({
        where: { statusId: existing.id },
        data: { statusId: replacement.id },
      });
      console.log(`  DEACTIVATE ${code}: moved ${updated.count} records → ${replacementCode}`);
    }

    await prisma.attendanceStatusTypes.update({
      where: { id: existing.id },
      data: { isActive: false },
    });
  }

  // 3. Update absence_deduction_rules statusCode references
  console.log('\n=== Updating deduction rules ===');
  for (const [oldCode, newCode] of Object.entries(RENAME_MAP)) {
    const updated = await prisma.absenceDeductionRule.updateMany({
      where: { statusCode: oldCode },
      data: { statusCode: newCode },
    });
    if (updated.count > 0) {
      console.log(`  ${oldCode} → ${newCode}: updated ${updated.count} rules`);
    }
  }

  // 4. Deactivate duplicate deduction rules (EXCUSED_LEAVE was duplicated)
  const allRules = await prisma.absenceDeductionRule.findMany({
    where: { statusCode: 'ATTENDANCE_LEAVE' },
    orderBy: { id: 'asc' },
  });
  if (allRules.length > 1) {
    // Keep the first, deactivate the rest
    for (let i = 1; i < allRules.length; i++) {
      await prisma.absenceDeductionRule.delete({ where: { id: allRules[i].id } });
      console.log(`  Deleted duplicate ATTENDANCE_LEAVE rule (id=${allRules[i].id})`);
    }
  }

  // 5. Verify final state
  console.log('\n=== Final status types ===');
  const finalTypes = await prisma.attendanceStatusTypes.findMany({ orderBy: { id: 'asc' } });
  for (const t of finalTypes) {
    const count = await prisma.attendance.count({ where: { statusId: t.id } });
    console.log(`  ${t.id}: ${t.code} (active=${t.isActive}, records=${count})`);
  }

  console.log('\n=== Final deduction rules ===');
  const finalRules = await prisma.absenceDeductionRule.findMany();
  for (const r of finalRules) {
    console.log(`  ${r.id}: ${r.statusCode} deduction=${r.deduction} isExcused=${r.isExcused}`);
  }

  console.log('\n✅ Migration complete');
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
