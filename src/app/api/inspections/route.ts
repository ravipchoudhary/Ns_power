import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api";
import { json, error } from "@/lib/api";
import { generateReportNo } from "@/lib/report-number";
import type { Prisma } from "@/generated/prisma/client";

export async function GET(request: Request) {
  const session = await requireAuth();
  if (session instanceof Response) return session;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const inspectorId = searchParams.get("inspectorId");
  const satisfactory = searchParams.get("satisfactory");

  const where: Prisma.InspectionWhereInput = {};

  if (session.role !== "ADMIN") {
    where.OR = [
      { assignedToId: session.userId },
      { createdById: session.userId },
    ];
  } else if (inspectorId) {
    where.assignedToId = inspectorId;
  }

  if (status) where.status = status as Prisma.InspectionWhereInput["status"];
  if (from || to) {
    where.inspectionDate = {};
    if (from) where.inspectionDate.gte = new Date(from);
    if (to) where.inspectionDate.lte = new Date(to);
  }
  if (satisfactory === "yes") {
    where.satisfactory = true;
  } else if (satisfactory === "no") {
    where.satisfactory = false;
  }
  if (q) {
    where.OR = [
      ...(Array.isArray(where.OR) ? where.OR : where.OR ? [where.OR] : []),
      { buildingName: { contains: q } },
      { buildingAddress: { contains: q } },
      { contactPerson: { contains: q } },
      { inspectorName: { contains: q } },
    ];
  }

  const inspections = await prisma.inspection.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      assignedTo: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      formTemplate: { select: { id: true, name: true, formKind: true } },
      _count: { select: { photos: true } },
    },
  });

  return json({ inspections });
}

export async function POST(request: Request) {
  const session = await requireAuth();
  if (session instanceof Response) return session;

  const body = await request.json();

  if (!body.formTemplateId) {
    return error("Form category is required");
  }

  const template = await prisma.formTemplate.findFirst({
    where: { id: body.formTemplateId, active: true },
  });
  if (!template) return error("Invalid form category", 400);

  const reportNo = await generateReportNo(template.formKind);
  const formData = {
    ...(typeof body.formData === "object" && body.formData !== null
      ? body.formData
      : {}),
    reportNo,
  };

  const inspection = await prisma.inspection.create({
    data: {
      reportNo,
      createdById: session.userId,
      assignedToId: body.assignedToId || session.userId,
      formTemplateId: template.id,
      formDataJson: JSON.stringify(formData),
      status: body.status || "DRAFT",
      buildingName: body.buildingName || "Untitled",
      buildingAddress: body.buildingAddress || "",
      contactPerson: body.contactPerson,
      contactAddress: body.contactAddress,
      phone: body.phone,
      fax: body.fax,
      email: body.email,
      buildingType: body.buildingType,
      inspectionDate: body.inspectionDate
        ? new Date(body.inspectionDate)
        : new Date(),
      lastInspectionDate: body.lastInspectionDate
        ? new Date(body.lastInspectionDate)
        : null,
      pumpMake: body.pumpMake,
      driveType: body.driveType,
      modelNo: body.modelNo,
      gpm: body.gpm,
      psi: body.psi,
      rpm: body.rpm,
      feedingJson: JSON.stringify(body.feeding || {}),
      checklistJson: JSON.stringify(body.checklist || []),
      satisfactory: body.satisfactory,
      failureReason: body.failureReason,
      notes: body.notes,
      inspectorName: body.inspectorName || session.name,
      approvalDate: body.approvalDate ? new Date(body.approvalDate) : null,
      signatureData: body.signatureData,
      propertyId: body.propertyId,
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.userId,
      action: "CREATE",
      entityType: "Inspection",
      entityId: inspection.id,
    },
  });

  return json({ inspection }, 201);
}
