import { startOfMonth, endOfMonth } from "date-fns";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api";
import { json } from "@/lib/api";

export async function GET() {
  const session = await requireAuth();
  if (session instanceof Response) return session;

  const isAdmin = session.role === "ADMIN";
  const baseWhere = isAdmin
    ? {}
    : { OR: [{ assignedToId: session.userId }, { createdById: session.userId }] };

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [total, pending, completed, monthlyCount, recent, overdueAmc] =
    await Promise.all([
      prisma.inspection.count({ where: baseWhere }),
      prisma.inspection.count({
        where: {
          ...baseWhere,
          status: { in: ["DRAFT", "ASSIGNED", "IN_PROGRESS"] },
        },
      }),
      prisma.inspection.count({
        where: { ...baseWhere, status: "COMPLETED" },
      }),
      prisma.inspection.count({
        where: {
          ...baseWhere,
          inspectionDate: { gte: monthStart, lte: monthEnd },
        },
      }),
      prisma.inspection.findMany({
        where: baseWhere,
        orderBy: { updatedAt: "desc" },
        take: 8,
        select: {
          id: true,
          buildingName: true,
          status: true,
          inspectionDate: true,
          satisfactory: true,
          updatedAt: true,
          inspectorName: true,
        },
      }),
      isAdmin
        ? prisma.amcContract.count({
            where: { nextDueDate: { lt: now } },
          })
        : Promise.resolve(0),
    ]);

  return json({
    total,
    pending,
    completed,
    monthlyCount,
    overdueAmc,
    recent,
  });
}
