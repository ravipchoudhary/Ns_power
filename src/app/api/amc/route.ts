import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api";
import { json } from "@/lib/api";

export async function GET(request: Request) {
  const session = await requireAuth();
  if (session instanceof Response) return session;

  const dueOnly = new URL(request.url).searchParams.get("due") === "true";
  const now = new Date();
  const in7Days = new Date();
  in7Days.setDate(in7Days.getDate() + 7);

  const contracts = await prisma.amcContract.findMany({
    where: dueOnly
      ? { nextDueDate: { lte: in7Days } }
      : session.role === "ADMIN"
        ? {}
        : { assignedToId: session.userId },
    include: {
      property: { select: { buildingName: true, buildingAddress: true } },
      assignedTo: { select: { name: true } },
    },
    orderBy: { nextDueDate: "asc" },
  });

  return json({
    contracts: contracts.map((c) => ({
      ...c,
      overdue: c.nextDueDate < now,
    })),
  });
}
