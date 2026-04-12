const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function dropAllCollections() {
  console.log('🗑️ Dropping all collections...\n');

  try {
    // Get all collections
    const collections = await prisma.$runCommandRaw({ listCollections: 1 });
    const existingCollections = collections.cursor.firstBatch.map(c => c.name);

    console.log('📊 Collections to drop:', existingCollections.join(', '));

    // Drop each collection
    for (const collectionName of existingCollections) {
      try {
        await prisma.$runCommandRaw({ drop: collectionName });
        console.log(`✅ Dropped: ${collectionName}`);
      } catch (error) {
        console.log(`⚠️  Failed to drop ${collectionName}: ${error.message}`);
      }
    }

    console.log('\n🎉 All collections dropped successfully!');
    console.log('📊 Database is now empty and ready for Prisma push.\n');

  } catch (error) {
    console.error('❌ Error dropping collections:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the drop operation
dropAllCollections()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
