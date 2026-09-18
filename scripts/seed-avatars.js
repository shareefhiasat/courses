/**
 * Seed avatar images from DiceBear into MinIO and attach them to user profiles.
 *
 * Uses a MIX of DiceBear styles for maximum diversity, especially for students:
 *   - Students: Micah, Notionists, Open Peeps, Avataaars, Fun Emoji, Bottts
 *   - Staff (HR/Instructor/Admin): Open Peeps (consistent professional look)
 *
 * Usage:
 *   node scripts/seed-avatars.js              # only seed users without avatars
 *   OVERWRITE=1 node scripts/seed-avatars.js  # regenerate ALL avatars
 *
 * The script downloads PNG avatars, uploads them to the private MinIO bucket
 * under `Users/{userId}/images/profile.png`, and stores the object key in
 * `user.profileImageUrl`. This keeps the LMS offline after the one-time download.
 */

import '../backend/loadEnv.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import prisma from '../backend/db/prismaClient.js';
import { putObject } from '../backend/services/minioService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BUCKET = process.env.MINIO_BUCKET_PRIVATE || 'lms-private';

// Set to true to regenerate avatars for users that already have a profileImageUrl.
const OVERWRITE = process.env.OVERWRITE === '1' || process.env.OVERWRITE === 'true';

// ─── DiceBear style pools ───────────────────────────────────────────────────
// Students get a random style from this mix for maximum diversity.
const STUDENT_STYLES = [
  'micah',
  'notionists',
  'open-peeps',
  'avataaars',
  'fun-emoji',
  'bottts',
  'thumbs',
  'shapes',
];

// Staff keep a single consistent style.
const STAFF_STYLE = 'open-peeps';

// Open Peeps options (used for staff and as one of the student styles)
const FEMALE_HEADS = ['long', 'longBangs', 'longCurly'];
const MALE_HEADS = ['short1', 'short2', 'short3'];
const ACCESSORIES = ['glasses', 'glasses2', 'glasses3', 'glasses4', 'glasses5'];

// Avataaars options
const AVATAAARS_TOPS = ['shortFlat', 'shortRound', 'shortDreads01', 'shortDreads02', 'sidesweptFringe', 'mohawk', 'buzzcut', 'afro', 'afroFade', 'turban'];
const AVATAAARS_CLOTHES = ['blazerSweater', 'sweater', 'shirtScoopNeck', 'shirtVNeck', 'hoodie', 'overall', 'graphicShirt'];
const AVATAAARS_FACIAL_HAIR = ['none', 'stubbleLight', 'stubbleMed', 'beardLight', 'beardMed', 'beardMajestic'];
const AVATAAARS_ACCESSORIES = ['kurt', 'kurt', 'kurt', 'prescription01', 'prescription02', 'round', 'sunglasses'];

// Micah options
const MICAH_MOUTHS = ['smile', 'laughing', 'pucker', 'sad', 'serious', 'smirk', 'surprised'];
const MICAH_BACKGROUNDS = ['ffd5dc', 'ffdfbf', 'd1f4ff', 'c0aede', 'b6e3ff', 'ffaae3', 'e0e0e0', 'c4f7d5'];

// Notionists options
const NOTIONISTS_FACES = ['smile', 'smileBig', 'sad', 'calm', 'surprised', 'serious'];
const NOTIONISTS_BACKGROUNDS = ['e7e7e7', 'f0f0f0', 'c4b5fd', 'fde68a', 'bfdbfe', 'fecaca', 'd9f99d'];

// Common female first names (English + Arabic). Names not in this list default to male.
const FEMALE_NAMES = new Set([
  'emily', 'lisa', 'sarah', 'jennifer', 'patricia', 'maria', 'fatima', 'aisha', 'layla',
  'mariam', 'noura', 'nura', 'sara', 'lina', 'maya', 'nadia', 'hana', 'huda', 'amal',
  'reem', 'maha', 'dana', 'lama', 'salma', 'rania', 'jane', 'mary', 'jessica', 'linda',
  'barbara', 'elizabeth', 'susan', 'karen', 'nancy', 'laura', 'michelle', 'kimberly',
  'donna', 'carol', 'ruth', 'sharon', 'kathleen', 'amy', 'angela', 'helen', 'anna',
  'sandra', 'betty', 'brenda', 'pamela', 'nicole', 'katherine', 'christine', 'catherine',
  'virginia', 'cynthia', 'janet', 'deborah', 'frances', 'joyce', 'diana', 'joan', 'megan',
  'gloria', 'jean', 'hannah', 'olivia', 'emma', 'sophia', 'mia', 'isabella', 'charlotte',
  'amelia', 'evelyn', 'abigail', 'ella', 'scarlett', 'grace', 'chloe', 'victoria', 'riley',
  'aria', 'lily', 'aubrey', 'zoe', 'penelope', 'lyla', 'leah', 'audrey', 'bella', 'claire',
  'skylar', 'genesis', 'naomi', 'elena', 'alice', 'mackenzie', 'gabriella', 'allie',
  // Arabic female names
  'khadija', 'asma', 'yasmin', 'samira', 'karima', 'mona', 'dina', 'samar', 'ghada',
  'hend', 'iman', 'faten', 'hiba', 'rasha', 'shereen', 'tamara', 'wafaa', 'zeina',
  'bashayer', 'buthaina', 'latifa', 'maitha', 'mouza', 'najla', 'ouda', 'qadria',
  'shamma', 'thana', 'wadeema', 'yousra', 'zahra',
]);

