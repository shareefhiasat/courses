#!/usr/bin/env node

/**
 * Populate user_role_assignments table with role assignments
 * 
 * This script assigns roles to users in the database based on their email addresses.
 * It writes SQL to a temporary file and executes it to avoid shell quoting issues.
 */

import { execSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { randomBytes } from 'crypto';

// Role assignments based on user emails
const roleAssignments = [
  // HR Users
  { email: 'hr1@example.com', roleCode: 'HR' },
  { email: 'hr2@example.com', roleCode: 'HR' },
  { email: 'hr3@example.com', roleCode: 'HR' },
  { email: 'hr4@example.com', roleCode: 'HR' },
  { email: 'hr5@example.com', roleCode: 'HR' },

  // Admin Users
  { email: 'admin1@example.com', roleCode: 'ADMIN' },
  { email: 'admin2@example.com', roleCode: 'ADMIN' },
  { email: 'admin3@example.com', roleCode: 'ADMIN' },
  { email: 'admin4@example.com', roleCode: 'ADMIN' },
  { email: 'admin5@example.com', roleCode: 'ADMIN' },

  // Instructor Users
  { email: 'instructor1@example.com', roleCode: 'INSTRUCTOR' },
  { email: 'instructor2@example.com', roleCode: 'INSTRUCTOR' },
  { email: 'instructor3@example.com', roleCode: 'INSTRUCTOR' },
  { email: 'instructor4@example.com', roleCode: 'INSTRUCTOR' },
  { email: 'instructor5@example.com', roleCode: 'INSTRUCTOR' },

  // Student Users
  { email: 'student1@example.com', roleCode: 'STUDENT' },
  { email: 'student2@example.com', roleCode: 'STUDENT' },
  { email: 'student3@example.com', roleCode: 'STUDENT' },
  { email: 'student4@example.com', roleCode: 'STUDENT' },
  { email: 'student9@example.com', roleCode: 'STUDENT' },
  { email: 'student10@example.com', roleCode: 'STUDENT' },

  // Super Admin (for testing)
  { email: 'superadmin@example.com', roleCode: 'SUPER_ADMIN' }
];

function runSqlInContainer(containerPath) {
  try {
    const result = execSync(
      `docker exec lms-qaf-app-db psql -U military_lms -d military_lms -f ${containerPath}`,
      { encoding: 'utf-8' }
    );
    return result;
  } catch (error) {
    console.error('SQL Error:', error.stderr);
    throw error;
  }
}

async function assignRoles() {
  const hostTempFile = join(process.cwd(), `temp-assign-roles-${randomBytes(8).toString('hex')}.sql`);
  const containerTempFile = `/tmp/temp-assign-roles.sql`;
  
  try {
    console.log('🔄 Starting role assignment process...\n');

    for (const assignment of roleAssignments) {
      console.log(`👤 Processing: ${assignment.email} -> ${assignment.roleCode}`);

      // Write SQL to temporary file on host
      const sql = `INSERT INTO user_role_assignments ("userId", "roleId", "assignedAt", "assignedBy")
SELECT u.id, r.id, NOW(), 1
FROM users u
CROSS JOIN user_roles r
WHERE u.email = '${assignment.email}'
  AND r.code = '${assignment.roleCode}'
ON CONFLICT ("userId", "roleId") DO NOTHING;
`;
      writeFileSync(hostTempFile, sql);

      // Copy file into container
      execSync(`docker cp ${hostTempFile} lms-qaf-app-db:${containerTempFile}`);

      // Execute SQL from inside container
      runSqlInContainer(containerTempFile);
      
      // Clean up host file
      unlinkSync(hostTempFile);
      
      console.log('   ✅ Role assigned successfully\n');
    }

    console.log('🎉 Role assignment process completed!');
    
    // Show summary
    const summarySql = `SELECT u.email, ur.code as role_code 
FROM users u 
JOIN user_role_assignments ura ON u.id = ura."userId" 
JOIN user_roles ur ON ura."roleId" = ur.id 
WHERE u.email LIKE '%@example.com'
ORDER BY u.email;
`;
    writeFileSync(hostTempFile, summarySql);
    execSync(`docker cp ${hostTempFile} lms-qaf-app-db:${containerTempFile}`);
    const summaryResult = runSqlInContainer(containerTempFile);
    unlinkSync(hostTempFile);
    
    console.log('\n📊 Current role assignments:');
    console.log('Email'.padEnd(35) + 'Role');
    console.log('-'.repeat(50));
    const lines = summaryResult.split('\n');
    lines.slice(2, -2).forEach(line => {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 2) {
        console.log(parts[0].padEnd(35) + parts[1]);
      }
    });

  } catch (error) {
    console.error('❌ Error during role assignment:', error);
    // Clean up temp file on error
    try {
      unlinkSync(hostTempFile);
    } catch (e) {
      // Ignore
    }
    throw error;
  }
}

assignRoles().catch(console.error);
