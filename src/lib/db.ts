import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

// Cache the client on the global object in every environment. In dev this
// prevents HMR from opening a new pool on each reload; on serverless (Vercel)
// it lets warm invocations reuse a single client instead of exhausting the
// connection pool on each request.
globalForPrisma.prisma = prisma;
