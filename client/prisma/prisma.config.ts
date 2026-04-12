import type { PrismaConfig } from '@prisma/client'

const config: PrismaConfig = {
  datasources: {
    db: {
      provider: 'postgresql',
      url: process.env.DATABASE_URL || "postgresql://military_lms:military_lms123@localhost:5432/military_lms",
    },
  },
  // Enable Prisma Optimizer
  optimizer: {
    enabled: true,
    // Configuration for local PostgreSQL
    cacheStrategy: 'default',
    // Enable query optimization
    queryOptimization: true,
    // Enable connection pooling for local development
    connectionPooling: {
      enabled: true,
      maxConnections: 10,
    },
  },
}

export default config
