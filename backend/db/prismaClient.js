/**
 * Shared Prisma Client Singleton
 *
 * Every service/controller in the backend MUST import `prisma` from here
 * instead of creating its own `new PrismaClient()`.  Having 100+ separate
 * PrismaClient instances exhausted PostgreSQL's connection pool
 * (default max_connections = 100), causing P2037 "too many clients"
 * errors on every API call.
 *
 * PrismaClient already maintains an internal connection pool and is
 * designed to be reused across the entire application.  A single
 * instance with sensible pool limits is the production-correct approach.
 */

import { PrismaClient } from '@prisma/client';

// Connection pool limits — keep well under PostgreSQL's max_connections.
// Prisma uses these to cap concurrent DB connections from this process.
// See: https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/in-depth
const url = new URL(process.env.DATABASE_URL);
if (!url.searchParams.has('connection_limit')) {
  url.searchParams.set('connection_limit', '10');
}
if (!url.searchParams.has('pool_timeout')) {
  url.searchParams.set('pool_timeout', '10');
}

const prisma = new PrismaClient({
  log: ['error', 'warn'],
  datasources: {
    db: { url: url.toString() },
  },
});

export default prisma;
export { prisma };
