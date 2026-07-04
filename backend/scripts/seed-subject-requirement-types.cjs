/**
 * Update Subject Types and Requirement Types to match official categorization.
 * Updates existing entries in-place to preserve foreign key references.
 *
 * Subject Types: general (عامة), major (تخصص)
 * Requirement Types: compulsory (إجبارية), elective (اختيارية)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Updating Subject Types...');

  // Update existing entries by ID (preserving foreign keys)
  const subjectTypeUpdates = [
    { id: 1, code: 'general', nameEn: 'General', nameAr: 'عامة', description: 'General subject (not specialization-specific)' },
    { id: 2, code: 'major', nameEn: 'Major', nameAr: 'تخصص', description: 'Major/specialization subject' },
  ];

  for (const st of subjectTypeUpdates) {
    await prisma.subjectTypes.update({
      where: { id: st.id },
      data: { code: st.code, nameEn: st.nameEn, nameAr: st.nameAr, description: st.description, isActive: true },
    });
    console.log(`  ✓ SubjectType id=${st.id}: ${st.code} (${st.nameEn} / ${st.nameAr})`);
  }

  // Deactivate old entries we don't need
  await prisma.subjectTypes.updateMany({
    where: { id: { notIn: [1, 2] } },
    data: { isActive: false },
  });
  console.log('  ✓ Deactivated unused subject types');

  console.log('🌱 Updating Requirement Types...');

  const requirementTypeUpdates = [
    { id: 1, code: 'compulsory', nameEn: 'Compulsory', nameAr: 'إجبارية', description: 'Mandatory subject — must be taken' },
    { id: 2, code: 'elective', nameEn: 'Elective', nameAr: 'اختيارية', description: 'Optional subject — student can choose' },
  ];

  for (const rt of requirementTypeUpdates) {
    await prisma.requirementTypes.update({
      where: { id: rt.id },
      data: { code: rt.code, nameEn: rt.nameEn, nameAr: rt.nameAr, description: rt.description, isActive: true },
    });
    console.log(`  ✓ RequirementType id=${rt.id}: ${rt.code} (${rt.nameEn} / ${rt.nameAr})`);
  }

  // Deactivate old entries we don't need
  await prisma.requirementTypes.updateMany({
    where: { id: { notIn: [1, 2] } },
    data: { isActive: false },
  });
  console.log('  ✓ Deactivated unused requirement types');

  // Map old SPECIALIZATION(3) subjects to major(2)
  console.log('🌱 Updating existing subjects...');
  const specSubjects = await prisma.subject.findMany({ where: { typeId: 3 } });
  if (specSubjects.length > 0) {
    await prisma.subject.updateMany({ where: { typeId: 3 }, data: { typeId: 2 } });
    console.log(`  ✓ Mapped ${specSubjects.length} specialization subjects → major`);
  }

  // Map old PREREQUISITE(3) requirement to compulsory(1)
  const prereqSubjects = await prisma.subject.findMany({ where: { requirementTypeId: 3 } });
  if (prereqSubjects.length > 0) {
    await prisma.subject.updateMany({ where: { requirementTypeId: 3 }, data: { requirementTypeId: 1 } });
    console.log(`  ✓ Mapped ${prereqSubjects.length} prerequisite subjects → compulsory`);
  }

  // Ensure all subjects have valid typeId and requirementTypeId
  const noType = await prisma.subject.findMany({ where: { typeId: { notIn: [1, 2] } } });
  if (noType.length > 0) {
    await prisma.subject.updateMany({ where: { typeId: { notIn: [1, 2] } }, data: { typeId: 1 } });
    console.log(`  ✓ Set ${noType.length} subjects to default type (general)`);
  }

  const noReq = await prisma.subject.findMany({ where: { requirementTypeId: { notIn: [1, 2] } } });
  if (noReq.length > 0) {
    await prisma.subject.updateMany({ where: { requirementTypeId: { notIn: [1, 2] } }, data: { requirementTypeId: 1 } });
    console.log(`  ✓ Set ${noReq.length} subjects to default requirement (compulsory)`);
  }

  console.log('✅ Update completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
