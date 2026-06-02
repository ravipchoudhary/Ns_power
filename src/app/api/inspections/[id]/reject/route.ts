import { prisma } from "@/lib/db";
import { requireAdmin, json, error } from "@/lib/api";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (session instanceof Response) return session;
  const { id } = await params;
  const body = await request.json();
  const adminNotes = (body.adminNotes as string)?.trim();

  if (!adminNotes) {
    return error("Please provide a reason for rejection");
  }

  const inspection = await prisma.inspection.findUnique({ where: { id } });
  if (!inspection) return error("Not found", 404);
  if (inspection.status !== "PENDING_APPROVAL") {
    return error("Only pending inspections can be rejected");
  }

  const updated = await prisma.inspection.update({
    where: { id },
    data: {
      status: "REJECTED",
      adminNotes,
      reviewedById: session.userId,
      reviewedAt: new Date(),
      pdfPath: null,
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.userId,
      action: "REJECT",
      entityType: "Inspection",
      entityId: id,
      metaJson: JSON.stringify({ adminNotes }),
    },
  });

  return json({ inspection: updated });
}
