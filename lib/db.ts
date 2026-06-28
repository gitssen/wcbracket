import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

const databaseUrl = process.env.TURSO_DATABASE_URL || 'file:prisma/dev.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

const libsqlClient = createClient({
  url: databaseUrl,
  authToken: authToken,
});

const adapter = new PrismaLibSQL(libsqlClient);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
