import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const defaultDevConnection =
  process.env.NODE_ENV !== "production" ? "file:./dev.db" : undefined;
const connectionString = process.env.DATABASE_URL || defaultDevConnection;

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({
    url: connectionString ?? "file:./dev.db",
  }),
});

async function main() {
  const adminHash = await bcrypt.hash("admin123", 10);
  const inspectorHash = await bcrypt.hash("inspector123", 10);

  await prisma.user.upsert({
    where: { email: "admin@nspowersolution.com" },
    update: {},
    create: {
      name: "System Admin",
      email: "admin@nspowersolution.com",
      passwordHash: adminHash,
      role: "ADMIN",
      phone: "9899647757",
    },
  });

  await prisma.user.upsert({
    where: { email: "inspector@nspowersolution.com" },
    update: {},
    create: {
      name: "Field Inspector",
      email: "inspector@nspowersolution.com",
      passwordHash: inspectorHash,
      role: "INSPECTOR",
      phone: "9625284489",
    },
  });

  const customer = await prisma.customer.upsert({
    where: { id: "seed-customer-1" },
    update: {},
    create: {
      id: "seed-customer-1",
      name: "ABC Commercial Complex",
      phone: "9876543210",
      email: "facility@abc.com",
      address: "Sector 62, Noida",
    },
  });

  const property = await prisma.property.upsert({
    where: { id: "seed-property-1" },
    update: {},
    create: {
      id: "seed-property-1",
      customerId: customer.id,
      buildingName: "ABC Tower Block A",
      buildingAddress: "Plot 12, Sector 62, Noida",
      contactPerson: "Mr. Sharma",
      phone: "9876543210",
      email: "facility@abc.com",
      buildingType: "EXISTING",
    },
  });

  await prisma.formTemplate.upsert({
    where: { slug: "fire-pump-routine" },
    update: {},
    create: {
      slug: "fire-pump-routine",
      name: "Fire & Pump Routine Checklist",
      description:
        "Routine inspection checklist for fire pump systems in buildings",
      formKind: "FIRE_PUMP",
    },
  });

  await prisma.formTemplate.upsert({
    where: { slug: "field-service-report" },
    update: {},
    create: {
      slug: "field-service-report",
      name: "Field Service Report (F.S.R.)",
      description:
        "DG set field service report for Kirloskar & Cummins gensets",
      formKind: "FSR",
    },
  });

  await prisma.amcContract.upsert({
    where: { id: "seed-amc-1" },
    update: {},
    create: {
      id: "seed-amc-1",
      propertyId: property.id,
      customerId: customer.id,
      frequency: "QUARTERLY",
      startDate: new Date("2025-01-01"),
      nextDueDate: new Date("2026-06-15"),
      assignedToId: (
        await prisma.user.findUnique({
          where: { email: "inspector@nspowersolution.com" },
        })
      )!.id,
      notes: "Quarterly fire pump inspection",
    },
  });

  console.log("Seed complete. Default users created — change passwords after first login.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
