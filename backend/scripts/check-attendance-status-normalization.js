/**
 * Read-only diagnostic: check how many attendance records still use
 * legacy/non-canonical status codes that need normalization.
 */

import prisma from '../db/prismaClient.js';
import {
  ATTENDANCE_STATUS_CODES,
  STANDUP_STATUS_CODES,
  normalizeAttendanceStatus,
} from '../constants/attendanceConstants.js';

const CANONICAL_CODES = new Set([
  ...Object.values(ATTENDANCE_STATUS_CODES),
  ...Object.values(STANDUP_STATUS_CODES),
]);

async function main() {
  console.log('\n=== Checking attendance_status_types ===');
  const statusTypes = await prisma.attendanceStatusTypes.findMany({
    orderBy: { id: 'asc' },
  });
  const nonCanonicalTypes = statusTypes.filter((t) => !CANONICAL_CODES.has(t.code));
  if (nonCanonicalTypes.length === 0) {
    console.log('All status type codes are canonical.');
  } else {
    console.log(`Found ${nonCanonicalTypes.length} non-canonical status type(s):`);
    for (const t of nonCanonicalTypes) {
      const count = await prisma.attendance.count({ where: { statusId: t.id } });
      console.log(`  id=${t.id} code="${t.code}" nameEn="${t.nameEn}" active=${t.isActive} attendanceRecords=${count}`);
    }
  }

  console.log('\n=== Checking attendance records by status code ===');
  const rows = await prisma.attendance.groupBy({
    by: ['statusId'],
    _count: { id: true },
  });
  const countsByCode = {};
  let totalNonCanonicalRecords = 0;
  for (const row of rows) {
    const type = statusTypes.find((t) => t.id === row.statusId);
    const code = type?.code || `unknown-id-${row.statusId}`;
    const normalized = normalizeAttendanceStatus(code);
    const isCanonical = CANONICAL_CODES.has(code);
    countsByCode[code] = {
      count: row._count.id,
      normalized,
      isCanonical,
    };
    if (!isCanonical) {
      totalNonCanonicalRecords += row._count.id;
    }
  }
  for (const [code, info] of Object.entries(countsByCode).sort()) {
    const marker = info.isCanonical ? '✅' : '⚠️';
    console.log(`  ${marker} ${code} => ${info.normalized} : ${info.count} records`);
  }

  console.log(`\nTotal attendance records with non-canonical status codes: ${totalNonCanonicalRecords}`);
  console.log('\nRun backend/scripts/rename-to-attendance-prefix.cjs to normalize them.\n');
}

main()
  .catch((e) => {
    console.error('Check failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
