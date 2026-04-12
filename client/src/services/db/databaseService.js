/**
 * Database Service - Prisma Client Management
 * 
 * PURPOSE: Centralized Prisma client with connection pooling
 * ARCHITECTURE: Business Services → DB Services → Prisma → PostgreSQL
 * NOTE: For API Server use only - NOT for browser environment
 */

import { PrismaClient } from '@prisma/client';

// Singleton Prisma client for connection pooling
let prisma = null;

const getDatabaseClient = () => {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: 'postgresql://military_lms:military_lms123@localhost:5432/military_lms'
        }
      },
      log: ['query', 'info', 'warn', 'error']
    });
  }
  return prisma;
};

// Graceful shutdown
const disconnectDatabase = async () => {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
};

// Handle process termination (API Server only)
if (typeof process !== 'undefined') {
  process.on('SIGINT', disconnectDatabase);
  process.on('SIGTERM', disconnectDatabase);
}

export { getDatabaseClient, disconnectDatabase };
