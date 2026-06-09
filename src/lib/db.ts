import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const defaultDevConnection =
  process.env.NODE_ENV !== "production" ? "file:./dev.db" : undefined;
export const connectionString = process.env.DATABASE_URL || defaultDevConnection;
export const databaseUrlMissing = !connectionString && process.env.NODE_ENV === "production";

const adapter = new PrismaBetterSqlite3({
  url: connectionString ?? "file:./dev.db",
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
