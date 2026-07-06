/**
 * Sync cy.* demo users to Keycloak master realm (matching hr1/admin1/instructor1/student1 pattern).
 *
 * - Username: local-part of email (e.g. cy.hr1 from cy.hr1@example.com)
 * - Realm roles: HR+hr, ADMIN+admin, INSTRUCTOR+instructor, STUDENT+student
 * - Client roles (military-lms-app): HR, ADMIN, INSTRUCTOR, STUDENT
 * - Password: Jordan123$
 * - Updates users.keycloakId in PostgreSQL
 * - Optionally removes duplicate users from military-lms realm
 *
 * Usage:
 *   node scripts/keycloak/sync-cy-users-to-master.cjs
 *   node scripts/keycloak/sync-cy-users-to-master.cjs --skip-mlms-cleanup
 */

require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

const prisma = new PrismaClient();
const MASTER_REALM = 'master';
const MLMS_REALM = 'military-lms';
const CLIENT_ID = 'military-lms-app';
const PASSWORD = 'Jordan123$';
const SKIP_MLMS_CLEANUP = process.argv.includes('--skip-mlms-cleanup');

/** Matches hr1 / admin1 / instructor1 / student1 role mapping pattern */
const ROLE_PATTERNS = {
  HR: { realm: ['HR', 'hr'], client: ['HR'] },
  ADMIN: { realm: ['ADMIN', 'admin'], client: ['ADMIN'] },
  INSTRUCTOR: { realm: ['INSTRUCTOR', 'instructor'], client: ['INSTRUCTOR'] },
  STUDENT: { realm: ['STUDENT', 'student'], client: ['STUDENT'] },
};

function kc(cmd) {
  return execSync(cmd, { encoding: 'utf8', stdio: 'pipe' }).trim();
}

function kcAuth() {
  kc(
    `docker exec lms-qaf-keycloak /opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080 --realm master --user admin --password admin123`
  );
}