function normalizeFirstName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/^(dr|prof|mr|mrs|ms|miss)\.?/i, '')
    .replace(/\./g, '')
    .trim();
}

function isFemaleName(name) {
  return FEMALE_NAMES.has(normalizeFirstName(name));
}

function hasHrRole(user) {
  return (user.roleAssignments || []).some((ra) => ra.role?.code?.toLowerCase() === 'hr');
}

function isStudent(user) {
  return (user.roleAssignments || []).some((ra) => ra.role?.code?.toLowerCase() === 'student');
}

function isStaff(user) {
  const codes = (user.roleAssignments || []).map((ra) => ra.role?.code?.toLowerCase() || '');
  return codes.some((c) => ['hr', 'instructor', 'admin', 'super_admin'].includes(c));
}

function determineGender(user) {
  // All users are male officers — always generate male avatars.
  return 'male';
}

function pickFromSeed(seed, items) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % items.length;
  return items[index];
}

function buildOpenPeepsUrl(seed, gender) {
  const headPool = gender === 'female' ? FEMALE_HEADS : MALE_HEADS;
  const head = pickFromSeed(seed, headPool);
  const accessories = pickFromSeed(seed + 'acc', ACCESSORIES);
  const params = new URLSearchParams({
    seed,
    face: 'smile',
    head,
    accessories,
  });
  return `https://api.dicebear.com/9.x/open-peeps/png?${params.toString()}`;
}

function buildAvataaarsUrl(seed, gender) {
  const params = new URLSearchParams({
    seed,
    backgroundColor: 'ffffff',
    topLevel: pickFromSeed(seed + 'top', AVATAAARS_TOPS),
    accessories: pickFromSeed(seed + 'acc', AVATAAARS_ACCESSORIES),
    clothes: pickFromSeed(seed + 'cl', AVATAAARS_CLOTHES),
    skinColor: pickFromSeed(seed + 'skin', ['fcd9b6', 'ffdbac', 'edb98a', 'd08b5b', 'ae5d29', 'fd984b']),
    hairColor: pickFromSeed(seed + 'hair', ['a55728', 'b7a24e', '3a3a3a', '4a312c', '724a23', 'e8d1a3', '6c4b2a']),
    clotheColor: pickFromSeed(seed + 'cc', ['262e33', '3c4f5c', '6569ff', '5cd5db', 'ff5c5c', 'a7f0d3', 'ffde9e', '929497']),
  });
  return `https://api.dicebear.com/9.x/avataaars/png?${params.toString()}`;
}

function buildMicahUrl(seed) {
  const params = new URLSearchParams({
    seed,
    mouth: pickFromSeed(seed + 'm', MICAH_MOUTHS),
    backgroundColor: pickFromSeed(seed + 'bg', MICAH_BACKGROUNDS),
  });
  return `https://api.dicebear.com/9.x/micah/png?${params.toString()}`;
}

function buildNotionistsUrl(seed) {
  const params = new URLSearchParams({
    seed,
    face: pickFromSeed(seed + 'f', NOTIONISTS_FACES),
    backgroundColor: pickFromSeed(seed + 'bg', NOTIONISTS_BACKGROUNDS),
  });
  return `https://api.dicebear.com/9.x/notionists/png?${params.toString()}`;
}

function buildFunEmojiUrl(seed) {
  const params = new URLSearchParams({
    seed,
    backgroundColor: pickFromSeed(seed + 'bg', ['ffd5dc', 'ffdfbf', 'd1f4ff', 'c0aede', 'b6e3ff', 'ffaae3']),
  });
  return `https://api.dicebear.com/9.x/fun-emoji/png?${params.toString()}`;
}

