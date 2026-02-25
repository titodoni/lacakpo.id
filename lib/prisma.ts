import { PrismaClient } from '@prisma/client';
import { createClient } from '@libsql/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // Check if using Turso (libsql://) or local SQLite (file:)
  const databaseUrl = process.env.DATABASE_URL || '';
  
  if (databaseUrl.startsWith('libsql://') || databaseUrl.startsWith('https://')) {
    // Turso/libSQL connection (for Vercel/production)
    const libsql = createClient({
      url: databaseUrl,
      authToken: process.env.DATABASE_AUTH_TOKEN,
    });
    
    const adapter = new PrismaLibSQL(libsql);
    return new PrismaClient({ adapter });
  }
  
  // Local SQLite connection (for development)
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
