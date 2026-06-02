import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const connectionString = process.env.DATABASE_URL;
// Never throw at import-time (Vercel cold starts). If DATABASE_URL is missing,
// use a dummy connection string. The real error will surface at query time.
const safeConnectionString =
  connectionString ||
  "postgres://invalid:invalid@localhost:5432/invalid?sslmode=disable";
const adapter = new PrismaPg({ connectionString: safeConnectionString });

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