function buildBotttsUrl(seed) {
  const params = new URLSearchParams({
    seed,
    colors: pickFromSeed(seed + 'c', ['ffd5dc', 'ffdfbf', 'd1f4ff', 'c0aede', 'b6e3ff']),
  });
  return `https://api.dicebear.com/9.x/bottts/png?${params.toString()}`;
}

function buildThumbsUrl(seed) {
  const params = new URLSearchParams({
    seed,
  });
  return `https://api.dicebear.com/9.x/thumbs/png?${params.toString()}`;
}

function buildShapesUrl(seed) {
  const params = new URLSearchParams({
    seed,
    backgroundColor: pickFromSeed(seed + 'bg', ['ffd5dc', 'ffdfbf', 'd1f4ff', 'c0aede', 'b6e3ff', 'ffaae3']),
  });
  return `https://api.dicebear.com/9.x/shapes/png?${params.toString()}`;
}

const STYLE_BUILDERS = {
  'open-peeps': (seed, gender) => buildOpenPeepsUrl(seed, gender),
  'avataaars': (seed, gender) => buildAvataaarsUrl(seed, gender),
  'micah': (seed) => buildMicahUrl(seed),
  'notionists': (seed) => buildNotionistsUrl(seed),
  'fun-emoji': (seed) => buildFunEmojiUrl(seed),
  'bottts': (seed) => buildBotttsUrl(seed),
  'thumbs': (seed) => buildThumbsUrl(seed),
  'shapes': (seed) => buildShapesUrl(seed),
};

function buildAvatarUrl(email, gender, isStudentUser) {
  const seed = email.toLowerCase().split('@')[0].replace(/[^a-z0-9]/g, '-');

  if (isStudentUser) {
    // Pick a random style from the student pool based on seed hash
    const style = pickFromSeed(seed + 'style', STUDENT_STYLES);
    const builder = STYLE_BUILDERS[style];
    return { url: builder(seed, gender), style };
  }

  // Staff: use Open Peeps consistently
  return { url: buildOpenPeepsUrl(seed, gender), style: STAFF_STYLE };
}

async function downloadAvatar(url, destPath) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download avatar: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await fs.writeFile(destPath, buffer);
  return buffer;
}

async function seedAvatars() {
  const users = await prisma.user.findMany({
    include: {
      roleAssignments: {
        include: {
          role: { select: { code: true } },
        },
      },
    },
    orderBy: { id: 'asc' },
  });

  console.log(`Found ${users.length} users. Seeding avatars...`);

  let processed = 0;
  let skipped = 0;
  const styleCounts = {};

  for (const user of users) {
    if (!OVERWRITE && user.profileImageUrl) {
      console.log(`  ⏭️  skipping ${user.email} (already has avatar)`);
      skipped++;
      continue;
    }

    const gender = determineGender(user);
    const studentFlag = isStudent(user);
    const { url, style } = buildAvatarUrl(user.email, gender, studentFlag);
    console.log(`\n[${user.email}] gender=${gender} student=${studentFlag} style=${style} → ${url}`);

    try {
      const tmpFile = path.join('/tmp', `avatar-${user.id}.png`);
      const buffer = await downloadAvatar(url, tmpFile);
      const objectKey = `Users/${user.id}/images/profile.png`;

      console.log(`  Downloaded ${buffer.length} bytes → uploading to MinIO ${BUCKET}/${objectKey}`);
      await putObject(BUCKET, objectKey, buffer, buffer.length, { 'Content-Type': 'image/png' });

      await prisma.user.update({
        where: { id: user.id },
        data: { profileImageUrl: objectKey },
      });

      console.log(`  ✅ profileImageUrl updated for ${user.email} (${user.keycloakId})`);
      styleCounts[style] = (styleCounts[style] || 0) + 1;
      processed++;
      await fs.unlink(tmpFile).catch(() => {});
      // Small pause to be polite to the DiceBear API.
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`  ❌ Failed for ${user.email}: ${error.message}`);
      // Continue with the next user.
    }
  }

  console.log(`\nDone. Processed: ${processed}, skipped: ${skipped}, total: ${users.length}`);
  console.log('\nStyle distribution:');
  for (const [style, count] of Object.entries(styleCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${style}: ${count}`);
  }
  await prisma.$disconnect();
}

seedAvatars().catch(async (err) => {
  console.error('Avatar seeding failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
