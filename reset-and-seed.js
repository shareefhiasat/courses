#!/usr/bin/env node

import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('🔄 Starting complete database reset and realistic seeding...\n');

async function resetAndSeed() {
  try {
    // Step 1: Reset database completely
    console.log('🗑️  Resetting database...');
    execSync('cd client && pnpm db:reset --force', { stdio: 'inherit' });
    
    // Step 2: Push schema and generate
    console.log('\n📋 Pushing schema and generating client...');
    execSync('cd client && pnpm db:push && pnpm db:generate', { stdio: 'inherit' });
    
    // Step 3: Run basic seed
    console.log('\n🌱 Running basic seed...');
    execSync('pnpm db:seed', { stdio: 'inherit' });
    
    // Step 4: Run realistic academic seed
    console.log('\n🎓 Running realistic academic seed...');
    execSync('pnpm db:seed:realistic', { stdio: 'inherit' });
    
    console.log('\n✅ Database reset and realistic seeding completed successfully!');
    console.log('\n🚀 You can now start the application with:');
    console.log('   pnpm dev');
    console.log('   pnpm api:dev');
    
  } catch (error) {
    console.error('\n❌ Error during reset and seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetAndSeed();
