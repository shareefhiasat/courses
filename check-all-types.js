import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAllTables() {
  try {
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND (table_name LIKE '%_types' OR table_name LIKE '%types')
      ORDER BY table_name
    `;
    
    console.log('📋 All Type Tables:');
    for (const table of tables) {
      try {
        const count = await prisma.$queryRaw`SELECT COUNT(*) as count FROM ${prisma.$queryRawUnsafe(table.table_name)}`;
        console.log(`  ${table.table_name}: ${count[0].count} records`);
      } catch (error) {
        console.log(`  ${table.table_name}: Error - ${error.message}`);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllTables();
