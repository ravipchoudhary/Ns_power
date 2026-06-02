import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { requireAdmin, json, error } from "@/lib/api";
import { buildInspectionPdfBuffer } from "@/lib/inspection-pdf";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (session instanceof Response) return session;
  const { id } = await params;

  const inspection = await prisma.inspection.findUnique({ where: { id } });
  if (!inspection) return error("Not found", 404);
  if (inspection.status !== "PENDING_APPROVAL") {
    return error("Only pending inspections can be approved");
  }

  const pdfBuffer = await buildInspectionPdfBuffer(id);

  const reportsDir = path.join(process.cwd(), "public", "reports");
  await mkdir(reportsDir, { recursive: true });
  const pdfPath = `/reports/${id}.pdf`;
  await writeFile(
    path.join(process.cwd(), "public", "reports", `${id}.pdf`),
    pdfBuffer
  );

  const updated = await prisma.inspection.update({
    where: { id },
    data: {
      status: "COMPLETED",
      pdfPath,
      reviewedById: session.userId,
      reviewedAt: new Date(),
      adminNotes: null,
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.userId,
      action: "APPROVE",
      entityType: "Inspection",
      entityId: id,
    },
  });

  return json({ inspection: updated, pdfUrl: pdfPath });
}
