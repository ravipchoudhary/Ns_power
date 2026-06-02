import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { InspectionForm } from "@/components/InspectionForm";
import { FsrForm } from "@/components/FsrForm";
import { AdminApprovalBar } from "@/components/AdminApprovalBar";
import { DeleteInspectionButton } from "@/components/DeleteInspectionButton";
import { Badge } from "@/components/ui";
import { statusLabel, statusTone } from "@/lib/utils";
import { inspectorCanEdit } from "@/lib/inspection-workflow";
import { mergeFeedingOptions, normalizeChecklist } from "@/lib/checklist";
import { generateReportNo } from "@/lib/report-number";

export default async function InspectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;

  const inspection = await prisma.inspection.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { sortOrder: "asc" } },
      formTemplate: true,
    },
  });

  if (!inspection) notFound();

  const allowed =
    session.role === "ADMIN" ||
    inspection.assignedToId === session.userId ||
    inspection.createdById === session.userId;

  if (!allowed) notFound();

  let reportNo = inspection.reportNo;
  if (!reportNo) {
    reportNo = await generateReportNo(inspection.formTemplate?.formKind ?? null);
    await prisma.inspection.update({
      where: { id },
      data: {
        reportNo,
        formDataJson: JSON.stringify({
          ...JSON.parse(inspection.formDataJson || "{}"),
          reportNo,
        }),
      },
    });
  }

  const readOnly = !inspectorCanEdit(inspection.status);
  const isFsr = inspection.formTemplate?.formKind === "FSR";
  const title = isFsr
    ? inspection.buildingName || "Field Service Report"
    : inspection.buildingName;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {inspection.formTemplate && (
            <p className="text-sm text-gray-500">
              {inspection.formTemplate.name}
            </p>
          )}
        </div>
        <Badge tone={statusTone(inspection.status)}>
          {statusLabel(inspection.status)}
        </Badge>
        {session.role === "ADMIN" && (
          <DeleteInspectionButton inspectionId={inspection.id} />
        )}
      </div>

      {session.role === "ADMIN" &&
        inspection.status === "PENDING_APPROVAL" && (
          <AdminApprovalBar inspectionId={inspection.id} />
        )}

      {isFsr ? (
        <FsrForm
          userRole={session.role}
          readOnly={readOnly}
          initial={{
            id: inspection.id,
            reportNo: reportNo ?? undefined,
            status: inspection.status,
            buildingName: inspection.buildingName,
            buildingAddress: inspection.buildingAddress,
            contactPerson: inspection.contactPerson ?? undefined,
            phone: inspection.phone ?? undefined,
            email: inspection.email ?? undefined,
            inspectionDate: inspection.inspectionDate?.toISOString(),
            inspectorName: inspection.inspectorName ?? session.name,
            signatureData: inspection.signatureData ?? undefined,
            customerSignatureData:
              inspection.customerSignatureData ?? undefined,
            formDataJson: inspection.formDataJson,
            photos: inspection.photos,
            pdfPath: inspection.pdfPath ?? undefined,
            adminNotes: inspection.adminNotes ?? undefined,
          }}
        />
      ) : (
        <InspectionForm
          readOnly={readOnly}
          userRole={session.role}
          formTemplateId={inspection.formTemplateId ?? undefined}
          initial={{
            id: inspection.id,
            reportNo: reportNo ?? undefined,
            status: inspection.status,
            buildingName: inspection.buildingName,
            buildingAddress: inspection.buildingAddress,
            contactPerson: inspection.contactPerson ?? undefined,
            contactAddress: inspection.contactAddress ?? undefined,
            phone: inspection.phone ?? undefined,
            fax: inspection.fax ?? undefined,
            email: inspection.email ?? undefined,
            buildingType: inspection.buildingType ?? undefined,
            inspectionDate: inspection.inspectionDate?.toISOString(),
            lastInspectionDate: inspection.lastInspectionDate?.toISOString(),
            pumpMake: inspection.pumpMake ?? undefined,
            driveType: inspection.driveType ?? undefined,
            modelNo: inspection.modelNo ?? undefined,
            gpm: inspection.gpm ?? undefined,
            psi: inspection.psi ?? undefined,
            rpm: inspection.rpm ?? undefined,
            feeding: mergeFeedingOptions(
              JSON.parse(inspection.feedingJson || "{}")
            ),
            checklist: normalizeChecklist(
              JSON.parse(inspection.checklistJson || "[]")
            ),
            satisfactory: inspection.satisfactory,
            failureReason: inspection.failureReason ?? undefined,
            notes: inspection.notes ?? undefined,
            inspectorName: inspection.inspectorName ?? undefined,
            approvalDate: inspection.approvalDate?.toISOString(),
            signatureData: inspection.signatureData ?? undefined,
            photos: inspection.photos,
            pdfPath: inspection.pdfPath ?? undefined,
            adminNotes: inspection.adminNotes ?? undefined,
          }}
        />
      )}
    </div>
  );
}
