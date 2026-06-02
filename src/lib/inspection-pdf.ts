import { prisma } from "@/lib/db";
import { generateInspectionPdf } from "@/lib/pdf";
import { generateFsrPdf } from "@/lib/pdf-fsr";
import type { ChecklistEntry, FeedingOptions } from "@/lib/checklist";

export async function buildInspectionPdfBuffer(inspectionId: string) {
  const inspection = await prisma.inspection.findUnique({
    where: { id: inspectionId },
    include: {
      formTemplate: true,
      photos: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!inspection) {
    throw new Error("Inspection not found");
  }

  const photos = inspection.photos.map((p) => ({
    url: p.url,
    tag: p.tag,
  }));

  if (inspection.formTemplate?.formKind === "FSR") {
    return generateFsrPdf(
      {
        id: inspection.id,
        reportNo: inspection.reportNo,
        inspectionDate: inspection.inspectionDate,
        buildingName: inspection.buildingName,
        buildingAddress: inspection.buildingAddress,
        contactPerson: inspection.contactPerson,
        phone: inspection.phone,
        email: inspection.email,
        inspectorName: inspection.inspectorName,
        signatureData: inspection.signatureData,
        customerSignatureData: inspection.customerSignatureData,
        formDataJson: inspection.formDataJson,
      },
      photos
    );
  }

  return generateInspectionPdf(
    {
      id: inspection.id,
      reportNo: inspection.reportNo,
      inspectionDate: inspection.inspectionDate,
      lastInspectionDate: inspection.lastInspectionDate,
      buildingName: inspection.buildingName,
      buildingAddress: inspection.buildingAddress,
      contactPerson: inspection.contactPerson,
      contactAddress: inspection.contactAddress,
      phone: inspection.phone,
      fax: inspection.fax,
      email: inspection.email,
      buildingType: inspection.buildingType,
      pumpMake: inspection.pumpMake,
      driveType: inspection.driveType,
      modelNo: inspection.modelNo,
      gpm: inspection.gpm,
      psi: inspection.psi,
      rpm: inspection.rpm,
      feeding: JSON.parse(inspection.feedingJson || "{}") as FeedingOptions,
      checklist: JSON.parse(
        inspection.checklistJson || "[]"
      ) as ChecklistEntry[],
      satisfactory: inspection.satisfactory,
      failureReason: inspection.failureReason,
      notes: inspection.notes,
      inspectorName: inspection.inspectorName,
      approvalDate: inspection.approvalDate,
      signatureData: inspection.signatureData,
    },
    photos
  );
}
