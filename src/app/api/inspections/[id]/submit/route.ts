import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api";
import { json, error } from "@/lib/api";
import { CHECKLIST_ITEMS, type ChecklistEntry } from "@/lib/checklist";
import { validateFsrForm, parseFsrFormData } from "@/lib/fsr";
import { needsAdminApproval } from "@/lib/inspection-workflow";
import { buildInspectionPdfBuffer } from "@/lib/inspection-pdf";
import { generateReportNo } from "@/lib/report-number";

async function writeInspectionPdf(id: string) {
  const pdfBuffer = await buildInspectionPdfBuffer(id);
  const reportsDir = path.join(process.cwd(), "public", "reports");
  await mkdir(reportsDir, { recursive: true });
  const pdfPath = `/reports/${id}.pdf`;
  await writeFile(
    path.join(process.cwd(), "public", "reports", `${id}.pdf`),
    pdfBuffer
  );
  return pdfPath;
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (session instanceof Response) return session;
  const { id } = await params;

  const inspection = await prisma.inspection.findUnique({
    where: { id },
    include: { formTemplate: true },
  });
  if (!inspection) return error("Not found", 404);

  if (
    session.role !== "ADMIN" &&
    inspection.assignedToId !== session.userId &&
    inspection.createdById !== session.userId
  ) {
    return error("Forbidden", 403);
  }

  if (!["IN_PROGRESS", "REJECTED", "DRAFT", "ASSIGNED"].includes(inspection.status)) {
    return error("This inspection cannot be submitted");
  }

  const isFsr = inspection.formTemplate?.formKind === "FSR";

  if (isFsr) {
    const fsrError = validateFsrForm(parseFsrFormData(inspection.formDataJson));
    if (fsrError) return error(fsrError);
    if (!inspection.buildingName?.trim()) {
      return error("Customer name is required");
    }
    if (!inspection.signatureData) {
      return error("Service representative signature is required");
    }
  } else {
    const checklist = JSON.parse(
      inspection.checklistJson || "[]"
    ) as ChecklistEntry[];

    if (checklist.length < CHECKLIST_ITEMS.length) {
      return error("Please complete all checklist items before submitting");
    }

    if (
      inspection.satisfactory === null ||
      inspection.satisfactory === undefined
    ) {
      return error("Please mark inspection as satisfactory or not");
    }

    if (inspection.satisfactory === false && !inspection.failureReason) {
      return error("Please provide reason for unsatisfactory inspection");
    }
  }

  let reportNo = inspection.reportNo;
  if (!reportNo) {
    reportNo = await generateReportNo(inspection.formTemplate?.formKind ?? null);
    await prisma.inspection.update({
      where: { id },
      data: { reportNo },
    });
  }

  const pdfPath = await writeInspectionPdf(id);
  const awaitingApproval = needsAdminApproval(session.role);

  if (awaitingApproval) {
    const updated = await prisma.inspection.update({
      where: { id },
      data: {
        status: "PENDING_APPROVAL",
        submittedAt: new Date(),
        pdfPath,
        reportNo,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        action: "SUBMIT_PENDING",
        entityType: "Inspection",
        entityId: id,
        metaJson: JSON.stringify({ pdfPath }),
      },
    });

    return json({
      inspection: updated,
      pendingApproval: true,
      pdfUrl: pdfPath,
      message: "Submitted for admin approval. PDF is ready to download.",
    });
  }

  const updated = await prisma.inspection.update({
    where: { id },
    data: {
      status: "COMPLETED",
      submittedAt: new Date(),
      pdfPath,
      reportNo,
      approvalDate: inspection.approvalDate || new Date(),
      reviewedById: session.userId,
      reviewedAt: new Date(),
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.userId,
      action: "SUBMIT",
      entityType: "Inspection",
      entityId: id,
      metaJson: JSON.stringify({ pdfPath }),
    },
  });

  return json({
    inspection: updated,
    pdfUrl: pdfPath,
    whatsappShareUrl: buildWhatsAppUrl(inspection.buildingName, pdfPath),
  });
}

function buildWhatsAppUrl(buildingName: string, pdfPath: string) {
  const base =
    typeof process.env.NEXT_PUBLIC_APP_URL === "string"
      ? process.env.NEXT_PUBLIC_APP_URL
      : "http://localhost:3000";
  const text = encodeURIComponent(
    `NS Power Solution — Inspection Report for ${buildingName}\n${base}${pdfPath}`
  );
  return `https://wa.me/?text=${text}`;
}
