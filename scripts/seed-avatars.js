/**
 * Seed avatar images from DiceBear (Open Peeps) into MinIO and attach them to user profiles.
 *
 * Usage: node scripts/seed-avatars.js
 *
 * The script downloads PNG avatars for the configured users, uploads them to the private
 * MinIO bucket under `Users/{userId}/images/profile.png`, and stores the object key in
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
const OVERWRITE = false;

const FEMALE_HEADS = ['long', 'longBangs', 'longCurly'];
const MALE_HEADS = ['short1', 'short2', 'short3'];
const ACCESSORIES = ['glasses', 'glasses2', 'glasses3', 'glasses4', 'glasses5'];

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

function determineGender(user) {
  // HR users are always female per product requirement.
  if (hasHrRole(user)) return 'female';
  return isFemaleName(user.firstName) ? 'female' : 'male';
}

function pickFromSeed(seed, items) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % items.length;
  return items[index];
}

function buildAvatarUrl(email, gender) {
  const seed = email.toLowerCase().split('@')[0].replace(/[^a-z0-9]/g, '-');
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

  for (const user of users) {
    if (!OVERWRITE && user.profileImageUrl) {
      console.log(`  ⏭️  skipping ${user.email} (already has avatar)`);
      skipped++;
      continue;
    }

    const gender = determineGender(user);
    const url = buildAvatarUrl(user.email, gender);
    console.log(`\n[${user.email}] gender=${gender} → ${url}`);

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
  await prisma.$disconnect();
}

seedAvatars().catch(async (err) => {
  console.error('Avatar seeding failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
