import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api";
import { buildInspectionPdfBuffer } from "@/lib/inspection-pdf";
import { error, json } from "@/lib/api";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (session instanceof Response) return session;

  const { id } = await params;

  const inspection = await prisma.inspection.findUnique({
    where: { id },
    select: {
      id: true,
      buildingName: true,
      status: true,
      assignedToId: true,
      createdById: true,
    },
  });

  if (!inspection) return error("Not found", 404);

  const allowed =
    session.role === "ADMIN" ||
    inspection.assignedToId === session.userId ||
    inspection.createdById === session.userId;
  if (!allowed) return error("Forbidden", 403);

  try {
    const pdfBuffer = await buildInspectionPdfBuffer(id);
    const fileName = `${id}.pdf`;
    const body = new Uint8Array(pdfBuffer);
    return new Response(body, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Failed to generate PDF",
      500
    );
  }
}

