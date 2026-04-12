import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTables() {
  try {
    // List all tables
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log('📋 Available Tables:');
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    // Check users table structure
    try {
      const userColumns = await prisma.$queryRaw`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        ORDER BY ordinal_position
      `;
      
      console.log('\n📋 Users Table Columns:');
      userColumns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    } catch (error) {
      console.log('Users table not found');
    }
    
    // Check counts for tables that exist
    const tableCounts = [
      'users', 'user_roles', 'user_status_types', 'enrollment_status_types', 
      'participation_types', 'programs', 'subjects', 'classes', 'enrollments', 'participations'
    ];
    
    console.log('\n📊 Table Counts:');
    for (const tableName of tableCounts) {
      try {
        const result = await prisma.$queryRaw`SELECT COUNT(*) as count FROM ${prisma.$queryRawUnsafe(tableName)}`;
        console.log(`  ${tableName}: ${result[0].count} records`);
      } catch (error) {
        console.log(`  ${tableName}: Error - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();
