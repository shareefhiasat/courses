require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { exec } = require('child_process');
const path = require('path');

const prisma = new PrismaClient();

async function runScript(scriptName) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, scriptName);
    exec(`node "${scriptPath}"`, { cwd: path.dirname(__dirname) }, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error running ${scriptName}:`, error);
        reject(error);
      } else {
        console.log(stdout);
        if (stderr) console.error(stderr);
        resolve();
      }
    });
  });
}

async function completeResetAndSeed() {
  console.log('🔄 Starting complete database reset and seed...\n');
  
  try {
    // Step 1: Clear all data and reset auto-increment
    console.log('📋 Step 1/12: Clearing all data...');
    await runScript('clear-and-reset-all.cjs');
    
    // Step 2: Seed lookup tables
    console.log('\n📋 Step 2/12: Seeding lookup tables...');
    await runScript('../../prisma/seed-all.ts');
    
    // Step 3: Create super admin
    console.log('\n📋 Step 3/12: Creating super admin...');
    await runScript('create-super-admin.cjs');
    
    // Step 4: Create basic academic data
    console.log('\n📋 Step 4/12: Creating basic academic data...');
    await runScript('create-basic-data.cjs');
    
    // Step 5: Create test instructors
    console.log('\n📋 Step 5/12: Creating test instructors...');
    await runScript('create-test-instructors.cjs');
    
    // Step 6: Create test HR users
    console.log('\n📋 Step 6/12: Creating test HR users...');
    await runScript('create-test-hr.cjs');
    
    // Step 7: Create test admin users
    console.log('\n📋 Step 7/12: Creating test admin users...');
    await runScript('create-test-admins.cjs');
    
    // Step 8: Create test students
    console.log('\n📋 Step 8/12: Creating test students...');
    await runScript('create-test-students.cjs');
    
    // Step 9: Create sample resources
    console.log('\n📋 Step 9/12: Creating sample resources...');
    await runScript('create-sample-resources.cjs');
    
    // Step 10: Create sample announcements
    console.log('\n📋 Step 10/12: Creating sample announcements...');
    await runScript('create-sample-announcements.cjs');
    
    // Step 11: Create sample penalties
    console.log('\n📋 Step 11/12: Creating sample penalties...');
    await runScript('create-sample-penalties.cjs');
    
    // Step 12: Create sample participations
    console.log('\n📋 Step 12/12: Creating sample participations...');
    await runScript('create-sample-participations.cjs');
    
    // Step 13: Create sample behaviors
    console.log('\n📋 Step 13/12: Creating sample behaviors...');
    await runScript('create-sample-behaviors.cjs');
    
    // Step 14: Create student enrollments
    console.log('\n📋 Step 14/16: Creating student enrollments...');
    await runScript('create-enrollments.cjs');
    
    // Step 15: Create sample marks
    console.log('\n📋 Step 15/16: Creating sample student marks...');
    await runScript('create-sample-marks.cjs');
    
    // Step 16: Create sample attendance
    console.log('\n📋 Step 16/16: Creating sample attendance records...');
    await runScript('create-sample-attendance.cjs');
    
    console.log('\n🎉 Complete database reset and seed finished successfully!');
    console.log('\n📊 Final State:');
    
    // Verify final state
    const userCount = await prisma.user.count();
    const classCount = await prisma.class.count();
    const resourceCount = await prisma.resource.count();
    const announcementCount = await prisma.announcement.count();
    const penaltyCount = await prisma.penalty.count();
    const participationCount = await prisma.participation.count();
    const behaviorCount = await prisma.behavior.count();
    const enrollmentCount = await prisma.enrollment.count();
    const marksCount = await prisma.studentMarks.count();
    const attendanceCount = await prisma.attendance.count();
    
    console.log(`  - Users: ${userCount}`);
    console.log(`  - Classes: ${classCount}`);
    console.log(`  - Resources: ${resourceCount}`);
    console.log(`  - Announcements: ${announcementCount}`);
    console.log(`  - Penalties: ${penaltyCount}`);
    console.log(`  - Participations: ${participationCount}`);
    console.log(`  - Behaviors: ${behaviorCount}`);
    console.log(`  - Enrollments: ${enrollmentCount}`);
    console.log(`  - Student Marks: ${marksCount}`);
    console.log(`  - Attendance Records: ${attendanceCount}`);
    
    console.log('\n✅ Super Admin is ID 1 (shareef.hiasat@gmail.com)');
    console.log('\n🚀 System is ready for testing!\n');
    
  } catch (error) {
    console.error('\n❌ Error during reset and seed:', error);
    throw error;
  }
}

// Run the complete reset and seed
completeResetAndSeed()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
