/**
 * Seed Arabic name fields for users missing them.
 * Run: node backend/scripts/seed-arabic-names.js
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const FIRST_NAME_AR = {
  shareef: 'شريف',
  sharif: 'شريف',
  ahmed: 'أحمد',
  ahmad: 'أحمد',
  mohammed: 'محمد',
  muhammad: 'محمد',
  mohamed: 'محمد',
  ali: 'علي',
  omar: 'عمر',
  khalid: 'خالد',
  saeed: 'سعيد',
  saed: 'سعيد',
  abdullah: 'عبدالله',
  abdulrahman: 'عبدالرحمن',
  fahad: 'فهد',
  faisal: 'فيصل',
  sultan: 'سلطان',
  hamad: 'حمد',
  nasser: 'ناصر',
  jassim: 'جاسم',
  yousef: 'يوسف',
  yusuf: 'يوسف',
  ibrahim: 'إبراهيم',
  hassan: 'حسن',
  hussein: 'حسين',
  mahmoud: 'محمود',
  khaled: 'خالد',
  rashid: 'راشد',
  saleh: 'صالح',
  talal: 'طلال',
  john: 'جون',
  jane: 'جين',
  michael: 'مايكل',
  david: 'ديفيد',
  sarah: 'سارة',
  fatima: 'فاطمة',
  mariam: 'مريم',
  aisha: 'عائشة',
  noor: 'نور',
  layla: 'ليلى',
  student: 'طالب',
  instructor: 'مدرب',
  admin: 'مشرف',
  pending: 'معلق',
  sync: 'مزامنة',
};

const LAST_NAME_AR = {
  hiasat: 'حياة',
  alhiasat: 'الحياة',
  al: 'ال',
  hassan: 'حسن',
  ahmed: 'أحمد',
  ali: 'علي',
  khalifa: 'خليفة',
  althani: 'الثاني',
  alkuwari: 'الكواري',
  almarri: 'المري',
  almansouri: 'المنصوري',
  alnaimi: 'النعيمي',
  student: 'طالب',
  sync: 'مزامنة',
};

function toKey(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z]/g, '');
}

function transliteratePart(part) {
  const key = toKey(part);
  if (!key) return '';
  if (FIRST_NAME_AR[key]) return FIRST_NAME_AR[key];
  if (LAST_NAME_AR[key]) return LAST_NAME_AR[key];
  return part;
}

function splitEnglishName(user) {
  if (user.firstName || user.lastName) {
    return {
      first: user.firstName || '',
      last: user.lastName || '',
    };
  }
  const source = user.realName || user.displayName || user.email?.split('@')[0] || '';
  const parts = source.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: '', last: '' };
  if (parts.length === 1) return { first: parts[0], last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

function buildArabicNames(user) {
  const { first, last } = splitEnglishName(user);
  const firstNameAr = transliteratePart(first) || null;
  const lastNameAr = transliteratePart(last) || null;
  const displayNameAr = [firstNameAr, lastNameAr].filter(Boolean).join(' ').trim() || null;
  return { firstNameAr, lastNameAr, displayNameAr };
}

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      displayName: true,
      realName: true,
      firstNameAr: true,
      lastNameAr: true,
      displayNameAr: true,
    },
  });

  let updated = 0;
  for (const user of users) {
    const needsUpdate = !user.displayNameAr && !user.firstNameAr && !user.lastNameAr;
    if (!needsUpdate) continue;

    const arabic = buildArabicNames(user);
    if (!arabic.displayNameAr && !arabic.firstNameAr) continue;

    await prisma.user.update({
      where: { id: user.id },
      data: arabic,
    });
    updated += 1;
    console.log(`Updated user ${user.id} (${user.email}): ${arabic.displayNameAr}`);
  }

  console.log(`Done. Updated ${updated} of ${users.length} users.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
