import { unlink } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api";
import { json, error } from "@/lib/api";

async function canAccess(
  inspectionId: string,
  userId: string,
  role: string
) {
  const inspection = await prisma.inspection.findUnique({
    where: { id: inspectionId },
  });
  if (!inspection) return { inspection: null, allowed: false };
  const allowed =
    role === "ADMIN" ||
    inspection.assignedToId === userId ||
    inspection.createdById === userId;
  return { inspection, allowed };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (session instanceof Response) return session;
  const { id } = await params;

  const { inspection, allowed } = await canAccess(
    id,
    session.userId,
    session.role
  );
  if (!inspection) return error("Not found", 404);
  if (!allowed) return error("Forbidden", 403);

  const full = await prisma.inspection.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { sortOrder: "asc" } },
      assignedTo: { select: { id: true, name: true, email: true } },
      formTemplate: true,
      property: true,
    },
  });

  return json({
    inspection: {
      ...full,
      feeding: JSON.parse(full?.feedingJson || "{}"),
      checklist: JSON.parse(full?.checklistJson || "[]"),
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (session instanceof Response) return session;
  const { id } = await params;
  const body = await request.json();

  const { inspection, allowed } = await canAccess(
    id,
    session.userId,
    session.role
  );
  if (!inspection) return error("Not found", 404);
  if (!allowed) return error("Forbidden", 403);

  const updated = await prisma.inspection.update({
    where: { id },
    data: {
      status: body.status,
      assignedToId: session.role === "ADMIN" ? body.assignedToId : undefined,
      buildingName: body.buildingName,
      buildingAddress: body.buildingAddress,
      contactPerson: body.contactPerson,
      contactAddress: body.contactAddress,
      phone: body.phone,
      fax: body.fax,
      email: body.email,
      buildingType: body.buildingType,
      inspectionDate: body.inspectionDate
        ? new Date(body.inspectionDate)
        : undefined,
      lastInspectionDate: body.lastInspectionDate
        ? new Date(body.lastInspectionDate)
        : body.lastInspectionDate === null
          ? null
          : undefined,
      pumpMake: body.pumpMake,
      driveType: body.driveType,
      modelNo: body.modelNo,
      gpm: body.gpm,
      psi: body.psi,
      rpm: body.rpm,
      feedingJson: body.feeding ? JSON.stringify(body.feeding) : undefined,
      checklistJson: body.checklist
        ? JSON.stringify(body.checklist)
        : undefined,
      satisfactory: body.satisfactory,
      failureReason: body.failureReason,
      notes: body.notes,
      inspectorName: body.inspectorName,
      approvalDate: body.approvalDate
        ? new Date(body.approvalDate)
        : undefined,
      signatureData: body.signatureData,
      customerSignatureData: body.customerSignatureData,
      formDataJson: body.formData
        ? JSON.stringify(body.formData)
        : undefined,
      propertyId: body.propertyId,
    },
  });

  return json({
    inspection: {
      ...updated,
      feeding: JSON.parse(updated.feedingJson),
      checklist: JSON.parse(updated.checklistJson),
    },
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (session instanceof Response) return session;
  if (session.role !== "ADMIN") return error("Forbidden", 403);
  const { id } = await params;

  const inspection = await prisma.inspection.findUnique({
    where: { id },
    include: { photos: true },
  });
  if (!inspection) return error("Not found", 404);

  for (const photo of inspection.photos) {
    try {
      if (photo.url.startsWith("data:image")) continue;
      if (!photo.url.startsWith("/uploads/")) continue;
      await unlink(path.join(process.cwd(), "public", photo.url.replace(/^\//, "")));
    } catch {
      // File may already be missing on disk
    }
  }

  if (inspection.pdfPath) {
    try {
      // pdfPath might now be an API URL (/api/inspections/[id]/pdf) — do not unlink.
      if (inspection.pdfPath.startsWith("/reports/")) {
        await unlink(
          path.join(process.cwd(), "public", inspection.pdfPath.replace(/^\//, ""))
        );
      }
    } catch {
      // PDF file may already be missing on disk
    }
  }

  await prisma.inspection.delete({ where: { id } });

  await prisma.activityLog.create({
    data: {
      userId: session.userId,
      action: "DELETE",
      entityType: "Inspection",
      entityId: id,
    },
  });

  return json({ ok: true });
}