function getClientUuid(realm) {
  const out = kc(
    `docker exec lms-qaf-keycloak /opt/keycloak/bin/kcadm.sh get clients -r ${realm} -q clientId=${CLIENT_ID} --fields id --format csv --noquotes`
  );
  const lines = out.split('\n').filter(Boolean);
  return lines[lines.length - 1]?.replace(/"/g, '') || null;
}

function findUser(realm, username) {
  try {
    const out = kc(
      `docker exec lms-qaf-keycloak /opt/keycloak/bin/kcadm.sh get users -r ${realm} -q username="${username}" --fields id,username,email`
    );
    const parsed = JSON.parse(out || '[]');
    return parsed.find((u) => u.username === username) || null;
  } catch {
    return null;
  }
}

function createUser(realm, { username, email, firstName, lastName }) {
  kc(
    `docker exec lms-qaf-keycloak /opt/keycloak/bin/kcadm.sh create users -r ${realm} -s username="${username}" -s email="${email}" -s firstName="${firstName.replace(/"/g, '')}" -s lastName="${lastName.replace(/"/g, '')}" -s enabled=true -s emailVerified=true`
  );
  return findUser(realm, username);
}

function setPassword(realm, username) {
  kc(
    `docker exec lms-qaf-keycloak /opt/keycloak/bin/kcadm.sh set-password -r ${realm} --username "${username}" --new-password '${PASSWORD.replace(/'/g, "'\\''")}'`
  );
}

function assignRealmRoles(realm, userId, roleNames) {
  if (!roleNames.length) return;
  const args = roleNames.map((r) => `--rolename ${r}`).join(' ');
  try {
    kc(
      `docker exec lms-qaf-keycloak /opt/keycloak/bin/kcadm.sh add-roles -r ${realm} --uid ${userId} ${args}`
    );
  } catch (e) {
    if (!String(e.message).includes('already')) throw e;
  }
}

function assignClientRoles(realm, clientUuid, userId, roleNames) {
  if (!roleNames.length || !clientUuid) return;
  const args = roleNames.map((r) => `--rolename ${r}`).join(' ');
  try {
    kc(
      `docker exec lms-qaf-keycloak /opt/keycloak/bin/kcadm.sh add-roles -r ${realm} --uid ${userId} --cclientid ${CLIENT_ID} ${args}`
    );
  } catch (e) {
    if (!String(e.message).includes('already')) throw e;
  }
}

function deleteUser(realm, userId) {
  try {
    kc(`docker exec lms-qaf-keycloak /opt/keycloak/bin/kcadm.sh delete users/${userId} -r ${realm}`);
    return true;
  } catch {
    return false;
  }
}

function emailToUsername(email) {
  return email.split('@')[0];
}

async function ensureStudentUca(userId, programId, categoryId, createdBy) {
  const existing = await prisma.userCategoryAccess.findFirst({
    where: { userId, programId, subjectId: null, classId: null },
  });
  if (existing) return;
  await prisma.userCategoryAccess.create({
    data: {
      userId,
      categoryId,
      programId,
      canView: true,
      canManage: false,
      isActive: true,
      createdBy,
    },
  });
}

async function main() {
  console.log('🔑 Syncing cy.* users to Keycloak master realm\n');
  kcAuth();

  const masterClientUuid = getClientUuid(MASTER_REALM);
  if (!masterClientUuid) throw new Error(`Client ${CLIENT_ID} not found in master realm`);

  const cyUsers = await prisma.user.findMany({
    where: { email: { startsWith: 'cy.' } },
    include: { roleAssignments: { include: { role: true } } },
    orderBy: { email: 'asc' },
  });

  const program = await prisma.program.findFirst({ where: { code: 'CY-DIP' } });
  const category = await prisma.categoryTypes.findFirst({
    where: { OR: [{ code: 'CYBER' }, { code: 'TECHNICAL' }] },
  });
  const superAdminId = await prisma.user.findFirst({
    where: { roleAssignments: { some: { role: { code: 'SUPER_ADMIN' } } } },
    select: { id: true },
  });

  let linked = 0;
  let studentUca = 0;

  for (const user of cyUsers) {
    const roleCode = user.roleAssignments[0]?.role?.code || 'STUDENT';
    const pattern = ROLE_PATTERNS[roleCode];
    if (!pattern) {
      console.log(`  ⚠️  Skip ${user.email}: unknown role ${roleCode}`);
      continue;
    }

    const username = emailToUsername(user.email);
    const firstName = user.firstName || username;
    const lastName = user.lastName || 'User';

    // Remove stale military-lms copy if present
    if (!SKIP_MLMS_CLEANUP) {
      const mlmsUser = findUser(MLMS_REALM, user.email) || findUser(MLMS_REALM, username);
      if (mlmsUser?.id) {
        deleteUser(MLMS_REALM, mlmsUser.id);
        console.log(`  🗑️  Removed military-lms user: ${user.email}`);
      }
    }

    let kcUser = findUser(MASTER_REALM, username);
    if (!kcUser) {
      try {
        kcUser = createUser(MASTER_REALM, {
          username,
          email: user.email,
          firstName,
          lastName,
        });
        console.log(`  ✅ Created master user: ${username}`);
      } catch (err) {
        if (String(err.message).includes('User exists')) {
          kcUser = findUser(MASTER_REALM, username);
        } else {
          throw err;
        }
      }
    } else {
      console.log(`  ⏭️  Master user exists: ${username}`);
    }

    if (!kcUser?.id) {
      console.log(`  ❌ Could not resolve Keycloak user for ${user.email}`);
      continue;
    }

    setPassword(MASTER_REALM, username);
    assignRealmRoles(MASTER_REALM, kcUser.id, pattern.realm);
    assignClientRoles(MASTER_REALM, masterClientUuid, kcUser.id, pattern.client);

    await prisma.user.update({
      where: { id: user.id },
      data: { keycloakId: kcUser.id },
    });
    linked++;

    // Program-level view UCA for students (scoped program visibility)
    if (roleCode === 'STUDENT' && program && category && superAdminId) {
      await ensureStudentUca(user.id, program.id, category.id, superAdminId.id);
      studentUca++;
    }
  }

  console.log(`\n✅ Linked ${linked} cy.* users to master realm (password: ${PASSWORD})`);
  if (studentUca) console.log(`✅ Ensured program-view UCA for ${studentUca} students`);
  console.log('\nMaster usernames: cy.hr1, cy.admin1, cy.instructor1–4, cy.student1–20');
  if (SKIP_MLMS_CLEANUP) {
    console.log('\nℹ️  military-lms cleanup skipped — delete cy.* users there manually if needed.');
  } else {
    console.log('\nℹ️  Removed cy.* duplicates from military-lms realm.');
  }
}

main()
  .catch((err) => {
    console.error('❌ Sync failed:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
